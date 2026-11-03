import * as THREE from 'three/webgpu';
import { noise1 } from '../core/noise';
import { easeInOutSine, lerp } from '../core/math';
import type { CamPose, Rig } from './types';

type V3 = [number, number, number];
const v = (a: V3): THREE.Vector3 => new THREE.Vector3(a[0], a[1], a[2]);

/** Subtle procedural handheld drift (smooth, low frequency). */
export function handheld(t: number, amp: number, seed = 0): THREE.Vector3 {
  return new THREE.Vector3(
    noise1(t * 0.23, seed + 1) * amp,
    noise1(t * 0.19, seed + 2) * amp * 0.7,
    noise1(t * 0.17, seed + 3) * amp * 0.5,
  );
}

export interface PushOpts {
  from: V3;
  to: V3;
  target: V3;
  targetTo?: V3;
  fov?: number;
  fovTo?: number;
  ease?: (u: number) => number;
  shake?: number;
  focus?: number;
  focusTo?: number;
  aperture?: number;
  roll?: number;
  rollTo?: number;
}

/** Slow push-in (or any linear dolly) with easing and optional rack focus. */
export function push(o: PushOpts): Rig {
  const ease = o.ease ?? easeInOutSine;
  return (u, f) => {
    const e = ease(Math.min(Math.max(u, 0), 1.25));
    const pos = v(o.from).lerp(v(o.to), e);
    const target = v(o.target).lerp(v(o.targetTo ?? o.target), e);
    if (o.shake) pos.add(handheld(f.time, o.shake));
    const p: CamPose = { pos, target, fov: lerp(o.fov ?? 40, o.fovTo ?? o.fov ?? 40, e) };
    if (o.focus !== undefined) p.focus = lerp(o.focus, o.focusTo ?? o.focus, e);
    if (o.aperture !== undefined) p.aperture = o.aperture;
    if (o.roll !== undefined) p.roll = lerp(o.roll, o.rollTo ?? o.roll, e);
    return p;
  };
}

export interface OrbitOpts {
  center?: V3;
  radius: number;
  radiusTo?: number;
  elev: number; // radians
  elevTo?: number;
  az: number; // radians
  azTo: number;
  fov?: number;
  fovTo?: number;
  targetOffset?: V3;
  ease?: (u: number) => number;
  shake?: number;
}

/** Orbital drift around a centre. */
export function orbit(o: OrbitOpts): Rig {
  const ease = o.ease ?? ((u: number) => u);
  return (u, f) => {
    const e = ease(u);
    const r = lerp(o.radius, o.radiusTo ?? o.radius, e);
    const el = lerp(o.elev, o.elevTo ?? o.elev, e);
    const az = lerp(o.az, o.azTo, e);
    const c = v(o.center ?? [0, 0, 0]);
    const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(r).add(c);
    if (o.shake) pos.add(handheld(f.time, o.shake));
    const target = c.clone().add(v(o.targetOffset ?? [0, 0, 0]));
    return { pos, target, fov: lerp(o.fov ?? 35, o.fovTo ?? o.fov ?? 35, e) };
  };
}

/** A long hold with breathing drift. */
export function hold(pos: V3, target: V3, fov = 40, drift = 0.02, extra: Partial<CamPose> = {}): Rig {
  return (_u, f) => ({ pos: v(pos).add(handheld(f.time, drift)), target: v(target), fov, ...extra });
}

/** Blend two poses (used for same-stage transitions). */
export function blendPose(a: CamPose, b: CamPose, t: number): CamPose {
  const e = easeInOutSine(t);
  const out: CamPose = {
    pos: a.pos.clone().lerp(b.pos, e),
    target: a.target.clone().lerp(b.target, e),
    fov: lerp(a.fov, b.fov, e),
    roll: lerp(a.roll ?? 0, b.roll ?? 0, e),
  };
  if (a.focus !== undefined || b.focus !== undefined) out.focus = lerp(a.focus ?? b.focus!, b.focus ?? a.focus!, e);
  if (a.aperture !== undefined || b.aperture !== undefined) out.aperture = lerp(a.aperture ?? 0, b.aperture ?? 0, e);
  return out;
}
