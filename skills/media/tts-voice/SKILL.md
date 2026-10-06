---
name: tts-voice
description: Local text-to-speech with zero-shot voice cloning from a reference WAV, or the model's default voice. Free, fully offline, no API key (ResembleAI Chatterbox under the hood). Use when the user wants speech from text, a character or cloned voice, narration audio, or offline TTS.
metadata:
  hermes:
    tags: [tts, audio, voice, local, voice-cloning]
    related_skills: [storytime, browser-tour]
---

# TTS Voice (local, Chatterbox)

Text in, MP3 or WAV out, on your own machine. A **voice** is any WAV file in a voices directory: drop `alice.wav` in and `--voice alice` clones it. `--voice default` uses the model's built-in voice and needs no reference at all.

## Setup

| What | Default | Override |
|---|---|---|
| A checkout with a `generate.py` and a Python 3.11 venv holding the `chatterbox-tts` pip package (the package needs an older Python than a current default) | `~/wrk/opc/resemble-ai-chatterbox` | `CHATTERBOX_REPO` |
| A directory of reference WAVs, one per voice (`NAME.wav`, or `NAME-supercut.wav`) | `~/wrk/tts-voice-samples/_supercuts` | `CHATTERBOX_VOICES_DIR` |

Reference WAVs are not shipped with this skill. A 10 to 30 second clean recording of one speaker is enough. `ffmpeg` is needed for mp3 output; `ffprobe` checks duration for either output format. Both are supplied by the ffmpeg package.

Before synthesis, resolve `scripts/tts-voice.sh` from this skill folder. Check that `$CHATTERBOX_REPO/.venv/bin/python` is executable and `$CHATTERBOX_REPO/generate.py` exists, using the default checkout path when the variable is unset. The adapter must accept text plus `--device`, `--out`, and optional `--ref`; an upstream checkout alone does not prove this local adapter is present. If missing, report the exact path and required interface.

For an existing adapter checkout without its environment, create a Python 3.11 venv there (`python3.11 -m venv "$CHATTERBOX_REPO/.venv"`), then install `chatterbox-tts` with that venv's Python (`"$CHATTERBOX_REPO/.venv/bin/python" -m pip install chatterbox-tts). Set `CHATTERBOX_REPO` to the chosen absolute path first. Check `ffmpeg -version` for MP3 output; on macOS, `brew install ffmpeg python@3.11` supplies the system tools when missing. Reuse a working environment rather than reinstalling it.

## Quick start

```bash
scripts/tts-voice.sh --list-voices                     # default + every WAV in the voices dir
scripts/tts-voice.sh "Hello"                           # mp3, cpu, default voice
scripts/tts-voice.sh "Hello" --voice glados            # clone from glados.wav
scripts/tts-voice.sh "Hello" --ref /path/ref.wav       # ad-hoc cloning
scripts/tts-voice.sh "Hello" --format wav              # wav only
scripts/tts-voice.sh "Hello" --mps                     # Apple Silicon GPU, faster
scripts/tts-voice.sh "Hello" -o /tmp/out.mp3           # explicit output path
```

The script prints the output path on success. Confirm the file exists, has a positive duration with `ffprobe`, and, when playback is available, contains the final requested sentence. For a truncated clip, split the text into shorter calls and recheck each output. For a setup failure, correct the named dependency before retrying. After two unsuccessful repairs, report the error and preserve the input. State when playback could not be checked.

## Notes

- The first generation downloads model weights from Hugging Face if they are not cached (a few GB), so expect a longer first run.
- `--cpu` is the safe default; `--mps` uses Apple Silicon GPU acceleration and is faster once weights are cached, at the cost of higher memory pressure.
- Keep each call to a few sentences. Long inputs are slow and more likely to be cut off; split and stitch instead (see `storytime`).
- No fallback is wired up: a missing venv or reference WAV fails with the path it looked for, rather than silently degrading.
- **Known gotcha**: the watermarking dependency (`resemble-perth`) needs `pkg_resources`, which recent `setuptools` (81+) no longer ships. If you see `TypeError: 'NoneType' object is not callable` on `PerthImplicitWatermarker()`, run `pip install "setuptools<81"` inside the venv.
