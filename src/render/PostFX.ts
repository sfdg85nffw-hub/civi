import * as THREE from 'three/webgpu';
import { T, type N } from './tsl/T';
const {
  pass, uniform, Fn, vec2, vec3, vec4, float, uv, mix, smoothstep, length, dot, renderOutput, max, min,
  fract, sin, clamp, Loop, int, convertToTexture, select, abs, floor, step,
} = T;
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
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
  readonly uSaturation: N = uniform(1.28);
  readonly uLift: N = uniform(0);
  readonly uTint: N = uniform(new THREE.Color(1, 1, 1));
  readonly uBloomThreshold: N = uniform(0);
  readonly uFocus: N = uniform(5);
  readonly uFocalLength: N = uniform(2);
  readonly uBokeh: N = uniform(0);
  /** the rupture (0..1): the picture tears into displaced slices with split colour */
  readonly uGlitch: N = uniform(0);

  private bloomNode: N;

  constructor(renderer: THREE.WebGPURenderer, quality: QualitySettings) {
    this.pipeline = new THREE.RenderPipeline(renderer);
    this.pipeline.outputColorTransform = false;
    this.passA = pass(this.emptyScene, this.emptyCamera);
    this.passB = pass(this.emptyScene, this.emptyCamera);
    const rawA = this.passA.getTextureNode('output');
    const texA = rawA;
    const depthA = this.passA.getTextureNode('depth');
    const passANode = this.passA;
    const useDof = quality.dof;
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

    // lean gather depth of field: 12 golden-angle taps, each weighted by its own circle of confusion
    const golden = Array.from({ length: 12 }, (_, i) => {
      const r = Math.sqrt((i + 0.5) / 12);
      const th = i * 2.39996323;
      return [r * Math.cos(th), r * Math.sin(th)] as const;
    });
    const cocAt = (p: N): N => {
      const z = T.perspectiveDepthToViewZ(depthA.sample(p).r, passANode._cameraNear, passANode._cameraFar);
      return clamp(abs(z.negate().sub(this.uFocus)).div(max(this.uFocalLength, 0.001)), 0.0, 1.0).mul(this.uBokeh);
    };
    const sampleDof = (tex: N, p: N): N => {
      if (!useDof) return sampleCA(tex, p);
      const c0 = cocAt(p);
      const rad = c0.mul(vec2(0.009, 0.016));
      const acc = sampleCA(tex, p).mul(0.6).toVar();
      const wsum = float(0.6).toVar();
      for (const [gx, gy] of golden) {
        const q = p.add(vec2(gx, gy).mul(rad));
        const w = cocAt(q).max(0.15);
        acc.addAssign(tex.sample(q).rgb.mul(w));
        wsum.addAssign(w);
      }
      return T.select(c0.greaterThan(0.02), acc.div(wsum), sampleCA(tex, p));
    };

    const sampleBlur = (tex: N, p: N): N => {
      if (!motionBlur) return sampleDof(tex, p);
      const acc = vec3(0).toVar();
      const blurLen = length(uBlurDir);
      // 8 taps along the blur direction; collapses to 1 effective tap when still
      Loop({ start: int(0), end: int(8) }, ({ i }: N) => {
        const t = float(i).div(7.0).sub(0.5);
        acc.addAssign(sampleCA(tex, p.add(uBlurDir.mul(t))));
      });
      const still = sampleDof(tex, p);
      return mix(still, acc.div(8.0), smoothstep(0.0005, 0.003, blurLen));
    };

    const composite = Fn(() => {
      const p = uv();
      const isDive = uMixMode.greaterThan(1.5);
      // dive: A magnifies toward the centre while B opens from a small iris
      const zA = mix(float(1.0), float(1.0).sub(uMix.mul(0.55)), select(isDive, float(1.0), float(0.0)));
      const pA0 = p.sub(0.5).mul(zA).add(0.5);
      // the rupture: horizontal slices jump sideways, re-dealt ~18 times a second
      const g = this.uGlitch;
      const band = floor(p.y.mul(22.0).add(floor(this.uTime.mul(7.0)).mul(3.1)));
      const tq = floor(this.uTime.mul(18.0));
      const h1 = fract(sin(band.mul(91.7).add(tq.mul(47.3))).mul(43758.55));
      const h2 = fract(sin(band.mul(12.9).add(tq.mul(78.2))).mul(24634.63));
      const torn = step(float(1.0).sub(g.mul(0.75)), h1);
      const pA = vec2(fract(pA0.x.add(h2.sub(0.5).mul(0.16).mul(g).mul(torn))), pA0.y);
      const zB = select(isDive, float(1.0).div(uMix.mul(0.75).add(0.25)), float(1.0));
      const pB = p.sub(0.5).mul(zB).add(0.5);
      const a = sampleBlur(texA, pA).mul(this.uExposure).toVar();
      T.If(g.greaterThan(0.001), () => {
        // colour splits apart along the tear; torn slices lose a little light
        const sp = vec2(g.mul(0.014).mul(h2.add(0.4)), 0.0);
        a.assign(vec3(texA.sample(pA.add(sp)).r, a.y.div(max(this.uExposure, 0.0001)), texA.sample(pA.sub(sp)).b).mul(this.uExposure).mul(float(1.0).sub(torn.mul(g).mul(0.25))));
      });
      // the dive magnifies B up to 4×: outside its frame there is nothing (no clamped edge smears)
      const inB = step(0.0, pB.x).mul(step(pB.x, 1.0)).mul(step(0.0, pB.y)).mul(step(pB.y, 1.0));
      const b = texB.sample(clamp(pB, 0.0, 1.0)).rgb.mul(this.uExposureB).mul(inB);
      const d = p.sub(0.5).mul(vec2(uAspect, 1.0));
      const r = length(d);
      const radialW = smoothstep(uMix.mul(1.3).sub(0.25), uMix.mul(1.3), r).oneMinus();
      const iris = smoothstep(uMix.mul(1.25).sub(0.12), uMix.mul(1.25).add(0.02), r).oneMinus().mul(smoothstep(0.0, 0.25, uMix));
      const wMatch = mix(radialW, uMix, 0.35);
      const w = select(isDive, mix(iris, float(1.0), smoothstep(0.8, 1.0, uMix)), select(uMixMode.greaterThan(0.5), wMatch, uMix));
      return mix(a, b, clamp(w, 0.0, 1.0));
    })();

    // bloom input: cheaper plain mix (no CA / blur)
    const bloomInput = Fn(() => {
      const p = uv();
      const a = texA.sample(p).rgb.mul(this.uExposure);
      const b = texB.sample(p).rgb.mul(this.uExposureB);
      const m = mix(a, b, uMix);
      const ok = m.x.equal(m.x).and(m.y.equal(m.y)).and(m.z.equal(m.z));
      return vec4(select(ok, min(m, vec3(64.0)), vec3(0.0)), 1.0);
    })();
    this.bloomNode = bloom(bloomInput, 0.6, 0.55, 0.0);
    this.bloomNode.strength = this.uBloomStrength;
    this.bloomNode.threshold = this.uBloomThreshold;

    const hdr = Fn(() => {
      const c = composite.add(this.bloomNode.rgb).toVar();
      // guard: a single non-finite pixel must never white out a frame through the bloom/tonemap chain
      const finite = c.x.equal(c.x).and(c.y.equal(c.y)).and(c.z.equal(c.z));
      c.assign(select(finite, min(c, vec3(256.0)), vec3(0.0)));
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
      // AgX's shoulder never reaches display white: expand so hero emitters can hit 1.0
      c.assign(c.mul(1.1).min(vec3(1.0)));
      // vignette
      const d = p.sub(0.5).mul(vec2(uAspect.mul(0.85), 1.0));
      const v = smoothstep(0.95, 0.18, length(d));
      c.mulAssign(mix(float(1.0).sub(this.uVignette), float(1.0), v));
      // film grain: luma-weighted, animated, doubles as dithering
      const seed = p.mul(vec2(1280.0, 720.0)).add(fract(this.uTime.mul(13.37)).mul(100.0));
      const n = fract(sin(dot(seed, vec2(12.9898, 78.233))).mul(43758.5453)).sub(0.5);
      const n2 = fract(sin(dot(seed.add(17.0), vec2(39.3468, 11.135))).mul(24634.6345)).sub(0.5);
      const lum = dot(c, vec3(0.299, 0.587, 0.114));
      const grainAmt = this.uGrain.mul(mix(float(0.1), float(1.0), smoothstep(0.0, 0.08, lum)).mul(float(1.0).sub(lum.mul(0.6))));
      // pin the black point so night sides and space stay black
      c.assign(max(c.sub(0.0035), vec3(0.0)).mul(1.0035));
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
