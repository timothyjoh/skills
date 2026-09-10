# Skills For Knowledge Work

[![skills.sh](https://skills.sh/b/timothyjoh/skills)](https://skills.sh/timothyjoh/skills)

Agent skills I use to turn what I watch and read into something an agent can *work with*: a YouTube channel into a skill that decides the way the creator decides, playlists into a transcript pipeline, transcripts into a cross-linked knowledge base. Plus a few for explaining things with a picture and plain words.

The structure and tooling follow [mattpocock/skills](https://github.com/mattpocock/skills): bucketed `skills/`, one docs page per promoted skill, a Claude Code plugin manifest, changesets for releases.

## Installation

Two ways in. **The Claude Code plugin** installs the set as a managed, read-only bundle. **[skills.sh](https://skills.sh/timothyjoh/skills)** copies editable skill files into your project. Pick one: installing both leaves you with every skill twice.

<details>
<summary><strong>Claude Code</strong></summary>

```bash
claude plugin marketplace add timothyjoh/skills
claude plugin install timothyjoh-skills@timothyjoh
```

Or, from inside a session:

```
/plugin marketplace add timothyjoh/skills
/plugin install timothyjoh-skills@timothyjoh
```

Updates arrive with `claude plugin update timothyjoh-skills`.

</details>

<details>
<summary><strong>Codex, and other agents</strong></summary>

```bash
npx skills@latest add timothyjoh/skills
```

Pick the skills you want, and which coding agents to install them on.

</details>

<details>
<summary><strong>For tinkerers</strong></summary>

Use the same installer, on any agent, including Claude Code:

```bash
npx skills@latest add timothyjoh/skills
```

It writes the skills into your repo as ordinary files you own and can edit. Pull my latest changes when you want them with `npx skills update`.

</details>

## Prerequisites

The skills shell out to a few tools; each `SKILL.md` names what it needs under Prerequisites. Across the set:

- [`yt-dlp`](https://github.com/yt-dlp/yt-dlp) on `PATH` (`brew install yt-dlp`). No YouTube API key.
- Node 18 or newer, for the bundled scripts.
- `ffmpeg`, `python3`, and `curl` for the media skills. `inworld-tts` needs `INWORLD_API_KEY` in the environment; `chatterbox-tts` needs a local Chatterbox install; `browser-tour` needs the Claude-in-Chrome extension.

## Reference

These split on one axis: who can invoke them. **User-invoked** skills are reachable only when you type them; their job is to orchestrate. **Model-invoked** skills can be invoked by you or reached for automatically by the agent when the task fits.

### Knowledge

Turning sources into knowledge an agent can work with.

**User-invoked**

- **[channel-to-skill](./skills/knowledge/channel-to-skill/SKILL.md)**: Turn a YouTube channel into an agent skill (SKILL.md, concept pages, glossary, patterns, cheatsheet). One question to you picks the videos; a background workflow reads every transcript once and renders the skill. Docs: [channel-to-skill](./docs/knowledge/channel-to-skill.md).

**Model-invoked**

- None yet.

### Writing

Explaining things: to a reader who is lost, or to one who needs a picture.

**User-invoked**

- None yet.

**Model-invoked**

- **[show-me](./skills/writing/show-me/SKILL.md)**: Explain the current topic visually with the smallest view that makes the point: pseudocode, a call tree, a component or file tree, Mermaid, a `diff`, or one focused HTML file. Docs: [show-me](./docs/writing/show-me.md).
- **[asd-ste100](./skills/writing/asd-ste100/SKILL.md)**: Rewrite English so a reader who cannot ask a clarifying question cannot misread it, on the principles of the ASD-STE100 standard. Vendored (MIT) from [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill); `wat` depends on it. Docs: [asd-ste100](./docs/writing/asd-ste100.md).
- **[wat](./skills/writing/wat/SKILL.md)**: Re-explain the previous answer with one picture and plain words. Fires on a bare "wat", on "ELI5", or when the reader says they are lost. Docs: [wat](./docs/writing/wat.md).

### Media

Producing audio and narrated walkthroughs.

**User-invoked**

- None yet.

**Model-invoked**

- **[storytime](./skills/media/storytime/SKILL.md)**: Render a story as a multi-voice MP3: tag the prose by speaker, cast Inworld voices, stitch with ffmpeg. Docs: [storytime](./docs/media/storytime.md).
- **[browser-tour](./skills/media/browser-tour/SKILL.md)**: Drive Claude-in-Chrome through a narrated, pausing tour: research, product wizard, plan narration, or post-implementation demo. Docs: [browser-tour](./docs/media/browser-tour.md).
- **[inworld-tts](./skills/media/inworld-tts/SKILL.md)**: Premium cloud text-to-speech, 65+ voices. Needs `INWORLD_API_KEY`. Docs: [inworld-tts](./docs/media/inworld-tts.md).
- **[chatterbox-tts](./skills/media/chatterbox-tts/SKILL.md)**: Free local text-to-speech with voice cloning. Needs a local Chatterbox install. Docs: [chatterbox-tts](./docs/media/chatterbox-tts.md).

## Developing

```bash
npm install
npm run validate          # claude plugin validate . --strict
scripts/link-skills.sh    # symlink every skill into ~/.claude/skills and ~/.agents/skills
scripts/list-skills.sh
npx changeset             # record a user-visible change before a PR
```

Conventions live in [CLAUDE.md](./CLAUDE.md).

## License

MIT
