# Real pad ring — keep learning (practice → production-like)

You already have a **signal-only** `pad_top.sv` that is electrically correct for
logic pins. A **real** chip also has a **pad ring**: power, ground, corners,
fillers, clamps, and control nets. This note + `pad_top_FULL_REFERENCE.sv`
show that full picture without abandoning self-learning.

---

## 1. Two levels of “done”

| Level | What you have | Enough for |
|-------|----------------|------------|
| **A. Signal shell** | Your current `pad_top.sv` (PDI/PDD only) | Sim core+pads, learn Genus on core, first Innovus with core netlist |
| **B. Ring shell** | Signals + PVDD + PCORNER + PFILLER + PCLAMP + RTE | Closer to tapeout netlist; Innovus pad placement |

Do **not** throw away A. Grow A → B when you are ready.

Reference files:

| File | Use |
|------|-----|
| `rtl/pad_top.sv` | **Your** working file |
| `rtl/pad_top_REFERENCE.sv` | Signal-only correct example |
| `rtl/pad_top_FULL_REFERENCE.sv` | Ring + power + fillers (compare for “real”) |
| `docs/REAL_PAD_RING_LEARNING.md` | This guide |

---

## 2. What a real die edge looks like

```text
        NW PCORNER ---- N signals / VDD / FILL ---- NE PCORNER
            |                                         |
         W  |                                         |  E
       VDD  |              CORE (top)                 | VDD
     signals|                                         | signals
            |                                         |
        SW PCORNER ---- S signals / VDD / FILL ---- SE PCORNER
```

Rules of thumb (foundry app notes refine these):

1. **4 corners** — always (`PCORNER` / `PCORNERA`).
2. **Power every side** — enough `PVDD*` (and VSS strategy per lib) for IR drop.
3. **Signals grouped** — clocks often quiet edges; noisy digital opposite analog.
4. **Fillers** — close gaps so metal/ESD ring is continuous (`PFILLER*`).
5. **Clamps** — ESD paths (`PCLAMP*`).
6. **_H vs _V** — edge orientation (N/S → often `_H`, E/W → `_V`).

---

## 3. Cell roles (your IO lib)

| Cell pattern | Role | In full reference? |
|--------------|------|--------------------|
| `PDID…` | Digital **input** | Yes |
| `PDD…` | Digital **out/GPIO** | Yes |
| `PVDD1…` | Supply (often **core** domain) | Yes |
| `PVDD2…` | Supply (often **IO** domain) | Yes |
| `PCORNER` | Corner | Yes |
| `PFILLER*` | Spacer | Yes |
| `PCLAMP*` | ESD clamp | Yes |
| `PCBRTE_*` | RTE chain stitch | Yes (example) |
| `PRW…` | Richer GPIO | Optional later |
| `PDB*ANA*` | Analog | Not for practice digital |

**Important:** this `tphn16ffcllgv18e` LEF list has **PVDD\*** but **no PVSS\*** macros.
Ground handling is site/foundry-specific (other cells, package, or docs).
Read the GPIO application note PDF under `pdk_rtl2gds/docs/` before tapeout.

---

## 4. How power pads differ from signal pads

| | Signal pad | Power pad (`PVDD*`) |
|--|------------|---------------------|
| Package | One signal ball/pin | VDD (or VSS) ball |
| RTL ports | `PAD` / `C` / `I` | Often **only `RTE`** in verilog |
| Connection | Your logic nets | **Physical** LEF + global power nets in Innovus |
| Count | = number of bits | From IR drop / package (many copies) |

So in RTL you **instantiate** power cells so they exist in the netlist; you do
**not** wire them like `busy`. Innovus `globalNetConnect` / power intent ties
them to `VDD`/`VSS`.

---

## 5. Learning path (do not skip)

1. **Keep** signal-only `pad_top.sv` green (you are here for signals).
2. Read GPIO app note: domain meaning of PVDD1 vs PVDD2, RTE, OEN polarity.
3. Diff your file vs `pad_top_FULL_REFERENCE.sv` — add **only corners** first.
4. Add **one power pad per side**; open LEF in Innovus and place on edge.
5. Add fillers until edges are continuous (physical step).
6. Build a **side assignment table** (spreadsheet): pin name, side, cell, order.
7. Only then worry about bump map / RDL / full package.

---

## 6. Side assignment table (template — fill yourself)

| Package pin | Dir | Cell | Side | Order | Notes |
|-------------|-----|------|------|-------|-------|
| pad_clk | in | PDID…_V | W | 3 | near corner |
| pad_busy | out | PDDW…_V | E | 5 | |
| (power) | — | PVDD1…_V | W | 1 | after corner |
| … | | | | | |

This table is what backend engineers live on. Make one for your practice chip.

---

## 7. Innovus (later) — what “real” uses your netlist for

When you place pads:

1. Read **IO LEF** + tech LEF + stdcell LEF.
2. Netlist top = `pad_top` (or full reference).
3. Floorplan die size ≥ core + pad height on all sides.
4. Place IO: corners → power → signals → fillers (or use IO placer + edit).
5. `globalNetConnect` VDD/VSS to power pad pins / stdcell PG.
6. Core is placed **inside** the ring.

Signal-only netlist still works for learning place/route of **core only** if you
synthesize `top` without pads. Full ring is for **chip-level** flow.

---

## 8. Mindset

- **Signal correctness** (your current pad_top) is not a dead end — it is layer 1.
- **Ring completeness** is layer 2 (power, corners, fillers, ESD, RTE).
- **Physical legality** is layer 3 (spacing, density, package, DRC).

We keep all three in the practice project so learning stays real.

---

## 9. PDK kit (already set up)

`/mnt/data2/hemanth/manual_asic/pdk_rtl2gds`

- `io/verilog` — cell models  
- `io/lef` — physical  
- `io/lib` — timing  
- `docs/` — app notes  
- `paths.tcl` — point tools here  

---

## 10. What you do next (suggested)

1. Keep improving **your** `pad_top.sv` (signals).  
2. Open `pad_top_FULL_REFERENCE.sv` and list every **non-signal** instance type.  
3. Add **4× PCORNER** to a branch of your pad_top and recompile.  
4. Add **PVDD** instances; don’t invent fake VSS if the lib has none — note it in your table and read the app note.  
5. When stuck, send **one** side of the ring or one power instance, not the whole file.

Not giving up — building the same stack real chips use, one layer at a time.
