#!/usr/bin/env bash
# Prepare a minimal ORFS design directory for asap7 / nangate45
# Usage: prepare_orfs_design.sh <job_dir> <design_name> <top> <platform>
set -euo pipefail

JOB_DIR="${1:?}"
DESIGN_NAME="${2:-design}"
TOP="${3:-top}"
PLATFORM="${4:-asap7}"
DES="$JOB_DIR/orfs_design"
mkdir -p "$DES/src" "$JOB_DIR/results"

# Copy RTL + SDC from input/
if [[ -d "$JOB_DIR/input" ]]; then
  for f in "$JOB_DIR/input"/*.v "$JOB_DIR/input"/*.sv; do
    [[ -f "$f" ]] || continue
    cp "$f" "$DES/src/$(basename "$f")"
  done
  if [[ -f "$JOB_DIR/input/constraints.sdc" ]]; then
    cp "$JOB_DIR/input/constraints.sdc" "$DES/constraint.sdc"
  fi
fi

if ! ls "$DES/src"/*.v >/dev/null 2>&1; then
  cat >"$DES/src/${TOP}.v" <<VEOF
module ${TOP} (input clk, input rst_n, input d, output reg q);
  always @(posedge clk or negedge rst_n) if (!rst_n) q<=0; else q<=d;
endmodule
VEOF
fi

if [[ ! -f "$DES/constraint.sdc" ]]; then
  cat >"$DES/constraint.sdc" <<SEOF
create_clock -name clk -period 1.0 [get_ports clk]
SEOF
fi

# Resolve verilog list
VERILOGS=$(ls "$DES/src"/*.v 2>/dev/null | tr '\n' ' ')

# Platform-specific clock / density defaults
case "$PLATFORM" in
  asap7)
    CLK=400
    DENSITY=0.50
    ;;
  nangate45)
    CLK=2.0
    DENSITY=0.50
    ;;
  *)
    CLK=10.0
    DENSITY=0.40
    ;;
esac

# Infer period from SDC if present
if [[ -f "$DES/constraint.sdc" ]]; then
  P=$(grep -Eo -- '-period[[:space:]]+[0-9.]+' "$DES/constraint.sdc" | head -1 | awk '{print $2}' || true)
  [[ -n "${P:-}" ]] && CLK="$P"
fi

cat >"$DES/config.mk" <<MEOF
export DESIGN_NICKNAME = ${DESIGN_NAME}
export DESIGN_NAME = ${TOP}
export PLATFORM    = ${PLATFORM}

export VERILOG_FILES = ${VERILOGS}
export SDC_FILE      = ${DES}/constraint.sdc

export CORE_UTILIZATION = 40
export PLACE_DENSITY    = ${DENSITY}
export CORE_ASPECT_RATIO = 1

# Keep flow educational / tolerant
export ABC_AREA = 1
MEOF

echo "Prepared ORFS design $DES platform=$PLATFORM top=$TOP"
