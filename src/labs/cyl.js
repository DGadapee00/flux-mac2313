import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { integralCyl, integralCylCart } from '../math/quadrature.js';
import { closedCyl } from '../math/triple.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

function agree(a, b) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.03 * Math.max(1, Math.abs(a), Math.abs(b));
}

export default defineLab({
  id: 'cyl',
  exam: 'ch5',
  title: 'Cylindrical',
  hint: 'Cylinder · $dV = r\\,dr\\,d\\theta\\,dz$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(8.0, 6.6, 9.2), target: new THREE.Vector3(0, 0.8, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'solid', label: 'Solid' },
    { key: 'grid', label: 'Polar grid' },
  ],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.cyl,
  defaultState() {
    return {
      scenarioId: 'vol',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      z0: 0,
      z1: 1,
      probe: { x: 0, y: 0, z: 0.5 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { solid: true, grid: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="cy-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="cy-R-val">1.00</span>
          </div>
        </label>
        <label class="field">
          <span>z₁</span>
          <div class="slider-row">
            <input type="range" id="cy-z1" min="0.4" max="2.5" step="0.01" value="1" />
            <span class="mono val" id="cy-z1-val">1.00</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('cy-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
    document.getElementById('cy-z1').addEventListener('input', (e) => {
      api.slice().z1 = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const rEl = document.getElementById('cy-R');
    if (!rEl) return;
    rEl.value = state.R;
    document.getElementById('cy-R-val').textContent = Number(state.R).toFixed(2);
    document.getElementById('cy-z1').value = state.z1;
    document.getElementById('cy-z1-val').textContent = Number(state.z1).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('cyl', id, state);
    if (!Number.isFinite(state.R)) state.R = 1;
    if (!Number.isFinite(state.z0)) state.z0 = 0;
    if (!Number.isFinite(state.z1)) state.z1 = 1;
  },
  extent(state) {
    return Math.max(state.R || 1, Math.abs(state.z0 || 0), Math.abs(state.z1 || 1), 1.2);
  },
  recompute(state, computed) {
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    const z0 = Number.isFinite(state.z0) ? state.z0 : 0;
    const z1 = Math.max(z0 + 0.2, Number.isFinite(state.z1) ? state.z1 : 1);
    state.R = R;
    state.z0 = z0;
    state.z1 = z1;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const Icyl = integralCyl(fn, R, z0, z1, { n: 24 });
    const Icart = integralCylCart(fn, R, z0, z1, { n: 24 });
    const closed = closedCyl(fld.id, R, z0, z1);
    const truth = Number.isFinite(closed) ? closed : Icyl;
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.R = R;
    computed.z0 = z0;
    computed.z1 = z1;
    computed.Icyl = Icyl;
    computed.Icart = Icart;
    computed.closed = closed;
    computed.err = Math.abs(Icyl - Icart);
    computed.agree = agree(Icyl, Icart) && agree(Icyl, truth);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.solid().setVisible(!!show.solid);
    ctx.pool.solid().sync({
      kind: 'cyl',
      R: computed.R,
      z0: computed.z0,
      z1: computed.z1,
      show: !!show.solid,
    });
    ctx.pool.polarGrid().setVisible(!!show.grid);
    ctx.pool.polarGrid().sync({ rMax: computed.R, show: !!show.grid });
  },
  law() {
    return [
      '\\displaystyle\\iiint_C f\\,dV',
      '\\int_{z_0}^{z_1}\\int_0^{2\\pi}\\int_0^R f\\, r\\,dr\\,d\\theta\\,dz',
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$R$', `$${fmt(computed.R)}$`) +
      kv('$z$', `$[${fmt(computed.z0)}, ${fmt(computed.z1)}]$`) +
      kv('$\\theta$', '$[0, 2\\pi)$') +
      kv('Jacobian', '$r$') +
      kv('cylindrical (with $r\\,dr\\,d\\theta\\,dz$)', `$${fmt(computed.Icyl)}$`) +
      kv('Cartesian iterated', `$${fmt(computed.Icart)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['cylindrical', `$${fmt(computed.Icyl)}$`],
      ['Cartesian', `$${fmt(computed.Icart)}$`],
      ['closed', Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : '—'],
      ['routes agree', computed.agree ? 'yes' : 'check $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'Cylindrical coordinates are polar in the $xy$-plane plus $z$. The volume element is $dV=r\\,dr\\,d\\theta\\,dz$, not $dr\\,d\\theta\\,dz$ — the extra $r$ is the same Jacobian as in double polar.',
    );
    body.push(eq('\\iiint_C f\\,dV = \\int_{z_0}^{z_1}\\int_0^{2\\pi}\\int_0^R f(r\\cos\\theta,\\, r\\sin\\theta,\\, z)\\, r\\,dr\\,d\\theta\\,dz'));
    body.push(
      `A second route integrates in Cartesian over $x^2+y^2\\le R^2$. ${computed.agree ? 'The routes agree at this $R$.' : 'The Cartesian nested integral is the harder of the two.'}`,
    );
    return { title: 'Triple integrals in cylindrical coordinates', body };
  },
  plot: () => null,
});
