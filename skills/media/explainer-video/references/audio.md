# Music and sound

All music and effects are synthesised in code by `tools/synth.mjs` from one score file per style: `scores/<style>.json`. No samples. Narration is shared by every style; music and effects belong to the style.

## Contents

- [Mix](#mix)
- [Score file](#score-file)
- [Instruments, parts and kits](#instruments-parts-and-kits)
- [Effects](#effects)
- [Matching the style](#matching-the-style)
- [Going further](#going-further)

## Mix

Voice and music are both levelled to RMS -18 dBFS when written. `src/data/project.json` sets the mix:

```json
"mix": { "musicDb": -20, "duckDb": -4, "sfxDb": -6 }
```

Music sits 20 dB under the voice and ducks a further 4 dB while a word is spoken; effects sit 6 dB under the voice. Silent films (no narration) can raise music to about -6.

## Score file

```json
{
  "seed": 3,
  "music": {
    "bpm": 120, "key": "A", "scale": "minor_pentatonic", "chords": [1, 4, 5, 1],
    "layers": [
      { "inst": "koto", "part": "melody", "octave": 5, "db": -6, "density": 0.5 },
      { "inst": "bass", "part": "root", "octave": 2, "db": -10 },
      { "kit": "taiko", "db": -10 }
    ],
    "sections": [ { "from": 16.4, "to": 18.3, "level": 0.05 } ],
    "fadeIn": 0.3, "fadeOut": 1.5, "reverb": 0.2
  },
  "sfx": [
    { "type": "shimmer", "word": "twelve", "beat": 1 },
    { "type": "scratch", "word": "not", "offset": -0.04 },
    { "type": "tick", "every": 0.1, "from": 0.2, "to": 1.6 },
    { "type": "rain", "at": 0, "dur": 9, "db": -6 }
  ]
}
```

- `chords` are scale degrees per bar (1 = the key's root chord), looped. Chords stack every other scale tone.
- `sections` automate the music level by time: drop to near silence for a reversal, swell for a reveal. Read times from `beats.json` or `words.json`.
- An effect is placed by `word` (with optional `beat` and `nth`, the same lookup the scenes use), or by `at` in seconds. `offset` nudges it; `every`/`from`/`to` repeats it; `dur` sets the length of ambiences; `db` and `pan` set level and position.
- `seed` makes the melody repeatable; change it to hear another tune.

Run `node tools/synth.mjs --style <id>` after narration (effects need `words.json`). Re-run after any change to the score or the narration.

## Instruments, parts and kits

| Instrument | Sound |
|---|---|
| `pad`, `strings`, `drone`, `organ` | Held, slow attack; beds and swells |
| `pluck`, `koto`, `harp` | Plucked strings (Karplus-Strong); folk, East Asian, gentle |
| `musicbox`, `marimba`, `bell` | Struck, bright, short; playful, toy, paper |
| `piano` | Soft piano; sentimental, painterly |
| `chip` | Square wave; pixel art |
| `arp` | Saw and square synth; tech, neon, data |
| `bass` | Sine and saw bass |
| `flute` | Breathy sine with vibrato |

Parts: `chord` (held chord per bar), `root` (bass on beats 1 and 3), `pulse` (root on every eighth), `arp` (chord tones at `rate` notes per bar), `melody` (seeded two-bar phrases with a varied repeat; `density` 0..1).

Kits: `soft` (soft kick, shaker), `synth` (four-on-the-floor kick, hats, clap), `lofi` (lazy kick, snare, eighth hats; `swing` 0..0.5), `taiko` (deep drums, rim), `wood` (low drum, woodblock), `chip` (square kick, noise hats).

Scales: `major`, `minor`, `dorian`, `lydian`, `mixolydian`, `major_pentatonic`, `minor_pentatonic`, `in_sen`, `blues`, `chromatic`.

## Effects

| Type | Use it on |
|---|---|
| `tick`, `click`, `typewriter` | Counters, small UI events, text typing on |
| `pop`, `plastic`, `paper`, `stamp` | Elements arriving: graphics, bricks, paper pieces, seals |
| `whoosh`, `riser`, `swell` | Camera moves, transitions, build-ups (`dur`) |
| `shimmer`, `chime` | A reveal, a key number, something lighting up |
| `scratch` | The reversal ("Not quite") |
| `stab`, `hit`, `drum`, `boom`, `thud` | Big hits, twists, final reveal, landings |
| `zap`, `firework` | Sci-fi and pixel events, celebrations |
| `wind`, `rain`, `water`, `engine` | Ambience beds (`dur`) |

## Matching the style

Each style file gives a starting score. In general: score the events that land, with the sound the material would make (glass, plastic, paper, wood, ink); keep small, frequent sounds quiet; drop the music out for the reversal; put one deeper hit on the final reveal.

## Going further

`synth.mjs` is plain JavaScript in the project. To add an instrument or effect, add a function to `INST` or `FX` that returns `{ len, fn(t) }` (seconds in, sample out). Keep it deterministic: use the seeded `rand()` in the file, never `Math.random`.
