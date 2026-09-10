# Origin

Vendored, unmodified, from a third-party repository.

| | |
|---|---|
| Upstream | https://github.com/danyuchn/asd-ste100-skill |
| Commit | `d5ce157870cf9c41efd1d6e836706a2be3c7b9da` (2026-08-13) |
| Skill version | 0.4.0 (per `SKILL.md` frontmatter) |
| License | MIT, see `LICENSE`, retained as the license requires |
| Vendored on | 2026-09-10 |

Files taken: `SKILL.md`, `LICENSE`, `references/writing-rules.md`, `examples/before-after.md`. Upstream `README.md` was not vendored; it describes the standalone repo rather than the skill.

## Why it is here

`wat` points at this skill for its full plain-language rule set. It is also the house style for PR descriptions.

## Keeping it current

Do not edit these files in place. A local edit is invisible to the next person who compares against upstream, and it is lost the next time the skill is refreshed. This repo's no-em-dash rule does not apply to vendored files. To change behaviour, raise it upstream or record the deviation here. To refresh, re-vendor from a newer upstream commit and update the table above.

## What it does not do

It applies ASD-STE100's *principles*, not the official approved dictionary, which ASD does not license for redistribution. Structural rules (active voice, sentence length, no phrasal verbs, no semicolons) are enforceable from the skill alone. Lexical rules are a direction of travel. Do not describe output as ASD-STE100 compliant.
