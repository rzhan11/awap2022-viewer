"use strict";

function updateTooltip(e) {
  var pointer = e.absolutePointer;

  var adjust = outerPadding - innerPadding / 2;
  // order is supposed to be 'swapped'
  var ty = Math.floor( (pointer.x - adjust) / fullTileSize );
  var tx = Math.floor( (pointer.y - adjust) / fullTileSize );

  tooltipObject.left = (ty + 0.5) * fullTileSize + adjust;
  tooltipObject.top = (tx + 0.5) * fullTileSize + adjust;

  displayTooltipInfo(tx, ty);

  frontCanvas.requestRenderAll();
}

function initCanvas(canvasID) {
  var canvas = new fabric.Canvas(canvasID, {
    renderOnAddRemove: false,
    selection: false
  });

  canvas.setWidth(window.innerWidth)
  canvas.setHeight(window.innerHeight)

  return canvas;
}

function syncCanvasMotion() {
  // enable zoom
  frontCanvas.on('mouse:wheel', function(opt) {
    var delta = opt.e.deltaY;
    var zoom = this.getZoom();
    zoom *= 0.999 ** delta;
    if (zoom > maxZoom) zoom = maxZoom;
    if (zoom < minZoom) zoom = minZoom;

    for (var canvas of allCanvases) {
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
      canvas.requestRenderAll();
    }

    opt.e.preventDefault();
    opt.e.stopPropagation();
  });

  // enable pan
  frontCanvas.on('mouse:down', function(opt) {
    var evt = opt.e;
    this.isDragging = true;
    this.selection = false;
    this.lastPosX = evt.clientX;
    this.lastPosY = evt.clientY;
  });
  frontCanvas.on('mouse:move', function(opt) {
    if (this.isDragging) {
      var e = opt.e;
      for (var canvas of allCanvases) {
        var vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        canvas.requestRenderAll();
      }
      this.lastPosX = e.clientX;
      this.lastPosY = e.clientY;
    }
  });
  frontCanvas.on('mouse:up', function(opt) {
    // on mouse up we want to recalculate new interaction
    // for all objects, so we call setViewportTransform
    for (var canvas of allCanvases) {
      canvas.setViewportTransform(canvas.viewportTransform);
    }
    this.isDragging = false;
    this.selection = true;
  });

  // tooltip
  frontCanvas.on('mouse:move', function(e) {
    if (tooltipObject != null) {
      updateTooltip(e);
    }
  });
}

const passCanvas = initCanvas("pass-canvas");
const iconCanvas = initCanvas("icon-canvas");
const shadeCanvas = initCanvas("shade-canvas");
const popCanvas = initCanvas("pop-canvas");
const tooltipCanvas = initCanvas("tooltip-canvas");

var allCanvases = [passCanvas, iconCanvas, shadeCanvas, popCanvas, tooltipCanvas];
var frontCanvas = tooltipCanvas;

syncCanvasMotion();


function clearFrame() {
  for (var canvas of allCanvases) {
    canvas.clear();
  }
}

function renderFrame() {
  for (var canvas of allCanvases) {
    canvas.requestRenderAll();
  }

  if (curTooltipPos != null) {
    displayTooltipInfo(curTooltipPos[0], curTooltipPos[1]);
  }
}

var passGrid;
var popGrid;
var iconGrid;
var shadeGrid;
var tooltipObject;
var towerCoverObject;

function tile2Pixels(tx, ty) {
  var px = outerPadding + tx * innerPadding + (tx + 0.5) * tileSize;
  var py = outerPadding + ty * innerPadding + (ty + 0.5) * tileSize;
  return [px, py];
}

function initCanvasObjects() {
  passGrid = init2DArray(frameWidth, frameHeight);
  popGrid = init2DArray(frameWidth, frameHeight);
  iconGrid = init2DArray(frameWidth, frameHeight);
  shadeGrid = init2DArray(frameWidth, frameHeight);


  // tiles
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      var x = outerPadding + i * innerPadding + (i + 0.5) * tileSize;
      var y = outerPadding + j * innerPadding + (j + 0.5) * tileSize;

      var color = getPassColor(passMap[i][j]);
      passGrid[i][j] = drawRect(x, y, tileSize, tileSize, color);
    }
  }

  var mapPixelSize = 2 * outerPadding + (frameWidth - 1) * innerPadding + frameWidth * tileSize;
  var baseObject = drawRect(mapPixelSize / 2, mapPixelSize / 2, mapPixelSize, mapPixelSize, DARK_GRAY);
  var baseObject2 = drawRect(mapPixelSize / 2, mapPixelSize / 2, mapPixelSize - 2 * outerPadding, mapPixelSize - 2 * outerPadding, WHITE);
  var tileObjects = passGrid.flat();
  tileObjects = [baseObject, baseObject2].concat(tileObjects);
  var tileGroup = new fabric.Group(tileObjects, {"selectable": false});
  passCanvas.setBackgroundImage(tileGroup);
  // end of tiles

  // icons
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      var p = tile2Pixels(i, j);
      iconGrid[i][j] = drawText("", p[0], p[1], 15, BLACK);
      iconGrid[i][j].set("visible", false);
    }
  }

  var iconObjects = iconGrid.flat();
  var iconGroup = new fabric.Group(iconObjects, {"selectable": false});
  iconCanvas.add(iconGroup);
  // end of icons

  // population
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      var p = tile2Pixels(i, j);

      var radius = popMap[i][j] * tileSize / 40;
      popGrid[i][j] = drawCircle(p[0], p[1], radius, GREEN);
    }
  }

  var popObjects = popGrid.flat();
  var popGroup = new fabric.Group(popObjects, {"selectable": false});
  popCanvas.setBackgroundImage(popGroup);
  // end of population


  // shades
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      var p = tile2Pixels(i, j);
      shadeGrid[i][j] = drawBox(p[0], p[1], shadeTileSize, shadeTileSize, BLACK, shadeEdgeWidth, shadeOpacity);
      shadeGrid[i][j].set("visible", false);
    }
  }

  var shadeObjects = shadeGrid.flat();
  var shadeGroup = new fabric.Group(shadeObjects, {selectable: false});
  shadeCanvas.add(shadeGroup);
  // end of shade

  // tower cover
  var towerCoverGrid = [];
  var towerR2 = 25;
  var maxDiff = Math.floor(Math.sqrt(towerR2));
  for (var dx = -maxDiff; dx <= maxDiff; dx++) {
    for (var dy = -maxDiff; dy <= maxDiff; dy++) {
      var r2 = dx * dx + dy * dy;
      if (r2 <= towerR2) {
        var x = dx * fullTileSize;
        var y = dy * fullTileSize;
        var rect = drawRect(x, y, fullTileSize, fullTileSize, MEDIUM_GRAY, 0.5);
        towerCoverGrid.push(rect);
      }
    }
  }
  // towerCoverObject = new fabric.Group(towerCoverGrid);
  towerCoverObject = new fabric.Group(towerCoverGrid, {left: 0, top: 0, originX: "center", originY: "center", selectable: false});
  towerCoverObject.set("visible", false);
  tooltipCanvas.add(towerCoverObject);
  // end of tower cover

  // tooltip
  tooltipObject = drawBox(0, 0, tooltipSize, tooltipSize, BLACK, shadeEdgeWidth);
  tooltipObject.set("selectable", false)
  tooltipObject.set("visible", false)
  tooltipCanvas.add(tooltipObject);
  // end of tooltip

  renderFrame();
}


function resetInitFrame() {
  console.log("draw init frame")

  roundNum = 0;
  curFrame = JSON.parse(JSON.stringify(baseFrame));

  // iterate through each tile and add icon/symbol for units
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      if (curFrame[i][j] !== null) {
        setIcon(i, j, curFrame[i][j]);
      } else {
        iconGrid[i][j].set("visible", false);
        shadeGrid[i][j].set("visible", false)
      }
    }
  }
}

function getPassColor(passability) {
  var relPass = (passability - minPass) / (maxPass - minPass);
  if (relPass <= 0.05) {
    relPass = 0.05;
  }
  if (relPass == 1) {
    relPass -= 0.00001;
  }


  var colorIndex = Math.floor(relPass * (colorGrad.length - 1));
  var colorWeight = relPass * (colorGrad.length - 1) - colorIndex;

  var color1 = colorGrad[colorIndex];
  var color2 = colorGrad[colorIndex + 1];

  var color = [0, 0, 0];
  for (var i = 0; i < color.length; i++) {
    color[i] = color1[i] * (1 - colorWeight) + color2[i] * colorWeight;
  }

  // console.log(colorIndex, colorWeight, color)

  return rgb(color[0], color[1], color[2]);
}

function getUnitInfo(team_id, struct_id) {
  return { type: structID2Name[struct_id], team: team2Text[team_id], color: team2Color[team_id], team_id: team_id }
}

function setIcon(i, j, unit) {
  var textSymbol = unit.type[0];
  if (textSymbol == "R") {
    textSymbol = ".";
  }

  iconGrid[i][j].set("fill", unit.color);
  iconGrid[i][j].set("text", textSymbol);
  iconGrid[i][j].set("visible", true)

  shadeGrid[i][j].set("stroke", unit.color)
  shadeGrid[i][j].set("visible", true)
}

// base data from
var baseFrame;
var frameChanges;

var popMap;
var passMap;
var structureMap;

var moneyHistory;
var utilityHistory;

var metadata = {};

var structName2ID = {};
var structID2Name = {};
var loadedFrames = false;
var frameWidth;
var frameHeight;
var numFrameChanges;

var roundNum;
var curFrame;

var unitCounts;
var unitNames = [];

fileInput.addEventListener("change", uploadReplay, false);
function uploadReplay(event) {
  clearFrame();
  loadedFrames = false;
  if (event.target.files.length > 0) {
    var reader = new FileReader();
    reader.onload = function(event) {
      // do stuff here
      loadData(event.target.result);
    }
    reader.readAsText(event.target.files[0]);
  }
}

function loadData(data) {
  console.log("Loading data...")

  var obj = JSON.parse(data);
  console.log(obj);

  metadata = obj["metadata"];

  frameChanges = obj["frame_changes"];

  moneyHistory = obj["money_history"];
  utilityHistory = obj["utility_history"];

  structName2ID = {};
  structID2Name = {};
  for (var vals of obj["structure_type_ids"]) {
    structID2Name[vals[0]] = vals[1];
    structName2ID[vals[1]] = vals[0];
    unitNames.push(vals[1]);
  }

  // load game frames
  numFrameChanges = metadata["num_frames"];


  var mapData = obj["map"];
  frameWidth = mapData.length;
  frameHeight = mapData[0].length;

  passMap = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      passMap[i][j] = mapData[i][j][0];
    }
  }

  popMap = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      popMap[i][j] = mapData[i][j][1];
    }
  }

  structureMap = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      structureMap[i][j] = mapData[i][j][2];
    }
  }

  var generatorData = obj["generators"];
  curFrame = init2DArray(frameWidth, frameHeight);
  for (var t = 0; t < generatorData.length; t++) {
    for (var el of generatorData[t]) {
      curFrame[el[0]][el[1]] = getUnitInfo(t, structName2ID["Generator"]);
    }
  }

  baseFrame = JSON.parse(JSON.stringify(curFrame));
  roundNum = 0;

  console.log("Read " + numFrameChanges + " frames");

  loadedFrames = true;
  metadata.maxRound = numFrameChanges;
  // set up range slider
  frameRange.max = metadata.maxRound;
  frameRange.oninput = function() {
    setRoundNum(parseInt(this.value))
  }

  // load unit stats
  calculateUnitStats();

  // update screen
  displayMetadata();
  initCanvasObjects();

  resetInitFrame();
  setRoundNum(0);
}

function calculateUnitStats() {
  unitCounts = [];
  var curUnitCount = [];
  for (var i = 0; i < 2; i++) {
    curUnitCount.push({});
    for (var unit of unitNames) {
      curUnitCount[i][unit] = 0;
    }
  }
  // count baseFrame units
  for (var x = 0; x < frameWidth; x++) {
    for (var y = 0; y < frameHeight; y++) {
      var unit = baseFrame[x][y];
      if (unit != null) {
        curUnitCount[unit.team_id][unit.type] += 1;
      }
    }
  }

  unitCounts.push(JSON.parse(JSON.stringify(curUnitCount)));

  for (var fnum = 0; fnum < numFrameChanges; fnum++) {
    for (var structure of frameChanges[fnum]) {
      var [x, y, team_id, type_id] = structure;
      var unit = getUnitInfo(team_id, type_id);
      curUnitCount[team_id][unit.type] += 1;
    }
    unitCounts.push(JSON.parse(JSON.stringify(curUnitCount)));
  }
  // console.log(unitCounts)
}

function displayMetadata() {
  metadataText.innerHTML = "Team RED: " + metadata.p1_name + "<br>";
  metadataText.innerHTML += "Team BLUE: " + metadata.p2_name + "<br>";
  metadataText.innerHTML += "Engine Version: " + metadata.version;
};

prevRoundButton.onclick = prevRound;
nextRoundButton.onclick = nextRound;

slowerSpeedButton.onclick = decreaseSpeed;
fasterSpeedButton.onclick = increaseSpeed;

playButton.onclick = changePlay;

function prevRound() {
  if (loadedFrames) {
    if (roundNum > 0) {
      setRoundNum(roundNum - 1);
    }
  }
}

function nextRound() {
  if (loadedFrames) {
    if (roundNum < metadata.maxRound) {
      setRoundNum(roundNum + 1);
    }
  }
}

function getNewFrame(targetRound, oldRoundNum) {
  for (var fnum = oldRoundNum; fnum < targetRound; fnum++) {
    for (var structure of frameChanges[fnum]) {
      var [x, y, team_id, type_id] = structure;
      curFrame[x][y] = getUnitInfo(team_id, type_id);

      setIcon(x, y, curFrame[x][y]);
    }
  }

  renderFrame();
}

function setRoundNum(num) {

  // reset curFrame if we are going backwards
  if (roundNum > num) {
    resetInitFrame();
  }

  var oldRoundNum = roundNum;
  roundNum = num;
  roundText.innerHTML = roundNum + " / " + metadata.maxRound;
  frameRange.value = roundNum;


  // calculate frame
  getNewFrame(roundNum, oldRoundNum);

  displayMetadata();

  displayGameInfo();
}

/*
Updates visual menu box of game stats
- money, utility, number of units
*/
function displayGameInfo() {

  // display game info text
  for (var t = 0; t < 2; t++) {
    // update charts
    moneyChart.data.datasets[0].data[t] = moneyHistory[roundNum][t]
    moneyChart.update()
    utilityChart.data.datasets[0].data[t] = utilityHistory[roundNum][t]
    utilityChart.update()

    unitDivs[t].innerHTML = "";
    unitDivs[t].style.color = team2Color[t];
    for (var unit in unitCounts[roundNum][t]) {
      var count = unitCounts[roundNum][t][unit];
      unitDivs[t].innerHTML += `
      <div class="col">
        ${unit[0]}: ${count}
      </div>
      `;
    }
  }

}

var curTooltipPos;
function displayTooltipInfo(x, y) {
  if (curTooltipPos != null && curTooltipPos[0] == x && curTooltipPos[1] == y) {
    return;
  }

  towerCoverObject.set("visible", false);

  if ( !(0 <= x && x < frameWidth && 0 <= y && y < frameHeight) ) {
    clearTooltipInfo();
    return;
  }

  tooltipObject.set("visible", true);

  curTooltipPos = [x, y];

  tooltipPosText.innerHTML = [x, y];
  tooltipPassText.innerHTML = passMap[x][y];
  tooltipPopText.innerHTML = popMap[x][y];

  if (curFrame[x][y] == null) {
    tooltipStructText.innerHTML = "";
    tooltipStructText.style.color = BLACK;
  } else {
    var unit = curFrame[x][y];
    tooltipStructText.innerHTML = unit.type;
    tooltipStructText.style.color = unit.color;

    // display radius for tower
    if (unit.type == "Tower") {
      displayTowerRadius(x, y);
    }
  }
}

function displayTowerRadius(x, y) {
  towerCoverObject.set("visible", true);

  var p = tile2Pixels(x, y);
  towerCoverObject.set("left", p[1]);
  towerCoverObject.set("top", p[0]);
}

function clearTooltipInfo() {
  curTooltipPos = null;

  tooltipObject.set("visible", false);

  tooltipPosText.innerHTML = "";
  tooltipPassText.innerHTML = "";
  tooltipPopText.innerHTML = "";
  tooltipStructText.innerHTML = "";
}

function decreaseSpeed() {
  if (frameSpeed > minFrameSpeed) {
    frameSpeed /= 2;
    speedText.innerHTML = frameSpeed;
  }
}

function increaseSpeed() {
  if (frameSpeed < maxFrameSpeed) {
    frameSpeed *= 2;
    speedText.innerHTML = frameSpeed;
  }
}

function changePlay() {
  if (loadedFrames) {
    framePlaying = !framePlaying;
    if (framePlaying) {
      playButton.innerHTML = "Pause";
    } else {
      playButton.innerHTML = "Play";
    }
  }
}

document.addEventListener('keyup', (e) => {
  if (e.code === "ArrowLeft" || e.key == "a") {
    if (framePlaying) {
      changePlay();
    }
    prevRound();
  }
  if (e.code === "ArrowRight" || e.key == "d") {
    if (framePlaying) {
      changePlay();
    }
    nextRound();
  }
  if (e.code === "ArrowDown" || e.key == "s") {
    decreaseSpeed();
  }
  if (e.code === "ArrowUp" || e.key == "w") {
    increaseSpeed();
  }
  if (e.code === "Space") {
    changePlay();
  }
});

var intervalTime = 10;
var timeSinceUpdate = 0;
setInterval(function() {
  if (loadedFrames && framePlaying) {
    timeSinceUpdate += intervalTime;
    var frameChange = Math.trunc(timeSinceUpdate / (1000 / frameSpeed));
    for (var i = 0; i < frameChange; i++) {
      nextRound();
      timeSinceUpdate -= frameChange * (1000 / frameSpeed);
    }
    if (roundNum == metadata.maxRound) {
      changePlay();
      timeSinceUpdate = 0;
    }
  }
}, intervalTime);
