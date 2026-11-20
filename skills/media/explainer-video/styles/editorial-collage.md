# Editorial Collage

A documentary explainer made of torn paper, halftone photo cutouts and risograph grain in cream, black and one vivid red. Serious and graphic: each beat is a new sheet laid onto the desk.

| | |
|---|---|
| Engine | Canvas + shader: `makeLayer` plates and pieces into one `ShaderPass` |
| Techniques | [paper-piece systems](../references/techniques.md#paper-piece-systems), [printing plates](../references/techniques.md#printing-plates-canvas-layers-through-a-medium-shader), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Documentary, politics, economics, history with evidence, "the record shows" stories |
| Less good for | Playful or cosy topics, colour-coded data with many series |
| Designed at | 9:16; at 16:9 lay the photo cutout on one side and the panel or label stack on the other |

## Look

- Three inks only: cream paper `#f4ecd8`, black `#111111` and red `#e1251b`. Greys exist only as halftone dots of black.
- "Archival photos" are drawn, never loaded: tonal scenes (soft gradient skies, figures as shaded silhouettes, blurred crowds) rendered in greyscale and then screened as halftone, so they read as clippings from old newspapers. Each is cut out with a torn white edge.
- Torn paper shapes: red and black bands, cream label boxes, with white fibrous deckle edges and soft drop shadows (6 px down-right, blur 8 px, 25 percent black).
- Risograph print: each ink a separate plate with slight misregistration, multiply overprint where red meets black, horizontal roller banding, rare pinholes and fine grain.

## Build

1. For each beat draw three depth layers with `makeLayer`: back (sky or wall, mostly tonal), mid (the photo cutout subject) and front (torn bands, labels, props).
2. Within each layer keep two plates: black (tonal content in greyscale plus solid shapes) and red (solid shapes plus a coarse screen for tints).
3. The `ShaderPass` prints them:
   - halftone: a dot screen at 45 degrees with a 6 to 8 px cell on the black plate and 15 degrees on the red, dot size from the plate value;
   - misregistration 1 to 2 px per plate, re-seeded per drawing;
   - roller banding: horizontal density bands of 3 to 5 percent from slow 1D noise;
   - paper fibre and grain on top, then the drop shadows of the torn pieces.
4. Parallax in the same pass: layer offsets at factors 0.3, 0.6 and 1.0 of the camera, a very slight sideways drift on the back layer and a 1 px sway on the front.
5. Line boil at half strength: a noise warp of about 1 px whose seed steps 8 times a second.

## Motion and camera

- Each beat is one slow pan-and-zoom: zoom from 1.02 to 1.12 across the beat with a sideways pan of 3 to 4 percent that alternates direction from beat to beat.
- Transitions: the next beat slides in from the right over 0.35 s with a 4 degree tilt that settles to 0 and a drop shadow on its leading edge, like a new sheet laid on the pile.
- Labels land on their words: Lora Bold black `#111111` on a torn cream box `#f4ecd8` rotated minus 1.5 degrees, key words in red; they fade and rise over 0.2 s.
- Graphic marks (underlines, circles, arrows) draw on in red with `strokeDashoffset`-style growth over 8 to 12 frames.

## Explainer devices

- Hook number: big Lora Bold numerals on a torn cream strip over a wide halftone crowd; the counter climbs with ticks, the last digit settling in red.
- Crowd or grid: a 6 by 2 grid of rounded pill tokens screened in grey; on the number word the one that matters prints solid red.
- Map or diagram: the beat behind blurred and darkened under a rounded panel with cream sea `#efe6d0`, tan land `#d8cdb0` and 3 px black lines. The region wipes in red `rgba(225,37,27,0.75)`, a spread floods out as black `rgba(17,17,17,0.55)` from a pulsing marker, and red dots pop on.
- Comparison: torn red bars of different lengths pasted down one after another.
- Reversal: the claim on a cream box is struck through by a red torn bar on the word; the music drops out.
- Payoff: a halftone silhouette with its face torn away, and the closing label replaced by the question in red.

## Captions

Default `<Captions />` with Lora Bold (`@remotion/google-fonts/Lora`) at 92 px, white with an 8 px black outline, spoken word in `#E1251B`, about 330 px above the bottom at 1080x1920. Two or three words a page.

## Score

```json
{ "seed": 4,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 3, 7],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -6 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -16 },
                { "kit": "lofi", "db": -16, "swing": 0.1 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.15 },
  "sfx": [ { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "riser", "word": "<key number word>", "offset": -0.8, "dur": 0.8 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "paper", "word": "<each new beat word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" } ] }
```

Add a quiet `paper` slide on each beat transition so the sheets have weight.

## Check the stills

- Only cream, black and red, with greys made of visible halftone dots at full size.
- Photo cutouts read as screened clippings with torn white edges, not as smooth renders.
- Every torn piece has a soft drop shadow and a fibrous edge.
- Labels are tilted minus 1.5 degrees on cream boxes and sit clear of the caption band.
