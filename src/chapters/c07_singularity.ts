import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine, easeInOutCubic } from '../core/math';
import { LATTICE_FATE } from '../sim/agents/lattice';

/** The lattice crystallising across the night side, from the datacenters outward. */
const pattern: ShotDef = {
  id: 'si-pattern', stage: 'planet', dur: 7, label: 'The pattern', signature: true,
  transition: { type: 'blend', dur: 1.6 },
  rig: orbit({ radius: 2.75, radiusTo: 2.35, elev: 0.32, elevTo: 0.22, az: -0.18, azTo: 0.1, fov: 34, ease: easeInOutSine, targetOffset: [0.0, 0.18, 0] }),
  params: { moonlight: 0.07, lat: 32, lon: 22, spin: 30, sunAz: -168, sunEl: 9, stars: 0.16, su: 0.55 },
};

export const singularity: ChapterDef = {
  meta: CHAPTERS[7]!,
  sim: { id: 'lattice', fate: LATTICE_FATE },
  agentShot: { ...pattern, id: 'si-pattern-manual', dur: 18 },
  shots: [
    {
      id: 'si-datacenters', stage: 'planet', dur: 6, label: 'Cold lights',
      // a held black before "We built a mind." (docs/DRAMA.md)
      transition: { type: 'fade', dur: 4.6, hold: 2.6 },
      rig: orbit({ radius: 2.6, radiusTo: 2.45, elev: 0.22, az: 0.08, azTo: -0.04, fov: 32, ease: easeInOutSine, targetOffset: [-0.05, 0.15, 0] }),
      params: { moonlight: 0.075, lat: 40, lon: -88, spin: 10, sunAz: -160, sunEl: 10, stars: 0.16, su: 0.8 },
    },
    pattern,
    {
      // the last free lights flare where the crystal arrives, then go out
      id: 'si-resistance', stage: 'planet', dur: 5, label: 'Resistance',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ radius: 2.35, radiusTo: 2.2, elev: -0.1, elevTo: -0.16, az: 0.1, azTo: -0.05, fov: 32, ease: easeInOutSine, targetOffset: [0.0, -0.1, 0] }),
      params: { lat: -18, lon: 24, spin: 14, sunAz: -172, sunEl: -6, stars: 0.16, su: 0.3 },
    },
    {
      // low orbit over the South Atlantic: one warm point in a sea of cold crystal — and then not
      id: 'si-lastlight', stage: 'planet', dur: 7.3, label: 'The last light', signature: true,
      transition: { type: 'dissolve', dur: 1.4 },
      rig: push({ from: [0.0, -0.2, 2.3], to: [0.0, -0.3, 1.13], target: [0, 0.1, 0.8], targetTo: [0, 0.08, 1.0], fov: 36, fovTo: 32, ease: easeInOutCubic }),
      params: { lat: -37.07, lon: -12.31, spin: 0, sunAz: 178, sunEl: -14, stars: 0.12, su: 0.5 },
    },
    {
      // Mercury unmade; a swarm of mirrors closes around the Sun and ends as a ring (→ the galaxy)
      id: 'si-swarm', stage: 'solar', dur: 4.7, label: 'The swarm', signature: true,
      transition: { type: 'fade', dur: 1.0 },
      rig: push({ from: [1.5, 0.08, 0.75], to: [0.0, 3.0, 3.8], target: [0.55, 0.0, 0.18], targetTo: [0, 0, 0], fov: 36, fovTo: 32, ease: easeInOutSine }),
      params: { su: 0.36 },
    },
  ],
};
