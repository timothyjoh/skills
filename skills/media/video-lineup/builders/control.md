Skill: none. This is the baseline: plain coding-agent work with only local tools, the way you would make the video without a video skill.

Objective: make the brief's video, then write BUILD-LOG.md.

Builder instructions:
- Narration: {{narration}}
- Picture: HTML scenes at {{width}}x{{height}} with no CDN dependencies, captured frame by frame with Playwright (install it in this folder, preferably the version whose Chromium is already cached) or with Chrome headless. Avoid Playwright `recordVideo`, because its real-time capture jitters.
- Assemble and mux with ffmpeg. Soft subtitles as `mov_text` are optional.
- Check the result: ffprobe for the spec, a few extracted frames that you look at, and the narration transcribed back with the Whisper in Machine facts (if there is one), compared to your script.
- Aim to finish within 60 minutes. Keep it honest: this is the "no skill" reference point.
- In BUILD-LOG.md, write "n/a" where a section asks about the skill.
