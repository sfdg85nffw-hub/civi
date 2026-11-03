import * as THREE from 'three/webgpu';

/**
 * Naive Surface Nets: polygonise a signed distance field (negative inside).
 * Produces smooth organic meshes without marching-cubes tables.
 */
export function surfaceNets(
  sdf: (x: number, y: number, z: number) => number,
  min: [number, number, number],
  max: [number, number, number],
  step: number,
): THREE.BufferGeometry {
  const nx = Math.ceil((max[0] - min[0]) / step) + 1;
  const ny = Math.ceil((max[1] - min[1]) / step) + 1;
  const nz = Math.ceil((max[2] - min[2]) / step) + 1;
  const field = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number): number => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++) field[at(i, j, k)] = sdf(min[0] + i * step, min[1] + j * step, min[2] + k * step);

  const cellVert = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cAt = (i: number, j: number, k: number): number => i + (nx - 1) * (j + (ny - 1) * k);
  const pos: number[] = [];
  const corners = [
    [0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1],
  ];
  const edges = [
    [0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7],
  ];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const cc = corners[c]!;
          v[c] = field[at(i + cc[0]!, j + cc[1]!, k + cc[2]!)]!;
          if (v[c]! < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0, sy = 0, sz = 0, n = 0;
        for (const [a, b] of edges) {
          const va = v[a!]!, vb = v[b!]!;
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          const ca = corners[a!]!, cb = corners[b!]!;
          sx += ca[0]! + (cb[0]! - ca[0]!) * t;
          sy += ca[1]! + (cb[1]! - ca[1]!) * t;
          sz += ca[2]! + (cb[2]! - ca[2]!) * t;
          n++;
        }
        cellVert[cAt(i, j, k)] = pos.length / 3;
        pos.push(min[0] + (i + sx / n) * step, min[1] + (j + sy / n) * step, min[2] + (k + sz / n) * step);
      }
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number, flip: boolean): void => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) idx.push(a, b, c, a, c, d);
    else idx.push(a, c, b, a, d, c);
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const v0 = field[at(i, j, k)]! < 0;
        // x edge
        if (i < nx - 1 && v0 !== field[at(i + 1, j, k)]! < 0)
          quad(cellVert[cAt(i, j - 1, k - 1)]!, cellVert[cAt(i, j, k - 1)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i, j - 1, k)]!, v0);
        // y edge
        if (j < ny - 1 && v0 !== field[at(i, j + 1, k)]! < 0)
          quad(cellVert[cAt(i - 1, j, k - 1)]!, cellVert[cAt(i - 1, j, k)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i, j, k - 1)]!, v0);
        // z edge
        if (k < nz - 1 && v0 !== field[at(i, j, k + 1)]! < 0)
          quad(cellVert[cAt(i - 1, j - 1, k)]!, cellVert[cAt(i, j - 1, k)]!, cellVert[cAt(i, j, k)]!, cellVert[cAt(i - 1, j, k)]!, v0);
      }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(pos.length / 3 > 65535 ? new THREE.BufferAttribute(new Uint32Array(idx), 1) : new THREE.BufferAttribute(new Uint16Array(idx), 1));
  geo.computeVertexNormals();
  return geo;
}

/** Polynomial smooth minimum. */
export function smin(a: number, b: number, k: number): number {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** Distance to a round cone segment between a (radius ra) and b (radius rb). */
export function capsuleDist(px: number, py: number, pz: number, a: number[], b: number[], ra: number, rb: number): number {
  const bax = b[0]! - a[0]!, bay = b[1]! - a[1]!, baz = b[2]! - a[2]!;
  const pax = px - a[0]!, pay = py - a[1]!, paz = pz - a[2]!;
  const h = Math.max(0, Math.min(1, (pax * bax + pay * bay + paz * baz) / (bax * bax + bay * bay + baz * baz)));
  const dx = pax - bax * h, dy = pay - bay * h, dz = paz - baz * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - (ra + (rb - ra) * h);
}
