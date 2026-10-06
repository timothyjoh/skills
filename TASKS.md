# t3-handoff rewrite

Decisions (2026-10-05): support V1 and V2 adapters; child title `👋 <task name>`; T3 parent gets each progress report; live test against 0.0.46-nightly in an isolated T3 home.

- [x] Read current delegate-t3-agent skill and scripts
- [x] Confirm 0.0.45 is V1 and 0.0.46 (nightly) is V2
- [x] Map V2 WebSocket protocol, title generation, DB schema (subagent; verify evidence)
- [x] Start isolated 0.0.46-nightly server (scratch T3CODE_HOME, separate port)
- [x] Rename skill folder to t3-handoff (git mv), update name, openai.yaml, title text
- [x] Split client into V1 and V2 adapters behind one interface; detect protocol
- [x] Session naming: `👋 <task name>`, required `--title`, lock against auto-title
- [x] New child skill (t3-report): cadence, format, marker block, fallback text
- [x] Parent side: `progress` extraction, `watch` emitting progress lines, T3-parent relay of each report
- [x] Handoff prompt: drop inline reporting rules, point at t3-report with coordinator's reporting brief (`--report-brief`)
- [x] Reports delivered as `cat <<'T3_REPORT'` command (text-only reports were lost to thinking blocks on Sonnet 5.5 low); V2 live: 3/3 reports streamed
- [x] Offline tests for V2 adapter, naming, progress parsing, relay
- [x] Live test against nightly: start, progress, wait, reply, T3-parent relay
- [x] Live check against 0.0.45 (V1) in an isolated home (not the real ~/.t3)
- [x] README (top + bucket), plugin.json, docs/development pages (both skills), changeset
- [x] Remove old symlinks, run scripts/link-skills.sh
- [x] `claude plugin validate . --strict` (fails only on pre-existing root CLAUDE.md warning, same on clean HEAD), em-dash check, skill-quality pass
- [x] Isolated V1 0.0.45 server on 3798 (running) for V1 regression
- [x] Stop isolated servers, clean scratch
