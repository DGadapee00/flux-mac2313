import { SURFACES } from '../math/surfaces.js';

const DOMAIN = { xMin: -2, xMax: 2, yMin: -2, yMax: 2 };

export const SCENARIOS = {
  gradient: [
    { id: 'paraboloid', name: 'Paraboloid  x² + y²', surfaceId: 'paraboloid', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 0.6 }, theta: 0.4, ...DOMAIN },
    { id: 'saddle', name: 'Saddle  x² − y²', surfaceId: 'saddle', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.8, y: 0.5 }, theta: 0.7, ...DOMAIN },
    { id: 'plane', name: 'Plane  3x + 4y', surfaceId: 'plane', params: { a: 3, b: 4, c: 0 }, probe: { x: 0.4, y: -0.2 }, theta: 0, ...DOMAIN },
    { id: 'gaussian', name: 'Gaussian bump', surfaceId: 'gaussian', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.6, y: 0.3 }, theta: 1.1, ...DOMAIN },
    { id: 'xy', name: 'Product  xy', surfaceId: 'xy', params: { a: 1, b: 1, c: 0 }, probe: { x: 1, y: 1 }, theta: 0.5, ...DOMAIN },
    { id: 'bowl', name: 'Off-centre bowl', surfaceId: 'bowl', params: { a: 1, b: 1, c: 0 }, probe: { x: 0.4, y: 0 }, theta: 0.2, ...DOMAIN },
  ],
};

export function applyScenario(labId, id, state) {
  const list = SCENARIOS[labId] || [];
  const sc = list.find((s) => s.id === id) || list[0];
  if (!sc) return;
  state.scenarioId = sc.id;
  state.surfaceId = sc.surfaceId;
  state.params = { ...sc.params };
  state.probe = { x: sc.probe.x, y: sc.probe.y, z: 0 };
  state.theta = sc.theta;
  state.xMin = sc.xMin;
  state.xMax = sc.xMax;
  state.yMin = sc.yMin;
  state.yMax = sc.yMax;
}

export function surfaceName(id) {
  return SURFACES[id]?.name || id;
}
