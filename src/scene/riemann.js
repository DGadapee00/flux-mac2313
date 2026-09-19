import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { rampColor, M } from './manim.js';
import { fatSegments, setFatSegments, segmentCapacity } from './manim.js';

export const RIEMANN_MAX_N = 12;
const MAX = RIEMANN_MAX_N * RIEMANN_MAX_N;
const GAP = 0.88;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _up = new THREE.Vector3(0, 1, 0);
const _c = new THREE.Color();

/**
 * Prism boxes for a double Riemann sum. Rectangular cells, or polar cells as rectangles
 * aligned with r-hat / θ-hat. Instance budget is fixed at construction.
 */
export class RiemannView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.78,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);
    this.outline = fatSegments(segmentCapacity(4), { color: M.yellow, width: 1.8, opacity: 0.7 });
    this.group.add(this.outline);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync(opts) {
    const show = opts.show !== false;
    this.group.visible = show;
    if (!show) {
      this.mesh.count = 0;
      return;
    }
    if (opts.mode === 'polar') this._polar(opts);
    else this._rect(opts);
  }

  _rect({ f, xMin, xMax, yMin, yMax, nx, ny, sample = 'mid' }) {
    const u = sceneScale();
    const nX = Math.max(1, Math.min(RIEMANN_MAX_N, nx | 0));
    const nY = Math.max(1, Math.min(RIEMANN_MAX_N, ny | 0));
    const dx = (xMax - xMin) / nX;
    const dy = (yMax - yMin) / nY;
    let lo = Infinity;
    let hi = -Infinity;
    const vals = [];
    for (let i = 0; i < nX; i++) {
      for (let j = 0; j < nY; j++) {
        const x0 = xMin + i * dx;
        const y0 = yMin + j * dy;
        const sx = sample === 'll' ? x0 : sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
        const sy = sample === 'll' ? y0 : sample === 'ur' ? y0 + dy : y0 + 0.5 * dy;
        const h = f(sx, sy);
        vals.push({ i, j, x0, y0, h });
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    }
    const span = Math.max(1e-9, hi - lo);
    let n = 0;
    for (const cell of vals) {
      const cx = cell.x0 + 0.5 * dx;
      const cy = cell.y0 + 0.5 * dy;
      const foot = mathToWorld(cx, cy, 0, u);
      _p.set(foot.x, foot.y, foot.z);
      _s.set(Math.max(1e-6, GAP * dx * u), Math.max(1e-4, cell.h * u), Math.max(1e-6, GAP * dy * u));
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(n, _m);
      rampColor((cell.h - lo) / span, _c);
      this.mesh.setColorAt(n, _c);
      n += 1;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    const a = mathToWorld(xMin, yMin, 0, u);
    const b = mathToWorld(xMax, yMin, 0, u);
    const c = mathToWorld(xMax, yMax, 0, u);
    const d = mathToWorld(xMin, yMax, 0, u);
    const lift = 0.01 * u;
    setFatSegments(this.outline, [
      a.x, a.y + lift, a.z, b.x, b.y + lift, b.z,
      b.x, b.y + lift, b.z, c.x, c.y + lift, c.z,
      c.x, c.y + lift, c.z, d.x, d.y + lift, d.z,
      d.x, d.y + lift, d.z, a.x, a.y + lift, a.z,
    ]);
  }

  _polar({ f, R, nr, nth, sample = 'mid' }) {
    const u = sceneScale();
    const nR = Math.max(1, Math.min(RIEMANN_MAX_N, nr | 0));
    const nTh = Math.max(1, Math.min(RIEMANN_MAX_N, nth | 0));
    const dr = R / nR;
    const dth = (2 * Math.PI) / nTh;
    let lo = Infinity;
    let hi = -Infinity;
    const vals = [];
    for (let i = 0; i < nR; i++) {
      for (let j = 0; j < nTh; j++) {
        const r0 = i * dr;
        const th0 = j * dth;
        const r = sample === 'll' ? r0 : sample === 'ur' ? r0 + dr : r0 + 0.5 * dr;
        const th = sample === 'll' ? th0 : sample === 'ur' ? th0 + dth : th0 + 0.5 * dth;
        const rr = Math.max(r, 1e-9);
        const h = f(rr * Math.cos(th), rr * Math.sin(th));
        vals.push({ r0, th0, rMid: r0 + 0.5 * dr, thMid: th0 + 0.5 * dth, h });
        if (h < lo) lo = h;
        if (h > hi) hi = h;
      }
    }
    const span = Math.max(1e-9, hi - lo);
    let n = 0;
    for (const cell of vals) {
      const x = cell.rMid * Math.cos(cell.thMid);
      const y = cell.rMid * Math.sin(cell.thMid);
      const foot = mathToWorld(x, y, 0, u);
      _p.set(foot.x, foot.y, foot.z);
      _q.setFromAxisAngle(_up, -cell.thMid);
      const arc = Math.max(1e-6, cell.rMid * dth);
      _s.set(Math.max(1e-6, GAP * dr * u), Math.max(1e-4, cell.h * u), Math.max(1e-6, GAP * arc * u));
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(n, _m);
      rampColor((cell.h - lo) / span, _c);
      this.mesh.setColorAt(n, _c);
      n += 1;
    }
    this.mesh.count = n;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    setFatSegments(this.outline, []);
  }
}
