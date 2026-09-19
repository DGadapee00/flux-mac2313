/**
 * 1D adaptive Simpson and a 2D tensor-product composite Simpson.
 *
 * The 2D integrator takes its integration order as a parameter so Fubini (dx inner vs dy inner)
 * is a real second route, not the same loop run twice.
 */

function compositeSimpson(f, a, b, n) {
  if (n < 2) n = 2;
  if (n % 2) n += 1;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += f(x) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * sum;
}

function simpsonPanel(f, a, b) {
  const m = 0.5 * (a + b);
  return ((b - a) / 6) * (f(a) + 4 * f(m) + f(b));
}

function adaptiveRec(f, a, b, fa, fm, fb, S, tol, depth) {
  const m = 0.5 * (a + b);
  const lm = 0.5 * (a + m);
  const rm = 0.5 * (m + b);
  const flm = f(lm);
  const frm = f(rm);
  const SL = ((m - a) / 6) * (fa + 4 * flm + fm);
  const SR = ((b - m) / 6) * (fm + 4 * frm + fb);
  const err = SL + SR - S;
  if (depth <= 0 || Math.abs(err) < 15 * tol) return SL + SR + err / 15;
  return (
    adaptiveRec(f, a, m, fa, flm, fm, SL, tol / 2, depth - 1) +
    adaptiveRec(f, m, b, fm, frm, fb, SR, tol / 2, depth - 1)
  );
}

export function simpson(f, a, b, tol = 1e-8, maxDepth = 20) {
  const fa = f(a);
  const fb = f(b);
  const m = 0.5 * (a + b);
  const fm = f(m);
  const S = ((b - a) / 6) * (fa + 4 * fm + fb);
  return adaptiveRec(f, a, b, fa, fm, fb, S, tol, maxDepth);
}

/**
 * ∬_R f(x,y) dA on a rectangle.
 *
 * `order: 'xy'` → ∫_{xa}^{xb} ( ∫_{ya}^{yb} f(x,y) dy ) dx
 * `order: 'yx'` → ∫_{ya}^{yb} ( ∫_{xa}^{xb} f(x,y) dx ) dy
 *
 * n is the number of composite-Simpson panels along each axis (forced even).
 */
export function integral2(f, xa, xb, ya, yb, { order = 'xy', n = 64 } = {}) {
  if (order === 'yx') {
    const inner = (y) => compositeSimpson((x) => f(x, y), xa, xb, n);
    return compositeSimpson(inner, ya, yb, n);
  }
  const inner = (x) => compositeSimpson((y) => f(x, y), ya, yb, n);
  return compositeSimpson(inner, xa, xb, n);
}

/**
 * ∫_{θ=t0}^{t1} ∫_{r=r0}^{r1} f(r,θ) r dr dθ — the Jacobian is included here, not by the caller.
 */
export function integralPolar(f, r0, r1, t0, t1, { n = 64 } = {}) {
  return integral2((r, th) => f(r, th) * r, r0, r1, t0, t1, { order: 'xy', n });
}

/**
 * Type I: ∫_{xa}^{xb} ∫_{yLo(x)}^{yHi(x)} f(x,y) dy dx.
 * Type II: ∫_{ya}^{yb} ∫_{xLo(y)}^{xHi(y)} f(x,y) dx dy.
 * Independent loops — Fubini on a non-rectangle is a real second route.
 */
export function integralTypeI(f, xa, xb, yLo, yHi, { n = 64 } = {}) {
  const inner = (x) => {
    const lo = yLo(x);
    const hi = yHi(x);
    if (!(hi > lo)) return 0;
    return compositeSimpson((y) => f(x, y), lo, hi, n);
  };
  return compositeSimpson(inner, xa, xb, n);
}

export function integralTypeII(f, ya, yb, xLo, xHi, { n = 64 } = {}) {
  const inner = (y) => {
    const lo = xLo(y);
    const hi = xHi(y);
    if (!(hi > lo)) return 0;
    return compositeSimpson((x) => f(x, y), lo, hi, n);
  };
  return compositeSimpson(inner, ya, yb, n);
}

export { compositeSimpson };
