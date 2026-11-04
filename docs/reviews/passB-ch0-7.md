# Pass B review: chapters 0–7 (24 stills)

Reviewer stance: cinematographer / VFX supervisor. I judged only what is on screen against the brief in `docs/DESIGN.md`, the pass-A report (`passA-ch0-7.md`) and the fix list in `README.md`. I did not read any code. The frames are 960×540 software-rasterised renders, so I've allowed for grain and soft detail. Coordinates are pixels on the 960×540 frame, origin top-left. I measured the pass-A frames (`captures/passA/`) and the pass-B frames (`captures/passB/`) with the same script, so the A→B numbers below are like for like.

## The verdict in five lines

1. **About half the batch did not change.** Five frames are pixel-identical or close to it: Ember 0.0 % of pixels changed, Living land 1.2 %, Last light 1.4 %, Chimneys 3.2 %, Mat 6.6 %. Six more got only the global grade: Endosymbiosis, Membrane, Cambrian, Drift, Chicxulub and Swarm. The whole prologue, the first 10 seconds of the film, is untouched, and the chimneys still read as a human hand.
2. **The globe work in chapters 4–7 is real progress.** The six identical north-up framings are gone, the grey ice cap no longer steals the night-side frames, Colonies finally has colonies, the last light can now be seen, and Pattern is the best frame in the film.
3. **The night-side grade overshot in chapter 5.** Empires (99.0 % of pixels below luma 0.12) and Plague (99.3 %) no longer show a planet at normal exposure. What is left is gold dots joined by straight lines over a star field, which reads as **a literal constellation chart**. The pass-A "constellation" complaint is now worse, not better.
4. **Several "fixed" items are not fixed on screen.** Out of Africa still has its rectangular bar (moved to x≈730–770, y≈195–265). City clusters swapped the hex mosaic for a square/Worley "camo" mosaic (cells 6–10 px). The last light's new halo is hard-clipped along its lower edge. Mesh still has radial streaks at the limb, and its cyan fibre covers about 500 px (0.1 % of the frame).
5. **Score trend: mean 3.71 → 4.08 (+0.37).** Eight frames improved, two regressed, fourteen held. Frames at 3/10 or below went from 12 to 6. Three frames now reach 6/10 or better (two in pass A). Nothing yet reaches the "2001 wallpaper" bar (8+).

---

## Measurements, pass A → pass B

Luma is Rec.709 on the sRGB frame. "Near-black" means luma < 0.06. "Chroma" is mean(max−min) of RGB, the same statistic pass A called "mean saturation" (its numbers reproduce exactly). "Δpx" is the share of pixels whose value changed by more than 0.05 between pass A and pass B.

| Frame | near-black A→B | luma<0.12 A→B | max luma A→B | chroma A→B | Δpx | note |
|---|---|---|---|---|---|---|
| c00_s0 ember | 99.9 → 99.9 | 100 → 100 | 0.54 → 0.57 | .001 → .001 | **0.0 %** | identical frame |
| c00_s1 chimneys | 95.3 → 95.3 | 98.1 → 98.2 | 0.83 → 0.87 | .023 → .032 | 3.2 % | grade only |
| c00_s2 membrane | 57.6 → 57.1 | 70.7 → 70.1 | 0.87 → 0.91 | .130 → .184 | 31.5 % | fog more saturated |
| c01_s1 mat | 76.4 → 75.5 | 85.5 → 84.3 | 0.56 → 0.61 | .034 → .051 | 6.6 % | grade only |
| c01_s2 GOE | 75.8 → 71.7 | 77.1 → 72.8 | 0.77 → 0.86 | .014 → .028 | 36.6 % | reframed |
| c01_s3 snowball | 91.8 → 91.2 | 95.8 → 91.5 | 0.70 → 0.82 | .005 → .004 | 22.7 % | reframed, ice is neutral grey (183,183,176) |
| c02_s0 endo | 49.0 → 45.9 | 76.0 → 72.7 | 0.85 → 0.92 | .059 → .081 | 8.2 % | grade only |
| c02_s1 colonies | 69.5 → 57.9 | 79.5 → 73.7 | 0.79 → 0.85 | .040 → .070 | 30.3 % | Volvox added |
| c02_s4 cambrian | 30.5 → **19.0** | 68.4 → 51.2 | 0.83 → 0.91 | .082 → .101 | 22.9 % | milkier than before |
| c03_s1 living land | 42.8 → 37.9 | 87.2 → 82.8 | 0.66 → 0.72 | .062 → .087 | **1.2 %** | identical content |
| c03_s3 drift | 75.8 → 75.8 | 76.6 → 76.5 | 0.77 → 0.84 | .018 → .026 | 14.5 % | grade only |
| c03_s4 chicxulub | 72.6 → 72.4 | 74.3 → 74.1 | 0.89 → 0.97 | .031 → .044 | 12.2 % | grade only |
| c04_s1 fire | 65.0 → 55.1 | 77.5 → 69.8 | 0.92 → **1.00** | .082 → .128 | 42.3 % | flame core reaches white |
| c04_s2 out of Africa | 63.1 → 94.4 | 81.3 → 95.9 | 0.79 → 0.96 | .046 → .016 | 45.1 % | small disc |
| c04_s3 hands | 21.9 → 51.1 | 40.3 → 64.0 | 0.47 → **0.45** | .260 → .210 | 87.5 % | still no highlight |
| c05_s2 empires | 70.0 → 92.5 | 93.1 → **99.0** | 0.91 → 0.92 | .050 → .029 | 51.4 % | planet invisible |
| c05_s3 threads | 70.3 → 69.9 | 88.5 → 95.3 | 0.89 → 0.97 | .024 → .031 | 52.2 % | oblique |
| c05_s4 plague | 63.1 → **98.4** | 86.9 → **99.3** | 0.90 → 0.92 | .031 → .015 | 47.1 % | planet invisible |
| c06_s1 ignition | 75.6 → 96.6 | 82.8 → 97.2 | 0.85 → 0.89 | .026 → .011 | 34.1 % | cap gone |
| c06_s3 mote | 57.9 → 90.8 | 60.3 → 92.5 | 0.75 → 0.94 | .033 → .016 | 45.6 % | night-side limb |
| c06_s4 mesh | 71.6 → 89.5 | 84.2 → 91.4 | 0.86 → 0.89 | .025 → .016 | 38.6 % | limb arc |
| c07_s1 pattern | 63.9 → 66.7 | 78.9 → 77.0 | 0.92 → **1.00** | .021 → .028 | 52.4 % | reframed |
| c07_s3 last light | 77.6 → 76.6 | 88.8 → 87.6 | 0.79 → 0.97 | .018 → .027 | **1.4 %** | only the halo is new |
| c07_s4 swarm | 48.6 → 46.9 | 63.5 → 61.4 | 0.90 → 0.99 | .036 → .051 | 11.4 % | Sun brighter |

Hero-emitter peaks in pass B (local maximum at the emitter):

| Emitter | Peak luma | Verdict |
|---|---|---|
| Ember (c00_s0, 379,259) | **0.57** | unchanged; a dull orange dot |
| Membrane spark (c00_s2, 633,270) | 0.91, 2 px | grey-white pixel, no bloom |
| Impact (c03_s4, 309,351) | 0.97 | soft Gaussian, no hard core |
| Flame core (c04_s1) | **1.00** | fixed |
| Mote (c06_s3, 294,467) | **0.92** | *dimmer* than the city cluster next to it (0.94) |
| Last light (c07_s3, 480,327) | 0.97 | now beats the lattice (max 0.76); fixed in level |
| Sun (c07_s4) | mean 0.94, max 0.99 | now the brightest object (swarm p99 0.74) |

The AgX change works: the flame, the Sun, Pattern's seeds and the last light now reach display white. The ember, the spark, the mote and the impact were not given the extra energy, and they are the four the story leans on hardest. Colour remains thin on the day-side planets: GOE chroma 0.028, Drift 0.026, Snowball 0.004.

---

## Chapter 0 — Prologue

### c00_s0 — Black to ember — **6/10** (A: 6, held; frame is pixel-identical)
*Still the most 2001-like restraint in the batch, and still a dull, off-centre dot that will look like a dead screen on a phone.*
- **Reads:** true black and one warm point. It feels like an overture.
- **Doesn't read:** the ember sits at x≈379, y≈259 (left of centre, mid-height), not centre-low. Peak luma is 0.57, orange (249,124,45), with no white core. Lift the levels and the form around it is a flat-topped cylinder flanked by two horn shapes (x 305–420, y 260–350): a candle held between fingers. That primes the hand read of the next shot. There is no shimmer.
- **Pass-A status:** (1) centre the ember at x≈480, y≈330–350: **not fixed**. (2) white-hot core ≥ 0.95 with halo and umber spill on the throat lips: **not fixed** (0.57). (3) visible heat shimmer: **not fixed**.
- **Fixes:**
  1. Move the ember to x≈480, y≈340 and give it a white core (luma ≥ 0.95) about 3–4 px across inside a 20 px ember halo, with umber spill catching only the throat lips.
  2. Replace the two horns with a ragged, flanged throat lip. The silhouette must not be readable as fingers even at +6 stops.
  3. Add a sparse particulate field over x 420–540, y 120–320, refracted by the shimmer, so the heat has something to distort.

### c00_s1 — The chimneys — **4/10** (A: 4, held; 3.2 % of pixels changed)
*It is a hand. Lift the levels and it is unmistakably a palm with three fingers and a thumb, glowing at the fingertips.*
- **Reads:** dark, warm, venting.
- **Doesn't read:** the spires at x 280–470, y 280–540 have rounded fingertip caps and taper like fingers from a common "palm". A thumb sits at x 420–470, y 305–420. The plume (x 330–450, y 60–280) is a smooth, evenly lit cone, five times brighter (mean luma 0.097) than the chimney bodies (0.018). It reads as a flashlight beam, not black smoke. The stray glints at x≈710, y≈430 and x≈185, y≈375 remain. The right half of the frame is still empty.
- **Pass-A status:** (1) jagged, flanged silhouettes with carbonate frost: **not fixed**. (2) dark plume lit only at the base: **not fixed**. (3) rebalance with a right-foreground chimney; fix the stray glint: **not fixed**.
- **Fixes:**
  1. Rebuild the spires as irregular stacks: beehive flanges, leaning, uneven widths, no round caps, pale carbonate (`#d8d2c4`) on a few ledges. The test is a +3-stop lift that must not read as a hand.
  2. Make the plume black smoke: lit orange only in its first 30–50 px above the throat (x 370–410, y 230–280), roiling and dark above.
  3. Add a big out-of-focus silhouette chimney at x 700–900 with a thin rim, and turn the glint at x≈710, y≈430 into a deliberate distant vent with its own small plume.

### c00_s2 — The membrane closes — **4/10** (A: 5, **worse**)
*Same bubble in the same wrong place. The saturation boost has turned the fog behind it into a brighter orange wall.*
- **Reads:** the thin-film sphere is still the prettiest object in chapter 0. On the right side there is now a faint inner arc that hints at a bilayer.
- **Doesn't read:** the sphere is still at x≈633, y≈270 with a radius of about 50 px, off-centre for the match cut. The spark is a 2 px grey-white pixel (0.91) with no bloom, so the membrane is not lit from within. The orange fog (x 300–760) got more saturated (chroma 0.130 → 0.184), and near-black is still only 57 %. The fingertip chimney at x≈330–400, y≈445–540 is still there. The sphere's left edge is stair-stepped at 4×.
- **Pass-A status:** (1) centre the sphere and match it to the Earth's radius: **not fixed**. (2) crush the fog, keep one backlight gradient: **not fixed, worse** (more saturated). (3) spark flare of 30–60 px lighting the membrane, bilayer rim: **spark not fixed**; bilayer **partly** (a faint inner arc on the right only).
- **Fixes:**
  1. Centre the sphere at x≈480, y≈270, radius matched to GOE's opening disc.
  2. Crush the fog to below luma 0.04 outside a soft warm crescent behind the sphere's lower-left rim. Remove the fingertip chimney at the bottom edge.
  3. Make the spark the event: a white core of about 4 px with a 40 px bloom that brightens the interference colours from inside. Anti-alias the sphere edge.

---

## Chapter 1 — Microbial Earth

### c01_s1 — The mat — **4/10** (A: 4, held; 6.6 % of pixels changed)
*Unchanged: vector rings and ladder capsules on blotchy clouds.*
- **Reads:** teal versus amber populations.
- **Doesn't read:** cells are still uniform-stroke outline rings. Rods are still outline capsules with ladder rungs (x 140–200, y 0–115; x 385–515, y 8–40; x 305–370, y 405–540), and two are still cropped by the top edge (x 540–655, y 0–10). There is no visible depth of field despite the fix list, no division, no hero bloom and no rust bands.
- **Pass-A status:** (1) volumetric darkfield cells, rods with septation: **not fixed**. (2) DOF with soft foreground cells: **not visible on screen**. (3) a hero bloom at a third with dividing cells: **not fixed**.
- **Fixes:**
  1. Darkfield shading: a bright fresnel rim fading to a translucent interior with a faint nucleoid. No constant-width stroke. Rods become soft gradient capsules with one or two septa.
  2. Two huge defocused cells in opposite corners (x 0–200, y 380–540 and x 780–960, y 0–160), with the hero focal band through y 180–380.
  3. One dense bloom around x 640, y 200 with three or four dumbbell-pinched dividing cells, and the rest falling to black.

### c01_s2 — The Great Oxidation — **4/10** (A: 4, held)
*Reframed and relit from the right, but the shot's whole point (orange haze clearing to a blue limb, rust shelves) is still not on screen.*
- **Reads:** a clean planet with a good cyclone (x 255–440, y 185–290). The sun side is consistent with the rest of chapters 1–3.
- **Doesn't read:** the only "haze" is a 3–5 px cream tint on the top ice (RGB 169,162,142 at x 380, y 40). The right limb is neutral grey (143,146,141), not blue. The ocean is slate teal (55,94,104) and the land flat mauve-grey (107,99,101) with aliased, pixel-stepped coasts. No rust. The glint is still a soft white blob (x≈500, y≈208) that reads as lens dirt. The terminator is now a 150 px soft ramp that reads as a vignette, and the night limb has no rim (x 200–260). Two red specks on the night side (x≈245, y≈355; x≈325, y≈465) are unexplained.
- **Pass-A status:** (1) orange veil on one limb, Rayleigh blue on the other: **not fixed** (a cream hint only). (2) rust shelves and land relief: **not fixed**. (3) tight specular glint and night-limb rim: **not fixed**.
- **Fixes:**
  1. Put the transition in the frame: a visible orange haze shell (`#c8743a`, 8–15 px thick, softly volumetric) over the left half of the limb, x 200–420, clearing to a crisp blue band (4–6 px) on the right limb, x 560–612.
  2. Rust (`#8a3b1a`) banding on the shallow shelves around the land masses at x 480–600, y 190–300 and x 280–520, y 280–420. Land albedo variation, and anti-aliased coasts.
  3. Replace the glint blob with an elongated specular streak, and tighten the terminator to about 40 px with a thin backlit rim on the night limb.

### c01_s3 — Snowball — **4/10** (A: 3, partly fixed)
*Now unmistakably a planet thanks to a thin blue limb, but still a half-lit grey moon, not a white pearl.*
- **Reads:** the blue limb (x 700–745, y 130–440) and the crushed night side make this a world with air. The maria are gone at normal exposure.
- **Doesn't read:** the lit ice averages RGB (183,183,176): neutral to warm grey, not `#eef6ff`, and peppered with grey speckle like lunar regolith. The fix list's "glacial blue-white ice" is not on screen. Only about 40 % of the disc is lit, so it still reads as a first-quarter moon. A warm ochre band just inside the limb (x 700–740) reads as haze on a planet that should be frozen clear. At +4 stops the night side still shows blotches and red dots (x 420–560, y 150–440). There is no ice front, cracking or thaw.
- **Pass-A status:** (1) gibbous ~70 % lit, blue-white ice, specular: **not fixed** (about 40 % lit, grey). (2) crush the night side, add a blue limb: **fixed**. (3) show the process (equatorial band, cracks): **not fixed**.
- **Fixes:**
  1. Make it a pearl: about 75 % lit, ice graded to `#eef6ff` with soft subsurface blue in the pressure ridges, and a broad soft specular. Remove the grey speckle.
  2. Show the beat: a narrowing dark equatorial ocean band, or a network of faint blue cracks for the thaw.
  3. Swap the warm inner band at the limb for clean cold blue.

---

## Chapter 2 — The Many-Celled

### c02_s0 — Endosymbiosis — **4/10** (A: 4, held; 8.2 % of pixels changed)
*Unchanged: a fried egg inside a pink ring, under a bubbles screensaver.*
- **Reads:** host, nucleus, captive; the palette is on brief.
- **Doesn't read:** the captive (x 435–600, y 165–345) is still concentric ellipses with a noise fill and stair-stepped edges (clearly aliased at 2.6×). It has no cristae and no engulfing flow. About 60 uniform bokeh discs still cover the host. The blue nucleus (x 170–400, y 225–450) still competes with the hero. No DOF change is visible.
- **Pass-A status:** (1) real cristae, smooth edges: **not fixed**. (2) cut 70 % of the bokeh: **not fixed**. (3) push in, captive at a third, nucleus defocused: **not fixed**.
- **Fixes:**
  1. Cristae: 6–10 sinuous lamellae folding across the captive's interior, emitting the gold glow from the folds. Supersample the edges.
  2. Delete the bokeh over the host. Keep three or four huge, very soft discs at the frame corners only.
  3. Push in so the captive fills about a third of the frame at the right third (centre x≈640, y≈270). Blur the nucleus to a soft blue presence and darken it 50 %.

### c02_s1 — Colonies — **5/10** (A: 2, partly fixed; biggest single improvement in the batch)
*Volvox spheres with daughter colonies have arrived, but the mat's ladder-rods are now stabbing through them like pipettes.*
- **Reads:** hollow dotted spheres with green daughter colonies inside, at several sizes. The beat finally exists, and the frame no longer looks like a re-use of the mat.
- **Doesn't read:** the rods remain and now pierce the colonies. One rod (x 610–720, y 240–345) runs into the big colony and ends exactly on a daughter colony, so it reads as a needle injecting a cell. Others are at x 165–320, y 0–170 (through the top-left colony), x 475–620, y 192–230 and x 685–850, y 285–380. The four spheres at top-left (x 110–590, y 0–300) interpenetrate like flat 2D circles with no depth order or defocus. The mat's teal cloud-and-ring biomass and amber cells still fill the background (x 590–960, all heights; x 0–200, y 180–320), so the environment hasn't changed scale. The shell dots are uniform, with no cell volume and no gel shell.
- **Pass-A status:** (1) Volvox spheres with daughters, one assembling: **mostly fixed** (no visible assembly). (2) different environment, clear dark water: **not fixed**. (3) remove or redesign the ladder-rods: **not fixed, worse** (they now collide with the hero objects).
- **Fixes:**
  1. Delete the rods from this shot.
  2. Replace the mat biomass background with clear dark water and a few distant out-of-focus colonies. Separate the spheres in depth: one hero in focus around x 560, y 380, the others smaller and blurred.
  3. Give the shell a faint gel membrane (a translucent fresnel sphere) under the cell dots, and show free cells streaming into one shell.

### c02_s4 — The Cambrian seafloor — **3/10** (A: 3, held)
*Same leaf sprites, barcode rays, ruler horizon and clipped glows. Now milkier still (19 % near-black).*
- **Reads:** dark water, cyan and magenta bioluminescence, particulates. A few soft gold dapples on the floor (x 300–900, y 280–520).
- **Doesn't read:** the vector leaf sprites are unchanged (x 515–590, y 295–490; x 245–300, y 175–300; x 830–890, y 160–310 and others). So is the hard horizon at y≈118 with its lit band, and so are the vertical barcode rays (x 120–720, y 0–120). The creatures are still streaks with no bodies. The **hard polygonal clipping** on the glows is still there, for example x 625–660, y 375–430, x 750–765, y 400–425 and x 930–955, y 355–375. The "caustics" are isolated soft ellipses, not a connected network, and no ripple relief is visible. Near-black fell from 30.5 % to 19.0 %.
- **Pass-A status:** (1) caustics on rippled sand, depth fog, no hard horizon: **caustics partly** (dapples only); **ripples, fog and horizon not fixed**. (2) rooted 3D fauna in place of leaves, readable bodies, fix clipping: **not fixed**. (3) wide diagonal god rays: **not fixed**.
- **Fixes:**
  1. Kill the horizon: exponential fog to abyssal blue-black from y≈260 upward, so the floor dissolves with no line. Remove the barcode rays and add two or three wide diagonal shafts from the top-left that pool on the sand around x 300–500, y 350–450.
  2. Delete the leaf sprites. Replace them with rooted sponges, fronds and tubes anchored to the floor, and give 6–10 creatures bodies (segments, spot rows) with short trails.
  3. Fix the polygon clipping on the glow sprites and turn the dapples into a connected, animated caustic web on visibly rippled sand.

---

## Chapter 3 — The Animal Kingdom

### c03_s1 — The living land — **3/10** (A: 3, held; 1.2 % of pixels changed)
*Unchanged: green velvet, film scratches and lens smudges.*
- **Reads:** low aerial terrain with many agents.
- **Doesn't read:** everything pass A listed is still there. Agents are random white dashes on pale disc splats, there are no herds, there is no key light or horizon (brown murk at y 0–60), and 82.8 % of the frame sits below luma 0.12 with nothing truly black.
- **Pass-A status:** (1) raking key light, sky and horizon: **not fixed**. (2) herds and packs with aligned trails, gold and red cores ≥ 0.6, no splats: **not fixed**. (3) vegetation texture: **not fixed**.
- **Fixes:** the pass-A three, unchanged. The most important is a single low raking light from frame left that gives the ridges (x 0–960, y 60–300) bright faces and black shadows, plus a horizon line at y≈90. Then remove the disc splats under every agent.

### c03_s3 — Drift — **5/10** (A: 5, held)
*Still a handsome generic desert exoplanet, and now the third chapter-1–3 orbital in the same framing.*
- **Reads:** the clean blue limb on the right (x 760–800) is still the best day-side atmosphere in the film. It works as a wallpaper.
- **Doesn't read:** the land is beige (131,121,108) with turquoise inland seas (46,100,116). It reads as Arrakis or Pangaea with lakes, not emerald forest with ochre deserts. There are no rift seams, no plate ghosts, no recognisable Africa–South America fit, no ocean specular and no cloud shadows. The layout (disc right of centre at about x 605, lit from the right, black left half) is the same as GOE and Snowball.
- **Pass-A status:** (1) era colour, emerald and ochre, navy ocean with glint, cloud shadows: **not fixed**. (2) rift lines or motion ghosts: **not fixed**. (3) camera on the Atlantic split: **not fixed**.
- **Fixes:**
  1. Grade the land emerald (`#2f8f4e`) with ochre interiors, deep navy open ocean, a tight sun glint, and cloud shadows offset about 3 px.
  2. Reframe as a regional close-up on the opening South Atlantic, with faint red rift glow along the seam. That also breaks the three-in-a-row framing.

### c03_s4 — Chicxulub — **5/10** (A: 5, held)
*Still the most dramatic planet, still a sponge-textured beige ring and a soft lamp.*
- **Reads:** scale, fires on the night side, a day side with air.
- **Doesn't read:** the curtain (x 230–750) is mean RGB (77,58,35) with a cellular "bread crust" texture and peaks at 0.67. It has no white-hot lip, no temperature gradient and no shadow. The flash at x≈309, y≈351 now reaches 0.97, but it is still a soft Gaussian about 80 px wide with no hard core, and it does not look concentric with the ring. The ejecta are still blobs, not directional streaks.
- **Pass-A status:** (1) curtain temperature gradient, volume and shadow: **not fixed**. (2) hard 6 px core inside bloom, concentric: **partly** (brighter, still no core). (3) ejecta as radiating streaks: **not fixed**.
- **Fixes:**
  1. Grade the curtain across its width: a white-hot outer lip (`#fff1d0`, luma ≥ 0.9) through orange and dull red to soot on the inner edge. Lose the cellular texture.
  2. A 6 px core at 1.0 inside the bloom, plus a faint surface shock ring that visibly radiates from it.
  3. Ejecta as 10–40 px streaks on arcs radiating from x≈309, y≈351.

---

## Chapter 4 — Hominins

### c04_s1 — The first flame — **4/10** (A: 4, held)
*The flame finally reaches white, but the rocks are still lit from the wrong side and the forest is still European.*
- **Reads:** a bright fire with a near-white base (peak 1.00 at x≈472, y≈401), and embers climbing into stars, which is still the best element. The six-spoke log star is gone; four sticks remain.
- **Doesn't read:** the rocks are now low-poly faceted boulders. They look like game props and still form a ring (x 170–800, y 405–540). **Their camera-facing sides are still lit tan** (for example x 230–360, y 450–530 and x 520–640, y 460–540) although the fire is behind them. The flame column (x 440–560, y 195–380) has a blocky pixel texture and floats above the sticks. The sticks are smooth dowels with no char or glow. The conifer treeline (y 225–260) and the hard blue horizon stripe (y 195–245) are unchanged. Near-black fell to 55 %.
- **Pass-A status:** (1) fix the light direction, silhouetted rocks, inverse-square ground spill: **not fixed**. (2) simplify toward kindling on bare earth, ≥ 70 % darkness: **partly** (simpler sticks, ring kept, darkness 55 %). (3) white core, flicker tongues, embers in the wood, acacia skyline: **core fixed**; tongues, embers in the wood and acacia **not fixed**.
- **Fixes:**
  1. Invert the rock lighting: camera-side faces near-black with a hot orange rim on top. Only the far-side rocks catch full firelight.
  2. Replace the conifers with a sparse acacia skyline and dissolve the blue stripe into a gradient from about y 150 to y 250.
  3. Let the flame lick up from glowing, charred sticks, and break the column's pixel texture into tongues.

### c04_s2 — Out of Africa — **4/10** (A: 2, partly fixed)
*The small disc with negative space is a real improvement and India, Arabia and Africa now read, but the rectangle is still there and nothing flows.*
- **Reads:** a wallpaper-friendly small globe in the right half (x≈478–862, y≈90–455) with a clean sunlit rim on the left. The night side is near-black around the land. India (x≈680–760, y≈280–360), Arabia (x≈555–650, y≈240–300) and East Africa (x≈490–580, y≈290–440) are identifiable.
- **Doesn't read:** the **rectangular bar is still present**, now at x≈730–770, y≈195–265: a pale, tilted, round-ended slab with hard sides. Region fills are still blocky and flat (Arabia, India). A uniform gold glitter still covers all land, occupied or not, so the human light cannot be told from the ground. There are no streams, fronts or tails, so direction does not read. There is no cooler Neanderthal amber in Europe. No ice-age ice is visible anywhere on what should be the Last Glacial Maximum globe (the polar region x 520–800, y 95–180 is just dark).
- **Pass-A status:** (1) dispersal as flow with fronts and tails, no glitter: **not fixed**. (2) fix the rectangle and blocky fills: **not fixed** (the rectangle moved; it did not go away). (3) whole globe framed, night ground near-black, Neanderthal amber: **framing fixed**, **ground fixed**, **Neanderthals not fixed**.
- **Fixes:**
  1. Remove the bar at x≈730–770, y≈195–265 and soften the region fills.
  2. Replace the glitter with tapered streams of warm particles along the Nile, Levant and south-Asian coast with bright fronts, the only warm light on the disc. Give Europe a cooler, paler amber being overrun.
  3. Show the LGM ice sheet in glacial blue-white (`#b8d8f0`, moonlit and dim) across the north of the disc.

### c04_s3 — Handprints — **3/10** (A: 3, held; most-changed frame, 87.5 % of pixels)
*The blacks and the light falloff are fixed, but the hands have almost disappeared into a leopard-print wall.*
- **Reads:** a warm source low-left (x 0–300, y 380–540) falling off to black at the right. Near-black is up from 22 % to 51 % and the vertical streaks are gone. One stencil reads on a second look (x 280–380, y 310–460), with a ghost above it (x 230–300, y 130–350).
- **Doesn't read:** the hero hand is RGB (168,77,1) against a surround of (162,75,1), **about 4 % contrast**, so at a glance there is no hand in "Handprints". The "spray clouds" are near-black blotches (30,2,1) covering the whole wall in a leopard or camouflage pattern. They read as soot or mould, the opposite polarity of a red-ochre spray. Both hands still run on into long forearm shapes. Max luma is 0.45: no highlight and no rock relief.
- **Pass-A status:** (1) true negative stencils with a red ochre halo, varied sizes and ages: **not fixed** (the halo became black blotches everywhere). (2) raking low-left firelight falling to black, relief: **falloff fixed**, **relief not fixed**. (3) remove the streaks: **fixed**.
- **Fixes:**
  1. Remove the black blotch field. Spray ochre (`#a8402a`) only around each hand, densest at the hand's edge and fading over 20–40 px, so the bare-rock hand reads as a light silhouette in a red cloud. Hand-to-halo contrast should be at least 30 %.
  2. Hands end at the wrist. Show four or five stencils of varied size (one child's), with the hero at x 250–450, y 280–480 in the hot spot.
  3. Add a rock normal map so the raking light picks up bumps (highlights ≥ 0.7 on the nearest ridges), and flicker the key.

---

## Chapter 5 — Ancient Civilizations

### c05_s2 — Empires breathe — **2/10** (A: 3, **worse**)
*A constellation over a red nebula. The planet, the Mediterranean and Rome are all gone.*
- **Reads:** a limb-shot layout (planet in the lower 45 %, black sky above), with a reddish cloud and gold-lined networks.
- **Doesn't read:** at normal exposure there is no planet, no limb and no atmosphere line, only a brown-red smoke cloud (x 30–700, y 300–540) under stars. The empire has no frontier. Two gold polylines with grey dot nodes along the bottom edge (x 235–345, y 450–540; x 490–670, y 480–540) sit under a starfield, so they read **exactly** as a star chart. There is no coastline, land or sea. 99.0 % of the frame is below luma 0.12.
- **Pass-A status:** (1) imperial-red territory with a crisp frontier that frays: **not fixed**. (2) readable coast, Mediterranean filling the frame: **not fixed, worse** (no geography at all now). (3) hold back the trade lines: **not fixed** (they are the brightest element).
- **Fixes:**
  1. Restore a whisper of geography: land about 0.03–0.05 luma, sea at 0.01, a faint coastline line, and the Mediterranean silhouette across the middle band (y 300–480). Add the thin atmosphere arc along the limb (around y≈290) so the planet exists.
  2. Draw Rome as a flat imperial-red tint (`#9e2b25`) with a 1–2 px glowing frontier, and split the East's hue.
  3. Remove the polylines from this shot.

### c05_s3 — Threads — **4/10** (A: 3, partly fixed)
*Better composition: a diagonal route across a limb with negative space. But the ground glows aurora green and the thread still looks like a dot-to-dot.*
- **Reads:** an oblique, curved route sweeping from top-left to the limb at x≈550, with the planet occupying the left 55 % and black space right. The gold line now reads as gold.
- **Doesn't read:** the surface is a murky jade-green glow with a mauve patch (x 0–250, y 0–280) and dark brush strokes, so it reads as aurora or nebula, not night-side land. The thread is a 1.5 px line joining evenly spaced grey-white bead nodes (x 0–575, y 165–410). That is the constellation grammar again, with no bloom and no comet tails. The route ends in a **hook floating off the limb** in black space (x 555–575, y 312–330), and an orphan warm point sits at x≈600, y≈495. No monsoon sea routes are visible.
- **Pass-A status:** (1) hot gold core, wide bloom, moving beads with tails, lifted arcs: **partly** (gold colour only). (2) black night ground: **not fixed** (green lifted ground). (3) compose around curves: **fixed**.
- **Fixes:**
  1. Ground to near-black with the same faint geography as Empires. Remove the green and mauve polity washes from this shot.
  2. Threads as continuous, slightly bloomed gold filaments (2–3 px core, 10–15 px glow) with 3–5 beads carrying 20–40 px comet tails. No evenly spaced node dots.
  3. Either end the thread on the surface or arc it cleanly over the limb. Delete the hook at x 555–575, y 312–330 and the orphan point at x≈600, y≈495. Add an Indian Ocean sea arc toward the lower right.

### c05_s4 — The plague — **2/10** (A: 2, held; partly addressed)
*No longer interchangeable with Empires. Now it is a grey-and-gold star chart on a black frame, with no planet and no tide.*
- **Reads:** two line states, ash-grey dead routes and gold beads, so a before/after exists in data. There is a dark red blob (x 580–910, y 150–460).
- **Doesn't read:** at normal exposure the planet is invisible (98.4 % near-black). Grey straight-segment polylines with grey nodes (x 360–960, y 260–540) over black, plus scattered gold dots, read as a constellation chart. The "red front" is a soft circular smudge, not a leading edge. Nothing indicates the direction of travel. A gold fragment (x 185–195, y 450–540) dangles off the bottom edge.
- **Pass-A status:** (1) a negative-space front: gold ahead, ash behind, a visible leading edge: **partly** (gold and ash exist, no edge). (2) change the camera from Empires: **fixed**. (3) cities flickering back at the tail: **not visible**.
- **Fixes:**
  1. Restore the planet: faint geography plus a limb arc, so the routes sit on Europe and the Black Sea.
  2. Make the front a line: a thin, sickly desaturated band crossing the routes (for example a diagonal from x 560, y 150 to x 760, y 540), gold and bloomed ahead of it, ash-grey and dead behind it.
  3. Drop the node-dot grammar here as well, and show two or three cities rekindling dim red at the tail.

---

## Chapter 6 — The Modern World

### c06_s1 — Ignition — **4/10** (A: 3, partly fixed)
*The cap is gone and the night is black, so the lights finally own the disc. But they are still cauliflower blobs of khaki light.*
- **Reads:** a black night side with two clusters (eastern North America x 35–75, y 215–275; Europe x 285–385, y 265–340), a warm-to-blue sunrise rim along the top-left limb, and negative space on the right.
- **Doesn't read:** cluster colour is khaki-cream (141,131,90), not sodium (`#ffae42`). Inside each cluster is a blocky square/Worley mottle (6–10 px cells at 4×): the hex mosaic was replaced by another mosaic. There is no road filigree and no point structure. The shipping lines are 1 px white polylines with hard kinks (x 70–300, y 255–320 and the fan at x 220–300, y 330–540) and read as cracks in glass. The disc's top limb is clipped by the frame top at x 250–350 (a near-tangent), and the disc is also cut at the bottom-left. There is no industrial haze.
- **Pass-A status:** (1) point-sprite clusters, sodium cores, filigree: **not fixed** (mosaic type changed). (2) night grade, dim ice, lights ≥ 5× everything: **fixed**. (3) brown haze halos: **not fixed**.
- **Fixes:**
  1. City light as point sprites: a few hundred real-city points with log-scaled size, sodium cores (`#ffae42`), a tight bloom, and faint road threads between neighbours. No cell texture.
  2. Lower the disc about 30 px, or push in, so the top limb is either clearly inside the frame or decisively cropped.
  3. Silver wakes as smooth great-circle arcs (no kinks), plus a faint brown haze halo (`#5a4a3a`) over the brightest clusters.

### c06_s3 — The mote — **4/10** (A: 3, partly fixed)
*A beautiful twilight limb, but the mote is still on the ground, sitting in a city, and dimmer than the city.*
- **Reads:** the best atmosphere in the film: a thin blue-into-orange twilight arc along the limb (x 0–520, y 80–230) over black. The night-side framing fixes the chapter's day/night jump.
- **Doesn't read:** the "mote" is a white point with a short orange exhaust at x≈294, y≈467. That is **inside the disc**, directly beneath a large city cluster (x 225–390, y 310–440), and at luma 0.92 it is dimmer than that cluster (0.94). It reads as a bright city, not something rising off the limb and leaving. A cream sliver on the right limb (x 515–640, y 140–270, RGB 137,119,93, the same colour as the clusters) is city light smeared along the limb, which competes with the mote and looks like a lit crescent. The white route lines have right-angle kinks (x≈560, y 195–215) and several wobble **off the limb** into space (x 690–715, y 420–540). The clusters have the same camo mosaic as Ignition.
- **Pass-A status:** (1) a crisp white point off the limb against black, with a streak and an arc: **not fixed** (the point exists but is on the surface). (2) recognisable Earth: **moot** (night side now; geography still not readable). (3) remove the lower-left smears: **partly** (now point-and-blob clusters, still mosaic).
- **Fixes:**
  1. Put the mote **above** the twilight arc in the black, at about x 640–700, y 60–120, at luma 1.0 with a 1–2 px bloom, a short exhaust and a faint arc trail rising from the surface. Remove or dim the cluster beneath it.
  2. Fix the limb smear of city light (x 515–640, y 140–270) and the lines straying off the limb (x 690–715, y 420–540).
  3. Smooth great-circle routes with no kinks, and city points instead of mosaic blobs.

### c06_s4 — The mesh — **3/10** (A: 3, held)
*The fibre that names the shot is still almost invisible, and the limb still smears the city light into bars.*
- **Reads:** a horizon-arc composition with a big black sky. That is a good wallpaper layout.
- **Doesn't read:** only about 500 pixels in the whole frame have any cyan bias. The fibre arcs (x 480–900, y 260–540) are 1 px dotted lines at very low intensity. The clusters near the limb are **stretched radially into bars**: a comb of bars at x 430–520, y 245–275 and a vertical slab at x 370–450, y 280–470. Near the limb, foreshortening should compress features, not stretch them, so these are projection artifacts. The clusters are cream camo-mosaic blobs, the same as the rest of the chapter.
- **Pass-A status:** (1) cyan arcs as the hero, with pulses, bloom and limb arches: **not fixed**. (2) fix the vertical streaking, replace the mosaic: **not fixed**. (3) dim the cap, frame on an ocean crossing: **cap fixed**, framing partly.
- **Fixes:**
  1. Make the mesh the hero: `#7ff5ff` arcs at 2 px core with 8–12 px glow, lifted so they visibly arch off the limb into the black above y 245, with travelling packets carrying short tails. Target at least 3 % of the frame in cyan.
  2. Fix the radial stretch at the limb (x 120–520, y 245–470).
  3. Dim the cities to about 50 % so the cyan carries the frame.

---

## Chapter 7 — The Singularity

### c07_s1 — The pattern — **7/10** (A: 6, improved; best frame of the batch)
*A cold crystal plate cracking across the world. The front is now the brightest line, but the warm side is still a footnote and the front reads as a sticker border.*
- **Reads:** a clear line hierarchy (seams > lattice > fine sub-grid). Seed nodes carry radial pulse glows (x≈470, y≈148; x≈308, y≈232; x≈380, y≈288; x≈828, y≈446). The lattice now has a faint cold tint (mean RGB 32,43,50). The advancing front is the brightest edge. Warm human light now exists in the unconquered gap (x 495–575, y 450–520; x 640–710, y 385–460). The sun-side limb rim (x 90–300, y 0–260) is lovely.
- **Doesn't read:** the warm side is about 8 % of the lit pixels (11 k warm against 92 k cold), and it is khaki camo-mosaic blobs, not flickering amber (`#ffb066`). The front is a uniform thick white stroke with a symmetric Gaussian halo on both sides, so the conquered region reads as a **die-cut sticker with a white border** laid on the globe, rather than a crystal growing into resistance. There are no resistance flares at the front. The lattice is still closer to grey than to `#bfe9ff` or `#d9d4ff`.
- **Pass-A status:** (1) fill the channel with warm flicker up to the front, resistance flares: **partly** (two small warm pockets, no flares). (2) the front as the brightest line, pulses from seeds: **fixed**. (3) ice and violet tint, line-width hierarchy: **hierarchy fixed**, **tint partly**.
- **Fixes:**
  1. Make the front asymmetric: a hot leading edge that fades into the lattice behind and is crisp toward the free side, with small warm flare sparks where it touches human light (x 560–620, y 300–520).
  2. Fill the dark gap (x 560–760, y 0–540) with dense, irregular amber points, so the frame is 30–40 % warm, and replace the mosaic blobs with points.
  3. Push the lattice tint to ice blue (`#bfe9ff`) on the seams, with violet-white (`#d9d4ff`) on the sub-grid.

### c07_s3 — The last light — **6/10** (A: 5, partly fixed)
*Now you can find it: a warm point that out-shines the lattice. But the halo is a flat orange sticker with its bottom sliced off, and nothing else in the frame changed.*
- **Reads:** the warm point at x≈480, y≈327 now peaks at 0.97 with an amber halo about 30 px wide and 24 px tall. It is the brightest and only warm thing in the frame, and the eye goes to it.
- **Doesn't read:** the halo is **hard-clipped along its lower edge**: down column x=480, luma falls from 0.36 to 0.04 in a single pixel at y≈337, while the top fades smoothly. That looks like depth clipping against the globe, and at the film's emotional climax it is visible at 2×. The halo profile is a flat plateau (0.4–0.55) rather than a falloff, so it reads as a disc decal. The lattice is unchanged (1.4 % of pixels changed overall): a uniform chain-link triangle grid, with no added radial dimming, no tilt-shift and no horizon glow at the top (y 0–60). The lattice style still does not match Pattern (no seams, no seeds, no front).
- **Pass-A status:** (1) warm 15–30 px halo, satellites, flicker: **halo partly** (size right, clipped and flat); **satellites not fixed**. (2) radial lattice dimming and tilt-shift DOF: **not fixed**. (3) thin cold limb at the top, varied line weights: **not fixed**.
- **Fixes:**
  1. Fix the halo clipping at y≈337 (render it without depth test, or offset it off the surface), and give it a smooth falloff: a core of about 4 px at 1.0, then exponential decay to zero by a radius of about 25 px. Add three or four faint warm satellite pixels within 10 px.
  2. Bring Pattern's seam hierarchy into this frame (a few thick seams converging toward the point), and dim and blur the lattice radially beyond about 300 px.
  3. A thin cold atmospheric limb across the top (y 0–40), with the lattice fading into it.

### c07_s4 — The swarm — **4/10** (A: 4, held)
*The Sun now wins on brightness, but it is still a flat plate in an eye-with-lashes cloud over brown dirt.*
- **Reads:** a bright central disc (mean luma 0.94, peak 0.99) clearly brighter than the swarm (p99 0.74).
- **Doesn't read:** the Sun (x 335–485, y 180–330) is flat cream. The centre is RGB (251,247,240) and the limb (242,232,218), about 4 % limb darkening. It has no granulation or corona, an aliased edge, and dotted grey transit rows (y≈213, y≈250) that look like dead pixels. It is still left of centre (x≈410, y≈255), which breaks the ring-to-galaxy match cut. The swarm is chunky grey 2–4 px squares in an oval with radial "lashes", so it still reads as an eye. The brown haze below (x 200–700, y 330–540, RGB 49,37,27) is unchanged. There is no Mercury and no stream.
- **Pass-A status:** (1) limb-darkened, granulated photosphere, brightest object: **brightness fixed**; limb darkening, granulation and corona **not fixed**. (2) crisp thin tilted ring of glints, front arc dark across the disc, no haze: **not fixed**. (3) Mercury and its stream: **not fixed**.
- **Fixes:**
  1. Centre the Sun at x 480, y 270, with strong limb darkening (edge at about 60 % of the centre), fine granulation and a soft corona bloom.
  2. Collapse the cloud into a thin, tilted ellipse of gold and white glints whose aspect matches the opening galaxy disk. The front arc crosses the disc as a dark sparkling band. Delete the brown haze and the lashes.
  3. Mercury as a small grey disc at about x 760, y 380 trailing a spiral stream into the ring.

---

## Ranked: the 10 highest-impact remaining fixes

1. **Rebuild the prologue (c00_s0, c00_s1, c00_s2). None of it has been touched.** These are the first 10 seconds and the film's thesis image. The chimneys read as a human hand at any exposure lift, and Ember primes that read with a candle between fingers. The plume is a flashlight cone five times brighter than the chimneys. The ember peaks at 0.57, off-centre. The membrane is still at x≈633 in an orange fog that the saturation boost made stronger. Fix silhouettes first (jagged flanged stacks, no caps), then light (white-hot ember core at x≈480, y≈340; dark plume), then the centred sphere and spark flare for the match cut.
2. **Restore chapter 5's planet and retire the dot-to-dot grammar (c05_s2, c05_s3, c05_s4).** The night-side crush overshot: Empires and Plague are 99 % below luma 0.12 and show no planet, so gold polylines with grey nodes over a starfield read as constellation charts. Restore faint geography (land about 0.03–0.05, sea 0.01, coast line, limb arc). Draw threads as continuous bloomed filaments with comet beads, an empire as a red territory with a glowing frontier, and the plague as a visible front line. Remove the green and mauve polity washes in Threads and the hook off the limb.
3. **Rebuild city light across chapters 4–7 (c04_s2, c06_s1, c06_s3, c06_s4, c07_s1).** Every cluster is the same khaki (141,131,90) camo mosaic. Out of Africa still has its rectangle (x≈730–770, y≈195–265) and glitter over all land. Mesh smears clusters into radial bars at the limb (x 120–520, y 245–470), and the Mote frame smears them along its limb (x 515–640, y 140–270). Use point sprites at real city positions with sodium cores and filigree, fix the limb projection, and make Mesh's cyan fibre the hero (currently about 500 px).
4. **Last light: fix the halo clipping and finish the frame (c07_s3).** The halo is cut flat at y≈337 (0.36 → 0.04 in one pixel) at the film's emotional peak. Give it a real falloff and satellites, bring Pattern's seams down into this lattice, and add radial dimming and the cold limb. Nothing but the halo changed in this frame.
5. **Give the story's emitters the white the grade can now deliver, and fix the Mote beat (c00_s0, c00_s2, c06_s3, c03_s4).** Fire, the Sun and Pattern prove the pipeline reaches 1.0. The ember (0.57), the spark (0.91, 2 px), the mote (0.92, dimmer than the city beside it) and the impact (soft, no core) were left behind. Move the mote above the twilight arc into black space.
6. **Chapter 1–3 orbitals: beats, colour and framing (c01_s2, c01_s3, c03_s3, c03_s4).** GOE still has no haze-to-blue and no rust. Snowball is a 40 %-lit grey moon (183,183,176). Drift is beige Arrakis. The Chicxulub curtain is sponge-textured beige with no hot lip. GOE, Snowball and Drift now share one layout (disc right of centre, lit from the right, black left half). Keep the sun side, but vary the shot: Snowball as a centred, 75 %-lit pearl, Drift as an Atlantic close-up, GOE with haze on one limb and blue on the other.
7. **The three ground-level stages that didn't land (c03_s1, c04_s3, c04_s1).** Living land is unchanged: no key light, dash agents, disc splats. In Hands the stencils have about 4 % contrast and sit in a black leopard-print field; ochre should frame each hand and the wall needs relief highlights. In First flame the rock lighting is still inverted, with conifers and a blue stripe.
8. **The Cambrian seafloor (c02_s4).** The content is untouched and the frame is milkier (19 % near-black): leaf sprites, barcode rays, a ruler horizon at y≈118, polygon-clipped glows (x 625–660, y 375–430 and others) and dapples instead of a caustic web.
9. **The microscopy trio (c01_s1, c02_s0, c02_s1).** Delete the ladder rods everywhere; in Colonies they now spear the Volvox like pipettes. Mat: darkfield volumetric cells and a hero bloom. Endosymbiosis: real cristae, cut the bokeh, anti-alias the stair-stepped captive. Colonies: a clear-water background in place of the mat biomass, and depth separation between spheres.
10. **The swarm rhyme (c07_s4).** Centre the Sun (now at x≈410), add limb darkening and granulation, collapse the eye-shaped cloud into a thin tilted glint ring matched to the galaxy disk, remove the brown haze (49,37,27), and add Mercury's stream.

## Broken or obviously wrong frames

No frame is blank or white. These are wrong on screen:
- **c05_s2 Empires** and **c05_s4 Plague:** the planet is invisible at normal exposure (99.0 % and 99.3 % below luma 0.12), so both read as star charts. Wrong content as captured.
- **c04_s2 Out of Africa:** the rectangular bar is still present at x≈730–770, y≈195–265, with blocky region fills and glitter over all land. The fix list says "no rectangles"; the frame says otherwise.
- **c07_s3 Last light:** the halo is hard-clipped along y≈337.
- **c06_s4 Mesh:** radial bar artifacts in the limb clusters (x 430–520, y 245–275; x 370–450, y 280–470). The named subject (cyan mesh) is effectively absent.
- **c06_s3 Mote:** route lines wobble off the limb into space (x 690–715, y 420–540), a route has a right-angle kink (x≈560, y 195–215), city light is smeared along the right limb (x 515–640, y 140–270), and the mote is not off the limb.
- **c05_s3 Threads:** the route ends in a hook floating outside the limb (x 555–575, y 312–330).
- **c02_s4 Cambrian:** hard polygonal clipping on the glow sprites (x 625–660, y 375–430; x 750–765, y 400–425; x 930–955, y 355–375).
- **c02_s1 Colonies:** rods pierce the colonies; one ends on a daughter colony like a needle (x 610–720, y 240–345).
- **c00_s1 Chimneys:** reads as a human hand. This is a content error at the film's opening.
- **c04_s1 First flame:** inverted lighting on the camera-side rocks (x 230–360, y 450–530; x 520–640, y 460–540).
- **c02_s0 Endosymbiosis:** stair-stepped aliasing on the captive's rings (x 435–600, y 165–345).
- **c00_s0 Ember:** not broken, but it peaks at luma 0.57 on a 99.9 %-black frame and will look like a dead screen on a phone or in a bright room.

## Repetition

- **Fixed: the six identical north-up polar-cap globes.** All six are now different shots: a small disc in Out of Africa, limb arcs in Empires, Mote and Mesh, an oblique pass in Threads, and a cropped disc in Ignition. This is the biggest structural improvement of the pass.
- **New triplet in chapters 1–3.** GOE, Snowball and Drift all put the disc right of centre, lit from the right, with the terminator through the middle and a black left half. Chicxulub, also lit from the right, follows. Keeping one sun side was the right call, but the camera now repeats across chapters 1–3 in place of chapters 4–6.
- **Limb-arc shots three times in chapters 5–6** (Empires, Mote, Mesh), two of them back to back in chapter 6. Mote → Mesh will play as a small camera drift over the same cream clusters rather than a new beat. Make Mesh a full small disc wrapped in cyan, or a high oblique where the arcs leap the ocean.
- **One cluster texture in five frames** (Out of Africa glitter, Ignition, Mote, Mesh, Pattern): the same khaki camo blob. It erases the difference between the 1800s, 1969, the 2000s and the 2030s.
- **The constellation grammar** (straight segments joining evenly spaced node dots) now defines all three chapter 5 shots and has become more literal against black. "Era-specific line languages" is only partly on screen: gold and ash are present, but the drawing style is identical. Silver wakes in chapter 6 are white kinked polylines, and cyan fibre is barely present.
- **Microscope déjà vu:** Mat and Colonies still share the teal/amber cloud fields, ring cells and ladder rods. Colonies is now distinguishable only because of the Volvox.
- **The circle rhyme is still off-centre in its two key shots:** the membrane (x≈633) and the Sun (x≈410). Meanwhile the non-rhyme globes have moved off-centre, which was correct. Now centre the rhymes.

## Continuity between consecutive shots

- **Membrane → young Earth:** not fixed. The sphere is still off-centre at x≈633 with a radius of about 50 px.
- **Sun side:** largely fixed. Chapters 1–3 are lit from the right; Out of Africa, Ignition and Pattern from the left or top-left. The Mote frame's cream sliver on the right limb reads as a sunlit crescent and contradicts it; it is city light smeared at the limb, and fixing that also fixes the continuity.
- **Ice-cap logic:** inverted the other way. The cap no longer dominates chapters 5–6, which is good, but the ice-age globe (Out of Africa) now shows no ice at all. The LGM should be the iciest Earth in chapters 4–7, with visible shrinkage by the 2020s.
- **Day/night rhythm in chapter 6:** fixed. Ignition, Mote and Mesh are all night side.
- **Threads → Plague:** a grade jump inside one chapter. Threads has a lifted green and mauve surface; Plague has an invisible black planet. Pick one night-side grade for chapter 5.
- **Pattern → Last light:** not fixed. Pattern has seams, seeds, a front and sub-grid; Last light is a uniform triangle grid. The descent should look like the same crystal seen closer.
- **Fire → Hands:** partly fixed. Both are now warm with a source and falloff. Carry the same amber (`#ffb347`) and the same flicker into the cave; the cave is currently redder and has no visible flicker structure.
- **Swarm → galaxy disk:** not fixed. The Sun is off-centre in an oval cloud, with no ring ellipse to hand off.

## Score trend versus pass A

| Chapter | Pass A | Pass B | Change |
|---|---|---|---|
| 0 Prologue | 6, 4, 5 (5.0) | 6, 4, 4 (4.7) | −0.3 (membrane fog worse; nothing else touched) |
| 1 Microbial | 4, 4, 3 (3.7) | 4, 4, 4 (4.0) | +0.3 (Snowball limb) |
| 2 Many-celled | 4, 2, 3 (3.0) | 4, 5, 3 (4.0) | +1.0 (Volvox) |
| 3 Animals | 3, 5, 5 (4.3) | 3, 5, 5 (4.3) | 0 (grade only) |
| 4 Hominins | 4, 2, 3 (3.0) | 4, 4, 3 (3.7) | +0.7 (Out of Africa framing) |
| 5 Ancient | 3, 3, 2 (2.7) | 2, 4, 2 (2.7) | 0 (Threads up, Empires down) |
| 6 Modern | 3, 3, 3 (3.0) | 4, 4, 3 (3.7) | +0.7 (night grade, Mote framing) |
| 7 Singularity | 6, 5, 4 (5.0) | 7, 6, 4 (5.7) | +0.7 (Pattern, halo) |
| **All 24** | **3.71** | **4.08** | **+0.37** |

- Improved: Colonies +3, Out of Africa +2, and +1 each for Snowball, Threads, Ignition, Mote, Pattern and Last light.
- Regressed: Membrane −1 (more saturated fog) and Empires −1 (planet lost).
- Held: 14 frames. Nine of them (Ember, Chimneys, Mat, Endosymbiosis, Cambrian, Living land, Drift, Chicxulub, Swarm) got no content change beyond the global grade.
- Frames at 3/10 or below: 12 → 6. Frames at 6/10 or above: 2 → 3.

**Bottom line.** The pass-A fixes that were made mostly work: camera variety, night grade, Volvox, the last light's visibility and Pattern's hierarchy. About half the batch was not touched, including the whole prologue, and a few claimed fixes are not visible on screen: the rectangle, the mosaic, the DOF, the glacial ice and the lattice softening. The next pass should spend its effort on the opening 10 seconds, on restoring chapter 5's planet, and on one shared city-light renderer, because those three items cover 11 of the 24 frames.
