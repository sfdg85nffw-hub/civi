import { FateField, sampleTrack, type Track } from './FateField';

/**
 * Canonical planetary aggregates A*(T) for Regime A. These drive the
 * far-away (field) appearance of Earth and are identical on every run.
 * Dates are real (years relative to 2026 CE).
 */
const G = 1e9;
const M = 1e6;

export const WORLD_TRACKS: Record<string, Track> = {
  // orange methane / hydrocarbon haze
  haze: [[-4.0 * G, 0.85], [-2.5 * G, 0.82], [-2.43 * G, 0.6], [-2.36 * G, 0.12], [-2.0 * G, 0.06], [-1.6 * G, 0.03], [-1.0 * G, 0.0]],
  // atmospheric O2 relative to present
  o2: [[-4.0 * G, 0], [-2.45 * G, 0.0], [-2.32 * G, 0.06], [-2.06 * G, 0.12], [-1.9 * G, 0.03], [-0.8 * G, 0.05], [-0.6 * G, 0.3], [-0.5 * G, 0.55], [-0.3 * G, 1.5], [-0.252 * G, 0.75], [-0.2 * G, 0.9], [0, 1.0]],
  // global ice coverage (0 = none, 1 = snowball); Quaternary cycles are added analytically
  ice: [
    [-4.0 * G, 0.0], [-2.95 * G, 0.0], [-2.9 * G, 0.18], [-2.85 * G, 0.02],
    [-2.33 * G, 0.06], [-2.3 * G, 0.6], [-2.27 * G, 0.97], [-2.12 * G, 0.97], [-2.07 * G, 0.15], [-2.0 * G, 0.03],
    [-0.73 * G, 0.04], [-0.717 * G, 0.97], [-0.662 * G, 0.97], [-0.656 * G, 0.12], [-0.65 * G, 0.6], [-0.645 * G, 0.97], [-0.637 * G, 0.97], [-0.632 * G, 0.06],
    [-0.448 * G, 0.04], [-0.445 * G, 0.22], [-0.441 * G, 0.04],
    [-0.34 * G, 0.04], [-0.32 * G, 0.2], [-0.27 * G, 0.15], [-0.26 * G, 0.02],
    [-0.1 * G, 0.0], [-34 * M, 0.05], [-14 * M, 0.08], [-2.7 * M, 0.1], [0, 0.1], [50, 0.075],
  ],
  // fraction of present continental area emerged (craton growth)
  land: [[-4.0 * G, 0.1], [-3.5 * G, 0.22], [-3.0 * G, 0.4], [-2.5 * G, 0.65], [-1.8 * G, 0.88], [-1.0 * G, 1.0]],
  // ferrous green ocean tint
  oceanIron: [[-4.0 * G, 1], [-2.45 * G, 0.9], [-2.2 * G, 0.5], [-1.85 * G, 0.08], [-1.6 * G, 0.04], [-0.6 * G, 0.0]],
  // banded iron precipitation (rust bands in shallow seas)
  bandedIron: [[-2.7 * G, 0.1], [-2.5 * G, 0.6], [-2.4 * G, 1.0], [-2.3 * G, 0.75], [-2.0 * G, 0.5], [-1.85 * G, 0.05], [-1.7 * G, 0]],
  // sulfidic purple seas (boring billion, Permian)
  purpleSea: [[-1.85 * G, 0], [-1.7 * G, 0.25], [-0.85 * G, 0.2], [-0.75 * G, 0], [-252.5 * M, 0], [-252 * M, 0.7], [-249 * M, 0.35], [-245 * M, 0]],
  // global volcanic glow
  volcanism: [[-4.0 * G, 1.0], [-3.6 * G, 0.55], [-2.8 * G, 0.3], [-1.5 * G, 0.12], [-0.5 * G, 0.08], [0, 0.04]],
  // Siberian Traps
  traps: [[-253.5 * M, 0], [-252.6 * M, 1], [-251.6 * M, 0.9], [-250.5 * M, 0.2], [-249 * M, 0]],
  // bombardment (crater speckle on the young Earth)
  bombardment: [[-4.0 * G, 1], [-3.85 * G, 0.4], [-3.7 * G, 0]],
  // microbial life tint in shallows (mats, stromatolites)
  mats: [[-3.8 * G, 0], [-3.5 * G, 0.5], [-2.7 * G, 0.9], [-0.5 * G, 0.6], [-0.4 * G, 0.2]],
  // land vegetation coverage
  vegetation: [
    [-4.75e8, 0], [-4.7e8, 0.05], [-4.2e8, 0.15], [-3.85e8, 0.45], [-3.0e8, 0.9],
    [-2.6e8, 0.4], [-2.52e8, 0.12], [-2.4e8, 0.3], [-2.0e8, 0.5], [-1.3e8, 0.7],
    [-66.0002 * M, 0.75], [-65.99 * M, 0.08], [-65.5 * M, 0.55], [-60 * M, 0.85], [-34 * M, 0.75], [0, 0.72],
  ],
  // biosphere recovery after extinction pulses (multiplies life layers)
  vitality: [[-252.8 * M, 1], [-252 * M, 0.15], [-247 * M, 0.5], [-240 * M, 1], [-66.0001 * M, 1], [-65.999 * M, 0.2], [-65.6 * M, 0.7], [-64 * M, 1]],
  // human agriculture tint
  agriculture: [[-12026, 0], [-11500, 0.02], [-6000, 0.15], [-2000, 0.35], [-526, 0.5], [-100, 0.8], [0, 0.85]],
  // electric light (0 = only fire/oil lamps)
  electric: [[-150, 0], [-144, 0.03], [-110, 0.25], [-76, 0.6], [-46, 0.9], [0, 1]],
  // civilisational light intensity (relative)
  civLight: [[-12026, 0], [-5500, 0.02], [-2000, 0.06], [-526, 0.1], [-266, 0.15], [-126, 0.4], [-76, 0.7], [0, 1]],
  // industrial haze
  smog: [[-266, 0], [-150, 0.25], [-76, 0.5], [-46, 0.65], [-20, 0.55], [0, 0.6], [12, 0.4]],
  // fibre mesh
  fiber: [[-39, 0], [-26, 0.12], [-16, 0.5], [-6, 0.85], [0, 1]],
  // Singularity
  datacenters: [[-6, 0.0], [0, 0.25], [5, 1.0], [8, 1.2]],
  lattice: [[7, 0], [9, 0.05], [12, 0.25], [17, 0.65], [21.5, 0.95], [22.6, 1.0]],
  humanLights: [[9, 1], [12, 0.85], [17, 0.35], [21, 0.03], [22.6, 0]],
  mercury: [[25, 1], [32, 0.8], [38, 0.25], [40, 0]],
  dyson: [[26, 0], [32, 0.15], [40, 0.7], [50, 1]],
};

const MILESTONES = [
  -3.8e9, -3.5e9, -2.7e9, -2.4e9, -2.29e9, -2.06e9, -1.85e9, -1.6e9, -1.2e9, -7.2e8, -6.35e8, -5.75e8, -5.388e8,
  -4.7e8, -4.45e8, -3.85e8, -3.35e8, -2.52e8, -2.3e8, -2.01e8, -1.3e8, -6.6e7, -5.5e7, -3.4e7, -7e6,
  -3.3e6, -2.6e6, -1.9e6, -1.0e6, -3.0e5, -7.0e4, -4.5e4, -2.0e4, -1.2e4,
  -11526, -5526, -5126, -4626, -4126, -3576, -2349, -2026, -1909, -1550, -1485, -679, -526,
  -576, -334, -266, -144, -81.5, -69, -57, -35, -20, 0, 8, 22.6, 40, 50,
];

export const worldFate = new FateField(WORLD_TRACKS, MILESTONES);

/** Quaternary glacial cycles (deterministic): returns extra ice fraction. */
export function quaternaryIce(T: number): number {
  if (T < -2.7e6 || T > -9000) return 0;
  const onset = Math.min(1, (T + 2.7e6) / 3e5);
  // 41 kyr world until ~1.0 Ma, then 100 kyr sawtooth world
  const mpt = Math.min(1, Math.max(0, (T + 1.25e6) / 3.5e5));
  const p41 = 0.5 + 0.5 * Math.sin((2 * Math.PI * T) / 41000);
  const ph = ((T + 20000) / 100000) % 1;
  const saw = ph < 0 ? ph + 1 : ph; // 0 at LGM (−20 kyr), slow build then fast termination
  const p100 = saw < 0.88 ? 1 - saw / 0.88 : (saw - 0.88) / 0.12;
  const deglac = T > -20000 ? Math.max(0, 1 - (T + 20000) / 9000) : 1;
  const v = (1 - mpt) * 0.06 * p41 + mpt * 0.13 * Math.pow(p100, 1.5);
  return onset * v * (T > -20000 ? deglac : 1);
}

export interface WorldState {
  T: number;
  haze: number;
  o2: number;
  ice: number;
  land: number;
  oceanIron: number;
  bandedIron: number;
  purpleSea: number;
  volcanism: number;
  traps: number;
  bombardment: number;
  mats: number;
  vegetation: number;
  vitality: number;
  agriculture: number;
  electric: number;
  civLight: number;
  smog: number;
  fiber: number;
  datacenters: number;
  lattice: number;
  humanLights: number;
  mercury: number;
  dyson: number;
}

export function worldAt(T: number): WorldState {
  const s = {} as WorldState;
  s.T = T;
  for (const k in WORLD_TRACKS) (s as unknown as Record<string, number>)[k] = sampleTrack(WORLD_TRACKS[k]!, T);
  s.ice = Math.min(1, s.ice + quaternaryIce(T));
  return s;
}
