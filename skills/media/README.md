# Media

Producing audio, narrated walkthroughs and videos: text-to-speech engines, multi-voice stories, browser tours, side-by-side video builds.

## User-invoked

Reachable only when you type them; they orchestrate.

- **[video-lineup](./video-lineup/SKILL.md)**: Build one video brief with several video skills at once (huashu-motion, take-one, explainroo, video-director, argo, a no-skill baseline and an earshot sound pass), each in its own T3 Code session, then measure and compare the outputs on one page. Depends on `t3-handoff` in the development bucket; the baseline uses `tts-voice` beside it.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[storytime](./storytime/SKILL.md)**: Render a story as a multi-voice MP3: tag the prose by speaker, cast a local voice per character, stitch with ffmpeg. Depends on `tts-voice` beside it.
- **[browser-tour](./browser-tour/SKILL.md)**: Drive Claude-in-Chrome through a narrated, pausing tour: research, product wizard, plan narration, or post-implementation demo. Optional audio via `tts-voice` beside it.
- **[tts-voice](./tts-voice/SKILL.md)**: Free local text-to-speech with voice cloning from reference WAVs (Chatterbox under the hood). Needs a local Chatterbox install.
