# Verification Report — Existing Interview Masterclass Bank (87 Q)

**Source:** `web/src/lib/vlsi-interview-masterclass-data.ts` → `INTERVIEW_QUESTIONS_BANK`  
**Date:** 2026-09-07  
**Scope:** Technical correctness of questions + answers (STA math, CDC, UPF, SDC, DFT, PnR, Tcl)  
**Action:** Critical/medium items below were **applied in code after `9b15fcb`** (`chip-02`, `clk-03`, `cdc-04`, `idx-01`, `syn-04`, `pwr-02`). Remaining nits can be cleaned opportunistically.

---

## Inventory by domain

| Domain id | Count | Status vs 25 target |
|-----------|------:|---------------------|
| `synthesis-sdc` | 31 | ✅ Already ≥ 25 |
| `low-power-upf` | 17 | Needs +8 (see `low-power-upf.md`) |
| `static-timing-analysis` | 16 | Needs +9 (see `static-timing-analysis.md`) |
| `physical-design` | 13 | Needs +12 (see `physical-design.md`) |
| `clock-domain-crossing` | 5 | Needs +20 (see `clock-domain-crossing.md`) |
| `dft-atpg` | 5 | Needs +20 (see `dft-atpg.md`) |
| `design-verification` | 0 | Empty — 25 new (`design-verification.md`) |
| `aptitude-quantitative` | 0 | Empty — 25 new (`aptitude-quantitative.md`) |
| `logical-reasoning-puzzles` | 0 | Empty — 25 new (`logical-reasoning-puzzles.md`) |
| `rtl-verilog-architecture` | 0 | Empty — 25 new (`rtl-verilog-architecture.md`) |
| `power-integrity-ir` | 0 | Empty — 25 new (`power-integrity-ir.md`) |
| **Total** | **87** | |

---

## Overall grade: **B+**

Strong Staff/Principal bank overall. Core STA (setup/hold, MCP N / hold N−1, I/O arrival vs required), CDC (MTBF, toggle sync, reset sync, Gray FIFO), UPF (isolation rail, sequencing, L2H/H2L, retention), DFT (LOC/LOS, lockup, compression), and MMMC teaching are interview-grade.

**~69 / 87** have no material technical defects.  
**~18** need fixes (2 critical, rest medium/nit).

---

## Critical fixes (must correct before marketing as Staff-precise)

### 1. `chip-02` — broken I2O slack arithmetic

**Problem:** Cumulative path built to ~3.895 ns, then answer claims `Slack = 2.000 − 5.495 = −3.495`. The **5.495** term is unexplained / double-counted.

**Corrected sketch (example numbers from the question):**

- Arrival: \(T_{arr} = T_{in\_del} + pad_{in} + core + pad_{out}\)  
  e.g. \(0.1 + 0.72 + 1.25 + 1.425 = 3.495\,\mathrm{ns}\)
- Required: \(T_{req} = T - T_{out\_del} - T_{unc}\)  
  e.g. \(2.0 - 0.2 - 0.2 = 1.6\,\mathrm{ns}\)
- Slack: \(1.6 - 3.495 = \mathbf{-1.895\,\mathrm{ns}}\)

Pad-dominated conclusion stays valid; **numbers must be self-consistent**.

### 2. `clk-03` — wrong virtual-clock causality story

**Problem:** Claims referencing on-chip `CLK_CORE` in `set_input_delay` makes STA treat **external launch as delayed by on-chip CTS network latency** (`T_launch = T_CLK_latency + input_delay`). That is **not** standard SDC semantics.

**Corrected teaching:**

- Virtual clocks are **best practice** for a clean external reference (especially source-synchronous boards).
- Using the chip clock can be valid for system-synchronous I/O if **source latency** and board budgets are modeled carefully.
- Post-CTS pain is usually **capture insertion delay**, CPPR, and mismatched source latency — not “external launch = on-chip tree delay.”

---

## Medium severity (reconcile / soften)

| id | Issue | Fix direction |
|----|--------|----------------|
| `syn-04` | “`set_clock_groups -asynchronous` is **Mandatory** for CDC” too absolute | Prefer clock_groups; bidirectional `set_false_path` / `set_max_delay` also used if linted carefully. Jasper does not require clock_groups. |
| `cdc-04` | Pitfall says mux clocks → `-logically_exclusive`; contradicts `clk-02` | Muxed **single net**: `-physically_exclusive`. Mode-exclusive coexisting clocks: `-logically_exclusive`. |
| `pwr-02` | Writes \(\alpha_{sdc} = \alpha_{sim} \times (f_{sdc}/f_{sim})\) while \(P \propto \alpha C V^2 f\) | Don’t scale dimensionless per-cycle \(\alpha\) **and** multiply by \(f\). Scale absolute activity rates, or keep \(\alpha\) and apply SDC \(f\). |
| `idx-01` | DFT scan before `syn_map` — contradicts `dft-01` | Canonical: `syn_generic` → `syn_map` → `convert_to_scan` → further `syn_opt`. |
| `cmd-04`, `mst-03`, `lp-05` | Continuous `assign` framed as LVS “shorts” | Teach PnR/LEC handoff hygiene (need real drivers), not metal shorts from Verilog `assign`. |
| `mem-04` | Global `dont_use` on all `BUF_*` “for clocks” | Restrict CTS cell lists; don’t ban all data buffers. |
| `eco-05` | Derate snippet incomplete (only early clock / late data) | Show full early/late × clock/data for setup **and** hold (or AOCV/POCV). |
| `eco-03` | “0 hold shift” MCP case confused | Default same-clock: setup \(N\) → hold \(N-1\). Nonstandard cases need edge diagrams. |
| `cdc-01` | JasperGold CDC Tcl looks invented/simplified | Label as pseudocode or use real tool commands. |
| `syn-07` | Hold uncertainty 80 ps > setup 60 ps as CTS guardband | Prefer smaller hold unc; use CTS/hold views instead of inflating hold unc above setup. |
| `chip-04` / `pwr-04` | `set_load 0.05` as 50 fF PCB vs 10–50 pF elsewhere | State units; PCB often pF-class; fF for on-chip/block pins. |

---

## Nits (optional polish)

| id | Note |
|----|------|
| `lp-04` vs `pwr-01` | Align \(\frac12\alpha C V^2 f\) vs \(\alpha C V^2 f\) by defining \(\alpha\). |
| `upf-01` | Mention UPF 2.1/3.0; keep 2.0 as legacy teaching. |
| `upf-02` | Soften L2H crowbar criterion vs \(V_{th}\) / \(V_{IH}\). |
| `wb-01` | Define “positive skew” explicitly (industry often means capture delayed = setup-helping). |
| `wb-04` | Clarify latch open window polarity. |
| `mmmc-03` | Soften “setup RC always cold”; wire-dominated may prefer hot. |
| `mem-01` | Align `create_library_set` flag naming with CUI (`-timing`). |
| `eco-02` | Soften “tools merge 2-FF syncs”; emphasize preserve/dont_touch. |

---

## IDs with no material defects (audit)

`syn-01`, `syn-02`, `syn-03`, `syn-05`, `syn-06`, `syn-08`, `syn-09`, `syn-10`, `syn-11`,  
`cdc-01`*, `cdc-02`, `cdc-03`, `cdc-05`,  
`clk-01`, `clk-02`, `clk-04`, `clk-05`,  
`pwr-01`, `pwr-03`, `pwr-04`, `pwr-05`,  
`cmd-01`, `cmd-02`, `cmd-03`, `cmd-05`,  
`dft-01`–`dft-05`,  
`eco-01`, `eco-02`*, `eco-03`*, `eco-04`,  
`hier-01`–`hier-05`,  
`mem-01`*, `mem-02`, `mem-03`, `mem-05`,  
`mmmc-01`–`mmmc-05`,  
`phy-01`–`phy-05`,  
`chip-01`, `chip-03`, `chip-05`,  
`mst-01`, `mst-02`, `mst-04`, `mst-05`,  
`upf-01`*–`upf-05`,  
`lp-01`–`lp-03`, `lp-05`,  
`wb-01`*–`wb-03`, `wb-05`

\* = OK overall but has a nit or medium note above.

---

## Recommended fix order (when you edit TS)

1. Fix **`chip-02`** arithmetic  
2. Rewrite **`clk-03`** virtual-clock story  
3. Reconcile **`cdc-04`** vs **`clk-02`** exclusivity  
4. Align **`idx-01`** DFT order with **`dft-01`**  
5. Soften assign/LVS language; fix activity-\(\alpha\) wording; complete OCV derate example  
