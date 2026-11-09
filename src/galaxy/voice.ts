import type { GEvent } from './GalaxySim';

/**
 * The Contest's voice (docs/DRAMA.md, review pass D): the viewer never met the factions by
 * name. The mind we built stays "It" to the end; every rival is named by where it came from.
 */
const GAL_NAMES = ['our galaxy', 'the Large Cloud', 'the Small Cloud', 'Andromeda', 'Triangulum'];

export function buildEpithets(
  factions: readonly { name: string; info?: { kind?: string } }[],
  events: readonly GEvent[],
  galOf: (node: number) => number,
): string[] {
  const out: string[] = factions.map(() => '');
  out[0] = 'it';
  const used = new Map<string, number>();
  const take = (base: string): string => {
    const n = used.get(base) ?? 0;
    used.set(base, n + 1);
    if (n === 0) return base;
    const ord = ['second', 'third', 'fourth', 'fifth'][Math.min(3, n - 1)]!;
    return base.replace(/^the (new |hidden )?mind/, `the ${ord} $1mind`).replace(/^the new light$/, `the ${ord} new light`);
  };
  for (const e of events) {
    if (e.a <= 0 || e.a >= factions.length || out[e.a]) continue;
    if (e.type !== 'emerge' && e.type !== 'intrude' && e.type !== 'reveal' && e.type !== 'merge') continue;
    const g = e.node >= 0 ? galOf(e.node) : 0;
    if (e.type === 'intrude') out[e.a] = take('the mind from the dark');
    else if (e.type === 'reveal') out[e.a] = take('the hidden mind');
    else if (e.type === 'merge') out[e.a] = take('the joined minds');
    else out[e.a] = take(g === 0 ? 'the new light' : `the mind in ${GAL_NAMES[g]}`);
  }
  factions.forEach((f, i) => {
    if (!out[i]) out[i] = f.info?.kind === 'merged' ? take('the joined minds') : take('another mind');
  });
  return out;
}

/** Rewrite a chronicle line in the film's voice. */
export function voice(text: string, factions: readonly { name: string }[], epithets: readonly string[]): string {
  let s = text;
  // longest names first, so a short name never eats part of a longer one
  const order = factions.map((f, i) => ({ n: f.name, i })).filter((x) => x.n && epithets[x.i]).sort((a, b) => b.n.length - a.n.length);
  for (const { n, i } of order) {
    const ep = epithets[i]!;
    const bare = n.replace(/^the /i, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`\\b(?:[Tt]he )?${bare}('s)?\\b`, 'g');
    s = s.replace(re, (_m: string, poss: string | undefined, offset: number) => {
      let w = poss ? (ep === 'it' ? 'its' : ep + "'s") : ep;
      const before = s.slice(0, offset);
      if (offset === 0 || /[.!?]\s*$/.test(before)) w = w[0]!.toUpperCase() + w.slice(1);
      return w;
    });
  }
  // "X and it …" reads better as "It and x …"
  s = s.replace(/^(.+?) and it\b/, (_m: string, x: string) => 'It and ' + x[0]!.toLowerCase() + x.slice(1));
  return s;
}
