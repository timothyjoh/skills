---
"timothyjoh-skills": minor
---

`channel-to-skill` enumerates the `/shorts` tab alongside `/videos`. Every catalog and scope entry carries `kind: video | short`; the triage proposes mixes of long-form and Shorts rather than long-form cuts alone, weighted by what the channel is (a clip channel's Shorts are its densest material). The enumerator no longer drops anything by duration unless `--min-duration` is passed, samples the top Shorts by views for dates and durations (`--full-shorts`, default 100), and reports both kinds separately. The workflow batches extraction by transcript words instead of video count (`batchWords`, default 40k; `batchMax`, default 40), tells the extractor a Short yields one concept and is never padded, folds Shorts into the concept they restate and counts them per concept as a signal of what is central, and labels Shorts in concept sources and `sources.md`.
