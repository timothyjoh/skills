---
"timothyjoh-skills": minor
---

Add the `media` bucket (`storytime`, `browser-tour`, `inworld-tts`, `chatterbox-tts`) and vendor `asd-ste100` into `writing` as the rule set `wat` depends on. `inworld-tts` now reads its credential from `INWORLD_API_KEY`; `chatterbox-tts` paths are overridable with `CHATTERBOX_REPO` and `CHATTERBOX_VOICES_DIR`; sibling-skill dependencies resolve relative to the skill folder.
