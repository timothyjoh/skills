---
name: delegate-t3-agent
description: Delegate a task to a new T3 Code session in a registered local project, collect its reply, and continue orchestration. Use for research-to-implementation handoffs, Jira research followed by a fix session, adversarial reviews, or starting a project agent from Codex, Claude Code, or another T3 session.
---

# Delegate a T3 Code agent

## Prerequisites

- Node.js 24 or newer. All JavaScript dependencies are bundled or built into Node.
- A running local T3 Code installation using the V1 orchestration API, with a registered project and an authenticated provider. The original helper was tested with T3 Code 0.0.39. V2 databases are rejected before connection.
- Shell access in the originating agent and a T3 bearer credential in `T3_DELEGATE_TOKEN`. Read [returns-and-operations.md](references/returns-and-operations.md) for setup and compatibility limits.

Use `scripts/t3.mjs` from this skill folder. Resolve its absolute path from the installed `SKILL.md`, regardless of the caller's working directory. No sibling skill or coordinator service is required.

## Choose the work and destination

1. Run `node <skill>/scripts/t3.mjs projects`. It queries the local T3 SQLite database read-only and returns current project IDs, paths and model defaults. Never write to the T3 database. Do not invent a project ID or register another clone just to satisfy a handoff.
2. Match the requested scope to a project, using source evidence and the destination's `AGENTS.md`, `CLAUDE.md`, README and relevant skills. Read [routing.md](references/routing.md) for project selection, models and branch rules.
3. If the user gives a Jira card and asks for research followed by delegation, follow [jira-handoff.md](references/jira-handoff.md). Complete research and the requested Jira update before launching implementation. Use a workspace that permits the requested task. Research can occur in the current session when it has the required context and tools; do not add an unnecessary coordinator session.
4. Choose an exact project ID, title, path or unique folder name from the inventory. When multiple projects remain plausible, ask one targeted question. If the project is absent or the required access is unavailable, write a handoff with `handoff` and report the missing destination or access. Never silently substitute another project.

## Start the session

Write the complete task prompt to a local file. Include the objective, source links, verified findings, affected repository, branch rules, completion criteria, exclusions, and what the child must report. Keep personnel or personal context out of unrelated handoffs.

```sh
node <skill>/scripts/t3.mjs start \
  --project 'EXACT_PROJECT_ID_OR_TITLE' \
  --kind implementation \
  --prompt-file /absolute/path/to/handoff.txt \
  --key 'unique-stable-request-key'
```

Kinds: `research`, `planning`, `implementation`, `review`, `research-review`, `coordination`. A delegation request authorizes dispatch within its stated scope. Do not queue it and ask again whether to start.

Keep the returned delegation ID, T3 thread ID and URL. Reuse the same key and identical arguments if a response is lost. The helper persists commands before sending and reuses their IDs. A changed objective needs a new key. A transport timeout does not mean the task failed or that it is safe to launch another child.

Use the destination project's configured provider and model unless the user requests an override. `models` reports live choices; `--provider`, `--model`, and `--effort` select explicit overrides for any task kind. Unknown or unavailable choices fail instead of silently falling back. If the project has no default provider, select one from `models` based on the user's request or ask a targeted question.

New sessions default to `approval-required`. Use `--runtime-mode full-access` when the user authorizes that execution mode. The launch result reports `runtimeMode`. Follow-ups use the child's current T3 mode, and callbacks preserve the parent's mode. Replaying a request key preserves its recorded launch settings.

The helper uses the existing checkout. The child follows the destination's branch instructions and the delegated task's authorization. Replaying an old request key preserves that session's recorded mode; change an existing session's mode in T3 if needed.

## Collect the reply and continue

```sh
node <skill>/scripts/t3.mjs wait DELEGATION_ID --timeout 45
```

- `completed`: the model turn ended. Read the actual `messages` and assess completion criteria. The word does not certify objective completion.
- `running` or `pending`: continue independent work, then call `wait` with the same ID. Each call waits at most 55 seconds. Keep the orchestration task open if the user requested follow-through.
- `needs_input`: relay the actual questions and preserve their request/question IDs. Use `reply --request-id ID --answers-file FILE --key KEY` to answer with the user's decisions or facts already authorized in the original task.
- `needs_approval` or `needs_plan_review`: show the session link and required action. Do not grant permissions or implement a proposed plan by inventing consent.
- `failed`, `interrupted`, `unknown`, or `superseded`: report the observed state, inspect the linked session, and avoid a duplicate launch. `superseded` means a later user prompt makes the latest turn unsuitable as evidence for this request.

A text follow-up after a finished turn uses `reply DELEGATION_ID --prompt-file FILE --key NEW_REPLY_KEY`. Then call `wait` again. Results are retained in a private local JSON file whose path appears in the output.

Codex and Claude Code receive the result as shell tool output in the originating conversation. This helper cannot wake an arbitrary inactive Codex Desktop, ChatGPT web, or Claude Code conversation. Pure ChatGPT web without local tools cannot invoke it; produce a handoff or use a connected local Codex session.

For a T3 parent, add `--parent-thread ACTUAL_T3_THREAD_ID` to `start`. Get this ID from the current T3 URL or explicit session context, not the provider's Codex/Claude session ID. If uncertain, use `wait` instead. The helper starts a local watcher that waits for the child and an idle parent, then posts the child report into that exact T3 conversation. End the parent turn after acknowledging dispatch so the callback can run. A busy parent, approval or open question delays delivery. Read [returns-and-operations.md](references/returns-and-operations.md) for restart and retry behavior.

## Setup and verification

Run `doctor` to check the database, server, authentication and providers. It does not install or start T3. `T3CODE_HOME` selects an alternate T3 data folder; `T3_DELEGATE_STATE` selects a writable folder for delegation records. Never print credentials or put them in prompts or files.

Read [smoke-test.md](references/smoke-test.md) for offline checks and an optional live round trip. A live test creates a conversation and uses provider quota; keep its prompt limited to an acknowledgement.
