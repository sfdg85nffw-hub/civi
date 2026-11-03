import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import { MODERN_CITIES } from '../../data/modern';
import { gcDist } from '../../data/history';
import { PRESENT_YEAR } from '../../time/format';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * THE MODERN WORLD — local rules for Chapter 6.
 *
 * Canonical field: each city's light follows its real industrialisation date.
 * Agents (slow time): industry diffuses along trade links — a city ignites
 * when its neighbours' industry and its own luck say so, so the night side
 * lights up in a different order every viewing; ships and, later, aircraft
 * shuttle between lit cities. The fate spring pulls each ignition toward its
 * canonical decade.
 */
export const CITY_STRIDE = 6;
export const CITY_FATE = new FateField({ lit: [[-526, 0.0], [-266, 0.02], [-126, 0.3], [-76, 0.6], [0, 1]] }, [-266, -144, -81.5, -57, -35, 0]);

export function canonicalLight(year: number, indYear: number, w: number): number {
  const lamp = year > 1500 ? 0.05 : 0.02;
  const electric = 1 / (1 + Math.exp(-(year - indYear - 25) / 12));
  return w * (lamp + 0.95 * electric);
}

interface Vehicle { a: number; b: number; t: number; speed: number; plane: boolean }

export class CitySim implements AgentSim {
  readonly id = 'cities';
  readonly stride = CITY_STRIDE;
  maxCells = 400;
  private rng = new Rng(1);
  private ignite = new Float32Array(MODERN_CITIES.length);
  private light = new Float32Array(MODERN_CITIES.length);
  private agentsOn = false;
  private year = 1500;
  private t = 0;
  private vehicles: Vehicle[] = [];
  private nbrs: number[][] = [];

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'cities');
    this.year = PRESENT_YEAR + T;
    this.agentsOn = false;
    this.vehicles = [];
    this.nbrs = MODERN_CITIES.map((c, i) =>
      MODERN_CITIES.map((d, j) => [j, gcDist(c[1], c[2], d[1], d[2])] as [number, number]).filter(([j, dd]) => j !== i && dd < 18).map(([j]) => j),
    );
    MODERN_CITIES.forEach((c, i) => {
      this.ignite[i] = c[3];
      this.light[i] = canonicalLight(this.year, c[3], c[4]);
    });
    void fate;
  }

  setLOD(mix: number): void {
    if (mix > 0.02 && !this.agentsOn) {
      this.agentsOn = true;
      // each city's personal ignition date wanders around the canonical one
      MODERN_CITIES.forEach((c, i) => (this.ignite[i] = c[3] + this.rng.normal(0, 10)));
    } else if (mix < 0.01 && this.agentsOn) {
      this.agentsOn = false;
      this.vehicles = [];
    }
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    this.year = PRESENT_YEAR + T;
    const y = this.year;
    const r = this.rng;
    if (!this.agentsOn) {
      MODERN_CITIES.forEach((c, i) => (this.light[i] = canonicalLight(y, c[3], c[4])));
      return;
    }
    MODERN_CITIES.forEach((c, i) => {
      // diffusion: industrial neighbours pull the ignition date earlier
      let lit = 0;
      for (const j of this.nbrs[i]!) if (y > this.ignite[j]! + 10) lit++;
      if (lit > 0 && y < this.ignite[i]! && r.next() < dt * 0.04 * lit) this.ignite[i]! -= r.range(0.5, 3);
      // fate: toward the canonical decade
      this.ignite[i]! += (c[3] - this.ignite[i]!) * Math.min(1, fate.k * dt * 0.4);
      const target = canonicalLight(y, this.ignite[i]!, c[4]) * (0.9 + 0.2 * r.next());
      this.light[i]! += (target - this.light[i]!) * Math.min(1, dt * 3);
    });
    // traffic between lit cities: ships, then aircraft
    if (this.vehicles.length < 220 && r.next() < dt * 25) {
      const a = r.int(0, MODERN_CITIES.length - 1);
      const nb = this.nbrs[a]!;
      const b = r.next() < 0.6 && nb.length ? nb[r.int(0, nb.length - 1)]! : r.int(0, MODERN_CITIES.length - 1);
      if (this.light[a]! > 0.15 && this.light[b]! > 0.15 && a !== b) this.vehicles.push({ a, b, t: 0, speed: r.range(0.05, 0.12) * (y > 1950 ? 3 : 1), plane: y > 1950 && r.next() < 0.7 });
    }
    for (const v of this.vehicles) v.t += dt * v.speed;
    this.vehicles = this.vehicles.filter((v) => v.t < 1);
  }

  snapshot(): SimSnapshot {
    const n = MODERN_CITIES.length;
    const out = new Float32Array((n + this.vehicles.length) * CITY_STRIDE);
    MODERN_CITIES.forEach((c, i) => out.set([c[1], c[2], this.light[i]!, 0, (i * 0.618) % 1, c[4]], i * CITY_STRIDE));
    const D = Math.PI / 180;
    this.vehicles.forEach((v, k) => {
      const A = MODERN_CITIES[v.a]!, B = MODERN_CITIES[v.b]!;
      // slerp along the great circle
      const a = [Math.cos(A[1] * D) * Math.sin(A[2] * D), Math.sin(A[1] * D), Math.cos(A[1] * D) * Math.cos(A[2] * D)];
      const b = [Math.cos(B[1] * D) * Math.sin(B[2] * D), Math.sin(B[1] * D), Math.cos(B[1] * D) * Math.cos(B[2] * D)];
      const om = Math.acos(Math.max(-1, Math.min(1, a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!)));
      const s = Math.sin(om) || 1;
      const wa = Math.sin((1 - v.t) * om) / s, wb = Math.sin(v.t * om) / s;
      const p = [a[0]! * wa + b[0]! * wb, a[1]! * wa + b[1]! * wb, a[2]! * wa + b[2]! * wb];
      const lat = Math.asin(Math.max(-1, Math.min(1, p[1]!))) / D, lon = Math.atan2(p[0]!, p[2]!) / D;
      out.set([lat, lon, Math.sin(Math.PI * v.t), v.plane ? 2 : 1, (k * 0.31) % 1, 0.3], (n + k) * CITY_STRIDE);
    });
    let lit = 0;
    for (let i = 0; i < n; i++) lit += this.light[i]!;
    return { agents: out, count: n + this.vehicles.length, stride: CITY_STRIDE, fields: {}, stats: { lit: lit / n, vehicles: this.vehicles.length, agents: this.agentsOn ? 1 : 0 }, t: this.t };
  }
}
