import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { BAND_FATE } from '../sim/agents/bands';

export const hominins: ChapterDef = {
  meta: CHAPTERS[4]!,
  sim: { id: 'bands', fate: BAND_FATE },
  cues: [{ T: -7.0e4, id: 'glass' }],
  shots: [
    {
      id: 'h-africa', stage: 'planet', dur: 5, label: 'Africa, the ice ages breathing',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: orbit({ radius: 3.2, radiusTo: 2.9, elev: 0.08, az: -0.15, azTo: 0.05, fov: 32, ease: easeInOutSine, targetOffset: [-0.15, 0.05, 0] }),
      params: { moonlight: 0.075, lat: 8, lon: 22, spin: 10, sunAz: -142, sunEl: 12, stars: 0.18, su: 0.6 },
    },
    {
      id: 'h-fire', stage: 'fire', dur: 5, label: 'The first flame', signature: true,
      transition: { type: 'fade', dur: 1.2 },
      rig: push({ from: [0.0, 0.42, 2.1], to: [0.0, 0.34, 1.35], target: [0, 0.32, 0], targetTo: [0, 0.36, 0], fov: 34, ease: easeInOutSine, shake: 0.004, focus: 2.0, focusTo: 1.3, aperture: 0.35 }),
      params: { su: 0.85 },
    },
    {
      id: 'h-ooa', stage: 'planet', dur: 6, label: 'Out of Africa', signature: true,
      transition: { type: 'fade', dur: 1.2 },
      rig: orbit({ radius: 5.6, radiusTo: 5.1, elev: 0.12, elevTo: 0.08, az: 0.0, azTo: 0.1, fov: 32, ease: easeInOutSine, targetOffset: [-1.05, 0.05, 0] }),
      params: { moonlight: 0.075, lat: 28, lon: 55, spin: 24, sunAz: -152, sunEl: 10, stars: 0.2, su: 0.75 },
    },
    {
      id: 'h-hands', stage: 'cave', dur: 4, label: 'Handprints', signature: true,
      transition: { type: 'fade', dur: 1.0 },
      rig: push({ from: [0.35, -0.1, 1.55], to: [0.1, -0.02, 1.2], target: [0.04, 0.0, 0], targetTo: [0.0, 0.02, 0], fov: 38, ease: easeInOutSine, shake: 0.003, focus: 1.5, focusTo: 1.2, aperture: 0.2 }),
      params: { su: 0.9 },
    },
  ],
};
