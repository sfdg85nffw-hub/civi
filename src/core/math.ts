export const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const invLerp = (a: number, b: number, x: number): number => (b === a ? 0 : (x - a) / (b - a));
export const remap = (x: number, a0: number, a1: number, b0: number, b1: number): number =>
  lerp(b0, b1, invLerp(a0, a1, x));

export function smoothstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function smootherstep(e0: number, e1: number, x: number): number {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * clamp01(t)) - 1) / 2;
export const easeInOutCubic = (t: number): number => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInCubic = (t: number): number => Math.pow(clamp01(t), 3);
export const easeOutExpo = (t: number): number => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp01(t)));
export const easeInOutQuint = (t: number): number => {
  t = clamp01(t);
  return t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2;
};

/** Frame-rate independent exponential smoothing toward a target. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Critically damped spring (value, velocity) toward target; returns [x, v]. */
export function spring(x: number, v: number, target: number, omega: number, dt: number): [number, number] {
  const f = 1 + 2 * dt * omega;
  const oo = omega * omega;
  const hoo = dt * oo;
  const hhoo = dt * hoo;
  const detInv = 1 / (f + hhoo);
  const detX = f * x + dt * v + hhoo * target;
  const detV = v + hoo * (target - x);
  return [detX * detInv, detV * detInv];
}

/** Signed log warp used by the Odyssey schedule and the timeline. */
export const warp = (T: number): number => Math.sign(T) * Math.log10(1 + Math.abs(T));
export const unwarp = (z: number): number => Math.sign(z) * (Math.pow(10, Math.abs(z)) - 1);

/**
 * Monotone cubic Hermite interpolation (Fritsch–Carlson).
 * xs strictly increasing; ys monotone (non-decreasing) for a monotone result.
 */
export class MonotoneCubic {
  readonly xs: Float64Array;
  readonly ys: Float64Array;
  readonly ms: Float64Array;

  constructor(xs: ArrayLike<number>, ys: ArrayLike<number>) {
    const n = xs.length;
    this.xs = Float64Array.from(xs);
    this.ys = Float64Array.from(ys);
    this.ms = new Float64Array(n);
    if (n < 2) return;
    const d = new Float64Array(n - 1);
    for (let i = 0; i < n - 1; i++) d[i] = (this.ys[i + 1]! - this.ys[i]!) / (this.xs[i + 1]! - this.xs[i]!);
    this.ms[0] = d[0]!;
    this.ms[n - 1] = d[n - 2]!;
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1]! * d[i]! <= 0) this.ms[i] = 0;
      else {
        const h0 = this.xs[i]! - this.xs[i - 1]!;
        const h1 = this.xs[i + 1]! - this.xs[i]!;
        const w1 = 2 * h1 + h0;
        const w2 = h1 + 2 * h0;
        this.ms[i] = (w1 + w2) / (w1 / d[i - 1]! + w2 / d[i]!);
      }
    }
  }

  /** Index i such that xs[i] <= x < xs[i+1] (clamped). */
  segment(x: number): number {
    const xs = this.xs;
    let lo = 0;
    let hi = xs.length - 2;
    if (x <= xs[0]!) return 0;
    if (x >= xs[hi + 1]!) return hi;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (xs[mid]! <= x) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }

  eval(x: number): number {
    const n = this.xs.length;
    if (n === 1) return this.ys[0]!;
    if (x <= this.xs[0]!) return this.ys[0]!;
    if (x >= this.xs[n - 1]!) return this.ys[n - 1]!;
    const i = this.segment(x);
    const x0 = this.xs[i]!;
    const h = this.xs[i + 1]! - x0;
    const t = (x - x0) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (
      (2 * t3 - 3 * t2 + 1) * this.ys[i]! +
      (t3 - 2 * t2 + t) * h * this.ms[i]! +
      (-2 * t3 + 3 * t2) * this.ys[i + 1]! +
      (t3 - t2) * h * this.ms[i + 1]!
    );
  }

  derivative(x: number): number {
    const n = this.xs.length;
    if (n === 1) return 0;
    const xc = Math.min(Math.max(x, this.xs[0]!), this.xs[n - 1]!);
    const i = this.segment(xc);
    const x0 = this.xs[i]!;
    const h = this.xs[i + 1]! - x0;
    const t = (xc - x0) / h;
    const t2 = t * t;
    return (
      ((6 * t2 - 6 * t) * this.ys[i]! +
        (3 * t2 - 4 * t + 1) * h * this.ms[i]! +
        (-6 * t2 + 6 * t) * this.ys[i + 1]! +
        (3 * t2 - 2 * t) * h * this.ms[i + 1]!) /
      h
    );
  }

  /** Inverse for a monotone increasing curve, by bisection. */
  inverse(y: number): number {
    const n = this.xs.length;
    if (y <= this.ys[0]!) return this.xs[0]!;
    if (y >= this.ys[n - 1]!) return this.xs[n - 1]!;
    let lo = this.xs[0]!;
    let hi = this.xs[n - 1]!;
    for (let k = 0; k < 80; k++) {
      const mid = 0.5 * (lo + hi);
      if (this.eval(mid) < y) lo = mid;
      else hi = mid;
    }
    return 0.5 * (lo + hi);
  }
}

/** sRGB hex → linear RGB triplet. */
export function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const s = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255);
  return s.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))) as [number, number, number];
}

export function linearToHex(rgb: readonly number[]): string {
  const s = rgb.map((c) => {
    c = clamp01(c);
    const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(v * 255);
  });
  return '#' + s.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** Mix colours perceptually (OKLab). Inputs/outputs linear RGB. */
export function mixOklab(colors: readonly (readonly number[])[], weights?: readonly number[]): [number, number, number] {
  const toLab = (c: readonly number[]): number[] => {
    const l = 0.4122214708 * c[0]! + 0.5363325363 * c[1]! + 0.0514459929 * c[2]!;
    const m = 0.2119034982 * c[0]! + 0.6806995451 * c[1]! + 0.1073969566 * c[2]!;
    const s = 0.0883024619 * c[0]! + 0.2817188376 * c[1]! + 0.6299787005 * c[2]!;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return [
      0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
      1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
      0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
    ];
  };
  const fromLab = (L: number, a: number, b: number): [number, number, number] => {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
  };
  let L = 0, A = 0, B = 0, W = 0;
  colors.forEach((c, i) => {
    const w = weights ? weights[i]! : 1;
    const lab = toLab(c);
    L += lab[0]! * w;
    A += lab[1]! * w;
    B += lab[2]! * w;
    W += w;
  });
  if (W <= 0) return [1, 1, 1];
  return fromLab(L / W, A / W, B / W).map((v) => clamp01(v)) as [number, number, number];
}

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

/** lat/lon (degrees) → unit vector, Y up, lon 0 at +Z, east toward +X. */
export function latLonToVec3(lat: number, lon: number): [number, number, number] {
  const phi = lat * DEG;
  const lam = lon * DEG;
  return [Math.cos(phi) * Math.sin(lam), Math.sin(phi), Math.cos(phi) * Math.cos(lam)];
}
