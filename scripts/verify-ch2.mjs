import fs from 'node:fs';
import path from 'node:path';
import { chromium } from './playwright.mjs';

const out = path.resolve('scripts/output');
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});

const labs = ['polar', 'parametric', 'extrema', 'gradient'];
const snap = {};

await page.goto('http://localhost:5175/#/ch2/polar', { waitUntil: 'networkidle', timeout: 30000 });

for (const id of labs) {
  await page.evaluate((h) => {
    location.hash = h;
  }, `#/ch2/${id}`);
  await page.waitForFunction((lab) => window.__flux?.state?.lab === lab, id, { timeout: 15000 });
  await page.waitForTimeout(500);
  snap[id] = await page.evaluate(() => {
    const c = window.__flux.computed;
    return { lab: window.__flux.state.lab, keys: Object.keys(c).slice(0, 12), f: c.f, r: c.r, x: c.x, D: c.D, Lsimp: c.Lsimp, err: c.err };
  });
  await page.screenshot({ path: path.join(out, `${id}.png`), fullPage: true });
}

await page.setViewportSize({ width: 390, height: 844 });
await page.evaluate(() => {
  location.hash = '#/ch2/polar';
});
await page.waitForFunction(() => window.__flux?.state?.lab === 'polar');
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(out, 'polar-phone.png'), fullPage: true });

await browser.close();

const fail = [];
if (snap.polar.lab !== 'polar' || !(snap.polar.r > 0)) fail.push('polar');
if (snap.parametric.lab !== 'parametric' || !Number.isFinite(snap.parametric.Lsimp)) fail.push('parametric');
if (snap.extrema.lab !== 'extrema' || !Number.isFinite(snap.extrema.D)) fail.push('extrema');
if (snap.gradient.lab !== 'gradient' || !Number.isFinite(snap.gradient.f)) fail.push('gradient');
if (errors.length) fail.push(`errors: ${errors.join(' | ')}`);

console.log(JSON.stringify({ snap, errors }, null, 2));
if (fail.length) {
  console.error('VERIFY FAIL', fail);
  process.exit(1);
}
console.log('verify-ch2 ok');
