import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { CamPose, ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { fbm3, noise1 } from '../../core/noise';
import { clamp01, easeInOutCubic, lerp, smoothstep } from '../../core/math';
import { buildVentGeometry, type MeshData, type VentGeometry } from '../spires';

const {
  uniform, vec2, vec3, vec4, float, mix, smoothstep: sstep, positionWorld, normalWorld, cameraPosition, normalize, dot,
  mx_noise_float, mx_fractal_noise_float, sin, cos, fract, max, min, exp, abs, pow, uv, fog, densityFogFactor,
  length, clamp, attribute, varying, modelWorldMatrix, cameraViewMatrix, atan, screenUV, viewportSharedTexture,
} = T;

/** Fixed seed: the vent must be bit-identical on every run (the Coda's Return depends on it). */
const VENT_SEED = 0x0c0ffee;

/** The protocell: a vesicle drifting in the warm water just above and in front of the hero orifice. */
export const PROTOCELL = new THREE.Vector3(1.6, 7.1, 2.2);
/** Orifices: [0] hero spire, [1..2] its secondary vents, [3..4] background spires (revealed later). */
const MOUTHS: THREE.Vector3[] = [];
const MOUTH_W = [1.0, 0.45, 0.35, 0.55, 0.45];

type V3 = [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const nrm = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/**
 * The Prologue's single continuous camera move (shared with the Coda's Return,
 * so the frame is reproduced exactly). pt = prologue-local seconds [0, 10].
 */
export function ventPath(pt: number): CamPose {
  const P: V3 = [PROTOCELL.x, PROTOCELL.y, PROTOCELL.z];
  const M: V3 = [0, 5.2, 0];
  // final macro framing: looking back along orifice→cell so the glow sits out of focus behind,
  // with the cell on the left third
  const d0 = nrm(sub(P, M));
  const d = nrm([d0[0], d0[1] * 0.35, d0[2]]);
  const right = nrm([d[2], 0, -d[0]]);
  const camEnd: V3 = [P[0] + d[0] * 0.25 - right[0] * 0.07, P[1] + d[1] * 0.25 + 0.03, P[2] + d[2] * 0.25 - right[2] * 0.07];
  const tgtEnd: V3 = [P[0] - right[0] * 0.038, P[1], P[2] - right[2] * 0.038];
  const camMid: V3 = [P[0] + d[0] * 1.9 - right[0] * 0.2, P[1] + d[1] * 1.9 + 0.15, P[2] + d[2] * 1.9 - right[2] * 0.2];
  const K: [number, V3, V3, number, number, number][] = [
    [0.0, [3.1, 3.7, 18.5], [1.9, 5.0, 0], 28, 18.5, 0.0],
    [3.2, [3.0, 4.0, 15.2], [1.75, 5.1, 0], 28, 15.2, 0.0],
    [6.4, [2.8, 5.0, 9.4], [1.2, 5.45, 0.5], 30, 8.6, 0.15],
    [8.0, camMid, [P[0] - right[0] * 0.3, P[1], P[2] - right[2] * 0.3], 30, 2.0, 0.7],
    [10.0, camEnd, tgtEnd, 30, 0.25, 1.0],
  ];
  const t = Math.max(0, Math.min(10, pt));
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1]![0]) i++;
  const a = K[i]!;
  const b = K[i + 1]!;
  const u = (t - a[0]) / (b[0] - a[0]);
  const e = i === 2 ? easeInOutCubic(u) : i === 3 ? 1 - Math.pow(1 - u, 2.4) : smoothstep(0, 1, u) * 0.6 + u * 0.4;
  const v3 = (p: V3, q: V3): THREE.Vector3 => new THREE.Vector3(lerp(p[0], q[0], e), lerp(p[1], q[1], e), lerp(p[2], q[2], e));
  const pos = v3(a[1], b[1]);
  // a breath of drift (deterministic in pt so the Return is identical)
  const amp = lerp(0.035, 0.002, smoothstep(6, 9.5, t));
  pos.x += noise1(t * 0.31, 11) * amp;
  pos.y += noise1(t * 0.27, 12) * amp * 0.6;
  // focus distance follows the subject exactly near the end
  return { pos, target: v3(a[2], b[2]), fov: lerp(a[3], b[3], e), focus: lerp(a[4], b[4], e), aperture: lerp(a[5], b[5], e) };
}

function toGeometry(m: MeshData): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.positions, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normals, 3));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  g.computeBoundingSphere();
  return g;
}

let ventGeo: VentGeometry | null = null;
/** Build the spire meshes in a worker while the start screen is up (falls back to the main thread). */
export async function preloadVentGeometry(): Promise<void> {
  if (ventGeo) return;
  try {
    const w = new Worker(new URL('../vent.worker.ts', import.meta.url), { type: 'module' });
    ventGeo = await new Promise<VentGeometry>((res, rej) => {
      w.onmessage = (e: MessageEvent<VentGeometry>) => res(e.data);
      w.onerror = (e) => rej(new Error(e.message));
      w.postMessage(0);
    });
    w.terminate();
  } catch (e) {
    console.warn('vent worker unavailable, building on the main thread', e);
    ventGeo = buildVentGeometry();
  }
}

export class VentStage extends Stage {
  readonly name = 'vent';
  readonly uPT: N = uniform(0);
  readonly uGlow: N = uniform(0);
  readonly uReveal: N = uniform(0);
  readonly uBack: N = uniform(0);
  readonly uSpark: N = uniform(new THREE.Color(1, 1, 1));
  readonly uSparkI: N = uniform(0);
  readonly uTheta: N = uniform(0.35);
  readonly uRadius: N = uniform(0.034);
  readonly uMembraneA: N = uniform(0);
  readonly uClosed: N = uniform(0);
  readonly uFocus: N = uniform(14);
  readonly uAperture: N = uniform(0);
  readonly uHaze: N = uniform(0);
  readonly uMouthI: N;
  private lights: THREE.PointLight[] = [];
  private mouthI: THREE.Vector4[] = [];
  pt = 0;

  constructor() {
    super();
    this.mouthI = Array.from({ length: 5 }, () => new THREE.Vector4(0, 0, 0, 0));
    this.uMouthI = T.uniformArray(this.mouthI, 'vec4');
  }

  build(): void {
    const rng = new Rng(VENT_SEED, 1);
    const scene = this.scene;
    scene.background = new THREE.Color(0, 0, 0);
    this.post = { bloom: 0.55, threshold: 0.0, exposure: 1.0, grain: 0.035, vignette: 0.45, chroma: 0.0012 };
    this.camera.near = 0.005;
    this.camera.far = 90;
    MOUTHS.length = 0;

    // ---- geometry: the hero cluster, background spires, a foreground silhouette, rubble, the mound ----
    const rockMat = this.rockMaterial();
    const geo = ventGeo ?? (ventGeo = buildVentGeometry());
    for (const md of geo.meshes) {
      const m = new THREE.Mesh(toGeometry(md), rockMat);
      m.position.set(md.offset[0], md.offset[1], md.offset[2]);
      scene.add(m);
    }
    scene.add(new THREE.Mesh(toGeometry(geo.floor), rockMat));
    for (const mo of geo.mouths) MOUTHS.push(new THREE.Vector3(mo[0], mo[1], mo[2]));
    void rng;

    // ---- light: warm orifices, a cold rim from far above ----
    for (let i = 0; i < 5; i++) {
      const L = new THREE.PointLight(0xff5a1c, 0, 4.5, 2);
      L.position.copy(MOUTHS[i]!).add(new THREE.Vector3(0, 0.22, 0));
      scene.add(L);
      this.lights.push(L);
    }
    const rim = new THREE.PointLight(0x5070a8, 0, 60, 2);
    rim.position.set(-3, 14, -14);
    scene.add(rim);
    this.lights.push(rim);

    // ---- cold blue-black water with warm pockets near the orifices ----
    const warmPocket = this.warmField(positionWorld);
    const cold = vec3(0.0006, 0.0011, 0.002).mul(this.uBack.mul(0.7).add(0.3));
    scene.fogNode = fog(cold.add(vec3(0.0028, 0.0008, 0.0002).mul(warmPocket)).add(vec3(0.0009, 0.0005, 0.0003).mul(this.uHaze)), densityFogFactor(float(0.07).add(this.uHaze.mul(0.45))));

    scene.add(this.backdrop());
    scene.add(this.mouthGlows());
    scene.add(this.plumes(rng));
    scene.add(this.particulates(rng));
    scene.add(this.shimmer());
    scene.add(this.micelles(rng));
    scene.add(this.buildMembrane());
    scene.add(this.spark());
  }

  /** warm light density near the orifices (for fog colour and particulates) */
  private warmField(p: N): N {
    let w: N = float(0);
    for (let i = 0; i < 5; i++) {
      const mi = this.uMouthI.element(i);
      const d2 = dot(p.sub(mi.xyz), p.sub(mi.xyz));
      w = w.add(mi.w.div(d2.mul(1.4).add(0.35)));
    }
    return w;
  }

  private rockMaterial(): THREE.MeshStandardNodeMaterial {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.85, metalness: 0.0 });
    const p = positionWorld;
    const n1 = mx_fractal_noise_float(p.mul(1.7), 4, 2.0, 0.5);
    const n2 = mx_noise_float(p.mul(vec3(6.0, 2.5, 6.0)));
    const basalt = vec3(0.022, 0.02, 0.019);
    const sulfide = vec3(0.12, 0.085, 0.04);
    const rust = vec3(0.07, 0.03, 0.013);
    let albedo = mix(basalt, rust, sstep(0.1, 0.5, n1).mul(0.5));
    const sulf = sstep(0.3, 0.7, n2);
    albedo = mix(albedo, sulfide, sulf.mul(0.6));
    const up = sstep(0.6, 0.95, normalWorld.y);
    albedo = mix(albedo, vec3(0.09, 0.088, 0.085), up.mul(sstep(0.0, 0.6, n1.add(0.2))).mul(0.45));
    m.colorNode = albedo;
    m.roughnessNode = mix(float(0.92), float(0.42), sulf);
    m.metalnessNode = sulf.mul(0.55);
    m.normalNode = normalize(T.normalView.add(T.mx_noise_vec3(p.mul(7.0)).mul(0.45)).add(T.mx_noise_vec3(p.mul(25.0)).mul(0.22)));
    // emissive only at the lips of the orifices
    let em: N = vec3(0);
    for (let i = 0; i < 5; i++) {
      const mi = this.uMouthI.element(i);
      const d = length(p.sub(mi.xyz));
      const lip = exp(d.mul(-11.0)).mul(mi.w);
      const mottle = mx_noise_float(p.mul(14.0)).mul(0.5).add(0.5).clamp(0.0, 1.0);
      em = em.add(vec3(1.0, 0.3, 0.06).mul(lip.mul(mottle.mul(0.7).add(0.3)).mul(0.9)));
    }
    m.emissiveNode = em.mul(this.uGlow);
    return m;
  }

  /** far, faint cold backlight so black smoke and spires read as silhouettes */
  private backdrop(): THREE.Mesh {
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    mat.colorNode = T.Fn(() => {
      const dir = normalize(positionWorld.sub(cameraPosition));
      const up = clamp(dir.y.mul(0.8).add(0.35), 0.0, 1.0);
      const streak = mx_noise_float(vec3(atan(dir.x, dir.z).mul(3.0), dir.y.mul(1.5), 0.0)).mul(0.5).add(0.5);
      return vec4(vec3(0.0045, 0.009, 0.017).mul(up.pow(2.0)).mul(streak.mul(0.5).add(0.6)).mul(this.uBack), 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), mat);
    m.renderOrder = -1;
    return m;
  }

  private mouthGlows(): THREE.Object3D {
    const g = new THREE.Group();
    const a = new Float32Array(5 * 4);
    for (let i = 0; i < 5; i++) a.set([i, MOUTH_W[i]!, 0, 0], i * 4);
    const t = this.uPT;
    const glow = this.uGlow;
    const MI = this.uMouthI;
    g.add(
      makeParticles({
        count: 5,
        attributes: { a: [a, 4] },
        renderOrder: 6,
        softness: 4.0,
        build: (at) => {
          const mi = MI.element(at.a.x.toInt());
          const breathe = float(0.86).add(sin(t.mul(1.9).add(at.a.x.mul(2.0))).mul(0.08)).add(sin(t.mul(5.1).add(at.a.x)).mul(0.04));
          return { center: mi.xyz.sub(vec3(0, 0.12, 0)), size: at.a.y.mul(0.22), color: vec3(1.0, 0.42, 0.1).mul(glow.mul(breathe).mul(mi.w).mul(1.5)) };
        },
      }),
    );
    g.add(
      makeParticles({
        count: 5,
        attributes: { a: [a, 4] },
        renderOrder: 5,
        softness: 1.8,
        build: (at) => {
          const mi = MI.element(at.a.x.toInt());
          return { center: mi.xyz.add(vec3(0, 0.35, 0)), size: at.a.y.mul(2.6), color: vec3(0.8, 0.16, 0.03).mul(glow.mul(mi.w).mul(0.035)) };
        },
      }),
    );
    return g;
  }

  /** black smoke: absorbing, billowing, lit dull red only at its base */
  private plumes(rng: Rng): THREE.Object3D {
    const per = [900, 260, 200, 260, 220];
    const n = per.reduce((a, b) => a + b, 0);
    const a = new Float32Array(n * 4);
    const b = new Float32Array(n * 4);
    let o = 0;
    per.forEach((cnt, mi) => {
      for (let i = 0; i < cnt; i++, o++) {
        a.set([mi, MOUTH_W[mi]!, 0, rng.next()], o * 4);
        b.set([rng.next(), rng.next(), rng.next(), rng.next()], o * 4);
      }
    });
    const t = this.uPT;
    const glow = this.uGlow;
    const MI = this.uMouthI;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      blending: THREE.NormalBlending,
      renderOrder: 7,
      softness: 1.6,
      build: (at) => {
        const mi = MI.element(at.a.x.toInt());
        const w = at.a.y;
        const life = float(6.5);
        const ph = fract(at.a.w.add(t.div(life)));
        const h = ph.pow(0.75).mul(6.5).mul(w.mul(0.6).add(0.4));
        const curl = vec3(
          mx_noise_float(vec3(at.b.x.mul(7.0), h.mul(0.6), t.mul(0.12))),
          float(0),
          mx_noise_float(vec3(at.b.y.mul(7.0), h.mul(0.6), t.mul(0.12).add(5.0))),
        ).mul(h.mul(0.3).add(0.04).mul(w));
        const spread = vec3(at.b.x.sub(0.5), 0, at.b.y.sub(0.5)).mul(h.mul(0.42).add(0.06).mul(w));
        const center = mi.xyz.add(vec3(0, h.add(0.02), 0)).add(curl).add(spread).add(vec3(h.mul(0.08), 0, h.mul(0.03)));
        const size = h.mul(0.34).add(0.1).mul(w);
        const base = exp(h.div(w.mul(0.55).add(0.05)).negate()).mul(glow).mul(mi.w);
        const col = vec3(0.65, 0.12, 0.02).mul(base.mul(0.9)).add(vec3(0.0011, 0.0012, 0.0014));
        const alpha = sstep(0.0, 0.025, ph).mul(float(1).sub(sstep(0.55, 1.0, ph))).mul(0.55).mul(mi.w.min(1.0)).mul(this.uReveal.mul(0.5).add(0.5));
        return { center, size, color: col, alpha, rotation: at.b.z.mul(6.28).add(t.mul(0.15)) };
      },
    });
  }

  private particulates(rng: Rng): THREE.Object3D {
    const n = 5200;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let x: number, y: number, z: number;
      if (i < 1500) {
        x = PROTOCELL.x + rng.normal(0, 0.18);
        y = PROTOCELL.y + rng.normal(0, 0.12);
        z = PROTOCELL.z + rng.normal(0, 0.18);
      } else if (i < 3400) {
        // a column of warm motes above the hero orifice
        x = rng.normal(0, 0.9);
        y = rng.range(4.2, 10);
        z = rng.normal(0, 0.9);
      } else {
        x = rng.range(-9, 9);
        y = rng.range(-0.2, 11);
        z = rng.range(-7, 12);
      }
      a.set([x, y, z, rng.next()], i * 4);
    }
    const t = this.uPT;
    const glow = this.uGlow;
    const focus = this.uFocus;
    const aperture = this.uAperture;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 9,
      softness: 1.0,
      build: (at) => {
        const s = at.a.w;
        const drift = vec3(sin(t.mul(0.21).add(s.mul(40.0))).mul(0.1), t.mul(0.06).mul(s.add(0.3)), cos(t.mul(0.17).add(s.mul(23.0))).mul(0.1));
        const p = at.a.xyz.add(drift);
        const warm = this.warmField(p);
        const ds = p.sub(vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z));
        const Ls = this.uSparkI.mul(0.004).div(ds.dot(ds).add(0.002));
        const viewP = cameraViewMatrix.mul(modelWorldMatrix.mul(vec4(p, 1.0)));
        const depth = viewP.z.negate().max(0.01);
        const coc = abs(depth.sub(focus)).div(depth).mul(aperture).mul(0.05);
        const base = s.mul(0.005).add(0.002).mul(depth.mul(0.07).add(0.25));
        const size = base.add(coc);
        const energy = base.div(size).pow(1.4);
        const veil = sstep(0.7, 0.4, length(at.a.xyz.sub(vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z))));
        const vis = mix(float(1.0), aperture.clamp(0.0, 1.0), veil);
        const coldRim = vec3(0.04, 0.07, 0.12).mul(this.uBack).mul(0.25);
        const col = vec3(1.0, 0.45, 0.16).mul(warm.mul(glow).mul(0.6)).add(coldRim).add(vec3(this.uSpark).mul(Ls)).mul(energy).mul(0.35).mul(vis);
        return {
          center: p,
          size,
          color: col,
          // hexagonal aperture for out-of-focus discs
          shape: (q: N) => {
            const ang = atan(q.y, q.x);
            const hex = cos(float(Math.PI / 6)).div(cos(ang.mod(Math.PI / 3).sub(Math.PI / 6)));
            const r = length(q).div(hex);
            const disc = sstep(1.0, 0.86, r);
            const soft = float(1.0).sub(length(q)).max(0.0).pow(1.2);
            return mix(soft, disc.mul(r.mul(0.25).add(0.75)), sstep(0.0005, 0.004, coc));
          },
        };
      },
    });
  }

  /** heat haze: refracts what lies behind the column above the hero orifice */
  private shimmer(): THREE.Object3D {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false });
    const t = this.uPT;
    const q = uv();
    const w = sstep(0.0, 0.3, q.x).mul(sstep(1.0, 0.7, q.x)).mul(sstep(0.0, 0.12, q.y)).mul(sstep(1.0, 0.4, q.y)).mul(this.uGlow);
    const nx = mx_noise_float(vec3(q.x.mul(5.0), q.y.mul(6.0).sub(t.mul(2.4)), t.mul(0.5)));
    const ny = mx_noise_float(vec3(q.x.mul(5.0).add(9.0), q.y.mul(6.0).sub(t.mul(2.4)), t.mul(0.5)));
    const offs = vec2(nx, ny).mul(0.006).mul(w);
    mat.colorNode = vec4(viewportSharedTexture(screenUV.add(offs)).rgb, w.mul(0.9));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.6), mat);
    m.position.set(0, 5.2 + 1.45, 0);
    m.renderOrder = 30;
    m.userData.billboard = true;
    g.add(m);
    return g;
  }

  private micelles(rng: Rng): THREE.Object3D {
    const n = 70;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([PROTOCELL.x + rng.normal(0, 0.12), PROTOCELL.y + rng.normal(0, 0.08), PROTOCELL.z + rng.normal(0, 0.12), rng.next()], i * 4);
    const t = this.uPT;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 11,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(t.mul(0.3).add(s.mul(30.0))), cos(t.mul(0.23).add(s.mul(17.0))), sin(t.mul(0.27).add(s.mul(11.0)))).mul(0.015));
        const size = s.mul(0.0028).add(0.0012);
        const warm = vec3(1.0, 0.7, 0.45);
        const cool = vec3(0.55, 0.75, 1.0);
        const vis = this.uAperture.mul(1.2).min(1.0);
        return {
          center: p,
          size,
          color: mix(warm, cool, s).mul(vis).mul(0.07),
          shape: (q: N) => {
            const r = length(q);
            return sstep(0.6, 0.93, r).mul(sstep(1.0, 0.93, r)).add(sstep(1.0, 0.0, r).mul(0.06));
          },
        };
      },
    });
  }

  private buildMembrane(): THREE.Mesh {
    const nu = 72, nv = 112;
    const geo = new THREE.BufferGeometry();
    const uvs = new Float32Array((nu + 1) * (nv + 1) * 2);
    const pos = new Float32Array((nu + 1) * (nv + 1) * 3);
    const idx: number[] = [];
    for (let i = 0; i <= nu; i++)
      for (let j = 0; j <= nv; j++) {
        const k = i * (nv + 1) + j;
        uvs[k * 2] = i / nu;
        uvs[k * 2 + 1] = j / nv;
      }
    for (let i = 0; i < nu; i++)
      for (let j = 0; j < nv; j++) {
        const a = i * (nv + 1) + j, b = a + nv + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 10);

    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
    const q = attribute('uv', 'vec2');
    const thMax = this.uTheta;
    const Rf = this.uRadius;
    const R = Rf.mul(float(2.0).div(float(1.0).sub(cos(thMax))).sqrt());
    const th = q.x.mul(thMax);
    const ph = q.y.mul(Math.PI * 2);
    const wob = mx_noise_float(vec3(q.x.mul(3.0), q.y.mul(6.0), this.uPT.mul(0.5))).mul(Rf.mul(0.04)).mul(float(1).sub(this.uClosed.mul(0.75)));
    const rr = R.add(wob);
    const local = vec3(sin(th).mul(cos(ph)).mul(rr), R.sub(cos(th).mul(rr)), sin(th).mul(sin(ph)).mul(rr));
    const pole = vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z).sub(vec3(0, Rf, 0));
    mat.positionNode = pole.add(local);
    const vN = varying(normalize(local.sub(vec3(0, R, 0))));
    const vEdge = varying(q.x);
    const vW = varying(pole.add(local));
    const view = normalize(cameraPosition.sub(vW));
    const cosI = abs(dot(vN, view)).clamp(0.0, 1.0);
    // thin film: smooth flowing bands, thicker toward the bottom (drainage), swirling slowly
    const flow = vec3(vN.x.mul(2.2), vN.y.mul(2.2).add(this.uPT.mul(0.12)), vN.z.mul(2.2));
    const thick = float(420.0).add(mx_noise_float(flow).mul(160.0)).add(mx_noise_float(flow.mul(2.3).add(5.0)).mul(50.0)).sub(vN.y.mul(110.0));
    const sinT2 = float(1.0).sub(cosI.mul(cosI)).div(1.33 * 1.33);
    const cosT = float(1.0).sub(sinT2).sqrt();
    const opd = thick.mul(2.0 * 1.33).mul(cosT);
    const film = vec3(0.5).sub(cos(opd.mul(vec3((2 * Math.PI) / 650, (2 * Math.PI) / 532, (2 * Math.PI) / 450))).mul(0.5));
    // transparent core, strongest at grazing angles
    const fres = float(1.0).sub(cosI).clamp(0.0, 1.0).pow(1.6);
    const rim = sstep(0.85, 1.0, vEdge).mul(float(1).sub(this.uClosed));
    const lightIn = vec3(this.uSpark).mul(this.uSparkI.mul(0.006)).add(vec3(1.0, 0.5, 0.2).mul(0.12));
    const col = film.mul(fres.mul(1.2).add(0.008)).mul(lightIn.add(0.18)).add(vec3(1.0, 0.85, 0.7).mul(rim.mul(0.18)));
    mat.colorNode = vec4(col.mul(this.uMembraneA), 1.0);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 12;
    return mesh;
  }

  private spark(): THREE.Object3D {
    const g = new THREE.Group();
    const one = new Float32Array([PROTOCELL.x, PROTOCELL.y, PROTOCELL.z, 0]);
    const sc = this.uSpark;
    const I = this.uSparkI;
    const t = this.uPT;
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 14,
        softness: 3.0,
        build: (at) => ({ center: at.a.xyz, size: float(0.12), color: vec3(sc).mul(I.mul(0.008)) }),
      }),
    );
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 15,
        softness: 8.0,
        build: (at) => {
          const flick = float(1.0).add(sin(t.mul(31.0)).mul(0.06)).add(sin(t.mul(17.0)).mul(0.07));
          return { center: at.a.xyz, size: float(0.0032), color: vec3(sc).mul(I.mul(flick).mul(0.55)).add(vec3(I.mul(0.025))) };
        },
      }),
    );
    // a few flickers of chemistry before the membrane closes
    const n = 10;
    const a = new Float32Array(n * 4);
    const rng = new Rng(VENT_SEED, 3);
    for (let i = 0; i < n; i++) a.set([rng.normal(0, 1), rng.normal(0, 1), rng.normal(0, 1), rng.next()], i * 4);
    g.add(
      makeParticles({
        count: n,
        attributes: { a: [a, 4] },
        renderOrder: 13,
        softness: 3.0,
        build: (at) => {
          const s = at.a.w;
          const blink = sstep(0.9, 1.0, sin(t.mul(s.mul(7.0).add(3.0)).add(s.mul(50.0)))).mul(float(1.0).sub(this.uClosed));
          const p = vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z).add(normalize(at.a.xyz).mul(this.uRadius.mul(0.5).mul(s.add(0.3))));
          return { center: p, size: float(0.001), color: vec3(sc).mul(blink.mul(I).mul(0.25)) };
        },
      }),
    );
    return g;
  }

  /** Drive everything from prologue-local time (pure function → the Return is identical). */
  setPrologueTime(pt: number, spark: THREE.Color): void {
    this.pt = pt;
    this.uPT.value = pt;
    const glow = smoothstep(0.4, 3.6, pt) * (0.9 + 0.1 * noise1(pt * 1.3, 5));
    this.uGlow.value = glow;
    this.uReveal.value = smoothstep(2.6, 6.2, pt);
    this.uBack.value = smoothstep(1.5, 6.0, pt);
    (this.uSpark.value as THREE.Color).copy(spark);
    // one orifice first; its siblings and the background spires wake later
    const wake = [smoothstep(0.3, 2.6, pt), smoothstep(2.4, 4.6, pt), smoothstep(2.9, 5.2, pt), smoothstep(3.6, 6.2, pt), smoothstep(4.0, 6.6, pt)];
    for (let i = 0; i < 5; i++) {
      const m = MOUTHS[i]!;
      const breathe = 0.85 + 0.15 * Math.sin(pt * (1.4 + i * 0.37) + i);
      this.mouthI[i]!.set(m.x, m.y, m.z, wake[i]! * MOUTH_W[i]! * breathe);
      this.lights[i]!.intensity = glow * wake[i]! * MOUTH_W[i]! * 7 * breathe;
    }
    this.lights[5]!.intensity = this.uBack.value * 260;
    const close = smoothstep(6.9, 9.1, pt);
    const kindle = smoothstep(9.05, 9.35, pt);
    const flare = Math.exp(-Math.pow((pt - 9.25) / 0.18, 2));
    this.uSparkI.value = smoothstep(3.6, 6.5, pt) * 3 + kindle * 14 + flare * 10;
    this.uTheta.value = lerp(0.42, Math.PI, easeInOutCubic(close));
    this.uClosed.value = smoothstep(8.85, 9.2, pt);
    this.uMembraneA.value = smoothstep(6.0, 7.2, pt);
    this.uHaze.value = smoothstep(6.6, 8.2, pt) * 0.05;
  }

  private lastPT = 0;
  update(f: FrameContext, shot: ShotRuntime): void {
    const off = Number(shot.def.params?.offset ?? 0);
    const pt = clamp01((off + shot.t) / 10) * 10;
    if (this.lastPT < 8.95 && pt >= 8.95) f.cue('membrane');
    if (this.lastPT < 9.2 && pt >= 9.2) f.cue('spark');
    this.lastPT = pt;
    this.setPrologueTime(pt, f.spark);
    const p = ventPath(pt);
    this.uFocus.value = p.focus ?? 10;
    this.uAperture.value = p.aperture ?? 0;
    this.scene.traverse((o) => {
      if (o.userData.billboard) o.quaternion.copy(this.camera.quaternion);
    });
  }
}

void pow;
void max;
void min;
