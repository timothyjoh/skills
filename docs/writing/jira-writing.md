## What it does

`jira-writing` drafts or rewrites the body of a Jira card for a bug, a story or a task. The defining constraint is a per-section word budget: the developer half fits on one screen, carries one visual, and names code by path and symbol instead of line number. The QA half is numbered steps and given/when/then criteria that a tester can run without the author in the room.

## When to reach for it

The agent reaches for it when asked to write a ticket, rewrite a card, or turn a finding, investigation or plan into a Jira issue. Type `/jira-writing` to force it.

For a pull request body, use a PR description skill instead. For prose that is not a card, use [asd-ste100](./asd-ste100.md) directly.

## Prerequisites

The skill calls two siblings: [show-me](./show-me.md) for the one visual and [asd-ste100](./asd-ste100.md) for the sentence pass. Publishing goes through the Atlassian MCP tools; without them the skill still produces a body you can paste.

## Two readers, one card

Developer sections come first: Summary with fix bullets, then the evidence (Root Cause, Current and Desired Behaviour, or Context), an optional Contract block, and a fix section headed "Suggested Fix from Claude" with an alternatives table. A horizontal rule, then the QA sections: Steps to Replicate, Steps to Test, Acceptance Criteria. The card closes by pinning repo, branch, commit and date.

## The cross-check

Before publishing, the skill walks Desired Behaviour against Acceptance Criteria so nothing appears in one and vanishes from the other, checks every Contract block has a criteria line that tests it, and tags any reproduction steps nobody ran with `(derived from code, needs validation)`.

## It's working if

- The developer half fits on one screen and has exactly one text or diff visual.
- No line numbers appear anywhere in the card.
- Every Desired Behaviour bullet has a matching acceptance criteria line or an Out of scope line.
- The card ends with a pinned commit and date.
