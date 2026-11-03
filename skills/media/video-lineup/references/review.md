# Review and judging

Read this after `measure`, before `site`. The scripts measure what numbers can show. A review reads what numbers cannot: claims against the brief, the frames, the build log. Judges then rank the whole set.

## Contents

- [Review one build](#review-one-build)
- [review.json](#reviewjson)
- [Judge the set](#judge-the-set)
- [judges.json](#judgesjson)
- [Optional notes](#optional-notes)

## Review one build

Use one reviewer per build. A subagent that has not seen the other builds is best; reviewing in turn in the main session also works. Give it the paths below and nothing else about the other builds.

Inputs for build NAME in lineup folder DIR:

- The brief: `DIR/brief/BRIEF.md`. Its numbered facts are the only allowed claims.
- Measurements: `DIR/site/assets/NAME/measure.json` (spec, loudness, shared QA lines, transcript, build-log sections).
- Pictures: `DIR/site/assets/NAME/sheet.jpg` (12 frames, evenly spaced), `poster.png`, and, if QA ran, `qa/hook_sheet.jpg` (the first 3 s) and `qa/phone_sheet.jpg`. Read the image files.
- The build log: `DIR/builds/NAME/BUILD-LOG.md`.

Steps:

1. Compare every claim in the narration transcript, and in on-screen text you can read in the frames, with the brief's facts. List each claim the facts do not support. Whisper can invent words over music with no voice; if the transcript does not match the build log's script, say so and use the build log's script.
2. From BUILD-LOG.md, list each decision the agent made in place of a human.
3. Check two factual claims in BUILD-LOG.md against the files (a check result, a duration, a file that should exist). Record whether each held. Report a log claim that does not hold as a weakness.
4. Score 1 to 5, with one short reason each: `message` (would the audience learn what the subject does), `fidelity` (only brief facts, no invented screens or claims), `visual_craft`, `motion_pacing` (from the frame sequence and QA lines), `audio` (clarity, fit, loudness), `distinctiveness` (1 = generic template look, 5 = distinctive and fit for purpose). You see frames, not motion: say where that limits a score.
5. Write `DIR/site/assets/NAME/review.json`.

## review.json

```json
{
  "name": "explainroo",
  "summary": "One or two sentences: what this build is and what stands out.",
  "claims_outside_brief": ["Narration says X; the brief has no such fact."],
  "claim_notes": ["Checked items that are not claims, for example a disclosed paraphrase."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "decisions_for_human": ["What the skill asked, and what the agent picked."],
  "log_claims_checked": ["'verify passed' held: out/verify.txt has the pass line."],
  "scores": {
    "message": { "score": 4, "reason": "..." },
    "fidelity": { "score": 5, "reason": "..." },
    "visual_craft": { "score": 3, "reason": "..." },
    "motion_pacing": { "score": 3, "reason": "..." },
    "audio": { "score": 4, "reason": "..." },
    "distinctiveness": { "score": 2, "reason": "..." }
  }
}
```

The page reads `summary`, `claims_outside_brief`, `strengths`, `weaknesses`, `decisions_for_human` and `scores`. Every key is optional; the card shows what is present. Lists are JSON lists: write `[]` when there are none.

## Judge the set

Judging is optional and needs two or more measured builds. Use two judges with different lenses, each in a fresh context, each given every build's `sheet.jpg`, `poster.png`, `measure.json`, `review.json` and the brief. A judge cannot play the videos and must say where that limits it.

Default lenses:

- **Viewer**: the brief's audience sees this in a feed. Would they understand the subject and want to try it? Weigh message, clarity, hook and fidelity most.
- **Producer**: you will reuse one of these builders for more videos. Weigh craft, motion, audio quality, spec and QA results, time to final, decisions it needed from a human, and how generic or distinctive it looks.

Each judge ranks every build (unique ranks), gives a 1 to 10 score and a one or two sentence reason that cites what it saw, and adds short notes on patterns across the set. Each judge returns its one object; you write both into `site/judges.json`, so neither judge overwrites the other.

## judges.json

Write `DIR/site/judges.json` as a list, one object per judge:

```json
[
  {
    "lens": "Viewer",
    "ranking": [
      { "name": "video-director", "rank": 1, "score": 8, "reason": "..." },
      { "name": "explainroo", "rank": 2, "score": 8, "reason": "..." }
    ],
    "notes": "Patterns across the set."
  }
]
```

## Optional notes

An HTML fragment in `DIR/site/notes.html` appears on the page above the cards. Use it for a short recommendation, for example which builder suits which job, with links to cards as `#NAME`.
