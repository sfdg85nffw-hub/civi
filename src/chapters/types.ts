import type { ChapterMeta } from './meta';
import type { ShotDef } from '../director/types';
import type { FateField } from '../fate/FateField';

export interface TimedCue {
  /** sim time at which the cue fires when crossed forward */
  T: number;
  id: string;
}

export interface ChapterDef {
  meta: ChapterMeta;
  /** Odyssey shot list; durations should sum to the chapter budget */
  shots: ShotDef[];
  /** manual-mode agent view (used when lodMix > 0.5) */
  agentShot?: ShotDef;
  /** sim-time cues (audio stingers, flashes) */
  cues?: TimedCue[];
  /** local-rule agent simulation for this chapter (runs in the sim worker) */
  sim?: { id: string; fate: FateField };
}
