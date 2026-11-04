# Pass A review: chapters 8–10 (15 stills)

I reviewed these as a cinematographer and VFX supervisor, judging only what is on screen against the brief in `docs/DESIGN.md`. The frames are 640×360 software-rasterised renders at the lowest particle tier, so I've allowed for grain, soft detail and sparse stars, and judged composition, light, colour and legibility. **Coordinates are pixels on the 640×360 frame, origin top-left.**

Scope note: the set has no `war` beat from the Contest (co-beat2, co-beat8), no Coda saturation beat (`cd-saturate`) and no 5-second black. The Contest's most important shots, fronts colliding, were therefore not in front of me. Every Contest frame I saw is an emergence, extinction or arrival beat. Those are exactly the beats that should show *one specific thing happening in one specific colour*, and none of them does.

For the Ring-to-disk continuity I also looked at the only swarm still I have, `captures/passA/c07_s4_si-swarm.png` (from before the pass-A fixes), which centres the Sun. I didn't use it for anything else.

## Measurements behind the verdicts

Rec.709 luma of the sRGB frame. "Near-black" means luma < 0.06; the brief wants more than 60 %. "Coloured px" means pixels with value > 0.15 and saturation > 0.15. The hue column gives each hue's share of those pixels.

| Frame | near-black | max luma | clipped (>0.98) | coloured px | hue split of coloured px | median sat |
|---|---|---|---|---|---|---|
| c08_s0 disk | 59.4 % | 0.95 | 0 % | 5.3 % | cyan 40 · orange 38 · pink 11 | 0.23 |
| c08_s1 bloom | 52.7 % | 1.00 | 0.15 % | 28.4 % | **cyan 98** | 0.26 |
| c08_s2 neighbours | **99.2 %** | 0.72 | 0 % | 0.4 % | cyan 87 | 0.31 |
| c09_s1 woke | **19.9 %** | 1.00 | 0.37 % | 44.5 % | **cyan 94** | 0.25 |
| c09_s2 intrude | 52.3 % | 1.00 | 0.23 % | 7.8 % | blue 65 · cyan 21 · violet 14 | 0.18 |
| c09_s4 Choir out | **34.0 %** | 1.00 | 0.37 % | 42.0 % | **green 98** | 0.30 |
| c09_s5 new light | 64.3 % | 1.00 | 0.10 % | 23.7 % | **green 100** | 0.32 |
| c09_s6 Andromeda | 94.0 % | 1.00 | 0.01 % | 3.7 % | **green 98** | 0.28 |
| c09_s7 Lattice ends | **5.4 %** | 1.00 | **0.89 %** | 62.1 % | **green 100** | 0.25 |
| c09_s8 second mind | 74.2 % | 0.97 | 0 % | 12.1 % | **green 100** | 0.25 |
| c10_s1 candles | 99.9 % | 0.61 | 0 % | 0.0 % | (16 px of red) | — |
| c10_s2 holes | 92.2 % | 1.00 | 0 % | **0.0 %** | **none: fully achromatic** | 0.00 |
| c10_s3 point | 99.9 % | 0.79 | 0 % | **0.0 %** | **none: fully achromatic** | 0.00 |
| c10_s4 montage | 99.0 % | 0.59 | 0 % | 0.4 % | warm star tints | 0.20 |
| c10_s6 return | 26.8 % | 1.00 | 0 % | 66.6 % | orange 86 · gold 6 · green 3 | 0.87 |

Faction reference hues from the bible: Heir 194°, Lattice 44°, Choir 328°, Hexarchy 136°, Mycelium 29°, Veil 253°, Furnace 5°.

Three problems run through the whole batch:
1. **Every Contest frame is a single hue.** It's cyan in s1–s2 and mint green (about 136°, the Hexarchy) in s4–s8. No Contest frame holds two faction colours. Choir pink (328°) and Lattice gold (44°) are both named in the chronicle and are on screen in **zero** pixels. As shot, the Contest isn't a war; it's a colour grade that changes between cuts.
2. **The victor's colour disappears from the Coda.** Candles, black holes and the last point have literally zero coloured pixels. The thread that should run war → victory → last light → spark breaks for 15 seconds and only comes back as bokeh in the Return.
3. **The chronicle doesn't match the pictures.** 6 of 7 Contest frames show the wrong line, the date is stuck at "+1.04 Gyr" for five of them, and one frame has no line at all (table below).

| Frame | Beat (what the shot is for) | Line actually on screen |
|---|---|---|
| c09_s1 | Something woke in Andromeda. | "+1.04 Gyr. The Choir and the Heir found each other in / Andromeda." |
| c09_s2 | Something came out of the intergalactic dark into Andromeda. | same as s1 |
| c09_s4 | The last of the Choir went out in the heart of Andromeda. | "+1.04 Gyr. Something woke in Andromeda." |
| c09_s5 | In the Scutum–Centaurus Arm, a light that had not been there before. | "+1.04 Gyr. Something woke in Andromeda." |
| c09_s6 | Andromeda arrived. (about +4.5 Gyr) | "+1.04 Gyr. Something woke in Andromeda." |
| c09_s7 | The Lattice ended in the Sagittarius Arm. | "+6.1 Gyr. The Hexarchy struck first." |
| c09_s8 | A second mind opened its eyes in Triangulum. | *(no line)* |

The on-screen order also runs backwards: "found each other" appears before "woke".

---

## Chapter 8: Expansion

### c08_s0, Ring to disk: **5/10**
*A handsome particle galaxy, but it sits in the top-right corner, so the match cut it exists for cannot land. A cyan smear in the empty left-centre looks like a bug.*
- **What reads:** an inclined spiral (about 50°) with two clean arms around a bright bulge. The core is at x≈490, y≈105. There's a satellite at x≈400, y≈262, and the left half is deep black (59 % near-black). Of the chapter 8 frames, this is the closest to a wallpaper.
- **What doesn't read:**
  - **Match cut.** The core sits 77 % across and 29 % down. The swarm's Sun (passA c07_s4) is dead centre. Ring and disk share no position, scale or tilt, so the cut will read as a jump rather than a rhyme. The bible says "face-on"; this disk is about 50° inclined.
  - **Palette.** The core is a flat clipped white plate (x 460–520, y 90–125), not warm `#ffd9a0`. The arms are grey-white salt (bright pixels average 0.29/0.28/0.28), not blue `#8fb4ff`. There are no dust lanes (`#1a0c08`) anywhere. The disk is a uniform sprinkle of 1 px dots with no depth, and reads as a particle system rather than a galaxy.
  - **Cyan blob** (x 228–345, y 155–235): a soft-edged, roughly rectangular, desaturated cyan cloud floating in the void outside the disk. As the LMC it's the wrong shape, size and colour. As the Heir's first front it's in the wrong place, nowhere near the Sun. It reads as a misplaced sprite.
  - A dotted arc of faint magenta blobs (x 262–300, y 55–145) reads as lens ghosts.
- **Fixes:**
  1. **Lock the match cut.** The last swarm frame and the first disk frame should share the same centre (frame centre, x 320, y 180), the same ellipse (same tilt and aspect) and the same size (swarm ring diameter = inner arms/bar diameter, about 40 % of frame width). Sun becomes core, ring becomes inner arms. Hold for 6–8 frames, then dolly out to the full disk.
  2. **Remove the cyan blob, or reshape it** into a small, irregular, warm-white LMC (about 30×20 px) at its true position below-left of the disk. Don't introduce cyan before the Heir's front exists.
  3. **Grade the galaxy.** Use a gold bulge with a falloff instead of a clipped plate (full white only in the central 6–8 px), blue-white arms, and dark brown dust lanes along the inner edge of each arm. Add a few pink HII knots on the arms, and vary star size and brightness so it stops reading as salt.

### c08_s1, Bloom: **4/10**
*The galaxy is already grey-cyan from rim to rim, so the chapter's signature beat (a front spreading out from one star) happened off-screen.*
- **What reads:** a centred face-on spiral, tightly wound arms, a blown core, and a cold tint that says "something has changed".
- **What doesn't read:**
  - **There is no front.** There's no shell, edge or gradient from an origin. The tint is uniform from core to rim (98 % of coloured pixels are cyan), and the Sun / Orion Spur isn't marked.
  - **There is no hex lattice.** The outer disk (x 110–220 and x 480–600) is made of overlapping round blobs about 20 px across, which reads as cotton wool or cauliflower: the opposite of a cold hexagonal lattice.
  - **The Heir's colour is grey.** Bright pixels average (0.28, 0.33, 0.34), which is `#9fe8ff` at a third of its value and half its saturation. This should be the coldest, cleanest light in the film so far.
  - The galaxy's own palette (warm core, blue arms) is gone, so the cyan has nothing to contrast with.
  - The disk overfills the frame: it is cropped at the bottom edge and comes within 15 px of the top.
- **Fixes:**
  1. **Stage the beat mid-expansion.** Draw a thin, bright luminous shell: `#9fe8ff` at full value, 2–3 px with bloom, the brightest line in the frame. Centre it on the Sun at about 60 % of disk radius (for this framing roughly x≈470, y≈230), with a radius of about 25–35 % of the disk. Heir territory inside, the untouched gold/blue galaxy outside. One still then tells the whole story.
  2. **Draw the lattice inside the shell.** Hex cells 8–12 px across at this framing, faint cyan edges with brighter nodes at the stars, fading in behind the front. This replaces the gaussian blob splats.
  3. **Pull back about 20 %** so the whole disk sits inside the 2.2:1 band with black above and below. Replace the 40 px clipped core (x 335–385, y 160–200) with a falloff.

### c08_s2, Neighbours: **2/10** *(predates the new camera)*
*A black frame with a sliver of galaxy cut off by the bottom edge and a 12 px Andromeda. Nothing is shown being reached.*
- **What reads:** deep space; Andromeda (x≈360, y≈103, about 12×8 px, already cyan); possibly Triangulum (x≈463, y≈162, a 4 px streak).
- **What doesn't read:** 99.2 % near-black, max luma 0.72. The Milky Way is a 130×22 px sliver on the bottom edge (x 160–290, y 338–360). There are no Magellanic Clouds, and no fronts, probes or streaks cross the gap. Andromeda is already tinted, so the arrival happened between shots. The stars are all the same size and brightness. The new camera (MW large and tilted in the lower third, Andromeda small above) fixes the sliver, but not the missing beat.
- **Fixes:**
  1. **Framing (new camera):**
     - MW filling the lower third (about x 40–600, y 220–360), tilted.
     - Andromeda at least 40 px on its long axis in the upper-right third (around x≈460, y≈90), at its true elongated inclination.
     - Triangulum about 15 px, near it.
     - The Magellanic Clouds as two small irregular smudges just off the MW's rim.
  2. **Show the reaching.** Hair-thin cyan probe streaks crossing the void. The front arrives as a cyan rim on the *near* side of Andromeda and the Clouds while their far sides are still natural. Light-speed lag must be visible: farther galaxies light later.
  3. **Give the starfield a magnitude range.** Most stars 1 px at 10–30 % luma, a handful of 2–3 px bright ones, so the black has depth instead of reading as noise.

---

## Chapter 9: The Contest

### c09_s1, "Something woke in Andromeda.": **3/10**
*A face-on spiral pushed so close that grey-cyan haze fills the frame. Nothing wakes, and the caption says something else.*
- **What reads:** a big galaxy, a blinding core, and faint concentric rings at a radius of about 70–110 px (the Choir's language?).
- **What doesn't read:**
  - One colour (94 % cyan). If the Choir (`#ff5fb4`) is there, it's invisible. There's no new light and no spark of a new hue.
  - Blacks are gone: 19.9 % near-black, and only the corners are dark.
  - The core is a clipped white disc about 45 px wide (x 330–390, y 190–240).
  - The line is wrong for the beat and wraps onto a second line with an orphaned "Andromeda." It's set over bright speckled haze (x 30–450, y 290–320) and is close to illegible.
  - This galaxy is indistinguishable from the Milky Way in c08_s1: same face-on spiral, same texture. Nothing says Andromeda.
- **Fixes:**
  1. **The event is a new hue.** Put one hot point of the new faction's colour in one arm, with the first ring of its pattern language spreading out from it. Frame on that point, not on the core.
  2. **Pull back** so the galaxy takes up 50 % of the frame or less. Shoot Andromeda at its real inclination (a long ellipse, about 3:1, with its dust rings) so it can never be mistaken for home.
  3. **Chronicle:** the correct line, on one line, over dark sky. Either compose so the bottom-left 40 % × 15 % is black, or lay a soft 30 % black gradient under the text.

### c09_s2, "Something came out of the intergalactic dark into Andromeda.": **3/10**
*A good graphic diagonal ruined by violet-grey fog and a cross-hatch artifact. There's no intruder.*
- **What reads:** an inclined disk from bottom-left to top-right, the strongest shape in chapter 9, at an Andromeda-like inclination.
- **What doesn't read:**
  - Nothing enters from the dark. The top-left and right of the frame are empty.
  - A grey-lilac bloom covers about half the frame (x 100–520, y 60–360) and lifts the black to 0.10–0.20.
  - At the core (x 250–380, y 120–230) a diamond cross-hatch grid shows through the bloom. It looks like a dither or sprite-grid artifact, not an interference pattern.
  - The chronicle repeats s1's line, wrapped, with the date unchanged.
- **Fixes:**
  1. **Show the intruder.** Bring a faction colour (for example Veil violet `#a58cff` as dotted haze, or whoever entered) in as a narrow wedge or a string of probe streaks from the black top-left corner (x 0–200, y 0–150). Where it touches the upper-left limb of the disk, it should meet the local territory in a two-colour fringe.
  2. **Cut the bloom radius by about 60 %**, and clamp the halo so sky more than 40 px from the disk drops below 0.03 luma.
  3. **Remove the cross-hatch** at the core, or replace it with real two-colour fringes along an actual front.

### c09_s4, "The last of the Choir went out in the heart of Andromeda.": **3/10**
*A green fog with a blown core and a hard vertical edge. The extinction can't be seen because the Choir was never visible.*
- **What reads:** a core at x≈305, y≈160; faint ghost rings on the left (x 30–100, y 130–190) in the same green.
- **What doesn't read:**
  - Everything is mint green (98 %). Choir pink isn't anywhere on screen, so "the last of the Choir went out" can't be seen.
  - Only 34 % is near-black; haze fills x 0–450.
  - The haze ends on an almost vertical line at x≈415–465, top to bottom: at every height, column luma falls from about 0.30 to 0.05 within 60 px. It reads as a clipping plane.
  - The line is stale ("Something woke…") and set over a field of stars.
- **Fixes:**
  1. **Stage the extinction.** Leave one last small pocket of Choir pink (concentric rings, 20–40 px) near the core, surrounded by the victor's colour. It shrinks and goes dark, and where it was there is a black scar. A colour going out *is* the shot.
  2. **Fix the vertical terminator.** Give the disk a natural, irregular, curved edge, or reframe.
  3. **Get off the core.** This is the fourth frame with a blown core at the centre of interest. Put the event on a third and let the core sit out of frame or at the edge.

### c09_s5, "In the Scutum–Centaurus Arm, a light that had not been there before.": **4/10**
*A clean, centred spiral with good black margins, but the "new light" is two blurry blobs in the same green as everything else.*
- **What reads:** a face-on galaxy with black around it (64 % near-black), and two bright blobs below-left of the core (x≈240, y≈218 and x≈275, y≈235) that might be the event.
- **What doesn't read:**
  - There's no new colour (100 % green), so you can't tell which blob is the new light, or that it's new.
  - It's the same picture as c09_s1's Andromeda and c08_s1's Bloom.
  - The line ("Something woke in Andromeda.") sits over what is apparently the Milky Way, which actively misleads.
- **Fixes:**
  1. **One pinpoint of a never-seen hue on the arm** (for example Furnace `#ff4a3a` with radial spokes: 6–10 px core, 30 px pattern), the only thing of that colour in the frame. Push toward it and put it on the right third, with the galaxy off to the side.
  2. **Bring back the natural galaxy** (gold bulge, blue arms) wherever no faction holds territory, so territory reads as a *shape* against nature instead of a tint over the whole image.
  3. **Sync the chronicle.**

### c09_s6, "Andromeda arrived.": **4/10**
*The best-composed Contest frame (black, centred, a pair with a satellite), but it reads as two galaxies sitting near each other, not a collision, and the date says +1.04 Gyr.*
- **What reads:** two cores in one halo (x 230–410, y 135–215), a third bright knot below (x≈340, y≈207), and a satellite (x≈143, y≈237). 94 % near-black, with good negative space.
- **What doesn't read:**
  - No tidal tails, no bridge, no starburst.
  - The shared halo is a mottled green cloud of round splats.
  - There's only one colour: if the collision is between rivals, two colours should meet.
  - The group is only about 180 px wide (28 % of frame width).
  - The line is stale, and "+1.04 Gyr" contradicts a +4.5 Gyr event.
- **Fixes:**
  1. **Render the merger like the Antennae or the Mice:** two long curved tidal tails (150–250 px each) swinging out in opposite directions, a bridge between the cores, and starburst knots along the collision.
  2. **Show two territories colliding.** Each disk in its own faction colour, with the overlap as a band of interference fringes and nova and RKV flashes.
  3. **Push in** so the pair spans about 50 % of frame width, keeping black around it.

### c09_s7, "The Lattice ended in the Sagittarius Arm.": **2/10**
*The worst frame of the batch: green fog edge to edge, two blown cores, a moiré patch, and an illegible line about something else.*
- **What reads:** two bright cores (x≈180, y≈125 and x≈290, y≈230) and faint arms. There's a diagonal stripe patch at x 300–350, y 160–210, and a short dotted dash at x 255–275, y 155–165 that may be an RKV.
- **What doesn't read:**
  - Only 5.4 % is near-black, 0.9 % of pixels clip, and average luma across the frame is about 0.4.
  - Lattice gold (`#f2d27a`) and its cubic lattices are absent, so its end can't be seen.
  - The stripe patch reads as aliasing.
  - The line ("+6.1 Gyr. The Hexarchy struck first.") is the same brightness as the haze behind it and is effectively invisible.
- **Fixes:**
  1. **Pull back to a frame that's at least 60 % black**, with territory light bounded by the disk's stars. No volumetric fog.
  2. **Show the Lattice's last gold cubic cells being overrun, and make the strike visible.** Long thin RKV streaks (100 px or more, hot white heads, faction-coloured tails) converge on it, followed by nova flashes.
  3. **If the stripe patch is the interference shader,** it has to be two colours in fringes along a contact line, not a white moiré square.

### c09_s8, "A second mind opened its eyes in Triangulum.": **3/10**
*A dim green diagonal smear running off the right edge. The "eye" is a faint ring that reads as a lens ghost, and there's no caption at all.*
- **What reads:** an inclined galaxy (x 240–640, y 150–270), good black upper-left (74 % near-black), and a small faint ring at x 420–455, y 155–190.
- **What doesn't read:**
  - There's no chronicle line.
  - The galaxy is cut off by the right edge.
  - The ring is the same green as everything else and only about 8 % brighter than its surroundings.
  - Nothing says Triangulum, which is small, loose and fairly face-on, not a large edge-on disk.
  - "A second mind" should mean a second colour.
- **Fixes:**
  1. **Reframe:** Triangulum whole, at 35–45 % of frame width, on a third. Show the new mind as an iris-like opening in its own colour and pattern where the ring is now: the brightest saturated thing in the frame.
  2. **The chronicle line must be present.**
  3. **Keep this density.** About 75 % black is right for the chapter. Make it the rule, not the exception.

---

## Chapter 10: Coda

### c10_s1, The horizon closes: **2/10**
*Correct darkness, wrong content: a dozen single pixels and a counter. There's no Local Group and there are no candles.*
- **What reads:** that nothing is left and time is enormous. The counter "+1.1 × 10¹² years" (x 222–415, y 293–308) is beautifully set and legible.
- **What doesn't read:** max luma is 0.61. The "candles" are 1 px red dots (x≈80, y≈193; x≈285, y≈188; x≈388, y≈203). The victor-saturated Local Group island isn't in the frame. "Going out one by one like candles" needs visible flames to go out.
- **Fixes:**
  1. **Put the island in frame:** the merged galaxy at the centre, small (80–120 px), fully saturated in the victor's colour, the only colour left in the universe.
  2. **Distant galaxies as 4–12 px elliptical smudges** (20–40 of them), shifting white → orange → deep red and dimming out, staggered so every still catches a few mid-fade.
  3. **Drop the mantissa:** "+10¹² years" reads cleaner and matches "+10¹⁰⁰ years" two shots later.

### c10_s2, The last black holes: **6/10**
*The best frame in these chapters: lensed holes with real shadows and a beamed crescent. But it's monochrome, so the victor has vanished from its own ending.*
- **What reads:** four black holes with photon rings and dark shadows (x≈225, y≈165; x≈290, y≈142; a crescent at x≈318, y≈185; x≈563, y≈163), particle disks, soft Hawking blobs (x≈230, y≈113; x≈333, y≈157; x≈117, y≈280), and the smeared counter. 92 % near-black. It looks like Gargantua in miniature, and it already works as a wallpaper.
- **What doesn't read:**
  - Zero coloured pixels, although the script calls for accretion rings in the victor's colour.
  - The lensing has nothing to bend. With a pure black background, the rings read as drawn circles rather than lensed light.
  - The "huddled structures" read as debris spray, not engineering.
  - The Hawking flashes look like out-of-focus streetlights.
- **Fixes:**
  1. **Accretion rings and harvesting structures in the victor's colour**, the brightest saturated colour in the Coda, with Doppler asymmetry (one side of each ring brighter).
  2. **Give the lensing something to bend:** a faint, red-dimmed backdrop of the last stars or of the victor's own structures, visibly warped into arcs close to each hole.
  3. **Structures as thin, orderly rings or pattern fragments** (the victor's language) at the photon sphere, not random spray. Hawking flashes as brief, tiny, hard points, each with a thin expanding ring.

### c10_s3, One point remains: **4/10**
*The right idea and the right composition, but the last light is a 3 px grey dot: the same mistake as the last human light in chapter 7.*
- **What reads:** absolute black, one point at dead centre (x≈320, y≈180), and "+10¹⁰⁰ years", legible and sobering.
- **What doesn't read:** the point is achromatic, peaks at 0.79 luma and has no halo. Nothing marks it as the victor's, and it doesn't visibly rhyme with chapter 7's last human light.
- **Fixes:**
  1. **Make the point the victor's colour:** a white-hot 2–3 px core, a 12–20 px coloured halo and a slow dimming flicker. It should be the brightest pixel in the Coda.
  2. **Rhyme it with chapter 7's last light** (same screen position, same halo size), so the audience feels "this happened before, the other way round".
  3. **Leave everything else empty.**

### c10_s4, Inside it: **2/10** *(scored allowing that no montage frames were recorded)*
*Instead of black or a montage, the frame shows a live-looking starfield and a galaxy cropped by the bottom edge, after the heat death.*
- **What reads:** soft stars, and a galaxy at x 175–260, y 315–360, cut off. It reads as "we're back in the Local Group", in almost the same framing as c08_s2 Neighbours.
- **What doesn't read:** there's no sense of being *inside* the point: no iris, no aperture, no edge. Straight after "+10¹⁰⁰ years, one point", stars and a galaxy contradict the story. Even an empty montage should be black.
- **Fixes:**
  1. **An iris.** The montage plays inside a circular aperture that grows out of the point (point → disc → full frame), with a thin victor-coloured rim. That's the next circle in the bible's scale rhyme.
  2. **A fallback.** With no Recorder frames, show black inside the iris, or canonical stills, never the live galaxy scene.
  3. **Make "backward and accelerating" readable:** a short reversed motion smear between cuts, the cuts speeding up, ending on the first cell centred where the Return's sphere will be.

### c10_s6, Return: **5/10**
*The Prologue framing comes back intact and the iridescent cell is lovely, but the timeline ring slices through the cell and the spark doesn't clearly carry the victor's colour.*
- **What reads:** the vent plume, the membrane sphere (x 343–493, y 100–250), and the chimney tip (x 145–175, y 300–340), in the same layout as the Prologue's membrane shot. Green hexagonal bokeh (x 490–615, y 100–185, plus a few near the top) reads as the victor's pattern leaking into the beginning, an eerie idea.
- **What doesn't read:**
  - **The ring.** A thin white circle (r≈93 px, centre x≈320, y≈248, playhead at x≈326, y≈155) overlaps the sphere between x 343 and 413. Two circles of similar size intersect like a Venn diagram. That collision is the frame's dominant graphic, and it is accidental.
  - **The spark.** The brightest point inside the sphere is *white* (x≈417, y≈176), with a small green dot beside it (x≈400, y≈177). The victor's colour sits mainly in the membrane tint and the bokeh, not in the spark.
  - The hex bokeh means this isn't the "exact" opening frame. That's fine if intended, but it competes with the spark and reads like a lens or HUD artifact.
  - The orange plume floods about 60 % of the frame (27 % near-black).
  - The chimney tip still reads as a candle or a fingertip.
- **Fixes:**
  1. **Make the ring concentric with the cell:** centre it on the sphere (x≈418, y≈175) at about 1.6× the sphere's radius, so the timeline closes *around the first cell*. This would be the film's closing image. Otherwise move it well clear (a small ring low-centre). It must never intersect the sphere.
  2. **Spark = the victor's colour:** a saturated core of 4–6 px with a 30–40 px glow tinting the inside of the membrane. No white dot.
  3. **Decide on the hex bokeh.** Either cut it (purist: only the spark differs, as the bible says) or keep two or three, much dimmer, close to the sphere. Right now the five big green hexes on the right are the brightest coloured shapes after the cell.

---

## Ranked: the 10 highest-impact fixes for chapters 8–10

1. **Give each faction its own colour on screen, with at least two in every Contest frame (c09_s1–s8).** Each faction's territory should render in its bible colour at real saturation (≥0.4), carrying its pattern language (hex, cubic, rings, filaments…). Whatever is mapping the whole Local Group to one hue (cyan in s1–s2, mint in s4–s8) has to go. Every Contest frame should hold at least two faction colours and the natural galaxy, so territory reads as a *shape*. This is the difference between "a war" and "a tint".
2. **Chronicle sync and legibility (c09, all frames).**
   - Show the beat's own line, cut on the event.
   - The date must advance: it's frozen at +1.04 Gyr in five frames, and "Andromeda arrived" is labelled +1.04 Gyr.
   - Every beat gets a line (s8 has none).
   - Keep it to one line with no wrap (widen the measure to about 70 % of frame width).
   - Guarantee contrast with a soft dark scrim or a composition rule that keeps the bottom-left dark. In s1, s4 and s7 the line is illegible.
3. **Bring the blacks back in the Contest and un-clip the cores (c09_s1, s2, s4, s7, plus c08_s1).**
   - Bind territory light to the disk's stars instead of a full-frame haze, and cut bloom radius by about 60 %.
   - Pull the cameras back so at least 60 % of the frame is black (s7 is 5 %, s1 is 20 %, s4 is 34 %).
   - Replace the 40–60 px flat-white core plates with a gradient that reaches full white only in the central few pixels.
4. **Carry the victor's colour through the Coda (c10_s1–s6).** The island in Candles, the accretion rings and structures in Holes, the last Point, the montage iris rim, and the spark in Return should all be the victor's colour. Today Holes and Point have zero coloured pixels and the spark is white. This colour is the ending's whole argument.
5. **Stage Bloom mid-expansion (c08_s1).** A bright thin light-speed shell centred on the Sun at about 60 % of the disk radius, a cyan hex lattice inside it, and the gold/blue galaxy untouched outside. Today the beat has already finished when the shot starts.
6. **Make the Ring → disk match cut land (c08_s0, with c07_s4).** Same centre, ellipse and scale; Sun becomes core; then dolly out. Remove the stray cyan blob (x 228–345, y 155–235).
7. **Make the war visible as events (c09).**
   - RKV streaks as long hot lines (100 px or more) with coloured tails; the only candidate today is a 20 px dotted dash in s7.
   - Nicoll-Dyson beams as thin straight lines.
   - Nova flashes at the contact lines.
   - Contested fronts as *two-colour* interference fringes along an actual boundary. The current cross-hatch (s2) and stripe patch (s7) read as artifacts.
8. **Candles: show the island and the candles (c10_s1).** A saturated victor-coloured Local Group at the centre, and 20–40 small elliptical galaxies reddening and going out, staggered. Today it's 1 px red dots.
9. **Neighbours: show the reaching (c08_s2).** With the new camera, put probe streaks across the void, light the near side of Andromeda and the Clouds first, and keep Andromeda at least 40 px long. Add the Magellanic Clouds.
10. **Coda geometry:**
    - **Montage:** an iris that grows from the point, with a fallback that is never the live starfield (c10_s4).
    - **Return:** the ring concentric with the cell, or clear of it, but never intersecting (c10_s6).
    - **Point:** a victor-coloured core with a halo that rhymes with chapter 7's last light (c10_s3).

Next in line: make Andromeda look like Andromeda (long ellipse, dust rings, big bulge) and Triangulum like Triangulum, so galaxies aren't interchangeable; give the base galaxy proper colour (gold bulge, blue arms, dust lanes, HII knots); add tidal tails to the merger (c09_s6); remove the vertical terminator in c09_s4.

## Broken or obviously wrong frames

- **c09_s1, s2, s4, s5, s6, s7: wrong chronicle line.** The line on screen doesn't match the beat, and the sequence runs backwards ("found each other" before "woke"). Whether the cause is the capture harness or the player, it's what's on screen.
- **c09_s1, s2, s4, s5, s6: date frozen at "+1.04 Gyr".** c09_s6 shows "Andromeda arrived" with +1.04 Gyr, a direct contradiction of the +4.5 Gyr collision.
- **c09_s8: no chronicle line.**
- **c08_s0: cyan sprite-like blob** in empty space (x 228–345, y 155–235).
- **c08_s2: the Milky Way is a sliver cut off by the bottom edge**, and the frame is 99 % black (already superseded by the new camera, per the brief).
- **c09_s2: diamond cross-hatch at the core** (x 250–380, y 120–230). **c09_s7: stripe moiré patch** (x 300–350, y 160–210).
- **c09_s4: hard near-vertical edge to the haze** at x≈415–465, top to bottom. It reads as a clipping plane.
- **c10_s2 and c10_s3 are fully achromatic**, against the script (victor-coloured accretion rings, victor's last point).
- **c10_s4: shows a starfield and a galaxy after the heat death** instead of the montage or black.
- **c10_s6: the timeline ring intersects the protocell.** The spark reads white. The green hex bokeh breaks "bit-identical except the spark" (possibly intended, but it should be a deliberate choice).

## Repetitive compositions

- **Centred face-on spiral filling the frame, core at frame centre:** c08_s1, c09_s1, c09_s5 are almost interchangeable, and c08_s0 is the same galaxy offset. That's three to four times in about 40 seconds.
- **Push into a blown core with haze to the frame edges:** c09_s1, c09_s4, c09_s7. Same idea, same flat white plate, same lifted black.
- **Inclined disk as a diagonal across the frame:** c09_s2 (bottom-left → top-right) and c09_s8 (left → right, cut off by the right edge).
- **Black void with specks and a galaxy at the bottom edge:** c08_s2 and c10_s4 share nearly the same framing. c10_s1 is the same void without the galaxy.
- **The blown core plate itself** appears in six frames (c08_s0, c08_s1, c09_s1, c09_s4, c09_s5, c09_s7) as the brightest object and centre of interest. The Contest's beats happen in arms, at fronts and in neighbouring galaxies, but the camera keeps looking at the bulge.

**What to vary:** contact-line close-ups where two colours meet (fringes filling the frame, lit like a storm front); low grazing shots skimming the disk plane with the bulge as a horizon glow; wide two- and three-galaxy group shots with lots of black; a long lens on one star system being lifted or lasered; a top-down shot of Andromeda as a long ellipse. Each beat should have its own place, its own colour and its own scale.

## Continuity between shots

- **Dyson ring → galaxy disk (c07_s4 → c08_s0): the match cut is broken.** The swarm still I have is centred and the disk is in the top-right corner at a different tilt and scale, so the cut can only read as a jump. The swarm is gold-white and the disk white-grey; that's acceptable, but the rhyme would be stronger if the Sun's gold became a warm galactic core. The cyan blob appears before the Heir's front exists, which muddies the colour story.
- **Disk → Bloom: three things change at once.** The galaxy jumps from top-right to centre, the tilt goes from about 50° to face-on, and the whole disk turns cyan. The audience sees a cut to a different, tinted galaxy instead of growth. Keep the camera and let the front grow, or move the camera continuously.
- **Bloom → Neighbours:** the front's arrival at Andromeda is never shown. Andromeda is already cyan when we first see it.
- **Chapter 8 → chapter 9 → the hand-over nobody sees.** Heir cyan (c08) → cyan (c09_s1) → grey-lilac (s2) → **mint green everywhere** (s4–s8: Andromeda, the Milky Way's Scutum–Centaurus Arm and Triangulum alike). Between s2 and s4 the whole Local Group changes owner off-screen. The Heir, the protagonist since chapter 7, disappears without ever being seen to lose.
- **Does the Contest read as a war between distinct factions? No.** The chronicle names four factions (Heir, Choir, Hexarchy, Lattice). The screen shows two tints, never in the same frame. Pattern languages are only ghostly: faint concentric rings in s1, s4 and s8, all in the dominant colour, so they read as lens ghosts. There are no two-colour fronts, no beams and no novae, and the only possible RKV is a 20 px dash. Without the chronicle you'd describe chapter 9 as "the galaxy slowly turns green". Making it read as a war needs at least two saturated faction colours per frame, a visible contact line between them, and weapons that cross that line.
- **Galaxy identity:** Andromeda (c09_s1) and the Milky Way (c09_s5, c08_s1) are rendered as the same face-on spiral with the same texture. Since the chronicle names places ("in Andromeda", "in the Scutum–Centaurus Arm", "in Triangulum"), the pictures have to tell them apart.
- **Contest → Coda: the victor's colour disappears.** Candles, Holes and Point are achromatic. The victor's green comes back only as bokeh in the Return. The intended thread (the colour that won is the last colour in the universe and then the first spark of the next one) is broken for the whole Coda.
- **Point → montage:** there's no iris, and the montage frame looks like chapter 8's Neighbours. Point → circle → protocell is meant to be the last link in the scale rhyme; it's missing.
- **Return ↔ Prologue:** the layout matches the Prologue's membrane shot (sphere right of centre, plume, chimney tip lower-left), which is good. The ring and the hex bokeh are the only foreign elements, and the ring collides with the sphere.
- **Chronicle dates across the chapter:** +1.04 → +1.04 → +1.04 → +1.04 → +1.04 → +6.1 → (none). The passing of billions of years, the chapter's sense of scale, doesn't show in the one place it's written.
