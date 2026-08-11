# Timing whiteboard problems — numeric solutions

**Audience:** 10+ year interview prep (STA / synthesis / physical design).  
**Units:** nanoseconds unless stated. Ideal clocks unless a problem injects latency/skew.  
**Companion:** `GENUS_SYNTHESIS_MASTER_INTERVIEW_GUIDE.md` (§6–§8 equations).

**How to practice:** Cover the **Answer** section, solve on paper in 5–10 minutes, then check.  
**Notation:** \(T_{arr}\) arrival, \(T_{req}\) required, \(S = T_{req} - T_{arr}\) for **setup**. Hold: \(S_h = T_{arr}^{min} - T_{req}^{hold}\).

---

## Formula card (keep open while practicing)

### Setup (R2R, single cycle)

\[
T_{arr} = T_{cp,L}^{late} + T_{co}^{max} + T_{dp}^{max}
\]
\[
T_{req} = T_{clk} + T_{cp,C}^{early} - T_{su} - T_{unc}^{setup}
\]
\[
S_{su} = T_{req} - T_{arr}
\]

**Skew (setup-hurting):** \(\Delta = T_{cp,L}^{late} - T_{cp,C}^{early}\) reduces available time.

### Hold (R2R, same edge)

\[
T_{arr}^{min} = T_{cp,L}^{early} + T_{co}^{min} + T_{dp}^{min}
\]
\[
T_{req}^{h} = T_{cp,C}^{late} + T_{h} + T_{unc}^{hold}
\]
\[
S_{h} = T_{arr}^{min} - T_{req}^{h}
\]

### I/O

| Start | End | Extra terms |
|-------|-----|-------------|
| Port | Reg (I2R) | \(+T_{i\_del}\) on **arrival** |
| Reg | Port (R2O) | \(-T_{o\_del}\) on **required** (usual form) |
| Port | Port (I2O) | both |

---

## Problem set A — fundamentals (warmup)

### A1. Pure R2R setup

**Given:** \(T_{clk}=1.0\), \(T_{co}=0.12\), \(T_{dp}=0.55\), \(T_{su}=0.05\), \(T_{unc}=0.03\), ideal clocks (latency 0).

**Find:** setup slack.

<details>
<summary>Answer</summary>

\[
T_{arr} = 0 + 0.12 + 0.55 = 0.67
\]
\[
T_{req} = 1.0 + 0 - 0.05 - 0.03 = 0.92
\]
\[
S = 0.92 - 0.67 = \mathbf{+0.25\ ns}
\]

</details>

---

### A2. Same numbers, but launch clock path 0.20 late, capture 0.08 early

**Find:** setup slack and effective skew.

<details>
<summary>Answer</summary>

\[
T_{arr} = 0.20 + 0.12 + 0.55 = 0.87
\]
\[
T_{req} = 1.0 + 0.08 - 0.05 - 0.03 = 1.00
\]
\[
S = 1.00 - 0.87 = \mathbf{+0.13\ ns}
\]

Effective setup skew \(\Delta = 0.20 - 0.08 = 0.12\). Compared to A1, slack dropped by \(0.12\) (from +0.25 to +0.13).

</details>

---

### A3. Hold, ideal clocks

**Given:** \(T_{co}^{min}=0.08\), \(T_{dp}^{min}=0.04\), \(T_{h}=0.04\), \(T_{unc}^{h}=0.02\), clock paths 0.

**Find:** hold slack.

<details>
<summary>Answer</summary>

\[
T_{arr}^{min} = 0 + 0.08 + 0.04 = 0.12
\]
\[
T_{req}^{h} = 0 + 0.04 + 0.02 = 0.06
\]
\[
S_h = 0.12 - 0.06 = \mathbf{+0.06\ ns}
\]

</details>

---

### A4. Hold with dangerous skew

**Given:** launch clock early \(0.05\), capture clock late \(0.18\), \(T_{co}^{min}=0.07\), \(T_{dp}^{min}=0.03\), \(T_{h}=0.05\), \(T_{unc}^{h}=0.02\).

**Find:** hold slack. Is it failing?

<details>
<summary>Answer</summary>

\[
T_{arr}^{min} = 0.05 + 0.07 + 0.03 = 0.15
\]
\[
T_{req}^{h} = 0.18 + 0.05 + 0.02 = 0.25
\]
\[
S_h = 0.15 - 0.25 = \mathbf{-0.10\ ns}\ \text{(FAIL)}
\]

**Physics:** capture clock is late relative to launch → hold tight. Classic post-CTS failure mode.

</details>

---

## Problem set B — I/O external delays (high interview yield)

### B1. I2R setup

**Given:** \(T_{clk}=2.0\), \(T_{i\_del}^{max}=0.40\), port→D combo \(0.90\), \(T_{su}=0.06\), \(T_{unc}=0.04\), ideal clocks.

**Find:** setup slack.

<details>
<summary>Answer</summary>

\[
T_{arr} = 0 + 0.40 + 0.90 = 1.30
\]
\[
T_{req} = 2.0 - 0.06 - 0.04 = 1.90
\]
\[
S = 1.90 - 1.30 = \mathbf{+0.60\ ns}
\]

`input_delay` sits on **arrival**, not required.

</details>

---

### B2. R2O setup — both formulations

**Given:** \(T_{clk}=2.0\), \(T_{co}=0.10\), Q→port \(0.80\), \(T_{o\_del}^{max}=0.50\), \(T_{unc}=0.05\), ideal clocks (no separate \(T_{su}\) outside output_delay).

**Find:** slack using (1) required-side output_delay and (2) arrival-side dual form. Show equality.

<details>
<summary>Answer</summary>

**Form 1 (usual STA report):**

\[
T_{arr} = 0.10 + 0.80 = 0.90
\]
\[
T_{req} = 2.0 - 0.50 - 0.05 = 1.45
\]
\[
S = 1.45 - 0.90 = \mathbf{+0.55\ ns}
\]

**Form 2 (dual):**

\[
T_{arr}' = 0.90 + 0.50 = 1.40,\quad T_{req}' = 2.0 - 0.05 = 1.95
\]
\[
S = 1.95 - 1.40 = \mathbf{+0.55\ ns}
\]

Same slack. Interviewers love if you can switch forms without changing the answer.

</details>

---

### B3. I2O with pads (lab-style)

**Given:**

| Segment | Delay (max) |
|---------|-------------|
| `input_delay` | 0.20 |
| Input pad arc | 0.70 |
| Core combo | 0.50 |
| Output pad arc | 1.40 |
| `output_delay` | 0.20 |
| Uncertainty | 0.02 |
| Period | 2.00 |

Ideal clocks, no separate flop \(T_{su}\) (pure I2O port-to-port).

**Find:** setup slack. What is the minimum period for zero slack (keep delays fixed)?

<details>
<summary>Answer</summary>

\[
T_{arr} = 0.20 + 0.70 + 0.50 + 1.40 = 2.80
\]
\[
T_{req} = 2.00 - 0.20 - 0.02 = 1.78
\]
\[
S = 1.78 - 2.80 = \mathbf{-1.02\ ns}\ \text{(FAIL)}
\]

For \(S=0\): \(T_{clk} - 0.20 - 0.02 = 2.80 \Rightarrow T_{clk} = 3.02\ \text{ns}\).

**Interview point:** No amount of core upsizing removes 0.70+1.40 pad arcs. Architecture/I/O strategy/period required.

</details>

---

### B4. Increase output_delay by 100 ps — effect on B2

**Given:** B2 slack was +0.55. New \(T_{o\_del}^{max}=0.60\).

<details>
<summary>Answer</summary>

Required drops by 0.10 → slack becomes \(\mathbf{+0.45\ ns}\).  
Rule: **+Δ max output_delay ⇒ −Δ setup slack** (all else equal).

</details>

---

### B5. Hold on input path (I2R hold)

**Given:** \(T_{i\_del}^{min}=0.05\), port→D min combo \(0.08\), \(T_{h}=0.04\), \(T_{unc}^{h}=0.02\), ideal clocks.

**Find:** hold slack at the capture flop D.

<details>
<summary>Answer</summary>

\[
T_{arr}^{min} = 0.05 + 0.08 = 0.13
\]
\[
T_{req}^{h} = 0 + 0.04 + 0.02 = 0.06
\]
\[
S_h = 0.13 - 0.06 = \mathbf{+0.07\ ns}
\]

If `input_delay -min` is **too small** (or 0 when real external delay exists), hold looks **worse** than silicon — or better, depending on bias. Know the direction: smaller min input delay → smaller arrival → harder hold.

</details>

---

## Problem set C — multicycle, half-cycle, exceptions

### C1. Multicycle setup = 2

**Given:** same as A1 but path is architecturally 2-cycle: \(T_{clk}=1.0\), \(T_{co}=0.12\), \(T_{dp}=0.55\), \(T_{su}=0.05\), \(T_{unc}=0.03\).

**Find:** setup slack with MCP setup 2 (capture at \(2T_{clk}\)).

<details>
<summary>Answer</summary>

\[
T_{arr} = 0.67 \quad (\text{unchanged})
\]
\[
T_{req} = 2.0 - 0.05 - 0.03 = 1.92
\]
\[
S = 1.92 - 0.67 = \mathbf{+1.25\ ns}
\]

Without MCP, A1 was +0.25. MCP added a full period of budget.

</details>

---

### C2. Why hold MCP usually 1 after setup MCP 2

**Given (edge sketch):** launch at 0; setup MCP 2 → capture edge at \(2T\). Default tool hold relationship after setup expansion often checks data from edge 0 against capture edge at \(T\) (the edge **before** expanded setup capture) unless corrected.

**Question:** If you only set `set_multicycle_path 2 -setup` and leave hold default in a tool that expands hold incorrectly, what goes wrong conceptually?

<details>
<summary>Answer</summary>

Expanded setup moves the **setup** capture to \(2T\). Hold must ensure data launched at 0 is stable for the **correct** hold capture edge (commonly still related to edge \(T\) or the edge before the setup capture, depending on methodology).  

Standard recipe:

```tcl
set_multicycle_path 2 -setup -from A -to B
set_multicycle_path 1 -hold  -from A -to B
```

If hold is left wrong, either:

- hold is checked against an edge that makes hold **too hard** (false fails), or  
- hold is **too easy** (miss real races).

Whiteboard skill: **draw edges** 0, T, 2T and mark setup vs hold capture.

</details>

---

### C3. Half-cycle path (posedge → negedge)

**Given:** period 2.0, waveform `{0 1.0}` (50%), launch posedge 0, capture negedge 1.0.  
\(T_{co}=0.10\), \(T_{dp}=0.70\), \(T_{su}=0.05\), \(T_{unc}=0.03\), ideal clocks.

**Find:** setup slack for the half-cycle path.

<details>
<summary>Answer</summary>

Available window = 1.0 ns (not 2.0).

\[
T_{arr} = 0.10 + 0.70 = 0.80
\]
\[
T_{req} = 1.0 - 0.05 - 0.03 = 0.92
\]
\[
S = 0.92 - 0.80 = \mathbf{+0.12\ ns}
\]

Duty cycle and waveform **define** half-cycle budgets. 20/80 duty would change the capture edge time.

</details>

---

### C4. False path economics

**Given:** Chip WNS −1.0 ns is purely I2O config pins that are static after reset and sampled only into flops with a known synchronizer protocol (I2O feedthrough never used functionally). R2R WNS is +0.15.

**Question:** Is `set_false_path -from [all_inputs] -to [all_outputs]` acceptable? What would you set instead?

<details>
<summary>Answer</summary>

**Not acceptable** as a blanket. It removes **all** in-to-out checks, including any real combo I/O.

Better:

- False path **only** from named static pins to named outputs, with design review sign-off, **or**
- `set_case_analysis` for static modes, **or**
- Register the interface so critical functional paths are I2R/R2O with real budgets.

Senior bar: **exception list with owners**, not QoR cosmetics.

</details>

---

## Problem set D — skew, derate, uncertainty (senior)

### D1. Uncertainty vs period

**Given:** A1 baseline slack +0.25. You add setup uncertainty +0.10 (total unc 0.13 vs 0.03).

**Find:** new slack. Equivalent period change for same effect?

<details>
<summary>Answer</summary>

Uncertainty increases by 0.10 → required drops 0.10 → \(S=\mathbf{+0.15\ ns}\).

Same as reducing effective period by 0.10 for that check (roughly). Uncertainty is **not** free margin for architecture — it models jitter/OCV policy.

</details>

---

### D2. Cell late derate 1.05 on data path only

**Given:** R2R: \(T_{clk}=1.0\), \(T_{co}=0.10\), \(T_{dp}=0.50\) (both will be late-derated), \(T_{su}=0.05\), unc=0, ideal clocks.  
Derate: late ×1.05 on cell delays (\(T_{co}\) and \(T_{dp}\)).

**Find:** setup slack with and without derate.

<details>
<summary>Answer</summary>

**No derate:**

\[
T_{arr}=0.60,\ T_{req}=0.95,\ S=+0.35
\]

**With late 1.05:**

\[
T_{arr}=1.05\times(0.10+0.50)=0.63
\]
\[
S = 0.95 - 0.63 = \mathbf{+0.32\ ns}
\]

(If \(T_{su}\) also from tables, derate policy varies by flow — state assumptions.)

</details>

---

### D3. Useful skew (setup)

**Given:** \(T_{clk}=1.0\), \(T_{co}+T_{dp}+T_{su}+T_{unc}=1.05\) so **−0.05** with zero skew.  
You can delay capture clock by +0.08 (useful skew) without breaking other paths.

**Find:** new setup slack on this path.

<details>
<summary>Answer</summary>

Increasing capture clock path early/late appropriately: if capture arrives **later** by 0.08, required increases by 0.08:

\[
S = -0.05 + 0.08 = \mathbf{+0.03\ ns}
\]

Trade: that same late capture may **hurt hold** on this flop’s other short paths.

</details>

---

## Problem set E — path groups & diagnosis (story problems)

### E1. QoR table

| Group | WNS | TNS | Paths |
|-------|-----|-----|-------|
| reg2reg | +0.12 | 0 | 0 viol |
| in2reg | −0.05 | −0.40 | 12 |
| reg2out | +0.20 | 0 | 0 |
| in2out | −2.80 | −120 | 400 |

**Questions:**  
(a) What is chip setup WNS roughly?  
(b) Where do you spend the first day?  
(c) Name three **invalid** first moves.

<details>
<summary>Answer</summary>

(a) Chip WNS ≈ **−2.80 ns** (worst group).  
(b) **I2O / pads / external budgets / architecture** — not ALU retime.  
(c) Invalid first moves examples:

1. Only increase `syn_opt` effort on core  
2. Blanket false_path all inputs→outputs  
3. Tighten clock uncertainty to “see green”  
4. Ignore `report_port` / pad arcs  
5. Multicycle everything without protocol  

</details>

---

### E2. Numbers: can upsizing core fix E1 in2out?

Assume pad_in 0.7 + core 0.3 + pad_out 1.4 = 2.4, plus I/O delays 0.4 total external, period 2.0.

**Find:** even if core → 0, is setup closed?

<details>
<summary>Answer</summary>

\[
T_{arr} \ge 0.4 + 0.7 + 0 + 1.4 = 2.5 > T_{req} \approx 2.0
\]

**No.** Structural / I/O / period problem.

</details>

---

## Problem set F — mixed hard problems (10+ year)

### F1. Full R2R with max/min and setup+hold

**Given (ns):**

| Param | Max | Min |
|-------|-----|-----|
| Launch clk path | 0.25 | 0.10 |
| Capture clk path | 0.22 | 0.09 |
| \(T_{co}\) | 0.14 | 0.08 |
| \(T_{dp}\) | 0.60 | 0.20 |
| \(T_{su}\)=0.05, \(T_{h}\)=0.04 | | |
| \(T_{unc}^{su}\)=0.03, \(T_{unc}^{h}\)=0.02 | | |
| \(T_{clk}\)=1.0 | | |

**Find:** setup slack and hold slack.

<details>
<summary>Answer</summary>

**Setup (late data, early capture clock):**

\[
T_{arr} = 0.25 + 0.14 + 0.60 = 0.99
\]
\[
T_{req} = 1.0 + 0.09 - 0.05 - 0.03 = 1.01
\]
\[
S_{su} = 1.01 - 0.99 = \mathbf{+0.02\ ns}
\]

**Hold (early data, late capture clock):**

\[
T_{arr}^{min} = 0.10 + 0.08 + 0.20 = 0.38
\]
\[
T_{req}^{h} = 0.22 + 0.04 + 0.02 = 0.28
\]
\[
S_h = 0.38 - 0.28 = \mathbf{+0.10\ ns}
\]

Both pass; setup is razor-thin.

</details>

---

### F2. Generated clock /2

**Given:** Master clock period 2.0 on `clk`. Generated clock on `q_div` divide-by-2, rising edges at 0, 4, 8… relative to master if aligned.  
Path from master-domain flop to div2-domain flop: \(T_{co}+T_{dp}=1.5\), \(T_{su}+T_{unc}=0.1\), ideal networks.

**Question:** What period does the **capture** domain use for a single-cycle setup check in the generated domain? Compute slack if capture is one gen-clock cycle.

<details>
<summary>Answer</summary>

Generated period = \(2 \times 2.0 = 4.0\) ns.  
If launch and capture are both edges of the **generated** clock one cycle apart:

\[
T_{arr}=1.5,\ T_{req}=4.0-0.1=3.9,\ S=\mathbf{+2.4\ ns}
\]

If launch is **master** edge 0 and capture is **gen** edge at 2.0 (phase relationship must be defined by `create_generated_clock` edges) — always draw the waveform. Wrong generated clock definition is a classic silicon bug.

</details>

---

### F3. Conflicting constraints

**Given:** Clock period 1.0 on CLK. Also `set_max_delay 0.5 -from FF_A -to FF_B` on a path that is normally one cycle R2R with \(T_{arr}=0.7\).

**Find:** Which check is tighter for setup-like max delay? Approximate slack to each.

<details>
<summary>Answer</summary>

Clocked setup budget ≈ \(1.0 - T_{su} - T_{unc}\) (say 0.9 available for \(T_{co}+T_{dp}\)).  
`set_max_delay 0.5` forces \(T_{path} \le 0.5\).

If path delay 0.7:

- vs max_delay: **−0.2**  
- vs clock: might still be **positive**  

**Tighter = max_delay.** Tools report both; optimizer must satisfy the **harder** constraint. Conflicting SDC is a methodology smell — document why max_delay exists (interface budget, not clocked).

</details>

---

### F4. Dual-edge flop budget

**Given:** DDR-style capture on both edges, period 1.0 (edge spacing 0.5). Path delay 0.42, \(T_{su}+T_{unc}=0.06\).

**Find:** slack for edge-to-edge.

<details>
<summary>Answer</summary>

\[
T_{req} = 0.5 - 0.06 = 0.44
\]
\[
S = 0.44 - 0.42 = \mathbf{+0.02\ ns}
\]

DDR paths are half-cycle class problems even when “period” is 1.0.

</details>

---

### F5. Time borrowing (latch) — conceptual numeric

**Given:** Positive latch open for 0.5 ns of a 1.0 ns cycle. Data arrives at latch D at 0.70 from cycle start; latch enable opens at 0.50 and closes at 1.0. Downstream combo to next flop needs 0.25 after latch Q, \(T_{su}=0.05\), next flop captures at 1.0.

**Question:** Is borrowing helping? Roughly, when does data leave the latch?

<details>
<summary>Answer</summary>

Data arrives at D at 0.70 while latch is open (0.50–1.0) → transparent; Q tracks with small latch delay (ignore).  
Launch to next flop effectively from ~0.70.  
Need \(0.70 + 0.25 + 0.05 \le 1.0\) → \(1.0 \le 1.0\) → **met with zero margin**.

Borrowing allowed the path to use time **past** the 0.50 midpoint. Without latches (edge flop at 0.50), a 0.70 arrival would have **failed** the midpoint cut.

(Real latch analysis is more subtle — time borrow limits, pulse width, etc.)

</details>

---

### F6. Optimism from wrong input transition

**Given:** True external slew 0.20 ns; you constrained 0.05 ns. First cell delay from table: 0.12 @ slew 0.05 vs 0.18 @ slew 0.20. Rest of path fixed 0.50. Period budget for path 0.70 before \(T_{su}\).

**Find:** reported slack vs true slack (ignore unc/su for simplicity; path must be ≤0.70).

<details>
<summary>Answer</summary>

**Reported (optimistic):** \(T_{arr}=0.12+0.50=0.62\) → slack \(0.70-0.62=\mathbf{+0.08}\)  
**True:** \(T_{arr}=0.18+0.50=0.68\) → slack \(\mathbf{+0.02}\)

Still green here, but optimism was **0.06 ns**. On a razor path that would flip sign.  
**Lesson:** audit `report_port -driver` / transitions before trusting I/O and first-stage critical paths.

</details>

---

### F7. Pad top interview closer

**Given (ns):** period 2.0, unc 0.02, i_del 0.2, o_del 0.2, pad_in 0.75, pad_out 1.35, core I2O 0.40.  
R2R critical: \(T_{co}+T_{dp}+T_{su}=1.05\), unc 0.02, ideal clk → R2R slack?

**Find:** I2O slack and R2R slack. What single architectural change removes pad_in and pad_out from the same timed path?

<details>
<summary>Answer</summary>

**I2O:**

\[
T_{arr}=0.2+0.75+0.40+1.35=2.70
\]
\[
T_{req}=2.0-0.2-0.02=1.78
\]
\[
S_{I2O}=1.78-2.70=\mathbf{-0.92\ ns}
\]

**R2R:**

\[
T_{arr}=1.05,\ T_{req}=2.0-0.02=1.98\ (\text{if }T_{su}\text{ already in }1.05)
\]
If \(1.05 = T_{co}+T_{dp}+T_{su}\):

\[
S_{R2R}=2.0-0.02-1.05=\mathbf{+0.93\ ns}
\]

**Architectural fix:** Register after input pad and before output pad (I2R + R2O only) — pure I2O disappears for that data. Or synchronous I/O with known MCP protocol.

</details>

---

## Problem set G — rapid fire (say the number in 30 seconds)

| # | Prompt | Answer |
|---|--------|--------|
| G1 | Period 1.0, path 0.7, su+unc 0.1, ideal — setup slack? | +0.2 |
| G2 | Add launch latency 0.15 late only — new slack? | +0.05 |
| G3 | i_del max 0.3, combo 0.4, period 1.0, su+unc 0.1 — I2R slack? | +0.2 |
| G4 | o_del max 0.3, Tco+dp 0.4, period 1.0, unc 0.05 — R2O slack? | +0.25 |
| G5 | Hold: arr_min 0.15, h+unc 0.20 — hold slack? | −0.05 |
| G6 | MCP setup 3, period 1, arr 1.2, su+unc 0.1 — slack? | +1.7 |
| G7 | Half cycle 0.5 window, arr 0.4, su+unc 0.08 — slack? | +0.02 |
| G8 | Max output_delay ↑0.07 effect on setup slack? | ↓0.07 |
| G9 | Max input_delay ↑0.07 effect on setup slack? | ↓0.07 |
| G10 | I2O arr 3.0, req 2.1 — slack? | −0.9 |

<details>
<summary>G rapid fire worked solutions</summary>

- **G1:** \(S=1.0-0.1-0.7=+0.2\)  
- **G2:** arr +=0.15 → \(S=+0.05\)  
- **G3:** arr=0.7, req=0.9, \(S=+0.2\)  
- **G4:** arr=0.4, req=1.0-0.3-0.05=0.65, \(S=+0.25\)  
- **G5:** \(0.15-0.20=-0.05\)  
- **G6:** req=3.0-0.1=2.9, \(S=2.9-1.2=+1.7\)  
- **G7:** req=0.5-0.08=0.42, \(S=+0.02\)  
- **G8/G9:** both worsen setup by same delta  
- **G10:** \(2.1-3.0=-0.9\)

</details>

---

## Whiteboard drill checklist (before an interview)

- [ ] Draw launch/capture edges for 1-cycle, 2-cycle MCP, half-cycle  
- [ ] Point to where **input_delay** and **output_delay** enter  
- [ ] State setup vs hold **corner and skew** directions  
- [ ] Explain dual form of output_delay without changing slack  
- [ ] Separate **path group diagnosis** from **chip WNS**  
- [ ] Name one **invalid** exception strategy and why  

---

## Related files

| File | Role |
|------|------|
| `GENUS_SYNTHESIS_MASTER_INTERVIEW_GUIDE.md` | Full theory + commands + 25 Q&A |
| `../scripts/run_genus_pad_top.tcl` | Runnable Genus flow |
| `../sdc/pad_top_func.sdc` | Lab SDC for pad_top |
| `../scripts/run_syn.sh` | Shell launcher |

---

*End of whiteboard set.*
