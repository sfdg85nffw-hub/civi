import { describe, expect, it } from 'vitest';
import { Rng, hashString, parseSeed, seedToString } from '../src/core/rng';
import { MonotoneCubic, warp, unwarp, mixOklab, hexToLinear, linearToHex } from '../src/core/math';

describe('rng', () => {
  it('is deterministic for a seed and stream', () => {
    const a = Rng.stream(42, 'galaxy');
    const b = Rng.stream(42, 'galaxy');
    for (let i = 0; i < 1000; i++) expect(a.nextU32()).toBe(b.nextU32());
  });
  it('gives independent streams per subsystem', () => {
    const a = Rng.stream(42, 'galaxy');
    const b = Rng.stream(42, 'microbes');
    let same = 0;
    for (let i = 0; i < 1000; i++) if (a.nextU32() === b.nextU32()) same++;
    expect(same).toBeLessThan(3);
  });
  it('is roughly uniform', () => {
    const r = new Rng(7);
    const bins = new Array(10).fill(0);
    for (let i = 0; i < 100000; i++) bins[Math.floor(r.next() * 10)]++;
    for (const b of bins) expect(Math.abs(b - 10000)).toBeLessThan(500);
  });
  it('checkpoints and restores state', () => {
    const r = new Rng(99);
    r.next();
    const st = r.getState();
    const x = [r.next(), r.next()];
    r.setState(st);
    expect([r.next(), r.next()]).toEqual(x);
  });
  it('parses and prints seeds', () => {
    expect(seedToString(0xdeadbeef)).toBe('DEADBEEF');
    expect(parseSeed('DEADBEEF')).toBe(0xdeadbeef);
    expect(parseSeed('hello')).toBe(hashString('hello'));
  });
});

describe('math', () => {
  it('warp/unwarp round-trip across scales', () => {
    for (const T of [-4e9, -2.4e9, -66e6, -12026, -2600, -1, 0, 1, 50, 4.5e9, 1e14, 1e100]) {
      expect(unwarp(warp(T)) / (T === 0 ? 1 : T)).toBeCloseTo(T === 0 ? 0 : 1, 9);
    }
  });
  it('monotone cubic does not overshoot and inverts', () => {
    const c = new MonotoneCubic([0, 1, 2, 3, 10], [0, 0.1, 5, 5.0001, 9]);
    let prev = -Infinity;
    for (let x = 0; x <= 10; x += 0.01) {
      const y = c.eval(x);
      expect(y).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = y;
    }
    for (const x of [0.5, 1.7, 2.5, 7.3]) expect(c.inverse(c.eval(x))).toBeCloseTo(x, 6);
  });
  it('colour helpers round-trip', () => {
    expect(linearToHex(hexToLinear('#9fe8ff'))).toBe('#9fe8ff');
    const m = mixOklab([hexToLinear('#ff0000'), hexToLinear('#0000ff')]);
    expect(m.every((v) => v >= 0 && v <= 1)).toBe(true);
  });
});
