## What it does

`chatterbox-tts` wraps a local install of ResembleAI's Chatterbox model: free, offline, and able to clone a voice from a short reference WAV. It is slower than a cloud engine and the first run downloads a few gigabytes of weights.

## When to reach for it

Type `/chatterbox-tts`, or the agent reaches for it when you ask for Chatterbox, want voice cloning, or prefer free and offline. For premium quality or a wide voice catalog, use [inworld-tts](./inworld-tts.md).

## Prerequisites

A checkout with `generate.py` and a Python 3.11 venv holding `chatterbox-tts`, pointed at by `CHATTERBOX_REPO`, and a folder of reference WAVs pointed at by `CHATTERBOX_VOICES_DIR`. Reference voices are not shipped with the skill; `--voice default` works without any, and `--ref` takes an ad-hoc WAV. `ffmpeg` for mp3 output.

## Common questions

**It errors with `'NoneType' object is not callable` on the watermarker.**
The watermarking dependency needs `pkg_resources`, which setuptools 81 and later dropped. Run `pip install "setuptools<81"` inside the venv.

## It's working if

- A `--voice default` run produces audio with no reference WAV present.
- A missing venv or WAV fails with the path it looked for, not a stack trace.
