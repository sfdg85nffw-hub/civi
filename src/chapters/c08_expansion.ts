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

/**
 * Over the Milky Way's shoulder toward Andromeda: our galaxy large in the
 * foreground, the destination small and far — the Local Group with depth.
 */
export function shoulderRig(o: { T: number; back: number; backTo?: number; up: number; upTo?: number; side: number; sideTo?: number; look: number; fov?: number; fovTo?: number }): Rig {
  return (u) => {
    const e = easeInOutSine(Math.min(1, Math.max(0, u)));
    const c = galaxyCenter(3, o.T);
    const d = new THREE.Vector3(c[0], c[1], c[2]);
    const L = d.length();
    d.normalize();
    const sideV = new THREE.Vector3().crossVectors(d, new THREE.Vector3(0, 1, 0)).normalize();
    const back = lerp(o.back, o.backTo ?? o.back, e);
    const side = lerp(o.side, o.sideTo ?? o.side, e);
    const up = lerp(o.up, o.upTo ?? o.up, e);
    const pos = d.clone().multiplyScalar(-back).addScaledVector(sideV, side).add(new THREE.Vector3(0, up, 0));
    const target = d.clone().multiplyScalar(L * o.look);
    return { pos, target, fov: lerp(o.fov ?? 40, o.fovTo ?? o.fov ?? 40, e) };
  };
}

const m31 = galaxyCenter(3, 3e7);
const mid: [number, number, number] = [m31[0] * 0.5, m31[1] * 0.5, m31[2] * 0.5];
/** a direction perpendicular to the Milky Way–Andromeda line, raised a little */
const side: [number, number, number] = [0.825, 0.33, 0.565];

export const LOCAL_GROUP_VIEW = { mid, side };

/** agent view while time is slow during the expansion: hover near the front around the Sun */
export const expansionAgentShot: ShotDef = {
  id: 'ex-agents', stage: 'galaxy', dur: 20, label: 'Probes',
  rig: orbit({ center: [SUN_POS[0], 0, SUN_POS[2]], radius: 9, radiusTo: 7, elev: 0.7, az: 0.2, azTo: 0.5, fov: 36, ease: easeInOutSine }),
};

export const expansion: ChapterDef = {
  meta: CHAPTERS[8]!,
  agentShot: expansionAgentShot,
  shots: [
    {
      // the ring of the swarm becomes the disk of the galaxy: same tilt, same screen size
      id: 'ex-disk', stage: 'galaxy', dur: 6, label: 'Ring to disk', signature: true,
      transition: { type: 'match', dur: 1.4 },
      rig: push({ from: [0, 23.4, 29.9], to: [-3.6, 10.5, 16.5], target: [0, 0, 0], targetTo: [SUN_POS[0], 0, SUN_POS[2]], fov: 32, fovTo: 34, ease: easeInOutSine }),
      params: { su: 0.12, territory: 1 },
    },
    {
      id: 'ex-bloom', stage: 'galaxy', dur: 7, label: 'Bloom', signature: true,
      transition: { type: 'dissolve', dur: 1.2 },
      rig: orbit({ center: [-2, 0, 1.5], radius: 44, radiusTo: 36, elev: 1.02, elevTo: 0.9, az: 0.35, azTo: 0.62, fov: 34, ease: easeInOutSine }),
      params: { su: 0.45 },
    },
    {
      id: 'ex-neighbours', stage: 'galaxy', dur: 8, label: 'Neighbours', signature: true,
      transition: { type: 'dissolve', dur: 1.0 },
      rig: shoulderRig({ T: 1e7, back: 30, backTo: 62, up: 26, upTo: 44, side: 8, sideTo: 24, look: 0.06, fov: 40, fovTo: 48 }),
      params: { su: 0.8 },
    },
    {
      id: 'ex-quiet', stage: 'galaxy', dur: 4, label: 'Quiet',
      transition: { type: 'dissolve', dur: 1.0 },
      rig: shoulderRig({ T: 5e8, back: 64, backTo: 70, up: 44, upTo: 46, side: 25, sideTo: 30, look: 0.065, fov: 48 }),
      params: { su: 0.5 },
    },
  ],
};

