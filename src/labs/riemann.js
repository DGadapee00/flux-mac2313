import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { riemannRect } from '../math/riemann.js';
import { closedRect } from '../math/double.js';
import { integral2 } from '../math/quadrature.js';
import { RIEMANN_MAX_N } from '../scene/riemann.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function agree(a, b) {
  return Math.abs(a - b) < 0.03 * Math.max(1, Math.abs(a), Math.abs(b));
}

export default defineLab({
  id: 'riemann',
  exam: 'ch3',
  title: 'Riemann',
  hint: 'Drag $n$ · boxes are a Riemann sum',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.4, 7.2, 9.6), target: new THREE.Vector3(0.6, 0.5, 0.6) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'boxes', label: 'Boxes' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.riemann,
  defaultState() {
    return {
      scenarioId: 'para-sq',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      n: 4,
      sample: 'mid',
      probe: { x: 0.5, y: 0.5, z: 0 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      show: { surface: true, boxes: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n × n</span>
          <div class="slider-row">
            <input type="range" id="rm-n" min="2" max="${RIEMANN_MAX_N}" step="1" value="4" />
            <span class="mono val" id="rm-n-val">4</span>
          </div>
        </label>
        <label class="field">
          <span>Sample point</span>
          <select id="rm-sample">
            <option value="mid">Midpoint</option>
            <option value="ll">Lower left</option>
            <option value="ur">Upper right</option>
          </select>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('rm-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('rm-sample').addEventListener('change', (e) => {
      api.slice().sample = e.target.value;
      api.bump();
    });
  },
  syncControls(state) {
    const nEl = document.getElementById('rm-n');
    if (!nEl) return;
    nEl.value = state.n;
    document.getElementById('rm-n-val').textContent = String(state.n);
    const sel = document.getElementById('rm-sample');
    if (sel) sel.value = state.sample;
  },
  applyScenario(id, state) {
    applyData('riemann', id, state);
    if (!state.n) state.n = 4;
    if (!state.sample) state.sample = 'mid';
  },
  extent(state) {
    return Math.max(
      Math.abs(state.xMin),
      Math.abs(state.xMax),
      Math.abs(state.yMin),
      Math.abs(state.yMax),
      1,
    );
  },
  recompute(state, computed) {
    const n = Math.max(2, Math.min(RIEMANN_MAX_N, state.n | 0));
    state.n = n;
    const sample = state.sample === 'll' || state.sample === 'ur' ? state.sample : 'mid';
    state.sample = sample;
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const xa = state.xMin;
    const xb = state.xMax;
    const ya = state.yMin;
    const yb = state.yMax;
    const mid = riemannRect(fn, xa, xb, ya, yb, { nx: n, ny: n, sample });
    const simp = integral2(fn, xa, xb, ya, yb, { order: 'xy', n: 64 });
    const closed = closedRect(surf.id, xa, xb, ya, yb, p);
    const truth = Number.isFinite(closed) ? closed : simp;
    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.sum = mid.sum;
    computed.simp = simp;
    computed.closed = closed;
    computed.dx = mid.dx;
    computed.dy = mid.dy;
    computed.dA = mid.dA;
    computed.n = n;
    computed.sample = sample;
    computed.err = Math.abs(mid.sum - truth);
    computed.agree = agree(mid.sum, truth);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: { x: 0.5 * (state.xMin + state.xMax), y: 0.5 * (state.yMin + state.yMax) },
      fP: surf.f(0.5 * (state.xMin + state.xMax), 0.5 * (state.yMin + state.yMax), p),
      show: show.surface !== false,
      stem: false,
    });
    ctx.pool.riemann().setVisible(!!show.boxes);
    ctx.pool.riemann().sync({
      mode: 'rect',
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      nx: state.n,
      ny: state.n,
      sample: state.sample,
      show: !!show.boxes,
    });
  },
  law() {
    return ['\\displaystyle\\iint_D f\\,dA = \\lim \\sum f(x_{ij}^*, y_{ij}^*)\\,\\Delta A_{ij}'];
  },
  liveRows(state, computed) {
    const sample =
      computed.sample === 'll' ? 'lower left' : computed.sample === 'ur' ? 'upper right' : 'midpoint';
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$D$', `$[${fmt(state.xMin)}, ${fmt(state.xMax)}]\\times[${fmt(state.yMin)}, ${fmt(state.yMax)}]$`) +
      kv('$n\\times n$', `$${computed.n}\\times ${computed.n}$`) +
      kv('$\\Delta x,\\ \\Delta y$', `$${fmt(computed.dx)},\\ ${fmt(computed.dy)}$`) +
      kv('sample', sample) +
      kv('Riemann sum', `$${fmt(computed.sum)}$`) +
      kv('Simpson $\\iint$', `$${fmt(computed.simp)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['sum', `$${fmt(computed.sum)}$`],
      ['$\\iint$', `$${fmt(Number.isFinite(computed.closed) ? computed.closed : computed.simp)}$`],
      ['$|\\mathrm{err}|$', `$${fmt(computed.err)}$`],
      ['routes agree', computed.agree ? 'yes' : 'raise $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'The double integral over a rectangle is the limit of these box volumes. Each box has base $\\Delta x\\,\\Delta y$ and height $f$ at a sample point $(x_{ij}^*, y_{ij}^*)$ in the cell. Midpoint is one legal choice; the corners are legal too.',
    );
    body.push(eq('\\iint_D f\\,dA = \\lim_{n\\to\\infty}\\sum_{i,j} f(x_{ij}^*, y_{ij}^*)\\,\\Delta x\\,\\Delta y'));
    body.push(
      `A second route is a Simpson iterated integral${Number.isFinite(computed.closed) ? ', and a third is a closed antiderivative' : ''}. At $n=${computed.n}$ the boxes ${computed.agree ? 'already match the integral' : 'are still a coarse partition — raise $n$ to watch the error drop'}.`,
    );
    return { title: 'Double Riemann sums', body };
  },
  plot: () => null,
});
