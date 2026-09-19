import { SurfaceView } from '../scene/surface.js';
import { ContourView } from '../scene/contours.js';
import { ProbeView } from '../scene/probe.js';
import { GradArrowView } from '../scene/gradArrows.js';
import { TangentPlaneView } from '../scene/tangent.js';

/** Lazy view pool: a lab's first visit builds what it needs; exit hides, does not dispose. */
export function createViewPool(scene) {
  const made = {};
  function once(key, fn) {
    if (!made[key]) made[key] = fn();
    return made[key];
  }

  const pool = {
    surface: () => once('surface', () => new SurfaceView(scene)),
    contours: () => once('contours', () => new ContourView(scene)),
    probe: () => once('probe', () => new ProbeView(scene)),
    arrows: () => once('arrows', () => new GradArrowView(scene)),
    tangent: () => once('tangent', () => new TangentPlaneView(scene)),
    hideAll() {
      made.surface?.setVisible(false);
      made.contours?.setVisible(false);
      made.probe?.setVisible(false);
      made.arrows?.setVisible(false);
      made.tangent?.setVisible(false);
    },
  };
  return pool;
}
