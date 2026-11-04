import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { fbm2, noise1 } from '../../core/noise';
import { clamp01, smoothstep } from '../../core/math';
import { vnoise, vfbm } from '../tsl/noiseTex';

const {
  uniform, uniformArray, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, normalize, max, min, abs, length, clamp, sin, cos,
  fog, densityFogFactor, fract,
} = T;

interface Hand { x: number; y: number; rot: number; scale: number; spread: number; t: number; tone: number }

const HANDS: Hand[] = [
  { x: -0.34, y: 0.06, rot: -0.25, scale: 1.0, spread: 0.6, t: 0.12, tone: 0 },
  { x: -0.12, y: 0.17, rot: 0.1, scale: 0.92, spread: 0.9, t: 0.26, tone: 0 },
  { x: 0.1, y: 0.02, rot: -0.05, scale: 1.05, spread: 0.4, t: 0.38, tone: 1 },
  { x: 0.31, y: 0.15, rot: 0.32, scale: 0.85, spread: 0.8, t: 0.5, tone: 0 },
  { x: -0.22, y: -0.16, rot: 0.45, scale: 0.7, spread: 0.7, t: 0.6, tone: 2 },
  { x: 0.2, y: -0.18, rot: -0.4, scale: 0.95, spread: 0.5, t: 0.7, tone: 0 },
  { x: 0.46, y: -0.04, rot: 0.15, scale: 0.6, spread: 0.9, t: 0.8, tone: 1 },
];

/** wall height function (shared by the mesh and the hand placement) */
function wallZ(x: number, y: number): number {
  return fbm2(x * 1.4, y * 1.4, 5, 61) * 0.09 + fbm2(x * 6, y * 6, 3, 62) * 0.012 - (x * x) * 0.25;
}

/**
 * Ochre hand stencils on a cave wall (~45 kya) by firelight: the oldest
 * signatures. Each hand is a clean void inside a halo of blown pigment.
 */
export class CaveStage extends Stage {
  readonly name = 'cave';
  readonly u = { time: uniform(0), x: uniform(0), flick: uniform(1) };
  private handU: N;
  private handV: THREE.Vector4[];
  private handW: THREE.Vector4[];
  private handUW: N;
  private light!: THREE.PointLight;
  private lastX = 0;

  constructor() {
    super();
    this.handV = HANDS.map((h) => new THREE.Vector4(h.x, h.y, h.rot, h.scale));
    this.handW = HANDS.map((h) => new THREE.Vector4(h.spread, h.t, h.tone, 0));
    this.handU = uniformArray(this.handV, 'vec4');
    this.handUW = uniformArray(this.handW, 'vec4');
  }

  build(): void {
    this.post = { bloom: 0.45, threshold: 0.4, exposure: 0.85, grain: 0.045, vignette: 0.7, chroma: 0.0015 };
    this.camera.near = 0.01;
    this.camera.far = 30;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.scene.fogNode = fog(vec3(0.0, 0.0, 0.0), densityFogFactor(float(0.35)));
    this.light = new THREE.PointLight(0xff8a3c, 0, 4, 2);
    this.light.position.set(-0.75, -0.62, 0.22);
    this.scene.add(this.light);
    this.scene.add(this.wall());
    this.scene.add(this.dust());
  }

  /** the hand stencil mask for hand i at wall coords p (0 = clear void, 1 = full pigment halo) */
  private handMask(p: N, i: number): N {
    const hv = this.handU.element(i);
    const hw = this.handUW.element(i);
    const d0 = p.sub(hv.xy);
    const c = cos(hv.z.negate()), s = sin(hv.z.negate());
    const q = vec2(d0.x.mul(c).sub(d0.y.mul(s)), d0.x.mul(s).add(d0.y.mul(c))).div(hv.w.mul(1.15));
    const cap = (a: [number, number], b: [number, number], r: number, sp: N): N => {
      const A = vec2(a[0], a[1]);
      const B = vec2(b[0], b[1]).add(vec2(sp, 0.0));
      const pa = q.sub(A);
      const ba = B.sub(A);
      const h = clamp(pa.dot(ba).div(ba.dot(ba)), 0.0, 1.0);
      return length(pa.sub(ba.mul(h))).sub(r);
    };
    const spr = hw.x.mul(0.02);
    const palm = length(q.div(vec2(0.046, 0.054))).sub(1.0).mul(0.046);
    let d: N = palm;
    d = min(d, cap([-0.028, 0.045], [-0.04, 0.128], 0.0098, spr.negate()));
    d = min(d, cap([-0.009, 0.05], [-0.012, 0.147], 0.0102, spr.mul(-0.3)));
    d = min(d, cap([0.012, 0.047], [0.017, 0.135], 0.0098, spr.mul(0.3)));
    d = min(d, cap([0.03, 0.035], [0.045, 0.1], 0.0085, spr));
    d = min(d, cap([-0.04, -0.005], [-0.088, 0.055], 0.011, spr.negate()));
    d = min(d, cap([0.0, -0.04], [0.0, -0.12], 0.034, float(0.0)));
    // blown pigment: dense at the edge of the hand, thinning outward, speckled
    const speck = vnoise(vec3(q.mul(260.0), float(i)), 'a').mul(0.5).add(0.5);
    // a wide, soft spray cloud: densest at the hand's edge, thinning over several centimetres
    const spray = T.exp(d.max(0.0).mul(-38.0)).mul(sst(-0.001, 0.003, d));
    const blot = vnoise(vec3(q.mul(14.0), float(i).add(3.0)), 'b').mul(0.35).add(0.75);
    const halo = spray.mul(blot).mul(sst(0.11, 0.06, d)).mul(1.7).min(1.0);
    return halo.mul(speck.mul(0.5).add(0.62));
  }

  private wall(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(2.4, 1.6, 360, 240);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setZ(i, wallZ(p.getX(i), p.getY(i)));
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.92 });
    const u = this.u;
    const w = positionWorld;
    mat.colorNode = Fn(() => {
    const rock = mix(vec3(0.33, 0.27, 0.2), vec3(0.45, 0.38, 0.29), vnoise(w.mul(2.0), 'g').mul(0.5).add(0.5));
    const stains = vfbm(w.mul(1.2));
    let alb: N = mix(rock, vec3(0.24, 0.2, 0.15), sst(0.0, 0.5, stains).mul(0.28));
    // flowstone streaks
    alb = mix(alb, vec3(0.5, 0.45, 0.38), sst(0.62, 0.92, vnoise(vec3(w.x.mul(7.0), w.y.mul(2.2), w.x.mul(1.3)), 'b').mul(0.5).add(0.5)).mul(0.12));
    // the hands, appearing one by one
    const pig = vec3(0).toVar();
    const cover = float(0).toVar();
    const tones = [vec3(0.42, 0.08, 0.04), vec3(0.55, 0.22, 0.06), vec3(0.06, 0.05, 0.05)];
    for (let i = 0; i < HANDS.length; i++) {
      const hw = this.handUW.element(i);
      const appear = sst(hw.y, hw.y.add(0.07), u.x);
      const m = this.handMask(w.xy, i).mul(appear).mul(vnoise(w.mul(9.0), 'b').mul(0.25).add(0.8));
      const tone = HANDS[i]!.tone;
      pig.assign(mix(pig, tones[tone]!, m.mul(0.92)));
      cover.assign(max(cover, m));
    }
    // ochre dots, older and fainter
    const dots = sst(0.88, 0.95, vnoise(vec3(w.xy.mul(30.0), 7.0), 'a').mul(0.5).add(0.5)).mul(sst(0.3, 0.0, abs(w.y.add(0.33)))).mul(0.6);
    alb = mix(alb, vec3(0.45, 0.1, 0.05), dots.mul(0.7));
    alb = mix(alb, pig, cover.mul(0.92));
    return alb;
    })();
    mat.normalNode = normalize(T.normalView.add(T.mx_noise_vec3(w.mul(14.0)).mul(0.35)).add(T.mx_noise_vec3(w.mul(60.0)).mul(0.12)));
    const m = new THREE.Mesh(geo, mat);
    return m;
  }

  /** dust and smoke motes drifting through the firelight */
  private dust(): THREE.Object3D {
    const rng = new Rng(0xd057, 3);
    const n = 700;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.range(-1, 1), rng.range(-0.7, 0.7), rng.range(0.05, 0.7), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 8,
      softness: 1.4,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(u.time.mul(0.15).add(s.mul(30.0))).mul(0.06), fract(u.time.mul(0.02).add(s)).mul(0.3), 0.0));
        const dl = length(p.sub(vec3(-0.45, -0.55, 0.55)));
        const col = vec3(1.0, 0.6, 0.3).mul(float(0.015).div(dl.mul(dl).add(0.05))).mul(u.flick).mul(0.3);
        return { center: p, size: s.mul(0.004).add(0.002).add(at.a.z.mul(0.01)), color: col };
      },
    });
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    const x = clamp01(shot.u);
    u.time.value = f.time;
    u.x.value = x;
    const flick = 0.75 + 0.2 * noise1(f.time * 8, 4) + 0.1 * noise1(f.time * 21, 5);
    u.flick.value = flick;
    // raking firelight from low left, close to the wall: relief, falloff to black
    this.light.intensity = 3.2 * flick * smoothstep(0.0, 0.08, x);
    this.light.position.set(-0.75 + 0.03 * noise1(f.time * 3, 9), -0.62 + 0.02 * noise1(f.time * 4, 8), 0.22);
    for (const h of HANDS) if (this.lastX < h.t && x >= h.t && !f.freshStage) f.cue('hand');
    this.lastX = x;
    void wallZ;
  }
}
