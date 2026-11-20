# Raymarched Sci-Fi

One fragment shader draws a whole science fiction world: a small ship races down a canyon of glowing seams, banks through a rock arch and bursts out under a ringed planet. Teal shadows, orange light and anamorphic film optics, with the explainer's type composited above.

| | |
|---|---|
| Engine | Shader (SDF): one `ShaderPass`, SVG and `<Captions />` layered above |
| Techniques | [raymarching](../references/techniques.md#raymarching-signed-distance-fields), [film pipeline](../references/techniques.md#the-film-pipeline), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Space, speed, distance and scale, epic openers, "how far, how fast" numbers |
| Less good for | People and faces, dense diagrams, anything that needs many labels at once |
| Designed at | 16:9 inside a 2.39:1 letterbox; for 9:16 drop the letterbox, fly up a vertical chasm and put the planet at the top of the frame |

## Look

- Terrain: a deep sandstone canyon from domain-warped fbm, terraced with stepped `floor` bands and smoothed, walls about 40 units high. Thin emissive seams run along the strata (ridged noise, thresholded), cyan-white `#7df9ff`.
- A natural rock arch across the canyon: a bent torus fused into both walls with `smin` (k about 0.6) and roughened with the same noise as the walls.
- The ship: small and simple. A capsule fuselage, two swept wings (rounded boxes), a tail fin, and an engine sphere that glows cyan with a long glow trail.
- The ringed planet: huge and far, intersected analytically (ray-sphere for the body, ray-plane for the ring) rather than marched. The ring has banded density from a 1D noise of radius and throws a shadow band across the planet.
- Grade: shadows teal `#0f3a44` to `#061a20`, sunlight orange `#ff8a3d`, sun core `#ffd9a0`, sky graded from `#0b2a33` at the zenith to `#ffb070` at the horizon.
- No text or symbols inside the world. All type lives in the SVG layer above.

## Build

1. One `ShaderPass` with no layers. Per-frame uniforms computed in JS: `uCamPos`, `uCamTarget`, `uRoll`, `uSpeed`, `uSunDir`, `uShipPos`, `uLit` (index of a lit beacon, or -1) and `uDrain` (0..1 grade drain for the reversal). Keep the camera spline in one `camera.ts` shared by the uniforms and the SVG projection, so labels can pin to points in the world.
2. `map(p)` returns distance and material id for terrain, arch and ship. March up to 96 steps, stop at `0.001 * t`, far plane 400. Normals from a 4-tap tetrahedron gradient; 16-step soft shadow toward the sun; 5-tap ambient occlusion; exponential fog tinted toward the sky colour.
3. Glow is accumulated along each ray from its closest approach to the seams and the engine (`glow += exp(-d * 8.0)`), so the bloom around them is computed, not blurred.
4. Film effects stay in the same shader. Take 4 samples per pixel, each with a jittered lens offset (depth of field focused on the ship) and a sub-frame time offset (motion blur that streams radially at speed). Anamorphic streaks are a horizontal falloff from the projected screen positions of the engine and the sun; god rays are an 8-sample march of sun visibility along the view ray. Chromatic aberration offsets the glow and streak terms per channel toward the edges. Finish with grain from `hash(fragCoord, uFrame)`, then black bars for 2.39:1.
5. Remotion renders offline, so full resolution at 4 samples is usually fine. If a frame takes longer than about 2 s, drop to 2 samples first, then copy `ShaderPass` beside the scene and render at half size, scaled up.
6. Above the shader: one full-frame `<svg>` for counters, labels and thin HUD lines, then `<Captions />` last. Type is Barlow Condensed SemiBold (`@remotion/google-fonts/BarlowCondensed`), ice white `#f4efe6` with orange `#ff8a3d` for the number that matters.

## Motion and camera

- The signature is one continuous flight. Each beat is a segment of one camera spline, so the film reads as a single take: canyon run, arch, breakout, planet reveal.
- The camera chases about 6 units behind the ship with a few frames of lag. Roll follows lateral acceleration (the second derivative of the spline), clamped to 35 degrees. Speed rises through the film; everything runs on ones.
- Change beat without a cut: pass through the arch (rock fills the frame for 6 frames) or swing round a canyon bend. Save the hard cut for the reversal.
- The reveal (planet rising over the canyon rim as the ship breaks out) lands on the payoff, or on the hook number for a cold open.

## Explainer devices

- Hook number: a large SVG counter in orange over the canyon run. Tie `uSpeed` to the counter's progress so the ship accelerates as the number climbs.
- Crowd or grid: beacons on the canyon floor by domain repetition (`mod` on x and z), 12 in a row. On the word, `uLit` turns one from teal to orange and the others dim.
- Evidence: an SVG panel with thin orange corner brackets pinned to the ship's projected position, its readout typed on word by word; a scan plane sweeps a glowing seam behind it.
- Map or diagram: the camera pitches down to top-down over the canyon. The route draws on as an SVG line through projected spline points, and a region tints inside a growing 2D mask uniform in xz.
- Comparison: rock pillars raised from the canyon floor by SDF boxes with height uniforms, eased to their values, labels projected above each one.
- Reversal: hard cut, the engine sputters (emissive flickers down to 20 percent), `kick` on the camera, `uDrain` pulls the orange out of the grade for the beat.
- Payoff question: the ship hovers on the rim, tiny, under the full planet; the question sets in SVG in the sky between them and holds.

## Captions

Put captions inside the lower letterbox bar (about 138 px tall at 1920x1080): `<Captions fontFamily="Barlow Condensed" size={56} bottom={0.03} highlight="#ff8a3d" />`. Labels stay inside the picture, never in the bars.

## Score

```json
{ "seed": 11,
  "music": { "bpm": 120, "key": "D", "scale": "minor", "chords": [1, 6, 7, 1],
    "layers": [ { "inst": "bass", "part": "pulse", "octave": 2, "db": -8 },
                { "inst": "arp", "part": "arp", "octave": 4, "db": -12, "rate": 16 },
                { "inst": "pad", "part": "chord", "octave": 3, "db": -12 },
                { "inst": "drone", "part": "root", "octave": 2, "db": -16 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.3 },
  "sfx": [ { "type": "engine", "at": 0, "dur": "<film length>", "db": -10 },
           { "type": "tick", "every": 0.08, "from": "<count start>", "to": "<count end>" },
           { "type": "whoosh", "word": "<arch word>", "dur": 0.7 },
           { "type": "zap", "word": "<lit beacon word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "swell", "word": "<reveal word>", "offset": -1.5, "dur": 2.0 },
           { "type": "boom", "word": "<payoff word>" } ] }
```

The engine bed runs the whole film; the swell starts before the breakout so the planet arrives on its peak.

## Check the stills

- Shadows are teal and lit faces orange; no frame drifts to neutral grey.
- The bars are pure black, the captions sit inside the lower bar, and every label sits inside the picture.
- The engine is the brightest point after the sun, and the ship reads at phone size.
- Streaks are horizontal only, grain shows in the darks, and the sky has no banding.
- On the reveal frame the planet and its full ring sit inside the frame.
