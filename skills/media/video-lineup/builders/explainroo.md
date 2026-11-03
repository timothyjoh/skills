Skill: explainroo ({{repo}}, commit {{short}}). Cloned at `vendor/explainroo`, linked at `.claude/skills/explainroo`.

Objective: make the brief's video with explainroo, following `vendor/explainroo/skills/explainroo/SKILL.md` and `vendor/explainroo/AGENTS.md` (read AGENTS.md in full, it is the main manual) as written, then write BUILD-LOG.md.

Builder instructions:
- Setup ran when the lineup was made: `npm install` in `vendor/explainroo`, then `node vendor/explainroo/bin/explainroo.js doctor --fetch`, which caches Kokoro 82M and Whisper base.en in `~/.cache/explainroo`. INSTALL-NOTES.log has the output. Do not install a second copy into `$HOME/.explainroo` or clone the repo again. Export `EXPLAINROO_OFFLINE=1`.
- Run the CLI as `node vendor/explainroo/bin/explainroo.js <command>` and keep the video project in this folder, for example `videos/{{slug}}`. If a command must run from the repo root, run it there with the project path pointing back into this folder.
- Use the {{width}}x{{height}} size, a local Kokoro English voice, and the skill's checks (`check`, `still`, `sheet`, `render --draft`, `render`, `verify`).
- Watermark: set `"watermark": false` in video.json, unless the brief's builder notes ask to keep it. The default puts an `explainroo.com` URL on every frame, which most briefs do not want and some forbid.
- Kokoro can mispronounce product names: an earlier lineup heard "Claude Code" as "Cloud Code". Read the skill's speech check output; if a name comes back wrong, respell it in the narration text and render again.
- Do not run `preview` (it blocks on port 4400).
- Copy the final `video.mp4` to `out/final.mp4`, and copy its `.srt`, `.vtt` and cover image into `out/`.
