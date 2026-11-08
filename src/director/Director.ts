import type { FrameContext } from '../app/frame';
import type { ChapterDef } from '../chapters/types';
import type { Odyssey } from '../time/odyssey';
import { blendPose, handheld } from './rigs';
import type { CamPose, ShotDef, ShotRuntime, Transition } from './types';
import { easeInOutSine, smoothstep } from '../core/math';

export interface LayerOut {
  stage: string;
  shot: ShotRuntime;
  pose: CamPose;
}

export interface DirectorOut {
  a: LayerOut | null;
  b: LayerOut | null;
  mix: number;
  mixMode: number;
  fade: number;
  /** camera angular velocity proxy for motion blur (screen units) */
  blur: [number, number];
}

interface Picked {
  def: ShotDef;
  t: number;
  dur: number;
}

/**
 * The Director: picks the shot for the current moment (Odyssey schedule or
 * manual-mode mapping), evaluates camera rigs and manages transitions.
 */
export class Director {
  private cur: ShotRuntime | null = null;
  private prev: ShotRuntime | null = null;
  private trans: Transition = { type: 'cut', dur: 0 };
  private transT = 0;
  private lastStory = -1;
  private lastPose: CamPose | null = null;
  private agentT = 0;
  /** a forced shot (deep link ?shot=) */
  override: ShotDef | null = null;
  /** free camera hook: when set, replaces the pose for layer A */
  freePose: ((base: CamPose) => CamPose) | null = null;

  constructor(
    private chapters: ChapterDef[],
    private odyssey: Odyssey,
  ) {}

  /** Shot list of a chapter, with durations scaled to its Odyssey span. */
  shotsFor(chapter: number): { def: ShotDef; s0: number; dur: number }[] {
    const ch = this.chapters[chapter];
    const sp = this.odyssey.span(chapter);
    if (!ch || !ch.shots.length) return [];
    const total = ch.shots.reduce((a, s) => a + s.dur, 0);
    const k = (sp.s1 - sp.s0) / total;
    let s0 = sp.s0;
    return ch.shots.map((def) => {
      const dur = def.dur * k;
      const r = { def, s0, dur };
      s0 += dur;
      return r;
    });
  }

  private pickByStory(s: number): Picked | null {
    const c = this.odyssey.chapterAtStory(s);
    const list = this.shotsFor(c);
    if (!list.length) return null;
    for (const it of list) if (s < it.s0 + it.dur) return { def: it.def, t: s - it.s0, dur: it.dur };
    const last = list[list.length - 1]!;
    return { def: last.def, t: s - last.s0, dur: last.dur };
  }

  private pick(f: FrameContext): Picked | null {
    if (this.override) return { def: this.override, t: f.time % this.override.dur, dur: this.override.dur };
    if (f.mode === 'odyssey') return this.pickByStory(f.storyTime);
    // manual: map sim time to the film's shot for that moment
    const s = this.odyssey.s(f.T);
    const ch = this.chapters[f.chapter];
    const as = typeof ch?.agentShot === 'function' ? ch.agentShot(f.T) : ch?.agentShot;
    if (as && f.lodMix > 0.5) {
      this.agentT += f.dt;
      const d = as.dur;
      const ph = (this.agentT / d) % 2;
      return { def: as, t: (ph < 1 ? ph : 2 - ph) * d, dur: d };
    }
    this.agentT = 0;
    return this.pickByStory(s);
  }

  update(f: FrameContext): DirectorOut {
    const p = this.pick(f);
    if (!p) return { a: null, b: null, mix: 0, mixMode: 0, fade: 1, blur: [0, 0] };
    const jumped = f.mode === 'odyssey' && Math.abs(f.storyTime - this.lastStory) > 0.75;
    this.lastStory = f.storyTime;
    if (!this.cur || this.cur.def.id !== p.def.id) {
      if (this.cur && !jumped) {
        this.prev = this.cur;
        this.trans = p.def.transition ?? { type: 'cut', dur: 0 };
        if (f.mode === 'manual' && this.trans.type === 'cut') this.trans = { type: 'dissolve', dur: 1.2 };
        this.transT = 0;
      } else {
        this.prev = null;
      }
    }
    this.cur = { def: p.def, t: p.t, dur: p.dur, u: p.t / p.dur };
    if (this.prev) {
      this.prev.t += f.dt;
      this.prev.u = this.prev.t / this.prev.dur;
      this.transT += f.dt;
      if (this.trans.type === 'cut' || this.transT >= this.trans.dur) this.prev = null;
    }

    let poseA = this.cur.def.rig(this.cur.u, f, this.cur);
    if (f.mode === 'manual') poseA = { ...poseA, pos: poseA.pos.clone().add(handheld(f.time, 0.0)) };
    let out: DirectorOut;
    if (!this.prev) {
      out = { a: { stage: this.cur.def.stage, shot: this.cur, pose: poseA }, b: null, mix: 0, mixMode: 0, fade: 1, blur: [0, 0] };
    } else {
      const x = Math.min(1, this.transT / Math.max(1e-3, this.trans.dur));
      const prevPose = this.prev.def.rig(this.prev.u, f, this.prev);
      const sameStage = this.prev.def.stage === this.cur.def.stage;
      if ((sameStage && this.trans.type !== 'fade') || this.trans.type === 'blend') {
        if (sameStage) {
          out = { a: { stage: this.cur.def.stage, shot: this.cur, pose: blendPose(prevPose, poseA, x) }, b: null, mix: 0, mixMode: 0, fade: 1, blur: [0, 0] };
        } else {
          out = this.twoLayer(prevPose, poseA, x, 0);
        }
      } else if (this.trans.type === 'fade') {
        // through black: out, (held), then in
        const h = Math.min(0.8, (this.trans.hold ?? 0) / Math.max(1e-3, this.trans.dur));
        const a0 = (1 - h) / 2, a1 = (1 + h) / 2;
        const half = x < 0.5;
        const k = x < a0 ? 1 - smoothstep(0, a0, x) : x < a1 ? 0 : smoothstep(a1, 1, x);
        out = half
          ? { a: { stage: this.prev.def.stage, shot: this.prev, pose: prevPose }, b: null, mix: 0, mixMode: 0, fade: k, blur: [0, 0] }
          : { a: { stage: this.cur.def.stage, shot: this.cur, pose: poseA }, b: null, mix: 0, mixMode: 0, fade: k, blur: [0, 0] };
      } else {
        out = this.twoLayer(prevPose, poseA, easeInOutSine(x), this.trans.type === 'match' ? 1 : this.trans.type === 'dive' ? 2 : 0);
      }
    }
    if (this.freePose && out.a) out.a.pose = this.freePose(out.a.pose);
    // motion blur proxy from target-direction change
    if (out.a && this.lastPose) {
      const d0 = this.lastPose.target.clone().sub(this.lastPose.pos).normalize();
      const d1 = out.a.pose.target.clone().sub(out.a.pose.pos).normalize();
      const dt = Math.max(1e-3, f.dt);
      const k = 0.02 / dt;
      out.blur = [(d1.x - d0.x) * k, (d1.y - d0.y) * k];
      if (Math.hypot(out.blur[0], out.blur[1]) > 0.06 || jumped) out.blur = [0, 0];
    }
    this.lastPose = out.a ? out.a.pose : null;
    return out;
  }

  private twoLayer(prevPose: CamPose, curPose: CamPose, mix: number, mode: number): DirectorOut {
    return {
      a: { stage: this.prev!.def.stage, shot: this.prev!, pose: prevPose },
      b: { stage: this.cur!.def.stage, shot: this.cur!, pose: curPose },
      mix,
      mixMode: mode,
      fade: 1,
      blur: [0, 0],
    };
  }

  /** All shots across chapters (for deep links and screenshot tooling). */
  allShots(): { chapter: number; index: number; def: ShotDef; s0: number; dur: number }[] {
    const out: { chapter: number; index: number; def: ShotDef; s0: number; dur: number }[] = [];
    for (let c = 0; c < this.chapters.length; c++) {
      this.shotsFor(c).forEach((it, i) => out.push({ chapter: c, index: i, ...it }));
    }
    return out;
  }

  reset(): void {
    this.cur = null;
    this.prev = null;
    this.lastPose = null;
  }
}
