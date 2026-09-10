---
name: channel-to-skill
description: Turn a YouTube channel into an agent skill (SKILL.md, concepts/, glossary, patterns, cheatsheet), triaged first because a channel is unedited. Uses yt-dlp, no API key.
disable-model-invocation: true
---

# Channel To Skill

Build a skill an agent can *work with*, deciding the way the creator decides, from a YouTube channel. Not a knowledge base, and not a folder of video summaries. The unit of organization is the **concept**, mined across every video that teaches it, because a channel says the same thing thirty times under thirty titles.

Steps 1 to 3 are interactive: the only decision a human must make is *which videos*. Steps 4 to 6 run as a background workflow that reads every transcript exactly once.

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
$NODE $SCRIPTS/cts_enumerate.js @Handle --kb-dir "$KB" --full 150
```

Flat-lists the whole `/videos` tab in seconds (shorts live on a different tab and are excluded), then pulls dates, descriptions and chapters for the newest `--full` videos at one to two seconds each. Writes `catalog.json` and prints: total and long-form counts, runtime and transcript-word estimate, per-year distribution, and how many older videos fall outside the metadata window.

Show the user that summary as printed. If the channel has more videos than the window and the per-year counts suggest the older ones matter, re-run with a larger `--full`.

## Step 3: Triage and scope (the human decision)

Spawn **one** agent to read `$KB/catalog.json` and return a triage proposal. Give it this brief:

> Read catalog.json. Propose a scope for turning this channel into a skill. Return: (1) three candidate cuts, each with a video count and a one-line rationale: typically *recent* (last 12 to 24 months), *core* (recent plus the highest-viewed older videos), and *broad* (everything long-form, capped at 100); (2) clusters of videos that are obviously the same topic by title, description, or chapters, with the newest marked *keep* and the rest *drop*. Be conservative: titles hide the payoff, so drop only clear re-uploads and series repeats; (3) anything that is plainly not knowledge (vlogs, reactions, streams) to exclude. Output the cut lists as arrays of video ids.

Then ask the user **one** question with those cuts as options, plus "Other". Default recommendation: the cut closest to 60 to 100 videos. Explain in one line what a 100-video run costs: roughly 3M tokens and 15 to 20 minutes, transcripts free.

Write the choice to `$KB/scope.json`:

```json
{ "channel": "<display name>", "handle": "@Handle", "slug": "<slug>", "chosen_cut": "<name>",
  "decided_at": "<YYYY-MM-DD>", "videos": [ { "id": "...", "title": "...", "published": "YYYY-MM-DD" } ] }
```

Dropped clusters and exclusions stay in `catalog.json`; only `scope.videos` gets fetched.

## Step 4: Run the workflow

```
Workflow({
  scriptPath: "<absolute $WORKFLOW>",
  args: { slug: "<slug>", channel: "<display name>", kbDir: "<absolute $KB>",
          skillDir: "<absolute $OUT>", scriptsDir: "<absolute $SCRIPTS>",
          today: "<YYYY-MM-DD>", mode: "build", node: "<absolute $NODE>" }
})
```

Every arg is required and absolute; the workflow throws on a missing one rather than guessing. **Check its first log line** reads `config: slug=<slug> mode=build`. It runs in the background: wait for the completion notification, do not poll.

What it does, so the user can follow `/workflows`:

| Phase | Agents | What |
|---|---|---|
| Fetch | 1, low effort | sequential yt-dlp via `cts_fetch.js`, about 5 s per video, idempotent |
| Extract | one per 8 videos, Sonnet | each transcript read **once** into `extractions/<id>.json`: thesis (the payoff, not the hook), concepts with timestamped quotes, decision rules, terms, entities, voice notes |
| Canonicalize | 1, high effort | merges every extraction into `taxonomy.json`: frozen ids, aliases, folds, superseded videos, voice profile |
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

Report: videos in scope vs. transcripts fetched vs. skipped; concept count and groups; token spend from the workflow notification; the validator's size line; and how to use it. Asking for `<slug>` loads the core frameworks; asking `<slug>` about a topic reads the concept file. Skills load on session start, so a restart is needed before the new skill triggers.

## Fold-in (the channel kept publishing)

Re-run `/channel-to-skill @Handle` later. When `scope.json` exists:

1. Re-run Step 2. Diff `catalog.json` against `scope.videos` and `raw/manifest.json`: the new ids are the candidates.
2. Triage only the new videos (Step 3, smaller question). Append the chosen ones to `scope.videos`.
3. Step 4 with `mode: "fold-in"`. Fetch and extract skip everything already done; canonicalize reads the existing taxonomy and **never renames or removes an id**, so links in the skill stay valid; render re-writes only concepts whose `video_ids` changed plus any new ones; support files and `SKILL.md` regenerate.
4. Steps 5 and 6.

## Notes

- Sponsor reads, intros and outros are dropped by instruction at extraction. Good enough; do not pre-trim transcripts.
- A channel with mostly-missing captions is not worth a skill. `cts_fetch.js` reports `no-captions` per video; if that is more than a third of the scope, stop and say so.
- Never parallelize fetching. One IP, one yt-dlp process: parallel requests get rate-limited and the run halts.
- Requires `yt-dlp` on PATH (`brew install yt-dlp`) and Node 18 or newer. No API key.
- The generated skill is derived from someone else's material. If it is ever published, keep it private unless the user holds the rights.
