// Copyright 2023 the .NET Foundation
// Licensed under the MIT License

// A path-aware replacement for LineList.
//
// LineList stores a flat list of independent segments, so a polyline added to
// it as a run of addLine() calls loses the fact that consecutive segments share
// an endpoint. At width 1 that costs nothing. Once lines are drawn as quads it
// shows up at every corner: the two quads meeting at a shared point are capped
// perpendicular to their own directions, so they overlap on the inside of the
// turn (visible as a darker patch whenever alpha < 1) and leave a notch on the
// outside.
//
// This module keeps paths intact, so an interior point can be offset along the
// bisector of its two segments -- a miter join -- and the quads on either side
// share an edge exactly.
//
// The important structural point: adjacency lives in the vertex data, not in
// buffer order. Every vertex carries the positions of the path points on either
// side of it. So unrelated paths can still be interleaved in one buffer, a path
// may straddle a buffer boundary, and the whole thing is still one
// drawArrays(TRIANGLES) per buffer. Nothing needs restart markers or per-path
// draw ranges.
//
// Everything here is named distinctly from its counterpart in primitives3d.js /
// gl_buffers.js / shaders.js so that both can be loaded at once and compared.
// Note that registerType() silently overwrites on a duplicate name, so renaming
// these to replace the originals means removing the originals at the same time.

import { registerType } from "../typesystem.js";
import { ss } from "../ss.js";
import { Matrix3d, Vector3d } from "../double3d.js";
import { Color } from "../color.js";
import { tilePrepDevice } from "../render_globals.js";
import { WEBGL } from "./webgl_constants.js";
import { VertexBufferBase } from "./gl_buffers.js";
import { Dates } from "./primitives3d.js";


// wwtlib.PolyLineShader
//
// Draws paths as camera-facing quads built in the vertex shader, so that width
// can be given in pixels rather than relying on gl.lineWidth(), which is capped
// at 1 almost everywhere.
//
// Adapted from https://github.com/mattdesl/webgl-lines (projected/vert.glsl),
// with four changes: the offset is scaled by w so that width survives the
// perspective divide; caps are detected by comparing world positions rather
// than projected ones; the miter length is clamped; and a path that doubles
// back on itself is handled instead of producing NaNs.

export function PolyLineShader() { }

PolyLineShader.prevVertLoc = 0;
PolyLineShader.vertLoc = 0;
PolyLineShader.nextVertLoc = 0;
PolyLineShader.colorLoc = 0;
PolyLineShader.timeLoc = 0;
PolyLineShader.thicknessLoc = 0;
PolyLineShader.orientationLoc = 0;
PolyLineShader.initialized = false;
PolyLineShader._prog = null;

// Floats per vertex, and the byte offset of each attribute within one vertex.
// Must agree with PolyLineVertexBuffer.unlock().
PolyLineShader.itemSize = 17;
PolyLineShader.stride = 4 * PolyLineShader.itemSize;
PolyLineShader.prevOffset = 0;
PolyLineShader.positionOffset = 12;
PolyLineShader.nextOffset = 24;
PolyLineShader.colorOffset = 36;
PolyLineShader.timeOffset = 52;
PolyLineShader.thicknessOffset = 60;
PolyLineShader.orientationOffset = 64;

PolyLineShader.init = function (renderContext) {
    var gl = renderContext.gl;

    const fragShaderText = `\
        precision highp float;
        uniform vec4 lineColor;
        varying lowp vec4 vColor;

        void main(void)
        {
            gl_FragColor = lineColor * vColor;
        }
    `;

    const vertexShaderText = `\
        attribute vec3 aPreviousPosition;
        attribute vec3 aVertexPosition;
        attribute vec3 aNextPosition;
        attribute vec4 aVertexColor;
        attribute vec2 aTime;
        attribute float aThickness;
        attribute float aOrientation;

        uniform mat4 uMVMatrix;
        uniform mat4 uPMatrix;
        uniform float jNow;
        uniform float decay;
        uniform float viewportWidth;
        uniform float viewportHeight;
        uniform float miterLimit;

        varying lowp vec4 vColor;

        // normalize() of a zero vector is NaN, which would take the whole quad
        // with it rather than just the degenerate piece of geometry.
        vec2 safeNormalize(vec2 v)
        {
            float l = length(v);
            return (l > 0.0) ? (v / l) : vec2(0.0);
        }

        void main(void)
        {
            float dAlpha = 1.0;

            if (decay > 0.0)
            {
                    dAlpha = 1.0 - ((jNow - aTime.y) / decay);
                    if (dAlpha > 1.0 )
                    {
                        dAlpha = 1.0;
                    }
            }

            if (jNow < aTime.x && decay > 0.0)
            {
                vColor = vec4(1, 1, 1, 1);
            }
            else
            {
                vColor = vec4(aVertexColor.r, aVertexColor.g, aVertexColor.b, dAlpha * aVertexColor.a);
            }

            mat4 pmvMatrix = uPMatrix * uMVMatrix;
            vec4 previousProjected = pmvMatrix * vec4(aPreviousPosition, 1.0);
            vec4 currentProjected = pmvMatrix * vec4(aVertexPosition, 1.0);
            vec4 nextProjected = pmvMatrix * vec4(aNextPosition, 1.0);

            // Normalized device coordinates, stretched by the aspect ratio so
            // that the perpendicular computed below is square on screen and not
            // merely square in NDC.
            float aspect = viewportWidth / viewportHeight;
            vec2 aspectVec = vec2(aspect, 1.0);
            vec2 currentScreen = currentProjected.xy / currentProjected.w * aspectVec;
            vec2 previousScreen = previousProjected.xy / previousProjected.w * aspectVec;
            vec2 nextScreen = nextProjected.xy / nextProjected.w * aspectVec;

            // aThickness is in pixels; NDC spans [-1, 1], so one pixel of
            // height is 2.0 / viewportHeight.
            float thicknessNdc = aThickness * 2.0 / viewportHeight;

            // A vertex at the open end of a path is given its own position as
            // its neighbour. Comparing the world-space attributes is exact,
            // because those are values we wrote ourselves; comparing the
            // projected positions instead would depend on matrix precision.
            bool atPathStart = (aPreviousPosition == aVertexPosition);
            bool atPathEnd = (aNextPosition == aVertexPosition);

            vec2 dir = vec2(0.0);

            // How far the join extends past the corner, as a multiple of the
            // line width. 1.0 everywhere except at a miter.
            float miterScale = 1.0;

            if (atPathStart && atPathEnd)
            {
                // Zero length segment.
                dir = vec2(0.0);
            }
            else if (atPathStart)
            {
                dir = safeNormalize(nextScreen - currentScreen);
            }
            else if (atPathEnd)
            {
                dir = safeNormalize(currentScreen - previousScreen);
            }
            else
            {
                // Interior point of a path: offset along the bisector of the
                // two segments so that the quads on either side share an edge.
                vec2 dirPrev = safeNormalize(currentScreen - previousScreen);
                vec2 dirNext = safeNormalize(nextScreen - currentScreen);

                if (dot(dirPrev, dirNext) < -0.9999)
                {
                    // The path doubles back on itself, so the two segments have
                    // no bisector -- normalize(dirPrev + dirNext) would be NaN.
                    // Cap it instead.
                    dir = dirPrev;
                }
                else
                {
                    vec2 tangent = safeNormalize(dirPrev + dirNext);
                    vec2 perp = vec2(-dirPrev.y, dirPrev.x);
                    vec2 miter = vec2(-tangent.y, tangent.x);
                    dir = tangent;

                    // The miter reaches halfWidth / sin(interiorAngle / 2) past
                    // the corner, which runs away at sharp angles -- a 15 degree
                    // corner is nearly 8x the half width. Clamping keeps the two
                    // sides in agreement (they see identical inputs, so they
                    // clamp identically) and so does not reintroduce a gap; it
                    // just blunts the corner.
                    float denom = dot(miter, perp);
                    miterScale = min(1.0 / max(denom, 0.0001), miterLimit);
                }
            }

            vec2 normal = vec2(-dir.y, dir.x);
            normal *= thicknessNdc * miterScale / 2.0;
            normal.x /= aspect;

            // The normal is a displacement in NDC, but we are emitting a
            // clip-space position, so scale it by w to survive the perspective
            // divide that the GPU is about to perform.
            vec2 offset = normal * aOrientation * currentProjected.w;
            gl_Position = currentProjected + vec4(offset, 0.0, 0.0);
        }
    `;

    PolyLineShader._frag = gl.createShader(WEBGL.FRAGMENT_SHADER);
    gl.shaderSource(PolyLineShader._frag, fragShaderText);
    gl.compileShader(PolyLineShader._frag);
    if (!gl.getShaderParameter(PolyLineShader._frag, WEBGL.COMPILE_STATUS)) {
        console.error('PolyLineShader fragment shader: ' + gl.getShaderInfoLog(PolyLineShader._frag));
    }

    PolyLineShader._vert = gl.createShader(WEBGL.VERTEX_SHADER);
    gl.shaderSource(PolyLineShader._vert, vertexShaderText);
    gl.compileShader(PolyLineShader._vert);
    if (!gl.getShaderParameter(PolyLineShader._vert, WEBGL.COMPILE_STATUS)) {
        console.error('PolyLineShader vertex shader: ' + gl.getShaderInfoLog(PolyLineShader._vert));
    }

    PolyLineShader._prog = gl.createProgram();
    gl.attachShader(PolyLineShader._prog, PolyLineShader._vert);
    gl.attachShader(PolyLineShader._prog, PolyLineShader._frag);
    gl.linkProgram(PolyLineShader._prog);
    if (!gl.getProgramParameter(PolyLineShader._prog, WEBGL.LINK_STATUS)) {
        console.error('PolyLineShader link: ' + gl.getProgramInfoLog(PolyLineShader._prog));
    }
    gl.useProgram(PolyLineShader._prog);

    PolyLineShader.prevVertLoc = gl.getAttribLocation(PolyLineShader._prog, 'aPreviousPosition');
    PolyLineShader.vertLoc = gl.getAttribLocation(PolyLineShader._prog, 'aVertexPosition');
    PolyLineShader.nextVertLoc = gl.getAttribLocation(PolyLineShader._prog, 'aNextPosition');
    PolyLineShader.colorLoc = gl.getAttribLocation(PolyLineShader._prog, 'aVertexColor');
    PolyLineShader.timeLoc = gl.getAttribLocation(PolyLineShader._prog, 'aTime');
    PolyLineShader.thicknessLoc = gl.getAttribLocation(PolyLineShader._prog, 'aThickness');
    PolyLineShader.orientationLoc = gl.getAttribLocation(PolyLineShader._prog, 'aOrientation');

    PolyLineShader.lineColorLoc = gl.getUniformLocation(PolyLineShader._prog, 'lineColor');
    PolyLineShader.projMatLoc = gl.getUniformLocation(PolyLineShader._prog, 'uPMatrix');
    PolyLineShader.mvMatLoc = gl.getUniformLocation(PolyLineShader._prog, 'uMVMatrix');
    PolyLineShader.jNowLoc = gl.getUniformLocation(PolyLineShader._prog, 'jNow');
    PolyLineShader.decayLoc = gl.getUniformLocation(PolyLineShader._prog, 'decay');
    PolyLineShader.widthLoc = gl.getUniformLocation(PolyLineShader._prog, 'viewportWidth');
    PolyLineShader.heightLoc = gl.getUniformLocation(PolyLineShader._prog, 'viewportHeight');
    PolyLineShader.miterLimitLoc = gl.getUniformLocation(PolyLineShader._prog, 'miterLimit');

    gl.enable(WEBGL.BLEND);
    gl.blendFunc(WEBGL.SRC_ALPHA, WEBGL.ONE_MINUS_SRC_ALPHA);
    PolyLineShader.initialized = true;
};

PolyLineShader.use = function (renderContext, vertex, lineColor, zBuffer, jNow, decay, miterLimit) {
    var gl = renderContext.gl;
    if (gl != null) {
        if (!PolyLineShader.initialized) {
            PolyLineShader.init(renderContext);
        }
        gl.useProgram(PolyLineShader._prog);
        var mvMat = Matrix3d.multiplyMatrix(renderContext.get_world(), renderContext.get_view());
        gl.uniformMatrix4fv(PolyLineShader.mvMatLoc, false, mvMat.floatArray());
        gl.uniformMatrix4fv(PolyLineShader.projMatLoc, false, renderContext.get_projection().floatArray());
        gl.uniform4f(PolyLineShader.lineColorLoc, lineColor.r / 255, lineColor.g / 255, lineColor.b / 255, 1);
        gl.uniform1f(PolyLineShader.jNowLoc, jNow);
        gl.uniform1f(PolyLineShader.decayLoc, decay);
        gl.uniform1f(PolyLineShader.widthLoc, renderContext.width);
        gl.uniform1f(PolyLineShader.heightLoc, renderContext.height);
        gl.uniform1f(PolyLineShader.miterLimitLoc, (miterLimit == null) ? 4 : miterLimit);
        if (zBuffer) {
            gl.enable(WEBGL.DEPTH_TEST);
        } else {
            gl.disable(WEBGL.DEPTH_TEST);
        }
        gl.disableVertexAttribArray(0);
        gl.disableVertexAttribArray(1);
        gl.disableVertexAttribArray(2);
        gl.disableVertexAttribArray(3);
        gl.bindBuffer(WEBGL.ARRAY_BUFFER, vertex);
        gl.bindBuffer(WEBGL.ELEMENT_ARRAY_BUFFER, null);
        gl.enableVertexAttribArray(PolyLineShader.prevVertLoc);
        gl.enableVertexAttribArray(PolyLineShader.vertLoc);
        gl.enableVertexAttribArray(PolyLineShader.nextVertLoc);
        gl.enableVertexAttribArray(PolyLineShader.colorLoc);
        gl.enableVertexAttribArray(PolyLineShader.timeLoc);
        gl.enableVertexAttribArray(PolyLineShader.thicknessLoc);
        gl.enableVertexAttribArray(PolyLineShader.orientationLoc);
        gl.vertexAttribPointer(PolyLineShader.prevVertLoc, 3, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.prevOffset);
        gl.vertexAttribPointer(PolyLineShader.vertLoc, 3, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.positionOffset);
        gl.vertexAttribPointer(PolyLineShader.nextVertLoc, 3, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.nextOffset);
        gl.vertexAttribPointer(PolyLineShader.colorLoc, 4, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.colorOffset);
        gl.vertexAttribPointer(PolyLineShader.timeLoc, 2, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.timeOffset);
        gl.vertexAttribPointer(PolyLineShader.thicknessLoc, 1, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.thicknessOffset);
        gl.vertexAttribPointer(PolyLineShader.orientationLoc, 1, WEBGL.FLOAT, false, PolyLineShader.stride, PolyLineShader.orientationOffset);
        gl.enable(WEBGL.BLEND);
        gl.blendFunc(WEBGL.SRC_ALPHA, WEBGL.ONE_MINUS_SRC_ALPHA);
    }
};

// This shader uses more attribute arrays than the rest of the engine, which
// only ever disables arrays 0-3 before drawing. Leaving the extra arrays
// enabled would point them at a stale buffer for every subsequent draw call, so
// callers must invoke this once they are done drawing with this shader.
PolyLineShader.cleanup = function (renderContext) {
    var gl = renderContext.gl;
    if (gl != null && PolyLineShader.initialized) {
        gl.disableVertexAttribArray(PolyLineShader.prevVertLoc);
        gl.disableVertexAttribArray(PolyLineShader.vertLoc);
        gl.disableVertexAttribArray(PolyLineShader.nextVertLoc);
        gl.disableVertexAttribArray(PolyLineShader.colorLoc);
        gl.disableVertexAttribArray(PolyLineShader.timeLoc);
        gl.disableVertexAttribArray(PolyLineShader.thicknessLoc);
        gl.disableVertexAttribArray(PolyLineShader.orientationLoc);
    }
};

var PolyLineShader$ = {};

registerType("PolyLineShader", [PolyLineShader, PolyLineShader$, null]);


// wwtlib.PolyLineVertex
//
// One corner of the quad that a segment expands into. `previous` and `next` are
// the path points on either side of `position`; either one equal to `position`
// marks that end of the path, which the shader draws as a cap rather than a
// join. `orientation` is +1 or -1 and says which side of the line this corner
// sits on.

export function PolyLineVertex() {
    this.color = null;
    this.position = new Vector3d();
    this.previous = new Vector3d();
    this.next = new Vector3d();
    this.tu = 0;
    this.tv = 0;
    this.width = 1;
    this.orientation = 1;
}

PolyLineVertex.create = function (position, previous, next, color, startTime, endTime, width, orientation) {
    var temp = new PolyLineVertex();
    temp.position = position;
    temp.previous = previous;
    temp.next = next;
    temp.color = color;
    temp.tu = startTime;
    temp.tv = endTime;
    temp.width = width;
    temp.orientation = orientation;
    return temp;
};

var PolyLineVertex$ = {
    get_color: function () {
        return this.color;
    },

    set_color: function (value) {
        this.color = value;
        return value;
    }
};

registerType("PolyLineVertex", [PolyLineVertex, PolyLineVertex$, null]);


// wwtlib.PolyLineVertexBuffer

export function PolyLineVertexBuffer(count) {
    this.count = 0;
    this._verts$1 = null;
    VertexBufferBase.call(this);
    this.count = count;
}

// Floats per vertex: previous (3), position (3), next (3), color (4),
// time (2), width (1), orientation (1). Must agree with the offsets declared on
// PolyLineShader.
PolyLineVertexBuffer.itemSize = 17;

var PolyLineVertexBuffer$ = {
    lock: function () {
        this._verts$1 = new Array(this.count);
        return this._verts$1;
    },

    unlock: function () {
        this.vertexBuffer = tilePrepDevice.createBuffer();
        tilePrepDevice.bindBuffer(WEBGL.ARRAY_BUFFER, this.vertexBuffer);
        var f32array = new Float32Array(this.count * PolyLineVertexBuffer.itemSize);
        var buffer = f32array;
        var index = 0;
        var $enum1 = ss.enumerate(this._verts$1);
        while ($enum1.moveNext()) {
            var pt = $enum1.current;
            buffer[index++] = pt.previous.x;
            buffer[index++] = pt.previous.y;
            buffer[index++] = pt.previous.z;
            buffer[index++] = pt.position.x;
            buffer[index++] = pt.position.y;
            buffer[index++] = pt.position.z;
            buffer[index++] = pt.next.x;
            buffer[index++] = pt.next.y;
            buffer[index++] = pt.next.z;
            buffer[index++] = pt.get_color().r / 255;
            buffer[index++] = pt.get_color().g / 255;
            buffer[index++] = pt.get_color().b / 255;
            buffer[index++] = pt.get_color().a / 255;
            buffer[index++] = pt.tu;
            buffer[index++] = pt.tv;
            buffer[index++] = pt.width;
            buffer[index++] = pt.orientation;
        }
        tilePrepDevice.bufferData(WEBGL.ARRAY_BUFFER, f32array, WEBGL.STATIC_DRAW);
    }
};

registerType("PolyLineVertexBuffer", [PolyLineVertexBuffer, PolyLineVertexBuffer$, VertexBufferBase]);


// wwtlib.PolyLineList

export function PolyLineList() {
    this._zBuffer = true;
    this.timeSeries = false;
    this.showFarSide = true;
    this.sky = false;
    this.decay = 0;
    this.useNonRotatingFrame = false;
    this.jNow = 0;

    // { points: Vector3d[], color: Color, date: Dates, width: Number,
    //   closed: Boolean }. A plain addLine() becomes a two-point path, so there
    //  is only one representation to build buffers from.
    this._paths = [];

    this._lineBuffers = [];
    this._lineBufferCounts = [];
    this._width = 1;
    this._miterLimit = PolyLineList.DEFAULT_MITER_LIMIT;
}

// Each segment becomes a quad, i.e. two independent triangles.
PolyLineList.VERTICES_PER_SEGMENT = 6;

// How many segments go into a single vertex buffer. Chunking by segment rather
// than by point means a segment's six vertices are never split across two
// buffers. A path may still straddle a boundary, which is harmless: each
// segment carries its own neighbours.
PolyLineList.MAX_SEGMENTS_PER_BUFFER = 16000;

// How far a join may extend past its corner, as a multiple of the line width.
// Matches the SVG default, which starts blunting corners below about 29
// degrees.
PolyLineList.DEFAULT_MITER_LIMIT = 4;

// The six corners of a segment's quad, as (which end of the segment, which side
// of the line). Triangles are (start+, start-, end+) and (start-, end-, end+).
PolyLineList.CORNERS = [
    { atEnd: false, orientation: 1 },
    { atEnd: false, orientation: -1 },
    { atEnd: true, orientation: 1 },
    { atEnd: false, orientation: -1 },
    { atEnd: true, orientation: -1 },
    { atEnd: true, orientation: 1 }
];

var PolyLineList$ = {
    get_depthBuffered: function () {
        return this._zBuffer;
    },

    set_depthBuffered: function (value) {
        this._zBuffer = value;
        return value;
    },

    // The width, in pixels, given to paths added without an explicit width.
    // Widths are captured when a path is added, so changing this does not
    // affect paths that are already in the list.
    get_width: function () {
        return this._width;
    },

    set_width: function (value) {
        this._width = value;
        return value;
    },

    // How far a join may extend past its corner, as a multiple of the line
    // width. This is a uniform, so changing it does not invalidate the buffers.
    get_miterLimit: function () {
        return this._miterLimit;
    },

    set_miterLimit: function (value) {
        this._miterLimit = value;
        return value;
    },

    // A single segment. Kept for compatibility: a two-point path has no
    // interior point, so nothing joins, and the result is what LineList has
    // always drawn.
    addLine: function (v1, v2, color, date, width) {
        this._addPath([v1, v2], color, date, width, false);
    },

    addLineNoDate: function (v1, v2, color, width) {
        this._addPath([v1, v2], color, new Dates(0, 0), width, false);
    },

    // An open path. Consecutive segments are mitered where they meet; the two
    // far ends are capped.
    addPolyLine: function (points, color, date, width) {
        this._addPath(points, color, date, width, false);
    },

    // A closed path: the last point joins back to the first, and every point is
    // an interior one, so there are no caps.
    addClosedPolyLine: function (points, color, date, width) {
        this._addPath(points, color, date, width, true);
    },

    clear: function () {
        this._paths.length = 0;
        this._emptyLineBuffer();
    },

    drawLines: function (renderContext, opacity) {
        if (!this._paths.length || opacity <= 0) {
            return;
        }
        if (renderContext.gl == null) {
            //todo draw with HTML5
        } else {
            this._initLineBuffer();
            var $enum1 = ss.enumerate(this._lineBuffers);
            while ($enum1.moveNext()) {
                var lineBuffer = $enum1.current;
                PolyLineShader.use(renderContext, lineBuffer.vertexBuffer, Color.fromArgb(255, 255, 255, 255), this._zBuffer, this.jNow, (this.timeSeries) ? this.decay : 0, this._miterLimit);
                renderContext.gl.drawArrays(WEBGL.TRIANGLES, 0, lineBuffer.count);
            }
            PolyLineShader.cleanup(renderContext);
        }
    },

    _addPath: function (points, color, date, width, closed) {
        // Coincident consecutive points give a join no direction to work with.
        // Dropping them once, here, is cheaper than guarding every vertex on
        // every frame -- and the grids and spreadsheet layers do produce them.
        var cleaned = [];
        for (var i = 0; i < points.length; i++) {
            if (!cleaned.length || !this._samePoint(cleaned[cleaned.length - 1], points[i])) {
                cleaned.push(points[i]);
            }
        }

        // A closed path should not repeat its first point at the end; the wrap
        // is implied.
        if (closed && cleaned.length > 1 && this._samePoint(cleaned[0], cleaned[cleaned.length - 1])) {
            cleaned.pop();
        }

        if (cleaned.length < 2) {
            return;
        }

        this._paths.push({
            points: cleaned,
            color: color,
            date: date,
            width: (width == null) ? this._width : width,
            // Two points cannot enclose anything, so there is nothing to close.
            closed: closed && cleaned.length > 2
        });

        this._emptyLineBuffer();
    },

    // Exact comparison, which is what the shader's cap test does too. Points
    // that are merely very close still produce a well defined (if tiny) join
    // direction, and the shader's safeNormalize() covers the rest.
    _samePoint: function (a, b) {
        return a.x === b.x && a.y === b.y && a.z === b.z;
    },

    _segmentCount: function () {
        var total = 0;
        for (var i = 0; i < this._paths.length; i++) {
            var path = this._paths[i];
            total += path.closed ? path.points.length : (path.points.length - 1);
        }
        return total;
    },

    // Expand one segment of one path into the six vertices of its quad.
    //
    // An interior point of a path appears in two segments -- once as an end,
    // once as a start -- and is handed the same (previous, current, next)
    // triple both times. Both occurrences therefore compute the same miter
    // offset, which is what makes the two quads share an edge exactly.
    _addSegment: function (list, offset, path, index) {
        var points = path.points;
        var n = points.length;
        var at = function (i) {
            return points[((i % n) + n) % n];
        };

        var start = at(index);
        var end = at(index + 1);

        // A vertex at the open end of a path has no neighbour, so it repeats
        // its own position and the shader caps it.
        var prevOfStart = (index > 0 || path.closed) ? at(index - 1) : start;
        var nextOfEnd = ((index + 2 <= n - 1) || path.closed) ? at(index + 2) : end;

        for (var i = 0; i < PolyLineList.VERTICES_PER_SEGMENT; i++) {
            var corner = PolyLineList.CORNERS[i];
            list[offset + i] = PolyLineVertex.create(
                corner.atEnd ? end : start,
                corner.atEnd ? start : prevOfStart,
                corner.atEnd ? nextOfEnd : end,
                path.color,
                path.date.startDate,
                path.date.endDate,
                path.width,
                corner.orientation
            );
        }
    },

    _initLineBuffer: function () {
        if (this._lineBuffers.length) {
            return;
        }

        var segmentsLeft = this._segmentCount();
        if (!segmentsLeft) {
            return;
        }

        var buffer = null;
        var list = null;
        var capacity = 0;
        var inBuffer = 0;

        for (var p = 0; p < this._paths.length; p++) {
            var path = this._paths[p];
            var segCount = path.closed ? path.points.length : (path.points.length - 1);

            for (var i = 0; i < segCount; i++) {
                if (buffer == null || inBuffer >= capacity) {
                    if (buffer != null) {
                        buffer.unlock();
                    }
                    capacity = Math.min(PolyLineList.MAX_SEGMENTS_PER_BUFFER, segmentsLeft);
                    var vertexCount = capacity * PolyLineList.VERTICES_PER_SEGMENT;
                    buffer = new PolyLineVertexBuffer(vertexCount);
                    list = buffer.lock(); // Lock the buffer (which will return our structs)
                    this._lineBuffers.push(buffer);
                    this._lineBufferCounts.push(vertexCount);
                    inBuffer = 0;
                }

                this._addSegment(list, inBuffer * PolyLineList.VERTICES_PER_SEGMENT, path, i);
                inBuffer++;
                segmentsLeft--;
            }
        }

        if (buffer != null) {
            buffer.unlock();
        }
    },

    _emptyLineBuffer: function () {
        var $enum1 = ss.enumerate(this._lineBuffers);
        while ($enum1.moveNext()) {
            $enum1.current.dispose();
        }
        this._lineBuffers.length = 0;
        this._lineBufferCounts.length = 0;
    }
};

registerType("PolyLineList", [PolyLineList, PolyLineList$, null]);
