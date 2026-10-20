#!/usr/bin/env bash
# Finishes one generation run of plan v2: one run of its tests on the clean app, then the commit and the tag.
#
#   bench/finish-run.sh precise A 2 clean    rebuild and restart the app, run the suite once, save the reports
#   bench/finish-run.sh precise A 2 commit   commit the run folder as the agent left it, add the tag gen-2
#
# clean: it refuses when juice-shop/ has changes (a patch is applied). Then it stops the app and starts it with
#        build:server, because juice-shop/build/ is not in git: only a new build shows that it has no patch.
#        bench/results/clean-<condition>-<A|B>-<n>.json (the Playwright JSON report) and .txt (the app line, then the
#        list output).
#        After a follow-up (bench/results/gen-<condition>-<A|B>-<n>-followup.json exists), the names get -followup.
#        It prints the pass and fail line. The exit code is the exit code of Playwright.
# commit: git add -A, then a commit without git hooks, so that the code stays as the agent left it.
#        Then the annotated tag gen-<n>. It prints the commit sha and the tree sha. It refuses if the tag exists.
# Env, for tests only: CL_LAB, CL_RUNS.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

usage() { echo "usage: $0 <condition> A|B <n> clean|commit" >&2; exit 2; }
die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

COND="${1:-}"; SUITE_ID="${2:-}"; RUN="${3:-}"; ACTION="${4:-}"
case "$SUITE_ID" in A) S=a ;; B) S=b ;; *) usage ;; esac
[[ "$RUN" =~ ^[1-9][0-9]*$ ]] || usage
case "$ACTION" in clean|commit) ;; *) usage ;; esac

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" && pwd -P)"
RESULTS="$LAB/bench/results"
NODE_HOME="$HOME/.local/node-v24.21.0"
NODE="$NODE_HOME/bin/node"
export PATH="$NODE_HOME/bin:$PATH"

FIELDS="$("$NODE" -e '
const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).conditions[process.argv[2]];
if (!c) { console.error(`no condition "${process.argv[2]}" in bench/conditions.json`); process.exit(1) }
console.log(c.dir, c.tcSet)' "$LAB/bench/conditions.json" "$COND")" || die "bad condition: $COND"
read -r DIR TCSET <<<"$FIELDS"
[[ "$DIR" =~ ^[A-Za-z0-9._-]+$ ]] && [[ "$TCSET" =~ ^[A-Za-z0-9._-]+$ ]] || die "bad values in bench/conditions.json: $FIELDS"
RUN_DIR="$RUNS/$DIR/run-$RUN/suite-$S"
NAME="$COND-$SUITE_ID-$RUN"
[ -d "$RUN_DIR/.git" ] || die "no run folder $RUN_DIR"
[ ! -e "$LAB/bench/.run/generation.lock" ] || die "a locked claude run is active, or it stopped without the restore ($LAB/bench/.run/generation.lock)"

session_of() { [ -f "$1" ] && "$NODE" -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).session_id || 'unknown')" "$1" || echo none; }

if [ "$ACTION" = clean ]; then
  OUT="clean-$NAME"
  [ ! -e "$RESULTS/gen-$NAME-followup.json" ] || OUT="$OUT-followup"
  for f in "$RESULTS/$OUT.json" "$RESULTS/$OUT.txt"; do [ ! -e "$f" ] || die "$f exists"; done
  APP_STATUS="$(git -C "$LAB/juice-shop" status --short)" || die "no git repository in $LAB/juice-shop"
  [ -z "$APP_STATUS" ] || die "juice-shop/ has changes: a patch is applied. $(echo "$APP_STATUS" | head -3 | tr '\n' ' ')"
  mkdir -p "$RESULTS"
  log "restart the app with build:server"
  "$LAB/bench/start-app.sh" stop
  SKIP_BUILD=0 "$LAB/bench/start-app.sh" start
  [ -z "$(git -C "$LAB/juice-shop" status --short)" ] || die "juice-shop/ has changes after the start"
  APP_LINE="app: juice-shop HEAD $(git -C "$LAB/juice-shop" rev-parse HEAD), no changes in git status, build:server before the start, $(date '+%Y-%m-%d %H:%M:%S %Z')"
  echo "$APP_LINE" >"$RESULTS/$OUT.txt"
  log "$APP_LINE"
  log "npx playwright test --retries=0 in $RUN_DIR"
  set +e
  (cd "$RUN_DIR" && PLAYWRIGHT_JSON_OUTPUT_NAME="$RESULTS/$OUT.json" npx playwright test --retries=0 --reporter=list,json) | tee -a "$RESULTS/$OUT.txt"
  RC=${PIPESTATUS[0]}
  set -e
  [ -f "$RESULTS/$OUT.json" ] || die "no JSON report $RESULTS/$OUT.json (Playwright exit $RC)"
  "$NODE" -e '
const s = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).stats ?? {};
console.log(`clean run ${process.argv[2]}: ${s.expected ?? 0} passed, ${s.unexpected ?? 0} failed, ${s.flaky ?? 0} flaky, ${s.skipped ?? 0} skipped, Playwright exit ${process.argv[3]}`)' \
    "$RESULTS/$OUT.json" "$OUT" "$RC"
  log "saved: bench/results/$OUT.json and $OUT.txt"
  exit "$RC"
fi

# --- commit ---------------------------------------------------------------------------------------
TEMPLATE="$RUNS/templates/suite-$S-$TCSET.git"
! git -C "$RUN_DIR" rev-parse -q --verify "refs/tags/gen-$RUN" >/dev/null || die "the tag gen-$RUN exists in $RUN_DIR"
[ "$(git -C "$RUN_DIR" symbolic-ref --short HEAD)" = main ] || die "the branch of $RUN_DIR is not main"
START="$(git -C "$TEMPLATE" rev-parse --verify 'main^{commit}')" || die "no template $TEMPLATE"
[ "$(git -C "$RUN_DIR" rev-parse HEAD)" = "$START" ] || die "HEAD of $RUN_DIR is not the start state $START: somebody made a commit"
FIRST_SESSION="$(session_of "$RESULTS/gen-$NAME.json")"
FOLLOWUP_SESSION="$(session_of "$RESULTS/gen-$NAME-followup.json")"
git -C "$RUN_DIR" add -A
# The messages have the form of run 1 and do not name the condition: a later agent in a copy of this folder
# (the E4 fix, the E5b repair) can read git log.
git -C "$RUN_DIR" commit -q --no-verify --allow-empty -m "Generation run $SUITE_ID-$RUN, as the agent left it" \
  -m "Output of claude -p (session $FIRST_SESSION) with the prompt from the plan. Follow-up session: $FOLLOWUP_SESSION.
Nobody changed this code by hand. bench/finish-run.sh made this commit with git add -A and without git hooks." \
  -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git -C "$RUN_DIR" tag -a "gen-$RUN" -m "Generation run $SUITE_ID-$RUN output, unchanged"
log "run folder: $RUN_DIR"
log "commit $(git -C "$RUN_DIR" rev-parse HEAD), tree $(git -C "$RUN_DIR" rev-parse 'HEAD^{tree}'), tag gen-$RUN, parent $START"
log "$(git -C "$RUN_DIR" diff --shortstat "$START" HEAD)"
