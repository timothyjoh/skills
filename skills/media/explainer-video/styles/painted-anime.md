# Painted Anime

A painted feature-anime look: lush gouache skies with towering cumulus, warm golden light, and gentle cel-shaded characters over richly painted scenery, drifting slowly through layers of depth. Nostalgic and calm.

| | |
|---|---|
| Engine | Canvas + shader: `makeLayer` layers composited in a `ShaderPass` |
| Techniques | [paint medium shader](../references/techniques.md#printing-plates-canvas-layers-through-a-medium-shader), [stroke engines](../references/techniques.md#stroke-engines), [2D puppets and cels](../references/techniques.md#2d-puppets-and-cels), [multiplane camera](../references/techniques.md#multiplane-camera), [cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion) |
| Best for | Nostalgic and human stories, nature, seasons, journeys, a life or a place remembered |
| Less good for | Hard data, comedy that needs snap, clinical or dark subjects |
| Designed at | 9:16 with the subject mid-frame and a calm lower quarter; at 16:9 lower the horizon, widen the sky and track sideways instead of rising |

## Look

- Sky: deep cobalt `#3f7fd0` at the top to warm cream `#f6e3b8` at the horizon; big cumulus in three flat tones (lit `#fffaf0`, mid `#efe0d0`, blue-violet shadow `#a9a6cf`) with soft brushed edges.
- Scenery: everyday places in correct flat perspective, painted as flat poster-colour shapes with visible brush texture inside them. Greens `#7fae4e` to `#3f6f3a`, warm earth `#c99a64`, lavender shadows `#8f86b8`.
- Light: warm and golden, shadows saturated and cool, never grey; a warm light leak at one edge.
- Characters: original, simple and gentle, small faces with big eyes. Flat cels: a thin dark-brown line `#4a2f24` that varies in width, flat base colours, exactly one hard-edged shadow tone and a small highlight; hair and clothes as separate shapes.
- Overlays: floating warm light motes, bloom and soft diffusion on highlights, slight colour fringing toward the edges, fine film grain, a soft vignette.
- Labels: Lora Bold in warm white `#fffaf0` with a soft dark shadow; accent `#ffd27a`.

## Build

1. One painting per beat, as layers from `makeLayer`, back to front: sky, far clouds, near clouds, far land, midground, character cel, foreground (grass, branches, petals). Clouds are clusters of overlapping circles with a flat base cut; hills are noisy splines; buildings are perspective polygons.
2. Paint texture with a stroke engine: inside each shape's clip path lay 100 to 400 short strokes along the form, each a few percent off the base colour (`hash(shapeId, i)`). Backgrounds are painted once and do not boil.
3. Composite in one `ShaderPass`: sample each layer with its own parallax offset, roughen edges with noise, add paper tooth and pigment variation, bloom and diffuse the bright areas, then the warm grade, fringing, motes, grain and vignette.
4. Characters are 2D puppets from part splines with a pose sheet (stand, walk, look up, smile, point, surprise), drawn into the cel layer on twos with key poses held 2 to 6 frames. Hair, ribbons and clothes follow through a few frames late; blinks and mouths are swapped drawings. Held cels where only hair and cloth move suit this look.
5. Effects (wind streaks, dust, birds, petals, speed lines) are drawn shapes on threes.
6. For panels, the shader blurs the whole painting (a 13-tap blur, radius about 18 px) and multiplies it by 0.55, then the panel is drawn on top.

## Motion and camera

- A slow dreamy drift in every shot: zoom eases from 1.06 to 1.14 across the beat, with a gentle sideways sine sway (about 1 percent of the width) and a slow rise.
- Multiplane parallax: the sky drifts sideways strongly on its own (clouds travel), far land moves at 0.2 of the camera, midground 0.5, foreground 1.2 with a little sway as if in wind.
- Cuts are 0.6 s cross dissolves. One extreme close-up (the eyes) is welcome; end on a wide.
- No line boil anywhere: backgrounds and character lines stay still and clean.

## Explainer devices

Labels fade and rise 20 px over 0.2 s on their words.

- Hook number: a wide establishing painting (a crowd on a plain, a valley, a city) with a Lora counter climbing in warm white and its unit beneath in the accent.
- Hero: a low heroic angle on the hero in golden light, the name label on its word.
- Statistic: over a 1.35x push into the establishing painting, a 6 by 2 grid of rounded pill tokens pops in; one glows `#ffd27a` with a soft halo on the number word.
- Map or diagram: the painting blurs and darkens behind a rounded panel with paper texture: pale sea `#cfe3ea`, parchment land `#e9e2c6`, olive outlines `#5b6b4a`. A region wipes in translucent amber, a marker pulses at the origin and a translucent red spreads from it; orange dots `#e08a2c` pop on their word.
- Reversal: the claim as a capitalised label; a `#ffd27a` bar strikes through it on the reversal word and the answer appears below in the accent while the music drops nearly to silence.
- Payoff: the closing label is replaced on its word by the question in the accent, held over the final wide.

## Captions

`<Captions fontFamily="Lora" highlight="#FFD27A" />`, loading Lora Bold with `@remotion/google-fonts/Lora`: white with a black outline, the spoken word in warm gold.

## Score

```json
{ "seed": 9,
  "music": { "bpm": 76, "key": "A", "scale": "minor_pentatonic", "chords": [1, 6, 4, 5],
    "layers": [ { "inst": "flute", "part": "melody", "octave": 5, "db": -6, "density": 0.45 },
                { "inst": "harp", "part": "arp", "octave": 4, "db": -14, "rate": 4 },
                { "inst": "koto", "part": "root", "octave": 3, "db": -12 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -18 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.4 },
  "sfx": [ { "type": "wind", "at": 0, "dur": "<film length>", "db": -14 },
           { "type": "drum", "word": "<hook number word>" },
           { "type": "shimmer", "word": "<key statistic word>" },
           { "type": "drum", "word": "<reversal word>" },
           { "type": "chime", "word": "<payoff word>" },
           { "type": "drum", "word": "<payoff word>" } ] }
```

Breathy flute over slow low plucks and a soft bed; swap the flute for `piano` for a more sentimental film. Deep drum hits on the hook, the reversal and the reveal, a shimmer on the key statistic.

## Check the stills

- Shadows are blue-violet or lavender, not grey, and the light reads warm.
- Brush texture shows inside flat areas of sky and land; cloud edges are soft, not vector-crisp.
- Characters are flat cels with one shadow tone and a thin brown line that varies in width.
- A mid-move still shows sky, land and foreground offset by different amounts.
- Panels and labels sit above the calm lower quarter, clear of the captions.
