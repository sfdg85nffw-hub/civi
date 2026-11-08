import { describe, expect, it } from 'vitest';
import { DramaEngine } from '../src/app/drama';
import { Odyssey } from '../src/time/odyssey';
import { BEATS } from '../src/chapters/beats';
import type { Director } from '../src/director/Director';

/** a stand-in Director: only the shots the beats anchor to, at fixed story times */
function fakeDirector(shots: Record<string, [number, number]>): Director {
  const list = Object.entries(shots).map(([id, [s0, dur]]) => ({ def: { id, stage: 'x', dur, rig: () => null } as never, s0, dur }));
  return { shotsFor: (c: number) => (c === 3 ? list : []) } as unknown as Director;
}

describe('drama: the beat engine', () => {
  it('builds, inhales, hits and speaks in that order, on story time', () => {
    const events: string[] = [];
    const eng = new DramaEngine({
      line: (d, t) => events.push(`line:${d}|${t}`),
      riser: (sec) => events.push(`build:${sec.toFixed(1)}`),
      hit: (x) => events.push(`hit:${x}`),
      glitch: () => events.push('glitch'),
    });
    const od = new Odyssey();
    // Chicxulub lands at 18 % of a 6 s shot starting at 80.5 s
    const dir = fakeDirector({ 'a-chicxulub': [80.5, 6] });
    let minDuck = 1, maxShake = 0;
    for (let s = 70; s < 90; s += 0.05) {
      eng.update({ s, T: od.T(s), mode: 'odyssey', dt: 0.05, paused: false }, dir, od);
      if (s > 81 && s < 81.55) minDuck = Math.min(minDuck, eng.duck);
      maxShake = Math.max(maxShake, eng.shake);
    }
    const order = events.filter((e) => /build:4|hit:1|line:66/.test(e));
    expect(order[0]).toMatch(/^build:4/);
    expect(order).toContain('hit:1');
    expect(events.indexOf('hit:1')).toBeGreaterThan(events.findIndex((e) => e.startsWith('build:4')));
    // the stakes are said during the build, before the hit
    expect(events.findIndex((e) => e.startsWith('line:66 million'))).toBeLessThan(events.indexOf('hit:1'));
    expect(minDuck).toBeLessThan(0.1);
    expect(maxShake).toBeGreaterThan(0.8);
    expect(eng.duck).toBe(1);
  });

  it('jumps (seeks) fire nothing; manual mode lands the turn without its build', () => {
    const events: string[] = [];
    const eng = new DramaEngine({ line: (d) => events.push('line:' + d), riser: () => events.push('build'), hit: () => events.push('hit'), glitch: () => events.push('glitch') });
    const od = new Odyssey();
    const dir = fakeDirector({});
    eng.update({ s: 10, T: od.T(10), mode: 'odyssey', dt: 0.05, paused: false }, dir, od);
    eng.update({ s: 160, T: od.T(160), mode: 'odyssey', dt: 0.05, paused: false }, dir, od);
    expect(events).toEqual([]);
    // manual: Trinity (−80.46) crossed forward in sim time
    eng.update({ s: 0, T: -81, mode: 'manual', dt: 0.05, paused: false }, dir, od);
    eng.update({ s: 0, T: -80.3, mode: 'manual', dt: 0.05, paused: false }, dir, od);
    expect(events).toContain('hit');
    expect(events).toContain('line:16 July 1945');
    expect(events).not.toContain('build');
  });

  it('every line is short and every anchor is defined', () => {
    for (const b of BEATS) {
      expect(b.T !== undefined || b.shot !== undefined).toBe(true);
      if (b.line) expect(b.line.length).toBeLessThan(90);
    }
  });
});
