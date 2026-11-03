# DEEP TIME — Decision Log

Every autonomous decision is recorded here with a short rationale. Newest at the bottom.

## Phase 1

- **D1 — Renderer: `three/webgpu` WebGPURenderer + TSL everywhere.** One shader language that compiles to WGSL (WebGPU) and GLSL (WebGL2 backend), so the fallback is automatic and identical. Verified in this container: headless Chromium exposes a SwiftShader WebGPU adapter on `localhost` with `--enable-unsafe-webgpu`, and WebGL2 via ANGLE/SwiftShader, so both backends are testable.
- **D2 — three r187, `RenderPipeline`** (PostProcessing was renamed in r183). Two `PassNode`s with swappable scene/camera give live cross-stage transitions (match cuts) without rebuilding the graph.
- **D3 — Compute is optional, never required.** GPU particle motion is analytic in the vertex stage (orbits, curl-noise drift, density-wave spirals) or uses render-target ping-pong (reaction–diffusion), which run identically on both backends. Compute shaders are only used where an equivalent non-compute path exists.
- **D4 — Sim time unit**: years relative to 2026 CE (float64). "Present" is 2026 CE, the Singularity spans 2026–2076.
- **D5 — Odyssey interpolation** is a monotone cubic in signed-log time `z = sign(T)·log10(1+|T|)`: C1 speed, no overshoot, log-paced for free, exactly invertible for the timeline.
- **D6 — Timeline bar is piecewise-logarithmic**: chapters occupy widths proportional to their Odyssey budget and time inside each chapter is log-warped. A literal log axis from 4 Gya to 10^100 would devote 90 % of the bar to the empty far future.
- **D7 — Agents run in local time.** At geological speeds real generation times are invisible, so agents tick at a fixed 30 Hz local clock and the fate field keeps their aggregates on the canonical track. This is what makes "slow down and they come alive" work at every scale.
- **D8 — Regime B is precomputed ahead of playback.** The galaxy worker starts computing the run's history as soon as the seed is known (at Begin) and streams events/checkpoints; the Director can therefore "edit" the emergent war (cut to the decisive battle) and stretch the Contest up to 60 s.
- **D9 — The Heir.** Earth's AI is one faction among 4–7 in the Contest and can lose. Rivals: Lattice, Choir, Hexarchy, Mycelium, Veil, Furnace, Archive (3–6 per seed).
- **D10 — The Tone is A3 = 220 Hz** (audible on laptop speakers, unlike 110 Hz) at −42 dBFS; the Return chord is an open A add9 voicing.
- **D11 — Typeface: Lexend Exa** (SIL OFL 1.1, bundled from @fontsource), weights 100/200/300.
- **D12 — No hard letterbox.** Frames are composed for 16:9 with a 2.2:1 action-safe band so every frame can be a wallpaper.
- **D13 — Deploy**: the GitHub tooling in this environment cannot change repository Pages settings (no `gh api` for non-search calls), so the workflow uses `actions/configure-pages` with `enablement: true` and the README documents the one-time "Settings → Pages → Source: GitHub Actions" step.
