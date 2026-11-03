import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { CITY_FATE } from '../sim/agents/cities';

const ignite: ShotDef = {
  id: 'mo-ignite', stage: 'planet', dur: 8.5, label: 'Ignition', signature: true,
  transition: { type: 'blend', dur: 1.8 },
  rig: orbit({ radius: 2.9, radiusTo: 2.6, elev: 0.2, az: -0.12, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [0.0, 0.15, 0] }),
  params: { lat: 45, lon: -25, spin: 50, sunAz: 165, sunEl: 10, stars: 0.18, su: 0.8 },
};

export const modern: ChapterDef = {
  meta: CHAPTERS[6]!,
  sim: { id: 'cities', fate: CITY_FATE },
  agentShot: { ...ignite, id: 'mo-ignite-manual', dur: 16 },
  shots: [
    {
      id: 'mo-sail', stage: 'planet', dur: 4, label: 'Sail',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 3.1, radiusTo: 2.9, elev: 0.15, az: 0.05, azTo: -0.08, fov: 34, ease: easeInOutSine, targetOffset: [0.0, 0.1, 0] }),
      params: { lat: 22, lon: -38, spin: 14, sunAz: -150, sunEl: 12, stars: 0.16, su: 0.6 },
    },
    ignite,
    {
      id: 'mo-flash', stage: 'planet', dur: 4.5, label: 'Flash',
      transition: { type: 'blend', dur: 1.5 },
      rig: orbit({ radius: 2.6, radiusTo: 2.45, elev: 0.2, az: 0.0, azTo: 0.05, fov: 32, ease: easeInOutSine, targetOffset: [0.0, 0.1, 0] }),
      params: { lat: 36, lon: -102, spin: 6, sunAz: 158, sunEl: 10, stars: 0.18, su: 0.73 },
    },
    {
      id: 'mo-mote', stage: 'planet', dur: 3.5, label: 'The mote', signature: true,
      transition: { type: 'dissolve', dur: 1.0 },
      rig: push({ from: [0.6, 0.55, 2.6], to: [0.75, 0.62, 2.35], target: [0.35, 0.5, 0], targetTo: [0.45, 0.55, 0], fov: 32, ease: easeInOutSine }),
      params: { lat: 20, lon: -95, spin: 3, sunAz: 105, sunEl: 15, stars: 0.12, su: 0.83 },
    },
    {
      id: 'mo-mesh', stage: 'planet', dur: 4.5, label: 'The mesh', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 3.3, radiusTo: 3.0, elev: 0.25, az: -0.05, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [0.0, 0.1, 0] }),
      params: { lat: 30, lon: 20, spin: 40, sunAz: 170, sunEl: 8, stars: 0.16, su: 0.8 },
    },
  ],
};
