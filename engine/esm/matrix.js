export function Matrix() {
  this.rowCount = 3;
  this.columnCount = 3;
  this.values = null;
}

Matrix.withSize = function(rowCount, columnCount) {
  var temp = new Matrix();
  temp.rowCount = rowCount;
  temp.columnCount = columnCount;
  temp.init();
  return temp;
}

Matrix.identity = function(size) {
  var temp = Matrix.withSize(size, size);
  for (i = 0; i < size; i++) {
    temp.values[i][i] = 1;
  }
  return temp;
}

var Matrix$ = {
  init: function() {
    this.values = Array.from(new Array(this.rowCount), _idx => new Array(this.columnCount).fill(0));
  }
};
