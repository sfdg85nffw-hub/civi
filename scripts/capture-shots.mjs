// Capture every signature shot (or a filtered set) through deep links.
// usage: node scripts/capture-shots.mjs <outDir> [--chapters=0,1] [--res=1280x720] [--all] [--su=0.6] [--warm=12] [--base=http://localhost:5173]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(3).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? '1']; }));
const out = process.argv[2] ?? 'captures/latest';
const res = args.res ?? '1280x720';
const [W, H] = res.split('x').map(Number);
const base = args.base ?? 'http://localhost:5173';
const chapters = args.chapters ? args.chapters.split(',').map(Number) : null;
const warm = args.warm ?? '12';
const seed = args.seed ?? '1234ABCD';
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`${base}/?backend=webgl&capture=1&res=${res}&chapter=0&warm=1&nocard=1&mute=1&seed=${seed}`);
await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 120000 });
if (!chapters || chapters.some((c) => c >= 9)) await page.waitForFunction(() => window.__deeptime?.state().galaxyDone, null, { timeout: 300000 });
const list = (await page.evaluate(() => window.__deeptime.shots())).filter((s) => (args.all ? true : s.signature) && (!chapters || chapters.includes(s.chapter)));
const index = [];
for (const s of list) {
  const su = s.su ?? args.su ?? '0.6';
  const url = `${base}/?backend=webgl&capture=1&res=${res}&chapter=${s.chapter}&shot=${s.index}&su=${su}&nocard=1&warm=${warm}&quality=${args.quality ?? 'high'}&mute=1&seed=${seed}`;
  const t0 = Date.now();
  await page.goto(url, { timeout: 180000, waitUntil: 'commit' });
  await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 240000 });
  const file = path.join(out, `c${String(s.chapter).padStart(2, '0')}_s${s.index}_${s.id}.png`);
  await page.screenshot({ path: file, timeout: 240000 });
  index.push({ file, chapter: s.chapter, shot: s.index, id: s.id, label: s.label });
  console.log(`${file}  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify(index, null, 2));
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].filter((e) => !/ReadPixels|popErrorScope/.test(e)).join('\n'));
await browser.close();
