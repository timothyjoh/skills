---
"timothyjoh-skills": minor
---

Rename `delegate-t3-agent` to `t3-handoff` and add `t3-report`.

- t3-handoff works with T3 Code orchestration protocol 2 (0.0.46 and later) as well as protocol 1 (0.0.45 and earlier). It reads the protocol from the running server and uses the matching adapter.
- Delegated sessions are named `👋 <task name>`. `--title` is required, and `rename` changes it later. Old sessions were named after the request key.
- New `t3-report` skill for the delegated agent: short progress reports at agreed points, following the coordinator's `--brief`. Reports go as a `cat <<'T3_REPORT'` command, so they arrive from Claude and Codex children alike.
- The coordinator follows progress with `watch --follow` (one line per report), with `wait` (returns on each new report), or, for a T3 parent, with posts into the parent conversation for each report.
- `--effort` uses the option name each model advertises (`effort` for Claude, `reasoningEffort` for Codex). Before, Claude children got the Codex name.
