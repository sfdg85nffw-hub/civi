// Probe a deep link: report mean/min/max of the rendered frame over several frames (detects white/NaN frames).
// usage: node scripts/probe-frame.mjs "<url>" [frames]
import { chromium } from 'playwright';
const url = process.argv[2];
const n = Number(process.argv[3] ?? 4);
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: Number(process.argv[4] ?? 480), height: Number(process.argv[5] ?? 270) } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('error', m.text().slice(0, 300)); });
await page.goto(url);
await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 300000 });
for (let i = 0; i < n; i++) {
  const buf = await page.screenshot({ timeout: 300000 });
  const st = await page.evaluate(() => window.__deeptime.state());
  // decode PNG mean via canvas in page
  const stats = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data;
    let sum = 0, mx = 0, white = 0;
    for (let k = 0; k < d.length; k += 4) { const v = (d[k] + d[k + 1] + d[k + 2]) / 3; sum += v; mx = Math.max(mx, v); if (v > 250) white++; }
    return { mean: +(sum / (d.length / 4)).toFixed(1), max: mx, whiteFrac: +(white / (d.length / 4)).toFixed(3) };
  }, buf.toString('base64'));
  console.log(JSON.stringify({ frame: st.frames, T: st.T, ...stats }));
  await page.evaluate(() => window.__deeptime.run(1));
  await page.evaluate(() => window.__deeptime.frames(1));
}
await browser.close();
