import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { POLITY_FATE } from '../sim/agents/polities';

const empires: ShotDef = {
  id: 'an-empires', stage: 'planet', dur: 9, label: 'Empires breathe', signature: true,
  transition: { type: 'blend', dur: 2.0 },
  rig: push({ from: [0.12, -0.42, 1.62], to: [0.02, -0.36, 1.5], target: [0.0, 0.22, 0.95], targetTo: [0.0, 0.24, 0.94], fov: 40, fovTo: 38, ease: easeInOutSine, roll: 0.06, rollTo: 0.03 }),
  params: { moonlight: 0.16, lat: 39, lon: 20, spin: 8, sunAz: -152, sunEl: 12, stars: 0.16, su: 0.7 },
};

export const ancient: ChapterDef = {
  meta: CHAPTERS[5]!,
  sim: { id: 'polities', fate: POLITY_FATE },
  agentShot: { ...empires, id: 'an-empires-manual', dur: 16 },
  cues: [{ T: 476 - 2026, id: 'glass' }],
  shots: [
    {
      id: 'an-agri', stage: 'planet', dur: 4, label: 'Seeds',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 2.8, radiusTo: 2.55, elev: 0.15, az: 0.1, azTo: -0.05, fov: 32, ease: easeInOutSine, targetOffset: [0.2, 0.1, 0] }),
      params: { lat: 33, lon: 42, spin: 6, sunAz: -78, sunEl: 26, stars: 0.12, su: 0.6 },
    },
    {
      id: 'an-cradles', stage: 'planet', dur: 8, label: 'The cradles ignite',
      transition: { type: 'blend', dur: 1.5 },
      rig: orbit({ radius: 3.0, radiusTo: 2.8, elev: 0.18, az: -0.1, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [0.0, 0.15, 0] }),
      params: { moonlight: 0.16, lat: 28, lon: 70, spin: 60, sunAz: -158, sunEl: 10, stars: 0.18, su: 0.75 },
    },
    empires,
    {
      id: 'an-threads', stage: 'planet', dur: 5.5, label: 'Threads', signature: true,
      transition: { type: 'blend', dur: 1.6 },
      rig: push({ from: [-1.05, 0.12, 1.25], to: [-0.95, 0.16, 1.2], target: [0.45, 0.3, 0.75], targetTo: [0.5, 0.32, 0.72], fov: 38, ease: easeInOutSine, roll: -0.1, rollTo: -0.08 }),
      params: { moonlight: 0.16, lat: 30, lon: 72, spin: 14, sunAz: -165, sunEl: 8, stars: 0.18, su: 0.6 },
    },
    {
      id: 'an-plague', stage: 'planet', dur: 3.5, label: 'The plague', signature: true,
      transition: { type: 'blend', dur: 1.2 },
      rig: push({ from: [0.0, 0.05, 1.82], to: [0.0, 0.03, 1.7], target: [0.0, 0.02, 0.98], fov: 34, fovTo: 32, ease: easeInOutSine }),
      params: { moonlight: 0.16, lat: 44, lon: 14, spin: 5, sunAz: -160, sunEl: 10, stars: 0.16, su: 0.32 },
    },
  ],
};
