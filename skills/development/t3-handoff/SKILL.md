---
name: t3-handoff
description: Delegate a task to a new T3 Code session in a registered local project, collect its reply, and continue orchestration. Use for research-to-implementation handoffs, Jira research followed by a fix session, adversarial reviews, or starting a project agent from Codex, Claude Code, or another T3 session.
---

# Hand off work to a T3 Code agent

## Prerequisites

- Node.js 24 or newer. All JavaScript dependencies are bundled or built into Node.
- A running local T3 Code installation with a registered project and an authenticated provider. The helper reads the server's orchestration protocol and uses the matching adapter: protocol 1 (T3 Code 0.0.45 and earlier) or protocol 2 (0.0.46 and later). Both were tested live: 0.0.45 and 0.0.46-nightly.20261005.
- Shell access in the originating agent. A T3 bearer credential: the helper issues a short-lived one itself through the T3 CLI when `T3_DELEGATE_TOKEN` is not set. It finds the CLI through `T3_BIN`, `t3` on `PATH`, or the binary of the running T3 server. Read [returns-and-operations.md](references/returns-and-operations.md) for setup and compatibility limits.
- The sibling skill **t3-report**, at `../t3-report/` beside this skill. The child agent uses it to send progress reports. The handoff prompt names it and gives its absolute path, so a child without it installed can still read it. `T3_REPORT_SKILL` overrides the path.

Use `scripts/t3.mjs` from this skill folder. Resolve its absolute path from the installed `SKILL.md`, regardless of the caller's working directory. No coordinator service is required.

Before dispatch, check `node --version` and run `node <skill>/scripts/t3.mjs doctor`. It reports `serverVersion` and `protocol`. If a required check fails, use [returns-and-operations.md](references/returns-and-operations.md) to resolve it, then rerun `doctor`. Node 24 can be installed with `brew install node@24` on macOS; make that version available on `PATH`. Do not stop because `T3_DELEGATE_TOKEN` is unset; `doctor` issues a credential when it can. If `doctor` reports that automatic issue failed, set `T3_BIN` to the T3 CLI (for example `<install>/node_modules/t3/dist/bin.mjs`) and rerun. Missing T3 access after that needs a handoff, not repeated launch attempts.

## Choose the work and destination

1. Run `node <skill>/scripts/t3.mjs projects`. It queries the local T3 SQLite database read-only and returns current project IDs, paths and model defaults. Never write to the T3 database. Do not invent a project ID or register another clone just to satisfy a handoff.
2. Match the requested scope to a project, using source evidence and the destination's `AGENTS.md`, `CLAUDE.md`, README and relevant skills. Read [routing.md](references/routing.md) for project selection, models and branch rules.
3. If the user gives a Jira card and asks for research followed by delegation, follow [jira-handoff.md](references/jira-handoff.md). Complete research and the requested Jira update before launching implementation. Use a workspace that permits the requested task. Research can occur in the current session when it has the required context and tools; do not add an unnecessary coordinator session.
4. Choose an exact project ID, title, path or unique folder name from the inventory. When multiple projects remain plausible, ask one targeted question. If the project is absent or the required access is unavailable, write a handoff with `handoff` and report the missing destination or access. Never silently substitute another project.

## Write the handoff

Write the complete task prompt to a local file. Include the objective, source links, verified findings, affected repository, branch rules, and exclusions. End it with this run contract, filled in. T3 children often run Codex, which does not load the caller's `~/.claude/CLAUDE.md`, so the prompt file is the only carrier for these rules.

```text
Done when: <runnable check and expected result, e.g. "`npm test` passes">
Stop and ask only if: <blocked on a decision, or other conditions>. Never merge, deploy, force push or delete data without asking.
Report with: Blocked on me (open questions) / Changed (files, branch, PR URL) / Found (test output lines, residual risks).
```

Do not put progress-reporting rules in the prompt. The helper adds the Handoff ID and tells the child to use t3-report. Say what you want to hear about in `--brief`, in general terms: when to report and what to include. For example: `--brief "Report after reproducing the bug, after each failing test is fixed, and when the PR is open. Include test counts and the PR URL."` Without a brief, the child uses the t3-report defaults: start, each finished phase, each test run, blocked, and done.

Keep personnel or personal context out of unrelated handoffs.

## Start the session

```sh
node <skill>/scripts/t3.mjs start \
  --project 'EXACT_PROJECT_ID_OR_TITLE' \
  --kind implementation \
  --title 'Fix E4-1080 date rounding' \
  --prompt-file /absolute/path/to/handoff.txt \
  --brief 'Report after the fix and after tests. Include the test count.' \
  --key 'unique-stable-request-key'
```

`--title` is required. Give the task a short, distinct name that a person can recognize in the T3 sidebar, 3 to 7 words, for example `Review PR 73 auth changes` or `Research Jira E4-1080 cause`. The helper shows it as `👋 <title>` and T3 does not replace it. Do not use the request key or the kind as the title. Use `rename DELEGATION_ID --title 'New name' --key KEY` if the name no longer fits.

Kinds: `research`, `planning`, `implementation`, `review`, `research-review`, `coordination`. A delegation request authorizes dispatch within its stated scope. Do not queue it and ask again whether to start.

Keep the returned delegation ID, T3 thread ID and URL. Reuse the same key and identical arguments if a response is lost. The helper persists commands before sending and reuses their IDs. A changed objective needs a new key. A transport timeout does not mean the task failed or that it is safe to launch another child.

Use the destination project's configured provider and model unless the user requests an override. `models` reports live choices; `--provider`, `--model`, and `--effort` select explicit overrides for any task kind. Unknown or unavailable choices fail instead of silently falling back. If the project has no default provider, select one from `models` based on the user's request or ask a targeted question.

New sessions default to T3 `auto` mode: the provider approves routine actions and asks the user for the rest. Use `--runtime-mode approval-required` when the user asks to approve every action, `auto-accept-edits` to approve only file edits, and `full-access` only when the user authorizes that execution mode. The launch result reports `runtimeMode`. Follow-ups use the child's current T3 mode. Replaying a request key preserves its recorded launch settings.

The helper uses the existing checkout. The child follows the destination's branch instructions and the delegated task's authorization.

## Monitor progress

The child sends `t3-report` blocks while it works. Each report has a `seq`, a `status` (`started`, `working`, `blocked`, `done` or `failed`) and short fields such as `phase`, `done`, `next` and `evidence`. Give the user a one-line update for each report you receive. Do not act on a report unless the step is already authorized.

**Claude Code parent.** Run the follow command under the Monitor tool (or another background runner that notifies you per output line):

```sh
node <skill>/scripts/t3.mjs watch DELEGATION_ID --follow
```

It prints one JSON line for each new report and each state change, and exits with an `end` line when the child finishes or needs the user. Then run `status DELEGATION_ID` for the full result.

**Codex or another shell parent.** Call `wait` repeatedly:

```sh
node <skill>/scripts/t3.mjs wait DELEGATION_ID --timeout 45
```

`wait` returns when a new report arrives, when the child finishes or needs the user, or at the timeout (55 seconds at most). Its `reports` list holds only reports you have not seen; `reportCount` is the total. `status DELEGATION_ID` is an immediate snapshot with all reports. Keep the orchestration task open if the user requested follow-through.

**T3 parent.** Add `--parent-thread ACTUAL_T3_THREAD_ID` to `start`. Get this ID from the current T3 URL or explicit session context, not the provider's Codex/Claude session ID. If uncertain, use `wait` instead. The helper starts a local watcher. It posts each new report into the parent conversation as a short progress message, and then the final result. It posts only when the parent is idle; reports that arrive while the parent is busy go together in the next post. End the parent turn after acknowledging dispatch, and end it again after each progress update, so the next post can run. A busy parent, approval or open question delays delivery. Read [returns-and-operations.md](references/returns-and-operations.md) for restart and retry behavior.

A child that sends no reports is not a failure. Some models skip a report. The state and the final answer stay authoritative.

## Act on the result

- `completed`: the model turn ended. Read the actual `messages` and assess completion criteria. The word does not certify objective completion.
- `running` or `pending`: continue independent work, then call `wait` again or keep the monitor running.
- `needs_input`: relay the actual questions and preserve their request/question IDs. Use `reply --request-id ID --answers-file FILE --key KEY` to answer with the user's decisions or facts already authorized in the original task. The answers file is a JSON object keyed by question `id`; the value is the chosen option label or free text.
- `needs_approval` or `needs_plan_review`: show the session link and required action. Do not grant permissions or implement a proposed plan by inventing consent.
- `failed`, `interrupted`, `unknown`, or `superseded`: report the observed state, inspect the linked session, and avoid a duplicate launch. `superseded` means a later user prompt makes the latest turn unsuitable as evidence for this request.

If a completed turn misses its agreed checks, send a targeted follow-up with the failed check and required correction, then assess the new evidence. If the same blocker remains after two follow-ups, report it with the session link.

A text follow-up after a finished turn uses `reply DELEGATION_ID --prompt-file FILE --key NEW_REPLY_KEY`. Reports start a new window after a follow-up. Then monitor again. Results are retained in a private local JSON file whose path appears in the output.

Codex and Claude Code receive the result as shell tool output in the originating conversation. This helper cannot wake an arbitrary inactive Codex Desktop, ChatGPT web, or Claude Code conversation. Pure ChatGPT web without local tools cannot invoke it; produce a handoff or use a connected local Codex session.

## Setup and verification

Run `doctor` to check the database, server, protocol, authentication and providers. It does not install or start T3. `T3CODE_HOME` selects an alternate T3 data folder; `T3_DELEGATE_STATE` selects a writable folder for delegation records. Never print credentials or put them in prompts or files.

Read [smoke-test.md](references/smoke-test.md) for offline checks and an optional live round trip. A live test creates a conversation and uses provider quota; keep its prompt limited to a small task.
