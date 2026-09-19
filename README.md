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

## First pass

One finished lab: **Gradient** (`#/ch2/gradient`). Surface, level curves, a draggable point $P$, $\nabla f$, a unit direction $\hat u$, and $D_{\hat u} f$ computed two ways (dot product vs the difference quotient). Later chapters are listed as coming.

Practice (**P**) has about ten generated problems for that unit. Progress stays in this browser.

Notation follows Merino: $(x,y)$, $\gamma(t)$, $D_u f$ with a unit vector, $\nabla f = (\partial f/\partial x, \partial f/\partial y)$.

## What the tests check

Nothing is checked against itself. Analytic partials vs central differences; $D_{\hat u} f$ vs the difference quotient; steepest-ascent angle vs a 720-step sweep of that quotient; Fubini order swap; polar area (with the $r\,dr\,d\theta$ Jacobian) vs a Cartesian indicator. The problem bank is then run through the lab’s own `recompute`.
