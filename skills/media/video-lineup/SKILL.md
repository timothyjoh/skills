---
name: video-lineup
description: Build one video brief with several video skills at once (huashu-motion, take-one, explainroo, video-director, argo, a no-skill baseline and an earshot sound pass), each in its own T3 Code session, then measure every output and compare them on one local page. Each run fetches every builder's latest upstream commit and security-checks it first.
argument-hint: "<topic, brief file, or lineup folder> [--builders a,b,c]"
disable-model-invocation: true
---

# Video lineup

One brief, several video skills, built in parallel and measured the same way, then compared on one page. Each builder gets its own folder, its own T3 project and its own agent session, so the builds run at the same time and never share a checkout. You orchestrate: you write the brief, start the builds, follow them, measure and review the results. You never edit a build folder yourself.

`scripts/lineup.mjs` does the deterministic work. Resolve it from this skill's folder, not the caller's working directory. Every command takes `--dir LINEUP_DIR` (default: the current folder) and prints JSON or one line per event.

## Prerequisites

- Node.js 24 or newer: register, dispatch, status and watch run t3-handoff, which needs 24 (init, measure and site run on 22). git, ffmpeg and ffprobe with libx264, aac, `tile` and `ebur128`. npm for explainroo and argo. uv for the shared QA script and earshot.
- Google Chrome: take-one requires it, and huashu-motion needs an installed Chrome, Chromium or Edge (or `OM_CHROME`). The other builders can use a Playwright Chromium.
- The **t3-handoff** skill and a running T3 Code with an authenticated provider. The script finds t3-handoff's `scripts/t3.mjs` beside this skill or in the repo layout (`../../development/t3-handoff`); `VIDEO_LINEUP_T3` overrides. Call the Skill tool with `t3-handoff` for its rules, or read the `SKILL.md` one folder above the `scripts/t3.mjs` path that `doctor` prints if that tool is absent. The t3 CLI registers projects; `VIDEO_LINEUP_T3_CLI` overrides.
- Optional: the **tts-voice** skill beside this one, for the control build's narration (`VIDEO_LINEUP_TTS` overrides; without it, the control uses macOS `say`). A local Whisper for transcripts: `mlx_whisper` or `whisper` on PATH, the `mlx_whisper` install the youtube-summarize skill leaves in `~/.cache/youtube-summarize`, or `VIDEO_LINEUP_WHISPER` set to one command with `{wav}` and `{outdir}` that writes a `.txt`. Builds get the same command in their machine facts.
- For the upstream check: `gh` (optional, signed in) to tell whether a GitHub repo is archived; `npm` and `uv` also run the dependency audits.
- Disk: about 5 GB for a full lineup of 40-second videos and about 10 GB for 60 to 75 seconds, mostly rendered frames and local voice environments, plus up to 2.5 GB of model caches under `~/.cache` and the Playwright cache, which later lineups share.

Run `node <skill>/scripts/lineup.mjs doctor` first. A `FAIL` line blocks the lineup; a `warn` line blocks only the builder or step it names. The machine facts it prints go into every build's prompt.

## Builders

Times are from two unattended lineups in November 2026 with Claude Opus 5.5 at high effort: a 40-second video, then a 60 to 70 second one. Folder sizes are from the first.

| Builder | Makes | Sound | Time to final (40 s / 60 to 70 s) | Build folder at the end |
|---|---|---|---|---|
| huashu-motion | Launch film: beat-cut kinetic type, art-directed | Original score and effects, no voice by default | 35 / 50 min | 320 MB, plus a 72 MB sample cache |
| take-one | Story-driven launch film, plus POSTS.md | Music and effects, no voice | 35 / 38 min | 350 MB |
| explainroo | Narrated explainer, word-synced, with subtitles | Kokoro narration and music | 6.5 / 11 min | 630 MB, plus 390 MB of shared models |
| video-director | Directed explainer: the agent writes the renderer under the skill's rules | Narration, music, effects | 28 / 51 min | 650 MB, plus 0.9 GB if it downloads a Whisper |
| argo | Recorded demo of a web app, with overlays | Kokoro narration | 11 min / not run | 1.1 GB |
| control | No video skill: HTML, Playwright, ffmpeg | tts-voice narration | 13 (9.5 of them an ffmpeg mux hang) / 11 min | 150 MB |
| earshot-pass | earshot sound design on the control video | Narration, sound bed and cues | 11 / 14 min after control | 1.5 GB, plus 1 GB of shared models |

All seven is the default. Pick fewer when the job is narrower: a quick narrated explainer (explainroo, video-director, control), a launch clip for muted feeds (huashu-motion, take-one), or a product demo (argo, with a demo URL in the brief). earshot-pass needs control in the lineup. Each new lineup uses every builder's latest upstream commit that passed step 1; `builders.json` keeps the last known-good commit for `init --pinned`.

## Builder sources

The builders are other people's skills. This skill copies none of their files: it fetches each one from GitHub when it runs, so anyone who receives this skill gets the builders the same way. To read or install one on its own, clone its repo:

| Builder | Repo | Author | License |
|---|---|---|---|
| huashu-motion | https://github.com/alchaincyf/huashu-motion | Huashu (alchaincyf) | MIT |
| take-one | https://github.com/talsiach/take-one | talsiach | MIT |
| explainroo | https://github.com/vincentsch/explainroo | vincentsch | MIT |
| video-director (also the shared QA script) | https://github.com/win4r/video-director | win4r | MIT |
| argo | https://github.com/shreyaskarnik/argo | shreyaskarnik | MIT |
| earshot-pass | https://github.com/Leonxlnx/earshot | Leonxlnx | MIT |
| control | none: local tools only | | |

Licenses are as of the last pin. Check a repo's license again when its upstream check shows new commits.

## Resume a lineup

If the argument is a folder with a `lineup.json`, or your session was interrupted, do not write a new brief and do not touch `brief/BRIEF.md`: running builds read it. Run `status --dir FOLDER` and continue from the first step whose check has not passed. No `lineup.json` means upstream (unless one from the last 24 hours exists), then init; projects missing means register; builds not dispatched means dispatch; builds not settled (other than builds you reported stopped) means watch; all settled means steps 7 to 10. Every command is safe to rerun, and a rerun of init keeps the commits already in `lineup.json`, so resuming never moves a build to a newer upstream commit. If the argument is a brief file, run step 1, choose the folder as in step 2, skip writing the brief, and run init with `--brief FILE`.

## Run a lineup

Track these steps in the host's plan or progress list. Mark a step done only when its check passes.

1. Upstream and security review
2. Brief
3. Init
4. Register
5. Dispatch
6. Watch
7. Check and follow up
8. Measure
9. Review and judge
10. Page and report

### 1. Upstream and security review

Do this at the start of every run, before you choose builders with the user. It takes about a minute.

```sh
node <skill>/scripts/lineup.mjs upstream
```

For each builder repo it fetches the newest commit of the default branch into a mirror under `~/.cache/video-lineup/upstream/`, then:

- **Freshness:** eliminates a repo that is archived (needs `gh`) or whose last commit is older than `--max-age-days` (default 180).
- **Scan:** reads every tracked file. In the files an agent loads as instructions it looks for prompt injection (instructions to drop the agent's rules or hide things from the human, invisible characters, hidden HTML comments, encoded blobs); in code, for piped installs, encoded code that runs, credential reads, exfiltration hosts, and destructive or persistent commands; in the tree, for links out of the repo and prebuilt binaries. A `block` finding eliminates the builder; a `warn` goes to the review.
- **Audit:** resolves the dependencies without running any install script (`npm install --package-lock-only --ignore-scripts`, `uv pip compile --no-build`), then runs `npm audit` or `pip-audit`. High or critical npm advisories, or any known Python vulnerability, eliminate the builder (`--audit-level` changes the npm level).
- **Review state:** compares the commit with the last agent review in `~/.cache/video-lineup/vetted.json`.

Each builder ends `ok` (reviewed clean at this commit), `review` (new or never-reviewed commit) or `eliminated` (with reasons). Do not work around an elimination: tell the user the builder and the reason. Only a human can accept a scan block or an audit result, with a `scanAllow` entry and a reason in `builders.json`, or a different `--audit-level`.

For each `review` builder, read [references/security-review.md](references/security-review.md) and give it to one fresh subagent per builder (where the host has subagents; otherwise review each in turn in the main session). A first review of a repo takes 3 to 5 minutes and about 200k tokens per builder (take-one, November 2026); later runs review only the commits since. Check each verdict's evidence as that file says, then record it:

```sh
node <skill>/scripts/lineup.mjs vet --name NAME --verdict clean --notes "NOTES"
```

Check: every builder you plan to use is `ok`. Tell the user which builders were eliminated and why, one line each, before you agree the brief and the builder list.

### 2. Brief

Choose a lineup folder that does not exist yet: `$VIDEO_LINEUP_DIR/<short-name>` if that variable is set, else `~/video-lineups/<short-name>`; add `-2`, `-3` if the name is taken. Copy `templates/BRIEF.md` to `<folder>/brief/BRIEF.md` and fill it in from what the user gave you.

- Facts are the only claims any build may make. Each must be true and checkable. Do not add facts the user did not give or that you did not verify in a source.
- Sources: public pages, and local paths the builds may read but never edit. A demo URL is for argo and must point at a running web app.
- Keep the `Length:` and `Format:` lines in the template's form; `init` reads the frame size and length from them. Length is a range. For a single length, write a narrow range around it: for 30 seconds, `28 to 32 seconds`.
- Builder notes are optional per-builder wishes, for example `explainroo: no watermark`.

If you wrote any fact the user did not state, get one go before init, for everything at once: show the brief, the builder list, and the provider, model and effort for the builds (list the choices with t3-handoff's `models` command). A lineup costs hours of agent time. If the user gave a complete brief, named the builders and the model, go on. Otherwise, ask once before init for only what is missing (usually the provider, model and effort).

### 3. Init

```sh
node <skill>/scripts/lineup.mjs init --dir LINEUP_DIR --brief LINEUP_DIR/brief/BRIEF.md --builders huashu-motion,explainroo,control
```

Omit `--builders` for all seven. Init reads the upstream check (it refuses one older than 24 hours, or a builder still waiting for review), leaves out the eliminated builders and lists them under `eliminated`, and clones each remaining builder at its vetted commit into `builds/<name>/vendor/`, links its skill into `builds/<name>/.claude/skills/`, makes each build folder a git repo, clones video-director's QA script into `tools/`, runs the slow installs (npm, Python, model downloads) so no build stalls on an approval, and writes one prompt per build to `handoffs/<name>.prompt.md`.

Check: `failed` is empty, and the user has heard about every builder under `eliminated`. If not, read the build's `error` or `INSTALL-NOTES.log`, fix the cause, and rerun the same command: init skips work that is done. Read one prompt before you dispatch.

### 4. Register

T3 refuses two implementation turns at once in one project, so each build folder becomes its own T3 project:

```sh
node <skill>/scripts/lineup.mjs register --dir LINEUP_DIR
```

Check: `missing` is empty. If the t3 CLI is unavailable, add the folders listed under `errors` as projects in T3 Code (or with the host's T3 project tool), then rerun register to record their IDs.

### 5. Dispatch

Load t3-handoff's rules (see Prerequisites) and run its `doctor`. New projects have no model default, so pass the provider, model and effort agreed in step 2; the same settings for every build keep the comparison fair. The first dispatch saves them in `lineup.json`, and later dispatches reuse them.

```sh
node <skill>/scripts/lineup.mjs dispatch --dir LINEUP_DIR --provider PROVIDER --model MODEL --effort high
```

Each build gets a request key made from the lineup's name, its creation time and the build name. A lost response or a `start failed` line is safe to retry with the same command: the same key returns the same session, never a duplicate. Do not change keys to retry. A `setup not done` line means init ran without setup; rerun init first. earshot-pass reports `waiting` until the control build has finished.

### 6. Watch

**Claude Code:** run `node <skill>/scripts/lineup.mjs watch --dir LINEUP_DIR --timeout 1740` under the Monitor tool with `timeout_ms` 1800000, and start it again after `PAUSE` or when the monitor expires. **Codex or another shell:** run `watch --timeout 540` repeatedly; `PAUSE` means run it again. Watch prints one line per new progress report (`REPORT`), state change (`STATE`) or finished video (`VIDEO`), and ends with `END` when every dispatched build has settled. It remembers what it printed, so a rerun prints only what is new.

- Give the user one short line per report or state change.
- `STATE earshot-pass ... -> ready`: run `dispatch --only earshot-pass` (it reuses the saved model flags). Start watch again if it has ended.
- `needs_input`, `needs_approval` or `needs_plan_review`: relay the question or action with the session link, as t3-handoff describes. Do not answer or approve on the user's behalf beyond what they already authorized.
- `unknown` or `superseded`: neither proves a build ended. On T3 Code 0.1.5, t3-handoff can lose sight of a long session's prompt (`unknown`), and a session that waits on background work starts a new run when that work reports, which t3-handoff reads as a newer request (`superseded`). `unreadable` means t3-handoff's status call failed, for example while T3 restarts. Watch counts a build in any of these states as settled only when its deliverables are complete, and says so. Open the session link to confirm. If such a build is still unsettled after two `PAUSE` lines, open its session link: if the session has ended with files missing, report the build as stopped, with its link. When every other build has settled, stop watching and go on to step 7; measure and site handle a missing video.
- When you run inside a T3 session yourself, the same applies to you: if you end your turn while a monitor runs, your coordinator sees `superseded`. Keep sending progress reports so it can follow you.

### 7. Check and follow up

```sh
node <skill>/scripts/lineup.mjs status --dir LINEUP_DIR
```

A finished turn is not proof. For each settled build, check: `out/final.mp4`, `out/poster.png`, and 10 of 10 BUILD-LOG sections. If one fails, send one targeted follow-up through the build's own session with t3-handoff's `reply`, using the build's `id` from `status` (name the failed check, the observed output and the fix wanted), then watch again. t3-handoff's `status ID` shows a waiting build's questions and their request IDs. t3-handoff refuses to reply to an `unknown` session: give the user the session link and the follow-up text instead. After two follow-ups for the same build, stop and report it with its session link.

### 8. Measure

```sh
node <skill>/scripts/lineup.mjs measure --dir LINEUP_DIR
```

For every build with a video, measure writes `site/assets/<name>/`: `measure.json` (ffprobe spec against the brief, loudness, shared QA lines, transcript, BUILD-LOG sections, minutes from dispatch to the final file), the poster, 12 frames and a 4x3 contact sheet, the transcript and the QA report. It copies the video to `site/videos/<name>.mp4`. A video that ffprobe cannot read gets `ok: false` and an error. Spec and QA failures are part of the comparison: report them, send no follow-up for them, and do not fix a build's output yourself.

### 9. Review and judge

Read [references/review.md](references/review.md). Use one reviewer per build, a fresh subagent where the host has them, to write `site/assets/<name>/review.json`: claims outside the brief, strengths, weaknesses, decisions made for the human, and six scores. Then, optionally, two judges with different lenses each return a ranking, and you write both into `site/judges.json`, and a short recommendation goes in `site/notes.html`. Check each reviewer's evidence before you accept it: spot-check one claimed fact against the transcript or frames.

### 10. Page and report

```sh
node <skill>/scripts/lineup.mjs site --dir LINEUP_DIR
```

The page plays every video side by side, with a "play all" button; unmuting one video mutes the others. It loads from `file://` with no server. Give the user the `open` command from the output. Some embedded file viewers do not load local videos, so tell the user to open the page in Chrome or Safari. Where the host shows video in chat, also embed each `site/videos/<name>.mp4`.

Report one line per build: spec, shared QA verdict, claims outside the brief, time to final. Say plainly that the reviews and judges saw frames, transcripts and numbers, not the moving video. The user must watch and listen before choosing; local voices can mispronounce product names.

Report the disk use (`du -sh LINEUP_DIR`). Delete a lineup, its T3 projects (`t3 project remove`) or its caches only when the user asks.

## Change a builder

`builders.json` holds each builder's repo, last known-good commit (used by `init --pinned`), skill links, port, setup commands, `audit` entries (`{"kind": "npm", "cwd": "."}`, `{"kind": "npm", "packages": "..."}` or `{"kind": "python", "cwd": ".", "extras": [...]}`) and `scanAllow` exceptions (`{"rule", "file", "reason"}`, each one a human decision); `builders/<name>.md` holds its instructions. Values in `{{double braces}}` are filled by init (for example `{{folder}}`, `{{width}}`, `{{brief}}`). To add a builder, add its entry and instructions, then run upstream and review it like any other. To move the known-good pin, copy a commit that is `ok` in `upstream.json`.
