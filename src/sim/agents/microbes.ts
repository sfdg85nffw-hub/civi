import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * MICROBIAL MAT — local rules for Chapter 1 (and the colonial phase of Ch. 2).
 *
 * Field (fast time): a two-species Gray–Scott reaction–diffusion system over a
 * substrate U — chemotrophs A and phototrophs P compete for U. Patterns bloom,
 * split and die back on their own.
 *
 * Agents (slow time): individual cells that sense U, run-and-tumble toward
 * food, metabolise, divide with mutation, crowd each other and die into
 * detritus that heterotrophs eat. Phototrophs exhale oxygen that rusts the
 * dissolved iron. Cells condense out of the field by importance sampling its
 * density, and dissolve back into it, so statistics match across the switch.
 *
 * The fate field nudges only rates (feed, photo advantage, birth/death), never
 * positions; at milestone dates the residual is projected away.
 */
const G = 128;
const G2 = G * G;
export const MICROBE_STRIDE = 12;
// record layout
const X = 0, Y = 1, PX = 2, PY = 3, RAD = 4, ANG = 5, SPEC = 6, HUE = 7, DIV = 8, ALPHA = 9, EN = 10, AGE = 11;

const Gy = 1e9;
export const MICROBE_FATE = new FateField(
  {
    biomass: [[-4.0 * Gy, 0.06], [-3.8 * Gy, 0.12], [-3.5 * Gy, 0.42], [-3.0 * Gy, 0.52], [-2.7 * Gy, 0.62], [-2.4 * Gy, 0.7], [-2.33 * Gy, 0.6], [-2.27 * Gy, 0.18], [-2.12 * Gy, 0.18], [-2.06 * Gy, 0.55], [-1.6 * Gy, 0.62], [-0.54 * Gy, 0.6]],
    photo: [[-4.0 * Gy, 0.0], [-3.5 * Gy, 0.06], [-3.0 * Gy, 0.22], [-2.7 * Gy, 0.55], [-2.4 * Gy, 0.78], [-1.6 * Gy, 0.82], [-0.54 * Gy, 0.8]],
  },
  [-3.8 * Gy, -3.5 * Gy, -2.7 * Gy, -2.4 * Gy, -2.29 * Gy, -2.06 * Gy, -1.6 * Gy],
);

export const COLONY_FATE = new FateField(
  {
    biomass: [[-1.6 * Gy, 0.62], [-1.0 * Gy, 0.6], [-0.72 * Gy, 0.25], [-0.64 * Gy, 0.25], [-0.6 * Gy, 0.6]],
    photo: [[-1.6 * Gy, 0.8], [-0.6 * Gy, 0.75]],
    colonial: [[-1.6 * Gy, 0.05], [-1.25 * Gy, 0.3], [-1.05 * Gy, 0.85], [-0.75 * Gy, 0.9]],
  },
  [-1.2 * Gy, -1.0 * Gy, -0.72 * Gy, -0.635 * Gy],
);

interface Genome {
  eff: number;
  motility: number;
  divThreshold: number;
  hue: number;
  /** adhesion gene (Chapter 2): sticky cells bind into colonies */
  adhesion: number;
}

export class MicrobeSim implements AgentSim {
  readonly id = 'microbes';
  readonly stride = MICROBE_STRIDE;
  maxCells = 2600;
  private rng = new Rng(1);
  // fields
  U = new Float32Array(G2);
  A = new Float32Array(G2);
  P = new Float32Array(G2);
  D = new Float32Array(G2);
  R = new Float32Array(G2);
  private tmpU = new Float32Array(G2);
  private tmpA = new Float32Array(G2);
  private tmpP = new Float32Array(G2);
  // agents
  cells = new Float32Array(this.maxCells * MICROBE_STRIDE);
  genomes: Genome[] = [];
  count = 0;
  private lod = 0;
  private agentsOn = false;
  /** 0 = free-living mat, 1 = colonial era (set from the fate field) */
  colonial = 0;
  private feed = 0.037;
  private kill = 0.06;
  private photoAdv = 1.0;
  private t = 0;
  private hash = new Int32Array(64 * 64 * 24);
  private hashN = new Int32Array(64 * 64);
  private lastMilestone = -1;
  private T = -4e9;

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'microbes');
    this.T = T;
    this.U.fill(1);
    this.A.fill(0);
    this.P.fill(0);
    this.D.fill(0);
    this.R.fill(0);
    this.count = 0;
    this.genomes = [];
    this.agentsOn = false;
    this.t = 0;
    const tgt = fate.targets;
    const photo = tgt.photo ?? 0.1;
    // seed spots
    for (let s = 0; s < 90; s++) {
      const cx = this.rng.int(0, G - 1), cy = this.rng.int(0, G - 1);
      const isP = this.rng.next() < photo;
      const r = this.rng.int(2, 4);
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const i = this.idx(cx + dx, cy + dy);
          this.U[i] = 0.5;
          if (isP) this.P[i] = 0.25;
          else this.A[i] = 0.25;
        }
    }
    for (let i = 0; i < 260; i++) this.fieldStep(fate);
    this.lastMilestone = MICROBE_FATE.milestones.findIndex((m) => m > T) - 1;
  }

  private idx(x: number, y: number): number {
    return (((y % G) + G) % G) * G + (((x % G) + G) % G);
  }

  setLOD(mix: number): void {
    this.lod = mix;
    if (mix > 0.02 && !this.agentsOn) this.condense();
    else if (mix < 0.01 && this.agentsOn) this.dissolve();
  }

  // ------------------------------------------------------------- field
  private fieldStep(fate: FateInput): void {
    const { U, A, P, tmpU, tmpA, tmpP } = this;
    const Du = 0.2, Dv = 0.1;
    const F = this.feed;
    const kA = this.kill, kP = this.kill - 0.001;
    const r = this.photoAdv;
    for (let y = 0; y < G; y++) {
      const ym = ((y - 1 + G) % G) * G, yp = ((y + 1) % G) * G, y0 = y * G;
      for (let x = 0; x < G; x++) {
        const xm = (x - 1 + G) % G, xp = (x + 1) % G;
        const i = y0 + x;
        const u = U[i]!, a = A[i]!, p = P[i]!;
        const lapU = U[y0 + xm]! + U[y0 + xp]! + U[ym + x]! + U[yp + x]! - 4 * u;
        const lapA = A[y0 + xm]! + A[y0 + xp]! + A[ym + x]! + A[yp + x]! - 4 * a;
        const lapP = P[y0 + xm]! + P[y0 + xp]! + P[ym + x]! + P[yp + x]! - 4 * p;
        const ra = u * a * a, rp = r * u * p * p;
        // explicit Euler, kept inside the physical range so it can never diverge
        const nu = u + Du * lapU - ra - rp + F * (1 - u);
        const na = a + Dv * lapA + ra - (F + kA) * a;
        const np = p + Dv * lapP + rp - (F + kP) * p;
        tmpU[i] = nu > 0 ? (nu < 1 ? nu : 1) : 0;
        tmpA[i] = na > 0 ? (na < 1 ? na : 1) : 0;
        tmpP[i] = np > 0 ? (np < 1 ? np : 1) : 0;
        // oxygen from phototrophs rusts dissolved iron
        this.R[i] = Math.min(1, this.R[i]! * 0.9995 + p * 0.0006);
      }
    }
    this.U.set(tmpU);
    this.A.set(tmpA);
    this.P.set(tmpP);
    void fate;
  }

  private reseed(photo: number): void {
    for (let s = 0; s < 30; s++) {
      const cx = this.rng.int(0, G - 1), cy = this.rng.int(0, G - 1);
      const isP = this.rng.next() < photo;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++) {
          const i = this.idx(cx + dx, cy + dy);
          this.U[i] = 0.5;
          if (isP) this.P[i] = 0.25;
          else this.A[i] = 0.25;
        }
    }
  }

  /** occasional upwelling pulses: blooms and die-offs */
  private pulse(): void {
    if (this.rng.next() < 0.02) {
      const cx = this.rng.int(0, G - 1), cy = this.rng.int(0, G - 1), r = this.rng.int(4, 10);
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy > r * r) continue;
          const i = this.idx(cx + dx, cy + dy);
          this.U[i] = Math.min(1, this.U[i]! + 0.3);
        }
    }
  }

  // ------------------------------------------------------------- measurement
  fieldStats(): { biomass: number; photo: number } {
    let a = 0, p = 0;
    for (let i = 0; i < G2; i++) {
      a += this.A[i]!;
      p += this.P[i]!;
    }
    const b = (a + p) / G2 / 0.22;
    return { biomass: b, photo: a + p > 1e-6 ? p / (a + p) : 0 };
  }

  agentStats(): { biomass: number; photo: number } {
    let photo = 0, live = 0;
    for (let c = 0; c < this.count; c++) {
      const o = c * MICROBE_STRIDE;
      if (this.cells[o + EN]! < 0) continue;
      live++;
      if (this.cells[o + SPEC] === 1) photo++;
    }
    return { biomass: live / this.cellsPerBiomass(), photo: live ? photo / live : 0 };
  }

  private cellsPerBiomass(): number {
    return this.maxCells * 0.9;
  }

  stats(): { biomass: number; photo: number } {
    return this.agentsOn ? this.agentStats() : this.fieldStats();
  }

  // ------------------------------------------------------------- LOD switch
  private condense(): void {
    // importance-sample the field: counts and species ratios match the field
    const st = this.fieldStats();
    const n = Math.min(this.maxCells - 10, Math.round(st.biomass * this.cellsPerBiomass()));
    const cdf = new Float32Array(G2);
    let acc = 0;
    for (let i = 0; i < G2; i++) {
      acc += Math.max(0, this.A[i]! + this.P[i]!);
      cdf[i] = acc;
    }
    this.count = 0;
    this.genomes = [];
    for (let k = 0; k < n && acc > 0; k++) {
      const r = this.rng.next() * acc;
      let lo = 0, hi = G2 - 1;
      while (lo < hi) {
        const m = (lo + hi) >> 1;
        if (cdf[m]! < r) lo = m + 1;
        else hi = m;
      }
      const a = this.A[lo]!, p = this.P[lo]!;
      const spec = this.rng.next() * (a + p) < p ? 1 : this.rng.next() < 0.12 ? 2 : 0;
      const x = ((lo % G) + this.rng.next()) / G;
      const y = (Math.floor(lo / G) + this.rng.next()) / G;
      this.addCell(x, y, spec, this.randomGenome(spec), this.rng.range(0.3, 0.9), -this.rng.range(0, 1.5));
    }
    this.agentsOn = true;
  }

  private dissolve(): void {
    // splat cells back into the field so the field resumes from the agents' state
    this.A.fill(0);
    this.P.fill(0);
    for (let c = 0; c < this.count; c++) {
      const o = c * MICROBE_STRIDE;
      if (this.cells[o + EN]! < 0) continue;
      const i = this.idx(Math.floor(this.cells[o + X]! * G), Math.floor(this.cells[o + Y]! * G));
      const amt = 0.22 * G2 / this.cellsPerBiomass();
      if (this.cells[o + SPEC] === 1) this.P[i]! += amt;
      else this.A[i]! += amt;
    }
    // soften the splat into field-like blobs
    for (let k = 0; k < 2; k++) this.blur(this.A), this.blur(this.P);
    this.count = 0;
    this.genomes = [];
    this.agentsOn = false;
  }

  private blur(f: Float32Array): void {
    const t = this.tmpU;
    for (let y = 0; y < G; y++)
      for (let x = 0; x < G; x++) {
        const i = y * G + x;
        t[i] = f[i]! * 0.5 + (f[this.idx(x - 1, y)]! + f[this.idx(x + 1, y)]! + f[this.idx(x, y - 1)]! + f[this.idx(x, y + 1)]!) * 0.125;
      }
    f.set(t);
  }

  private randomGenome(spec: number): Genome {
    const r = this.rng;
    return {
      eff: r.range(0.8, 1.2),
      motility: spec === 1 ? r.range(0.05, 0.35) : r.range(0.3, 1.0),
      divThreshold: r.range(1.6, 2.4),
      hue: spec === 1 ? r.range(0.42, 0.52) : spec === 2 ? r.range(0.75, 0.85) : r.range(0.05, 0.12),
      adhesion: r.next() < this.colonial ? r.range(0.5, 1.0) : r.range(0.0, 0.3),
    };
  }

  private addCell(x: number, y: number, spec: number, g: Genome, energy: number, alpha: number): void {
    if (this.count >= this.maxCells) return;
    const o = this.count * MICROBE_STRIDE;
    const c = this.cells;
    c[o + X] = x;
    c[o + Y] = y;
    c[o + PX] = x;
    c[o + PY] = y;
    c[o + RAD] = (spec === 1 ? 0.0034 : spec === 2 ? 0.0042 : 0.0062) * this.rng.range(0.75, 1.25);
    c[o + ANG] = this.rng.range(0, Math.PI * 2);
    c[o + SPEC] = spec;
    c[o + HUE] = g.hue;
    c[o + DIV] = 0;
    c[o + ALPHA] = alpha;
    c[o + EN] = energy;
    c[o + AGE] = 0;
    this.genomes[this.count] = g;
    this.count++;
  }

  private removeCell(i: number): void {
    const last = this.count - 1;
    if (i !== last) {
      this.cells.copyWithin(i * MICROBE_STRIDE, last * MICROBE_STRIDE, (last + 1) * MICROBE_STRIDE);
      this.genomes[i] = this.genomes[last]!;
    }
    this.genomes.length = last;
    this.count--;
  }

  private sample(f: Float32Array, x: number, y: number): number {
    const gx = x * G - 0.5, gy = y * G - 0.5;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const fx = gx - x0, fy = gy - y0;
    const a = f[this.idx(x0, y0)]!, b = f[this.idx(x0 + 1, y0)]!, c = f[this.idx(x0, y0 + 1)]!, d = f[this.idx(x0 + 1, y0 + 1)]!;
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }

  // ------------------------------------------------------------- agents
  private agentStep(dt: number, fate: FateInput): void {
    const c = this.cells;
    const rng = this.rng;
    const tgt = fate.targets;
    const st = this.agentStats();
    const errB = (tgt.biomass ?? 0.4) - st.biomass;
    const errP = (tgt.photo ?? 0.3) - st.photo;
    const fert = Math.exp(Math.max(-3, Math.min(3, fate.k * errB * 6)));
    const deathBias = Math.max(0, -errB) * fate.k * 0.6;
    // substrate: diffuse and replenish
    const U = this.U;
    for (let i = 0; i < G2; i++) U[i] = Math.min(1, U[i]! + 0.22 * dt * (1 - U[i]!) + this.D[i]! * 0.05 * dt);
    this.D.forEach((v, i) => (this.D[i] = v * (1 - 0.3 * dt)));
    // spatial hash
    this.hashN.fill(0);
    for (let k = 0; k < this.count; k++) {
      const o = k * MICROBE_STRIDE;
      const hx = Math.floor(c[o + X]! * 64) & 63, hy = Math.floor(c[o + Y]! * 64) & 63;
      const b = hy * 64 + hx;
      const n = this.hashN[b]!;
      if (n < 24) {
        this.hash[b * 24 + n] = k;
        this.hashN[b] = n + 1;
      }
    }
    for (let k = this.count - 1; k >= 0; k--) {
      const o = k * MICROBE_STRIDE;
      const g = this.genomes[k]!;
      c[o + PX] = c[o + X]!;
      c[o + PY] = c[o + Y]!;
      c[o + AGE]! += dt;
      if (c[o + ALPHA]! < 1) c[o + ALPHA] = Math.min(1, c[o + ALPHA]! + dt * 0.9);
      if (c[o + EN]! < 0) {
        // dying: fade, then become detritus
        c[o + ALPHA]! -= dt * 1.2;
        if (c[o + ALPHA]! <= 0) {
          const i = this.idx(Math.floor(c[o + X]! * G), Math.floor(c[o + Y]! * G));
          this.D[i] = Math.min(1, this.D[i]! + 0.3);
          this.removeCell(k);
        }
        continue;
      }
      const x = c[o + X]!, y = c[o + Y]!;
      const spec = c[o + SPEC]!;
      const u = this.sample(U, x, y);
      let gain: number;
      if (spec === 1) gain = g.eff * 0.62 * (0.45 + 0.55 * u);
      else if (spec === 2) gain = g.eff * 2.2 * this.sample(this.D, x, y) + 0.25 * u;
      else gain = g.eff * 1.15 * u;
      const cost = (0.17 + 0.14 * g.motility) * Math.exp(-Math.max(-1, Math.min(1, errB * fate.k * 4))) + deathBias;
      c[o + EN]! += (gain - cost) * dt;
      const ci = this.idx(Math.floor(x * G), Math.floor(y * G));
      U[ci] = Math.max(0, U[ci]! - (spec === 1 ? 0.25 : 0.5) * dt);
      if (spec === 1) this.R[ci] = Math.min(1, this.R[ci]! + 0.02 * dt);
      // run and tumble: keep going while food improves, tumble otherwise
      const ang = c[o + ANG]!;
      const sp = g.motility * (spec === 1 ? 0.006 : 0.012) * (g.adhesion > 0.45 ? 0.25 : 1);
      const ahead = this.sample(U, x + Math.cos(ang) * 0.02, y + Math.sin(ang) * 0.02);
      if (ahead < u && rng.next() < dt * 2.5) c[o + ANG] = ang + rng.normal(0, 1.4);
      else c[o + ANG] = ang + rng.normal(0, 0.25) * dt;
      let nx = x + Math.cos(c[o + ANG]!) * sp * dt;
      let ny = y + Math.sin(c[o + ANG]!) * sp * dt;
      // crowding: soft repulsion
      const r0 = c[o + RAD]!;
      const hx = Math.floor(x * 64), hy = Math.floor(y * 64);
      for (let by = -1; by <= 1; by++)
        for (let bx = -1; bx <= 1; bx++) {
          const b = ((hy + by) & 63) * 64 + ((hx + bx) & 63);
          const n = this.hashN[b]!;
          for (let j = 0; j < n; j++) {
            const q = this.hash[b * 24 + j]!;
            if (q === k || q >= this.count) continue;
            const oq = q * MICROBE_STRIDE;
            let dx = nx - c[oq + X]!, dy = ny - c[oq + Y]!;
            if (dx > 0.5) dx -= 1;
            else if (dx < -0.5) dx += 1;
            if (dy > 0.5) dy -= 1;
            else if (dy < -0.5) dy += 1;
            const d2 = dx * dx + dy * dy;
            const rr = (r0 + c[oq + RAD]!) * 1.15;
            if (d2 < rr * rr && d2 > 1e-12) {
              const d = Math.sqrt(d2);
              const push = (rr - d) * 0.35;
              nx += (dx / d) * push;
              ny += (dy / d) * push;
            } else if (g.adhesion > 0.45 && this.genomes[q]!.adhesion > 0.45 && d2 < rr * rr * 2.6 && d2 > 1e-12) {
              // adhesion: sticky neighbours bind at contact distance
              const d = Math.sqrt(d2);
              const pull = (d - rr) * 0.18 * Math.min(g.adhesion, this.genomes[q]!.adhesion);
              nx -= (dx / d) * pull;
              ny -= (dy / d) * pull;
            }
          }
        }
      c[o + X] = ((nx % 1) + 1) % 1;
      c[o + Y] = ((ny % 1) + 1) % 1;
      // division
      if (c[o + DIV]! > 0) {
        c[o + DIV]! += dt / 1.3;
        if (c[o + DIV]! >= 1) this.divide(k, errP, fate.k);
      } else if (c[o + EN]! > g.divThreshold / fert && this.count < this.maxCells - 1) {
        c[o + DIV] = 0.001;
      }
      if (c[o + EN]! > 4) c[o + EN] = 4;
    }
  }

  private divide(k: number, errP: number, kk: number): void {
    const c = this.cells;
    const o = k * MICROBE_STRIDE;
    const g = this.genomes[k]!;
    const rng = this.rng;
    const e = c[o + EN]! * 0.5;
    const ang = c[o + ANG]!;
    const r = c[o + RAD]!;
    const x = c[o + X]!, y = c[o + Y]!;
    c[o + EN] = e;
    c[o + DIV] = 0;
    c[o + X] = (x - Math.cos(ang) * r * 0.9 + 1) % 1;
    c[o + Y] = (y - Math.sin(ang) * r * 0.9 + 1) % 1;
    let spec = c[o + SPEC]!;
    // mutation; the fate spring biases which way the population drifts
    const toPhoto = Math.max(0, errP) * kk * 0.8 + 0.004;
    const toChemo = Math.max(0, -errP) * kk * 0.8 + 0.004;
    if (spec !== 1 && rng.next() < toPhoto) spec = 1;
    else if (spec === 1 && rng.next() < toChemo) spec = rng.next() < 0.15 ? 2 : 0;
    const child: Genome = {
      eff: Math.max(0.4, g.eff + rng.normal(0, 0.04)),
      motility: Math.max(0.02, Math.min(1.2, g.motility + rng.normal(0, 0.04))),
      divThreshold: Math.max(1.2, Math.min(3, g.divThreshold + rng.normal(0, 0.05))),
      hue: spec === c[o + SPEC] ? g.hue + rng.normal(0, 0.006) : this.randomGenome(spec).hue,
      adhesion: Math.max(0, Math.min(1, g.adhesion + rng.normal(0, 0.05) + (rng.next() < this.colonial * 0.02 ? 0.4 : 0))),
    };
    this.addCell((x + Math.cos(ang) * r * 0.9 + 1) % 1, (y + Math.sin(ang) * r * 0.9 + 1) % 1, spec, child, e, 0.85);
    const oc = (this.count - 1) * MICROBE_STRIDE;
    c[oc + ANG] = ang + rng.normal(0, 0.3);
  }

  /** splat agents into A/P so the field layer stays consistent while agents live */
  private splat(): void {
    const c = this.cells;
    this.A.fill(0);
    this.P.fill(0);
    const amt = 0.22 * G2 / this.cellsPerBiomass();
    for (let k = 0; k < this.count; k++) {
      const o = k * MICROBE_STRIDE;
      if (c[o + EN]! < 0) continue;
      const i = this.idx(Math.floor(c[o + X]! * G), Math.floor(c[o + Y]! * G));
      if (c[o + SPEC] === 1) this.P[i]! += amt;
      else this.A[i]! += amt;
    }
  }

  // ------------------------------------------------------------- fate
  private fieldFate(fate: FateInput): void {
    const st = this.fieldStats();
    const tg = fate.targets;
    const eb = (tg.biomass ?? 0.4) - st.biomass;
    const ep = (tg.photo ?? 0.3) - st.photo;
    // lower kill rate → patterns spread; higher → they retreat into spots
    this.kill = Math.max(0.054, Math.min(0.0665, this.kill - eb * fate.k * 0.0006));
    this.photoAdv = Math.max(0.75, Math.min(1.5, this.photoAdv + ep * fate.k * 0.05));
    if (st.biomass < 0.01) this.reseed(0.3);
  }

  /** Project exactly onto the milestone (called when a milestone date is crossed). */
  project(targets: Record<string, number>): void {
    const tb = targets.biomass ?? 0.4, tp = targets.photo ?? 0.3;
    if (!this.agentsOn) {
      if (this.fieldStats().biomass < 0.01) this.reseed(tp);
      let a = 0, p = 0;
      for (let i = 0; i < G2; i++) {
        a += this.A[i]!;
        p += this.P[i]!;
      }
      const want = tb * 0.22 * G2;
      // bounded rescale: a nearly empty field is reseeded rather than blown up
      const sa = a > 1e-6 ? Math.min(3, (want * (1 - tp)) / a) : 0;
      const sp = p > 1e-6 ? Math.min(3, (want * tp) / p) : 0;
      let a2 = 0, p2 = 0;
      for (let i = 0; i < G2; i++) {
        this.A[i] = Math.min(1, this.A[i]! * sa);
        this.P[i] = Math.min(1, this.P[i]! * sp);
        a2 += this.A[i]!;
        p2 += this.P[i]!;
      }
      // whatever the bounded rescale could not supply is spread as a thin film (exact landing)
      if (a > 1e-6) {
        const da = (want * (1 - tp) - a2) / G2;
        if (Math.abs(da) > 1e-9) for (let i = 0; i < G2; i++) this.A[i] = Math.max(0, this.A[i]! + da);
      }
      if (p > 1e-6) {
        const dp = (want * tp - p2) / G2;
        if (Math.abs(dp) > 1e-9) for (let i = 0; i < G2; i++) this.P[i] = Math.max(0, this.P[i]! + dp);
      }
      // a species can't be projected from nothing: seed it where the other lives
      if (p <= 1e-6 && tp > 0) for (let i = 0; i < G2; i++) this.P[i] = Math.min(1, this.A[i]! * (tp / Math.max(1e-6, 1 - tp)));
      if (a <= 1e-6 && tp < 1) for (let i = 0; i < G2; i++) this.A[i] = Math.min(1, this.P[i]! * ((1 - tp) / Math.max(1e-6, tp)));
      return;
    }
    const wantN = Math.round(tb * this.cellsPerBiomass());
    while (this.count > wantN) this.removeCell(Math.floor(this.rng.next() * this.count));
    while (this.count < wantN && this.count < this.maxCells) {
      const src = Math.floor(this.rng.next() * Math.max(1, this.count)) * MICROBE_STRIDE;
      const x = this.count ? this.cells[src + X]! + this.rng.normal(0, 0.01) : this.rng.next();
      const y = this.count ? this.cells[src + Y]! + this.rng.normal(0, 0.01) : this.rng.next();
      this.addCell((x + 1) % 1, (y + 1) % 1, 0, this.randomGenome(0), 1, 0.2);
    }
    const wantP = Math.round(tp * this.count);
    let p = 0;
    for (let k = 0; k < this.count; k++) if (this.cells[k * MICROBE_STRIDE + SPEC] === 1) p++;
    for (let k = 0; k < this.count && p !== wantP; k++) {
      const o = k * MICROBE_STRIDE;
      const isP = this.cells[o + SPEC] === 1;
      if (p < wantP && !isP) {
        this.cells[o + SPEC] = 1;
        this.cells[o + HUE] = this.randomGenome(1).hue;
        p++;
      } else if (p > wantP && isP) {
        this.cells[o + SPEC] = 0;
        this.cells[o + HUE] = this.randomGenome(0).hue;
        p--;
      }
    }
    for (let k = 0; k < this.count; k++) if (this.cells[k * MICROBE_STRIDE + EN]! < 0) this.cells[k * MICROBE_STRIDE + EN] = 0.5;
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    this.colonial = fate.targets.colonial ?? 0;
    // milestone crossings: project the residual away
    const ms = MICROBE_FATE.milestones;
    let mi = this.lastMilestone;
    while (mi + 1 < ms.length && T >= ms[mi + 1]!) mi++;
    this.T = T;
    if (this.agentsOn) {
      this.agentStep(dt, fate);
      this.splat();
      this.blur(this.A);
      this.blur(this.P);
      this.blur(this.A);
      this.blur(this.P);
    } else {
      this.fieldFate(fate);
      const iters = 4;
      for (let i = 0; i < iters; i++) this.fieldStep(fate);
      this.pulse();
    }
    if (mi !== this.lastMilestone) {
      this.lastMilestone = mi;
      if (mi >= 0) this.project(MICROBE_FATE.sample(ms[mi]!).values);
    }
  }

  snapshot(): SimSnapshot {
    const st = this.stats();
    const field = new Float32Array(G2 * 4);
    for (let i = 0; i < G2; i++) {
      field[i * 4] = this.A[i]!;
      field[i * 4 + 1] = this.P[i]!;
      field[i * 4 + 2] = this.U[i]!;
      field[i * 4 + 3] = this.R[i]!;
    }
    return {
      agents: this.cells.slice(0, this.count * MICROBE_STRIDE),
      count: this.count,
      stride: MICROBE_STRIDE,
      fields: { mat: { data: field, w: G, h: G, ch: 4 } },
      stats: { biomass: st.biomass, photo: st.photo, cells: this.count, agents: this.agentsOn ? 1 : 0 },
      t: this.t,
    };
  }
}
