// Plays stretches of the Odyssey WITH sound (capture clock) and measures the master output's level
// over story time, so the drama's builds, inhales and hits can be checked without ears.
// usage: node scripts/audio-probe.mjs [--from=76,160,192] [--len=10] [--fps=10] [--base=http://localhost:4173]
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, v ?? '1']; }));
const base = args.base ?? 'http://localhost:4173';
const fps = Number(args.fps ?? 10);
const len = Number(args.len ?? 10);
const froms = (args.from ?? '76').split(',').map(Number);
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error' && !/ReadPixels|popErrorScope|Performance/.test(m.text())) errors.push(m.text()); });
await page.goto(`${base}/?backend=webgl&capture=1&fps=${fps}&res=320x180&quality=low&seed=1234ABCD&warm=2`);
await page.waitForSelector('button.begin:not([disabled])', { timeout: 300000, state: 'attached' });
await page.evaluate(() => document.querySelector('button.begin').click());
await page.waitForFunction(() => window.__deeptime?.ready && window.__deeptimeApp?.audio, null, { timeout: 300000 });
await page.evaluate(() => {
  const a = window.__deeptimeApp.audio;
  const an = a.ctx.createAnalyser();
  an.fftSize = 2048;
  a.master.connect(an);
  window.__probe = { an, buf: new Float32Array(2048) };
});
for (const s0 of froms) {
  await page.evaluate((s) => window.__deeptime.seek(s), s0);
  const rows = [];
  for (;;) {
    await page.evaluate((n) => window.__deeptime.run(n), 1);
    await page.evaluate(() => window.__deeptime.frames(1));
    const r = await page.evaluate(() => {
      const p = window.__probe;
      p.an.getFloatTimeDomainData(p.buf);
      let e = 0, pk = 0;
      for (const v of p.buf) { e += v * v; pk = Math.max(pk, Math.abs(v)); }
      const st = window.__deeptime.state();
      return { s: st.s, rms: Math.sqrt(e / p.buf.length), peak: pk, duck: st.drama?.duck ?? 1, shake: st.drama?.shake ?? 0, glitch: st.drama?.glitch ?? 0 };
    });
    rows.push(r);
    if (r.s >= s0 + len) break;
  }
  console.log(`--- from ${s0}`);
  for (const r of rows.filter((_, i) => i % 3 === 0)) {
    const db = r.rms > 0 ? (20 * Math.log10(r.rms)).toFixed(1) : '-inf';
    console.log(`${r.s.toFixed(2).padStart(7)}  rms ${db.padStart(6)} dB  peak ${r.peak.toFixed(3)}  duck ${r.duck.toFixed(2)}  shake ${r.shake.toFixed(2)}  glitch ${r.glitch.toFixed(2)}`);
  }
}
const log = await page.evaluate(() => window.__deeptime.dramaLog());
for (const d of log) console.log(`  ${d.s.toFixed(2).padStart(7)}  ${d.kind.padEnd(8)} ${d.what}`);
console.log('errors:', [...new Set(errors)]);
await browser.close();
