/**
 * Full Interview Masterclass question bank (SERVER / API only).
 * Do not import this module from client components — answers would ship in the browser bundle.
 * Client: @/lib/interview-meta + /api/interview/*
 */

import "server-only";
import { ADDITIONAL_INTERVIEW_QUESTIONS } from "./vlsi-interview-masterclass-additions";
import type { InterviewQuestion } from "./interview-meta";

export type {
  SemiconductorCompany,
  InterviewDomain,
  InterviewQuestion,
  CompanyInfo,
} from "./interview-meta";

export {
  COMPANIES_METADATA,
  DOMAINS_METADATA,
  INTERVIEW_BUNDLE_PRICING,
  studioPracticeForInterviewDomain,
} from "./interview-meta";

export const INTERVIEW_QUESTIONS_BANK: InterviewQuestion[] = [
  // 🟡 DOMAIN: LOGIC SYNTHESIS & SDC CONSTRAINTS (10+ Year Depth)
  {
    id: "syn-01",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Your top-level chip synthesis finishes with WNS = −3.5 ns and huge TNS, but the longest R2R (register-to-register) path has positive slack (+0.9 ns). What is happening, and what is your diagnostic playbook in the first 15 minutes?",
    shortSummary: "Chip WNS is dominated by I2O (input-to-output) feedthroughs with large pad arcs. Upsizing core gates will never close timing; you must triage path groups.",
    detailedAnswer: `### 1. Root Cause Diagnosis:
- A chip WNS of $-3.5\\,\\text{ns}$ while internal **reg2reg (R2R) is positive (+0.9 ns)** proves the failure is **NOT inside the core logic depth**.
- The timing violation is in an external boundary path group: almost certainly **I2O (Input-to-Output pure combinational feedthrough)** or **R2O / I2R** with severe pad delays.
- On a pad-ring chip (\`pad_top\`), an input pad cell alone might have an internal propagation arc of $0.7\\,\\text{ns}$, the output pad $1.4\\,\\text{ns}$, plus board/tester $C_{\\text{load}}$:
$$T_{\\text{pad\\_in}} + T_{\\text{core\\_combo}} + T_{\\text{pad\\_out}} = 0.7 + 0.5 + 1.4 = 2.6\\,\\text{ns} > 2.0\\,\\text{ns clock period}!$$
- No amount of ALU/core logic upsizing by Genus will ever close this $-3.5\\,\\text{ns}$ slack!

### 2. First 15-Minute Senior Playbook:
1. **Report by Cost Path Group**:
   Run \`report_qor\` to inspect WNS/TNS broken down by \`reg2reg\`, \`in2reg\`, \`reg2out\`, and \`in2out\`.
2. **Identify Start/End Points of Top Violator**:
   Run \`report_timing -max_paths 5\`. Note whether startpoint is a primary port (\`pad_addr*\`) and endpoint is a primary port (\`pad_flag*\`).
3. **Audit External Environment Constraints**:
   Run \`report_port -delay\`, \`report_port -driver\`, and \`report_port -load\` to detect unrealistic external constraints.
4. **Architectural Resolution Options**:
   - Register the feedthrough path at core boundary (break I2O into I2R + R2O).
   - Relax external $T_{\\text{input\\_delay}}$ / $T_{\\text{output\\_delay}}$ board budgets.
   - If feedthrough is static/asynchronous by protocol, apply a validated architectural \`set_false_path\` or \`set_multicycle_path\`.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Triage by Path Group in Genus Common UI:
report_qor
report_timing -group in2out -max_paths 5
report_timing -from [all_registers] -to [all_registers] -max_paths 5

# 2. Audit I/O port constraints:
report_port -delay [all_inputs]
report_port -delay [all_outputs]
report_port -driver [all_inputs]
report_port -load [all_outputs]

# 3. Dedicated Path Groups with optimizer weights:
group_path -name in2out -from [all_inputs] -to [all_outputs] -weight 5.0`,
    },
    commonPitfalls: [
      "Spending days upsizing core ALUs when the timing path starts and ends at chip pads.",
      "Blaming synthesis tool mapping algorithms without inspecting path groups.",
    ],
    interviewerFollowups: [
      "How do default cost groups in Genus prioritize TNS optimization across different clock domains?",
      "If the customer specification forbids adding registers on I2O, how do you close timing at the board/SoC interface level?",
    ],
    tags: ["genus", "path-groups", "wns-triage", "i2o-feedthrough", "cadence-interview"],
  },

  {
    id: "syn-02",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Derive the exact setup slack equation for an I2O (input-to-output) pure combinational feedthrough path. Where do 'set_input_delay' and 'set_output_delay' appear? Refute the claim that 'input_delay is added to required time' and prove the mathematical equivalence of required vs arrival forms.",
    shortSummary: "input_delay adds to data arrival time; output_delay subtracts from required time. Claiming input_delay adds to required time is a fundamental STA bookkeeping error.",
    detailedAnswer: `### 1. Rigorous STA Mathematical Derivation:
In an I2O pure feedthrough path, data launches from an external transmitter clock edge and is captured by an external receiver clock edge:

1. **Data Arrival Time ($T_{\\text{arrival}}$)**:
   The external chip launches data with a delay of $T_{\\text{input\\_delay}}^{\\max}$ after the launch clock edge:
   $$T_{\\text{arrival}} = T_{\\text{launch}} + T_{\\text{input\\_delay}}^{\\max} + T_{dp}^{\\text{in} \\rightarrow \\text{out}, \\max}$$
   where $T_{dp}^{\\text{in} \\rightarrow \\text{out}, \\max} = T_{\\text{pad\\_in}} + T_{\\text{core\\_comb}} + T_{\\text{pad\\_out}}$.

2. **Data Required Time ($T_{\\text{required}}$)**:
   The external receiving flop requires data to arrive $T_{\\text{output\\_delay}}^{\\max}$ before its capture edge, minus clock uncertainty:
   $$T_{\\text{required}} = T_{\\text{capture}} - T_{\\text{output\\_delay}}^{\\max} - T_{\\text{su\\_unc}}$$

3. **Setup Slack Calculation**:
   $$\\text{Slack}_{\\text{setup}} = T_{\\text{required}} - T_{\\text{arrival}}$$
   $$\\text{Slack}_{\\text{setup}} = \\left(T_{\\text{capture}} - T_{\\text{output\\_delay}}^{\\max} - T_{\\text{su\\_unc}}\\right) - \\left(T_{\\text{launch}} + T_{\\text{input\\_delay}}^{\\max} + T_{dp}^{\\max}\\right)$$
   With single-cycle edge alignment ($T_{\\text{capture}} - T_{\\text{launch}} = T_{\\text{period}}$):
   $$\\mathbf{\\text{Slack}_{\\text{setup}} = T_{\\text{period}} - T_{\\text{input\\_delay}}^{\\max} - T_{\\text{output\\_delay}}^{\\max} - T_{dp}^{\\max} - T_{\\text{su\\_unc}}}$$

### 2. Refuting the Fallacy:
- **Fallacy**: *"input_delay is added to required time."*
- **Refutation**: \`set_input_delay\` models the external data propagation before reaching chip boundary — it belongs strictly to **Arrival Time** ($T_{\\text{arrival}}$). Adding it to required time would mean slower external transmitters give you *more* time to compute on chip, which violates the laws of physics.

### 3. Dual Mathematical Equivalence of Output Delay:
- Standard Form (Required side): $T_{\\text{req}} = T_{\\text{capture}} - T_{\\text{output\\_delay}} \\implies \\text{Slack} = (T_{\\text{capture}} - T_{\\text{output\\_delay}}) - T_{\\text{arr}}$
- Dual Form (Arrival side): $T_{\\text{arr}}' = T_{\\text{arr}} + T_{\\text{output\\_delay}} \\implies \\text{Slack} = T_{\\text{capture}} - (T_{\\text{arr}} + T_{\\text{output\\_delay}})$
Both formulations yield the identical mathematical slack; industry STA engines standardly subtract \`output_delay\` in the required time column.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Standard I/O Boundary Constraints in SDC:
set_input_delay -max 0.400 -clock [get_clocks SYS_CLK] [remove_from_collection [all_inputs] [get_ports sys_clk]]
set_input_delay -min 0.100 -clock [get_clocks SYS_CLK] [remove_from_collection [all_inputs] [get_ports sys_clk]]

set_output_delay -max 0.450 -clock [get_clocks SYS_CLK] [all_outputs]
set_output_delay -min 0.080 -clock [get_clocks SYS_CLK] [all_outputs]

# Verify with detailed arrival/required breakdown:
report_timing -from [get_ports pad_data_in*] -to [get_ports pad_data_out*] -path_type full_clock`,
    },
    commonPitfalls: [
      "Stating that set_input_delay adds to required time.",
      "Forgetting that increasing output_delay by +100 ps reduces setup slack by exactly 100 ps.",
    ],
    interviewerFollowups: [
      "How does set_input_delay -min interact with hold timing equations?",
      "In source-synchronous DDR interfaces, why is clock skew subtracted from available setup margin?",
    ],
    tags: ["sta", "sdc-equations", "input-delay", "output-delay", "slack-derivation"],
  },

  {
    id: "syn-03",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the exact backend mechanics of 'syn_generic', 'syn_map', and 'syn_opt' in Cadence Genus. Why might 'syn_map' pick a slow high-Vt cell on the critical path even when low-Vt exists? Can an AOI complex cell be decomposed into NAND-NOR gates during 'syn_opt'?",
    shortSummary: "syn_generic builds technology-independent GTECH gates; syn_map binds real Liberty cells; syn_opt restructures and sizes. High-Vt on critical paths occurs due to dont_use attributes, power budgets, or stale cost updates.",
    detailedAnswer: `### 1. The Three Abstraction Layers of Synthesis:
1. **\`syn_generic\` (Technology-Independent Optimization)**:
   - Builds an unmapped generic netlist (GTECH) implementing RTL boolean expressions.
   - Performs constant propagation, dead-code pruning, resource sharing, datapath arithmetic optimization (e.g. Wallace/Dadda multiplier trees), and FSM state encoding.
   - Uses idealized wireload models with constraints for initial timing estimation.
2. **\`syn_map\` (Technology Mapping)**:
   - Covers generic boolean DAGs using **real standard cells (\`lib_cell\`)** from active Liberty (.lib) target libraries.
   - Computes non-linear delay tables (NLDM / CCS): $\\text{Delay} = f(S_{\\text{in}}, C_{\\text{load}})$.
   - Solves a multi-objective cost optimization balancing timing slack, total silicon area, and dynamic/leakage power.
3. **\`syn_opt\` (Post-Map Optimization)**:
   - Performs gate upsizing/downsizing, repeater buffer insertion, pin swapping across equivalent logic pins, and boolean restructuring (e.g. factoring complex AOI into separate NAND/NOR gates).

### 2. Why 'syn_map' Picks High-Vt on a Critical Path (Real-World Causes):
1. **\`dont_use\` attribute set**: The fast LVT cell variant was marked with \`set_db [get_db lib_cells *LVT*] .dont_use true\` to restrict leakage.
2. **Active Analysis View / Library Set Mismatch**: The LVT library was omitted from the active setup analysis view (\`create_library_set\`).
3. **Severe Leakage Power Optimization Weight**: If \`max_leakage_power\` constraint or high power effort is enabled, Genus down-tiers non-violating or slightly negative paths.
4. **Max Capacitance / Slew DRC Violations**: An LVT cell may have a lower output load driving limit than an HVT cell of larger drive strength.
5. **Path Group Masking**: The path belongs to a neglected cost group with a low priority weight compared to other clock groups.

### 3. Decomposing AOI Complex Cells in 'syn_opt':
- **Yes**: If an AOI222 cell has a large intrinsic internal delay arc for a specific input pin, \`syn_opt\` can rewrite the boolean equation into separate 2-input NAND and NOR gates, placing the critical arriving signal on the fastest terminal of the first gate.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Cadence Genus Common UI Synthesis Flow:
read_hdl -sv [list core.v alu.sv]
elaborate core
read_sdc constraints.sdc

# 1. Tech-independent optimization
syn_generic

# 2. Technology mapping
syn_map

# 3. Post-map restructuring & timing closure
syn_opt -spatial
report_qor > reports/qor_post_opt.rpt`,
    },
    commonPitfalls: [
      "Thinking syn_generic binds foundry standard cells.",
      "Assuming the lowest-Vt cell is always chosen without checking leakage power constraints.",
    ],
    interviewerFollowups: [
      "What is the difference between syn_opt -logical and syn_opt -spatial in Genus iSpatial flows?",
      "How does LEC (Logic Equivalence Checking) correlate unmapped generic netlists against final mapped gates?",
    ],
    tags: ["genus", "syn-generic", "syn-map", "syn-opt", "cell-mapping", "cadence"],
  },

  {
    id: "syn-04",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "A junior engineer runs 'set_false_path -from [all_inputs] -to [all_outputs]' to turn chip WNS from red to green. Is the chip timing closed? When must you use 'set_clock_groups -asynchronous' instead of 'set_false_path' between clock domains?",
    shortSummary: "Masking all feedthrough paths with false_path produces a false green QoR while silicon fails. Always use set_clock_groups -asynchronous for CDC to enforce bidirectional domain integrity.",
    detailedAnswer: `### 1. The False Green Trap:
- **No, the chip is emphatically NOT closed**: Running \`set_false_path -from [all_inputs] -to [all_outputs]\` indiscriminately purges all timing assertions between input and output ports.
- If **any** combinational bypass, status flag, interrupt signal, or bus feedthrough operates synchronously in functional mode, its setup/hold checks are permanently disabled.
- In physical implementation, the PnR tool will strip buffers and downsize gates to minimal drive strength to save area, creating **multi-nanosecond propagation delays that guarantee silicon failure on the tester**.
- **Golden Senior Rule**: *A green QoR report achieved through fraudulent timing exceptions is far more dangerous than a red QoR report with honest negative slack.*

### 2. 'set_clock_groups -asynchronous' vs Scattershot 'set_false_path':
- **Piecemeal False Paths Risk**:
  \`\`\`tcl
  set_false_path -from [get_clocks CLK_A] -to [get_clocks CLK_B]
  \`\`\`
  This only disables the forward path ($A \\rightarrow B$). Engineers frequently forget the reverse direction ($B \\rightarrow A$), creating asymmetry and leaving clock-to-data reconvergence unmanaged.
- **Why 'set_clock_groups -asynchronous' is the preferred CDC exception (not the only legal one)**:
  \`\`\`tcl
  set_clock_groups -asynchronous -group [get_clocks CLK_A] -group [get_clocks CLK_B]
  \`\`\`
  1. **Bidirectional**: Disables timing symmetrically in both directions ($A \\leftrightarrow B$) in one construct.
  2. **Cleaner than one-way false paths**: Piecemeal \`set_false_path\` / \`set_max_delay\` methodologies also exist, but they are easier to get asymmetric or incomplete — prefer clock_groups unless your methodology standard says otherwise.
  3. **Preserves Internal Checks**: Disables only inter-domain paths without touching intra-clock paths inside CLK_A or CLK_B.
  4. **CDC lint is independent**: Jasper/SpyGlass prove synchronizer structure from RTL/netlist connectivity; they do **not** require clock_groups to detect CDC, but SDC exceptions must still match the real async architecture.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Correct Asynchronous Clock Domain SDC:
set_clock_groups -asynchronous \\
  -name CG_ASYNC_DOMAINS \\
  -group [get_clocks {SYS_CLK PLL_DIV2_CLK}] \\
  -group [get_clocks {PCIE_REFCLK PCIE_TX_CLK}] \\
  -group [get_clocks {USB_480M}]

# Audit for unconstrained endpoints after exceptions:
report_timing -unconstrained -max_paths 20`,
    },
    commonPitfalls: [
      "Using false paths to silence real timing violations instead of fixing RTL pipelining or SDC budgets.",
      "Using unidirectional set_false_path between asynchronous clock domains.",
    ],
    interviewerFollowups: [
      "What is the priority order in SDC between set_clock_groups, set_false_path, set_multicycle_path, and set_max_delay?",
      "How do you constrain asynchronous reset recovery and removal paths without applying a global false path?",
    ],
    tags: ["sdc-hygiene", "false-path", "clock-groups", "cdc", "timing-exceptions"],
  },

  {
    id: "syn-05",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Technical Phone Screen",
    question: "Explain the critical difference between 'set_input_transition' and 'set_driving_cell' on chip primary inputs. When does each model make I/O timing overly optimistic or overly pessimistic? How do pF-scale pad capacitances interact with external 'set_load'?",
    shortSummary: "set_input_transition forces a fixed slew regardless of load; set_driving_cell calculates slew from actual receiver capacitance using Liberty tables.",
    detailedAnswer: `### 1. Fundamental Difference:
- **\`set_input_transition\`**:
  - Forces an **ideal, fixed slew** ($t_r / t_f$) at the input port regardless of the net's capacitive fanout load.
  - Slew does not degrade even if the input drives 100 internal flops or a high-capacitance macro pin!
- **\`set_driving_cell\`**:
  - Models the **real external physical driver** (e.g. \`BUFX4D1BWP16P90\`).
  - Genus computes the input net's total load ($C_{\\text{pin}} + C_{\\text{wire}}$) and looks up the driver's non-linear Liberty table to calculate the **true output slew** and intrinsic driver delay.

### 2. Optimistic vs Pessimistic Failure Modes:
- **Optimistic Danger (\`set_input_transition 0.05\`)**:
  - Applying a sharp $50\\,\\text{ps}$ slew on a high-fanout chip input creates artificially fast first-stage gate delays in synthesis. Post-route, the real board driver experiences heavy loading, slowing transition to $400\\,\\text{ps}$, destroying timing.
- **Pessimistic Danger (\`set_input_transition 0.50\`)**:
  - An overly slow $500\\,\\text{ps}$ slew forces synthesis to aggressively upsize first-stage buffers and insert multi-stage repeater trees, wasting silicon area and dynamic power.

### 3. Interaction with Pad Pin Capacitance:
- Top-level chip I/O pads have massive ESD diodes and bond pads with pin capacitance reaching **$1.0 - 2.5\\,\\text{pF}$** (compared to $0.5\\,\\text{fF}$ for standard cells).
- When \`set_load 0.05\` ($50\\,\\text{fF}$) is specified, Genus **adds** this external board load to the pad's internal pin capacitance:
$$C_{\\text{total}} = C_{\\text{pad\\_internal}} + C_{\\text{external\\_load}}$$
- If \`set_driving_cell\` is omitted on an input pad, the tool may default to zero driver resistance, masking severe pad slew degradation.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Accurate Driving Cell & Output Load Modeling:
set_driving_cell -lib_cell BUFX8D1BWP16P90 -pin Z [remove_from_collection [all_inputs] [get_ports pad_clk]]
set_load -max 0.040 [all_outputs] ;# 40 fF external board trace + receiver

# Audit the synthesized input driving models:
report_port -driver [all_inputs]
report_port -load [all_outputs]`,
    },
    commonPitfalls: [
      "Using set_input_transition on clock ports instead of set_clock_transition.",
      "Forgetting that set_load adds on top of internal cell pin capacitance.",
    ],
    interviewerFollowups: [
      "How do you model input drive on a multi-voltage bidir pad with level shifter overhead?",
      "Why does a slow input transition cause excessive short-circuit (crowbar) power consumption in the receiver stage?",
    ],
    tags: ["io-modeling", "input-transition", "driving-cell", "pad-capacitance", "genus"],
  },

  {
    id: "syn-06",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the root cause and resolution for each 'check_design' flag: '-unresolved', '-multiple_driver', '-undriven', '-combo_loops', and '-assigns'. Why might a pad top report hundreds of constants, and why would forcing that count to zero break the chip?",
    shortSummary: "check_design audits structural integrity. Pad control pins (IE, PE, PS) are intentionally tied to constants; forcing zero constants breaks pad direction and pullup controls.",
    detailedAnswer: `### 1. 'check_design' Diagnostic Playbook:
| Flag | Severity | Root Cause | Engineering Resolution |
|------|----------|------------|------------------------|
| \`-unresolved\` | **Fatal** | Missing Verilog module definition or missing \`.lib\` macro | Verify \`read_hdl\` file list; verify \`set_db library\` includes all SRAMs/IPs. |
| \`-multiple_driver\` | **Fatal** | Two active gates driving the same net simultaneously | Fix RTL bus contention; check tri-state bus enable logic. |
| \`-undriven\` | **High** | Unconnected input port or internal wire | Wire to functional source in RTL, or explicitly connect to constant. |
| \`-combo_loops\` | **Fatal** | Pure combinational feedback cycle (e.g. $A = B \\land \\sim A$) | Break loop in RTL; replace asynchronous latches with registered flops. |
| \`-assigns\` | **Handoff Block** | Verilog structural \`assign out = in;\` statements | Run \`remove_assigns_without_opt\` or \`set_db remove_assigns true\` to insert buffers. |

### 2. The Pad-Ring Constant Tie Fallacy:
- When synthesizing a full pad top (\`pad_top\`), bidirectional and tri-state pads require static mode configuration pins:
  - \`IE\` (Input Enable): Tied to \`1'b1\` for dedicated inputs, \`1'b0\` for outputs.
  - \`PE\` (Pull Enable): Tied to \`1'b1\` to enable internal pull-up/pull-down resistors.
  - \`PS\` (Pull Select): Tied to \`1'b1\` for pull-up, \`1'b0\` for pull-down.
  - \`DS0, DS1\` (Drive Strength Select): Tied to fixed bits to configure pad drive milliamps ($4\\,\\text{mA}, 8\\,\\text{mA}, 12\\,\\text{mA}$).
- **Why Forcing Zero Constants Breaks the Chip**:
  - A chip with 100 pad cells will naturally have **200–400 intentional constant connections**!
  - Junior engineers attempting to achieve "0 constants" often mistakenly delete the ties or leave pins floating, causing pad transceivers to float in undefined electrical states that burn massive static current or oscillate.
- Correct Signoff Solution:
  - Replace raw logical constants with dedicated ESD-protected physical tie cells using add_tieoffs:
  add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 pad_top
  Now check_design -constant transitions into check_design -through_tie_cell (clean physical signoff).`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Cadence Genus Structural Integrity Audit:
check_design -unresolved
check_design -multiple_driver
check_design -undriven
check_design -combo_loops

# Remove Verilog assign statements for Innovus handoff:
set_remove_assign_options -buffer_or_inverter BUFX2 -design pad_top
remove_assigns_without_opt -design pad_top -verbose
set_db remove_assigns true

# Insert physical tie-high / tie-low cells:
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 pad_top
check_design -through_tie_cell`,
    },
    commonPitfalls: [
      "Ignoring -unresolved cells assuming PnR will link them automatically.",
      "Leaving raw 1'b0 / 1'b1 connections instead of inserting foundry TIEHI / TIELO standard cells.",
    ],
    interviewerFollowups: [
      "Why do foundry DRC rules prohibit connecting transistor gates directly to VDD / VSS rails without tie cells in sub-7nm FinFET nodes?",
      "How does delete_unloaded_undriven clean up dead hierarchy without touching design ports?",
    ],
    tags: ["check-design", "structural-lint", "tie-cells", "assigns-removal", "pad-ring"],
  },

  {
    id: "syn-07",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Why does hold timing often report MET in Genus synthesis with ideal clocks, but cascade into severe hold violations post-CTS in Innovus at the min corner? How does DFT scan insertion aggravate functional setup timing?",
    shortSummary: "Synthesis assumes ideal clocks with zero skew; post-CTS clock insertion latency and min-corner fast paths expose severe hold races. Scan insertion adds multiplexer delay to flop D-pins.",
    detailedAnswer: `### 1. The Ideal Clock Hold Illusion in Synthesis:
In pre-CTS logic synthesis (\`syn_generic\`, \`syn_map\`, \`syn_opt\`), clock networks are treated as **ideal distributed nets** (\`set_ideal_network\` or zero latency):
- Launch clock latency = $0.0\\,\\text{ps}$; Capture clock latency = $0.0\\,\\text{ps}$; Skew = $0.0\\,\\text{ps}$.
- Under zero skew, hold equation reduces to:
$$\\text{Slack}_{\\text{hold}} = (T_{\\text{cq}}^{\\min} + T_{\\text{dp}}^{\\min}) - (T_{\\text{hold}} + T_{\\text{hold\\_unc}})$$
- Since $T_{\\text{cq}}^{\\min} \\approx 80\\,\\text{ps}$ and $T_{\\text{hold}} \\approx 20\\,\\text{ps}$, even a zero-gate back-to-back shift register has $+60\\,\\text{ps}$ positive slack in synthesis!

### 2. Post-CTS Physical Reality in Innovus at Min Corner:
1. **Clock Tree Insertion Latency & Local Skew**:
   After CTS inserts 4–8 buffer stages, the capture clock might arrive **$120\\,\\text{ps}$ later** than the launch clock due to local OCV or unequal branch lengths.
2. **Min Process Corner (Fast-Fast, High VDD, Cold Temp)**:
   Combinational cell delays shrink by up to $60\\%$. $T_{\\text{dp}}^{\\min}$ collapses, while capture clock delay stays high:
   $$\\text{Slack}_{\\text{hold}} = (T_{\\text{cq}}^{\\min} + T_{\\text{dp}}^{\\min}) - (T_{\\text{skew}} + T_{\\text{hold}} + T_{\\text{hold\\_unc}}) < 0 \\implies \\mathbf{\\text{Hold Violation!}}$$
3. **Engineering Practice**:
   Never attempt to close hold in logic synthesis. Hold closure is fundamentally a **physical PnR domain problem** fixed post-CTS using delay buffer insertion and useful skew scheduling.

### 3. How DFT Scan Insertion Penalizes Functional Setup Timing:
- Scan insertion replaces standard D-Flip-Flops with **Scan-Flops (SDF-FF)** containing an internal 2:1 multiplexer before the master latch.
- This scan mux introduces **$30 - 60\\,\\text{ps}$ of intrinsic combinational delay** directly onto the functional data path entering the D pin.
- Furthermore, scan chain routing increases parasitic wire load on flip-flop pins. If scan chains are stitched without timing awareness, critical functional paths can fail setup signoff.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# In Genus: Run timing lint with ideal network audit
report_clocks
report_timing -min ;# Often misleadingly green during synthesis

# Correct SDC practice: budget clock uncertainty for post-CTS skew
set_clock_uncertainty -setup 0.060 [get_clocks SYS_CLK]
set_clock_uncertainty -hold  0.080 [get_clocks SYS_CLK] ;# Guardband for CTS hold`,
    },
    commonPitfalls: [
      "Inserting hold delay buffers during pre-CTS synthesis (which wastes area and hurts setup).",
      "Ignoring the 40 ps setup penalty introduced by scan-mux D-pins.",
    ],
    interviewerFollowups: [
      "How does lockup latch insertion prevent hold violations between different scan chain clock domains during shift mode?",
      "Why is useful skew effective for fixing setup timing but dangerous for hold timing?",
    ],
    tags: ["hold-timing", "ideal-clock", "cts", "dft-scan", "clock-skew"],
  },

  {
    id: "syn-08",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "For a datapath architecturally requiring 2 clock cycles for setup, write the precise SDC multicycle pair. Why is the hold multicycle multiplier typically set to 1 rather than 2? Draw the clock edge alignment on a whiteboard.",
    shortSummary: "Setup multicycle of N cycles expands capture edge to N*T; without hold multicycle of N-1, the tool checks hold against edge (N-1)*T instead of edge 0, causing impossible hold violations.",
    detailedAnswer: `### 1. The 2-Cycle Multicycle SDC Command Pair:
\`\`\`tcl
set_multicycle_path 2 -setup -from [get_cells u_pipe_src] -to [get_cells u_pipe_dst]
set_multicycle_path 1 -hold  -from [get_cells u_pipe_src] -to [get_cells u_pipe_dst]
\`\`\`

### 2. Whiteboard Clock Edge Alignment & Derivation:
Consider clock period $T = 1.0\\,\\text{ns}$:
\`\`\`text
Launch Clock:   0ns (Edge 0)          1ns (Edge 1)          2ns (Edge 2)
                 |                     |                     |
Capture Clock:  0ns                   1ns                   2ns
\`\`\`

1. **Default Single-Cycle Check (Without Multicycle)**:
   - Setup Check: Launch at \`0ns\`, Capture at \`1ns\` (1 cycle margin).
   - Hold Check: Launch at \`0ns\`, Capture at \`0ns\` (same-edge check).

2. **When You Apply ONLY Setup Multicycle 2 (\`set_multicycle_path 2 -setup\`)**:
   - Setup Check moves from \`1ns\` $\\rightarrow$ \`2ns\` (2 cycles margin: $2 \\times T$).
   - **The SDC Default Hold Rule**: The tool standardly checks hold **one cycle before the setup capture edge**:
     $$\\text{Hold Capture Edge} = \\text{Setup Capture Edge} - 1\\,\\text{cycle} = 2\\,\\text{ns} - 1\\,\\text{ns} = \\mathbf{1\\,\\text{ns}!}$$
   - This means the tool demands that data launched at \`0ns\` must NOT arrive before \`1ns\`!
   - This creates a **catastrophic, artificial $+1.0\\,\\text{ns}$ hold violation** requiring massive buffer chains!

3. **Why Hold Multiplier Must Be 1 (\`set_multicycle_path 1 -hold\`)**:
   - The \`-hold\` multiplier specifies how many clock cycles to pull the hold capture edge **backward** from the default hold position:
     $$\\text{New Hold Edge} = 1\\,\\text{ns} - (1 \\times T) = \\mathbf{0\\,\\text{ns}}$$
   - This restores the correct physical hold check: data launched at \`0ns\` cannot race into the destination flop at \`0ns\`.
   - **General Rule**: For an $N$-cycle setup multicycle, you must specify an $(N-1)$-cycle hold multicycle!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Correct N-Cycle Multicycle Template:
# Setup allows 3 clock cycles:
set_multicycle_path 3 -setup -from [get_cells u_mac/mult_*] -to [get_cells u_mac/accum_*]
# Hold pulls check back by N-1 = 2 cycles:
set_multicycle_path 2 -hold  -from [get_cells u_mac/mult_*] -to [get_cells u_mac/accum_*]

# Verify path edges on timing report:
report_timing -from [get_cells u_mac/mult_0] -to [get_cells u_mac/accum_0] -path_type full_clock`,
    },
    commonPitfalls: [
      "Specifying set_multicycle_path 2 -setup without a matching -hold constraint.",
      "Thinking multicycle 2 -hold means checking hold 2 cycles later.",
    ],
    interviewerFollowups: [
      "What is the difference between applying multicycle with -start vs -end on paths between clocks with different periods?",
      "How do you formally verify with LEC or SVA that a multicycle path enable signal is truly active only every N cycles?",
    ],
    tags: ["multicycle-path", "sdc", "hold-multiplier", "clock-edges", "sta-whiteboard"],
  },

  {
    id: "syn-09",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Technical Phone Screen",
    question: "How does statistical wireload modeling (WLM) differ from Physical Layout Estimation (PLE) and iSpatial synthesis? What is the danger of using 'path_adjust' to close timing?",
    shortSummary: "Wireload models use statistically averaged interconnect tables that fail at sub-7nm; PLE uses rough DEF floorplan coordinates. path_adjust is a localized synthetic margin that hides architectural bottlenecks.",
    detailedAnswer: `### 1. Wireload Models (WLM) vs PLE vs iSpatial:
1. **Statistical Wireload Models (\`interconnect_mode wireload\`)**:
   - Estimates net resistance and capacitance purely based on net fanout count using a statistical lookup table.
   - **Failure in Advanced Nodes**: Completely blind to physical macro placement, aspect ratios, and routing congestion. A net spanning 2 mm across the chip is estimated with the same capacitance as an adjacent 10 µm net!
2. **Physical Layout Estimation (PLE) (\`interconnect_mode ple\`)**:
   - Reads floorplan DEF coordinates and macro boundaries.
   - Computes bounding-box wire lengths to estimate realistic $R_{\\text{net}}$ and $C_{\\text{net}}$, dramatically improving correlation with Innovus placement.
3. **Genus iSpatial Synthesis**:
   - Uses the identical placement and routing engines as Innovus during \`syn_opt -spatial\`.
   - Produces virtually zero timing correlation discrepancy between synthesis and physical design signoff.

### 2. The Danger of 'path_adjust':
- \`path_adjust -delay <ps> -setup\` is a Genus command that artificially modifies the timing margin on a specific pin-to-pin path.
- **Why It Is High Risk**:
  - It does not improve physical silicon; it merely instructs the timing engine to subtract or add picoseconds to the slack calculation.
  - While useful for rapid "what-if" architectural exploration or modeling temporary ECO margins, leaving \`path_adjust\` in production SDC creates **fake timing closure** where the chip appears green in synthesis but fails physical signoff in Tempus.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Configure PLE Physical Synthesis in Genus:
set_db interconnect_mode ple
read_def floorplan.def
read_lef tech.lef

# Perform physical-aware synthesis:
syn_generic -physical
syn_map -physical
syn_opt -spatial

# Audit interconnect mode:
get_db interconnect_mode`,
    },
    commonPitfalls: [
      "Using statistical wireload models for sub-Advanced FinFET designs.",
      "Checking in production SDC scripts containing active path_adjust statements.",
    ],
    interviewerFollowups: [
      "How does Genus iSpatial handle macro placement blockage layers during early congestion estimation?",
    ],
    tags: ["wireload", "ple", "ispatial", "path-adjust", "physical-synthesis"],
  },

  {
    id: "syn-10",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "How do you definitively prove whether a critical path is limited by transition/slew design rule violations (DRVs) versus pure combinational logic depth? What is the risk of using 'set_ideal_network' on high-fanout resets?",
    shortSummary: "Inspect the transition growth column in report_timing: steady sharp transitions mean logic depth bottleneck; ballooning slews mean DRV/load bottleneck. set_ideal_network on resets masks real buffer trees.",
    detailedAnswer: `### 1. Proving DRV/Slew Bottleneck vs Logic Depth:
1. **Transition Column Inspection in \`report_timing\`**:
   - Run \`report_timing -path_type full_clock\`.
   - **Case A: Pure Logic Depth**: Transitions stay sharp ($20 - 40\\,\\text{ps}$) across 30 consecutive gate levels. The cell delays are minimal ($15\\,\\text{ps}$ each), but cumulative delay exceeds the clock period.
     $\\rightarrow$ **Resolution**: Architectural pipelining, retiming, or boolean factoring.
   - **Case B: DRV / Slew Limited**: The path has only 4 logic levels, but transition balloons from $30\\,\\text{ps} \\rightarrow 450\\,\\text{ps}$ at an underdriven high-fanout net. The single stage delay explodes to $600\\,\\text{ps}$.
     $\\rightarrow$ **Resolution**: Gate sizing, repeater buffer tree insertion, or fanout splitting.
2. **Quantitative Verification**:
   - Run \`report_constraint -max_transition\` and \`report_delay_calculation -from pinA -to pinB\`.
   - If upsizing the driver or fixing max transition recovers $80\\%$ of the negative slack, the path was conclusively DRV-limited.

### 2. The Risk of 'set_ideal_network' on High-Fanout Resets:
- Applying \`set_ideal_network\` on an asynchronous reset port instructs Genus to treat the net as having **infinite drive strength and zero propagation delay**.
- **The Tapeout Risk**:
  - In reality, a chip reset drives 50,000 flip-flops.
  - In synthesis, the tool inserts **zero buffers**.
  - During PnR in Innovus, the tool must suddenly construct a massive reset buffer tree across the entire die, disrupting placed data paths, increasing routing congestion, and shifting power grid resistance.
  - Resets must be handled through dedicated CTS-style trees or budgeted tree latency, not left as ideal networks into signoff.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Audit DRV violations in Genus:
report_constraint -drv
report_constraint -max_transition
report_constraint -max_capacitance

# 2. Detailed Arc Delay Calculation:
report_delay_calculation -from [get_db pins u_core/u_alu/out] -to [get_db pins u_core/u_reg/d]

# 3. Check for high fanout nets:
report_nets -min_fanout 50 -sort fanout`,
    },
    commonPitfalls: [
      "Pipelining RTL when the actual problem is a single high-fanout net with 500 ps slew.",
      "Leaving set_ideal_network active during handoff to Innovus.",
    ],
    interviewerFollowups: [
      "Why does a slow slew on a clock pin increase the internal setup time (T_setup) requirement of a flip-flop?",
    ],
    tags: ["slew-drv", "logic-depth", "ideal-network", "fanout", "delay-calculation"],
  },

  {
    id: "syn-11",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Hiring Manager Round",
    question: "As a Principal Synthesis & STA Lead on a 3nm/5nm tapeout with CCS libraries, AOCV/SOCV, and MMMC, outline your complete tapeout-readiness checklist and correlation plan between Genus and Tempus.",
    shortSummary: "A 10-point rigorous signoff gate: clean structural checks, formal LEC verification, unconstrained endpoint audit, physical tie cells, and multi-corner Genus-Tempus correlation.",
    detailedAnswer: `### 1. The 10-Point Tapeout Handoff Checklist:
1. **Zero Unresolved References & Zero Multiple Drivers**:
   \`check_design -unresolved\` and \`check_design -multiple_driver\` must return exactly 0 errors.
2. **Formal Logic Equivalence (LEC)**:
   Pass 100% equivalence comparison between Golden RTL and Final Gate-Level Netlist in Cadence Conformal LEC (\`write_hdl -lec\`).
3. **Zero Unconstrained Functional Endpoints**:
   \`report_timing -unconstrained\` must be completely clean; all sequential registers and ports must be clocked.
4. **Physical Tie Cells Instantiated**:
   All logical constants replaced with foundry TIEHI / TIELO standard cells with fanout $\\le 8$ (\`check_design -through_tie_cell\`).
5. **Verilog Assign Statements Purged**:
   \`check_design -assigns\` clean; all structural wire assignments buffered to prevent shorting in PnR.
6. **SDC Port & Clock Name Consistency**:
   All clocks created on physical ports or valid internal divider pins verified with \`report_clocks\`.
7. **Timing Exceptions Audit**:
   Every \`set_false_path\` and \`set_multicycle_path\` documented with an architectural owner and signoff waiver ID.
8. **DFT Scan Constraints Delivered**:
   Test mode SDC delivered with shift and capture clock definitions for at-speed transition and stuck-at ATPG.
9. **Liberty & LEF Physical Consistency**:
   \`check_design -lib_lef_consistency\` verified so pin geometries match timing arc definitions.
10. **Genus vs Tempus STA Correlation**:
    Ensure the synthesis netlist timed in Tempus Signoff STA exhibits $\\le 3\\%$ WNS/TNS delta against Genus under identical MMMC views and CCS noise models.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Final Netlist & SDC Handoff Generation in Genus:
write_hdl > outputs/chip_top_mapped.v
write_sdc > outputs/chip_top_signoff.sdc
write_db -common -design chip_top outputs/chip_top_common.db

# Conformal LEC Golden Setup Generation:
write_design -innovus -base_name outputs/chip_top_innovus`,
    },
    commonPitfalls: [
      "Failing to run Conformal LEC between RTL and post-synthesis gate netlist.",
      "Relying solely on single-corner synthesis when physical signoff requires 16+ MMMC views.",
    ],
    interviewerFollowups: [
      "How do you manage Advanced OCV (AOCV) and Parametric OCV (POCV) stage-based derate tables during synthesis versus signoff STA?",
      "If Tempus reports a 150 ps WNS violation that Genus reported as met, what are the first three physical parameters you compare?",
    ],
    tags: ["tapeout-checklist", "genus-tempus", "lec-conformal", "signoff-sta", "mmmc"],
  },

  // 🟣 DOMAIN: CLOCK DOMAIN CROSSING (CDC) & METASTABILITY (10+ Year Depth)
  {
    id: "cdc-01",
    isFreeSample: true,
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing",
    role: "Senior RTL-to-GDS / CDC & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Why is instantiating an array of individual 2-FF synchronizers (e.g. 8x 2-FF) on an 8-bit data bus an illegal architectural hazard? Derive the MTBF (Mean Time Between Failures) formula for a 2-FF synchronizer and explain how clock frequency and resolution time affect it.",
    shortSummary: "Multi-bit buses suffer from reconvergence skew across individual bit synchronizers, corrupting intermediate data words. MTBF scales exponentially with resolution time and inversely with clock frequency.",
    detailedAnswer: `### 1. The Multi-Bit Reconvergence Disaster:
- When an 8-bit data bus transitions between asynchronous clock domains (e.g. from \`8'h00\` ($00000000_2$) to \`8'hFF\` ($11111111_2$)), routing wire lengths and standard cell delays differ slightly across parallel paths (inter-bit skew $\\Delta t$).
- If 8 separate 2-FF synchronizers are placed on each bit line:
  - Some bits arrive before the destination capture clock edge and resolve in 1 cycle.
  - Other bits arrive inside the setup/hold window, go metastable, or resolve in 2 cycles.
- **The Result**: The receiving logic samples intermediate phantom values such as \`8'h0F\`, \`8'h70\`, or \`8'hA5\` that were **never generated by the transmitter**!
- **Cadence JasperGold CDC Signoff Rule**: *Never use independent bit synchronizers for data buses. Multi-bit CDC requires coordinated synchronization protocols: 4-phase Req/Ack handshake, 2-phase toggle handshake, or Asynchronous FIFO with Gray-coded pointers.*

### 2. Mathematical MTBF Derivation for 2-FF Synchronizer:
Metastability failure occurs when the first flip-flop ($FF_1$) fails to resolve to a valid logic level within the available settling time ($t_{\\text{resolve}}$):

1. **Probability of Entering Metastability**:
   $$P_{\\text{meta}} = T_0 \\cdot f_{\\text{data}}$$
   where $T_0$ is the aperture/metastability window of the flip-flop and $f_{\\text{data}}$ is the asynchronous data transition frequency.

2. **Probability of Latching Invalid Level After Resolution Time**:
   $$P(t > t_{\\text{resolve}}) = e^{-t_{\\text{resolve}} / \\tau}$$
   where $\\tau$ is the bistable latch regeneration time constant ($RC$ speed of cross-coupled inverters).

3. **Available Resolution Time ($t_{\\text{resolve}}$)**:
   For a 2-FF synchronizer with destination clock period $T_{\\text{clk}}$:
   $$t_{\\text{resolve}} = T_{\\text{clk}} - T_{\\text{cq}} - T_{\\text{setup}}$$

4. **Mean Time Between Failures (MTBF)**:
   $$\\text{Failure Rate} = \\lambda = f_{\\text{clk}} \\cdot P_{\\text{meta}} \\cdot P(t > t_{\\text{resolve}}) = f_{\\text{clk}} \\cdot T_0 \\cdot f_{\\text{data}} \\cdot e^{-t_{\\text{resolve}} / \\tau}$$
   $$\\mathbf{\\text{MTBF} = \\frac{1}{\\lambda} = \\frac{e^{t_{\\text{resolve}} / \\tau}}{T_0 \\cdot f_{\\text{clk}} \\cdot f_{\\text{data}}}}$$

### 3. Key Takeaways:
- **Higher Clock Frequency ($f_{\\text{clk}}$) Degrades MTBF Catastrophically**:
  Higher frequency shrinks $T_{\\text{clk}}$, reducing $t_{\\text{resolve}}$ in the exponent, causing MTBF to collapse from thousands of years down to minutes!
- **3-FF Solution**: Adding a 3rd synchronizer stage increases available resolution time to $t_{\\text{resolve}} = 2 \\cdot T_{\\text{clk}} - T_{\\text{margins}}$, boosting MTBF by factors of $10^6$.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Cadence JasperGold CDC Lint Verification:
check_cdc -init
check_cdc -clock [get_ports clk_a] -period 5.0
check_cdc -clock [get_ports clk_b] -period 6.66
check_cdc -asynchronous -clock_a [get_ports clk_a] -clock_b [get_ports clk_b]

# Detect Multi-Bit Reconvergence & Unsynchronized Crossings:
check_cdc -rule {CDC_Reconvergence CDC_Sync_MultiBit CDC_Glitch}
report_cdc -violations > reports/jasper_cdc_violations.rpt`,
    },
    commonPitfalls: [
      "Instantiating 2-FF synchronizers on multi-bit buses.",
      "Assuming MTBF increases with higher clock frequency.",
    ],
    interviewerFollowups: [
      "How do placement keep-out halos and set_dont_touch prevent PnR tools from pulling 2-FF synchronizer stages apart?",
      "Why must the input to the first synchronizer flip-flop come directly from a registered output in domain A without combinational logic?",
    ],
    tags: ["cdc", "mtbf-derivation", "reconvergence", "metastability", "jaspergold"],
  },

  {
    id: "cdc-02",
    isFreeSample: true,
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing",
    role: "Senior RTL-to-GDS / CDC & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "A 1-cycle control pulse generated in a 1 GHz clock domain must be detected in a 100 MHz clock domain. Why will a simple 2-FF level synchronizer fail? Design and write the RTL for a Toggle-based Pulse Synchronizer, and explain how the destination recovers a single-cycle pulse.",
    shortSummary: "A 1 ns pulse in a 100 MHz domain will likely fall entirely between clock edges and be dropped. A toggle pulse synchronizer converts pulses to level transitions that persist until sampled.",
    detailedAnswer: `### 1. Why Level 2-FF Fails on Fast-to-Slow Crossings:
- Fast domain ($clk_a$): $1\\,\\text{GHz} \\implies T_{\\text{clk\\_a}} = 1.0\\,\\text{ns}$. A single-cycle pulse is high for only $1.0\\,\\text{ns}$.
- Slow domain ($clk_b$): $100\\,\\text{MHz} \\implies T_{\\text{clk\\_b}} = 10.0\\,\\text{ns}$.
- **The Sampling Theorem Criterion**: To guarantee that a destination clock domain will reliably sample an asynchronous pulse with a 2-FF synchronizer, the input pulse width $W_{\\text{pulse}}$ must satisfy:
  $$W_{\\text{pulse}} \\ge 1.5 \\times T_{\\text{clk\\_b}} + T_{\\text{setup}} + T_{\\text{hold}} = 15.0\\,\\text{ns} + \\text{margins}$$
- Because $1.0\\,\\text{ns} \\ll 15.0\\,\\text{ns}$, there is a **$>90\\%$ probability that the 1 ns pulse rises and falls between two consecutive 100 MHz clock edges**, resulting in total event loss!

### 2. The Toggle-Based Pulse Synchronizer Architecture:
To prevent pulse loss, the source domain converts every 1-cycle pulse into a **level toggle** that stays high or low indefinitely until the next event:
1. **Source Domain ($clk_a$)**:
   $$\\text{toggle\\_a} \\Leftarrow \\text{toggle\\_a} \\oplus \\text{pulse\\_in}$$
2. **CDC Crossing**:
   Pass $\\text{toggle\\_a}$ through a standard 2-FF synchronizer clocked by $clk_b$.
3. **Destination Domain ($clk_b$)**:
   Pass the synchronized signal through a delay flop ($\\text{sync\\_d}$) and perform an XOR edge-detector:
   $$\\text{pulse\\_out\\_b} = \\text{sync\\_b} \\oplus \\text{sync\\_d}$$
   Every transition ($0 \\rightarrow 1$ or $1 \\rightarrow 0$) regenerates exactly one clean 10 ns pulse in domain B!

### 3. Spacing Constraint:
- Consecutive pulses in domain A must be spaced by at least $2 \\times T_{\\text{clk\\_b}}$ ($20\\,\\text{ns}$) to prevent subsequent toggles from overwriting an ongoing crossing. For back-to-back pulses, use an Asynchronous FIFO.`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `module sync_pulse (
  input  wire clk_a,
  input  wire rst_n_a,
  input  wire pulse_a,
  input  wire clk_b,
  input  wire rst_n_b,
  output wire pulse_b
);

  // 1. Source Domain: Pulse-to-Toggle
  reg toggle_a;
  always @(posedge clk_a or negedge rst_n_a) begin
    if (!rst_n_a) toggle_a <= 1'b0;
    else if (pulse_a) toggle_a <= ~toggle_a;
  end

  // 2. Destination Domain: 2-FF Synchronizer
  reg sync_b0, sync_b1, sync_b2;
  always @(posedge clk_b or negedge rst_n_b) begin
    if (!rst_n_b) begin
      sync_b0 <= 1'b0;
      sync_b1 <= 1'b0;
      sync_b2 <= 1'b0;
    end else begin
      sync_b0 <= toggle_a;
      sync_b1 <= sync_b0;
      sync_b2 <= sync_b1; // Delay stage for edge detection
    end
  end

  // 3. Destination Domain: XOR Edge Detector
  assign pulse_b = sync_b1 ^ sync_b2;

endmodule`,
    },
    commonPitfalls: [
      "Passing pulses directly through a 2-FF synchronizer across fast-to-slow clock domains.",
      "Firing consecutive pulses faster than 2 destination clock periods without a handshake or FIFO.",
    ],
    interviewerFollowups: [
      "How would you modify this circuit to provide a busy or acknowledge flag back to domain A?",
      "Why must the toggle register output be directly routed to the 2-FF synchronizer without combinational gates?",
    ],
    tags: ["pulse-cdc", "toggle-synchronizer", "fast-to-slow", "verilog", "sampling-theorem"],
  },

  {
    id: "cdc-03",
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing",
    role: "Senior RTL-to-GDS / CDC & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Why does deasserting an asynchronous reset signal asynchronously cause catastrophic metastability and state machine lockup? Draw the circuit and write the Verilog for a Reset Synchronizer Bridge (Async Assert, Sync Deassert).",
    shortSummary: "Asynchronous reset deassertion violates recovery/removal timing, causing some flops to exit reset on clock edge N while others exit on edge N+1. The reset bridge synchronizes reset release to the clock edge.",
    detailedAnswer: `### 1. The Asynchronous Deassertion Race Condition:
- **Asynchronous Assertion is Safe**: When power fails or an external reset button is pressed, asserting reset asynchronously forces all flip-flops to zero immediately ($0\\,\\text{ps}$ delay), which is desired.
- **Asynchronous Deassertion is Catastrophic**:
  - Releasing reset asynchronously ($0 \\rightarrow 1$) can occur at the exact instant the active clock edge arrives.
  - This violates two critical STA timing checks:
    1. **Recovery Time ($T_{\\text{recovery}}$)**: The minimum time the reset line must be deasserted *before* the active clock edge.
    2. **Removal Time ($T_{\\text{removal}}$)**: The minimum time the reset line must remain asserted *after* the active clock edge.
  - Across a 100,000-gate design, clock skew and reset tree propagation delays differ. Some flip-flops will exit reset on **clock cycle $N$**, while others will exit reset on **clock cycle $N+1$**!
  - In a One-Hot State Machine, this causes illegal states ($0000$ or $0101$) that permanently freeze the processor or bus arbiter!

### 2. The Reset Synchronizer Bridge Architecture:
- **"Asynchronous Assert, Synchronous Deassert"**:
  - Reset asserting immediately pulls the reset output low asynchronously.
  - Reset deasserting propagates through a 2-FF shift register tied to \`1'b1\`, guaranteeing that the output deasserts cleanly aligned with the clock edge, completely satisfying Recovery/Removal timing!`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// Reset Synchronizer Bridge: Asynchronous Assert, Synchronous Deassert
module reset_synchronizer (
  input  wire clk,
  input  wire async_rst_n, // External asynchronous reset (active-low)
  output wire sync_rst_n   // Domain-synchronized reset output
);

  reg rst_meta_n;
  reg rst_sync_n;

  always @(posedge clk or negedge async_rst_n) begin
    if (!async_rst_n) begin
      rst_meta_n <= 1'b0; // Asynchronous assertion: instant 0
      rst_sync_n <= 1'b0;
    end else begin
      rst_meta_n <= 1'b1; // Synchronous deassertion: clocked release
      rst_sync_n <= rst_meta_n;
    end
  end

  assign sync_rst_n = rst_sync_n;

endmodule

// Cadence SDC Reset Constraint:
// set_false_path -from [get_ports async_rst_n] ;# Valid for assert only
// Recovery and Removal checks on sync_rst_n remain active for signoff STA!`,
    },
    commonPitfalls: [
      "Deasserting reset asynchronously into complex FSMs.",
      "Applying set_false_path to the synchronized reset net, disabling recovery/removal checks.",
    ],
    interviewerFollowups: [
      "In a multi-clock SoC, why must each clock domain have its own dedicated reset synchronizer bridge?",
      "What is the difference between Recovery time and Setup time in timing library arc definitions?",
    ],
    tags: ["reset-synchronizer", "recovery-removal", "rdc", "fsm-corruption", "verilog"],
  },

  {
    id: "cdc-04",
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Explain the precise functional differences between 'set_clock_groups -asynchronous', '-logically_exclusive', and '-physically_exclusive' in Cadence Genus. What is your verification script to prove that zero unconstrained or illegal cross-domain timing paths remain?",
    shortSummary: "-asynchronous disables timing between concurrent independent clocks; -logically_exclusive disables paths between modes that cannot be active simultaneously; -physically_exclusive is for multiplexed single-pin clocks.",
    detailedAnswer: `### 1. Functional Differences in SDC Clock Grouping:
1. **\`set_clock_groups -asynchronous\`**:
   - **Physics**: Both clock domains operate **simultaneously in silicon**, but they have no known, fixed phase relationship (e.g. independent crystal oscillators or separate PLLs).
   - **STA Treatment**: Completely disables inter-clock setup and hold timing checks in both directions.
   - **Engineering Prerequisite**: Requires physical synchronizers (2-FF, FIFO, handshake) in RTL.
2. **\`set_clock_groups -logically_exclusive\`**:
   - **Physics**: Both clocks exist on the chip, but **functional multiplexer selection or operating modes** guarantee they can never interact simultaneously in the same operational state.
   - **Example**: Functional system clock (\`SYS_CLK\`) vs at-speed scan test clock (\`SCAN_CLK\`).
   - **STA Treatment**: Disables cross-clock paths between the groups, but crosstalk and SI analysis may still analyze capacitive coupling effects because both lines can be physically routed adjacent to each other.
3. **\`set_clock_groups -physically_exclusive\`**:
   - **Physics**: It is physically impossible for both clocks to exist on the silicon at the same time.
   - **Example**: A single external test pad driven by either a $25\\,\\text{MHz}$ crystal or an external $100\\,\\text{MHz}$ tester pin.
   - **STA Treatment**: Disables all cross-timing and eliminates crosstalk coupling between the exclusive sources.

### 2. Verification Script for Zero Illegal Cross-Domain Paths:
After declaring clock groups, you must verify that no unintended cross-domain paths are left unconstrained or improperly timed.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Cadence Genus Common UI Clock Group Verification:
# 1. Define clocks
create_clock -name CLK_A -period 5.0 [get_ports clk_a]
create_clock -name CLK_B -period 6.66 [get_ports clk_b]

# 2. Set Asynchronous relationship
set_clock_groups -asynchronous -name async_ab \\
  -group [get_clocks CLK_A] \\
  -group [get_clocks CLK_B]

# 3. Verify Clock Group definitions:
report_clock_groups

# 4. Prove no timed setup paths remain between domains:
report_timing -from [get_clocks CLK_A] -to [get_clocks CLK_B] -max_paths 20
report_timing -from [get_clocks CLK_B] -to [get_clocks CLK_A] -max_paths 20

# 5. Audit for unconstrained endpoints:
check_timing
report_timing -unconstrained -max_paths 50`,
    },
    commonPitfalls: [
      "Using -asynchronous on a muxed single clock net — use -physically_exclusive when only one waveform exists electrically on that pin/net (see also clk-02).",
      "Using -logically_exclusive for true async domains (wrong SI / exception semantics).",
      "Forgetting to check both directions (A->B and B->A) when auditing cross-domain timing.",
    ],
    interviewerFollowups: [
      "What happens if you omit set_clock_groups between two asynchronous clocks in Genus synthesis?",
      "Why should generated clocks derived from a common master PLL NOT be marked asynchronous to the master?",
    ],
    tags: ["genus", "sdc", "clock-groups", "asynchronous", "physically-exclusive", "logically-exclusive"],
  },

  {
    id: "cdc-05",
    domain: "clock-domain-crossing",
    domainName: "Clock Domain Crossing",
    role: "Senior RTL-to-GDS / CDC & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "In a Dual-Clock Asynchronous FIFO, why are write and read pointers converted to Gray code before 2-FF synchronization? Why must pointer widths be N+1 bits for an N-bit FIFO address depth? Derive the Full and Empty condition equations.",
    shortSummary: "Gray code guarantees that exactly 1 bit changes per pointer increment, preventing multi-bit bus incoherency. An extra MSB distinguishes between Full and Empty states when pointers match.",
    detailedAnswer: `### 1. Why Gray Code is Mandatory for Pointer Synchronization:
- In binary counting, multiple bits toggle simultaneously (e.g. from $7$ ($0111_2$) to $8$ ($1000_2$), all 4 bits flip).
- If an asynchronous sampling edge captures binary pointers mid-transition, destination flops may latch illegal intermediate values (e.g. $0000$ or $1111$), causing false FIFO Full or Empty assertions.
- **The Gray Code Invariant**: Gray code guarantees a **Hamming distance of exactly 1** ($H(G_i, G_{i+1}) = 1$): only one bit changes per clock cycle.
- **Worst-Case Metastability in Gray Code**: If the single changing bit goes metastable, it will either resolve to the old pointer value ($G_i$) or the new pointer value ($G_{i+1}$). Both states are safe:
  - If it resolves to $G_i$, the FIFO simply believes write/read is delayed by 1 cycle (pessimistic, but 100% functional).
  - It **never** creates an invalid pointer value!

### 2. Why Pointer Width Must Be $N+1$ Bits (Extra MSB):
- For a FIFO with depth $2^N$ (address width $N$ bits):
  - When the FIFO is **Empty**, write pointer has caught up to read pointer: $\\text{wptr} == \\text{rptr}$.
  - When the FIFO is **Full**, the write pointer has written $2^N$ words and wrapped around: $\\text{wptr} == \\text{rptr}$!
- Without an extra bit, Full and Empty conditions are identical.
- By sizing pointers to $N+1$ bits:
  - The MSB indicates the wrap-around phase.

### 3. Deriving Full and Empty Conditions:
1. **Binary-to-Gray Conversion**:
   $$G = B \\oplus (B \\gg 1)$$

2. **FIFO Empty Condition (Evaluated in Read Clock Domain)**:
   $$\\mathbf{\\text{FIFO\\_Empty} = (G_{\\text{rptr}} == G_{\\text{wptr\\_sync}})}$$
   The synchronized write pointer matches the current read pointer in all $N+1$ bits.

3. **FIFO Full Condition (Evaluated in Write Clock Domain)**:
   The write pointer has wrapped around exactly once ahead of the synchronized read pointer:
   - The top two MSBs are **inverted** ($G_{\\text{wptr}}[N:N-1] == \\sim G_{\\text{rptr\\_sync}}[N:N-1]$).
   - All remaining LSBs are **identical** ($G_{\\text{wptr}}[N-2:0] == G_{\\text{rptr\\_sync}}[N-2:0]$):
   $$\\mathbf{\\text{FIFO\\_Full} = \\left(G_{\\text{wptr}} == \\{\\sim G_{\\text{rptr\\_sync}}[N:N-1], G_{\\text{rptr\\_sync}}[N-2:0]\\}\\right)}$$`,
    tclOrVerilogSnippet: {
      lang: "verilog",
      code: `// Dual-Clock Asynchronous FIFO Pointer Logic:
module async_fifo_ptrs #(parameter ADDR_WIDTH = 4) (
  input  wire [ADDR_WIDTH:0] b_wptr,
  input  wire [ADDR_WIDTH:0] g_rptr_sync,
  output wire fifo_full
);

  // Binary to Gray conversion:
  wire [ADDR_WIDTH:0] g_wptr = b_wptr ^ (b_wptr >> 1);

  // Full condition: Top 2 MSBs inverted, remaining LSBs identical:
  assign fifo_full = (g_wptr == {~g_rptr_sync[ADDR_WIDTH:ADDR_WIDTH-1],
                                  g_rptr_sync[ADDR_WIDTH-2:0]});

endmodule`,
    },
    commonPitfalls: [
      "Inverting only the single top MSB in Gray code Full condition instead of the top 2 MSBs.",
      "Attempting to evaluate FIFO Full in the read domain or FIFO Empty in the write domain.",
    ],
    interviewerFollowups: [
      "Why is Gray-to-Binary conversion postponed until after the 2-FF synchronizer in the destination domain?",
      "How do you design an Asynchronous FIFO whose depth is not a power of 2 (e.g. depth 10)?",
    ],
    tags: ["async-fifo", "gray-code", "fifo-full", "fifo-empty", "dual-clock"],
  },

  // 🕒 DOMAIN: SDC CLOCKS ARCHITECTURE (Complete User Guide & Signoff)
  {
    id: "clk-01",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Why must hardware clock dividers and PLL outputs be modeled with 'create_generated_clock' rather than a separate 'create_clock'? Explain the mathematical difference in launch/capture edge calculation, source latency propagation, and how '-edges' solves non-50% duty or phase-shifted relationships.",
    shortSummary: "create_generated_clock maintains the phase relationship, edge alignment, and source insertion latency of the master clock. A root create_clock destroys phase alignment, resetting source latency to zero and causing catastrophic false STA passes or violations.",
    detailedAnswer: `### 1. Mathematical Breakdown: Why Generated Clocks are Mandatory
When a flip-flop or PLL derives a secondary clock from an on-chip master clock $CLK_{\\text{master}}$ (period $T$):
1. **Edge Alignment & Phase Coherency**:
   - For a divide-by-2 circuit, the generated period is $2T$.
   - With \`create_generated_clock -divide_by 2\`, the STA engine maps the generated rising edge directly to master rising edges:
     $$\\text{Gen Edge 1} \\leftrightarrow \\text{Master Edge 1}, \\quad \\text{Gen Edge 2} \\leftrightarrow \\text{Master Edge 3}$$
   - Any path between the master domain and the divided domain has a **deterministic 1-cycle or multi-cycle phase budget**.
2. **The Disaster of 'create_clock' on Downstream Pins**:
   - If an engineer defines \`create_clock -period 4.0 [get_pins u_div/Q]\`, STA treats this as an **independent root oscillator**.
   - **Source Latency Reset**: The delay from the primary pad through the master clock tree to the divider pin ($T_{\\text{master\\_tree}}$) is **discarded**! The tool assumes $T_{\\text{latency}} = 0$ at the divider pin.
   - **False Clock Domain Crossing**: The tool either analyzes master-to-divider paths with artificial worst-case beat frequencies (generating massive false timing violations) or requires an engineer to mistakenly mark them \`-asynchronous\`, masking silicon hold races!

### 2. Generated Clock Methods Comparison:
| Option | Period Formulation | When Required |
|---|---|---|
| **\`-divide_by N\`** | $T_{\\text{gen}} = N \\cdot T_{\\text{master}}$ | Hardware toggle flip-flops, counter dividers (/2, /3, /4). |
| **\`-multiply_by M\`** | $T_{\\text{gen}} = T_{\\text{master}} / M$ | PLL / FLL frequency multipliers; high-speed SerDes clocks. Requires \`-duty_cycle\` (e.g. 50.0). |
| **\`-edges {e1 e2 e3}\`** | Exact edge index mapping | Non-integer ratios, 90° quadrature phase clocks, asymmetrical duty cycles. |
| **\`-combinational\`** | $T_{\\text{gen}} = T_{\\text{master}}$ | Includes combinational gate propagation delay from master source to output pin in clock latency. |

### 3. Non-Trivial Edge Mapping with \`-edges\` and \`-edge_shift\`:
To create a divide-by-2 clock with a 90° phase shift from a master clock with period $T = 4\\,\\text{ns}$ (edges at 0 ns, 2 ns, 4 ns, 6 ns):
$$\\text{Rising edge at Master Edge 1 } (0\\,\\text{ns}) + 1.0\\,\\text{ns shift}$$
$$\\text{Falling edge at Master Edge 3 } (4\\,\\text{ns}) + 1.0\\,\\text{ns shift}$$
$$\\text{Next Rising edge at Master Edge 5 } (8\\,\\text{ns}) + 1.0\\,\\text{ns shift}$$`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Master Root Clock (500 MHz / 2.0 ns period):
create_clock -name CLK_CORE -period 2.000 -waveform {0.0 1.0} [get_ports pad_clk]

# 2. Divide-by-2 Generated Clock on Divider Flop Q:
create_generated_clock -name CLK_DIV2 \
  -source [get_ports pad_clk] \
  -divide_by 2 \
  [get_pins u_clkdiv/q_reg/Q]

# 3. PLL 4x Multiplier with 50% Duty Cycle:
create_generated_clock -name CLK_FAST \
  -source [get_ports pad_clk] \
  -multiply_by 4 \
  -duty_cycle 50.0 \
  [get_pins u_pll/clk_out]

# 4. Arbitrary Phase Shift using -edges and -edge_shift:
create_generated_clock -name CLK_QUAD_90 \
  -source [get_ports pad_clk] \
  -edges {1 3 5} \
  -edge_shift {0.5 0.5 0.5} \
  [get_pins u_phase/clk_out_90]`,
    },
    commonPitfalls: [
      "Defining 'create_clock' on divider output pins, which resets source insertion latency to zero.",
      "Marking synchronous master and generated clocks as 'set_clock_groups -asynchronous'.",
      "Forgetting '-duty_cycle' when modeling PLL frequency multiplication.",
    ],
    interviewerFollowups: [
      "How does Genus handle source latency calculation when the master clock network undergoes post-CTS clock tree propagation?",
      "When is the '-combinational' flag strictly required on a generated clock?",
    ],
    tags: ["generated-clocks", "create-generated-clock", "divide-by", "multiply-by", "edges", "sdc"],
  },

  {
    id: "clk-02",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "In a dynamic clock-multiplexed SoC where a single internal clock net can be driven by either a 500 MHz Functional PLL ('CLK_A') or a 100 MHz Test Oscillator ('CLK_B'), how do you write the SDC constraints using '-add' and '-master_clock'? Why is 'set_clock_groups -physically_exclusive' required instead of '-logically_exclusive' or '-asynchronous'?",
    shortSummary: "Without '-add', the second clock definition overwrites the first. At the multiplexer output, '-physically_exclusive' models physical signal exclusivity where only one electrical clock exists on the wire at a time.",
    detailedAnswer: `### 1. The Clock Multiplexer Constraint Challenge:
When two independent clocks converge at a 2-to-1 clock multiplexer (\`u_mux/Y\`), downstream flip-flops must be timed under both clock frequencies:
1. **The Overwrite Trap**:
   If an engineer runs:
   \`create_generated_clock -name CLK_MUX_A ... [get_pins u_mux/Y]\`
   followed by:
   \`create_generated_clock -name CLK_MUX_B ... [get_pins u_mux/Y]\`
   The second command **destroys and overwrites** \`CLK_MUX_A\`! The \`-add\` switch is mandatory to attach multiple clock waveforms to a single physical pin.
2. **The Disambiguation Switch (\`-master_clock\`)**:
   Because both \`CLK_A\` and \`CLK_B\` reach the multiplexer inputs, the tool cannot guess which source clock drives which generated definition. \`-master_clock\` explicitly resolves this ambiguity.

### 2. Physical Exclusivity vs Logical Exclusivity vs Asynchronous:
| Relationship | Silicon Reality | STA Mechanism | Correct for Mux? |
|---|---|---|---|
| **\`-physically_exclusive\`** | Only **one** electrical waveform physically exists on the wire at any point in time. | Eliminates cross-clock paths between the two generated clocks at the mux output pin. | **YES (Exact Match)** |
| **\`-logically_exclusive\`** | Both clocks exist concurrently on-chip, but operational modes (FSM state, test mode) ensure they never interact functionally. | Disables timing checks between the two domains. | Acceptable for mode muxes, but does not capture physical net exclusivity. |
| **\`-asynchronous\`** | Both clocks run simultaneously in silicon with independent free-running phases. | Disables normal synchronous checks; implies CDC hardware is required. | **NO (False CDC)**. Downstream flops share the exact same physical clock net! |`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Define Primary Root Clocks:
create_clock -name CLK_FUNC -period 2.000 [get_ports clk_func_in]
create_clock -name CLK_TEST -period 10.000 [get_ports clk_test_in]

# 2. Define Generated Clocks on Multiplexer Output with -add:
create_generated_clock -name CLK_MUX_FUNC \
  -source [get_ports clk_func_in] \
  -master_clock CLK_FUNC \
  -divide_by 1 \
  -add \
  [get_pins u_clk_mux/Y]

create_generated_clock -name CLK_MUX_TEST \
  -source [get_ports clk_test_in] \
  -master_clock CLK_TEST \
  -divide_by 1 \
  -add \
  [get_pins u_clk_mux/Y]

# 3. Assert Physical Exclusivity:
set_clock_groups -name MUX_CLK_EXCL -physically_exclusive \
  -group [get_clocks CLK_MUX_FUNC] \
  -group [get_clocks CLK_MUX_TEST]

# 4. Optional Case Analysis for Single-Mode Verification:
# set_case_analysis 0 [get_ports test_mode_sel]`,
    },
    commonPitfalls: [
      "Omitting '-add', causing the second clock definition to silently overwrite the first.",
      "Using '-asynchronous' on clock mux outputs, falsely treating shared clock networks as asynchronous CDC domains.",
      "Omitting '-master_clock' when the source pin carries multiple clock definitions.",
    ],
    interviewerFollowups: [
      "What happens if clock multiplexer select switching induces dynamic glitches on downstream registers?",
      "How does 'set_case_analysis' interact with physically exclusive clock groups during Multi-Mode Multi-Corner (MMMC) timing analysis?",
    ],
    tags: ["clock-mux", "set-clock-groups", "physically-exclusive", "add-clock", "master-clock"],
  },

  {
    id: "clk-03",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "What is a Virtual Clock in SDC, and when should you prefer it over referencing the on-chip root clock in 'set_input_delay' / 'set_output_delay' for source-synchronous and system-synchronous I/O? Derive the setup and hold budget formulas.",
    shortSummary: "A virtual clock models external board transmission without binding to an on-chip pin — best practice for clean I/O budgets. Using the on-chip root clock can work for simple system-synchronous cases if source latency is modeled carefully, but it easily entangles board timing with CTS insertion delay, capture skew, and CPPR.",
    detailedAnswer: `### 1. What is a Virtual Clock?
A **Virtual Clock** is defined in SDC with a period and waveform, but **without specifying a source port or pin**:
\`create_clock -name VCLK_EXT -period 5.0 -waveform {0.0 2.5}\`
It serves as an idealized reference clock representing the external transmitter or receiver chip on the PCB.

### 2. Why Referencing On-Chip Clocks for Board I/O Breaks Clean Closure:
Consider an input port \`data_in\` constrained with:
\`set_input_delay 2.0 -clock [get_clocks CLK_CORE] [get_ports data_in]\`
1. **Pre-CTS (Ideal Clock)**:
   The tool assumes \`CLK_CORE\` arrives at time $t = 0.0\\,\\text{ns}$. Interface delays appear balanced against the ideal root clock.
2. **Post-CTS (Propagated Clock Reality)**:
   During Clock Tree Synthesis, the internal clock tree develops insertion delay and skew ($T_{\\text{latency}} = 1.8\\,\\text{ns}$) from the clock pad to capturing flip-flops.
   - For source-synchronous and external board interfaces, referencing an internal clock confuses the STA reference frame: capture clock path latency, Common Path Pessimism Removal (CPPR), and source latency differences alter the effective setup/hold requirement in unintended ways.
   - For system-synchronous I/O, board trace delays and external clock flight times must be referenced to the board clock plane. A dedicated **Virtual Clock (\`VCLK_EXT\`)** isolates external PCB delays ($T_{\\text{co,ext}}$, board flight time) from on-chip clock tree buffer insertion delays and derates.

### 3. Mathematical Formulation of I/O Budgets with Virtual Clocks:
Let $T_{\\text{period}}$ be the bus cycle time, $T_{\\text{co,ext}}$ be external chip clock-to-Q, $T_{\\text{pcb,data}}$ be board trace delay, and $T_{\\text{pcb,clk}}$ be board clock delay:
- **Maximum Input Delay (Setup Analysis)**:
  $$\\mathbf{\\text{Input Delay}_{\\text{max}} = T_{\\text{co,ext}}^{\\text{max}} + T_{\\text{pcb,data}}^{\\text{max}} - T_{\\text{pcb,clk}}^{\\text{min}}}$$
- **Minimum Input Delay (Hold Analysis)**:
  $$\\mathbf{\\text{Input Delay}_{\\text{min}} = T_{\\text{co,ext}}^{\\text{min}} + T_{\\text{pcb,data}}^{\\text{min}} - T_{\\text{pcb,clk}}^{\\text{max}}}$$
By attaching this budget to **\`VCLK_EXT\`**, the external launch time remains completely independent of on-chip clock tree buffer insertion delay and capture skew.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Define On-Chip Master Clock:
create_clock -name CLK_CORE -period 5.000 [get_ports pad_clk]

# 2. Define Virtual Clock for External Board Transmitter:
create_clock -name VCLK_EXT -period 5.000

# 3. Model External Board Latency on Virtual Clock:
set_clock_latency -source 0.350 [get_clocks VCLK_EXT]
set_clock_uncertainty -setup 0.080 [get_clocks VCLK_EXT]

# 4. Budget External I/O Interfaces against Virtual Clock:
set_input_delay -clock VCLK_EXT -max 2.200 [get_ports pad_data_in*]
set_input_delay -clock VCLK_EXT -min 0.600 [get_ports pad_data_in*]

set_output_delay -clock VCLK_EXT -max 1.800 [get_ports pad_data_out*]
set_output_delay -clock VCLK_EXT -min -0.400 [get_ports pad_data_out*]`,
    },
    commonPitfalls: [
      "Mixing board flight-time budgets with on-chip propagated capture latency without a clear source-latency / virtual-clock reference — post-CTS I/O WNS then looks 'random'.",
      "Omitting negative output delays when the external receiving chip requires long hold times.",
      "Treating 'always use chip clock' or 'always use virtual clock' as dogma instead of matching the board timing diagram.",
    ],
    interviewerFollowups: [
      "How do you constrain a Source-Synchronous interface (like DDR4 or RGMII) where the clock and data are transmitted together?",
      "What is the impact of board-level clock jitter on the virtual clock uncertainty budget?",
    ],
    tags: ["virtual-clock", "set-input-delay", "set-output-delay", "io-timing", "board-latency"],
  },

  {
    id: "clk-04",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the exact chronological progression of clock network modeling from pre-synthesis RTL through post-CTS signoff STA. Differentiate between Source Latency, Network Latency, Clock Transition, and Clock Uncertainty, and prove how each parameter alters the Setup and Hold slack equations.",
    shortSummary: "Pre-CTS synthesis relies on ideal clocks with estimated network latency and transition. Post-CTS STA removes network latency in favor of propagated RC clock tree timing, while source latency and uncertainty remain active.",
    detailedAnswer: `### 1. Chronological Progression of Clock Modeling:
| Stage | Clock Network Model | Latency Representation | Clock Slew |
|---|---|---|---|
| **Pre-Synthesis & Logic Mapping (\`syn_generic\`)** | Ideal Network (Zero delay on clock net) | \`set_clock_latency\` (target CTS budget) | \`set_clock_transition\` (ideal target slew) |
| **Physical Placement & In-Place Opt (\`syn_opt\`)** | Ideal Clock with Estimated PLE / Wireload | Estimated insertion delay | Slew budgeted from target library |
| **Post-CTS & Signoff STA (\`Tempus\` / \`Innovus\`)** | **Propagated Clock** (\`set_propagated_clock\`) | Real extracted RC delay through clock buffers | Real calculated transition per pin |

### 2. Parameter Definitions:
1. **Source Latency (\`set_clock_latency -source\`)**:
   - Delay from the true physical oscillator source (crystal oscillator, off-chip board trace, internal PLL lock delay) to the chip clock input port.
   - **Persistent**: Remains valid both pre-CTS and post-CTS because it occurs outside the synthesis clock tree boundary.
2. **Network Latency (\`set_clock_latency\`)**:
   - Estimated delay from the chip input port to the clock pins of sequential registers.
   - **Pre-CTS Only**: Replaced post-CTS by actual propagated clock tree delays.
3. **Clock Uncertainty (\`set_clock_uncertainty\`)**:
   - Represents clock jitter, phase noise, duty-cycle distortion (DCD), and intentional design guardbands.
   - Directly shrinks setup and hold timing margins.
4. **Clock Transition (\`set_clock_transition\`)**:
   - Rise and fall time of the clock waveform. Steeper transitions reduce flip-flop internal clock-to-Q delays and dynamic power.

### 3. Mathematical Proof: Effect on Setup and Hold Slack:
Let $T_{\\text{period}}$ be cycle time, $T_{\\text{skew}} = T_{\\text{capture\\_clk}} - T_{\\text{launch\\_clk}}$, and $T_{\\text{comb}}$ be datapath delay:
- **Setup Slack**:
  $$\\mathbf{\\text{Slack}_{\\text{setup}} = (T_{\\text{period}} + T_{\\text{skew}}) - (T_{\\text{cq}} + T_{\\text{comb}} + T_{\\text{setup}} + T_{\\text{unc\\_setup}})}$$
  Increasing setup uncertainty directly subtracts from setup slack.
- **Hold Slack**:
  $$\\mathbf{\\text{Slack}_{\\text{hold}} = (T_{\\text{cq}} + T_{\\text{comb}}) - (T_{\\text{skew}} + T_{\\text{hold}} + T_{\\text{unc\\_hold}})}$$
  Increasing hold uncertainty directly increases the minimum required datapath delay.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Pre-CTS Clock Budgeting in Cadence Genus:
create_clock -name CLK_MAIN -period 2.000 [get_ports clk_in]

# 1. Source Latency (Off-chip board oscillator delay):
set_clock_latency -source -early 0.400 [get_clocks CLK_MAIN]
set_clock_latency -source -late  0.600 [get_clocks CLK_MAIN]

# 2. Target Network Latency (Pre-CTS clock tree estimate):
set_clock_latency 0.250 [get_clocks CLK_MAIN]

# 3. Target Clock Transition (Pre-CTS slew):
set_clock_transition -rise 0.050 [get_clocks CLK_MAIN]
set_clock_transition -fall 0.050 [get_clocks CLK_MAIN]

# 4. Clock Uncertainty (Jitter + Margin):
set_clock_uncertainty -setup 0.060 [get_clocks CLK_MAIN]
set_clock_uncertainty -hold  0.030 [get_clocks CLK_MAIN]

# Post-CTS Transition in Innovus / Tempus:
# set_propagated_clock [all_clocks]`,
    },
    commonPitfalls: [
      "Leaving ideal network latency active after CTS, which double-counts clock tree buffer delay against real propagated timing.",
      "Setting identical uncertainty for setup and hold (hold uncertainty should only reflect high-frequency cycle-to-cycle jitter, not full PLL wander).",
    ],
    interviewerFollowups: [
      "Why is hold uncertainty typically smaller than setup uncertainty?",
      "How does Common Path Pessimism Removal (CPPR) adjust clock latency differences between launch and capture clock trees?",
    ],
    tags: ["clock-latency", "clock-uncertainty", "ideal-clock", "propagated-clock", "clock-transition"],
  },

  {
    id: "clk-05",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "You inherit a complex multi-million gate SoC SDC constraint file. What is your systematic 15-minute diagnostic script and checklist in Cadence Genus to audit clock definitions, identify unclocked registers, catch false CDC grouping, and prove constraint completeness?",
    shortSummary: "A rigorous 5-step audit: 1) verify time units; 2) audit clock inventory & zero-sink clocks via report_clocks; 3) verify generated divider relationships; 4) audit async clock groups against RTL synchronizers; 5) run check_timing for unconstrained pins.",
    detailedAnswer: `### 1. The 15-Minute Principal SDC Audit Playbook:
When taking ownership of an unfamiliar SoC SDC constraint deck:

1. **Step 1: Units Sanity Audit (\`report_units\`)**:
   - Verify whether time is budgeted in **ns** or **ps**.
   - Confusing ns and ps causes constraints like \`set_clock_uncertainty 50\` to mean 50 ns instead of 50 ps, halting timing closure.
2. **Step 2: Inventory & Sink Verification (\`report_clocks\`)**:
   - Inspect the **No of Registers** column for every defined clock.
   - **Red Flag**: Any clock reporting **0 registers** indicates a broken clock tree source, an incorrect port name, or a disconnected clock net.
3. **Step 3: Generated Clocks Derivation Audit (\`report_clocks -generated\`)**:
   - Confirm that all on-chip dividers, PLL outputs, and ripple counters have a verified master source.
   - Verify that period ratios match RTL counter logic ($T_{\\text{gen}} = N \\cdot T_{\\text{master}}$).
4. **Step 4: Asynchronous & Exclusive Groups Audit (\`report_clock_groups\`)**:
   - **The Lethal Trap**: Check whether an engineer grouped a master clock and its generated divider clock as \`-asynchronous\`.
   - Verify that all \`set_clock_groups -asynchronous\` assertions map 1-to-1 with physical 2-FF or FIFO synchronizers in RTL.
5. **Step 5: Constraint Completeness Lint (\`check_timing\`)**:
   - Audit for sequential clock pins with **no clock waveform**.
   - Audit for unconstrained I/O ports and unbudgeted combinatorial feedback loops.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Cadence Genus Common UI: 15-Minute SDC Clocks Audit Script
proc audit_sdc_clocks {} {
  puts "========================================================"
  puts "       CADENCE GENUS 15-MINUTE SDC CLOCK AUDIT          "
  puts "========================================================"
  
  # 1. Audit Units:
  puts "--> Step 1: Checking Time Units..."
  report_units
  
  # 2. Audit All Defined Clocks & Register Sinks:
  puts "--> Step 2: Reporting All Clocks..."
  report_clocks
  
  # 3. Audit Generated Clocks:
  puts "--> Step 3: Verifying Generated Clocks..."
  report_clocks -generated
  
  # 4. Audit Clock Groups (Asynchronous & Exclusive):
  puts "--> Step 4: Auditing Clock Group Relationships..."
  report_clock_groups
  
  # 5. Check Timing Intent Completeness:
  puts "--> Step 5: Running Timing Constraint Lint..."
  check_timing -lint
  
  # 6. Audit Cross-Domain Paths (Ensure No Uncontrolled CDC):
  puts "--> Step 6: Checking Top Cross-Domain Violations..."
  report_timing -max_paths 10 -path_type full_clock
  puts "========================================================"
}
audit_sdc_clocks`,
    },
    commonPitfalls: [
      "Assuming 'report_clocks' is clean without checking if register count is zero on key clocks.",
      "Masking real timing violations by blindly applying 'set_clock_groups -asynchronous' across all clocks.",
      "Forgetting to verify time units (ps vs ns) before evaluating clock periods and uncertainties.",
    ],
    interviewerFollowups: [
      "How do you detect clock pins that receive multiple clock waveforms simultaneously?",
      "What is the difference between 'check_timing' and 'check_design' in Cadence Genus?",
    ],
    tags: ["sdc-audit", "check-timing", "report-clocks", "clock-groups", "cadence-genus", "signoff-checklist"],
  },

  // ⚡ DOMAIN: LOW POWER & ACTIVITY ANALYSIS (Cadence Genus / SAIF / VCD / UPF)
  {
    id: "pwr-01",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power UPF",
    role: "Senior RTL-to-GDS / Low-Power Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Derive the fundamental CMOS dynamic power equation and contrast the 5 tiers of the Activity Accuracy Ladder in Cadence Genus (VCD vs SAIF vs TCF vs set_activity vs vectorless defaults). Why does default vectorless synthesis lead to sub-optimal silicon PPA?",
    shortSummary: "Dynamic power scales with toggle rate α, load cap, Vdd², and frequency. Vectorless synthesis assumes default 0.1 toggle rates uniformly, causing Genus to oversize non-critical gates and under-optimize true switching hot-spots.",
    detailedAnswer: `### 1. Fundamental CMOS Power Physics:
Total power dissipation in digital CMOS circuits comprises three distinct physical components:
$$P_{\\text{total}} = P_{\\text{switching}} + P_{\\text{internal}} + P_{\\text{leakage}}$$

1. **Net Switching Power ($P_{\\text{switching}}$)**:
   Energy consumed charging and discharging external interconnect and load capacitances:
   $$P_{\\text{switching}} = \\alpha \\cdot C_{\\text{load}} \\cdot V_{\\text{dd}}^2 \\cdot f_{\\text{clk}}$$
   where $\\alpha$ is the toggle probability per clock cycle ($0 \\le \\alpha \\le 1$), $C_{\\text{load}}$ is net + pin capacitance, $V_{\\text{dd}}$ is supply voltage, and $f_{\\text{clk}}$ is clock frequency.
2. **Cell Internal Power ($P_{\\text{internal}}$)**:
   Energy dissipated inside standard cell boundaries during switching, consisting of:
   - Charging/discharging internal parasitic transistor junction capacitances.
   - **Short-circuit current** ($I_{\\text{sc}}$) flowing directly from $V_{\\text{dd}}$ to ground when NMOS and PMOS networks are simultaneously partially conductive during input transition.
3. **Static Leakage Power ($P_{\\text{leakage}}$)**:
   $$P_{\\text{leakage}} = V_{\\text{dd}} \\cdot (I_{\\text{sub}} + I_{\\text{gate}} + I_{\\text{junction}})$$
   Subthreshold leakage ($I_{\\text{sub}}$) dominates at advanced FinFET nodes (sub-7nm).

### 2. The 5-Tier Activity Accuracy Ladder:
| Rank | Activity Source | Ingestion Command | Accuracy & Application |
|---|---|---|---|
| **Tier 1 (Highest)** | **Windowed VCD** | \`read_vcd -start_time ... -end_time ...\` | Full cycle-by-cycle waveform with timing. Essential for **peak power**, dynamic voltage drop (DVD / IR drop), and thermal hot-spots. |
| **Tier 2** | **SAIF (Switching Activity Interchange Format)** | \`read_saif -instance ...\` | Statistical toggle count ($T_c$) and static probability ($P_1$) averaged over millions of simulation cycles. Industry standard for **average thermal design power (TDP)**. |
| **Tier 3** | **TCF (Toggle Count Format)** | \`read_tcf -hinst ...\` | Tool-chain activity capture preserving native simulator state. |
| **Tier 4** | **Asserted Activity** | \`set_activity -duty ... -freq ...\` | Architectural what-if exploration, defining specific control enable rates or bus modes. |
| **Tier 5 (Lowest)** | **Vectorless Defaults** | \`lp_default_toggle_percentage\` | Assumes generic toggle probability (typically $\\alpha = 0.1$) on all nets. **Unreliable for absolute mW numbers**. |

### 3. Why Vectorless Synthesis Causes Sub-Optimal Silicon PPA:
When Genus runs \`syn_opt -power\` without real simulation vectors:
- It treats a rarely-toggled error register the exact same as a high-frequency ALU operand bus.
- It will wastefully insert fine-grained Clock Gating Cells (ICGs) on logic that rarely activates, adding area and static leakage with zero dynamic energy savings!
- It under-sizes drivers on true high-activity datapath nets, resulting in poor slew and degraded silicon performance.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Vectorless Default Baseline (Relative Estimation Only):
set_db lp_default_toggle_percentage 10.0
report_power -by_category -unit mW

# 2. Targeted Asserted Activity for Control Registers:
set_activity -activity_type default -pin_types primary_input -duty 0.20 -freq 5e7
set_activity -activity_type default -pin_types flop_out -duty 0.50 -freq 0.15 -clock related
set_activity top/u_core/dma_burst_en -duty 0.05 -freq 1e6 -activity_type user

# 3. High-Accuracy SAIF Ingestion:
read_saif -instance chip_top/u_core \
  -scale_to_sdc_frequency \
  -verbose sim/functional_workload.saif

# 4. Report Final Correlated Power:
report_power -by_category -unit mW -header > reports/power_post_saif.rpt`,
    },
    commonPitfalls: [
      "Publishing absolute mW numbers based on Tier 5 vectorless defaults without stating activity assumptions.",
      "Assuming dynamic power only depends on load capacitance, ignoring cell internal short-circuit energy.",
      "Using full-chip simulation VCD without windowing to capture peak power cycles.",
    ],
    interviewerFollowups: [
      "How does Genus propagate activity from primary inputs through deep combinational logic cones when only boundary SAIF is provided?",
      "Why does short-circuit current power increase when input transition time is degraded?",
    ],
    tags: ["power-analysis", "dynamic-power", "saif", "vcd", "vectorless", "activity-ladder"],
  },

  {
    id: "pwr-02",
    domain: "low-power-upf",
    domainName: "Low Power UPF",
    role: "Senior RTL-to-GDS / Low-Power Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "When reading simulation activity files into Cadence Genus, what is the role of '-scale_to_sdc_frequency', and why is '-instance' / '-hinst' mapping critical between RTL simulation and synthesized gate netlists? How do you diagnose zero switching power reports?",
    shortSummary: "-scale_to_sdc_frequency rescales simulation toggle rates to match SDC clock constraints. Without correct instance path mapping, net names fail to bind, causing Genus to fall back to vectorless defaults or report zero switching power.",
    detailedAnswer: `### 1. The Frequency Rescaling Trap ('-scale_to_sdc_frequency'):
Simulation testbenches often run at nominal or reduced frequencies to conserve workstation memory and speed up simulation:
- Suppose an RTL simulation was executed with a clock period of $T_{\\text{sim}} = 10.0\\,\\text{ns}$ ($100\\,\\text{MHz}$).
- In Genus synthesis, the target SDC clock constraint is defined as $T_{\\text{sdc}} = 2.0\\,\\text{ns}$ ($500\\,\\text{MHz}$).
- **The Pitfall**: Without scaling, a net toggling 10 million times in the 100 MHz sim is calculated as $10\\,\\text{MHz}$ toggle rate in the 500 MHz implementation, **underestimating dynamic power by $5\\times$!**
- **The Solution**: \`-scale_to_sdc_frequency\` renormalizes **time-based / absolute activity rates** from the simulation timeline onto the SDC clock frequencies used for power:
  - If SAIF stores toggles-per-second (or equivalent absolute rates), scaling by $f_{\\text{sdc}}/f_{\\text{sim}}$ corrects under-clocked sims.
  - If you already have a dimensionless per-cycle toggle density $\\alpha$ and power uses $P \\propto \\alpha C V^{2} f$, **do not** also multiply $\\alpha$ by $f_{\\text{sdc}}/f_{\\text{sim}}$ — that double-counts frequency. Keep one convention.

### 2. Instance Scope Mapping:
In testbench environments, the design under test (DUT) is typically instantiated under a top-level verification wrapper:
\`tb_top.u_chip_wrapper.dut_core\`
In synthesis, the current top-level module is \`dut_core\`:
- If an engineer executes \`read_saif sim.saif\` without \`-instance\`, Genus attempts to look for hierarchy \`tb_top\` inside the synthesized netlist.
- Because \`tb_top\` does not exist in the RTL netlist, **0% of the nets match!**
- The engineer must supply:
  \`read_saif -instance tb_top/u_chip_wrapper/dut_core sim.saif\`
  to anchor the SAIF hierarchy root directly to the synthesis top design.

### 3. Diagnosing Zero Switching Power in 'report_power':
If \`report_power\` indicates 0.00 mW switching power:
1. **Activity Assertion Failure**: Check activity annotation percentage using \`get_db [get_db nets] .has_activity\`.
2. **Missing Clock Waveforms**: Unclocked registers have zero switching probability. Run \`check_timing\`.
3. **Net Name Mismatches**: Uniquified registers or renamed bus delimiters (\`bus[0]\` vs \`bus_0_\`) between RTL and gate netlists.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Clean SAIF Ingestion with Scope Mapping & Frequency Rescaling:
read_saif \
  -instance tb_soc_top/u_chip_top/u_core \
  -scale_to_sdc_frequency \
  -verbose \
  sim/workload_100mhz.saif

# 2. Audit Activity Annotation Coverage:
set total_nets [llength [get_db nets]]
set annotated_nets [llength [get_db nets -if {.has_user_activity == true}]]
puts "Total Nets: $total_nets | Annotated: $annotated_nets"

# 3. Check for Zero Switching Power Anomaly:
report_power -by_category -unit mW`,
    },
    commonPitfalls: [
      "Omitting '-scale_to_sdc_frequency' when simulation clock rates differ from production SDC clocks.",
      "Specifying the wrong testbench instance hierarchy path, leading to 0% net activity annotation.",
      "Using post-synthesis gate netlists with RTL SAIF dumps that lost wire names during logic optimization.",
    ],
    interviewerFollowups: [
      "What is the difference between reading SAIF generated from RTL simulation versus Gate-Level Simulation (GLS)?",
      "How does Genus handle activity on registers that were duplicated during high-fanout buffering?",
    ],
    tags: ["read-saif", "scale-to-sdc-frequency", "hierarchy-mapping", "switching-power", "genus-power"],
  },

  {
    id: "pwr-03",
    domain: "low-power-upf",
    domainName: "Low Power UPF",
    role: "Senior RTL-to-GDS / Low-Power Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the interaction between Clock Gating (ICG) insertion and simulation switching activity in Cadence Genus. How do you mathematically determine whether inserting an ICG saves power or increases net power, and how do you audit clock gating quality?",
    shortSummary: "ICGs eliminate downstream clock tree switching power when idle, but consume overhead leakage and internal gate power. An ICG only saves power if the register enable probability and group size M exceed the break-even threshold.",
    detailedAnswer: `### 1. The Clock Gating Trade-Off:
Integrated Clock Gating Cells (ICGs) prevent clock pulses from propagating to flip-flop clock pins when the registers are not loading new data:
- **Power Saved**: Eliminates charging/discharging the internal clock pin capacitances ($C_{\\text{ck}}$) of all $M$ gated registers, plus the downstream clock tree wire capacitance:
  $$P_{\\text{saved}} = (1 - \\beta) \\times \\sum_{i=1}^{M} C_{\\text{ck},i} \\cdot V_{\\text{dd}}^2 \\cdot f_{\\text{clk}}$$
  where $\\beta$ is the enable activity probability ($0 \\le \\beta \\le 1$). If $\\beta = 0.1$, the clock is gated 90% of the time.
- **Overhead Incurred**:
  1. ICG cell internal switching power on the continuous master clock pin (E pin latch + AND gate).
  2. ICG cell static leakage power ($P_{\\text{leak,ICG}}$).
  3. Extra combinational gate power evaluating the enable logic.

### 2. Mathematical Break-Even Criterion:
For clock gating to provide a net power benefit:
$$P_{\\text{saved}} > P_{\\text{overhead,ICG}}$$
$$(1 - \\beta) \\cdot M \\cdot C_{\\text{flop\\_ck}} \\cdot V_{\\text{dd}}^2 \\cdot f_{\\text{clk}} > C_{\\text{icg\\_in}} \\cdot V_{\\text{dd}}^2 \\cdot f_{\\text{clk}} + P_{\\text{leak,ICG}}$$

**Key Takeaway**:
1. If $\\beta \\to 1$ (register enables on almost every cycle), $(1 - \\beta) \\to 0$. **Inserting an ICG increases total power!**
2. If register bit-width $M < 3$ (e.g. gating a single flip-flop), the ICG overhead exceeds the tiny capacitance saved. In Genus, minimum bitwidth is constrained via:
   \`set_db lp_clock_gating_min_flops 3\`

### 3. Auditing Clock Gating Quality:
Cadence Genus provides \`report_clock_gates -include_activity_info\` to evaluate:
- **Gating Efficiency**: Percentage of cycles the clock was disabled.
- **Enable Activity**: Real toggle rates extracted from SAIF/VCD.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Configure Production Clock Gating in Genus:
set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 4
set_db lp_clock_gating_max_flops 64
set_db lp_clock_gating_prefix ICG_AUTO_

# 2. Ingest Accurate Simulation Switching Activity:
read_saif -instance dut_top -scale_to_sdc_frequency sim/workload.saif

# 3. Optimize Clock Gating Aware of Real Activity:
syn_generic
syn_map
syn_opt

# 4. Audit Gating Quality & Power Savings:
report_clock_gates -include_activity_info > reports/clock_gating_quality.rpt
report_power -by_category -unit mW > reports/power_with_icg.rpt`,
    },
    commonPitfalls: [
      "Inserting ICGs on registers with >95% enable activity, which increases silicon power due to ICG overhead.",
      "Setting minimum gating flops to 1, causing thousands of single-bit ICGs to flood the netlist and explode cell leakage.",
    ],
    interviewerFollowups: [
      "Why must the enable latch inside an ICG be active-low for posedge-triggered flip-flops?",
      "How does Genus prevent clock gating glitch violations during formal LEC verification?",
    ],
    tags: ["clock-gating", "icg", "gating-efficiency", "break-even-power", "genus-power"],
  },

  {
    id: "pwr-04",
    domain: "low-power-upf",
    domainName: "Low Power UPF",
    role: "Senior RTL-to-GDS / Low-Power Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Why do chip-level power reports often show I/O pad power dominating >80% of total dynamic dissipation, and how do you deconstruct power across categories, hierarchy, and MMMC views in Cadence Genus using 'report_power'?",
    shortSummary: "I/O pads drive massive off-chip board loads (10-50 pF) compared to internal core gates (1-5 fF). Engineers must use '-skip_port_switching_power' and '-by_hierarchy' to isolate core logic optimization from board interface dissipation.",
    detailedAnswer: `### 1. The Pad-Dominated Power Illusion:
When synthesizing top-level chip netlists with I/O pad rings (\`pad_top\`):
- An internal core logic gate drives interconnects with capacitances around **$1\\,\\text{fF}$ to $10\\,\\text{fF}$**.
- An external I/O pad drives PCB board traces, package bond wires, and receiver pin capacitances typically budgeted around **$10\\,\\text{pF}$ to $50\\,\\text{pF}$** ($10{,}000\\times$ larger!):
  $$P_{\\text{pad}} = \\alpha \\cdot (30\\,\\text{pF}) \\cdot (1.8\\,\\text{V})^2 \\cdot f_{\\text{clk}}$$
- Consequently, top-level \`report_power\` will report that 85%–90% of total dynamic power is consumed in the I/O pads!
- **The Senior Trap**: Focusing optimization effort on pad buffers where gate sizing cannot change the external $30\\,\\text{pF}$ board capacitance.
- **The Solution**: Strip external port switching power to isolate and optimize core silicon efficiency:
  \`report_power -skip_port_switching_power -by_category\`

### 2. Multi-Dimensional Power Deconstruction:
Cadence Genus provides orthogonal reporting dimensions:
1. **By Category (\`-by_category\`)**:
   Breaks down power into Leakage, Cell Internal, and Net Switching, sub-divided by Functional Type: Register, Combinational Logic, Clock Gating, Memory/SRAM, and I/O Pad.
2. **By Hierarchy (\`-by_hierarchy\` / \`-inst <hier_inst>\`)**:
   Rolls up total power per functional module, pinpointing the exact microarchitectural block consuming excess power.
3. **By MMMC Analysis View (\`-view <analysis_view>\`)**:
   Evaluates dynamic power under high-voltage/high-frequency active views (\`av_func_max\`) versus leakage power under high-temperature/fast-corner leakage views (\`av_leakage_max\`).`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Overall Power Breakdown by Category:
report_power -by_category -unit mW -header > reports/power_by_category.rpt

# 2. Isolate Core Logic by Stripping Pad Switching Power:
report_power -skip_port_switching_power -by_category -unit mW > reports/power_core_only.rpt

# 3. Hierarchical Roll-Up by Module Sub-Block:
report_power -by_hierarchy -levels 2 -unit mW > reports/power_by_hierarchy.rpt

# 4. Target Specific High-Activity Processing Core:
report_power -inst u_soc_top/u_cpu_cluster -by_category -unit mW

# 5. MMMC View-Specific Reporting (Dynamic vs Leakage View):
report_power -view av_func_dynamic -by_category -unit mW
report_power -view av_leakage_wc   -by_category -unit mW`,
    },
    commonPitfalls: [
      "Attempting to optimize internal core logic sizing to reduce pad-dominated total chip power.",
      "Evaluating leakage power at 25°C instead of worst-case 125°C junction temperature.",
      "Forgetting to verify MMMC power analysis view association.",
    ],
    interviewerFollowups: [
      "Why does leakage power increase exponentially with operating temperature ($I_{\\text{leak}} \\propto T^2 e^{-q V_{\\text{th}} / k T}$)?",
      "How do Multi-Threshold CMOS (MTCMOS) libraries balance leakage recovery on positive slack paths?",
    ],
    tags: ["report-power", "pad-power", "power-categories", "hierarchy-power", "mmmc-power"],
  },

  {
    id: "pwr-05",
    domain: "low-power-upf",
    domainName: "Low Power UPF",
    role: "Senior RTL-to-GDS / Low-Power Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "How does IEEE 1801 UPF multi-rail power intent interact with Cadence Genus synthesis optimization? Explain how 'report_power' audits power domains, power modes, and multi-Vt leakage power recovery.",
    shortSummary: "Genus parses UPF power intent to model separate voltage domains, isolation, and level shifters. report_power -power_domain and -power_mode allow auditing leakage and dynamic power across operational states, while opt_leakage_to_dynamic_ratio controls Multi-Vt swapping.",
    detailedAnswer: `### 1. UPF Multi-Voltage Power Intent in Synthesis:
In modern power-managed SoCs, designs are partitioned into independent power domains governed by IEEE 1801 UPF:
- **Always-On Domain (\`PD_AON\`)**: Operates continuously at nominal voltage (e.g. 0.8V) to support power management units (PMU) and real-time clocks.
- **Switchable Core Domain (\`PD_CORE\`)**: Powered down via sleep power switches during Standby mode.
- **Voltage-Scaled Accelerator Domain (\`PD_ACCEL\`)**: Operates across variable voltages (0.6V low power, 0.9V turbo).

### 2. Multi-Rail & Power Mode Auditing in Genus:
1. **Power Domain Deconstruction**:
   \`report_power -power_domain PD_CORE -unit mW\`
   Breaks down dynamic and static power consumed specifically within that power island.
2. **Power Mode Auditing**:
   Using Power State Tables (PST) defined in UPF, Genus evaluates power under distinct operational modes:
   \`report_power -power_mode ACTIVE_MODE -unit mW\`
   \`report_power -power_mode DEEP_SLEEP -unit mW\`
   In Deep Sleep, dynamic power collapses to zero while static leakage must be audited to verify power switch shutoff efficiency.
3. **Multi-Rail Dissipation**:
   \`report_power -by_rail -unit mW\`
   Separates current draw per physical power supply net (\`VDD_CORE\`, \`VDD_AON\`, \`VDD_IO\`).

### 3. Multi-Vt Leakage Recovery Strategy:
During \`syn_opt\`, Genus performs leakage power optimization:
- Cells on critical timing paths (zero or negative slack) are mapped to fast, leaky **Low-Vt (LVT)** or **eXtreme-Low-Vt (ELVT)** transistors.
- Cells on non-critical paths with positive timing slack ($+0.2\\,\\text{ns}$) are automatically swapped to low-leakage **High-Vt (HVT)** standard cells:
  \`set_db opt_leakage_to_dynamic_ratio 0.8\`
  This slashes standby leakage power by up to 70% without degrading maximum operating frequency.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Enable Low-Power Synthesis & UPF Flow:
read_power_intent -upf constraints/soc_power.upf
apply_power_intent

# 2. Configure Multi-Vt Leakage Power Optimization:
set_db design_power_effort high
set_db opt_power_effort high
set_db opt_leakage_to_dynamic_ratio 0.85

# 3. Execute Timing & Leakage Aware Optimization:
syn_generic
syn_map
syn_opt

# 4. Multi-Rail & UPF Domain Power Reports:
report_power -by_rail -unit mW > reports/power_rails.rpt
report_power -power_domain PD_CPU_CORE -by_category -unit mW
report_power -power_mode STANDBY_SLEEP -unit uW`,
    },
    commonPitfalls: [
      "Evaluating standby leakage without applying the UPF sleep mode state, falsely assuming the domain is active.",
      "Setting opt_leakage_to_dynamic_ratio to 1.0 on timing-critical designs, causing Genus to under-size cells on near-critical paths.",
      "Failing to verify isolation cell and level shifter leakage power in the Always-On domain.",
    ],
    interviewerFollowups: [
      "What is the physical difference between state-dependent leakage (SDLP) and average cell leakage in library Liberty (.lib) files?",
      "How does Cadence Voltus use synthesis SAIF/VCD activity to perform dynamic IR-drop signoff?",
    ],
    tags: ["upf", "power-domain", "multi-rail", "power-mode", "multi-vt", "leakage-recovery"],
  },

  // 🛠️ DOMAIN: CADENCE GENUS COMMANDS ENCYCLOPEDIA & STRUCTURAL SANITIZATION
  {
    id: "cmd-01",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Explain the Cadence Common UI (CUI) database architecture: how do 'get_db' and 'set_db' query and manipulate design objects? What is the correct syntax for filtering, traversing object relationships (e.g. from pin to cell to base library cell), and why is inventing '-count' a classic interview giveaway?",
    shortSummary: "Cadence Common UI uses an object-oriented hierarchical database accessed via get_db and set_db. Objects possess typed attributes and relation pointers. Object counting is performed via standard Tcl 'llength [get_db ...]' as '-count' does not exist in Genus.",
    detailedAnswer: `### 1. Cadence Common UI (CUI) Architectural Philosophy:
Cadence unified its tool portfolio (Genus Synthesis, Innovus Implementation, Tempus Timing, Conformal LEC, and Voltus Power) under the **Common UI (Stylus CUI)**:
- In Legacy UI, each tool used disparate Tcl syntax (e.g. \`get_attribute\`, \`set_attribute\`, \`find -instance\`).
- Common UI provides a single, uniform object database accessed exclusively through **\`get_db\`** and **\`set_db\`**.

### 2. Deep Object Traversal and Relationship Pointers:
Objects in the database (designs, modules, insts, pins, nets, lib_cells, clocks) contain direct pointers to related objects:
1. **Querying Attributes**:
   \`get_db [get_db clocks *CLK*] .period\`
   \`get_db [get_db clocks *CLK*] .waveform\`
2. **Multi-Hop Object Traversal**:
   Instead of writing convoluted nested loops, CUI allows dot-separated object relationship chains:
   \`get_db [get_db pins u_core/u_alu/out_reg/Q] .inst.base_cell.name\`
   - \`.inst\`: Navigates from the pin to its parent instance.
   - \`.base_cell\`: Navigates from instance to the underlying technology library cell.
   - \`.name\`: Extracts the cell string (e.g. \`DFFX1_HVT\`).
3. **Filtering with Logical Expressions (\`-if\` and \`-regexp\`)**:
   \`get_db insts -if {.is_sequential == true && .base_cell.is_clock_gating == false}\`
   \`get_db nets -if {.num_loads > 32}\`

### 3. The Classic Interview Giveaway: 'llength' vs '-count':
Candidates who memorize Synopsys Design Compiler (\`sizeof_collection\`) or invent intuitive flags often write:
\`get_db insts -count\`  *(SYNTAX ERROR)*
In Cadence Common UI, \`get_db\` returns a native Tcl list of database pointers. To count objects:
$$\\mathbf{\\text{llength [get_db insts *]}}$$
$$\\mathbf{\\text{llength [get_db lib_cells *TIE*]}}$$`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Count All Sequential Flip-Flops in Design:
set num_flops [llength [get_db insts -if {.is_sequential == true}]]
puts "Total Sequential Registers: $num_flops"

# 2. Extract Base Library Cells for Clock Tree Buffers:
set clk_buf_cells [get_db [get_db pins *u_core*/clk*] .inst.base_cell.name -unique]
puts "Clock Tree Standard Cells: $clk_buf_cells"

# 3. High-Fanout Net Audit (> 40 Loads):
set hfn_nets [get_db nets -if {.num_loads > 40}]
foreach net $hfn_nets {
  puts "HFN Net: [get_db $net .name] | Fanout: [get_db $net .num_loads]"
}

# 4. Modify Design-Level Optimization Knobs:
set_db remove_assigns true
set_db lp_insert_clock_gating true
set_db [get_db lib_cells *CK*] .dont_use true`,
    },
    commonPitfalls: [
      "Inventing 'get_db -count' instead of standard Tcl 'llength [get_db ...]'.",
      "Using legacy 'get_attribute' or 'set_attribute' in modern Genus Stylus CUI environments.",
      "Forgetting the leading dot before attribute names in dot notation (e.g. '.period' vs 'period').",
    ],
    interviewerFollowups: [
      "How do you query whether an attribute is read-only or user-settable in the Genus database?",
      "What is the performance difference between 'get_db pins' on a full-chip netlist versus filtering hierarchically with '-depth'?",
    ],
    tags: ["common-ui", "get-db", "set-db", "cadence-stylus", "database-traversal", "llength"],
  },

  {
    id: "cmd-02",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Walk through the 14 structural sanity checks executed by 'check_design' in Cadence Genus. Differentiate between hard fatal blockers (-unresolved, -multiple_driver, -combo_loops) and acceptable structural conditions (-constant, -unloaded), and explain the tape-out signoff criteria.",
    shortSummary: "check_design audits netlist structural integrity prior to mapping. Unresolved modules, multi-driven nets, and combinational loops are fatal blockers; constant pins and unloaded logic are acceptable if verified against architectural intent.",
    detailedAnswer: `### 1. The check_design Structural Audit Suite:
Before committing millions of gates to synthesis optimization, Cadence Genus executes structural validation:
\`check_design [-flags] [design] [> check_design.rpt]\`

### 2. Categorizing the 14 Diagnostic Flags:
| Flag | Defect Detected | Severity & Tape-Out Signoff Criteria |
|---|---|---|
| **\`-unresolved\`** | Missing sub-modules, unlinked black-boxes, or unmapped technology library cells. | **FATAL BLOCKER (0 Allowed)**. Indicates missing RTL files, missing macro LEF/lib, or misspelled module instances. |
| **\`-multiple_driver\`** | Short-circuited nets driven simultaneously by two or more active output pins. | **FATAL BLOCKER (0 Allowed)**. Silicon catastrophe causing high drive contention, excessive current, and logic invalidity. |
| **\`-combo_loops\`** | Cyclic combinational feedback paths without sequential state storage. | **FATAL BLOCKER (0 Allowed)**. Causes non-deterministic oscillation, race conditions, and halts static timing analysis. |
| **\`-assigns\`** | Continuous Verilog \`assign net_a = net_b\` statements. | **P&R BLOCKER (0 Allowed at Handoff)**. Routers cannot handle non-physical wire aliases. Must be resolved via \`remove_assigns_without_opt\`. |
| **\`-undriven\`** | Floating input pins or nets with no active driver. | **CRITICAL**. Causes floating gate oxide breakdown or random logic states. Must be connected to constants or driven by logic. |
| **\`-constant\`** | Pins tied permanently to logic 0 or 1. | **ACCEPTABLE WITH PROOF**. Common for mode strapping (e.g. scan_en=0 in functional mode). Must be tied via TIE cells (\`add_tieoffs\`). |
| **\`-through_tie_cell\`** | Verifies constant nets driven through physical TIEHI/TIELO standard cells. | **SIGNOFF MANDATE**. Confirms constant pins are shielded from raw $V_{\\text{dd}}/V_{\\text{ss}}$ rail voltage spikes. |
| **\`-unloaded\`** | Register outputs or design ports with zero fanout loads. | **WARNING**. Usually indicates unused debug registers or legacy RTL. Cleaned via \`delete_unloaded_undriven\`. |
| **\`-unloaded_comb\`** | Combinational logic gates driving no loads. | **OPTIMIZATION CLEANUP**. Removed automatically during \`syn_generic\` and \`syn_map\`. |
| **\`-lib_lef_consistency\`**| Pin name, direction, or capacitance mismatches between Liberty (.lib) and physical LEF. | **FATAL BLOCKER**. Prevents physical P&R placement and causes DRC/LVS opens. |
| **\`-logical_only\`** | Cells present in logic netlist but missing physical LEF representation. | **FATAL P&R BLOCKER**. Physical router cannot place or route the cell. |

### 3. Production Scripting & Exit Code Automation:
In automated CI/CD synthesis regressions:
\`check_design -status\` returns exit code \`1\` if any rule fails, allowing shell scripts to abort synthesis before wasting compute hours.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Automated Netlist Structural Sanity Check:
proc run_structural_signoff_gate {} {
  puts "--> Running Full Netlist Structural Audit..."
  check_design -all > reports/check_design_full.rpt
  
  # 1. Fatal Blocker 1: Unresolved Modules
  set unresolved [check_design -unresolved -collection]
  if {[llength $unresolved] > 0} {
    error "FATAL: Found [llength $unresolved] unresolved modules in netlist!"
  }
  
  # 2. Fatal Blocker 2: Multi-Driven Nets
  set multi_driven [check_design -multiple_driver -collection]
  if {[llength $multi_driven] > 0} {
    error "FATAL: Found [llength $multi_driven] multiple-driver nets!"
  }
  
  # 3. Fatal Blocker 3: Combinational Loops
  set loops [check_design -combo_loops -collection]
  if {[llength $loops] > 0} {
    error "FATAL: Found [llength $loops] combinational feedback loops!"
  }
  
  puts "--> Structural Sanity Gate: 100% PASSED ✓"
}
run_structural_signoff_gate`,
    },
    commonPitfalls: [
      "Ignoring '-unresolved' warnings under the false assumption that downstream P&R will link them.",
      "Leaving continuous assign statements in the gate netlist handed off to Innovus P&R.",
      "Allowing floating undriven input pins into physical placement, risking gate oxide dielectric breakdown.",
    ],
    interviewerFollowups: [
      "Why does 'check_design -lib_lef_consistency' flag power and ground pins (VDD/VSS) in standard cells?",
      "How does 'delete_unloaded_undriven' handle boundary scan registers required for post-silicon ATE testing?",
    ],
    tags: ["check-design", "structural-lint", "unresolved", "multi-driver", "combo-loops", "cadence-genus"],
  },

  {
    id: "cmd-03",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA)",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "When reviewing a top-level QoR report showing a catastrophic WNS of -3.5 ns, how do you mathematically isolate whether the violation is caused by Input-to-Output (I2O) pad feedthroughs versus Core Register-to-Register (R2R) logic? Write the Genus path grouping commands to partition cost weights.",
    shortSummary: "Top-level WNS combines all paths into a single global number. By partitioning paths into 4 canonical cost groups (reg2reg, in2reg, reg2out, in2out) via group_path, engineers prevent pad arc delays from masking core frequency closure.",
    detailedAnswer: `### 1. The Global WNS Masking Trap:
When \`report_qor\` reports:
\`Path Group 'default': WNS = -3.520 ns, TNS = -28.160 ns\`
Inexperienced engineers assume the core ALU or pipeline logic has catastrophic timing failures and waste weeks aggressively pipelining RTL or upsizing core logic.
- **The Physics of I/O Pads**:
  An Input-to-Output (I2O) feedthrough path enters via an input pad, traverses minor combinational multiplexing, and exits via a large output pad.
  - Input pad internal propagation arc: $\\sim 0.8\\,\\text{ns}$
  - Output pad internal propagation arc: $\\sim 1.6\\,\\text{ns}$
  - External board load ($30\\,\\text{pF}$): $\\sim 1.2\\,\\text{ns}$
  - Total path delay: $\\mathbf{3.6\\,\\text{ns}}$ against a $2.0\\,\\text{ns}$ clock cycle ($WNS = -1.6\\,\\text{ns}$)!
- Meanwhile, internal core register-to-register (R2R) paths close cleanly with **$+0.4\\,\\text{ns}$ positive slack**!
- Because Genus synthesizes against the worst overall slack, the optimization engine dedicates all its effort attempting to size internal gates on I2O feedthrough paths where core cell sizing cannot overcome pad physical delays!

### 2. The 4 Canonical Cost Groups:
To decouple physical boundaries and prioritize synthesis optimization:
1. **\`reg2reg\`**: Sequential paths entirely within core clock trees. Represents true maximum operating frequency ($F_{\\text{max}}$).
2. **\`in2reg\`**: Chip input ports to internal registers. Governed by external board input delays ($T_{\\text{in}}$).
3. **\`reg2out\`**: Internal registers to chip output ports. Governed by external board output delays ($T_{\\text{out}}$) and capacitive loads.
4. **\`in2out\`**: Combinational feedthroughs crossing both pads. Budgeted separately or pipelined at core boundaries.

### 3. Cost Weighting and Path Adjustment:
Using \`group_path\`, each category receives a dedicated cost group and weighting factor. In Genus:
\`path_adjust -delay <ps> -from ... -to ...\`
allows applying precise margin offsets without corrupting golden SDC files.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Partition Design into 4 Canonical Cost Groups:
group_path -name reg2reg -from [all_registers] -to [all_registers]
group_path -name in2reg  -from [all_inputs]    -to [all_registers]
group_path -name reg2out -from [all_registers] -to [all_outputs]
group_path -name in2out  -from [all_inputs]    -to [all_outputs]

# 2. Assign Optimization Priority Weights:
set_db [get_db cost_groups reg2reg] .weight 2.0
set_db [get_db cost_groups in2out]  .weight 0.5

# 3. Independent Timing Triage Reports:
puts "=== 1. CORE REGISTER-TO-REGISTER TIMING ==="
report_timing -from [all_registers] -to [all_registers] -max_paths 5

puts "=== 2. INPUT-TO-OUTPUT FEEDTHROUGH TIMING ==="
report_timing -from [all_inputs] -to [all_outputs] -max_paths 5

puts "=== 3. I/O PORT DELAY AUDIT ==="
report_port -delay [all_inputs]
report_port -load  [all_outputs]`,
    },
    commonPitfalls: [
      "Evaluating chip timing solely from global report_qor without breaking down slack by cost group.",
      "Upsizing internal core logic to fix violations caused by external 50 pF board pad loads.",
      "Applying unconditional false paths to in2out feedthroughs, masking real functional timing requirements.",
    ],
    interviewerFollowups: [
      "Why does Genus use path cost weights, and how does cost weight affect cell area during multi-objective optimization?",
      "How do you budget input and output delays for an un-registered combinational feedthrough?",
    ],
    tags: ["path-groups", "group-path", "i2o-timing", "reg2reg", "qor-triage", "genus-timing"],
  },

  {
    id: "cmd-04",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design (PnR)",
    role: "Senior RTL-to-GDS / Physical Design & PnR Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Why are continuous Verilog 'assign' statements and direct connections to VDD/VSS rails strictly forbidden in production gate netlists handed off to P&R? Explain the physical failure mechanisms and provide the Cadence Genus commands for 'remove_assigns' and 'add_tieoffs'.",
    shortSummary: "Assign statements cause physical short circuits in P&R routers, while tying MOS gates directly to raw power rails induces dielectric gate oxide breakdown during ESD/EOS events. Production netlists require buffer insertion for assigns and TIEHI/TIELO standard cells.",
    detailedAnswer: `### 1. The Physical Hazard of Continuous 'assign' Statements:
In Verilog, continuous assignments (e.g. \`assign wire_b = wire_a;\`) represent logical net aliases:
- **Router Failure Mechanism**:
  Physical P&R tools (Innovus) generate physical geometries based on netlist connectivity.
  - If two distinct logical net names share the same physical wire without an intervening buffer cell, extraction engines and LVS (Layout Versus Schematic) checkers flag catastrophic **Short Circuit Violations**!
  - Cross-hierarchy assign statements frequently cause routing tools to drop connections entirely, creating lethal **Open Circuits**.
- **The Genus Remedy**:
  \`set_db remove_assigns true\`
  \`remove_assigns_without_opt -design <top> -verbose\`
  Genus automatically replaces symbolic wire aliases with physical standard cell buffers (e.g. \`CLKBUFX1\`), giving physical routers distinct source and sink pins.

### 2. The Physical Hazard of Direct VDD / VSS Ties:
In RTL, unused inputs are tied to \`1'b0\` or \`1'b1\`:
- **Gate Oxide Breakdown (EOS / ESD Hazard)**:
  Connecting a MOSFET gate terminal directly to the global $V_{\\text{dd}}$ or $V_{\\text{ss}}$ power rail exposes the fragile sub-nanometer gate dielectric to high-voltage transients, inductive supply bounce, and Electrostatic Discharge (ESD):
  $$E_{\\text{oxide}} = \\frac{V_{\\text{transient}}}{t_{\\text{ox}}} > E_{\\text{breakdown}}$$
  This causes physical gate oxide rupture, permanently destroying the transistor in silicon!
- **Antenna Rule Violations**:
  Direct metal connections to global power rails act as antennas during plasma etching, trapping charge and punching through gate oxides.
- The TIE Cell Remedy:
  Dedicated TIEHI and TIELO standard cells incorporate internal resistive clamping transistors that isolate the gate terminal from rail spikes.
  add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 -verbose <top>
  Limiting maximum fanout (e.g. 8 loads) prevents excessive RC delay on static constant nets.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Audit Netlist for Assigns and Direct Rail Ties:
check_design -assigns
check_design -constant

# 2. Remove All Verilog Continuous Assigns via Buffer Insertion:
set_db remove_assigns true
set_remove_assign_options -buffer_or_inverter [get_db lib_cells *BUF_X1*]
remove_assigns_without_opt -design soc_top -verbose

# 3. Tie All Undriven / Floating Inputs to Constant 0:
set undriven_pins [get_db pins -if {.is_undriven == true}]
foreach pin $undriven_pins {
  connect -constant 0 $pin
}

# 4. Insert Physical TIEHI / TIELO Standard Cells (Max Fanout = 8):
add_tieoffs \
  -high TIEHI_X1 \
  -low  TIELO_X1 \
  -max_fanout 8 \
  -verbose \
  soc_top

# 5. Verify 100% Clean Handoff:
check_design -assigns
check_design -through_tie_cell`,
    },
    commonPitfalls: [
      "Handing off netlists with raw assign statements to Innovus P&R, causing LVS short-circuit violations.",
      "Connecting constant pins directly to VDD/VSS rails without TIE cells, risking gate dielectric breakdown in silicon.",
      "Allowing unlimited fanout on TIE cells (>100 loads), creating high-fanout routing bottlenecks.",
    ],
    interviewerFollowups: [
      "How does Conformal LEC handle formal equivalence verification when 'remove_assigns' inserts buffers into the netlist?",
      "What is the difference between a diode tie-cell and a standard resistive tie-cell?",
    ],
    tags: ["remove-assigns", "add-tieoffs", "tie-cells", "gate-oxide-breakdown", "physical-handoff"],
  },

  {
    id: "cmd-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA)",
    role: "Senior RTL-to-GDS / Synthesis & STA Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "How do you diagnose whether a critical timing violation is caused by Design Rule Violations (DRVs: max_transition / max_capacitance) versus excessive logic depth? Explain how to use 'report_delay_calculation' and 'report_slew_calculation' in Cadence Genus.",
    shortSummary: "Engineers run report_delay_calculation and report_slew_calculation to extract non-linear delay model (NLDM) lookup coordinates. This proves whether delay is inflated by slew degradation on high-cap nets or by excessive logic cone depth.",
    detailedAnswer: `### 1. The Root Cause Dilemma: Slew vs Depth:
When a timing path exhibits negative slack:
1. **Hypothesis A (Excessive Logic Depth)**:
   The path traverses too many combinational gates (e.g. 28 logic levels in a $1.0\\,\\text{ns}$ cycle). Each gate adds intrinsic cell delay ($T_{\\text{intrinsic}}$).
   - *Remedy*: RTL pipelining, Boolean restructuring, or architectural decomposition.
2. **Hypothesis B (Degraded Slew / High Fanout)**:
   The path has only 6 logic levels, but one net has an enormous capacitive load ($C_{\\text{load}} > 100\\,\\text{fF}$) causing input transition time to balloon ($T_{\\text{slew}} > 0.4\\,\\text{ns}$).
   - *Physics*: In Liberty Non-Linear Delay Models (NLDM), cell delay is a two-dimensional interpolated function of input slew and output capacitance:
     $$T_{\\text{delay}} = f(T_{\\text{slew,in}}, C_{\\text{load,out}})$$
   - When input slew degrades, cell propagation delay explodes non-linearly!
   - *Remedy*: Buffer insertion, driver sizing, or fanout splitting.

### 2. Cadence Genus Delay Arc Diagnostics:
Rather than guessing root causes, Genus provides exact arc calculation diagnostics:
1. **\`report_delay_calculation -from <pinA> -to <pinB>\`**:
   Prints the exact NLDM 2D table lookup coordinates:
   - Input transition evaluated at pin A.
   - Total effective output capacitance ($C_{\\text{pin}} + C_{\\text{wire}}$) seen at pin B.
   - The interpolated delay value extracted from the technology library table.
2. **\`report_slew_calculation -from <pinA> -to <pinB>\`**:
   Reports output slew derivation based on cell drive strength and load.
3. **\`report_constraint -max_transition -max_capacitance\`**:
   Identifies all nets exceeding electrical library design limits (DRVs).`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Identify Worst Timing Path with Net Delays & Slew Columns:
report_timing -max_paths 1 -path_type full_clock -nets > reports/worst_path.rpt

# 2. Inspect Exact Arc Delay Calculation on Suspicious Buffer/Logic Cell:
report_delay_calculation \
  -from u_core/u_alu/U148/A \
  -to   u_core/u_alu/U148/Y

# 3. Inspect Output Slew Derivation:
report_slew_calculation \
  -from u_core/u_alu/U148/A \
  -to   u_core/u_alu/U148/Y

# 4. Audit Global Electrical Design Rule Violations (DRVs):
report_constraint -max_transition -all_violators > reports/drv_max_tran.rpt
report_constraint -max_capacitance -all_violators > reports/drv_max_cap.rpt

# 5. Logic Levels Histogram (Identify Deep Cones):
report_logic_levels_histogram`,
    },
    commonPitfalls: [
      "Blindly adding pipeline stages to RTL when the real timing bottleneck was a single unbuffered high-fanout net violating max_transition.",
      "Assuming wire delay dominates in pre-CTS synthesis; wireload model inaccuracy can mask cell delay inflation.",
    ],
    interviewerFollowups: [
      "How does Composite Current Source (CCS) timing differ from NLDM delay calculation at sub-5nm nodes?",
      "Why does a degraded clock slew at a flip-flop clock pin increase its internal clock-to-Q delay ($T_{\\text{cq}}$)?",
    ],
    tags: ["delay-calculation", "slew-calculation", "drv", "max-transition", "max-capacitance", "nldm"],
  },

  // 🗺️ DOMAIN: MASTER SYNTHESIS CURRICULUM & RTL-TO-GDSII FLOW ARCHITECTURE
  {
    id: "idx-01",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Principal RTL-to-GDS / Synthesis & Signoff Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Walk through the complete industrial 15-stage RTL-to-GDSII digital synthesis and physical handoff flow in Cadence Genus. Explain the chronological dependencies between logic elaboration, SDC linting, MMMC multi-view setup, DFT scan insertion, clock gating (LP), physical iSpatial optimization, and formal LEC / SDF signoff. What are the fatal blockers at each stage gate?",
    shortSummary: "A production Genus flow progresses: Environment → RTL elaborate → SDC lint → syn_generic → LP/ICG → MMMC → syn_map → DFT convert_to_scan → further syn_opt / iSpatial → sanitize → LEC → write_db -common. Scan conversion belongs after technology mapping.",
    detailedAnswer: `### 1. The 15-Stage Cadence Genus Industrial Synthesis Flow:
Modern deep-submicron SoC synthesis is not a single \`compile\` command. It is a strictly sequenced pipeline where each gate must pass automated assertions before downstream compilation.

**Canonical DFT placement (matches dft-01):** \`syn_generic\` → \`syn_map\` → \`convert_to_scan\` / scan chain build → further \`syn_opt\` (including physical). Do **not** convert to scan before technology mapping.

\`\`\`
[1. Units & Libs] ──> [2. RTL Read & Elaborate] ──> [3. Structural check_design]
                                                            │
                                                            ▼
[6. Generic Opt (syn_generic)] <── [5. SDC Lint (check_timing)] <── [4. SDC Ingestion]
         │
         ▼
[7. LP & Clock Gating (ICG)] ──> [8. MMMC Active Views] ──> [9. Tech Mapping (syn_map)]
                                                                    │
                                                                    ▼
[12. Netlist Sanitization] <── [11. Physical iSpatial (syn_opt)] <── [10. DFT convert_to_scan]
         │
         ▼
[13. Signoff check_design] ──> [14. LEC Golden Handoff] ──> [15. write_db -common (Innovus)]
\`\`\`

### 2. Stage-by-Stage Breakdown & Dependency Rules:
1. **Stage 1: Session Environment & Technology Setup**:
   - Ingest target Liberty (.lib), physical LEF, and verify units (\`report_units\`). Setting library pointers before reading HDL is mandatory so macro black-boxes are linked.
2. **Stage 2: RTL Elaboration (\`elaborate\`)**:
   - Parses SystemVerilog RTL, performs parameter evaluation, unrolls generate loops, and builds high-level generic logic representation.
3. **Stage 3: Pre-Synthesis Structural Sanity Gate (\`check_design -unresolved\`)**:
   - **Hard Blocker**: Must verify zero unresolved modules, zero multi-driven nets, and zero combinational loops before proceeding.
4. **Stage 4: Timing Intent Ingestion (\`read_sdc\`)**:
   - Ingests primary root clocks, derived generated clocks, and I/O interface delays.
5. **Stage 5: Constraint Completeness Lint (\`check_timing\`)**:
   - Audits for unclocked register pins, conflicting waveforms, or unconstrained ports.
6. **Stage 6: Generic Technology-Independent Optimization (\`syn_generic\`)**:
   - Boolean logic optimization, constant folding, dead-code removal, and resource sharing.
7. **Stage 7: Low-Power Intent & Clock Gating Insertion (\`lp_insert_clock_gating\`)**:
   - Ingests simulation activity (SAIF/VCD) with \`-scale_to_sdc_frequency\` and inserts Integrated Clock Gating cells (ICGs).
8. **Stage 8: Multi-Mode Multi-Corner (MMMC) Setup (\`set_analysis_view\`)**:
   - Activates setup views (Slow Corner SSG / 125°C) and hold views (Fast Corner FFG / -40°C).
9. **Stage 9: Technology Library Mapping (\`syn_map\`)**:
    - Maps generic gates to target foundry standard cells while respecting \`dont_use\` restrictions. **Scan conversion needs real sequential Liberty cells.**
10. **Stage 10: Design-for-Test (DFT) & Scan (\`convert_to_scan\` / chain build)**:
    - Replaces mapped flip-flops with scan-equivalent cells and builds scan chains / lockups as configured.
11. **Stage 11: Physical-Aware iSpatial Optimization (\`syn_opt -physical\`)**:
    - Uses floorplan DEF and placement congestion models to guide buffer insertion and gate sizing after scan structure exists.
12. **Stage 12: Netlist Sanitization**:
    - Executes \`remove_assigns_without_opt\` (replacing wire aliases with physical buffers) and inserts TIEHI/TIELO cells via \`add_tieoffs\`.
13. **Stage 13: Final Signoff Verification Gate**:
    - Runs \`report_qor\`, \`report_power -by_category\`, and \`check_design -status\`.
14. **Stage 14: Formal Equivalence Handoff (\`write_hdl -lec\`)**:
    - Exports revised netlist and Conformal LEC \`run_lec.do\` script.
15. **Stage 15: Common Database Physical Handoff (\`write_db -common\`)**:
    - Writes out shared Innovus/Tempus database for seamless zero-loss place-and-route handoff.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Master Synthesis Flow (DFT after syn_map):
# 1. Setup & Environment
report_units
set_db library [list $STD_LIB $IO_LIB $SRAM_LIB]
set_db lef_library [list $TECH_LEF $CELL_LEF]

# 2. RTL Read & Elaborate
read_hdl -sv [glob rtl/*.sv]
elaborate soc_top

# 3. Structural Sanity Gate
check_design -unresolved
check_design -multiple_driver

# 4. SDC & Clocks
read_sdc sdc/soc_top.sdc
report_clocks
check_timing -lint

# 5. Low-Power Clock Gating & SAIF Ingestion
set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 4
read_saif -instance tb_top/u_core -scale_to_sdc_frequency sim/workload.saif

# 6. MMMC Active Views
set_analysis_view -setup [list av_func_slow] -hold [list av_func_fast]

# 7. Synthesis layers — map BEFORE scan conversion
syn_generic
syn_map
# DFT: configure test clocks / scan style, then:
# convert_to_scan
# define_scan_chain ...   ;# project-specific
syn_opt -physical

# 8. Netlist Sanitization & Cleanup
set_db remove_assigns true
remove_assigns_without_opt -design soc_top -verbose
add_tieoffs -high TIEHI -low TIELO -max_fanout 8 soc_top

# 9. Final Signoff & Handoff
report_qor > reports/final_qor.rpt
report_power -by_category -unit mW > reports/final_power.rpt
check_design -status

write_hdl > outputs/soc_top_mapped.v
write_sdc > outputs/soc_top_mapped.sdc
write_db -common -design soc_top db/soc_top_innovus.db`,
    },
    commonPitfalls: [
      "Calling convert_to_scan before syn_map — scan needs mapped sequential Liberty cells (see dft-01).",
      "Executing physical iSpatial synthesis without linking technology LEF rules, causing invalid placement assumptions.",
      "Omitting 'remove_assigns_without_opt' prior to Innovus physical handoff.",
    ],
    interviewerFollowups: [
      "Why does Cadence recommend 'write_db -common' over separate Verilog netlists and DEF for Innovus handoff?",
      "How does iSpatial predict routing congestion before actual detail routing is executed in Innovus?",
    ],
    tags: ["synthesis-flow", "rtl-to-gds", "cadence-genus", "signoff-checklist", "15-stage-flow"],
  },

  // 🛡️ DOMAIN: DFT, SCAN CHAINS & ATPG TESTABILITY
  {
    id: "dft-01",
    isFreeSample: true,
    domain: "dft-atpg",
    domainName: "DFT, Scan & Testability",
    role: "Senior DFT / RTL-to-GDS & Synthesis Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Explain the architecture of a Muxed-D Scan Flip-Flop, and analyze the timing impact of scan insertion on functional paths versus shift mode. Why is 'set_case_analysis 0 [get_ports scan_en]' mandatory in functional STA, and when should scan conversion occur in the synthesis flow?",
    shortSummary: "A Muxed-D scan flop places a 2:1 multiplexer before the master latch D input. This introduces an intrinsic setup penalty on the functional datapath. In functional STA, asserting scan_en=0 disables the false scan shift arc; scan conversion is executed after logic mapping to preserve cell choices.",
    detailedAnswer: `### 1. Architecture of a Muxed-D Scan Flip-Flop:
In manufacturing test, standard functional flip-flops cannot be directly controlled or observed from primary chip I/O pins without thousands of clock cycles:
- A **Muxed-D Scan Flip-Flop (Scan-DFF)** replaces standard DFFs by integrating a 2-to-1 multiplexer directly inside the standard cell boundary ahead of the master latch:
  - **Port D**: Functional data input.
  - **Port SI (Scan-In)**: Serial test scan input.
  - **Port SE (Scan-Enable / Shift-Enable)**: Control select pin ($SE = 0$ selects functional D, $SE = 1$ selects test SI).
  - **Port Q / SO**: Data output / Scan-Out.

### 2. Physical & Timing Impact on the Functional Datapath:
1. **The Functional Timing Penalty**:
   Because the multiplexer sits directly in front of the master latch:
   - **Internal Setup Time Penalty**: Data arriving on the D pin must propagate through the internal transmission gate / mux before reaching the latch. This increases setup time ($T_{\\text{setup,scan}} > T_{\\text{setup,std}}$) by approximately **$15\\,\\text{ps}$ to $40\\,\\text{ps}$**.
   - **Clock-to-Q Delay ($T_{\\text{cq}}$)**: Buffering the internal state to drive both Q and serial SO can slightly increase cell delay and load.
   - **Silicon Area & Power Overhead**: A scan flip-flop consumes approximately **$15\\%$ to $25\\%$ more silicon area** and higher internal capacitance than an unmapped DFF.
2. **The Functional STA Requirement**:
   During functional Static Timing Analysis, the serial scan shift paths must NOT be timed as active functional paths:
   \`set_case_analysis 0 [get_ports scan_enable]\`
   This statically propagates logic 0 onto the SE multiplexer select line, disabling the SI-to-Q timing arcs and preventing false violations on scan routing.

### 3. Chronological Placement in Synthesis:
In modern Cadence Genus flows, **\`convert_to_scan\`** is executed **after generic optimization and initial mapping (\`syn_map\`)**:
- Running scan conversion prior to Boolean optimization prevents arithmetic resource sharing (e.g. adder/multiplier sharing).
- Performing scan replacement after initial mapping ensures Genus selects the optimal drive strength and Vt variant (HVT/SVT/LVT) for each scan flip-flop.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Functional Mapping First:
syn_generic
syn_map

# 2. Ingest Test Configuration & Check Rules:
define_test_clock -name TCK -period 50000 [get_ports test_clk]
check_dft_setup
check_dft_rules -advanced -verbose > reports/dft_rules.rpt

# 3. Convert Functional Flops to Scan Equivalent Flops:
convert_to_scan -design soc_top

# 4. In Functional SDC Mode, Force Scan Enable Inactive:
set_case_analysis 0 [get_ports pad_scan_en]
set_case_analysis 0 [get_ports pad_test_mode]

# 5. Verify Scannable Register Count:
report_scan_registers > reports/scannable_flops.rpt`,
    },
    commonPitfalls: [
      "Running functional STA without 'set_case_analysis 0' on scan_en, causing thousands of false timing violations across serial scan chains.",
      "Executing scan conversion before initial logic mapping, which disrupts Boolean restructuring and arithmetic sharing.",
      "Ignoring the 20ps setup time penalty on timing-critical paths when budgeting pre-synthesis clock periods.",
    ],
    interviewerFollowups: [
      "How does Level-Sensitive Scan Design (LSSD) avoid the multiplexer delay penalty inherent in Muxed-D scan flops?",
      "What happens if a clock-gating integrated cell (ICG) does not have its test-control pin tied to scan_en?",
    ],
    tags: ["muxed-d-flop", "convert-to-scan", "scan-enable", "case-analysis", "timing-penalty", "dft"],
  },

  {
    id: "dft-02",
    domain: "dft-atpg",
    domainName: "DFT, Scan & Testability",
    role: "Senior DFT / RTL-to-GDS & Synthesis Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Why do multi-clock scan chains crossing asynchronous domains or opposite clock edges inevitably fail scan shift hold timing? Derive the operation of a Lockup Latch, and explain where and how Cadence Genus inserts it.",
    shortSummary: "During scan shift, large clock skew between different clock domains or opposite edges causes data from the launch flop to race into the capture flop within the same shift cycle. An active-low lockup latch delays data by half a clock period, guaranteeing clean hold closure.",
    detailedAnswer: `### 1. The Catastrophic Scan Shift Race Condition:
During scan shift mode, flip-flops across the entire chip are stitched into serial shift registers:
$$FF_1 \\xrightarrow{\\text{Q } \\to \\text{ SI}} FF_2$$
- In functional mode, $FF_1$ and $FF_2$ might belong to independent clock domains with no direct datapath.
- In scan mode, however, they share an ultra-fast serial wire connection with **zero combinational logic delay** ($T_{\\text{comb}} \\approx 0$).
- **The Failure Mechanism (Clock Skew)**:
  Suppose $FF_1$ is clocked by $CLK_A$ and $FF_2$ is clocked by $CLK_B$.
  - Due to physical clock tree insertion delay differences across the die, clock edge $CLK_B$ may arrive significantly later than $CLK_A$ (positive clock skew $T_{\\text{skew}} = T_{\\text{clkB}} - T_{\\text{clkA}} > 0$).
  - For hold timing on the scan chain:
    $$T_{\\text{cq}} + T_{\\text{wire}} \\ge T_{\\text{hold}} + T_{\\text{skew}}$$
  - Because $T_{\\text{wire}} \\approx 0$, any positive clock skew larger than cell clock-to-Q ($T_{\\text{skew}} > 80\\,\\text{ps}$) causes $FF_1$ new data to **overwrite $FF_2$ before $FF_2$ can sample its previous state**!
  - The scan chain is permanently corrupted, halting all manufacturing test on tester hardware!

### 2. Mathematical Solution: The Lockup Latch:
To eliminate hold races across clock domain boundaries or posedge-to-negedge transitions, a **Lockup Latch** is inserted at the tail of the driving clock domain:
- **Lockup Latch Architecture**:
  An active-low, level-sensitive latch controlled by the driving clock ($CLK_A$):
  \`FF1 (posedge CLK_A) -> Latch (active-low CLK_A) -> FF2 (posedge CLK_B)\`
- **Waveform Operation**:
  1. At $t = 0$ (posedge $CLK_A$), $FF_1$ launches new data.
  2. Because $CLK_A = 1$, the active-low latch is **closed (opaque)**! The new data cannot pass.
  3. At $t = T/2$ (negedge $CLK_A$), $CLK_A$ falls to 0. The latch **opens (transparent)** and captures $FF_1$ data.
  4. At $t = T$ (next posedge $CLK_B$), $FF_2$ samples the data held steady by the lockup latch.
- **Hold Margin Created**:
  The lockup latch guarantees that data transitions occur **half a clock period ($T/2 \\approx 25\\,\\text{ns}$ at $20\\,\\text{MHz}$ shift)** after the launch clock edge!
  $$\\text{Hold Slack} \\approx \\frac{T_{\\text{shift}}}{2} - T_{\\text{skew}} \\gg 0$$
  This creates massive, unbreakable hold timing margin against any physical clock tree skew.

### 3. Cadence Genus Implementation:
Genus automatically manages lockup latch insertion during chain stitching:
\`define_scan_chain -name chain_0 -terminal_lockup true\`
\`connect_scan_chains -include_opcg_segments\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Configure Automatic Lockup Latch Insertion:
set_db dft_mix_clock_edges_in_scan_chains true
set_db dft_lockup_element_type latch
set_db dft_lockup_cell_name [get_db lib_cells *LATCH*]

# 2. Define Scan Chain with Terminal Lockup at Domain Boundary:
define_scan_chain -name CORE_CHAIN_0 \
  -sdi [get_ports pad_scan_in_0] \
  -sdo [get_ports pad_scan_out_0] \
  -shift_enable [get_ports pad_scan_en] \
  -terminal_lockup true \
  -max_length 500

# 3. Stitch Scan Chains with Multi-Domain Safety:
connect_scan_chains -preview
connect_scan_chains -pack

# 4. Audit Inserted Lockup Elements:
report_scan_chains -include_lockup_elements > reports/scan_lockups.rpt`,
    },
    commonPitfalls: [
      "Stitching multi-clock domains into a single scan chain without lockup latches, resulting in unfixable hold failures on tester hardware.",
      "Using an active-high latch instead of an active-low latch for posedge-to-posedge domain crossings.",
      "Placing the lockup latch near the receiving flop instead of near the launching domain boundary, inducing physical routing congestion.",
    ],
    interviewerFollowups: [
      "What is the difference between a terminal lockup latch and an internal domain-crossing lockup latch?",
      "Why are lockup latches preferred over inserting large delay buffer chains to fix shift hold violations?",
    ],
    tags: ["lockup-latch", "multi-clock-scan", "shift-hold-race", "clock-skew", "dft-signoff"],
  },

  {
    id: "dft-03",
    domain: "dft-atpg",
    domainName: "DFT, Scan & Testability",
    role: "Senior DFT / RTL-to-GDS & Synthesis Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Contrast Launch-off-Capture (LOC / Broadside) versus Launch-off-Shift (LOS / Skewed-Load) for at-speed transition fault testing. Why does LOS require expensive at-speed Shift Enable (SE) routing, and how does On-Product Clock Generation (OPCG) enable multi-GHz at-speed testing in Cadence Genus?",
    shortSummary: "LOS launches faults via the last shift clock pulse, requiring SE to switch at full functional speed. LOC launches faults via a functional capture pulse while SE stays low, allowing slow SE routing. OPCG synthesizes high-speed capture pulses on-chip from internal PLLs.",
    detailedAnswer: `### 1. The Need for At-Speed Testing:
Static stuck-at fault testing (SA0/SA1) verifies DC gate connectivity at slow tester frequencies ($10\\,\\text{MHz}$ to $50\\,\\text{MHz}$).
- However, modern sub-5nm silicon defects (high-resistance vias, slow gate transitions, crosstalk delay) only fail when the chip runs at its **full rated gigahertz operating frequency** ($F_{\\text{max}}$).
- **Transition Delay Fault (TDF)** testing requires a **two-pulse test pattern**:
  1. **Launch Pulse**: Initializes the transition ($0 \\to 1$ or $1 \\to 0$).
  2. **Capture Pulse**: Latches the resulting signal exactly one functional clock period ($T_{\\text{func}}$) later.

### 2. Launch-off-Shift (LOS) vs Launch-off-Capture (LOC):
| Characteristic | Launch-off-Shift (LOS / Skewed Load) | Launch-off-Capture (LOC / Broadside) |
|---|---|---|
| **Launch Mechanism** | The last shift pulse on SI launches the transition ($SE = 1$). | A functional clock pulse launches data through the functional logic cone ($SE = 0$). |
| **Capture Mechanism** | Functional clock pulse captures data ($SE = 0$). | Second functional clock pulse captures data ($SE = 0$). |
| **Shift Enable (SE) Requirement** | **AT-SPEED SE REQUIRED**. SE must drop from $1 \\to 0$ in less than one functional cycle ($< 1.0\\,\\text{ns}$)! | **SLOW SE ALLOWED**. SE can transition from $1 \\to 0$ over hundreds of nanoseconds during tester dead-time. |
| **Physical Implementation Penalty** | Requires massive balanced clock-tree-like buffer trees on \`scan_en\`, exploding silicon area. | Standard routing on \`scan_en\`. Much lower area and routing overhead. |
| **ATPG Fault Coverage** | Slightly higher coverage (more state controllability via SI). | Slightly lower coverage (launch state constrained by functional logic). |
| **Industry Preference** | Rarely used due to at-speed SE cost. | **Industry Standard for 95%+ of SoC tape-outs**. |

### 3. On-Product Clock Generation (OPCG):
External ATE testers cannot supply low-jitter 3 GHz clock pulses through mechanical probe cards and package pins:
- **OPCG Architecture**:
  Cadence Genus instruments on-chip PLL clock controllers:
  - During test capture, OPCG gates the free-running PLL to emit a precise **two-pulse burst** (Launch + Capture) directly at the internal register clock pins.
  - Genus configures OPCG via:
    \`convert_to_opcg_scan\`
    \`report_opcg_clock_domain_info\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Configure On-Product Clock Generation (OPCG) in Genus:
set_db dft_opcg_mode true
set_db dft_at_speed_style loc

# 2. Define Functional Fast Clocks for Capture:
create_clock -name CLK_CORE -period 2.000 [get_ports pad_clk]

# 3. Define Test Clocks for Slow Shift:
define_test_clock -name TCK_SLOW -period 50000 [get_ports test_clk]

# 4. Convert Design with OPCG Support:
convert_to_opcg_scan -design soc_top

# 5. Audit OPCG Equivalents & Clock Domain Relationships:
report_opcg_clock_domain_info > reports/opcg_domains.rpt
report_opcg_equivalents        > reports/opcg_equivalents.rpt`,
    },
    commonPitfalls: [
      "Selecting Launch-off-Shift (LOS) without realizing it requires buffering the scan_en network like a primary clock tree.",
      "Failing to account for dead-time cycles required for SE to settle before asserting at-speed LOC capture pulses.",
      "Overlooking tester power supply current (di/dt) spikes during simultaneous full-chip capture pulses.",
    ],
    interviewerFollowups: [
      "How does scan pattern power reduction (low-power ATPG) prevent false IR-drop induced timing failures during at-speed capture?",
      "Why is functional clock gating (ICG) typically forced ON during scan shift but enabled during LOC capture?",
    ],
    tags: ["loc", "los", "at-speed-testing", "opcg", "broadside", "transition-faults"],
  },

  {
    id: "dft-04",
    domain: "dft-atpg",
    domainName: "DFT, Scan & Testability",
    role: "Senior DFT / RTL-to-GDS & Synthesis Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "How does on-chip Scan Compression resolve the tester pin-count bottleneck? Explain the mathematical architecture of a Decompressor and Compactor, and analyze how unknown (X) states compromise compaction integrity.",
    shortSummary: "Scan compression uses an on-chip decompressor (PRPG/broadcaster) and compactor (XOR tree/MISR) to drive hundreds of internal scan channels from a few external tester channels, slashing tester time and cost. Unknown X-states corrupt XOR compactors and must be masked.",
    detailedAnswer: `### 1. The Tester Memory & Cost Crisis:
Modern SoCs contain over 2 million flip-flops:
- Without compression, if an external tester provides only 8 scan channels:
  $$\\text{Chain Length} = \\frac{2{,}000{,}000\\,\\text{flops}}{8\\,\\text{channels}} = 250{,}000\\,\\text{cycles per pattern}!$$
- Testing 5,000 patterns would take **minutes per chip**, rendering high-volume consumer silicon economically unviable!
- **The Compression Principle**:
  Scan compression embeds on-chip logic between narrow external tester pins ($N_{\\text{ext}} = 8$) and wide internal scan chains ($N_{\\text{int}} = 800$):
  $$\\text{Compression Ratio} = \\frac{N_{\\text{int}}}{N_{\\text{ext}}} = 100\\times$$
  The chain length collapses from $250{,}000$ to $2{,}500$ cycles, slashing test time by **$99\\%$**!

### 2. Mathematical Decompressor & Compactor Architecture:
1. **The Decompressor (Broadcaster / LFSR)**:
   - Takes $N_{\\text{ext}}$ external inputs and expands them into $N_{\\text{int}}$ internal scan inputs using a linear network of combinational XOR gates or a Pseudo-Random Pattern Generator (PRPG).
   - *Mathematical Basis*: ATPG patterns have **$<2\\%$ care-bits** (specified bits required to detect a fault); $98\\%$ are don't-cares ($X$). The decompressor easily satisfies linear equation sets for the $2\\%$ care-bits.
2. **The Compactor (XOR Network / MISR)**:
   - Condenses $N_{\\text{int}}$ internal scan outputs down into $N_{\\text{ext}}$ external test channels using an XOR tree or Multiple-Input Signature Register (MISR).

### 3. The Threat of Unknown ($X$) States:
In silicon, certain circuits produce non-deterministic digital values ($X$):
- Uninitialized SRAM outputs, floating three-state buses, analog macro outputs, and asynchronous clock crossings.
- **The Compaction Disaster**:
  Because $X \\oplus 0 = X$ and $X \\oplus 1 = X$:
  - A single $X$ state entering an XOR compactor **poisons the entire output channel**, masking real physical fault signatures!
- **Cadence Genus Remedy**:
  Genus and Cadence Modus incorporate **$X$-Masking Logic**:
  - Dynamically disables internal channels emitting known $X$-states during specific scan cycles before they reach the XOR compactor.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 1. Analyze Design Compressibility:
analyze_scan_compressibility -design soc_top
report_scan_compressibility  > reports/compressibility.rpt

# 2. Synthesize On-Chip Scan Compression Logic:
compress_scan_chains \
  -ratio 50 \
  -external_scan_chains 8 \
  -mask_unknowns true \
  -design soc_top

# 3. Report Compression Architecture & Logic Insertion:
report_scan_compression_logic > reports/compression_logic.rpt

# 4. Export Compression Handoff Macros:
write_dft_compression_macro -design soc_top -base_name outputs/dft_comp`,
    },
    commonPitfalls: [
      "Failing to block uninitialized SRAM outputs or analog signals from entering scan chains, creating X-states that blind the compactor.",
      "Over-compressing (>150x) when test pattern care-bit density is high, causing ATPG pattern inflation that negates test time savings.",
      "Omitting bypass mode (direct uncompressed shift) required for post-silicon failure diagnostics.",
    ],
    interviewerFollowups: [
      "Why is a scan bypass mode strictly required on silicon test chips alongside scan compression?",
      "How does an on-chip MISR signature differ from a combinational XOR compactor in terms of ATE pattern diagnostics?",
    ],
    tags: ["scan-compression", "decompressor", "compactor", "x-masking", "care-bits", "dft"],
  },

  {
    id: "dft-05",
    domain: "dft-atpg",
    domainName: "DFT, Scan & Testability",
    role: "Senior DFT / RTL-to-GDS & Synthesis Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Walk through the Cadence Genus Test Design Rule Checking (TDRC) audit and the generation of physical ScanDEF, ATPG models, and MMMC scan constraints. What physical defects occur if Innovus reorders scan chains without valid ScanDEF data?",
    shortSummary: "TDRC audits clock/reset controllability before scan stitching. Handoff requires ScanDEF for physical wire-length reordering in Innovus, ATPG models for fault pattern generation, and MMMC scan constraint modes. Missing ScanDEF causes massive wire routing congestion and hold violations.",
    detailedAnswer: `### 1. Test Design Rule Checking (TDRC) Audits:
Before scan chains can be physically stitched, Genus executes comprehensive TDRC:
\`check_dft_rules -advanced -verbose\`
- **Rule Check 1: Clock Controllability (D1/C1 Rules)**:
  Every scannable register must receive a clock that is directly controllable from primary test pins.
- **Rule Check 2: Asynchronous Set/Reset Controllability (D2/R1 Rules)**:
  Flop asynchronous reset/set pins must remain permanently inactive during scan shift mode. If an internal reset net can glitch during shift, the chain will prematurely reset!
  - *Fix*: Inset test multiplexers or control points via \`fix_dft_violations\`.

### 2. The Critical Physical Role of ScanDEF:
In synthesis, scan chains are stitched logically based on schematic or alphabetized netlist ordering:
- Flop A in the bottom-left corner of the die may be connected to Flop B in the top-right corner ($10\\,\\text{mm}$ away)!
- **The Innovus Scan Reordering Solution**:
  Innovus physical P&R performs **Physical Scan Reordering**:
  - After standard cell placement is finalized, Innovus re-orders serial scan connections so each flop stitches to its nearest physical neighbor.
  - This reduces total chip scan wire length by over **$80\\%$**!
- **The Catastrophic Consequence of Missing ScanDEF**:
  If synthesis hands off a netlist without \`write_scandef\`:
  - Innovus cannot identify which pins are scan inputs/outputs.
  - The physical router is forced to route long, meandering $10\\,\\text{mm}$ global wires between un-ordered flops, resulting in severe **routing congestion, DRC shorts, and uncontrollable hold violations**!

### 3. Production Signoff Handoff Suite:
A clean DFT signoff generates four mandatory production deliverables:
1. **ScanDEF File (\`write_scandef\`)**: Handed off to Innovus P&R defining scan groups, chains, and re-orderable segments.
2. **ATPG Model & Flow Scripts (\`write_dft_atpg\`)**: Testbench, fault model, and run scripts for Cadence Modus / Synopsys TetraMAX.
3. **Scan SDC Constraints (\`write_dft_constraints\`)**: Constraint modes defining slow shift clocks, exclusive groups, and SE asserted.
4. **Boundary Scan BSDL (\`write_dft_bsdl\`)**: IEEE 1149.1 JTAG board-level boundary scan description.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus DFT Signoff & Handoff Script:
# 1. Comprehensive Test Design Rule Checking (TDRC):
check_dft_setup
check_dft_rules -advanced -verbose > reports/tdrc_rules.rpt
report_dft_violations > reports/tdrc_violations.rpt

# 2. Automated Violation Resolution:
fix_dft_violations -design soc_top
fix_scan_path_inversions -design soc_top

# 3. Stitch Final Scan Chains:
connect_scan_chains -auto_create_chains -pack -design soc_top

# 4. Generate Signoff Handoff Deliverables:
# A. Physical ScanDEF for Innovus P&R:
write_scandef > handoff/pnr/soc_top_scan.scandef

# B. ATPG Pattern Generation Deliverables for Cadence Modus:
write_dft_atpg -directory handoff/atpg/ -base_name soc_top_atpg

# C. SDC Scan Timing Constraints:
write_dft_constraints -mode scan > handoff/sdc/soc_top_scan_mode.sdc

# D. IEEE 1149.1 JTAG BSDL:
write_dft_bsdl -output handoff/bsdl/soc_top.bsdl`,
    },
    commonPitfalls: [
      "Handing off netlists to Innovus without ScanDEF, resulting in massive routing congestion from un-ordered global scan wires.",
      "Leaving internal asynchronous resets unconstrained, causing scan chains to randomly reset during shift.",
      "Forgetting to verify that ATPG test models match post-synthesis gate netlists via formal LEC.",
    ],
    interviewerFollowups: [
      "How does Innovus preserve scan chain functional integrity when swapping standard cells during post-placement optimization?",
      "What is the difference between an inverting scan chain and a non-inverting scan chain in terms of ATPG fault simulation?",
    ],
    tags: ["tdrc", "scandef", "atpg", "innovus-handoff", "scan-reordering", "dft-signoff"],
  },

  // 🟢 DOMAIN: PHYSICAL DESIGN & ECO METHODOLOGY
  {
    id: "eco-01",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal Physical Design & Signoff Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the end-to-end engineering methodology for Functional ECOs vs Timing-Only ECOs in advanced sub-7nm silicon tapeouts. How do you execute spare cell allocation, manual netlist rewiring (disconnect/connect), incremental re-synthesis, and guarantee zero regressions across Formal Equivalence (LEC), DFT scan chains, UPF power intent, and MMMC signoff?",
    shortSummary: "Functional ECOs alter the Boolean truth table using spare cells or local incremental re-synthesis, requiring rigorous Conformal LEC signoff, scan chain integrity preservation, and multi-corner MMMC timing closure without disturbing frozen layout.",
    detailedAnswer: `### 1. Functional ECO vs. Timing-Only ECO Architecture:
In production ASIC flows, Engineering Change Orders (ECOs) arrive late in the design cycle after layout freeze or even after base masks have been fabricated:
1. **Timing-Only ECO (Non-Functional)**:
   - Modifies cell sizes (drive strengths), swaps threshold voltage ($V_t$) flavors (ULVT / LVT / RVT / HVT), inserts repeaters, or fine-tunes clock tree skews.
   - **Boolean Logic Invariance**: Does NOT change the state graph or combinational truth table.
   - **Verification**: Golden formal equivalence check (Conformal LEC) passes trivially as identical logic cones.
2. **Functional ECO (Logic Bug Fix)**:
   - Directly alters logic functionality (e.g. fixing an FSM corner-case deadlock, patching an interrupt register mask, or qualifying a bus request).
   - Must be implemented with minimal structural disturbance to avoid invalidating months of place-and-route optimization.

---

### 2. Pre-Mask vs. Post-Mask (Metal-Only) ECOs:
| Attribute | Pre-Mask ECO | Post-Mask (Metal-Only) ECO |
|---|---|---|
| **Silicon Status** | Netlist frozen; GDSII not yet written to mask reticles. | Base layers (Diffusion, Poly, Contacts, Metal 1-2) already etched in silicon fab! |
| **Permitted Layers** | Any cell can theoretically be moved or inserted, but localized changes are prioritized. | **ZERO base layer modifications allowed!** Only upper routing metal layers (e.g. Metal 3+) can change. |
| **Cell Harvesting** | Insert new standard cells into available white space. | **Must harvest pre-placed spare cells** (floating NAND, NOR, Inverters, Flops distributed across the floorplan). |
| **Cost / Turnaround** | Low fab mask cost; ~1 week physical iteration. | Saves millions of dollars ($3M-$5M+) and 3-4 months fab turnaround time by modifying only metal masks. |

---

### 3. Cadence Genus / Innovus Manual Netlist ECO Rewiring:
When performing manual netlist edits in Cadence Common UI (CUI):
\`\`\`tcl
# 1. Disconnect faulty driver net from flop D-pin:
disconnect [get_pins u_ctrl/u_fsm/state_reg/D]

# 2. Instantiate a harvested spare cell (e.g. 2-input AND gate):
# In post-mask, convert an existing uncommitted spare instance:
set spare_inst [get_db insts u_spare_core/spare_gate_42]

# 3. Rewire inputs and output:
connect [get_pins $spare_inst/A] [get_nets u_ctrl/u_fsm/patch_qualifier]
connect [get_pins $spare_inst/B] [get_nets u_ctrl/u_fsm/original_data_net]
connect [get_pins $spare_inst/Y] [get_pins u_ctrl/u_fsm/state_reg/D]

# 4. Tie off any unused inputs of multi-input spare cells to avoid floating gate leakage:
connect -constant 1 [get_pins $spare_inst/C]
\`\`\`

---

### 4. The 5-Pillar Golden Signoff Verification Triad:
Any ECO must satisfy five non-negotiable criteria before mask release:
1. **Conformal LEC Golden Formal Equivalence**:
   - Compare Revised RTL (containing the bug fix) against the ECO Netlist.
   - Run in \`set_mode eco\` to ensure that only the targeted logic cone differs from the old netlist, while evaluating to **100% equivalent** against the new golden RTL.
2. **DFT Scan Chain Non-Breakage Audit**:
   - Verify that no manual netlist rewiring bypassed or broke serial scan chain connections.
   - If an ECO introduces a new state register, it must either be added to a spare scan chain segment or constrained as functional-only.
3. **UPF & Low-Power Intent Audit**:
   - Verify that newly connected spare cells reside in the matching power domain (e.g. do not drive an un-isolated net from a switchable domain into an always-on domain).
4. **MMMC Signoff Timing Verification**:
   - Re-evaluate setup and hold across all active MMMC views. Spare cells often have longer interconnect routes, requiring careful hold buffer insertion.
5. **Physical DRC / LVS Signoff**:
   - Verify clean design-rule checks with zero antenna violations or short circuits on modified metal layers.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus / Innovus Industrial ECO Verification Flow:
# 1. Audit pre-ECO baseline timing:
report_timing -late -max_paths 5 > reports/pre_eco_setup.rpt
report_timing -early -max_paths 5 > reports/pre_eco_hold.rpt

# 2. Freeze all non-ECO partitions to prevent tool drift:
set_db [get_db insts -if {.name != "u_patch_block*"}] .preserve true

# 3. Perform localized incremental optimization:
syn_opt -incremental

# 4. Check that preserved hierarchy remained bit-exact:
check_design -preserved

# 5. Export ECO netlist and Conformal LEC compare dofile:
write_hdl > outputs/soc_top_eco.v
write_do_lec -golden_design soc_top_gold -revised_design outputs/soc_top_eco.v \
  -output_file outputs/run_conformal_eco.do`,
    },
    commonPitfalls: [
      "Running global syn_opt or unconstrained placement during an ECO, triggering ripple optimizations that displace thousands of already-timed cells.",
      "Harvesting spare cells without checking their physical proximity to the bug cone, creating massive wire delay that induces unfixable setup violations.",
      "Leaving unused spare cell inputs floating, causing high gate-oxide leakage and indeterminate floating-MOSFET states.",
    ],
    interviewerFollowups: [
      "In a post-mask ECO where no spare flip-flops are located near your logic patch, what circuit techniques allow capturing new state?",
      "How does Conformal LEC identify non-equivalent points specifically isolated to the ECO bounding box?",
    ],
    tags: ["eco", "functional-eco", "timing-eco", "spare-cells", "conformal-lec", "genus-cui"],
  },

  {
    id: "eco-02",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Lead Synthesis & Implementation Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Deep-dive into Cadence Genus 'syn_opt -incremental' vs 'syn_opt -spatial' optimization engines. How do netlist freeze attributes ('.preserve true', 'set_dont_touch', 'set_dont_use') operate under the hood, and how do you guarantee that completed partitions, analog macros, and CDC synchronizers remain bit-exact across iterative synthesis passes?",
    shortSummary: "syn_opt -incremental refines logic locally without global restructuring, while -spatial uses physical DEF coordinates for Steiner wire estimation. Netlist freeze attributes (.preserve true) prevent the engine from optimizing away critical multi-flop synchronizers or analog boundary cells.",
    detailedAnswer: `### 1. Genus Optimization Engine Mechanics:
During complex SoC implementation, engineers choose between three distinct optimization scopes in Cadence Common UI:
1. **Full Global Optimization (\`syn_opt\`)**:
   - Initial synthesis pass from generic mapped gates.
   - Performs aggressive global Boolean structuring, boundary optimization, register retiming, and full-effort mapping.
   - Highly disruptive: modifies gate counts, net names, and logical hierarchy.
2. **Incremental Optimization (\`syn_opt -incremental\`)**:
   - Focuses strictly on fixing timing (WNS/TNS) and design-rule violations (DRVs: max_transition, max_capacitance).
   - Operations are constrained to local cell resizing (upsizing/downsizing), pin swapping, logic duplication for high-fanout nets, and localized buffer insertion.
   - Preserves existing netlist structure and wire topologies.
3. **Spatial (Physical-Aware) Optimization (\`syn_opt -spatial\`)**:
   - Operates inside Cadence iSpatial technology.
   - Reads floorplan DEF, macro placements, and standard cell row definitions.
   - Uses real Steiner-tree wire approximations rather than statistical wireload models (WLM).
   - Resolves physical routing congestion hotspots and pin density bottlenecks before handing off to Innovus.

---

### 2. Netlist Freeze Directives & Attribute Behavior:
To prevent synthesis passes from destroying hand-crafted logic, Cadence CUI provides distinct protection mechanisms:

| Directive / Attribute | Target Scope | Engine Behavior | Primary Use Cases |
|---|---|---|---|
| \`set_db <inst> .preserve true\` | Instances / Nets | Tool will never delete, merge, unmap, or retime the instance. Pin connections remain stable, but cell resizing may be permitted if specified. | CDC synchronizers, glitch filters, reset trees, debug shadow registers. |
| \`set_dont_touch <obj>\` | Modules, Instances, Nets | Absolute lockdown: engine cannot resize, buffer, swap pins, or modify anything inside the marked scope. | Hard IP blocks (PLLs, SerDes PHYs, SRAMs), completed digital partitions. |
| \`set_dont_use <cell>\` / \`.dont_use true\` | Library Cells (libcells) | Prevents the synthesis mapping engine from choosing specific cells from the target \`.lib\`. | Banning delay cells prone to hold races, ultra-low-drive cells, or leaky LVT gates. |

---

### 3. Preserving Critical CDC Synchronizers:
A classic synthesis bug occurs when a two-flop synchronizer is synthesized without protection:
- If the tool perceives that the $D$-input of the first flop and the second flop have no functional combinational logic between them, an aggressive optimization engine might attempt to merge or retime them!
- **Mandatory Synthesis Signoff Command**:
\`set_db [get_db insts *sync*reg*] .preserve true\`
- Run \`check_design -preserved\` to generate a verification audit confirming all synchronizers are safely locked.
- Run \`write_preserves -output handoff/cdc_preserves.tcl\` to transfer the exact preservation constraints directly to downstream Innovus P&R.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus Freeze & Incremental Optimization Script:
# 1. Protect all CDC synchronizers and reset synchronizers:
set cdc_insts [get_db insts *sync_reg*]
set_db $cdc_insts .preserve true
puts "Preserved [llength $cdc_insts] CDC synchronizer instances."

# 2. Lock down completed analog PHY interfaces:
set_dont_touch [get_db modules ddr_phy_top]

# 3. Exclude unreliable or leaky library cells:
set_db [get_db lib_cells */HOLD_DELAY_X1] .dont_use true
set_db [get_db lib_cells */ULVT_*] .dont_use true

# 4. Audit active preservation rules:
check_design -preserved

# 5. Run Physical-Aware Spatial Synthesis with Innovus DEF:
read_def floorplan/soc_top_placed.def
syn_opt -spatial

# 6. Execute localized incremental timing recovery:
syn_opt -incremental

# 7. Export preservation constraints for Innovus handoff:
write_preserves > handoff/soc_preserves.tcl`,
    },
    commonPitfalls: [
      "Failing to apply .preserve true on CDC synchronizers, allowing the synthesis tool to merge back-to-back registers and destroy metastability protection.",
      "Applying set_dont_touch across entire submodules, preventing the tool from buffering high-fanout clock enables or fixing severe max-transition violations.",
      "Relying on legacy set_dont_touch attributes instead of CUI .preserve, which can cause unexpected behavior during multi-mode incremental opt.",
    ],
    interviewerFollowups: [
      "What is the difference between .preserve true and .preserve size_ok in Cadence Common UI?",
      "How does Genus iSpatial avoid cell overlap when inserting buffer trees during spatial optimization?",
    ],
    tags: ["incremental-opt", "ispatial", "preserve", "dont-touch", "dont-use", "genus-cui"],
  },

  // 🟡 DOMAIN: STATIC TIMING ANALYSIS & EXCEPTIONS
  {
    id: "eco-03",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal Static Timing & Signoff Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Derive from first principles why specifying 'set_multicycle_path N -setup' strictly requires 'set_multicycle_path (N-1) -hold'. Show the clock edge diagrams, prove how omitting the hold exception triggers catastrophic false hold violations in PnR, and explain when a hold multicycle exception needs a multiplier other than N-1.",
    shortSummary: "By default in STA, hold is checked one cycle prior to the setup capture edge. Relaxing setup to cycle N shifts the default hold check to cycle N-1 instead of cycle 0, creating a massive false multi-nanosecond hold violation. Applying -hold (N-1) pulls the hold check back to edge 0.",
    detailedAnswer: `### 1. The Fundamental Single-Cycle STA Baseline ($N = 1$):
In standard single-cycle synchronous timing analysis between registers clocked by the same clock ($T_{\\text{period}} = 2.0\,\\text{ns}$):
- **Setup Check**: Data launched at Launch Edge $0$ ($0\,\\text{ns}$) must arrive before Capture Edge $1$ ($2.0\,\\text{ns}$):
  $$T_{\\text{arrival}} = T_{\\text{launch}} + T_{cq} + T_{dp} \\le T_{\\text{capture}} - T_{\\text{setup}} = 2.0\,\\text{ns} - T_{\\text{setup}}$$
- **Hold Check**: Data launched at Launch Edge $0$ ($0\,\\text{ns}$) must NOT overwrite the data captured by the *previous* clock cycle at Capture Edge $0$ ($0\,\\text{ns}$):
  $$T_{\\text{arrival}} = T_{\\text{launch}} + T_{cq} + T_{dp} \\ge T_{\\text{capture}} + T_{\\text{hold}} = 0.0\,\\text{ns} + T_{\\text{hold}}$$
- **The Core Rule of STA Engines**:
  $$\\text{Default Hold Capture Edge} = \\text{Setup Capture Edge} - 1\,\\text{Clock Period}$$

---

### 2. What Happens When You Declare Setup MCP ($N = 2$):
Suppose an arithmetic accumulator takes two full clock cycles to settle ($4.0\,\\text{ns}$), qualified by an alternating clock enable:
\`\`\`tcl
set_multicycle_path 2 -setup -from [get_cells u_pipe_reg*] -to [get_cells u_accum_reg*]
\`\`\`
1. **The Setup Shift**:
   - The setup capture edge moves from Edge $1$ ($2.0\,\\text{ns}$) to Edge $2$ ($4.0\,\\text{ns}$).
   - The datapath now has $4.0\,\\text{ns}$ to propagate!
2. **The Catastrophic Default Hold Shift**:
   - Applying the engine's built-in rule:
     $$\\text{Default Hold Capture Edge} = \\text{Setup Capture Edge} - 1\,\\text{Period} = 4.0\,\\text{ns} - 2.0\,\\text{ns} = 2.0\,\\text{ns (Edge 1)}!$$
   - The tool now asserts: *“Data launched at Edge $0$ ($0\,\\text{ns}$) must NOT arrive before Edge $1$ ($2.0\,\\text{ns}$)”*!
3. **The Mathematical Disaster in PnR**:
   - Minimum datapath delay for fast paths is typically $T_{cq,\\min} + T_{dp,\\min} \\approx 0.15\,\\text{ns}$.
   - Required hold arrival time is:
     $$T_{\\text{required, hold}} = 2.0\,\\text{ns} + T_{\\text{hold}} = 2.0\,\\text{ns} + 0.05\,\\text{ns} = 2.05\,\\text{ns}$$
   - **Calculated Hold Slack**:
     $$\\text{Slack}_{\\text{hold}} = 0.15\,\\text{ns} - 2.05\,\\text{ns} = -1.90\,\\text{ns}!$$
   - **The PnR Tool Response**: The physical router sees a severe $-1.90\,\\text{ns}$ hold violation and blindly inserts **35+ hold delay buffers** into the datapath! This completely destroys silicon area and re-violates setup timing!

---

### 3. The Hold Correction: Why $N-1$ is Mandatory:
To correct this behavior, the designer must inform the STA engine to shift the hold capture edge back to Edge $0$:
\`\`\`tcl
set_multicycle_path 1 -hold -from [get_cells u_pipe_reg*] -to [get_cells u_accum_reg*]
\`\`\`
- The \`-hold\` parameter specifies the **number of clock cycles to shift the hold capture edge backward** relative to the default hold edge!
- Default hold edge was Edge $1$ ($2.0\,\\text{ns}$).
- Shifting backward by $1$ cycle brings the hold check back to:
  $$\\text{Hold Edge} = 2.0\,\\text{ns} - (1 \\times 2.0\,\\text{ns}) = 0.0\,\\text{ns (Edge 0)}!$$
- Now hold is verified at Edge $0$, ensuring fast data does not contaminate the previous data window.

---

### 4. General Formula & Non-$(N-1)$ Exceptions:
For same-frequency clocks:
$$\\text{Setup Multiplier} = N \\implies \\text{Hold Multiplier} = N - 1$$

**When Hold Multiplier is NOT $N - 1$**:
1. **Pipelined Multi-Cycle Transfers with Single-Cycle Hold**: If data changes every cycle but the capture register only latches every $N$ cycles, hold must be checked against the immediately subsequent launch edge ($0$ hold shift).
2. **Phase-Shifted or Multi-Frequency Clocks**:
   - Fast-to-Slow or Slow-to-Fast clock domain crossings with integer clock dividers:
   - In a Slow-to-Fast interface ($100\,\\text{MHz} \\rightarrow 400\,\\text{MHz}$), you must specify \`-start\` vs \`-end\` to define whether cycles are counted with respect to the source or destination clock.`,
    tclOrVerilogSnippet: {
      lang: "sdc",
      code: `# Correct Industry Signoff Multicycle Path Specification:
# Clock Period: clk = 2.0 ns (500 MHz)

# 1. Setup Exception: 3 clock cycles allowed for multiplier datapath:
set_multicycle_path 3 -setup \
  -from [get_cells u_core/u_mult/in_reg*] \
  -to   [get_cells u_core/u_mult/out_reg*]

# 2. Hold Exception: Shift hold capture edge backward by (3 - 1) = 2 cycles:
set_multicycle_path 2 -hold \
  -from [get_cells u_core/u_mult/in_reg*] \
  -to   [get_cells u_core/u_mult/out_reg*]

# 3. Verification Command: Audit MCP edges in Cadence Genus / Tempus:
report_timing -from [get_cells u_core/u_mult/in_reg*] \
              -to   [get_cells u_core/u_mult/out_reg*] \
              -path_type full_clock \
              -max_paths 1`,
    },
    commonPitfalls: [
      "Specifying set_multicycle_path N -setup without set_multicycle_path (N-1) -hold, causing PnR to insert dozens of redundant delay buffers to fix fictitious hold violations.",
      "Applying multicycle path exceptions to paths lacking explicit architectural enable signals, creating real silicon functional corruption.",
      "Misunderstanding the difference between -start and -end options when setting multicycle paths between divided clocks.",
    ],
    interviewerFollowups: [
      "In a slow-to-fast clock crossing (e.g. 100 MHz to 400 MHz), why does default multicycle setup move relative to the destination clock (-end)?",
      "How do you write a SystemVerilog Assertion (SVA) to formally prove that an enable signal satisfies a 2-cycle multicycle timing exception?",
    ],
    tags: ["multicycle-path", "mcp", "sta", "setup-slack", "hold-slack", "timing-exceptions"],
  },

  {
    id: "eco-04",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal Static Timing & Signoff Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Contrast 'set_false_path', 'set_clock_groups -asynchronous', and 'set_max_delay -ignore_clock_latency'. When is each appropriate, why is applying 'set_false_path' on Clock Domain Crossing (CDC) synchronizers an engineering disaster, and how does '-ignore_clock_latency' bound quasi-static signal transfers?",
    shortSummary: "set_clock_groups -asynchronous cuts timing across entire clock domains cleanly. set_false_path is for point-to-point non-functional paths. Applying false paths to CDC synchronizers causes uncontrollable physical routing skews; set_max_delay -ignore_clock_latency guarantees datapath-only delay bounds without clock skew dependencies.",
    detailedAnswer: `### 1. Comparison of Timing Disables & Delay Overrides:
In SDC timing constraints, designers have three primary tools to loosen or disable timing:

| Command | Scope | Mechanism | PnR Optimization Impact |
|---|---|---|---|
| \`set_clock_groups -asynchronous\` | **Domain-Wide** | Cuts all setup/hold timing checks between all clocks in specified groups. | Zero timing effort across domains; PnR ignores crossing timing but maintains internal domain CTS. |
| \`set_false_path\` | **Point-to-Point** | Ignores timing across paths matching \`-from\`, \`-to\`, or \`-through\` collections. | Tool assigns **zero timing cost** ($0\,\\text{effort}$); router can introduce unbounded physical wire delays! |
| \`set_max_delay <delay> -ignore_clock_latency\` | **Point-to-Point Datapath** | Replaces clock-period setup required time with a fixed maximum arrival delay, ignoring clock latency/skew. | Router enforces a strict datapath wire delay ceiling, preventing multi-bit bus skew and routing drift. |

---

### 2. Why 'set_false_path' on CDC Synchronizers is Fatal:
A common junior mistake is applying \`set_false_path\` across CDC synchronizers:
\`set_false_path -to [get_pins u_sync_reg[0]/D]\`

**The Catastrophic Physical Consequence**:
1. **Unbounded Wire Latency**:
   - Because the path has zero timing cost, the Innovus router will deprioritize it during placement and routing.
   - The transmitter flop might be placed in the bottom-left corner of the die, while the synchronizer flop is placed $12\,\\text{mm}$ away in the top-right corner!
   - The routing wire may meander across high-resistance lower metal layers with $8\,\\text{ns}$ of latency.
2. **Multi-Bit Bus Data Incoherency (Bus Skew)**:
   - In a quasi-static control bus or Gray-coded FIFO pointer crossing domains:
   - If Bit 0 routes in $0.4\,\\text{ns}$ while Bit 1 routes in $5.2\,\\text{ns}$, a single-bit Gray code transition will arrive as a **multi-bit illegal transition** at the destination!
   - The destination FIFO will miscalculate pointer depth, leading to FIFO underflow, overflow, and silent data corruption!
3. **The Industry Solution**:
   - Never use \`set_false_path\` for multi-bit CDC!
   - Enforce bounded datapath delay using \`set_max_delay -datapath_only\` or \`set_max_delay <T_src> -ignore_clock_latency\`.

---

### 3. Bounding Quasi-Static & Non-Clocked Interfaces:
Quasi-static signals are configuration registers written once during boot (e.g. from I2C, SPI, or PCIe configuration spaces) and read continuously by core logic:
- Because they do not toggle during mission mode, they do not need strict $1\,\\text{GHz}$ ($1.0\,\\text{ns}$) single-cycle closure.
- **Applying -ignore_clock_latency**:
\`set_max_delay 4.0 -ignore_clock_latency -from [get_cells u_cfg/reg*] -to [get_cells u_core/*]\`
- By ignoring clock network insertion delays, the constraint strictly limits datapath combinational delay:
  $$T_{\\text{arrival}} = T_{cq} + T_{dp} \\le 4.0\,\\text{ns}$$
- This prevents the synthesis engine from inserting power-hungry high-drive buffers while ensuring deterministic signal arrival.`,
    tclOrVerilogSnippet: {
      lang: "sdc",
      code: `# SDC Best Practices: False Paths vs Max Delay Bounds:

# ❌ POOR PRACTICE: Unbounded False Path on CDC:
# set_false_path -from [get_clocks clk_tx] -to [get_clocks clk_rx]

# ✅ INDUSTRY SIGNOFF: Clean Asynchronous Clock Groups:
set_clock_groups -asynchronous \
  -group [get_clocks clk_tx] \
  -group [get_clocks clk_rx]

# ✅ INDUSTRY SIGNOFF: Bounded Datapath Delay on Multi-Bit CDC Bus:
# Enforce that datapath delay across all bus bits is <= 1 source clock period (2.5 ns)
set_max_delay 2.5 -ignore_clock_latency \
  -from [get_cells u_tx_fifo/ptr_gray_reg*] \
  -to   [get_cells u_rx_fifo/sync_stage1_reg*]

# ✅ Legitimate set_false_path Use Case: Hard-reset pin
set_false_path -from [get_ports rst_n]`,
    },
    commonPitfalls: [
      "Using set_false_path to mask CDC timing violations, allowing physical routers to introduce massive multi-bit skew that corrupts Gray-coded FIFO pointers.",
      "Writing hundreds of point-to-point set_false_path commands between two clock domains instead of a single set_clock_groups -asynchronous command, inflating STA runtime.",
      "Forgetting -ignore_clock_latency on set_max_delay, which forces the tool to include clock skew calculations and causes unexpected timing violations.",
    ],
    interviewerFollowups: [
      "What is the difference between set_max_delay -datapath_only and set_max_delay -ignore_clock_latency in Cadence Tempus?",
      "If a path matches both a set_false_path and a set_max_delay, which exception takes precedence according to SDC priority rules?",
    ],
    tags: ["false-path", "clock-groups", "max-delay", "ignore-clock-latency", "cdc-skew", "sta-exceptions"],
  },

  {
    id: "eco-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Lead STA Signoff & Timing Closure Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Mastering Advanced Timing Exceptions: Detail the industrial usage and mathematical impact of 'set_case_analysis', 'set_disable_timing', 'set_timing_derate', and 'path_adjust'. How do you audit a production tapeout database for invalid, ignored, or shadowed exceptions using 'report_timing -exception_data' and 'check_timing'?",
    shortSummary: "Case analysis locks operational modes to eliminate false paths; disable timing breaks internal cell arcs; timing derate models on-chip process/voltage variation (OCV); path adjust injects picosecond margins for ECOs. Auditing via report_timing -exception_data and check_timing prevents catastrophic signoff escapes.",
    detailedAnswer: `### 1. Advanced Timing Exception Toolset:
In complex multi-million gate SoCs, standard SDC constraints are supplemented by specialized timing controls:

1. **Case Analysis (\`set_case_analysis 0|1 <pin/port>\`)**:
   - Enforces a static Boolean constant on a specific pin or port during timing analysis.
   - **Mechanism**: Propagates forward through combinational logic. Inactive multiplexer data inputs have their timing arcs disabled.
   - **Primary Use**: Configuring operational modes (e.g. \`test_mode = 0\` during functional STA, or setting clock selection muxes to evaluate a specific clock tree).
2. **Disable Timing (\`set_disable_timing -from <pinA> -to <pinB> <cells>\`)**:
   - Breaks specific internal timing arcs within complex macrocells or standard cells.
   - **Primary Use**: Breaking false feedthrough arcs inside bidirectional I/O pads, dual-port SRAM collision paths, or complex analog mixed-signal IP models.
   - **Hazard**: If misapplied to a real functional path, the tool becomes completely blind to timing violations!
3. **On-Chip Variation Derates (\`set_timing_derate\`)**:
   - Models intra-die manufacturing process variation, temperature gradients, and voltage IR drop across the chip:
     - **Setup Signoff (Worst-Case Divergence)**:
       - Late derate ($> 1.0$, e.g. $+5\%$) on Launch Clock tree and Datapath (makes them slower).
       - Early derate ($< 1.0$, e.g. $-5\%$) on Capture Clock tree (makes it arrive faster).
     - **Hold Signoff (Worst-Case Race Condition)**:
       - Early derate ($< 1.0$, e.g. $-5\%$) on Launch Clock tree and Datapath (makes them race faster).
       - Late derate ($> 1.0$, e.g. $+5\%$) on Capture Clock tree (makes it arrive later).
4. **Path Adjust (\`path_adjust -delay <ps> -from ... -to ...\`)**:
   - Directly injects an explicit numerical delay delta (positive or negative picoseconds) into specific paths.
   - **Primary Use**: Performing rapid "what-if" engineering evaluations during ECO closure (e.g. testing whether 80 ps of useful skew or localized buffer sizing would resolve a path without rerunning layout).
   - **Critical Warning**: Must NEVER be left in production signoff netlists; doing so fabricates fictitious positive slack!

---

### 2. Auditing Production Exception Databases:
Over long project schedules, legacy exceptions accumulate, become obsolete, or conflict with each other. A tapeout audit requires three diagnostic steps:

1. **Auditing Exception Application with \`report_timing -exception_data\`**:
   - Inspects the exact exceptions evaluated for the worst critical paths.
   - Displays whether a path was timed under default single-cycle rules, an active MCP, or overridden by a False Path.
2. **Detecting Ignored and Shadowed Exceptions**:
   - In Cadence Genus / Tempus:
     \`report_timing -path_exceptions ignored\`
   - Pinpoints exceptions that had zero effect on the design (e.g. typos in pin names, empty collections, or lower-priority exceptions shadowed by \`set_false_path\`).
3. **Comprehensive \`check_timing\` Signoff Report**:
   - Audits the entire netlist for unconstrained endpoints, unpropagated clocks, multiple clocks driving registers, and invalid exception syntax:
     \`check_timing -verbose > reports/timing_audit.rpt\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus / Tempus Advanced Exception Signoff Audit:

# 1. Apply operational mode case analysis:
set_case_analysis 0 [get_ports test_mode]
set_case_analysis 1 [get_pins u_clk_ctrl/mux_sel]

# 2. Configure 5nm OCV Timing Derates:
# Setup: Slow data/launch, fast capture
set_timing_derate -early 0.95 -clock [get_clocks *]
set_timing_derate -late  1.05 -data  [get_cells *]

# 3. Apply temporary ECO path adjust for feasibility study:
path_adjust -delay -60 -setup \
  -from [get_pins u_dsp/mac_reg*/CP] \
  -to   [get_pins u_dsp/acc_reg*/D]

# 4. Audit active vs ignored exceptions:
report_case_analysis > reports/case_analysis.rpt
report_timing -exception_data -max_paths 10 > reports/active_exceptions.rpt
report_timing -path_exceptions ignored > reports/ignored_exceptions.rpt

# 5. Signoff Netlist Timing Check:
check_timing -verbose > reports/check_timing_signoff.rpt`,
    },
    commonPitfalls: [
      "Hardcoding set_case_analysis on pins that toggle during mission mode, permanently blinding the STA tool to real functional timing paths.",
      "Leaving path_adjust in production signoff SDC scripts, masking real hardware timing failures before tapeout.",
      "Failing to run report_timing -path_exceptions ignored to clean up obsolete exceptions that bloat STA runtimes.",
    ],
    interviewerFollowups: [
      "What is the precedence hierarchy among set_false_path, set_multicycle_path, and set_max_delay in Tempus / PrimeTime?",
      "How does Stage-Based AOCV or POCV table modeling differ from a flat uniform set_timing_derate across clock tree depths?",
    ],
    tags: ["case-analysis", "disable-timing", "timing-derate", "path-adjust", "exception-debug", "check-timing"],
  },

  // 🟢 DOMAIN: HIERARCHICAL SYNTHESIS & INTERFACE CONTRACTS
  {
    id: "hier-01",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Principal RTL-to-GDS / Synthesis Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Compare Flat, Bottom-Up, Top-Down, and Hybrid synthesis methodologies for 50M+ gate SoCs. Walk through the step-by-step bottom-up block assembly flow, and derive the mathematical interface SDC budget contract. Why does bottom-up synthesis fail so often at chip top, and how do you enforce budget alignment across multi-site engineering teams?",
    shortSummary: "Flat synthesis provides maximum global Boolean optimization but hits memory and runtime limits. Bottom-up partitions blocks into parallel overnight compiles using Interface Logic Models (ILM) or DBs. The #1 failure mode is interface budget drift: block meets internal timing but top violates interface slack due to misaligned external delay and driving assumptions.",
    detailedAnswer: `### 1. SoC Synthesis Methodology Architecture:
In 50M+ gate advanced sub-5nm SoCs, design teams must choose between four synthesis execution models:

| Methodology | Compilation Strategy | Core Advantages | Critical Trade-Offs & Bottlenecks |
|---|---|---|---|
| **Flat** | Entire chip RTL read and synthesized in a single monolithic session. | Maximum global Boolean optimization; seamless cross-module constant propagation and area sharing. | Server memory exhaustion (>256 GB RAM); multi-day runtimes; impossible multi-team parallel workflows. |
| **Bottom-Up** | Blocks synthesized independently into models (ILM/DB), then assembled at top with glue RTL. | Massive compute farm parallelism; clean IP ownership boundaries; fast localized ECO turnarounds. | **Interface budget mismatches**; sub-optimal boundary optimization across partition pins. |
| **Top-Down** | Full chip elaborated at top with module hierarchy preserved; budgets pushed down to blocks. | Retains top-level clock and constraint visibility; prevents boundary budget drift. | Slower initial iterations; requires full chip RTL stability before any block can compile. |
| **Hybrid** | Hard IP as .lib, soft blocks as ILMs, bus fabric top-down, critical paths ungrouped. | Industry gold standard: balances capacity, runtime, and timing closure precision. | Workflow orchestration complexity; multi-model revision tracking. |

---

### 2. The Mathematical Interface SDC Budget Contract:
For a synchronous timing path originating inside Block A, traversing top-level routing glue, and captured inside Block B:
$$T_{\\text{period}} \\ge T_{\\text{clk-q, A}} + T_{\\text{comb, A}} + T_{\\text{top\_wire}} + T_{\\text{comb, B}} + T_{\\text{setup, B}} + T_{\\text{uncertainty}}$$

To allow Block A and Block B to synthesize independently, the chip architect partitions this path into two separate SDC contracts:
1. **Block A Contract (\`set_output_delay\`)**:
   $$T_{\\text{output\_delay, A}} = T_{\\text{top\_wire}} + T_{\\text{comb, B}} + T_{\\text{setup, B}} + \\text{Top Margins}$$
   Block A must guarantee:
   $$T_{\\text{clk-q, A}} + T_{\\text{comb, A}} \\le T_{\\text{period}} - T_{\\text{output\_delay, A}}$$
2. **Block B Contract (\`set_input_delay\`)**:
   $$T_{\\text{input\_delay, B}} = T_{\\text{clk-q, A}} + T_{\\text{comb, A}} + T_{\\text{top\_wire}}$$
   Block B must guarantee:
   $$T_{\\text{comb, B}} + T_{\\text{setup, B}} \\le T_{\\text{period}} - T_{\\text{input\_delay, B}}$$

---

### 3. The #1 Bottom-Up Failure Mode: Budget Over-Allocation:
Why do blocks report $+0.2\,\\text{ns}$ positive slack standalone, yet the chip fails with $-1.8\,\\text{ns}$ WNS at top?
- **Uncoordinated Budgets**: If Block A designers budget $65\%$ of the clock period for internal logic, and Block B designers also take $65\%$, the sum of interface requirements ($130\%$) mathematically guarantees full-chip timing failure!
- **Slew & Load Hallucinations**: Block A assumed a tiny $5\,\\text{fF}$ load, but at top level it drives a $4\,\\text{mm}$ wire ($250\,\\text{fF}$), increasing cell delay by $800\,\\text{ps}$.
- **Solution**: Automated constraint budgeting tools that extract physical floorplan Steiner wire estimates and assign proportional delays to block boundary contracts.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus Bottom-Up Hierarchical Assembly Script:

# ==============================================================================
# STEP 1: INDEPENDENT BLOCK SYNTHESIS & ILM EXPORT (Run on compute cluster)
# ==============================================================================
read_hdl -sv [glob rtl/crypto_core/*.sv]
elaborate crypto_core
read_sdc constraints/crypto_core.sdc
init_design

syn_generic
syn_map
syn_opt

# Export Block Deliverables:
write_hdl > outputs/crypto_core_netlist.v
write_sdc > outputs/crypto_core_out.sdc
write_db -design crypto_core outputs/crypto_core.db

# Generate Interface Logic Model (ILM) for top-level instantiation:
generate_ilm -directory outputs/ilm/crypto_core

# ==============================================================================
# STEP 2: TOP-LEVEL CHIP ASSEMBLY & INTERFACE TIMING SIGN-OFF
# ==============================================================================
# Read top-level fabric and glue RTL:
read_hdl -sv rtl/top/soc_interconnect.sv

# Ingest pre-compiled Block ILMs:
read_ilm -directory outputs/ilm/crypto_core
read_ilm -directory outputs/ilm/dma_engine

elaborate soc_top
read_sdc constraints/soc_top.sdc
init_design

# Verify no black boxes or unresolved pin connections exist:
check_design -unresolved
check_timing -verbose

# Optimize top glue logic without perturbing frozen block interiors:
syn_opt

# Audit full-chip interface timing:
report_timing -from [get_cells u_crypto_core/*] -to [get_cells u_dma_engine/*] -max_paths 10`,
    },
    commonPitfalls: [
      "Over-allocating interface timing budgets between teams, causing full-chip timing closure failure despite all standalone blocks passing.",
      "Synthesizing blocks with default 0-load and ideal 0-slew boundary conditions, leading to extreme slew degradation when connected to top-level interconnects.",
      "Failing to regenerate block ILMs after performing a localized block ECO, masking interface timing violations at top-level STA.",
    ],
    interviewerFollowups: [
      "How do automated SDC constraint pushdown tools divide positive or negative slack across inter-block boundary paths?",
      "In a bottom-up flow, how do you handle clock tree insertion delays (latency) before physical CTS has been performed on the blocks?",
    ],
    tags: ["hierarchical-synthesis", "bottom-up", "ilm", "interface-contracts", "sdc-budgeting", "genus-cui"],
  },

  {
    id: "hier-02",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Senior Physical Design & Hierarchical Flow Lead",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Deep-dive into block model abstraction types in hierarchical ASIC flows: Interface Logic Models (ILM), Cadence Database (.db), Gate Netlist, Liberty (.lib), and Black Boxes. What internal logic does an ILM preserve vs prune? Why does an ILM dramatically accelerate full-chip STA and optimization compared to a full netlist, and under what conditions does an ILM become stale?",
    shortSummary: "An ILM strips away internal register-to-register (R2R) paths that do not touch primary I/O pins, retaining only I2R, R2O, and I2O logic cones alongside boundary clock trees. This slashes top-level memory and runtime by 70-90% while maintaining picosecond-accurate boundary timing and crosstalk visibility.",
    detailedAnswer: `### 1. The Geometry of Model Abstraction:
In a 5-million gate partition, typically **$85\%$ to $90\%$ of all logic gates** reside in internal Register-to-Register (R2R) paths that never interact directly with partition boundary pins:
- At the full-chip top level, analyzing buried ALU adders or internal FIFO depths wastes massive memory and CPU time.
- Top-level synthesis and STA only need to verify:
  1. **Input-to-Register (I2R)**: Data entering from top pins to the first capture flop.
  2. **Register-to-Output (R2O)**: Data launching from the last flop to exit block pins.
  3. **Input-to-Output (I2O)**: Pure combinational feedthroughs crossing through the block.
  4. **Clock Trees**: Clock insertion paths driving these boundary registers.

---

### 2. Comprehensive Model Spectrum Comparison:
| Model Format | Contents Preserved | Pruned Content | Primary Flow Purpose | Tool Ecosystem |
|---|---|---|---|---|
| **Full Netlist (\`.v\`)** | Every single gate, net, and internal register. | None. Full transparency. | Final tapeout signoff and full-chip flat DRC/LVS. | Universal (Cadence, Synopsys, Siemens) |
| **ILM (\`generate_ilm\`)** | Boundary logic cones (I2R, R2O, I2O) and boundary clock trees. | **All internal R2R paths** and non-interfacing flops. | Bottom-up hierarchical synthesis, PnR, and top-level STA. | Cadence Genus / Innovus / Tempus |
| **Cadence DB (\`.db\`)** | Binary snapshot of full netlist, attributes, MMMC views, and constraints. | None (compressed binary). | High-speed checkpointing and handoff between Genus and Innovus. | Cadence Stylus Common UI |
| **Liberty Model (\`.lib\`)** | Blackbox timing arcs, input capacitances, and output drive tables. | All internal structural gates (pure behavioral timing model). | Hard macros (SRAMs, PLLs, SerDes PHYs, analog mixed-signal). | Universal STA Engines |
| **Black Box** | Port interface definitions only (empty shell). | 100% of internal logic and timing. | Early architectural floorplanning and pin placement. | Synthesis Shell |

---

### 3. Why ILM Outperforms Liberty for Soft Digital Blocks:
- **Accuracy with Slew & Crosstalk**: Unlike a static \`.lib\` model (which uses pre-characterized, fixed load/slew tables), an ILM contains **real standard cells** at the boundary:
  - If the top-level router connects a high-capacitance wire, the ILM's output driver will calculate real dynamic delay and slew degradation.
  - Signal integrity (SI) engines can calculate dynamic crosstalk glitch and noise injection on boundary nets.
- **Top-Level Boundary Optimization**: The optimizer can upsize, downsize, or insert repeaters on boundary cells inside the ILM during top-level closure.

---

### 4. When ILMs Become Stale:
An ILM must be regenerated whenever:
1. An ECO alters any boundary cell, buffer, or logic cone.
2. Clock tree buffering or insertion delay changes after CTS in Innovus.
3. New MMMC timing corners or operating voltages are introduced.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence ILM Generation & Inspection Script:

# ==============================================================================
# IN BLOCK SESSION: Generate Multi-Corner ILM
# ==============================================================================
# Verify block timing is clean before generating abstraction:
report_timing -late -max_paths 5
report_timing -early -max_paths 5

# Generate ILM database with physical cell information:
generate_ilm -directory outputs/ilm/pcie_ctrl \
             -prefix pcie_ilm \
             -include_physical

# ==============================================================================
# IN TOP-LEVEL SESSION: Load & Audit ILM
# ==============================================================================
# Read ILM directly into Genus / Innovus:
read_ilm -directory outputs/ilm/pcie_ctrl

# Audit preserved instances vs pruned cells:
report_hierarchy -instance u_pcie_top
puts "ILM Loaded Successfully: [get_db hinsts u_pcie_top .is_ilm]"

# Check boundary path through ILM:
report_timing -from [get_ports pad_pcie_rx*] \
              -to   [get_cells u_pcie_top/*] \
              -max_paths 5`,
    },
    commonPitfalls: [
      "Using static .lib models instead of ILMs for soft digital blocks, leading to inaccurate slew and crosstalk modeling at block boundaries.",
      "Failing to re-generate ILMs after block-level CTS or post-route optimization, causing full-chip STA to analyze obsolete clock insertion latencies.",
      "Attempting to re-synthesize or modify buried internal gates inside an instantiated ILM at the top level.",
    ],
    interviewerFollowups: [
      "How does an ILM handle multi-cycle path (MCP) and false path exceptions that cross from the top level into the block boundary?",
      "What is the difference between an ILM and an Extracted Timing Model (ETM) in Cadence Tempus?",
    ],
    tags: ["ilm", "model-abstraction", "liberty", "hierarchical-pnr", "timing-models", "genus-cui"],
  },

  {
    id: "hier-03",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Lead Synthesis & Implementation Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Mastering Hierarchy Surgery: Explain the mechanics, benefits, and hazards of 'uniquify', automatic vs manual 'ungroup', and boundary optimization ('set_db boundary_optimize'). How does 'uniquify' resolve conflicting constraints on multiple instances of the same RTL module? Why does uncontrolled ungrouping cause formal equivalence (LEC) verification nightmares and name explosion?",
    shortSummary: "uniquify clones identical module definitions in memory so instances with different operating frequencies, pin loads, or floorplan placements can be independently optimized. ungroup dissolves logical boundaries for cross-boundary Boolean optimization, but uncontrolled ungrouping ruins formal verification (LEC) correlation and floorplan traceability.",
    detailedAnswer: `### 1. The 'uniquify' Mandate:
In SystemVerilog designs, parameterized modules or sub-blocks are frequently instantiated dozens of times:
\`\`\`verilog
async_fifo #(.WIDTH(64)) u_fifo_rx (...);
async_fifo #(.WIDTH(64)) u_fifo_tx (...);
\`\`\`
- **The Problem Without Uniquify**:
  - In synthesis memory, both \`u_fifo_rx\` and \`u_fifo_tx\` point to the **same underlying master module definition** (\`async_fifo\`).
  - If \`u_fifo_rx\` operates at $1.2\,\\text{GHz}$ driving a $200\,\\text{fF}$ load, the tool needs to upsize its output gates to \`BUFF_X16\`.
  - But \`u_fifo_tx\` operates at $100\,\\text{MHz}$ driving a tiny $5\,\\text{fF}$ load. Upsizing gates globally would waste massive dynamic and leakage power!
- **The Engine Behavior of \`uniquify\`**:
  - Automatically analyzes all multi-instantiated modules.
  - Clones the internal database into distinct unique modules: \`async_fifo_0\`, \`async_fifo_1\`.
  - Enables independent gate sizing, buffering, logic restructuring, and threshold voltage swapping tailored to each instance's local timing constraints.

---

### 2. The Power and Peril of 'ungroup':
By default, synthesis engines respect module hierarchy boundaries: Boolean optimization (constant propagation, inverter cancellation, subexpression sharing) cannot cross port boundaries.

| Directive | Engine Action | Primary Benefit | Risk / Drawback |
|---|---|---|---|
| **Preserve Hierarchy** | Maintains all module boundaries and port pins intact. | Clean formal LEC verification; direct 1-to-1 floorplan physical hierarchy mapping; easy ECOs. | Redundant boundary buffers; cannot optimize logic across module pins ($5-15\%$ timing/area penalty). |
| **Manual Ungroup (\`ungroup\`)** | Dissolves specified hierarchical instances into parent module. | Eliminates critical path boundary bottlenecks; merges logic cones for maximum speed. | Modifies gate names; must be carefully tracked for formal verification. |
| **Auto-Ungroup (\`set_db auto_ungroup true\`)** | Engine automatically dissolves small submodules (<500 gates) based on area/timing heuristics. | Automated area reduction and timing recovery without manual intervention. | **Name explosion**: Generates thousands of flattened net names, making post-synthesis debug and LEC correlation extremely painful! |

---

### 3. Boundary Optimization Controls:
\`set_db [get_db hinsts u_dsp] .boundary_optimize false\`
- **What Boundary Optimization Does**:
  - If port \`cin\` of module \`u_dsp\` is tied to ground (\`1'b0\`) at the top level, boundary optimization will propagate \`1'b0\` inside \`u_dsp\`, deleting half-adders and simplifying logic.
  - If an output pin is unconnected at the top level, boundary optimization removes the driving logic cone.
- **Why Disable It?**:
  - When synthesizing soft IP cores that must retain their standardized pinlists for drop-in multi-project reuse.
  - For analog mixed-signal wrappers or CDC synchronizer blocks where unused pins or constant straps must be preserved for post-silicon testing.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Hierarchy Surgery Script:

# 1. Inspect design hierarchy before optimization:
report_hierarchy -depth 3 > reports/pre_opt_hierarchy.rpt

# 2. Uniquify multi-instantiated soft IP blocks:
uniquify -design soc_top

# 3. Freeze boundaries of third-party IP and analog wrappers:
set_db [get_db hinsts u_serdes_phy*] .boundary_optimize false
set_db [get_db hinsts u_analog_wrapper*] .preserve true

# 4. Target selective manual ungrouping on timing-critical arithmetic pipelines:
# Identify critical hierarchical instances from timing report:
set crit_hinsts [get_db [get_db timing_paths -max_paths 10 .path_nodes] .inst.hinst]
foreach h $crit_hinsts {
  if {[get_db $h .name] == "u_core/u_alu/u_adder"} {
    puts "Ungrouping timing bottleneck: [get_db $h .name]"
    ungroup $h
  }
}

# 5. Disable uncontrolled global auto-ungrouping to protect LEC verification:
set_db auto_ungroup none

# 6. Audit remaining hierarchy and boundary optimizations:
report_boundary_opt > reports/boundary_opt_report.rpt
check_design -preserved`,
    },
    commonPitfalls: [
      "Enabling uncontrolled global auto-ungrouping, triggering mass name changes that cause Conformal LEC to fail with thousands of unmapped key points.",
      "Failing to run uniquify on shared modules that experience drastically different timing budgets or capacitive loads across instances.",
      "Allowing boundary optimization to eliminate unused test pins on IP blocks intended for future post-silicon diagnostics.",
    ],
    interviewerFollowups: [
      "How does Conformal LEC maintain keypoint mapping when an entire submodule has been ungrouped during synthesis?",
      "What is the difference between ungrouping an instance vs ungrouping an entire module definition in Cadence Common UI?",
    ],
    tags: ["uniquify", "ungroup", "boundary-optimize", "hierarchy-surgery", "lec-correlation", "genus-cui"],
  },

  {
    id: "hier-04",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal ASIC Signoff & Flow Methodology Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Detail the signoff methodology for Hierarchical Verification in multi-million gate SoCs: How do you structure Hierarchical Conformal LEC (bottom-up compare points vs top-level blackbox assembly), assemble multi-domain IEEE 1801 UPF power intent across hierarchical boundaries ('load_upf -scope'), and stitch hierarchical DFT scan chains across partitions without breaking timing closure?",
    shortSummary: "Hierarchical LEC verifies blocks independently before verifying top assembly with blocks modeled as black boxes. UPF hierarchy requires scoped power intent (load_upf -scope) with isolation strategy insertion at partition boundaries. Hierarchical DFT utilizes scan wrappers and IEEE 1500 test collars to decouple block ATPG from top-level routing.",
    detailedAnswer: `### 1. Hierarchical Formal Equivalence (Conformal LEC):
Attempting flat formal equivalence on a 100M+ gate SoC is computationally infeasible due to exponential BDD memory complexity:
- **The 3-Tier Hierarchical LEC Signoff Strategy**:
  1. **Tier 1: Standalone Block Equivalence**:
     - Compare Golden Block RTL against Revised Block Gate Netlist for each partition independently.
     - Ensure all sequential state points (flip-flops, latches, blackbox memory ports) evaluate to **100% Equivalent**.
  2. **Tier 2: Abstraction / ILM Equivalence**:
     - Verify that the generated Interface Logic Model (ILM) preserves exact Boolean behavior against the full block netlist at all boundary input/output pins.
  3. **Tier 3: Full-Chip Assembly Verification**:
     - Read top-level glue RTL and top-level gate netlist.
     - Designate all verified blocks as **Black Boxes** or **Hierarchical Compare Points**:
       \`set_flatten_model -hier_blocks {u_cpu u_gpu u_modem}\`
     - Verification runtime collapses from 36 hours to under 20 minutes!

---

### 2. Multi-Domain IEEE 1801 UPF Hierarchical Assembly:
In multi-voltage, power-gated SoCs, power architecture follows physical partition boundaries:
- **Scoped UPF Ingestion**:
  \`\`\`tcl
  # Top-level session loads top-level power intent:
  load_upf top_soc.upf

  # Scoped loading of block power intent into instantiated hierarchies:
  load_upf -scope u_cpu_cluster upf/cpu_cluster.upf
  load_upf -scope u_gpu_cluster upf/gpu_cluster.upf
  \`\`\`
- **Boundary Isolation Strategy Signoff**:
  - When signals cross from a power-gatable partition (\`PD_CPU\`, shut down during standby) into an always-on top domain (\`PD_AON\`):
  - Isolation cells (\`set_isolation\`) must clamp floating inputs to clean logic 0 or 1.
  - **The Hierarchical Boundary Rule**: Isolation cells must be explicitly assigned to either the parent (top) or child (block) boundary, and connected to the continuous backup supply rail (\`VDD_AON\`).

---

### 3. Hierarchical DFT Scan Stitching:
- Flat scan stitching routes long global wires between blocks across the die, creating routing congestion and hold violations.
- **The Industrial Solution: IEEE 1500 / Scan Wrapper Collars**:
  1. **Internal Mode (In-Test)**: Block internal scan chains are isolated and run high-compression ATPG patterns.
  2. **External Mode (Ex-Test)**: Scan wrapper flops on block boundary pins capture and launch inter-block interconnect test vectors.
  3. **Scan Core Integration**: Genus stitches block scan chains into top-level channels using:
     \`connect_dft_hier_test_cores -design soc_top -auto_create_chains\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Hierarchical Signoff Suite (LEC, UPF, and DFT):

# ==============================================================================
# 1. HIERARCHICAL CONFORMAL LEC DOFILE
# ==============================================================================
# Set hierarchical compare mode:
set_mode setup
read_design -golden rtl/top/soc_top.v -systemverilog
read_design -revised netlist/top/soc_top.v

# Treat verified sub-blocks as blackbox compare points:
set_flatten_model -hier_blocks {u_cpu_cluster u_dsp_core}
set_mode lec
add_compared_points -all
compare > reports/hierarchical_lec.rpt

# ==============================================================================
# 2. HIERARCHICAL UPF 1801 POWER INTENT ASSEMBLY
# ==============================================================================
# Load top-level power intent:
load_upf upf/top_soc.upf

# Load scoped partition intent:
load_upf -scope u_cpu_cluster upf/cpu.upf
load_upf -scope u_dsp_core    upf/dsp.upf

# Verify multi-voltage level shifters and isolation at boundaries:
check_power_intent -design soc_top

# ==============================================================================
# 3. HIERARCHICAL DFT SCAN CHAIN STITCHING
# ==============================================================================
# Stitch pre-configured wrapper cores into top-level test controller:
connect_dft_hier_test_cores -design soc_top \
                            -core_instances {u_cpu_cluster u_dsp_core} \
                            -auto_create_chains
report_scan_chains > reports/hier_scan_chains.rpt`,
    },
    commonPitfalls: [
      "Running flat full-chip Conformal LEC on 50M+ gate netlists, resulting in server out-of-memory crashes and unresolvable abort points.",
      "Omitting backup always-on power rail connections (VDD_AON) for boundary isolation cells placed inside shut-off power domains.",
      "Stitching scan chains across partitions without scan wrapper collars, creating massive physical interconnect routing congestion in PnR.",
    ],
    interviewerFollowups: [
      "How does Conformal LEC verify that an IEEE 1500 scan wrapper does not alter functional datapath logic in mission mode?",
      "When using hierarchical UPF, which domain owns the level shifter cell if the source is 0.75V and the destination is 0.9V?",
    ],
    tags: ["hierarchical-lec", "upf-scoping", "hierarchical-dft", "isolation-cells", "conformal-lec", "signoff"],
  },

  {
    id: "hier-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal STA & Timing Closure Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Top-level full chip STA reports severe timing violations (WNS = -1.8 ns) across an inter-block bus connecting Block A to Block B, yet both Block A and Block B met timing cleanly with positive slack in their respective standalone runs. Provide your 15-minute diagnostic protocol, identify the physical and modeling discrepancies causing this phantom violation, and explain how automated constraint budgeting prevents it.",
    shortSummary: "Standalone blocks pass because their local set_input_delay and set_output_delay constraints were unrealistically relaxed. At full-chip assembly, physical long-distance wire resistance, driver slew degradation, and misaligned clock latency assumptions explode datapath delay. Diagnostic auditing isolates boundary slews, load capacitance, and virtual clock references.",
    detailedAnswer: `### 1. The Physics of the 'Both Blocks Clean, Top Fails' Crisis:
A senior STA engineer must immediately recognize that this is not an optimization failure—it is an **interface contract modeling breakdown**:

1. **The Block A Standalone Model (Optimistic Hallucination)**:
   - Block A was constrained with: \`set_output_delay 0.5 [get_ports data_out*]\` (clock period = $2.0\,\\text{ns}$).
   - Standalone designer placed a tiny default output load: \`set_load 5.0fF [get_ports data_out*]\`.
   - Block A path delay = $1.4\,\\text{ns} \\implies \\text{Slack} = 2.0 - (1.4 + 0.5) = +0.1\,\\text{ns}$ (CLEAN!).
2. **The Block B Standalone Model (Optimistic Hallucination)**:
   - Block B was constrained with: \`set_input_delay 0.6 [get_ports data_in*]\`.
   - Standalone designer assumed an ideal, super-strong driver: \`set_driving_cell -lib_cell BUFF_X16\`.
   - Block B internal path delay = $1.3\,\\text{ns} \\implies \\text{Slack} = 2.0 - (1.3 + 0.6) = +0.1\,\\text{ns}$ (CLEAN!).
3. **The Brutal Reality at Full-Chip Top Assembly**:
   - **Wire Parasitic Reality**: The routing distance between Block A and Block B on the chip floorplan is $5.5\,\\text{mm}$! Wire capacitance alone is $C_{\\text{wire}} = 380\,\\text{fF}$.
   - **Slew Degradation Disaster**: Block A's weak output inverter (\`INV_X1\`) was sized for $5\,\\text{fF}$. Driving $380\,\\text{fF}$ causes its transition time to balloon from $30\,\\text{ps}$ to $1.2\,\\text{ns}$!
   - **Delay Cascade**:
     - Block A output cell delay explodes: $+0.9\,\\text{ns}$.
     - Inter-block top wire delay: $+0.7\,\\text{ns}$.
     - Block B receiver delay degrades due to slow input slew: $+0.5\,\\text{ns}$.
     - Sum of extra delays: $0.9 + 0.7 + 0.5 = 2.1\,\\text{ns}$!
   - **Calculated Full-Chip Slack**:
     $$\\text{Slack}_{\\text{top}} = +0.1\,\\text{ns} - 2.1\,\\text{ns} = -2.0\,\\text{ns}!$$

---

### 2. The 15-Minute Senior Diagnostic Playbook:
1. **Step 1: Deconstruct the Timing Path by Hierarchy**:
   Run \`report_timing -path_type full_clock -max_paths 1\`. Break down delay into four segments:
   $$T_{\\text{total}} = T_{\\text{Block A internal}} + T_{\\text{Block A boundary pin delay}} + T_{\\text{Top interconnect}} + T_{\\text{Block B internal}}$$
2. **Step 2: Audit Boundary Transition Slews**:
   Run \`report_timing -fields {capacitance slew delay}\`. Inspect if the transition time on the block output pin exceeds library max-transition limits ($>400\,\\text{ps}$).
3. **Step 3: Audit Clock Insertion Latency Discrepancies**:
   In block runs, clocks are often analyzed pre-CTS with ideal 0-latency. At top level, Block A launch clock tree may have $1.8\,\\text{ns}$ latency while Block B capture clock tree has $0.9\,\\text{ns}$ latency! This $0.9\,\\text{ns}$ clock skew directly subtracts from setup slack.

---

### 3. Automated SDC Constraint Budgeting & Pushdown:
To prevent interface budget drift:
- Designers should never hand-craft block boundary SDCs in spreadsheets.
- **Top-Down Constraint Budgeting**:
  - The top-level tool extracts actual physical floorplan DEF coordinates and global Steiner wire models.
  - Automatically calculates positive/negative slack across partitions and distributes margins proportionally using automated pushdown commands (\`write_sdc -hierarchical\` / budgeting engines).`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# 15-Minute Hierarchical Interface Timing Diagnostic Script:

# 1. Report full clock path across block boundary:
report_timing -from [get_pins u_block_a/data_out_reg*/CP] \
              -to   [get_pins u_block_b/data_in_reg*/D] \
              -path_type full_clock \
              -fields {cell transition capacitance delay} \
              -max_paths 1 > reports/hier_violation_debug.rpt

# 2. Audit boundary slew and capacitance violations:
report_constraint -max_transition -all_violators > reports/boundary_max_tran.rpt
report_constraint -max_capacitance -all_violators > reports/boundary_max_cap.rpt

# 3. Audit clock arrival skew between block launch and capture pins:
report_timing -from [get_pins u_block_a/data_out_reg*/CP] \
              -to   [get_pins u_block_b/data_in_reg*/D] \
              -clock_tree

# 4. Immediate Physical Fix in Innovus:
# Insert high-drive repeaters on long inter-block top routing:
set_db [get_db nets u_top_bus*] .route_rule 2w2s
opt_design -post_route -drv`,
    },
    commonPitfalls: [
      "Assuming standalone block clean timing guarantees chip-level closure without auditing inter-block wire capacitance and driver transition degradation.",
      "Analyzing block timing pre-CTS with ideal clock latency while full-chip STA includes real clock network skew between partitions.",
      "Hand-budgeting interface delays in spreadsheets instead of running automated physical constraint budgeting from floorplan DEF.",
    ],
    interviewerFollowups: [
      "If physical routing wire delay accounts for 70% of clock period between two blocks, what architectural techniques must RTL designers implement?",
      "How does useful skew between block clock trees impact hierarchical timing budget allocation?",
    ],
    tags: ["interface-timing", "budgeting", "slew-degradation", "sta-diagnostics", "clock-skew", "hierarchical-sta"],
  },

  // 🟢 DOMAIN: MACROS, MEMORIES, MULTIBIT & DATAPATH OPTIMIZATION
  {
    id: "mem-01",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal ASIC Physical Design & Memory Subsystem Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Explain the complete ASIC integration flow for SRAM Compilers and Hard Macros: What deliverables are required (.lib, LEF, GDSII, Verilog behavioral model, MBIST collars), how are multi-corner libraries mapped into Genus MMMC analysis views, and how do you diagnose and resolve 'check_design -lib_lef_consistency' mismatch errors?",
    shortSummary: "SRAM compilers generate multi-view IP packages. Synthesis requires Liberty (.lib) timing arcs for every active MMMC corner and LEF for physical cell boundaries and pin geometry. A lib_lef_consistency error occurs when Liberty pin names, direction, or count diverge from LEF macros, breaking physical placement and causing unrouteable DRC pins.",
    detailedAnswer: `### 1. The 5 Essential SRAM Compiler Deliverables:
In modern SoCs, memories (SRAMs, ROMs, register files) consume over $50\%$ of the total silicon die area. Memory compilers generate a customized deliverable suite:
1. **Liberty Timing Model (\`.lib\`)**:
   - Contains input setup/hold constraints on address (\`A[11:0]\`), write enable (\`WEN\`), and chip select (\`CEN\`) relative to the clock (\`CLK\`).
   - Defines clock-to-Q access times ($T_{\\text{access}}$), write recovery times, pin capacitances, and multi-voltage leakage/dynamic power tables across PVT corners (SSG 0.675V -40C, TT 0.75V 25C, FFG 0.825V 125C).
2. **Physical Layout Abstract (\`.lef\`)**:
   - Defines macro physical bounding box dimensions (PR boundary) and manufacturing grid alignment.
   - Declares internal routing metal blockages (e.g. Metal 1 through Metal 4 reserved for internal bitline/wordline arrays).
   - Defines physical metal pin shapes and routing layers on accessible top metal tracks (Metal 4/5).
3. **Verilog Behavioral Simulation Model (\`.v\`)**:
   - Simulation model with \`$setuphold\` and \`$width\` timing check tasks for functional RTL testbenches and gate-level simulation (GLS).
4. **DFT / MBIST & Redundancy Collars**:
   - Dedicated test pins for Memory Built-In Self-Test (MBIST) controllers and Built-In Self-Repair (BISR) redundancy multiplexers (spare row/column laser or eFuse mapping).
5. **Power Intent Model (UPF / CPF)**:
   - Specifies memory power domain rails (switchable core array \`VDD_CORE\` vs retention periphery \`VDD_RET\`).

---

### 2. MMMC Multi-Corner Library Set Mapping:
Every active MMMC analysis view must include the memory compiler library corresponding to that corner:
\`\`\`tcl
# Slow Signoff View (Late Corner: SSG / 0.675V / -40C):
create_library_set -name lib_slow \
  -library_files [list stdcell_ss.lib sram_2048x64_ss.lib pll_ss.lib]

# Fast Signoff View (Early Corner: FFG / 0.825V / 125C):
create_library_set -name lib_fast \
  -library_files [list stdcell_ff.lib sram_2048x64_ff.lib pll_ff.lib]
\`\`\`
- **The Omission Trap**: If you load standard cell libraries into \`lib_fast\` but omit the memory compiler library, Genus will treat the SRAM instance as an unconstrained black box during hold analysis, allowing hold violations to slip silently into silicon!

---

### 3. Diagnosing 'check_design -lib_lef_consistency' Violations:
Cadence Genus audits that logical timing pins in Liberty match physical routing pins in LEF:
\`check_design -lib_lef_consistency > reports/lib_lef_check.rpt\`
- **Common Root Causes & Fixes**:
  1. **Pin Name Mismatch**: Liberty specifies clock as \`CLK\` but LEF names the pin \`clk\` or \`CK\`.
     - *Fix*: Rename pins in compiler configuration or apply Liberty alias mapping in CUI.
  2. **Direction Discrepancy**: A pin is defined as \`output\` in Liberty but declared as \`inout\` in LEF.
  3. **Missing Power/Ground Pins**: LEF contains physical power pins (\`VDD\`, \`VSS\`, \`VDDM\`), but a signal-only \`.lib\` was read instead of a PG-pin aware Liberty (\`_pg.lib\`).`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Memory & Macro Integration Script:

# 1. Read Physical LEFs (Technology LEF + Standard Cells + Memory Macros):
read_lef tech.lef
read_lef stdcells.lef
read_lef sram_compilers/sram_2048x64.lef

# 2. Setup MMMC Multi-Corner Library Sets:
create_library_set -name lib_ss -library_files [list std_ss.lib sram_ss.lib]
create_library_set -name lib_ff -library_files [list std_ff.lib sram_ff.lib]

# 3. Read RTL and Elaborate:
read_hdl -sv rtl/soc_memory_bank.sv
elaborate soc_memory_bank

# 4. Mandatory Macro Sanity Audits:
check_design -unresolved
check_design -lib_lef_consistency

# 5. Lock Down Hard Macro Instances Against Optimization:
set_db [get_db insts u_sram_bank/*] .preserve true
set_dont_touch [get_db insts u_sram_bank/*]

# 6. Report Macro Timing & Pin Capacitances:
report_timing -to [get_pins u_sram_bank/*/CLK] -max_paths 5`,
    },
    commonPitfalls: [
      "Loading signal-only Liberty models while using PG-aware LEF, triggering hundreds of lib_lef_consistency pin mismatches.",
      "Omitting memory compiler .lib files from fast early MMMC views, causing hold timing checks to be bypassed completely on memory interfaces.",
      "Failing to freeze hard macro instances with .preserve true, allowing incremental optimization passes to attempt invalid cell restructuring.",
    ],
    interviewerFollowups: [
      "Why do SRAM compilers require separate physical metal blockage definitions (OBS) inside LEF files?",
      "In sub-5nm FinFET nodes, how does memory array bitcell write-assist voltage (Vddm) impact UPF level-shifter insertion?",
    ],
    tags: ["sram-compiler", "hard-macros", "lib-lef-consistency", "mmmc-libraries", "mbist", "genus-cui"],
  },

  {
    id: "mem-02",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power UPF & Multi-Voltage / Power Analysis",
    role: "Principal Low Power & Clock Tree Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Analyze the physics, benefits, and implementation pitfalls of Multibit Flip-Flops (MBFF / 2-bit, 4-bit, 8-bit packs). How does merging single-bit registers into MBFFs slash clock distribution power by 25-35% and standard cell area by 15-20%? What severe risks does MBFF introduce to CTS hold closure, routing congestion, and scan chain stitching?",
    shortSummary: "MBFFs combine 2 to 4 flip-flop latches into a single standard cell row sharing a unified internal clock inverter, cutting clock pin capacitance and dynamic power by ~30%. However, MBFFs create zero-skew local hold race conditions between chained bits, increase physical routing pin density, and require specialized abstract scan segment declarations.",
    detailedAnswer: `### 1. The Physics of Multibit Clock Power Savings:
In conventional single-bit D-flip-flops, every register contains an internal clock inverter pair that buffers the clock signal to drive master and slave transmission gates:
- In an SoC with 3,000,000 flip-flops, single-bit registers consume **$35\% - 45\%$ of total chip dynamic power** because clock distribution pins toggle at $100\%$ activity every clock cycle!
- **The MBFF Architecture (2-bit & 4-bit Packs)**:
  - Consolidates 2, 4, or 8 sequential bit slices into a single standard cell footprint.
  - **Shared Clock Inverter**: A single high-efficiency clock inverter drives transmission gates for all 4 bits.
  - **Capacitance Reduction**: Total clock pin capacitance drops by over **$50\%$**:
    $$C_{\\text{clk, 4-bit MBFF}} \\approx 0.45 \\times \\sum_{i=1}^4 C_{\\text{clk, 1-bit DFF}}$$
  - **Dynamic Power**: Total clock tree power collapses by **$25\% - 35\%$** across the SoC.
  - **Area Reduction**: Standard cell area drops by **$15\% - 20\%$** by eliminating redundant substrate taps, n-well boundaries, and VDD/VSS power rail overhead.

---

### 2. Implementation Hazards & Physical Trade-Offs:
1. **Zero-Skew Local Hold Violations**:
   - Flops within the same MBFF cell share identical clock arrival times:
     $$\\text{Clock Skew} \\approx 0\,\\text{ps}$$
   - If the output of Bit 0 drives the input of Bit 1 (e.g. in shift registers, pipeline stages, or counters), the physical routing distance is microscopic ($< 3\,\\mu\\text{m}$).
   - Minimum datapath delay ($T_{\\text{cq, min}} + T_{\\text{wire}}$) is under $25\,\\text{ps}$.
   - Without beneficial clock skew, fast data races through, triggering severe **hold violations** that force Innovus to insert hold delay buffers, partially negating the area savings!
2. **Local Pin Density & Routing Congestion**:
   - A 4-bit MBFF packs 4 data inputs, 4 data outputs, 4 scan inputs, 4 scan outputs, scan enable, reset, and clock (16+ pins) into a compact cell.
   - In dense layouts, local pin density exceeds metal routing pitch track availability, triggering routing congestion and DRC shorts.
3. **DFT Scan Stitching Complexity**:
   - Scan chains must stitch through the multibit cell without creating uncontrollable hold races during test shift.
   - Cadence Genus uses \`identify_multibit_cell_abstract_scan_segments\` to model internal scan routing order.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Multibit Flop Merging & Auditing Flow:

# 1. Enable Multibit Cell Inferencing in Synthesis:
set_db lp_insert_multibit true
set_db lp_multibit_merge_mode auto

# 2. Configure Pin Proximity and Naming Heuristics:
set_db lp_multibit_max_depth 2
set_db lp_multibit_name_prefix "MBFF_"

# 3. Perform Synthesis with Multibit Banking:
syn_generic
syn_map

# 4. Merge Single-Bit Flops into 2-bit & 4-bit Packs:
merge_to_multibit_cells -design soc_top

# 5. Audit Multibit Banking Ratio and Power Savings:
report_multibit_inferencing > reports/mbff_summary.rpt
report_power -by_hierarchy > reports/power_post_mbff.rpt

# 6. Declare Abstract Scan Segments for Downstream DFT:
identify_multibit_cell_abstract_scan_segments -design soc_top`,
    },
    commonPitfalls: [
      "Enabling MBFF on shift registers without checking hold margin, causing severe post-CTS hold violations from zero intra-cell clock skew.",
      "Over-packing 4-bit MBFFs in pin-dense control logic, resulting in unroutable local routing congestion and DRC shorts in Innovus.",
      "Failing to declare abstract scan segments before connect_scan_chains, breaking serial scan chain continuity.",
    ],
    interviewerFollowups: [
      "How does physical-aware multibit merging in Genus iSpatial prevent combining registers placed in opposite floorplan corners?",
      "Why are MBFFs typically avoided on asynchronous CDC synchronizer register pairs?",
    ],
    tags: ["multibit-flops", "mbff", "clock-power", "pin-density", "hold-race", "genus-cui"],
  },

  {
    id: "mem-03",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Senior RTL Datapath & Synthesis Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Deep-dive into Cadence Genus Datapath Optimization: How does the synthesis engine infer and transform high-level arithmetic operators (+, *, -, <) into Carry-Save Adders (CSA), Booth recoded multipliers, and Parallel-Prefix trees? When does automated datapath restructuring succeed, and why is architectural RTL pipelining still king for deep timing closure?",
    shortSummary: "Genus datapath optimization groups consecutive arithmetic operations into Carry-Save Adders (CSA) to defer carry propagation until the final stage, reducing logic depth from O(N) to O(log N). However, synthesis cannot insert latency-bearing registers without user-directed retiming; architectural RTL pipelining remains mandatory for multi-gigahertz closure.",
    detailedAnswer: `### 1. Arithmetic Operator Transformation in Synthesis:
When RTL contains chained arithmetic expressions such as:
\`\`\`verilog
assign result = (A * B) + C + D;
\`\`\`
A primitive logic synthesizer would map this naively into:
1. Multiplier producing a 32-bit scalar product.
2. Adder 1 adding \`C\` with carry propagation ($O(N)$ ripple carry).
3. Adder 2 adding \`D\` with another carry propagation.
- **The Carry-Save Adder (CSA) Reduction Tree**:
  - Genus datapath optimization (\`report_dp\`) automatically detects associative arithmetic operations.
  - Instead of computing scalar sums at each intermediate stage, it accumulates intermediate terms in **carry-save redundant representation** (sum bits and carry bits kept separate).
  - Merges $M$ operands using 3:2 full-adder compressors without ANY carry propagation delay!
  - Only at the final boundary does it instantiate a single high-speed carry-propagate adder (e.g. Han-Carlson, Kogge-Stone, or Brent-Kung parallel-prefix adder).

---

### 2. Multiplier Architecture: Radix-4 Booth Recoding:
- Genus replaces standard long-hand shift-and-add arrays with **Radix-4 Modified Booth Recoding**:
  - Groups multiplier bits into overlapping 3-bit triplets ($-2, -1, 0, +1, +2$).
  - Halves the total number of partial product rows from $N$ to $N/2$.
  - Reduces CSA Wallace/Dadda compressor tree depth from $O(N)$ to $O(\log_2 N)$.

---

### 3. Why Architectural RTL Pipelining is Still King:
- **The Fundamental Boundary of Combinational Optimization**:
  - Automated CSA trees, Booth recoding, and parallel-prefix mapping can compress logic depth from 40 levels to 18 levels.
  - But combinational optimization CANNOT violate physical propagation delays:
  - If a 64-bit Floating-Point MAC has a physical silicon delay of $2.8\,\\text{ns}$, no synthesis algorithm can meet a $1.0\,\\text{ns}$ ($1\,\\text{GHz}$) clock period without adding registers!
  - **The Architectural Imperative**:
    - The RTL designer must partition the algorithm across pipelined clock stages:
      - Stage 1: Booth recoding and partial product generation.
      - Stage 2: CSA reduction tree compression.
      - Stage 3: Final parallel-prefix addition and rounding.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus Datapath Optimization Script:

# 1. Configure High-Effort Datapath Exploration:
set_db dp_exploration high
set_db dp_sharing high
set_db dp_csa_effort high

# 2. Synthesize Generic Gates with Operator Merging:
syn_generic

# 3. Audit Datapath Inference & Resource Sharing:
report_dp > reports/datapath_operators.rpt

# 4. Map into Standard Cells with Advanced Arithmetic Adders:
syn_map

# 5. Inspect Critical Datapath Timing Arcs:
report_timing -from [get_cells u_dsp/mult_reg*] \
              -to   [get_cells u_dsp/acc_reg*] \
              -path_type full_clock`,
    },
    commonPitfalls: [
      "Relying on synthesis datapath optimization to close 2+ ns arithmetic violations without adding RTL pipeline registers.",
      "Disabling resource sharing on area-critical DSP cores, causing duplicate multipliers to blow up silicon area.",
      "Failing to inspect report_dp to verify whether Genus inferred CSA trees or fell back to slow discrete adders.",
    ],
    interviewerFollowups: [
      "What is the difference between a Wallace Tree and a Dadda Tree multiplier in terms of compressor count vs wire interconnect regularity?",
      "How does Genus handle signed vs unsigned datapath operator sign-extension during CSA merging?",
    ],
    tags: ["datapath-opt", "csa-trees", "booth-multiplier", "parallel-prefix", "arithmetic-operators", "genus-cui"],
  },

  {
    id: "mem-04",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Lead Synthesis & Library Methodology Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Formulating Library Cell Selection Policies in Genus: How do you implement production 'dont_use' rules for delay cells, weak drive inverters, and Ultra-Low-Vt (ULVT) gates? Explain the leakage vs timing trade-off between HVT, RVT, LVT, and ULVT flavors, and how to restrict clock tree CTS to specific low-jitter, symmetric buffer cells.",
    shortSummary: "Dont_use policies prevent synthesis from choosing unreliable cells like hold delay buffers, weak X0.5 gates prone to slew degradation, or leaky ULVT gates. Multi-Vt optimization allocates high-leakage LVT only to the top 5-10% of critical paths, while locking the remaining 90% to low-leakage HVT/RVT cells.",
    detailedAnswer: `### 1. Multi-Threshold Voltage ($V_t$) Physics & Allocation Strategy:
Modern FinFET standard cell libraries provide multiple threshold voltage variants with identical footprint footprints:

| $V_t$ Flavor | Threshold ($V_t$) | Propagation Delay | Subthreshold Leakage | Typical SoC Allocation |
|---|---|---|---|---|
| **HVT (High $V_t$)** | Highest ($~450\,\\text{mV}$) | Slowest ($+30\%$) | **Lowest** ($10\\times$ lower) | **$60\% - 70\%$** (Non-critical paths, always-on logic). |
| **RVT (Regular $V_t$)** | Nominal ($~380\,\\text{mV}$) | Balanced | Moderate | **$20\% - 30\%$** (Moderate timing margin cones). |
| **LVT (Low $V_t$)** | Low ($~300\,\\text{mV}$) | Fast ($-25\%$) | High ($5\\times - 8\\times$ higher) | **$5\% - 10\%$** (Top critical timing paths). |
| **ULVT (Ultra-Low $V_t$)** | Lowest ($~220\,\\text{mV}$) | Fastest ($-35\%$) | **Extreme** ($25\\times$ higher) | **$< 2\%$** (Severe WNS recovery only; banned globally by default). |

---

### 2. Formulating Production 'dont_use' Policies:
1. **Hold Delay Cells (\`HOLD_X*\`, \`DLY_X*\`)**:
   - **Why Ban Them in Synthesis?**: Hold delay cells exhibit extreme susceptibility to temperature inversion and process variation. Inserting hold buffers during synthesis is premature and wasteful, as clock tree CTS has not yet occurred!
   - \`set_db [get_db lib_cells */HOLD_*] .dont_use true\`
2. **Weak Drive Strength Cells (\`X0.5\`, \`X0.75\`)**:
   - Small drive transistors cannot overcome high interconnect wire capacitance, causing severe output slew degradation ($> 1\,\\text{ns}$) and signal integrity cross-talk glitch vulnerability.
   - \`set_db [get_db lib_cells */*X0P5*] .dont_use true\`
3. **Restricting Clock Network Buffers (CTS)**:
   - Clock trees require symmetric rise/fall propagation delays and tight duty-cycle preservation.
   - Standard data buffers and asymmetric inverters must NEVER be used on clock networks:
     \`set_db [get_db lib_cells */CLKBUF_*] .dont_use false\`
     \`set_db [get_db lib_cells */BUF_*] .dont_use true ;# for clock nets\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus Library Selection Policy Script:

# 1. Ban all dedicated hold delay cells during synthesis:
set delay_cells [get_db lib_cells */*DLY*]
set_db $delay_cells .dont_use true
puts "Banned [llength $delay_cells] delay cells from synthesis mapping."

# 2. Ban weak drive strength cells prone to slew degradation:
set_db [get_db lib_cells */*X0P5*] .dont_use true
set_db [get_db lib_cells */*X0P75*] .dont_use true

# 3. Lock ULVT library cells (Permit only with architect waiver):
set_db [get_db lib_cells */*ULVT*] .dont_use true

# 4. Restrict synthesis to favor HVT/RVT cells for leakage control:
set_db opt_leakage_to_dynamic_ratio 0.8
set_db max_leakage_power 0.05

# 5. Audit active dont_use cell policies:
report_dont_use > reports/dont_use_audit.rpt
check_design -status`,
    },
    commonPitfalls: [
      "Permitting synthesis to insert hold delay cells before CTS, wasting silicon area and inducing severe post-CTS setup violations.",
      "Allowing unconstrained ULVT allocation, causing chip standby leakage power to exceed battery thermal limits by 5x.",
      "Failing to restrict clock buffers, allowing synthesis to insert asymmetric data inverters that distort clock duty cycles.",
    ],
    interviewerFollowups: [
      "How does temperature inversion in sub-7nm FinFETs cause delay cells to become slower at high temperatures but faster at low voltages?",
      "What is the difference between set_dont_use and set_dont_touch in Cadence Common UI?",
    ],
    tags: ["dont-use", "cell-selection", "multi-vt", "leakage-power", "clock-buffers", "genus-cui"],
  },

  {
    id: "mem-05",
    domain: "synthesis-sdc",
    domainName: "Logic Synthesis & SDC",
    role: "Principal Synthesis & Formal Verification Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Mastering Sequential Optimization & Register Retiming: How does Genus move registers across combinational gates to balance pipeline slack? What are the strict limitations regarding latency invariance, asynchronous reset boundaries, and register initialization? Why does retiming break standard 1-to-1 formal equivalence (LEC), and how do you verify retimed netlists in Conformal?",
    shortSummary: "Register retiming moves flip-flops across combinational gates to equalize pipeline stage delays without changing overall latency. However, retiming cannot cross asynchronous resets, memory boundaries, or primary I/O pins. Because state registers are created and destroyed, standard 1-to-1 LEC fails, requiring Conformal LEC sequential retiming setup files.",
    detailedAnswer: `### 1. The Mechanics of Register Retiming:
In deep arithmetic pipelines, timing slack is often heavily unbalanced across register stages:
- **Unbalanced Pipeline**:
  - Stage 1: ALU adder logic delay = $1.8\,\\text{ns}$ (Violates a $1.5\,\\text{ns}$ clock by $-0.3\,\\text{ns}$).
  - Stage 2: Multiplexer selection delay = $0.4\,\\text{ns}$ (Positive slack $+1.1\,\\text{ns}$).
- **The Retiming Solution**:
  - Instead of requiring the RTL designer to recode the pipeline, Genus register retiming (\`syn_opt -retiming\`) moves the boundary flip-flops backward across the adder logic.
  - Stage 1 delay drops to $1.1\,\\text{ns}$, while Stage 2 delay increases to $1.1\,\\text{ns}$.
  - Both stages now meet timing cleanly with $+0.4\,\\text{ns}$ positive slack **without changing circuit throughput or clock latency!**

---

### 2. Non-Negotiable Retiming Constraints:
1. **Asynchronous Reset Boundaries**:
   - A register with an asynchronous reset pin (\`CDN\`) CANNOT be moved across combinational gates because the initial reset value cannot be preserved across Boolean inversions!
2. **Preserving Critical Architecture**:
   - FSM state registers, CDC synchronizers, and configuration registers must be explicitly marked with \`.preserve true\` to prevent the tool from dissolving their state encoding.
3. **Primary I/O Pin Invariance**:
   - The tool cannot push registers outside primary chip ports (latency invariance).

---

### 3. Why Retiming Breaks Formal Equivalence (LEC) & The Signoff Solution:
- **The 1-to-1 Mapping Failure**:
  - Traditional Conformal LEC matches registers between Golden RTL and Revised Gate Netlist by name and functional cone.
  - Retiming destroys existing registers and creates new registers with synthetic names (\`reg_retimed_42\`), resulting in **100% unmapped compare points**!
- **The Conformal LEC Signoff Flow**:
  1. In Genus: Export the sequential transformation guide:
     \`write_retiming_data -output outputs/retiming.log\`
  2. In Conformal LEC:
     \`\`\`tcl
     set_mode setup
     read_retiming_data outputs/retiming.log
     set_flatten_model -seq_retiming
     set_mode lec
     add_compared_points -all
     compare
     \`\`\``,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Register Retiming & Conformal LEC Export Script:

# 1. Protect FSM state registers and CDC synchronizers from retiming:
set_db [get_db insts *fsm_state_reg*] .preserve true
set_db [get_db insts *sync_reg*] .preserve true

# 2. Enable Sequential Register Retiming:
set_db retime_async_reset false  ;# NEVER retime async resets!
set_db retime_effort high

# 3. Perform Synthesis with Retiming Optimization:
syn_generic
syn_map
syn_opt -retiming

# 4. Audit Retimed Pipeline Stages:
report_retiming > reports/retiming_summary.rpt

# 5. Export Retiming Guide for Conformal LEC Signoff:
write_retiming_data -output outputs/retiming_formal.log
write_hdl > outputs/soc_retimed_netlist.v`,
    },
    commonPitfalls: [
      "Retiming registers with asynchronous resets, leading to non-deterministic reset states on silicon.",
      "Failing to export write_retiming_data, causing Conformal LEC verification to abort with 100% unmapped compare points.",
      "Allowing retiming to modify FSM state registers, corrupting one-hot or Gray state machine encodings.",
    ],
    interviewerFollowups: [
      "What is the mathematical difference between forward retiming and backward retiming in graph theory?",
      "How does Conformal LEC distinguish between pipeline retiming and combinational logic restructuring?",
    ],
    tags: ["register-retiming", "sequential-opt", "conformal-lec", "retiming-log", "async-reset", "genus-cui"],
  },

  // 🟢 DOMAIN: MULTI-MODE MULTI-CORNER (MMMC) ARCHITECTURE & SIGNOFF
  {
    id: "mmmc-01",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal Static Timing & Synthesis Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Deconstruct the Cadence Common UI (CUI) Multi-Mode Multi-Corner (MMMC) object model from first principles. Why is bottom-up authoring strictly mandatory (library_set -> opcond -> rc_corner -> timing_condition -> delay_corner -> constraint_mode -> analysis_view -> set_analysis_view)? What catastrophic errors occur if this order is violated, and how does the first active analysis view dictate initial synthesis library linking?",
    shortSummary: "MMMC establishes a strict relational dependency tree where analysis views bind orthogonal constraint modes (functional/test SDC) to delay corners (PVT libraries + interconnect RC models). Constructing objects out of order causes unresolvable reference errors. In Genus, the libraries tied to the first active analysis view in set_analysis_view are loaded first to establish the baseline mapping database.",
    detailedAnswer: `### 1. The 7-Layer Relational Object Dependency Hierarchy:
In production ASIC flows, closing timing under a single worst-case condition is obsolete. Designs must satisfy multiple operating modes across extreme process, voltage, and temperature (PVT) variations:
- **The Core Definition of an Analysis View**:
  An **Analysis View** is an instantiated timing evaluation environment formed by pairing two completely independent axes:
  $$\\text{Analysis View} = \\text{Constraint Mode (Architectural Intent)} \\times \\text{Delay Corner (Physical Silicon Realization)}$$

\`\`\`text
┌────────────────────────┐         ┌────────────────────────┐
│  create_library_set    │         │   create_rc_corner     │
│  (Liberty .lib + AOCV) │         │   (QRC tech + Temp)    │
└───────────┬────────────┘         └───────────┬────────────┘
            │                                  │
┌───────────▼────────────┐                     │
│  create_opcond         │                     │
│  (P/V/T Condition)     │                     │
└───────────┬────────────┘                     │
            │                                  │
┌───────────▼────────────┐                     │
│ create_timing_condition│                     │
│ (Binds Libs + Opcond)  │                     │
└───────────┬────────────┘                     │
            │                                  │
            └─────────────────┬────────────────┘
                              ▼
                   ┌───────────────────────┐
                   │  create_delay_corner  │
                   └──────────┬────────────┘
                              │
┌────────────────────────┐    │
│ create_constraint_mode │    │
│ (SDC: func, scan, etc) │    │
└───────────┬────────────┘    │
            │                 │
            └────────┬────────┘
                     ▼
          ┌───────────────────────┐
          │ create_analysis_view  │
          └──────────┬────────────┘
                     ▼
          set_analysis_view -setup {…} -hold {…}
\`\`\`

---

### 2. Why Bottom-Up Authoring is Strictly Mandatory:
Each object in the CUI MMMC model directly references handles defined by preceding layers:
1. \`create_delay_corner\` requires instantiated \`timing_condition\` and \`rc_corner\` pointers.
2. \`create_analysis_view\` requires instantiated \`constraint_mode\` and \`delay_corner\` handles.
3. If an engineer invokes \`create_analysis_view\` before defining the referenced delay corner, the tool aborts with a fatal syntax error: *“Error: Delay corner 'dc_ss' does not exist.”*

---

### 3. The First Active Analysis View Rule in Genus:
When \`read_mmmc\` executes:
- Genus does NOT load all 50+ libraries across all views simultaneously, as doing so would cause massive memory bloating.
- **The Engine Mechanism**:
  The library set associated with the **first analysis view declared in \`set_analysis_view -setup\`** is read immediately into memory.
  - This establishes the master gate catalog for technology elaboration (\`syn_generic\`) and initial mapping (\`syn_map\`).
  - **The Catastrophic Bug**: If an engineer declares a test or scan view first in the \`-setup\` list, Genus will synthesize the functional datapath using slow test-mode libraries or un-optimized driver cells!
  - **Best Practice**: Always list the primary mission-mode worst-case functional view (\`av_func_ss_rcw\`) as the first item in \`set_analysis_view -setup\`.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence CUI MMMC Script (Authoring Bottom-Up):

# 1. Define Library Sets (Slow Late vs Fast Early):
create_library_set -name ls_slow \
  -timing [list stdcell_ss_0p72v_m40c.lib sram_ss_0p72v_m40c.lib]
create_library_set -name ls_fast \
  -timing [list stdcell_ff_0p88v_125c.lib sram_ff_0p88v_125c.lib]

# 2. Define Operating Conditions:
create_opcond -name opc_slow -voltage 0.72 -temperature -40
create_opcond -name opc_fast -voltage 0.88 -temperature 125

# 3. Define Interconnect Parasitic RC Corners:
create_rc_corner -name rc_worst -qrc_tech qrc/rcworst.tch -temperature -40 \
  -pre_route_cap 1.0 -pre_route_res 1.0
create_rc_corner -name rc_best  -qrc_tech qrc/rcbest.tch  -temperature 125 \
  -pre_route_cap 1.0 -pre_route_res 1.0

# 4. Bind Libraries to Operating Conditions (Timing Conditions):
create_timing_condition -name tc_slow -library_sets {ls_slow} -opcond opc_slow
create_timing_condition -name tc_fast -library_sets {ls_fast} -opcond opc_fast

# 5. Bind Timing Conditions to RC Corners (Delay Corners):
create_delay_corner -name dc_slow -timing_condition tc_slow -rc_corner rc_worst
create_delay_corner -name dc_fast -timing_condition tc_fast -rc_corner rc_best

# 6. Define Constraint Modes (SDC Files):
create_constraint_mode -name cm_func -sdc_files [list sdc/functional.sdc]
create_constraint_mode -name cm_scan -sdc_files [list sdc/scan_shift.sdc]

# 7. Create Analysis Views (Pair Mode + Delay Corner):
create_analysis_view -name av_func_ss -constraint_mode cm_func -delay_corner dc_slow
create_analysis_view -name av_func_ff -constraint_mode cm_func -delay_corner dc_fast
create_analysis_view -name av_scan_ss -constraint_mode cm_scan -delay_corner dc_slow

# 8. Activate Views for Synthesis Optimization & Reporting:
# (First setup view sets primary synthesis target library!)
set_analysis_view \
  -setup   {av_func_ss av_scan_ss} \
  -hold    {av_func_ff} \
  -leakage {av_func_ss} \
  -dynamic {av_func_ss}`,
    },
    commonPitfalls: [
      "Defining analysis views before defining the referenced delay corners or constraint modes, triggering fatal script execution aborts.",
      "Listing a secondary or scan test view first in set_analysis_view -setup, causing Genus to base generic logic mapping on non-optimal libraries.",
      "Loading fast-corner libraries into a slow-corner delay corner, invalidating both setup and hold timing calculations.",
    ],
    interviewerFollowups: [
      "Why does Cadence Common UI separate 'create_timing_condition' from 'create_delay_corner' instead of bundling them together?",
      "In a design with multiple power rails, how does 'create_delay_corner -pg_net_voltages' resolve cell delays across voltage islands?",
    ],
    tags: ["mmmc", "object-model", "analysis-views", "delay-corner", "constraint-mode", "genus-cui"],
  },

  {
    id: "mmmc-02",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Lead STA Signoff & Timing Closure Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Detail the role of 'set_analysis_view' slots (-setup, -hold, -leakage, -dynamic, -inactive, -drv). How does Genus optimizer cost-function resolve conflicts where upsizing a gate to close worst-case setup (SS / rcworst) triggers catastrophic hold race violations in the fast corner (FF / rcbest)? What is the optimal view count strategy during synthesis vs signoff PnR?",
    shortSummary: "set_analysis_view assigns active roles to defined views. The multi-view optimizer calculates a composite cost function across all active views simultaneously. Sizing an inverter to fix slow-corner setup can cause fast-corner hold races; multi-view optimization detects this cross-corner dependency and chooses alternative gate topologies or selective buffering. In synthesis, a reduced set of 2 to 4 views balances closure with runtime, leaving full 20+ view matrices to signoff STA.",
    detailedAnswer: `### 1. Functional Roles of 'set_analysis_view' Slots:
In Cadence Genus and Innovus, \`set_analysis_view\` directs the optimization and reporting engines by assigning specific analysis views to specialized functional slots:

| Slot Parameter | Target Engine | Architectural Responsibility |
|---|---|---|
| **\`-setup <views>\`** | Timing Optimization & STA | Directs worst-case path delay, WNS/TNS recovery, and setup DRC timing closure. |
| **\`-hold <views>\`** | Hold Timing Optimization | Directs fast-path hold race detection and hold delay buffer insertion during post-mapping. |
| **\`-leakage <view>\`** | Power Calculation | Identifies the PVT corner for subthreshold leakage power reporting (typically high-leakage FF @ $125^\circ\\text{C}$ or nominal TT). |
| **\`-dynamic <view>\`** | Power Calculation | Specifies the operating view for capacitive switching and internal dynamic power analysis. |
| **\`-inactive <views>\`** | Database Pass-Through | Keeps views loaded in memory for manual timing inspection or SDC pass-through without burning optimizer CPU runtime. |
| **\`-drv <views>\`** | Design Rule Checking | Enforces max_transition, max_capacitance, and max_fanout across specified modes. |

---

### 2. The Cross-Corner Optimization Conflict & Resolution:
Consider an inverter \`U_INV\` driving a high-capacitance bus:
- **In Slow Setup View (\`av_func_ss_rcw\`)**:
  - Operating condition: SSG, $0.675\,\\text{V}$, $-40^\circ\\text{C}$, rcworst interconnect.
  - Path delay = $2.12\,\\text{ns}$ on a $2.0\,\\text{ns}$ clock $\\implies \\text{Slack}_{\\text{setup}} = -0.12\,\\text{ns}$ (VIOLATED).
- **In Fast Hold View (\`av_func_ff_rcb\`)**:
  - Operating condition: FFG, $0.825\,\\text{V}$, $125^\circ\\text{C}$, rcbest interconnect.
  - Path delay = $0.06\,\\text{ns}$, Required hold time = $0.05\,\\text{ns} \\implies \\text{Slack}_{\\text{hold}} = +0.01\,\\text{ns}$ (JUST PASSING).
- **The Optimization Conflict**:
  - If Genus were single-view, it would aggressively upsize \`U_INV\` from \`INV_X1\` to \`INV_X16\` to fix the setup violation.
  - Sizing up accelerates the path in both corners: the fast-corner delay drops from $60\,\\text{ps}$ to $22\,\\text{ps}$!
  - **The Catastrophe**: Hold slack collapses to:
    $$\\text{Slack}_{\\text{hold}} = 0.022\,\\text{ns} - 0.050\,\\text{ns} = -0.028\,\\text{ns (VIOLATED)!}$$
- **The Multi-View Optimizer Resolution**:
  - When both \`av_func_ss\` and \`av_func_ff\` are active simultaneously:
    $$\\text{Total Cost} = \\sum_{v \\in \\text{Setup}} W_v \\cdot \\max(0, -S_{\\text{setup}, v}) + \\sum_{v \\in \\text{Hold}} W_v \\cdot \\max(0, -S_{\\text{hold}, v})$$
  - The optimizer detects that upsizing \`U_INV\` creates a hold violation.
  - It chooses a superior, balanced solution: it maintains \`U_INV\` at a moderate drive (\`INV_X4\`) and instead restructures the upstream logic cone or performs pin swapping, closing setup without destroying hold margin!

---

### 3. Synthesis vs. Signoff PnR View Strategy:
- **The Signoff PnR Matrix**: Physical signoff tools (Innovus/Tempus) evaluate the full Cartesian product ($4\,\\text{modes} \\times 3\,\\text{PVTs} \\times 3\,\\text{RCs} = 36\,\\text{views}$).
- **The Genus Synthesis Strategy**:
  - Running 36 views during synthesis slows down compilation by over **$600\%$**.
  - **Industry Standard**: Use a **Reduced View Set (2 to 4 views)** in Genus:
    1. \`av_func_ss_rcw\` (Functional Setup primary)
    2. \`av_func_ff_rcb\` (Functional Hold primary)
    3. \`av_scan_ss_rcw\` (Test Setup primary)
  - Genus optimizes the netlist to be robust against cross-corner conflicts, leaving final signoff closure to PnR.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Multi-View Setup, Inspection & Reporting:

# 1. Activate Reduced Multi-View Matrix for Synthesis:
set_analysis_view \
  -setup   [list av_func_ss_rcw av_scan_ss_rcw] \
  -hold    [list av_func_ff_rcb] \
  -leakage [list av_func_ff_rcb] \
  -dynamic [list av_func_ss_rcw]

# 2. Audit Active Views in Database:
report_analysis_views

# 3. Report Quality of Results (QoR) per Specific Analysis View:
report_qor -view av_func_ss_rcw > reports/qor_func_setup.rpt
report_qor -view av_scan_ss_rcw > reports/qor_scan_setup.rpt
report_qor -view av_func_ff_rcb > reports/qor_func_hold.rpt

# 4. Report Top Timing Paths Across Specific View:
report_timing -views av_func_ss_rcw -max_paths 10 > reports/timing_func_ss.rpt
report_timing -views av_func_ff_rcb -max_paths 10 -early > reports/timing_func_ff.rpt

# 5. Export Production MMMC File for Innovus Handoff:
write_mmmc -dir handoff/mmmc -prefix soc_top_signoff`,
    },
    commonPitfalls: [
      "Omitting -hold views during synthesis, allowing the optimizer to aggressively upsize gates and create hundreds of unfixable fast-path hold races in PnR.",
      "Activating a 20+ view signoff matrix during initial RTL synthesis, inflating overnight runtime from 2 hours to 18 hours.",
      "Assigning the leakage power slot to a slow-corner view (-40C) where subthreshold leakage is minimal, hiding true worst-case leakage at 125C.",
    ],
    interviewerFollowups: [
      "How does the Genus optimizer weigh setup cost versus hold cost when both are simultaneously violated on the same path group?",
      "What is the difference between an inactive view and an unregistered view in Cadence Common UI?",
    ],
    tags: ["set_analysis_view", "multi-view-opt", "setup-vs-hold", "qor-reporting", "write_mmmc", "genus-cui"],
  },

  {
    id: "mmmc-03",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal Physical Design & Signoff Engineer",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Deep-dive into interconnect parasitics modeling with 'create_rc_corner': How do QRC technology files (-qrc_tech), operating temperatures, and pre-route vs post-route scale factors operate? Why do setup-critical and hold-critical timing paths require completely opposite RC corner formulations (rcworst vs cbest)?",
    shortSummary: "Interconnect delay is governed by Elmore RC delay. Setup analysis requires rcworst (maximum resistance and capacitance at cold temperatures) to maximize wire delay. Hold analysis requires cbest (minimum capacitance at hot temperatures) to minimize wire latency and expose hold race conditions.",
    detailedAnswer: `### 1. The Physics of Interconnect Parasitic Variations:
In sub-7nm FinFET nodes, interconnect resistance and capacitance dominate gate delay ($>60\%$ of total path delay). Due to chemical-mechanical polishing (CMP) and optical lithography variations, wire geometries fluctuate across the wafer:

| RC Corner | Physical Wire Geometry | Parasitic Impact | Primary Timing Purpose |
|---|---|---|---|
| **\`rcworst\` (or Cworst)** | Metal lines are thinner (higher resistance $R$) and spacing between adjacent wires is narrow (higher coupling capacitance $C_c$). | Maximizes total wire delay: $\\tau_{\\text{wire}} = R_{\\text{wire}} C_{\\text{wire}}$. | **Setup Signoff (Slowest Paths)** |
| **\`cbest\` (or rcbest)** | Metal lines are wider/taller (lower $R$) and inter-wire spacing is larger (lowest coupling $C_c$). | Minimizes wire delay and maximizes signal edge propagation speed. | **Hold Signoff (Fastest Paths)** |
| **\`typical\`** | Nominal foundry targeted thickness, width, and dielectric permittivity. | Balanced parasitic representation. | Dynamic Power & Electromigration (EM) |

---

### 2. Metal Resistance Temperature Inversion:
Unlike MOSFET transistors (which traditionally exhibit slower drive currents at high temperatures due to carrier mobility degradation):
- Metal interconnect resistance increases linearly with temperature:
  $$R(T) = R_0 \\cdot [1 + \\alpha (T - T_0)]$$
- In copper/cobalt routing, metal resistance increases by over **$+40\%$ between $-40^\circ\\text{C}$ and $125^\circ\\text{C}$**.
- **The Critical Temperature Formulation**:
  - In advanced nodes with high-resistance thin lower metals (M1-M4), high temperature ($125^\circ\\text{C}$) can sometimes become the worst-case setup corner for interconnect-dominated paths, while $-40^\circ\\text{C}$ remains worst-case for cell-dominated paths.
  - This is why foundries prescribe **Temperature-Inversion Aware** RC corners.

---

### 3. Pre-Route vs Post-Route Wire Scaling Factors:
During synthesis, physical routing geometry does not exist; Genus uses Steiner-tree approximations:
- **Pre-Route Scale Factors**:
  \`-pre_route_res 1.05 -pre_route_cap 1.10\`
  Injects a $5-10\%$ correlation guardband to ensure synthesis logic mapping does not assume overly optimistic wire delays.
- **Clock Tree Overrides**:
  Clock networks use dedicated non-default routing (NDR) rules (e.g. 2W2S: double-width, double-spacing on upper low-resistance metals M7/M8).
  - \`-pre_route_clock_res 0.5 -pre_route_clock_cap 0.8\` accounts for lower resistance and shielding.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus RC Corner Definition Script:

# 1. Setup-Pessimistic RC Corner (rcworst at Cold -40C):
create_rc_corner -name rc_worst_cold \
  -qrc_tech tech/qrc/qrc_rcworst.tch \
  -temperature -40 \
  -pre_route_res 1.05 \
  -pre_route_cap 1.08 \
  -pre_route_clock_res 0.55 \
  -pre_route_clock_cap 0.85

# 2. Hold-Pessimistic RC Corner (cbest at Hot 125C):
create_rc_corner -name rc_best_hot \
  -qrc_tech tech/qrc/qrc_cbest.tch \
  -temperature 125 \
  -pre_route_res 0.95 \
  -pre_route_cap 0.92 \
  -pre_route_clock_res 0.48 \
  -pre_route_clock_cap 0.80

# 3. Post-Route Calibration Scaling (for Innovus handoff):
create_rc_corner -name rc_signoff_typical \
  -qrc_tech tech/qrc/qrc_nominal.tch \
  -temperature 25 \
  -post_route_res {1.0 1.0 1.0} \
  -post_route_cap {1.0 1.0 1.0} \
  -post_route_cross_cap {1.0 1.0 1.0}`,
    },
    commonPitfalls: [
      "Defining create_rc_corner without a valid QRC tech file or cap table, forcing the tool to default to zero wire resistance and optimistic delays.",
      "Using the same RC corner for both setup and hold analysis, completely hiding fast-path hold race conditions.",
      "Omitting clock-specific pre-route scaling factors, leading to massive clock insertion delay mischaracterization before CTS.",
    ],
    interviewerFollowups: [
      "How does coupling capacitance (cross_cap) between adjacent switching wires impact dynamic crosstalk delay in Tempus?",
      "Why do sub-3nm nodes utilize ruthenium or cobalt vias, and how does create_rc_corner model via resistance variation?",
    ],
    tags: ["rc-corner", "qrc-tech", "interconnect-parasitics", "elmore-delay", "temperature-inversion", "genus-cui"],
  },

  {
    id: "mmmc-04",
    domain: "low-power-upf",
    domainName: "Low Power UPF & Multi-Voltage / Power Analysis",
    role: "Principal Low Power & Multi-Voltage Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "How do advanced variation and low-power intent integrate into MMMC? Detail the syntax and mechanics of attaching Advanced On-Chip Variation (AOCV/SOCV) tables to 'create_library_set', defining multi-rail voltage domains on 'create_delay_corner' (-pg_net_voltages, PD@TC), and modeling dynamic IR-drop delay penalties.",
    shortSummary: "Flat timing derates introduce unrealistic pessimism. AOCV tables attach to library sets (-aocv) to derate paths based on logic depth and spatial bounding boxes. In multi-voltage SoCs, delay corners map specific power rails (-pg_net_voltages) and bind power domains to timing conditions (PD@TC), enabling accurate level-shifter and power-switch delay calculations.",
    detailedAnswer: `### 1. Stage-Based AOCV and Statistical OCV (SOCV) Integration:
Traditional flat derates (e.g. $+5\%$ slow data, $-5\%$ fast clock) assume that every standard cell in a path experiences worst-case process variation simultaneously:
- On deep paths ($>25$ stages), this creates excessive artificial pessimism ($>180\,\\text{ps}$), forcing unnecessary gate sizing and power bloat.
- **Advanced On-Chip Variation (AOCV)**:
  - Models variation as a function of **logic stage depth** and **physical bounding box distance**.
  - As logic depth increases, random independent process variations statistically cancel out ($1/\sqrt{N}$ law).
  - Attached in MMMC via:
    \`create_library_set -name ls_ss -timing [list ...] -aocv [list std_ss.aocv]\`
- **Statistical OCV (SOCV)**:
  - Uses statistical variation tables (\`-socv\`) containing Gaussian distribution parameters ($\\mu, \sigma$) per library cell to perform Monte Carlo statistical timing.

---

### 2. Multi-Rail Power Intent (UPF) Mapping in MMMC:
In complex multi-voltage SoCs, different power domains operate at distinct voltage levels:
- **The Challenge**: An isolation cell or level shifter bridging \`PD_CORE\` ($0.72\,\\text{V}$) to \`PD_SOC\` ($0.85\,\\text{V}$) needs both supply rail voltages defined simultaneously to interpolate its internal delay arcs accurately.
- **The CUI Delay Corner Solution**:
  \`\`\`tcl
  create_delay_corner -name dc_slow_multirail \
    -timing_condition [list PD_CORE@tc_core_slow PD_SOC@tc_soc_slow] \
    -pg_net_voltages [list VDD_CORE@0.72 VDD_SOC@0.85 VSS@0.0] \
    -rc_corner rc_worst
  \`\`\`
  - Genus maps each power domain (\`PD_CORE\`) to its dedicated timing condition and explicitly specifies primary power rail voltages.

---

### 3. Dynamic IR-Drop Delay Compensation:
Peak switching activity causes transient supply bounce and IR drop:
- A $5\%$ voltage drop reduces saturation current ($I_{\\text{dsat}}$), increasing cell delay by $8-12\%$.
- Cadence delay corners permit injecting dynamic IR-drop derating factors directly:
  \`-early_estimated_worst_irdrop_factor 0.04 -late_estimated_worst_irdrop_factor 0.06\`
  This prevents silicon setup timing failures in high-switching DSP or tensor arithmetic blocks.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Advanced Low-Power & Variation-Aware MMMC Definition:

# 1. Attach Stage-Based AOCV Tables to Library Sets:
create_library_set -name ls_core_ss \
  -timing [list std_ss_0p72v.lib] \
  -aocv   [list aocv/std_ss_stage_table.aocv]

create_library_set -name ls_soc_ss \
  -timing [list soc_ss_0p85v.lib] \
  -aocv   [list aocv/soc_ss_stage_table.aocv]

# 2. Define Multi-Rail Timing Conditions:
create_timing_condition -name tc_core_slow -library_sets {ls_core_ss}
create_timing_condition -name tc_soc_slow  -library_sets {ls_soc_ss}

# 3. Create Multi-Rail Delay Corner with IR-Drop Penalties:
create_delay_corner -name dc_slow_multirail \
  -timing_condition [list PD_CORE@tc_core_slow PD_SOC@tc_soc_slow] \
  -pg_net_voltages  [list VDD_CORE@0.72 VDD_SOC@0.85 VSS@0.0] \
  -rc_corner        rc_worst \
  -late_estimated_worst_irdrop_factor 0.05

# 4. Associate UPF Power Modes with Analysis Views:
create_analysis_view -name av_func_run \
  -constraint_mode cm_func \
  -delay_corner    dc_slow_multirail \
  -power_modes     [list PM_ACTIVE_RUN]`,
    },
    commonPitfalls: [
      "Applying flat timing derates on top of AOCV/SOCV tables, doubling variation pessimism and preventing timing closure.",
      "Omitting secondary power net voltages on delay corners, causing level shifters to report corrupt or zero delay arcs.",
      "Failing to associate UPF power modes with analysis views, resulting in power analysis using incorrect operational voltages.",
    ],
    interviewerFollowups: [
      "How does the Genus timing engine interpolate cell delays when the operating voltage in UPF falls between two characterized .lib table values?",
      "What is the mathematical relationship between logic stage depth and the AOCV derate factor in standard cell timing?",
    ],
    tags: ["aocv", "socv", "multi-rail-mmmc", "pg-net-voltages", "ir-drop", "upf-power-modes"],
  },

  {
    id: "mmmc-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Lead STA Signoff & Timing Closure Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Provide your production diagnostic playbook for MMMC: How do you debug 'No libraries loaded', resolve constraint mode leakage into functional STA, audit active vs inactive views using 'report_analysis_views', and ensure bit-exact handoff from Genus to Innovus using 'write_mmmc'?",
    shortSummary: "Common MMMC failures stem from missing libraries in active views, constraint mode pollution (scan shift SDC applied during functional STA), and unattached RC corners. Auditing requires report_analysis_views and per-view QOR checks (report_qor -view). Clean PnR handoff requires write_mmmc -dir out -prefix chip to package reproducible environment scripts.",
    detailedAnswer: `### 1. The 5 Most Common MMMC Production Failures:
1. **Failure 1: 'No libraries loaded / Unresolved cell references'**:
   - **Symptom**: Elaboration completes, but technology mapping aborts claiming gates cannot be linked.
   - **Root Cause**: The view declared first in \`set_analysis_view -setup\` points to an empty \`library_set\` or invalid directory path.
   - **Diagnostic**: Query CUI database pointer:
     \`get_db [get_db analysis_views <first_view>] .delay_corner.library_sets.timing\`
2. **Failure 2: Test Mode Constraints Polluting Functional STA**:
   - **Symptom**: Functional mission-mode paths report bizarre clock periods ($20\,\\text{ns}$) or un-routable multi-cycle exceptions.
   - **Root Cause**: An incorrect SDC was bound to \`create_constraint_mode\`, or \`set_case_analysis 1 [get_ports scan_en]\` was inadvertently included in functional constraints.
   - **Diagnostic**: Run \`report_analysis_views\` and inspect the \`.constraint_mode.sdc_files\` attribute.
3. **Failure 3: Hold Timing Completely Ignored in Synthesis**:
   - **Symptom**: Synthesis reports clean slack, but Innovus PnR starts with $-3.5\,\\text{ns}$ hold violations across thousands of endpoints.
   - **Root Cause**: Engineer ran \`set_analysis_view -setup {av_ss}\` but omitted the \`-hold\` slot entirely!
4. **Failure 4: Zero Wire Interconnect Delay**:
   - **Symptom**: Cell delays match \`.lib\`, but net delays across all paths evaluate to exactly $0.00\,\\text{ps}$.
   - **Root Cause**: \`create_delay_corner\` was created without \`-rc_corner\`, causing the tool to skip wire modeling.

---

### 2. Comprehensive MMMC Signoff Audit Script:
A clean MMMC audit verifies four criteria before physical P&R handoff:
1. Every active view has verified, existing \`.lib\` files.
2. Setup views reference worst-case RC and PVT; hold views reference best-case RC and PVT.
3. Active constraint modes reference valid SDC files without conflicting exceptions.
4. \`write_mmmc\` generates clean, reproducible scripts.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production MMMC Diagnostic & Handoff Playbook:

# 1. Audit All Defined & Active Analysis Views:
report_analysis_views > reports/mmmc_view_matrix.rpt

# 2. Database Inspection: Verify Views and Libraries:
set setup_views [get_db analysis_views -if {.is_setup == true}]
puts "Active Setup Views: [get_db $setup_views .name]"
foreach v $setup_views {
  puts "View: [get_db $v .name]"
  puts "  Mode:  [get_db $v .constraint_mode.name]"
  puts "  SDC:   [get_db $v .constraint_mode.sdc_files]"
  puts "  Delay: [get_db $v .delay_corner.name]"
  puts "  RC:    [get_db $v .delay_corner.rc_corner.name]"
}

# 3. Verify Quality of Results Across Every Active View:
foreach v $setup_views {
  puts "Checking QoR for view: [get_db $v .name]"
  report_qor -view [get_db $v .name]
}

# 4. Check for Unconstrained Endpoints or Flop Clock Latencies:
check_timing -verbose > reports/check_timing_mmmc.rpt

# 5. Clean Physical Handoff Export for Innovus PnR:
write_mmmc -dir handoff/mmmc \
           -prefix soc_top \
           -with_target_link \
           -design soc_top`,
    },
    commonPitfalls: [
      "Failing to inspect report_analysis_views before synthesis, allowing misconfigured test views to dictate functional logic mapping.",
      "Handing off ad-hoc Tcl scripts to Innovus instead of exporting normalized write_mmmc packages.",
      "Allowing delay corners to fall back to zero wire delay by omitting rc_corner attachments.",
    ],
    interviewerFollowups: [
      "How does write_mmmc handle target_timing versus link_timing library separation for downstream Innovus PnR?",
      "In a design with 50+ analysis views, how do you query only the views that exhibit negative setup slack in Tempus?",
    ],
    tags: ["mmmc-diagnostics", "report_analysis_views", "write_mmmc", "sdc-leakage", "check_timing", "genus-cui"],
  },

  // 🟢 DOMAIN: PHYSICAL-AWARE & ISPATIAL SYNTHESIS
  {
    id: "phy-01",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal Physical Synthesis & RTL-to-GDS Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Contrast Wireload Models (WLM) with Physical Layout Estimation (PLE) in sub-7nm FinFET synthesis: Why does statistical WLM lead to disastrous timing miscorrelations and false architectural decisions? Walk through how PLE uses floorplan DEF geometry, Steiner minimal trees, and LEF metal layer models to calculate realistic net parasitics before detailed routing.",
    shortSummary: "Statistical Wireload Models estimate net length solely based on fanout, assuming an imaginary uniform die size. In nanometer nodes where wire resistance dominates gate delay, WLM completely underestimates long cross-chip buses and over-estimates localized nets. PLE ingests floorplan DEF coordinates and macro keep-outs to generate placement-driven Steiner trees, delivering 85-90% timing correlation with post-placement Innovus.",
    detailedAnswer: `### 1. The Physics of the Nanometer Interconnect Crisis:
In legacy $>65\,\\text{nm}$ planar processes, gate propagation delay constituted over $80\%$ of total path delay, while wire resistance and capacitance were secondary ($20\%$). Statistical Wireload Models (WLM) were sufficient:
$$\\text{WLM Net Length} = f(\\text{Fanout Count}, \\text{Design Area})$$

- **The Catastrophic Breakdown in Sub-7nm FinFETs**:
  - In modern FinFET nodes, interconnect RC accounts for **$>65\%$ of total path delay** due to ultra-thin metal line pitch, high resistivity, and dense sidewall coupling capacitance.
  - **The WLM Blind Spot**:
    - Consider two completely different nets, both with a fanout of 4:
      - **Net A**: A localized arithmetic adder net inside an ALU spanning $12\,\\mu\\text{m}$.
      - **Net B**: A global control signal traversing $4.5\,\\text{mm}$ across the chip between memory banks.
    - Statistical WLM assigns **both nets the exact same estimated wire length** ($~90\,\\mu\\text{m}$ based purely on fanout 4)!
    - **The Failure**:
      - Synthesis severely under-buffers Net B, allowing a massive $2.5\,\\text{ns}$ delay violation to escape into Innovus PnR.
      - Concurrently, synthesis over-buffers Net A with oversized drivers, wasting precious area and dynamic power!

---

### 2. How Physical Layout Estimation (PLE) Operates:
\`set_db interconnect_mode ple\`
PLE replaces blind statistical guesswork with deterministic geometry:
1. **Floorplan DEF Ingestion**:
   Genus reads the floorplan DEF containing core boundaries, standard cell row sites, macro placement coordinates, and keep-out halos.
2. **Proto-Placement Engine**:
   Genus executes an embedded analytical placement pass to compute initial physical $(X, Y)$ coordinates for every synthesized standard cell.
3. **Steiner Minimal Tree (SMT) Routing**:
   The engine constructs Rectilinear Steiner Minimal Trees connecting driver pins to receiver pins around fixed macro blockages.
4. **Layer-Aware RC Extraction**:
   By referencing technology LEF rules and QRC RC corners, PLE extracts exact metal resistance ($R_{\\text{sq}}$) and fringing capacitance ($C_f$) based on estimated routing layer assignments.
5. **Correlation Impact**:
   Timing correlation between Genus physical synthesis and post-placement Innovus reaches **$85\% - 90\%$**, preventing late-stage tapeout timing disasters!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Cadence Genus PLE Configuration & Audit Script:

# 1. Read Physical Technology & Cell LEF Files:
read_lef tech/tech.lef
read_lef stdcells/stdcells.lef
read_lef macros/sram_bank.lef

# 2. Switch Interconnect Engine from Wireload to PLE:
set_db interconnect_mode ple

# 3. Ingest Floorplan DEF (Die boundary, rows, macro placements):
read_def floorplan/soc_top_floorplan.def

# 4. Elaborate RTL and Audit Floorplan Constraints:
read_hdl -sv rtl/soc_top.sv
elaborate soc_top
check_design -unresolved

# 5. Audit PLE Parasitic Quality & Physical Bounding Boxes:
report_ple > reports/ple_quality.rpt
report_utilization > reports/floorplan_util.rpt

# 6. Report Timing Using Physical Parasitics:
report_timing -max_paths 10`,
    },
    commonPitfalls: [
      "Running synthesis in statistical wireload mode on advanced sub-7nm designs, resulting in negative slacks (>2 ns) appearing immediately upon PnR placement.",
      "Reading DEF without macro placements, causing PLE to route Steiner trees directly through solid SRAM blocks.",
      "Failing to audit report_ple to verify whether Genus is using physical coordinates or falling back to wireload models.",
    ],
    interviewerFollowups: [
      "What is the mathematical difference between a Minimum Spanning Tree (MST) and a Rectilinear Steiner Minimal Tree (RSMT)?",
      "Why does PLE use segmented wireload modes when hierarchy boundaries prevent full flat proto-placement?",
    ],
    tags: ["ple", "wireload-models", "steiner-trees", "physical-synthesis", "correlation", "genus-cui"],
  },

  {
    id: "phy-02",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Lead Physical Synthesis & Implementation Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Mastering Cadence iSpatial Physical Synthesis: Walk through the execution sequence of 'syn_generic -physical', 'syn_map -physical', and 'syn_opt -spatial'. How does iSpatial share placement algorithms with Innovus, how does '-create_floorplan' operate when no DEF exists, and how does spatial optimization close critical paths that pure logical synthesis cannot resolve?",
    shortSummary: "iSpatial unifies the Genus logic synthesis engine with the Innovus GigaPlace placement engine. syn_generic -physical clusters logic cones based on dataflow geometry; syn_map -physical maps gates while concurrently placing cells; and syn_opt -spatial performs physical-aware logic restructuring, repeater insertion, and boundary pin swapping. If no DEF exists, -create_floorplan builds an emergency 70% density square floorplan.",
    detailedAnswer: `### 1. The iSpatial Unified Architecture:
Historically, logic synthesis and physical place-and-route operated as disconnected silos:
- Synthesis created a gate netlist based on zero-wire delay assumptions, then tossed it "over the wall" to PnR.
- PnR struggled for weeks attempting to place unroutable, congested gate topologies.
- **The iSpatial Breakthrough**:
  Cadence embeds the core **Innovus GigaPlace** analytical placement engine directly inside the Genus synthesis kernel. Logic restructuring and gate mapping occur simultaneously with physical cell coordinates!

---

### 2. The 3-Stage iSpatial Synthesis Pipeline:
1. **\`syn_generic -physical\`**:
   - Compiles high-level RTL into generic GTECH Boolean logic.
   - Analyzes macro pin locations and primary I/O pad coordinates to cluster generic logic cones into physical attraction regions.
   - **The \`-create_floorplan\` Fallback**:
     If no physical DEF exists during early architectural feasibility runs:
     \`syn_generic -create_floorplan\` automatically generates a square core floorplan with a target placement density of **0.70 (70% utilization)** and standard core margins.
2. **\`syn_map -physical\`**:
   - Maps generic gates into target foundry standard cells while **concurrently placing them on legal site rows**.
   - Distributes high-fanout nets (HFN) with buffer trees placed directly along the physical Steiner routing path.
3. **\`syn_opt -spatial\`**:
   - Executes placement-guided timing closure and physical logic restructuring:
     - **Physical Gate Pulling**: Moves timing-critical logic cells physically closer to receiving pins.
     - **Physical Pin Swapping**: Swaps functionally symmetric pins on multi-input NAND/NOR gates to connect the critical path to the lowest-internal-delay pin and shortest metal route!
     - **Repeater Sizing**: Upsizes drivers driving long inter-macro wires and downsizes non-critical cells to relieve local congestion.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence iSpatial Physical-Aware Synthesis Script:

# 1. Setup Physical Tech LEFs and MMMC Environment:
read_lef tech.lef
read_lef stdcells.lef
read_lef macros.lef
read_mmmc mmmc/soc_signoff.mmmc.tcl

# 2. Read RTL and Ingest Floorplan DEF:
read_hdl -sv rtl/soc_core.sv
elaborate soc_core
read_def floorplan/soc_core_placed_macros.def
init_design

# 3. Phase 1: Physical Generic Synthesis:
syn_generic -physical

# 4. Phase 2: Physical Technology Mapping (Concurrent Placement):
syn_map -physical

# 5. Phase 3: Spatial Placement-Guided Optimization:
syn_opt -spatial

# 6. Audit Congestion and Placement Legality:
report_congestion > reports/ispatial_congestion.rpt
report_utilization > reports/ispatial_density.rpt
check_placement > reports/placement_legality.rpt

# 7. Export Common Database for Innovus Handoff:
write_db -common -design soc_core handoff/soc_core_ispatial.db`,
    },
    commonPitfalls: [
      "Using syn_opt -spatial without prior syn_generic/map -physical passes, causing the spatial optimizer to operate on non-physical cell placements.",
      "Relying on syn_generic -create_floorplan for production tapeouts instead of using real PnR floorplans with locked macro coordinates.",
      "Failing to run check_placement, allowing illegal overlapping cell placements to corrupt downstream PnR handoff.",
    ],
    interviewerFollowups: [
      "How does iSpatial coordinate multi-voltage UPF power domains with physical voltage island bounding boxes?",
      "What is the runtime overhead of syn_map -physical compared to conventional logical mapping?",
    ],
    tags: ["ispatial", "gigaplace", "syn_generic-physical", "syn_opt-spatial", "create_floorplan", "genus-cui"],
  },

  {
    id: "phy-03",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Principal ASIC Floorplan & Congestion Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Diagnosing and Mitigating Physical Congestion in Genus: How do you interpret 'report_congestion' and 'report_utilization' during physical synthesis? What physical mechanisms cause routing hotspots around SRAM macro channels, and how do placement density targets, soft blockages, and macro halos resolve DRC routing overflow?",
    shortSummary: "report_congestion identifies global routing track demand vs capacity across G-cells. SRAM macro channels create narrow routing corridors where high-pin standard cells compete for limited upper metal tracks. Mitigating congestion requires setting localized density targets (set_db place_density), adding macro placement halos (keep-outs), and placing soft routing blockages to disperse standard cells into open core areas.",
    detailedAnswer: `### 1. The Mathematics of Global Routing Congestion:
During physical synthesis, Genus partitions the chip into a uniform grid of **Global Cells (G-cells)**:
- Each G-cell edge has a defined routing track **Capacity** ($C$) and a net **Demand** ($D$).
- **Overflow** occurs whenever net demand exceeds available metal tracks:
  $$\\text{Overflow} = \\max(0, D - C)$$
- **The Signoff Threshold**:
  If total G-cell overflow exceeds **$1.5\%$ of total core edges**, the design is practically unroutable in NanoRoute and will suffer hundreds of design rule violations (DRC) shorts and opens!
- \`report_congestion\` identifies:
  1. Horizontal vs Vertical routing track overflow.
  2. Bounding box coordinates of the top 10 worst congestion hotspots.

---

### 2. Physical Mechanics of the Macro Channel Hotspot:
- When two large SRAM blocks are placed close together ($< 50\,\\mu\\text{m}$ channel):
  - SRAM macros contain solid internal metal blockages across Metal 1 through Metal 4.
  - If Genus places random glue logic inside this narrow channel, all cell pins must escape vertically/horizontally using only Metal 5 and Metal 6!
  - Pin density exceeds track availability, creating a localized routing bottleneck.

---

### 3. Industrial Congestion Mitigation Directives:
1. **Macro Placement Halos (Keep-Outs)**:
   Specifies an exclusion border around hard macros where standard cells cannot be placed, leaving routing tracks completely dedicated to macro pin escape:
   \`create_place_halo -inst u_sram* -halo_deltas {15 15 15 15}\`
2. **Localized Standard Cell Density Caps**:
   High-pin arithmetic blocks (e.g. 64-bit crossbar switches or multipliers) should not be placed at 80% utilization:
   \`set_db [get_db hinsts u_crossbar] .place_density 0.55\`
   This forces the analytical placer to disperse cells across a wider area.
3. **Soft Placement Blockages**:
   Blocks cell placement while allowing routing wires to pass freely through.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Congestion Diagnosis & Mitigation Script:

# 1. Audit Floorplan Utilization and Routing Congestion:
report_utilization > reports/core_utilization.rpt
report_congestion > reports/global_congestion.rpt

# 2. Check for Severe Hotspots (>1.5% Overflow is Fatal):
puts "Auditing Max Horizontal Congestion..."

# 3. Apply Macro Placement Halos (15 um keep-out around SRAMs):
create_place_halo -insts [get_db insts -if {.is_macro == true}] \
                  -halo_deltas {15 15 15 15}

# 4. Cap Placement Density on Dense Interconnect Modules:
set_db [get_db hinsts u_dsp_core/u_multiplier] .place_density 0.60
set_db [get_db hinsts u_bus_fabric] .place_density 0.55

# 5. Re-run Spatial Optimization to Disperse Congestion:
syn_opt -spatial

# 6. Verify Reduced Congestion Overflow:
report_congestion > reports/post_mitigation_congestion.rpt`,
    },
    commonPitfalls: [
      "Ignoring report_congestion in synthesis and handing off congested netlists to PnR, leading to days of wasted runtime and unroutable DRCs in NanoRoute.",
      "Placing standard cells directly up against macro boundaries without placement halos, causing pin access routing blockages.",
      "Applying global density caps across the entire chip instead of targeting only the congested hierarchical instances, causing unnecessary silicon die area inflation.",
    ],
    interviewerFollowups: [
      "How does routing congestion impact dynamic crosstalk delay and noise glitch injection in nanometer wires?",
      "What is the difference between a hard placement blockage and a soft placement blockage in Cadence DEF?",
    ],
    tags: ["congestion", "report_congestion", "macro-halos", "place-density", "g-cells", "genus-cui"],
  },

  {
    id: "phy-04",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Lead Implementation & Tool Flow Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Unified Common Database Handoff: How does 'write_db -common' bridge Cadence Genus and Innovus? Explain the advantages of the Common UI database over separate Verilog/DEF/SDC handoffs, and how 'syn_opt -incremental' performs physical ECO optimization using post-placement feedback.",
    shortSummary: "write_db -common generates a unified binary snapshot readable by both Genus and Innovus, encapsulating standard cell placement coordinates, MMMC analysis views, physical constraints, and logic netlist state without file synchronization drift. In post-placement ECOs, syn_opt -incremental updates logic restructuring directly on existing cell locations without perturbing global placement.",
    detailedAnswer: `### 1. The Failure of Legacy Multi-File Handoffs:
Traditionally, synthesis handed off designs to PnR using loose collections of text files:
1. Structural Gate Netlist (\`soc_top.v\`)
2. Floorplan Placement DEF (\`soc_top.def\`)
3. SDC Timing Constraints (\`soc_top.sdc\`)
4. MMMC View Setup Scripts (\`soc_top.mmmc.tcl\`)
5. UPF Power Intent (\`soc_top.upf\`)
- **The Synchronization Nightmare**:
  - In large multi-site engineering teams, file version drift is inevitable.
  - An engineer modifies an SDC constraint or performs an incremental netlist fix, but forgets to update the floorplan DEF.
  - When Innovus reads the out-of-sync files, standard cells lose their placement coordinates, false paths are misapplied, and days of engineering time are wasted debugging phantom discrepancies!

---

### 2. The Unified Common Database (\`write_db -common\`):
Cadence Genus and Innovus share the **Stylus Common UI (CUI)** architecture:
- They use the exact same internal C++ object graph, memory data model, and database structures!
- **\`write_db -common -design soc_top outputs/soc_common.db\`**:
  - Encapsulates the entire synthesis design state into a single, compact binary snapshot:
    1. Full mapped gate netlist.
    2. Exact $(X, Y)$ physical cell placement coordinates and orientations.
    3. Complete MMMC analysis views, delay corners, and active constraint modes.
    4. Power domain rules, isolation strategies, and level-shifter bindings.
- **In Innovus**:
  - \`read_db outputs/soc_common.db\` restores the entire design in under 60 seconds with **zero risk of file drift!**

---

### 3. Physical Incremental ECOs (\`syn_opt -incremental\`):
When Innovus detects localized post-placement timing violations ($WNS = -120\,\\text{ps}$):
- Instead of re-synthesizing the entire chip from scratch:
  1. Innovus passes the placed common DB back to Genus.
  2. Genus runs \`syn_opt -incremental\`.
  3. Genus performs localized logic restructuring (e.g. collapsing a 3-level multiplexer tree into a single compound gate) while **freezing $99.5\%$ of the existing cell placement locations**.
  4. Preserves physical routing stability and eliminates placement iterations!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Common UI Database Handoff & Incremental ECO Flow:

# ==============================================================================
# IN GENUS SYNTHESIS SESSION: Export Common Database
# ==============================================================================
# Complete physical spatial optimization:
syn_generic -physical
syn_map -physical
syn_opt -spatial

# Export unified Common UI database for Innovus:
write_db -common -design soc_top handoff/soc_top_placed.db

# ==============================================================================
# IN INNOVUS PNR SESSION: Restore Database in 60 Seconds
# ==============================================================================
# Read common database directly:
read_db handoff/soc_top_placed.db
report_timing -max_paths 5

# ==============================================================================
# POST-PLACEMENT FEEDBACK ECO IN GENUS:
# ==============================================================================
# Read back placed database from Innovus:
read_db pnr/soc_top_after_place.db

# Execute incremental physical logic restructuring without perturbing placement:
syn_opt -incremental

# Re-export updated database to Innovus:
write_db -common -design soc_top handoff/soc_top_eco_placed.db`,
    },
    commonPitfalls: [
      "Exporting separate Verilog, DEF, and SDC files for Innovus handoff instead of write_db -common, causing file synchronization discrepancies.",
      "Running non-incremental syn_opt on a post-placement database, completely scrambling cell coordinates and destroying floorplan closure.",
      "Failing to preserve hard macros before syn_opt -incremental, allowing the tool to attempt illegal gate restructuring on macro pins.",
    ],
    interviewerFollowups: [
      "How does write_db -common handle target_timing versus link_timing library separation for downstream Innovus CTS?",
      "In an ECO flow, how does Genus ensure that newly inserted buffer cells do not physically overlap existing placed standard cells?",
    ],
    tags: ["write_db-common", "innovus-handoff", "incremental-opt", "physical-eco", "database-sync", "genus-cui"],
  },

  {
    id: "phy-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal STA Signoff & Correlation Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Physical Correlation Limits: Why is iSpatial Steiner routing NOT signoff extraction? Analyze the physical sources of timing drift between Genus physical synthesis, Innovus post-route STA, and Tempus signoff extraction (SPEF/SI), and explain how correlation guardbands prevent late-stage tapeout surprises.",
    shortSummary: "iSpatial relies on proto-placement and Rectilinear Steiner Minimal Tree (RSMT) approximations, which ignore detailed routing layer congestion, via resistance stacks, clock tree latency insertion, and dynamic cross-talk noise. Achieving signoff correlation requires calibrating Genus pre-route scale factors, modeling realistic clock uncertainty, and reserving setup/hold margins.",
    detailedAnswer: `### 1. Why Physical Synthesis Is Not Signoff Extraction:
While Cadence iSpatial delivers dramatic correlation improvements over statistical wireload models, senior engineers must never mistake synthesis timing for final signoff timing:
- **iSpatial operates on**:
  - Coarse analytical cell placement.
  - Rectilinear Steiner Minimal Tree (RSMT) interconnect approximations.
  - Ideal or estimated clock latency trees.
- **Signoff STA (Tempus) operates on**:
  - Detailed routed metal geometry (NanoRoute polygons).
  - 3D field-solver parasitic extraction (Quantus QRC / SPEF).
  - Fully propagated clock trees with localized OCV and dynamic crosstalk noise.

---

### 2. The 4 Fundamental Physical Sources of Timing Drift:
1. **Steiner Manhattan Paths vs Detailed Routing Detours**:
   - Steiner routing assumes nets travel along ideal L-shaped or Z-shaped Manhattan segments.
   - In detailed routing, wires must detour around dense macro keepouts, power grid stripes, and congested cell channels.
   - Real wire length is **$15\% - 30\%$ longer** than Steiner approximations, increasing net capacitance!
2. **Via Stack Resistance Penalties**:
   - In advanced sub-5nm nodes, a single via between lower metal layers (M1 to M3) has a resistance of $25 - 45\,\Omega$.
   - A signal transitioning from a standard cell pin on M1 up to M8 traverses **7 stacked vias ($>250\,\Omega$ total resistance!)**.
   - Steiner models frequently underestimate via stack counts, under-predicting net RC delay.
3. **Clock Tree Insertion Latency & Skew (CTS)**:
   - During synthesis, clock networks are ideal: clock arrival times at launch and capture flops are modeled as flat numbers.
   - Post-CTS, real clock trees introduce $1.2\,\\text{ns}$ of insertion latency and $120\,\\text{ps}$ of clock skew across the die, directly eroding setup slack.
4. **Crosstalk Signal Integrity (SI) Noise**:
   - Synthesis does not calculate dynamic cross-coupling glitch noise between adjacent switching wires.
   - In post-route signoff, cross-coupling capacitance ($C_c$) can double effective capacitance ($C_{\\text{eff}} = C_{\\text{gnd}} + 2 C_c$), degrading edge transition times by up to $20\%$.

---

### 3. Engineering Correlation Guardbands:
To prevent late-stage tapeout timing closure failure:
1. **Pre-Route Scale Factors**:
   Inject correlation guardbands in \`create_rc_corner\`:
   \`-pre_route_res 1.10 -pre_route_cap 1.10\`
2. **Elevated Synthesis Clock Uncertainty**:
   Apply $T_{\\text{unc}} = 100\,\\text{ps}$ during synthesis to absorb post-CTS clock skew and crosstalk jitter, tightening to $30\,\\text{ps}$ post-route.
3. **Targeting Over-Constrained Setup Slack**:
   Architects require synthesis to meet $+50\,\\text{ps}$ positive slack to ensure signoff closure in Tempus at zero slack.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Correlation Guardband & Audit Script:

# 1. Apply Pre-Route Scaling Guardbands in MMMC RC Corner:
create_rc_corner -name rc_worst_guarded \
  -qrc_tech qrc/rcworst.tch \
  -temperature -40 \
  -pre_route_res 1.10 \
  -pre_route_cap 1.10 \
  -pre_route_clock_res 0.60 \
  -pre_route_clock_cap 0.90

# 2. Apply Guardbanded Clock Uncertainty in Synthesis SDC:
set_clock_uncertainty -setup 0.100 [get_clocks clk_core]
set_clock_uncertainty -hold  0.050 [get_clocks clk_core]

# 3. Perform iSpatial Synthesis:
syn_generic -physical
syn_map -physical
syn_opt -spatial

# 4. Audit Physical Steiner vs Post-Route Timing Correlation:
report_timing -fields {cell transition capacitance delay} \
              -max_paths 10 > reports/synthesis_timing_profile.rpt

# 5. Export Common DB for Physical Verification:
write_db -common -design soc_top handoff/soc_top_guarded.db`,
    },
    commonPitfalls: [
      "Assuming synthesis physical slack will match post-route signoff STA 1-to-1 without adding correlation guardbands for via resistance and routing detours.",
      "Using post-route uncertainty numbers (30 ps) during pre-CTS synthesis, leaving no margin for real clock tree skew.",
      "Failing to model layer-specific via resistance in custom delay corners.",
    ],
    interviewerFollowups: [
      "How does the Miller effect double the effective coupling capacitance between two adjacent wires switching in opposite directions?",
      "In sub-3nm GAAFET nodes, how do backside power delivery networks (BSPDN) reduce lower-metal routing congestion?",
    ],
    tags: ["correlation", "steiners-vs-routes", "via-resistance", "clock-uncertainty", "crosstalk-si", "genus-cui"],
  },

  // 🟢 DOMAIN: PRACTICE CHIP & PAD RING SYNTHESIS
  {
    id: "chip-01",
    isFreeSample: true,
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Lead Chip Integration & Tapeout Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Advanced FinFET Pad Ring Assembly in Genus: Contrast core-only synthesis ('top') with full-chip synthesis ('pad_top'). How are bidirectional IO pads (IO_IN_PAD/IO_OUT_PAD) linked from IO Liberty files rather than synthesized into standard cells, and why does 'check_design' flag ~350 constant leaf pins on pad ties as expected behavior?",
    shortSummary: "Core-only synthesis ('top') contains only functional logic without perimeter IO buffers, whereas full-chip ('pad_top') instantiates foundry IO pad cells. Genus does not synthesize pad structures into generic gates; it links them directly from the IO Liberty library (.lib) as fixed black boxes. The ~350 constant leaf pins flagged in check_design represent hardwired tie-offs (1'b0 / 1'b1) for slew rate, pull-up/down, and drive strength control pins on the IO pads.",
    detailedAnswer: `### 1. Core-Only ('top') vs Full-Chip ('pad_top') Synthesis Architecture:
In production ASIC tapeouts, design teams maintain a strict architectural separation between core IP logic and perimeter chip IO:
- **Core-Only (\`top\`)**:
  - Contains arithmetic logic, control state machines, and internal SRAM memories.
  - Primary ports are ideal internal logic signals (\`clk\`, \`rst_n\`, \`addr[15:0]\`).
  - Synthesizes exclusively against standard cell libraries (\`tcbn16ffc...lib\`).
- **Full-Chip (\`pad_top\`)**:
  - Instantiates the core logic as a sub-module, surrounded by the physical perimeter pad ring.
  - Primary ports correspond directly to physical package bonding pads (\`pad_clk\`, \`pad_rst_n\`, \`pad_addr[15:0]\`).
  - Requires simultaneous loading of **both standard cell and IO pad timing libraries**:
    \`set_db library [list stdcell_ss.lib generic_io_ss.lib]\`

---

### 2. How Genus Links IO Pad Cells:
- In RTL, bidirectional and input/output pads are instantiated as macro primitives:
  \`IO_IN_PAD u_pad_clk (.PAD(pad_clk), .C(core_clk));\`
- **Genus Never 'Synthesizes' Pads**:
  - Unlike Verilog multiplexers or adders that decompose into GTECH Boolean gates, Genus recognizes pad instances as pre-characterized foundry library cells defined in the IO Liberty file.
  - Genus performs structural linking, connecting pad internal pins (\`C\`, \`I\`, \`OEN\`) to core logic while leaving pad physical characteristics intact.

---

### 3. Deconstructing the ~350 Constant Leaf Pins in 'check_design':
During structural design audits via \`check_design\`, engineers frequently panic upon seeing hundreds of constant leaf pin warnings:
- **Why It Happens**:
  - Advanced FinFET IO pads are highly configurable cells equipped with 8 to 12 control inputs per pad:
    - \`REN\`: Receiver enable.
    - \`DS0, DS1\`: Programmable drive strength selection (e.g. 2mA, 4mA, 8mA).
    - \`SR\`: Slew rate control (fast vs noise-suppressed).
    - \`PULL_UP / PULL_DOWN\`: Internal resistor enables.
  - In \`pad_top.sv\`, these control pins are tied to \`1'b0\` or \`1'b1\` to lock the pad into a deterministic operational mode.
- **Why It Is Clean**:
  - These tie-offs are structurally required by the foundry IO compiler. Genus verifies that they are driven by valid logic constants without floating gates.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Advanced FinFET Pad-Top Synthesis Script:

# 1. Load Both Standard Cell and Foundry IO Liberty Libraries:
set_db library [list \
  pdk/stdcells_ss_0p72v_m40c.lib \
  pdk/io_pads_ss_0p72v_1p62v.lib \
]

# 2. Ingest Core RTL and Perimeter Pad Ring Wrapper:
read_hdl -sv [glob ../rtl/core/*.v]
read_hdl -sv ../rtl/pad_top.sv

# 3. Elaborate Top-Level Chip:
elaborate pad_top

# 4. Count and Audit Instantiated IO Pad Cells:
puts "Total Pad Instances: [llength [get_db insts *u_pad*]]"
get_db lib_cells *IO_IN_PAD*

# 5. Run Structural Design Audit (Verify ~350 Constant Pins are Pad Ties):
check_design -unresolved
check_design > reports/check_design_pad_top.rpt`,
    },
    commonPitfalls: [
      "Attempting to synthesize pad_top without loading the IO pad Liberty library, causing Genus to flag every pad as an unresolved black box.",
      "Treating constant leaf pin warnings on IO pad tie-offs as design bugs and attempting to delete or float them, resulting in undefined pad drive strengths.",
      "Using core port names (clk) instead of pad port names (pad_clk) in the top-level SDC, leaving the clock pin unconstrained.",
    ],
    interviewerFollowups: [
      "Why are physical IO filler cells (IO_FILLER*) omitted from functional RTL and only added during Innovus floorplanning?",
      "How does Genus verify ESD clamp cell continuity in pad_top without physical LEF files?",
    ],
    tags: ["pad-ring", "finfet-padring", "io-pads", "check_design", "liberty-linking", "genus-cui"],
  },

  {
    id: "chip-02",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Principal Timing Closure & ASIC Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "The I2O Path Dilemma: In a 500 MHz (2.0 ns period) Advanced FinFET design with pads, why does internal register-to-register (R2R) timing meet slack comfortably (+0.97 ns) while input-to-output (I2O) timing suffers catastrophic violations (about −1.9 ns with typical pad arcs, worse with heavy board C_load)? Walk through the physical delay breakdown of bidirectional pad cells and explain why path grouping ('define_cost_group') alone cannot fix WNS.",
    shortSummary: "Bidirectional IO pad cells introduce massive physical delays: an input receiver adds ~0.7 ns while an output driver adds ~1.4 ns — already most of a 2.0 ns period before core logic. With typical external delays the I2O slack is about −1.9 ns (worse under heavy board C_load). R2R paths stay on fast core wires/gates (+0.97 ns). Path grouping only reweights optimization; it cannot defy pad physics. Fix I2O with boundary pipelining or a realistic interface period/MCP.",
    detailedAnswer: `### 1. The Physics of the Pad Delay Discrepancy:
In modern FinFET nodes, standard cell combinational gates switch in **10 to 30 picoseconds**. However, chip I/O pads operate under entirely different physical constraints:
- **Core Standard Cells**:
  - Drive femtofarad (1 – 10 fF) on-chip metal wires.
  - Operating voltage: 0.72 V.
- **Perimeter IO Pads**:
  - Must drive **massive off-chip board traces, package pins, and PCB loads (10 – 50 pF)**!
  - Must interface with 1.8 V or 3.3 V signaling, requiring high-voltage level shifters and heavy ESD protection structures.

---

### 2. Physical Delay Anatomy of the Practice Chip I2O Path:
Consider the path from input pad \`pad_addr_i[2]\` to output pad \`pad_zero_flag\`:

$$\\text{Clock Period} = 2.000\\text{ ns} \\quad (500\\text{ MHz})$$

| Path Segment | Delay | Cumulative Time | Notes |
| :--- | :--- | :--- | :--- |
| External Input Delay | 0.100 ns | 0.100 ns | Board trace & launch skew |
| Input Pad Receiver (\`IO_IN_PAD\`) | **0.720 ns** | 0.820 ns | Level-shift & ESD input receiver |
| Internal Core Decoder Logic | 1.250 ns | 2.070 ns | Standard cell combinational logic |
| Output Pad Driver (\`IO_OUT_PAD\`) | **1.425 ns** | 3.495 ns | High-voltage 50 pF off-chip driver |
| External Output Delay + Setup | 0.200 ns | 3.695 ns | Board receiver setup requirement |
| Clock Uncertainty Margin | 0.200 ns | 3.895 ns | Jitter & clock skew margin |

$$\\text{Data Arrival Time} = T_{\\text{in\\_delay}} + T_{\\text{pad\\_in}} + T_{\\text{core}} + T_{\\text{pad\\_out}} = 0.100 + 0.720 + 1.250 + 1.425 = 3.495\\text{ ns}$$
$$\\text{Required Time} = T_{\\text{period}} - T_{\\text{out\\_delay}} - T_{\\text{uncertainty}} = 2.000 - 0.200 - 0.200 = 1.600\\text{ ns}$$
$$\\text{Slack} = \\text{Required} - \\text{Arrival} = 1.600\\text{ ns} - 3.495\\text{ ns} = \\mathbf{-1.895\\text{ ns}} \\quad \\text{(VIOLATED!)}$$

**Accounting note (avoid double-counting):** External output delay and uncertainty belong in **required time**, not in a second “cumulative arrival” column. The table’s last two rows are budget terms for $T_{\\text{req}}$, not additive path delay. Under heavier board $C_{\\text{load}}$, $T_{\\text{pad\\_out}}$ grows and slack gets **more negative** — but quote one consistent equation set in interviews.

- **The Contrast with R2R**:
  - The internal MAC multiplier/adder (\`prod_r\` $\\to$ \`y_reg[15]\`) runs entirely within the core.
  - Logic depth is ~1.0 ns, yielding positive slack: **+0.970 ns (MET)**!

---

### 3. Why Path Grouping ('define_cost_group') Cannot Fix WNS:
- Engineers often run:
  \`define_cost_group -name I2O -design pad_top\`
  \`path_group -from [all_inputs] -to [all_outputs] -group I2O\`
  \`set_path_group_options I2O -effort_level high -weight 10\`
- **The Reality**:
  - Cost grouping alters the optimizer's priority weighting, preventing a failing I2O path from masking internal R2R paths.
  - However, **no synthesis tool can squeeze a ~3.5 ns pad-dominated arrival into a 2.0 ns period with a 1.6 ns required time**.
- **The True Engineering Solutions**:
  1. **Architectural Pipelining**: Register inputs immediately after the input pad, and register outputs immediately before the output pad (transforming I2O into I2R and R2O).
  2. **Multi-Cycle Path Exception**: Apply \`set_multicycle_path -setup 3\` if the external board protocol allows multiple clock periods for handshaking.
  3. **Relaxing External Clock Frequency**: Increasing clock period to 10.0 ns (100 MHz) closes timing cleanly.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Path Cost Grouping & I2O Diagnostic Script:

# 1. Define Dedicated Cost Groups for Independent Optimization:
define_cost_group -name R2R -design pad_top
define_cost_group -name I2R -design pad_top
define_cost_group -name R2O -design pad_top
define_cost_group -name I2O -design pad_top

# 2. Assign Timing Paths to Respective Cost Groups:
path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r
path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o

# 3. Direct High Optimization Effort on Core Paths:
set_path_group_options R2R -effort_level high -weight 10
set_path_group_options I2O -effort_level medium -weight 1

# 4. Report QoR Breakdown by Cost Group:
report_qor > reports/qor_cost_groups.rpt
report_timing -group I2O -max_paths 5 > reports/timing_i2o_violations.rpt
report_timing -group R2R -max_paths 5 > reports/timing_r2r_clean.rpt`,
    },
    commonPitfalls: [
      "Believing that increasing synthesis effort or max_fanout rules will magically close a -3.5 ns I2O violation dominated by physical pad delays.",
      "Masking genuine architectural timing violations by blindly declaring false paths on active chip I/O buses.",
      "Ignoring the distinction between ideal pre-CTS clock arrival and real post-route clock latency during pad delay budgeting.",
    ],
    interviewerFollowups: [
      "Why does set_driving_cell on input ports drastically alter the calculated delay of the input pad receiver?",
      "How do package wirebond inductances and board capacitances affect output pad driver slew rates?",
    ],
    tags: ["i2o-paths", "pad-delays", "path-groups", "cost-groups", "wns-budgeting", "genus-cui"],
  },

  {
    id: "chip-03",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal STA & Library Characterization Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "FinFET Temperature Inversion & Setup Signoff: Why is the worst-case setup corner in Advanced FinFET often cold (-40°C) with low voltage (0.72V) rather than traditional hot (125°C)? Explain the physical battle between carrier mobility (μ) and threshold voltage (Vth), and why single-corner synthesis targets 'ssgnp0p72vm40c'.",
    shortSummary: "In legacy planar nodes, higher temperature degraded carrier mobility, making hot (125°C) always the slowest setup corner. In advanced FinFETs operating at low supply voltages (0.72V), lowering temperature increases threshold voltage (Vth), severely reducing gate overdrive (Vdd - Vth). Because the overdrive drop overcomes the mobility improvement, cold (-40°C) becomes slower than hot (125°C). Single-corner synthesis targets SS / 0.72V / -40°C to capture this worst-case setup condition.",
    detailedAnswer: `### 1. The Classical Planar Physics (Hot is Slow):
In legacy $>65\,\\text{nm}$ technologies operating at $1.2\,\\text{V} - 3.3\,\\text{V}$, cell propagation delay was dominated by carrier mobility:
$$I_{\\text{on}} \\propto \\mu(T) \\cdot (V_{\\text{dd}} - V_{\\text{th}})^{\\alpha}$$
- As temperature increases ($T ↑$):
  - Phonon lattice scattering increases, severely degrading electron/hole mobility:
    $$\\mu(T) \\propto T^{-1.5}$$
  - Since $V_{\\text{dd}} \\gg V_{\\text{th}}$, the gate overdrive $(V_{\\text{dd}} - V_{\\text{th}})$ remained comfortably large.
  - Therefore, **high temperature ($125^\circ\\text{C}$) was universally the slowest setup corner**.

---

### 2. The Advanced FinFET Temperature Inversion Phenomenon:
In Advanced FinFET operating at near-threshold supply voltages ($V_{\\text{dd}} = 0.72\,\\text{V}$):
- Threshold voltage is strongly temperature-dependent:
  $$V_{\\text{th}}(T) = V_{\\text{th0}} - \\kappa \\cdot (T - T_0)$$
- **When Temperature Drops to Cold ($-40^\circ\\text{C}$)**:
  - $V_{\\text{th}}$ increases significantly (by $80 - 120\,\\text{mV}$)!
  - At $V_{\\text{dd}} = 0.72\,\\text{V}$ and $V_{\\text{th}} = 0.45\,\\text{V}$, gate overdrive $(V_{\\text{dd}} - V_{\\text{th}})$ collapses from $0.39\,\\text{V}$ down to $0.27\,\\text{V}$!
  - The quadratic drop in drive current caused by threshold shift **completely overwhelms the modest gain in carrier mobility**:
    $$I_{\\text{on}} ↓ \\implies \\text{Propagation Delay } \\tau = \\frac{C_L V_{\\text{dd}}}{I_{\\text{on}}} \\mathbf{↑ ↑ (SLOWER!)}$$

---

### 3. Single-Corner Synthesis Library Selection:
When executing initial synthesis without full MMMC matrices:
- Design teams target:
  \`stdcells_ss_0p72v_m40c.lib\`
  - \`ssgnp\`: Slow-Slow Global, Nominal Process corner.
  - \`0p72v\`: Lowest operational supply voltage ($0.80\,\\text{V} - 10\%$).
  - \`m40c\`: **Minus 40 degrees Celsius (Cold)**!
- Captures the true absolute worst-case silicon setup delay trajectory for FinFET gate switching.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Advanced FinFET Single-Corner vs Multi-Corner Setup Script:

# 1. Target Single Worst-Case Cold Setup Corner in Initial Synthesis:
set_db library [list \
  stdcells_ss_0p72v_m40c.lib \
  io_pads_ss_0p72v_1p62v.lib \
]

# 2. Audit Standard Cell Gate Delay at -40C vs 125C:
# In FinFETs at 0.72V: Delay(-40C) > Delay(125C) by up to 18%!
get_db [get_db lib_cells */*ND2*] .delay_corner

# 3. Signoff MMMC Delay Corner Setup for Downstream PnR:
create_delay_corner -name dc_slow_cold \
  -timing_condition tc_ss_0p72v_m40c \
  -rc_corner rc_worst_m40c

create_delay_corner -name dc_slow_hot \
  -timing_condition tc_ss_0p72v_125c \
  -rc_corner rc_worst_125c`,
    },
    commonPitfalls: [
      "Assuming high temperature (125°C) is always the worst setup corner in FinFETs, causing synthesis to optimize against the wrong corner and fail setup on cold silicon.",
      "Failing to account for wire resistance temperature behavior, where metal lines become faster at -40°C while FinFET gates become slower.",
      "Using standard typical (TT) libraries for synthesis signoff instead of slow-corner corner libraries.",
    ],
    interviewerFollowups: [
      "At what crossover voltage does temperature inversion typically take effect in FinFET and 7nm processes?",
      "Why does hold timing become extremely dangerous at FF / 0.88V / 125°C in the presence of temperature inversion?",
    ],
    tags: ["temperature-inversion", "finfet-padring", "finfet-physics", "ss-cold-m40c", "timing-corners", "genus-cui"],
  },

  {
    id: "chip-04",
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Lead Synthesis & Timing Methodology Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Production SDC Constraint Hygiene: Walk through the required constraint order for 'pad_top.sv'. Why must 'set_interactive_constraint_modes' be called before re-reading SDC, what is the operational purpose of 'set_driving_cell' and 'set_load 0.05', and how do you populate the clock-to-clock uncertainty matrix ('report_clocks -uncertainty_table')?",
    shortSummary: "SDC must follow a deterministic hierarchy: clock definition -> uncertainty -> I/O delays -> false paths -> driving cells & loads. When modifying constraints interactively in Genus, set_interactive_constraint_modes activates the current mode so read_sdc overrides active rules. set_driving_cell computes realistic input slews, while set_load 0.05 pF models external PCB capacitance. An empty uncertainty table is populated using inter-clock commands (set_clock_uncertainty -from -to).",
    detailedAnswer: `### 1. The Strict SDC Authoring Order:
SDC statements must be applied in a logical dependency sequence:
1. \`set_units -time ns -capacitance pF\`
2. \`create_clock -name CLK -period 2.0 [get_ports pad_clk]\` (Establishes the timing reference).
3. \`set_clock_uncertainty 0.02 [get_clocks CLK]\` (Injects jitter guardband).
4. \`set_input_delay / set_output_delay\` (Constrains external board boundaries).
5. \`set_false_path -from [get_ports pad_rst_n]\` (Waives asynchronous resets).
6. \`set_driving_cell / set_load\` (Defines electrical transition and capacitive boundaries).

---

### 2. Interactive SDC Re-Application in Genus:
In Cadence Stylus Common UI, SDC constraints reside inside **Constraint Modes**:
- If you simply execute \`read_sdc\` in an open session without context, Genus may append constraints ambiguously or warn of mode conflicts.
- **The Proper Interactive Update Protocol**:
  \`set_interactive_constraint_modes [all_constraint_modes -active]\`
  \`read_sdc -echo ../sdc/pad_top_func.sdc\`
  - This informs Genus to apply the incoming SDC rules directly to the active constraint mode.
  - \`check_timing\` can be re-run immediately to inspect the constraint effect **without needing an expensive incremental syn_opt pass!**

---

### 3. Electrical Modeling: 'set_driving_cell' vs 'set_load 0.05':
- **\`set_driving_cell -lib_cell BUF_X4 [all_inputs]\`**:
  - Instead of assuming an ideal, instantaneous 0 picosecond input transition, Genus queries the standard cell Liberty model for \`BUF_X4\`.
  - Calculates the exact input slew based on the input pad's internal pin capacitance.
  - Eliminates the *'Inputs without driver/transition'* lint in \`check_timing\`.
- **\`set_load 0.05 [all_outputs]\`**:
  - Sets an external capacitive load of $0.05\,\\text{pF} = 50\,\\text{fF}$ on all chip outputs.
  - Forces the output pad driver to size its internal stage to drive real board traces without slew degradation.

---

### 4. Populating 'report_clocks -uncertainty_table':
- When running \`report_clocks -uncertainty_table\`, engineers are often puzzled to see an empty matrix.
- **Why It Is Empty**:
  - Applying simple \`set_clock_uncertainty 0.2 [get_clocks CLK]\` defines an intra-clock uncertainty, which does not populate the inter-clock matrix.
- **How to Populate**:
  - Explicitly declare clock-to-clock domain interactions:
    \`set_clock_uncertainty 0.20 -from [get_clocks CLK] -to [get_clocks CLK]\`
  - Re-running \`report_clocks -uncertainty_table\` now prints a formatted matrix displaying the $200\,\\text{ps}$ margin!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Production SDC Constraint Hygiene Script:

# 1. Activate Interactive Constraint Mode:
set_interactive_constraint_modes [all_constraint_modes -active]

# 2. Define Clocks and Populated Uncertainty Matrix:
create_clock -name CLK -period 2.0 -waveform {0 1.0} [get_ports pad_clk]
set_clock_uncertainty 0.20 -from [get_clocks CLK] -to [get_clocks CLK]

# 3. Apply Boundary Delays Relative to External Clock:
set_input_delay  0.100 -clock CLK [remove_from_collection [all_inputs] [get_ports pad_clk]]
set_output_delay 0.200 -clock CLK [all_outputs]

# 4. Apply False Path on Asynchronous Reset:
set_false_path -from [get_ports pad_rst_n]

# 5. Define Electrical Environment (Driver & Load):
set_driving_cell -lib_cell BUFX4 [remove_from_collection [all_inputs] [get_ports {pad_clk pad_rst_n}]]
set_load 0.05 [all_outputs]

# 6. Run Timing Linter & Audit Clock Uncertainty Matrix:
check_timing -verbose > reports/check_timing_clean.rpt
report_clocks -uncertainty_table > reports/clock_uncertainty_matrix.rpt`,
    },
    commonPitfalls: [
      "Failing to set interactive constraint modes before re-reading SDC, causing silent constraint drops or unintended duplicate rules.",
      "Confusing set_load (capacitance in pF) with set_output_delay (time in ns), leading to gross timing miscalculations.",
      "Misspelling set_clock_uncertainty (e.g. 'uncertainity'), which fails silently or issues ignored warnings in large batch scripts.",
    ],
    interviewerFollowups: [
      "How does set_clock_latency differ between source latency and network latency during pre-CTS synthesis?",
      "Why should clock definition ports be excluded from set_driving_cell commands?",
    ],
    tags: ["sdc-hygiene", "check_timing", "set_driving_cell", "set_load", "uncertainty-matrix", "genus-cui"],
  },

  {
    id: "chip-05",
    domain: "physical-design",
    domainName: "Physical Design & PnR Signoff",
    role: "Lead Physical Design & Pad Ring Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Pad Ring Floorplanning Handoff: Distinguish between logical signal pads instantiated in RTL versus physical pad ring structures added in Innovus. How do 'write_io_file -template' and 'read_io_file' establish the clockwise perimeter pad ordering, and why are physical IO fillers ('IO_FILLER*') required for N-well and power ring continuity?",
    shortSummary: "RTL (pad_top.sv) only instantiates functional signal pads (IO_IN_PAD/IO_OUT_PAD). Innovus adds physical pad ring structures: corner cells (IO_CORNER_PAD), power/ground pads (PVDD/PVSS), ESD clamp cells, and IO filler cells (IO_FILLER*). The clockwise perimeter ordering is captured using write_io_file -template and loaded via read_io_file. IO_FILLER cells close physical gaps between adjacent pads to maintain continuous N-well, guard rings, and high-voltage power metal rails.",
    detailedAnswer: `### 1. Functional RTL Pads vs Physical PnR Pad Ring Structures:
A functioning silicon chip requires both logical signaling and physical pad ring integrity:
- **In Functional RTL (\`pad_top.sv\`)**:
  - Instantiates **only active signal pads**:
    - Data inputs/outputs (\`IO_IN_PAD\`, \`IO_OUT_PAD\`).
    - Dedicated clock inputs (\`IO_IN_PADW\`).
    - Analog or JTAG boundary-scan pads.
- **In Innovus Physical PnR**:
  - Adds physical non-signal pad structures:
    1. **Corner Cells (\`IO_CORNER_PAD\` / \`IO_CORNER_PAD\`)**: Placed at all 4 chip corners to bridge power rings and substrate guard rings around $90^\circ$ bends.
    2. **Power & Ground Pads (\`PVDD_CORE\`, \`PVSS_CORE\`, \`PVDD_IO\`, \`PVSS_IO\`)**: Injects power grids into internal core logic and perimeter IO drivers.
    3. **ESD Clamp Breaker Cells (\`ESD_CLAMP\`, \`ESD_BREAKER\`)**: Provides electrostatic discharge diversion paths.
    4. **IO Filler Cells (\`IO_FILLER*\`)**: Standard-width physical spacer blocks.

---

### 2. Why IO Fillers ('IO_FILLER*') Are Mandatory:
- Adjacent signal pads are placed with physical spacing ($20 - 60\,\\mu\\text{m}$) along the chip boundary to align with package bond pads.
- **The Discontinuity Problem**:
  - IO pads contain internal high-voltage N-wells, guard rings for latch-up immunity, and un-interrupted power ring metallization (V18 / VSS).
  - Without fillers, the perimeter power rings are broken, and open N-well boundaries trigger fatal design rule (DRC) violations!
- **The Solution**:
  - Innovus inserts \`IO_FILLER_20U\`, \`IO_FILLER_5U\`, \`IO_FILLER_1U\` to seamlessly connect adjacent pads into an unbroken, continuous 360-degree electrical ring.

---

### 3. The Innovus IO Assignment Flow (\`read_io_file\`):
1. **Generate the Template**:
   \`write_io_file -template -io_order clockwise -include_cell_name pad_top_template.io\`
2. **Edit the IO File**:
   Assign pads to specific chip sides (TOP, BOTTOM, LEFT, RIGHT) and specify exact sequence ordering to match package leadframes.
3. **Ingest into Floorplan**:
   \`read_io_file pad_top_template.io\`
   Innovus snaps all pad cells to legal perimeter IO pad sites around the core!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Innovus IO Assignment & Pad Ring Assembly Flow:

# ==============================================================================
# IN INNOVUS SESSION: Generate and Apply IO Assignment File
# ==============================================================================
# 1. Export Clean Clockwise IO Assignment Template:
write_io_file -template -io_order clockwise \
              -include_cell_name outputs/pad_top_template.io

# 2. Load Completed IO Assignment File into Floorplan:
read_io_file configs/pad_top_perimeter_placement.io

# 3. Place Corner Cells at Die Boundaries:
addInst -cell IO_CORNER_PAD -inst u_corner_top_left     -loc {0 2000} -ori R0
addInst -cell IO_CORNER_PAD -inst u_corner_top_right    -loc {2000 2000} -ori R270
addInst -cell IO_CORNER_PAD -inst u_corner_bottom_right -loc {2000 0} -ori R180
addInst -cell IO_CORNER_PAD -inst u_corner_bottom_left  -loc {0 0} -ori R90

# 4. Insert IO Filler Cells to Close Well & Power Ring Continuity:
addIoFiller -cell {IO_FILLER_20U IO_FILLER_10U IO_FILLER_5U IO_FILLER_1U} \
            -prefix IO_FILLER \
            -side {top bottom left right}

# 5. Verify Pad Ring DRC and Electrical Continuity:
verify_drc -pad_ring
verify_connectivity -type regular_pg`,
    },
    commonPitfalls: [
      "Instantiating physical IO fillers (IO_FILLER*) in functional RTL netlists, which creates redundant fake gates in logic synthesis.",
      "Failing to insert IO_CORNER_PAD cells, causing power rings to break at 90-degree die corners.",
      "Reading an IO assignment file with mismatched pad instance names after a top-level RTL renaming.",
    ],
    interviewerFollowups: [
      "What is the difference between wirebond pad pitch and flip-chip bump array pitch?",
      "How do back-to-back ESD clamp cells prevent power supply ringing on high-speed IO switching lines?",
    ],
    tags: ["pad-ring", "io-file", "pfiller", "pcorner", "floorplanning", "innovus-flow"],
  },

  // 🟢 DOMAIN: GENUS SYNTHESIS MASTER & 10+ YEAR INTERVIEW ARCHITECTURE
  {
    id: "mst-01",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Senior Staff RTL-to-GDS Synthesis Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "The 3 Abstraction Layers of Synthesis: Deconstruct 'syn_generic', 'syn_map', and 'syn_opt' from an algorithmic and backend perspective. How does the netlist fundamentally transform across these 3 stages, what cost functions drive each transformation, and why is synthesis a constrained multi-objective optimization rather than compilation to random gates?",
    shortSummary: "Synthesis transforms RTL through three distinct abstraction layers: syn_generic performs technology-independent Boolean restructuring, constant propagation, and datapath operator inference into GTECH gates. syn_map executes technology covering, binding generic cones to physical foundry standard cells using NLDM/CCS table lookups under a multi-objective cost function (timing, area, power, DRVs). syn_opt performs post-mapping gate sizing, repeater insertion, pin swapping, and area reclamation.",
    detailedAnswer: `### 1. The Mental Model of Synthesis:
Synthesis is **not** a compiler that emits random gates. It is a **constrained multi-objective transformation engine**:
$$\\text{Cost} = W_{\\text{timing}} \\cdot \\text{TNS} + W_{\\text{area}} \\cdot \\text{Area} + W_{\\text{power}} \\cdot \\text{Power} + W_{\\text{drv}} \\cdot \\text{DRV}$$

---

### 2. The 3 Abstraction Layers:

| Synthesis Stage | Netlist Nature | Technology Dependency | Core Algorithmic Transformations |
| :--- | :--- | :--- | :--- |
| **\`elaborate\`** | Hierarchical RTL Database | Independent | Parameter propagation, generate expansion, sequential inferencing (DFF/latch detection), port binding. |
| **\`syn_generic\`** | GTECH Generic Logic | Tech-Independent | Multi-level Boolean factoring, dead-code pruning, constant propagation, resource sharing, datapath arithmetic structuring. |
| **\`syn_map\`** | Foundry \`lib_cell\` Instances | Bound to Liberty | Technology covering (matching Boolean cones to library cells), drive strength selection via NLDM/CCS delay table lookups. |
| **\`syn_opt\`** | Optimized Gate Netlist | Bound to Liberty | Physical/spatial gate sizing, repeater insertion, pin swapping, logic restructuring, and area recovery on non-critical paths. |

---

### 3. Detailed Algorithmic Mechanics:
1. **\`syn_generic\` (Technology-Independent Optimization)**:
   - Builds a network of generic Boolean gates and flip-flops without technology pin capacitance constraints.
   - Evaluates datapath arithmetic: determines whether an adder tree should be structured as a Ripple-Carry Adder (RCA) for area or a Carry-Lookahead Adder (CLA) for timing under early wireload estimates.
   - Key Flags: \`-physical\` (incorporates floorplan DEF), \`-create_floorplan\` (builds early 70% density square floorplan), and \`-estimate_flop_bits\` (stops early for DFT sequential planning).
2. **\`syn_map\` (Technology Mapping & Cell Binding)**:
   - Solves the DAG (Directed Acyclic Graph) covering problem: traverses generic Boolean trees and selects the lowest-cost combination of library cells (NAND, NOR, AND-OR-INVERT, Complex AOI/OAI).
   - Evaluates cell delay using 2D non-linear delay model (NLDM) or composite current source (CCS) tables:
     $$\\text{Cell Delay } \\tau = f(\\text{Input Slew } S_{\\text{in}}, \\text{Output Load } C_{\\text{load}})$$
   - Enforces cell policies: skips cells flagged as \`.dont_use true\` and obeys library design rule constraints (max transition, max capacitance).
3. **\`syn_opt\` (Post-Mapping Optimization & Timing Closure)**:
   - Gate Sizing: Upsizes cells on critical paths to accelerate transitions; downsizes cells with positive slack to reclaim silicon area and reduce dynamic leakage.
   - Pin Swapping: Swaps symmetric input pins on multi-input gates to assign the timing-critical signal to the fastest internal pin arc.
   - Buffering: Inserts balanced repeater trees on high-fanout nets to cure slew degradation.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete 3-Stage Cadence Genus Synthesis Pipeline:

# 1. Setup Technology Libraries & Read Design:
set_db library [list stdcells_ss_0p72v.lib io_ss.lib]
read_hdl -sv [glob ../rtl/*.sv]
elaborate soc_top
check_design -unresolved

# 2. Ingest Constraints & Set Interactive Mode:
set_interactive_constraint_modes [all_constraint_modes -active]
read_sdc ../sdc/soc_top_func.sdc
check_timing

# 3. Stage 1: Technology-Independent Generic Synthesis:
syn_generic
report_qor > reports/qor_generic.rpt

# 4. Stage 2: Technology Mapping to Standard Cell Library:
syn_map
report_qor > reports/qor_map.rpt

# 5. Stage 3: Post-Mapping Sizing & Timing Optimization:
syn_opt
report_qor > reports/qor_opt.rpt

# 6. Verify Netlist Integrity:
check_design -all > reports/check_design_final.rpt
write_hdl > outputs/soc_top_mapped.v
write_sdc > outputs/soc_top_mapped.sdc`,
    },
    commonPitfalls: [
      "Assuming syn_generic binds real standard cells, leading to confusion when reporting timing before syn_map.",
      "Expecting syn_opt to fix multi-nanosecond hold violations that are fundamentally dominated by post-CTS physical clock skew.",
      "Leaving dont_use attributes unset on slow delay cells or high-drive clock buffers, allowing syn_map to place them in functional logic paths.",
    ],
    interviewerFollowups: [
      "How does technology mapping handle don't-care Boolean conditions (DC-set) during covering?",
      "Why does syn_opt prioritize setup WNS over TNS by default, and how can you force global TNS optimization?",
    ],
    tags: ["synthesis-engine", "syn_generic", "syn_map", "syn_opt", "cost-function", "genus-cui"],
  },

  {
    id: "mst-02",
    isFreeSample: true,
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Principal STA & Timing Closure Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "The Exact Mathematics of External Delays: Where do 'set_input_delay' and 'set_output_delay' land in the setup and hold slack equations? Refute the common misconception that 'input_delay adds to required time', prove the dual mathematical formulations of output_delay, and derive the slack equations across all 4 path groups (R2R, I2R, R2O, I2O).",
    shortSummary: "set_input_delay models off-chip launch latency and strictly adds to Data Arrival Time on paths originating at input ports (I2R, I2O). set_output_delay models off-chip capture requirements and strictly subtracts from Data Required Time on paths terminating at output ports (R2O, I2O) in standard STA bookkeeping. On pure R2R paths, external delays are completely absent.",
    detailedAnswer: `### 1. Refuting the Senior Interview Misconception:
A frequent candidate mistake is asserting that:
*"set_input_delay is added to required time."*
**This is fundamentally false in standard STA formulation.**
- **The Physical Reality**:
  - The outside transmitter launches data relative to an external clock edge.
  - \`set_input_delay\` represents the time data spends traveling through the external PCB trace, package wirebond, and external driver **before arriving at the chip boundary port**.
  - Therefore, \`set_input_delay\` is **external arrival time** and **strictly adds to Data Arrival Time**:
    $$T_{\\text{arrival}} = T_{\\text{launch}} + T_{\\text{input\_delay}} + T_{\\text{datapath}}$$

---

### 2. The 4 Path Groups & Their Exact Equations:

| Path Group | Startpoint | Endpoint | Data Arrival Time ($T_{\\text{arrival}}$) | Data Required Time ($T_{\\text{required}}$) |
| :--- | :--- | :--- | :--- | :--- |
| **R2R** (Core) | Flop $Q$ pin | Flop $D$ pin | $T_{\\text{launch}} + T_{\\text{clk\_launch}} + T_{co} + T_{dp}^{\\max}$ | $T_{\\text{capture}} + T_{\\text{clk\_capture}} - T_{su} - T_{unc}$ |
| **I2R** (Input) | Input Port | Flop $D$ pin | $T_{\\text{launch}} + \\mathbf{T_{\\text{input\_delay}}^{\\max}} + T_{dp}^{\\text{port} \\to D}$ | $T_{\\text{capture}} + T_{\\text{clk\_capture}} - T_{su} - T_{unc}$ |
| **R2O** (Output) | Flop $Q$ pin | Output Port | $T_{\\text{launch}} + T_{\\text{clk\_launch}} + T_{co} + T_{dp}^{Q \\to \\text{port}}$ | $T_{\\text{capture}} - \\mathbf{T_{\\text{output\_delay}}^{\\max}} - T_{unc}$ |
| **I2O** (Feedthru) | Input Port | Output Port | $T_{\\text{launch}} + \\mathbf{T_{\\text{input\_delay}}^{\\max}} + T_{dp}^{\\text{port} \\to \\text{port}}$ | $T_{\\text{capture}} - \\mathbf{T_{\\text{output\_delay}}^{\\max}} - T_{unc}$ |

---

### 3. The Dual Formulations of 'set_output_delay':
In timing reports, tools display \`set_output_delay\` as reducing the Required Time:
$$\\text{Standard Form: } \\quad \\text{Slack} = (T_{\\text{capture}} - T_{\\text{output\_delay}} - T_{unc}) - T_{\\text{arrival}}$$

Some engineers mentally write \`set_output_delay\` as an addition to Arrival Time:
$$\\text{Dual Form: } \\quad \\text{Slack} = T_{\\text{capture}} - (T_{\\text{arrival}} + T_{\\text{output\_delay}} + T_{unc})$$

Both expressions are **mathematically identical**. However, standard Cadence Genus and Innovus reports list \`output_delay\` under the **Data Required Path** column.

---

### 4. Setup vs Hold Sensitivity:
- **Increasing \`set_input_delay -max\` by $+100\\text{ ps}$**:
  - Increases $T_{\\text{arrival}}$ by $100\\text{ ps}$.
  - **Setup slack on I2R/I2O degrades by exactly $-100\\text{ ps}$**.
- **Increasing \`set_output_delay -max\` by $+100\\text{ ps}$**:
  - Decreases $T_{\\text{required}}$ by $100\\text{ ps}$.
  - **Setup slack on R2O/I2O degrades by exactly $-100\\text{ ps}$**.
- On pure internal **R2R paths**, neither constraint has any effect!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete External Delay Verification & Audit Script:

# 1. Constrain Clock and External Delays:
create_clock -name CLK -period 2.000 [get_ports clk]
set_input_delay  0.400 -clock CLK [all_inputs -no_clocks]
set_output_delay 0.350 -clock CLK [all_outputs]

# 2. Audit External Delays Bound to Ports:
report_port -delay [all_inputs -no_clocks]
report_port -delay [all_outputs]

# 3. Report Detailed Path Breakdown with Start/End Columns:
# Notice input_delay appears in the Arrival section:
report_timing -from [all_inputs -no_clocks] -to [all_registers] -path_type full

# Notice output_delay appears in the Required section:
report_timing -from [all_registers] -to [all_outputs] -path_type full`,
    },
    commonPitfalls: [
      "Believing that changing set_input_delay alters internal register-to-register (R2R) slack.",
      "Confusing set_output_delay (required external budget in ns) with set_load (external capacitive load in pF).",
      "Applying input delay constraints to the clock input port, corrupting clock launch edge timing.",
    ],
    interviewerFollowups: [
      "How do source latency and network latency interact with input_delay when -source_latency_included is not specified?",
      "In a DDR (Dual Data Rate) interface, how are set_input_delay -rise and -fall applied relative to both clock edges?",
    ],
    tags: ["sdc-math", "input-delay", "output-delay", "slack-equations", "path-groups", "sta"],
  },

  {
    id: "mst-03",
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Lead Synthesis & Design Rule Specialist",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "'check_design' Deep Playbook: How do you diagnose and resolve multiple drivers, combinational feedback loops, and floating undriven pins in Genus? Explain why Verilog continuous assigns must be eliminated before PnR handoff, and walk through the operation of 'remove_assigns_without_opt' and 'add_tieoffs'.",
    shortSummary: "check_design is the mandatory structural linter that validates netlist correctness before timing optimization. Multiple drivers cause electrical bus contention, combinational loops cause race conditions and simulator lockups, and floating undriven pins result in unpredictable silicon states. Continuous assigns create physical short circuits in PnR and are resolved by inserting non-inverting buffers (remove_assigns_without_opt). Logical tie-offs (1'b0/1'b1) are mapped to dedicated physical cells via add_tieoffs.",
    detailedAnswer: `### 1. The Criticality of Structural Design Auditing:
A design with passing timing slack ($WNS > 0$) is completely worthless if the netlist contains structural defects. \`check_design\` audits the structural connectivity graph before and after mapping.

---

### 2. Diagnosis & Resolution Playbook:

| Check Flag | Severity | Physical / Silicon Hazard | Resolution Protocol |
| :--- | :--- | :--- | :--- |
| **\`-unresolved\`** | **Fatal** | Missing sub-modules or unmapped library black boxes. | Ingest missing RTL or add library path to \`set_db library\`. |
| **\`-multiple_driver\`** | **Fatal** | Short circuit: two outputs drive the same wire, causing high crowbar current. | Fix RTL driver assignments or insert multiplexers. |
| **\`-combo_loops\`** | **Fatal** | Race condition: asynchronous latching and tool timing convergence failure. | Break feedback cycle in RTL by registering the loop. |
| **\`-undriven\`** | **High** | High-impedance floating gate oxide prone to ESD breakdown and indeterminate state. | Connect net to valid logic in RTL or tie to constant. |
| **\`-assigns\`** | **High** | Verilog continuous assignment wires trigger LVS shorts in Innovus PnR. | Replace with physical buffers via \`remove_assigns_without_opt\`. |
| **\`-constant\`** | **Context** | Input pin tied to \`1'b0\` or \`1'b1\`. Expected on pad ties, bug on control logic. | Review intent; replace with physical tie cells via \`add_tieoffs\`. |

---

### 3. Eliminating Continuous Assigns:
In synthesized Verilog netlists:
\`assign net_b = net_a;\`
- In standard PnR tools (Innovus), continuous assigns are treated as two distinct net names shorted together, creating fatal layout-versus-schematic (LVS) shorts and routing connectivity errors.
- **The Resolution**:
  \`set_remove_assign_options -buffer_or_inverter BUF_X2 -design top\`
  \`remove_assigns_without_opt -design top -verbose\`
  - Replaces the raw Verilog assign statement with a physical buffer instance (\`BUF_X2\`) without invoking an expensive multi-hour global timing optimization pass!

---

### 4. The Physical Tie-Off Flow (\`add_tieoffs\`):
- Standard cell gates must never connect directly to the global power/ground rails ($V_{\\text{DD}}$ / $V_{\\text{SS}}$) because supply transients and ESD spikes can rupture the thin gate dielectric oxide.
- **\`add_tieoffs\`**:
  \`add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 top\`
  - Replaces logical \`1'b0\` and \`1'b1\` nets with dedicated foundry tie-high (\`TIEHI\`) and tie-low (\`TIELO\`) cells.
  - Limits tie-cell fanout to 8 to prevent local current starvation.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete check_design Audit & Structural Cleanliness Flow:

# 1. Run Pre-Synthesis Structural Audits:
check_design -unresolved > reports/check_unresolved.rpt
check_design -multiple_driver > reports/check_multidrive.rpt
check_design -combo_loops > reports/check_loops.rpt
check_design -undriven > reports/check_undriven.rpt

# 2. Complete Synthesis Pipeline:
syn_generic
syn_map
syn_opt

# 3. Replace Verilog Continuous Assigns with Physical Buffers:
set_remove_assign_options -buffer_or_inverter BUF_X2 -design soc_top
remove_assigns_without_opt -design soc_top -verbose
check_design -assigns

# 4. Insert Physical Tie-High and Tie-Low Cells:
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 soc_top
check_design -through_tie_cell

# 5. Final Netlist Export:
check_design -all > reports/check_design_signoff.rpt
write_hdl > outputs/soc_top_clean.v`,
    },
    commonPitfalls: [
      "Ignoring check_design -assigns warnings and handing off Verilog assigns to Innovus, resulting in fatal LVS short circuit violations.",
      "Allowing combinational feedback loops to remain, which causes synthesis and STA engines to disable timing arcs unpredictably.",
      "Connecting standard cell inputs directly to VDD/VSS without tie cells, creating gate oxide breakdown hazards.",
    ],
    interviewerFollowups: [
      "What is the difference between remove_assigns_without_opt and set_db remove_assigns true during syn_opt?",
      "How does check_design -lib_lef_consistency prevent pin geometry mismatches between Liberty timing models and physical LEFs?",
    ],
    tags: ["check_design", "assigns", "tie-cells", "combo-loops", "multiple-drivers", "lvs-clean"],
  },

  {
    id: "mst-04",
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Senior Staff Timing Closure & Methodology Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Timing Closure Triage & Path Cost Groups: Why does 'group_path' never create positive slack on its own? Walk through the first 15-minute diagnostic protocol when chip WNS is -3.5 ns but internal R2R paths have +0.9 ns positive slack, and contrast DRV-limited paths from logic-depth-limited paths.",
    shortSummary: "group_path categorizes paths and adjusts the optimizer cost function weighting; it changes optimization priority but cannot overcome physical path delays. When chip WNS is -3.5 ns while R2R is +0.9 ns, the violation is dominated by boundary I/O paths (I2O/R2O/I2R) with large external budgets or pad delays. Distinguishing DRV-limited from depth-limited paths involves auditing the transition column in timing reports and running report_delay_calculation.",
    detailedAnswer: `### 1. Why 'group_path' Never Creates Slack:
Engineers frequently believe that assigning failing paths to a dedicated path group will close timing:
\`group_path -name i2o_failing -from [all_inputs] -to [all_outputs] -weight 10\`
- **The Reality**:
  - \`group_path\` merely isolates the cost function term for that group:
    $$\\text{Cost} = W_{\\text{R2R}} \\cdot \\text{TNS}_{\\text{R2R}} + W_{\\text{I2O}} \\cdot \\text{TNS}_{\\text{I2O}}$$
  - Increasing the weight ($W_{\\text{I2O}}$) directs synthesis effort toward those paths, preventing a massive failing group from masking other groups.
  - However, **grouping does not alter gate physics**. If a path requires $3.5\\text{ ns}$ of physical delay through pad buffers and logic, grouping cannot compress it into a $2.0\\text{ ns}$ clock cycle!

---

### 2. The First 15-Minute Timing Triage Protocol:
When presented with a failing netlist ($WNS = -3.5\\text{ ns}$):
1. **Minute 0–3: Run \`report_qor\` and Inspect Cost Group Breakdown**:
   - Check WNS and TNS across individual groups (\`reg2reg\`, \`in2reg\`, \`reg2out\`, \`in2out\`).
   - If \`reg2reg\` is **$+0.90\\text{ ns}$ (MET)** while \`in2out\` is **$-3.50\\text{ ns}$ (VIOLATED)**, immediately stop analyzing core arithmetic logic!
2. **Minute 3–7: Inspect Top 5 Failing Paths (\`report_timing -max_paths 5\`)**:
   - Identify startpoints and endpoints: are they external chip ports (\`pad_*\`)?
   - Audit pad cell intrinsic delays (e.g. $0.7\\text{ ns}$ receiver + $1.4\\text{ ns}$ driver).
3. **Minute 7–11: Audit External Electrical Environment (\`report_port\`)**:
   - Run \`report_port -delay\`: is external input/output delay over-budgeted?
   - Run \`report_port -driver -load\`: is external output load realistic ($50\\text{ fF}$) or set to an absurd $50\\text{ pF}$?
4. **Minute 11–15: Determine Architectural Remedy**:
   - Boundary pipelining: register inputs/outputs at chip perimeter.
   - Interface multicycle path: verify protocol handshaking.
   - Frequency relaxation: adjust external interface clock period.

---

### 3. Proving DRV-Limited vs Logic-Depth-Limited Paths:

| Diagnostic Metric | DRV-Limited Path (Slew / Cap Failure) | Logic-Depth-Limited Path |
| :--- | :--- | :--- |
| **Transition Column** | High transition spikes ($>0.40\\text{ ns}$) across intermediate stages. | Clean, uniform fast transitions ($<0.08\\text{ ns}$) across all stages. |
| **Logic Levels** | Few levels of logic ($4 - 8$ stages) with large stage delays. | Excessive levels of logic ($>35$ stages) with small stage delays ($20\\text{ ps}$/gate). |
| **\`report_constraint\`** | Flags violations for \`max_transition\` or \`max_capacitance\`. | Reports 0 DRV violations; purely data-path latency bound. |
| **Sizing Experiment** | Inserting buffers or upsizing drivers yields massive slack gains ($>400\\text{ ps}$). | Upsizing drivers yields diminishing returns ($<20\\text{ ps}$) and balloons area. |
| **Fix Strategy** | Buffer insertion, repeater tree balancing, load reduction. | Architectural pipelining, Boolean tree restructuring, retiming. |`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete 15-Minute Timing Triage Script:

# 1. Step 1: Audit Cost Group Summary:
report_qor > reports/triage_qor.rpt

# 2. Step 2: Split Path Groups into Core vs Boundary:
report_timing -from [all_registers] -to [all_registers] -max_paths 5 > reports/timing_r2r.rpt
report_timing -from [all_inputs]    -to [all_outputs]   -max_paths 5 > reports/timing_i2o.rpt

# 3. Step 3: Audit Port Environments:
report_port -delay  [all_inputs]  > reports/port_delays.rpt
report_port -driver [all_inputs]  > reports/port_drivers.rpt
report_port -load   [all_outputs] > reports/port_loads.rpt

# 4. Step 4: Audit DRVs (Max Transition & Capacitance):
report_constraint -max_transition > reports/drv_transition.rpt
report_constraint -max_capacitance > reports/drv_capacitance.rpt

# 5. Step 5: Inspect Cell Arc Delay Math on Worst Path:
report_delay_calculation -from u_core/u_alu/inst_a/A -to u_core/u_alu/inst_a/Y`,
    },
    commonPitfalls: [
      "Spending days optimizing internal ALU logic when chip WNS is dominated by external pad-to-pad I2O paths.",
      "Attempting to fix logic-depth-limited paths by blindly upsizing gates, leading to severe power bloat with zero timing recovery.",
      "Over-constraining external load models (e.g. 50 pF on internal block pins), creating false DRV violations.",
    ],
    interviewerFollowups: [
      "How does path_adjust -delay allow surgical margin budgeting without altering global clock periods?",
      "Why can report_qor WNS differ slightly from report_timing WNS on the same design checkpoint?",
    ],
    tags: ["timing-triage", "drv-vs-depth", "group_path", "report_port", "cost-groups", "sta-debugging"],
  },

  {
    id: "mst-05",
    domain: "synthesis-sdc",
    domainName: "Synthesis & Timing Constraints (SDC)",
    role: "Principal Implementation & Tapeout Signoff Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Senior RTL-to-GDS Tapeout Handoff Protocol: Outline a comprehensive 10-point netlist handoff checklist that prevents multimillion-dollar silicon respins. What checks must be executed across 'check_design', Conformal LEC, SDC constraint alignment, physical LEF consistency, and unified common databases ('write_db -common')?",
    shortSummary: "A production tapeout handoff protocol requires rigorous verification across structural design rules, formal functional equivalence (LEC), constraint synchronization, and physical database consistency. Key gates include: zero unresolved/multidriven nets, clean Conformal LEC between RTL and mapped netlist, absence of continuous assigns, physical tie cell verification, matching SDC port names, and exporting a bit-exact Common UI database (write_db -common) to eliminate file synchronization drift.",
    detailedAnswer: `### 1. The Cost of Handoff Oversight:
In advanced FinFET tapeouts, a single unmapped black box, an undetected multi-driven bus, or an out-of-sync SDC false path will destroy silicon functionality, resulting in a **$5M+ wafer respin and a 6-month product delay**.

---

### 2. The 10-Point Senior Tapeout Handoff Protocol:

| # | Handoff Checkpoint | Tool Verification Command | Acceptance Signoff Criteria |
| :--- | :--- | :--- | :--- |
| **1** | **Structural Integrity** | \`check_design -unresolved -multiple_driver -combo_loops\` | **0 Errors**. Zero black boxes, zero short circuits, zero combinational loops. |
| **2** | **Formal Equivalence** | Cadence Conformal LEC: \`add_compare_points -all; compare\` | **100% Equivalent**. Proves mapped netlist matches RTL Boolean intent. |
| **3** | **Continuous Assigns** | \`check_design -assigns\` | **0 Assigns**. All continuous assigns replaced with physical buffers (\`remove_assigns\`). |
| **4** | **Tie-Off Integrity** | \`check_design -through_tie_cell\` | All \`1'b0\`/\`1'b1\` nets driven by physical \`TIEHI\`/\`TIELO\` cells (fanout $\\le 8$). |
| **5** | **Timing Linting** | \`check_timing -verbose\` & \`report_timing -unconstrained\` | **0 Unconstrained Endpoints**. Every sequential flop clocked with clean waveforms. |
| **6** | **Constraint Sync** | \`write_sdc outputs/soc_top_signoff.sdc\` | SDC clock/port names match netlist exactly; no stale references. |
| **7** | **Physical Library Sync** | \`check_design -lib_lef_consistency\` | Complete 1-to-1 match between Liberty timing pins and physical LEF geometries. |
| **8** | **Unified Common DB** | \`write_db -common -design soc_top outputs/soc_top.db\` | Unified binary database for Innovus; guarantees zero file synchronization drift. |
| **9** | **DFT / Scan Chains** | \`check_dft_rules\` & \`report_scan_chains\` | All functional registers bound to legal scan cells with verified shift paths. |
| **10** | **Exception Audit** | Peer review of \`set_false_path\` & \`set_multicycle_path\` | Every timing exception signed off by lead SoC architect with protocol proof. |

---

### 3. Why 'write_db -common' Is Mandatory for Modern Handoff:
- **Legacy Multi-File Handoff Flaw**:
  - Exporting separate Verilog netlists, SDC constraints, UPF power files, and DEF floorplans inevitably leads to version drift across large distributed teams.
- **The Common UI Database Solution**:
  - \`write_db -common\` serializes the entire in-memory CUI object model (logic gates, placements, MMMC views, UPF states) into a single binary file.
  - Innovus restores the complete design state in under 60 seconds with **guaranteed 100% bit-exact synchronization!**`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Senior Tapeout Handoff Protocol Script:

# 1. Structural Design Rule Signoff:
check_design -unresolved > reports/signoff_unresolved.rpt
check_design -multiple_driver > reports/signoff_multidrive.rpt
check_design -combo_loops > reports/signoff_loops.rpt

# 2. Assigns & Tie-Off Verification:
remove_assigns_without_opt -design soc_top -verbose
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 soc_top
check_design -assigns > reports/signoff_assigns.rpt
check_design -through_tie_cell > reports/signoff_tiecells.rpt

# 3. Timing & Constraint Hygiene Audit:
check_timing -verbose > reports/signoff_timing_lint.rpt
report_timing -unconstrained -max_paths 20 > reports/signoff_unconstrained.rpt

# 4. Library & Physical Consistency Audit:
check_design -lib_lef_consistency > reports/signoff_lib_lef.rpt

# 5. Generate Golden Netlist & SDC for LEC & PnR:
write_hdl > outputs/soc_top_gate_golden.v
write_sdc > outputs/soc_top_signoff.sdc

# 6. Export Unified Common UI Database for Innovus:
write_db -common -design soc_top outputs/soc_top_handoff.db`,
    },
    commonPitfalls: [
      "Failing to run Conformal LEC on the post-synthesis netlist, allowing logic optimization bugs to escape into physical place-and-route.",
      "Exporting netlists with unresolved black boxes, assuming PnR will automatically find the missing IP blocks.",
      "Applying unverified false paths to silence stubborn timing violations without architectural peer review.",
    ],
    interviewerFollowups: [
      "Why does sequential retiming require generating a dedicated retiming file (write_retiming_data) for Conformal LEC verification?",
      "In a multi-voltage UPF design, how does check_design verify that all power domain boundary crossings have level shifters?",
    ],
    tags: ["tapeout-handoff", "conformal-lec", "check_design", "write_db-common", "signoff-checklist", "respin-prevention"],
  },

  // 🟢 DOMAIN: IEEE 1801 (UPF 2.0) & POWER INTENT ARCHITECTURE
  {
    id: "upf-01",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Staff Power Architect & Low-Power Implementation Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "The Anatomy of IEEE 1801 (UPF 2.0): What is the recommended authoring hierarchy for power intent, why is UPF a 'side file' rather than RTL, and why is powering isolation cells from a gated power rail one of the most fatal bugs in power-gated SoC design?",
    shortSummary: "UPF (IEEE 1801) specifies power architecture independently of RTL: domains, supply nets, power switches, isolation, level shifters, state retention, and Power State Tables (PST). The strict authoring order ensures dependencies are satisfied: upf_version -> supplies -> domains -> switches -> isolation -> level shifters -> retention -> PST -> port attributes. Powering isolation cells from the gated rail results in total isolation failure when the domain is powered off, causing floating inputs and destructive crowbar currents.",
    detailedAnswer: `### 1. What Power Intent Is (and Is Not):
UPF is a **declarative side contract** defining the power architecture without corrupting functional RTL:
- **What Belongs in UPF**:
  - Hierarchical instance-to-domain mapping (\`create_power_domain\`).
  - Electrical supply nets, ports, and power switches.
  - Signal crossing protection policies (isolation and level shifters).
  - Power State Tables (PST) defining legal simultaneous supply states.
- **What Does NOT Belong in UPF**:
  - Clock gating enables (configured via RTL and synthesis attributes: \`lp_insert_clock_gating\`).
  - Detailed physical placement of power header/footer switches (managed in PnR floorplanning).

---

### 2. The Strict UPF Authoring Order:

| Step | UPF Construct | Functional Purpose | Dependency Requirement |
| :--- | :--- | :--- | :--- |
| **1** | \`upf_version 2.0\` | Declares IEEE 1801 standard language dialect. | Mandatory first line. |
| **2** | \`create_supply_net\` / \`port\` | Declares logical supply rails and boundary power ports. | Supplies must exist before binding. |
| **3** | \`create_power_domain\` | Establishes power domains (\`-include_scope\` or \`-elements\`). | Domains must exist before assigning supplies. |
| **4** | \`set_domain_supply_net\` | Binds primary power and ground nets to each domain. | Requires existing domain and supply nets. |
| **5** | \`create_power_switch\` | Models power gating headers/footers (\`-on_state\`, \`-off_state\`). | Requires source and gated supply rails. |
| **6** | \`set_isolation\` & \`control\` | Defines boundary clamping policies and enable polarities. | Requires domain and always-on supply rails. |
| **7** | \`set_level_shifter\` | Defines voltage translation rules (\`low_to_high\`, \`high_to_low\`). | Requires multi-voltage domain boundaries. |
| **8** | \`set_retention\` & \`control\` | Specifies sequential shadow retention flip-flop strategies. | Requires domain and retention backup rails. |
| **9** | \`create_pst\` & \`add_pst_state\` | Defines legal operating modes across all supply rails. | Requires all supply rails to be declared. |
| **10** | \`set_port_attributes\` | Associates chip I/O ports with respective driver/receiver supplies. | Final interface contract for STA & PnR. |

---

### 3. The Fatal Isolation Power Rail Misconnection:
- **The Bug**: Setting \`-isolation_power_net VDD_CORE\` on outputs of \`PD_CORE\` (the switchable domain).
- **The Physical Disaster**:
  - When \`PD_CORE\` is power-gated, \`sw_core_ctrl\` turns off the power switch, collapsing \`VDD_CORE\` to $0\\text{ V}$.
  - Because the isolation buffer's internal transistors are powered from \`VDD_CORE\`, **the isolation buffer loses power simultaneously**!
  - The isolation output floats to high-impedance ($Z$) instead of driving a stable static clamp value ($0$ or $1$).
  - When downstream Always-On logic samples this floating node, both PMOS and NMOS transistors in the receiver gate turn partially on, creating a direct low-impedance path from $V_{\\text{DD}}$ to ground.
  - This induces massive **crowbar short-circuit current**, destroying battery life and corrupting registers.
- **The Correct Signoff Rule**:
  - Isolation cells MUST always be powered from the **Always-On (AO) supply net** (\`-isolation_power_net VDD\`)!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete IEEE 1801 (UPF 2.0) Always-On vs Switchable Domain Template:
upf_version 2.0

# 1. Declare Supply Nets & External Ports:
create_supply_net  VDD
create_supply_net  VSS
create_supply_net  VDD_CORE
create_supply_port VDD
create_supply_port VSS
connect_supply_net VDD -ports VDD
connect_supply_net VSS -ports VSS

# 2. Declare Always-On Domain (Pads & Glue Logic):
create_power_domain PD_TOP -include_scope
set_domain_supply_net PD_TOP -primary_power_net VDD -primary_ground_net VSS

# 3. Declare Switchable Power-Gated Core Domain:
create_power_domain PD_CORE -elements {u_core}
set_domain_supply_net PD_CORE -primary_power_net VDD_CORE -primary_ground_net VSS

# 4. Declare Power Header Switch:
create_power_switch sw_core \
  -domain PD_CORE \
  -input_supply_port  {vin VDD} \
  -output_supply_port {vout VDD_CORE} \
  -control_port       {ssctrl sw_core_ctrl} \
  -on_state  {full_on  vin  {ssctrl}} \
  -off_state {full_off {~ssctrl}}

# 5. Inject Digital Logic Control Pin:
create_logic_port -direction in sw_core_ctrl
create_logic_net sw_core_ctrl
connect_logic_net sw_core_ctrl -ports sw_core_ctrl

# 6. Correctly Protected Isolation (Powered from Always-On VDD!):
set_isolation iso_core_out \
  -domain PD_CORE \
  -applies_to outputs \
  -clamp_value 0 \
  -isolation_power_net  VDD \
  -isolation_ground_net VSS

set_isolation_control iso_core_out \
  -domain PD_CORE \
  -isolation_signal sw_core_ctrl \
  -isolation_sense low \
  -location self

# 7. Power State Table (PST):
add_port_state VDD      -state {ON 0.72}
add_port_state VSS      -state {ON 0.00}
add_port_state VDD_CORE -state {ON 0.72} -state {OFF off}

create_pst pst_top -supplies {VDD VSS VDD_CORE}
add_pst_state RUN   -pst pst_top -state {ON ON ON}
add_pst_state SLEEP -pst pst_top -state {ON ON OFF}`,
    },
    commonPitfalls: [
      "Powering isolation cells from the gated rail instead of the always-on supply, causing floating output clamps during sleep mode.",
      "Inverting isolation control sense (e.g. active-high when power switch is active-high), clamping outputs while the block is in mission mode.",
      "Assigning hierarchical instance names that do not match elaborated RTL hierarchy, resulting in empty power domains.",
    ],
    interviewerFollowups: [
      "What is the difference between -location self and -location parent in set_isolation_control?",
      "How does UPF 2.1 supply set notation (create_supply_set) simplify multi-rail power modeling compared to UPF 1.0?",
    ],
    tags: ["upf", "ieee-1801", "power-gating", "isolation-cells", "crowbar-current", "power-architecture"],
  },

  {
    id: "upf-02",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Senior Staff Multi-Voltage Implementation Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Multi-Voltage Power Intent & Level Shifters: Contrast Low-to-High (L2H) versus High-to-Low (H2L) voltage transitions. Why does H2L without a level shifter destroy gate oxide reliability, why does L2H without a level shifter trigger subthreshold leakage storms, and how do you write clean multi-rail PST tables?",
    shortSummary: "Multi-voltage domains require level shifters to transition signals between different operational potentials. High-to-Low transitions without level shifters subject thin gate dielectrics to excessive electric field stress (E-field breakdown and hot carrier injection). Low-to-High transitions without level shifters fail to pull the PMOS transistor fully off (V_GS < V_th), causing permanent static crowbar leakage. UPF declares these via set_level_shifter -rule low_to_high and high_to_low, coordinated with multi-column PST tables.",
    detailedAnswer: `### 1. Physical Hazards of Unshifted Voltage Crossings:
When signals cross between a low-voltage domain ($V_{\\text{DDL}} = 0.72\\text{ V}$) and a high-voltage domain ($V_{\\text{DDH}} = 0.90\\text{ V}$ or $1.80\\text{ V}$):

| Crossing Direction | Silicon Failure Mechanism Without Level Shifter | Electrical / Physical Consequences |
| :--- | :--- | :--- |
| **High-to-Low (H2L)**<br>($0.90\\text{ V} \\to 0.72\\text{ V}$) | **Gate Oxide Breakdown & Hot Carrier Injection (HCI)** | The $0.90\\text{ V}$ input applied to a thin-oxide $0.72\\text{ V}$ NMOS gate induces excessive vertical electric field stress ($E_{\\text{ox}} > 10\\text{ MV/cm}$), accelerating Time-Dependent Dielectric Breakdown (TDDB) and permanently destroying the gate. |
| **Low-to-High (L2H)**<br>($0.72\\text{ V} \\to 0.90\\text{ V}$) | **Severe Static Crowbar Leakage & False Logic 0** | The maximum output voltage of the low-V driver ($0.72\\text{ V}$) cannot reach the high-V PMOS rail ($0.90\\text{ V}$). The gate-to-source voltage is:$$V_{GS} = 0.72\\text{ V} - 0.90\\text{ V} = -0.18\\text{ V}$$Because $|V_{GS}| > 0$, the high-V PMOS transistor **never fully turns off**, creating a permanent static short-circuit current path from $V_{\\text{DDH}}$ to ground. |

---

### 2. UPF Multi-Voltage Level Shifter Strategies:
\`set_level_shifter\` specifies the translation policy:
1. **Low-to-High Shifter (\`ls_l2h\`)**:
   - Requires dual power rails: input rail $V_{\\text{DDL}}$ ($0.72\\text{ V}$) and output rail $V_{\\text{DDH}}$ ($0.90\\text{ V}$).
   - Uses cross-coupled PMOS level-translating latches.
2. **High-to-Low Shifter (\`ls_h2l\`)**:
   - Steers the $0.90\\text{ V}$ input down to $0.72\\text{ V}$ using standard thick-oxide or diode-clamped drop-down inverters.

---

### 3. Multi-Rail Power State Table (PST) Rules:
In a multi-voltage design, the PST must include **one column per physical rail**:
$$\\text{PST Coordinates: } \\quad \\{V_{\\text{DD\\_0P72}}, V_{\\text{DD\\_0P90}}, V_{\\text{DDIO\\_1P8}}, V_{\\text{SS}}\\}$$
- **Illegal States**:
  - If $V_{\\text{DD\\_0P72}}$ is active while $V_{\\text{DDIO\\_1P8}}$ is OFF, any signal interfacing with pads is unconstrained.
  - PST explicitly excludes all illegal operational combinations, ensuring timing and verification tools analyze only verified modes.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Multi-Voltage IEEE 1801 (UPF 2.0) Architecture Script:
upf_version 2.0

# 1. Multi-Rail Supply Net & Port Declarations:
create_supply_net  VDD_0P72
create_supply_net  VDD_0P90
create_supply_net  VDDIO_1P8
create_supply_net  VSS

create_supply_port VDD_0P72
create_supply_port VDD_0P90
create_supply_port VDDIO_1P8
create_supply_port VSS

connect_supply_net VDD_0P72  -ports VDD_0P72
connect_supply_net VDD_0P90  -ports VDD_0P90
connect_supply_net VDDIO_1P8 -ports VDDIO_1P8
connect_supply_net VSS       -ports VSS

# 2. Establish Power Domains with Dedicated Rails:
create_power_domain PD_CORE -elements {u_core}
set_domain_supply_net PD_CORE -primary_power_net VDD_0P72 -primary_ground_net VSS

create_power_domain PD_MEM -elements {u_mem_bank}
set_domain_supply_net PD_MEM -primary_power_net VDD_0P90 -primary_ground_net VSS

create_power_domain PD_IO -include_scope
set_domain_supply_net PD_IO -primary_power_net VDDIO_1P8 -primary_ground_net VSS

# 3. Low-to-High Level Shifter Strategy (Core 0.72V -> Mem 0.90V):
set_level_shifter ls_l2h_core_to_mem \
  -domain PD_CORE \
  -applies_to outputs \
  -rule low_to_high \
  -location automatic

# 4. High-to-Low Level Shifter Strategy (Mem 0.90V -> Core 0.72V):
set_level_shifter ls_h2l_mem_to_core \
  -domain PD_MEM \
  -applies_to outputs \
  -rule high_to_low \
  -location automatic

# 5. Full Multi-Rail PST:
add_port_state VDD_0P72  -state {ON 0.72} -state {OFF off}
add_port_state VDD_0P90  -state {ON 0.90} -state {OFF off}
add_port_state VDDIO_1P8 -state {ON 1.80}
add_port_state VSS       -state {ON 0.00}

create_pst pst_mv -supplies {VDD_0P72 VDD_0P90 VDDIO_1P8 VSS}
add_pst_state ALL_RUN   -pst pst_mv -state {ON  ON  ON ON}
add_pst_state CORE_SLEEP -pst pst_mv -state {OFF ON  ON ON}`,
    },
    commonPitfalls: [
      "Omitting level shifters on High-to-Low crossings, creating catastrophic TDDB reliability risks on thin-oxide core gates.",
      "Specifying single-rail power connections for Low-to-High level shifter cells, preventing the internal level-translating latch from functioning.",
      "Mismatched PST column ordering where state tuples do not match the declared -supplies list order.",
    ],
    interviewerFollowups: [
      "How does an Enable Level Shifter (ELS) combine both isolation clamping and voltage translation in a single standard cell?",
      "In static timing analysis (STA), how does Tempus/PrimeTime interpolate timing arcs across level shifters when both rail voltages vary dynamically?",
    ],
    tags: ["multi-voltage", "level-shifters", "l2h-vs-h2l", "oxide-breakdown", "pst-table", "upf"],
  },

  {
    id: "upf-03",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Lead Low-Power Synthesis & Verification Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "Power Switching & Isolation Control Synchronization: How must power switch enable signals and isolation control signals be sequenced during power-down and power-up? Explain why '-isolation_sense low' is chosen when the switch is active-high, and contrast '-location self' versus '-location parent'.",
    shortSummary: "Power-down sequencing requires asserting isolation before opening the power switch to prevent floating X states from escaping into always-on logic. Power-up sequencing requires closing the switch, waiting for rail voltage stabilization, and only then de-asserting isolation. When the power switch control is active-high (1 = ON, 0 = OFF), isolation must be active when the control is 0 (-isolation_sense low). -location self places isolation cells inside the gated domain, while -location parent places them in the receiving always-on domain.",
    detailedAnswer: `### 1. The Critical Power-Down & Power-Up Sequencing:
When a power domain transitions between ON and OFF states, precise timing sequencing is mandatory to prevent functional corruption and electrical crowbar current:

- **POWER-DOWN SEQUENCE**:
  1. Clocks gated / interfaces quiesced.
  2. Assert ISOLATION ENABLE (clamp outputs to static 0 or 1).
  3. De-assert POWER SWITCH (open header switch -> VDD_CORE collapses to 0V).
- **POWER-UP SEQUENCE**:
  1. Assert POWER SWITCH (close header switch -> VDD_CORE ramps up).
  2. Wait for supply voltage stabilization (t_ramp).
  3. De-assert ISOLATION ENABLE (release clamps -> normal functional operation).
  4. Release reset / ungate clocks.

---

### 2. Polarity Synchronization (\`-isolation_sense\`):
- In \`create_power_switch\`:
  \`-on_state {full_on vin {sw_core_ctrl}}\`
  \`-off_state {full_off {~sw_core_ctrl}}\`
  - \`sw_core_ctrl = 1\` $\\to$ Domain is **POWERED ON**.
  - \`sw_core_ctrl = 0\` $\\to$ Domain is **POWERED OFF**.
- Therefore, isolation must be **ENABLED when \`sw_core_ctrl\` is 0**:
  \`set_isolation_control ... -isolation_sense low\`
- If an engineer mistakenly specifies \`-isolation_sense high\`, isolation is enabled while the chip is trying to run (clamping all outputs to 0 during mission mode) and disabled when power drops (allowing floating $X$ states to escape into always-on logic)!

---

### 3. Isolation Location: \`-location self\` vs \`-location parent\`:

| Location Parameter | Physical Cell Placement | Supply Connection Advantages | Tradeoffs & Routing Impact |
| :--- | :--- | :--- | :--- |
| **\`-location self\`** | Isolation cell placed **inside** the switchable power domain boundary. | Clean boundary modularity; all output pins of the sub-block are clamped before leaving the hierarchy. | Requires routing the Always-On supply rail ($V_{\\text{DD}}$) into the switchable domain to power the isolation cells. |
| **\`-location parent\`** | Isolation cell placed **outside** in the receiving Always-On domain. | Isolation cell sits naturally on the Always-On power grid; no extra AO secondary power stripes needed in the core. | Can increase top-level placement congestion if hundreds of boundary nets converge on the parent domain. |`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Isolation Strategy & Placement Configuration:

# 1. Output Isolation Placed in Switched Domain (Self):
set_isolation iso_core_out \
  -domain PD_CORE \
  -applies_to outputs \
  -clamp_value 0 \
  -isolation_power_net  VDD \
  -isolation_ground_net VSS

set_isolation_control iso_core_out \
  -domain PD_CORE \
  -isolation_signal sw_core_ctrl \
  -isolation_sense low \
  -location self

# 2. Input Isolation Placed in Always-On Domain (Parent):
set_isolation iso_core_in \
  -domain PD_CORE \
  -applies_to inputs \
  -clamp_value 0 \
  -isolation_power_net  VDD \
  -isolation_ground_net VSS

set_isolation_control iso_core_in \
  -domain PD_CORE \
  -isolation_signal sw_core_ctrl \
  -isolation_sense low \
  -location parent`,
    },
    commonPitfalls: [
      "Inverting isolation sense relative to the power switch control signal, causing permanent clamping during active execution.",
      "Opening the power switch before asserting isolation, allowing temporary voltage droop and X-propagation to corrupt always-on state.",
      "Failing to route secondary always-on power straps to isolation cells when using -location self.",
    ],
    interviewerFollowups: [
      "How does a Power Management Unit (PMU) generate acknowledge signals (pwr_ack) to guarantee rail stabilization before de-asserting isolation?",
      "Why do high-speed interfaces like PCIe or DDR require clamp value 1 instead of clamp value 0?",
    ],
    tags: ["isolation-control", "sequencing", "power-switch", "location-self", "location-parent", "upf"],
  },

  {
    id: "upf-04",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Principal Low-Power Implementation Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "State Retention Power Gating (SRPG): When is retention mandatory versus standard power gating, what is the internal silicon architecture of a retention flip-flop, and how do you configure 'set_retention' and 'set_retention_control' in UPF?",
    shortSummary: "State retention power gating (SRPG) preserves sequential register states while the combinational logic and power grid of a domain are powered down. Standard power gating loses all state, requiring multi-thousand-cycle software boot reloads upon wakeup. An SRPG flip-flop contains a standard master-slave latch powered by the switched rail and a high-Vt shadow retention balloon latch powered by an always-on backup rail. UPF specifies retention using set_retention and set_retention_control.",
    detailedAnswer: `### 1. When Retention is Mandatory:
In low-power edge processors, microcontrollers, and IoT SoCs:
- **Standard Power Gating (Without Retention)**:
  - All sequential registers lose their values when power collapses.
  - On wakeup, the processor must execute a full cold boot from external Flash/ROM, requiring **10,000 to 500,000 clock cycles** and significant battery energy.
- **State Retention Power Gating (SRPG)**:
  - Critical registers (program counter, stack pointer, control registers, register file) are saved into low-leakage shadow latches before power-down.
  - On wakeup, states are restored in **1 to 2 clock cycles**, enabling instant-on responsiveness with near-zero energy overhead!

---

### 2. The Silicon Anatomy of an SRPG Flip-Flop:
An SRPG cell contains **two distinct sequential storage elements**:
1. **Primary Master-Slave Latch**:
   - Built with fast standard cells for high-speed mission mode operation.
   - Powered by the **Switched Power Net** ($V_{\\text{DD\\_CORE}}$).
2. **Shadow Retention Balloon Latch**:
   - Built with high-threshold voltage (HVT) or ultra-high-Vt (UHVT) transistors to minimize subthreshold leakage.
   - Powered by the **Always-On Retention Power Net** ($V_{\\text{DD\\_RET}}$ / $V_{\\text{DD\\_AO}}$).
3. **Save & Restore Control Gates**:
   - \`SAVE\` signal: Transfers data from master latch into shadow balloon before power-down.
   - \`RESTORE\` signal: Transfers data from shadow balloon back into slave latch after rail recovery.

---

### 3. The 6-Phase SRPG Power Lifecycle:
1. **Clock Gate**: Stop clock transitions to freeze state.
2. **Save**: Pulse \`SAVE\` signal (latches state into balloon).
3. **Isolate**: Assert isolation enable.
4. **Power Down**: Open power switch ($V_{\\text{DD\\_CORE}} \\to 0\\text{ V}$). Balloon latch maintains state via $V_{\\text{DD\\_RET}}$.
5. **Power Up**: Close power switch and stabilize $V_{\\text{DD\\_CORE}}$.
6. **Restore & De-isolate**: Pulse \`RESTORE\` signal, de-assert isolation, and ungate clocks.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete IEEE 1801 (UPF 2.0) State Retention Configuration:

# 1. Declare Always-On Retention Backup Rail:
create_supply_net VDD_RET
create_supply_port VDD_RET
connect_supply_net VDD_RET -ports VDD_RET

# 2. Define Retention Strategy for Critical Sub-Hierarchy:
set_retention ret_core \
  -domain PD_CORE \
  -retention_power_net  VDD_RET \
  -retention_ground_net VSS \
  -elements {u_core/u_regfile u_core/u_csr}

# 3. Configure Save and Restore Protocol Pins:
set_retention_control ret_core \
  -domain PD_CORE \
  -save_signal    {pmu_save_n low} \
  -restore_signal {pmu_restore_n low}

# 4. Supply State Matrix for Retention:
add_port_state VDD_RET -state {ON 0.72}

# PST Including Retention Mode:
create_pst pst_srpg -supplies {VDD VDD_CORE VDD_RET VSS}
add_pst_state ACTIVE_RUN -pst pst_srpg -state {ON ON  ON ON}
add_pst_state RET_SLEEP  -pst pst_srpg -state {ON OFF ON ON}`,
    },
    commonPitfalls: [
      "Applying retention indiscriminately across all 500,000 flops in a design, causing silicon area and routing congestion to balloon.",
      "Powering the retention backup net from the switched domain, causing total state loss during power gating.",
      "Restoring state before the switched rail has stabilized to its minimum operating voltage, corrupting data.",
    ],
    interviewerFollowups: [
      "What is the area penalty of an SRPG flip-flop compared to a standard DFF (typically 30% to 50% larger)?",
      "How does Conformal Low Power (CLP) formally prove that retention restore arcs do not cause race conditions?",
    ],
    tags: ["srpg", "retention-flops", "balloon-latch", "save-restore", "wakeup-latency", "upf"],
  },

  {
    id: "upf-05",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Senior Staff RTL-to-GDS Methodology Architect",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Genus Power Intent Consumption & Signoff: Deconstruct the 5-stage Cadence Genus power intent flow: 'read_power_intent', 'apply_power_intent', 'check_power_intent', 'commit_power_intent', and 'write_power_intent'. What physical modifications occur during commit, and how do you debug missing cell violations?",
    shortSummary: "Genus consumes UPF through a deterministic pipeline: read_power_intent parses IEEE 1801 syntax, apply_power_intent binds constraints to design hierarchy, check_power_intent validates consistency and detects unmapped crossings, commit_power_intent physically instantiates isolation, level shifter, and retention cells from target Liberty libraries, and write_power_intent exports the updated post-synthesis intent for Innovus PnR. Missing cells during commit indicate missing Liberty macros or dont_use flags.",
    detailedAnswer: `### 1. The 5-Stage Genus UPF Consumption Pipeline:

| Tool Stage | Cadence Genus CUI Command | Tool Backend Transformation | Verification Acceptance Gate |
| :--- | :--- | :--- | :--- |
| **1. Ingest** | \`read_power_intent -1801 -module top -verbose file.upf\` | Parses IEEE 1801 syntax into an in-memory power intent graph. | Syntax errors, unresolvable supply nets flagged. |
| **2. Bind** | \`apply_power_intent -design top -summary\` | Binds domains to elaborated instance hierarchy and builds power trees. | Verifies all instances match hierarchical paths. |
| **3. Audit** | \`check_power_intent -design top -detail\` | Analyzes boundary crossings; flags missing isolation or level shifters. | **0 Errors**. Proves intent is complete and conflict-free. |
| **4. Commit** | \`commit_power_intent -design top\` | **Physically modifies netlist**: inserts isolation, level shifter, and SRPG cells. | Replaces abstract UPF strategies with real Liberty standard cells. |
| **5. Export** | \`write_power_intent -1801 -base_name out/top_pi\` | Exports synchronized UPF with physical instance names for Innovus. | Eliminates naming drift between synthesis and physical design. |

---

### 2. What Happens Physically During 'commit_power_intent':
Before \`commit_power_intent\`, power intent is strictly an abstract database specification. During commit:
1. **Isolation Insertion**:
   - Breaks boundary nets leaving \`PD_CORE\` and inserts physical clamping gates (e.g. \`ISOB_X2\` or \`ISOL_X1\`).
   - Hooks up the secondary power pin of the isolation cell to the Always-On rail ($V_{\\text{DD}}$).
2. **Level Shifter Insertion**:
   - Breaks voltage boundary nets and inserts dual-rail level shifter cells (e.g. \`LVLH_X2\` or \`LVHL_X1\`).
   - Connects the primary power pin to the output domain rail and the secondary power pin to the input domain rail.
3. **Sequential Mapping**:
   - Swaps standard \`DFF\` cells in retention lists for dedicated \`SRPG\` library macros.

---

### 3. Debugging Missing Cell Violations:
If \`check_power_intent\` or \`commit_power_intent\` reports:
\`[POWER-COMMIT] Error: Cannot find valid isolation cell for domain 'PD_CORE'.\`
- **Root Cause Checklist**:
  1. **Library Missing Cell**: The target \`.lib\` lacks cells with \`is_isolation_cell: true\` attribute.
  2. **Cell Marked \`dont_use\`**: The library cell was inadvertently blacklisted via \`set_db [get_db lib_cells *ISO*] .dont_use true\`.
  3. **Secondary Power Rail Mismatch**: The isolation strategy specified power net \`VDD_AO\`, but the Liberty cell pin definition specifies \`VDDG\`.
  4. **Drive / Polarity Mismatch**: \`-clamp_value 0\` requires an AND-type clamp or non-inverting buffer clamp; if only inverting clamps exist, commit fails.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Production Genus UPF Synthesis & Signoff Script:

# 1. Elaborate Functional RTL:
set_db library [list stdcells_ss_0p72v.lib power_cells_ss.lib]
read_hdl -sv [glob ../rtl/*.sv]
elaborate soc_top

# 2. Ingest and Bind IEEE 1801 UPF:
read_power_intent -1801 -module soc_top -verbose ../upf/soc_top.upf
apply_power_intent -design soc_top -summary

# 3. Pre-Commit Power Intent Audit:
check_power_intent -design soc_top -detail > reports/check_power_intent.rpt

# 4. Commit Power Intent (Instantiate Physical Cells):
commit_power_intent -design soc_top

# 5. Audit Inserted Low-Power Instances:
report_power_intent -power_domain_only > reports/power_domains.rpt
report_power_intent_instances -isolation_only -detail > reports/iso_instances.rpt
report_power_intent_instances -level_shifter_only -detail > reports/ls_instances.rpt

# 6. Proceed with SDC & Synthesis Pipeline:
read_sdc ../sdc/soc_top_func.sdc
syn_generic
syn_map
syn_opt

# 7. Export Synchronized Netlist & Power Intent for Innovus:
write_hdl > outputs/soc_top_mapped.v
write_power_intent -1801 -base_name outputs/soc_top_pi -overwrite`,
    },
    commonPitfalls: [
      "Running syn_generic before commit_power_intent, causing the tool to optimize across un-isolated boundary crossings.",
      "Forgetting to load low-power physical cell libraries containing isolation and level-shifter Liberty models.",
      "Exporting netlist without write_power_intent, leading to naming and boundary port mismatches in Innovus PnR.",
    ],
    interviewerFollowups: [
      "How does Conformal Low Power (CLP) compare the pre-synthesis UPF against the post-synthesis netlist and updated UPF?",
      "In physical place-and-route, what special routing rules apply to the secondary power pins of isolation and level shifter cells?",
    ],
    tags: ["genus-upf", "commit_power_intent", "check_power_intent", "isolation-cells", "power-signoff", "cadence-cui"],
  },

  // 🟢 DOMAIN: LOW-POWER SYNTHESIS (GENUS ICG, POWER EFFORT & ACTIVITY INJECTION)
  {
    id: "lp-01",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Staff Low-Power Implementation Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "LP Without UPF vs LP With UPF: What are the two distinct low-power synthesis goals, how do you configure Genus for single-rail power reduction, and why does top-level chip power often appear unchanged after clock gating due to the 'Pad Masking Trap'?",
    shortSummary: "Low-power synthesis splits into two fundamentally different engineering goals: 1) Single-rail dynamic and leakage reduction (no UPF needed; uses ICG insertion, multi-Vt cell swapping, power optimization effort, and SAIF switching activity), and 2) Architected power domains and modes (UPF/CPF required; defines domains, MTCMOS power switches, isolation, level shifters, retention, and PST). On pad-ring chips, I/O pad switching power often consumes 85-90% of total dissipation, completely masking a 40% dynamic power reduction in the core logic unless isolated via report_power -inst u_core -by_category.",
    detailedAnswer: `### 1. Two Fundamentally Different Low-Power Goals:

| Engineering Dimension | Goal A: Single-Rail Power Reduction | Goal B: Multi-Domain Architected Power |
| :--- | :--- | :--- |
| **Primary Objective** | Cut switching and leakage power in an always-on design without architectural mode changes. | Power-gate idle functional blocks, support multiple operating voltages, and manage state transitions. |
| **Power Intent (UPF/CPF)** | **NOT REQUIRED**. Managed entirely through synthesis attributes and standard cell library hooks. | **MANDATORY**. Formal IEEE 1801 UPF or CPF file defines the physical power contract. |
| **Core Cadence Knobs** | \`lp_insert_clock_gating true\`, \`design_power_effort high\`, \`opt_leakage_to_dynamic_ratio\`, \`read_saif\`. | \`read_power_intent -1801\`, \`apply_power_intent\`, \`check_power_intent\`, \`commit_power_intent\`. |
| **Physical Cells Inserted** | Integrated Clock Gating (ICG) cells, High-Vt (HVT) and Low-Vt (LVT) cell swaps. | MTCMOS power switches, isolation clamp gates, level shifters, SRPG retention registers. |

---

### 2. The 'Pad Masking Trap' in Full-Chip Power Analysis:
A common junior engineer panic occurs after enabling clock gating:
$$\\text{Baseline Chip Power: } 248.5\\text{ mW} \\quad \\longrightarrow \\quad \\text{Post-ICG Chip Power: } 248.1\\text{ mW } (-0.16\\%!)$$
- **The Physical Reality**:
  - Off-chip I/O pads drive large printed circuit board (PCB) trace capacitances ($C_{\\text{pad}} \\approx 10\\text{ to } 30\\text{ pF}$) at high I/O voltages ($1.8\\text{ V}$ to $3.3\\text{ V}$).
  - A single output pad switching at $50\\text{ MHz}$ dissipates:$$P_{\\text{pad}} = C_{\\text{pad}} \\cdot V_{\\text{IO}}^2 \\cdot f = (20\\text{ pF}) \\cdot (1.8\\text{ V})^2 \\cdot (50\\text{ MHz}) = 3.24\\text{ mW per pad}!$$
  - With 64 switching pads, pad I/O power consumes **$>200\\text{ mW}$** ($\\approx 85\\text{--}90\\%$ of total chip dissipation).
  - Meanwhile, internal core logic consumes only $\\approx 30\\text{ mW}$.
- **The Senior Diagnostic Protocol**:
  - Never judge synthesis power optimization from top-level chip totals when pads are present.
  - Isolate the core instance:
    \`report_power -inst u_core -by_category -unit mW\`
  - This reveals the true silicon result: core dynamic power dropped from $28.4\\text{ mW}$ down to $17.1\\text{ mW}$ (**a massive $39.8\\%$ dynamic power savings**)!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Genus Flow: Single-Rail Low-Power Optimization Without UPF:

# 1. Elaborate Functional RTL & Read SDC Constraints:
read_hdl -sv [glob ../rtl/*.sv]
elaborate pad_top
read_sdc ../sdc/pad_top_func.sdc

# 2. Enable Integrated Clock Gating (ICG) Insertion:
set_db lp_insert_clock_gating true
# Fallback to discrete logic only if library lacks dedicated ICG macros:
# set_db lp_insert_discrete_clock_gating_logic true

# 3. Configure Power Optimization Effort & Leakage Balance:
set_db design_power_effort high
set_db opt_power_effort high
# Balance leakage vs dynamic power optimization (0.0 = dynamic only, 1.0 = leakage only):
set_db opt_leakage_to_dynamic_ratio 0.5

# 4. Ingest Switching Activity File (SAIF) for Vector-Driven Accuracy:
read_saif -instance pad_top/u_core -scale_to_sdc_frequency ../sim/functional.saif

# 5. Execute 3-Stage Synthesis Compilation:
syn_generic
syn_map
syn_opt

# 6. Audit Clock Gating Quality & Power Reductions:
report_clock_gates -detail -fanout_summary > reports/clock_gates.rpt
report_clock_gating_quality > reports/cg_quality.rpt

# 7. Unmask Core Power from I/O Pad Switching Noise:
report_power -by_category -unit mW -header > reports/chip_power.rpt
report_power -inst u_core -by_category -unit mW -header > reports/core_power_golden.rpt`,
    },
    commonPitfalls: [
      "Evaluating clock gating efficiency from top-level pad-ring power reports instead of reporting the core sub-hierarchy.",
      "Setting design_power_effort to high before fixing critical setup timing paths, causing the optimizer to sacrifice clock frequency.",
      "Running vectorless power reports with default toggle rates and claiming tapeout-accurate dynamic power numbers.",
    ],
    interviewerFollowups: [
      "How does opt_leakage_to_dynamic_ratio alter the cell selection cost function during syn_opt?",
      "Why does Genus require reading SAIF after elaborate but before syn_map for maximum power optimization leverage?",
    ],
    tags: ["low-power", "icg", "clock-gating", "pad-masking", "power-effort", "genus-cui"],
  },

  {
    id: "lp-02",
    isFreeSample: true,
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Senior Clock Tree & Low-Power Synthesis Engineer",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Integrated Clock Gating (ICG) Architecture & Verification: Explain the internal silicon circuitry of a negative-latch ICG cell, why discrete AND-gates cause glitch hazards, how to triage ungated flops via 'report_clock_gates', and the timing hazards ICGs introduce on clock trees.",
    shortSummary: "Integrated Clock Gating (ICG) eliminates clock toggling on idle registers. Using a simple 2-input AND gate to gate a clock causes catastrophic runt pulses and glitches if the enable signal transitions while the clock is high. A standard positive-edge-triggered ICG cell combines an active-low latch with an AND gate to hold the enable stable during clock high phases. Triaging ungated flops uses report_clock_gates -get_sinks ungated. ICG cells introduce critical clock gating setup timing checks on the enable input and insertion delay on the clock tree.",
    detailedAnswer: `### 1. Why Discrete AND Gates Cause Glitches (and Why ICGs Prevent Them):
- **The Discrete AND Gate Hazard**:
  - If a functional enable signal $E$ transitions from $0 \\to 1$ or $1 \\to 0$ while the incoming clock $CLK$ is high ($1$), the output clock $GCLK = CLK \\cdot E$ transitions mid-pulse!
  - This creates **runt clock pulses** and electrical glitch spikes that violate minimum pulse width rules, causing downstream flip-flops to enter metastable states.
- **The Standard Latch-Based ICG Circuit**:
  - Combines an **active-low transparent latch** feeding an **AND gate** (for positive-edge clocking):
    $$\\text{Circuit: } \\quad E \\longrightarrow [\\text{Active-Low Latch (gated by } \\overline{CLK})] \\longrightarrow E_{\\text{latched}} \\longrightarrow [\\text{AND Gate with } CLK] \\longrightarrow GCLK$$
  - When $CLK = 0$: The latch is transparent; the functional enable $E$ propagates to $E_{\\text{latched}}$.
  - When $CLK = 1$: The latch is opaque (latched); any glitches or transitions on $E$ are blocked!
  - The AND gate evaluates only clean, static values of $E_{\\text{latched}}$ while $CLK$ is high, guaranteeing **glitch-free clock gating**.

---

### 2. Triaging Ungated Flip-Flops (\`report_clock_gates\`):
After running synthesis with \`lp_insert_clock_gating true\`, an engineer must audit ungated sequential sinks:
\`report_clock_gates -get_sinks ungated -detail > reports/ungated_sinks.rpt\`
- **Common Root Causes for Ungated Flops**:
  1. **Low Bit-Width Cones**: By default, Genus requires a minimum register bank width (e.g. $\\ge 3$ or $4$ flops sharing the identical enable) to justify the area and power overhead of the ICG cell.
  2. **Complex / Incompatible Enable Conditions**: Enables that depend on asynchronous resets or have no static observability in the clock cycle.
  3. **High-Activity Registers**: If a register toggles $>90\\%$ of the time, inserting an ICG adds latch switching power without saving clock power!
  4. **Preserved RTL Hierarchies**: Attributes like \`set_db [get_cells ...] .preserve true\` blocking cell insertion.

---

### 3. Timing Hazards Introduced by ICG Insertion:
1. **Clock Gating Setup Check ($T_{\\text{setup\\_cg}}$)**:
   - The enable signal must arrive at the ICG latch before the falling edge of the clock (for positive-edge clocking).
   - If the enable path originates from deep combinational logic, this check frequently violates timing.
2. **Clock Tree Skew & Insertion Delay**:
   - The ICG introduces an internal cell delay ($\\approx 40\\text{ to } 80\\text{ ps}$), shifting downstream leaf clock pin arrivals and increasing CTS skew if not properly balanced.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Cadence Genus Clock Gating Audit & Diagnostics:

# 1. Query Insertion Status & Attributes:
get_db lp_insert_clock_gating
# Minimum bit-width threshold for gating (default typically 3 or 4):
set_db lp_clock_gating_min_flops 3

# 2. Re-synthesize with Strict Gating Enforcement:
syn_generic
syn_map
syn_opt

# 3. Generate Comprehensive Clock Gating Quality Reports:
report_clock_gates -detail -fanout_summary -tree_view > reports/clock_gates_detailed.rpt
report_clock_gating_quality > reports/cg_quality.rpt

# 4. Extract List of All Ungated Sequential Sinks for RTL Redesign:
set ungated_flops [report_clock_gates -get_sinks ungated]
echo "Total Ungated Flops: [llength $ungated_flops]"

# 5. Check Timing on Clock Gating Setup Checks:
report_timing -check_type clock_gating_setup -max_paths 10 > reports/cg_setup_violations.rpt
report_timing -check_type clock_gating_hold  -max_paths 10 > reports/cg_hold_violations.rpt`,
    },
    commonPitfalls: [
      "Using discrete RTL AND gates to gate clocks instead of letting Genus infer dedicated library ICG cells, causing catastrophic runt pulses.",
      "Setting lp_clock_gating_min_flops to 1 on high-frequency designs, creating thousands of ICGs that increase total power due to latch overhead.",
      "Neglecting clock gating setup checks (report_timing -check_type clock_gating_setup), resulting in silicon timing failures on enable cones.",
    ],
    interviewerFollowups: [
      "How does DFT scan insertion bypass clock gates during test mode (e.g. through the ICG SE/TE scan enable test pin)?",
      "Why does a negative-edge-triggered flip-flop require an OR-type ICG with an active-high latch instead of an AND-type ICG?",
    ],
    tags: ["icg", "clock-gating", "glitch-prevention", "cg-setup-check", "ungated-flops", "genus"],
  },

  {
    id: "lp-03",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Senior Staff Low-Power Synthesis Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "The Low-Power Synthesis Triage Playbook: Walk through the systematic debugging protocol when: 1) 'commit_power_intent' fails with missing cell errors, 2) power domains are reported as empty, and 3) gate-level simulation reports undriven 'sw_core_ctrl' pins.",
    shortSummary: "A robust low-power synthesis triage protocol resolves tool issues deterministically. Failed commit_power_intent usually indicates missing Liberty is_isolation_cell attributes, blacklisted dont_use flags, or secondary power rail mismatches. Empty power domains stem from hierarchical path typos in UPF -elements. Undriven control ports in gate-level simulation occur because UPF create_logic_port injects top-level pins that testbenches must actively drive before physical PMU RTL is integrated.",
    detailedAnswer: `### 1. Triage: 'commit_power_intent' Fails With Missing Cell Errors:
\`[POWER-COMMIT] Error: Cannot find valid isolation cell for domain 'PD_CORE'.\`
- **Root Cause & Fix Protocol**:
  1. **Library Cell Inspection**: Check whether loaded Liberty (\`.lib\`) files actually define isolation cells with the valid \`is_isolation_cell: true\` attribute:
     \`get_db lib_cells *ISO* -foreach { echo "[get_db $b .name] : [get_db $b .is_isolation_cell]" }\`
  2. **Audit \`dont_use\` Flags**: Check if synthesis scripts mistakenly marked isolation cells as unusable:
     \`get_db [get_db lib_cells *ISO*] .dont_use\` $\\to$ Clear with \`set_db [get_db lib_cells *ISO*] .dont_use false\`.
  3. **Clamp Value / Polarity Match**: If the UPF specifies \`-clamp_value 0\`, the library must have an AND-type isolation cell. If the library only has OR-type isolation cells (\`-clamp_value 1\`), commit will fail!
  4. **Secondary Power Rail Mismatch**: Verify that the isolation strategy's \`-isolation_power_net\` matches the secondary power pin declared in the library cell.

---

### 2. Triage: Power Domains Reported as Empty:
\`report_power_intent -power_domain_only\` shows \`PD_CORE\` with $0$ leaf instances.
- **Root Cause**:
  - Typos in the UPF \`-elements {u_core}\` construct relative to the elaborated top module.
  - If RTL elaboration generates \`soc_top/u_core_inst\` instead of \`u_core\`, the UPF assignment silently misses!
- **Fix**:
  - Run \`get_db hinsts *core*\` inside Genus to obtain the precise elaborated instance path.
  - Update the UPF: \`create_power_domain PD_CORE -elements {u_core_inst}\`.

---

### 3. Triage: Gate-Level Simulation (GLS) Reports Undriven 'sw_core_ctrl':
\`[SIM-GLS] Warning: Input pin 'sw_core_ctrl' is floating (Z). Outputs oscillating!\`
- **Root Cause**:
  - In educational or early-stage RTL, the Power Management Unit (PMU) does not yet exist in RTL.
  - The UPF injected the control port via \`create_logic_port -direction in sw_core_ctrl\`.
  - When Genus synthesizes the netlist, \`sw_core_ctrl\` becomes a real physical top-level port, but the functional Verilog testbench does not drive it!
- **Fix**:
  - Update the Verilog testbench:
    \`initial begin force top.sw_core_ctrl = 1'b1; end\` (mission mode).
  - For power-aware simulation (PA-SIM), actively toggle \`sw_core_ctrl\` through the sleep/wake sequence.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Debugging Script for Failed Power Intent Commits:

# 1. Audit Library Low-Power Capabilities:
set iso_cells [get_db lib_cells *ISO*]
set ls_cells  [get_db lib_cells *LVL*]
echo "Found [llength $iso_cells] ISO cells and [llength $ls_cells] Level Shifter cells."

# 2. Force Enable dont_use on Required Cells:
set_db $iso_cells .dont_use false
set_db $ls_cells  .dont_use false

# 3. Audit Elaborated Hierarchy to Confirm Instance Paths:
report_hierarchy -levels 2 > reports/hierarchy_audit.rpt
set core_inst [get_db hinsts *u_core*]
echo "Verified Core Hierarchy Instance: [get_db $core_inst .name]"

# 4. Check Power Intent with Detailed Error Diagnostics:
check_power_intent -design soc_top -isolation -detail > reports/iso_check_detail.rpt
check_power_intent -design soc_top -level_shifter -detail > reports/ls_check_detail.rpt

# 5. Commit with Verbose Logging:
commit_power_intent -design soc_top

# 6. Verify Physical Insertion Count:
report_power_intent_instances -isolation_only -summary`,
    },
    commonPitfalls: [
      "Assuming a failed commit is caused by a syntax error in UPF when the root cause is actually missing isolation library macros.",
      "Misspelling instance names in UPF -elements, causing logic to silently fall into the default root domain.",
      "Forgetting to drive UPF-injected logic ports in functional Verilog testbenches during gate-level simulation.",
    ],
    interviewerFollowups: [
      "How do you configure Genus to execute an intent-only dry run (DO_COMMIT_PI=0) when low-power libraries are not yet available?",
      "In physical design, how does Innovus verify secondary power strap connections for isolation cells committed by Genus?",
    ],
    tags: ["triage", "commit-failure", "empty-domains", "dont-use", "gls-undriven", "genus-cui"],
  },

  {
    id: "lp-04",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Staff Power Analysis & Methodology Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "Activity Injection & Power Analysis Hierarchy: Compare vectorless default toggle rates versus SAIF, TCF, and VCD activity injection. Explain the physical components of CMOS power (Leakage, Internal, Switching) and how clock gating alters these ratios.",
    shortSummary: "CMOS power consists of static leakage (subthreshold and gate dielectric tunneling), internal short-circuit power (cross-conduction during switching and charging internal parasitic caps), and net switching power (C*V^2*f charging load caps). Vectorless default power estimation (stim#0/frame#0) provides only crude relative numbers (often 0.1 toggle rate). True signoff power requires ingesting switching activity files (SAIF, TCF, or VCD) captured from realistic software workloads. Clock gating drastically cuts both internal register clock tree power and downstream net switching power.",
    detailedAnswer: `### 1. The 3 Physical Components of CMOS Power Dissipation:

| Power Category | Physical Dissipation Mechanism | Mathematical Formulation | Impact of Clock Gating |
| :--- | :--- | :--- | :--- |
| **Static Leakage ($P_{\\text{leak}}$)** | Subthreshold source-to-drain current ($I_{\\text{sub}}$) and gate dielectric quantum tunneling ($I_{\\text{gate}}$). | $P_{\\text{leak}} = V_{\\text{DD}} \\cdot (I_{\\text{sub}} + I_{\\text{gate}} + I_{\\text{pn}})$ | **Zero Direct Reduction** on active rail (requires MTCMOS power gating or HVT cell swapping to reduce). |
| **Internal Power ($P_{\\text{int}}$)** | 1) Crowbar short-circuit current during input transition ($t_{\\text{rf}}$); 2) Charging internal parasitic capacitances inside the standard cell macro. | $P_{\\text{int}} = V_{\\text{DD}} \\cdot I_{\\text{peak}} \\cdot t_{\\text{sc}} \\cdot f + C_{\\text{int}} \\cdot V_{\\text{DD}}^2 \\cdot f$ | **Massively Reduced** (cuts internal charging of leaf clock buffers and flip-flop master-slave nodes). |
| **Net Switching ($P_{\\text{sw}}$)** | Charging and discharging external interconnect wire capacitance ($C_{\\text{wire}}$) and receiver input pin capacitances ($C_{\\text{in}}$). | $P_{\\text{sw}} = \\frac{1}{2} \\cdot \\alpha \\cdot C_{\\text{load}} \\cdot V_{\\text{DD}}^2 \\cdot f$ | **Massively Reduced** (reduces toggle activity $\\alpha$ to 0 on gated clock trees and downstream data logic cones). |

---

### 2. Activity Quality Hierarchy:

| Activity Source | Accuracy Level | Implementation Mechanism | Recommended Use Case |
| :--- | :--- | :--- | :--- |
| **Vectorless Default** (\`stim#0/frame#0\`) | **Low** (Rough approximation) | Assigns arbitrary default toggle rate (e.g. $0.1$ or $10\\%$) and $50\\%$ duty cycle. | Initial synthesis sanity checks and coarse A/B tool comparisons. |
| **User Activity** (\`set_activity\`) | **Moderate** | Designer explicitly sets toggle rates and duty cycles on primary inputs and clocks. | Early architectural modeling when simulation waveforms are unavailable. |
| **SAIF / TCF** (\`read_saif\`, \`read_tcf\`) | **High (Signoff Standard)** | Average toggle count and static probability per net generated from RTL/GLS simulation. | **Signoff dynamic power optimization** and packaging thermal analysis. |
| **VCD / FSDB** (\`read_vcd\`) | **Ultra-High (Peak Power)** | Time-based cycle-by-cycle waveform vectors capturing instantaneous power spikes. | Dynamic IR drop analysis, di/dt inductive noise, and electromigration (Voltus). |`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Activity Injection & Comprehensive Power Reporting in Cadence Genus:

# 1. Option A: Apply User-Defined Default Activity:
set_db lp_default_toggle_percentage 15
set_activity -activity_type default -pin_types primary_input -duty 0.5 -freq 100e6

# 2. Option B: Ingest Waveform Activity from Realistic Simulation Workload:
read_saif -instance pad_top/u_core -scale_to_sdc_frequency ../sim/core_workload.saif

# 3. Report Power by Category (Leakage, Internal, Switching, Total):
report_power -by_category -unit mW -header > reports/power_by_category.rpt

# 4. Report Power Decomposed by Hierarchical Instances:
report_power -by_hierarchy -levels 3 -unit mW -header > reports/power_by_hierarchy.rpt

# 5. Identify High-Power Leaf Cells (Hotspot Analysis):
report_power -by_leaf_instance -unit mW -header > reports/power_hotspots.rpt

# 6. Skip Pad Switching Noise for Pure Core Silicon Analysis:
report_power -by_category -skip_port_switching_power -unit mW > reports/core_clean_power.rpt`,
    },
    commonPitfalls: [
      "Using vectorless power numbers to sign off thermal dissipation and battery life guarantees.",
      "Failing to use -scale_to_sdc_frequency when reading SAIF files recorded at a simulation clock frequency different from the target SDC frequency.",
      "Confusing internal cell power with net switching power during power budget reviews.",
    ],
    interviewerFollowups: [
      "Why does a gate with slow input transitions draw significantly higher internal power due to crowbar currents?",
      "How does Genus propagate switching activity forward and backward across combinational logic when a SAIF file has incomplete net coverage?",
    ],
    tags: ["activity-injection", "saif", "vcd", "cmos-power", "leakage-vs-dynamic", "power-reporting"],
  },

  {
    id: "lp-05",
    domain: "low-power-upf",
    domainName: "Low Power Design (UPF / CPF)",
    role: "Senior RTL-to-GDS Physical Signoff Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Technical Round 1",
    question: "Post-LP Netlist Hygiene & Structural Signoff: Why does low-power synthesis and clock gating generate multi-port assigns and unloaded combinational gates? Explain the structural cleanup sequence: 'remove_assigns_without_opt', 'delete_unloaded_undriven', and why ~350 constant leaf pins are expected on pad-ring tops.",
    shortSummary: "Low-power synthesis and UPF cell commits introduce structural artifacts: continuous assign statements across module boundaries and unreferenced combinational gates created during ICG enable optimization. Handoff to Innovus requires eliminating assigns using remove_assigns_without_opt (mapping assigns to physical buffers without expensive global timing re-runs) and pruning dead gates using delete_unloaded_undriven. On pad-ring tops, ~350 constant leaf pins are normal due to pad pull-up/pull-down ties, which are cleanly hooked to physical tie-off cells via add_tieoffs.",
    detailedAnswer: `### 1. Why Low-Power Synthesis Generates Structural Netlist Defects:
1. **Verilog Continuous Assigns (\`assign a = b;\`)**:
   - Boundary isolation cell insertion and level-shifter insertion break net connections across module boundaries.
   - Genus connects these newly inserted cells using continuous assigns by default to preserve logical hierarchy.
   - **PnR Disaster**: Innovus and physical verification (LVS) treat continuous assigns as direct metal shorts between two distinct net names, causing catastrophic short circuits and routing errors.
2. **Unloaded Combinational Gates**:
   - When Genus optimizes clock gating enable cones, redundant gates in the original data path become unreferenced.
   - If not purged, these dead cells consume silicon area, contribute to leakage, and confuse LEC.

---

### 2. The Netlist Hygiene Sequence:
To achieve a production-clean handoff to physical design:
1. **Assign Elimination**:
   \`remove_assigns_without_opt -design pad_top -verbose\`
   - Inserts physical non-inverting buffers (e.g. \`BUFX2\`) on assign nets **without** triggering a full, expensive global timing re-optimization!
2. **Dead Logic Pruning**:
   \`delete_unloaded_undriven pad_top\`
   - Removes unreferenced combinational gates and unconnected wires cleanly.
3. **Physical Tie-Off Cell Insertion**:
   \`add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 pad_top\`
   - Replaces logical \`1'b0\` and \`1'b1\` rail connections with dedicated ESD-protective tie-high and tie-low standard cells.

---

### 3. Why ~350 Constant Leaf Pins Are Expected on Pad-Ring Tops:
In \`check_design -constant\`, finding $\\approx 350$ constant leaf pins on a top-level pad-ring module is **completely normal and expected**:
- I/O pad cells contain numerous static configuration pins (slew rate control, drive strength select, pull-up/pull-down enable, boundary scan test mode select).
- In a production ASIC, these configuration pins are hard-wired to static logic $0$ or $1$.
- While core logic should minimize constants, pad-ring constants are electrically required and must NOT be deleted!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Post-LP Netlist Sanitization & Structural Audit:

# 1. Audit Structural Integrity Pre-Cleanup:
check_design -assigns > reports/check_assigns_pre.rpt
check_design -unloaded_comb > reports/check_unloaded_pre.rpt
check_design -constant > reports/check_constants.rpt

# 2. Eliminate Continuous Assigns by Inserting Buffers Without Re-Opt:
set_remove_assign_options -buffer_or_inverter BUFX2 -design pad_top
remove_assigns_without_opt -design pad_top -verbose

# 3. Purge Dead Combinational Cells & Unreferenced Logic:
delete_unloaded_undriven pad_top

# 4. Insert Dedicated Physical Tie-High and Tie-Low Cells:
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 pad_top

# 5. Signoff Structural Check:
check_design -all > reports/check_design_signoff.rpt
# Acceptance Criteria:
# - Assigns: 0
# - Multiple Drivers: 0
# - Combinational Loops: 0
# - Unresolved Instances: 0
# - Constant Leaf Pins: Expected (~350 on pad-ring shell, verified tied)`,
    },
    commonPitfalls: [
      "Running syn_opt after remove_assigns_without_opt, which can inadvertently re-introduce continuous assigns across hierarchical ports.",
      "Executing delete_unloaded_undriven on I/O pad ring modules without verifying that pad configuration ties are preserved.",
      "Failing to limit tie-off cell fanout (-max_fanout 8), leading to long high-resistance polysilicon tie nets that violate antenna rules.",
    ],
    interviewerFollowups: [
      "Why must physical tie cells be used instead of connecting gate inputs directly to VDD and VSS power rails (gate oxide ESD breakdown protection)?",
      "How does Conformal LEC verify that remove_assigns_without_opt did not alter functional equivalence?",
    ],
    tags: ["netlist-hygiene", "check-design", "assign-removal", "tie-cells", "pad-ring", "genus-signoff"],
  },

  // 🟢 DOMAIN: TIMING WHITEBOARD PROBLEMS & NUMERIC SOLUTIONS (10+ YEAR INTERVIEW DEPTH)
  {
    id: "wb-01",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Senior Staff STA & Timing Signoff Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "STA Whiteboard Masterclass Set 1: Exact R2R Setup & Hold Equations Under Clock Skew, Latency, and Derate. Solve whiteboard problem sets A1 through A4 and D1 through D3 with complete step-by-step arithmetic: 1) pure ideal R2R setup, 2) setup under asymmetric clock latency (late launch vs early capture), 3) ideal hold, 4) the post-CTS dangerous skew hold failure, 5) setup uncertainty vs clock period equivalence, 6) data-path cell late derates (AOCV 1.05x), and 7) useful skew trade-offs.",
    shortSummary: "Mastering whiteboard STA requires instant fluency with the golden setup and hold equations. Setup checks maximum arrival against early capture: S_su = (T_clk + T_cp,C^early - T_su - T_unc) - (T_cp,L^late + T_co^max + T_dp^max). Positive clock skew helps setup but directly hurts hold: S_h = (T_cp,L^early + T_co^min + T_dp^min) - (T_cp,C^late + T_h + T_unc^hold). When capture clock arrival is delayed by post-CTS skew, hold slack degrades by the exact skew delta, causing catastrophic hold violations that cannot be cured by adjusting clock period.",
    detailedAnswer: `### 1. The Golden STA Formula Card (Keep Open While Practicing):

#### Setup Formulation (Register-to-Register, Single-Cycle):
$$T_{\\text{arr}} = T_{\\text{cp,L}}^{\\text{late}} + T_{\\text{co}}^{\\max} + T_{\\text{dp}}^{\\max}$$
$$T_{\\text{req}} = T_{\\text{clk}} + T_{\\text{cp,C}}^{\\text{early}} - T_{\\text{su}} - T_{\\text{unc}}^{\\text{setup}}$$
$$S_{\\text{su}} = T_{\\text{req}} - T_{\\text{arr}}$$
- **Setup-Hurting Clock Skew**: $\\Delta_{\\text{skew}} = T_{\\text{cp,L}}^{\\text{late}} - T_{\\text{cp,C}}^{\\text{early}}$. A positive skew (launch arriving later than capture) directly reduces available time!

#### Hold Formulation (Register-to-Register, Same Edge):
$$T_{\\text{arr}}^{\\min} = T_{\\text{cp,L}}^{\\text{early}} + T_{\\text{co}}^{\\min} + T_{\\text{dp}}^{\\min}$$
$$T_{\\text{req}}^h = T_{\\text{cp,C}}^{\\text{late}} + T_h + T_{\\text{unc}}^{\\text{hold}}$$
$$S_h = T_{\\text{arr}}^{\\min} - T_{\\text{req}}^h$$
- **Hold-Hurting Clock Skew**: When capture clock arrives late relative to launch ($T_{\\text{cp,C}}^{\\text{late}} > T_{\\text{cp,L}}^{\\text{early}}$), required hold time increases, compressing hold margin!

---

### 2. Problem Set A: Fundamental Warmup Solutions:

#### A1. Pure R2R Setup (Ideal Clocks):
- **Given**: $T_{\\text{clk}} = 1.0\\text{ ns}$, $T_{\\text{co}} = 0.12\\text{ ns}$, $T_{\\text{dp}} = 0.55\\text{ ns}$, $T_{\\text{su}} = 0.05\\text{ ns}$, $T_{\\text{unc}} = 0.03\\text{ ns}$, clock latency $= 0$.
- **Step 1: Data Arrival Time**:
  $$T_{\\text{arr}} = 0 + 0.12 + 0.55 = 0.67\\text{ ns}$$
- **Step 2: Data Required Time**:
  $$T_{\\text{req}} = 1.0 + 0 - 0.05 - 0.03 = 0.92\\text{ ns}$$
- **Step 3: Setup Slack**:
  $$S = T_{\\text{req}} - T_{\\text{arr}} = 0.92 - 0.67 = \\mathbf{+0.25\\text{ ns}} \\quad \\text{(MET)}$$

#### A2. Setup Under Asymmetric Clock Latency:
- **Given**: Same numbers as A1, but launch clock path is $0.20\\text{ ns}$ late, capture clock path is $0.08\\text{ ns}$ early.
- **Step 1: Data Arrival Time**:
  $$T_{\\text{arr}} = 0.20 + 0.12 + 0.55 = 0.87\\text{ ns}$$
- **Step 2: Data Required Time**:
  $$T_{\\text{req}} = 1.0 + 0.08 - 0.05 - 0.03 = 1.00\\text{ ns}$$
- **Step 3: Setup Slack & Effective Skew**:
  $$S = 1.00 - 0.87 = \\mathbf{+0.13\\text{ ns}} \\quad \\text{(MET)}$$
  $$\\Delta_{\\text{skew}} = T_{\\text{launch}}^{\\text{late}} - T_{\\text{capture}}^{\\text{early}} = 0.20 - 0.08 = 0.12\\text{ ns}$$
  - Notice: Compared to A1, setup slack dropped by exactly $0.12\\text{ ns}$ (from $+0.25\\text{ ns}$ down to $+0.13\\text{ ns}$)!

#### A3. Hold With Ideal Clocks:
- **Given**: $T_{\\text{co}}^{\\min} = 0.08\\text{ ns}$, $T_{\\text{dp}}^{\\min} = 0.04\\text{ ns}$, $T_h = 0.04\\text{ ns}$, $T_{\\text{unc}}^h = 0.02\\text{ ns}$, clock paths $= 0$.
- **Step 1: Minimum Arrival Time**:
  $$T_{\\text{arr}}^{\\min} = 0 + 0.08 + 0.04 = 0.12\\text{ ns}$$
- **Step 2: Required Hold Time**:
  $$T_{\\text{req}}^h = 0 + 0.04 + 0.02 = 0.06\\text{ ns}$$
- **Step 3: Hold Slack**:
  $$S_h = 0.12 - 0.06 = \\mathbf{+0.06\\text{ ns}} \\quad \\text{(MET)}$$

#### A4. Hold Under Dangerous Post-CTS Skew:
- **Given**: Launch clock early $= 0.05\\text{ ns}$, capture clock late $= 0.18\\text{ ns}$, $T_{\\text{co}}^{\\min} = 0.07\\text{ ns}$, $T_{\\text{dp}}^{\\min} = 0.03\\text{ ns}$, $T_h = 0.05\\text{ ns}$, $T_{\\text{unc}}^h = 0.02\\text{ ns}$.
- **Step 1: Minimum Arrival Time**:
  $$T_{\\text{arr}}^{\\min} = 0.05 + 0.07 + 0.03 = 0.15\\text{ ns}$$
- **Step 2: Required Hold Time**:
  $$T_{\\text{req}}^h = 0.18 + 0.05 + 0.02 = 0.25\\text{ ns}$$
- **Step 3: Hold Slack**:
  $$S_h = 0.15 - 0.25 = \\mathbf{-0.10\\text{ ns}} \\quad \\mathbf{(FATAL\\ FAIL!)}$$
- **Physical Insight**: Capture clock is $130\\text{ ps}$ later than launch clock. The fast data arrives at $0.15\\text{ ns}$ while the capture flop requires data to remain stable until $0.25\\text{ ns}$. This is the classic post-CTS hold race condition that will cause silicon failure regardless of clock period!

---

### 3. Problem Set D: Skew, Derate, and Uncertainty Solutions:

#### D1. Uncertainty vs Period Equivalence:
- **Given**: A1 baseline setup slack was $+0.25\\text{ ns}$. You add $+0.10\\text{ ns}$ setup uncertainty (total $T_{\\text{unc}} = 0.13\\text{ ns}$ vs $0.03\\text{ ns}$).
- **New Slack**:
  $$S = 0.92 - 0.10 - 0.67 = \\mathbf{+0.15\\text{ ns}}$$
- **Interview Takeaway**: Increasing setup uncertainty by $+0.10\\text{ ns}$ is mathematically identical to reducing effective clock period by $0.10\\text{ ns}$ (shrinking cycle time from $1.0\\text{ ns}$ to $0.90\\text{ ns}$). Uncertainty is guardband for jitter and OCV, never free architectural margin!

#### D2. Cell Late Derate (1.05x on Data Path Only):
- **Given**: $T_{\\text{clk}} = 1.0\\text{ ns}$, $T_{\\text{co}} = 0.10\\text{ ns}$, $T_{\\text{dp}} = 0.50\\text{ ns}$, $T_{\\text{su}} = 0.05\\text{ ns}$, $T_{\\text{unc}} = 0$, ideal clocks. Cell late derate is $\\times 1.05$.
- **Without Derate**:
  $$T_{\\text{arr}} = 0.10 + 0.50 = 0.60\\text{ ns}, \\quad T_{\\text{req}} = 1.0 - 0.05 = 0.95\\text{ ns} \\implies S = \\mathbf{+0.35\\text{ ns}}$$
- **With 1.05x Late Derate**:
  $$T_{\\text{arr}} = 1.05 \\times (0.10 + 0.50) = 0.63\\text{ ns} \\implies S = 0.95 - 0.63 = \\mathbf{+0.32\\text{ ns}}$$
  - The $5\\%$ late derate on cell delays degraded setup slack by exactly $-30\\text{ ps}$.

#### D3. Useful Skew Budgeting:
- **Given**: $T_{\\text{clk}} = 1.0\\text{ ns}$, total path delay $(T_{\\text{co}} + T_{\\text{dp}} + T_{\\text{su}} + T_{\\text{unc}}) = 1.05\\text{ ns}$, resulting in $S = -0.05\\text{ ns}$ violation under zero skew. You delay the capture clock by $+0.08\\text{ ns}$ via useful skew buffer insertion.
- **New Setup Slack**:
  $$S_{\\text{new}} = -0.05\\text{ ns} + 0.08\\text{ ns} = \\mathbf{+0.03\\text{ ns}} \\quad \\text{(MET)}$$
- **The Silicon Tradeoff**: Intentionally delaying the capture clock by $+80\\text{ ps}$ recovers setup timing on this critical cone, but **simultaneously shrinks hold slack by $-80\\text{ ps}$** on all other short paths terminating at this capture register!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete STA Script: Checking Setup, Hold, Latency, and Derates:

# 1. Define Clocks with Latency and Uncertainty:
create_clock -name CLK -period 1.000 [get_ports clk]
set_clock_uncertainty -setup 0.030 [get_clocks CLK]
set_clock_uncertainty -hold  0.020 [get_clocks CLK]

# 2. Inject Pre-CTS Clock Latencies (Source vs Network):
set_clock_latency -source -early 0.050 [get_clocks CLK]
set_clock_latency -source -late  0.200 [get_clocks CLK]

# 3. Apply On-Chip Variation (AOCV / Flat Derates):
set_timing_derate -cell_delay -late 1.050 -data
set_timing_derate -cell_delay -early 0.950 -data

# 4. Report Setup and Hold with Expanded Clock Network:
report_timing -check_type setup -max_paths 5 -path_type full_clock_expanded > reports/setup_r2r.rpt
report_timing -check_type hold  -max_paths 5 -path_type full_clock_expanded > reports/hold_r2r.rpt`,
    },
    commonPitfalls: [
      "Assuming hold slack depends on clock period, leading to the false belief that slowing down the clock can fix hold violations.",
      "Confusing launch late latency with capture early latency when computing setup skew.",
      "Applying useful skew without checking hold violations on secondary short paths feeding the same capture flip-flop.",
    ],
    interviewerFollowups: [
      "Why does Clock Path Pessimism Removal (CPPR / CRPR) add back common clock tree delay differences between early and late branches?",
      "In a FinFET process with severe local variation, how does POCV sigma-based derating differ from flat 1.05x derating?",
    ],
    tags: ["sta", "whiteboard-math", "setup-hold", "clock-skew", "derate", "useful-skew"],
  },

  {
    id: "wb-02",
    isFreeSample: true,
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal Timing & Interface Architecture Lead",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "STA Whiteboard Masterclass Set 2: The I/O External Delay Bible. Solve whiteboard problem sets B1 through B5: 1) I2R setup calculation and refuting the input delay allocation misconception, 2) proving the mathematical equivalence of R2O standard required-side vs dual arrival-side formulations, 3) I2O pad-to-pad analysis and deriving the minimum clock period for zero slack, 4) the exact slack sensitivity to external output delay delta (+Δ), and 5) I2R hold slack and the min input delay bias direction.",
    shortSummary: "Boundary I/O timing calculations represent the highest-yield interview topic. set_input_delay represents off-chip launch latency and sits strictly on Data Arrival Time. On R2O paths, set_output_delay can be formulated either as reducing required time (standard EDA report: S = T_clk - T_odel - T_unc - T_arr) or increasing effective arrival time (dual form: S = T_clk - T_unc - (T_arr + T_odel)); both are mathematically identical. On I2O paths with physical pads (0.7 ns input + 1.4 ns output), unpipelined signals cannot close at high frequency (2.0 ns clock requires T_clk >= 3.02 ns), proving that boundary pipelining is required.",
    detailedAnswer: `### 1. The I/O External Delay Mental Model:

| Interface Segment | Startpoint | Endpoint | Delay Allocation in Golden Equation |
| :--- | :--- | :--- | :--- |
| **I2R (Input to Register)** | Input Port | Flop $D$ Pin | $+T_{\\text{i\\_del}}^{\\max}$ strictly on **Data Arrival Time** ($T_{\\text{arr}}$). |
| **R2O (Register to Output)** | Flop $Q$ Pin | Output Port | $-T_{\\text{o\\_del}}^{\\max}$ strictly on **Data Required Time** ($T_{\\text{req}}$) (standard EDA form). |
| **I2O (Pure Feedthrough)** | Input Port | Output Port | $+T_{\\text{i\\_del}}^{\\max}$ on $T_{\\text{arr}}$ **AND** $-T_{\\text{o\\_del}}^{\\max}$ on $T_{\\text{req}}$. |

---

### 2. Problem Set B: Step-by-Step Numeric Solutions:

#### B1. I2R Setup Calculation & Refuting the Misconception:
- **Given**: $T_{\\text{clk}} = 2.0\\text{ ns}$, $T_{\\text{i\\_del}}^{\\max} = 0.40\\text{ ns}$, port$\\to D$ combinational logic $= 0.90\\text{ ns}$, $T_{\\text{su}} = 0.06\\text{ ns}$, $T_{\\text{unc}} = 0.04\\text{ ns}$, ideal clocks.
- **Step 1: Data Arrival Time**:
  $$T_{\\text{arr}} = 0 + T_{\\text{i\\_del}}^{\\max} + T_{\\text{comb}} = 0 + 0.40 + 0.90 = 1.30\\text{ ns}$$
- **Step 2: Data Required Time**:
  $$T_{\\text{req}} = T_{\\text{clk}} - T_{\\text{su}} - T_{\\text{unc}} = 2.0 - 0.06 - 0.04 = 1.90\\text{ ns}$$
- **Step 3: Setup Slack**:
  $$S = T_{\\text{req}} - T_{\\text{arr}} = 1.90 - 1.30 = \\mathbf{+0.60\\text{ ns}} \\quad \\text{(MET)}$$
- **Candidate Fallacy Refuted**: Candidates frequently say: *"input_delay adds to required time"*. **This is completely wrong.** \`input_delay\` is external launch latency and belongs exclusively to the Data Arrival Path.

#### B2. R2O Setup — Both Formulations & Proof of Equality:
- **Given**: $T_{\\text{clk}} = 2.0\\text{ ns}$, $T_{\\text{co}} = 0.10\\text{ ns}$, $Q\\to\\text{port}$ combo $= 0.80\\text{ ns}$, $T_{\\text{o\\_del}}^{\\max} = 0.50\\text{ ns}$, $T_{\\text{unc}} = 0.05\\text{ ns}$, ideal clocks.
- **Formulation 1: Standard EDA Tool Required-Side (Genus / Innovus / PrimeTime)**:
  $$T_{\\text{arr}} = T_{\\text{co}} + T_{\\text{comb}} = 0.10 + 0.80 = 0.90\\text{ ns}$$
  $$T_{\\text{req}} = T_{\\text{clk}} - T_{\\text{o\\_del}}^{\\max} - T_{\\text{unc}} = 2.0 - 0.50 - 0.05 = 1.45\\text{ ns}$$
  $$S = T_{\\text{req}} - T_{\\text{arr}} = 1.45 - 0.90 = \\mathbf{+0.55\\text{ ns}}$$
- **Formulation 2: Dual Arrival-Side Formulation**:
  $$T_{\\text{arr}}' = T_{\\text{arr}} + T_{\\text{o\\_del}}^{\\max} = 0.90 + 0.50 = 1.40\\text{ ns}$$
  $$T_{\\text{req}}' = T_{\\text{clk}} - T_{\\text{unc}} = 2.0 - 0.05 = 1.95\\text{ ns}$$
  $$S = T_{\\text{req}}' - T_{\\text{arr}}' = 1.95 - 1.40 = \\mathbf{+0.55\\text{ ns}}$$
- **Interview Polish**: Switching between Form 1 and Form 2 without changing the answer shows mastery of timing report internals!

#### B3. I2O With Physical Pads (The Lab-Style Interview Problem):
- **Given**:
  - \`input_delay\`: $0.20\\text{ ns}$
  - Input pad receiver arc: $0.70\\text{ ns}$
  - Internal core combinational logic: $0.50\\text{ ns}$
  - Output pad driver arc: $1.40\\text{ ns}$
  - \`output_delay\`: $0.20\\text{ ns}$
  - Clock uncertainty: $0.02\\text{ ns}$
  - Clock period: $2.00\\text{ ns}$ (ideal clocks, no flop setup time on pure feedthrough).
- **Step 1: Total Data Arrival Time**:
  $$T_{\\text{arr}} = 0.20 + 0.70 + 0.50 + 1.40 = 2.80\\text{ ns}$$
- **Step 2: Data Required Time**:
  $$T_{\\text{req}} = 2.00 - 0.20 - 0.02 = 1.78\\text{ ns}$$
- **Step 3: Setup Slack**:
  $$S = 1.78 - 2.80 = \\mathbf{-1.02\\text{ ns}} \\quad \\mathbf{(FATAL\\ VIOLATION)}$$
- **Minimum Period for Zero Slack ($S = 0$)**:
  $$T_{\\text{clk}} - 0.20 - 0.02 = 2.80 \\implies \\mathbf{T_{\\text{clk}} = 3.02\\text{ ns}} \\quad (f_{\\max} = 331\\text{ MHz})$$
- **Senior Takeaway**: No amount of core logic upsizing can fix this violation! Even if core logic delay dropped to $0\\text{ ps}$, the pad arcs alone ($0.70 + 1.40 = 2.10\\text{ ns}$) plus external delays ($0.40\\text{ ns}$) exceed the $2.0\\text{ ns}$ budget. This proves boundary pipelining is required.

#### B4. Increasing Output Delay by 100 ps:
- **Given**: B2 baseline slack was $+0.55\\text{ ns}$. New $T_{\\text{o\\_del}}^{\\max} = 0.60\\text{ ns}$ ($+100\\text{ ps}$).
- **Result**: Data Required Time drops by $0.10\\text{ ns}$, so slack becomes:
  $$S = 0.55 - 0.10 = \\mathbf{+0.45\\text{ ns}}$$
- **Universal Rule**: $+\\Delta$ max output_delay $\\implies -\\Delta$ setup slack.

#### B5. Hold on Input Path (I2R Hold Check):
- **Given**: $T_{\\text{i\\_del}}^{\\min} = 0.05\\text{ ns}$, port$\\to D$ min combo $= 0.08\\text{ ns}$, $T_h = 0.04\\text{ ns}$, $T_{\\text{unc}}^h = 0.02\\text{ ns}$, ideal clocks.
- **Step 1: Minimum Arrival Time**:
  $$T_{\\text{arr}}^{\\min} = T_{\\text{i\\_del}}^{\\min} + T_{\\text{comb}}^{\\min} = 0.05 + 0.08 = 0.13\\text{ ns}$$
- **Step 2: Required Hold Time**:
  $$T_{\\text{req}}^h = 0 + T_h + T_{\\text{unc}}^h = 0.04 + 0.02 = 0.06\\text{ ns}$$
- **Step 3: Hold Slack**:
  $$S_h = 0.13 - 0.06 = \\mathbf{+0.07\\text{ ns}} \\quad \\text{(MET)}$$
- **Bias Directionality**: If $T_{\\text{i\\_del}}^{\\min}$ is constrained too small (or left at 0 when external delay exists), hold looks **worse** than silicon (false pessimism). Smaller min input delay makes hold harder!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete SDC I/O Constraint Template for pad_top.sv:

# 1. Establish Clock Reference:
create_clock -name CLK -period 2.000 [get_ports pad_clk]
set_clock_uncertainty 0.020 [get_clocks CLK]

# 2. Constrain Max and Min External Delays:
set_input_delay  -max 0.400 -clock CLK [remove_from_collection [all_inputs] [get_ports pad_clk]]
set_input_delay  -min 0.050 -clock CLK [remove_from_collection [all_inputs] [get_ports pad_clk]]

set_output_delay -max 0.500 -clock CLK [all_outputs]
set_output_delay -min 0.050 -clock CLK [all_outputs]

# 3. Audit External Delay Budgets on Ports:
report_port -delay [all_inputs]
report_port -delay [all_outputs]

# 4. Verify I2R and R2O Path Endpoints in Timing Engine:
report_timing -from [all_inputs -no_clocks] -to [all_registers] -max_paths 5
report_timing -from [all_registers] -to [all_outputs] -max_paths 5`,
    },
    commonPitfalls: [
      "Asserting that input_delay belongs on the required time side of the equation.",
      "Trying to fix -1.0 ns pad-dominated I2O violations by running higher synthesis effort on internal core logic.",
      "Setting min input_delay to 0 without checking whether real PCB trace delays exist, masking hold races.",
    ],
    interviewerFollowups: [
      "How does set_input_delay -source_latency_included change the calculation when external clocks have large source latency?",
      "In a source-synchronous DDR interface, how are set_input_delay max/min values derived from setup/hold skew margins?",
    ],
    tags: ["sta", "io-delays", "input-delay", "output-delay", "i2o-paths", "pad-delays"],
  },

  {
    id: "wb-03",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Lead Timing Constraints & SDC Architect",
    difficulty: "Hard",
    round: "Onsite Technical Round 1",
    question: "STA Whiteboard Masterclass Set 3: Timing Exceptions, Multicycle Paths & Half-Cycle Clocking. Solve whiteboard problem sets C1 through C4: 1) setup slack with a 2-cycle multicycle path exception, 2) the critical clock edge alignment mechanics of why 'set_multicycle_path 1 -hold' is mandatory after 'set_multicycle_path 2 -setup', 3) half-cycle clocking (posedge-to-negedge) under 50% duty cycle, and 4) the economics of false paths and why blanket input-to-output waivers are an instant interview disqualification.",
    shortSummary: "Multicycle paths (MCP) expand timing budgets across architectural clock boundaries. Setting set_multicycle_path 2 -setup shifts the capture edge to 2*T_clk, adding a full cycle of slack (+1.25 ns vs +0.25 ns). However, by default, timing tools automatically move the hold capture edge forward to (setup_multiplier - 1) * T_clk (edge T), incorrectly checking data launched at edge 0 against capture edge T instead of edge 0! Applying set_multicycle_path 1 -hold pulls the hold check back to edge 0. Half-cycle paths cut the available clock window to T_clk/2. Blanket false paths on chip I/O mask real hardware failures and must be replaced with surgical pin lists or case analysis.",
    detailedAnswer: `### 1. Problem Set C: Step-by-Step Numeric Solutions:

#### C1. Multicycle Path Setup = 2:
- **Given**: Same numbers as A1 ($T_{\\text{clk}} = 1.0\\text{ ns}$, $T_{\\text{co}} = 0.12\\text{ ns}$, $T_{\\text{dp}} = 0.55\\text{ ns}$, $T_{\\text{su}} = 0.05\\text{ ns}$, $T_{\\text{unc}} = 0.03\\text{ ns}$), but the path is architecturally 2-cycle.
- **Data Arrival Time**:
  $$T_{\\text{arr}} = 0.12 + 0.55 = 0.67\\text{ ns} \\quad (\\text{unchanged})$$
- **Data Required Time (Capture at $2 \\cdot T_{\\text{clk}} = 2.0\\text{ ns}$)**:
  $$T_{\\text{req}} = 2.0 - 0.05 - 0.03 = 1.92\\text{ ns}$$
- **Setup Slack**:
  $$S = 1.92 - 0.67 = \\mathbf{+1.25\\text{ ns}} \\quad \\text{(MET)}$$
  - Notice: Without MCP, baseline slack was $+0.25\\text{ ns}$. MCP setup 2 added a full $1.0\\text{ ns}$ clock period of available margin!

---

### 2. C2. The Hold Edge Misalignment Trap (Why MCP Hold 1 is Mandatory):
When you specify:
\`set_multicycle_path 2 -setup -from [get_cells FF_A] -to [get_cells FF_B]\`

#### The Tool's Default Behavior:
- **Single-Cycle Normal Path**:
  - Launch Edge: $0\\text{ ns}$
  - Setup Capture Edge: $1T$ ($1.0\\text{ ns}$)
  - Hold Capture Edge: $0\\text{ ns}$ (same edge, ensures current data doesn't overwrite prior data)
- **When Setup MCP is Set to 2**:
  - Setup Capture Edge shifts to: $2T$ ($2.0\\text{ ns}$)
  - **Tool's Default Hold Check**: Timing tools calculate the default hold capture edge as **one edge before the setup capture edge**:
    $$\\text{Default Hold Capture Edge} = 2T - 1T = 1T \\quad (1.0\\text{ ns}!)$$
- **The Catastrophic Bug**:
  - The tool now checks that data launched at $0\\text{ ns}$ must NOT arrive before the clock edge at $1.0\\text{ ns}$!
  - This requires:
    $$T_{\\text{arr}}^{\\min} \\ge 1.0\\text{ ns} + T_h + T_{\\text{unc}}$$
  - Since data path delay is only $\\approx 0.15\\text{ ns}$, the tool reports an artificial **$-0.85\\text{ ns}$ hold violation**!
  - If uncorrected, synthesis will insert 20 to 30 buffer stages to delay the path past $1.0\\text{ ns}$, bloating area and destroying dynamic power!

#### The Required SDC Correction:
\`set_multicycle_path 2 -setup -from [get_cells FF_A] -to [get_cells FF_B]\`
\`set_multicycle_path 1 -hold  -from [get_cells FF_A] -to [get_cells FF_B]\`
- **What \`-hold 1\` Does**:
  - Moves the hold capture edge backward by 1 cycle: $1T - 1T = 0\\text{ ns}$.
  - Restores the hold check to edge $0\\text{ ns}$, verifying real physical hold stability without bogus buffer insertion!

---

### 3. C3. Half-Cycle Paths (Posedge $\\to$ Negedge):
- **Given**: Period $2.0\\text{ ns}$, waveform \`{0 1.0}\` ($50\\%$ duty cycle), launch posedge $0\\text{ ns}$, capture negedge $1.0\\text{ ns}$.
- $T_{\\text{co}} = 0.10\\text{ ns}$, $T_{\\text{dp}} = 0.70\\text{ ns}$, $T_{\\text{su}} = 0.05\\text{ ns}$, $T_{\\text{unc}} = 0.03\\text{ ns}$, ideal clocks.
- **Available Timing Window**:
  $$\\text{Window} = 1.0\\text{ ns} \\quad (\\text{half-cycle, NOT } 2.0\\text{ ns}!)$$
- **Data Arrival Time**:
  $$T_{\\text{arr}} = 0.10 + 0.70 = 0.80\\text{ ns}$$
- **Data Required Time**:
  $$T_{\\text{req}} = 1.0 - 0.05 - 0.03 = 0.92\\text{ ns}$$
- **Setup Slack**:
  $$S = 0.92 - 0.80 = \\mathbf{+0.12\\text{ ns}} \\quad \\text{(MET)}$$
- **Duty Cycle Sensitivity**: If clock duty cycle degrades to $40/60$ (falling edge at $0.80\\text{ ns}$), $T_{\\text{req}}$ collapses to $0.80 - 0.08 = 0.72\\text{ ns}$, turning slack into a **$-0.08\\text{ ns}$ violation**!

---

### 4. C4. False Path Economics: Why Blanket Exceptions Fail:
- **Scenario**: Chip WNS is $-1.0\\text{ ns}$, caused purely by static test configuration pins that are sampled only during power-on reset. Core R2R WNS is clean ($+0.15\\text{ ns}$).
- **The Candidate Trap**: *"Can we set \`set_false_path -from [all_inputs] -to [all_outputs]\`?"*
- **Why This Is an Immediate Disqualification**:
  - Applying blanket false paths removes **ALL** input-to-output timing checks across the entire chip, blinding the STA engine to active functional buses and control signals!
- **The Senior Architecture Alternative**:
  1. **Surgical False Paths**: Declare exceptions only on explicit, verified static signal lists:
     \`set_false_path -from [get_ports {pad_cfg_mode* pad_test_en}]\`
  2. **Case Analysis**: Fix operational modes statically:
     \`set_case_analysis 0 [get_ports pad_test_mode]\`
  3. **Interface Pipelining**: Insert boundary registers so signals become clean I2R and R2O paths.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Production Multicycle and Exception Configuration Script:

# 1. Standard 2-Cycle Multicycle Path Pair:
set_multicycle_path 2 -setup -from [get_pins u_alu/mult_reg*/Q] -to [get_pins u_alu/acc_reg*/D]
set_multicycle_path 1 -hold  -from [get_pins u_alu/mult_reg*/Q] -to [get_pins u_alu/acc_reg*/D]

# 2. Report Multicycle Paths to Verify Edge Relationships:
report_timing -from [get_pins u_alu/mult_reg*/Q] -to [get_pins u_alu/acc_reg*/D] -check_type setup
report_timing -from [get_pins u_alu/mult_reg*/Q] -to [get_pins u_alu/acc_reg*/D] -check_type hold

# 3. Surgical False Paths on Static Configuration Pins Only:
set_false_path -from [get_ports {pad_mode_select[*] pad_strap_*}]
set_case_analysis 0 [get_ports pad_scan_en]

# 4. Audit Active Timing Exceptions:
report_timing_exceptions -ignored
report_timing_exceptions -detail > reports/exceptions_audit.rpt`,
    },
    commonPitfalls: [
      "Specifying set_multicycle_path 2 -setup without -hold 1, causing hundreds of false hold violations and buffer bloat.",
      "Using blanket set_false_path on all_inputs or all_outputs to cosmeticize failing chip WNS.",
      "Forgetting that half-cycle paths halve the available timing window and depend strictly on duty cycle variations.",
    ],
    interviewerFollowups: [
      "How does set_multicycle_path -start vs -end alter clock edge alignment in multi-frequency clock domains?",
      "In a 3-cycle multicycle path, what value must be assigned to -hold to maintain same-edge hold checking?",
    ],
    tags: ["sta", "multicycle-path", "half-cycle", "false-path", "hold-alignment", "sdc-exceptions"],
  },

  {
    id: "wb-04",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Principal Physical Design & STA Signoff Specialist",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "STA Whiteboard Masterclass Set 4: 10+ Year Interview Hard Problems. Solve whiteboard problem sets F1 through F7: 1) simultaneous setup and hold calculation under full min/max clock and data latencies, 2) divide-by-2 generated clock domains, 3) conflicting SDC constraints ('set_max_delay' vs clock period), 4) dual-edge DDR flip-flop budgets, 5) time-borrowing transparent latch mathematics, 6) transition slew optimism and hidden slack deficits, and 7) pad-top full-chip closure.",
    shortSummary: "Advanced STA interviews test multi-variable boundary conditions. F1 demonstrates simultaneous max/min setup and hold checks where setup is razor-thin (+0.02 ns) while hold passes with +0.10 ns. F2 analyzes generated clocks, proving capture period expands to 4.0 ns. F3 proves that when set_max_delay 0.5 conflicts with a 1.0 ns clock, the optimizer must satisfy the tighter constraint (-0.2 ns vs positive). F4 calculates DDR dual-edge half-cycle budgets. F5 derives latch time-borrowing where data arriving at 0.70 ns borrows 0.20 ns past the midpoint to meet timing with exactly 0.00 ns slack. F6 quantifies that constraining input slew to 0.05 ns instead of true 0.20 ns injects 60 ps of dangerous optimism.",
    detailedAnswer: `### 1. Problem Set F: Mixed Hard Problems (10+ Year Staff Bar):

#### F1. Full R2R With Simultaneous Max/Min Parameters:
- **Given (ns)**:
  - Launch clock path: $\\text{Max } = 0.25, \\quad \\text{Min } = 0.10$
  - Capture clock path: $\\text{Max } = 0.22, \\quad \\text{Min } = 0.09$
  - $T_{\\text{co}}$: $\\text{Max } = 0.14, \\quad \\text{Min } = 0.08$
  - $T_{\\text{dp}}$: $\\text{Max } = 0.60, \\quad \\text{Min } = 0.20$
  - $T_{\\text{su}} = 0.05, \\quad T_h = 0.04$
  - $T_{\\text{unc}}^{\\text{su}} = 0.03, \\quad T_{\\text{unc}}^h = 0.02$
  - $T_{\\text{clk}} = 1.00$
- **Setup Calculation (Late Data, Early Capture Clock)**:
  $$T_{\\text{arr}} = T_{\\text{launch}}^{\\text{late}} + T_{\\text{co}}^{\\max} + T_{\\text{dp}}^{\\max} = 0.25 + 0.14 + 0.60 = 0.99\\text{ ns}$$
  $$T_{\\text{req}} = T_{\\text{clk}} + T_{\\text{capture}}^{\\text{early}} - T_{\\text{su}} - T_{\\text{unc}}^{\\text{su}} = 1.00 + 0.09 - 0.05 - 0.03 = 1.01\\text{ ns}$$
  $$S_{\\text{su}} = 1.01 - 0.99 = \\mathbf{+0.02\\text{ ns}} \\quad \\text{(MET: Razor-Thin!)}$$
- **Hold Calculation (Early Data, Late Capture Clock)**:
  $$T_{\\text{arr}}^{\\min} = T_{\\text{launch}}^{\\text{early}} + T_{\\text{co}}^{\\min} + T_{\\text{dp}}^{\\min} = 0.10 + 0.08 + 0.20 = 0.38\\text{ ns}$$
  $$T_{\\text{req}}^h = T_{\\text{capture}}^{\\text{late}} + T_h + T_{\\text{unc}}^h = 0.22 + 0.04 + 0.02 = 0.28\\text{ ns}$$
  $$S_h = 0.38 - 0.28 = \\mathbf{+0.10\\text{ ns}} \\quad \\text{(MET)}$$

#### F2. Divide-by-2 Generated Clock Domain:
- **Given**: Master clock \`clk\` has period $2.0\\text{ ns}$. Generated clock \`q_div\` is divide-by-2 ($T_{\\text{gen}} = 4.0\\text{ ns}$).
- Path within generated clock domain: $T_{\\text{co}} + T_{\\text{dp}} = 1.5\\text{ ns}$, $T_{\\text{su}} + T_{\\text{unc}} = 0.10\\text{ ns}$.
- **Setup Slack**:
  $$T_{\\text{arr}} = 1.5\\text{ ns}, \\quad T_{\\text{req}} = 4.0 - 0.10 = 3.90\\text{ ns} \\implies S = 3.90 - 1.50 = \\mathbf{+2.40\\text{ ns}}$$
- **Senior Warning**: When paths cross from master ($2.0\\text{ ns}$) to generated ($4.0\\text{ ns}$), STA tools align the closest launch and capture edges. Always draw the waveform to verify \`create_generated_clock -edges\` phase alignment!

#### F3. Conflicting Constraints (\`set_max_delay 0.5\` vs Clock Period 1.0):
- **Given**: Clock period is $1.0\\text{ ns}$. An engineer also applies:
  \`set_max_delay 0.5 -from [get_cells FF_A] -to [get_cells FF_B]\`
  Actual path delay is $0.70\\text{ ns}$.
- **Slack Evaluation**:
  - Against Clock: $T_{\\text{req}} \\approx 1.0 - 0.10 = 0.90\\text{ ns} \\implies S_{\\text{clk}} = 0.90 - 0.70 = \\mathbf{+0.20\\text{ ns}}$ (MET).
  - Against Max Delay: $T_{\\text{req}} = 0.50\\text{ ns} \\implies S_{\\text{max\\_del}} = 0.50 - 0.70 = \\mathbf{-0.20\\text{ ns}}$ (VIOLATED).
- **Resolution**: **The tighter constraint rules.** The optimizer prioritizes the $-0.20\\text{ ns}$ violation. Over-constraining with conflicting SDC is a methodology defect that must be documented or purged.

#### F4. Dual-Edge (DDR) Flop Timing Budget:
- **Given**: DDR sampling on both rising and falling edges. Clock period is $1.0\\text{ ns}$ (edge spacing $= 0.50\\text{ ns}$).
- Path delay is $0.42\\text{ ns}$, $T_{\\text{su}} + T_{\\text{unc}} = 0.06\\text{ ns}$.
- **Setup Slack**:
  $$T_{\\text{req}} = 0.50 - 0.06 = 0.44\\text{ ns}$$
  $$S = 0.44 - 0.42 = \\mathbf{+0.02\\text{ ns}} \\quad \\text{(MET)}$$
  - DDR timing paths are fundamentally half-cycle problems regardless of clock period label!

#### F5. Time-Borrowing Transparent Latch Analysis:
- **Given**: Positive latch open for $0.50\\text{ ns}$ of a $1.0\\text{ ns}$ cycle (open $0.50\\text{ ns} \\to 1.00\\text{ ns}$).
- Data arrives at latch $D$ at $0.70\\text{ ns}$ from cycle start. Downstream combo logic to next edge flop needs $0.25\\text{ ns}$, $T_{\\text{su}} = 0.05\\text{ ns}$. Next flop captures at $1.00\\text{ ns}$.
- **Is Borrowing Helping?**
  - Because data arrives at $0.70\\text{ ns}$ while latch is transparent ($0.50 \\to 1.00\\text{ ns}$), data propagates through immediately.
  - Launch to next flop begins at $0.70\\text{ ns}$ (borrowing $0.20\\text{ ns}$ past the nominal $0.50\\text{ ns}$ boundary).
  - Required check at next flop:
    $$\\text{Arrival} = 0.70 + 0.25 = 0.95\\text{ ns}, \\quad T_{\\text{req}} = 1.00 - 0.05 = 0.95\\text{ ns} \\implies S = \\mathbf{0.00\\text{ ns}}$$
  - **Result**: Path meets timing with **zero margin**. Without latch transparency (if an edge flop sampled at $0.50\\text{ ns}$), the $0.70\\text{ ns}$ arrival would have failed catastrophically by $-0.20\\text{ ns}$!

#### F6. Input Transition Slew Optimism:
- **Given**: True external slew on PCB is $0.20\\text{ ns}$. The SDC mistakenly constrained \`set_input_transition 0.05\`.
- First cell delay from Liberty table: $0.12\\text{ ns}$ @ $0.05\\text{ ns}$ slew vs $0.18\\text{ ns}$ @ $0.20\\text{ ns}$ slew. Rest of path is fixed at $0.50\\text{ ns}$. Available budget is $0.70\\text{ ns}$.
- **Reported Slack (Optimistic)**:
  $$T_{\\text{arr}} = 0.12 + 0.50 = 0.62\\text{ ns} \\implies S = 0.70 - 0.62 = \\mathbf{+0.08\\text{ ns}} \\quad \\text{(Green)}$$
- **True Silicon Slack**:
  $$T_{\\text{arr}} = 0.18 + 0.50 = 0.68\\text{ ns} \\implies S = 0.70 - 0.68 = \\mathbf{+0.02\\text{ ns}} \\quad \\text{(Razor-thin!)}$$
- **Deficit**: Slew under-constraint injected **$60\\text{ ps}$ of false optimism**, turning a robust path into a marginal yield risk!

#### F7. Pad Top Interview Closer:
- **Given (ns)**: Period $2.0$, unc $0.02$, i_del $0.2$, o_del $0.2$, pad_in $0.75$, pad_out $1.35$, core I2O $0.40$. Core R2R $(T_{\\text{co}} + T_{\\text{dp}} + T_{\\text{su}}) = 1.05$.
- **I2O Slack**:
  $$T_{\\text{arr}} = 0.20 + 0.75 + 0.40 + 1.35 = 2.70\\text{ ns}$$
  $$T_{\\text{req}} = 2.00 - 0.20 - 0.02 = 1.78\\text{ ns} \\implies S_{\\text{I2O}} = 1.78 - 2.70 = \\mathbf{-0.92\\text{ ns}}$$
- **R2R Slack**:
  $$T_{\\text{req}} = 2.00 - 0.02 = 1.98\\text{ ns} \\implies S_{\\text{R2R}} = 1.98 - 1.05 = \\mathbf{+0.93\\text{ ns}}$$
- **Architectural Solution**: Register signals at pad boundaries. Inserting an input flop after the input pad and an output flop before the output pad eliminates I2O entirely, splitting it into clean I2R and R2O paths that close timing easily!`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete STA Audit Script for Complex Timing Paths:

# 1. Audit Slew Rates on Primary Input Ports:
report_port -driver [all_inputs -no_clocks] > reports/port_slews.rpt

# 2. Check for Conflicting Point-to-Point Constraints:
report_timing -from [get_cells *] -to [get_cells *] -max_paths 10 -path_type full

# 3. Report Time Borrowing on Transparent Latch Stages:
report_timing -through [get_db insts -if {.is_latch == true}] -check_type setup

# 4. Audit Generated Clock Division & Phase Relationships:
report_clocks -generated > reports/generated_clocks.rpt
report_timing -from [get_clocks CLK] -to [get_clocks Q_DIV] -max_paths 5`,
    },
    commonPitfalls: [
      "Assuming DDR interfaces have full clock cycle timing budgets instead of half-cycle windows.",
      "Under-constraining input slews in SDC, injecting dozens of picoseconds of false optimism that fails on ATE testers.",
      "Mixing set_max_delay with normal clocking without verifying which constraint dominates.",
    ],
    interviewerFollowups: [
      "How does time borrowing affect downstream setup timing on the subsequent cycle?",
      "In a generated clock divide-by-3 with 50% duty cycle, how are edges defined in create_generated_clock?",
    ],
    tags: ["sta", "time-borrowing", "ddr-timing", "slew-optimism", "generated-clocks", "hard-problems"],
  },

  {
    id: "wb-05",
    domain: "static-timing-analysis",
    domainName: "Static Timing Analysis (STA & SI)",
    role: "Senior Director of Silicon Timing & Methodology",
    difficulty: "Staff / Principal",
    round: "Onsite Deep-Dive",
    question: "STA Whiteboard Masterclass Set 5: QoR Table Triage, Story Problems & 30-Second Rapid Fire. Solve problem sets E1, E2, and G1 through G10: 1) diagnosing chip setup WNS from a multi-path-group QoR table, 2) proving mathematically why upsizing core gates cannot fix an I2O violation dominated by pad delays, 3) solving 10 rapid-fire timing prompts in under 30 seconds each, and 4) executing the 6-point pre-interview whiteboard drill checklist.",
    shortSummary: "In senior STA interviews, story problems and rapid-fire drills evaluate architectural instinct. When a QoR table shows in2out WNS of -2.80 ns across 400 paths while reg2reg is +0.12 ns, chip WNS is -2.80 ns; spending time upsizing core logic is an engineering failure because even if core delay shrinks to 0 ps, arrival (2.5 ns) exceeds required (2.0 ns). The 10 rapid-fire prompts train mental math across setup, hold, MCP, half-cycle, and I/O deltas. The whiteboard drill checklist prepares candidates to draw clock edges, point to delay allocations, state corner skew directions, and explain the dual form of output_delay.",
    detailedAnswer: `### 1. Problem Set E: Path Groups & Diagnosis (Story Problems):

#### E1. QoR Table Triage:
You are handed the following post-synthesis QoR summary:

| Path Group | WNS | TNS | Violating Paths |
| :--- | :--- | :--- | :--- |
| **reg2reg** | $+0.12\\text{ ns}$ | $0.0\\text{ ns}$ | 0 (MET) |
| **in2reg** | $-0.05\\text{ ns}$ | $-0.40\\text{ ns}$ | 12 |
| **reg2out** | $+0.20\\text{ ns}$ | $0.0\\text{ ns}$ | 0 (MET) |
| **in2out** | $-2.80\\text{ ns}$ | $-120.0\\text{ ns}$ | 400 |

- **Question (a): What is chip setup WNS roughly?**
  - **Answer**: Chip WNS is dominated by the worst violating group: $\\mathbf{-2.80\\text{ ns}}$!
- **Question (b): Where do you spend your first day?**
  - **Answer**: **I/O pad architecture, external SDC delay budgets, and chip boundary pipelining.** You do NOT spend time retiming ALU registers or running high-effort core optimization!
- **Question (c): Name 5 INVALID first moves that signal poor engineering:**
  1. Increasing \`syn_opt\` optimization effort on core logic.
  2. Applying blanket \`set_false_path -from [all_inputs] -to [all_outputs]\` to hide violations.
  3. Tightening clock uncertainty to artificially force green slack.
  4. Ignoring pad cell delays in \`report_timing\`.
  5. Applying multicycle paths across all I/O without protocol handshaking proof.

#### E2. The Physics Proof: Can Upsizing Core Gates Fix E1?
- **Given**: Input pad arc $= 0.70\\text{ ns}$, core logic $= 0.30\\text{ ns}$, output pad arc $= 1.40\\text{ ns}$, external I/O delays $= 0.40\\text{ ns}$ total, period $= 2.00\\text{ ns}$.
- **Calculation**: Even if core delay is completely eliminated ($T_{\\text{core}} \\to 0\\text{ ps}$):
  $$T_{\\text{arr}} \\ge 0.40 + 0.70 + 0.00 + 1.40 = 2.50\\text{ ns} > T_{\\text{req}} \\approx 2.00\\text{ ns}$$
- **Conclusion**: **NO.** This is a structural interface and period problem. Sizing core cells cannot fix pad physics!

---

### 2. Problem Set G: 30-Second Rapid-Fire Calculations:

| # | Rapid-Fire Prompt | Instant Mental Math Formulation | Answer |
| :--- | :--- | :--- | :--- |
| **G1** | Period $1.0$, path $0.7$, $T_{\\text{su}} + T_{\\text{unc}} = 0.1$, ideal — setup slack? | $S = 1.0 - 0.1 - 0.7$ | $\\mathbf{+0.20\\text{ ns}}$ |
| **G2** | Add launch latency $0.15\\text{ ns}$ late only — new slack? | Arrival increases by $+0.15$: $0.20 - 0.15$ | $\\mathbf{+0.05\\text{ ns}}$ |
| **G3** | $T_{\\text{i\\_del}}^{\\max} = 0.3$, combo $0.4$, period $1.0$, $T_{\\text{su}} + T_{\\text{unc}} = 0.1$ — I2R slack? | $T_{\\text{arr}} = 0.7, T_{\\text{req}} = 0.9 \\implies 0.9 - 0.7$ | $\\mathbf{+0.20\\text{ ns}}$ |
| **G4** | $T_{\\text{o\\_del}}^{\\max} = 0.3$, $T_{\\text{co}} + T_{\\text{dp}} = 0.4$, period $1.0$, $T_{\\text{unc}} = 0.05$ — R2O slack? | $T_{\\text{arr}} = 0.4, T_{\\text{req}} = 1.0 - 0.3 - 0.05 = 0.65 \\implies 0.65 - 0.4$ | $\\mathbf{+0.25\\text{ ns}}$ |
| **G5** | Hold: $T_{\\text{arr}}^{\\min} = 0.15$, $T_h + T_{\\text{unc}} = 0.20$ — hold slack? | $S_h = 0.15 - 0.20$ | $\\mathbf{-0.05\\text{ ns}}$ |
| **G6** | MCP setup 3, period $1.0$, path $1.2$, $T_{\\text{su}} + T_{\\text{unc}} = 0.1$ — slack? | $T_{\\text{req}} = 3.0 - 0.1 = 2.9 \\implies 2.9 - 1.2$ | $\\mathbf{+1.70\\text{ ns}}$ |
| **G7** | Half cycle $0.50\\text{ ns}$ window, path $0.40$, $T_{\\text{su}} + T_{\\text{unc}} = 0.08$ — slack? | $T_{\\text{req}} = 0.50 - 0.08 = 0.42 \\implies 0.42 - 0.40$ | $\\mathbf{+0.02\\text{ ns}}$ |
| **G8** | Max output_delay increases by $+0.07\\text{ ns}$ — effect on setup slack? | Required drops by $0.07\\text{ ns}$ | **Decreases by 0.07 ns** |
| **G9** | Max input_delay increases by $+0.07\\text{ ns}$ — effect on setup slack? | Arrival increases by $0.07\\text{ ns}$ | **Decreases by 0.07 ns** |
| **G10** | I2O path arrival $3.0\\text{ ns}$, required $2.1\\text{ ns}$ — slack? | $S = 2.1 - 3.0$ | $\\mathbf{-0.90\\text{ ns}}$ |

---

### 3. Whiteboard Drill Checklist (Audit Before Entering Interview):
- [x] **Draw Clock Edges**: Draw launch edge ($0$), capture edge ($1T$) for single-cycle, ($2T$) for MCP setup 2, and ($0.5T$) for half-cycle.
- [x] **Point to Delay Allocations**: State clearly that \`set_input_delay\` enters Data Arrival, while \`set_output_delay\` enters Data Required.
- [x] **State Corner & Skew Directions**: Setup uses late launch / early capture at slow-cold corner; Hold uses early launch / late capture at fast-hot corner.
- [x] **Explain Dual Form of Output Delay**: Prove $T_{\\text{clk}} - T_{\\text{odel}} - T_{\\text{arr}} = T_{\\text{clk}} - (T_{\\text{arr}} + T_{\\text{odel}})$ without altering slack.
- [x] **Separate Path Group Diagnosis from Chip WNS**: Isolate reg2reg from in2out before proposing engineering fixes.
- [x] **Name Invalid Exception Strategies**: Articulate why blanket false paths on I/O ports destroy verification integrity.`,
    tclOrVerilogSnippet: {
      lang: "tcl",
      code: `# Complete Production Path Group Definition & Reporting Script:

# 1. Define Dedicated Cost Groups:
define_cost_group -name R2R -design pad_top
define_cost_group -name I2R -design pad_top
define_cost_group -name R2O -design pad_top
define_cost_group -name I2O -design pad_top

# 2. Partition Timing Paths by Topology:
path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r
path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o

# 3. Report QoR Breakdown by Cost Group:
report_qor > reports/qor_cost_groups.rpt

# 4. Generate Top Violators per Path Group:
report_timing -group I2O -max_paths 5 > reports/timing_i2o_violations.rpt
report_timing -group R2R -max_paths 5 > reports/timing_r2r_clean.rpt`,
    },
    commonPitfalls: [
      "Spending days optimizing core ALU logic when chip WNS is dominated by an external I2O pad path.",
      "Taking more than 30 seconds to solve basic setup/hold slack equations on a technical interview whiteboard.",
      "Failing to recognize that increasing input delay and output delay degrade setup slack by the exact same mathematical delta.",
    ],
    interviewerFollowups: [
      "How do multi-corner multi-mode (MMMC) scenarios affect path group weights during physical optimization?",
      "Why can a path report negative slack in report_timing while report_qor reports passing WNS for the parent group?",
    ],
    tags: ["sta", "qor-triage", "rapid-fire", "whiteboard-checklist", "story-problems", "interview-prep"],
  },
  ...ADDITIONAL_INTERVIEW_QUESTIONS,
];


