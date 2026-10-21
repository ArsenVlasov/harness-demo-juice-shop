#!/usr/bin/env bash
# The re-runs of the vague measurements that overlapped the sleep of the Mac (LOG.md, entry 21.10, 12:55, the rule).
#
#   caffeinate -i bench/rerun-vague-slept.sh >bench/.run/rerun-vague-slept.log 2>&1
#
# vague run 2: patches, flaky, judge, summary. Pair A-3 and B-4: patches, flaky, then the summaries of A (--run 3)
# and B (--run 4) with the judge of the pair (judge-vague-3, exit 0, it stays), the merge and the aggregate.
# The merge code is the same as in bench/resume-e2-e3.sh.
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
RUNS="$(cd "$LAB/../harness-demo-runs" && pwd -P)"
A3="$RUNS/set-2/run-3/suite-a"
B4="$RUNS/set-2/run-4/suite-b"
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
step() { log "RUN: $*"; "$@"; local rc=$?; log "EXIT $rc: $*"; return $rc; }

step node bench/run-mutants.mjs --cond vague --run 2 || FAILED+=("mutants vague 2")
step node bench/run-flaky.mjs --cond vague --run 2 || FAILED+=("flaky vague 2")
step node bench/run-judge.mjs --cond vague --run 2 --model claude-opus-5-5 --budget 10 || FAILED+=("judge vague 2")
step node bench/collect-metrics.mjs --cond vague --run 2 || FAILED+=("summary vague 2")
step node bench/run-mutants.mjs --suite "A=$A3" --suite "B=$B4" --out mutants-vague-3 || FAILED+=("mutants vague 3")
step node bench/run-flaky.mjs --suite "A=$A3" --suite "B=$B4" --out flaky-vague-3 || FAILED+=("flaky vague 3")
step node bench/collect-metrics.mjs --cond vague --run 3 --suite "A=$A3" --ref HEAD \
  --mutants mutants-vague-3 --flaky flaky-vague-3 --judge judge-vague-3 --out summary-vague-3-A || FAILED+=("summary vague A-3")
step node bench/collect-metrics.mjs --cond vague --run 4 --suite "B=$B4" --ref HEAD \
  --mutants mutants-vague-3 --flaky flaky-vague-3 --judge judge-vague-3 --out summary-vague-3-B || FAILED+=("summary vague B-4")
step node -e '
const fs = require("fs")
const [a, b, out] = process.argv.slice(1)
const rows = f => fs.readFileSync(f, "utf8").trim().split("\n")
const ra = rows(a), rb = rows(b)
if (ra.length !== rb.length) throw new Error(`${a} has ${ra.length} rows, ${b} has ${rb.length}`)
const split = l => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g).slice(0, -1).map(c => c.replace(/,$/, ""))
const lines = ra.map((l, i) => {
  const x = split(l), y = split(rb[i])
  if (x[0] !== y[0]) throw new Error(`row ${i + 1}: ${x[0]} is not ${y[0]}`)
  if (i === 0) return "metric,A,B,source"
  const src = `"${(x[2] + " (A-3) / " + y[2] + " (B-4)").replace(/"/g, "")}"`
  return [x[0], x[1], y[1], src].join(",")
})
fs.writeFileSync(out, lines.join("\n") + "\n")
console.log(`merged ${ra.length - 1} rows into ${out}`)
' bench/results/summary-vague-3-A.csv bench/results/summary-vague-3-B.csv bench/results/summary-vague-3.csv || FAILED+=("merge summary vague 3")
step node bench/aggregate-runs.mjs --cond vague --runs 1,2,3 || FAILED+=("aggregate vague")
step bench/start-app.sh stop
log "rerun done. Failed steps: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
