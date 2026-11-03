import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { fbm2 } from '../../core/noise';
import { vnoise } from '../tsl/noiseTex';
import { ECO_STRIDE } from '../../sim/agents/ecosystem';

const {
  uniform, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, normalWorld, cameraPosition, normalize, dot, max, abs, pow,
  sin, clamp, length, texture, instancedBufferAttribute, modelViewMatrix, cameraProjectionMatrix, positionGeometry, varying, fog, densityFogFactor,
} = T;

export const LAND_SIZE = 6;
const PG = 64;
const MAX = 900;

function heightAt(x: number, z: number): number {
  // a river valley winding through low ridges
  const valley = Math.exp(-Math.pow((z - Math.sin(x * 0.7) * 0.8) / 0.55, 2)) * 0.18;
  const ridges = Math.abs(fbm2(x * 0.35, z * 0.35, 5, 41)) * 0.55;
  return fbm2(x * 0.18, z * 0.18, 4, 40) * 0.25 + ridges - valley;
}

/**
 * Aerial dusk over the living land: vegetation the herds graze away, a river,
 * and the animals themselves as streaks of light (agents from the worker).
 */
export class LandStage extends Stage {
  readonly name = 'land';
  readonly u = {
    time: uniform(0),
    lod: uniform(0),
    alpha: uniform(0),
    lush: uniform(1),
    sun: uniform(new THREE.Vector3(-0.8, 0.22, -0.4).normalize()),
  };
  private fieldTex!: THREE.DataTexture;
  private fieldData = new Uint8Array(PG * PG * 4);
  private attr!: { a: THREE.InstancedBufferAttribute; b: THREE.InstancedBufferAttribute };
  private mesh!: THREE.Mesh;
  private lastVersion = -1;

  build(): void {
    this.post = { bloom: 0.6, threshold: 0.25, exposure: 1.0, grain: 0.035, vignette: 0.42, chroma: 0.0015 };
    this.camera.near = 0.02;
    this.camera.far = 80;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.fieldTex = new THREE.DataTexture(this.fieldData, PG, PG, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.fieldTex.wrapS = this.fieldTex.wrapT = THREE.RepeatWrapping;
    this.fieldTex.magFilter = this.fieldTex.minFilter = THREE.LinearFilter;
    this.fieldTex.generateMipmaps = false;
    this.fieldTex.needsUpdate = true;
    this.scene.fogNode = fog(vec3(0.06, 0.035, 0.025), densityFogFactor(float(0.11)));
    this.scene.add(this.sky());
    this.scene.add(this.terrain());
    this.mesh = this.animals();
    this.scene.add(this.mesh);
  }

  private sky(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false });
    mat.colorNode = Fn(() => {
      const d = normalize(positionWorld.sub(cameraPosition));
      const h = clamp(d.y, -0.2, 1.0);
      const sunDot = max(dot(d, u.sun), 0.0);
      const horizon = vec3(0.55, 0.28, 0.14).mul(sst(0.35, 0.0, h));
      const zenith = vec3(0.03, 0.05, 0.1).mul(sst(0.0, 0.8, h));
      const glow = vec3(1.0, 0.55, 0.25).mul(pow(sunDot, 12.0).mul(0.8)).add(vec3(1.0, 0.8, 0.6).mul(pow(sunDot, 400.0).mul(6.0)));
      return vec4(horizon.add(zenith).add(glow).mul(0.6), 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 16), mat);
    m.renderOrder = -2;
    return m;
  }

  private terrain(): THREE.Mesh {
    const span = LAND_SIZE * 3;
    const geo = new THREE.PlaneGeometry(span, span, 300, 300);
    geo.rotateX(-Math.PI / 2);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) p.setY(i, heightAt(p.getX(i), p.getZ(i)));
    geo.computeVertexNormals();
    const u = this.u;
    const ft = this.fieldTex;
    const mat = new THREE.MeshBasicNodeMaterial();
    mat.colorNode = Fn(() => {
      const w = positionWorld;
      const q = vec2(w.x.div(LAND_SIZE).add(0.5), float(0.5).sub(w.z.div(LAND_SIZE)));
      const f = texture(ft, q);
      const veg = f.r;
      const herd = f.g;
      const hunt = f.b;
      const n = normalize(normalWorld);
      const ndl = max(dot(n, u.sun), 0.0);
      const canopy = vnoise(w.mul(2.2), 'a').mul(0.5).add(0.5);
      const ground = mix(vec3(0.16, 0.11, 0.07), vec3(0.24, 0.17, 0.1), vnoise(w.mul(0.6), 'g').mul(0.5).add(0.5));
      const green = mix(vec3(0.03, 0.07, 0.025), vec3(0.06, 0.12, 0.04), canopy).mul(mix(float(0.7), float(1.0), u.lush));
      let alb = mix(ground, green, sst(0.15, 0.7, veg.mul(canopy.mul(0.4).add(0.8))));
      // water in the valley
      const water = sst(-0.07, -0.1, w.y);
      const V = normalize(cameraPosition.sub(w));
      const H = normalize(u.sun.add(V));
      const glint = pow(max(dot(vec3(0, 1, 0), H), 0.0), 120.0).mul(2.5);
      const sky = vec3(0.04, 0.05, 0.08);
      const relief = sst(0.0, 0.5, w.y.add(0.1));
      const lit = alb.mul(vec3(1.0, 0.58, 0.3).mul(ndl.pow(1.5).mul(1.1)).add(sky.mul(relief.mul(0.6).add(0.4))));
      const waterC = vec3(0.01, 0.015, 0.02).add(vec3(1.0, 0.6, 0.3).mul(glint)).add(vec3(0.3, 0.15, 0.08).mul(0.05));
      let col = mix(lit, waterC, water);
      // field representation at speed: herds and hunters as warm density glows
      const glow = vec3(1.0, 0.6, 0.2).mul(sst(0.0, 0.6, herd)).add(vec3(1.0, 0.15, 0.08).mul(sst(0.0, 0.4, hunt))).mul(0.12).mul(float(1.0).sub(u.lod));
      col = col.add(glow);
      // keep the eye on the central tile
      const dc = length(w.xz).div(LAND_SIZE * 0.5);
      return vec4(col.mul(sst(1.6, 0.8, dc)), 1.0);
    })();
    return new THREE.Mesh(geo, mat);
  }

  private animals(): THREE.Mesh {
    const geo = new THREE.InstancedBufferGeometry();
    const base = new THREE.PlaneGeometry(1, 1);
    geo.index = base.index;
    geo.setAttribute('position', base.getAttribute('position'));
    geo.setAttribute('uv', base.getAttribute('uv'));
    const a = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 4), 4);
    const b = new THREE.InstancedBufferAttribute(new Float32Array(MAX * 4), 4);
    a.setUsage(THREE.DynamicDrawUsage);
    b.setUsage(THREE.DynamicDrawUsage);
    geo.setAttribute('aa', a);
    geo.setAttribute('ab', b);
    geo.instanceCount = 0;
    this.attr = { a, b };
    const A = instancedBufferAttribute(a); // world x, y, z, size
    const B = instancedBufferAttribute(b); // vx, vz (world/s), pred, alpha
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    // a streak along the velocity, lying just above the ground
    const v = vec3(B.x, 0, B.y);
    const spd = length(v);
    const dir = normalize(v.add(vec3(1e-5, 0, 0)));
    const sideV = normalize(vec3(dir.z.negate(), 0, dir.x));
    const corner = positionGeometry.xy;
    const len = A.w.mul(0.02).add(spd.mul(0.35));
    const wid = A.w.mul(0.012);
    const world = A.xyz.add(dir.mul(corner.x.mul(len))).add(sideV.mul(corner.y.mul(wid))).add(vec3(0, 0.01, 0));
    mat.vertexNode = cameraProjectionMatrix.mul(modelViewMatrix.mul(vec4(world, 1.0)));
    const vUV = varying(corner.mul(2.0));
    const vB = varying(B);
    mat.colorNode = Fn(() => {
      const r = abs(vUV.y);
      const head = sst(-1.0, 0.8, vUV.x);
      const core = sst(1.0, 0.0, r).pow(1.5).mul(head);
      const herb = vec3(1.0, 0.62, 0.25);
      const pred = vec3(1.0, 0.18, 0.08);
      return vec4(mix(herb, pred, vB.z).mul(core).mul(vB.w).mul(u.lod).mul(1.4), 1.0);
    })();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = 10;
    return mesh;
  }

  private upload(f: FrameContext): void {
    const ag = f.agents;
    const geo = this.mesh.geometry as THREE.InstancedBufferGeometry;
    if (!ag || ag.sim !== 'ecosystem') {
      geo.instanceCount = 0;
      return;
    }
    const s = ag.snap;
    if (ag.version !== this.lastVersion) {
      this.lastVersion = ag.version;
      const fld = s.fields.land;
      if (fld) {
        const d = fld.data, o = this.fieldData;
        for (let i = 0; i < PG * PG; i++) {
          o[i * 4] = Math.min(255, d[i * 4]! * 255);
          o[i * 4 + 1] = Math.min(255, d[i * 4 + 1]! * 255);
          o[i * 4 + 2] = Math.min(255, d[i * 4 + 2]! * 255);
          o[i * 4 + 3] = 255;
        }
        this.fieldTex.needsUpdate = true;
      }
    }
    const A = this.attr.a.array as Float32Array, B = this.attr.b.array as Float32Array;
    const n = Math.min(s.count, MAX);
    const al = ag.alpha;
    const S = LAND_SIZE;
    for (let k = 0; k < n; k++) {
      const o = k * ECO_STRIDE;
      let dx = s.agents[o]! - s.agents[o + 2]!, dy = s.agents[o + 1]! - s.agents[o + 3]!;
      dx -= Math.round(dx);
      dy -= Math.round(dy);
      const x = ((s.agents[o + 2]! + dx * al) % 1 + 1) % 1, y = ((s.agents[o + 3]! + dy * al) % 1 + 1) % 1;
      const X = (x - 0.5) * S, Z = (0.5 - y) * S;
      A.set([X, heightAt(X, Z), Z, s.agents[o + 5]!], k * 4);
      B.set([dx * S * 30, -dy * S * 30, s.agents[o + 4]!, s.agents[o + 7]!], k * 4);
    }
    geo.instanceCount = n;
    this.attr.a.needsUpdate = true;
    this.attr.b.needsUpdate = true;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    u.time.value = f.time;
    u.lod.value = f.lodMix;
    u.lush.value = f.world.vegetation;
    this.upload(f);
    void shot;
  }
}

void sin;
void vec2;
void dot;
