import type { Director } from '../director/Director';
import type { Odyssey } from '../time/odyssey';
import { BEATS, CONTEST_STROKES, type DramaBeat } from '../chapters/beats';
import { smoothstep } from '../core/math';

interface Placed {
  key: string;
  b: DramaBeat;
  /** story time of the anchor (Odyssey) */
  s: number;
  /** sim time of the anchor (manual mode) */
  T: number;
}

export interface DramaSinks {
  line(date: string, text: string): void;
  riser(seconds: number): void;
  hit(size: number): void;
  glitch(seconds: number): void;
}

export interface DramaFrame {
  s: number;
  T: number;
  mode: 'odyssey' | 'manual';
  dt: number;
  paused: boolean;
}

/**
 * The beat engine (docs/DRAMA.md): every great turn is built up to (riser, tremor), inhaled
 * (the music drops out), hit (sub drop, flash, camera kick, sometimes a rupture) and let go
 * (a dated line, the music returning lower). In the Odyssey everything is scheduled on story
 * time; in manual mode beats land when sim time crosses them, without the build.
 */
export class DramaEngine {
  private placed: Placed[] = [];
  private placeKey = '';
  private prevS = -1;
  private prevT = -Infinity;
  private kickEnv = 0;
  private glitchLeft = 0;
  private glitchDur = 1;
  private afterEnv = 0;
  /** music multiplier (1 = untouched) */
  duck = 1;
  /** camera shake amplitude 0..1 */
  shake = 0;
  /** picture rupture 0..1 */
  glitch = 0;
  /** 0..1 rising through a build, for the score */
  tension = 0;
  /** 0..1 after a big hit, decaying (impact winter in the score) */
  aftermath = 0;

  constructor(private sinks: DramaSinks) {}

  /** Recompute anchors when the film's schedule changes (a new Contest, a new run). */
  private place(director: Director, odyssey: Odyssey): void {
    const contestIds = director.shotsFor(9).map((x) => x.def.id).join(',');
    const key = `${odyssey.total.toFixed(3)}|${contestIds}`;
    if (key === this.placeKey) return;
    this.placeKey = key;
    const shots = new Map<string, { s0: number; dur: number }>();
    for (let c = 0; c <= 10; c++) for (const x of director.shotsFor(c)) if (!shots.has(x.def.id)) shots.set(x.def.id, { s0: x.s0, dur: x.dur });
    const out: Placed[] = [];
    for (const b of BEATS) {
      const sh = b.shot ? shots.get(b.shot) : undefined;
      let s: number;
      if (sh) s = sh.s0 + (b.at ?? 0) * sh.dur;
      else if (b.T !== undefined) s = odyssey.s(b.T);
      else continue;
      out.push({ key: b.id, b, s, T: b.T ?? odyssey.T(s) });
    }
    // the Contest: each beat's event lands on its own moment in the time map
    for (const x of director.shotsFor(9)) {
      const p = x.def.params;
      const ty = typeof p?.beatType === 'string' ? p.beatType : '';
      const st = CONTEST_STROKES[ty];
      if (!st || p?.beatT === undefined) continue;
      const T = Number(p.beatT);
      // never earlier than the shot itself (the cut is the beat's entrance)
      const s = Math.max(x.s0 + 0.2, Math.min(x.s0 + x.dur - 0.3, odyssey.s(T)));
      out.push({ key: x.def.id, b: { id: x.def.id, ...st }, s, T });
    }
    out.sort((a, b) => a.s - b.s);
    this.placed = out;
    this.prevS = -1;
  }

  /** all anchors (for the event timeline in debug state) */
  timeline(): { id: string; s: number; T: number }[] {
    return this.placed.map((p) => ({ id: p.key, s: p.s, T: p.T }));
  }

  update(f: DramaFrame, director: Director, odyssey: Odyssey): void {
    this.place(director, odyssey);
    const s = f.s;
    const continuous = this.prevS >= 0 && s >= this.prevS && s - this.prevS < 1.0;
    const crossed = (x: number): boolean => continuous && this.prevS < x && s >= x;
    let tension = 0;
    let duck = 1;
    if (f.mode === 'odyssey') {
      for (const p of this.placed) {
        const b = p.b;
        // build: the riser is scheduled to peak exactly on the anchor
        if (b.build && crossed(p.s - b.build)) this.sinks.riser(Math.max(0.4, p.s - s));
        if (b.build && s > p.s - b.build && s < p.s) tension = Math.max(tension, (s - (p.s - b.build)) / b.build);
        // inhale: the music drops out, and comes back over a second and a half after the hit
        if (b.inhale) {
          if (s >= p.s - b.inhale && s < p.s) duck = Math.min(duck, 0.04);
          else if (s >= p.s && s < p.s + 2.5) duck = Math.min(duck, 0.04 + 0.66 * smoothstep(p.s, p.s + 1.5, s) + 0.3 * smoothstep(p.s + 1.5, p.s + 2.5, s));
        }
        if (crossed(p.s)) this.land(b);
        if (b.line && crossed(p.s + (b.lineAt ?? 0.6))) this.sinks.line(b.date ?? '', b.line);
      }
    } else if (!f.paused && f.T > this.prevT && Number.isFinite(this.prevT)) {
      // manual: the turns still land, without the build
      for (const p of this.placed) {
        if (this.prevT < p.T && f.T >= p.T && f.T - this.prevT < Math.max(1, Math.abs(p.T) * 0.05)) {
          this.land({ ...p.b, hit: (p.b.hit ?? 0) * 0.7 });
          if (p.b.line) this.sinks.line(p.b.date ?? '', p.b.line);
        }
      }
    }
    this.prevS = s;
    this.prevT = f.T;
    // envelopes
    this.kickEnv *= Math.exp(-f.dt * 2.4);
    this.afterEnv *= Math.exp(-f.dt * 0.35);
    if (this.glitchLeft > 0) this.glitchLeft = Math.max(0, this.glitchLeft - f.dt);
    this.tension = tension;
    this.duck = duck;
    this.aftermath = this.afterEnv;
    this.shake = Math.max(this.kickEnv, tension * tension * 0.18);
    this.glitch = this.glitchLeft > 0 ? Math.min(1, this.glitchLeft / Math.min(0.25, this.glitchDur)) * (0.7 + 0.3 * Math.random()) : 0;
  }

  private land(b: DramaBeat): void {
    if (b.hit) this.sinks.hit(b.hit);
    if (b.kick) this.kickEnv = Math.max(this.kickEnv, b.kick);
    if ((b.hit ?? 0) >= 0.6) this.afterEnv = Math.max(this.afterEnv, b.hit!);
    if (b.glitch) {
      this.glitchLeft = b.glitch;
      this.glitchDur = b.glitch;
      this.sinks.glitch(b.glitch);
    }
  }
}
