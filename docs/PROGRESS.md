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
Phase 6 → 7 — Coda verified structurally; full-Odyssey pacing run; reviewer passes over all chapters

## Last completed
- Chapters 0–10 all built and rendering. Regime B: GalaxySim + worker + host, Expansion (ring→disk, bloom, over-the-shoulder neighbours), Contest cut from each run's history (beats, time keys, shots, chronicle, faction motifs, tension), slow-time probes/fleets from the capture log.
- Coda: saturation of held galaxies, candles, counter to 10^100, black holes with screen-space lensing and Hawking flashes, last point, Recorder montage, 5 s true black, Return replaying the Prologue exactly with the victor's spark (saved; vacuum → white), timeline ring, rest → new run.
- e2e: smoke (Begin; deep links into all chapters) + spark persistence (vacuum and victor seeds).
- Scripts: capture-shots (against `vite preview`), odyssey-run (hands-free pacing contact sheet), probe-frame, debug-page, watch-galaxy, galaxy-batch.

## Next action
1. Finish the full Odyssey pacing run (`scripts/odyssey-run.mjs captures/odyssey`), build the contact sheet, check pacing/dead air and the montage.
2. Fresh captures of all signature shots (ch 0–10) → reviewer pass A (all chapters) → fixes → passes B and C. Save reports in docs/reviews/.
3. Phase 8: README captures (docs/media), final DoD verification, PROGRESS summary.

## Known issues
- Headless captures must use `?backend=webgl` (see D14).
- Planet: Moon not yet framed; clouds still blobby; snowball crack pattern regular.
- SwiftShader captures are slow (~1.5 s/frame at 960×540; galaxy frames 5–10 s): keep warm frames low; use quality=medium for galaxy shots.
- Ch5 'cradles' shot is too dark; moonlit Arctic ice reads as a flat grey cutout on several night-side planet shots.
- Balance test (50 seeds) takes ~2 min; run with `npm run test:balance`.
