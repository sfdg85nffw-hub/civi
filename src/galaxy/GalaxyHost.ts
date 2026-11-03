import type { Checkpoint, FactionInfo, GEvent, HistoryResult } from './GalaxySim';
import { STAR } from './GalaxySim';
import { buildUniverse, type Universe } from './universe';

/**
 * Main-thread owner of a Regime B history: receives the worker's stream, keeps
 * the change log and checkpoints, and reconstructs the state of the galaxy at
 * any requested moment (forward by replay, backward from the nearest checkpoint).
 */
export class GalaxyHost {
  readonly u: Universe;
  seed = 0;
  private worker: Worker | null = null;
  private runId = 0;
  frontier = 0;
  done = false;
  result: HistoryResult | null = null;
  factions: FactionInfo[] = [];
  events: GEvent[] = [];
  checkpoints: Checkpoint[] = [];
  private cT = new Float64Array(1 << 16);
  private cNode = new Int32Array(1 << 16);
  private cOwner = new Int8Array(1 << 16);
  private cStar = new Uint8Array(1 << 16);
  nChanges = 0;
  // cursor
  owner: Int8Array;
  star: Uint8Array;
  lastChange: Float64Array;
  cursorT = -1;
  private cursorIdx = 0;
  /** increments whenever the reconstructed state changes */
  version = 0;
  private listeners: (() => void)[] = [];

  constructor() {
    this.u = buildUniverse();
    this.owner = new Int8Array(this.u.n).fill(-1);
    this.star = new Uint8Array(this.u.n);
    this.lastChange = new Float64Array(this.u.n).fill(-1e12);
  }

  onDone(fn: () => void): void {
    this.listeners.push(fn);
    if (this.done) fn();
  }

  start(seed: number): void {
    this.worker?.terminate();
    this.seed = seed >>> 0;
    this.runId++;
    this.frontier = 0;
    this.done = false;
    this.result = null;
    this.factions = [];
    this.events = [];
    this.checkpoints = [];
    this.nChanges = 0;
    this.owner.fill(-1);
    this.star.fill(0);
    this.lastChange.fill(-1e12);
    this.cursorT = -1;
    this.cursorIdx = 0;
    this.version++;
    try {
      this.worker = new Worker(new URL('./galaxy.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e) => this.receive(e.data);
      this.worker.postMessage({ type: 'run', seed: this.seed, runId: this.runId });
    } catch (err) {
      console.warn('galaxy worker unavailable', err);
    }
  }

  private grow(need: number): void {
    if (need <= this.cT.length) return;
    let n = this.cT.length;
    while (n < need) n *= 2;
    const t = new Float64Array(n), nd = new Int32Array(n), o = new Int8Array(n), st = new Uint8Array(n);
    st.set(this.cStar.subarray(0, this.nChanges));
    this.cStar = st;
    t.set(this.cT.subarray(0, this.nChanges));
    nd.set(this.cNode.subarray(0, this.nChanges));
    o.set(this.cOwner.subarray(0, this.nChanges));
    this.cT = t;
    this.cNode = nd;
    this.cOwner = o;
  }

  private receive(m: {
    type: 'chunk' | 'done'; runId: number; frontier: number; t: Float64Array; node: Int32Array; owner: Int8Array; star: Uint8Array;
    events: GEvent[]; replaceEvents: boolean; checkpoints: Checkpoint[]; factions: FactionInfo[]; result: HistoryResult | null;
  }): void {
    if (m.runId !== this.runId) return;
    const k = m.t.length;
    this.grow(this.nChanges + k);
    this.cT.set(m.t, this.nChanges);
    this.cNode.set(m.node, this.nChanges);
    this.cOwner.set(m.owner, this.nChanges);
    this.cStar.set(m.star, this.nChanges);
    this.nChanges += k;
    if (m.replaceEvents) this.events = m.events.slice();
    else for (const e of m.events) this.events.push(e);
    this.events.sort((a, b) => a.t - b.t);
    for (const c of m.checkpoints) this.checkpoints.push(c);
    this.factions = m.factions;
    this.frontier = m.frontier;
    if (m.type === 'done') {
      this.done = true;
      this.result = m.result;
      this.frontier = Math.max(this.frontier, m.result?.endT ?? this.frontier);
      for (const fn of this.listeners) fn();
    }
  }

  /** Reconstruct the galaxy at time T (clamped to the simulated frontier). */
  seek(T: number): void {
    const t = Math.min(T, this.frontier);
    if (t === this.cursorT) return;
    if (t < this.cursorT || this.cursorT < 0) {
      // restore from the latest checkpoint at or before t
      let best: Checkpoint | null = null;
      for (const c of this.checkpoints) if (c.t <= t && (!best || c.t >= best.t)) best = c;
      if (best) {
        this.owner.set(best.owner);
        this.star.set(best.star);
        this.cursorIdx = best.change;
        this.lastChange.fill(best.t - 1e9);
      } else {
        this.owner.fill(-1);
        this.star.fill(0);
        this.cursorIdx = 0;
        this.lastChange.fill(-1e12);
      }
    }
    let i = this.cursorIdx;
    const n = this.nChanges;
    while (i < n && this.cT[i]! <= t) {
      const node = this.cNode[i]!;
      this.owner[node] = this.cOwner[i]!;
      this.star[node] = this.cStar[i]!;
      this.lastChange[node] = this.cT[i]!;
      i++;
    }
    this.cursorIdx = i;
    this.cursorT = t;
    this.version++;
  }

  /**
   * Ownership changes about to happen in (cursorT, cursorT + tau]: the probes and
   * fleets that are on their way right now (used for the slow-time agent view).
   */
  upcoming(tau: number, max: number, outNode: Int32Array, outOwner: Int8Array, outT: Float64Array): number {
    let k = 0;
    const t1 = this.cursorT + tau;
    for (let i = this.cursorIdx; i < this.nChanges && k < max; i++) {
      const t = this.cT[i]!;
      if (t > t1) break;
      const o = this.cOwner[i]!;
      if (o < 0) continue;
      outNode[k] = this.cNode[i]!;
      outOwner[k] = o;
      outT[k] = t;
      k++;
    }
    return k;
  }

  /** events overlapping [t0, t1] (streaks are active from t to t2) */
  eventsBetween(t0: number, t1: number, out: GEvent[] = []): GEvent[] {
    out.length = 0;
    const ev = this.events;
    for (let k = 0; k < ev.length; k++) {
      const e = ev[k]!;
      if (e.t > t1) break;
      const end = e.t2 > 0 ? e.t2 : e.t;
      if (end >= t0) out.push(e);
    }
    return out;
  }

  /** chronicle lines up to T */
  chronicle(T: number): GEvent[] {
    const out: GEvent[] = [];
    for (const e of this.events) {
      if (e.t > T) break;
      if (e.text) out.push(e);
    }
    return out;
  }

  isErased(i: number): boolean {
    return this.star[i] === STAR.ERASED;
  }
}
