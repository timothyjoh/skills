## What it does

`cook` runs the Cook Loop for ambitious visual builds that have to hold up next to reference images, screens or videos: one intake with every question asked up front, then a long autonomous loop of build, render stills, compare side by side, score with zero-context critics, and fix the weakest part, against a numeric bar per dimension. It is made for runs of many hours or days while you are away. It is vendored unmodified from [Leonxlnx/cook](https://github.com/Leonxlnx/cook) by Leon Lin under MIT; see the skill's `ORIGIN.md`.

The defining constraint: after intake it never asks another question. It decides, logs the decision, and keeps working, but it never starts the final render until you approve the stills.

## When to reach for it

Type `/cook`, or the agent reaches for it when you say "go cook", "let it cook", "iterate until it matches", "match the references 99%", or attach reference images and ask for a recreation in code. For a short motion graphic in a ready-made look, use [threejs-3d-styles](./threejs-3d-styles.md) instead, or as the starting point that cook then pushes to the bar.

## Prerequisites

Node 18 or newer and `ffmpeg` for the side-by-side script. The color check uses Python with Pillow and NumPy. Subagents make the critics independent; without them, scores are marked self-scored.

## The run folder

All run state lives in `cook/` at the project root: `BRIEF.md` (target, bar, rules, time, permissions), `SHOTS.md` (one camera preset per reference), `ROUNDS.md` (the ledger), the numbered references, and the stills and side-by-side images per round. The agent resumes from these files after a context reset, and another agent can take the run over from them alone.

## It's working if

- You get one message of numbered questions with defaults, and none after it.
- A progress note with stills, scores and the next focus arrives after every round without the run pausing.
- Every number in `cook/ROUNDS.md` is labelled measured or eyeballed, and the agent's own score never decides a stop.
- The final render starts only after you approve the stills in chat.
