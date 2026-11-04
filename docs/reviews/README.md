# Art-direction reviews

Each pass: every signature shot is rendered through deep links
(`scripts/capture-shots.mjs`, against `vite preview`), assembled into contact
sheets, and handed to a separate reviewer agent that has never seen the code. The
reviewer is briefed only with the chapter's intent from `docs/DESIGN.md` and asked to
critique harshly, as a world-class cinematographer and VFX supervisor, ranking the
fixes by impact. Its report is saved here verbatim; the fixes applied are listed under it.

| Pass | Scope | Report |
|---|---|---|
| 0 | Prologue, Microbial | (session notes; pre-dates this folder) |
| 1 | Prologue, Microbial | (session notes; pre-dates this folder) |
| A | Chapters 0–7 (24 frames) | [passA-ch0-7.md](passA-ch0-7.md) |

### Fixes applied after pass A (chapters 0–7)
- Global: AgX output expanded so hero emitters reach display white; saturation 1.28.
- Night sides: per-shot moonlight (0.075), ice moonlight compressed so the cap no longer dominates; crisp Worley point lights over a 4-tap smoothed density grid (no hex mosaic, no rectangles).
- Cameras: six identical north-up globe framings replaced (small disc with negative space, horizon-arc limb shots, a regional close-up, an oblique pass); consistent sun side per chapter (right in 1–3, left in 4–7).
- Beats: Volvox colonies in *Colonies*; Apollo mote as a hard white point at dusk over the slow 1969 beat; plague front paced at ~9°/yr with red front and ash wake on the threads; last light 15–30 px warm halo and softened lattice around it; *Pattern* reframed over populated land.
- Stages: seafloor rippled sand with stronger gold caustics; hand stencils as wide sprayed clouds, raking firelight, subtler flowstone; irregular hearth; glacial blue-white ice; microscope shots with shallow depth of field; era-specific line languages (gold silk, silver wakes, cyan fibre).
| A | Chapters 8–10 (15 frames) | [passA-ch8-10.md](passA-ch8-10.md) |

### Fixes applied after pass A (chapters 8–10)
- Contest legibility: territory interiors are a whisper weighted by "presence" (small powers brighter), contested fronts are two-colour interference fringes in both powers' colours; galaxy bloom radius/threshold cut, bulges dimmer, cameras pulled back.
- Chronicle: stale lines are dropped so the line on screen matches the beat; at most two lines, more air between them; single line with a dark text scrim.
- Coda: accretion rings and the last point kept below white-out so they stay the winner's colour (point gets a wide halo); the spark's halo carries its colour; candles larger/brighter so they visibly redden and go out; the timeline ring settles centred on the first cell.
- Streaks (kill vehicles, probes, fleets, beams) never thinner than ~2.6 px; Andromeda's disk older and redder than ours; Local Group framing puts the Milky Way in the lower third with Andromeda above.
| B | Chapters 0–7 (24 frames) | [passB-ch0-7.md](passB-ch0-7.md) |

### Fixes applied after pass B (chapters 0–7)
- Prologue: organ-pipe chimneys with knobs and flanges (no "hand"), a hotter ember core, a darker plume.
- Hominins: feathered ranges and a blurred dispersal field (no rectangles or blocks); denser, wider hand stencils on a calmer wall; firelight from inside an irregular hearth.
- Night sides: smooth sodium city clusters (no mosaic); globe sprites lifted clear of the surface (no cut halo on the last light); Chapter 5 planet restored at normal exposure with the Empires horizon in the upper third.
- Layout: close snowball limb, centred front-lit drift, GOE mid-transition, brighter Apollo mote at dusk, swarm caught mid-dismantling; Volvox colonies without needles; seafloor depth fog.
| B | Chapters 8–10 (15 frames) | [passB-ch8-10.md](passB-ch8-10.md) |

### Fixes applied after pass B (chapters 8–10)
- Coda: the holes and the last point were reading the (still white) spark instead of the victor — they now take the victor's colour.
- Contest: each beat names its protagonist; its territory is lifted (×2.6) and every other power recedes (×0.3), and the event itself is drawn in that colour (an igniting spark and expanding ring for an awakening, a collapsing ring for an extinction, a slow pulse for wars, treaties and betrayals). Every beat carries its own dated chronicle line, over a soft scrim.
- Fronts: interference bands run parallel to the border, at a period fixed at ~1.4 % of frame height, both sides sharing the band orientation, and never over a galactic core. Territory fills are drawn more saturated than the faction swatch.
- Galaxies: disk stars follow an exponential surface density (Gamma(2) radii), so the outer disk is populated and the Sun sits at half radius of the visible disk; cores are less dominant.
- Framing: whole-galaxy beats are composed around the event (core off-centre); the collision is closer, with tidal tails and a bridge; Andromeda older and redder; *Neighbours* is a telephoto over our disk with Andromeda in the upper third.
- Return: the spark keeps its hue (less white core, coloured halo); the settled timeline ring widens to frame the first cell from a distance.

