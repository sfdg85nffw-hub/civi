import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { Rng } from '../../core/rng';
import { fbm2, noise1 } from '../../core/noise';
import { clamp01, smoothstep } from '../../core/math';
import { vnoise } from '../tsl/noiseTex';

const {
  uniform, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, cameraPosition, normalize, dot, max, min, abs, exp, pow,
  sin, cos, clamp, length, Loop, int, fract, screenCoordinate, fog, densityFogFactor, modelWorldMatrix, cameraViewMatrix, uv,
} = T;

const FIRE = new THREE.Vector3(0, 0, 0);

/** blackbody-ish ramp: t in 0..1 → deep red → orange → yellow-white */
const blackbody = (t: N): N =>
  mix(mix(vec3(0.5, 0.04, 0.0), vec3(1.0, 0.32, 0.03), sst(0.0, 0.45, t)), vec3(1.0, 0.86, 0.55), sst(0.45, 1.0, t));

/**
 * The first flame (~1 Mya). Total darkness, a few stars; sparks struck from
 * stone; an ember catches; a flame rises and embers climb into the sky.
 */
export class FireStage extends Stage {
  readonly name = 'fire';
  readonly u = {
    time: uniform(0),
    ignite: uniform(0), // 0 dark .. 1 full flame
    strike: uniform(0), // spark bursts
    light: uniform(0),
  };
  private light!: THREE.PointLight;
  private lastU = 0;

  build(): void {
    this.post = { bloom: 0.7, threshold: 0.25, exposure: 1.0, grain: 0.04, vignette: 0.55, chroma: 0.0015 };
    this.camera.near = 0.02;
    this.camera.far = 400;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.scene.fogNode = fog(vec3(0.0, 0.0, 0.0), densityFogFactor(float(0.06)));
    this.light = new THREE.PointLight(0xff7a30, 0, 9, 2);
    this.light.position.set(0, 0.35, 0);
    this.scene.add(this.light);
    this.scene.add(this.sky());
    this.scene.add(this.ground());
    this.scene.add(this.stones());
    this.scene.add(this.flame());
    this.scene.add(this.embers());
    this.scene.add(this.sparks());
  }

  private sky(): THREE.Object3D {
    const g = new THREE.Group();
    const rng = new Rng(0x5ca1, 2);
    const n = 5000;
    const a = new Float32Array(n * 4);
    const band = new THREE.Vector3(0.2, 0.75, -0.62).normalize();
    for (let i = 0; i < n; i++) {
      let v = new THREE.Vector3(rng.normal(), Math.abs(rng.normal()) + 0.05, rng.normal()).normalize();
      if (i < n * 0.5) {
        const h = new THREE.Vector3(1, 0, 0).cross(band).normalize();
        const o = band.clone().cross(h);
        const t = rng.range(0, Math.PI * 2);
        v = h.multiplyScalar(Math.cos(t)).add(o.multiplyScalar(Math.sin(t))).add(band.clone().multiplyScalar(rng.normal(0, 0.1))).normalize();
        if (v.y < 0.02) v.y = Math.abs(v.y) + 0.02;
      }
      a.set([v.x * 300, v.y * 300, v.z * 300, Math.pow(rng.next(), 5)], i * 4);
    }
    const u = this.u;
    g.add(
      makeParticles({
        count: n,
        attributes: { a: [a, 4] },
        renderOrder: 0,
        softness: 3,
        build: (at) => {
          const tw = sin(u.time.mul(1.5).add(at.a.w.mul(400.0))).mul(0.15).add(0.85);
          // the fire's glare pales the stars a little once it is lit
          return { center: at.a.xyz, size: at.a.w.mul(1.3).add(0.5), color: vec3(0.85, 0.9, 1.0).mul(at.a.w.mul(3.0).add(0.08)).mul(tw).mul(float(1.0).sub(u.ignite.mul(0.35))).mul(0.8) };
        },
      }),
    );
    // a faint glow along the horizon and the hills' silhouette
    const hills = new THREE.Mesh(
      new THREE.CylinderGeometry(120, 120, 30, 256, 1, true),
      new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, depthWrite: false, fog: false }),
    );
    (hills.material as THREE.MeshBasicNodeMaterial).colorNode = Fn(() => {
      const q = uv();
      const ridge = vnoise(vec3(q.x.mul(40.0), 0.0, 0.0), 'g').mul(0.06).add(vnoise(vec3(q.x.mul(160.0), 3.0, 0.0), 'a').mul(0.02)).add(0.5);
      const sky = sst(ridge, ridge.add(0.04), q.y).mul(sst(0.75, 0.48, q.y));
      return vec4(vec3(0.012, 0.016, 0.03).mul(sky), 1.0);
    })();
    hills.position.y = 5;
    hills.renderOrder = -1;
    g.add(hills);
    return g;
  }

  private ground(): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(80, 80, 200, 200);
    geo.rotateX(-Math.PI / 2);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i);
      p.setY(i, fbm2(x * 0.3, z * 0.3, 4, 3) * 0.25 * Math.min(1, Math.hypot(x, z) / 3) + fbm2(x * 3, z * 3, 2, 5) * 0.02);
    }
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.95 });
    const w = positionWorld;
    mat.colorNode = mix(vec3(0.05, 0.035, 0.022), vec3(0.09, 0.065, 0.04), vnoise(w.mul(1.5), 'a').mul(0.5).add(0.5)).mul(sst(0.2, 0.9, length(w.xz)).mul(0.6).add(0.4));
    // ash and char near the hearth
    mat.emissiveNode = vec3(1.0, 0.3, 0.05).mul(sst(0.45, 0.0, length(w.xz)).mul(vnoise(w.mul(12.0).add(vec3(0, this.u.time.mul(0.5), 0)), 'a').mul(0.5).add(0.5).pow(4.0)).mul(this.u.ignite).mul(0.6));
    return new THREE.Mesh(geo, mat);
  }

  private stones(): THREE.Object3D {
    const g = new THREE.Group();
    const rng = new Rng(0x570e, 1);
    const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.8 });
    mat.colorNode = mix(vec3(0.07, 0.06, 0.055), vec3(0.14, 0.12, 0.1), vnoise(positionWorld.mul(6.0), 'b').mul(0.5).add(0.5));
    // a loose, uneven hearth: stones where they happened to be, not a masonry ring
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + rng.range(-0.35, 0.35);
      const geo = new THREE.SphereGeometry(rng.range(0.06, 0.1), 20, 14);
      const pp = geo.getAttribute('position') as THREE.BufferAttribute;
      for (let k = 0; k < pp.count; k++) {
        const s = 1 + 0.18 * fbm2(pp.getX(k) * 30 + i, pp.getY(k) * 30 + pp.getZ(k) * 20, 3, i);
        pp.setXYZ(k, pp.getX(k) * s * 1.3, pp.getY(k) * s * 0.7, pp.getZ(k) * s);
      }
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, mat);
      const rr = rng.range(0.3, 0.44);
      m.position.set(Math.cos(a) * rr, 0.02 + rng.range(0, 0.02), Math.sin(a) * rr);
      m.rotation.set(rng.range(0, 3), rng.range(0, 3), rng.range(0, 3));
      g.add(m);
    }
    // the fuel: a few crossed sticks
    const stick = new THREE.MeshStandardNodeMaterial({ roughness: 0.9 });
    stick.colorNode = vec3(0.05, 0.03, 0.02);
    stick.emissiveNode = vec3(1.0, 0.35, 0.08).mul(this.u.ignite.mul(0.25)).mul(vnoise(positionWorld.mul(20.0), 'a').mul(0.5).add(0.5).pow(3.0));
    // a few irregular branches leaning together, not a radial star
    for (let i = 0; i < 4; i++) {
      const len = rng.range(0.28, 0.46);
      const m = new THREE.Mesh(new THREE.CylinderGeometry(rng.range(0.008, 0.012), rng.range(0.013, 0.02), len, 7), stick);
      const a = rng.range(0, Math.PI * 2);
      m.position.set(rng.normal(0, 0.03), 0.05 + rng.range(0, 0.03), rng.normal(0, 0.03));
      m.rotation.set(rng.range(0.2, 0.6), a, Math.PI / 2 - rng.range(0.15, 0.55));
      g.add(m);
    }
    return g;
  }

  private flame(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    mat.colorNode = Fn(() => {
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(cameraPosition));
      // bounding box intersection (the flame lives in |x|,|z| < 0.35, 0 < y < 1.2)
      const bmin = vec3(-0.35, 0.0, -0.35);
      const bmax = vec3(0.35, 1.2, 0.35);
      const inv = vec3(1.0).div(rd);
      const t0s = bmin.sub(ro).mul(inv);
      const t1s = bmax.sub(ro).mul(inv);
      const tmin = min(t0s, t1s);
      const tmax = max(t0s, t1s);
      const tn = max(max(tmin.x, tmin.y), max(tmin.z, 0.0));
      const tf = min(min(tmax.x, tmax.y), tmax.z);
      const N = 48;
      const ds = max(tf.sub(tn), 0.0).div(N);
      const jit = fract(sin(dot(screenCoordinate.xy, vec2(12.9898, 78.233))).mul(43758.5453)).mul(0.35);
      const acc = vec3(0).toVar();
      const ig = u.ignite;
      const tt = u.time;
      Loop({ start: int(0), end: int(N) }, ({ i }: N) => {
        const p = ro.add(rd.mul(tn.add(ds.mul(float(i).add(jit)))));
        const h = p.y.div(ig.mul(0.55).add(0.06));
        const sway = vec2(vnoise(vec3(0.0, p.y.mul(1.5).sub(tt.mul(0.9)), 1.0), 'g'), vnoise(vec3(2.0, p.y.mul(1.5).sub(tt.mul(0.9)), 3.0), 'g')).mul(h.mul(0.12));
        const turb = vnoise(vec3(p.x.mul(3.0), p.y.mul(2.2).sub(tt.mul(2.2)), p.z.mul(3.0)), 'g').mul(0.65).add(vnoise(vec3(p.x.mul(6.0), p.y.mul(4.5).sub(tt.mul(3.4)), p.z.mul(6.0)), 'b').mul(0.35));
        const rmax = float(0.17).mul(pow(clamp(float(1.0).sub(h), 0.0, 1.0), 0.75)).mul(ig.mul(0.6).add(0.4)).mul(turb.mul(0.35).add(1.0));
        const r = length(p.xz.sub(sway));
        const body = sst(rmax, rmax.mul(0.25), r).mul(sst(1.0, 0.55, h)).mul(sst(0.0, 0.05, p.y));
        const tongues = sst(0.05, 0.6, turb.add(0.3).sub(h.mul(0.5)));
        const dens = body.mul(tongues);
        const temp = clamp(dens.mul(1.4).sub(h.mul(0.35)).add(0.15), 0.0, 1.0);
        acc.addAssign(blackbody(temp).mul(dens).mul(ds).mul(22.0).mul(ig));
      });
      return vec4(acc, 1.0);
    })();
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.2, 0.7), mat);
    m.position.y = 0.6;
    m.renderOrder = 12;
    return m;
  }

  private embers(): THREE.Object3D {
    const rng = new Rng(0xe3b, 5);
    const n = 600;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.normal(0, 0.06), rng.next(), rng.normal(0, 0.06), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 14,
      softness: 3.0,
      build: (at) => {
        const s = at.a.w;
        const life = s.mul(3.0).add(2.5);
        const ph = fract(at.a.y.add(u.time.div(life)));
        const h = ph.pow(0.8).mul(s.mul(6.0).add(2.5));
        const drift = vec3(vnoise(vec3(s.mul(30.0), h.mul(0.4), u.time.mul(0.1)), 'g'), 0.0, vnoise(vec3(s.mul(17.0), h.mul(0.4), 4.0), 'g')).mul(h.mul(0.35));
        const p = vec3(at.a.x, h.add(0.15), at.a.z).add(drift).add(vec3(h.mul(0.08), 0, 0));
        const cool = sst(0.0, 0.8, ph);
        const col = mix(vec3(1.0, 0.7, 0.3), vec3(0.8, 0.12, 0.02), cool).mul(float(1.0).sub(ph).pow(2.0)).mul(sst(0.0, 0.05, ph)).mul(u.ignite.pow(2.0)).mul(1.2);
        return { center: p, size: float(0.0035).add(s.mul(0.003)), color: col };
      },
    });
  }

  private sparks(): THREE.Object3D {
    const rng = new Rng(0x5a6, 6);
    const n = 160;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([rng.normal(0, 1), Math.abs(rng.normal(0, 1)) + 0.3, rng.normal(0, 1), rng.next()], i * 4);
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 15,
      softness: 4.0,
      build: (at) => {
        // each strike throws a fan of sparks that arc and die within half a second
        const k = u.strike;
        const p = vec3(0.12, 0.1, 0.05).add(at.a.xyz.mul(k.mul(0.35))).sub(vec3(0, k.mul(k).mul(0.2), 0));
        const col = vec3(1.0, 0.8, 0.45).mul(float(1.0).sub(k).pow(2.0)).mul(sst(0.0, 0.05, k)).mul(4.0);
        return { center: p, size: float(0.006), color: col };
      },
    });
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    u.time.value = f.time;
    const x = clamp01(shot.u);
    // three strikes in the dark, then the ember catches
    const strikes = [0.08, 0.17, 0.25];
    let k = 1;
    for (const s of strikes) if (x >= s && x < s + 0.06) k = (x - s) / 0.06;
    u.strike.value = k;
    const ig = smoothstep(0.26, 0.62, x);
    u.ignite.value = ig * (0.9 + 0.1 * noise1(f.time * 7, 3));
    if (this.lastU < 0.27 && x >= 0.27 && !f.freshStage) f.cue('flame');
    this.lastU = x;
    const flick = 0.82 + 0.18 * noise1(f.time * 9.0, 1) + 0.08 * noise1(f.time * 23, 2);
    this.light.intensity = ig * 3.2 * flick + (k < 1 ? (1 - k) * 0.5 : 0);
    void FIRE;
  }
}

void abs;
void exp;
void cos;
void modelWorldMatrix;
void cameraViewMatrix;
