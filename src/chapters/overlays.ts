import { PlanetStage } from '../render/stages/PlanetStage';
import { BAND_STRIDE } from '../sim/agents/bands';
import { ANCIENT_CITIES, cityWeight } from '../data/history';
import { TOWN_STRIDE } from '../sim/agents/polities';
import { ThreadsLayer } from '../render/layers/Threads';
import { PRESENT_YEAR } from '../time/format';
import { MODERN_CITIES, FIBER_LINKS, SEA_LANES } from '../data/modern';
import { CITY_STRIDE, canonicalLight } from '../sim/agents/cities';
import type { Route } from '../data/history';
import { DATACENTERS, LAST_LIGHT, LAST_LIGHT_T } from '../data/singularity';
import { SPARK_STRIDE } from '../sim/agents/lattice';

/** Chapter 4: bands as firelight on the night side; the dispersal field as a faint glow at speed. */
PlanetStage.overlays[4] = (stage, f) => {
  stage.u.speckle.value = 1;
  if (threads) threads.mesh.visible = false;
  if (lanes) lanes.mesh.visible = false;
  if (mesh) mesh.mesh.visible = false;
  const ag = f.agents;
  if (!ag || ag.sim !== 'bands') {
    stage.clearOverlays();
    return;
  }
  const field = ag.snap.fields.people;
  const fieldGain = 1 - f.lodMix * 0.75;
  if (field) {
    const d = field.data;
    stage.setEmissive(ag.version, field.w, field.h, (x, y) => {
      const i = (y * field.w + x) * 4;
      const s = d[i]!, n = d[i + 1]!, e = d[i + 2]!;
      return [(s * 1.6 + n * 1.2 + e * 0.9) * fieldGain, (s * 0.7 + n * 0.62 + e * 0.38) * fieldGain, (s * 0.18 + n * 0.25 + e * 0.12) * fieldGain];
    }, 2);
  }
  const snap = ag.snap;
  const a = ag.alpha;
  stage.setGlobeAgents(f.lodMix > 0.02 ? snap.count : 0, (i, o) => {
    const k = i * BAND_STRIDE;
    const src = snap.agents;
    let dlon = src[k + 1]! - src[k + 3]!;
    if (dlon > 180) dlon -= 360;
    if (dlon < -180) dlon += 360;
    o.lat = src[k + 2]! + (src[k]! - src[k + 2]!) * a;
    o.lon = src[k + 3]! + dlon * a;
    const lineage = src[k + 5]!;
    const vis = src[k + 7]! * f.lodMix;
    o.size = 0.004 + 0.004 * Math.min(1.5, src[k + 4]!);
    const c = lineage === 2 ? [1.0, 0.55, 0.2] : lineage === 1 ? [0.85, 0.7, 0.45] : [0.9, 0.45, 0.25];
    o.r = c[0]! * vis * 1.8;
    o.g = c[1]! * vis * 1.8;
    o.b = c[2]! * vis * 1.8;
    o.seed = (i * 0.618) % 1;
  });
};

// ---------------------------------------------------------------- Chapter 5

let threads: ThreadsLayer | null = null;
function ensureThreads(stage: PlanetStage): ThreadsLayer {
  if (!threads) {
    // ancient trade: broad, soft gold silk
    threads = new ThreadsLayer(undefined, [1.0, 0.7, 0.32], 1.004, 0.18, 0.0042);
    stage.overlay.add(threads.mesh);
  }
  return threads;
}

PlanetStage.overlays[5] = (stage, f) => {
  const year = PRESENT_YEAR + f.T;
  stage.u.speckle.value = 0;
  const th = ensureThreads(stage);
  th.mesh.visible = true;
  if (lanes) lanes.mesh.visible = false;
  if (mesh) mesh.mesh.visible = false;
  th.u.year.value = year;
  th.u.time.value = f.time;
  th.u.vis.value = 1;
  (th.u.sun.value as import('three/webgpu').Vector3).copy(stage.u.sun.value as import('three/webgpu').Vector3);
  // the Black Death moves out from Kaffa (1346) along the threads
  // ~9°/yr: Kaffa 1346, Sicily 1347, Paris 1348, England 1349, Scandinavia 1350
  th.u.plague.value = year > 1346 && year < 1358 ? (year - 1346.3) * 9 : -1;
  const ag = f.agents;
  if (ag && ag.sim === 'polities') {
    const fld = ag.snap.fields.polity;
    if (fld) {
      const d = fld.data;
      stage.setEmissive(ag.version, fld.w, fld.h, (x0, y0) => {
        const blur = (ch: number): number => {
          let acc = 0;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const yy = Math.max(0, Math.min(fld.h - 1, y0 + dy)), xx = (x0 + dx + fld.w) % fld.w;
              acc += d[(yy * fld.w + xx) * 4 + ch]!;
            }
          return acc / 9;
        };
        const x = x0, y = y0;
        const i = (y * fld.w + x) * 4;
        void blur;
        const b = d[i + 3]! * (0.25 + f.lodMix * 0.4);
        return [blur(0) * 0.055 + b * d[i]! * 0.14, blur(1) * 0.055 + b * d[i + 1]! * 0.14, blur(2) * 0.055 + b * d[i + 2]! * 0.14];
      });
    }
  }
  // cities: canonical lights, plus the agents' towns when time is slow
  const civ = f.world.civLight;
  const towns = ag && ag.sim === 'polities' && f.lodMix > 0.02 ? ag.snap : null;
  const cities = ANCIENT_CITIES.filter((c) => cityWeight(c, year) > 0);
  const nTowns = towns ? towns.count : 0;
  const plagueFront = th.u.plague.value as number;
  stage.setGlobeAgents(cities.length + nTowns, (i, o) => {
    if (i < cities.length) {
      const c = cities[i]!;
      const w = cityWeight(c, year);
      o.lat = c.lat;
      o.lon = c.lon;
      // the first cities are few, so each must read: brighter and a little larger early on
      o.size = 0.005 + 0.008 * Math.sqrt(w);
      let k = (3.6 + 6.0 * civ) * w;
      if (plagueFront > 0) {
        const D = Math.PI / 180;
        const dd = Math.acos(Math.sin(c.lat * D) * Math.sin(45.03 * D) + Math.cos(c.lat * D) * Math.cos(45.03 * D) * Math.cos((c.lon - 35.38) * D)) / D;
        if (dd < plagueFront && dd > plagueFront - 60) k *= 0.25;
      }
      o.r = 1.0 * k;
      o.g = 0.62 * k;
      o.b = 0.3 * k;
      o.seed = (i * 0.37) % 1;
    } else {
      const s = towns!.agents;
      const k0 = (i - cities.length) * TOWN_STRIDE;
      o.lat = s[k0]!;
      o.lon = s[k0 + 1]!;
      o.size = 0.0025 + 0.004 * Math.sqrt(s[k0 + 2]!);
      const k = s[k0 + 3]! * s[k0 + 4]! * f.lodMix * (2.0 + 6 * civ) * s[k0 + 2]!;
      o.r = 1.0 * k;
      o.g = 0.6 * k;
      o.b = 0.28 * k;
      o.seed = s[k0 + 5]! % 1;
    }
  });
};

// ---------------------------------------------------------------- Chapter 6

let lanes: ThreadsLayer | null = null;
let mesh: ThreadsLayer | null = null;
/** per-city footprint on the 2° emissive grid */
let footprints: { i: number; w: number }[][] | null = null;
const EW = 180, EH = 90;
const lightAcc = new Float32Array(EW * EH);
function ensureModern(stage: PlanetStage): void {
  if (!lanes) {
    lanes = new ThreadsLayer(SEA_LANES.map((l, k) => ({ name: 'lane' + k, ...l })) as Route[], [0.78, 0.84, 0.95], 1.003, 0.3, 0.0018);
    stage.overlay.add(lanes.mesh);
    const byName = new Map(MODERN_CITIES.map((c) => [c[0], c] as const));
    const links: Route[] = [];
    for (const [a, b] of FIBER_LINKS) {
      const A = byName.get(a), B = byName.get(b);
      if (A && B) links.push({ name: a + '-' + b, from: 1988, to: 3000, weight: 0.8, pts: [[A[1], A[2]], [B[1], B[2]]] });
    }
    // the fibre mesh: hair-thin cyan with fast pulses
    mesh = new ThreadsLayer(links, [0.35, 0.92, 1.0], 1.009, 1.6, 0.0013);
    stage.overlay.add(mesh.mesh);
  }
  if (!footprints) {
    footprints = MODERN_CITIES.map((c) => {
      const out: { i: number; w: number }[] = [];
      const rad = 1.5 + c[4] * 3;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++) {
          const lat = c[1] + dy * 2, lon = c[2] + dx * 2 / Math.max(0.3, Math.cos((c[1] * Math.PI) / 180));
          const y = Math.floor((89 - lat) / 2 + 0.5), x = ((Math.floor((lon + 179) / 2 + 0.5) % EW) + EW) % EW;
          if (y < 0 || y >= EH) continue;
          const d = Math.hypot(dy * 2, dx * 2);
          out.push({ i: y * EW + x, w: Math.exp(-((d / rad) ** 2)) });
        }
      return out;
    });
  }
}

PlanetStage.overlays[6] = (stage, f) => {
  ensureModern(stage);
  const year = PRESENT_YEAR + f.T;
  stage.u.speckle.value = 1;
  if (threads) threads.mesh.visible = false;
  for (const L of [lanes!, mesh!]) {
    L.mesh.visible = true;
    L.u.year.value = year;
    L.u.time.value = f.time;
    (L.u.sun.value as import('three/webgpu').Vector3).copy(stage.u.sun.value as import('three/webgpu').Vector3);
    L.u.plague.value = -1;
  }
  lanes!.u.vis.value = 1 - f.world.fiber * 0.6;
  mesh!.u.vis.value = f.world.fiber * 1.6;
  const ag = f.agents;
  const snap = ag && ag.sim === 'cities' ? ag.snap : null;
  // city lights → emissive grid (speckled into points by the planet shader)
  lightAcc.fill(0);
  MODERN_CITIES.forEach((c, i) => {
    const L = snap ? snap.agents[i * CITY_STRIDE + 2]! : canonicalLight(year, c[3], c[4]);
    for (const fp of footprints![i]!) lightAcc[fp.i]! += L * fp.w;
  });
  const elec = f.world.electric;
  stage.setEmissive((ag?.version ?? 0) * 1000 + Math.floor(year * 4), EW, EH, (x, y) => {
    const v = Math.min(2.5, lightAcc[y * EW + x]!) * 1.4;
    // sodium orange early, whiter with LEDs late
    return [v * 1.0, v * (0.52 + 0.14 * elec), v * (0.2 + 0.16 * elec)];
  });
  // agents: vehicles; and the two signal moments (Trinity, Apollo 11)
  const nV = snap ? Math.max(0, snap.count - MODERN_CITIES.length) : 0;
  const trinity = Math.max(0, 1 - Math.abs(year - 1945.54) * 12) * (f.reducedFlash ? 0.2 : 1);
  stage.setGlobeAgents(nV + 1, (i, o) => {
    if (i === nV) {
      o.lat = 33.68;
      o.lon = -106.48;
      o.size = 0.004 + trinity * 0.05;
      o.r = o.g = o.b = trinity * 12;
      o.seed = 0;
      return;
    }
    const k = (MODERN_CITIES.length + i) * CITY_STRIDE;
    const s = snap!.agents;
    o.lat = s[k]!;
    o.lon = s[k + 1]!;
    const plane = s[k + 3]! > 1.5;
    o.size = plane ? 0.0018 : 0.0024;
    const v = s[k + 2]! * f.lodMix * (plane ? 1.4 : 0.9);
    o.r = (plane ? 1.0 : 0.75) * v;
    o.g = (plane ? 0.95 : 0.82) * v;
    o.b = (plane ? 0.9 : 0.95) * v;
    o.seed = s[k + 4]!;
  });
  if (trinity > 0.5) f.cue('nuke');
  // Apollo 11: a single bright mote leaves the atmosphere from Florida
  // spread over the Odyssey's slow beat around 1969 so the mote is actually seen
  const m = (year - 1969.1) / 0.6;
  if (m > 0 && m < 1) {
    f.cue('mote');
    const D = Math.PI / 180;
    const base = [Math.cos(28.6 * D) * Math.sin(-80.6 * D), Math.sin(28.6 * D), Math.cos(28.6 * D) * Math.cos(-80.6 * D)];
    const up = 1.02 + m * 1.4;
    stage.bolideU.pos.value.set(base[0]! * up + m * 0.25, base[1]! * up + m * 0.1, base[2]! * up);
    stage.bolideU.vel.value.set(base[0]! + 0.3, base[1]! + 0.1, base[2]!);
    stage.bolideU.on.value = Math.sin(Math.PI * Math.min(1, m * 1.1)) * 0.9;
  }
};

// ---------------------------------------------------------------- Chapter 7

PlanetStage.overlays[7] = (stage, f) => {
  ensureModern(stage);
  stage.u.speckle.value = 1;
  if (threads) threads.mesh.visible = false;
  lanes!.mesh.visible = false;
  mesh!.mesh.visible = true;
  mesh!.u.year.value = 2026 + f.T;
  mesh!.u.time.value = f.time;
  // the fibre mesh dies with the people it connected
  mesh!.u.vis.value = Math.max(0, f.world.humanLights) * 1.4;
  (mesh!.u.sun.value as import('three/webgpu').Vector3).copy(stage.u.sun.value as import('three/webgpu').Vector3);
  // canonical city lights of 2026 (the lattice shader extinguishes them as it passes)
  lightAcc.fill(0);
  MODERN_CITIES.forEach((c, i) => {
    const L = canonicalLight(2026, c[3], c[4]);
    for (const fp of footprints![i]!) lightAcc[fp.i]! += L * fp.w;
  });
  stage.setEmissive(77, EW, EH, (x, y) => {
    const v = Math.min(2.5, lightAcc[y * EW + x]!) * 1.4;
    return [v, v * 0.62, v * 0.27];
  });
  const ag = f.agents;
  const snap = ag && ag.sim === 'lattice' ? ag.snap : null;
  const nS = snap && f.lodMix > 0.02 ? snap.count - 1 : 0;
  const dc = f.world.datacenters;
  const lastOn = f.T < LAST_LIGHT_T ? 1 : Math.max(0, 1 - (f.T - LAST_LIGHT_T) * 60);
  stage.setGlobeAgents(DATACENTERS.length + nS + 2, (i, o) => {
    if (i === DATACENTERS.length + nS + 1) {
      // the last light's halo: warm, soft, unmistakable against the crystal
      const flick = 0.85 + 0.15 * Math.sin(f.time * 7) * Math.sin(f.time * 2.3);
      o.lat = LAST_LIGHT[0];
      o.lon = LAST_LIGHT[1];
      o.size = 0.022;
      const v = 0.32 * lastOn * flick;
      o.r = v;
      o.g = 0.55 * v;
      o.b = 0.22 * v;
      o.seed = 0.31;
      return;
    }
    if (i < DATACENTERS.length) {
      const [la, lo] = DATACENTERS[i]!;
      o.lat = la;
      o.lon = lo;
      o.size = 0.006 + 0.01 * Math.min(1, dc);
      const v = dc * 3.5;
      o.r = 0.75 * v;
      o.g = 0.88 * v;
      o.b = 1.0 * v;
      o.seed = i * 0.13;
      return;
    }
    if (i === DATACENTERS.length + nS) {
      // the last human light: small, warm, flickering — and then not
      const flick = 0.75 + 0.25 * Math.sin(f.time * 11) * Math.sin(f.time * 3.7);
      o.lat = LAST_LIGHT[0];
      o.lon = LAST_LIGHT[1];
      o.size = 0.005;
      const v = 4.5 * lastOn * flick * Math.max(0.3, 1 - f.world.humanLights * 0.9);
      o.r = v;
      o.g = 0.6 * v;
      o.b = 0.28 * v;
      o.seed = 0.77;
      return;
    }
    const k = (i - DATACENTERS.length) * SPARK_STRIDE;
    const s = snap!.agents;
    o.lat = s[k]!;
    o.lon = s[k + 1]!;
    const alive = s[k + 2]!;
    const flare = s[k + 3]!;
    o.size = 0.002 + flare * 0.003 * alive;
    const v = (alive * (0.6 + flare * 2.4) + (1 - s[k + 5]!) * (1 - alive) * 1.5) * f.lodMix;
    o.r = v;
    o.g = 0.62 * v;
    o.b = 0.3 * v;
    o.seed = s[k + 4]!;
  });
  if (f.T >= LAST_LIGHT_T && f.T < LAST_LIGHT_T + 0.3) f.cue('lastlight');
};
