import * as THREE from 'three/webgpu';
import { T } from '../tsl/T';
import { makeParticles } from '../particles';
import { ROUTES, gcDist, type Route } from '../../data/history';
import { latLonToVec3 } from '../../core/math';

const { uniform, vec3, float, sin, fract, smoothstep: sst, max, min, abs, mix, normalize, dot } = T;

/**
 * Trade as light: luminous threads along the Silk Road and the sea lanes,
 * with caravan and ship pulses travelling them. A plague front can darken
 * the threads as it moves outward from its origin.
 */
export class ThreadsLayer {
  readonly mesh: THREE.Mesh;
  readonly u = {
    year: uniform(0),
    time: uniform(0),
    vis: uniform(0),
    plague: uniform(-1), // front radius in degrees (−1 = none)
    plagueOrigin: uniform(new THREE.Vector3(...latLonToVec3(45.03, 35.38))),
    sun: uniform(new THREE.Vector3(1, 0, 0)),
  };

  constructor(routes: Route[] = ROUTES, color: [number, number, number] = [1.0, 0.72, 0.35], altitude = 1.004, speed = 0.18, width = 0.0026) {
    const pts: number[] = [];
    const meta: number[] = [];
    routes.forEach((r, ri) => {
      // total length for even spacing
      let total = 0;
      for (let i = 0; i < r.pts.length - 1; i++) total += gcDist(r.pts[i]![0], r.pts[i]![1], r.pts[i + 1]![0], r.pts[i + 1]![1]);
      let acc = 0;
      for (let i = 0; i < r.pts.length - 1; i++) {
        const a = new THREE.Vector3(...latLonToVec3(r.pts[i]![0], r.pts[i]![1]));
        const b = new THREE.Vector3(...latLonToVec3(r.pts[i + 1]![0], r.pts[i + 1]![1]));
        const seg = gcDist(r.pts[i]![0], r.pts[i]![1], r.pts[i + 1]![0], r.pts[i + 1]![1]);
        const n = Math.max(2, Math.ceil(seg * 14));
        for (let k = 0; k < n; k++) {
          const t = k / n;
          const ang = a.angleTo(b);
          const p = ang < 1e-6 ? a.clone() : a.clone().multiplyScalar(Math.sin((1 - t) * ang) / Math.sin(ang)).add(b.clone().multiplyScalar(Math.sin(t * ang) / Math.sin(ang)));
          pts.push(p.x, p.y, p.z, (acc + seg * t) / total);
          meta.push(r.from, r.to, r.weight, ri + total * 0.001);
        }
        acc += seg;
      }
    });
    const n = pts.length / 4;
    const u = this.u;
    this.mesh = makeParticles({
      count: n,
      attributes: { a: [new Float32Array(pts), 4], b: [new Float32Array(meta), 4] },
      renderOrder: 23,
      softness: 2.0,
      build: (at) => {
        const yr = u.year;
        const active = sst(at.b.x, at.b.x.add(80.0), yr).mul(float(1.0).sub(sst(at.b.y.sub(40.0), at.b.y.add(40.0), yr)));
        const pulse = fract(at.a.w.mul(at.b.w.mul(1000.0).max(1.0).mul(0.25)).sub(u.time.mul(speed)).add(at.b.w));
        const bead = sst(0.95, 1.0, pulse).mul(1.6);
        // the plague front: threads within the front darken, then recover behind it
        const d = T.acos(min(max(dot(normalize(at.a.xyz), u.plagueOrigin), -1.0), 1.0)).mul(180.0 / Math.PI);
        const front = u.plague;
        const dark = sst(front.sub(25.0), front, d).oneMinus().mul(sst(front.sub(70.0), front.sub(30.0), d)).mul(front.greaterThan(0.0).select(float(1.0), float(0.0)));
        const plagueDim = float(1.0).sub(dark.mul(0.7));
        // at the front itself the threads burn a sick red; behind it they are ash
        const edge = T.exp(T.abs(d.sub(front)).mul(-0.35)).mul(front.greaterThan(0.0).select(float(1.0), float(0.0)));
        const nW = normalize(T.modelWorldMatrix.mul(T.vec4(at.a.xyz, 0.0)).xyz);
        const night = sst(0.2, -0.15, dot(nW, u.sun)).mul(0.85).add(0.15);
        const gold = mix(vec3(color[0], color[1], color[2]), vec3(1.0, 0.95, 0.85), bead.min(1.0));
        const tint = mix(mix(gold, vec3(0.32, 0.3, 0.28), dark), vec3(1.0, 0.18, 0.08), edge.mul(0.85));
        const col = tint.mul(float(0.22).add(bead).add(edge.mul(1.4))).mul(at.b.z).mul(active).mul(u.vis).mul(plagueDim).mul(night).mul(0.5);
        return { center: at.a.xyz.mul(altitude), size: float(width).add(bead.mul(width)), color: col.mul(0.6) };
      },
    });
    void abs;
    void sin;
  }
}
