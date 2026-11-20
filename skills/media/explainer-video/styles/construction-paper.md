# Construction Paper

A crude construction-paper cutout cartoon: flat bright shapes with rough scissor edges, characters with big round heads, dot eyes and mitten hands, and deliberately jerky stop motion on threes. Blunt, comic and quick.

| | |
|---|---|
| Engine | Canvas + shader: `makeLayer` depth layers into one `ShaderPass` |
| Techniques | [paper-piece systems](../references/techniques.md#paper-piece-systems), [2D puppets](../references/techniques.md#2d-puppets-and-cels), [stop motion cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Comic history, absurd true stories, "you won't believe this" facts, crowds and armies |
| Less good for | Subtle emotion, elegant or premium subjects, precise diagrams |
| Designed at | 9:16; at 16:9 spread crowds sideways and put labels beside the subject rather than above |

## Look

- Construction-paper stocks: flat saturated colours with fibre speckle and slight fading. Sky `#5aa9e6`, grass `#7cc36e`, red `#e63c32`, yellow `#ffde3b`, brown `#8b5a2b`, orange `#f28c28`, black `#1d1d1d`, white, and three or four skin tones (peach, tan, brown, dark brown).
- Crude cuts: a circle is 8 to 16 straight segments; every vertex is jittered; no outlines. Overlapping pieces get a 2 px dark drop shadow.
- Characters: original designs. A big round head (about 45 percent of the figure's height), two black dot eyes, a single line or a small black shape for a mouth, mitten hands, block bodies and stubby legs. Hats, beards and props are extra pieces.
- A faint diagonal paper texture over everything; panels get a soft inner shadow.

## Build

1. Piece factory: `cutPiece(points, colour, seed)` jitters the outline, fills it, adds fibre speckle (dots 4 percent lighter and darker) and darkens a 1 px rim.
2. Puppets: head, eyes, mouth, body, arms and legs as separate pieces on pivots. Keep a pose sheet of a few named poses (stand, point, cheer, slump, ride) and snap between them with no in-betweens. Three replacement mouths for speech.
3. Crowds: a generator places hundreds of figures back to front, picking head, skin and body colours and height from `hash(i)`, scaling them down with distance toward the horizon.
4. Each beat is three layers drawn with `makeLayer`: back (sky, far hills), mid (crowd, buildings, riders) and front (grass tufts, a fence, props).
5. The `ShaderPass` composites them with:
   - parallax: layer offset by the camera at factors 0.2, 0.5 and 1.0;
   - near-layer sway (1 to 2 px sine) and a gentle sideways drift of the sky;
   - line boil at full strength: warp the UVs by noise of about 2 px whose seed steps 8 times a second (`floor(t * 8)`);
   - the diagonal paper texture and a soft vignette.

## Motion and camera

- Everything moves on threes, camera included: read `onN(frame, 3)`. Each step gets a new tiny camera offset (up to 4 px), scale (up to 0.5 percent) and rotation (up to 0.3 degrees) from `hash(beat, step)`.
- Characters jump between poses; walking and riding swap two leg poses while the whole piece slides. Riders bob 3 px on alternate steps.
- Hard cuts between beats. For a zoom on an earlier shot, cut to the same layers at 1.35x.
- Labels land on their words: Poppins ExtraBold in white with a 10 px black stroke, rotated minus 3 degrees, key words in `#ffde3b`; they fade and rise over 0.2 s.

## Explainer devices

- Hook number: a Poppins ExtraBold counter climbing to the figure over a wide shot of a crowd that runs to the horizon.
- Crowd or grid: a 6 by 2 grid of rounded paper pills pops in on threes over the zoomed crowd; on the number word the one that matters turns yellow and wobbles.
- Map or diagram: the beat's scene blurred and darkened 50 percent behind a square-cornered panel; sea `#5aa9e6`, land `#7cc36e`, 6 px black `#1d1d1d` lines. The region wipes in as yellow `rgba(255,222,59,0.9)`, a spread floods out in red `rgba(230,60,50,0.85)` from a pulsing marker, and black dots pop on.
- Comparison: stacks of paper blocks or a row of characters of different sizes.
- Reversal: the claim label gets slapped through with a yellow paper bar on the word, a camera kick and the music drops.
- Payoff: the hero is swapped for a dark cut-paper silhouette with a big question mark, and the last label changes to the question in yellow.

## Captions

Default `<Captions />` with Poppins Bold at 92 px, white with an 8 px black outline, spoken word in `#FFDE3B`, about 330 px above the bottom at 1080x1920 (`bottom` 0.17). Two or three words a page.

## Score

```json
{ "seed": 3,
  "music": { "bpm": 120, "key": "A", "scale": "minor_pentatonic", "chords": [1, 4, 5, 1],
    "layers": [ { "inst": "koto", "part": "melody", "octave": 5, "db": -6, "density": 0.6 },
                { "inst": "koto", "part": "root", "octave": 3, "db": -10 },
                { "kit": "taiko", "db": -12 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.15 },
  "sfx": [ { "type": "drum", "every": 0.2, "from": "<ride start>", "to": "<ride end>", "db": -14 },
           { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "paper", "word": "<label word>" },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "boom", "word": "<payoff word>" } ] }
```

The fast quiet `drum` run stands in for hooves or footsteps under travel; drop it where nobody is moving.

## Check the stills

- Edges are visibly rough polygons; no smooth vector curves anywhere.
- Characters have big round heads, dot eyes and mitten hands, and none resembles an existing cartoon.
- Labels are tilted minus 3 degrees with a thick black stroke and sit clear of the caption band.
- The map panel has square corners, thick black lines and the yellow region.
- Two frames from the same 3-frame step are identical.
