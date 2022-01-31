function drawBox(x, y, width, height, color, thickness, opacity=1) {
  var obj = new fabric.Rect({
    width: width, height: height,
    left: x, top: y,
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
    left: x, top: y,
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
    left: x, top: y,
    fill: color,
    fontSize: fontSize,
    fontStyle: "bold",
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

function drawCircle(x, y, radius, color, opacity=1) {
  var obj = new fabric.Circle({
    left: x, top: y,
    radius: radius,
    fill: "rgb(0, 0, 0, 0)",
    // opacity: opacity,
    stroke: color,
    strokeWidth: 1.5,
    originX: "center",
    originY: "center",
    objectCaching: false
  });
  return obj;
}

// function drawImage(img, x, y, opacity=1) {
//   var obj = new fabric.Image(img, {
//     // scaleX: 0.13, scaleY: 0.13,
//     left: x, top: y,
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
      left: x, top: y,
      originX: "center",
      originY: "center",
      objectCaching: false
    });

    callback(img);
  });

}


function getPopRadius(population) {
  if (population <= 0) {
    return 0;
  }
  var relPass = (population - GC.MIN_POP) / (GC.MAX_POP - GC.MIN_POP);
  return relPass * (maxPopRadius - minPopRadius) + minPopRadius;
}

function getPassColor(passability) {
  var maxInversePass = 1 - GC.MIN_PASS / GC.MAX_PASS;
  var inversePass = 1 - GC.MIN_PASS / passability;

  var relPass = inversePass / maxInversePass;
  relPass = Math.pow(relPass, 3);
  // var relPass = (passability - GC.MIN_PASS) / (GC.MAX_PASS - GC.MIN_PASS);
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
