# Cut-Paper Collage

Stop-motion collage of real-looking paper stocks, scissor-cut or hand-torn, layered on a backing board with tape and pins and filmed under a rostrum lamp. Pieces slide, hinge and swap on twos; the film ends on the whole collage flat on the board.

| | |
|---|---|
| Engine | Canvas + shader: `Canvas2D` piece compositing, then a `ShaderPass` camera pass |
| Techniques | [paper-piece systems](../references/techniques.md#paper-piece-systems), [2D puppets](../references/techniques.md#2d-puppets-and-cels), [stop motion cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion), [multiplane camera](../references/techniques.md#multiplane-camera), [film pipeline](../references/techniques.md#the-film-pipeline) |
| Best for | Cities, nature, cosy stories, cycles and processes (a day, a season, how a thing is made) |
| Less good for | Precise data, hard-edged technology, dark or violent topics |
| Designed at | 16:9; for 9:16 build the scene as a tall stack and pan vertically instead of sideways |

## Look

- Backing board: grey `#8d8a84` card with fine felt noise and a few scuffs, always visible at the edges of wide shots.
- Paper stocks, all procedural: sugar paper (flat colour, fibre speckle, slight fading), kraft `#b08a5a` with darker fibres, newsprint `#e8e2d2` with columns of unreadable type (rows of dark dashes of random width), graph paper (cream with a pale blue grid every 12 px, heavier every 60 px), marbled paper (domain-warped noise in three colours), tissue (semi-transparent, overlaps multiply), magazine halftone (rotated dot screens) and patterned origami paper (small repeats: waves, dots, checks).
- Anchor colours across stocks: indigo `#2b2f6b`, tomato `#e2553a`, mustard `#e8b23a`, teal `#2f8f8a`, cream `#efe6d2`.
- Two cut styles: scissor-cut (a straight segment every 20 to 40 px, so curves look faceted) and torn (the outline pushed out 3 to 6 px by noise into a white fibrous deckle with a few stray fibres).
- Fixings: masking tape strips (translucent cream, torn ends), map pins (a coloured head with a highlight) and brass split-pin fasteners at every puppet joint.
- Characters are jointed cut-out puppets of original design: each limb a separate piece pinned at the joint.

## Build

1. A piece factory `makePiece({ stock, cut, outline, seed })` draws once into its own canvas (`makeLayer`, cached with `useMemo`): stock texture clipped to the outline, the white deckle behind torn pieces, and a curl (2 to 4 percent darkening along one edge plus a lifted corner).
2. Replacement shapes for swaps (sun ray wedges, character poses such as stretch, arch, crouch and leap, 4 to 6 per action) are separate cached pieces.
3. Compositing in `Canvas2D`, back to front: for each piece its contact shadow first (a dark copy offset by `lift * 6` px, blur `2 + lift * 6` px, opacity `0.35 - lift * 0.15`), then the piece. `lift` runs 0 to 1 as a piece rises off the board.
4. Three multiplane groups (back: sky bands; mid: buildings and land; front: sills, props, hero) offset by the camera at factors 0.3, 0.6 and 1.0.
5. A final `ShaderPass` is the rostrum camera: lamp falloff from an off-centre point (corners about 15 percent darker), slight softness toward the edges, a warm grade and grain re-seeded per exposure.

## Motion and camera

- On twos: every position and angle reads `onN(frame, 2)`. Add per-exposure jitter of 0.5 to 1 px and 0.2 degrees from `hash(pieceId, exposure)`, and flicker shadow opacity by 5 percent per exposure, as if each frame were re-photographed.
- Pieces slide, hinge about their pins and swap for replacement shapes; nothing morphs smoothly.
- The camera makes one designed pan across the multiplane per beat and a push-in on the hero (scale 1.0 to 1.25). Re-paper the scene band by band to change time of day.
- End on a pull-back to the whole collage lying flat on the board, tape at all four corners, as the last strip is pressed on.

## Explainer devices

- Hook number: digits cut from mixed stocks (kraft, newsprint, marbled) that land one by one; the counter swaps replacement digit pieces.
- Crowd or grid: a block of 12 window squares or paper figures; on the number word the one that matters flips from navy to mustard and gets a pin.
- Map or diagram: a torn kraft region on a graph-paper sheet; the area fills with small torn pieces laid one by one, and events are map pins pushed in.
- Comparison: stacks of paper strips that grow piece by piece.
- Reversal: a tag carrying the claim gets a strip of masking tape slapped across it, then a tomato paper bar; a 6-frame `kick` and the music drops.
- Payoff: a torn paper question mark pinned beside the hero, then the pull-back to the board.

## Captions

Draw captions with `renderPage`: each word a small scissor-cut label of cream sugar paper with a soft shadow, the spoken word on mustard `#e8b23a` paper lifting 4 px. Text in a sturdy sans such as Poppins Bold, dark indigo. Keep labels inside the bottom fifth of the frame.

## Score

```json
{ "seed": 5,
  "music": { "bpm": 96, "key": "F", "scale": "major_pentatonic", "chords": [1, 6, 4, 5],
    "layers": [ { "inst": "musicbox", "part": "melody", "octave": 5, "db": -6, "density": 0.55 },
                { "inst": "pluck", "part": "arp", "octave": 4, "db": -14, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -12 },
                { "kit": "soft", "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.2 },
  "sfx": [ { "type": "paper", "every": 0.167, "from": "<build start>", "to": "<build end>" },
           { "type": "pop", "word": "<hook number word>" },
           { "type": "chime", "word": "<key number word>" },
           { "type": "whoosh", "word": "<leap or move word>", "dur": 0.6 },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "thud", "word": "<payoff word>" } ] }
```

Schedule a paper rustle for every piece that lands or swaps, from the same build list the scene uses; keep them quiet.

## Check the stills

- Every piece shows a stock texture and a cut edge (facets or white deckle); there are no flat vector fills.
- Each piece has a contact shadow, larger and softer under lifted pieces.
- Newsprint type is unreadable dashes, never real words.
- Corners are darker than the centre (lamp falloff) and grain is visible.
- The final wide shows the whole collage on the board with tape at all four corners.
