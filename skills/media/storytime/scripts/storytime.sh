#!/usr/bin/env bash
# storytime: Multi-voice story renderer using Inworld TTS + ffmpeg.
# Usage: storytime <script-file> <cast-file> [-o output.mp3] [--pause MS]
#
# Script format (one line per block):
#   [CHARACTER] Dialogue or narration text here.
#
# Cast file (JSON mapping character names to Inworld voice IDs):
#   { "NARRATOR": "Elizabeth", "RITA": "Olivia", "RODDY": "Craig" }
#
# Output: stitched MP3 file with natural pauses between speakers.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INWORLD_TTS="${STORYTIME_INWORLD_TTS:-$SCRIPT_DIR/../../inworld-tts/scripts/inworld-tts.sh}"
if [[ ! -x "$INWORLD_TTS" ]]; then
  echo "Error: inworld-tts.sh not found at $INWORLD_TTS. Install the inworld-tts skill beside storytime, or set STORYTIME_INWORLD_TTS." >&2
  exit 2
fi

PAUSE_MS=400
OUTPUT=""
SCRIPT_FILE=""
CAST_FILE=""

# ── Parse args ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pause)  PAUSE_MS="$2"; shift 2 ;;
    -o|--output) OUTPUT="$2"; shift 2 ;;
    --help|-h)
      echo "Usage: storytime <script-file> <cast-file> [-o output.mp3] [--pause MS]"
      echo ""
      echo "Script format: [CHARACTER] Line of dialogue or narration."
      echo "Cast file: JSON mapping character names to Inworld voice IDs."
      echo "--pause: Silence between speakers in ms (default: 400)"
      exit 0 ;;
    -*)       echo "Unknown option: $1" >&2; exit 1 ;;
    *)
      if [[ -z "$SCRIPT_FILE" ]]; then
        SCRIPT_FILE="$1"
      elif [[ -z "$CAST_FILE" ]]; then
        CAST_FILE="$1"
      fi
      shift ;;
  esac
done

if [[ -z "$SCRIPT_FILE" || -z "$CAST_FILE" ]]; then
  echo "Error: Need both <script-file> and <cast-file>" >&2
  echo "Usage: storytime <script-file> <cast-file> [-o output.mp3]" >&2
  exit 1
fi

if [[ ! -f "$SCRIPT_FILE" ]]; then
  echo "Error: Script file not found: $SCRIPT_FILE" >&2
  exit 1
fi

if [[ ! -f "$CAST_FILE" ]]; then
  echo "Error: Cast file not found: $CAST_FILE" >&2
  exit 1
fi

# ── Output path ───────────────────────────────────────────────────
if [[ -z "$OUTPUT" ]]; then
  OUTPUT="/tmp/storytime-$(python3 -c 'import time;print(int(time.time()*1000))').mp3"
fi

WORKDIR=$(mktemp -d /tmp/storytime-work-XXXXXX)
trap "rm -rf $WORKDIR" EXIT

# ── Generate silence file ─────────────────────────────────────────
PAUSE_SEC=$(python3 -c "print($PAUSE_MS / 1000.0)")
ffmpeg -y -f lavfi -i anullsrc=r=44100:cl=mono -t "$PAUSE_SEC" -q:a 9 "$WORKDIR/pause.mp3" 2>/dev/null

# ── Parse script and generate clips ──────────────────────────────
echo "🎬 Rendering story..." >&2
CLIP_NUM=0
CONCAT_LIST="$WORKDIR/concat.txt"
> "$CONCAT_LIST"

while IFS= read -r line; do
  # Skip empty lines and comments
  [[ -z "$line" || "$line" =~ ^# ]] && continue

  # Parse [CHARACTER] text
  if [[ "$line" =~ ^\[([A-Za-z0-9_]+)\]\ *(.*) ]]; then
    CHARACTER="${BASH_REMATCH[1]}"
    TEXT="${BASH_REMATCH[2]}"
  else
    # No tag = narrator
    CHARACTER="NARRATOR"
    TEXT="$line"
  fi

  # Skip empty text
  [[ -z "$TEXT" ]] && continue

  # Look up voice from cast file
  VOICE=$(python3 -c "
import json, sys
cast = json.load(open(sys.argv[1]))
char = sys.argv[2].upper()
# Try exact match, then fallback to NARRATOR, then default
voice = cast.get(char, cast.get('NARRATOR', 'Elizabeth'))
print(voice)
" "$CAST_FILE" "$CHARACTER")

  CLIP_NUM=$((CLIP_NUM + 1))
  CLIP_PATH="$WORKDIR/clip-$(printf '%04d' $CLIP_NUM).mp3"

  echo "  [$CHARACTER → $VOICE] ${TEXT:0:60}..." >&2

  # Generate TTS clip
  "$INWORLD_TTS" "$TEXT" --voice "$VOICE" -o "$CLIP_PATH" >/dev/null

  # Add clip + pause to concat list
  echo "file '$CLIP_PATH'" >> "$CONCAT_LIST"
  echo "file '$WORKDIR/pause.mp3'" >> "$CONCAT_LIST"

done < "$SCRIPT_FILE"

if [[ $CLIP_NUM -eq 0 ]]; then
  echo "Error: No lines found in script" >&2
  exit 1
fi

# ── Stitch all clips with ffmpeg ──────────────────────────────────
echo "🎬 Stitching $CLIP_NUM clips..." >&2
ffmpeg -y -f concat -safe 0 -i "$CONCAT_LIST" -c:a libmp3lame -q:a 2 "$OUTPUT" 2>/dev/null

if [[ -s "$OUTPUT" ]]; then
  echo "✅ Done! $CLIP_NUM clips → $OUTPUT" >&2
  echo "$OUTPUT"
  exit 0
fi

echo "Error: ffmpeg stitching failed" >&2
exit 1
