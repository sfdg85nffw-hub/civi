import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { clamp01, smoothstep } from '../../core/math';
import type { AgentFrame } from '../../sim/SimHost';

const {
  uniform, vec2, vec3, vec4, float, Fn, texture, uv, mix, smoothstep: sst, positionGeometry, normalize, dot, max, min, abs, exp, pow,
  sin, cos, clamp, mx_noise_float, mx_fractal_noise_float, mx_worley_noise_float, length, instancedBufferAttribute, modelViewMatrix,
  cameraProjectionMatrix, varying, fract, select,
} = T;

const G = 128;
export const MAT_SIZE = 1.2;

/**
 * The microscope: a microbial mat in a shallow Archean sea, seen from above.
 * Field layer = luminous reaction–diffusion biomass; agent layer = individual
 * cells that condense out of it when time slows.
 */
export class MicroStage extends Stage {
  readonly name = 'micro';
  private fieldTex!: THREE.DataTexture;
  private fieldData = new Uint8Array(G * G * 4);
  private lastVersion = -1;
  private cellMesh!: THREE.Mesh;
  private cellAttrs!: { a: THREE.InstancedBufferAttribute; b: THREE.InstancedBufferAttribute; c: THREE.InstancedBufferAttribute };
  private maxCells = 2600;
  readonly u = {
    time: uniform(0),
    lod: uniform(0),
    alpha: uniform(0),
    o2: uniform(0),
    haze: uniform(0.8),
    ice: uniform(0),
    sunTint: uniform(new THREE.Color(1.0, 0.62, 0.32)),
    fieldGain: uniform(1),
  };

  build(): void {
    this.post = { bloom: 0.5, threshold: 0.32, exposure: 1.0, grain: 0.04, vignette: 0.45, chroma: 0.002 };
    this.camera.near = 0.01;
    this.camera.far = 50;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.fieldTex = new THREE.DataTexture(this.fieldData, G, G, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.fieldTex.wrapS = this.fieldTex.wrapT = THREE.RepeatWrapping;
    this.fieldTex.magFilter = THREE.LinearFilter;
    this.fieldTex.minFilter = THREE.LinearFilter;
    this.fieldTex.generateMipmaps = false;
    this.fieldTex.needsUpdate = true;
    this.scene.add(this.matPlane());
    this.cellMesh = this.buildCells();
    this.scene.add(this.cellMesh);
    this.scene.add(this.motes());
  }

  /** the mat: sediment, rust, luminous biomass field, caustics */
  private matPlane(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(MAT_SIZE * 3, MAT_SIZE * 3, 1, 1);
    geo.rotateX(-Math.PI / 2);
    const mat = new THREE.MeshBasicNodeMaterial();
    const u = this.u;
    const ft = this.fieldTex;
    mat.colorNode = Fn(() => {
      const q = uv().mul(3.0); // repeats the periodic domain around the centre tile
      const f = texture(ft, q);
      const A = f.r.mul(1.0 / 0.35);
      const P = f.g.mul(1.0 / 0.35);
      const U = f.b;
      const R = f.a;
      const t = u.time;
      // sediment: dark grains with mineral flecks
      const grains = mx_worley_noise_float(q.mul(220.0));
      const sed = mx_fractal_noise_float(vec3(q.mul(18.0), 0.0), 4, 2.0, 0.5);
      let base = mix(vec3(0.004, 0.0035, 0.003), vec3(0.012, 0.01, 0.007), sed.mul(0.5).add(0.5));
      base = base.mul(sst(0.0, 0.6, grains).mul(0.6).add(0.5));
      base = mix(base, vec3(0.07, 0.022, 0.006), clamp(R.mul(1.5), 0.0, 1.0).mul(0.8));
      // caustics: sunlight through ripples (warm under the haze, whiter with oxygen)
      const cq = q.mul(7.0);
      const c1 = mx_worley_noise_float(vec3(cq.x, cq.y, t.mul(0.35)));
      const c2 = mx_worley_noise_float(vec3(cq.x.mul(1.3).add(3.1), cq.y.mul(1.3), t.mul(0.27).add(9.0)));
      const caust = pow(clamp(float(1.0).sub(min(c1, c2).mul(2.2)), 0.0, 1.0), 6.0).mul(1.6);
      const sun = vec3(u.sunTint).mul(float(1.0).sub(u.ice.mul(0.75)));
      // the living carpet: fine cell texture even in field mode
      const wc = mx_worley_noise_float(q.mul(105.0));
      const discs = sst(0.42, 0.3, wc);
      const crim = sst(0.12, 0.0, abs(wc.sub(0.34)));
      const cellsTex = discs.mul(0.25).add(crim.mul(1.2));
      const amber = vec3(1.0, 0.55, 0.16);
      const cyan = vec3(0.25, 1.0, 0.72);
      const bio = clamp(A.add(P), 0.0, 2.0);
      const hueMix = clamp(P.div(A.add(P).add(1e-3)), 0.0, 1.0);
      const lifeCol = mix(amber, cyan, hueMix);
      const density = sst(0.18, 1.1, bio);
      const procedural = lifeCol.mul(density.pow(1.4).mul(cellsTex.add(0.12))).mul(0.55).mul(u.fieldGain);
      // EPS film: a soft autofluorescent haze under the living cells
      const eps = mix(vec3(0.9, 0.62, 0.2), vec3(0.2, 0.75, 0.6), hueMix).mul(sst(0.05, 1.6, bio)).mul(0.028).mul(float(1.0).sub(u.fieldGain).add(0.2)).mul(mx_noise_float(vec3(q.mul(30.0), u.time.mul(0.05))).mul(0.3).add(0.85));
      const glow = procedural.add(eps);
      // substrate shimmer where nutrients are rich
      const nutr = vec3(0.12, 0.08, 0.05).mul(U.mul(U)).mul(0.12);
      let col = base.mul(sun.mul(caust.mul(0.6).add(0.1))).add(glow.mul(caust.mul(0.25).add(0.85))).add(nutr.mul(0.3));
      // ice: dim, blue
      col = mix(col, col.mul(vec3(0.35, 0.45, 0.6)), u.ice);
      // vignette the tiles so the eye stays on the centre
      const d = length(uv().sub(0.5));
      col = col.mul(sst(0.5, 0.18, d));
      return vec4(col, 1.0);
    })();
    return new THREE.Mesh(geo, mat);
  }

  private buildCells(): THREE.Mesh {
    const n = this.maxCells;
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    const a = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    const b = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    const c = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4);
    a.setUsage(THREE.DynamicDrawUsage);
    b.setUsage(THREE.DynamicDrawUsage);
    c.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('ia', a);
    geo.setAttribute('ib', b);
    geo.setAttribute('ic', c);
    geo.instanceCount = 0;
    this.cellAttrs = { a, b, c };
    const A = instancedBufferAttribute(a);
    const B = instancedBufferAttribute(b);
    const C = instancedBufferAttribute(c);
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    // interpolate with wrap-around
    let dx = A.x.sub(A.z);
    dx = dx.sub(dx.add(0.5).floor());
    let dy = A.y.sub(A.w);
    dy = dy.sub(dy.add(0.5).floor());
    const x = A.z.add(dx.mul(u.alpha));
    const y = A.w.add(dy.mul(u.alpha));
    const center = vec3(x.sub(0.5).mul(MAT_SIZE), 0.004, float(0.5).sub(y).mul(MAT_SIZE));
    const div = C.x;
    const r = B.x.mul(MAT_SIZE);
    const rod = select(B.z.lessThan(0.5), float(0.0), select(B.z.lessThan(1.5), float(6.0).add(fract(C.w.mul(13.7)).mul(9.0)), float(0.7)));
    const len = float(1.0).add(div.mul(1.1)).add(rod.mul(0.62));
    const corner = positionGeometry.xy;
    // oriented in the mat plane (x along heading)
    const ang = B.y;
    const local = vec2(corner.x.mul(len), corner.y).mul(r.mul(2.6));
    const wx = local.x.mul(cos(ang)).sub(local.y.mul(sin(ang)));
    const wz = local.x.mul(sin(ang)).add(local.y.mul(cos(ang))).negate();
    const world = center.add(vec3(wx, 0.0, wz));
    mat.vertexNode = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(world, 1.0)));
    const vP = varying(vec2(corner.x.mul(len), corner.y).mul(2.6));
    const vSpec = varying(B.z);
    const vHue = varying(B.w);
    const vDiv = varying(div);
    const vRod = varying(rod);
    const vSeed = varying(C.w);
    // per-cell visibility: staggered condensation, plus the sim's own birth/death fade
    const stagger = sst(C.w.mul(0.55), C.w.mul(0.55).add(0.45), u.lod);
    const birth = clamp(C.y, 0.0, 1.0);
    const vVis = varying(stagger.mul(sst(0.0, 0.6, birth)));
    const vFlash = varying(sst(0.0, 0.2, birth).mul(sst(0.5, 0.2, birth)).mul(stagger));
    const vEnergy = varying(C.z);
    mat.colorNode = Fn(() => {
      const p = vP;
      // capsule SDF (radius 1 in these units) with a pinch while dividing
      const L = float(0.12).add(vDiv.mul(0.95)).add(vRod.mul(0.62));
      const qx = max(abs(p.x).sub(L), 0.0);
      const pinch = float(1.0).sub(vDiv.mul(0.6).mul(exp(p.x.mul(p.x).div(0.05).negate())));
      const dAxis = length(vec2(qx, p.y)).div(pinch);
      const d = dAxis.sub(1.0);
      const aa = float(0.05);
      const inside = sst(aa, aa.negate(), d);
      // pseudo-3D normal of a cylinder/sphere: n.z from distance to the axis
      const nz = clamp(float(1.0).sub(dAxis.mul(dAxis)), 0.0, 1.0).sqrt();
      const fres = float(1.0).sub(nz).pow(2.5).mul(inside);
      const nxy = vec2(select(abs(p.x).greaterThan(L), p.x.sub(L.mul(p.x.sign())), float(0.0)), p.y).div(max(dAxis, 1e-3)).mul(float(1.0).sub(nz));
      const lightDir = normalize(vec3(-0.5, 0.6, 0.62));
      const nrm = normalize(vec3(nxy.x, nxy.y, nz));
      const diff = max(dot(nrm, lightDir), 0.0);
      const spec = pow(max(dot(nrm, normalize(lightDir.add(vec3(0, 0, 1)))), 0.0), 40.0).mul(inside);
      // interior: sparkling granules and a nucleoid
      const gran = sst(0.55, 0.9, mx_noise_float(vec3(p.mul(4.5), vSeed.mul(40.0).add(u.time.mul(0.6))))).mul(inside).mul(nz);
      const nuc = sst(0.6, 0.15, length(p.sub(vec2(vSeed.sub(0.5).mul(0.5), 0.12)))).mul(inside);
      const chemo = vec3(1.0, 0.5, 0.14);
      const photo = vec3(0.2, 1.0, 0.62);
      const het = vec3(0.72, 0.4, 1.0);
      const baseC = select(vSpec.lessThan(0.5), chemo, select(vSpec.lessThan(1.5), photo, het));
      const shade = vHue.sub(0.08).mul(1.5);
      const tint = baseC.add(vec3(shade.mul(0.3), shade.mul(-0.1), shade.mul(-0.2))).clamp(0.0, 1.5);
      const starving = sst(0.6, 0.0, vEnergy);
      // septa: cross-walls along filaments
      const segs = fract(p.x.add(L).div(1.7));
      const septa = sst(0.07, 0.0, abs(segs.sub(0.5)).sub(0.43).abs()).mul(inside).mul(sst(0.5, 1.5, vRod));
      const sizeJ = fract(vSeed.mul(7.31)).mul(0.5).add(0.75);
      const body = tint.mul(inside.mul(0.022).add(nuc.mul(0.012)).add(gran.mul(0.16)));
      // dark-field: one crisp refractive boundary, a faint volumetric falloff inside
      // oblique dark-field: the boundary is brighter on the side facing the light
      const side = dot(normalize(vec2(select(abs(p.x).greaterThan(L), p.x.sub(L.mul(p.x.sign())), float(0.0)), p.y).add(vec2(1e-4, 0.0))), normalize(vec2(-0.6, 0.8))).mul(0.45).add(0.65);
      const edge = exp(d.div(0.085).pow(2.0).negate()).mul(side);
      const vol = float(1.0).sub(nz).pow(3.0).mul(inside).mul(0.35);
      const rim = tint.mul(0.65).add(0.35).mul(edge.mul(1.25).add(vol).mul(sizeJ)).add(tint.mul(septa.mul(0.45)));
      const glintC = vec3(0.0);
      const col = body.add(rim).add(glintC).mul(float(1.0).sub(starving.mul(0.65))).add(tint.mul(vFlash.mul(fres.add(inside.mul(0.15))).mul(0.9)));
      return vec4(col.mul(vVis).mul(1.6), 1.0);
    })();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    return mesh;
  }

  /** drifting chemistry and out-of-focus motes in the water column above */
  private motes(): THREE.Object3D {
    const rng = new Rng(0x6d07e5, 2);
    const n = 1400;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.range(-2, 2), rng.range(0.02, 0.9), rng.range(-1.4, 1.4), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 20,
      softness: 1.4,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(u.time.mul(0.11).add(s.mul(30.0))).mul(0.05), sin(u.time.mul(0.07).add(s.mul(9.0))).mul(0.02), cos(u.time.mul(0.09).add(s.mul(17.0))).mul(0.05)));
        const h = at.a.y;
        const size = h.mul(0.03).add(0.002).mul(s.mul(0.6).add(0.6));
        const col = vec3(u.sunTint).mul(0.05).mul(float(0.002).div(size).min(1.0).add(0.1)).mul(s.mul(0.5).add(0.5));
        return { center: p, size, color: col };
      },
    });
  }

  private uploadAgents(f: FrameContext): void {
    const ag = f.agents;
    if (!ag || ag.sim !== 'microbes') {
      (this.cellMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
      return;
    }
    this.u.alpha.value = ag.alpha;
    if (ag.version === this.lastVersion) return;
    this.lastVersion = ag.version;
    const s = ag.snap;
    // field texture
    const fld = s.fields.mat;
    if (fld) {
      const d = fld.data;
      const o = this.fieldData;
      for (let i = 0; i < G * G; i++) {
        o[i * 4] = Math.min(255, d[i * 4]! * 0.35 * 255 * 2.2);
        o[i * 4 + 1] = Math.min(255, d[i * 4 + 1]! * 0.35 * 255 * 2.2);
        o[i * 4 + 2] = Math.min(255, d[i * 4 + 2]! * 255);
        o[i * 4 + 3] = Math.min(255, d[i * 4 + 3]! * 255);
      }
      this.fieldTex.needsUpdate = true;
    }
    const n = Math.min(s.count, this.maxCells);
    const { a, b, c } = this.cellAttrs;
    const A = a.array as Float32Array, B = b.array as Float32Array, C = c.array as Float32Array;
    const src = s.agents;
    for (let k = 0; k < n; k++) {
      const o = k * s.stride;
      A[k * 4] = src[o]!;
      A[k * 4 + 1] = src[o + 1]!;
      A[k * 4 + 2] = src[o + 2]!;
      A[k * 4 + 3] = src[o + 3]!;
      B[k * 4] = src[o + 4]!;
      B[k * 4 + 1] = src[o + 5]!;
      B[k * 4 + 2] = src[o + 6]!;
      B[k * 4 + 3] = src[o + 7]!;
      C[k * 4] = src[o + 8]!;
      C[k * 4 + 1] = src[o + 9]!;
      C[k * 4 + 2] = src[o + 10]!;
      C[k * 4 + 3] = ((k * 2654435761) >>> 0) / 4294967296;
    }
    a.needsUpdate = b.needsUpdate = c.needsUpdate = true;
    a.addUpdateRange(0, n * 4);
    b.addUpdateRange(0, n * 4);
    c.addUpdateRange(0, n * 4);
    (this.cellMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = n;
    void f;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    u.time.value = f.time;
    u.lod.value = f.lodMix;
    u.o2.value = f.world.o2;
    u.haze.value = f.world.haze;
    u.ice.value = smoothstep(0.5, 0.95, f.world.ice);
    // sunlight colour through the haze: amber → white as the sky clears
    const clear = clamp01(1 - f.world.haze * 1.1);
    (u.sunTint.value as THREE.Color).setRGB(1.0, 0.6 + 0.35 * clear, 0.3 + 0.62 * clear);
    u.fieldGain.value = Math.pow(1 - f.lodMix, 2);
    this.uploadAgents(f);
    void shot;
  }
}
