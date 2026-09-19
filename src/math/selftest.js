/**
 * Independent checks for the Calc 3 math layer. Nothing is compared against itself:
 * analytic partials vs central differences, ∇f·û vs the difference quotient, steepest-ascent
 * angle vs a 720-step sweep, Fubini order swap, polar-with-Jacobian vs Cartesian.
 *
 * Run: node src/math/selftest.js
 */
import { add, sub, dot, cross, len, normalize, proj, det2, det3 } from './vec.js';
import { dfdx, dfdy, d2fdx2, d2fdy2, d2fdxdy, gradNumeric, dirQuotient } from './ndiff.js';
import { simpson, integral2, integralPolar } from './quadrature.js';
import { SURFACES, evalSurface } from './surfaces.js';
import { directional, steepestAngle, steepestSweep, wrapPi, unitize, dirFromAngle } from './gradient.js';

let failed = 0;
let passed = 0;

function approx(a, b, tol, name) {
  const scaleB = b !== 0 ? Math.abs(b) : 1;
  const good = Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol * scaleB;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  rel ${Math.abs(a - b) / scaleB}`);
  }
}

function absApprox(a, b, tol, name) {
  const good = Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tol;
  if (good) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
    console.log(`        got ${a}  expected ${b}  abs ${Math.abs(a - b)}`);
  }
}

function ok(cond, name) {
  if (cond) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}`);
  }
}

console.log('vec');
{
  const a = { x: 3, y: 4, z: 0 };
  const b = { x: 1, y: 0, z: 0 };
  approx(len(a), 5, 1e-12, '||(3,4,0)|| = 5');
  approx(dot(a, b), 3, 1e-12, '(3,4)·(1,0) = 3');
  const n = normalize(a);
  approx(n.x, 0.6, 1e-12, 'unit x');
  approx(n.y, 0.8, 1e-12, 'unit y');
  const p = proj(a, b);
  approx(p.x, 3, 1e-12, 'proj onto e1, x');
  absApprox(p.y, 0, 1e-12, 'proj onto e1, y');
  const c = cross({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 });
  approx(c.z, 1, 1e-12, 'e1 × e2 = e3');
  approx(det2(1, 2, 3, 4), -2, 1e-12, 'det2');
  approx(det3([[1, 0, 0], [0, 1, 0], [0, 0, 1]]), 1, 1e-12, 'det3 I');
  const s = add(a, sub(b, a));
  approx(s.x, b.x, 1e-12, 'add/sub inverse');
}

console.log('partials vs finite differences');
{
  const f = (x, y) => x * x * y + y * y * y;
  const fx = (x, y) => 2 * x * y;
  const fy = (x, y) => x * x + 3 * y * y;
  for (const [x, y] of [
    [1, 2],
    [0.3, -0.7],
    [-1.2, 0.4],
  ]) {
    approx(dfdx(f, x, y), fx(x, y), 1e-6, `fx(${x},${y}) numeric`);
    approx(dfdy(f, x, y), fy(x, y), 1e-6, `fy(${x},${y}) numeric`);
    const g = gradNumeric(f, x, y);
    approx(g.x, fx(x, y), 1e-6, `grad.x (${x},${y})`);
    approx(g.y, fy(x, y), 1e-6, `grad.y (${x},${y})`);
  }
}

console.log('Schwarz mixed partials');
{
  // f = sin(x y) + x^2 y  — mixed partials are analytic and continuous.
  const f = (x, y) => Math.sin(x * y) + x * x * y;
  const x = 0.4;
  const y = -0.6;
  const mixed = Math.cos(x * y) - x * y * Math.sin(x * y) + 2 * x;
  approx(d2fdxdy(f, x, y), mixed, 2e-4, 'd2f/dxdy analytic');
  approx(d2fdx2(f, x, y), -y * y * Math.sin(x * y) + 2 * y, 2e-3, 'd2f/dx2');
  approx(d2fdy2(f, x, y), -x * x * Math.sin(x * y), 2e-3, 'd2f/dy2');
}

console.log('named surfaces: analytic vs numeric');
{
  const params = { a: 2, b: 3, c: 1 };
  const pts = [
    [0.5, -0.4],
    [1.1, 0.2],
  ];
  for (const id of Object.keys(SURFACES)) {
    const s = SURFACES[id];
    for (const [x, y] of pts) {
      const an = evalSurface(s, x, y, params);
      const fn = (xx, yy) => s.f(xx, yy, params);
      const g = gradNumeric(fn, x, y);
      approx(g.x, an.fx, 2e-5, `${id} fx at (${x},${y})`);
      approx(g.y, an.fy, 2e-5, `${id} fy at (${x},${y})`);
    }
  }
}

console.log('directional derivative: dot vs difference quotient');
{
  const f = (x, y) => x * x * y + Math.exp(x);
  const fx = (x, y) => 2 * x * y + Math.exp(x);
  const fy = (x, y) => x * x;
  const x = 0.7;
  const y = -0.3;
  const u = unitize(3, 5);
  ok(Math.abs(u.len - Math.hypot(3, 5)) < 1e-12, 'unitize reports original length');
  approx(Math.hypot(u.x, u.y), 1, 1e-12, 'unitize yields a unit vector');
  const Du = directional(fx(x, y), fy(x, y), u.x, u.y);
  const Dq = dirQuotient(f, x, y, u.x, u.y, 1e-6);
  approx(Dq, Du, 2e-5, 'D_u f: quotient vs grad · u');
  absApprox(directional(fx(x, y), fy(x, y), 0, 0), 0, 1e-15, 'D_0 f = 0 (absolute)');
}

console.log('steepest ascent: atan2 vs 720-step sweep');
{
  const f = (x, y) => 3 * x + 4 * y;
  const fx = 3;
  const fy = 4;
  const x = 0.2;
  const y = -0.1;
  const thA = steepestAngle(fx, fy);
  const sweep = steepestSweep(f, x, y, { steps: 720, h: 1e-5 });
  const res = (2 * Math.PI) / 720;
  absApprox(Math.abs(wrapPi(sweep.theta - thA)), 0, 2 * res, 'argmax angle matches atan2(fy,fx)');
  approx(sweep.Du, Math.hypot(fx, fy), 2e-4, 'max quotient equals ||grad f||');
  const u = dirFromAngle(thA);
  approx(directional(fx, fy, u.x, u.y), 5, 1e-12, 'D_u f along grad = 5');
}

console.log('quadrature');
{
  approx(simpson((t) => t * t, 0, 1), 1 / 3, 1e-8, '∫_0^1 x^2 dx = 1/3');
  approx(simpson(Math.sin, 0, Math.PI), 2, 1e-8, '∫_0^π sin = 2');
  const f = (x, y) => x * x * y + y;
  const Ixy = integral2(f, 0, 1, 0, 2, { order: 'xy', n: 64 });
  const Iyx = integral2(f, 0, 1, 0, 2, { order: 'yx', n: 64 });
  // Analytic: ∫_0^1 ∫_0^2 (x^2 y + y) dy dx = ∫_0^1 (x^2 + 1) * 2 dx = 8/3
  approx(Ixy, 8 / 3, 1e-6, 'double integral xy-order');
  approx(Iyx, 8 / 3, 1e-6, 'double integral yx-order');
  absApprox(Ixy - Iyx, 0, 1e-9, 'Fubini: xy order vs yx order');

  const areaPolar = integralPolar((r, th) => 1, 0, 1, 0, 2 * Math.PI, { n: 80 });
  approx(areaPolar, Math.PI, 2e-4, 'polar area of unit disk = π (r dr dθ)');
  const areaCart = integral2((x, y) => (x * x + y * y <= 1 ? 1 : 0), -1, 1, -1, 1, { order: 'xy', n: 200 });
  approx(areaCart, Math.PI, 0.03, 'Cartesian indicator of unit disk ≈ π');
  approx(areaPolar, areaCart, 0.04, 'polar vs Cartesian area of the unit disk');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log('selftest ok');
