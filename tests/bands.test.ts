import { describe, expect, it } from 'vitest';
import { BandSim, BAND_FATE, rangeWeight, habitability } from '../src/sim/agents/bands';

const fate = (T: number) => { const s = BAND_FATE.sample(T); return { targets: s.values, k: s.k }; };

describe('hominin dispersal', () => {
  it('canonical milestones are fixed: Out of Africa, Europe, the Americas, the last Neanderthals', () => {
    // Paris, Sydney, Mexico City, Nairobi
    expect(rangeWeight(2, 48.8, 2.3, -1.0e5)).toBe(0);
    expect(rangeWeight(2, 48.8, 2.3, -3.0e4)).toBeGreaterThan(0.9);
    expect(rangeWeight(2, -33.9, 151.2, -8.0e4)).toBe(0);
    expect(rangeWeight(2, -33.9, 151.2, -4.0e4)).toBeGreaterThan(0.9);
    expect(rangeWeight(2, 19.4, -99.1, -2.0e4)).toBe(0);
    expect(rangeWeight(2, 19.4, -99.1, -1.3e4)).toBeGreaterThan(0.5);
    expect(rangeWeight(1, 48.8, 2.3, -6.0e4)).toBeGreaterThan(0.5);
    expect(rangeWeight(1, 48.8, 2.3, -3.5e4)).toBe(0);
    expect(habitability(-1.3, 36.8, -5e4)).toBeGreaterThan(0.3);
    expect(habitability(0, -30, -5e4)).toBe(0); // the Atlantic
  });
  it('bands condense from the field and wander differently per seed', () => {
    const snaps: number[][] = [];
    for (const seed of [1, 2]) {
      const sim = new BandSim();
      const T = -4.5e4;
      sim.init(seed, T, fate(T));
      sim.setLOD(1);
      for (let i = 0; i < 120; i++) sim.step(1 / 30, T + i, fate(T));
      const snap = sim.snapshot();
      expect(snap.count).toBeGreaterThan(50);
      expect(sim.stats().sapiens).toBeGreaterThan(sim.stats().neanderthal);
      snaps.push(Array.from(snap.agents.slice(0, 16)));
    }
    expect(snaps[0]).not.toEqual(snaps[1]);
  });
});
