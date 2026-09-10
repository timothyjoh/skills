## What it does

`channel-to-skill` turns a YouTube channel into an agent skill: a `SKILL.md` an agent loads while working, a page per concept, a glossary, a catalog of patterns, and a cheatsheet of the creator's decision rules. It is the channel equivalent of [book-to-skill](https://github.com/virgiliojr94/book-to-skill), with one difference that drives everything else: a book has already been edited and a channel has not. So the skill triages first, asks you which videos are worth the tokens, and then organizes by concept rather than by video, because a channel teaches the same idea thirty times under thirty titles.

## When to reach for it

You invoke this by typing `/channel-to-skill @Handle`, and the agent won't reach for it on its own.

Reach for it when you keep going back to a creator's videos to remember how they'd handle something, and you want an agent to be able to answer that instead. For a searchable, citable knowledge base rather than a working skill, build an [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog) bundle instead; the skill's working data (`kb/<slug>/`) is already most of one.

## Prerequisites

`yt-dlp` on `PATH` and Node 18 or newer. No YouTube API key. Roughly 3M tokens and 15 to 20 minutes for a 100-video scope; transcripts are free.

The generated skill lands in the same skills root the `channel-to-skill` skill lives in (`.claude/skills/<slug>/` for a project install). Working data (catalog, scope, raw transcripts, extractions, taxonomy) lands beside it under `kb/<slug>/` and is meant to be committed: it is the provenance behind every rule, and a later fold-in of new videos needs it.

## Scope before spend

Listing a channel costs nothing, so the skill lists all of it first: counts, runtime, per-year distribution, chapter markers. One agent proposes three cuts (recent, core, broad), flags obvious re-uploads, and you pick. That one question is the only human decision in the run. Everything after it runs as a background workflow you can watch with `/workflows`.

## Read once, mine by concept

Each transcript is read exactly once, into a JSON extraction: the thesis (the payoff, not the hook the title promised), the concepts taught with timestamped quotes, decision rules, terms, and notes on how the creator talks. One agent then merges every extraction into a frozen taxonomy, which is what stops `agentic-rag`, `agent-rag` and `rag-agents` from all existing. Concept pages, the glossary, patterns and the cheatsheet are rendered from that taxonomy, never from the transcripts again.

The cheatsheet is the file worth opening first. It is the creator's judgment, not their vocabulary: "when X, do Y, because Z", thresholds they commit to, tells that mean trouble.

## Fold-in

Channels keep publishing. Running the skill again on the same channel lists what is new, asks a smaller question, and merges: concept ids never change, so links in the skill stay valid, and only pages whose sources changed are rewritten.

## Common questions

**Why not one page per video?**
Because that is a folder of summaries, and an agent cannot decide with it. A concept page synthesizes every video that teaches the idea, newest first, and marks the older takes.

**Does it strip sponsor reads?**
By instruction at extraction, yes. Transcripts are not pre-trimmed.

**What if most videos have no captions?**
The fetch step reports `no-captions` per video. If that is more than a third of the scope, the run stops and says so; a channel without captions is not worth a skill.

## It's working if

- The run asks you exactly one question, and it is about which videos.
- `SKILL.md` of the generated skill is under about 4k tokens, and its topic index sends you to the right concept file on the first try.
- `cheatsheet.md` reads as decisions ("Use X when Y") rather than as recaps of videos.
- Every concept page ends with a `## Sources` section whose quotes carry `[h:mm:ss]` timestamps you can jump to.
- Re-running on the same channel a month later fetches only the new videos.
