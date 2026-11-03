import { el, svg } from './dom';
import type { QualityTier } from '../render/Renderer';

export interface StartChoices {
  quality: QualityTier | 'auto';
  reducedFlash: boolean;
}

/**
 * Title, a single Begin button (the user gesture audio needs), and two small
 * options: quality and reduced flash.
 */
export class StartScreen {
  readonly root: HTMLDivElement;
  private begin: HTMLButtonElement;
  private errEl: HTMLDivElement;
  private choices: StartChoices;
  private spark: SVGCircleElement;

  constructor(parent: HTMLElement, initial: StartChoices, sparkCss: string, onBegin: (c: StartChoices) => void) {
    this.choices = { ...initial };
    this.root = el('div', 'start', parent);
    el('div', 'note', this.root, 'Sound on · best in fullscreen');
    const stack = el('div', 'stack', this.root);
    const ring = el('div', 'ring', stack);
    const s = svg('svg', { viewBox: '-100 -100 200 200' }, ring);
    svg('circle', { class: 'orbit', cx: 0, cy: 0, r: 92 }, s);
    this.spark = svg('circle', { class: 'spark', cx: 0, cy: 0, r: 2.2 }, s);
    this.spark.style.fill = sparkCss;
    this.spark.style.setProperty('--accent', sparkCss);
    el('h1', '', stack, 'DEEP TIME');
    el('div', 'sub', stack, 'A history of life and intelligence');
    this.begin = el('button', 'begin', stack, 'Begin');
    this.begin.disabled = true;
    this.begin.addEventListener('click', () => {
      if (this.begin.disabled) return;
      this.begin.disabled = true;
      onBegin(this.choices);
    });
    this.errEl = el('div', 'err', stack);

    const opts = el('div', 'opts', this.root);
    const q = el('div', 'grp', opts);
    el('span', 'lbl', q, 'Quality');
    const tiers: (QualityTier | 'auto')[] = ['auto', 'low', 'medium', 'high'];
    const qButtons = tiers.map((t) => {
      const b = el('button', t === this.choices.quality ? 'on' : '', q, t);
      b.addEventListener('click', () => {
        this.choices.quality = t;
        qButtons.forEach((x, i) => x.classList.toggle('on', tiers[i] === t));
      });
      return b;
    });
    const f = el('div', 'grp', opts);
    el('span', 'lbl', f, 'Reduced flash');
    const fb = el('button', this.choices.reducedFlash ? 'on' : '', f, this.choices.reducedFlash ? 'on' : 'off');
    fb.addEventListener('click', () => {
      this.choices.reducedFlash = !this.choices.reducedFlash;
      fb.textContent = this.choices.reducedFlash ? 'on' : 'off';
      fb.classList.toggle('on', this.choices.reducedFlash);
    });
  }

  ready(): void {
    this.begin.disabled = false;
    this.begin.focus({ preventScroll: true });
  }

  error(msg: string): void {
    this.errEl.textContent = msg;
  }

  hide(): void {
    this.root.classList.add('gone');
    setTimeout(() => this.root.remove(), 1800);
  }
}
