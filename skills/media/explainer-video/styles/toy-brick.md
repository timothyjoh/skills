# Toy Brick Stop-Motion

A tabletop film of glossy plastic toy bricks, shot on a macro lens one exposure at a time. Bricks hop into place, figures act in little hops, and even smoke and fire are made of bricks.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + `FilmPass` |
| Techniques | [instanced systems](../references/techniques.md#instanced-systems), [stop motion cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion), [film pipeline](../references/techniques.md#the-film-pipeline) |
| Best for | How things are built, processes in steps, playful science and history, anything with counting |
| Less good for | Sombre topics, fine detail, faces with subtle expression |
| Designed at | 16:9; for 9:16 build taller (towers, rockets, stacks) and crane vertically |

## Look

- A generic, unbranded brick system: 1x1, 1x2, 2x2 and 2x4 bricks, plates one third as tall, slopes, round 1x1s, a few translucent pieces. Studs on top, slightly bevelled edges, hairline gaps between neighbours, everything on a fixed stud grid. No logos on studs, no real sets.
- Material: glossy ABS (`MeshPhysicalMaterial`, low roughness, clearcoat 1) with softbox reflections, faint subsurface warmth, small shade differences per brick, and tiny imperfections: hairline scratches, fingerprints and dust as a subtle roughness and colour noise texture drawn into a canvas.
- Set: a studded baseplate on a wooden table (a canvas wood-grain texture), a brick-built backdrop wall behind (sky of blue bricks, a pixel sun, brick clouds on sticks), shallow depth of field.
- Palette: classic primaries (red `#c4281c`, yellow `#f5cd2f`, blue `#0d69ab`, green `#287f46`), white, light grey, black, plus translucent orange and red for fire.
- Figures: original designs only. A rounded-cube head with two dot eyes, a tapered block body, peg hands, stud on the head.

## Build

1. A brick factory: one `BufferGeometry` per part type (box with bevel plus stud cylinders merged), one `InstancedMesh` per part type and colour. Position everything in stud units (1 stud = 0.8 world units across, brick height 0.96, plate 0.32).
2. Describe each model (rocket, house, bar chart) as a list of `{ part, x, y, z, rot, colour, buildAt }` in stud coordinates. Build order is the list order; `buildAt` is a frame from the timeline.
3. Bricks arrive by hopping from a loose pile or dropping from above: two or three discrete hops (stop motion has no smooth arcs at 12 fps), then a squash on landing (scale y 0.85 for one exposure) and settle.
4. Effects are bricks: smoke is white and grey round 1x1s that pop in, grow in clusters and drift; fire is translucent orange and yellow round pieces with an emissive core; water is translucent blue plates. Never particles or blur.
5. Lighting: one warm key light with soft shadows (`VSMShadowMap`), a cool fill, a soft environment from a `RoomEnvironment` PMREM for the reflections. The key light's intensity flickers by 2 to 3 percent per exposure.
6. `FilmPass` with `focus` on the subject, `aperture` 10 to 16 for macro depth of field, light `bloom` on the translucent pieces, `grain` 0.2, `vignette` 0.4, warm highlights.

## Motion and camera

- Quantise time to 12 exposures a second: `const exp = Math.floor(frame / fps * 12)`; every animated value reads `exp`, not `frame`. Add a small per-exposure jitter to positions and rotations (`hash(id, exp)`), and no motion blur.
- Camera moves are also stepped, but in smaller increments (motion-control rig): crane, dolly or orbit on the exposure clock.
- One shot per beat. Open at stud level with a macro close-up; end on a wide shot of the whole build. Transitions: a hard cut, or a brick wall that builds across the frame and is knocked away.

## Explainer devices

- Hook number: the number built from bricks on the baseplate, or a counter on a brick-built display (1x1 tiles as pixels).
- Crowd or grid: rows of figures; the one that matters gets a translucent yellow head or a glowing stud.
- Comparison: brick columns that build up to their values, one brick per unit, with a click per brick.
- Map: a baseplate region filled plate by plate with colour.
- Reversal: a tower collapses into a scattered pile with bounces; the camera kicks.
- Payoff: a lone figure next to a large brick-built question mark.

## Captions

Default captions work. For a tighter fit, draw caption words as 1x1 tile pixel text on a dark plate (`renderPage`), still with the spoken word in yellow.

## Score

```json
{ "seed": 7,
  "music": { "bpm": 104, "key": "C", "scale": "major_pentatonic", "chords": [1, 4, 5, 1],
    "layers": [ { "inst": "marimba", "part": "melody", "octave": 5, "db": -6, "density": 0.6 },
                { "inst": "musicbox", "part": "arp", "octave": 5, "db": -14, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -10 },
                { "kit": "wood", "db": -14 } ], "reverb": 0.2 },
  "sfx": [ { "type": "plastic", "every": 0.083, "from": 0.4, "to": 2.0 },
           { "type": "thud", "word": "<landing word>" },
           { "type": "whoosh", "word": "<liftoff word>", "dur": 0.8 } ] }
```

A plastic click on every brick that lands (schedule them from the same build list the scene uses), a playful rumble and a slide whistle style `riser` for big moments.

## Check the stills

- Studs, bevels and gaps visible in the close shots; it reads as plastic, not as coloured boxes.
- Depth of field: the subject sharp, foreground and background soft.
- No logo text, no smooth motion blur, no particle smoke.
- The final wide shot shows the whole build inside the frame.
