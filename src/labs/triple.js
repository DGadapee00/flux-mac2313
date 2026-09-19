import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { riemann3 } from '../math/riemann.js';
import { integral3 } from '../math/quadrature.js';
import { closedBox } from '../math/triple.js';
import { TRIPLE_MAX_N } from '../scene/tripleBoxes.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function agree(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.03 * Math.max(1, Math.abs(a), Math.abs(b));
}

export default defineLab({
  id: 'triple',
  exam: 'ch5',
  title: 'Triple',
  hint: 'Drag $n$ · $n^3$ cubes in a box',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.6, 7.0, 9.8), target: new THREE.Vector3(0.5, 0.5, 0.5) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [{ key: 'boxes', label: 'Cubes' }],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.triple,
  defaultState() {
    return {
      scenarioId: 'one',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      n: 4,
      probe: { x: 0.5, y: 0.5, z: 0.5 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      zMin: 0,
      zMax: 1,
      show: { boxes: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n × n × n</span>
          <div class="slider-row">
            <input type="range" id="tr-n" min="2" max="${TRIPLE_MAX_N}" step="1" value="4" />
            <span class="mono val" id="tr-n-val">4</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('tr-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('tr-n');
    if (!el) return;
    el.value = state.n;
    document.getElementById('tr-n-val').textContent = String(state.n);
  },
  applyScenario(id, state) {
    applyData('triple', id, state);
    if (!state.n) state.n = 4;
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      Math.abs(state.zMin || 0),
      Math.abs(state.zMax || 1),
      1,
    );
  },
  recompute(state, computed) {
    const n = Math.max(2, Math.min(TRIPLE_MAX_N, state.n | 0));
    state.n = n;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const xa = state.xMin;
    const xb = state.xMax;
    const ya = state.yMin;
    const yb = state.yMax;
    const za = Number.isFinite(state.zMin) ? state.zMin : 0;
    const zb = Number.isFinite(state.zMax) ? state.zMax : 1;
    state.zMin = za;
    state.zMax = zb;
    const mid = riemann3(fn, xa, xb, ya, yb, za, zb, { n });
    const Ixyz = integral3(fn, xa, xb, ya, yb, za, zb, { order: 'xyz', n: 16 });
    const Izyx = integral3(fn, xa, xb, ya, yb, za, zb, { order: 'zyx', n: 16 });
    const closed = closedBox(fld.id, xa, xb, ya, yb, za, zb);
    const truth = Number.isFinite(closed) ? closed : Ixyz;
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.sum = mid.sum;
    computed.Ixyz = Ixyz;
    computed.Izyx = Izyx;
    computed.closed = closed;
    computed.n = n;
    computed.dV = mid.dx * mid.dy * mid.dz;
    computed.err = Math.abs(mid.sum - truth);
    computed.agree = agree(Ixyz, Izyx) && agree(Ixyz, truth);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const fld = computed.fld;
    const p = state.params;
    const f = (x, y, z) => fld.f(x, y, z, p);
    ctx.pool.tripleBoxes().setVisible(!!show.boxes);
    ctx.pool.tripleBoxes().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      zMin: state.zMin,
      zMax: state.zMax,
      n: state.n,
      show: !!show.boxes,
    });
  },
  law() {
    return [
      '\\displaystyle\\iiint_B f\\,dV = \\lim \\sum f(x_{ijk}^*, y_{ijk}^*, z_{ijk}^*)\\,\\Delta V',
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$B$', `$[${fmt(state.xMin)}, ${fmt(state.xMax)}]\\times[${fmt(state.yMin)}, ${fmt(state.yMax)}]\\times[${fmt(state.zMin)}, ${fmt(state.zMax)}]$`) +
      kv('$n^3$', `$${computed.n}^3$`) +
      kv('$\\Delta V$', `$${fmt(computed.dV)}$`) +
      kv('midpoint sum', `$${fmt(computed.sum)}$`) +
      kv('$dz\\,dy\\,dx$', `$${fmt(computed.Ixyz)}$`) +
      kv('$dx\\,dy\\,dz$', `$${fmt(computed.Izyx)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['sum', `$${fmt(computed.sum)}$`],
      ['$dz\\,dy\\,dx$', `$${fmt(computed.Ixyz)}$`],
      ['$dx\\,dy\\,dz$', `$${fmt(computed.Izyx)}$`],
      ['routes agree', computed.agree ? 'yes' : 'raise $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'A triple integral over a box is the limit of these coloured cubes. Each cube has volume $\\Delta x\\,\\Delta y\\,\\Delta z$ and is sampled at its centre — colour is $f$, not a height extrusion.',
    );
    body.push(eq('\\iiint_B f\\,dV = \\lim_{n\\to\\infty}\\sum_{i,j,k} f(x_i^*, y_j^*, z_k^*)\\,\\Delta x\\,\\Delta y\\,\\Delta z'));
    body.push(
      `Fubini on a box: $dz\\,dy\\,dx$ versus $dx\\,dy\\,dz$ is a real order swap${Number.isFinite(computed.closed) ? ', and a closed antiderivative is a third route' : ''}. ${computed.agree ? 'The routes agree at this $n$.' : 'Raise $n$ if the midpoint sum is still coarse.'}`,
    );
    return { title: 'Triple integrals on a box', body };
  },
  plot: () => null,
});
