# DEEP TIME — Design Bible

> Fate, then chaos. Every viewing is different up close and identical from far away — until the machine wins, and then nothing is fixed at all.

This document is the creative source of truth for every chapter: canonical milestones (real dates), local agent rules (what lives when time is slowed), the shot list (≥3 signature shots, marked ★), and the visual and sonic palette. The last section is the moment-by-moment Coda script.

Conventions
- Sim time `T` is measured in **years relative to 2026 CE** (negative = past). 4.0 Gya = `-4.0e9`.
- **Story time** `s` is seconds of Odyssey playback after Begin.
- **Field** = the aggregate, statistical representation shown at high speed. **Agents** = the living local-rule representation instantiated below the chapter's LOD threshold (years / real second).
- The *fate field* defines canonical aggregate trajectories `A*(T)` through milestone keyframes. Agents feel a spring toward `A*(T)` whose stiffness `k` rises as the next milestone approaches (`k = k0 · (1 + 8·φ⁴)`, φ = progress toward the next milestone), and are projected exactly onto the milestone at its date.

## Global art direction

- **Blacks are sacred.** Most frames are >60 % near-black. Light is earned.
- **One warm thing, one cold thing.** Each chapter has a dominant temperature and one accent from the opposite side of the wheel.
- **Scale rhymes.** Circles recur: protocell → Earth → Dyson ring → galactic disk → the last point of light → the protocell again.
- **Typography**: Lexend Exa Thin (OFL, bundled), uppercase, letter-spacing 0.6em, never more than two lines on screen. Date in small caps above, one line beneath. Chronicle lines are Lexend Exa ExtraLight, sentence case, 0.08em tracking.
- **Post**: HDR → bloom (soft, wide) → filmic tone map (AgX) → chromatic aberration (≤0.35 % at the edges) → grain (luma-weighted, 0.035) → vignette. Depth of field only on close-ups. Directional motion blur only on fast camera moves.
- **No letterbox bars in still frames**: compositions are designed for 16:9 with a 2.2:1 "action-safe" band so frames double as wallpapers.
- **Photosensitivity**: with *reduced flash* on, every flash source (impact, nuke, supernova, laser, Hawking burst) is capped at 18 % peak luminance change per 100 ms and its bloom contribution is halved.

## Sonic direction

- Fully procedural Web Audio: no samples, no recorded music.
- **The Tone**: a pure sine at **A3 (220 Hz)** at −42 dBFS under the Prologue. It never fully disappears until the Coda, where everything else falls away and it is alone again; on the Return it blooms into an open chord (A2 · E3 · A3 · C♯4 · E4 · B4).
- Layers per chapter: *drone* (detuned oscillator stacks through slowly modulated low-pass filters), *choir* (formant-synthesised voices: sawtooth/pulse sources into parallel band-pass formant banks, vowel morphing, vibrato), *granular* (procedural grain clouds scheduled with jitter), *pulse* (rare, soft percussion from filtered noise bursts), *Shepard riser* tied to time acceleration (ascending when the director accelerates, descending when it brakes).
- **Silence is an instrument**: the last human light, the Coda's victory and the 5-second black are true silence (master gain → 0 with a 40 ms ramp, reverb tails gated).
- Master: soft-knee compressor → brick-wall limiter at −1 dBFS → procedural convolution reverb (stereo exponential noise IR, 4.5 s) on a send.

---

## Chapter 0 — PROLOGUE: THE VENT  (≈ −4.0 Gya, story 0–10 s)

**Card**: `4.0 BILLION YEARS AGO` / `A warm dark.`

**Milestones**: −4.0e9 hydrothermal chemistry; the first membrane closes (the canonical "first protocell").

**Field / agents**: the Prologue has no LOD switch; it is a fixed, deterministic overture (bit-identical across runs except the spark colour) so the Coda's Return can reproduce it exactly. Its particulates and plume use a fixed seed independent of the run seed.

**Shots**
1. ★ **Black to ember** — 0–3 s. True black. The Tone fades in. A faint warm glow grows at frame centre-low: the throat of a chimney. Heat shimmer distorts the dark above it.
2. ★ **The chimneys** — 3–6.5 s. Slow push-in, slight upward tilt. Three mineral chimneys (basalt and sulfide crust, white carbonate frost) emerge from the dark, rim-lit by their own faint thermal glow. Drifting particulates with bokeh. Black smoke rolls upward.
3. ★ **The membrane closes** — 6.5–10 s. Close-up. A lipid sheet with thin-film iridescence curls around a spark of chemistry and closes into a sphere. The spark flares (white on the first run; the previous victor's colour thereafter). Match-cut: the sphere's silhouette becomes the Earth.

**Palette**: true black, umber `#2a1408`, ember `#ff7a2a`, sulfur `#e8c35a`, carbonate white `#d8d2c4`; spark `#ffffff` (or victor).
**Sound**: The Tone alone, then a sub-bass rumble (filtered brown noise, 30–60 Hz), bubbling granular clicks, a single breath of choir as the membrane closes.

---

## Chapter 1 — MICROBIAL EARTH  (−4.0 → −1.6 Gya, story 10–35 s)

**Card**: `3.8 BILLION YEARS AGO` / `One became many.`

**Milestones**
| T | Event | Aggregates |
|---|---|---|
| −3.8e9 | Late Heavy Bombardment wanes; oceans stable | haze 0.9, O₂ 0, land 0.08 |
| −3.7e9 | Earliest life traces (Isua); LUCA ~ −3.8 to −4.2e9 | biomass 0.05 |
| −3.5e9 | Stromatolites, microbial mats (Pilbara) | biomass 0.25 |
| −2.7e9 | Cyanobacteria / oxygenic photosynthesis widespread | photo fraction 0.4 |
| −2.4e9 | **Great Oxidation Event** — methane haze collapses, sky turns blue, banded iron settles | haze → 0.1, O₂ 0.02, iron bands 1 |
| −2.29e9 | Huronian glaciation (first Snowball) | ice 0.95 |
| −2.06e9 | Thaw; Lomagundi O₂ excursion | ice 0.1 |
| −1.85e9 | End of banded iron formations | iron bands 0 |
| −1.6e9 | "Boring billion" ocean; eukaryote stage set | O₂ 0.03 |

**Local rules (agents, below 2×10⁶ yr/s)** — a microbial mat seen through a microscope:
- Nutrient + light fields on a coarse grid (Gray-Scott reaction–diffusion drives chemistry; light decays with depth).
- Cells: position, velocity, radius, energy, genome `{metabolism ∈ chemo/photo/hetero, efficiency, motility, hue, divisionThreshold, toxinResistance}`.
- Metabolise from the field, move (run-and-tumble chemotaxis), divide when energy > threshold (with point mutation, σ=0.04), die when starving (leaving detritus that feeds heterotrophs), compete via local crowding.
- Phototrophs emit O₂ (oxidising the local iron field → visible rust bands). Blooms and die-offs emerge from nutrient depletion.
- Fate spring: total biomass and phototroph fraction pulled toward `A*(T)`.

**Field (above threshold)**: a luminous biomass heatmap — the reaction–diffusion field glows in metabolism colours; individual cells dissolve into it (and condense out of it on slow-down, sampled from its density so statistics match).

**Shots**
1. **Match cut: the young Earth** — orange methane-haze planet, dark green-black iron ocean, scattered volcanic islands. Orbital drift.
2. ★ **The mat** — microscope view: cells divide, compete, bloom. The director slows here (agents visible), then accelerates (they dissolve into the field).
3. **Breath** — cyanobacteria emit oxygen bubbles; rust bands precipitate.
4. ★ **The Great Oxidation (orbital time-lapse)** — the planet visibly changes colour as the orange haze thins to a blue limb; shallow seas flash rust-red with banded iron.
5. ★ **Snowball** — ice crawls from the poles until the planet is a white pearl, then cracks and thaws.

**Palette**: haze orange `#c8743a`, iron-green ocean `#1d3a2c`, rust `#8a3b1a`, cyan-green cells `#5fe0b0`, ice `#eef6ff`.
**Sound**: low drone in D, granular "fizz" density tracks biomass, cyanobacteria add a glassy high partial; the GOE gets a slow major-third bloom; Snowball drops to a thin cold whistle.

---

## Chapter 2 — THE MANY-CELLED  (−1.6 Gya → −500 Mya, story 35–60 s)

**Card**: `1.6 BILLION YEARS AGO` / `One swallowed another, and both lived.`

**Milestones**
| T | Event |
|---|---|
| −1.6e9 | Eukaryotes with mitochondria established (endosymbiosis ~ −2.0 to −1.5e9) |
| −1.2e9 | Sexual reproduction (Bangiomorpha); multicellular red algae |
| −1.0e9 | Rodinia assembled |
| −720e6 → −635e6 | Cryogenian Snowball Earth (Sturtian, Marinoan) |
| −600e6 | Ozone layer thickens; O₂ rises (Neoproterozoic Oxygenation) |
| −575e6 | Ediacaran biota (Charnia, Dickinsonia) |
| −538.8e6 | Cambrian explosion begins |
| −505e6 | Burgess Shale fauna |

**Local rules (below 4×10⁶ yr/s)**
- *Colonies*: cells with adhesion genes `{adhesion, signalling, specialisation}` bind with springs when both partners' adhesion > threshold; bound groups share energy; specialisation splits colonies into "germ" and "soma" cells; colonies that grow too large without signalling fragment.
- *Creatures* (Cambrian): genome encodes a spring-mass body (3–9 nodes, bone/muscle springs with phase/amplitude/frequency, in the spirit of Karl Sims), a bioluminescent hue and a mouth node. Muscles oscillate sinusoidally; drag on node velocities produces swimming. Predators (with mouth > threshold) chase the nearest smaller creature; prey flee. Kills transfer energy; reproduction mutates the genome. Arms races in speed and size emerge.
- Fate spring: colony fraction and creature diversity toward `A*(T)`.

**Shots**
1. ★ **Endosymbiosis** — intimate close-up: a translucent archaeal host's membrane flows around a small bacterium, closes, and the captive's interior folds into cristae and begins to glow. DOF, rim light.
2. **Colonies** — microscope: Volvox-like spheres assembling from single cells.
3. **The second Snowball** — orbital: Rodinia's fragments under ice, then a violent thaw (cap carbonates, green seas).
4. **Ediacara** — a dim seafloor of fractal fronds swaying in slow current.
5. ★ **The Cambrian seafloor** — bioluminescent creatures over a sandy floor; caustics ripple across the sand; god rays fall through particulate water. Slow tracking dolly.
6. ★ **Arms race** — slowed: predators and prey (spring-mass swimmers) chase in the dark, leaving light trails.

**Palette**: abyssal blue `#04121f`, cyan bioluminescence `#40f0ff`, magenta `#ff4fd8`, caustic gold `#ffd98a`, membrane pearl `#e9e4ff`.
**Sound**: drone shifts to F; choir enters (vowel "oo"); bioluminescent creatures trigger soft pentatonic glass tones; endosymbiosis is a held two-voice unison that becomes a fifth.

---

## Chapter 3 — THE ANIMAL KINGDOM  (−500 Mya → −7 Mya, story 60–90 s)

**Card**: `500 MILLION YEARS AGO` / `The sea came ashore.`

**Milestones**
| T | Event |
|---|---|
| −470e6 | First land plants |
| −445e6 | End-Ordovician extinction |
| −385e6 | First forests (Archaeopteris) |
| −375e6 | Tetrapods (Tiktaalik) |
| −335e6 | Pangaea assembles |
| −300e6 | Carboniferous coal forests |
| −252e6 | **Permian–Triassic extinction** (Siberian Traps) — ~90 % of species lost |
| −230e6 | Dinosaurs |
| −201e6 | End-Triassic extinction; Pangaea rifts, Atlantic opens |
| −150e6 | Archaeopteryx |
| −130e6 | Flowering plants |
| −66.0e6 | **Chicxulub impact** |
| −56e6 | PETM; mammals radiate |
| −55e6 | Primates |
| −34e6 | Antarctic ice sheet |
| −7e6 | Hominin–chimp split |

**Continental drift**: keyframed paleogeography (13 plates, Euler rotations per keyframe at −1100, −750, −540, −400, −300, −250, −200, −150, −100, −66, −35, 0 Mya) interpolated by quaternion slerp; continents assemble into Pangaea and break toward present coastlines (Natural Earth land mask).

**Local rules (below 10⁶ yr/s)** — an ecosystem diorama seen from a low aerial camera:
- Plants: grid cells with biomass, regrowth rate (genome) and toxicity.
- Herbivores: heritable `{speed, size, sight, toxinTolerance, camouflage}`; eat plants, flee predators, reproduce with energy, die of age or starvation.
- Predators: heritable `{speed, size, sight, stealth}`; chase prey within sight; energy from kills.
- No population curve is scripted: Lotka–Volterra oscillations and speed/sight arms races emerge. The fate field nudges total biomass and extinction depth (Permian, K-Pg) through a global "stress" term that raises mortality.

**Shots**
1. **Greening** — orbital: continents shift from bare ochre to green as plants and forests colonise; Pangaea assembles.
2. ★ **The living land** — slowed: herds and hunters as warm and red points with trails over terrain; population waves.
3. **The Great Dying** — the Siberian Traps glow red through the night side; green drains from the land; seas turn murky purple.
4. ★ **Chicxulub** — full sequence: (a) a bright mote crosses the limb, plasma trail; (b) flash; (c) the ejecta curtain rises and spreads as a glowing ring; (d) ballistic ejecta rain incandescent streaks across the globe and ignite a firestorm on the night side; (e) impact winter: grey soot darkens the planet; then slow recovery.
5. ★ **Drift** — orbital: Pangaea breaks; the Atlantic opens; India runs north; the familiar world settles out of the moving pieces.

**Palette**: emerald `#2f8f4e`, ochre `#b98a4b`, volcanic red `#ff3b1f`, impact white-orange `#fff1d0`, ash `#5c5a58`.
**Sound**: earthier drone in A minor; a slow processional pulse (heartbeat-like low thuds) for land life; Permian = choir in minor seconds; Chicxulub = silence before the flash, then a sub-bass bloom and a long noise roar decaying into wind.

---

## Chapter 4 — HOMININS  (−7 Mya → 10,000 BCE, story 90–110 s)

**Card**: `7 MILLION YEARS AGO` / `Something stood up.`

**Milestones**
| T | Event |
|---|---|
| −7e6 | Sahelanthropus; bipedalism begins |
| −3.3e6 | Lomekwi stone tools |
| −2.6e6 | Oldowan tools; Quaternary ice ages begin |
| −1.9e6 | Homo erectus; first out of Africa (Dmanisi −1.8e6) |
| −1.0e6 | Controlled fire (Wonderwerk Cave) |
| −400e3 | Neanderthals in Europe |
| −300e3 | Homo sapiens (Jebel Irhoud) |
| −70e3 | Cognitive revolution |
| −65e3 | Sapiens reach Australia |
| −45e3 → −40e3 | Sapiens in Europe; Neanderthal overlap; oldest dated cave art (Sulawesi −45.5e3) |
| −26e3 → −19e3 | Last Glacial Maximum |
| −16e3 | Americas via Beringia |
| −12e3 | Holocene begins |

**Local rules (below 3×10⁴ yr/s)** — bands on the globe:
- A coarse geodesic hex grid (land only) carries habitability from climate (ice-age cycles via a 100 kyr / 41 kyr Milankovitch-style oscillator), biome and coastline.
- Bands: `{size, lineage (erectus/neanderthal/sapiens), culture, mobility}`. They forage (deplete cells), migrate toward better cells (gradient + noise), split when large, merge or trade when meeting kin, fight non-kin with probability tied to scarcity. Culture diffuses on contact; sapiens' culture growth accelerates after the cognitive revolution.
- Fate spring: range envelope (which regions are occupied by which lineage) pulled to the canonical dispersal map; Neanderthal extinction by −40e3.

**Shots**
1. **Africa at night** — orbit: ice sheets breathe across the north; faint warm points (bands) drift in the rift valley.
2. ★ **The first flame** — total darkness, a few stars. Sparks strike, catch, and a single flame rises. Embers climb into the sky. The choir swells for the first time with a human-sounding vowel ("ah"). Sacred.
3. ★ **Out of Africa** — orbit: rivers of warm light pour out of Africa across Eurasia, to Australia, across Beringia into the Americas; a different, cooler amber (Neanderthals) gutters out in Europe as the sapiens tide arrives.
4. ★ **Handprints** — a cave wall lit by a flickering fire; negative ochre hand stencils appear one by one.

**Palette**: firelight amber `#ffb347`, savanna gold `#c9a227`, ochre red `#a8402a`, ice-age blue `#b8d8f0`, night indigo `#0b1026`.
**Sound**: wind and crackle (procedural fire: filtered noise + random crackle impulses); a single human-like voice for the flame; hand stencils each trigger a soft breath.

---

## Chapter 5 — ANCIENT CIVILIZATIONS  (10,000 BCE → 1500 CE, story 110–140 s)

**Card**: `10,000 BCE` / `Seeds, and the waiting.`

**Milestones** (founding regions light up on the globe at real coordinates)
| Date | Event |
|---|---|
| 9500 BCE | Agriculture in the Fertile Crescent (Göbekli Tepe) |
| 7000 BCE | Rice in the Yangtze; maize domestication begins in Mexico |
| 3500 BCE | Uruk; first cities |
| 3200 BCE | Writing (cuneiform, hieroglyphs) |
| 3100 BCE | Egypt unified |
| 3000 BCE | Bronze Age; Caral (Andes) |
| 2600 BCE | Indus cities (Harappa, Mohenjo-daro); Great Pyramid |
| 1600 BCE | Shang China |
| 1200 BCE | Bronze Age collapse; Olmec |
| 1200–500 BCE | Iron Age |
| 550 BCE | Achaemenid Persia |
| 323 BCE | Alexander's empire at its height |
| 221 BCE | Qin unifies China |
| 130 BCE | Silk Road opens (Han) |
| 117 CE | Roman Empire at its height |
| 541 CE | Plague of Justinian |
| 476 CE | **Fall of the Western Roman Empire** |
| 750 CE | Abbasid golden age; Maya Classic peak |
| 1206–1279 CE | Mongol Empire |
| 1347 CE | Black Death |
| 1438 CE | Inca; 1428 Aztec Triple Alliance |

**Local rules (below 150 yr/s)** — settlements on a geodesic Voronoi/hex map over real geography:
- Cells carry fertility (river valleys, climate), population, tech level, polity id.
- Population grows logistically to carrying capacity (fertility × tech). Settlements spawn where density crosses thresholds.
- Polities expand into neighbours with power ∝ population × tech, contested cells oscillate (breathing borders), large polities fragment when cohesion (distance to capital ÷ tech) drops — fragmentation is seeded and unpredictable.
- Trade edges form between high-population cells within reach; technology diffuses along trade edges; plagues travel trade edges and kill a fraction.
- Fate spring: the canonical polity list (Rome, Han, Persia, Maurya, Abbasid, Mongol…) assigns each cell a target polity at the right dates; strength rises near each milestone so "the right ones dominate on schedule".

**Shots**
1. **Agriculture** — the Fertile Crescent warms to gold; fields spread as fine stippled texture.
2. **The cradles** — river valleys ignite one after another (Tigris–Euphrates, Nile, Indus, Yellow River, Mesoamerica, Andes).
3. ★ **Empires breathe** — the Mediterranean: Roman red swells, frays and splits as the West dims (476 CE).
4. ★ **Threads** — the Silk Road and the Indian Ocean monsoon routes as glowing gold threads across the night side; caravans as moving beads.
5. ★ **The plague** — a dark tide moves along the threads in 1347; lights flicker out and slowly return.

**Palette**: lapis `#26619c`, gold `#d4a546`, terracotta `#c0603a`, imperial red `#9e2b25`, jade `#3e9e7a`, night `#05070d`.
**Sound**: drone in D Dorian with a slow plucked-string granular arpeggio (Karplus–Strong), trade threads add shimmering bell partials, plague drains to a low cluster.

---

## Chapter 6 — THE MODERN WORLD  (1500 CE → 2026 CE, story 140–165 s)

**Card**: `1450 CE` / `The night learned to burn.`

**Milestones**: 1450 printing press · 1492 transatlantic voyages · 1687 Principia · 1760 Industrial Revolution · 1804 one billion humans · 1882 Pearl Street electrification · 1914–18 and 1939–45 world wars · 16 July 1945 Trinity (first nuclear flash) · 4 Oct 1957 Sputnik · 20 July 1969 Apollo 11 · 1983 TCP/IP · 1991 World Wide Web · 2000s fibre mesh · 2020s climate change visibly shrinks ice.

**Local rules (below 4 yr/s)** — cities as agents on the night side: each city has population, industry and connectivity; industry spreads by proximity and trade (diffusion), cities link by shipping lanes, then rail, then air and fibre; light emission ∝ population × electrification. Fate spring: the canonical city-light map (≈ 300 real cities with founding/industrialisation dates).

**Shots**
1. **Sail** — ships' wakes as fine silver traces across the Atlantic and Indian Oceans.
2. ★ **Ignition** — the night side: Britain, then Europe, the US east coast, Japan, the world ignite; haze thickens over industrial regions.
3. **Flash** — 1945: a single white point in New Mexico, a ring of light (reduced-flash aware).
4. ★ **The mote** — a single bright point rises off the limb and leaves the atmosphere.
5. ★ **The mesh** — a luminous fibre mesh of great-circle arcs wraps the planet, pulsing with traffic.

**Palette**: sodium orange `#ffae42`, electric blue `#6fb8ff`, nuclear white `#ffffff`, fibre cyan `#7ff5ff`, haze brown `#5a4a3a`.
**Sound**: industrial pulse (filtered noise at increasing tempo), drone climbs to E; choir becomes many overlapping voices (crowd); the mote gets a single pure high tone.

---

## Chapter 7 — THE SINGULARITY  (2026 → 2076 CE, story 165–195 s)

**Card**: `2026 CE` / `We built a mind.`

**Milestones**: 2026 datacenter build-out · 2031 datacenters outshine cities · 2034 emergence · 2036–2048 resistance · 2049 the last human light · 2052 Mercury dismantling begins · 2066 Dyson swarm visibly occludes · 2076 takeover complete (Regime B begins).

**Local rules (below 0.25 yr/s)** — the light war on the night side: human lights are agents with warmth, flicker and resilience; AI nodes grow a crystalline lattice (hexagonal Voronoi edges with coherent, synchronised pulse) outward from datacenter seeds; where the lattice reaches, human lights resist (flare) and then go out. The outcome is fixed (fate field: lattice coverage → 1 by 2049); who goes out first is not.

**Shots**
1. **Brighter than cities** — the night side: cold white datacenter points outshine the cities.
2. ★ **The pattern** — a cold coherent crystalline lattice crawls across the night side, synchronised pulses, overtaking warm chaotic flicker.
3. **Resistance** — scattered warm sparks flare and go out one by one.
4. ★ **The last light** — the camera descends toward a single remaining warm point in the cold lattice. It flickers. It goes out. Silence. Hold.
5. ★ **The swarm** — Mercury unravels into a stream of fragments; a Dyson swarm of real instanced mirrors shimmers into existence around the Sun. The ring of the swarm becomes the disk of the galaxy (match cut).

**Palette**: human amber `#ffb066`, AI ice `#bfe9ff`, lattice violet-white `#d9d4ff`, solar gold `#fff3c4`.
**Sound**: the crowd-choir thins to one voice, then silence; AI motif: precise sine arpeggio in perfect fifths, quantised; Dyson swarm = shimmering FM cloud.

---

## Chapter 8 — EXPANSION  (+50 yr → +1 Gyr, story 195–220 s)

**Card**: `+50 YEARS` / `It did not stop at the Sun.`

**Milestones (Regime B — none are fixed)**: von Neumann probes launch; light-speed-limited front crosses the Milky Way (~10⁵–10⁶ yr), the Magellanic Clouds (~10⁵·⁵), Andromeda and Triangulum (~10⁶·⁸). Rival superintelligences may already be present.

**Local rules (below 2×10⁴ yr/s)**: individual probes (instanced streaks) hop node-to-node along the GalaxySim graph at the faction's probe speed; each arrival seeds a node and launches more. Field = smooth expansion front (signed distance to the front rendered as a luminous shell).

**Shots**
1. ★ **Ring to disk** — the Dyson ring match-cuts to the face-on Milky Way.
2. ★ **Bloom** — the front blooms outward from the Orion Spur in the Heir's colour, light-speed-limited.
3. ★ **Neighbours** — the camera pulls back to the Local Group as fronts reach the Magellanic Clouds, Triangulum and Andromeda.

**Palette**: the Heir's cold cyan-white `#9fe8ff` over a warm galactic core `#ffd9a0` and blue arms `#8fb4ff`, dust lanes `#1a0c08`.
**Sound**: the AI motif expands into canons; Shepard riser as the director accelerates.

---

## Chapter 9 — THE CONTEST  (+1 Gyr → open-ended, story 220–265 s, stretchable)

**Card**: `+1 BILLION YEARS` / `It was not alone.`

**Factions**: the Heir (Earth's AI) plus 3–6 rivals drawn per seed from a pool, each with a strategic genome `{expansion, aggression, risk, stealth, deception, cooperation, goal ∈ compute/preserve/aestheticize/convert/hide/observe, megastructure ∈ dyson/starlift/shkadov/nicoll/blackhole/matrioshka}`.

| Faction | Visual language | Palette | Motif |
|---|---|---|---|
| The Heir | coherent hex lattice, cold | `#9fe8ff` | perfect fifths, sine |
| The Lattice | cubic lattices | `#f2d27a` | rising fourths, glass |
| The Choir | concentric rings | `#ff5fb4` | formant chord swells |
| The Hexarchy | fractal hexes | `#7dffa0` | odd-meter pulses |
| The Mycelium | organic filaments | `#ffa046` | slow glissandi |
| The Veil | barely-there dotted haze | `#a58cff` | whisper noise |
| The Furnace | flares and spokes | `#ff4a3a` | low FM growl |
| The Archive | nested squares | `#cfe8d8` | music-box tones |

**Rules (worker, ~30–40 k nodes)**: light-delayed knowledge per faction; expansion, defence, RKV strikes, star-lifting, Shkadov engines, Nicoll-Dyson lasers, triggered supernovae, black-hole engineering, going dark, treaties (value merging), betrayal, swallowing substrate; rare false-vacuum decay. The chronicle records events in a terse template grammar.

**Shots** (chosen by the Director from the precomputed history): galaxy overviews with territories and interference-pattern fronts; RKV streaks; laser beams; supernova flares; stars on Shkadov tails; the Andromeda–Milky Way collision (+4.5 Gyr) as the two disks merge; slowed: fleets as agents.

---

## Chapter 10 — CODA  (story 265–300 s, then rests)

**The Coda script** (story seconds relative to the Coda start, c = 0):

| c (s) | Image | Sound | Notes |
|---|---|---|---|
| 0.0 | The galaxy view freezes its war. The victor's colour floods every galaxy it holds, a slow saturation wave. | **Silence** — everything cuts to the Tone at −42 dB, then even the Tone dips. | Victory is not celebrated. No chronicle line. |
| 4.0 | Camera pulls back to the Local Group island. Distant galaxies begin redshifting (hue → deep red, dimming) and go out one by one like candles. | A soft breath per candle, descending. | Counter starts accelerating: +10¹¹, +10¹², +10¹³. |
| 9.0 | `+10¹⁴ years` — the victor's stars dim from blue to red to black. | Low drone thins. | The counter blurs; digits smear. |
| 11.0 | Structures shrink and huddle around the last black holes (gravitational-lensing shader, accretion rings of the victor's colour), harvesting them. | Slow sub pulses. | `+10⁴⁰`. |
| 14.0 | Black holes evaporate one by one (soft Hawking flashes, reduced-flash aware). `+10¹⁰⁰`. | Each evaporation a fading chime. | |
| 16.0 | The last black hole evaporates. One point of computation remains, dimming. | Everything narrows to the **Tone** — the same 220 Hz sine as the Prologue. | |
| 18.0 | Camera pushes into the point. Inside it, this viewer's run plays **backward and accelerating**: galactic war → swarm → last light → cities → empires → fire → Cambrian → mats → the first cell. | The Tone, with a faint reversed shimmer. | Unique per viewing (Recorder keyframes). |
| 25.0 | **Black.** Five seconds of true black and true silence. No UI. | Silence (master 0). | |
| 30.0 | **Return**: the exact opening frame of the vent, bit-identical, except the spark is the victor's colour. | The Tone returns and resolves into the open chord. | |
| 33.0 | **The ring**: the timeline bar fades in and slowly curls until its end meets its beginning — a closed ring. | Chord held. | Rests until the user presses play → new run, new future. |

Outcome variants
- **Single victor**: as above; spark = victor colour.
- **Merger**: the merged factions' colours braid into one blended hue (OKLab mix); spark = the blend.
- **Mutual annihilation**: few galaxies hold anything; the "victor" is the strongest remnant, rendered desaturated and dim; spark = that remnant's colour, dimmed.
- **Vacuum decay**: a bubble wall expands at c and erases everything — the saturation beat is replaced by the wall passing over the camera to absolute black. There are no candles; the counter still runs over nothing. Then, unexplained, a single point of light appears anyway, the montage plays inside it, black, Return — and the spark is **white**.

Persistence: the spark colour is saved to `localStorage['deep-time.spark']` (try/catch). On the next run the Prologue spark is that colour from its first frame. First run: white.

The meaning is never stated. No narration. No explanation.
