#!/usr/bin/env bash
set -euo pipefail

# chatterbox-tts.sh
# Wrapper around a local venv install of the chatterbox-tts pip package
# (~/wrk/opc/resemble-ai-chatterbox). Supports zero-shot voice cloning
# from reference WAVs stored at ~/wrk/tts-voice-samples/_supercuts.

usage() {
  cat <<'USAGE'
Usage:
  chatterbox-tts.sh "text" [--voice cave|glados|wheatley|donna|default] [--ref <wav>] [--format mp3|wav] [--cpu|--mps] [-o <path>]

Defaults:
  --voice default
  --format mp3
  --cpu

Notes:
  - First run per voice downloads model weights from Hugging Face (one-time, a few GB).
  - --mps uses Apple Silicon GPU acceleration; --cpu is the safe default.
USAGE
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 0
fi

TEXT="$1"
shift

VOICE="default"
REF=""
FORMAT="mp3"
DEVICE="cpu"
OUTPUT=""

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

REPO="${CHATTERBOX_REPO:-$HOME/wrk/opc/resemble-ai-chatterbox}"
VENV_PY="$REPO/.venv/bin/python"
VOICES_DIR="${CHATTERBOX_VOICES_DIR:-$HOME/wrk/tts-voice-samples/_supercuts}"

if [[ ! -x "$VENV_PY" ]]; then
  echo "Missing venv: $VENV_PY" >&2
  echo "Expected chatterbox-tts installed in a venv at: $REPO/.venv (override with CHATTERBOX_REPO)" >&2
  exit 3
fi

# Resolve voice shortcut -> ref path (unless --ref explicitly provided)
if [[ -z "$REF" ]]; then
  case "$VOICE" in
    default) REF="" ;;
    cave) REF="$VOICES_DIR/cave-supercut.wav" ;;
    glados) REF="$VOICES_DIR/glados-supercut.wav" ;;
    wheatley) REF="$VOICES_DIR/wheatley-supercut.wav" ;;
    donna|donna-paulsen) REF="$VOICES_DIR/donna-paulsen.wav" ;;
    *)
      echo "Unknown voice: $VOICE (use cave|glados|wheatley|donna|default)" >&2
      exit 4
      ;;
  esac
fi

if [[ -n "$REF" && ! -f "$REF" ]]; then
  echo "Ref wav not found: $REF" >&2
  exit 6
fi

TS=$(date +%Y%m%d-%H%M%S)
WAV_OUT="/tmp/chatterbox-${VOICE}-${TS}.wav"

args=("$REPO/generate.py" "$TEXT" "--device" "$DEVICE" "--out" "$WAV_OUT")
if [[ -n "$REF" ]]; then
  args+=("--ref" "$REF")
fi

"$VENV_PY" "${args[@]}" >/dev/null

case "$FORMAT" in
  wav)
    if [[ -n "$OUTPUT" ]]; then mv "$WAV_OUT" "$OUTPUT"; echo "$OUTPUT"; else echo "$WAV_OUT"; fi
    ;;
  mp3)
    MP3_OUT="${OUTPUT:-${WAV_OUT%.wav}.mp3}"
    ffmpeg -y -loglevel error -i "$WAV_OUT" "$MP3_OUT"
    rm -f "$WAV_OUT"
    echo "$MP3_OUT"
    ;;
  *)
    echo "Unknown format: $FORMAT (mp3|wav)" >&2
    exit 5
    ;;
esac
