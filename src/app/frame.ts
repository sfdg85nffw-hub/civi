import type * as THREE from 'three/webgpu';
import type { ChapterId } from '../chapters/meta';
import type { WorldState } from '../fate/world';
import type { QualitySettings } from '../render/Renderer';

/** Everything a stage needs to draw one frame. Render-agnostic data only. */
export interface FrameContext {
  /** sim time, years relative to 2026 CE */
  T: number;
  /** years per real second */
  speed: number;
  storyTime: number;
  /** real seconds since previous frame (virtual in capture mode) */
  dt: number;
  /** real seconds since Begin (virtual in capture mode) */
  time: number;
  chapter: ChapterId;
  /** 0..1 progress through the current chapter (story time) */
  chapterU: number;
  mode: 'odyssey' | 'manual';
  world: WorldState;
  /** 0 = field, 1 = agents */
  lodMix: number;
  quality: QualitySettings;
  reducedFlash: boolean;
  /** spark colour, linear RGB */
  spark: THREE.Color;
  seed: number;
  /** true during the very first frames after a stage becomes visible */
  freshStage: boolean;
}

/** Peak-limited flash for photosensitive viewers. */
export function flashLimit(f: FrameContext, v: number): number {
  return f.reducedFlash ? Math.min(v, 0.18) * 0.6 : v;
}
