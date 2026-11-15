# Origin

Vendored, unmodified, from a third-party repository.

| | |
|---|---|
| Upstream | https://github.com/Leonxlnx/cook |
| Author | Leon Lin ([@LexnLin](https://x.com/LexnLin)) |
| Commit | `b23cac6fd9439dfddcab61b14808e7bf72549b46` (2026-10-31) |
| License | MIT, see `LICENSE`, retained as the license requires |
| Vendored on | 2026-11-15 |

Files taken: `SKILL.md`, `LICENSE`, `references/` (intake, target-and-bar, loop-and-critics, rules, ship), `scripts/side-by-side.mjs`, `templates/brief.md`, `templates/ROUNDS.md`. Upstream `README.md` and `.gitignore` were not vendored; they describe the standalone repo rather than the skill. `agents/openai.yaml` and this file are local additions.

## Why it is here

It is the long-run loop for visual builds that must hold up next to reference images or videos: three.js worlds, code-rendered films, launch videos, games and UI. It pairs with `threejs-3d-styles` beside it when a style-atlas look needs to be pushed to a numeric bar over many rounds.

## Keeping it current

Do not edit these files in place. A local edit is invisible to the next person who compares against upstream, and it is lost the next time the skill is refreshed. This repo's no-em-dash rule does not apply to vendored files. To change behaviour, raise it upstream or record the deviation here. To refresh, re-vendor from a newer upstream commit and update the table above.

## Optional companion

`SKILL.md` mentions `/unlazy` ([Leonxlnx/unlazy](https://github.com/Leonxlnx/unlazy)) as an optional companion. It is not vendored here, and cook works without it.
