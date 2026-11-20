# Flat Vector Science

Flat vector illustration on deep navy: bold geometric shapes, vivid gradients, soft glows and long shadows, and cute rounded creatures with no mouths. A clean science-explainer look for big numbers and how things work.

| | |
|---|---|
| Engine | SVG (React) |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [2D puppets and cels](../references/techniques.md#2d-puppets-and-cels), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Science, space, biology, big numbers, scale comparisons |
| Less good for | Warm human stories, period detail, comedy that needs facial acting |
| Designed at | 9:16; at 16:9 put the diagram beside the scene instead of over it |

## Look

- Background: deep navy, a radial gradient from `#1a2150` at the centre to `#0b0f2a` at the edges, with a faint field of tiny dots (10 to 30 percent white) for depth.
- Shapes: bold geometry (circles, rounded rects, triangles, arcs) filled with vivid linear gradients: amber `#ffb547` to `#ff7a45`, pink `#ff5678` to `#b13cff`, teal `#2de2c8` to `#2a7fff`; indigo `#2c3a8c` for land and panels.
- No outlines: shapes separate by colour and glow.
- Light: a soft glow (`feGaussianBlur` merged under the shape) behind anything bright; long shadows at 45 degrees, a darker band fading to transparent.
- Creatures: original, cute and rounded (a bean or rounded rect body, stub limbs), two oval eyes with one white highlight each, no mouths. They show feeling with eyes, tilt and squash.
- Labels: Poppins Bold in white with a soft dark shadow; accent amber `#ffb547`.

## Build

1. `<defs>`: one gradient per palette pair, a glow filter, and a long-shadow polygon per shape: the shape's corners pushed 300 to 500 px along (1, 1), filled with a gradient from 35 percent navy-black to transparent.
2. A `Creature` component (props: x, y, scale, hue, look, squash, lit). Eye direction and blinks are swapped drawings; body moves on twos.
3. Every scene in three depth groups (far dots and planets, mid scenery, near subjects) for parallax.
4. Science props from repeated primitives: cells as nested circles, molecules as gradient spheres on lines, a helix as rungs of ellipses whose phase advances per rung, planets with a glow and a ring arc.
5. Counters use tabular figures (`fontVariantNumeric: "tabular-nums"`).
6. No boil, no grain: crisp vector with a soft vignette only.

## Motion and camera

- A slow pan-and-zoom per beat: zoom 1.02 to 1.12 with a sideways pan whose direction alternates every beat; far, mid and near groups move at 0.3, 0.6 and 1.0.
- Transitions: a 0.4 s circle wipe from the centre.
- Elements pop in with `backOut`, staggered 3 frames; glows breathe gently (5 percent on a slow sine).
- The reversal gets a 6-frame `kick`.

## Explainer devices

- Hook number: a large white counter with an amber glow over a wide establishing scene, such as a field of creatures stretching away in perspective, smaller and darker with distance.
- Hero: one larger creature, lit by a rim glow, with the name label.
- Statistic: a 6 by 2 grid of rounded indigo pill tokens pops in; one fills amber and glows on the number word.
- Map or diagram: the scene blurs (`feGaussianBlur` stdDeviation 14) and darkens behind a rounded navy panel `#13183f`: indigo land, periwinkle 2 px outlines `#7f8cff`. An amber region wipes in, a pink area floods out from a pulsing marker, amber dots pop on their word.
- Comparison: gradient bars or spheres that grow to their values with counters beside them.
- Reversal: the claim as a label; an amber bar strikes through it on the reversal word and the music drops out.
- Payoff: the hero creature fades to an outline glow with a question mark inside; the question label in amber.

## Captions

`<Captions highlight="#FFB547" />`: Poppins Bold, white with a black outline, the spoken word in amber.

## Score

```json
{ "seed": 11,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 7, 5],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -8 },
                { "inst": "drone", "part": "chord", "octave": 3, "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.2 },
  "sfx": [ { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "riser", "word": "<key number word>", "offset": -1.0, "dur": 1.0 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "riser", "word": "<spread word>", "dur": 1.2 },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" },
           { "type": "shimmer", "word": "<payoff word>", "db": -4 } ] }
```

A dark synth arpeggio over a deep bass. Ticks while the counter climbs, a riser into the key number with a shimmer on it, a record scratch on the reversal, a low stab on the twist and a long shimmer on the payoff.

## Check the stills

- The background is deep navy; no pure black, no white grounds.
- No outlines; the main shapes carry gradients and the bright ones glow.
- Long shadows all fall at the same 45 degree angle.
- Creatures have eyes but no mouths.
- Amber marks the one thing that matters in each frame.
