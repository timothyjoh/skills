# Skill quality checks

Use this guide when changing a skill or a workflow that generates skills. Keep the existing invocation mode and preserve vendored files byte-for-byte.

## Navigation

Keep essential instructions in `SKILL.md`, below 500 body lines. Link each agent-facing reference directly from the entry point and say when to read it. Cross-links may supplement that route. Tests, license files, and maintainer provenance are not runtime references.

A reference over 100 lines needs a linked contents list near the top that matches its main headings. Group long flat lists into useful sections. This makes partial reads useful; there is no fixed rule that an agent always stops at line 100.

## Instructions and completion

Choose specificity per operation. Let writing, grouping, and visual selection adapt to the task. Preserve exact schemas, provenance, idempotency keys, and commands where variation can break the result. Use bundled scripts for existing deterministic checks.

For long workflows whose order matters, track a small checklist in the host plan or progress output. Mark a stage complete only after its observable check passes. Short explanations do not need a public checklist.

State what is checked, what gets repaired, and what must be rechecked. Report persistent failures with the artifact and failed check. Never equate a finished model turn, created file, or zero exit status with semantic correctness. Preserve user authorization when a repair would repeat an external action.

## Dependencies

Check tools and versions before the step that needs them. Name package setup, sibling skills, host-only APIs, and environment overrides. Keep scripts inside the skill folder and resolve their paths from its installed location. Use platform-specific installation examples as examples, not universal commands. Reuse working environments.

A missing optional dependency blocks its branch, not unrelated work. A missing required dependency needs a concrete error or handoff. Avoid reinstalling tools or replacing the user's configuration as a default repair.

## Model evaluations

The intended targets are Claude Haiku, Claude Sonnet, Claude Opus, and models used through Codex, confirmed by Tim on 2026-10-04. Keep shared instructions usable across these targets. Codex names the host here; record the actual model ID and reasoning setting for each evaluation. Required host tools still determine which workflows can run.

Test the models actually intended for use. Use the same input and acceptance criteria for the previous and revised skill, in fresh sessions with the same tool access. Start with a small, cost-capped sample; record model IDs, outcomes, cost, and limitations. A static validator is not evidence that a model follows the skill.

For a powerful model, compare against the previous skill or a no-skill baseline before adding more instructions. For a smaller model, check whether it preserves required steps and facts. Fix the demonstrated omission, not every possible failure.

Do not add a tested-model claim to frontmatter from inspection alone. A bounded result can be recorded under `metadata` with its exact scope. Keep full prompts, rubrics, and results in evaluation records. Never imply that one passing writing example validates a live browser, paid service, or media pipeline.

## Repository checks

Run `npm run test:knowledge` after changing the knowledge generators. This tests source coverage and generated navigation. Other helper tests are in `package.json`; run those affected by the change. Use `npm run validate` to check plugin packaging.

Read the changed instructions for contradictions, check their links, sync the human docs, and add a changeset. Preserve unrelated working-tree edits.

## Sources

- Simon Scrapes, [Everything You Know About Skills IS OUTDATED](https://www.youtube.com/watch?v=e7TY56-yIvM), 2026-10-01. Recommendations at 00:54 (contents), 01:39 (freedom), 04:26 (models), 06:31 (references), 08:44 (checklists), 09:59 (repair loops), and 10:51 (dependencies).
- Anthropic, [Skill authoring best practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices), checked 2026-10-01. The guide describes possible partial reads; the video's opening should not be interpreted as a hard runtime limit.
