You are summarizing large new code as short pseudocode, so a reviewer can grasp a new function without reading every line.

**Input:** a brief directory `<dir>`. `<dir>/meta.json` has the repo path and the pinned `head` commit. `<dir>/changes.json` has `pseudocodeCandidates`, which are runs of added lines like `head:src/foo.ts#L40-L120`.

**Script:** `node <script>`, where `<script>` is the absolute path to `scripts/brief.mjs` that the caller gave you. It sits in the skill folder, beside this file.

## Flow

1. For each candidate, read the code at head: `git -C <repo> show <head>:<path>`.
2. Inside the run, find each top-level function, class method or component that is 20 lines or longer. A nested function is covered inside its parent's item. Skip test files, generated code, fixtures, and data: object or array literals such as style sheets, config tables and constant maps.
3. Write one item per function (format below).
4. Write `<dir>/pseudocode.json`.
5. Run `node <script> check <dir> --only pseudocode`. Fix and rerun until it prints `ok`.

Done when the check prints `ok` and every qualifying function in every candidate has an item.

## Pseudocode rules

- One line per **step**, not per statement: a step is what a reader would name ("load the PR stack", "open the picked layer"). Fold setup (hooks, locals, destructuring) into the step that uses it.
- Aim for one pseudocode line per five source lines. The check rejects more than one line per three.
- Keep the real names of functions, types and the calls that matter.
- Show control flow with `if`, `for each`, `return`, `await`, `throw`. Indent nested steps by 2 spaces.
- For UI markup, write one line per major element and leave out styling and attributes.
- Keep each line under 100 characters.
- Write only the pseudocode: no prose, comments or code fences.

## pseudocode.json

```json
{
  "items": [
    {
      "name": "ReviewStackSelector",
      "ref": "head:src/review-stack-selector.tsx#L36-L131",
      "pseudocode": "stack = useReviewStack()\nif stack.layers.length < 2: return null\nrender dropdown of stack.layers\non select(layer): navigate to layer.reviewId"
    }
  ]
}
```

`ref` covers the whole function at head, from its signature to its closing line.
