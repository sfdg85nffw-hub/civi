import * as THREE from 'three/webgpu';
import { T, type N } from './tsl/T';

const { instancedBufferAttribute, positionGeometry, modelViewMatrix, cameraProjectionMatrix, vec4, vec3, vec2, float, varying } = T;

export interface ParticleBuild {
  /** world/local-space centre (vec3 node) computed from the instance attributes */
  center: N;
  /** size (float node) in view-space units */
  size: N;
  /** rgb colour (vec3 node), already lit/emissive */
  color: N;
  /** opacity (float node) */
  alpha?: N;
  /** optional quad rotation in radians */
  rotation?: N;
  /** optional fragment shape override: function(uvCentred vec2) → mask */
  shape?: (p: N) => N;
  /** optional full fragment override: function(uvCentred vec2) → vec4 (rgb, alpha) */
  fragment?: (p: N) => N;
}

export interface ParticleOptions {
  count: number;
  /** per-instance attributes: name → [array, itemSize] */
  attributes: Record<string, [Float32Array, number]>;
  blending?: THREE.Blending;
  depthWrite?: boolean;
  depthTest?: boolean;
  build: (attr: Record<string, N>) => ParticleBuild;
  renderOrder?: number;
  /** soft round sprite falloff exponent */
  softness?: number;
}

/**
 * Camera-facing instanced quads with fully custom TSL motion. Portable to the
 * WebGPU and WebGL2 backends (no point-size dependency, no compute).
 */
export function makeParticles(o: ParticleOptions): THREE.Mesh {
  const geo = new THREE.InstancedBufferGeometry();
  const base = new THREE.PlaneGeometry(1, 1);
  geo.index = base.index;
  geo.setAttribute('position', base.getAttribute('position'));
  geo.setAttribute('uv', base.getAttribute('uv'));
  geo.instanceCount = o.count;
  const attrNodes: Record<string, N> = {};
  const bufAttrs: Record<string, THREE.InstancedBufferAttribute> = {};
  for (const k in o.attributes) {
    const [arr, size] = o.attributes[k]!;
    const a = new THREE.InstancedBufferAttribute(arr, size);
    bufAttrs[k] = a;
    geo.setAttribute(k, a);
    attrNodes[k] = instancedBufferAttribute(a);
  }
  const b = o.build(attrNodes);
  const mat = new THREE.MeshBasicNodeMaterial({
    transparent: true,
    depthWrite: o.depthWrite ?? false,
    depthTest: o.depthTest ?? true,
    blending: o.blending ?? THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const corner = positionGeometry.xy;
  let off = corner.mul(b.size);
  if (b.rotation) {
    const c = b.rotation.cos();
    const s = b.rotation.sin();
    off = vec2(off.x.mul(c).sub(off.y.mul(s)), off.x.mul(s).add(off.y.mul(c)));
  }
  const viewCenter = modelViewMatrix.mul(vec4(b.center, 1.0));
  mat.vertexNode = cameraProjectionMatrix.mul(vec4(viewCenter.xyz.add(vec3(off, 0.0)), 1.0));
  const vColor = varying(b.color);
  const vAlpha = varying(b.alpha ?? float(1));
  const p = varying(corner.mul(2.0));
  const shape = b.shape ? b.shape(p) : float(1.0).sub(p.dot(p)).max(0.0).pow(o.softness ?? 2.0);
  const additive = (o.blending ?? THREE.AdditiveBlending) === THREE.AdditiveBlending;
  mat.colorNode = b.fragment ? b.fragment(p) : additive ? vec4(vColor.mul(shape).mul(vAlpha), 1.0) : vec4(vColor, shape.mul(vAlpha));
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = o.renderOrder ?? 10;
  mesh.userData.attrs = bufAttrs;
  return mesh;
}
