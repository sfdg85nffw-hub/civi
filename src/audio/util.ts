export const dbToGain = (db: number): number => Math.pow(10, db / 20);
export const midiToHz = (m: number): number => 440 * Math.pow(2, (m - 69) / 12);
export const semis = (hz: number, st: number): number => hz * Math.pow(2, st / 12);

/** Smoothly move an AudioParam toward a value. */
export function glide(p: AudioParam, v: number, now: number, tau = 0.25): void {
  if (!Number.isFinite(v)) return;
  p.cancelScheduledValues(now);
  p.setTargetAtTime(v, now, Math.max(0.005, tau));
}

export function makeNoiseBuffer(ctx: BaseAudioContext, seconds: number, color: 'white' | 'pink' | 'brown', seed = 1): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  let s = seed >>> 0 || 1;
  const rnd = (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = rnd();
      if (color === 'white') d[i] = w * 0.5;
      else if (color === 'pink') {
        b0 = 0.99886 * b0 + w * 0.0555179;
        b1 = 0.99332 * b1 + w * 0.0750759;
        b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856;
        b4 = 0.55 * b4 + w * 0.5329522;
        b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
        b6 = w * 0.115926;
      } else {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      }
    }
    // crossfade loop seam
    const xf = Math.min(2048, n >> 3);
    for (let i = 0; i < xf; i++) {
      const t = i / xf;
      d[i] = d[i]! * t + d[n - xf + i]! * (1 - t);
    }
  }
  return buf;
}

/** Procedural stereo reverb impulse response: diffuse exponential tail that darkens over time. */
export function makeImpulse(ctx: BaseAudioContext, seconds = 4.5, seed = 7): AudioBuffer {
  const n = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  let s = seed;
  const rnd = (): number => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) / 4294967296) * 2 - 1;
  };
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.exp((-6.9 * t) / seconds) * (t < 0.012 ? t / 0.012 : 1);
      const a = Math.min(0.97, 0.15 + t * 0.32); // darker as it decays
      lp = lp * a + rnd() * (1 - a);
      d[i] = lp * env * 1.6;
    }
  }
  return buf;
}

/** Karplus–Strong pluck rendered offline into a buffer. */
export function makePluck(ctx: BaseAudioContext, freq: number, seconds = 2.5, brightness = 0.5, seed = 3): AudioBuffer {
  const sr = ctx.sampleRate;
  const n = Math.floor(sr * seconds);
  const buf = ctx.createBuffer(1, n, sr);
  const d = buf.getChannelData(0);
  const period = Math.max(2, Math.round(sr / freq));
  const line = new Float32Array(period);
  let s = seed;
  for (let i = 0; i < period; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    line[i] = (((s >>> 0) / 4294967296) * 2 - 1) * 0.6;
  }
  let idx = 0;
  let prev = 0;
  const damp = 0.4975 + brightness * 0.0024;
  for (let i = 0; i < n; i++) {
    const cur = line[idx]!;
    const next = line[(idx + 1) % period]!;
    const v = (cur + next) * damp;
    line[idx] = v;
    d[i] = cur * 0.9 + prev * 0.1;
    prev = cur;
    idx = (idx + 1) % period;
  }
  return buf;
}
