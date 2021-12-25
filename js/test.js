"use strict";

$(document).ready(function() {
  $("#help-modal-button").click(function() {
    $("#helpModal").modal();
  });
});

function rgb(r, g, b){
  return "rgb("+r+","+g+","+b+")";
}

const WHITE = "#FFFFFF"
const LIGHT_GRAY = "#CFCFCF"
const MEDIUM_GRAY = "#9F9F9F"
const DARK_GRAY = "#7F7F7F"
const BLACK = "#444444";
const RED = "#FF0000";
const GREEN = "#00FF00";
const BLUE = "#0000FF";
const YELLOW = "#FFFF00";

var outerPadding = 5;
var innerPadding = 1;
var tileSize = 15;
var wordFontSize = 15;
var wordOffset = 3;
var edgeWidth = 5;

var fullTileSize = tileSize + innerPadding;

var mapPixelSize = 2 * outerPadding + (frameWidth - 1) * innerPadding + frameWidth * tileSize;

var shadeTileSize = fullTileSize;
var shadeEdgeWidth = 2;
var shadeOpacity = 1;

var tooltipSize = fullTileSize;

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

var maxZoom = 5;
var minZoom = 0.5;

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

  var baseObject = drawRect(mapPixelSize / 2, mapPixelSize / 2, mapPixelSize, mapPixelSize, DARK_GRAY);
  var tileObjects = passGrid.flat();
  // tileObjects.unshift(baseObject);
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

function drawBox(x, y, width, height, color, thickness, opacity=1) {
  var obj = new fabric.Rect({
    width: width, height: height,
    left: y, top: x,
    stroke: color,
    strokeWidth: thickness,
    fill: "",
    opacity: opacity,
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

function drawRect(x, y, width, height, color, opacity=1) {
  var obj = new fabric.Rect({
    width: width, height: height,
    left: y, top: x,
    fill: color,
    opacity: opacity,
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

function drawText(text, x, y, fontSize, color) {
  var obj = new fabric.Text(text, {
    left: y, top: x,
    fill: color,
    fontSize: fontSize,
    fontStyle: "bold",
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

function drawCircle(x, y, radius, color) {
  var obj = new fabric.Circle({
    left: y, top: x,
    radius: radius,
    fill: color,
    stroke: BLACK,
    strokeWidth: 1,
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

function drawInitFrame() {
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

  renderFrame();
  setRoundNum(0);
}

function getPassColor(passability) {
  // var colorGrad = [ [0, 255, 255], [255, 255, 255], [255, 165, 0] ];
  // var colorGrad = [ [255, 255, 255], [255, 165, 0] ];
  var colorGrad = [ [255, 232, 191], [255, 165, 0] ];
  var minPass = 1;
  var maxPass = 10;

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

var team2Color = {0: RED, 1: BLUE};
var team2Text = {0: "RED", 1: "BLUE"};
function getUnitInfo(unit) {
  return { name: structID2Name[unit[1]], team: team2Text[unit[0]], color: team2Color[unit[0]] }
}

function setIcon(i, j, unit) {
  var textSymbol = unit.name[0];
  if (textSymbol == "R") {
    textSymbol = ".";
  }

  iconGrid[i][j].set("fill", unit.color);
  iconGrid[i][j].set("text", textSymbol);
  iconGrid[i][j].set("visible", true)

  shadeGrid[i][j].set("stroke", unit.color)
  shadeGrid[i][j].set("visible", true)
}

var fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", uploadReplay, false);

// base data from
var baseFrame = null;
var frameChanges = null;

var popMap = null;
var passMap = null;
var structureMap = null;

var moneyHistory = null;
var utilityHistory = null;

var metadataText = document.getElementById("metadata-text");
var metadata = {};

function displayMetadata() {
  metadataText.innerHTML = "Team RED: " + metadata.p1_name + "<br>";
  metadataText.innerHTML += "Team BLUE: " + metadata.p2_name + "<br>";
  metadataText.innerHTML += "Version: " + metadata.version;
};

var structName2ID = {};
var structID2Name = {};
var loadedFrames = false;
var frames = [];
var frameWidth = -1;
var frameHeight = -1;
var numFrames = -1;

var winner = "";

var roundNum = 0;
var curFrame;

var frameSpeed = 8;
var minFrameSpeed = 1;
var maxFrameSpeed = 64;
var framePlaying = false;
var drawMoveTrace = true;

function uploadReplay(event) {
  if (event.target.files.length > 0) {
    var reader = new FileReader();
    reader.onload = function(event) {
      // do stuff here
      loadData(event.target.result);
    }
    reader.readAsText(event.target.files[0]);
  }
}

function init2DArray(width, height) {
  var arr = new Array(width);
  for (var i = 0; i < width; i++) {
    arr[i] = new Array(height);
    arr[i].fill(null);
  }
  return arr;
}

function loadData(data) {
  console.log("Loading data...")

  var obj = JSON.parse(data);
  console.log(obj);

  metadata = obj["metadata"];

  var mapData = obj["map"];
  frameChanges = obj["frame_changes"];

  moneyHistory = obj["money_history"];
  utilityHistory = obj["utility_history"];

  structName2ID = {};
  structID2Name = {};
  for (var vals of obj["structure_type_ids"]) {
    structID2Name[vals[0]] = vals[1];
    structName2ID[vals[1]] = vals[0];
  }

  // load game frames

  numFrames = obj["metadata"]["num_frames"];
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

  curFrame = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      if (structureMap[i][j] === null) {
        curFrame[i][j] = null;
      } else {
        curFrame[i][j] = getUnitInfo([structureMap[i][j][2], structureMap[i][j][3]]);
      }
    }
  }

  baseFrame = JSON.parse(JSON.stringify(curFrame));
  frames.push(baseFrame);
  roundNum = 0;

  console.log("Read " + numFrames + " frames");

  loadedFrames = true;
  metadata.maxRound = numFrames - 1;
  // set up range slider
  frameRange.max = metadata.maxRound;
  frameRange.oninput = function() {
    setRoundNum(parseInt(this.value))
  }

  // update screen
  displayMetadata();
  initCanvasObjects();

  drawInitFrame();
}

var prevRoundButton = document.getElementById("prev-round-button");
var nextRoundButton = document.getElementById("next-round-button");
var roundText = document.getElementById("round-text");

var slowerSpeedButton = document.getElementById("slower-speed-button");
var fasterSpeedButton = document.getElementById("faster-speed-button");
var speedText = document.getElementById("speed-text");
speedText.innerHTML = frameSpeed;

var playButton = document.getElementById("play-button");

var frameRange = document.getElementById("frame-range");

var p1MoneyText = document.getElementById("p1-money-text");
var p2MoneyText = document.getElementById("p2-money-text");
var p1UtilityText = document.getElementById("p1-utility-text");
var p2UtilityText = document.getElementById("p2-utility-text");
var gameInfoText = document.getElementById("game-info-text");

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
      var [x, y, team, st_type] = structure;
      curFrame[x][y] = getUnitInfo([team, st_type]);

      setIcon(x, y, curFrame[x][y]);
    }
  }

  renderFrame();
}

function setRoundNum(num) {

  // reset curFrame if we are going backwards
  if (roundNum > num) {
    drawInitFrame();
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
  p1MoneyText.style.color = RED;
  p1MoneyText.innerHTML = "Team RED Money: " + moneyHistory[roundNum][0] + "<br>";
  p2MoneyText.style.color = BLUE;
  p2MoneyText.innerHTML = "Team BLUE Money: " + moneyHistory[roundNum][1] + "<br>";

  p1UtilityText.style.color = RED;
  p1UtilityText.innerHTML = "Team RED Utility: " + utilityHistory[roundNum][0] + "<br>";
  p2UtilityText.style.color = BLUE;
  p2UtilityText.innerHTML = "Team BLUE Utility: " + utilityHistory[roundNum][1] + "<br>";


  // winner text
  // if (roundNum == metadata.maxRound) {
  //   gameInfoText.innerHTML = "Winner: ";
  //   if (winner == "WHITE") {
  //     gameInfoText.style.color = BLUE;
  //     gameInfoText.innerHTML += metadata.whiteTeamName;
  //   } else {
  //     gameInfoText.style.color = RED;
  //     gameInfoText.innerHTML += metadata.blackTeamName;
  //   }
  //   gameInfoText.innerHTML += " (" + winner + ")";
  // } else {
  //   gameInfoText.innerHTML = "";
  // }

}

var tooltipPosText = document.getElementById("tooltip-pos-text");
var tooltipPassText = document.getElementById("tooltip-pass-text");
var tooltipPopText = document.getElementById("tooltip-pop-text");
var tooltipStructureText = document.getElementById("tooltip-structure-text");

var curTooltipPos;
function displayTooltipInfo(x, y) {
  towerCoverObject.set("visible", false);

  if ( !(0 <= x && x < frameWidth && 0 <= y && y < frameHeight) ) {
    clearTooltipInfo();
    return;
  }

  tooltipObject.set("visible", true);

  curTooltipPos = [x, y];

  tooltipPosText.innerHTML = "Position: (" + [x, y] + ")";
  tooltipPassText.innerHTML = "Passability: " + passMap[x][y];
  tooltipPopText.innerHTML = "Population: " + popMap[x][y];

  tooltipStructureText.innerHTML = "Structure: ";
  if (curFrame[x][y] == null) {
    tooltipStructureText.innerHTML += "None"
    tooltipStructureText.style.color = BLACK;
  } else {
    var unit = curFrame[x][y];
    tooltipStructureText.innerHTML += unit.name + ", " + unit.team;
    tooltipStructureText.style.color = unit.color;

    // display radius for tower
    if (unit.name == "Tower") {
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
  tooltipStructureText.innerHTML = "";
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
