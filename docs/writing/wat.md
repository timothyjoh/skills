## What it does

`wat` re-explains the agent's own last output so a reader who did not follow it the first time can. The subject is the last answer, not the topic and not the original question. Every conclusion, number and caveat is kept; only the form changes: a picture first, the real names glossed beside it, aiming for half the length, plain words, no analogies.

## When to reach for it

Type `wat` on its own, or ask for ELI5, or say you are lost; the agent reaches for it on any of those. `huh` is the same skill under a second trigger word.

Reach for it when an answer did not land. For a picture of a topic you are still exploring, use [show-me](./show-me.md) instead.

## Picture first, then plain words

The answer opens with the smallest picture that carries the point: a glossed call tree, pseudocode in spoken words, a shallow file tree, a `diff`, a numbered order of events, or a glossary table for a term with no physical form. The words after it are short sentences in the active voice, one idea each, with each technical term defined where it first appears. Phrasal verbs, metaphors, hedges and filler are cut. Facts are stated flat; uncertainty is stated flat too, in its own sentence.

## Common questions

**Does it change the answer?**
No. If re-reading the last output turns up a real error, the skill says so in one sentence and gives the correction. It never quietly revises.

**Why no analogies?**
An analogy asks the reader to hold two subjects at once and fails silently where they stop matching. The skill says what a thing does instead of what it is like.

## Check the meaning

The agent applies the ASD-STE100 skill in STE-flavored mode, then compares the rewrite with the previous answer. Missing facts and caveats are restored before delivery. The half-length target yields when more words are needed to preserve meaning; headings and paragraph counts depend on the explanation.

## It's working if

- The re-explanation opens with a picture and is shorter without losing a conclusion, condition, number, or caveat.
- Every technical term is defined in the sentence beside it.
- You can find each conclusion from the first answer in the second.
