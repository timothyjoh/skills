Skill: argo-guide from argo ({{repo}}, commit {{short}}; CLI @argo-video/cli, the latest release at init; `npx argo --version` shows it). Cloned at `vendor/argo` for reference, linked at `.claude/skills/argo-guide`.

Objective: make the brief's video as an argo demo video, following `vendor/argo/skills/argo-guide/SKILL.md` and its references as written, then write BUILD-LOG.md.

Builder instructions:
- Setup ran when the lineup was made: `npm install -D @argo-video/cli@latest kokoro-js@1` and `npx playwright install chromium` in this folder. INSTALL-NOTES.log has the output. If `npx argo doctor` says there is no config yet, run `npx argo init`. It scaffolds `browser: 'webkit'`, which is not installed: use the config that `vendor/argo/skills/argo-guide/references/config-and-quality.md` recommends instead (`browser: 'chromium'`, `captureMode: 'jpeg-stitch'`, `deviceScaleFactor: 2`).
- Demo target: if the brief gives a demo URL for a running web app, record that app. Otherwise record a guided walk through the brief's public pages. Do not log in. Do not click anything that changes state (stars, forks, issues, watch, forms). Scroll and highlight only.
- Keep every recorded screen readable at {{width}}x{{height}}: zoom the page or frame the part that matters. In an earlier lineup, recorded doc pages read as dim, unreadable scrolls.
- Use argo's overlays, cards and labels to carry the brief's story. A short GSAP intro or outro composition is allowed.
- If a page's content security policy blocks argo's injected scripts (github.com does), add `test.use({ bypassCSP: true })` to the demo; it changes nothing on the site. On pages with `scroll-behavior: smooth`, set it to `auto` before highlighting, so argo measures the box where it ends up.
- If a site blocks or rate-limits headless loads, render the same content from the brief's read-only local sources as plain HTML pages and record those. Log which source you used.
- Narration: local Kokoro through kokoro-js. No cloud TTS. Kokoro can mispronounce product names: an earlier lineup heard "Codex" as "codec". Transcribe the narration back with the Whisper in Machine facts (if there is one), and respell a name in the narration text if it comes back wrong.
- Copy the final `videos/<demo>.mp4` to `out/final.mp4`, plus its `.srt` if made.
