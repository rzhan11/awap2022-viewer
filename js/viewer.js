"use strict";

function getCanvasDim(canvasID) {
  var w = document.getElementById(canvasID).parentElement.parentElement.clientWidth;
  var h = document.getElementById(canvasID).parentElement.parentElement.clientHeight;
  return [w, h];
}

function initCanvas(canvasID) {
  var canvas = new fabric.Canvas(canvasID, {
    renderOnAddRemove: false,
    selection: false
  });

  // canvas.setWidth(w)
  var dim = getCanvasDim(canvasID);
  canvas.setWidth(dim[0])
  canvas.setHeight(dim[1])
  window.addEventListener('resize', () => {
    var dim = getCanvasDim(canvasID);
    canvas.setWidth(dim[0])
    canvas.setHeight(dim[1])
    canvas.requestRenderAll();
  })

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
const highlightCanvas = initCanvas("highlight-canvas");
const iconCanvas = initCanvas("icon-canvas");
const shadeCanvas = initCanvas("shade-canvas");
const popCanvas = initCanvas("pop-canvas");
const tooltipCanvas = initCanvas("tooltip-canvas");

var allCanvases = [passCanvas, highlightCanvas, iconCanvas, shadeCanvas, popCanvas, tooltipCanvas];
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
// var iconGrid;
var textGrid;
var shadeGrid;

// var iconGroup;
var tooltipObject;
var towerCoverObject;

function tile2Pixels(tx, ty) {
  // flip vertically
  var ty = frameHeight - 1 - ty;

  var px = outerPadding + tx * innerPadding + (tx + 0.5) * tileSize;
  var py = outerPadding + ty * innerPadding + (ty + 0.5) * tileSize;
  return [px, py];
}


function pixels2Tile(px, py) {
  var adjust = outerPadding - innerPadding / 2;
  // order is supposed to be 'swapped'
  var tx = Math.floor( (px - adjust) / fullTileSize );
  var ty = Math.floor( (py - adjust) / fullTileSize );
  // flip vertically
  var ty = frameHeight - 1 - ty;

  return [tx, ty];
}

function initCanvasObjects() {
  passGrid = init2DArray(frameWidth, frameHeight);
  popGrid = init2DArray(frameWidth, frameHeight);
  textGrid = init2DArray(frameWidth, frameHeight);
  // iconGrid = init2DArray(frameWidth, frameHeight);
  shadeGrid = init2DArray(frameWidth, frameHeight);


  // tiles
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      var p = tile2Pixels(i, j);
      var color = getPassColor(passMap[i][j]);
      passGrid[i][j] = drawRect(p[0], p[1], tileSize, tileSize, color);
    }
  }

  var mapWidthPixelSize = 2 * outerPadding + (frameWidth - 1) * innerPadding + frameWidth * tileSize;
  var mapHeightPixelSize = 2 * outerPadding + (frameHeight - 1) * innerPadding + frameHeight * tileSize;
  // baseObject0 for rendering issues, baseObject1 for gray border, baseObject2 for white grid lines
  var baseObject1 = drawRect(mapWidthPixelSize / 2, mapHeightPixelSize / 2, mapWidthPixelSize, mapHeightPixelSize, DARK_GRAY);
  var baseObject2 = drawRect(mapWidthPixelSize / 2, mapHeightPixelSize / 2, mapWidthPixelSize - 2 * outerPadding, mapHeightPixelSize - 2 * outerPadding, WHITE);
  var tileObjects = passGrid.flat();
  tileObjects = [baseObject1, baseObject2].concat(tileObjects);
  var tileGroup = new fabric.Group(tileObjects, {"selectable": false});
  passCanvas.setBackgroundImage(tileGroup);
  // end of tiles

  // shades
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      var p = tile2Pixels(i, j);
      shadeGrid[i][j] = drawBox(p[0], p[1], shadeTileSize, shadeTileSize, BLACK, shadeEdgeWidth, shadeOpacity);
      shadeGrid[i][j].set("visible", false);
    }
  }

  var shadeObjects = shadeGrid.flat();
  var shadeGroup = new fabric.Group(shadeObjects, {selectable: false});
  shadeCanvas.add(shadeGroup);
  // end of shade


  // icons
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      var p = tile2Pixels(i, j);

      textGrid[i][j] = drawText("", p[0], p[1], 15, BLACK);
      textGrid[i][j].set("visible", false);

      setIcon(i, j);
    }
  }
  // end of icons

  // population
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      var p = tile2Pixels(i, j);

      var radius = popMap[i][j] * tileSize / 40;
      popGrid[i][j] = drawCircle(p[0], p[1], radius, GREEN);
    }
  }

  var popObjects = popGrid.flat();
  var popGroup = new fabric.Group(popObjects, {"selectable": false});
  popCanvas.setBackgroundImage(popGroup);
  // end of population

  // tower cover
  var towerCoverGrid = [];
  var towerR2 = GC.TOWER_RADIUS;
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
  tooltipObject = drawBox(0, 0, tooltipSize, tooltipSize, BLACK, tooltipEdgeWidth);
  tooltipObject.set("selectable", false)
  tooltipObject.set("visible", false)
  tooltipCanvas.add(tooltipObject);
  // end of tooltip

  // set initial pan/zoom
  var zoomRatio = 0.95;
  for (var canvas of allCanvases) {
    var vpt = canvas.viewportTransform;
    // initial pan
    vpt[4] = canvas.width / 2 - mapWidthPixelSize / 2;
    vpt[5] = canvas.height / 2 - mapHeightPixelSize / 2;
    var initZoom = zoomRatio * Math.min(canvas.width / mapWidthPixelSize, canvas.height / mapHeightPixelSize);
    // initial zoom
    canvas.zoomToPoint({ x: canvas.width / 2, y: canvas.height / 2 }, initZoom);
    canvas.requestRenderAll();
  }

  renderFrame();
}


function resetInitFrame() {
  console.log("draw init frame")

  roundNum = 0;
  curFrame = JSON.parse(JSON.stringify(baseFrame));

  iconCanvas.clear();
  // iterate through each tile and add icon/symbol for units
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      setIcon(i, j);
    }
  }
}

function getPassColor(passability) {
  var relPass = (passability - GC.MIN_PASS) / (GC.MAX_PASS - GC.MIN_PASS);
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

function getUnitInfo(team_id, struct_id, spawn_round) {
  return { type: structID2Name[struct_id], team: team2Text[team_id], color: team2Color[team_id], team_id: team_id, spawn_round: spawn_round }
}

function setIcon(i, j) {
  // console.log(i, j, curFrame[i][j])
  var unit = curFrame[i][j];
  if (unit == null) {
    textGrid[i][j].set("visible", false);
    // iconGrid[i][j].set("visible", false);
    shadeGrid[i][j].set("visible", false)
  } else {
    // shades
    shadeGrid[i][j].set("stroke", unit.color)
    shadeGrid[i][j].set("visible", true)

    // icon
    var textSymbol = unit.type[0];
    if (unit.type == "Road") {
      textSymbol = ".";
      // show text
      textGrid[i][j].set("fill", unit.color);
      textGrid[i][j].set("text", textSymbol);
      textGrid[i][j].set("visible", true);
      iconCanvas.add(textGrid[i][j]);
    } else {
      setIconImage(i, j);
    }

  }

  // iconGrid[i][j].set("visible", true)
}

function highlightNewSpawns(targetRound) {
  highlightCanvas.clear();
  if (targetRound == 0) {
    return;
  }
  for (var structure of frameChanges[targetRound - 1]) {
    var [x, y, team_id, type_id] = structure;
    var unit = getUnitInfo(team_id, type_id, targetRound);
    var p = tile2Pixels(x, y);
    var r = drawRect(p[0], p[1], highlightTileSize, highlightTileSize, unit.color, highlightOpacity);
    highlightCanvas.add(r);
  }
  highlightCanvas.requestRenderAll();
}

function unit2ImagePath(unit) {
  return `../img/${(unit.team + unit.type).toLowerCase()}.png`;
}

function setIconImage(i, j) {
  var unit = curFrame[i][j];
  // iconGrid[i][j].setSrc(`../img/${(unit.team + unit.type).toLowerCase()}.png`, function (image) {
  //   iconCanvas.renderAll();
  // });
  var p = tile2Pixels(i, j);
  drawImage(unit2ImagePath(unit), p[0], p[1], iconSize, iconSize,
  function (img) {
    iconCanvas.add(img);
    iconCanvas.requestRenderAll();
  });

  textGrid[i][j].set("visible", false);
  // iconGrid[i][j].set("visible", true);
}

// base data from
var baseFrame;
var frameChanges;

var popMap;
var passMap;
var structureMap;

var moneyHistory;
var utilityHistory;
var bidHistory;

var redMoneyHistory;
var blueMoneyHistory;

var redUtilityHistory;
var blueUtilityHistory;

var metadata = {};
var GC;

var structName2ID = {};
var structID2Name = {};
var hasLoadedFrames = false;
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
  hasLoadedFrames = false;
  if (event.target.files.length > 0) {
    var reader = new FileReader();
    reader.onload = function(event) {
      // do stuff here
      loadData(event.target.result);
      fileInput.value = null;
    }
    reader.readAsText(event.target.files[0]);
  }
}

function loadData(data) {
  console.log("Loading data...")

  var obj = JSON.parse(data);
  console.log(obj);

  metadata = obj["metadata"];

  GC = obj.game_constants;

  frameChanges = obj["frame_changes"];

  moneyHistory = obj["money_history"];
  // console.log(moneyHistory)

  redMoneyHistory = new Array(moneyHistory.length);
  for (var i = 0; i < moneyHistory.length; i++) {
    redMoneyHistory[i] = moneyHistory[i][0];
  }

  blueMoneyHistory = new Array(moneyHistory.length);
  for (var i = 0; i < moneyHistory.length; i++) {
    blueMoneyHistory[i] = moneyHistory[i][1];
  }

  // console.log(redMoneyHistory)
  // console.log(blueMoneyHistory)
  utilityHistory = obj["utility_history"];

  redUtilityHistory = new Array(utilityHistory.length);
  for (var i = 0; i < utilityHistory.length; i++) {
    redUtilityHistory[i] = utilityHistory[i][0];
  }

  blueUtilityHistory = new Array(utilityHistory.length);
  for (var i = 0; i < utilityHistory.length; i++) {
    blueUtilityHistory[i] = utilityHistory[i][1];
  }

  bidHistory = obj["bid_history"];

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
      curFrame[el[0]][el[1]] = getUnitInfo(t, structName2ID["Generator"], 0);
    }
  }

  baseFrame = JSON.parse(JSON.stringify(curFrame));
  roundNum = 0;

  console.log("Read " + numFrameChanges + " frames");

  hasLoadedFrames = true;
  metadata.maxRound = numFrameChanges;
  // set up range slider
  frameRange.max = metadata.maxRound;
  frameRange.oninput = function() {
    if (framePlaying) {
      changePlay();
    }
    setRoundNum(parseInt(this.value))
  }

  // load unit stats
  calculateUnitStats();

  // update screen
  initUnitLabels();
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
      var unit = getUnitInfo(team_id, type_id, fnum + 1);
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

prevRoundButton.onclick = stepPrevRound;
nextRoundButton.onclick = stepNextRound;

slowerSpeedButton.onclick = decreaseSpeed;
fasterSpeedButton.onclick = increaseSpeed;

playButton.onclick = changePlay;

function prevRound() {
  if (hasLoadedFrames) {
    if (roundNum > 0) {
      setRoundNum(roundNum - 1);
    }
  }
}

function nextRound() {
  if (hasLoadedFrames) {
    if (roundNum < metadata.maxRound) {
      setRoundNum(roundNum + 1);
    }
  }
}

function stepPrevRound() {
  if (framePlaying) {
    changePlay();
  }
  prevRound();
}

function stepNextRound() {
  if (framePlaying) {
    changePlay();
  }
  nextRound();
}

function getNewFrame(targetRound, oldRoundNum) {
  for (var fnum = oldRoundNum; fnum < targetRound; fnum++) {
    for (var structure of frameChanges[fnum]) {
      var [x, y, team_id, type_id] = structure;
      curFrame[x][y] = getUnitInfo(team_id, type_id, fnum + 1);

      setIcon(x, y);
    }
  }

  // highlight newly spawned icons
  highlightNewSpawns(targetRound);

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

  displayGameInfo();
}


function initUnitLabels() {
  // init unit label divs
  for (var t = 0; t < 2; t++) {
    unitLabelDivs[t].innerHTML = "";
    for (var u_id in structID2Name) {
      var exampleUnit = getUnitInfo(t, u_id, 0)
      var iconHTML = `<img src="${unit2ImagePath(exampleUnit)}">`;
      // if (structID2Name[u_id] == "Road") {
      //   iconHTML = ".";
      // } else {
      // }

      unitLabelDivs[t].innerHTML += `
      <div class="col" align="center">
        ${iconHTML}
      </div>`
    }
  }
}
/*
Updates visual menu box of game stats
- money, utility, number of units
*/
function displayGameInfo() {
  console.log(numFrameChanges, bidHistory[roundNum]);

  // display game info text
  for (var t = 0; t < 2; t++) {
    // update charts
    moneyChart.data.datasets[t].data[0] = moneyHistory[roundNum][t];
    moneyChart.update()

    unitCountDivs[t].innerHTML = "";
    unitCountDivs[t].style.color = team2Color[t];
    for (var unit in unitCounts[roundNum][t]) {
      var count = unitCounts[roundNum][t][unit];

      unitCountDivs[t].innerHTML += `
      <div class="col" align="center">
        ${count}
      </div>
      `;
    }

    // display bids
    bidTexts[t].innerHTML = bidHistory[roundNum][t];
    // bid winner
    if (bidHistory[roundNum][2] == t) {
      console.log("b" + t)
      bidTexts[t].style.color = team2Color[t];
      bidTexts[t].innerHTML += " (W)";
    } else {
      console.log("n" + t)
      bidTexts[t].style.color = "black";
    }
  }

  for (var t = 0; t < 2; t++) {
    utilityLineChart.data.datasets[t].label = utilityHistory[roundNum][t];
  }

  // var numPastRounds = Math.min(10, roundNum + 1);
  var numPastRounds = roundNum + 1;

  var leftRange = roundNum + 1 - numPastRounds;
  var rightRange = roundNum + 1;
  var roundLabels = new Array(numPastRounds);
  for (var i = 0; i < numPastRounds; i++) {
    roundLabels[i] = (leftRange + i).toString();
  }

  utilityLineChart.data.datasets[0].data = redUtilityHistory.slice(leftRange, rightRange);
  utilityLineChart.data.datasets[1].data = blueUtilityHistory.slice(leftRange, rightRange);
  utilityLineChart.data.labels = roundLabels;
  utilityLineChart.update();
}

function updateTooltip(e) {
  var pointer = e.absolutePointer;

  var tloc = pixels2Tile(pointer.x, pointer.y);
  var p = tile2Pixels(tloc[0], tloc[1]);

  tooltipObject.left = p[0];
  tooltipObject.top = p[1];

  displayTooltipInfo(tloc[0], tloc[1]);

  frontCanvas.requestRenderAll();
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

  // tooltip div
  tooltipDiv.hidden = false;
  if (y < frameHeight / 2) { // lower half
    tooltipDiv.style.top = `${toolTipVerticalOffset}px`;
    tooltipDiv.style.left = `${toolTipHorizontalOffset}px`;
  } else {
    var tooltipDivHeight = tooltipDiv.getBoundingClientRect().height;
    tooltipDiv.style.top = `${frontCanvas.height - toolTipVerticalOffset - tooltipDivHeight}px`;
    tooltipDiv.style.left = `${toolTipHorizontalOffset}px`;
  }

  // tooltip text
  tooltipPosText.innerHTML = [x, y];
  tooltipPassText.innerHTML = passMap[x][y];
  tooltipPopText.innerHTML = popMap[x][y];
  // set unit text
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
  towerCoverObject.set("left", p[0]);
  towerCoverObject.set("top", p[1]);
}

function clearTooltipInfo() {
  curTooltipPos = null;

  tooltipObject.set("visible", false);

  // tooltipDiv.hidden = true;

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
  if (hasLoadedFrames) {
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
    stepPrevRound();
  }
  if (e.code === "ArrowRight" || e.key == "d") {
    stepNextRound();
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

// disable standard hotkey behavior (e.g. arrows moving screen around)
document.addEventListener('keydown', (e) => {
  if (e.code === "Space" || e.code.includes("Arrow")) {
    e.preventDefault();
  }
});

var intervalTime = 10;
var timeSinceUpdate = 0;
setInterval(function() {
  if (hasLoadedFrames && framePlaying) {
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
