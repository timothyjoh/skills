# Holo 3D

High-end sci-fi built as three.js sets: holographic interfaces and floating data panels, glass and chrome, cyan and magenta light cutting through deep blue darkness. Each beat is a slow push past glowing panels, with HUD type on the spoken words.

| | |
|---|---|
| Engine | three.js: `ThreeCanvas` + a copied `FilmPass` with a glitch, SVG HUD layer above |
| Techniques | [instanced systems](../references/techniques.md#instanced-systems), [film pipeline](../references/techniques.md#the-film-pipeline), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | AI, tech, data, science of the future, "what the scan revealed" stories |
| Less good for | Earthy history, warm human stories, comedy |
| Designed at | 9:16 at 1080x1920, subject in the middle, calmer lower quarter; at 16:9 spread panels left and right of the subject |

## Look

- Darkness: background gradient from `#020617` at the top to `#071a3a` near the floor, a black glossy floor (roughness 0.2) that reflects the light.
- Holograms: subjects (figures, helix, terrain, trees) are drawn as light. A fresnel `ShaderMaterial` with a cyan `#29e3ff` rim, a faint fill, horizontal scan bands that drift upward, additive blending, `toneMapped: false`.
- Glass: `MeshPhysicalMaterial` with `transmission` 1, `roughness` 0.05, `thickness` 0.5, `ior` 1.45. Chrome: `metalness` 1, `roughness` 0.1. Both need a `RoomEnvironment` PMREM for something to reflect.
- Panels: floating planes with `CanvasTexture` UIs drawn in code (ring gauges, tick scales, sparklines, grid readouts of invented glyphs), cyan with magenta `#ff2eba` highlights, additive, with a slight scanline flicker.
- Volumetric rays: additive cone meshes with a soft gradient canvas texture falling from emitters above, dust motes drifting in them.
- No readable text inside the 3D world. All words live in the SVG layer.

## Build

1. One set per beat, about seven: a wide establishing set (a field of holographic figures to the horizon, or a holo terrain table), a hero set (one figure on a chrome dais inside a ring emitter), a lab set (a glass column holding a bead helix), a map set, a case set (a glass slab file with a chrome clasp), a site set (wireframe contour terrain with a strand of light rising from it) and a closing set (a branching tree of glowing medallion nodes).
2. Crowds and medallions are `InstancedMesh` with per-instance colour; the hologram shader reads instance colour so one can switch to magenta.
3. Copy `FilmPass` beside the scene and add `uGlitch` (0..1): 8 flicker steps over 0.25 s, horizontal bands offset sideways by `hash(band, step)`, and a hue rotation. Base settings: `bloom` 0.9, `bloomThreshold` 0.65, light `aberration`, `vignette` 0.5, `grain` 0.12, `shadowTint` deep blue, `highlightTint` cyan.
4. Map beats put a rounded map panel over the previous set, which is pushed soft and dark behind it (`aperture` up to about 30 with `focus` on the panel, `exposure` down to 0.5). Panel skin: deep navy `#030a1c`, a cyan 30 px grid, translucent cyan land `rgba(41,227,255,0.08)`, cyan 2 px coastlines, a magenta region `rgba(255,46,186,0.55)`, a cyan spread `rgba(41,227,255,0.35)`, magenta dots `#ff2eba`. Draw it as SVG in the overlay, or into a canvas on a plane in the set.
5. SVG HUD over everything: cyan corner brackets, a REC dot and timecode in the top left computed from the frame, a sweeping scan line, fine horizontal scanlines and a vignette.
6. Labels: Inter Light uppercase in ice white `#e8fbff`, 0.12 em tracking, a cyan `#29e3ff` glow (`feGaussianBlur` merged under), square brackets either side. Labels fade and rise in over 0.2 s on their words.

## Motion and camera

- The signature is a slow push with a sideways drift in each beat: dolly toward the subject so it grows by about 10 percent (the feel of a zoom from 1.02 to 1.12) while trucking sideways, alternating left and right every beat.
- Real depth replaces the flat parallax: floating panels near the lens slide faster than the subject, the far darkness barely moves, and near panels sway slightly.
- Transitions between beats are the 0.25 s glitch, cutting to the next set at its midpoint.
- The reversal: a hard glitch, the panels flicker off, the cyan drains to grey for the beat.

## Explainer devices

- Hook number: a big counter in labelled HUD type over the wide establishing set, climbing on its words.
- Crowd or grid: a 6 by 2 grid of rounded pill tokens pops in as SVG over a closer shot of the crowd; on the number word one glows magenta.
- Evidence: the lab set, the helix turning inside the glass column, the claim and year as bracketed labels.
- Map or diagram: the map panel over the softened set; the region wipes in on its word, dots pop, the spread floods outward from a pulsing marker.
- Comparison: holographic bars rising from the floor or panel bars in the overlay, values in bracketed labels.
- Reversal: the claim as a label, struck through by a magenta bar on the reversal word.
- Payoff question: the closing tree; its root medallion dims and the root label is replaced by the question in magenta.

## Captions

`<Captions fontFamily="Inter" size={92} outlineWidth={8} highlight="#29E3FF" bottom={0.17} />`: white with a black outline, two or three words per page, the spoken word in cyan.

## Score

```json
{ "seed": 9,
  "music": { "bpm": 116, "key": "A", "scale": "minor", "chords": [1, 6, 3, 7],
    "layers": [ { "inst": "arp", "part": "arp", "octave": 4, "db": -8, "rate": 16 },
                { "inst": "bass", "part": "root", "octave": 1, "db": -6 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -12 },
                { "inst": "bell", "part": "melody", "octave": 6, "db": -20, "density": 0.2 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.35 },
  "sfx": [ { "type": "tick", "every": 0.07, "from": "<count start>", "to": "<count end>" },
           { "type": "zap", "word": "<first beat word>", "beat": 1, "db": -8 },
           { "type": "riser", "word": "<key number word>", "offset": -0.8, "dur": 0.8 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "stab", "word": "<twist word>" },
           { "type": "shimmer", "word": "<payoff word>", "dur": 2.0 } ] }
```

Add a quiet `zap` on the first word of each beat to sell the glitch transitions.

## Check the stills

- Deep blue darkness fills most of the frame; light comes only from cyan and magenta sources.
- Glass shows refraction and chrome shows reflections, not flat grey.
- No readable text in the 3D world; every word is a bracketed HUD label or a caption.
- The subject sits in the middle and the lower quarter is calm enough for captions.
- On map beats the set behind the panel is visibly soft and dark.
