import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import { landAt } from '../../data/landgrid';
import { quaternaryIce } from '../../fate/world';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * HOMININS — local rules for Chapter 4.
 *
 * Field (fast time): the canonical dispersal map — which lineage can live
 * where, and when — modulated by glacial cycles, desert pulses and coasts.
 * It is a pure function of time, so the far view is identical on every run.
 *
 * Agents (slow time): bands with a lineage, size and culture. They forage
 * (deplete the land), drift toward better ground, split when large, merge or
 * trade with kin, and fight strangers when food is scarce. The fate spring
 * raises mortality outside a lineage's canonical range and fertility inside.
 */
export const BAND_STRIDE = 8;
export const FW = 180;
export const FH = 90;

type Lineage = 0 | 1 | 2; // 0 = early Homo / erectus, 1 = Neanderthal, 2 = sapiens
interface Region { name: string; lat: [number, number]; lon: [number, number] }
const R: Record<string, Region> = {
  eafrica: { name: 'East Africa', lat: [-30, 15], lon: [20, 45] },
  africa: { name: 'Africa', lat: [-35, 37], lon: [-18, 52] },
  levant: { name: 'Levant', lat: [12, 40], lon: [32, 62] },
  europe: { name: 'Europe', lat: [36, 62], lon: [-10, 45] },
  casia: { name: 'Central Asia', lat: [35, 58], lon: [45, 100] },
  sasia: { name: 'South Asia', lat: [5, 32], lon: [60, 95] },
  easia: { name: 'East Asia', lat: [18, 52], lon: [95, 140] },
  seasia: { name: 'Sunda', lat: [-11, 20], lon: [92, 126] },
  sahul: { name: 'Sahul', lat: [-42, 0], lon: [112, 155] },
  siberia: { name: 'Siberia', lat: [50, 72], lon: [60, 180] },
  beringia: { name: 'Beringia', lat: [55, 72], lon: [-180, -140] },
  namerica: { name: 'North America', lat: [14, 70], lon: [-170, -50] },
  samerica: { name: 'South America', lat: [-56, 14], lon: [-82, -34] },
};
/** [lineage, region, from (T), to (T)] */
const RANGES: [Lineage, string, number, number][] = [
  [0, 'eafrica', -7.0e6, -1.0e5],
  [0, 'africa', -2.0e6, -1.5e5],
  [0, 'levant', -1.85e6, -2.0e5],
  [0, 'sasia', -1.7e6, -1.4e5],
  [0, 'easia', -1.6e6, -1.1e5],
  [0, 'seasia', -1.5e6, -5.0e4],
  [0, 'europe', -1.2e6, -4.5e5],
  [1, 'europe', -4.3e5, -4.0e4],
  [1, 'levant', -2.0e5, -4.6e4],
  [1, 'casia', -1.5e5, -4.5e4],
  [2, 'africa', -3.0e5, 1e9],
  [2, 'levant', -7.5e4, 1e9],
  [2, 'sasia', -7.0e4, 1e9],
  [2, 'seasia', -6.8e4, 1e9],
  [2, 'sahul', -6.5e4, 1e9],
  [2, 'easia', -5.5e4, 1e9],
  [2, 'europe', -4.6e4, 1e9],
  [2, 'casia', -4.5e4, 1e9],
  [2, 'siberia', -3.8e4, 1e9],
  [2, 'beringia', -2.0e4, 1e9],
  [2, 'namerica', -1.6e4, 1e9],
  [2, 'samerica', -1.45e4, 1e9],
];

export const BAND_FATE = new FateField(
  { bands: [[-7e6, 0.08], [-2e6, 0.2], [-3e5, 0.3], [-7e4, 0.45], [-4e4, 0.7], [-1.2e4, 1.0]] },
  [-1.9e6, -3.0e5, -7.0e4, -4.5e4, -1.6e4],
);

function inRegion(r: Region, lat: number, lon: number): boolean {
  return lat >= r.lat[0] && lat <= r.lat[1] && lon >= r.lon[0] && lon <= r.lon[1];
}

/** soft membership: regions feather out over ~5° so ranges never show as rectangles */
function regionSoft(r: Region, lat: number, lon: number): number {
  const F = 5;
  const ss = (a: number, b: number, x: number): number => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  return ss(r.lat[0] - F, r.lat[0] + F, lat) * ss(r.lat[1] + F, r.lat[1] - F, lat) * ss(r.lon[0] - F, r.lon[0] + F, lon) * ss(r.lon[1] + F, r.lon[1] - F, lon);
}

/** 0..1: how strongly lineage L may occupy (lat, lon) at time T (soft arrival ramps). */
export function rangeWeight(L: Lineage, lat: number, lon: number, T: number): number {
  let w = 0;
  for (const [l, rn, from, to] of RANGES) {
    if (l !== L) continue;
    const r = R[rn]!;
    const m = regionSoft(r, lat, lon);
    if (m <= 0) continue;
    const span = Math.min(to, 0) - from;
    const rampLen = Math.min(Math.max(span * 0.08, 2500), 60000);
    const ramp = Math.min(1, Math.max(0, (T - from) / rampLen));
    const fade = Math.min(1, Math.max(0, (to - T) / rampLen));
    w = Math.max(w, ramp * fade * m);
  }
  return w;
}

/** Habitability from land, glacial cycles and desert pulses. */
export function habitability(lat: number, lon: number, T: number): number {
  const glacial = Math.min(1, quaternaryIce(T) / 0.13);
  let land = landAt(lat, lon);
  // the Bering land bridge and Sunda/Sahul shelves emerge at glacial lowstands
  if (glacial > 0.45 && lat > 62 && lat < 68 && (lon > 167 || lon < -165)) land = Math.max(land, 0.2);
  if (glacial > 0.6 && land > -0.15 && ((lat > -10 && lat < 8 && lon > 95 && lon < 120) || (lat < -5 && lat > -12 && lon > 125 && lon < 145))) land = Math.max(land, 0.1);
  if (land <= 0) return 0;
  const maxLat = 64 - glacial * 22;
  const cold = Math.min(1, Math.max(0, (maxLat - Math.abs(lat)) / 12));
  // the Sahara and Arabia breathe green with the precession cycle
  const wet = 0.5 + 0.5 * Math.sin((2 * Math.PI * T) / 23000);
  const desert = (lat > 15 && lat < 31 && lon > -16 && lon < 58 ? 0.85 : 0) + (lat > -28 && lat < -18 && lon > 117 && lon < 140 ? 0.6 : 0);
  return cold * (1 - desert * (1 - wet * 0.8)) * (0.6 + 0.4 * Math.min(1, land * 4));
}

interface Band {
  lat: number;
  lon: number;
  plat: number;
  plon: number;
  size: number;
  lineage: Lineage;
  culture: number;
  alpha: number;
  dying: boolean;
  heading: number;
}

export class BandSim implements AgentSim {
  readonly id = 'bands';
  readonly stride = BAND_STRIDE;
  maxCells = 420;
  private rng = new Rng(1);
  bands: Band[] = [];
  private lod = 0;
  private agentsOn = false;
  private T = -7e6;
  private t = 0;
  private food = new Float32Array(FW * FH).fill(1);

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'bands');
    this.T = T;
    this.t = 0;
    this.bands = [];
    this.agentsOn = false;
    this.food.fill(1);
    void fate;
  }

  setLOD(mix: number): void {
    this.lod = mix;
    if (mix > 0.02 && !this.agentsOn) this.condense();
    else if (mix < 0.01 && this.agentsOn) {
      this.bands = [];
      this.agentsOn = false;
    }
  }

  /** canonical density for each lineage at a grid cell */
  densityAt(lat: number, lon: number, T: number): [number, number, number] {
    const h = habitability(lat, lon, T);
    if (h <= 0) return [0, 0, 0];
    return [rangeWeight(2, lat, lon, T) * h, rangeWeight(1, lat, lon, T) * h, rangeWeight(0, lat, lon, T) * h];
  }

  private condense(): void {
    const T = this.T;
    const cells: { lat: number; lon: number; w: [number, number, number] }[] = [];
    let total = 0;
    for (let y = 0; y < FH; y += 1)
      for (let x = 0; x < FW; x += 1) {
        const lat = 89 - y * 2, lon = -179 + x * 2;
        const w = this.densityAt(lat, lon, T);
        const s = w[0] + w[1] + w[2];
        if (s > 0.01) {
          cells.push({ lat, lon, w });
          total += s;
        }
      }
    const n = Math.min(this.maxCells - 10, Math.round(this.maxCells * (BAND_FATE.value('bands', T) * 0.9 + 0.1)));
    for (let k = 0; k < n && cells.length; k++) {
      let r = this.rng.next() * total;
      let c = cells[0]!;
      for (const cc of cells) {
        r -= cc.w[0] + cc.w[1] + cc.w[2];
        if (r <= 0) {
          c = cc;
          break;
        }
      }
      const s = c.w[0] + c.w[1] + c.w[2];
      const pick = this.rng.next() * s;
      const lineage: Lineage = pick < c.w[0] ? 2 : pick < c.w[0] + c.w[1] ? 1 : 0;
      this.add(c.lat + this.rng.range(-1, 1), c.lon + this.rng.range(-1, 1), lineage, this.rng.range(0.5, 1.2), -this.rng.range(0, 1.2));
    }
    this.agentsOn = true;
  }

  private add(lat: number, lon: number, lineage: Lineage, size: number, alpha: number): void {
    if (this.bands.length >= this.maxCells) return;
    this.bands.push({ lat, lon, plat: lat, plon: lon, size, lineage, culture: lineage === 2 ? 0.5 : 0.2, alpha, dying: false, heading: this.rng.range(0, Math.PI * 2) });
  }

  stats(): { bands: number; sapiens: number; neanderthal: number } {
    let s = 0, n = 0, live = 0;
    for (const b of this.bands) {
      if (b.dying) continue;
      live++;
      if (b.lineage === 2) s++;
      if (b.lineage === 1) n++;
    }
    return { bands: live / this.maxCells, sapiens: s, neanderthal: n };
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    this.T = T;
    if (!this.agentsOn) return;
    const r = this.rng;
    // food regrows
    for (let i = 0; i < this.food.length; i++) this.food[i] = Math.min(1, this.food[i]! + dt * 0.05);
    const target = fate.targets.bands ?? 0.4;
    const st = this.stats();
    const fert = Math.exp(Math.max(-2, Math.min(2, (target - st.bands) * fate.k * 4)));
    const born: Band[] = [];
    for (const b of this.bands) {
      b.plat = b.lat;
      b.plon = b.lon;
      if (b.dying) {
        b.alpha -= dt;
        continue;
      }
      if (b.alpha < 1) b.alpha = Math.min(1, b.alpha + dt * 0.8);
      const allowed = rangeWeight(b.lineage, b.lat, b.lon, T);
      const h = habitability(b.lat, b.lon, T);
      // sense the gradient of habitability × food × canonical range
      const score = (la: number, lo: number): number => {
        const fi = Math.min(FH - 1, Math.max(0, Math.floor((90 - la) / 2))) * FW + ((Math.floor((lo + 180) / 2) % FW) + FW) % FW;
        return habitability(la, lo, T) * (0.4 + 0.6 * this.food[fi]!) * (0.3 + 0.7 * rangeWeight(b.lineage, la, lo, T));
      };
      const step = 1.5;
      let best = score(b.lat, b.lon), bdir = b.heading;
      for (let k = 0; k < 6; k++) {
        const a = b.heading + (k - 2.5) * 0.7;
        const s = score(b.lat + Math.sin(a) * step, b.lon + (Math.cos(a) * step) / Math.max(0.2, Math.cos((b.lat * Math.PI) / 180)));
        if (s > best) {
          best = s;
          bdir = a;
        }
      }
      b.heading = bdir + r.normal(0, 0.35);
      const spd = (0.6 + b.culture * 0.6) * dt * (h > 0 ? 1 : 3);
      b.lat = Math.max(-58, Math.min(75, b.lat + Math.sin(b.heading) * spd));
      b.lon += (Math.cos(b.heading) * spd) / Math.max(0.2, Math.cos((b.lat * Math.PI) / 180));
      if (b.lon > 180) b.lon -= 360;
      if (b.lon < -180) b.lon += 360;
      // forage
      const fi = Math.min(FH - 1, Math.max(0, Math.floor((90 - b.lat) / 2))) * FW + ((Math.floor((b.lon + 180) / 2) % FW) + FW) % FW;
      const eat = Math.min(this.food[fi]!, dt * 0.25 * b.size);
      this.food[fi]! -= eat;
      // growth, culture, mortality (fate: outside the canonical range is lethal)
      b.size += dt * (eat * 0.9 - 0.06 * b.size) * (h > 0.05 ? 1 : -2);
      if (b.lineage === 2 && T > -7e4) b.culture = Math.min(2, b.culture + dt * 0.02);
      const outside = (1 - allowed) * fate.k * 0.9;
      if (b.size < 0.15 || r.next() < dt * outside) b.dying = true;
      else if (b.size > 1.6 / fert) {
        b.size *= 0.5;
        born.push({ ...b, alpha: 0, heading: b.heading + r.range(1.5, 3.5) });
      }
    }
    // encounters: kin merge/trade culture, strangers fight when hungry
    const B = this.bands;
    for (let i = 0; i < B.length; i++)
      for (let j = i + 1; j < B.length; j++) {
        const a = B[i]!, c = B[j]!;
        if (a.dying || c.dying) continue;
        if (Math.abs(a.lat - c.lat) > 1.2 || Math.abs(a.lon - c.lon) > 1.2) continue;
        if (a.lineage === c.lineage) {
          const m = Math.max(a.culture, c.culture);
          a.culture += (m - a.culture) * 0.1;
          c.culture += (m - c.culture) * 0.1;
          if (a.size + c.size < 0.8) {
            a.size += c.size;
            c.dying = true;
          }
        } else if (r.next() < 0.02) {
          // the larger, more cultured band tends to prevail
          const pa = 0.5 + 0.25 * (a.size - c.size) + 0.3 * (a.culture - c.culture);
          if (r.next() < pa) c.dying = true;
          else a.dying = true;
        }
      }
    this.bands = this.bands.filter((b) => !(b.dying && b.alpha <= 0));
    for (const b of born) this.add(b.lat, b.lon, b.lineage, b.size, 0);
  }

  snapshot(): SimSnapshot {
    const S = BAND_STRIDE;
    const out = new Float32Array(this.bands.length * S);
    this.bands.forEach((b, k) => out.set([b.lat, b.lon, b.plat, b.plon, b.size, b.lineage, b.culture, Math.max(0, b.alpha)], k * S));
    // the canonical field (deterministic) — lights the globe at speed
    const field = new Float32Array(FW * FH * 4);
    const T = this.T;
    for (let y = 0; y < FH; y++)
      for (let x = 0; x < FW; x++) {
        const d = this.densityAt(89 - y * 2, -179 + x * 2, T);
        const i = (y * FW + x) * 4;
        field[i] = d[0];
        field[i + 1] = d[1];
        field[i + 2] = d[2];
      }
    const st = this.stats();
    return { agents: out, count: this.bands.length, stride: S, fields: { people: { data: field, w: FW, h: FH, ch: 4 } }, stats: st, t: this.t };
  }
}
