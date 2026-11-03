import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine, easeOutCubic } from '../core/math';
import { MICROBE_FATE } from '../sim/agents/microbes';

export const microbial: ChapterDef = {
  meta: CHAPTERS[1]!,
  sim: { id: 'microbes', fate: MICROBE_FATE },
  agentShot: {
    id: 'm-mat-manual', stage: 'micro', dur: 14, label: 'The mat (manual)',
    transition: { type: 'dive', dur: 1.4 },
    rig: push({ from: [0.1, 0.8, 0.3], to: [-0.1, 0.62, 0.18], target: [0.05, 0, 0], targetTo: [-0.05, 0, 0], fov: 33, ease: easeInOutSine }),
  },
  shots: [
    {
      id: 'm-young', stage: 'planet', dur: 4.5, label: 'The young Earth (match cut)',
      transition: { type: 'match', dur: 1.2 },
      rig: push({ from: [0, 0, 7.66], to: [0.35, 0.12, 4.3], target: [0, 0, 0], targetTo: [0.12, 0.05, 0], fov: 30, fovTo: 30, ease: easeOutCubic }),
      params: { lat: 12, lon: -40, spin: 14, sunAz: 105, sunEl: 8, moon: 1 },
    },
    {
      id: 'm-mat', stage: 'micro', dur: 11, label: 'The mat', signature: true,
      transition: { type: 'dive', dur: 1.6 },
      rig: push({ from: [0.06, 0.5, 0.34], to: [-0.05, 0.36, 0.22], target: [0.04, 0, 0.0], targetTo: [-0.04, 0, -0.02], fov: 34, fovTo: 32, ease: easeInOutSine, focus: 0.5, focusTo: 0.36, aperture: 0.25 }),
    },
    {
      id: 'm-goe', stage: 'planet', dur: 6, label: 'The Great Oxidation (orbital time-lapse)', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 3.25, radiusTo: 3.05, elev: 0.18, elevTo: 0.1, az: -0.45, azTo: 0.15, fov: 34, ease: easeInOutSine }),
      params: { lat: 18, lon: 10, spin: 70, sunAz: 62, sunEl: 10 },
    },
    {
      id: 'm-snowball', stage: 'planet', dur: 3.5, label: 'Snowball', signature: true,
      transition: { type: 'blend', dur: 1.5 },
      rig: orbit({ radius: 3.0, radiusTo: 3.4, elev: 0.25, elevTo: 0.35, az: 0.15, azTo: 0.4, fov: 34, ease: easeInOutSine }),
      params: { lat: 30, lon: 60, spin: 40, sunAz: 50, sunEl: 20 },
    },
  ],
};
