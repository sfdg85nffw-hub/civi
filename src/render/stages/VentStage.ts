import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { CamPose, ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { fbm3, noise1 } from '../../core/noise';
import { clamp01, easeInOutCubic, lerp, smoothstep } from '../../core/math';

const {
  uniform, vec2, vec3, vec4, float, color, mix, smoothstep: sstep, positionWorld, normalWorld, cameraPosition, normalize, dot,
  mx_noise_float, mx_fractal_noise_float, sin, cos, fract, max, min, exp, abs, pow, uv, positionLocal, fog, densityFogFactor,
  length, clamp, PI, attribute, varying, modelWorldMatrix, cameraProjectionMatrix, cameraViewMatrix,
} = T;

/** Fixed seed: the vent must be bit-identical on every run (the Coda's Return depends on it). */
const VENT_SEED = 0x0c0ffee;

/** The protocell's position (a micro-vesicle drifting in the warm water in front of the main chimney). */
export const PROTOCELL = new THREE.Vector3(1.55, 5.95, 1.25);
const MOUTHS = [new THREE.Vector3(0, 5.25, 0), new THREE.Vector3(-3.6, 3.55, -2.6), new THREE.Vector3(3.1, 2.7, -3.4)];

/**
 * The Prologue's single continuous camera move (shared with the Coda's Return,
 * so the frame is reproduced exactly). pt = prologue-local seconds [0, 10].
 */
export function ventPath(pt: number): CamPose {
  // keyframes: [time, position, target, fov, focus, aperture]
  const K: [number, [number, number, number], [number, number, number], number, number, number][] = [
    [0.0, [0.6, 3.4, 19.0], [0.1, 4.6, 0], 28, 19, 0.0],
    [3.2, [0.7, 3.7, 15.6], [0.2, 4.75, 0], 28, 15.5, 0.0],
    [6.4, [0.2, 5.3, 8.6], [1.0, 5.6, 0.7], 30, 7.6, 0.2],
    [8.0, [1.12, 6.03, 1.92], [1.55, 5.95, 1.25], 30, 0.62, 0.9],
    [10.0, [1.40, 5.985, 1.45], [1.55, 5.952, 1.25], 30, 0.26, 1.0],
  ];
  const t = Math.max(0, Math.min(10, pt));
  let i = 0;
  while (i < K.length - 2 && t > K[i + 1]![0]) i++;
  const a = K[i]!;
  const b = K[i + 1]!;
  const u = (t - a[0]) / (b[0] - a[0]);
  // the dive (6.4→8.0) accelerates then settles; others ease
  const e = i === 2 ? easeInOutCubic(u) : i === 3 ? 1 - Math.pow(1 - u, 2.2) : smoothstep(0, 1, u) * 0.6 + u * 0.4;
  const v3 = (p: [number, number, number], q: [number, number, number]): THREE.Vector3 =>
    new THREE.Vector3(lerp(p[0], q[0], e), lerp(p[1], q[1], e), lerp(p[2], q[2], e));
  const pos = v3(a[1], b[1]);
  // a breath of drift (deterministic in pt so the Return is identical)
  const amp = lerp(0.03, 0.004, smoothstep(6, 9, t));
  pos.x += noise1(t * 0.31, 11) * amp;
  pos.y += noise1(t * 0.27, 12) * amp * 0.6;
  return { pos, target: v3(a[2], b[2]), fov: lerp(a[3], b[3], e), focus: lerp(a[4], b[4], e), aperture: lerp(a[5], b[5], e) };
}

function chimneyGeometry(rng: Rng, height: number, radius: number): THREE.BufferGeometry {
  // lathe profile from multi-octave 1D noise: knobbly, asymmetric accretions, open crater mouth
  const pts: THREE.Vector2[] = [];
  const n = 90;
  const sd = rng.int(0, 1e6);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const y = t * height;
    let r = radius * (1.55 - 1.22 * Math.pow(t, 0.85));
    r *= 1 + 0.22 * noise1(t * 6, sd) + 0.1 * noise1(t * 17, sd + 1) + 0.05 * noise1(t * 41, sd + 2);
    pts.push(new THREE.Vector2(Math.max(0.04, r), y));
  }
  const top = height;
  const rt = pts[pts.length - 1]!.x;
  pts.push(new THREE.Vector2(rt * 1.05, top + 0.05));
  pts.push(new THREE.Vector2(rt * 0.75, top + 0.07));
  pts.push(new THREE.Vector2(rt * 0.55, top - 0.15));
  pts.push(new THREE.Vector2(rt * 0.4, top - 0.8));
  const geo = new THREE.LatheGeometry(pts, 140);
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const seed = rng.int(0, 1e6);
  // lopsided accretions: a few lobes pushed out on one side
  const lobes = Array.from({ length: 4 }, () => ({ y: rng.range(0.15, 0.85) * height, a: rng.range(0, Math.PI * 2), s: rng.range(0.25, 0.6) * radius }));
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const rr = Math.hypot(x, z);
    if (rr < 1e-4) continue;
    const ang = Math.atan2(z, x);
    let d = fbm3(x * 0.9, y * 0.45, z * 0.9, 5, seed) * 0.55 * radius; // vertically streaked
    d += fbm3(x * 4.5, y * 1.6, z * 4.5, 3, seed + 9) * 0.12 * radius;
    for (const L of lobes) {
      const da = Math.atan2(Math.sin(ang - L.a), Math.cos(ang - L.a));
      d += L.s * Math.exp(-((y - L.y) ** 2) / (0.12 * height * height * 0.08)) * Math.exp(-(da * da) / 0.5);
    }
    const k = (rr + d) / rr;
    pos.setXYZ(i, x * k, y + d * 0.1, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}

export class VentStage extends Stage {
  readonly name = 'vent';
  /** prologue-local time (0–10 s) */
  readonly uPT: N = uniform(0);
  readonly uGlow: N = uniform(0);
  readonly uReveal: N = uniform(0);
  readonly uSpark: N = uniform(new THREE.Color(1, 1, 1));
  readonly uSparkI: N = uniform(0);
  readonly uTheta: N = uniform(0.35);
  readonly uRadius: N = uniform(0.03);
  readonly uMembraneA: N = uniform(0);
  readonly uClosed: N = uniform(0);
  readonly uFocus: N = uniform(14);
  readonly uAperture: N = uniform(0);
  readonly uHaze: N = uniform(0);
  private lights: THREE.PointLight[] = [];
  private membrane!: THREE.Mesh;
  /** externally set: when true the stage is driven by the Coda (Return) */
  pt = 0;

  build(): void {
    const rng = new Rng(VENT_SEED, 1);
    const scene = this.scene;
    scene.background = new THREE.Color(0, 0, 0);
    this.camera.near = 0.005;
    this.camera.far = 80;

    // Underwater haze: warm near the vents, black far away
    const hazeCol = vec3(0.0016, 0.0007, 0.0003).mul(this.uGlow).add(vec3(0.0012, 0.0006, 0.0003).mul(this.uHaze));
    scene.fogNode = fog(hazeCol, densityFogFactor(float(0.065).add(this.uHaze.mul(0.5))));

    // ---- lights at the mouths (thermal glow) ----
    for (let i = 0; i < MOUTHS.length; i++) {
      const L = new THREE.PointLight(0xff6a22, 0, 16, 2);
      L.position.copy(MOUTHS[i]!).add(new THREE.Vector3(0, 0.35, 0));
      scene.add(L);
      this.lights.push(L);
    }
    const fill = new THREE.PointLight(0x4a6a9a, 0, 40, 2);
    fill.position.set(-2.5, 10, -9);
    scene.add(fill);
    this.lights.push(fill);

    // ---- chimneys ----
    const rockMat = this.rockMaterial();
    const specs: [number, number, THREE.Vector3][] = [
      [5.25, 0.62, new THREE.Vector3(0, 0, 0)],
      [3.55, 0.48, new THREE.Vector3(-3.6, 0, -2.6)],
      [2.7, 0.42, new THREE.Vector3(3.1, 0, -3.4)],
    ];
    for (const [h, r, p] of specs) {
      const grp = new THREE.Group();
      grp.position.copy(p);
      grp.add(new THREE.Mesh(chimneyGeometry(rng, h, r), rockMat));
      // candelabra: fused sub-spires and side vents on the flanks
      const subs = rng.int(3, 5);
      for (let k = 0; k < subs; k++) {
        const sh = h * rng.range(0.35, 0.72);
        const sr = r * rng.range(0.35, 0.6);
        const m = new THREE.Mesh(chimneyGeometry(rng, sh, sr), rockMat);
        const a = rng.range(0, Math.PI * 2);
        const off = r * rng.range(0.85, 1.25);
        m.position.set(Math.cos(a) * off, rng.range(-0.1, 0.25) * h, Math.sin(a) * off);
        m.rotation.set(rng.range(-0.12, 0.12), rng.range(0, 6.28), rng.range(-0.18, 0.18));
        grp.add(m);
      }
      scene.add(grp);
    }
    // small spires around the base
    for (let i = 0; i < 9; i++) {
      const h = rng.range(0.5, 1.6);
      const m = new THREE.Mesh(chimneyGeometry(rng, h, rng.range(0.12, 0.25)), rockMat);
      const a = rng.range(0, Math.PI * 2);
      const d = rng.range(1.2, 5.5);
      m.position.set(Math.cos(a) * d, -0.05, Math.sin(a) * d - 1.2);
      scene.add(m);
    }

    // ---- seafloor (sulfide mound) ----
    const floorGeo = new THREE.PlaneGeometry(60, 60, 220, 220);
    floorGeo.rotateX(-Math.PI / 2);
    const fp = floorGeo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < fp.count; i++) {
      const x = fp.getX(i), z = fp.getZ(i);
      const mound = 1.1 * Math.exp(-(x * x + (z + 1.5) * (z + 1.5)) / 22);
      const y = mound + fbm3(x * 0.35, 0, z * 0.35, 5, 77) * 0.9 + fbm3(x * 2.2, 1, z * 2.2, 3, 78) * 0.12 - 0.35;
      fp.setY(i, y);
    }
    floorGeo.computeVertexNormals();
    const floor = new THREE.Mesh(floorGeo, rockMat);
    scene.add(floor);

    // ---- mouth glows (the throats) ----
    scene.add(this.mouthGlows());
    // ---- black smoke plumes ----
    scene.add(this.plumes(rng));
    // ---- drifting particulates (with bokeh) ----
    scene.add(this.particulates(rng));
    // ---- heat shimmer ----
    scene.add(this.shimmer());
    // ---- micelles near the protocell ----
    scene.add(this.micelles(rng));
    // ---- the protocell ----
    this.membrane = this.buildMembrane();
    scene.add(this.membrane);
    scene.add(this.spark());
  }

  private rockMaterial(): THREE.MeshStandardNodeMaterial {
    const m = new THREE.MeshStandardNodeMaterial({ roughness: 0.92, metalness: 0.0 });
    const p = positionWorld;
    const n1 = mx_fractal_noise_float(p.mul(1.7), 4, 2.0, 0.5);
    const n2 = mx_noise_float(p.mul(vec3(6.0, 2.5, 6.0)));
    const basalt = vec3(0.028, 0.025, 0.023);
    const sulfide = vec3(0.16, 0.1, 0.035); // pyrite/chalcopyrite sheen
    const rust = vec3(0.09, 0.035, 0.015);
    const carbonate = vec3(0.13, 0.125, 0.12);
    let albedo = mix(basalt, rust, sstep(0.1, 0.5, n1).mul(0.6));
    albedo = mix(albedo, sulfide, sstep(0.35, 0.65, n2).mul(0.5));
    // carbonate frost on upward-facing ledges
    const up = sstep(0.55, 0.9, normalWorld.y);
    albedo = mix(albedo, carbonate, up.mul(sstep(0.0, 0.6, n1.add(0.2))).mul(0.55));
    m.colorNode = albedo;
    m.roughnessNode = mix(float(0.95), float(0.55), sstep(0.35, 0.65, n2));
    // crusty mineral relief
    m.normalNode = normalize(T.normalView.add(T.mx_noise_vec3(p.mul(7.0)).mul(0.55)).add(T.mx_noise_vec3(p.mul(23.0)).mul(0.25)));
    // glowing veins near each mouth (thermal cracks)
    let em: N = vec3(0);
    for (const mo of MOUTHS) {
      const d = length(p.sub(vec3(mo.x, mo.y, mo.z)));
      const near = exp(d.mul(-6.0));
      const mottle = mx_noise_float(p.mul(vec3(9.0, 3.0, 9.0))).mul(0.5).add(0.5).clamp(0.0, 1.0);
      em = em.add(vec3(1.0, 0.26, 0.05).mul(near.mul(mottle.pow(3.0)).mul(0.5)).add(vec3(1.0, 0.33, 0.07).mul(exp(d.mul(-16.0)).mul(0.7))));
    }
    m.emissiveNode = em.mul(this.uGlow);
    return m;
  }

  private mouthGlows(): THREE.Object3D {
    const g = new THREE.Group();
    const n = MOUTHS.length;
    const a = new Float32Array(n * 4);
    MOUTHS.forEach((m, i) => a.set([m.x, m.y + 0.12, m.z, i === 0 ? 1 : 0.55], i * 4));
    const glow = this.uGlow;
    const t = this.uPT;
    g.add(
      makeParticles({
        count: n,
        attributes: { a: [a, 4] },
        renderOrder: 5,
        softness: 3.0,
        build: (at) => {
          const flick = float(0.85).add(sin(t.mul(7.3).add(at.a.w.mul(10.0))).mul(0.06)).add(sin(t.mul(13.1)).mul(0.04));
          return { center: at.a.xyz.sub(vec3(0, 0.1, 0)), size: at.a.w.mul(0.55), color: vec3(1.0, 0.22, 0.04).mul(glow.mul(flick).mul(at.a.w).mul(0.45)) };
        },
      }),
    );
    // wide warm haze around each mouth
    g.add(
      makeParticles({
        count: n,
        attributes: { a: [a, 4] },
        renderOrder: 4,
        softness: 1.6,
        build: (at) => ({ center: at.a.xyz.add(vec3(0, 0.9, 0)), size: at.a.w.mul(5.0), color: vec3(0.7, 0.14, 0.03).mul(glow.mul(at.a.w).mul(0.022)) }),
      }),
    );
    // throat core
    g.add(
      makeParticles({
        count: n,
        attributes: { a: [a, 4] },
        renderOrder: 6,
        softness: 4.0,
        build: (at) => ({ center: at.a.xyz.sub(vec3(0, 0.16, 0)), size: at.a.w.mul(0.2), color: vec3(1.0, 0.42, 0.12).mul(glow.mul(at.a.w).mul(1.6)) }),
      }),
    );
    return g;
  }

  private plumes(rng: Rng): THREE.Object3D {
    const per = 700;
    const n = per * MOUTHS.length;
    const a = new Float32Array(n * 4);
    const b = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const m = MOUTHS[Math.floor(i / per)]!;
      const w = i < per ? 1 : 0.6;
      a.set([m.x, m.y, m.z, rng.next()], i * 4);
      b.set([rng.next(), rng.next(), rng.next(), w], i * 4);
    }
    const t = this.uPT;
    const glow = this.uGlow;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      blending: THREE.NormalBlending,
      renderOrder: 7,
      build: (at) => {
        const life = float(7.0);
        const ph = fract(at.a.w.add(t.div(life)));
        const h = ph.pow(0.8).mul(9.0).mul(at.b.w);
        const swirl = vec3(
          mx_noise_float(vec3(at.b.x.mul(9.0), h.mul(0.35), t.mul(0.15))),
          float(0),
          mx_noise_float(vec3(at.b.y.mul(9.0), h.mul(0.35), t.mul(0.15).add(5.0))),
        ).mul(h.mul(0.22).add(0.08));
        const spread = vec3(at.b.x.sub(0.5), 0, at.b.y.sub(0.5)).mul(h.mul(0.35).add(0.1));
        const center = at.a.xyz.add(vec3(0, h.add(0.02), 0)).add(swirl).add(spread).add(vec3(h.mul(0.06), 0, 0));
        const size = h.mul(0.3).add(0.14).mul(at.b.w.add(0.2));
        // lit from below by the throat: warm at the base, near-black higher up
        const lit = exp(h.mul(-1.6)).mul(glow);
        const col = vec3(0.75, 0.16, 0.03).mul(lit.mul(0.65)).add(vec3(0.0022, 0.0018, 0.0016));
        const alpha = sstep(0.0, 0.03, ph).mul(float(1).sub(sstep(0.6, 1.0, ph))).mul(0.3).mul(this.uReveal.mul(0.5).add(0.5));
        return { center, size, color: col, alpha, rotation: at.b.z.mul(6.28).add(t.mul(0.2)) };
      },
    });
  }

  private particulates(rng: Rng): THREE.Object3D {
    const n = 7000;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let x: number, y: number, z: number;
      if (i < 1600) {
        // a denser veil around the protocell (seen in the macro shot)
        x = PROTOCELL.x + rng.normal(0, 0.16);
        y = PROTOCELL.y + rng.normal(0, 0.12);
        z = PROTOCELL.z + rng.normal(0, 0.16);
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
      softness: 1.2,
      build: (at) => {
        const s = at.a.w;
        const drift = vec3(
          sin(t.mul(0.21).add(s.mul(40.0))).mul(0.12),
          t.mul(0.05).mul(s.add(0.3)),
          cos(t.mul(0.17).add(s.mul(23.0))).mul(0.12),
        );
        const p = at.a.xyz.add(drift);
        // light from the three mouths
        let L: N = float(0);
        MOUTHS.forEach((m, i) => {
          const d2 = p.sub(vec3(m.x, m.y + 0.4, m.z)).dot(p.sub(vec3(m.x, m.y + 0.4, m.z)));
          L = L.add(float(i === 0 ? 3.2 : 1.6).div(d2.add(0.6)));
        });
        // protocell spark light (macro)
        const ds = p.sub(vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z));
        const Ls = this.uSparkI.mul(0.004).div(ds.dot(ds).add(0.002));
        // fake depth of field: circle of confusion grows the sprite and spreads its energy
        const viewP = cameraViewMatrix.mul(modelWorldMatrix.mul(vec4(p, 1.0)));
        const depth = viewP.z.negate().max(0.01);
        const coc = abs(depth.sub(focus)).div(depth).mul(aperture).mul(0.06);
        const base = s.mul(0.006).add(0.0025).mul(depth.mul(0.08).add(0.25));
        const size = base.add(coc);
        const energy = base.div(size).pow(1.3);
        const veil = sstep(0.9, 0.5, length(at.a.xyz.sub(vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z))));
        const vis = mix(float(1.0), this.uAperture.clamp(0.0, 1.0), veil);
        const col = vec3(1.0, 0.55, 0.25).mul(L.mul(glow)).add(vec3(this.uSpark).mul(Ls)).mul(energy).mul(0.3).mul(vis);
        return { center: p, size, color: col };
      },
    });
  }

  private shimmer(): THREE.Object3D {
    // heat haze: a column that refracts what is behind it
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const t = this.uPT;
    const q = uv();
    const w = sstep(0.0, 0.25, q.x).mul(sstep(1.0, 0.75, q.x)).mul(sstep(0.0, 0.15, q.y)).mul(sstep(1.0, 0.35, q.y));
    const n = mx_noise_float(vec3(q.x.mul(6.0), q.y.mul(4.0).sub(t.mul(1.6)), t.mul(0.4)));
    // a warm wavering sheen (stand-in for refraction; additive and subtle)
    mat.colorNode = vec4(vec3(1.0, 0.4, 0.1).mul(n.abs().pow(3.0).mul(w).mul(this.uGlow).mul(0.35)), 1.0);
    for (let i = 0; i < MOUTHS.length; i++) {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 3.2), mat);
      m.position.copy(MOUTHS[i]!).add(new THREE.Vector3(0, 1.75, 0));
      m.scale.setScalar(i === 0 ? 1 : 0.6);
      m.renderOrder = 8;
      m.userData.billboard = true;
      g.add(m);
    }
    g.userData.billboards = g.children;
    return g;
  }

  private micelles(rng: Rng): THREE.Object3D {
    // fatty-acid vesicles drifting near the protocell: tiny iridescent rings
    const n = 260;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      a.set([PROTOCELL.x + rng.normal(0, 0.22), PROTOCELL.y + rng.normal(0, 0.16), PROTOCELL.z + rng.normal(0, 0.22), rng.next()], i * 4);
    }
    const t = this.uPT;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 11,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(t.mul(0.3).add(s.mul(30.0))), cos(t.mul(0.23).add(s.mul(17.0))), sin(t.mul(0.27).add(s.mul(11.0)))).mul(0.02));
        const size = s.mul(0.0022).add(0.0009);
        const irid = vec3(0.5).add(vec3(cos(s.mul(12.0)), cos(s.mul(12.0).add(2.1)), cos(s.mul(12.0).add(4.2))).mul(0.5));
        const vis = this.uAperture.mul(1.2).min(1.0);
        return {
          center: p,
          size,
          color: irid.mul(0.6).add(0.2).mul(vis).mul(0.22),
          shape: (q: N) => {
            const r = length(q);
            return sstep(0.35, 0.92, r).mul(sstep(1.0, 0.9, r)).mul(0.8).add(sstep(1.0, 0.0, r).mul(0.15));
          },
        };
      },
    });
  }

  private buildMembrane(): THREE.Mesh {
    // parametric spherical cap (u: polar fraction, v: azimuth) shaped in the vertex stage
    const nu = 64, nv = 96;
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

    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const q = attribute('uv', 'vec2');
    const thMax = this.uTheta;
    const Rf = this.uRadius;
    // area conservation: R = Rf * sqrt(2 / (1 - cos θmax))
    const R = Rf.mul(float(2.0).div(float(1.0).sub(cos(thMax))).sqrt());
    const th = q.x.mul(thMax);
    const ph = q.y.mul(Math.PI * 2);
    const wob = mx_noise_float(vec3(q.x.mul(3.0), q.y.mul(6.0), this.uPT.mul(0.5))).mul(Rf.mul(0.045)).mul(float(1).sub(this.uClosed.mul(0.7)));
    const rr = R.add(wob);
    // pole at the bottom; sphere centre sits at +R above the pole. Final centre = protocell.
    const local = vec3(sin(th).mul(cos(ph)).mul(rr), R.sub(cos(th).mul(rr)), sin(th).mul(sin(ph)).mul(rr));
    const pole = vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z).sub(vec3(0, Rf, 0));
    const world = pole.add(local);
    mat.positionNode = world;
    const vN = varying(normalize(local.sub(vec3(0, R, 0))));
    const vEdge = varying(q.x);
    const vW = varying(world);
    // thin-film interference: thickness varies over the bilayer
    const view = normalize(cameraPosition.sub(vW));
    const cosI = abs(dot(vN, view)).clamp(0.0, 1.0);
    const thick = float(330.0).add(mx_noise_float(vW.mul(180.0).add(vec3(0, this.uPT.mul(0.3), 0))).mul(170.0));
    const sinT2 = float(1.0).sub(cosI.mul(cosI)).div(1.33 * 1.33);
    const cosT = float(1.0).sub(sinT2).sqrt();
    const opd = thick.mul(2.0 * 1.33).mul(cosT);
    const film = vec3(0.5).sub(cos(opd.mul(vec3(2 * Math.PI / 650, 2 * Math.PI / 532, 2 * Math.PI / 450))).mul(0.5));
    const fres = float(1.0).sub(cosI).clamp(0.0, 1.0).pow(2.2);
    const rim = sstep(0.82, 1.0, vEdge).mul(float(1).sub(this.uClosed));
    const inner = vec3(this.uSpark).mul(this.uSparkI.mul(0.008));
    const warm = vec3(1.0, 0.55, 0.25).mul(0.25);
    const col = film.mul(fres.mul(0.85).add(0.02)).mul(inner.add(warm).add(0.2)).add(vec3(1.0, 0.85, 0.7).mul(rim.mul(0.2)));
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
    // halo
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 14,
        softness: 2.2,
        build: (at) => ({ center: at.a.xyz, size: float(0.022), color: vec3(sc).mul(I.mul(0.01)) }),
      }),
    );
    // core
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 15,
        softness: 6.0,
        build: (at) => {
          const flick = float(1.0).add(sin(t.mul(31.0)).mul(0.08)).add(sin(t.mul(17.0)).mul(0.1));
          return { center: at.a.xyz, size: float(0.0035), color: vec3(sc).mul(I.mul(flick).mul(0.9)).add(vec3(I.mul(0.12))) };
        },
      }),
    );
    // chemistry: tiny satellite sparks flickering around the centre
    const n = 40;
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
          const blink = sstep(0.82, 1.0, sin(t.mul(s.mul(9.0).add(4.0)).add(s.mul(50.0))));
          const r = this.uRadius.mul(0.55).mul(float(1).sub(this.uClosed.mul(0.4)));
          const p = vec3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z).add(normalize(at.a.xyz).mul(r.mul(s.add(0.3))));
          return { center: p, size: float(0.0012), color: vec3(sc).mul(blink.mul(I).mul(0.35)) };
        },
      }),
    );
    // inner glow once closed
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 13,
        softness: 1.5,
        build: (at) => ({ center: at.a.xyz, size: this.uRadius.mul(1.9), color: vec3(sc).mul(this.uClosed.mul(I).mul(0.0025)) }),
      }),
    );
    return g;
  }

  /** Drive everything from prologue-local time (pure function → the Return is identical). */
  setPrologueTime(pt: number, spark: THREE.Color): void {
    this.pt = pt;
    this.uPT.value = pt;
    const glow = smoothstep(0.5, 3.4, pt) * (0.92 + 0.08 * noise1(pt * 1.7, 5));
    this.uGlow.value = glow;
    this.uReveal.value = smoothstep(2.6, 6.0, pt);
    (this.uSpark.value as THREE.Color).copy(spark);
    // the spark: a glint from ~4 s, kindles when the membrane closes (~9.1 s)
    const close = smoothstep(6.9, 9.1, pt);
    const kindle = smoothstep(9.05, 9.35, pt);
    const flare = Math.exp(-Math.pow((pt - 9.25) / 0.18, 2));
    this.uSparkI.value = smoothstep(3.6, 6.5, pt) * 3 + kindle * 7 + flare * 9;
    const th = lerp(0.42, Math.PI, easeInOutCubic(close));
    this.uTheta.value = th;
    this.uRadius.value = 0.034;
    this.uClosed.value = smoothstep(8.85, 9.2, pt);
    this.uMembraneA.value = smoothstep(6.0, 7.2, pt);
    this.uHaze.value = smoothstep(6.6, 8.2, pt) * 0.18;
    const flick = 0.85 + 0.15 * noise1(pt * 3.1, 9);
    this.lights[0]!.intensity = glow * 24 * flick;
    this.lights[1]!.intensity = glow * 11 * flick;
    this.lights[2]!.intensity = glow * 9 * flick;
    this.lights[3]!.intensity = this.uReveal.value * 160;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const off = Number(shot.def.params?.offset ?? 0);
    const pt = clamp01((off + shot.t) / 10) * 10;
    this.setPrologueTime(pt, f.spark);
    const p = ventPath(pt);
    this.uFocus.value = p.focus ?? 10;
    this.uAperture.value = p.aperture ?? 0;
    // billboards face the camera
    this.scene.traverse((o) => {
      if (o.userData.billboard) o.quaternion.copy(this.camera.quaternion);
    });
  }
}
