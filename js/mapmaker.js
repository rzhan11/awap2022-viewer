"use strict";

var GC = {
  "MIN_PASS": 1,
  "MAX_PASS": 10,
  "MIN_POP": 0,
  "MAX_POP": 10,
}

function getCanvasDim(canvasID) {
  var w = document.getElementById(canvasID).parentElement.parentElement.clientWidth;
  // var h = document.getElementById(canvasID).parentElement.parentElement.clientHeight;
  var h = window.innerHeight;
  return [w, h];
}

function getSymTile(tx, ty) {
  // get symmetry
  if (mapSymmetry == "h") {
    return [frameWidth - 1 - tx, ty];

  } else if (mapSymmetry == "v") {
    return [tx, frameHeight - 1 - ty];

  } else if (mapSymmetry == "r") {
    return [frameWidth - 1 - tx, frameHeight - 1 - ty];
  } else {
    console.log("WARNING: 'getSymTile' unexpected mapSymmetry " + mapSymmetry);
    return null;
  }
}

function applyClickTileGenerator(tx, ty, isP2) {
  // remove old building, icon
  if (generatorMap[tx][ty] == -1) {
    if (isP2) {
      generatorMap[tx][ty] = 1;
    } else {
      generatorMap[tx][ty] = 0;
    }
  } else {
    generatorMap[tx][ty] = -1;
  }

  setIcon(tx, ty);
}

function applyClickTilePopulation(tx, ty) {
  popMap[tx][ty] = parseFloat(brushValueInput.value);
  updatePopulationCanvas(tx, ty);
}

function applyClickTilePassability(tx, ty) {
  passMap[tx][ty] = parseFloat(brushValueInput.value);
  passMap[tx][ty] = Math.max(Math.min(passMap[tx][ty], GC.MAX_PASS), GC.MIN_PASS);
  updatePassabilityCanvas(tx, ty);
}

function updatePopulationCanvas(tx, ty) {
  popGrid[tx][ty].set("radius", getPopRadius(popMap[tx][ty]));
}

function updatePassabilityCanvas(tx, ty) {
  passGrid[tx][ty].set("fill", getPassColor(passMap[tx][ty]));
}

function applyClickTile(tx, ty, mouseDown, isSym) {
  var brushType = getRadioValue("brush-type-radio");
  if (brushType == "generator") {
    if (mouseDown) {
      applyClickTileGenerator(tx, ty, isSym);
    }
  } else if (brushType == "population") {
    applyClickTilePopulation(tx, ty);
  } else if (brushType == "passability") {
    applyClickTilePassability(tx, ty);
  } else {
    console.log("WARNING: 'applyClickTile' unexpected brushType " + brushType);
  }
}

function isMapReady() {
  return !(passMap === undefined);
}

// apply click (as a brush)
function applyClick(tx, ty, mouseDown, isSym) {
  // skip if not setup yet
  if (!isMapReady()) {
    return;
  }
  if (!(0 <= tx && tx < frameWidth && 0 <= ty && ty < frameHeight)) {
    return;
  }

  if (isSym) {
    var symTile = getSymTile(tx, ty);
    tx = symTile[0];
    ty = symTile[1];
  }

  // make updates
  applyClickTile(tx, ty, mouseDown, isSym);

  if (!isSym) {
    displayTooltipInfoForce(tx, ty);
  }
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
  frontCanvas.prevTile = [-1, -1];

  // enable pan
  frontCanvas.on('mouse:down', function(opt) {
    var pointer = opt.absolutePointer;
    var tloc = pixels2Tile(pointer.x, pointer.y);
    this.isDragging = true;
    this.prevTile = tloc;
    applyClick(tloc[0], tloc[1], true, false);
    applyClick(tloc[0], tloc[1], true, true);
    renderFrame();
  });
  frontCanvas.on('mouse:move', function(opt) {
    if (this.isDragging) {
      var pointer = opt.absolutePointer;
      var tloc = pixels2Tile(pointer.x, pointer.y);
      if ( !(tloc[0] == this.prevTile[0] && tloc[1] == this.prevTile[1]) ) {
        this.prevTile = tloc;
        applyClick(tloc[0], tloc[1], false, false);
        applyClick(tloc[0], tloc[1], false, true);
        renderFrame();
      }
    }
  });
  frontCanvas.on('mouse:up', function(opt) {
    this.isDragging = false;
  });

  // tooltip
  frontCanvas.on('mouse:move', function(opt) {
    if (tooltipObject != null) {
      var pointer = opt.absolutePointer;
      var tloc = pixels2Tile(pointer.x, pointer.y);
      updateTooltip(tloc[0], tloc[1]);
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

syncCanvasMotion();

var passGrid;
var popGrid;
// var iconGrid;
var textGrid;
var shadeGrid;

var tooltipObject;

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
  passGrid = init2DArray(frameWidth, frameHeight, null);
  popGrid = init2DArray(frameWidth, frameHeight, null);
  textGrid = init2DArray(frameWidth, frameHeight, null);
  shadeGrid = init2DArray(frameWidth, frameHeight, null);

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


  // population
  for (var i = 0; i < frameWidth; i++) {
    for (var j = 0; j < frameHeight; j++) {
      var p = tile2Pixels(i, j);

      var radius = getPopRadius(popMap[i][j]);
      popGrid[i][j] = drawCircle(p[0], p[1], radius, GREEN, popCircleOpacity);
    }
  }

  var popObjects = popGrid.flat();
  var popGroup = new fabric.Group(popObjects, {"selectable": false});
  popCanvas.setBackgroundImage(popGroup);
  // end of population

  // tooltip
  tooltipObject = drawBox(0, 0, tooltipSize, tooltipSize, BLACK, tooltipEdgeWidth);
  tooltipObject.set("selectable", false)
  tooltipObject.set("visible", false)
  tooltipCanvas.add(tooltipObject);
  // end of tooltip

  for (var canvas of allCanvases) {
    var vpt = canvas.viewportTransform;
    // initial pan
    vpt[4] = 0;
    vpt[5] = 0;
    canvas.zoomToPoint({ x: 0, y: 0 }, 1);
    // canvas.requestRenderAll();
  }

  // set initial pan/zoom
  var zoomRatio = 0.95;
  for (var canvas of allCanvases) {
    var vpt = canvas.viewportTransform;
    // initial pan

    vpt[4] = (canvas.width / 2 - mapWidthPixelSize / 2);
    vpt[5] = (canvas.height / 2 - mapHeightPixelSize / 2);
    var initZoom = zoomRatio * Math.min(canvas.width / mapWidthPixelSize, canvas.height / mapHeightPixelSize);
    // initial zoom
    // canvas.zoomToPoint({ x: canvas.width / vpt[0], y: canvas.height / vpt[3] }, 1);
    canvas.zoomToPoint({ x: canvas.width / 2 , y: canvas.height / 2 }, initZoom);
    canvas.requestRenderAll();
  }

  renderFrame();
}

var iconObjs;

function getTileIndex(i, j) {
  return i + j * frameWidth;
}

function setIcon(i, j) {
  // console.log(i, j, curFrame[i][j])
  if (generatorMap[i][j] == -1) {
    textGrid[i][j].set("visible", false);
    shadeGrid[i][j].set("visible", false)
  } else {
    var color;
    if (generatorMap[i][j] == 0) {
      color = "red";
    } else if (generatorMap[i][j] == 1) {
      color = "blue"
    }

    // shades
    shadeGrid[i][j].set("stroke", color);
    shadeGrid[i][j].set("visible", true)

    var isNew = textGrid[i][j]

    // icon
    var textSymbol = "G";
    textGrid[i][j].set("fill", color);
    textGrid[i][j].set("text", textSymbol);
    textGrid[i][j].set("visible", true);
    iconCanvas.add(textGrid[i][j]);
  }
}


// base data from

var popMap;
var passMap;
var generatorMap;

var frameWidth;
var frameHeight;
var mapSymmetry;

function getRadioValue(name) {
    var ele = document.getElementsByName(name);

    for (var i = 0; i < ele.length; i++) {
      if (ele[i].checked) {
        return ele[i].value;
      }
    }
    return null;
}

function setRadioValue(name, option) {
    var ele = document.getElementsByName(name);

    for (var i = 0; i < ele.length; i++) {
      ele[i].checked = (ele[i].value == option);
    }
}

function loadMapSettings(obj) {
  if (obj != null) {
    mapWidthInput.value = obj["tile_info"].length;
    mapHeightInput.value = obj["tile_info"][0].length;

    setRadioValue("symmetry-radio", obj["symmetry"]);
  }

  frameWidth = parseInt(mapWidthInput.value);
  frameHeight = parseInt(mapHeightInput.value);

  mapSymmetry = getRadioValue("symmetry-radio");

  console.log("Map settings " + frameWidth + " " + frameHeight + " " + mapSymmetry)
}

function initMap(obj) {
  console.log("Resetting map");

  if (!("generators" in obj)) {
    obj = null;
  }

  // read frameWidth
  loadMapSettings(obj);

  passMap = init2DArray(frameWidth, frameHeight, 1);
  popMap = init2DArray(frameWidth, frameHeight, 0);
  generatorMap = init2DArray(frameWidth, frameHeight, -1);

  // clear
  clearFrame();

  if (obj != null) {
    console.log(obj)

    // add map
    var tiles = obj["tile_info"];
    for (var x = 0; x < frameWidth; x++) {
      for (var y = 0; y < frameHeight; y++) {
        passMap[x][y] = tiles[x][y][0];
        popMap[x][y] = tiles[x][y][1];
      }
    }

    // add generators
    for (var t = 0; t < obj["generators"].length; t++) {
      for (var loc of obj["generators"][t]) {
        generatorMap[loc[0]][loc[1]] = t;
      }
    }
  }

  initCanvasObjects();
}

createMapButton.onclick = initMap;

fileInput.addEventListener("change", uploadMap, false);
function uploadMap(event) {
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
  initMap(JSON.parse(data));
}


function updateTooltip(tx, ty) {
  var p = tile2Pixels(tx, ty);

  tooltipObject.left = p[0];
  tooltipObject.top = p[1];

  displayTooltipInfo(tx, ty);

  frontCanvas.requestRenderAll();
}



var curTooltipPos;
function displayTooltipInfoForce(tx, ty) {
  curTooltipPos = null;
  displayTooltipInfo(tx, ty);
}

function displayTooltipInfo(x, y) {
  if (curTooltipPos != null && curTooltipPos[0] == x && curTooltipPos[1] == y) {
    return;
  }

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


function downloadMap() {
  if (!isMapReady()) {
    console.log("WARNING: 'downloadMap' not ready")
    return;
  }

  var simpleMap = init2DArray(frameWidth, frameHeight, null);

  var generators = [[], []];
  for (var x = 0; x < frameWidth; x++) {
    for (var y = 0; y < frameHeight; y++) {
      // add tile info
      simpleMap[x][y] = [passMap[x][y], popMap[x][y]];

      // add generator
      if (generatorMap[x][y] != -1) {
        var t = generatorMap[x][y];
        generators[t].push([x, y]);
      }
    }
  }


  var dataObj = {
    "symmetry": mapSymmetry,
    "generators": generators,
    "tile_info": simpleMap,
  }

  var dataStr = JSON.stringify(dataObj);

  download(dataStr, "default-map.awap22m", "text/plain");
}

function download(data, filename, type) {
    var file = new Blob([data], {type: type});
    var a = document.createElement("a"),
            url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

downloadMapButton.onclick = downloadMap;
