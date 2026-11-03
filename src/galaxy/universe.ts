import { Rng } from '../core/rng';

/**
 * THE LOCAL GROUP — the coarse strategic graph for Regime B.
 *
 * ~24 000 star-cluster nodes in five galaxies (Milky Way, the Large and Small
 * Magellanic Clouds, Andromeda, Triangulum). Positions are kiloparsecs in each
 * galaxy's own frame (disk in the x–z plane, y up); galaxy centres move with
 * time (the Clouds fall into the Milky Way, Andromeda collides at ~+4.5 Gyr).
 * The layout is fixed (the same sky every run); the seed only changes history.
 */
export const KPC_LY = 3261.56; // light-years per kiloparsec

export const GAL = { MW: 0, LMC: 1, SMC: 2, M31: 3, M33: 4 } as const;
export const GALAXY_NAMES = ['the Milky Way', 'the Large Cloud', 'the Small Cloud', 'Andromeda', 'Triangulum'];

interface GalaxyDef {
  id: number;
  count: number;
  radius: number; // kpc, disk truncation
  scale: number; // exponential scale length
  bulge: number; // fraction
  bar: number; // fraction
  barLen: number;
  arms: { phase: number; strength: number; name: string }[];
  pitch: number; // radians
  thickness: number;
  irregular: number; // 0 = grand design, 1 = clumpy irregular
  euler: [number, number, number];
}

const DEG = Math.PI / 180;

export const GALAXIES: GalaxyDef[] = [
  {
    id: 0, count: 17000, radius: 15.5, scale: 3.2, bulge: 0.09, bar: 0.06, barLen: 4.4, pitch: 12.5 * DEG, thickness: 0.22, irregular: 0, euler: [0, 0, 0],
    arms: [
      { phase: 0.0, strength: 1.0, name: 'the Perseus Arm' },
      { phase: Math.PI, strength: 1.0, name: 'the Scutum–Centaurus Arm' },
      { phase: Math.PI * 0.5, strength: 0.6, name: 'the Sagittarius Arm' },
      { phase: Math.PI * 1.5, strength: 0.6, name: 'the Norma Arm' },
    ],
  },
  { id: 1, count: 1100, radius: 4.2, scale: 1.6, bulge: 0.0, bar: 0.22, barLen: 2.4, pitch: 20 * DEG, thickness: 0.35, irregular: 0.75, euler: [0.55, 0.2, 0.35], arms: [{ phase: 0.3, strength: 0.7, name: 'the Large Cloud' }] },
  { id: 2, count: 500, radius: 2.4, scale: 1.0, bulge: 0.0, bar: 0.3, barLen: 1.6, pitch: 25 * DEG, thickness: 0.5, irregular: 1, euler: [1.1, 0.4, 0.0], arms: [] },
  {
    id: 3, count: 4300, radius: 21, scale: 5.0, bulge: 0.14, bar: 0.0, barLen: 0, pitch: 8 * DEG, thickness: 0.3, irregular: 0.1, euler: [1.18, 0.35, 0.52],
    arms: [
      { phase: 0.4, strength: 1.0, name: 'Andromeda' },
      { phase: 0.4 + Math.PI, strength: 1.0, name: 'Andromeda' },
    ],
  },
  { id: 4, count: 1100, radius: 8.5, scale: 2.4, bulge: 0.04, bar: 0.0, barLen: 0, pitch: 26 * DEG, thickness: 0.25, irregular: 0.35, euler: [-0.62, 1.2, 0.25], arms: [{ phase: 1.0, strength: 0.8, name: 'Triangulum' }, { phase: 1.0 + Math.PI, strength: 0.8, name: 'Triangulum' }] },
];

/** The Sun's place in the Milky Way's frame (kpc). */
export const SUN_POS: [number, number, number] = [8.2 * Math.cos(2.42), 0.02, 8.2 * Math.sin(2.42)];

export interface Universe {
  n: number;
  /** local positions (kpc) in the galaxy frame */
  lx: Float32Array;
  ly: Float32Array;
  lz: Float32Array;
  gal: Uint8Array;
  /** stellar mass / resource weight */
  mass: Float32Array;
  /** region id → REGION_NAMES */
  region: Uint8Array;
  /** CSR adjacency (same-galaxy k-nearest neighbours, symmetrised) */
  nbrStart: Int32Array;
  nbr: Int32Array;
  sunNode: number;
  /** first node index of each galaxy, and count */
  galStart: number[];
  galCount: number[];
}

export const REGION_NAMES: string[] = [
  'the Core', 'the Bar', 'the Halo', 'the Outer Arm', 'the Orion Spur', 'Sol',
  'the Perseus Arm', 'the Scutum–Centaurus Arm', 'the Sagittarius Arm', 'the Norma Arm', 'the far side of the Milky Way',
  'the Large Cloud', 'the Small Cloud',
  'Andromeda', 'the heart of Andromeda', 'the Ring of Andromeda', 'the outer disk of Andromeda',
  'Triangulum',
];
const R = Object.fromEntries(REGION_NAMES.map((n, i) => [n, i])) as Record<string, number>;

function armCentre(phase: number, pitch: number, r: number): number {
  return phase + Math.log(Math.max(r, 0.5) / 4) / Math.tan(pitch);
}

/** angular distance (rad) between two angles */
function dAng(a: number, b: number): number {
  let d = (a - b) % (Math.PI * 2);
  if (d < -Math.PI) d += Math.PI * 2;
  if (d > Math.PI) d -= Math.PI * 2;
  return d;
}

/** Density of spiral arms at polar (r, θ) in a galaxy frame, 0..1, and the dominant arm. */
export function armDensity(g: GalaxyDef, r: number, th: number): [number, number] {
  let best = 0, arm = -1;
  for (let k = 0; k < g.arms.length; k++) {
    const a = g.arms[k]!;
    const c = armCentre(a.phase, g.pitch, r);
    const w = 0.42 + 0.045 * r;
    const d = dAng(th, c) * r;
    const v = a.strength * Math.exp(-((d / w) ** 2));
    if (v > best) {
      best = v;
      arm = k;
    }
  }
  return [best, arm];
}

function sampleGalaxy(g: GalaxyDef, rng: Rng, out: { x: number[]; y: number[]; z: number[]; m: number[]; reg: number[] }): void {
  for (let i = 0; i < g.count; i++) {
    const u = rng.next();
    let x = 0, y = 0, z = 0, reg = 0;
    if (u < g.bulge) {
      const r = -0.7 * Math.log(1 - rng.next() * 0.97) * (g.id === 3 ? 1.6 : 1);
      const ct = rng.range(-1, 1), ph = rng.range(0, Math.PI * 2);
      const st = Math.sqrt(1 - ct * ct);
      x = r * st * Math.cos(ph);
      y = r * ct * 0.6;
      z = r * st * Math.sin(ph);
      reg = g.id === 3 ? R['the heart of Andromeda']! : g.id === 4 ? R['Triangulum']! : R['the Core']!;
    } else if (u < g.bulge + g.bar) {
      const bx = rng.normal(0, g.barLen * 0.42), bz = rng.normal(0, g.barLen * 0.13), by = rng.normal(0, g.thickness);
      const a = 0.45;
      x = bx * Math.cos(a) - bz * Math.sin(a);
      z = bx * Math.sin(a) + bz * Math.cos(a);
      y = by;
      reg = g.id === 0 ? R['the Bar']! : g.id === 1 ? R['the Large Cloud']! : R['the Small Cloud']!;
    } else {
      // exponential disk, modulated by the spiral arms (rejection sampling)
      let r = 0, th = 0;
      for (let tries = 0; tries < 60; tries++) {
        r = -g.scale * Math.log(1 - rng.next() * 0.995);
        if (r < (g.id === 0 ? 1.6 : 0.3) || r > g.radius) continue;
        th = rng.range(0, Math.PI * 2);
        const [d] = armDensity(g, r, th);
        const ring = g.id === 3 ? Math.exp(-(((r - 10) / 1.1) ** 2)) * 0.9 : 0;
        const p = g.arms.length ? 0.16 + 0.84 * Math.max(d, ring) : 1;
        if (rng.next() < p * (1 - g.irregular * 0.5) + g.irregular * 0.5) break;
      }
      // clumpy irregulars: pull points toward a few star-forming knots
      if (g.irregular > 0.3 && rng.next() < g.irregular * 0.6) {
        const k = rng.int(0, 5);
        const kr = (0.25 + 0.6 * ((k * 0.618) % 1)) * g.radius, kth = k * 2.4;
        r = r * 0.4 + kr * 0.6;
        th = th * 0.3 + kth * 0.7;
      }
      x = r * Math.cos(th);
      z = r * Math.sin(th);
      y = rng.normal(0, g.thickness * (1 + r / 15));
      if (g.id === 0) {
        const [d, arm] = armDensity(g, r, th);
        if (Math.abs(y) > 1.2) reg = R['the Halo']!;
        else if (r > 13) reg = R['the Outer Arm']!;
        else if (Math.hypot(x - SUN_POS[0], z - SUN_POS[2]) < 1.6) reg = R['the Orion Spur']!;
        else if (d > 0.25 && arm >= 0) reg = R[g.arms[arm]!.name]!;
        else if (x * SUN_POS[0] + z * SUN_POS[2] < -20) reg = R['the far side of the Milky Way']!;
        else reg = arm >= 0 ? R[g.arms[arm]!.name]! : R['the Outer Arm']!;
      } else if (g.id === 1) reg = R['the Large Cloud']!;
      else if (g.id === 2) reg = R['the Small Cloud']!;
      else if (g.id === 3) reg = r > 9 && r < 11.5 ? R['the Ring of Andromeda']! : r > 14 ? R['the outer disk of Andromeda']! : R['Andromeda']!;
      else reg = R['Triangulum']!;
    }
    out.x.push(x);
    out.y.push(y);
    out.z.push(z);
    out.m.push(0.4 + Math.pow(rng.next(), 3) * 2.2 + (reg === R['the Core'] || reg === R['the heart of Andromeda'] ? 0.8 : 0));
    out.reg.push(reg);
  }
}

let cached: Universe | null = null;

/** Build (once) the deterministic Local Group graph. */
export function buildUniverse(): Universe {
  if (cached) return cached;
  const rng = new Rng(0x10ca1, 7);
  const x: number[] = [], y: number[] = [], z: number[] = [], m: number[] = [], reg: number[] = [], gal: number[] = [];
  const galStart: number[] = [], galCount: number[] = [];
  for (const g of GALAXIES) {
    galStart.push(x.length);
    const o = { x, y, z, m, reg };
    sampleGalaxy(g, rng.fork('g' + g.id), o);
    for (let i = 0; i < g.count; i++) gal.push(g.id);
    galCount.push(g.count);
  }
  const n = x.length;
  // the Sun: the Milky Way disk node nearest its true place, moved onto it
  let sun = 0, bd = 1e9;
  for (let i = 0; i < galCount[0]!; i++) {
    const d = Math.hypot(x[i]! - SUN_POS[0], y[i]! - SUN_POS[1], z[i]! - SUN_POS[2]);
    if (d < bd) {
      bd = d;
      sun = i;
    }
  }
  x[sun] = SUN_POS[0];
  y[sun] = SUN_POS[1];
  z[sun] = SUN_POS[2];
  reg[sun] = R['Sol']!;
  m[sun] = 1;

  // k-nearest neighbours within each galaxy (uniform grid), symmetrised into CSR
  const K = 7;
  const pairsA: number[] = [], pairsB: number[] = [];
  const cand = new Float64Array(4096), candJ = new Int32Array(4096);
  for (let gi = 0; gi < GALAXIES.length; gi++) {
    const s = galStart[gi]!, c = galCount[gi]!;
    const cell = Math.max(0.25, GALAXIES[gi]!.radius / 28);
    const grid = new Map<number, number[]>();
    const key = (a: number, b: number, d: number): number => ((a + 512) * 1024 + (b + 512)) * 1024 + (d + 512);
    for (let i = s; i < s + c; i++) {
      const k = key(Math.floor(x[i]! / cell), Math.floor(y[i]! / cell), Math.floor(z[i]! / cell));
      let arr = grid.get(k);
      if (!arr) grid.set(k, (arr = []));
      arr.push(i);
    }
    for (let i = s; i < s + c; i++) {
      const cx = Math.floor(x[i]! / cell), cy = Math.floor(y[i]! / cell), cz = Math.floor(z[i]! / cell);
      let nc = 0;
      for (let rad = 1; rad <= 6; rad++) {
        nc = 0;
        for (let a = -rad; a <= rad; a++)
          for (let b = -rad; b <= rad; b++)
            for (let d = -rad; d <= rad; d++) {
              const arr = grid.get(key(cx + a, cy + b, cz + d));
              if (!arr) continue;
              for (const j of arr) {
                if (j === i || nc >= 4096) continue;
                cand[nc] = (x[i]! - x[j]!) ** 2 + (y[i]! - y[j]!) ** 2 + (z[i]! - z[j]!) ** 2;
                candJ[nc++] = j;
              }
            }
        if (nc >= K) break;
      }
      // partial selection of the K nearest (ties broken by index for determinism)
      for (let k = 0; k < Math.min(K, nc); k++) {
        let bi = k;
        for (let q = k + 1; q < nc; q++) if (cand[q]! < cand[bi]! || (cand[q] === cand[bi] && candJ[q]! < candJ[bi]!)) bi = q;
        const td = cand[k]!, tj = candJ[k]!;
        cand[k] = cand[bi]!;
        candJ[k] = candJ[bi]!;
        cand[bi] = td;
        candJ[bi] = tj;
        pairsA.push(i, candJ[k]!);
        pairsB.push(candJ[k]!, i);
      }
    }
  }
  // CSR: count, fill, then sort + dedupe each row
  const deg = new Int32Array(n);
  for (let k = 0; k < pairsA.length; k += 2) {
    deg[pairsA[k]!]!++;
    deg[pairsB[k]!]!++;
  }
  const tmpStart = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) tmpStart[i + 1] = tmpStart[i]! + deg[i]!;
  const tmp = new Int32Array(tmpStart[n]!);
  const fill = tmpStart.slice(0, n);
  for (let k = 0; k < pairsA.length; k += 2) {
    tmp[fill[pairsA[k]!]!++] = pairsA[k + 1]!;
    tmp[fill[pairsB[k]!]!++] = pairsB[k + 1]!;
  }
  const rows: Int32Array[] = [];
  const nbrStart = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) {
    const row = tmp.subarray(tmpStart[i]!, tmpStart[i + 1]!).slice().sort();
    let w = 0;
    for (let k = 0; k < row.length; k++) if (k === 0 || row[k] !== row[k - 1]) row[w++] = row[k]!;
    rows.push(row.subarray(0, w));
    nbrStart[i + 1] = nbrStart[i]! + w;
  }
  const nbr = new Int32Array(nbrStart[n]!);
  for (let i = 0; i < n; i++) nbr.set(rows[i]!, nbrStart[i]!);
  cached = {
    n,
    lx: Float32Array.from(x),
    ly: Float32Array.from(y),
    lz: Float32Array.from(z),
    gal: Uint8Array.from(gal),
    mass: Float32Array.from(m),
    region: Uint8Array.from(reg),
    nbrStart,
    nbr,
    sunNode: sun,
    galStart,
    galCount,
  };
  return cached;
}

// ---------------------------------------------------------------------------
// Galaxy motion
// ---------------------------------------------------------------------------

const sst = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const M31_DIR = (() => {
  const v = [0.55, 0.25, -0.8];
  const l = Math.hypot(v[0]!, v[1]!, v[2]!);
  return v.map((c) => c / l) as [number, number, number];
})();
const M31_SIDE: [number, number, number] = [0.82, -0.05, 0.56];
export const COLLISION_T = 4.5e9;
export const MERGED_T = 6.5e9;
export const CLOUDS_MERGE_T = 2.4e9;

/** Centre of galaxy g (kpc, Local Group frame; the Milky Way stays at the origin) at time t (years rel. 2026). */
export function galaxyCenter(g: number, t: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  out[0] = out[1] = out[2] = 0;
  if (g === 0) return out;
  if (g === 1 || g === 2) {
    const base = g === 1 ? [-1, -41, -28] : [15, -38, -44];
    const f = 1 - 0.85 * sst(1.6e9, CLOUDS_MERGE_T, t);
    out[0] = base[0]! * f;
    out[1] = base[1]! * f;
    out[2] = base[2]! * f;
    return out;
  }
  // Andromeda: falls in, first passage at +4.5 Gyr, swings out, returns, merges by +6.5 Gyr
  let d: number, side = 0;
  if (t < COLLISION_T) d = 18 + 762 * Math.pow(1 - Math.max(0, t) / COLLISION_T, 0.7);
  else if (t < 5.5e9) {
    const p = (t - COLLISION_T) / 1e9;
    d = 18 + 120 * Math.sin(Math.PI * p);
    side = 70 * Math.sin(Math.PI * p);
  } else d = 18 * (1 - sst(5.5e9, MERGED_T, t));
  out[0] = M31_DIR[0] * d + M31_SIDE[0] * side;
  out[1] = M31_DIR[1] * d + M31_SIDE[1] * side;
  out[2] = M31_DIR[2] * d + M31_SIDE[2] * side;
  if (g === 4) {
    const k = Math.max(0.45, Math.min(1, d / 300));
    out[0] += 150 * k;
    out[1] += -120 * k;
    out[2] += 120 * k;
  }
  return out;
}

/** Rotation (row-major 3×3) of galaxy g's frame into the Local Group frame. */
export function galaxyRotation(g: number): number[] {
  const [a, b, c] = GALAXIES[g]!.euler;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cc = Math.cos(c), sc = Math.sin(c);
  // R = Rz(c) · Ry(b) · Rx(a)
  return [
    cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa,
    sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa,
    -sb, cb * sa, cb * ca,
  ];
}
const ROT = GALAXIES.map((_, g) => galaxyRotation(g));

/** World position (kpc) of node i at time t. */
export function nodePos(u: Universe, i: number, t: number, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const g = u.gal[i]!;
  const c = galaxyCenter(g, t, out);
  const r = ROT[g]!;
  const x = u.lx[i]!, y = u.ly[i]!, z = u.lz[i]!;
  out[0] = c[0] + r[0]! * x + r[1]! * y + r[2]! * z;
  out[1] = c[1] + r[3]! * x + r[4]! * y + r[5]! * z;
  out[2] = c[2] + r[6]! * x + r[7]! * y + r[8]! * z;
  return out;
}
