#!/usr/bin/env bash
# Build curated placement timing/power/area reports + prune junk from results/.
# Usage: pack_placement_reports.sh <job_dir>
set -euo pipefail
JOB_DIR="${1:?job_dir}"
RES="$JOB_DIR/results"
RUNS="$JOB_DIR/designs/ace_design/runs"
mkdir -p "$RES"

# Prefer real STA logs (OpenLane -no_save often leaves reports/placement empty)
pick_sta_log() {
  local f
  for f in \
    "$RUNS"/ace_run/logs/placement/*dpl_sta.log \
    "$RUNS"/ace_run/logs/placement/*ace_post_place_sta.log \
    "$RUNS"/*/logs/placement/*dpl_sta.log \
    "$RES"/logs_placement_*dpl_sta.log \
    "$RES"/logs_placement_*ace_post_place_sta.log \
    "$RUNS"/ace_run/logs/placement/*gpl_sta.log \
    "$RES"/logs_placement_*gpl_sta.log
  do
    [[ -f "$f" ]] || continue
    if grep -qE 'report_wns|report_power|Design area' "$f" 2>/dev/null; then
      echo "$f"
      return 0
    fi
  done
  return 1
}

STA_LOG="$(pick_sta_log || true)"
echo "[pack_placement] STA_LOG=${STA_LOG:-none}"

extract_block() {
  # stdin → stdout; start at regex, keep ~120 lines or until next ^report_
  local start_re="$1"
  awk -v re="$start_re" '
    BEGIN{on=0; n=0}
    {
      if ($0 ~ re) { on=1; n=0 }
      if (on) {
        print
        n++
        if (n>2 && $0 ~ /^report_/ && $0 !~ re) exit
        if (n>150) exit
      }
    }
  '
}

write_rpt() {
  local dest="$1"
  local tmp="${dest}.tmp.$$"
  cat >"$tmp"
  rm -f "$dest" 2>/dev/null || true
  mv -f "$tmp" "$dest"
}

# --- timing ---
{
  echo "# Ace-Seek placement TIMING"
  echo "# source=$(basename "${STA_LOG:-unknown}")"
  echo ""
  if [[ -n "${STA_LOG:-}" ]]; then
    grep -E 'report_wns|report_tns|report_worst_slack|^wns |^tns |worst slack' "$STA_LOG" || true
    echo ""
    extract_block 'report_wns' < "$STA_LOG" || true
    echo ""
    extract_block 'report_tns' < "$STA_LOG" || true
    echo ""
    extract_block 'report_worst_slack' < "$STA_LOG" || true
  fi
  find "$RUNS" -path '*/reports/placement/*sta*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/placement_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/placement_timing.rpt"

# --- power ---
{
  echo "# Ace-Seek placement POWER"
  echo "# source=$(basename "${STA_LOG:-unknown}")"
  echo ""
  if [[ -n "${STA_LOG:-}" ]]; then
    extract_block 'report_power' < "$STA_LOG" || true
    grep -E '^Total[[:space:]]+[0-9]|Group[[:space:]]+Internal|Sequential|Combinational|Leakage|Switching|Internal' "$STA_LOG" || true
  fi
  find "$RUNS" -path '*/reports/placement/*power*.rpt' -type f 2>/dev/null | while read -r f; do
    echo ""
    echo "##### $(basename "$f") #####"
    cat "$f"
    cp -f "$f" "$RES/placement_$(basename "$f")" 2>/dev/null || true
  done
} | write_rpt "$RES/placement_power.rpt"

# --- area / util ---
{
  echo "# Ace-Seek placement AREA / UTILIZATION"
  echo ""
  if [[ -n "${STA_LOG:-}" ]]; then
    grep -E 'Design area[[:space:]]+[0-9]' "$STA_LOG" || true
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

# --- metrics summary (small) ---
{
  echo "# Ace-Seek placement metrics summary"
  echo "# source=$(basename "${STA_LOG:-unknown}")"
  echo ""
  grep -hE '^(tns|wns)|worst slack|^Total[[:space:]]+|Design area' \
    "$RES/placement_timing.rpt" "$RES/placement_power.rpt" "$RES/placement_area_util.rpt" 2>/dev/null || true
} | write_rpt "$RES/placement_metrics_summary.rpt"

# Remove obsolete empty bundle names
rm -f "$RES/placement_timing_bundle.rpt" "$RES/placement_power_bundle.rpt" 2>/dev/null || true

# Keep one final placement DEF with a stable name
PLACE_DEF=""
for f in \
  "$RUNS"/ace_run/results/placement/*.def \
  "$RUNS"/*/results/placement/*.def \
  "$RES"/results_placement_top.def \
  "$RES"/ace_run_results_placement_top.def
do
  [[ -f "$f" ]] || continue
  PLACE_DEF="$f"
  break
done
if [[ -n "$PLACE_DEF" ]]; then
  cp -f "$PLACE_DEF" "$RES/placement_top.def"
  echo "[pack_placement] DEF → placement_top.def ($(wc -c < "$RES/placement_top.def") bytes)"
fi

# Also keep placement ODB for OpenROAD GUI viewer
PLACE_ODB=""
for f in \
  "$RUNS"/ace_run/results/placement/*.odb \
  "$RUNS"/*/results/placement/*.odb \
  "$RES"/placement_top.odb \
  "$RES"/results_placement_top.odb
do
  [[ -f "$f" ]] || continue
  PLACE_ODB="$f"
  break
done
if [[ -n "$PLACE_ODB" ]]; then
  cp -f "$PLACE_ODB" "$RES/placement_top.odb" 2>/dev/null || true
  echo "[pack_placement] ODB → placement_top.odb"
fi

# --- Prune junk duplicates from results/ (keep curated set) ---
# Keep: placement_*.rpt, placement_top.def, metrics.csv, gds, pin_order, RUN_DIR
shopt -s nullglob
for f in "$RES"/*; do
  [[ -f "$f" ]] || continue
  bn=$(basename "$f")
  keep=0
  case "$bn" in
    placement_timing.rpt|placement_power.rpt|placement_area_util.rpt|placement_metrics_summary.rpt) keep=1 ;;
    placement_top.def|placement_top.odb|placement_*.rpt) keep=1 ;;
    metrics.csv|*.gds|*.gds.gz|pin_order.cfg|RUN_DIR.txt) keep=1 ;;
    # keep final netlist once
    results_placement_top.nl.v|placement_top.nl.v) keep=1 ;;
    # stage ODBs for OpenROAD GUI
    floorplan_top.odb|placement_*.odb|*_top.odb) keep=1 ;;
  esac
  if [[ $keep -eq 1 ]]; then
    continue
  fi
  # Drop intermediate / duplicate placement noise
  if [[ "$bn" =~ tmp_placement|global_skip|merged\.(max|min|nom)\.lef|ace_run_tmp_placement|run_ace_run_tmp|logs_placement_|logs_synthesis_|reports_synthesis_|1-synthesis|3-initial|4-io\.def|cmds\.log|errors\.log|openlane\.log|top\.def$|top\.sdc$|top\.v$|final_def|tmp_merged ]]; then
    rm -f "$f" || true
    continue
  fi
  # Drop duplicate path-prefixed copies of the same DEF
  if [[ "$bn" =~ \.def$ ]] && [[ "$bn" != "placement_top.def" ]]; then
    rm -f "$f" || true
    continue
  fi
  # Drop huge STA logs from results flat dir (content extracted already)
  if [[ "$bn" =~ logs_placement_.*(gpl_sta|dpl_sta|ace_post_place).*\.log$ ]]; then
    rm -f "$f" || true
    continue
  fi
done

echo "[pack_placement] curated results:"
ls -lh "$RES"/placement_* 2>/dev/null || true
wc -c "$RES"/placement_timing.rpt "$RES"/placement_power.rpt "$RES"/placement_area_util.rpt "$RES"/placement_metrics_summary.rpt 2>/dev/null || true
