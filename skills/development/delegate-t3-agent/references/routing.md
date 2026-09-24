# Project routing

`projects` reads the current installation's registered projects. Select an exact ID, title, workspace path or unique folder name. There is no bundled project map. Read the selected workspace's README and AGENTS.md/CLAUDE.md to determine its purpose, allowed work and branch rules.

Issue keys and similar folder names do not establish ownership. Confirm the affected repository from source evidence. If the destination is absent, ambiguous or unavailable, use `handoff` or ask the user. Registering a project or creating a checkout is a separate task.

## Branches and concurrency

The helper starts the child in the existing checkout. It does not create a branch or worktree. Follow the destination's instructions and inspect current changes before implementation. Include the required base branch and allowed Git operations in the handoff.

An implementation launch is refused when another T3 turn is active in that project. This is not a lock against terminal agents or concurrent processes. For parallel implementation, use separately prepared and registered checkouts when authorized.

## Models

Run `models` to inspect provider instance IDs and exact model slugs. Every task kind uses the project's default selection, including its model options. An explicit provider override uses that provider's default model unless `--model` is also supplied. If there is no project default provider, supply `--provider` from the live inventory.

`--effort` sets the `reasoningEffort` model option. Use a value supported by the selected provider and model. Model options are provider-specific and the server can reject unsupported options.

Code reviews use `review`; independent research checks use `research-review`. Both start in T3 plan mode. Include the revision, comparison base, requirements and expected evidence in review prompts. Neither kind hardcodes a provider or model.
