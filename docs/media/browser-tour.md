## What it does

`browser-tour` drives Chrome through a narrated tour, one real page per stop, and then stops and waits for you before moving on. That pause is the whole design: it is a chat turn, not a click, so you can question, react, or redirect mid-tour. Narration is grounded in what is actually loaded on the page, never in memory.

## When to reach for it

Ask to be walked through, shown around, or given a tour, or the agent reaches for it when a narrated walkthrough in the browser fits. Four modes: a research tour across sources, a product wizard through a live app, a plan narration against today's UI before code is written, and a demo of what changed after the work is done.

## Prerequisites

The Claude-in-Chrome extension and its MCP tools. Audio narration is optional and uses [tts-voice](./tts-voice.md) installed beside this skill.

## Never preview the next stop

Every stop ends on its own content, or with an offer to go deeper on it. The next stop is a surprise. In plan and demo modes the spoken narration is written separately from the on-screen text, printed verbatim before it is synthesized, and played back blocking so the pause follows the audio.

## Checks at each stop

The agent checks that the loaded page supports the narration before speaking. A failed load or missing feature leads to corrected navigation or a reported gap. The tour still pauses for your next message after each stop.

Audio uses the sibling `tts-voice` script, or the path in `BROWSER_TOUR_TTS`. Missing audio dependencies need only block narration audio. Playback uses the host's player; `afplay` is the macOS option.

## It's working if

- Each turn shows one page and ends with the agent waiting.
- You can interrupt with a question and the tour picks up where it was.
- Nothing on a live app gets submitted, bought, or changed.
