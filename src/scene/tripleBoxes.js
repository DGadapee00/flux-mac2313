import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { rampColor, M } from './manim.js';
import { fatSegments, setFatSegments, segmentCapacity } from './manim.js';

export const TRIPLE_MAX_N = 8;
const MAX = TRIPLE_MAX_N * TRIPLE_MAX_N * TRIPLE_MAX_N;
const GAP = 0.82;
const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _c = new THREE.Color();

/**
 * Coloured n³ cubes filling a box in R³. Colour is f at the cell centre — the cubes are
 * the partition, not height-extruded prisms.
 */
export class TripleBoxesView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.count = 0;
    this.group.add(this.mesh);
    this.outline = fatSegments(segmentCapacity(12), { color: M.yellow, width: 1.8, opacity: 0.75 });
    this.group.add(this.outline);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ f, xMin, xMax, yMin, yMax, zMin, zMax, n, show = true }) {
    this.group.visible = !!show;
    if (!show) {
      this.mesh.count = 0;
      return;
    }
    const u = sceneScale();
    const nX = Math.max(1, Math.min(TRIPLE_MAX_N, n | 0));
    const dx = (xMax - xMin) / nX;
    const dy = (yMax - yMin) / nX;
    const dz = (zMax - zMin) / nX;
    const c0 = mathToWorld(0, 0, 0, u);
    const ax = mathToWorld(dx, 0, 0, u);
    const ay = mathToWorld(0, dy, 0, u);
    const az = mathToWorld(0, 0, dz, u);
    const sx = GAP * Math.hypot(ax.x - c0.x, ax.y - c0.y, ax.z - c0.z);
    const sy = GAP * Math.hypot(az.x - c0.x, az.y - c0.y, az.z - c0.z);
    const sz = GAP * Math.hypot(ay.x - c0.x, ay.y - c0.y, ay.z - c0.z);
    let lo = Infinity;
    let hi = -Infinity;
    const vals = [];
    for (let i = 0; i < nX; i++) {
      const x = xMin + (i + 0.5) * dx;
      for (let j = 0; j < nX; j++) {
        const y = yMin + (j + 0.5) * dy;
        for (let k = 0; k < nX; k++) {
          const z = zMin + (k + 0.5) * dz;
          const h = f(x, y, z);
          const val = Number.isFinite(h) ? h : 0;
          vals.push({ x, y, z, val });
          if (val < lo) lo = val;
          if (val > hi) hi = val;
        }
      }
    }
    const span = Math.max(1e-9, hi - lo);
    let nInst = 0;
    for (const cell of vals) {
      const w = mathToWorld(cell.x, cell.y, cell.z, u);
      _p.set(w.x, w.y, w.z);
      _s.set(Math.max(1e-6, sx), Math.max(1e-6, sy), Math.max(1e-6, sz));
      _q.identity();
      _m.compose(_p, _q, _s);
      this.mesh.setMatrixAt(nInst, _m);
      rampColor((cell.val - lo) / span, _c);
      this.mesh.setColorAt(nInst, _c);
      nInst += 1;
    }
    this.mesh.count = nInst;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;

    const corners = [
      [xMin, yMin, zMin],
      [xMax, yMin, zMin],
      [xMax, yMax, zMin],
      [xMin, yMax, zMin],
      [xMin, yMin, zMax],
      [xMax, yMin, zMax],
      [xMax, yMax, zMax],
      [xMin, yMax, zMax],
    ].map(([x, y, z]) => mathToWorld(x, y, z, u));
    const e = (i, j) => [corners[i].x, corners[i].y, corners[i].z, corners[j].x, corners[j].y, corners[j].z];
    setFatSegments(this.outline, [
      ...e(0, 1),
      ...e(1, 2),
      ...e(2, 3),
      ...e(3, 0),
      ...e(4, 5),
      ...e(5, 6),
      ...e(6, 7),
      ...e(7, 4),
      ...e(0, 4),
      ...e(1, 5),
      ...e(2, 6),
      ...e(3, 7),
    ]);
  }
}
