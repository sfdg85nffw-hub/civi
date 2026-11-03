import * as THREE from 'three/webgpu';
import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { Rig, ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine, easeInOutCubic, lerp } from '../core/math';
import { SUN_POS, galaxyCenter } from '../galaxy/universe';

/**
 * Logarithmic dolly between two framings: distance interpolates in log space,
 * so a pull-back from one galaxy to the Local Group feels like constant speed.
 */
export function zoomRig(o: { t0: [number, number, number]; t1: [number, number, number]; d0: number; d1: number; dir0: [number, number, number]; dir1: [number, number, number]; fov?: number; fovTo?: number; ease?: (u: number) => number }): Rig {
  const ease = o.ease ?? easeInOutCubic;
  return (u) => {
    const e = ease(Math.min(1, Math.max(0, u)));
    const tgt = new THREE.Vector3(...o.t0).lerp(new THREE.Vector3(...o.t1), e);
    const dir = new THREE.Vector3(...o.dir0).normalize().lerp(new THREE.Vector3(...o.dir1).normalize(), e).normalize();
    const d = Math.exp(lerp(Math.log(o.d0), Math.log(o.d1), e));
    return { pos: tgt.clone().addScaledVector(dir, d), target: tgt, fov: lerp(o.fov ?? 34, o.fovTo ?? o.fov ?? 34, e) };
  };
}

const m31 = galaxyCenter(3, 3e7);
const mid: [number, number, number] = [m31[0] * 0.5, m31[1] * 0.5, m31[2] * 0.5];
/** a direction perpendicular to the Milky Way–Andromeda line, raised a little */
const side: [number, number, number] = [0.825, 0.33, 0.565];

export const LOCAL_GROUP_VIEW = { mid, side };

export const expansion: ChapterDef = {
  meta: CHAPTERS[8]!,
  shots: [
    {
      // the ring of the swarm becomes the disk of the galaxy: same tilt, same screen size
      id: 'ex-disk', stage: 'galaxy', dur: 6, label: 'Ring to disk', signature: true,
      transition: { type: 'match', dur: 1.4 },
      rig: push({ from: [0, 23.4, 29.9], to: [-3.6, 10.5, 16.5], target: [0, 0, 0], targetTo: [SUN_POS[0], 0, SUN_POS[2]], fov: 32, fovTo: 34, ease: easeInOutSine }),
      params: { su: 0.75, territory: 1 },
    },
    {
      id: 'ex-bloom', stage: 'galaxy', dur: 7, label: 'Bloom', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ center: [-2, 0, 1.5], radius: 44, radiusTo: 36, elev: 1.02, elevTo: 0.9, az: 0.35, azTo: 0.62, fov: 34, ease: easeInOutSine }),
      params: { su: 0.7 },
    },
    {
      id: 'ex-neighbours', stage: 'galaxy', dur: 8, label: 'Neighbours', signature: true,
      transition: { type: 'dissolve', dur: 1.0 },
      rig: zoomRig({ t0: [0, 0, 0], t1: mid, d0: 70, d1: 1350, dir0: [-0.3, 0.75, 0.6], dir1: side, fov: 36, fovTo: 40 }),
      params: { su: 0.8, starGain: 1.2 },
    },
    {
      id: 'ex-quiet', stage: 'galaxy', dur: 4, label: 'Quiet',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: zoomRig({ t0: mid, t1: mid, d0: 1350, d1: 1250, dir0: side, dir1: [0.8, 0.38, 0.6], fov: 40, ease: (u) => u }),
      params: { su: 0.5, starGain: 1.2 },
    },
  ],
};

/** agent view while time is slow during the expansion: hover near the front around the Sun */
export const expansionAgentShot: ShotDef = {
  id: 'ex-agents', stage: 'galaxy', dur: 20, label: 'Probes',
  rig: orbit({ center: [SUN_POS[0], 0, SUN_POS[2]], radius: 9, radiusTo: 7, elev: 0.7, az: 0.2, azTo: 0.5, fov: 36, ease: easeInOutSine }),
};
