import { describe, expect, it } from 'vitest';
import { CreatureSim, CREATURE_FATE } from '../src/sim/agents/creatures';

const fate = (T: number) => { const s = CREATURE_FATE.sample(T); return { targets: s.values, k: s.k }; };

describe('cambrian swimmers', () => {
  it('swim: thrust emerges from anisotropic drag on an undulating body', () => {
    const sim = new CreatureSim();
    sim.maxCells = 1;
    sim.init(3, -5.2e8, { targets: { population: 1 / 150, predators: 0 }, k: 0 });
    sim.creatures.length = 0;
    const g = sim.randomGenome(false);
    g.n = 5; g.seg = [0.015, 0.015, 0.015, 0.015]; g.amp = 0.6; g.freq = 2; g.lag = 0.9; g.turn = 0; g.sight = 0.0001;
    (sim as any).spawn(0.5, 0.5, g, 100, 1);
    const c = sim.creatures[0]!;
    const cx0 = c.px[2]!, cz0 = c.pz[2]!;
    for (let i = 0; i < 300; i++) sim.step(1 / 30, -5.2e8, { targets: { population: 1 / 150, predators: 0 }, k: 0 });
    let dx = c.px[2]! - cx0, dz = c.pz[2]! - cz0;
    dx -= Math.round(dx); dz -= Math.round(dz);
    const dist = Math.hypot(dx, dz);
    expect(dist).toBeGreaterThan(0.02); // swam several body lengths in 10 s
  });

  it('populations evolve differently per seed but track the fate field', () => {
    const results: number[][] = [];
    for (const seed of [1, 2]) {
      const sim = new CreatureSim();
      let T = -5.3e8;
      sim.init(seed, T, fate(T));
      for (let i = 0; i < 600; i++) { T += 20; sim.step(1 / 30, T, fate(T)); }
      const st = sim.stats();
      const tgt = fate(T).targets;
      expect(Math.abs(st.population - tgt.population!)).toBeLessThan(0.35);
      results.push(Array.from(sim.snapshot().agents.slice(8, 14)));
    }
    expect(results[0]).not.toEqual(results[1]);
  });
});
