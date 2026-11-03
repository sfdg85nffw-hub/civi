import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * CAMBRIAN SWIMMERS — local rules for the end of Chapter 2.
 *
 * Each creature is a spring-mass chain (3–6 nodes). Its genome encodes the
 * morphology (segment lengths, body size) and the locomotion (a travelling
 * wave of joint angles: amplitude, frequency, phase lag). Nobody scripts
 * swimming: thrust emerges from anisotropic fluid drag on the segments
 * (resistive-force theory — sideways drag ≫ lengthwise drag), as in Karl
 * Sims' evolved creatures. Predators (large mouths) chase smaller prey; prey
 * graze plankton and flee. Reproduction copies the genome with mutation, so
 * speed, size and wave shape drift under predation pressure.
 */
export const CREATURE_STRIDE = 32;
export const MAX_NODES = 6;
const FOOD_G = 32;

export const CREATURE_FATE = new FateField(
  {
    population: [[-6.0e8, 0.15], [-5.75e8, 0.2], [-5.388e8, 0.35], [-5.2e8, 0.75], [-5.05e8, 0.85], [-4.85e8, 0.8], [-4.45e8, 0.45], [-4.4e8, 0.7]],
    predators: [[-6.0e8, 0.0], [-5.39e8, 0.05], [-5.25e8, 0.22], [-5.05e8, 0.3], [-4.8e8, 0.28]],
  },
  [-5.75e8, -5.388e8, -5.05e8, -4.45e8],
);

interface Genome {
  n: number;
  seg: number[]; // segment lengths (domain units)
  amp: number;
  freq: number;
  lag: number;
  size: number;
  hue: number;
  mouth: number; // > 0.55 → predator
  sight: number;
  turn: number;
  pattern: number;
}

interface Creature {
  g: Genome;
  px: Float32Array; // node positions
  pz: Float32Array;
  vx: Float32Array;
  vz: Float32Array;
  ox: Float32Array; // previous snapshot positions (interpolation)
  oz: Float32Array;
  y: number;
  phase: number;
  energy: number;
  alpha: number; // birth/death fade
  dying: boolean;
  age: number;
}

const wrap = (d: number): number => (d > 0.5 ? d - 1 : d < -0.5 ? d + 1 : d);

export class CreatureSim implements AgentSim {
  readonly id = 'creatures';
  readonly stride = CREATURE_STRIDE;
  maxCells = 150;
  private rng = new Rng(1);
  creatures: Creature[] = [];
  food = new Float32Array(FOOD_G * FOOD_G);
  private lod = 0;
  private t = 0;

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'creatures');
    this.creatures = [];
    this.t = 0;
    for (let i = 0; i < this.food.length; i++) this.food[i] = 0.4 + 0.6 * this.rng.next();
    const n = Math.round((fate.targets.population ?? 0.5) * this.maxCells);
    const predFrac = fate.targets.predators ?? 0.1;
    for (let i = 0; i < n; i++) this.spawn(this.rng.next(), this.rng.next(), this.randomGenome(this.rng.next() < predFrac), 1.0, 1);
    void T;
  }

  setLOD(mix: number): void {
    this.lod = mix;
  }

  randomGenome(pred: boolean): Genome {
    const r = this.rng;
    const n = r.int(3, MAX_NODES);
    const base = pred ? r.range(0.018, 0.028) : r.range(0.01, 0.02);
    return {
      n,
      seg: Array.from({ length: n - 1 }, () => base * r.range(0.7, 1.3)),
      amp: r.range(0.25, 0.7),
      freq: r.range(1.0, 2.6),
      lag: r.range(0.5, 1.4),
      size: pred ? r.range(1.2, 1.8) : r.range(0.6, 1.2),
      hue: pred ? r.range(0.9, 1.0) : r.range(0.42, 0.56),
      mouth: pred ? r.range(0.6, 1.0) : r.range(0.0, 0.4),
      sight: r.range(0.06, 0.16),
      turn: r.range(0.3, 0.9),
      pattern: r.next(),
    };
  }

  private mutate(g: Genome): Genome {
    const r = this.rng;
    const m = (v: number, s: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v + r.normal(0, s)));
    let n = g.n;
    if (r.next() < 0.05) n = Math.max(3, Math.min(MAX_NODES, n + (r.next() < 0.5 ? -1 : 1)));
    const seg = Array.from({ length: n - 1 }, (_, i) => m(g.seg[Math.min(i, g.seg.length - 1)]!, 0.0015, 0.006, 0.034));
    return {
      n,
      seg,
      amp: m(g.amp, 0.04, 0.1, 0.95),
      freq: m(g.freq, 0.12, 0.5, 3.5),
      lag: m(g.lag, 0.08, 0.2, 2.0),
      size: m(g.size, 0.06, 0.4, 2.2),
      hue: g.hue + r.normal(0, 0.01),
      mouth: m(g.mouth, 0.04, 0, 1),
      sight: m(g.sight, 0.01, 0.03, 0.25),
      turn: m(g.turn, 0.05, 0.1, 1.2),
      pattern: (g.pattern + r.normal(0, 0.03) + 1) % 1,
    };
  }

  private spawn(x: number, z: number, g: Genome, energy: number, alpha: number): void {
    if (this.creatures.length >= this.maxCells) return;
    const n = g.n;
    const ang = this.rng.range(0, Math.PI * 2);
    const c: Creature = {
      g,
      px: new Float32Array(MAX_NODES),
      pz: new Float32Array(MAX_NODES),
      vx: new Float32Array(MAX_NODES),
      vz: new Float32Array(MAX_NODES),
      ox: new Float32Array(MAX_NODES),
      oz: new Float32Array(MAX_NODES),
      y: this.rng.range(0.15, 1.0),
      phase: this.rng.range(0, Math.PI * 2),
      energy,
      alpha,
      dying: false,
      age: 0,
    };
    let cx = x, cz = z;
    for (let i = 0; i < n; i++) {
      c.px[i] = (cx + 1) % 1;
      c.pz[i] = (cz + 1) % 1;
      if (i < n - 1) {
        cx -= Math.cos(ang) * g.seg[i]! * g.size;
        cz -= Math.sin(ang) * g.seg[i]! * g.size;
      }
    }
    c.ox.set(c.px);
    c.oz.set(c.pz);
    this.creatures.push(c);
  }

  isPred(c: Creature): boolean {
    return c.g.mouth > 0.55;
  }

  stats(): { population: number; predators: number } {
    const live = this.creatures.filter((c) => !c.dying);
    const pred = live.filter((c) => this.isPred(c)).length;
    return { population: live.length / this.maxCells, predators: live.length ? pred / live.length : 0 };
  }

  /** one creature's physics substep: muscles + anisotropic drag, then rigid-segment constraints (PBD) */
  private physics(c: Creature, dt: number, turnBias: number): void {
    const g = c.g;
    const n = g.n;
    const { px, pz, vx, vz } = c;
    const fx = new Float32Array(n), fz = new Float32Array(n);
    const kb = 0.9, cn = 7.0, ct = 0.4;
    // muscles: angular springs driven by a travelling wave of target joint angles
    for (let i = 1; i < n - 1; i++) {
      const ax = wrap(px[i]! - px[i - 1]!), az = wrap(pz[i]! - pz[i - 1]!);
      const bx = wrap(px[i + 1]! - px[i]!), bz = wrap(pz[i + 1]! - pz[i]!);
      const phi = Math.atan2(ax * bz - az * bx, ax * bx + az * bz);
      const target = g.amp * Math.sin(c.phase - i * g.lag) + turnBias;
      const e = target - phi;
      const bl = Math.hypot(bx, bz) || 1e-6;
      const al = Math.hypot(ax, az) || 1e-6;
      const tq = kb * e * g.size;
      const f1x = (-bz / bl) * tq, f1z = (bx / bl) * tq;
      const f0x = (az / al) * tq, f0z = (-ax / al) * tq;
      fx[i + 1]! += f1x;
      fz[i + 1]! += f1z;
      fx[i - 1]! += f0x;
      fz[i - 1]! += f0z;
      fx[i]! -= f1x + f0x;
      fz[i]! -= f1z + f0z;
    }
    // anisotropic fluid drag per segment (resistive-force theory)
    for (let i = 0; i < n - 1; i++) {
      const dx = wrap(px[i + 1]! - px[i]!), dz = wrap(pz[i + 1]! - pz[i]!);
      const L = Math.hypot(dx, dz) || 1e-6;
      const ux = dx / L, uz = dz / L;
      const mvx = (vx[i]! + vx[i + 1]!) * 0.5, mvz = (vz[i]! + vz[i + 1]!) * 0.5;
      const vt = mvx * ux + mvz * uz;
      const tx = vt * ux, tz = vt * uz;
      const nx = mvx - tx, nz = mvz - tz;
      const k = L * 60;
      const dfx = -(ct * tx + cn * nx) * k, dfz = -(ct * tz + cn * nz) * k;
      fx[i]! += dfx * 0.5;
      fz[i]! += dfz * 0.5;
      fx[i + 1]! += dfx * 0.5;
      fz[i + 1]! += dfz * 0.5;
    }
    const invM = 1 / (0.6 * g.size);
    const qx = new Float32Array(n), qz = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      vx[i] = vx[i]! + fx[i]! * invM * dt;
      vz[i] = vz[i]! + fz[i]! * invM * dt;
      qx[i] = px[i]! + vx[i]! * dt;
      qz[i] = pz[i]! + vz[i]! * dt;
    }
    // rigid segments
    for (let it = 0; it < 4; it++)
      for (let i = 0; i < n - 1; i++) {
        const dx = wrap(qx[i + 1]! - qx[i]!), dz = wrap(qz[i + 1]! - qz[i]!);
        const L = Math.hypot(dx, dz) || 1e-6;
        const rest = g.seg[i]! * g.size;
        const corr = ((L - rest) / L) * 0.5;
        qx[i]! += dx * corr;
        qz[i]! += dz * corr;
        qx[i + 1]! -= dx * corr;
        qz[i + 1]! -= dz * corr;
      }
    for (let i = 0; i < n; i++) {
      vx[i] = wrap(qx[i]! - px[i]!) / dt;
      vz[i] = wrap(qz[i]! - pz[i]!) / dt;
      px[i] = ((qx[i]! % 1) + 1) % 1;
      pz[i] = ((qz[i]! % 1) + 1) % 1;
    }
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    const rng = this.rng;
    const st = this.stats();
    const errPop = (fate.targets.population ?? 0.5) - st.population;
    const errPred = (fate.targets.predators ?? 0.1) - st.predators;
    const fertility = Math.exp(Math.max(-2, Math.min(2, errPop * fate.k * 5)));
    // plankton regrows
    for (let i = 0; i < this.food.length; i++) this.food[i] = Math.min(1, this.food[i]! + dt * 0.04);
    const live = this.creatures;
    for (const c of live) {
      c.ox.set(c.px);
      c.oz.set(c.pz);
    }
    for (let ci = live.length - 1; ci >= 0; ci--) {
      const c = live[ci]!;
      c.age += dt;
      if (c.dying) {
        c.alpha -= dt * 1.5;
        if (c.alpha <= 0) live.splice(ci, 1);
        continue;
      }
      if (c.alpha < 1) c.alpha = Math.min(1, c.alpha + dt);
      const g = c.g;
      const hx = c.px[0]!, hz = c.pz[0]!;
      const hdx = wrap(c.px[0]! - c.px[1]!), hdz = wrap(c.pz[0]! - c.pz[1]!);
      const heading = Math.atan2(hdz, hdx);
      // perceive: nearest threat / prey within sight
      let want = heading + Math.sin(this.t * 0.3 + g.pattern * 10) * 0.6;
      let best = g.sight;
      const pred = this.isPred(c);
      for (const o of live) {
        if (o === c || o.dying) continue;
        const dx = wrap(o.px[0]! - hx), dz = wrap(o.pz[0]! - hz);
        const d = Math.hypot(dx, dz);
        if (d > best) continue;
        if (pred && !this.isPred(o) && o.g.size < g.size * 1.05) {
          best = d;
          want = Math.atan2(dz, dx);
          if (d < 0.012 * g.size + 0.006) {
            o.dying = true;
            c.energy += 0.6 * o.g.size;
          }
        } else if (!pred && this.isPred(o)) {
          best = d;
          want = Math.atan2(-dz, -dx);
        }
      }
      let da = want - heading;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      const turnBias = Math.max(-0.5, Math.min(0.5, da * g.turn * 0.5));
      // swim
      c.phase += dt * g.freq * Math.PI * 2;
      const sub = 3;
      for (let s = 0; s < sub; s++) this.physics(c, dt / sub, turnBias);
      c.y += Math.sin(this.t * 0.5 + g.pattern * 6) * dt * 0.02;
      c.y = Math.max(0.08, Math.min(1.1, c.y));
      // metabolism
      const cost = (0.03 + 0.05 * g.amp * g.amp * g.freq * g.size) * dt;
      c.energy -= cost;
      if (!pred) {
        const fi = Math.floor(hx * FOOD_G) + FOOD_G * Math.floor(hz * FOOD_G);
        const eat = Math.min(this.food[fi]!, dt * 0.25);
        this.food[fi]! -= eat;
        c.energy += eat * 0.55;
      }
      if (c.energy <= 0 || c.age > 90) {
        c.dying = true;
        continue;
      }
      // reproduce
      if (c.energy > 1.6 / fertility && live.length < this.maxCells) {
        c.energy *= 0.5;
        let child = this.mutate(g);
        // the fate spring tilts which lineages are favoured
        if (!pred && rng.next() < Math.max(0, errPred) * fate.k * 0.4) child = this.randomGenome(true);
        if (pred && rng.next() < Math.max(0, -errPred) * fate.k * 0.4) child = this.randomGenome(false);
        this.spawn(c.px[c.g.n - 1]!, c.pz[c.g.n - 1]!, child, c.energy, 0);
      }
    }
    // rescue extinction / overshoot gently (rates only)
    if (live.length < 6) for (let i = 0; i < 4; i++) this.spawn(rng.next(), rng.next(), this.randomGenome(rng.next() < (fate.targets.predators ?? 0.1)), 1, 0);
    if (errPop < -0.1 && rng.next() < fate.k * 0.3 && live.length) live[rng.int(0, live.length - 1)]!.dying = true;
    void T;
  }

  snapshot(): SimSnapshot {
    const S = CREATURE_STRIDE;
    const live = this.creatures;
    const out = new Float32Array(live.length * S);
    live.forEach((c, k) => {
      const o = k * S;
      out[o] = c.g.n;
      out[o + 1] = c.g.hue;
      out[o + 2] = c.g.size;
      out[o + 3] = this.isPred(c) ? 1 : 0;
      out[o + 4] = c.y;
      out[o + 5] = Math.max(0, c.alpha);
      out[o + 6] = c.phase;
      out[o + 7] = c.g.pattern;
      for (let i = 0; i < MAX_NODES; i++) {
        const j = Math.min(i, c.g.n - 1);
        out[o + 8 + i * 2] = c.px[j]!;
        out[o + 9 + i * 2] = c.pz[j]!;
        out[o + 20 + i * 2] = c.ox[j]!;
        out[o + 21 + i * 2] = c.oz[j]!;
      }
    });
    const st = this.stats();
    return { agents: out, count: live.length, stride: S, fields: {}, stats: { population: st.population, predators: st.predators }, t: this.t };
  }
}
