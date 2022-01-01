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
    strokeWidth: 0.5,
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

// function drawImage(img, x, y, opacity=1) {
//   var obj = new fabric.Image(img, {
//     // scaleX: 0.13, scaleY: 0.13,
//     left: y, top: x,
//     opacity: opacity,
//     originX: "center",
//     originY: "center",
//     objectCaching: false
//   });
//   return obj;
// }

function drawImage(imgPath, x, y, imgWidth, imgHeight, callback) {

  fabric.Image.fromURL(imgPath, function(img) {
    img.set({
      scaleX: imgWidth / img.width, scaleY: imgHeight / img.height,
      left: y, top: x,
      originX: "center",
      originY: "center",
      objectCaching: false
    });

    callback(img);
  });

}
