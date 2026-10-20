#!/usr/bin/env bash
# Runs one generation of suite A or B with `claude -p` (plan section 5, decisions 13 to 15 in section 12).
#
#   bench/run-generation.sh A 1            first run of suite A: the prompt from bench/prompt-generation.txt
#   bench/run-generation.sh A 1 followup   the one standard follow-up message, in the session of that run
#   bench/run-generation.sh A 0 check      cheap check of this script: Haiku, a temp folder, no suite change
#
# Output in bench/results/: gen-<A|B>-<n>.jsonl (all stream events), gen-<A|B>-<n>.json (the last result event),
# plus .stderr and .meta files. A follow-up adds -followup to the name. A check adds -check-<time>.
# During the run, sealed/, bench/results/, LOG.md and bench/.run/measure*.log have mode 000, so the agent cannot
# read the patch names. The outputs go to the lock folder. On exit, a trap restores the modes and the user items,
# then moves the outputs into bench/results/. If the trap cannot run (kill -9), see bench/.run/generation.lock/restore.txt.
# The script costs money. Run it only after Arsen says "yes" at checkpoint 4.
set -euo pipefail

SUITE_ID="${1:-}"; RUN="${2:-}"; MODE="${3:-first}"
case "$SUITE_ID" in A) SUITE_DIR_NAME=suite-a ;; B) SUITE_DIR_NAME=suite-b ;; *) echo "usage: $0 A|B <run> [followup]" >&2; exit 2 ;; esac
[[ "$RUN" =~ ^[0-9]+$ ]] || { echo "usage: $0 A|B <run> [followup]" >&2; exit 2; }
[[ "$MODE" == first || "$MODE" == followup || "$MODE" == check ]] || { echo "error: mode is first, followup or check" >&2; exit 2; }

LAB="$(cd "$(dirname "$0")/.." && pwd)"
SUITE="$(cd "$LAB/../harness-demo-runs/$SUITE_DIR_NAME" && pwd)"
RESULTS="$LAB/bench/results"
SEALED="$LAB/sealed"
NODE_HOME="$HOME/.local/node-v24.21.0"
NODE="$NODE_HOME/bin/node"
CLAUDE_BIN="$HOME/.local/claude-code-2.1.299/node_modules/.bin/claude"
CLAUDE_REAL="$HOME/.local/claude-code-2.1.299/node_modules/@anthropic-ai/claude-code/bin/claude.exe"
CLAUDE_SHA256="099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2"
MCP_CONFIG="$LAB/bench/mcp-playwright.json"
MODEL="claude-opus-5-5"
BUDGET_USD="40"
FOLLOWUP_TEXT="Тести падають на запущеному застосунку. Запусти їх і полагодь."
TAG="gen-$SUITE_ID-$RUN"; [ "$MODE" = first ] || TAG="$TAG-$MODE"
[ "$MODE" != check ] || TAG="$TAG-$(date +%H%M%S)"
ALLOWED_TOOLS=(
  "Bash(npx playwright test)" "Bash(npx playwright test *)" "Bash(npm run *)" "Bash(npx tsc *)" "Bash(npx eslint *)"
  "Bash(node *)" "Bash(ls)" "Bash(ls *)" "Bash(cat *)" "Bash(head *)" "Bash(tail *)" "Bash(grep *)" "Bash(wc *)"
  "Bash(echo *)" "Bash(git status)" "Bash(git status *)" "Bash(git diff)" "Bash(git diff *)" "Bash(git log *)"
  "Skill" "Agent" "Task" "mcp__playwright"
)
# Decision 15: user-level items that both suites would see. They are hidden during the run only.
USER_ITEMS=("$HOME/.claude/CLAUDE.md" "$HOME/.claude/skills/graphify" "$HOME/.claude/skills/ponytail" "$HOME/.claude/skills/ponytail-audit"
  "$HOME/.claude/skills/ponytail-debt" "$HOME/.claude/skills/ponytail-gain" "$HOME/.claude/skills/ponytail-help" "$HOME/.claude/skills/ponytail-review")
HIDE_DIR="$HOME/.claude-harness-demo-hidden"
LOCK_DIR="$LAB/bench/.run/generation.lock"
STAGE="$LOCK_DIR/out"   # the outputs of the run, while bench/results/ is locked
META="$STAGE/$TAG.meta"
# Paths with the patches or their names (the results and the log of the measurements). Mode 000 during the run.
LOCK_PATHS=("$SEALED" "$RESULTS" "$LAB/LOG.md")
for f in "$LAB"/bench/.run/measure*.log; do if [ -e "$f" ]; then LOCK_PATHS+=("$f"); fi; done

die() { echo "error: $*" >&2; exit 1; }
say() { echo "$*" | tee -a "$META"; }
rel() { echo "${1#"$LAB"/}"; }

# --- checks before anything changes ---------------------------------------------------------
for f in "$RESULTS/$TAG.json" "$RESULTS/$TAG.jsonl"; do [ ! -e "$f" ] || die "$f exists. Use another run number."; done
[ -x "$CLAUDE_BIN" ] || die "no CLI at $CLAUDE_BIN"
[ "$(shasum -a 256 "$CLAUDE_REAL" | cut -d' ' -f1)" = "$CLAUDE_SHA256" ] || die "sha256 of $CLAUDE_REAL is not $CLAUDE_SHA256"
[ -x "$NODE" ] || die "no Node at $NODE"
command -v caffeinate >/dev/null || die "no caffeinate"
[ -d "$SEALED" ] || die "no $SEALED: the patches must be sealed before the generation"
[ -f "$LAB/LOG.md" ] || die "no LOG.md"
[ -f "$LAB/bench/prompt-generation.txt" ] || die "no bench/prompt-generation.txt"
[ -z "$(git -C "$LAB/juice-shop" status --short)" ] || die "juice-shop/ has changes: a patch is applied"
"$LAB/bench/start-app.sh" status | grep -qx up || die "the app does not answer on :3000. Run: bench/start-app.sh start"
LOCK_MODES=()
for p in "${LOCK_PATHS[@]}"; do
  LOCK_MODES+=("$(stat -f '%Lp' "$p")")
  [ "${LOCK_MODES[-1]}" != 0 ] || die "$p has mode 000: a run did not restore it. See $LOCK_DIR/restore.txt"
done
if [ "$MODE" = check ]; then
  :
elif [ "$MODE" = first ]; then
  [ -z "$(git -C "$SUITE" status --short)" ] || die "$SUITE has uncommitted changes"
  [ -d "$SUITE/test-cases" ] || die "no test-cases/ in $SUITE"
  [ ! -e "$RESULTS/gen-$SUITE_ID-$RUN-followup.json" ] || die "a follow-up for this run exists"
else
  [ -f "$RESULTS/gen-$SUITE_ID-$RUN.json" ] || die "no first run $RESULTS/gen-$SUITE_ID-$RUN.json"
  SESSION_ID="$("$NODE" -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).session_id)" "$RESULTS/gen-$SUITE_ID-$RUN.json")"
  [ -n "$SESSION_ID" ] || die "no session_id in the first run"
fi
mkdir -p "$RESULTS" "$LAB/bench/.run"
mkdir "$LOCK_DIR" 2>/dev/null || die "another generation runs, or a run stopped without the restore ($LOCK_DIR). If no run is active, see $LOCK_DIR/restore.txt"
[ -e "$HIDE_DIR" ] && { rmdir "$LOCK_DIR"; die "$HIDE_DIR exists: a run did not restore the user items. Check it by hand."; }
mkdir "$STAGE"
{ for i in "${!LOCK_PATHS[@]}"; do echo "chmod ${LOCK_MODES[$i]} '${LOCK_PATHS[$i]}'"; done
  echo "# Then move CLAUDE.md from $HIDE_DIR into ~/.claude and the skill folders into ~/.claude/skills."
  echo "# Then move the files from $STAGE into $RESULTS and remove $LOCK_DIR."; } >"$LOCK_DIR/restore.txt"

# --- lock the paths and hide the user items; restore both on any exit -------------------------
restore() {
  local rc=$? i item f
  set +e
  for i in "${!LOCK_PATHS[@]}"; do
    chmod "${LOCK_MODES[$i]}" "${LOCK_PATHS[$i]}" && say "restored: chmod ${LOCK_MODES[$i]} $(rel "${LOCK_PATHS[$i]}")"
  done
  if [ -d "$HIDE_DIR" ]; then
    for item in "${USER_ITEMS[@]}"; do
      [ -e "$HIDE_DIR/$(basename "$item")" ] && mv "$HIDE_DIR/$(basename "$item")" "$item"
    done
    rmdir "$HIDE_DIR" && say "restored: user items back in ~/.claude"
  fi
  say "after: $(ls ~/.claude/skills | tr '\n' ' ')| CLAUDE.md: $([ -e ~/.claude/CLAUDE.md ] && echo present || echo missing)"
  for f in "$STAGE"/*; do [ -e "$f" ] && mv -n "$f" "$RESULTS/"; done
  if rmdir "$STAGE"; then
    META="$RESULTS/$TAG.meta"
    say "saved: $(cd "$RESULTS" && ls -d "$TAG".* | tr '\n' ' ')in bench/results/"
    rm -f "$LOCK_DIR/restore.txt" && rmdir "$LOCK_DIR"
  else
    echo "error: outputs stay in $STAGE and the lock stays. See $LOCK_DIR/restore.txt" >&2
    [ "$rc" != 0 ] || rc=1
  fi
  exit "$rc"
}
trap restore EXIT
trap 'exit 129' HUP; trap 'exit 130' INT; trap 'exit 143' TERM

: >"$META"
say "run: $TAG, mode $MODE, suite $SUITE, start $(date '+%Y-%m-%d %H:%M:%S %Z')"
say "before: $(ls ~/.claude/skills | tr '\n' ' ')| CLAUDE.md: $([ -e ~/.claude/CLAUDE.md ] && echo present || echo missing)"
chmod 000 "${LOCK_PATHS[@]}"
for i in "${!LOCK_PATHS[@]}"; do say "locked: chmod 000 $(rel "${LOCK_PATHS[$i]}") (was ${LOCK_MODES[$i]})"; done
for p in "${LOCK_PATHS[@]}"; do
  if [ -d "$p" ]; then probe=(ls "$p"); else probe=(cat "$p"); fi
  ! "${probe[@]}" >/dev/null 2>&1 || die "${probe[*]} works after chmod 000"
  say "probe: $("${probe[@]}" 2>&1 >/dev/null | head -1)"
done
mkdir "$HIDE_DIR"
for item in "${USER_ITEMS[@]}"; do [ -e "$item" ] && mv "$item" "$HIDE_DIR/"; done
say "hidden: $(ls "$HIDE_DIR" | tr '\n' ' ')"
say "during: $(ls ~/.claude/skills | tr '\n' ' ')| CLAUDE.md: $([ -e ~/.claude/CLAUDE.md ] && echo present || echo missing)"

# --- the run -----------------------------------------------------------------------------------
WORK_DIR="$SUITE"
if [ "$MODE" = check ]; then
  PROMPT="Reply with the word ok."; RESUME=(); MODEL="claude-haiku-5-5"; BUDGET_USD="0.5"; WORK_DIR="$(mktemp -d)"
elif [ "$MODE" = first ]; then
  PROMPT="$(cat "$LAB/bench/prompt-generation.txt")"; RESUME=()
else
  PROMPT="$FOLLOWUP_TEXT"; RESUME=(--resume "$SESSION_ID")
fi
say "work dir: $WORK_DIR, model $MODEL, budget $BUDGET_USD, caffeinate -i, output stream-json"
say "prompt sha256: $(printf '%s' "$PROMPT" | shasum -a 256 | cut -d' ' -f1)"
say "cli: $("$CLAUDE_BIN" --version 2>/dev/null)"
STARTED=$SECONDS
set +e
# caffeinate -i: no idle sleep of the Mac during the run. It does not stop a sleep when the lid closes.
(cd "$WORK_DIR" && caffeinate -i env -i HOME="$HOME" USER="$USER" LOGNAME="${LOGNAME:-$USER}" SHELL="${SHELL:-/bin/zsh}" TERM="${TERM:-xterm-256color}" \
  LANG="${LANG:-en_US.UTF-8}" TMPDIR="${TMPDIR:-/tmp}" PATH="$NODE_HOME/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  DISABLE_AUTOUPDATER=1 \
  "$CLAUDE_BIN" -p "$PROMPT" "${RESUME[@]}" --model "$MODEL" --output-format stream-json --verbose --max-budget-usd "$BUDGET_USD" \
  --permission-mode acceptEdits --strict-mcp-config --mcp-config "$MCP_CONFIG" --allowedTools "${ALLOWED_TOOLS[@]}" \
  >"$STAGE/$TAG.jsonl" 2>"$STAGE/$TAG.stderr")
RC=$?
set -e
say "claude exit=$RC, wall $((SECONDS - STARTED))s, end $(date '+%Y-%m-%d %H:%M:%S %Z')"
# <tag>.json is the last result event: the same object as `--output-format json` of run 1. Its total_cost_usd covers all events.
"$NODE" -e "
const fs = require('fs');
const results = fs.readFileSync(process.argv[1], 'utf8').split('\n').filter(Boolean)
  .map(l => { try { return JSON.parse(l) } catch { return {} } }).filter(e => e.type === 'result');
if (results.length === 0) process.exit(1);
const d = results.at(-1);
fs.writeFileSync(process.argv[2], JSON.stringify(d));
const pick = ({ subtype, is_error, session_id, num_turns, duration_ms, total_cost_usd, permission_denials }) =>
  ({ result_events: results.length, subtype, is_error, session_id, num_turns, duration_ms, total_cost_usd, permission_denials: (permission_denials || []).length });
console.log(JSON.stringify(pick(d)));
" "$STAGE/$TAG.jsonl" "$STAGE/$TAG.json" | tee -a "$META" || say "warning: no result event in $TAG.jsonl. See $TAG.stderr"
say "suite changes: $(git -C "$SUITE" status --short | wc -l | tr -d ' ') paths"
exit $RC
