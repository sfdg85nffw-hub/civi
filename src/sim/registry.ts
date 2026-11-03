import type { AgentSim } from './types';
import { MicrobeSim } from './agents/microbes';

/** Agent simulations by id (constructed inside the worker, or in Node for tests). */
export const SIM_FACTORIES: Record<string, () => AgentSim> = {
  microbes: () => new MicrobeSim(),
};
