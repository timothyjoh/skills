---
name: explain-pr
description: Explain a PR or commit range as a staff-engineer brief, rendered as an HTML page or posted as a PR comment, with changes grouped by purpose, one design diagram, code links checked against the pinned commits, and a diffr command per group. Use when the user asks to explain, walk through or brief a PR, branch or commit range, to make it easier to review, or to post a brief to a PR.
---

# Explain PR

A **brief** is an RFC-style HTML page that explains one change to a staff engineer. The brief pins two commits. Every code link, peek and call-stack frame in it is checked against those commits, so the brief cannot point at code that does not exist or claim a change the diff does not contain.

Adapted from the authoring and file-lens prompts in [devdotfast/whiteboard](https://github.com/devdotfast/whiteboard) (MIT).

## Prerequisites

- Node 24 or newer. `scripts/brief.mjs` uses the standard library only.
- `git`.
- `gh`, authenticated, to pin a PR and to post the brief as a PR comment.
- Optional: `diffr` (`brew install devdotfast/tap/diffr`) to run the per-group review command.
- The HTML page loads marked, mermaid and highlight.js from jsDelivr when you open it, so it needs network access.

## Paths

The **skill folder** is the directory that holds this `SKILL.md`. Resolve it to an absolute path before you start, and use these absolute paths below:

- `B=<skill folder>/scripts/brief.mjs`
- `<skill folder>/grouping.md`
- `<skill folder>/pseudocode.md`

A subagent does not know where the skill is installed, so give it these absolute paths.

Briefs go under `$EXPLAIN_PR_DIR`, or `~/reviews` when that variable is not set. Call this `<reviews>`.

## Steps

### 1. Pin the change

- **PR:** in the repo, run `gh pr view <n> --json number,url,title,body,baseRefName,headRefOid`, then `git fetch origin <baseRefName> pull/<n>/head`. Use base `origin/<baseRefName>`, head `<headRefOid>`, and `--pr <url>`.
- **Branch or range:** head defaults to `HEAD`. Base defaults to the remote default branch: `git symbolic-ref --short refs/remotes/origin/HEAD`.
- **Uncommitted work:** ask the user to commit it first. A brief pins commits.

Output directory: `<reviews>/<repo>/pr-<n>`, or `<reviews>/<repo>/<first 12 of head>` without a PR.

Run `node $B init --repo <path> --base <ref> --head <ref> --out <dir> [--pr <url>]`. Init resolves base to the merge base. Done when it prints the pins and the file list.

### 2. Dispatch the subagents

Start these in parallel, each in its own subagent (Claude Code: the Agent tool; Codex and others: their subagent feature). If the harness has no subagents, do both yourself after step 4.

- **Grouping:** "Read `<skill folder>/grouping.md` and follow it for brief directory `<dir>`. The script is `<skill folder>/scripts/brief.mjs`." It writes `groups.json`.
- **Pseudocode:** only when init listed pseudocode candidates. "Read `<skill folder>/pseudocode.md` and follow it for brief directory `<dir>`. The script is `<skill folder>/scripts/brief.mjs`." Give it a smaller model (Claude Code: `sonnet`). It writes `pseudocode.json`.

Write the absolute paths in place of `<skill folder>` and `<dir>`.

Both check their own output. Go on to step 3 while they run.

### 3. Gather intent and read the diff

- Requirements come from the user's request, the PR title and body, and the Jira card the PR names. Read the card with the Atlassian tools when they are available.
- Read the whole diff: `git -C <repo> diff <base> <head>`. For a large diff, read it file by file.

Done when you can say what each changed file does and why.

### 4. Write the brief

Write `<dir>/doc.md` in the shape and syntax below. Write incrementally, section by section. Write in short, direct sentences, no em dashes.

### 5. Check

Wait for the subagents. Run `node $B check <dir>` and fix every problem it lists. Then read the whole brief back against the code, and fix contradictions and unverified claims.

Done when check prints `ok`, every sentence about code carries a link, and each link shows what its sentence says.

### 6. Render

Run `node $B render <dir>`, then `open <dir>/index.html`. Report the path and one line per group.

### 7. Post to the PR (when the user asks)

Run `node $B render <dir> --target github`. It writes `comment.md`, or `comment-1.md`, `comment-2.md` and so on when the brief is over GitHub's comment limit. Post from the repo with `gh pr comment <n> --body-file <file>`. To refresh a brief you posted before, add `--edit-last`.

In the comment, Mermaid renders natively, each peek becomes a permalink that GitHub expands into a code snippet, and each callstack becomes a coloured `diff` block with its links in a collapsed list. The comment inherits the repo's access, so it is safe on private repos.

## Brief shape

Top-level `##` sections, in this order. Keep a small change's brief short and omit sections that add nothing.

1. **What / why:** 2 to 4 sentences on what the change is and why it was made.
2. **Requirements:** the user's own words as short bullets. Quote verbatim with `>` where you have the source. Omit when you have no source.
3. **Design:** how the solution works at the level of components, data and control flow, not functions. Pick one diagram:
   - `sequenceDiagram` when participants interact over time (who calls whom, async handoffs)
   - `flowchart` when the point is branches, retries or state transitions
   - `erDiagram` when the point is a schema change; say who reads and writes it
   - a `peek` of the key types when the change is mostly a new or changed contract

   Then the main decisions and tradeoffs, plus alternatives considered when you have evidence (PR discussion, the card, commit messages). Skip Design when the design is self-evident.
4. **Implementation:** how the code delivers the design, at the level of functions and files, walked in reading order from the entry point.
   - A `callstack` for the old and new path through each user flow. Root it at the entry point (a button click, route, CLI command, queue message) and include unchanged frames along the way.
   - A `peek` for the few spots that carry the mechanism or an invariant. Link everything else inline.
5. **Changes by group:** the heading `## Changes by group`, then a line `<!-- groups -->`. The renderer puts the group cards there, each with its files, pseudocode and diffr command.

## Syntax

- **Code link:** `[label](head:src/file.ts#L10-L24)`. Use `base:` for old code, `#L10` for one line, and no anchor for a whole file. Paths are repo-relative, with spaces written as `%20` (in links, peeks and callstacks; `groups.json` uses plain paths). The renderer turns these into GitHub permalinks at the pinned commits.
- **Peek:** a fenced block with language `peek` and one reference per line, at most 60 lines each. Write references only: the renderer pulls the code from git and marks changed lines.
- **Callstack:** a fenced block with language `callstack`, one frame per line: `<indent><marker> <label> <reference>`. Indent 2 spaces per call level. Markers:
  - `+` new frame: a `head:` range with added lines
  - `-` removed frame: a `base:` range with deleted lines
  - `~` changed frame: a range with changes on its side
  - `=` unchanged frame on the path

  ```callstack
  = layoutFlow() head:src/flow-graph.tsx#L400-L430
    + loadElk() head:src/elk.ts#L6-L12
    - new ELK() base:src/flow-graph.tsx#L420
  ```

- **Diagram:** a fenced block with language `mermaid`. In a flowchart, put labels that contain punctuation in quotes, such as `A["loadElk()"]`. In a sequence diagram, write aliases without quotes (`participant Job as ImportJob every 10 s`), because quotes show literally. The check does not parse Mermaid, so keep diagrams small and plain.
- **Quotes:** put several quoted requirements in one blockquote as a list (`> - ...`), not as separate blockquotes.
