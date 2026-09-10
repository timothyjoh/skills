---
name: wat
description: "\"wat\" - re-explain the previous answer with one picture and plain words. Use whenever the user says \"wat\" on its own, and when they ask for ELI5, say they are lost, or want the plain-English version of what was just said."
---

**"wat" means: say that again, so I get it.**

The subject is your own last output. It is not the topic in general. It is not the
original question. It is the answer you just gave, explained a second time in a way
the reader can follow.

Write literally. No analogies, no metaphors, no phrasal verbs, no em dashes. The
`asd-ste100` skill holds the full rule set.

## Same answer, explained again

Keep every conclusion, number and caveat from the last output. Change only the form.

The reader already read it once. The same explanation in the same shape will fail a
second time. Change the form:

- Start with a picture the last output did not have.
- Name each technical term and define it in the same place.
- Cut the last output's length by half or more. If it was six paragraphs, this is three.
- Remove the supporting detail and keep the main structure. The reader wants the
  structure, not the evidence.

Re-read your last output before writing. If you find a real error in it, say so in one
flat sentence and give the corrected version. A re-explanation is not a chance to
quietly change the answer.

When the last output was already short and plain, name the part that probably blocked
the reader and explain that one part again.

## Picture first

Start with the smallest picture that carries the point. Put the words after it. A
words-first answer makes a lost reader wait.

Keep the real names in the picture. A plain-words note beside each name does the
teaching:

```text
submitForm              <- the user clicks Save
  createSession         <- reserve a place to store this run
    persistPrompt       <- save the text the user typed
    launchAgent         <- start the worker process
  navigateToSession     <- open the session page
```

The gloss is the part that teaches. Without it, the diagram is readable only by its
author.

### Pick the shape

| The thing is | Draw |
|---|---|
| What calls what | Call tree, glossed |
| A rule or a decision | Pseudocode |
| Where code lives | Shallow file tree |
| What changed | `diff` |
| Who sends what to whom, in what order | Text sequence |
| Two things side by side | Small table |
| A term with no physical form | Glossary table: the term, then what it does |

**Rules and decisions** are pseudocode, in words a person would say:

```text
when the user saves
  if nothing changed
    return the old copy
  write the new copy
  return the new copy
```

**Where code lives** is a shallow file tree, glossed:

```text
src/
├── commands/    # reads what the user typed
├── sessions/    # records who is doing what
└── transport/   # sends requests to the server
```

**What changed** is a `diff`, matched to the shape of the thing:

```diff
 when the user saves
-  write the copy
+  if nothing changed
+    return the old copy
+  write the new copy
```

**Order of events** is a numbered list. Use plain text instead of Mermaid in a
terminal, because a terminal renders Mermaid as raw text:

```text
1. the user clicks Save
2. the page sends the text to the server
3. the server writes the text to the database
4. the server returns a success response
5. the page shows the new content
```

Use Mermaid only when the output is an Artifact, where it renders.

**A term with no physical form** gets a glossary table. Name the term, then say what it
does:

```text
the term              what it does
--------------------  ------------------------------------------
session cookie        identifies your browser to the server
auth check            confirms the cookie is valid and current
admin key             grants access to every account
```

Say what the thing does. Do not describe it as some other thing. An analogy asks the
reader to hold two subjects at once, and it fails silently at the point where the two
stop matching.

Use one name for each thing and keep that name to the end. Switching between "session",
"run" and "job" for one thing loses the reader for good.

For a layout, a screen, or something too dense for text, write one focused HTML file
and open it:

```
Bash(open path/to/wat-{topic}.html)
```

## Plain words

- Write short sentences. One idea in each sentence.
- Use words a person says out loud. "uses" not "leverages". "so" not "therefore".
  "later" not "subsequently".
- Say who does what. "The server checks your password", not "authentication is
  performed".
- Use no phrasal verbs. Use one plain verb: start not spin up, remove not take off,
  return not hand back, save not write down, contact not reach out, read not dive into.
  A two-word verb carries meanings its parts do not predict.
- Use no em dashes. Use a period. Use a colon when the second half defines the first.
  An em dash usually joins two sentences that should be separate.
- Give the real term, then define it in the next sentence: "The server returns a JWT. A
  JWT is a signed token that proves who you are."
- Name the real thing. Write "the session record", not "the state".
- Use present tense and active voice.

Plain does not mean small. The reader is smart and busy, not a child. Skip "little
buddy" and skip the exclamation marks.

## State facts directly

State the fact:

> This deletes every row in the table.

Do not write:

> This could potentially end up removing a fairly large number of rows.

**Use numbers, not adjectives.** "204 tests pass" carries more than "tests look good".

**Keep a hedge only when the uncertainty is real.** When you know the fact, state it.
When you do not know it, say that in its own sentence, in the same flat voice, and name
what is missing:

> I don't know what that setting is in production. I cannot read it from here.

Never spread doubt across a claim you are sure of. "This might possibly delete some
rows" is worse than "This deletes every row" and worse than "I don't know how many rows
this deletes". Both of those are true statements. The hedged version is neither.

Simplify the sentence, never the substance. A short wrong sentence is worse than a long
right one. When a detail carries real risk, keep it and say it in small words. Real risk
means money, data loss, a deploy step, or anything the reader will act on.

### Words to cut

- Throat-clearing: "It's worth noting", "As we can see", "Let me explain", "Great
  question"
- Filler adverbs: "basically", "essentially", "actually", "simply", "just"
- Hedging: "might possibly", "arguably", "somewhat", "to some extent", "I think maybe"
- Wrap-up: "I hope this helps", "Let me know if you have questions"
- Apologies for things that need no apology

The out-loud test: read the sentence aloud. Remove anything you would not say to a
colleague at a table. This test chooses vocabulary only. It does not permit phrasal
verbs, idioms, or metaphors.

## Shape of the answer

1. One line saying what the thing is.
2. The picture.
3. Two to four short paragraphs, each with its own small heading, walking the picture.
4. One line on what it means for the reader.

Stop there. A reader who now understands the answer does not want ten more paragraphs.

Write no preamble about re-explaining. Skip "Let me put that another way" and start on
line 1.
