# Template: Task

Chores, spikes, migrations, infrastructure. No user-facing behaviour, usually no QA pass. Lighter, but the rules do not relax: path and symbol, no repetition, pinned commit.

## Skeleton

````markdown
## Summary

[3 lines. What needs doing and why now.]

**Work**

- [One bullet per change. Imperative. Names file and function where known.]

## Context

[Why this is worth doing and the cost of not doing it. 100 words or less. If it runs long, the card is a story.]

```text
[optional: the one visual, under 20 lines]
```

## Contract

[Migrations and API chores change shapes more often than they look like they do. Typed block. Delete if no contract moves.]

```ts
[the actual fields]
```

## Suggested Approach from Claude

[120 words or less. Skip the Alternatives table when there is one obvious path.]

**Alternatives**

| Option | Trade-off |
|---|---|
| [...] | [...] |

## Done when

- [Checkable outcomes. For a spike, the artefact produced and where it lands.]
- [The Contract binding line, if a contract moves.]

## Risk

[What could break and how it is reverted. Delete if genuinely none. Never delete on a migration.]

## Reference

Code as of `<repo>` `<branch>` @ `<commit>` (`<date>`).
Related: [cards, docs pages]
````

## What changes from the bug template

- Dropped: Root Cause, Steps to Replicate, Steps to Test, Acceptance Criteria.
- Added: Context, Done when, Risk.
- Renamed: "Suggested Fix from Claude" becomes "Suggested Approach from Claude".

"Done when" replaces acceptance criteria. Same discipline, checkable not aspirational, phrased as outcomes.

A task that needs Steps to Test is a story or a bug. Use the right template.

Spikes: "Done when" names the artefact and its destination, a docs page, a decision record, a follow-up card. A spike whose only output is "we understand it now" gets re-run in six months.

Migrations: fill in Risk with the rollback. This is the type where Risk is least optional.
