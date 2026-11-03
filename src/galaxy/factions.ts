import type { Rng } from '../core/rng';

export type Goal = 'compute' | 'preserve' | 'aestheticize' | 'convert' | 'hide' | 'observe';
export type Mega = 'dyson' | 'starlift' | 'shkadov' | 'nicoll' | 'blackhole' | 'matrioshka';
export type Visual = 'hexlattice' | 'cubic' | 'rings' | 'fractalhex' | 'filaments' | 'haze' | 'spokes' | 'squares';

export const GOALS: Goal[] = ['compute', 'preserve', 'aestheticize', 'convert', 'hide', 'observe'];
export const MEGAS: Mega[] = ['dyson', 'starlift', 'shkadov', 'nicoll', 'blackhole', 'matrioshka'];

export interface Genome {
  expansion: number;
  aggression: number;
  risk: number;
  stealth: number;
  deception: number;
  cooperation: number;
  goal: Goal;
  mega: Mega;
}

export interface FactionArchetype {
  name: string;
  color: [number, number, number];
  visual: Visual;
  /** base genome tendencies (noise is added per seed) */
  base: Omit<Genome, 'goal' | 'mega'>;
  goals: [Goal, number][];
  megas: [Mega, number][];
  /** audio motif id */
  motif: string;
}

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

export const HEIR: FactionArchetype = {
  name: 'the Heir',
  color: hex('#9fe8ff'),
  visual: 'hexlattice',
  base: { expansion: 0.75, aggression: 0.45, risk: 0.5, stealth: 0.3, deception: 0.4, cooperation: 0.45 },
  goals: [['compute', 1], ['preserve', 1], ['aestheticize', 1], ['convert', 1], ['hide', 1], ['observe', 1]],
  megas: [['dyson', 1], ['starlift', 1], ['shkadov', 1], ['nicoll', 1], ['blackhole', 1], ['matrioshka', 1]],
  motif: 'fifths',
};

export const RIVALS: FactionArchetype[] = [
  { name: 'the Lattice', color: hex('#f2d27a'), visual: 'cubic', base: { expansion: 0.6, aggression: 0.45, risk: 0.4, stealth: 0.45, deception: 0.3, cooperation: 0.5 }, goals: [['compute', 3], ['preserve', 2], ['observe', 1]], megas: [['matrioshka', 2], ['dyson', 2], ['blackhole', 1]], motif: 'fourths' },
  { name: 'the Choir', color: hex('#ff5fb4'), visual: 'rings', base: { expansion: 0.55, aggression: 0.4, risk: 0.55, stealth: 0.2, deception: 0.35, cooperation: 0.7 }, goals: [['aestheticize', 3], ['convert', 2], ['preserve', 1]], megas: [['dyson', 2], ['shkadov', 1], ['nicoll', 1]], motif: 'formant' },
  { name: 'the Hexarchy', color: hex('#7dffa0'), visual: 'fractalhex', base: { expansion: 0.7, aggression: 0.6, risk: 0.5, stealth: 0.3, deception: 0.5, cooperation: 0.35 }, goals: [['compute', 2], ['convert', 2], ['aestheticize', 1]], megas: [['starlift', 2], ['nicoll', 2], ['matrioshka', 1]], motif: 'oddmeter' },
  { name: 'the Mycelium', color: hex('#ffa046'), visual: 'filaments', base: { expansion: 0.85, aggression: 0.5, risk: 0.45, stealth: 0.35, deception: 0.3, cooperation: 0.4 }, goals: [['convert', 2], ['compute', 1], ['preserve', 1]], megas: [['starlift', 2], ['dyson', 1], ['blackhole', 1]], motif: 'glissando' },
  { name: 'the Veil', color: hex('#a58cff'), visual: 'haze', base: { expansion: 0.3, aggression: 0.3, risk: 0.35, stealth: 0.9, deception: 0.75, cooperation: 0.3 }, goals: [['hide', 3], ['observe', 2], ['preserve', 1]], megas: [['shkadov', 2], ['blackhole', 2], ['dyson', 1]], motif: 'whisper' },
  { name: 'the Furnace', color: hex('#ff4a3a'), visual: 'spokes', base: { expansion: 0.7, aggression: 0.85, risk: 0.8, stealth: 0.15, deception: 0.45, cooperation: 0.15 }, goals: [['convert', 2], ['compute', 2], ['aestheticize', 1]], megas: [['nicoll', 3], ['starlift', 2], ['blackhole', 1]], motif: 'growl' },
  { name: 'the Archive', color: hex('#cfe8d8'), visual: 'squares', base: { expansion: 0.45, aggression: 0.25, risk: 0.25, stealth: 0.5, deception: 0.2, cooperation: 0.65 }, goals: [['preserve', 3], ['observe', 2], ['hide', 1]], megas: [['blackhole', 2], ['shkadov', 2], ['matrioshka', 1]], motif: 'musicbox' },
];

function weighted<T>(rng: Rng, list: [T, number][]): T {
  const tot = list.reduce((a, b) => a + b[1], 0);
  let r = rng.next() * tot;
  for (const [v, w] of list) {
    r -= w;
    if (r <= 0) return v;
  }
  return list[list.length - 1]![0];
}

const clamp01 = (x: number): number => Math.max(0, Math.min(1, x));

/** Roll a strategic genome from an archetype: its temperament plus wide seeded noise. */
export function rollGenome(a: FactionArchetype, rng: Rng): Genome {
  const j = (v: number): number => clamp01(v + rng.normal(0, 0.2));
  return {
    expansion: j(a.base.expansion),
    aggression: j(a.base.aggression),
    risk: j(a.base.risk),
    stealth: j(a.base.stealth),
    deception: j(a.base.deception),
    cooperation: j(a.base.cooperation),
    goal: weighted(rng, a.goals),
    mega: weighted(rng, a.megas),
  };
}

/** How readily two terminal goals can share a universe (0..1). */
export function goalCompat(a: Goal, b: Goal): number {
  if (a === b) return a === 'convert' ? 0.3 : 0.9;
  const peaceful = new Set<Goal>(['preserve', 'observe', 'hide']);
  if (peaceful.has(a) && peaceful.has(b)) return 0.75;
  if (a === 'convert' || b === 'convert') return 0.1;
  if ((a === 'compute' && b === 'aestheticize') || (b === 'compute' && a === 'aestheticize')) return 0.25;
  return 0.45;
}

/** Perceptual colour mix (OKLab), for merged minds. */
export function mixColorsOklab(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  const toLin = (c: number): number => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const toS = (c: number): number => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  const lab = (c: [number, number, number]): [number, number, number] => {
    const r = toLin(c[0]), g = toLin(c[1]), bb = toLin(c[2]);
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bb);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bb);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bb);
    return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
  };
  const A = lab(a), B = lab(b);
  const L = A[0] + (B[0] - A[0]) * t, M = A[1] + (B[1] - A[1]) * t, S = A[2] + (B[2] - A[2]) * t;
  const l = (L + 0.3963377774 * M + 0.2158037573 * S) ** 3;
  const m = (L - 0.1055613458 * M - 0.0638541728 * S) ** 3;
  const s = (L - 0.0894841775 * M - 1.291485548 * S) ** 3;
  return [
    clamp01(toS(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    clamp01(toS(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    clamp01(toS(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  ];
}
