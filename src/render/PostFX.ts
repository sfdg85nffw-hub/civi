import * as THREE from 'three/webgpu';
import { T, type N } from './tsl/T';
const {
  pass, uniform, Fn, vec2, vec3, vec4, float, uv, mix, smoothstep, length, dot, renderOutput, max, min,
  fract, sin, clamp, Loop, int, convertToTexture,
} = T;
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js';
import type { QualitySettings } from './Renderer';

/**
 * PostFX — the single cinematic pipeline.
 * Two scene passes (A = current shot, B = incoming shot during transitions),
 * chromatic aberration, directional motion blur, bloom, exposure, AgX, grain,
 * vignette and fade. All parameters are uniforms driven by the Director.
 */
export class PostFX {
  readonly pipeline: THREE.RenderPipeline;
  readonly passA: N;
  readonly passB: N;
  private emptyScene = new THREE.Scene();
  private emptyCamera = new THREE.PerspectiveCamera();

  // uniforms
  readonly uMix: N = uniform(0); // 0 = A only, 1 = B only
  readonly uMixMode: N = uniform(0); // 0 dissolve, 1 radial (match cut), 2 dive
  readonly uExposure: N = uniform(1);
  readonly uExposureB: N = uniform(1);
  readonly uFade: N = uniform(1); // multiplies final (0 = black)
  readonly uFlash: N = uniform(0); // additive white (reduced-flash aware)
  readonly uFlashColor: N = uniform(new THREE.Color(1, 1, 1));
  readonly uGrain: N = uniform(0.035);
  readonly uVignette: N = uniform(0.32);
  readonly uChroma: N = uniform(0.0025);
  readonly uBlurDir: N = uniform(new THREE.Vector2(0, 0));
  readonly uTime: N = uniform(0);
  readonly uAspect: N = uniform(16 / 9);
  readonly uBloomStrength: N = uniform(0.6);
  readonly uSaturation: N = uniform(1);
  readonly uLift: N = uniform(0);
  readonly uTint: N = uniform(new THREE.Color(1, 1, 1));
  readonly uFocus: N = uniform(5);
  readonly uFocalLength: N = uniform(2);
  readonly uBokeh: N = uniform(0);

  private bloomNode: N;

  constructor(renderer: THREE.WebGPURenderer, quality: QualitySettings) {
    this.pipeline = new THREE.RenderPipeline(renderer);
    this.pipeline.outputColorTransform = false;
    this.passA = pass(this.emptyScene, this.emptyCamera);
    this.passB = pass(this.emptyScene, this.emptyCamera);
    const rawA = this.passA.getTextureNode('output');
    const texA = quality.dof ? convertToTexture(dof(rawA, this.passA.getViewZNode(), this.uFocus, this.uFocalLength, this.uBokeh)) : rawA;
    const texB = this.passB.getTextureNode('output');

    const uMix = this.uMix;
    const uMixMode = this.uMixMode;
    const uChroma = this.uChroma;
    const uBlurDir = this.uBlurDir;
    const uAspect = this.uAspect;

    const chromatic = quality.chromatic;
    const motionBlur = quality.motionBlur;

    // sample with chromatic aberration (radial, strongest at edges)
    const sampleCA = (tex: N, p: N): N => {
      if (!chromatic) return tex.sample(p).rgb;
      const d = p.sub(0.5);
      const r2 = dot(d, d);
      const off = d.mul(uChroma.mul(r2.mul(4.0)));
      const r = tex.sample(p.sub(off)).r;
      const g = tex.sample(p).g;
      const b = tex.sample(p.add(off)).b;
      return vec3(r, g, b);
    };

    const sampleBlur = (tex: N, p: N): N => {
      if (!motionBlur) return sampleCA(tex, p);
      const acc = vec3(0).toVar();
      const blurLen = length(uBlurDir);
      // 8 taps along the blur direction; collapses to 1 effective tap when still
      Loop({ start: int(0), end: int(8) }, ({ i }: N) => {
        const t = float(i).div(7.0).sub(0.5);
        acc.addAssign(sampleCA(tex, p.add(uBlurDir.mul(t))));
      });
      const still = sampleCA(tex, p);
      return mix(still, acc.div(8.0), smoothstep(0.0005, 0.003, blurLen));
    };

    const composite = Fn(() => {
      const p = uv();
      const a = sampleBlur(texA, p).mul(this.uExposure);
      const b = texB.sample(p).rgb.mul(this.uExposureB);
      // mix modes: dissolve | radial iris | dive (B zooms in from centre)
      const d = p.sub(0.5).mul(vec2(uAspect, 1.0));
      const r = length(d);
      const radialW = smoothstep(uMix.mul(1.3).sub(0.25), uMix.mul(1.3), r).oneMinus();
      const w = mix(uMix, mix(radialW, uMix, 0.35), min(uMixMode, 1.0));
      return mix(a, b, clamp(w, 0.0, 1.0));
    })();

    // bloom input: cheaper plain mix (no CA / blur)
    const bloomInput = Fn(() => {
      const p = uv();
      const a = texA.sample(p).rgb.mul(this.uExposure);
      const b = texB.sample(p).rgb.mul(this.uExposureB);
      return vec4(mix(a, b, uMix), 1.0);
    })();
    this.bloomNode = bloom(bloomInput, 0.6, 0.55, 0.0);
    this.bloomNode.strength = this.uBloomStrength;

    const hdr = Fn(() => {
      const c = composite.add(this.bloomNode.rgb).toVar();
      // flash (additive, pre-tonemap so it blooms naturally into white)
      c.addAssign(vec3(this.uFlashColor).mul(this.uFlash));
      // gentle saturation control (pre-tonemap, luminance preserving)
      const l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c.assign(mix(vec3(l), c, this.uSaturation));
      c.mulAssign(vec3(this.uTint));
      return vec4(c, 1.0);
    })();

    const ldr = renderOutput(hdr, THREE.AgXToneMapping, THREE.SRGBColorSpace);

    const final = Fn(() => {
      const p = uv();
      const c = ldr.rgb.toVar();
      // vignette
      const d = p.sub(0.5).mul(vec2(uAspect.mul(0.85), 1.0));
      const v = smoothstep(0.95, 0.18, length(d));
      c.mulAssign(mix(float(1.0).sub(this.uVignette), float(1.0), v));
      // film grain: luma-weighted, animated, doubles as dithering
      const seed = p.mul(vec2(1280.0, 720.0)).add(fract(this.uTime.mul(13.37)).mul(100.0));
      const n = fract(sin(dot(seed, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5);
      const n2 = fract(sin(dot(seed.add(17.0), vec2(39.3468, 11.135))).mul(24634.6345)).sub(0.5);
      const lum = dot(c, vec3(0.299, 0.587, 0.114));
      const grainAmt = this.uGrain.mul(mix(float(0.55), float(1.0), smoothstep(0.0, 0.35, lum)).mul(float(1.0).sub(lum.mul(0.6))));
      c.addAssign(vec3(n.add(n2).mul(grainAmt)));
      c.addAssign(vec3(this.uLift));
      c.mulAssign(this.uFade);
      return vec4(max(c, vec3(0.0)), 1.0);
    })();

    this.pipeline.outputNode = final;
  }

  setA(scene: THREE.Scene | null, camera: THREE.Camera | null): void {
    this.passA.scene = scene ?? this.emptyScene;
    this.passA.camera = camera ?? this.emptyCamera;
  }

  setB(scene: THREE.Scene | null, camera: THREE.Camera | null): void {
    this.passB.scene = scene ?? this.emptyScene;
    this.passB.camera = camera ?? this.emptyCamera;
  }

  render(): void {
    this.pipeline.render();
  }
}
