import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { GALAXIES, armDensity, buildUniverse, galaxyCenter, galaxyRotation, nodePos, COLLISION_T, MERGED_T, KPC_LY, type Universe } from '../../galaxy/universe';
import { STAR, type GEvent } from '../../galaxy/GalaxySim';
import type { GalaxyHost } from '../../galaxy/GalaxyHost';
import { vnoise } from '../tsl/noiseTex';

const {
  uniform, uniformArray, vec2, vec3, vec4, float, mix, smoothstep: sst, max, min, abs, exp, sin, cos, fract, length, normalize, dot, clamp, floor,
  modelViewMatrix, select, Fn,
} = T;

/** particle budget multiplier, set by the App from the quality tier before the stage is built */
export let galaxyParticleScale = 1;
export function setGalaxyParticleScale(s: number): void {
  galaxyParticleScale = s;
}

const STAR_BUDGET = [380000, 40000, 18000, 280000, 70000];
const MAXF = 12;
const MAX_STREAKS = 900;
const MAX_AGENTS = 1400;
const TRAIL = 10;
const VIS_INDEX: Record<string, number> = { hexlattice: 0, cubic: 1, rings: 2, fractalhex: 3, filaments: 4, haze: 5, spokes: 6, squares: 7 };

/**
 * THE LOCAL GROUP. A million stars in five galaxies (spiral density waves,
 * bulges, dust lanes, emission nebulae), the strategic graph's territories in
 * each faction's visual language, interference patterns on contested fronts,
 * streaks for kill vehicles, probes and fleets, beams, novae, and the bubble.
 */
export class GalaxyStage extends Stage {
  readonly name = 'galaxy';
  readonly u = {
    time: uniform(0),
    focalPx: uniform(1000),
    galC: uniformArray(Array.from({ length: 5 }, () => new THREE.Vector4()), 'vec4'),
    sep: uniform(new THREE.Vector3(1, 0, 0)),
    tidal: uniform(0),
    puff: uniform(0),
    vacC: uniform(new THREE.Vector3()),
    vacR: uniform(-1),
    starGain: uniform(1),
    territory: uniform(1),
    dust: uniform(1),
    fcol: uniformArray(Array.from({ length: MAXF }, () => new THREE.Vector4(1, 1, 1, 0)), 'vec4'),
    camRight: uniform(new THREE.Vector3(1, 0, 0)),
    camUp: uniform(new THREE.Vector3(0, 1, 0)),
    saturate: uniform(0),
    satColor: uniform(new THREE.Vector3(1, 1, 1)),
    fade: uniform(1),
    /** Coda: seconds into the Coda (−1 before it), per-galaxy saturation flags */
    codaC: uniform(-1),
    fscale: uniformArray(Array.from({ length: MAXF }, () => new THREE.Vector4(1, 0, 1, 0)), 'vec4'),
    /** contested-front fringes: radians per world unit, so a stripe is ~1.4 % of frame height */
    fringeK: uniform(30),
    /** how much of a territory's interior is drawn (the Expansion shows mostly its front) */
    interior: uniform(1),
    satGal: uniformArray(Array.from({ length: 5 }, () => new THREE.Vector4()), 'vec4'),
  };
  private uni!: Universe;
  private nodeState!: THREE.InstancedBufferAttribute;
  private stateArr!: Float32Array;
  private streakAttrs!: Record<string, THREE.InstancedBufferAttribute>;
  private streakMesh!: THREE.Mesh;
  private flares!: Record<string, THREE.InstancedBufferAttribute>;
  private flareMesh!: THREE.Mesh;
  private bubble!: THREE.Mesh;
  private lastVersion = -1;
  private contested!: Uint8Array;
  private second!: Int8Array;
  private terrA!: Float32Array;
  private frontTau = 0.3;
  private nbArr!: Float32Array;
  private nbAttr!: THREE.InstancedBufferAttribute;
  /** the Contest beat on screen: its protagonist, its place, its moment */
  private beat = { hero: -1, other: -1, node: -1, t: 0, type: '', flareF: -1 };
  private evBuf: GEvent[] = [];
  private agNode = new Int32Array(MAX_AGENTS);
  private agOwner = new Int8Array(MAX_AGENTS);
  private agT = new Float64Array(MAX_AGENTS);
  private tmp: [number, number, number] = [0, 0, 0];
  private tmp2: [number, number, number] = [0, 0, 0];

  build(): void {
    this.post = { bloom: 0.32, threshold: 0.6, exposure: 1.0, grain: 0.03, vignette: 0.42, chroma: 0.0012 };
    this.camera.near = 0.05;
    this.camera.far = 2e5;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.uni = buildUniverse();
    this.contested = new Uint8Array(this.uni.n);
    this.second = new Int8Array(this.uni.n).fill(-1);
    this.scene.add(this.farGalaxies());
    this.scene.add(this.stars());
    this.scene.add(this.nebulae());
    this.scene.add(this.dustLanes());
    this.scene.add(this.territories());
    this.streakMesh = this.streaks();
    this.scene.add(this.streakMesh);
    this.flareMesh = this.flaresLayer();
    this.scene.add(this.flareMesh);
    this.bubble = this.vacuumBubble();
    this.scene.add(this.bubble);
  }

  // ---------------------------------------------------------------- helpers

  /** world position of a star/node offset (already rotated into the galaxy's orientation) for galaxy g */
  private place(off: N, g: N, seed: N): N {
    const u = this.u;
    const c = u.galC.element(g.toInt()).xyz;
    // tidal stretch along the line between the colliding disks, and the slow
    // puffing of the merged remnant into a spheroid
    const isMW = g.lessThan(0.5).or(g.greaterThan(2.5).and(g.lessThan(3.5)));
    const r = length(off);
    const along = dot(off, u.sep);
    // tidal tails: the outer disk is drawn out along the line of approach and swept sideways,
    // opposite ways on the near and far sides (an S of stars and a bridge between the pair)
    const tang = normalize(T.cross(u.sep, vec3(0.0, 1.0, 0.0)).add(vec3(0.0001, 0.0, 0.0)));
    const outer = sst(6.0, 16.0, r);
    const tidal = u.sep.mul(along.mul(u.tidal).mul(sst(4.0, 14.0, r))).add(tang.mul(along.mul(u.tidal).mul(outer).mul(1.8)));
    // an isotropic direction from two decorrelated hashes of the star's seed
    const th = fract(seed.mul(9187.31)).mul(6.2832);
    const zz = fract(seed.mul(4273.13)).mul(2.0).sub(1.0);
    const rr = float(1.0).sub(zz.mul(zz)).max(0.0).sqrt();
    const dir = vec3(rr.mul(cos(th)), zz.mul(0.7), rr.mul(sin(th)));
    const puffed = mix(off, dir.mul(r.mul(0.75)), u.puff.mul(sst(1.0, 6.0, r)));
    const o2 = select(isMW, puffed.add(tidal), off);
    return c.add(o2);
  }

  /** keep tiny sources at ≥ ~1.3 px; conserve their flux as they grow */
  private pxSize(center: N, worldSize: N, maxPx = 0, minPx = 1.3): [N, N] {
    const vz = modelViewMatrix.mul(vec4(center, 1.0)).z.negate().max(0.01);
    const minS = vz.mul(minPx).div(this.u.focalPx);
    let s = max(worldSize, minS);
    const flux = worldSize.div(s).pow(2.0);
    // stars stay points even when the camera passes close to them
    if (maxPx > 0) s = min(s, vz.mul(maxPx).div(this.u.focalPx));
    return [s, flux];
  }

  private erased(p: N): N {
    const u = this.u;
    return select(u.vacR.greaterThan(0.0).and(length(p.sub(u.vacC)).lessThan(u.vacR)), float(0.0), float(1.0));
  }

  // ---------------------------------------------------------------- layers

  private farGalaxies(): THREE.Object3D {
    const rng = new Rng(0xfa7, 3);
    const n = 700;
    const a = new Float32Array(n * 4), b = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rng.normal(), rng.normal(), rng.normal()).normalize().multiplyScalar(rng.range(3000, 30000));
      a.set([v.x, v.y, v.z, rng.range(6, 40)], i * 4);
      b.set([rng.next(), rng.next(), rng.next(), rng.next()], i * 4);
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      renderOrder: 1,
      softness: 2.5,
      build: (at) => {
        const [s, flux] = this.pxSize(at.a.xyz, at.a.w);
        // the horizon closes: each distant galaxy reddens and goes out, one by one
        const tOut = at.b.w.mul(4.6).add(3.9);
        const k = select(u.codaC.lessThan(0.0), float(0.0), sst(tOut.sub(0.9), tOut, u.codaC));
        const base = mix(vec3(1.0, 0.82, 0.6), vec3(0.7, 0.8, 1.0), at.b.x);
        // a whole galaxy's light in a pixel or two: give the candles a visible minimum
        const inCoda = select(u.codaC.greaterThan(0.0), float(1.0), float(0.0));
        const lum = flux.max(0.035).mul(inCoda.mul(3.0).add(1.0));
        const col = mix(base, vec3(1.0, 0.12, 0.03), sst(0.0, 0.6, k)).mul(float(1.0).sub(k)).mul(0.6).mul(lum).mul(u.fade);
        return { center: at.a.xyz, size: s.max(at.a.xyz.length().mul(inCoda.mul(2.5).add(2.2)).div(u.focalPx)), color: col, rotation: at.b.z.mul(6.28) };
      },
    });
  }

  private stars(): THREE.Object3D {
    const rng = new Rng(0x57a2, 5);
    const counts = STAR_BUDGET.map((c) => Math.floor(c * galaxyParticleScale));
    const n = counts.reduce((x, y) => x + y, 0);
    const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    let k = 0;
    for (let g = 0; g < 5; g++) {
      // the stars use a more open, two-armed reading of the same spiral (minor arms fainter)
      const G0 = GALAXIES[g]!;
      const G = g === 0 ? { ...G0, pitch: G0.pitch * 1.18, arms: G0.arms.map((a) => ({ ...a, strength: a.strength < 0.9 ? 0.38 : 1 })) } : G0;
      const R = galaxyRotation(g);
      for (let i = 0; i < counts[g]!; i++) {
        let x = 0, y = 0, z = 0, temp = 0.5, lum = 1, kind = 0;
        const roll = rng.next();
        if (roll < G.bulge * 1.6 + 0.02) {
          // bulge / halo: old, warm, smooth
          const r = -(g === 3 ? 1.4 : 0.9) * Math.log(1 - rng.next() * 0.985);
          const ct = rng.range(-1, 1), ph = rng.range(0, 6.2832), st = Math.sqrt(1 - ct * ct);
          x = r * st * Math.cos(ph);
          y = r * ct * 0.62;
          z = r * st * Math.sin(ph);
          temp = rng.range(0.0, 0.3);
          lum = 0.2 + rng.next() * 0.3;
          kind = 1;
        } else if (roll < G.bulge * 1.6 + G.bar + 0.02) {
          const bx = rng.normal(0, G.barLen * 0.42), bz = rng.normal(0, G.barLen * 0.13);
          x = bx * Math.cos(0.45) - bz * Math.sin(0.45);
          z = bx * Math.sin(0.45) + bz * Math.cos(0.45);
          y = rng.normal(0, G.thickness * 0.8);
          temp = rng.range(0.05, 0.4);
          lum = 0.7 + rng.next() * 0.6;
          kind = 1;
        } else {
          // disk: old stars everywhere, young blue stars crowd the arms
          let r = 0, th = 0, d = 0;
          // Andromeda is an older, redder, dustier disk than ours: fewer young blue stars
          const young = rng.next() < (g === 3 ? 0.12 : 0.4);
          for (let tries = 0; tries < 40; tries++) {
            // surface density ∝ e^(−r/h): radii are Gamma(2)-distributed (a quarter keep a steeper inner profile)
            const u1 = 1 - rng.next() * 0.996;
            r = rng.next() < 0.25 ? -G.scale * Math.log(u1) : -G.scale * Math.log(u1 * (1 - rng.next() * 0.996));
            if (r > G.radius * 1.1) continue;
            th = rng.range(0, 6.2832);
            [d] = armDensity(G, r, th);
            const ring = g === 3 ? Math.exp(-(((r - 10) / 1.2) ** 2)) : 0;
            const dd = Math.max(d, ring);
            const p = G.arms.length ? (young ? 0.04 + 0.96 * dd ** 1.5 : 0.35 + 0.65 * dd) : 1;
            if (rng.next() < p * (1 - G.irregular * 0.6) + G.irregular * 0.6) break;
          }
          if (G.irregular > 0.3 && rng.next() < G.irregular * 0.55) {
            const kk = rng.int(0, 5);
            const kr = (0.25 + 0.6 * ((kk * 0.618) % 1)) * G.radius, kth = kk * 2.4;
            r = r * 0.45 + kr * 0.55;
            th = th * 0.35 + kth * 0.65;
          }
          x = r * Math.cos(th);
          z = r * Math.sin(th);
          y = rng.normal(0, G.thickness * (young ? 0.45 : 1.1) * (1 + r / 15));
          temp = young ? rng.range(0.65, 1.0) : g === 3 ? rng.range(0.02, 0.4) : rng.range(0.15, 0.6);
          lum = young ? 0.5 + Math.pow(rng.next(), 4) * 4 : 0.5 + rng.next() * 0.6;
          kind = young ? 2 : 0;
        }
        const wx = R[0]! * x + R[1]! * y + R[2]! * z;
        const wy = R[3]! * x + R[4]! * y + R[5]! * z;
        const wz = R[6]! * x + R[7]! * y + R[8]! * z;
        A.set([wx, wy, wz, g], k * 4);
        B.set([temp, lum, rng.next(), kind], k * 4);
        k++;
      }
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [A, 4], b: [B, 4] },
      renderOrder: 3,
      softness: 2.2,
      build: (at) => {
        const p = this.place(at.a.xyz, at.a.w, at.b.z);
        const [s, flux] = this.pxSize(p, float(0.035).add(at.b.y.mul(0.012)), 3.2);
        const warm = vec3(1.0, 0.72, 0.45), white = vec3(1.0, 0.95, 0.88), blue = vec3(0.62, 0.76, 1.0);
        const t = at.b.x;
        let col: N = mix(mix(warm, white, sst(0.0, 0.5, t)), blue, sst(0.5, 1.0, t));
        // the victor's colour floods everything it holds (Coda)
        col = mix(col, u.satColor, u.saturate.mul(0.85).mul(u.satGal.element(at.a.w.toInt()).x));
        const vis = this.erased(p).mul(u.fade);
        return { center: p, size: s, color: col.mul(at.b.y).mul(flux).mul(0.16).mul(u.starGain).mul(vis) };
      },
    });
  }

  private nebulae(): THREE.Object3D {
    const rng = new Rng(0x4e8, 2);
    const n = Math.floor(4000 * Math.max(0.5, galaxyParticleScale));
    const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const g = rng.next() < 0.62 ? 0 : rng.next() < 0.7 ? 3 : rng.pick([1, 4]);
      const G = GALAXIES[g]!;
      const R = galaxyRotation(g);
      let x = 0, y = 0, z = 0, kind = 0, size = 0.3;
      if (i < n * 0.08) {
        // bulge glow
        const r = Math.abs(rng.normal(0, g === 3 ? 2.2 : 1.4));
        const ph = rng.range(0, 6.28);
        x = r * Math.cos(ph);
        z = r * Math.sin(ph);
        y = rng.normal(0, 0.5);
        kind = 1;
        size = rng.range(1.5, 4);
      } else {
        let r = 0, th = 0;
        for (let tries = 0; tries < 40; tries++) {
          r = -G.scale * Math.log(1 - rng.next() * 0.99);
          if (r > G.radius) continue;
          th = rng.range(0, 6.28);
          const [d] = armDensity(G, r, th);
          if (rng.next() < (G.arms.length ? d ** 2 : 0.6)) break;
        }
        x = r * Math.cos(th);
        z = r * Math.sin(th);
        y = rng.normal(0, 0.08);
        kind = 0;
        size = rng.range(0.15, 0.7);
      }
      A.set([R[0]! * x + R[1]! * y + R[2]! * z, R[3]! * x + R[4]! * y + R[5]! * z, R[6]! * x + R[7]! * y + R[8]! * z, g], i * 4);
      B.set([size, kind, rng.next(), rng.next()], i * 4);
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [A, 4], b: [B, 4] },
      renderOrder: 4,
      build: (at) => {
        const p = this.place(at.a.xyz, at.a.w, at.b.z);
        const [s, flux] = this.pxSize(p, at.b.x, 160);
        const hii = mix(vec3(1.0, 0.38, 0.5), vec3(0.85, 0.45, 1.0), at.b.w);
        const core = vec3(1.0, 0.8, 0.55);
        const col = select(at.b.y.greaterThan(0.5), core.mul(0.035), hii.mul(0.05)).mul(flux).mul(this.erased(p)).mul(u.fade).mul(float(1.0).sub(u.saturate.mul(0.7)));
        return {
          center: p,
          size: s,
          color: col,
          shape: (q: N) => {
            const r = length(q);
            const nz = vnoise(vec3(q.mul(2.2), at.b.z.mul(17.0)), 'r').mul(0.5).add(0.5);
            return float(1.0).sub(r).max(0.0).pow(1.6).mul(nz.mul(0.8).add(0.3));
          },
        };
      },
    });
  }

  private dustLanes(): THREE.Object3D {
    const rng = new Rng(0xd057, 2);
    const n = Math.floor(30000 * Math.max(0.4, galaxyParticleScale));
    const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const g = rng.next() < 0.7 ? 0 : 3;
      const G = GALAXIES[g]!;
      const R = galaxyRotation(g);
      let r = 0, th = 0;
      for (let tries = 0; tries < 40; tries++) {
        r = -G.scale * Math.log(1 - rng.next() * 0.99);
        if (r < 1.2 || r > G.radius * 0.95) continue;
        // dust sits on the inner (trailing) edge of each arm
        th = rng.range(0, 6.28);
        const [d] = armDensity(G, r, th + 0.12);
        if (rng.next() < d ** 1.5) break;
      }
      const x = r * Math.cos(th), z = r * Math.sin(th), y = rng.normal(0, 0.06);
      A.set([R[0]! * x + R[1]! * y + R[2]! * z, R[3]! * x + R[4]! * y + R[5]! * z, R[6]! * x + R[7]! * y + R[8]! * z, g], i * 4);
      B.set([rng.range(0.2, 0.6), rng.next(), rng.next(), 0], i * 4);
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [A, 4], b: [B, 4] },
      renderOrder: 5,
      blending: THREE.NormalBlending,
      build: (at) => {
        const p = this.place(at.a.xyz, at.a.w, at.b.z);
        const [s] = this.pxSize(p, at.b.x, 70);
        return {
          center: p,
          size: s,
          color: vec3(0.012, 0.008, 0.006),
          alpha: float(0.22).mul(u.dust).mul(this.erased(p)).mul(u.fade),
          shape: (q: N) => {
            const nz = vnoise(vec3(q.mul(1.7), at.b.y.mul(23.0)), 'g').mul(0.5).add(0.5);
            return float(1.0).sub(length(q)).max(0.0).pow(1.2).mul(nz);
          },
        };
      },
    });
  }

  private territories(): THREE.Object3D {
    const un = this.uni;
    const n = un.n;
    const A = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const g = un.gal[i]!;
      const R = galaxyRotation(g);
      const x = un.lx[i]!, y = un.ly[i]!, z = un.lz[i]!;
      A.set([R[0]! * x + R[1]! * y + R[2]! * z, R[3]! * x + R[4]! * y + R[5]! * z, R[6]! * x + R[7]! * y + R[8]! * z, g], i * 4);
    }
    // each node's sprite covers its own neighbourhood, so territory reads as a continuous field
    const Bz = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      let sum = 0, c = 0;
      for (let e = un.nbrStart[i]!; e < un.nbrStart[i + 1]!; e++) {
        const j = un.nbr[e]!;
        sum += Math.hypot(un.lx[i]! - un.lx[j]!, un.ly[i]! - un.ly[j]!, un.lz[i]! - un.lz[j]!);
        c++;
      }
      Bz[i * 4] = Math.min(2.0, Math.max(0.55, (c ? sum / c : 0.3) * 3.5));
    }
    this.stateArr = new Float32Array(n * 4).fill(-1);
    this.terrA = A;
    this.nbArr = new Float32Array(n * 4);
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { a: [A, 4], st: [this.stateArr, 4], b: [Bz, 4], nb: [this.nbArr, 4] },
      renderOrder: 6,
      build: (at) => {
        const p = this.place(at.a.xyz, at.a.w, float(0.37));
        const owner = at.st.x;
        const has = owner.greaterThan(-0.5);
        const oi = owner.max(0.0).toInt();
        const fc = u.fcol.element(oi);
        const sc = u.fcol.element(at.st.w.max(0.0).toInt());
        const glow = at.st.y;
        const contested = at.st.z;
        const [s, flux] = this.pxSize(p, at.b.x, 110);
        // world-space coordinate of each fragment, for patterns that line up across sprites
        const vis = select(has, float(1.0), float(0.0)).mul(this.erased(p)).mul(u.territory).mul(u.fade);
        const vVis = T.varying(vis.mul(flux));
        // small powers are drawn brighter, so a rival's territory reads against an empire;
        // during a Contest beat its protagonist is lifted and everyone else recedes
        const presence = u.fscale.element(oi).x;
        const frontK = u.fscale.element(oi).z;
        // fringes stay off the galactic core
        const offCore = sst(1.6, 3.6, length(at.a.xyz));
        return {
          center: p,
          size: s,
          color: fc.xyz,
          alpha: float(1.0),
          fragment: (q: N) =>
            Fn(() => {
              const wp = p.add(u.camRight.mul(q.x.mul(s).mul(0.5))).add(u.camUp.mul(q.y.mul(s).mul(0.5)));
              const style = fc.w;
              const r = length(q);
              // broad gaussians: many overlap, so their sum is a smooth field
              const fall = exp(r.mul(r).mul(-4.0)).sub(0.018).max(0.0);
              // patterns live on the galactic plane, not on each billboard: trace this fragment's view
              // ray to the plane through the node, so the lattice is one continuous sheet across sprites
              // (billboard coordinates are kept for grazing views, where the plane is edge-on)
              const camP = T.cameraPosition;
              const vdir = normalize(wp.sub(camP));
              const dn = vdir.y;
              const tP = p.y.sub(camP.y).div(select(abs(dn).greaterThan(0.02), dn, float(0.02)));
              const onPlane = camP.add(vdir.mul(tP));
              const wq = mix(wp, onPlane, sst(0.1, 0.28, abs(dn)));
              const xz = vec2(wq.x, wq.z).add(vec2(wq.y.mul(0.5), wq.y.mul(-0.3)));
              const k = 7.0;
              const pat = float(0.0).toVar();
              // lattice lines fade where they would alias; a coarser octave (¼ the frequency) carries
              // the language into far views, so a whole-galaxy shot still shows hexes or cubes
              const fw = T.fwidth(xz.x.mul(k)).add(T.fwidth(xz.y.mul(k)));
              const crisp = sst(0.6, 0.15, fw);
              const crispF = sst(0.6, 0.15, fw.mul(0.25));
              const hex = (h1: N): N => {
                const ha = abs(fract(h1.x).sub(0.5));
                const hb = abs(fract(h1.x.mul(0.5).add(h1.y.mul(0.866))).sub(0.5));
                const hc = abs(fract(h1.x.mul(-0.5).add(h1.y.mul(0.866))).sub(0.5));
                return min(ha, min(hb, hc));
              };
              const lod = (near: N, far: N): N => mix(mix(float(0.18), far, crispF), near, crisp);
              // each faction's visual language; only its own branch is evaluated
              T.If(style.lessThan(0.5), () => {
                // hex lattice: cold, coherent
                pat.assign(lod(sst(0.06, 0.0, hex(xz.mul(k))), sst(0.07, 0.0, hex(xz.mul(k * 0.25)))));
              })
                .ElseIf(style.lessThan(1.5), () => {
                  // cubic lattice
                  const cub = (c: N): N => min(abs(fract(c.x).sub(0.5)), abs(fract(c.y).sub(0.5)));
                  pat.assign(lod(sst(0.06, 0.0, cub(xz.mul(k))), sst(0.07, 0.0, cub(xz.mul(k * 0.25)))));
                })
                .ElseIf(style.lessThan(2.5), () => {
                  // concentric rings
                  pat.assign(sst(0.25, 0.0, abs(fract(r.mul(3.0).sub(u.time.mul(0.2))).sub(0.5))));
                })
                .ElseIf(style.lessThan(3.5), () => {
                  // fractal hexes at two scales
                  const h1 = xz.mul(k);
                  const h2 = xz.mul(k * 3.0);
                  const a1 = min(abs(fract(h1.x).sub(0.5)), abs(fract(h1.x.mul(0.5).add(h1.y.mul(0.866))).sub(0.5)));
                  const a2 = min(abs(fract(h2.x).sub(0.5)), abs(fract(h2.x.mul(0.5).add(h2.y.mul(0.866))).sub(0.5)));
                  pat.assign(lod(sst(0.06, 0.0, a1).add(sst(0.07, 0.0, a2).mul(0.6)), sst(0.07, 0.0, hex(xz.mul(k * 0.25)))));
                })
                .ElseIf(style.lessThan(4.5), () => {
                  // organic filaments: ridged noise
                  const nz = vnoise(vec3(xz.mul(2.6), 0.3), 'g');
                  pat.assign(sst(0.12, 0.0, abs(nz)));
                })
                .ElseIf(style.lessThan(5.5), () => {
                  // haze: barely there
                  pat.assign(vnoise(vec3(xz.mul(9.0), u.time.mul(0.05)), 'b').mul(0.5).add(0.5).mul(0.35));
                })
                .ElseIf(style.lessThan(6.5), () => {
                  // spokes
                  pat.assign(sst(0.75, 1.0, cos(T.atan(q.y, q.x).mul(6.0).add(u.time.mul(0.6)))));
                })
                .Else(() => {
                  // nested squares
                  const cheb = max(abs(fract(xz.x.mul(k * 0.5)).sub(0.5)), abs(fract(xz.y.mul(k * 0.5)).sub(0.5)));
                  pat.assign(sst(0.06, 0.0, abs(fract(cheb.mul(4.0)).sub(0.5))));
                });
              // contested fronts: two wave fields beat against each other
              const w1 = sin(dot(xz, vec2(31.0, 17.0)).add(u.time.mul(3.0)));
              const w2 = sin(dot(xz, vec2(-13.0, 29.0)).sub(u.time.mul(2.3)));
              const moire = sst(0.3, 1.0, w1.mul(w2).abs()).mul(contested);
              // lattice lines fade where they would alias (far views keep only the tint)
              // (lattice styles resolve their own level of detail; the others fade to a flat tint)
              const latticeStyle = style.lessThan(1.5).or(style.greaterThan(2.5).and(style.lessThan(3.5)));
              const pv = select(latticeStyle, pat, mix(float(0.18), pat, crisp));
              // the interior keeps a faint lattice; the front draws it in light as it advances
              const base = pv.mul(0.009).add(0.0007).mul(presence).mul(u.interior);
              const front = glow.mul(pv.mul(0.07).add(0.012)).mul(frontK);
              // contested fronts: bands parallel to the border, alternating between the two powers'
              // colours, at a period fixed in screen terms (never a 1-px moiré)
              // the nodes on a front burn as tight soft points in their own power's colour: neighbours
              // along the border merge into a beaded line on each side, one line per power
              const fringe = exp(r.mul(r).mul(-16.0)).mul(contested).mul(offCore).mul(at.nb.w);
              void sc;
              // territory fills are drawn more saturated than the faction swatch (pale hues read as grey once summed)
              const fcol = fc.xyz;
              const lum = dot(fcol, vec3(0.2126, 0.7152, 0.0722));
              const fsat = mix(vec3(lum), fcol, 1.15).max(0.0);
              const col = fsat.mul(base.add(front).mul(float(1.0).sub(contested.mul(0.4)))).add(fsat.mul(fringe.mul(0.09).mul(frontK.min(1.2))));
              void moire;
              return vec4(col.mul(fall).mul(vVis), 1.0);
            })(),
        };
      },
    });
    this.nodeState = (mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>).st!;
    this.nbAttr = (mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>).nb!;
    return mesh;
  }

  /** kill vehicles, probes, fleets (moving heads with trails) and beams (solid lines) */
  private streaks(): THREE.Mesh {
    const n = MAX_STREAKS * TRAIL + MAX_AGENTS * 3;
    const e0 = new Float32Array(n * 4), e1 = new Float32Array(n * 4), e2 = new Float32Array(n * 4);
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { e0: [e0, 4], e1: [e1, 4], e2: [e2, 4] },
      renderOrder: 9,
      softness: 1.5,
      build: (at) => {
        const p = at.e0.xyz;
        // streaks stay legible at any scale: never thinner than a few pixels, never too faint
        const [s, flux0] = this.pxSize(p, at.e1.w, 0, 2.6);
        const flux = flux0.max(0.25);
        return { center: p, size: s, color: at.e2.xyz.mul(at.e2.w).mul(flux).mul(u.fade) };
      },
    });
    this.streakAttrs = mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>;
    (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
    return mesh;
  }

  /** novae and fresh black holes */
  private flaresLayer(): THREE.Mesh {
    const n = 256;
    const a = new Float32Array(n * 4), b = new Float32Array(n * 4);
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      renderOrder: 10,
      build: (at) => {
        const [s, flux] = this.pxSize(at.a.xyz, at.a.w);
        return {
          center: at.a.xyz,
          size: s,
          color: at.b.xyz.mul(flux).mul(u.fade),
          shape: (q: N) => {
            const r = length(q);
            const shell = exp(abs(r.sub(at.b.w)).mul(-18.0)).mul(0.6);
            return exp(r.mul(-9.0)).add(shell).mul(float(1.0).sub(r).max(0.0));
          },
        };
      },
    });
    this.flares = mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>;
    (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
    return mesh;
  }

  private vacuumBubble(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
    mat.colorNode = Fn(() => {
      const n = normalize(T.normalWorld);
      const V = normalize(T.cameraPosition.sub(T.positionWorld));
      const rim = float(1.0).sub(abs(dot(n, V))).pow(3.0);
      return vec4(vec3(0.9, 0.95, 1.0).mul(rim.mul(1.6)), 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), mat);
    m.visible = false;
    m.renderOrder = 12;
    return m;
  }

  // ---------------------------------------------------------------- frame

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    const T0 = f.T;
    u.time.value = f.time;
    const h = this.camera.fov * (Math.PI / 180);
    const H = (f.quality.renderScale || 1) * Math.min(globalThis.devicePixelRatio || 1, f.quality.maxDpr) * (globalThis.innerHeight || 720);
    u.focalPx.value = H / 2 / Math.tan(h / 2);
    // galaxy motion
    for (let g = 0; g < 5; g++) {
      const c = galaxyCenter(g, T0, this.tmp);
      (u.galC.array[g] as THREE.Vector4).set(c[0], c[1], c[2], 0);
    }
    const m31 = galaxyCenter(3, T0, this.tmp2);
    const d = Math.hypot(m31[0], m31[1], m31[2]);
    (u.sep.value as THREE.Vector3).set(m31[0], m31[1], m31[2]).normalize();
    const enc = T0 > COLLISION_T - 6e8 && T0 < MERGED_T + 5e8 ? Math.exp(-(((d - 18) / 60) ** 2)) : 0;
    u.tidal.value = enc * 1.0;
    u.puff.value = Math.min(1, Math.max(0, (T0 - MERGED_T + 4e8) / 1.5e9));
    // camera basis for world-space patterns
    const cam = this.camera;
    cam.updateMatrixWorld();
    (u.camRight.value as THREE.Vector3).setFromMatrixColumn(cam.matrixWorld, 0);
    (u.camUp.value as THREE.Vector3).setFromMatrixColumn(cam.matrixWorld, 1);
    const p = shot.def.params ?? {};
    u.territory.value = Number(p.territory ?? 1);
    u.interior.value = Number(p.interior ?? 1);
    this.frontTau = Number(p.frontTau ?? 0.3);
    // a fringe period of ~1.4 % of the frame height at the distance the rig is looking
    const frameH = 2 * Math.tan(h / 2) * Math.max(0.5, this.lookDist);
    u.fringeK.value = (2 * Math.PI) / (0.014 * frameH);
    const hero = p.hero !== undefined ? Number(p.hero) : -1;
    const bt = String(p.beatType ?? '');
    this.beat.hero = f.chapter === 9 ? hero : -1;
    this.beat.other = bt === 'extinct' ? -1 : hero === Number(p.beatA ?? -1) ? Number(p.beatB ?? -1) : Number(p.beatA ?? -1);
    this.beat.node = Number(p.heroNode ?? -1);
    this.beat.t = Number(p.beatT ?? 0);
    this.beat.type = bt;
    // the event is drawn in the protagonist's colour (the dying power's, for an extinction)
    this.beat.flareF = this.beat.hero;
    // the eye adapts: whole galaxies seen from far away are allowed to be bright
    const camD = this.lookDist;
    u.starGain.value = Number(p.starGain ?? 1) * (1 + 1.6 * Math.min(1, Math.max(0, (camD - 150) / 700)));
    const coda = String(p.coda ?? '');
    const victor = (f as FrameContext & { victor?: THREE.Color }).victor;
    if (coda) {
      const c = Number(p.c0 ?? 0) + shot.t;
      // in the vacuum ending there are no candles: there is nothing left to go out
      u.codaC.value = p.vacuum ? 100 : c;
      // the victor's colour floods every galaxy it holds, as a slow wave
      u.saturate.value = smoothstep01((c - 0.3) / 2.6);
      if (victor) (u.satColor.value as THREE.Vector3).set(victor.r, victor.g, victor.b);
    } else {
      u.codaC.value = -1;
      u.saturate.value = 0;
    }
    const host = (f as FrameContext & { galaxy?: GalaxyHost | null }).galaxy ?? null;
    if (!host) return;
    host.seek(T0);
    // faction colours + visual language
    host.factions.forEach((fi, i) => {
      if (i >= MAXF) return;
      // territories are drawn in the vivid display version of each colour (pale swatches read as grey fog)
      const c = vivid(fi.color);
      (u.fcol.array[i] as THREE.Vector4).set(c[0], c[1], c[2], VIS_INDEX[fi.visual] ?? 0);
    });
    if (coda) {
      // which galaxies does the victor hold?
      const vid = host.result?.victor ?? -1;
      const cnt = [0, 0, 0, 0, 0];
      if (vid >= 0) for (let i = 0; i < this.uni.n; i++) if (host.owner[i] === vid) cnt[this.uni.gal[i]!]!++;
      for (let g = 0; g < 5; g++) (u.satGal.array[g] as THREE.Vector4).set(cnt[g]! > this.uni.galCount[g]! * 0.25 ? 1 : 0, 0, 0, 0);
    }
    this.updateNodes(host, f);
    this.updateEvents(host, f);
    if (coda) {
      // the war is over: nothing moves
      (this.streakMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
      (this.flareMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
      this.bubble.visible = false;
      // from far away the victor's island is a soft glow in its colour, not a two-pixel dot
      if (victor && !p.vacuum) {
        const fa = this.flares.a!.array as Float32Array, fb = this.flares.b!.array as Float32Array;
        const camD = this.camera.position.length();
        const amp = 0.32 * smoothstep01((camD - 500) / 2500) * u.saturate.value;
        let nf = 0;
        for (let g = 0; g < 5 && amp > 0; g++) {
          if ((u.satGal.array[g] as THREE.Vector4).x < 0.5) continue;
          const gc = galaxyCenter(g, T0, this.tmp);
          fa.set([gc[0], gc[1], gc[2], Math.max(40, camD * 0.16)], nf * 4);
          fb.set([victor.r * amp, victor.g * amp, victor.b * amp, 0.0], nf * 4);
          nf++;
        }
        (this.flareMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = nf;
        this.flares.a!.needsUpdate = true;
        this.flares.b!.needsUpdate = true;
      }
    }
  }

  private updateNodes(host: GalaxyHost, f: FrameContext): void {
    const un = this.uni;
    const st = this.stateArr;
    const changed = host.version !== this.lastVersion;
    if (changed) {
      // contested fronts: any neighbour held by another power
      for (let i = 0; i < un.n; i++) {
        const o = host.owner[i]!;
        let c = 0, s2 = -1;
        if (o >= 0)
          for (let e = un.nbrStart[i]!; e < un.nbrStart[i + 1]!; e++) {
            const oj = host.owner[un.nbr[e]!]!;
            if (oj >= 0 && oj !== o) {
              c = 1;
              s2 = oj;
              break;
            }
          }
        this.contested[i] = c;
        this.second[i] = s2;
        // border normal: toward the other power's neighbours, oriented low→high faction index
        const nb = this.nbArr, A = this.terrA;
        if (c) {
          let nx = 0, ny = 0, nz = 0;
          for (let e = un.nbrStart[i]!; e < un.nbrStart[i + 1]!; e++) {
            const j = un.nbr[e]!;
            const oj = host.owner[j]!;
            if (oj < 0 || oj === o) continue;
            nx += A[j * 4]! - A[i * 4]!;
            ny += A[j * 4 + 1]! - A[i * 4 + 1]!;
            nz += A[j * 4 + 2]! - A[i * 4 + 2]!;
          }
          const L = Math.hypot(nx, ny, nz) || 1;
          const sg = o < s2 ? 1 : -1;
          nb[i * 4] = (sg * nx) / L;
          nb[i * 4 + 1] = (sg * ny) / L;
          nb[i * 4 + 2] = (sg * nz) / L;
          nb[i * 4 + 3] = 1;
        } else nb[i * 4 + 3] = 0;
      }
      this.nbAttr.needsUpdate = true;
      this.lastVersion = host.version;
    }
    // presence: smaller powers brighter (an empire's interior is a whisper; a rival's pocket is legible)
    const counts = new Float64Array(MAXF);
    for (let i = 0; i < un.n; i++) {
      const o = host.owner[i]!;
      if (o >= 0 && o < MAXF) counts[o]!++;
    }
    let tot = 0, nf = 0;
    for (let k = 0; k < MAXF; k++) if (counts[k]! > 0) {
      tot += counts[k]!;
      nf++;
    }
    const mean = nf ? tot / nf : 1;
    let hb = this.beat.hero;
    let other = this.beat.other;
    if (hb >= 0 && this.beat.type === 'extinct' && this.beat.node >= 0) {
      // an extinction is the killer's beat: it is lifted; the victim keeps only its last pocket
      const k = host.owner[this.beat.node]!;
      other = hb;
      hb = k >= 0 && k !== other ? k : -1;
    }
    for (let k = 0; k < MAXF; k++) {
      let x = counts[k]! > 0 ? Math.min(3.5, Math.max(0.5, Math.sqrt(mean / counts[k]!))) : 1, z = 1;
      if (hb >= 0) {
        if (k === hb) {
          x = Math.min(6, Math.max(1.5, x * 2.6));
          z = 2.0;
        } else if (k === other) {
          x *= 0.8;
        } else {
          x *= 0.3;
          z = 0.3;
        }
      }
      (this.u.fscale.array[k] as THREE.Vector4).set(x, 0, z, 0);
    }
    // fresh captures glow: the front reads as a luminous shell at any speed
    const tau = Math.max(2e3, Math.abs(f.speed) * this.frontTau);
    for (let i = 0; i < un.n; i++) {
      const o = host.owner[i]!;
      const age = f.T - host.lastChange[i]!;
      st[i * 4] = o;
      st[i * 4 + 1] = o >= 0 && age >= 0 ? Math.exp(-age / tau) : 0;
      st[i * 4 + 2] = this.contested[i]!;
      st[i * 4 + 3] = this.second[i]!;
    }
    this.nodeState.needsUpdate = true;
  }

  private updateEvents(host: GalaxyHost, f: FrameContext): void {
    const T0 = f.T;
    const span = Math.max(2e4, Math.abs(f.speed) * 1.2);
    const evs = host.eventsBetween(T0 - span, T0, this.evBuf);
    const e0 = this.streakAttrs.e0!.array as Float32Array, e1 = this.streakAttrs.e1!.array as Float32Array, e2 = this.streakAttrs.e2!.array as Float32Array;
    const fa = this.flares.a!.array as Float32Array, fb = this.flares.b!.array as Float32Array;
    let k = 0, nf = 0;
    const un = this.uni;
    const P0: [number, number, number] = [0, 0, 0], P1: [number, number, number] = [0, 0, 0];
    let vac: GEvent | null = null;
    for (const e of evs) {
      const col = e.a >= 0 && host.factions[e.a] ? host.factions[e.a]!.color : [1, 1, 1];
      if ((e.type === 'rkvTrail' || e.type === 'probes' || e.type === 'fleet' || e.type === 'beam') && e.node >= 0 && e.node2 >= 0) {
        if (k + TRAIL > MAX_STREAKS * TRAIL) continue;
        nodePos(un, e.node, T0, P0);
        nodePos(un, e.node2, T0, P1);
        const dur = Math.max(1, e.t2 - e.t);
        const prog = (T0 - e.t) / dur;
        if (prog < 0 || prog > 1.02) continue;
        const beam = e.type === 'beam';
        const bright = e.type === 'rkvTrail' ? 2.2 : beam ? 1.6 : e.type === 'fleet' ? 1.1 : 0.6;
        const size = e.type === 'rkvTrail' ? 0.1 : beam ? 0.08 : 0.07;
        for (let j = 0; j < TRAIL; j++) {
          const q = beam ? (j / (TRAIL - 1)) * Math.min(1, prog * 3) : Math.max(0, prog - j * 0.025);
          const x = P0[0] + (P1[0] - P0[0]) * q, y = P0[1] + (P1[1] - P0[1]) * q, z = P0[2] + (P1[2] - P0[2]) * q;
          const fadeT = beam ? Math.min(1, (1.02 - prog) * 8) : 1 - j / TRAIL;
          const w = bright * fadeT * (beam ? 0.6 : 1);
          e0.set([x, y, z, 0], k * 4);
          e1.set([0, 0, 0, size * (beam ? 1 : 1 - j * 0.06)], k * 4);
          const c = e.type === 'rkvTrail' ? [1, 0.92, 0.8] : col;
          e2.set([c[0]!, c[1]!, c[2]!, w], k * 4);
          k++;
        }
      } else if ((e.type === 'supernova' || e.type === 'blackholeSite') && e.node >= 0 && nf < 256) {
        const age = (T0 - e.t) / Math.max(1, (e.t2 > 0 ? e.t2 : e.t + 4e5) - e.t);
        if (age < 0 || age > 1) continue;
        nodePos(un, e.node, T0, P0);
        const nova = e.type === 'supernova';
        const env = nova ? Math.exp(-age * 5) * (f.reducedFlash ? 0.25 : 1) : 0.4;
        fa.set([P0[0], P0[1], P0[2], nova ? 0.4 + age * 2.2 : 0.25], nf * 4);
        fb.set(nova ? [3.5 * env, 3.0 * env, 2.6 * env, 0.25 + age * 0.6] : [0.3 * col[0]!, 0.3 * col[1]!, 0.3 * col[2]!, 0.4], nf * 4);
        nf++;
      } else if (e.type === 'vacuum') vac = e;
    }
    // slow time: the probes and fleets that are under way right now, from the real capture log
    if (f.lodMix > 0.02 && f.chapter >= 8 && f.chapter <= 9) {
      const tau = f.chapter === 8 ? 3500 : 25000;
      const na = host.upcoming(tau, MAX_AGENTS, this.agNode, this.agOwner, this.agT);
      for (let q = 0; q < na; q++) {
        const j = this.agNode[q]!, o = this.agOwner[q]!;
        // launched from a neighbour that the faction already holds
        let src = -1;
        for (let e = un.nbrStart[j]!; e < un.nbrStart[j + 1]!; e++)
          if (host.owner[un.nbr[e]!] === o) {
            src = un.nbr[e]!;
            break;
          }
        if (src < 0) continue;
        const prog = 1 - (this.agT[q]! - T0) / tau;
        nodePos(un, src, T0, P0);
        nodePos(un, j, T0, P1);
        const col = host.factions[o]?.color ?? [1, 1, 1];
        for (let tr = 0; tr < 3; tr++) {
          if (k >= MAX_STREAKS * TRAIL + MAX_AGENTS * 3) break;
          const qq = Math.max(0, prog - tr * 0.08);
          e0.set([P0[0] + (P1[0] - P0[0]) * qq, P0[1] + (P1[1] - P0[1]) * qq, P0[2] + (P1[2] - P0[2]) * qq, 0], k * 4);
          e1.set([0, 0, 0, 0.035 * (1 - tr * 0.25)], k * 4);
          e2.set([col[0]!, col[1]!, col[2]!, (1.6 - tr * 0.5) * f.lodMix], k * 4);
          k++;
        }
      }
    }
    // the Expansion begins at one point: Sol, in the Heir's colour
    if (f.chapter === 8 && T0 < 4e5 && nf < 256 && host.factions[0]) {
      const c = host.factions[0].color;
      const k = 1 - Math.min(1, T0 / 4e5);
      nodePos(un, un.sunNode, T0, P0);
      fa.set([P0[0], P0[1], P0[2], 0.35], nf * 4);
      fb.set([c[0] * 2.4 * k, c[1] * 2.4 * k, c[2] * 2.4 * k, 0.0], nf * 4);
      nf++;
      (this.flareMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = nf;
    }
    // the Contest beat's event, in its protagonist's colour: a spark for an awakening, a collapsing
    // ring for an extinction, a slow pulse for a war, a treaty, a betrayal
    const bh = this.beat.flareF;
    if (bh >= 0 && this.beat.node >= 0 && nf < 256 && host.factions[bh]) {
      const c = vivid(host.factions[bh]!.color);
      nodePos(un, this.beat.node, T0, P0);
      const D = Math.max(1, Math.hypot(this.camera.position.x - P0[0], this.camera.position.y - P0[1], this.camera.position.z - P0[2]));
      const fh = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * D;
      const sec = (T0 - this.beat.t) / Math.max(1e3, Math.abs(f.speed));
      const ty = this.beat.type;
      let shell: number, amp: number;
      if (ty === 'emerge' || ty === 'intrude' || ty === 'reveal') {
        // ignition: nothing before the moment, then a bright point and an expanding ring
        amp = sec < 0 ? 0.2 * Math.exp(sec * 2) : 0.5 + 0.7 * Math.exp(-sec * 0.6);
        shell = sec < 0 ? 0.08 : Math.min(0.9, 0.1 + sec * 0.32);
      } else if (ty === 'extinct') {
        // the last pocket closes in on itself, then goes out
        amp = sec < 0 ? 1.0 : Math.exp(-sec * 1.1);
        shell = sec < 0 ? Math.min(0.9, 0.12 - sec * 0.3) : 0.1 * Math.exp(-sec);
      } else {
        amp = 0.8;
        shell = 0.15 + ((sec * 0.45) % 1 + 1) % 1 * 0.7;
      }
      const g = amp * (f.reducedFlash ? 0.6 : 1);
      fa.set([P0[0], P0[1], P0[2], fh * 0.16], nf * 4);
      fb.set([c[0] * 0.95 * g, c[1] * 0.95 * g, c[2] * 0.95 * g, shell], nf * 4);
      nf++;
    }
    // older vacuum events persist (the bubble only grows)
    if (!vac) for (const e of host.events) if (e.type === 'vacuum' && e.t <= T0) vac = e;
    (this.streakMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = k;
    (this.flareMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = nf;
    for (const key of ['e0', 'e1', 'e2']) this.streakAttrs[key]!.needsUpdate = true;
    this.flares.a!.needsUpdate = true;
    this.flares.b!.needsUpdate = true;
    if (vac && vac.node >= 0) {
      nodePos(un, vac.node, vac.t, P0);
      const R = ((T0 - vac.t) / KPC_LY);
      (this.u.vacC.value as THREE.Vector3).set(P0[0], P0[1], P0[2]);
      this.u.vacR.value = R;
      this.bubble.visible = R > 0 && R < 3000;
      this.bubble.position.set(P0[0], P0[1], P0[2]);
      this.bubble.scale.setScalar(Math.max(0.01, R));
    } else {
      this.u.vacR.value = -1;
      this.bubble.visible = false;
    }
    void STAR;
  }
}

void clamp;
void floor;
void uniform;

function smoothstep01(x: number): number {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
}

/** a display version of a faction colour: same hue, saturation ≥ 0.65, full value */
function vivid(c: readonly number[]): [number, number, number] {
  const r = c[0]!, g = c[1]!, b = c[2]!;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx <= 0) return [1, 1, 1];
  const sat = (mx - mn) / mx;
  if (sat < 1e-3) return [1, 1, 1];
  const S = Math.max(0.65, sat);
  // rescale each channel's distance from the max so the hue is kept
  const k = S / sat;
  const f = (x: number): number => Math.max(0, 1 - ((mx - x) / mx) * k);
  return [f(r), f(g), f(b)];
}
