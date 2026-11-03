import type { QualityTier } from '../render/Renderer';

const SPARK_KEY = 'deep-time.spark';
const PREFS_KEY = 'deep-time.prefs';

export interface Prefs {
  quality: QualityTier | 'auto';
  reducedFlash: boolean;
}

/** Last spark colour (sRGB hex) or null on the first run. Never throws. */
export function loadSpark(): string | null {
  try {
    const v = localStorage.getItem(SPARK_KEY);
    return v && /^#[0-9a-f]{6}$/i.test(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveSpark(hex: string): void {
  try {
    localStorage.setItem(SPARK_KEY, hex);
  } catch {
    /* storage unavailable: the loop forgets */
  }
}

export function loadPrefs(): Prefs {
  try {
    const v = JSON.parse(localStorage.getItem(PREFS_KEY) ?? 'null');
    if (v && typeof v === 'object') return { quality: v.quality ?? 'auto', reducedFlash: !!v.reducedFlash };
  } catch {
    /* ignore */
  }
  return { quality: 'auto', reducedFlash: false };
}

export function savePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
