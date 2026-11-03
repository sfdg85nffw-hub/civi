import * as THREE from 'three/webgpu';
import type { FrameContext } from '../../app/frame';
import type { CamPose, ShotRuntime } from '../../director/types';

/**
 * A Stage is a self-contained scene with its own camera. The Director chooses
 * which stage(s) are rendered; during transitions two stages render at once.
 */
export abstract class Stage {
  abstract readonly name: string;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.01, 1000);
  built = false;
  /** last frame this stage was updated (to detect fresh activation) */
  lastFrame = -10;
  /** per-stage post settings (bloom strength / threshold, exposure) */
  private projNear = -1;
  private projFar = -1;
  post = { bloom: 0.6, threshold: 0.0, exposure: 1.0, grain: 0.035, vignette: 0.32, chroma: 0.0025 };

  /** Build geometry/materials. Called lazily before first use (and for pre-warm). */
  abstract build(): void;

  /** Per-frame update while visible. */
  abstract update(f: FrameContext, shot: ShotRuntime): void;

  ensureBuilt(): void {
    if (!this.built) {
      this.build();
      this.built = true;
    }
  }

  applyPose(p: CamPose, aspect: number): void {
    const c = this.camera;
    c.position.copy(p.pos);
    c.up.set(0, 1, 0);
    c.lookAt(p.target);
    if (p.roll) c.rotateZ(p.roll);
    if (c.fov !== p.fov || c.aspect !== aspect || c.near !== this.projNear || c.far !== this.projFar) {
      c.fov = p.fov;
      c.aspect = aspect;
      c.updateProjectionMatrix();
      this.projNear = c.near;
      this.projFar = c.far;
    }
  }
}
