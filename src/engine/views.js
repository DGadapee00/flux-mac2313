import { SurfaceView } from '../scene/surface.js';
import { ContourView } from '../scene/contours.js';
import { ProbeView } from '../scene/probe.js';
import { GradArrowView } from '../scene/gradArrows.js';
import { TangentPlaneView } from '../scene/tangent.js';
import { PolarGridView } from '../scene/polarGrid.js';
import { CurveView } from '../scene/curve.js';
import { CritView } from '../scene/crits.js';

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
    polarGrid: () => once('polarGrid', () => new PolarGridView(scene)),
    curve: () => once('curve', () => new CurveView(scene)),
    crits: () => once('crits', () => new CritView(scene)),
    hideAll() {
      made.surface?.setVisible(false);
      made.contours?.setVisible(false);
      made.probe?.setVisible(false);
      made.arrows?.setVisible(false);
      made.tangent?.setVisible(false);
      made.polarGrid?.setVisible(false);
      made.curve?.setVisible(false);
      made.crits?.setVisible(false);
    },
  };
  return pool;
}
