/**
 * The chronicle: a terse template grammar. Laconic, never jokey; victory is
 * never announced.
 */
export function formatEpoch(T: number): string {
  if (T >= 1e9) return `+${(T / 1e9).toFixed(T < 1e10 ? 2 : 1).replace(/\.?0+$/, '')} billion years`;
  if (T >= 1e6) return `+${(T / 1e6).toFixed(T < 1e7 ? 1 : 0).replace(/\.0$/, '')} million years`;
  if (T >= 1e4) return `+${Math.round(T / 1e3).toLocaleString('en-US')},000 years`;
  return `+${Math.round(T).toLocaleString('en-US')} years`;
}

/** A light-travel age, spelled out in round words. */
export function formatAge(years: number): string {
  if (years >= 1e6) return `${(years / 1e6).toFixed(1).replace(/\.0$/, '')} million years`;
  if (years >= 1e3) return `${Math.round(years / 1e3).toLocaleString('en-US')},000 years`;
  return `${Math.max(1, Math.round(years))} years`;
}

export const TEMPLATES: Record<string, string[]> = {
  launch: ['The first probes left the Sun.'],
  reachGalaxy: ['{A} reached {G}.', '{G} was quiet when {A} arrived.'],
  lostProbes: ['Probes sent into {P} did not report back.'],
  emerge: ['Something woke in {P}.', 'A second mind opened its eyes in {P}.', 'In {P}, a light that had not been there before.'],
  intrude: ['{A} crossed into {G} from the dark between galaxies.', 'Something came out of the intergalactic dark into {G}.'],
  reveal: ['{P} had never been empty. {A} had been watching.', '{A} had been in {P} all along.'],
  contactLight: ['{A} saw the light of {B}. It was {AGE} old.', 'The light of {B} reached {A}. It had left {AGE} before.'],
  contactTouch: ['{A} and {B} found each other in {P}.', '{A} and {B} met in {P}.'],
  war: ['{A} struck first.', '{A} moved against {B}.', '{A} decided {B} was a threat.'],
  rkv: ['{A} launched kill vehicles at {B}, aimed at light {AGE} old.', '{A} fired at where {B} had been {AGE} before.'],
  rkvMiss: ['The kill vehicles reached {P}. {B} was no longer there.', 'The kill vehicles found {C} in {P} instead.'],
  laser: ['{A} turned a star into a lamp, and the lamp into a weapon.'],
  supernova: ['A star in {P} was made to explode.', '{A} detonated a star in {P}.'],
  shkadov: ['{A} began to move its stars.'],
  starlift: ['{A} began to take its stars apart.'],
  blackhole: ['{A} fed a star to a black hole.'],
  dark: ['{A} went dark.'],
  silent: ['{A} went silent near {P}. It did not answer again.'],
  treaty: ['{A} and {B} exchanged values.', '{A} and {B} agreed to share the dark.'],
  merge: ['{A} and {B} became one mind.', '{A} and {B} were no longer two.'],
  betrayal: ['{A} broke faith with {B}.'],
  swallow: ['{A} took in what was left of {B}.'],
  extinct: ['The last of {B} went out in {P}.', '{B} went out in {P}.'],
  clouds: ['The Clouds fell into the Milky Way.'],
  andromeda: ['The galaxies fell into each other.'],
  merged: ['The two galaxies became one.'],
  vacuum: ['Near {P}, the vacuum gave way.'],
  totalWar: ['After that, {A} and {B} aimed at everything.', '{A} and {B} stopped counting what it cost.'],
};

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function fillTemplate(tpl: string, v: Record<string, string>): string {
  let out = tpl.replace(/\{(\w+)\}/g, (_, k: string) => v[k] ?? '');
  // sentence-initial articles are capitalised
  out = out.replace(/(^|\.\s+)([a-z])/g, (_, a: string, b: string) => a + b.toUpperCase());
  return out;
}
