#!/usr/bin/env bash
# The UI patch session of E5b (bench/hypotheses-v2.md, section E5b; decision 21).
#
#   bench/run-ui-patch-session.sh [--budget <usd>]       default 10
#
# The session is separate from the lab session. It sees only juice-shop/ and test-cases/ (--add-dir), and it writes the
# patches into sealed-ui/. It does not use the lock set of bench/claude-locked.sh: that set hides sealed-ui/ and juice-shop/.
# 1. Checks: no sealed-ui/ yet, juice-shop/ at v20.3.0 with no changes, no app on port 3000, the pinned CLI.
# 2. Mode 000 during the session (a trap puts the old modes back): each top-level entry of RUNS (rule of E5b),
#    LAB/sealed, LAB/LOG.md and the lab .git. bench/results/ stays open for Arsen, so it gets deny rules only.
# 3. The pinned CLI, as in bench/claude-locked.sh: env -i, Opus, bench/prompt-ui-patches.txt, the deny rules of
#    bench/ui-patch-settings.json, no MCP server, no subagents, no web.
# Outputs: bench/results/ui-patch-session.{jsonl,json,stderr,meta}. After it: the tool-call audit and the seal (in LOG.md).
set -euo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
RUNS="$(cd "$LAB/../harness-demo-runs" && pwd -P)"
BUDGET=10
[ "${1:-}" != --budget ] || { BUDGET="$2"; shift 2; }
[ $# -eq 0 ] || { echo "usage: $0 [--budget <usd>]" >&2; exit 2; }
NODE_HOME="$HOME/.local/node-v24.21.0"
CLAUDE_BIN="$HOME/.local/claude-code-2.1.299/node_modules/.bin/claude"
CLAUDE_SHA256="099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2"
OUT="$LAB/bench/results/ui-patch-session"
WORK="$LAB/sealed-ui"
APP="$LAB/juice-shop"
say() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$OUT.meta"; }
die() { echo "error: $*" >&2; exit 1; }

[ ! -e "$WORK" ] || die "$WORK exists"
[ ! -e "$OUT.jsonl" ] || die "$OUT.jsonl exists"
[ -z "$(git -C "$APP" status --porcelain)" ] || die "juice-shop/ has changes"
[ "$(git -C "$APP" describe --tags --exact-match HEAD)" = v20.3.0 ] || die "juice-shop/ is not at v20.3.0"
! lsof -nP -iTCP:3000 -sTCP:LISTEN >/dev/null 2>&1 || die "an app listens on port 3000"
[ "$(shasum -a 256 "$CLAUDE_BIN" | cut -d' ' -f1)" = "$CLAUDE_SHA256" ] || die "sha256 of $CLAUDE_BIN"

LOCK=()
for p in "$RUNS"/* "$LAB/sealed" "$LAB/LOG.md" "$LAB/.git"; do [ -e "$p" ] && LOCK+=("$p"); done
MODES=()
for p in "${LOCK[@]}"; do MODES+=("$(stat -f '%Lp' "$p")"); done
restore() {
  for i in "${!LOCK[@]}"; do chmod "${MODES[$i]}" "${LOCK[$i]}" 2>/dev/null || echo "restore failed: ${LOCK[$i]}" >&2; done
}
trap restore EXIT
trap 'exit 130' INT TERM HUP

mkdir "$WORK"
: >"$OUT.meta"
say "ui patch session: work dir $WORK, budget $BUDGET USD, cli $("$CLAUDE_BIN" --version 2>/dev/null)"
say "prompt sha256 $(shasum -a 256 "$LAB/bench/prompt-ui-patches.txt" | cut -d' ' -f1), settings sha256 $(shasum -a 256 "$LAB/bench/ui-patch-settings.json" | cut -d' ' -f1)"
say "mode 000: ${#LOCK[@]} paths: ${LOCK[*]}"
for p in "${LOCK[@]}"; do chmod 000 "$p"; done
! ls "$RUNS/set-1" >/dev/null 2>&1 || die "ls $RUNS/set-1 works after chmod 000"

STARTED=$SECONDS
set +e
(cd "$WORK" && exec caffeinate -i env -i HOME="$HOME" USER="${USER:-$(id -un)}" LOGNAME="${LOGNAME:-${USER:-$(id -un)}}" \
  SHELL="${SHELL:-/bin/zsh}" TERM="${TERM:-xterm-256color}" LANG="${LANG:-en_US.UTF-8}" TMPDIR="${TMPDIR:-/tmp}" \
  PATH="$NODE_HOME/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" DISABLE_AUTOUPDATER=1 \
  "$CLAUDE_BIN" -p "$(cat "$LAB/bench/prompt-ui-patches.txt")" --model claude-opus-5-5 --output-format stream-json --verbose \
  --max-budget-usd "$BUDGET" --permission-mode acceptEdits --strict-mcp-config \
  --settings "$LAB/bench/ui-patch-settings.json" --add-dir "$APP" "$LAB/test-cases" \
  --allowedTools Read Edit Write Glob Grep "Bash(git *)" "Bash(cd *)" "Bash(npx ng build *)" "Bash(ls *)" "Bash(cat *)" \
    "Bash(head *)" "Bash(tail *)" "Bash(grep *)" "Bash(wc *)" "Bash(diff *)" "Bash(mkdir *)" "Bash(echo *)" \
  --disallowedTools Agent Task WebFetch WebSearch SendMessage ListAgents) </dev/null >"$OUT.jsonl" 2>"$OUT.stderr"
RC=$?
set -e
restore
say "claude exit=$RC, wall $((SECONDS - STARTED))s"
"$NODE_HOME/bin/node" -e "
const fs = require('fs');
const r = fs.readFileSync(process.argv[1], 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l) } catch { return {} } }).filter(e => e.type === 'result');
if (!r.length) process.exit(1);
const d = r.at(-1); fs.writeFileSync(process.argv[2], JSON.stringify(d));
console.log(JSON.stringify({ result_events: r.length, subtype: d.subtype, is_error: d.is_error, session_id: d.session_id, num_turns: d.num_turns, total_cost_usd: d.total_cost_usd, permission_denials: (d.permission_denials || []).length }));
" "$OUT.jsonl" "$OUT.json" | tee -a "$OUT.meta" || say "warning: no result event"
say "juice-shop changes after the session: $(git -C "$APP" status --porcelain | wc -l | tr -d ' ') paths. sealed-ui: $(ls "$WORK" | tr '\n' ' ')"
exit $RC
