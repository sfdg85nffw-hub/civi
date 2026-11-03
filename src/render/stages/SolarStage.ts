import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { clamp01, smoothstep } from '../../core/math';
import { vnoise } from '../tsl/noiseTex';

const {
  uniform, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, positionLocal, cameraPosition, normalize, dot, max, abs, pow, exp,
  sin, cos, clamp, length, instancedBufferAttribute, normalWorld, modelWorldMatrix, fract,
} = T;

const MERCURY_R = 1.15;
const SUN_R = 0.3;
const SWARM_N = 42000;

/**
 * The Sun after us: Mercury is unmade into raw material and a Dyson swarm of
 * real instanced mirrors shimmers into existence, dimming the star it feeds on.
 */
export class SolarStage extends Stage {
  readonly name = 'solar';
  readonly u = {
    time: uniform(0),
    mercury: uniform(1),
    dyson: uniform(0),
    ringView: uniform(0),
  };
  private mercury!: THREE.Mesh;
  private swarm!: THREE.InstancedMesh;

  build(): void {
    this.post = { bloom: 0.75, threshold: 0.6, exposure: 1.0, grain: 0.03, vignette: 0.4, chroma: 0.001 };
    this.camera.near = 0.01;
    this.camera.far = 500;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.scene.add(this.stars());
    this.scene.add(this.sun());
    this.scene.add(this.corona());
    this.mercury = this.buildMercury();
    this.scene.add(this.mercury);
    this.scene.add(this.debris());
    this.swarm = this.buildSwarm();
    this.scene.add(this.swarm);
  }

  private stars(): THREE.Object3D {
    const rng = new Rng(0x50a, 2);
    const n = 4000;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const v = new THREE.Vector3(rng.normal(), rng.normal(), rng.normal()).normalize().multiplyScalar(300);
      a.set([v.x, v.y, v.z, Math.pow(rng.next(), 6)], i * 4);
    }
    return makeParticles({ count: n, attributes: { a: [a, 4] }, renderOrder: 0, softness: 3, build: (at) => ({ center: at.a.xyz, size: at.a.w.mul(1.2).add(0.4), color: vec3(0.8, 0.85, 1.0).mul(at.a.w.mul(2.0).add(0.05)).mul(0.5) }) });
  }

  private sun(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial();
    mat.colorNode = Fn(() => {
      const n = normalize(positionLocal);
      const V = normalize(cameraPosition.sub(positionWorld));
      const mu = max(dot(normalize(normalWorld), V), 0.0);
      const limb = pow(mu, 0.55);
      const gran = vnoise(n.mul(9.0).add(vec3(0, u.time.mul(0.03), 0)), 'a').mul(0.5).add(0.5);
      const cells = vnoise(n.mul(2.2).add(vec3(u.time.mul(0.01), 0, 0)), 'g').mul(0.5).add(0.5);
      const spots = sst(0.78, 0.86, vnoise(n.mul(3.0).add(11.0), 'b').mul(0.5).add(0.5));
      let c = mix(vec3(1.0, 0.55, 0.2), vec3(1.0, 0.92, 0.75), limb).mul(gran.mul(0.25).add(0.85)).mul(cells.mul(0.15).add(0.92));
      c = c.mul(float(1.0).sub(spots.mul(0.6)));
      // the swarm takes the light: the photosphere dims as the mirrors close
      return vec4(c.mul(limb.mul(0.8).add(0.2)).mul(2.1).mul(float(1.0).sub(u.dyson.mul(0.6))), 1.0);
    })();
    return new THREE.Mesh(new THREE.SphereGeometry(SUN_R, 128, 64), mat);
  }

  private corona(): THREE.Object3D {
    const u = this.u;
    const one = new Float32Array([0, 0, 0, 0]);
    const g = new THREE.Group();
    g.add(
      makeParticles({
        count: 1,
        attributes: { a: [one, 4] },
        renderOrder: 2,
        softness: 1.0,
        build: (at) => ({
          center: at.a.xyz,
          size: float(1.25),
          color: vec3(1.0, 0.78, 0.55).mul(float(1.0).sub(u.dyson.mul(0.6))).mul(0.03),
          shape: (q: N) => {
            const r = length(q);
            const ray = vnoise(vec3(T.atan(q.y, q.x).mul(3.0), r.mul(2.0), u.time.mul(0.05)), 'b').mul(0.5).add(0.5);
            return exp(r.sub(0.18).max(0.0).mul(-6.0)).mul(ray.mul(0.6).add(0.4)).mul(sst(0.16, 0.2, r));
          },
        }),
      }),
    );
    return g;
  }

  private buildMercury(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial();
    mat.colorNode = Fn(() => {
      const n = normalize(positionLocal);
      const nW = normalize(normalWorld);
      const L = normalize(positionWorld.negate());
      const diff = max(dot(nW, L), 0.0);
      const cr = T.mx_worley_noise_float(n.mul(7.0));
      const alb = mix(vec3(0.16, 0.15, 0.14), vec3(0.3, 0.28, 0.26), vnoise(n.mul(4.0), 'g').mul(0.5).add(0.5)).mul(sst(0.02, 0.15, cr).mul(0.3).add(0.7));
      // mining scars glow where the planet is being cut apart
      const scars = sst(0.75, 0.95, vnoise(n.mul(6.0).add(vec3(u.time.mul(0.05), 0, 0)), 'b').mul(0.5).add(0.5)).mul(float(1.0).sub(u.mercury)).mul(sst(0.0, 0.2, float(1.0).sub(u.mercury)));
      return vec4(alb.mul(diff).mul(3.5).add(vec3(1.0, 0.5, 0.2).mul(scars).mul(2.0)), 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.035, 48, 24), mat);
    return m;
  }

  /** Mercury's substance strung out along its orbit */
  private debris(): THREE.Object3D {
    const rng = new Rng(0xde6, 3);
    const n = 6000;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.next(), rng.normal(0, 0.04), rng.normal(0, 0.012), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 6,
      softness: 2.0,
      build: (at) => {
        const spread = float(1.0).sub(u.mercury);
        const ang = u.time.mul(0.25).add(at.a.x.mul(spread).mul(6.2832).mul(at.a.w.mul(0.5).add(0.5)));
        const r = float(MERCURY_R).add(at.a.y.mul(spread.mul(1.6).add(0.08)));
        const p = vec3(cos(ang).mul(r), at.a.z.mul(spread.mul(1.2)), sin(ang).mul(r));
        const vis = sst(0.0, 0.08, spread).mul(float(1.0).sub(u.dyson.mul(0.6)));
        const col = mix(vec3(1.0, 0.6, 0.3), vec3(0.6, 0.6, 0.65), at.a.w).mul(vis).mul(0.25);
        return { center: p, size: float(0.0035), color: col };
      },
    });
  }

  private buildSwarm(): THREE.InstancedMesh {
    const rng = new Rng(0xd150, 4);
    const geo = new THREE.CircleGeometry(0.0075, 6);
    const n = SWARM_N;
    const inst = new Float32Array(n * 4);
    const inst2 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      // swarm: ~60 orbital rings, most near the ecliptic (a thick ring that reads as a disk), a few steep
      const ring = rng.int(0, 139);
      const ringRng = new Rng(ring * 7919, 1);
      const inc = ring < 118 ? ringRng.normal(0, 0.1) : ringRng.range(-1.1, 1.1);
      const node = ringRng.range(0, Math.PI * 2);
      const r = ringRng.range(0.62, 1.9) + rng.normal(0, 0.018);
      inst.set([r, inc, node, rng.next() * Math.PI * 2], i * 4);
      inst2.set([rng.next(), ring / 140, rng.next(), 0], i * 4);
    }
    geo.setAttribute('sw', new THREE.InstancedBufferAttribute(inst, 4));
    geo.setAttribute('sw2', new THREE.InstancedBufferAttribute(inst2, 4));
    const A = instancedBufferAttribute(geo.getAttribute('sw') as THREE.InstancedBufferAttribute);
    const B = instancedBufferAttribute(geo.getAttribute('sw2') as THREE.InstancedBufferAttribute);
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });
    // orbital position: rotate a circular orbit by inclination and node
    const ang = A.w.add(u.time.mul(float(0.35).div(A.x.pow(1.5))));
    const local = vec3(cos(ang).mul(A.x), 0.0, sin(ang).mul(A.x));
    const ci = cos(A.y), si = sin(A.y);
    const tilted = vec3(local.x, local.z.mul(si), local.z.mul(ci));
    const cn = cos(A.z), sn = sin(A.z);
    const center = vec3(tilted.x.mul(cn).sub(tilted.z.mul(sn)), tilted.y, tilted.x.mul(sn).add(tilted.z.mul(cn)));
    // each mirror faces the sun (normal along −centre), the panel lies in the plane perpendicular to it
    const nrm = normalize(center.negate());
    const t1 = normalize(T.cross(nrm, vec3(0.0, 1.0, 0.13)));
    const t2 = T.cross(nrm, t1);
    const visible = B.x.lessThan(u.dyson).select(float(1.0), float(0.0));
    const pl = positionLocal;
    mat.positionNode = center.add(t1.mul(pl.x).add(t2.mul(pl.y)).mul(visible));
    mat.colorNode = Fn(() => {
      const wp = positionWorld;
      const V = normalize(cameraPosition.sub(wp));
      const L = normalize(wp.negate());
      const r = length(wp);
      const irr = float(0.55).div(r).pow(2.0);
      // collectors: the sun-facing side is lit (seen across the far side of the swarm);
      // the back radiates its waste heat a dull red; edge-on panels glint
      const H = normalize(L.add(V));
      const glint = pow(max(abs(dot(nrm, H)), 0.0), 160.0).mul(10.0);
      const facing = dot(nrm, V);
      const lit = vec3(0.85, 0.82, 0.74).mul(max(facing, 0.0).mul(0.8).add(0.2)).mul(irr).mul(0.85);
      const heat = vec3(0.5, 0.07, 0.015).mul(irr).mul(0.12);
      const shimmer = sin(u.time.mul(2.0).add(B.z.mul(40.0))).mul(0.3).add(0.7);
      const col = facing.greaterThan(0.0).select(lit, heat).add(vec3(1.0, 0.88, 0.66).mul(glint.mul(shimmer).mul(irr)));
      return vec4(col, 1.0);
    })();
    const mesh = new THREE.InstancedMesh(geo, mat, n);
    mesh.frustumCulled = false;
    mesh.renderOrder = 8;
    return mesh;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    u.time.value = f.time;
    const w = f.world;
    u.mercury.value = w.mercury;
    u.dyson.value = Math.max(Number(shot.def.params?.dysonMin ?? 0), w.dyson);
    const a = 0.35 + f.time * 0.01;
    const s = Math.max(0.05, w.mercury);
    this.mercury.scale.setScalar(s);
    this.mercury.position.set(Math.cos(a) * MERCURY_R, 0, Math.sin(a) * MERCURY_R);
    this.mercury.visible = w.mercury > 0.04;
    void clamp01;
    void smoothstep;
  }
}

void vec2;
void clamp;
void fract;
void modelWorldMatrix;
