import { describe, expect, it } from 'vitest';
import { EcosystemSim, ECO_FATE } from '../src/sim/agents/ecosystem';

const fate = (T: number) => { const s = ECO_FATE.sample(T); return { targets: s.values, k: s.k }; };

describe('living land', () => {
  it('sustains predator–prey dynamics that oscillate, differently per seed', () => {
    const traces: number[][] = [];
    for (const seed of [5, 6]) {
      const sim = new EcosystemSim();
      const T = -2.9e8;
      sim.init(seed, T, fate(T));
      const herb: number[] = [];
      for (let i = 0; i < 1500; i++) {
        sim.step(1 / 30, T, fate(T));
        if (i % 30 === 0) herb.push(sim.stats().herbivores);
      }
      const st = sim.stats();
      expect(st.herbivores).toBeGreaterThan(20);
      expect(st.predators).toBeGreaterThan(1);
      const mean = herb.reduce((a, b) => a + b, 0) / herb.length;
      const varr = herb.reduce((a, b) => a + (b - mean) ** 2, 0) / herb.length;
      expect(Math.sqrt(varr)).toBeGreaterThan(2); // not a flat line
      traces.push(herb);
    }
    expect(traces[0]).not.toEqual(traces[1]);
  });
  it('the Permian stress collapses the biosphere on schedule', () => {
    const sim = new EcosystemSim();
    let T = -2.54e8;
    sim.init(9, T, fate(T));
    const before = sim.stats().animals;
    for (let i = 0; i < 900; i++) { T += 2000; sim.step(1 / 30, T, fate(T)); }
    expect(sim.stats().animals).toBeLessThan(before);
  });
});
