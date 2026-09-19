/**
 * Named f(x,y) used by the gradient lab. Each surface carries analytic partials — route A —
 * so the lab never differentiates by hand inside a render function.
 *
 * Params default to a = b = 1, c = 0. Problems may overwrite them.
 */

const P = (p) => ({ a: p?.a ?? 1, b: p?.b ?? 1, c: p?.c ?? 0 });

export const SURFACES = {
  paraboloid: {
    id: 'paraboloid',
    name: 'Paraboloid',
    tex: (p) => {
      const { a, b } = P(p);
      return `${fmtC(a)}x^2 + ${fmtC(b)}y^2`;
    },
    f: (x, y, p) => {
      const { a, b } = P(p);
      return a * x * x + b * y * y;
    },
    fx: (x, y, p) => 2 * P(p).a * x,
    fy: (x, y, p) => 2 * P(p).b * y,
  },
  saddle: {
    id: 'saddle',
    name: 'Saddle',
    tex: (p) => {
      const { a, b } = P(p);
      return `${fmtC(a)}x^2 - ${fmtC(b)}y^2`;
    },
    f: (x, y, p) => {
      const { a, b } = P(p);
      return a * x * x - b * y * y;
    },
    fx: (x, y, p) => 2 * P(p).a * x,
    fy: (x, y, p) => -2 * P(p).b * y,
  },
  plane: {
    id: 'plane',
    name: 'Plane',
    tex: (p) => {
      const { a, b, c } = P(p);
      return `${fmtC(a)}x + ${fmtC(b)}y + ${fmtC(c)}`;
    },
    f: (x, y, p) => {
      const { a, b, c } = P(p);
      return a * x + b * y + c;
    },
    fx: (x, y, p) => P(p).a,
    fy: (x, y, p) => P(p).b,
  },
  gaussian: {
    id: 'gaussian',
    name: 'Gaussian bump',
    tex: () => 'e^{-(x^2+y^2)}',
    f: (x, y) => Math.exp(-(x * x + y * y)),
    fx: (x, y) => -2 * x * Math.exp(-(x * x + y * y)),
    fy: (x, y) => -2 * y * Math.exp(-(x * x + y * y)),
  },
  xy: {
    id: 'xy',
    name: 'Product $xy$',
    tex: (p) => `${fmtC(P(p).a)}xy`,
    f: (x, y, p) => P(p).a * x * y,
    fx: (x, y, p) => P(p).a * y,
    fy: (x, y, p) => P(p).a * x,
  },
  bowl: {
    id: 'bowl',
    name: 'Off-centre bowl',
    tex: () => '(x-1)^2 + (y+\\tfrac12)^2',
    f: (x, y) => (x - 1) * (x - 1) + (y + 0.5) * (y + 0.5),
    fx: (x) => 2 * (x - 1),
    fy: (x, y) => 2 * (y + 0.5),
  },
};

function fmtC(c) {
  if (c === 1) return '';
  if (c === -1) return '-';
  return String(c);
}

export function surfaceById(id) {
  return SURFACES[id] || SURFACES.paraboloid;
}

export function evalSurface(surf, x, y, params) {
  return {
    f: surf.f(x, y, params),
    fx: surf.fx(x, y, params),
    fy: surf.fy(x, y, params),
  };
}
