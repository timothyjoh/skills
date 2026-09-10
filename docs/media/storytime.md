## What it does

`storytime` turns a story into a multi-voice MP3. Prose is tagged line by line with a speaker, each character is cast to an Inworld voice, and a script renders every line and stitches them with ffmpeg, with a pause between speakers. The text is tagged, never rewritten.

## When to reach for it

Say "storytime", "read this story", or "make an audio drama", or the agent reaches for it when a story with more than one voice needs rendering. For a single narrator, call [inworld-tts](./inworld-tts.md) directly.

## Prerequisites

The [inworld-tts](./inworld-tts.md) skill installed beside this one with `INWORLD_API_KEY` exported, plus `ffmpeg` and `python3`. About 8,000 characters is 10 minutes of audio and roughly four cents.

## Script, cast, render

Three files: a `.script` with one `[TAG] line` per line, a `.cast.json` mapping tags to voice names, and the MP3 the render script writes. Pacing is a single flag: `--pause 600` for bedtime, `--pause 250` for fast dialogue.

## It's working if

- The script reads as the original story with tags in front of lines, nothing reworded.
- Each character sounds like one person for the whole story.
- The MP3 arrives as one file with a natural beat between speakers.
