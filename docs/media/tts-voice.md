## What it does

`tts-voice` turns text into speech on your own machine, free and offline, and can clone a voice from a short reference recording. Under the hood it runs ResembleAI's Chatterbox model from a local install. A voice is nothing more than a WAV file in a folder: add `alice.wav` and `--voice alice` exists.

## When to reach for it

Type `/tts-voice`, or the agent reaches for it when you want narration audio, a character voice, or text read aloud. [storytime](./storytime.md) and [browser-tour](./browser-tour.md) both use it.

## Prerequisites

A checkout with `generate.py` and a Python 3.11 venv holding `chatterbox-tts`, pointed at by `CHATTERBOX_REPO`, and a folder of reference WAVs pointed at by `CHATTERBOX_VOICES_DIR`. Reference voices are not shipped; `--voice default` works with none present, and `--ref` takes an ad-hoc WAV. `ffmpeg` for mp3 output. The first run downloads a few gigabytes of model weights.

## Common questions

**It errors with `'NoneType' object is not callable` on the watermarker.**
The watermarking dependency needs `pkg_resources`, which setuptools 81 and later dropped. Run `pip install "setuptools<81"` inside the venv.

**Why is it slow?**
Synthesis runs on CPU by default. Pass `--mps` on Apple Silicon, and keep each call to a few sentences.

## It's working if

- `--list-voices` shows `default` plus one entry per WAV in your voices folder.
- A `--voice default` run produces audio with no reference WAV present.
- A missing venv or WAV fails with the path it looked for, not a stack trace.
