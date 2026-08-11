# Genus commands — problem → solution reference

**Purpose:** Industry command encyclopedia: for each problem, commands that **diagnose** and **fix** it. Not limited to one design.  
**Truth source:** `PLAN/misc/genus_commands/*.txt` and `PLAN/misc/genus_attributes/`. Always `help <cmd>` in your build.  
**UI:** Common UI (`set_db` / `get_db`). Prefer `llength [get_db …]` over inventing `-count`.  
**Full curriculum:** **`GENUS_COMPLETE_INDEX.md`**.  
**Related:** Master Interview, Clocks, CDC, MMMC, DFT, Hierarchical, Physical, Verification, ECO, Macros, Activity power guides.

```tcl
help <command>          ;# always confirm flags in your Genus build
man <command>           ;# often empty — help section is authoritative
```

---

## Table of contents

1. [Master index: problem → commands](#1-master-index-problem--commands)
2. [Session, help, units](#2-session-help-units)
3. [Libraries and tech](#3-libraries-and-tech)
4. [RTL build and hierarchy](#4-rtl-build-and-hierarchy)
5. [Object collections (`get_*` / `all_*`)](#5-object-collections-get_--all_)
6. [Database: `get_db` / `set_db`](#6-database-get_db--set_db)
7. [SDC / clocks / I/O environment](#7-sdc--clocks--io-environment)
8. [Structure: `check_design` and netlist hygiene](#8-structure-check_design-and-netlist-hygiene)
9. [Timing lint and analysis](#9-timing-lint-and-analysis)
10. [Path groups and exceptions](#10-path-groups-and-exceptions)
11. [Synthesis transforms](#11-synthesis-transforms)
12. [QoR, area, power, gates](#12-qor-area-power-gates)
13. [Delay / slew / arc calculation](#13-delay--slew--arc-calculation)
14. [Assigns, constants, ties, undriven](#14-assigns-constants-ties-undriven)
15. [Preserve, dont_touch, dont_use](#15-preserve-dont_touch-dont_use)
16. [Ideal nets, annotated delay](#16-ideal-nets-annotated-delay)
17. [Hierarchy: ungroup / uniquify](#17-hierarchy-ungroup--uniquify)
18. [MMMC / multi-view (when used)](#18-mmmc--multi-view-when-used)
19. [Write-out and handoff](#19-write-out-and-handoff)
20. [End-to-end flow recipe](#20-end-to-end-flow-recipe)
21. [Command catalog (A–Z essentials)](#21-command-catalog-az-essentials)
22. [Tcl patterns and gotchas](#22-tcl-patterns-and-gotchas)

---

## 0. Domain guides (full methods, not just one-liners)

For complete when/where/how beyond this lookup table: **`GENUS_COMPLETE_INDEX.md`**.

| Domain | Guide |
|--------|--------|
| MMMC | `GENUS_MMMC_COMPLETE_GUIDE.md` |
| DFT/scan | `GENUS_DFT_SCAN_COMPLETE_GUIDE.md` |
| Hierarchical | `GENUS_HIERARCHICAL_SYNTHESIS_GUIDE.md` |
| Physical/iSpatial | `GENUS_PHYSICAL_ISPATIAL_GUIDE.md` |
| LEC/GLS/SDF | `GENUS_VERIFICATION_LEC_GLS_SDF_GUIDE.md` |
| ECO/exceptions | `GENUS_ECO_INCREMENTAL_EXCEPTIONS_GUIDE.md` |
| Macros/multibit | `GENUS_MACROS_MULTIBIT_DATAPATH_GUIDE.md` |
| SAIF/VCD power | `GENUS_ACTIVITY_POWER_SAIF_VCD_GUIDE.md` |
| Clocks | `CLOCKS_COMPLETE_USER_GUIDE.md` |
| CDC | `CDC_USER_GUIDE.md` |
| UPF | `HOW_TO_WRITE_UPF_CPF.md` |
| LP | `LOW_POWER_SYNTHESIS_REFERENCE.md` |

---

## 1. Master index: problem → commands

| # | Problem / need | Diagnose | Fix / apply |
|---|----------------|----------|-------------|
| 1 | Time unit / cap unit unknown | `report_units` | Set units in SDC / match liberty |
| 2 | What clocks exist? period, wave, duty | `report_clocks`, `report_clocks -generated`, `get_db clocks .period/.waveform` | `create_clock`, `create_generated_clock`, `read_sdc` |
| 3 | Uncertainty matrix empty / wrong | `report_clocks -uncertainty_table` | `set_clock_uncertainty` (incl. `-from`/`-to` if needed) |
| 4 | Missing / wrong clock on flops | `report_timing -unconstrained`, `check_timing`, `report_clocks` | `create_clock`, fix port name, generated clock |
| 5 | I/O external delay audit | `report_port -delay` | `set_input_delay`, `set_output_delay` |
| 6 | Input slew / driver wrong | `report_port -driver` | `set_input_transition`, `set_driving_cell` |
| 7 | Output load wrong | `report_port -load` | `set_load`, `set_fanout_load` |
| 8 | Setup failing (chip WNS) | `report_qor`, `report_timing`, path groups | Architecture / SDC / `syn_opt` / exceptions (careful) |
| 9 | Which path group fails? | `report_qor`, `report_timing -from/-to` | `group_path`, fix that class |
| 10 | R2R failing | `report_timing -from [all_registers] -to [all_registers]` | Pipeline, map/opt, period, MCP if real |
| 11 | I2R failing | `report_timing -from [all_inputs] -to [all_registers]`, `report_port` | input_delay, drive, register after pad |
| 12 | R2O failing | `report_timing -from [all_registers] -to [all_outputs]`, `report_port -load` | output_delay, load, register before pad |
| 13 | I2O failing (often pads) | `report_timing -from [all_inputs] -to [all_outputs]` | period, pipeline I/O, budgets, not only core opt |
| 14 | Hold failing | `report_timing` min/hold view, post-CTS reality | buffers (PnR), min libs, useful skew — not fake setup |
| 15 | Unconstrained paths | `report_timing -unconstrained` | clocks, I/O delays, remove bad false paths |
| 16 | Timing exceptions applied? | `report_timing -exception_data`, `-path_exceptions` | `set_false_path`, MCP, max/min delay |
| 17 | Case analysis / mode | `report_case_analysis` | `set_case_analysis` |
| 18 | CDC between clocks | `report_clocks`, path report | `set_clock_groups`, structured false paths |
| 19 | Multicycle needed | path report + arch | `set_multicycle_path` setup+hold pair |
| 20 | Point-to-point budget | path report | `set_max_delay` / `set_min_delay` |
| 21 | Local path margin tweak | path report | `path_adjust` / `set_path_adjust` (**ps**) |
| 22 | Derates | `report_timing_derate`, derate columns on timing | `set_timing_derate` |
| 23 | Arc delay math | `report_delay_calculation`, `report_slew_calculation` | fix load/slew/cell, not guess |
| 24 | DRV max_tran / max_cap | `report_constraint`, path transitions | size/buffer, `set_max_transition`, load |
| 25 | High fanout nets | `report_nets -min_fanout`, `report_nets -sort` | buffer (opt), split logic |
| 26 | Unresolved modules | `check_design -unresolved` | `read_hdl`, load liberty, fix name |
| 27 | Multi-driven nets | `check_design -multiple_driver` | fix RTL |
| 28 | Undriven pins | `check_design -undriven` | connect RTL, `connect -constant`, ties |
| 29 | Unloaded flops/ports | `check_design -unloaded` | dead logic, DFT, `delete_unloaded_undriven` |
| 30 | Unloaded combo | `check_design -unloaded_comb` | map/opt, or cleanup |
| 31 | Assigns in netlist | `check_design -assigns` | `set_remove_assign_options`, `remove_assigns_without_opt`, `set_db remove_assigns` |
| 32 | Constants / pad ties | `check_design -constant` | intentional OK; `add_tieoffs` for cells |
| 33 | Constants via TIE cells | `check_design -through_tie_cell` | `add_tieoffs` |
| 34 | Combo loops | `check_design -combo_loops`, `report_loop` | break loop, latch intent |
| 35 | Lib vs LEF mismatch | `check_design -lib_lef_consistency` | align physical libs |
| 36 | Logical-only cells | `check_design -logical_only` | provide LEF or avoid place |
| 37 | Tie undriven to 0/1 | `check_design -undriven` | `connect -constant 0\|1`, then `add_tieoffs` |
| 38 | Dead hierarchy cleanup | unloaded/undriven reports | `delete_unloaded_undriven` |
| 39 | RTL won’t elaborate | log / unresolved | `read_hdl`, defines, `-sv` |
| 40 | Wrong top / no pads | hierarchy report | `elaborate pad_top` vs `top` |
| 41 | Library not linked | missing cells | `set_db library`, `read_libs`, `check_library` |
| 42 | Dont_use wrong cells | cell choice in timing | `set_dont_use`, `set_db … .dont_use` |
| 43 | Opt won’t touch block | frozen logic | `report_dont_touch`, preserve attrs |
| 44 | Need flatten hierarchy | area/timing hier wall | `ungroup`, auto-ungroup reports |
| 45 | Need unique copies | shared module issue | `uniquify` |
| 46 | Ideal clock/reset | optimistic paths | `set_ideal_network` / remove ideal |
| 47 | Annotated delay debug | path vs real | `set_annotated_delay`, `reset_annotated_*` |
| 48 | Area too big | `report_area`, `report_gates` | opt, ungroup, Vt, architecture |
| 49 | Power | `report_power` | SAIF/TCF, LP intent, clock gate attrs |
| 50 | Write netlist/SDC/DB | — | `write_hdl`, `write_sdc`, `write_db`, `write_design` |
| 51 | Common DB Innovus | — | `write_db -common` |
| 52 | LEC netlist | — | `write_hdl -lec` |
| 53 | Messages / silent fails | `report_messages` | fix root cause in log |
| 54 | Full design health | `check_design -all`, `report_qor` | stage-appropriate fixes |
| 55 | Count objects | `get_db …` | `llength [get_db …]` **not** `-count` |
| 56 | Interactive object info | `report_obj`, `get_db` | — |
| 57 | Analysis view | `report_analysis_views` | `set_analysis_view`, MMMC create_* |
| 58 | Scan / DFT clocks | DFT reports | DFT setup cmds (flow-specific) |

---

## 2. Session, help, units

| Need | Command |
|------|---------|
| Help | `help <cmd>` |
| Manual (often empty) | `man <cmd>` |
| Time/cap/res units | `report_units` |
| Tool messages | `report_messages` |
| Redirect report to file | `report_… > file.rpt` |
| Tcl variable capture | `redirect -variable var { help foo }` (lab extract pattern) |

```tcl
report_units
help report_timing
help check_design
```

---

## 3. Libraries and tech

| Need | Command / attr |
|------|----------------|
| Set target libs | `set_db library {lib1.lib lib2.lib}` |
| Alternate load | `read_libs` |
| Target / link libraries | `set_db target_library`, `set_db link_library` |
| Check library | `check_library` |
| Instance’s library cell | `report_instance_library`, `get_db insts .base_cell` |
| Dont use cells | `set_dont_use`, `set_db [get_db lib_cells *] .dont_use true` |
| Interconnect model | `set_db interconnect_mode {wireload\|ple}` |
| Wireload mode | `set_db wireload_mode {top\|enclosed\|segmented}` |

```tcl
set_db library [list $LIB_SS $IO_SS]
check_library
llength [get_db lib_cells *TIE*]
```

**Problem:** pad cells unresolved → load **IO liberty** with stdcell, elaborate `pad_top`.

---

## 4. RTL build and hierarchy

| Need | Command |
|------|---------|
| Read Verilog | `read_hdl file.v` |
| Read SystemVerilog | `read_hdl -sv file.sv` |
| Build design | `elaborate <top>` |
| Reload DB | `read_db` |
| Hierarchy view | `report_hierarchy` |
| Modules | `report_module` |
| Sequentials | `report_sequential` |

```tcl
read_hdl [list alu8.v ... practice_chip.v]
read_hdl -sv pad_top.sv
elaborate pad_top
report_hierarchy > hierarchy.rpt
```

**Problem:** wrong top (no pads) → `elaborate pad_top` not `top`.  
**Problem:** SV syntax fail → use `read_hdl -sv`.

---

## 5. Object collections (`get_*` / `all_*`)

| Collection | Command |
|------------|---------|
| All clocks | `all_clocks` / `get_clocks *` |
| All inputs | `all_inputs` |
| All outputs | `all_outputs` |
| All registers | `all_registers` |
| Ports | `get_ports *` / `get_ports pad_clk` |
| Cells / insts | `get_cells *` (legacy-style) / prefer `get_db insts` |
| Pins | `get_pins` / `get_db pins` |
| Nets | `get_nets` / `get_db nets` |
| Filter clocks | `get_clocks -filter …` / `get_clocks -regexp` |

```tcl
set data_in [remove_from_collection [all_inputs] [get_ports {pad_clk pad_rst_n}]]
set_input_delay 0.2 -clock CLK $data_in
```

---

## 6. Database: `get_db` / `set_db`

### Usage (verified)

```text
get_db [-if expr] [-expr expr] [-unique] [-depth min/max] [-invert] [-regexp] [-match_hier] ...
set_db [-quiet|-verbose] <objects|shorthand> .<attr> <value>
```

### Everyday patterns

```tcl
# Count (no -count flag)
llength [get_db insts *]
llength [get_db ports *]
llength [get_db insts -if {.is_sequential == true}]

# Clocks
get_db clocks
get_db [get_db clocks *CLK*] .name
get_db [get_db clocks *CLK*] .period
get_db [get_db clocks *CLK*] .waveform

# Pins / nets
get_db pins *u_core*/clk*
get_db [get_db pins *u_pad_clk*] .net

# Library cells
get_db lib_cells *BUF*
set_db [get_db lib_cells *CK*] .dont_use true

# Design attrs
set_db remove_assigns true
set_db use_tiehilo_for_const {none}
set_db interconnect_mode {wireload}
```

### Problem → `get_db` / `set_db`

| Problem | Approach |
|---------|----------|
| Find high fanout | `get_db nets -if {.num_loads > 40}` (attr name may vary — check with help) |
| Freeze IP | `set_db [get_db insts u_ip*] .preserve true` |
| Enable assign removal | `set_db remove_assigns true` |
| Tie policy during opt | `set_db use_tiehilo_for_const …` |

Discover attributes from: `PLAN/misc/genus_attributes/` or interactive help.

---

## 7. SDC / clocks / I/O environment

### Read / write

| Need | Command |
|------|---------|
| Read SDC | `read_sdc [-stop_on_errors] [-view] [-echo] [-verbose] file.sdc` |
| Write SDC | `write_sdc [-strict] [-view] [-version] > file.sdc` |

### Clocks

| Need | Command |
|------|---------|
| Create clock | `create_clock -name CLK -period T [-waveform {r f}] [get_ports …]` |
| Generated clock | `create_generated_clock …` |
| Report | `report_clocks`, `-generated`, `-uncertainty_table`, `-ideal` |
| Uncertainty | `set_clock_uncertainty [-setup\|-hold] [-from/-to …] value clocks` |
| Latency | `set_clock_latency` |
| Transition | `set_clock_transition` |
| Skew (legacy-style) | `set_clock_skew` |
| Sense / invert | `set_clock_sense` |
| Groups (async) | `set_clock_groups` |
| Active clocks | `set_active_clocks` |
| Gating check | `set_clock_gating_check` / `set_disable_clock_gating_check` |

```tcl
create_clock -name CLK -period 2.0 -waveform {0.0 1.0} [get_ports pad_clk]
set_clock_uncertainty -setup 0.05 [get_clocks CLK]
set_clock_uncertainty -hold  0.02 [get_clocks CLK]
report_clocks
report_clocks -uncertainty_table

# Frequency (ns units): MHz = 1000/period
# Duty high % = 100*(fall-rise)/period
```

### I/O delays

| Need | Command |
|------|---------|
| Input delay | `set_input_delay [-max\|-min] [-clock] [-add_delay] value ports` |
| Output delay | `set_output_delay` (same style) |
| Audit | `report_port -delay [all_inputs\|all_outputs]` |

**Slack math reminder:** `input_delay` → **arrival ↑**; `output_delay` → **required ↓** (setup).

### Environment

| Need | Command |
|------|---------|
| Fixed slew | `set_input_transition [-max\|-min] [-rise\|-fall] value ports` |
| Driving cell | `set_driving_cell -lib_cell X -pin Z ports` |
| Load | `set_load [-max\|-min] [-pin_load\|-wire_load] value ports` |
| Drive (legacy) | `set_drive` / `reset_drive` |
| Fanout load | `set_fanout_load` |
| Audit | `report_port -driver`, `report_port -load` |

```tcl
report_port -delay  [all_inputs]
report_port -driver [all_inputs]
report_port -load   [all_outputs]
set_input_transition -max 0.15 $data_in
set_load -max 0.05 [all_outputs]
```

### Design rule style constraints

| Need | Command |
|------|---------|
| Max transition | `set_max_transition` |
| Min transition | `set_min_transition` |
| Max cap | `set_max_capacitance` |
| Min cap | `set_min_capacitance` |
| Max fanout | `set_max_fanout` |
| Min fanout | `set_min_fanout` |
| Min pulse width | `set_min_pulse_width` |
| Report vios | `report_constraint` |

### Case / disable

| Need | Command |
|------|---------|
| Constant mode pin | `set_case_analysis 0\|1 pin` |
| Report cases | `report_case_analysis` |
| Disable arc | `set_disable_timing` |

---

## 8. Structure: `check_design` and netlist hygiene

### Full usage (verified)

```text
check_design [-undriven] [-unloaded] [-unloaded_comb] [-multiple_driver]
  [-unresolved] [-constant] [-through_tie_cell] [-feedthrough]
  [-cross_hier] [-assigns] [-all] [-collection] [-preserved]
  [-physical_only] [-logical_only] [-lib_lef_consistency]
  [-threshold_fanout n] [-combo_loops] [-status] [design] [> file]
```

### Problem → flag → fix

| Problem | `check_design` flag | Fix commands |
|---------|---------------------|--------------|
| Missing module/lib cell | `-unresolved` | `read_hdl`, fix name, `set_db library` |
| Two drivers | `-multiple_driver` | RTL fix |
| Floating pin | `-undriven` | RTL connect, `connect -constant`, later `add_tieoffs` |
| Dead flop/port | `-unloaded` | RTL, DFT, `delete_unloaded_undriven` |
| Dead combo | `-unloaded_comb` | `syn_map`/`syn_opt`, cleanup |
| Verilog assigns | `-assigns` | `remove_assigns_without_opt`, `set_db remove_assigns`, options cmds |
| Tied 0/1 | `-constant` | Intentional? else RTL; physical: `add_tieoffs` |
| Via TIE cell | `-through_tie_cell` | Expected after `add_tieoffs` |
| Empty module | `-feedthrough` | fill or expected shell |
| Combo cycle | `-combo_loops` | redesign / break |
| Cross-hier check | `-cross_hier` | with undriven/multi/const/unloaded |
| Lib/LEF | `-lib_lef_consistency` | fix LEF/lib pairing |
| Status code | `-status` | returns 1 if anything reported |
| Tcl list | `-collection` | script loops |

```tcl
check_design -all > check_all.rpt
check_design -unresolved
check_design -multiple_driver
check_design -undriven
check_design -assigns
check_design -constant
check_design -combo_loops
```

### Connectivity

| Need | Command |
|------|---------|
| Connect pins | `connect` |
| Tie constant | `connect -constant 0\|1 <pins>` |
| Disconnect | `disconnect` |
| Query constant | `get_constant <pin\|port>` |
| What is connected | `all_connected` |
| Mark unconnected ports | `set_unconnected` |

```tcl
connect -constant 0 [get_db pins <path>]
get_constant [get_db pins <path>]
```

### Cleanup

| Need | Command |
|------|---------|
| Dead const subports | `delete_unloaded_undriven [-disconnect\|-all\|…] design` |
| Tie cells | `add_tieoffs -high CELL -low CELL [-max_fanout n] design` |

---

## 9. Timing lint and analysis

| Need | Command |
|------|---------|
| Timing lint | `check_timing` (help may be empty — still run) |
| Path report | `report_timing` |
| QoR dashboard | `report_qor` |
| Timing summary | `report_timing_summary` |
| Constraint vios | `report_constraint` |
| Unconstrained | `report_timing -unconstrained` |
| Full clock path | `report_timing -path_type full_clock` |
| Summary / endpoint | `report_timing -path_type summary\|endpoint\|full` |
| Nets / hier pins on path | `report_timing -nets -hpins` |
| Exceptions on path | `report_timing -exception_data` |
| Filter by group | `report_timing -group <cost_group>` |
| Filter endpoints | `report_timing -from … -to … -through …` |
| Multi paths | `report_timing -max_paths N -nworst M` |
| View | `report_timing -views <view>` / `report_qor -view` |

### `report_timing` essentials (verified gist)

```tcl
report_timing -max_paths 20 -nworst 1
report_timing -path_type full_clock -max_paths 5
report_timing -unconstrained -max_paths 50
report_timing -from [all_registers] -to [all_registers] -max_paths 10
report_timing -from [all_inputs] -to [all_outputs] -max_paths 10
report_timing -from [all_inputs] -to [all_registers] -max_paths 10
report_timing -from [all_registers] -to [all_outputs] -max_paths 10
report_timing -nets -hpins -max_paths 3
report_timing -exception_data -max_paths 5
```

### Problem recipes

**Setup red — first 5 minutes**

```tcl
report_units
report_qor
report_timing -max_paths 5 -nworst 1
report_timing -from [all_registers] -to [all_registers] -max_paths 5
report_timing -from [all_inputs] -to [all_outputs] -max_paths 5
report_port -delay [all_inputs]
report_port -delay [all_outputs]
report_port -driver [all_inputs]
report_port -load [all_outputs]
report_clocks
```

**I2O vs R2R split (pad chips)**

```tcl
report_timing -from [all_inputs] -to [all_outputs]    > i2o.rpt
report_timing -from [all_registers] -to [all_registers] > r2r.rpt
```

---

## 10. Path groups and exceptions

### Path groups

| Need | Command |
|------|---------|
| Create cost group | `group_path -name NAME -from … -to … [-weight] [-priority] [-setup\|-hold]` |
| Path group options | `set_path_group_options` |
| Path adjust (ps) | `path_adjust` / `set_path_adjust -delay <ps> -from/-to …` |

```tcl
group_path -name reg2reg -from [all_registers] -to [all_registers]
group_path -name in2reg  -from [all_inputs]    -to [all_registers]
group_path -name reg2out -from [all_registers] -to [all_outputs]
group_path -name in2out  -from [all_inputs]    -to [all_outputs]
```

**Note:** Groups change **optimization priority and reporting**, not physics.

### Exceptions

| Need | Command |
|------|---------|
| False path | `set_false_path -from/-to/-through … [-setup\|-hold]` |
| Multicycle | `set_multicycle_path <N> -setup\|-hold -from/-to …` |
| Max delay | `set_max_delay value -from/-to …` |
| Min delay | `set_min_delay value -from/-to …` |
| Clock groups | `set_clock_groups -asynchronous\|-logically_exclusive …` |
| Derate | `set_timing_derate` |
| Report derate | `report_timing_derate` |

```tcl
set_false_path -from [get_ports pad_rst_n]
set_multicycle_path 2 -setup -from A -to B
set_multicycle_path 1 -hold  -from A -to B
set_max_delay 1.5 -from [get_ports src*] -to [get_ports dst*]
```

**Problem:** green QoR but fake — review every `set_false_path` / MCP with architecture proof.

---

## 11. Synthesis transforms

| Stage | Command | Backend (short) |
|-------|---------|-----------------|
| Generic | `syn_generic [-physical] [-create_floorplan] [-estimate_flop_bits]` | Tech-independent gates |
| Map | `syn_map [-physical]` | Liberty cells |
| Opt | `syn_opt [-logical] [-spatial] [-incremental]` | Size/restruct/buffer QoR |

```tcl
syn_generic
syn_map
syn_opt
```

| Problem | Action |
|---------|--------|
| Need structure only | stop after `syn_generic`; `write_hdl -generic` |
| Need gates for PnR | `syn_map` + `syn_opt` |
| Physical-aware | `-physical` / `syn_opt -spatial` (flow-dependent) |
| Incremental iSpatial | `syn_opt -incremental` |

---

## 12. QoR, area, power, gates

| Need | Command |
|------|---------|
| QoR | `report_qor [-levels_of_logic] [-power] [-no_power] [-view]` |
| Area | `report_area` |
| Gate inventory | `report_gates` |
| Power | `report_power` |
| Utilization | `report_utilization` |
| Congestion (phys) | `report_congestion` |
| Logic levels hist | `report_logic_levels_histogram` |
| Summary | `report_summary` |
| Instance | `report_instance` |
| Metric | `report_metric` |

```tcl
report_qor > qor.rpt
report_gates > gates.rpt
report_area > area.rpt
```

---

## 13. Delay / slew / arc calculation

| Need | Command |
|------|---------|
| Cell/net delay math | `report_delay_calculation -from pin -to pin` |
| Cell delay | `report_cell_delay_calculation` |
| Net delay | `report_net_delay_calculation` |
| Net cap | `report_net_cap_calculation` |
| Net R | `report_net_res_calculation` |
| Slew math | `report_slew_calculation` |
| Annotated checks | `report_annotated_check` |

```tcl
report_delay_calculation -from u1/A -to u1/Y
```

**Problem:** “is it DRV or logic depth?” → path transitions + `report_delay_calculation` + `report_constraint`.

---

## 14. Assigns, constants, ties, undriven

| Need | Command |
|------|---------|
| See assigns | `check_design -assigns` |
| Configure remove | `set_remove_assign_options` / `add_assign_buffer_options` |
| Query options | `get_remove_assign_options [-all] [-design]` |
| Remove assigns | `remove_assigns_without_opt [-design] [-verbose] …` |
| Attr path | `set_db remove_assigns true` |
| Constants | `check_design -constant` |
| Insert TIEHI/LO | `add_tieoffs -high … -low … [-max_fanout] [-verbose]` |
| Through tie | `check_design -through_tie_cell` |
| Tie undriven | `connect -constant`, then `add_tieoffs` |
| Dead cleanup | `delete_unloaded_undriven` |

```tcl
check_design -assigns
get_remove_assign_options -all
remove_assigns_without_opt -design pad_top -verbose
add_tieoffs -high TIEHBWP16P90 -low TIELBWP16P90 -max_fanout 8 -verbose pad_top
```

---

## 15. Preserve, dont_touch, dont_use

| Need | Command |
|------|---------|
| Dont use lib cells | `set_dont_use` |
| Dont touch | `set_dont_touch` |
| Report | `report_dont_touch`, `check_design -preserved` |
| Write preserves | `write_preserves` |
| Preserve attrs | `set_db <insts> .preserve true` (and related attrs) |

**Problem:** opt ignores critical path inside IP → check preserve/dont_touch.

---

## 16. Ideal nets, annotated delay

| Need | Command |
|------|---------|
| Ideal network | `set_ideal_network`, `reset_ideal_network` |
| Ideal net | `set_ideal_net`, `remove_ideal_net` |
| Ideal latency | `set_ideal_latency`, `reset_ideal_latency` |
| Ideal transition | `set_ideal_transition`, `reset_ideal_transition` |
| Annotate delay | `set_annotated_delay`, `reset_annotated_delay` |
| Annotate transition | `set_annotated_transition`, `reset_annotated_transition` |
| Annotate check | `set_annotated_check`, `reset_annotated_check` |

**Problem:** optimistic timing on reset/clock → ideal network applied; remove for realism later.

---

## 17. Hierarchy: ungroup / uniquify

| Need | Command |
|------|---------|
| Ungroup | `ungroup` |
| Report ungroup candidates | `report_ungroup_modules`, `report_auto_ungroup_hierarchies` |
| Uniquify | `uniquify` |
| Boundary opt report | `report_boundary_opt` |

---

## 18. MMMC / multi-view (when used)

| Need | Command |
|------|---------|
| Library set | `create_library_set` / `update_library_set` |
| RC corner | `create_rc_corner` / `update_rc_corner` |
| Delay corner | `create_delay_corner` / `update_delay_corner` |
| Constraint mode | (constraint mode create — see dump list) |
| Analysis view | `create_analysis_view` / `update_analysis_view` |
| Activate views | `set_analysis_view` |
| Report views | `report_analysis_views` |
| Read MMMC file | `read_mmmc` |
| SDC per view | `read_sdc -view <view>` |
| QoR per view | `report_qor -view <view>` |

---

## 19. Write-out and handoff

| Need | Command |
|------|---------|
| Verilog netlist | `write_hdl` / `write_netlist` (`-generic`, `-lec`, `-pg`, `-abstract`) |
| SDC out | `write_sdc` |
| Internal DB | `write_db [-design] [-common] [-legacy]` |
| Snapshot | `write_design -base_name path` |
| Read back DB | `read_db` |

```tcl
write_hdl > outputs/pad_top.v
write_sdc > outputs/pad_top.sdc
write_db -design pad_top db/pad_top.db
catch { write_db -common -design pad_top db/pad_top_common.db }
```

**Handoff checklist commands**

```tcl
check_design -unresolved
check_design -multiple_driver
check_design -assigns
check_design -combo_loops
report_qor
report_timing -unconstrained -max_paths 20
write_hdl ; write_sdc ; write_db
```

---

## 20. End-to-end flow recipe

```mermaid
flowchart LR
  A[libs + read_hdl] --> B[elaborate]
  B --> C[check_design]
  C --> D[SDC]
  D --> E[syn_generic]
  E --> F[syn_map]
  F --> G[syn_opt]
  G --> H[qor/timing/power]
  H --> I[cleanup write]
```

```tcl
# 0 units / libs
report_units
set_db library [list $STD_SS $IO_SS]

# 1 RTL
read_hdl $v_files
read_hdl -sv $sv_files
elaborate $TOP
check_design -unresolved
check_design -multiple_driver
check_design -undriven

# 2 SDC + env
read_sdc design.sdc
report_clocks
report_port -delay [all_inputs]
report_port -driver [all_inputs]
report_port -load [all_outputs]
# optional group_path ...

# 3 lint
check_design -all > pre.rpt
catch { check_timing > check_timing.rpt }
report_timing -unconstrained -max_paths 50

# 4 synth
syn_generic
syn_map
syn_opt

# 5 QoR
report_qor
report_timing -max_paths 20
report_timing -from [all_registers] -to [all_registers] -max_paths 10
report_timing -from [all_inputs] -to [all_outputs] -max_paths 10

# 6 cleanup
check_design -assigns
# remove_assigns_without_opt -design $TOP
add_tieoffs -high TIEH… -low TIEL… -max_fanout 8 $TOP
check_design -all > post.rpt

# 7 write
write_hdl > out.v
write_sdc > out.sdc
write_db -design $TOP out.db
```

Lab script: `practice/scripts/run_genus_pad_top.tcl`.

---

## 21. Command catalog (A–Z essentials)

Commands below exist under `PLAN/misc/genus_commands/` unless noted. Usage = typical; run `help`.

### A–C

| Command | One-line use |
|---------|----------------|
| `add_assign_buffer_options` | Configure assign→buffer policy |
| `add_tieoffs` | Constants → TIEHI/TIELO |
| `all_clocks` | All clock objects |
| `all_connected` | Connectivity query |
| `all_inputs` / `all_outputs` / `all_registers` | Collections |
| `check_design` | Netlist structure health |
| `check_library` | Liberty checks |
| `check_timing` | Constraint/timing lint |
| `connect` | Connect / `-constant` |
| `create_analysis_view` | MMMC view |
| `create_clock` | Define clock |
| `create_delay_corner` | MMMC |
| `create_generated_clock` | Divided/derived clock |
| `create_library_set` | MMMC libs |
| `create_rc_corner` | MMMC RC |

### D–G

| Command | One-line use |
|---------|----------------|
| `delete_unloaded_undriven` | Clean dead hierarchy/ports |
| `disconnect` | Break pin connection |
| `elaborate` | Build hierarchy from HDL |
| `get_clocks` | Clock collection |
| `get_constant` | Query pin constant state |
| `get_db` | Query objects/attributes |
| `get_cells` / `get_nets` / `get_pins` / `get_ports` | Object collections |
| `get_remove_assign_options` | Show assign-remove settings |
| `group_path` | Cost / path groups |

### P–R (path / report)

| Command | One-line use |
|---------|----------------|
| `path_adjust` | Adjust path constraint (ps) |
| `read_db` / `read_def` / `read_hdl` / `read_libs` / `read_mmmc` / `read_sdc` | Inputs |
| `remove_assigns_without_opt` | Assign → buffer without full opt |
| `report_analysis_views` | MMMC views |
| `report_area` | Area |
| `report_case_analysis` | Case values |
| `report_clocks` | Clock period/wave/sources |
| `report_constraint` | Constraint violations |
| `report_delay_calculation` | Arc delay math |
| `report_dont_touch` | Frozen objects |
| `report_gates` | Cell counts |
| `report_hierarchy` | Hierarchy |
| `report_messages` | Tool messages |
| `report_nets` | Fanout/cap nets |
| `report_obj` | Object report |
| `report_port` | Port delay/driver/load |
| `report_power` | Power |
| `report_qor` | WNS/TNS/area dashboard |
| `report_sequential` | Flops/latches |
| `report_slew_calculation` | Slew math |
| `report_timing` | Paths / slack |
| `report_timing_derate` | Derates |
| `report_timing_summary` | Short timing |
| `report_units` | Units |
| `report_ungroup_modules` | Ungroup info |

### S

| Command | One-line use |
|---------|----------------|
| `set_analysis_view` | Active setup/hold views |
| `set_annotated_delay` | Force delay annotation |
| `set_case_analysis` | Mode pin constant |
| `set_clock_groups` | Async/exclusive clocks |
| `set_clock_latency` | Source/network latency |
| `set_clock_transition` | Clock slew |
| `set_clock_uncertainty` | Uncertainty |
| `set_db` | Set attributes |
| `set_disable_timing` | Disable timing arcs |
| `set_dont_touch` / `set_dont_use` | Freeze / ban cells |
| `set_driving_cell` | External driver model |
| `set_false_path` | Remove timing check |
| `set_ideal_network` / `set_ideal_net` | Idealize nets |
| `set_input_delay` / `set_output_delay` | External path budgets |
| `set_input_transition` | Port slew |
| `set_load` | Port capacitance |
| `set_max_delay` / `set_min_delay` | Path delay limits |
| `set_max_transition` / `set_max_capacitance` / `set_max_fanout` | DRC-style |
| `set_multicycle_path` | Multi-cycle |
| `set_path_adjust` | Path adjust wrapper |
| `set_remove_assign_options` | Assign removal options |
| `set_timing_derate` | OCV derates |
| `set_unconnected` | Mark ports unconnected |
| `syn_generic` / `syn_map` / `syn_opt` | Synthesis stages |

### U–W

| Command | One-line use |
|---------|----------------|
| `ungroup` | Flatten hierarchy instances |
| `uniquify` | Unique module copies |
| `write_db` | Write database (`-common`) |
| `write_design` | Snapshot |
| `write_hdl` / `write_netlist` | Verilog out |
| `write_sdc` | Constraints out |

### More reports (exist in dump — use when needed)

`report_annotated_check`, `report_boundary_opt`, `report_cell_delay_calculation`, `report_clock_gates`, `report_clock_gating_quality`, `report_clock_groups`, `report_congestion`, `report_design_rules`, `report_dp`, `report_flow`, `report_instance`, `report_instance_library`, `report_logic_levels_histogram`, `report_loop`, `report_low_power_intent`, `report_memory`, `report_metric`, `report_min_pulse_width`, `report_mode`, `report_module`, `report_net_cap_calculation`, `report_net_delay_calculation`, `report_net_res_calculation`, `report_ple`, `report_power_intent`, `report_runtime`, `report_scan_*`, `report_summary`, `report_utilization`, `report_yield`, …

### More reads/writes

See `ls PLAN/misc/genus_commands/read_*.txt` and `write_*.txt` (~30 read / ~50 write). Common extras: `read_def`, `read_parasitics`, `read_saif`, `read_tcf`, `read_vcd`, `read_sdf`, `read_power_intent`, `write_sdf`, `write_script`, …

**Full list:** `PLAN/misc/all_genus_commands.txt` (~700+ commands).

---

## 22. Tcl patterns and gotchas

| Do | Don’t |
|----|-------|
| `llength [get_db insts *]` | Invent `get_db -count` |
| `help report_timing` before new flags | Copy random web flags blindly |
| `report_units` before interpreting delays | Assume ns vs ps |
| Split I2O vs R2R reports | Trust only chip WNS |
| `catch { check_timing … }` if help empty | Assume command missing without trying |
| Document every `set_false_path` | False-path to green QoR |
| Redirect `> file.rpt` | Lose interactive-only results |

### Save everything pattern

```tcl
set R reports
file mkdir $R
report_qor > $R/qor.rpt
report_timing -max_paths 50 > $R/timing.rpt
check_design -all > $R/check_design.rpt
report_clocks > $R/clocks.rpt
report_port -delay [all_inputs] > $R/in_delay.rpt
report_port -load [all_outputs] > $R/out_load.rpt
```

### Interactive debug loop

```tcl
report_timing -max_paths 1 -path_type full_clock
# note startpoint endpoint cells
report_delay_calculation -from <pinA> -to <pinB>
report_port -driver [get_ports <in>]
get_db [get_db insts <name>] .base_cell.name
```

---

## Document control

| Field | Value |
|-------|--------|
| Path | `manual_asic/practice/docs/GENUS_COMMANDS.md` |
| Command source | `PLAN/misc/genus_commands/`, `all_genus_commands.txt` |
| Lab runner | `practice/scripts/run_genus_pad_top.tcl` |

**How to use in an interview or debug session**

1. Find your symptom in **§1 Master index**.  
2. Run **Diagnose** column.  
3. Apply **Fix** column.  
4. Confirm with `report_qor` / `check_design` / path report.  
5. If flag unknown → `help <cmd>` in Genus + dump file under `PLAN/misc`.

---

*End of Genus commands reference.*
