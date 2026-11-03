import { describe, expect, it } from 'vitest';
import { surfaceNets } from '../src/render/surfaceNets';

describe('surface nets', () => {
  it('meshes a sphere with outward normals', () => {
    const g = surfaceNets((x, y, z) => Math.hypot(x, y, z) - 1, [-1.3, -1.3, -1.3], [1.3, 1.3, 1.3], 0.1);
    const p = g.getAttribute('position');
    const n = g.getAttribute('normal');
    let dotSum = 0;
    let rErr = 0;
    for (let i = 0; i < p.count; i++) {
      const r = Math.hypot(p.getX(i), p.getY(i), p.getZ(i));
      rErr = Math.max(rErr, Math.abs(r - 1));
      dotSum += (p.getX(i) * n.getX(i) + p.getY(i) * n.getY(i) + p.getZ(i) * n.getZ(i)) / r;
    }
    expect(p.count).toBeGreaterThan(500);
    expect(rErr).toBeLessThan(0.06);
    expect(dotSum / p.count).toBeGreaterThan(0.9);
  });
});
