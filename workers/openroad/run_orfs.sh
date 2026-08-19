#!/usr/bin/env bash
# Ace-Seek ORFS runner for asap7 / nangate45 platforms
# Usage: run_orfs.sh <job_dir>
# Requires OPENROAD_FLOW_ROOT and designs prepared under job_dir/orfs_design
set -euo pipefail

JOB_DIR="${1:?job_dir required}"
JOB_DIR="$(cd "$JOB_DIR" && pwd)"
ORFS_ROOT="${OPENROAD_FLOW_ROOT:-${ORFS_ROOT:-}}"
PLATFORM="${ORFS_PLATFORM:-asap7}"
DESIGN_SLUG="${DESIGN_SLUG:-ace_design}"
TOP="${DESIGN_TOP:-top}"
LOG="$JOB_DIR/run.log"
STATUS="$JOB_DIR/status.json"
TIMEOUT="${OPENLANE_TIMEOUT:-3600}"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }
write_status() {
  local st="$1" msg="$2"
  cat >"$STATUS" <<EJS
{"status":"$st","message":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$msg"),"updatedAt":"$(date -Iseconds)"}
EJS
}

if [[ -z "$ORFS_ROOT" || ! -d "$ORFS_ROOT" ]]; then
  log "ERROR: OPENROAD_FLOW_ROOT not set or missing: $ORFS_ROOT"
  write_status failed "OPENROAD_FLOW_ROOT required for platform $PLATFORM"
  exit 3
fi

PLAT_DIR="$ORFS_ROOT/platforms/$PLATFORM"
if [[ ! -d "$PLAT_DIR" ]]; then
  log "ERROR: platform missing $PLAT_DIR"
  write_status failed "ORFS platform missing: $PLATFORM"
  exit 3
fi

# Design tree expected from prepare_orfs_design.sh
DES="$JOB_DIR/orfs_design"
if [[ ! -d "$DES" ]]; then
  log "ERROR: missing orfs_design in job"
  write_status failed "missing orfs_design"
  exit 2
fi

write_status running "ORFS $PLATFORM synth→GDS (make)"
log "ORFS_ROOT=$ORFS_ROOT PLATFORM=$PLATFORM TOP=$TOP"

mkdir -p "$JOB_DIR/results"
# Prefer make inside ORFS with DESIGN_CONFIG pointing at our config.mk
CFG="$DES/config.mk"
if [[ ! -f "$CFG" ]]; then
  log "ERROR: missing $CFG"
  write_status failed "missing ORFS config.mk"
  exit 2
fi

set +e
(
  cd "$ORFS_ROOT"
  # shellcheck disable=SC1091
  if [[ -f ./env.sh ]]; then source ./env.sh; fi
  timeout "$TIMEOUT" make DESIGN_CONFIG="$CFG" 2>&1
)
rc=$?
set -e

# Collect common ORFS results
find "$ORFS_ROOT/flow/results" "$DES" "$JOB_DIR" -type f \( \
  -name '*.gds' -o -name '*.gds.gz' -o -name '*.def' -o -name 'metrics.csv' \
  -o -name '*summary*' \) 2>/dev/null | while read -r f; do
  cp -f "$f" "$JOB_DIR/results/$(basename "$f")" 2>/dev/null || true
done || true

GDS_COUNT=$(find "$JOB_DIR/results" -type f \( -name '*.gds' -o -name '*.gds.gz' \) 2>/dev/null | wc -l | tr -d ' ')
if [[ "$GDS_COUNT" -gt 0 ]]; then
  write_status succeeded "ORFS $PLATFORM complete — GDS: $GDS_COUNT (rc=$rc)"
  log "SUCCESS gds=$GDS_COUNT rc=$rc"
  exit 0
elif [[ $rc -eq 0 ]]; then
  write_status succeeded "ORFS finished rc=0 — check results/"
  exit 0
else
  write_status failed "ORFS failed rc=$rc (see run.log)"
  exit "$rc"
fi
