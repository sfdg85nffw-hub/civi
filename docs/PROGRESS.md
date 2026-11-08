# DEEP TIME — Progress

## Phase checklist
- [x] Phase 1: SPEC.md, CLAUDE.md, PROGRESS.md, DESIGN.md (chapter bible + Coda script), ARCHITECTURE.md
- [x] Phase 2: Scaffold, TimeEngine, Director, temporal LOD, start screen, deploy workflow
- [x] Phase 3: Vertical slice — Prologue + Microbial Earth at final quality (audio, both LOD regimes, art-direction loop)
- [x] Phase 4: Chapters 2–7 at final quality
- [x] Phase 5: GalaxySim, Expansion, Contest, balance testing
- [x] Phase 6: Coda, montage recorder, localStorage spark
- [x] Phase 7: Global polish (match cuts, audio mix, pacing loop, perf tiers, edge cases, three reviewer passes)
- [x] Phase 8: Deploy, README with real captures, final DoD verification
- [ ] Phase 9: Drama (SPEC addendum 1) — see the Phase 9 plan below

## Definition of Done tracker
- [x] Single click on Begin plays genesis→coda hands-free in ~5 min (309 s of story), no errors, no dead air — final run on the final build: story 0→219 and 217→309 (two segments, capture mode, seed 1234ABCD), zero console errors; the only dark frames are the opening black, one fade-through-black (fire → Out of Africa) and the Coda's 5 s of true black.
- [x] Slowing down in any chapter reveals living local-rule agents that differ per viewing — microbes, creatures, ecosystems and hominin bands are tested to condense from their fields and differ per seed (`tests/microbes|creatures|ecosystem|bands.test.ts`); polities, cities, resistance sparks, probes and fleets condense the same way below each chapter's LOD threshold.
- [x] After takeover, different seeds tell different galactic stories — 50-seed balance test (`npm run test:balance`, also in CI): varied winners and outcomes, no strategy above 40 %.
- [x] Coda lands; a second run opens with the previous victor's spark — e2e: seed C0FFEE ends in vacuum decay (white spark), seed 1234ABCD saves the Hexarchy's green, and the next run opens with it.
- [x] Every signature shot passed ≥3 reviewer-subagent critique passes — passes A, B and C over all 39 signature frames (`docs/reviews/`), fixes after each listed in `docs/reviews/README.md`. Mean scores: chapters 0–7 3.71 → 4.08 → 4.46; chapters 8–10 3.47 → 4.07 → 5.00.
- [x] Tests pass, build deployed, README complete — 34 unit tests, 50-seed balance, Playwright smoke (all chapters, zero console errors, spark persistence); GitHub Actions deploys to https://sfdg85nffw-hub.github.io/civi/ on every push; README with a 15-still gallery of real captures.
- [x] PROGRESS.md shows every phase checked

## Addendum 1 (Drama) DoD tracker
- [ ] Every chapter has a felt arc; the film has rising stakes
- [ ] The great turns land as events (built up to, hit, let go) in picture and sound
- [ ] Dated lines carry Regime A; the Coda states no meaning
- [ ] Reviewer pass D on the whole film's dramatic structure, top fixes applied
- [ ] Tests pass, zero console errors in a full hands-free run, deployed

## Current phase
Phase 9 — Drama (SPEC.md addendum 1: "Make the entire thing more gripping and compelling").

## Phase 9 plan
- [x] 9.1 Drama bible: docs/DRAMA.md (throughline, stakes, beat sheet with story times, the grammar of build/inhale/hit/release in picture and sound)
- [ ] 9.2 Beat engine: Regime A dated lines; risers, inhale (music drops out), hits (boom, flash, camera kick) anchored to shots; camera shake; the takeover rupture (glitch in picture and sound)
- [ ] 9.3 Sound: riser, hit, sub drop, heartbeat through the Singularity, glitch, Contest war hits and pulse
- [ ] 9.4 Black beats before the great turns (the Singularity, first contact); card timing
- [ ] 9.5 Pacing run + event timeline; reviewer pass D (dramatic structure); fixes
- [ ] 9.6 Verify (build, tests, smoke, full hands-free run), deploy, README, final summary

## Last completed
- Review pass C fixes for all chapters (centred opening frame, the mote in the black, Chicxulub curtain, GOE sweeping across the disc, sparse city lights, swarm of glints; Contest beats lifting their protagonist — the killer on extinctions — with vivid event colours on a third, exposure from the look distance, continuous lattices on the galactic plane, tidal tails; Coda in the victor's colour, memory-graded montage iris, round bokeh, tighter ring).
- Final captures (`captures/final`, `captures/final_g`), README gallery (`docs/media`), final hands-free run.

## Next action
Phase 9.2–9.4 are implemented (beat engine `src/app/drama.ts` + `src/chapters/beats.ts`, drama bus and voices in `src/audio`, rupture in PostFX, black beats, turn cards, score hints) and unit-tested; verify the Singularity → Contest stretch (`node scripts/odyssey-run.mjs captures/drama_t2 --fps=4 --every=1 --s0=160 --s1=226`), then a full sound-on pacing run (`--audio`) for reviewer pass D (9.5).

## Known issues (not blocking)
- Headless captures must use `?backend=webgl` (see D14); SwiftShader captures are slow (galaxy frames 2–6 min at 960×540 medium).
- Reviewer notes still open after pass C: the Prologue chimneys do not yet read as organ pipes; the snowball's lit ice still renders cream-grey under the tonemapper; the Expansion's front meets the inner disk as a straight wall; *Neighbours* has no probes crossing the gap; the ownership change log is up to 1.7×10⁵ yr out of time order in places (transient, < 0.2 s of screen time).
- Balance test (50 seeds) takes ~2 min; run with `npm run test:balance`.

## Final summary
DEEP TIME is a five-minute, hands-free film of four billion years, built in the browser on three.js (WebGPU with a WebGL fallback) and TSL. It opens on a single ember at a hydrothermal vent and a membrane closing around a white spark. Regime A carries the planet through mats, oxygen, snowball, colonies, the Cambrian, Chicxulub, fire, hand stencils, cities, Silk Road threads, the night side learning to burn, a single mote leaving in 1969, and a cold lattice spreading out from the datacenters until the last human light goes out. A fate field pins the real milestones while local-rule agents, which condense out of the aggregate fields whenever time slows, differ on every viewing. At the takeover the rails end. Regime B is a seeded, chaotic strategy simulation on a 24 000-node graph of the Local Group: rival minds with genomes acting on light-delayed knowledge, kill vehicles aimed at stale light, treaties, betrayals, mergers, Andromeda's arrival, and rarely false-vacuum decay. The Director edits each run's own history into its beats, each with a dated chronicle line. The Coda never states a meaning: the victor's colour floods what it holds, the far galaxies go out like candles, the last black holes evaporate as the counter climbs to 10¹⁰⁰, one point of computation plays the viewer's own run backward inside it, five seconds of true black follow, and then the first frame returns exactly, its spark now in the victor's colour, while the timeline closes into a ring around it. The next run opens with that spark.

Every decision is recorded in `docs/DECISIONS.md` (D1–D46), the architecture in `docs/ARCHITECTURE.md`, the chapter bible and Coda script in `docs/DESIGN.md`, and the three art-direction reviews in `docs/reviews/`.
