# Media

Producing audio and narrated walkthroughs: text-to-speech engines, multi-voice stories, browser tours.

## User-invoked

Reachable only when you type them (Claude Code: `disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`).

- None yet.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[storytime](./storytime/SKILL.md)**: Render a story as a multi-voice MP3: tag the prose by speaker, cast a local voice per character, stitch with ffmpeg. Depends on `tts-voice` beside it.
- **[browser-tour](./browser-tour/SKILL.md)**: Drive Claude-in-Chrome through a narrated, pausing tour: research, product wizard, plan narration, or post-implementation demo. Optional audio via `tts-voice` beside it.
- **[tts-voice](./tts-voice/SKILL.md)**: Free local text-to-speech with voice cloning from reference WAVs (Chatterbox under the hood). Needs a local Chatterbox install.
