import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { riemannPolar } from '../math/riemann.js';
import { closedDisk, diskTypeI } from '../math/double.js';
import { integralPolar, integralTypeI } from '../math/quadrature.js';
import { RIEMANN_MAX_N } from '../scene/riemann.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function agree(a, b) {
  return Math.abs(a - b) < 0.03 * Math.max(1, Math.abs(a), Math.abs(b));
}

export default defineLab({
  id: 'dpolar',
  exam: 'ch3',
  title: 'Polar',
  hint: 'Disk $D_R$ · $dA = r\\,dr\\,d\\theta$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.2, 7.0, 9.4), target: new THREE.Vector3(0, 0.4, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'boxes', label: 'Polar boxes' },
    { key: 'grid', label: 'Polar grid' },
    { key: 'region', label: 'Disk' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.dpolar,
  defaultState() {
    return {
      scenarioId: 'area',
      surfaceId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      n: 6,
      sample: 'mid',
      probe: { x: 0, y: 0, z: 0 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { surface: false, boxes: true, grid: true, region: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="dp-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="dp-R-val">1.00</span>
          </div>
        </label>
        <label class="field">
          <span>n (rings)</span>
          <div class="slider-row">
            <input type="range" id="dp-n" min="3" max="${RIEMANN_MAX_N}" step="1" value="6" />
            <span class="mono val" id="dp-n-val">6</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('dp-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    document.getElementById('dp-n').addEventListener('input', (e) => {
      api.slice().n = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const rEl = document.getElementById('dp-R');
    if (!rEl) return;
    rEl.value = state.R;
    document.getElementById('dp-R-val').textContent = Number(state.R).toFixed(2);
    document.getElementById('dp-n').value = state.n;
    document.getElementById('dp-n-val').textContent = String(state.n);
  },
  applyScenario(id, state) {
    applyData('dpolar', id, state);
    if (!state.n) state.n = 6;
    if (!Number.isFinite(state.R)) state.R = 1;
  },
  extent(state) {
    return Math.max(state.R || 1, 1.2);
  },
  recompute(state, computed) {
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    state.R = R;
    const n = Math.max(3, Math.min(RIEMANN_MAX_N, state.n | 0));
    state.n = n;
    const nr = n;
    const nth = Math.min(RIEMANN_MAX_N, 2 * n);
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const polarF = (r, th) => fn(r * Math.cos(th), r * Math.sin(th));
    const Ipolar = integralPolar(polarF, 0, R, 0, 2 * Math.PI, { n: 80 });
    const d = diskTypeI(R);
    const Icart = integralTypeI(fn, d.xa, d.xb, d.yLo, d.yHi, { n: 80 });
    const rsum = riemannPolar(fn, R, { nr, nth, sample: 'mid' });
    const closed = closedDisk(surf.id, R, p);
    const truth = Number.isFinite(closed) ? closed : Ipolar;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.R = R;
    computed.nr = nr;
    computed.nth = nth;
    computed.Ipolar = Ipolar;
    computed.Icart = Icart;
    computed.rsum = rsum.sum;
    computed.closed = closed;
    computed.err = Math.abs(Ipolar - Icart);
    computed.agree = agree(Ipolar, Icart) && agree(Ipolar, truth);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    const R = computed.R;
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: -R,
      xMax: R,
      yMin: -R,
      yMax: R,
      probe: { x: 0, y: 0 },
      fP: surf.f(0, 0, p),
      show: show.surface !== false,
      stem: false,
    });
    ctx.pool.riemann().setVisible(!!show.boxes);
    ctx.pool.riemann().sync({
      mode: 'polar',
      f,
      R,
      nr: computed.nr,
      nth: computed.nth,
      sample: 'mid',
      show: !!show.boxes,
    });
    ctx.pool.polarGrid().setVisible(!!show.grid);
    ctx.pool.polarGrid().sync({ rMax: R, show: !!show.grid });
    ctx.pool.region().setVisible(!!show.region);
    ctx.pool.region().sync({ kind: 'disk', R, show: !!show.region });
  },
  law() {
    return [
      '\\displaystyle\\iint_{D_R} f\\,dA',
      '\\int_0^R\\int_0^{2\\pi} f(r\\cos\\theta,\\, r\\sin\\theta)\\, r\\,d\\theta\\,dr',
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$R$', `$${fmt(computed.R)}$`) +
      kv('$\\theta$', '$[0, 2\\pi)$') +
      kv('Jacobian', '$r$') +
      kv('polar $\\iint$ (with $r\\,dr\\,d\\theta$)', `$${fmt(computed.Ipolar)}$`) +
      kv('Cartesian type I', `$${fmt(computed.Icart)}$`) +
      kv('polar Riemann', `${computed.nr}×${computed.nth}  ·  $${fmt(computed.rsum)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['polar', `$${fmt(computed.Ipolar)}$`],
      ['Cartesian', `$${fmt(computed.Icart)}$`],
      ['Riemann', `$${fmt(computed.rsum)}$`],
      ['routes agree', computed.agree ? 'yes' : 'raise $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'On a disk $D_R$, polar coordinates are the natural chart: $\\theta\\in[0,2\\pi)$ and $r\\in(0,R]$. Theorem 22 says the extra factor of $r$ is the Jacobian — $dA = r\\,dr\\,d\\theta$, not $dr\\,d\\theta$.',
    );
    body.push(
      eq('\\iint_{D_R} f\\,dA = \\int_0^R\\int_0^{2\\pi} f(r\\cos\\theta,\\, r\\sin\\theta)\\, r\\,d\\theta\\,dr'),
    );
    body.push(
      `A second route integrates in Cartesian over the type I description $y=\\pm\\sqrt{R^2-x^2}$. A third is a polar Riemann sum of ${computed.nr}×${computed.nth} cells. ${computed.agree ? 'The routes agree at this $R$.' : 'The Cartesian type I integral is the harder of the two — raise $n$ if they drift.'}`,
    );
    return { title: 'Double integrals in polar', body };
  },
  plot: () => null,
});
