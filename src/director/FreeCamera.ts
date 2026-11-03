import * as THREE from 'three/webgpu';
import type { CamPose } from './types';

/** C: free camera — drag to orbit the current target, wheel to dolly, shift-drag to pan. */
export class FreeCamera {
  enabled = false;
  private yaw = 0;
  private pitch = 0;
  private dist = 1;
  private target = new THREE.Vector3();
  private fov = 40;
  private initialised = false;
  private dragging = false;
  private panMode = false;
  private lx = 0;
  private ly = 0;

  constructor(el: HTMLElement) {
    el.addEventListener('pointerdown', (e) => {
      if (!this.enabled) return;
      this.dragging = true;
      this.panMode = e.shiftKey || e.button === 2;
      this.lx = e.clientX;
      this.ly = e.clientY;
    });
    window.addEventListener('pointermove', (e) => {
      if (!this.enabled || !this.dragging) return;
      const dx = e.clientX - this.lx;
      const dy = e.clientY - this.ly;
      this.lx = e.clientX;
      this.ly = e.clientY;
      if (this.panMode) {
        const s = this.dist * 0.0015;
        const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
        this.target.addScaledVector(right, -dx * s);
        this.target.y += dy * s;
      } else {
        this.yaw -= dx * 0.005;
        this.pitch = Math.max(-1.5, Math.min(1.5, this.pitch + dy * 0.005));
      }
    });
    window.addEventListener('pointerup', () => (this.dragging = false));
    el.addEventListener(
      'wheel',
      (e) => {
        if (!this.enabled) return;
        e.preventDefault();
        this.dist *= Math.exp(e.deltaY * 0.0012);
      },
      { passive: false },
    );
    el.addEventListener('contextmenu', (e) => this.enabled && e.preventDefault());
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    this.initialised = false;
    return this.enabled;
  }

  apply(base: CamPose): CamPose {
    if (!this.initialised) {
      this.target.copy(base.target);
      const d = base.pos.clone().sub(base.target);
      this.dist = d.length();
      this.yaw = Math.atan2(d.x, d.z);
      this.pitch = Math.asin(Math.max(-1, Math.min(1, d.y / Math.max(1e-6, this.dist))));
      this.fov = base.fov;
      this.initialised = true;
    }
    const pos = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    )
      .multiplyScalar(this.dist)
      .add(this.target);
    return { ...base, pos, target: this.target.clone(), fov: this.fov };
  }
}
