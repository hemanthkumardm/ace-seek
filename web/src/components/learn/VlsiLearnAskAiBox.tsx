"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Send,
  HelpCircle,
  BookOpen,
  MessageSquare,
  Bot,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Search,
  Code2,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { findEdaCommand, formatEdaCommandResponse } from "@/lib/vlsi-eda-commands-db";

interface QuickPrompt {
  label: string;
  query: string;
}

const QUICK_PROMPTS: QuickPrompt[] = [
  {
    label: "What is command to get all macros?",
    query: "What is the command to get all hard macros and memory blocks in Cadence Innovus and Synopsys?",
  },
  {
    label: "Why is hold time independent of clock period?",
    query: "Why is hold timing check independent of the clock period T_period in static timing analysis?",
  },
  {
    label: "How to query all sequential flops?",
    query: "What is the command to get all sequential registers and flip-flops using get_db and SDC?",
  },
  {
    label: "How does Inverted Temperature Dependence (ITD) work?",
    query: "Explain Inverted Temperature Dependence (ITD) at 0.65V and why -40°C is slower than 125°C in FinFET.",
  },
  {
    label: "What is CPPR and why is it needed?",
    query: "What is Common Path Pessimism Removal (CPPR) and how does it prevent false clock skew penalties?",
  },
  {
    label: "How do level shifters prevent crowbar leakage?",
    query: "Why do low-to-high voltage level shifters prevent PMOS crowbar short-circuit leakage in multi-voltage designs?",
  },
  {
    label: "What is the difference between GBA and PBA?",
    query: "Explain Graph-Based Analysis (GBA) vs Path-Based Analysis (PBA) slew propagation in Cadence Tempus.",
  },
  {
    label: "How to calculate Asynchronous FIFO Depth?",
    query: "How do you calculate safe dual-clock Asynchronous FIFO depth during burst data transfers?",
  },
  {
    label: "Explain Electromigration & Black's Equation",
    query: "Explain electromigration Black's equation, current density limits, and void failure modes.",
  },
];

export function VlsiLearnAskAiBox() {
  const [question, setQuestion] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);
  const [history, setHistory] = useState<
    { q: string; a: string; links?: { title: string; href: string }[] }[]
  >([]);

  const generateAnswer = (queryText: string) => {
    const q = queryText.toLowerCase().trim();
    const hasWord = (word: string) => new RegExp(`\\b${word}\\b`, "i").test(queryText);

    // 0. FIRST: Check EDA Command Database if query asks for a tool command or query syntax
    const isCommandQuery =
      q.includes("command") ||
      q.includes("get_db") ||
      q.includes("set_db") ||
      q.includes("dbget") ||
      q.includes("get_cells") ||
      q.includes("get_pins") ||
      q.includes("get_nets") ||
      q.includes("get_ports") ||
      q.includes("syntax") ||
      q.includes("how to get") ||
      q.includes("how to find") ||
      q.includes("how to query") ||
      q.includes("how to set") ||
      q.includes("how to add") ||
      q.includes("how to run") ||
      q.includes("tcl") ||
      q.includes("script") ||
      q.includes("all macros") ||
      q.includes("all flops") ||
      q.includes("all registers") ||
      q.includes("all clocks") ||
      q.includes("all inputs") ||
      q.includes("all outputs") ||
      q.includes("report_timing") ||
      q.includes("create_clock") ||
      q.includes("create_generated_clock") ||
      q.includes("set_multicycle_path") ||
      q.includes("set_false_path") ||
      q.includes("set_clock_groups") ||
      q.includes("eco_add_repeater") ||
      q.includes("add_rings") ||
      q.includes("add_stripes") ||
      q.includes("clock_opt_design");

    if (isCommandQuery) {
      const edaMatch = findEdaCommand(queryText);
      if (edaMatch) {
        return formatEdaCommandResponse(edaMatch, queryText);
      }
    }

    // 1. ELECTROMIGRATION & BLACK'S EQUATION (Evaluated early to prevent substring collisions)
    if (
      q.includes("electromigration") ||
      q.includes("black's") ||
      q.includes("black equation") ||
      q.includes("mttf") ||
      (hasWord("em") && (q.includes("void") || q.includes("current density") || q.includes("density")))
    ) {
      return {
        a: `**Electromigration (EM)** is the physical transport of conductor metal atoms resulting from the momentum transfer between conducting electrons and lattice ions under high current densities.

### Black's Equation for Mean Time to Failure (MTTF):
$$\\text{MTTF} = \\frac{A}{J^n} \\exp\\left(\\frac{E_a}{k_B \\cdot T_j}\\right)$$

- $J$ = Current density ($\\text{mA}/\\mu\\text{m}^2$). The exponent $n \\approx 1.8 - 2.0$ causes lifetime to drop quadratically with increasing current!
- $E_a$ = Thermal activation energy ($\\approx 0.85\\,\\text{eV}$ for Copper dual-damascene).
- $k_B$ = Boltzmann constant, $T_j$ = Junction temperature in Kelvin ($K$).

### Physical Failure Modes:
1. **Void Depletion (Open Circuit)**: Metal atoms drift downstream in the direction of electron flow, leaving atomic vacancies that coalesce into open circuits.
2. **Hillock / Whisker Extrusion (Short Circuit)**: Downstream accumulation creates extreme compressive mechanical stress, causing metal to break through dielectric passivation and short-circuit adjacent lines.

### Mitigation in Physical Design:
- Widen power rings and intermediate stripes on M6–M8.
- Enforce **redundant multi-cut via arrays** to eliminate single-point contact bottleneck resistance.
- Verify RMS current limits in **Cadence Voltus-EM** or **Ansys RedHawk**.`,
        links: [
          { title: "VLSI Calculator #33: Black's EM MTTF Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "VLSI Calculator #9: Multi-Cut Via Matrix", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "Power Distribution Network (PDN) Lab", href: "/vlsi/power-studio" },
        ],
      };
    }

    // 2. HOLD TIME & CLOCK PERIOD INDEPENDENCE
    if (q.includes("hold") && (q.includes("period") || q.includes("independent") || q.includes("frequency") || q.includes("same edge"))) {
      return {
        a: `**Hold Time is Independent of Clock Period ($T_{\\text{period}}$)** because hold checks verify data racing against the **SAME clock edge ($t_0$)**, not the next cycle edge.

### Mathematical Inequality:
$$T_{\\text{launch}} + T_{\\text{cq}} + T_{\\text{comb}} \\ge T_{\\text{capture}} + T_{\\text{hold}} + T_{\\text{uncertainty}}$$

- Notice that **$T_{\\text{period}}$ is completely absent** from this inequality!
- Hold checks ensure that new data launched at clock edge $t_0$ does not arrive so fast that it overwrites previous data at the capture register before its hold time ($T_{\\text{hold}}$) has expired.
- Therefore, **slowing down the clock frequency does NOT fix hold violations**.
- **Remediation**: Insert delay buffer cells (e.g. \`CLKBUF_X1\` or \`DLY4_X1\`) on the fast data path or balance clock tree skew.`,
        links: [
          { title: "Cadence Tempus: Hold & Min Delay Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
          { title: "STA Timing Studio", href: "/vlsi/timing-studio" },
        ],
      };
    }

    // 3. SETUP SLACK & TIMING CLOSURE
    if (q.includes("setup") && (q.includes("slack") || q.includes("equation") || q.includes("formula") || q.includes("violation") || q.includes("max delay") || q.includes("fix"))) {
      return {
        a: `**Setup Timing Check (Max Delay)** ensures that data launched at edge $t_0$ arrives at the capture register and stabilizes before the **next active clock edge ($t_0 + T_{\\text{period}}$)**.

### Mathematical Formulation:
$$\\text{Required Time} = T_{\\text{period}} + T_{\\text{capture\\_clk}} - T_{\\text{uncertainty}} - T_{\\text{setup}}$$
$$\\text{Arrival Time} = T_{\\text{launch\\_clk}} + T_{\\text{cq}} + T_{\\text{comb}}$$
$$\\text{Setup Slack} = \\text{Required Time} - \\text{Arrival Time}$$

### Key Characteristics & Remediation:
- **Period Dependency**: Setup slack directly depends on $T_{\\text{period}}$. Lowering clock frequency expands $T_{\\text{period}}$ and cures setup fails.
- **Clock Skew Effect**: Positive clock skew ($T_{\\text{capture}} > T_{\\text{launch}}$) **helps setup** slack (useful skew concept).
- **Physical Fixes**: Swap slow cells to Low-$V_t$ (LVT/ULVT), buffer high fanout nets, insert pipeline registers, or apply Path-Based Analysis (PBA).`,
        links: [
          { title: "VLSI Timing Calculator #17: Setup Slack Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "Cadence Tempus Setup Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
        ],
      };
    }

    // 4. INVERTED TEMPERATURE DEPENDENCE (ITD)
    if (hasWord("itd") || q.includes("inverted temperature") || (q.includes("-40") && q.includes("125"))) {
      return {
        a: `**Inverted Temperature Dependence (ITD)** is a low-voltage physics phenomenon where transistors switch **slower at cold temperatures (-40°C) than at hot temperatures (+125°C)**.

### The Physics:
1. **At Nominal Voltages (e.g. 1.0V)**: Higher temperature (+125°C) increases phonon scattering, degrading electron/hole mobility ($\\mu$). Thus, +125°C is the slowest corner.
2. **At Low Near-Threshold Voltages ($V_{DD} \\le 0.70\\text{V}$)**: As temperature drops to -40°C, threshold voltage ($V_{th}$) increases significantly. Since $(V_{DD} - V_{th})$ is very small, this threshold increase destroys overdrive current ($I_{\\text{on}} \\propto (V_{DD} - V_{th})^{\\alpha}$).
3. **Signoff Implication**: In sub-7nm FinFET and nanosheet nodes, you **must sign off setup timing concurrently at both -40°C (ITD slow) and +125°C (mobility slow)** in your MMMC view matrix!`,
        links: [
          { title: "Tempus STA MMMC Views & Parasitics", href: "/vlsi/learn/c/cadence-sta/tempus-mmmc-parasitics" },
          { title: "MMMC Signoff Studio", href: "/vlsi/mmmc-studio" },
        ],
      };
    }

    // 5. COMMON PATH PESSIMISM REMOVAL (CPPR / CRPR)
    if (hasWord("cppr") || hasWord("crpr") || q.includes("common path pessimism")) {
      return {
        a: `**Common Path Pessimism Removal (CPPR / CRPR)** eliminates artificial clock skew introduced when On-Chip Variation (OCV) deratings are applied to the **shared physical clock tree**.

### Why is CPPR Essential?
- In OCV analysis, tools apply an **Early Derate** (e.g. 0.92) to the launch clock path and a **Late Derate** (e.g. 1.08) to the capture clock path.
- For all buffer cells from the clock root up to the **Common Divergence Point**, a single physical transistor cannot simultaneously be 8% fast and 8% slow at the same instant!
- **CPPR Correction**:
$$\\Delta T_{\\text{CPPR}} = T_{\\text{common\\_path}} \\times (\\text{Late Derate} - \\text{Early Derate})$$
- The tool credits $\\Delta T_{\\text{CPPR}}$ back to the timing path, recovering **50 to 200 ps of artificial negative slack**.`,
        links: [
          { title: "Tempus AOCV, POCV & PBA Analysis", href: "/vlsi/learn/c/cadence-sta/tempus-ocv-pocv-pba" },
          { title: "Timing Studio", href: "/vlsi/timing-studio" },
        ],
      };
    }

    // 6. RECOVERY & REMOVAL (RESET TIMING)
    if (q.includes("recovery") || q.includes("removal") || (q.includes("reset") && (q.includes("timing") || q.includes("bridge") || q.includes("synchronizer")))) {
      return {
        a: `**Recovery and Removal** are timing constraints for **asynchronous reset/preset signals** to prevent flip-flops from entering metastability when exiting reset.

### Key Definitions:
1. **Recovery Check (Setup Equivalent)**:
   - Minimum required time between **asynchronous reset deassertion** and the **next rising clock edge**.
   - If reset releases too close to the clock edge, the flop may unpredictably settle into 0 or 1.
2. **Removal Check (Hold Equivalent)**:
   - Minimum required time asynchronous reset must remain asserted **after an active clock edge** before being released.
   - Prevents race conditions where some flops wake up in cycle $N$ and others in cycle $N+1$.
3. **Hardware Solution**: Use a **2-flop Reset Synchronizer (Reset Bridge)** that asserts asynchronously (0-latency shutdown) but deasserts synchronously.`,
        links: [
          { title: "CDC & Reset Synchronizers Lab", href: "/vlsi/learn/c/cdc" },
          { title: "Tempus Setup & Hold Timing Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
        ],
      };
    }

    // 7. ASYNCHRONOUS FIFO DEPTH & CDC
    if (q.includes("fifo") || (hasWord("cdc") && (q.includes("depth") || q.includes("burst") || q.includes("gray") || q.includes("pointer")))) {
      return {
        a: `**Asynchronous FIFO Depth Sizing** guarantees that continuous write bursts never overflow the FIFO before the read domain can drain the entries.

### FIFO Depth Formula:
$$\\text{Depth} = B - \\left\\lfloor B \\times \\frac{f_{\\text{read}}}{f_{\\text{write}}} \\right\\rfloor$$
$$\\text{Safe Power-of-2 Depth} = 2^{\\lceil \\log_2(\\text{Depth}) \\rceil}$$

- $B$ = Maximum continuous incoming burst length (in words).
- $f_{\\text{write}}$ = Write clock frequency, $f_{\\text{read}}$ = Read clock frequency.
- **Why Gray Code Pointers?** Gray code changes only **1 bit per increment**, eliminating multi-bit skew bus glitches when synchronizing pointers across asynchronous clock domains with 2-FF synchronizers.`,
        links: [
          { title: "VLSI Calculator #24: Async FIFO Depth Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "CDC & Metastability Course", href: "/vlsi/learn/c/cdc" },
        ],
      };
    }

    // 8. LEVEL SHIFTERS & CROWBAR CURRENT
    if (q.includes("level shifter") || q.includes("crowbar")) {
      return {
        a: `**Low-to-High Level Shifters** are mandatory when crossing from a low-voltage power domain ($0.65\\text{V}$) into a high-voltage domain ($0.95\\text{V}$).

### The Crowbar Leakage Mechanism:
- A $0.65\\text{V}$ output high signal driving a $0.95\\text{V}$ CMOS inverter will turn ON the NMOS ($V_{GS} = 0.65\\text{V} > V_{th,n}$).
- However, the PMOS gate-to-source voltage will be $V_{GS} = 0.65\\text{V} - 0.95\\text{V} = -0.30\\text{V}$. Since $|V_{GS}| > |V_{th,p}|$, the **PMOS transistor never turns completely OFF**!
- This forms a direct **crowbar short-circuit current** between $V_{DD}$ and ground, causing catastrophic static leakage and thermal failure.
- **Solution**: Differential cascode level shifter cells isolate the input voltage and provide full rail-to-rail swing.`,
        links: [
          { title: "Cadence Voltus Power & UPF Low Power", href: "/vlsi/learn/c/cadence-power/voltus-power-gating-upf" },
          { title: "Power Studio", href: "/vlsi/power-studio" },
        ],
      };
    }

    // 9. GRAPH-BASED (GBA) VS PATH-BASED (PBA)
    if (hasWord("gba") || hasWord("pba") || q.includes("graph-based") || q.includes("path-based")) {
      return {
        a: `**Graph-Based Analysis (GBA) vs Path-Based Analysis (PBA)** in Static Timing Analysis:

1. **Graph-Based Analysis (GBA)**:
   - Evaluates full-chip timing rapidly by taking the **worst-case (slowest) input slew** across all fanin pins of every multi-input cell.
   - Fast, but introduces artificial **slew-merging pessimism** because the actual critical path may be driven by a much faster input transition.

2. **Path-Based Analysis (PBA)**:
   - Re-evaluates top critical paths by **re-propagating the exact, path-specific input transition** from the true launch pin through each gate.
   - Eliminates slew-merging pessimism, recovering **50 to 150 ps of real timing margin** without any physical netlist changes!
   - Command: \`report_timing -pba_mode path -max_paths 100\`.`,
        links: [
          { title: "Tempus AOCV, POCV & PBA Analysis", href: "/vlsi/learn/c/cadence-sta/tempus-ocv-pocv-pba" },
          { title: "Timing Studio", href: "/vlsi/timing-studio" },
        ],
      };
    }

    // 10. CONFORMAL LEC & LOGIC EQUIVALENCE (Word-boundary check on 'lec')
    if (
      q.includes("conformal") ||
      hasWord("lec") ||
      q.includes("logic equivalence") ||
      q.includes("formal verification") ||
      (q.includes("equivalence") && (q.includes("golden") || q.includes("revised")))
    ) {
      return {
        a: `**Cadence Conformal Logic Equivalence Checking (LEC)** formally proves that a Revised netlist (post-synthesis, post-scan, or post-PnR) is mathematically identical to Golden RTL without test vectors.

### 4-Stage LEC Flow:
1. **Key Point Mapping**: Maps Primary Inputs, Outputs, D Flip-Flops, Latches, and Blackboxes between Golden & Revised designs.
2. **Logic Cone Extraction**: Isolates combinational Boolean logic cones feeding each compare point into Binary Decision Diagrams (BDD) and SAT solvers.
3. **Equivalence Proof**: Proves $F_{\\text{Golden}} \\oplus F_{\\text{Revised}} = 0$ for all possible input combinations.
4. **Non-Equivalence Debug**: If a point fails, Conformal generates a **counter-example vector** and isolates the failing gate cone to produce automated ECO fix scripts (\`write_eco_script\`).`,
        links: [
          { title: "Cadence Conformal LEC Course", href: "/vlsi/learn/c/cadence-lec" },
          { title: "Conformal Practical Lab", href: "/vlsi/learn/c/cadence-lec/conformal-practical-lab" },
        ],
      };
    }

    // 11. DYNAMIC IR DROP & DECAP SIZING
    if (q.includes("dynamic ir") || q.includes("decap") || q.includes("di/dt") || q.includes("ground bounce") || q.includes("inductive drop")) {
      return {
        a: `**Dynamic IR Drop** is caused by simultaneous clock-edge switching surges ($di/dt$) interacting with package loop inductance and on-die mesh resistance.

### Total Dynamic Voltage Drop:
$$\\Delta V_{\\text{dynamic}} = L_{\\text{package}} \\cdot \\frac{di}{dt} + I_{\\text{peak}} \\cdot R_{\\text{mesh}}$$

### Decoupling Capacitor (Decap) Sizing:
$$C_{\\text{decap\\_req}} = \\frac{I_{\\text{surge}} \\cdot \\Delta t_{\\text{window}}}{\\Delta V_{\\text{allowable}}}$$

- **Decap Effective Radius**: Decaps must be placed within $\\approx 15-30\\,\\mu\\text{m}$ of switching logic because electrical wave propagation across the grid is speed-of-light limited ($v \\approx 150\\,\\mu\\text{m}/\\text{ps}$).
- **Voltus Command**: \`add_decaps -cells {DECAP_X32} -target_ir_drop 0.035\`.`,
        links: [
          { title: "VLSI Calculator #30: Dynamic L·di/dt Drop", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "VLSI Calculator #31: Decap Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "Cadence Voltus Power & IR Studio", href: "/vlsi/learn/c/cadence-power/voltus-practical-lab" },
        ],
      };
    }

    // 12. PROCESS ANTENNA RATIO (PAR)
    if (q.includes("antenna") || hasWord("par") || q.includes("plasma etching") || q.includes("gate oxide breakdown")) {
      return {
        a: `**Process Antenna Effect** occurs during manufacturing plasma etching when long metal interconnects act as antennas, accumulating electrostatic charge.

### Antenna Ratio Formulation:
$$\\text{PAR} = \\frac{\\sum A_{\\text{metal\\_connected}}}{A_{\\text{gate\\_oxide}}} \\le \\text{Foundry Limit (e.g. 400:1)}$$

### Solutions in Physical Design:
1. **Antenna Diodes**: Connect reverse-biased PN junction diodes (\`ANTENNA_X1\`) close to the receiver gate to safely bleed accumulated plasma charge to the substrate.
2. **Metal Layer Bridging (Layer Hopping)**: Jump long routing wires to top metal layers right before the gate to disconnect the metal antenna until late in the fab process.
3. **Innovus Command**: \`insert_antenna_diode -cell ANTENNA_X1 -nets [get_db nets -if {.antenna_ratio > 400}]\`.`,
        links: [
          { title: "VLSI Calculator #25: Process Antenna & Diode Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "Innovus PnR Practical Lab", href: "/vlsi/learn/c/cadence-pnr/innovus-practical-lab" },
        ],
      };
    }

    // 13. CROSSTALK & MILLER EFFECT
    if (q.includes("crosstalk") || q.includes("miller") || q.includes("glitch") || q.includes("delta delay")) {
      return {
        a: `**Crosstalk Noise & Miller Capacitance Coupling**:

### 1. Miller Coupling Factor ($M_C$):
$$C_{\\text{eff}} = C_{\\text{ground}} + (1 - M_C) \\cdot C_{\\text{coupling}}$$
- **In-Phase Switching ($M_C = +1$)**: $C_{\\text{eff}} = C_{\\text{ground}}$ (Speedup).
- **Out-of-Phase Switching ($M_C = -1$)**: $C_{\\text{eff}} = C_{\\text{ground}} + 2 \\cdot C_{\\text{coupling}}$ (Slowdown / Setup Violations).

### 2. Crosstalk Glitch Noise:
$$V_{\\text{glitch}} = V_{DD} \\times \\left(\\frac{C_C}{C_C + C_G}\\right) \\times \\left(\\frac{R_{\\text{victim}}}{R_{\\text{victim}} + t_{\\text{aggressor\\_slew}} / C_C}\\right)$$
- If $V_{\\text{glitch}}$ exceeds $V_{IL\\_\\text{max}}$ on a quiet clock or reset net, it causes **false functional switching** or system crash.
- **Fixes**: Double-spacing routing tracks, metal shielding with VDD/VSS wires, and victim driver up-sizing.`,
        links: [
          { title: "VLSI Calculator #26: Miller Coupling & Delta Delay", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "VLSI Calculator #27: Crosstalk Glitch Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
        ],
      };
    }

    // 14. CLOCK GATING & ICG
    if (q.includes("clock gating") || hasWord("icg") || q.includes("integrated clock")) {
      return {
        a: `**Integrated Clock Gating (ICG)** disables clock distribution to idle flip-flop registers, slashing active dynamic power by 40-70%.

### Why Latch-Based ICGs are Mandatory:
- A naive AND gate clock gating circuit causes **glitches on the clock tree** if the enable signal changes when the clock is HIGH.
- An ICG cell integrates a **negative-latch + AND gate** (or positive-latch + OR gate):
  1. The enable signal is sampled on the **falling edge of the clock** while clock is LOW.
  2. The output AND gate transitions only when clock is cleanly LOW, **completely eliminating clock glitches**.
- **STA Check**: Tools enforce a strict **Clock Gating Setup check** on the ICG Enable pin to ensure enable arrives before the clock falling edge.`,
        links: [
          { title: "VLSI Calculator #14: ICG Power Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "Cadence Voltus Power & Low Power UPF", href: "/vlsi/learn/c/cadence-power/voltus-power-gating-upf" },
        ],
      };
    }

    // 15. METHOD OF LOGICAL EFFORT (LE)
    if (q.includes("logical effort") || q.includes("stage effort") || hasWord("fo4")) {
      return {
        a: `**Method of Logical Effort (LE)** is Sutherland's analytical framework for sizing logic gates to achieve minimum path delay.

### Key Equations:
$$F = G \\cdot B \\cdot H = \\prod g_i \\cdot \\prod b_i \\cdot \\frac{C_{\\text{out}}}{C_{\\text{in}}}$$
$$\\hat{f} = F^{1/N} \\quad (\\text{Optimal stage effort} \\approx 3.6 - 4.0)$$
$$D_{\\text{min}} = N \\cdot F^{1/N} + \\sum p_i$$

- **$g$ (Logical Effort)**: Ratio of input capacitance to an inverter delivering the same output current (Inverter = 1, NAND2 = 4/3, NOR2 = 5/3).
- **$h$ (Electrical Effort)**: Fanout ratio $C_{\\text{out}} / C_{\\text{in}}$.
- **Delay Rule**: Minimum delay occurs when every stage bears the **exact same stage effort $\\hat{f}$**.`,
        links: [
          { title: "VLSI Calculator #19: Logical Effort Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "VLSI Calculator #16: FO4 Logic Depth Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
        ],
      };
    }

    // 16. DFT & SCAN CHAINS (ATPG)
    if (hasWord("dft") || hasWord("atpg") || q.includes("scan chain") || q.includes("stuck-at") || q.includes("transition fault")) {
      return {
        a: `**Design for Testability (DFT) & Automatic Test Pattern Generation (ATPG)**:

### 1. Scan Insertion Architecture:
- Replaces normal flip-flops with **Scan Flops (Muxed-D Flops)** that have \`SI\` (Scan In), \`SO\` (Scan Out), and \`SE\` (Scan Enable) pins.
- Converts sequential circuits into flat combinational clouds during test mode for $99.5\\%+$ test coverage.

### 2. Fault Models:
- **Stuck-At Faults (DC)**: Models physical wires permanently shorted to $V_{DD}$ (Stuck-at-1) or ground (Stuck-at-0).
- **Transition Faults (At-Speed AC)**: Models slow-to-rise and slow-to-fall defects using **Launch-on-Capture (LOC)** or **Launch-on-Shift (LOS)** clock pulsing.
- **Cadence Modus / Synopsys TestMax**: Generates compressed scan vectors for ATE manufacturing testers.`,
        links: [
          { title: "DFT & Scan Chain Architecture Lab", href: "/vlsi/learn/c/dft" },
          { title: "Cadence Innovus PnR Flow", href: "/vlsi/learn/c/cadence-pnr/innovus-practical-lab" },
        ],
      };
    }

    // 17. FLOORPLANNING, UTILIZATION & MACROS
    if (q.includes("floorplan") || q.includes("utilization") || q.includes("aspect ratio") || q.includes("halo") || q.includes("channel width") || q.includes("pad-limited")) {
      return {
        a: `**Floorplanning & Core/Die Sizing Fundamentals**:

### Core Formulas:
$$A_{\\text{core}} = \\frac{A_{\\text{std\\_cells}} + A_{\\text{macros}}}{\\text{Target Utilization (0.65 - 0.75)}}$$
$$\\text{Core Width} = \\sqrt{\\frac{A_{\\text{core}}}{\\text{Aspect Ratio}}}, \\quad \\text{Core Height} = \\frac{A_{\\text{core}}}{\\text{Width}}$$
$$W_{\\text{channel}} = \\frac{N_{\\text{pins}} \\times P_{\\text{track}}}{N_{\\text{layers}} \\times 0.75}, \\quad \\text{Halo} = \\frac{W_{\\text{channel}}}{2}$$

- **Core-Limited**: Silicon size dictated by gate logic count.
- **Pad-Limited**: Silicon size inflated by peripheral bond pad count ($N_{\\text{pads}} > \\lfloor 2(W+H)/\\text{Pitch}\\rfloor$).
- **Innovus Command**: \`create_floorplan -site CoreSite -core_density_size {0.70 1.0 25 25 25 25}\`.`,
        links: [
          { title: "VLSI Calculator #1: Core Area & Dimensions Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
          { title: "VLSI Calculator #3: Macro Halo Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
        ],
      };
    }

    // 18. PHYSICAL VERIFICATION (DRC / LVS / ERC)
    if (hasWord("drc") || hasWord("lvs") || hasWord("erc") || q.includes("calibre") || q.includes("pegasus") || q.includes("design rule check")) {
      return {
        a: `**Physical Verification Signoff (DRC / LVS / ERC)**:

1. **Design Rule Checking (DRC)**:
   - Verifies geometric foundry design rules: minimum metal width, spacing, area, enclosure, and coloring rules in multi-patterning lithography.
2. **Layout Versus Schematic (LVS)**:
   - Extracts MOSFET devices, diodes, resistors, and capacitors from GDSII/OASIS polygons and compares connectivity point-by-point against the golden SPICE netlist.
   - Catches opens, shorts, and pin swaps.
3. **Electrical Rule Checking (ERC)**:
   - Validates well bias ties (N-well to VDD, P-sub to VSS), floating gates, and substrate tap latchup rules.
- **Signoff Engines**: **Cadence Pegasus** / **Siemens Calibre**.`,
        links: [
          { title: "Physical Verification DRC/LVS Lab", href: "/vlsi/learn/c/physical-verif" },
          { title: "Innovus PnR Practical Lab", href: "/vlsi/learn/c/cadence-pnr/innovus-practical-lab" },
        ],
      };
    }

    // DEFAULT COMPREHENSIVE ENGINEERING SYNTHESIS
    return {
      a: `### VLSI Engineering Analysis for: **"${queryText}"**

1. **Fundamental Physics & Circuit Topology**:
   - Verify whether the inquiry pertains to **timing closure (setup/hold/recovery)**, **power integrity ($L\\cdot di/dt$ drop)**, **physical design (floorplan/CTS/PnR)**, or **signoff equivalence (LEC/DRC/LVS)**.
   - Cross-check standard cell Liberty (.lib) lookup tables, parasitic SPEF interconnect models, and multi-mode multi-corner (MMMC) operating views.

2. **Standard Production Signoff Rules**:
   - **Timing**: Sign off with Path-Based Analysis (PBA) + Common Path Pessimism Removal (CPPR) across all active corners (-40°C to +125°C).
   - **Power Grid**: Ensure static IR drop $< 2\\%\\,V_{DD}$ and dynamic peak voltage drop $< 5\\%\\,V_{DD}$ using distributed decaps.
   - **Signal Integrity**: Guarantee max glitch voltage $< 20\\%\\,V_{DD}$ and antenna ratio $< 400:1$.

3. **Recommended EDA Verification Tools**:
   - **Timing & SI**: Cadence Tempus / Synopsys PrimeTime
   - **Power & Dynamic IR**: Cadence Voltus / Ansys RedHawk-SC
   - **Physical Implementation**: Cadence Innovus / Synopsys ICC2
   - **Formal Equivalence**: Cadence Conformal LEC / Synopsys Formality`,
      links: [
        { title: "VLSI Calculator Hub (34 Live Sizers)", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
        { title: "Interactive Timing Studio", href: "/vlsi/timing-studio" },
        { title: "MMMC Corner Matrix Studio", href: "/vlsi/mmmc-studio" },
        { title: "Cadence Voltus Power Studio", href: "/vlsi/power-studio" },
      ],
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    const currentQ = question.trim();
    setQuestion("");
    setIsAnswering(true);

    setTimeout(() => {
      setIsAnswering(false);
      const res = generateAnswer(currentQ);
      setHistory((prev) => [{ q: currentQ, a: res.a, links: res.links }, ...prev]);
    }, 250);
  };

  const handleSelectQuickPrompt = (p: QuickPrompt) => {
    setQuestion(p.query);
  };

  return (
    <section
      className="border rounded-2xl p-6 shadow-md space-y-6 relative overflow-hidden transition-all"
      style={{
        background: "var(--ln-ask-bg)",
        borderColor: "var(--ln-ask-border)",
      }}
    >
      <div
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b"
        style={{ borderColor: "var(--ln-border)" }}
      >
        <div className="space-y-1">
          <div
            className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: "var(--ln-accent-soft)",
              color: "var(--ln-accent)",
              border: "1px solid var(--ln-border)",
            }}
          >
            <Bot className="w-3.5 h-3.5" />
            VLSI AI TUTOR & EDA COMMAND ASSISTANT
          </div>
          <h2
            className="text-xl font-bold tracking-tight flex items-center gap-2"
            style={{ color: "var(--ln-text)" }}
          >
            Ask Questions If You Didn't Understand Any Concepts Or EDA Commands
          </h2>
          <p className="text-xs max-w-2xl leading-relaxed" style={{ color: "var(--ln-muted)" }}>
            Stuck on a tricky physical design concept, EDA tool command (Innovus, Tempus, Voltus, ICC2, SDC), dynamic IR drop formula, or formal LEC proof? Ask any question below for instant syntax, derivations, and solutions.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <span
            className="px-2.5 py-1 rounded-lg border text-[11px] font-mono flex items-center gap-1.5"
            style={{
              background: "var(--ln-bg-elev)",
              borderColor: "var(--ln-border)",
              color: "var(--ln-muted)",
            }}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            EDA Commands & Physics DB
          </span>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="space-y-2">
        <div
          className="text-[11px] font-mono font-semibold uppercase tracking-wider flex items-center gap-1.5"
          style={{ color: "var(--ln-muted)" }}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          Popular EDA Commands & Interview Questions:
        </div>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectQuickPrompt(p)}
              className="px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer text-left hover:brightness-105"
              style={{
                background: "var(--ln-prompt-bg)",
                borderColor: "var(--ln-prompt-border)",
                color: "var(--ln-prompt-text)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type any VLSI question or EDA command (e.g. 'what is command to get all macros?', 'how to get all flops?', 'set multicycle path syntax in SDC', 'how to add power stripes in Innovus')..."
            rows={3}
            className="w-full rounded-xl border p-3.5 text-xs focus:outline-none focus:border-blue-500 font-sans leading-relaxed shadow-sm transition-all"
            style={{
              background: "var(--ln-input-bg)",
              borderColor: "var(--ln-input-border)",
              color: "var(--ln-input-text)",
            }}
          />
          <button
            type="submit"
            disabled={!question.trim() || isAnswering}
            className={`absolute right-3 bottom-3 px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
              !question.trim() || isAnswering
                ? "bg-slate-400/20 text-slate-400 border border-slate-300/40 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-600/30"
            }`}
          >
            {isAnswering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Searching DB...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Ask Question
              </>
            )}
          </button>
        </div>
      </form>

      {/* Answers History */}
      {history.length > 0 && (
        <div className="space-y-4 pt-2 border-t" style={{ borderColor: "var(--ln-border)" }}>
          <div
            className="text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-between"
            style={{ color: "var(--ln-muted)" }}
          >
            <span>Recent Explanations & EDA Command Answers ({history.length}):</span>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-[10px] underline cursor-pointer hover:opacity-80"
              style={{ color: "var(--ln-muted)" }}
            >
              Clear
            </button>
          </div>

          <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
            {history.map((item, idx) => (
              <div
                key={idx}
                className="border rounded-xl p-4 space-y-3 shadow-sm transition-all"
                style={{
                  background: "var(--ln-history-bg)",
                  borderColor: "var(--ln-history-border)",
                }}
              >
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-500 text-xs font-bold shrink-0 mt-0.5">
                    Q
                  </div>
                  <div className="text-xs font-bold leading-relaxed" style={{ color: "var(--ln-text)" }}>
                    {item.q}
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pl-1">
                  <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-500 text-xs font-bold shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-xs leading-relaxed space-y-2 whitespace-pre-wrap font-sans flex-1" style={{ color: "var(--ln-muted)" }}>
                    {item.a}
                  </div>
                </div>

                {item.links && item.links.length > 0 && (
                  <div className="pt-2 border-t pl-8 flex flex-wrap items-center gap-2" style={{ borderColor: "var(--ln-border)" }}>
                    <span className="text-[10px] font-mono" style={{ color: "var(--ln-muted)" }}>
                      Related Lessons & Tools:
                    </span>
                    {item.links.map((link, lIdx) => (
                      <Link
                        key={lIdx}
                        href={link.href}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all hover:opacity-90"
                        style={{
                          background: "var(--ln-accent-soft)",
                          borderColor: "var(--ln-border)",
                          color: "var(--ln-accent)",
                        }}
                      >
                        <BookOpen className="w-3 h-3" />
                        {link.title}
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
