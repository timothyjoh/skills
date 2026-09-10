Skills are organized into bucket folders under `skills/`:

- `knowledge/`: turning sources (YouTube channels, playlists, transcripts) into knowledge an agent can work with
- `writing/`: explaining things, to a lost reader or with a picture
- `media/`: producing audio and narrated walkthroughs: TTS engines, multi-voice stories, browser tours
- `in-progress/`: beta: public on purpose, feedback wanted, not shipped in the plugin
- `deprecated/`: no longer used

Every skill in `knowledge/`, `writing/`, or `media/` (the **promoted** buckets) must have a reference in the top-level `README.md` and an entry in `.claude-plugin/plugin.json`'s `skills` array (the Claude Code plugin ships exactly the promoted set). Skills in `in-progress/` and `deprecated/` must not appear in either.

Install commands are copied verbatim from [.agents/install-block.md](./.agents/install-block.md). `.claude-plugin/marketplace.json` makes the repo its own single-plugin marketplace, which is the documented route here (this plugin is not in Claude Code's official marketplace). Run `claude plugin validate . --strict` after touching either manifest.

Each skill entry in the top-level `README.md` must link the skill name to its `SKILL.md`.

Each bucket folder has a `README.md` that lists every skill in the bucket with a one-line description, with the skill name linked to its `SKILL.md`. The promoted buckets' `README.md`s and the top-level `README.md` group entries into **User-invoked** and **Model-invoked**; non-promoted bucket `README.md`s use a flat list.

Skills in the promoted buckets also have a human-facing docs page at `docs/<bucket>/<skill-name>.md`, following [.agents/writing-docs.md](./.agents/writing-docs.md): **What it does**, **When to reach for it**, **Common questions**, **It's working if**. Skills in the non-promoted buckets get no docs page.

Every `SKILL.md` is either user-invoked (`disable-model-invocation: true` plus `policy.allow_implicit_invocation: false` in `agents/openai.yaml`, reachable only by the human) or model-invoked (model- or user-reachable). See [.agents/invocation.md](./.agents/invocation.md).

Skills that ship scripts keep them inside the skill folder (`scripts/`, `workflow/`) and reach them relative to `SKILL.md`, never via a path outside the skill. A skill must work when its folder is copied or symlinked anywhere.

To (re)link every skill outside `deprecated/` into the local harness skill directories (`~/.claude/skills`, `~/.agents/skills`), run `scripts/link-skills.sh`. Each entry is a symlink into this repo, so a `git pull` keeps installed skills current; re-run the script after adding, removing, or renaming a skill.

Releases use changesets: add one under `.changeset/` with every user-visible change; the release workflow opens a version PR, and `npm run version` keeps `.claude-plugin/plugin.json`'s version in sync with `package.json`.

A skill written by someone else carries an `origin` block under `metadata` in its `SKILL.md` frontmatter: `author`, `url` (where it was found), and when known `repository`, `path`, `commit`, and `license`, plus a one-line `modified` note if the copy is not verbatim. The README and docs entries name the author too. This is the credit; it does not change who maintains the copy here.

Vendored third-party skills carry an `ORIGIN.md` naming the upstream commit and license, and are kept byte-identical to upstream: never edit them in place, re-vendor instead. They are exempt from the em-dash rule below.

Skills that depend on a sibling skill's script (storytime and browser-tour on tts-voice) resolve it relative to their own folder (`../<skill>/scripts/`), so the dependency holds wherever the bucket is installed as a set; each such `SKILL.md` names the dependency under Prerequisites and offers an environment-variable override. Secrets never go in a file: a script that needs a credential reads it from an environment variable and fails with the variable's name when it is missing.

No em-dashes anywhere in this repo's prose (`SKILL.md` files, docs, `README.md`, `CHANGELOG.md`, changesets, code comments). Where a sentence reaches for one, rewrite it with a comma, colon, period, parentheses, or a conjunction.
