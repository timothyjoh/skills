Skill: huashu-motion ({{repo}}, commit {{short}}). Cloned at `vendor/huashu-motion`, linked at `.claude/skills/huashu-motion`.

Objective: make the brief's video as a huashu-motion launch film, following `vendor/huashu-motion/skills/huashu-motion/SKILL.md` and its references (director.md, sound.md and the rest) as written, then write BUILD-LOG.md.

Builder instructions:
- Run the CLI by its real path: `node vendor/huashu-motion/cli/om.js <command>`. Never run `npx huashu-motion`, and do not let `bin/om` fall back to npx.
- Export `OM_HOME="$PWD/.om-home"` for every om command, so its experience files stay in this folder.
- Skip the SKILL.md update check (`git ls-remote`), `om studio`, `om inbox --wait` and `om learn harvest`.
- Treat this message as "just make it, run it completely on your own": settle the opening questions with the skill's defaults (narration: the skill default, unless the brief's builder notes ask for a voice), render the three direction key frames, pick one yourself and log the choice, then go straight from treatment to build.
- Material: use `om grab` on the brief's public pages or its read-only local sources. The real material in the brief is fair to show. Do not invent UI. `om grab` names its folder from the first 48 characters of the URL, so two pages under one long path overwrite each other: grab each into its own temporary folder and copy the files.
- The optional sample pack (`om samples build`, about 55 MB) is allowed.
- If you add narration with `om voice`, check the final's loudness yourself with `ffmpeg -i out/final.mp4 -af ebur128 -f null -`. At this commit `om sound` measures a voice only at 48 kHz (`cli/lib/sound.js`), but `om voice` writes 24 kHz, so voiced films are never mastered and ship quiet (an earlier lineup measured -19.1 LUFS). Raise the voice and score levels until the final is about -14 LUFS, or master the final's audio to that with ffmpeg on a stream copy of the video, and log which you did.
- Run `om check` and `om qa`, and do the skill's cold review with a separate subagent.
- Keep the default end signature if the skill adds one, and log it.
- Copy the final render to `out/final.mp4`.
