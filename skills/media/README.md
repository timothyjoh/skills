# Media

Producing audio and narrated walkthroughs: text-to-speech engines, multi-voice stories, browser tours.

## User-invoked

Reachable only when you type them (Claude Code: `disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`).

- None yet.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- **[storytime](./storytime/SKILL.md)**: Render a story as a multi-voice MP3: tag the prose by speaker, cast Inworld voices, stitch with ffmpeg. Depends on `inworld-tts` beside it.
- **[browser-tour](./browser-tour/SKILL.md)**: Drive Claude-in-Chrome through a narrated, pausing tour: research, product wizard, plan narration, or post-implementation demo. Optional audio via the TTS skills beside it.
- **[inworld-tts](./inworld-tts/SKILL.md)**: Premium cloud text-to-speech, 65+ voices. Needs `INWORLD_API_KEY`.
- **[chatterbox-tts](./chatterbox-tts/SKILL.md)**: Free local text-to-speech with voice cloning from reference WAVs. Needs a local Chatterbox install.
