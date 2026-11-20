# Pixel Diorama

Chunky pixel-art sprites and tiles, drawn in code from one 32-colour palette, stood up in a lit 3D miniature and filmed like a model: lantern light, dusk shafts, tilt-shift blur and bloom.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + `FilmPass`, sprites drawn with `makeLayer` |
| Techniques | [sprites in a 3D diorama](../references/techniques.md#sprites-in-a-3d-diorama), [film pipeline](../references/techniques.md#the-film-pipeline), [cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion) |
| Best for | Games, journeys and routes, retro tech, step-by-step stories with one hero |
| Less good for | Precise data, photographic realism, long passages of on-screen text |
| Designed at | 16:9; for 9:16 stack the terraces up the frame and have the hero climb instead of run |

## Look

- One fixed palette of 32 colours in `palette.ts`, built as ramps: dusk blues `#1b1f3b` `#2e3a73` `#4a6fb5`, plum and rose `#5a2a5e` `#a8436a`, warm light `#e8713c` `#ffb35c` `#ffe39a`, greens `#2f5d3a` `#5f9e4b`, stone greys, and a cloak red `#c8323c`. Nothing on screen uses a colour outside it, except bloom.
- Pixel scale: 1 sprite pixel is 1/16 of a world unit. Tiles are 16 by 16, the hero 16 by 24, villagers 16 by 16. Gradients are hand-placed dithering (checker and 2 by 2 ordered patterns), never smooth.
- The set is HD-2D: real 3D volumes (terraces, house boxes, roofs, stairs, a bridge) skinned with pixel tile textures, and flat sprites stood upright among them.
- Light: warm lantern point lights `#ffb35c` on posts and eaves, a low cool directional from the dusk sky `#6a7bd6`, and soft volumetric shafts falling through gaps.
- Water: a still valley lake below the village that reflects lanterns and fireworks, with ripples that move in whole pixels.

## Build

1. Sprites are arrays of strings, one character per pixel as a palette index (`0` to `9`, `a` to `v`, `.` for clear), one string block per animation frame. Draw them once into sprite-sheet layers from `makeLayer` inside `useMemo`.
2. `CanvasTexture` with `magFilter` and `minFilter` set to `NearestFilter`, `generateMipmaps = false`, sRGB colour space.
3. Sprites are planes that turn to face the camera around the vertical axis only, with `alphaTest: 0.5` (hard edges, no soft alpha) and a `customDepthMaterial` using the same alpha test so their shadows have the sprite's silhouette.
4. Snap every sprite position to the 1/16 grid. Cycles: run 4 frames, idle 2 frames, at 10 drawings a second (`Math.floor(frame / fps * 10) % 4`).
5. Water: a mirrored copy of the set (scale y by -1, darkened 40 percent) seen through a translucent water plane; the reflection's UV is quantised to the pixel grid and broken by 1-pixel horizontal ripple bands that shift by whole pixels.
6. Shafts: a few additive cone meshes with a dithered gradient canvas texture, slow drifting dust as 1-pixel sprites inside them.
7. Fireworks: instanced 2 by 2 pixel squares; each burst steps down a palette ramp as it fades (white, yellow, orange, rose, plum), never alpha. Trails fall on a 10 fps clock.
8. `FilmPass`: `focus` on the hero's distance, `aperture` 18 to 24 for the tilt-shift miniature, `bloom` 0.7, `bloomThreshold` 0.75, `grain` 0.1, `vignette` 0.35, `highlightTint` warm, `shadowTint` violet.

## Motion and camera

- The signature is a slow dolly that tracks the hero sideways along a terrace from a three-quarter view (about 30 degrees down, 35 mm), ending on a pull-back wide of the whole diorama. The camera moves smoothly on ones; sprites animate at 10 drawings a second; that contrast is the look.
- One shot per beat. Cut between beats with a dither dissolve: a 4 by 4 Bayer threshold drawn in a canvas overlay, opening over 8 frames.
- The reversal shakes the camera in whole-pixel steps, and the lanterns go out one by one.

## Explainer devices

- Hook number: pixel digits from a 5 by 7 bitmap font, drawn as sprites on a wooden signboard or floating over the valley, counting up with a coin blip per step.
- Crowd or grid: a row of 12 villagers on the terrace; on the word, one raises a lantern, its point light turns on and a bouncing `!` marker sprite appears above it.
- Evidence: a dialogue box with a pixel border (a 9-slice drawn in code) in an overlay layer, the claim typed on letter by letter in Pixelify Sans.
- Map or diagram: the camera cranes up to near top-down over a tiled world map; the route draws on as a dotted trail of pixel footsteps, regions fill tile by tile.
- Comparison: stacks of crates or tile columns that build up one tile per unit, a click per tile.
- Reversal: lanterns out, the palette shifts to the dusk blues for the beat, the music drops out.
- Payoff question: the hero stops at the terrace edge, fireworks burst over the lake and reflect, and a `?` speech bubble sprite pops above the hero's head.

## Captions

Default captions work. For a tighter fit, `renderPage` draws each caption page inside the same pixel dialogue box in Pixelify Sans, white text with the spoken word in `#ffe39a`.

## Score

```json
{ "seed": 32,
  "music": { "bpm": 112, "key": "G", "scale": "major_pentatonic", "chords": [1, 5, 6, 4],
    "layers": [ { "inst": "chip", "part": "melody", "octave": 5, "db": -6, "density": 0.6 },
                { "inst": "chip", "part": "arp", "octave": 4, "db": -14, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -10 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -18 },
                { "kit": "chip", "db": -14 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.35 },
  "sfx": [ { "type": "click", "every": 0.1, "from": "<count start>", "to": "<count end>" },
           { "type": "chime", "word": "<lit villager word>" },
           { "type": "typewriter", "word": "<evidence word>", "dur": 1.0 },
           { "type": "thud", "word": "<reversal word>" },
           { "type": "firework", "word": "<payoff word>" },
           { "type": "firework", "word": "<payoff word>", "offset": 0.6 } ] }
```

The soft pad and the reverb are what make the chip tune sound modern rather than retro.

## Check the stills

- Pixels are crisp squares at one size; no smoothed or resampled sprite edges.
- The foreground and background are blurred and the hero's plane is sharp, so the set reads as a miniature.
- Lantern light falls warm on nearby tiles and sprites cast silhouette shadows.
- No colour outside the palette except bloom glow; gradients are dithered.
- Reflections in the water are pixel-stepped, not smooth.
