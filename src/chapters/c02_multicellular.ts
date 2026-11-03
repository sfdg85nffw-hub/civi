import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';

export const multicellular: ChapterDef = {
  meta: CHAPTERS[2]!,
  shots: [
    {
      id: 'mc-endo', stage: 'cell', dur: 6, label: 'Endosymbiosis', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: push({ from: [1.2, 0.6, 3.6], to: [0.75, 0.35, 2.45], target: [0.35, 0.12, 0.2], targetTo: [0.38, 0.15, 0.25], fov: 34, ease: easeInOutSine }),
      params: { su: 0.88 },
    },
    {
      id: 'mc-snowball', stage: 'planet', dur: 19, label: 'The second Snowball',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 3.4, radiusTo: 3.2, elev: 0.2, az: 0.0, azTo: 0.3, fov: 34, ease: easeInOutSine }),
      params: { lat: 10, lon: 40, spin: 50, sunAz: 90, sunEl: 15, stars: 0.12 },
    },
  ],
};
