# timothyjoh-skills

## 0.5.0

### Minor Changes

- [`ea0cd68`](https://github.com/timothyjoh/skills/commit/ea0cd68bd14031558b391ba75664153158d3a54e) Thanks [@timothyjoh](https://github.com/timothyjoh)! - `channel-to-skill` and `playlist-to-skill` name the generated skill for what the source is centered on: `expert-<person>` when one person's teaching is the point (`expert-cole-medin`), `topic-kb-<topic>` when a subject is (`topic-kb-sales-negotiation`). The channel triage agent proposes the name and the run's one question states it; the playlist enumerator prints creators with counts and gains `--slug` to stamp the chosen name. Existing skills keep their names; fold-in never renames.

## 0.4.0

### Minor Changes

- [`f155e59`](https://github.com/timothyjoh/skills/commit/f155e599688f98e07e23a2408818069181143610) Thanks [@timothyjoh](https://github.com/timothyjoh)! - Add `playlist-to-skill` to turn a complete YouTube playlist into a concept-based agent skill. Include every entry automatically without triage or subset selection, preserve creator attribution and unavailable-source accounting, and support resumable fetching and additive fold-in.

- [`2de0e04`](https://github.com/timothyjoh/skills/commit/2de0e0416a112639e412672ed1243f788115bdab) Thanks [@timothyjoh](https://github.com/timothyjoh)! - `channel-to-skill` enumerates the `/shorts` tab alongside `/videos`. Every catalog and scope entry carries `kind: video | short`; the triage proposes mixes of long-form and Shorts rather than long-form cuts alone, weighted by what the channel is (a clip channel's Shorts are its densest material). The enumerator no longer drops anything by duration unless `--min-duration` is passed, samples the top Shorts by views for dates and durations (`--full-shorts`, default 100), and reports both kinds separately. The workflow batches extraction by transcript words instead of video count (`batchWords`, default 40k; `batchMax`, default 40), tells the extractor a Short yields one concept and is never padded, folds Shorts into the concept they restate and counts them per concept as a signal of what is central, and labels Shorts in concept sources and `sources.md`.

### Patch Changes

- [`183c105`](https://github.com/timothyjoh/skills/commit/183c1056161dd8c526207768c3c662d191944f0d) Thanks [@timothyjoh](https://github.com/timothyjoh)! - `playlist-to-skill` gains `pts_add.js` for folding specific videos into an existing skill without editing the YouTube playlist (useful when the playlist belongs to someone else). Each video is appended to `scope.json` with `source: "manual"` and survives later re-enumerations; `sources.md` lists them in a "Manual additions" table. The skill also reuses an existing scope for the same playlist ID even after its directory was renamed.

## 0.3.3

### Patch Changes

- [`5f8b5fb`](https://github.com/timothyjoh/skills/commit/5f8b5fb3a3067d8e67d6fd9ba7a679c6e432e98c) Thanks [@timothyjoh](https://github.com/timothyjoh)! - `channel-to-skill` gains `--dry-run`: enumerate, triage, and write `scope.json`, then print the estimate and the workflow call without fetching or generating anything.

## 0.3.2

### Patch Changes

- [`e9ab88c`](https://github.com/timothyjoh/skills/commit/e9ab88c43a1db28049578c562e462df5ead149b5) Thanks [@timothyjoh](https://github.com/timothyjoh)! - Credit `show-me` to its author (Dex Horthy, HumanLayer) in frontmatter, README and docs, and adopt `metadata.origin` as the convention for skills written by others.

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
