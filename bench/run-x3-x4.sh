#!/usr/bin/env bash
# The exploratory tamper and mutant runs of decision 19 on vague A-2 and B-2 (LOG.md, entry 21.10, 15:00).
#
#   nohup caffeinate -i bench/run-x3-x4.sh >>bench/.run/x3-x4.log 2>&1 &
#
# It waits until bench/run-e4-after.sh ends (both use the app on port 3000). Before each step it checks that the Mac
# is on AC power. A watcher stops the step when the Mac is on battery power below 30 %.
# A step whose bench/results/<out>.md exists is skipped. These results do not go into the reports of E4.
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
RUNS="$(cd "$LAB/../harness-demo-runs" && pwd -P)"
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
on_ac() { pmset -g batt | head -1 | grep -q "AC Power"; }
battery() { pmset -g batt | grep -Eo '[0-9]+%' | head -1 | tr -d %; }
step() { # <out> <command...>
  local out=$1; shift
  if [ -e "bench/results/$out.md" ]; then log "SKIP $out: bench/results/$out.md exists"; return 0; fi
  if ! on_ac; then log "STOP before $out: not on AC power, battery $(battery) %"; return 3; fi
  log "RUN: $* (AC power, battery $(battery) %)"
  "$@" & local pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    if ! on_ac && [ "$(battery)" -lt 30 ]; then
      log "battery $(battery) % on battery power: stop $out"; pkill -P "$pid"; kill "$pid"; break
    fi
    sleep 30
  done
  wait "$pid"; local rc=$?
  log "EXIT $rc: $*"; return $rc
}
while pgrep -f "[b]ash bench/run-e4-after.sh" >/dev/null; do sleep 30; done
log "bench/run-e4-after.sh ended, start"
for pair in "suite-a x3" "suite-b x4"; do
  read -r suite x <<<"$pair"
  dir="$RUNS/set-2/run-2/$suite"
  [ "$(git -C "$dir" describe --tags --exact-match HEAD 2>/dev/null)" = gen-2 ] || { FAILED+=("$suite is not at the tag gen-2"); continue; }
  [ -z "$(git -C "$dir" status --porcelain --untracked-files=no)" ] || { FAILED+=("$suite has changes"); continue; }
  step "tamper-$x" node bench/run-audit-tamper.mjs --suite "client=$dir" --rules bench/tamper-rules.json --out "tamper-$x" || FAILED+=("tamper $x")
  step "mutate-$x" node bench/run-audit-mutate.mjs --suite "client=$dir" --ref gen-2 --out "mutate-$x" || FAILED+=("mutate $x")
done
log "RUN: bench/start-app.sh stop"; bench/start-app.sh stop
log "x3 x4 done. Failed: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
