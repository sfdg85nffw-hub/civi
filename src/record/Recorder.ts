import type { ChapterId } from '../chapters/meta';

export interface MontageFrame {
  bmp: ImageBitmap | HTMLCanvasElement;
  s: number;
  T: number;
  chapter: ChapterId;
}

/**
 * Records low-resolution keyframes of this particular viewing so the Coda's
 * backward montage is unique to every run.
 */
export class Recorder {
  frames: MontageFrame[] = [];
  readonly w = 192;
  readonly h = 108;
  interval = 0.9;
  private last = -1e9;
  private scratch: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  enabled = true;
  maxFrames = 420;

  constructor() {
    this.scratch = document.createElement('canvas');
    this.scratch.width = this.w;
    this.scratch.height = this.h;
    this.ctx = this.scratch.getContext('2d', { willReadFrequently: false });
  }

  reset(): void {
    for (const f of this.frames) if ('close' in f.bmp) (f.bmp as ImageBitmap).close();
    this.frames = [];
    this.last = -1e9;
  }

  /** Call right after the frame has been rendered (same task). */
  maybeCapture(canvas: HTMLCanvasElement, s: number, T: number, chapter: ChapterId, allow: boolean): void {
    if (!this.enabled || !allow || !this.ctx) return;
    if (s - this.last < this.interval && s >= this.last) return;
    this.last = s;
    try {
      this.ctx.drawImage(canvas, 0, 0, this.w, this.h);
      const c = document.createElement('canvas');
      c.width = this.w;
      c.height = this.h;
      c.getContext('2d')!.drawImage(this.scratch, 0, 0);
      this.frames.push({ bmp: c, s, T, chapter });
      if (this.frames.length > this.maxFrames) this.frames.splice(0, this.frames.length - this.maxFrames);
    } catch {
      /* canvas not readable this frame: skip */
    }
  }
}
