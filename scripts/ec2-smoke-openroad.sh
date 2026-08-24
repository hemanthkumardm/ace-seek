#!/usr/bin/env bash
# Ace-Seek OpenROAD — EC2 / host smoke checklist (read-mostly + optional API ping)
# Run on the box that hosts Next.js + Docker OpenLane:
#   bash scripts/ec2-smoke-openroad.sh
#   ACE_KEY=ace_... BASE_URL=http://127.0.0.1:3000 bash scripts/ec2-smoke-openroad.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0
FAIL=0
WARN=0

ok() { echo "  OK  $*"; PASS=$((PASS + 1)); }
bad() { echo "  FAIL $*"; FAIL=$((FAIL + 1)); }
warn() { echo "  WARN $*"; WARN=$((WARN + 1)); }

echo "=== Ace-Seek OpenROAD EC2 smoke ==="
echo "root=$ROOT"
echo "date=$(date -Is)"
echo ""

echo "-- Node / Docker / PDK --"
if command -v node >/dev/null 2>&1; then
  ok "node $(node -v)"
else
  bad "node not on PATH"
fi
if command -v docker >/dev/null 2>&1; then
  if docker info >/dev/null 2>&1; then
    ok "docker daemon reachable"
  else
    bad "docker installed but daemon not reachable (group/permission?)"
  fi
else
  bad "docker not on PATH"
fi

PDK_ROOT="${PDK_ROOT:-$HOME/.volare}"
PDK="${PDK:-sky130A}"
if [[ -d "$PDK_ROOT/$PDK" ]]; then
  ok "PDK at $PDK_ROOT/$PDK"
else
  bad "PDK missing: $PDK_ROOT/$PDK (volare enable --pdk sky130)"
fi

echo ""
echo "-- OPENROAD_JOBS_DIR --"
JOBS="${OPENROAD_JOBS_DIR:-}"
if [[ -z "$JOBS" ]]; then
  if [[ "${NODE_ENV:-}" == "production" ]]; then
    bad "OPENROAD_JOBS_DIR unset in production (must be durable, not /tmp)"
  else
    warn "OPENROAD_JOBS_DIR unset — default /tmp/ace-openroad-jobs (dev only)"
    JOBS="/tmp/ace-openroad-jobs"
  fi
else
  if [[ "$JOBS" == /tmp || "$JOBS" == /tmp/* ]]; then
    if [[ "${NODE_ENV:-}" == "production" ]]; then
      bad "OPENROAD_JOBS_DIR under /tmp in production: $JOBS"
    else
      warn "OPENROAD_JOBS_DIR under /tmp: $JOBS"
    fi
  else
    ok "OPENROAD_JOBS_DIR=$JOBS"
  fi
fi
mkdir -p "$JOBS/owners" 2>/dev/null && ok "can write $JOBS/owners" || bad "cannot mkdir $JOBS/owners"

echo ""
echo "-- Worker scripts --"
for f in prepare_design.sh run_openlane.sh run_until.tcl pack_checkpoint.sh queue_worker.mjs; do
  p="$ROOT/workers/openroad/$f"
  if [[ -f "$p" ]]; then
    ok "workers/openroad/$f"
  else
    bad "missing $p"
  fi
done

echo ""
echo "-- Concurrency / queue env --"
echo "  OPENROAD_MAX_CONCURRENT_JOBS=${OPENROAD_MAX_CONCURRENT_JOBS:-1 (default)}"
echo "  OPENROAD_QUEUE_EXTERNAL=${OPENROAD_QUEUE_EXTERNAL:-0 (Next dispatches)}"
echo "  OPENROAD_ARTIFACT_S3_BUCKET=${OPENROAD_ARTIFACT_S3_BUCKET:-(local disk only)}"

echo ""
echo "-- Optional API ping --"
BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
ACE_KEY="${ACE_KEY:-}"
if [[ -n "$ACE_KEY" ]]; then
  if command -v curl >/dev/null 2>&1; then
    code=$(curl -s -o /tmp/ace-or-pdks.json -w "%{http_code}" \
      -H "x-api-key: $ACE_KEY" "$BASE_URL/api/openroad/pdks" || true)
    if [[ "$code" == "200" ]]; then
      ok "GET $BASE_URL/api/openroad/pdks → 200"
      if command -v python3 >/dev/null 2>&1; then
        python3 - <<'PY' || true
import json
try:
  d=json.load(open("/tmp/ace-or-pdks.json"))
  print("       jobsRoot=", d.get("jobsRoot"))
  print("       jobsRootError=", d.get("jobsRootError"))
except Exception as e:
  print("       parse err", e)
PY
      fi
    else
      bad "GET /api/openroad/pdks → HTTP $code (is Next running? key valid?)"
    fi
    code2=$(curl -s -o /tmp/ace-or-run.json -w "%{http_code}" \
      -H "x-api-key: $ACE_KEY" "$BASE_URL/api/openroad/run" || true)
    if [[ "$code2" == "200" ]]; then
      ok "GET /api/openroad/run diagnostics → 200"
    else
      warn "GET /api/openroad/run → HTTP $code2"
    fi
  else
    warn "curl missing — skip API ping"
  fi
else
  warn "ACE_KEY unset — skip authenticated API ping"
  echo "       export ACE_KEY=… BASE_URL=http://127.0.0.1:3000 and re-run"
fi

echo ""
echo "=== Summary: PASS=$PASS WARN=$WARN FAIL=$FAIL ==="
if [[ "$FAIL" -gt 0 ]]; then
  echo "Smoke FAILED — fix FAIL items before hosting users."
  exit 1
fi
echo "Smoke OK (warnings allowed)."
exit 0
