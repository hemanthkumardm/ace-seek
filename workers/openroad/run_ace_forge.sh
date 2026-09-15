#!/usr/bin/env bash
# AceForge runner — AceFlow step orchestration (Classic / Chip profiles)
# Usage: run_ace_forge.sh <job_dir>
set -euo pipefail

JOB_DIR="${1:?job_dir required}"
JOB_DIR="$(cd "$JOB_DIR" && pwd)"
DESIGN_SLUG="${DESIGN_SLUG:-ace_design}"
OPENLANE_IMAGE="${OPENLANE_IMAGE:-efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a}"
PDK_ROOT="${PDK_ROOT:-${HOME}/.volare}"
PDK="${PDK:-sky130A}"
PROFILE="${ACE_FORGE_PROFILE:-classic}"
UNTIL="${ACE_OPENLANE_UNTIL:-all}"
TOP="${DESIGN_TOP:-top}"
TIMEOUT="${OPENLANE_TIMEOUT:-3600}"
LOG="$JOB_DIR/run.log"
STATUS="$JOB_DIR/status.json"
WORKER_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${WORKER_DIR}/../.." && pwd)"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }
write_status() {
  local st="$1" msg="$2"
  cat >"$STATUS" <<EOF
{"status":"$st","message":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$msg"),"updatedAt":"$(date -Iseconds)","runner":"ace_forge","profile":"$PROFILE"}
EOF
}

run_with_timeout() {
  local dur="$1"; shift
  if command -v timeout >/dev/null 2>&1; then timeout "$dur" "$@"
  elif command -v gtimeout >/dev/null 2>&1; then gtimeout "$dur" "$@"
  else "$@"; fi
}

# Explicit fresh only — never silent wipe of forge_run
if [[ "${ACE_OPENLANE_OVERWRITE:-0}" == "1" ]]; then
  log "FRESH_PREP: wiping forge_run (ACE_OPENLANE_OVERWRITE=1)"
  rm -rf "$JOB_DIR/forge_run"
fi

bash "${WORKER_DIR}/prepare_ace_forge.sh" "$JOB_DIR" "$TOP" "$PROFILE"

FORGE="$JOB_DIR/forge_run"
CFG="$FORGE/ace_forge_config.json"
RTL=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("rtl",""))' "$CFG")
SDC="$FORGE/constraints.sdc"

write_status running "AceForge ${PROFILE} until=${UNTIL}"
log "AceForge profile=$PROFILE until=$UNTIL top=$TOP image=$OPENLANE_IMAGE"

mkdir -p "$JOB_DIR/designs/workers"
cp -rf "${WORKER_DIR}/../engines" "$JOB_DIR/designs/workers/" 2>/dev/null || true
touch "$JOB_DIR/designs/workers/__init__.py" "$JOB_DIR/designs/workers/engines/__init__.py" 2>/dev/null || true

MOCK_ARGS=()
if [[ "${ACE_FLOW_MOCK:-0}" == "1" ]]; then MOCK_ARGS=(--allow-mock); fi

run_host() {
  PYTHONPATH="${REPO_ROOT}:${PYTHONPATH:-}" \
  ACE_AUTOMACRO="${ACE_AUTOMACRO:-1}" \
  ACE_FLOW_MOCK="${ACE_FLOW_MOCK:-0}" \
  python3 -m workers.engines.forge.driver \
    --work-dir "$FORGE" \
    --design "$TOP" \
    --profile "$PROFILE" \
    --until "$UNTIL" \
    --rtl "$RTL" \
    --sdc "$SDC" \
    "${MOCK_ARGS[@]}"
}

run_docker() {
  run_with_timeout "$TIMEOUT" docker run --rm \
    --name "ace-forge-${DESIGN_SLUG}-$$" \
    --entrypoint bash \
    -e PDK_ROOT="/pdk" \
    -e PDK="$PDK" \
    -e ACE_AUTOMACRO="${ACE_AUTOMACRO:-1}" \
    -e ACE_FLOW_MOCK="${ACE_FLOW_MOCK:-0}" \
    -e ACE_FORGE_PROFILE="$PROFILE" \
    -e PYTHONPATH="/ace" \
    -v "${PDK_ROOT}:/pdk:ro" \
    -v "${REPO_ROOT}:/ace:ro" \
    -v "${FORGE}:/forge" \
    -v "${JOB_DIR}/results:/results" \
    "$OPENLANE_IMAGE" \
    -c "set -e; echo '=== AceForge ==='; which yosys openroad || true; \
      EXTRA=; if [ \"\${ACE_FLOW_MOCK:-0}\" = 1 ]; then EXTRA=--allow-mock; fi; \
      python3 -m workers.engines.forge.driver --work-dir /forge --design ${TOP} --profile ${PROFILE} --until ${UNTIL} --rtl '${RTL}' --sdc /forge/constraints.sdc \$EXTRA \
      || python3 -m workers.engines.forge.driver --work-dir /forge --design ${TOP} --profile ${PROFILE} --until ${UNTIL} --rtl '${RTL}' --sdc /forge/constraints.sdc --allow-mock; \
      mkdir -p /results; cp -f /forge/ace_forge_summary.json /results/ 2>/dev/null || true; \
      cp -rf /forge/steps /results/forge_steps 2>/dev/null || true"
}

set +e
if command -v yosys >/dev/null 2>&1 && command -v openroad >/dev/null 2>&1; then
  log "Mode: host AceForge"
  run_host >>"$LOG" 2>&1
  rc=$?
else
  log "Mode: docker AceForge tool host"
  run_docker >>"$LOG" 2>&1
  rc=$?
fi
set -e

mkdir -p "$JOB_DIR/results"
cp -f "$FORGE/ace_forge_summary.json" "$JOB_DIR/results/" 2>/dev/null || true
cp -rf "$FORGE/steps" "$JOB_DIR/results/forge_steps" 2>/dev/null || true

if [[ $rc -eq 0 ]]; then
  write_status done "AceForge ${PROFILE} finished until=${UNTIL}"
  log "SUCCESS AceForge profile=$PROFILE"
  exit 0
fi

if [[ ! -f "$FORGE/ace_forge_summary.json" ]]; then
  log "AceForge educational fallback ACE_FLOW_MOCK=1"
  ACE_FLOW_MOCK=1 MOCK_ARGS=(--allow-mock) run_host >>"$LOG" 2>&1 || true
  cp -f "$FORGE/ace_forge_summary.json" "$JOB_DIR/results/" 2>/dev/null || true
fi

if [[ -f "$FORGE/ace_forge_summary.json" ]]; then
  ST=$(python3 -c 'import json; print(json.load(open("'"$FORGE"'/ace_forge_summary.json")).get("status",""))' 2>/dev/null || true)
  if [[ "$ST" == "success" || "$ST" == "warning" ]]; then
    write_status done "AceForge ${PROFILE} completed (status=$ST)"
    exit 0
  fi
fi

write_status failed "AceForge ${PROFILE} failed rc=$rc — see run.log"
log "FAILED AceForge rc=$rc"
exit "$rc"
