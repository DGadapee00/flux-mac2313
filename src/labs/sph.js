import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { fieldById } from '../math/fields3.js';
import { integralSph, integralSphCart } from '../math/quadrature.js';
import { closedBall } from '../math/triple.js';
import { agreeTo } from '../math/agree.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

/*
 * The yardstick is the integral of |f| over the same region by the same integrator — not the value
 * of the integral, which can cancel to near zero while both routes are wrong, and not a floor of 1,
 * which made the tolerance flatly absolute for every integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale, { tol: 0.03 });

export default defineLab({
  id: 'sph',
  exam: 'ch5',
  title: 'Spherical',
  hint: 'Ball · $dV = \\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta$',
  orbit: true,
  probe: false,
  frame: true,
  camera: { pos: new THREE.Vector3(7.8, 6.2, 8.8), target: new THREE.Vector3(0, 0, 0) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [{ key: 'solid', label: 'Solid' }],
  legend: { id: 'f', title: '$f(x,y,z)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.sph,
  defaultState() {
    return {
      scenarioId: 'vol',
      fieldId: 'one',
      params: { a: 1, b: 1, c: 0 },
      R: 1,
      probe: { x: 0, y: 0, z: 0 },
      xMin: -1.2,
      xMax: 1.2,
      yMin: -1.2,
      yMax: 1.2,
      show: { solid: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>R</span>
          <div class="slider-row">
            <input type="range" id="sp5-R" min="0.4" max="2" step="0.01" value="1" />
            <span class="mono val" id="sp5-R-val">1.00</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('sp5-R').addEventListener('input', (e) => {
      api.slice().R = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const el = document.getElementById('sp5-R');
    if (!el) return;
    el.value = state.R;
    document.getElementById('sp5-R-val').textContent = Number(state.R).toFixed(2);
  },
  applyScenario(id, state) {
    applyData('sph', id, state);
    if (!Number.isFinite(state.R)) state.R = 1;
  },
  extent(state) {
    return Math.max(state.R || 1, 1.2);
  },
  recompute(state, computed) {
    const R = Math.max(0.2, Number.isFinite(state.R) ? state.R : 1);
    state.R = R;
    state.xMin = -R;
    state.xMax = R;
    state.yMin = -R;
    state.yMax = R;
    const fld = fieldById(state.fieldId);
    const p = state.params;
    const fn = (x, y, z) => fld.f(x, y, z, p);
    const Isph = integralSph(fn, R, { n: 24 });
    const Iabs = integralSph((x, y, z) => Math.abs(fn(x, y, z)), R, { n: 24 });
    const Icart = integralSphCart(fn, R, { n: 20 });
    const closed = closedBall(fld.id, R);
    const truth = Number.isFinite(closed) ? closed : Isph;
    computed.fld = fld;
    computed.tex = fld.tex(p);
    computed.R = R;
    computed.Isph = Isph;
    computed.Icart = Icart;
    computed.closed = closed;
    computed.err = Math.abs(Isph - Icart);
    computed.Iabs = Iabs;
    computed.agree = agree(Isph, Icart, Iabs) && agree(Isph, truth, Iabs);
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    ctx.pool.solid().setVisible(!!show.solid);
    ctx.pool.solid().sync({
      kind: 'sph',
      R: computed.R,
      show: !!show.solid,
    });
  },
  law() {
    return [
      '\\displaystyle\\iiint_B f\\,dV',
      '\\int_0^{2\\pi}\\int_0^{\\pi}\\int_0^R f\\,\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta',
    ];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$R$', `$${fmt(computed.R)}$`) +
      kv('$\\rho$', `$[0, ${fmt(computed.R)}]$`) +
      kv('$\\varphi$ from $+z$', '$[0,\\pi]$') +
      kv('$\\theta$', '$[0, 2\\pi)$') +
      kv('Jacobian', '$\\rho^2\\sin\\varphi$') +
      kv('spherical (with $\\rho^2\\sin\\varphi$)', `$${fmt(computed.Isph)}$`) +
      kv('Cartesian iterated', `$${fmt(computed.Icart)}$`) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['spherical', `$${fmt(computed.Isph)}$`],
      ['Cartesian', `$${fmt(computed.Icart)}$`],
      ['closed', Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : '—'],
      ['routes agree', computed.agree ? 'yes' : 'check $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    body.push(
      'Spherical coordinates on a ball: $\\rho$ is the distance from the origin, $\\varphi$ is the angle from the positive $z$-axis (so $\\varphi\\in[0,\\pi]$, not $[0,2\\pi)$), and $\\theta\\in[0,2\\pi)$ is the same polar angle as in the $xy$-plane. The Jacobian is $\\rho^2\\sin\\varphi$.',
    );
    body.push(
      eq('\\iiint_B f\\,dV = \\int_0^{2\\pi}\\int_0^{\\pi}\\int_0^R f\\,\\rho^2\\sin\\varphi\\,d\\rho\\,d\\varphi\\,d\\theta'),
    );
    body.push(
      `A second route integrates in Cartesian over $x^2+y^2+z^2\\le R^2$. ${computed.agree ? 'The routes agree at this $R$.' : 'The Cartesian nested integral is coarser near the sphere.'}`,
    );
    return { title: 'Triple integrals in spherical coordinates', body };
  },
  plot: () => null,
});
