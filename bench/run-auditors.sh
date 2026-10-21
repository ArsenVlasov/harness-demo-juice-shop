#!/usr/bin/env bash
# Runs the E4 auditor sessions one after the other (LOG.md, entry 21.10, 15:15; frozen items 3 and 7; decision 17).
#
#   caffeinate -i bench/run-auditors.sh >bench/.run/auditors.log 2>&1
#
# For each pair <folder> <tag>: restart the app, then bench/claude-locked.sh with the frozen auditor prompt, Opus,
# the cap of 20 USD, the lock of the app source and of build/, and no cross-session messages. The app stops after it.
set -uo pipefail
LAB="$(cd "$(dirname "$0")/.." && pwd -P)"
cd "$LAB"
FAILED=()
log() { echo "[$(date '+%H:%M:%S')] $*"; }
for pair in "desk-p auditor-x1" "desk-r auditor-x2"; do
  read -r folder tag <<<"$pair"
  log "RUN $tag in $folder"
  bench/start-app.sh stop >/dev/null 2>&1
  if ! SKIP_BUILD=1 bench/start-app.sh start; then FAILED+=("app start before $tag"); continue; fi
  bench/claude-locked.sh --dir "../harness-demo-runs/$folder" --prompt-file bench/prompt-auditor.txt --model claude-opus-5-5 \
    --tag "$tag" --budget 20 --hide-app-source --hide-app-build --deny SendMessage --deny ListAgents
  rc=$?
  log "EXIT $rc $tag"
  [ "$rc" = 0 ] || FAILED+=("$tag exit $rc")
  bench/start-app.sh stop
done
log "auditors done. Failed: ${FAILED[*]:-none}"
[ ${#FAILED[@]} -eq 0 ]
