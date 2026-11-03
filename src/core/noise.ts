import { hash01 } from './rng';

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);

/** Smooth 1D value noise in [-1,1]. */
export function noise1(x: number, seed = 0): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = hash01(i, seed) * 2 - 1;
  const b = hash01(i + 1, seed) * 2 - 1;
  return a + (b - a) * fade(f);
}

/** Smooth 2D value noise in [-1,1]. */
export function noise2(x: number, y: number, seed = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const h = (a: number, b: number): number => hash01(a, b, seed) * 2 - 1;
  const v00 = h(ix, iy), v10 = h(ix + 1, iy), v01 = h(ix, iy + 1), v11 = h(ix + 1, iy + 1);
  return (v00 + (v10 - v00) * fx) * (1 - fy) + (v01 + (v11 - v01) * fx) * fy;
}

/** Smooth 3D value noise in [-1,1]. */
export function noise3(x: number, y: number, z: number, seed = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const h = (a: number, b: number, c: number): number => hash01(a, b, c, seed) * 2 - 1;
  const l = (a: number, b: number, t: number): number => a + (b - a) * t;
  return l(
    l(l(h(ix, iy, iz), h(ix + 1, iy, iz), fx), l(h(ix, iy + 1, iz), h(ix + 1, iy + 1, iz), fx), fy),
    l(l(h(ix, iy, iz + 1), h(ix + 1, iy, iz + 1), fx), l(h(ix, iy + 1, iz + 1), h(ix + 1, iy + 1, iz + 1), fx), fy),
    fz,
  );
}

export function fbm2(x: number, y: number, oct = 4, seed = 0): number {
  let a = 0.5, s = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise2(x, y, seed + i * 31);
    n += a;
    x *= 2.03;
    y *= 2.03;
    a *= 0.5;
  }
  return s / n;
}

export function fbm3(x: number, y: number, z: number, oct = 4, seed = 0): number {
  let a = 0.5, s = 0, n = 0;
  for (let i = 0; i < oct; i++) {
    s += a * noise3(x, y, z, seed + i * 31);
    n += a;
    x *= 2.03;
    y *= 2.03;
    z *= 2.03;
    a *= 0.5;
  }
  return s / n;
}
