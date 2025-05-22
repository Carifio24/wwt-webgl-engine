import { ASEP } from "./astrocalc/angular_separation";
import { RC } from "./constants.js";
import { Coordinates } from "./coordinates";
import { Matrix3d, Vector2d, Vector3d } from "./double3d";
import { Parameter } from "./parameter";
import { registerType } from "./typesystem";

export function CorrespondencePoint() {
  this.celestial = null;
  this.image = null;
}

CorrespondencePoint.create = function(celestial, image) {
  var temp = new CorrespondencePoint();
  temp.celestial = celestial;
  temp.image = image;
  return temp;
}

registerType("CorrespondencePoint", CorrespondencePoint);

export function CorrespondenceSolver() {
  this.tanSolver = null;
  this.point = null;
  this.width = 0;
  this.height = 0;
}

CorrespondenceSolver.create = function(tanSolver, point, width, height) {
  var temp = new CorrespondenceSolver();
  temp.tanSolver = tanSolver;
  temp.point = point;
  temp.width = width;
  temp.height = height;
  return temp;
}

var CorrespondenceSolver$ = {
  calculate: function() {
    var initialPoint = Vector2d.create((this.width / 2 - this.point.image.x) * this.tanSolver.scale, (this.point.image.y - this.height / 2) * this.tanSolver.scale);
    var point = this.tanSolver.project(initialPoint, this.width, this.height);

    var vect1 = Coordinates.raDecTo3d(this.point.celestial, 1);
    var vect2 = Coordinates.raDecTo3d(point, 1);

    var vect3 = vect1 - vect2;
    return vect3.length();
  }
};

registerType("CorrespondenceSolver", [CorrespondenceSolver, CorrespondenceSolver$, null]);

export function TanSolver() {
  this.ra = new Parameter();
  this.dec = new Parameter();
  this.rotation = new Parameter();
  this.scale = new Parameter();
}

TanSolver.create = function(ra, dec, rotation, scale) {
  var temp = new TanSolver();
  temp.ra.value = ra;
  temp.dec.value = dec;
  temp.rotation.value = rotation;
  temp.scale.value = scale;
  return temp;
}

var TanSolver$ = {
  getSolution: function() {
    var solution = new WcsSolution();
    solution.centerX = this.ra;
    solution.centerY = this.dec;
    solution.scale = this.scale;
    solution.rotation = this.rotation;
    return solution;
  },

  project: function(point, width, height) {
    var lat = point.y;
    var lng = -point.x;
    var matrix = Matrix3d.get_identity();
    matrix.multiply(Matrix3d._rotationX((this.rotation - 180) / 180 * Math.PI));
    matrix.multiply(Matrix3d._rotationZ(this.dec / 180 * Math.PI));
    matrix.multiply(Matrix3d._rotationY((360 - this.ra * 15)/ 180 * Math.PI));

    var fac1 = this.scale * height / 2;
    var factor = Math.tan(fac1 * RC);

    var retPoint = Vector3d._transformCoordinate(Vector3d.create(1, lat / (fac1 * factor), lng / (fac1 * factor)), matrix);
    retPoint.normalize();
    return Coordinates.cartesianToSpherical2(retPoint);
  },

  parameters: function() {
    return [this.ra, this.dec, this.rotation, this.scale];
  }
};

registerType("TanSolver", [TanSolver, TanSolver$, null]);

export function WcsSolution() {
  this.centerX = 0;
  this.centerY = 0;
  this.offsetX = 0;
  this.offsetY = 0;
  this.rotation = 0;
  this.scale = 0;
  this.flip = false;
  this.width = 0;
  this.height = 0;
}

export function WcsFitter() {
  this.width = 0;
  this.height = 0;
  this.points = [];
  this.solveList = [];
  this.regressionParameters = [];
}

registerType("WcsFitter", WcsFitter);

WcsFitter.create = function (width, height) {
  var temp = new WcsFitter();
  temp.width = width;
  temp.height = height;
  return temp;
}

var WcsFitter$ = {
  addPoint: function(sky, image) {
    this.points.push(CorrespondencePoint.create(sky, image));
  },

  solve: function(a, b) {
    var sol = new WcsSolution();
    var center = Vector2d.create(this.width / 2, this.height / 2);
    var temp = a.image - b.image;
    var imageLength = temp.length;
    var angularSeparation = ASEP.separation(a.celestial.get_RA(), a.celestial.get_dec(), b.celestial.get_RA(), b.celestial.get_dec());

    // Degrees per pixel
    sol.scale = angularSeparation / imageLength;
    var imageRotation = Math.atan2(temp.x, temp.y) / Math.PI * 180;

    temp = center - b.image;

    var centerRotation = Math.atan2(temp.x, temp.y) / Math.PI * 180;

    sol.offsetX = width / 2;
    sol.offsetY = height / 2;

    var cent = a.celestial;

    var iters = 4;
    while (iters-- > 0) {
      // Calculate center
      var tanA = Coordinates.raDecToTan(cent, a.celestial);
      var tanB = Coordinates.raDecToTan(cent, b.celestial);

      temp = tanA - tanB;
      var tanLength = temp.length;

      sol.scale = (tanLength / Math.PI * 180) / imageLength;

      var tanRotation = Math.atan2(temp.x, temp.y) / 180 * Math.PI;
      var tRotRad = -((imageRotation - tanRotation) / 180 * Math.PI);

      var centerDistA = center - a.image;
      var centerRotationA = Math.atan2(centerDistA.x, centerDistA.y);

      var ratio = tanLength / imageLength;

      var tanCx = tanA.x + Math.sin(centerRotationA + tRotRad) * ratio * centerDistA.length;
      var tanCy = tanA.y + Math.cos(centerRotationA + tRotRad) * ratio * centerDistA.length;

      var result = Coordinates.tanToRaDec(Vector2d.create(center.get_RA(), center.get_dec()),
                                          Vector2d.create(tanCx, tanCy));

      sol.centerX = result.x;
      sol.centerY = result.y;

      cent = Coordinates.fromRaDec(result.x, result.y);
    }

    var positionAngle = ASEP.positionAngle(sol.centerX, sol.centerY, b.celestial.get_RA(), b.celestial.get_dec());
    sol.rotation = positionAngle - centerRotation;

    sol.flip = false;

    return sol;
  },

  solveLM: function() {
    var first = this.points[0];
    var second = this.points[1];
    var temp = first.image - second.image;
    var imageLength = temp.length;
    var angularSeparation = ASEP.separation(first.celestial.get_RA(), first.get_dec(), second.get_RA(), second.get_dec());

    // Degrees per pixel
    var scale = angularSeparation / imageLength;
    var sInit = this.solve(first, second);

    var ts = TanSolver.create(sInit.centerX, sInit.centerY, sInit.rotation - 180, sInit.scale);
    this.points.forEach(point => {
        this.solveList.push(CorrespondenceSolver.create(ts, point, this.width, this.height));
    });

    this.regressionParameters.push(...ts.parameters);

    var count = this.solveList.length;
    var data = [Array(count).fill(0), Array(count).fill(0)];
    for (var i = 0; i < count; i++) {
        data[0][i] = i;
        data[1][i] = 0;
    }

  }
};

registerType("WcsFitter", [WcsFitter, WcsFitter$, null]);
