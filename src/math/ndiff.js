/** 1D difference quotients (Chapter 1). Central vs one-sided is a real second route. */
export function df1(f, x, h = 1e-5) {
  return (f(x + h) - f(x - h)) / (2 * h);
}

export function df1left(f, x, h = 1e-5) {
  return (f(x) - f(x - h)) / h;
}

export function df1right(f, x, h = 1e-5) {
  return (f(x + h) - f(x)) / h;
}

/** Central first partials and a forward difference quotient along a unit direction. */

export function dfdx(f, x, y, h = 1e-5) {
  return (f(x + h, y) - f(x - h, y)) / (2 * h);
}

export function dfdy(f, x, y, h = 1e-5) {
  return (f(x, y + h) - f(x, y - h)) / (2 * h);
}

export function d2fdx2(f, x, y, h = 1e-4) {
  return (f(x + h, y) - 2 * f(x, y) + f(x - h, y)) / (h * h);
}

export function d2fdy2(f, x, y, h = 1e-4) {
  return (f(x, y + h) - 2 * f(x, y) + f(x, y - h)) / (h * h);
}

export function d2fdxdy(f, x, y, h = 1e-4) {
  return (f(x + h, y + h) - f(x + h, y - h) - f(x - h, y + h) + f(x - h, y - h)) / (4 * h * h);
}

export function gradNumeric(f, x, y, h = 1e-5) {
  return { x: dfdx(f, x, y, h), y: dfdy(f, x, y, h), z: 0 };
}

/**
 * The notes' definition: lim h→0 [f(P + h u) − f(P)] / h, evaluated at a small h.
 * `ux, uy` are the components of a unit vector.
 */
export function dirQuotient(f, x, y, ux, uy, h = 1e-5) {
  return (f(x + h * ux, y + h * uy) - f(x, y)) / h;
}

/** Central first and mixed partials of f(x,y,z). */
export function dfdx3(f, x, y, z, h = 1e-5) {
  return (f(x + h, y, z) - f(x - h, y, z)) / (2 * h);
}

export function dfdy3(f, x, y, z, h = 1e-5) {
  return (f(x, y + h, z) - f(x, y - h, z)) / (2 * h);
}

export function dfdz3(f, x, y, z, h = 1e-5) {
  return (f(x, y, z + h) - f(x, y, z - h)) / (2 * h);
}

export function d2fdxdy3(f, x, y, z, h = 1e-4) {
  return (f(x + h, y + h, z) - f(x + h, y - h, z) - f(x - h, y + h, z) + f(x - h, y - h, z)) / (4 * h * h);
}

export function d2fdydx3(f, x, y, z, h = 1e-4) {
  return (f(x + h, y + h, z) - f(x - h, y + h, z) - f(x + h, y - h, z) + f(x - h, y - h, z)) / (4 * h * h);
}

export function d2fdxdz3(f, x, y, z, h = 1e-4) {
  return (f(x + h, y, z + h) - f(x + h, y, z - h) - f(x - h, y, z + h) + f(x - h, y, z - h)) / (4 * h * h);
}

export function d2fdydz3(f, x, y, z, h = 1e-4) {
  return (f(x, y + h, z + h) - f(x, y + h, z - h) - f(x, y - h, z + h) + f(x, y - h, z - h)) / (4 * h * h);
}

export function gradNumeric3(f, x, y, z, h = 1e-5) {
  return { x: dfdx3(f, x, y, z, h), y: dfdy3(f, x, y, z, h), z: dfdz3(f, x, y, z, h) };
}
