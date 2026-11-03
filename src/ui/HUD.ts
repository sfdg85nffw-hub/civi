import { el } from './dom';
import { formatDate, formatSpeed } from '../time/format';

export interface HUDHandlers {
  onPause(): void;
  onSlower(): void;
  onFaster(): void;
  onSpeed01(v: number): void;
  onOdyssey(): void;
  onFork(): void;
}

export interface HUDState {
  T: number;
  speed: number;
  speed01: number;
  chapterTitle: string;
  mode: 'odyssey' | 'manual';
  paused: boolean;
  seed: string;
  regimeB: boolean;
  backend: string;
  waiting: boolean;
}

/**
 * The HUD is hidden in cinema mode; mouse movement reveals it briefly and H
 * pins it. Touching any control leaves the Odyssey (handled by handlers).
 */
export class HUD {
  readonly root: HTMLDivElement;
  private dateEl: HTMLDivElement;
  private chapEl: HTMLDivElement;
  private metaEl: HTMLDivElement;
  private seedEl: HTMLDivElement;
  private speedEl: HTMLSpanElement;
  private pauseBtn: HTMLButtonElement;
  private slider: HTMLInputElement;
  private odysseyBtn: HTMLButtonElement;
  private forkWrap: HTMLDivElement;
  private forkSeed: HTMLSpanElement;
  pinned = false;
  private revealT = 0;
  /** the HUD (and cursor) may never show (e.g. during the Coda black) */
  suppressed = false;
  forkVisible = false;
  private lastSliderSet = -1;

  constructor(parent: HTMLElement, h: HUDHandlers) {
    this.root = el('div', 'hud', parent);
    this.dateEl = el('div', 'date', this.root);
    this.chapEl = el('div', 'chap', this.root);
    this.metaEl = el('div', 'meta', this.root);
    this.seedEl = el('div', 'seed', this.metaEl);
    el('div', 'hint', this.root, 'Space · [ ] · 0–9 · H · C · F · M');
    const c = el('div', 'controls', this.root);
    const slower = el('button', '', c, '‹‹');
    slower.title = 'Slower ([)';
    this.pauseBtn = el('button', '', c, 'Pause');
    this.speedEl = el('span', 'speed', c);
    this.slider = el('input', '', c);
    this.slider.type = 'range';
    this.slider.min = '0';
    this.slider.max = '1000';
    const faster = el('button', '', c, '››');
    faster.title = 'Faster (])';
    slower.addEventListener('click', h.onSlower);
    faster.addEventListener('click', h.onFaster);
    this.pauseBtn.addEventListener('click', h.onPause);
    this.slider.addEventListener('input', () => h.onSpeed01(+this.slider.value / 1000));
    this.odysseyBtn = el('button', 'odyssey', this.root, 'Return to Odyssey');
    this.odysseyBtn.addEventListener('click', h.onOdyssey);
    this.forkWrap = el('div', 'fork', parent);
    this.forkSeed = el('span', 'seed', this.forkWrap);
    const fb = el('button', '', this.forkWrap, 'Fork the future');
    fb.title = 'Re-roll the future from the takeover (R)';
    fb.addEventListener('click', h.onFork);
  }

  reveal(seconds = 2.8): void {
    this.revealT = Math.max(this.revealT, seconds);
  }

  update(dt: number, s: HUDState): void {
    this.revealT = Math.max(0, this.revealT - dt);
    const show = !this.suppressed && (this.pinned || this.revealT > 0 || s.mode === 'manual');
    this.root.classList.toggle('show', show);
    document.body.classList.toggle('cursor-hidden', !show && !this.forkVisible);
    this.forkWrap.classList.toggle('on', !this.suppressed && s.regimeB && (this.forkVisible || show));
    this.forkSeed.textContent = `seed ${s.seed}`;
    if (!show) return;
    this.dateEl.textContent = formatDate(s.T, { speed: s.speed });
    this.chapEl.textContent = s.chapterTitle;
    this.seedEl.textContent = s.regimeB ? `seed ${s.seed}` : '';
    this.speedEl.textContent = s.waiting ? 'computing…' : s.paused ? 'paused' : formatSpeed(s.speed);
    this.pauseBtn.textContent = s.paused ? 'Play' : 'Pause';
    this.odysseyBtn.classList.toggle('on', s.mode === 'manual');
    const v = Math.round(s.speed01 * 1000);
    if (document.activeElement !== this.slider && v !== this.lastSliderSet) {
      this.slider.value = String(v);
      this.lastSliderSet = v;
    }
  }
}
