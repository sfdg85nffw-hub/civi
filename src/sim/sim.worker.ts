/// <reference lib="webworker" />
import { SIM_FACTORIES } from './registry';
import type { AgentSim, FateInput, SimSnapshot } from './types';

/**
 * Hosts the active chapter's local-rule simulation. Fixed timestep (30 Hz
 * local time) with an accumulator; snapshots go back as transferable buffers.
 */
const DT = 1 / 30;
let sim: AgentSim | null = null;
let simId = '';
let acc = 0;

interface InitMsg { type: 'init'; sim: string; seed: number; T: number; fate: FateInput; maxAgents: number }
interface TickMsg { type: 'tick'; dt: number; T: number; fate: FateInput; lod: number }

self.onmessage = (e: MessageEvent<InitMsg | TickMsg>) => {
  const m = e.data;
  if (m.type === 'init') {
    const f = SIM_FACTORIES[m.sim];
    if (!f) return;
    sim = f();
    simId = m.sim;
    (sim as unknown as { maxCells?: number }).maxCells = Math.min((sim as unknown as { maxCells?: number }).maxCells ?? m.maxAgents, m.maxAgents);
    sim.init((m.seed >>> 0) || 1, m.T, m.fate);
    acc = 0;
    post(sim.snapshot(), 0);
    return;
  }
  if (m.type === 'tick' && sim) {
    sim.setLOD(m.lod);
    acc += Math.min(0.25, m.dt);
    let n = 0;
    while (acc >= DT && n < 4) {
      sim.step(DT, m.T, m.fate);
      acc -= DT;
      n++;
    }
    if (n === 4) acc = 0;
    post(sim.snapshot(), acc / DT);
  }
};

function post(s: SimSnapshot, alpha: number): void {
  const transfer: Transferable[] = [s.agents.buffer as ArrayBuffer];
  for (const k in s.fields) transfer.push(s.fields[k]!.data.buffer as ArrayBuffer);
  (self as unknown as Worker).postMessage({ type: 'snap', sim: simId, snap: s, alpha }, transfer);
}
