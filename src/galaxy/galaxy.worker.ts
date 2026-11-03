/// <reference lib="webworker" />
import { GalaxySim } from './GalaxySim';

/**
 * Computes a Regime B history in the background, streaming it to the main
 * thread in chunks (ownership changes, events, checkpoints) so the frontier of
 * the simulated future advances while the viewer watches the past.
 */
let runId = -1;

self.onmessage = (e: MessageEvent<{ type: 'run'; seed: number; runId: number }>) => {
  if (e.data.type !== 'run') return;
  runId = e.data.runId;
  run(e.data.seed, e.data.runId);
};

function run(seed: number, id: number): void {
  const sim = new GalaxySim(seed);
  let sentC = 0, sentE = 0, sentK = 0;
  const post = (done: boolean): void => {
    const n = sim.changeT.length;
    const t = Float64Array.from(sim.changeT.slice(sentC, n));
    const node = Int32Array.from(sim.changeNode.slice(sentC, n));
    const owner = Int8Array.from(sim.changeOwner.slice(sentC, n));
    const star = Uint8Array.from(sim.changeStar.slice(sentC, n));
    sentC = n;
    const events = done ? sim.events.slice() : sim.events.slice(sentE);
    sentE = sim.events.length;
    const checks = sim.checkpoints.slice(sentK);
    sentK = sim.checkpoints.length;
    const transfer: Transferable[] = [t.buffer, node.buffer, owner.buffer, star.buffer];
    for (const c of checks) transfer.push(c.owner.buffer, c.star.buffer);
    (self as unknown as Worker).postMessage(
      { type: done ? 'done' : 'chunk', runId: id, seed, frontier: sim.t, t, node, owner, star, events, replaceEvents: done, checkpoints: checks, factions: sim.factions, result: sim.result },
      transfer,
    );
  };
  const step = (): void => {
    if (id !== runId) return;
    sim.advance(40);
    if (sim.done) {
      post(true);
      return;
    }
    post(false);
    setTimeout(step, 0);
  };
  step();
}
