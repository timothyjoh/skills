# Returns and operations

## Compatibility and setup

The helper reads `/.well-known/t3/environment` from the running server (no credential needed) and uses the adapter for its `orchestrationProtocolVersion`:

| Protocol | T3 Code | Database | Session API |
|---|---|---|---|
| 1 | 0.0.45 and earlier | `userdata/state.sqlite` | `thread.create` plus `thread.turn.start`; turns, activities and pending flags |
| 2 | 0.0.46 and later | `userdata/statev2.sqlite` | `orchestration.launchThread`; runs, runtime requests and plans. The WebSocket URL carries `orchestrationProtocol=2`, or the server refuses it with HTTP 426. |

Both adapters were tested live, against 0.0.45 and 0.0.46-nightly.20261005.2676, on 2026-10-05. A server that reports any other protocol is refused with a message to update this skill. Internal database and RPC schemas can change between T3 releases; rerun the offline tests and one live round trip after a T3 upgrade.

When protocol 2 starts for the first time, T3 copies `state.sqlite` to `statev2.sqlite` and uses only the copy. Delegations recorded before the upgrade keep their IDs, and `status` still reads them. T3 does not migrate pending questions, approvals or provider sessions, so finish or close open delegations before the upgrade.

Start your existing T3 installation, register the destination project in T3, and configure a provider there. The helper does not install T3 or log in to a provider. Set `T3CODE_HOME` if your installation uses a data folder other than `~/.t3`.

The helper needs a T3 bearer credential. This is a T3 environment credential, not a provider API key or browser pairing token. The helper never prints it or saves it to disk.

**Automatic (default).** When `T3_DELEGATE_TOKEN` is unset, the helper issues an 8-hour credential with `t3 auth session issue --token-only` and keeps it in its own process environment, so watchers it starts inherit it. It looks for the T3 CLI in this order:

1. `T3_BIN`: path to the CLI executable or to `bin.mjs` (run with the current Node).
2. `t3` on `PATH`.
3. The running T3 server: the PID in `userdata/server-runtime.json`, then that process's command line and working directory (`/proc` on Linux, `ps` and `lsof` on macOS). This finds installs such as `<dir>/node_modules/t3/dist/bin.mjs` that are not on `PATH`.

Set `T3_DELEGATE_AUTO_TOKEN=0` to turn this off. If it fails, `doctor` names the cause; set `T3_BIN` or supply the credential yourself.

**Manual.** Supply the credential as `T3_DELEGATE_TOKEN` in the environment used to run the helper. With T3's CLI on PATH, a POSIX shell can issue a short-lived credential without printing it:

```sh
export T3_DELEGATE_TOKEN="$(t3 auth session issue --base-dir "${T3CODE_HOME:-$HOME/.t3}" --ttl 8h --label t3-handoff --token-only)"
```

Keep shell tracing off for credential setup. If `t3` is not on PATH, use the executable path from your T3 installation. Shells such as PowerShell have different environment assignment syntax. Each new shell process must inherit the credential. Refresh it when it expires, then retry with the same request key or delegation ID. Restart an existing watcher after credential refresh so it inherits the new value.

`projects` and `handoff` do not need authentication. `doctor` checks the runtime and lists provider readiness. If T3 rejects a protocol request, inspect the installed version before retrying; do not modify the T3 database to make the adapter fit.

## State and execution mode

State lives at `~/.local/state/t3-delegations/<hash-of-T3-home>/`. `T3_DELEGATE_STATE` changes the parent directory. Request prompts, command receipts, result JSON and watcher logs are local files. The helper requests owner-only POSIX permissions; on Windows, use a state directory protected by the user's account permissions. State stays outside the skill, so a copied or read-only plugin installation works.

New sessions default to `auto`. `start --runtime-mode` accepts the four T3 modes:

| Mode | Claude Code child | Codex child |
|---|---|---|
| `auto` (default) | permission mode `auto` | `on-request` approvals, `workspace-write` sandbox, automatic approval reviewer |
| `auto-accept-edits` | permission mode `acceptEdits` | `on-request` approvals, `workspace-write` sandbox, user reviews |
| `approval-required` | default permission prompts | `untrusted` approvals, `read-only` sandbox |
| `full-access` | `bypassPermissions`; use only when authorized | `never` approvals, `danger-full-access` sandbox |

This mapping was read from T3 Code 0.0.39 and was not rechecked for protocol 2; confirm it after a T3 upgrade. In `auto`, an action the provider does not approve still stops the child with `needs_approval`. Follow-ups use the current T3 mode, including changes made in T3. Saved requests retain their original launch mode when retried. Protocol 2 accepts any of the four modes from this helper; the narrower-than-parent limit applies only to children that T3 agents create through T3's own tools.

## External parent

From Codex or Claude Code, monitor in the conversation that called `start`. In Claude Code, run `watch ID --follow` under the Monitor tool: each new report and state change is one JSON line, and an `end` line closes it. Elsewhere, call `wait` again with the same ID; it returns on each new report, so the parent gets regular updates. `status` is an immediate snapshot with every report. All three return or name the saved result file.

An inactive external parent needs a manual resume and the delegation ID. The helper cannot inject a reply into an arbitrary Codex or Claude conversation. ChatGPT web needs a connected local tool or a user-pasted handoff.

## T3 parent

`start --parent-thread ID` validates the local parent and starts a detached `watch` process. The watcher checks the child every 3 seconds. It posts a progress message for each new report and one final message for a terminal, question, approval or plan state. It posts only when the parent is idle with no pending approval, question or plan; reports that arrive while the parent is busy go together in the next post. Each post starts a parent turn, so the parent should give the user a one-line update and end its turn.

On protocol 1 the posts keep the parent's runtime and interaction modes. On protocol 2 the parent thread keeps its own modes. Every post is labeled as child data, not a user instruction.

The watcher tries for one hour by default. After a question or approval report, use `reply`, then run `watch ID` again for the next result. Logs are saved to `<delegation-id>.watch.log`. Expiration does not cancel the child. After a host restart, run `watch ID` to resume delivery; no boot service is installed. If the agent's process manager terminates detached children, use `wait` or run `watch` in a persistent terminal.

Saved command IDs prevent a lost reply from causing a duplicate start or post. An unavailable parent leaves the result saved locally. A later independent user prompt in a child produces `superseded`; inspect its session instead of treating the newest answer as this task's result.

## Progress reports

The child delivers each t3-report block as a `cat <<'T3_REPORT'` shell command. The command input is stored in the child's T3 history (protocol 1: a completed command activity; protocol 2: a command turn item). The helper also reads blocks written as reply text. In two live runs, a Claude child (Sonnet 5.5, low effort) told to write reports as reply text sent only its final report; its notes between tool calls were thinking blocks with no report in them. With the shell command, Claude (Sonnet 5.5) and Codex (gpt-6-astra) children delivered every report in their runs.

Reports are deduplicated by `seq` within one prompt window. A follow-up starts a new window and resets the `wait` and relay cursors. A block that names a different Handoff ID is ignored.

The helper does not impose provider spending limits or stop the model at a deadline. Use T3 to interrupt work or resolve tool approvals. An observation timeout does not authorize another child or bypass of an approval.
