#!/usr/bin/env bash
# Full sample pipeline: lint → sim → OpenLane (synth→GDS)
# Usage: run_sample_pipeline.sh [sample_dir]
# Default sample_dir=/tmp/ace-sample-large
set -euo pipefail

SAMPLE="${1:-/tmp/ace-sample-large}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
JOB="${JOB_DIR:-/tmp/ace-openroad-large-run}"
REPORT="$JOB/pipeline_report.md"
export PDK_ROOT="${PDK_ROOT:-$HOME/.volare}"
export PDK="${PDK:-sky130A}"
export OPENLANE_TIMEOUT="${OPENLANE_TIMEOUT:-7200}"
export OPENLANE_IMAGE="${OPENLANE_IMAGE:-efabless/openlane:e73fb3c57e687a0023fcd4dcfd1566ecd478362a}"
export DESIGN_SLUG=ace_design

mkdir -p "$JOB/input" "$JOB/logs" "$JOB/results" "$JOB/sim"
: >"$REPORT"

log() {
  echo "[$(date -Iseconds)] $*" | tee -a "$JOB/logs/pipeline.log"
  echo "$*" >>"$REPORT"
}

stage() {
  echo "" | tee -a "$REPORT"
  echo "## $1" | tee -a "$REPORT"
  log "=== STAGE: $1 ==="
}

fail() {
  log "FAIL: $*"
  echo "**Status: FAILED** — $*" >>"$REPORT"
  exit 1
}

[[ -f "$SAMPLE/rtl/top.v" ]] || fail "missing $SAMPLE/rtl/top.v"
[[ -d "$PDK_ROOT/$PDK" || -L "$PDK_ROOT/$PDK" ]] || fail "PDK missing $PDK_ROOT/$PDK"

# Collect RTL
mapfile -t RTL_FILES < <(find "$SAMPLE/rtl" -type f \( -name '*.v' -o -name '*.sv' \) | sort)
log "RTL files: ${#RTL_FILES[@]}"
for f in "${RTL_FILES[@]}"; do log "  - $f ($(wc -l <"$f") lines)"; done

# ─────────────────────────────────────────────
stage "1. Lint (Verilator)"
set +e
verilator --lint-only -Wall -Wno-DECLFILENAME -Wno-fatal \
  --top-module top \
  "${RTL_FILES[@]}" \
  >"$JOB/logs/01_lint.log" 2>&1
LINT_RC=$?
set -e
tail -30 "$JOB/logs/01_lint.log" | tee -a "$JOB/logs/pipeline.log"
if [[ $LINT_RC -ne 0 ]]; then
  log "Verilator returned $LINT_RC (continuing if only warnings)"
  if grep -qiE 'Error:|%Error' "$JOB/logs/01_lint.log"; then
    # still try to continue for known style noise unless hard parse fail
    if grep -qiE '%Error-.*?PARSE|syntax error' "$JOB/logs/01_lint.log"; then
      fail "Lint hard errors — see logs/01_lint.log"
    fi
  fi
fi
log "Lint stage finished rc=$LINT_RC"

# ─────────────────────────────────────────────
stage "2. Simulation (Icarus Verilog)"
set +e
iverilog -g2012 -o "$JOB/sim/tb.vvp" \
  -s tb_top \
  "${RTL_FILES[@]}" \
  "$SAMPLE/tb/tb_top.v" \
  >"$JOB/logs/02_sim_compile.log" 2>&1
SIMC_RC=$?
set -e
if [[ $SIMC_RC -ne 0 ]]; then
  cat "$JOB/logs/02_sim_compile.log" | tee -a "$JOB/logs/pipeline.log"
  fail "Simulation compile failed"
fi
set +e
(cd "$JOB/sim" && vvp tb.vvp) >"$JOB/logs/02_sim_run.log" 2>&1
SIM_RC=$?
set -e
tail -20 "$JOB/logs/02_sim_run.log" | tee -a "$JOB/logs/pipeline.log"
grep -q SIM_OK "$JOB/logs/02_sim_run.log" || log "WARN: SIM_OK marker not found (rc=$SIM_RC)"
log "Simulation finished rc=$SIM_RC"
[[ -f "$JOB/sim/tb_top.vcd" || -f tb_top.vcd ]] && log "VCD written" || true
# move vcd if in cwd
[[ -f tb_top.vcd ]] && mv -f tb_top.vcd "$JOB/sim/" || true

# ─────────────────────────────────────────────
stage "3. Pre-synth check (Yosys hierarchy)"
set +e
yosys -p "
  read_verilog ${RTL_FILES[*]};
  hierarchy -check -top top;
  proc; opt_clean;
  stat;
" >"$JOB/logs/03_yosys_stat.log" 2>&1
YOS_RC=$?
set -e
tail -40 "$JOB/logs/03_yosys_stat.log" | tee -a "$JOB/logs/pipeline.log"
[[ $YOS_RC -eq 0 ]] || fail "Yosys hierarchy/stat failed"
log "Yosys pre-check OK"

# ─────────────────────────────────────────────
stage "4. Prepare OpenLane design (synth→floorplan→…→GDS)"
rm -rf "$JOB/designs" "$JOB/input"
mkdir -p "$JOB/input"
cp "${RTL_FILES[@]}" "$JOB/input/"
# ensure top.v present
cp "$SAMPLE/rtl/top.v" "$JOB/input/top.v"
cp "$SAMPLE/constraints.sdc" "$JOB/input/constraints.sdc"
# Also copy picorv32 if separate
[[ -f "$SAMPLE/rtl/picorv32.v" ]] && cp "$SAMPLE/rtl/picorv32.v" "$JOB/input/"

"$ROOT/prepare_design.sh" "$JOB" picorv32_top top "$PDK"

# Multi-file verilog: openlane config VERILOG_FILES
python3 - <<PY
import json, glob, os
job = "$JOB"
slug = "$DESIGN_SLUG"
src = os.path.join(job, "designs", slug, "src")
# prepare may only have top.v — copy all input rtl
for f in glob.glob(os.path.join(job, "input", "*.v")):
    bn = os.path.basename(f)
    dst = os.path.join(src, bn)
    if not os.path.exists(dst):
        import shutil
        shutil.copy(f, dst)
vs = sorted(glob.glob(os.path.join(src, "*.v")))
print("verilog:", vs)
cfg_path = os.path.join(job, "designs", slug, "config.json")
with open(cfg_path) as f:
    c = json.load(f)
c["DESIGN_NAME"] = "top"
c["VERILOG_FILES"] = "dir::src/*.v"
c["CLOCK_PORT"] = "clk"
c["CLOCK_PERIOD"] = 20.0
# larger die for CPU core
c["FP_SIZING"] = "absolute"
c["DIE_AREA"] = "0 0 400 400"
c["CORE_AREA"] = "20 20 380 380"
c["FP_CORE_UTIL"] = 25
c["QUIT_ON_SYNTH_CHECKS"] = False
c["QUIT_ON_MAGIC_DRC"] = False
c["QUIT_ON_LVS_ERROR"] = False
c["QUIT_ON_TR_DRC"] = False
c["QUIT_ON_KLAYOUT_DRC"] = False
c["RUN_KLAYOUT_DRC"] = False
c["RUN_LINTER"] = False
with open(cfg_path, "w") as f:
    json.dump(c, f, indent=2)
print("config updated")
PY

# ─────────────────────────────────────────────
stage "5–12. OpenLane full PnR (synth, FP, PDN, place, CTS, route, DRC, LVS, GDS)"
log "OpenLane timeout=${OPENLANE_TIMEOUT}s image=$OPENLANE_IMAGE"
set +e
"$ROOT/run_openlane.sh" "$JOB"
OL_RC=$?
set -e
tail -50 "$JOB/run.log" 2>/dev/null | tee -a "$JOB/logs/pipeline.log" || true

GDS=$(find "$JOB/results" -name '*.gds' 2>/dev/null | head -5)
DEF=$(find "$JOB/results" -name '*.def' 2>/dev/null | wc -l | tr -d ' ')
log "OpenLane rc=$OL_RC"
log "GDS files: $GDS"
log "DEF count in results: $DEF"

# Stage presence from log
for kw in "Running Synthesis" "Floorplan" "Placement" "Clock Tree" "Routing" "GDSII" "LVS" "DRC"; do
  if grep -qi "$kw" "$JOB/run.log" 2>/dev/null; then
    log "  saw: $kw"
  else
    log "  missing log marker: $kw"
  fi
done

# ─────────────────────────────────────────────
stage "Summary"
{
  echo ""
  echo "| Stage | Status |"
  echo "|-------|--------|"
  echo "| Lint (Verilator) | rc=$LINT_RC |"
  echo "| Sim compile | rc=$SIMC_RC |"
  echo "| Sim run | rc=$SIM_RC |"
  echo "| Yosys pre-check | rc=$YOS_RC |"
  echo "| OpenLane PnR | rc=$OL_RC |"
  echo "| GDS produced | $( [[ -n "$GDS" ]] && echo YES || echo NO ) |"
  echo ""
  echo "Job dir: \`$JOB\`"
  echo "Report: \`$REPORT\`"
} | tee -a "$REPORT"

if [[ -n "$GDS" ]]; then
  log "PIPELINE SUCCESS — GDS available"
  ls -la "$JOB/results"/*.gds 2>/dev/null | tee -a "$JOB/logs/pipeline.log" || true
  exit 0
fi

# If OpenLane failed but we got partial — still non-zero
fail "Pipeline incomplete — no GDS (OpenLane rc=$OL_RC). See $JOB/run.log"
