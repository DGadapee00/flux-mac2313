#!/usr/bin/env node
/**
 * Runs the browser checks against a server this script owns.
 *
 * smoke.mjs and verify*.mjs each expect http://localhost:5175 to already be serving, which meant
 * they only ran if you remembered to start one — so a failing assertion in verify.mjs sat
 * unnoticed. This builds, serves `dist/`, runs them all, and shuts the server down again.
 *
 *   node scripts/browser-checks.mjs [name ...]     (default: smoke, verify)
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = 5175;
const wanted = process.argv.slice(2);
const checks = (wanted.length ? wanted : ['smoke', 'verify']).map((n) =>
  n.endsWith('.mjs') ? n : `scripts/${n}.mjs`,
);

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: 'inherit', ...opts });
    c.on('error', reject);
    c.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`))));
  });

const reachable = async () => {
  try {
    const r = await fetch(`http://localhost:${PORT}/`);
    return r.ok;
  } catch {
    return false;
  }
};

await run('npx', ['vite', 'build']);

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], {
  stdio: ['ignore', 'pipe', 'inherit'],
});
server.stdout.resume();

let up = false;
for (let i = 0; i < 60 && !up; i++) {
  up = await reachable();
  if (!up) await new Promise((r) => setTimeout(r, 250));
}
if (!up) {
  server.kill();
  console.error(`browser-checks: nothing serving on ${PORT}`);
  process.exit(1);
}

let failed = 0;
for (const script of checks) {
  console.log(`\n--- ${script} ---`);
  try {
    await run('node', [script]);
  } catch (e) {
    failed += 1;
    console.error(String(e.message));
  }
}

server.kill();
await once(server, 'exit').catch(() => {});
if (failed) {
  console.error(`\nbrowser-checks: ${failed} failed`);
  process.exit(1);
}
console.log('\nbrowser-checks: all passed');
