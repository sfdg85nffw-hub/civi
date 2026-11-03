import * as THREE from 'three/webgpu';
import { T, type N } from './T';

/**
 * A shared, tileable 3D value-noise texture (64³, four octaves in RGBA).
 * Sampling it costs one texture fetch instead of ~100 ALU ops of gradient
 * noise — essential inside raymarch loops.
 */
let tex: THREE.Data3DTexture | null = null;
const S = 64;

function lattice(seed: number, n: number): Float32Array {
  const a = new Float32Array(n * n * n);
  let s = seed >>> 0 || 1;
  for (let i = 0; i < a.length; i++) {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    a[i] = (s >>> 0) / 4294967296;
  }
  return a;
}

export function noiseTexture(): THREE.Data3DTexture {
  if (tex) return tex;
  const data = new Uint8Array(S * S * S * 4);
  const fade = (t: number): number => t * t * (3 - 2 * t);
  for (let o = 0; o < 4; o++) {
    const n = 4 << o; // lattice cells per tile: 4, 8, 16, 32
    const L = lattice(0x51f0 + o * 977, n);
    const at = (x: number, y: number, z: number): number => L[((x % n) + n) % n + n * ((((y % n) + n) % n) + n * (((z % n) + n) % n))]!;
    for (let z = 0; z < S; z++)
      for (let y = 0; y < S; y++)
        for (let x = 0; x < S; x++) {
          const fx = (x / S) * n, fy = (y / S) * n, fz = (z / S) * n;
          const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
          const ux = fade(fx - ix), uy = fade(fy - iy), uz = fade(fz - iz);
          const l = (a: number, b: number, t: number): number => a + (b - a) * t;
          const v = l(
            l(l(at(ix, iy, iz), at(ix + 1, iy, iz), ux), l(at(ix, iy + 1, iz), at(ix + 1, iy + 1, iz), ux), uy),
            l(l(at(ix, iy, iz + 1), at(ix + 1, iy, iz + 1), ux), l(at(ix, iy + 1, iz + 1), at(ix + 1, iy + 1, iz + 1), ux), uy),
            uz,
          );
          data[(x + S * (y + S * z)) * 4 + o] = Math.round(v * 255);
        }
  }
  tex = new THREE.Data3DTexture(data, S, S, S);
  tex.format = THREE.RGBAFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.generateMipmaps = false;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

/** Signed value noise in ~[-1,1] at position p (one octave = channel). */
export function vnoise(p: N, channel: 'r' | 'g' | 'b' | 'a' = 'g'): N {
  return T.texture3D(noiseTexture(), p).sample ? T.texture3D(noiseTexture(), p)[channel].mul(2.0).sub(1.0) : T.texture3D(noiseTexture(), p)[channel].mul(2.0).sub(1.0);
}

/** Cheap fbm: weighted sum of the four octaves. */
export function vfbm(p: N): N {
  const s = T.texture3D(noiseTexture(), p);
  return T.dot(s, T.vec4(0.5, 0.25, 0.15, 0.1)).mul(2.0).sub(1.0);
}
