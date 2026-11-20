# Watercolour

Loose wet-on-wet watercolour on cold-press paper: soft bleeding washes, pigment blooms, darker drying edges and white paper left for light, in muted earth colours with splashes of crimson. The camera drifts like a slow breath.

| | |
|---|---|
| Engine | Canvas + shader: `makeLayer` pigment masks into one `ShaderPass` |
| Techniques | [printing plates](../references/techniques.md#printing-plates-canvas-layers-through-a-medium-shader), [stroke engines](../references/techniques.md#stroke-engines), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Gentle history, travel, nature, landscapes, reflective or human stories |
| Less good for | Hard data, technology, fast comedy |
| Designed at | 9:16; at 16:9 widen the landscape and let the sky drift carry the frame |

## Look

- Paper: cold-press `#f6efe2` with visible tooth (noise used as a light bump and as a mask that breaks thin washes).
- Palette: raw umber `#7a5c3e`, ochre `#c8a464`, sage `#8a9a74`, slate blue `#6b7f99`, grey violet `#8b7f96`, dark umber `#3a2418` for the darkest accents, and crimson `#a3172b` in small splashes only.
- Washes bleed softly into each other; where a wash ends its edge dries darker; blooms (cauliflower-shaped backruns) appear in a few large areas; pigment granulates in the blues and umbers.
- Figures and details are a few loose brush marks and dry-brush strokes over the washes; no outlines, and highlights are bare paper.

## Build

1. Each scene is a set of soft greyscale masks, one per pigment (sky, land, figures, crimson), drawn with `makeLayer`. Keep shapes simple; the shader does the painting.
2. The `ShaderPass` paints each pigment and multiplies it onto the paper:
   - bleed: sample the mask through a domain-warped UV (6 to 12 px of noise) and blur it, so edges feather unevenly;
   - wet edge: darken where the mask minus its blur is positive, about 25 percent;
   - granulation: fine noise that varies density more where the wash is thin;
   - blooms: two or three noisy radial rings per large wash, placed by `hash(scene, i)`;
   - tooth: lower density on the paper's high points so dry areas break up.
3. A stroke engine adds the loose detail: dry-brush streaks and figure marks clipped to their shapes, positions from `hash(shapeId, i, onN(frame, 3))`. Crowds are many small vertical dabs of varied pigment.
4. Multiplane: sky, far, mid and near layers offset by the camera at 0.2, 0.4, 0.7 and 1.0. The sky drifts sideways at a full, visible pace (about 20 px a second); the near layer sways 2 px.
5. Light line boil: a noise warp under 1 px whose seed steps 8 times a second.
6. Overlay: a warm paper texture, a deep inner bleed around the frame (a noisy blurred border of umber at about 30 percent) and fine grain.

## Motion and camera

- Each beat is a slow dreamy drift: zoom eases from 1.06 to 1.14, a gentle sideways sine sway (about 1.5 percent of width over 6 s) and a slow rise of about 2 percent of height.
- Transitions: a 0.8 s bleed. The next scene opens through a soft radial mask that blooms from a point with a noisy edge, a darker wet rim and a blur that clears as it grows.
- Washes paint in on their words: a mask grows outward with a noisy edge over 10 to 20 frames, its wet edge leading.
- Labels on their words: Lora Bold Italic in dark umber `#3a2418` on a soft paper box `rgba(250,244,232,0.78)`, key words in crimson; they fade and rise over 0.2 s.

## Explainer devices

- Hook number: Lora Bold Italic numerals in umber on a paper box over a wide wash of a crowd or landscape; the counter climbs as the wash spreads.
- Crowd or grid: a 6 by 2 grid of pill tokens as small grey-violet washes; on the number word the one that matters blooms crimson.
- Map or diagram: the beat behind blurred and darkened under a rounded panel of warm paper `#f6efe2` with translucent umber land and 2.5 px brown lines `#5b4632`. The region bleeds in as crimson `rgba(163,23,43,0.45)`, a spread floods out as indigo `rgba(80,70,140,0.35)` from a pulsing marker, and crimson dots bloom.
- Comparison: vertical washes of different heights painted up from a baseline.
- Reversal: a dry-brush crimson stroke dragged across the claim on the word, with a deep drum and the music thinned.
- Payoff: the hero dissolves back into wet paper, leaving the question in crimson.

## Captions

Default `<Captions />` with Lora Bold at 92 px, white with an 8 px black outline, spoken word in `#A3172B`, about 330 px above the bottom at 1080x1920. For a softer finish, `renderPage` can draw dark umber words on a paper box with the spoken word in crimson.

## Score

```json
{ "seed": 8,
  "music": { "bpm": 72, "key": "A", "scale": "minor_pentatonic", "chords": [1, 4, 1, 5],
    "layers": [ { "inst": "flute", "part": "melody", "octave": 5, "db": -6, "density": 0.35 },
                { "inst": "koto", "part": "root", "octave": 3, "db": -10 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -18 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.1 } ], "reverb": 0.4 },
  "sfx": [ { "type": "wind", "at": 0, "dur": "<film length>", "db": -12 },
           { "type": "drum", "word": "<hook word>" },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "drum", "word": "<reversal word>" },
           { "type": "swell", "word": "<payoff word>", "offset": -0.8, "dur": 1.5 },
           { "type": "boom", "word": "<payoff word>" } ] }
```

Breathy flute over slow low plucks; deep hits only on the hook, the reversal and the reveal.

## Check the stills

- Wash edges are soft and feathered, with a darker dried rim where a wash ends.
- Paper tooth and bare white paper are visible; there are no hard vector edges.
- Earth colours dominate; crimson appears only on the accent and labels.
- Labels sit on soft paper boxes, legible, and clear of the caption band.
