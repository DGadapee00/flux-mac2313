import * as THREE from 'three';
import { defineLab, planeCamera } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { graphById, graphPolyline, graphSpeed } from '../math/graphs1.js';
import { riemann1d } from '../math/riemann.js';
import { simpson } from '../math/quadrature.js';
import { GRAPH_BARS_MAX_N } from '../scene/graphBars.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function agree(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.03 * Math.max(1, Math.abs(a), Math.abs(b));
}

function keepXy(state) {
  state.view = { ...(state.view || {}), plane: 'xy', upm: state.view?.upm || 1 };
}

export default defineLab({
  id: 'riemann1',
  exam: 'ch1',
  title: 'Riemann',
  hint: 'Drag $n$ · left / mid / right vs FTC',
  orbit: true,
  probe: false,
  frame: true,
  cameraFor: planeCamera,
  camera: { pos: new THREE.Vector3(0, 0, 14), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'curve', label: 'Graph' },
    { key: 'bars', label: 'Rectangles' },
  ],
  scenarios: SCENARIOS.riemann1,
  defaultState() {
    return {
      scenarioId: 'quad',
      graphId: 'quad',
      a: 0,
      b: 1,
      n: 6,
      sample: 'mid',
      probe: { x: 0.5, y: 0.25, z: 0 },
      xMin: -0.2,
      xMax: 1.2,
      yMin: -0.2,
      yMax: 1.4,
      view: { upm: 1, plane: 'xy' },
      show: { curve: true, bars: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>n</span>
          <div class="slider-row">
            <input type="range" id="r1-n" min="2" max="${GRAPH_BARS_MAX_N}" step="1" value="6" />
            <span class="mono val" id="r1-n-val">6</span>
          </div>
        </label>
        <label class="field">
          <span>Sample point</span>
          <select id="r1-sample">
            <option value="left">Left</option>
            <option value="mid">Midpoint</option>
            <option value="right">Right</option>
          </select>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('r1-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
    document.getElementById('r1-sample').addEventListener('change', (e) => {
      api.slice().sample = e.target.value;
      api.bump();
    });
  },
  syncControls(state) {
    const nEl = document.getElementById('r1-n');
    if (!nEl) return;
    nEl.value = state.n;
    document.getElementById('r1-n-val').textContent = String(state.n);
    const sel = document.getElementById('r1-sample');
    if (sel) sel.value = state.sample;
  },
  applyScenario(id, state) {
    applyData('riemann1', id, state);
    keepXy(state);
    if (!state.n) state.n = 6;
    if (!state.sample) state.sample = 'mid';
  },
  extent(state) {
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) ? state.b : 1;
    let m = Math.max(Math.abs(a), Math.abs(b), 1.2);
    for (let i = 0; i <= 20; i++) {
      const y = g.f(a + ((b - a) * i) / 20);
      if (Number.isFinite(y)) m = Math.max(m, Math.abs(y));
    }
    return m;
  },
  recompute(state, computed) {
    keepXy(state);
    const g = graphById(state.graphId);
    const a = Number.isFinite(state.a) ? state.a : 0;
    const b = Number.isFinite(state.b) ? state.b : 1;
    state.a = a;
    state.b = b;
    const n = Math.max(2, Math.min(GRAPH_BARS_MAX_N, state.n | 0));
    state.n = n;
    const sample = state.sample === 'left' || state.sample === 'right' ? state.sample : 'mid';
    state.sample = sample;
    const left = riemann1d(g.f, a, b, { n, sample: 'left' });
    const mid = riemann1d(g.f, a, b, { n, sample: 'mid' });
    const right = riemann1d(g.f, a, b, { n, sample: 'right' });
    const chosen = sample === 'left' ? left : sample === 'right' ? right : mid;
    const Isimp = simpson(g.f, a, b);
    const Iclosed = g.F ? g.F(b) - g.F(a) : NaN;
    const truth = Number.isFinite(Iclosed) ? Iclosed : Isimp;
    const Lsimp = simpson((x) => graphSpeed(g, x, a, b), a, b);
    const Lpoly = graphPolyline(g, a, b, 500);
    computed.g = g;
    computed.tex = g.tex;
    computed.sum = chosen.sum;
    computed.left = left.sum;
    computed.mid = mid.sum;
    computed.right = right.sum;
    computed.Isimp = Isimp;
    computed.Iclosed = Iclosed;
    computed.dx = chosen.dx;
    computed.n = n;
    computed.sample = sample;
    computed.Lsimp = Lsimp;
    computed.Lpoly = Lpoly;
    computed.err = Math.abs(chosen.sum - truth);
    computed.agree = agree(chosen.sum, truth) || n >= 16;
    computed.agreeL = agree(Lsimp, Lpoly);
    computed.truth = truth;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const g = computed.g;
    ctx.pool.curve().setVisible(!!show.curve);
    ctx.pool.curve().sync({
      x: (t) => t,
      y: (t) => g.f(t),
      t0: state.a,
      t1: state.b,
      t: 0.5 * (state.a + state.b),
      xp: 1,
      yp: g.fp(0.5 * (state.a + state.b)),
      showCurve: !!show.curve,
      showTan: false,
    });
    ctx.pool.graphBars().setVisible(!!show.bars);
    ctx.pool.graphBars().sync({
      f: g.f,
      a: state.a,
      b: state.b,
      n: state.n,
      sample: state.sample,
      show: !!show.bars,
    });
    ctx.pool.probe().setVisible(false);
  },
  law() {
    return [
      '\\displaystyle\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum f(x_i^*)\\,\\Delta x',
      '= F(b)-F(a)',
      'L=\\displaystyle\\int_a^b\\sqrt{1+f\'(x)^2}\\,dx',
    ];
  },
  liveRows(state, computed) {
    const sample = computed.sample === 'left' ? 'left' : computed.sample === 'right' ? 'right' : 'midpoint';
    const closed = Number.isFinite(computed.Iclosed) ? `$${fmt(computed.Iclosed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$[a,b]$', `$[${fmt(state.a)}, ${fmt(state.b)}]$`) +
      kv('$n$, $\\Delta x$', `$${computed.n}$, $${fmt(computed.dx)}$`) +
      kv('sample', sample) +
      kv('left / mid / right', `$${fmt(computed.left)}$ / $${fmt(computed.mid)}$ / $${fmt(computed.right)}$`) +
      kv('Simpson', `$${fmt(computed.Isimp)}$`) +
      kv('$F(b)-F(a)$', closed) +
      kv('graph length (Simpson)', `$${fmt(computed.Lsimp)}$`) +
      kv('graph length (polyline)', `$${fmt(computed.Lpoly)}$`)
    );
  },
  readout(state, computed) {
    return cells([
      ['sum', `$${fmt(computed.sum)}$`],
      ['$\\int$', `$${fmt(computed.truth)}$`],
      ['$L$', `$${fmt(computed.Lsimp)}$`],
      ['routes agree', computed.agree ? 'yes' : 'raise $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'A Riemann sum samples $f$ once in each subinterval — left endpoint, midpoint, or right endpoint are all legal. The integral is the limit; the FTC evaluates it as $F(b)-F(a)$ when an antiderivative is known. Simpson is an independent numeric route.',
    );
    body.push(eq('\\int_a^b f(x)\\,dx = \\lim_{n\\to\\infty}\\sum_{i=1}^n f(x_i^*)\\,\\Delta x = F(b)-F(a)'));
    body.push(
      `Graph length is a different integral, $\\int_a^b\\sqrt{1+f'(x)^2}\\,dx$, checked against a polyline. ${computed.g.id === 'semi' ? 'The upper unit semicircle has length $\\pi$ and area $\\pi/2$; the unit disk has area $\\pi$ and perimeter $2\\pi$.' : computed.agree ? 'At this $n$ the chosen sum already matches the integral.' : 'Raise $n$ to watch left, mid, and right close in.'}`,
    );
    return { title: 'One-variable Riemann sums', body };
  },
  plot: () => null,
});
