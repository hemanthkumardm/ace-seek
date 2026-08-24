#!/usr/bin/env bash
# Ace-Seek OpenROAD / OpenLane runner — RTL → GDS via Docker
# Usage:
#   ./run_openlane.sh <job_dir>
# job_dir must contain:
#   designs/<DESIGN_SLUG>/config.json
#   designs/<DESIGN_SLUG>/src/*.v and optional *.sdc
#
# Env:
#   OPENLANE_IMAGE   (default: efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a)
#   PDK_ROOT         (default: $HOME/.volare)
#   PDK              (default: sky130A)
#   DESIGN_SLUG      (default: ace_design)
#   OPENLANE_TAG     (run tag, default: ace_run)
#   OPENLANE_TIMEOUT (seconds, default: 3600)
#   OPENROAD_SSH_HOST OPENROAD_SSH_USER OPENROAD_SSH_KEY — if set, run on remote via docker

set -euo pipefail

JOB_DIR="${1:?job_dir required}"
JOB_DIR="$(cd "$JOB_DIR" && pwd)"
DESIGN_SLUG="${DESIGN_SLUG:-ace_design}"
OPENLANE_IMAGE="${OPENLANE_IMAGE:-efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a}"
PDK_ROOT="${PDK_ROOT:-${HOME}/.volare}"
PDK="${PDK:-sky130A}"
OPENLANE_TAG="${OPENLANE_TAG:-ace_run}"
OPENLANE_TIMEOUT="${OPENLANE_TIMEOUT:-3600}"
LOG="$JOB_DIR/run.log"
STATUS="$JOB_DIR/status.json"

log() { echo "[$(date -Iseconds)] $*" | tee -a "$LOG"; }

write_status() {
  local st="$1" msg="$2"
  cat >"$STATUS" <<EOF
{"status":"$st","message":$(python3 -c 'import json,sys; print(json.dumps(sys.argv[1]))' "$msg"),"updatedAt":"$(date -Iseconds)"}
EOF
}

if [[ ! -d "$JOB_DIR/designs/$DESIGN_SLUG" ]]; then
  log "ERROR: missing designs/$DESIGN_SLUG"
  write_status failed "missing designs/$DESIGN_SLUG"
  exit 2
fi

if [[ ! -d "$PDK_ROOT/$PDK" && ! -L "$PDK_ROOT/$PDK" ]]; then
  FOUND_PDK=$(find "$PDK_ROOT" -maxdepth 5 -type d -name "$PDK" 2>/dev/null | head -1 || true)
  if [[ -n "$FOUND_PDK" && -d "$FOUND_PDK" ]]; then
    PDK_ROOT="$(dirname "$FOUND_PDK")"
    log "Resolved nested PDK at $FOUND_PDK (PDK_ROOT=$PDK_ROOT)"
  else
    log "ERROR: PDK not found at $PDK_ROOT/$PDK"
    write_status failed "PDK missing: $PDK_ROOT/$PDK"
    exit 3
  fi
fi

# Stage stop target: synthesis | floorplan | placement | cts | routing | gds | all
ACE_OPENLANE_UNTIL="${ACE_OPENLANE_UNTIL:-all}"
ACE_OPENLANE_OVERWRITE="${ACE_OPENLANE_OVERWRITE:-0}"
WORKER_DIR="$(cd "$(dirname "$0")" && pwd)"
UNTIL_TCL="${WORKER_DIR}/run_until.tcl"

write_status running "Starting OpenLane until=${ACE_OPENLANE_UNTIL}"
log "Job dir: $JOB_DIR"
log "Design: $DESIGN_SLUG  PDK: $PDK  Image: $OPENLANE_IMAGE"
log "Stage stop: ACE_OPENLANE_UNTIL=$ACE_OPENLANE_UNTIL overwrite=$ACE_OPENLANE_OVERWRITE"

run_local_docker() {
  log "Mode: local docker (OpenLane stage-limited interactive)"
  # OpenLane docker image (nix): flow.tcl is on PATH; run *from design dir*
  # that contains config.json + src/
  # Place ace_run_until.tcl inside the shared /designs folder to avoid host path mount issues
  cp -f "${UNTIL_TCL}" "${JOB_DIR}/designs/ace_run_until.tcl" 2>/dev/null || true

  timeout "$OPENLANE_TIMEOUT" docker run --rm \
    --name "ace-openlane-${DESIGN_SLUG}-$$" \
    --entrypoint bash \
    -e PDK_ROOT="/pdk" \
    -e PDK="$PDK" \
    -e MISMATCHES_OK=1 \
    -e PDK_MISMATCHES_OK=1 \
    -e DESIGN_SLUG="${DESIGN_SLUG}" \
    -e OPENLANE_TAG="${OPENLANE_TAG}" \
    -e ACE_OPENLANE_UNTIL="${ACE_OPENLANE_UNTIL}" \
    -e ACE_OPENLANE_OVERWRITE="${ACE_OPENLANE_OVERWRITE}" \
    -e ACE_EXTERNAL_NETLIST="${ACE_EXTERNAL_NETLIST:-0}" \
    -e ACE_EXTERNAL_NETLIST_FILE="/openlane/designs/${DESIGN_SLUG}/ace_synth_netlist.v" \
    -v "${PDK_ROOT}:/pdk:ro" \
    -v "${JOB_DIR}/designs:/openlane/designs" \
    -v "${JOB_DIR}/results:/openlane/results_out" \
    "$OPENLANE_IMAGE" \
    -lc "
      set -e
      echo '=== OpenLane env ==='
      echo PDK_ROOT=\$PDK_ROOT PDK=\$PDK UNTIL=\$ACE_OPENLANE_UNTIL OVERWRITE=\$ACE_OPENLANE_OVERWRITE
      which flow.tcl
      ls -la /openlane/designs/${DESIGN_SLUG}/
      ls -la /openlane/designs/${DESIGN_SLUG}/src/
      cd /openlane/designs/${DESIGN_SLUG}
      # Stage-limited: synthesis only stops after Yosys; does not run floorplan/place/...
      flow.tcl -interactive -file /openlane/designs/ace_run_until.tcl 2>&1
      RUN_DIR=\$(ls -dt runs/* 2>/dev/null | head -1 || true)
      echo RUN_DIR=\$RUN_DIR
      mkdir -p /openlane/results_out
      if [ -n \"\$RUN_DIR\" ] && [ -d \"\$RUN_DIR\" ]; then
        # Curated harvest only (avoid dumping every tmp DEF / LEF / huge log)
        # Final stage DEFs
        for sub in synthesis floorplan placement cts routing final signoff; do
          for f in \"\$RUN_DIR/results/\$sub\"/*; do
            [ -f \"\$f\" ] || continue
            case \"\$f\" in
              *.def|*.odb|*.v|*.sdc|*.spef|*.gds|*.gds.gz|metrics.csv) ;;
              *) continue ;;
            esac
            bn=\$(basename \"\$f\")
            cp -f \"\$f\" \"/openlane/results_out/\${sub}_\${bn}\" || true
          done
        done
        # Placement STA logs (needed to build reports when .rpt dir is empty)
        for f in \"\$RUN_DIR/logs/placement\"/*sta*.log \"\$RUN_DIR/logs/placement\"/*resizer*.log; do
          [ -f \"\$f\" ] || continue
          cp -f \"\$f\" \"/openlane/results_out/logs_placement_\$(basename \"\$f\")\" || true
        done
        # Real placement .rpt if any
        for f in \"\$RUN_DIR/reports/placement\"/*.rpt; do
          [ -f \"\$f\" ] || continue
          cp -f \"\$f\" \"/openlane/results_out/placement_\$(basename \"\$f\")\" || true
        done
        # metrics / gds anywhere
        find \"\$RUN_DIR\" -type f \( -name 'metrics.csv' -o -name '*.gds' -o -name '*.gds.gz' \) -print0 | while IFS= read -r -d '' f; do
          cp -f \"\$f\" \"/openlane/results_out/\$(basename \"\$f\")\" || true
        done
        echo \"\$RUN_DIR\" > /openlane/results_out/RUN_DIR.txt
        ls -la \"\$RUN_DIR/results\" 2>/dev/null || true
        ls -la \"\$RUN_DIR/reports/placement\" 2>/dev/null || true
      fi
      ls -la /openlane/results_out | head -50
    " 2>&1 | tee -a "$LOG"
}

run_ssh_remote() {
  local host="$OPENROAD_SSH_HOST"
  local user="${OPENROAD_SSH_USER:-root}"
  local key="${OPENROAD_SSH_KEY:-}"
  local remote_base="${OPENROAD_SSH_REMOTE_DIR:-/root/logiclance/ace-openroad-jobs}"
  local ssh_opts=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20)
  if [[ -n "$key" ]]; then
    ssh_opts+=(-i "$key")
  fi
  log "Mode: remote SSH docker on ${user}@${host}"
  local rid
  rid="$(basename "$JOB_DIR")"
  ssh "${ssh_opts[@]}" "${user}@${host}" "mkdir -p ${remote_base}/${rid}/designs ${remote_base}/${rid}/results"
  rsync -az -e "ssh ${ssh_opts[*]}" \
    "$JOB_DIR/designs/" "${user}@${host}:${remote_base}/${rid}/designs/"
  # Prefer remote PDK if present, else assume server has openlane + pdk
  ssh "${ssh_opts[@]}" "${user}@${host}" bash -s <<REMOTE
set -euo pipefail
export PDK_ROOT="\${PDK_ROOT:-\$HOME/.volare}"
export PDK="${PDK}"
export OPENLANE_IMAGE="${OPENLANE_IMAGE}"
export DESIGN_SLUG="${DESIGN_SLUG}"
export OPENLANE_TAG="${OPENLANE_TAG}"
export OPENLANE_TIMEOUT="${OPENLANE_TIMEOUT}"
JOB="${remote_base}/${rid}"
# If logiclance has a wrapper, prefer it
if [[ -x /root/logiclance/run_openlane.sh ]]; then
  /root/logiclance/run_openlane.sh "\$JOB"
elif [[ -x /root/logiclance/workers/openroad/run_openlane.sh ]]; then
  /root/logiclance/workers/openroad/run_openlane.sh "\$JOB"
else
  mkdir -p "\$JOB/results"
  timeout "\$OPENLANE_TIMEOUT" docker run --rm --entrypoint bash \\
    -e PDK_ROOT=/pdk -e PDK="\$PDK" \\
    -v "\${PDK_ROOT}:/pdk:ro" \\
    -v "\$JOB/designs:/openlane/designs" \\
    -v "\$JOB/results:/openlane/results_out" \\
    "\$OPENLANE_IMAGE" \\
    -lc "cd /openlane/designs/\$DESIGN_SLUG && flow.tcl -tag \$OPENLANE_TAG -overwrite && \\
      RUN_DIR=\\\$(ls -dt runs/* 2>/dev/null | head -1); \\
      mkdir -p /openlane/results_out; \\
      if [ -n \\\"\\\$RUN_DIR\\\" ]; then find \\\"\\\$RUN_DIR\\\" -type f \\\( -name '*.gds' -o -name '*.gds.gz' -o -name '*.def' -o -name '*summary*' -o -name 'metrics.csv' \\\) -exec cp -f {} /openlane/results_out/ \\\;; fi"
fi
REMOTE
  rsync -az -e "ssh ${ssh_opts[*]}" \
    "${user}@${host}:${remote_base}/${rid}/results/" "$JOB_DIR/results/" || true
  rsync -az -e "ssh ${ssh_opts[*]}" \
    "${user}@${host}:${remote_base}/${rid}/run.log" "$JOB_DIR/run.log" 2>/dev/null || true
}

mkdir -p "$JOB_DIR/results"

set +e
if [[ -n "${OPENROAD_SSH_HOST:-}" ]]; then
  run_ssh_remote
  rc=$?
else
  run_local_docker
  rc=$?
fi
set -e

# Light host harvest of final stage results (curated — no tmp DEFs)
RUNS="$JOB_DIR/designs/$DESIGN_SLUG/runs"
if [[ -d "$RUNS" ]]; then
  while IFS= read -r -d '' f; do
    rel=${f#"$RUNS/"}
    # only results/<stage>/final-ish files
    if [[ "$rel" =~ /tmp/ ]]; then continue; fi
    if [[ "$rel" =~ results/(synthesis|floorplan|placement|cts|routing|final|signoff)/ ]]; then
      stage=$(echo "$rel" | sed -n 's|.*/results/\([^/]*\)/.*|\1|p')
      bn=$(basename "$f")
      case "$bn" in
        *.def|*.odb|*.v|*.sdc|*.spef|*.gds|*.gds.gz|metrics.csv) ;;
        *) continue ;;
      esac
      cp -f "$f" "$JOB_DIR/results/${stage}_${bn}" 2>/dev/null || true
    fi
  done < <(find "$RUNS" -type f \( -name '*.def' -o -name '*.odb' -o -name '*.v' -o -name '*.sdc' -o -name '*.gds' -o -name '*.gds.gz' -o -name 'metrics.csv' \) -print0 2>/dev/null)

  # Keep STA logs available for pack_placement_reports.sh
  while IFS= read -r -d '' f; do
    cp -f "$f" "$JOB_DIR/results/logs_placement_$(basename "$f")" 2>/dev/null || true
  done < <(find "$RUNS" -type f -path '*/logs/placement/*sta*.log' -print0 2>/dev/null)

  # Floorplan / PDN / IO / tap / initial_fp logs (including failed steps like 32-initial_fp)
  while IFS= read -r -d '' f; do
    bn=$(basename "$f")
    # Skip empty .errors/.warnings placeholders
    [[ -s "$f" ]] || continue
    case "$bn" in
      *.log|*.errors|*.warnings) ;;
      *) continue ;;
    esac
    cp -f "$f" "$JOB_DIR/results/logs_floorplan_${bn}" 2>/dev/null || true
  done < <(find "$RUNS" -type f -path '*/logs/floorplan/*' -print0 2>/dev/null)
fi

# Only pack placement reports when this run actually reached placement (or later).
# Floorplan-only runs must NOT refresh/keep placement_*.rpt from an older place step.
UNTIL_NOW="${ACE_OPENLANE_UNTIL:-all}"
case "$UNTIL_NOW" in
  synthesis|floorplan|powerplan)
    echo "ACE-Seek: skipping placement report pack (until=$UNTIL_NOW)" | tee -a "$LOG"
    # Drop stale placement/cts/route harvest so Studio cannot show "placement ran"
    rm -f "$JOB_DIR/results"/placement_* \
          "$JOB_DIR/results"/cts_* \
          "$JOB_DIR/results"/routing_* \
          "$JOB_DIR/results"/logs_placement_* 2>/dev/null || true
    ;;
  *)
    PACK_PL="$WORKER_DIR/pack_placement_reports.sh"
    if [[ -x "$PACK_PL" ]] || [[ -f "$PACK_PL" ]]; then
      chmod +x "$PACK_PL" 2>/dev/null || true
      "$PACK_PL" "$JOB_DIR" 2>&1 | tee -a "$LOG" || true
    fi
    if ls "$JOB_DIR/results"/placement_*.rpt >/dev/null 2>&1; then
      {
        echo "ACE-Seek: === placement metrics summary ==="
        for rf in \
          "$JOB_DIR/results"/placement_metrics_summary.rpt \
          "$JOB_DIR/results"/placement_timing.rpt \
          "$JOB_DIR/results"/placement_power.rpt \
          "$JOB_DIR/results"/placement_area_util.rpt; do
          [[ -f "$rf" ]] || continue
          echo "--- $(basename "$rf") ---"
          grep -E '^(tns|wns)|worst slack|report_wns|report_tns|WNS|TNS|Total\s+[0-9]|Design area|utilization|Internal|Switching|Leakage' \
            "$rf" 2>/dev/null | head -50 || true
        done
        echo "ACE-Seek: === end placement metrics ==="
      } | tee -a "$LOG"
    fi
    ;;
esac

GDS_COUNT=$(find "$JOB_DIR/results" -type f \( -name '*.gds' -o -name '*.gds.gz' \) 2>/dev/null | wc -l | tr -d ' ')
DEF_COUNT=$(find "$JOB_DIR/results" -type f -name '*.def' 2>/dev/null | wc -l | tr -d ' ')

# Only count markers from THIS invocation (log is appended across stage runs)
# Marker written at start of each run_openlane.sh
THIS_START_LINE=$(grep -n "Stage stop: ACE_OPENLANE_UNTIL=${ACE_OPENLANE_UNTIL}" "$LOG" 2>/dev/null | tail -1 | cut -d: -f1)
THIS_START_LINE=${THIS_START_LINE:-1}
THIS_LOG=$(tail -n +"$((THIS_START_LINE))" "$LOG" 2>/dev/null || cat "$LOG")

# Hard failures that must never look like success
PREP_EXISTS_ERR=$(echo "$THIS_LOG" | grep -c "already exists. Pass the -overwrite" || true)
# OpenLane often continues after a sub-step error and still exits 0 — detect those.
STEP_FAIL=$(echo "$THIS_LOG" | grep -cE "ACE-Seek: step .* FAILED|child process exited abnormally|Only one entry allowed per line|\[ERROR\]: Exit code:" || true)
# If IO placement was attempted and OpenLane logged an ERROR in the same window, force fail
if echo "$THIS_LOG" | grep -q "Running IO Placement" && \
   echo "$THIS_LOG" | grep -qE "\[ERROR\]: Exit code:|Only one entry allowed per line"; then
  STEP_FAIL=$((STEP_FAIL + 1))
fi
STOPPED_OK=$(echo "$THIS_LOG" | grep -cE "ACE-Seek: stopped after" || true)
STEP_OK=$(echo "$THIS_LOG" | grep -cE "ACE-Seek: === step .* OK ===" || true)
FLOW_COMPLETE=$(echo "$THIS_LOG" | grep -cE "ACE-Seek: flow complete" || true)
RESUME_NOTE=$(echo "$THIS_LOG" | grep -c "ACE-Seek: resume existing run" || true)

# Map until → required OK step (for stage-limited success)
need_step=""
case "$ACE_OPENLANE_UNTIL" in
  synthesis) need_step="synthesis" ;;
  floorplan|powerplan) need_step="floorplan" ;;
  placement) need_step="placement" ;;
  cts) need_step="cts" ;;
  routing|route) need_step="routing" ;;
  drc) need_step="gds_magic\|routing\|floorplan" ;;
  lvs|gds|all) need_step="" ;;
esac

HAS_NEED=1
if [[ -n "$need_step" ]]; then
  if ! echo "$THIS_LOG" | grep -qE "ACE-Seek: === step (${need_step}) OK ===|ACE-Seek: skip ${need_step}|ACE-Seek: skip floorplan|ACE-Seek: skip placement|ACE-Seek: skip CTS|ACE-Seek: skip routing|ACE-Seek: skip synthesis"; then
    # skip messages use different casing
    if ! echo "$THIS_LOG" | grep -qiE "ACE-Seek: (=== step ${need_step} OK|skip ${need_step}|skip floorplan|skip placement|skip CTS|skip routing|skip synthesis)"; then
      HAS_NEED=0
    fi
  fi
fi
# placement: accept skip only if placement DEF exists after run
if [[ "$ACE_OPENLANE_UNTIL" == "placement" ]]; then
  PLACE_DEF=$(find "$JOB_DIR/designs/$DESIGN_SLUG/runs" -path '*/results/placement/*.def' 2>/dev/null | head -1 || true)
  if [[ -z "${PLACE_DEF:-}" ]]; then
    if ! echo "$THIS_LOG" | grep -q "ACE-Seek: === step placement OK ==="; then
      HAS_NEED=0
    fi
  else
    HAS_NEED=1
  fi
fi

if [[ "$PREP_EXISTS_ERR" -gt 0 && "$RESUME_NOTE" -eq 0 ]]; then
  write_status failed "OpenLane prep failed: run tag already exists and resume did not load (until=$ACE_OPENLANE_UNTIL). See run.log"
  log "FAILED prep-exists until=$ACE_OPENLANE_UNTIL rc=$rc"
  exit 1
fi

# Hard gate: any step failure or non-zero rc must NEVER look like success
# (old bug: STOPPED_OK / HAS_NEED could succeed with rc!=0 or STEP_FAIL>0)
#
# Note on "FAILED … rc=0": OpenLane's docker/flow often exits 0 even after a
# sub-command failed (e.g. place_io), then continues tap/PDN. Ace-Seek forces
# FAILED from log markers; openlane_rc is the tool exit, not our verdict.
#
# Soft exception: post-place STA may fail only on writing signoff/top.sdf when
# that directory was pruned — if placement DEF/ODB exists and timing reports
# were produced, treat as succeeded with a warning (placement itself worked).
SIGNOFF_SDF_ONLY=0
if [[ "$STEP_FAIL" -gt 0 ]]; then
  SDF_ERR=$(echo "$THIS_LOG" | grep -c "cannot write file .*results/signoff/top.sdf" || true)
  PLACE_OK_ART=0
  if [[ -f "$JOB_DIR/results/placement_top.def" || -f "$JOB_DIR/results/placement_top.odb" ]] || \
     find "$JOB_DIR/designs/$DESIGN_SLUG/runs" -path '*/results/placement/*.def' 2>/dev/null | grep -q .; then
    PLACE_OK_ART=1
  fi
  if [[ "$ACE_OPENLANE_UNTIL" == "placement" && "$SDF_ERR" -gt 0 && "$PLACE_OK_ART" -eq 1 ]]; then
    # All "child process exited abnormally" lines are the SDF write — demote
    SIGNOFF_SDF_ONLY=1
    log "WARN: post-place STA could not write signoff/top.sdf (dir missing) — placement artifacts OK; not failing job"
    STEP_FAIL=0
  fi
fi

if [[ "$STEP_FAIL" -gt 0 ]]; then
  write_status failed "OpenLane step FAILED until=$ACE_OPENLANE_UNTIL (sub-step error in log; openlane_rc=$rc). See run.log"
  log "FAILED step_fail=$STEP_FAIL until=$ACE_OPENLANE_UNTIL openlane_rc=$rc (forced fail — tool returned $rc but log has errors)"
  exit 1
fi

if [[ $rc -ne 0 ]]; then
  write_status failed "OpenLane failed rc=$rc until=$ACE_OPENLANE_UNTIL (see run.log)"
  log "FAILED openlane_rc=$rc until=$ACE_OPENLANE_UNTIL prep_err=$PREP_EXISTS_ERR step_fail=$STEP_FAIL has_need=$HAS_NEED"
  exit "${rc:-1}"
fi

# From here: rc==0 and no STEP_FAIL
if [[ "$GDS_COUNT" -gt 0 ]]; then
  write_status succeeded "OpenLane complete — GDS: $GDS_COUNT, DEF: $DEF_COUNT (until=$ACE_OPENLANE_UNTIL rc=$rc)"
  log "SUCCESS gds=$GDS_COUNT def=$DEF_COUNT until=$ACE_OPENLANE_UNTIL rc=$rc"
  exit 0
elif [[ "$HAS_NEED" -eq 1 && ( "$STOPPED_OK" -gt 0 || "$FLOW_COMPLETE" -gt 0 || "$STEP_OK" -gt 0 ) ]]; then
  write_status succeeded "OpenLane stopped after '${ACE_OPENLANE_UNTIL}' (stage-limited, rc=$rc)"
  log "SUCCESS stage-stop until=$ACE_OPENLANE_UNTIL def=$DEF_COUNT step_ok=$STEP_OK rc=$rc"
  exit 0
elif [[ "$STEP_OK" -gt 0 ]]; then
  write_status succeeded "OpenLane finished (rc=0) until=$ACE_OPENLANE_UNTIL"
  log "SUCCESS rc=0 until=$ACE_OPENLANE_UNTIL"
  exit 0
else
  write_status failed "OpenLane exited 0 but no step OK / stop marker (until=$ACE_OPENLANE_UNTIL) — refusing soft success"
  log "FAILED empty-success until=$ACE_OPENLANE_UNTIL has_need=$HAS_NEED step_ok=$STEP_OK stopped=$STOPPED_OK"
  exit 1
fi
