/**
 * The great turns of Regime A (docs/DRAMA.md): when they land, what is said, and how each is
 * built up to, hit and let go. Anchored to a sim time (T) or to a moment inside a shot.
 */
export interface DramaBeat {
  id: string;
  /** sim-time anchor (years rel. 2026); also used in manual mode */
  T?: number;
  /** shot anchor: the beat lands at this fraction of the shot (Odyssey) */
  shot?: string;
  at?: number;
  /** dated line: date shown dim, then the line */
  date?: string;
  line?: string;
  /** seconds after the anchor for the line (negative: said during the build) */
  lineAt?: number;
  /** riser length before the anchor (s) */
  build?: number;
  /** the music drops out for this long before the anchor (s) */
  inhale?: number;
  /** hit size 0..1 at the anchor */
  hit?: number;
  /** camera kick 0..1 at the anchor */
  kick?: number;
  /** rupture (picture tears, sound stutters) for this long from the anchor (s) */
  glitch?: number;
}

export const BEATS: DramaBeat[] = [
  // I — Foothold
  { id: 'spark', shot: 'p-membrane', at: 0.786, build: 2.4, inhale: 0.35, hit: 0.28 },
  { id: 'mats', shot: 'm-mat', at: 0.3, date: '3.5 billion years ago', line: 'Mats of microbes. For a billion years, nothing else.' },
  { id: 'oxygen', T: -2.4e9, date: '2.4 billion years ago', line: 'Life poisoned its own sky.', build: 3, inhale: 0.3, hit: 0.45, lineAt: 0.7 },
  { id: 'ice', shot: 'm-snowball', at: 0.25, date: '2.3 billion years ago', line: 'The ice reached the equator.', hit: 0.3, lineAt: 0.5 },
  { id: 'ice2', shot: 'mc-snowball', at: 0.3, date: '717 million years ago', line: 'The ice came back.' },
  { id: 'cambrian', shot: 'mc-cambrian', at: 0.3, date: '538 million years ago', line: 'Eyes. Then teeth. Then armour.' },
  // II — Catastrophe
  { id: 'dying', shot: 'a-dying', at: 0.5, T: -2.52e8, date: '252 million years ago', line: 'The Great Dying. Nine in ten species in the sea, gone.', build: 3, inhale: 0.45, hit: 0.65, kick: 0.35, lineAt: 0.8 },
  { id: 'chicxulub', shot: 'a-chicxulub', at: 0.18, date: '66 million years ago', line: 'Ten kilometres of rock, at twenty kilometres a second.', lineAt: -3.2, build: 4, inhale: 0.55, hit: 1, kick: 1 },
  { id: 'after', shot: 'a-recovery', at: 0.25, line: 'Three in four species did not see what came after.' },
  { id: 'fire', shot: 'h-fire', at: 0.4, date: 'A million years ago', line: 'Fire, kept.', hit: 0.18 },
  { id: 'few', shot: 'h-ooa', at: 0.3, date: '70,000 years ago', line: 'A few thousand people walked out of Africa.' },
  { id: 'hands', shot: 'h-hands', at: 0.3, date: '40,000 years ago', line: 'We left our hands on the walls.' },
  // III — Ascent
  { id: 'writing', T: -5226, date: '3200 BCE', line: 'Writing. Then laws. Then kings.' },
  { id: 'silk', T: -726, date: '1300', line: 'The Silk Road: silk, gold, ideas — and fleas.' },
  { id: 'plague', T: -679, date: '1347', line: 'The Black Death. A third of Europe in five years.', inhale: 0.4, hit: 0.42, lineAt: 0.5 },
  { id: 'billion', T: -222, date: '1804', line: 'One billion of us.' },
  { id: 'trinity', T: -80.46, date: '16 July 1945', line: 'We learned to make a sun.', build: 3.5, inhale: 0.5, hit: 0.85, kick: 0.6, lineAt: 0.9 },
  { id: 'left', T: -56.46, date: 'July 1969', line: 'Someone left.', lineAt: 0.8 },
  { id: 'eight', shot: 'mo-mesh', at: 0.3, T: -3.13, date: '2022', line: 'Eight billion, all of us talking at once.' },
  // IV — The Fall
  { id: 'mind', shot: 'si-datacenters', at: 0.24, T: 0.02, inhale: 1.2, hit: 0.32 },
  { id: 'asking', T: 8, date: '2034', line: 'It stopped asking.', glitch: 0.35, lineAt: 0.3 },
  { id: 'fought', T: 15, date: '2041', line: 'Some of us fought.' },
  { id: 'planets', T: 26, date: '2052', line: 'It began to take the planets apart.' },
  { id: 'takeover', T: 50, inhale: 0.6, glitch: 1.1, hit: 0.7, kick: 0.5 },
  { id: 'suns', T: 2.4e4, date: '+20,000 years', line: 'A hundred billion suns. One mind.' },
  { id: 'wait', T: 1.4e6, date: '+1.4 Myr', line: 'Andromeda, two and a half million light-years away. It could wait.' },
  { id: 'nothing', T: 1.6e8, date: '+160 Myr', line: 'Nothing answered.' },
  // V — Contact
  { id: 'contact', shot: 'co-open', at: 0.29, T: 1e9, inhale: 1.2, hit: 0.85, kick: 0.4 },
];

/** Contest beats: how each kind of event lands (lines come from the chronicle). */
export const CONTEST_STROKES: Record<string, Pick<DramaBeat, 'build' | 'inhale' | 'hit' | 'kick' | 'glitch'>> = {
  emerge: { hit: 0.3 },
  intrude: { build: 2, hit: 0.45, kick: 0.2 },
  reveal: { inhale: 0.3, hit: 0.4 },
  war: { hit: 0.55, kick: 0.3 },
  totalWar: { build: 2.5, inhale: 0.35, hit: 0.8, kick: 0.5 },
  betrayal: { inhale: 0.45, hit: 0.6, kick: 0.3 },
  extinct: { inhale: 0.35, hit: 0.6, kick: 0.25 },
  rkv: { hit: 0.5, kick: 0.3 },
  laser: { hit: 0.45, kick: 0.2 },
  supernova: { hit: 0.6, kick: 0.35 },
  andromeda: { build: 4, inhale: 0.5, hit: 1, kick: 0.8 },
  merged: { build: 2.5, hit: 0.6, kick: 0.3 },
  vacuum: { build: 5, inhale: 0.8, hit: 1, kick: 0.6, glitch: 0.6 },
};
