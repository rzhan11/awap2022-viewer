$(document).ready(function() {
  $("#help-modal-button").click(function() {
    $("#help-modal").modal();
  });
});

$(document).ready(function() {
  $("#metadata-modal-button").click(function() {
    $("#metadata-modal").modal();
  });
});


var fileInput = document.getElementById("file-input");

// metadata
var metadataDiv = document.getElementById("metadata-div");
var metadataP1Text = document.getElementById("metadata-p1-text");
var metadataP2Text = document.getElementById("metadata-p2-text");
var metadataMapText = document.getElementById("metadata-map-text");

var p1TimeText = document.getElementById("p1-time-text");
var p2TimeText = document.getElementById("p2-time-text");
var timeDiv = document.getElementById("time-div");

var winnerText = document.getElementById("winner-text");
var winnerDiv = document.getElementById("winner-div");

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

var unitLabelDivs = [document.getElementById("p1-unit-label-div"), document.getElementById("p2-unit-label-div")];
var unitCountDivs = [document.getElementById("p1-unit-count-div"), document.getElementById("p2-unit-count-div")];
// var gameInfoText = document.getElementById("game-info-text");


// tooltip elements
var tooltipDiv = document.getElementById("tooltip-div");
var tooltipPosText = document.getElementById("tooltip-pos-text");
var tooltipPassText = document.getElementById("tooltip-pass-text");
var tooltipPopText = document.getElementById("tooltip-pop-text");
var tooltipStructText = document.getElementById("tooltip-struct-text");

var bidTexts = [document.getElementById("p1-bid-text"), document.getElementById("p2-bid-text")];
