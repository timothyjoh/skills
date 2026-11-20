#!/usr/bin/env bash
# Entry point for the moss-image skill.
#
#   moss-image.sh check                 platform, install and backend status (no changes)
#   moss-image.sh install               clone the pinned moss-image-mac and run its setup (~10 GB download)
#   moss-image.sh run TOOL 'JSON'       call one MOSS tool, e.g. run generate_image '{"prompt": "..."}'
#   moss-image.sh run --batch FILE      call several tools in one process (models load once)
#
# Env:
#   MOSS_HOME        the moss-image-mac checkout (default ~/Documents/moss-image-app)
#   MOSS_OUTPUT_DIR  where images are saved (default $MOSS_HOME/outputs)
#   MOSS_PORT        backend port (default 18765)
#   HF_ENDPOINT      model download server for install (default https://huggingface.co)
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MOSS_HOME="${MOSS_HOME:-$HOME/Documents/moss-image-app}"
PORT="${MOSS_PORT:-18765}"
PINNED_REPO="https://github.com/vitaliyhan/moss-image-mac.git"
PINNED_COMMIT="452c31c188530aa0efcc1b023e6f400954a161c9"
REQUIRED_FILES=(
  bin/sd-cli
  bin/sd-server
  models/diffusion_models/MOSS-Image-SFT-Q4_0.gguf
  models/text_encoders/Qwen3.5-9B-Q4_K_M.gguf
  models/vae/flux2_ae_small.safetensors
  models/tokenizers/tokenizer_qwen3.5.json
  models/loras/moss_4step_f16.safetensors
  models/loras/moss_3step_f16.safetensors
  .venv/bin/python
  moss_mcp.py
  moss_client.py
)

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

platform_line() {
  local os arch ver mem_gb free_gb probe
  os="$(uname -s)"; arch="$(uname -m)"
  ver="$( [[ "$os" == Darwin ]] && sw_vers -productVersion || echo "-" )"
  mem_gb=$(( $( [[ "$os" == Darwin ]] && sysctl -n hw.memsize || echo 0 ) / 1073741824 ))
  probe="$MOSS_HOME"; while [[ ! -d "$probe" ]]; do probe="$(dirname "$probe")"; done
  free_gb=$(( $(df -k "$probe" | awk 'NR==2 {print $4}') / 1048576 ))
  echo "platform: os=$os arch=$arch macos=$ver memory_gb=$mem_gb free_disk_gb=$free_gb"
  PLATFORM_OK=1; PLATFORM_WHY=""
  [[ "$os" == Darwin && "$arch" == arm64 ]] || { PLATFORM_OK=0; PLATFORM_WHY="needs an Apple Silicon Mac (M1 or newer)"; }
  (( mem_gb >= 16 )) || PLATFORM_WHY="${PLATFORM_WHY:+$PLATFORM_WHY; }16 GB+ memory recommended (peak use ~9 GB)"
  MACOS_MAJOR="${ver%%.*}"; FREE_GB="$free_gb"; MEM_GB="$mem_gb"
}

backend_up() {
  curl -s -m 2 "http://127.0.0.1:${PORT}/sdcpp/v1/capabilities" 2>/dev/null | grep -q 'MOSS-Image-SFT'
}

cmd_check() {
  platform_line
  if (( PLATFORM_OK == 0 )); then
    echo "status: unsupported ($PLATFORM_WHY)"; exit 2
  fi
  [[ -n "$PLATFORM_WHY" ]] && echo "warning: $PLATFORM_WHY"
  echo "moss_home: $MOSS_HOME"
  if [[ ! -d "$MOSS_HOME" ]]; then
    echo "status: not-installed"; exit 3
  fi
  local head missing=()
  head="$(git -C "$MOSS_HOME" rev-parse HEAD 2>/dev/null || echo unknown)"
  echo "commit: $head$( [[ "$head" == "$PINNED_COMMIT" ]] && echo ' (pinned)' || echo " (pinned is $PINNED_COMMIT)")"
  for f in "${REQUIRED_FILES[@]}"; do [[ -e "$MOSS_HOME/$f" ]] || missing+=("$f"); done
  if (( ${#missing[@]} )); then
    echo "missing: ${missing[*]}"
    echo "status: incomplete (run: moss-image.sh install)"; exit 3
  fi
  echo "outputs: ${MOSS_OUTPUT_DIR:-$MOSS_HOME/outputs}"
  if backend_up; then echo "backend: running on 127.0.0.1:$PORT"; else echo "backend: stopped (starts on first call, ~15 s)"; fi
  echo "status: ready"
}

cmd_install() {
  platform_line
  (( PLATFORM_OK == 1 )) || die "$PLATFORM_WHY"
  [[ -n "$PLATFORM_WHY" ]] && echo "warning: $PLATFORM_WHY"
  command -v git >/dev/null && git --version >/dev/null 2>&1 \
    || die "git does not work. Run xcode-select --install, finish the installer, then retry."
  if [[ ! -d "$MOSS_HOME" ]]; then
    (( FREE_GB >= 15 )) || die "only ${FREE_GB} GB free; setup needs about 15 GB."
    git clone "$PINNED_REPO" "$MOSS_HOME"
    git -C "$MOSS_HOME" -c advice.detachedHead=false checkout "$PINNED_COMMIT"
  else
    [[ -x "$MOSS_HOME/setup.sh" ]] || die "$MOSS_HOME exists but has no setup.sh; set MOSS_HOME to another folder."
    echo "note: $MOSS_HOME already exists; keeping its current commit and resuming setup."
  fi
  local args=()
  if (( MACOS_MAJOR < 26 )); then
    command -v cmake >/dev/null || die "macOS $MACOS_MAJOR needs cmake to build the runtime. Run: brew install cmake"
    args=(--build-from-source)
  fi
  (cd "$MOSS_HOME" && HF_ENDPOINT="${HF_ENDPOINT:-https://huggingface.co}" ./setup.sh "${args[@]}")
  echo
  echo "Installed at $MOSS_HOME ($(du -sh "$MOSS_HOME" | cut -f1))."
  echo "Optional, connects the tools to Claude Code for all projects:"
  echo "  claude mcp add moss-image -s user -- \"$MOSS_HOME/.venv/bin/python\" \"$MOSS_HOME/moss_mcp.py\""
}

cmd_run() {
  [[ -x "$MOSS_HOME/.venv/bin/python" && -f "$MOSS_HOME/moss_mcp.py" ]] \
    || die "MOSS is not installed at $MOSS_HOME (run: moss-image.sh check)"
  MOSS_HOME="$MOSS_HOME" exec "$MOSS_HOME/.venv/bin/python" -I "$SKILL_DIR/scripts/moss_image.py" "$@"
}

case "${1:-}" in
  check)   shift; cmd_check "$@" ;;
  install) shift; cmd_install "$@" ;;
  run)     shift; cmd_run "$@" ;;
  *) sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 64 ;;
esac
