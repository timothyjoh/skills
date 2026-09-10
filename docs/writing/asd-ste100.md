## What it does

`asd-ste100` rewrites English so a reader with no way to ask a clarifying question cannot misread it: an agent parsing a tool description, an error message, an inter-agent instruction, a status report. It borrows the discipline of ASD-STE100, the aerospace controlled-language standard, and applies its principles rather than its licensed dictionary. It is vendored unmodified from [danyuchn/asd-ste100-skill](https://github.com/danyuchn/asd-ste100-skill) under MIT; see the skill's `ORIGIN.md`.

## When to reach for it

Type `/asd-ste100`, or the agent reaches for it when text must be parsed without a human in the loop and misreading has a cost. It is also the rule set behind [wat](./wat.md), which points here for the full list.

Not for creative or marketing copy. STE is deliberately flat and literal.

## Two modes

**Strict** for procedures, error messages, tool descriptions and safety text: every rule, including hard sentence-length caps and one-word-one-meaning. **STE-flavored** for READMEs, PR descriptions and changelogs: the structural rules in full (active voice, short sentences, no phrasal verbs, no semicolons) with the lexical rules advisory, so prose keeps some range.

## It's working if

- Every sentence has one possible parse.
- The same thing has the same name every time it appears.
- A rewrite you asked for comes back shorter, not just plainer.
