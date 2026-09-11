## What it does

`playlist-to-skill` turns a complete YouTube playlist into an agent skill with concept pages, a glossary, procedures, and a cheatsheet of decision rules. The playlist defines the scope. Every video gets a fetch attempt, and every available transcript gets processed without a selection question.

It preserves the concept-based approach of [channel-to-skill](./channel-to-skill.md). Repeated teachings merge into shared concepts, and timestamped sources show where each rule came from. Advice from different creators stays attributed, including disagreements.

## When to reach for it

Invoke it by typing `/playlist-to-skill "https://www.youtube.com/playlist?list=..."`, or use `$playlist-to-skill` in Codex. A watch URL with `list=...` also works, even if it points into the middle of the playlist. This is a user-invoked skill.

Use it for a course, saved collection, or curated series you want an agent to apply. For choosing a subset from a creator's entire channel, use [channel-to-skill](./channel-to-skill.md).

## Prerequisites

Node 18 or newer and `yt-dlp` on PATH. No YouTube API key. A Workflow-capable host runs the bundled workflow; other hosts follow its phases with their available tools.

## Whole playlist, automatic scope

The skill enumerates all entries, then downloads captions and metadata sequentially. It does not download the video media. Repeated occurrences of the same video share one transcript, but retain every playlist position. Distinct video IDs stay included even when their titles look repetitive.

Add `--dry-run` to see the full scope and processing estimate without fetching transcripts or generating content. Normal invocation goes straight through. An explicit resource budget may require a checkpoint, but never changes which videos belong in scope.

## What the skill is called

After enumeration the run names the skill for what the playlist is centered on. A playlist that is one person's teaching becomes `expert-<person>` (`expert-dan-mohler`). A playlist centered on a subject, across several creators or as a course or collection, becomes `topic-kb-<topic>` (`topic-kb-rust-async`). The enumerator prints the creators and their video counts, which is the main signal, and the run tells you the name and its reason in one line rather than asking. Reruns find the playlist by its ID, so a skill keeps its name whatever it was built under.

## The generated skill

The output contains `SKILL.md`, `concepts/`, `glossary.md`, `patterns.md`, `cheatsheet.md`, `sources.md`, and `manifest.json`. Raw transcripts and extractions stay beside the skill as working data for provenance and later updates.

Each transcript is read once into an extraction. Later stages merge concepts and write decision-oriented pages from those extractions. A video that teaches nothing transferable still has a recorded extraction; the skill does not invent lessons to fill a template.

## Common questions

**Will it ask me which videos to include?**
No. The full playlist is the scope, including Shorts, old uploads, and low-view videos.

**What happens to private, deleted, or captionless videos?**
They remain visible in the coverage report. The skill processes the available transcripts and reports the gaps. A rate limit pauses the run with pending work intact. If no readable transcripts exist, it reports that instead of generating unsupported advice.

**What happens when the playlist changes?**
A rerun includes every new ID automatically and reuses earlier work. Removed videos remain marked as previous sources. Concept IDs stay stable.

**Can I choose a different name?**
Yes. Say so when the run announces the name, before the workflow starts. The name must be lowercase kebab-case, and the `expert-` or `topic-kb-` prefix is the convention, not a technical requirement.

**Can I add a video that is not in the playlist?**
Yes. When the playlist belongs to someone else, or a related video lives outside it, ask for those videos to be added and give their URLs or IDs. They join the scope as manual additions, get processed in a fold-in run, and stay in the skill across later reruns. The playlist itself is never pruned.

## It's working if

- A watch URL with a playlist parameter processes the entire playlist, regardless of its starting index.
- The run never proposes cuts or asks you to select videos.
- Every playlist entry has an outcome in the source index, including duplicates and unavailable entries.
- The cheatsheet tells an agent when to do something and why, with links to the underlying concepts.
- Reruns reuse completed work and add new videos without renaming existing concepts.
