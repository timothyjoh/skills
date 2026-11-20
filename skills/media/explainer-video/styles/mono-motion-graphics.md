# Mono Motion Graphics

Flat vector motion graphics on pure black with one electric yellow accent: glowing counters, block-figure crowds, app-window panels and a stamp for the twist. Confident tech-explainer energy.

| | |
|---|---|
| Engine | SVG (React) |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Claims with numbers, tech and science explainers, "is this true?" stories, anything that needs to be legible on a phone |
| Less good for | Warm, emotional or place-driven stories |
| Designed at | 9:16; at 16:9 lay panels side by side instead of stacked |

## Look

- Background pure black `#000000` with a fine dark dot grid (dots `#1a1a1a` every 36 px) and a soft central vignette.
- One accent: yellow `#E3E302`, with a soft glow (`feGaussianBlur` merged under the shape). White `#ffffff` for text, mid grey `#5A5A5A` for lines and outlines, dark panels `#141414`.
- Panels: rounded rectangles (radius about 28 px) with three small window dots in the top-left corner, like an app window.
- Figures: simple block people, a rounded-square head with a black visor slot over a tapered trapezoid body. Grey by default; the one that matters turns yellow and glows.
- Type: Poppins Bold (load with `@remotion/google-fonts/Poppins`), tabular figures for every number.
- Everything is crisp and flat: no textures, no gradients except glows and the vignette.

## Build

1. One full-frame `<svg>` per scene with `<defs>` for the dot pattern, the vignette gradient and a glow filter.
2. A `Figure` component (props: x, y, scale, lit) and a `Panel` component (props: x, y, w, h, title) reused across beats.
3. Counters: compute the shown value from `prog(frame, at(word) - n, n)` eased with `easeOutCubic`, rounded, rendered with tabular figures; a tick sound per step.
4. Lines that link figures draw on with `strokeDasharray` / `strokeDashoffset`.
5. Maps: a simplified region outline as a hand-placed path (a dozen points is enough), revealed with a clip-path wipe; spread from a pulsing dot as a growing circle clipped to the region.
6. Bars: horizontal bars that grow from the left with `backOut`, value labels counting up beside them.

## Motion and camera

- The whole frame drifts very slowly and breathes in scale (about 1 percent over several seconds).
- Every element pops in with a back-eased overshoot (`pop`, 8 to 10 frames), staggered by 2 to 4 frames in groups.
- Scene changes are fades of about 0.3 s between beats.
- The reversal gets an 8-frame shake (`kick`) and a white flash of 2 frames.

## Explainer devices

- Hook number: a huge glowing yellow counter over a grid of block figures that link up to one glowing hero.
- Evidence: the claim inside an app-window panel, typed on word by word.
- Statistic: twelve figures in a row, one lights up yellow on the number word.
- Map: a region wipes in and a yellow dot spreads across it; then horizontal bars compare sizes.
- Reversal: a tilted outlined stamp ("CASE CLOSED?") slams in and gets struck through with a yellow line.
- Payoff: the hero at the root of a tree of figures turns into an outlined figure with a question mark.

## Captions

Default captions (Poppins Bold, white with black outline, spoken word in `#E3E302`). Keep all text white or yellow on black.

## Score

```json
{ "seed": 4,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 3, 7],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -6 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -14 },
                { "kit": "synth", "db": -12 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.15 },
  "sfx": [ { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "riser", "word": "<hook number word>", "offset": -1.0, "dur": 1.0 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" } ] }
```

Replace the `<...>` placeholders with numbers in seconds or words from the script.

## Check the stills

- Only black, white, grey and the one yellow; nothing else crept in.
- Every number is readable at phone size and uses tabular figures.
- Elements sit clear of the caption area at the bottom.
- The lit figure or value is the brightest thing in its frame.
