/**
 * Pure-TS geometry for the vent's mineral spires (runs in a worker at boot).
 * Signed distance fields → naive surface nets → positions/normals/indices.
 */
import { Rng } from '../core/rng';
import { fbm3, noise1 } from '../core/noise';

export type V3 = [number, number, number];
export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
  offset: V3;
}
export interface VentGeometry {
  meshes: MeshData[];
  /** orifice positions (world) for the hero cluster and background spires */
  mouths: V3[];
  floor: MeshData;
}

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const nrm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}
export function capsuleDist(px: number, py: number, pz: number, a: V3, b: V3, ra: number, rb: number): number {
  const bax = b[0] - a[0], bay = b[1] - a[1], baz = b[2] - a[2];
  const pax = px - a[0], pay = py - a[1], paz = pz - a[2];
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}

export function surfaceNetsRaw(sdf: (x: number, y: number, z: number) => number, min: V3, max: V3, step: number): { positions: Float32Array; indices: Uint32Array } {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const field = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number): number => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) field[at(i, j, k)] = sdf(min[0] + i * step, min[1] + j * step, min[2] + k * step);
  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cAt = (i: number, j: number, k: number): number => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const cc = C[c]!;
          v[c] = field[at(i + cc[0]!, j + cc[1]!, k + cc[2]!)]!;
          if (v[c]! < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const e of E) {
          const va = v[e[0]!]!, vb = v[e[1]!]!;
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          const ca = C[e[0]!]!, cb = C[e[1]!]!;
          sx += ca[0]! + (cb[0]! - ca[0]!) * t;
          sy += ca[1]! + (cb[1]! - ca[1]!) * t;
          sz += ca[2]! + (cb[2]! - ca[2]!) * t;
          n++;
        }
        cellVert[cAt(i, j, k)] = pos.length / 3;
        pos.push(min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step);
      }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean): void => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, b, c, a, c, d);
    else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = field[at(i, j, k)]! < 0;
        if (v0 !== field[at(i + 1, j, k)]! < 0) quad(cellVert[cAt(i, j - 1, k - 1)]!, cellVert[cAt(i, j, k - 1)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i, j - 1, k)]!, v0);
        if (v0 !== field[at(i, j + 1, k)]! < 0) quad(cellVert[cAt(i - 1, j, k - 1)]!, cellVert[cAt(i - 1, j, k)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i, j, k - 1)]!, v0);
        if (v0 !== field[at(i, j, k + 1)]! < 0) quad(cellVert[cAt(i - 1, j - 1, k)]!, cellVert[cAt(i, j - 1, k)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i - 1, j, k)]!, v0);
      }
  return { positions: new Float32Array(pos), indices: new Uint32Array(idx) };
}

export function vertexNormals(positions: Float32Array, indices: Uint32Array): Float32Array {
  const n = new Float32Array(positions.length);
  for (let t = 0; t < indices.length; t += 3) {
    const a = indices[t]! * 3, b = indices[t + 1]! * 3, c = indices[t + 2]! * 3;
    const e1x = positions[b]! - positions[a]!, e1y = positions[b + 1]! - positions[a + 1]!, e1z = positions[b + 2]! - positions[a + 2]!;
    const e2x = positions[c]! - positions[a]!, e2y = positions[c + 1]! - positions[a + 1]!, e2z = positions[c + 2]! - positions[a + 2]!;
    const fx = e1y * e2z - e1z * e2y, fy = e1z * e2x - e1x * e2z, fz = e1x * e2y - e1y * e2x;
    for (const v of [a, b, c]) {
      n[v]! += fx;
      n[v + 1]! += fy;
      n[v + 2]! += fz;
    }
  }
  for (let i = 0; i < n.length; i += 3) {
    const l = Math.hypot(n[i]!, n[i + 1]!, n[i + 2]!) || 1;
    n[i]! /= l;
    n[i + 1]! /= l;
    n[i + 2]! /= l;
  }
  return n;
}

interface Seg { a: V3; b: V3; ra: number; rb: number }

export function spireCluster(rng: Rng, height: number, radius: number, branches: number, step: number): { mesh: { positions: Float32Array; indices: Uint32Array }; tops: V3[] } {
  const segs: Seg[] = [];
  const tops: V3[] = [];
  const topR: number[] = [];
  const seed = rng.int(0, 1e6);
  const chain = (start: V3, dir: V3, len: number, r0: number, r1: number, n: number, wobble: number): void => {
    let p = start;
    for (let i = 0; i < n; i++) {
      const t0 = i / n, t1 = (i + 1) / n;
      const dd = nrm([dir[0] + noise1(t1 * 3 + seed, seed) * wobble, dir[1], dir[2] + noise1(t1 * 3 + seed + 7, seed + 1) * wobble]);
      const q: V3 = [p[0] + dd[0] * (len / n), p[1] + dd[1] * (len / n), p[2] + dd[2] * (len / n)];
      const bulge = 1 + 0.22 * noise1(t0 * 9 + seed * 0.1, seed + 3);
      segs.push({ a: p, b: q, ra: lerp(r0, r1, Math.pow(t0, 0.8)) * bulge, rb: lerp(r0, r1, Math.pow(t1, 0.8)) * bulge });
      p = q;
    }
    tops.push(p);
    topR.push(r1);
  };
  chain([0, -0.3, 0], [0, 1, 0], height + 0.3, radius * 1.5, radius * 0.38, 14, 0.18);
  for (let k = 0; k < branches; k++) {
    const h0 = rng.range(0.22, 0.6) * height;
    const ang = rng.range(0, Math.PI * 2);
    const out = rng.range(0.25, 0.5);
    chain([Math.cos(ang) * radius * 0.6, h0, Math.sin(ang) * radius * 0.6], nrm([Math.cos(ang) * out, 1, Math.sin(ang) * out]), rng.range(0.3, 0.55) * height, radius * rng.range(0.55, 0.8), radius * 0.26, 8, 0.25);
  }
  const knobs = Array.from({ length: 34 }, () => {
    const s = segs[rng.int(0, segs.length - 1)]!;
    const t = rng.next();
    const ang = rng.range(0, Math.PI * 2);
    const r = lerp(s.ra, s.rb, t);
    return { c: [lerp(s.a[0], s.b[0], t) + Math.cos(ang) * r * 0.9, lerp(s.a[1], s.b[1], t), lerp(s.a[2], s.b[2], t) + Math.sin(ang) * r * 0.9] as V3, r: r * rng.range(0.25, 0.55) };
  });
  const flanges = Array.from({ length: 3 }, () => ({ y: rng.range(0.25, 0.8) * height, w: radius * rng.range(0.5, 0.95), dir: rng.range(0, Math.PI * 2) }));
  const sdf = (x: number, y: number, z: number): number => {
    let d = 1e9;
    for (const s of segs) d = smin(d, capsuleDist(x, y, z, s.a, s.b, s.ra, s.rb), 0.22 * radius);
    if (d > radius * 1.2) return d;
    for (const k of knobs) d = smin(d, Math.hypot(x - k.c[0], y - k.c[1], z - k.c[2]) - k.r, 0.12 * radius);
    for (const f of flanges) {
      const ang = Math.atan2(z, x);
      const side = 0.5 + 0.5 * Math.cos(ang - f.dir);
      const rr = Math.hypot(x, z) - (radius * (1.5 - 1.1 * Math.pow(f.y / height, 0.8)) + f.w * side);
      const dy = Math.abs(y - f.y) - 0.05 * radius;
      d = smin(d, Math.max(rr, dy), 0.08 * radius);
    }
    for (let i = 0; i < tops.length; i++) {
      const t = tops[i]!;
      const rr = Math.hypot(x - t[0], z - t[2]) - topR[i]! * 0.55;
      const dy = Math.max(t[1] - 0.45 - y, y - t[1] - 0.4);
      d = Math.max(d, -Math.max(rr, dy));
    }
    if (d < 0.35 * radius + 0.1) d += fbm3(x * 1.6, y * 0.7, z * 1.6, 4, seed) * 0.26 * radius + fbm3(x * 6, y * 3, z * 6, 2, seed + 5) * 0.06 * radius;
    return d;
  };
  const R = radius * 2.6 + 0.4;
  return { mesh: surfaceNetsRaw(sdf, [-R, -0.35, -R], [R, height + 0.6, R], step), tops };
}

export const VENT_SEED = 0x0c0ffee;

/** Everything the vent needs; deterministic for VENT_SEED. */
export function buildVentGeometry(): VentGeometry {
  const rng = new Rng(VENT_SEED, 1);
  const meshes: MeshData[] = [];
  const mouthsAll: V3[] = [];
  const add = (o: V3, h: number, r: number, br: number, st: number, keepTops: boolean): void => {
    const { mesh, tops } = spireCluster(rng, h, r, br, st);
    meshes.push({ positions: mesh.positions, indices: mesh.indices, normals: vertexNormals(mesh.positions, mesh.indices), offset: o });
    if (keepTops) for (const t of tops) mouthsAll.push([o[0] + t[0], o[1] + t[1] - 0.05, o[2] + t[2]]);
  };
  add([0, 0, 0], 5.2, 0.62, 3, 0.07, true);
  add([-4.4, 0, -5.0], 4.0, 0.55, 2, 0.1, true);
  add([4.3, 0, -6.2], 3.2, 0.5, 1, 0.1, true);
  add([5.2, -0.4, 10.5], 7.0, 0.8, 1, 0.12, false);
  for (let i = 0; i < 7; i++) {
    const o: V3 = [rng.range(-6, 6), -0.05, rng.range(-4, 5)];
    const h = rng.range(0.5, 1.4), r = rng.range(0.12, 0.22);
    if (Math.hypot(o[0], o[2]) < 1.6) continue;
    add(o, h, r, 0, 0.06, false);
  }
  // seafloor: a sulfide mound
  const N = 200, S = 70;
  const fpos = new Float32Array((N + 1) * (N + 1) * 3);
  for (let j = 0; j <= N; j++)
    for (let i = 0; i <= N; i++) {
      const x = (i / N - 0.5) * S, z = (j / N - 0.5) * S;
      const mound = 1.0 * Math.exp(-(x * x + (z + 1.5) * (z + 1.5)) / 26);
      const k = (j * (N + 1) + i) * 3;
      fpos[k] = x;
      fpos[k + 1] = mound + fbm3(x * 0.35, 0, z * 0.35, 5, 77) * 0.9 + fbm3(x * 2.2, 1, z * 2.2, 3, 78) * 0.12 - 0.45;
      fpos[k + 2] = z;
    }
  const fidx: number[] = [];
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      fidx.push(a, c, b, b, c, d);
    }
  const findices = new Uint32Array(fidx);
  const floor: MeshData = { positions: fpos, indices: findices, normals: vertexNormals(fpos, findices), offset: [0, 0, 0] };
  const mouths: V3[] = [mouthsAll[0]!, mouthsAll[1]!, mouthsAll[2]!, mouthsAll[4]!, mouthsAll[7]!];
  return { meshes, mouths, floor };
}
