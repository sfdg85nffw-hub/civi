/**
 * Pure chapter metadata (no rendering dependencies) — shared by the app,
 * the workers and the Node tests.
 */
export type ChapterId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ChapterMeta {
  id: ChapterId;
  key: string;
  title: string;
  /** chapter card: date line (uppercase) and one line */
  cardDate: string;
  cardLine: string;
  /** canonical sim-time range (years rel. 2026 CE) */
  T0: number;
  T1: number;
  /** Odyssey budget (seconds) */
  budget: number;
  /** temporal LOD threshold (years per real second): slower than this → agents */
  lodThreshold: number;
  regime: 'A' | 'B';
}

export const TAKEOVER_T = 50; // 2076 CE
export const CONTEST_T0 = 1e9;

export const CHAPTERS: readonly ChapterMeta[] = [
  { id: 0, key: 'prologue', title: 'The Vent', cardDate: '4.0 BILLION YEARS AGO', cardLine: 'A warm dark.', T0: -4.0e9, T1: -3.995e9, budget: 10, lodThreshold: 0, regime: 'A' },
  { id: 1, key: 'microbial', title: 'Microbial Earth', cardDate: '3.8 BILLION YEARS AGO', cardLine: 'One became many.', T0: -3.995e9, T1: -1.6e9, budget: 25, lodThreshold: 2e6, regime: 'A' },
  { id: 2, key: 'multicellular', title: 'The Many-Celled', cardDate: '1.6 BILLION YEARS AGO', cardLine: 'One swallowed another, and both lived.', T0: -1.6e9, T1: -5.0e8, budget: 25, lodThreshold: 4e6, regime: 'A' },
  { id: 3, key: 'animals', title: 'The Animal Kingdom', cardDate: '500 MILLION YEARS AGO', cardLine: 'The sea came ashore.', T0: -5.0e8, T1: -7.0e6, budget: 30, lodThreshold: 1e6, regime: 'A' },
  { id: 4, key: 'hominins', title: 'Hominins', cardDate: '7 MILLION YEARS AGO', cardLine: 'Something stood up.', T0: -7.0e6, T1: -12026, budget: 20, lodThreshold: 3e4, regime: 'A' },
  { id: 5, key: 'ancient', title: 'Ancient Civilizations', cardDate: '10,000 BCE', cardLine: 'Seeds, and the waiting.', T0: -12026, T1: -526, budget: 30, lodThreshold: 150, regime: 'A' },
  { id: 6, key: 'modern', title: 'The Modern World', cardDate: '1500 CE', cardLine: 'The night learned to burn.', T0: -526, T1: 0, budget: 25, lodThreshold: 4, regime: 'A' },
  { id: 7, key: 'singularity', title: 'The Singularity', cardDate: '2026 CE', cardLine: 'We built a mind.', T0: 0, T1: TAKEOVER_T, budget: 30, lodThreshold: 1.5, regime: 'A' },
  { id: 8, key: 'expansion', title: 'Expansion', cardDate: '+50 YEARS', cardLine: 'It did not stop at the Sun.', T0: TAKEOVER_T, T1: CONTEST_T0, budget: 25, lodThreshold: 2e4, regime: 'B' },
  { id: 9, key: 'contest', title: 'The Contest', cardDate: '+1 BILLION YEARS', cardLine: 'It was not alone.', T0: CONTEST_T0, T1: 6e10, budget: 45, lodThreshold: 2e6, regime: 'B' },
  { id: 10, key: 'coda', title: 'Coda', cardDate: '', cardLine: '', T0: 6e10, T1: 1e100, budget: 35, lodThreshold: 0, regime: 'B' },
];

export function chapterAtT(T: number): ChapterMeta {
  for (let i = CHAPTERS.length - 1; i >= 0; i--) {
    if (T >= CHAPTERS[i]!.T0) return CHAPTERS[i]!;
  }
  return CHAPTERS[0]!;
}

export function chapterById(id: number): ChapterMeta {
  return CHAPTERS[Math.max(0, Math.min(CHAPTERS.length - 1, id))]!;
}
