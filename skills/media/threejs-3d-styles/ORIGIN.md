# Origin

Captured from a third-party website, not vendored from a repository.

| | |
|---|---|
| Source | https://www.futurepedia.io/resources/3d-style-atlas/view |
| Author | Futurepedia |
| Captured | 2026-11-15, from the page's own API (the data behind each style's "Copy prompt" button) |
| three.js version in the source briefs | 0.187.0 |
| License | None found. This material is **not** covered by this repo's MIT license. |

## What came from the source

- `lib/stage.js`, `lib/sound.js`, `lib/strokefont.js`, `lib/text3d.js`: the atlas's rendering, sound and text kits, byte-identical to the source apart from a trailing newline.
- `styles/NN-<id>.md`: each style's card (look, motion, light, materials, camera, finish, good for), its sample topic and gallery notes, and its complete reference style source. The source code blocks are unmodified; the Markdown around them is a reformatting of the same fields.
- `SKILL.md`: the build instructions are the atlas's shared prompt template, rewritten as skill steps with the voiceover and no-voiceover variants marked inline. The style table and selection step are new.

## Keeping it current

Do not edit `lib/` or the reference source blocks in place. To refresh, capture the atlas again and regenerate the style files. This repo's no-em-dash rule does not apply to the captured code.
