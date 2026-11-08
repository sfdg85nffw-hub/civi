import { el } from './dom';
import { clamp01, smoothstep } from '../core/math';

/** Chapter card: a date and one line, thin and wide-tracked. */
export class Card {
  private root: HTMLDivElement;
  private dateEl: HTMLDivElement;
  private lineEl: HTMLDivElement;
  private t = -1;
  private dur = 5.2;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'card passthrough', parent);
    this.dateEl = el('div', 'date', this.root);
    this.lineEl = el('div', 'line', this.root);
  }

  /** `turn`: one of the story's great turns — larger, and held longer */
  show(date: string, line: string, dur = 5.2, turn = false): void {
    this.root.classList.toggle('turn', turn);
    this.dateEl.textContent = date;
    this.lineEl.textContent = line;
    this.dateEl.style.display = date ? '' : 'none';
    this.t = 0;
    this.dur = dur;
  }

  hideNow(): void {
    this.t = -1;
    this.root.style.opacity = '0';
  }

  update(dt: number): void {
    if (this.t < 0) return;
    this.t += dt;
    const fadeIn = smoothstep(0, 1.4, this.t);
    const fadeOut = 1 - smoothstep(this.dur - 1.6, this.dur, this.t);
    const o = clamp01(fadeIn * fadeOut);
    this.root.style.opacity = o.toFixed(3);
    // date leads, line follows
    this.lineEl.style.opacity = clamp01(smoothstep(0.5, 1.9, this.t) * fadeOut / Math.max(o, 1e-3)).toFixed(3);
    const drift = (1 - fadeIn) * 6;
    this.root.style.transform = `translateY(calc(-50% + ${drift.toFixed(2)}px))`;
    if (this.t > this.dur) {
      this.t = -1;
      this.root.style.opacity = '0';
    }
  }
}
