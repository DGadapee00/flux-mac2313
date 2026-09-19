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
import { toPolar, toCart, rHat, thetaHat, wrapTau } from './polar.js';
import { CURVES, evalCurve, polylineLength } from './curves.js';
import { hessian, classify } from './extrema.js';

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

console.log('polar: round-trip and basis');
{
  const pts = [
    [1, 0],
    [0, 1],
    [-1, 0],
    [0, -1],
    [1.2, 0.9],
    [-0.7, 1.4],
    [-1.1, -0.5],
    [0.4, -1.3],
  ];
  for (const [x, y] of pts) {
    const pol = toPolar(x, y);
    const back = toCart(pol.r, pol.theta);
    absApprox(back.x, x, 1e-12, `round-trip x (${x},${y})`);
    absApprox(back.y, y, 1e-12, `round-trip y (${x},${y})`);
    approx(pol.r * pol.r, x * x + y * y, 1e-12, `r^2 (${x},${y})`);
    ok(pol.theta >= 0 && pol.theta < 2 * Math.PI, `θ in [0, 2π) for (${x},${y})`);
    const rh = rHat(pol.theta);
    const th = thetaHat(pol.theta);
    absApprox(rh.x * th.x + rh.y * th.y, 0, 1e-12, `r-hat · θ-hat (${x},${y})`);
    approx(rh.x * th.y - rh.y * th.x, 1, 1e-12, `det(r-hat, θ-hat)=1 (${x},${y})`);
  }
  const o = toPolar(0, 0);
  absApprox(o.r, 0, 0, 'origin r = 0');
  ok(!Number.isFinite(o.theta), 'origin θ undefined');
  absApprox(wrapTau(-Math.PI / 2), 1.5 * Math.PI, 1e-12, 'wrap −π/2 → 3π/2');
  absApprox(wrapTau(2 * Math.PI), 0, 1e-12, 'wrap 2π → 0');
}

console.log('parametric: derivatives and arc length');
{
  const circ = CURVES.circle;
  const e = evalCurve(circ, Math.PI / 2);
  absApprox(e.x, 0, 1e-12, 'circle γ(π/2).x');
  absApprox(e.y, 1, 1e-12, 'circle γ(π/2).y');
  absApprox(e.xp, -1, 1e-12, "circle γ'(π/2).x");
  absApprox(e.yp, 0, 1e-12, "circle γ'(π/2).y");
  ok(e.tangent === 'horizontal', 'circle at π/2 is horizontal');
  approx(circ.length(0, 2 * Math.PI), 2 * Math.PI, 1e-12, 'circle closed length 2π');
  const Ls = simpson((t) => circ.speed(t), 0, 2 * Math.PI);
  approx(Ls, 2 * Math.PI, 1e-6, 'circle Simpson length');
  approx(polylineLength(circ, 0, 2 * Math.PI, 800), 2 * Math.PI, 0.002, 'circle polyline length');

  const par = CURVES.parabola;
  const Lp = par.length(-1, 1);
  const Ls2 = simpson((t) => par.speed(t), -1, 1);
  approx(Ls2, Lp, 1e-5, 'parabola Simpson vs closed form');
  approx(polylineLength(par, -1, 1, 800), Lp, 0.005, 'parabola polyline vs closed form');

  const cub = evalCurve(CURVES.cubic, 0);
  absApprox(cub.x, 0, 1e-12, 'cubic γ(0).x');
  absApprox(cub.y, 0, 1e-12, 'cubic γ(0).y');
  ok(cub.tangent === 'vertical', 'cubic at t=0 is vertical (x′=0, y′≠0)');
}

console.log('Hessian test');
{
  const para = classify(SURFACES.paraboloid, 0, 0, { a: 1, b: 1 });
  ok(para.critical, 'paraboloid (0,0) critical');
  ok(para.kind === 'min', 'paraboloid is a min');
  approx(para.D, 4, 1e-12, 'paraboloid D=4');

  const sad = classify(SURFACES.saddle, 0, 0, { a: 1, b: 1 });
  ok(sad.kind === 'saddle', 'saddle classified');
  approx(sad.D, -4, 1e-12, 'saddle D=−4');

  const gau = classify(SURFACES.gaussian, 0, 0, {});
  ok(gau.kind === 'max', 'gaussian is a max');
  approx(gau.D, 4, 1e-12, 'gaussian D=4');

  const c0 = classify(SURFACES.cubic, 0, 0, {});
  ok(c0.kind === 'saddle', 'cubic (0,0) saddle');
  const c1 = classify(SURFACES.cubic, 1, 1, {});
  ok(c1.kind === 'min', 'cubic (1,1) min');
  approx(c1.D, 27, 1e-12, 'cubic (1,1) D=27');

  const H = hessian(0, 0, 0);
  ok(H.kind === 'inconclusive', 'D=0 inconclusive');

  const fn = (x, y) => x * x * x + y * y * y - 3 * x * y;
  const x = 0.4;
  const y = 0.3;
  const an = evalSurface(SURFACES.cubic, x, y, {});
  approx(d2fdx2(fn, x, y), an.fxx, 2e-3, 'cubic fxx numeric');
  approx(d2fdy2(fn, x, y), an.fyy, 2e-3, 'cubic fyy numeric');
  approx(d2fdxdy(fn, x, y), an.fxy, 2e-3, 'cubic fxy numeric');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed) process.exit(1);
console.log('selftest ok');
