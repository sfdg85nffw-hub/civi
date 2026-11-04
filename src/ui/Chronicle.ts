import { el } from './dom';

/** The terse procedural chronicle: lines fade in, linger, and fade. */
export class Chronicle {
  private root: HTMLDivElement;
  private entries: { node: HTMLDivElement; age: number; life: number }[] = [];
  visible = true;

  constructor(parent: HTMLElement) {
    this.root = el('div', 'chronicle passthrough', parent);
  }

  push(when: string, text: string, life = 6.5): void {
    const node = el('div', 'entry', this.root);
    if (when) el('span', 'when', node, when);
    node.appendChild(document.createTextNode(text));
    this.entries.push({ node, age: 0, life });
    while (this.entries.length > 2) {
      const e = this.entries.shift()!;
      e.node.remove();
    }
    requestAnimationFrame(() => node.classList.add('on'));
  }

  clear(): void {
    for (const e of this.entries) e.node.remove();
    this.entries = [];
  }

  update(dt: number): void {
    this.root.style.opacity = this.visible ? '1' : '0';
    for (const e of this.entries) {
      e.age += dt;
      if (e.age > e.life) e.node.classList.remove('on');
    }
    const keep = this.entries.filter((e) => e.age < e.life + 1.6);
    for (const e of this.entries) if (!keep.includes(e)) e.node.remove();
    this.entries = keep;
  }
}
