import { MonotoneCubic, warp, unwarp } from '../core/math';
import { CHAPTERS, type ChapterId } from '../chapters/meta';

/**
 * The Odyssey schedule maps story seconds (since Begin) to sim time.
 * Each chapter contributes keyframes (s relative to chapter start, T).
 * Interpolation: monotone cubic in warped time z = sign(T)·log10(1+|T|).
 * The Contest's duration and end date are only known once the galaxy
 * history is computed, so the schedule can be rebuilt.
 */
export type Keyframe = readonly [s: number, T: number];

export const CHAPTER_KEYS: Record<number, Keyframe[]> = {
  0: [[0, -4.0e9], [10, -3.995e9]],
  1: [
    [0, -3.995e9], [4.5, -3.8e9], [6.5, -3.3e9], [8, -2.95e9], [12.5, -2.9493e9],
    [15.5, -2.62e9], [18.5, -2.47e9], [21, -2.34e9], [22.6, -2.25e9], [24, -2.1e9], [25, -1.6e9],
  ],
  2: [
    [0, -1.6e9], [5.5, -1.48e9], [7.5, -1.1e9], [9, -1.0e9], [12.8, -0.99965e9],
    [15, -6.9e8], [17.6, -5.72e8], [19.6, -5.3e8], [24.2, -5.2996e8], [25, -5.0e8],
  ],
  3: [
    [0, -5.0e8], [5, -3.9e8], [7, -3.2e8], [8.5, -3.0e8], [12, -2.99996e8],
    [15, -2.52e8], [19, -1.1e8], [20.5, -6.60001e7], [26.5, -6.59999e7], [28, -5.0e7], [30, -7.0e6],
  ],
  4: [
    [0, -7.0e6], [4, -1.2e6], [5, -1.0e6], [10, -0.99998e6], [12.5, -9.0e4],
    [14, -6.0e4], [16, -4.6e4], [18.5, -4.42e4], [20, -12026],
  ],
  5: [
    [0, -12026], [4, -9500], [8, -5800], [12, -4100], [15, -2700], [17, -2026],
    [21, -1550], [24, -1250], [26.5, -680], [28.5, -672], [30, -526],
  ],
  6: [
    [0, -526], [4, -420], [8, -266], [12.5, -110], [15, -81.6], [16.5, -80.4],
    [18.5, -57.6], [20, -56.4], [23, -20], [25, 0],
  ],
  7: [
    [0, 0], [5, 5], [13, 17], [18, 21.5], [23.5, 22.6], [27, 40], [30, 50],
  ],
  8: [
    [0, 50], [3, 300], [6, 2e4], [9, 6e4], [13, 1e6], [18, 1e7], [25, 1e9],
  ],
  9: [[0, 1e9], [45, 2.0e10]],
  10: [
    [0, 2.0e10], [4, 2.0001e10], [9, 1e14], [11, 1e40], [16, 1e100], [35, 1e100],
  ],
};

export interface OdysseyChapterSpan {
  id: ChapterId;
  s0: number;
  s1: number;
}

export class Odyssey {
  private curve!: MonotoneCubic;
  spans: OdysseyChapterSpan[] = [];
  total = 0;
  contestDuration = 45;
  contestEnd = 2.0e10;
  private contestKeys: Keyframe[] | null = null;

  constructor() {
    this.rebuild();
  }

  /** Install the emergent Contest timing from the galaxy history. */
  setContest(endT: number, duration: number, keys?: Keyframe[]): void {
    this.contestEnd = Math.max(endT, 1.5e9);
    this.contestDuration = Math.max(30, Math.min(60, duration));
    this.contestKeys = keys ?? null;
    this.rebuild();
  }

  private chapterKeys(id: number): Keyframe[] {
    if (id === 9) {
      if (this.contestKeys && this.contestKeys.length >= 2) return this.contestKeys;
      return [[0, 1e9], [this.contestDuration, this.contestEnd]];
    }
    if (id === 10) {
      const e = this.contestEnd;
      return [[0, e], [4, e * 1.00005], [9, 1e14], [11, 1e40], [16, 1e100], [35, 1e100]];
    }
    return CHAPTER_KEYS[id]!;
  }

  rebuild(): void {
    const xs: number[] = [];
    const ys: number[] = [];
    this.spans = [];
    let s0 = 0;
    for (const ch of CHAPTERS) {
      const keys = this.chapterKeys(ch.id);
      const dur = ch.id === 9 ? this.contestDuration : ch.budget;
      for (const [s, T] of keys) {
        const x = s0 + s;
        const y = warp(T);
        if (xs.length && x <= xs[xs.length - 1]! + 1e-9) {
          // chapter boundary: keep the later value but keep x strictly increasing
          ys[ys.length - 1] = Math.max(ys[ys.length - 1]!, y);
          continue;
        }
        xs.push(x);
        ys.push(Math.max(y, ys.length ? ys[ys.length - 1]! : y));
      }
      this.spans.push({ id: ch.id, s0, s1: s0 + dur });
      s0 += dur;
    }
    this.total = s0;
    this.curve = new MonotoneCubic(xs, ys);
  }

  /** Sim time at story second s. */
  T(s: number): number {
    return unwarp(this.curve.eval(s));
  }

  /** Sim speed (years per real second) at story second s. */
  speed(s: number): number {
    const z = this.curve.eval(s);
    const dz = this.curve.derivative(s);
    // dT/ds = dT/dz · dz/ds ; T = sign(z)(10^|z| − 1) → dT/dz = ln10 · 10^|z|
    return Math.LN10 * Math.pow(10, Math.abs(z)) * dz;
  }

  /** Story second at sim time T (inverse; first occurrence on flats). */
  s(T: number): number {
    return this.curve.inverse(warp(T));
  }

  chapterAtStory(s: number): ChapterId {
    for (const sp of this.spans) if (s < sp.s1) return sp.id;
    return 10;
  }

  span(id: number): OdysseyChapterSpan {
    return this.spans[id]!;
  }

  /** Story seconds where the Coda begins. */
  get codaStart(): number {
    return this.spans[10]!.s0;
  }
}
