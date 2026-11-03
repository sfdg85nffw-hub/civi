import { Rng } from '../../core/rng';
import { FateField } from '../../fate/FateField';
import type { AgentSim, FateInput, SimSnapshot } from '../types';

/**
 * THE LIVING LAND — local rules for Chapter 3.
 *
 * Plants regrow logistically on a grid. Herbivores graze, flee and breed;
 * predators hunt within their sight. Every animal carries heritable traits
 * (speed, size, sight, stealth/camouflage); fast bodies cost more energy, so
 * arms races and boom–bust (Lotka–Volterra) cycles emerge on their own. The
 * fate field touches only global rates: plant productivity, and an
 * extinction "stress" that raises mortality at the Permian and K–Pg dates.
 */
export const ECO_STRIDE = 8;
const PG = 64;

export const ECO_FATE = new FateField(
  {
    plants: [[-4.7e8, 0.15], [-3.85e8, 0.5], [-3.0e8, 0.9], [-2.6e8, 0.5], [-2.52e8, 0.15], [-2.4e8, 0.35], [-2.0e8, 0.55], [-6.6001e7, 0.75], [-6.59e7, 0.1], [-6.4e7, 0.6], [-5.0e7, 0.85]],
    stress: [[-2.535e8, 0], [-2.522e8, 0.9], [-2.5e8, 0.4], [-2.45e8, 0], [-6.60002e7, 0], [-6.5999e7, 0.95], [-6.58e7, 0.3], [-6.5e7, 0]],
    animals: [[-4.0e8, 0.1], [-3.6e8, 0.35], [-3.0e8, 0.6], [-2.53e8, 0.6], [-2.5e8, 0.12], [-2.3e8, 0.55], [-6.6e7, 0.7], [-6.59e7, 0.08], [-6.0e7, 0.6]],
  },
  [-3.85e8, -2.52e8, -2.3e8, -6.6e7, -5.5e7],
);

interface Animal {
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  pred: boolean;
  speed: number;
  size: number;
  sight: number;
  stealth: number;
  energy: number;
  age: number;
  alpha: number;
  dying: boolean;
}

const wrap = (d: number): number => (d > 0.5 ? d - 1 : d < -0.5 ? d + 1 : d);

export class EcosystemSim implements AgentSim {
  readonly id = 'ecosystem';
  readonly stride = ECO_STRIDE;
  maxCells = 900;
  private rng = new Rng(1);
  plants = new Float32Array(PG * PG);
  animals: Animal[] = [];
  private t = 0;
  private lod = 0;

  init(seed: number, T: number, fate: FateInput): void {
    this.rng = Rng.stream(seed, 'ecosystem');
    this.t = 0;
    const p = fate.targets.plants ?? 0.5;
    for (let i = 0; i < this.plants.length; i++) this.plants[i] = Math.min(1, p * (0.5 + this.rng.next()));
    this.animals = [];
    const n = Math.round((fate.targets.animals ?? 0.4) * this.maxCells * 0.8);
    for (let i = 0; i < n; i++) this.spawn(this.rng.next(), this.rng.next(), this.rng.next() < 0.14, null, 1);
    void T;
  }

  setLOD(mix: number): void {
    this.lod = mix;
  }

  private spawn(x: number, y: number, pred: boolean, parent: Animal | null, alpha: number): void {
    if (this.animals.length >= this.maxCells) return;
    const r = this.rng;
    const m = (v: number, s: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, v + r.normal(0, s)));
    const a: Animal = parent
      ? { x, y, px: x, py: y, vx: 0, vy: 0, pred, speed: m(parent.speed, 0.04, 0.2, 1.6), size: m(parent.size, 0.05, 0.4, 2.0), sight: m(parent.sight, 0.004, 0.01, 0.12), stealth: m(parent.stealth, 0.04, 0, 1), energy: parent.energy, age: 0, alpha, dying: false }
      : { x, y, px: x, py: y, vx: 0, vy: 0, pred, speed: r.range(0.4, 0.9), size: pred ? r.range(1.0, 1.5) : r.range(0.6, 1.1), sight: r.range(0.03, 0.07), stealth: r.range(0, 0.5), energy: r.range(0.5, 1.0), age: 0, alpha, dying: false };
    this.animals.push(a);
  }

  stats(): { plants: number; animals: number; herbivores: number; predators: number; speed: number } {
    let s = 0;
    for (let i = 0; i < this.plants.length; i++) s += this.plants[i]!;
    let h = 0, p = 0, sp = 0;
    for (const a of this.animals) {
      if (a.dying) continue;
      if (a.pred) p++;
      else {
        h++;
        sp += a.speed;
      }
    }
    return { plants: s / this.plants.length, animals: (h + p) / this.maxCells, herbivores: h, predators: p, speed: h ? sp / h : 0 };
  }

  step(dt: number, T: number, fate: FateInput): void {
    this.t += dt;
    const r = this.rng;
    const tg = fate.targets;
    const stress = tg.stress ?? 0;
    const st = this.stats();
    // plants: logistic regrowth nudged toward the canonical productivity
    const prod = 0.12 * (1 + (fate.k * ((tg.plants ?? 0.5) - st.plants)) * 3) * (1 - stress * 0.9);
    for (let i = 0; i < this.plants.length; i++) {
      const v = this.plants[i]!;
      this.plants[i] = Math.max(0, Math.min(1, v + dt * (prod * v * (1 - v) + 0.002) - dt * stress * 0.15 * v));
    }
    const errA = (tg.animals ?? 0.4) - st.animals;
    const fert = Math.exp(Math.max(-2, Math.min(2, errA * fate.k * 4)));
    // spatial hash
    const HG = 32;
    const cells: number[][] = Array.from({ length: HG * HG }, () => []);
    this.animals.forEach((a, i) => cells[(Math.floor(a.y * HG) % HG) * HG + (Math.floor(a.x * HG) % HG)]!.push(i));
    const born: [number, number, boolean, Animal][] = [];
    for (const a of this.animals) {
      a.px = a.x;
      a.py = a.y;
      a.age += dt;
      if (a.dying) {
        a.alpha -= dt * 1.3;
        continue;
      }
      if (a.alpha < 1) a.alpha = Math.min(1, a.alpha + dt);
      // perception
      let tx = 0, ty = 0, best = a.sight;
      let target: Animal | null = null;
      const cx = Math.floor(a.x * HG), cy = Math.floor(a.y * HG);
      const reach = Math.ceil(a.sight * HG) + 1;
      for (let oy = -reach; oy <= reach; oy++)
        for (let ox = -reach; ox <= reach; ox++) {
          const list = cells[(((cy + oy) % HG) + HG) % HG * HG + ((((cx + ox) % HG) + HG) % HG)]!;
          for (const j of list) {
            const b = this.animals[j]!;
            if (b === a || b.dying) continue;
            const dx = wrap(b.x - a.x), dy = wrap(b.y - a.y);
            const d = Math.hypot(dx, dy);
            if (a.pred && !b.pred) {
              const seen = a.sight * (1 - 0.5 * b.stealth);
              if (d < Math.min(best, seen)) {
                best = d;
                target = b;
                tx = dx;
                ty = dy;
              }
            } else if (!a.pred && b.pred) {
              const seen = a.sight * (1 - 0.6 * b.stealth);
              if (d < seen) {
                tx -= dx / (d + 1e-4);
                ty -= dy / (d + 1e-4);
              }
            }
          }
        }
      const spd = a.speed * 0.05 * (a.pred ? 1.05 : 1);
      let dirx: number, diry: number;
      if (a.pred && target) {
        dirx = tx;
        diry = ty;
        if (best < 0.006 * (a.size + target.size)) {
          // the faster, larger body usually wins
          const pWin = 0.55 + 0.3 * (a.size - target.size) + 0.3 * (a.speed - target.speed);
          if (r.next() < pWin) {
            target.dying = true;
            a.energy += 0.7 * target.size;
          } else a.energy -= 0.05;
        }
      } else if (!a.pred && (tx !== 0 || ty !== 0)) {
        dirx = tx;
        diry = ty;
      } else {
        // wander toward greener ground
        const gi = (Math.floor(a.y * PG) % PG) * PG + (Math.floor(a.x * PG) % PG);
        const ang = Math.atan2(a.vy, a.vx) + r.normal(0, 0.6);
        dirx = Math.cos(ang);
        diry = Math.sin(ang);
        if (!a.pred) {
          const g0 = this.plants[gi]!;
          const ax = (Math.floor(a.x * PG) + 1) % PG, ay = (Math.floor(a.y * PG) + 1) % PG;
          dirx += (this.plants[(Math.floor(a.y * PG) % PG) * PG + ax]! - g0) * 6;
          diry += (this.plants[ay * PG + (Math.floor(a.x * PG) % PG)]! - g0) * 6;
        }
      }
      const l = Math.hypot(dirx, diry) || 1;
      a.vx += ((dirx / l) * spd - a.vx) * Math.min(1, dt * 3);
      a.vy += ((diry / l) * spd - a.vy) * Math.min(1, dt * 3);
      a.x = (((a.x + a.vx * dt) % 1) + 1) % 1;
      a.y = (((a.y + a.vy * dt) % 1) + 1) % 1;
      // metabolism: speed is expensive
      a.energy -= dt * (0.04 + 0.09 * a.speed * a.speed * a.size + stress * 0.5 + (a.pred ? 0.03 : 0));
      if (!a.pred) {
        const gi = (Math.floor(a.y * PG) % PG) * PG + (Math.floor(a.x * PG) % PG);
        const eat = Math.min(this.plants[gi]!, dt * 0.22 * a.size);
        this.plants[gi]! -= eat;
        a.energy += eat * 0.9;
      }
      if (a.energy <= 0 || a.age > 60 + r.next() * 30) a.dying = true;
      else if (a.energy > (a.pred ? 1.8 : 1.3) / fert) {
        a.energy *= 0.5;
        born.push([a.x, a.y, a.pred, a]);
      }
    }
    this.animals = this.animals.filter((a) => !(a.dying && a.alpha <= 0));
    for (const [x, y, p, parent] of born) this.spawn(x, y, p, parent, 0);
    // keep both trophic levels from vanishing entirely (immigration from beyond the frame)
    if (st.predators < 3) this.spawn(r.next(), r.next(), true, null, 0);
    if (st.herbivores < 10) for (let i = 0; i < 3; i++) this.spawn(r.next(), r.next(), false, null, 0);
    void T;
  }

  snapshot(): SimSnapshot {
    const S = ECO_STRIDE;
    const out = new Float32Array(this.animals.length * S);
    this.animals.forEach((a, k) => {
      out.set([a.x, a.y, a.px, a.py, a.pred ? 1 : 0, a.size, a.speed, Math.max(0, a.alpha)], k * S);
    });
    const field = new Float32Array(PG * PG * 4);
    for (let i = 0; i < PG * PG; i++) field[i * 4] = this.plants[i]!;
    // animal density (for the field representation at speed)
    for (const a of this.animals) {
      const i = (Math.floor(a.y * PG) % PG) * PG + (Math.floor(a.x * PG) % PG);
      field[i * 4 + (a.pred ? 2 : 1)]! += 0.25;
    }
    const st = this.stats();
    return { agents: out, count: this.animals.length, stride: S, fields: { land: { data: field, w: PG, h: PG, ch: 4 } }, stats: st, t: this.t };
  }
}
