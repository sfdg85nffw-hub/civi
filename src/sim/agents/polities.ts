import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import { landAt } from '../../data/landgrid';
import { ANCIENT_CITIES, POLITIES, cityWeight, gcDist, polityPower } from '../../data/history';
import { PRESENT_YEAR } from '../../time/format';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * ANCIENT CIVILIZATIONS — local rules for Chapter 5.
 *
 * Land is divided into 2° cells. The canonical map (field) gives each cell to
 * the strongest canonical polity's influence — Rome, Han, the Abbasids … rise
 * and fall on their real dates on every run. When time slows, cells become
 * agents: borders breathe (cells flip to a neighbour with probability set by
 * relative strength plus noise), overstretched provinces secede into new,
 * unpredictable polities, and towns flicker into being and vanish. The fate
 * spring pulls cells back to their canonical owner, harder near each peak.
 */
export const CW = 180;
export const CH = 90;
export const TOWN_STRIDE = 6;
const NP = POLITIES.length;

export const POLITY_FATE = new FateField({ order: [[-12026, 0.2], [-2026, 0.6], [-526, 0.8]] }, POLITIES.map((p) => p.peak - PRESENT_YEAR).sort((a, b) => a - b));

export function canonicalOwner(lat: number, lon: number, year: number): [number, number] {
  let best = -1, bw = 0.22;
  for (let i = 0; i < NP; i++) {
    const p = POLITIES[i]!;
    const pw = polityPower(p, year);
    if (pw <= 0) continue;
    const d = gcDist(lat, lon, p.lat, p.lon);
    const w = pw * Math.exp(-((d / p.r) ** 2));
    if (w > bw) {
      bw = w;
      best = i;
    }
  }
  return [best, bw];
}

interface Town { lat: number; lon: number; size: number; life: number; age: number }

export class PolitySim implements AgentSim {
  readonly id = 'polities';
  readonly stride = TOWN_STRIDE;
  maxCells = 600;
  private rng = new Rng(1);
  private land = new Uint8Array(CW * CH);
  owner = new Int16Array(CW * CH).fill(-1);
  strength = new Float32Array(CW * CH);
  private dynColors: [number, number, number][] = [];
  private agentsOn = false;
  private year = -10000;
  private t = 0;
  towns: Town[] = [];
  private tick = 0;

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'polities');
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) this.land[y * CW + x] = landAt(89 - y * 2, -179 + x * 2) > -0.05 ? 1 : 0;
    this.year = PRESENT_YEAR + T;
    this.agentsOn = false;
    this.towns = [];
    this.dynColors = [];
    this.canonical();
    void fate;
  }

  private canonical(): void {
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        const i = y * CW + x;
        if (!this.land[i]) {
          this.owner[i] = -1;
          continue;
        }
        const [o, w] = canonicalOwner(89 - y * 2, -179 + x * 2, this.year);
        this.owner[i] = o;
        this.strength[i] = w;
      }
  }

  setLOD(mix: number): void {
    if (mix > 0.02 && !this.agentsOn) {
      this.agentsOn = true;
      // towns condense around the canonical cities
      this.towns = [];
      for (const c of ANCIENT_CITIES) {
        const w = cityWeight(c, this.year);
        if (w <= 0) continue;
        const n = 1 + Math.round(w * 5);
        for (let k = 0; k < n; k++) this.towns.push({ lat: c.lat + this.rng.normal(0, k ? 1.2 : 0), lon: c.lon + this.rng.normal(0, k ? 1.5 : 0), size: k ? w * 0.3 : w, life: this.rng.range(20, 80), age: this.rng.range(0, 10) });
      }
    } else if (mix < 0.01 && this.agentsOn) {
      this.agentsOn = false;
      this.towns = [];
    }
  }

  private colorOf(o: number): [number, number, number] {
    if (o < 0) return [0, 0, 0];
    if (o < NP) return POLITIES[o]!.color;
    return this.dynColors[o - NP] ?? [0.6, 0.6, 0.6];
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    this.year = PRESENT_YEAR + T;
    if (!this.agentsOn) {
      if (this.tick++ % 4 === 0) this.canonical();
      return;
    }
    const r = this.rng;
    const k = fate.k;
    // breathing borders: a few hundred random cells per tick consider their neighbours
    for (let n = 0; n < 900; n++) {
      const x = r.int(0, CW - 1), y = r.int(1, CH - 2);
      const i = y * CW + x;
      if (!this.land[i]) continue;
      const nb = [i - 1 - (x === 0 ? -CW : 0), i + 1 - (x === CW - 1 ? CW : 0), i - CW, i + CW][r.int(0, 3)]!;
      if (!this.land[nb]) continue;
      const lat = 89 - y * 2, lon = -179 + x * 2;
      const [canon, cw] = canonicalOwner(lat, lon, this.year);
      const mine = this.owner[i]!, theirs = this.owner[nb]!;
      // fate: snap back toward the canonical owner
      if (canon !== mine && r.next() < k * 0.08 * (canon >= 0 ? cw + 0.3 : 0.5)) {
        this.owner[i] = canon;
        this.strength[i] = cw;
        continue;
      }
      if (theirs === mine || theirs < 0) continue;
      const sMine = mine >= 0 && mine < NP ? polityPower(POLITIES[mine]!, this.year) : this.strength[i]! * 0.8;
      const sTheirs = theirs < NP ? polityPower(POLITIES[theirs]!, this.year) : this.strength[nb]! * 0.8;
      if (r.next() < 0.05 + 0.5 * Math.max(0, sTheirs - sMine) + r.normal(0, 0.05)) {
        this.owner[i] = theirs;
        this.strength[i] = this.strength[nb]! * 0.95;
      }
    }
    // overstretched provinces secede (rarely), founding short-lived local states
    if (r.next() < dt * 0.6) {
      const x = r.int(0, CW - 1), y = r.int(5, CH - 6);
      const i = y * CW + x;
      const o = this.owner[i]!;
      if (this.land[i] && o >= 0 && this.strength[i]! < 0.45) {
        const id = NP + this.dynColors.length;
        const base = this.colorOf(o);
        this.dynColors.push([Math.min(1, base[0] * 0.7 + r.next() * 0.4), Math.min(1, base[1] * 0.7 + r.next() * 0.4), Math.min(1, base[2] * 0.7 + r.next() * 0.4)]);
        const rad = r.int(1, 3);
        for (let dy = -rad; dy <= rad; dy++)
          for (let dx = -rad; dx <= rad; dx++) {
            const j = (y + dy) * CW + ((x + dx + CW) % CW);
            if (this.land[j] && this.owner[j] === o) {
              this.owner[j] = id;
              this.strength[j] = 0.4;
            }
          }
      }
    }
    // towns: grow, age, die; new ones appear where polities are strong
    for (const tw of this.towns) {
      tw.age += dt;
      tw.size *= 1 + dt * 0.01 * (r.next() - 0.4);
    }
    this.towns = this.towns.filter((tw) => tw.age < tw.life || tw.size > 0.6);
    if (this.towns.length < this.maxCells && r.next() < dt * 6) {
      const src = this.towns[r.int(0, Math.max(0, this.towns.length - 1))];
      if (src) this.towns.push({ lat: src.lat + r.normal(0, 2), lon: src.lon + r.normal(0, 2.5), size: r.range(0.05, 0.25), life: r.range(10, 60), age: 0 });
    }
  }

  snapshot(): SimSnapshot {
    const field = new Float32Array(CW * CH * 4);
    for (let y = 0; y < CH; y++)
      for (let x = 0; x < CW; x++) {
        const i = y * CW + x;
        const o = this.owner[i]!;
        if (o < 0) continue;
        const c = this.colorOf(o);
        const right = this.owner[y * CW + ((x + 1) % CW)]!, down = y < CH - 1 ? this.owner[i + CW]! : o;
        const border = right !== o || down !== o ? 1 : 0;
        const s = Math.min(1, this.strength[i]! + 0.2);
        field[i * 4] = c[0] * s;
        field[i * 4 + 1] = c[1] * s;
        field[i * 4 + 2] = c[2] * s;
        field[i * 4 + 3] = border;
      }
    const out = new Float32Array(this.towns.length * TOWN_STRIDE);
    this.towns.forEach((tw, k) => out.set([tw.lat, tw.lon, tw.size, Math.min(1, tw.age * 0.5), Math.max(0, Math.min(1, (tw.life - tw.age) * 0.3 + (tw.size > 0.6 ? 1 : 0))), k * 0.618], k * TOWN_STRIDE));
    return { agents: out, count: this.towns.length, stride: TOWN_STRIDE, fields: { polity: { data: field, w: CW, h: CH, ch: 4 } }, stats: { towns: this.towns.length, year: this.year }, t: this.t };
  }
}
