#!/usr/bin/env bash
# Run narrate.py with the Python environment that holds Kokoro.
# Python: $NARRATE_DOC_PYTHON, else ~/wrk/opc/kokoro-tts/.venv, else ~/.venvs/narrate-doc.
# `narrate.sh --check` reports what is missing and exits.
set -euo pipefail
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

py="${NARRATE_DOC_PYTHON:-}"
if [ -z "$py" ]; then
  for c in "$HOME/wrk/opc/kokoro-tts/.venv/bin/python" "$HOME/.venvs/narrate-doc/bin/python"; do
    if [ -x "$c" ]; then py="$c"; break; fi
  done
fi
if [ -z "$py" ] || [ ! -x "$py" ]; then
  echo "narrate-doc: no Python environment found. Set NARRATE_DOC_PYTHON, or create one:" >&2
  echo "  uv venv --python 3.12 ~/.venvs/narrate-doc" >&2
  echo "  uv pip install --python ~/.venvs/narrate-doc/bin/python -r $here/../requirements.txt" >&2
  exit 2
fi
if ! command -v ffmpeg >/dev/null; then
  echo "narrate-doc: ffmpeg not found (macOS: brew install ffmpeg)" >&2
  exit 2
fi

if [ "${1:-}" = "--check" ]; then
  missing="$("$py" -I -c '
import importlib.util
mods = {"kokoro": "kokoro", "soundfile": "soundfile", "bs4": "beautifulsoup4", "markdown_it": "markdown-it-py",
        "mammoth": "mammoth", "pymupdf4llm": "pymupdf4llm"}
print(" ".join(p for m, p in mods.items() if importlib.util.find_spec(m) is None))
')"
  if [ -n "$missing" ]; then
    echo "narrate-doc: $py is missing: $missing" >&2
    echo "  uv pip install --python $py -r $here/../requirements.txt" >&2
    exit 2
  fi
  echo "narrate-doc: ready ($py, $(ffmpeg -version | head -1 | cut -d' ' -f1-3))"
  exit 0
fi

exec "$py" "$here/narrate.py" "$@"
