# Pass A review — chapters 0–7 (24 stills)

Reviewer stance: cinematographer / VFX supervisor, judging only what is on screen against the brief in `docs/DESIGN.md`. Frames are 960×540 software-rasterised renders, so I've allowed for grain and soft detail and judged the art direction. Coordinates are in pixels on the 960×540 frame, origin top-left.

## Measurements behind the verdicts

Rec.709 luma of the sRGB-encoded frame. "Near-black" means luma < 0.06. The brief says most frames should be more than 60 % near-black.

| Frame | near-black | luma < 0.12 | max luma | mean saturation | note |
|---|---|---|---|---|---|
| c00_s0 ember | 99.9 % | 100 % | 0.54 | 0.001 | ember never gets brighter than mid-grey |
| c00_s1 chimneys | 95.3 % | 98.1 % | 0.83 | 0.023 | |
| c00_s2 membrane | 57.6 % | 70.7 % | 0.87 | 0.130 | orange haze lifts the blacks |
| c01_s1 mat | 76.4 % | 85.5 % | 0.56 | 0.034 | |
| c01_s2 GOE | 75.8 % | 77.1 % | 0.77 | **0.014** | nearly monochrome for a "colour change" shot |
| c01_s3 snowball | 91.8 % | 95.8 % | 0.70 | 0.005 | |
| c02_s0 endo | 49.0 % | 76.0 % | 0.85 | 0.059 | |
| c02_s1 colonies | 69.5 % | 79.5 % | 0.79 | 0.040 | |
| c02_s4 cambrian | **30.5 %** | 68.4 % | 0.83 | 0.082 | milky teal fog |
| c03_s1 living land | **42.8 %** | 87.2 % | 0.66 | 0.062 | mud: everything sits at 0.06–0.12 |
| c03_s3 drift | 75.8 % | 76.6 % | 0.77 | 0.018 | |
| c03_s4 chicxulub | 72.6 % | 74.3 % | 0.89 | 0.031 | the impact flash is not white |
| c04_s1 fire | 65.0 % | 77.5 % | 0.92 | 0.082 | |
| c04_s2 out of Africa | 63.1 % | 81.3 % | 0.79 | 0.046 | |
| c04_s3 hands | **21.9 %** | 40.3 % | **0.47** | 0.260 | flat orange wash, no highlights at all |
| c05_s2 empires | 70.0 % | 93.1 % | 0.91 | 0.050 | |
| c05_s3 threads | 70.3 % | 88.5 % | 0.89 | 0.024 | |
| c05_s4 plague | 63.1 % | 86.9 % | 0.90 | 0.031 | |
| c06_s1 ignition | 75.6 % | 82.8 % | 0.85 | 0.026 | |
| c06_s3 mote | 57.9 % | 60.3 % | 0.75 | 0.033 | the "single bright point" is dimmer than the clouds |
| c06_s4 mesh | 71.6 % | 84.2 % | 0.86 | 0.025 | |
| c07_s1 pattern | 63.9 % | 78.9 % | 0.92 | 0.021 | |
| c07_s3 last light | 77.6 % | 88.8 % | 0.79 | 0.018 | |
| c07_s4 swarm | 48.6 % | 63.5 % | 0.90 | 0.036 | the Sun is no brighter than its swarm |

Two problems show up across the whole batch:
1. **There is a highlight ceiling.** No pixel in any of the 24 frames gets above 0.92, and no pixel clips. The spark, the first flame, the impact, the mote, the Sun and the last light all top out at the same dull grey-white as a cloud. "Light is earned," but when it is earned it never pays off.
2. **Colour is thin.** Mean saturation is 0.014–0.036 on nearly every globe frame. The brief's haze orange, emerald, imperial red, sodium orange and fibre cyan barely reach the screen. Most planet shots read as tinted greyscale.

---

## Chapter 0 — Prologue

### c00_s0 — Black to ember — **6/10**
*The right restraint, but the ember sits in the wrong place and is too weak to be the film's first image.*
- **Reads:** true black and a single warm point. It does feel like an overture. Of the 24, this is the frame closest to 2001.
- **Doesn't read:** the ember sits at x≈378, y≈255 (39 % across, 47 % down). That is left of centre at mid-height, not "centre-low" as the brief says, and nothing in the frame justifies the offset. The chimney throat around it, the two horn-like silhouettes at x≈305–420, y≈260–340, only appear when you push the levels; at normal exposure there is no form at all. There is no visible heat shimmer. The peak luma is 0.54, so the ember is a dull orange smear rather than a white-hot core.
- **Fixes:**
  1. Put the ember at frame centre, x≈480, y≈330–350. That sets up the push-in and the later sphere at the same screen position.
  2. Give it a white-hot core (luma ≥ 0.95) inside an ember-orange halo about 20 px across, plus a faint umber spill (`#2a1408`) that just catches the lips of the chimney throat. One rim edge would turn "a dot" into "a vent".
  3. Make the shimmer visible by refracting something: a faint particulate field or the plume above the throat (x 440–520, y 120–300) warping slowly. Pure black gives the shimmer nothing to distort.

### c00_s1 — The chimneys — **4/10**
*Reads as a hand of candles, not a hydrothermal field.*
- **Reads:** dark, warm, something glowing and venting.
- **Doesn't read:** the three spires at x 270–470, y 280–540 have rounded caps, even widths and glowing tips, so they read as **fingers or lit candles**. When you lift the levels it looks like a hand reaching up, with fingernail highlights. The plume above the centre spire (x 330–450, y 60–280) is a smooth, evenly lit orange cone, so it reads as a flashlight beam or volumetric spotlight, not "black smoke rolling upward". There is no white carbonate frost, no sulfide crust texture and no readable particulate bokeh. The weight sits hard left: the right half (x > 480) is empty apart from a stray glint at x≈710, y≈430 that looks like a mistake.
- **Fixes:**
  1. Break the silhouettes. Chimneys should be jagged and flanged, with beehive ledges and irregular widths, tapering unevenly and leaning. Add crusty normal detail and patches of pale carbonate (`#d8d2c4`) catching the rim light. No round caps.
  2. Make the plume dark: black smoke lit from below, with the ember light only in its first 30–50 px and roiling turbulence above. Right now the plume is the brightest large shape in the frame, which is backwards.
  3. Rebalance. Put a fourth, larger out-of-focus chimney in the right foreground (x 700–900) as a dark silhouette with a thin rim, and spread the particulates in depth so the right half carries volume. Either remove the stray glint at x≈710, y≈430 or make it a deliberate distant vent.

### c00_s2 — The membrane closes — **5/10**
*The thin-film bubble is the prettiest object in the chapter, but the frame around it is milky and it sits in the wrong place for the match-cut.*
- **Reads:** an iridescent sphere with a tiny bright fleck inside. Thin-film colour works. The hollow-ring bokeh is pleasant.
- **Doesn't read:** it reads as **a soap bubble drifting past**, not a membrane closing around chemistry. There is no unclosed seam, curl or lip in the still, and the spark (x≈633, y≈268, about 2 px) is not flaring. The background is a large, low-contrast orange-brown fog filling x 300–760. This is the most lifted black in chapter 0 (only 57.6 % near-black), and it kills the sacred dark. A chimney tip at x≈350, y≈450–540 again reads as a fingertip. The sphere sits right of centre (x≈633), so it cannot match-cut cleanly to a centred Earth.
- **Fixes:**
  1. Centre the sphere at x≈480, y≈270 and size it to the Earth's opening radius in the next shot.
  2. Crush the fog to near-black. Keep one soft warm gradient behind the sphere's lower edge as a backlight rim, so the sphere sits on darkness rather than on a beige wall.
  3. Make the spark the event: a white core (or the victor's colour) with a bloom of 30–60 px that lights the inside of the membrane, so the iridescence brightens from within. Give the membrane bilayer thickness (a faint double rim) so it reads as a cell wall rather than soap film.

---

## Chapter 1 — Microbial Earth

### c01_s1 — The mat — **4/10**
*Looks like an infographic of bubbles, not life under a microscope.*
- **Reads:** two populations (teal on the right, amber on the left and centre) in soft clouds. "Competing metabolisms" is half there.
- **Doesn't read:** the cells are hollow outline rings of uniform stroke, and the rods (top centre x 385–515, y 8–40; left x 140–200, y 0–115; bottom x 305–370, y 405–540) are outline capsules with ladder-rung interiors. Both read as vector UI or CAD wireframes, not organisms. Nothing is dividing (no pinched dumbbells) and there is no depth: one focal plane, no foreground or background blur. No light source suggests darkfield or brightfield. The rust bands from the brief are absent. Rods are cut by the top edge at x 385–515 and x 540–650, which looks like cropping debris.
- **Fixes:**
  1. Give the cells volume and a darkfield look: a bright fresnel rim, a translucent interior with a faint nucleoid, and slight chromatic fringing. Drop the uniform outline stroke. Fill the rods with a soft gradient and septation, not ladder rungs.
  2. Add depth of field. Put two or three huge, very soft out-of-focus cells in the foreground (one corner each) and a hazy back plane, so the hero plane is a band through the middle.
  3. Show division and give the frame a hero. Have one bloom at a third (around x 640, y 200) with a few visibly mid-division cells and the densest glow, letting the rest fall into dark. Today the density is even edge to edge.

### c01_s2 — The Great Oxidation (orbital time-lapse) — **4/10**
*A competent grey planet, but the shot's whole point (orange haze to blue limb, rust-red seas) is not on screen.*
- **Reads:** a planet with a soft terminator, a nice cyclone swirl at x 490–600, y 190–260, and clouds.
- **Doesn't read:** there is **no orange haze anywhere** and no blue limb; the limb is a thin beige-pink line. No shallow sea flashes rust-red, apart from a couple of red specks on the night side at x≈678, y≈328. The ocean is flat slate teal and the land at x 430–620, y 290–420 is a flat mauve-grey slab with no relief. The sun glint is a blurry white disc at x≈438, y≈208 that reads as a smudge on the lens. Saturation is 0.014, practically monochrome. The night side has no rim at all; the planet just dissolves into space on the right.
- **Fixes:**
  1. Put the transition in every frame of the shot. Haze should linger as an orange veil over one side (say the left limb, x 350–450) while the opposite limb clears to a crisp Rayleigh-blue band 4–8 px thick. A still then shows before and after at once.
  2. Tint the shallow shelves rust (`#8a3b1a`) with banding along the coastlines, and give the land relief and albedo variation.
  3. Replace the glint blob with a tight, elongated specular highlight that follows the sphere's curvature, and add a faint backlit atmosphere rim on the night limb so the disc keeps its silhouette.

### c01_s3 — Snowball — **3/10**
*Reads as the Moon.*
- **Reads:** a lit crescent on a dark sphere.
- **Doesn't read:** the lit crescent (x 210–480, y 90–390) is dirty cream, not cold ice (`#eef6ff`). About 70 % of the disc is night side, and that night side is lifted to dark grey with visible darker blotches at x 330–540, y 160–410. The blotches read exactly like lunar maria. There is no atmosphere rim, no specular sheen and no ice-front structure. "White pearl" needs a mostly lit disc; this is a crescent.
- **Fixes:**
  1. Light the disc from behind the camera (about 70 % lit gibbous) so the pearl reads. Make the ice blue-white with a soft specular sheen and faint blue subsurface in the cracks and pressure ridges.
  2. Crush the night side to black and remove the maria-like blotches. Add a thin cold-blue atmosphere limb so it is unmistakably a planet with air, not a moon.
  3. Show the process: a dark equatorial band of open ocean narrowing as ice fronts advance from both poles, or crack lines glowing slightly darker blue for the thaw.

---

## Chapter 2 — The Many-Celled

### c02_s0 — Endosymbiosis — **4/10**
*A textbook diagram (cell, nucleus, mitochondrion) behind a screensaver of bokeh.*
- **Reads:** a big host cell containing a blue body and a glowing yellow captive. The palette (mauve, pearl, gold) is on brief.
- **Doesn't read:** the captive (x 435–600, y 165–345) is a set of concentric ellipses with noise fill and aliased edges, so it reads as a **fried egg or a seed, not cristae**. There are no folded inner membranes and no flowing engulfment. Foreground bokeh discs, about 60 of them all roughly the same size, sit across the whole host, and their uniform size and density look like a "bubbles" wallpaper. The host (cut by the top, left and bottom edges, rim at x≈720) is a flat disc with a felt-like noise texture and no translucency. The blue "nucleus" at x 170–400, y 225–450 is the largest shape and competes with the hero.
- **Fixes:**
  1. Build real cristae: sinuous internal lamellae folding across the captive's interior, with the glow emitted from the folds so light comes out of the structure. Smooth or supersample its edge.
  2. Cut about 70 % of the bokeh. Keep three or four very large, very soft discs at the frame edges (corners, foreground) for depth, and none over the hero.
  3. Push in and reframe. The captive should fill about a third of the frame at a third line, with the host membrane as a translucent, fresnel-rimmed arc sweeping across the frame. Defocus and dim the nucleus so it is a soft blue presence, not a co-star.

### c02_s1 — Colonies — **2/10**
*This is the mat shot again; there are no colonies.*
- **Reads:** teal and amber microbial clouds with rods, near-identical to c01_s1.
- **Doesn't read:** there are no Volvox-like spheres and nothing is assembling. The rods are now larger (x 165–320, y 0–170; x 475–620, y 190–230; x 685–850, y 285–380) and read even more like segmented glow-sticks or ladders. Cut against c01_s1 and the audience will think the film looped.
- **Fixes:**
  1. Build the beat: hollow translucent spheres made of hundreds of small green cells on a gel shell, with darker daughter colonies inside, slowly rotating. Show several at different depths, with one hero assembling from free cells being pulled into the shell.
  2. Change the environment so it is visibly a different scale and moment from the mat. Use clear, dark water with darkfield lighting and drop the blotchy biomass clouds.
  3. Remove or re-design the ladder-rods. If bacteria must appear, make them small soft capsules in the background.

### c02_s4 — The Cambrian seafloor — **3/10**
*Neon glow-sticks and floating autumn leaves over a flat table, not a seafloor.*
- **Reads:** dark water, bioluminescent cyan and magenta things, particulates.
- **Doesn't read:** the "creatures" are motion-blurred light streaks with no bodies, and several have hard polygonal cut edges (for example x 620–760, y 380–430). The grey wireframe **leaf sprites** (x 520–590, y 295–490; x 245–300, y 180–300; x 720–770, y 180–280 and others) look like tree leaves drawn in vector line, flat billboards that are botanically and geologically wrong. The floor is a flat dark teal plane ending at a ruler-straight horizon at y≈118, with no fog falloff. There are no caustics on the sand. The god rays are thin vertical lines confined to the top band (y 0–120) and read as rain or a barcode. This is the least-black frame of the batch apart from Handprints (30.5 % near-black).
- **Fixes:**
  1. **Caustics on rippled sand** (`#ffd98a`). Give the floor ripple relief and an animated caustic network bright enough to read. That one element turns "dark plane" into "seabed". Add exponential depth fog so the floor dissolves into blue-black, with no hard horizon line.
  2. Replace the leaves with rooted, 3D Cambrian life: sponge cups, anemone tubes, Ediacaran-style fronds anchored at the base and swaying. Give 6–10 hero creatures readable bodies (segments, paired appendages, bioluminescent spot rows) spread through depth, with short comet trails instead of full-length streaks. Fix the hard clipped edges on the glows.
  3. God rays as two or three wide, soft, slightly diagonal shafts falling from the top-left onto the floor and stopping there with a pool of light. Kill the vertical line texture.

---

## Chapter 3 — The Animal Kingdom

### c03_s1 — The living land — **3/10**
*Murky green velvet sprinkled with scratches; no herds, no hunters, no light.*
- **Reads:** a hilly terrain seen from low altitude with many small agents.
- **Doesn't read:** the agents are short white dashes in random orientations (rain, film scratches or sparks), each sitting on a soft pale disc that looks like a smudge on the lens. Herbivores and predators are not distinguishable as warm and red at a glance; the red dots are dim. Nothing flocks and no wave of population is visible. The terrain has no key light, no sky and no horizon; the top band (y 0–60) is brown murk. 87 % of the frame sits in the 0.06–0.12 mud band, so nothing is black and nothing is bright.
- **Fixes:**
  1. Light the land with one low raking source, golden hour or moonlight, from frame left, so the ridges get bright faces and black shadows. Add a sky gradient and a horizon line at about y 90 for scale.
  2. Make agents behave as herds and packs: dense, coherent groups whose trails align with their direction of travel (fading tails of 15–30 px). Herbivores in a clear warm gold, predators in hot red, both brighter (luma ≥ 0.6 at the core). Remove the pale disc splats.
  3. Give the vegetation texture: tree clusters or stippled forest canopy, so it reads as land with plants rather than crumpled cloth.

### c03_s3 — Drift — **5/10**
*Handsome generic exoplanet; neither "drift" nor "Earth" reads in the still.*
- **Reads:** a planet on black, clean terminator, a nice thin blue limb on the right (x 760–800), clouds. It works as a wallpaper.
- **Doesn't read:** the land is pale beige, close to Arrakis, not emerald with ochre deserts. Nothing tells you continents are moving: no rift seams, no recognisable jigsaw fit. The ocean is flat mid-blue with no specular, and the clouds are flat white patches with no shadows. The composition (planet right of centre, terminator through the left third) repeats c01_s2 almost exactly.
- **Fixes:**
  1. Colour by era: emerald forests (`#2f8f4e`), ochre interiors, deep navy ocean with a sharp sun glint, and cloud shadows offset on the surface.
  2. Make the motion legible in a still. Glowing thin rift lines along the opening Atlantic and the India–Africa split (volcanic red at very low intensity), or faint motion-ghost outlines of the plates' previous positions.
  3. Choose the camera so Africa and South America separating sit in the centre of the lit disc; that fit is the most recognisable image of drift there is. Keep the limb, which is the best atmosphere in the batch.

### c03_s4 — Chicxulub — **5/10**
*The scale is right and it is the most dramatic planet in the batch, but the ejecta curtain reads as a beige sand donut and the impact flash as a soft lamp.*
- **Reads:** something enormous has happened. A hemisphere-wide ring surrounds a night side scattered with fires. The day side on the right (x 700–910) has atmosphere and clouds.
- **Doesn't read:** the curtain (crescent band x 230–750) is flat beige with a gritty dotted texture, not incandescent white-orange (`#fff1d0`). It has no hot leading edge, no soot behind it and no volume or shadow. The impact flash at x≈310, y≈350 is a soft Gaussian disc with no hard core, and it does not look concentric with the ring, so cause and effect come apart. The ballistic ejecta (orange flecks) are mostly blobs, not streaks with direction.
- **Fixes:**
  1. Grade the curtain as a temperature gradient: a white-hot leading lip, then orange, then dull red, then black soot trailing inward. Make it thick and volumetric, casting a shadow onto the day side where it crosses the terminator.
  2. Give the impact point a hard core (luma 1.0, about 6 px) inside a bloom of about 80 px, and put it where the ring geometry visibly radiates from. A faint concentric shockwave ring on the surface helps.
  3. Draw ejecta as streaks radiating from the impact, 10–40 px incandescent trails on ballistic arcs, igniting points where they land. Today the flecks are uniformly scattered dots.

---

## Chapter 4 — Hominins

### c04_s1 — The first flame — **4/10**
*A cartoon campsite: dough-ball rocks, a neat log star and a pine treeline. Not the sacred first flame of Homo erectus.*
- **Reads:** fire at night, sparks rising into stars. The rising embers (x 420–640, y 0–200) are the best element in the shot.
- **Doesn't read:** the brief asks for near-total darkness and a fire that catches. This is a finished campfire in a symmetrical ring of smooth, evenly sized rocks (x 160–780, y 395–540) that look like bread rolls, with a perfect six-spoke star of logs. **The lighting is wrong**: the front rocks' camera-facing sides are lit tan even though the fire is behind them. They should be near-black silhouettes with a hot rim on top. The logs don't glow or char where the flame should be, and the flame floats above the crossing rather than licking up from it. The treeline silhouette (y 225–260) reads as a European conifer forest, not savanna. The blue horizon band (y 195–245) is a hard horizontal stripe.
- **Fixes:**
  1. Fix the light direction. Rocks between camera and fire become silhouettes with orange rim light; only the rocks across the ring, facing the camera, take the full firelight. Add light spill on the ground falling off by inverse square to black within about 200 px.
  2. Simplify toward the brief: a few irregular branches and kindling on bare earth, no masonry ring or radial log star. Let darkness fill at least 70 % of the frame. If a ring stays, make the stones jagged, uneven and partly buried.
  3. Flame: a near-white core where it meets the fuel (luma 1.0), licking tongues with flicker shapes, glowing embers in the wood. Replace the conifers with a low, sparse acacia skyline and soften the horizon band to a gentle gradient.

### c04_s2 — Out of Africa — **2/10**
*Blocky beige patches under TV-static glitter. There is no flow and no Africa, and there is a visible rectangular artifact.*
- **Reads:** a globe, an ice cap, some lit regions.
- **Doesn't read:** the dispersal shows as blocky, flat-filled pale-yellow regions (x 230–760, y 260–520) under an even glitter of gold specks over all land, occupied or not. **A rectangular bar artifact** sits at x≈600–680, y≈160–300 (confirmed at 2×: an elongated rectangular tile with hard sides). Nothing suggests "rivers pouring out", there is no direction, and Africa is not identifiable. The cooler Neanderthal amber guttering out in Europe is not distinguishable. The globe is cropped top and bottom, and the land sits at dim olive-grey instead of night-black. The ice cap (x 260–650, y 0–130) is the largest bright shape.
- **Fixes:**
  1. Render the dispersal as flow: tapered streams of warm particles advected along coastlines and corridors (Nile, Levant, south Asian coast, Beringia) with bright fronts and fading tails, so direction reads in a single frame. Remove the uniform glitter.
  2. Fix the rectangular artifact and the blocky region edges. If they come from a hex or LOD tile pass, soften them or splat per band.
  3. Frame the whole globe with Africa at the lower-left third and the Eurasia-to-Australia sweep across the disc. Night-side ground at near-black, so the human light is the only light. Give Neanderthals a visibly cooler, paler amber in Europe that is being overtaken.

### c04_s3 — Handprints — **3/10**
*Chalk outlines of cartoon hands on a flat orange wall. Wrong technique, no firelight, no blacks.*
- **Reads:** hands on a cave wall.
- **Doesn't read:** the hands are drawn as red outlines with light interiors, uniform in size and with clip-art proportions. Several outlines run on into long wrist and sleeve shapes (for example x 205–300, y 135–360, and x 545–640, y 290–520), so they read as gloves or mittens. Real negative stencils are bare rock surrounded by a sprayed pigment cloud, densest at the hand edge and fading outward. The wall is lit evenly orange (21.9 % near-black, max luma 0.47) with no flickering key light and no relief. Fine vertical streaks across the whole frame read as rain or film scratches.
- **Fixes:**
  1. True negative stencils: a crisp bare-rock hand silhouette inside a soft red ochre spray halo (`#a8402a`) that fades out over 20–40 px. Vary size (include a child's hand), spread, overlap, completeness and age (some faded to ghosts). The hero stencil gets the most light.
  2. Raking firelight from low-left: a warm pool around the hero hands at x 250–450, y 280–480, falling to black at the top and right. A normal-mapped rock surface with bumps catching light, and pigment following the contour.
  3. Remove the vertical streaks. If they are meant as flowstone, make a few organic calcite drapes in one region, not a full-screen texture.

---

## Chapter 5 — Ancient Civilizations

### c05_s2 — Empires breathe — **3/10**
*A brown bruise and a constellation diagram. No Mediterranean and no Rome.*
- **Reads:** a dark globe with city lights linked by thin lines, and a reddish cloud.
- **Doesn't read:** the "empire" is a muddy brown smoke cloud (x 150–580, y 120–480) with no frontier. It is not imperial red (`#9e2b25`) and it can't be seen to swell, fray or split. The Mediterranean is not recognisable: land and sea are the same dark grey-brown. The thin white lines between city points look like a star chart (the shape at x 280–370, y 330–430 even reads as a constellation). The composition (polar ice at top, cropped globe, limb on the left) is shared by four other frames.
- **Fixes:**
  1. Draw an empire as a territory: an even imperial-red tint with a crisp, slightly glowing frontier line. Show it fraying as the border breaks into fragments, with the East shifting hue (Byzantine purple-red) and the West dimming.
  2. Make the coast read: sea darker than land, plus a faint coastline line or a subtle land-albedo lift, framed tight enough that the Mediterranean's silhouette (Italy, the Aegean, the Levant, North Africa) fills the middle of the frame.
  3. Hold the trade lines back for "Threads", or reduce them to very faint arcs, so the shot is about territory, not network.

### c05_s3 — Threads — **3/10**
*One pale horizontal line bisecting a murky globe. The threads don't glow and the caravans don't move.*
- **Reads:** a route across Asia with nodes, and a north-south line at each side.
- **Doesn't read:** the main thread (x 210–730, y 335–370) is a 1 px pale line, barely gold, cutting the frame in half horizontally. The beads are a few static dots. The Indian Ocean monsoon routes are not visible. The ground is lit murky olive and grey-violet (polity tints at x 210–300, y 210–300 etc. read as stains), so the threads have nothing dark to glow against.
- **Fixes:**
  1. Real glowing threads: a hot gold core (`#d4a546`) with a wide soft bloom, and bright beads with comet tails travelling along them. Lift the arcs slightly off the surface so they catch light at the limb.
  2. Night-side black ground (see global fix 1), so gold is the only colour.
  3. Compose around curves, not a horizontal bisector. Frame from the south-east so the sea routes arc across the Indian Ocean and the Silk Road curves toward the limb, giving sweeping diagonals.

### c05_s4 — The plague — **2/10**
*Shares the composition, network and lights of "Empires". No tide, nothing goes out.*
- **Reads:** the same dark globe, ice cap and constellation net as c05_s2.
- **Doesn't read:** there is no dark tide, no extinguished lights and no sense of anything moving along the threads. Without the shot label this frame and c05_s2 are interchangeable.
- **Fixes:**
  1. Show the plague as negative space advancing on the network. Threads and beads ahead of the front glow gold; behind it they die to cold ash-grey, the city lights shrink to dull red embers and then go out. Give the front a visible leading edge, a thin sickly desaturated band.
  2. Change the camera: tighter on Europe and the Black Sea, or a low oblique along the routes, so the shot is not a re-use of c05_s2.
  3. Show some cities flickering back faintly at the tail of the tide ("slowly return"), so the still holds before, during and after.

---

## Chapter 6 — The Modern World

### c06_s1 — Ignition — **3/10**
*Hex-mosaic cauliflowers of pale light under a giant grey ice cap.*
- **Reads:** two clusters of light on a night globe (eastern North America at x 130–170, y 230–300, and Europe at x 430–590, y 310–420) plus shipping lines.
- **Doesn't read:** the city light is blocky hex and pixel mosaic (confirmed at 3×: checkerboard cells with hard edges), the colour is cream-white instead of sodium orange (`#ffae42`), and there is none of the fine dendritic structure that makes real night lights beautiful. The ice cap (x 240–670, y 0–280) is the largest and brightest shape and steals the frame. No haze is visible over industrial regions.
- **Fixes:**
  1. Draw city lights as clusters of point sprites at real city positions, size and brightness on a log scale with population, with sodium cores, a faint road filigree between neighbours, and a tight bloom. No hex fill.
  2. Grade the night: ice moonlit at about 15 % of its current brightness with a slight cool blue, and land near-black. Lights should be the brightest thing on the disc by a factor of 5 or more.
  3. Add a low brown haze glow (`#5a4a3a`) around the industrial clusters, as soft halos that grow as the lights do.

### c06_s3 — The mote — **3/10**
*A daylit, unrecognisable planet with a white smear on the coast. The mote isn't there.*
- **Reads:** a nice composition idea (horizon arc across the lower-left, black space upper-right) and a decent blue limb.
- **Doesn't read:** there is **no bright point rising off the limb**. The only candidate is a white crescent smear on the ocean at x≈590–615, y≈375–415, which reads as glare or a bleach stain. This is 1969, yet the geography is procedural blobs that are not Earth; the iconic look of this era is the Blue Marble. Smeared night-light blotches at x 0–280, y 340–540 look like dirt on the lens. The land is flat beige and teal, and the coastlines are pixel-stepped near the right limb.
- **Fixes:**
  1. Put the mote off the limb against black: a crisp white point (luma 1.0) with a short exhaust streak and a hair of bloom, at about x 700, y 150, in the negative space this composition already offers. A faint arc from the surface to the point sells "rose and left".
  2. Show recognisable Earth: Florida and the Atlantic under the launch, real coastlines, ocean with a sun glint, green and brown land, white cloud with shadows.
  3. Remove the night-light smears at the lower-left, or render them as fine points along a clean terminator.

### c06_s4 — The mesh — **3/10**
*The fibre mesh is barely there; the lights carry vertical smear artifacts.*
- **Reads:** a night globe with bright light clusters and faint great-circle lines.
- **Doesn't read:** the fibre arcs are 1 px grey lines with no cyan (`#7ff5ff`), no pulses and no bloom. They are the least visible element in a shot named after them. The light clusters show **vertical streak artifacts** (x 380–470, y 165–260: stretched bars, confirmed at 2.5×) and the same hex mosaic as c06_s1. The ice cap dominates the top third again.
- **Fixes:**
  1. Make the mesh the hero: cyan arcs lifted above the surface, bright travelling packets with short tails, additive bloom, and dense arcs bridging oceans. Near the limb they should arch visibly off the planet into black.
  2. Fix the vertical streaking (it looks like projection or sampling stretch at high latitude) and replace the hex fill with point clusters as in c06_s1.
  3. Dim the ice cap and frame lower, centred on the Atlantic or Pacific crossings, so arcs sweep across the disc.

---

## Chapter 7 — The Singularity

### c07_s1 — The pattern — **6/10**
*The strongest graphic idea in the batch, a cold geodesic skin, but the warm side of the war is missing.*
- **Reads:** an alien, coherent, crystalline order has covered the world. The Voronoi cells with glowing seams and bright seed nodes (x≈655, y≈197; x≈607, y≈368; x≈693, y≈356; x≈168, y≈382) are striking. The dark unconquered channel down the centre (x 260–440, full height) splits the frame boldly.
- **Doesn't read:** "overtaking warm chaotic flicker". There is almost **no warm human light**; the channel is dead grey-black, with only a hint of amber at the right limb (x 820–860, y 300–400). The lattice is neutral grey-white rather than ice (`#bfe9ff`) or violet-white (`#d9d4ff`). The brightest edges are the static cell seams, not the advancing front, so the eye doesn't find where the crawl is happening.
- **Fixes:**
  1. Fill the dark channel with warm, dense, irregular, flickering amber city light (`#ffb066`) right up to the lattice front, so the frame is warm chaos against cold order. The front edge should show resistance flares.
  2. Make the advancing front the brightest line, with the sub-grid fading in behind it, and add synchronised pulse rings expanding from each seed. Implied motion in a still.
  3. Tint the lattice ice blue and violet-white and give the line widths a hierarchy (seams > lattice > fine sub-grid), so it reads as crystal rather than wireframe debug.

### c07_s3 — The last light — **5/10**
*Correct idea and placement, but the point is 3 px with no halo and loses to a chain-link fence.*
- **Reads:** a lattice-covered surface under a curved horizon, and a single warm point at frame centre (x≈480, y≈327) in a cleared pocket of darkness, which is a good touch.
- **Doesn't read:** the point is a 3×3 px dot with no bloom (confirmed at 4×). At normal viewing size it can be missed entirely. The lattice (uniform, evenly bright triangles) looks like a chain-link fence or a wireframe sphere, and it is the brightest thing in the frame. The horizon at the top has no atmospheric glow, so there is no beauty or scale.
- **Fixes:**
  1. Give the last light a warm halo of 15–30 px (`#ffb066`), a few faint satellite pixels (a village, not a pixel) and a slight flicker. It must be the brightest and only warm thing in the frame.
  2. Dim the lattice toward the point (a radial falloff over about 300 px) and add a tilt-shift depth of field so distant lattice blurs. The eye should fall to the centre.
  3. Add a thin cold atmospheric limb along the horizon arc at the top (y 0–60) and let the lattice fade into it. Vary line weights so it reads as crystal.

### c07_s4 — The swarm — **4/10**
*Reads as an eye or a galaxy, not a Dyson swarm around the Sun. The Sun is a flat grey plate.*
- **Reads:** a bright central disc surrounded by a huge particle cloud with spiral-ish streams. Accidentally, it already resembles a galaxy, which helps the next match-cut.
- **Doesn't read:** the Sun (x 335–485, y 180–330) is a flat off-white disc with speckle, no limb darkening, no granulation and no corona (confirmed at 2.5×). At luma 0.88 it is no brighter than the swarm. The swarm is 1–2 px grey squares, not glinting mirrors, and its oval cloud plus spokes reads like an **eye with lashes**. Rows of dark specks crossing the disc look like a dotted line drawn on top. A brown-red haze under the Sun (x 200–700, y 330–540) reads as dirt. There is no visible Mercury or unravelling stream.
- **Fixes:**
  1. Expose for the Sun: a limb-darkened, granulated gold-white photosphere (`#fff3c4`) at full white in the centre, with a soft corona bloom. It must be the brightest object in the film so far.
  2. Shape the swarm into a crisp, thin, tilted ring of specular glints, gold and white, twinkling, against near-black. Let the front arc cross in front of the disc as a dark sparkling band and the back arc pass behind it. Saturn-like legibility sets up the galaxy-disk match cut. Remove the brown haze.
  3. Show Mercury: a small grey disc off to one side (for example x 760, y 380) trailing a spiralling stream of fragments into the ring.

---

## Ranked: the 12 highest-impact fixes across the batch

1. **Night-side globe grade (affects c04_s2, c05_s2, c05_s3, c05_s4, c06_s1, c06_s4, c07_s1).** Crush the unlit surface to near-black (luma < 0.02), dim moonlit ice to about 15 % with a cool tint, and keep only a whisper of land/sea separation (darker sea, faint coastline) so geography reads. Today the lights compete with lifted olive-grey terrain and a big grey ice cap that is the brightest large shape in six frames.
2. **Rebuild light-point rendering and fix the artifacts (c06_s1, c06_s4, c06_s3, c04_s2).** Replace the hex-mosaic splats with point-sprite clusters (log-scaled, sodium-orange cores, dendritic filaments, tight bloom). Fix the vertical streaking in c06_s4 (x 380–470, y 165–260), the rectangular bar in c04_s2 (x 600–680, y 160–300), the night-light smears in c06_s3 (lower-left) and the uniform glitter over all land in c04_s2.
3. **Lift the highlight ceiling for hero emitters.** The batch never exceeds luma 0.92. The spark, flame core, impact core, mote, Sun and last light must reach 1.0 with real bloom, scaled per source. The Sun should be the brightest object in the film. This is the single biggest step toward "2001".
4. **Vary the camera on globe shots.** 13 of 24 frames are a globe, and six frames across chapters 4–6 use the same camera: north-up, polar cap at top centre, globe overfilling the frame. Give each shot its own camera: horizon-arc limb shots with black space above, regional close-ups (the Mediterranean filling the frame), low oblique orbits along a route, or a small full disc with negative space.
5. **Put the missing story beat in every frame of four signature shots.** GOE (orange haze on one limb, blue on the other, rust shelves), Colonies (actual Volvox spheres), Plague (gold threads dying to ash behind a visible front), Mote (a white point off the limb against black). As captured, these four frames don't show what they are named for.
6. **Day-side planet look (c01_s2, c01_s3, c03_s3, c03_s4, c06_s3).** A Rayleigh atmosphere rim on both limbs, a tight ocean specular glint, land relief and albedo variation, cloud shadows, and era-correct colour (orange haze, white-blue ice, emerald, real-Earth geography from chapter 6 on). Today Snowball reads as the Moon, Drift as Arrakis and GOE as grey.
7. **Microscopy art direction (c01_s1, c02_s1, c02_s0).** Drop the outline-ring cells and ladder-rods for volumetric darkfield cells with fresnel rims and depth of field. Cut about 70 % of the endosymbiosis bokeh. Build real cristae instead of concentric ellipses.
8. **Cambrian seafloor (c02_s4).** Animated gold caustics on rippled sand, depth fog in place of the hard horizon at y≈118, wide diagonal god rays, rooted 3D fauna instead of 2D leaf sprites, readable creature bodies, and no hard-clipped glows.
9. **Prologue silhouettes and the membrane frame (c00_s1, c00_s2).** Chimneys jagged and flanged with carbonate frost (no more fingers or candles). A dark, roiling plume, not a lit cone. Crush the orange fog in c00_s2, centre the sphere for the Earth match-cut, and make the spark actually flare.
10. **Handprints (c04_s3).** Sprayed negative stencils with pigment halos, raking firelight falling to black, a rock relief map, and no vertical streak texture. This is currently the brightest and flattest frame in the batch.
11. **First flame (c04_s1).** Fix the inverted rock lighting (camera-facing rocks lit although the fire is behind them). Drop the masonry ring and radial log star for a few irregular branches. Near-white flame core with glowing embers in the wood, inverse-square ground spill, and an acacia horizon instead of conifers.
12. **Chapter 7 warm-versus-cold and the swarm (c07_s1, c07_s3, c07_s4).** Fill the unconquered channel in Pattern with flickering amber. Give the last light a 15–30 px warm halo and dim the lattice radially around it. Rebuild the swarm as a crisp tilted ring of glinting mirrors around a limb-darkened Sun, with Mercury's stream visible and remove the brown haze.

## Broken or obviously wrong frames

No frame is blank or white. These are wrong on screen:
- **c04_s2 Out of Africa:** rectangular bar artifact at x≈600–680, y≈160–300; blocky region fills; glitter noise over all land.
- **c06_s4 The mesh:** vertical streak smears in the light clusters at x 380–470, y 165–260; mesh nearly invisible.
- **c06_s1 Ignition:** hex and pixel mosaic inside the light clusters (x 430–590, y 310–420).
- **c02_s1 Colonies:** wrong content. It is a near-duplicate of the mat, with no colonies.
- **c05_s4 The plague:** wrong content. No plague is visible, and it is interchangeable with c05_s2.
- **c06_s3 The mote:** no mote. A white crescent smear at x≈590–615, y≈375–415 reads as an artifact, and the night-light smears at the lower-left read as lens dirt.
- **c01_s2 GOE:** the brief's defining change (orange haze to blue) is absent.
- **c02_s4 Cambrian:** hard polygonal clipping on creature glows (for example x 620–760, y 380–430).
- **c04_s1 First flame:** inverted lighting on the foreground rocks.
- **c00_s0 Ember:** not broken, but at normal exposure it is 99.9 % black with a mid-grey ember (max luma 0.54). On a phone or a bright room it will look like a dead screen. Brighten the core.

## Repetitive compositions

- **"Polar cap at top, cropped globe" six times:** c04_s2, c05_s2, c05_s3, c05_s4, c06_s1 and c06_s4 share camera height, orientation and framing, plus the same grey cap. Played in order, chapters 4–6 will feel like one long held shot with different overlays.
- **The "planet right of centre, terminator through it" twins:** c01_s2 GOE and c03_s3 Drift are nearly the same layout (disc centre at about x 560–600, terminator about 100 px in from the left limb).
- **Microscope déjà vu:** c01_s1 Mat and c02_s1 Colonies use the same cells, rods, cloud fields and camera.
- **The "constellation network" motif** appears in c05_s2, c05_s3, c05_s4, c06_s1 and c06_s4: thin 1 px lines with dot nodes. It stops meaning anything specific (empire, trade, plague, shipping, fibre are all drawn the same way). Give each era its own line language: gold silk threads, silver wakes, cyan fibre pulses.
- **Circle-in-centre:** used deliberately for the scale rhyme, which is good. Make sure the rhyme shots (membrane, Earth, Dyson ring) are the ones that get the centred circle, and move the non-rhyme globes off-centre or to limb framings so the rhyme stands out.

## Continuity between consecutive shots

- **Cell → Earth (c00_s2 → chapter 1 shot 1):** the sphere sits at x≈633 with a radius of about 52 px, off-centre. For the match cut, centre it, match its radius to the opening Earth, and match the rim-light side: the membrane's brighter rim should be on the same side as the Earth's lit limb.
- **Light side flips:** GOE and Snowball are lit from the left, Drift and Chicxulub from the right, the Mote from the upper-right. Pick one sun side per chapter, or one for the whole film until the swarm, so cuts between orbital shots don't jump.
- **Ice-cap logic:** the cap in the 1450–2000s frames (c05_s4, c06_s1, c06_s4) looks larger and brighter than in the ice-age frame (c04_s2). That inverts the Last Glacial Maximum and Holocene story and contradicts "2020s climate change visibly shrinks ice".
- **Geography:** the modern Earth in c06_s3 is not recognisable, yet the brief settles the real coastlines in Drift. From chapter 6 on the planet must be unmistakably our Earth.
- **Day/night jumps in chapter 6:** Ignition (night) → Mote (day) → Mesh (night). The day-lit Mote breaks the night-side rhythm. Either shoot the mote from the night side near the terminator (a bright point against a dark limb reads even better) or treat the cut as a deliberate breath.
- **Pattern → Last light:** the lattice style changes. Pattern has thick glowing Voronoi seams over the whole sphere; Last light has a uniform triangle grid that is brighter over land. Keep the seam hierarchy so the descent feels like the same structure seen closer.
- **Swarm → galaxy disk (into chapter 8):** the Sun sits at x≈410, y≈255 (left of centre) inside a fuzzy oval. For the match cut, centre it and give the ring a clean ellipse whose tilt and aspect match the opening galaxy disk, with the Sun's glow becoming the galactic core.
- **Fire → hands (c04_s1 → c04_s3):** the fire is amber-on-blue night; the hands are a flat orange wash with no visible source. Carry the same flickering key light and the same amber (`#ffb347`) into the cave so it feels like the same fire, later.
