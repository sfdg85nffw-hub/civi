// Print the Contest beats' protagonists for a seed (debug aid).
// usage: npx vite-node scripts/beat-info.ts -- <hexSeed>
declare const process: { argv: string[] };
import { GalaxySim } from '../src/galaxy/GalaxySim';
import { parseSeed } from '../src/core/rng';
import { buildUniverse, nodePos } from '../src/galaxy/universe';
const hex = process.argv.slice(2).filter((a) => a !== '--')[0] ?? '1234ABCD';
const sim = new GalaxySim(parseSeed(hex) ?? 0);
const res = sim.runToEnd();
const u = buildUniverse();
const P: [number, number, number] = [0, 0, 0];
for (const e of sim.events) {
  if (!e.text || e.weight < 0.6 || e.t < 1e9) continue;
  if (!['emerge', 'intrude', 'reveal', 'extinct', 'betrayal', 'merge', 'totalWar', 'andromeda'].includes(e.type)) continue;
  const hero = e.type === 'extinct' ? e.b : e.a >= 0 ? e.a : e.b;
  const f = res.factions[hero];
  if (e.node >= 0) nodePos(u, e.node, e.t, P);
  const g = e.node >= 0 ? u.gal[e.node] : -1;
  const r = e.node >= 0 ? Math.hypot(u.lx[e.node]!, u.ly[e.node]!, u.lz[e.node]!) : -1;
  console.log((e.t / 1e9).toFixed(3), e.type, 'hero', hero, f?.name, f?.color.map((c) => c.toFixed(2)).join(','), 'gal', g, 'r', r.toFixed(1), '|', e.text);
}
