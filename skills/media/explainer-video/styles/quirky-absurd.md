# Quirky Absurd

An absurd cartoon in pastel candy colours: wobbly hand-drawn lines that boil, googly eyes on everyone and everything, tiny bodies under huge heads, and surreal visual jokes. Springy and silly.

| | |
|---|---|
| Engine | SVG (React) |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [2D puppets and cels](../references/techniques.md#2d-puppets-and-cels), [cadence](../references/techniques.md#cadence-ones-twos-threes-and-stop-motion), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Weird facts, comedy, absurd true stories, light science with a silly angle |
| Less good for | Sombre or sensitive topics, precise data, anything that needs authority |
| Designed at | 9:16; at 16:9 line the cast up across the frame and give each gag its own third |

## Look

- Lines: plum-purple `#4a3b8f`, 5 to 7 px, round caps, slightly uneven; shapes are never quite closed. No black anywhere.
- A strong line boil: every line and fill edge goes through `feTurbulence` + `feDisplacementMap` (baseFrequency about 0.02, scale 5 to 7), and the turbulence seed steps 8 times a second.
- Palette: pastel candy. Grounds in blush `#fff3f8` or mint `#e3fbef`; pink `#ff5fa2`, violet `#7b5cff`, butter `#ffe58a`, mint `#9ff0c8`, baby blue `#9fd8ff`, peach `#ffc2a1`.
- Characters: original designs with tiny bodies and huge round heads (the head about 60 percent of the height), noodle arms and enormous googly eyes.
- Googly eyes on everything: props, buildings, hills, clouds, the map, the counter digits. A white disc with a purple outline and a black-violet pupil `#2a1f5c` that rolls loosely.
- Surreal jokes in the set: a hill that blinks, a sweating sun, a test tube with tiny arms, a cloud wearing a hat. One per shot, never the point of the beat.
- Labels: Poppins ExtraBold in pink `#ff5fa2` with a 12 px white stroke, tilted 4 degrees and gently wobbling; accent violet `#7b5cff`.

## Build

1. A shared `Wobble` filter in `<defs>` wrapping the whole scene group; its `seed` is `Math.floor(frame / fps * 8)` (the boil clock, about 8 drawings a second).
2. A `GooglyEye` component: the pupil offset is the lagged difference of the eye's own position, `pos(frame - 4) - pos(frame)`, scaled and clamped inside the eye, plus a damped wobble after each move. It stays a pure function of the frame.
3. Characters are SVG puppets on twos with big squash and stretch: on landing, scale y 0.8 and x 1.15 for 2 frames, then settle with `backOut`.
4. Every prop component takes a pair of `GooglyEye`s by default; turn them off only for the label text.
5. Sets stay simple: a flat pastel ground, round hills, doodled clouds, a few big props.

## Motion and camera

- A springy bounce at each cut: zoom `1 + 0.06 * exp(-6t) * cos(18t)` with t in seconds since the cut, plus a slow rocking rotation of about 1.2 degrees (sine, 3 s period).
- Transitions: a 0.35 s circle wipe from the centre (a growing `clipPath` circle revealing the next beat).
- Everything arrives with a `pop` overshoot and a squash; idle props bob and blink.
- Labels rock a further 1 degree on a sine and boil with everything else.

## Explainer devices

- Hook number: counter digits with googly eyes climb over a crowd of big-headed people whose eyes all roll toward the camera.
- Hero: the hero on a hill with eyes too big for the face, and a hat that has eyes of its own.
- Statistic: a 6 by 2 grid of pill tokens, each with googly eyes, pops in; the important one turns violet, grows 20 percent and stares at the camera on the number word.
- Map or diagram: the scene blurs and darkens behind a wobbly rounded panel: pale pink sea `#ffe9f3`, mint land `#bff0d4`, purple 5 px lines. A pink region wipes in, violet spreads from a pulsing marker, purple dots pop; the region itself gets googly eyes.
- Reversal: the claim label is struck through with a violet scribble on the reversal word, its eyes shrink in shock, and the music drops out.
- Payoff: the hero pops away and a bouncing question mark with googly eyes takes the spot, the question label in violet.

## Captions

`<Captions highlight="#FF5FA2" />`: Poppins Bold, white with a black outline, the spoken word in candy pink. Keep captions still; the wobble belongs to the picture.

## Score

```json
{ "seed": 17,
  "music": { "bpm": 120, "key": "F", "scale": "major_pentatonic", "chords": [1, 5, 6, 4],
    "layers": [ { "inst": "marimba", "part": "melody", "octave": 5, "db": -6, "density": 0.65 },
                { "inst": "musicbox", "part": "arp", "octave": 6, "db": -16, "rate": 8 },
                { "inst": "bass", "part": "pulse", "octave": 2, "db": -12 },
                { "kit": "wood", "db": -12 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.15 },
  "sfx": [ { "type": "pop", "word": "<hook number word>" },
           { "type": "whoosh", "word": "<cut word>", "dur": 0.35 },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "plastic", "word": "<gag word>" },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "drum", "word": "<payoff word>" } ] }
```

A bouncy, toy-like melody with woodblock drums. Pops for things that spring in, a whoosh on circle wipes, a shimmer on the key number, a record scratch on the reversal and a deep drum on the reveal.

## Check the stills

- Every object and character has googly eyes, and the eyes point in different directions.
- Only pastel candy colours and the purple line; no black outlines, no grey.
- Two stills 4 frames apart show a different wobble; lines are visibly hand-drawn, not crisp.
- Labels are tilted and still readable at phone size.
