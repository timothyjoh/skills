# Data 3D

Data journalism in three.js on near-black navy: thousands of tiny instanced figures, a glowing helix, a column map of the region, 3D bars and a node graph, with gold, cyan and red as the only light. Builds a case with numbers, then overturns it.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + `FilmPass`, HTML type layer above |
| Techniques | [instanced systems](../references/techniques.md#instanced-systems), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Statistics, studies, genetics and demography, "the numbers say" stories with a twist |
| Less good for | Warm or emotional stories, anything without numbers, places that need texture and atmosphere |
| Designed at | 9:16 at 1080x1920; at 16:9 put the map and bars wider and lower, and move labels to the side |

## Look

- Background near-black navy `#060a16`, a dark floor `#0a1124` with a faint blue grid `#13204a` every unit, fading into the dark at distance.
- Accents as glowing emissives only: gold `#ffc23d` (the hero, the claim), cyan `#4cc9f0` (science, evidence), red `#ff5470` (spread, the reversal). Dimmed figures turn slate `#55648f`.
- Figures: a tiny white person made of a capsule body and a sphere head, merged into one geometry. No faces, no detail.
- A cool hemisphere light from above and a white key light; no ink lines, no depth of field, no motion blur. Saturation up about 10 percent.
- Type in an HTML layer above the canvas: Inter, numbers at weight 800 with tabular figures, subtitles at 600, with a soft dark shadow so they hold over bright columns.

## Build

1. One `InstancedMesh` per object type (figures, beads, map columns, bars, nodes), matrices and `setColorAt` updated every frame, `frustumCulled = false`. Emissive colour on the material, per-instance colour for state (white, slate, gold, red).
2. Crowd: about 10,000 figures on a jittered grid (`hash(i)` offsets), each with a small idle sway. Rays to the hero are `LineSegments` whose end points draw on with `prog(frame, start + i * k, 10)`, about 700 of them.
3. Helix: two strands of glowing beads (instanced spheres) round a vertical axis with rungs between pairs, rotating slowly, and a translucent scan plane that sweeps up it.
4. Column map: the land is a grid of cells written in code as a string mask (one character per cell, for example one cell per 2.5 degrees), never an image file. Each land cell is a box column; height and colour come from per-cell data arrays keyed to beats.
5. Bars: 3 to 5 boxes that grow from the floor with `backOut`, values in the HTML layer at each bar's projected top (project the 3D point with the camera every frame).
6. Node graph: spheres for people and thin cylinders for links, laid out as a tree in code; nodes pop in level by level.
7. `FilmPass` with `bloom` 0.6, `bloomThreshold` 0.6, `aperture` 0 (no blur), `saturation` 1.1, `vignette` 0.3, `grain` 0.05.

## Motion and camera

- Within a beat: smooth keyed glides (crane, push, orbit) eased with `easeInOutCubic`. Between beats: hard cuts on the word that starts the next line.
- Open low in the crowd and crane up and back while the counter climbs.
- Columns rise in waves (`delay = distance * k`) and land with a small squash; colour floods outward from an origin cell.
- The reversal gets a 2-frame white flash and a `kick`, then the columns fall.

## Explainer devices

- Hook number: a huge counter in the HTML layer climbs from the first word of the line to the last over the crowd; on the link word, rays draw up from the crowd to one gold figure on a column of light, and the crowd dims to slate.
- Evidence: a lab beat with the rotating cyan helix and scan plane, the year or claim huge in cyan type beside it.
- Crowd or grid: twelve figures on a small platform under "1 in 12" (or the script's ratio); one turns gold on the number word.
- Map or diagram: top-down on the column map; the sampled region rises in gold in a sweep, then the spread floods outward in red raised columns from its origin.
- Comparison: 3D bars grow to their values with numbers floating above; the subject's bar glows red, the rest stay white.
- Reversal: back over the map with the claim tilted in type; on the reversal word, a white flash, the gold columns collapse to grey and a red strike draws across the claim.
- Payoff question: a glowing node graph under a gold root label; the root greys out, then its label swaps to a cyan question.

## Captions

Default captions (Poppins Bold 92 px, white with an 8 px black outline, spoken word in `#E3E302`), raised to clear the floor graphics: `<Captions bottom={0.17} />`. Two or three words per page.

## Score

```json
{ "seed": 4,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 3, 7],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bass", "part": "root", "octave": 1, "db": -6 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.2 },
  "sfx": [ { "type": "tick", "every": 0.07, "from": "<count start>", "to": "<count end>" },
           { "type": "riser", "word": "<key number word>", "offset": -0.8, "dur": 0.8 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "riser", "word": "<spread word>", "offset": -0.6, "dur": 0.6 },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" },
           { "type": "shimmer", "word": "<payoff word>", "dur": 2.0 } ] }
```

The arpeggio drops out for the reversal and comes back under the twist.

## Check the stills

- Only navy, white, slate and the three accents; no other hue on screen.
- The lit figure, column or bar is the brightest thing in its frame.
- Numbers use tabular figures and read at phone size; labels sit on their projected objects.
- Nothing is blurred: edges are crisp at every depth.
- The map and bars stay above the caption band.
