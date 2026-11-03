## What it does

`video-lineup` makes one short video several ways at once. You write one brief; it hands the brief to several video skills in parallel, each in its own folder and its own T3 Code session; then it measures every output the same way and puts them side by side on one local page with a "play all" button.

The defining constraint: every build runs unattended on the same brief and the same rules (free and local only, only the brief's facts, every human checkpoint decided by the agent and logged), so the outputs differ by builder, not by setup. The orchestrating agent never edits a build; it starts, follows, measures and reviews.

## When to reach for it

Type `/video-lineup` with a topic, a brief file or an existing lineup folder. The agent does not start a lineup on its own: a full lineup is hours of agent time and 5 to 10 GB of disk.

Use it when you want options for a product or skill video, or when you want to see which builder suits a new kind of video. For narration audio alone, use [tts-voice](./tts-voice.md). For a live, narrated walk through a web app, use [browser-tour](./browser-tour.md).

## Prerequisites

Node 24 or newer, `git`, `ffmpeg`, `npm`, `uv` and Google Chrome; a running T3 Code with an authenticated provider; and the [t3-handoff](../development/t3-handoff.md) skill, which starts and follows each build's session. The baseline build uses [tts-voice](./tts-voice.md) for its narration when it is installed. A local Whisper (`mlx_whisper` or `whisper`) adds narration transcripts to the comparison.

## The builders

| Builder | By | Makes |
|---|---|---|
| [huashu-motion](https://github.com/alchaincyf/huashu-motion) | Huashu | Art-directed launch film: kinetic type and an original score, no voice by default |
| [take-one](https://github.com/talsiach/take-one) | talsiach | Story-driven launch film with music and effects, plus post copy |
| [explainroo](https://github.com/vincentsch/explainroo) | vincentsch | Narrated explainer with word-synced scenes and subtitles; the fastest builder |
| [video-director](https://github.com/win4r/video-director) | win4r | Directed explainer: the agent writes the renderer under the skill's rules; its QA script checks every output in the lineup |
| [argo](https://github.com/shreyaskarnik/argo) | shreyaskarnik | Recorded demo of a running web app, with overlays and narration |
| control | none | The same video without a video skill: HTML scenes, Playwright, ffmpeg |
| [earshot](https://github.com/Leonxlnx/earshot) | Leonxlnx | A sound design pass on the control video |

All are MIT licensed, and none of their files ship with this skill: each run fetches every builder's latest commit from GitHub, checks it (below), and clones it into its build folder, and its packages install there. Model and browser caches (up to 2.5 GB) go under `~/.cache` and the Playwright cache, and later lineups share them.

## What you get

A lineup folder with the brief, one build folder per builder (each with `out/final.mp4`, a poster and a BUILD-LOG.md that records every decision the agent made for you), and `site/index.html`. The page shows each video with its spec check against the brief, loudness, the shared QA result, the narration transcript, a 12-frame contact sheet, claims that are not in the brief, and scores from reviewers and two judges. Open it in Chrome or Safari from `file://`; some embedded file viewers do not load local videos.

## Common questions

**Can I share this skill?** Yes. The builders are other people's GitHub repos, linked in the table above, and the skill fetches them itself on every run, so the person you share it with needs nothing extra. They can also clone any builder's repo to use it on its own.

**Is it safe to run other people's video skills unattended?** Each run starts with an upstream check. It fetches each builder's newest commit and eliminates a repo that is archived or has had no commit for 180 days. It scans every file for prompt injection and dangerous code, and audits the dependencies without running any install script; a hit eliminates the builder. A fresh agent then reviews each new commit's instructions and code, and the skill remembers what it reviewed, so later runs read only what changed. The agent tells you which builders were eliminated and why before you agree the lineup. It lowers the risk; it does not remove it.

**Why is a builder missing from my lineup?** The upstream check eliminated it. The reason is in `upstream.json` and in init's output, for example a dependency with a known high-severity vulnerability. Only you can accept that, by adding a `scanAllow` entry with a reason in `builders.json`, or by changing the audit level.

**Can I trust the scores?** Only as a starting point. Reviewers and judges see frames, transcripts and measurements, not the moving video, and nobody listens to the mix. Watch and listen before you choose; local voices can mispronounce product names.

**Why one T3 project per build?** T3 Code runs one implementation turn at a time per project. Separate projects let the builds run in parallel without sharing a checkout.

## It's working if

- Every build folder has `out/final.mp4` and a BUILD-LOG.md with all 10 sections, or the lineup tells you which build stopped and why, with its session link.
- The page plays every finished video, and its spec, loudness and QA lines match what you see and hear.
- No video claims something the brief's facts do not say, or the review lists the claim.
