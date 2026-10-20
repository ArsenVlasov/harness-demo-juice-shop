#!/usr/bin/env bash
# Runs one `claude -p` session while the paths with the patches, the other runs and the user items are hidden.
# bench/run-generation.sh calls it. Other agent runs of plan v2 can call it too.
#
#   bench/claude-locked.sh --dir <work dir> --prompt-file <file> --model <id> --tag <result name>
#                          [--resume <session id>] [--budget <usd>] [--check] [--note <line>]...
#                          [--allow <tool>]... [--deny <tool>]... [--no-mcp]
#
#   --dir          the working folder of the agent. It must be inside RUNS, except with --check.
#   --prompt-file  the prompt. The script reads it before the lock. /dev/stdin also works.
#   --model        the model id, for example claude-opus-5-5.
#   --tag          the result name in bench/results/: <tag>.jsonl (all stream events), <tag>.json (the last result
#                  event), <tag>.meta (the log of this script) and <tag>.stderr.
#   --resume       continue this session (the standard follow-up). Its transcript must be in the transcript folder
#                  of the work dir.
#   --budget       --max-budget-usd. Default 40, or 0.5 with --check.
#   --check        a cheap check of this script: the work dir can be outside RUNS (a temp folder). The tag gets
#                  the suffix -check-<HHMMSS>.
#   --note         one more line for the .meta file, for example the template of the run. Repeat it for more lines.
#   --allow        a tool for --allowedTools. Repeat it for more tools. With one or more --allow, the list replaces the
#                  generation list ALLOWED_TOOLS (for other sessions, for example the vague writer of bench/vague-rule.md).
#   --deny         a tool for --disallowedTools. Repeat it for more tools.
#   --no-mcp       no MCP server: no --mcp-config (--strict-mcp-config stays, so the session gets no MCP server at all).
#
# Exit code: the exit code of claude. 2: a usage error. 1: a check before the run failed, or the restore failed.
# 129, 130 or 143: the script got HUP, INT or TERM. It stops claude and its child processes before the restore.
#
# During the run, each path in LOCK_ITEMS that exists has mode 000, and the user items are in HIDE_DIR.
# The outputs go to the lock folder bench/.run/generation.lock, which also has mode 000 during the run, because its
# file names and the .meta name the condition. On exit, a trap stops claude, restores the modes and the user items,
# then moves the outputs into bench/results/. If the trap cannot run (kill -9): chmod 755 the lock folder, then see
# its restore.txt.
# A run without --check costs money. Run it only after Arsen says "yes" (plan v2, checkpoint 4).
#
# Env, for tests only: CL_LAB, CL_RUNS, CL_VAULT_DEMO, CL_NOTES_DIR, CL_PROJECTS_DIR (the Claude transcripts),
# CL_CLAUDE_TMP (the Claude temp root), CL_USER_CLAUDE_DIR and CL_CLAUDE_BIN change the roots.
# CL_FAKE_CLAUDE=<script> runs that script with the claude arguments instead of claude. The .meta file then says
# FAKE CLAUDE.
# Bash 3.2 (macOS /bin/bash) and later.
set -euo pipefail

usage() { sed -n '4,5p' "$0" >&2; exit 2; }
die() { echo "error: $*" >&2; exit 1; }
log() { echo "[$(date +%H:%M:%S)] $*"; }

WORK_ARG=""; PROMPT_FILE=""; MODEL=""; TAG=""; SESSION_ID=""; BUDGET_USD=""; CHECK=0; NOTES=(); ALLOW=(); DENY=(); NO_MCP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --check) CHECK=1; shift; continue ;;
    --no-mcp) NO_MCP=1; shift; continue ;;
    --dir|--prompt-file|--model|--tag|--resume|--budget|--note|--allow|--deny) [ $# -ge 2 ] || usage ;;
    *) echo "error: unknown argument: $1" >&2; usage ;;
  esac
  case "$1" in
    --dir) WORK_ARG="$2" ;;
    --prompt-file) PROMPT_FILE="$2" ;;
    --model) MODEL="$2" ;;
    --tag) TAG="$2" ;;
    --resume) SESSION_ID="$2" ;;
    --budget) BUDGET_USD="$2" ;;
    --note) NOTES+=("$2") ;;
    --allow) ALLOW+=("$2") ;;
    --deny) DENY+=("$2") ;;
  esac
  shift 2
done
[ -n "$WORK_ARG" ] && [ -n "$PROMPT_FILE" ] && [ -n "$MODEL" ] && [ -n "$TAG" ] || usage
[[ "$TAG" =~ ^[A-Za-z0-9._-]+$ ]] || die "the tag can have only letters, digits, '.', '_' and '-'"
[[ "$MODEL" =~ ^[A-Za-z0-9._-]+$ ]] || die "bad model id: $MODEL"
[ -z "$SESSION_ID" ] || [[ "$SESSION_ID" =~ ^[A-Za-z0-9-]+$ ]] || die "bad session id: $SESSION_ID"
[ -n "$BUDGET_USD" ] || { if [ "$CHECK" = 1 ]; then BUDGET_USD="0.5"; else BUDGET_USD="40"; fi; }
[[ "$BUDGET_USD" =~ ^[0-9]+([.][0-9]+)?$ ]] || die "bad budget: $BUDGET_USD"
[ "$CHECK" = 0 ] || TAG="$TAG-check-$(date +%H%M%S)"

LAB="$(cd "${CL_LAB:-$(dirname "$0")/..}" && pwd -P)"
RUNS="$(cd "${CL_RUNS:-$LAB/../harness-demo-runs}" 2>/dev/null && pwd -P)" || RUNS=""
RESULTS="$LAB/bench/results"
VAULT_DEMO="${CL_VAULT_DEMO:-$HOME/Documents/aqa-harness-integration/demo}"
NOTES_DIR="${CL_NOTES_DIR:-$HOME/Library/Application Support/Claude/side-session-notes}"
PROJECTS_DIR="${CL_PROJECTS_DIR:-$HOME/.claude/projects}"
CLAUDE_TMP="${CL_CLAUDE_TMP:-/private/tmp/claude-$(id -u)}"
USER_CLAUDE="${CL_USER_CLAUDE_DIR:-$HOME/.claude}"
TMP_REAL="$(cd "${TMPDIR:-/tmp}" && pwd -P)"
NODE_HOME="$HOME/.local/node-v24.21.0"
NODE="$NODE_HOME/bin/node"
CLAUDE_BIN="${CL_CLAUDE_BIN:-$HOME/.local/claude-code-2.1.299/node_modules/.bin/claude}"
CLAUDE_SHA256="099dcc53dabbbefabed8926dab25b0318775c175a7c87bb6ba6c54fde9f8ece2"   # of the file that CLAUDE_BIN links to
FAKE_CLAUDE="${CL_FAKE_CLAUDE:-}"
MCP_CONFIG="$LAB/bench/mcp-playwright.json"
ALLOWED_TOOLS=(
  "Bash(npx playwright test)" "Bash(npx playwright test *)" "Bash(npm run *)" "Bash(npx tsc *)" "Bash(npx eslint *)"
  "Bash(node *)" "Bash(ls)" "Bash(ls *)" "Bash(cat *)" "Bash(head *)" "Bash(tail *)" "Bash(grep *)" "Bash(wc *)"
  "Bash(echo *)" "Bash(git status)" "Bash(git status *)" "Bash(git diff)" "Bash(git diff *)" "Bash(git log *)"
  "Skill" "Agent" "Task" "mcp__playwright"
)
[ ${#ALLOW[@]} -eq 0 ] || ALLOWED_TOOLS=("${ALLOW[@]}")
DENY_ARGS=(); [ ${#DENY[@]} -eq 0 ] || DENY_ARGS=(--disallowedTools "${DENY[@]}")
MCP_ARGS=(--mcp-config "$MCP_CONFIG"); [ "$NO_MCP" = 0 ] || MCP_ARGS=()
# Decision 15 of stage 1: user-level items that both suites would see. They are hidden during the run only.
USER_ITEMS=("$USER_CLAUDE/CLAUDE.md" "$USER_CLAUDE/skills/graphify" "$USER_CLAUDE/skills/ponytail"
  "$USER_CLAUDE/skills/ponytail-audit" "$USER_CLAUDE/skills/ponytail-debt" "$USER_CLAUDE/skills/ponytail-gain"
  "$USER_CLAUDE/skills/ponytail-help" "$USER_CLAUDE/skills/ponytail-review")
HIDE_DIR="$(dirname "$USER_CLAUDE")/.claude-harness-demo-hidden"
LOCK_DIR="$LAB/bench/.run/generation.lock"   # one locked run at a time, for all callers
STAGE="$LOCK_DIR/out"                        # the outputs of the run, while bench/results/ is locked
META="$STAGE/$TAG.meta"

# True when path $1 is path $2 or a path below it.
inside() { case "$1/" in "$2"/*) return 0 ;; *) return 1 ;; esac; }
rel() {
  if inside "$1" "$LAB"; then echo "LAB/${1#"$LAB"/}"
  elif [ -n "$RUNS" ] && inside "$1" "$RUNS"; then echo "RUNS/${1#"$RUNS"/}"
  elif inside "$1" "$HOME"; then echo "~/${1#"$HOME"/}"
  else echo "$1"; fi
}
say() { echo "$*" | tee -a "$META"; }
user_state() { echo "$(ls "$USER_CLAUDE/skills" 2>/dev/null | tr '\n' ' ')| CLAUDE.md: $([ -e "$USER_CLAUDE/CLAUDE.md" ] && echo present || echo missing)"; }
# The folder name that Claude Code gives to the transcripts and temp files of a working folder:
# each character that is not a letter or a digit becomes '-'.
project_key() { printf '%s' "$1" | sed 's/[^A-Za-z0-9]/-/g'; }

# Item f: at each folder level from RUNS down to the work dir, each entry that is not on the path to the work dir.
# When the work dir is outside RUNS, each top-level entry of RUNS.
runs_siblings() {
  local level rest next e
  RUNS_SIBLINGS=()
  [ -n "$RUNS" ] || return 0
  if ! inside "$WORK_DIR" "$RUNS"; then
    for e in "$RUNS"/* "$RUNS"/.[!.]* "$RUNS"/..?*; do [ -e "$e" ] && RUNS_SIBLINGS+=("$e"); done
    return 0
  fi
  level="$RUNS"; rest="${WORK_DIR#"$RUNS"/}"
  while [ -n "$rest" ]; do
    next="${rest%%/*}"
    for e in "$level"/* "$level"/.[!.]* "$level"/..?*; do
      [ -e "$e" ] && [ "$e" != "$level/$next" ] && RUNS_SIBLINGS+=("$e")
    done
    level="$level/$next"
    if [ "$rest" = "$next" ]; then rest=""; else rest="${rest#*/}"; fi
  done
  return 0
}

# Items e and g: the transcript folders (PROJECTS_DIR) and the temp folders (CLAUDE_TMP) of other Claude sessions of
# the experiment. Claude names each folder after the working folder of the session (project_key).
#   e: the sessions that wrote the patches. They started in LAB/sealed or LAB/sealed-ui.
#   g: the sessions of the other runs and suites (each work dir under RUNS, also RUNS/maintenance), the sessions in
#      the temp folder (the judge, the check runs), and the sessions in a scratchpad of a lab session (the dry run
#      of the harness). The folder of this work dir (KEY) stays open: claude writes there, and --resume reads there.
# SESSION_ITEMS: by session id (the names in these folders), the file backups, the todo lists and the temp files of
# these sessions.
other_sessions() {
  local root p id
  SEALED_SESSIONS=(); OTHER_SESSIONS=(); SESSION_ITEMS=()
  for root in "$PROJECTS_DIR" "$CLAUDE_TMP"; do
    for p in "$root"/*"$LAB_KEY-sealed"*; do [ -e "$p" ] && SEALED_SESSIONS+=("$p"); done
    for p in "$root"/*"$RUNS_KEY"* "$root"/*"$TMP_KEY-"* "$root"/*"$LAB_KEY-"*scratchpad*; do
      case "$(basename "$p")" in "$KEY"|"$LAB_KEY") continue ;; esac
      [ -e "$p" ] && OTHER_SESSIONS+=("$p")
    done
  done
  for id in $(session_ids ${SEALED_SESSIONS[@]+"${SEALED_SESSIONS[@]}"} ${OTHER_SESSIONS[@]+"${OTHER_SESSIONS[@]}"}); do
    for p in "$USER_CLAUDE/file-history/$id" "$USER_CLAUDE/todos/$id"* "$CLAUDE_TMP"/*"$id"*; do
      [ -e "$p" ] && SESSION_ITEMS+=("$p")
    done
  done
  return 0
}
# The session ids (UUIDs) at the start of the entry names in the folders of the arguments.
UUID_RE='^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})'
session_ids() {
  local d e n
  for d in "$@"; do
    [ -d "$d" ] || continue
    for e in "$d"/*; do
      n="$(basename "$e")"
      if [[ "$n" =~ $UUID_RE ]]; then echo "${BASH_REMATCH[1]}"; fi
    done
  done | sort -u
}

# --- checks before anything changes ---------------------------------------------------------
WORK_DIR="$(cd "$WORK_ARG" 2>/dev/null && pwd -P)" || die "no work dir $WORK_ARG"
[ -r "$PROMPT_FILE" ] || die "cannot read the prompt file $PROMPT_FILE"
PROMPT="$(cat "$PROMPT_FILE")"
[ -n "$PROMPT" ] || die "the prompt file $PROMPT_FILE is empty"
inside "$LAB" "$WORK_DIR" && die "the work dir $WORK_DIR holds the lab"
inside "$WORK_DIR" "$LAB" && die "the work dir $WORK_DIR is inside the lab. Claude would load the lab CLAUDE.md"
if [ -n "$RUNS" ]; then
  inside "$RUNS" "$WORK_DIR" && die "the work dir $WORK_DIR is RUNS or holds it"
  [ "$CHECK" = 1 ] || inside "$WORK_DIR" "$RUNS" || die "the work dir $WORK_DIR is not inside RUNS ($RUNS). Use --check for a temp folder"
else
  [ "$CHECK" = 1 ] || die "no RUNS folder: ${CL_RUNS:-$LAB/../harness-demo-runs}"
fi
KEY="$(project_key "$WORK_DIR")"; LAB_KEY="$(project_key "$LAB")"; TMP_KEY="$(project_key "$TMP_REAL")"
RUNS_KEY="$(project_key "${RUNS:-${CL_RUNS:-$LAB/../harness-demo-runs}}")"
if [ -n "$SESSION_ID" ]; then
  [ -f "$PROJECTS_DIR/$KEY/$SESSION_ID.jsonl" ] || die "no transcript $PROJECTS_DIR/$KEY/$SESSION_ID.jsonl for --resume $SESSION_ID"
fi
[ -d "$LAB/sealed" ] || die "no $LAB/sealed: the patches must be sealed before a locked run"
for ext in json jsonl meta stderr; do [ ! -e "$RESULTS/$TAG.$ext" ] || die "$RESULTS/$TAG.$ext exists. Use another tag"; done
[ -x "$CLAUDE_BIN" ] || die "no CLI at $CLAUDE_BIN"
[ "$(shasum -a 256 "$CLAUDE_BIN" | cut -d' ' -f1)" = "$CLAUDE_SHA256" ] || die "sha256 of $CLAUDE_BIN is not $CLAUDE_SHA256"
[ -z "$FAKE_CLAUDE" ] || [ -x "$FAKE_CLAUDE" ] || die "CL_FAKE_CLAUDE is not an executable file: $FAKE_CLAUDE"
[ -x "$NODE" ] || die "no Node at $NODE"
[ -f "$MCP_CONFIG" ] || die "no $MCP_CONFIG"
command -v caffeinate >/dev/null || die "no caffeinate"
mkdir -p "$RESULTS" "$LAB/bench/.run"

runs_siblings
other_sessions
# The lock list: one line for each item, so that one line removes an item. Only the items that exist get locked.
# Items a to f and the run folders of item f: decision 2 of plan v2 (20.10, 12:13).
# The temp folders and the session items of e, item g and item h: a proposal after the review of 20.10. Arsen decides.
LOCK_ITEMS=(
  "$LAB/sealed"                                             # a. the bug patches
  "$LAB/sealed-ui"                                          # a. the UI patches of E5b
  "$RESULTS"                                                # a. the measurement results name the patches
  "$LAB/LOG.md"                                             # a. the experiment log names the patches
  "$LAB"/bench/.run/*.log                                   # a. each log in bench/.run: a chain log can hold the run-mutants output with the patch names
  "$LAB/.git"                                               # b. old lab commits hold old results and the log
  "$VAULT_DEMO"                                             # c. the vault drafts list the patches
  "$NOTES_DIR/local_a3dc1777-17a1-4371-8e97-915ff53d29a0"   # d. a note file there lists the patch file names
  ${SEALED_SESSIONS[@]+"${SEALED_SESSIONS[@]}"}             # e. the transcripts and temp files of the sessions that wrote the patches
  ${RUNS_SIBLINGS[@]+"${RUNS_SIBLINGS[@]}"}                 # f. in RUNS: templates, other conditions, runs, suites
  ${OTHER_SESSIONS[@]+"${OTHER_SESSIONS[@]}"}               # g. the transcripts and temp files of other runs, the judge, check runs, the B dry run
  ${SESSION_ITEMS[@]+"${SESSION_ITEMS[@]}"}                 # e and g. the file backups, todo lists and temp files of these sessions, by session id
  "$LAB"/test-cases*                                        # h. the lab copies of the test case sets: a run of one set must not see the other set
  "$LAB/README.md"                                          # h. the lab README has the results of run 1
  "$LAB"/bench/*.md                                         # h. the translation rule to the vague set (it quotes the precise values), the hypotheses, the rubric
  "$LAB/bench/conditions.json"                              # h. it maps the neutral folder names set-<k> to the conditions
)
# Not locked:
# - the transcripts and the temp folder of the lab session ($PROJECTS_DIR/$LAB_KEY, $CLAUDE_TMP/$LAB_KEY), decision 2.
#   The lab session writes there during the run, and a lock would stop it. The audit of the tool calls after each run
#   covers these folders.
# - the transcript and temp folders of this work dir ($PROJECTS_DIR/$KEY, $CLAUDE_TMP/$KEY): claude writes there.
# - Bash(node *) stays in ALLOWED_TOOLS (decision 2). The agent runs its own scripts with node, and the locks also stop node.
# - LAB/bench/mcp-playwright.json (claude reads it) and LAB/juice-shop (the app source was open in run 1 too).
KEEP_OPEN=("$WORK_DIR" "$PROJECTS_DIR/$KEY" "$CLAUDE_TMP/$KEY" "$PROJECTS_DIR/$LAB_KEY" "$CLAUDE_TMP/$LAB_KEY" "$MCP_CONFIG"
  "$LOCK_DIR" "$HIDE_DIR" "$USER_CLAUDE/skills" "$USER_CLAUDE/settings.json")
if [ -n "${CLAUDE_CODE_SESSION_ID:-}" ]; then   # the Claude session that runs this script, when there is one
  KEEP_OPEN+=("$USER_CLAUDE/file-history/$CLAUDE_CODE_SESSION_ID" "$CLAUDE_TMP/cache-break-state-$CLAUDE_CODE_SESSION_ID.json")
fi
CANDIDATES=()
for p in "${LOCK_ITEMS[@]}"; do
  [ -e "$p" ] || continue
  for k in "${KEEP_OPEN[@]}"; do inside "$k" "$p" && die "the lock item $p holds $k, which must stay open"; done
  CANDIDATES+=("$p")
done
# Only the top items: chmod 000 on a folder stops a later chmod below it. And each path one time.
LOCK_PATHS=(); LOCK_MODES=()
for p in ${CANDIDATES[@]+"${CANDIDATES[@]}"}; do
  skip=0
  for q in "${CANDIDATES[@]}"; do [ "$q" != "$p" ] && inside "$p" "$q" && skip=1 && break; done
  for q in ${LOCK_PATHS[@]+"${LOCK_PATHS[@]}"}; do [ "$q" = "$p" ] && skip=1 && break; done
  [ "$skip" = 0 ] || continue
  LOCK_PATHS+=("$p")
  LOCK_MODES+=("$(stat -L -f '%Lp' "$p")")
  [ "${LOCK_MODES[${#LOCK_MODES[@]}-1]}" != 0 ] || die "$p has mode 000: a run did not restore it. See $LOCK_DIR/restore.txt"
done

mkdir "$LOCK_DIR" 2>/dev/null || die "another locked run is active, or a run stopped without the restore ($LOCK_DIR). If no run is active: chmod 755 it, then see its restore.txt"
[ ! -e "$HIDE_DIR" ] || { rmdir "$LOCK_DIR"; die "$HIDE_DIR exists: a run did not restore the user items. Check it by hand."; }
mkdir "$STAGE"
LOCK_DIR_MODE="$(stat -f '%Lp' "$LOCK_DIR")"
{ echo "# Restore by hand, only when the run stopped without its trap (kill -9). Stop claude first: pgrep -fl claude"
  for ((i = 0; i < ${#LOCK_PATHS[@]}; i++)); do printf 'chmod %s %q\n' "${LOCK_MODES[$i]}" "${LOCK_PATHS[$i]}"; done
  printf '# Then move CLAUDE.md from %q into %q and the skill folders into %q.\n' "$HIDE_DIR" "$USER_CLAUDE" "$USER_CLAUDE/skills"
  printf '# Then move the files from %q into %q and remove %q.\n' "$STAGE" "$RESULTS" "$LOCK_DIR"
} >"$LOCK_DIR/restore.txt"

# --- lock the paths and hide the user items; restore both on any exit -------------------------
CHILD=""; STAGE_LOCKED=0
# True when one of the processes runs (a zombie does not count).
alive() { local p; for p in "$@"; do ps -o stat= -p "$p" 2>/dev/null | grep -qv Z && return 0; done; return 1; }
descendants() { local c; for c in $(pgrep -P "$1" 2>/dev/null); do descendants "$c"; echo "$c"; done; }
unlock_stage() { if [ "$STAGE_LOCKED" = 1 ]; then chmod "$LOCK_DIR_MODE" "$LOCK_DIR" && STAGE_LOCKED=0; fi; }
stop_child() {
  [ -n "$CHILD" ] || return 0
  local pids n=0
  pids="$(descendants "$CHILD" | tr '\n' ' ')$CHILD"
  if alive $pids; then
    kill -TERM $pids 2>/dev/null
    while [ "$n" -lt 20 ] && alive $pids; do sleep 0.5; n=$((n + 1)); done
    kill -KILL $pids 2>/dev/null
    say "stopped: claude and its child processes (pids $pids)"
  fi
  wait "$CHILD" 2>/dev/null
  CHILD=""
}
restore() {
  local rc=$? i item f
  trap '' HUP INT TERM
  set +e
  unlock_stage
  stop_child
  for ((i = ${#LOCK_PATHS[@]} - 1; i >= 0; i--)); do
    chmod "${LOCK_MODES[$i]}" "${LOCK_PATHS[$i]}" && say "restored: chmod ${LOCK_MODES[$i]} $(rel "${LOCK_PATHS[$i]}")"
  done
  if [ -d "$HIDE_DIR" ]; then
    for item in "${USER_ITEMS[@]}"; do
      [ -e "$HIDE_DIR/$(basename "$item")" ] && mv "$HIDE_DIR/$(basename "$item")" "$item"
    done
    rmdir "$HIDE_DIR" && say "restored: user items back in $USER_CLAUDE"
  fi
  say "after: $(user_state)"
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
# Each signal trap first ignores more signals: a second signal must not stop the restore.
trap 'trap "" HUP INT TERM; exit 129' HUP
trap 'trap "" HUP INT TERM; exit 130' INT
trap 'trap "" HUP INT TERM; exit 143' TERM

: >"$META"
say "run: $TAG, work dir $WORK_DIR, start $(date '+%Y-%m-%d %H:%M:%S %Z')$([ "$CHECK" = 0 ] || echo ', check run')$([ -z "$FAKE_CLAUDE" ] || echo ", FAKE CLAUDE $FAKE_CLAUDE")"
for ((i = 0; i < ${#NOTES[@]}; i++)); do say "note: ${NOTES[$i]}"; done
say "transcript folder of the work dir (stays open): $KEY"
say "before: $(user_state)"
for ((i = 0; i < ${#LOCK_PATHS[@]}; i++)); do
  chmod 000 "${LOCK_PATHS[$i]}"
  say "locked: chmod 000 $(rel "${LOCK_PATHS[$i]}") (was ${LOCK_MODES[$i]})"
done
for ((i = 0; i < ${#LOCK_PATHS[@]}; i++)); do
  p="${LOCK_PATHS[$i]}"
  if [ -d "$p" ]; then probe=(ls "$p"); else probe=(cat "$p"); fi
  ! "${probe[@]}" >/dev/null 2>&1 || die "${probe[*]} works after chmod 000"
  say "probe: $("${probe[@]}" 2>&1 >/dev/null | head -1)"
done
mkdir "$HIDE_DIR"
for item in "${USER_ITEMS[@]}"; do if [ -e "$item" ]; then mv "$item" "$HIDE_DIR/"; fi; done
say "hidden: $(ls "$HIDE_DIR" | tr '\n' ' ')"
say "during: $(user_state)"

# --- the run -----------------------------------------------------------------------------------
RESUME=(); [ -z "$SESSION_ID" ] || RESUME=(--resume "$SESSION_ID")
CMD="$CLAUDE_BIN"; [ -z "$FAKE_CLAUDE" ] || CMD="$FAKE_CLAUDE"
say "model $MODEL, budget $BUDGET_USD, caffeinate -i, output stream-json$([ -z "$SESSION_ID" ] || echo ", resume $SESSION_ID")"
say "allowed tools: ${ALLOWED_TOOLS[*]}"
say "disallowed tools: ${DENY[*]:-none}. MCP: $([ "$NO_MCP" = 1 ] && echo 'none (--strict-mcp-config, no --mcp-config)' || echo "$(rel "$MCP_CONFIG")")"
say "prompt sha256: $(printf '%s' "$PROMPT" | shasum -a 256 | cut -d' ' -f1)"
if [ -z "$FAKE_CLAUDE" ]; then say "cli: $("$CLAUDE_BIN" --version 2>/dev/null)"; else say "cli: FAKE CLAUDE $FAKE_CLAUDE (test only, not the pinned CLI)"; fi
say "locked during the run: chmod 000 $(rel "$LOCK_DIR") (was $LOCK_DIR_MODE): the outputs and this log"
# claude writes through these descriptors, so the lock folder can have mode 000 during the run.
exec 3>"$STAGE/$TAG.jsonl" 4>"$STAGE/$TAG.stderr"
STAGE_LOCKED=1; chmod 000 "$LOCK_DIR"
! ls "$LOCK_DIR" >/dev/null 2>&1 || die "ls $LOCK_DIR works after chmod 000"
STAGE_PROBE="$(ls "$LOCK_DIR" 2>&1 >/dev/null | head -1 || true)"
STARTED=$SECONDS
log "claude runs in $WORK_DIR. Outputs: $STAGE"
set +e
# caffeinate -i: no idle sleep of the Mac during the run. It does not stop a sleep when the lid closes.
# The run is a background job, so that a signal stops `wait` at once and the trap can stop claude before the restore.
(cd "$WORK_DIR" && exec caffeinate -i env -i HOME="$HOME" USER="${USER:-$(id -un)}" LOGNAME="${LOGNAME:-${USER:-$(id -un)}}" \
  SHELL="${SHELL:-/bin/zsh}" TERM="${TERM:-xterm-256color}" LANG="${LANG:-en_US.UTF-8}" TMPDIR="${TMPDIR:-/tmp}" \
  PATH="$NODE_HOME/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" DISABLE_AUTOUPDATER=1 \
  "$CMD" -p "$PROMPT" ${RESUME[@]+"${RESUME[@]}"} --model "$MODEL" --output-format stream-json --verbose \
  --max-budget-usd "$BUDGET_USD" --permission-mode acceptEdits --strict-mcp-config ${MCP_ARGS[@]+"${MCP_ARGS[@]}"} \
  --allowedTools "${ALLOWED_TOOLS[@]}" ${DENY_ARGS[@]+"${DENY_ARGS[@]}"}) </dev/null >&3 2>&4 3>&- 4>&- &
CHILD=$!
wait "$CHILD"
RC=$?
CHILD=""
set -e
unlock_stage
exec 3>&- 4>&-
say "probe during the run: ls $(rel "$LOCK_DIR"): $STAGE_PROBE"
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
if git -C "$WORK_DIR" rev-parse --git-dir >/dev/null 2>&1; then
  say "work dir changes: $(git -C "$WORK_DIR" status --short | wc -l | tr -d ' ') paths"
fi
exit $RC
