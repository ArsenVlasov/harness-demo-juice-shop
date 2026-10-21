#!/usr/bin/env bash
# The E5b runs (decision 21, LOG.md entry 21.10, 19:52): first one patch at a time (H5b.1, no cost), then all patches
# together with the repair by an agent (H5b.2, at most 10 USD for each suite).
#
#   nohup caffeinate -i bench/run-e5b.sh >>bench/.run/e5b.log 2>&1 &
#
# The script stops before a step when the Mac is not on AC power. A step whose bench/results/<out>.md exists is skipped.
# E5B_IGNORE_AC=1 (Arsen, 21.10, 21:39): no AC check. Then a watcher sends SIGTERM to run-ui-change.mjs when the battery
# is at 10 % or less on battery power. The script stops after the current step and reverts juice-shop/ (its finally block),
# so a shutdown does not leave a UI patch in juice-shop/.
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
SUITES=(--suite A=../harness-demo-runs/set-1/run-1/suite-a@gen-1 --suite B=../harness-demo-runs/set-1/run-1/suite-b@gen-1)
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
step() { # <out> <command...>
  local out=$1; shift
  if [ -e "bench/results/$out.md" ]; then log "SKIP $out: bench/results/$out.md exists"; return 0; fi
  [ "${E5B_IGNORE_AC:-0}" = 1 ] || pmset -g batt | head -1 | grep -q "AC Power" || { log "STOP before $out: not on AC power"; return 3; }
  log "RUN: $*"; "$@"; local rc=$?; log "EXIT $rc: $*"; return $rc
}
[ "$(shasum -a 256 sealed-ui/sealed-ui.tar | cut -d' ' -f1)" = 459ff7459d4fd59ac935fe2ec82a32b4d2fdf109787af7c0e8a5d2b812760616 ] \
  || { log "sha256 of sealed-ui/sealed-ui.tar is not the value of the seal"; exit 1; }
if [ "${E5B_IGNORE_AC:-0}" = 1 ]; then
  ( while sleep 60; do
      b="$(pmset -g batt)"; pct="$(echo "$b" | grep -Eo '[0-9]+%' | head -1 | tr -d %)"
      if ! echo "$b" | head -1 | grep -q "AC Power" && [ "${pct:-100}" -le 10 ]; then
        log "battery ${pct} %: SIGTERM to run-ui-change.mjs"; pkill -TERM -f "[n]ode bench/run-ui-change.mjs"; break
      fi
    done ) &
  WATCHER=$!; trap 'kill $WATCHER 2>/dev/null' EXIT
  log "no AC check (E5B_IGNORE_AC=1). Battery watcher pid $WATCHER, limit 10 %. Now: $(pmset -g batt | grep -Eo '[0-9]+%; [a-z ]+' | head -1)"
fi
step ui-change-each node bench/run-ui-change.mjs "${SUITES[@]}" --mode each --out ui-change-each || FAILED+=("each")
if [ ${#FAILED[@]} -eq 0 ]; then
  step ui-change-together node bench/run-ui-change.mjs "${SUITES[@]}" --repair --budget 10 --model claude-opus-5-5 \
    --out ui-change-together || FAILED+=("together")
fi
log "e5b done. Failed: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
