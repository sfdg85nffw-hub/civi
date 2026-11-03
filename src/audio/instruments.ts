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
