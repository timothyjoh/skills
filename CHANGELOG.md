# timothyjoh-skills

## 0.3.1

### Patch Changes

- [`6517071`](https://github.com/timothyjoh/skills/commit/65170711f871fc8c97307054ffc1becb39291e4c) Thanks [@timothyjoh](https://github.com/timothyjoh)! - `tts-voice` keeps the model's warnings and progress bar out of stderr unless synthesis fails, and is verified to work with no reference WAVs present (`--voice default`).

## 0.3.0

### Minor Changes

- [`5ae1b8a`](https://github.com/timothyjoh/skills/commit/5ae1b8a8fdf211f97a83c21c8b657af479c2f318) Thanks [@timothyjoh](https://github.com/timothyjoh)! - Add the `media` bucket (`storytime`, `browser-tour`, `tts-voice`) and vendor `asd-ste100` into `writing` as the rule set `wat` depends on. `tts-voice` is local Chatterbox TTS with data-driven voices (any WAV in `CHATTERBOX_VOICES_DIR`); `storytime` and `browser-tour` use it as their only engine, resolved relative to the skill folder.

## 0.2.0

### Minor Changes

- [`c664183`](https://github.com/timothyjoh/skills/commit/c664183ad8992663194d65b1bf2c91adc101a20c) Thanks [@timothyjoh](https://github.com/timothyjoh)! - Add the `writing` bucket with two model-invoked skills: `show-me` (explain the current topic with the smallest picture that makes the point) and `wat` (re-explain the last answer with one picture and plain words).

- [`f0d35b3`](https://github.com/timothyjoh/skills/commit/f0d35b33b43c46ac2f2d3cc673c7453d735f8034) Thanks [@timothyjoh](https://github.com/timothyjoh)! - Initial release: `channel-to-skill`, which turns a YouTube channel into an agent skill (SKILL.md, concept pages, glossary, patterns, cheatsheet) after a triage step that picks which videos are worth the tokens.
