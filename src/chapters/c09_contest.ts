import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { ShotDef } from '../director/types';
import { orbit } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { Rng } from '../core/rng';
import type { GalaxyHost } from '../galaxy/GalaxyHost';
import type { GEvent } from '../galaxy/GalaxySim';
import { galaxyCenter, nodePos, MERGED_T } from '../galaxy/universe';
import { zoomRig, shoulderRig, LOCAL_GROUP_VIEW } from './c08_expansion';
import type { Keyframe } from '../time/odyssey';

/** Placeholder shots used until this run's history has been computed. */
const waiting: ShotDef[] = [
  {
    id: 'co-wait', stage: 'galaxy', dur: 45, label: 'The Local Group',
    transition: { type: 'dissolve', dur: 1.2 },
    rig: zoomRig({ t0: LOCAL_GROUP_VIEW.mid, t1: [0, 0, 0], d0: 1000, d1: 60, dir0: LOCAL_GROUP_VIEW.side, dir1: [-0.3, 0.8, 0.5], fov: 40, fovTo: 34 }),
  },
];

export const contest: ChapterDef = {
  meta: CHAPTERS[9]!,
  shots: waiting,
};

interface Beat {
  t0: number;
  t1: number;
  w: number;
  ev: GEvent;
}

const KEY_TYPES = new Set(['emerge', 'intrude', 'reveal', 'extinct', 'merge', 'betrayal', 'totalWar', 'supernova', 'vacuum', 'andromeda', 'war', 'laser', 'rkv', 'treaty', 'silent', 'dark', 'merged', 'clouds', 'rkvMiss']);

/**
 * The Director's cut of an emergent history: pick the beats (awakenings,
 * betrayals, extinctions, the collision, the bubble), give each its screen
 * time, and build the time map and the shots that frame them.
 */
export function buildContest(host: GalaxyHost): { shots: ShotDef[]; keys: Keyframe[]; duration: number } {
  const res = host.result!;
  const end = res.endT;
  const rng = new Rng(res.seed, 99);
  const evs = host.events.filter((e) => e.text && KEY_TYPES.has(e.type) && e.t >= 1e9 && e.t <= end && e.weight >= 0.6);
  // group into beats
  const beats: Beat[] = [];
  for (const e of evs) {
    const last = beats[beats.length - 1];
    const win = Math.max(1.5e7, e.t * 0.003);
    if (last && e.t - last.t1 < win) {
      last.t1 = e.t;
      if (e.weight > last.w) {
        last.w = e.weight;
        last.ev = e;
      }
    } else beats.push({ t0: e.t, t1: e.t, w: e.weight, ev: e });
  }
  // keep the strongest (always the first awakening, the bubble, and the last beat)
  const K = Math.min(9, beats.length);
  const ranked = beats.map((b, i) => ({ b, i, s: b.w + (i === 0 ? 1 : 0) + (b.ev.type === 'vacuum' ? 2 : 0) + (i === beats.length - 1 ? 0.6 : 0) }));
  ranked.sort((a, b) => b.s - a.s || a.i - b.i);
  const chosen = ranked.slice(0, K).sort((a, b) => a.i - b.i).map((r) => r.b);
  const duration = Math.max(45, Math.min(52, 38 + chosen.length * 1.5));

  const keys: Keyframe[] = [[0, 1e9]];
  const shots: ShotDef[] = [];
  const open = 3.2, close = 5.0;
  const avail = duration - open - close;
  const totW = chosen.reduce((a, b) => a + 0.6 + b.w, 0) || 1;
  let s = open;
  let lastT = 1e9;
  const P: [number, number, number] = [0, 0, 0];
  const beatStory: { s: number; d: number; b: Beat }[] = [];
  for (const b of chosen) {
    const share = (avail * (0.6 + b.w)) / totW;
    const transit = Math.min(1.4, share * 0.3);
    const dwell = share - transit;
    const lead = Math.max(3e5, Math.min(1.5e7, (b.t1 - b.t0) * 0.3 + b.t0 * 0.0006));
    const tA = Math.max(lastT * 1.0000001 + 1, b.t0 - lead);
    const tB = Math.max(tA + 1e5, b.t1 + lead * 0.8);
    keys.push([s + transit, tA], [s + transit + dwell, tB]);
    beatStory.push({ s, d: share, b });
    lastT = tB;
    s += share;
  }
  keys.push([duration, Math.max(end, lastT * 1.0001)]);

  // opening: where the first beat happens
  const first = chosen[0];
  const firstGal = first && first.ev.node >= 0 ? host.u.gal[first.ev.node]! : 0;
  shots.push({
    id: 'co-open', stage: 'galaxy', dur: open, label: 'It was not alone',
    transition: { type: 'fade', dur: 1.0 },
    rig: firstGal === 0 || firstGal === 1 || firstGal === 2
      ? orbit({ center: [0, 0, 0], radius: 52, radiusTo: 46, elev: 1.0, elevTo: 0.95, az: 0.2, azTo: 0.32, fov: 34, ease: easeInOutSine })
      : shoulderRig({ T: first ? first.t0 : 1.2e9, back: 70, backTo: 62, up: 46, upTo: 40, side: 28, sideTo: 22, look: 0.07, fov: 48, fovTo: 44 }),
    params: { su: 0.6, territory: 2.2 },
  });
  const styles = ['regional', 'galactic', 'grazing', 'regional', 'galactic'];
  beatStory.forEach(({ d, b }, i) => {
    const e = b.ev;
    let center: [number, number, number];
    let style = styles[(i + rng.int(0, 4)) % styles.length]!;
    if (e.type === 'andromeda' || e.type === 'merged') {
      const c = galaxyCenter(3, b.t0);
      center = [c[0] * 0.5, c[1] * 0.5, c[2] * 0.5];
      style = 'collision';
    } else if (e.node >= 0) {
      const p = nodePos(host.u, e.node, b.t0, P);
      center = [p[0], p[1], p[2]];
    } else center = [0, 0, 0];
    const g = e.node >= 0 ? host.u.gal[e.node]! : 0;
    const gc = galaxyCenter(g, b.t0);
    const az = rng.range(0, Math.PI * 2);
    let rig;
    if (style === 'collision') {
      rig = orbit({ center, radius: 92, radiusTo: 74, elev: 0.5, elevTo: 0.42, az, azTo: az + 0.25, fov: 38, ease: easeInOutSine });
    } else if (style === 'galactic') {
      const R = g === 0 || (b.t0 > MERGED_T && g === 3) ? 46 : g === 3 ? 58 : 28;
      // the whole galaxy, but composed around the beat: the event sits a third of the way in, the core off-centre
      const tc: [number, number, number] = [gc[0] + (center[0] - gc[0]) * 0.65, gc[1] + (center[1] - gc[1]) * 0.65, gc[2] + (center[2] - gc[2]) * 0.65];
      rig = orbit({ center: tc, radius: R * 1.0, radiusTo: R * 0.9, elev: 1.0, elevTo: 0.9, az, azTo: az + 0.2, fov: 34, ease: easeInOutSine });
    } else if (style === 'grazing') {
      rig = orbit({ center, radius: 36, radiusTo: 30, elev: 0.2, elevTo: 0.26, az, azTo: az + 0.3, fov: 34, ease: easeInOutSine });
    } else {
      rig = orbit({ center, radius: 34, radiusTo: 28, elev: 0.85, elevTo: 0.72, az, azTo: az + 0.35, fov: 36, ease: easeInOutSine });
    }
    // the beat's protagonist: its colour is the brightest thing on screen while the beat lasts
    const hero = e.type === 'extinct' ? e.b : e.a >= 0 ? e.a : e.b;
    shots.push({
      id: `co-beat${i}-${e.type}`, stage: 'galaxy', dur: d, label: e.text, signature: b.w >= 0.85,
      transition: { type: 'dissolve', dur: Math.min(1.2, d * 0.3) }, rig,
      params: { su: 0.55, territory: 2.6, hero, heroNode: e.node, beatT: e.t, beatText: e.text, beatType: e.type, beatA: e.a, beatB: e.b },
    });
  });
  // the end: the holder of what is left
  const lastBeat = chosen[chosen.length - 1];
  const merged = end > MERGED_T;
  shots.push({
    id: 'co-close', stage: 'galaxy', dur: close, label: 'What was left',
    transition: { type: 'dissolve', dur: 1.4 },
    rig: merged
      ? orbit({ center: [0, 0, 0], radius: 95, radiusTo: 80, elev: 0.75, elevTo: 0.7, az: 0.4, azTo: 0.6, fov: 36, ease: easeInOutSine })
      : shoulderRig({ T: end, back: 36, backTo: 70, up: 30, upTo: 46, side: 10, sideTo: 26, look: 0.06, fov: 40, fovTo: 48 }),
    params: { su: 0.7, territory: 2.2 },
  });
  void lastBeat;
  return { shots, keys, duration };
}
