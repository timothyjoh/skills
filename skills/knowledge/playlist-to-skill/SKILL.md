---
name: playlist-to-skill
description: Turn every video in a YouTube playlist into a concept-based agent skill, with no triage or subset selection.
argument-hint: "<YouTube URL containing list=...> [--dry-run]"
disable-model-invocation: true
---

# Playlist to skill

Build an agent skill from a whole YouTube playlist. Organize by concepts mined across the videos, with actionable decision rules, stable concept IDs, and timestamped sources. The playlist is the user's chosen scope. Include every entry automatically, regardless of views, age, duration, topic, repetition, or perceived usefulness. Never propose cuts or ask the user to pick videos.

Preserve the channel-to-skill processing principles: fetch sequentially, read each transcript once into an extraction, merge related ideas into a frozen taxonomy, then render concept pages and support files from those extractions. All scripts are bundled here; this skill works without channel-to-skill installed.

## Prerequisites

Node 18 or newer and `yt-dlp` on PATH. No YouTube API key. Fetching means downloading captions and metadata, as in channel-to-skill; video and audio media files are not downloaded.

The bundled workflow uses a host-provided `Workflow` tool with `agent`, `parallel`, `phase`, and `log` globals. If that tool is unavailable, read [workflow/playlist-to-skill.js](workflow/playlist-to-skill.js) and execute its phases with available tools, using agents where supported or sequential execution otherwise. Do not run that workflow file directly with Node. The scripts under `scripts/` are ordinary Node programs.

## 1. Resolve the playlist and paths

Accept a YouTube URL with a `list` parameter, including a watch, Shorts, or youtu.be link with a playlist attached. Use the playlist ID, ignoring the individual video, timestamp, and starting index. A plain video URL has no playlist to enumerate; ask for a playlist URL. Auto-generated mixes have no fixed membership; request a saved playlist instead.

Resolve `SKILL_DIR` from the path used to reach this SKILL.md, without resolving symlinks. Set `SKILLS_ROOT` to its parent and `ROOT` to the parent of `SKILLS_ROOT`. If the skills root is unwritable or inside a plugin cache, use the project's `.claude/skills` and `.claude` instead and say so.

Use `SLUG=playlist-<lowercase playlist ID>` to keep runs stable across title changes. Set absolute paths:

- `KB=$ROOT/kb/$SLUG`, for catalog, scope, raw transcripts, extractions, and taxonomy.
- `OUT=$SKILLS_ROOT/$SLUG`, for the generated skill.
- `SCRIPTS=$SKILL_DIR/scripts` and `WORKFLOW=$SKILL_DIR/workflow/playlist-to-skill.js`.
- `NODE` to the absolute path returned by `command -v node`.

Before using that default, look for an existing scope for this playlist: `grep -l '"playlist_id": "<ID>"' $ROOT/kb/*/scope.json`. If one exists, take `SLUG` from its `slug` field and use that directory, even when it was renamed to a readable name such as `dan-mohler`. A renamed skill keeps its `name` frontmatter, `manifest.json`, and `scope.json` `slug` in sync with the directory name. The enumerator rejects a working directory that belongs to another playlist. Preserve working data with the generated skill so future runs retain provenance.

## 2. Enumerate everything

```bash
"$NODE" "$SCRIPTS/pts_enumerate.js" "$PLAYLIST_URL" --kb-dir "$KB"
```

The enumerator normalizes the URL, lists the whole playlist, and writes `catalog.json` and `scope.json` with `chosen_cut: "all"`. It ignores local yt-dlp configuration so a configured range or filter cannot shrink the scope. It rejects subset flags. See the [yt-dlp selection options](https://github.com/yt-dlp/yt-dlp#video-selection).

Show its counts, then proceed. There is no triage agent, approval step, or subset question. Duplicate occurrences keep their playlist positions but fetch and extract their identical video ID once. Different IDs stay in scope even if they look like reuploads. Unavailable entries without an ID remain recorded as coverage gaps; every entry with an ID gets a fetch attempt.

Give a rough processing estimate from the full scope, about 30k tokens per ordinary video and 3k per recognized Short. Playlist listings do not reliably identify Shorts, so describe unknown types conservatively as ordinary videos. This estimate is informational, never a reason to prune the scope. Respect an explicit resource budget by checkpointing and reporting remaining work when needed, keeping the whole scope intact.

If the user passed `--dry-run`, stop here after printing the counts, estimate, and resolved workflow call. No transcript fetching or LLM processing occurs. Normal invocation proceeds automatically.

## 3. Fetch, extract, and render

Set `mode` to `fold-in` if `taxonomy.json` exists, otherwise `build`. Use the playlist title as the workflow's `channel` argument, a compatibility field for the collection label, not an assertion that the curator created every video.

```text
Workflow({
  scriptPath: "<absolute WORKFLOW>",
  args: {
    slug: "<SLUG>", channel: "<playlist title>",
    kbDir: "<absolute KB>", skillDir: "<absolute OUT>",
    scriptsDir: "<absolute SCRIPTS>", today: "<YYYY-MM-DD>",
    mode: "build", node: "<absolute NODE>"
  }
})
```

Check the first log line names the intended slug and mode. Follow the host's completion notification mechanism. For hosts without Workflow, follow the same phase prompts and barriers from the bundled file.

The pipeline does the following:

1. Fetch every scoped video sequentially through `pts_fetch.js`. Store timestamped Markdown transcripts and per-video statuses in `raw/`. Save progress after each video. On a rate limit or bot check, stop and report pending work; resume later with a higher delay. Never turn partial fetching into a completed skill.
2. Read each available transcript fully, once, into `extractions/<id>.json`. Extract the payoff, concepts, exact terms, procedures, decision rules, timestamped quotes, and creator attribution. Drop sponsor passages and intros during extraction, not entire videos. A transcript with nothing transferable still gets an extraction with empty arrays and `no_concepts_reason`.
3. Canonicalize every extraction into `taxonomy.json`. Merge synonyms and repeated teachings, preserve distinctive ideas even from one video or Short, and retain creator disagreements. A newer source only supersedes an older one when it updates the same creator's position.
4. Render `concepts/<id>.md` from extractions. Write `glossary.md`, `patterns.md`, `cheatsheet.md`, `sources.md`, and `SKILL.md`. Keep the entry point under about 4k tokens, with concept and topic indexes pointing to supporting pages. Sources must account for every playlist position, including unavailable entries and videos without concepts.
5. Validate links, entry-point size, timestamps, taxonomy parity, and coverage, then write `manifest.json`.

A large missing-caption fraction is a reported limitation, not a reason to drop remaining entries or abort their processing. Continue through every fetchable ID and process every readable transcript. If none are readable, report that and stop without inventing a skill. Retry recorded failures with `pts_fetch.js --kb-dir "$KB" --retry-failed`; leave successful transcripts and extractions cached.

## 4. Verify and report

```bash
"$NODE" "$SCRIPTS/pts_validate.js" --skill-dir "$OUT" --kb-dir "$KB" --write-manifest
```

Require zero errors. Resolve failed extraction or rendering phases before reporting completion. Read the cheatsheet and representative concept pages: they must express usable decisions, with source attribution and timestamps, rather than video recaps. Review `sources.md` against `scope.json.entries`; every playlist position must be accounted for. Check that agents wrote only inside KB and OUT.

Report playlist entries, unique current IDs, retained previous sources, fetched transcripts, unavailable/no-caption/failed entries, empty extractions, pending work, concept count, entry-point size, and measured token spend if the host provides it. Distinguish completed processing from unavailable source material. Give the generated skill path and how to invoke it. Commit generated files only when the user's repository workflow authorizes commits; never publish automatically.

## Fold-in

Re-running on the same playlist enumerates its current full membership and adds every new ID automatically. Preserve removed entries as previous sources in the scope and source index. Reuse successful transcripts and extractions, keep existing concept IDs stable, and regenerate the taxonomy, pages, and support files. Date or title changes never trigger a new subset decision.

## Manual additions

When the user wants specific videos folded into an existing skill without editing the YouTube playlist (for example, the playlist belongs to someone else), add them to the scope directly:

```bash
"$NODE" "$SCRIPTS/pts_add.js" --kb-dir "$KB" <url-or-id> [<url-or-id> ...]
"$NODE" "$SCRIPTS/pts_add.js" --kb-dir "$KB" --file <path>   # one URL or ID per line
```

Each video is appended to `scope.json` with `source: "manual"`, `current: true`, and no playlist position; videos already in scope are skipped. Then run the workflow in `fold-in` mode as above. Manual videos survive later re-enumerations of the playlist, and `sources.md` lists them in a "Manual additions" table after the playlist table. Only add videos the user named or approved; the playlist itself is never pruned.
