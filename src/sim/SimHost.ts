import type { FateField } from '../fate/FateField';
import type { SimSnapshot } from './types';

export interface AgentFrame {
  sim: string;
  snap: SimSnapshot;
  /** interpolation factor between previous and current positions */
  alpha: number;
  /** increments whenever a new snapshot arrives */
  version: number;
}

/**
 * Main-thread proxy for the sim worker: (re)initialises the right simulation
 * for the chapter, ticks it with real time and keeps the latest snapshot.
 */
export class SimHost {
  private worker: Worker | null = null;
  private simId = '';
  private seed = 0;
  private inFlight = false;
  private lastT = 0;
  latest: AgentFrame | null = null;
  private version = 0;
  maxAgents = 2600;

  constructor() {
    try {
      this.worker = new Worker(new URL('./sim.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (e: MessageEvent<{ type: string; sim: string; snap: SimSnapshot; alpha: number }>) => {
        if (e.data.type !== 'snap') return;
        this.inFlight = false;
        if (e.data.sim !== this.simId) return;
        this.latest = { sim: e.data.sim, snap: e.data.snap, alpha: e.data.alpha, version: ++this.version };
      };
      this.worker.onerror = (e) => {
        console.warn('sim worker error', e.message);
        this.inFlight = false;
      };
    } catch (e) {
      console.warn('Workers unavailable; agents disabled', e);
      this.worker = null;
    }
  }

  /** Called every frame for the active chapter. */
  update(simId: string | null, fate: FateField | null, seed: number, T: number, dt: number, lod: number, speed: number): void {
    if (!this.worker || !simId || !fate) return;
    const s = fate.sample(T);
    const fateMsg = { targets: s.values, k: s.k };
    // time jump (scrub / chapter jump) far beyond what local time could cover → re-init
    const jump = Math.abs(T - this.lastT) > Math.max(5e7, Math.abs(speed) * 2 + 1e6) && this.simId === simId;
    if (simId !== this.simId || seed !== this.seed || jump) {
      this.simId = simId;
      this.seed = seed;
      this.latest = null;
      this.inFlight = true;
      this.worker.postMessage({ type: 'init', sim: simId, seed, T, fate: fateMsg, maxAgents: this.maxAgents });
    }
    this.lastT = T;
    if (this.inFlight) return;
    this.inFlight = true;
    this.worker.postMessage({ type: 'tick', dt, T, fate: fateMsg, lod });
  }

  /** The chapter no longer needs a local simulation. */
  idle(): void {
    this.simId = '';
    this.latest = null;
  }
}
