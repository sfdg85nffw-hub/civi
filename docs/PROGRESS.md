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
- [x] Phase 9: Drama (SPEC addendum 1) — see the Phase 9 plan below

## Definition of Done tracker
- [x] Single click on Begin plays genesis→coda hands-free in ~5 min (309 s of story), no errors, no dead air — final run on the final build: story 0→219 and 217→309 (two segments, capture mode, seed 1234ABCD), zero console errors; the only dark frames are the opening black, one fade-through-black (fire → Out of Africa) and the Coda's 5 s of true black.
- [x] Slowing down in any chapter reveals living local-rule agents that differ per viewing — microbes, creatures, ecosystems and hominin bands are tested to condense from their fields and differ per seed (`tests/microbes|creatures|ecosystem|bands.test.ts`); polities, cities, resistance sparks, probes and fleets condense the same way below each chapter's LOD threshold.
- [x] After takeover, different seeds tell different galactic stories — 50-seed balance test (`npm run test:balance`, also in CI): varied winners and outcomes, no strategy above 40 %.
- [x] Coda lands; a second run opens with the previous victor's spark — e2e: seed C0FFEE ends in vacuum decay (white spark), seed 1234ABCD saves the Hexarchy's green, and the next run opens with it.
- [x] Every signature shot passed ≥3 reviewer-subagent critique passes — passes A, B and C over all 39 signature frames (`docs/reviews/`), fixes after each listed in `docs/reviews/README.md`. Mean scores: chapters 0–7 3.71 → 4.08 → 4.46; chapters 8–10 3.47 → 4.07 → 5.00.
- [x] Tests pass, build deployed, README complete — 34 unit tests, 50-seed balance, Playwright smoke (all chapters, zero console errors, spark persistence); GitHub Actions deploys to https://sfdg85nffw-hub.github.io/civi/ on every push; README with a 15-still gallery of real captures.
- [x] PROGRESS.md shows every phase checked

## Addendum 1 (Drama) DoD tracker
- [x] Every chapter has a felt arc; the film has rising stakes — five acts (docs/DRAMA.md), the middle re-timed, the Contest given a protagonist and an ending
- [x] The great turns land as events (built up to, hit, let go) in picture and sound — 18 hits, 30 dated lines and the takeover's rupture in the final run, each anchored to its moment
- [x] Dated lines carry Regime A; the Coda states no meaning
- [x] Reviewer pass D on the whole film's dramatic structure (5/10), its top fixes applied (docs/reviews/README.md)
- [x] Tests pass (39 unit, smoke, 50-seed balance in CI), zero console errors in a full hands-free run on the final build, deployed by CI on every push

## Current phase
Complete (phases 1–9).

## Phase 9 plan
- [x] 9.1 Drama bible: docs/DRAMA.md (throughline, stakes, beat sheet with story times, the grammar of build/inhale/hit/release in picture and sound)
- [x] 9.2 Beat engine: Regime A dated lines; risers, inhale (music drops out), hits (boom, flash, camera kick) anchored to shots; camera shake; the takeover rupture (glitch in picture and sound)
- [x] 9.3 Sound: riser, hit, sub drop, heartbeat through the Singularity, glitch, Contest war hits and pulse
- [x] 9.4 Black beats before the great turns (the Singularity, first contact); card timing
- [x] 9.5 Pacing run + event timeline; reviewer pass D (dramatic structure); fixes
- [x] 9.6 Verify (build, tests, smoke, full hands-free run), deploy, README, final summary

## Last completed
- Review pass C fixes for all chapters (centred opening frame, the mote in the black, Chicxulub curtain, GOE sweeping across the disc, sparse city lights, swarm of glints; Contest beats lifting their protagonist — the killer on extinctions — with vivid event colours on a third, exposure from the look distance, continuous lattices on the galactic plane, tidal tails; Coda in the victor's colour, memory-graded montage iris, round bokeh, tighter ring).
- Final captures (`captures/final`, `captures/final_g`), README gallery (`docs/media`), final hands-free run.

## Next action
None — the Definition of Done and SPEC addendum 1 are met. Open notes under *Known issues*.

## Known issues (not blocking)
- Drama, after pass D: the Contest still has stretches of territory fog (it is emergent per seed); the first seconds of the Modern World are a dark crescent under its card (a set-up for the lights); Cambrian chases are brighter but not staged; a real-time loudness capture of the score (the trace in pacing runs is approximate) has not been made.
- Headless captures must use `?backend=webgl` (see D14); SwiftShader captures are slow (galaxy frames 2–6 min at 960×540 medium).
- Reviewer notes still open after pass C: the Prologue chimneys do not yet read as organ pipes; the snowball's lit ice still renders cream-grey under the tonemapper; the Expansion's front meets the inner disk as a straight wall; *Neighbours* has no probes crossing the gap; the ownership change log is up to 1.7×10⁵ yr out of time order in places (transient, < 0.2 s of screen time).
- Balance test (50 seeds) takes ~2 min; run with `npm run test:balance`.

## Final summary
DEEP TIME is a five-minute, hands-free film of four billion years, built in the browser on three.js (WebGPU with a WebGL fallback) and TSL. It opens on a single ember at a hydrothermal vent and a membrane closing around a white spark. Regime A carries the planet through mats, oxygen, snowball, colonies, the Cambrian, Chicxulub, fire, hand stencils, cities, Silk Road threads, the night side learning to burn, a single mote leaving in 1969, and a cold lattice spreading out from the datacenters until the last human light goes out. A fate field pins the real milestones while local-rule agents, which condense out of the aggregate fields whenever time slows, differ on every viewing. At the takeover the rails end. Regime B is a seeded, chaotic strategy simulation on a 24 000-node graph of the Local Group: rival minds with genomes acting on light-delayed knowledge, kill vehicles aimed at stale light, treaties, betrayals, mergers, Andromeda's arrival, and rarely false-vacuum decay. The Director edits each run's own history into its beats, each with a dated chronicle line. The Coda never states a meaning: the victor's colour floods what it holds, the far galaxies go out like candles, the last black holes evaporate as the counter climbs to 10¹⁰⁰, one point of computation plays the viewer's own run backward inside it, five seconds of true black follow, and then the first frame returns exactly, its spark now in the victor's colour, while the timeline closes into a ring around it. The next run opens with that spark.

Every decision is recorded in `docs/DECISIONS.md` (D1–D46), the architecture in `docs/ARCHITECTURE.md`, the chapter bible and Coda script in `docs/DESIGN.md`, and the three art-direction reviews in `docs/reviews/`.

## Phase 9 summary (drama)
Asked to make the film more gripping, Phase 9 gave it a grammar and a voice. Every great turn — the spark, oxygen, the Great Dying, Chicxulub, fire, the plague, Trinity, the departure, "We built a mind.", the last human light, the takeover, first contact, the collision, the protagonist's death, the end of the war — is built up to (a riser peaking on the beat, the camera trembling), inhaled (the music drops out), hit (sub drop, boom, kick, sometimes a rupture of the picture itself) and let go (a dated line, the score sitting lower). Regime A now speaks in thirty spare dated lines with real dates and magnitudes; the Contest speaks in the film's voice — the mind we built stays "It" to the end, its rivals are named by where they came from, its death is the climax and the last word says who was left. A heartbeat runs under the Singularity and stops with the last light; held blacks precede the two great turns; the score swells into the peaks; and the per-chapter score finally follows the story state it was written for. Review pass D (dramatic structure, whole film) scored the first cut 5/10 and its top fixes are applied (docs/reviews/passD-drama.md, docs/reviews/README.md). The final hands-free run on the final build has zero console errors; the only dark frames are the intended blacks.

