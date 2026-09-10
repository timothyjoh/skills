---
name: chatterbox-tts
description: Run local Chatterbox TTS (ResembleAI) with zero-shot voice cloning from reference WAVs or the model's default voice. Free, fully local, no API cost. Use when explicitly asked for Chatterbox, testing voice cloning, character voices, or when free/offline TTS is preferred. Slower than cloud TTS; for premium quality or a wider voice catalog, use inworld-tts instead.
metadata:
  hermes:
    tags: [tts, audio, voice, local, voice-cloning]
    related_skills: [inworld-tts]
---

# Chatterbox TTS (local)

A wrapper around a local install of the `chatterbox-tts` pip package, with zero-shot voice cloning from reference WAVs.

## Setup

The wrapper expects two things on this machine, both overridable:

| What | Default | Override |
|---|---|---|
| A checkout with a `generate.py` and a venv holding `chatterbox-tts` (Python 3.11; the package needs an older Python than a current default) | `~/wrk/opc/resemble-ai-chatterbox` | `CHATTERBOX_REPO` |
| Reference WAVs for the named voices (`cave-supercut.wav`, `glados-supercut.wav`, `wheatley-supercut.wav`, `donna-paulsen.wav`) | `~/wrk/tts-voice-samples/_supercuts` | `CHATTERBOX_VOICES_DIR` |

Reference WAVs are not shipped with this skill. Without them, use `--voice default` or pass your own with `--ref`. `ffmpeg` is needed for mp3 output.

## Quick start

```bash
scripts/chatterbox-tts.sh "Hello"                        # mp3, cpu, default voice
scripts/chatterbox-tts.sh "Hello" --voice glados         # mp3, cpu
scripts/chatterbox-tts.sh "Hello" --format wav           # wav only
scripts/chatterbox-tts.sh "Hello" --ref /path/ref.wav    # ad-hoc cloning
scripts/chatterbox-tts.sh "Hello" --mps                  # Apple Silicon GPU, faster
scripts/chatterbox-tts.sh "Hello" -o /tmp/out.mp3        # explicit output path
```

Voices: `cave`, `glados`, `wheatley`, `donna` (or `donna-paulsen`), `default` (no cloning; the model's built-in voice).

## Notes

- First generation per session downloads model weights from Hugging Face (one time, a few GB), so expect a longer first run.
- `--cpu` is the safe default; `--mps` uses Apple Silicon GPU acceleration and is faster once weights are cached, at the cost of higher memory pressure.
- No fallback is wired up: if the venv or a reference WAV is missing, the script errors with what is missing rather than silently degrading.
- **Known gotcha**: the watermarking dependency (`resemble-perth`) needs `pkg_resources`, which recent `setuptools` (81+) no longer ships. If you see `TypeError: 'NoneType' object is not callable` on `PerthImplicitWatermarker()`, run `pip install "setuptools<81"` inside the venv.
