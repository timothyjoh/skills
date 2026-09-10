# Knowledge

Turning sources (YouTube channels, playlists, transcripts) into knowledge an agent can work with.

## User-invoked

Reachable only when you type them (Claude Code: `disable-model-invocation: true`; Codex: `policy.allow_implicit_invocation: false` in `agents/openai.yaml`).

- **[channel-to-skill](./channel-to-skill/SKILL.md)**: Turn a YouTube channel into an agent skill (SKILL.md, concept pages, glossary, patterns, cheatsheet). Triage picks the videos, a background workflow reads every transcript once and renders the skill.

## Model-invoked

Model- or user-reachable (rich trigger phrasing so the model can reach for them).

- None yet.
