import { CHAPTERS } from './meta';
import type { ChapterDef } from './types';
import { ventPath } from '../render/stages/VentStage';
import type { Rig } from '../director/types';

/** The Prologue is one continuous push-in, cut into three beats. */
const along = (offset: number, dur: number): Rig => (u) => ventPath(offset + Math.min(u, 1.2) * dur);

export const prologue: ChapterDef = {
  meta: CHAPTERS[0]!,
  shots: [
    { id: 'p-ember', stage: 'vent', dur: 3.2, rig: along(0, 3.2), params: { offset: 0 }, signature: true, label: 'Black to ember' },
    { id: 'p-chimneys', stage: 'vent', dur: 3.3, rig: along(3.2, 3.3), params: { offset: 3.2 }, transition: { type: 'cut', dur: 0 }, signature: true, label: 'The chimneys' },
    { id: 'p-membrane', stage: 'vent', dur: 3.5, rig: along(6.5, 3.5), params: { offset: 6.5 }, transition: { type: 'cut', dur: 0 }, signature: true, label: 'The membrane closes' },
  ],
};
