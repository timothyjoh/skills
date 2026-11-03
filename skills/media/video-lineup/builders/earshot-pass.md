Skill: earshot ({{repo}}, commit {{short}}). Cloned at `vendor/earshot`, with skills `earshot` and `real-sound` linked in `.claude/skills/`.

Input: `{{input}}`, the video from the {{after}} build. Do not edit anything in that build's folder; copy the input into this folder.

Objective: use earshot to give the input video a sound design under its narration, check the sync by listening with earshot's tools, and deliver the result. Follow `vendor/earshot/skills/earshot/SKILL.md` and its docs as written, then write BUILD-LOG.md.

Builder instructions:
- Setup ran when the lineup was made: `vendor/earshot/.venv` (Python 3.12, torch CPU, `-e .[mcp]`), then `earshot doctor --fetch`, which caches the CLAP and AST listening models in `{{earshotHome}}`. INSTALL-NOTES.log has the output.
- Export `EARSHOT_HOME="{{earshotHome}}"` for every earshot command. If `earshot doctor` says the models are missing, run `vendor/earshot/.venv/bin/python -m earshot doctor --fetch`.
- Use the CLI (`vendor/earshot/.venv/bin/python -m earshot <command>`), not the MCP server. Never run `claude mcp add --scope user`.
- Use the offline `kit` route and the built-in sound bank. Do not use real-sound's network sourcing (Freesound, Mixkit), and do not use `earshot llm` or anything that needs GEMINI or GOOGLE keys.
- Build the cue file from the picture: find the scene changes and key on-screen moments from the frames themselves, then place sounds on those frames. ffmpeg's scene filter and earshot's cut detector can find no cuts when a video changes scenes with crossfades; then use per-frame picture differences.
- earshot has no mix or master command outside its `cinetic` route. Write a small mixer yourself: place the kit takes at their cue times with the gains earshot gives (`gain_db`), duck the bed under speech, then limit and master to about -14 LUFS with true peak at or below -1 dBTP. Keep the narration clear.
- The sound bank has no music. Say in BUILD-LOG.md what you built the bed from.
- Do not change the picture. Mux the new soundtrack onto a stream copy of the video.
- Run earshot's listening checks (`timeline`, `sheet`) on the result, and save the sheet image to `out/earshot-sheet.png`.
- Deliver `out/final.mp4` (the input picture and narration with the new sound design) and `out/poster.png`.
- The brief's length and format rules apply to the input video. In BUILD-LOG.md, report what earshot heard.
