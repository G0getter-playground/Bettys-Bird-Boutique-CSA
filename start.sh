#!/bin/bash
# Betty's Bird Brain — one-command local dev launcher.
#
# Brings up:
#   1. MCP Toolbox        (port 5001)  — product DB tool
#   2. ADK API server     (port 8093)  — agent runtime
#   3. Next.js dev server (port 3002)  — chat UI
#
# Smart-detects services already running; only starts the missing ones.
# Ctrl+C cleanly stops everything we started this session (won't touch
# services that were already running before we got here).

set -u

ROOT="$(cd "$(dirname "$0")" && pwd)"
LOGS="$ROOT/tmp/logs"
mkdir -p "$LOGS"

TOOLBOX_PORT=5001
ADK_PORT=8093
NEXT_PORT=3002

# ── colors ────────────────────────────────────────────────────────────
if [ -t 1 ]; then
  C_BLUE=$'\033[34m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'; C_DIM=$'\033[2m'; C_RESET=$'\033[0m'
else
  C_BLUE=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_DIM=""; C_RESET=""
fi

say()   { printf "%s%s%s\n" "$1" "$2" "$C_RESET"; }
ok()    { printf "%s✓%s %-13s %s%s%s\n" "$C_GREEN" "$C_RESET" "$1" "$C_DIM" "$2" "$C_RESET"; }
work()  { printf "%s→%s %-13s %s%s%s\n" "$C_YELLOW" "$C_RESET" "$1" "$C_DIM" "$2" "$C_RESET"; }
fail()  { printf "%s✗%s %s\n" "$C_RED" "$C_RESET" "$1" >&2; }

# ── child tracking ────────────────────────────────────────────────────
STARTED_PIDS=()

cleanup() {
  trap - EXIT INT TERM
  if [ ${#STARTED_PIDS[@]} -gt 0 ]; then
    printf "\n%s→%s shutting down %d service(s)...\n" "$C_YELLOW" "$C_RESET" "${#STARTED_PIDS[@]}"
    for pid in "${STARTED_PIDS[@]}"; do
      if kill -0 "$pid" 2>/dev/null; then
        # Kill the whole process group so child processes (like the
        # node dev server's children) come down too.
        kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
      fi
    done
    sleep 0.6
    for pid in "${STARTED_PIDS[@]}"; do
      kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    done
    say "$C_DIM" "stopped."
  fi
}
trap cleanup EXIT INT TERM

# ── helpers ───────────────────────────────────────────────────────────
is_listening() { lsof -ti ":$1" >/dev/null 2>&1; }

wait_for_port() {
  # Count in half-seconds (bash 3.2 has no float arithmetic).
  local port=$1 name=$2 timeout_s=${3:-30} ticks_left=$(( ${3:-30} * 2 ))
  while [ "$ticks_left" -gt 0 ]; do
    if is_listening "$port"; then return 0; fi
    sleep 0.5
    ticks_left=$(( ticks_left - 1 ))
  done
  fail "timed out after ${timeout_s}s waiting for $name on port $port — see $LOGS for clues"
  return 1
}

# ── preflight ─────────────────────────────────────────────────────────
[ -f "$ROOT/src/.env" ]          || { fail "src/.env not found"; exit 1; }
[ -x "$ROOT/venv/bin/adk" ]      || { fail "venv/bin/adk not found — run 'python3 -m venv venv && ./venv/bin/pip install -r src/requirements.txt'"; exit 1; }
[ -x "$ROOT/toolbox" ]           || { fail "toolbox binary missing in repo root"; exit 1; }
[ -x "$ROOT/run_toolbox.sh" ]    || { fail "run_toolbox.sh missing"; exit 1; }
[ -d "$ROOT/web/node_modules" ]  || {
  work "deps" "installing web/node_modules (first run)..."
  (cd "$ROOT/web" && npm install --silent) || { fail "npm install failed"; exit 1; }
}

# ── header ────────────────────────────────────────────────────────────
printf "\n%s▍%s %sBetty's Bird Brain%s\n" "$C_BLUE" "$C_RESET" "$C_BLUE" "$C_RESET"
say "$C_DIM" "  $ROOT"
echo

# ── 1. MCP Toolbox ────────────────────────────────────────────────────
if is_listening "$TOOLBOX_PORT"; then
  ok "toolbox" "already on :$TOOLBOX_PORT"
else
  work "toolbox" "starting on :$TOOLBOX_PORT..."
  # set -m enables job control so the subshell becomes a process group leader,
  # making it kill-the-whole-tree friendly.
  ( set -m; cd "$ROOT" && exec bash run_toolbox.sh ) >"$LOGS/toolbox.log" 2>&1 &
  STARTED_PIDS+=($!)
  wait_for_port "$TOOLBOX_PORT" "toolbox" || exit 1
  ok "toolbox" "ready on :$TOOLBOX_PORT — logs: tmp/logs/toolbox.log"
fi

# ── 2. ADK API server ─────────────────────────────────────────────────
if is_listening "$ADK_PORT"; then
  ok "adk-api" "already on :$ADK_PORT"
else
  work "adk-api" "starting on :$ADK_PORT..."
  (
    set -m
    cd "$ROOT"
    set -a; . src/.env; set +a
    exec ./venv/bin/adk api_server \
      --port "$ADK_PORT" \
      --allow_origins "http://localhost:$NEXT_PORT" \
      .
  ) >"$LOGS/adk.log" 2>&1 &
  STARTED_PIDS+=($!)
  wait_for_port "$ADK_PORT" "adk-api" 45 || exit 1
  ok "adk-api" "ready on :$ADK_PORT — logs: tmp/logs/adk.log"
fi

# ── 3. Next.js dev server ─────────────────────────────────────────────
if is_listening "$NEXT_PORT"; then
  ok "web" "already on :$NEXT_PORT"
else
  work "web" "starting on :$NEXT_PORT..."
  ( set -m; cd "$ROOT/web" && exec npm run dev ) >"$LOGS/next.log" 2>&1 &
  STARTED_PIDS+=($!)
  wait_for_port "$NEXT_PORT" "web" 45 || exit 1
  ok "web" "ready on :$NEXT_PORT — logs: tmp/logs/next.log"
fi

# ── ready ─────────────────────────────────────────────────────────────
echo
printf "%s●%s All systems ready\n" "$C_GREEN" "$C_RESET"
printf "  open %shttp://localhost:%s%s\n" "$C_BLUE" "$NEXT_PORT" "$C_RESET"

if [ ${#STARTED_PIDS[@]} -eq 0 ]; then
  say "$C_DIM" "  nothing to babysit (everything was already running). exiting."
  trap - EXIT INT TERM
  exit 0
fi

printf "  %sCtrl+C to stop the %d service(s) we started%s\n\n" "$C_DIM" "${#STARTED_PIDS[@]}" "$C_RESET"

# Wait for any started service to exit (which usually means it crashed),
# then trip cleanup. `wait -n` returns when any one child exits.
if wait -n 2>/dev/null; then :; else
  # Fallback for shells without `wait -n`
  wait
fi
