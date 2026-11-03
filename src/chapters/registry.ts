import type { ChapterDef } from './types';
import { CHAPTERS } from './meta';
import type { Stage } from '../render/stages/Stage';
import { VentStage } from '../render/stages/VentStage';
import { prologue } from './c00_prologue';
import { microbial } from './c01_microbial';
import { PlanetStage } from '../render/stages/PlanetStage';
import { MicroStage } from '../render/stages/MicroStage';
import { CellStage } from '../render/stages/CellStage';
import { SeafloorStage } from '../render/stages/SeafloorStage';
import { LandStage } from '../render/stages/LandStage';
import { FireStage } from '../render/stages/FireStage';
import { CaveStage } from '../render/stages/CaveStage';
import { SolarStage } from '../render/stages/SolarStage';
import { GalaxyStage } from '../render/stages/GalaxyStage';
import { CodaStage } from '../render/stages/CodaStage';
import { coda } from './c10_coda';
import { expansion } from './c08_expansion';
import { contest } from './c09_contest';
import { singularity } from './c07_singularity';
import { hominins } from './c04_hominins';
import { ancient } from './c05_ancient';
import { modern } from './c06_modern';
import { animals } from './c03_animals';
import './overlays';
import { multicellular } from './c02_multicellular';

/** Stage factories, created lazily by the App. */
export const STAGE_FACTORIES: Record<string, () => Stage> = {
  vent: () => new VentStage(),
  planet: () => new PlanetStage(),
  micro: () => new MicroStage(),
  cell: () => new CellStage(),
  seafloor: () => new SeafloorStage(),
  land: () => new LandStage(),
  fire: () => new FireStage(),
  cave: () => new CaveStage(),
  solar: () => new SolarStage(),
  galaxy: () => new GalaxyStage(),
  coda: () => new CodaStage(),
};

const empty = (i: number): ChapterDef => ({ meta: CHAPTERS[i]!, shots: [] });

/** Chapter definitions in order (render side). */
export const CHAPTER_DEFS: ChapterDef[] = [prologue, microbial, multicellular, animals, hominins, ancient, modern, singularity, expansion, contest, coda];
