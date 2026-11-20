# Script and beats

The script drives everything: the voice, the word timings every event keys to, the captions, and the shot list (one shot per line by default).

## Length

| Format | Words | Spoken | Lines |
|---|---|---|---|
| Short (default) | 40 to 55 | under 20 s | 5 or 6 |
| Medium | 90 to 130 | 35 to 50 s | 8 to 12 |
| Long | about 150 per minute | as asked | one line per 3 to 5 s |

Kokoro reads at roughly 150 words a minute at `speed: 1.0`. Longer films take longer to build and render; start short unless the user asks for more.

## Writing it

1. Find the one surprising fact or question. The hook states it in the first line, with a number if there is one.
2. Build toward it with evidence, then turn: most explainers here use a claim, the evidence for it, and a reversal ("Case closed? Not quite.") before a payoff question or result. Other shapes that work: a "what if" journey that escalates, how-it-works in steps, a list where each item lands on its word, a history story with one twist.
3. One idea per line. Short lines read better as captions and give cleaner cuts.
4. Fact-check every claim on the web before narrating. Keep the sources (title and URL) and report them with the film. Rewrite or cut a claim you cannot confirm, and say so.

## script.json

```json
{
  "voice": "af_heart",
  "speed": 1.0,
  "gap": 0.25,
  "captionWords": 3,
  "lines": [
    { "say": "About twenty million men may descend from one man.", "show": "About 20 million men may descend from one man." },
    { "say": "Case closed?", "show": "Case closed?", "pause": 0.4 },
    { "say": "Not quite.", "show": "Not quite." }
  ]
}
```

- `say` is what the voice reads: write numbers, symbols and abbreviations as words ("twenty million", "per cent", "D N A" if it should be spelled out).
- `show` is what the captions print: digits and symbols ("20 million", "%", "DNA"). Keep the same words in the same order otherwise; captions map shown words onto spoken word times by position within the line.
- `pause` after a line overrides `gap` (seconds of silence before the next line). Use it before a reversal.
- Voices: `af_heart` (default), `af_bella`, `af_nicole`, `af_sarah`, `af_sky`, `am_michael`, `am_adam`, `am_fenrir`, `am_puck`, `bf_emma`, `bf_isabella`, `bm_george`, `bm_lewis`, `bm_fable`. The first letter is the accent (a American, b British), the second the voice (f, m). A calm storyteller: `bm_george` or `af_heart`; an energetic explainer: `am_puck` or `af_bella`.

Then run `node tools/narrate.mjs` in the project. It writes the narration, `beats.json`, `words.json`, `captions.json`, and sets the film's length. Check its summary: `timing` should say `whisper base.en`. If it says `estimate`, word times are guessed from text length; events will be close but not exact, so check stills at the key words.

## Silent films

For a style piece with no voice, give each line a `seconds` value (what happens in that shot) and run `node tools/narrate.mjs --silent`. There are no words or captions; key events to `beatRange(i)`.

## From script to shots

For each line, decide before writing any scene code:

- the shot: what is on screen, where the camera is, how it moves
- the event that lands on a named word (`at("twelve", { beat: 1 })`): a pop, a count, a light turning on, a cut
- the explainer device it uses (hook number, crowd, evidence card, map, comparison, reversal, payoff)
- the transition into the next line, in this style's vocabulary
- the sound on that word

Write this as a short shot list in the project (`shots.md`) and build every style from the same list, so a comparison shows the styles, not different stories.
