# Pass C review: chapters 8–10 (15 stills)

This is the third pass on Expansion, the Contest and the Coda. I judged only the screen, against `docs/DESIGN.md`, the pass-A and pass-B reports, and the post-B fix list in `README.md`. I didn't open any code. The frames are 640×360 software-rasterised renders at low quality, so I've allowed for grain. **Coordinates are pixels on the 640×360 frame, origin top-left.** As briefed, I judged the Return on composition and ring, not on halo intensity.

## 1. Verdict

1. **The Contest finally has more than one colour.** All 7 beats carry their correct, dated line (pass B had 1 of 7). The Choir's pink and the Lattice's gold appear for the first time. But the events are either near-white (saturation 0.04–0.20 in s5, s7, s8) or tell the wrong story (s4: the dying Choir owns the frame).
2. **The victor's colour now reaches the end of the film.** The holes (saturation 0.24–0.47), the point, the montage rim and the island in Candles are all green.
3. **The scale rhyme now lines up.** The point (320,180), the iris (r 154), the Return cell (321,179) and the timeline ring (r 149) share one centre. But that same bullseye now appears in 8 of 15 frames, including every Contest event.
4. **The halos got worse in two frames.** In s2 the halo is 0.29 luma at 40 px and the core plate is 103×95 px. In s8 the galaxy is a grey smear. Fronts are now 1 px hatching, which reads as rain.
5. **Mean 4.07 → 5.00 (+0.93), the largest gain so far.** Only Holes reaches 7. What's left is how strongly and where each event is drawn, not grading.

## 2. Measurements, pass B → pass C

Luma is Rec.709 on the sRGB frame. Near-black means luma < 0.06. Chroma is mean(max − min RGB) on the 0–255 scale. Coloured px means value > 0.15 and saturation > 0.15; the hue column gives each hue's share of those pixels (green 100–165°, lime 65–100°, gold 40–65°, orange 15–40°, cyan 165–205°, pink 290–345°). Δpx is the share of pixels whose largest channel difference from pass B is above 0.05.

| Frame | near-black | max luma | chroma | coloured px | hue split C (B) | Δpx |
|---|---|---|---|---|---|---|
| c08_s0 disk | 86.9 → 82.9 % | 1.00 → 1.00 | 1.3 → 1.9 | 3.1 → 5.3 % | orange 70 · blue 16 · red 9 (orange 67 · blue 11) | 16.9 % |
| c08_s1 bloom | 81.2 → 82.7 % | 1.00 → 1.00 | 2.9 → 2.9 | 8.2 → 6.4 % | cyan 46 · orange 33 · blue 13 (cyan 77) | 21.5 % |
| c08_s2 neighbours | 96.1 → **77.4 %** | 0.95 → 0.93 | 0.6 → 6.9 | 1.9 → 14.7 % | cyan 95 (cyan 95) | 26.7 % |
| c09_s1 woke | 55.2 → 67.6 % | 1.00 → 1.00 | 5.7 → 6.7 | 14.4 → 12.9 % | **pink 50** · orange 32 (cyan 89) | 50.1 % |
| c09_s2 intrude | 88.0 → **74.1 %** | 1.00 → 0.99 | 1.6 → 11.8 | 2.4 → 15.1 % | **green 99** (pink 56 · cyan 27) | 34.3 % |
| c09_s4 Choir out | 67.9 → 71.8 % | 1.00 → 1.00 | 4.6 → 6.2 | 12.9 → 16.3 % | **pink 41** · orange 18 · red 18 · gold 10 (green 68) | 35.9 % |
| c09_s5 new light | 75.1 → 80.0 % | 1.00 → 1.00 | 4.5 → 3.4 | 12.8 → 7.8 % | lime 36 · green 32 · **gold 20** (green 98) | 26.5 % |
| c09_s6 Andromeda | 96.3 → 90.7 % | 1.00 → 1.00 | 0.6 → 2.1 | 1.7 → 5.2 % | green 79 · lime 13 (green 91) | 10.5 % |
| c09_s7 Lattice ends | 40.4 → **55.7 %** | 1.00 → 1.00 | 8.8 → 9.2 | 25.3 → 21.2 % | green 61 · lime 27 · gold 6 (green 92) | 57.9 % |
| c09_s8 second mind | 94.5 → 86.0 % | 0.99 → 1.00 | 0.9 → 1.5 | 2.1 → 1.4 % | green 92 (green 95) | 15.2 % |
| c10_s1 candles | 99.8 → 99.7 % | 0.79 → 0.89 | 0.0 → 0.1 | 0.0 → 0.1 % | **green 57** · orange 24 · red 16 (orange 56 · red 38) | 0.1 % |
| c10_s2 holes | 94.0 → 96.2 % | 0.97 → 0.94 | **0.1 → 2.1** | 0.0 → 2.5 % | **green 100** (none) | 6.3 % |
| c10_s3 point | 99.8 → 99.8 % | 0.71 → **0.63** | 0.0 → 0.0 | 0.0 → 0.0 % | **green 100** (none) | 0.1 % |
| c10_s4 montage | 98.9 → 89.9 % | 0.83 → 0.76 | 0.2 → 6.4 | 0.4 → 7.8 % | green 95 (orange 74 · red 24) | 10.9 % |
| c10_s6 return | 23.4 → 32.1 % | 1.00 → 0.98 | 59.5 → 34.6 | 67.5 → 50.7 % | orange 38 · green 30 · lime 20 · gold 11 (orange 73) | 79.4 % |

I also counted pixels within ±18° of each faction's hue (saturation > 0.25), with the 95th-percentile value in brackets:
- **s1:** Choir 9,982 px (0.92) against Heir 6,825 (0.22).
- **s2:** Hexarchy 60,052 (0.53) and nothing else.
- **s4:** Choir 21,735 (0.45) against Hexarchy 2,307 (0.21).
- **s5:** Hexarchy 6,790 and Lattice 2,821 (0.33).
- **Holes:** Hexarchy 8,138 (0.68).

Core plates (the largest blob above 0.9 luma):

| Frame | B | C | |
|---|---|---|---|
| s7 | 58×49 | 29×28 | better |
| s4 | 20×33 | 14×11 | better |
| **s2** | **43×41** | **103×95** | worse |
| **s8** | **24×11** | **67×24** | worse |

## 3. Per frame (score B → C)

**c08_s0, Ring to disk: 6 → 6.**
- **Works:** the exponential disk is real. Star density at 0.5–0.8 R doubled (pixels above 0.15 luma: 15.7 % → 28.5 %), so the galaxy now has a populated outer disk (x 170–495, y 70–310).
- **Fails:**
  - The arms are still grey (saturation 0.04–0.08 at every radius).
  - The core is still a white plate (30×19 at 324,177).
  - The cyan seed is still on the rim (about 207,240, at 0.9 R).
  - The magenta bokeh remains (272,90; 462,185).
  - The satellites at 420,197 and 315,290 read as extra bulges.

**c08_s1, Bloom: 5 → 5.**
- **Works:**
  - The cumulus is mostly gone: only 452 cyan px remain beyond the rim at x < 225.
  - The hex lattice is finally visible: 10–14 px cells in x 250–320, y 250–345.
- **Fails:**
  - The front is still a straight wall. Its right edge sits at x 306–325 for every row from y 150 to 290.
  - The origin is still the left rim.
  - The territory is a band, not a region behind a convex shell.
  - The front's brightest pixels are (0.49, 0.59, 0.62) at saturation 0.22, still dimmer than the 23×18 core plate.

**c08_s2, Neighbours: 3 → 5.**
- **Works:** a strong new telephoto. Our disk lies edge-on across y 206–310 with a warm bulge above and below, and Andromeda is a 28 px inclined spiral at 320,95, in the upper third. The clipped Cloud is gone.
- **Fails:**
  - Nothing reaches. Andromeda is already fully cyan, there's no lag and there are no probes.
  - The midplane is the *brightest* band (luma 0.70–0.72 at y 254–278). Instead of a dust lane, a flat cyan rectangle runs along it (x 200–385, y 257–273) and reads as a light bar.
  - The disk is cut by both frame edges.

**c09_s1, "Something woke in Andromeda.": 3 → 5.**
- **Works:**
  - A second colour at last: Choir pink is the most saturated thing in the frame (value 0.92).
  - The line is correct.
  - A faint 18 px pink ring at 320,180 marks the awakening.
- **Fails:**
  - The waking is a 160×140 px cotton-wool cloud (x 220–377, y 90–233), not a point.
  - Its edge is hatched with 4 px fringe patches (x 220–260, y 120–170), which read as engraving.
  - The camera is still on the core (plate at 346,206).
  - The galaxy is face-on and frame-filling. It isn't Andromeda.

**c09_s2, "Something came out of the intergalactic dark…": 4 → 4.**
- **Works:** the line is correct, the diagonal disk is still the strongest graphic shape in the chapter, and the Hexarchy is identifiable.
- **Fails:**
  - The halo is worse. Luma at 40 / 60 / 80 / 100 px from the disk axis is 0.29 / 0.20 / 0.135 / 0.075 (B: 0.19 / 0.11 / 0.05 / 0.02), and black fell from 88 % to 74 %.
  - The plate is 103×95.
  - Nothing enters from the dark. The green arrives as hair-like streaks along the disk (x 370–465, y 35–150).
  - The caption wraps, leaving "Andromeda." orphaned.

**c09_s4, "The last of the Choir went out in the heart of Andromeda.": 4 → 5.**
- **Works:** two factions are readable at normal viewing for the first time, as pink rings of 8–20 px on green. The line is correct and the plate is down to 14×11.
- **Fails:** the story is inverted.
  - The ×2.6 lift goes to the dying faction, so the Choir has 9× the Hexarchy's pixels.
  - Its rings cover the whole disk (x 100–420, y 0–330), which is exactly what pass B asked to remove.
  - The heart (x 290–335, y 130–210) shows only dark grey-green ellipses: no pink collapse and no scar.
  - What the frame says is "the Choir is everywhere".

**c09_s5, "…a light that had not been there before.": 4 → 5.**
- **Works:** an event exists, a gold disc about 35 px across near 318,165, in the Lattice hue (47°). The green haze has receded (80 % black).
- **Fails:**
  - The disc is pale (saturation 0.18–0.20 at value 0.96), so it reads as cream.
  - It sits on the bulge, 30 px above the core (318,197), where it reads as a double nucleus or a flare.
  - It's the third centred face-on spiral.
  - The caption wraps onto two lines.

**c09_s6, "Andromeda arrived.": 4 → 5.**
- **Works:** the pair is pushed in to span x 165–510 (54 %), and "+4.5 Gyr. Andromeda arrived." is on screen.
- **Fails:**
  - No readable tails or bridge: the envelope is a mottled green ellipse.
  - Andromeda isn't older or redder. Both disks sit at the same hue (90–119°, saturation 0.13–0.20).
  - A white smear (x 325–375, y 212–230) and a pale glow at 340,172 read as a third galaxy and a third nucleus.

**c09_s7, "The Lattice ended in the Sagittarius Arm.": 3 → 4.**
- **Works:** the right line, black up from 40 % to 56 %, and the plate halved.
- **Fails:**
  - The Lattice is an 8 px cream dot at 320,175 (saturation 0.13): no cubic cells and no strike.
  - The fronts are now 1 px diagonal hatch lines (period about 5 px) across x 330–560, y 90–300, and they read as rain.
  - Stars collide with the caption.

**c09_s8, "A second mind opened its eyes in Triangulum.": 3 → 4.**
- **Works:** an eye exists, a 28 px ring at 320,180, and the line is present.
- **Fails:**
  - The eye is grey (saturation 0.04, luma 0.66). If this is the Archive (`#cfe8d8`, swatch saturation 0.11), the swatch can never read as a new mind.
  - The galaxy is a grey smear: a 67×24 plate, with glow still at 0.06 luma 100 px out.
  - The fringe patch at x 460–527, y 187–240 reads as tyre tread.
  - It's still edge-on, not Triangulum.

**c10_s1, The horizon closes: 3 → 4.**
- **Works:** the island exists, a green glow peaking at 0.89 at 285,188. It's the only green in the universe, which is the right idea.
- **Fails:**
  - The glow is gone by r ≈ 10, so it's about 18 px across (target 80–120).
  - The candles haven't changed (Δpx 0.1 %).
  - The mantissa is still there.

**c10_s2, The last black holes: 6 → 7.**
- **Works:** the fix landed. The rings are victor green (hue 126–131°, saturation 0.24–0.47, peaks 0.61–0.92). This is the best frame in the three chapters, and it now carries the argument.
- **Fails:**
  - The Hawking flashes are still neutral soft discs, 25–30 px across (saturation 0.07–0.09, at 333,157; 230,113; 117,280).
  - Doppler asymmetry shows only on the far-right hole (0.33 vs 0.23).
  - There's nothing behind the holes to lens.

**c10_s3, One point remains: 4 → 5.**
- **Works:** green (saturation 0.43 at the core, with a saturated halo out to r 8), on the shared centre at 320,180.
- **Fails:**
  - Peak luma fell to 0.63 (B 0.71), so it's dimmer than Holes (0.94) and Candles (0.89). It should be the brightest pixel of the Coda.
  - There's no white-hot core.
  - The halo is about 16 px across (target 20–24).

**c10_s4, Inside it: 3 → 5.**
- **Works:** the iris exists. It's concentric with the point and the Return ring (r 154 vs 149), and nothing shows outside it.
- **Fails:**
  - The rim is a 12–16 px neon tube (saturation 0.56–0.97, luma 0.45) and reads as a sci-fi portal.
  - The galaxy (x 180–313, y 240–299) is cut by the rim at x≈195.
  - There's no memory treatment.
  - The rim doesn't share the Return ring's 1–2 px line.

**c10_s6, Return: 6 → 6.**
- **Works:** the cell is centred (321,179, about 145 px across), the ring is concentric to within 1 px at r 149 (2.05× the cell), and the chimney "candle" has left the frame.
- **Fails:**
  - The spark is the same three points as in pass B, shifted with the camera: 322,179 (luma 0.98, saturation 0.07, effectively white), 306,180 and 288,217.
  - The 8 hex bokeh are unchanged (the largest is 35 px at 488,155).
  - The ring leaves only 30 px above and below, so it reads as a HUD reticle.
  - I can't confirm the Prologue match. The Prologue still on file (old framing) has a 69 px cell at 421,181. Re-capture the new centred Prologue to verify "exactly".

## 4. Claimed fixes: visible or not

| Claim | On screen |
|---|---|
| Holes and point in the victor's colour | **Visible** |
| Protagonist lifted ×2.6, others ×0.3 | **Visible** in s1, s2, s4 and s5. **Backfires** in s4. |
| Event drawn in the protagonist's colour | **Partly.** Rings in s1 (faint pink) and s8 (grey); a cream disc in s5; a cream dot in s7. Nothing in s2; no collapse in s4. |
| Dated line on every beat, over a scrim | **Visible: 7/7 correct.** s7 text still on star salt. |
| Event about ⅓ into the beat | Consistent: markers in 5/7 stills |
| Fringes along the border at about 1.4 % of height, off cores | Period ✓ (4–5 px), cores clear ✓. **But** the bands are 1 px lines, so they read as hatching. |
| Exponential disk; Sun at half radius | Disk **visible**; seed **not moved** |
| Cores less dominant | s4 and s7 better; **s2 and s8 worse** |
| Beats composed around the event | **Visible as dead-centre bullseyes** (s1, s5, s7, s8) |
| Collision closer, with tails and a bridge | Closer ✓; tails and bridge **not visible** |
| Andromeda older and redder | **Not visible** |
| Neighbours telephoto, Andromeda in the upper third | **Visible** |
| Return: spark keeps its hue; ring widens | Ring ✓; spark **still white** |
| Candles: victor glow from afar | **Visible, too small** (18 px) |
| Montage inside an iris with a victor rim | **Visible**; rim too heavy |

## 5. Top 10 remaining fixes, by impact

1. **Invert the extinction logic (s4, s7).**
   - On extinction beats, lift the *killer*. Draw the victim only as one last pocket, 20–40 px across and at least 50 px from the core.
   - s4: `#ff5fb4` at saturation 0.6 or more, rings collapsing inward, then a black scar.
   - s7: 4–8 gold `#f2d27a` cubic cells (6–8 px) on the arm, with 3–5 streaks (2.6 px or wider, 80 px or longer) converging on them.
   - Target: the victim's hue at 3–10 % of coloured px. Today it's 41 % in s4.
2. **Saturate every event.**
   - The event core should be the most saturated object in the frame: saturation ≥ 0.6 at value ≥ 0.8. Today: s5 0.20, s7 0.13, s8 0.04.
   - Cap event sprites at 0.85 luma so hue survives the tone map.
   - Give pale swatches (Archive, saturation 0.11) a display variant at saturation ≥ 0.45, drawn in their own pattern.
3. **Get off the bullseye.**
   - Put events on a third (about 430,120 or 210,240), at least 80 px from any bulge, with the bulge partly out of frame.
   - Shoot Andromeda (s1) as a 3:1 ellipse.
   - Make Triangulum (s8) small and near face-on, at 35–45 % of frame width.
4. **Clamp halos and plates (s2, s8).**
   - Glow under 0.03 luma at 40 px from the disk.
   - Largest region above 0.9 luma at 12×12 px or less.
   - Black at least 85 % in s2 and 90 % in s8.
5. **Fringes as bands, not lines.**
   - 2–3 px soft sinusoids alternating *both* faction colours.
   - Only within ±15 px of the real contact line.
   - At most 0.1 luma above the territory interior.
   - Today: s7 x 330–560, s1 x 220–260, s8 x 460–527.
6. **Bloom as a shell (s0, s1).**
   - Move the seed from 207,240 to about 0.5 R on an arm.
   - Replace the wall at x 306–325 with a closed convex 2–3 px shell (saturation ≥ 0.35, value ≥ 0.9, brighter than the core), with the lattice behind it.
   - Arms at saturation ≥ 0.3.
7. **The Return spark and ring (s6).**
   - One spark: a 4–6 px core at saturation ≥ 0.5, with no pixel above 0.9.
   - Delete the points at 306,180 and 288,217, and cut the hex bokeh.
   - Ring at r 110–120, leaving margins of at least 60 px.
   - Diff against a fresh Prologue capture.
8. **Collision and Neighbours (c09_s6, c08_s2).**
   - s6: two 150–250 px tails and a bridge, with M31 at least 25° redder.
   - s2: Andromeda natural with a cyan rim only on the near side, plus 3–6 probe streaks (2.6 px or wider, 60–150 px long).
   - s2: a `#1a0c08` dust lane at luma 0.15 or less in place of the light bar.
9. **Montage iris.**
   - Rim 2–3 px at about 0.3 luma.
   - Content vignetted inside r 140, so nothing crosses the rim.
   - About 40 % desaturation plus a victor tint.
   - The same line weight as the Return ring, so the iris *becomes* the ring.
10. **Coda brightness ladder.**
    - Point: peak ≥ 0.9, with a white 2 px core and a 20–24 px halo.
    - Candles island: 60–100 px.
    - Candles: 20+ elliptical candles mid-fade; drop the mantissa.
    - Hawking flashes: hard 2 px victor-tinted points, each with a thin ring.

## 6. Scores and trend

| Frame | A | B | C |
|---|---|---|---|
| c08_s0 Ring to disk | 5 | 6 | 6 |
| c08_s1 Bloom | 4 | 5 | 5 |
| c08_s2 Neighbours | 2 | 3 | 5 |
| c09_s1 Woke | 3 | 3 | 5 |
| c09_s2 Intrude | 3 | 4 | 4 |
| c09_s4 Choir out | 3 | 4 | 5 |
| c09_s5 New light | 4 | 4 | 5 |
| c09_s6 Andromeda | 4 | 4 | 5 |
| c09_s7 Lattice ends | 2 | 3 | 4 |
| c09_s8 Second mind | 3 | 3 | 4 |
| c10_s1 Candles | 2 | 3 | 4 |
| c10_s2 Holes | 6 | 6 | 7 |
| c10_s3 Point | 4 | 4 | 5 |
| c10_s4 Montage | 2 | 3 | 5 |
| c10_s6 Return | 5 | 6 | 6 |
| **Mean** | **3.47** | **4.07** | **5.00** |

By chapter, A → B → C:

| Chapter | A | B | C |
|---|---|---|---|
| Expansion | 3.7 | 4.7 | 5.3 |
| Contest | 3.1 | 3.6 | 4.6 |
| Coda | 3.8 | 4.4 | 5.4 |

**Reading the trend:**
- The pass-B narrative fixes landed: a line on every beat, a second colour in the Contest, and the victor's colour through the Coda. Eleven frames gained and none lost.
- The Contest is held back by execution:
  - near-white events;
  - events at dead centre on the bulge;
  - extinctions that celebrate the loser;
  - two frames drowned in halo.
- Bloom and the Return spark haven't moved in two passes.
