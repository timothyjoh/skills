# Writing docs pages

Every skill in `knowledge/` has a human-facing **docs page** at `docs/knowledge/<skill-name>.md`. The page is not the skill and not a copy of `SKILL.md`: it orients one reader around one skill so they know what it is, when to reach for it, and what it looks like when it is working. Non-promoted buckets (`in-progress/`, `deprecated/`) ship no docs page.

Act whenever a promoted skill is added, renamed, or has its behaviour changed: create or re-sync its docs page. A rename moves the file too.

Links inside `docs/` are repo-relative until the pages are published somewhere; switch to absolute URLs if that happens.

There is no H1. The page takes its title from the file name.

## Page structure

- `## What it does`: one or two plain paragraphs. Lead with the one-sentence job, then the defining constraint: the single fact that makes this skill behave differently from the obvious default.
- `## When to reach for it`: invocation mode (typed, or reached for by the agent) and the trigger boundary, including the sibling to use instead where one exists.
- `## Prerequisites`: only when the skill needs tooling or a workspace in place. Omit otherwise.
- One to three free-form sections in the skill's own vocabulary: the loop it runs, the artifact it produces, the one anti-pattern it kills.
- `## Common questions`: real questions, sharpest first. Sources: this repo's issues (`gh issue list --repo timothyjoh/skills --search "<skill-name>" --state all`), `CHANGELOG.md`. Keep the count honest to the evidence; omit the heading when there is nothing.
- `## It's working if`: bullets the reader can check from their own work without opening `SKILL.md`.

No install commands on a docs page; the install wording lives in [install-block.md](./install-block.md) and the README.
