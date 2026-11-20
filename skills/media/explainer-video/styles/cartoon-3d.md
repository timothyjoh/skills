# Cartoon 3D

Flat hand-drawn cartoon characters stood up on camera-facing cards inside a chunky toon-shaded 3D world, with ink lines from depth and real camera moves. A comic history or "what went wrong" story told in small scenes.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + a copied `FilmPass` with a depth-edge ink pass |
| Techniques | [billboards in a toon 3D world](../references/techniques.md#billboards-in-a-toon-3d-world), [2D puppets and cels](../references/techniques.md#2d-puppets-and-cels), [instanced systems](../references/techniques.md#instanced-systems), [film pipeline](../references/techniques.md#the-film-pipeline) |
| Best for | Comic history, mysteries, accidental inventions, plans that went wrong, absurd true stories |
| Less good for | Abstract ideas with no people or places, dense numbers, sombre topics |
| Designed at | 9:16; at 16:9 stage characters side by side with a wider lens and let the landscape run across the frame |

## Look

- Characters: original designs drawn flat, plum ink outline `#241726` about 6 px, flat fills with one shadow shape, big white eyes with black pupils, small mouths, simple costumes in 3 or 4 colours that suit the period. They blink every 2 to 4 s (seeded) and are tinted slightly warm (`#fff6ea`) so they sit in the light.
- World: simple primitives (boxes, cylinders, cones, spheres, lathe shapes) in `MeshToonMaterial` with a hard 2-step ramp, flat colours, no textures beyond faint canvas noise on grass and ground. Rolling hills from a displaced plane; distant mountains as pale blue flat cards.
- Sky by mood: day `#4f8fdc` to a pale horizon `#d8e6f2`; golden `#ffb46a` to `#f2c69a` for the first and last beats; dusk `#4a5fa8` to `#e8a07a`; night `#0c1638` to `#34407a` with warm lantern or fire light.
- Grade: a cool blue lift in shadows, warm highlights, saturation up about 8 percent (12 for sunny outdoor stories), soft vignette.
- Ink: near-black lines about 5 px from depth and normal edges, so every silhouette and crease of the 3D world reads as drawn.
- Props are chunky and a size too big, specific to the topic, so they read at phone size.

## Build

1. Characters are 2D puppets drawn each frame into a `makeLayer` canvas, shown on a `CanvasTexture` plane that faces the camera (`lookAt` with y locked). Pose sheet: idle, proud (hands on hips), point, wave, cheer, shock (arms up), smug (thumbs up), worried. Poses on twos; blinks and mouths are swapped drawings.
2. An oval contact shadow (dark transparent disc) under every billboard, shrinking as the character jumps.
3. Anything over about 30 of a kind (birds, balloons, wheat stalks, sheep, coins) is an `InstancedMesh` with `frustumCulled = false`, moving as one flock with per-instance `hash` offsets. Crowds of people stay billboards drawn from 4 or 5 variants with seeded colours.
4. Animals and vehicles are chunky toon models from primitives with looping cycles: pecking, legs, wheels, spinning blades.
5. Copy `FilmPass` beside the scene and add: a Sobel edge on linear depth and normals, ink `#120d14`, about 5 px at 1080 wide; background blur on close shots (`focus` on the subject, `aperture` 6 to 10); `shadowTint` `[0.85, 0.9, 1.05]`, `highlightTint` `[1.05, 1.0, 0.92]`.
6. Effects are drawn: puffs as clusters of toon spheres, explosions as a flash card plus a ring of jagged billboard shards, smoke as grey spheres that grow and drift, rain as instanced streaks.

## Motion and camera

- One shot per beat with hard cuts. Each shot is a `smootherstep` glide across the beat with a slow creeping push-in (5 to 10 percent closer) and a 2 to 4 degree roll.
- Vary the angle: low and close on the hero, a high wide crane over the world for place and scale, two-shots for reaction beats.
- A white flash (2 to 3 frames) after the hook and on the biggest hit; a 7-frame decaying `kick` on every hit word.
- Acting lands on the word: a pose change starts 2 to 3 frames before `at(word)` with anticipation, holds, then settles.

## Explainer devices

- Hook number: a crowd pops in row by row behind the hero, waving; the figure lives in the captions, or on a painted wooden sign prop.
- Crowd or grid: a line of characters; one turns gold (fill swap plus a soft glow ring) on the number word while a witness looks shocked.
- Evidence: a prop that pops up above the characters with a shimmer, or a dig site where the pit reveals the find.
- Map or diagram: a crane over the world itself, with riders, travellers or a colour flood crossing it; or a big painted board prop in the set.
- Reversal: a smug thumbs up turns to arms-up shock, a billboard question mark pops above, white flash, the roll flips with a kick, and the music drops out.
- Payoff: the hero vanishes in a puff and a big question mark billboard stands in their place while the crowd turns shocked; end on a golden wide that pulls up and back.

## Captions

Default captions. Frame the ground line at about 60 percent of the height on 9:16 so heads stay clear of the caption band.

## Score

```json
{ "seed": 21,
  "music": { "bpm": 120, "key": "A", "scale": "minor_pentatonic", "chords": [1, 6, 4, 5],
    "layers": [ { "inst": "koto", "part": "melody", "octave": 5, "db": -6, "density": 0.55 },
                { "inst": "pluck", "part": "arp", "octave": 4, "db": -14, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -10 },
                { "kit": "taiko", "db": -14 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.2 },
  "sfx": [ { "type": "whoosh", "word": "<last hook word>", "dur": 0.4 },
           { "type": "click", "every": 0.14, "from": "<travel start>", "to": "<travel end>", "db": -10 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "thud", "word": "<gag word>" },
           { "type": "drum", "word": "<payoff word>" } ] }
```

The repeated `click` is a hoof or footstep patter under travel. Fit the tune to the setting: `major_pentatonic` with a `wood` kit for jaunty fables, `lofi` with swing for a period workplace. One clear cartoon sound on each key word (`pop`, `thud`, `boom` for the big moment, `chime` for the punchline).

## Check the stills

- Every silhouette has a dark ink line, the 3D props as well as the characters.
- Characters are flat and face the camera; the world is shaded in two hard tones.
- Close shots blur the background; wide shots keep the whole action above the caption band.
- The gold figure or the question mark is the clearest thing in its frame.
