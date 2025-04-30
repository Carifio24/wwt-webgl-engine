import { ASEP } from "./astrocalc/angular_separation";
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
  },

  solveLM: function() {
    var first = this.points[0];
    var second = this.points[1];
    var temp = first.image - second.image;
    var imageLength = temp.length;
    var angularSeparation = ASEP.separation(first.celestial.get_RA(), first.get_dec(), second.get_RA(), second.get_dec());

    // Degrees per pixel
    var scale = angularSeparation / imageLength;
  }
};

registerType("WcsFitter", [WcsFitter, WcsFitter$, null]);
