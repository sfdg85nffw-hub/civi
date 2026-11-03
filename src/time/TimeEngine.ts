import { clamp, damp } from '../core/math';
import { CHAPTERS, type ChapterId, TAKEOVER_T } from '../chapters/meta';
import { Odyssey } from './odyssey';

export type TimeMode = 'odyssey' | 'manual';

export const MIN_SPEED = 1 / 365.25; // 1 sim-day per second
export const MAX_SPEED = 1e9; // 1 Gyr per second
export const T_MIN = -4.0e9;

/**
 * TimeEngine owns sim time. In Odyssey mode sim time is a pure function of
 * story time (the director's schedule). In manual mode the user drives a
 * logarithmic speed with smoothing.
 */
export class TimeEngine {
  readonly odyssey = new Odyssey();
  mode: TimeMode = 'odyssey';
  storyTime = 0;
  T = -4.0e9;
  /** current speed in years per real second (signed: negative = rewinding) */
  speed = 0;
  paused = false;
  /** manual target speed (log10 years/sec) */
  private targetLog = 6;
  private currentLog = 6;
  /** Regime B frontier: sim time up to which the galaxy history is computed */
  frontier = Infinity;
  /** true while time is held at the frontier waiting for the worker */
  waiting = false;
  /** time engine is frozen during the Coda's ring rest */
  resting = false;
  /** listeners */
  onModeChange: ((m: TimeMode) => void) | null = null;

  get chapter(): ChapterId {
    if (this.mode === 'odyssey') return this.odyssey.chapterAtStory(this.storyTime);
    return this.chapterAtT(this.T);
  }

  chapterAtT(T: number): ChapterId {
    if (T >= this.odyssey.contestEnd) return 10;
    for (let i = 9; i >= 0; i--) if (T >= CHAPTERS[i]!.T0) return CHAPTERS[i]!.id;
    return 0;
  }

  get regime(): 'A' | 'B' {
    return this.T > TAKEOVER_T ? 'B' : 'A';
  }

  /** Advance by a real-time delta (seconds). */
  update(dt: number): void {
    if (this.resting) {
      this.speed = 0;
      return;
    }
    if (this.mode === 'odyssey') {
      if (this.paused) {
        this.speed = 0;
        return;
      }
      let next = this.storyTime + dt;
      // Regime B: never run past the computed frontier
      const Tn = this.odyssey.T(next);
      if (Tn > this.frontier) {
        this.waiting = true;
        next = Math.min(next, Math.max(this.storyTime, this.odyssey.s(this.frontier)));
      } else this.waiting = false;
      this.storyTime = Math.min(next, this.odyssey.total);
      this.T = this.odyssey.T(this.storyTime);
      this.speed = this.odyssey.speed(this.storyTime);
      return;
    }
    // manual
    this.currentLog = damp(this.currentLog, this.targetLog, 3.0, dt);
    const sp = this.paused ? 0 : Math.pow(10, this.currentLog) * this.direction;
    this.speed = damp(this.speed, sp, 6.0, dt);
    let T = this.T + this.speed * dt;
    if (T > this.frontier) {
      this.waiting = true;
      T = this.frontier;
    } else this.waiting = false;
    this.T = clamp(T, T_MIN, 1e100);
  }

  private direction = 1;

  enterManual(): void {
    if (this.mode === 'manual') return;
    this.mode = 'manual';
    const s = Math.max(Math.abs(this.speed), MIN_SPEED);
    this.currentLog = this.targetLog = Math.log10(clamp(s, MIN_SPEED, MAX_SPEED));
    this.onModeChange?.('manual');
  }

  returnToOdyssey(): void {
    if (this.mode === 'odyssey') return;
    this.mode = 'odyssey';
    this.paused = false;
    this.direction = 1;
    this.storyTime = this.odyssey.s(this.T);
    this.onModeChange?.('odyssey');
  }

  /** Logarithmic speed control: v in [0,1] → [1 day/s, 1 Gyr/s]. */
  setSpeed01(v: number): void {
    this.enterManual();
    const lo = Math.log10(MIN_SPEED);
    const hi = Math.log10(MAX_SPEED);
    this.targetLog = lo + clamp(v, 0, 1) * (hi - lo);
    this.paused = false;
  }

  get speed01(): number {
    const lo = Math.log10(MIN_SPEED);
    const hi = Math.log10(MAX_SPEED);
    const l = this.mode === 'manual' ? this.targetLog : Math.log10(Math.max(Math.abs(this.speed), MIN_SPEED));
    return clamp((l - lo) / (hi - lo), 0, 1);
  }

  /** Multiply speed by 10^steps/2 ([ and ]). */
  nudgeSpeed(steps: number): void {
    this.enterManual();
    this.targetLog = clamp(this.targetLog + steps * 0.5, Math.log10(MIN_SPEED), Math.log10(MAX_SPEED));
    this.paused = false;
  }

  setSpeedYps(yps: number): void {
    this.enterManual();
    this.targetLog = Math.log10(clamp(Math.abs(yps), MIN_SPEED, MAX_SPEED));
    this.currentLog = this.targetLog;
    this.speed = Math.pow(10, this.targetLog);
  }

  togglePause(): void {
    this.enterManual();
    this.paused = !this.paused;
  }

  /** Jump to sim time T (manual scrub). */
  seekT(T: number): void {
    this.enterManual();
    this.T = clamp(T, T_MIN, Math.min(1e100, this.frontier));
  }

  /** Jump to a story second (Odyssey or debug). */
  seekStory(s: number): void {
    this.storyTime = clamp(s, 0, this.odyssey.total);
    this.T = this.odyssey.T(this.storyTime);
    this.speed = this.odyssey.speed(this.storyTime);
  }

  jumpToChapter(id: number): void {
    const sp = this.odyssey.span(id);
    if (this.mode === 'odyssey') this.seekStory(sp.s0 + 0.001);
    else this.seekT(this.odyssey.T(sp.s0 + 0.001));
  }
}
