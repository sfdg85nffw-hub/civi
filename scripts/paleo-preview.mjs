// Render the reconstructed land at given ages (Ma) to an equirect contact sheet.
// usage: node scripts/paleo-preview.mjs out.png 0 66 150 250 400 750
import fs from 'node:fs';
import zlib from 'node:zlib';
import { encodePNG } from './png.mjs';
import { plateRotations, qInv, qRot, ll, toLL } from '../src/data/paleo.ts';

function decodePNG(buf) {
  let pos = 8, w = 0, h = 0, ch = 4;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ch = data[9] === 6 ? 4 : 3; }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const out = new Uint8Array(w * h * ch);
  const stride = w * ch;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= ch ? out[y * stride + x - ch] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= ch && y > 0 ? out[(y - 1) * stride + x - ch] : 0;
      let r;
      if (f === 0) r = v; else if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      out[y * stride + x] = r & 255;
    }
  }
  return { w, h, ch, data: out };
}
const mask = decodePNG(fs.readFileSync(new URL('../src/assets/earth/landmask.png', import.meta.url)));
const COLORS = [[220, 120, 80], [230, 200, 90], [120, 200, 100], [100, 160, 230], [240, 110, 200], [250, 160, 40], [235, 235, 240], [150, 230, 230], [180, 120, 240], [255, 90, 90], [90, 255, 160], [140, 140, 140]];
const [out, ...ages] = process.argv.slice(2);
const W = 512, H = 256;
const sheet = new Uint8Array(W * H * ages.length * 3);
ages.forEach((age, k) => {
  const inv = plateRotations(+age).map(qInv);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const lat = 90 - ((y + 0.5) / H) * 180, lon = ((x + 0.5) / W) * 360 - 180;
    const p = ll(lat, lon);
    let col = [12, 22, 48];
    for (let i = 0; i < inv.length; i++) {
      const [la, lo] = toLL(qRot(inv[i], p));
      const mx = Math.floor(((lo + 180) / 360) * mask.w) % mask.w, my = Math.min(mask.h - 1, Math.floor(((90 - la) / 180) * mask.h));
      const m = (my * mask.w + mx) * 4;
      const id = mask.data[m + 1] >> 4;
      if (id !== i) continue;
      if (mask.data[m] > 128) { col = COLORS[i]; break; }
      if (mask.data[m] > 108) col = [30, 50, 90];
    }
    if (Math.abs(lat) < 0.4 || Math.abs(lon) < 0.3) col = col.map((c) => Math.min(255, c + 40));
    const o = ((k * H + y) * W + x) * 3;
    sheet[o] = col[0]; sheet[o + 1] = col[1]; sheet[o + 2] = col[2];
  }
});
fs.writeFileSync(out, encodePNG(W, H * ages.length, sheet, 3));
console.log('wrote', out);
