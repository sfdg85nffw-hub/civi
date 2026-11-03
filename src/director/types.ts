import * as THREE from 'three/webgpu';
import type { FrameContext } from '../app/frame';

export interface CamPose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  roll?: number;
  /** focus distance for DOF / bokeh particles */
  focus?: number;
  /** 0..1 aperture (bokeh strength) */
  aperture?: number;
}

export type TransitionType = 'cut' | 'dissolve' | 'match' | 'dive' | 'fade' | 'blend';

export interface Transition {
  type: TransitionType;
  dur: number;
}

export interface ShotRuntime {
  def: ShotDef;
  /** 0..1 progress (may exceed 1 while used as an outgoing transition source) */
  u: number;
  /** seconds into the shot */
  t: number;
  dur: number;
}

export type Rig = (u: number, f: FrameContext, shot: ShotRuntime) => CamPose;

export interface ShotDef {
  id: string;
  stage: string;
  /** Odyssey duration (seconds). For the Contest these are scaled to fit. */
  dur: number;
  rig: Rig;
  transition?: Transition;
  /** stage-specific parameters (e.g. focus lat/lon, layer toggles) */
  params?: Record<string, number | string | boolean>;
  signature?: boolean;
  /** human label for screenshots / docs */
  label?: string;
}

export function pose(pos: [number, number, number], target: [number, number, number], fov = 40, extra: Partial<CamPose> = {}): CamPose {
  return { pos: new THREE.Vector3(...pos), target: new THREE.Vector3(...target), fov, ...extra };
}
