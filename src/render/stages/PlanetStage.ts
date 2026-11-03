import * as THREE from 'three/webgpu';
import { Stage } from './Stage';
import type { FrameContext } from '../../app/frame';
import type { ShotRuntime } from '../../director/types';
import { T, type N } from '../tsl/T';
import { ATMO_R, raySphere, scatter, type AtmoUniforms } from '../tsl/atmosphere';
import { makeParticles } from '../particles';
import { NPLATES, plateRotations, qInv, qRot, ll, type Quat } from '../../data/paleo';
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
    stars: uniform(0.2),
    limb: uniform(1.6),
    exposure: uniform(1),
    impactWinter: uniform(0),
    firestorm: uniform(0),
    relief: uniform(0),
  };
  /** emissive night-side layer (equirect, present-day coords) set by chapter overlays */
  readonly lightsTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  readonly uLights: N;
  private moon!: THREE.Mesh;
  private stars!: THREE.Mesh;
  private atmo!: THREE.Mesh;
  private smoothed: Record<string, number> = {};
  params: PlanetParams = { lat: 10, lon: 20, spin: 8, sunAz: 55, sunEl: 12, moon: 0 };

  constructor() {
    super();
    this.plateU = uniformArray(Array.from({ length: NPLATES }, () => new THREE.Vector4(0, 0, 0, 1)), 'vec4');
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
      const cloudLit = mix(vec3(0.62, 0.64, 0.68), vec3(0.95, 0.95, 0.96), cloudThick).mul(diff.mul(0.96).add(0.015)).mul(sunCol).mul(mix(float(1.0), float(0.55), u.smog));
      let col = mix(surf, cloudLit, cloud);
      // ---- night side emissive ----
      const night = sst(0.12, -0.18, ndl);
      const lava = sst(0.8, 0.98, mx_noise_float(n.mul(18.0).add(vec3(0, ct.mul(0.01), 0))).mul(0.5).add(0.5)).mul(u.volcanism).mul(land.mul(0.7).add(0.3));
      const trapsD = dot(n, u.trapsDir);
      const traps = sst(0.965, 0.995, trapsD).mul(u.traps).mul(sst(0.3, 0.9, mx_noise_float(n.mul(60.0)).mul(0.5).add(0.5)).add(0.25));
      const craterGlow = sst(0.06, 0.0, crat).mul(u.bombardment).mul(0.6);
      const fire = u.firestorm.mul(land).mul(sst(0.3, 0.9, mx_noise_float(n.mul(24.0).add(vec3(ct.mul(0.2), 0, 0))).mul(0.5).add(0.5)));
      const glowLava = vec3(1.0, 0.24, 0.04).mul(lava.mul(0.7).add(traps.mul(4.0)).add(craterGlow).add(fire.mul(2.5)));
      const city = texture(lights, uvE).rgb;
      const emis = glowLava.mul(night.mul(0.85).add(0.15)).add(city.mul(night).mul(u.nightBoost).mul(float(1.0).sub(cloud.mul(0.6))));
      // impact winter: soot veil
      col = mix(col, vec3(0.05, 0.045, 0.04).mul(diff), u.impactWinter.mul(0.85));
      // ---- atmosphere along the view ray ----
      const ro = cameraPosition;
      const rd = normalize(positionWorld.sub(cameraPosition));
      const ta = raySphere(ro, rd, ATMO_R);
      const t0 = max(ta.x, 0.0);
      const t1 = length(positionWorld.sub(cameraPosition));
      const at = scatter(ro, rd, t0, t1, atmoU, 10, 4);
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
      this.moon.scale.setScalar(1.25);
    }
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
