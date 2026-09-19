# Deploying FLUX — MAC 2313

The app is a static site. `npm run build` writes `dist/`. `vite.config.js` sets `base: './'`, and routing is hash-based (`#/ch2/gradient`), so any static host works.

Dev server: port **5175** (PHY 2049 already owns 5174).

Nothing is published yet. When it is, stamp the build (`/version.json`) the same way flux-phy2049 does, and keep `public/robots.txt` plus `public/_headers` asking search engines to skip the site.

Progress is per-origin in `localStorage`. A hosted copy starts everyone at zero.
