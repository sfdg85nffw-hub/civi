# DEEP TIME — Architecture

Vite + TypeScript (strict) + Three.js r187 (`three/webgpu`, TSL node materials). WebGPU backend when available, automatic WebGL2 backend otherwise — the same TSL code compiles to WGSL or GLSL. Simulations run in Web Workers and exchange **transferable** `ArrayBuffer`s (no `SharedArrayBuffer`, so GitHub Pages needs no COOP/COEP headers).

```
src/
  main.ts                 boot: start screen → App
  app/App.ts              owns every module; the frame loop
  app/frame.ts            FrameContext passed to stages each frame
  core/rng.ts             sfc32 PRNG, string→seed hashing, independent named streams
  core/math.ts            easing, smoothing, monotone cubic, colour helpers
  core/noise.ts           CPU value/simplex noise for sims
  time/TimeEngine.ts      sim time T, speed, Odyssey/manual, fixed-step accumulator, checkpoints
  time/odyssey.ts         the Odyssey schedule: story seconds ↔ sim time (monotone cubic in signed-log space)
  time/format.ts          scale-aware date formatting
  chapters/types.ts       Chapter interface
  chapters/registry.ts    ChapterRegistry: ordered chapters, lookup by T / story time
  chapters/cNN_*.ts       one module per chapter: milestones, aggregates, LOD threshold, shots, audio palette, agent sim id
  fate/FateField.ts       canonical aggregate trajectories A*(T) + annealing stiffness k(T)
  sim/agents/*.ts         pure-TS local-rule simulations (also run in Node for tests)
  sim/sim.worker.ts       hosts the active agent simulation, fixed-step, posts transferable snapshots
  sim/SimHost.ts          main-thread proxy: spawn/condense/dissolve, snapshot interpolation
  galaxy/universe.ts      star-cluster graph (24 k nodes over the Local Group), galaxy motion (Clouds merge, Andromeda collides)
  galaxy/factions.ts      archetypes, strategic genomes, goal compatibility, OKLab colour mixing
  galaxy/GalaxySim.ts     Regime B strategy sim (light-delayed knowledge, tactics, outcomes)
  galaxy/chronicle.ts     template-grammar chronicle
  galaxy/galaxy.worker.ts runs GalaxySim, streams event log + checkpoints
  galaxy/GalaxyHost.ts    main thread: event replay, rewind to checkpoints, frontier progress
  director/Director.ts    shot sequencing, transitions (cut, dissolve, match cut, scale dive, fade)
  director/rigs.ts        camera rigs: push-in, orbit drift, hold, rack focus, track
  director/FreeCamera.ts  C: free camera
  render/Renderer.ts      WebGPURenderer init/fallback, quality tiers, dynamic resolution, device loss, visibility
  render/PostFX.ts        TSL pipeline: dual scene pass (A/B) → CA → motion blur → DOF → bloom → AgX → grain/vignette/fade
  render/tsl/*.ts         shared TSL functions (noise, atmosphere scattering, thin film, lensing, doppler)
  render/stages/*.ts      Vent, Micro, Planet, Seafloor, Fire, Cave, Solar, Galaxy, Coda stages
  audio/AudioEngine.ts    context, master chain, reverb, chapter buses, event API
  audio/instruments/*.ts  Tone, Drone, Choir (formant), Granular, Shepard, Noise beds, Bells, Pluck
  audio/palettes.ts       per-chapter sonic palettes, per-faction motifs
  record/Recorder.ts      montage keyframes (low-res frames + state)
  ui/*.ts, ui/styles.css  start screen, HUD, timeline (+ ring), chapter cards, chronicle, fork control
  data/*.ts, assets/      Natural Earth land mask (rasterised), plates, cities, civilisations, fonts
```

## Frame loop

```
rAF → Renderer.beginFrame
    → TimeEngine.update(dtReal)          // Odyssey: T = odyssey.T(storyTime); manual: T += speed·dt
    → FateField.sample(T)                // canonical aggregates A*(T) and stiffness k
    → SimHost.update(...)                // fixed-step agent ticks in the worker; interpolated snapshot
    → GalaxyHost.seek(T)                 // Regime B event replay
    → Director.update(ctx)               // active shot(s), camera, transition mix, cues
    → stages[active].update(ctx)
    → AudioEngine.update(ctx)
    → PostFX.render()
    → Recorder.maybeCapture()
    → UI.update(ctx)
```

`FrameContext` (render-agnostic): `{ T, speed, storyTime, dtReal, chapter, chapterT01, aggregates, stiffness, lodMix, agents, galaxy, shot, quality, reducedFlash, spark }`.

## TimeEngine

- **T** (float64 years relative to 2026 CE). Past `−4.0e9`, far future up to `1e100` (displayed with exponents).
- **Odyssey**: `odyssey.ts` defines per-chapter keyframes `(s, T)` in story seconds. Interpolation is a monotone cubic (Fritsch–Carlson) in the warped coordinate `z = sign(T)·log10(1+|T|)`, so speed is continuous and eases around beats with no overshoot. `T(s)` and its inverse `s(T)` (bisection) round-trip (tested). The Contest segment's duration is set at takeover from the precomputed galaxy history (45 s nominal, up to 60 s).
- **Manual**: touching any control. Speed is a log slider from 1 day/s (`1/365.25` yr/s) to `1e9` yr/s, smoothed (critically damped in log space). Pause, `[`/`]`, scrubbing. "Return to Odyssey" re-enters autopilot at `s(T)`.
- **Fixed timestep**: agent simulations tick at 30 Hz local time in the worker via an accumulator; the renderer interpolates the last two snapshots. Regime B steps are fixed in sim time (`GalaxySim.dt`).
- **Checkpoints**: Regime A needs none (pure function of milestones + seed). Regime B stores galaxy state snapshots every 2 000 events; seeking backward restores the nearest earlier checkpoint and replays events.

## ChapterRegistry and FateField

Each chapter module exports `{ id, title, card, range:[T0,T1], budget, milestones, aggregates, lodThreshold, agentSim, shots, audio }`.

`FateField` holds, per aggregate variable, a keyframe track `A*(T)` (piecewise smoothstep between milestones). `sample(T)` returns the target values and the stiffness `k(T) = k0·(1 + 8φ⁴)` where `φ ∈ [0,1]` is progress from the previous to the next milestone, plus a `snap` flag at milestone dates. Agent simulations apply `Δaggregate = k·(A* − agg)·dt` by adjusting birth/death/conversion rates — never by teleporting agents — so they stay unpredictable locally while the aggregates are fixed. At a milestone date the residual error is projected to zero. Tested: aggregates at milestone dates are invariant across seeds.

## Temporal LOD

Per chapter: `lodThreshold` (yr/s). `lodMix = smoothstep(log10(th·3), log10(th/3), log10(speed))`, then critically damped (τ≈0.6 s). When `lodMix` rises from 0, SimHost asks the worker to **condense** agents by importance-sampling the current field (so counts and distributions match); each agent carries a random phase so it materialises individually with a glow-in, never as a pop. When `lodMix` returns to 0, agents **dissolve**: they shrink into the field's glow and the field takes over. Stages render both layers, cross-weighted by `lodMix`.

## GalaxySim (Regime B)

- Universe: 24 000 star-cluster nodes — Milky Way 17 k, Andromeda 4.3 k, Triangulum 1.1 k, LMC 1.1 k, SMC 0.5 k — sampled from exponential disks with logarithmic spiral arms, bars and bulges; k = 7 nearest-neighbour edges within each galaxy (CSR). Galaxy centres move with time (`galaxyCenter`): the Clouds fall in by +2.4 Gyr, Andromeda passes at +4.5 Gyr and merges by +6.5 Gyr.
- Factions: the Heir (born at Sol at the takeover) + 3–6 rivals (natives, intruders from between galaxies, one possibly ancient and hidden) with strategic genomes (expansion, aggression, risk, stealth, deception, cooperation, terminal goal, megastructure).
- **Light-delayed belief**: each faction keeps a history of snapshots (power, node count, emission, core systems); what A believes about B is B's snapshot from one light-travel-time ago (minimum sample-pair distance / c). Wars, RKV targeting, beams, invasions and treaties use only that belief; projectiles hit whoever is there on arrival.
- Mechanics: frontier-only stepping (active node list), adaptive dt (200 yr → 4 kyr in expansion, 20–200 kyr in wars, up to 100 Myr when quiet), net-pressure fronts with consolidation, mobilisation by power ratio (decisive in the endgame), RKVs, Nicoll–Dyson beams, triggered supernovae, star-lifting, Shkadov stars, black-hole engineering, going dark, treaties, betrayal, value-merging, invasion fleets across intergalactic gaps, total war with poisoned ground, false-vacuum decay, stalemate exhaustion.
- Output: change log (time, node, owner, star state), events (with chronicle text and director weight), checkpoints every 16 384 changes with state hashes; `galaxy.worker.ts` streams it while computing (≈1–3 s per run); `GalaxyHost` reconstructs the galaxy at any T (replay forward, restore from checkpoint backward) and exposes upcoming captures for the slow-time agent view.
- Outcomes: single victor, merger, mutual annihilation (remnants), vacuum decay. Balance: `npm run test:balance` (50 seeds).
- The Contest is cut from the history (`chapters/c09_contest.ts::buildContest`): beats → Odyssey time keys + shots.

## Coda

`chapters/c10_coda.ts` (shots and the `CODA` timetable) + `App.updateCoda` (sound, true black, UI, spark save, ring, rest) + `GalaxyStage` (saturation of held galaxies, candles) + `CodaStage` (dying stars, swarms around seven black holes with screen-space lensing via `viewportSharedTexture`, evaporation, the last point, the Recorder montage) + `VentStage` for the Return (a pure function of prologue time, so the frame is identical except for the spark colour).

## Director

A shot is `{ id, stage, dur, rig, lod?, transitionIn, cues[] }`. Chapters provide Odyssey shot lists (durations sum to the chapter budget) and manual-mode shot pools keyed by T range. Transitions: `cut`, `dissolve`, `matchCut` (silhouette-aligned dissolve with scale continuity), `dive` (radial zoom blur + dissolve), `fadeBlack`. Rigs are pure functions of shot progress `u ∈ [0,1]` → `{ position, target, up, fov, focus, aperture }`, with subtle procedural handheld drift for holds. Free camera on C.

## Renderer / PostFX

- `WebGPURenderer({ antialias:false })`, `await init()`; WebGPU if `navigator.gpu` gives an adapter, else WebGL2 backend. `?backend=webgl` forces fallback.
- Quality tiers `low | medium | high` (auto: backend, adapter info, a 30-frame probe; override on start screen). Tiers scale particle counts, raymarch steps, render scale, DOF/motion blur/CA. Dynamic resolution keeps frame time on target.
- Device loss: `renderer.onDeviceLost` → overlay + re-init (falls back to WebGL2). `visibilitychange` pauses time and audio.
- Pipeline: `RenderPipeline` with two `PassNode`s whose scene/camera are swapped per frame by the Director (B is only populated during transitions), composite → chromatic aberration → directional motion blur → (High) depth of field → bloom → exposure → AgX tone mapping → sRGB → grain, vignette, fade.

## AudioEngine

Created on the Begin gesture. Master: chapter buses → compressor → limiter → destination; convolution reverb send with a procedural IR. Instruments are small classes owning their nodes with `start/stop/set(params, rampTime)`. The engine reads `FrameContext` each frame (chapter palette crossfades, Shepard riser from `d log speed / dt`, faction motifs from galaxy events) and plays cue stingers from the Director. `M` mutes; visibility pause suspends the context.

## Recorder

Every 0.9 s of story time it downsamples the canvas (`drawImage` right after the frame is rendered) into a 192×108 `ImageBitmap` plus `{ s, T, chapter }`. ≈330 frames ≈ 27 MB GPU-side. The Coda montage plays them in reverse with accelerating cadence through a `CanvasTexture` inside the last point of light.

## Persistence

`localStorage['deep-time.spark']` = last spark colour (try/catch everywhere; failure = white). `localStorage['deep-time.prefs']` = quality and reduced-flash.

## Deep links (debug / screenshots)

`?chapter=5&t=-2600&seed=42&shot=2&speed=1e3&hud=0&capture=1&res=1280x720&backend=webgl&quality=high&autostart=1`
- `chapter` jumps to a chapter's start (or `t` gives exact sim time; accepts `-2.4e9`, `1969`→CE when `ce=1`).
- `shot` picks the n-th Odyssey shot of the chapter; `s` gives exact story time.
- `capture=1` uses a deterministic virtual clock (fixed dt per rendered frame) and exposes `window.__deeptime` (`seek`, `step`, `state`, `ready`).

## Tests

- Vitest: rng streams, time format, Odyssey round-trip, FateField invariance across seeds (each agent sim run headless), GalaxySim determinism (checkpoint hashes), seed variety, the Heir's expansion, balance (8 seeds by default; 50 with `npm run test:balance`: ≥3 outcome types, ≥4 winners, no goal/megastructure/faction > 42 %).
- Playwright: smoke (Begin → no console errors; deep links into every chapter). Scripts: `capture-shots.mjs` (every shot via deep links, run against `vite preview`), `debug-page.mjs`, `probe-frame.mjs`, `galaxy-batch.ts` (headless outcome statistics).
