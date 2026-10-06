You are grouping the changed files of one code change so a staff engineer can read it in one pass, group by group.

**Input:** a brief directory `<dir>`. `<dir>/meta.json` has the repo path and the pinned `base` and `head` commits. `<dir>/changes.json` lists every changed file with its status and line counts.

**Script:** `node <script>`, where `<script>` is the absolute path to `scripts/brief.mjs` that the caller gave you. It sits in the skill folder, beside this file.

## Flow

1. Read `changes.json` for the overview. Read a file's patch (`git -C <repo> diff <base> <head> -- <path>`) only when its contents decide its group.
2. Set aside non-implementation files first, one group per kind: all tests together, all docs together, and so on for config and build, generated files and lockfiles, fixtures and snapshots, pure renames, and formatting-only changes.
3. Split the remaining implementation files by the part of the design each one serves (the data model, an API, a UI surface, a background job). Order the groups so each one only depends on groups before it: contracts and data model first, then the code behind them, then the surfaces that call it. Inside a group, list files in the same order, starting with the entry point. Keep each group small enough to read in one sitting. Keep a file whole unless it holds two unrelated changes, and even then pick the group of its main change.
4. Look for **moves**. A block deleted from one file and a similar block added to another (similar line counts, similar names) is a move. Put both files in the same group and name the move in the summary. A move between test files stays in the tests group.
5. Write `<dir>/groups.json`. Call the Skill tool with `asd-ste100` in **STE-flavored** mode on the group titles and summaries. If the harness has no Skill tool, read the installed skill's `SKILL.md` and follow it. Preserve facts, conditions, uncertainty, code identifiers and link targets. Keep the JSON structure and file paths unchanged. Use no em dashes.
6. Run `node <script> check <dir> --only groups`. Fix and rerun until it prints `ok`.

Done when the check prints `ok`: every changed file sits in exactly one group.

## groups.json

```json
{
  "groups": [
    {
      "title": "Lazy ELK loading",
      "kind": "implementation",
      "summary": "ELK now loads on the first layout through [`loadElk`](head:src/elk.ts#L6-L12) instead of at import, which halves the initial bundle.",
      "files": ["src/elk.ts", "src/flow-graph.tsx"]
    }
  ]
}
```

- `kind` is one of: `implementation`, `tests`, `docs`, `config`, `generated`, `fixtures`, `renames`, `formatting`, `other`.
- Order: implementation groups in reading order, then the rest.
- `files` are head paths. A deleted file uses its base path.
- `summary` is markdown for a staff engineer: 1 to 3 short sentences on what the group changes and why it matters. One sentence is enough for a non-implementation group. You may link code as `[label](head:path#L10-L24)`, `#L10` for one line, or `base:` for old code. Write a space in a link path as `%20`. The check verifies each link against the pinned commits.
- The renderer adds each group's file table and diffr command, so leave them out of the summary.
