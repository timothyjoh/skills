# TV Cartoon

A prime-time TV cartoon: bold clean black outlines, flat cel colours, round-eyed original characters and a saturated sunny palette with a touch of retro sci-fi sitcom energy. Every cut lands with a punch-in.

| | |
|---|---|
| Engine | SVG (React) |
| Techniques | [SVG motion graphics](../references/techniques.md#svg-motion-graphics), [2D puppets and cels](../references/techniques.md#2d-puppets-and-cels), [multiplane camera](../references/techniques.md#multiplane-camera), [explainer devices](../references/techniques.md#explainer-devices) |
| Best for | Comic explainers, everyday science, "how does that work" stories, history told with jokes |
| Less good for | Calm or sombre stories, fine texture, lush scenery |
| Designed at | 9:16 with the subject mid-frame; at 16:9 stage characters side by side and widen the set |

## Look

- Outlines: near-black `#1b1b1b`, 6 to 8 px on characters and props at 1080 wide, 4 px on background detail, round joins, even width (no taper).
- Fills: flat, no gradients except the sky. One hard-edged shadow shape per character in a darker tint of the base (about 80 percent brightness).
- Palette: sky `#58b8f5` to `#bfe8ff`, grass `#9ad86a`, sunny yellow `#ffe14d`, orange `#ff6b3d`, teal `#2fb7a8`, purple `#8a5cd6`, and natural, varied skin tones (`#f2c79a`, `#d9a06b`, `#a8683e`, `#6e4326`).
- Characters: original designs with big round white eyes that touch, small black pupils, simple line mouths or an overbite, rounded noses, four-finger hands and readable hair silhouettes.
- Retro sci-fi touches where they fit: boomerang and atom shapes, rounded chrome props, little starbursts on the walls, a flying saucer in the sky as a background gag.
- Labels: Poppins ExtraBold in yellow `#ffe14d` with a 9 px `#1b1b1b` stroke (`paintOrder="stroke"`); accent `#ff6b3d`.

## Build

1. One `<svg>` per beat, split into three groups for multiplane: sky and far set, mid set, characters and foreground.
2. Characters are SVG puppets: parts as paths in nested `<g>` with pivots, a pose sheet (neutral, point, shrug, shock, cheer, smug, think), animated on twos (`onN(frame, 2)`), with blinks and mouths as swapped drawings.
3. Outline each part by drawing it twice: a black stroke at double width underneath, then the fill on top, so overlapping parts stay clean.
4. Sets (living rooms, labs, streets, hills, a crowd to the horizon) from flat perspective polygons; repeated items (windows, test tubes, heads in a crowd) from small components with seeded colour variation (`hash`).
5. No texture overlay, no grain and no boil: this look is crisp. The only filter is the blur behind panels.

## Motion and camera

- Punch-in on every cut: the scale jumps to 1.09 on the cut frame and settles to 1.0 within 6 to 8 frames (`backOut`), then creeps to 1.04 across the beat with a gentle sideways sway.
- Parallax during the creep: far set at 0.3, mid set at 0.6, foreground at 1.0.
- Transitions: a 0.12 s (4-frame) white flash.
- Characters act on twos with snappy anticipation; reaction takes (eyes pop wider, a jump, arms up) land on the word.

## Explainer devices

Labels `pop` in over 8 frames on their words.

- Hook number: a yellow outlined counter over a wide establishing set, such as a crowd of round-eyed people stretching to the horizon built from 4 or 5 head variants.
- Hero: a low-angle hero shot with the name label.
- Statistic: a 6 by 2 grid of rounded pill tokens with black outlines pops in; one fills `#ff6b3d` and pulses on the number word.
- Map or diagram: the set blurs (`feGaussianBlur` stdDeviation 12) and darkens 45 percent behind a rounded panel: sea `#58b8f5`, land `#9ad86a`, black 5 px outlines. A yellow region wipes in, an orange area floods out from a pulsing marker, black dots pop on their word.
- Reversal: the claim as a capitalised label; an orange bar slams across it on the reversal word with a white flash, and the short answer pops in below in orange. The music drops out.
- Payoff: the hero's label is swapped for the question in orange while the hero shrugs.

## Captions

`<Captions highlight="#FFE14D" />`: Poppins Bold, white with a black outline, the spoken word in label yellow.

## Score

```json
{ "seed": 5,
  "music": { "bpm": 120, "key": "C", "scale": "major_pentatonic", "chords": [1, 4, 5, 1],
    "layers": [ { "inst": "pluck", "part": "melody", "octave": 5, "db": -6, "density": 0.6 },
                { "inst": "marimba", "part": "arp", "octave": 4, "db": -14, "rate": 8 },
                { "inst": "bass", "part": "root", "octave": 2, "db": -10 },
                { "kit": "soft", "db": -12 } ],
    "sections": [ { "from": "<reversal start>", "to": "<reversal end>", "level": 0.05 } ], "reverb": 0.15 },
  "sfx": [ { "type": "whoosh", "word": "<first cut word>", "dur": 0.3 },
           { "type": "pop", "word": "<label word>" },
           { "type": "shimmer", "word": "<key number word>" },
           { "type": "click", "every": 0.15, "from": "<travel start>", "to": "<travel end>", "db": -10 },
           { "type": "scratch", "word": "<reversal word>" },
           { "type": "drum", "word": "<payoff word>" } ] }
```

A bouncy plucked melody with soft drums. A pop under each label, a patter of clicks under travel, a shimmer on the key number, a record scratch on the reversal and a deep drum on the reveal.

## Check the stills

- Every shape has a black outline, and nothing but the sky has a gradient.
- Colours are saturated and sunny; skin tones vary across a crowd.
- Labels are yellow with a heavy dark stroke and readable at phone size.
- Lines are clean: two stills a frame apart differ only where something moves.
