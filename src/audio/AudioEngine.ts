import { Choir, Drone, Granular, NoiseBed, OneShots, Shepard } from './instruments';
import { dbToGain, glide, makeImpulse, makeNoiseBuffer, midiToHz } from './util';
import { clamp, clamp01, lerp, smoothstep } from '../core/math';

export interface AudioFrame {
  chapter: number;
  chapterU: number;
  T: number;
  speed: number;
  dt: number;
  lodMix: number;
  /** per-frame hints from stages (biomass, o2, warmth, …) */
  hints: Record<string, number>;
  /** 0..1 multiplier on everything but the Tone (silence is an instrument) */
  music: number;
  /** Tone level (dB) */
  toneDb: number;
  /** 0..1 Return chord */
  chord: number;
}

const A3 = 220;
const CHORD = [110, 164.81, 220, 277.18, 329.63, 493.88]; // A2 E3 A3 C#4 E4 B4

/**
 * Fully procedural Web Audio score. No samples: every sound is synthesised.
 */
export class AudioEngine {
  readonly ctx: AudioContext;
  private master: GainNode;
  private musicBus: GainNode;
  private silenceGate: GainNode;
  private verbSend: GainNode;
  private toneGain: GainNode;
  private chordGain: GainNode;
  private chordVoices: GainNode[] = [];
  private noiseWhite: AudioBuffer;
  private noisePink: AudioBuffer;
  private noiseBrown: AudioBuffer;
  readonly drone: Drone;
  readonly drone2: Drone;
  readonly choir: Choir;
  readonly rumble: NoiseBed;
  readonly wind: NoiseBed;
  readonly hiss: NoiseBed;
  readonly fizz: Granular;
  readonly bubbles: Granular;
  readonly crackle: Granular;
  readonly shepard: Shepard;
  readonly shots: OneShots;
  private muted = false;
  private lastLogSpeed = 0;
  private paletteClock = 0;
  private eventClock = 0;
  private lastChapter = -1;

  constructor() {
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    this.ctx = new AC({ latencyHint: 'playback' });
    const ctx = this.ctx;
    this.noiseWhite = makeNoiseBuffer(ctx, 3, 'white', 5);
    this.noisePink = makeNoiseBuffer(ctx, 4, 'pink', 9);
    this.noiseBrown = makeNoiseBuffer(ctx, 4, 'brown', 13);

    // master chain: music → silence gate → comp → limiter → master → out
    this.master = ctx.createGain();
    this.master.gain.value = dbToGain(-3);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    comp.attack.value = 0.02;
    comp.release.value = 0.4;
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -2;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    comp.connect(limiter).connect(this.master).connect(ctx.destination);

    this.silenceGate = ctx.createGain();
    this.silenceGate.gain.value = 1;
    this.silenceGate.connect(comp);
    this.musicBus = ctx.createGain();
    this.musicBus.gain.value = 1;
    this.musicBus.connect(this.silenceGate);
    // reverb send (returns into the gate so silence also silences tails)
    this.verbSend = ctx.createGain();
    this.verbSend.gain.value = 0.55;
    const conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 4.8);
    const verbRet = ctx.createGain();
    verbRet.gain.value = 0.9;
    this.musicBus.connect(this.verbSend).connect(conv).connect(verbRet).connect(this.silenceGate);

    // The Tone bypasses the music gate (it outlives everything)
    this.toneGain = ctx.createGain();
    this.toneGain.gain.value = 0;
    const tone = ctx.createOscillator();
    tone.type = 'sine';
    tone.frequency.value = A3;
    tone.connect(this.toneGain).connect(comp);
    tone.start();
    // Return chord (also outside the gate)
    this.chordGain = ctx.createGain();
    this.chordGain.gain.value = 0;
    const chordVerb = ctx.createGain();
    chordVerb.gain.value = 0.5;
    this.chordGain.connect(comp);
    this.chordGain.connect(chordVerb).connect(conv);
    CHORD.forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i < 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i % 2 ? 1 : -1) * 2;
      const g = ctx.createGain();
      g.gain.value = 0;
      o.connect(g).connect(this.chordGain);
      o.start();
      this.chordVoices.push(g);
    });

    const bus = this.musicBus;
    this.drone = new Drone(ctx, 'sawtooth');
    this.drone.out.connect(bus);
    this.drone2 = new Drone(ctx, 'triangle');
    this.drone2.out.connect(bus);
    this.choir = new Choir(ctx, 5, this.noisePink);
    this.choir.out.connect(bus);
    this.rumble = new NoiseBed(ctx, this.noiseBrown, 'lowpass');
    this.rumble.out.connect(bus);
    this.wind = new NoiseBed(ctx, this.noisePink, 'bandpass');
    this.wind.out.connect(bus);
    this.hiss = new NoiseBed(ctx, this.noiseWhite, 'highpass');
    this.hiss.out.connect(bus);
    this.fizz = new Granular(ctx, this.noiseWhite);
    this.fizz.out.connect(bus);
    this.bubbles = new Granular(ctx, makeBubbleBuffer(ctx));
    this.bubbles.out.connect(bus);
    this.crackle = new Granular(ctx, makeCrackleBuffer(ctx));
    this.crackle.out.connect(bus);
    this.shepard = new Shepard(ctx);
    this.shepard.out.connect(bus);
    this.shots = new OneShots(ctx, bus, this.noisePink);
  }

  async resume(): Promise<void> {
    try {
      await this.ctx.resume();
    } catch {
      /* ignore */
    }
  }

  suspend(): void {
    void this.ctx.suspend().catch(() => undefined);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    glide(this.master.gain, this.muted ? 0 : dbToGain(-3), this.ctx.currentTime, 0.1);
    return this.muted;
  }

  /** Discrete events from the Director and stages. */
  cue(id: string, x = 1): void {
    const s = this.shots;
    switch (id) {
      case 'membrane':
        s.breath(0.07, 3.2, 0, 700);
        s.bell(A3 * 2, 0.05, 6, 0.2, 0, [1, 2.01, 3.0]);
        break;
      case 'spark':
        s.sine(A3 * 4, 0.035, 5, 0, 0, 0.6);
        break;
      case 'goe':
        s.bell(midiToHz(66), 0.05, 7, 0, -0.3, [1, 2, 3]);
        s.bell(midiToHz(69), 0.04, 7, 0.6, 0.3, [1, 2, 3]);
        break;
      case 'impact':
        s.boom(0.8 * x, 9, 0, 1400);
        break;
      case 'nuke':
        s.boom(0.45 * x, 5, 0, 2200);
        break;
      case 'mote':
        s.sine(1318.5, 0.05, 4.5, 0, 0.2, 0.05);
        break;
      case 'flame':
        s.breath(0.06, 2.5, 0, 500);
        break;
      case 'hand':
        s.breath(0.05, 1.4, 0, 1100, (Math.random() * 2 - 1) * 0.5);
        break;
      case 'glass':
        s.bell(x, 0.03, 2.8, 0, (Math.random() * 2 - 1) * 0.7, [1, 3.01, 5.2]);
        break;
      case 'pluck':
        s.pluck(x, 0.12, 0, (Math.random() * 2 - 1) * 0.6, 0.55);
        break;
      case 'candle':
        s.breath(0.04, 1.2, 0, 400 + Math.random() * 300, (Math.random() * 2 - 1) * 0.6);
        break;
      case 'chime':
        s.bell(x, 0.04, 6, 0, (Math.random() * 2 - 1) * 0.4, [1, 2.4, 3.9]);
        break;
      case 'ai':
        s.sine(x, 0.035, 1.6, 0, (Math.random() * 2 - 1) * 0.5, 0.004);
        break;
      default:
        break;
    }
  }

  update(a: AudioFrame): void {
    const ctx = this.ctx;
    const now = ctx.currentTime;
    // silence gate and Tone
    glide(this.silenceGate.gain, clamp01(a.music), now, a.music < 0.05 ? 0.05 : 0.6);
    glide(this.toneGain.gain, a.toneDb <= -90 ? 0 : dbToGain(a.toneDb), now, 0.4);
    glide(this.chordGain.gain, 0.32 * a.chord, now, 1.2);
    this.chordVoices.forEach((g, i) => glide(g.gain, a.chord > 0 ? clamp01(a.chord * 2.2 - i * 0.22) * (0.32 / (1 + i * 0.25)) : 0, now, 1.5));

    // Shepard riser from time acceleration (octaves/s proportional to d log speed / dt)
    const ls = Math.log10(Math.max(1e-6, Math.abs(a.speed)));
    const dls = a.dt > 0 ? (ls - this.lastLogSpeed) / a.dt : 0;
    this.lastLogSpeed = ls;
    const rate = clamp(dls * 0.22, -0.6, 0.6);
    const shepLevel = a.chapter === 10 ? 0 : smoothstep(0.05, 0.6, Math.abs(rate)) * 0.32;
    this.shepard.update(a.dt, rate, shepLevel);

    this.fizz.update();
    this.bubbles.update();
    this.crackle.update();

    this.paletteClock += a.dt;
    if (this.paletteClock > 0.1 || a.chapter !== this.lastChapter) {
      this.paletteClock = 0;
      this.palette(a);
      this.lastChapter = a.chapter;
    }
    this.eventClock += a.dt;
    this.ambientEvents(a);
  }

  /** Per-chapter sonic palettes (continuous parameters). */
  private palette(a: AudioFrame): void {
    const h = a.hints;
    const m = midiToHz;
    switch (a.chapter) {
      case 0: {
        this.drone.set([m(33), m(45)], 140, 0.05 * smoothstep(0, 0.6, a.chapterU), 2.5);
        this.drone2.set([], 200, 0);
        this.choir.set([m(57), m(64), m(69)], 'u', 0.05 * smoothstep(0.62, 0.8, a.chapterU), 2.0, 0.02);
        this.rumble.set(70, 0.7, 0.55 * smoothstep(0, 0.35, a.chapterU), 2.5, 0.25);
        this.wind.set(500, 0.6, 0.0, 2);
        this.hiss.set(6000, 0.5, 0.0, 2);
        this.bubbles.density = 3 + 8 * smoothstep(0.2, 0.7, a.chapterU);
        this.bubbles.level = 0.10;
        this.bubbles.pitch = 0.9;
        this.fizz.density = 0;
        this.crackle.density = 0;
        break;
      }
      case 1: {
        const o2 = h.o2 ?? 0;
        const ice = h.ice ?? 0;
        const bio = h.biomass ?? 0.3;
        const third = smoothstep(0.02, 0.1, o2);
        this.drone.set([m(38), m(45), m(50), third > 0.5 ? m(54) : 0], lerp(260, 620, smoothstep(0, 0.1, o2)) * (1 - ice * 0.5), 0.07 * (1 - ice * 0.6), 2.5);
        this.drone2.set([m(62) * (1 + ice * 0.002), third > 0.5 ? m(66) : 0], 900, 0.025 * (1 - ice), 3);
        this.choir.set([], 'u', 0, 2);
        this.rumble.set(55, 0.7, 0.18 * (1 - ice), 2);
        this.wind.set(lerp(700, 2400, ice), lerp(0.7, 9, ice), 0.05 + ice * 0.12, 2, 0.3);
        this.hiss.set(7000, 0.5, 0, 2);
        this.fizz.density = (8 + bio * 60) * (0.3 + a.lodMix * 0.7) * (1 - ice);
        this.fizz.level = 0.05;
        this.fizz.pitch = 2.2;
        this.fizz.grainDur = 0.025;
        this.bubbles.density = 2 + a.lodMix * 10 * (h.photo ?? 0.3);
        this.bubbles.level = 0.06;
        this.bubbles.pitch = 1.6;
        this.crackle.density = 0;
        break;
      }
      case 2: {
        const ice = h.ice ?? 0;
        const bright = h.biolum ?? 0;
        this.drone.set([m(41), m(48), m(53)], lerp(300, 700, bright) * (1 - ice * 0.5), 0.065, 2.5);
        this.drone2.set([m(65), m(72)], 1100, 0.02 * (1 - ice), 3);
        this.choir.set([m(65), m(69), m(72), m(77)], 'u', 0.045 * (0.3 + bright * 0.7) * (1 - ice * 0.7), 2, 0.02);
        this.rumble.set(60, 0.7, 0.12, 2);
        this.wind.set(lerp(600, 2600, ice), lerp(0.8, 8, ice), 0.04 + ice * 0.1, 2, 0.3);
        this.hiss.set(7000, 0.5, 0, 2);
        this.fizz.density = 6 * (1 - ice);
        this.fizz.level = 0.035;
        this.bubbles.density = 4 * (1 - ice);
        this.bubbles.level = 0.05;
        this.crackle.density = 0;
        break;
      }
      case 3: {
        const dread = h.dread ?? 0;
        const winter = h.winter ?? 0;
        this.drone.set([m(33), m(40), m(45), m(48)], lerp(420, 180, winter) * (1 - dread * 0.3), 0.08 * (1 - winter * 0.5), 2.5);
        this.drone2.set(dread > 0.3 ? [m(57), m(58)] : [m(64), m(69)], 800, 0.02 + dread * 0.02, 3);
        this.choir.set(dread > 0.3 ? [m(57), m(58), m(64)] : [m(57), m(60), m(64)], dread > 0.3 ? 'o' : 'a', 0.03 + dread * 0.04, 2.5, 0.01);
        this.rumble.set(45, 0.8, 0.12 + winter * 0.25 + dread * 0.1, 2);
        this.wind.set(lerp(500, 300, winter), 0.8, 0.06 + winter * 0.12, 2, 0.4);
        this.hiss.set(6000, 0.5, 0, 2);
        this.fizz.density = 0;
        this.bubbles.density = 0;
        this.crackle.density = (h.fire ?? 0) * 40;
        this.crackle.level = 0.12;
        break;
      }
      case 4: {
        const fire = h.fire ?? 0;
        this.drone.set([m(28), m(35), m(40)], 260, 0.06, 2.5);
        this.drone2.set([], 500, 0);
        this.choir.set(fire > 0.3 ? [m(57), m(64)] : [], 'a', 0.06 * fire, 2.5, 0.03);
        this.rumble.set(40, 0.7, 0.05, 2);
        this.wind.set(420, 0.9, 0.1, 2, 0.5);
        this.hiss.set(6000, 0.5, 0, 2);
        this.fizz.density = 0;
        this.bubbles.density = 0;
        this.crackle.density = fire * 22;
        this.crackle.level = 0.16;
        break;
      }
      case 5: {
        const plague = h.plague ?? 0;
        this.drone.set([m(38), m(45), m(50), m(53)], lerp(520, 260, plague), 0.06, 2.5);
        this.drone2.set([m(57), m(62)], 900, 0.018, 3);
        this.choir.set([m(50), m(57), m(62)], 'o', 0.025 + plague * 0.03, 2, 0.01);
        this.rumble.set(50, 0.7, 0.04, 2);
        this.wind.set(500, 0.7, 0.03, 2, 0.4);
        this.hiss.set(6000, 0.5, 0, 2);
        this.fizz.density = 0;
        this.bubbles.density = 0;
        this.crackle.density = 0;
        break;
      }
      case 6: {
        const ind = h.industry ?? 0;
        this.drone.set([m(40), m(47), m(52), m(56)], lerp(380, 900, ind), 0.06, 2.5);
        this.drone2.set([m(64), m(71)], 1400, 0.015 + ind * 0.02, 3);
        this.choir.set([m(52), m(56), m(59), m(64), m(68)], 'a', 0.02 + ind * 0.035, 2, 0.04);
        this.rumble.set(60 + ind * 40, 0.7, 0.06 + ind * 0.1, 2);
        this.wind.set(600, 0.6, 0.02, 2);
        this.hiss.set(5000, 0.5, ind * 0.012, 2);
        this.fizz.density = ind * 30;
        this.fizz.level = 0.025;
        this.bubbles.density = 0;
        this.crackle.density = 0;
        break;
      }
      case 7: {
        const human = h.human ?? 1;
        const ai = h.ai ?? 0;
        const voices = [m(52), m(56), m(59), m(64), m(68)].slice(0, Math.max(0, Math.ceil(human * 5)));
        this.drone.set([m(45), m(52)], lerp(500, 1800, ai), 0.05 * (0.4 + human * 0.6), 2.5);
        this.drone2.set([m(69), m(76), m(83)], 2400, 0.012 + ai * 0.02, 3);
        this.choir.set(voices, 'a', 0.045 * human, 2, 0.03 * human);
        this.rumble.set(50, 0.7, 0.04 * human, 2);
        this.wind.set(800, 0.5, 0.0, 2);
        this.hiss.set(8000, 0.5, 0.0, 2);
        this.fizz.density = ai * 18;
        this.fizz.level = 0.02;
        this.fizz.pitch = 3;
        this.bubbles.density = 0;
        this.crackle.density = 0;
        break;
      }
      case 8:
      case 9: {
        const tension = h.tension ?? 0.3;
        this.drone.set([m(33), m(40), m(45), m(52)], lerp(240, 600, tension), 0.06, 3);
        this.drone2.set([m(69), m(76)], 2200, 0.012, 3);
        this.choir.set(tension > 0.6 ? [m(57), m(58), m(64)] : [m(57), m(64)], 'o', 0.02 + tension * 0.025, 3, 0.01);
        this.rumble.set(40, 0.7, 0.08 + tension * 0.08, 2);
        this.wind.set(300, 0.6, 0.0, 2);
        this.hiss.set(9000, 0.5, 0.004, 2);
        this.fizz.density = 0;
        this.bubbles.density = 0;
        this.crackle.density = 0;
        break;
      }
      default: {
        // Coda: everything falls away
        this.drone.set([m(33)], 120, 0.02 * (h.drone ?? 0), 3);
        this.drone2.set([], 200, 0, 3);
        this.choir.set([], 'u', 0, 3);
        this.rumble.set(40, 0.7, 0.04 * (h.drone ?? 0), 3);
        this.wind.set(300, 0.6, 0, 3);
        this.hiss.set(9000, 0.5, 0, 3);
        this.fizz.density = 0;
        this.bubbles.density = 0;
        this.crackle.density = 0;
        break;
      }
    }
  }

  /** Sparse procedural events (glass tones, plucks, AI arpeggios). */
  private ambientEvents(a: AudioFrame): void {
    if (a.music < 0.2) return;
    const r = Math.random;
    const dt = a.dt;
    const h = a.hints;
    const pent = (root: number, deg: number): number => midiToHz(root + [0, 2, 4, 7, 9][deg % 5]! + 12 * Math.floor(deg / 5));
    if (a.chapter === 1 && r() < dt * (0.25 + (h.photo ?? 0) * 0.6) * a.lodMix) this.cue('glass', pent(74, Math.floor(r() * 8)));
    if (a.chapter === 2 && r() < dt * 0.7 * (h.biolum ?? 0)) this.cue('glass', pent(77, Math.floor(r() * 9)));
    if (a.chapter === 5 && r() < dt * (0.8 + a.lodMix)) {
      const dorian = [0, 2, 3, 5, 7, 9, 10];
      this.cue('pluck', midiToHz(50 + dorian[Math.floor(r() * 7)]! + (r() < 0.3 ? 12 : 0)));
    }
    if (a.chapter === 7 && r() < dt * 1.6 * (h.ai ?? 0)) {
      const fifths = [69, 76, 83, 90, 81, 88];
      this.cue('ai', midiToHz(fifths[Math.floor(r() * fifths.length)]!));
    }
    if ((a.chapter === 8 || a.chapter === 9) && r() < dt * 0.5) {
      const fifths = [57, 64, 71, 78];
      this.cue('ai', midiToHz(fifths[Math.floor(r() * fifths.length)]!) * (r() < 0.5 ? 2 : 1));
    }
  }
}

function makeBubbleBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * 2.0);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  // a train of damped rising sine "bubbles"
  let t0 = 0;
  let k = 1;
  while (t0 < n - sr * 0.08) {
    const f0 = 300 + ((k * 7919) % 900);
    const len = Math.floor(sr * (0.03 + ((k * 104729) % 40) / 1000));
    let ph = 0;
    for (let i = 0; i < len; i++) {
      const t = i / sr;
      const f = f0 * (1 + t * 14);
      ph += (2 * Math.PI * f) / sr;
      d[t0 + i] = (d[t0 + i] ?? 0) + Math.sin(ph) * Math.exp(-t * 60) * 0.5;
    }
    t0 += Math.floor(sr * (0.05 + ((k * 31) % 70) / 1000));
    k++;
  }
  return buf;
}

function makeCrackleBuffer(ctx: BaseAudioContext): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * 1.5);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  let s = 77;
  const rnd = (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
  for (let c = 0; c < 140; c++) {
    const at = Math.floor(rnd() * (n - 400));
    const len = 20 + Math.floor(rnd() * 300);
    const amp = 0.2 + rnd() * 0.8;
    for (let i = 0; i < len; i++) d[at + i] = (d[at + i] ?? 0) + (rnd() * 2 - 1) * amp * Math.exp(-i / (len * 0.25));
  }
  return buf;
}
