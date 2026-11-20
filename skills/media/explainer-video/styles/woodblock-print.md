# Woodblock Print

An animated woodblock print: flat shapes cut into three plates and printed through a shader with slight misregistration, wood grain and paper fibre. Storm seas with clawed foam, banded clouds and one red sun, moving on twos like a print that has come to life.

| | |
|---|---|
| Engine | Canvas + shader: `makeLayer` plates into one `ShaderPass` |
| Techniques | [printing plates](../references/techniques.md#printing-plates-canvas-layers-through-a-medium-shader), [cadence on twos and threes](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | History, nature, weather, the sea, voyages, any story with one big natural event |
| Less good for | Dense data beats, modern technology, close facial acting |
| Designed at | 16:9; for 9:16 stack the picture (sky and wave above, boats below) and keep the printed border on all four sides |

## Look

- Strictly flat and 2D. Never fake depth with shading; the only gradient allowed is the graded ink wipe across the top of the sky (light at the horizon, dark at the top edge), printed from the light block.
- Palette: cream paper `#f1e6cf`, pale blue-grey `#a9b8c2`, Prussian blue `#1f3a5f`, indigo `#14213d`, key-line black `#1b1b22`, and one red `#c8402f` kept for the sun, the seal and whatever the narration singles out.
- Water, cloud and wind are bold stylised shapes: wave crests curl over into rows of clawed foam fingers with flung foam dots; clouds are stacked rounded bands outlined in the key line; wind is a set of parallel curved strokes.
- The print sits on a sheet with a 40 px plain border and a deckled outer edge, on a dark mount `#2a2420`. A cartouche (a small bordered box, top right) holds labels; a red rectangular seal with invented, illegible marks sits in a corner.
- People and boats are small and simple: flat fills inside a key line, original designs, no recognisable print recreated.

## Build

1. Three plates, each a `makeLayer` canvas at frame size drawn as greyscale masks: the light block (pale blue-grey areas and the sky wipe), the deep block (Prussian blue in R, indigo in G, the red in B) and the key block (all outlines, foam fingers, wind lines, fine detail).
2. Shapes are closed paths of a few Bezier curves. A wave is a spine curve with 8 to 14 fingers along its crest; each finger is a short hook whose curl and length are parameters, so the crest can grow, claw and collapse by animating them.
3. The `ShaderPass` prints the plates in order (light, deep, key) by multiplying each ink colour onto the paper:
   - misregistration: each plate's UV is offset 1 to 3 px by `hash(plate, drawing)`, a new print every drawing;
   - wood grain: ink density inside flat areas is modulated 8 to 12 percent by noise stretched about 12 to 1 along a fixed grain direction per plate, plus faint ring lines from a slow sine;
   - uneven ink: low-frequency blotch noise between 0.85 and 1.0 density, heavier toward plate edges;
   - paper fibre: fine noise and a few long thin fibres that lighten the ink; this layer never moves;
   - sheet: a noisy rectangle mask for the deckle, the border left as bare paper.
4. The key block prints last and slightly heavier, so it always sits on top.

## Motion and camera

- Plates redraw on twos (`onN(frame, 2)`); the sea and foam on threes. Misregistration and ink unevenness re-seed per drawing; the paper fibre stays fixed because the paper does not move.
- The camera is mostly locked, as if looking at a print on a wall: a slow slide of the sheet of 1 to 2 percent on ones per beat, never a 3D move.
- The one big event (a wave rising, curling and breaking) takes about 1.5 s: fingers lengthen, curl over and fall on the spoken word, with a 6-frame `kick`.
- Scene changes reprint: on a beat start the light block appears, then the deep block 6 frames later, then the key block 6 frames after that. A new sheet can also slide in over the old one.

## Explainer devices

- Hook number: large numerals cut into the key block and printed in the sky or in the cartouche; the counter steps on twos so it reads as successive prints.
- Crowd or grid: twelve small boats or figures in a 6 by 2 grid; on the number word the one that matters reprints in red.
- Map or diagram: a coastline in key line with the graded sky wipe for sea; the region fills with the deep block in a wipe, red seal dots stamp on where things happened.
- Comparison: wave crests or cloud bands of different heights side by side, each rising to its value.
- Reversal: the claim sits in the cartouche; on the word a thick red brush bar strikes it through, the plates jump 8 px out of register for two drawings and the music drops.
- Payoff: the storm clears to an empty sea under the red sun, with a carved question mark in the cartouche held for the final line.

## Captions

Use `<Captions />` with a bold serif (for example Shippori Mincho B1 at weight 800 via `@remotion/google-fonts/ShipporiMinchoB1`), cream `#f1e6cf` with an indigo `#14213d` outline, spoken word in the red `#c8402f`. Keep captions in the bottom border and margin, off the wave. For a closer fit, draw words into the key block with `renderPage` so they print with the same misregistration.

## Score

```json
{ "seed": 11,
  "music": { "bpm": 84, "key": "D", "scale": "in_sen", "chords": [1, 4, 1, 5],
    "layers": [ { "inst": "koto", "part": "melody", "octave": 5, "db": -6, "density": 0.4 },
                { "inst": "flute", "part": "melody", "octave": 5, "db": -12, "density": 0.25 },
                { "inst": "drone", "part": "chord", "octave": 2, "db": -16 },
                { "kit": "taiko", "db": -10 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.3 },
  "sfx": [ { "type": "water", "at": 0, "dur": "<film length>", "db": -8 },
           { "type": "wind", "word": "<storm word>", "dur": 3.0, "db": -10 },
           { "type": "drum", "word": "<wave breaks word>" },
           { "type": "stamp", "word": "<lit element word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "boom", "word": "<payoff word>" } ] }
```

Sparse wooden percussion: taiko on the big moments, a stamp for each seal, sea and wind ambience underneath.

## Check the stills

- A sliver of misregistration is visible at some key-line edges (colour or bare paper peeking out beside the black line).
- Wood grain shows inside the large flat blues; paper fibre shows in the cream.
- Only the five print colours plus the red, and the red appears in at most two places.
- Wide shots show the border and deckled sheet edge; nothing is shaded like a 3D object.
