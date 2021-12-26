function rgb(r, g, b){
  return "rgb("+r+","+g+","+b+")";
}

function init2DArray(width, height) {
  var arr = new Array(width);
  for (var i = 0; i < width; i++) {
    arr[i] = new Array(height);
    arr[i].fill(null);
  }
  return arr;
}
