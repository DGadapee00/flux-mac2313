import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { rampColor, M } from './manim.js';
import { fatSegments, setFatSegments, segmentCapacity } from './manim.js';

export const GRAPH_BARS_MAX_N = 24;
const GAP = 0.9;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

/**
 * 1D Riemann rectangles under y = f(x) in the standing xy plane.
 * Instance budget is fixed; count may shrink.
 */
export class GraphBarsView {
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
    this.mesh = new THREE.InstancedMesh(geo, mat, GRAPH_BARS_MAX_N);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);
    this.axis = fatSegments(segmentCapacity(1), { color: M.yellow, width: 1.8, opacity: 0.7 });
    this.group.add(this.axis);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, a, b, n, sample = 'mid', show = true }) {
    this.group.visible = !!show;
    if (!show) {
      this.mesh.count = 0;
      return;
    }
    const u = sceneScale();
    const nX = Math.max(1, Math.min(GRAPH_BARS_MAX_N, n | 0));
    const dx = (b - a) / nX;
    let lo = Infinity;
    let hi = -Infinity;
    const vals = [];
    for (let i = 0; i < nX; i++) {
      const x0 = a + i * dx;
      const sx = sample === 'left' || sample === 'll' ? x0 : sample === 'right' || sample === 'ur' ? x0 + dx : x0 + 0.5 * dx;
      const h = f(sx);
      const height = Number.isFinite(h) ? h : 0;
      vals.push({ x0, h: height });
      if (height < lo) lo = height;
      if (height > hi) hi = height;
    }
    const span = Math.max(1e-9, hi - lo);
    const thick = Math.max(0.04 * u, 0.03);
    let k = 0;
    for (const cell of vals) {
      const cx = cell.x0 + 0.5 * dx;
      const foot = mathToWorld(cx, 0, 0, u);
      _p.set(foot.x, foot.y, foot.z);
      const wdx = Math.max(1e-6, GAP * dx * u);
      _s.set(wdx, cell.h * u, thick);
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(k, _m);
      rampColor((cell.h - lo) / span, _c);
      this.mesh.setColorAt(k, _c);
      k += 1;
    }
    this.mesh.count = k;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
    const A = mathToWorld(a, 0, 0, u);
    const B = mathToWorld(b, 0, 0, u);
    setFatSegments(this.axis, [A.x, A.y, A.z, B.x, B.y, B.z]);
  }
}
