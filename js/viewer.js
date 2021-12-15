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
var squareSize = 15;
var wordFontSize = 15;
var wordOffset = 3;
var edgeWidth = 5;

const canvas = document.getElementById('map-canvas');
const context = canvas.getContext('2d');


function drawFrame() {
  canvas.width = 2 * outerPadding + (frameWidth - 1) * innerPadding + frameWidth * squareSize;
  canvas.height = 2 * outerPadding + (frameHeight - 1) * innerPadding + frameHeight * squareSize;

  // background
  context.beginPath();
  context.rect(0, 0, canvas.width, canvas.height);
  context.closePath();
  context.fillStyle = DARK_GRAY;
  context.fill();

  // font settings
  context.font = wordFontSize + "pt sans-serif";
  context.fillStyle = BLACK;
  context.textAlign = "center";
  context.textBaseline = 'middle';

  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      var x = outerPadding + i * innerPadding + i * squareSize;
      var y = outerPadding + j * innerPadding + j * squareSize;
      context.beginPath();
      context.rect(y, x, squareSize, squareSize);
      context.closePath();

      var grayscale = 256 * (1 - popMap[i][j] / 100);
      context.fillStyle = rgb(grayscale, grayscale, grayscale);
      context.fill();
    }
  }

  // iterate through each tile and add icon/symbol for units
  for (var i = 0; i < frameHeight; i++) {
    for (var j = 0; j < frameWidth; j++) {
      if (curFrame[i][j] !== null) {
        var wx = wordOffset + outerPadding + i * innerPadding + (i + 0.5) * squareSize;
        var wy = outerPadding + j * innerPadding + (j + 0.5) * squareSize;
        var team = curFrame[i][j][0];
        var struct_id = curFrame[i][j][1];

        if (team == 0) {
          context.fillStyle = RED;
        } else if (team == 1) {
          context.fillStyle = BLUE;
        } else if (team == -1) {
          context.fillStyle = GREEN;
        }
        var textSymbol = "U";
        textSymbol = structID2Name[struct_id][0];
        context.fillText(textSymbol, wy, wx);
      }
    }
  }
}

function drawEdge (start, end) {
  var start_x = outerPadding + start[0] * innerPadding + (start[0] + 0.5) * squareSize;
  var start_y = outerPadding + start[1] * innerPadding + (start[1] + 0.5) * squareSize;
  var end_x = outerPadding + end[0] * innerPadding + (end[0] + 0.5) * squareSize;
  var end_y = outerPadding + end[1] * innerPadding + (end[1] + 0.5) * squareSize;
  var dx = end[0] - start[0];
  var dy = end[1] - start[1];
  var magnitude = Math.sqrt(dx * dx + dy * dy);
  var x_offset = -dy / magnitude * edgeWidth / 2;
  var y_offset = dx / magnitude * edgeWidth / 2;


  context.beginPath();
  context.moveTo(start_y + y_offset, start_x + x_offset);
  context.lineTo(start_y - y_offset, start_x - x_offset);
  context.lineTo(end_y - y_offset, end_x - x_offset);
  context.lineTo(end_y + y_offset, end_x + x_offset);
  context.lineTo(start_y + y_offset, start_x + x_offset);
  context.closePath();

  context.fill();
}

var fileInput = document.getElementById("file-input");
fileInput.addEventListener("change", uploadReplay, false);

// base data from
var frameChanges = null;
var popMap = null;
var structureMap = null;
var moneyHistory = null;
var utilityHistory = null;
var baseFrame = null;

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

  popMap = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      popMap[i][j] = mapData[i][j][0];
    }
  }

  structureMap = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      structureMap[i][j] = mapData[i][j][1];
    }
  }

  curFrame = init2DArray(frameWidth, frameHeight);
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      if (structureMap[i][j] === null) {
        curFrame[i][j] = null;
      } else {
        curFrame[i][j] = [structureMap[i][j][2], structureMap[i][j][3]];
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
  setRoundNum(0);
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
      frameRange.value = roundNum - 1
    }
  }
}

function nextRound() {
  if (loadedFrames) {
    if (roundNum < metadata.maxRound) {
      setRoundNum(roundNum + 1);
      frameRange.value = roundNum + 1
    }
  }
}

function getNewFrame(targetRound, oldRoundNum) {
  for (var fnum = oldRoundNum; fnum < targetRound; fnum++) {
    for (var structure of frameChanges[fnum]) {
      var [x, y, team, st_type] = structure;
      curFrame[x][y] = [team, st_type];
    }
  }

}

function setRoundNum(num) {

  // reset curFrame if we are going backwards
  if (roundNum > num) {
    roundNum = 0;
    curFrame = JSON.parse(JSON.stringify(baseFrame));
  }

  var oldRoundNum = roundNum;
  roundNum = num;
  roundText.innerHTML = roundNum + " / " + metadata.maxRound;


  // calculate frame
  getNewFrame(roundNum, oldRoundNum);

  drawFrame();
  displayMetadata();

  displayGameInfo();
}

/*
Updates visual menu box of game stats
- money, utility, number of units
*/
function displayGameInfo() {

  // display game info text
  p1MoneyText.style.color = BLUE;
  p1MoneyText.innerHTML = "Player 1 Money: " + moneyHistory[roundNum][0] + "<br>";
  p2MoneyText.style.color = RED;
  p2MoneyText.innerHTML = "Player 2 Money: " + moneyHistory[roundNum][1] + "<br>";
  if (roundNum == metadata.maxRound) {
    gameInfoText.innerHTML = "Winner: ";
    if (winner == "WHITE") {
      gameInfoText.style.color = BLUE;
      gameInfoText.innerHTML += metadata.whiteTeamName;
    } else {
      gameInfoText.style.color = RED;
      gameInfoText.innerHTML += metadata.blackTeamName;
    }
    gameInfoText.innerHTML += " (" + winner + ")";
  } else {
    gameInfoText.innerHTML = "";
  }

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

document.addEventListener('keydown', (e) => {
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
