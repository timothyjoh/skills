## What it does

Hands off a task to a new T3 Code conversation in one of your registered projects, follows the agent's progress while it works, and brings its result back to the conversation that delegated the task. Each session is named `👋 <task name>`, so delegated work is easy to find in the T3 sidebar.

The defining constraint: the coordinator does not write progress rules into the handoff prompt. It gives a short **reporting brief** (what it wants to hear about, and when), and the child follows the [t3-report](./t3-report.md) skill. The helper reads the child's reports from its T3 conversation and passes each one on.

The helper detects which T3 protocol your server speaks and uses the matching adapter: protocol 1 for T3 Code 0.0.45 and earlier, protocol 2 for 0.0.46 and later. It saves request IDs before dispatch, so retrying after a lost connection reuses the same child session.

## When to reach for it

Type `/t3-handoff` in Claude Code or `$t3-handoff` in Codex when you want a separate T3 session to research, implement or review a scoped task. The agent can also select it when a requested handoff calls for T3 delegation.

For example: "Use t3-handoff to review this branch in my registered project, report after each file you review, then bring back the findings." The agent checks your project inventory and repository instructions before dispatch.

The child side is [t3-report](./t3-report.md). You do not run it yourself.

## Prerequisites

- Node.js 24 or newer and shell access from the originating agent.
- A running local T3 Code installation with a registered project and an authenticated provider.
- A T3 bearer credential. The helper issues a short-lived one through the T3 CLI when `T3_DELEGATE_TOKEN` is not set. It does not save credentials to disk.
- The sibling [t3-report](./t3-report.md) skill in the same bucket. The handoff prompt gives the child its path.

The agent runs the bundled `doctor` command before dispatch. It reports the server version and protocol. See [setup and compatibility](../../skills/development/t3-handoff/references/returns-and-operations.md) for credential setup, alternate data folders and protocol limits.

## Following the work

The child sends a short report when it starts, at each phase or point the brief names, when it is blocked, and when it is done. Where the reports go depends on where the coordinator runs:

- **Claude Code:** a monitor prints one line per report, then an end line when the child finishes or needs you.
- **Codex:** each `wait` returns as soon as a new report arrives.
- **T3:** each report is posted into the parent conversation when it is idle, so the parent gives you a running update, then the result.

A finished model turn still needs checking against the task's completion criteria. Missing results get a targeted follow-up and a new evidence check; a repeated blocker is reported with the session link. If the child asks a question or needs approval, the helper reports that state with the question's IDs.

An inactive Codex or Claude Code conversation needs to be resumed to collect its result. The helper cannot wake it automatically.

## Common questions

**Why did my delegated sessions used to have names like `Delegated review: revival-adv-review-pr-73`?** The old helper built the title from the task kind and the request key. Now a short task name is required, and T3 never replaces it. Rename an existing one with `rename`.

**What happens when I upgrade T3 to 0.0.46?** The helper switches to protocol 2 by itself. T3 does not carry open questions or approvals across that upgrade, so finish open delegations first.

**Does every report always arrive?** No. Some models skip a report, most often the first one. The child's state and final answer are still collected.

## It's working if

- The inventory matches projects registered in your T3 installation, and `doctor` names your T3 version and protocol.
- The session appears in the intended project as `👋 <task name>`, with the requested model.
- Progress lines or posts arrive while the child works, not only at the end.
- Retrying the same request key returns the same session.
- The returned answer includes the child's actual findings or questions.
- Copying the skill folder elsewhere still lets its [offline tests](../../skills/development/t3-handoff/references/smoke-test.md) run without the original repository.
