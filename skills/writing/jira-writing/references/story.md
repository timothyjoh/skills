# Template: Story

Carries only what differs from `bug.md`. A story has no defect to prove, so Root Cause and Steps to Replicate drop out. The behaviour pair replaces them, and rule 8 matters most here. A story's Desired Behaviour is where scope is agreed and its acceptance criteria are where scope is enforced.

## Skeleton

````markdown
## Summary

[3 lines. What capability this adds, for whom, and why now.]

**Approach**

- [One bullet per change. Imperative. Names file and function where known.]

## Current Behaviour

[What happens today, for someone who has never seen the feature. 80 words or less.]

## Desired Behaviour

[A checkable list, not prose. One behaviour per bullet, each testable. Every bullet resolves to an acceptance criteria line or an Out of scope line.]

- [...]

```text
[optional: the one visual, under 20 lines, showing the changed flow]
```

## Contract

[Only when the story changes a shape another system reads. Typed block. Say what absence means. Delete if no contract moves.]

```ts
[the actual fields]
```

## Suggested Approach from Claude

[120 words or less.]

**Alternatives**

| Option | Trade-off |
|---|---|
| [recommended, marked] | [...] |

## Out of scope

- [Explicitly not in this card, and where it goes instead.]

---

## Steps to Test

1. [Doubles as the demo script. A product manager can follow it at review without a developer narrating.]

## Acceptance Criteria

- Given [...], when [...], then [...]
- [No-regression case]
- [Data-safety case, where existing data is touched]

## Reference

Code as of `<repo>` `<branch>` @ `<commit>` (`<date>`).
Related: [cards, docs pages]
````

## What changes from the bug template

- Dropped: Root Cause, Steps to Replicate.
- Added: Current Behaviour, Desired Behaviour, Out of scope as a first-class section.
- Renamed: "Suggested Fix from Claude" becomes "Suggested Approach from Claude".

Out of scope is mandatory on a story. An empty one means the boundary was never discussed.

A story that adds a field to a payload and describes it only in Desired Behaviour is not ready to pick up. Where two cards build the two ends, both carry the identical Contract block and each names the other.
