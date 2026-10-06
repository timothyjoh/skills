## What it does

Tells an agent that was started by [t3-handoff](./t3-handoff.md) how to report its progress to the coordinator that started it. The agent writes short, fixed-format `t3-report` blocks in its own T3 conversation at agreed points: when it starts, when a phase ends, after test runs, when it is blocked, and when it finishes.

The defining constraint: the report is a block in the conversation, not a file or a T3 tool call. That is why it works across projects, with any provider, and inside Codex's sandbox. The coordinator's helper reads the blocks. You can read them in the child's T3 conversation too.

## When to reach for it

The child agent reaches for it. The coordinator never runs it. A t3-handoff prompt names the skill and gives a Handoff ID. The prompt can also carry a **reporting brief**: the coordinator's general instructions on what it wants to know and when, for example "report each test fix" or "include the PR URL". The brief changes the timing and adds fields. It cannot change the format or add permissions.

Use t3-handoff on the coordinator side. Use this skill only in the delegated session.

## A report

```t3-report
handoff: 6f1c...
seq: 3
status: working
phase: fix
progress: 2/4 phases
done: rounding fixed in src/dates.ts
next: run the date test suite
evidence: reproduced with tests/dates.test.ts:41 before the fix
```

`status` is one of `started`, `working`, `blocked`, `done` or `failed`. A `blocked` report stops the child until it gets an answer. The other statuses let it keep working.

## Common questions

**Why not let the child message the parent's T3 thread?** T3's built-in agent tools reach only threads in the caller's own project. Handoffs often cross projects.

**What if the child does not have the skill installed?** The handoff prompt gives the absolute path to this skill's `SKILL.md`, so the child can read it directly.

## It's working if

- The child's T3 conversation shows a `started` block before the first change, and a `done` or `failed` block before its final answer.
- The coordinator's progress view lists the same reports, in order, with no gaps in `seq`.
- Test claims in reports quote a result line.
- A `blocked` report comes with a question, and the child stops until it gets an answer.
