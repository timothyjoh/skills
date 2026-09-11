---
name: channel-to-skill
description: Turn a YouTube channel, long-form videos and Shorts, into an agent skill (SKILL.md, concepts/, glossary, patterns, cheatsheet), triaged first because a channel is unedited. Uses yt-dlp, no API key.
argument-hint: "<@Handle or channel URL> [--full N] [--full-shorts N] [--dry-run]"
disable-model-invocation: true
---

# Channel To Skill

Build a skill an agent can *work with*, deciding the way the creator decides, from a YouTube channel. Not a knowledge base, and not a folder of video summaries. The unit of organization is the **concept**, mined across every video that teaches it, because a channel says the same thing thirty times under thirty titles.

Both tabs count. Long-form videos carry the reasoning; Shorts are the principles the creator cut out because they landed, and on a clip-heavy channel they are the densest material there is. A Short is about 250 transcript words, so hundreds of them cost less than a dozen long videos.

Steps 1 to 3 are interactive: the only decision a human must make is *which videos*. Steps 4 to 6 run as a background workflow that reads every transcript exactly once.

`--dry-run` runs Steps 1 to 3 in full (they cost no LLM tokens beyond one triage agent), writes `scope.json`, then prints the estimate and the exact Workflow call Step 4 would make, and stops. Nothing is fetched and nothing is generated. Re-run without the flag to build; the scope file is reused, so the question is not asked twice unless the user wants to change it.

## Where things go

The rule: **generated skills land in the same skills root this skill lives in.** Resolve paths once and reuse them.

```bash
SKILL_DIR=<the directory holding this SKILL.md, via the path it was reached by, not readlink>
SKILLS_ROOT=$(dirname "$SKILL_DIR")     # e.g. .claude/skills or ~/.claude/skills
ROOT=$(dirname "$SKILLS_ROOT")          # e.g. .claude or ~/.claude
SCRIPTS="$SKILL_DIR/scripts"
WORKFLOW="$SKILL_DIR/workflow/channel-to-skill.js"
NODE=$(command -v node || echo ~/.nvm/versions/node/*/bin/node)
```

If `SKILLS_ROOT` is not writable, or sits inside a plugin cache (the path contains `/plugins/`), the skill was installed as a managed plugin. Use the project's `.claude/skills` as `SKILLS_ROOT` instead and say so.

For a channel with slug `<slug>` (kebab-case channel name, e.g. `cole-medin`):

| Path | Holds | Committed |
|---|---|---|
| `$SKILLS_ROOT/<slug>/` | the generated skill: `SKILL.md`, `concepts/`, `glossary.md`, `patterns.md`, `cheatsheet.md`, `sources.md`, `manifest.json` | yes |
| `$ROOT/kb/<slug>/` | working data: `catalog.json`, `scope.json`, `raw/` transcripts, `extractions/`, `taxonomy.json` | yes: it is the provenance behind every rule, and fold-in needs it |

The user can relocate a generated skill afterwards; keep the working data beside it if they do.

## Step 1: Identify the channel

Take the argument as an `@handle` or a channel URL. Derive `SLUG` from the channel's display name once the enumerator prints it. If `$ROOT/kb/<slug>/scope.json` already exists this is a **fold-in** run (see the last section).

Use absolute paths from here on: `KB="$ROOT/kb/$SLUG"`, `OUT="$SKILLS_ROOT/$SLUG"`.

## Step 2: Enumerate (zero LLM tokens)

```bash
$NODE $SCRIPTS/cts_enumerate.js @Handle --kb-dir "$KB" --full 150 --full-shorts 100
```

Flat-lists the whole `/videos` tab and the whole `/shorts` tab in seconds, then pulls full metadata at one to two seconds each for two subsets: dates, descriptions and chapters for the newest `--full` long-form videos, and dates and durations for the top `--full-shorts` Shorts by views (the flat Shorts list carries views but no durations, and for a clip, views beat recency as the signal of which principle landed). Every catalog entry carries `kind: video | short`. Nothing is dropped by duration unless `--min-duration` is passed; pass `--tabs videos` to skip Shorts on a channel where they are plainly filler.

Writes `catalog.json` and prints two blocks: long-form (count, runtime, word estimate, dated range, per-year distribution, how many older videos fall outside the metadata window) and Shorts (count, median length, word estimate, view distribution, how many were sampled).

Show the user that summary as printed. If the channel has more long-form videos than the window and the per-year counts suggest the older ones matter, re-run with a larger `--full`. If the Shorts block shows many clips over 100k views, raise `--full-shorts` so the triage has dates for all of them.

## Step 3: Triage and scope (the human decision)

Spawn **one** agent to read `$KB/catalog.json` and return a triage proposal. Give it this brief:

> Read catalog.json. Every entry has `kind: video` (long-form) or `kind: short`. Propose a scope for turning this channel into a skill. Return: (1) three candidate cuts, each a *mix* of long-form and Shorts with both counts and a one-line rationale: typically *recent* (long-form from the last 12 to 24 months plus the top Shorts by views from the same span), *core* (recent plus the highest-viewed older long-form and older Shorts), and *broad* (long-form capped at 100 plus Shorts capped at 300). Weight the mix by what the channel actually is: on a clip channel most of the wisdom is in the Shorts; on a lecture channel the Shorts are teasers and a small top-by-views slice is enough. Budget: a long-form video costs about 30k tokens to process, a Short about 3k. (2) clusters of videos that are obviously the same topic by title, description, or chapters, with the newest marked *keep* and the rest *drop*. Be conservative on long-form: titles hide the payoff, so drop only clear re-uploads and series repeats. Be aggressive on Shorts: a clip channel restates one principle dozens of times, so keep the highest-viewed Short per principle and drop the rest, and work only from the top Shorts by views (the undated tail is not worth clustering). (3) anything that is plainly not knowledge (vlogs, reactions, streams, physique and lifestyle clips, memes) to exclude. Output the cut lists as arrays of video ids.

Then ask the user **one** question with those cuts as options, plus "Other". Each option names both counts ("62 long-form + 180 Shorts"). Default recommendation: the cut closest to 60 to 100 long-form videos, or on a clip channel the one whose Shorts count is closest to 200. Give the estimate in one line: long-form at about 30k tokens each and Shorts at about 3k, so 100 long-form is roughly 3M tokens and 15 to 20 minutes, and 300 Shorts add about 1M; transcripts are free.

Write the choice to `$KB/scope.json`:

```json
{ "channel": "<display name>", "handle": "@Handle", "slug": "<slug>", "chosen_cut": "<name>",
  "decided_at": "<YYYY-MM-DD>", "videos": [ { "id": "...", "kind": "video|short", "title": "...", "published": "YYYY-MM-DD" } ] }
```

`kind` is required on every entry; the fetcher writes it into each transcript and the workflow batches and prompts by it. Dropped clusters and exclusions stay in `catalog.json`; only `scope.videos` gets fetched.

## Step 4: Run the workflow

**If `--dry-run`:** print the scope as two counts (long-form and Shorts), the estimate (about 30k tokens per long-form video and 3k per Short, so 100 long-form is roughly 3M tokens and 15 to 20 minutes and 300 Shorts add about 1M; transcripts are free), and the Workflow call below with every argument filled in as it would be sent. Then stop and tell the user to re-run without `--dry-run` to build.

```
Workflow({
  scriptPath: "<absolute $WORKFLOW>",
  args: { slug: "<slug>", channel: "<display name>", kbDir: "<absolute $KB>",
          skillDir: "<absolute $OUT>", scriptsDir: "<absolute $SCRIPTS>",
          today: "<YYYY-MM-DD>", mode: "build", node: "<absolute $NODE>" }
})
```

Every arg is required and absolute; the workflow throws on a missing one rather than guessing. Optional: `batchWords` (transcript words per extraction batch, default 40000) and `batchMax` (transcripts per batch, default 40). **Check its first log line** reads `config: slug=<slug> mode=build`. It runs in the background: wait for the completion notification, do not poll.

What it does, so the user can follow `/workflows`:

| Phase | Agents | What |
|---|---|---|
| Fetch | 1, low effort | sequential yt-dlp via `cts_fetch.js`, about 5 s per video, idempotent |
| Extract | one per ~40k transcript words (about 8 long-form or 150 Shorts), Sonnet | each transcript read **once** into `extractions/<id>.json`: thesis (the payoff, not the hook), concepts with timestamped quotes, decision rules, terms, entities, voice notes. A Short yields one concept, never padded |
| Canonicalize | 1, high effort | merges every extraction into `taxonomy.json`: frozen ids, aliases, folds, superseded videos, voice profile. Shorts fold into the concept they restate and are counted per concept: several Shorts on one idea marks it central |
| Render | one per concept, Sonnet | `concepts/<id>.md` from its slice of the extractions |
| Support | 4 | glossary, patterns, cheatsheet in parallel; then `SKILL.md` and `sources.md` |
| Validate | 1, low effort | `cts_validate.js`, writes `manifest.json` |

## Step 5: Verify

```bash
$NODE $SCRIPTS/cts_validate.js --skill-dir "$OUT" --kb-dir "$KB"
git status --porcelain | grep -vE "$SKILLS_ROOT/$SLUG/|$ROOT/kb/$SLUG/"
```

Expect **0 errors** from the validator and **nothing** from the grep (agents write only under the two directories). Read the validator's size line: `SKILL.md` must be near or under 4k tokens, because it is the only file loaded at work time. Open `cheatsheet.md` and two concept pages and check they read as *decisions* ("Use X when Y"), not as video recaps. If they recap, that is a prompt problem worth fixing in the workflow, not a page to patch.

The workflow result reports `skipped_videos` (entertainment) and any failed extract batches. A failed batch is retried by simply re-running Step 4: fetch and extraction are both idempotent.

## Step 6: Commit and report

```bash
git add "$SKILLS_ROOT/$SLUG" "$ROOT/kb/$SLUG"
git commit -m "feat(skill): $SLUG via channel-to-skill, N videos, M concepts"
```

Report: long-form and Shorts in scope vs. transcripts fetched vs. skipped; concept count and groups; token spend from the workflow notification; the validator's size line; and how to use it. Asking for `<slug>` loads the core frameworks; asking `<slug>` about a topic reads the concept file. Skills load on session start, so a restart is needed before the new skill triggers.

## Fold-in (the channel kept publishing)

Re-run `/channel-to-skill @Handle` later. When `scope.json` exists:

1. Re-run Step 2. Diff `catalog.json` against `scope.videos` and `raw/manifest.json`: the new ids, long-form and Shorts alike, are the candidates.
2. Triage only the new videos (Step 3, smaller question). Append the chosen ones to `scope.videos`, each with its `kind`.
3. Step 4 with `mode: "fold-in"`. Fetch and extract skip everything already done; canonicalize reads the existing taxonomy and **never renames or removes an id**, so links in the skill stay valid; render re-writes only concepts whose `video_ids` changed plus any new ones; support files and `SKILL.md` regenerate.
4. Steps 5 and 6.

## Notes

- Sponsor reads, intros and outros are dropped by instruction at extraction. Good enough; do not pre-trim transcripts.
- Shorts fetch like any other video (`watch?v=<id>` works for them) and carry auto-captions on a talking-head clip. A Shorts tab that is mostly music beds or on-screen text will come back `no-captions`; the one-third rule below applies to the scope as a whole.
- A channel with mostly-missing captions is not worth a skill. `cts_fetch.js` reports `no-captions` per video; if that is more than a third of the scope, stop and say so.
- Never parallelize fetching. One IP, one yt-dlp process: parallel requests get rate-limited and the run halts.
- Requires `yt-dlp` on PATH (`brew install yt-dlp`) and Node 18 or newer. No API key.
- The generated skill is derived from someone else's material. If it is ever published, keep it private unless the user holds the rights.
