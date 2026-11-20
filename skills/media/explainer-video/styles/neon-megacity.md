# Neon Megacity

A rain-soaked city at night: towers of lit rooms, signs in invented glyphs, wet streets that mirror every light. One camera move climbs from a steaming street stall to the whole skyline, graded teal and magenta.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + a copied `FilmPass` with streaks and lens rain |
| Techniques | [city tricks](../references/techniques.md#city-tricks-interior-mapping-reflections-rain), [instanced systems](../references/techniques.md#instanced-systems), [film pipeline](../references/techniques.md#the-film-pipeline) |
| Best for | Tech, cities, surveillance and privacy, the future, "how many people, devices, homes" numbers |
| Less good for | Nature, history before electricity, bright cheerful topics |
| Designed at | 16:9; for 9:16 the rise suits a tall frame: start on the stall at the bottom and crane straight up one tower face |

## Look

- Towers: a 24 by 24 block grid, blocks 40 units wide, tower heights from `hash` between 30 and 300, each tower two or three stacked setback boxes with rooftop tanks, masts and blinking red lights.
- Facades use interior mapping: rooms 3.5 wide and 4 tall, about 35 percent lit, warm `#ffcf8a` or cool `#8fd8ff` per room, some with a blind half drawn or a figure silhouette on the back wall.
- Signs: vertical and horizontal emissive panels in magenta `#ff2e9a`, cyan `#19e6ff` and amber `#ffb000`. Every glyph is invented: 3 to 6 strokes on a 5 by 7 grid, picked by `hash`. Digits are the only real characters in the world, and only where a beat needs a number.
- Street: asphalt `#07080c` at roughness 0.15, puddles from a noise mask at roughness 0.02, splash rings where rain lands, steam from vents and the stall.
- The opening detail: a food stall under a striped awning, a glyph menu board, a lamp, steam rising, rain sheeting off the awning edge.
- Air: exponential fog `#0b1a24`, flying traffic as small instanced capsules with white head lights and red tail lights in lanes at three altitudes.

## Build

1. City generator from a seeded `rng`: one `InstancedMesh` for all tower boxes (static, matrices set once), one for roof props, one for traffic (matrices every frame, `frustumCulled = false`).
2. Facade `ShaderMaterial`: per-face UVs in world units, the room grid from `floor(uv / roomSize)`, then intersect the view ray with the imagined room box (back wall, floor, ceiling, side walls) and colour the planes, plus a hashed lamp spot on the ceiling.
3. Signs: one `CanvasTexture` atlas (2048 square) of glyph strings from `makeLayer`; planes with `toneMapped: false` and colour times 3 so they bloom. Flicker a few with `hash(signId, Math.floor(frame / 3))`.
4. Planar reflection: a camera mirrored under y = 0 renders into a half-size target before the main render; the street samples it in screen space with a ripple offset from the splash rings.
5. Rain: 6,000 instanced thin quads, `y = top - mod(speed * t + hash(i) * h, h)`, stretched along the fall direction and the camera's motion. Steam: soft canvas-noise billboards that rise and fade.
6. Copy `FilmPass` beside the scene and add: anamorphic streaks (a 24-tap horizontal blur of pixels over threshold, tinted cyan), motion blur (8 taps along a screen-space camera velocity uniform), and 40 lens raindrops (hashed screen circles that refract the image with a sphere normal; a few slide down slowly). Settings: `bloom` 0.9, `bloomThreshold` 0.8, light `aberration`, `vignette` 0.45, `grain` 0.3, `saturation` 1.1, `shadowTint` teal `[0.02, 0.12, 0.14]`, `highlightTint` magenta `[1.0, 0.45, 0.8]`.

## Motion and camera

- The signature move is one rise: start at 1.6 units above the street beside the stall, push in, tilt up, then crane up the tower face past dozens of rooms, crest the roof and pull back to the skyline. Spread it across the film: close on the hook, rising through the middle beats, the wide reveal on the payoff.
- Inside a beat, slow glides with a slight drift (two summed sines, 0.3 degrees). Everything on ones.
- Between beats, cut on a sign flicker, or whip past a sign close to the lens and let the motion blur carry the cut.

## Explainer devices

- Hook number: a tower-high billboard shows the counter in segmented digits drawn into its sign canvas, magenta on black, climbing on the word.
- Crowd or grid: the tower face is the grid. On the word, a block of 12 windows goes dark except one, which turns magenta and blooms.
- Evidence: a glowing sign plate over the stall (cyan border, dark glass) in the SVG layer above the canvas, with the claim typed on word by word in Chakra Petch SemiBold.
- Map or diagram: crest the roof into a top-down view; the street grid is the map. Towers light magenta outward from a point (per-instance colour by distance from the origin against time).
- Comparison: three to five towers rise from the street to their values, rooms lighting floor by floor, a value on each rooftop sign.
- Reversal: a blackout. Lit rooms drop to 10 percent for 4 frames, signs sputter out, the camera kicks, and fewer rooms come back.
- Payoff question: the wide reveal, one window lit in a dark tower, the question held in the sky above it.

## Captions

Default captions with the spoken word in magenta: `<Captions highlight="#ff2e9a" />`. Keep the bottom quarter free of bright signs so the white text holds.

## Score

```json
{ "seed": 21,
  "music": { "bpm": 84, "key": "F", "scale": "minor", "chords": [1, 6, 4, 5],
    "layers": [ { "inst": "pad", "part": "chord", "octave": 3, "db": -8 },
                { "inst": "arp", "part": "arp", "octave": 4, "db": -16, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 1, "db": -8 },
                { "kit": "lofi", "db": -16, "swing": 0.2 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.4 },
  "sfx": [ { "type": "rain", "at": 0, "dur": "<film length>", "db": -6 },
           { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "zap", "word": "<lit window word>" },
           { "type": "whoosh", "word": "<rise word>", "dur": 1.2 },
           { "type": "stab", "word": "<reversal word>" },
           { "type": "swell", "word": "<reveal word>", "offset": -1.2, "dur": 2.0 },
           { "type": "boom", "word": "<reveal word>" } ] }
```

Rain runs under everything; the low swell and boom belong to the skyline reveal.

## Check the stills

- Every sign shows invented glyphs; no readable word anywhere in the world.
- The wet street reflects the signs, broken up by ripples, not a clean mirror.
- Windows show depth (a room behind the glass) when seen at an angle.
- Teal in the shadows, magenta in the highlights, and raindrops visible on the lens in close shots.
- The bottom quarter stays dark enough for the captions.
