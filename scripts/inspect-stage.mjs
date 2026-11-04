// Run from s0 to s1 and dump a stage's uniform values (capture-mode diagnostics).
import { chromium } from 'playwright';
const [s0, s1, name] = [Number(process.argv[2]), Number(process.argv[3]), process.argv[4]];
const browser = await chromium.launch({ args: ['--enable-unsafe-webgpu', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 320, height: 180 } });
await page.goto(`http://localhost:4173/?backend=webgl&capture=1&fps=10&res=320x180&quality=low&seed=1234ABCD&autostart=1&mute=1&warm=2&s=${s0}`);
await page.waitForFunction(() => window.__deeptime?.ready, null, { timeout: 300000 });
for (;;) {
  const st = await page.evaluate(() => window.__deeptime.state());
  const info = await page.evaluate((nm) => {
    const app = window.__deeptimeApp;
    const stg = app.stages.get(nm);
    if (!stg) return null;
    const u = {};
    for (const k in stg.u) { const v = stg.u[k].value; u[k] = typeof v === 'number' ? +v.toFixed(4) : v && v.isColor ? [v.r, v.g, v.b].map((x) => +x.toFixed(3)) : v && v.isVector3 ? [v.x, v.y, v.z].map((x) => +x.toFixed(3)) : String(v).slice(0, 20); }
    const cam = stg.camera;
    const lat = app.sims.latest;
    const fld = lat?.snap?.fields?.mat?.data;
    let fs = null;
    if (fld) { let mx = 0, sum = 0, nan = 0; for (let i = 0; i < fld.length; i++) { const v = fld[i]; if (!Number.isFinite(v)) nan++; else { mx = Math.max(mx, v); sum += v; } } fs = { len: fld.length, mx: +mx.toFixed(3), mean: +(sum / fld.length).toFixed(4), nan }; }
    const fd = stg.fieldData; let fmx = 0; if (fd) for (let i = 0; i < fd.length; i++) fmx = Math.max(fmx, fd[i]);
    return { sim: lat?.sim, ver: lat?.version, fs, texMax: fmx, u, cam: { pos: cam.position.toArray().map((x) => +x.toFixed(3)), near: cam.near, far: cam.far, fov: cam.fov }, children: stg.scene.children.map((c) => (c.visible ? 'v' : 'h') + (c.geometry?.instanceCount ?? '')) };
  }, name);
  console.log(st.s.toFixed(2), JSON.stringify(info).slice(0, 700));
  const shot = await page.screenshot({ timeout: 300000 });
  const mean = await page.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0; for (let k = 0; k < d.length; k += 4) s += d[k] + d[k + 1] + d[k + 2]; return s / (d.length / 4) / 3; }, shot.toString('base64'));
  console.log('   mean', mean.toFixed(1));
  if (st.s >= s1) break;
  await page.evaluate(() => window.__deeptime.run(4));
  await page.evaluate(() => window.__deeptime.frames(4));
}
await browser.close();
