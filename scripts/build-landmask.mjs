// Rasterise the Natural Earth (public domain) 1:50m land polygons into an
// equirectangular mask: R = signed distance to the coast (land > 128),
// G = plate id × 16, B = present-day relief (major ranges), A = 255.
import fs from 'node:fs';
import { feature } from 'topojson-client';
import { encodePNG } from './png.mjs';
import { plateAt } from './plates.mjs';

const W = +(process.argv[2] ?? 4096);
const H = W / 2;
const topo = JSON.parse(fs.readFileSync(new URL('../data/source/ne_land_50m.topo.json', import.meta.url)));
const land = feature(topo, topo.objects.land);

const mask = new Uint8Array(W * H);
// scanline even-odd fill per polygon, robust to antimeridian wrapping
function unwrapRing(ring) {
  const out = [[ring[0][0], ring[0][1]]];
  let off = 0;
  for (let i = 1; i < ring.length; i++) {
    const d = ring[i][0] - ring[i - 1][0];
    if (d > 180) off -= 360;
    else if (d < -180) off += 360;
    out.push([ring[i][0] + off, ring[i][1]]);
  }
  const net = out[out.length - 1][0] - out[0][0];
  if (Math.abs(net) > 300) {
    // encircles a pole: close the ring along it
    const meanLat = out.reduce((a, p) => a + p[1], 0) / out.length;
    const pole = meanLat < 0 ? -90 : 90;
    out.push([out[out.length - 1][0], pole], [out[0][0], pole], [out[0][0], out[0][1]]);
  }
  return out;
}
function fillPolygon(rings) {
  const edges = [];
  for (const raw of rings) {
    const ring = unwrapRing(raw);
    for (let i = 0; i < ring.length - 1; i++) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      edges.push([((x0 + 180) / 360) * W, ((90 - y0) / 180) * H, ((x1 + 180) / 360) * W, ((90 - y1) / 180) * H]);
    }
  }
  let ymin = H, ymax = 0;
  for (const e of edges) {
    ymin = Math.min(ymin, e[1], e[3]);
    ymax = Math.max(ymax, e[1], e[3]);
  }
  for (let y = Math.max(0, Math.floor(ymin)); y <= Math.min(H - 1, Math.ceil(ymax)); y++) {
    const yc = y + 0.5;
    const xs = [];
    for (const [x0, y0, x1, y1] of edges) {
      if ((y0 <= yc && y1 > yc) || (y1 <= yc && y0 > yc)) xs.push(x0 + ((yc - y0) / (y1 - y0)) * (x1 - x0));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const a = Math.ceil(xs[k] - 0.5);
      const b = Math.floor(xs[k + 1] - 0.5);
      for (let x = a; x <= b; x++) mask[y * W + (((x % W) + W) % W)] ^= 1;
    }
  }
}
for (const f of land.features) {
  const g = f.geometry;
  const polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
  for (const p of polys) fillPolygon(p);
}
// Antarctic interior is land everywhere south of 85°S
for (let y = Math.floor(H * (175 / 180)); y < H; y++) for (let x = 0; x < W; x++) mask[y * W + x] = 1;

// --- exact Euclidean distance transform (Felzenszwalb) with nearest-feature index ---
const INF = 1e20;
function edt1d(f, n, scale, out, arg) {
  const v = new Int32Array(n), z = new Float64Array(n + 1);
  let k = 0;
  v[0] = 0; z[0] = -INF; z[1] = INF;
  for (let q = 1; q < n; q++) {
    let s;
    for (;;) {
      const p = v[k];
      s = (f[q] + (q * scale) ** 2 - (f[p] + (p * scale) ** 2)) / (2 * scale * scale * (q - p));
      if (s <= z[k]) { k--; if (k < 0) { k = 0; break; } } else break;
    }
    k++; v[k] = q; z[k] = s; z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    out[q] = ((q - v[k]) * scale) ** 2 + f[v[k]];
    arg[q] = v[k];
  }
}
function distanceTo(featureIsOne) {
  // returns squared distance (pixels) and nearest feature index
  const g = new Float64Array(W * H);
  const gy = new Int32Array(W * H);
  const col = new Float64Array(H), colOut = new Float64Array(H), colArg = new Int32Array(H);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) col[y] = (mask[y * W + x] === 1) === featureIsOne ? 0 : INF;
    edt1d(col, H, 1, colOut, colArg);
    for (let y = 0; y < H; y++) { g[y * W + x] = colOut[y]; gy[y * W + x] = colArg[y]; }
  }
  const pad = W / 2, n = W + 2 * pad;
  const row = new Float64Array(n), rowOut = new Float64Array(n), rowArg = new Int32Array(n);
  const d2 = new Float32Array(W * H), near = new Int32Array(W * H);
  for (let y = 0; y < H; y++) {
    const lat = 90 - ((y + 0.5) / H) * 180;
    const c = Math.max(0.02, Math.cos((lat * Math.PI) / 180));
    for (let i = 0; i < n; i++) row[i] = g[y * W + ((i - pad + W) % W)];
    edt1d(row, n, c, rowOut, rowArg);
    for (let x = 0; x < W; x++) {
      d2[y * W + x] = rowOut[x + pad];
      const sx = (rowArg[x + pad] - pad + W) % W;
      near[y * W + x] = gy[y * W + sx] * W + sx;
    }
  }
  return { d2, near };
}
console.time('edt');
const toLand = distanceTo(true);
const toSea = distanceTo(false);
console.timeEnd('edt');

const kmPerPx = 40030 / W;
// relief: major ranges as polylines [lat, lon] with width (km) and height
const RANGES = [
  { h: 1, w: 260, pts: [[35.8, 71], [34.5, 77], [31, 80], [28.6, 84], [27.9, 87], [27.9, 91], [28.4, 95]] }, // Himalaya
  { h: 0.7, w: 500, pts: [[38, 75], [36, 82], [35.5, 90], [34, 97]] }, // Tibet/Kunlun
  { h: 0.85, w: 200, pts: [[8, -73], [0, -78], [-10, -76.5], [-18, -69], [-27, -68.5], [-35, -70], [-45, -72], [-52, -73]] }, // Andes
  { h: 0.6, w: 300, pts: [[60, -138], [55, -128], [49, -116], [44, -110], [39, -106], [33, -107]] }, // Rockies
  { h: 0.45, w: 160, pts: [[45.8, 6.8], [46.5, 9.5], [47, 12], [47.3, 14]] }, // Alps
  { h: 0.35, w: 160, pts: [[34, -84], [37, -81], [40, -78], [43, -73.5], [46, -70]] }, // Appalachians
  { h: 0.3, w: 140, pts: [[67, 63], [61, 59.5], [56, 59], [52, 58.5]] }, // Urals
  { h: 0.45, w: 200, pts: [[37, 47], [36, 51], [34.5, 54], [36, 60]] }, // Alborz / Iranian plateau
  { h: 0.4, w: 220, pts: [[38, 39], [39.5, 43], [41, 44.5], [42.6, 44.5]] }, // Anatolia/Caucasus
  { h: 0.45, w: 260, pts: [[13, 38], [9, 39], [6, 37.5]] }, // Ethiopian highlands
  { h: 0.3, w: 200, pts: [[-28, 29], [-30, 29.5], [-32, 27]] }, // Drakensberg
  { h: 0.3, w: 180, pts: [[-28, 152.5], [-34, 150], [-37, 148.5]] }, // Great Dividing
  { h: 0.4, w: 200, pts: [[32, -5], [31.5, -7], [30.5, -9]] }, // Atlas
  { h: 0.35, w: 140, pts: [[62, 8], [66, 14], [69, 18]] }, // Scandes
];
const relief = new Float32Array(W * H);
for (const r of RANGES) {
  for (let i = 0; i < r.pts.length - 1; i++) {
    const [la0, lo0] = r.pts[i], [la1, lo1] = r.pts[i + 1];
    const steps = 60;
    for (let s = 0; s <= steps; s++) {
      const la = la0 + ((la1 - la0) * s) / steps, lo = lo0 + ((lo1 - lo0) * s) / steps;
      const cx = ((lo + 180) / 360) * W, cy = ((90 - la) / 180) * H;
      const rad = r.w / kmPerPx;
      const c = Math.cos((la * Math.PI) / 180);
      for (let dy = -Math.ceil(rad); dy <= Math.ceil(rad); dy++)
        for (let dx = -Math.ceil(rad / c); dx <= Math.ceil(rad / c); dx++) {
          const x = Math.round(cx + dx), y = Math.round(cy + dy);
          if (y < 0 || y >= H) continue;
          const xx = (x + W) % W;
          const dd = ((dx * c) ** 2 + dy ** 2) / (rad * rad);
          const v = r.h * Math.exp(-dd * 2.5);
          if (v > relief[y * W + xx]) relief[y * W + xx] = v;
        }
    }
  }
}

const out = new Uint8Array(W * H * 4);
const plateCache = new Int8Array(W * H).fill(-1);
const plateOf = (idx) => {
  if (plateCache[idx] < 0) {
    const y = Math.floor(idx / W), x = idx % W;
    plateCache[idx] = plateAt(90 - ((y + 0.5) / H) * 180, ((x + 0.5) / W) * 360 - 180);
  }
  return plateCache[idx];
};
for (let i = 0; i < W * H; i++) {
  const isLand = mask[i] === 1;
  const dKm = isLand ? Math.sqrt(toSea.d2[i]) * kmPerPx - kmPerPx * 0.5 : -(Math.sqrt(toLand.d2[i]) * kmPerPx - kmPerPx * 0.5);
  const v = 128 + Math.sign(dKm) * 127 * Math.sqrt(Math.min(1, Math.abs(dKm) / 1800));
  const plate = isLand ? plateOf(i) : plateOf(toLand.near[i]);
  out[i * 4] = Math.max(0, Math.min(255, Math.round(v)));
  out[i * 4 + 1] = plate * 16 + 8;
  out[i * 4 + 2] = Math.round(Math.min(1, relief[i] * (isLand ? 1 : 0.3)) * 255);
  out[i * 4 + 3] = 255;
}
fs.mkdirSync(new URL('../src/assets/earth/', import.meta.url), { recursive: true });
const png = encodePNG(W, H, out, 4);
fs.writeFileSync(new URL(`../src/assets/earth/landmask.png`, import.meta.url), png);
console.log('wrote landmask.png', W, 'x', H, (png.length / 1024).toFixed(0), 'KB');
