import { SURFACES } from '../math/surfaces.js';
import { CURVES } from '../math/curves.js';

const DOMAIN = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };
const PLANE = { xMin: -2.5, xMax: 2.5, yMin: -2.5, yMax: 2.5 };

export const SCENARIOS = {
  gradient: [
    { id: 'paraboloid', name: 'Paraboloid  x² + y²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 0.6 }, theta: 0.4, ...DOMAIN },
    { id: 'saddle', name: 'Saddle  x² − y²', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, theta: 0.7, ...DOMAIN },
    { id: 'plane', name: 'Plane  3x + 4y', surfaceId: 'plane', params: { a: 3, b: 4, c: 0 }, probe: { x: 0.4, y: -0.2 }, theta: 0, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian bump', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.3 }, theta: 1.1, ...DOMAIN },
    { id: 'xy', name: 'Product  xy', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 1 }, theta: 0.5, ...DOMAIN },
    { id: 'bowl', name: 'Off-centre bowl', surfaceId: 'bowl', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.4, y: 0 }, theta: 0.2, ...DOMAIN },
  ],
  polar: [
    { id: 'q1', name: 'First quadrant', probe: { x: 1.2, y: 0.9 }, ...PLANE },
    { id: 'q2', name: 'Second quadrant', probe: { x: -1.1, y: 1.4 }, ...PLANE },
    { id: 'q3', name: 'Third quadrant', probe: { x: -1.3, y: -0.8 }, ...PLANE },
    { id: 'q4', name: 'Fourth quadrant', probe: { x: 1.5, y: -1.0 }, ...PLANE },
    { id: 'axis', name: 'On the x-axis', probe: { x: 1.6, y: 0 }, ...PLANE },
  ],
  parametric: [
    { id: 'circle', name: 'Unit circle', curveId: 'circle', ...{ xMin: -2, xMax: 2, yMin: -2, yMax: 2 } },
    { id: 'parabola', name: 'Parabola (t, t²)', curveId: 'parabola', ...{ xMin: -2, xMax: 2, yMin: -0.5, yMax: 2.5 } },
    { id: 'cubic', name: '(t², t³ − 3t)', curveId: 'cubic', ...{ xMin: -1, xMax: 5, yMin: -3, yMax: 3 } },
    { id: 'spiral', name: 'Spiral (t cos t, t sin t)', curveId: 'spiral', ...{ xMin: -7, xMax: 7, yMin: -7, yMax: 7 } },
  ],
  extrema: [
    { id: 'paraboloid', name: 'Paraboloid — one min', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, ...DOMAIN },
    { id: 'saddle', name: 'Saddle', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.7, y: 0.4 }, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian — one max', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.5, y: 0.4 }, ...DOMAIN },
    { id: 'xy', name: 'Product xy — saddle', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.6 }, ...DOMAIN },
    { id: 'bowl', name: 'Off-centre bowl', surfaceId: 'bowl', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.2, y: 0.2 }, ...DOMAIN },
    { id: 'cubic', name: 'Cubic — min and saddle', surfaceId: 'cubic', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.4, y: 0.3 }, ...DOMAIN },
  ],
};

export function applyScenario(labId, id, state) {
  const list = SCENARIOS[labId] || [];
  const sc = list.find((s) => s.id === id) || list[0];
  if (!sc) return;
  state.scenarioId = sc.id;
  if (sc.surfaceId) state.surfaceId = sc.surfaceId;
  if (sc.curveId) state.curveId = sc.curveId;
  if (sc.params) state.params = { ...sc.params };
  if (sc.probe) state.probe = { x: sc.probe.x, y: sc.probe.y, z: sc.probe.z || 0 };
  if (sc.theta != null) state.theta = sc.theta;
  if (sc.xMin != null) state.xMin = sc.xMin;
  if (sc.xMax != null) state.xMax = sc.xMax;
  if (sc.yMin != null) state.yMin = sc.yMin;
  if (sc.yMax != null) state.yMax = sc.yMax;
}

export function surfaceName(id) {
  return SURFACES[id]?.name || id;
}

export function curveName(id) {
  return CURVES[id]?.name || id;
}
