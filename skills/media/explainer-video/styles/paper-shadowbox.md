# Paper Shadowbox

A layered cut-paper diorama: flat paper layers stacked in depth, with real soft shadows falling between them under one warm lamp. A jointed paper puppet acts in front, and the inside of the subject glows as paper lanterns seen through a window cut in a layer.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + `FilmPass` |
| Techniques | [paper-piece systems](../references/techniques.md#paper-piece-systems), [multiplane camera](../references/techniques.md#multiplane-camera), [2D puppets](../references/techniques.md#2d-puppets-and-cels), [film pipeline](../references/techniques.md#the-film-pipeline) |
| Best for | Science "inside the thing" explainers, anatomy, how a machine or organism works, sea and forest worlds |
| Less good for | Fast data comparisons, many numbers in one beat, gritty or urban topics |
| Designed at | 9:16; at 16:9 widen the box and stage the puppet and the lantern window side by side |

## Look

- Four colours plus one accent: navy `#1d2a4d`, teal `#2a7f7a`, coral `#e9725a`, cream `#f3e8d3`, and yellow `#E3E302` used only for the thing that matters and for glows. Each layer is one flat colour; far layers are mixed 15 to 30 percent toward navy so depth reads as haze.
- Paper: visible fibre grain, a thin lighter core at each cut edge, and slightly uneven hand-cut outlines (every vertex jittered 1 to 2 px).
- A box of 6 to 9 layers spaced 0.15 to 0.3 units apart, the frontmost a frame with a cut-out opening.
- Puppet: one original character made of jointed paper strips (arms, tentacles, tails or stems as chains of 6 to 10 segments), big layered-circle eyes, flat colour with white dot patterns cut out.
- The inner workings are paper lanterns: ribbed, rounded shapes that hang on threads behind a window cut in a layer and glow yellow from inside.

## Build

1. Each layer is a `THREE.Shape` from a jittered outline, with holes for windows, extruded to 0.01 units (no bevel). `MeshStandardMaterial`, roughness 0.9, with a fibre texture drawn in a canvas (`CanvasTexture`) as `bumpMap` and a faint colour noise.
2. Lighting: one warm `SpotLight` or `DirectionalLight` from the upper left, `castShadow` and `receiveShadow` on every layer, `VSMShadowMap` with a radius of 6 to 10 so shadows are soft, and a low cool ambient so the shadows stay visible. Tune shadow bias to avoid acne on the thin layers.
3. Puppet strips: segment i hangs from the end of segment i-1; its angle is `curl * (i / n) * sin(phase - i * lag)`, so curling travels down the strip with follow-through. Pose keys for curl, uncurl, droop and reach.
4. Lanterns: stacked ring segments (or a `LatheGeometry`) in cream paper with an emissive yellow interior and a small `PointLight` inside, so they light the layers around them.
5. Labels and numbers are canvas text on their own cut-paper planes inside the stack, so they cast shadows too.
6. `FilmPass`: `focus` on the active layer, `aperture` 6 to 10, `bloom` 0.4 with a threshold that only catches lanterns, `grain` 0.15, `vignette` 0.35, warm `highlightTint`.

## Motion and camera

- Paper animates on twos: read `onN(frame, 2)` for puppet poses, kelp or grass sway and layer flutter (a few degrees about a top pin).
- The camera moves on ones, slowly, through the layers: a dolly of 0.3 to 0.6 units per beat with a little drift, so the layers slide past each other.
- At least once per film, push through a window: the camera dollies through a hole in a layer into the scene behind, changing scene without a cut. Other transitions: a layer slides in across the frame, or a hard cut on a beat start.
- Aim for at least five shots with real motion in each.

## Explainer devices

- Hook number: big cream cut-paper numerals on a plane in front, casting shadows on the layers behind; the counter swaps digit planes.
- Crowd or grid: a row of small lanterns or paper tokens; on the number word the one that matters lights yellow and its point light switches on.
- Map or diagram: seen through the window, the parts as lanterns linked by paper-strip tubes; a flow is a yellow glow that travels along a strip.
- Comparison: paper strips of different lengths stacked in depth, each sliding out to its value.
- Reversal: the key lantern goes dark on the word (emissive and point light to zero), the puppet droops and the music drops.
- Payoff: the lantern relights, or a cut-out question mark in the front layer with the yellow glow behind it.

## Captions

Draw with `renderPage`: bold cream cut-paper letters (Poppins Black) with a soft drop shadow, two or three words a page, the spoken word in yellow `#E3E302`. On 9:16 keep them in the bottom quarter, clear of the puppet.

## Score

```json
{ "seed": 9,
  "music": { "bpm": 92, "key": "G", "scale": "lydian", "chords": [1, 2, 1, 5],
    "layers": [ { "inst": "musicbox", "part": "melody", "octave": 5, "db": -8, "density": 0.45 },
                { "inst": "harp", "part": "arp", "octave": 4, "db": -12, "rate": 8 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -14 },
                { "kit": "soft", "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.3 },
  "sfx": [ { "type": "water", "at": 0, "dur": "<film length>", "db": -10 },
           { "type": "paper", "word": "<layer slides word>" },
           { "type": "swell", "word": "<push through word>", "offset": -0.6, "dur": 1.2 },
           { "type": "chime", "word": "<lantern lights word>" },
           { "type": "thud", "word": "<goes dark word>" },
           { "type": "shimmer", "word": "<payoff word>" } ] }
```

Use `water` only for underwater subjects; swap it for `wind` in a forest box.

## Check the stills

- Each layer casts a soft shadow on the one behind it; the depth reads without motion.
- Paper grain and uneven cut edges are visible in close shots.
- Only navy, teal, coral and cream plus the yellow, and the yellow is only on the accent and its glow.
- The lantern glow is visible through the window and lights the paper around it.
