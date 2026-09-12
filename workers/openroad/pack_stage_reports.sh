#!/usr/bin/env bash
# ==============================================================================
# Ace-Seek OpenROAD / OpenLane Comprehensive Stage Reports & Logs Packer
# Generates authentic timing, power, area, and metrics reports across all stages:
#   1. Synthesis (stat, timing, power, summary)
#   2. Floorplan (dimensions, utilization, PDN connectivity)
#   3. Placement (timing with paths, power breakdown, area/util, summary)
#   4. CTS (clock skew, latency, buffers, propagated timing, power)
#   5. Routing (post-route timing, power, detailed DRC, antenna diodes)
#   6. Signoff (multi-corner STA matrix, power, Magic DRC, Netgen LVS, IR drop)
# Preserves stage logs for auditability and verification.
#
# Usage: pack_stage_reports.sh <job_dir> [until_stage]
# ==============================================================================
set -euo pipefail

JOB_DIR="${1:?job_dir required}"
UNTIL="${2:-all}"
RES="$JOB_DIR/results"
RUNS="$JOB_DIR/designs/ace_design/runs"
mkdir -p "$RES"

write_rpt() {
  local dest="$1"
  local tmp="${dest}.tmp.$$"
  cat >"$tmp"
  rm -f "$dest" 2>/dev/null || true
  mv -f "$tmp" "$dest"
}

extract_block() {
  local start_re="$1"
  awk -v re="$start_re" '
    BEGIN{on=0; n=0}
    {
      if ($0 ~ re) { on=1; n=0 }
      if (on) {
        print
        n++
        if (n>2 && $0 ~ /^report_/ && $0 !~ re) exit
        if (n>180) exit
      }
    }
  '
}

# Helper to find first existing file from a list of patterns
find_first() {
  for f in "$@"; do
    [[ -f "$f" ]] || continue
    echo "$f"
    return 0
  done
  return 1
}

echo "ACE-Seek: Packing stage reports (until=$UNTIL) in $JOB_DIR"

# ==============================================================================
# 1. SYNTHESIS STAGE PACKING
# ==============================================================================
SYNTH_LOG="$(find_first \
  "$RUNS"/ace_run/logs/synthesis/*synthesis.log \
  "$RUNS"/*/logs/synthesis/*synthesis.log \
  "$RES"/logs_synthesis_*synthesis.log \
  "$JOB_DIR"/results/logs_synthesis_*synthesis.log || true)"

SYNTH_STA_LOG="$(find_first \
  "$RUNS"/ace_run/logs/synthesis/*sta*.log \
  "$RUNS"/*/logs/synthesis/*sta*.log \
  "$RES"/logs_synthesis_*sta*.log \
  "$JOB_DIR"/results/logs_synthesis_*sta*.log || true)"

SYNTH_STAT_RPT="$(find_first \
  "$RUNS"/ace_run/reports/synthesis/*.stat.rpt \
  "$RUNS"/*/reports/synthesis/*.stat.rpt \
  "$RES"/synthesis_*.stat.rpt \
  "$RES"/*synthesis*.stat.rpt || true)"

# --- synthesis_stat.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Synthesis Cell & Gate Statistics"
  echo "Source: $(basename "${SYNTH_STAT_RPT:-${SYNTH_LOG:-unknown}}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${SYNTH_STAT_RPT:-}" && -f "$SYNTH_STAT_RPT" ]]; then
    cat "$SYNTH_STAT_RPT"
  elif [[ -n "${SYNTH_LOG:-}" && -f "$SYNTH_LOG" ]]; then
    awk '/=== design hierarchy ===/,/End of script/' "$SYNTH_LOG" 2>/dev/null || true
    if ! grep -q 'Printing statistics' "$RES/synthesis_stat.rpt" 2>/dev/null; then
      awk '/Printing statistics/,/=== /' "$SYNTH_LOG" 2>/dev/null || true
    fi
  fi
} | write_rpt "$RES/synthesis_stat.rpt"

# --- synthesis_timing.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Synthesis Pre-Layout Timing Report"
  echo "Source: $(basename "${SYNTH_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${SYNTH_STA_LOG:-}" && -f "$SYNTH_STA_LOG" ]]; then
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$SYNTH_STA_LOG" || true
    echo ""
    extract_block 'report_wns' < "$SYNTH_STA_LOG" || true
    echo ""
    extract_block 'report_worst_slack' < "$SYNTH_STA_LOG" || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Pre-Layout Max/Setup)"
    echo "-------------------------------------------------------------------------------"
    awk '/Startpoint:/,/slack \((MET|VIOLATED)\)/' "$SYNTH_STA_LOG" | head -150 || true
  else
    echo "Synthesis STA log not found."
  fi
} | write_rpt "$RES/synthesis_timing.rpt"

# --- synthesis_metrics_summary.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Synthesis Metrics Summary"
  echo "==============================================================================="
  grep -hE '^(tns|wns)|worst slack|Number of cells|Chip area' \
    "$RES/synthesis_timing.rpt" "$RES/synthesis_stat.rpt" 2>/dev/null || true
} | write_rpt "$RES/synthesis_metrics_summary.rpt"


# ==============================================================================
# 2. FLOORPLAN STAGE PACKING
# ==============================================================================
FP_IO_LOG="$(find_first \
  "$RUNS"/ace_run/logs/floorplan/*io*.log \
  "$RES"/logs_floorplan_*io*.log || true)"
FP_TAP_LOG="$(find_first \
  "$RUNS"/ace_run/logs/floorplan/*tap*.log \
  "$RES"/logs_floorplan_*tap*.log || true)"
FP_PDN_LOG="$(find_first \
  "$RUNS"/ace_run/logs/floorplan/*pdn*.log \
  "$RES"/logs_floorplan_*pdn*.log || true)"
FP_INIT_LOG="$(find_first \
  "$RUNS"/ace_run/logs/floorplan/*initial_fp*.log \
  "$RES"/logs_floorplan_*initial_fp*.log || true)"

{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Floorplan & PDN Summary Report"
  echo "==============================================================================="
  echo ""
  if [[ -n "${FP_INIT_LOG:-}" && -f "$FP_INIT_LOG" ]]; then
    echo "--- Die & Core Geometry ---"
    grep -E 'Floorplanned with width|Core area|Die area|Design area' "$FP_INIT_LOG" 2>/dev/null || true
  fi
  if [[ -n "${FP_PDN_LOG:-}" && -f "$FP_PDN_LOG" ]]; then
    echo ""
    echo "--- Power Distribution Network (PDN) ---"
    grep -E 'Inserting grid|All shapes on net|Power planning' "$FP_PDN_LOG" 2>/dev/null || true
  fi
  if [[ -n "${FP_TAP_LOG:-}" && -f "$FP_TAP_LOG" ]]; then
    echo ""
    echo "--- Welltap & Decap Insertion ---"
    grep -E 'Inserted|tap|decap' "$FP_TAP_LOG" 2>/dev/null | head -20 || true
  fi
} | write_rpt "$RES/floorplan_summary.rpt"


# ==============================================================================
# 3. PLACEMENT STAGE PACKING
# ==============================================================================
PLACE_STA_LOG="$(find_first \
  "$RUNS"/ace_run/logs/placement/*dpl_sta.log \
  "$RUNS"/ace_run/logs/placement/*ace_post_place_sta.log \
  "$RES"/logs_placement_*dpl_sta.log \
  "$RES"/logs_placement_*ace_post_place_sta.log \
  "$RUNS"/ace_run/logs/placement/*gpl_sta.log \
  "$RES"/logs_placement_*gpl_sta.log || true)"

# --- placement_timing.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Placement Static Timing Report"
  echo "Source: $(basename "${PLACE_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${PLACE_STA_LOG:-}" && -f "$PLACE_STA_LOG" ]]; then
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$PLACE_STA_LOG" || true
    echo ""
    extract_block 'report_wns' < "$PLACE_STA_LOG" || true
    echo ""
    extract_block 'report_worst_slack' < "$PLACE_STA_LOG" || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Post-Placement Setup / Max)"
    echo "-------------------------------------------------------------------------------"
    awk '/Startpoint:/,/slack \((MET|VIOLATED)\)/' "$PLACE_STA_LOG" | head -160 || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Post-Placement Hold / Min)"
    echo "-------------------------------------------------------------------------------"
    awk '/Path Type:[[:space:]]+min/,/slack \((MET|VIOLATED)\)/' "$PLACE_STA_LOG" | head -160 || true
  fi
  find "$RUNS" -path '*/reports/placement/*sta*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/placement_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/placement_timing.rpt"

# --- placement_power.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Placement Power Report"
  echo "Source: $(basename "${PLACE_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${PLACE_STA_LOG:-}" && -f "$PLACE_STA_LOG" ]]; then
    extract_block 'report_power' < "$PLACE_STA_LOG" || true
    grep -E '^Total[[:space:]]+[0-9]|Group[[:space:]]+Internal|Sequential|Combinational|Leakage|Switching|Internal' "$PLACE_STA_LOG" || true
  fi
  find "$RUNS" -path '*/reports/placement/*power*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/placement_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/placement_power.rpt"

# --- placement_area_util.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Placement Area & Utilization"
  echo "==============================================================================="
  echo ""
  if [[ -n "${PLACE_STA_LOG:-}" && -f "$PLACE_STA_LOG" ]]; then
    grep -E 'Design area[[:space:]]+[0-9]' "$PLACE_STA_LOG" || true
  fi
  find "$RUNS" -path '*/logs/placement/*.log' -type f 2>/dev/null | while read -r f; do
    grep -E 'Design area[[:space:]]+[0-9].*utilization' "$f" 2>/dev/null | while read -r line; do
      echo "$line  # $(basename "$f")"
    done || true
  done
  for f in "$RES"/logs_placement_*.log; do
    [[ -f "$f" ]] || continue
    grep -E 'Design area[[:space:]]+[0-9].*utilization' "$f" 2>/dev/null | while read -r line; do
      echo "$line  # $(basename "$f")"
    done || true
  done
} | write_rpt "$RES/placement_area_util.rpt"

# --- placement_metrics_summary.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Placement Metrics Summary"
  echo "==============================================================================="
  grep -hE '^(tns|wns)|worst slack|^Total[[:space:]]+|Design area' \
    "$RES/placement_timing.rpt" "$RES/placement_power.rpt" "$RES/placement_area_util.rpt" 2>/dev/null || true
} | write_rpt "$RES/placement_metrics_summary.rpt"

# Stable placement DEF
PLACE_DEF=""
for f in \
  "$RUNS"/ace_run/results/placement/*.def \
  "$RUNS"/*/results/placement/*.def \
  "$RES"/results_placement_top.def \
  "$RES"/placement_top.def
do
  [[ -f "$f" ]] || continue
  PLACE_DEF="$f"
  break
done
if [[ -n "$PLACE_DEF" ]]; then
  cp -f "$PLACE_DEF" "$RES/placement_top.def" 2>/dev/null || true
fi


# ==============================================================================
# 4. CLOCK TREE SYNTHESIS (CTS) STAGE PACKING
# ==============================================================================
CTS_LOG="$(find_first \
  "$RUNS"/ace_run/logs/cts/*cts.log \
  "$RUNS"/*/logs/cts/*cts.log \
  "$RES"/logs_cts_*cts.log || true)"

CTS_STA_LOG="$(find_first \
  "$RUNS"/ace_run/logs/cts/*cts_sta*.log \
  "$RUNS"/*/logs/cts/*cts_sta*.log \
  "$RES"/logs_cts_*cts_sta*.log || true)"

# --- cts_timing.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Post-CTS Propagated Clock Static Timing Report"
  echo "Source: $(basename "${CTS_STA_LOG:-${CTS_LOG:-unknown}}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${CTS_STA_LOG:-}" && -f "$CTS_STA_LOG" ]]; then
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$CTS_STA_LOG" || true
    echo ""
    extract_block 'report_wns' < "$CTS_STA_LOG" || true
    echo ""
    extract_block 'report_worst_slack' < "$CTS_STA_LOG" || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Post-CTS Setup / Max)"
    echo "-------------------------------------------------------------------------------"
    awk '/Startpoint:/,/slack \((MET|VIOLATED)\)/' "$CTS_STA_LOG" | head -160 || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Post-CTS Hold / Min)"
    echo "-------------------------------------------------------------------------------"
    awk '/Path Type:[[:space:]]+min/,/slack \((MET|VIOLATED)\)/' "$CTS_STA_LOG" | head -160 || true
  else
    echo "CTS STA log not available."
  fi
  find "$RUNS" -path '*/reports/cts/*sta*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/cts_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/cts_timing.rpt"

# --- cts_power.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Post-CTS Power Report"
  echo "Source: $(basename "${CTS_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${CTS_STA_LOG:-}" && -f "$CTS_STA_LOG" ]]; then
    extract_block 'report_power' < "$CTS_STA_LOG" || true
    grep -E '^Total[[:space:]]+[0-9]|Group[[:space:]]+Internal|Sequential|Combinational|Clock|Leakage|Switching' "$CTS_STA_LOG" || true
  fi
  find "$RUNS" -path '*/reports/cts/*power*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/cts_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/cts_power.rpt"

# --- cts_skew.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Clock Tree Synthesis Skew & Buffer Report"
  echo "Source: $(basename "${CTS_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${CTS_LOG:-}" && -f "$CTS_LOG" ]]; then
    grep -E 'Clock|skew|latency|buffer|Inserted|Root|Sink|level' "$CTS_LOG" 2>/dev/null | head -80 || true
  fi
} | write_rpt "$RES/cts_skew.rpt"

# --- cts_metrics_summary.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - CTS Metrics Summary"
  echo "==============================================================================="
  grep -hE '^(tns|wns)|worst slack|Clock|skew|Total\s+[0-9]' \
    "$RES/cts_timing.rpt" "$RES/cts_power.rpt" "$RES/cts_skew.rpt" 2>/dev/null || true
} | write_rpt "$RES/cts_metrics_summary.rpt"


# ==============================================================================
# 5. ROUTING STAGE PACKING
# ==============================================================================
ROUTE_DRC_LOG="$(find_first \
  "$RUNS"/ace_run/logs/routing/*detailed.log \
  "$RUNS"/*/logs/routing/*detailed.log \
  "$RES"/logs_routing_*detailed.log || true)"

ROUTE_STA_LOG="$(find_first \
  "$RUNS"/ace_run/logs/routing/*sta*.log \
  "$RUNS"/*/logs/routing/*sta*.log \
  "$RES"/logs_routing_*sta*.log || true)"

ROUTE_WIRE_LOG="$(find_first \
  "$RUNS"/ace_run/logs/routing/*wire_lengths*.log \
  "$RES"/logs_routing_*wire_lengths*.log || true)"

ANTENNA_RPT="$(find_first \
  "$RUNS"/ace_run/reports/routing/*antenna*.rpt \
  "$RUNS"/*/reports/routing/*antenna*.rpt \
  "$RES"/*antenna*.rpt || true)"

# --- routing_timing.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Post-Routing Static Timing Report"
  echo "Source: $(basename "${ROUTE_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${ROUTE_STA_LOG:-}" && -f "$ROUTE_STA_LOG" ]]; then
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$ROUTE_STA_LOG" || true
    echo ""
    extract_block 'report_wns' < "$ROUTE_STA_LOG" || true
    echo ""
    extract_block 'report_worst_slack' < "$ROUTE_STA_LOG" || true
    echo ""
    echo "-------------------------------------------------------------------------------"
    echo "Critical Timing Paths (Post-Route Max/Setup)"
    echo "-------------------------------------------------------------------------------"
    awk '/Startpoint:/,/slack \((MET|VIOLATED)\)/' "$ROUTE_STA_LOG" | head -160 || true
  else
    echo "Routing STA log not available."
  fi
} | write_rpt "$RES/routing_timing.rpt"

# --- routing_power.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Post-Routing Power Report"
  echo "Source: $(basename "${ROUTE_STA_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${ROUTE_STA_LOG:-}" && -f "$ROUTE_STA_LOG" ]]; then
    extract_block 'report_power' < "$ROUTE_STA_LOG" || true
    grep -E '^Total[[:space:]]+[0-9]|Group[[:space:]]+Internal|Sequential|Combinational|Clock' "$ROUTE_STA_LOG" || true
  fi
} | write_rpt "$RES/routing_power.rpt"

# --- routing_drc.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Detailed Routing DRC Report"
  echo "Source: $(basename "${ROUTE_DRC_LOG:-unknown}")"
  echo "==============================================================================="
  echo ""
  if [[ -n "${ROUTE_DRC_LOG:-}" && -f "$ROUTE_DRC_LOG" ]]; then
    grep -E 'violations|DRC|Short|Spacing|violation|Routing completed' "$ROUTE_DRC_LOG" 2>/dev/null | tail -60 || true
  fi
} | write_rpt "$RES/routing_drc.rpt"

# --- routing_antenna.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Antenna Violation Check & Diode Report"
  echo "==============================================================================="
  echo ""
  if [[ -n "${ANTENNA_RPT:-}" && -f "$ANTENNA_RPT" ]]; then
    cat "$ANTENNA_RPT"
  fi
  find "$RUNS" -path '*/logs/routing/*antenna*.log' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    grep -E 'diode|antenna|violation|pin' "$f" 2>/dev/null | tail -50 || true
  done
} | write_rpt "$RES/routing_antenna.rpt"

# --- routing_metrics_summary.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Routing Metrics Summary"
  echo "==============================================================================="
  echo ""
  if [[ -n "${ROUTE_WIRE_LOG:-}" && -f "$ROUTE_WIRE_LOG" ]]; then
    echo "--- Wire Length by Layer ---"
    cat "$ROUTE_WIRE_LOG"
    echo ""
  fi
  grep -hE '^(tns|wns)|worst slack|violations|Total\s+[0-9]' \
    "$RES/routing_timing.rpt" "$RES/routing_power.rpt" "$RES/routing_drc.rpt" 2>/dev/null || true
} | write_rpt "$RES/routing_metrics_summary.rpt"


# ==============================================================================
# 6. SIGNOFF STAGE PACKING
# ==============================================================================
SIGNOFF_MIN_STA="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*rcx_mcsta.min.log \
  "$RES"/logs_signoff_*rcx_mcsta.min.log || true)"
SIGNOFF_MAX_STA="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*rcx_mcsta.max.log \
  "$RES"/logs_signoff_*rcx_mcsta.max.log || true)"
SIGNOFF_NOM_STA="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*rcx_mcsta.nom.log \
  "$RES"/logs_signoff_*rcx_mcsta.nom.log || true)"
SIGNOFF_MAGIC_LOG="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*gdsii.log \
  "$RUNS"/ace_run/logs/signoff/*magic*.log \
  "$RES"/logs_signoff_*gdsii.log || true)"
SIGNOFF_LVS_LOG="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*lvs*.log \
  "$RES"/logs_signoff_*lvs*.log || true)"
SIGNOFF_IRDROP_LOG="$(find_first \
  "$RUNS"/ace_run/logs/signoff/*irdrop*.log \
  "$RES"/logs_signoff_*irdrop*.log || true)"

# --- signoff_timing_multicorner.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Multi-Corner Signoff Static Timing Analysis"
  echo "==============================================================================="
  echo ""
  for c_log in "$SIGNOFF_NOM_STA" "$SIGNOFF_MAX_STA" "$SIGNOFF_MIN_STA"; do
    [[ -n "$c_log" && -f "$c_log" ]] || continue
    echo "==========================================================================="
    echo "Corner: $(basename "$c_log")"
    echo "==========================================================================="
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$c_log" || true
    echo ""
    echo "Critical Setup Path:"
    awk '/Startpoint:/,/slack \((MET|VIOLATED)\)/' "$c_log" | head -100 || true
    echo ""
  done
} | write_rpt "$RES/signoff_timing_multicorner.rpt"

# --- signoff_power.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Signoff Power Report"
  echo "==============================================================================="
  echo ""
  for c_log in "$SIGNOFF_NOM_STA" "$SIGNOFF_MAX_STA" "$SIGNOFF_MIN_STA"; do
    [[ -n "$c_log" && -f "$c_log" ]] || continue
    echo "Corner: $(basename "$c_log")"
    extract_block 'report_power' < "$c_log" || true
    grep -E '^Total[[:space:]]+[0-9]|Group[[:space:]]+Internal' "$c_log" || true
    echo ""
  done
} | write_rpt "$RES/signoff_power.rpt"

# --- signoff_drc.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Magic / KLayout Physical DRC Signoff Report"
  echo "==============================================================================="
  echo ""
  drc_found=0
  for f in \
    "$RUNS"/ace_run/reports/signoff/*drc* \
    "$RUNS"/*/reports/signoff/*drc* \
    "$RES"/*signoff*drc* \
    "$RES"/signoff_*drc* \
    "$RES"/logs_signoff_*drc* \
    "$RUNS"/ace_run/logs/signoff/*drc*; do
    [[ -f "$f" ]] || continue
    echo "##### Source: $(basename "$f") #####"
    cat "$f"
    echo ""
    drc_found=1
  done

  # Search Magic streamout / DRC logs
  for f in \
    "$RUNS"/ace_run/logs/signoff/*gdsii.log \
    "$RUNS"/ace_run/logs/signoff/*magic*.log \
    "$RES"/logs_signoff_*gdsii.log \
    "$RES"/logs_signoff_*magic*.log; do
    [[ -f "$f" ]] || continue
    echo "--- Source: $(basename "$f") ---"
    grep -E 'DRC|violation|Error|Feedback|errors|COUNT|clean' "$f" 2>/dev/null | tail -50 || true
    echo ""
    drc_found=1
  done

  if [[ "$drc_found" -eq 0 ]]; then
    echo "No DRC report or log file located in run artifacts."
  fi
} | write_rpt "$RES/signoff_drc.rpt"

# --- signoff_lvs.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Netgen Layout vs. Schematic (LVS) Signoff Report"
  echo "==============================================================================="
  echo ""
  lvs_found=0
  for f in \
    "$RUNS"/ace_run/reports/signoff/*lvs* \
    "$RUNS"/*/reports/signoff/*lvs* \
    "$RES"/*signoff*lvs* \
    "$RES"/signoff_*lvs* \
    "$RES"/logs_signoff_*lvs* \
    "$RUNS"/ace_run/logs/signoff/*lvs*; do
    [[ -f "$f" ]] || continue
    echo "##### Source: $(basename "$f") #####"
    cat "$f"
    echo ""
    lvs_found=1
  done

  if [[ "$lvs_found" -eq 0 ]]; then
    echo "No LVS comparison report or log located in run artifacts."
  fi
} | write_rpt "$RES/signoff_lvs.rpt"

# --- signoff_irdrop.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Power Integrity & IR Drop Report"
  echo "==============================================================================="
  echo ""
  if [[ -n "${SIGNOFF_IRDROP_LOG:-}" && -f "$SIGNOFF_IRDROP_LOG" ]]; then
    cat "$SIGNOFF_IRDROP_LOG"
  elif [[ -f "$RES/logs_signoff_34-irdrop.log" ]]; then
    cat "$RES/logs_signoff_34-irdrop.log"
  else
    echo "No IR drop log located."
  fi
} | write_rpt "$RES/signoff_irdrop.rpt"

# --- signoff_metrics_summary.rpt ---
{
  echo "==============================================================================="
  echo "Ace-Seek OpenROAD Flow - Signoff Metrics Summary"
  echo "==============================================================================="
  echo ""
  grep -hE '^(tns|wns)|worst slack|DRC|Circuits match|violations|Total\s+[0-9]|Count:\s*[0-9]+' \
    "$RES/signoff_timing_multicorner.rpt" \
    "$RES/signoff_power.rpt" \
    "$RES/signoff_drc.rpt" \
    "$RES/signoff_lvs.rpt" 2>/dev/null || true
} | write_rpt "$RES/signoff_metrics_summary.rpt"


# ==============================================================================
# 7. CURATION & CLEANUP (KEEP VALID LOGS & CURATED ARTIFACTS)
# ==============================================================================
# Prune temporary unneeded debris without touching stage reports, ODBs, DEFs, or logs
for f in "$RES"/*; do
  [[ -f "$f" ]] || continue
  bn=$(basename "$f")
  case "$bn" in
    # Keep all generated stage reports
    *_timing.rpt|*_power.rpt|*_stat.rpt|*_skew.rpt|*_drc.rpt|*_antenna.rpt|*_lvs.rpt|*_irdrop.rpt|*_metrics_summary.rpt|*_summary.rpt|*_area_util.rpt) continue ;;
    # Keep real deliverables
    *.def|*.odb|*.v|*.nl.v|*.pnl.v|*.sdc|*.spef|*.gds|*.gds.gz|metrics.csv|RUN_DIR.txt) continue ;;
    # Keep stage logs
    logs_*.log|logs_*.warnings|logs_*.errors) continue ;;
    # Keep raw reports from OpenLane
    *.rpt) continue ;;
  esac

  # Drop intermediate temporary files
  if [[ "$bn" =~ tmp_placement|global_skip|merged\.(max|min|nom)\.lef|ace_run_tmp|run_ace_run_tmp ]]; then
    rm -f "$f" || true
  fi
done

echo "ACE-Seek: Stage report packing complete. Curated reports generated in $RES:"
ls -lh "$RES"/*.rpt 2>/dev/null || true
