/**
 * Local-rule agent simulations. Pure TypeScript: they run inside the sim
 * worker in the browser and directly in Node for the fate-invariance tests.
 */
export interface FateInput {
  /** canonical aggregate targets for this moment */
  targets: Record<string, number>;
  /** annealing spring stiffness */
  k: number;
}

export interface SimSnapshot {
  /** packed agent records, `stride` floats each */
  agents: Float32Array;
  count: number;
  stride: number;
  /** optional fields (grids), each w×h×channels */
  fields: Record<string, { data: Float32Array; w: number; h: number; ch: number }>;
  /** measured aggregates (to compare against the fate field) */
  stats: Record<string, number>;
  /** sim-local time */
  t: number;
}

export interface AgentSim {
  readonly id: string;
  readonly stride: number;
  /** (re)initialise from a seed and the sim time it starts at */
  init(seed: number, T: number, fate: FateInput): void;
  /** temporal LOD: 0 = field only, 1 = agents fully alive */
  setLOD(mix: number): void;
  /** advance one fixed local step */
  step(dt: number, T: number, fate: FateInput): void;
  snapshot(): SimSnapshot;
}
