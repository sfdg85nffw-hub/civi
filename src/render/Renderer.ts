import * as THREE from 'three/webgpu';

export type QualityTier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  tier: QualityTier;
  /** render scale multiplier on devicePixelRatio-limited size */
  renderScale: number;
  maxDpr: number;
  particles: number; // multiplier on particle budgets
  raySteps: number; // multiplier on raymarch steps
  dof: boolean;
  motionBlur: boolean;
  chromatic: boolean;
  bloomMips: boolean;
}

export const QUALITY: Record<QualityTier, QualitySettings> = {
  low: { tier: 'low', renderScale: 0.7, maxDpr: 1, particles: 0.3, raySteps: 0.5, dof: false, motionBlur: false, chromatic: false, bloomMips: false },
  medium: { tier: 'medium', renderScale: 0.85, maxDpr: 1.5, particles: 0.6, raySteps: 0.75, dof: false, motionBlur: true, chromatic: true, bloomMips: true },
  high: { tier: 'high', renderScale: 1.0, maxDpr: 2, particles: 1.0, raySteps: 1.0, dof: true, motionBlur: true, chromatic: true, bloomMips: true },
};

export interface RendererInitOptions {
  canvas: HTMLCanvasElement;
  forceWebGL?: boolean;
  fixedSize?: { w: number; h: number } | null;
}

/**
 * Owns the WebGPURenderer: backend selection (WebGPU → WebGL2 fallback),
 * quality tiers, dynamic resolution, device loss and visibility.
 */
export class Renderer {
  renderer!: THREE.WebGPURenderer;
  canvas!: HTMLCanvasElement;
  backend: 'webgpu' | 'webgl2' = 'webgl2';
  quality: QualitySettings = QUALITY.high;
  adapterInfo = '';
  fixedSize: { w: number; h: number } | null = null;
  /** dynamic resolution factor (0.5–1) */
  dynamicScale = 1;
  private frameTimes: number[] = [];
  onDeviceLost: ((msg: string) => void) | null = null;
  width = 1;
  height = 1;
  /** keep the probe adapter alive (Chrome drops the wire instance if it is GC'd mid-init) */
  probeAdapter: unknown = null;

  async init(opts: RendererInitOptions): Promise<void> {
    this.canvas = opts.canvas;
    this.fixedSize = opts.fixedSize ?? null;
    let useWebGPU = !opts.forceWebGL && typeof navigator !== 'undefined' && 'gpu' in navigator;
    if (useWebGPU) {
      try {
        const adapter = await (navigator as unknown as { gpu: { requestAdapter(o?: object): Promise<unknown> } }).gpu.requestAdapter({ powerPreference: 'high-performance' });
        this.probeAdapter = adapter;
        if (!adapter) useWebGPU = false;
        else {
          const info = (adapter as { info?: { vendor?: string; architecture?: string; description?: string } }).info;
          this.adapterInfo = info ? `${info.vendor ?? ''} ${info.architecture ?? ''} ${info.description ?? ''}`.trim() : '';
        }
      } catch {
        useWebGPU = false;
      }
    }
    this.renderer = new THREE.WebGPURenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
      forceWebGL: !useWebGPU,
    } as ConstructorParameters<typeof THREE.WebGPURenderer>[0]);
    await this.renderer.init();
    const be = this.renderer.backend as unknown as { isWebGPUBackend?: boolean; gl?: WebGL2RenderingContext };
    this.backend = be.isWebGPUBackend ? 'webgpu' : 'webgl2';
    if (!this.adapterInfo && be.gl) {
      try {
        const ext = be.gl.getExtension('WEBGL_debug_renderer_info');
        this.adapterInfo = String(ext ? be.gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : be.gl.getParameter(be.gl.RENDERER));
      } catch {
        /* ignore */
      }
    }
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.onDeviceLost = (info: { message?: string | null; reason?: string | null }) => {
      this.onDeviceLost?.(`${info.message ?? ''} ${info.reason ?? ''}`.trim());
    };
    this.resize();
  }

  /** Heuristic tier detection (overridable on the start screen). */
  detectTier(): QualityTier {
    const info = this.adapterInfo.toLowerCase();
    if (/swiftshader|llvmpipe|software|basic render/.test(info)) return 'low';
    const mobile = /android|iphone|ipad|mobile/i.test(navigator.userAgent);
    if (mobile) return 'low';
    if (/intel|uhd|iris|mali|adreno|powervr/.test(info)) return this.backend === 'webgpu' ? 'medium' : 'low';
    if (this.backend === 'webgpu') return 'high';
    return 'medium';
  }

  setQuality(tier: QualityTier): void {
    this.quality = QUALITY[tier];
    this.resize();
  }

  resize(): void {
    const w = this.fixedSize ? this.fixedSize.w : window.innerWidth;
    const h = this.fixedSize ? this.fixedSize.h : window.innerHeight;
    const dpr = this.fixedSize ? 1 : Math.min(window.devicePixelRatio || 1, this.quality.maxDpr);
    const scale = this.fixedSize ? 1 : this.quality.renderScale * this.dynamicScale;
    this.width = w;
    this.height = h;
    this.renderer.setPixelRatio(dpr * scale);
    this.renderer.setSize(w, h, true);
    if (!this.fixedSize) {
      this.canvas.style.width = '100vw';
      this.canvas.style.height = '100vh';
    }
  }

  get aspect(): number {
    return this.width / Math.max(1, this.height);
  }

  /** Dynamic resolution: keep frame time near target by scaling the backbuffer. */
  trackFrame(dtMs: number): void {
    if (this.fixedSize) return;
    this.frameTimes.push(dtMs);
    if (this.frameTimes.length < 45) return;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)]!;
    this.frameTimes.length = 0;
    const target = this.quality.tier === 'low' ? 33 : 17.5;
    let next = this.dynamicScale;
    if (med > target * 1.25) next = Math.max(0.55, this.dynamicScale * 0.88);
    else if (med < target * 0.75) next = Math.min(1, this.dynamicScale * 1.06);
    if (Math.abs(next - this.dynamicScale) > 0.01) {
      this.dynamicScale = next;
      this.resize();
    }
  }
}
