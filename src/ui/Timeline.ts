import { svg } from './dom';
import { clamp01 } from '../core/math';
import { CHAPTERS } from '../chapters/meta';

/**
 * The timeline bar. Positions are story-time fractions, so chapters occupy
 * widths proportional to their Odyssey budget and time inside each chapter is
 * log-warped (piecewise-logarithmic). In the Coda the bar curls, keeping its
 * length, until its end meets its beginning and it becomes a ring.
 */
export class Timeline {
  readonly root: HTMLDivElement;
  private s: SVGSVGElement;
  private bar: SVGPathElement;
  private done: SVGPathElement;
  private frontierPath: SVGPathElement;
  private head: SVGCircleElement;
  private hit: SVGPathElement;
  private ticks: SVGGElement;
  private labels: SVGTextElement[] = [];
  private tickEls: SVGLineElement[] = [];
  private N = 240;
  /** 0 = straight bar, 1 = closed ring */
  curl = 0;
  /** 0..1 overall opacity */
  opacity = 0;
  private spans: { s0: number; s1: number; title: string }[] = [];
  private total = 300;
  onScrub: ((frac: number) => void) | null = null;
  private dragging = false;
  interactive = true;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'timeline';
    parent.appendChild(this.root);
    this.s = svg('svg', {}, this.root);
    this.ticks = svg('g', {}, this.s);
    this.bar = svg('path', { class: 'bar' }, this.s);
    this.frontierPath = svg('path', { class: 'frontier' }, this.s);
    this.done = svg('path', { class: 'done' }, this.s);
    this.head = svg('circle', { class: 'head', r: 2.4 }, this.s);
    this.hit = svg('path', { class: 'hit', stroke: 'transparent', 'stroke-width': 22, fill: 'none' }, this.s);
    const toFrac = (e: PointerEvent): number => {
      const { x0, x1 } = this.geom();
      return clamp01((e.clientX - x0) / (x1 - x0));
    };
    this.hit.addEventListener('pointerdown', (e) => {
      if (!this.interactive || this.curl > 0.02) return;
      this.dragging = true;
      this.hit.setPointerCapture(e.pointerId);
      this.onScrub?.(toFrac(e));
    });
    this.hit.addEventListener('pointermove', (e) => {
      if (this.dragging) this.onScrub?.(toFrac(e));
    });
    const end = (): void => {
      this.dragging = false;
    };
    this.hit.addEventListener('pointerup', end);
    this.hit.addEventListener('pointercancel', end);
  }

  setSpans(spans: { s0: number; s1: number }[], total: number): void {
    this.total = total;
    this.spans = spans.map((sp, i) => ({ ...sp, title: CHAPTERS[i]?.title ?? '' }));
    this.ticks.replaceChildren();
    this.labels = [];
    this.tickEls = [];
    for (let i = 0; i < this.spans.length; i++) {
      this.tickEls.push(svg('line', { class: 'tick' }, this.ticks));
      const t = svg('text', { class: 'tlabel' }, this.ticks);
      t.textContent = i < 10 ? String(i) : '';
      this.labels.push(t);
    }
  }

  private geom(): { x0: number; x1: number; y: number; L: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const x0 = w * 0.05;
    const x1 = w * 0.95;
    const y = h * 0.3 - Math.max(18, h * 0.05);
    return { x0, x1, y, L: x1 - x0 };
  }

  /** Point at fraction a∈[0,1] along the (possibly curled) bar, in svg coords. */
  private point(a: number, g = this.geom()): [number, number] {
    const b = this.curl;
    const { x0, y, L } = g;
    const xm = x0 + L / 2;
    if (b < 1e-4) return [x0 + a * L, y];
    const theta = 2 * Math.PI * b;
    const r = L / theta;
    // arc centred above the bar's midpoint; midpoint stays fixed, ends rise
    const phi = (a - 0.5) * theta; // angle from the bottom
    const cx = xm;
    const cyArc = y - r;
    // drift the closed ring upward toward frame centre as it forms
    const lift = b * b * (window.innerHeight * 0.3 * 0.0);
    return [cx + r * Math.sin(phi), cyArc + r * Math.cos(phi) - lift];
  }

  private pathFor(a0: number, a1: number): string {
    const g = this.geom();
    const n = Math.max(2, Math.ceil(this.N * (a1 - a0)));
    let d = '';
    for (let i = 0; i <= n; i++) {
      const a = a0 + ((a1 - a0) * i) / n;
      const [x, y] = this.point(a, g);
      d += (i === 0 ? 'M' : 'L') + x.toFixed(2) + ' ' + y.toFixed(2);
    }
    return d;
  }

  update(storyFrac: number, frontierFrac: number | null): void {
    this.root.style.opacity = this.opacity.toFixed(3);
    const full = this.pathFor(0, 1);
    this.bar.setAttribute('d', full);
    this.hit.setAttribute('d', full);
    const f = clamp01(storyFrac);
    this.done.setAttribute('d', this.pathFor(0, Math.max(0.0005, f)));
    if (frontierFrac !== null && frontierFrac < 0.999 && frontierFrac > f) {
      this.frontierPath.setAttribute('d', this.pathFor(f, frontierFrac));
      this.frontierPath.style.display = '';
    } else this.frontierPath.style.display = 'none';
    const [hx, hy] = this.point(f);
    this.head.setAttribute('cx', hx.toFixed(2));
    this.head.setAttribute('cy', hy.toFixed(2));
    const g = this.geom();
    const labelAlpha = 1 - clamp01(this.curl * 6);
    this.spans.forEach((sp, i) => {
      const a = sp.s0 / this.total;
      const [x, y] = this.point(a, g);
      const tk = this.tickEls[i]!;
      tk.setAttribute('x1', x.toFixed(2));
      tk.setAttribute('x2', x.toFixed(2));
      tk.setAttribute('y1', (y - 4).toFixed(2));
      tk.setAttribute('y2', (y + 4).toFixed(2));
      tk.style.opacity = labelAlpha.toFixed(3);
      const lb = this.labels[i]!;
      lb.setAttribute('x', (x + 4).toFixed(2));
      lb.setAttribute('y', (y + 16).toFixed(2));
      lb.style.opacity = labelAlpha.toFixed(3);
    });
  }
}
