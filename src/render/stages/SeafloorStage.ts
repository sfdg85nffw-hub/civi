import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { clamp01, smoothstep } from '../../core/math';
import { vnoise } from '../tsl/noiseTex';
import { CREATURE_STRIDE, MAX_NODES } from '../../sim/agents/creatures';

const {
  uniform, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, positionLocal, cameraPosition, normalize, dot, max, min, abs, exp, pow,
  sin, cos, clamp, length, uv, instancedBufferAttribute, modelViewMatrix, cameraProjectionMatrix, positionGeometry, varying, fract, fog, densityFogFactor,
  mx_worley_noise_float, cameraViewMatrix, modelWorldMatrix,
} = T;

export const SEA_SIZE = 4.2;
const MAX_CREATURES = 150;
const SEGS = MAX_CREATURES * (MAX_NODES - 1);

/**
 * The Neoproterozoic–Cambrian seafloor. Twilight god rays and caustics over
 * rippled sand, Ediacaran fronds, marine snow — and the Cambrian swimmers,
 * spring-mass bodies glowing with bioluminescence (agents from the worker).
 */
export class SeafloorStage extends Stage {
  readonly name = 'seafloor';
  readonly u = {
    time: uniform(0),
    lod: uniform(0),
    alpha: uniform(0),
    cambrian: uniform(1), // 0 = Ediacaran daylight, 1 = Cambrian twilight
    rays: uniform(1),
    pop: uniform(0.5),
    focus: uniform(3),
    aperture: uniform(0.4),
  };
  private segAttr!: { a: THREE.InstancedBufferAttribute; b: THREE.InstancedBufferAttribute; c: THREE.InstancedBufferAttribute };
  private segMesh!: THREE.Mesh;
  private spotAttr!: { a: THREE.InstancedBufferAttribute; b: THREE.InstancedBufferAttribute };
  private spotMesh!: THREE.Mesh;
  private lastVersion = -1;

  build(): void {
    this.post = { bloom: 0.75, threshold: 0.18, exposure: 1.0, grain: 0.04, vignette: 0.45, chroma: 0.0018 };
    this.camera.near = 0.02;
    this.camera.far = 120;
    this.scene.background = new THREE.Color(0, 0, 0);
    const u = this.u;
    const waterCol = mix(vec3(0.006, 0.03, 0.045), vec3(0.002, 0.008, 0.016), u.cambrian);
    this.scene.fogNode = fog(waterCol, densityFogFactor(float(0.11)));
    this.scene.add(this.waterDome());
    this.scene.add(this.sand());
    this.scene.add(this.godRays());
    this.scene.add(this.fronds());
    this.scene.add(this.snow());
    this.scene.add(this.lifeHaze());
    this.segMesh = this.creatureBodies();
    this.scene.add(this.segMesh);
    this.spotMesh = this.creatureSpots();
    this.scene.add(this.spotMesh);
  }

  private waterDome(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    mat.colorNode = Fn(() => {
      const d = normalize(positionWorld.sub(cameraPosition));
      const up = clamp(d.y, -1.0, 1.0);
      // light from the surface: a bright Snell's window overhead fading to deep blue-black
      const day = mix(vec3(0.01, 0.05, 0.07), vec3(0.003, 0.012, 0.022), u.cambrian);
      const surface = mix(vec3(0.15, 0.4, 0.45), vec3(0.04, 0.12, 0.16), u.cambrian).mul(sst(0.55, 1.0, up).pow(2.0));
      const ripple = vnoise(vec3(d.x.mul(1.5), d.z.mul(1.5), u.time.mul(0.03)), 'b').mul(0.5).add(0.5);
      const col = day.mul(sst(-0.4, 0.6, up)).add(surface.mul(ripple.mul(0.6).add(0.6)));
      return vec4(col, 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), mat);
    m.renderOrder = -2;
    return m;
  }

  private sand(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(60, 60, 260, 260);
    geo.rotateX(-Math.PI / 2);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      const ripple = Math.sin(x * 5.2 + Math.sin(z * 0.7) * 1.6) * 0.012 + Math.sin(x * 11 + z * 2.3) * 0.004;
      const dunes = Math.sin(x * 0.4 + z * 0.25) * 0.08 + Math.sin(z * 0.33 - x * 0.12) * 0.1;
      p.setY(i, ripple + dunes - 0.05);
    }
    geo.computeVertexNormals();
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial();
    mat.colorNode = Fn(() => {
      const w = positionWorld;
      const grain = vnoise(w.mul(3.0), 'a').mul(0.5).add(0.5);
      const patches = vnoise(w.mul(0.25), 'g').mul(0.5).add(0.5);
      // rippled sand: wave-cut ridges under the grain
      const ripple = sin(w.x.mul(5.5).add(w.z.mul(1.7)).add(vnoise(w.mul(0.6), 'b').mul(2.5))).mul(0.5).add(0.5);
      let base = mix(vec3(0.075, 0.068, 0.052), vec3(0.15, 0.13, 0.095), grain.mul(0.3).add(patches.mul(0.4)).add(ripple.mul(0.3)));
      // microbial mats still carpet the sand: dark green-brown patches
      base = mix(base, vec3(0.03, 0.04, 0.025), sst(0.55, 0.75, patches).mul(0.7));
      // caustics from the surface
      const cq = w.xz.mul(1.6);
      const c1 = mx_worley_noise_float(vec3(cq.x, cq.y, u.time.mul(0.4)));
      const c2 = mx_worley_noise_float(vec3(cq.x.mul(1.37).add(4.0), cq.y.mul(1.37), u.time.mul(0.31).add(7.0)));
      const caust = pow(clamp(float(1.0).sub(min(c1, c2).mul(2.3)), 0.0, 1.0), 5.0);
      const light = mix(vec3(0.75, 0.82, 0.6), vec3(0.62, 0.72, 0.55), u.cambrian);
      const amb = mix(vec3(0.06, 0.1, 0.1), vec3(0.015, 0.03, 0.04), u.cambrian);
      const col = base.mul(amb.add(light.mul(caust.mul(2.6).mul(ripple.mul(0.5).add(0.75)).add(0.12))));
      return vec4(col, 1.0);
    })();
    return new THREE.Mesh(geo, mat);
  }

  private godRays(): THREE.Object3D {
    const g = new THREE.Group();
    const rng = new Rng(0x60d, 7);
    const u = this.u;
    for (let i = 0; i < 9; i++) {
      const w = rng.range(0.5, 1.6);
      const geo = new THREE.PlaneGeometry(w, 14, 1, 1);
      const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
      const seed = rng.next() * 10;
      mat.colorNode = Fn(() => {
        const q = uv();
        const edge = sst(0.0, 0.35, q.x).mul(sst(1.0, 0.65, q.x));
        const fall = sst(0.0, 0.55, q.y).mul(sst(1.0, 0.8, q.y));
        const streak = vnoise(vec3(q.x.mul(3.0).add(seed), q.y.mul(0.5).sub(u.time.mul(0.02)), seed), 'b').mul(0.5).add(0.5);
        const flick = sin(u.time.mul(0.35).add(seed * 3.0)).mul(0.25).add(0.75);
        const col = mix(vec3(0.35, 0.6, 0.6), vec3(0.2, 0.42, 0.48), u.cambrian).mul(edge.mul(fall).mul(streak).mul(flick).mul(0.11).mul(u.rays));
        return vec4(col, 1.0);
      })();
      const m = new THREE.Mesh(geo, mat);
      m.position.set(rng.range(-6, 6), 5.5, rng.range(-9, 1.5));
      m.rotation.set(0, rng.range(0, Math.PI), rng.range(-0.25, 0.25));
      m.userData.ray = true;
      m.renderOrder = 15;
      g.add(m);
    }
    return g;
  }

  private fronds(): THREE.Object3D {
    // Ediacaran rangeomorph fronds (Charnia-like): a stalk and a quilted blade, swaying
    const segY = 18;
    const geo = new THREE.PlaneGeometry(1, 1, 6, segY);
    geo.translate(0, 0.5, 0);
    const rng = new Rng(0xf20d, 3);
    const n = 70;
    const inst = new Float32Array(n * 4);
    const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }), n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) {
      const x = rng.range(-7, 7), z = rng.range(-12, 2.2);
      const h = rng.range(0.25, 0.9);
      const s = new THREE.Vector3(h * 0.28, h, 1);
      m4.compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rng.range(0, Math.PI), 0)), s);
      mesh.setMatrixAt(i, m4);
      inst[i * 4] = rng.next() * 6.28;
      inst[i * 4 + 1] = rng.next();
    }
    const ia = new THREE.InstancedBufferAttribute(inst, 4);
    geo.setAttribute('fr', ia);
    const F = instancedBufferAttribute(ia);
    const u = this.u;
    const mat = mesh.material as THREE.MeshBasicNodeMaterial;
    const q = uv();
    const sway = sin(u.time.mul(0.7).add(F.x).add(q.y.mul(2.0))).mul(q.y.mul(q.y)).mul(0.22);
    mat.positionNode = positionLocal.add(vec3(sway, 0, sway.mul(0.4)));
    mat.colorNode = Fn(() => {
      const yy = q.y;
      const xx = q.x.sub(0.5).mul(2.0);
      // blade outline: a leaf, with a thin stalk at the base
      const width = sst(0.0, 0.25, yy).mul(sst(1.0, 0.7, yy)).mul(0.95).add(sst(0.18, 0.0, yy).mul(0.12));
      const inside = sst(width, width.sub(0.08), abs(xx));
      // quilted rangeomorph pattern: chevrons branching off the midline
      const chev = sst(0.75, 1.0, sin(yy.mul(42.0).add(abs(xx).mul(9.0))).mul(0.5).add(0.5));
      const mid = sst(0.07, 0.0, abs(xx));
      const rim = sst(0.12, 0.0, abs(abs(xx).sub(width))).mul(sst(0.05, 0.2, yy));
      const pale = mix(vec3(0.6, 0.48, 0.42), vec3(0.4, 0.55, 0.62), F.y);
      const glow = mix(float(0.05), float(0.14), u.cambrian);
      const col = pale.mul(inside.mul(chev.mul(0.5).add(0.2)).add(mid.mul(0.6)).add(rim.mul(0.9))).mul(glow);
      return vec4(col, 1.0);
    })();
    mesh.frustumCulled = false;
    mesh.renderOrder = 6;
    return mesh;
  }

  private snow(): THREE.Object3D {
    const rng = new Rng(0x5e0, 9);
    const n = 4500;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.range(-7, 7), rng.range(0, 4.5), rng.range(-12, 4), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 9,
      softness: 1.2,
      build: (at) => {
        const s = at.a.w;
        const y = fract(at.a.y.div(4.5).sub(u.time.mul(0.006).mul(s.add(0.5)))).mul(4.5);
        const p = vec3(at.a.x.add(sin(u.time.mul(0.1).add(s.mul(30.0))).mul(0.15)), y, at.a.z);
        const view = cameraViewMatrix.mul(modelWorldMatrix.mul(vec4(p, 1.0)));
        const depth = view.z.negate().max(0.05);
        const coc = abs(depth.sub(u.focus)).div(depth).mul(u.aperture).mul(0.03);
        const base = s.mul(0.006).add(0.003);
        const size = base.add(coc);
        const e = base.div(size).pow(1.3);
        const col = mix(vec3(0.5, 0.75, 0.8), vec3(0.25, 0.45, 0.55), u.cambrian).mul(0.18).mul(e);
        return { center: p, size, color: col };
      },
    });
  }

  /** the field representation: a luminous plankton haze whose density follows the population */
  private lifeHaze(): THREE.Object3D {
    const rng = new Rng(0x1fe, 2);
    const n = 3000;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.range(-4, 4), rng.range(0.1, 1.2), rng.range(-4, 3), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 11,
      softness: 2.0,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(u.time.mul(0.4).add(s.mul(40.0))), sin(u.time.mul(0.3).add(s.mul(17.0))).mul(0.3), cos(u.time.mul(0.35).add(s.mul(23.0)))).mul(0.25));
        const vis = float(1.0).sub(u.lod).mul(sst(s, s.add(0.15), u.pop));
        const col = mix(vec3(0.2, 1.0, 0.85), vec3(1.0, 0.3, 0.7), fract(s.mul(13.0)).greaterThan(0.85).select(float(1.0), float(0.0))).mul(0.12).mul(vis);
        return { center: p, size: float(0.03), color: col };
      },
    });
  }

  private creatureBodies(): THREE.Mesh {
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    const mk = (): THREE.InstancedBufferAttribute => {
      const a = new THREE.InstancedBufferAttribute(new Float32Array(SEGS * 4), 4);
      a.setUsage(THREE.DynamicDrawUsage);
      return a;
    };
    const a = mk(), b = mk(), c = mk();
    geo.setAttribute('sa', a);
    geo.setAttribute('sb', b);
    geo.setAttribute('sc', c);
    geo.instanceCount = 0;
    this.segAttr = { a, b, c };
    const A = instancedBufferAttribute(a); // p0.xyz, width0
    const B = instancedBufferAttribute(b); // p1.xyz, width1
    const C = instancedBufferAttribute(c); // hue, pred, alpha, t (position along body 0..1)
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    // camera-facing ribbon between two points
    const p0 = A.xyz, p1 = B.xyz;
    const v0 = modelViewMatrix.mul(vec4(p0, 1.0)).xyz;
    const v1 = modelViewMatrix.mul(vec4(p1, 1.0)).xyz;
    const dir = normalize(v1.sub(v0).add(vec3(1e-5, 0, 0)));
    const side = normalize(vec3(dir.y.negate(), dir.x, 0.0));
    const corner = positionGeometry.xy;
    const along = corner.x.add(0.5);
    const wdt = mix(A.w, B.w, along).mul(1.8);
    const vp = mix(v0, v1, along).add(side.mul(corner.y.mul(wdt)));
    mat.vertexNode = cameraProjectionMatrix.mul(vec4(vp, 1.0));
    const vUV = varying(vec2(along, corner.y.mul(2.0)));
    const vC = varying(C);
    mat.colorNode = Fn(() => {
      const r = abs(vUV.y);
      const core = sst(0.55, 0.0, r);
      const halo = sst(1.0, 0.2, r).mul(0.25);
      const prey = vec3(0.15, 1.0, 0.82);
      const pred = vec3(1.0, 0.22, 0.55);
      const hueShift = vC.x.sub(0.5).mul(2.0);
      const col = mix(prey.add(vec3(hueShift.mul(-0.2), 0, hueShift.mul(0.3))), pred, vC.y).mul(mix(float(1.0), float(0.7), vC.y));
      // a travelling shimmer of light along the body
      const shimmer = sin(vC.w.mul(14.0).sub(u.time.mul(5.0))).mul(0.35).add(0.75);
      const head = sst(0.12, 0.0, vC.w).mul(0.8);
      return vec4(col.mul(core.mul(0.45).add(halo.mul(0.6))).mul(shimmer.add(head)).mul(vC.z).mul(u.lod), 1.0);
    })();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 12;
    return mesh;
  }

  private creatureSpots(): THREE.Mesh {
    const n = MAX_CREATURES * MAX_NODES;
    const a = new Float32Array(n * 4);
    const b = new Float32Array(n * 4);
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      renderOrder: 13,
      softness: 3.0,
      build: (at) => {
        const pulse = sin(u.time.mul(3.0).add(at.b.w.mul(9.0))).mul(0.5).add(0.5);
        const col = mix(vec3(0.5, 1.0, 0.9), vec3(1.0, 0.45, 0.65), at.b.y).mul(at.b.z).mul(pulse.mul(1.6).add(0.4)).mul(u.lod);
        return { center: at.a.xyz, size: at.a.w, color: col };
      },
    });
    (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
    const attrs = mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>;
    attrs.a!.setUsage(THREE.DynamicDrawUsage);
    attrs.b!.setUsage(THREE.DynamicDrawUsage);
    this.spotAttr = { a: attrs.a!, b: attrs.b! };
    return mesh;
  }

  private upload(f: FrameContext): void {
    const ag = f.agents;
    const segGeo = this.segMesh.geometry as THREE.InstancedBufferGeometry;
    const spotGeo = this.spotMesh.geometry as THREE.InstancedBufferGeometry;
    if (!ag || ag.sim !== 'creatures') {
      segGeo.instanceCount = 0;
      spotGeo.instanceCount = 0;
      return;
    }
    const s = ag.snap;
    this.u.pop.value = s.stats.population ?? 0.5;
    const alpha = ag.alpha;
    const A = this.segAttr.a.array as Float32Array, B = this.segAttr.b.array as Float32Array, C = this.segAttr.c.array as Float32Array;
    const SA = this.spotAttr.a.array as Float32Array, SB = this.spotAttr.b.array as Float32Array;
    let k = 0, sp = 0;
    const S = SEA_SIZE;
    const src = s.agents;
    const n = Math.min(s.count, MAX_CREATURES);
    const node = (o: number, i: number): [number, number] => {
      let x = src[o + 8 + i * 2]!, z = src[o + 9 + i * 2]!;
      const ox = src[o + 20 + i * 2]!, oz = src[o + 21 + i * 2]!;
      let dx = x - ox, dz = z - oz;
      dx -= Math.round(dx);
      dz -= Math.round(dz);
      x = ox + dx * alpha;
      z = oz + dz * alpha;
      return [x, z];
    };
    for (let c = 0; c < n; c++) {
      const o = c * CREATURE_STRIDE;
      const nn = src[o]!;
      const hue = src[o + 1]!, size = src[o + 2]!, pred = src[o + 3]!, y = src[o + 4]! * 0.9 + 0.12, fade = src[o + 5]!, pat = src[o + 7]!;
      const head = node(o, 0);
      let prev = head;
      const wx = (v: number, ref: number): number => {
        // keep the chain contiguous across the periodic seam
        let d = v - ref;
        d -= Math.round(d);
        return ref + d;
      };
      const pts: [number, number][] = [head];
      for (let i = 1; i < nn; i++) {
        const q = node(o, i);
        const qq: [number, number] = [wx(q[0], prev[0]), wx(q[1], prev[1])];
        pts.push(qq);
        prev = qq;
      }
      const hx = (((head[0] % 1) + 1) % 1);
      const hz = (((head[1] % 1) + 1) % 1);
      const shiftX = hx - head[0], shiftZ = hz - head[1];
      for (let i = 0; i < nn; i++) {
        const X = (pts[i]![0] + shiftX - 0.5) * S, Z = (pts[i]![1] + shiftZ - 0.5) * S;
        const t = i / Math.max(1, nn - 1);
        const w = (0.022 + 0.018 * Math.cos(t * 1.4)) * size;
        const yy = y + Math.sin(src[o + 6]! - i * 0.9) * 0.012 * size;
        if (i < nn - 1 && k < SEGS) {
          const X1 = (pts[i + 1]![0] + shiftX - 0.5) * S, Z1 = (pts[i + 1]![1] + shiftZ - 0.5) * S;
          const t1 = (i + 1) / Math.max(1, nn - 1);
          const w1 = (0.022 + 0.018 * Math.cos(t1 * 1.4)) * size;
          const yy1 = y + Math.sin(src[o + 6]! - (i + 1) * 0.9) * 0.012 * size;
          A.set([X, yy, Z, w], k * 4);
          B.set([X1, yy1, Z1, w1], k * 4);
          C.set([hue - (pred > 0.5 ? 0.95 : 0.49) + 0.5, pred, fade, t], k * 4);
          k++;
        }
        if (sp < MAX_CREATURES * MAX_NODES) {
          const lit = i === 0 || (pat * 7 + i) % 2 < 1;
          SA.set([X, yy + 0.004, Z, i === 0 ? 0.034 * size : lit ? 0.022 * size : w * 1.9], sp * 4);
          SB.set([hue, pred, fade * (lit ? 1 : 0.35), pat * 10 + i], sp * 4);
          sp++;
        }
      }
    }
    segGeo.instanceCount = k;
    spotGeo.instanceCount = sp;
    for (const at of [this.segAttr.a, this.segAttr.b, this.segAttr.c, this.spotAttr.a, this.spotAttr.b]) at.needsUpdate = true;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    u.time.value = f.time;
    u.lod.value = f.lodMix;
    // Ediacaran daylight → Cambrian twilight
    u.cambrian.value = smoothstep(-5.6e8, -5.39e8, f.T);
    u.rays.value = 1;
    const p = shot.def.params ?? {};
    u.focus.value = Number(p.focus ?? 3.2);
    u.aperture.value = Number(p.aperture ?? 0.5);
    if (f.lodMix < 0.02) this.u.pop.value = 0.5;
    this.upload(f);
    this.scene.traverse((o) => {
      if (o.userData.ray) {
        o.lookAt(this.camera.position.x, o.position.y, this.camera.position.z);
      }
    });
    void clamp01;
  }
}

void max;
void dot;
void exp;
void length;
void cos;
void vec2;
