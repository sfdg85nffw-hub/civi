# Pass B review: chapters 8–10 (15 stills)

Second pass on Expansion, the Contest and the Coda. I judged only what is on screen, against `docs/DESIGN.md`, the pass-A report (`passA-ch8-10.md`) and the fix list in `README.md`. I didn't open any code. The frames are 640×360 software-rasterised renders on the lowest particle tier, so I've allowed for grain, salt-like star sprinkle and sparse fields. **All coordinates are pixels on the 640×360 frame, origin top-left.**

For the three continuity rhymes I also looked at the pass-B renders of `c07_s4_si-swarm`, `c07_s3_si-lastlight` and `c00_s2_p-membrane` (960×540, scaled to 640 for comparison). I didn't use them for anything else. As instructed, the montage frame is judged on framing only.

Status key for pass-A complaints: **FIXED** · **PARTLY** · **NOT FIXED** · **WORSE**.

---

## Measurements, pass A → pass B

These are the same metrics as pass A: Rec.709 luma of the sRGB frame; near-black means luma < 0.06; coloured px means value > 0.15 and saturation > 0.15. "Core plate" is the largest connected blob above 0.9 luma.

| Frame | near-black | clipped >0.98 | coloured px | hue split of coloured px (B) | core plate (B) |
|---|---|---|---|---|---|
| c08_s0 disk | 59.4 → **86.9 %** | 0 → 0.11 % | 5.3 → 3.1 % | warm 67 · blue 11 · red 11 · pink 8 | 31×22 px |
| c08_s1 bloom | 52.7 → **81.2 %** | 0.15 → 0.07 % | 28.4 → 8.2 % | cyan 76 · warm 15 | 24×24 px |
| c08_s2 neighbours | 99.2 → 96.1 % | 0 → 0 % | 0.4 → 1.9 % | cyan 92 | — |
| c09_s1 woke | 19.9 → **55.2 %** | 0.37 → 0.08 % | 44.5 → 14.4 % | **cyan 86** | 24×23 px |
| c09_s2 intrude | 52.3 → **88.0 %** | 0.23 → 0.05 % | 7.8 → 2.4 % | pink 56 · cyan 22 · blue 14 | 43×41 px |
| c09_s4 Choir out | 34.0 → **67.9 %** | 0.37 → 0.08 % | 42.0 → 12.9 % | **green 78** · warm 15 | 20×33 px |
| c09_s5 new light | 64.3 → 75.1 % | 0.10 → 0.06 % | 23.7 → 12.8 % | **green 98** | 22×20 px |
| c09_s6 Andromeda | 94.0 → 96.3 % | 0.01 → 0.01 % | 3.7 → 1.7 % | **green 94** | 7×3 px |
| c09_s7 Lattice ends | 5.4 → **40.4 %** | 0.89 → 0.25 % | 62.1 → 25.3 % | **green 96** | **58×49 px** |
| c09_s8 second mind | 74.2 → 94.5 % | 0 → 0.01 % | 12.1 → 2.1 % | **green 96** | 24×11 px |
| c10_s1 candles | 99.9 → 99.8 % | 0 → 0 % | 0.0 → 0.0 % | 8 red dots, sat 0.99 | — |
| c10_s2 holes | 92.2 → 94.0 % | 0 → 0 % | **0.0 → 0.0 %** | **none: max channel spread 5/255** | — |
| c10_s3 point | 99.9 → 99.8 % | 0 → 0 % | **0.0 → 0.0 %** | **none: R = G = B exactly** | — |
| c10_s4 montage | 99.0 → 98.9 % | 0 → 0 % | 0.4 → 0.4 % | warm star tints | — |
| c10_s6 return | 26.8 → 23.4 % | 0 → 0 % | 66.6 → 67.5 % | orange 73 · green 9 · gold 8 | — |

I also ran a faction-hue census: pixels with saturation > 0.25 and value > 0.06, within ±18° of each faction's bible hue.

| Frame | What's there |
|---|---|
| c09_s1 | Heir cyan: 56,410 px. Nothing else. |
| c09_s2 | Heir 2,215 px; Choir 503 px, all inside the core fringe. |
| c09_s4 | Hexarchy 24,718 px; Choir 1,187 px, but dim (95th-percentile value 0.22). |
| c09_s5 | Hexarchy 29,265 px; Choir 284 px at value 0.11. |
| c09_s6, s7, s8 | Hexarchy ≥ 94 %. Lattice gold is effectively absent everywhere (the warm hits are bulge stars). |
| c10_s2, c10_s3 | **Zero** pixels of any faction hue. |

**What moved:**
- Blacks came back almost everywhere (every frame except s7 now clears 55 %).
- Core plates roughly halved, from 40–60 px to 20–30 px.
- The Ring→disk geometry lines up.
- The Return's ring no longer cuts the cell.
- c09_s4 finally carries the right line and some Choir pink.

**What didn't:**
- Every Contest frame is still one hue.
- Two of the three Coda shots that must carry the victor's colour are still exactly neutral grey.
- Five of seven Contest beats now have no chronicle line at all.

### Chronicle on screen

| Frame | Beat | Line on screen (B) | Status |
|---|---|---|---|
| c09_s1 | Something woke in Andromeda. | *(none)* | PARTLY: no longer wrong, now absent |
| c09_s2 | Something came out of the intergalactic dark into Andromeda. | *(none)* | PARTLY |
| c09_s4 | The last of the Choir went out in the heart of Andromeda. | "+1.92 Gyr.  The last of the Choir went out in the heart of Andromeda." | **FIXED**: correct, one line, dated |
| c09_s5 | In the Scutum–Centaurus Arm, a light that had not been there before. | *(none)* | PARTLY |
| c09_s6 | Andromeda arrived. | *(none)* | PARTLY: the false "+1.04 Gyr" is gone, but the centrepiece of the chapter is uncaptioned |
| c09_s7 | The Lattice ended in the Sagittarius Arm. | "+6.1 Gyr.  The Hexarchy struck first." | **NOT FIXED**: wrong beat |
| c09_s8 | A second mind opened its eyes in Triangulum. | *(none)* | NOT FIXED |

Pass A had 0 of 7 correct. Pass B has 1 correct, 1 wrong and 5 empty. The dates now advance (+1.92 → +6.1), and nothing runs backwards any more. Truthfulness improved, but information dropped. In a wordless film the chronicle is the only place the war is named, and 71 % of the beats now pass in silence.

If the line is simply typed in later than the instant the capture tool lands on, then on screen it arrives after the event, and that is the same failure.

---

## Chapter 8: Expansion

### c08_s0, Ring to disk: **6/10** (A: 5)
*Now centred and tilted like the swarm ring, so the cut can rhyme. The galaxy itself is still grey salt with a clipped plate for a core.*

**What reads:**
- An inclined spiral centred on the frame (core 324,177), with two clean inner arms (x 255–400, y 125–225) and a diffuse outer disk (x 170–480, y 75–300).
- 87 % black, with generous negative space.
- Against the pass-B swarm still (Sun at 273,170; swarm ellipse aspect about 0.5), the disk's aspect (about 0.6) and centre are close. The Sun → core rhyme now exists.

**What doesn't read:**
- **Scale.** The swarm ring spans the full frame width, about 600 px. The disk spans 310 px and the inner arms 145 px. Unless the camera is still dollying at the cut, the cut jumps 2–4× in scale.
- **Palette.** Bright arm pixels average (0.34, 0.33, 0.33), saturation 0.03: grey, not `#8fb4ff`. The core is a flat white plate 31×22 px. There are no dust lanes, and every star is the same 1 px dot.
- **Soft magenta discs.** About 20 out-of-focus 6–8 px discs are scattered around the rim and arms (for example 188,175; 341,123; 464,186; 388,316). They read as lens bokeh, not HII knots. They're also in the Choir's hue family a chapter before the Choir exists.
- **Cyan seed.** The cyan cluster that replaced pass A's blob is five cyan points in a soft glow (x 198–222, y 225–250). It sits at about 0.95 of the disk radius, on the rim. If this is the Heir's seed, it's in the wrong place: the Orion Spur is at about half the radius.
- **Right-hand satellite.** The round satellite at 420,197 sits on the disk's edge and reads as a second bulge.

| Pass-A complaint | Status |
|---|---|
| Galaxy in top-right corner; match cut can't land | **PARTLY → mostly FIXED** (position and tilt match; scale doesn't) |
| Core is a flat clipped plate | PARTLY (60×35 → 31×22) |
| Arms grey salt, no dust lanes, uniform dots | NOT FIXED |
| Cyan blob in the void (x 228–345, y 155–235) | PARTLY (now a small cluster on the rim; still cyan before the Bloom) |
| Magenta ghost arc | NOT FIXED (more discs now, spread around the rim) |

**Fixes:**
1. **Lock scale across the cut.** The first disk frame should open pushed in, with the inner-arm ellipse filling the frame the way the swarm ring does (about 600 px). Put the core where the Sun was (273,170 → move both to frame centre). Then dolly out, and **rotate toward face-on during the pull-out**, so Bloom starts from this camera rather than cutting to a new one.
2. **Grade the disk:**
   - A warm `#ffd9a0` bulge with a falloff, full white only in the central 6–8 px.
   - Blue-white arms at saturation 0.3 or more.
   - A dark brown dust lane on the inner edge of each arm (band x 260–390, y 130–225).
   - The magenta bokeh replaced with 2–3 px hard pink knots *on* the arms.
3. **Move the cyan seed to about 0.5 R on an arm** (roughly 255,205 in this framing, about 70 px from the core) and make it one hard cyan point. Otherwise remove it.

### c08_s1, Bloom: **5/10** (A: 4)
*A front finally exists and the untouched galaxy beside it has its colours back. But the front is a cyan cumulus cloud billowing off the rim into empty space, not a lattice spreading from the Sun.*

**What reads:**
- The galaxy outside the front is natural (warm core, blue-white arms) and sits inside the frame (y 85–300, 81 % black).
- A cold cyan volume occupies the left of the disk. Its edge is brighter, so the territory-versus-nature idea is legible.

**What doesn't read:**
- **Origin.** The volume is centred on the disk's left rim (about 230,225), consistent with the misplaced seed in s0. As a result, half of it, x 135–225, hangs in intergalactic black where there are no stars. It reads as a nebula or smoke in front of the galaxy, not territory made of stars.
- **Shape.** The leading edge is a near-straight vertical wall at x≈300–325, from y 95 to 340. It reads as a curtain or clipping plane, not an expanding shell. That's pass A's c09_s4 terminator complaint, moved to chapter 8.
- **Texture.** It's made of 15–25 px gaussian puffs: cauliflower, worse than pass A because there's more of it. There is no hex lattice anywhere.
- **Colour.** The brightest 10 % of the rim averages (0.56, 0.62, 0.64): hue 194° is right, but saturation is 0.13 and value 0.64. The interior is (0.27, 0.33, 0.34). That's the same grey-cyan pass A measured. The brightest object in the frame is still the core plate (24×24 px, pure white), not the front.

| Pass-A complaint | Status |
|---|---|
| No front | PARTLY (a front exists; wrong form and origin) |
| No hex lattice; cotton-wool blobs | NOT FIXED (bigger cotton wool) |
| Heir colour grey | NOT FIXED |
| Galaxy's natural palette gone | **FIXED** |
| Disk overfills frame | **FIXED** |
| 40 px clipped core | PARTLY (24×24) |

**Fixes:**
1. **Move the origin to the Orion Spur** (about 0.5 R; for this framing about 290,215) and **bind territory to the disk**. Nothing should light beyond the stellar rim (x < 225), and there should be no volumetric fill.
2. **Replace the cloud with a shell:** a closed, convex ellipse, 2–3 px, `#9fe8ff` at full value, the brightest line in the frame. It should bulge outward on every side, not end in a straight wall.
3. **Fill behind the shell with the Heir's hex lattice:** cells 8–12 px, faint cyan edges, brighter nodes on the stars. Keep the natural galaxy outside the shell exactly as it is now.

### c08_s2, Neighbours: **3/10** (A: 2)
*The new camera puts the Milky Way low in frame, but Andromeda is an 11 px speck already tinted cyan, and nothing crosses the gap.*

**What reads:**
- The whole Milky Way, not a sliver (x 160–345, y 260–345), slightly tilted, in Heir cyan.
- Andromeda (402,26) and a possible Triangulum (510,91) above it. Deep black.

**What doesn't read:**
- **Scale.** The MW is 29 % of frame width, a medium galaxy sitting low-left rather than filling the lower third. Andromeda is 11×8 px and almost touching the top edge. Triangulum is a 5 px streak.
- **Magellanic Clouds.** The only one is a round blob *cut off by the bottom edge* (x 268–285, y 345–360).
- **The reaching.** There are no probe streaks, and Andromeda is already cyan. The beat ("fronts reach the Clouds, Triangulum, Andromeda") is still off-screen.
- **Starfield.** 49 stars, median luma 0.26, all 1–2 px: still no magnitude range.

| Pass-A complaint | Status |
|---|---|
| MW a sliver on the bottom edge | PARTLY (whole now, but too small) |
| Andromeda ≥ 40 px in the upper-right third | NOT FIXED (11 px, at the edge) |
| Magellanic Clouds | NOT FIXED (one blob, clipped) |
| Show the reaching (probes, near-side rim, lag) | NOT FIXED |
| Star magnitude range | NOT FIXED |

**Fixes:**
1. **Rescale the group:**
   - MW about 3× larger, filling x 40–600, y 220–360.
   - Andromeda at least 40 px long at about 460,90, elongated and inclined, clear of the frame edge.
   - Triangulum about 15 px beside it.
   - Two irregular Cloud smudges fully inside the frame just off the MW rim.
2. **Show the reach:**
   - Cyan probe streaks, 2.6 px or wider and 60–150 px long, crossing the void.
   - Andromeda in its own older, redder natural colour, with a cyan rim only on the near side.
   - Triangulum still natural, so the light-speed lag is visible.
3. **Stars:** mostly 1 px at 10–30 % luma, a handful of 2–3 px bright ones.

---

## Chapter 9: The Contest

Across the chapter: blacks are back and cores are smaller. **But not one frame shows two faction colours at a readable level, and not one frame shows its beat's event.**
- The Hexarchy's green covers s4–s8 at 94–98 % of saturated pixels.
- The Choir exists only as dim maroon rings (s4) and faint splats (s5, s7).
- Lattice gold appears nowhere.
- Kill vehicles, beams and novae are absent, apart from one 18 px dash in s7.
- The "two-colour interference fringes" from the fix list are on screen in s2 and s7. At a 1 px period they read as dither or moiré, not as fronts.

### c09_s1, "Something woke in Andromeda.": **3/10** (A: 3)
*Darker than before, but it's the same picture: a face-on, frame-filling cyan spiral with nothing waking and no caption.*

**What reads:** a big face-on spiral, faint concentric structure, and blacks in the corners (55 % near-black, up from 20 %).

**What doesn't read:**
- **One colour.** 97 % of faction-hued pixels are Heir cyan. No new light, no new hue.
- **Size.** The galaxy is about 65 % of frame width and cropped top and bottom (x 140–560, y 0–360).
- **Haze texture.** The haze is still 15–25 px cotton-wool puffs (x 140–220 and x 470–560).
- **Not Andromeda.** It's round and face-on, interchangeable with c08_s1 and c09_s5.
- **No line.**

| Pass-A complaint | Status |
|---|---|
| One colour; no new hue | NOT FIXED |
| Blacks gone (20 %) | PARTLY (55 %) |
| 45 px clipped core | PARTLY (24×23) |
| Wrong, wrapped line | PARTLY (no line now) |
| Indistinguishable from the Milky Way | NOT FIXED |

**Fixes:**
1. **The event is a new hue:** one hot point of the new faction's colour in one arm, with the first ring or tile of its pattern spreading from it. It should be the most saturated object in the frame. Frame on it (right third), not on the core.
2. **Shoot Andromeda at its real inclination** (about 3:1 ellipse, dust rings, big bulge), with the galaxy at 50 % of the frame or less.
3. **The line**, up by the first frames of the shot.

### c09_s2, "Something came out of the intergalactic dark into Andromeda.": **4/10** (A: 3)
*The strong diagonal now sits in real black, and two colours touch at the core. But nothing comes out of the dark, and the fringes are 1 px moiré.*

**What reads:**
- The inclined disk from bottom-left to top-right (x 130–510, y 0–360), still the best graphic shape in the chapter.
- 88 % black.
- Pink-and-cyan diagonal stripes at the core. Close up, that is the Choir meeting the Heir.

**What doesn't read:**
- **No intruder.** The top-left (x 0–200, y 0–150) is empty.
- **Fringes.** 1 px diagonal pink/cyan stripes over a 43×41 px white plate (x 265–370, y 135–205). At this period they read as aliasing on the bulge, not as a front, and they're placed on the core rather than along a contact line.
- **Lilac halo.** It still reaches about 90 px from the core: sky luma 0.16 at 40 px, 0.09 at 60 px, 0.04 at 80 px. Pass A asked for under 0.03 at 40 px.
- **No line.**

| Pass-A complaint | Status |
|---|---|
| Nothing enters from the dark | NOT FIXED |
| Grey-lilac bloom over half the frame | PARTLY (radius about 90 px, magenta-grey) |
| Diamond cross-hatch at the core | PARTLY (now two-coloured, still reads as moiré) |
| Repeated, wrapped line | PARTLY (none now) |

**Fixes:**
1. **Show the intruder:** a narrow wedge or a string of probe streaks in the intruder's colour from the black top-left corner (x 0–200, y 0–150), meeting the upper-left limb of the disk (around 360,90) in a two-colour fringe.
2. **Set a minimum fringe period** of about 1.2–1.5 % of frame height (4–6 px here, 13–16 px at 1080p). Orient the bands *along* the contact line, and keep them off the bulge.
3. **Clamp the halo** to under 0.03 luma at 40 px from the disk. Add the line.

### c09_s4, "The last of the Choir went out in the heart of Andromeda.": **4/10** (A: 3)
*The right line at the right date, and the Choir's rings are finally on screen. But they're dim, scattered at the rim, and nothing goes out.*

**What reads:**
- **The line.** "+1.92 Gyr.  The last of the Choir went out in the heart of Andromeda." is correct, on one line, and readable: type at about 0.55–0.6 luma over a background of 0–0.33.
- **Choir rings.** About a dozen concentric rings, 10–25 px (for example 182,265; 142,287; 235,292; 315,295), are the first time a second faction's pattern language has appeared in the Contest.
- 68 % black.

**What doesn't read:**
- **The rings are almost invisible.** They're dark maroon (95th-percentile value 0.22) on dark green, and only show clearly at 2× gain. At normal viewing they read as lens ghosts.
- **Wrong place.** They're scattered over the *outer left* of the disk (x 130–320, y 200–300). The line says "in the heart". There's no last pocket, no collapse and no scar.
- **Haze edge.** The right edge is now curved (x 333 at the top, 412 at mid-height, 387 at the bottom) instead of vertical. It's still hard: luma falls from 0.22 to 0.04 within 20 px.
- **The camera is on the core again** (308,168, a 20×33 px plate). The second half of the line ("Choir went out in the heart of Andromeda") is set over dense star salt.

| Pass-A complaint | Status |
|---|---|
| Choir pink absent | PARTLY (present but dim and scattered) |
| Blacks at 34 % | **FIXED** (68 %) |
| Vertical terminator at x≈415–465 | PARTLY (curved, still hard) |
| Stale line | **FIXED** |
| Get off the core | NOT FIXED |

**Fixes:**
1. **Stage the last pocket:** one Choir cluster, concentric rings 20–40 px across in `#ff5fb4` at full saturation (the brightest saturated thing in the frame), about 50 px from the core, ringed by green. Remove the scattered dim rings elsewhere. Over the shot it shrinks, its rings collapse inward, and it leaves a black scar.
2. **Reframe** so the core is on the left third or out of frame, and the pocket sits on the right third.
3. **Feather the haze edge** over 60–80 px, or let the stars define it.

### c09_s5, "In the Scutum–Centaurus Arm, a light that had not been there before.": **4/10** (A: 4)
*Cleaner blacks, but it's the third centred face-on spiral, and the "new light" is still two green-white blobs.*

**What reads:** a face-on galaxy with black margins (75 %), natural white-gold arms inside a green haze, and two bright blobs (237,215 and 272,234). Faint pink splats are mixed into the green, visible only on inspection.

**What doesn't read:**
- **No new colour:** 96 % Hexarchy green.
- **Can't tell what's new.** The blobs could be satellites as easily as the event.
- **Same picture** as c08_s1 and c09_s1, core at frame centre (319,179).
- **The haze is uniform** across the whole disk, so territory still reads as a tint, not a shape.
- **No line.**

| Pass-A complaint | Status |
|---|---|
| No new colour | NOT FIXED |
| Same picture as s1 and the Bloom | NOT FIXED |
| Line misleading | PARTLY (none now) |
| Natural galaxy where no faction holds | PARTLY (arms natural, but haze covers everything) |

**Fixes:**
1. **One pinpoint of a never-seen hue** with its pattern (for example Furnace `#ff4a3a` with spokes: 6–10 px core, about 30 px pattern) on the Scutum–Centaurus arm. Push in and put it on the right third, with the bulge off frame-left.
2. **Shape the Hexarchy:** its territory should be a bounded region with an edge, carrying its fractal-hex language. The rest stays natural galaxy.
3. **The line.**

### c09_s6, "Andromeda arrived.": **4/10** (A: 4)
*The same quiet pair in a green halo. No tails, no bridge, no second colour, no caption, for the biggest physical event in the film.*

**What reads:** two cores in one halo (x 235–405, y 145–215), a satellite at 145,237, and 96 % black. Composed well enough to be a calm establishing shot.

**What doesn't read:**
- **No tidal features.** The white smear under the right core (x 325–350, y 200–212) reads as a smudge, not a bridge or starburst.
- **One colour:** 94 % green, and both disks are identical. The fix list says Andromeda is "older and redder than ours", but on screen they can't be told apart.
- **Small:** the group is 170 px wide (27 % of frame width).
- **No line or date.**

| Pass-A complaint | Status |
|---|---|
| No tails, bridge or starburst | NOT FIXED |
| Mottled halo of splats | NOT FIXED |
| One colour | NOT FIXED |
| Group 28 % of width | NOT FIXED |
| Stale line, "+1.04 Gyr" | PARTLY (false line gone; correct one missing) |

**Fixes:**
1. **Antennae/Mice treatment:** two long curved tidal tails (150–250 px) swinging out in opposite directions, a bridge between the cores, and starburst knots along the collision.
2. **Two territories:** each disk in its own colour, or one natural and redder, with fringes where they overlap and nova or RKV flashes at the contact.
3. **Push in** so the pair spans about 50 % of the width, and caption it "+4.5 Gyr. Andromeda arrived."

### c09_s7, "The Lattice ended in the Sagittarius Arm.": **3/10** (A: 2)
*Less fog and a readable line, but it's the wrong line, the Lattice is nowhere, and the checkerboard artifact is still there.*

**What reads:** a merger with two cores (220,140 and 295,215) and a distant third galaxy (615,160). The line "+6.1 Gyr.  The Hexarchy struck first." is now readable.

**What doesn't read:**
- **Still fog.** 40 % near-black and mean luma 0.18 (the worst in the Contest), with green cotton wool from edge to edge.
- **The largest core plate in the set:** 58×49 px at 305,211.
- **No Lattice:** no gold, no cubic cells.
- **Checkerboard.** The "interference" patch at x 300–345, y 160–200 is a 1 px checkerboard dither.
- **The only weapon** is a pale 18 × 2–3 px dash (273–292, 163–173), which reads as a scratch.
- **Text contrast.** The text sits on haze at 0.16–0.18 luma, and stars behind it reach 0.55, as bright as the type.

| Pass-A complaint | Status |
|---|---|
| 5 % black, clipping, fog | PARTLY (40 %, 0.25 % clip) |
| Lattice gold absent | NOT FIXED |
| Stripe moiré patch | NOT FIXED (now a checkerboard) |
| Line illegible | PARTLY (legible, but the wrong line) |
| RKV strike not visible | NOT FIXED |

**Fixes:**
1. **Show the Lattice's end:** gold cubic cells (`#f2d27a`) in one arm being overrun, with 3–5 RKV streaks 100 px or longer (hot white heads, green tails) converging on them, followed by nova flashes.
2. **Pull back to at least 60 % black.** No volumetric fill, and replace the 58×49 core plate with a falloff.
3. **Fix the fringe period** (as in s2), put the matching line on screen, and **strengthen the text scrim** so the haze behind the type drops below 0.06.

### c09_s8, "A second mind opened its eyes in Triangulum.": **3/10** (A: 3)
*Now whole and well placed, but the faint ring that hinted at an eye is gone, so the beat is now entirely absent.*

**What reads:** an edge-on disk, whole (x 270–615, y 165–250), on the right half of the frame, with 94.5 % black.

**What doesn't read:**
- **No eye.** Pass A's faint ring (x 420–455, y 155–190) has gone and nothing replaces it.
- **No second colour:** 96 % green.
- **Not Triangulum.** It's a large edge-on disk (53 % of frame width); Triangulum is small, loose and nearly face-on.
- **Still no line.**

| Pass-A complaint | Status |
|---|---|
| No line | NOT FIXED |
| Galaxy cut off by the right edge | **FIXED** |
| Ring same green and faint | **WORSE** (ring removed; no event at all) |
| Doesn't look like Triangulum | NOT FIXED |
| "Second mind" should mean a second colour | NOT FIXED |

**Fixes:**
1. **Triangulum as Triangulum:** small and loose, nearly face-on, 35–45 % of frame width, on a third.
2. **The eye:** an iris-like opening in the new mind's own colour and pattern, the brightest saturated thing in the frame, about 20–30 px, off the core.
3. **The line.**

---

## Chapter 10: Coda

### c10_s1, The horizon closes: **3/10** (A: 2)
*The candles now read as red, at different brightnesses, but they're LED dots, and the victor's island is two dim green pixels.*

**What reads:**
- Absolute black.
- Eight saturated red points (saturation 0.99) at stepped brightness: 388,202 at 0.65; 443,149 at 0.51; 80,192 at 0.48; down to 364,55 at 0.08. Read in sequence, that is "going out".
- The counter is beautifully set.

**What doesn't read:**
- **No island.** The victor's Local Group is a 2 px green dot at luma 0.08 (284,196) beside a 3×3 brown smudge (285,188), invisible at normal viewing.
- **The candles are round 3–4 px dots**, not galaxies, and there are too few to read as "the universe going out". About eight more white points are indistinguishable from them except by colour.
- **The mantissa** ("+1.1 × 10¹² years") is still there.

| Pass-A complaint | Status |
|---|---|
| Island not in frame | NOT FIXED (2 px at 0.08 luma) |
| Candles 1 px red dots | PARTLY (3–4 px, saturated, stepped) |
| Drop the mantissa | NOT FIXED |

**Fixes:**
1. **The island:** the merged galaxy at frame centre, 80–120 px, in fully saturated victor green. It should be the only colour left in the universe, and it's what the saturation beat cuts to.
2. **The candles:** 20–40 elliptical smudges, 4–12 px, shifting white → orange → deep red, staggered so every still catches several mid-fade.
3. **The counter:** "+10¹² years".

### c10_s2, The last black holes: **6/10** (A: 6)
*Still the best-made frame in these chapters, and still exactly grey. The victor's colour hasn't reached its own ending.*

**What reads:**
- Four lensed holes with true shadows and photon rings (225,165; 290,142; the crescent at 317,185; 563,163) and particle disks.
- 94 % black.
- The counter smeared into soft blobs, as the bible asks ("digits smear").

**What doesn't read:**
- **No chroma at all.** The largest channel spread anywhere in the frame is 5/255. The fix list says the rings were "kept below white-out so they stay the winner's colour", but the brightest ring pixels sit at 0.91–0.97 and are perfectly neutral. The problem was never white-out: something is removing all chroma from this shot.
- **Nothing to lens:** the background is pure black.
- **Debris, not structures:** the disks read as spray.
- **Hawking flashes** are 25–30 px soft streetlights (230,113; 333,157; 117,280).

| Pass-A complaint | Status |
|---|---|
| Zero coloured pixels | **NOT FIXED** (claimed fix not visible) |
| Lensing has nothing to bend | NOT FIXED |
| Structures read as debris | NOT FIXED |
| Hawking flashes as streetlights | NOT FIXED |

**Fixes:**
1. **Victor-green accretion rings** at saturation 0.5 or more, with Doppler asymmetry (one side 2–3× brighter). These should be the most saturated colour in the Coda. First find out why this shot is neutral when Candles keeps saturation 0.99 reds.
2. **A faint, red-dimmed backdrop** of the last stars or the victor's structures, warped into arcs near each hole.
3. **Structures as thin, orderly rings or hex fragments** at the photon sphere. Hawking flashes as hard 2 px points, each with a thin expanding ring.

### c10_s3, One point remains: **4/10** (A: 4)
*The composition is right, but the last light of the universe is a grey dot with a small grey halo, dimmer than before.*

**What reads:** absolute black, one point at dead centre (320,180), and "+10¹⁰⁰ years", legible and sobering.

**What doesn't read:**
- **Neutral grey.** The core is exactly (0.71, 0.71, 0.71): R = G = B, saturation 0.
- **Dimmer.** Peak is 0.71, down from 0.79.
- **Small halo.** The halo exists now (0.42 at r = 2, 0.13 at r = 6, 0.05 at r = 8, so about 16 px wide), but it's grey and smaller than the "wide halo" in the fix list.
- **Weak rhyme with chapter 7's last light** (c07_s3: 320,217, warm orange, about 20 px halo). It matches in x and roughly in size, but differs in y (180 vs 217) and in colour.

| Pass-A complaint | Status |
|---|---|
| Point achromatic, no halo | PARTLY (halo added; still exactly grey) |
| Rhyme with chapter 7's last light | PARTLY (size only) |
| Keep everything else empty | **FIXED** (kept) |

**Fixes:**
1. **Victor green:** a white-hot 2–3 px core, a 16–24 px green halo at saturation 0.5 or more, and a slow dimming flicker. It should be the brightest pixel of the Coda.
2. **Rhyme with chapter 7:** use the same screen position as the chapter-7 last light (move it to 320,217, or move that one to 320,180) and the same halo diameter.
3. **Keep the rest empty.**

### c10_s4, Inside it: **3/10** (A: 2) *(content excluded, as briefed)*
*Whatever plays inside the point plays full-frame. Nothing says "inside", "memory" or "backward", and the framing duplicates Neighbours.*

**What reads:** a natural-colour galaxy (x 220–300, y 255–290) and warm stars. It's plausibly a recorded frame, and it's no longer cut off by the bottom edge.

**What doesn't read:**
- **No inside.** There's no aperture, iris, rim, vignette or colour treatment. The frame is a full-bleed galaxy shot.
- **Same framing as Neighbours.** The galaxy sits at almost the same screen position as the MW in c08_s2 (258,272 vs 258,295), so the memory reads as a re-run of the original rather than a recollection inside the last light.

| Pass-A complaint | Status |
|---|---|
| No iris | NOT FIXED |
| Fallback is the live scene | N/A (content not judged) |
| "Backward and accelerating" readable | can't judge from a still |

**Fixes:**
1. **An iris:** the montage plays inside a circular aperture that grows out of the point (point → disc → full frame over about 1 s), with a thin rim in victor green. This is the circle in the bible's scale rhyme.
2. **A memory treatment** inside the iris: slight desaturation or a single tint, a soft vignette, and the reverse-motion smear between cuts.
3. **End the montage on the first cell centred where the Return's sphere will be** (417,176), so montage → black → Return lands on the same spot.

### c10_s6, Return: **6/10** (A: 5)
*The ring now closes around the first cell, which is the intended closing image. But the spark is still a white point among three, and the frame isn't the Prologue's frame.*

**What reads:**
- **The ring is concentric with the cell:** centre 416.5,176.5, r ≈ 93.5, against the sphere's centre 417,176 and r ≈ 75. That's a real closing image.
- **The membrane is tinted victor green-gold** inside (hue 67–103°, saturation 0.3–0.4), which carries the colour.
- Plume, chimney and bubbles keep the Prologue's vocabulary.

**What doesn't read:**
- **The spark.** The brightest point in the cell is pure white (1.00, 1.00, 1.00) at 417,176, with a 1 px pale-green fringe. Two more points compete with it: 400,177 (pale green, 0.89) and 381,212 (near-white, 1.0). There are three candidates and no victor-coloured one.
- **Ring proportion.** At 1.25× the sphere's radius the gap is only 18 px. With the playhead dot at 12 o'clock (423,83), it reads as a UI progress ring or a scope reticle rather than the timeline curling shut.
- **Hex bokeh is unchanged.** There are about seven green hexes; the largest is about 45 px (x 570–615, y 140–185), with others at 525–545,130–150 and 270–290,25–40. They're still the brightest coloured shapes after the cell, and the only place the Hexarchy's hex language appears in the whole film.
- **Not the opening frame.** Against the pass-B Prologue still (c00_s2), the sphere is 150 px across vs 69 px, the chimney tip is about 75 px further left (155,310 vs 232,305), and the frame is 2.3× brighter (mean luma 0.21 vs 0.093; 23 % near-black vs 57 %). The bible says "bit-identical except the spark". If the two stills are different instants of one push-in, ignore this; if not, the Return isn't exact.
- The chimney tip still reads as a candle or a fingertip.

| Pass-A complaint | Status |
|---|---|
| Ring intersects the cell | **FIXED** (concentric; tighter than the 1.6× asked) |
| Spark white, not victor colour | PARTLY (membrane tinted; spark core white) |
| Decide on the hex bokeh | NOT FIXED (unchanged) |
| Plume floods the frame | NOT FIXED (23 % black, slightly worse) |
| Chimney reads as a candle | NOT FIXED |

**Fixes:**
1. **One spark, in the victor's colour:** a saturated green core of 4–6 px (saturation ≥ 0.5 at its centre, no white pixel), with a 30–40 px glow tinting the membrane. Remove the other two bright points.
2. **Match the Prologue camera and exposure exactly** (sphere 69 px, vent at 232,305, mean luma about 0.09), then set the ring at about 1.6× *that* sphere's radius, roughly 55 px. Give the ring a reason to be the timeline: the chapter colours along its arc, ending in green where it closes.
3. **Hex bokeh:** cut it, or keep two dim ones near the sphere. Better, move the Hexarchy's hex language into the Contest, where it's missing.

---

## Ranked: the 10 highest-impact remaining fixes

1. **Each Contest beat must show its event in its own colour (c09_s1, s4, s5, s7, s8; then s2 and s6).** The territory "whisper" worked: the incumbent is now quiet enough to let something else be the hero. Nothing else has been put there.
   - s1: a new hue sparking in Andromeda.
   - s4: the last Choir pocket, full `#ff5fb4`, collapsing in the heart.
   - s5: a never-seen hue on the Scutum–Centaurus arm.
   - s7: Lattice-gold cubic cells overrun by RKV streaks.
   - s8: the second mind's iris in Triangulum.

   Each should be the most saturated object in its frame, at saturation 0.5 or more. Today 94–98 % of saturated pixels in s4–s8 are one green, and Lattice gold is on screen nowhere.
2. **The Coda's victor colour (c10_s2, c10_s3, c10_s1).** Holes and Point are *exactly* neutral (R = G = B; largest channel spread 5/255), so the "kept below white-out" fix had no visible effect. Candles still renders saturation 0.99 reds, so a whole-Coda grade isn't the explanation. Find out what is removing chroma in these two shots.
   - Green accretion rings with Doppler asymmetry.
   - A green last point with a white-hot core and a 16–24 px halo.
   - An 80–120 px green island in Candles (today 2 px at 0.08 luma).
3. **A chronicle line on every beat, up by the first frames of the shot (c09, all).** 5 of 7 beats have no line. s7 shows "The Hexarchy struck first." over "The Lattice ended." s6, the Andromeda collision, has no date. Strengthen the scrim where territory haze sits behind the type: in s7 the background is 0.16–0.18 luma and stars behind the text are as bright as the letters.
4. **Bloom as a shell from the Orion Spur (c08_s1, with s0's seed).**
   - Move the origin from the disk rim to about 0.5 R.
   - Confine territory to the stellar disk, with no fill in the void (x 135–225 today).
   - Replace the cumulus volume and its vertical wall (x 300–325) with a thin, closed `#9fe8ff` shell at full value, brighter than the core, with the Heir's hex lattice behind it.
5. **Make the interference fringes readable (c09_s2, c09_s7, and wherever fronts appear).**
   - Minimum period of about 1.2–1.5 % of frame height (4–6 px here, 13–16 px at 1080p).
   - Bands run along the contact line between two territories.
   - Never on top of a bulge.

   Today s2 is 1 px pink/cyan moiré on a 43×41 white plate, and s7 is a 1 px checkerboard.
6. **Return: one victor-green spark, and the exact Prologue frame (c10_s6).**
   - Remove the white core and the two extra bright points.
   - Match the Prologue's sphere size (69 vs 150 px), vent position (about 75 px offset) and exposure (2.3× brighter today).
   - Set the ring at about 1.6× of the matched sphere.
   - Cut or dim the hex bokeh.
7. **Galaxy framing and identity in the Contest (c09_s1, s5, s7).**
   - Stop centring face-on spirals: six galaxy frames have the core within 40 px of frame centre.
   - s1 and s7 are still frame-filling (55 % and 40 % black; s7 has a 58×49 px core plate).
   - Andromeda at its real inclination with dust rings; Triangulum small and face-on.
   - Put the camera on the event, not the bulge.
8. **The Andromeda collision (c09_s6):**
   - Tidal tails of 150–250 px, a bridge and starburst knots.
   - Two colours meeting, or Andromeda visibly older and redder (the fix-list claim isn't visible).
   - Pushed in to about 50 % of frame width.
   - Captioned with +4.5 Gyr.
9. **Neighbours shows the reach (c08_s2):**
   - MW about 3× larger.
   - Andromeda at least 40 px, natural on its far side with a cyan near-side rim.
   - Probe streaks crossing the gap.
   - The Clouds inside the frame (one is clipped by the bottom edge at x 268–285).
   - Light-speed lag visible.
10. **The montage iris (c10_s4) and the Point rhyme (c10_s3).**
    - The montage opens inside an aperture that grows from the point, with a green rim and a memory treatment, and ends on the first cell at the Return sphere's position.
    - The last point takes chapter 7's last-light screen position and halo, in victor green.

**Next in line:**
- Grade the base galaxy (warm bulge falloff, blue arms, dust lanes, knots on the arms rather than soft magenta bokeh around the rim).
- Lock Ring→disk scale and rotate to face-on during the pull-out.
- Feather the hard haze edge in s4.
- Drop the counter mantissa in Candles.
- Give starfields a magnitude range.
- The chimney tip in the Return.

## Broken or obviously wrong frames

- **c10_s2 and c10_s3: exactly achromatic,** despite the fix list saying they now stay the winner's colour. This is the most serious defect in the set because it breaks the ending's argument.
- **c09_s1, s2, s5, s6 and s8: no chronicle line. c09_s7: wrong line** for the beat.
- **c09_s2:** 1 px pink/cyan diagonal moiré over the core plate (x 265–370, y 135–205). **c09_s7:** 1 px checkerboard patch (x 300–345, y 160–200). Both read as dither or aliasing.
- **c08_s1:** the front's leading edge is a straight vertical wall (x 300–325, y 95–340), and the territory fills empty space beyond the galaxy (x 135–225).
- **c09_s4:** the haze still ends on a hard edge (luma 0.22 → 0.04 within 20 px along x 333–412).
- **c09_s8:** the eye ring was removed and nothing replaces it, so the beat has no visible event.
- **c08_s2:** a Magellanic Cloud is clipped by the bottom edge (x 268–285, y 345–360).
- **c10_s1:** the victor's island is a 2 px green dot at 0.08 luma (284,196), effectively absent.
- **c10_s6:**
  - three bright points inside the cell (381,212; 400,177; 417,176), with the brightest pure white;
  - the frame doesn't match the Prologue still (sphere 2.2× larger, vent shifted, 2.3× brighter).

## Repetitive compositions

- **Core at frame centre.** c08_s0 (324,177), c08_s1 (355,174), c09_s1 (347,207), c09_s4 (308,168), c09_s5 (319,179) and c09_s7 (305,211): six of the ten galaxy frames. c08_s1, c09_s1 and c09_s5 are the same centred face-on spiral three times in about 30 seconds.
- **Blown core plate as the centre of interest** in every galaxy frame. It's smaller now (20–30 px), but s2 (43×41) and s7 (58×49) are still big plates. The Contest's events happen in arms, at fronts and in neighbouring galaxies, and the camera still frames the bulge.
- **Inclined diagonal disk:** c09_s2 (bottom-left → top-right) and c09_s8 (left → right).
- **Galaxy low-left-of-centre in a sparse black field:** c08_s2 (258,295) and c10_s4 (258,272) are almost the same screen position, so the montage reads as a re-run of Neighbours.
- **Small group in black:** c09_s6 and c09_s8 share the same density and scale.
- **Cotton-wool territory haze** (15–25 px gaussian puffs) is the texture of c08_s1, c09_s1, s4, s5 and s7. That's five frames with one texture across two factions whose bible languages are a hex lattice and fractal hexes.

**What to vary:**
- Contact-line close-ups where two colours meet (fringes filling the frame).
- A grazing shot along the disk plane with the bulge as a horizon glow.
- A long lens on one system being struck.
- A top-down Andromeda as a long ellipse.
- Wide two- and three-galaxy group shots with lots of black.

## Continuity between shots

- **Swarm → disk (c07_s4 → c08_s0): mostly fixed.**
  - Both frames are centred and similarly tilted (aspect about 0.5 vs 0.6).
  - Sun at 273,170 vs core at 324,177, a 50 px offset.
  - Scale jumps 2–4× (the ring is about 600 px across, the disk 310 px, the inner arms 145 px).
  - The swarm's warm Sun becomes a neutral white core; a warm bulge would close the rhyme.
- **Disk → Bloom:** the centre moves 31 px and the tilt changes from about 50° to face-on. The cyan seed on s0's lower-left rim becomes the cloud on s1's left rim. That's consistent, which is good, but it shows the origin is at the rim, not the Orion Spur.
- **Bloom → Neighbours:** the MW and Andromeda are both already cyan. The front reaching Andromeda is never shown.
- **Chapter 8 → chapter 9:**
  - Heir cyan in Andromeda (s1).
  - A pink/cyan fringe at Andromeda's core (s2).
  - Choir rings dying inside Hexarchy green (s4).
  - Green everywhere (s5–s8).

  There is now a faint story thread (Heir and Choir contest Andromeda; the Hexarchy swallows both), but it can only be read at 2× gain. The Heir, the protagonist since chapter 7, still vanishes off-screen between s2 and s4 without being seen to lose.
- **Does the Contest read as a war between distinct factions? Still no.**
  - The chronicle names the Choir, the Hexarchy and the Lattice.
  - The screen shows cyan, then green, with dim maroon rings in one frame.
  - There are no readable two-colour fronts, no beams, no novae and no streak longer than 18 px.

  Without the chronicle, which now speaks only twice, chapter 9 reads as "the galaxy turns green".
- **Contest → Coda:**
  - Green holds in Candles only as a 2 px dot.
  - It's absent from Holes and Point.
  - It returns as the membrane tint and hex bokeh in the Return.

  The thread "the colour that won is the last light, then the first spark" is still broken for the whole middle of the Coda.
- **Point → montage:** there's no iris, and the montage looks like chapter 8's Neighbours. The scale rhyme point → circle → cell is missing its middle term.
- **Point ↔ chapter 7's last light:** the x position and halo size roughly match; the y position (180 vs 217) and colour (grey vs warm orange) don't. The rhyme is in shape only.
- **Return ↔ Prologue:** the layout vocabulary matches (plume, chimney lower-left, sphere right of centre). Scale, position and exposure don't (sphere 150 vs 69 px, vent about 75 px left, 2.3× brighter). Hex bokeh and the ring are added on top. As delivered it isn't "the exact opening frame".

## Score trend vs pass A

| Frame | A | B | Δ |
|---|---|---|---|
| c08_s0 Ring to disk | 5 | 6 | +1 |
| c08_s1 Bloom | 4 | 5 | +1 |
| c08_s2 Neighbours | 2 | 3 | +1 |
| c09_s1 Woke | 3 | 3 | 0 |
| c09_s2 Intrude | 3 | 4 | +1 |
| c09_s4 Choir out | 3 | 4 | +1 |
| c09_s5 New light | 4 | 4 | 0 |
| c09_s6 Andromeda | 4 | 4 | 0 |
| c09_s7 Lattice ends | 2 | 3 | +1 |
| c09_s8 Second mind | 3 | 3 | 0 |
| c10_s1 Candles | 2 | 3 | +1 |
| c10_s2 Holes | 6 | 6 | 0 |
| c10_s3 Point | 4 | 4 | 0 |
| c10_s4 Montage | 2 | 3 | +1 |
| c10_s6 Return | 5 | 6 | +1 |
| **Mean** | **3.47** | **4.07** | **+0.60** |

By chapter: Expansion 3.7 → 4.7, the Contest 3.1 → 3.6, the Coda 3.8 → 4.4.

**Reading the trend:**
- **The global fixes landed:** exposure, bloom radius, camera pull-back, plate size and ring geometry. That's why nine frames gained a point and none lost one.
- **The narrative fixes didn't:**
  - The event colour of each beat is still missing.
  - The victor's colour is still missing from Holes and Point.
  - The chronicle is mostly silent.

  Those are what hold the Contest under 4 and the Coda under 5.
- **No frame has reached 7.**
- **Highest leverage:** the next pass should be about *what happens in each shot, in which colour*, not about grading.
