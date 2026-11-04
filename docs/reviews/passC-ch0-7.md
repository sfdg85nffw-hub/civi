# Pass C review: chapters 0–7 (24 stills)

Reviewer stance: cinematographer and VFX supervisor. I judged only what is on screen, against `docs/DESIGN.md`, the pass-B report and the list of fixes claimed after it. I did not open any code. The frames are 960×540 software-rasterised renders. Coordinates are pixels, with the origin at top-left. I measured pass B and pass C with the same script: luma is Rec.709 and chroma is mean(max−min RGB). Δpx is the share of pixels that changed by more than 0.05 on any channel. "+N stops" means I lifted exposure to check the shadows.

## Verdict in five lines

1. **Fewer than half of the claimed fixes are on screen.** Seven frames are effectively unchanged: Mat, Endosymbiosis, Living land and Chicxulub at 0.0 % Δpx, Last light 0.1 %, Ignition 0.2 % and Ember 0.4 %. Hands changed by 1.4 %. I can't see the "smooth sodium clusters", the "hotter ember" or the "denser stencils on a calmer wall".
2. **The fixes that did land are real.** The hand-shaped chimneys and the flashlight plume are gone. The membrane fog is crushed. Colonies lost its needles and Out of Africa lost its bar. Chapter 5 has a planet again. The hearth lights the rocks from the correct side. Mercury now unravels in Swarm. Snowball and Drift no longer copy GOE's layout.
3. **Chapter 5 still reads as three star charts.** The planet is back, but polylines with evenly spaced node dots are still the brightest element in all three frames. Threads regressed: its green ground was lifted (luma<0.12 fell from 95 % to 67 %).
4. **The emitters the story depends on are still weak.** The ember peaks at 0.576 in the same off-centre spot for the third pass running. The Apollo mote's bloom is four times larger, but its peak (0.88) is still below the city next to it, and it is still on the ground. The last light's halo is no longer clipped, but it is now a flat disc with the core off-centre.
5. **Mean score 4.08 → 4.46 (+0.38).** Nine frames went up, one went down (Threads) and fourteen held. Nothing reaches 8; Pattern is still the best frame at 7.

## Measurements, pass B → pass C

| Frame | near-black (luma<0.06) % | luma<0.12 % | max luma | chroma | Δpx % | note |
|---|---|---|---|---|---|---|
| c00_s0 ember | 99.9→99.9 | 100→100 | .57→.58 | .001→.001 | 0.4 | unchanged |
| c00_s1 chimneys | 95.3→98.4 | 98.2→99.4 | .87→.87 | .032→.019 | 10.9 | plume 0.080→0.024 |
| c00_s2 membrane | 57.1→**78.1** | 70.1→88.7 | .91→.91 | .184→**.078** | 63.6 | fog crushed |
| c01_s1 mat | 75.5→75.5 | 84.3→84.3 | .61→.61 | .051→.051 | **0.0** | identical |
| c01_s2 GOE | 71.7→75.7 | 72.8→77.1 | .86→.76 | .028→.070 | 28.7 | all haze, 55 blue px |
| c01_s3 snowball | 91.2→71.7 | 91.5→73.6 | .82→.74 | .004→.012 | 29.0 | close limb |
| c02_s0 endo | 45.9→45.9 | 72.7→72.7 | .92→.92 | .081→.081 | **0.0** | identical |
| c02_s1 colonies | 57.9→59.8 | 73.7→76.0 | .85→.82 | .070→.068 | 3.9 | rods gone |
| c02_s4 cambrian | 19.0→20.6 | 51.2→58.0 | .91→.90 | .101→.118 | 9.0 | far-floor veil |
| c03_s1 living land | 37.9→37.9 | 82.8→82.8 | .72→.72 | .087→.087 | **0.0** | identical |
| c03_s3 drift | 75.8→73.9 | 76.5→74.2 | .84→.89 | .026→.029 | 35.4 | centred, front-lit |
| c03_s4 chicxulub | 72.4→72.4 | 74.1→74.1 | .97→.97 | .044→.044 | **0.0** | identical |
| c04_s1 fire | 55.1→**43.2** | 69.8→60.9 | 1.0→1.0 | .128→.206 | 69.8 | hearth-lit, lifted |
| c04_s2 out of Africa | 94.4→95.2 | 95.9→96.7 | .96→.96 | .016→.014 | 3.3 | bar feathered |
| c04_s3 hands | 51.1→50.8 | 64.0→64.0 | .45→.45 | .210→.212 | 1.4 | red outlines only |
| c05_s2 empires | 92.5→74.1 | 99.0→**89.4** | .92→.98 | .029→.063 | 34.4 | planet back |
| c05_s3 threads | 69.9→55.1 | 95.3→**66.7** | .97→.94 | .031→.041 | 43.9 | green lifted |
| c05_s4 plague | 98.4→86.5 | 99.3→97.9 | .92→.92 | .015→.040 | 19.5 | faint seas |
| c06_s1 ignition | 96.6→96.7 | 97.2→97.2 | .89→.89 | .011→.011 | **0.2** | identical |
| c06_s3 mote | 90.8→88.6 | 92.5→91.3 | .94→.92 | .016→.020 | 7.6 | mote moved, bigger bloom |
| c06_s4 mesh | 89.5→91.2 | 91.4→93.1 | .89→.86 | .016→.020 | 9.5 | warmer, same mosaic |
| c07_s1 pattern | 66.7→67.7 | 77.0→77.8 | 1.0→1.0 | .028→.030 | 2.8 | warm pockets amber |
| c07_s3 last light | 76.6→76.6 | 87.6→87.6 | .97→.96 | .027→.027 | **0.1** | halo unclipped |
| c07_s4 swarm | 46.9→**24.7** | 61.4→32.9 | .99→1.0 | .051→.064 | 67.4 | Mercury, milky |

Three diagnostics:

- **City-cluster mosaic.** I measured the relative high-frequency energy inside each cluster (σ of a 3 px high-pass divided by the mean). It went up or held: Ignition 0.20→0.21, Mote 0.14→0.15, Mesh 0.17→0.21, Pattern 0.20→0.25. Only the hue moved: the Pattern pocket went from RGB (118,108,88) to (110,89,48).
- **Mote.** Pixels above luma 0.25 went from 907 to 3672, so the bloom is about four times larger. The peak went from 0.92 to 0.88, which is still below the cluster maximum of 0.92.
- **Mesh.** Cyan pixels went from 574 to 591, or 0.11 % of the frame.

## Per-frame

### Chapter 0
**c00_s0 Ember: 6 → 6.** *Works:* restraint and true black. *Fails:* the frame is unchanged. The peak is 0.576, RGB (251,126,48), still at x 379, y 259 (left of centre, mid-height), with no white core. At +3 stops the horns are gone, but a flat-topped cylinder with a lit rim remains: a candle.

**c00_s1 Chimneys: 4 → 5.** *Works:* the hand read is gone. The plume is black smoke lit only near the throat (mean luma 0.080→0.024 over x 330–450, y 60–260). There is a flange ledge at x 275–345, y 400–425, and the glint at x 710, y 450 is now a small vent. *Fails:* these are not organ pipes. There is one smooth cylinder (x 345–410, y 275–540) whose flat top glows (393,278), so it still reads as a candle. Beside it is a leaning spire (x 410–465, y 290–420) with a rounded head at about (445,300), which reads as a hooded figure in profile. A lava ribbon runs down x 408–445, y 415–540. There is no carbonate frost. The throat is not hotter: the peak is still 0.867, and pixels above 0.5 fell from 290 to 178. At +3.6 stops, hard-edged rectangular fog cards appear (x 140–225, y 315–400; x 690–765, y 370–460; x 260–330, y 140–330), plus a dark wedge above the plume (x 290–550, y 0–110).

**c00_s2 Membrane: 4 → 5.** *Works:* the fog is crushed (luma in x 300–560, y 300–540 fell from 0.22 to 0.10). The fingertip chimney is gone. The thin film is still lovely. *Fails:* the sphere is still at (633,270) with a radius of about 51 px (x 582–685), off-centre for the match cut. The spark is 2 px with no bloom. The left edge is still stair-stepped. A flame tip is cropped by the bottom edge at x 500–575, y 525–540.

### Chapter 1
**c01_s1 Mat: 4 → 4.** The frame is identical to pass B, for the second pass in a row: outline rings and ladder rods (x 140–200, y 0–115; x 385–515, y 8–40; x 305–370, y 405–540).

**c01_s2 GOE: 4 → 4.** *Works:* the orange limb (6–10 px) and the haze tint are in the brief's palette. *Fails:* the claimed "mid-transition" can't be read. The whole disc (x 215–612) is under an olive-sepia veil: ocean (63,50,2), land (114,91,48), and only 55 bluish pixels in the entire frame. The beat (orange clearing to blue) is still not on screen. Pass B at least showed the after-state. The glint is still a soft blob at (510,210).

**c01_s3 Snowball: 4 → 5.** *Works:* the close limb is more cinematic. The fine crack network gives the thaw a visible process. The blue limb is about 6 px. *Fails:* the ice is warm grey to cream, (159,161,158) to (183,177,161), not `#eef6ff`. A warm cream band sits about 20 px inside the blue limb. Tan dust blotches sit at x 570–720, y 200–290 and x 700–800, y 370–450. Red specks are visible on the night side at normal exposure: (352,265), (405,255), (340,340) and (445,437).

### Chapter 2
**c02_s0 Endosymbiosis: 4 → 4.** Identical to pass B: concentric-ellipse captive, about 60 bokeh discs, stair-stepped rings (x 435–600, y 165–345).

**c02_s1 Colonies: 5 → 6.** *Works:* all the rods are gone, and the frame now reads cleanly as Volvox with daughter colonies. *Fails:* the spheres at top-left (x 110–590, y 0–300) still overlap like flat 2D circles. The mat biomass remains in the background (x 590–960; amber at x 0–200, y 180–320). There is no gel shell.

**c02_s4 Cambrian: 3 → 3.** *Works:* a blue veil now swallows the far floor (y 120–200). *Fails:* the horizon is still a line. Row luma jumps from 0.057 to 0.10 between y 115 and y 122. The leaf sprites are unchanged (x 515–590, y 295–490 and others), and so are the barcode rays (x 120–720, y 0–120) and the polygon-clipped glows (x 625–660, y 375–430).

### Chapter 3
**c03_s1 Living land: 3 → 3.** Identical to pass B. This frame has been unchanged since pass A: no key light, dash agents, disc splats.

**c03_s3 Drift: 5 → 5.** *Works:* centred (disc x 288–688, centre (488,270)), which breaks the GOE/Snowball repeat, and the blue limb is clean. *Fails:* front lighting flattens it, with no terminator and no form. The land is still beige (173,152,133) with turquoise seas (85,129,141), so it reads as Arrakis. The coasts are stair-stepped at 2×. There are no rifts and no glint.

**c03_s4 Chicxulub: 5 → 5.** Identical to pass B: a sponge-textured beige curtain, and a soft flash at (309,351) with no core.

### Chapter 4
**c04_s1 First flame: 4 → 5.** *Works:* the light now comes from inside the hearth. The left rock is lit on its fire-facing side (luma 0.64 at (300,440)) and dark outboard (0.16 at (230,470)). The centre-front rock (x 515–645, y 455–540) is a silhouette with a rim. *Fails:* the sacred dark is gone: near-black fell from 55 % to 43 % and the whole frame glows orange. The conifers (y 225–260) and the blue stripe (y 195–245) remain. The flame column (x 440–560, y 195–440) is still blocky, and the sticks are smooth dowels.

**c04_s2 Out of Africa: 4 → 5.** *Works:* the bar at x 730–770, y 195–265 is feathered into a soft smudge (row-230 peak 0.36→0.21, no hard sides), and the region fills are soft. *Fails:* uniform gold glitter still covers all land, so occupied and empty land look the same. There are no streams or fronts and no Neanderthal amber. There is still no ice: the north at x 560–780, y 100–170 averages RGB (9,10,10).

**c04_s3 Handprints: 3 → 3.** *Fails:* only 1.4 % of pixels changed. Thin red outlines were added around the ghost hand (x 210–310, y 130–350) and a third hand (x 360–470, y 50–150); they read as crayon outlines, not spray. The hero hand's palm is (163,73,1) against adjacent rock at (160,75,1), about 2 % contrast. The black leopard blotches cover the same wall as before. The hands still run into forearms, and max luma is still 0.45.

### Chapter 5
**c05_s2 Empires: 2 → 4.** *Works:* the planet exists, and the horizon crest sits at y≈177, in the upper third. At +3 stops faint seas show. *Fails:* Rome is a soft red smoke cloud (x 30–720, y 200–540) with no frontier. The limb has no atmosphere line. The polylines with node dots (a closed quad at x 250–360, y 350–455; a chain at x 500–960, y 375–540) are the brightest element, so it now reads as a constellation over a planet.

**c05_s3 Threads: 4 → 3.** *Fails:* the jade ground was lifted, not crushed (mean luma 0.039→0.074), so the aurora read is stronger. The mauve patch is unchanged (x 0–250, y 0–280), as are the node beads, the hook off the limb (x 530–575, y 312–335) and the orphan point at (605,495).

**c05_s4 Plague: 2 → 3.** *Works:* faint Mediterranean and Black Sea shapes (x 200–560, y 280–470) put the routes on Earth. *Fails:* the geography is close to invisible at normal exposure (luma<0.12 is still 97.9 %). The "front" is a round red smudge (x 560–910, y 140–520), not a line. The constellation grammar remains. The gold fragment still dangles off the bottom edge at x 185–197, y 450–540.

### Chapter 6
**c06_s1 Ignition: 4 → 4.** Identical to pass B: khaki mosaic clusters (Europe x 285–385, y 265–340), kinked 1 px white wakes (x 70–300, y 255–320; a fan at x 220–300, y 330–540), and the top limb grazing the frame.

**c06_s3 The mote: 4 → 4.** *Works:* the mote's bloom is about four times larger, with a short exhaust. *Fails:* the mote moved to (264,490), which is **still on the night-side surface** under the cluster at x 225–390, y 310–440. Its peak of 0.88 is below that cluster (0.92). The city light smeared along the right limb (x 515–640, y 140–270) remains. So do the routes wandering off the limb (x 640–715, y 280–540) and the kink at x≈560, y 195–215.

**c06_s4 Mesh: 3 → 3.** *Fails:* the clusters are only warmer. The radial slab (x 365–450, y 285–470) and the comb (x 430–520, y 245–275) remain. Cyan covers 591 px, 0.11 % of the frame.

### Chapter 7
**c07_s1 Pattern: 7 → 7.** *Works:* still the best frame: the seam hierarchy, the seeds and the sun-side rim. *Fails:* the warm pockets (x 495–575, y 450–520; x 645–710, y 385–460) are now amber, but dimmer, and still mosaic. Warm light is 8.3 % of the lit pixels (11.3 k against 124.7 k cold). The front is still a symmetric white sticker border.

**c07_s3 Last light: 6 → 6.** *Works:* the hard cut is fixed. Below the core, luma now falls smoothly from 0.89 to 0.05 over 8 px. *Fails:* the halo (x 466–493, y 305–335) is a flat plateau at 0.45–0.57, and the 4 px core (x 478–481, y 323–327) sits about 6 px below its centre, which reads as an off-centre decal. The lattice is unchanged: no seams, no radial dimming, no cold limb.

**c07_s4 Swarm: 4 → 5.** *Works:* the story is legible now. Mercury is a small crescent at (662,345) grinding into a debris stream (x 390–720, y 260–540), and the eye-and-lashes read is gone. *Fails:* blacks collapsed (near-black 47 % → 25 %). A red-brown dash field covers x 0–700, y 300–540 (lower-half mean luma 0.11→0.19). The Sun moved further off-centre (disc centre about (243,200), radius about 120) and is flat, with 7–13 % limb darkening. The transiting mirrors are 8–12 px blotches that read as mould or sunspots, with bites out of the limb. The swarm is grey 3–5 px squares that read as snow. There is no ring to hand off to the galaxy.

## Claimed fixes: on screen or not

| Claimed fix | On screen? | Evidence |
|---|---|---|
| Organ-pipe chimneys | **Partly** | The hand is gone, but there is one cylinder plus a hooded-figure spire, not organ pipes |
| Hotter ember | **No** | Ember 0.568→0.576 at the same (379,259); throat peak 0.867, fewer bright pixels |
| Darker plume | **Yes** | Plume luma 0.080→0.024 |
| Feathered hominin ranges, no blocks | **Yes** | Bar feathered; glitter remains |
| Smooth sodium city clusters, no mosaic | **No** | Ignition 0.2 % Δpx; mosaic energy flat or up everywhere; only the hue warmed (Mesh, Pattern) |
| Sprites lifted, no cut halo | **Yes, with a new flaw** | No clip; halo now eccentric and flat |
| Chapter 5 planet restored, Empires horizon in the upper third | **Yes** | Empires luma<0.12 99.0→89.4 %, crest at y≈177; Plague seas faint |
| Brighter rising Apollo mote | **Partly** | Bloom ×4; peak 0.88 < city 0.92; not rising, still on the surface |
| Denser stencils, calmer wall | **No** | 1.4 % Δpx; thin red outlines only; blotch wall unchanged |
| Colonies without needles | **Yes** | Rods gone |
| Seafloor depth fog | **Partly** | Far-floor veil; horizon step at y 115–122 remains |
| Distinct early-planet layouts | **Yes** | Snowball close limb, Drift centred |
| GOE mid-transition | **No (not readable)** | Disc entirely hazed, 55 blue px |
| Firelight from inside the hearth | **Yes** | Fire-facing rock sides lit, front rock silhouetted |
| Swarm mid-dismantling | **Yes** | Mercury and stream visible |

## Top 10 remaining fixes, ranked by impact on the 2001 bar

1. **The prologue, which is still the film's weakest promise (c00_s0–s2).** Ember: move it to x 480, y 340. Give it a white core of luma ≥ 0.95, 3–4 px across, inside a 20 px halo. It is now 0.576 at (379,259) after three passes. Chimneys: build 3–5 parallel pipes of uneven height and width across x 300–560, with ragged flanges and carbonate `#d8d2c4` on at least three ledges. No rounded heads. The test is that a +3-stop lift reads as neither a candle nor a figure. Delete the hard fog cards and the dark wedge listed in the chimney notes. Membrane: centre it at (480,270), match its radius to the opening GOE disc, give the spark a 4 px core with a 40 px bloom, and supersample the sphere's edge.
2. **One city-light renderer for c04_s2, c06_s1, c06_s3, c06_s4 and c07_s1.** Replace the cell texture with point sprites at real city positions, so that relative high-frequency energy inside a cluster is ≤ 0.08 (now 0.21–0.25) and no 6–10 px cells show at 3×. Cores should be sodium (255,174,66) and the cluster peak ≤ 0.85, so that hero emitters can win. Draw wakes as smooth great circles with no kinks. Fix the radial stretch in Mesh (x 365–520, y 245–470) and raise its cyan to at least 3 % of the frame (now 0.11 %).
3. **Retire the constellation grammar in chapter 5.** Delete the evenly spaced node dots in all three frames. Threads become a 2–3 px gold core with a 10–15 px glow, carrying 3–5 beads with 20–40 px tails. Threads: bring luma<0.12 back to at least 90 % (now 66.7 %) and remove the green and mauve washes. Delete the hook (x 530–575, y 312–335), the orphan at (605,495) and Plague's fragment (x 185–197, y 450–540). Empires: a flat `#9e2b25` Rome with a 1–2 px frontier, plus a 2–3 px atmosphere arc along the crest at y≈177. Plague: a front line running from (560,150) to (760,540), bloomed gold ahead of it and ash behind.
4. **The mote has to leave (c06_s3).** Move it into the black above the limb, at x 640–700, y 50–110. Peak 1.0, at least 1.1× any city pixel, with a faint arc trail rising from the surface. Dim the cluster under its old position to ≤ 0.6. Remove the limb smear (x 515–640, y 140–270) and the off-limb routes (x 640–715, y 280–540).
5. **Finish the last light (c07_s3).** Make the halo concentric with the core (the core is now 6 px low). Replace the 0.45–0.57 plateau with exponential decay: 0.96 at r 0, 0.5 at r 4, 0.1 at r 15, 0 at r 25. Add 3–4 dim satellites within 10 px. Bring in Pattern's seams, and dim the lattice to 30 % beyond 300 px from (480,325).
6. **Swarm grade and rhyme (c07_s4).** Near-black ≥ 55 % (now 24.7 %). Delete the red-brown dash field, taking lower-half mean luma from 0.19 to ≤ 0.05. Centre the Sun at (480,270), with its edge at about 60 % of centre luma (now 87–93 %). Transiting mirrors should be ≤ 3 px sharp silhouettes. Swarm elements should be glints, not grey squares, on a thin tilted ellipse that matches the galaxy disk. Keep Mercury.
7. **Chapter 4 ground (c04_s3, c04_s1).** Hands: delete the black blotch field. Spray ochre `#a8402a` over 20–40 px around each hand, so hand-to-halo luma contrast is at least 30 % (now about 2 %). Hands end at the wrist, and relief highlights reach ≥ 0.7. Fire: restore near-black to at least 65 % (now 43 %), replace the conifers with acacias, and dissolve the blue stripe at y 195–245 into a gradient.
8. **Untouched since pass A (c03_s1, c03_s4).** Living land: one raking key from the left, a horizon at y≈90, no disc splats. Chicxulub: a curtain that runs from a white-hot lip (≥ 0.9) to soot with no sponge texture, a 6 px core at 1.0 at (309,351), and radial ejecta streaks.
9. **The microscope and the seafloor (c01_s1, c02_s0, c02_s4).** Mat: delete the ladder rods and use darkfield cells. Endosymbiosis: delete about 60 bokeh discs and add cristae. Cambrian: a fog ramp with no row-to-row step greater than 0.005 (now 0.045 over 7 rows at y 115–122). Delete the leaves and the barcode rays.
10. **Colour beats on the early orbitals (c01_s2, c01_s3, c03_s3).** GOE: a Rayleigh-blue band 4–6 px wide on the right limb (x 560–612) and clearing water in the right third, with the haze kept on the left. Snowball: lit ice with mean RGB of at least (225,235,245); remove the warm inner band, the tan dust and the four red specks. Drift: emerald land and navy ocean, a terminator about 25 % in from the left edge to give form, and a tight glint.

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

Trend across passes: A 3.71 → B 4.08 → C 4.46. Gains are steady at about +0.38 per pass, but they are additive, not transformative. At this rate, the 8/10 bar is about ten passes away. Frames at 3 or below: 6 → 6. Frames at 6 or above: 3 → 4. Four frames (Mat, Living land, Chicxulub, Endosymbiosis) have had no content change across two passes. Once the first five items above are fixed, they need to be the next pass's targets.
