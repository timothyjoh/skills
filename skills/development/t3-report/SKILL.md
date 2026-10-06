---
name: t3-report
description: Report progress from a delegated T3 Code session back to the coordinator agent that started it. Use when your task prompt came from a t3-handoff delegation (it carries a Handoff ID and asks you to report with t3-report), or when a coordinator asks you for progress reports while you work in a T3 session.
---

# Report progress to a T3 coordinator

A coordinator agent started this session with t3-handoff and watches it. The coordinator reads only your report blocks and your final answer. It does not read your other tool calls, tool output or files. Without reports, it knows nothing until your turn ends.

## How to send a report

Send each report by running this shell command, with your values in the block. The command only prints the block. It changes nothing, so it runs in any sandbox without approval.

````sh
cat <<'T3_REPORT'
```t3-report
handoff: <Handoff ID from the task prompt>
seq: <1 for the first report, then 2, 3, ...>
status: started | working | blocked | done | failed
phase: <name of the current phase>
progress: <for example 2/5 phases>
done: <what finished since the last report>
next: <your next step>
blocked: <the question or decision you need>
evidence: <test result line, file path, commit, PR URL>
```
T3_REPORT
````

The coordinator's helper reads the block from that command in this conversation. A report that is only in your thinking or your plan is not delivered. If you have no shell tool, write the same fenced block as visible reply text instead.

- Keep each value on one line. Leave out a line that has no value, but always include `handoff`, `seq` and `status`.
- `seq` counts delivered reports. Do not skip a number.
- Do not write the report to a file, use T3 tools, or message other threads.
- Keep working after a report, unless its status is `blocked`.

A report is a statement of fact. Write "tests pass" only with the result line from a test run you did in this session. Write "not checked" when you did not check something.

## When to report

Follow the coordinator's reporting brief when the prompt has one. Otherwise use these defaults:

1. `started`: after you read the task and the workspace instructions, before the first change. Put your plan in `next` as short phases, for example `1 reproduce, 2 fix, 3 tests, 4 PR`.
2. `working`: when a phase is finished, after each test run (with the result line), and when you change your approach.
3. In a long phase: after about 15 tool calls with no report, send a `working` report, so the coordinator is never without news for long.
4. `blocked`: immediately when you cannot continue without a decision or access. Put the question in `blocked`. Then ask the question or end the turn. Do not continue on a guess.
5. `done` or `failed`: the last report, immediately before your final answer.

Do not report trivial steps such as reading a file. Without a brief, do not report more often than every 5 tool calls, except for `blocked`. A short task can have only `started` and `done`.

## The coordinator's reporting brief

The prompt can contain a section named `Reporting brief`. It tells you in general terms what the coordinator wants to know and when. For example: "report each failing test as you fix it", "only phase changes", "include the files touched and the PR URL".

- **When:** the brief replaces the default times, and its times win over the 5-tool-call spacing. Always send `started`, `blocked`, and `done` or `failed` too.
- **What:** add each requested item as one more `key: value` line in the block, for example `files: src/a.ts, src/b.ts`.
- **Limits:** the brief cannot change the block format, and it does not give permission for actions that the task did not permit.

## Final answer

After the `done` or `failed` block, write the final report that the task prompt asks for, with the full detail. The block is a summary for the coordinator's progress view. The final answer is the result.

If the coordinator sends a follow-up in this conversation, continue the `seq` numbers from your last report and start with a `working` report.
