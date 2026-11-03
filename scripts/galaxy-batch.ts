// Headless batch: run N seeds of the Contest and report outcome/strategy balance.
// usage: npx vite-node scripts/galaxy-batch.ts -- [N] [startSeed] [--verbose]
declare const process: { argv: string[] };
import { GalaxySim } from '../src/galaxy/GalaxySim';
import { formatEpoch } from '../src/galaxy/chronicle';

const args = process.argv.slice(2).filter((a: string) => a !== '--');
const N = Number(args[0] ?? 20);
const start = Number(args[1] ?? 1);
const verbose = args.includes('--verbose');
const outcomes: Record<string, number> = {};
const goals: Record<string, number> = {};
const megas: Record<string, number> = {};
const names: Record<string, number> = {};
let heir = 0;
let totalMs = 0;
for (let s = start; s < start + N; s++) {
  const t0 = performance.now();
  const sim = new GalaxySim(s * 7919);
  const res = sim.runToEnd();
  const ms = performance.now() - t0;
  totalMs += ms;
  outcomes[res.outcome] = (outcomes[res.outcome] ?? 0) + 1;
  const v = res.victor >= 0 ? res.factions[res.victor]! : null;
  if (v) {
    goals[v.genome.goal] = (goals[v.genome.goal] ?? 0) + 1;
    megas[v.genome.mega] = (megas[v.genome.mega] ?? 0) + 1;
    names[v.name] = (names[v.name] ?? 0) + 1;
    if (v.id === 0) heir++;
  }
  console.log(`seed ${s * 7919}: ${res.outcome.padEnd(12)} ${v ? v.name.padEnd(22) + v.genome.goal.padEnd(13) + v.genome.mega.padEnd(11) : ''.padEnd(46)} end ${formatEpoch(res.endT).padEnd(12)} F=${res.factions.length} ev=${sim.events.length} ch=${sim.changeT.length} ticks=${res.ticks} ${ms.toFixed(0)}ms`);
  if (verbose) {
    for (const f of res.factions) console.log(`     ${f.name.padEnd(24)} ${f.kind.padEnd(9)} ${f.genome.goal.padEnd(12)} agg ${f.genome.aggression.toFixed(2)} coop ${f.genome.cooperation.toFixed(2)} born ${formatEpoch(f.born).padEnd(11)} peak ${String(f.peakNodes).padEnd(6)} died ${f.diedAt > 0 ? formatEpoch(f.diedAt) : '-'}`);
    for (const e of sim.events) if (e.text) console.log('   ', formatEpoch(e.t), e.text);
  }
}
console.log('\noutcomes', outcomes);
console.log('winning goals', goals);
console.log('winning megas', megas);
console.log('winners', names, 'heir', heir);
console.log('mean ms', (totalMs / N).toFixed(0));
