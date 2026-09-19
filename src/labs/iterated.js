import * as THREE from 'three';
import { defineLab } from './define.js';
import { SCENARIOS, applyScenario as applyData } from '../data/scenarios.js';
import { surfaceById } from '../math/surfaces.js';
import { integral2, integralTypeI, integralTypeII, simpson } from '../math/quadrature.js';
import { closedRect, closedDisk, closedTriangle, diskTypeI, diskTypeII, triangleBounds, parabolaBounds } from '../math/double.js';
import { agreeTo } from '../math/agree.js';
import { kv, cells, eq } from '../ui/shared.js';
import { fmtNum as fmt } from '../ui/format.js';

/*
 * The yardstick for "do the two orders agree?" is ∬|f| over the same region, computed by the same
 * integrator — not the value of the integral itself, which can cancel to near zero while both
 * routes are badly wrong, and not a floor of 1, which made the tolerance flatly absolute for every
 * integral smaller than 1.
 */
const agree = (a, b, scale) => agreeTo(a, b, scale);

function bounds(state) {
  if (state.region === 'disk') {
    const R = state.R || 1;
    const I = diskTypeI(R);
    const II = diskTypeII(R);
    return { kind: 'disk', R, ...I, ...II, typeII: II };
  }
  if (state.region === 'triangle') {
    return { kind: 'typeI', ...triangleBounds() };
  }
  if (state.region === 'parabola') {
    return { kind: 'typeI', ...parabolaBounds() };
  }
  return {
    kind: 'rect',
    xa: state.xMin,
    xb: state.xMax,
    ya: state.yMin,
    yb: state.yMax,
    yLo: () => state.yMin,
    yHi: () => state.yMax,
    xLo: () => state.xMin,
    xHi: () => state.xMax,
  };
}

export default defineLab({
  id: 'iterated',
  exam: 'ch3',
  title: 'Iterated',
  hint: 'Slide the outer variable · Fubini swaps the order',
  orbit: true,
  probe: true,
  frame: true,
  camera: { pos: new THREE.Vector3(8.6, 6.8, 9.8), target: new THREE.Vector3(0.4, 0.5, 0.4) },
  keys: { r: 'reset', R: 'reset' },
  toggles: [
    { key: 'surface', label: 'Surface' },
    { key: 'slice', label: 'Inner slice' },
    { key: 'region', label: 'Region $D$' },
  ],
  legend: { id: 'f', title: '$f(x,y)$', low: 'low', high: 'high' },
  scenarios: SCENARIOS.iterated,
  defaultState() {
    return {
      scenarioId: 'para-sq',
      surfaceId: 'paraboloid',
      params: { a: 1, b: 1, c: 0 },
      region: 'rect',
      order: 'xy',
      R: 1,
      probe: { x: 0.4, y: 0.4, z: 0 },
      xMin: 0,
      xMax: 1,
      yMin: 0,
      yMax: 1,
      show: { surface: true, slice: true, region: true },
    };
  },
  controls() {
    return `
      <div class="lab-block">
        <label class="field">
          <span>Order</span>
          <select id="it-order">
            <option value="xy">dy dx (y inner)</option>
            <option value="yx">dx dy (x inner)</option>
          </select>
        </label>
        <label class="field" id="it-x-field">
          <span>x</span>
          <div class="slider-row">
            <input type="range" id="it-x" min="0" max="1" step="0.01" value="0.4" />
            <span class="mono val" id="it-x-val">0.40</span>
          </div>
        </label>
        <label class="field" id="it-y-field">
          <span>y</span>
          <div class="slider-row">
            <input type="range" id="it-y" min="0" max="1" step="0.01" value="0.4" />
            <span class="mono val" id="it-y-val">0.40</span>
          </div>
        </label>
      </div>`;
  },
  bind(api) {
    document.getElementById('it-order').addEventListener('change', (e) => {
      api.slice().order = e.target.value;
      api.bump();
    });
    document.getElementById('it-x').addEventListener('input', (e) => {
      api.slice().probe.x = Number(e.target.value);
      api.bump();
    });
    document.getElementById('it-y').addEventListener('input', (e) => {
      api.slice().probe.y = Number(e.target.value);
      api.bump();
    });
  },
  syncControls(state) {
    const orderEl = document.getElementById('it-order');
    if (!orderEl) return;
    orderEl.value = state.order === 'yx' ? 'yx' : 'xy';
    const b = bounds(state);
    const xEl = document.getElementById('it-x');
    const yEl = document.getElementById('it-y');
    const xa = b.xa ?? state.xMin;
    const xb = b.xb ?? state.xMax;
    const ya = b.ya ?? state.yMin;
    const yb = b.yb ?? state.yMax;
    xEl.min = String(xa);
    xEl.max = String(xb);
    yEl.min = String(ya);
    yEl.max = String(yb);
    xEl.value = state.probe.x;
    yEl.value = state.probe.y;
    document.getElementById('it-x-val').textContent = Number(state.probe.x).toFixed(2);
    document.getElementById('it-y-val').textContent = Number(state.probe.y).toFixed(2);
    document.getElementById('it-x-field').hidden = state.order === 'yx';
    document.getElementById('it-y-field').hidden = state.order !== 'yx';
  },
  applyScenario(id, state) {
    applyData('iterated', id, state);
    if (!state.order) state.order = 'xy';
    if (!state.region) state.region = 'rect';
  },
  extent(state) {
    const b = bounds(state);
    if (b.kind === 'disk') return Math.max(b.R, 1.2);
    return Math.max(Math.abs(b.xa ?? 0), Math.abs(b.xb ?? 0), Math.abs(b.ya ?? 0), Math.abs(b.yb ?? 1), 1);
  },
  recompute(state, computed) {
    const surf = surfaceById(state.surfaceId);
    const p = state.params;
    const fn = (x, y) => surf.f(x, y, p);
    const b = bounds(state);
    const order = state.order === 'yx' ? 'yx' : 'xy';
    state.order = order;

    const afn = (x, y) => Math.abs(fn(x, y));
    let Ixy;
    let Iyx;
    let Iabs;
    let closed = NaN;
    if (b.kind === 'rect') {
      Ixy = integral2(fn, b.xa, b.xb, b.ya, b.yb, { order: 'xy', n: 64 });
      Iyx = integral2(fn, b.xa, b.xb, b.ya, b.yb, { order: 'yx', n: 64 });
      Iabs = integral2(afn, b.xa, b.xb, b.ya, b.yb, { order: 'xy', n: 64 });
      closed = closedRect(surf.id, b.xa, b.xb, b.ya, b.yb, p);
      state.xMin = b.xa;
      state.xMax = b.xb;
      state.yMin = b.ya;
      state.yMax = b.yb;
    } else if (b.kind === 'disk') {
      Ixy = integralTypeI(fn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      Iyx = integralTypeII(fn, b.typeII.ya, b.typeII.yb, b.typeII.xLo, b.typeII.xHi, { n: 80 });
      Iabs = integralTypeI(afn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      closed = closedDisk(surf.id, b.R, p);
      state.xMin = -b.R;
      state.xMax = b.R;
      state.yMin = -b.R;
      state.yMax = b.R;
      state.R = b.R;
    } else {
      Ixy = integralTypeI(fn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      Iyx = b.xLo ? integralTypeII(fn, b.ya, b.yb, b.xLo, b.xHi, { n: 80 }) : NaN;
      Iabs = integralTypeI(afn, b.xa, b.xb, b.yLo, b.yHi, { n: 80 });
      if (state.region === 'triangle') closed = closedTriangle(surf.id, p);
      state.xMin = b.xa;
      state.xMax = b.xb;
      state.yMin = b.yLo(b.xa);
      state.yMax = Math.max(b.yHi(b.xa), b.yHi(0.5 * (b.xa + b.xb)), b.yHi(b.xb));
    }

    let x = Number.isFinite(state.probe.x) ? state.probe.x : 0.5 * ((b.xa ?? 0) + (b.xb ?? 1));
    let y = Number.isFinite(state.probe.y) ? state.probe.y : 0.5 * ((b.ya ?? 0) + (b.yb ?? 1));
    x = Math.max(b.xa ?? state.xMin, Math.min(b.xb ?? state.xMax, x));
    if (b.ya != null) y = Math.max(b.ya, Math.min(b.yb, y));
    if (b.yLo && b.yHi) {
      const lo = b.yLo(x);
      const hi = b.yHi(x);
      if (hi > lo) y = Math.max(lo, Math.min(hi, y));
    }
    state.probe.x = x;
    state.probe.y = y;

    const yLo = b.yLo ? b.yLo(x) : state.yMin;
    const yHi = b.yHi ? b.yHi(x) : state.yMax;
    const xLo = b.xLo ? b.xLo(y) : state.xMin;
    const xHi = b.xHi ? b.xHi(y) : state.xMax;
    const innerY = yHi > yLo ? simpson((yy) => fn(x, yy), yLo, yHi) : 0;
    const innerX = xHi > xLo ? simpson((xx) => fn(xx, y), xLo, xHi) : 0;
    const fP = fn(x, y);

    computed.surf = surf;
    computed.tex = surf.tex(p);
    computed.bounds = b;
    computed.Ixy = Ixy;
    computed.Iyx = Iyx;
    computed.closed = closed;
    computed.innerY = innerY;
    computed.innerX = innerX;
    computed.yLo = yLo;
    computed.yHi = yHi;
    computed.xLo = xLo;
    computed.xHi = xHi;
    computed.f = fP;
    computed.order = order;
    const a = Number.isFinite(closed) ? closed : Ixy;
    computed.Iabs = Iabs;
    computed.agree = agree(Ixy, Iyx, Iabs) && (!Number.isFinite(closed) || agree(Ixy, closed, Iabs));
    computed.truth = a;
  },
  syncViews(state, computed, ctx) {
    const show = state.show || {};
    const surf = computed.surf;
    const p = state.params;
    const f = (x, y) => surf.f(x, y, p);
    const b = computed.bounds;
    ctx.pool.surface().setVisible(true);
    ctx.pool.surface().sync({
      f,
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      probe: state.probe,
      fP: computed.f,
      show: show.surface !== false,
    });
    const xy = computed.order === 'xy';
    ctx.pool.slices().setVisible(!!show.slice);
    ctx.pool.slices().sync({
      f,
      probe: state.probe,
      fP: computed.f,
      fx: 0,
      fy: 0,
      xMin: xy ? state.probe.x : computed.xLo,
      xMax: xy ? state.probe.x : computed.xHi,
      yMin: xy ? computed.yLo : state.probe.y,
      yMax: xy ? computed.yHi : state.probe.y,
      showX: !xy,
      showY: xy,
      showTan: false,
    });
    ctx.pool.region().setVisible(!!show.region);
    ctx.pool.region().sync({
      kind: b.kind === 'disk' ? 'disk' : b.kind === 'typeI' ? 'typeI' : 'rect',
      xMin: state.xMin,
      xMax: state.xMax,
      yMin: state.yMin,
      yMax: state.yMax,
      R: b.R,
      yLo: b.yLo,
      yHi: b.yHi,
      xa: b.xa,
      xb: b.xb,
      show: !!show.region,
    });
    ctx.pool.probe().setVisible(true);
    ctx.pool.probe().sync(state.probe, computed.f, 'P');
  },
  law(state) {
    if (state?.order === 'yx') {
      return ['\\displaystyle\\iint_D f\\,dA = \\int_{c}^{d}\\!\\int_{a}^{b} f\\,dx\\,dy'];
    }
    return ['\\displaystyle\\iint_D f\\,dA = \\int_{a}^{b}\\!\\int_{c}^{d} f\\,dy\\,dx'];
  },
  liveRows(state, computed) {
    const closed = Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : 'no closed form';
    const yx = Number.isFinite(computed.Iyx) ? `$${fmt(computed.Iyx)}$` : '—';
    return (
      kv('$f$', `$${computed.tex}$`) +
      kv('$P$', `$(${fmt(state.probe.x)}, ${fmt(state.probe.y)})$`) +
      kv('inner $\\int f\\,dy$ at this $x$', `$${fmt(computed.innerY)}$`) +
      kv('inner $\\int f\\,dx$ at this $y$', `$${fmt(computed.innerX)}$`) +
      kv('$\\int\\int\\,dy\\,dx$', `$${fmt(computed.Ixy)}$`) +
      kv('$\\int\\int\\,dx\\,dy$', yx) +
      kv('closed form', closed)
    );
  },
  readout(state, computed) {
    return cells([
      ['$dy\\,dx$', `$${fmt(computed.Ixy)}$`],
      ['$dx\\,dy$', Number.isFinite(computed.Iyx) ? `$${fmt(computed.Iyx)}$` : '—'],
      ['closed', Number.isFinite(computed.closed) ? `$${fmt(computed.closed)}$` : '—'],
      ['Fubini', computed.agree ? 'yes' : 'check $n$'],
    ]);
  },
  coach(state, computed) {
    const body = [];
    if (computed.bounds.kind === 'rect') {
      body.push(
        'On a rectangle, hold $x$ fixed and integrate in $y$, then integrate that result in $x$. Theorem 21 (Fubini) says the other order — $x$ inner, then $y$ — gives the same number when $f$ is continuous.',
      );
    } else if (computed.bounds.kind === 'disk') {
      body.push(
        'The disk is a type I region: $x$ runs from $-R$ to $R$, and for each $x$ the inner $y$ runs between the two halves of $y=\\pm\\sqrt{R^2-x^2}$. Type II swaps the roles of $x$ and $y$. Both iterated integrals equal $\\iint_{D_R} f\\,dA$.',
      );
    } else {
      body.push(
        'On a type I region the inner limits are functions of $x$: $y$ runs from a lower curve to an upper curve. If a type II description exists, that is an independent route to the same integral.',
      );
    }
    body.push(eq('\\iint_D f\\,dA = \\int_a^b\\int_{c}^{d} f\\,dy\\,dx = \\int_c^d\\int_{a}^{b} f\\,dx\\,dy'));
    body.push(
      `The gold outline is $D$. The highlighted slice is the inner integral at the current outer variable. ${computed.agree ? 'The two orders agree.' : 'The two orders are still settling.'}`,
    );
    return { title: 'Iterated integrals', body };
  },
  plot: () => null,
});
