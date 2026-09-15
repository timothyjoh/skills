# Template: Bug

The fullest template. Story and task drop sections from it.

## Skeleton

````markdown
## Summary

[3 lines. What is broken, where, and the one-line why. Name the tenant or environment if there is one.]

**Fix**

- [One bullet per change. Imperative. Names file and function.]

## Root Cause

[150 words or less plus one visual. The call chain, every affected entry point, and the sibling path that gets it right. Do not reopen with the Summary's claim. Prove it.]

```text
[call tree or sequence, under 20 lines, marked where the defect sits]
```

## Contract

[Only when the fix changes a shape another system reads. A typed block, not prose. Say what an absent optional field means. Delete this section if no contract moves.]

```ts
[the actual fields]
```

## Suggested Fix from Claude

[120 words or less. Why this shape over the obvious alternative. Name any wiring the fix needs that does not exist yet.]

**Alternatives**

| Option | Trade-off |
|---|---|
| [recommended, marked] | [...] |
| [...] | [...] |

**Worth noting, out of scope**

- [Findings that need their own card.]

---

## Steps to Replicate

`(derived from code, needs validation)` ← delete when actually reproduced

1. [Environment, tenant, starting state.]
2. [The action.]

**Expected:** [...]
**Actual:** [...]

## Steps to Test

1. [Written against the fix. Include how to observe the suppressed behaviour: a log line, an absent call, an empty queue.]

## Acceptance Criteria

- Given [...], when [...], then [...]
- [No-regression case for the path the fix must not touch]
- [Data-safety case, where the fix touches existing data]

## Reference

Code as of `<repo>` `<branch>` @ `<commit>` (`<date>`).
Related: [cards, docs pages]
````

## Section notes

**Summary.** The developer decides here whether to pick the card up. A finding that needs a paragraph goes in Root Cause. Good: "`TenantSettings.CanExport` has no consumer in the repo. Only `CanSearch` is read. So disabling a tenant stops search and nothing else."

**Fix bullets.** "Gate `ExportJob.Run()` on `TenantSettings.CanExport`", not "add gating to export".

**Root Cause.** The contrast case is the strongest evidence. A sibling path that already does it right proves the fix shape.

**Suggested Fix from Claude.** Usually "gate at the single choke point, not at the ten callers". Flag a dependency not yet injected or a setting not yet plumbed. That is what turns a one-line fix into a half-day.

**Steps to Test.** "Nothing happened" is indistinguishable from "the test did not run". Say what the tester looks at.

**Acceptance Criteria.** A gate that turns everything off passes a naive set of criteria. Always carry the no-regression line.
