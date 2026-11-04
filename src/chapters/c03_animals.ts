import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine, easeOutCubic } from '../core/math';
import { ECO_FATE } from '../sim/agents/ecosystem';

const life: ShotDef = {
  id: 'a-life', stage: 'land', dur: 5.5, label: 'The living land', signature: true,
  transition: { type: 'dive', dur: 1.3 },
  rig: push({ from: [-1.6, 2.4, 3.0], to: [-0.4, 1.7, 2.1], target: [0.2, 0.05, -0.3], targetTo: [0.4, 0.0, -0.6], fov: 38, ease: easeInOutSine, shake: 0.01 }),
  params: { su: 0.6 },
};

export const animals: ChapterDef = {
  meta: CHAPTERS[3]!,
  sim: { id: 'ecosystem', fate: ECO_FATE },
  agentShot: { ...life, id: 'a-life-manual', dur: 14 },
  cues: [{ T: -2.52e8, id: 'glass' }],
  shots: [
    {
      id: 'a-greening', stage: 'planet', dur: 7, label: 'Greening and drift',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: orbit({ radius: 4.6, radiusTo: 4.1, elev: 0.18, elevTo: 0.1, az: -0.2, azTo: 0.15, fov: 34, ease: easeInOutSine, targetOffset: [0.45, 0, 0] }),
      params: { lat: 5, lon: 15, spin: 50, sunAz: 100, sunEl: 20, stars: 0.12, su: 0.7 },
    },
    life,
    {
      id: 'a-dying', stage: 'planet', dur: 3, label: 'The Great Dying',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: orbit({ radius: 3.4, radiusTo: 3.1, elev: 0.25, az: 0.1, azTo: -0.05, fov: 32, ease: easeInOutSine, targetOffset: [-0.35, 0.1, 0] }),
      params: { focusTraps: 1, dLat: -8, dLon: 18, spin: 8, sunAz: 158, sunEl: 15, stars: 0.18, su: 0.55 },
    },
    {
      id: 'a-drift', stage: 'planet', dur: 5, label: 'Drift', signature: true,
      transition: { type: 'dissolve', dur: 1.0 },
      rig: orbit({ radius: 4.4, radiusTo: 4.2, elev: 0.12, az: 0.2, azTo: -0.1, fov: 34, ease: easeInOutSine, targetOffset: [-0.45, 0, 0] }),
      params: { lat: 0, lon: -10, spin: 40, sunAz: 64, sunEl: 30, stars: 0.12, su: 0.6 },
    },
    {
      id: 'a-chicxulub', stage: 'planet', dur: 6, label: 'Chicxulub', signature: true,
      transition: { type: 'dissolve', dur: 0.8 },
      rig: push({ from: [0.0, 0.25, 3.2], to: [0.05, 0.12, 2.55], target: [-0.25, 0.15, 0], targetTo: [-0.15, 0.08, 0], fov: 34, ease: easeOutCubic }),
      params: { impact: 1, focusImpact: 1, dLat: 6, dLon: 28, spin: 4, sunAz: 112, sunEl: 12, stars: 0.15, su: 0.42 },
    },
    {
      id: 'a-recovery', stage: 'planet', dur: 3.5, label: 'The mammals inherit',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 4.3, radiusTo: 4.6, elev: 0.15, az: -0.15, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [0.4, 0, 0] }),
      params: { lat: 15, lon: 30, spin: 30, sunAz: 128, sunEl: 16, stars: 0.12, su: 0.7 },
    },
  ],
};
