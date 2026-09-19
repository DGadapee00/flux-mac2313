import * as THREE from 'three';
import { sceneScale, mathToWorld } from '../engine/frame.js';
import { fatSegments, setFatSegments, segmentCapacity, M } from './manim.js';

const N = 256;
const TAN_CAP = 1;

/**
 * A parametric curve on the floor, plus a tangent segment through γ(t).
 * Point count is fixed; Line2 cannot grow.
 */
export class CurveView {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.curve = fatSegments(segmentCapacity(N - 1), { color: M.teal, width: 3.2, opacity: 0.95 });
    this.tan = fatSegments(segmentCapacity(TAN_CAP), { color: M.yellow, width: 2.4, opacity: 0.9 });
    this.group.add(this.curve, this.tan);
  }

  setVisible(v) {
    this.group.visible = v;
  }

  sync({ x, y, t0, t1, t, xp, yp, showCurve = true, showTan = true, tanLen = 0.8 }) {
    const u = sceneScale();
    this.curve.visible = !!showCurve;
    this.tan.visible = !!showTan;
    if (showCurve) {
      const flat = [];
      let px;
      let py;
      let pz;
      for (let i = 0; i < N; i++) {
        const s = t0 + ((t1 - t0) * i) / (N - 1);
        const w = mathToWorld(x(s), y(s), 0, u);
        if (i) flat.push(px, py, pz, w.x, w.y, w.z);
        px = w.x;
        py = w.y;
        pz = w.z;
      }
      setFatSegments(this.curve, flat);
    }
    if (showTan && Number.isFinite(xp) && Number.isFinite(yp)) {
      const speed = Math.hypot(xp, yp);
      if (speed < 1e-10) {
        setFatSegments(this.tan, []);
        return;
      }
      const ux = xp / speed;
      const uy = yp / speed;
      const gx = x(t);
      const gy = y(t);
      const a = mathToWorld(gx - tanLen * ux, gy - tanLen * uy, 0, u);
      const b = mathToWorld(gx + tanLen * ux, gy + tanLen * uy, 0, u);
      setFatSegments(this.tan, [a.x, a.y + 0.012 * u, a.z, b.x, b.y + 0.012 * u, b.z]);
    }
  }
}
