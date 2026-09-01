#!/usr/bin/env python3
"""Merge user_openlane_config.json into designs/ace_design/config.json"""
import json, os, sys, re

job = sys.argv[1] if len(sys.argv) > 1 else "."
cfg_path = os.path.join(job, "designs", "ace_design", "config.json")
user_path = os.path.join(job, "user_openlane_config.json")
src_dir = os.path.join(job, "designs", "ace_design", "src")

# Keys that are Ace-Seek UI only — not OpenLane config.json
DROP_KEYS = {
    "LINT_TOP",
    "LINT_WALL",
    "SIM_TB_TOP",
    "SIM_TIMEOUT_CYCLES",
    "IO_PLAN_JSON",
    "IO_USE_PIN_ORDER",
}

c = {}
if os.path.exists(cfg_path):
    with open(cfg_path) as f:
        c = json.load(f)

# Preserve prepare_design VERILOG_FILES (explicit, no testbenches)
prepared_verilog = c.get("VERILOG_FILES")

if os.path.exists(user_path):
    with open(user_path) as f:
        user = json.load(f)
    for k, v in user.items():
        if k in DROP_KEYS:
            continue
        # Never let UI default dir::src/*.v re-open the door to tb files
        if k == "VERILOG_FILES":
            continue
        c[k] = v

# Drop empty string keys that would break OpenLane
c = {k: v for k, v in c.items() if v != "" and v is not None}

# Always wire pin_order.cfg when present (IO planner) — must survive resume merges
design_dir = os.path.join(job, "designs", "ace_design")
pin_cfg = os.path.join(design_dir, "pin_order.cfg")
if os.path.isfile(pin_cfg) and os.path.getsize(pin_cfg) > 0:
    c["FP_PIN_ORDER_CFG"] = "dir::pin_order.cfg"
    print("FP_PIN_ORDER_CFG=dir::pin_order.cfg (from designs/ace_design/pin_order.cfg)")
elif c.get("IO_USE_PIN_ORDER") is False:
    c.pop("FP_PIN_ORDER_CFG", None)

def _truthy(v) -> bool:
    if isinstance(v, bool):
        return v
    if v is None:
        return False
    s = str(v).strip().lower()
    return s in ("1", "true", "yes", "on")


# Sensible PDN defaults
c.setdefault("FP_PDN_CORE_RING", True)
c.setdefault("FP_PDN_ENABLE_RAILS", True)
c.setdefault("FP_PDN_MULTILAYER", True)
# OpenLane hard rule: core rings REQUIRE multilayer (met4+met5).
# Old Ace-Seek defaults left MULTILAYER=false → rings silently omitted / throw.
if _truthy(c.get("FP_PDN_CORE_RING")) and not _truthy(c.get("FP_PDN_MULTILAYER")):
    c["FP_PDN_MULTILAYER"] = True
    print(
        "FP_PDN_MULTILAYER forced true (required when FP_PDN_CORE_RING is on)"
    )

# Re-assert safe verilog list from src/ (exclude tb_*)
if os.path.isdir(src_dir):
    safe = []
    for name in sorted(os.listdir(src_dir)):
        if not name.endswith((".v", ".sv")):
            continue
        low = name.lower()
        if low.startswith("tb_") or low.startswith("tb.") or "_tb." in low:
            # remove if leftover
            try:
                os.remove(os.path.join(src_dir, name))
                print("removed testbench from OpenLane src:", name)
            except OSError:
                pass
            continue
        safe.append(f"dir::src/{name}")
    if safe:
        c["VERILOG_FILES"] = safe if len(safe) > 1 else safe[0]
    elif prepared_verilog:
        c["VERILOG_FILES"] = prepared_verilog

os.makedirs(os.path.dirname(cfg_path), exist_ok=True)
with open(cfg_path, "w") as f:
    json.dump(c, f, indent=2)
print("merged config ->", cfg_path)
for k in sorted(c.keys()):
    print(f"  {k} = {c[k]!r}")
