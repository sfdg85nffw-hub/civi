import type { ChapterDef } from './types';
import { CHAPTERS } from './meta';
import type { Stage } from '../render/stages/Stage';
import { VentStage } from '../render/stages/VentStage';
import { prologue } from './c00_prologue';
import { microbial } from './c01_microbial';
import { PlanetStage } from '../render/stages/PlanetStage';
import { MicroStage } from '../render/stages/MicroStage';

/** Stage factories, created lazily by the App. */
export const STAGE_FACTORIES: Record<string, () => Stage> = {
  vent: () => new VentStage(),
  planet: () => new PlanetStage(),
  micro: () => new MicroStage(),
};

const empty = (i: number): ChapterDef => ({ meta: CHAPTERS[i]!, shots: [] });

/** Chapter definitions in order (render side). */
export const CHAPTER_DEFS: ChapterDef[] = [prologue, microbial, empty(2), empty(3), empty(4), empty(5), empty(6), empty(7), empty(8), empty(9), empty(10)];
