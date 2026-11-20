# Retro-Futurism

An atomic-age poster come to life: gouache flats and airbrushed gradients, rounded chrome shapes, starbursts and ringed planets in teal, cream and orange, with halftone print grain. Optimistic, clean and smooth.

| | |
|---|---|
| Engine | SVG + shader: SVG path data drawn into canvas layers for a `ShaderPass`, with labels and panels in an SVG overlay |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [printing plates](../references/techniques.md#printing-plates-canvas-layers-through-a-medium-shader), [multiplane camera](../references/techniques.md#multiplane-camera), [film pipeline](../references/techniques.md#the-film-pipeline), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Space, inventions, transport, "the future that was", big optimistic claims |
| Less good for | Grim or intimate stories, organic nature subjects |
| Designed at | 9:16; at 16:9 put the hero object on one third and the starburst or planet on the other |

## Look

- Palette: deep teal `#0e3b43`, mid teal `#2a7c7f`, cream `#f5e6c8` and `#fff3dc`, orange `#ff8a1f`, a warm red `#e84830` for spreads only, and chrome built from these.
- Gouache: flat fills with a faint brush-density variation. Airbrush: soft sprayed gradients on spheres, rockets, horizons and glows, with a fine speckle at their edges.
- Chrome: a gradient with a hard horizon line (sky band of cream and teal above, a dark teal band below, a sharp white highlight), on rounded shapes only.
- Shapes: finned rockets, domes, boomerangs, atom orbits, starbursts, parabolic arches, ringed planets, streamlined cars and trains. People are long-limbed and simplified, in flat colour with chrome helmets; all original.
- Print finish: halftone grain, faint scanlines, red and cyan fringes at strong edges, a vignette.

## Build

1. Author every shape as SVG path data. For the painted layers, draw the paths into `makeLayer` canvases with `new Path2D(d)`: one mask per flat colour, plus airbrush masks (shapes drawn and blurred 20 to 60 px).
2. Keep labels, counters and panels in an SVG overlay above the `ShaderPass`, so text stays crisp.
3. The `ShaderPass` paints the poster:
   - gouache: flat colour per mask, density varied 3 to 5 percent by low-frequency noise;
   - airbrush: blurred masks plus fine stochastic speckle where the gradient fades;
   - halftone print grain over the whole image (fine dots, 4 px cell);
   - scanlines every 3 px at 6 percent, red and cyan fringes (R and B sampled 1 to 2 px apart, growing toward the frame edge), grain and a vignette.
4. Multiplane: sky (stars, planet), far (domes, mountains), mid (the subject) and near (a railing, foliage, a console) offset at 0.2, 0.4, 0.7 and 1.0 of the camera. The sky drifts sideways at a medium pace; the near layer sways 1 to 2 px.
5. No line boil: edges stay clean like a printed poster.

## Motion and camera

- Each beat is a slow pan-and-zoom: zoom 1.02 to 1.12 with a sideways pan of 3 to 4 percent that alternates direction from beat to beat.
- Motion is smooth on ones: rockets glide on eased arcs, orbits spin, starburst rays rotate slowly, glows pulse.
- Transitions: a 0.45 s iris wipe that opens from the centre, a circle clip with a 6 px cream rim.
- Labels land on their words: an uppercase geometric sans (Josefin Sans Bold via `@remotion/google-fonts/JosefinSans`) in cream `#fff3dc` with a 6 px deep teal `#0e3b43` stroke, key words in orange; they fade and rise over 0.2 s.

## Explainer devices

- Hook number: big uppercase numerals in cream with a teal stroke on an orange starburst; the counter climbs with ticks.
- Crowd or grid: a 6 by 2 grid of chrome pill tokens; on the number word the one that matters glows orange with an airbrushed halo.
- Map or diagram: the beat behind blurred and darkened under a rounded console-screen panel with scanlines; deep teal sea `#0e3b43`, cream land `#f5e6c8`, 3 px teal lines. The region wipes in orange `rgba(255,138,31,0.85)`, a spread floods out in red `rgba(232,72,48,0.6)` from a pulsing marker, and orange dots pop on.
- Comparison: rockets or towers of different heights rising on their values.
- Reversal: an orange bar strikes through the claim on the word, the chromatic fringes spike for 4 frames and the music drops.
- Payoff: a chrome question mark on a pedestal under a ringed planet, held for the final line.

## Captions

Default `<Captions />` with a geometric rounded sans (Questrial via `@remotion/google-fonts/Questrial`) at 92 px, white with an 8 px black outline, spoken word in `#FF8A1F`, about 330 px above the bottom at 1080x1920.

## Score

```json
{ "seed": 6,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 3, 7],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bell", "part": "melody", "octave": 5, "db": -14, "density": 0.3 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -6 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.25 },
  "sfx": [ { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "riser", "word": "<key number word>", "offset": -0.8, "dur": 0.8 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "zap", "word": "<launch or invention word>" },
           { "type": "whoosh", "word": "<iris transition word>", "dur": 0.45 },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" } ] }
```

## Check the stills

- Only teal, cream and orange, with red only in a spread on a map.
- Airbrushed gradients are smooth with a fine speckle at their fade; halftone grain and scanlines are visible at full size.
- Chrome surfaces show a hard horizon line and a sharp highlight.
- Edges are clean and still between frames (no boil); labels have the deep teal stroke.
