import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import type { Rig, ShotDef } from '../director/types';
import { orbit, push } from '../director/rigs';
import { easeInOutSine } from '../core/math';
import { ventPath } from '../render/stages/VentStage';
import { zoomRig, LOCAL_GROUP_VIEW } from './c08_expansion';

/** The Return replays the Prologue's opening exactly (the vent is a pure function of prologue time). */
const along = (offset: number, dur: number): Rig => (u) => ventPath(offset + Math.min(u, 1.2) * dur);

/** Coda story seconds (c) — see docs/DESIGN.md, "The Coda script". */
export const CODA = { saturate: 0, candles: 3.5, dark: 8.5, point: 15.5, montage: 17.2, black: 22, ret: 27, ring: 34, end: 37 } as const;

export function codaShots(merged: boolean, vacuum = false): ShotDef[] {
  const shots: ShotDef[] = [
    {
      id: 'cd-saturate', stage: 'galaxy', dur: CODA.candles - CODA.saturate, label: 'Victory is not celebrated',
      transition: { type: 'dissolve', dur: 1.2 },
      rig: merged
        ? orbit({ center: [0, 0, 0], radius: 78, radiusTo: 72, elev: 0.62, elevTo: 0.6, az: 0.5, azTo: 0.56, fov: 36, ease: easeInOutSine })
        : orbit({ center: [0, 0, 0], radius: 70, radiusTo: 64, elev: 0.75, elevTo: 0.72, az: 0.4, azTo: 0.45, fov: 36, ease: easeInOutSine }),
      params: { coda: 'saturate', c0: CODA.saturate, territory: 0.4, su: 0.9 },
    },
    {
      id: 'cd-candles', stage: 'galaxy', dur: CODA.dark - CODA.candles, label: 'The horizon closes', signature: true,
      transition: { type: 'dissolve', dur: 1.0 },
      rig: zoomRig({ t0: [0, 0, 0], t1: LOCAL_GROUP_VIEW.mid, d0: merged ? 130 : 80, d1: 6500, dir0: [0.45, 0.6, 0.66], dir1: LOCAL_GROUP_VIEW.side, fov: 36, fovTo: 44 }),
      params: { coda: 'candles', c0: CODA.candles, territory: 0.0, su: 0.7 },
    },
    {
      id: 'cd-holes', stage: 'coda', dur: CODA.point - CODA.dark, label: 'The last black holes', signature: true,
      transition: { type: 'dissolve', dur: 1.6 },
      rig: orbit({ center: [0.15, 0.05, 0.2], radius: 7.5, radiusTo: 4.6, elev: 0.32, elevTo: 0.22, az: 0.2, azTo: 0.75, fov: 38, ease: easeInOutSine }),
      params: { c0: CODA.dark, su: 0.55 },
    },
    {
      id: 'cd-point', stage: 'coda', dur: CODA.montage - CODA.point, label: 'One point remains', signature: true,
      transition: { type: 'cut', dur: 0 },
      rig: push({ from: [3.1, 1.15, 3.2], to: [0.32, 0.1, 0.42], target: [0.15, 0.05, 0.2], fov: 38, fovTo: 30, ease: easeInOutSine }),
      params: { c0: CODA.point, su: 0.3 },
    },
    {
      id: 'cd-montage', stage: 'coda', dur: CODA.black - CODA.montage, label: 'Inside it', signature: true,
      transition: { type: 'cut', dur: 0 },
      rig: push({ from: [0.32, 0.1, 0.42], to: [0.22, 0.07, 0.29], target: [0.15, 0.05, 0.2], fov: 30, fovTo: 26, ease: easeInOutSine }),
      params: { c0: CODA.montage, su: 0.5 },
    },
    {
      id: 'cd-black', stage: 'coda', dur: CODA.ret - CODA.black, label: 'Black',
      transition: { type: 'cut', dur: 0 },
      rig: push({ from: [0.22, 0.07, 0.29], to: [0.22, 0.07, 0.29], target: [0.15, 0.05, 0.2], fov: 26 }),
      params: { c0: CODA.black, black: true },
    },
    {
      id: 'cd-return', stage: 'vent', dur: CODA.end - CODA.ret, label: 'Return', signature: true,
      transition: { type: 'cut', dur: 0 },
      rig: along(0, CODA.end - CODA.ret),
      params: { offset: 0, su: 0.95 },
    },
  ];
  if (vacuum) for (const sh of shots) if (sh.params && sh.stage !== 'vent') sh.params.vacuum = true;
  return shots;
}

export const coda: ChapterDef = {
  meta: CHAPTERS[10]!,
  shots: codaShots(false),
};
