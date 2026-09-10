#!/usr/bin/env bash
# inworld-tts: Synthesize speech via Inworld AI TTS API.
# Usage: inworld-tts "text" [--voice ID] [--model ID] [-o PATH]
#        echo "text" | inworld-tts [--voice ID] [-o PATH]
# Output: prints the path to the generated MP3 file on success.

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────
INWORLD_API="https://api.inworld.ai/tts/v1/voice"
INWORLD_KEY="${INWORLD_API_KEY:-}"
if [[ -z "$INWORLD_KEY" ]]; then
  echo "Error: INWORLD_API_KEY is not set. Export the Base64 Basic-auth credential from your Inworld workspace (API Keys > Basic)." >&2
  exit 2
fi

VOICE="Olivia"
MODEL="inworld-tts-1.5-max"
OUTPUT=""
TEXT=""

# ── Parse args ────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --voice)  VOICE="$2";  shift 2 ;;
    --model)  MODEL="$2";  shift 2 ;;
    -o|--output) OUTPUT="$2"; shift 2 ;;
    --list-voices)
      curl -s "https://api.inworld.ai/voices/v1/voices" \
        -H "Authorization: Basic $INWORLD_KEY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
for v in data.get('voices', []):
    tags = ', '.join(v.get('tags', []))
    print(f'{v[\"voiceId\"]:15s} | {v.get(\"description\",\"\")[:65]:65s} | {tags}')
"
      exit 0 ;;
    --help|-h)
      echo "Usage: inworld-tts \"text\" [--voice ID] [--model ID] [-o PATH]"
      echo ""
      echo "Options:"
      echo "  --voice ID     Voice name (default: Olivia)"
      echo "  --model ID     Model (default: inworld-tts-1.5-max)"
      echo "  -o, --output   Output MP3 path (default: /tmp/inworld-<ts>.mp3)"
      echo "  --list-voices  List all available voices"
      echo ""
      echo "Voices: Olivia, Craig, Ronald, Elizabeth, Hades, Carter, etc."
      echo "Run --list-voices for full catalog."
      exit 0 ;;
    -*)       echo "Unknown option: $1" >&2; exit 1 ;;
    *)        TEXT="$1"; shift ;;
  esac
done

# Read from stdin if no text argument
if [[ -z "$TEXT" ]]; then
  TEXT="$(cat)"
fi

if [[ -z "$TEXT" ]]; then
  echo "Error: No text provided" >&2
  exit 1
fi

# ── Output path ───────────────────────────────────────────────────
if [[ -z "$OUTPUT" ]]; then
  OUTPUT="/tmp/inworld-$(python3 -c 'import time;print(int(time.time()*1000))').mp3"
fi

# ── Build JSON payload ────────────────────────────────────────────
PAYLOAD=$(python3 -c "
import json, sys
print(json.dumps({
    'text': sys.argv[1],
    'voiceId': sys.argv[2],
    'modelId': sys.argv[3]
}))
" "$TEXT" "$VOICE" "$MODEL")

# ── Call Inworld TTS API ──────────────────────────────────────────
RESP=$(curl -s -X POST "$INWORLD_API" \
  -H "Authorization: Basic $INWORLD_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" 2>/dev/null)

# Check for errors
ERROR=$(echo "$RESP" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    if 'error' in d or 'code' in d:
        print(d.get('message', d.get('error', 'Unknown error')))
    elif 'audioContent' not in d:
        print('No audioContent in response')
    else:
        print('')
except: print('Failed to parse response')
" 2>/dev/null)

if [[ -n "$ERROR" ]]; then
  echo "Error: Inworld TTS failed: $ERROR" >&2
  exit 1
fi

# ── Decode base64 audio to MP3 ────────────────────────────────────
echo "$RESP" | python3 -c "
import json, base64, sys
data = json.load(sys.stdin)
audio = base64.b64decode(data['audioContent'])
with open(sys.argv[1], 'wb') as f:
    f.write(audio)
" "$OUTPUT"

if [[ -s "$OUTPUT" ]]; then
  echo "$OUTPUT"
  exit 0
fi

echo "Error: Failed to decode audio" >&2
exit 1
