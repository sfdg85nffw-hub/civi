# DEEP TIME — Progress

## Phase checklist
- [x] Phase 1: SPEC.md, CLAUDE.md, PROGRESS.md, DESIGN.md (chapter bible + Coda script), ARCHITECTURE.md
- [x] Phase 2: Scaffold, TimeEngine, Director, temporal LOD, start screen, deploy workflow
- [ ] Phase 3: Vertical slice — Prologue + Microbial Earth at final quality (audio, both LOD regimes, art-direction loop)
- [ ] Phase 4: Chapters 2–7 at final quality
- [ ] Phase 5: GalaxySim, Expansion, Contest, balance testing
- [ ] Phase 6: Coda, montage recorder, localStorage spark
- [ ] Phase 7: Global polish (match cuts, audio mix, pacing loop, perf tiers, edge cases, 3 art passes)
- [ ] Phase 8: Deploy, README with real captures, final DoD verification

## Definition of Done tracker
- [ ] Single click on Begin plays genesis→coda hands-free in ~5 min, no errors, no dead air
- [ ] Slowing down in any chapter reveals living local-rule agents that differ per viewing
- [ ] After takeover, different seeds tell different galactic stories (balance test)
- [ ] Coda lands; second run opens with previous victor's spark
- [ ] Every signature shot passed ≥3 reviewer-subagent critique passes
- [ ] Tests pass, build deployed (or deploy-ready), README complete
- [ ] PROGRESS.md shows every phase checked

## Current phase
Phase 3 — vertical slice (Prologue + Microbial Earth)

## Last completed
- Phase 2 scaffold: Vite/TS/three r187 WebGPU+TSL, TimeEngine + Odyssey schedule (monotone cubic in signed-log time), Director (shots, rigs, transitions incl. match/dive), PostFX (dual pass, CA, motion blur, DOF, bloom, AgX, grain), AudioEngine (procedural instruments + palettes), UI (start screen, HUD, timeline with ring curl, cards, chronicle, fork), deploy workflow, unit + e2e smoke tests.
- Prologue VentStage (chimneys, plumes, particulates w/ bokeh, iridescent membrane closing around the spark).
- PlanetStage (Natural Earth land mask → SDF + plates, paleo rotations, bake, Rayleigh/Mie/haze atmosphere, clouds, ice, iron seas, lava).
- Microbial mat agent sim (worker, field↔agents LOD, fate projection) + MicroStage (dark-field cells, RD field).

## Next action
Phase 3: cue mechanism (stage events → audio), finish Microbial pacing, manual-mode LOD test, then the first art-direction review loop (reviewer subagent) on Prologue + Microbial signature shots.

## Known issues
- Headless captures must use `?backend=webgl` (see D14).
- Planet: Moon not yet framed; clouds still blobby; snowball crack pattern regular.
- SwiftShader captures are slow (~1.5 s/frame at 960×540): keep warm frames low.
