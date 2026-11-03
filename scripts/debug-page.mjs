// Debug helper: load a deep link headlessly, print console errors and app state until ready, then screenshot.
// usage: node scripts/debug-page.mjs "<url>" [out.png]
import { chromium } from 'playwright';
const url = process.argv[2];
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log(m.type(), m.text().slice(0, 400)); });
await page.goto(url);
for (let i = 0; i < 24; i++) {
  await new Promise((r) => setTimeout(r, 5000));
  const st = await page.evaluate(() => window.__deeptime ? { ready: window.__deeptime.ready, ...window.__deeptime.state() } : null);
  console.log(JSON.stringify(st));
  if (st && st.ready) break;
}
await page.screenshot({ timeout: 300000, path: process.argv[3] ?? '/tmp/claude-0/-home-user-civi/a514a8c4-fb3d-5876-a446-68cf72d8d448/scratchpad/dbg.png' });
await browser.close();
