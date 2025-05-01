import { ASEP } from "./astrocalc/angular_separation";
import { Coordinates } from "./coordinates";
import { Vector2d } from "./double3d";
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
  }
};

registerType("WcsFitter", [WcsFitter, WcsFitter$, null]);
