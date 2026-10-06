## What it does

Explains one PR or commit range as a staff-engineer brief: what changed and why, the requirements in the author's words, one design diagram, the implementation walked from its entry point, and the changed files grouped by purpose. The brief renders as a local HTML page, or as a GitHub PR comment.

The brief and group summaries use the [ASD-STE100 skill](../../skills/writing/asd-ste100/SKILL.md) in STE-flavored mode. This mode applies plain-language rules to explanatory prose. It preserves quoted requirements, code identifiers, links and uncertainty.

The defining constraint: the brief pins two commits, and a checker verifies every code link, code peek and call-stack frame against them. A link cannot point past the end of a file, a frame marked as new must land on lines the diff added, and every changed file must sit in exactly one group. The author checks that the explanation matches those references. Valid code links do not prove runtime behavior.

The grouping and pseudocode prompts are adapted from [devdotfast/whiteboard](https://github.com/devdotfast/whiteboard) (MIT).

## When to reach for it

The agent reaches for it when you ask to explain, walk through or brief a PR, branch or commit range, or to make a change easier to review. You can also type `/explain-pr` in Claude Code or `$explain-pr` in Codex. Ask for the brief to be posted to the PR when you want it as a comment.

For a merge-blocking review of the same change, use a code review skill instead. For a quick picture of one idea, use `show-me`.

## Prerequisites

- The `asd-ste100` skill, included in this plugin.
- Node 24 or newer, and `git`.
- `gh`, authenticated, to pin a PR and to post the comment.
- Optional: `diffr` (`brew install devdotfast/tap/diffr`) to run the per-group review command.
- Network access when you open the HTML page: it loads marked, mermaid and highlight.js from jsDelivr.

## The brief directory

Each brief lives in its own directory under `$EXPLAIN_PR_DIR`, or `~/reviews` when that variable is not set: `<repo>/pr-<n>` for a PR, `<repo>/<head sha>` otherwise. It holds the pins (`meta.json`, `changes.json`), the grouping and pseudocode that two subagents write in parallel, the brief itself (`doc.md`), and the rendered `index.html` or `comment.md`. Rerun the check or the render at any time; both read only this directory and the pinned commits.

In a GitHub comment, Mermaid renders natively, each peek becomes a permalink that GitHub expands into a code snippet, and each call stack becomes a coloured `diff` block. The comment inherits the repository's access, so it is safe on private repositories.

## Check, repair, render

Progress tracks the pinned change, authored brief, validation, and rendered output. Repairs are followed by another structural check and a review of the affected claims. The agent inspects the HTML for broken diagrams and group cards when a browser is available, and states when that inspection is pending.

## Verification and rollout

Each brief includes a compact account of the evidence and its limits. When available, it shows the same input or action before and after the change and links to the observed results. Reported checks identify the procedure, outcome, source, tested commit, and environment where known. Evidence from another commit or environment stays labeled; code inspection remains an inference. Relevant checks that were not executed say **Not run**; absent results say **No evidence supplied**.

The section also names affected users or systems and explains what a code revert or flag change restores, including persistent effects that need separate cleanup. A small or docs-only change gets a short account. The agent uses existing evidence first and reports gaps within the review's scope. Writing the brief does not require a new test run or authorize rollout or rollback actions.

## It's working if

- The brief and group summaries use short, direct sentences without changing facts or uncertainty.
- The check prints `ok` before the brief is rendered.
- Every sentence about code carries a link, and each link opens the code it describes at the pinned commit.
- Behavior claims cite observed evidence or clearly state that they are inferred or unverified; a passing link check is not presented as a passing runtime test.
- You can see who is affected, what rollback restores, and which persistent effects or unknowns remain.
- Every changed file appears in exactly one group card, each with its own `diffr` command.
- The design diagram and call stacks render in both the HTML page and the PR comment.
