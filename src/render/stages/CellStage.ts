import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { makeParticles } from '../particles';
import { vnoise } from '../tsl/noiseTex';
import { Rng } from '../../core/rng';
import { clamp01, easeInOutCubic, smoothstep } from '../../core/math';

const {
  uniform, vec2, vec3, vec4, float, Fn, mix, smoothstep: sst, positionWorld, cameraPosition, normalize, dot, max, min, abs, exp, pow,
  sin, cos, clamp, mx_noise_float, length, Loop, int, fract, screenCoordinate, If, Break,
} = T;

/**
 * ENDOSYMBIOSIS — an intimate, volumetric close-up rendered like fluorescence
 * microscopy: a raymarched emission–absorption volume of membranes (thin
 * shells around signed-distance fields). A host cell folds around a small
 * bacterium, closes over it, and the captive becomes a double-membraned
 * mitochondrion whose cristae begin to glow.
 */
export class CellStage extends Stage {
  readonly name = 'cell';
  readonly u = {
    time: uniform(0),
    bac: uniform(new THREE.Vector3(1.6, 0.25, 0.4)), // bacterium centre
    bacAxis: uniform(new THREE.Vector3(0.3, 0.9, 0.2).normalize()),
    wrap: uniform(0), // envelope closure 0..1
    inside: uniform(0), // 0 outside .. 1 internalised
    mito: uniform(0), // transformation into a mitochondrion
    pulse: uniform(0),
    steps: uniform(72),
  };

  build(): void {
    this.post = { bloom: 0.45, threshold: 0.4, exposure: 1.0, grain: 0.035, vignette: 0.5, chroma: 0.0015 };
    this.camera.near = 0.01;
    this.camera.far = 100;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.scene.add(this.volume());
    this.scene.add(this.debris());
  }

  private volume(): THREE.Mesh {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    // ray–ellipsoid: centre c, unit axis a, radii (ra along axis, rr across); returns vec2(t0,t1) or (-1,-2)
    const hitEllipsoid = (ro: N, rd: N, c: N, a: N, ra: N, rr: N): N => {
      const o = ro.sub(c);
      const oa = dot(o, a);
      const da = dot(rd, a);
      const op = o.sub(a.mul(oa));
      const dp = rd.sub(a.mul(da));
      const sa = float(1.0).div(ra.mul(ra));
      const sr = float(1.0).div(rr.mul(rr));
      const A = da.mul(da).mul(sa).add(dot(dp, dp).mul(sr));
      const B = oa.mul(da).mul(sa).add(dot(op, dp).mul(sr));
      const C = oa.mul(oa).mul(sa).add(dot(op, op).mul(sr)).sub(1.0);
      const disc = B.mul(B).sub(A.mul(C));
      const sq = max(disc, 0.0).sqrt();
      return T.select(disc.greaterThan(0.0), vec2(B.negate().sub(sq).div(A), B.negate().add(sq).div(A)), vec2(-1.0, -2.0));
    };
    // membrane brightness where the ray crosses a surface: brighter at grazing incidence
    const shell = (ro: N, rd: N, c: N, a: N, ra: N, rr: N, tex: N): N => {
      const h = hitEllipsoid(ro, rd, c, a, ra, rr);
      const valid = h.y.greaterThan(h.x).and(h.y.greaterThan(0.0));
      const nAt = (t: N): N => {
        const p = ro.add(rd.mul(t)).sub(c);
        const pa = dot(p, a);
        return normalize(p.sub(a.mul(pa)).div(rr.mul(rr)).add(a.mul(pa).div(ra.mul(ra))));
      };
      const g0 = float(1.0).div(max(abs(dot(nAt(h.x), rd)), 0.06)).pow(1.7);
      const g1 = float(1.0).div(max(abs(dot(nAt(h.y), rd)), 0.06)).pow(1.7);
      const front = T.select(h.x.greaterThan(0.0), g0, float(0.0));
      return T.select(valid, front.add(g1.mul(0.75)).mul(tex), float(0.0));
    };
    mat.colorNode = Fn(() => {
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(cameraPosition));
      const t = u.time;
      const up = vec3(0, 1, 0);
      // ---- host: a slightly ruffled sphere (one fixed-point step onto the perturbed radius) ----
      const h0 = hitEllipsoid(ro, rd, vec3(0), up, float(1.0), float(1.0));
      const dir0 = normalize(ro.add(rd.mul(max(h0.x, 0.0))));
      const Rh = float(1.0);
      const memTex = vnoise(dir0.mul(2.2).add(vec3(0, t.mul(0.02), 0)), 'b').mul(0.45).add(0.8);
      const host = shell(ro, rd, vec3(0), up, Rh, Rh, memTex);
      // ---- envelope reaching around the bacterium ----
      const env = shell(ro, rd, u.bac, u.bacAxis, float(0.36), float(0.2), float(1.0)).mul(u.wrap);
      // ---- bacterium membrane, then a mitochondrion's double membrane ----
      const bac = shell(ro, rd, u.bac, u.bacAxis, float(0.275), float(0.105), float(1.0));
      const inner = shell(ro, rd, u.bac, u.bacAxis, float(0.24), float(0.075), float(1.0)).mul(u.mito);
      // ---- nucleus ----
      const nucC = vec3(-0.32, -0.12, -0.2);
      const nuc = shell(ro, rd, nucC, up, float(0.36), float(0.36), float(1.0));
      // ---- interior texture: a coarse march through the host's cytoplasm ----
      const hI = hitEllipsoid(ro, rd, vec3(0), up, float(1.0), float(1.0));
      const ta = max(hI.x, 0.0);
      const tb = max(hI.y, ta);
      const NS = 22;
      const ds = tb.sub(ta).div(NS);
      const jit = fract(sin(dot(screenCoordinate.xy, vec2(12.9898, 78.233))).mul(43758.5453));
      const vol = vec3(0).toVar();
      Loop({ start: int(0), end: int(NS) }, ({ i }: N) => {
        const p = ro.add(rd.mul(ta.add(ds.mul(float(i).add(jit)))));
        const nz = vnoise(p.mul(1.4).add(vec3(t.mul(0.01), 0, 0)), 'b');
        const gran = sst(0.45, 0.85, nz);
        const nc = p.sub(nucC);
        const dn = length(nc);
        const chrom = sst(0.36, 0.3, dn).mul(sst(0.15, 0.6, vnoise(nc.mul(1.2), 'a')));
        const er = sst(0.92, 1.0, sin(dn.mul(46.0).add(nz.mul(3.0))).mul(0.5).add(0.5)).mul(sst(0.8, 0.42, dn)).mul(sst(0.34, 0.42, dn));
        const q = p.sub(u.bac);
        const qa = dot(q, u.bacAxis);
        const inB = sst(1.0, 0.8, length(q.sub(u.bacAxis.mul(qa)).div(0.105)).mul(1.0).add(sst(0.15, 0.3, abs(qa))));
        const crist = sst(0.75, 0.95, sin(qa.mul(75.0).add(nz.mul(2.0))).mul(0.5).add(0.5)).mul(inB).mul(u.mito);
        vol.addAssign(vec3(0.85, 0.55, 0.9).mul(gran.mul(0.018)).add(vec3(0.35, 0.4, 1.0).mul(chrom.mul(0.12))).add(vec3(0.8, 0.45, 0.85).mul(er.mul(0.1))).add(vec3(1.0, 0.66, 0.22).mul(crist.mul(0.8).mul(u.pulse.mul(0.5).add(0.75)))).mul(ds));
      });
      const cHost = vec3(1.0, 0.3, 0.6);
      const cBac = mix(vec3(0.25, 1.0, 0.82), vec3(1.0, 0.72, 0.28), u.mito);
      const cNuc = vec3(0.35, 0.42, 1.0);
      const cGold = vec3(1.0, 0.7, 0.3);
      const k = float(0.006);
      const col = cHost.mul(host.add(env.mul(0.9)).mul(k)).add(cBac.mul(bac.mul(k).mul(1.4))).add(cGold.mul(inner.mul(k).mul(1.2))).add(cNuc.mul(nuc.mul(k).mul(0.8))).add(vol.mul(1.6));
      return vec4(col, 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(2.1, 48, 32), mat);
    m.renderOrder = 5;
    return m;
  }

  /** out-of-focus life drifting far behind: other cells, debris */
  private debris(): THREE.Object3D {
    const rng = new Rng(0xce11, 4);
    const n = 260;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const r = rng.range(3.5, 12);
      const th = rng.range(0, Math.PI * 2);
      const ph = rng.range(-0.6, 0.6);
      a.set([rng.range(-9, 9), rng.range(-5, 5), -rng.range(3.5, 14), rng.next()], i * 4);
      void r; void th; void ph;
    }
    const u = this.u;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 1,
      softness: 1.0,
      build: (at) => {
        const s = at.a.w;
        const p = at.a.xyz.add(vec3(sin(u.time.mul(0.07).add(s.mul(20.0))), cos(u.time.mul(0.05).add(s.mul(13.0))), 0).mul(0.2));
        const col = mix(vec3(0.25, 0.9, 0.8), vec3(1.0, 0.35, 0.6), fract(s.mul(7.0))).mul(0.018).mul(s.add(0.3));
        return {
          center: p,
          size: s.mul(0.5).add(0.15),
          color: col,
          shape: (qq: N) => {
            const r = length(qq);
            return sst(1.0, 0.9, r).mul(r.mul(0.5).add(0.5));
          },
        };
      },
    });
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const u = this.u;
    const x = clamp01(shot.u);
    u.time.value = f.time;
    // approach → press → envelope closes → internalised → transformation
    const approach = easeInOutCubic(smoothstep(0.0, 0.5, x));
    const sink = easeInOutCubic(smoothstep(0.35, 0.78, x));
    const start = new THREE.Vector3(1.75, 0.32, 0.35);
    const contact = new THREE.Vector3(1.08, 0.22, 0.28);
    const final = new THREE.Vector3(0.48, 0.18, 0.3);
    const p = start.clone().lerp(contact, approach).lerp(final, sink);
    (u.bac.value as THREE.Vector3).copy(p);
    const axis = new THREE.Vector3(0.35, 0.88, 0.25).normalize().lerp(new THREE.Vector3(0.1, 0.4, 0.9).normalize(), sink).normalize();
    (u.bacAxis.value as THREE.Vector3).copy(axis);
    u.wrap.value = smoothstep(0.25, 0.62, x) * (1 - smoothstep(0.78, 0.98, x) * 0.85);
    u.inside.value = sink;
    u.mito.value = smoothstep(0.7, 0.95, x);
    u.pulse.value = 0.5 + 0.5 * Math.sin(f.time * 2.2);
    if (x > 0.72 && x < 0.8) f.cue('membrane');
  }
}

void If;
void Break;
void pow;
void vec4;
