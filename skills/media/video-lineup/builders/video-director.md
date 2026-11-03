Skill: video-director ({{repo}}, commit {{short}}). Cloned at `vendor/video-director`, linked at `.claude/skills/video-director`.

Objective: make the brief's video with video-director, following `vendor/video-director/video-director/SKILL.md` and its references as written, then write BUILD-LOG.md.

Builder instructions:
- In the skill's own words: "I'm away: decide everything, log DECISIONs, deliver the MP4."
- No screenshots will be supplied. If you want real screens, capture the brief's public pages yourself with headless Chromium. The real material in the brief is fair to show. Never invent product screens.
- Render stack: the skill's default (an HTML page contract captured frame by frame, then an ffmpeg H.264 encode) unless its rules point elsewhere. For Playwright, install it in this folder, preferably the version whose Chromium is already cached (see Machine facts).
- Run its plan check before building and its video check after: `uv run --with numpy --with pillow python3 vendor/video-director/video-director/scripts/check_timeline.py <timeline.json>` and `uv run --with numpy --with pillow python3 vendor/video-director/video-director/scripts/qa_video.py out/final.mp4 --out qa/ --beats <timeline.json>`.
- Do the skill's separate-reviewer pass with a subagent that has not seen the build.
