import { T, type N } from './T';

const { float, vec3, exp, max, sqrt, dot, Loop, int, If, mix, smoothstep, select } = T;

/**
 * Physically motivated single scattering (Rayleigh + Mie + an absorbing
 * hydrocarbon haze for the Archean sky). Planet radius = 1, at the origin.
 * Written as a node-emitting JS helper (not a TSL Fn) so callers can read
 * both outputs (in-scatter and transmittance) from one march.
 */
export interface AtmoUniforms {
  sun: N; // vec3 world direction toward the sun (normalised)
  sunI: N; // float sun intensity
  rayleigh: N; // vec3 scattering coefficients (per planet radius)
  mie: N; // float
  hazeS: N; // vec3 haze scattering
  hazeA: N; // vec3 haze absorption
  haze: N; // float 0..1
  density: N; // float overall density multiplier
}

export const ATMO_R = 1.035;
const HR = 0.0042;
const HM = 0.0012;
const HH = 0.0085;

/** Ray–sphere: returns vec2(t0, t1); t1 < t0 means miss (encoded as -1,-2). */
export function raySphere(ro: N, rd: N, r: number | N): N {
  const b = dot(ro, rd);
  const c = dot(ro, ro).sub(float(r).mul(r));
  const disc = b.mul(b).sub(c);
  const s = sqrt(max(disc, 0.0));
  const hit = disc.greaterThan(0.0);
  return select(hit, T.vec2(b.negate().sub(s), b.negate().add(s)), T.vec2(-1.0, -2.0));
}

export function scatter(ro: N, rd: N, t0: N, t1: N, U: AtmoUniforms, steps: number, lightSteps: number): { inscatter: N; trans: N } {
  const seg = max(t1.sub(t0), 0.0);
  const ds = seg.div(steps);
  const sumR = vec3(0).toVar();
  const sumM = vec3(0).toVar();
  const sumH = vec3(0).toVar();
  const odR = float(0).toVar();
  const odM = float(0).toVar();
  const odH = float(0).toVar();
  const bR = U.rayleigh.mul(U.density);
  const bM = U.mie.mul(U.density);
  const bHs = U.hazeS.mul(U.haze);
  const bHa = U.hazeA.mul(U.haze);
  Loop({ start: int(0), end: int(steps) }, ({ i }: N) => {
    const t = t0.add(ds.mul(float(i).add(0.5)));
    const p = ro.add(rd.mul(t));
    const h = max(p.length().sub(1.0), 0.0);
    const dR = exp(h.negate().div(HR)).mul(ds);
    const dM = exp(h.negate().div(HM)).mul(ds);
    const dH = exp(h.negate().div(HH)).mul(ds);
    odR.addAssign(dR);
    odM.addAssign(dM);
    odH.addAssign(dH);
    // optical depth toward the sun
    const lt = raySphere(p, U.sun, ATMO_R).y;
    const lds = max(lt, 0.0).div(lightSteps);
    const lR = float(0).toVar();
    const lM = float(0).toVar();
    const lH = float(0).toVar();
    Loop({ start: int(0), end: int(lightSteps) }, ({ i: j }: N) => {
      const lp = p.add(U.sun.mul(lds.mul(float(j).add(0.5))));
      const lh = max(lp.length().sub(1.0), 0.0);
      lR.addAssign(exp(lh.negate().div(HR)).mul(lds));
      lM.addAssign(exp(lh.negate().div(HM)).mul(lds));
      lH.addAssign(exp(lh.negate().div(HH)).mul(lds));
    });
    // planet shadow (soft, so the terminator glows)
    const b = dot(p, U.sun);
    const c = dot(p, p).sub(1.0);
    const shadowed = b.lessThan(0.0).and(b.mul(b).sub(c).greaterThan(0.0));
    const lit = select(shadowed, float(0.0), float(1.0));
    const tau = bR.mul(odR.add(lR)).add(vec3(bM.mul(1.1).mul(odM.add(lM)))).add(bHs.add(bHa).mul(odH.add(lH)));
    const att = exp(tau.negate()).mul(lit);
    sumR.addAssign(att.mul(dR));
    sumM.addAssign(att.mul(dM));
    sumH.addAssign(att.mul(dH));
  });
  const mu = dot(rd, U.sun);
  const phaseR = mu.mul(mu).add(1.0).mul(3.0 / (16.0 * Math.PI));
  const g = 0.76;
  const phaseM = float((3 * (1 - g * g)) / (8 * Math.PI * (2 + g * g))).mul(mu.mul(mu).add(1.0)).div(float(1 + g * g).sub(mu.mul(2 * g)).pow(1.5));
  const gh = 0.7;
  const phaseH = float((1 - gh * gh) / (4 * Math.PI)).div(float(1 + gh * gh).sub(mu.mul(2 * gh)).pow(1.5)).add(0.03);
  const inscatter = sumR.mul(bR).mul(phaseR).add(sumM.mul(bM).mul(phaseM)).add(sumH.mul(bHs).mul(phaseH)).mul(U.sunI);
  const trans = exp(bR.mul(odR).add(vec3(bM.mul(1.1).mul(odM))).add(bHs.add(bHa).mul(odH)).negate());
  void If;
  void mix;
  void smoothstep;
  return { inscatter, trans };
}
