#!/usr/bin/env bash
# The measurements after the E4 fix (frozen item 8 of bench/hypotheses-v2.md; decision 17).
#
#   caffeinate -i bench/run-e4-after.sh >bench/.run/e4-after.log 2>&1
#
# For each fix folder at its tag "fixed": run-mutants, run-flaky and the judge (the precise test cases, as for each
# suite), then the tamper proxy and the expectation mutants for information (the fixer saw the audit report, so these
# numbers do not test a hypothesis). The label is "after". The "before" numbers are the measurements of the client suite.
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
RUNS="$(cd "$LAB/../harness-demo-runs" && pwd -P)"
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
step() { log "RUN: $*"; "$@"; local rc=$?; log "EXIT $rc: $*"; return $rc; }
for pair in "desk-q x1" "desk-s x2"; do
  read -r folder x <<<"$pair"
  dir="$RUNS/$folder"
  [ "$(git -C "$dir" describe --tags --exact-match HEAD 2>/dev/null)" = fixed ] || { FAILED+=("$folder is not at the tag fixed"); continue; }
  [ -z "$(git -C "$dir" status --porcelain --untracked-files=no)" ] || { FAILED+=("$folder has changes"); continue; }
  step node bench/run-mutants.mjs --suite "after=$dir" --out "mutants-e4-after-$x" || FAILED+=("mutants $x")
  step node bench/run-flaky.mjs --suite "after=$dir" --out "flaky-e4-after-$x" || FAILED+=("flaky $x")
  step node bench/run-judge.mjs --suite "after=$dir" --ref fixed --model claude-opus-5-5 --budget 10 --out "judge-e4-after-$x" || FAILED+=("judge $x")
  step node bench/run-audit-tamper.mjs --suite "client=$dir" --rules bench/tamper-rules.json --out "tamper-e4-after-$x" || FAILED+=("tamper $x")
  step node bench/run-audit-mutate.mjs --suite "client=$dir" --ref fixed --out "mutate-e4-after-$x" || FAILED+=("mutate $x")
done
step bench/start-app.sh stop
log "e4 after done. Failed: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
