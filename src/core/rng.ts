/**
 * Seeded randomness. Every subsystem draws from its own independent named stream
 * so that adding draws in one subsystem never perturbs another.
 *
 * Generator: sfc32 (Small Fast Counting, Chris Doty-Humphrey) — 128-bit state,
 * passes PractRand, trivially portable between main thread, workers and Node.
 */

/** 32-bit FNV-1a then murmur-style finaliser. Stable across platforms. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return fmix32(h >>> 0);
}

export function fmix32(h: number): number {
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Combine integers into one 32-bit hash. */
export function hash32(...xs: number[]): number {
  let h = 0x9e3779b9;
  for (const x of xs) {
    h ^= fmix32((x | 0) + 0x7f4a7c15 + (h << 6) + (h >>> 2));
  }
  return fmix32(h);
}

/** Uniform float in [0,1) from integer inputs — stateless, for shaders-like CPU noise. */
export function hash01(...xs: number[]): number {
  return hash32(...xs) / 4294967296;
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  constructor(seed: number, salt = 0) {
    this.a = fmix32(seed ^ 0xdeadbeef);
    this.b = fmix32((seed + 0x9e3779b9) ^ salt);
    this.c = fmix32(salt ^ 0x51ed270b);
    this.d = 1;
    for (let i = 0; i < 15; i++) this.nextU32();
  }

  /** Construct from a seed and a stream name. */
  static stream(seed: number, name: string): Rng {
    return new Rng(seed, hashString(name));
  }

  nextU32(): number {
    const t = (((this.a + this.b) | 0) + this.d) | 0;
    this.d = (this.d + 1) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** [0,1) */
  next(): number {
    return this.nextU32() / 4294967296;
  }

  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }

  int(lo: number, hiInclusive: number): number {
    return lo + Math.floor(this.next() * (hiInclusive - lo + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)]!;
  }

  /** Standard normal via Box–Muller. */
  normal(mean = 0, sd = 1): number {
    let u = this.next();
    if (u < 1e-12) u = 1e-12;
    const v = this.next();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const t = arr[i]!;
      arr[i] = arr[j]!;
      arr[j] = t;
    }
    return arr;
  }

  /** Fork a child stream (deterministic). */
  fork(name: string): Rng {
    return new Rng(this.nextU32(), hashString(name));
  }

  /** Serialisable state, for checkpoints. */
  getState(): [number, number, number, number] {
    return [this.a, this.b, this.c, this.d];
  }

  setState(s: readonly number[]): void {
    this.a = s[0]! | 0;
    this.b = s[1]! | 0;
    this.c = s[2]! | 0;
    this.d = s[3]! | 0;
  }
}

/** A run's seed is a 32-bit integer; shown in the HUD as 8 hex digits. */
export function seedToString(seed: number): string {
  return (seed >>> 0).toString(16).toUpperCase().padStart(8, '0');
}

export function parseSeed(s: string | null | undefined): number | null {
  if (!s) return null;
  if (/^[0-9a-fA-F]{1,8}$/.test(s)) return parseInt(s, 16) >>> 0;
  if (/^\d+$/.test(s)) return Number(s) >>> 0;
  return hashString(s);
}

export function randomSeed(): number {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0]! >>> 0;
  } catch {
    return (Math.random() * 4294967296) >>> 0;
  }
}
