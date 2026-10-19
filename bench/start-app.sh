#!/usr/bin/env bash
# Builds the Juice Shop server, starts it in quiet mode and waits until it answers.
#
#   bench/start-app.sh start    build:server, start, wait for GET /rest/admin/application-version = 200
#   bench/start-app.sh stop     stop the app that `start` started
#   bench/start-app.sh status   print "up" or "down"
#
# Env: PORT (default 3000), WAIT_SECONDS (default 180), SKIP_BUILD=1 to skip build:server.
# The frontend is built once by `npm install` in juice-shop/. This script does not rebuild it.
set -euo pipefail

LAB="$(cd "$(dirname "$0")/.." && pwd)"
APP="$LAB/juice-shop"
PORT="${PORT:-3000}"
WAIT_SECONDS="${WAIT_SECONDS:-180}"
RUN_DIR="$LAB/bench/.run"
PID_FILE="$RUN_DIR/app-$PORT.pid"
LOG_FILE="$RUN_DIR/app-$PORT.log"
URL="http://localhost:$PORT/rest/admin/application-version"

# Angular CLI of v20.3.0 needs Node >=22.22.3 or >=24.15.0. The system Node is older,
# so use the prebuilt Node 24 from nodejs.org (plan, section 12). NODE_HOME overrides it.
NODE_HOME="${NODE_HOME:-$HOME/.local/node-v24.21.0}"
if [ ! -x "$NODE_HOME/bin/node" ]; then
  echo "error: no Node at $NODE_HOME/bin/node. Set NODE_HOME." >&2
  exit 1
fi
export PATH="$NODE_HOME/bin:$PATH"

http_code() { curl -s -o /dev/null -w '%{http_code}' --max-time 2 "$URL" || true; }

start() {
  if [ "$(http_code)" = "200" ]; then
    echo "error: port $PORT already answers. Run '$0 stop' or use another PORT." >&2
    exit 1
  fi
  if [ ! -f "$APP/frontend/dist/frontend/index.html" ]; then
    echo "error: no frontend build. Run 'npm install' in $APP first." >&2
    exit 1
  fi
  mkdir -p "$RUN_DIR"
  if [ "${SKIP_BUILD:-0}" != "1" ]; then
    (cd "$APP" && npm run --silent build:server)
  fi
  # exec: the PID file must hold the node process, not a bash wrapper. Else `stop` leaves node running.
  (cd "$APP" && NODE_ENV=quiet PORT="$PORT" exec nohup node build/app) >"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  local started=$SECONDS
  until [ "$(http_code)" = "200" ]; do
    if ! kill -0 "$(cat "$PID_FILE")" 2>/dev/null; then
      echo "error: the app stopped. Log: $LOG_FILE" >&2
      tail -20 "$LOG_FILE" >&2
      exit 1
    fi
    if [ $((SECONDS - started)) -ge "$WAIT_SECONDS" ]; then
      echo "error: no 200 from $URL after ${WAIT_SECONDS}s. Log: $LOG_FILE" >&2
      stop
      exit 1
    fi
    sleep 1
  done
  echo "up: $URL = 200 after $((SECONDS - started))s, node $(node -v), pid $(cat "$PID_FILE")"
}

stop() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE")"
    kill "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
    kill -9 "$pid" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  if [ "$(http_code)" = "200" ]; then
    echo "error: port $PORT still answers. Another process holds it." >&2
    exit 1
  fi
  echo "down: port $PORT"
}

case "${1:-}" in
  start) start ;;
  stop) stop ;;
  status) [ "$(http_code)" = "200" ] && echo up || echo down ;;
  *) echo "usage: $0 start|stop|status" >&2; exit 2 ;;
esac
