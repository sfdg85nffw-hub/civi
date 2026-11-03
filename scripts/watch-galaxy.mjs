// Watch the Regime B worker's progress on a page (frontier, changes, done).
import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
page.on('console', (m) => console.log('console', m.type(), m.text().slice(0, 300)));
page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
page.on('worker', (w) => { console.log('worker started', w.url()); w.on('close', () => console.log('worker closed')); });
await page.goto(process.argv[2]);
for (let i = 0; i < 12; i++) {
  await new Promise((r) => setTimeout(r, 3000));
  const st = await page.evaluate(() => window.__deeptime ? window.__deeptime.state() : null);
  console.log(st && JSON.stringify({ f: st.frames, done: st.galaxyDone, fr: st.frontier, ch: st.changes }));
}
await browser.close();
