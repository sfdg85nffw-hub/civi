/**
 * Keyframed paleogeography. Each plate's paleo position is a rotation of its
 * present-day land (Natural Earth mask). Configurations are built from anchor
 * fits (a coastal point A moved to A', the plate then spun so point B heads
 * toward B'), in an Africa-fixed frame, then Africa's absolute motion is applied.
 * Self-contained (no imports) so Node tools can run it directly.
 */
export type Quat = [number, number, number, number];
export const PLATE_NAMES = ['namerica', 'samerica', 'africa', 'eurasia', 'india', 'australia', 'antarctica', 'greenland', 'arabia', 'madagascar', 'zealandia', 'pacific'] as const;
export const NPLATES = PLATE_NAMES.length;

const D = Math.PI / 180;
type V = [number, number, number];
export const ll = (lat: number, lon: number): V => [Math.cos(lat * D) * Math.sin(lon * D), Math.sin(lat * D), Math.cos(lat * D) * Math.cos(lon * D)];
export const toLL = (v: V): [number, number] => [Math.asin(Math.max(-1, Math.min(1, v[1]))) / D, Math.atan2(v[0], v[2]) / D];
const dot = (a: V, b: V): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V): V => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const qId = (): Quat => [0, 0, 0, 1];
export const qAxis = (axis: V, ang: number): Quat => {
  const s = Math.sin(ang / 2);
  const a = norm(axis);
  return [a[0] * s, a[1] * s, a[2] * s, Math.cos(ang / 2)];
};
export const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
export const qInv = (q: Quat): Quat => [-q[0], -q[1], -q[2], q[3]];
export function qRot(q: Quat, v: V): V {
  const u: V = [q[0], q[1], q[2]];
  const t = cross(u, v).map((x) => 2 * x) as V;
  const c = cross(u, t);
  return [v[0] + q[3] * t[0] + c[0], v[1] + q[3] * t[1] + c[1], v[2] + q[3] * t[2] + c[2]];
}
export function qSlerp(a: Quat, b: Quat, t: number): Quat {
  let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
  let bb = b;
  if (d < 0) {
    d = -d;
    bb = [-b[0], -b[1], -b[2], -b[3]];
  }
  if (d > 0.9995) {
    const r: Quat = [a[0] + (bb[0] - a[0]) * t, a[1] + (bb[1] - a[1]) * t, a[2] + (bb[2] - a[2]) * t, a[3] + (bb[3] - a[3]) * t];
    const l = Math.hypot(...r);
    return r.map((x) => x / l) as Quat;
  }
  const th = Math.acos(d);
  const s = Math.sin(th);
  const wa = Math.sin((1 - t) * th) / s;
  const wb = Math.sin(t * th) / s;
  return [a[0] * wa + bb[0] * wb, a[1] * wa + bb[1] * wb, a[2] * wa + bb[2] * wb, a[3] * wa + bb[3] * wb];
}
/** Rotation taking unit vector a to unit vector b along the great circle. */
function qFromTo(a: V, b: V): Quat {
  const c = cross(a, b);
  const d = Math.max(-1, Math.min(1, dot(a, b)));
  if (Math.hypot(...c) < 1e-9) return d > 0 ? qId() : qAxis(Math.abs(a[0]) < 0.9 ? cross(a, [1, 0, 0]) : cross(a, [0, 1, 0]), Math.PI);
  return qAxis(c, Math.acos(d));
}
/** Anchor fit: move A→A2, then spin about A2 so that B heads toward B2. */
export function fit(A: [number, number], A2: [number, number], B: [number, number], B2: [number, number]): Quat {
  const a = ll(...A), a2 = ll(...A2), b = ll(...B), b2 = ll(...B2);
  const q1 = qFromTo(a, a2);
  const b1 = qRot(q1, b);
  // spin about a2: align the tangent directions of b1 and b2
  const proj = (v: V): V => {
    const k = dot(v, a2);
    return norm([v[0] - a2[0] * k, v[1] - a2[1] * k, v[2] - a2[2] * k]);
  };
  const t1 = proj(b1), t2 = proj(b2);
  let ang = Math.acos(Math.max(-1, Math.min(1, dot(t1, t2))));
  if (dot(cross(t1, t2), a2) < 0) ang = -ang;
  return qMul(qAxis(a2, ang), q1);
}
/** Euler rotation about a pole (lat, lon) by deg. */
export const euler = (lat: number, lon: number, deg: number): Quat => qAxis(ll(lat, lon), deg * D);

// ---------------------------------------------------------------------------
// Closed (Pangaea, ~200 Ma) fits in the Africa-fixed frame.
// ---------------------------------------------------------------------------
const P = PLATE_NAMES;
const idx = (n: (typeof P)[number]): number => P.indexOf(n);

const FIT_PANGAEA: Record<string, Quat> = {
  samerica: fit([-5.5, -35.2], [1.5, 4.0], [-34.5, -54], [-31.5, 9.5]),
  namerica: fit([35.2, -75.5], [28.5, -12.5], [25.2, -80.4], [14, -18.5]),
  eurasia: fit([36, -5.6], [40.5, -7.5], [55.7, 37.6], [62, 22]),
  greenland: fit([59.8, -43.9], [53, -27], [81.5, -32], [74, -8]),
  arabia: euler(32.6, 23.7, -6.7),
  madagascar: fit([-12, 49.3], [-1.5, 42.2], [-25.5, 45.2], [-14.5, 38.5]),
  india: fit([19, 72.8], [-11, 50], [8.1, 77.5], [-24, 41]),
  antarctica: fit([-69.5, 15], [-41, 33], [-63.2, -57.2], [-49, -16]),
  australia: fit([-32.5, 133.5], [-48, 55], [-11, 142.5], [-31, 76]),
  zealandia: fit([-46.5, 168.5], [-60, 50], [-34.5, 173], [-48, 48]),
  pacific: qId(),
  africa: qId(),
};

/** Fraction of each plate's fit still closed, by age (Ma): [Ma, f] pairs. */
const CLOSED: Record<string, [number, number][]> = {
  samerica: [[0, 0], [35, 0.27], [66, 0.48], [100, 0.78], [125, 0.97], [132, 1]],
  namerica: [[0, 0], [35, 0.22], [66, 0.4], [100, 0.6], [150, 0.86], [180, 0.98], [195, 1]],
  eurasia: [[0, 0], [35, 0.28], [66, 0.5], [100, 0.68], [150, 0.86], [180, 0.97], [195, 1]],
  greenland: [[0, 0], [35, 0.25], [66, 0.5], [100, 0.65], [150, 0.86], [180, 0.97], [195, 1]],
  arabia: [[0, 0], [25, 0.8], [30, 1]],
  madagascar: [[0, 0], [120, 0], [165, 1]],
  india: [[0, 0], [20, 0.12], [50, 0.28], [66, 0.52], [90, 0.8], [120, 0.95], [135, 1]],
  antarctica: [[0, 0], [66, 0.65], [100, 0.86], [150, 0.97], [170, 1]],
  australia: [[0, 0], [35, 0.32], [50, 0.6], [85, 0.9], [100, 1]],
  zealandia: [[0, 0], [60, 0.55], [85, 0.95], [95, 1]],
  pacific: [[0, 0]],
  africa: [[0, 0]],
};

/** Pre-Pangaea: Laurussia (N America, Greenland, Eurasia) drifts off Gondwana. */
const LAURUSSIA = new Set(['namerica', 'greenland', 'eurasia']);

function interp(tab: [number, number][], Ma: number): number {
  if (Ma <= tab[0]![0]) return tab[0]![1];
  for (let i = 0; i < tab.length - 1; i++) {
    const [a, fa] = tab[i]!;
    const [b, fb] = tab[i + 1]!;
    if (Ma <= b) {
      const u = (Ma - a) / (b - a);
      const s = u * u * (3 - 2 * u);
      return fa + (fb - fa) * s;
    }
  }
  return tab[tab.length - 1]![1];
}

/** Absolute motion of the whole assembly (Africa frame → globe), keyframed. */
const ABS: [number, Quat][] = [
  [0, qId()],
  [66, euler(0, -60, -7)],
  [150, euler(10, -45, -18)],
  [250, euler(20, -60, -38)],
  [330, euler(25, -70, -50)],
  [450, euler(30, -40, -95)],
  [540, euler(25, -20, -120)],
  [750, euler(-10, 30, -150)],
  [1100, euler(-30, 60, -200)],
  [1800, euler(10, 120, -260)],
  [2700, euler(40, 170, -320)],
  [4000, euler(20, 220, -400)],
];
/** Pre-Pangaea Laurussia offset relative to Gondwana (opens the Rheic/Iapetus oceans). */
const LAUR: [number, Quat][] = [
  [0, qId()],
  [300, qId()],
  [335, euler(10, 30, 8)],
  [420, euler(5, 20, 32)],
  [540, euler(0, 10, 58)],
  [750, euler(-20, 0, 40)],
  [1100, euler(-40, -20, 14)],
  [1800, euler(-10, 40, 60)],
  [2700, euler(30, 80, 95)],
  [4000, euler(10, 120, 130)],
];
/** Pre-Pangaea internal shuffles of Gondwana's eastern blocks (Rodinia-style clusters). */
const EAST: [number, Quat][] = [
  [0, qId()],
  [540, qId()],
  [750, euler(-20, 80, 30)],
  [1100, euler(-10, 100, 70)],
  [1800, euler(20, 60, 110)],
  [2700, euler(-30, 40, 150)],
  [4000, euler(0, 0, 190)],
];
const EASTERN = new Set(['india', 'australia', 'antarctica', 'zealandia', 'madagascar']);

function interpQ(tab: [number, Quat][], Ma: number): Quat {
  if (Ma <= tab[0]![0]) return tab[0]![1];
  for (let i = 0; i < tab.length - 1; i++) {
    const [a, qa] = tab[i]!;
    const [b, qb] = tab[i + 1]!;
    if (Ma <= b) {
      const u = (Ma - a) / (b - a);
      return qSlerp(qa, qb, u * u * (3 - 2 * u));
    }
  }
  return tab[tab.length - 1]![1];
}

/** Rotations (present → paleo) for every plate at an age in Ma. */
export function plateRotations(Ma: number): Quat[] {
  const abs = interpQ(ABS, Ma);
  const laur = interpQ(LAUR, Ma);
  const east = interpQ(EAST, Ma);
  return P.map((name) => {
    const f = interp(CLOSED[name]!, Ma);
    let q = qSlerp(qId(), FIT_PANGAEA[name]!, f);
    if (LAURUSSIA.has(name)) q = qMul(laur, q);
    if (EASTERN.has(name)) q = qMul(east, q);
    if (name === 'pacific') q = qSlerp(qId(), euler(0, 90, 30), Math.min(1, Ma / 300));
    return qMul(abs, q);
  });
}

/** Inverse rotations (paleo → present), packed for a shader uniform (vec4 per plate). */
export function plateInverseArray(Ma: number): Float32Array {
  const out = new Float32Array(NPLATES * 4);
  plateRotations(Ma).forEach((q, i) => out.set(qInv(q), i * 4));
  return out;
}

export { idx as plateIndex };
