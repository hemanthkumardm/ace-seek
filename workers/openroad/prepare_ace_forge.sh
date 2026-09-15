#!/usr/bin/env bash
# Prepare AceForge run directory from job input/
# Usage: prepare_ace_forge.sh <job_dir> <top> <profile:classic|chip>
set -euo pipefail

JOB_DIR="${1:?job_dir}"
TOP="${2:-top}"
PROFILE="${3:-classic}"
FORGE="$JOB_DIR/forge_run"
mkdir -p "$FORGE/rtl" "$JOB_DIR/results" "$FORGE/steps"

# Copy RTL + SDC from input/
if [[ -d "$JOB_DIR/input" ]]; then
  for f in "$JOB_DIR/input"/*.v "$JOB_DIR/input"/*.sv; do
    [[ -f "$f" ]] || continue
    cp "$f" "$FORGE/rtl/$(basename "$f")"
  done
  if [[ -f "$JOB_DIR/input/constraints.sdc" ]]; then
    cp "$JOB_DIR/input/constraints.sdc" "$FORGE/constraints.sdc"
  fi
fi

if ! ls "$FORGE/rtl"/*.v >/dev/null 2>&1 && ! ls "$FORGE/rtl"/*.sv >/dev/null 2>&1; then
  cat >"$FORGE/rtl/${TOP}.v" <<VEOF
module ${TOP} (input clk, input rst_n, input d, output reg q);
  always @(posedge clk or negedge rst_n) if (!rst_n) q<=1'b0; else q<=d;
endmodule
VEOF
fi

if [[ ! -f "$FORGE/constraints.sdc" ]]; then
  cat >"$FORGE/constraints.sdc" <<SEOF
create_clock -name clk -period 10.0 [get_ports clk]
set_input_delay -clock clk 0.5 [all_inputs]
set_output_delay -clock clk 0.5 [all_outputs]
SEOF
fi

RTL_LIST=$(ls "$FORGE/rtl"/*.{v,sv} 2>/dev/null | tr '\n' ',' | sed 's/,$//')

cat >"$FORGE/ace_forge_config.json" <<JSON
{
  "design": "${TOP}",
  "profile": "${PROFILE}",
  "rtl": "${RTL_LIST}",
  "sdc": "${FORGE}/constraints.sdc"
}
JSON

echo "AceForge prepared: $FORGE profile=$PROFILE top=$TOP"
