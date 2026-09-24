## What it does

Starts a T3 Code conversation in one of your registered projects and brings the agent's answer back to the conversation that delegated the task. It saves request IDs before dispatch, so retrying after a lost connection reuses the same child session.

Project paths and model choices come from your T3 installation. The skill includes its JavaScript helpers and tests; it needs no separate coordinator service or sibling skill.

## When to reach for it

Type `/delegate-t3-agent` in Claude Code or `$delegate-t3-agent` in Codex when you want a separate T3 session to research, implement or review a scoped task. The agent can also select it when a requested handoff calls for T3 delegation.

For example: "Use delegate-t3-agent to review this branch in my registered project, then bring back the findings." The agent checks your project inventory and repository instructions before dispatch.

## Prerequisites

- Node.js 24 or newer and shell access from the originating agent.
- A running local T3 Code installation with a registered project and an authenticated provider.
- A T3 bearer credential supplied through `T3_DELEGATE_TOKEN`. The helper does not save credentials to disk.

The adapter targets T3's V1 API. Its source was tested with T3 Code 0.0.39; V2 databases are rejected. See [setup and compatibility](../../skills/development/delegate-t3-agent/references/returns-and-operations.md) for credential setup, alternate data folders and protocol limits.

## Dispatch and return

The agent writes a handoff containing the objective, evidence, repository rules and completion criteria. The helper starts the session with the project's model defaults. You can request a different available provider or model. New sessions use approval mode; full access is an explicit option.

A wait returns the child's real messages and session link. A finished model turn still needs checking against the task's completion criteria. If the child needs input or approval, the helper reports that state. If the originating conversation is in T3, an optional watcher can deliver the result to that exact parent thread once it is idle.

An inactive Codex or Claude Code conversation needs to be resumed to collect its result. The helper cannot wake it automatically.

## It's working if

- The inventory matches projects registered in your T3 installation.
- The session link opens the intended project with the requested task and model.
- Retrying the same request key returns the same session.
- The returned answer includes the child's actual findings or questions.
- Copying the skill folder elsewhere still lets its [offline tests](../../skills/development/delegate-t3-agent/references/smoke-test.md) run without the original repository.
