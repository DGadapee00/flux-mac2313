import { chromium } from './playwright.mjs';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text());
});

async function go(hash, lab) {
  await page.evaluate((h) => {
    location.hash = h;
  }, hash);
  if (lab) {
    await page.waitForFunction((id) => window.__flux?.state?.lab === id, lab, { timeout: 10000 });
  } else {
    await page.waitForFunction(() => window.__flux?.app?.lab == null, null, { timeout: 10000 });
  }
  await page.waitForTimeout(400);
}

await page.goto('http://localhost:5175/#/ch2/gradient', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForFunction((id) => window.__flux?.state?.lab === id, 'gradient', { timeout: 10000 });
await page.waitForTimeout(800);

const g = await page.evaluate(() => {
  const c = document.getElementById('c');
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  const app = window.__flux;
  return {
    w: c.width,
    h: c.height,
    gl: !!gl,
    lab: app?.state?.lab,
    f: app?.computed?.f,
    fx: app?.computed?.fx,
    fy: app?.computed?.fy,
    Du: app?.computed?.Du,
    Dq: app?.computed?.Dq,
  };
});

const mismatches = [];
function check(name, got, exp, tol = 0.05) {
  if (!Number.isFinite(got)) {
    mismatches.push({ name, got, exp });
    return;
  }
  const rel = Math.abs(got - exp) / (exp !== 0 ? Math.abs(exp) : 1);
  if (rel > tol) mismatches.push({ name, got, exp, rel });
}

if (!g.gl) mismatches.push({ name: 'webgl', got: false, exp: true });
if (g.lab !== 'gradient') mismatches.push({ name: 'lab', got: g.lab, exp: 'gradient' });
if (!Number.isFinite(g.f)) mismatches.push({ name: 'f', got: g.f, exp: 'finite' });
check('Du vs Dq', g.Du, g.Dq, 0.05);

await go('#/ch1', null);
await page.waitForTimeout(300);
await go('#/ch2/gradient', 'gradient');
await page.goBack();
await page.waitForTimeout(400);
const afterBack = await page.evaluate(() => location.hash);

await browser.close();

if (errors.length) {
  console.error('page errors:', errors);
  process.exit(1);
}
if (mismatches.length) {
  console.error('mismatches:', mismatches);
  process.exit(1);
}
console.log('smoke: gradient lab ok', { f: g.f, Du: g.Du, back: afterBack });
