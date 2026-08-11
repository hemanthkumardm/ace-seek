# Low-power practice on `pad_top` — **no UPF / no CPF**

Single-rail learning lab: **clock gating + power-aware effort + power reports**.  
Not multi-domain (isolation / level shifters / retention).

---

## Why no UPF here

| Included | Excluded (needs UPF later) |
|----------|----------------------------|
| Clock gating (ICG) | Power domains / shutoff |
| `design_power_effort` / `opt_power_effort` | Isolation, level shifters |
| Vectorless `report_power` | SRPG retention |
| CG quality reports | Multi-rail PST |

Pads still dominate **chip** power (~90%). Judge LP success on **`u_core`**.

---

## Run

```bash
cd /mnt/data2/hemanth/manual_asic/practice

# LP run (clock gating ON)
bash scripts/run_syn_lp.sh -batch

# Baseline for A/B (clock gating OFF)
LP_CG=0 bash scripts/run_syn_lp.sh -batch
```

Optional:

```bash
LP_POWER_EFFORT=medium bash scripts/run_syn_lp.sh -batch
SDC_FILE=$PWD/outputs/practice1.sdc bash scripts/run_syn_lp.sh -batch
```

Default SDC: `outputs/practice1.sdc` if present, else `sdc/pad_top_func.sdc`.

---

## Reports to open first

| File | Why |
|------|-----|
| `reports/genus_pad_top_lp/power_u_core_category_mW.rpt` | **Fair** core power |
| `reports/genus_pad_top_lp/power_hierarchy_mW.rpt` | Module-wise |
| `reports/genus_pad_top_lp/power_category_mW.rpt` | Chip total (pads huge) |
| `reports/genus_pad_top_lp/clock_gates.rpt` | ICG inserted? |
| `reports/genus_pad_top_lp/clock_gating_quality.rpt` | CG quality |
| `reports/genus_pad_top_lp/qor.rpt` | Timing still OK? |
| `reports/genus_pad_top_lp/RUN_SUMMARY.txt` | Run tags |

Outputs: `outputs/genus_pad_top_lp/pad_top.v` + `.sdc`, DB `db/pad_top_lp.db`.

---

## Manual commands (same session)

```tcl
# Enable before map/opt
set_db lp_insert_clock_gating true
set_db design_power_effort low
set_db opt_power_effort low

# After syn_opt
report_power -by_category -unit mW -header
report_power -by_hierarchy -unit mW -header
report_power -inst u_core -by_category -unit mW
report_clock_gates -detail -fanout_summary
report_clock_gating_quality
```

---

## How to judge success

| Metric | Expectation |
|--------|-------------|
| CG count / gated sinks | Higher with `LP_CG=1` vs `0` |
| `u_core` dynamic (clock+register) | Often lower with CG |
| Chip total | May barely move (pads dominate) |
| WNS/TNS | Must stay acceptable |

Power without SAIF/VCD is **relative**. Good for A/B; not product signoff.

---

## Next after this lab

1. Innovus + MMMC (physical)  
2. Optional later: small UPF for multi-domain practice  
