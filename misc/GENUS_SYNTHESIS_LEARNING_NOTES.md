# Practice chip — Genus synthesis learning notes

Hand-on notes from the practice flow (pad_top + core, TSMC 16nm FFC).  
**Not PLAN automation** — concepts and commands you run yourself.

**Related docs**

| File | Topic |
|------|--------|
| `REAL_PAD_RING_LEARNING.md` | Pad ring: power, corners, fillers (Innovus vs RTL) |
| `PIN_SIDE_TABLE_TEMPLATE.md` | Side/order table for pads |
| `../rtl/PAD_CHECKLIST.md` | pad_top checklist |
| `../innovus/IO_FILE_GUIDE.md` | `read_io_file` / `write_io_file -template` |
| `../../pdk_rtl2gds/README.md` | Local PDK kit layout |

---

## 1. Project layout

```text
/mnt/data2/hemanth/manual_asic/
  practice/
    rtl/           # core + pad_top.sv
    sdc/           # your SDC (or rtl/ if you put it there)
    work_syn/      # Genus cwd
    outputs/       # netlist, sdc out
    database/      # write_db
    reports/
    docs/          # this file
  pdk_rtl2gds/     # tech LEF, libs, IO (symlinks to foundry tree)
```

---

## 2. Genus vs Innovus launch

| Tool | Command | Notes |
|------|---------|--------|
| Genus | `genus` | Default = Common UI (`set_db`). **No** `genus -stylus` |
| Genus old | `genus -legacy_ui` | Only for old scripts |
| Innovus | `innovus -stylus` | Stylus / Common UI |

Help dumps: `PLAN/misc/genus_commands`, `PLAN/misc/genus_attributes`.

**Count objects in Genus** (no `-count` on `get_db`):

```tcl
llength [get_db insts *u_pad*]
```

---

## 3. Synthesis flow (order)

```text
1. Start Genus in work_syn
2. Load libs (stdcell SS + IO SS if pad_top)
3. read_hdl core (+ pad_top.sv for pads)
4. elaborate pad_top   (or top if core-only)
5. SDC + driving cell + load
6. check_design / check_timing
7. syn_generic → syn_map → syn_opt
8. report_qor / report_timing
9. write_hdl / write_sdc / write_db
```

### 3.1 Core-only vs chip with pads

| Top | Netlist in Innovus |
|-----|---------------------|
| `top` | Core only — **no** pad cells |
| `pad_top` | Pads + core — **pads present** |

Pads are **linked from IO liberty**, not “synthesized” into stdcells.

```tcl
set_db library [list \
  .../practice_minimal/lib_ss.lib \
  .../practice_minimal/io_ss.lib \
]
read_hdl ... core files ...
read_hdl -sv ../rtl/pad_top.sv
elaborate pad_top
```

### 3.2 Single corner lib (why SS only for first synth)

```text
practice_minimal/lib_ss.lib
  → …tcbn16ffcllbwp16p90ssgnp0p72vm40c_ccs.lib
```

| Corner | Role |
|--------|------|
| **SS** (slow, often cold @ 16nm) | Setup-hard — good **single** synth target |
| **FF** | Hold / fast — mainly **Innovus MMMC** later |
| **TT** | Typical — not sole worst-case setup target |

**16nm temp inversion:** worst setup is not always “SS hot”; cold + low V (e.g. `m40c`) is often critical. Full signoff uses foundry corner matrix (MMMC), not one lib forever.

### 3.3 `read_libs` switches (when you need them)

| Switch | Use when |
|--------|----------|
| plain / `set_db library` | Main timing libs — **you use this** |
| `-max_libs` / `-min_libs` | Multi-corner setup/hold in Genus |
| `-aocv_libs` / `-socv` | Advanced OCV / statistical derates |
| `-noise_libs` | SI |
| `-library_side_file` | Macro/SRAM side files |

First practice: **only** timing libs (stdcell + IO). Rest later.

---

## 4. SDC concepts (write yourself)

### 4.1 Order to write

1. `set_units -time ns` (optional)  
2. `create_clock`  
3. `set_clock_uncertainty` (optional)  
4. `set_input_delay`  
5. `set_output_delay`  
6. `set_false_path` on async reset  
7. Optional: `set_driving_cell`, `set_load`, transitions  

For **`pad_top`**, ports are `pad_clk`, `pad_rst_n`, … not `clk`.

### 4.2 Clock and duty cycle

```tcl
create_clock -name CLK -period 2.0 [get_ports pad_clk]
# default duty ~50%: rise 0, fall period/2
# explicit 50%: -waveform {0 1.0}
```

| Duty | Matters most for |
|------|------------------|
| 50% default | Normal **posedge→posedge** design |
| 20–80 etc. | Half-cycle paths (pos→neg in same period) |

Practice chip: **50% is enough**.

### 4.3 Uncertainty

```tcl
set_clock_uncertainty 0.02 [get_clocks CLK]   ;# 20 ps — mild
# 0.2 = 200 ps → setup slightly harder (~0.18 ns vs 0.02)
```

- Models jitter / simple margin.  
- **Does not fix** multi-ns I2O fails.  
- `report_clocks -uncertainty_table` shows **clock-to-clock** matrix (often **empty** for simple single-clock uncertainty).  
- To fill table:  
  `set_clock_uncertainty 0.2 -from [get_clocks CLK] -to [get_clocks CLK]`  
- Verify: `report_clocks`, `get_db` on clock, or re-`read_sdc` (watch typo: `uncertainty` not `uncertainity`).

### 4.4 Input / output delay

```tcl
set_input_delay  0.1 -clock CLK [remove_from_collection [all_inputs] [get_ports pad_clk]]
set_output_delay 0.2 -clock CLK [all_outputs]
```

| Command | Meaning |
|---------|---------|
| Input delay | Outside launches data **X ns after** clock → less time for chip |
| Output delay | Outside needs data **Y ns before** next edge → less time for chip |

**Larger delay ⇒ tighter setup (worse slack)** on I2R/I2O.  
**R2R** usually unchanged.  
Δ 0.2→0.5 in ≈ **~0.3 ns** worse I2O slack — small next to pad delays.

### 4.5 Source / network latency

```tcl
# set_clock_latency -source ...
# set_clock_latency ...   ;# network
```

- **Source:** before clock definition point (board/PLL).  
- **Network:** clock tree to flops (real after CTS).  
- **Genus first synth:** usually **omit** (ideal clock).  
- Real insertion delay after **Innovus CTS** / propagated clocks.

### 4.6 Driving cell, load, transition

| Constraint | Models |
|------------|--------|
| `set_driving_cell` | Who drives **inputs** → computes slew |
| `set_load` | Capacitance on **outputs** |
| `set_input_transition` / `set_clock_transition` | Direct slew — optional if driving cell set |

```tcl
set_driving_cell -lib_cell <REAL_BUF_FROM_LIB> [remove_from_collection [all_inputs] [get_ports {pad_clk pad_rst_n}]]
set_load 0.05 [all_outputs]    ;# often ~0.05 pF if units are pF — learning placeholder
```

**`set_load 0.05`:** external **capacitance**, not delay. Affects last-stage delay/sizing. Not a foundry magic number.

**Transition:** not required if driving cell already cleared “no driver/transition” lint.

### 4.7 Re-apply SDC in Genus

```tcl
set_interactive_constraint_modes [all_constraint_modes -active]
read_sdc -echo ../path/to/top_func.sdc
# update_constraint_mode also exists; read_sdc is clearer for learning
```

Then `check_timing` / `report_timing` — **incremental syn_opt not required** just to see constraint effect.

---

## 5. check_design (structure)

| Item | Your post-opt | Issue? |
|------|---------------|--------|
| Unresolved / undriven / multidriven | 0 | No |
| Unloaded combo | 0 after opt (7 pre-map = dead generic) | Soft pre-map |
| Constant leaf pins ~350 | Pad ties `1'b0/1'b1` | Expected |
| Logical only ~1512 | Mapped cells + pads | Normal |
| Assigns 0 after opt | Good | OK |

---

## 6. check_timing (constraints lint)

| Lint | Meaning | Hard fail? |
|------|---------|------------|
| Clock pins without waveform = 0 | `create_clock` reaches flops | Must be 0 |
| Inputs/outputs without clocked external delays = 0 | I/O delay applied | Good |
| Inputs without driver/transition | No slew model | Soft — fix with driving cell |
| Outputs without external load | No cap model | Soft — fix with `set_load` |

Lint ≠ timing closed. **report_qor / report_timing** show real slack.

---

## 7. Path types and reports

### 7.1 Path groups (I2R / R2R / R2O / I2O)

| Group | From → To |
|-------|-----------|
| I2R | Input → Register |
| R2R | Register → Register |
| R2O | Register → Output |
| I2O | Input → Output |

**Genus:**

```tcl
define_cost_group -name I2O -design pad_top
define_cost_group -name R2R -design pad_top
# ...
path_group -from [all_inputs] -to [all_outputs] -group I2O -name pg_i2o
path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
set_path_group_options I2O -effort_level high -weight 10
```

**Path grouping alone does not fix WNS.** It **classifies** and can **steer opt effort**. Real fix: period / RTL pipeline / honest exceptions.

### 7.2 Example results (your session)

| Path | Type | Result @ 2 ns |
|------|------|----------------|
| `pad_addr_i[2]` → `pad_zero_flag` | **I2O** (pads + combo) | **VIOLATED ~−3.5 ns** → design **WNS** |
| MAC `y_reg` / `prod_r` → `y_reg[15]` via adder | **R2R** | **MET ~+0.97 ns** |

Pads alone ~0.7 ns in + ~1.4 ns out already ≥ period. Core MAC depth ~1 ns is fine.

### 7.3 Reading a timing path

- **MET / VIOLATED** + slack  
- **Required** ≈ capture edge − setup − output_delay − uncertainty…  
- **Arrival** ≈ launch + input_delay + datapath (+ drv adjust)  
- **Slack** = required − arrival (setup)  
- **Drv Adjust / huge Trans** = external driver + pin load slew modeling  
- **(I)** net latency = ideal clock (pre-CTS)

### 7.4 report_qor fields

| Field | Your ballpark | Meaning |
|-------|---------------|---------|
| WNS | −3495 ps | Worst path slack |
| TNS | huge negative | Sum of violations |
| Violating paths | ~489 | How many paths fail |
| Leaf instances | ~1512 | Cell count |
| Max fanout | can be ≫10 | Soft rule; not I2O root cause |

---

## 8. max_fanout

```tcl
set_db max_fanout 10
syn_opt
```

- **Soft** preference — Genus may still leave fanout 16–18 (especially after **pad C**).  
- Inserts buffers (`BUFF*`, `fopt*`) when it can.  
- **Does not** fix multi-ns I2O (pad arcs dominate).  
- Check global: `report_qor` Max Fanout line, not only one path.

---

## 9. Overcoming I2O (real levers)

| Approach | Effect |
|----------|--------|
| Longer period (5–10 ns) | Large improvement |
| Register outputs / flags / inputs (pipeline) | Path type changes; real high-F approach |
| Multicycle (only if interface allows) | More setup cycles |
| False path (only if path not real) | Removes check — don’t fake |
| Path group high effort | Small |
| max_fanout / tiny SDC tweaks | Negligible vs pads |

---

## 10. Pads in RTL vs Innovus

| In RTL (`pad_top.sv`) | In Innovus later |
|------------------------|------------------|
| PDID / PDDW signal pads | PFILLER\* edge fill |
| Optional: document power/corners | PCORNER, PVDD\*, PCLAMP\*, PCBRTE\* |
| | `write_io_file -template …` then edit + `read_io_file` |

Fillers = **physical** edge fill after IO place — not required in functional RTL.

### Innovus IO file template (you run)

```tcl
write_io_file -template -io_order clockwise -include_cell_name pad_top_template.io
read_io_file pad_top_template.io
```

See `../innovus/IO_FILE_GUIDE.md`.

---

## 11. After synth — write results

```tcl
write_hdl > ../outputs/pad_top_netlist.v
write_sdc > ../outputs/pad_top_func.sdc
write_db    ../database/pad_top_syn.db
report_qor  > ../reports/syn_qor.rpt
report_timing -nworst 50 > ../reports/syn_timing.rpt
```

Netlist with pads → Innovus with tech LEF + stdcell LEF + **IO LEF** + MMMC (SS setup + FF hold later).

---

## 12. Planned flow (your choice)

```text
Genus:  single SS lib (+ IO lib for pads) → netlist
Innovus: MMMC (SS setup + FF hold + QRC) → place / CTS / route → GDS path
```

---

## 13. Command cheatsheet (Genus)

```tcl
# libs
set_db library [list lib_ss.lib io_ss.lib]

# rtl
read_hdl ../rtl/....v
read_hdl -sv ../rtl/pad_top.sv
elaborate pad_top

# sdc
read_sdc ../sdc/top_func.sdc
set_driving_cell -lib_cell <BUF> ...
set_load 0.05 [all_outputs]
check_timing
check_design

# synth
set_db syn_generic_effort medium
syn_generic
set_db syn_map_effort medium
syn_map
set_db syn_opt_effort medium
syn_opt

# reports
report_qor
report_timing -nworst 10
report_timing -group I2O -nworst 5
llength [get_db insts *u_pad*]
get_db lib_cells *PDIDWUWSWCDG_V*
```

---

## 14. Session takeaways

1. **Structure** can be clean while **timing** fails at aggressive F with pads.  
2. **R2R MET** and **I2O VIOLATED** can coexist — WNS follows the worst.  
3. **SS single lib** is a valid synth start; **16nm** full closure needs multi-corner later.  
4. Soft rules (fanout, mild uncertainty) ≠ multi-ns pad I2O fix.  
5. Learn constraints by **changing one number** and re-reporting the **same path**.

---

*Living notes — add your own period experiments, WNS after 10 ns clock, and Innovus steps as you go.*
