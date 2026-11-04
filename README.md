# DEEP TIME

A cinematic simulation of the history of life and intelligence, in the browser.
A protocell kindles at a hydrothermal vent four billion years ago. Five minutes
later — after mats and colonies, the Cambrian, the asteroid, fire, cities, the
night side learning to burn, a cold crystal spreading out from the datacenters,
the last human light, a swarm around the Sun and a war between minds across the
Local Group — the universe ends, and the first frame returns.

Press **Begin** once. Everything after that is automatic.

**Live:** https://sfdg85nffw-hub.github.io/civi/ (deployed by GitHub Actions on every push to `main`)

<!-- captures: docs/media/*.jpg are rendered by scripts/capture-shots.mjs -->

| | |
|---|---|
| ![The membrane closes around a spark of chemistry](docs/media/01-membrane.jpg) | ![The Great Oxidation: the haze clearing across the disc](docs/media/02-oxygen.jpg) |
| *Prologue — the membrane closes (4.0 Gya)* | *Microbial Earth — the sky turns blue (2.4 Gya)* |
| ![Bioluminescent Cambrian seafloor](docs/media/03-cambrian.jpg) | ![Chicxulub: the ejecta curtain](docs/media/04-chicxulub.jpg) |
| *The Many-Celled — the Cambrian seafloor* | *The Animal Kingdom — Chicxulub's curtain (66 Mya)* |
| ![Ochre hand stencils by firelight](docs/media/05-hands.jpg) | ![Silk Road threads on the night side](docs/media/06-threads.jpg) |
| *Hominins — hands on the wall* | *Ancient Civilizations — the threads* |
| ![A single mote leaves Earth, 1969](docs/media/07-mote.jpg) | ![The lattice spreading from the datacenters](docs/media/08-pattern.jpg) |
| *Modern — the mote (1969)* | *Singularity — the pattern* |
| ![The swarm around the Sun](docs/media/09-swarm.jpg) | ![The Heir's front spreading through the Milky Way](docs/media/10-bloom.jpg) |
| *Singularity — the swarm* | *Expansion — the bloom* |
| ![The Milky Way edge-on, Andromeda above](docs/media/11-neighbours.jpg) | ![Something woke in Andromeda](docs/media/12-woke.jpg) |
| *Expansion — neighbours* | *Contest — something woke in Andromeda (seed 1234ABCD)* |
| ![Andromeda arrives: tidal tails](docs/media/13-collision.jpg) | ![The last black holes in the victor's colour](docs/media/14-holes.jpg) |
| *Contest — Andromeda arrives (+4.5 Gyr)* | *Coda — the holes (+10⁴⁰ years)* |
| ![The Return: the first cell, the spark in the victor's colour](docs/media/15-return.jpg) | |
| *Coda — the Return* | |

Stills are software-rendered headless captures (SwiftShader WebGL, `scripts/capture-shots.mjs`); on a GPU the piece runs on WebGPU with full particle budgets.

## Two regimes

- **Regime A — fixed history (4 Gya → 2076).** Real milestones are pinned by a
  *fate field*; when you slow time, the aggregate fields condense into living
  local-rule agents (microbes, swimmers with evolved gaits, hominin bands,
  polities with breathing borders, cities, resistance sparks) that differ on
  every viewing but are annealed back onto the canonical track.
- **Regime B — free fall (after the takeover).** A seeded, chaotic strategy
  simulation on a 24 000-node graph of the Local Group. Rival superintelligences
  act on light-delayed knowledge; kill vehicles are aimed at stale light; treaties,
  betrayals, mergers, total war and, rarely, false-vacuum decay. Different seeds
  write different histories; the Contest is edited from each run's own history.
  The seed is shown subtly in the HUD; **R** forks the future from the takeover.

## Controls

| Key | |
|---|---|
| Space | play / pause |
| `[` `]` | slower / faster (1 day/s … 10⁹ yr/s) |
| 0–9 | jump to chapter |
| H | HUD |
| C | free camera |
| F | fullscreen |
| M | mute |
| R | fork the future (Regime B) |

Move the mouse to reveal the HUD and timeline; "Return to Odyssey" resumes the film.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ (static, works offline, base './')
npm test             # unit tests (time mapping, fate invariance, galaxy determinism, quick balance)
npm run test:balance # 50-seed Regime B balance
npm run e2e:smoke    # Playwright: Begin + deep links into every chapter, zero console errors
```

Deep links for debugging and screenshots:
`?chapter=7&shot=3&su=0.5&seed=1234ABCD&capture=1&res=1280x720&backend=webgl&quality=high&nocard=1&mute=1`
(`T=` jumps to an exact sim time in years relative to 2026, `s=` to an exact story second).

## Technology

Vite + TypeScript (strict) + Three.js r187 with the WebGPU renderer and TSL node
materials — the same shaders compile to WGSL or GLSL, so WebGL2 is an automatic
fallback. Physically motivated Rayleigh/Mie scattering, plate-tectonic paleo
maps, surface-nets SDF meshing in a worker, position-based-dynamics swimmers,
a crystal lattice grown from 16 datacenters, a 42 000-collector Dyson swarm,
~800 000 galaxy stars, screen-space gravitational lensing, AgX tone mapping,
bloom, depth of field, motion blur, grain. All sound is procedural Web Audio
(drones, formant choirs, granular beds, Shepard risers, faction motifs, the
220 Hz Tone). Simulations run in workers with transferable buffers (no
SharedArrayBuffer, no special headers).

Documentation: [SPEC](SPEC.md) · [Design bible](docs/DESIGN.md) ·
[Architecture](docs/ARCHITECTURE.md) · [Decisions](docs/DECISIONS.md) ·
[Progress](docs/PROGRESS.md)

## Deploy

`.github/workflows/deploy.yml` builds, runs the unit tests and the 50-seed
balance test, uploads `dist/` and deploys to GitHub Pages; a second job runs the
Playwright smoke test. If Pages has never been enabled for the repository,
switch it on once: **Settings → Pages → Source: GitHub Actions**.

## Credits

- Land mask: [Natural Earth](https://www.naturalearthdata.com/) (public domain).
- Typeface: Lexend Exa (SIL Open Font License 1.1), bundled via @fontsource.
- Everything else — geometry, textures, music — is generated at runtime.
