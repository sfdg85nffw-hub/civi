import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { clamp01, smoothstep } from '../../core/math';

const { uniform, vec2, vec3, vec4, float, mix, smoothstep: sst, length, normalize, exp, abs, max, sin, cos, screenUV, viewportSharedTexture, select, Fn, texture, uv, dot } = T;

const NBH = 7;

export interface MontageSource {
  frames: { bmp: CanvasImageSource; s: number; chapter: number }[];
}

/**
 * The end of everything: dying stars, the victor's last structures huddled
 * around black holes (with gravitational lensing), the holes evaporating one by
 * one, a single point of computation, and inside it the viewer's own run,
 * backward and accelerating.
 */
export class CodaStage extends Stage {
  readonly name = 'coda';
  readonly u = {
    c: uniform(0),
    time: uniform(0),
    victor: uniform(new THREE.Color(1, 1, 1)),
    starLife: uniform(1),
    swarm: uniform(1),
    point: uniform(0),
    montage: uniform(0),
    reveal: uniform(0),
    aspect: uniform(16 / 9),
    vacuum: uniform(0),
  };
  /** per-BH: screen centre (uv), screen radius (uv), life 0..1 */
  private bhAttr!: THREE.InstancedBufferAttribute;
  private bhPos: THREE.Vector3[] = [];
  private bhDeath: number[] = [];
  private swarmLife!: THREE.InstancedBufferAttribute;
  private flashAttr!: THREE.InstancedBufferAttribute;
  private montageTex: THREE.CanvasTexture;
  private montageCanvas: HTMLCanvasElement;
  private montageCtx: CanvasRenderingContext2D | null;
  private montageQuad!: THREE.Mesh;
  source: MontageSource | null = null;
  private lastFrameIdx = -1;

  constructor() {
    super();
    this.montageCanvas = document.createElement('canvas');
    this.montageCanvas.width = 192;
    this.montageCanvas.height = 108;
    this.montageCtx = this.montageCanvas.getContext('2d');
    this.montageTex = new THREE.CanvasTexture(this.montageCanvas);
    this.montageTex.colorSpace = THREE.SRGBColorSpace;
  }

  build(): void {
    this.post = { bloom: 0.7, threshold: 0.3, exposure: 1.0, grain: 0.04, vignette: 0.45, chroma: 0.001 };
    this.camera.near = 0.005;
    this.camera.far = 400;
    this.scene.background = new THREE.Color(0, 0, 0);
    const rng = new Rng(0xc0da, 1);
    for (let i = 0; i < NBH; i++) {
      this.bhPos.push(new THREE.Vector3(rng.normal(0, 1.6), rng.normal(0, 0.5), rng.normal(0, 1.6)));
      // they evaporate one by one between c = 11.5 and 15; the last one is index 0
      this.bhDeath.push(i === 0 ? 15 : 11.5 + rng.next() * 3.2);
    }
    this.bhPos[0]!.set(0.15, 0.05, 0.2);
    this.scene.add(this.stars());
    this.scene.add(this.swarms());
    this.scene.add(this.holes());
    this.scene.add(this.lastPoint());
    this.scene.add(this.flashes());
    this.montageQuad = this.montage();
    this.camera.add(this.montageQuad);
    this.scene.add(this.camera);
  }

  private stars(): THREE.Object3D {
    const rng = new Rng(0x5a1, 3);
    const n = 30000;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rng.normal(), rng.normal() * 0.4, rng.normal()).multiplyScalar(rng.range(6, 60));
      a.set([v.x, v.y, v.z, rng.next()], i * 4);
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 1,
      softness: 2.5,
      build: (at) => {
        // blue to red to black, each star on its own schedule
        const life = u.starLife.mul(1.25).sub(at.a.w.mul(0.25));
        const k = clamp01Node(life);
        const col = mix(vec3(0.9, 0.18, 0.05), mix(vec3(1.0, 0.75, 0.5), vec3(0.65, 0.78, 1.0), sst(0.6, 1.0, k)), sst(0.0, 0.6, k));
        return { center: at.a.xyz, size: float(0.05).add(at.a.w.mul(0.05)), color: col.mul(k.pow(1.5)).mul(0.6).mul(float(1.0).sub(u.vacuum)) };
      },
    });
  }

  private swarms(): THREE.Object3D {
    const rng = new Rng(0x5a2, 3);
    const per = 2600;
    const n = per * NBH;
    const a = new Float32Array(n * 4), b = new Float32Array(n * 4), life = new Float32Array(n * 4);
    for (let h = 0; h < NBH; h++) {
      const tilt = new THREE.Euler(rng.range(-0.6, 0.6), rng.range(0, 6.28), rng.range(-0.6, 0.6));
      const q = new THREE.Quaternion().setFromEuler(tilt);
      const ax = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
      for (let k = 0; k < per; k++) {
        const i = h * per + k;
        const r = 0.12 + Math.pow(rng.next(), 1.5) * (h === 0 ? 0.9 : 0.55);
        a.set([this.bhPos[h]!.x, this.bhPos[h]!.y, this.bhPos[h]!.z, r], i * 4);
        b.set([ax.x, ax.y, ax.z, rng.next() * 6.283], i * 4);
        life.set([h, rng.next(), 0, 0], i * 4);
      }
    }
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4], l: [life, 4] },
      renderOrder: 3,
      softness: 2,
      build: (at) => {
        // orbits shrink as the structures huddle closer to the dying holes
        const huddle = sst(8.5, 15.0, u.c);
        const r = at.a.w.mul(float(1.0).sub(huddle.mul(0.55)));
        const ax = normalize(at.b.xyz);
        const t1 = normalize(T.cross(ax, vec3(0.3, 0.1, 1.0)));
        const t2 = T.cross(ax, t1);
        const w = float(0.6).div(r.pow(1.5));
        const ang = at.b.w.add(u.time.mul(w).mul(0.25));
        const p = at.a.xyz.add(t1.mul(cos(ang).mul(r))).add(t2.mul(sin(ang).mul(r))).add(ax.mul(sin(ang.mul(3.0).add(at.l.y.mul(9.0))).mul(r).mul(0.04)));
        const alive = at.l.z;
        const col = vec3(u.victor).mul(alive).mul(u.swarm).mul(at.l.y.mul(0.8).add(0.4)).mul(0.22);
        return { center: p, size: float(0.012), color: col };
      },
    });
    this.swarmLife = (mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>).l!;
    return mesh;
  }

  /** gravitational lensing: each hole bends the image already drawn behind it */
  private holes(): THREE.Object3D {
    const centers = new Float32Array(NBH * 4);
    const scr = new Float32Array(NBH * 4);
    this.bhPos.forEach((p, i) => centers.set([p.x, p.y, p.z, i === 0 ? 0.11 : 0.07], i * 4));
    const u = this.u;
    const mesh = makeParticles({
      count: NBH,
      attributes: { c: [centers, 4], s: [scr, 4] },
      renderOrder: 8,
      blending: THREE.NormalBlending,
      depthTest: false,
      build: (at) => {
        const life = at.s.w;
        return {
          center: at.c.xyz,
          size: at.c.w.mul(14.0).mul(life.greaterThan(0.001).select(float(1.0), float(0.0))),
          color: vec3(0.0),
          alpha: float(1.0),
          fragment: (q: N) =>
            Fn(() => {
              const r = length(q);
              const rs = float(0.16).mul(life.pow(0.3));
              // the deflection field is evaluated in screen space around the hole's projected centre
              const d = screenUV.sub(at.s.xy).mul(vec2(u.aspect, 1.0));
              const dr = length(d).max(1e-5);
              const R = at.s.z.max(1e-5);
              const x = dr.div(R);
              const bend = rs.mul(rs).mul(1.6).div(x.max(rs.mul(0.5)));
              const src = screenUV.sub(d.div(dr).mul(bend.mul(R)).div(vec2(u.aspect, 1.0)));
              const bg = viewportSharedTexture(src).rgb;
              const ring = exp(abs(x.sub(rs.mul(1.5))).mul(-90.0)).mul(life);
              const disk = vec3(u.victor).mul(ring.mul(0.95));
              const horizon = sst(rs.mul(1.02), rs.mul(0.98), x);
              const edge = sst(1.0, 0.75, r);
              const col = mix(bg.add(disk), vec3(0.0), horizon);
              return vec4(col, edge);
            })(),
        };
      },
    });
    this.bhAttr = (mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>).s!;
    return mesh;
  }

  /** soft Hawking flashes as each hole evaporates */
  private flashes(): THREE.Object3D {
    const a = new Float32Array(NBH * 4);
    this.bhPos.forEach((p, i) => a.set([p.x, p.y, p.z, 0], i * 4));
    const u = this.u;
    const mesh = makeParticles({
      count: NBH,
      attributes: { a: [a, 4] },
      renderOrder: 10,
      build: (at) => ({
        center: at.a.xyz,
        size: float(0.6).mul(at.a.w.sqrt()).add(0.001),
        color: mix(vec3(1.0, 0.95, 0.9), vec3(u.victor), 0.35).mul(at.a.w).mul(2.0),
        shape: (q: N) => exp(length(q).mul(-6.0)),
      }),
    });
    this.flashAttr = (mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>).a!;
    return mesh;
  }

  private lastPoint(): THREE.Object3D {
    const one = new Float32Array([0.15, 0.05, 0.2, 0]);
    const u = this.u;
    return makeParticles({
      count: 1,
      attributes: { a: [one, 4] },
      renderOrder: 9,
      build: (at) => ({
        center: at.a.xyz,
        size: float(0.16),
        // a small hot core and a wide halo in the winner's colour (it rhymes with the last human light)
        color: vec3(u.victor).mul(u.point).mul(0.9),
        shape: (q: N) => exp(length(q).mul(-30.0)).mul(3.2).add(exp(length(q).mul(-5.0)).mul(0.22)),
      }),
    });
  }

  private montage(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthTest: false, depthWrite: false });
    mat.colorNode = Fn(() => {
      const q = uv().sub(0.5).mul(vec2(u.aspect, 1.0));
      const r = length(q);
      // the run plays inside the point: an iris that opens from it, stays a porthole in the dark,
      // and closes back to nothing before the black
      const R = u.reveal.mul(0.43);
      const mask = sst(R, R.sub(0.025), r);
      const img = texture(this.montageTex, uv()).rgb;
      // a soft print look: warm highlights, the image falling off toward the rim
      const vig = sst(R.add(0.02), R.mul(0.35), r).mul(0.55).add(0.45);
      const rim = exp(abs(r.sub(R)).mul(-200.0)).mul(0.6).mul(sst(0.005, 0.03, R));
      // memory: the run half drained of its colour and washed in what was left
      const lum = dot(img, vec3(0.2126, 0.7152, 0.0722));
      const mem = mix(img, vec3(lum).mul(mix(vec3(1.0), vec3(u.victor).mul(1.4).add(0.25), 0.5)), 0.45);
      const col = mem.mul(vec3(1.05, 0.98, 0.92)).mul(vig).mul(mask).add(vec3(u.victor).mul(rim)).mul(u.montage);
      return vec4(col, mask.max(rim).mul(u.montage));
    })();
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.position.set(0, 0, -0.1);
    m.renderOrder = 20;
    m.frustumCulled = false;
    return m;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    const c = Number(shot.def.params?.c0 ?? 0) + shot.t;
    u.c.value = c;
    u.time.value = f.time;
    (u.victor.value as THREE.Color).copy(f.victor);
    const vac = shot.def.params?.vacuum ? 1 : 0;
    u.vacuum.value = vac;
    // stars: blue → red → black by +10^14 (c ≈ 8.5–11)
    u.starLife.value = 1 - smoothstep(6.0, 9.0, c);
    u.swarm.value = vac ? 0 : 1;
    const cam = this.camera;
    const aspect = cam.aspect || 16 / 9;
    u.aspect.value = aspect;
    // holes: alive until their time, then evaporate (a soft flash, reduced-flash aware)
    const arr = this.bhAttr.array as Float32Array;
    const life = this.swarmLife.array as Float32Array;
    const per = life.length / 4 / NBH;
    cam.updateMatrixWorld();
    const v = new THREE.Vector3();
    for (let i = 0; i < NBH; i++) {
      const L = vac ? 0 : clamp01((this.bhDeath[i]! - c) / 2.5);
      v.copy(this.bhPos[i]!).project(cam);
      const r = (0.07 * (i === 0 ? 1.6 : 1) * 14 * 0.5) / Math.max(0.01, this.bhPos[i]!.distanceTo(cam.position)) / Math.tan((cam.fov * Math.PI) / 360) * 0.5;
      // screenUV has its origin at the top-left
      arr.set([v.x * 0.5 + 0.5, 0.5 - v.y * 0.5, r, v.z < 1 ? L : 0], i * 4);
      for (let k = 0; k < per; k++) life[(i * per + k) * 4 + 2] = L > 0 ? Math.min(1, L * 1.6) : 0;
    }
    this.bhAttr.needsUpdate = true;
    this.swarmLife.needsUpdate = true;
    const fl = this.flashAttr.array as Float32Array;
    for (let i = 0; i < NBH; i++) {
      const x = (c - this.bhDeath[i]!) / 0.35;
      fl[i * 4 + 3] = vac || i === 0 ? 0 : Math.exp(-x * x) * (f.reducedFlash ? 0.2 : 1);
    }
    this.flashAttr.needsUpdate = true;
    // the last point: after the last hole, one point of computation, dimming
    const lastDeath = this.bhDeath[0]!;
    u.point.value = vac ? smoothstep(16.0, 17.0, c) * 0.7 : c < lastDeath - 0.5 ? 0 : smoothstep(lastDeath - 0.5, lastDeath, c) * (1 - 0.6 * smoothstep(lastDeath, lastDeath + 2.5, c));
    // the montage, inside the point
    const m0 = 17.2, m1 = 22.0;
    u.reveal.value = smoothstep(m0, m0 + 1.2, c) * (1 - smoothstep(m1 - 1.1, m1 - 0.1, c));
    u.montage.value = c > m0 ? 1 - smoothstep(m1 - 0.15, m1, c) : 0;
    this.montageQuad.visible = c > m0 - 0.1 && c < m1 + 0.1;
    // fit the quad to the frustum
    const h = 2 * 0.1 * Math.tan((cam.fov * Math.PI) / 360);
    this.montageQuad.scale.set(h * aspect, h, 1);
    if (this.montageQuad.visible) this.drawMontage((c - m0) / (m1 - m0));
  }

  /** backward and accelerating: lingers on the war, rushes to the first cell, holds it */
  private drawMontage(x: number): void {
    const src = this.source?.frames ?? [];
    const ctx = this.montageCtx;
    if (!ctx) return;
    if (!src.length) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 192, 108);
      this.montageTex.needsUpdate = true;
      return;
    }
    const k = Math.min(1, Math.max(0, x) / 0.92);
    const pos = Math.pow(k, 2.1);
    const idx = Math.max(0, Math.min(src.length - 1, Math.round((src.length - 1) * (1 - pos))));
    if (idx !== this.lastFrameIdx) {
      ctx.drawImage(src[idx]!.bmp, 0, 0, 192, 108);
      this.montageTex.needsUpdate = true;
      this.lastFrameIdx = idx;
    }
  }
}

function clamp01Node(x: N): N {
  return x.clamp(0.0, 1.0);
}

void select;
void max;
void vec4;
