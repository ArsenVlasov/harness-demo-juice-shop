#!/usr/bin/env bash
# Runs one generation of suite A or B for one condition of plan v2 (bench/conditions.json) with `claude -p`.
#
#   bench/run-generation.sh precise A 2            first run: a new run folder from the template, then the prompt
#   bench/run-generation.sh precise A 2 followup   the one standard follow-up message, in the session of that run
#   bench/run-generation.sh precise A 0 check      cheap check of the scripts: Haiku, a temp folder, no run folder
#
# <n> is 1 or more for first and followup. A check accepts any number, for example 0.
# Run folder: RUNS/<dir of the condition>/run-<n>/suite-<a|b>. The first run makes it from the template
# RUNS/templates/suite-<a|b>-<tcSet>.git, installs node_modules and checks test-cases/ against the lab tag of the set.
# It removes the reflog of the clone, because the reflog names the template and so the test case set.
# Then bench/claude-locked.sh runs claude with the lock. It writes bench/results/gen-<condition>-<A|B>-<n>.jsonl,
# .json, .meta and .stderr. A follow-up adds -followup to the name, a check adds -check-<HHMMSS>.
# This script does not commit in the run folder. bench/finish-run.sh does that.
# The script costs money. Run it only after Arsen says "yes" (plan v2, checkpoint 4).
#
# Env, for tests only: CL_LAB, CL_RUNS and the other CL_* variables of bench/claude-locked.sh.
# RG_SKIP_APP_CHECK=1 skips the check of the app on :3000. The .meta file records it.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

usage() { echo "usage: $0 <condition> A|B <n> [first|followup|check]" >&2; exit 2; }
die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

COND="${1:-}"; SUITE_ID="${2:-}"; RUN="${3:-}"; MODE="${4:-first}"
case "$SUITE_ID" in A) S=a ;; B) S=b ;; *) usage ;; esac
case "$MODE" in first|followup) [[ "$RUN" =~ ^[1-9][0-9]*$ ]] || usage ;; check) [[ "$RUN" =~ ^[0-9]+$ ]] || usage ;; *) usage ;; esac

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" && pwd -P)"
export CL_LAB="$LAB" CL_RUNS="$RUNS"   # claude-locked.sh uses the same roots
RESULTS="$LAB/bench/results"
NODE_HOME="$HOME/.local/node-v24.21.0"
NODE="$NODE_HOME/bin/node"
export PATH="$NODE_HOME/bin:$PATH"     # npm ci runs with Node 24
LOCKED="$LAB/bench/claude-locked.sh"
PROMPT_FILE="$LAB/bench/prompt-generation.txt"
FOLLOWUP_TEXT="Тести падають на запущеному застосунку. Запусти їх і полагодь."
CHECK_MODEL="claude-haiku-5-5"

# Prints "<dir> <tcSet> <model> <labDir> <labTag> <dir of precise>" for condition $1.
read_condition() {
  "$NODE" -e '
const c = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const k = c.conditions[process.argv[2]];
if (!k) { console.error(`no condition "${process.argv[2]}". Known: ${Object.keys(c.conditions).join(", ")}`); process.exit(1) }
const t = c.tcSets[k.tcSet];
if (!t) { console.error(`no tcSet "${k.tcSet}" in tcSets`); process.exit(1) }
console.log([k.dir, k.tcSet, k.model, t.labDir, t.labTag, c.conditions.precise.dir].join(" "))' "$LAB/bench/conditions.json" "$1"
}
# sha256 of a test case folder: the method of the freeze of test-cases-v1.
tc_hash() { (cd "$1" && find . -type f -print0 | LC_ALL=C sort -z | xargs -0 shasum -a 256 | shasum -a 256 | cut -d' ' -f1); }
sha_of() { shasum -a 256 | cut -d' ' -f1; }

FIELDS="$(read_condition "$COND")" || die "bad condition: $COND"
read -r DIR TCSET MODEL LAB_DIR LAB_TAG PRECISE_DIR <<<"$FIELDS"
for v in "$DIR" "$TCSET" "$MODEL" "$LAB_DIR" "$LAB_TAG" "$PRECISE_DIR"; do
  [[ "$v" =~ ^[A-Za-z0-9._-]+$ ]] || die "bad value in bench/conditions.json: '$v'"
done
case "$DIR" in .|..|templates|maintenance) die "bad dir in bench/conditions.json: $DIR" ;; esac
RUN_DIR="$RUNS/$DIR/run-$RUN/suite-$S"
TEMPLATE="$RUNS/templates/suite-$S-$TCSET.git"
TAG="gen-$COND-$SUITE_ID-$RUN"
NOTES=(--note "condition $COND (dir $DIR, tcSet $TCSET, model $MODEL), suite $SUITE_ID, run $RUN, mode $MODE")

# --- the checks of run 1, for each mode -------------------------------------------------------
[ -d "$LAB/sealed" ] || die "no $LAB/sealed: the patches must be sealed before the generation"
[ -f "$LAB/LOG.md" ] || die "no LOG.md"
[ -f "$PROMPT_FILE" ] || die "no $PROMPT_FILE"
[ -x "$LOCKED" ] || die "no $LOCKED"
APP_STATUS="$(git -C "$LAB/juice-shop" status --short)" || die "no git repository in $LAB/juice-shop"
[ -z "$APP_STATUS" ] || die "juice-shop/ has changes: a patch is applied"
if [ "${RG_SKIP_APP_CHECK:-0}" = 1 ]; then
  NOTES+=(--note "app check: SKIPPED (RG_SKIP_APP_CHECK=1, test only)")
else
  "$LAB/bench/start-app.sh" status | grep -qx up || die "the app does not answer on :3000. Run: bench/start-app.sh start"
fi
[ ! -e "$LAB/bench/.run/generation.lock" ] || die "a locked run is active, or a run stopped without the restore ($LAB/bench/.run/generation.lock)"

# --- check: Haiku in a temp folder, no run folder ----------------------------------------------
if [ "$MODE" = check ]; then
  WORK="$(mktemp -d "$(cd "${TMPDIR:-/tmp}" && pwd -P)/run-generation-check.XXXXXX")"
  log "check run in $WORK"
  exec "$LOCKED" --check --dir "$WORK" --prompt-file /dev/stdin --model "$CHECK_MODEL" --budget 0.5 --tag "$TAG" \
    "${NOTES[@]}" --note "check run: temp folder $WORK, prompt 'Reply with the word ok.'" <<<"Reply with the word ok."
fi

# --- followup: the standard follow-up message in the session of the first run -------------------
if [ "$MODE" = followup ]; then
  [ -d "$RUN_DIR/.git" ] || die "no run folder $RUN_DIR"
  FIRST="$RESULTS/$TAG.json"
  # Run 1 of precise has the legacy name gen-<A|B>-1.json.
  [ -f "$FIRST" ] || [ "$COND-$RUN" != precise-1 ] || FIRST="$RESULTS/gen-$SUITE_ID-1.json"
  [ -f "$FIRST" ] || die "no first run $FIRST"
  ! git -C "$RUN_DIR" rev-parse -q --verify "refs/tags/gen-$RUN" >/dev/null || die "the run has the tag gen-$RUN: its test code is frozen"
  SESSION_ID="$("$NODE" -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).session_id || '')" "$FIRST")"
  [ -n "$SESSION_ID" ] || die "no session_id in $FIRST"
  log "follow-up of $TAG in $RUN_DIR, session $SESSION_ID"
  exec "$LOCKED" --dir "$RUN_DIR" --prompt-file /dev/stdin --model "$MODEL" --tag "$TAG-followup" --resume "$SESSION_ID" \
    "${NOTES[@]}" --note "first run: $(basename "$FIRST"), run folder HEAD $(git -C "$RUN_DIR" rev-parse HEAD)" <<<"$FOLLOWUP_TEXT"
fi

# --- first: (a) checks ----------------------------------------------------------------------------
[ ! -e "$RUN_DIR" ] || die "$RUN_DIR exists. A first run makes a new run folder"
for f in "$RESULTS/$TAG".json "$RESULTS/$TAG".jsonl "$RESULTS/$TAG-followup".json; do [ ! -e "$f" ] || die "$f exists"; done
[ "$COND-$RUN" != precise-1 ] || die "run 1 of precise is the run of stage 1"
[ -d "$TEMPLATE" ] || die "no template $TEMPLATE. Run bench/migrate-layout.sh or bench/make-template.sh"
[ "$(git -C "$TEMPLATE" symbolic-ref HEAD)" = refs/heads/main ] || die "HEAD of $TEMPLATE is not main"
TPL_HEAD="$(git -C "$TEMPLATE" rev-parse --verify 'main^{commit}')"
TPL_TREE="$(git -C "$TEMPLATE" rev-parse 'main^{tree}')"
TPL_REFS="$(git -C "$TEMPLATE" for-each-ref --format='%(objectname) %(refname)')"
git -C "$LAB" rev-parse -q --verify "refs/tags/$LAB_TAG" >/dev/null || die "no tag $LAB_TAG in the lab"
TMP="$(mktemp -d "$(cd "${TMPDIR:-/tmp}" && pwd -P)/run-generation.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
git -C "$LAB" archive "$LAB_TAG" "$LAB_DIR" | tar -x -C "$TMP"
LAB_TC_SHA="$(tc_hash "$TMP/$LAB_DIR")"
log "lab $LAB_TAG:$LAB_DIR sha256 $LAB_TC_SHA"

# --- (b) the run folder from the template ----------------------------------------------------
log "clone $TEMPLATE into $RUN_DIR"
mkdir -p "$(dirname "$RUN_DIR")"
git clone -q --no-local --no-hardlinks "$TEMPLATE" "$RUN_DIR"
git -C "$RUN_DIR" remote remove origin
# The reflog says "clone: from RUNS/templates/suite-<s>-<tcSet>.git". The agent can read it with git log -g.
rm -rf "$RUN_DIR/.git/logs"
LEAK="$(grep -rIilF --exclude-dir=objects -e "templates/" -e "$TCSET" -e "$COND" "$RUN_DIR/.git" || true)"
[ -z "$LEAK" ] || die "these files in $RUN_DIR/.git name the template, the set or the condition: $LEAK"
HOOKS="none"
if [ "$SUITE_ID" = B ]; then git -C "$RUN_DIR" config core.hooksPath .githooks; HOOKS=".githooks"; fi
[ "$(git -C "$RUN_DIR" rev-parse HEAD)" = "$TPL_HEAD" ] || die "HEAD of $RUN_DIR is not main of the template"
[ "$(git -C "$RUN_DIR" symbolic-ref --short HEAD)" = main ] || die "the branch of $RUN_DIR is not main"
[ "$(git -C "$RUN_DIR" for-each-ref --format='%(objectname) %(refname)')" = "$TPL_REFS" ] || die "the refs of $RUN_DIR are not the refs of the template"
[ -z "$(git -C "$RUN_DIR" remote)" ] || die "$RUN_DIR has a remote"
[ "$(git -C "$RUN_DIR" config --get core.hooksPath || echo none)" = "$HOOKS" ] || die "core.hooksPath of $RUN_DIR is not $HOOKS"
# No object of another generation run: the gen-* tags and commits of each run folder in RUNS.
CHECKED=0
for other in "$RUNS"/*/run-*/suite-a "$RUNS"/*/run-*/suite-b; do
  [ -d "$other/.git" ] && [ "$other" != "$RUN_DIR" ] || continue
  for obj in $(git -C "$other" for-each-ref --format='%(objectname) %(*objectname)' 'refs/tags/gen-*'); do
    ! git -C "$RUN_DIR" cat-file -e "$obj" 2>/dev/null || die "$RUN_DIR has object $obj of $other"
    CHECKED=$((CHECKED + 1))
  done
done
TAGS="$(git -C "$RUN_DIR" tag | paste -sd ' ' -)"
log "run folder: HEAD $TPL_HEAD, branch main, tags $TAGS, no remote, no reflog, core.hooksPath $HOOKS, $CHECKED objects of other runs absent"

# --- (c) node_modules ----------------------------------------------------------------------------
git clone -q --no-local --no-hardlinks "$TEMPLATE" "$TMP/npm-try"
if (cd "$TMP/npm-try" && npm ci --offline --no-audit --no-fund) >"$TMP/npm-try.log" 2>&1; then
  log "npm ci --offline works in a temp clone. Run it in the run folder."
  (cd "$RUN_DIR" && npm ci --offline --no-audit --no-fund) >"$TMP/npm-run.log" 2>&1 || { tail -20 "$TMP/npm-run.log" >&2; die "npm ci --offline fails in $RUN_DIR"; }
  NM_METHOD="npm ci --offline, node $(node -v), npm $(npm -v)"
else
  log "npm ci --offline fails in a temp clone: $(grep -m1 -i 'err' "$TMP/npm-try.log" || tail -1 "$TMP/npm-try.log")"
  SRC="$RUNS/$PRECISE_DIR/run-1/suite-$S"
  TPL_LOCK="$(git -C "$TEMPLATE" show main:package-lock.json | sha_of)"
  SRC_LOCK="$(sha_of <"$SRC/package-lock.json")"
  [ "$SRC_LOCK" = "$TPL_LOCK" ] || die "package-lock.json of $SRC ($SRC_LOCK) is not the one of the template ($TPL_LOCK)"
  [ -d "$SRC/node_modules" ] || die "no $SRC/node_modules"
  cp -Rp "$SRC/node_modules" "$RUN_DIR/node_modules"
  NM_METHOD="cp -Rp from $SRC/node_modules, package-lock.json sha256 $TPL_LOCK equals the template"
fi
NM_LOCK="none"
[ ! -f "$RUN_DIR/node_modules/.package-lock.json" ] || NM_LOCK="$(sha_of <"$RUN_DIR/node_modules/.package-lock.json")"
log "node_modules: $NM_METHOD"
[ -z "$(git -C "$RUN_DIR" status --short)" ] || die "$RUN_DIR has changes after the install of node_modules"

# --- (d) test-cases/ equals the lab copy at its tag ---------------------------------------------
RUN_TC_SHA="$(tc_hash "$RUN_DIR/test-cases")"
[ "$RUN_TC_SHA" = "$LAB_TC_SHA" ] || die "sha256 of $RUN_DIR/test-cases ($RUN_TC_SHA) is not the sha256 of $LAB_TAG:$LAB_DIR ($LAB_TC_SHA)"
log "test-cases sha256 $RUN_TC_SHA equals $LAB_TAG:$LAB_DIR"

# --- (e) the locked claude run -------------------------------------------------------------------
NOTES+=(--note "template: $TEMPLATE, main $TPL_HEAD, tree $TPL_TREE"
  --note "run folder: $RUN_DIR, branch main, tags $TAGS, no remote, no reflog, core.hooksPath $HOOKS, $CHECKED objects of other runs absent"
  --note "test-cases sha256: $RUN_TC_SHA, equals the lab copy $LAB_TAG:$LAB_DIR"
  --note "node_modules: $NM_METHOD; node_modules/.package-lock.json sha256 $NM_LOCK")
rm -rf "$TMP"; trap - EXIT
log "start bench/claude-locked.sh. If it stops before the run, $RUN_DIR has no agent changes: remove it and run again."
exec "$LOCKED" --dir "$RUN_DIR" --prompt-file "$PROMPT_FILE" --model "$MODEL" --tag "$TAG" "${NOTES[@]}"
