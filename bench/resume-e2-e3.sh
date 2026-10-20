#!/usr/bin/env bash
# The rest of E2 and E3 after the stop of vague B-3 (LOG.md, entry 20.10, 23:20; outside cause, redone as B-4).
#
#   caffeinate -i bench/resume-e2-e3.sh >bench/.run/resume-e2-e3.log 2>&1
#
# 1. Vague B-4: restart the app, the generation, the clean run, the one standard follow-up if the clean run fails,
#    the commit with the tag gen-4 (the same steps as gen_one() of bench/run-chain.sh).
# 2. The measurements of vague: runs 1 and 2 as pairs. The third pair is A-3 and B-4, in one call with --suite and
#    --ref HEAD. collect-metrics runs for A with --run 3 and for B with --run 4. Then a merge puts the A column and the
#    B column into summary-vague-3.csv. The audit covers runs 3 and 4, so also the stopped B-3. Then the aggregate.
# 3. The chain of haiku: bench/run-chain.sh haiku 1 2 3 with AGG_RUNS=1,2,3.
# It costs money. Arsen said "yes" to E2 and E3 at 19:21 (plan v2, section 10, item 15).
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

log "resume of E2 and E3"
# --- 1. vague B-4 ------------------------------------------------------------------------------
step bench/start-app.sh stop
if step env SKIP_BUILD=1 bench/start-app.sh start; then
  step bench/run-generation.sh vague B 4 || log "the generation of B-4 gave a non-zero exit"
  if [ -f bench/results/gen-vague-B-4.json ]; then
    if ! step bench/finish-run.sh vague B 4 clean; then
      log "the clean run of B-4 fails: the one standard follow-up"
      step bench/run-generation.sh vague B 4 followup || log "the follow-up of B-4 gave a non-zero exit"
      step bench/finish-run.sh vague B 4 clean || log "the clean run of B-4 fails after the follow-up"
    fi
    step bench/finish-run.sh vague B 4 commit || FAILED+=("commit B-4")
  else
    FAILED+=("generation B-4: no result file")
  fi
else
  FAILED+=("app start before B-4")
fi
step bench/start-app.sh stop

# --- 2. the measurements of vague --------------------------------------------------------------
for n in 1 2; do
  step node bench/audit-tool-calls.mjs --cond vague --run "$n" || FAILED+=("audit vague $n")
  step node bench/run-mutants.mjs --cond vague --run "$n" || FAILED+=("mutants vague $n")
  step node bench/run-flaky.mjs --cond vague --run "$n" || FAILED+=("flaky vague $n")
  step node bench/run-judge.mjs --cond vague --run "$n" --model claude-opus-5-5 --budget 10 || FAILED+=("judge vague $n")
  step node bench/collect-metrics.mjs --cond vague --run "$n" || FAILED+=("summary vague $n")
done
step node bench/audit-tool-calls.mjs --cond vague --run 3 || FAILED+=("audit vague 3 (A-3)")
# The stopped B-3 has no .json result file. Its session id comes from the first event of gen-vague-B-3.jsonl.
step node bench/audit-tool-calls.mjs --session a8607a75-091d-4563-b68a-155632680a90 --out audit-vague-B-3-stopped || FAILED+=("audit of the stopped B-3")
if git -C "$B4" rev-parse -q --verify refs/tags/gen-4 >/dev/null; then
  step node bench/audit-tool-calls.mjs --cond vague --run 4 || FAILED+=("audit vague 4")
  PAIR=(--suite "A=$A3" --suite "B=$B4" --ref HEAD)
  step node bench/run-mutants.mjs --suite "A=$A3" --suite "B=$B4" --out mutants-vague-3 || FAILED+=("mutants vague 3")
  step node bench/run-flaky.mjs --suite "A=$A3" --suite "B=$B4" --out flaky-vague-3 || FAILED+=("flaky vague 3")
  step node bench/run-judge.mjs "${PAIR[@]}" --model claude-opus-5-5 --budget 10 --out judge-vague-3 || FAILED+=("judge vague 3")
  step node bench/collect-metrics.mjs --cond vague --run 3 --suite "A=$A3" --ref HEAD \
    --mutants mutants-vague-3 --flaky flaky-vague-3 --judge judge-vague-3 --out summary-vague-3-A || FAILED+=("summary vague A-3")
  step node bench/collect-metrics.mjs --cond vague --run 4 --suite "B=$B4" --ref HEAD \
    --mutants mutants-vague-3 --flaky flaky-vague-3 --judge judge-vague-3 --out summary-vague-3-B || FAILED+=("summary vague B-4")
  # The merge: the rows of the two files have the same metrics in the same order (the same script made them).
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
else
  FAILED+=("vague B-4 has no tag gen-4: no measurement of the third pair")
fi
step bench/start-app.sh stop
log "vague done. Failed steps: ${FAILED[*]:-none}"

# --- 3. the chain of haiku -----------------------------------------------------------------------
step env AGG_RUNS=1,2,3 bench/run-chain.sh haiku 1 2 3 || FAILED+=("chain haiku (see its own lines)")
step bench/start-app.sh stop
log "resume done. Failed steps: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
