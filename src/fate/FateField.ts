import { clamp01, smoothstep } from '../core/math';

/**
 * FateField — Regime A constraints.
 *
 * Each aggregate variable has a canonical keyframe track A*(T). Between keyframes
 * values ease with smoothstep. Local agent simulations feel a spring toward A*(T)
 * with stiffness k that rises as the next milestone approaches (annealing).
 */
export type Track = readonly (readonly [T: number, v: number])[];

export interface FateSample {
  /** canonical aggregate targets */
  values: Record<string, number>;
  /** spring stiffness (1/local-second) */
  k: number;
  /** progress φ∈[0,1] from previous to next milestone */
  phi: number;
  /** index of the next milestone (or -1) */
  next: number;
}

export function sampleTrack(track: Track, T: number): number {
  const n = track.length;
  if (n === 0) return 0;
  if (T <= track[0]![0]) return track[0]![1];
  if (T >= track[n - 1]![0]) return track[n - 1]![1];
  let i = 0;
  while (i < n - 2 && T >= track[i + 1]![0]) i++;
  const [t0, v0] = track[i]!;
  const [t1, v1] = track[i + 1]!;
  const u = smoothstep(0, 1, (T - t0) / (t1 - t0));
  return v0 + (v1 - v0) * u;
}

export class FateField {
  constructor(
    readonly tracks: Record<string, Track>,
    /** milestone dates, ascending */
    readonly milestones: readonly number[],
    readonly k0 = 0.35,
  ) {}

  stiffness(T: number): { k: number; phi: number; next: number } {
    const ms = this.milestones;
    let next = ms.findIndex((m) => m >= T);
    if (next < 0) return { k: this.k0 * 9, phi: 1, next: -1 };
    const prev = next > 0 ? ms[next - 1]! : ms[0]! - (ms[1] ?? ms[0]! + 1) + ms[0]!;
    const span = Math.max(1e-9, ms[next]! - prev);
    const phi = clamp01((T - prev) / span);
    return { k: this.k0 * (1 + 8 * phi ** 4), phi, next };
  }

  sample(T: number): FateSample {
    const values: Record<string, number> = {};
    for (const key in this.tracks) values[key] = sampleTrack(this.tracks[key]!, T);
    const s = this.stiffness(T);
    return { values, k: s.k, phi: s.phi, next: s.next };
  }

  value(key: string, T: number): number {
    const tr = this.tracks[key];
    return tr ? sampleTrack(tr, T) : 0;
  }
}

/**
 * Apply the fate spring to a measured aggregate. Returns the corrective rate
 * (per local second) that local rules should add to birth/death/conversion.
 */
export function fateCorrection(measured: number, target: number, k: number): number {
  return k * (target - measured);
}
