# Genus Physical-Aware & iSpatial Complete Guide — Deep Reference

**Scope:** Wireload vs PLE, physical flags on syn_*, DEF floorplan, spatial/incremental opt, congestion, utilization, correlation limits. Industry.  
**Index:** `GENUS_COMPLETE_INDEX.md`.

---

## Table of contents

1. [What / why physical-aware synthesis](#1-what--why-physical-aware-synthesis)
2. [Interconnect models](#2-interconnect-models)
3. [Floorplan & DEF](#3-floorplan--def)
4. [syn_generic / map / opt physical flags](#4-syngeneric--map--opt-physical-flags)
5. [iSpatial concepts](#5-ispatial-concepts)
6. [End-to-end flows](#6-end-to-end-flows)
7. [Reports](#7-reports)
8. [Use cases](#8-use-cases)
9. [Attrs that matter](#9-attrs-that-matter)
10. [Issue → fix](#10-issue--fix)
11. [Command cards](#11-command-cards)
12. [Interview FAQ](#12-interview-faq)

---

## 1. What / why physical-aware synthesis

### 1.1 What

Synthesis that uses **placement / floorplan geometry** to estimate wire delay and drive buffering/sizing, instead of only statistical wireload.

### 1.2 Why

| Nanometer fact | Gate delay alone underestimates many paths |
| Congestion | Early warning before full PnR |
| Correlation | Closer to post-place timing |
| Buffering | Long nets get realistic trees |

### 1.3 When

| Phase | Mode |
|-------|------|
| Day-1 RTL | Logical + wireload OK |
| Floorplan available | Physical / PLE |
| Timing critical IP | Spatial / iSpatial |
| Final silicon | Still Innovus + SPEF + signoff STA |

---

## 2. Interconnect models

### 2.1 Attributes

```tcl
set_db interconnect_mode {wireload|ple}
set_db wireload_mode {top|enclosed|segmented}
# wireload_selection from technology liberty if used
```

| Mode | Meaning | When |
|------|---------|------|
| **wireload** | Statistical WLM by fanout | No DEF / early |
| **ple** | Placement-driven layout estimation | With placement/DEF |

| wireload_mode | Idea |
|---------------|------|
| top | Top design WLM |
| enclosed | Hierarchy-enclosed |
| segmented | Segment-based (common default in some flows) |

### 2.2 Limits of wireload

Wrong long-wire critical paths → bad architecture decisions. Prefer PLE when geometry exists.

---

## 3. Floorplan & DEF

### 3.1 Commands

```tcl
read_def design.def
write_def ...
# read_physical if flow provides multi-LEF physical read
```

### 3.2 What DEF should contain for useful physical synth

| Content | Why |
|---------|-----|
| Die / core area | Legal place region |
| Rows / sites | Stdcell placement |
| Macro placements | Fixed IP |
| Tracks (optional) | Routing awareness |
| Blockages | Keep-out |

### 3.3 No DEF options

```tcl
syn_generic -create_floorplan
```

Creates a **square floorplan** at density **0.7** (per Genus help) — learning / early only, not production floorplan quality.

---

## 4. syn_generic / map / opt physical flags

### 4.1 `syn_generic` (verified)

```text
syn_generic [-physical] [-create_floorplan] [-estimate_flop_bits] [<design>+]
```

| Flag | What |
|------|------|
| `-physical` | Consider physical domain |
| `-create_floorplan` | Auto FP if no DEF |
| `-estimate_flop_bits` | Stop early for DFT flop count estimate |

### 4.2 `syn_map` (verified)

```text
syn_map [-physical] [<design>+]
```

| `-physical` | Physical optimization during map |

### 4.3 `syn_opt` (verified)

```text
syn_opt [-logical] [-spatial] [-incremental] [<design>+]
```

| Flag | What | When |
|------|------|------|
| `-spatial` | Quick placement-guided opt | Physical-aware polish |
| `-incremental` | Incremental iSpatial-style | ECO / iterate |
| `-logical` | Innovus-based logic opt | Limited access / licensed |

---

## 5. iSpatial concepts

| Idea | Meaning |
|------|---------|
| Shared tech | Genus opt + Innovus placement algorithms family |
| Incremental | Update netlist without full re-place from scratch |
| Correlation | Better than pure logical; **not** final SPEF signoff |
| Handoff | Common DB (`write_db -common`) often used |

---

## 6. End-to-end flows

```mermaid
flowchart TD
  subgraph LOG["Logical-only"]
    L1[wireload mode] --> L2[syn_generic/map/opt]
  end
  subgraph PHY["Physical with DEF"]
    P1[read_def] --> P2[interconnect_mode ple]
    P2 --> P3[syn_generic -physical]
    P3 --> P4[syn_map -physical]
    P4 --> P5[syn_opt -spatial]
    P5 --> P6[congestion + timing]
  end
  subgraph ITER["Iterate with Innovus"]
    I1[Genus physical] --> I2[Innovus place]
    I2 --> I3[DEF/DB feedback]
    I3 --> I4[syn_opt -incremental]
  end
```

### 6.1 Logical-only

```text
set interconnect wireload → syn_generic → map → opt → write
```

### 6.2 Physical with DEF

```text
read_def
set_db interconnect_mode {ple}
syn_generic -physical
syn_map -physical
syn_opt -spatial
report_congestion / report_timing
write_hdl / write_db -common
```

### 6.3 Iterative with Innovus

```text
Genus physical opt → Innovus place → feedback DEF/DB → Genus incremental opt
```

---

## 7. Reports

| Command | Insight |
|---------|---------|
| `report_congestion` | Hotspots / overflow |
| `report_utilization` | Density |
| `report_ple` | PLE quality |
| `report_timing -physical` | Physical columns if supported |
| `report_qor` | Timing/area with physical netlist |
| `check_placement` | Placement legality (if used) |

---

## 8. Use cases

| Use case | Recipe |
|----------|--------|
| No floorplan | logical or `-create_floorplan` |
| Hard macros fixed | DEF with FIXED macros |
| Congestion | spatial opt + FP change + hierarchy |
| Long net timing | PLE + buffering via opt |
| ECO timing after place | `syn_opt -incremental` |

---

## 9. Attrs that matter

| Attr area | Examples |
|-----------|----------|
| interconnect_mode | wireload / ple |
| wireload_mode | top/enclosed/segmented |
| density targets | floorplan/place attrs |
| CTS cell sets | `cts_clock_gating_cells`, buffer/inv sets (more PnR) |

Search `PLAN/misc/genus_attributes` for `place_`, `route_`, `phys_`.

---

## 10. Issue → fix

| Issue | Fix |
|-------|-----|
| Same QoR as logical | Still on wireload; no real DEF |
| Runtime huge | Physical only on critical partitions |
| Congestion | Channels, utilization, hierarchy |
| Cells outside die | DEF/rows |
| Timing worse | Wrong RC corner; fix MMMC |
| Incremental fails | Need prior physical state/DB |

---

## 11. Command cards

```tcl
set_db interconnect_mode {ple}
read_def floorplan.def
syn_generic -physical
syn_map -physical
syn_opt -spatial
report_congestion > cong.rpt
report_utilization > util.rpt
report_timing -max_paths 20
write_db -common -design TOP top_common.db
```

---

## 12. Interview FAQ

**Q: Wireload vs PLE?** Statistical vs placement-based RC.  
**Q: Is physical synth signoff?** No — still need PnR + extraction.  
**Q: -create_floorplan?** Emergency/early square FP only.  
**Q: -spatial vs -incremental?** Spatial opt vs incremental iSpatial update.

---

*Physical-aware Genus improves correlation; Innovus+SPEF remains the physical tapeout path.*
