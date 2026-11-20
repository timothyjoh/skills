# Ink Scroll

A sumi-e handscroll unrolled sideways: brushed ink figures, translucent washes and red seals on warm rice paper, with the camera gliding from panel to panel. Quiet and scholarly, with one sharp ink slash for the twist.

| | |
|---|---|
| Engine | SVG (React) |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [stroke engines](../references/techniques.md#stroke-engines), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Calm history, philosophy, timelines, lineages and family trees, slow reveals |
| Less good for | Fast comedy, modern tech, anything that needs more colour coding than ink and one red |
| Designed at | 9:16 with 1080 px panels; at 16:9 make each panel 1920 px wide and set text beside the picture instead of above it |

## Look

- Paper: warm rice paper `#efe4cc` with a fibre grain (low-frequency `feTurbulence`, multiplied at about 12 percent) and a brown inner vignette (`#6b4a2a` at 25 percent at the edges).
- Ink: near-black `#161310` for main strokes, `#3b342c` for secondary lines, translucent brown washes (`#5a4630` at 15 to 35 percent) for land, mountains and shadow. Seal red `#b3261e` is the only colour, kept for the hero, the key figure and the twist.
- Brushed edges: every ink shape goes through one shared filter, `feTurbulence` (baseFrequency about 0.04, 2 octaves) into `feDisplacementMap` (scale 4 to 6), so lines swell and fray like a loaded brush. Washes get a larger displacement (scale 14) and a 2 px blur so they pool and bleed.
- Figures: tiny brush people, a dot head and a three-stroke body; the hero gets a hat and robe silhouette. Instruments, maps and objects are a few confident strokes, never solid fills.
- Seals: square or round red stamps with two to four heavy serif characters (Noto Serif SC, weight 900) checked for meaning, or abstract seal glyphs when unsure. A speckle mask (thresholded turbulence) knocks small paper-coloured holes in them so they look pressed.
- Type: Lora Bold in ink for titles and numbers, Lora Italic for subtitles; numbers turn red when they are the point.
- Behind everything: washed mountain ridges in two or three translucent layers along the whole scroll, and a red sun disc that can sit in a top corner until the twist.

## Build

1. One long `<svg>` scroll, N panels wide (N = beat count, usually 6 or 7), each panel the frame width. One panel per beat; the camera is a `translate` on the scroll group.
2. A `Brush` filter in `<defs>` wrapping every ink group. Change its turbulence `seed` every third frame (from `onN(frame, 3)`) for a faint living boil.
3. Strokes draw on with `strokeDasharray` / `strokeDashoffset` over 8 to 15 frames from their word; set `pathLength={1}` so the dash maths is the same for every path.
4. Washes reveal through a clip-path wipe (a rect growing east to west, or a circle growing from a point) under the wash filter.
5. Seals stamp: scale 1.4 to 1 over 4 frames, one frame at 0.96, then settle, with a faint red bleed ring that fades over 10 frames.
6. Splatter for the reversal: 20 to 30 seeded dots (`rng`) of varied radius thrown along the slash direction, all through the brush filter.

## Motion and camera

- The camera glides to the next panel at each beat start: 0.7 s with `easeInOutCubic` and a slight vertical sway (sine, about 6 px). Between glides it rests; only the panel's contents move.
- Parallax: the mountain layer moves at a quarter of the camera speed; the paper grain stays fixed to the frame.
- Figures arrive with a small `pop` (6 frames, little overshoot). Ink settles; it does not bounce.
- The reversal gets an 8-frame `kick` and nothing else. No flashes in this style.

## Explainer devices

- Hook number: a large Lora counter climbing to the figure over a crowd of 40 to 60 tiny brush figures; ink threads draw from each to one point, the hero appears there and their red seal stamps above.
- Evidence: a huge date in ink numerals, and the instrument of discovery drawn stroke by stroke on its word.
- Statistic: a row of brush figures pops in; one turns seal red on the number word.
- Map: the outline draws itself, a brown wash wipes across the region, then a red wash spreads from the origin. For sizes, hanging scroll banners unroll to their values as a bar chart, the important one red.
- Reversal: the claim on a card hung between two scroll rods; a red seal stamps on it, then one thick ink slash cuts across with splatter on the reversal word.
- Payoff: the hero's seal fades and a red seal with a question mark stamps in its place, the closing words in red italics.

## Captions

Default captions work and stay legible on the pale paper. For a tighter fit, `renderPage` in Lora Bold ink `#161310` with a paper-coloured outline and the spoken word in seal red.

## Score

```json
{ "seed": 12,
  "music": { "bpm": 72, "key": "A", "scale": "minor_pentatonic", "chords": [1, 4, 1, 5],
    "layers": [ { "inst": "flute", "part": "melody", "octave": 5, "db": -6, "density": 0.4 },
                { "inst": "koto", "part": "root", "octave": 3, "db": -10 },
                { "inst": "drone", "part": "chord", "octave": 2, "db": -18 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.1 } ], "reverb": 0.35 },
  "sfx": [ { "type": "drum", "at": 0 },
           { "type": "drum", "word": "<hero name word>" },
           { "type": "stamp", "word": "<seal word>" },
           { "type": "shimmer", "word": "<key statistic word>" },
           { "type": "whoosh", "word": "<reversal word>", "dur": 0.3 },
           { "type": "drum", "word": "<reversal word>" },
           { "type": "boom", "word": "<payoff word>" } ] }
```

Breathy flute phrases over slow low plucks. Deep drum hits on the hook, the reversal and the reveal, a stamp under every seal, and a soft shimmer on the key statistic.

## Check the stills

- Only paper, ink, brown wash and seal red; no other hue crept in.
- Edges look brushed (frayed, uneven), not vector-crisp.
- A mid-glide still shows the mountains offset less than the panel contents.
- Seals show speckle holes, and red marks the one thing that matters in each panel.
