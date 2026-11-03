import { PlanetStage } from '../render/stages/PlanetStage';
import { BAND_STRIDE } from '../sim/agents/bands';

/** Chapter 4: bands as firelight on the night side; the dispersal field as a faint glow at speed. */
PlanetStage.overlays[4] = (stage, f) => {
  const ag = f.agents;
  if (!ag || ag.sim !== 'bands') {
    stage.clearOverlays();
    return;
  }
  const field = ag.snap.fields.people;
  const fieldGain = 1 - f.lodMix * 0.75;
  if (field) {
    const d = field.data;
    stage.setEmissive(ag.version, field.w, field.h, (x, y) => {
      const i = (y * field.w + x) * 4;
      const s = d[i]!, n = d[i + 1]!, e = d[i + 2]!;
      return [(s * 0.42 + n * 0.32 + e * 0.26) * fieldGain, (s * 0.2 + n * 0.17 + e * 0.11) * fieldGain, (s * 0.06 + n * 0.08 + e * 0.04) * fieldGain];
    });
  }
  const snap = ag.snap;
  const a = ag.alpha;
  stage.setGlobeAgents(f.lodMix > 0.02 ? snap.count : 0, (i, o) => {
    const k = i * BAND_STRIDE;
    const src = snap.agents;
    let dlon = src[k + 1]! - src[k + 3]!;
    if (dlon > 180) dlon -= 360;
    if (dlon < -180) dlon += 360;
    o.lat = src[k + 2]! + (src[k]! - src[k + 2]!) * a;
    o.lon = src[k + 3]! + dlon * a;
    const lineage = src[k + 5]!;
    const vis = src[k + 7]! * f.lodMix;
    o.size = 0.004 + 0.004 * Math.min(1.5, src[k + 4]!);
    const c = lineage === 2 ? [1.0, 0.55, 0.2] : lineage === 1 ? [0.85, 0.7, 0.45] : [0.9, 0.45, 0.25];
    o.r = c[0]! * vis * 1.8;
    o.g = c[1]! * vis * 1.8;
    o.b = c[2]! * vis * 1.8;
    o.seed = (i * 0.618) % 1;
  });
};
