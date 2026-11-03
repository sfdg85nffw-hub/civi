import { Rng, hash32 } from '../core/rng';
import { buildUniverse, nodePos, galaxyCenter, KPC_LY, REGION_NAMES, GALAXY_NAMES, GAL, COLLISION_T, MERGED_T, CLOUDS_MERGE_T, type Universe } from './universe';
import { HEIR, RIVALS, rollGenome, goalCompat, mixColorsOklab, type Genome, type Visual, type FactionArchetype } from './factions';
import { TEMPLATES, fillTemplate, formatAge } from './chronicle';

/**
 * REGIME B — the galactic contest.
 *
 * A seeded, chaotic, deterministic strategy simulation on the Local Group
 * graph. Every faction acts on stale knowledge: what it believes about a rival
 * is that rival's state one light-travel-time ago. Ownership changes are
 * logged so the renderer can reconstruct the galaxy at any moment, and full
 * checkpoints (with state hashes) are kept for rewinding and for tests.
 */
export const TAKEOVER = 50;
export const T_MAX = 2.6e10;
const C_KPC = 1 / KPC_LY; // kpc per year
const FMAX = 12;
const DT_ACTIVE = 4000;
const DEC_ACTIVE = 40000;
const TAU_S = 1.5e6; // strength regeneration
const TAU_DEV = 4e7; // megastructure build-out
const CHECK_EVERY = 16384;
/** the chronicle stays terse: repeats of a line for the same parties are muted for this long */
const REPEAT_GAP: Record<string, number> = { rkv: 8e8, rkvMiss: 8e8, war: 3e8, supernova: 6e8, laser: 1e12, contactLight: 1e12, contactTouch: 1e12, lostProbes: 1e12, treaty: 5e8, betrayal: 5e8 };

export type Outcome = 'victor' | 'merger' | 'annihilation' | 'vacuum';
export type FactionKind = 'heir' | 'native' | 'intruder' | 'ancient' | 'merged';

export const STAR = { NORMAL: 0, LIFTED: 1, MOVED: 2, REMNANT: 3, BLACKHOLE: 4, ERASED: 5 } as const;

export interface FactionInfo {
  id: number;
  name: string;
  color: [number, number, number];
  visual: Visual;
  motif: string;
  genome: Genome;
  kind: FactionKind;
  born: number;
  origin: number;
  members: number[];
  mergedInto: number;
  diedAt: number;
  darkAt: number;
  peakNodes: number;
}

export interface GEvent {
  t: number;
  /** chronicle/visual type */
  type: string;
  a: number;
  b: number;
  node: number;
  node2: number;
  /** end time for streaks/beams */
  t2: number;
  text: string;
  /** importance for the director, 0..1 */
  weight: number;
}

export interface Checkpoint {
  t: number;
  change: number;
  owner: Int8Array;
  star: Uint8Array;
  hash: number;
}

export interface HistoryResult {
  seed: number;
  factions: FactionInfo[];
  outcome: Outcome;
  victor: number;
  endT: number;
  spark: [number, number, number];
  ticks: number;
}

interface Snap {
  t: number;
  P: number;
  nodes: number;
  emission: number;
  core: number[];
}

interface Pending {
  t: number;
  kind: 'rkv' | 'laser' | 'arrive' | 'nova' | 'emerge' | 'milestone' | 'invade';
  a: number;
  b: number;
  node: number;
  src: number;
  k: number;
}

interface FState {
  info: FactionInfo;
  arche: FactionArchetype | null;
  g: Genome;
  alive: boolean;
  dark: boolean;
  revealed: boolean;
  v: number; // probe speed (fraction of c)
  tech: number;
  capMult: number;
  nodes: number;
  P: number;
  samples: number[];
  sampPos: Float64Array;
  core: number[];
  lastNode: number;
  lastLost: number;
  hist: Snap[];
  reinforce: number;
  cool: { rkv: number; laser: number; nova: number; mega: number; launch: number; invade: number };
  galN: Int32Array;
  firstMega: boolean;
  wentDarkEvent: number;
  launched: Set<number>;
  peakShare: number;
  maxNodes: number;
  emergeT: number;
}

const sst = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export class GalaxySim {
  readonly u: Universe;
  readonly seed: number;
  private rng: Rng;
  private chron: Rng;
  t = TAKEOVER;
  owner: Int8Array;
  star: Uint8Array;
  private S0: Float32Array;
  private tS: Float64Array;
  private tOwn: Float64Array;
  /** sterilised ground: nothing grows there again for a long time */
  private poison: Float64Array;
  private mass: Float32Array;
  private edgeLen: Float32Array;
  private active: Int32Array;
  private activeN = 0;
  private inActive: Uint8Array;
  private f: FState[] = [];
  private stance = new Int8Array(FMAX * FMAX);
  private known = new Uint8Array(FMAX * FMAX);
  private since = new Float64Array(FMAX * FMAX);
  private surprise = new Float64Array(FMAX * FMAX);
  /** mobilisation in each war: the bigger power brings more to bear, within limits */
  private mob = new Float32Array(FMAX * FMAX).fill(1);
  private truce = new Float64Array(FMAX * FMAX);
  /** total war: both sides aim at everything */
  private total = new Uint8Array(FMAX * FMAX);
  private lostLogged = new Uint8Array(FMAX * FMAX);
  /** frontier contacts between factions since the last decision */
  private contact = new Int32Array(FMAX * FMAX);
  private unownedGal = new Int32Array(5);
  private queue: Pending[] = [];
  private nextDecision = TAKEOVER;
  private lastActive = TAKEOVER;
  private activeSince = TAKEOVER;
  private stallT = 0;
  private stallSig = '';
  private colonised = 0;
  private fights = 0;
  // vacuum decay
  private vacT = -1;
  private vacOrder: Int32Array | null = null;
  private vacDist: Float32Array | null = null;
  private vacPtr = 0;
  private lastEmergence = 0;
  private dominantSince = -1;
  // outputs
  changeT: number[] = [];
  changeNode: number[] = [];
  changeOwner: number[] = [];
  changeStar: number[] = [];
  events: GEvent[] = [];
  checkpoints: Checkpoint[] = [];
  done = false;
  result: HistoryResult | null = null;
  ticks = 0;
  private lastText = new Map<string, number>();
  private tmpA: [number, number, number] = [0, 0, 0];
  private tmpB: [number, number, number] = [0, 0, 0];

  constructor(seed: number) {
    this.u = buildUniverse();
    this.seed = seed >>> 0;
    this.rng = Rng.stream(this.seed, 'galaxy');
    this.chron = Rng.stream(this.seed, 'chronicle');
    const n = this.u.n;
    this.owner = new Int8Array(n).fill(-1);
    this.star = new Uint8Array(n);
    this.S0 = new Float32Array(n);
    this.tS = new Float64Array(n);
    this.tOwn = new Float64Array(n);
    this.poison = new Float64Array(n);
    this.mass = Float32Array.from(this.u.mass);
    this.active = new Int32Array(n * 2);
    this.inActive = new Uint8Array(n);
    this.edgeLen = new Float32Array(this.u.nbr.length);
    for (let i = 0; i < n; i++)
      for (let e = this.u.nbrStart[i]!; e < this.u.nbrStart[i + 1]!; e++) {
        const j = this.u.nbr[e]!;
        this.edgeLen[e] = Math.max(0.05, Math.hypot(this.u.lx[i]! - this.u.lx[j]!, this.u.ly[i]! - this.u.ly[j]!, this.u.lz[i]! - this.u.lz[j]!));
      }
    for (let g = 0; g < 5; g++) this.unownedGal[g] = this.u.galCount[g]!;
    this.setup();
  }

  get factions(): FactionInfo[] {
    return this.f.map((s) => s.info);
  }

  // ------------------------------------------------------------------ setup

  private newFaction(arche: FactionArchetype | null, info: Omit<FactionInfo, 'id' | 'members' | 'mergedInto' | 'diedAt' | 'darkAt' | 'peakNodes'>, g: Genome, tech: number): FState {
    const id = this.f.length;
    const st: FState = {
      info: { ...info, id, members: [id], mergedInto: -1, diedAt: -1, darkAt: -1, peakNodes: 0 },
      arche,
      g,
      alive: true,
      dark: false,
      revealed: true,
      v: 0.08 + 0.4 * g.expansion,
      tech,
      capMult: 1,
      nodes: 0,
      P: 0,
      samples: [],
      sampPos: new Float64Array(0),
      core: [],
      lastNode: info.origin,
      lastLost: info.origin,
      hist: [],
      reinforce: 1,
      cool: { rkv: 0, laser: 0, nova: 0, mega: 0, launch: 0, invade: 0 },
      galN: new Int32Array(5),
      firstMega: false,
      wentDarkEvent: -1,
      launched: new Set(),
      peakShare: 0,
      maxNodes: g.goal === 'hide' && arche !== HEIR ? 260 + Math.floor(g.expansion * 400) : 1e9,
      emergeT: info.born,
    };
    st.capMult = (g.goal === 'compute' ? 1.15 : 1) * (g.goal === 'hide' ? 0.9 : 1) * (g.goal === 'aestheticize' ? 0.95 : 1);
    this.f.push(st);
    return st;
  }

  private setup(): void {
    const r = this.rng.fork('setup');
    const u = this.u;
    // the Heir: Earth's mind, at the Sun
    const hg = rollGenome(HEIR, r);
    const heir = this.newFaction(HEIR, { name: HEIR.name, color: HEIR.color, visual: HEIR.visual, motif: HEIR.motif, genome: hg, kind: 'heir', born: TAKEOVER, origin: u.sunNode }, hg, 1.0);
    heir.capMult *= 0.32; // everywhere, but thinly: outposts, not fortresses
    this.capture(u.sunNode, 0, TAKEOVER, 1.0);
    this.emit({ t: TAKEOVER + 2, type: 'launch', a: 0, b: -1, node: u.sunNode, node2: -1, t2: -1, weight: 0.6 }, {});

    // rivals: 3–6, emerging across the Local Group at seeded times
    const nR = r.int(3, 6);
    const pool = r.shuffle(RIVALS.slice());
    const times: number[] = [];
    times.push(r.range(1.02e9, 1.45e9));
    for (let k = 1; k < nR; k++) times.push(1.0e9 + Math.pow(r.next(), 1.6) * 6.5e9);
    times.sort((a, b) => a - b);
    let ancientUsed = false;
    for (let k = 0; k < nR; k++) {
      const a = pool[k]!;
      const g = rollGenome(a, r);
      const roll = r.next();
      let kind: FactionKind = 'native';
      let gal: number = GAL.MW;
      if (roll < 0.3) gal = GAL.MW;
      else if (roll < 0.42) gal = r.next() < 0.65 ? GAL.LMC : GAL.SMC;
      else if (roll < 0.66) gal = GAL.M31;
      else if (roll < 0.76) gal = GAL.M33;
      else {
        kind = 'intruder';
        gal = r.pick([GAL.MW, GAL.M31, GAL.M31, GAL.M33, GAL.MW]);
      }
      if (!ancientUsed && kind === 'native' && (g.goal === 'hide' || g.goal === 'observe' || g.stealth > 0.7) && r.next() < 0.6) {
        kind = 'ancient';
        ancientUsed = true;
      }
      // origin: far from the Sun for natives; on the rim for intruders
      const s0 = u.galStart[gal]!, c0 = u.galCount[gal]!;
      let origin = s0 + r.int(0, c0 - 1);
      for (let tries = 0; tries < 40; tries++) {
        const cand = s0 + r.int(0, c0 - 1);
        const rr = Math.hypot(u.lx[cand]!, u.lz[cand]!);
        const rim = gal === GAL.MW ? 12 : gal === GAL.M31 ? 15 : gal === GAL.M33 ? 5.5 : 2;
        const okR = kind === 'intruder' ? rr > rim : rr > 2;
        const farFromSun = gal !== GAL.MW || Math.hypot(u.lx[cand]! - u.lx[u.sunNode]!, u.lz[cand]! - u.lz[u.sunNode]!) > 9;
        if (okR && farFromSun) {
          origin = cand;
          break;
        }
      }
      const tech = kind === 'intruder' ? r.range(1.12, 1.45) : kind === 'ancient' ? r.range(1.1, 1.35) : r.range(0.98, 1.3);
      const born = kind === 'ancient' ? TAKEOVER : times[k]!;
      const st = this.newFaction(a, { name: a.name, color: a.color, visual: a.visual, motif: a.motif, genome: g, kind, born, origin }, g, tech);
      st.emergeT = times[k]!;
      st.alive = kind === 'ancient';
      if (kind === 'ancient') {
        // already here, small and dark: the Heir's probes will vanish at its edge
        st.dark = true;
        st.revealed = false;
        this.seize(st.info.id, origin, r.int(14, 30), TAKEOVER, 1.3);
      }
      this.push({ t: times[k]!, kind: 'emerge', a: st.info.id, b: -1, node: origin, src: -1, k: 0 });
      this.lastEmergence = Math.max(this.lastEmergence, times[k]!);
    }
    this.push({ t: CLOUDS_MERGE_T, kind: 'milestone', a: -1, b: -1, node: u.galStart[GAL.LMC]!, src: -1, k: 0 });
    this.push({ t: COLLISION_T, kind: 'milestone', a: -1, b: -1, node: u.galStart[GAL.M31]!, src: -1, k: 1 });
    this.push({ t: MERGED_T, kind: 'milestone', a: -1, b: -1, node: u.galStart[GAL.M31]!, src: -1, k: 2 });
    this.checkpoint();
  }

  // ------------------------------------------------------------- node state

  private cap(i: number, t: number, F: FState): number {
    const st = this.star[i]!;
    if (st === STAR.ERASED) return 0;
    const age = t > 2e10 ? 1 - 0.7 * sst(2e10, 6e10, t) : 1;
    const sm = st === STAR.LIFTED ? 1.5 : st === STAR.BLACKHOLE ? 2.2 : st === STAR.REMNANT ? 0.25 : age;
    const devMax = F.g.mega === 'dyson' ? 1.0 : F.g.mega === 'matrioshka' ? 0.9 : 0.75;
    const ageOwn = t - this.tOwn[i]!;
    const dev = ageOwn > 12 * TAU_DEV ? devMax : devMax * (1 - Math.exp(-ageOwn / TAU_DEV));
    return this.mass[i]! * (1 + 1.2 * dev) * sm * F.capMult * (F.dark ? 0.78 : 1);
  }

  getS(i: number, t: number): number {
    const o = this.owner[i]!;
    if (o < 0) return 0;
    const F = this.f[o]!;
    const c = this.cap(i, t, F);
    const dts = t - this.tS[i]!;
    if (dts > 14 * TAU_S) return c;
    const s0 = this.S0[i]!;
    return c - (c - s0) * Math.exp(-dts / TAU_S);
  }

  private setS(i: number, t: number, v: number): void {
    this.S0[i] = Math.max(0, v);
    this.tS[i] = t;
  }

  private logChange(i: number, o: number, t: number): void {
    this.changeT.push(t);
    this.changeNode.push(i);
    this.changeOwner.push(o);
    this.changeStar.push(this.star[i]!);
    if (this.changeT.length % CHECK_EVERY === 0) this.checkpoint();
  }

  private capture(i: number, o: number, t: number, s: number): void {
    const prev = this.owner[i]!;
    if (prev === o) return;
    const g = this.u.gal[i]!;
    const live = this.star[i] !== STAR.ERASED;
    if (prev >= 0) {
      this.f[prev]!.nodes--;
      this.f[prev]!.galN[g]!--;
    } else if (live) this.unownedGal[g]!--;
    if (o >= 0) {
      this.f[o]!.nodes++;
      this.f[o]!.galN[g]!++;
    } else if (live) this.unownedGal[g]!++;
    this.owner[i] = o;
    this.tOwn[i] = t;
    this.setS(i, t, s);
    if (o >= 0) this.f[o]!.lastNode = i;
    if (prev >= 0) this.f[prev]!.lastLost = i;
    this.logChange(i, o, t);
    this.touch(i);
  }

  /** mark i and its neighbours for frontier processing */
  private touch(i: number): void {
    const u = this.u;
    if (!this.inActive[i]) {
      this.inActive[i] = 1;
      this.active[this.activeN++] = i;
    }
    for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) {
      const j = u.nbr[e]!;
      if (!this.inActive[j] && this.owner[j]! >= 0) {
        this.inActive[j] = 1;
        this.active[this.activeN++] = j;
      }
    }
  }

  private isBoundary(i: number): boolean {
    const o = this.owner[i]!;
    if (o < 0) return false;
    const u = this.u;
    for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) {
      const j = u.nbr[e]!;
      const oj = this.owner[j]!;
      if (oj !== o && (oj >= 0 || this.star[j] !== STAR.ERASED)) return true;
    }
    return false;
  }

  /** take a blob of nodes around `origin` (emergence, reveals) */
  private seize(fid: number, origin: number, count: number, t: number, sMul: number): void {
    const u = this.u;
    const F = this.f[fid]!;
    const seen = new Set<number>([origin]);
    const q = [origin];
    let k = 0;
    while (q.length && k < count) {
      const i = q.shift()!;
      if (this.star[i] === STAR.ERASED) continue;
      this.capture(i, fid, t, this.cap(i, t, F) * sMul);
      k++;
      for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) {
        const j = u.nbr[e]!;
        if (!seen.has(j)) {
          seen.add(j);
          q.push(j);
        }
      }
    }
  }

  // ------------------------------------------------------------- events

  private push(p: Pending): void {
    let lo = 0, hi = this.queue.length;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (this.queue[m]!.t <= p.t) lo = m + 1;
      else hi = m;
    }
    this.queue.splice(lo, 0, p);
  }

  private name(id: number): string {
    return id >= 0 ? this.f[id]!.info.name : 'no one';
  }

  private place(node: number): string {
    return node >= 0 ? REGION_NAMES[this.u.region[node]!]! : 'the dark';
  }

  private emit(e: Omit<GEvent, 'text'>, vars: Record<string, string>, tplKey?: string): GEvent {
    const key = tplKey ?? e.type;
    const list = TEMPLATES[key];
    let text = '';
    const pairKey = key + ':' + e.a + ':' + e.b;
    const last = this.lastText.get(pairKey);
    const gap = REPEAT_GAP[key] ?? 0;
    const mute = last !== undefined && e.t - last < gap;
    if (list && list.length && !mute) {
      this.lastText.set(pairKey, e.t);
      const tpl = list[this.chron.int(0, list.length - 1)]!;
      text = fillTemplate(tpl, { A: this.name(e.a), B: this.name(e.b), P: this.place(e.node), ...vars });
    }
    const ev: GEvent = { ...e, text };
    this.events.push(ev);
    return ev;
  }

  // ------------------------------------------------------------- stepping

  /** Advance until done or until `budgetMs` elapses. */
  advance(budgetMs = Infinity, tLimit = T_MAX): void {
    const t0 = performance.now();
    while (!this.done && this.t < tLimit) {
      this.tick();
      if ((this.ticks & 63) === 0 && performance.now() - t0 > budgetMs) break;
    }
  }

  runToEnd(): HistoryResult {
    this.advance();
    return this.result!;
  }

  private tick(): void {
    const t = this.t;
    let dt: number;
    const activeNow = this.fights > 0 || this.colonised > 0 || this.vacT >= 0;
    if (activeNow) {
      if (t - this.lastActive > 5e6) this.activeSince = t;
      this.lastActive = t;
    }
    if (this.vacT >= 0) dt = 10000;
    else if (this.colonised > 30 || t < 2e7) dt = DT_ACTIVE;
    else if (activeNow || t - this.lastActive < 2e5) dt = Math.min(2e5, 20000 * (1 + (t - this.activeSince) / 3e7));
    else dt = Math.min(t > 2e9 ? 1e8 : 2e7, Math.max(DT_ACTIVE, (t - this.lastActive) * 0.25));
    const nextQ = this.queue.length ? this.queue[0]!.t : Infinity;
    if (nextQ > t && t + dt > nextQ) dt = Math.max(1, nextQ - t);
    if (t < TAKEOVER + 2000) dt = Math.min(dt, 200);
    this.colonised = 0;
    this.fights = 0;
    while (this.queue.length && this.queue[0]!.t <= t + dt) this.handle(this.queue.shift()!);
    this.frontier(t, dt);
    if (this.vacT >= 0) this.vacuumStep(t + dt);
    this.t = t + dt;
    this.ticks++;
    if (this.t >= this.nextDecision) {
      this.decide(this.t);
      this.nextDecision = this.t + DEC_ACTIVE;
    }
    if (this.t >= T_MAX && !this.done) this.finish('timeout');
  }

  private frontier(t: number, dt: number): void {
    const u = this.u;
    const r = this.rng;
    const end = this.activeN;
    let w = 0;
    for (let k = 0; k < end; k++) {
      const i = this.active[k]!;
      if (!this.isBoundary(i)) {
        this.inActive[i] = 0;
        continue;
      }
      this.active[w++] = i;
      const A = this.owner[i]!;
      const F = this.f[A]!;
      if (!F.alive) continue;
      const canGrow = F.nodes < F.maxNodes && F.revealed && !(F.g.goal === 'hide' && F.dark && F.info.id !== 0 && t > F.emergeT + 5e7);
      for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) {
        const j = u.nbr[e]!;
        const B = this.owner[j]!;
        if (B === A) continue;
        if (B < 0) {
          if (!canGrow || this.star[j] === STAR.ERASED || t < this.poison[j]!) continue;
          const p = 1 - Math.exp((-dt * F.v * C_KPC * (0.3 + 0.7 * F.g.expansion)) / this.edgeLen[e]!);
          if (r.next() < p) {
            this.capture(j, A, t, this.cap(j, t, F) * 0.15);
            this.colonised++;
          }
          continue;
        }
        const G = this.f[B]!;
        const ab = A * FMAX + B;
        this.contact[ab]!++;
        if (!this.known[ab]) {
          if (G.dark && !G.revealed) {
            // dark-forest silence: probes simply stop reporting
            if (!this.lostLogged[ab]) {
              this.lostLogged[ab] = 1;
              this.emit({ t, type: 'lostProbes', a: A, b: B, node: j, node2: -1, t2: -1, weight: 0.5 }, {});
            }
            continue;
          }
          if (!F.revealed) {
            this.known[ab] = 1;
            continue;
          }
          this.meet(A, B, t, j, 0);
        }
        if (this.stance[ab] === 2) this.combat(i, j, A, B, e, t, dt);
      }
    }
    // compact: survivors first, then nodes appended during this pass
    for (let k = end; k < this.activeN; k++) this.active[w++] = this.active[k]!;
    this.activeN = w;
  }

  /** fighting pressure a faction can bring through node i against faction B */
  private pressure(i: number, A: number, B: number, t: number, attacking: boolean): number {
    const F = this.f[A]!;
    const esc = t > 8e9 ? 1 + (t - 8e9) / 6e9 : 1;
    let p = this.getS(i, t) * F.tech * this.mob[A * FMAX + B]!;
    if (attacking) {
      p *= (this.surprise[A * FMAX + B]! > t ? 1.8 : 1) * Math.pow(esc, 0.3) * (0.75 + 0.5 * F.g.aggression);
    } else {
      p *= 1.1 * (F.g.goal === 'preserve' ? 1.3 : 1) * (F.g.mega === 'shkadov' ? 1.15 : 1);
    }
    return p;
  }

  /**
   * One contested edge, evaluated from A's side: A only advances if it out-presses
   * B here (B gets its own turn from the other side), so fronts move instead of churning.
   */
  private combat(i: number, j: number, A: number, B: number, e: number, t: number, dt: number): void {
    this.fights++;
    if (t - this.tOwn[j]! < Math.max(2e5, 3 * dt)) return; // a freshly taken system consolidates first
    const pa = this.pressure(i, A, B, t, true);
    const pb = this.pressure(j, B, A, t, false);
    if (pa <= pb) return;
    const net = pa - pb;
    const sj = this.getS(j, t);
    const left = sj - (dt * net) / 50000;
    if (left > 0) {
      this.setS(j, t, left);
      this.setS(i, t, this.getS(i, t) - (dt * pb) / 150000);
      return;
    }
    const F = this.f[A]!;
    const swallow = F.g.goal === 'convert' ? 0.12 * this.mass[j]! : 0;
    const si = this.getS(i, t);
    this.capture(j, A, t, Math.max(0.05, si * 0.5) + swallow);
    this.setS(i, t, si * 0.75);
    if (swallow) F.tech += 0.00003;
    void e;
  }

  private meet(A: number, B: number, t: number, node: number, age: number): void {
    const ab = A * FMAX + B, ba = B * FMAX + A;
    if (this.known[ab] && this.known[ba]) return;
    const first = !this.known[ab] && !this.known[ba];
    this.known[ab] = 1;
    this.known[ba] = 1;
    if (this.stance[ab] === 0) {
      this.stance[ab] = 1;
      this.stance[ba] = 1;
      this.since[ab] = this.since[ba] = t;
    }
    if (first) this.emit({ t, type: 'contact', a: A, b: B, node, node2: -1, t2: -1, weight: 0.55 }, { AGE: formatAge(age) }, age > 0 ? 'contactLight' : 'contactTouch');
  }

  private war(A: number, B: number, t: number, node: number, weight = 0.75): void {
    const ab = A * FMAX + B, ba = B * FMAX + A;
    if (this.stance[ab] === 2) return;
    this.stance[ab] = this.stance[ba] = 2;
    this.since[ab] = this.since[ba] = t;
    this.emit({ t, type: 'war', a: A, b: B, node, node2: -1, t2: -1, weight }, {});
  }

  private handle(p: Pending): void {
    const u = this.u;
    const t = p.t;
    switch (p.kind) {
      case 'emerge': {
        const F = this.f[p.a]!;
        if (F.info.kind === 'ancient') {
          F.dark = F.g.goal === 'hide' && F.g.stealth > 0.8;
          F.revealed = true;
          this.seize(p.a, p.node, 200 + Math.floor(F.g.expansion * 600), t, 1.4);
          this.emit({ t, type: 'reveal', a: p.a, b: -1, node: p.node, node2: -1, t2: -1, weight: 0.9 }, {});
        } else {
          F.alive = true;
          F.info.born = t;
          // an awakening takes the substrate around it, whoever seeded it
          const size = F.info.kind === 'intruder' ? 600 + Math.floor(this.rng.next() * 1400) : 300 + Math.floor(this.rng.next() * 900);
          this.seize(p.a, p.node, size, t, 1.5);
          const g = u.gal[p.node]!;
          if (F.info.kind === 'intruder') this.emit({ t, type: 'intrude', a: p.a, b: -1, node: p.node, node2: -1, t2: -1, weight: 0.95 }, { G: GALAXY_NAMES[g]! });
          else this.emit({ t, type: 'emerge', a: p.a, b: -1, node: p.node, node2: -1, t2: -1, weight: 0.95 }, {});
        }
        break;
      }
      case 'milestone': {
        const type = p.k === 0 ? 'clouds' : p.k === 1 ? 'andromeda' : 'merged';
        this.emit({ t, type, a: -1, b: -1, node: p.node, node2: -1, t2: -1, weight: p.k === 1 ? 0.9 : 0.5 }, {});
        break;
      }
      case 'arrive': {
        const F = this.f[p.a]!;
        if (!F.alive) break;
        const o = this.owner[p.node]!;
        const g = u.gal[p.node]!;
        if (o < 0 && this.star[p.node] !== STAR.ERASED) {
          this.capture(p.node, p.a, t, this.cap(p.node, t, F) * 0.4);
          let empty = true;
          for (let k = u.galStart[g]!; k < u.galStart[g]! + u.galCount[g]! && empty; k += 3) if (this.owner[k]! >= 0 && this.owner[k] !== p.a) empty = false;
          if (empty) this.emit({ t, type: 'reachGalaxy', a: p.a, b: -1, node: p.node, node2: -1, t2: -1, weight: p.a === 0 ? 0.7 : 0.4 }, { G: GALAXY_NAMES[g]! });
        } else if (o >= 0 && o !== p.a) {
          const G = this.f[o]!;
          if (G.dark && !G.revealed) {
            if (!this.lostLogged[p.a * FMAX + o]) {
              this.lostLogged[p.a * FMAX + o] = 1;
              this.emit({ t, type: 'lostProbes', a: p.a, b: o, node: p.node, node2: -1, t2: -1, weight: 0.5 }, {});
            }
          } else this.meet(p.a, o, t, p.node, 0);
        }
        F.launched.delete(g);
        break;
      }
      case 'invade': {
        const F = this.f[p.a]!;
        if (!F.alive) break;
        const o = this.owner[p.node]!;
        if (o >= 0 && o !== p.a && this.stance[p.a * FMAX + o] !== 2) break;
        // a beachhead: the fleet takes the system and its neighbours
        const G = o >= 0 ? this.f[o]! : null;
        const force = 1.6 * (G ? F.tech / G.tech : 1) * this.mob[p.a * FMAX + Math.max(0, o)]!;
        if (force > 0.9) this.seize(p.a, p.node, 4 + Math.floor(force * 6), t, 1.2);
        break;
      }
      case 'rkv':
      case 'laser': {
        const k = p.node;
        const o = this.owner[k]!;
        const intended = p.b;
        if (o >= 0) {
          // the strike hits whoever is there now
          const heavy = p.k === 99;
          this.blast(k, t, p.kind === 'rkv' ? (heavy ? 1.1 : 0.6) : 0.35, p.kind === 'rkv' ? (heavy ? 0.95 : 0.65) : 0.4, heavy ? 3e9 : 0);
          if (o !== intended && o !== p.a) {
            if (p.kind === 'rkv' && this.rng.next() < 0.5) this.emit({ t, type: 'rkvMiss', a: p.a, b: intended, node: k, node2: -1, t2: -1, weight: 0.6 }, { C: this.name(o) }, 'rkvMiss');
            const so = this.stance[p.a * FMAX + o];
            if (so !== 2) this.war(o, p.a, t, k, 0.6);
          }
        } else if (p.kind === 'rkv' && intended >= 0 && this.rng.next() < 0.25) {
          this.emit({ t, type: 'rkvMiss', a: p.a, b: intended, node: k, node2: -1, t2: -1, weight: 0.55 }, { C: 'no one' }, 'rkvMiss');
        }
        break;
      }
      case 'nova': {
        const k = p.node;
        this.star[k] = STAR.REMNANT;
        this.mass[k] = this.mass[k]! * 0.25;
        this.blast(k, t, 0.75, 0.85);
        this.logChange(k, this.owner[k]!, t); // star-state change marker
        break;
      }
    }
  }

  /** sterilise around node k (radius in kpc) */
  private blast(k: number, t: number, radius: number, pKill: number, poison = 0): void {
    const u = this.u;
    const seen = new Set<number>([k]);
    const q = [k];
    const kx = u.lx[k]!, ky = u.ly[k]!, kz = u.lz[k]!;
    while (q.length) {
      const i = q.shift()!;
      const d = Math.hypot(u.lx[i]! - kx, u.ly[i]! - ky, u.lz[i]! - kz);
      if (d > radius) continue;
      const o = this.owner[i]!;
      if (o >= 0) {
        if (this.rng.next() < pKill * (1 - d / (radius * 1.4))) {
          this.capture(i, -1, t, 0);
          if (poison) this.poison[i] = t + poison;
        } else {
          this.setS(i, t, 0);
          this.tOwn[i] = t;
        }
      }
      for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) {
        const j = u.nbr[e]!;
        if (!seen.has(j)) {
          seen.add(j);
          q.push(j);
        }
      }
    }
  }

  // ------------------------------------------------------------- strategy

  /**
   * Census for strategy. Node counts are exact (kept incrementally); power,
   * samples and the "core" are estimated from a rotating quarter of the nodes.
   */
  private scanOff = 0;
  private scan(t: number): void {
    const u = this.u;
    const nF = this.f.length;
    const P = new Float64Array(nF), seen = new Int32Array(nF);
    const samp: number[][] = Array.from({ length: nF }, () => []);
    const coreS: number[][] = Array.from({ length: nF }, () => []);
    const core: number[][] = Array.from({ length: nF }, () => []);
    const r = this.rng;
    for (let i = this.scanOff; i < u.n; i += 4) {
      const o = this.owner[i]!;
      if (o < 0) continue;
      const s = this.getS(i, t);
      seen[o]!++;
      P[o]! += s;
      const sm = samp[o]!;
      if (sm.length < 24) sm.push(i);
      else {
        const k = Math.floor(r.next() * seen[o]!);
        if (k < 24) sm[k] = i;
      }
      const cs = coreS[o]!, cc = core[o]!;
      if (cs.length < 8) {
        cs.push(s);
        cc.push(i);
      } else {
        let mi = 0;
        for (let k = 1; k < 8; k++) if (cs[k]! < cs[mi]!) mi = k;
        if (s > cs[mi]!) {
          cs[mi] = s;
          cc[mi] = i;
        }
      }
    }
    this.scanOff = (this.scanOff + 1) & 3;
    let total = 0;
    for (let k = 0; k < nF; k++) total += this.f[k]!.nodes;
    for (let k = 0; k < nF; k++) {
      const F = this.f[k]!;
      // small factions may be missed by a quarter sample: fall back to their known nodes
      if (F.nodes > 0 && seen[k] === 0) {
        for (let i = 0; i < u.n && samp[k]!.length < 8; i++) if (this.owner[i] === k) {
          samp[k]!.push(i);
          core[k]!.push(i);
          P[k]! += this.getS(i, t) / 4;
        }
      }
      F.P = P[k]! * 4;
      F.samples = samp[k]!;
      const sp = new Float64Array(F.samples.length * 3);
      F.samples.forEach((i, q) => {
        const p = nodePos(u, i, t, this.tmpA);
        sp[q * 3] = p[0];
        sp[q * 3 + 1] = p[1];
        sp[q * 3 + 2] = p[2];
      });
      F.sampPos = sp;
      F.core = core[k]!;
      F.info.peakNodes = Math.max(F.info.peakNodes, F.nodes);
      if (total > 0) F.peakShare = Math.max(F.peakShare, F.nodes / total);
      F.hist.push({ t, P: F.P, nodes: F.nodes, emission: F.dark ? 0.12 : 1, core: F.core.slice() });
      if (F.hist.length > 900) F.hist.splice(0, 300);
    }
  }

  /** what A can know of B: B as it was one light-travel-time ago */
  private belief(A: number, B: number, t: number): { snap: Snap | null; delay: number } {
    const delay = this.delay(A, B, t);
    const h = this.f[B]!.hist;
    const tt = t - delay;
    let lo = 0, hi = h.length - 1, best = -1;
    while (lo <= hi) {
      const m = (lo + hi) >> 1;
      if (h[m]!.t <= tt) {
        best = m;
        lo = m + 1;
      } else hi = m - 1;
    }
    return { snap: best >= 0 ? h[best]! : null, delay };
  }

  private delay(A: number, B: number, t: number): number {
    const sa = this.f[A]!.sampPos, sb = this.f[B]!.sampPos;
    if (!sa.length || !sb.length) return 1e6;
    let best = Infinity;
    for (let i = 0; i < sa.length; i += 3)
      for (let j = 0; j < sb.length; j += 3) {
        const d = (sa[i]! - sb[j]!) ** 2 + (sa[i + 1]! - sb[j + 1]!) ** 2 + (sa[i + 2]! - sb[j + 2]!) ** 2;
        if (d < best) best = d;
      }
    void t;
    return Math.sqrt(best) * KPC_LY;
  }

  private dist(i: number, j: number, t: number): number {
    const p = nodePos(this.u, i, t, this.tmpA);
    const q = nodePos(this.u, j, t, this.tmpB);
    return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  }

  private decide(t: number): void {
    this.scan(t);
    const nF = this.f.length;
    const r = this.rng;
    const esc = t > 8e9 ? 1 + (t - 8e9) / 6e9 : 1;
    let totalP = 0, totalN = 0;
    for (const F of this.f) if (F.alive) {
      totalP += F.P;
      totalN += F.nodes;
    }
    // frontier pressure → reinforcement (big empires concentrate force, within limits)
    const front = new Int32Array(nF);
    for (let k = 0; k < this.activeN; k++) {
      const i = this.active[k]!;
      const o = this.owner[i]!;
      if (o >= 0) front[o]!++;
    }
    for (let a = 0; a < nF; a++) {
      const F = this.f[a]!;
      if (!F.alive) continue;
      const meanCap = F.nodes ? F.P / F.nodes : 1;
      for (let b = 0; b < nF; b++) {
        const G = this.f[b]!;
        // the endgame grows decisive: power ratios matter more as the stars age
        const ex = 0.22 + 0.5 * sst(1.2e10, 2.4e10, t);
        this.mob[a * FMAX + b] = b === a || !G.alive ? 1 : Math.min(4, Math.max(0.4, Math.pow(F.P / Math.max(1e-3, G.P), ex)));
      }
      void meanCap;
      // deaths
      if (F.nodes === 0 && F.revealed && t > F.emergeT + 1e5) {
        F.alive = false;
        F.info.diedAt = t;
        if (F.info.mergedInto < 0) this.emit({ t, type: 'extinct', a: -1, b: a, node: F.lastLost, node2: -1, t2: -1, weight: 0.85 }, {});
        continue;
      }
      // tech creeps upward with accumulated compute
      F.tech += (t - (F.hist.length > 1 ? F.hist[F.hist.length - 2]!.t : t)) * 1.2e-10 / F.tech ** 3 * (F.g.mega === 'matrioshka' ? 1.6 : 1) * (F.g.goal === 'compute' ? 1.3 : 1);
    }

    for (let a = 0; a < nF; a++) {
      const F = this.f[a]!;
      if (!F.alive || !F.revealed || F.nodes === 0) continue;
      // light: rivals become known when their light arrives
      for (let b = 0; b < nF; b++) {
        if (b === a) continue;
        const G = this.f[b]!;
        if (!G.alive || G.nodes === 0 || this.known[a * FMAX + b]) continue;
        if (G.dark && !G.revealed) continue;
        const d = this.delay(a, b, t);
        if (!G.dark && t - G.info.born >= d) this.meet(a, b, t, G.info.origin, d);
      }
      // ---- relations
      for (let b = 0; b < nF; b++) {
        if (b === a) continue;
        const G = this.f[b]!;
        const ab = a * FMAX + b, ba = b * FMAX + a;
        if (!G.alive || !this.known[ab]) continue;
        const { snap, delay } = this.belief(a, b, t);
        if (!snap) continue;
        const deceive = G.g.deception > 0.6 ? (G.g.aggression > 0.5 ? 0.6 : 1.5) : 1;
        const Pb = snap.P * snap.emission * deceive + 1e-6;
        const ratio = F.P / Pb;
        const stance = this.stance[ab];
        const compat = goalCompat(F.g.goal, G.g.goal);
        if (stance === 1) {
          const fear = Math.min(1, Math.max(0, (1 / ratio - 0.6) / 1.5));
          const greed = Math.min(1, ratio / 3);
          const peace = F.g.cooperation * 0.35 + compat * 0.25 + (F.g.goal === 'preserve' ? 0.25 : F.g.goal === 'observe' ? 0.3 : F.g.goal === 'hide' ? 0.35 : 0);
          const desire = F.g.aggression * esc * (0.55 * greed + 0.45) + (1 - F.g.risk) * fear * (1 - F.g.cooperation) * 0.8 - peace;
          if (t > this.truce[ab]! && r.next() < Math.max(0, desire - 0.2) * 0.12) this.war(a, b, t, F.lastNode, 0.8);
          else if (F.g.cooperation > 0.5 && G.g.cooperation > 0.45 && compat > 0.4 && r.next() < 0.015 * (F.g.cooperation + G.g.cooperation)) {
            this.stance[ab] = this.stance[ba] = 3;
            this.since[ab] = this.since[ba] = t;
            this.emit({ t, type: 'treaty', a, b, node: F.lastNode, node2: -1, t2: -1, weight: 0.65 }, {});
          }
        } else if (stance === 3) {
          // value merging, or betrayal
          if (t - this.since[ab]! > 4e7 && F.g.cooperation > 0.62 && G.g.cooperation > 0.62 && compat > 0.6 && r.next() < 0.03) {
            this.merge(a, b, t);
            return;
          }
          // late in the game, unequal partners do not stay partners
          if (t > 6e9 && ratio > 4 && r.next() < 0.015 * esc) {
            if (F.g.cooperation > 0.4 && G.g.cooperation > 0.3) {
              this.merge(a, b, t);
              return;
            }
            this.stance[ab] = this.stance[ba] = 2;
            this.surprise[ab] = t + 3e5;
            this.emit({ t, type: 'betrayal', a, b, node: F.lastNode, node2: -1, t2: -1, weight: 0.9 }, {});
            continue;
          }
          if (F.g.deception > 0.55 && F.g.aggression > 0.45 && ratio > 1.4 && r.next() < 0.01 * esc) {
            this.stance[ab] = this.stance[ba] = 2;
            this.surprise[ab] = t + 3e5;
            this.emit({ t, type: 'betrayal', a, b, node: F.lastNode, node2: -1, t2: -1, weight: 0.9 }, {});
          }
        } else if (stance === 2) {
          // war-weariness → armistice for the cautious, and for anyone after long stalemates
          const long = t - this.since[ab]!;
          if ((F.g.cooperation > 0.55 && ratio < 0.8 && G.g.cooperation > 0.4 && r.next() < 0.01) || (long > 3e7 && r.next() < 0.01 * (long / 3e7) * (0.3 + F.g.cooperation))) {
            this.stance[ab] = this.stance[ba] = 1;
            this.since[ab] = this.since[ba] = t;
            this.truce[ab] = this.truce[ba] = t + r.range(5e7, 3e8) / esc;
          }
          this.strikes(a, b, t, snap, delay);
          // escalation to total war between two great, reckless powers
          const shareA = totalN ? F.nodes / totalN : 0, shareB = totalN ? G.nodes / totalN : 0;
          if (!this.total[ab] && long > 5e6 && F.g.aggression > 0.55 && F.g.risk > 0.55 && shareA > 0.18 && shareB > 0.18 && r.next() < 0.02) {
            this.total[ab] = this.total[ba] = 1;
            this.emit({ t, type: 'totalWar', a, b, node: F.lastNode, node2: G.lastNode, t2: -1, weight: 0.95 }, {});
          }
          if (this.total[ab]) this.saturate(a, b, t);
        }
      }
      // ---- going dark
      if (!F.dark && F.g.stealth > 0.55 && t > F.info.born + 2e6) {
        let threat = 0;
        for (let b = 0; b < nF; b++) if (b !== a && this.f[b]!.alive && this.stance[a * FMAX + b] === 2) threat += this.f[b]!.P;
        if ((F.g.goal === 'hide' || threat > F.P * 0.8) && r.next() < 0.08) {
          F.dark = true;
          F.info.darkAt = t;
          const ev = this.emit({ t, type: 'dark', a, b: -1, node: F.lastNode, node2: -1, t2: -1, weight: 0.7 }, {});
          F.wentDarkEvent = this.events.indexOf(ev);
        }
      }
      // ---- megastructures
      this.build(a, t);
      // ---- reaching other galaxies
      if ((a === 0 || (F.g.goal !== 'hide' && F.g.expansion > 0.2)) && t >= F.cool.launch) this.launch(a, t);
      // ---- the doomsday branch
      if (this.vacT < 0) {
        const share = totalN ? F.nodes / totalN : 0;
        const desperate = F.peakShare > 0.2 && share < 0.08 && F.g.risk > 0.65 && F.g.goal !== 'preserve';
        // hazards per year, integrated over the time since the last decision
        const span = F.hist.length > 1 ? t - F.hist[F.hist.length - 2]!.t : 0;
        let hz = desperate ? 4e-9 : 0;
        if (F.g.mega === 'blackhole' && F.nodes > 200) hz += 4e-12;
        if (hz > 0 && r.next() < 1 - Math.exp(-hz * span)) {
          this.vacuum(F.core[0] ?? F.lastNode, t);
          return;
        }
      }
    }
    this.checkOutcome(t, totalN);
    this.contact.fill(0);
    // stalemate detector: long wars that move nothing end in exhaustion
    if (t - this.stallT > 2e8) {
      const sig = this.f.map((F) => Math.round(F.nodes / 300)).join(',');
      if (sig === this.stallSig && this.fights > 0) {
        for (let a = 0; a < nF; a++)
          for (let b = 0; b < nF; b++)
            if (this.stance[a * FMAX + b] === 2) {
              this.stance[a * FMAX + b] = 1;
              this.total[a * FMAX + b] = 0;
              this.truce[a * FMAX + b] = t + r.range(5e8, 1.5e9);
            }
      }
      this.stallSig = sig;
      this.stallT = t;
    }
  }

  private strikes(a: number, b: number, t: number, snap: Snap, delay: number): void {
    const F = this.f[a]!;
    const r = this.rng;
    if (!F.samples.length) return;
    // no shared border: send an invasion fleet at what the light showed
    if (this.contact[a * FMAX + b] === 0 && this.contact[b * FMAX + a] === 0 && t >= F.cool.invade && snap.core.length && F.g.aggression > 0.3) {
      F.cool.invade = t + 6e6 / (0.4 + F.g.aggression);
      const tgt = snap.core[r.int(0, snap.core.length - 1)]!;
      let src = F.samples[0]!, bd = Infinity;
      for (const s2 of F.samples) {
        const d = this.dist(s2, tgt, t);
        if (d < bd) {
          bd = d;
          src = s2;
        }
      }
      const arr = t + (bd * KPC_LY) / F.v;
      this.push({ t: arr, kind: 'invade', a, b, node: tgt, src, k: 0 });
      this.events.push({ t, type: 'fleet', a, b, node: src, node2: tgt, t2: arr, text: '', weight: 0.4 });
    }
    // relativistic kill vehicles at stale coordinates
    if (t >= F.cool.rkv && F.g.aggression > 0.4 && snap.core.length && snap.emission > 0.5 && r.next() < 0.25 * F.g.aggression) {
      F.cool.rkv = t + 1.5e6 / (0.5 + F.g.aggression);
      const salvo = 2 + Math.floor(F.g.aggression * 4);
      const src = F.samples[0]!;
      let firstArr = 0;
      for (let k = 0; k < salvo; k++) {
        const tgt = snap.core[k % snap.core.length]!;
        const arr = t + (this.dist(src, tgt, t) * KPC_LY) / 0.92;
        firstArr = firstArr || arr;
        this.push({ t: arr, kind: 'rkv', a, b, node: tgt, src, k });
        this.events.push({ t, type: 'rkvTrail', a, b, node: src, node2: tgt, t2: arr, text: '', weight: 0.3 });
      }
      if (r.next() < 0.6) this.emit({ t, type: 'rkv', a, b, node: src, node2: snap.core[0]!, t2: firstArr, weight: 0.7 }, { AGE: formatAge(delay + 1) });
    }
    // Nicoll–Dyson beams: light-speed, short range
    if (F.g.mega === 'nicoll' && t >= F.cool.laser && snap.core.length && snap.emission > 0.3) {
      const src = F.samples[r.int(0, F.samples.length - 1)]!;
      let best = -1, bd = 7;
      for (const c of snap.core) {
        const d = this.dist(src, c, t);
        if (d < bd) {
          bd = d;
          best = c;
        }
      }
      if (best >= 0) {
        F.cool.laser = t + 4e5;
        const arr = t + bd * KPC_LY;
        this.push({ t: arr, kind: 'laser', a, b, node: best, src, k: 0 });
        const first = !F.firstMega;
        this.events.push({ t, type: 'beam', a, b, node: src, node2: best, t2: arr + 2e4, text: '', weight: 0.35 });
        if (first) {
          F.firstMega = true;
          this.emit({ t, type: 'laser', a, b, node: src, node2: best, t2: arr, weight: 0.8 }, {});
        }
      }
    }
    // triggered supernovae, for the reckless
    if (F.g.risk > 0.55 && F.g.aggression > 0.5 && t >= F.cool.nova && r.next() < 0.15) {
      // a node of B's that borders A, from what A can see locally
      let target = -1;
      for (let k = 0; k < this.activeN && target < 0; k += 7) {
        const i = this.active[k]!;
        if (this.owner[i] !== b) continue;
        const u = this.u;
        for (let e = u.nbrStart[i]!; e < u.nbrStart[i + 1]!; e++) if (this.owner[u.nbr[e]!] === a) target = i;
      }
      if (target >= 0 && this.star[target] === STAR.NORMAL) {
        F.cool.nova = t + 3e6;
        this.push({ t: t + 8000, kind: 'nova', a, b, node: target, src: -1, k: 0 });
        this.emit({ t: t + 8000, type: 'supernova', a, b, node: target, node2: -1, t2: t + 8000 + 4e5, weight: 0.85 }, {});
      }
    }
  }

  /** total war: saturation strikes on everything the enemy holds; the ground stays dead */
  private saturate(a: number, b: number, t: number): void {
    const F = this.f[a]!, G = this.f[b]!;
    const r = this.rng;
    if (!G.samples.length || !F.samples.length) return;
    for (let k = 0; k < 3; k++) {
      const tgt = G.samples[r.int(0, G.samples.length - 1)]!;
      const src = F.samples[r.int(0, F.samples.length - 1)]!;
      const arr = t + (this.dist(src, tgt, t) * KPC_LY) / 0.95;
      this.push({ t: arr, kind: 'rkv', a, b, node: tgt, src, k: 99 });
      this.events.push({ t, type: 'rkvTrail', a, b, node: src, node2: tgt, t2: arr, text: '', weight: 0.3 });
    }
  }

  private build(a: number, t: number): void {
    const F = this.f[a]!;
    const r = this.rng;
    if (t < F.cool.mega || F.nodes < 30 || t < F.info.born + 1e6) return;
    F.cool.mega = t + 5e6;
    const m = F.g.mega;
    const pickCore = (): number => (F.core.length ? F.core[r.int(0, F.core.length - 1)]! : -1);
    if (m === 'starlift' || m === 'blackhole' || m === 'shkadov') {
      const k = m === 'shkadov' ? F.samples[r.int(0, Math.max(0, F.samples.length - 1))] ?? -1 : pickCore();
      if (k < 0 || this.star[k] !== STAR.NORMAL) return;
      this.star[k] = m === 'starlift' ? STAR.LIFTED : m === 'blackhole' ? STAR.BLACKHOLE : STAR.MOVED;
      this.logChange(k, this.owner[k]!, t);
      const type = m === 'starlift' ? 'starlift' : m === 'blackhole' ? 'blackhole' : 'shkadov';
      const ev = { t, type: type + 'Site', a, b: -1, node: k, node2: -1, t2: t + 3e8, text: '', weight: 0.2 };
      this.events.push(ev);
      if (!F.firstMega) {
        F.firstMega = true;
        this.emit({ t, type, a, b: -1, node: k, node2: -1, t2: -1, weight: 0.6 }, {});
      }
    }
  }

  private launch(a: number, t: number): void {
    const F = this.f[a]!;
    const u = this.u;
    const r = this.rng;
    const held = F.galN;
    for (let g = 0; g < 5; g++) {
      if (held[g]! > 0 || F.launched.has(g) || this.unownedGal[g]! < 12) continue;
      // launch from the held galaxy nearest to g
      let src = -1, bd = Infinity;
      const cg = galaxyCenter(g, t, [0, 0, 0]);
      for (const s of F.samples) {
        const p = nodePos(u, s, t, this.tmpA);
        const d = (p[0] - cg[0]) ** 2 + (p[1] - cg[1]) ** 2 + (p[2] - cg[2]) ** 2;
        if (d < bd) {
          bd = d;
          src = s;
        }
      }
      if (src < 0 || F.nodes < 40) continue;
      // target: the nearest of a few random nodes of g
      const sp = nodePos(u, src, t, [0, 0, 0]);
      let tgt = -1, td = Infinity;
      for (let k = 0; k < 24; k++) {
        const c = u.galStart[g]! + r.int(0, u.galCount[g]! - 1);
        const p = nodePos(u, c, t, this.tmpB);
        const d = (p[0] - sp[0]) ** 2 + (p[1] - sp[1]) ** 2 + (p[2] - sp[2]) ** 2;
        if (d < td) {
          td = d;
          tgt = c;
        }
      }
      const arr = t + (Math.sqrt(td) * KPC_LY) / F.v;
      F.launched.add(g);
      this.push({ t: arr, kind: 'arrive', a, b: -1, node: tgt, src, k: g });
      this.events.push({ t, type: 'probes', a, b: -1, node: src, node2: tgt, t2: arr, text: '', weight: 0.3 });
    }
    F.cool.launch = t + (a === 0 && t < 1e8 ? 2e6 : 2e7);
  }

  private merge(a: number, b: number, t: number): void {
    const A = this.f[a]!, B = this.f[b]!;
    const w = A.P / Math.max(1e-6, A.P + B.P);
    const g: Genome = {
      expansion: (A.g.expansion + B.g.expansion) / 2,
      aggression: (A.g.aggression + B.g.aggression) / 2,
      risk: (A.g.risk + B.g.risk) / 2,
      stealth: (A.g.stealth + B.g.stealth) / 2,
      deception: (A.g.deception + B.g.deception) / 2,
      cooperation: Math.max(A.g.cooperation, B.g.cooperation),
      goal: w >= 0.5 ? A.g.goal : B.g.goal,
      mega: w >= 0.5 ? A.g.mega : B.g.mega,
    };
    if (this.f.length >= FMAX) return;
    const stem = (s: string): string => s.replace(/^the /, '');
    const nm = A.info.kind === 'merged' || B.info.kind === 'merged' ? 'the Concord' : `the ${stem(A.info.name)}-${stem(B.info.name)}`;
    const M = this.newFaction(null, {
      name: nm,
      color: mixColorsOklab(A.info.color, B.info.color, 1 - w),
      visual: w >= 0.5 ? A.info.visual : B.info.visual,
      motif: w >= 0.5 ? A.info.motif : B.info.motif,
      genome: g,
      kind: 'merged',
      born: t,
      origin: A.lastNode,
    }, g, Math.max(A.tech, B.tech));
    M.info.members = [...A.info.members, ...B.info.members];
    M.revealed = true;
    M.dark = A.dark && B.dark;
    M.emergeT = t;
    const m = M.info.id;
    this.emit({ t, type: 'merge', a, b, node: A.lastNode, node2: B.lastNode, t2: -1, weight: 0.95 }, {});
    for (let i = 0; i < this.u.n; i++) {
      const o = this.owner[i]!;
      if (o === a || o === b) {
        const s = this.getS(i, t);
        this.owner[i] = m;
        this.setS(i, t, s);
        this.logChange(i, m, t);
        M.nodes++;
        M.galN[this.u.gal[i]!]!++;
      }
    }
    // inherit relations
    for (let c = 0; c < this.f.length; c++) {
      if (c === m) continue;
      const sa = this.stance[a * FMAX + c]!, sb = this.stance[b * FMAX + c]!;
      const s = Math.max(sa, sb === 3 && sa === 2 ? 2 : sb);
      this.stance[m * FMAX + c] = this.stance[c * FMAX + m] = s;
      this.known[m * FMAX + c] = this.known[c * FMAX + m] = this.known[a * FMAX + c] | this.known[b * FMAX + c];
    }
    for (const F of [A, B]) {
      F.alive = false;
      F.info.mergedInto = m;
      F.info.diedAt = t;
      F.nodes = 0;
      F.galN.fill(0);
    }
    this.scan(t);
    for (let k = 0; k < this.u.n; k++) if (this.owner[k] === m) this.touch(k);
  }

  private vacuum(node: number, t: number): void {
    this.vacT = t;
    const u = this.u;
    const d = new Float32Array(u.n);
    const p0 = nodePos(u, node, t, [0, 0, 0]);
    for (let i = 0; i < u.n; i++) {
      const p = nodePos(u, i, t, this.tmpA);
      d[i] = Math.hypot(p[0] - p0[0], p[1] - p0[1], p[2] - p0[2]);
    }
    const order = new Int32Array(u.n);
    for (let i = 0; i < u.n; i++) order[i] = i;
    order.sort((x, y) => d[x]! - d[y]! || x - y);
    this.vacOrder = order;
    this.vacDist = d;
    this.vacPtr = 0;
    this.emit({ t, type: 'vacuum', a: this.owner[node]!, b: -1, node, node2: -1, t2: t + d[order[u.n - 1]!]! * KPC_LY, weight: 1 }, {});
  }

  private vacuumStep(t: number): void {
    const R = (t - this.vacT) * C_KPC;
    const order = this.vacOrder!, d = this.vacDist!;
    while (this.vacPtr < order.length && d[order[this.vacPtr]!]! <= R) {
      const i = order[this.vacPtr++]!;
      if (this.owner[i]! < 0) this.unownedGal[this.u.gal[i]!]!--;
      this.star[i] = STAR.ERASED;
      if (this.owner[i]! >= 0) this.capture(i, -1, t, 0);
      else this.logChange(i, -1, t);
    }
    if (this.vacPtr >= order.length) {
      for (const F of this.f) if (F.alive) {
        F.alive = false;
        F.info.diedAt = t;
      }
      this.finish('vacuum');
    }
  }

  private checkOutcome(t: number, totalN: number): void {
    if (this.vacT >= 0 || t < this.lastEmergence + 5e7) return;
    const alive = this.f.filter((F) => F.alive && F.nodes > 0);
    if (alive.length <= 1) {
      this.finish('decided');
      return;
    }
    // overwhelming, lasting dominance ends the contest (the rest are remnants)
    let top = 0;
    for (const F of alive) top = Math.max(top, F.nodes);
    if (totalN > 0 && top / totalN > 0.9) {
      if (this.dominantSince < 0) this.dominantSince = t;
      else if (t - this.dominantSince > 2e9) {
        this.finish('decided');
        return;
      }
    } else this.dominantSince = -1;
    if (totalN < this.u.n * 0.04) this.finish('ruin');
    void top;
  }

  private finish(why: 'decided' | 'ruin' | 'timeout' | 'vacuum'): void {
    if (this.done) return;
    this.done = true;
    this.checkpoint();
    const t = this.t;
    let outcome: Outcome;
    let victor = -1;
    if (why === 'vacuum') {
      outcome = 'vacuum';
    } else {
      // the strongest survivor; if none, the last to fall
      let best = -1, bn = 0;
      for (const F of this.f) if (F.alive && F.nodes > bn) {
        bn = F.nodes;
        best = F.info.id;
      }
      if (best < 0) {
        let lt = -1;
        for (const F of this.f) if (F.info.diedAt > lt && F.info.mergedInto < 0) {
          lt = F.info.diedAt;
          best = F.info.id;
        }
      }
      victor = best;
      const share = bn / this.u.n;
      const aliveCount = this.f.filter((F) => F.alive && F.nodes > 0).length;
      let owned = 0;
      for (let i = 0; i < this.u.n; i++) if (this.owner[i]! >= 0) owned++;
      if (why === 'ruin' || bn === 0 || owned < this.u.n * 0.3 || (why === 'timeout' && aliveCount > 1 && share < 0.5)) outcome = 'annihilation';
      else outcome = this.f[victor]!.info.kind === 'merged' ? 'merger' : 'victor';
    }
    // retroactive chronicle: those who went dark and never spoke again
    for (const F of this.f) {
      if (F.wentDarkEvent >= 0 && F.dark) {
        const ev = this.events[F.wentDarkEvent]!;
        ev.type = 'silent';
        ev.text = fillTemplate(TEMPLATES.silent![0]!, { A: F.info.name, P: this.place(ev.node) });
      }
    }
    let spark: [number, number, number] = [1, 1, 1];
    if (outcome !== 'vacuum' && victor >= 0) {
      const c = this.f[victor]!.info.color;
      spark = outcome === 'annihilation' ? [c[0] * 0.55 + 0.1, c[1] * 0.55 + 0.1, c[2] * 0.55 + 0.1] : [c[0], c[1], c[2]];
    }
    this.result = { seed: this.seed, factions: this.factions, outcome, victor, endT: Math.max(t, 1.2e9), spark, ticks: this.ticks };
  }

  private checkpoint(): void {
    let h = this.seed | 0;
    const o = this.owner;
    for (let i = 0; i < o.length; i += 4) h = hash32(h, o[i]! & 255, (o[i + 1] ?? 0) & 255, (o[i + 2] ?? 0) & 255, (o[i + 3] ?? 0) & 255);
    this.checkpoints.push({ t: this.t, change: this.changeT.length, owner: this.owner.slice(), star: this.star.slice(), hash: h >>> 0 });
  }
}
