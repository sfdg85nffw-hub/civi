// Plays the whole Odyssey hands-free in capture mode (virtual clock), grabbing a frame
// every `--every` story seconds for a pacing contact sheet, and reporting console errors.
// usage: node scripts/odyssey-run.mjs <outDir> [--fps=4] [--every=2] [--res=480x270] [--quality=low] [--seed=1234ABCD] [--base=http://localhost:4173]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(3).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? '1']; }));
const out = process.argv[2] ?? 'captures/odyssey';
const fps = Number(args.fps ?? 4);
const every = Number(args.every ?? 2);
const res = args.res ?? '480x270';
const [W, H] = res.split('x').map(Number);
const base = args.base ?? 'http://localhost:4173';
const seed = args.seed ?? '1234ABCD';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
const IGNORE = [/GPU stall due to ReadPixels/, /popErrorScope/, /WebGL-.*Performance/];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.some((r) => r.test(m.text()))) errors.push(m.text()); });
await page.goto(`${base}/?backend=webgl&capture=1&fps=${fps}&res=${res}&quality=${args.quality ?? 'low'}&seed=${seed}&autostart=1&mute=1&warm=2${args.s0 ? '&s=' + args.s0 : ''}`);
await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 300000 });
const t0 = Date.now();
let next = Number(args.s0 ?? 0);
const index = [];
for (;;) {
  const st = await page.evaluate(() => window.__deeptime.state());
  if (st.s >= next) {
    const file = path.join(out, `s${String(Math.round(st.s * 10)).padStart(5, '0')}_c${String(st.chapter).padStart(2, '0')}.png`);
    await page.screenshot({ path: file, timeout: 300000 });
    index.push({ file, s: st.s, T: st.T, chapter: st.chapter, phase: st.phase, waiting: st.speed === 0 });
    console.log(`${((Date.now() - t0) / 1000).toFixed(0)}s  story ${st.s.toFixed(1)} / ${st.total.toFixed(0)}  ch ${st.chapter}  T ${st.T.toExponential(3)}  ${st.phase}${errors.length ? '  ERRORS ' + errors.length : ''}`);
    next = Math.floor(st.s / every) * every + every;
  }
  if (st.phase === 'rest' || st.s >= st.total - 0.01 || (args.s1 && st.s >= Number(args.s1))) break;
  const step = Math.max(1, Math.round((fps * every) / 2));
  await page.evaluate((n) => window.__deeptime.run(n), step);
  await page.evaluate((n) => window.__deeptime.frames(n), step);
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ errors: [...new Set(errors)], index }, null, 2));
console.log('done; errors:', [...new Set(errors)].slice(0, 20));
await browser.close();
