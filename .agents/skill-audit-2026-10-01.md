# Skill audit, 2026-10-01

Applied the recommendations from Simon Scrapes' [Everything You Know About Skills IS OUTDATED](https://www.youtube.com/watch?v=e7TY56-yIvM). Reviewed the full English automatic transcript (12:49) and checked the linked [Anthropic authoring guide](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).

The guide describes possible partial reads of nested references. It does not establish a fixed 100-line reading limit. This audit applies the navigation advice without treating that claim as runtime behavior.

## Recommendations and changes

| Recommendation | Repository action |
|---|---|
| Contents for references over 100 lines | Existing runtime references are shorter. Both generators now request contents lists for long output pages; their validators reject missing sections and incorrect heading anchors. |
| Match instruction freedom to the task | Preserve schemas, pinned commits, source coverage, and retry IDs. Let visual choice, grouping, casting, and pacing vary. Replace wat's rigid paragraph count and half-length requirement with a fidelity-preserving target. |
| Test intended models | Add offline cases for all 11 skills and run a cost-capped before/after wat sample on Haiku, Sonnet, and Opus. Record failures and timeouts below. Do not add broad supported-model claims to frontmatter from this sample. |
| Direct reference access | Make explain-pr's reference paths clickable and conditional. Require generated concepts and support pages to link directly from SKILL.md. Preserve useful cross-links. |
| Checklists for long workflows | Add observable milestones to both knowledge generators and explain-pr. Keep short writing tasks free of mandatory progress lists. |
| Correction loops | State what to repair, what to recheck, and when a repeated failure must be reported. Separate file existence, structural checks, visual/audio inspection, and semantic correctness. |
| Explicit dependencies | Add version checks, missing-package setup examples, host capability requirements, sibling-skill loading, and browser-tour's audio path override. Identify the local Chatterbox adapter as a required dependency. |

## Skill coverage

| Skill | Outcome |
|---|---|
| channel-to-skill | Prerequisites, host fallback, progress, navigation generation and validation, repair loop. |
| playlist-to-skill | Prerequisites, progress, navigation generation and validation, repair loop. Full playlist scope preserved. |
| delegate-t3-agent | Doctor before dispatch; targeted follow-ups when returned evidence misses completion criteria. |
| explain-pr | Direct reference links, prerequisite checks, progress, revalidation, rendered inspection. Existing language-pass edits preserved. |
| browser-tour | Explicit optional audio dependency and override; verify loaded content before narration. Turn-by-turn pause preserved. |
| storytime | Dependency checks, installed-path resolution, cast checks before synthesis, duration and optional listening checks. |
| tts-voice | Adapter and environment preflight, setup instructions, output checks, bounded repair. |
| jira-writing | Explicit dependencies, repeat cross-checks after revision, repeat read-back after a publishing repair. |
| show-me | Preserve source behavior in the visual; inspect HTML when possible and disclose when not checked. |
| wat | Explicit language-skill loading, picture-first consistency, flexible length, fidelity comparison after revision. |
| asd-ste100 | Reviewed; vendored files unchanged, per repository policy. |

Human docs were synchronized for the ten changed skills. Invocation modes, manifests, names, and installed links are unchanged. No skill was added or removed.

## Validation

- 58 automated tests passed: 10 knowledge/navigation tests and 48 explain-pr/delegate-t3 tests.
- Both host workflow files compile as async workflow bodies.
- `claude plugin validate . --strict` passed; plugin and package versions agree.
- All 11 frontmatter and Codex interface YAML files parse, and explicit-only policies match.
- The generic Codex quick validator passed eight skills. It rejects the two knowledge skills' existing Claude invocation fields and the vendor's existing `version` field. These were preserved intentionally; they are not new failures from this change.
- Local runtime reference links and whitespace were checked. Vendored content has no diff.
- No full channel build, audio synthesis, live T3 dispatch, browser tour, or external publication was run.

## Model sample

On 2026-10-04, Tim confirmed Haiku, Sonnet, Opus, and Codex as the intended targets. This sets the future evaluation matrix; it does not change the results or unverified cases below.

The [fixture and rubric](skill-evaluation.md#reproducible-wat-smoke-case) hold the source answer and language skill constant. The baseline uses the previously committed wat skill. Calls used Claude Code 2.1.287, safe mode, disabled tools, low effort, no persisted session, a 55-second timeout, and a USD 0.30 per-call cap.

| Requested model | Baseline | Revised result |
|---|---|---|
| Haiku (`claude-haiku-4-5-20251001`) | 146 words; preamble and an unsupported recovery guarantee. | Both revised attempts timed out. No behavioral result. |
| Sonnet (`claude-sonnet-5-5`) | 196 words; preamble and claims stronger than the source. | Final attempt: 158 words, picture first, required counts and conditions retained. Still says "I tested" where the source does not identify the tester. Fidelity check fails. |
| Opus (`claude-opus-5-5`) | 179 words; preamble, unsupported recovery claim, and a stronger claim about production execution. | Final attempt: 110 words, picture first, counts, ordering, deletion consequence, and staging/production uncertainty retained. Passes this fixture. |

The first revised sample prompted one narrow clarification: preserve the scope and strength of claims, and keep definitions from adding promises. The repeated sample is recorded above. No more generic rules were added to chase one test.

[Raw outputs and run metadata](evals/wat-2026-10-01.json) include all nine requests. Seven completed calls reported USD 0.400093 total. The two timed-out calls returned no cost; each had the same USD 0.30 cap. Claude Code also reports auxiliary Haiku usage for Sonnet and Opus requests.

This is one instruction-only fixture, not a reliability benchmark. Codex received structural and execution checks in this session, but no independent behavioral run. End-to-end and broader cross-model evaluation remain unverified, as do behavior cases for the other ten skills.
