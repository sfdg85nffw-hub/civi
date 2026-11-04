import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine, easeOutCubic } from '../core/math';
import { MICROBE_FATE } from '../sim/agents/microbes';

export const microbial: ChapterDef = {
  meta: CHAPTERS[1]!,
  sim: { id: 'microbes', fate: MICROBE_FATE },
  cues: [{ T: -2.4e9, id: 'goe' }],
  agentShot: {
    id: 'm-mat-manual', stage: 'micro', dur: 14, label: 'The mat (manual)',
    transition: { type: 'dive', dur: 1.4 },
    rig: push({ from: [0.06, 0.48, 0.06], to: [-0.06, 0.4, 0.04], target: [0.06, 0, 0], targetTo: [-0.06, 0, 0], fov: 33, ease: easeInOutSine }),
  },
  shots: [
    {
      id: 'm-young', stage: 'planet', dur: 4.5, label: 'The young Earth (match cut)',
      transition: { type: 'match', dur: 1.2 },
      rig: push({ from: [0, 0, 7.66], to: [0.35, 0.12, 4.3], target: [-1.25, 0.2, 0], targetTo: [-0.3, 0.05, 0], fov: 30, fovTo: 30, ease: easeOutCubic }),
      params: { lat: 12, lon: -40, spin: 14, sunAz: 128, sunEl: 18, moon: 1, su: 0.75, moonX: -4.6, moonY: 1.9, moonZ: -10.5 },
    },
    {
      id: 'm-mat', stage: 'micro', dur: 11, label: 'The mat', signature: true, params: { su: 0.45 },
      transition: { type: 'dive', dur: 1.6 },
      rig: push({ from: [0.05, 0.5, 0.07], to: [-0.04, 0.36, 0.035], target: [0.05, 0, 0.0], targetTo: [-0.04, 0, -0.01], fov: 34, fovTo: 32, ease: easeInOutSine, roll: 0.0, rollTo: 0.12, focus: 0.5, focusTo: 0.36, aperture: 0.3 }),
    },
    {
      id: 'm-goe', stage: 'planet', dur: 6, label: 'The Great Oxidation (orbital time-lapse)', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 4.3, radiusTo: 3.9, elev: 0.16, elevTo: 0.1, az: -0.25, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [-0.45, 0, 0] }),
      params: { lat: 18, lon: 10, spin: 70, sunAz: -72, sunEl: 24, su: 0.93, stars: 0.12 },
    },
    {
      id: 'm-snowball', stage: 'planet', dur: 3.5, label: 'Snowball', signature: true,
      transition: { type: 'blend', dur: 1.5 },
      rig: orbit({ radius: 5.0, radiusTo: 5.4, elev: 0.25, elevTo: 0.32, az: 0.1, azTo: 0.3, fov: 34, ease: easeInOutSine, targetOffset: [0.55, 0, 0] }),
      params: { lat: 30, lon: 60, spin: 40, sunAz: -124, sunEl: 22, su: 0.5, stars: 0.1 },
    },
  ],
};
