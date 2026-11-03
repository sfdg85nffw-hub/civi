# DEEP TIME — Progress

## Phase checklist
- [x] Phase 1: SPEC.md, CLAUDE.md, PROGRESS.md, DESIGN.md (chapter bible + Coda script), ARCHITECTURE.md
- [x] Phase 2: Scaffold, TimeEngine, Director, temporal LOD, start screen, deploy workflow
- [x] Phase 3: Vertical slice — Prologue + Microbial Earth at final quality (audio, both LOD regimes, art-direction loop)
- [ ] Phase 4: Chapters 2–7 at final quality (all built; review passes outstanding)
- [ ] Phase 5: GalaxySim, Expansion, Contest, balance testing (sim + balance + stage + chapters built; visual passes outstanding)
- [ ] Phase 6: Coda, montage recorder, localStorage spark
- [ ] Phase 7: Global polish (match cuts, audio mix, pacing loop, perf tiers, edge cases, 3 art passes)
- [ ] Phase 8: Deploy, README with real captures, final DoD verification

## Definition of Done tracker
- [ ] Single click on Begin plays genesis→coda hands-free in ~5 min, no errors, no dead air
- [ ] Slowing down in any chapter reveals living local-rule agents that differ per viewing
- [x] After takeover, different seeds tell different galactic stories (balance test: 50 seeds pass)
- [ ] Coda lands; second run opens with previous victor's spark
- [ ] Every signature shot passed ≥3 reviewer-subagent critique passes
- [ ] Tests pass, build deployed (or deploy-ready), README complete
- [ ] PROGRESS.md shows every phase checked

## Current phase
Phase 5 → 6 — galaxy visuals, then the Coda

## Last completed
- Chapters 0–7 built and rendered: vent, microbial mats/colonies, endosymbiosis, Cambrian seafloor, Chicxulub, land, fire/cave hands, ancient polities with threads and plague, modern cities/sea lanes/fibre/Trinity/Apollo, Singularity (crystal lattice from datacenters, resistance sparks, last light at Tristan da Cunha, Mercury unmade, Dyson swarm).
- GalaxySim (src/galaxy): Local Group graph, factions with genomes, light-delayed beliefs, expansion, net-pressure fronts, RKVs, Nicoll beams, triggered novae, megastructures, going dark, treaties, betrayal, value-merging, invasions, total war, vacuum decay, chronicle; worker streaming + GalaxyHost (seek/rewind via checkpoints); determinism and 50-seed balance tests pass.
- GalaxyStage (stars, nebulae, dust, territories in each faction's visual language, streaks, novae, bubble), Chapter 8 (ring→disk, bloom, neighbours) and Chapter 9 (shots + time keys cut from the run's history), chronicle feed, fork control rewired.

## Next action
1. Capture and review ch 7 swarm and ch 8–9 galaxy shots; refine the galaxy look (arm pitch, dust in grazing views, front shell, faction languages, streak legibility, collision tidal tails).
2. Phase 6: Coda stage + script (saturation, candles, counter, black holes with lensing, last point, montage from Recorder frames, 5 s black, Return with victor spark, ring), spark persistence, vacuum variant.
3. Then Phase 7 polish and the three reviewer passes over every signature shot.

## Known issues
- Headless captures must use `?backend=webgl` (see D14).
- Planet: Moon not yet framed; clouds still blobby; snowball crack pattern regular.
- SwiftShader captures are slow (~1.5 s/frame at 960×540; galaxy frames 5–10 s): keep warm frames low; use quality=medium for galaxy shots.
- Ch5 'cradles' shot is too dark; moonlit Arctic ice reads as a flat grey cutout on several night-side planet shots.
- Balance test (50 seeds) takes ~2 min; run with `npm run test:balance`.
