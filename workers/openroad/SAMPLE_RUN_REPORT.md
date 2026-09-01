# Sample large RTL pipeline report (PicoRV32)

**Design:** YosysHQ [picorv32](https://github.com/YosysHQ/picorv32) (~3049 LOC) + Ace-Seek top wrapper  
**PDK:** sky130A · **Image:** efabless/openlane  
**Job dir:** `/tmp/ace-openroad-large-run2`  

## 1. Front-end
| Stage | Result |
|-------|--------|
| Lint (Verilator) | **PASS** (warnings only, rc=0) |
| Simulation (iverilog+vvp) | **PASS** — SIM_OK in log |
| Yosys hierarchy/stat | **PASS** — ~1064 cells pre-techmap |

## 2. OpenLane PnR (Docker)
| Stage | Status |
|-------|--------|
| Synthesis (Yosys GL) | **seen / ran** |
| Floorplan | **seen / ran** |
| Powerplan / PDN | **seen / ran** |
| Placement (global+detailed) | **seen / ran** |
| CTS | **seen / ran** |
| Route (global+detailed) | **seen / ran** |
| SPEF + multi-corner STA | **seen / ran** |
| GDS Magic | **seen / ran** |
| GDS KLayout | **seen / ran** |
| LVS | **seen / ran** |
| DRC (Magic) | **seen / ran** |

**OpenLane wrapper status:** `running` — Starting OpenLane flow (synth→GDS)

## 3. GDS / artifacts
- `/tmp/ace-openroad-large-run2/designs/ace_design/runs/ace_run/results/signoff/top.gds` — **46.9 MB**
- `/tmp/ace-openroad-large-run2/designs/ace_design/runs/ace_run/results/signoff/top.klayout.gds` — **28.3 MB**
- `/tmp/ace-openroad-large-run2/designs/ace_design/runs/ace_run/results/signoff/top.magic.gds` — **46.9 MB**
- `/tmp/ace-openroad-large-run2/results/top.gds` — **46.9 MB**
- `/tmp/ace-openroad-large-run2/results/top.klayout.gds` — **28.3 MB**
- `/tmp/ace-openroad-large-run2/results/top.magic.gds` — **46.9 MB**

## Notes
- First large attempt failed placement (core too small); re-run used DIE 1500×1500, PL_TARGET_DENSITY=0.30.
- Lint/sim ran once on the sample before OpenLane.
- GDS was produced before optional late DRC finished (signoff GDS stream-out completed).