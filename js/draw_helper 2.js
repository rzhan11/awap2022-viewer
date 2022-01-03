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
