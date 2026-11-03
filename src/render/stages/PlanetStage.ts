import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { ATMO_R, raySphere, scatter, type AtmoUniforms } from '../tsl/atmosphere';
import { makeParticles } from '../particles';
import { vnoise } from '../tsl/noiseTex';
import { NPLATES, plateRotations, qInv, qRot, ll, type Quat } from '../../data/paleo';
import { DATACENTERS, LAST_LIGHT, LAST_LIGHT_T } from '../../data/singularity';
import { Rng } from '../../core/rng';
import { clamp01, damp, DEG, lerp, smoothstep } from '../../core/math';
import landmaskUrl from '../../assets/earth/landmask.png?url';

const {
  uniform, uniformArray, vec2, vec3, vec4, float, Fn, texture, uv, mix, smoothstep: sst, positionLocal, positionWorld, normalize, dot,
  cameraPosition, max, min, abs, exp, pow, sin, cos, asin, atan, clamp, mx_noise_float, mx_fractal_noise_float, length, select, fract,
  floor, step, cross, mx_worley_noise_float,
} = T;

/** Shared GPU resources that outlive stages (the land mask), preloaded at boot. */
let maskLinear: THREE.Texture | null = null;
let maskNearest: THREE.Texture | null = null;
export async function preloadPlanetAssets(): Promise<void> {
  if (maskLinear) return;
  const img = await new THREE.ImageLoader().loadAsync(landmaskUrl);
  const mk = (filter: THREE.MinificationTextureFilter & THREE.MagnificationTextureFilter): THREE.Texture => {
    const t = new THREE.Texture(img);
    t.colorSpace = THREE.NoColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.generateMipmaps = false;
    t.minFilter = filter;
    t.magFilter = filter;
    t.needsUpdate = true;
    return t;
  };
  maskLinear = mk(THREE.LinearFilter);
  maskNearest = mk(THREE.NearestFilter);
}
function loadMask(): { lin: THREE.Texture; near: THREE.Texture } {
  if (!maskLinear || !maskNearest) throw new Error('planet assets not preloaded');
  return { lin: maskLinear, near: maskNearest };
}

/** Rotate v by quaternion q (TSL). */
const qrot = (q: N, v: N): N => {
  const u = q.xyz;
  const t = cross(u, v).mul(2.0);
  return v.add(t.mul(q.w)).add(cross(u, t));
};

export interface PlanetParams {
  lat: number;
  lon: number;
  spin: number; // degrees of longitude drift over the shot
  sunAz: number; // degrees, 0 = sun behind camera
  sunEl: number;
  moon: number; // 0..1 visibility
}

/**
 * Earth from orbit: paleogeography baked from rotated plates, a fate-driven
 * surface (ice, iron seas, vegetation, lights…), clouds, ocean glint and a
 * Rayleigh/Mie/haze atmosphere. Chapter overlays attach to `overlay`.
 */
export class PlanetStage extends Stage {
  readonly name = 'planet';
  static renderer: THREE.WebGPURenderer | null = null;
  readonly planet = new THREE.Group(); // rotates with the globe (overlays attach here)
  readonly overlay = new THREE.Group();
  private bakeRT!: THREE.RenderTarget;
  private bakeQuad!: THREE.QuadMesh;
  private lastBakeKey = '';
  private bakeFrames = 0;
  private plateU: N;
  readonly u = {
    sun: uniform(new THREE.Vector3(0.6, 0.3, 0.75).normalize()),
    sunI: uniform(4.8),
    rayleigh: uniform(new THREE.Vector3(11.0, 26.0, 64.0)),
    mie: uniform(9.0),
    hazeS: uniform(new THREE.Vector3(70, 30, 7)),
    hazeA: uniform(new THREE.Vector3(10, 48, 170)),
    haze: uniform(0.8),
    density: uniform(1.0),
    time: uniform(0),
    landLevel: uniform(0.3),
    o2: uniform(0),
    ice: uniform(0),
    oceanIron: uniform(1),
    bandedIron: uniform(0),
    purpleSea: uniform(0),
    volcanism: uniform(1),
    bombardment: uniform(1),
    mats: uniform(0),
    vegetation: uniform(0),
    vitality: uniform(1),
    clouds: uniform(0.5),
    cloudT: uniform(0),
    agriculture: uniform(0),
    smog: uniform(0),
    traps: uniform(0),
    trapsDir: uniform(new THREE.Vector3(0, 1, 0)),
    nightBoost: uniform(1),
    sunLocal: uniform(new THREE.Vector3(1, 0, 0)),
    speckle: uniform(1),
    lattice: uniform(0),
    latticeHole: uniform(0.0),
    lastLightDir: uniform(new THREE.Vector3(0, 0, 1)),
    datacenters: uniform(0),
    moonlight: uniform(0.035),
    speckleLo: uniform(0.72),
    stars: uniform(0.2),
    limb: uniform(1.6),
    exposure: uniform(1),
    impactWinter: uniform(0),
    impactDir: uniform(new THREE.Vector3(0, 0, 1)),
    impactFlash: uniform(0),
    curtain: uniform(0),
    ejecta: uniform(0),
    crater: uniform(0),
    firestorm: uniform(0),
    relief: uniform(0),
  };
  /** emissive night-side layer (equirect, present-day coords) set by chapter overlays */
  /** emissive night-side layer (360×180 equirect, present-day coords), written by chapter overlays */
  readonly lightsData = new Uint8Array(360 * 180 * 4);
  readonly lightsTex = new THREE.DataTexture(this.lightsData, 360, 180, THREE.RGBAFormat, THREE.UnsignedByteType);
  private lightsVersion = -1;
  private lightsCleared = true;
  /** agents drawn on the globe (bands, settlements, cities, lattice nodes) */
  private gAttr!: { a: THREE.InstancedBufferAttribute; b: THREE.InstancedBufferAttribute };
  private gMesh!: THREE.Mesh;
  static readonly MAX_GLOBE_AGENTS = 1600;
  /** per-chapter overlay writers (registered by chapter modules) */
  static overlays: Record<number, (stage: PlanetStage, f: FrameContext) => void> = {};
  readonly uLights: N;
  private moon!: THREE.Mesh;
  private stars!: THREE.Mesh;
  private atmo!: THREE.Mesh;
  private smoothed: Record<string, number> = {};
  private lastImpactU = 0;
  private lastImpactShot = '';
  params: PlanetParams = { lat: 10, lon: 20, spin: 8, sunAz: 55, sunEl: 12, moon: 0 };

  private dcU: N;
  private dcE1: N;
  private dcE2: N;
  constructor() {
    super();
    this.dcU = uniformArray(DATACENTERS.map(([la, lo]) => {
      const v = ll(la, lo);
      return new THREE.Vector4(v[0], v[1], v[2], 0);
    }), 'vec4');
    // each datacenter nucleates its own crystal grain with its own lattice orientation
    const e1s: THREE.Vector4[] = [], e2s: THREE.Vector4[] = [];
    DATACENTERS.forEach(([la, lo], i) => {
      const c = new THREE.Vector3(...ll(la, lo));
      const up = Math.abs(c.y) > 0.95 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
      const a = new THREE.Vector3().crossVectors(up, c).normalize();
      const b = new THREE.Vector3().crossVectors(c, a).normalize();
      const th = ((i * 0.618034) % 1) * (Math.PI / 3);
      const e1 = a.clone().multiplyScalar(Math.cos(th)).addScaledVector(b, Math.sin(th));
      const e2 = new THREE.Vector3().crossVectors(c, e1);
      e1s.push(new THREE.Vector4(e1.x, e1.y, e1.z, 0));
      e2s.push(new THREE.Vector4(e2.x, e2.y, e2.z, 0));
    });
    this.dcE1 = uniformArray(e1s, 'vec4');
    this.dcE2 = uniformArray(e2s, 'vec4');
    const lv = ll(LAST_LIGHT[0], LAST_LIGHT[1]);
    (this.u.lastLightDir.value as THREE.Vector3).set(lv[0], lv[1], lv[2]);
    this.plateU = uniformArray(Array.from({ length: NPLATES }, () => new THREE.Vector4(0, 0, 0, 1)), 'vec4');
    this.lightsTex.magFilter = THREE.LinearFilter;
    this.lightsTex.minFilter = THREE.LinearFilter;
    this.lightsTex.wrapS = THREE.RepeatWrapping;
    this.lightsTex.generateMipmaps = false;
    this.lightsTex.flipY = false;
    this.lightsTex.needsUpdate = true;
    this.uLights = texture(this.lightsTex);
  }

  get atmoUniforms(): AtmoUniforms {
    const u = this.u;
    return { sun: u.sun, sunI: u.sunI, rayleigh: u.rayleigh, mie: u.mie, hazeS: u.hazeS, hazeA: u.hazeA, haze: u.haze, density: u.density };
  }

  build(): void {
    this.post = { bloom: 0.3, threshold: 1.1, exposure: 1.0, grain: 0.03, vignette: 0.3, chroma: 0.0005 };
    this.camera.near = 0.01;
    this.camera.far = 2000;
    this.scene.background = new THREE.Color(0, 0, 0);
    this.buildBake();
    this.scene.add(this.planet);
    this.planet.add(this.overlay);
    const q = this.scene.userData;
    q.quality = 1;
    this.planet.add(new THREE.Mesh(new THREE.SphereGeometry(1, 384, 192), this.surfaceMaterial()));
    this.atmo = new THREE.Mesh(new THREE.SphereGeometry(ATMO_R, 160, 80), this.atmoMaterial());
    this.atmo.renderOrder = 20;
    this.scene.add(this.atmo);
    this.stars = this.buildStars();
    this.scene.add(this.stars);
    this.moon = this.buildMoon();
    this.planet.add(this.buildBolide());
    this.gMesh = this.buildGlobeAgents();
    this.planet.add(this.gMesh);
    this.scene.add(this.moon);
  }

  // ---------------------------------------------------------------- bake
  private buildBake(): void {
    const { lin, near } = loadMask();
    this.bakeRT = new THREE.RenderTarget(2048, 1024, { type: THREE.HalfFloatType, depthBuffer: false });
    this.bakeRT.texture.wrapS = THREE.RepeatWrapping;
    this.bakeRT.texture.generateMipmaps = false;
    this.bakeRT.texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.MeshBasicNodeMaterial();
    const plates = this.plateU;
    mat.colorNode = Fn(() => {
      const q = uv();
      const lat = q.y.sub(0.5).mul(Math.PI);
      const lon = q.x.sub(0.5).mul(Math.PI * 2);
      const p = vec3(cos(lat).mul(sin(lon)), sin(lat), cos(lat).mul(cos(lon)));
      const best = float(-1.0).toVar();
      const relief = float(0).toVar();
      const plate = float(0).toVar();
      for (let i = 0; i < NPLATES; i++) {
        const p0 = qrot(plates.element(i), p);
        const la = asin(clamp(p0.y, -1.0, 1.0));
        const lo = atan(p0.x, p0.z);
        const uv0 = vec2(lo.div(Math.PI * 2).add(0.5), la.div(Math.PI).add(0.5));
        const idS = texture(near, uv0).g.mul(255.0 / 16.0).floor();
        const s = texture(lin, uv0);
        const e = s.r.mul(255.0).sub(128.0).div(127.0);
        const ok = abs(idS.sub(i)).lessThan(0.5).and(e.greaterThan(best));
        best.assign(select(ok, e, best));
        relief.assign(select(ok, s.b, relief));
        plate.assign(select(ok, float(i), plate));
      }
      return vec4(best, relief, plate.div(16.0), 1.0);
    })();
    this.bakeQuad = new THREE.QuadMesh(mat);
  }

  private bake(Ma: number): void {
    const r = PlanetStage.renderer;
    if (!r) return;
    const rots = plateRotations(Ma);
    const key = rots.map((q) => q.map((x) => x.toFixed(4)).join(',')).join('|');
    if (key === this.lastBakeKey && this.bakeFrames > 2) return;
    this.lastBakeKey = key;
    this.bakeFrames++;
    rots.forEach((q, i) => {
      const inv = qInv(q);
      (this.plateU.array[i] as THREE.Vector4).set(inv[0], inv[1], inv[2], inv[3]);
    });
    // Siberian Traps location in paleo coordinates
    const tr = qRot(rots[3]!, ll(62, 98));
    (this.u.trapsDir.value as THREE.Vector3).set(tr[0], tr[1], tr[2]);
    // Chicxulub, Yucatán, carried by the North American plate
    const ic = qRot(rots[0]!, ll(21.3, -89.5));
    (this.u.impactDir.value as THREE.Vector3).set(ic[0], ic[1], ic[2]);
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.bakeRT);
    this.bakeQuad.render(r);
    r.setRenderTarget(prev);
  }

  // ---------------------------------------------------------------- surface
  private surfaceMaterial(): THREE.MeshBasicNodeMaterial {
    const u = this.u;
    const mat = new THREE.MeshBasicNodeMaterial();
    const bakeTex = this.bakeRT.texture;
    const lights = this.uLights;
    const atmoU = this.atmoUniforms;
    mat.colorNode = Fn(() => {
      const n = normalize(positionLocal);
      const lat = asin(clamp(n.y, -1.0, 1.0));
      const lon = atan(n.x, n.z);
      const uvE = vec2(lon.div(Math.PI * 2).add(0.5), lat.div(Math.PI).add(0.5));
      const m = texture(bakeTex, uvE);
      const e = m.r;
      const relief = m.g;
      // fine detail roughens coasts and textures land
      const d1 = mx_fractal_noise_float(n.mul(6.0), 4, 2.0, 0.5);
      const d2 = mx_noise_float(n.mul(38.0));
      const hgt = e.sub(u.landLevel).add(d1.mul(0.05)).add(d2.mul(0.012));
      const land = sst(-0.004, 0.004, hgt);
      const absLat = abs(lat).div(Math.PI / 2);
      const cont = clamp(hgt.mul(2.2), 0.0, 1.0); // continentality
      // ---- land ----
      const basalt = vec3(0.085, 0.075, 0.068);
      const redBeds = vec3(0.24, 0.11, 0.06);
      const sand = vec3(0.42, 0.31, 0.18);
      const ochre = vec3(0.36, 0.22, 0.1);
      const tropic = vec3(0.025, 0.07, 0.022);
      const temperate = vec3(0.05, 0.1, 0.035);
      const boreal = vec3(0.03, 0.06, 0.035);
      const tundra = vec3(0.17, 0.15, 0.11);
      const o2f = sst(0.01, 0.2, u.o2);
      const bare = mix(basalt, redBeds, o2f.mul(0.8)).mul(d1.mul(0.35).add(0.9));
      // subtropical deserts and continental interiors
      const aridBelt = sst(0.12, 0.22, absLat).mul(sst(0.42, 0.3, absLat));
      const arid = clamp(aridBelt.mul(0.85).add(cont.mul(0.55)).add(d1.mul(0.3)).sub(0.15), 0.0, 1.0);
      const desert = mix(sand, ochre, d2.mul(0.5).add(0.5));
      const forest = mix(mix(tropic, temperate, sst(0.15, 0.45, absLat)), boreal, sst(0.5, 0.7, absLat));
      const vegAmt = u.vegetation.mul(u.vitality).mul(float(1.0).sub(arid.mul(0.9))).mul(sst(0.85, 0.65, absLat));
      let landCol = mix(bare, desert, arid.mul(sst(0.0, 0.2, u.vegetation)).mul(0.8));
      landCol = mix(landCol, forest, clamp(vegAmt.mul(1.2), 0.0, 1.0));
      landCol = mix(landCol, tundra, sst(0.62, 0.75, absLat).mul(u.vegetation).mul(0.7));
      // agriculture: warm tan patchwork
      const fields = sst(0.3, 0.7, mx_noise_float(n.mul(90.0)).mul(0.5).add(0.5));
      landCol = mix(landCol, vec3(0.2, 0.17, 0.09).mul(fields.mul(0.4).add(0.8)), u.agriculture.mul(0.35).mul(float(1.0).sub(arid)).mul(sst(0.7, 0.4, absLat)));
      // mountains: lighter rock, snow on high relief
      const mnt = relief.mul(u.relief);
      landCol = mix(landCol, vec3(0.2, 0.18, 0.16), mnt.mul(0.5));
      // ---- ocean ----
      const depth = clamp(hgt.negate().mul(3.0), 0.0, 1.0);
      const blue = vec3(0.004, 0.02, 0.06);
      const iron = vec3(0.02, 0.05, 0.03);
      const purple = vec3(0.04, 0.012, 0.05);
      let deep = mix(blue, iron, u.oceanIron);
      deep = mix(deep, purple, u.purpleSea);
      const shallowC = mix(vec3(0.02, 0.09, 0.11), vec3(0.05, 0.1, 0.05), u.oceanIron);
      let ocean = mix(shallowC, deep, sst(0.0, 0.35, depth));
      const shelf = sst(0.25, 0.0, depth).mul(float(1.0).sub(land));
      const bands = sst(0.2, 0.8, sin(n.y.mul(90.0).add(d1.mul(12.0))).mul(0.5).add(0.5));
      ocean = mix(ocean, vec3(0.2, 0.06, 0.02), u.bandedIron.mul(shelf).mul(bands.mul(0.6).add(0.2)));
      ocean = mix(ocean, vec3(0.03, 0.05, 0.02), u.mats.mul(shelf).mul(0.6));
      // ---- ice: brilliant snow, sastrugi, sea-ice leads, an equatorial slush band in snowball ----
      const iceEdge = asin(clamp(float(1.0).sub(u.ice), 0.0, 1.0)).div(Math.PI / 2);
      const iceN = d1.mul(0.08).add(d2.mul(0.02));
      const snowball = sst(0.9, 0.97, u.ice);
      const iceMask = sst(iceEdge.sub(0.015), iceEdge.add(0.015), absLat.add(iceN)).max(snowball);
      const sast = mx_noise_float(n.mul(vec3(160.0, 22.0, 160.0))).mul(0.5).add(0.5);
      const leads = sst(0.985, 0.998, float(1.0).sub(abs(mx_noise_float(n.mul(vec3(7.0, 4.0, 7.0)).add(d1.mul(1.4)))))).mul(land.oneMinus());
      const slush = sst(0.22, 0.0, absLat).mul(snowball).mul(sst(0.2, 0.7, d1.mul(0.5).add(0.5)));
      let iceCol = mix(vec3(0.74, 0.79, 0.84), vec3(0.88, 0.9, 0.92), sast.mul(0.6).add(d2.mul(0.2)).add(0.2));
      iceCol = mix(iceCol, vec3(0.26, 0.34, 0.42), leads.mul(0.7));
      iceCol = mix(iceCol, vec3(0.36, 0.46, 0.52), slush.mul(0.5));
      // ---- bombardment and volcanism ----
      const crat = mx_worley_noise_float(n.mul(22.0));
      const craters = sst(0.12, 0.05, crat).mul(u.bombardment);
      landCol = mix(landCol, vec3(0.03, 0.025, 0.02), craters.mul(0.7));
      ocean = mix(ocean, vec3(0.02, 0.02, 0.02), craters.mul(0.4));
      let albedo = mix(ocean, landCol, land);
      const albedoScorch = float(0).toVar();
      albedo = mix(albedo, iceCol, iceMask);
      // ---- lighting ----
      const nW0 = normalize(positionWorld);
      // fine relief on ice and land so the terminator shows texture
      const bump = T.mx_noise_vec3(n.mul(55.0)).mul(iceMask.mul(0.06).add(land.mul(0.05)));
      const nW = normalize(nW0.add(bump));
      const L = u.sun;
      const V = normalize(cameraPosition.sub(positionWorld));
      const ndl0 = dot(nW0, L);
      const ndl = dot(nW, L);
      const diff = sst(-0.06, 0.28, ndl0).mul(max(ndl, 0.0).mul(0.75).add(0.25));
      const sky = vec3(0.012, 0.022, 0.045).mul(sst(-0.15, 0.4, ndl0)).mul(u.density);
      const H = normalize(L.add(V));
      const water = float(1.0).sub(land).mul(float(1.0).sub(iceMask));
      const fres = pow(float(1.0).sub(max(dot(nW0, V), 0.0)), 5.0).mul(0.9).add(0.02);
      const glint = pow(max(dot(nW0, H), 0.0), 1400.0).mul(1.4).mul(water).mul(fres.mul(4.0).add(0.25)).mul(sst(0.0, 0.08, ndl0));
      // ---- clouds: cyclonic, zonal streets, eroded wisps, with shadows on the surface ----
      const ct = u.cloudT;
      const cloudAt = (pp: N, oct: number): N => {
        let q = pp;
        // three slow cyclones twist the domain (Rodrigues rotation about their axes)
        for (const [ax, ay, az, k] of [[0.62, 0.52, 0.58, 1.6], [-0.4, -0.55, 0.73, -1.4], [0.1, 0.35, -0.93, 1.3], [-0.7, 0.45, -0.3, 1.2]] as const) {
          const kv = normalize(vec3(ax, ay, az));
          const dd = max(float(1.0).sub(dot(q, kv)), 0.0);
          const th = exp(dd.mul(-110.0)).mul(k);
          const c0 = cos(th), s0 = sin(th);
          q = q.mul(c0).add(cross(kv, q).mul(s0)).add(kv.mul(dot(kv, q)).mul(float(1.0).sub(c0)));
        }
        const cp = q.mul(vec3(3.0, 6.0, 3.0));
        const w1 = mx_noise_float(cp.mul(0.55).add(vec3(ct.mul(0.03), 0, 0)));
        const w2 = mx_noise_float(cp.mul(0.55).add(vec3(7.0, ct.mul(0.02), 3.0)));
        const warped = cp.add(vec3(w1, w2.mul(0.5), w2).mul(1.3));
        const cn = mx_fractal_noise_float(warped.add(vec3(ct.mul(0.04), 0, 0)), oct, 2.2, 0.56);
        const streets = mx_noise_float(q.mul(vec3(30.0, 70.0, 30.0))).mul(0.08);
        const erode = mx_noise_float(q.mul(52.0).add(vec3(0, ct.mul(0.05), 0))).mul(0.17);
        const al = abs(asin(clamp(q.y, -1.0, 1.0))).div(Math.PI / 2);
        const band = sst(0.0, 0.1, al).mul(-0.12).add(sst(0.08, 0.0, al).mul(0.16)).add(sst(0.5, 0.7, al).mul(0.14)).add(sst(0.22, 0.3, al).mul(sst(0.4, 0.3, al)).mul(-0.12));
        return cn.add(band).add(u.clouds.sub(0.5).mul(0.7)).sub(erode).add(streets);
      };
      const cov = cloudAt(n, 6);
      const cloud = sst(0.1, 0.48, cov).mul(sst(0.0, 0.15, u.clouds)).mul(0.9);
      const covS = cloudAt(normalize(n.add(u.sunLocal.mul(0.012))), 4);
      const shadow = float(1.0).sub(sst(0.1, 0.48, covS).mul(sst(0.0, 0.15, u.clouds)).mul(0.55));
      const sunCol = vec3(1.0, 0.97, 0.92).mul(1.55);
      const surf = albedo.mul(diff.mul(shadow)).mul(sunCol).add(albedo.mul(sky)).add(glint.mul(sunCol).mul(shadow));
      const cloudThick = sst(0.2, 0.8, cov);
      const cloudLit = mix(vec3(0.62, 0.64, 0.68), vec3(0.95, 0.95, 0.96), cloudThick).mul(diff.mul(0.96).add(sst(-0.2, 0.15, ndl0).mul(0.015))).mul(sunCol).mul(mix(float(1.0), float(0.55), u.smog));
      let col = mix(surf, cloudLit, cloud);
      // ---- night side emissive ----
      const night = sst(0.12, -0.18, ndl);
      const lava = sst(0.8, 0.98, mx_noise_float(n.mul(18.0).add(vec3(0, ct.mul(0.01), 0))).mul(0.5).add(0.5)).mul(u.volcanism).mul(land.mul(0.7).add(0.3));
      const trapsD = dot(n, u.trapsDir);
      const traps = sst(0.93, 0.99, trapsD).mul(u.traps).mul(sst(0.3, 0.9, mx_noise_float(n.mul(60.0)).mul(0.5).add(0.5)).mul(1.4).add(0.35));
      const craterGlow = sst(0.06, 0.0, crat).mul(u.bombardment).mul(0.6);
      const fireSeed = sst(0.72, 0.95, mx_noise_float(n.mul(34.0).add(vec3(ct.mul(0.2), 0, 0))).mul(0.5).add(0.5));
      const fire = u.firestorm.mul(land).mul(fireSeed).mul(sst(2.4, 0.5, T.acos(clamp(dot(n, u.impactDir), -1.0, 1.0)))).mul(night.mul(0.9).add(0.1)).mul(0.5);
      // ---- Chicxulub: crater, ejecta curtain, incandescent ejecta rain ----
      const ang = T.acos(clamp(dot(n, u.impactDir), -1.0, 1.0));
      const ring = exp(ang.sub(u.curtain).div(0.035).pow(2.0).negate()).mul(sst(0.0, 0.03, u.curtain)).mul(float(1.0).sub(sst(0.6, 1.2, u.curtain)));
      const ringBreak = vnoise(n.mul(9.0).add(vec3(ct.mul(0.1), 0, 0)), 'b').mul(0.5).add(0.6);
      const blanket = sst(u.curtain, u.curtain.mul(0.6), ang).mul(u.crater).mul(0.0);
      const craterG = exp(ang.div(0.025).negate()).mul(u.crater.mul(3.0).add(u.impactFlash.mul(30.0)));
      const sparks = sst(0.93, 0.99, vnoise(n.mul(40.0).add(vec3(0, ct.mul(0.6), 0)), 'a').mul(0.5).add(0.5)).mul(u.ejecta).mul(sst(1.6, 0.3, ang)).mul(sst(u.curtain.mul(0.7), u.curtain, ang));
      const impactGlow = vec3(1.0, 0.45, 0.12).mul(ring.mul(ringBreak).mul(3.0).add(sparks.mul(2.0))).add(vec3(1.0, 0.85, 0.6).mul(craterG));
      // ejecta blanket: dark scorched ground inside the curtain
      albedoScorch.assign(sst(u.curtain, u.curtain.mul(0.5), ang).mul(u.crater));
      const glowLava = vec3(1.0, 0.24, 0.04).mul(lava.mul(0.7).add(traps.mul(4.0)).add(craterGlow).add(fire.mul(2.5))).add(impactGlow);
      // night-side emissive layer: a density field broken into points of light (fires, villages, cities)
      const dens = texture(lights, uvE).rgb;
      const sp1 = sst(u.speckleLo, 1.0, vnoise(n.mul(140.0), 'a').mul(0.5).add(0.5));
      const sp2 = sst(u.speckleLo.add(0.05), 1.0, vnoise(n.mul(420.0).add(7.0), 'a').mul(0.5).add(0.5));
      const speck = mix(float(1.0), sp1.mul(0.7).add(sp2.mul(1.4)), u.speckle);
      // people cluster along coasts and rivers: weight by proximity to the sea and a clustering field
      const coastal = sst(0.55, 0.0, cont).mul(0.75).add(0.25);
      const cluster = sst(0.35, 0.85, vnoise(n.mul(22.0), 'g').mul(0.5).add(0.5));
      // city cores glow continuously; the countryside around them breaks into points
      const core = sst(0.25, 1.2, dens.g);
      const city0 = dens.mul(mix(float(1.0), mix(speck, float(0.55).add(speck.mul(0.6)), core), u.speckle)).mul(mix(float(1.0), coastal.mul(cluster).mul(1.6).add(0.35), u.speckle));
      // ---- the lattice: a cold, coherent crystal spreading from the datacenters ----
      const dcs = this.dcU;
      // only evaluated once the lattice exists (uniform branch: the other eras pay nothing)
      const latticeEm = vec3(0.0).toVar();
      const covered = float(0.0).toVar();
      T.If(u.lattice.greaterThan(0.0001), () => {
        // nearest and second-nearest seed, and the nearest seed's grain frame
        const d1 = float(9.0).toVar();
        const d2 = float(9.0).toVar();
        const c1 = vec3(0, 0, 1).toVar();
        const g1 = vec3(1, 0, 0).toVar();
        const g2 = vec3(0, 1, 0).toVar();
        for (let i = 0; i < DATACENTERS.length; i++) {
          const ci = dcs.element(i).xyz;
          const di = T.acos(clamp(dot(n, ci), -1.0, 1.0));
          const closer = di.lessThan(d1);
          d2.assign(select(closer, d1, min(d2, di)));
          c1.assign(select(closer, ci, c1));
          g1.assign(select(closer, this.dcE1.element(i).xyz, g1));
          g2.assign(select(closer, this.dcE2.element(i).xyz, g2));
          d1.assign(min(d1, di));
        }
        const front = u.lattice.mul(3.3);
        // the growth front is faceted, like any crystal growing into a melt
        const facet = mx_worley_noise_float(n.mul(9.0)).mul(0.07);
        const dLast = T.acos(clamp(dot(n, u.lastLightDir), -1.0, 1.0));
        covered.assign(sst(front.add(facet), front.add(facet).sub(0.025), d1).mul(sst(u.latticeHole, u.latticeHole.add(0.02), dLast)).mul(sst(0.0, 0.02, u.lattice)));
        // azimuthal-equidistant coordinates in the grain's own lattice frame
        const tdir = normalize(n.sub(c1.mul(dot(n, c1))).add(g1.mul(1e-5)));
        const g = vec2(dot(tdir, g1), dot(tdir, g2)).mul(d1);
        // a regular triangular lattice at three nested scales (anti-aliased; fine levels fade to an even glow)
        const tri = (q2: N, cell: number): N[] => {
          const a = q2.x.div(cell);
          const b = q2.x.mul(0.5).add(q2.y.mul(0.8660254)).div(cell);
          const c = q2.x.mul(-0.5).add(q2.y.mul(0.8660254)).div(cell);
          const wa = T.fwidth(a).max(1e-4), wb = T.fwidth(b).max(1e-4), wc = T.fwidth(c).max(1e-4);
          const la = sst(wa.add(0.018), 0.0, abs(fract(a.add(0.5)).sub(0.5)));
          const lb = sst(wb.add(0.018), 0.0, abs(fract(b.add(0.5)).sub(0.5)));
          const lc = sst(wc.add(0.018), 0.0, abs(fract(c.add(0.5)).sub(0.5)));
          const w = max(wa, max(wb, wc));
          const vis = sst(0.5, 0.12, w);
          const lines = max(la, max(lb, lc));
          const nodes = la.mul(lb).mul(lc);
          return [lines.mul(vis).add(float(0.07).mul(float(1.0).sub(vis))), nodes.mul(vis), vis];
        };
        const [l1, n1] = tri(g, 0.08);
        const [l2, n2] = tri(g, 0.02);
        const [l3] = tri(g, 0.005);
        // grain boundaries, where two seeds' crystals meet
        const seam = sst(0.012, 0.0, d2.sub(d1));
        // signals ripple outward from each seed along the lattice
        const pulse = sin(d1.mul(42.0).sub(u.time.mul(4.0))).mul(0.5).add(0.5).pow(8.0);
        const age = sst(0.0, 0.25, front.sub(d1));
        const lat = l1.mul(0.55).add(l2.mul(0.3)).add(l3.mul(0.16)).add(n1.mul(2.0)).add(n2.mul(0.6));
        const frontGlow = exp(abs(d1.sub(front.add(facet))).mul(-260.0)).mul(sst(0.0, 0.05, u.lattice)).mul(sst(0.42, 0.37, u.lattice));
        const seedCore = exp(d1.mul(-40.0)).mul(0.5);
        // denser over the continents it was built on, a fainter mesh across the sea
        const where = land.mul(0.7).add(0.3);
        latticeEm.assign(vec3(0.5, 0.72, 1.0).mul(covered.mul(lat.mul(pulse.mul(1.6).add(age.mul(-0.12).add(0.3))).mul(where).add(seam.mul(0.35)).add(seedCore))).mul(0.5).add(vec3(0.8, 0.9, 1.0).mul(frontGlow.mul(0.7))));
        void n2;
      });
      // human lights die where the lattice has passed
      const city = city0.mul(float(1.0).sub(covered.mul(0.97)));
      const emis = glowLava.mul(night.mul(0.85).add(0.15)).add(city.mul(night).mul(u.nightBoost).mul(float(1.0).sub(cloud.mul(0.6)))).add(latticeEm.mul(night.mul(0.9).add(0.1)).mul(1.2));
      // impact winter: soot veil
      col = mix(col, vec3(0.05, 0.045, 0.04).mul(diff), u.impactWinter.mul(0.85));
      col = mix(col, vec3(0.02, 0.016, 0.014).mul(diff), albedoScorch.mul(0.85));
      // ---- atmosphere along the view ray ----
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(cameraPosition));
      const ta = raySphere(ro, rd, ATMO_R);
      const t0 = max(ta.x, 0.0);
      const t1 = length(positionWorld.sub(cameraPosition));
      const at = scatter(ro, rd, t0, t1, atmoU, 10, 4);
      // faint moonlight so continents remain legible on the night side
      col = col.add(albedo.mul(vec3(0.5, 0.6, 0.85)).mul(sst(0.05, -0.25, ndl0)).mul(u.moonlight));
      const outC = col.mul(at.trans).add(at.inscatter).add(emis.mul(at.trans.mul(0.6).add(0.4)));
      return vec4(outC.mul(u.exposure), 1.0);
    })();
    return mat;
  }

  private atmoMaterial(): THREE.MeshBasicNodeMaterial {
    const atmoU = this.atmoUniforms;
    const mat = new THREE.MeshBasicNodeMaterial({ side: THREE.BackSide, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const u = this.u;
    mat.colorNode = Fn(() => {
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(cameraPosition));
      const ta = raySphere(ro, rd, ATMO_R);
      const tp = raySphere(ro, rd, 1.0);
      const t0 = max(ta.x, 0.0);
      const hitP = tp.x.greaterThan(0.0);
      const t1 = select(hitP, tp.x, ta.y);
      const at = scatter(ro, rd, t0, t1, atmoU, 14, 5);
      return vec4(at.inscatter.mul(u.exposure).mul(u.limb), 1.0);
    })();
    return mat;
  }

  private buildStars(): THREE.Mesh {
    const rng = new Rng(0x57a75, 1);
    const n = 9000;
    const a = new Float32Array(n * 4);
    const b = new Float32Array(n * 4);
    // galactic plane tilted across the sky
    const gp = new THREE.Vector3(0.3, 0.85, 0.42).normalize();
    for (let i = 0; i < n; i++) {
      let v: THREE.Vector3;
      if (i < n * 0.45) {
        // concentrate toward the galactic band
        const t = rng.range(0, Math.PI * 2);
        const helper = new THREE.Vector3(1, 0, 0).cross(gp).normalize();
        const other = gp.clone().cross(helper);
        const off = rng.normal(0, 0.12);
        v = helper.clone().multiplyScalar(Math.cos(t)).add(other.clone().multiplyScalar(Math.sin(t))).add(gp.clone().multiplyScalar(off)).normalize();
      } else v = new THREE.Vector3(rng.normal(), rng.normal(), rng.normal()).normalize();
      const mag = Math.pow(rng.next(), 6);
      a.set([v.x * 900, v.y * 900, v.z * 900, mag], i * 4);
      const temp = rng.next();
      b.set([temp, rng.next(), 0, 0], i * 4);
    }
    return makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      renderOrder: 0,
      depthWrite: false,
      softness: 3.0,
      build: (at) => {
        const warm = vec3(1.0, 0.82, 0.62);
        const cool = vec3(0.7, 0.82, 1.0);
        const col = mix(warm, cool, at.b.x).mul(at.a.w.mul(5.0).add(0.15)).mul(this.u.stars);
        return { center: at.a.xyz, size: at.a.w.mul(2.2).add(0.9), color: col };
      },
    });
  }

  /** the bolide: a blinding mote with a plasma trail, falling toward the impact point */
  readonly bolideU = { pos: uniform(new THREE.Vector3(3, 2, 2)), vel: uniform(new THREE.Vector3(-1, -1, -1)), on: uniform(0) };
  private buildBolide(): THREE.Object3D {
    const n = 40;
    const a = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) a.set([i / (n - 1), 0, 0, 0], i * 4);
    const B = this.bolideU;
    return makeParticles({
      count: n,
      attributes: { a: [a, 4] },
      renderOrder: 25,
      softness: 2.5,
      build: (at) => {
        const k = at.a.x;
        const p = B.pos.sub(normalize(B.vel).mul(k.mul(0.35)));
        const head = sst(0.08, 0.0, k);
        const col = mix(vec3(1.0, 0.45, 0.15), vec3(1.0, 0.95, 0.85), head).mul(float(1.0).sub(k).pow(2.0).mul(0.5).add(head.mul(6.0))).mul(B.on);
        return { center: p, size: mix(float(0.03), float(0.012), k), color: col };
      },
    });
  }

  private buildGlobeAgents(): THREE.Mesh {
    const n = PlanetStage.MAX_GLOBE_AGENTS;
    const a = new Float32Array(n * 4);
    const b = new Float32Array(n * 4);
    const u = this.u;
    const mesh = makeParticles({
      count: n,
      attributes: { a: [a, 4], b: [b, 4] },
      renderOrder: 22,
      softness: 2.6,
      build: (at) => {
        // a: local position (unit sphere) + size; b: rgb colour + flicker seed
        const flick = sin(u.time.mul(9.0).add(at.b.w.mul(37.0))).mul(0.12).add(sin(u.time.mul(23.0).add(at.b.w.mul(11.0))).mul(0.08)).add(0.9);
        // only on the night side (fires and lamps); faint on the day side
        const nW = normalize(T.modelWorldMatrix.mul(vec4(at.a.xyz, 0.0)).xyz);
        const night = sst(0.15, -0.2, dot(nW, u.sun)).mul(0.85).add(0.15);
        return { center: at.a.xyz.mul(1.003), size: at.a.w, color: at.b.xyz.mul(flick).mul(night) };
      },
    });
    (mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
    const attrs = mesh.userData.attrs as Record<string, THREE.InstancedBufferAttribute>;
    attrs.a!.setUsage(THREE.DynamicDrawUsage);
    attrs.b!.setUsage(THREE.DynamicDrawUsage);
    this.gAttr = { a: attrs.a!, b: attrs.b! };
    return mesh;
  }

  /**
   * Overlay API for chapters: write agents as (lat, lon, size, r, g, b, seed).
   * Pass count = 0 to hide.
   */
  setGlobeAgents(count: number, write: (i: number, out: { lat: number; lon: number; size: number; r: number; g: number; b: number; seed: number }) => void): void {
    const n = Math.min(count, PlanetStage.MAX_GLOBE_AGENTS);
    const A = this.gAttr.a.array as Float32Array, B = this.gAttr.b.array as Float32Array;
    const o = { lat: 0, lon: 0, size: 0, r: 0, g: 0, b: 0, seed: 0 };
    const D = Math.PI / 180;
    for (let i = 0; i < n; i++) {
      write(i, o);
      const la = o.lat * D, lo = o.lon * D;
      A.set([Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo), o.size], i * 4);
      B.set([o.r, o.g, o.b, o.seed], i * 4);
    }
    (this.gMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = n;
    this.gAttr.a.needsUpdate = true;
    this.gAttr.b.needsUpdate = true;
  }

  /** Overlay API: write the emissive layer from a field (w×h cells, row 0 = north). */
  setEmissive(version: number, w: number, h: number, sample: (x: number, y: number) => [number, number, number]): void {
    if (version === this.lightsVersion) return;
    this.lightsVersion = version;
    const d = this.lightsData;
    for (let y = 0; y < 180; y++)
      for (let x = 0; x < 360; x++) {
        const fx = ((x + 0.5) / 360) * w - 0.5, fy = ((y + 0.5) / 180) * h - 0.5;
        const x0 = Math.floor(fx), y0 = Math.max(0, Math.floor(fy));
        const tx = fx - x0, ty = fy - y0;
        const xa = ((x0 % w) + w) % w, xb = (xa + 1) % w, yb = Math.min(h - 1, y0 + 1);
        const c00 = sample(xa, y0), c10 = sample(xb, y0), c01 = sample(xa, yb), c11 = sample(xb, yb);
        const c = [0, 1, 2].map((k) => (c00[k]! * (1 - tx) + c10[k]! * tx) * (1 - ty) + (c01[k]! * (1 - tx) + c11[k]! * tx) * ty) as [number, number, number];
        // texture row 0 = south (uv.y = 0 at lat −90)
        const i = ((179 - y) * 360 + x) * 4;
        d[i] = Math.min(255, c[0] * 255);
        d[i + 1] = Math.min(255, c[1] * 255);
        d[i + 2] = Math.min(255, c[2] * 255);
        d[i + 3] = 255;
      }
    this.lightsTex.needsUpdate = true;
    this.lightsCleared = false;
  }

  clearOverlays(): void {
    if (!this.lightsCleared) {
      this.lightsData.fill(0);
      this.lightsTex.needsUpdate = true;
      this.lightsCleared = true;
      this.lightsVersion = -1;
    }
    (this.gMesh.geometry as THREE.InstancedBufferGeometry).instanceCount = 0;
  }

  private buildMoon(): THREE.Mesh {
    const mat = new THREE.MeshBasicNodeMaterial();
    const u = this.u;
    mat.colorNode = Fn(() => {
      const n = normalize(positionLocal);
      const cr = mx_worley_noise_float(n.mul(9.0));
      const mare = sst(0.1, 0.4, mx_fractal_noise_float(n.mul(2.5), 3, 2.0, 0.5));
      let alb = mix(vec3(0.22, 0.21, 0.2), vec3(0.1, 0.1, 0.1), mare.mul(0.7));
      alb = alb.mul(sst(0.02, 0.15, cr).mul(0.3).add(0.7));
      const nW = normalize(positionWorld.sub(T.modelWorldMatrix.mul(vec4(0, 0, 0, 1)).xyz));
      const diff = max(dot(nW, u.sun), 0.0);
      return vec4(alb.mul(diff).mul(2.2).mul(u.exposure), 1.0);
    })();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.27, 96, 48), mat);
    m.visible = false;
    return m;
  }

  // ---------------------------------------------------------------- update
  private sm(key: string, v: number, dt: number, rate = 3): number {
    const cur = this.smoothed[key];
    const nv = cur === undefined ? v : damp(cur, v, rate, dt);
    this.smoothed[key] = nv;
    return nv;
  }

  update(f: FrameContext, shot: ShotRuntime): void {
    const p = shot.def.params ?? {};
    const P = this.params;
    P.lat = Number(p.lat ?? 10);
    P.lon = Number(p.lon ?? 20);
    P.spin = Number(p.spin ?? 8);
    P.sunAz = Number(p.sunAz ?? 55);
    P.sunEl = Number(p.sunEl ?? 12);
    P.moon = Number(p.moon ?? 0);
    const u = this.u;
    const w = f.world;
    const dt = f.dt;
    // planet orientation: focus point faces +Z, with drift over the shot
    if (p.focusImpact || p.focusTraps) {
      const d = (p.focusImpact ? u.impactDir.value : u.trapsDir.value) as THREE.Vector3;
      P.lat = (Math.asin(Math.max(-1, Math.min(1, d.y))) * 180) / Math.PI + Number(p.dLat ?? 0);
      P.lon = (Math.atan2(d.x, d.z) * 180) / Math.PI + Number(p.dLon ?? 0);
    }
    const lon = P.lon + P.spin * (shot.u - 0.5);
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(P.lat * DEG, -lon * DEG, 0, 'XYZ'));
    this.planet.quaternion.copy(q);
    const sa = P.sunAz * DEG;
    const se = P.sunEl * DEG;
    (u.sun.value as THREE.Vector3).set(Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se)).normalize();
    (u.sunLocal.value as THREE.Vector3).copy(u.sun.value as THREE.Vector3).applyQuaternion(q.clone().invert());
    u.stars.value = Number(p.stars ?? 0.18);
    u.time.value = f.time;
    u.cloudT.value = f.time * 1.0 + (f.T > -1e6 ? 0 : 0);
    // fate-driven appearance
    const Ma = Math.max(0, -f.T / 1e6);
    this.bake(f.T > 0 ? 0 : Ma);
    u.haze.value = this.sm('haze', w.haze, dt);
    u.o2.value = this.sm('o2', w.o2, dt);
    u.ice.value = this.sm('ice', w.ice, dt, 2);
    u.landLevel.value = lerp(0.62, 0.0, Math.pow(clamp01(w.land), 0.8));
    u.oceanIron.value = this.sm('iron', w.oceanIron, dt);
    u.bandedIron.value = this.sm('bif', w.bandedIron, dt);
    u.purpleSea.value = this.sm('purple', w.purpleSea, dt);
    u.volcanism.value = this.sm('volc', w.volcanism, dt);
    u.bombardment.value = w.bombardment;
    u.mats.value = w.mats;
    u.vegetation.value = this.sm('veg', w.vegetation, dt, 2);
    u.vitality.value = this.sm('vit', w.vitality, dt, 2);
    u.traps.value = w.traps;
    u.agriculture.value = w.agriculture;
    u.smog.value = w.smog;
    u.relief.value = smoothstep(-60e6, -30e6, f.T);
    u.lattice.value = w.lattice;
    u.datacenters.value = w.datacenters;
    // the lattice closes in on the last human light
    u.latticeHole.value = f.T < LAST_LIGHT_T ? 0.06 * Math.max(0, Math.min(1, (LAST_LIGHT_T - f.T) / 1.2)) + 0.012 : 0;
    // clouds: thick under haze worlds, ordinary otherwise
    u.clouds.value = lerp(0.55, 0.42, w.ice);
    // the oxygenated atmosphere is thicker in blue scattering
    u.density.value = lerp(0.85, 1.0, clamp01(w.o2 * 2));
    // moon: closer and larger in deep time
    this.moon.visible = P.moon > 0.01;
    if (this.moon.visible) {
      // closer (and larger) in deep time
      const k = lerp(0.7, 1.0, smoothstep(-4e9, -1e9, f.T));
      this.moon.position.set(Number(p.moonX ?? -3.4) / k, Number(p.moonY ?? 1.5) / k, Number(p.moonZ ?? -9) / k);
      this.moon.scale.setScalar(4.2);
    }
    // ---- Chicxulub sequence (shot-driven) ----
    if (p.impact) {
      const x = shot.u;
      const ic = u.impactDir.value as THREE.Vector3;
      const entry = smoothstep(0.0, 0.18, x);
      const hitT = 0.18;
      const ax = new THREE.Vector3(0.55, 0.65, 0.5).normalize();
      const start = ic.clone().multiplyScalar(1.0).add(ax.clone().multiplyScalar(1.6));
      const pos = start.clone().lerp(ic.clone().multiplyScalar(1.0), entry);
      (this.bolideU.pos.value as THREE.Vector3).copy(pos);
      (this.bolideU.vel.value as THREE.Vector3).copy(ic.clone().sub(start));
      this.bolideU.on.value = x < hitT ? smoothstep(0.0, 0.05, x) : 0;
      if (f.freshStage || this.lastImpactShot !== shot.def.id) this.lastImpactU = x;
      this.lastImpactShot = shot.def.id;
      if (this.lastImpactU < hitT && x >= hitT) f.cue('impact');
      const after = Math.max(0, x - hitT) / (1 - hitT);
      u.impactFlash.value = x >= hitT ? Math.exp(-after * 22) * (f.reducedFlash ? 0.15 : 1) : 0;
      u.crater.value = x >= hitT ? 1 - smoothstep(0.6, 1.0, after) * 0.5 : 0;
      u.curtain.value = x >= hitT ? Math.pow(Math.min(1, after / 0.55), 0.6) * 1.15 : 0;
      u.ejecta.value = x >= hitT ? smoothstep(0.02, 0.15, after) * (1 - smoothstep(0.45, 0.8, after)) : 0;
      u.firestorm.value = smoothstep(0.25, 0.5, after) * (1 - smoothstep(0.8, 1.0, after) * 0.6);
      u.impactWinter.value = smoothstep(0.5, 0.95, after);
      this.lastImpactU = x;
    } else {
      if (f.chapter !== 6) this.bolideU.on.value = 0;
      else this.bolideU.on.value = (this.bolideU.on.value as number) * 0.8;
      u.impactFlash.value = 0;
      u.crater.value = 0;
      u.curtain.value = 0;
      u.ejecta.value = 0;
      u.firestorm.value = 0;
      u.impactWinter.value = smoothstep(-66.0001e6, -65.9995e6, f.T) * (1 - smoothstep(-65.99e6, -65.8e6, f.T));
    }
    // chapter overlays (globe agents, night-side emissive fields)
    const ov = PlanetStage.overlays[f.chapter];
    if (ov) ov(this, f);
    else this.clearOverlays();
    // stars attached to camera position so they never parallax
    this.stars.position.copy(this.camera.position);
  }

  /** Utility for overlays: present-day lat/lon → unit vector in planet-local space. */
  static dirLL(lat: number, lon: number): THREE.Vector3 {
    const v = ll(lat, lon);
    return new THREE.Vector3(v[0], v[1], v[2]);
  }
}

export type { Quat };
void fract;
void floor;
void step;
void min;
void exp;
void length;
