import { describe, expect, it } from 'vitest';

declare const process: { env?: Record<string, string | undefined> } | undefined;
import { buildUniverse, nodePos, galaxyCenter, GAL, COLLISION_T } from '../src/galaxy/universe';
import { GalaxySim } from '../src/galaxy/GalaxySim';
import { GOALS } from '../src/galaxy/factions';

/**
 * Regime B. The galaxy is the same sky every run; the history is not.
 * Full balance (50+ seeds) runs with BALANCE=1 (`npm run test:balance`, and in CI);
 * the default suite runs a quick subset.
 */
const BALANCE = typeof process !== 'undefined' && process.env?.BALANCE === '1';

describe('the Local Group graph', () => {
  it('is deterministic, connected per galaxy and in the 20–50k node range', () => {
    const u = buildUniverse();
    expect(u.n).toBeGreaterThanOrEqual(20000);
    expect(u.n).toBeLessThanOrEqual(50000);
    for (let g = 0; g < 5; g++) {
      const s = u.galStart[g]!, n = u.galCount[g]!;
      const seen = new Uint8Array(u.n);
      const q = [s];
      seen[s] = 1;
      let k = 0;
      while (q.length) {
        const i = q.pop()!;
        k++;
        for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) if (!seen[u.nbr[e]!]) (seen[u.nbr[e]!] = 1), q.push(u.nbr[e]!);
      }
      expect(k).toBe(n);
    }
  });
  it('Andromeda falls in and collides near +4.5 Gyr', () => {
    const d0 = Math.hypot(...galaxyCenter(GAL.M31, 0));
    const dc = Math.hypot(...galaxyCenter(GAL.M31, COLLISION_T));
    expect(d0).toBeGreaterThan(700);
    expect(dc).toBeLessThan(40);
    const u = buildUniverse();
    expect(nodePos(u, u.sunNode, 0)[0]).toBeCloseTo(nodePos(u, u.sunNode, 1e9)[0]);
  });
});

describe('the Contest', () => {
  it('is deterministic for a given seed (state hashes at checkpoints)', () => {
    const run = (seed: number) => {
      const s = new GalaxySim(seed);
      s.advance(Infinity, 3.0e9);
      return { hashes: s.checkpoints.map((c) => c.hash), changes: s.changeT.length, events: s.events.map((e) => e.type + e.t.toFixed(0)).join('|') };
    };
    const a = run(424242), b = run(424242);
    expect(a.hashes.length).toBeGreaterThan(1);
    expect(a.hashes).toEqual(b.hashes);
    expect(a.changes).toBe(b.changes);
    expect(a.events).toBe(b.events);
  }, 60000);

  it('different seeds write different histories', () => {
    const sig = (seed: number) => {
      const s = new GalaxySim(seed);
      s.advance(Infinity, 3.0e9);
      return s.checkpoints[s.checkpoints.length - 1]!.hash;
    };
    const hs = new Set([11, 22, 33, 44].map(sig));
    expect(hs.size).toBe(4);
  }, 60000);

  it('the Heir fills the Milky Way within a few million years', () => {
    const s = new GalaxySim(99);
    s.advance(Infinity, 5e6);
    let heir = 0;
    for (let i = 0; i < s.u.galCount[0]!; i++) if (s.owner[i] === 0) heir++;
    expect(heir / s.u.galCount[0]!).toBeGreaterThan(0.9);
  }, 30000);

  it(`is balanced: winners, outcomes and strategies vary (${BALANCE ? 50 : 8} seeds)`, () => {
    const N = BALANCE ? 50 : 8;
    const goals: Record<string, number> = {}, outcomes: Record<string, number> = {}, winners: Record<string, number> = {}, megas: Record<string, number> = {};
    for (let k = 0; k < N; k++) {
      const sim = new GalaxySim(1000 + k * 7919);
      const r = sim.runToEnd();
      outcomes[r.outcome] = (outcomes[r.outcome] ?? 0) + 1;
      const v = r.victor >= 0 ? r.factions[r.victor]! : null;
      if (v) {
        goals[v.genome.goal] = (goals[v.genome.goal] ?? 0) + 1;
        megas[v.genome.mega] = (megas[v.genome.mega] ?? 0) + 1;
        winners[v.name] = (winners[v.name] ?? 0) + 1;
      }
      expect(r.endT).toBeGreaterThan(1e9);
      expect(r.spark.every((c) => c >= 0 && c <= 1)).toBe(true);
    }
    // eslint-disable-next-line no-console
    console.log('balance', { N, outcomes, goals, megas, winners });
    expect(Object.keys(winners).length).toBeGreaterThanOrEqual(BALANCE ? 4 : 2);
    if (BALANCE) {
      for (const g of GOALS) expect((goals[g] ?? 0) / N).toBeLessThanOrEqual(0.42);
      for (const m of Object.keys(megas)) expect(megas[m]! / N).toBeLessThanOrEqual(0.42);
      for (const w of Object.keys(winners)) expect(winners[w]! / N).toBeLessThanOrEqual(0.42);
      expect(Object.keys(outcomes).length).toBeGreaterThanOrEqual(3);
    }
  }, 900000);
});
