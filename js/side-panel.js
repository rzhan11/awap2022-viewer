$(document).ready(function() {
  $("#help-modal-button").click(function() {
    $("#helpModal").modal();
  });
});


var fileInput = document.getElementById("file-input");

// metadata
var metadataText = document.getElementById("metadata-text");

// frame control elements
var frameSpeed = 8;
var minFrameSpeed = 1;
var maxFrameSpeed = 64;
var framePlaying = false;

var prevRoundButton = document.getElementById("prev-round-button");
var nextRoundButton = document.getElementById("next-round-button");
var roundText = document.getElementById("round-text");

var slowerSpeedButton = document.getElementById("slower-speed-button");
var fasterSpeedButton = document.getElementById("faster-speed-button");
var speedText = document.getElementById("speed-text");
speedText.innerHTML = frameSpeed;

var playButton = document.getElementById("play-button");

var frameRange = document.getElementById("frame-range");

// game state display elements
var moneyTexts = [document.getElementById("p1-money-text"), document.getElementById("p2-money-text")];
var moneyCanvases = [new fabric.Canvas("p1-money-canvas", {selection: false}), new fabric.Canvas("p2-money-canvas", {selection: false})];
var utilityTexts = [document.getElementById("p1-utility-text"), document.getElementById("p2-utility-text")];
var unitTexts = [document.getElementById("p1-unit-text"), document.getElementById("p2-unit-text")];
var gameInfoText = document.getElementById("game-info-text");


// tooltip elements
var tooltipPosText = document.getElementById("tooltip-pos-text");
var tooltipPassText = document.getElementById("tooltip-pass-text");
var tooltipPopText = document.getElementById("tooltip-pop-text");
var tooltipStructureText = document.getElementById("tooltip-structure-text");
