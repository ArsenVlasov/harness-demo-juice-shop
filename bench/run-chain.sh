#!/usr/bin/env bash
# Runs the full chain for generation runs of one condition (plan v2, items 1.4 and 1.5, and E2 and E3 later).
#
#   bench/run-chain.sh precise 2 3                 runs 2 and 3 of the condition precise
#
# 1. For each run n, for suite A and then suite B: restart the app (a clean database), the generation
#    (bench/run-generation.sh), the clean run (bench/finish-run.sh clean). When the clean run fails: the one standard
#    follow-up and one more clean run (plan section 5). Then the commit and the tag gen-<n> (bench/finish-run.sh commit).
# 2. For each run n where both suites have the tag gen-<n>: the tool-call audit, the patches, flaky, the judge and
#    the summary. The patch output names the patches, so all generation runs come first.
# 3. With AGG_RUNS=1,2,3: the aggregate over these runs.
#
# Env: JUDGE_MODEL (default claude-opus-5-5, decision 18 of stage 1), JUDGE_BUDGET (default 10),
#      SKIP_MEASURE=1 (only step 1), AGG_RUNS (step 3).
# The chain costs money. Run it only after Arsen says "yes" (plan v2, checkpoint 4).
# Send the output to a file in bench/.run/ (the lock covers bench/.run/*.log), not to the output of a Claude session:
#   caffeinate -i bench/run-chain.sh precise 2 3 >bench/.run/chain-precise-2-3.log 2>&1
set -uo pipefail

COND="${1:-}"; shift || true
[ -n "$COND" ] && [ $# -gt 0 ] || { echo "usage: $0 <condition> <run> [<run>...]" >&2; exit 2; }
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
JUDGE_MODEL="${JUDGE_MODEL:-claude-opus-5-5}"
JUDGE_BUDGET="${JUDGE_BUDGET:-10}"
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
step() { log "RUN: $*"; "$@"; local rc=$?; log "EXIT $rc: $*"; return $rc; }

gen_one() {
  local s="$1" n="$2"
  step bench/start-app.sh stop
  step env SKIP_BUILD=1 bench/start-app.sh start || return 1
  # A non-zero exit after a real run (for example the budget) still gives a run "as the agent left it".
  # Without a result file, the agent did not run: no clean run and no commit.
  step bench/run-generation.sh "$COND" "$s" "$n" || log "the generation of $s-$n gave a non-zero exit"
  [ -f "bench/results/gen-$COND-$s-$n.json" ] || { log "no bench/results/gen-$COND-$s-$n.json: the agent did not run"; return 1; }
  if ! step bench/finish-run.sh "$COND" "$s" "$n" clean; then
    log "the clean run of $s-$n fails: the one standard follow-up"
    step bench/run-generation.sh "$COND" "$s" "$n" followup || log "the follow-up of $s-$n gave a non-zero exit"
    step bench/finish-run.sh "$COND" "$s" "$n" clean || log "the clean run of $s-$n fails after the follow-up"
  fi
  step bench/finish-run.sh "$COND" "$s" "$n" commit
}

log "chain: condition $COND, runs $*, judge $JUDGE_MODEL with budget $JUDGE_BUDGET USD for each suite"
for n in "$@"; do
  for s in A B; do
    gen_one "$s" "$n" || { FAILED+=("generation $s-$n"); log "FAILED: generation $s-$n"; }
  done
done
step bench/start-app.sh stop

if [ "${SKIP_MEASURE:-0}" != 1 ]; then
  for n in "$@"; do
    ok=1
    for s in A B; do
      dir="$(node -e "import('./bench/lib.mjs').then(m => console.log(m.runDir(process.argv[1], process.argv[2], process.argv[3])))" "$COND" "$s" "$n")"
      git -C "$dir" rev-parse -q --verify "refs/tags/gen-$n" >/dev/null 2>&1 || ok=0
    done
    if [ "$ok" != 1 ]; then FAILED+=("measure $n: a suite has no tag gen-$n"); log "SKIP: the measurements of run $n"; continue; fi
    step node bench/audit-tool-calls.mjs --cond "$COND" --run "$n" || FAILED+=("audit $n")
    step node bench/run-mutants.mjs --cond "$COND" --run "$n" || FAILED+=("mutants $n")
    step node bench/run-flaky.mjs --cond "$COND" --run "$n" || FAILED+=("flaky $n")
    step node bench/run-judge.mjs --cond "$COND" --run "$n" --model "$JUDGE_MODEL" --budget "$JUDGE_BUDGET" || FAILED+=("judge $n")
    step node bench/collect-metrics.mjs --cond "$COND" --run "$n" || FAILED+=("summary $n")
  done
  if [ -n "${AGG_RUNS:-}" ]; then
    step node bench/aggregate-runs.mjs --cond "$COND" --runs "$AGG_RUNS" || FAILED+=("aggregate")
  fi
fi
step bench/start-app.sh stop
log "chain done. Failed steps: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
