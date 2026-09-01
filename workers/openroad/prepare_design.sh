#!/usr/bin/env bash
# Prepare OpenLane design tree from flat handoff files
# Usage: prepare_design.sh <job_dir> <design_name> <top_module> [pdk]
set -euo pipefail

JOB_DIR="${1:?}"
DESIGN_NAME="${2:-design}"
TOP="${3:-top}"
PDK="${4:-sky130A}"
SLUG="${DESIGN_SLUG:-ace_design}"

mkdir -p "$JOB_DIR/designs/$SLUG/src" "$JOB_DIR/results" "$JOB_DIR/input/tb"

# Testbench / sim-only files must NOT go into OpenLane VERILOG_FILES (Yosys fails on #delay / $dump*)
is_tb_file() {
  local bn
  bn=$(basename "$1")
  # name patterns
  [[ "$bn" =~ ^[Tt][Bb]_ ]] && return 0
  [[ "$bn" =~ ^[Tt][Bb]\. ]] && return 0
  [[ "$bn" =~ _tb\. ]] && return 0
  [[ "$bn" =~ _test\. ]] && return 0
  [[ "$bn" =~ _tb_ ]] && return 0
  # path under tb/
  [[ "$1" == *"/tb/"* ]] && return 0
  # content heuristics
  if grep -qE '\$dumpfile|\$dumpvars|\$finish|always\s*#' "$1" 2>/dev/null; then
    return 0
  fi
  return 1
}

# Move flat inputs if present (single top.v — avoid duplicate module definitions)
if [[ -f "$JOB_DIR/input/constraints.sdc" ]]; then
  cp "$JOB_DIR/input/constraints.sdc" "$JOB_DIR/designs/$SLUG/src/${TOP}.sdc"
fi
# Prefer explicit top.v, else rtl.v, else first non-TB *.v
if [[ -f "$JOB_DIR/input/${TOP}.v" ]] && ! is_tb_file "$JOB_DIR/input/${TOP}.v"; then
  cp "$JOB_DIR/input/${TOP}.v" "$JOB_DIR/designs/$SLUG/src/${TOP}.v"
elif [[ -f "$JOB_DIR/input/rtl.v" ]]; then
  cp "$JOB_DIR/input/rtl.v" "$JOB_DIR/designs/$SLUG/src/${TOP}.v"
elif [[ -d "$JOB_DIR/input" ]]; then
  first_v=""
  for f in "$JOB_DIR/input"/*.v "$JOB_DIR/input"/*.sv; do
    [[ -f "$f" ]] || continue
    is_tb_file "$f" && continue
    first_v="$f"
    break
  done
  if [[ -n "$first_v" ]]; then
    cp "$first_v" "$JOB_DIR/designs/$SLUG/src/${TOP}.v"
  fi
fi
# Additional verilog modules (skip top already copied + all testbenches)
if [[ -d "$JOB_DIR/input" ]]; then
  for f in "$JOB_DIR/input"/*.v "$JOB_DIR/input"/*.sv; do
    [[ -f "$f" ]] || continue
    bn=$(basename "$f")
    [[ "$bn" == "rtl.v" || "$bn" == "${TOP}.v" ]] && continue
    if is_tb_file "$f"; then
      # keep for sim stages only — not OpenLane synth
      cp "$f" "$JOB_DIR/input/tb/$bn"
      echo "Skipping testbench for OpenLane synth: $bn"
      continue
    fi
    # skip if content identical to top
    if [[ -f "$JOB_DIR/designs/$SLUG/src/${TOP}.v" ]] && cmp -s "$f" "$JOB_DIR/designs/$SLUG/src/${TOP}.v"; then
      continue
    fi
    cp "$f" "$JOB_DIR/designs/$SLUG/src/$bn"
  done
fi

# Production: never invent RTL. Missing sources must fail the job hard.
if ! ls "$JOB_DIR/designs/$SLUG/src"/*.v >/dev/null 2>&1 && \
   ! ls "$JOB_DIR/designs/$SLUG/src"/*.sv >/dev/null 2>&1; then
  echo "ERROR: no RTL (.v/.sv) in designs/$SLUG/src — upload design before OpenLane" >&2
  echo "ACE-Seek: prepare_design FAILED — missing RTL (refusing placeholder top)" >&2
  exit 4
fi

# Default SDC only when missing (warn loudly — constraints should come from Project)
if ! ls "$JOB_DIR/designs/$SLUG/src"/*.sdc >/dev/null 2>&1; then
  echo "WARN: no SDC found — writing minimal default clock constraint for ${TOP}" >&2
  cat >"$JOB_DIR/designs/$SLUG/src/${TOP}.sdc" <<EOF
create_clock -name clk -period 10.0 [get_ports clk]
set_input_delay  -clock clk 1.0 [all_inputs]
set_output_delay -clock clk 1.0 [all_outputs]
EOF
fi

# Ace-Seek IO planner → OpenLane pin_order.cfg (FP_PIN_ORDER_CFG)
# OpenLane odbpy/io_place.py forbids freeform `# comment` lines (only #N/#E/#S/#W)
# and treats pin names as regex — escape [ ] etc.
if [[ -f "$JOB_DIR/input/pin_order.cfg" ]]; then
  python3 - "$JOB_DIR/input/pin_order.cfg" "$JOB_DIR/designs/$SLUG/pin_order.cfg" <<'PY'
import re, pathlib, sys
src = pathlib.Path(sys.argv[1])
dst = pathlib.Path(sys.argv[2])
order = {s: [] for s in "NESW"}
cur = None
for line in src.read_text().splitlines():
    t = line.strip()
    if not t:
        continue
    if re.match(r"^#[NESW]R?$", t):
        cur = t[1]
        continue
    if t.startswith("#"):
        continue  # drop illegal freeform comments
    if not cur:
        continue
    pin = t.split()[0]
    # unescape then re-escape so we don't double-escape
    pin = re.sub(r"\\([.*+?^${}()|[\]\\])", r"\1", pin)
    pin = re.sub(r"([.*+?^${}()|[\]\\])", r"\\\1", pin)
    order[cur].append(pin)
lines = []
for s in "NESW":
    lines.append(f"#{s}")
    lines.extend(order[s])
dst.parent.mkdir(parents=True, exist_ok=True)
dst.write_text("\n".join(lines) + "\n")
n = sum(len(v) for v in order.values())
print(f"Installed sanitized pin_order.cfg ({n} pins) for OpenLane io_place")
PY
fi

# Infer clock period from SDC if present
PERIOD="10.0"
SDC_FILE=$(ls "$JOB_DIR/designs/$SLUG/src"/*.sdc 2>/dev/null | head -1 || true)
if [[ -n "$SDC_FILE" ]]; then
  P=$(grep -Eo -- '-period[[:space:]]+[0-9.]+' "$SDC_FILE" | head -1 | awk '{print $2}')
  [[ -n "$P" ]] && PERIOD="$P"
fi

# PDK-aware routing layer defaults (user_openlane_config merge can override)
RT_MAX_LAYER="met4"
case "$PDK" in
  gf180mcu*|GF180*) RT_MAX_LAYER="Metal4" ;;
  sky130*) RT_MAX_LAYER="met4" ;;
  *) RT_MAX_LAYER="met4" ;;
esac

# Explicit VERILOG_FILES list (no tb_*.v) — safer than dir::src/*.v
VERILOG_LIST=$(
  ls "$JOB_DIR/designs/$SLUG/src"/*.v "$JOB_DIR/designs/$SLUG/src"/*.sv 2>/dev/null \
    | while read -r vf; do
        bn=$(basename "$vf")
        is_tb_file "$vf" && continue
        echo "dir::src/$bn"
      done \
    | paste -sd, - || true
)
if [[ -z "${VERILOG_LIST:-}" ]]; then
  VERILOG_LIST="dir::src/${TOP}.v"
fi

# OpenLane 1.x config.json (compat with openlane docker image)
cat >"$JOB_DIR/designs/$SLUG/config.json" <<EOF
{
  "DESIGN_NAME": "${TOP}",
  "VERILOG_FILES": "${VERILOG_LIST}",
  "CLOCK_PORT": "clk",
  "CLOCK_PERIOD": ${PERIOD},
  "FP_SIZING": "absolute",
  "DIE_AREA": "0 0 200 200",
  "CORE_AREA": "10 10 190 190",
  "FP_CORE_UTIL": 20,
  "FP_PDN_MULTILAYER": true,
  "FP_PDN_CORE_RING": true,
  "FP_PDN_ENABLE_RAILS": true,
  "RT_MAX_LAYER": "${RT_MAX_LAYER}",
  "PL_ESTIMATE_PARASITICS": true,
  "PL_TIME_DRIVEN": true,
  "PL_RESIZER_DESIGN_OPTIMIZATIONS": true,
  "RUN_LINTER": false,
  "QUIT_ON_SYNTH_CHECKS": false,
  "QUIT_ON_MAGIC_DRC": false,
  "QUIT_ON_LVS_ERROR": false,
  "QUIT_ON_TR_DRC": false,
  "QUIT_ON_KLAYOUT_DRC": false,
  "QUIT_ON_ILLEGAL_OVERLAPS": false,
  "PRIMARY_GDSII_STREAMOUT_TOOL": "magic",
  "RUN_MAGIC": true,
  "RUN_KLAYOUT": true,
  "RUN_KLAYOUT_DRC": false,
  "RUN_KLAYOUT_XOR": false,
  "MAGIC_EXT_USE_GDS": true
}
EOF

# Optional SDC path for OpenLane + ensure VERILOG_FILES is a proper JSON list if comma-separated
python3 - <<PY
import json, os
p="$JOB_DIR/designs/$SLUG/config.json"
with open(p) as f: c=json.load(f)
sdc="$SDC_FILE"
if sdc:
    c["BASE_SDC_FILE"]="dir::src/" + os.path.basename(sdc)
# Ace-Seek IO planner pin order (if present under design dir)
pin_cfg = os.path.join("$JOB_DIR/designs/$SLUG", "pin_order.cfg")
if os.path.isfile(pin_cfg):
    c["FP_PIN_ORDER_CFG"] = "dir::pin_order.cfg"
    print("FP_PIN_ORDER_CFG=dir::pin_order.cfg")
# OpenLane accepts space or list; use list form for clarity
vf = c.get("VERILOG_FILES", "")
if isinstance(vf, str) and "," in vf:
    c["VERILOG_FILES"] = [x.strip() for x in vf.split(",") if x.strip()]
with open(p,"w") as f: json.dump(c,f,indent=2)
print("config written VERILOG_FILES=", c.get("VERILOG_FILES"))
if sdc:
    print("BASE_SDC_FILE", c.get("BASE_SDC_FILE"))
# double-check no tb in src
src="$JOB_DIR/designs/$SLUG/src"
for name in os.listdir(src):
    path=os.path.join(src, name)
    if not name.endswith((".v",".sv")): continue
    low=name.lower()
    if low.startswith("tb_") or low.startswith("tb.") or "_tb." in low:
        os.remove(path)
        print("removed leftover testbench from OpenLane src:", name)
PY

echo "Prepared $JOB_DIR/designs/$SLUG for top=$TOP period=$PERIOD pdk=$PDK verilog=$VERILOG_LIST"
