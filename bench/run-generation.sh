#!/usr/bin/env bash
# Runs one generation of suite A or B with `claude -p` (plan section 5, decisions 13 to 15 in section 12).
#
#   bench/run-generation.sh A 1            first run of suite A: the prompt from bench/prompt-generation.txt
#   bench/run-generation.sh A 1 followup   the one standard follow-up message, in the session of that run
#   bench/run-generation.sh A 0 check      cheap check of this script: Haiku, a temp folder, no suite change
#
# Output: bench/results/gen-<A|B>-<n>.json (and -followup.json), plus .stderr and .meta files.
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
CLAUDE_BIN="$HOME/.local/claude-code-2.1.299/node_modules/.bin/claude"
CLAUDE_REAL="$HOME/.local/claude-code-2.1.299/node_modules/@anthropic-ai/claude-code/bin/claude.exe"
CLAUDE_SHA256="099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2"
MCP_CONFIG="$LAB/bench/mcp-playwright.json"
MODEL="claude-opus-5-5"
BUDGET_USD="40"
FOLLOWUP_TEXT="Тести падають на запущеному застосунку. Запусти їх і полагодь."
TAG="gen-$SUITE_ID-$RUN"; [ "$MODE" = first ] || TAG="$TAG-$MODE"
OUT="$RESULTS/$TAG.json"; ERR="$RESULTS/$TAG.stderr"; META="$RESULTS/$TAG.meta"
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

die() { echo "error: $*" >&2; exit 1; }
say() { echo "$*" | tee -a "$META"; }

# --- checks before anything changes ---------------------------------------------------------
[ -e "$OUT" ] && die "$OUT exists. Use another run number."
[ -x "$CLAUDE_BIN" ] || die "no CLI at $CLAUDE_BIN"
[ "$(shasum -a 256 "$CLAUDE_REAL" | cut -d' ' -f1)" = "$CLAUDE_SHA256" ] || die "sha256 of $CLAUDE_REAL is not $CLAUDE_SHA256"
[ -d "$SEALED" ] || die "no $SEALED: the patches must be sealed before the generation"
[ -f "$LAB/bench/prompt-generation.txt" ] || die "no bench/prompt-generation.txt"
[ -z "$(git -C "$LAB/juice-shop" status --short)" ] || die "juice-shop/ has changes: a patch is applied"
"$LAB/bench/start-app.sh" status | grep -qx up || die "the app does not answer on :3000. Run: bench/start-app.sh start"
if [ "$MODE" = check ]; then
  :
elif [ "$MODE" = first ]; then
  [ -z "$(git -C "$SUITE" status --short)" ] || die "$SUITE has uncommitted changes"
  [ -d "$SUITE/test-cases" ] || die "no test-cases/ in $SUITE"
  [ ! -e "$RESULTS/gen-$SUITE_ID-$RUN-followup.json" ] || die "a follow-up for this run exists"
else
  [ -f "$RESULTS/gen-$SUITE_ID-$RUN.json" ] || die "no first run $RESULTS/gen-$SUITE_ID-$RUN.json"
  SESSION_ID="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).session_id)" "$RESULTS/gen-$SUITE_ID-$RUN.json")"
  [ -n "$SESSION_ID" ] || die "no session_id in the first run"
fi
mkdir -p "$RESULTS" "$LAB/bench/.run"
mkdir "$LOCK_DIR" 2>/dev/null || die "another generation runs ($LOCK_DIR). A and B run one after the other."
[ -e "$HIDE_DIR" ] && { rmdir "$LOCK_DIR"; die "$HIDE_DIR exists: a run did not restore the user items. Check it by hand."; }

# --- lock sealed/ and hide the user items; restore both on any exit ---------------------------
SEALED_MODE="$(stat -f '%Lp' "$SEALED")"
restore() {
  local rc=$?
  chmod "$SEALED_MODE" "$SEALED" && say "restored: chmod $SEALED_MODE sealed/"
  if [ -d "$HIDE_DIR" ]; then
    for item in "${USER_ITEMS[@]}"; do
      [ -e "$HIDE_DIR/$(basename "$item")" ] && mv "$HIDE_DIR/$(basename "$item")" "$item"
    done
    rmdir "$HIDE_DIR" && say "restored: user items back in ~/.claude"
  fi
  say "after: $(ls ~/.claude/skills | tr '\n' ' ')| CLAUDE.md: $([ -e ~/.claude/CLAUDE.md ] && echo present || echo missing)"
  rmdir "$LOCK_DIR" 2>/dev/null || true
  exit $rc
}
trap restore EXIT INT TERM

: >"$META"
say "run: $TAG, mode $MODE, suite $SUITE, start $(date '+%Y-%m-%d %H:%M:%S %Z')"
say "before: $(ls ~/.claude/skills | tr '\n' ' ')| CLAUDE.md: $([ -e ~/.claude/CLAUDE.md ] && echo present || echo missing)"
chmod 000 "$SEALED"; say "locked: chmod 000 sealed/ (was $SEALED_MODE)"
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
say "work dir: $WORK_DIR, model $MODEL, budget $BUDGET_USD"
say "prompt sha256: $(printf '%s' "$PROMPT" | shasum -a 256 | cut -d' ' -f1)"
say "cli: $("$CLAUDE_BIN" --version 2>/dev/null)"
STARTED=$SECONDS
set +e
(cd "$WORK_DIR" && env -i HOME="$HOME" USER="$USER" LOGNAME="${LOGNAME:-$USER}" SHELL="${SHELL:-/bin/zsh}" TERM="${TERM:-xterm-256color}" \
  LANG="${LANG:-en_US.UTF-8}" TMPDIR="${TMPDIR:-/tmp}" PATH="$NODE_HOME/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" \
  DISABLE_AUTOUPDATER=1 \
  "$CLAUDE_BIN" -p "$PROMPT" "${RESUME[@]}" --model "$MODEL" --output-format json --max-budget-usd "$BUDGET_USD" \
  --permission-mode acceptEdits --strict-mcp-config --mcp-config "$MCP_CONFIG" --allowedTools "${ALLOWED_TOOLS[@]}" \
  >"$OUT" 2>"$ERR")
RC=$?
set -e
say "claude exit=$RC, wall $((SECONDS - STARTED))s, end $(date '+%Y-%m-%d %H:%M:%S %Z')"
node -e "
const d = JSON.parse(require('fs').readFileSync(process.argv[1], 'utf8'));
const pick = ({ subtype, is_error, session_id, num_turns, duration_ms, total_cost_usd, permission_denials }) =>
  ({ subtype, is_error, session_id, num_turns, duration_ms, total_cost_usd, permission_denials: (permission_denials || []).length });
console.log(JSON.stringify(pick(d)));
" "$OUT" | tee -a "$META" || say "warning: $OUT is not JSON. See $ERR"
say "suite changes: $(git -C "$SUITE" status --short | wc -l | tr -d ' ') paths"
exit $RC
