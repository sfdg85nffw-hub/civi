import * as THREE from 'three/webgpu';
import { Renderer, type QualityTier } from '../render/Renderer';
import { PostFX } from '../render/PostFX';
import { TimeEngine } from '../time/TimeEngine';
import { Director, type DirectorOut } from '../director/Director';
import { DramaEngine } from './drama';
import type { CamPose } from '../director/types';
import { LAST_LIGHT_T } from '../data/singularity';
import { buildEpithets, voice } from '../galaxy/voice';
import { FreeCamera } from '../director/FreeCamera';
import { CHAPTERS, chapterById, TAKEOVER_T } from '../chapters/meta';
import { CHAPTER_DEFS, STAGE_FACTORIES } from '../chapters/registry';
import type { Stage } from '../render/stages/Stage';
import { preloadVentGeometry, PROTOCELL } from '../render/stages/VentStage';
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
import { GalaxyHost } from '../galaxy/GalaxyHost';
import type { GEvent } from '../galaxy/GalaxySim';
import { formatEpoch } from '../galaxy/chronicle';
import { buildContest, contest } from '../chapters/c09_contest';
import { setGalaxyParticleScale } from '../render/stages/GalaxyStage';
import { CodaStage } from '../render/stages/CodaStage';
import { coda, codaShots, CODA } from '../chapters/c10_coda';
import { MERGED_T } from '../galaxy/universe';
import { formatDate } from '../time/format';
import { saveSpark } from './prefs';

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
  /** Regime B: the galactic history for this run's seed, computed in a worker */
  readonly galaxy = new GalaxyHost();
  private contestDefault = contest.shots;
  private pendingSeek: (() => void) | null = null;
  private chronQueue: GEvent[] = [];
  private lastChronPush = -10;
  private lastBeatId = '';
  private lastBeatT = -1;
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
    this.galaxy.onDone(() => this.onGalaxyDone());
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
    this.drama = new DramaEngine({
      line: (date, text) => this.say(date, text, 'drama'),
      riser: (sec) => {
        this.audio?.drama('riser', sec);
        this.dramaLog.push({ s: this.time.storyTime, kind: 'build', what: sec.toFixed(1) + ' s' });
      },
      hit: (size) => {
        this.audio?.drama('hit', size);
        this.dramaLog.push({ s: this.time.storyTime, kind: 'hit', what: size.toFixed(2) });
      },
      glitch: (sec) => {
        this.audio?.drama('glitch', sec);
        this.dramaLog.push({ s: this.time.storyTime, kind: 'rupture', what: sec.toFixed(1) + ' s' });
      },
    });
    this.timeline = new Timeline(this.ui);
    this.timeline.setSpans(this.time.odyssey.spans, this.time.odyssey.total);
    this.timeline.onScrub = (frac) => {
      const s = frac * this.time.odyssey.total;
      this.time.seekT(this.time.odyssey.T(s));
      this.hud.reveal(3);
    };
    this.hud = new HUD(this.ui, {
      onPause: () => (this.phase === 'rest' ? this.newRun() : this.time.togglePause()),
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
    setGalaxyParticleScale(this.renderer.quality.particles);
    if (this.galaxyRunSeed !== this.seed) this.startGalaxy();
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
      // story positions inside the Contest/Coda only exist once this run's history is cut
      if (L.s >= this.time.odyssey.span(9).s0 && !this.galaxy.done) {
        this.time.seekStory(this.time.odyssey.span(8).s1 - 0.5);
        this.pendingSeek = () => {
          this.pendingSeek = null;
          this.begin(false);
        };
        return;
      }
      this.time.seekStory(L.s);
    } else if (L.chapter !== null) {
      const ch = clamp(Math.round(L.chapter), 0, 10);
      if (ch >= 9 && !this.galaxy.done) {
        // the Contest's shots exist only once this run's history has been written
        this.time.seekStory(this.time.odyssey.span(8).s1 - 0.5);
        this.pendingSeek = () => {
          this.pendingSeek = null;
          this.begin(false);
        };
        return;
      }
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
    this.startGalaxy();
    // the future begins again at the takeover
    if (this.time.mode === 'odyssey') this.time.seekStory(this.time.odyssey.span(8).s0 + 0.01);
    else this.time.seekT(TAKEOVER_T * 1.001);
    this.director.reset();
    this.hud.reveal(4);
  }

  private galaxyRunSeed = -1;
  private startGalaxy(): void {
    this.galaxyRunSeed = this.seed;
    this.galaxy.start(this.seed);
    contest.shots = this.contestDefault;
    this.time.odyssey.setContest(2.0e10, 45);
    this.chronQueue = [];
  }

  /** the history is written: cut the Contest from it */
  private onGalaxyDone(): void {
    const g = this.galaxy;
    if (!g.result) return;
    const c = buildContest(g);
    contest.shots = c.shots;
    this.epithets = buildEpithets(g.factions as never, g.events, (node) => g.u.gal[node] ?? 0);
    coda.shots = codaShots(g.result.endT > MERGED_T, g.result.outcome === 'vacuum');
    const s = this.time.storyTime;
    const T = this.time.T;
    const contestS0 = this.time.odyssey.span(9).s0;
    this.time.frontier = Infinity;
    this.time.odyssey.setContest(g.result.endT, c.duration, c.keys);
    // keep the viewer at the same moment: story positions before the Contest are unchanged
    if (this.time.mode === 'odyssey') this.time.seekStory(s < contestS0 ? s : this.time.odyssey.s(T));
    this.pendingSeek?.();
  }

  /**
   * THE CODA. Silence, saturation, the closing horizon, the last holes, one
   * point, the montage inside it, five seconds of true black, the Return, the ring.
   * Returns seconds into the Coda (or −1 outside it).
   */
  private updateCoda(chapter: number, s: number, T: number): number {
    const counter = this.counter ?? (this.counter = Object.assign(document.createElement('div'), { className: 'coda-counter' }));
    if (!counter.parentElement) this.ui.appendChild(counter);
    if (chapter !== 10) {
      counter.classList.remove('on');
      this.ui.classList.remove('coda-black');
      if (this.audioOverride.music !== undefined || this.audioOverride.chord !== undefined || this.audioOverride.toneDb !== undefined) this.audioOverride = {};
      this.stageFade = 1;
      this.sparkSaved = false;
      this.timeline.ringTarget = null;
      return -1;
    }
    const c = s - this.time.odyssey.span(10).s0;
    const res = this.galaxy.result;
    const sp = res ? res.spark : [1, 1, 1];
    const hex = '#' + sp.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('');
    if (hex !== this.victorHex) {
      this.victorHex = hex;
      const lin = hexToLinear(hex);
      this.victor.setRGB(lin[0], lin[1], lin[2]);
    }
    // sound: silence, the Tone alone, then nothing, then the Tone resolving into the chord
    let toneDb: number, chord = 0;
    if (c < CODA.point) toneDb = -46 - 14 * smoothstep(1, 6, c);
    else if (c < CODA.black) toneDb = -60 + 26 * smoothstep(CODA.point, CODA.point + 1.5, c);
    else if (c < CODA.ret) toneDb = -120;
    else {
      toneDb = -40 + 4 * smoothstep(CODA.ret, CODA.ret + 3, c);
      chord = smoothstep(CODA.ret + 2.5, CODA.ret + 6.5, c);
    }
    this.audioOverride = { music: 0, toneDb, chord };
    // five seconds of true black and true silence, and no UI at all
    const black = c >= CODA.black && c < CODA.ret;
    this.stageFade = black ? 0 : 1;
    this.ui.classList.toggle('coda-black', black || c < CODA.ret);
    this.chronicle.clear();
    // the counter blurs through the end of stars and holes
    const showCounter = c > CODA.candles + 0.3 && c < CODA.point + 0.6;
    counter.classList.toggle('on', showCounter);
    if (showCounter) {
      counter.textContent = formatDate(T, { speed: Math.abs(this.time.speed) });
      const blur = Math.min(3.5, Math.max(0, Math.log10(Math.max(1, Math.abs(this.time.speed))) - 9) * 0.12);
      counter.style.filter = `blur(${blur.toFixed(2)}px)`;
    }
    // the Return: the spark is now the colour of what was left (white if nothing was)
    if (c >= CODA.ret) {
      if (this.sparkHex !== hex) this.setSpark(hex);
      if (!this.sparkSaved) {
        saveSpark(hex);
        this.sparkSaved = true;
      }
    }
    // the ring: the bar fades in and curls until its end meets its beginning
    this.timeline.curl = smoothstep(CODA.ring, CODA.end - 0.2, c);
    // the ring closes around the first cell
    const vent = this.stages.get('vent');
    if (vent && c >= CODA.ret) {
      const v = new THREE.Vector3(PROTOCELL.x, PROTOCELL.y, PROTOCELL.z).project(vent.camera);
      this.timeline.ringTarget = [(v.x * 0.5 + 0.5) * window.innerWidth, (0.5 - v.y * 0.5) * window.innerHeight];
    } else this.timeline.ringTarget = null;
    if (c >= CODA.end - 0.05 && this.phase === 'running' && this.time.mode === 'odyssey') {
      this.phase = 'rest';
      this.time.resting = true;
    }
    return c;
  }

  /** how much is happening in the galaxy right now (0..1), for the score */
  private contestTension(T: number): number {
    const span = Math.max(5e5, Math.abs(this.time.speed) * 3);
    let w = 0;
    for (const e of this.galaxy.events) {
      if (e.t > T + span) break;
      if (e.t > T - span && e.text) w += e.weight;
    }
    // after the vacuum gives way there is nothing left to score
    const vac = this.galaxy.result?.outcome === 'vacuum' ? this.galaxy.events.find((e) => e.type === 'vacuum') : undefined;
    if (vac && T > vac.t) {
      this.silenceUntil = this.clock + 0.5;
      return 0;
    }
    return Math.min(1, w / 4);
  }

  /** feed the chronicle: terse lines for events just crossed, never a flood */
  private feedChronicle(T: number, dt: number): void {
    // in the Odyssey the Expansion is told by its own few lines; the raw stream starts with the Contest
    if (T < TAKEOVER_T || !this.galaxy.events.length || (this.time.mode === 'odyssey' && T < 1e9)) {
      this.lastChronT = T;
      return;
    }
    const v = (t: string): string => (this.epithets.length ? voice(t, this.galaxy.factions, this.epithets) : t);
    const t0 = this.lastChronT, t1 = T;
    this.lastChronT = T;
    if (t1 > t0 && t1 - t0 < Math.max(5e9, Math.abs(this.time.speed) * 2)) {
      for (const e of this.galaxy.events) {
        if (e.t > t1) break;
        if (e.t > t0 && e.text && e.type !== 'launch') this.chronQueue.push(e);
      }
      if (this.chronQueue.length > 4) {
        // keep the weightiest few, in order
        const keep = this.chronQueue.slice().sort((a, b) => b.weight - a.weight).slice(0, 3);
        this.chronQueue = this.chronQueue.filter((e) => keep.includes(e));
      }
    } else if (t1 < t0) this.chronQueue = [];
    // a Contest beat always carries its own line, dated, as soon as its moment is on screen
    const bsh = this.lastOut?.a?.shot;
    const bp = bsh?.def.params;
    if (bsh && bp && typeof bp.beatText === 'string' && bsh.def.id !== this.lastBeatId) {
      const bt = Number(bp.beatT ?? 0);
      // the line lands with its event (the finale's with its stroke, early in the closing shot)
      const due = bp.beatType === 'finale' ? bsh.u >= 0.36 : T >= bt - Math.abs(this.time.speed) * 0.15 || bsh.u > 0.9;
      if (due) {
        this.lastBeatId = bsh.def.id;
        this.lastBeatT = bt;
        // the beat's line replaces whatever lesser lines were waiting
        this.chronQueue = this.chronQueue.filter((e) => e.t > bt && e.weight >= 0.9 && e.text !== bp.beatText);
        this.lineQueue = [];
        this.say(formatEpoch(bt), v(bp.beatText), 'contest');
        this.lastChronPush = this.clock;
        const actor = Number(bp.hero ?? -1);
        const fi = actor >= 0 ? this.galaxy.factions[actor] : undefined;
        if (bp.beatType !== 'vacuum' && fi) this.audio?.motif(fi.motif, 0.9, ((actor * 0.37) % 1) * 1.2 - 0.6);
      }
    } else if (bsh && !bp?.beatText) this.lastBeatId = '';
    this.chronQueue = this.chronQueue.filter((e) => !(e.t === this.lastBeatT && e.text === bp?.beatText));
    // lines that fell behind the picture are dropped: the chronicle always matches the beat on screen
    const stale = Math.max(2e5, Math.abs(this.time.speed) * 1.6);
    this.chronQueue = this.chronQueue.filter((e) => T - e.t < stale);
    // while a beat's own line is still to come, the stream waits (nothing is said before it)
    const beatPending = !!(bsh && typeof bp?.beatText === 'string' && bsh.def.id !== this.lastBeatId);
    if (!beatPending && this.chronQueue.length && this.clock - this.lastChronPush > 4.0) {
      const e = this.chronQueue.shift()!;
      this.say(formatEpoch(e.t), v(e.text), 'contest');
      this.lastChronPush = this.clock;
      // the actor's motif; a nova is heard as a far boom; the vacuum is silent
      const actor = e.a >= 0 ? e.a : e.b;
      const fi = actor >= 0 ? this.galaxy.factions[actor] : undefined;
      if (e.type === 'supernova') this.audio?.cue('nuke', 0.35);
      else if (e.type !== 'vacuum' && fi) this.audio?.motif(fi.motif, e.weight, ((actor * 0.37) % 1) * 1.2 - 0.6);
    }
    void dt;
  }

  newRun(): void {
    this.seed = randomSeed();
    this.startGalaxy();
    this.recorder.reset();
    this.chronicle.clear();
    this.time.resting = false;
    this.time.mode = 'odyssey';
    this.time.paused = false;
    this.time.seekStory(this.time.odyssey.span(0).s1 - 0.3);
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
      if (st instanceof CodaStage) st.source = this.recorder;
      this.stages.set(name, st);
    }
    st.ensureBuilt();
    return st;
  }

  private showCard(ch: number): void {
    if (this.link.nocard) return;
    const m = chapterById(ch);
    if (!m.cardLine) return;
    const turn = ch === 7 || ch === 8 || ch === 9;
    this.card.show(m.cardDate, m.cardLine, ch === 0 ? 6.5 : turn ? 6.4 : 5.2, turn);
    this.cardShownFor = ch;
  }

  private cueTimes = new Map<string, number>();
  fireCue(id: string, x?: number): void {
    const last = this.cueTimes.get(id) ?? -1e9;
    if (this.clock - last < 0.25) return;
    this.cueTimes.set(id, this.clock);
    this.audio?.cue(id, x);
    if (id === 'impact' || id === 'nuke' || id === 'supernova') this.flashEnv = id === 'nuke' ? 0.6 : 1;
    if (id === 'lastlight') this.silenceUntil = this.clock + 2.8;
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
    dt = clamp(dt, 0, this.link.capture ? 1.0 : 0.1);
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
      // the takeover and first contact begin with a clean page
      if (chapter === 8 || chapter === 9 || chapter === 10) this.chronicle.retire();
      this.lastChapter = chapter;
    }
    // chapter cards (Odyssey): shortly after the chapter begins
    if (this.time.mode === 'odyssey' && this.cardShownFor !== chapter) {
      // after the black beats (the Singularity, first contact) and the rupture (the takeover), later
      const delay = chapter === 0 ? 2.2 : chapter === 7 ? 2.6 : chapter === 9 ? 2.2 : chapter === 8 ? 1.5 : 0.7;
      if (s - span.s0 > delay && s - span.s0 < delay + 2) this.showCard(chapter);
    }

    // local-rule agents for this chapter (worker)
    const chDef = CHAPTER_DEFS[chapter];
    const simSpec = typeof chDef?.sim === 'function' ? chDef.sim(T) : chDef?.sim;
    if (simSpec) {
      const tierMax = this.renderer.quality.tier === 'low' ? 1200 : this.renderer.quality.tier === 'medium' ? 1900 : 2600;
      this.sims.maxAgents = simSpec.id === 'creatures' ? Math.round(tierMax / 17) : tierMax;
      this.sims.update(simSpec.id, simSpec.fate, this.seed, T, dt, this.lodMix, this.time.speed);
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
      victor: this.victor,
      seed: this.seed,
      galaxy: this.galaxy,
      freshStage: false,
      agents: this.sims.latest,
      cue: (id, x) => this.fireCue(id, x),
    };
    // the beat engine: builds, inhales, hits, ruptures, dated lines
    this.drama.update({ s, T, mode: this.time.mode, dt, paused: this.time.paused || this.phase !== 'running' }, this.director, this.time.odyssey);
    // text hygiene: the page clears a second before each chapter turn and stays clear through its card
    if (this.time.mode === 'odyssey' && chapter < 10) {
      const next = this.time.odyssey.span(Math.min(10, chapter + 1));
      if (next.s0 - s < 1.0 && next.s0 - s > 0 && this.quietUntilS < next.s0) {
        this.chronicle.retire();
        // through the whole card of a great turn (black + card), through the first beat of the others
        this.quietUntilS = next.s0 + (chapter + 1 === 7 ? 8.6 : chapter + 1 === 9 ? 8.2 : chapter + 1 === 8 ? 7.4 : 2.4);
      }
    }
    this.flushLines();
    // sim-time cues of this chapter (fire when crossed forward)
    for (const c of chDef?.cues ?? []) if (this.lastT < c.T && T >= c.T && T - this.lastT < 5e8) this.fireCue(c.id);

    const out = this.director.update(f);
    this.lastOut = out;
    this.renderLayers(f, out);

    // UI
    this.card.update(dt);
    const codaC = this.updateCoda(chapter, s, T);
    // at the takeover, the fork control surfaces on its own for a few seconds
    if (this.lastT < TAKEOVER_T && T >= TAKEOVER_T && T - this.lastT < 1e4) this.forkShownUntil = this.clock + 14;
    this.hud.forkVisible = this.clock < this.forkShownUntil && this.clock > this.forkShownUntil - 6 && chapter === 8;
    if (codaC < 0) this.feedChronicle(T, dt);
    this.chronicle.update(dt);
    this.time.frontier = this.galaxy.done ? Infinity : Math.max(TAKEOVER_T, this.galaxy.frontier);
    const total = this.time.odyssey.total;
    const hudShown = this.hud.root.classList.contains('show');
    this.timeline.interactive = hudShown;
    if (codaC >= CODA.ring - 0.5) this.timeline.opacity = smoothstep(CODA.ring - 0.5, CODA.ring + 0.8, codaC);
    else if (codaC >= 0) this.timeline.opacity = 0;
    else this.timeline.opacity = damp(this.timeline.opacity, hudShown ? 1 : 0, 4, dt);
    this.timeline.update(s / total, this.galaxy.done ? null : this.time.odyssey.s(Math.max(TAKEOVER_T, this.galaxy.frontier)) / total);
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
      if (chapter === 8 || chapter === 9) this.hints.tension = Math.max(this.contestTension(T), this.drama.tension);
      this.hints.ice = f.world.ice;
      // the story state each chapter's score responds to
      const w = f.world;
      this.hints.biolum = smoothstep(-6.2e8, -5.3e8, T);
      this.hints.dread = Math.max(this.drama.tension, smoothstep(-2.6e8, -2.52e8, T) * (1 - smoothstep(-2.5e8, -2.4e8, T)));
      this.hints.winter = this.drama.aftermath;
      this.hints.fire = smoothstep(-1.3e6, -0.9e6, T);
      this.hints.plague = smoothstep(-681, -679, T) * (1 - smoothstep(-672, -655, T));
      this.hints.industry = smoothstep(-230, -40, T);
      this.hints.human = chapter === 7 ? w.humanLights : 1;
      this.hints.ai = chapter === 7 ? Math.min(1, Math.max(w.datacenters * 0.25, w.lattice / 0.4)) : 0;
      // the heartbeat: from the moment it stopped asking to the last human light, quickening
      const beating = chapter === 7 && T >= 8 && T < LAST_LIGHT_T;
      this.hints.heart = beating ? smoothstep(8, 9.2, T) * (0.6 + 0.4 * smoothstep(12, LAST_LIGHT_T, T)) : 0;
      this.hints.heartRate = 54 + 64 * smoothstep(8, LAST_LIGHT_T, T);
      this.audio.update({
        chapter,
        chapterU,
        T,
        speed: this.time.speed,
        dt,
        lodMix: this.lodMix,
        hints: this.hints,
        music: this.clock < this.silenceUntil ? 0 : (this.audioOverride.music ?? 1) * this.drama.duck,
        bed: this.drama.bed,
        toneDb: this.audioOverride.toneDb ?? (chapter === 0 ? -40 : -52),
        chord: this.audioOverride.chord ?? 0,
      });
    }
    this.recorder.maybeCapture(this.renderer.canvas, s, T, chapter, this.phase === 'running' && chapter < 10);
    this.lastT = T;

    if (!this.ready) {
      this.readyFrames++;
      const galaxyPending = this.link.capture && this.time.chapter >= 8 && !this.galaxy.done;
      if (this.readyFrames >= this.link.warm && !this.pendingSeek && !galaxyPending) this.ready = true;
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
      st.applyPose(this.shaken(layer.pose), aspect);
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
    fx.uGlitch.value = this.drama.glitch * (this.reducedFlash ? 0.4 : 1);
    this.flashEnv *= Math.exp(-f.dt * 3.5);
    fx.uFlash.value = this.reducedFlash ? Math.min(this.flashEnv, 0.18) * 0.5 : this.flashEnv * 3.0;
    (fx.uFlashColor.value as THREE.Color).setRGB(1.0, 0.92, 0.8);
    fx.uAspect.value = aspect;
    fx.uBlurDir.value.set(out.blur[0], out.blur[1]);
    const pa = out.a?.pose;
    if (pa) {
      const focus = pa.focus ?? 10;
      fx.uFocus.value = focus;
      fx.uFocalLength.value = Math.max(0.05, focus * 0.6);
      fx.uBokeh.value = Math.min(1, (pa.aperture ?? 0) * 1.0);
    }
    fx.render();
  }

  stageFade = 1;
  private flashEnv = 0;
  private silenceUntil = -1;
  private lastChronT = -1e12;
  private forkShownUntil = -1;
  private lastOut: DirectorOut | null = null;
  private drama!: DramaEngine;
  /** text hygiene: one line at a time, each on screen long enough to be read */
  private lineQueue: { date: string; text: string; at: number }[] = [];
  private lineShownAt = -1e9;
  private lineMinLife = 0;
  private quietUntilS = -1;
  private epithets: string[] = [];
  /** what the drama engine did, in story time (for the pacing review) */
  private dramaLog: { s: number; kind: string; what: string }[] = [];
  /** Coda */
  readonly victor = new THREE.Color(1, 1, 1);
  private victorHex = '#ffffff';
  private sparkSaved = false;
  private counter: HTMLDivElement | null = null;
  /** capture mode: frames still allowed to advance time after ready */
  private runFrames = 0;

  /** queue a dated line: it waits until the previous line has been readable, and is dropped if it waits too long */
  private say(date: string, text: string, from: 'drama' | 'contest'): void {
    this.lineQueue.push({ date, text, at: this.clock });
    this.dramaLog.push({ s: this.time.storyTime, kind: 'line', what: (date ? date + '. ' : '') + text + (from === 'contest' ? ' (chronicle)' : '') });
    this.flushLines();
  }

  private flushLines(): void {
    const s = this.time.mode === 'odyssey' ? this.time.storyTime : -1;
    this.lineQueue = this.lineQueue.filter((l) => this.clock - l.at < 2.6);
    if (!this.lineQueue.length) return;
    if (s >= 0 && s < this.quietUntilS) return;
    if (this.clock - this.lineShownAt < this.lineMinLife) return;
    const l = this.lineQueue.shift()!;
    const words = (l.date + ' ' + l.text).split(/\s+/).length;
    this.chronicle.retire();
    this.chronicle.push(l.date ? l.date + '.' : '', (l.date ? ' ' : '') + l.text, Math.max(4.2, 1.5 + 0.3 * words + 2.2));
    this.lineShownAt = this.clock;
    this.lineMinLife = 1.5 + 0.3 * words;
  }

  /** the camera trembles through a build and kicks on a hit (a translation, scaled to the framing) */
  private shaken(pose: CamPose): CamPose {
    const a = this.drama.shake;
    if (a < 0.002) return pose;
    const t = this.clock;
    const d = pose.pos.distanceTo(pose.target) * 0.011 * a;
    const off = new THREE.Vector3(
      Math.sin(t * 37.1) * 0.6 + Math.sin(t * 61.7 + 1.3) * 0.4,
      Math.sin(t * 43.3 + 2.1) * 0.6 + Math.sin(t * 71.9 + 0.4) * 0.4,
      Math.sin(t * 29.3 + 4.2) * 0.5,
    ).multiplyScalar(d);
    return { ...pose, pos: pose.pos.clone().add(off), target: pose.target.clone().add(off.clone().multiplyScalar(0.4)) };
  }

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
        galaxyDone: this.galaxy.done,
        frontier: this.galaxy.frontier,
        layers: this.lastOut ? { a: this.lastOut.a?.shot.def.id ?? null, b: this.lastOut.b?.shot.def.id ?? null, mix: this.lastOut.mix, mode: this.lastOut.mixMode, fade: this.lastOut.fade, blur: this.lastOut.blur } : null,
        post: { exposure: this.postfx?.uExposure.value, exposureB: this.postfx?.uExposureB.value, fade: this.postfx?.uFade.value, mix: this.postfx?.uMix.value, mode: this.postfx?.uMixMode.value, stageFade: this.stageFade },
        changes: this.galaxy.nChanges,
        outcome: this.galaxy.result?.outcome ?? null,
        drama: { duck: this.drama.duck, shake: this.drama.shake, glitch: this.drama.glitch, tension: this.drama.tension },
      }),
      dramaLog: () => this.dramaLog.slice(),
      dramaTimeline: () => this.drama.timeline(),
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
    // diagnostics in capture mode only
    if (this.link.capture) (window as unknown as { __deeptimeApp: App }).__deeptimeApp = this;
  }
}
