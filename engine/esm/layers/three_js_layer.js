import { Layer } from "./layer.js";
import { registerType } from "../typesystem.js";
import { globalRenderContext } from "../render_globals.js";
import { WWTControl } from "../wwt_control.js";

import * as THREE from 'three';

export var THREEGlobals = {
  renderer: null,
  camera: null,
  scene: null,
  setup: false,
};

function setupTHREEGlobals() {
  if (THREEGlobals.setup) {
    return;
  }

  THREEGlobals.renderer = new THREE.WebGLRenderer({
    canvas: WWTControl.singleton.canvas,
    context: globalRenderContext.gl,
    antialias: true,
  });
  THREEGlobals.renderer.autoClear = false;

  THREEGlobals.camera = new THREE.Camera();
  THREEGlobals.scene = new THREE.Scene();

  THREEGlobals.setup = true;
}

function matrixToTHREE(mat) {
  const matrix = new THREE.Matrix4();
  matrix.set(
    mat.get_m11(), mat.get_m21(), mat.get_m31(), mat.get_m41(),
    mat.get_m12(), mat.get_m22(), mat.get_m32(), mat.get_m42(),
    mat.get_m13(), mat.get_m23(), mat.get_m33(), mat.get_m43(),
    mat.get_m14(), mat.get_m24(), mat.get_m34(), mat.get_m44(),
  );
  return matrix;
}

export function updateTHREEGlobals(renderContext) {
  if (!THREEGlobals.setup) {
    return;
  }

  THREEGlobals.camera.projectionMatrix.copy(matrixToTHREE(renderContext.get_projection()));
  THREEGlobals.camera.matrixWorldInverse.copy(matrixToTHREE(renderContext.get_view()));
  THREEGlobals.camera.matrixWorld.copy(THREEGlobals.camera.matrixWorldInverse).invert();
  THREEGlobals.camera.matrixWorldNeedsUpdate = false;
  THREEGlobals.camera.projectionMatrixInverse.copy(THREEGlobals.camera.projectionMatrix).invert();
}

export function renderTHREE() {
  if (!THREEGlobals.setup) {
    return;
  }
  THREEGlobals.renderer.state.reset();
  THREEGlobals.renderer.render(THREEGlobals.scene, THREEGlobals.camera);
}

export function ThreeJSMeshLayer(mesh, frame) {
  setupTHREEGlobals();

  this.mesh = mesh;
  this.mesh.matrixAutoUpdate = false;
  THREEGlobals.scene.add(this.mesh);

  this.referenceFrame = frame;

  Layer.call(this);
}

ThreeJSMeshLayer.draw = function (renderContext, _opacity, _flat) {
  this.mesh.matrix.copy(matrixToTHREE(renderContext.get_world()));
  this.mesh.matrixWorldNeedsUpdate = true;
}

var ThreeJSMeshLayer$ = {};

registerType("ThreeJSMeshLayer", [ThreeJSMeshLayer, ThreeJSMeshLayer$, Layer]);
