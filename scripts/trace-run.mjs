// Trace app state (layers, post) while running the Odyssey from s0 to s1 in capture mode.
// usage: node scripts/trace-run.mjs <s0> <s1> [quality] [base]
import { chromium } from 'playwright';
const [s0, s1] = [Number(process.argv[2]), Number(process.argv[3])];
const q = process.argv[4] ?? 'low';
const base = process.argv[5] ?? 'http://localhost:4173';
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/ReadPixels|Performance/.test(m.text())) console.log('error', m.text().slice(0, 300)); });
await page.goto(`${base}/?backend=webgl&capture=1&fps=10&res=320x180&quality=${q}&seed=1234ABCD&autostart=1&mute=1&warm=2&s=${s0}`);
await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 300000 });
for (;;) {
  const st = await page.evaluate(() => window.__deeptime.state());
  console.log(st.s.toFixed(2), JSON.stringify(st.layers), JSON.stringify(st.post), 'lod', st.lodMix.toFixed(2));
  if (st.s >= s1) break;
  await page.evaluate(() => window.__deeptime.run(3));
  await page.evaluate(() => window.__deeptime.frames(3));
}
await browser.close();
