# Map Desk

A documentary investigation shot from above on a vintage map table: parchment maps, red marker lines, push pins joined by red string, taped photos and clippings, all under one warm desk lamp. Typewriter labels on taped parchment carry the words.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + `FilmPass`, canvas textures for every paper, HTML label layer above |
| Techniques | [paper-piece systems](../references/techniques.md#paper-piece-systems), [film pipeline](../references/techniques.md#the-film-pipeline), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Geography, investigations, history, migrations and routes, "where did it start" stories |
| Less good for | Abstract tech, the future, fast action |
| Designed at | 9:16 at 1080x1920, subject in the middle, calmer lower quarter; at 16:9 the table runs wide and the camera slides sideways between areas |

## Look

- One big table: dark wood (a canvas wood-grain texture, `#3a2618` to `#5b3a22`) with a brown leather blotter `#6b4a2c` under the main map.
- Paper: every sheet is a slightly curled plane (a few vertices lifted by noise at the corners) with a `CanvasTexture` drawn in code: parchment `#ead9b0` with fibre noise, foxing spots, a coffee ring, fold creases (a darker line plus a matching bump in a canvas normal map).
- Maps: coastlines and borders as hand-placed paths in brown `#5a4630`, hatched seas, an invented compass rose, place names as short strokes of illegible script.
- Photos: instant-print frames (white border, thick bottom) whose pictures are drawn in code as sepia duotone scenes from simple shapes and silhouettes. Clippings: newsprint with grey bars for unreadable type and an invented masthead of glyphs.
- Pins: a glossy red `#c8102e` sphere head on a thin steel needle, each casting a long lamp shadow. String: red, slightly fuzzy, sagging between pins.
- Tape: translucent cream strips with torn ends (noisy alpha edge) over the corners of photos and labels.
- Lamp: a warm spotlight `#ffd59a` from one corner, penumbra 0.6, with a soft fall-off into dark table edges. Props: a magnifying glass (chrome ring, glass lens), a tea cup, a pencil.

## Build

1. A paper factory: `makePaper({ w, h, stock, draw })` returns a curled plane with its own canvas texture and bump map; `draw` paints the map, photo or clipping onto the stock. Create sheets once in `useMemo`.
2. Lay every beat's material out on one table in areas (crowd photo board, hero portrait, lab clipping, main map, case folder, site photos, family tree board) so the film is one continuous desk.
3. Pins are a merged sphere and cylinder in an `InstancedMesh`. String is a `TubeGeometry` along a sagging curve between two pins; draw it on by growing `setDrawRange` from the first pin.
4. Marker lines are drawn into the map's canvas each frame up to `prog(frame, at(word), n)`, with a slight wobble from `hash`, darker ink pooling at stroke ends, and red pencil hatching for filled regions.
5. Lighting: the spotlight with `VSMShadowMap` shadows, a dim warm fill, nothing else. `FilmPass`: `focus` on the table, `aperture` 6 (the camera is tilted, so the far edge softens), `bloom` 0.25, `vignette` 0.55, `grain` 0.22, `highlightTint` warm `[1.0, 0.86, 0.66]`, `shadowTint` brown `[0.25, 0.17, 0.11]`.
6. Labels in an HTML layer above: uppercase bold Courier Prime in dark brown `#1b1410` on a parchment box `rgba(240,226,180,0.94)` rotated minus 2 degrees, with a strip of tape across the top. Accent red `#c8102e`. Labels fade and rise in over 0.2 s.

## Motion and camera

- The signature is a slow push and slide from above: the camera looks almost straight down (tilted 5 to 10 degrees off vertical so pins stand up and cast shadows), lowers by about 10 percent over the beat while sliding sideways, alternating direction every beat.
- Real depth replaces the flat parallax: pins, string and the magnifying glass sit above the paper and shift against it as the camera moves.
- Transitions are 0.4 s cross dissolves. Mount the outgoing and incoming shots as two overlapping `<Sequence>`s, each its own `ThreeCanvas`, and fade the top one; or slide across the table to the next area for a cut-free move.
- The reversal: the lamp flickers twice and the camera kicks.

## Explainer devices

- Hook number: a wide establishing view of a photo board of a crowd; the counter is typed onto a taped parchment label and climbs on its words.
- Crowd or grid: a 6 by 2 grid of paper tokens (or pins in a card) on a closer view; on the number word one turns red and gets circled in marker.
- Evidence: a clipping or lab photo under the magnifying glass, the year and claim on labels.
- Map or diagram: the main map in its leather surround; the region fills with red pencil hatching in a wipe on its word, pins push in with a small bounce, red marker arcs draw out from a pulsing pin to the edges of the spread.
- Comparison: strips of paper torn to length and laid side by side as bars, values written in marker.
- Reversal: a case folder labelled with the claim; a red marker strike draws across it on the reversal word.
- Payoff question: a family-tree board of photos joined by string; the root photo flips to its blank back and a red marker question mark draws on.

## Captions

`<Captions fontFamily="Courier Prime" size={92} outlineWidth={8} highlight="#C8102E" bottom={0.17} />`: white with a black outline, two or three words per page, the spoken word in red. Load the font with `@remotion/google-fonts/CourierPrime`.

## Score

```json
{ "seed": 17,
  "music": { "bpm": 72, "key": "A", "scale": "minor_pentatonic", "chords": [1, 4, 1, 5],
    "layers": [ { "inst": "flute", "part": "melody", "octave": 5, "db": -8, "density": 0.4 },
                { "inst": "koto", "part": "root", "octave": 2, "db": -10 },
                { "inst": "drone", "part": "chord", "octave": 2, "db": -18 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.1 } ], "reverb": 0.35 },
  "sfx": [ { "type": "drum", "at": 0 },
           { "type": "drum", "word": "<hero word>" },
           { "type": "typewriter", "word": "<first label word>", "dur": 0.6 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "paper", "word": "<map word>" },
           { "type": "stamp", "word": "<claim word>" },
           { "type": "drum", "word": "<reversal word>" },
           { "type": "boom", "word": "<payoff word>" } ] }
```

Deep drum hits on the hook, the reversal and the reveal; a `pop` or `paper` sound wherever a pin or sheet lands.

## Check the stills

- It reads as a photographed desk: warm lamp pool, dark edges, real pin shadows on the paper.
- Paper shows fibre, creases and curl; nothing is a flat untextured rectangle.
- Only parchment, wood, brown and one red; the red is reserved for pins, string, marker and the accent.
- Every readable word is a label or caption; maps and clippings carry only invented script.
- The lower quarter is calm (plain paper or table) so captions hold.
