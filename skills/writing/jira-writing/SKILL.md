---
name: jira-writing
description: "Write or rewrite a Jira card body for a Bug, Story or Task. Use when drafting a new Jira ticket, rewriting an existing card, or turning a finding, bug report, investigation or plan into a ticket."
---

# Jira card writing

A card has two readers with different jobs. A developer needs to know what to change and why. A QA tester needs to know how to see the problem and how to prove it is gone. Serve them in that order, in separate sections, and never mix the two.

The full rule set is in [references/rules.md](./references/rules.md). The templates are [references/bug.md](./references/bug.md), [references/story.md](./references/story.md) and [references/task.md](./references/task.md). Read the rules once per session. Read the one template that matches the card type.

## Budget

- Developer half: one screen. Summary of 3 lines plus fix bullets. Evidence section of 150 words or less plus one visual. Fix section of 120 words or less plus an alternatives table.
- QA half: numbered steps of 20 words or less each. One acceptance criteria line per behaviour.
- One visual for the whole card. Under 20 lines. Put it in the evidence section.
- Only the headings that apply. Delete the Contract section when no shape changes. Delete Risk when there is none. An empty heading is noise.

If a fact is visible in the code, leave it out. Name the path and symbol and let the developer read it. Say each fact once. The only allowed repetition is the Summary fix bullets, which the fix section restates in full.

## Step 1: pick the type

| The work is | Template |
|---|---|
| Something is broken and you can name the defect | `references/bug.md` |
| New or changed behaviour a user or system can see | `references/story.md` |
| A chore, spike, migration or infra change with no QA pass | `references/task.md` |

A task that needs Steps to Test is a story or a bug. Switch templates rather than bolting a test section on.

## Step 2: settle the claims

Decide what you are asserting before you write a word. Write each claim flat: "The endpoint has no tenant check", not "appears to have". Where a claim is inference and acting on it wrongly costs real time, tag it once: `(inferred from code, not reproduced)`. Uniform hedging destroys the signal it tries to send.

Do not invent a cause, a frequency or a mechanism nobody verified.

## Step 3: the visual

Call the Skill tool with `show-me` and pick the smallest shape that shows the defect or the change. Two overrides for Jira:

- Use ```text and ```diff fences only. Mermaid and HTML render as raw text in Jira.
- Keep the shape to the calls, files or states the card touches. Cut the rest.

| The card is about | Show |
|---|---|
| A missing check on one path | Call tree, marked where the check is absent and where a sibling path has it |
| A shape another system reads | Typed block in the Contract section, not a diagram |
| An order or timing defect | Sequence sketch in ```text |
| A list that gains or loses items | `diff` of the list |
| Files that move or split | Shallow file tree `diff` |

Put the visual after one sentence of setup: inside Root Cause on a bug, Current or Desired Behaviour on a story, Context on a task.

## Step 4: the prose

Write the body, then call the Skill tool with `asd-ste100` in STE-flavored mode on it. Call the skill. Do not approximate it from memory. STE-flavored keeps the structural rules and drops the one-word-one-meaning lockdown:

- One instruction or one fact per sentence. Steps of 20 words or less, prose of 25 or less.
- Active voice, present tense. "The job imports the catalogue", not "the catalogue is imported".
- No semicolons. Split the sentence.
- No phrasal verbs. "Start the job", not "spin up the job".
- Noun clusters of three words or less.
- No marketing adjectives. Nothing in a card is seamless or robust.
- Numbered lists for any sequence of three or more steps.
- Say the term in full the first time. Then use the same short form every time.

The skill preserves hedges when it rewrites. That is why Step 2 comes first.

## Step 5: the alternatives

Before finalising a bug or story, spawn one subagent with the same evidence and ask for two or three other fix paths, each with its trade-off. Put them in the Alternatives table and name the recommended one. Skip this on a task with one obvious path.

## Step 6: the cross-check

Walk these pairs against each other before publishing:

1. Every Desired Behaviour bullet on a story resolves to an acceptance criteria line or an Out of scope line. Nothing appears in one and vanishes from the other.
2. Every Contract block has an acceptance criteria line or Done-when line that tests the shape.
3. Every Steps to Replicate section that nobody ran carries `(derived from code, needs validation)`.
4. Every code reference is path and symbol. No line numbers.
5. The Reference section pins repo, branch, commit and date.
6. The fix section heading reads "Suggested Fix from Claude" on a bug, "Suggested Approach from Claude" on a story or task.

## Publish

Write the body to a file first, so backticks survive.

Through the Atlassian MCP tools, pass `contentFormat: "markdown"` and the file contents as `description`. Set project-specific fields in one `additional_fields` object. Field IDs, sprint IDs, estimate scales and post-create transitions are project conventions, not part of this skill. Look them up in the project's docs or memory before the call. Do not guess them.

```text
createJiraIssue  cloudId, projectKey, issueTypeName, summary,
                 description: <file>, contentFormat: "markdown",
                 additional_fields: { labels, customfield_* }
editJiraIssue    cloudId, issueIdOrKey, contentFormat: "markdown",
                 fields: { description: <file> }
```

Read the card back with `getJiraIssue` and confirm the fences and the table survived. If a fence collapsed, switch that block to plain indented text and edit again.

## Example: a bug card Summary and Root Cause

````markdown
## Summary

`TenantSettings.CanExport` has no consumer in the repo. Only `CanSearch` is read. So disabling a tenant stops search and nothing else. The nightly export keeps sending the closed tenant's data.

**Fix**

- Gate `ExportJob.Run()` on `TenantSettings.CanExport`.
- Gate `ExportController.Download()` on the same flag.

## Root Cause

Search reads the flag at one choke point. Export never reads it.

```text
TenantSettings
  CanSearch  → SearchProvider.AppliesTo()    reads it
  CanExport  → ExportJob.Run()               never reads it  ←
             → ExportController.Download()   never reads it  ←
```
````
