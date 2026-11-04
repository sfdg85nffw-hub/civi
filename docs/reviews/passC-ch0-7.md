# Pass C review: chapters 0–7 (24 stills)

I judged on-screen content only, against `DESIGN.md`, the pass-B report and the claimed fix list. I did not open any code. The frames are 960×540, and coordinates are in pixels from the top-left. I measured B and C with the same script:
- luma is Rec.709;
- chroma is mean(max−min RGB);
- Δpx is the share of pixels that changed by more than 0.05 on any channel;
- "+N stops" means the frame was exposure-lifted to inspect it.

## Verdict in five lines

1. **Fewer than half of the claimed fixes are on screen.** Seven frames are essentially unchanged: Mat, Endosymbiosis, Living land and Chicxulub at 0.0 % Δpx, Last light 0.1 %, Ignition 0.2 %, Ember 0.4 %. Hands changed by 1.4 %. I see no smooth sodium clusters, no hotter ember and no denser stencils.
2. **The fixes that did land are real.** The hand-chimney and the flashlight plume are gone, and the membrane fog is crushed. Colonies lost its needles and Out of Africa lost its bar. Chapter 5 has a planet again. The hearth now lights the rocks correctly. Mercury now unravels in Swarm. Snowball and Drift no longer copy GOE's layout.
3. **Chapter 5 is still three star charts.** The planet is back, but node-dot polylines remain the brightest element. Threads regressed: its green ground was lifted, and luma<0.12 fell from 95 % to 67 %.
4. **The story's emitters are still weak.** The ember is at 0.576 in the same off-centre spot for the third pass. The Apollo mote has 4× the bloom, but it peaks at 0.88, below the city beside it, and it is still on the ground. The last light is no longer clipped, but its halo is a flat disc with the core off-centre.
5. **Mean 4.08 → 4.46 (+0.38).** Nine frames went up, one down (Threads) and fourteen held. Nothing reaches 8.

## Measurements, pass B → pass C

| Frame | near-black % | luma<0.12 % | max | chroma | Δpx % |
|---|---|---|---|---|---|
| c00_s0 ember | 99.9→99.9 | 100→100 | .57→.58 | .001→.001 | 0.4 |
| c00_s1 chimneys | 95.3→98.4 | 98.2→99.4 | .87→.87 | .032→.019 | 10.9 |
| c00_s2 membrane | 57.1→**78.1** | 70.1→88.7 | .91→.91 | .184→**.078** | 63.6 |
| c01_s1 mat | 75.5→75.5 | 84.3→84.3 | .61→.61 | .051→.051 | **0.0** |
| c01_s2 GOE | 71.7→75.7 | 72.8→77.1 | .86→.76 | .028→.070 | 28.7 |
| c01_s3 snowball | 91.2→71.7 | 91.5→73.6 | .82→.74 | .004→.012 | 29.0 |
| c02_s0 endo | 45.9→45.9 | 72.7→72.7 | .92→.92 | .081→.081 | **0.0** |
| c02_s1 colonies | 57.9→59.8 | 73.7→76.0 | .85→.82 | .070→.068 | 3.9 |
| c02_s4 cambrian | 19.0→20.6 | 51.2→58.0 | .91→.90 | .101→.118 | 9.0 |
| c03_s1 living land | 37.9→37.9 | 82.8→82.8 | .72→.72 | .087→.087 | **0.0** |
| c03_s3 drift | 75.8→73.9 | 76.5→74.2 | .84→.89 | .026→.029 | 35.4 |
| c03_s4 chicxulub | 72.4→72.4 | 74.1→74.1 | .97→.97 | .044→.044 | **0.0** |
| c04_s1 fire | 55.1→**43.2** | 69.8→60.9 | 1.0→1.0 | .128→.206 | 69.8 |
| c04_s2 out of Africa | 94.4→95.2 | 95.9→96.7 | .96→.96 | .016→.014 | 3.3 |
| c04_s3 hands | 51.1→50.8 | 64.0→64.0 | .45→.45 | .210→.212 | 1.4 |
| c05_s2 empires | 92.5→74.1 | 99.0→**89.4** | .92→.98 | .029→.063 | 34.4 |
| c05_s3 threads | 69.9→55.1 | 95.3→**66.7** | .97→.94 | .031→.041 | 43.9 |
| c05_s4 plague | 98.4→86.5 | 99.3→97.9 | .92→.92 | .015→.040 | 19.5 |
| c06_s1 ignition | 96.6→96.7 | 97.2→97.2 | .89→.89 | .011→.011 | **0.2** |
| c06_s3 mote | 90.8→88.6 | 92.5→91.3 | .94→.92 | .016→.020 | 7.6 |
| c06_s4 mesh | 89.5→91.2 | 91.4→93.1 | .89→.86 | .016→.020 | 9.5 |
| c07_s1 pattern | 66.7→67.7 | 77.0→77.8 | 1.0→1.0 | .028→.030 | 2.8 |
| c07_s3 last light | 76.6→76.6 | 87.6→87.6 | .97→.96 | .027→.027 | **0.1** |
| c07_s4 swarm | 46.9→**24.7** | 61.4→32.9 | .99→1.0 | .051→.064 | 67.4 |

Three extra diagnostics:
- **Cluster mosaic.** The relative high-frequency energy inside each cluster (σ of a 3 px high-pass ÷ mean) is flat or higher. Ignition 0.20→0.21, Mote 0.14→0.15, Mesh 0.17→0.21, Pattern 0.20→0.25.
- **Mote.** Pixels above luma 0.25 went from 907 to 3672. The peak went from 0.92 to 0.88, and the city cluster beside it peaks at 0.92.
- **Mesh.** 591 cyan pixels, which is 0.11 % of the frame.

## Per-frame (pass B → pass C)

**c00_s0 Ember: 6 → 6.** The restraint still works. The frame is unchanged: the peak is 0.576, RGB (251,126,48), at (379,259), off-centre, with no white core. At +3 stops the horns are gone, but a flat-topped cylinder with a lit rim remains. It reads as a candle.

**c00_s1 Chimneys: 4 → 5.**
- *Works:* the hand read is gone. The plume is now black smoke: mean luma over x 330–450, y 60–260 fell from 0.080 to 0.024, so it is lit only near the throat. There is a flange at x 275–345, y 400–425, and the x 710, y 450 glint is now a small vent.
- *Fails:* this is not organ pipes. It is one smooth cylinder (x 345–410, y 275–540) with a glowing flat top, which still reads as a candle. Next to it is a leaning spire (x 410–465, y 290–420) with a rounded head at about (445,300), which reads as a hooded figure in profile. There is no carbonate.
- *Hidden at normal exposure:* at +3.6 stops, hard-edged rectangular fog cards appear (x 140–225, y 315–400; x 690–765, y 370–460; x 260–330, y 140–330), plus a dark wedge above the plume (x 290–550, y 0–110).

**c00_s2 Membrane: 4 → 5.**
- *Works:* the fog is crushed (luma in x 300–560, y 300–540 fell from 0.22 to 0.10). The fingertip chimney is gone.
- *Fails:* the sphere is still at (633,270), radius about 51, off-centre for the match cut. The spark is 2 px with no bloom. The left edge is stair-stepped. A flame tip is cut by the bottom edge at x 500–575, y 525–540.

**c01_s1 Mat: 4 → 4.** Identical to pass B: outline rings and ladder rods (x 140–200, y 0–115; x 385–515, y 8–40; x 305–370, y 405–540).

**c01_s2 GOE: 4 → 4.**
- *Works:* the orange limb (6–10 px) matches the palette.
- *Fails:* "mid-transition" is unreadable. The whole disc (x 215–612) sits under an olive-sepia veil: ocean (63,50,2), land (114,91,48), and only 55 bluish pixels in the frame. There is still no orange-to-blue beat. The glint is still a blob at (510,210).

**c01_s3 Snowball: 4 → 5.**
- *Works:* the close limb is more cinematic. The fine crack network gives the shot a process, and the blue limb is about 6 px.
- *Fails:* the ice is warm grey, (159,161,158) to (183,177,161), not `#eef6ff`. A cream band sits about 20 px inside the limb. There is tan dust at x 570–720, y 200–290 and x 700–800, y 370–450. Red specks show on the night side at (352,265), (405,255), (340,340) and (445,437).

**c02_s0 Endosymbiosis: 4 → 4.** Identical to pass B: an ellipse captive, about 60 bokeh discs, and stair-stepped rings (x 435–600, y 165–345).

**c02_s1 Colonies: 5 → 6.**
- *Works:* the rods are gone, and the frame reads as Volvox with daughters.
- *Fails:* the spheres overlap as flat 2D circles (x 110–590, y 0–300). The mat biomass remains behind them (x 590–960), and there is no gel shell.

**c02_s4 Cambrian: 3 → 3.**
- *Works:* a blue veil now covers the far floor (y 120–200).
- *Fails:* the horizon is still a line: row luma jumps from 0.057 to 0.10 between y 115 and 122. The leaves (x 515–590, y 295–490 and others), the barcode rays (x 120–720, y 0–120) and the clipped glows (x 625–660, y 375–430) are unchanged.

**c03_s1 Living land: 3 → 3.** Identical to pass B. Its content has not changed since pass A.

**c03_s3 Drift: 5 → 5.**
- *Works:* the disc is centred (x 288–688), which breaks the repeated layout, and the limb is clean.
- *Fails:* front light flattens it, with no terminator and no form. The land is still beige (173,152,133) with turquoise seas (85,129,141), so it reads as Arrakis. The coasts are stair-stepped, and there are no rifts and no glint.

**c03_s4 Chicxulub: 5 → 5.** Identical to pass B: a sponge-textured beige curtain and a coreless flash at (309,351).

**c04_s1 First flame: 4 → 5.**
- *Works:* the light now comes from inside the hearth. The rock face toward the fire reads 0.64 at (300,440), and its outboard side reads 0.16 at (230,470). The front rock (x 515–645, y 455–540) is a rimmed silhouette.
- *Fails:* the sacred dark is gone: near-black fell from 55 % to 43 %, and the whole frame glows. The conifers (y 225–260), the blue stripe (y 195–245), the blocky flame column (x 440–560, y 195–440) and the dowel sticks remain.

**c04_s2 Out of Africa: 4 → 5.**
- *Works:* the bar at x 730–770, y 195–265 is now a soft smudge (row-230 peak 0.36→0.21), and the fills are feathered.
- *Fails:* gold glitter still covers all land. There is no flow and no Neanderthal amber. There is also no ice: the north (x 560–780, y 100–170) is RGB (9,10,10).

**c04_s3 Handprints: 3 → 3.** Only 1.4 % of pixels changed: thin red outlines were added around the ghost hand (x 210–310, y 130–350) and a third hand (x 360–470, y 50–150). They read as crayon, not spray. The hero palm (163,73,1) against the adjacent rock (160,75,1) is about 2 % contrast. The leopard blotches, the forearms and the 0.45 max luma are unchanged.

**c05_s2 Empires: 2 → 4.**
- *Works:* the planet exists, with its crest at y≈177 in the upper third.
- *Fails:* Rome is a soft red cloud (x 30–720, y 200–540) with no frontier, and there is no atmosphere line. The node-dot polylines (a quad at x 250–360, y 350–455; a chain at x 500–960, y 375–540) are the brightest element, so it reads as a constellation over a planet.

**c05_s3 Threads: 4 → 3.** The jade ground was lifted (mean luma 0.039→0.074), so the aurora read is stronger. The mauve patch (x 0–250, y 0–280), the node beads, the hook off the limb (x 530–575, y 312–335) and the orphan at (605,495) all remain.

**c05_s4 Plague: 2 → 3.**
- *Works:* faint Mediterranean and Black Sea shapes (x 200–560, y 280–470) ground the routes.
- *Fails:* they are barely visible at normal exposure. The front is a round red smudge (x 560–910, y 140–520), not a line. The node grammar remains, and a gold fragment still dangles at x 185–197, y 450–540.

**c06_s1 Ignition: 4 → 4.** Identical to pass B: mosaic clusters (x 285–385, y 265–340), kinked white wakes (x 70–300, y 255–320; x 220–300, y 330–540), and a limb grazing the top of the frame.

**c06_s3 The mote: 4 → 4.**
- *Works:* the bloom is 4× larger.
- *Fails:* the mote moved to (264,490) and is **still on the surface**, under a 0.92 cluster (x 225–390, y 310–440), with a peak of 0.88. The limb smear (x 515–640, y 140–270), the off-limb routes (x 640–715, y 280–540) and the kink (x≈560, y 195–215) remain.

**c06_s4 Mesh: 3 → 3.** The clusters are only warmer. The radial slab (x 365–450, y 285–470) and the comb (x 430–520, y 245–275) remain, and cyan is 0.11 % of the frame.

**c07_s1 Pattern: 7 → 7.**
- *Works:* the seam hierarchy, the seeds and the sun rim; it is still the best frame.
- *Fails:* the warm pockets (x 495–575, y 450–520; x 645–710, y 385–460) are amber now, but dimmer and still mosaic. Warm light is 8.3 % of the lit pixels. The front is still a symmetric white sticker border.

**c07_s3 Last light: 6 → 6.**
- *Works:* the hard cut is gone. Below the core, luma falls smoothly from 0.89 to 0.05 over 8 px.
- *Fails:* the halo (x 466–493, y 305–335) is a flat plateau at 0.45–0.57, and the 4 px core (x 478–481, y 323–327) sits about 6 px below its centre, so it reads as an off-centre decal. The lattice is unchanged.

**c07_s4 Swarm: 4 → 5.**
- *Works:* the story reads. Mercury is a crescent at (662,345) grinding into a debris stream (x 390–720, y 260–540), and the eye-and-lashes read is gone.
- *Fails:* near-black fell from 47 % to 25 %. A red-brown dash field covers x 0–700, y 300–540 (lower-half luma 0.11→0.19). The Sun moved further off-centre (centre about (243,200), radius about 120) and is flat: only 7–13 % limb darkening. The mirrors are 8–12 px blotches that read as mould, and the swarm is grey 3–5 px squares that read as snow. There is no ring for the galaxy cut.

## Claimed fixes: on screen?

| Fix | Status | Evidence |
|---|---|---|
| Organ-pipe chimneys | Partly | Hand gone; one cylinder plus a hooded spire |
| Hotter ember | **No** | 0.576 at (379,259); throat peak 0.867 unchanged |
| Darker plume | Yes | Plume luma 0.080→0.024 |
| Feathered hominin ranges | Yes | Bar feathered; glitter stays |
| Smooth sodium clusters | **No** | Ignition 0.2 % Δpx; mosaic energy up; hue only |
| Last-light halo not cut | Yes, new flaw | Halo eccentric and flat |
| Chapter 5 planet, Empires horizon high | Yes | Crest y≈177; Plague seas faint |
| Brighter rising mote | Partly | Bloom 4×; peak below city; on surface |
| Denser stencils, calmer wall | **No** | 1.4 % Δpx; outlines only |
| Colonies without needles | Yes | Rods gone |
| Seafloor depth fog | Partly | Veil added; horizon step remains |
| Distinct early layouts | Yes | Close Snowball, centred Drift |
| GOE mid-transition | **No** | All haze; 55 blue px |
| Hearth firelight | Yes | Inner faces lit |
| Swarm mid-dismantling | Yes | Mercury and stream |

## Top 10 remaining fixes, ranked

1. **Prologue (c00_s0–s2).**
   - Ember: centre it at x 480, y 340, with a 3–4 px core at luma ≥ 0.95 inside a 20 px halo.
   - Chimneys: 3–5 parallel pipes of uneven height and width over x 300–560, with ragged flanges and `#d8d2c4` frost on at least three ledges. No rounded heads. At +3 stops it must not read as a candle or a figure. Delete the fog cards and the wedge.
   - Membrane: centre it at (480,270), with its radius matched to the GOE disc. The spark needs a 4 px core and a 40 px bloom. Supersample the sphere's edge.
2. **One city-light renderer (c04_s2, c06_s1, c06_s3, c06_s4, c07_s1).** Point sprites at real cities, with in-cluster high-frequency energy ≤ 0.08 (now 0.21–0.25) and no 6–10 px cells at 3×. Sodium cores (255,174,66), with cluster peak ≤ 0.85 so the hero emitters win. Smooth great-circle wakes. Fix the radial stretch in Mesh (x 365–520, y 245–470), and bring cyan to at least 3 % of the frame.
3. **Retire the constellation grammar (chapter 5).**
   - All three frames: delete the node dots. Each thread becomes a 2–3 px gold core with a 10–15 px glow and 3–5 beads with 20–40 px tails.
   - Threads: luma<0.12 back to at least 90 %, with no green or mauve wash. Delete the hook, the orphan and Plague's fragment.
   - Empires: a flat `#9e2b25` Rome with a 1–2 px frontier, and a 2–3 px atmosphere arc at y≈177.
   - Plague: a front line from (560,150) to (760,540), gold ahead of it and ash behind.
4. **The mote leaves (c06_s3).** Place it in the black above the limb (x 640–700, y 50–110), peaking at 1.0 and at least 1.1× any city, with an arc trail. Dim the cluster below its old position to ≤ 0.6. Remove the limb smear and the off-limb routes.
5. **Last light (c07_s3).** Make the halo concentric with the core, with exponential decay: 0.96 at r 0, 0.5 at r 4, 0.1 at r 15 and 0 at r 25. Add 3–4 satellites within 10 px. Bring in Pattern's seams, and dim the lattice to 30 % beyond 300 px from (480,325).
6. **Swarm (c07_s4).** Near-black ≥ 55 %. Delete the dash field, so the lower half is ≤ 0.05. Centre the Sun at (480,270), with the edge at 60 % of the centre's luma. Mirrors as ≤ 3 px silhouettes, and glints rather than squares, on a thin tilted ellipse that matches the galaxy disk. Keep Mercury.
7. **Chapter 4 ground.**
   - Hands: delete the blotch field and spray `#a8402a` over 20–40 px around each hand, for hand/halo contrast of at least 30 %. End the hands at the wrist, with relief highlights ≥ 0.7.
   - Fire: near-black ≥ 65 %, acacia skyline, and the y 195–245 stripe dissolved into a gradient.
8. **Untouched since pass A (c03_s1, c03_s4).** Living land: a raking key from the left, a horizon at y≈90 and no splats. Chicxulub: a curtain graded from a white lip (≥ 0.9) to soot, a 6 px core at 1.0 at (309,351), and radial ejecta streaks.
9. **Microscope and seafloor (c01_s1, c02_s0, c02_s4).** Mat: delete the rods and use darkfield cells. Endosymbiosis: cut the bokeh and add cristae. Cambrian: a fog ramp with no row-to-row step over 0.005 (now 0.045 across y 115–122), and delete the leaves and rays.
10. **Early orbitals (c01_s2, c01_s3, c03_s3).** GOE: a blue band 4–6 px wide on the right limb (x 560–612), with the haze kept on the left. Snowball: lit ice at least (225,235,245); remove the cream band, the dust and the red specks. Drift: emerald land and navy ocean, with a terminator to give it form.

## Mean score and trend

| Chapter | B | C |
|---|---|---|
| 0 Prologue | 6,4,4 (4.7) | 6,5,5 (5.3) |
| 1 Microbial | 4,4,4 (4.0) | 4,4,5 (4.3) |
| 2 Many-celled | 4,5,3 (4.0) | 4,6,3 (4.3) |
| 3 Animals | 3,5,5 (4.3) | 3,5,5 (4.3) |
| 4 Hominins | 4,4,3 (3.7) | 5,5,3 (4.3) |
| 5 Ancient | 2,4,2 (2.7) | 4,3,3 (3.3) |
| 6 Modern | 4,4,3 (3.7) | 4,4,3 (3.7) |
| 7 Singularity | 7,6,4 (5.7) | 7,6,5 (6.0) |
| **All 24** | **4.08** | **4.46** |

The mean has gone A 3.71 → B 4.08 → C 4.46, a steady +0.38 per pass. The gains are incremental, not transformative. Frames at ≤ 3: 6 → 6. Frames at ≥ 6: 3 → 4. Mat, Endosymbiosis, Living land and Chicxulub have had no content change since pass A.
