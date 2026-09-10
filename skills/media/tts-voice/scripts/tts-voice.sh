#!/usr/bin/env bash
set -euo pipefail

# tts-voice.sh
# Local text-to-speech with zero-shot voice cloning, using the chatterbox-tts
# pip package (ResembleAI Chatterbox) in a local venv. A "voice" is any WAV in
# the voices directory: --voice NAME resolves to $CHATTERBOX_VOICES_DIR/NAME.wav
# (or NAME-supercut.wav). --voice default uses the model's built-in voice.

usage() {
  cat <<'USAGE'
Usage:
  tts-voice.sh "text" [--voice NAME|default] [--ref <wav>] [--format mp3|wav] [--cpu|--mps] [-o <path>]
  tts-voice.sh --list-voices

Defaults:
  --voice default
  --format mp3
  --cpu

Environment:
  CHATTERBOX_REPO        checkout holding generate.py and a .venv with chatterbox-tts
                         (default: ~/wrk/opc/resemble-ai-chatterbox)
  CHATTERBOX_VOICES_DIR  directory of reference WAVs, one per voice
                         (default: ~/wrk/tts-voice-samples/_supercuts)

Notes:
  - First run downloads model weights from Hugging Face (one time, a few GB).
  - --mps uses Apple Silicon GPU acceleration; --cpu is the safe default.
USAGE
}

REPO="${CHATTERBOX_REPO:-$HOME/wrk/opc/resemble-ai-chatterbox}"
VENV_PY="$REPO/.venv/bin/python"
VOICES_DIR="${CHATTERBOX_VOICES_DIR:-$HOME/wrk/tts-voice-samples/_supercuts}"

if [[ $# -lt 1 ]]; then usage; exit 1; fi
case "${1:-}" in
  -h|--help) usage; exit 0 ;;
  --list-voices)
    echo "default"
    if [[ -d "$VOICES_DIR" ]]; then
      for f in "$VOICES_DIR"/*.wav; do
        [[ -e "$f" ]] || continue
        n="$(basename "$f" .wav)"; echo "${n%-supercut}"
      done | sort -u
    else
      echo "(voices dir not found: $VOICES_DIR)" >&2
    fi
    exit 0 ;;
esac

TEXT="$1"; shift
VOICE="default"; REF=""; FORMAT="mp3"; DEVICE="cpu"; OUTPUT=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --voice) VOICE="$2"; shift 2 ;;
    --ref) REF="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --cpu) DEVICE="cpu"; shift ;;
    --mps) DEVICE="mps"; shift ;;
    -o|--output) OUTPUT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage; exit 2 ;;
  esac
done

if [[ ! -x "$VENV_PY" ]]; then
  echo "Missing venv: $VENV_PY" >&2
  echo "Expected chatterbox-tts installed in a venv at: $REPO/.venv (override with CHATTERBOX_REPO)" >&2
  exit 3
fi

# Resolve --voice NAME to a reference WAV unless --ref was given explicitly.
if [[ -z "$REF" && "$VOICE" != "default" ]]; then
  for cand in "$VOICES_DIR/$VOICE.wav" "$VOICES_DIR/$VOICE-supercut.wav"; do
    if [[ -f "$cand" ]]; then REF="$cand"; break; fi
  done
  if [[ -z "$REF" ]]; then
    echo "Unknown voice: $VOICE (no $VOICE.wav in $VOICES_DIR; run --list-voices)" >&2
    exit 4
  fi
fi
if [[ -n "$REF" && ! -f "$REF" ]]; then
  echo "Ref wav not found: $REF" >&2
  exit 6
fi

TS=$(date +%Y%m%d-%H%M%S)
WAV_OUT="/tmp/tts-voice-${VOICE}-${TS}.wav"
args=("$REPO/generate.py" "$TEXT" "--device" "$DEVICE" "--out" "$WAV_OUT")
[[ -n "$REF" ]] && args+=("--ref" "$REF")
"$VENV_PY" "${args[@]}" >/dev/null

case "$FORMAT" in
  wav)
    if [[ -n "$OUTPUT" ]]; then mv "$WAV_OUT" "$OUTPUT"; echo "$OUTPUT"; else echo "$WAV_OUT"; fi ;;
  mp3)
    MP3_OUT="${OUTPUT:-${WAV_OUT%.wav}.mp3}"
    ffmpeg -y -loglevel error -i "$WAV_OUT" "$MP3_OUT"
    rm -f "$WAV_OUT"
    echo "$MP3_OUT" ;;
  *) echo "Unknown format: $FORMAT (mp3|wav)" >&2; exit 5 ;;
esac
