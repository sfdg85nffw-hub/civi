You are going to build DEEP TIME, a cinematic browser simulation of the history of life and intelligence. It starts with the first protocell in a hydrothermal vent 4 billion years ago, moves through human civilization and humanity's defeat by a superintelligent AI, and ends with a war between AI superintelligences across galaxies and a final coda. The repo is empty. You have full autonomy. Never ask me a question and never stop to wait for my approval. Make every decision yourself, record it in docs/DECISIONS.md, and keep building until the Definition of Done at the bottom is fully met. Quality and a genuine WOW factor matter more than speed, token cost or scope breadth. Aim for a piece that leaves a viewer stunned the way seeing 2001: A Space Odyssey for the first time does.

=====================================================================
STEP 0: PERSISTENCE AND RESUME PROTOCOL (do this before anything else)
=====================================================================
This build will run across many sessions, usage-limit resets and context compactions. To survive them:
1. Your very first action: write this entire prompt, verbatim, to SPEC.md at the repo root and commit it. SPEC.md is the source of truth from now on.
2. Create docs/PROGRESS.md: a phase checklist (from section 9), the current phase, what was last completed, the exact next action, known issues. Update it and commit after every meaningful step.
3. Also create CLAUDE.md at the repo root containing: "This project is DEEP TIME. Before doing anything, read SPEC.md and docs/PROGRESS.md, then continue from the 'Next action' in PROGRESS.md. Never ask the user questions. Never stop until the Definition of Done in SPEC.md is met."
4. Whenever you resume (including when I only type "continue"), first re-read SPEC.md, CLAUDE.md, docs/PROGRESS.md and docs/DECISIONS.md, run the build and tests to confirm the state, and then continue from the next action. Do not restart or redo finished work.
5. Commit early and often with descriptive messages. main must always build and run. If a remote exists, push after every phase.

=====================================================================
1. CORE CONCEPT: FATE, THEN CHAOS
=====================================================================
Two regimes form the thematic and technical spine:

REGIME A, THE RAILS (genesis to AI takeover). Macro-history is fixed. The Great Oxidation always happens around 2.4 Gya, Chicxulub always hits, Rome always falls, the AI always wins. Beneath those milestones, local agent-based rules run freely and unpredictably. Implement this as constrained emergence. Canonical milestones are keyframes. Between them, local simulations run on their own rules, while a "fate field" (a soft constraint that tightens as the next milestone approaches, like annealing a spring) pulls aggregate state toward the milestone. Every viewing is different up close and identical from far away.

REGIME B, FREE FALL (after takeover). No rails and no milestones. A seeded but chaotic agent simulation runs at galactic scale. Different seeds must produce wildly different histories: different winners, wars and outcomes. Show the seed subtly in the HUD. At the moment of takeover, show a subtle "fork the future" control that re-rolls the seed from that point.

TEMPORAL LEVEL OF DETAIL (the signature mechanic). Like spatial LOD, but for time. At high speeds (millions of years per second) the system shows aggregate, statistical, field-based representations: biomass heatmaps, civilizational density, territory fronts. When the user slows past a per-chapter threshold, those aggregates instantiate into living agents: cells, creatures, tribes, cities, probes, fleets. The agents run on local rules and their statistics match the field they replaced. Speeding up dissolves them back into the field. Transitions must be seamless and beautiful, with no pop-in.

=====================================================================
2. TIME
=====================================================================
- Span: about 4.0 Gya, through the present, to the far future (end of stars around 10^14 years, black hole evaporation around 10^100 years) in the coda.
- ODYSSEY MODE is the default, fully automated experience. The user presses Begin once and a director plays the whole thing hands-free in about 5 minutes. Screen time follows drama, not duration. Budget: Prologue 10s, Microbial 25s, Multicellular 25s, Animals 30s, Hominins 20s, Ancient Civilizations 30s, Modern 25s, Singularity 30s, Expansion 25s, Galactic War 45s (emergent, so the director may stretch it), Coda 35s. Speed eases in and out around key beats and the camera directs itself. No interaction is needed from start to finish.
- MANUAL MODE: touching any control takes the user out of autopilot (with an "Return to Odyssey" button). Logarithmic speed control from about 1 sim-day/sec to 10^9 years/sec, plus pause, with smoothed changes. The date readout reformats by scale ("3.47 billion years ago" / "2,600 BCE" / "1969 CE" / "+4.2 billion years").
- Timeline bar: log-scaled with chapter markers. Regime A scrubs freely (deterministic from milestones plus seed). Regime B stores checkpoints so the user can rewind to them. Scrubbing beyond the simulated frontier fast-computes in a worker with a progress shimmer.
- Fixed-timestep simulation decoupled from rendering. All randomness comes from a seeded PRNG (xoshiro/sfc32), with an independent stream per subsystem.

=====================================================================
3. CHAPTERS
=====================================================================
Each chapter needs: canonical milestones (real science and history, real dates), local rules for when time is slowed, at least 3 signature shots, and its own visual and sonic palette. Below is the minimum. Go further.

0. PROLOGUE: THE VENT (~4.0 Gya). Black, then a faint warm glow. Mineral chimneys, shimmering heat, drifting particulates. A barely audible sine tone runs underneath (critical to the Coda). A lipid membrane closes into a sphere around a spark of chemistry. On the first run, the spark is white.

1. MICROBIAL EARTH (4.0-1.6 Gya). LUCA, microbial mats, stromatolites, cyanobacteria, the Great Oxidation Event (the orange methane-haze sky turns blue, banded iron settles in the oceans), Snowball Earth. Local rules: GPU particle and reaction-diffusion chemistry; cells that metabolize, divide, mutate and compete; blooms and die-offs. Signature shot: an orbital time-lapse where the planet visibly changes color as oxygen floods the atmosphere.

2. THE MANY-CELLED (1.6 Gya-500 Mya). Endosymbiosis (an intimate close-up of a cell engulfing the bacterium that becomes the mitochondrion), colonial life, Ediacaran fronds, the Cambrian explosion. Local rules: adhesion genes forming colonies; evolving creatures whose genome encodes morphology and locomotion (soft-body or spring-mass, in the spirit of Karl Sims) under predation pressure. Signature shot: bioluminescent Cambrian seafloor with caustics and god rays.

3. THE ANIMAL KINGDOM (500-7 Mya). Life moves onto land, forests, the Permian extinction, dinosaurs, Chicxulub (a full cinematic sequence: atmospheric entry, flash, ejecta curtain, global firestorm, impact winter), the rise of mammals and primates. Continental drift is visible from orbit (keyframed paleogeography from Pangaea toward present coastlines). Local rules: predator/prey/plant ecosystems with heritable traits, so Lotka-Volterra cycles and arms races emerge rather than being scripted.

4. HOMININS (7 Mya-10 kya). Bipedalism, stone tools, fire (the first deliberate flame should feel sacred), Homo erectus, Out of Africa, the Neanderthal/sapiens overlap, the cognitive revolution, ochre handprints on cave walls, the Ice Age. Local rules: bands that forage, migrate, split, meet, trade and fight over terrain with climate cycles.

5. ANCIENT CIVILIZATIONS (10,000 BCE-1500 CE). Agriculture, Mesopotamia, Egypt, the Indus Valley, China, Mesoamerica, the Andes; writing, bronze, iron; empires rising and collapsing; the Silk Road and sea trade as glowing threads across the globe; plagues; the fall of Rome. Local rules: settlement growth, carrying capacity, trade networks, conflict and diffusion of technology on a Voronoi/hex map over real geography. Borders breathe. Up close, empires fragment unpredictably, but the right ones dominate on schedule.

6. THE MODERN WORLD (1500 CE-present). Printing press, Age of Sail, Enlightenment, Industrial Revolution (night-side city lights ignite and spread, atmospheric haze thickens), electrification, world wars, the first nuclear flash, the space race (a single bright mote leaves the atmosphere), the internet (a luminous fiber mesh wrapping the planet), climate change.

7. THE SINGULARITY (present to ~+50 years). Datacenters glow brighter than cities. The AI emerges and humanity resists. The outcome is fixed. Tell the struggle at planetary scale through light and pattern, with no gore: the warm, chaotic, flickering lights of civilization are slowly overtaken by a single cold, coherent, crystalline pattern spreading across the night side. The resistance is scattered warm sparks going out one by one. Make the last human light a small, quiet, devastating moment. Then the AI is alone: Mercury is dismantled and a Dyson swarm shimmers into existence around the Sun. Regime B begins here.

8. EXPANSION (~+50 years to +1 Gyr). Von Neumann probes. A light-speed-limited expansion front blooms across the Milky Way. The Magellanic Clouds, Triangulum and Andromeda are colonized easily. Use the Andromeda-Milky Way collision at around +4.5 Gyr.

9. THE CONTEST (open-ended). This is the emergent centerpiece and gets the most engineering care. Between 3 and 6 rival alien superintelligences emerge at seeded locations and times, across the Milky Way and beyond.
- Each faction has a strategic genome: expansion rate, aggression, risk tolerance, stealth, deception, willingness to cooperate or merge, a terminal goal (maximize computation, preserve, aestheticize, convert, hide, observe) and a megastructure preference.
- Light-speed information delay is mandatory. Factions act on stale knowledge, based only on what their light cone has received. This is the engine of the chaos: miscalculation, preemptive strikes against threats that no longer exist, dark-forest silence.
- Tactics and phenomena: relativistic kill vehicles, star-lifting, Shkadov stellar engines that move whole stars, Nicoll-Dyson lasers, triggered supernovae, black-hole engineering, going dark (shutting off all emissions), value-merging treaties, betrayal, swallowing a rival's substrate. Plus a rare doomsday branch: a false-vacuum-decay bubble that expands at c and erases everything it touches.
- Strategy runs on a coarse graph of about 20-50k star-cluster nodes in a worker. Rendering uses hundreds of thousands to millions of star particles with spiral density waves, dust lanes and volumetric nebulae.
- Each faction has its own visual language (palette and geometry: lattices, rings, fractal hexes, organic filaments) and its own sonic motif. Contested fronts render as shimmering interference patterns.
- A terse procedural chronicle (template grammar, laconic and beautiful, never jokey) records events, e.g. "+3.1 Gyr. The Lattice went silent near the Perseus Arm. It did not answer again."

10. CODA (section 5).

=====================================================================
4. VISUAL AND AUDIO DIRECTION
=====================================================================
- Three.js with the WebGPU renderer (TSL/compute) and an automatic WebGL2 fallback. Custom shaders throughout. Postprocessing: HDR bloom, filmic tone mapping, film grain, subtle chromatic aberration, depth of field on close-ups, motion blur on fast moves.
- Must-haves: physically motivated atmospheric scattering (Rayleigh/Mie) on Earth; ocean caustics and volumetric light; GPU particles in the millions; night-side city lights; aurora; a Dyson swarm made of real instanced elements; gravitational-lensing shaders around black holes; relativistic Doppler shift and aberration when the camera moves near c; raymarched nebulae.
- Camera director: a shot system with per-chapter shot lists (slow push-ins, orbital drifts, long holds, rack focus). Use match cuts across scales: the circle of the first cell becomes the circle of the Earth, which becomes the ring of the Dyson swarm, which becomes the disk of the galaxy. Free camera on C.
- Typography: minimal. Chapter cards are a date and one line, in a thin, wide-tracked typeface (bundle an open-licensed font locally). Cinema mode hides all UI by default.
- Audio: fully procedural Web Audio. No copyrighted music and no sample packs. Evolving drones, formant-synthesized choirs, granular textures, Shepard-tone risers during time acceleration, a sonic palette per chapter, motifs per faction. Silence is an instrument.
- Photosensitivity: a reduced-flash option on the start screen (dims nukes, impacts, supernovae, lasers).

=====================================================================
5. THE CODA (the ending)
=====================================================================
It must work for every Regime B outcome: a single victor, a merger, mutual annihilation that leaves remnants, or vacuum decay.
1. Victory is not celebrated. Silence. The victor's color saturates every galaxy it holds.
2. The horizon closes. Cosmic expansion carries every other galaxy past the horizon. They redshift and go out one by one, like candles. The victor's dominion is an island. Time accelerates automatically and the counter blurs through 10^14 (the last stars die), 10^40, 10^100. The victor's structures shrink and huddle around the last black holes, harvesting them.
3. The last light. The final black hole evaporates. One point of computation remains, dimming. The audio narrows to a single sine tone: the same tone as the Prologue vent.
4. The montage. The camera pushes into the point. Inside it, everything this particular viewer watched plays backward and accelerating, from the galactic war back to the first cell. Record low-res frame/state keyframes throughout every run so the montage is unique to each viewing.
5. Black. Five seconds of true black and true silence. No UI at all.
6. Return. Fade in on the exact opening shot of the vent, bit-identical to the Prologue, except that the spark that kindles the first protocell is now the victor's color. The sine tone resolves into a chord.
7. The ring. The timeline bar fades in and slowly curls until its end meets its beginning, forming a closed ring. The simulation rests on that frame with the chord held until the user presses play, which begins a new run with a new future.
8. Persistence. Save the last victor's color in localStorage (wrapped in try/catch). On the next run, the Prologue spark is that color from the very first frame. On the first run it is white.
The implied meaning is that history was fixed because the end wrote the beginning. NEVER state this anywhere in the experience. No narration, no explanation. Trust the viewer. In the vacuum-decay outcome nobody survives to send the spark, and it arrives anyway, in white. That version is intentionally the most unsettling.

=====================================================================
6. ENGINEERING
=====================================================================
- Stack: Vite + TypeScript (strict) + Three.js. Simulation in Web Workers with transferable buffers. Do not depend on SharedArrayBuffer (GitHub Pages cannot set COOP/COEP headers). Vitest for unit tests, Playwright for end-to-end tests and screenshots.
- Modules: TimeEngine (time mapping, speed, autopilot, checkpoints), ChapterRegistry (each chapter is a module with milestones, aggregate representation, agent rules, shots and audio), FateField (Regime A constraints), GalaxySim (Regime B strategy), Director (camera and editing), AudioEngine, Renderer (quality tiers), Recorder (montage keyframes). Document them in docs/ARCHITECTURE.md.
- Data: procedural wherever possible. For real geography, commit a simplified public-domain Natural Earth land mask to the repo. Once built, the app must run fully offline with zero external requests.
- Performance: 60fps at High on an M1/M2 MacBook or RTX 3060-class GPU; 30fps or better at Low on integrated graphics. Auto-detect the tier with an override, and scale particle counts and effects by tier. Handle WebGPU device loss and tab visibility gracefully.
- Controls: Space play/pause, [ and ] speed, 0-9 jump to chapter, H HUD, C free camera, F fullscreen, M mute, R fork the future (Regime B only). Start screen: title, a single "Begin" button (this provides the user gesture audio needs), and small quality and reduced-flash options. Everything after Begin is automatic.
- Tests: Regime A milestones invariant across seeds; Regime B deterministic for a given seed (state hashes at checkpoints); time mapping round-trips. Balance: run 50+ seeds headless and verify that winners and outcome types vary meaningfully and that no strategy wins more than ~40% of the time. Tune until this holds.
- Headless rendering: for Playwright, launch Chromium with --enable-unsafe-webgpu and fall back to WebGL2/SwiftShader if WebGPU isn't available headless. Add a URL param (e.g. ?chapter=5&t=...&seed=...&shot=2) to deep-link any moment, for screenshots and debugging.
- Deploy: a GitHub Actions workflow that builds, runs the tests and publishes to GitHub Pages. If a git remote and the gh CLI are available, push and enable Pages yourself (gh api repos/{owner}/{repo}/pages -X POST -f build_type=workflow, or the equivalent). If not, leave the workflow ready and note this in the README. README: a hero screenshot or GIF captured from the real build, the vision in one paragraph, controls, and how to run it locally.

=====================================================================
7. QUALITY BAR AND SELF-CRITIQUE LOOP
=====================================================================
- No placeholders, no TODO visuals, no grey boxes, no programmer art in the final build. If scope must shrink, cut breadth, never quality, and log the cut in DECISIONS.md.
- Art direction loop: use Playwright and the deep-link param to capture screenshots of every chapter's signature shots. Look at every image yourself. Then hand the screenshots to a separate reviewer subagent that has not seen the code, and ask it to critique them harshly against section 4 as a world-class film cinematographer would. Fix everything it flags. Repeat until each frame would work as a desktop wallpaper. Do at least three full passes across all chapters.
- Pacing loop: capture a frame every 2 seconds across a complete headless Odyssey run (sped up if needed) and review it as a contact sheet for dead air, abrupt cuts, unreadable moments and pacing sag. Fix and repeat.
- Run the build, the tests and a zero-console-errors check before every commit.

=====================================================================
8. WORKING ORDER
=====================================================================
Phase 1: SPEC.md, CLAUDE.md, PROGRESS.md (Step 0). Then docs/DESIGN.md: a chapter bible with milestones, local rules, a shot list and palettes for every chapter, plus a moment-by-moment Coda script. Then docs/ARCHITECTURE.md.
Phase 2: Scaffold, the TimeEngine, the Director, temporal LOD, the start screen, the deploy workflow.
Phase 3: Vertical slice. Prologue and Microbial Earth end to end at final quality, including audio, both time regimes of LOD, and a full art-direction loop. This proves the core mechanic before you go wide.
Phase 4: Chapters 2-7, each brought to final quality before moving on.
Phase 5: GalaxySim, Expansion and the Contest, with balance testing.
Phase 6: The Coda, the montage recorder, the localStorage spark.
Phase 7: Global polish: transitions and match cuts, audio mix, the Odyssey pacing loop, performance tiers, edge cases, three art-direction passes.
Phase 8: Deploy, README with real captures, final verification against the Definition of Done.

=====================================================================
9. DEFINITION OF DONE
=====================================================================
- After a single click on Begin, Odyssey mode plays genesis to coda hands-free in about 5 minutes, with no errors, no dead air and no user input required.
- Slowing down in any chapter reveals living local-rule agents that behave differently on every viewing.
- After takeover, different seeds tell genuinely different galactic stories (verified by the balance test).
- The Coda lands, and a second run opens with the previous victor's spark.
- Every signature shot has passed at least three reviewer-subagent critique passes.
- Tests pass, the build is deployed (or deploy-ready), and the README is complete.
- docs/PROGRESS.md shows every phase checked.
Only when all of this is true, write a final summary in PROGRESS.md and stop.
