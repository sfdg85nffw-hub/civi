import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import { MODERN_CITIES } from '../../data/modern';
import { DATACENTERS, LAST_LIGHT, LAST_LIGHT_T } from '../../data/singularity';
import { gcDist } from '../../data/history';
import { WORLD_TRACKS } from '../../fate/world';
import { sampleTrack } from '../../fate/FateField';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * THE SINGULARITY — local rules for Chapter 7.
 *
 * The outcome is fixed: the lattice covers the world and the last light goes
 * out in 2048. Who resists, who flares, and who goes dark first is not. Human
 * lights near the advancing front flare (resist), lean on lit neighbours, and
 * go out; the fate spring holds the surviving fraction to its canonical track.
 */
export const SPARK_STRIDE = 6;
export const LATTICE_FATE = new FateField({ humanLights: WORLD_TRACKS.humanLights! }, [9, 12, 17, 21, LAST_LIGHT_T]);

/** angular distance (deg) from the nearest datacenter */
export function dcDistance(lat: number, lon: number): number {
  let d = 999;
  for (const [la, lo] of DATACENTERS) d = Math.min(d, gcDist(lat, lon, la, lo));
  return d;
}
/** canonical lattice front radius (deg) at sim time T */
export function latticeFront(T: number): number {
  return sampleTrack(WORLD_TRACKS.lattice!, T) * 3.3 * (180 / Math.PI);
}

interface Spark { lat: number; lon: number; d: number; alive: boolean; flare: number; dark: number; seed: number }

export class LatticeSim implements AgentSim {
  readonly id = 'lattice';
  readonly stride = SPARK_STRIDE;
  maxCells = 700;
  private rng = new Rng(1);
  sparks: Spark[] = [];
  private agentsOn = false;
  private T = 0;
  private t = 0;

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'lattice');
    this.T = T;
    this.sparks = [];
    const total = MODERN_CITIES.reduce((a, c) => a + c[4], 0);
    for (let k = 0; k < this.maxCells - 1; k++) {
      let r = this.rng.next() * total;
      let c = MODERN_CITIES[0]!;
      for (const cc of MODERN_CITIES) {
        r -= cc[4];
        if (r <= 0) {
          c = cc;
          break;
        }
      }
      const lat = c[1] + this.rng.normal(0, 1.6), lon = c[2] + this.rng.normal(0, 2);
      this.sparks.push({ lat, lon, d: dcDistance(lat, lon), alive: true, flare: 0, dark: 0, seed: this.rng.next() });
    }
    this.sparks.push({ lat: LAST_LIGHT[0], lon: LAST_LIGHT[1], d: 999, alive: true, flare: 0, dark: 0, seed: 0.5 });
    this.agentsOn = false;
    void fate;
  }

  setLOD(mix: number): void {
    this.agentsOn = mix > 0.02;
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    this.T = T;
    const front = latticeFront(T);
    const r = this.rng;
    const target = fate.targets.humanLights ?? 1;
    const alive = this.sparks.filter((s) => s.alive).length / this.sparks.length;
    const pressure = Math.max(0, alive - target) * fate.k * 3;
    const last = this.sparks[this.sparks.length - 1]!;
    for (const s of this.sparks) {
      if (s === last) {
        // the last light is spared by the field and taken by the fixed date
        if (T >= LAST_LIGHT_T) s.alive = false;
        s.flare = T > LAST_LIGHT_T - 0.4 && T < LAST_LIGHT_T ? 0.5 + 0.5 * Math.sin(this.t * 13) : 0;
        if (!s.alive) s.dark = Math.min(1, s.dark + dt * 0.8);
        continue;
      }
      if (!s.alive) {
        s.dark = Math.min(1, s.dark + dt * 1.5);
        continue;
      }
      const depth = front - s.d; // degrees inside the covered region
      if (depth > -6) s.flare = Math.min(1, s.flare + dt * (this.agentsOn ? 1.5 : 4));
      if (depth > 0) {
        const p = this.agentsOn ? dt * (0.4 + depth * 0.15 + pressure) : 1;
        if (r.next() < p) s.alive = false;
      }
    }
  }

  snapshot(): SimSnapshot {
    const out = new Float32Array(this.sparks.length * SPARK_STRIDE);
    this.sparks.forEach((s, k) => out.set([s.lat, s.lon, s.alive ? 1 : 0, s.flare, s.seed, s.dark], k * SPARK_STRIDE));
    return { agents: out, count: this.sparks.length, stride: SPARK_STRIDE, fields: {}, stats: { alive: this.sparks.filter((s) => s.alive).length / this.sparks.length }, t: this.t };
  }
}
