// colors
const WHITE = "#FFFFFF"
const LIGHT_GRAY = "#CFCFCF"
const MEDIUM_GRAY = "#9F9F9F"
const DARK_GRAY = "#7F7F7F"
const BLACK = "#444444";
const RED = "#FF0000";
const GREEN = "#00FF00";
const BLUE = "#0000FF";
const YELLOW = "#FFFF00";

// basic tile pixel constants
var outerPadding = 5;
var innerPadding = 1;
var tileSize = 15;
var wordFontSize = 15;
var edgeWidth = 5;

// calculated tile pixel constants
var fullTileSize = tileSize + innerPadding;

// icon tile pixel constants
var shadeTileSize = fullTileSize;
var shadeEdgeWidth = 2;
var shadeOpacity = 1;

// tooltip pixel constants
var tooltipSize = fullTileSize;
var tooltipEdgeWidth = 3;


// canvas constants
var maxZoom = 5;
var minZoom = 0.5;

var colorGrad = [ [255, 232, 191], [255, 165, 0] ];
var minPass = 1;
var maxPass = 10;

// helper variables
var team2Color = {0: RED, 1: BLUE};
var team2Text = {0: "RED", 1: "BLUE"};
