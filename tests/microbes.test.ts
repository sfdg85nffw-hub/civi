import { describe, expect, it } from 'vitest';
import { MicrobeSim, MICROBE_FATE } from '../src/sim/agents/microbes';

function fateAt(T: number) {
  const s = MICROBE_FATE.sample(T);
  return { targets: s.values, k: s.k };
}

describe('microbial mat (field mode)', () => {
  it('tracks the canonical aggregates and lands on milestones for every seed', () => {
    const milestone = -2.7e9;
    const results: { b: number; p: number }[] = [];
    for (const seed of [1, 2, 3, 4, 5]) {
      const sim = new MicrobeSim();
      let T = -2.9e9;
      sim.init(seed, T, fateAt(T));
      // run up to the milestone with geological speed
      while (T < milestone) {
        T = Math.min(milestone, T + 2e6);
        sim.step(1 / 30, T, fateAt(T));
      }
      const st = sim.stats();
      results.push({ b: st.biomass, p: st.photo });
    }
    const tgt = MICROBE_FATE.sample(milestone).values;
    for (const r of results) {
      expect(r.b).toBeCloseTo(tgt.biomass!, 2);
      expect(r.p).toBeCloseTo(tgt.photo!, 2);
    }
  });
});

describe('microbial mat (agents)', () => {
  it('condenses from the field with matching statistics and differs per seed', () => {
    const snaps: number[][] = [];
    for (const seed of [11, 12]) {
      const sim = new MicrobeSim();
      const T = -3.45e9;
      sim.init(seed, T, fateAt(T));
      for (let i = 0; i < 60; i++) sim.step(1 / 30, T, fateAt(T));
      const before = sim.stats();
      sim.setLOD(1);
      const after = sim.stats();
      expect(Math.abs(after.biomass - before.biomass)).toBeLessThan(0.03);
      expect(Math.abs(after.photo - before.photo)).toBeLessThan(0.06);
      // agents live: run 6 local seconds
      for (let i = 0; i < 180; i++) sim.step(1 / 30, T + i, fateAt(T));
      const snap = sim.snapshot();
      expect(snap.count).toBeGreaterThan(100);
      snaps.push(Array.from(snap.agents.slice(0, 24)));
      // dissolve back to the field keeps biomass
      const live = sim.stats();
      sim.setLOD(0);
      const back = sim.stats();
      expect(Math.abs(back.biomass - live.biomass)).toBeLessThan(0.05);
    }
    expect(snaps[0]).not.toEqual(snaps[1]);
  });
});
