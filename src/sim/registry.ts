import type { AgentSim } from './types';
import { MicrobeSim } from './agents/microbes';
import { CreatureSim } from './agents/creatures';
import { EcosystemSim } from './agents/ecosystem';
import { BandSim } from './agents/bands';
import { PolitySim } from './agents/polities';
import { CitySim } from './agents/cities';

/** Agent simulations by id (constructed inside the worker, or in Node for tests). */
export const SIM_FACTORIES: Record<string, () => AgentSim> = {
  microbes: () => new MicrobeSim(),
  creatures: () => new CreatureSim(),
  ecosystem: () => new EcosystemSim(),
  bands: () => new BandSim(),
  polities: () => new PolitySim(),
  cities: () => new CitySim(),
};
