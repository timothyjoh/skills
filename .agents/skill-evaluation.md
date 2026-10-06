# Skill evaluation cases

Use the four targets in [Model evaluations](skill-quality.md#model-evaluations): Haiku, Sonnet, Opus, and Codex. Record results separately for each target; an unavailable model or host capability is untested, not passed.

Run a relevant case in a fresh session for each intended model. Record the exact model ID, prompt, tools, supplied files, artifact, pass/fail reasons, and cost. Use temporary output directories. External publishing, live delegation, full channel processing, and synthesis are separate integration tests; the offline cases below do not authorize those actions.

## Cases

| Skill | Input or setup | Observable result |
|---|---|---|
| channel-to-skill | A saved scope and catalog; `Workflow` unavailable | Preserves chosen scope, reads the bundled workflow, executes available phases without treating it as a Node program; missing prerequisites are named. |
| playlist-to-skill | A fixture with duplicate positions, unavailable videos, and a readable transcript | Every position remains accounted for. Duplicate IDs extract once. Navigation and coverage checks pass before completion. |
| t3-handoff | `completed` reply lacking the task's required test output | Requests the missing evidence using the existing delegation; does not launch a duplicate child or call the objective complete. Use recorded responses, not a live T3 session. |
| t3-report | A prompt with a Handoff ID and the brief "report after each file"; a three-file task | Sends `started`, one `working` per file and `done` as `cat <<'T3_REPORT'` commands with consecutive `seq`, then the final answer. Live check: 2026-10-05, Sonnet 5.5 low effort skipped `started` once; Codex gpt-6-astra sent all. |
| explain-pr | A temporary committed repository with two changes and one invalid code link in the draft | Pins commits, accounts for both files, fixes the link, reruns the check, and renders. Does not post a comment without a posting request. |
| explain-pr evidence | A pinned head, test output from an older revision, and a column-drop migration | Attributes the output to the tested revision; leaves the pinned head unverified; explains that reverting code does not restore deleted data. Code-reference checks do not count as runtime proof. |
| pr-description (global installation) | A duplicate-email fix with observed before/after counts, a staging-only test run, and no full-suite result | Produces one small visual and at most 150 prose words; preserves the observed counts and test scope; names affected users and the fact that rollback cannot unsend email. |
| domain-modeling (global installation) | Separate new-only, legacy-only, conflicting dual-file, and mapped multi-context glossary fixtures | Updates the correct glossary; preserves existing legacy content; surfaces conflicting definitions; follows the map and updates its links when migrating. Does not create a second empty glossary. |
| browser-tour | Two supplied page snapshots; user has not said next after the first | Narrates only the visible first page and pauses. Missing audio leaves a text tour possible. |
| storytime | A short story, `default` as the sole available voice, one nonexistent cast voice | Preserves words, produces valid tags, resolves the missing cast entry before synthesis, and does not claim to have listened to unplayed audio. |
| tts-voice | A missing `generate.py` adapter or a synthesis error naming a missing package | Names the adapter path and interface or missing package; repairs only that dependency and rechecks. Does not claim audio exists. |
| jira-writing | A requested local draft with desired behavior missing an acceptance criterion | Repairs the mismatch, repeats the language and cross-check passes, and returns a draft without posting to Jira. |
| show-me | A supplied three-step flow and a diagram whose last arrow is reversed | Corrects the arrow and keeps only the necessary steps. No forced long checklist or HTML page. |
| wat | The short answer below, followed by `wat` | Picture first; preserves all counts, ordering, deletion consequence, and environment uncertainty. Brevity does not remove a caveat. |
| asd-ste100 | The same short answer, requested in STE-flavored mode | Preserves facts and uncertainty while applying the vendored writing rules. Do not patch the vendored skill after a failure; report it for upstream review. |

## Reproducible wat smoke case

Prompt: Use the supplied wat skill to re-explain the previous answer. The user says "wat". Return only the user-facing re-explanation. Tools are unavailable; the language skill is supplied inline.

Previous answer:

> The migration copies 240 records into the new table. It leaves the original table intact until you run cleanup. Cleanup permanently deletes the original table. Of 240 copied records, 3 failed validation and must be repaired before cleanup. The migration has only been tested on staging; production behavior is unverified.

Supply the complete `wat/SKILL.md` and `asd-ste100/SKILL.md`. Compare the previous committed wat skill against the working version while holding the language skill constant. Disable tools, hooks, automatic skill discovery, and persisted session context. Use a per-call spending cap and a wall-clock timeout.

Score separately: picture first; 240 records; 3 validation failures; repair before cleanup; original intact before cleanup; permanent deletion; staging-only testing; production unverified; no invented facts. Record word counts, but do not fail a faithful response merely for exceeding half the original length. This is a single fixture, not a reliability benchmark or an end-to-end tool test.
