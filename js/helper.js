function rgb(r, g, b){
  return "rgb("+r+","+g+","+b+")";
}

function init2DArray(width, height, el) {
  var arr = new Array(width);
  for (var i = 0; i < width; i++) {
    arr[i] = new Array(height);
    arr[i].fill(el);
  }
  return arr;
}


function getFileNameFromPath(path) {
  if (path.includes("\\")) {
    path = path.substring(path.lastIndexOf("\\") + 1);
  }
  if (path.includes("/")) {
    path = path.substring(path.lastIndexOf("/") + 1);
  }
  return path;
}


function getFileNameFromPathNoExtension(path) {
  var s = getFileNameFromPath(path)
  if (s.includes(".")) {
    return s.substring(0, s.lastIndexOf("."));
  } else {
    return s;
  }
}
