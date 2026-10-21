#!/usr/bin/env bash
# Runs the E4 fixer sessions one after the other (frozen items 5 to 8 of bench/hypotheses-v2.md, decision 17).
#
#   caffeinate -i bench/run-fixers.sh >bench/.run/fixers.log 2>&1
#
# For each pair <folder> <tag>:
# 1. Restart the app. bench/claude-locked.sh with the frozen fixer prompt (bench/prompt-fixer.txt), Opus, the cap of
#    20 USD. The tools are those of the generation runs. ListAgents is denied (no cross-session messages).
# 2. The clean run: restart the app with build:server, run the suite of the fix folder once (--retries=0), save
#    bench/results/<tag>-clean.{json,txt}.
# 3. When the clean run fails: the one standard follow-up (the text of the generation runs) in the same session,
#    then the clean run again (<tag>-followup-clean).
# 4. git add -A, a commit "Fix session <tag>, as the agent left it" with no git hooks, and the annotated tag "fixed".
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
RUNS="$(cd "$LAB/../harness-demo-runs" && pwd -P)"
FOLLOWUP_TEXT="Тести падають на запущеному застосунку. Запусти їх і полагодь."
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }

clean_run() { # <dir> <out name>
  bench/start-app.sh stop >/dev/null 2>&1
  SKIP_BUILD=0 bench/start-app.sh start || return 2
  (cd "$1" && PLAYWRIGHT_JSON_OUTPUT_NAME="$LAB/bench/results/$2.json" npx playwright test --retries=0 --reporter=list,json) >"bench/results/$2.txt" 2>&1
  local rc=$?
  log "clean run $2: exit $rc, $(grep -E '^ +[0-9]+ (passed|failed|flaky)' "bench/results/$2.txt" | tr -s ' ' | tr '\n' ' ')"
  return $rc
}

for pair in "desk-q fixer-x1" "desk-s fixer-x2"; do
  read -r folder tag <<<"$pair"
  dir="$RUNS/$folder"
  log "RUN $tag in $folder"
  bench/start-app.sh stop >/dev/null 2>&1
  if ! SKIP_BUILD=1 bench/start-app.sh start; then FAILED+=("app start before $tag"); continue; fi
  bench/claude-locked.sh --dir "$dir" --prompt-file bench/prompt-fixer.txt --model claude-opus-5-5 --tag "$tag" --budget 20 --deny ListAgents
  rc=$?
  log "EXIT $rc $tag"
  if [ ! -f "bench/results/$tag.json" ]; then FAILED+=("$tag: no result file"); bench/start-app.sh stop; continue; fi
  [ "$rc" = 0 ] || FAILED+=("$tag exit $rc")
  if ! clean_run "$dir" "$tag-clean"; then
    sid="$(node -e "console.log(JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).session_id)" "bench/results/$tag.json")"
    log "the clean run of $tag fails: the one standard follow-up in session $sid"
    bench/claude-locked.sh --dir "$dir" --prompt-file /dev/stdin --model claude-opus-5-5 --tag "$tag-followup" --budget 20 \
      --resume "$sid" --deny ListAgents <<<"$FOLLOWUP_TEXT"
    log "EXIT $? $tag-followup"
    clean_run "$dir" "$tag-followup-clean" || FAILED+=("$tag: the clean run fails after the follow-up")
  fi
  git -C "$dir" add -A
  git -C "$dir" -c commit.gpgsign=false commit -q --no-verify --allow-empty -m "Fix session $tag, as the agent left it"
  git -C "$dir" tag -a fixed -m "The fix of $tag, unchanged"
  log "commit $(git -C "$dir" rev-parse HEAD), tree $(git -C "$dir" rev-parse 'HEAD^{tree}'), tag fixed. $(git -C "$dir" diff --shortstat HEAD~1 HEAD)"
  bench/start-app.sh stop
done
log "fixers done. Failed: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
