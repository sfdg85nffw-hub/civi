import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { COLONY_FATE } from '../sim/agents/microbes';
import { CREATURE_FATE } from '../sim/agents/creatures';

const colonies: ShotDef = {
  id: 'mc-colonies', stage: 'micro', dur: 7, label: 'Colonies', signature: true,
  transition: { type: 'dive', dur: 1.4 },
  rig: push({ from: [0.06, 0.46, 0.06], to: [-0.03, 0.34, 0.035], target: [0.05, 0, 0], targetTo: [-0.03, 0, -0.01], fov: 33, ease: easeInOutSine, roll: 0.1, rollTo: -0.05, focus: 0.38, focusTo: 0.27, aperture: 0.35 }),
  params: { su: 0.6, colonies: 1 },
};
const cambrian: ShotDef = {
  id: 'mc-cambrian', stage: 'seafloor', dur: 5.5, label: 'The Cambrian seafloor', signature: true,
  transition: { type: 'dissolve', dur: 1.0 },
  rig: push({ from: [-1.1, 1.45, 2.5], to: [-0.35, 1.15, 1.85], target: [0.15, 0.45, -0.8], targetTo: [0.3, 0.42, -1.1], fov: 42, ease: easeInOutSine, shake: 0.01 }),
  params: { su: 0.6, focus: 2.2, aperture: 0.5 },
};

export const multicellular: ChapterDef = {
  meta: CHAPTERS[2]!,
  sim: (T) => (T < -6.5e8 ? { id: 'microbes', fate: COLONY_FATE } : { id: 'creatures', fate: CREATURE_FATE }),
  agentShot: (T) => (T < -6.5e8 ? { ...colonies, id: 'mc-colonies-manual', dur: 14 } : { ...cambrian, id: 'mc-cambrian-manual', dur: 14 }),
  cues: [{ T: -5.388e8, id: 'glass' }],
  shots: [
    {
      id: 'mc-endo', stage: 'cell', dur: 6, label: 'Endosymbiosis', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: push({ from: [1.2, 0.6, 3.6], to: [0.75, 0.35, 2.45], target: [0.35, 0.12, 0.2], targetTo: [0.38, 0.15, 0.25], fov: 34, ease: easeInOutSine }),
      params: { su: 0.88 },
    },
    colonies,
    {
      id: 'mc-snowball', stage: 'planet', dur: 3.5, label: 'The second Snowball',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: orbit({ radius: 4.8, radiusTo: 4.5, elev: 0.2, az: 0.0, azTo: 0.25, fov: 34, ease: easeInOutSine, targetOffset: [0.5, 0, 0] }),
      params: { lat: 10, lon: 40, spin: 40, sunAz: 92, sunEl: 26, stars: 0.12, su: 0.5 },
    },
    {
      id: 'mc-ediacara', stage: 'seafloor', dur: 3, label: 'Ediacara',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: push({ from: [0.8, 0.55, 2.6], to: [0.5, 0.45, 2.0], target: [0, 0.35, -0.8], targetTo: [-0.1, 0.32, -1.0], fov: 36, ease: easeInOutSine, shake: 0.008 }),
      params: { focus: 2.2, aperture: 0.7 },
    },
    cambrian,
  ],
};
