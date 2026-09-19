# FLUX — MAC 2313

Interactive 3D labs for Calculus III (Merino, UNF). Units in the top row, labs as tabs, hash URLs so each lab is bookmarkable (`#/ch2/gradient`).

Built on the engine from [flux-phy2049](https://github.com/DGadapee00/flux-phy2049): the problem generator, spaced review, formula palette and the typeset panels are the same contracts; the math and the labs are new.

Repo: https://github.com/DGadapee00/flux-mac2313 (`main`). Source only — none of the course’s lecture notes, worksheets, or Canvas files.

## Run locally

```bash
git clone https://github.com/DGadapee00/flux-mac2313.git
cd flux-mac2313
npm install
npm start
```

Opens at http://localhost:5175/

```bash
npm test    # math self-test (no browser) + the problem-bank check
```

## Labs (Chapter 2)

| Lab | Hash | What it shows |
|---|---|---|
| Polar | `#/ch2/polar` | $(x,y)\leftrightarrow(r,\theta)$ with $\theta\in[0,2\pi)$, $\hat r$ and $\hat\theta$ |
| Parametric | `#/ch2/parametric` | $\gamma(t)=(x(t),y(t))$, tangent, arc length two ways |
| Extrema | `#/ch2/extrema` | Critical points and the Hessian test $D=f_{xx}f_{yy}-(f_{xy})^2$ |
| Gradient | `#/ch2/gradient` | $\nabla f$, $D_{\hat u}f$ by the dot product and by a difference quotient |

Coming: partials-only, chain rule, then Chapters 3–5.

Practice (**P**) has 22 generated problems for this unit. Progress stays in this browser.

Notation follows Merino: $(x,y)$, $\gamma(t)$, $D_u f$ with a unit vector, $\nabla f = (\partial f/\partial x, \partial f/\partial y)$, $\theta\in[0,2\pi)$.

## What the tests check

Nothing is checked against itself. Analytic partials vs central differences; $D_{\hat u} f$ vs the difference quotient; steepest-ascent angle vs a 720-step sweep; polar round-trip and $\hat r\perp\hat\theta$; arc length Simpson vs polyline (and a closed form when we have one); Hessian $D$ vs mixed partials from finite differences; Fubini order swap; polar area (with the $r\,dr\,d\theta$ Jacobian) vs a Cartesian indicator. The problem bank is then run through each lab’s own `recompute`.
