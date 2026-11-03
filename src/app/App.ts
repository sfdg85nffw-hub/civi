import * as THREE from 'three/webgpu';
import { Renderer, type QualityTier } from '../render/Renderer';
import { PostFX } from '../render/PostFX';
import { TimeEngine } from '../time/TimeEngine';
import { Director, type DirectorOut } from '../director/Director';
import { FreeCamera } from '../director/FreeCamera';
import { CHAPTERS, chapterById, TAKEOVER_T } from '../chapters/meta';
import { CHAPTER_DEFS, STAGE_FACTORIES } from '../chapters/registry';
import type { Stage } from '../render/stages/Stage';
import { preloadVentGeometry } from '../render/stages/VentStage';
import { PlanetStage, preloadPlanetAssets } from '../render/stages/PlanetStage';
import type { FrameContext } from './frame';
import { worldAt } from '../fate/world';
import { AudioEngine, type AudioFrame } from '../audio/AudioEngine';
import { Recorder } from '../record/Recorder';
import { SimHost } from '../sim/SimHost';
import { StartScreen } from '../ui/StartScreen';
import { HUD } from '../ui/HUD';
import { Card } from '../ui/Card';
import { Chronicle } from '../ui/Chronicle';
import { Timeline } from '../ui/Timeline';
import { loadPrefs, loadSpark, savePrefs } from './prefs';
import { parseSeed, randomSeed, seedToString } from '../core/rng';
import { clamp, damp, hexToLinear, smoothstep } from '../core/math';

export interface DeepLink {
  autostart: boolean;
  s: number | null;
  chapter: number | null;
  shot: number | null;
  shotU: number;
  T: number | null;
  speed: number | null;
  seed: number | null;
  capture: boolean;
  fps: number;
  hud: boolean;
  res: { w: number; h: number } | null;
  forceWebGL: boolean;
  quality: QualityTier | null;
  reducedFlash: boolean;
  spark: string | null;
  nocard: boolean;
  warm: number;
  mute: boolean;
}

export function parseDeepLink(search: string): DeepLink {
  const p = new URLSearchParams(search);
  const num = (k: string): number | null => (p.has(k) && p.get(k) !== '' && Number.isFinite(Number(p.get(k))) ? Number(p.get(k)) : null);
  const res = p.get('res');
  const q = p.get('quality');
  return {
    autostart: p.get('autostart') === '1' || p.has('s') || p.has('chapter') || p.has('t'),
    s: num('s'),
    chapter: num('chapter'),
    shot: num('shot'),
    shotU: num('su') ?? 0.5,
    T: num('t'),
    speed: num('speed'),
    seed: parseSeed(p.get('seed')),
    capture: p.get('capture') === '1',
    fps: num('fps') ?? 30,
    hud: p.get('hud') === '1',
    res: res && /^\d+x\d+$/.test(res) ? { w: +res.split('x')[0]!, h: +res.split('x')[1]! } : null,
    forceWebGL: p.get('backend') === 'webgl',
    quality: q === 'low' || q === 'medium' || q === 'high' ? q : null,
    reducedFlash: p.get('flash') === 'reduced',
    spark: p.get('spark') ? '#' + p.get('spark')!.replace('#', '') : null,
    nocard: p.get('nocard') === '1',
    warm: num('warm') ?? 8,
    mute: p.get('mute') === '1',
  };
}

type Phase = 'start' | 'running' | 'rest';

export class App {
  readonly link: DeepLink;
  readonly renderer = new Renderer();
  postfx!: PostFX;
  readonly time = new TimeEngine();
  director!: Director;
  audio: AudioEngine | null = null;
  readonly recorder = new Recorder();
  readonly sims = new SimHost();
  private stages = new Map<string, Stage>();
  private ui!: HTMLElement;
  private hud!: HUD;
  private card!: Card;
  chronicle!: Chronicle;
  timeline!: Timeline;
  private start: StartScreen | null = null;
  private free!: FreeCamera;
  phase: Phase = 'start';
  seed = randomSeed();
  reducedFlash = false;
  /** spark colour (linear) */
  readonly spark = new THREE.Color(1, 1, 1);
  sparkHex = '#ffffff';
  private clock = 0;
  private lastNow = 0;
  private frameNo = 0;
  private lodMix = 0;
  private lastChapter = -1;
  private lastT = -4e9;
  private cardShownFor = -1;
  private hints: Record<string, number> = {};
  private readyFrames = 0;
  ready = false;
  /** silence/tone control written by stages or the Coda */
  audioOverride: Partial<Pick<AudioFrame, 'music' | 'toneDb' | 'chord'>> = {};
  private stageError: string | null = null;

  constructor() {
    this.link = parseDeepLink(location.search);
  }

  async boot(): Promise<void> {
    const canvas = document.getElementById('view') as HTMLCanvasElement;
    this.ui = document.getElementById('ui')!;
    const prefs = loadPrefs();
    if (this.link.seed !== null) this.seed = this.link.seed;
    this.reducedFlash = this.link.reducedFlash || prefs.reducedFlash;
    const savedSpark = this.link.spark ?? loadSpark();
    this.setSpark(savedSpark ?? '#ffffff');

    if (!this.link.autostart) {
      this.start = new StartScreen(this.ui, { quality: prefs.quality, reducedFlash: prefs.reducedFlash }, this.sparkHex, (c) => {
        savePrefs({ quality: c.quality, reducedFlash: c.reducedFlash });
        this.reducedFlash = c.reducedFlash;
        this.renderer.setQuality(c.quality === 'auto' ? this.renderer.detectTier() : c.quality);
        this.rebuildPost();
        this.begin(true);
      });
    }

    try {
      await this.renderer.init({ canvas, forceWebGL: this.link.forceWebGL, fixedSize: this.link.res });
    } catch (e) {
      console.warn('Renderer init failed, retrying with WebGL2', e);
      try {
        await this.renderer.init({ canvas, forceWebGL: true, fixedSize: this.link.res });
      } catch (e2) {
        this.start?.error('This browser cannot run DEEP TIME (WebGPU or WebGL2 required).');
        throw e2;
      }
    }
    const tier = this.link.quality ?? (prefs.quality !== 'auto' ? prefs.quality : this.renderer.detectTier());
    this.renderer.setQuality(tier);
    this.renderer.onDeviceLost = () => this.handleDeviceLost();
    PlanetStage.renderer = this.renderer.renderer;
    this.rebuildPost();
    this.director = new Director(CHAPTER_DEFS, this.time.odyssey);
    this.free = new FreeCamera(canvas);
    this.director.freePose = (p) => (this.free.enabled ? this.free.apply(p) : p);
    this.buildUI();
    window.addEventListener('resize', () => {
      this.renderer.resize();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.audio?.suspend();
      else if (this.phase === 'running') void this.audio?.resume();
      this.lastNow = performance.now();
    });
    this.installKeys();
    this.exposeAPI();

    try {
      await Promise.all([preloadPlanetAssets(), preloadVentGeometry()]);
    } catch (e) {
      console.error('Failed to load planet assets', e);
    }
    // pre-warm the Prologue
    try {
      this.getStage('vent');
    } catch (e) {
      console.error(e);
    }

    this.renderer.renderer.setAnimationLoop(() => this.frame());
    if (this.link.autostart) this.begin(false);
    else this.start?.ready();
  }

  private rebuildPost(): void {
    if (!this.renderer.renderer) return;
    this.postfx = new PostFX(this.renderer.renderer, this.renderer.quality);
  }

  private handleDeviceLost(): void {
    // Re-initialise on WebGL2: the show must go on.
    const notice = document.createElement('div');
    notice.className = 'notice on';
    notice.textContent = 'Recovering the display…';
    this.ui.appendChild(notice);
    setTimeout(() => location.reload(), 1200);
  }

  setSpark(hex: string): void {
    this.sparkHex = hex;
    const lin = hexToLinear(hex);
    this.spark.setRGB(lin[0], lin[1], lin[2]);
  }

  private buildUI(): void {
    this.card = new Card(this.ui);
    this.chronicle = new Chronicle(this.ui);
    this.timeline = new Timeline(this.ui);
    this.timeline.setSpans(this.time.odyssey.spans, this.time.odyssey.total);
    this.timeline.onScrub = (frac) => {
      const s = frac * this.time.odyssey.total;
      this.time.seekT(this.time.odyssey.T(s));
      this.hud.reveal(3);
    };
    this.hud = new HUD(this.ui, {
      onPause: () => this.time.togglePause(),
      onSlower: () => this.time.nudgeSpeed(-1),
      onFaster: () => this.time.nudgeSpeed(1),
      onSpeed01: (v) => this.time.setSpeed01(v),
      onOdyssey: () => this.time.returnToOdyssey(),
      onFork: () => this.fork(),
    });
    this.hud.pinned = this.link.hud;
    window.addEventListener('pointermove', () => this.phase === 'running' && this.hud.reveal());
  }

  private installKeys(): void {
    window.addEventListener('keydown', (e) => {
      if (this.phase === 'start') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (this.phase === 'rest') {
        if (k === ' ' || k === 'Enter') {
          e.preventDefault();
          this.newRun();
        }
        return;
      }
      if (k === ' ') {
        e.preventDefault();
        this.time.togglePause();
        this.hud.reveal();
      } else if (k === '[') {
        this.time.nudgeSpeed(-1);
        this.hud.reveal();
      } else if (k === ']') {
        this.time.nudgeSpeed(1);
        this.hud.reveal();
      } else if (/^[0-9]$/.test(k)) {
        this.time.jumpToChapter(+k);
        this.director.reset();
        this.showCard(+k);
        this.hud.reveal();
      } else if (k === 'h' || k === 'H') {
        this.hud.pinned = !this.hud.pinned;
      } else if (k === 'c' || k === 'C') {
        this.free.toggle();
      } else if (k === 'f' || k === 'F') {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.().catch(() => undefined);
      } else if (k === 'm' || k === 'M') {
        this.audio?.toggleMute();
      } else if (k === 'r' || k === 'R') {
        if (this.time.T > TAKEOVER_T * 0.98) this.fork();
      } else if (k === 'Escape' && this.free.enabled) this.free.toggle();
    });
  }

  private begin(withAudio: boolean): void {
    this.start?.hide();
    this.start = null;
    if (withAudio && !this.link.mute) {
      try {
        this.audio = new AudioEngine();
        void this.audio.resume();
      } catch (e) {
        console.warn('Audio unavailable', e);
        this.audio = null;
      }
    }
    this.phase = 'running';
    this.clock = 0;
    this.lastNow = performance.now();
    const L = this.link;
    if (L.T !== null) {
      this.time.enterManual();
      this.time.seekT(L.T);
      if (L.speed !== null) this.time.setSpeedYps(L.speed);
    } else if (L.s !== null) {
      this.time.seekStory(L.s);
    } else if (L.chapter !== null) {
      const ch = clamp(Math.round(L.chapter), 0, 10);
      if (L.shot !== null) {
        const list = this.director.shotsFor(ch);
        const it = list[clamp(Math.round(L.shot), 0, list.length - 1)];
        if (it) this.time.seekStory(it.s0 + it.dur * L.shotU);
        else this.time.jumpToChapter(ch);
      } else this.time.seekStory(this.time.odyssey.span(ch).s0 + 0.01);
      if (L.speed !== null) {
        this.time.enterManual();
        this.time.setSpeedYps(L.speed);
      }
    }
    this.lastChapter = -1;
  }

  /** R / button: re-roll the future from the takeover. */
  fork(): void {
    if (this.time.T < TAKEOVER_T * 0.98) return;
    this.seed = randomSeed();
    this.chronicle.clear();
    this.hud.reveal(4);
  }

  newRun(): void {
    this.seed = randomSeed();
    this.recorder.reset();
    this.chronicle.clear();
    this.time.resting = false;
    this.time.mode = 'odyssey';
    this.time.paused = false;
    this.time.seekStory(this.time.odyssey.span(0).s1 - 1.0);
    this.director.reset();
    this.phase = 'running';
    this.timeline.curl = 0;
    void this.audio?.resume();
  }

  getStage(name: string): Stage {
    let st = this.stages.get(name);
    if (!st) {
      const f = STAGE_FACTORIES[name];
      if (!f) throw new Error(`Unknown stage ${name}`);
      st = f();
      this.stages.set(name, st);
    }
    st.ensureBuilt();
    return st;
  }

  private showCard(ch: number): void {
    if (this.link.nocard) return;
    const m = chapterById(ch);
    if (!m.cardLine) return;
    this.card.show(m.cardDate, m.cardLine, ch === 0 ? 6.5 : 5.2);
    this.cardShownFor = ch;
  }

  private cueTimes = new Map<string, number>();
  fireCue(id: string, x?: number): void {
    const last = this.cueTimes.get(id) ?? -1e9;
    if (this.clock - last < 0.25) return;
    this.cueTimes.set(id, this.clock);
    this.audio?.cue(id, x);
  }

  setHint(k: string, v: number): void {
    this.hints[k] = v;
  }

  private frame(): void {
    const now = performance.now();
    let dt = (now - this.lastNow) / 1000;
    this.lastNow = now;
    if (this.link.capture) dt = this.ready && this.runFrames <= 0 ? 0 : 1 / this.link.fps;
    if (this.runFrames > 0) this.runFrames--;
    dt = clamp(dt, 0, 0.1);
    this.frameNo++;
    if (!this.link.capture) this.renderer.trackFrame(dt * 1000);

    if (this.phase === 'start') {
      // a quiet black frame behind the start screen
      this.postfx.setA(null, null);
      this.postfx.setB(null, null);
      this.postfx.uFade.value = 0;
      this.postfx.render();
      return;
    }

    this.clock += dt;
    this.time.update(dt);
    const T = this.time.T;
    const chapter = this.time.chapter;
    const meta = CHAPTERS[chapter]!;
    const span = this.time.odyssey.span(chapter);
    const s = this.time.mode === 'odyssey' ? this.time.storyTime : this.time.odyssey.s(T);
    const chapterU = clamp((s - span.s0) / Math.max(1e-6, span.s1 - span.s0), 0, 1);

    // temporal LOD
    const th = meta.lodThreshold;
    const sp = Math.max(1e-9, Math.abs(this.time.speed));
    const lodTarget = th > 0 ? 1 - smoothstep(Math.log10(th / 3), Math.log10(th * 3), Math.log10(sp)) : 0;
    this.lodMix = damp(this.lodMix, this.time.paused ? Math.max(this.lodMix, lodTarget) : lodTarget, 2.2, dt);

    if (chapter !== this.lastChapter) {
      if (this.time.mode === 'odyssey' && this.lastChapter >= 0 && chapter === this.lastChapter + 1) this.cardShownFor = -1;
      this.lastChapter = chapter;
    }
    // chapter cards (Odyssey): shortly after the chapter begins
    if (this.time.mode === 'odyssey' && this.cardShownFor !== chapter) {
      const delay = chapter === 0 ? 2.2 : 0.7;
      if (s - span.s0 > delay && s - span.s0 < delay + 2) this.showCard(chapter);
    }

    // local-rule agents for this chapter (worker)
    const chDef = CHAPTER_DEFS[chapter];
    if (chDef?.sim) {
      this.sims.maxAgents = this.renderer.quality.tier === 'low' ? 1200 : this.renderer.quality.tier === 'medium' ? 1900 : 2600;
      this.sims.update(chDef.sim.id, chDef.sim.fate, this.seed, T, dt, this.lodMix, this.time.speed);
    } else this.sims.idle();
    if (this.sims.latest) this.hints.biomass = this.sims.latest.snap.stats.biomass ?? 0.3;
    if (this.sims.latest) this.hints.photo = this.sims.latest.snap.stats.photo ?? 0.3;

    const f: FrameContext = {
      T,
      speed: this.time.speed,
      storyTime: s,
      dt,
      time: this.clock,
      chapter,
      chapterU,
      mode: this.time.mode,
      world: worldAt(Math.min(T, TAKEOVER_T)),
      lodMix: this.lodMix,
      quality: this.renderer.quality,
      reducedFlash: this.reducedFlash,
      spark: this.spark,
      seed: this.seed,
      freshStage: false,
      agents: this.sims.latest,
      cue: (id, x) => this.fireCue(id, x),
    };
    // sim-time cues of this chapter (fire when crossed forward)
    for (const c of chDef?.cues ?? []) if (this.lastT < c.T && T >= c.T && T - this.lastT < 5e8) this.fireCue(c.id);

    const out = this.director.update(f);
    this.renderLayers(f, out);

    // UI
    this.card.update(dt);
    this.chronicle.update(dt);
    const total = this.time.odyssey.total;
    const hudShown = this.hud.root.classList.contains('show');
    this.timeline.interactive = hudShown;
    this.timeline.opacity = damp(this.timeline.opacity, hudShown ? 1 : 0, 4, dt);
    this.timeline.update(s / total, null);
    this.hud.update(dt, {
      T,
      speed: this.time.speed,
      speed01: this.time.speed01,
      chapterTitle: meta.title,
      mode: this.time.mode,
      paused: this.time.paused,
      seed: seedToString(this.seed),
      regimeB: T > TAKEOVER_T * 0.98,
      backend: this.renderer.backend,
      waiting: this.time.waiting,
    });

    // audio
    if (this.audio) {
      this.hints.o2 = f.world.o2;
      this.hints.ice = f.world.ice;
      this.audio.update({
        chapter,
        chapterU,
        T,
        speed: this.time.speed,
        dt,
        lodMix: this.lodMix,
        hints: this.hints,
        music: this.audioOverride.music ?? 1,
        toneDb: this.audioOverride.toneDb ?? (chapter === 0 ? -40 : -52),
        chord: this.audioOverride.chord ?? 0,
      });
    }
    this.recorder.maybeCapture(this.renderer.canvas, s, T, chapter, this.phase === 'running' && chapter < 10);
    this.lastT = T;

    if (!this.ready) {
      this.readyFrames++;
      if (this.readyFrames >= this.link.warm) this.ready = true;
    }
  }

  private renderLayers(f: FrameContext, out: DirectorOut): void {
    const fx = this.postfx;
    const aspect = this.renderer.aspect;
    const posts: { a: Stage['post'] | null; b: Stage['post'] | null } = { a: null, b: null };
    const setLayer = (layer: DirectorOut['a'], which: 'A' | 'B'): void => {
      if (!layer) {
        if (which === 'A') fx.setA(null, null);
        else fx.setB(null, null);
        return;
      }
      let st: Stage;
      try {
        st = this.getStage(layer.stage);
      } catch (e) {
        if (!this.stageError) console.error(e);
        this.stageError = String(e);
        return;
      }
      const fresh = st.lastFrame < this.frameNo - 1;
      st.lastFrame = this.frameNo;
      st.applyPose(layer.pose, aspect);
      st.update({ ...f, freshStage: fresh }, layer.shot);
      if (which === 'A') {
        fx.setA(st.scene, st.camera);
        posts.a = st.post;
      } else {
        fx.setB(st.scene, st.camera);
        posts.b = st.post;
      }
    };

    setLayer(out.a, 'A');
    setLayer(out.b, 'B');
    {
      const m = out.b ? out.mix : 0;
      const a = posts.a ?? posts.b;
      const b = posts.b ?? posts.a;
      if (a && b) {
        const l = (x: number, y: number): number => x + (y - x) * m;
        fx.uBloomStrength.value = l(a.bloom, b.bloom);
        fx.uBloomThreshold.value = l(a.threshold, b.threshold);
        fx.uGrain.value = l(a.grain, b.grain);
        fx.uVignette.value = l(a.vignette, b.vignette);
        fx.uChroma.value = l(a.chroma, b.chroma);
        fx.uExposure.value = a.exposure;
        fx.uExposureB.value = b.exposure;
      }
    }
    fx.uMix.value = out.b ? out.mix : 0;
    fx.uMixMode.value = out.mixMode;
    fx.uFade.value = out.fade * (this.stageFade ?? 1);
    fx.uTime.value = f.time;
    fx.uAspect.value = aspect;
    fx.uBlurDir.value.set(out.blur[0], out.blur[1]);
    const pa = out.a?.pose;
    if (pa) {
      const focus = pa.focus ?? 10;
      fx.uFocus.value = focus;
      fx.uFocalLength.value = Math.max(0.05, focus * 0.6);
      fx.uBokeh.value = (pa.aperture ?? 0) * 2.5;
    }
    fx.render();
  }

  stageFade = 1;
  /** capture mode: frames still allowed to advance time after ready */
  private runFrames = 0;

  private exposeAPI(): void {
    const api = {
      get ready() {
        return app.ready;
      },
      state: () => ({
        s: this.time.storyTime,
        T: this.time.T,
        chapter: this.time.chapter,
        mode: this.time.mode,
        speed: this.time.speed,
        lodMix: this.lodMix,
        backend: this.renderer.backend,
        seed: seedToString(this.seed),
        phase: this.phase,
        frames: this.frameNo,
        total: this.time.odyssey.total,
      }),
      seek: (s: number) => {
        this.time.seekStory(s);
        this.director.reset();
      },
      seekT: (T: number) => this.time.seekT(T),
      shots: () => this.director.allShots().map((x) => ({ chapter: x.chapter, index: x.index, id: x.def.id, s0: x.s0, dur: x.dur, signature: !!x.def.signature, label: x.def.label ?? x.def.id, su: x.def.params?.su })),
      run: (n: number) => {
        this.runFrames = n;
      },
      frames: (n: number) =>
        new Promise<void>((res) => {
          const target = this.frameNo + n;
          const tick = (): void => {
            if (this.frameNo >= target) res();
            else requestAnimationFrame(tick);
          };
          tick();
        }),
    };
    const app = this as App;
    (window as unknown as { __deeptime: typeof api }).__deeptime = api;
  }
}
