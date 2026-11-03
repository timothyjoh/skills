---
"timothyjoh-skills": minor
---

Add `video-lineup`, a user-invoked media skill: build one video brief with several video skills at once and compare the results.

- Builders: huashu-motion, take-one, explainroo, video-director, argo, a no-skill baseline, and an earshot sound pass on the baseline. Each run fetches every builder's latest commit from its GitHub repo and clones it into its own build folder, with its installs done up front.
- `upstream` checks every builder before a lineup: eliminates archived or stale repos, scans prompts and code for injection and dangerous patterns, audits dependencies without running install scripts, and sends new commits to a fresh agent review recorded with `vet`. `init` builds only builders that passed.
- Each build runs in its own T3 Code project and session through `t3-handoff`, unattended, with one shared set of rules and a run contract.
- `scripts/lineup.mjs` checks the tools, sets up the lineup, registers projects, dispatches, follows progress, measures every output (spec, loudness, contact sheet, transcript, video-director's QA script) and writes a side-by-side page that works from `file://`.
