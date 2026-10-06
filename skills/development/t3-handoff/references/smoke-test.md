# Verify the helper

## Offline tests

From any working directory, resolve this installed skill's folder and run:

```sh
node --test <skill>/scripts/tests/*.test.mjs
node <skill>/scripts/t3.mjs --help
```

The tests use temporary databases and simulated RPC transports. They run the delegation logic against both protocol adapters. They check project discovery, protocol detection, session titles, model selection, retry deduplication, state classification, progress report parsing, question replies, renames and parent posts. They do not contact T3 or consume provider quota.

## Live round trip

This optional test creates a real T3 conversation and consumes provider quota. Use a registered project where a test conversation is appropriate. Configure the environment as described in [returns-and-operations.md](returns-and-operations.md).

1. Run `node <skill>/scripts/t3.mjs projects` and select a project from the output.
2. Run `node <skill>/scripts/t3.mjs doctor` and confirm that its provider is ready.
3. Save this prompt to a private temporary file: `Create notes/smoke.txt containing T3-SMOKE-ACK, then show it with cat. Done when cat prints T3-SMOKE-ACK.`
4. Start one child with a new request key:

```sh
node <skill>/scripts/t3.mjs start --project 'EXACT_PROJECT_ID' --kind implementation \
  --title 'Smoke test note' --prompt-file /absolute/path/to/prompt.txt \
  --brief 'Report when you start, after creating the file, and when done.' --key unique-smoke-request
node <skill>/scripts/t3.mjs watch DELEGATION_ID --follow
```

A pass requires: the session title `👋 Smoke test note` in T3; `report` lines for `started` and `done` before the `end` line; and `completed` with an actual assistant message in `status`. Without a monitor, repeat `wait` with the same ID. Resolve questions or approvals in the linked session. Delete `notes/smoke.txt` afterwards.

Repeat the identical `start` command to test deduplication. It must return the original delegation and thread IDs. Changed arguments require a new key for distinct work.

## T3 parent callback

In a T3 conversation, ask the agent to run the same test with that conversation's actual T3 thread ID as `--parent-thread`. End the parent turn after dispatch so the watcher can post.

Verify: one progress post per report in the parent conversation, a final result post, `delivered` lines in the watcher log, and a later response from the original parent that quotes the child's result. A dispatch receipt alone does not prove the parent read the answer. Run `watch DELEGATION_ID` if the watcher stopped.

## Issue handoff dry run

Use a saved sample issue and repository evidence. Request a handoff without posting to the issue tracker or launching implementation. Check that it identifies the repository from evidence and includes findings, uncertainty and tests. An unregistered destination must produce a handoff or targeted question, not an invented project.
