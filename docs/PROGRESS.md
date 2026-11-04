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
Phase 7 — reviewer passes (A done for all chapters; B in progress), polish

## Last completed
- Review pass A over all 39 signature frames (docs/reviews/passA-*.md) and the fixes listed in docs/reviews/README.md.
- Full hands-free Odyssey pacing run (chapters 0–9) and a run through the Coda: no console errors; the montage plays the run's own recorded frames backward; 5 s of black; the Return; the ring.
- Dead air removed (microbial field divergence); night sides legible; Contest legible.
- CI: build + unit + 50-seed balance + e2e jobs pass; the deploy job waits only for GitHub Pages to be switched on in the repository settings.

## Next action
1. Pass B fixes applied (ch0–7 committed; ch8–10 in progress: hero colour per Contest beat, beat flares and chronicle lines, border-aligned fringes, Gamma(2) star disks, Expansion shell + coarse lattice, telephoto Neighbours, collision tails, Coda victor colour, montage iris, island glow, Return spark/ring). Pass C: ch0–7 captured (captures/passC) and under review; capture ch8–10 into captures/passC_g (640x360, quality low) after the ch8–10 fixes, review, final fixes.
2. Final full pacing run on the final build; README captures (docs/media); DoD verification; final summary.

## Known issues
- Headless captures must use `?backend=webgl` (see D14).
- Planet: Moon not yet framed; clouds still blobby; snowball crack pattern regular.
- SwiftShader captures are slow (~1.5 s/frame at 960×540; galaxy frames 5–10 s): keep warm frames low; use quality=medium for galaxy shots.
- Ch5 'cradles' shot is too dark; moonlit Arctic ice reads as a flat grey cutout on several night-side planet shots.
- Balance test (50 seeds) takes ~2 min; run with `npm run test:balance`.
