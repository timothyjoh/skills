# Building it in code

Every style here is drawn by code that computes each frame: no image model, no video model, no stock art. "In code" covers several quite different engines. Each style file names the techniques it uses; read those sections before building it.

## Contents

- [SVG motion graphics](#svg-motion-graphics)
- [Printing plates: canvas layers through a medium shader](#printing-plates-canvas-layers-through-a-medium-shader)
- [Stroke engines](#stroke-engines)
- [Paper-piece systems](#paper-piece-systems)
- [2D puppets and cels](#2d-puppets-and-cels)
- [Billboards in a toon 3D world](#billboards-in-a-toon-3d-world)
- [Instanced systems](#instanced-systems)
- [Raymarching signed-distance fields](#raymarching-signed-distance-fields)
- [Sprites in a 3D diorama](#sprites-in-a-3d-diorama)
- [City tricks: interior mapping, reflections, rain](#city-tricks-interior-mapping-reflections-rain)
- [The film pipeline](#the-film-pipeline)
- [Cadence: ones, twos, threes and stop motion](#cadence-ones-twos-threes-and-stop-motion)
- [Multiplane camera](#multiplane-camera)
- [Explainer devices](#explainer-devices)

## SVG motion graphics

Flat vector shapes as React SVG: paths, rects, gradients, masks, clip paths. Animate attributes per frame (transform, dash offset for lines that draw on, opacity). Filters do texture: `feGaussianBlur` + `feMerge` for glow, `feTurbulence` + `feDisplacementMap` for brushed or wobbly edges (vary the turbulence `seed` per drawing for a boil). Text is real text, so counters can use tabular figures. Quickest route to crisp, legible explainer graphics. Styles: mono-motion-graphics, flat-vector-science, ink-scroll, tv-cartoon, quirky-absurd, retro-futurism.

## Printing plates: canvas layers through a medium shader

Draw the picture as separate greyscale masks on offscreen canvases (`makeLayer`), one per ink or plate, then composite them in a `ShaderPass` that imitates the medium:

- woodblock: light block, deep block, black key block; slight misregistration that changes per print, wood grain inside flat colour, paper fibre, uneven ink, deckled sheet edge
- risograph: one halftone screen per ink (dots, lines or grain), multiply overprint, roller banding, pinholes
- watercolour: pigment granulation, darker wet edges (edge detect on the mask), bleeds (blur the mask with noise), paper tooth that catches the wash
- poster gouache and airbrush: flat fills, soft sprayed gradients from blurred masks, halftone print grain

The masks stay simple shapes; the shader carries the look. Styles: woodblock-print, watercolour, retro-futurism, editorial-collage, construction-paper.

## Stroke engines

Fill shapes with many short procedural strokes instead of flat colour: hatching that follows the form, dry-brush streaks that skip over paper tooth, pastel strokes in one direction. Generate stroke positions from `hash(shapeId, i, onN(frame, 3))` so they redraw every third frame and the image shimmers like hand animation. Clip strokes to the shape with a canvas clip path. Styles: watercolour, ink-scroll, painted-anime backgrounds, quirky-absurd.

## Paper-piece systems

A small factory that makes paper pieces: a stock (sugar paper, kraft, newsprint with unreadable type, graph paper, marbled, tissue, halftone magazine, patterned origami), a cut (scissor-cut with slight facets, or torn with a white fibrous deckle made from a noisy offset outline), a slight curl, and a soft contact shadow whose offset and blur grow as the piece lifts. In 2D, draw each piece to its own canvas and composite with shadows. In 3D, put each piece on a plane at its own depth, light it with one warm lamp, and let real shadows fall between layers (shadowbox). Pieces move by sliding, hinging on pins and being swapped for replacement shapes. Styles: cut-paper-collage, paper-shadowbox, construction-paper, editorial-collage.

## 2D puppets and cels

Characters built from parts on pivots (head, eyes, brows, mouth, torso, arms, hair, cloth), each part a closed spline. Key a pose sheet (named poses as part angles and offsets), interpolate between keys with anticipation and overshoot, and hold drawings on twos. Flat fills with one hard shadow shape and a small highlight; outline by stroking the spline with a tapering width. Secondary motion (hair, scarf, ears, tail) lags the main action by a few frames. Blinks and mouth shapes are swapped drawings. Styles: painted-anime, tv-cartoon, construction-paper, quirky-absurd, flat-vector-science, cartoon-3d characters.

## Billboards in a toon 3D world

Draw 2D characters into canvases and put them on planes that always face the camera, standing in a 3D world of simple primitives shaded with a 2- or 3-step toon ramp. Add an oval contact shadow under each billboard, ink lines from depth edges in a post pass, and background blur on close shots. The result reads as a cartoon with real camera moves (cranes, glides, push-ins). Style: cartoon-3d.

## Instanced systems

Hundreds or thousands of the same object with `THREE.InstancedMesh`, one matrix per instance set every frame. A grid makes it a system: bricks on a stud grid, voxels on a cube grid, columns on a map, people in a crowd, towers in a city. Animate instances in waves (`delay = i * k`) and land each with a squash. Styles: toy-brick, data-3d, neon-megacity, holo-3d, cartoon-3d crowds.

## Raymarching signed-distance fields

The whole world is one fragment shader in a `ShaderPass`: a distance function for terrain, arches, a ship, a planet with rings, combined with smooth min; march a ray per pixel, shade with normals from the distance gradient, fog by distance, glow from emissive seams. Raymarch at half resolution if slow. Camera path, banking and reveal are uniforms driven by the frame. Effects (bloom, streaks, god rays, aberration, grain, letterbox) go in the same shader or a second pass. Style: raymarched-sci-fi.

## Sprites in a 3D diorama

Pixel art drawn in code: every sprite and tile is a small array of palette indices from one fixed palette (for example 32 colours), drawn to a canvas at native size and scaled up with nearest-neighbour filtering. Stand the sprites up as planes in a 3D miniature set, light them with warm point lights, snap positions to the pixel grid, and film with a tilt-shift (strong depth of field) and bloom. Style: pixel-diorama.

## City tricks: interior mapping, reflections, rain

- Interior mapping: a window shader fakes a room behind each window by intersecting the view ray with an imagined box, so a flat tower face shows lit rooms with depth.
- Planar reflection: render the scene again from a camera mirrored under the street plane into a render target, then sample it with a ripple offset on wet ground.
- Rain: instanced thin quads falling and stretched along their motion, plus drops on the lens as a refracting overlay in the post pass.
- Signs: invented glyphs drawn from random strokes, never real words; emissive and bloomed.

Style: neon-megacity.

## The film pipeline

What makes code-rendered frames look photographed rather than computed. `FilmPass` gives bloom, depth of field, chromatic aberration, split-tone grade, vignette, grain and letterbox. Add per style when needed: anamorphic streaks (bright pixels blurred horizontally), screen-space god rays (radial blur of bright pixels from the light's screen position), radial motion blur, lens dirt, gate weave (tiny per-frame offset), print warmth. Grain re-seeds every frame; gate weave and flicker change per drawing.

## Cadence: ones, twos, threes and stop motion

- On ones: camera moves and fluid effects, every frame different.
- On twos and threes: hand-drawn work holds each drawing 2 or 3 frames (`onN`). Character animation on twos, texture boil on threes, camera on ones is the classic mix.
- Stop motion: quantise time to 12 exposures a second, add a small position jitter and light flicker per exposure, no motion blur, squash-and-settle on landings, and swap replacement shapes for effects.

## Multiplane camera

Split the picture into foreground, midground and background layers at different depths; move the camera (or slide layers at different speeds) for parallax. Far layers softer and lower in contrast. Push through a window or gap in a layer to change scene without a cut.

## Explainer devices

Every explainer reuses a handful of devices. Each style file says how its look draws them:

- **Hook number:** a big counter that climbs to the figure on the word that names it.
- **Crowd or grid:** many small figures; one lights up for "one in twelve".
- **Evidence card:** a panel, document or lab scene that carries the claim.
- **Map or diagram:** an outline that draws itself, a region that fills, a dot that spreads.
- **Comparison:** bars, columns or stacked objects that grow to their values.
- **Reversal:** a flash, a camera kick, a stamp struck through, music dropping out.
- **Payoff question:** the hero replaced by a question mark, held for the final line.
