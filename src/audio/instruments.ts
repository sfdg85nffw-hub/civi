import { glide, makeNoiseBuffer, makePluck } from './util';

/** Sustained detuned oscillator stack through a breathing low-pass filter. */
export class Drone {
  readonly out: GainNode;
  private filter: BiquadFilterNode;
  private oscs: OscillatorNode[] = [];
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private voices: GainNode[] = [];
  readonly maxNotes = 5;

  constructor(private ctx: AudioContext, type: OscillatorType = 'sawtooth') {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.value = 400;
    this.filter.Q.value = 0.7;
    this.filter.connect(this.out);
    for (let i = 0; i < this.maxNotes; i++) {
      const vg = ctx.createGain();
      vg.gain.value = 0;
      vg.connect(this.filter);
      this.voices.push(vg);
      for (let k = 0; k < 2; k++) {
        const o = ctx.createOscillator();
        o.type = k === 0 ? type : 'triangle';
        o.frequency.value = 110;
        o.detune.value = (k === 0 ? -1 : 1) * (4 + i * 1.5);
        o.connect(vg);
        o.start();
        this.oscs.push(o);
      }
    }
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.045;
    this.lfoGain = ctx.createGain();
    this.lfoGain.gain.value = 120;
    this.lfo.connect(this.lfoGain).connect(this.filter.frequency);
    this.lfo.start();
  }

  set(notesHz: number[], cutoff: number, gain: number, tau = 2.0): void {
    const now = this.ctx.currentTime;
    for (let i = 0; i < this.maxNotes; i++) {
      const f = notesHz[i];
      if (f) {
        glide(this.oscs[i * 2]!.frequency, f, now, tau);
        glide(this.oscs[i * 2 + 1]!.frequency, f * 1.0015, now, tau);
        glide(this.voices[i]!.gain, 0.22 / Math.sqrt(1 + i * 0.6), now, tau);
      } else glide(this.voices[i]!.gain, 0, now, tau);
    }
    glide(this.filter.frequency, cutoff, now, tau);
    glide(this.lfoGain.gain, cutoff * 0.35, now, tau);
    glide(this.out.gain, gain, now, tau);
  }
}

const VOWELS: Record<string, [number, number, number]> = {
  a: [800, 1150, 2900],
  e: [450, 1700, 2600],
  i: [330, 2000, 2800],
  o: [500, 850, 2800],
  u: [350, 650, 2700],
  m: [280, 900, 2200],
};

/** Formant-synthesised choir: pulse/saw sources through parallel vowel formant banks. */
export class Choir {
  readonly out: GainNode;
  private voices: { osc: OscillatorNode; vib: OscillatorNode; vg: GainNode; f: BiquadFilterNode[]; amp: GainNode }[] = [];
  private breath: AudioBufferSourceNode;
  private breathGain: GainNode;

  constructor(private ctx: AudioContext, n = 4, noise?: AudioBuffer) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    const formantGains = [1, 0.5, 0.18];
    for (let i = 0; i < n; i++) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 220;
      const vib = ctx.createOscillator();
      vib.frequency.value = 4.6 + i * 0.37;
      const vg = ctx.createGain();
      vg.gain.value = 9;
      vib.connect(vg).connect(osc.detune);
      const amp = ctx.createGain();
      amp.gain.value = 0;
      const f: BiquadFilterNode[] = [];
      for (let k = 0; k < 3; k++) {
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = VOWELS.a![k]!;
        bp.Q.value = k === 0 ? 7 : 11;
        const g = ctx.createGain();
        g.gain.value = formantGains[k]!;
        osc.connect(bp).connect(g).connect(amp);
        f.push(bp);
      }
      amp.connect(this.out);
      osc.start();
      vib.start();
      this.voices.push({ osc, vib, vg, f, amp });
    }
    this.breath = ctx.createBufferSource();
    this.breath.buffer = noise ?? makeNoiseBuffer(ctx, 2, 'pink', 11);
    this.breath.loop = true;
    const bf = ctx.createBiquadFilter();
    bf.type = 'bandpass';
    bf.frequency.value = 1400;
    bf.Q.value = 0.8;
    this.breathGain = ctx.createGain();
    this.breathGain.gain.value = 0;
    this.breath.connect(bf).connect(this.breathGain).connect(this.out);
    this.breath.start();
  }

  set(notesHz: number[], vowel: string, gain: number, tau = 1.5, breath = 0.05): void {
    const now = this.ctx.currentTime;
    const fm = VOWELS[vowel] ?? VOWELS.a!;
    this.voices.forEach((v, i) => {
      const f = notesHz[i];
      if (f) {
        glide(v.osc.frequency, f, now, tau * 0.6);
        glide(v.amp.gain, 0.16, now, tau);
      } else glide(v.amp.gain, 0, now, tau);
      v.f.forEach((bp, k) => glide(bp.frequency, fm[k]! * (1 + (i % 2) * 0.03), now, tau));
    });
    glide(this.breathGain.gain, breath, now, tau);
    glide(this.out.gain, gain, now, tau);
  }
}

/** Filtered looping noise (rumble, wind, surf, fire bed). */
export class NoiseBed {
  readonly out: GainNode;
  readonly filter: BiquadFilterNode;
  private src: AudioBufferSourceNode;
  private lfo: OscillatorNode;
  private lfoG: GainNode;

  constructor(private ctx: AudioContext, buf: AudioBuffer, type: BiquadFilterType = 'lowpass') {
    this.src = ctx.createBufferSource();
    this.src.buffer = buf;
    this.src.loop = true;
    this.filter = ctx.createBiquadFilter();
    this.filter.type = type;
    this.filter.frequency.value = 200;
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    this.src.connect(this.filter).connect(this.out);
    this.lfo = ctx.createOscillator();
    this.lfo.frequency.value = 0.07;
    this.lfoG = ctx.createGain();
    this.lfoG.gain.value = 0;
    this.lfo.connect(this.lfoG).connect(this.filter.frequency);
    this.lfo.start();
    this.src.start();
  }

  set(freq: number, q: number, gain: number, tau = 1.5, gust = 0): void {
    const now = this.ctx.currentTime;
    glide(this.filter.frequency, freq, now, tau);
    glide(this.filter.Q, q, now, tau);
    glide(this.out.gain, gain, now, tau);
    glide(this.lfoG.gain, freq * gust, now, tau);
  }
}

/** Shepard–Risset riser: endless glissando tied to time acceleration. */
export class Shepard {
  readonly out: GainNode;
  private oscs: OscillatorNode[] = [];
  private gains: GainNode[] = [];
  private phase = 0;
  private readonly N = 7;
  private readonly fmin = 55;

  constructor(private ctx: AudioContext) {
    this.out = ctx.createGain();
    this.out.gain.value = 0;
    for (let i = 0; i < this.N; i++) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(this.out);
      o.start();
      this.oscs.push(o);
      this.gains.push(g);
    }
  }

  /** rate in octaves per second (signed); level 0..1 */
  update(dt: number, rate: number, level: number): void {
    const now = this.ctx.currentTime;
    this.phase = (((this.phase + rate * dt) % 1) + 1) % 1;
    for (let i = 0; i < this.N; i++) {
      const pos = (i + this.phase) % this.N;
      const f = this.fmin * Math.pow(2, pos);
      const x = (pos - this.N / 2) / (this.N / 4.2);
      const a = Math.exp(-x * x) * 0.12;
      this.oscs[i]!.frequency.setTargetAtTime(f, now, 0.02);
      this.gains[i]!.gain.setTargetAtTime(a, now, 0.03);
    }
    glide(this.out.gain, level, now, 0.4);
  }
}

/** Granular cloud: short enveloped grains scheduled with jitter. */
export class Granular {
  readonly out: GainNode;
  private nextAt = 0;
  density = 0; // grains per second
  pitch = 1;
  pitchJitter = 0.3;
  grainDur = 0.06;
  level = 0.3;
  pan = 0.8;

  constructor(private ctx: AudioContext, private buf: AudioBuffer) {
    this.out = ctx.createGain();
    this.out.gain.value = 1;
  }

  setBuffer(b: AudioBuffer): void {
    this.buf = b;
  }

  update(): void {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    if (this.density <= 0.01) {
      this.nextAt = now;
      return;
    }
    if (this.nextAt < now) this.nextAt = now;
    let guard = 0;
    while (this.nextAt < now + 0.15 && guard++ < 64) {
      const t = this.nextAt;
      const src = ctx.createBufferSource();
      src.buffer = this.buf;
      src.playbackRate.value = this.pitch * Math.pow(2, (Math.random() * 2 - 1) * this.pitchJitter);
      const g = ctx.createGain();
      const d = this.grainDur * (0.6 + Math.random() * 0.8);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(this.level * (0.4 + Math.random() * 0.6), t + d * 0.25);
      g.gain.linearRampToValueAtTime(0, t + d);
      const p = ctx.createStereoPanner();
      p.pan.value = (Math.random() * 2 - 1) * this.pan;
      src.connect(g).connect(p).connect(this.out);
      const off = Math.random() * Math.max(0, this.buf.duration - d);
      src.start(t, off, d + 0.01);
      src.onended = () => {
        src.disconnect();
        g.disconnect();
        p.disconnect();
      };
      this.nextAt += (1 / this.density) * (0.3 + Math.random() * 1.4);
    }
  }
}

/** One-shot voices (bells, plucks, booms, breaths). */
export class OneShots {
  private pluckCache = new Map<string, AudioBuffer>();
  constructor(private ctx: AudioContext, private dest: AudioNode, private noise: AudioBuffer) {}

  bell(freq: number, gain = 0.15, decay = 3, when = 0, pan = 0, partials: number[] = [1, 2.76, 5.4, 8.93]): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    p.connect(this.dest);
    partials.forEach((m, i) => {
      const o = ctx.createOscillator();
      o.frequency.value = freq * m;
      const g = ctx.createGain();
      const a = gain / (1 + i * 1.6);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(a, t + 0.004 + i * 0.002);
      g.gain.exponentialRampToValueAtTime(0.0001, t + decay / (1 + i * 0.7));
      o.connect(g).connect(p);
      o.start(t);
      o.stop(t + decay + 0.1);
      o.onended = () => {
        o.disconnect();
        g.disconnect();
      };
    });
  }

  pluck(freq: number, gain = 0.2, when = 0, pan = 0, brightness = 0.5): void {
    const key = `${Math.round(freq * 10)}:${brightness}`;
    let buf = this.pluckCache.get(key);
    if (!buf) {
      buf = makePluck(this.ctx, freq, 2.4, brightness, Math.round(freq));
      this.pluckCache.set(key, buf);
    }
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = gain;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    src.connect(g).connect(p).connect(this.dest);
    src.start(t);
    src.onended = () => {
      src.disconnect();
      g.disconnect();
      p.disconnect();
    };
  }

  /** Sub-bass bloom + noise roar (impacts, detonations). */
  boom(gain = 0.6, dur = 6, when = 0, roarFreq = 900): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(28, t + dur * 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.dest);
    o.start(t);
    o.stop(t + dur + 0.1);
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(roarFreq, t);
    f.frequency.exponentialRampToValueAtTime(120, t + dur);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0, t);
    ng.gain.linearRampToValueAtTime(gain * 0.8, t + 0.08);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.2);
    n.connect(f).connect(ng).connect(this.dest);
    n.start(t);
    n.stop(t + dur * 1.2 + 0.1);
  }

  /** Soft breath (filtered noise swell). */
  breath(gain = 0.08, dur = 1.6, when = 0, freq = 900, pan = 0): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = freq;
    f.Q.value = 1.2;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + dur * 0.35);
    g.gain.linearRampToValueAtTime(0, t + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    n.connect(f).connect(g).connect(p).connect(this.dest);
    n.start(t, Math.random() * 1.0);
    n.stop(t + dur + 0.05);
  }

  /**
   * A riser: noise opening upward through a resonant band and a cluster of saws gliding up an
   * octave, swelling to its peak exactly `dur` seconds from now and stopping dead there.
   */
  riser(dur = 3.5, gain = 0.12, when = 0, root = 55): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const end = t + dur;
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    n.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.4;
    f.frequency.setValueAtTime(220, t);
    f.frequency.exponentialRampToValueAtTime(6000, end);
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(gain * 0.12, t);
    ng.gain.exponentialRampToValueAtTime(gain * 5.0, end - 0.02);
    ng.gain.linearRampToValueAtTime(0, end + 0.03);
    n.connect(f).connect(ng).connect(this.dest);
    n.start(t);
    n.stop(end + 0.1);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 2;
    lp.frequency.setValueAtTime(200, t);
    lp.frequency.exponentialRampToValueAtTime(3200, end);
    const og = ctx.createGain();
    og.gain.setValueAtTime(gain * 0.08, t);
    og.gain.exponentialRampToValueAtTime(gain * 1.8, end - 0.02);
    og.gain.linearRampToValueAtTime(0, end + 0.03);
    lp.connect(og).connect(this.dest);
    [1, 1.5, 2, 2.997].forEach((m, i) => {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.detune.value = (i - 1.5) * 7;
      o.frequency.setValueAtTime(root * m, t);
      o.frequency.exponentialRampToValueAtTime(root * m * 2, end);
      o.connect(lp);
      o.start(t);
      o.stop(end + 0.1);
    });
  }

  /** The hit: a sub drop under a boom and a short crack. `size` 0..1. */
  hit(size = 1, when = 0): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    this.boom(0.35 + 0.55 * size, 3 + 6 * size, when, 500 + 1500 * size);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(62, t);
    o.frequency.exponentialRampToValueAtTime(24, t + 2.5 + 2 * size);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5 * size + 0.15, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 3 + 3 * size);
    o.connect(g).connect(this.dest);
    o.start(t);
    o.stop(t + 6.5);
    const n = ctx.createBufferSource();
    n.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const ng = ctx.createGain();
    ng.gain.setValueAtTime(0.25 * size, t);
    ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12 + 0.2 * size);
    n.connect(hp).connect(ng).connect(this.dest);
    n.start(t, Math.random());
    n.stop(t + 0.5);
  }

  /** One heartbeat (lub–dub): two low, damped thumps. */
  heartbeat(gain = 0.3, when = 0): void {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + when;
    [[0, 1], [0.27, 0.62]].forEach(([dt, k]) => {
      const t = t0 + dt!;
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(64, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * k!, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
      o.connect(g).connect(this.dest);
      o.start(t);
      o.stop(t + 0.4);
      const b = ctx.createOscillator();
      b.type = 'triangle';
      b.frequency.setValueAtTime(150, t);
      b.frequency.exponentialRampToValueAtTime(95, t + 0.1);
      const bg = ctx.createGain();
      bg.gain.setValueAtTime(0, t);
      bg.gain.linearRampToValueAtTime(gain * k! * 0.45, t + 0.008);
      bg.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
      b.connect(bg).connect(this.dest);
      b.start(t);
      b.stop(t + 0.2);
    });
  }

  /** A digital rupture: gated square blips at random pitches over crushed noise. */
  glitch(dur = 1.0, gain = 0.1, when = 0): void {
    const ctx = this.ctx;
    const t0 = ctx.currentTime + when;
    let t = t0;
    let k = 0;
    while (t < t0 + dur && k++ < 40) {
      const len = 0.02 + Math.random() * 0.07;
      const o = ctx.createOscillator();
      o.type = 'square';
      o.frequency.value = [110, 220, 440, 880, 1760, 3520][Math.floor(Math.random() * 6)]! * (Math.random() < 0.3 ? 1.5 : 1);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain * (0.4 + Math.random() * 0.6), t + 0.003);
      g.gain.setValueAtTime(0, t + len);
      o.connect(g).connect(this.dest);
      o.start(t);
      o.stop(t + len + 0.01);
      if (Math.random() < 0.5) {
        const n = ctx.createBufferSource();
        n.buffer = this.noise;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(gain * 0.8, t);
        ng.gain.setValueAtTime(0, t + len * 0.7);
        n.connect(ng).connect(this.dest);
        n.start(t, Math.random());
        n.stop(t + len);
      }
      t += len + Math.random() * 0.05;
    }
  }

  /** Pure sine ping (the mote, AI motifs). */
  sine(freq: number, gain = 0.08, dur = 2, when = 0, pan = 0, attack = 0.01): void {
    const ctx = this.ctx;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    o.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p).connect(this.dest);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}
