# Returns and operations

## Compatibility and setup

The helper uses T3 Code's local Effect-RPC V1 API and reads `userdata/state.sqlite` without writing to it. The source helper was exercised with T3 Code 0.0.39. The V1 RPC names also exist in the [0.0.42 contracts](https://github.com/pingdotgg/t3code/blob/v0.0.42/packages/contracts/src/rpc.ts); this is a source check, not a live compatibility test. Internal database and RPC schemas can change between T3 releases. A `statev2.sqlite` file causes refusal before authentication or dispatch.

Start your existing T3 installation, register the destination project in T3, and configure a provider there. The helper does not install T3 or log in to a provider. Set `T3CODE_HOME` if your installation uses a data folder other than `~/.t3`.

Supply a T3 bearer credential as `T3_DELEGATE_TOKEN` in the environment used to run the helper. This is a T3 environment credential, not a provider API key or browser pairing token. The helper never saves it to disk. With T3's CLI on PATH, a POSIX shell can issue a short-lived credential without printing it:

```sh
export T3_DELEGATE_TOKEN="$(t3 auth session issue --base-dir "${T3CODE_HOME:-$HOME/.t3}" --ttl 8h --label delegate-t3-agent --token-only)"
```

Keep shell tracing off for credential setup. If `t3` is not on PATH, use the executable path from your T3 installation. Shells such as PowerShell have different environment assignment syntax. Each new shell process must inherit the credential. Refresh it when it expires, then retry with the same request key or delegation ID. Restart an existing watcher after credential refresh so it inherits the new value.

`projects` and `handoff` do not need authentication. `doctor` checks the runtime and lists provider readiness. If T3 rejects a protocol request, inspect the installed version before retrying; do not modify the T3 database to make the adapter fit.

## State and execution mode

State lives at `~/.local/state/t3-delegations/<hash-of-T3-home>/`. `T3_DELEGATE_STATE` changes the parent directory. Request prompts, command receipts, result JSON and watcher logs are local files. The helper requests owner-only POSIX permissions; on Windows, use a state directory protected by the user's account permissions. State stays outside the skill, so a copied or read-only plugin installation works.

New sessions default to `approval-required`. Use `start --runtime-mode full-access` when authorized. Follow-ups use the current T3 mode, including changes made in T3. Saved requests retain their original launch mode when retried.

## External parent

From Codex or Claude Code, run `wait` in the conversation that called `start`. It returns child messages as tool output. A bounded wait can return `running`; call it again with the same ID. `status` is an immediate snapshot. Both return the saved result file path.

An inactive external parent needs a manual resume and the delegation ID. The helper cannot inject a reply into an arbitrary Codex or Claude conversation. ChatGPT web needs a connected local tool or a user-pasted handoff.

## T3 parent

`start --parent-thread ID` validates the local parent and starts a detached `watch` process. It sends results only when that parent is idle with no pending approval, question or plan. It preserves the parent's execution modes and labels the callback as task data.

The watcher tries for one hour by default. It reports input and approval states as well as terminal results. After such a report, use `reply`, then run `watch ID` again for the next result. Logs are saved to `<delegation-id>.watch.log`. Expiration does not cancel the child. After a host restart, run `watch ID` to resume delivery; no boot service is installed. If the agent's process manager terminates detached children, use `wait` or run `watch` in a persistent terminal.

Saved command IDs prevent a lost reply from causing a duplicate start or callback. An unavailable parent leaves the result saved locally. A later independent user prompt in a child produces `superseded`; inspect its session instead of treating the newest answer as this task's result.

The helper does not impose provider spending limits or stop the model at a deadline. Use T3 to interrupt work or resolve tool approvals. An observation timeout does not authorize another child or bypass of an approval.
