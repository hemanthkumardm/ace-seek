export interface ScenarioOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface MetricItem {
  label: string;
  val: string;
  bad: boolean;
}

export interface SynthesisScenario {
  id: number;
  domainId: string;
  domainName: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  stageName: string;
  symptom: string;
  logSnippet: string;
  principle: string;
  remedyTcl: string;
  beforeMetrics: MetricItem[];
  afterMetrics: MetricItem[];
  options: ScenarioOption[];
}

export interface ScenarioDomain {
  id: string;
  name: string;
  shortName: string;
  description: string;
  iconName: string;
}

export const SYNTHESIS_DOMAINS: ScenarioDomain[] = [
  {
    id: "check_design",
    name: "RTL Linting, Elaboration & Design Integrity",
    shortName: "Design Lint & Integrity",
    description: "Audit unclocked feedback loops, pruned constant flops, undriven/multidriven pins, and inferred latches.",
    iconName: "CheckSquare",
  },
  {
    id: "timing_lint",
    name: "SDC Timing Intent & Constraint Auditing",
    shortName: "SDC Timing Intent",
    description: "Resolve unconstrained asynchronous clock domains, multicycle hold errors, and unbudgeted I/O ports.",
    iconName: "Clock",
  },
  {
    id: "setup_closure",
    name: "Setup & Timing Closure Optimization",
    shortName: "Setup & Timing Closure",
    description: "Fix path masking, wire correlation mismatches, arithmetic datapath bottlenecks, and MMMC corner conflicts.",
    iconName: "Activity",
  },
  {
    id: "retiming",
    name: "Sequential Retiming & Pipelining Optimization",
    shortName: "Retiming & Pipelining",
    description: "Balance high-speed pipeline stages, unblock hierarchy barriers, and resolve async reset retiming locks.",
    iconName: "GitPullRequest",
  },
  {
    id: "dft_power",
    name: "Low-Power (UPF/CPF) & Clock Gating (ICG)",
    shortName: "Low-Power & ICG",
    description: "Diagnose clock gating hazards, isolation cells, level shifters, and multi-Vth leakage power recovery.",
    iconName: "Zap",
  },
  {
    id: "dft_scan",
    name: "Design-for-Test (DFT) & Scan Insertion DRC",
    shortName: "DFT & Scan Chain DRC",
    description: "Triage uncontrolled async resets during shift, non-scan elements, MBIST collars, and ATPG coverage.",
    iconName: "ShieldAlert",
  },
  {
    id: "lec_signoff",
    name: "Logic Equivalence Checking (LEC) & Signoff",
    shortName: "LEC & Signoff Handoff",
    description: "Debug Conformal non-equivalences, pin-swapping aborts, assign nets, and formal verification dofiles.",
    iconName: "Layers",
  },
];

export const SYNTHESIS_SCENARIOS: SynthesisScenario[] = [
  // =========================================================================
  // DOMAIN 1: RTL LINTING, ELABORATION & DESIGN INTEGRITY (10 Scenarios)
  // =========================================================================
  {
    id: 0,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Disappearing Configuration Registers (0% ATPG Scan Coverage)",
    severity: "CRITICAL",
    stageName: "Post-Elaboration / syn_generic",
    symptom: "Post-synthesis ATPG testbench reports 0% fault coverage because 64 static configuration registers were pruned from the gate netlist!",
    logSnippet: `[GENUS-OPT-102] Register 'cfg_reg_0' input D is tied to constant 1'b0 -> Deleting instance and tying Q to GND.
[GENUS-OPT-102] Register 'cfg_reg_1' input D is tied to constant 1'b0 -> Deleting instance and tying Q to GND.
[GENUS-OPT] Total registers eliminated: 64. Scan chain insertion failed: zero flops available in block.`,
    principle: "By default, synthesis optimizers perform constant propagation and prune constant registers. Configuration registers, security keys, and spare flops must be explicitly protected from deletion.",
    remedyTcl: `set_db optimize_constant_0_flops false
set_db optimize_constant_1_flops false
set_db delete_unloaded_insts false
set_db exact_match_seq_sync_ctrls true`,
    beforeMetrics: [
      { label: "ATPG Scan Coverage", val: "0.0%", bad: true },
      { label: "Config Flops in Netlist", val: "0 / 64", bad: true },
      { label: "Post-Silicon Tuning", val: "BROKEN", bad: true },
    ],
    afterMetrics: [
      { label: "ATPG Scan Coverage", val: "99.4%", bad: false },
      { label: "Config Flops in Netlist", val: "64 / 64", bad: false },
      { label: "Post-Silicon Tuning", val: "PRESERVED", bad: false },
    ],
    options: [
      {
        id: "opt_const_false",
        label: "Set 'optimize_constant_0_flops false', 'optimize_constant_1_flops false', and 'delete_unloaded_insts false'",
        correct: true,
        explanation: "Correct! Disabling constant flop pruning preserves all 64 configuration registers for scan chain insertion and post-silicon firmware tuning.",
      },
      {
        id: "opt_ungroup",
        label: "Run 'set_db auto_ungroup both' to flatten all submodule hierarchies",
        correct: false,
        explanation: "Flattening hierarchy does not stop the optimizer from deleting constant registers.",
      },
      {
        id: "opt_retime",
        label: "Enable sequential retiming with 'set_db retime_effort high'",
        correct: false,
        explanation: "Retiming moves registers across logic gates; it cannot recover deleted constant flops.",
      },
    ],
  },
  {
    id: 1,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Combinational Feedback Loop Deadlock (CHECK-DESIGN-101)",
    severity: "CRITICAL",
    stageName: "Early Audit / check_design",
    symptom: "Static timing analysis enters infinite recursion and timing reports fail due to an unclocked combinational loop inside the arbiter module.",
    logSnippet: `[CHECK-DESIGN-101] Warning: Combinational loop detected in hierarchy 'soc_top/arbiter_unit':
  Pin 'u_arb/mux_stage_1/A' -> 'u_arb/mux_stage_1/Y'
  Pin 'u_arb/logic_gate_b/IN0' -> 'u_arb/logic_gate_b/OUT'
  Pin 'u_arb/feedback_net' -> 'u_arb/mux_stage_1/A' (Loop closed!)
[TIMING-008] Error: Infinite timing path graph detected. Disabling path arc.`,
    principle: "Combinational loops cause race conditions and make static timing analysis impossible. They must be broken by inserting a pipeline register or restructuring boolean equations in RTL.",
    remedyTcl: `check_design -unresolved
report_loops -design soc_top
# Fix: Refactor RTL to insert synchronizing flip-flop stage or break unclocked loop dependency`,
    beforeMetrics: [
      { label: "Combinational Loops", val: "1 Active Loop", bad: true },
      { label: "Static Timing Signoff", val: "FAILED (Cyclic)", bad: true },
      { label: "Silicon Stability", val: "OSCILLATING", bad: true },
    ],
    afterMetrics: [
      { label: "Combinational Loops", val: "0 Loops ✓", bad: false },
      { label: "Static Timing Signoff", val: "CLEAN (Acyclic)", bad: false },
      { label: "Silicon Stability", val: "GLITCH-FREE", bad: false },
    ],
    options: [
      {
        id: "opt_loop_flop",
        label: "Break the combinational loop in RTL by inserting a clocked register stage or resolving the unclocked mux dependency",
        correct: true,
        explanation: "Correct! Inserting a register breaks the feedback loop into two clean synchronous register-to-register paths with deterministic timing.",
      },
      {
        id: "opt_set_dont_touch",
        label: "Apply 'set_dont_touch' on the feedback net to silence the error",
        correct: false,
        explanation: "Setting dont_touch hides the net from optimization but does not resolve physical oscillation.",
      },
      {
        id: "opt_set_false_path",
        label: "Set 'set_false_path' across the loop",
        correct: false,
        explanation: "False pathing an active feedback loop creates unverified silicon and timing anomalies.",
      },
    ],
  },
  {
    id: 2,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Floating Undriven Inputs & Multidriven Bus Contention",
    severity: "HIGH",
    stageName: "Elaboration / check_design",
    symptom: "Submodule data bus pins are left unconnected, causing CMOS gates to float midway between 0 and VDD, causing severe dynamic shoot-through crowbar leakage.",
    logSnippet: `[CHECK-DESIGN-204] Error: Undriven input pins detected in 'soc_top/core_0':
  Pin 'dsp_data_in[7:0]' has no driver.
[CHECK-DESIGN-205] Error: Multidriven net 'shared_status_bus' driven by 2 push-pull drivers:
  Driver 1: u_uart/tx_ready (output)
  Driver 2: u_spi/ready_out (output)`,
    principle: "Floating inputs cause transistors to conduct simultaneously (crowbar current) and cause erratic logic states. Multidriven nets create short circuits on silicon unless tri-state drivers or multiplexers are used.",
    remedyTcl: `check_design -unresolved
set_db remove_assigns true
set_db use_tiehilo_for_const duplicate
# Ensure all submodule ports are explicitly tied to TIELOW / TIEHIGH or valid nets`,
    beforeMetrics: [
      { label: "Undriven Pins", val: "8 Floating Pins", bad: true },
      { label: "Multidriven Nets", val: "1 Short-Circuit", bad: true },
      { label: "Quiescent Leakage", val: "+340% Crowbar", bad: true },
    ],
    afterMetrics: [
      { label: "Undriven Pins", val: "0 (Tied to TIELOW) ✓", bad: false },
      { label: "Multidriven Nets", val: "0 (Muxed) ✓", bad: false },
      { label: "Quiescent Leakage", val: "Nominal 14.2 mW", bad: false },
    ],
    options: [
      {
        id: "opt_tie_fix",
        label: "Connect floating ports to dedicated Tie-High/Tie-Low cells and replace multidriven nets with an explicit multiplexer",
        correct: true,
        explanation: "Correct! Tying floating inputs to dedicated tie cells prevents crowbar leakage, and multiplexing eliminates bus contention shorts.",
      },
      {
        id: "opt_ignore_drc",
        label: "Allow the tool to tie floating inputs directly to VDD/VSS power rails with 1'b1/1'b0",
        correct: false,
        explanation: "Connecting gate inputs directly to power rails without ESD/tie-cells violates foundry DRC antenna and ESD rules.",
      },
      {
        id: "opt_wlm",
        label: "Enable statistical wire-load models",
        correct: false,
        explanation: "Wire-load models have no effect on pin connectivity.",
      },
    ],
  },
  {
    id: 3,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Unintended Inferred Latches from Incomplete Case Statements",
    severity: "HIGH",
    stageName: "Elaboration / RTL Compilation",
    symptom: "FSM state decoder infers 16 transparent latches instead of pure combinational logic, causing severe timing violations and testability failures.",
    logSnippet: `[ELAB-LATCH-01] Warning: Inferred transparent latch for variable 'next_state' in module 'fsm_controller':
  Latch enable condition: 'state == 3'b010'
[GENUS-OPT] Inferred level-sensitive latch cell 'LATPQX1' inserted. STA time borrowing enabled.`,
    principle: "Incomplete `if-else` branches or missing `default` clauses in combinational `always_comb` / `always @(*)` blocks cause synthesis tools to infer latches to preserve previous state values.",
    remedyTcl: `set_db check_latch true
# In RTL: Add default branch to case statement:
# default: next_state = IDLE;
# Or assign default values at top of always_comb block`,
    beforeMetrics: [
      { label: "Inferred Latches", val: "16 Latches", bad: true },
      { label: "Hold Time Violations", val: "-420 ps (Borrow)", bad: true },
      { label: "ATPG Testability", val: "DEGRADED", bad: true },
    ],
    afterMetrics: [
      { label: "Inferred Latches", val: "0 Latches ✓", bad: false },
      { label: "Hold Time Violations", val: "0 ps (Clean)", bad: false },
      { label: "ATPG Testability", val: "100% Fully Scan", bad: false },
    ],
    options: [
      {
        id: "opt_default_case",
        label: "Add a default case or initialize variables at the beginning of the combinational always block in RTL",
        correct: true,
        explanation: "Correct! Ensuring all output variables are assigned under every branch condition prevents unintended transparent latch inferencing.",
      },
      {
        id: "opt_latch_dly",
        label: "Insert delay cells on the latch enable pin",
        correct: false,
        explanation: "Adding delay cells does not eliminate inferred latches.",
      },
      {
        id: "opt_disable_latch_check",
        label: "Disable the check_latch attribute in Genus",
        correct: false,
        explanation: "Silencing the warning does not remove physical latches from silicon.",
      },
    ],
  },
  {
    id: 4,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Unresolved Blackbox Submodules & Missing Hard IP LEF/Libs",
    severity: "CRITICAL",
    stageName: "read_mmmc / elaborate",
    symptom: "Elaboration treats 4 Dual-Port SRAM macros as empty blackboxes with 0 delay and floating pins, breaking chip synthesis.",
    logSnippet: `[ELAB-BBOX-04] Warning: Unresolved module 'sram_256kb_dp' instantiated in 'soc_top/mem_subsys':
  Module definition not found in RTL source or target Liberty libraries.
[GENUS-OPT] Blackbox shell created. Internal timing and pin capacitances will be ignored.`,
    principle: "Blackbox modules prevent the synthesis tool from checking timing arcs, pin loads, and power intent. Hard IP (SRAMs, PLLs, SERDES) must have both Liberty (.lib) and physical LEF files loaded during MMMC setup.",
    remedyTcl: `read_mmmc mmmc_config.tcl
read_physical -lef { ./tech/tech.lef ./libs/stdcells.lef ./libs/sram_256kb.lef }
# Ensure sram_256kb.lib is listed under create_library_set in mmmc_config.tcl`,
    beforeMetrics: [
      { label: "Blackbox Instances", val: "4 Blackboxes", bad: true },
      { label: "Memory Interface Timing", val: "UNVERIFIED", bad: true },
      { label: "Post-Layout Signoff", val: "FATAL MISMATCH", bad: true },
    ],
    afterMetrics: [
      { label: "Blackbox Instances", val: "0 (Resolved) ✓", bad: false },
      { label: "Memory Interface Timing", val: "ACCURATE LIB/LEF ✓", bad: false },
      { label: "Post-Layout Signoff", val: "100% MATCH", bad: false },
    ],
    options: [
      {
        id: "opt_load_macro_libs",
        label: "Include macro Liberty (.lib) models in create_library_set and physical macro LEF in read_physical",
        correct: true,
        explanation: "Correct! Providing both logical .lib and physical LEF views allows Genus to accurately constrain and place macro boundary pins.",
      },
      {
        id: "opt_ignore_bbox",
        label: "Set 'set_db auto_ungroup both' to dissolve the blackbox shells",
        correct: false,
        explanation: "Ungrouping cannot resolve missing transistor models.",
      },
      {
        id: "opt_stub_rtl",
        label: "Replace the SRAM with a Verilog behavioral register array",
        correct: false,
        explanation: "Register arrays cannot match custom high-density SRAM silicon layout or sense amplifier timing.",
      },
    ],
  },
  {
    id: 5,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Assign Statement Net Aliasing in Gate Netlist (LVS Hazard)",
    severity: "HIGH",
    stageName: "write_hdl / Downstream P&R Handoff",
    symptom: "Innovus P&R router fails LVS physical verification because raw Verilog 'assign' statements create multiple aliased wire names for the same net.",
    logSnippet: `[WRITE-HDL-08] Warning: Output netlist contains 142 continuous assign statements:
  assign wire_b = wire_a;
[INNOVUS-LVS] Error: Net alias 'wire_b' shorted to 'wire_a'. Multiple driver names mapped to single physical metal shape.`,
    principle: "Physical place-and-route tools and LVS signoff checkers require distinct structural standard cells (buffers or inverters) rather than symbolic Verilog wire assignments.",
    remedyTcl: `set_remove_assign_options -include_local_constant_assign -buffer_or_inverter
set_db remove_assigns true
write_hdl -language v2001 > outputs/soc_top_netlist.v`,
    beforeMetrics: [
      { label: "Assign Statements in Netlist", val: "142 Assigns", bad: true },
      { label: "LVS Physical Signoff", val: "FAILED (Shorts)", bad: true },
      { label: "Cadence Innovus Routing", val: "ALIAS ERRORS", bad: true },
    ],
    afterMetrics: [
      { label: "Assign Statements in Netlist", val: "0 Assigns ✓", bad: false },
      { label: "LVS Physical Signoff", val: "CLEAN 100% ✓", bad: false },
      { label: "Cadence Innovus Routing", val: "CLEAN NETLIST", bad: false },
    ],
    options: [
      {
        id: "opt_remove_assigns",
        label: "Configure 'set_db remove_assigns true' and 'set_remove_assign_options -buffer_or_inverter' before writing netlist",
        correct: true,
        explanation: "Correct! `remove_assigns true` replaces all assign statements with real physical buffer cells, preventing LVS aliasing bugs.",
      },
      {
        id: "opt_ignore_lvs",
        label: "Suppress LVS net alias warnings in Innovus",
        correct: false,
        explanation: "Suppressing LVS warnings creates fatal physical short circuits in silicon masks.",
      },
      {
        id: "opt_switch_vhdl",
        label: "Export netlist in VHDL-1993 format",
        correct: false,
        explanation: "Changing format does not eliminate physical net name aliasing.",
      },
    ],
  },
  {
    id: 6,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Bit-Width Truncation & Sign-Extension Overflow in Multipliers",
    severity: "MEDIUM",
    stageName: "Elaboration / Datapath Inferencing",
    symptom: "Hardware arithmetic result is silently truncated from 32-bit to 16-bit, producing catastrophic calculation errors in DSP pipelines.",
    logSnippet: `[ELAB-TRUNC-03] Warning: Truncation of assignment: 32-bit expression assigned to 16-bit target 'acc_out[15:0]':
  Expression: 'reg_a * reg_b' (32-bit product) -> Target: 'acc_out' (16-bit)
[GENUS-OPT] Upper 16 bits of datapath multiplier unmapped and deleted.`,
    principle: "RTL bit-width mismatches result in synthesis compilers pruning upper bit logic slices, permanently destroying numerical precision in arithmetic blocks.",
    remedyTcl: `check_design -lint
# Fix RTL target bus width to match product:
# logic [31:0] acc_out;
# assign acc_out = reg_a * reg_b;`,
    beforeMetrics: [
      { label: "Arithmetic Precision", val: "16-Bit (Truncated)", bad: true },
      { label: "DSP Calculation Error", val: "SEVERE OVERFLOW", bad: true },
      { label: "Hardware Sanity", val: "LINT VIOLATION", bad: true },
    ],
    afterMetrics: [
      { label: "Arithmetic Precision", val: "32-Bit Full Precision ✓", bad: false },
      { label: "DSP Calculation Error", val: "0.0% Error ✓", bad: false },
      { label: "Hardware Sanity", val: "LINT CLEAN ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fix_width",
        label: "Fix the RTL target register bus width to match the full 32-bit multiplication product",
        correct: true,
        explanation: "Correct! Sizing the target bus width properly preserves all upper bits and allows full Booth multiplier optimization.",
      },
      {
        id: "opt_set_dont_touch_trunc",
        label: "Apply 'set_dont_touch' to the truncated 16-bit wire",
        correct: false,
        explanation: "dont_touch cannot create hardware pins that don't exist in RTL.",
      },
      {
        id: "opt_wlm_arith",
        label: "Change the synthesis cost group",
        correct: false,
        explanation: "Cost groups do not fix RTL functional truncation bugs.",
      },
    ],
  },
  {
    id: 7,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Unpreserved Spare Gate ECO Modules Pruned by Optimizer",
    severity: "HIGH",
    stageName: "syn_opt / Area Recovery",
    symptom: "All 200 instantiated spare gates (NAND, NOR, DFFs) intended for post-mask silicon ECOs were deleted during synthesis area recovery!",
    logSnippet: `[GENUS-OPT-104] Instance 'u_spare_0/spare_nand_0' has no active load pins -> Deleting instance.
[GENUS-OPT-104] Instance 'u_spare_0/spare_dff_0' has no active load pins -> Deleting instance.
...
[GENUS-OPT] 200 unloaded spare gates eliminated to minimize cell area.`,
    principle: "Spare gates are unconnected standard cells placed in the layout for future metal-only engineering change orders (ECOs). Synthesis tools will delete them as 'unloaded logic' unless `delete_unloaded_insts false` and `dont_touch` are applied.",
    remedyTcl: `set_db delete_unloaded_insts false
set_db [get_db modules spare_gate_bank] .dont_touch true
set_dont_touch [get_cells u_spare_block/*]`,
    beforeMetrics: [
      { label: "Spare Cells in Netlist", val: "0 / 200 (Deleted)", bad: true },
      { label: "Post-Silicon ECO Capability", val: "IMPOSSIBLE ($2M Mask Re-spin)", bad: true },
      { label: "Area Savings", val: "0.2% (Trivial)", bad: true },
    ],
    afterMetrics: [
      { label: "Spare Cells in Netlist", val: "200 / 200 Preserved ✓", bad: false },
      { label: "Post-Silicon ECO Capability", val: "READY FOR METAL ECO ✓", bad: false },
      { label: "Area Overhead", val: "Nominal 0.2%", bad: false },
    ],
    options: [
      {
        id: "opt_spare_preserve",
        label: "Set 'set_db delete_unloaded_insts false' and apply 'dont_touch' to the spare gate hierarchy",
        correct: true,
        explanation: "Correct! Disabling unloaded instance deletion and protecting the spare module ensures all spare cells pass untouched into P&R.",
      },
      {
        id: "opt_tie_spare_vdd",
        label: "Tie all spare gate outputs to VDD",
        correct: false,
        explanation: "Tying gate outputs directly to VDD causes a power short circuit.",
      },
      {
        id: "opt_ungroup_spare",
        label: "Ungroup the spare gate module",
        correct: false,
        explanation: "Ungrouping makes it even easier for the optimizer to dissolve unloaded gates.",
      },
    ],
  },
  {
    id: 8,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Tri-State Driver Internal Contention on Shared On-Chip Buses",
    severity: "CRITICAL",
    stageName: "syn_generic / Technology Mapping",
    symptom: "Internal SoC on-chip bus uses tri-state buffers (BUFT) instead of multiplexers, creating silicon bus float and contention hazards.",
    logSnippet: `[GENUS-MAP-08] Warning: Internal tri-state net 'internal_mem_bus[31:0]' detected:
  Found 4 tri-state drivers ('u_core0/tbuf', 'u_core1/tbuf', ...).
[GENUS-MAP-08] Internal tri-states are prohibited in ASIC cell libraries below 90nm nodes.`,
    principle: "Internal tri-state buses cause floating nets during bus turnaround and high contention currents when multiple drivers overlap. Modern ASICs must convert internal tri-states into boolean multiplexer trees (`set_db use_mux_for_tristate true`).",
    remedyTcl: `set_db use_mux_for_tristate true
check_design -unresolved
syn_generic`,
    beforeMetrics: [
      { label: "Internal Tri-State Nets", val: "32 Nets", bad: true },
      { label: "Foundry DRC Compliance", val: "NON-COMPLIANT", bad: true },
      { label: "Floating Bus Leakage", val: "+80 mW Surge", bad: true },
    ],
    afterMetrics: [
      { label: "Internal Tri-State Nets", val: "0 (Converted to Mux) ✓", bad: false },
      { label: "Foundry DRC Compliance", val: "100% ASIC COMPLIANT ✓", bad: false },
      { label: "Floating Bus Leakage", val: "0.0 mW ✓", bad: false },
    ],
    options: [
      {
        id: "opt_tristate_mux",
        label: "Enable automatic tri-state to multiplexer conversion: 'set_db use_mux_for_tristate true'",
        correct: true,
        explanation: "Correct! Genus automatically converts internal bidirectional/tri-state buses into robust, deterministic AND-OR / MUX logic trees.",
      },
      {
        id: "opt_pullup_resistors",
        label: "Insert pull-up resistors on the internal bus",
        correct: false,
        explanation: "On-chip pull-up resistors consume huge silicon area and do not prevent driver contention.",
      },
      {
        id: "opt_set_dont_touch_tbuf",
        label: "Set 'dont_touch' on the tri-state buffers",
        correct: false,
        explanation: "dont_touch forces non-compliant tri-state cells into the physical layout.",
      },
    ],
  },
  {
    id: 9,
    domainId: "check_design",
    domainName: "Design Lint & Integrity",
    title: "Missing Asynchronous Reset Synchronizers in Clock Reset Tree",
    severity: "HIGH",
    stageName: "RTL Audit / check_design",
    symptom: "Chip enters random deadlock states when waking up from power-on reset due to reset removal timing violations.",
    logSnippet: `[RDC-AUDIT-02] Warning: Asynchronous reset 'rst_ext_n' directly connects to register reset pins across multiple clock domains:
  Domain 'clk_core' (1.2 GHz): 14,200 flops
  Domain 'clk_pcie' (250 MHz): 3,800 flops
[RDC-AUDIT-02] No reset synchronizer detected. Reset de-assertion is asynchronous to clock.`,
    principle: "Asynchronous reset assertion can occur anytime, but reset DE-ASSERTION (removal) must be synchronized to the target clock domain to prevent flip-flops from entering metastability.",
    remedyTcl: `# Ingest reset synchronizer macro in RTL for each clock domain:
# always_ff @(posedge clk or negedge rst_async_n)
#   if (!rst_async_n) {sync_reg, rst_sync_n} <= 2'b00;
#   else              {sync_reg, rst_sync_n} <= {1'b1, sync_reg};
set_db exact_match_seq_sync_ctrls true`,
    beforeMetrics: [
      { label: "Reset Synchronizers", val: "0 (Direct Pin)", bad: true },
      { label: "Reset Removal Slack", val: "-850 ps (METASTABLE)", bad: true },
      { label: "Power-On Reliability", val: "RANDOM DEADLOCK", bad: true },
    ],
    afterMetrics: [
      { label: "Reset Synchronizers", val: "2-Stage Sync Tree ✓", bad: false },
      { label: "Reset Removal Slack", val: "+120 ps (MET) ✓", bad: false },
      { label: "Power-On Reliability", val: "DETERMINISTIC BOOT ✓", bad: false },
    ],
    options: [
      {
        id: "opt_rst_sync_tree",
        label: "Instantiate dedicated 2-flip-flop reset synchronizers for each independent clock domain in RTL",
        correct: true,
        explanation: "Correct! Dedicated reset synchronizers ensure asynchronous assertion with clean synchronous de-assertion, closing reset recovery/removal timing.",
      },
      {
        id: "opt_delay_reset",
        label: "Add 10 delay buffers to the reset line",
        correct: false,
        explanation: "Delay buffers increase reset latency without synchronizing reset de-assertion to clock edges.",
      },
      {
        id: "opt_false_path_rst",
        label: "Apply 'set_false_path -from [get_ports rst_ext_n]'",
        correct: false,
        explanation: "False-pathing reset removal causes metastability on silicon boot-up.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 2: SDC TIMING INTENT & CONSTRAINT AUDITING (10 Scenarios)
  // =========================================================================
  {
    id: 10,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Unconstrained Asynchronous Clock Domains (-12.5 ns False WNS)",
    severity: "CRITICAL",
    stageName: "check_timing_intent / SDC",
    symptom: "Synthesis reports massive -12.5 ns WNS setup failure between PCIe (250 MHz) and Core (1.2 GHz) clocks, wasting 95% runtime.",
    logSnippet: `[CHECK-TIMING-12] Warning: Cross-clock domain paths between 'clk_pcie_250m' and 'clk_core_1g2' have no relationship defined.
[REPORT-TIMING] Path 1: Launch 'clk_pcie_250m' (4.0 ns) -> Capture 'clk_core_1g2' (0.83 ns)
  Slack = -12.45 ns (FAILED)
[GENUS-OPT] Optimizer inserted 180 buffer repeaters trying to close 12.5 ns violation!`,
    principle: "Clocks generated from different PLLs have no deterministic phase relationship. If not declared asynchronous via `set_clock_groups -asynchronous`, synthesis will attempt impossible timing closure on CDC paths.",
    remedyTcl: `set_clock_groups -name cdc_async_domains -asynchronous \\
  -group [get_clocks clk_core_1g2] \\
  -group [get_clocks clk_pcie_250m] \\
  -group [get_clocks clk_spi_50m]`,
    beforeMetrics: [
      { label: "Global WNS", val: "-12.45 ns (CDC False)", bad: true },
      { label: "Synthesis Runtime", val: "4h 22m (Thrashing)", bad: true },
      { label: "Useless CDC Buffers", val: "180 Extra Gates", bad: true },
    ],
    afterMetrics: [
      { label: "Global WNS", val: "+25 ps (MET) ✓", bad: false },
      { label: "Synthesis Runtime", val: "18 mins ✓", bad: false },
      { label: "CDC Buffers", val: "0 (Clean CDC)", bad: false },
    ],
    options: [
      {
        id: "opt_clk_groups",
        label: "Define 'set_clock_groups -asynchronous -group [get_clocks clk_core_1g2] -group [get_clocks clk_pcie_250m]'",
        correct: true,
        explanation: "Correct! `set_clock_groups -asynchronous` informs the timing engine that these clocks have unrelated phases, disabling false cross-domain timing checks.",
      },
      {
        id: "opt_increase_period",
        label: "Increase the PCIe clock period to 20 ns to satisfy setup timing",
        correct: false,
        explanation: "Modifying functional clock frequency degrades hardware specs and does not solve asynchronous clock phase drift.",
      },
      {
        id: "opt_derate",
        label: "Apply OCV derating to the capture clock path",
        correct: false,
        explanation: "Derating adds margin to synchronous paths; it does not resolve asynchronous clock domain timing.",
      },
    ],
  },
  {
    id: 11,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Missing Hold Multicycle Constraint on Multi-Cycle Datapaths",
    severity: "HIGH",
    stageName: "check_timing_intent / Multi-cycle",
    symptom: "A 3-cycle iterative divider block has `set_multicycle_path 3 -setup`, but fails hold timing with severe -1.85 ns hold violations.",
    logSnippet: `[CHECK-TIMING-45] Warning: Setup multicycle multiplier path has N=3, but hold multiplier is default (0).
[REPORT-TIMING -HOLD] Launch: Cycle 0 (0.0 ns) -> Capture: Cycle 0 (0.0 ns)
  Hold Slack = -1.85 ns (FAILED - Tool assumes data must hold for previous cycle launch!)`,
    principle: "When `set_multicycle_path N -setup` is declared, EDA tools move setup capture forward by N cycles but leave hold edge at Cycle 0. You must always specify `set_multicycle_path (N-1) -hold`.",
    remedyTcl: `set_multicycle_path 3 -setup -from [get_pins u_div/reg_a_reg*/C] -to [get_pins u_div/reg_out_reg*/D]
set_multicycle_path 2 -hold  -from [get_pins u_div/reg_a_reg*/C] -to [get_pins u_div/reg_out_reg*/D]`,
    beforeMetrics: [
      { label: "Hold Slack (WNS)", val: "-1.85 ns", bad: true },
      { label: "Hold Delay Buffers Added", val: "240 Delay Cells", bad: true },
      { label: "Area Overhead", val: "+8.4%", bad: true },
    ],
    afterMetrics: [
      { label: "Hold Slack (WNS)", val: "+45 ps (MET) ✓", bad: false },
      { label: "Hold Delay Buffers Added", val: "0 Cells ✓", bad: false },
      { label: "Area Overhead", val: "0.0% ✓", bad: false },
    ],
    options: [
      {
        id: "opt_mcp_hold",
        label: "Add 'set_multicycle_path 2 -hold' (N-1 cycles) targeting the same path from-to pins",
        correct: true,
        explanation: "Correct! Specifying (N-1) hold cycles moves the hold check back to the active launch edge, preventing redundant delay buffer insertion.",
      },
      {
        id: "opt_del_cells",
        label: "Let Genus insert 240 delay buffers to meet the default hold check",
        correct: false,
        explanation: "Inserting hundreds of delay buffers wastes silicon area and dynamic power for a phantom hold violation.",
      },
      {
        id: "opt_disable_cg",
        label: "Disable clock gating on the divider block",
        correct: false,
        explanation: "Clock gating does not fix SDC multicycle hold edge alignment.",
      },
    ],
  },
  {
    id: 12,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Unconstrained Primary I/O Ports Causing Blind Synthesis",
    severity: "MEDIUM",
    stageName: "Early Audit / check_timing_intent",
    symptom: "Synthesis generates zero input buffers on 64 top-level GPIO pins because `set_input_delay` was omitted in SDC.",
    logSnippet: `[CHECK-TIMING-02] Warning: 64 input ports have no 'set_input_delay' defined:
  Ports: { gpio_data_in[63:0], spi_miso, uart_rxd }
[GENUS-OPT] Tool assumes external board arrival delay is 0.0 ps. Weakest X1 drive gates mapped at chip boundary.`,
    principle: "Without input and output delay constraints, synthesis tools budget zero time for external PCB trace delays, resulting in weak boundary gates that fail on real hardware.",
    remedyTcl: `set_input_delay -clock clk_core -max 1.2 [get_ports gpio_data_in*]
set_input_delay -clock clk_core -min 0.3 [get_ports gpio_data_in*]
set_output_delay -clock clk_core -max 1.0 [get_ports gpio_data_out*]
set_driving_cell -lib_cell BUFX4 [all_inputs]`,
    beforeMetrics: [
      { label: "Unconstrained I/O Ports", val: "64 Ports (Blind)", bad: true },
      { label: "Boundary Gate Drive Strength", val: "X1 (Underdriven)", bad: true },
      { label: "Post-Silicon Board Timing", val: "VIOLATION", bad: true },
    ],
    afterMetrics: [
      { label: "Unconstrained I/O Ports", val: "0 Ports ✓", bad: false },
      { label: "Boundary Gate Drive Strength", val: "X4 / X8 (Robust) ✓", bad: false },
      { label: "Post-Silicon Board Timing", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_io_budget",
        label: "Define 'set_input_delay' and 'set_output_delay' constraints along with 'set_driving_cell' for all interface pins",
        correct: true,
        explanation: "Correct! Constraining I/O delays ensures the optimizer inserts properly sized boundary buffers capable of handling board loads and external delays.",
      },
      {
        id: "opt_set_dont_touch_io",
        label: "Set 'set_dont_touch' on all top-level I/O ports",
        correct: false,
        explanation: "dont_touch prevents the tool from sizing boundary logic altogether.",
      },
      {
        id: "opt_flatten_io",
        label: "Ungroup all boundary I/O cells",
        correct: false,
        explanation: "Ungrouping does not create arrival time constraints.",
      },
    ],
  },
  {
    id: 13,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "False Path Applied to Synchronous Path (Masking Real Silicon Bug)",
    severity: "CRITICAL",
    stageName: "SDC Constraint Audit",
    symptom: "Engineers applied a blanket `set_false_path` to silence a timing error, masking a real -650 ps setup violation that escaped to silicon.",
    logSnippet: `[SDC-AUDIT-05] Critical: 'set_false_path -from [get_cells u_alu/reg_a*] -to [get_cells u_alu/reg_q*]'
[TIMING-CHECK] Synchronous functional path with common clock 'clk_core' is completely disabled from static timing analysis!`,
    principle: "False paths must ONLY be applied to physically non-functional paths (e.g. static configuration registers or asynchronous CDC synchronizers). Masking synchronous functional paths causes silicon failure.",
    remedyTcl: `# Remove erroneous false path from SDC
# remove_false_path -from [get_cells u_alu/reg_a*] -to [get_cells u_alu/reg_q*]
# Enable multi-stage datapath optimization or pipeline stage in RTL:
set_db opt_spatial_effort extreme
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Masked Critical Paths", val: "32 Hidden Paths", bad: true },
      { label: "Silicon Test Result", val: "CALCULATION CORRUPTION", bad: true },
      { label: "Timing Signoff Validity", val: "INVALID (Masked)", bad: true },
    ],
    afterMetrics: [
      { label: "Masked Critical Paths", val: "0 Masked Paths ✓", bad: false },
      { label: "Silicon Test Result", val: "100% OPERATIONAL ✓", bad: false },
      { label: "Timing Signoff Validity", val: "VERIFIED SIGN-OFF", bad: false },
    ],
    options: [
      {
        id: "opt_remove_fp",
        label: "Remove the false path constraint and fix timing through synthesis optimization or RTL pipelining",
        correct: true,
        explanation: "Correct! Never use false paths to sweep real timing violations under the rug; fix the underlying datapath delay.",
      },
      {
        id: "opt_add_more_fp",
        label: "Add false paths to all arithmetic registers",
        correct: false,
        explanation: "Disabling timing on arithmetic paths guarantees defective silicon.",
      },
      {
        id: "opt_wlm_fp",
        label: "Switch to wire-load models",
        correct: false,
        explanation: "Wire-load models do not validate false path correctness.",
      },
    ],
  },
  {
    id: 14,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Generated Clock Defined with Wrong Master Source Pin",
    severity: "HIGH",
    stageName: "check_timing_intent / create_generated_clock",
    symptom: "Clock divider output clock has 0 ps insertion delay because master pin was attached to an input port rather than PLL output pin.",
    logSnippet: `[CHECK-TIMING-33] Warning: Generated clock 'clk_div2' master pin 'u_pll/clk_out' has no path to specified master clock 'clk_pad':
[TIMING-REPORT] Clock latency on 'clk_div2' calculated as ideal 0.0 ps. Clock skew signoff invalidated.`,
    principle: "`create_generated_clock -source` must point to the immediate physical pin of the master clock driver (e.g. flip-flop Q pin or PLL out) so the tool accurately traces common clock tree insertion delays.",
    remedyTcl: `create_generated_clock -name clk_div2 \\
  -source [get_pins u_clk_div/div_flop_reg/C] \\
  -divide_by 2 [get_pins u_clk_div/div_flop_reg/Q]`,
    beforeMetrics: [
      { label: "Clock Tree Insertion Delay", val: "0.0 ps (Ideal/False)", bad: true },
      { label: "Clock Skew Calculation", val: "INVALIDATED", bad: true },
      { label: "Hold Time Violations", val: "-350 ps on Silicon", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Tree Insertion Delay", val: "420 ps (Traced) ✓", bad: false },
      { label: "Clock Skew Calculation", val: "PRECISE CTS SKEW ✓", bad: false },
      { label: "Hold Time Violations", val: "0 ps (Clean)", bad: false },
    ],
    options: [
      {
        id: "opt_gen_clk_source",
        label: "Correct the -source argument to point to the immediate driving clock pin [get_pins u_clk_div/div_flop_reg/C]",
        correct: true,
        explanation: "Correct! Specifying the direct physical clock pin allows Genus to trace upstream clock tree delay and compute accurate clock skew.",
      },
      {
        id: "opt_del_gen_clk",
        label: "Delete create_generated_clock and define it as create_clock",
        correct: false,
        explanation: "Defining derived clocks as primary create_clock breaks phase relationship and insertion delay tracking.",
      },
      {
        id: "opt_ideal_clk",
        label: "Set 'set_clock_latency 0' on all clocks",
        correct: false,
        explanation: "Zero latency hides real clock tree distribution delay.",
      },
    ],
  },
  {
    id: 15,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Missing Clock Uncertainty / Jitter Causing Over-Optimistic Hold",
    severity: "HIGH",
    stageName: "check_timing_intent / Timing Margining",
    symptom: "Post-silicon chips fail hold timing at fast corner (-40°C) because synthesis had 0 ps clock uncertainty budgeted.",
    logSnippet: `[CHECK-TIMING-08] Warning: Clock 'clk_core_1g2' has 0.0 ps clock uncertainty specified.
[GENUS-OPT] Zero setup jitter and zero hold margin applied during standard cell mapping.`,
    principle: "Pre-layout synthesis must include clock uncertainty to model PLL jitter, clock tree skew, and On-Chip Variation (OCV) derates. Without it, hold closure will fail in physical design.",
    remedyTcl: `set_clock_uncertainty -setup 0.080 [get_clocks clk_core_1g2]
set_clock_uncertainty -hold  0.030 [get_clocks clk_core_1g2]
set_clock_transition 0.050 [all_clocks]`,
    beforeMetrics: [
      { label: "Clock Uncertainty Setup", val: "0.0 ps (Unsafe)", bad: true },
      { label: "Clock Uncertainty Hold", val: "0.0 ps (Unsafe)", bad: true },
      { label: "Post-Route Hold Timing", val: "-120 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Uncertainty Setup", val: "80.0 ps (Safe) ✓", bad: false },
      { label: "Clock Uncertainty Hold", val: "30.0 ps (Safe) ✓", bad: false },
      { label: "Post-Route Hold Timing", val: "+25 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_clk_uncertainty",
        label: "Add 'set_clock_uncertainty -setup 80ps' and 'set_clock_uncertainty -hold 30ps' to all primary and generated clocks",
        correct: true,
        explanation: "Correct! Budgeting clock uncertainty provides necessary timing headroom for physical CTS skew and PLL jitter.",
      },
      {
        id: "opt_derate_only",
        label: "Rely solely on standard library delay without uncertainty",
        correct: false,
        explanation: "Library delays do not include dynamic PLL jitter or physical clock tree skew.",
      },
      {
        id: "opt_wlm_margin",
        label: "Double the wire load model capacitance",
        correct: false,
        explanation: "Increasing wire capacitance does not fix clock skew budgeting.",
      },
    ],
  },
  {
    id: 16,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Case Analysis Disabling Active Functional Operating Modes",
    severity: "CRITICAL",
    stageName: "check_timing_intent / set_case_analysis",
    symptom: "Synthesis optimizer stripped out the High-Speed Turbo Mode ALU datapath because `set_case_analysis 0` permanently locked test mode.",
    logSnippet: `[SDC-CASE-01] Critical: 'set_case_analysis 0 [get_ports turbo_mode_en]'
[GENUS-OPT] Constant propagation pruned 48,000 gates in Turbo ALU. Design synthesized in Low-Power Eco mode only!`,
    principle: "`set_case_analysis` forces constant logic values on pins, causing synthesis to prune all logic inactive under that condition. In Multi-Mode MMMC flows, operational modes must be separated into distinct constraint modes.",
    remedyTcl: `# Use MMMC constraint modes instead of static case analysis:
create_constraint_mode -name mode_turbo -sdc_files { constraints_turbo.sdc }
create_constraint_mode -name mode_eco   -sdc_files { constraints_eco.sdc }
# Bind constraint modes to analysis views in mmmc_config.tcl`,
    beforeMetrics: [
      { label: "Turbo Mode Functionality", val: "PRUNED (Deleted)", bad: true },
      { label: "MMMC Mode Coverage", val: "Single Mode Only", bad: true },
      { label: "Silicon Operating Frequencies", val: "Eco Only (500 MHz)", bad: true },
    ],
    afterMetrics: [
      { label: "Turbo Mode Functionality", val: "FULL HARDWARE 1.2 GHz ✓", bad: false },
      { label: "MMMC Mode Coverage", val: "Turbo + Eco Modes ✓", bad: false },
      { label: "Silicon Operating Frequencies", val: "Dual 1.2G / 500M ✓", bad: false },
    ],
    options: [
      {
        id: "opt_mmmc_modes",
        label: "Separate operational modes into distinct MMMC constraint modes ('mode_turbo' vs 'mode_eco') rather than static SDC case analysis",
        correct: true,
        explanation: "Correct! MMMC analysis views allow Genus to optimize across both Turbo and Eco modes simultaneously without deleting inactive logic.",
      },
      {
        id: "opt_dont_touch_all_case",
        label: "Set 'dont_touch' on all 48,000 gates",
        correct: false,
        explanation: "dont_touch prevents timing optimization and cell sizing.",
      },
      {
        id: "opt_ignore_case",
        label: "Remove SDC timing constraints entirely",
        correct: false,
        explanation: "Removing constraints causes blind unoptimized synthesis.",
      },
    ],
  },
  {
    id: 17,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Missing Maximum Transition Limits on Clock & Data Nets",
    severity: "HIGH",
    stageName: "check_timing_intent / DRC Limits",
    symptom: "Clock and high-fanout signals have slow 850 ps transition times, causing high short-circuit power and severe delay variability.",
    logSnippet: `[CHECK-TIMING-19] Warning: No 'max_transition' design rule constraint defined in SDC.
[GENUS-OPT] Signal slew on high-fanout net 'reg_bank_enable' calculated as 850 ps (Threshold: 200 ps).`,
    principle: "Excessive signal transition slew causes CMOS transistors to spend significant time in the linear region, increasing dynamic short-circuit power and timing uncertainty.",
    remedyTcl: `set_max_transition 0.200 [current_design]
set_max_transition -clock_path 0.100 [current_design]
set_max_capacitance 0.500 [current_design]`,
    beforeMetrics: [
      { label: "Max Data Slew", val: "850 ps (Sluggish)", bad: true },
      { label: "Max Clock Slew", val: "420 ps (Degraded)", bad: true },
      { label: "Short-Circuit Power", val: "+28.4 mW", bad: true },
    ],
    afterMetrics: [
      { label: "Max Data Slew", val: "185 ps (Crisp) ✓", bad: false },
      { label: "Max Clock Slew", val: "85 ps (Crisp) ✓", bad: false },
      { label: "Short-Circuit Power", val: "2.1 mW (-92%) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_max_trans_sdc",
        label: "Define 'set_max_transition 0.200 [current_design]' and 'set_max_transition -clock_path 0.100 [current_design]'",
        correct: true,
        explanation: "Correct! Specifying max transition limits forces Genus to insert properly sized buffer repeaters on slow high-fanout nets.",
      },
      {
        id: "opt_del_trans",
        label: "Increase the library nominal voltage to 1.8V",
        correct: false,
        explanation: "Over-volting standard cells causes oxide breakdown and violates technology limits.",
      },
      {
        id: "opt_wlm_trans",
        label: "Apply wire load models to buffer insertion",
        correct: false,
        explanation: "WLMs do not enforce design rule transition targets.",
      },
    ],
  },
  {
    id: 18,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Over-Constrained I/O Delays Consuming 100% of Clock Period",
    severity: "HIGH",
    stageName: "check_timing_intent / Budgeting",
    symptom: "Synthesis fails with -600 ps WNS on external bus because input delay (0.7 ns) + output delay (0.6 ns) exceeds the 1.0 ns clock cycle!",
    logSnippet: `[CHECK-TIMING-04] Error: I/O budget over-constrained:
  Clock period = 1.0 ns. Input delay = 0.70 ns. Output delay = 0.60 ns.
  Total external allocation = 1.30 ns. Internal ASIC budget = -0.30 ns!`,
    principle: "Input and output delays must reflect realistic PCB board trace budgets. If external delays exceed the cycle time, synthesis cannot close timing on register-to-I/O paths.",
    remedyTcl: `# Re-budget interface timing constraints:
set_input_delay  -clock clk_core -max 0.35 [get_ports data_in*]
set_output_delay -clock clk_core -max 0.35 [get_ports data_out*]`,
    beforeMetrics: [
      { label: "Internal Time Budget", val: "-0.30 ns (Impossible)", bad: true },
      { label: "WNS Violation", val: "-600 ps", bad: true },
      { label: "Optimizer Effort Wasted", val: "90% on I/O", bad: true },
    ],
    afterMetrics: [
      { label: "Internal Time Budget", val: "+0.30 ns (Feasible) ✓", bad: false },
      { label: "WNS Violation", val: "+20 ps (MET) ✓", bad: false },
      { label: "Optimizer Effort Wasted", val: "Balanced", bad: false },
    ],
    options: [
      {
        id: "opt_rebudget_io",
        label: "Re-budget input and output delays to reasonable fractions (e.g. 35% input, 35% output, 30% internal ASIC)",
        correct: true,
        explanation: "Correct! Re-budgeting creates a realistic timing envelope, allowing both external board interfaces and internal logic to close timing.",
      },
      {
        id: "opt_false_path_io_all",
        label: "Set false path on all input and output ports",
        correct: false,
        explanation: "False pathing I/O leaves boundary timing completely unverified.",
      },
      {
        id: "opt_flatten_io_budget",
        label: "Ungroup all boundary modules",
        correct: false,
        explanation: "Ungrouping does not alter mathematical SDC delay budgets.",
      },
    ],
  },
  {
    id: 19,
    domainId: "timing_lint",
    domainName: "SDC Timing Intent",
    title: "Incorrect Clock Sense Inversion on Gated Clock Multiplexers",
    severity: "MEDIUM",
    stageName: "check_timing_intent / Clock Trees",
    symptom: "Clock muxing logic inverts clock phase unintentionally, causing setup checks to be evaluated on half-cycle (416 ps) instead of full cycle.",
    logSnippet: `[TIMING-REPORT] Path: 'u_core/reg_a/C' (posedge) -> 'u_core/reg_b/C' (negedge)
  Requirement = 0.416 ns (Half Cycle Check!). Slack = -380 ps (FAILED).`,
    principle: "If clock multiplexers or clock inverter cells lack `set_clock_sense -positive` or proper SDC definition, STA evaluates timing on opposite edges, cutting available cycle time in half.",
    remedyTcl: `set_clock_sense -positive [get_pins u_clk_mux/mux_inst/Y]
# Or define separate generated clocks for posedge and negedge domains`,
    beforeMetrics: [
      { label: "Timing Check Type", val: "Half-Cycle (416 ps)", bad: true },
      { label: "Path Slack", val: "-380 ps (Failed)", bad: true },
      { label: "Clock Phase", val: "INVERTED", bad: true },
    ],
    afterMetrics: [
      { label: "Timing Check Type", val: "Full-Cycle (833 ps) ✓", bad: false },
      { label: "Path Slack", val: "+45 ps (MET) ✓", bad: false },
      { label: "Clock Phase", val: "ALIGNED POSITIVE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_clk_sense_pos",
        label: "Apply 'set_clock_sense -positive [get_pins u_clk_mux/mux_inst/Y]' to enforce positive non-inverting clock path propagation",
        correct: true,
        explanation: "Correct! Explicit clock sense ensures the static timing engine checks full-cycle setup paths between matching clock edges.",
      },
      {
        id: "opt_double_clk_period",
        label: "Double the primary clock period",
        correct: false,
        explanation: "Doubling the clock period halves product performance.",
      },
      {
        id: "opt_set_multicycle_2",
        label: "Apply set_multicycle_path 2 to all paths",
        correct: false,
        explanation: "Applying multicycle to single-cycle paths introduces functional race conditions.",
      },
    ],
  },
  // =========================================================================
  // DOMAIN 3: SETUP & TIMING CLOSURE OPTIMIZATION (10 Scenarios)
  // =========================================================================
  {
    id: 20,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Path Masking Starvation on Critical Core ALU Registers",
    severity: "CRITICAL",
    stageName: "syn_opt / Timing Optimization",
    symptom: "Core ALU 1.2 GHz critical paths have -750 ps setup violation, but the optimizer applied 0 buffers to R2R paths!",
    logSnippet: `Cost Group 'default': WNS = -1450 ps (Endpoint: board_spi_sdo_pad)
[GENUS-OPT] 100% of optimization effort applied to 'default' path group.
[GENUS-OPT] Path 'alu_reg_a -> alu_reg_q' (Slack: -750 ps) skipped due to worse global endpoint.
[GENUS-OPT] Core Register-to-Register WNS remains -750 ps (UNCLOSED).`,
    principle: "EDA optimizers prioritize paths based on the single Worst Negative Slack (WNS) in each cost group. If all paths share a single 'default' cost group, a single bad I/O pin will starve all internal core register-to-register paths.",
    remedyTcl: `define_cost_group -name I2R -design soc_top
define_cost_group -name R2O -design soc_top
define_cost_group -name R2R -design soc_top
define_cost_group -name I2O -design soc_top
path_group -view func_setup_view -from [all_inputs]    -to [all_registers] -group I2R
path_group -view func_setup_view -from [all_registers] -to [all_outputs]   -group R2O
path_group -view func_setup_view -from [all_registers] -to [all_registers] -group R2R
path_group -view func_setup_view -from [all_inputs]    -to [all_outputs]   -group I2O`,
    beforeMetrics: [
      { label: "Core R2R Slack", val: "-750 ps (Starved)", bad: true },
      { label: "Total Negative Slack", val: "-14,500 ps", bad: true },
      { label: "Path Grouping", val: "Single 'default'", bad: true },
    ],
    afterMetrics: [
      { label: "Core R2R Slack", val: "+25 ps (MET) ✓", bad: false },
      { label: "Total Negative Slack", val: "0 ps ✓", bad: false },
      { label: "Path Grouping", val: "I2R / R2R / R2O / I2O ✓", bad: false },
    ],
    options: [
      {
        id: "opt_cost_groups",
        label: "Partition paths into dedicated cost groups ('I2R', 'R2O', 'R2R', 'I2O') using 'define_cost_group' and 'path_group'",
        correct: true,
        explanation: "Correct! Dedicated cost groups force the synthesis engine to optimize the worst path in each group independently, ensuring core R2R paths close timing.",
      },
      {
        id: "opt_del_spi",
        label: "Delete the SPI pad from the RTL netlist",
        correct: false,
        explanation: "Deleting functional I/O pins breaks chip interfaces.",
      },
      {
        id: "opt_disable_mmmc",
        label: "Switch to single-corner synthesis",
        correct: false,
        explanation: "Single-corner synthesis does not address path masking.",
      },
    ],
  },
  {
    id: 21,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "WLM Wire Correlation Failure vs iSpatial Analytical Placement",
    severity: "HIGH",
    stageName: "Physical Synthesis / iSpatial",
    symptom: "Synthesis with statistical Wire Load Models (WLM) passed with +40 ps WNS, but Innovus post-route failed at -850 ps WNS!",
    logSnippet: `Genus Logical Synthesis (WLM Mode): WNS = +40 ps (PASSED)
Innovus Post-Route Timing (SPEF Mode): WNS = -850 ps (FAILED)
[CORRELATION-ERROR] Long interconnect wire resistance across 3.5mm floorplan dominated path delay by 78%. WLM estimated zero distance delay!`,
    principle: "In deep submicron and FinFET nodes (16nm/7nm/Sky130), interconnect wire RC dominates gate delay. Traditional statistical WLMs fail. Physical synthesis with iSpatial invokes embedded placement in memory to accurately model Steiner wire parasitics.",
    remedyTcl: `read_physical -lef { ./tech/tech.lef ./libs/stdcells.lef ./libs/macros.lef }
read_def inputs/floorplan.def
syn_generic -physical
syn_map -physical
set_db opt_spatial_effort extreme
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Synthesis vs P&R Correlation", val: "890 ps Mismatch", bad: true },
      { label: "Innovus Post-Route WNS", val: "-850 ps (FAILED)", bad: true },
      { label: "Wire Delay Accuracy", val: "Statistical Guess", bad: true },
    ],
    afterMetrics: [
      { label: "Synthesis vs P&R Correlation", val: "±15 ps Gap ✓", bad: false },
      { label: "Innovus Post-Route WNS", val: "+30 ps (MET) ✓", bad: false },
      { label: "Wire Delay Accuracy", val: "Physical Steiner Tree ✓", bad: false },
    ],
    options: [
      {
        id: "opt_ispatial_run",
        label: "Load floorplan DEF and run iSpatial physical synthesis ('syn_generic -physical', 'syn_map -physical', 'syn_opt -spatial')",
        correct: true,
        explanation: "Correct! iSpatial places cells during synthesis and computes accurate physical Steiner interconnect parasitics, eliminating the synthesis-to-P&R timing correlation gap.",
      },
      {
        id: "opt_custom_wlm",
        label: "Create a custom 100 fF wire-load model table",
        correct: false,
        explanation: "Statistical tables still cannot account for dynamic floorplan macro blockages or placement distances.",
      },
      {
        id: "opt_clock_slow",
        label: "Reduce target clock frequency from 1.2 GHz to 600 MHz",
        correct: false,
        explanation: "Halving clock frequency violates product performance specs.",
      },
    ],
  },
  {
    id: 22,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "High-Fanout Reset/Clock Slew Degradation (DRC max_transition)",
    severity: "HIGH",
    stageName: "syn_opt / DRC Fixing",
    symptom: "A global synchronous enable net drives 4,200 standard cells with a single X4 inverter, causing 1.8 ns slew violations and massive setup failures.",
    logSnippet: `[DRC-MAX-TRANS] Error: Net 'core_global_enable' has transition time 1.820 ns (Limit: 0.200 ns).
  Driver: 'u_ctrl/enable_buf/Y' (BUFX4) -> Load: 4,200 pins (Load Cap: 12.8 pF)
[GENUS-OPT] Max transition DRC violation causes +920 ps path delay penalty!`,
    principle: "High-fanout nets (HFN) exceed the capacitive driving capability of a single gate. The synthesis engine must be configured to build high-fanout buffer trees during `syn_opt`.",
    remedyTcl: `set_db max_fanout 32 [current_design]
set_db max_transition 0.200 [current_design]
set_db force_buffer_tree_synthesis true
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Max Net Slew", val: "1.820 ns (Violated)", bad: true },
      { label: "Single Gate Fanout", val: "4,200 Loads", bad: true },
      { label: "DRC Violations", val: "184 Endpoints", bad: true },
    ],
    afterMetrics: [
      { label: "Max Net Slew", val: "0.165 ns (MET) ✓", bad: false },
      { label: "Single Gate Fanout", val: "28 Max Loads ✓", bad: false },
      { label: "DRC Violations", val: "0 DRC Violations ✓", bad: false },
    ],
    options: [
      {
        id: "opt_buf_tree",
        label: "Enforce max fanout and max transition limits with automatic buffer tree insertion ('set_db max_fanout 32' and 'set_db force_buffer_tree_synthesis true')",
        correct: true,
        explanation: "Correct! Buffer tree synthesis builds balanced repeater trees, keeping slew under 200 ps across all 4,200 endpoints.",
      },
      {
        id: "opt_huge_inverter",
        label: "Replace the BUFX4 with a single massive BUFX64 cell",
        correct: false,
        explanation: "A single gate cannot drive 12.8 pF wire capacitance across the full chip without severe RC delay.",
      },
      {
        id: "opt_ignore_drc_trans",
        label: "Increase max_transition limit to 3.0 ns",
        correct: false,
        explanation: "Relaxing max_transition causes extreme dynamic power and silicon timing failures.",
      },
    ],
  },
  {
    id: 23,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Datapath Arithmetic Bottleneck (Ripple Carry vs Wallace/CSA Trees)",
    severity: "HIGH",
    stageName: "syn_generic / report_dp",
    symptom: "A 64-bit Multiply-Accumulate (MAC) unit synthesized into slow ripple-carry architecture with 3.8 ns delay, missing 1.2 GHz target.",
    logSnippet: `[REPORT-DP] Arithmetic Operator: 'Y = A * B + C + D' (64-bit MAC)
  Selected Architecture: Ripple-Carry Adder Chain (Delay: 3.85 ns, Area: 1,800 gates)
  Target Clock Period: 0.833 ns. Slack = -3.02 ns (FAILED).`,
    principle: "Complex multi-operand arithmetic expressions (e.g. $Y = A \times B + C + D$) can be implemented as slow $O(N)$ ripple-carry adders or fast $O(1)$ Carry-Save Adder (CSA) Wallace trees. Synthesis must be guided with `opt_spatial_effort` and datapath optimization.",
    remedyTcl: `set_db dp_analytical_opt extreme
set_db dp_csa csa
report_dp -design soc_top
syn_generic -physical`,
    beforeMetrics: [
      { label: "Datapath Delay", val: "3.85 ns (Ripple Carry)", bad: true },
      { label: "Arithmetic Architecture", val: "O(N) RCA Chain", bad: true },
      { label: "WNS Slack", val: "-3.02 ns (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Datapath Delay", val: "0.68 ns (Wallace Tree) ✓", bad: false },
      { label: "Arithmetic Architecture", val: "O(1) Carry-Save Tree ✓", bad: false },
      { label: "WNS Slack", val: "+35 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dp_csa",
        label: "Enable extreme datapath optimization with Carry-Save Adder tree merging: 'set_db dp_analytical_opt extreme' and 'set_db dp_csa csa'",
        correct: true,
        explanation: "Correct! CSA Wallace trees sum partial products simultaneously with constant delay before a single final vector merge adder.",
      },
      {
        id: "opt_rca_keep",
        label: "Force ripple-carry adders to save cell area",
        correct: false,
        explanation: "Ripple carry adders cannot meet gigahertz timing specifications.",
      },
      {
        id: "opt_remove_dp",
        label: "Convert the arithmetic block into a lookup table (LUT) ROM",
        correct: false,
        explanation: "A 64-bit arithmetic LUT requires impossible $2^{64}$ memory entries.",
      },
    ],
  },
  {
    id: 24,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "MMMC Corner Conflict: Setup (SSG/125°C) vs Hold (FFG/-40°C)",
    severity: "CRITICAL",
    stageName: "syn_opt / Multi-Corner Closure",
    symptom: "Fixing setup violations at the Slow Corner inserted large buffers that caused 480 hold violations at the Fast Corner!",
    logSnippet: `[MMMC-CLOSURE] View 'view_slow_setup' (SSG/0.72V/125C): Setup WNS = +10 ps (PASSED)
[MMMC-CLOSURE] View 'view_fast_hold' (FFG/0.88V/-40C): Hold WNS = -480 ps (FAILED - High drive buffers made data path too fast!)`,
    principle: "In sub-micron technologies, optimization must occur concurrently across all MMMC analysis views. Unbalanced single-corner optimization will degrade opposing corners.",
    remedyTcl: `set_db concurrent_opt_views { view_slow_setup view_fast_hold view_rc_worst }
set_db opt_hold_effort high
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Slow Corner Setup", val: "+10 ps (Passed)", bad: false },
      { label: "Fast Corner Hold", val: "-480 ps (FAILED)", bad: true },
      { label: "MMMC Convergence", val: "DIVERGED", bad: true },
    ],
    afterMetrics: [
      { label: "Slow Corner Setup", val: "+15 ps (MET) ✓", bad: false },
      { label: "Fast Corner Hold", val: "+32 ps (MET) ✓", bad: false },
      { label: "MMMC Convergence", val: "CONVERGED 100% ✓", bad: false },
    ],
    options: [
      {
        id: "opt_concurrent_mmmc",
        label: "Enable concurrent multi-view optimization: 'set_db concurrent_opt_views {view_slow_setup view_fast_hold}' with 'set_db opt_hold_effort high'",
        correct: true,
        explanation: "Correct! Concurrent MMMC optimization weighs setup and hold slacks simultaneously across all PVT corners to prevent corner thrashing.",
      },
      {
        id: "opt_ignore_hold_synth",
        label: "Ignore hold violations in synthesis and defer hold fixing to physical routing",
        correct: false,
        explanation: "Severe hold violations left to routing cause huge routing congestion and delay buffer bloat.",
      },
      {
        id: "opt_single_corner_only",
        label: "Synthesize only for typical corner (TT/0.80V/25C)",
        correct: false,
        explanation: "Typical-only synthesis guarantees silicon failure at voltage/temperature extremes.",
      },
    ],
  },
  {
    id: 25,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Routing Congestion in Macro Narrow Channels Blocking Timing",
    severity: "HIGH",
    stageName: "Physical Synthesis / Congestion Map",
    symptom: "Synthesis cell placement created 140% routing congestion Hotspots between two SRAM macros, causing -920 ps timing failure.",
    logSnippet: `[CONGESTION-MAP] Alert: Routing congestion Overflow H: 4.8% V: 12.4% in region (X: 1200, Y: 850):
  Region: Channel between SRAM_BANK_0 and SRAM_BANK_1 (Width: 15 um)
[GENUS-OPT] Detour routing parasitics increased wire delay by 400%. WNS = -920 ps.`,
    principle: "Standard cells placed in narrow channels between hard macros cause severe routing congestion and wire detours. Applying physical placement halos and keepout blockages around macros prevents cell congestion.",
    remedyTcl: `create_place_halo -halo_deltas { 25 25 25 25 } -insts [get_db insts -if {.is_macro == true}]
set_db opt_congestion_effort high
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Routing Congestion", val: "140% (Severe Overflow)", bad: true },
      { label: "Interconnect Detour Delay", val: "+920 ps", bad: true },
      { label: "Router DRC Violations", val: "480 Shorts", bad: true },
    ],
    afterMetrics: [
      { label: "Routing Congestion", val: "68% (Clean) ✓", bad: false },
      { label: "Interconnect Detour Delay", val: "0 ps (Direct) ✓", bad: false },
      { label: "Router DRC Violations", val: "0 Shorts ✓", bad: false },
    ],
    options: [
      {
        id: "opt_place_halo",
        label: "Apply placement halos around macros ('create_place_halo -halo_deltas {25 25 25 25}') and set 'opt_congestion_effort high'",
        correct: true,
        explanation: "Correct! Placement halos keep standard cells out of narrow macro corridors, leaving channel tracks clear for smooth power and global routing.",
      },
      {
        id: "opt_shrink_macro",
        label: "Scale down the physical size of the SRAM memory macros",
        correct: false,
        explanation: "Hard macro dimensions are fixed by foundry memory compilers and cannot be shrunk in synthesis.",
      },
      {
        id: "opt_disable_spatial_cong",
        label: "Disable spatial physical synthesis",
        correct: false,
        explanation: "Disabling physical synthesis hides the congestion but makes post-route P&R completely unroutable.",
      },
    ],
  },
  {
    id: 26,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Clock-to-Q Delay Uncertainty at Extreme Low Voltage (0.72V PVT)",
    severity: "HIGH",
    stageName: "MMMC Corner Timing / Low Voltage",
    symptom: "Standard cell flip-flops experience 300% longer Clock-to-Q delay at 0.72V SSG corner due to sub-threshold transistor saturation.",
    logSnippet: `[REPORT-TIMING] Slow Corner (SSG / 0.72V / 125C):
  Cell 'DFFHQX1' Clk-to-Q Delay: 420 ps (Nominal 1.0V Delay: 120 ps).
  Path Slack: -380 ps (FAILED).`,
    principle: "In deep submicron FinFET technologies operating near near-threshold voltages (0.72V), transistor drive current drops non-linearly. Synthesis must use Low-Vt (LVT) fast-switching sequential cells on critical timing paths.",
    remedyTcl: `set_db [get_db insts -if {.is_sequential == true && .slack < 0.050}] .lib_cell [get_db lib_cells *DFFHQ_LVT*]
set_db opt_leakage_to_dynamic_ratio 0.2
syn_opt -spatial`,
    beforeMetrics: [
      { label: "0.72V Flop Clk-to-Q Delay", val: "420 ps (Sluggish)", bad: true },
      { label: "Setup Slack WNS", val: "-380 ps", bad: true },
      { label: "Target Frequency", val: "850 MHz (Degraded)", bad: true },
    ],
    afterMetrics: [
      { label: "0.72V Flop Clk-to-Q Delay", val: "185 ps (LVT Fast) ✓", bad: false },
      { label: "Setup Slack WNS", val: "+20 ps (MET) ✓", bad: false },
      { label: "Target Frequency", val: "1.2 GHz ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lvt_swap_seq",
        label: "Swap critical path sequential flip-flops to Low-Vt (LVT) high-drive cell variants in the target library",
        correct: true,
        explanation: "Correct! Low-Vt sequential cells drastically reduce Clock-to-Q delay at low voltage corners, recovering setup slack.",
      },
      {
        id: "opt_increase_voltage_chip",
        label: "Force the chip power supply to 1.5V permanently",
        correct: false,
        explanation: "1.5V exceeds standard cell gate dielectric breakdown limits in modern nodes.",
      },
      {
        id: "opt_remove_flops",
        label: "Replace flip-flops with unclocked combinational latches",
        correct: false,
        explanation: "Replacing flip-flops with unclocked latches destroys synchronous timing integrity.",
      },
    ],
  },
  {
    id: 27,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "High Output Pin Capacitance DRC Violation (max_capacitance)",
    severity: "MEDIUM",
    stageName: "syn_opt / DRC Legalization",
    symptom: "Output pin load capacitance on 32 bus drivers is 1.4 pF, exceeding the library maximum limit of 0.45 pF by 300%.",
    logSnippet: `[DRC-MAX-CAP] Warning: Pin 'u_bus/driver_inst/Y' load capacitance is 1.420 pF (Limit: 0.450 pF):
  Gate Delay degraded by +650 ps due to capacitive overloading!`,
    principle: "When an output pin's load capacitance exceeds its library `max_capacitance`, the cell cannot source enough current, resulting in extreme delay penalties and electromigration reliability degradation.",
    remedyTcl: `set_max_capacitance 0.450 [current_design]
set_db opt_drc_effort high
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Max Pin Capacitance", val: "1.420 pF (Overloaded)", bad: true },
      { label: "Capacitive Delay Penalty", val: "+650 ps", bad: true },
      { label: "DRC Violations", val: "32 Pins", bad: true },
    ],
    afterMetrics: [
      { label: "Max Pin Capacitance", val: "0.380 pF (MET) ✓", bad: false },
      { label: "Capacitive Delay Penalty", val: "0 ps (Buffered) ✓", bad: false },
      { label: "DRC Violations", val: "0 Pins ✓", bad: false },
    ],
    options: [
      {
        id: "opt_drc_cap_fix",
        label: "Enable high DRC optimization effort with automatic load buffering ('set_db opt_drc_effort high' and 'set_max_capacitance 0.450')",
        correct: true,
        explanation: "Correct! Genus splits the capacitive load by inserting intermediate buffer stages, keeping pin capacitance well under library limits.",
      },
      {
        id: "opt_remove_load",
        label: "Disconnect half of the receiver pins",
        correct: false,
        explanation: "Disconnecting receivers breaks functional logic.",
      },
      {
        id: "opt_ignore_cap",
        label: "Disable max_capacitance checking in the SDC",
        correct: false,
        explanation: "Silencing the check causes physical electromigration and dynamic timing failures.",
      },
    ],
  },
  {
    id: 28,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Boundary Optimization Disabled on Critical Submodule Hierarchy",
    severity: "HIGH",
    stageName: "syn_map / Boundary Optimization",
    symptom: "Submodule I/O boundary has 2 inverters and 1 buffer connected in series across the port boundary because boundary optimization was blocked.",
    logSnippet: `[GENUS-MAP-22] Information: Boundary optimization skipped for module 'dsp_accelerator':
  Reason: Module has 'boundary_optimization false' or 'dont_touch true'.
  3 redundant inverters preserved at interface. Delay penalty: +180 ps.`,
    principle: "Boundary optimization allows the synthesis compiler to push constants, merge duplicate inverters, and resize drivers across submodule port boundaries. When disabled, redundant interface logic is preserved.",
    remedyTcl: `set_db [get_db modules dsp_accelerator] .boundary_optimization true
set_db [get_db modules dsp_accelerator] .auto_ungroup none
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Redundant Interface Gates", val: "48 Inverters/Buffers", bad: true },
      { label: "Boundary Delay Penalty", val: "+180 ps", bad: true },
      { label: "Cross-Module Slack", val: "-140 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Redundant Interface Gates", val: "0 Redundant Gates ✓", bad: false },
      { label: "Boundary Delay Penalty", val: "0 ps (Merged) ✓", bad: false },
      { label: "Cross-Module Slack", val: "+40 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_boundary_true",
        label: "Enable boundary optimization on the submodule ('set_db [get_db modules dsp_accelerator] .boundary_optimization true')",
        correct: true,
        explanation: "Correct! Boundary optimization removes redundant inverters and merges logic across ports without destroying the module hierarchy.",
      },
      {
        id: "opt_flatten_everything",
        label: "Flatten the entire chip into a single Verilog netlist",
        correct: false,
        explanation: "Flattening the entire chip destroys modular floorplanning and verification boundaries.",
      },
      {
        id: "opt_dont_touch_sub",
        label: "Set 'dont_touch' on all submodule ports",
        correct: false,
        explanation: "Setting dont_touch makes redundant boundary logic permanent.",
      },
    ],
  },
  {
    id: 29,
    domainId: "setup_closure",
    domainName: "Setup & Timing Closure",
    title: "Clock Inverter Starvation on High-Fanout Gated Clock Branches",
    severity: "HIGH",
    stageName: "syn_opt / Clock Pin Drive Sizing",
    symptom: "Clock gating cell output drives 128 flip-flops with an undersized X1 clock driver, introducing 540 ps clock transition delay.",
    logSnippet: `[CTS-PRE-OPT] Alert: Clock gating cell 'u_clk_gate/icg_inst/GCK' has 128 loads (Drive: X1):
  Clock signal slew = 540 ps (Target: 80 ps). Setup WNS = -420 ps.`,
    principle: "Gated clock pins drive substantial capacitive load (flip-flop clock pins + routing). If synthesis leaves an undersized ICG driver, clock transition degrades drastically, adding huge insertion delay and skew.",
    remedyTcl: `set_db lp_clock_gating_cell [get_db lib_cells *CKGPRELATNX8*]
set_db opt_spatial_effort extreme
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Gated Clock Pin Slew", val: "540 ps (Underdriven)", bad: true },
      { label: "Clock Insertion Delay", val: "920 ps", bad: true },
      { label: "Setup WNS", val: "-420 ps", bad: true },
    ],
    afterMetrics: [
      { label: "Gated Clock Pin Slew", val: "75 ps (Crisp X8 Drive) ✓", bad: false },
      { label: "Clock Insertion Delay", val: "240 ps (-74%) ✓", bad: false },
      { label: "Setup WNS", val: "+30 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_icg_drive_size",
        label: "Specify higher-drive ICG cell variants (e.g. X8/X16) using 'set_db lp_clock_gating_cell' and enable spatial optimization",
        correct: true,
        explanation: "Correct! Sizing the ICG driver properly sharpens clock edges to 75 ps, recovering 450 ps of path delay.",
      },
      {
        id: "opt_reduce_clock_freq",
        label: "Slow down the clock frequency by 40%",
        correct: false,
        explanation: "Reducing frequency degrades system performance.",
      },
      {
        id: "opt_remove_icg_cell",
        label: "Delete the clock gating cell",
        correct: false,
        explanation: "Deleting clock gating causes massive dynamic power dissipation.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 4: SEQUENTIAL RETIMING & PIPELINING (10 Scenarios)
  // =========================================================================
  {
    id: 30,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Sequential Retiming Blocked by Modular Hierarchy Boundaries",
    severity: "HIGH",
    stageName: "syn_opt / Sequential Retiming",
    symptom: "A 64-bit cryptography datapath fails setup by -620 ps because `retime` cannot move pipeline registers across submodule boundaries.",
    logSnippet: `[RETIME-30] Warning: Cannot move pipeline registers 'crypto_pipe_reg[63:0]' across boundary of module 'aes_core_slice':
  Reason: Module has 'auto_ungroup none' preserved or 'dont_touch true'.
[RETIME-31] Retiming optimization aborted for block 'aes_core_slice'. WNS remains -620 ps.`,
    principle: "Sequential retiming pushes and pulls flip-flops across combinational logic gates to balance pipeline stage delays. However, strict hierarchical boundary preservation (`auto_ungroup none`) prevents moving registers across boundaries.",
    remedyTcl: `set_db [get_db modules aes_core_slice] .retime true
set_db retime_effort high
set_db retime_async_reset false
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Datapath WNS", val: "-620 ps", bad: true },
      { label: "S-Box Logic Delay", val: "1.45 ns (Unbalanced)", bad: true },
      { label: "Pipeline Flop Mobility", val: "BLOCKED by Hierarchy", bad: true },
    ],
    afterMetrics: [
      { label: "Datapath WNS", val: "+40 ps (MET) ✓", bad: false },
      { label: "S-Box Logic Delay", val: "0.72 ns (Balanced) ✓", bad: false },
      { label: "Pipeline Flop Mobility", val: "OPTIMALLY RETIMED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_retime_mod",
        label: "Set '.retime true' on the target module ('set_db [get_db modules aes_core_slice] .retime true') and run 'set_db retime_effort high'",
        correct: true,
        explanation: "Correct! Explicitly enabling retiming on the module grants Genus permission to move registers across hierarchy boundaries, balancing combinational delays.",
      },
      {
        id: "opt_remove_clock",
        label: "Remove the clock pin from the S-box module",
        correct: false,
        explanation: "Removing the clock pin turns synchronous logic into floating nodes.",
      },
      {
        id: "opt_set_dont_touch_all",
        label: "Set 'dont_touch' on all registers",
        correct: false,
        explanation: "dont_touch completely prevents retiming.",
      },
    ],
  },
  {
    id: 31,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Asynchronous Reset Pins Inhibiting Forward Retiming",
    severity: "MEDIUM",
    stageName: "syn_opt / Retiming DRC",
    symptom: "Synthesis cannot move pipeline registers past a 32-bit multiplier tree because flip-flops have asynchronous reset pins.",
    logSnippet: `[RETIME-12] Information: Flop 'mul_pipe_reg[31]' has asynchronous control pin 'CLR' (async reset 'rst_n').
[RETIME-12] Cannot push asynchronous reset register through combinational gate 'MULT32' without altering power-on state behavior.
[RETIME-12] 32 registers skipped. Datapath slack remains -540 ps.`,
    principle: "Moving a register with an asynchronous reset past combinational gates changes reset behavior. High-speed pipeline stages should use synchronous resets to allow full retiming freedom.",
    remedyTcl: `set_db exact_match_seq_sync_ctrls true
# In RTL: Convert pipeline flops to synchronous reset:
# if (posedge clk) begin
#   if (!rst_n) pipe_reg <= 0;
#   else        pipe_reg <= data_in;
# end`,
    beforeMetrics: [
      { label: "Multiplier Slack", val: "-540 ps", bad: true },
      { label: "Async Reset Flop Count", val: "32 Flops (Immobile)", bad: true },
      { label: "Max Clock Frequency", val: "850 MHz", bad: true },
    ],
    afterMetrics: [
      { label: "Multiplier Slack", val: "+35 ps (MET) ✓", bad: false },
      { label: "Async Reset Flop Count", val: "0 (Synchronous) ✓", bad: false },
      { label: "Max Clock Frequency", val: "1.2 GHz ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sync_reset_pipe",
        label: "Convert intermediate datapath pipeline stages to synchronous resets in RTL and configure 'exact_match_seq_sync_ctrls true'",
        correct: true,
        explanation: "Correct! Synchronous reset registers can be freely moved and optimized across combinational arithmetic logic by the retiming engine.",
      },
      {
        id: "opt_tie_async",
        label: "Tie the asynchronous reset pin permanently to VDD",
        correct: false,
        explanation: "Tying reset to VDD disables chip reset capability.",
      },
      {
        id: "opt_wlm_pipe",
        label: "Enable wire load models on the multiplier",
        correct: false,
        explanation: "WLMs do not remove async reset retiming restrictions.",
      },
    ],
  },
  {
    id: 32,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Retiming Latency Imbalance Across Parallel Processing Branches",
    severity: "CRITICAL",
    stageName: "Formal Verification / Handshake DRC",
    symptom: "Retiming moved a pipeline register on Data Path A but not Data Path B, causing a 1-cycle data synchronization mismatch.",
    logSnippet: `[VERIF-HANDSHAKE] Critical: Data path A has 3 register stages; Data path B has 2 register stages.
  At clock cycle 104, adder receives misaligned operands from cycle 103 and 104!`,
    principle: "When retiming parallel datapaths that join at a common arithmetic or control point, register moves must be latency-balanced across all converging branches.",
    remedyTcl: `set_db retime_preserve_latency_balance true
set_db retime_effort high
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Parallel Branch Latency", val: "3 Cycles vs 2 Cycles", bad: true },
      { label: "Hardware Calculation", val: "CORRUPTED RESULTS", bad: true },
      { label: "Formal Equivalence", val: "NON-EQUIVALENT", bad: true },
    ],
    afterMetrics: [
      { label: "Parallel Branch Latency", val: "3 Cycles vs 3 Cycles ✓", bad: false },
      { label: "Hardware Calculation", val: "100% BIT-EXACT ✓", bad: false },
      { label: "Formal Equivalence", val: "EQUIVALENT ✓", bad: false },
    ],
    options: [
      {
        id: "opt_latency_balance",
        label: "Enable 'set_db retime_preserve_latency_balance true' to enforce uniform cycle latency across converging datapaths",
        correct: true,
        explanation: "Correct! Latency balancing ensures that retiming preserves identical cycle delays across all parallel paths feeding the downstream block.",
      },
      {
        id: "opt_disable_branch_b",
        label: "Delete Data Path B",
        correct: false,
        explanation: "Deleting hardware branches breaks functionality.",
      },
      {
        id: "opt_set_dont_touch_all_retime",
        label: "Disable all synthesis optimizations",
        correct: false,
        explanation: "Disabling optimization fails timing closure.",
      },
    ],
  },
  {
    id: 33,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Multi-Bit Register Cells Inhibiting Single-Bit Register Shifting",
    severity: "MEDIUM",
    stageName: "syn_opt / Multi-bit Retiming",
    symptom: "Synthesis inferred 4-bit multi-bit flip-flop cells (`DFF_X4`) before retiming, locking all 4 bits together and preventing bit-level path balancing.",
    logSnippet: `[RETIME-MBIT] Warning: Multi-bit register 'acc_reg[3:0]' (cell: DFFHQX4) cannot be split for retiming.
  Bit 0 is timing critical (-320 ps); Bits 1..3 have +400 ps slack. Retiming skipped.`,
    principle: "Multi-bit cells merge multiple register bits into a single shared clock cell for power savings. If multi-bit merging occurs BEFORE retiming, bits cannot move independently. Retiming must execute prior to multi-bit merging.",
    remedyTcl: `# Correct flow order: Retime first, then infer multi-bit cells:
set_db use_multibit_cells false
syn_generic
syn_map
set_db retime_effort high
syn_opt -spatial
# Enable multi-bit merging in final optimization pass:
set_db use_multibit_cells true
syn_opt -incremental`,
    beforeMetrics: [
      { label: "Bit 0 Slack", val: "-320 ps (Locked)", bad: true },
      { label: "Multi-Bit Cell Mobility", val: "IMMOBILE", bad: true },
      { label: "Timing Closure", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Bit 0 Slack", val: "+45 ps (MET) ✓", bad: false },
      { label: "Multi-Bit Cell Mobility", val: "OPTIMALLY RETIMED ✓", bad: false },
      { label: "Timing Closure", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_retime_before_mbit",
        label: "Execute sequential retiming first, followed by incremental multi-bit register merging in syn_opt",
        correct: true,
        explanation: "Correct! Retiming single-bit registers first provides full flexibility to close critical paths before packing non-critical registers into multi-bit cells.",
      },
      {
        id: "opt_disable_mbit_forever",
        label: "Permanently ban all multi-bit cells from the SoC",
        correct: false,
        explanation: "Banning multi-bit cells forfeits a 20-30% clock dynamic power savings.",
      },
      {
        id: "opt_wlm_mbit",
        label: "Switch to wire-load models",
        correct: false,
        explanation: "Wire-load models do not resolve multi-bit cell rigidity.",
      },
    ],
  },
  {
    id: 34,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Non-Resettable Flops Retimed into Loops Causing X-State Bugs",
    severity: "HIGH",
    stageName: "Gate-Level Simulation / X-Propagation",
    symptom: "Hardware simulation shows chip failing to boot because non-resettable registers retimed into feedback loops oscillate at unknown `1'bx` state.",
    logSnippet: `[SIM-XPROP] Error: Register 'u_fsm/state_retimed_reg' output Q is 'X' at reset de-assertion (100 ns).
  Unknown 'X' state propagated to all control outputs. Simulation deadlocked!`,
    principle: "Moving non-resettable registers into state machine feedback loops creates uninitialized circular dependencies. Retiming must only move registers with deterministic reset behavior.",
    remedyTcl: `set_db retime_async_reset false
set_db retime_dont_retime_uninitialized_flops true
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Boot State Initialized", val: "UNKNOWN (X-State)", bad: true },
      { label: "Gate-Level Simulation", val: "LOCKED / DEADLOCK", bad: true },
      { label: "Silicon Power-On", val: "RANDOM HANG", bad: true },
    ],
    afterMetrics: [
      { label: "Boot State Initialized", val: "DETERMINISTIC 0 ✓", bad: false },
      { label: "Gate-Level Simulation", val: "100% CLEAN BOOT ✓", bad: false },
      { label: "Silicon Power-On", val: "RELIABLE RESET ✓", bad: false },
    ],
    options: [
      {
        id: "opt_retime_uninit_false",
        label: "Set 'retime_dont_retime_uninitialized_flops true' and ensure state machine control registers have explicit reset values",
        correct: true,
        explanation: "Correct! Preventing uninitialized registers from moving into feedback loops ensures deterministic post-reset power-on states.",
      },
      {
        id: "opt_ignore_xprop",
        label: "Disable X-propagation checking in the RTL simulator",
        correct: false,
        explanation: "Disabling X-checks in simulation hides real silicon hardware initialization bugs.",
      },
      {
        id: "opt_flatten_fsm",
        label: "Ungroup the FSM hierarchy",
        correct: false,
        explanation: "Ungrouping does not initialize un-resettable registers.",
      },
    ],
  },
  {
    id: 35,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "High-Effort Retiming Causing Netlist Gate Count Explosion",
    severity: "MEDIUM",
    stageName: "syn_opt / Area vs Timing Tradeoff",
    symptom: "Aggressive retiming duplicated 2,400 registers across parallel logic cones, causing total standard cell area to bloat by +35%.",
    logSnippet: `[GENUS-AREA] Warning: Retiming area bloat detected:
  Register count increased from 4,800 to 7,200 (+50%).
  Standard cell area: 185,000 um² (Limit: 140,000 um²). Chip exceeds die budget!`,
    principle: "Forward retiming past fanout split points duplicates registers for each branch. Constraining retiming area expansion prevents excessive flop replication while meeting timing.",
    remedyTcl: `set_db retime_area_effort high
set_db retime_max_register_increase 10
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Register Count Increase", val: "+50% (2,400 Flops)", bad: true },
      { label: "Die Footprint", val: "185,000 um² (+35%)", bad: true },
      { label: "Silicon Cost", val: "EXCEEDS BUDGET", bad: true },
    ],
    afterMetrics: [
      { label: "Register Count Increase", val: "+4.2% (200 Flops) ✓", bad: false },
      { label: "Die Footprint", val: "142,000 um² (On Budget) ✓", bad: false },
      { label: "Silicon Cost", val: "TARGET MET ✓", bad: false },
    ],
    options: [
      {
        id: "opt_retime_area_cap",
        label: "Constrain retiming expansion using 'set_db retime_max_register_increase 10' and 'set_db retime_area_effort high'",
        correct: true,
        explanation: "Correct! Limiting register expansion to 10% prevents uncontrolled register duplication while closing timing on critical paths.",
      },
      {
        id: "opt_disable_all_opt",
        label: "Completely disable timing optimization",
        correct: false,
        explanation: "Disabling timing optimization creates severe frequency violations.",
      },
      {
        id: "opt_increase_die_size",
        label: "Increase the silicon die size by 50%",
        correct: false,
        explanation: "Increasing die size drastically increases chip manufacturing costs.",
      },
    ],
  },
  {
    id: 36,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Retiming Moving Flops Across Asynchronous Clock Domains",
    severity: "CRITICAL",
    stageName: "syn_opt / Cross-Domain Retiming",
    symptom: "Retiming engine moved a core-clock register into the PCIe clock domain, destroying the CDC 2-flop synchronizer protocol.",
    logSnippet: `[RETIME-CDC-ERR] Critical: Flop 'u_cdc/sync_reg_1' was retimed across asynchronous clock boundary:
  Original Clock: 'clk_core' (1.2 GHz) -> Retimed Clock: 'clk_pcie' (250 MHz)
[CDC-AUDIT] Asynchronous synchronizer pair broken! Metastability failure imminent.`,
    principle: "Registers belonging to Clock Domain Crossing (CDC) synchronizers, handshakes, and FIFOs must NEVER be retimed. They must be explicitly locked using `dont_touch` or `retime false`.",
    remedyTcl: `set_db [get_db insts *u_cdc/sync_reg*] .retime false
set_dont_touch [get_cells *u_cdc/sync_reg*]
syn_opt -spatial`,
    beforeMetrics: [
      { label: "CDC Synchronizer Integrity", val: "BROKEN", bad: true },
      { label: "Cross-Clock Domain Phase", val: "CORRUPTED", bad: true },
      { label: "Silicon Reliability", val: "METASTABILITY CRASH", bad: true },
    ],
    afterMetrics: [
      { label: "CDC Synchronizer Integrity", val: "LOCKED & PROTECTED ✓", bad: false },
      { label: "Cross-Clock Domain Phase", val: "PROPER 2-FLOP SYNC ✓", bad: false },
      { label: "Silicon Reliability", val: "100% ROBUST CDC ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lock_cdc_retime",
        label: "Lock CDC synchronizer registers using 'set_db [get_db insts *u_cdc/sync_reg*] .retime false' and 'set_dont_touch'",
        correct: true,
        explanation: "Correct! Explicitly marking CDC synchronizers as non-retimable prevents the optimizer from moving registers across clock domain boundaries.",
      },
      {
        id: "opt_merge_clocks",
        label: "Merge PCIe and Core clocks into a single clock",
        correct: false,
        explanation: "Merging distinct physical clocks is impossible on PCIe hardware interfaces.",
      },
      {
        id: "opt_wlm_cdc",
        label: "Apply wire load models to CDC nets",
        correct: false,
        explanation: "Wire load models do not protect CDC synchronizer registers.",
      },
    ],
  },
  {
    id: 37,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Conformal LEC Verification Abort Due to Unlogged Retiming Steps",
    severity: "HIGH",
    stageName: "Formal Verification / Conformal LEC",
    symptom: "Cadence Conformal LEC fails formal equivalence verification between RTL and Netlist because retimed register mappings were not exported.",
    logSnippet: `[CONFORMAL-LEC] Error: 128 comparison points aborted / non-equivalent:
  Golden RTL: 'u_alu/pipe_reg_0' (DFF) -> Revised Netlist: Point not found (Moved/Merged)!
[LEC-FAIL] Conformal cannot trace retimed state space without Genus retiming log.`,
    principle: "Sequential retiming changes state register names and locations. To prove logic equivalence, Genus must export a Conformal LEC setup dofile containing retiming transformation rules (`write_do_lec`).",
    remedyTcl: `set_db write_do_lec_include_retimed_registers true
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/inputs/rtl_to_synth.lec.do`,
    beforeMetrics: [
      { label: "Conformal LEC Status", val: "ABORTED (128 Points)", bad: true },
      { label: "Formal Signoff", val: "FAILED", bad: true },
      { label: "Tapeout Readiness", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Conformal LEC Status", val: "EQUIVALENT 100% ✓", bad: false },
      { label: "Formal Signoff", val: "PASSED ✓", bad: false },
      { label: "Tapeout Readiness", val: "SIGN-OFF READY ✓", bad: false },
    ],
    options: [
      {
        id: "opt_write_do_lec",
        label: "Generate Conformal LEC setup dofile with retiming mapping rules: 'write_do_lec -golden_design rtl -revised_design ...'",
        correct: true,
        explanation: "Correct! `write_do_lec` exports state transformation hints that guide Conformal LEC to prove formal mathematical equivalence.",
      },
      {
        id: "opt_bypass_lec",
        label: "Skip LEC formal verification and rely only on gate simulation",
        correct: false,
        explanation: "Gate simulation tests less than 1% of possible state combinations and cannot prove full chip equivalence.",
      },
      {
        id: "opt_flatten_rtl",
        label: "Flatten the RTL source code",
        correct: false,
        explanation: "Flattening RTL does not generate retiming mapping rules.",
      },
    ],
  },
  {
    id: 38,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Time-Borrowing Transparent Latches Interfering with Retimed DFFs",
    severity: "MEDIUM",
    stageName: "syn_opt / Time Borrowing",
    symptom: "Retiming engine pushed D-flip-flops through a level-sensitive latch stage, creating race conditions and invalidating time-borrowing windows.",
    logSnippet: `[RETIME-LATCH] Warning: Mixed sequential element path detected:
  Flop 'reg_a' (edge-triggered) -> Latch 'latch_b' (level-sensitive) -> Flop 'reg_c'
[GENUS-OPT] Retiming across transparent latch boundaries is disabled to prevent latch race conditions.`,
    principle: "Transparent latches utilize pulse-width time borrowing across clock phases. Edge-triggered flip-flops and level-sensitive latches have fundamentally different timing mechanisms and must not be mixed in automated retiming cones.",
    remedyTcl: `set_db [get_db insts -if {.is_latch == true}] .retime false
set_db retime_latches false
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Time Borrowing Window", val: "INVALIDATED", bad: true },
      { label: "Latch Race Hazards", val: "HIGH RISK", bad: true },
      { label: "STA Timing Accuracy", val: "DEGRADED", bad: true },
    ],
    afterMetrics: [
      { label: "Time Borrowing Window", val: "PRESERVED ✓", bad: false },
      { label: "Latch Race Hazards", val: "0 Race Conditions ✓", bad: false },
      { label: "STA Timing Accuracy", val: "EXACT BORROWING ✓", bad: false },
    ],
    options: [
      {
        id: "opt_isolate_latch_retime",
        label: "Set '.retime false' on transparent latches to preserve exact time-borrowing windows for latch-based datapaths",
        correct: true,
        explanation: "Correct! Isolating latches prevents automated tools from converting or moving latch stages into edge-triggered flip-flop domains.",
      },
      {
        id: "opt_convert_latches_dff",
        label: "Replace all latches in the design with flip-flops",
        correct: false,
        explanation: "Replacing high-speed time-borrowing latches with flip-flops eliminates half-cycle time borrowing benefits.",
      },
      {
        id: "opt_remove_latch_clock",
        label: "Tie the latch enable pin to 1'b1",
        correct: false,
        explanation: "Tying latch enable high turns latches into pure unclocked combinational wires.",
      },
    ],
  },
  {
    id: 39,
    domainId: "retiming",
    domainName: "Retiming & Pipelining",
    title: "Manual Pipeline Stage Insertion in RTL for Long Carry Paths",
    severity: "HIGH",
    stageName: "RTL Architecture / Pipelining",
    symptom: "A 128-bit comparison tree has 2.4 ns delay, exceeding the 0.833 ns clock cycle by 300%. Automatic retiming has no registers to pull from!",
    logSnippet: `[REPORT-TIMING] Path: 'wide_comp_in[127:0]' -> 'comp_out_reg/D'
  Combinational Logic Levels: 28 gates (Delay: 2.45 ns). Available Cycle: 0.833 ns.
[GENUS-OPT] No upstream registers available in module for retiming borrow. Slack = -1.62 ns (FAILED).`,
    principle: "When a deep combinational logic cone has zero registers inside its path, automatic retiming cannot create pipeline stages out of thin air. RTL designers must instantiate register stages (pipelining) to partition the delay.",
    remedyTcl: `# Refactor RTL: Insert 3 pipeline register stages into the 128-bit comparator tree:
# always_ff @(posedge clk) begin
#   stage1_reg <= comp_tree_stage1(data_in);
#   stage2_reg <= comp_tree_stage2(stage1_reg);
#   comp_out   <= comp_tree_stage3(stage2_reg);
# end
syn_generic -physical
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Logic Levels", val: "28 Gates (2.45 ns)", bad: true },
      { label: "Pipeline Stages", val: "1 Stage (Unbalanced)", bad: true },
      { label: "WNS Slack", val: "-1.62 ns (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Logic Levels", val: "7 Gates per Stage ✓", bad: false },
      { label: "Pipeline Stages", val: "3 Balanced Stages ✓", bad: false },
      { label: "WNS Slack", val: "+45 ps (1.2 GHz MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_insert_pipeline_rtl",
        label: "Refactor the RTL to instantiate 3 balanced pipeline register stages across the 128-bit comparator tree",
        correct: true,
        explanation: "Correct! Inserting intermediate pipeline registers divides the 28 logic levels into 3 clean ~7-gate stages, easily meeting 1.2 GHz timing.",
      },
      {
        id: "opt_overvolt_gates",
        label: "Increase supply voltage to speed up the 28 gates",
        correct: false,
        explanation: "No realistic voltage increase can speed up 28 logic levels to fit within 833 ps.",
      },
      {
        id: "opt_set_multicycle_all_comp",
        label: "Set multicycle path 4 on the unpipelined combinational tree",
        correct: false,
        explanation: "Multicycle without hardware pipeline registers cuts throughput to 1/4th and creates race hazards.",
      },
    ],
  },
  // =========================================================================
  // DOMAIN 5: LOW-POWER (UPF/CPF) & CLOCK GATING (10 Scenarios)
  // =========================================================================
  {
    id: 40,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Combinational AND Clock Gating Glitch Hazard",
    severity: "CRITICAL",
    stageName: "syn_generic / Clock Gating",
    symptom: "Gate-level dynamic simulation shows registers corrupting data due to a 45 ps spurious glitch on the gated clock net!",
    logSnippet: `[SIM-FAIL] Glitch pulse width = 45 ps detected on net 'clk_gated_bank0' while master clock was HIGH.
[SIM-FAIL] Register state corrupted at simulation time 104.2 ns.
[GENUS-LP] Warning: User RTL implemented clock gating using raw 'assign clk_out = clk & enable;'`,
    principle: "Raw combinational gates (AND/OR) must NEVER be used to gate clock signals. An Integrated Clock Gating (ICG) cell contains an active-low latch that locks the enable signal during clock high, guaranteeing glitch-free clock gating.",
    remedyTcl: `set_db lp_insert_clock_gating true
set_db lp_clock_gating_style latch
set_db lp_clock_gating_min_flops 3
set_db lp_clock_gating_cell [get_db lib_cells *CKGPRELATN*]`,
    beforeMetrics: [
      { label: "Clock Glitch Width", val: "45 ps Glitch", bad: true },
      { label: "Clock Dynamic Power", val: "48.5 mW (High)", bad: true },
      { label: "Silicon Reliability", val: "FATAL METASTABILITY", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Glitch Width", val: "0 ps (Glitch-Free) ✓", bad: false },
      { label: "Clock Dynamic Power", val: "32.9 mW (-32%) ✓", bad: false },
      { label: "Silicon Reliability", val: "ROCK-SOLID SIGN-OFF ✓", bad: false },
    ],
    options: [
      {
        id: "opt_icg_latch_5",
        label: "Enforce automated latch-based Integrated Clock Gating ('set_db lp_clock_gating_style latch' and 'set_db lp_insert_clock_gating true')",
        correct: true,
        explanation: "Correct! Latch-based ICG standard cells ensure that enable transitions only occur when the clock is low, guaranteeing 100% glitch-free clock gating.",
      },
      {
        id: "opt_inverter_chain_5",
        label: "Insert 4 inverters in series on the enable signal",
        correct: false,
        explanation: "Adding delay does not prevent enable from changing during active clock phases across process corners.",
      },
      {
        id: "opt_disable_cg_tot_5",
        label: "Permanently disable all clock gating across the entire SoC",
        correct: false,
        explanation: "Disabling clock gating causes the chip to exceed its thermal and dynamic power budget by 40-50%.",
      },
    ],
  },
  {
    id: 41,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Missing Isolation Cells (ISO) on Power-Gated Submodule Outputs",
    severity: "CRITICAL",
    stageName: "UPF/CPF Ingestion / Low-Power Synthesis",
    symptom: "When CPU Core 1 powers down, floating output signals drive active always-on peripherals, causing severe short-circuit crowbar current.",
    logSnippet: `[UPF-CHECK-08] Error: 42 boundary nets crossing from Power Domain 'PD_CORE1' (Switchable) to 'PD_ALWAYS_ON' lack isolation cells:
  Nets: { core1_status[31:0], core1_irq_req, core1_mem_addr[8:0] }
[GENUS-LP] Floating input pins detected in PD_ALWAYS_ON during sleep mode!`,
    principle: "When a power domain shuts down, its output voltages float to high-impedance (Z). Isolation cells clamp these signals to a defined logic 0 or 1, protecting active downstream domains.",
    remedyTcl: `set_db lp_insert_isolation_cells true
# In UPF:
# set_isolation iso_core1 -domain PD_CORE1 -clamp_value 0 -applies_to outputs
# set_isolation_control iso_core1 -domain PD_CORE1 -isolation_signal pwr_iso_en -isolation_sense low
commit_power_intent`,
    beforeMetrics: [
      { label: "Unprotected Cross-Domain Nets", val: "42 Floating Nets", bad: true },
      { label: "Sleep Mode Crowbar Current", val: "+145 mA Surge", bad: true },
      { label: "Always-On Peripheral State", val: "CORRUPTED", bad: true },
    ],
    afterMetrics: [
      { label: "Unprotected Cross-Domain Nets", val: "0 Nets (100% Isolated) ✓", bad: false },
      { label: "Sleep Mode Crowbar Current", val: "0.02 mA (Clean Sleep) ✓", bad: false },
      { label: "Always-On Peripheral State", val: "PROTECTED 100% ✓", bad: false },
    ],
    options: [
      {
        id: "opt_iso_cells",
        label: "Define UPF isolation strategy ('set_isolation') and enable automated isolation cell insertion in Genus ('set_db lp_insert_isolation_cells true')",
        correct: true,
        explanation: "Correct! Isolation cells clamp sleeping domain outputs to safe logic levels, eliminating crowbar currents in always-on power domains.",
      },
      {
        id: "opt_pullup_iso",
        label: "Rely on internal pull-up resistors in standard cells",
        correct: false,
        explanation: "Standard cell pull-ups cannot drive floating inputs without huge static power drain.",
      },
      {
        id: "opt_never_sleep",
        label: "Disable power gating and keep all cores powered permanently",
        correct: false,
        explanation: "Keeping cores powered permanently violates mobile battery standby targets.",
      },
    ],
  },
  {
    id: 42,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Level Shifter Direction Mismatch Across Voltage Domains (0.72V to 0.88V)",
    severity: "HIGH",
    stageName: "Low-Power Mapping / Level Shifter DRC",
    symptom: "Signals traveling from Low-Voltage (0.72V) to High-Voltage (0.88V) domains fail to trigger downstream gates due to threshold voltage drop.",
    logSnippet: `[LP-LS-14] Warning: Missing Level Shifters on 64 nets crossing from 'PD_LOW_VOLT' (0.72V) to 'PD_HIGH_VOLT' (0.88V):
  Signal high level (0.72V) is insufficient to turn off PMOS transistors in 0.88V domain!`,
    principle: "Driving a higher voltage gate with a lower voltage signal keeps the receiving PMOS transistor partially ON, causing massive static leakage and degraded noise margins. Level Shifter (LS) cells shift voltages cleanly.",
    remedyTcl: `set_db lp_insert_level_shifters true
# In UPF:
# set_level_shifter ls_low_to_high -domain PD_LOW_VOLT -applies_to outputs -rule low_to_high
commit_power_intent
syn_generic`,
    beforeMetrics: [
      { label: "Level Shifter Coverage", val: "0 / 64 Nets (Missing)", bad: true },
      { label: "Cross-Domain PMOS Leakage", val: "+84 mW Static Drain", bad: true },
      { label: "Noise Margin", val: "-40% Degraded", bad: true },
    ],
    afterMetrics: [
      { label: "Level Shifter Coverage", val: "64 / 64 Inserted ✓", bad: false },
      { label: "Cross-Domain PMOS Leakage", val: "0.0 mW Leakage ✓", bad: false },
      { label: "Noise Margin", val: "Full Rail-to-Rail ✓", bad: false },
    ],
    options: [
      {
        id: "opt_ls_cells",
        label: "Configure UPF level shifter rules ('set_level_shifter -rule low_to_high') and enable automated insertion ('set_db lp_insert_level_shifters true')",
        correct: true,
        explanation: "Correct! Level shifters boost signal amplitude from 0.72V to full 0.88V rail, completely turning off receiving PMOS transistors.",
      },
      {
        id: "opt_increase_all_voltage",
        label: "Set all domains to 0.88V permanently",
        correct: false,
        explanation: "Running the entire SoC at high voltage increases dynamic power by $+50\%$.",
      },
      {
        id: "opt_standard_buffer_ls",
        label: "Insert standard 0.72V inverters to boost the signal",
        correct: false,
        explanation: "Standard inverters powered by 0.72V cannot output 0.88V.",
      },
    ],
  },
  {
    id: 43,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Multi-Vth Leakage Budget Exhaustion: Excessive LVT Cell Swapping",
    severity: "HIGH",
    stageName: "syn_opt / Multi-Vth Leakage Optimization",
    symptom: "Synthesis mapped 75% of gates to Low-Vt (LVT) cells, causing standby leakage power (85 mW) to exceed the battery limit (15 mW) by 500%!",
    logSnippet: `[POWER-REPORT] Static Sub-threshold Leakage Breakdown:
  LVT Cells: 75.2% (Leakage: 82.4 mW)
  RVT Cells: 18.4% (Leakage: 2.1 mW)
  HVT Cells:  6.4% (Leakage: 0.5 mW)
  Total Leakage = 85.0 mW (Target: 15.0 mW - FAILED).`,
    principle: "Low-Vt (LVT) cells switch fast but leak 10x to 50x more current than High-Vt (HVT) cells. LVT should only be used on the top 5-10% timing-critical paths; non-critical paths must be mapped to HVT.",
    remedyTcl: `set_db max_leakage_power 0.015 [current_design]
set_db opt_leakage_to_dynamic_ratio 0.8
set_db opt_priority_cost_group timing
syn_opt -spatial`,
    beforeMetrics: [
      { label: "LVT Cell Ratio", val: "75.2% (Excessive)", bad: true },
      { label: "Standby Leakage Power", val: "85.0 mW (500% Over)", bad: true },
      { label: "Battery Standby Time", val: "4 Hours (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "LVT Cell Ratio", val: "8.4% (Targeted) ✓", bad: false },
      { label: "Standby Leakage Power", val: "14.2 mW (MET) ✓", bad: false },
      { label: "Battery Standby Time", val: "48 Hours ✓", bad: false },
    ],
    options: [
      {
        id: "opt_multi_vth_recovery",
        label: "Set 'max_leakage_power 0.015' and increase leakage recovery effort ('set_db opt_leakage_to_dynamic_ratio 0.8') to swap non-critical cells to HVT",
        correct: true,
        explanation: "Correct! Genus swaps non-critical timing paths to High-Vt (HVT) cells without degrading overall chip operating frequency.",
      },
      {
        id: "opt_force_all_hvt",
        label: "Ban all LVT cells from the entire library",
        correct: false,
        explanation: "Banning LVT cells entirely prevents critical paths from meeting 1.2 GHz timing.",
      },
      {
        id: "opt_clock_slow_pwr",
        label: "Lower the clock frequency to reduce leakage power",
        correct: false,
        explanation: "Static leakage power is independent of clock frequency ($P_{leak} = I_{leak} \times V_{DD}$).",
      },
    ],
  },
  {
    id: 44,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Power Switch (PSW) In-Rush Current Surge During Domain Wake-Up",
    severity: "HIGH",
    stageName: "UPF Power State Table / In-Rush DRC",
    symptom: "When the DSP domain powers on simultaneously, an 850 mA current spike causes a 250 mV ground bounce, crashing adjacent CPUs.",
    logSnippet: `[PSW-RUSH-02] Alert: 480 header power switches turned on in a single cycle:
  Instantaneous In-rush Current = 850 mA (Rail IR Drop: -250 mV).
  Adjacent Always-On SRAM corrupted by supply voltage sag!`,
    principle: "Power switch networks must turn on in staggered daisy-chain stages (daisy-chain enable) or use two-stage weak-pullup followed by strong-pullup transistors to limit in-rush current surges.",
    remedyTcl: `set_db lp_power_switch_daisy_chain true
set_db lp_power_switch_sleep_ramp_time 50ns
# In UPF: map_power_switch psw_dsp -daisy_chain`,
    beforeMetrics: [
      { label: "Wake-Up In-Rush Surge", val: "850 mA Spike", bad: true },
      { label: "Power Supply Sag (IR Drop)", val: "-250 mV (Fatal)", bad: true },
      { label: "Adjacent CPU State", val: "CRASHED / RESET", bad: true },
    ],
    afterMetrics: [
      { label: "Wake-Up In-Rush Surge", val: "45 mA (Ramped) ✓", bad: false },
      { label: "Power Supply Sag (IR Drop)", val: "-15 mV (Safe) ✓", bad: false },
      { label: "Adjacent CPU State", val: "STABLE 100% ✓", bad: false },
    ],
    options: [
      {
        id: "opt_psw_daisy",
        label: "Enable staggered power switch daisy-chaining ('set_db lp_power_switch_daisy_chain true') and configure ramp-up sleep slew",
        correct: true,
        explanation: "Correct! Staggering the power switch enable pins turns on switches sequentially over 50 ns, keeping in-rush current below 50 mA.",
      },
      {
        id: "opt_remove_power_switches",
        label: "Remove power switches and hardwire domain directly to VDD",
        correct: false,
        explanation: "Removing switches eliminates sleep mode capability.",
      },
      {
        id: "opt_wlm_psw",
        label: "Switch to wire-load models",
        correct: false,
        explanation: "WLMs have no effect on power switch in-rush physics.",
      },
    ],
  },
  {
    id: 45,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Multi-Bit Flop Merging Violating Power Domain Boundaries",
    severity: "CRITICAL",
    stageName: "syn_opt / Multi-Bit Low-Power DRC",
    symptom: "Multi-bit register optimization merged 2 flops from Switchable Domain and 2 flops from Always-On Domain into a single cell, causing sleep mode corruption.",
    logSnippet: `[MBIT-UPF-ERR] Critical: Cell 'mbit_reg_0_3' (DFFHQX4) bridges multiple power domains:
  Bits 0..1 in 'PD_CORE_SLEEP' (Switchable)
  Bits 2..3 in 'PD_ALWAYS_ON' (Continuous VDD)
[UPF-FAIL] Multi-bit cell has single shared VDD pin. Cross-domain cell placement illegal!`,
    principle: "Multi-bit cells share physical power and ground rails. A multi-bit cell must NEVER merge registers belonging to different UPF power domains or different operational clock domains.",
    remedyTcl: `set_db use_multibit_cells true
set_db multibit_cross_power_domain false
set_db multibit_cross_clock_domain false
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Illegal Cross-Domain Cells", val: "28 Multi-Bit Cells", bad: true },
      { label: "UPF Power Integrity", val: "VIOLATED", bad: true },
      { label: "P&R Legalization", val: "REJECTED", bad: true },
    ],
    afterMetrics: [
      { label: "Illegal Cross-Domain Cells", val: "0 Cells (Clean Domains) ✓", bad: false },
      { label: "UPF Power Integrity", val: "100% COMPLIANT ✓", bad: false },
      { label: "P&R Legalization", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_mbit_domain_lock",
        label: "Enforce domain isolation with 'set_db multibit_cross_power_domain false' and 'set_db multibit_cross_clock_domain false'",
        correct: true,
        explanation: "Correct! Restricting multi-bit cell merging within homogeneous power domains ensures each multi-bit cell connects to a single unified power rail.",
      },
      {
        id: "opt_merge_power_domains",
        label: "Merge the Always-On and Sleep domains together in UPF",
        correct: false,
        explanation: "Merging domains eliminates power gating sleep mode.",
      },
      {
        id: "opt_disable_all_mbit_lp",
        label: "Disable all multi-bit optimizations across the chip",
        correct: false,
        explanation: "Disabling multi-bit completely increases clock power by +25%.",
      },
    ],
  },
  {
    id: 46,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Clock Gating Cell Insertion Below Minimum Flop Threshold (Area Bloat)",
    severity: "MEDIUM",
    stageName: "syn_generic / lp_insert_clock_gating",
    symptom: "Synthesis inserted 8,200 ICG cells for single 1-bit registers, increasing standard cell area by +18% while saving zero net power.",
    logSnippet: `[GENUS-CG] Warning: 8,200 ICG cells inserted for register groups with fanout = 1.
  ICG cell area (4.2 um²) exceeds 1-bit flop switching power savings! Net power degraded.`,
    principle: "An Integrated Clock Gating (ICG) cell consumes area and internal leakage. If an ICG only gates 1 or 2 registers, the ICG's own dynamic power and area overhead outweigh the savings. Minimum flop threshold should be $\ge 3$ or $4$.",
    remedyTcl: `set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 4
set_db lp_clock_gating_max_flops 64
syn_generic`,
    beforeMetrics: [
      { label: "ICG Cell Count", val: "8,200 ICGs (Bloated)", bad: true },
      { label: "Net Clock Power Savings", val: "-2.4% (Negative Gain)", bad: true },
      { label: "Silicon Die Area", val: "+18.2% Bloat", bad: true },
    ],
    afterMetrics: [
      { label: "ICG Cell Count", val: "1,420 ICGs (Optimal) ✓", bad: false },
      { label: "Net Clock Power Savings", val: "32.4% Power Saved ✓", bad: false },
      { label: "Silicon Die Area", val: "+1.8% Nominal ✓", bad: false },
    ],
    options: [
      {
        id: "opt_icg_min_flops",
        label: "Set 'set_db lp_clock_gating_min_flops 4' to restrict clock gating insertion to register banks with 4 or more flip-flops",
        correct: true,
        explanation: "Correct! Setting min_flops to 4 ensures that every inserted ICG achieves positive dynamic power savings and avoids cell area bloat.",
      },
      {
        id: "opt_min_flops_1",
        label: "Keep min_flops = 1 and insert inverters",
        correct: false,
        explanation: "Gating 1-bit flops with ICGs always loses power efficiency.",
      },
      {
        id: "opt_disable_all_cg_bloat",
        label: "Disable all clock gating",
        correct: false,
        explanation: "Disabling clock gating causes total dynamic power to double.",
      },
    ],
  },
  {
    id: 47,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Feedthrough Nets Crossing Powered-Down Domains Without Isolation",
    severity: "HIGH",
    stageName: "Floorplan & UPF Routing DRC",
    symptom: "A memory bus from CPU Core 0 to DMA was routed physically across powered-down Core 1, causing bus data to disconnect when Core 1 slept.",
    logSnippet: `[FEEDTHRU-ERR] Error: Net 'core0_to_dma_bus[15:0]' routed across sleep domain 'PD_CORE1':
  When PD_CORE1 is powered down, unbuffered feedthrough signals suffer capacitive coupling and signal loss!`,
    principle: "Feedthrough nets crossing foreign power domains must either be rerouted around the domain boundary or buffered with dedicated always-on feedthrough buffer channels.",
    remedyTcl: `set_db [get_db designs] .lp_auto_create_always_on_buffers true
set_db lp_prevent_feedthrough_in_switchable_domains true
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Illegal Feedthrough Nets", val: "16 Nets", bad: true },
      { label: "Sleep Mode Bus Integrity", val: "DISCONNECTED", bad: true },
      { label: "System DMA Transfers", val: "HANG ON SLEEP", bad: true },
    ],
    afterMetrics: [
      { label: "Illegal Feedthrough Nets", val: "0 Nets (Rerouted) ✓", bad: false },
      { label: "Sleep Mode Bus Integrity", val: "100% OPERATIONAL ✓", bad: false },
      { label: "System DMA Transfers", val: "FLAWLESS SLEEP TRANSFER ✓", bad: false },
    ],
    options: [
      {
        id: "opt_prevent_feedthru",
        label: "Enable 'set_db lp_prevent_feedthrough_in_switchable_domains true' to force spatial placement and routing around foreign power domains",
        correct: true,
        explanation: "Correct! Forcing feedthrough prevention routes signals through always-on corridors, ensuring uninterrupted communication when adjacent blocks sleep.",
      },
      {
        id: "opt_ignore_feedthru",
        label: "Allow signals to float through sleeping domains",
        correct: false,
        explanation: "Floating feedthrough signals cause data corruption and bus lockup.",
      },
      {
        id: "opt_flatten_power",
        label: "Remove UPF power domains",
        correct: false,
        explanation: "Removing power domains destroys power management capabilities.",
      },
    ],
  },
  {
    id: 48,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "State Retention Power Gating (SRPG) Flop Control Signal Inversion",
    severity: "CRITICAL",
    stageName: "UPF Retention Mapping / Sim Signoff",
    symptom: "When waking up from deep sleep, retention flip-flops restore inverted state values, corrupting CPU architecture state registers.",
    logSnippet: `[SRPG-VERIF] Critical: Retention flop 'u_core/pc_reg[31:0]' restore control polarity mismatch:
  UPF specifies 'SAVE_RESTORE_N' (Active Low), but standard cell requires Active High 'RESTORE'.
  All CPU Program Counter bits restored as 1's (~0xFFFFFFFF) instead of saved address!`,
    principle: "State Retention Power Gating (SRPG) cells save internal register state during deep sleep and restore it on wake-up. Polarity mismatch on `save` or `restore` pins causes data inversion or corruption.",
    remedyTcl: `# Correct UPF retention strategy pin polarity:
# set_retention ret_core -domain PD_CORE -retention_power_net VDD_AON -retention_ground_net VSS
# set_retention_control ret_core -domain PD_CORE -save_signal {save_en high} -restore_signal {restore_en high}
commit_power_intent
syn_generic`,
    beforeMetrics: [
      { label: "CPU Program Counter on Wake", val: "0xFFFFFFFF (Corrupt)", bad: true },
      { label: "Retention Data Integrity", val: "INVERTED", bad: true },
      { label: "Post-Sleep Wakeup Success", val: "0% (Crash)", bad: true },
    ],
    afterMetrics: [
      { label: "CPU Program Counter on Wake", val: "0x00008400 (Exact) ✓", bad: false },
      { label: "Retention Data Integrity", val: "100% PRESERVED ✓", bad: false },
      { label: "Post-Sleep Wakeup Success", val: "100% SUCCESS ✓", bad: false },
    ],
    options: [
      {
        id: "opt_srpg_polarity",
        label: "Correct the save and restore signal polarities in UPF to match standard cell library retention pins ('save_signal {save_en high}')",
        correct: true,
        explanation: "Correct! Aligning retention control polarities with standard cell library models ensures registers restore exact pre-sleep state values.",
      },
      {
        id: "opt_disable_srpg",
        label: "Disable state retention and perform cold reboot on every wake-up",
        correct: false,
        explanation: "Cold reboots destroy resume latency and increase wake-up energy consumption.",
      },
      {
        id: "opt_wlm_srpg",
        label: "Apply wire load models to retention cells",
        correct: false,
        explanation: "Wire load models do not alter UPF control polarity.",
      },
    ],
  },
  {
    id: 49,
    domainId: "dft_power",
    domainName: "Low-Power & ICG",
    title: "Dynamic Switching Power Spike Caused by Ungated Register File Arrays",
    severity: "HIGH",
    stageName: "syn_opt / Power Analysis",
    symptom: "A 64x32 register file array consumes 42 mW dynamic power because all 2,048 flip-flops clock on every cycle even when write-enable is low.",
    logSnippet: `[POWER-REPORT] Dynamic Switching Power: Module 'u_regfile_64x32':
  Flop Clock Pin Power = 38.4 mW (91% of block power!).
  Clock gating is absent on 64 words of registers.`,
    principle: "Register files and large memory banks should be synthesized with hierarchical word-level clock gating to ensure only the addressed register word receives an active clock pulse.",
    remedyTcl: `set_db lp_insert_clock_gating true
set_db lp_clock_gating_hierarchical true
set_db lp_clock_gating_style latch
syn_generic`,
    beforeMetrics: [
      { label: "Register File Power", val: "42.0 mW", bad: true },
      { label: "Flop Clock Toggle Rate", val: "100% Cycles", bad: true },
      { label: "Dynamic Power Budget", val: "EXCEEDED", bad: true },
    ],
    afterMetrics: [
      { label: "Register File Power", val: "4.8 mW (-88%) ✓", bad: false },
      { label: "Flop Clock Toggle Rate", val: "1.5% Active Cycles ✓", bad: false },
      { label: "Dynamic Power Budget", val: "WITHIN SPEC ✓", bad: false },
    ],
    options: [
      {
        id: "opt_hier_cg",
        label: "Enable hierarchical fine-grained clock gating: 'set_db lp_clock_gating_hierarchical true' and 'set_db lp_insert_clock_gating true'",
        correct: true,
        explanation: "Correct! Hierarchical clock gating shuts down all 63 inactive register words during write cycles, cutting dynamic power by 88%.",
      },
      {
        id: "opt_delete_regfile",
        label: "Replace the register file with an off-chip DDR interface",
        correct: false,
        explanation: "Off-chip DDR memory increases access latency by 100x.",
      },
      {
        id: "opt_disable_power_opt",
        label: "Disable dynamic power optimization in Genus",
        correct: false,
        explanation: "Disabling power optimization increases battery drain.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 6: DESIGN-FOR-TEST (DFT) & SCAN INSERTION DRC (10 Scenarios)
  // =========================================================================
  {
    id: 50,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Uncontrolled Asynchronous Resets During ATPG Scan Shift",
    severity: "CRITICAL",
    stageName: "DFT DRC / check_dft_rules",
    symptom: "ATPG tool reports 256 scan chain rule violations because asynchronous resets toggle randomly during scan shifting, clearing test vectors.",
    logSnippet: `[DFT-DRC-01] Error: 256 flip-flops failed Scan Shift DRC in chain 'scan_chain_0':
  Pin 'u_core/reg_bank_reg[0..255]/CLR' is active during scan shift mode.
[DFT-DRC-01] Asynchronous reset 'rst_async_n' is not controlled by Test Mode (TM) pin.
[ATPG] Automatic Test Pattern Generation aborted: Scan chain broken.`,
    principle: "During scan shift, test vectors are serially clocked into registers. If an asynchronous reset pin fires during shift mode, all test data is wiped out. DFT rules require muxing the reset with Test Mode (`TM`).",
    remedyTcl: `set_db dft_scan_style muxed_scan
set_db dft_identify_top_level_test_clocks true
fix_dft_violations -async_reset -test_control test_mode_pin -active low
check_dft_rules`,
    beforeMetrics: [
      { label: "Scan Shift DRC Errors", val: "256 Violations", bad: true },
      { label: "ATPG Testability", val: "ABORTED (Broken)", bad: true },
      { label: "Manufacturing Defect Test", val: "0% Coverage", bad: true },
    ],
    afterMetrics: [
      { label: "Scan Shift DRC Errors", val: "0 Errors ✓", bad: false },
      { label: "ATPG Testability", val: "PASSED ✓", bad: false },
      { label: "Manufacturing Defect Test", val: "99.6% Coverage ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fix_dft_async_6",
        label: "Run 'fix_dft_violations -async_reset -test_control test_mode_pin -active low' to gate async resets during scan shift",
        correct: true,
        explanation: "Correct! Gating asynchronous resets with the Test Mode (TM) pin ensures resets are held inactive during scan shifting while remaining fully operational in functional mode.",
      },
      {
        id: "opt_cut_reset_6",
        label: "Disconnect the reset pin from all sequential flip-flops",
        correct: false,
        explanation: "Removing resets prevents the chip from booting up properly.",
      },
      {
        id: "opt_ignore_dft_6",
        label: "Bypass scan chain insertion and use functional vectors only",
        correct: false,
        explanation: "Functional vectors achieve less than 60% test coverage and drastically increase foundry test cost.",
      },
    ],
  },
  {
    id: 51,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Non-Scan Flip-Flops in Core Datapath Destroying Fault Coverage",
    severity: "HIGH",
    stageName: "dft_insert / Scan Mapping",
    symptom: "512 flip-flops were mapped to non-scan standard cells (`DFF`) instead of scan flip-flops (`SDFF`), dropping manufacturing test coverage to 72%.",
    logSnippet: `[DFT-SCAN-MAP] Warning: 512 flip-flops in module 'fpu_pipeline' mapped to non-scan library cells:
  Reason: Instance has 'dont_touch true' or non-scan library constraint.
  Test Fault Coverage dropped from 99.2% to 72.4%!`,
    principle: "All sequential flip-flops must be converted to scan-equivalent cells (`SDFF`) with scan-in (`SI`), scan-enable (`SE`), and scan-out (`SO`) pins to enable 100% stuck-at fault testing.",
    remedyTcl: `set_db dft_scan_style muxed_scan
set_db [get_db lib_cells *SDFF*] .dont_use false
set_db [get_db insts -if {.is_sequential == true}] .dont_touch false
syn_map -physical`,
    beforeMetrics: [
      { label: "Non-Scan Flops", val: "512 Flops", bad: true },
      { label: "ATPG Stuck-At Coverage", val: "72.4% (Unacceptable)", bad: true },
      { label: "Silicon Test Escapes", val: "HIGH DEFECT RATE", bad: true },
    ],
    afterMetrics: [
      { label: "Non-Scan Flops", val: "0 Flops (100% Scan) ✓", bad: false },
      { label: "ATPG Stuck-At Coverage", val: "99.8% Coverage ✓", bad: false },
      { label: "Silicon Test Escapes", val: "0.0 PPM Quality ✓", bad: false },
    ],
    options: [
      {
        id: "opt_force_scan_map",
        label: "Remove 'dont_touch' on sequential cells and allow Genus to map all flops to scan-equivalent cells (SDFF)",
        correct: true,
        explanation: "Correct! Replacing standard DFFs with multiplexed scan flops (SDFF) allows ATPG tools to scan test vectors through every single register.",
      },
      {
        id: "opt_accept_72",
        label: "Accept 72% coverage as sufficient for tapeout",
        correct: false,
        explanation: "72% coverage results in thousands of defective chips being shipped to customers.",
      },
      {
        id: "opt_wlm_scan",
        label: "Apply wire load models to scan chains",
        correct: false,
        explanation: "WLMs do not convert cells to scan flip-flops.",
      },
    ],
  },
  {
    id: 52,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Clock Domain Crossing Inside a Single Scan Chain Causing Hold Races",
    severity: "CRITICAL",
    stageName: "dft_connect / ScanDEF Stitching",
    symptom: "Scan chain stitched flip-flops from 1.2 GHz Core clock directly into 250 MHz PCIe clock, causing hold violations during scan shift.",
    logSnippet: `[DFT-STITCH-ERR] Error: Scan chain 'chain_3' crosses clock domains without a Lockup Latch:
  Driving Flop: 'u_core/reg_a' (Clock: clk_core_1g2)
  Receiving Flop: 'u_pcie/reg_b' (Clock: clk_pcie_250m)
[DFT-HOLD-RACE] Clock skew between domains causes scan data shift corruption!`,
    principle: "When a scan chain crosses between different clock domains or clock branches with significant skew, an active-low Lockup Latch must be inserted to hold data for half a clock cycle, eliminating scan shift hold races.",
    remedyTcl: `set_db dft_mix_clock_domains true
set_db dft_lockup_element latch
set_db dft_lockup_cell [get_db lib_cells *LATP_LOCKUP*]
connect_scan_chains -auto_create_lockup_latches true`,
    beforeMetrics: [
      { label: "Cross-Domain Lockup Latches", val: "0 (Missing)", bad: true },
      { label: "Scan Shift Hold Slack", val: "-450 ps (CORRUPTED)", bad: true },
      { label: "Tester Scan Shift Speed", val: "BROKEN", bad: true },
    ],
    afterMetrics: [
      { label: "Cross-Domain Lockup Latches", val: "8 Inserted ✓", bad: false },
      { label: "Scan Shift Hold Slack", val: "+220 ps (MET) ✓", bad: false },
      { label: "Tester Scan Shift Speed", val: "100 MHz Shift ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lockup_latches",
        label: "Configure automatic lockup latch insertion at clock domain boundaries ('set_db dft_lockup_element latch' and 'connect_scan_chains')",
        correct: true,
        explanation: "Correct! Lockup latches delay scan data by half a clock cycle at domain crossings, guaranteeing robust shift operation regardless of clock skew.",
      },
      {
        id: "opt_slow_scan_clk",
        label: "Slow down the tester scan shift clock to 10 kHz",
        correct: false,
        explanation: "A 10 kHz scan clock increases wafer test time from seconds to hours, multiplying production testing costs.",
      },
      {
        id: "opt_separate_chains",
        label: "Combine all clocks into a single unskewed wire",
        correct: false,
        explanation: "Physically different clocks cannot be merged on silicon without clock tree corruption.",
      },
    ],
  },
  {
    id: 53,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Dual-Edge Triggered Registers Breaking Synchronous Scan Shift",
    severity: "HIGH",
    stageName: "check_dft_rules / Scan DRC",
    symptom: "Synthesis inferred negedge-triggered flip-flops interspersed with posedge flops in the same scan chain, corrupting shifted data.",
    logSnippet: `[DFT-EDGE-02] Warning: Scan chain 'chain_1' mixes posedge and negedge registers:
  Posedge Flop 'reg_1' -> Negedge Flop 'reg_2' (Captures data on half cycle!).
[DFT-DRC] Data shifted through 'reg_1' is overwritten prematurely on falling clock edge.`,
    principle: "In scan chains mixing posedge and negedge registers, all negedge registers MUST be placed first in the chain before posedge registers, or lockup latches must be inserted between them.",
    remedyTcl: `set_db dft_order_scan_edges { negedge posedge }
connect_scan_chains -auto_order_edges true`,
    beforeMetrics: [
      { label: "Scan Edge Order", val: "Posedge -> Negedge (Broken)", bad: true },
      { label: "Scan Shift Shiftability", val: "DATA OVERWRITTEN", bad: true },
      { label: "ATPG Scan Validation", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Scan Edge Order", val: "Negedge -> Posedge (Ordered) ✓", bad: false },
      { label: "Scan Shift Shiftability", val: "100% CLEAN SHIFT ✓", bad: false },
      { label: "ATPG Scan Validation", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_order_scan_edges",
        label: "Enforce correct edge ordering with 'set_db dft_order_scan_edges {negedge posedge}' during scan chain stitching",
        correct: true,
        explanation: "Correct! Stitching falling-edge registers before rising-edge registers ensures that posedge clock edges do not overwrite negedge flop data.",
      },
      {
        id: "opt_inverter_on_scan_out",
        label: "Add an inverter to the scan-out pin",
        correct: false,
        explanation: "An inverter does not solve clock edge timing misalignment inside the shift chain.",
      },
      {
        id: "opt_remove_negedge_flops",
        label: "Delete all negedge registers from the design",
        correct: false,
        explanation: "Deleting registers breaks dual-edge protocol interfaces.",
      },
    ],
  },
  {
    id: 54,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Embedded SRAM MBIST Collar Isolation Failure",
    severity: "HIGH",
    stageName: "DFT Insertion / Memory BIST",
    symptom: "Memory Built-In Self-Test (MBIST) engine fails to test 4 SRAM macros because functional logic pins were not multiplexed with MBIST test pins.",
    logSnippet: `[MBIST-COLLAR-04] Error: SRAM macro 'sram_256kb_0' input 'CEN' driven by core logic during MBIST test mode:
  BIST controller cannot drive chip-enable pin! Memory test aborted.`,
    principle: "Hard memory macros must have test wrapper collars with multiplexers that disconnect functional RTL drivers and route MBIST controller test vectors during memory test mode.",
    remedyTcl: `set_db dft_auto_insert_mbist_collars true
set_db dft_mbist_test_control_pin test_mode
syn_opt -spatial`,
    beforeMetrics: [
      { label: "MBIST Collar Isolation", val: "0 / 4 Macros (Contention)", bad: true },
      { label: "SRAM Defect Coverage", val: "0% (Untested)", bad: true },
      { label: "Memory Yield Signoff", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "MBIST Collar Isolation", val: "4 / 4 Isolated Collars ✓", bad: false },
      { label: "SRAM Defect Coverage", val: "99.9% MBIST Test ✓", bad: false },
      { label: "Memory Yield Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_mbist_collars",
        label: "Insert dedicated MBIST isolation collars ('set_db dft_auto_insert_mbist_collars true') to mux memory pins during test mode",
        correct: true,
        explanation: "Correct! MBIST test collars grant the BIST controller exclusive control over SRAM address, data, and chip-enable pins during memory test mode.",
      },
      {
        id: "opt_wire_mbist_parallel",
        label: "Hardwire MBIST controller in parallel with functional wires",
        correct: false,
        explanation: "Parallel wiring creates multidriven bus short circuits.",
      },
      {
        id: "opt_skip_sram_test",
        label: "Skip memory testing and test logic only",
        correct: false,
        explanation: "SRAM macros represent 60% of total die area; skipping memory test results in massive silicon yield fallout.",
      },
    ],
  },
  {
    id: 55,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Scan Chain Length Imbalance Causing Excessive ATE Test Time",
    severity: "MEDIUM",
    stageName: "dft_connect / Scan Balancing",
    symptom: "Scan Chain 0 has 2,400 flip-flops while Chains 1..7 have only 300 flip-flops, causing automated test equipment (ATE) testing time to be 8x longer than necessary.",
    logSnippet: `[DFT-BALANCE] Warning: Severe scan chain length imbalance detected:
  Chain 0: 2,400 flops (Shift cycles: 2,400)
  Chains 1..7: 300 flops (Shift cycles: 300)
  Total ATE test time governed by longest chain: 2,400 cycles per pattern!`,
    principle: "ATE test time is directly proportional to the length of the longest scan chain ($T_{test} = N_{patterns} \times L_{max}$). Scan chains should be balanced with equal flop counts across all channels.",
    remedyTcl: `set_db dft_num_scan_chains 8
set_db dft_max_scan_chain_length 350
set_db dft_balance_scan_chains true
connect_scan_chains`,
    beforeMetrics: [
      { label: "Longest Chain Length", val: "2,400 Flops (Imbalanced)", bad: true },
      { label: "ATE Test Time per Die", val: "14.2 Seconds", bad: true },
      { label: "Production Test Cost", val: "HIGH ($0.45/die)", bad: true },
    ],
    afterMetrics: [
      { label: "Longest Chain Length", val: "320 Flops (Balanced) ✓", bad: false },
      { label: "ATE Test Time per Die", val: "1.9 Seconds (-86%) ✓", bad: false },
      { label: "Production Test Cost", val: "LOW ($0.06/die) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_balance_scan",
        label: "Configure automatic scan chain balancing: 'set_db dft_balance_scan_chains true' and 'set_db dft_max_scan_chain_length 350'",
        correct: true,
        explanation: "Correct! Balancing all 8 scan chains evenly to ~320 flops slashes ATE test time by 86% without adding silicon area.",
      },
      {
        id: "opt_single_long_chain",
        label: "Merge everything into a single 4,800-flop scan chain",
        correct: false,
        explanation: "A single long chain makes test time even worse (4,800 cycles).",
      },
      {
        id: "opt_reduce_atpg_patterns",
        label: "Cut the number of test patterns by 90%",
        correct: false,
        explanation: "Cutting test patterns reduces fault coverage and allows defective chips to escape.",
      },
    ],
  },
  {
    id: 56,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Test Mode Control Signal De-Assertion During ATPG Capture Cycles",
    severity: "HIGH",
    stageName: "ATPG Setup / Scan Protocol",
    symptom: "ATPG capture simulation fails because the `scan_enable` (SE) signal is too slow to switch between shift (1) and capture (0) at full clock frequency.",
    logSnippet: `[ATPG-ATSPEED] Error: Transition fault capture failed on 480 paths:
  Signal 'scan_enable' transition time = 1.4 ns (Clock cycle: 0.833 ns).
  Scan enable failed to settle to 0 before launch-to-capture clock pulse!`,
    principle: "At-speed scan testing (transition fault testing) requires `scan_enable` to toggle between shift mode (1) and functional capture mode (0) in a single clock cycle. `scan_enable` must be routed as a high-priority clock tree net.",
    remedyTcl: `set_db dft_scan_enable_is_clock_tree true
set_max_transition 0.150 [get_ports scan_enable]
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Scan Enable Slew", val: "1.40 ns (Sluggish)", bad: true },
      { label: "At-Speed Transition Coverage", val: "0% (Failed)", bad: true },
      { label: "Delay Fault Screening", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Scan Enable Slew", val: "0.12 ns (High-Speed CTS) ✓", bad: false },
      { label: "At-Speed Transition Coverage", val: "98.4% (MET) ✓", bad: false },
      { label: "Delay Fault Screening", val: "100% VERIFIED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_se_cts_tree",
        label: "Treat 'scan_enable' as a high-speed clock tree net ('set_db dft_scan_enable_is_clock_tree true') with strict 150 ps transition limits",
        correct: true,
        explanation: "Correct! Synthesizing a low-latency clock tree for scan_enable allows at-speed transition testing without capture cycle timing corruption.",
      },
      {
        id: "opt_slow_atspeed_clk",
        label: "Slow down the at-speed capture clock by 50%",
        correct: false,
        explanation: "Slowing down the at-speed clock invalidates delay defect detection at nominal 1.2 GHz frequency.",
      },
      {
        id: "opt_disable_transition_test",
        label: "Disable transition fault testing and use stuck-at only",
        correct: false,
        explanation: "Stuck-at testing cannot detect small delay defects in FinFET interconnects.",
      },
    ],
  },
  {
    id: 57,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "ScanDEF Physical Reordering Mismatch in Post-Placement Netlist",
    severity: "HIGH",
    stageName: "Physical Synthesis / ScanDEF Reordering",
    symptom: "Innovus reordered scan chains to optimize physical wire length, but synthesis netlist was not updated, breaking Conformal LEC.",
    logSnippet: `[SCANDEF-MISMATCH] Warning: Scan chain 'chain_0' connection order differs between logical netlist and placed DEF:
  Logical: DFF_A -> DFF_B -> DFF_C
  Placed DEF: DFF_A -> DFF_C -> DFF_B (Optimized for routing length)
[CONFORMAL-LEC] LEC failed due to unmapped scan-in/scan-out pins!`,
    principle: "Physical design tools reorder scan chains to minimize routing congestion. Genus must export a standardized ScanDEF file (`write_scandef`) so downstream P&R and Conformal LEC maintain synchronized scan topology.",
    remedyTcl: `write_scandef > handoff/dft/soc_top.scandef
write_do_lec -scandef handoff/dft/soc_top.scandef > lec/inputs/dft_lec.do`,
    beforeMetrics: [
      { label: "Scan Routing Wirelength", val: "+34% Congested Wire", bad: true },
      { label: "ScanDEF Export", val: "MISSING", bad: true },
      { label: "Conformal LEC Signoff", val: "LEC ABORTED", bad: true },
    ],
    afterMetrics: [
      { label: "Scan Routing Wirelength", val: "Optimal (-34% Wire) ✓", bad: false },
      { label: "ScanDEF Export", val: "SYNCED SCANDEF ✓", bad: false },
      { label: "Conformal LEC Signoff", val: "100% EQUIVALENT ✓", bad: false },
    ],
    options: [
      {
        id: "opt_write_scandef",
        label: "Export standardized ScanDEF ('write_scandef') and include ScanDEF in Conformal LEC dofile generation",
        correct: true,
        explanation: "Correct! ScanDEF provides the exact physical scan chain ordering to Innovus and Conformal LEC, maintaining formal equivalence.",
      },
      {
        id: "opt_lock_scan_order",
        label: "Prohibit physical design tools from reordering scan chains",
        correct: false,
        explanation: "Prohibiting scan reordering causes severe routing congestion and extra metal wire overhead.",
      },
      {
        id: "opt_delete_scandef",
        label: "Delete the ScanDEF file",
        correct: false,
        explanation: "Deleting ScanDEF prevents P&R tools from understanding scan chain topology.",
      },
    ],
  },
  {
    id: 58,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Tri-State Internal Net Floating During ATPG Pattern Evaluation",
    severity: "MEDIUM",
    stageName: "ATPG DRC / Tri-State X-State",
    symptom: "ATPG pattern generation aborts on 12% of faults because bidirectional I/O pads enter high-impedance (Z) states, propagating unknown 'X' values.",
    logSnippet: `[ATPG-DRC-TRI] Warning: Bus 'ext_data_bus[31:0]' floats to Z during scan capture:
  High-impedance Z state converted to unknown X, blocking 1,400 fault detection points.`,
    principle: "During scan testing, bidirectional pads and tri-state lines must be forced into safe drive states (e.g. input mode with pull-down) to avoid X-state corruption in ATPG signatures.",
    remedyTcl: `fix_dft_violations -tristate -test_control test_mode_pin -active high
set_db dft_tie_value_for_tristate 0`,
    beforeMetrics: [
      { label: "ATPG X-State Points", val: "1,400 X-Nodes", bad: true },
      { label: "Untestable Faults", val: "12% Aborted", bad: true },
      { label: "ATPG Test Coverage", val: "87.4% (Degraded)", bad: true },
    ],
    afterMetrics: [
      { label: "ATPG X-State Points", val: "0 X-Nodes ✓", bad: false },
      { label: "Untestable Faults", val: "0 Aborted ✓", bad: false },
      { label: "ATPG Test Coverage", val: "99.7% Coverage ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fix_tristate_dft",
        label: "Run 'fix_dft_violations -tristate -test_control test_mode_pin' to force tri-state pads into active receive states during test mode",
        correct: true,
        explanation: "Correct! Forcing deterministic logic levels on tri-state buses eliminates X-state propagation and restores 99.7% ATPG fault coverage.",
      },
      {
        id: "opt_ignore_x_atpg",
        label: "Configure ATPG tool to ignore all X-state outputs",
        correct: false,
        explanation: "Ignoring X-states blinds the tester to real manufacturing defects.",
      },
      {
        id: "opt_wlm_tristate",
        label: "Switch to wire-load models",
        correct: false,
        explanation: "Wire load models do not resolve electrical tri-state Z-states.",
      },
    ],
  },
  {
    id: 59,
    domainId: "dft_scan",
    domainName: "DFT & Scan Chain DRC",
    title: "Shadow Register Redundancy Causing ATPG Over-Testing",
    severity: "MEDIUM",
    stageName: "DFT Optimization / Shadow Flops",
    symptom: "Synthesis inserted shadow scan flip-flops on 256 already-observable pipeline registers, adding +4% redundant silicon area.",
    logSnippet: `[DFT-SHADOW] Information: 256 shadow scan flops inserted for registers with existing scan access.
  Area penalty: +4,200 um².`,
    principle: "Shadow flip-flops should only be inserted on non-scan legacy macros or asynchronous boundary registers that cannot be converted to standard SDFFs.",
    remedyTcl: `set_db dft_shadow_registers false
set_db dft_scan_style muxed_scan
syn_opt -spatial`,
    beforeMetrics: [
      { label: "Redundant Shadow Flops", val: "256 Cells", bad: true },
      { label: "Redundant Area Bloat", val: "+4,200 um²", bad: true },
      { label: "Test Coverage", val: "99.8%", bad: false },
    ],
    afterMetrics: [
      { label: "Redundant Shadow Flops", val: "0 Cells ✓", bad: false },
      { label: "Redundant Area Bloat", val: "0.0% (Clean) ✓", bad: false },
      { label: "Test Coverage", val: "99.8% (Maintained) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_disable_shadow",
        label: "Disable redundant shadow register insertion ('set_db dft_shadow_registers false') and use direct SDFF mapping",
        correct: true,
        explanation: "Correct! Using native SDFF multiplexed scan cells eliminates 256 redundant shadow flops while maintaining 99.8% test coverage.",
      },
      {
        id: "opt_delete_all_scan",
        label: "Delete all scan chains",
        correct: false,
        explanation: "Deleting scan chains makes chip manufacturing verification impossible.",
      },
      {
        id: "opt_flatten_shadow",
        label: "Flatten the netlist",
        correct: false,
        explanation: "Flattening does not remove shadow registers.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 7: LOGIC EQUIVALENCE CHECKING (LEC) & SIGNOFF HANDOFF (10 Scenarios)
  // =========================================================================
  {
    id: 60,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Conformal LEC Non-Equivalence Caused by Undocumented Inverted Clocks",
    severity: "CRITICAL",
    stageName: "Formal Verification / Conformal LEC",
    symptom: "Cadence Conformal LEC reports 64 Non-Equivalent key points between Golden RTL and Revised Netlist because clock inverter cell was optimized.",
    logSnippet: `[CONFORMAL-COMPARE] Error: 64 Non-Equivalent comparison points:
  Golden RTL: 'u_core/reg_bank_reg[0..63]' (Clock: clk_in)
  Revised Netlist: 'u_core/reg_bank_reg[0..63]' (Clock: clk_in_b / Inverted Phase)
[LEC-FAIL] Output logic cones evaluated as mathematically opposite!`,
    principle: "When synthesis inverts clock polarities to meet setup/hold timing or optimize clock gating, the formal equivalence tool must be informed via clock inversion pin constraints in the LEC dofile.",
    remedyTcl: `write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/inputs/run_lec.do
# In Conformal LEC:
# add_pin_constraints 0 clk_in -golden
# add_pin_constraints 0 clk_in -revised
# add_renaming_rule -clock_inversion`,
    beforeMetrics: [
      { label: "LEC Non-Equivalent Points", val: "64 Points (FAILED)", bad: true },
      { label: "Formal Signoff Status", val: "REJECTED", bad: true },
      { label: "Tapeout Mask Release", val: "HOLD / BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "LEC Non-Equivalent Points", val: "0 Points (100% Equivalent) ✓", bad: false },
      { label: "Formal Signoff Status", val: "PASSED ✓", bad: false },
      { label: "Tapeout Mask Release", val: "APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lec_clock_rule",
        label: "Export automated Genus Conformal LEC dofile ('write_do_lec') and add clock phase constraints in Conformal",
        correct: true,
        explanation: "Correct! `write_do_lec` exports exact clock inversion and synthesis mapping rules, allowing Conformal to prove mathematical equivalence.",
      },
      {
        id: "opt_ignore_lec_diff",
        label: "Override LEC failure and release masks anyway",
        correct: false,
        explanation: "Overriding formal verification failures leads to non-functional silicon and catastrophic mask respins.",
      },
      {
        id: "opt_remove_clock_inverters",
        label: "Manually delete clock inverters from the gate netlist",
        correct: false,
        explanation: "Manual netlist editing causes severe hold violations and electrical DRC failures.",
      },
    ],
  },
  {
    id: 61,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Unreachable State Space Differences in One-Hot FSM Encoding",
    severity: "HIGH",
    stageName: "Formal Verification / FSM Equivalence",
    symptom: "Conformal LEC reports non-equivalence on state machine registers because Genus re-encoded binary FSM states into one-hot encoding.",
    logSnippet: `[CONFORMAL-FSM] Error: Comparison point 'u_fsm/state_reg[2:0]' not mapped:
  Golden RTL has 3 binary state registers (8 states); Revised Netlist has 5 one-hot registers.
  Unreachable state space (32 - 5 = 27 states) evaluated as non-equivalent!`,
    principle: "One-hot FSM encoding introduces unreachable state bit combinations (e.g. two bits high simultaneously). Conformal LEC requires unreachable state space modeling or FSM extraction constraints (`set_fsm_encoding`).",
    remedyTcl: `set_db [get_db modules fsm_unit] .fsm_encoding user
# Or in Conformal LEC:
# read_design -enum_encoding_file fsm_map.txt
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_fsm.do`,
    beforeMetrics: [
      { label: "Unmapped FSM State Points", val: "5 State Registers", bad: true },
      { label: "LEC Verification Result", val: "NON-EQUIVALENT", bad: true },
      { label: "FSM State Mapping", val: "UNSYNCHRONIZED", bad: true },
    ],
    afterMetrics: [
      { label: "Unmapped FSM State Points", val: "0 Points (Mapped) ✓", bad: false },
      { label: "LEC Verification Result", val: "EQUIVALENT ✓", bad: false },
      { label: "FSM State Mapping", val: "100% CONFORMED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fsm_enum_lec",
        label: "Export FSM state mapping table with 'write_do_lec' or configure 'set_db fsm_encoding user' to preserve RTL state representations",
        correct: true,
        explanation: "Correct! Exporting FSM re-encoding mappings allows Conformal LEC to constrain unreachable state space and prove functional equivalence.",
      },
      {
        id: "opt_disable_fsm_verif",
        label: "Exclude state machines from formal equivalence checking",
        correct: false,
        explanation: "State machines control core processor logic; excluding them leaves control logic unverified.",
      },
      {
        id: "opt_wlm_fsm",
        label: "Apply wire load models to FSM registers",
        correct: false,
        explanation: "Wire load models do not alter FSM boolean state space representations.",
      },
    ],
  },
  {
    id: 62,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "LEC Pin-Swapping Abort on Symmetrical Standard Cell Inputs",
    severity: "MEDIUM",
    stageName: "Formal Verification / Pin Swapping",
    symptom: "Conformal LEC aborts comparison on 180 NAND/NOR gates because synthesis swapped logically equivalent input pins (A and B) for timing optimization.",
    logSnippet: `[CONFORMAL-PIN] Warning: 180 comparison points aborted due to input pin permutations:
  Cell 'NAND2X1': Golden connects to Pin A; Revised connects to Pin B.
  Formal solver timed out searching symmetrical pin combinations.`,
    principle: "Standard cell inputs for symmetrical boolean gates (NAND, NOR, AND, XOR) can be swapped physically to connect faster arrival paths to faster pins. Conformal LEC must enable pin-swapping symmetry analysis.",
    remedyTcl: `# In Conformal LEC:
# set_flatten_model -seq_constant -gated_clock
# set_analyze_option -auto
# add_pin_equivalence -library
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_symm.do`,
    beforeMetrics: [
      { label: "Aborted LEC Points", val: "180 Gates (Timeout)", bad: true },
      { label: "LEC Run Duration", val: "3 Hours (Stalled)", bad: true },
      { label: "Formal Signoff", val: "INCOMPLETE", bad: true },
    ],
    afterMetrics: [
      { label: "Aborted LEC Points", val: "0 Gates (All Resolved) ✓", bad: false },
      { label: "LEC Run Duration", val: "45 Seconds ✓", bad: false },
      { label: "Formal Signoff", val: "100% PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lec_pin_equiv",
        label: "Enable library pin-swapping equivalence in Conformal LEC ('add_pin_equivalence -library') and run automated analysis",
        correct: true,
        explanation: "Correct! Enabling pin equivalence informs Conformal that inputs A and B of NAND/NOR gates are mathematically commutative, instantly resolving all 180 aborted points.",
      },
      {
        id: "opt_ban_pin_swapping",
        label: "Disable all pin swapping in Genus synthesis",
        correct: false,
        explanation: "Disabling pin swapping degrades path setup timing by +80 ps.",
      },
      {
        id: "opt_flatten_all_gates",
        label: "Flatten all gates into transistor switch-level netlists",
        correct: false,
        explanation: "Switch-level formal verification causes exponential runtime explosion.",
      },
    ],
  },
  {
    id: 63,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Blackbox Model Mismatch on Analog PLL / Memory IP Blocks",
    severity: "HIGH",
    stageName: "Formal Verification / Blackbox DRC",
    symptom: "Conformal LEC fails because Golden RTL instantiated an analog PLL behavioral model with internal registers, while Revised Netlist instantiated a blackbox cell.",
    logSnippet: `[CONFORMAL-BBOX] Error: Blackbox mismatch on module 'pll_analog_top':
  Golden Design: Module contains 4 internal registers and behavioral clocks.
  Revised Netlist: Module is an empty blackbox shell. 4 Golden registers unmapped!`,
    principle: "Analog IP (PLL, LDO, Bandgap) and memory macros must have identical blackbox boundaries in both Golden and Revised designs (`set_black_box`).",
    remedyTcl: `# In Conformal LEC:
# set_black_box -design golden pll_analog_top
# set_black_box -design revised pll_analog_top
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_bbox.do`,
    beforeMetrics: [
      { label: "Unmapped Blackbox Registers", val: "4 Registers", bad: true },
      { label: "LEC Signoff Result", val: "NON-EQUIVALENT", bad: true },
      { label: "Analog Boundary Match", val: "MISMATCH", bad: true },
    ],
    afterMetrics: [
      { label: "Unmapped Blackbox Registers", val: "0 (Both Blackbox) ✓", bad: false },
      { label: "LEC Signoff Result", val: "EQUIVALENT ✓", bad: false },
      { label: "Analog Boundary Match", val: "100% IDENTICAL SHELL ✓", bad: false },
    ],
    options: [
      {
        id: "opt_set_black_box_both",
        label: "Declare the analog PLL as a blackbox in both Golden and Revised views ('set_black_box pll_analog_top')",
        correct: true,
        explanation: "Correct! Blackboxing non-synthesizable analog macros consistently in both Golden and Revised designs enables clean formal boundary verification.",
      },
      {
        id: "opt_synthesize_pll",
        label: "Attempt to synthesize analog VCO transistors into digital NAND gates",
        correct: false,
        explanation: "Analog oscillators cannot be synthesized into digital standard cells.",
      },
      {
        id: "opt_delete_pll",
        label: "Delete the PLL instance entirely",
        correct: false,
        explanation: "Deleting the PLL breaks chip clock generation.",
      },
    ],
  },
  {
    id: 64,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "User Pragmas (synopsys full_case / parallel_case) Causing RTL Mismatch",
    severity: "CRITICAL",
    stageName: "Formal Verification / RTL Pragma Hazards",
    symptom: "RTL simulation passes but Conformal LEC fails with non-equivalence because `// synopsys full_case` caused synthesis to synthesize hardware that differs from simulation!",
    logSnippet: `[CONFORMAL-PRAGMA] Critical: Logic mismatch in module 'priority_encoder':
  RTL Simulation treats unspecified cases as latched/unchanged.
  Synthesis with 'full_case' pragma treated unspecified cases as don't-care (X-assignment), creating hardware differences!`,
    principle: "The use of legacy pragmas `// synopsys full_case` or `parallel_case` is dangerous because simulators ignore comments while synthesis tools interpret them as design constraints, creating a fatal RTL-vs-Silicon mismatch.",
    remedyTcl: `# In RTL: Remove all full_case/parallel_case pragmas!
# Replace with standard SystemVerilog:
# unique case (sel)
# priority case (sel)
# default: out = '0;`,
    beforeMetrics: [
      { label: "RTL vs Gate Equivalence", val: "NON-EQUIVALENT (Pragma Bug)", bad: true },
      { label: "Simulation vs Silicon", val: "FUNCTIONAL MISMATCH", bad: true },
      { label: "Tapeout Safety", val: "FATAL BUG ESCAPE", bad: true },
    ],
    afterMetrics: [
      { label: "RTL vs Gate Equivalence", val: "100% BIT-EXACT EQUIVALENT ✓", bad: false },
      { label: "Simulation vs Silicon", val: "100% SYNCHRONIZED ✓", bad: false },
      { label: "Tapeout Safety", val: "SIGN-OFF APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_remove_pragmas",
        label: "Remove legacy full_case/parallel_case pragmas from RTL and use SystemVerilog 'unique case' / explicit default assignments",
        correct: true,
        explanation: "Correct! Eliminating synthesis-directive pragmas ensures that RTL simulation, synthesis compilation, and formal verification interpret identical boolean logic.",
      },
      {
        id: "opt_ignore_pragma_lec",
        label: "Tell Conformal LEC to ignore RTL case statements",
        correct: false,
        explanation: "Ignoring case statements skips critical decode logic verification.",
      },
      {
        id: "opt_flatten_case",
        label: "Flatten all case statements into lookup tables",
        correct: false,
        explanation: "Flattening does not resolve pragma mismatch semantics.",
      },
    ],
  },
  {
    id: 65,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Datapath Arithmetic Multiplier Formal Verification Abort",
    severity: "HIGH",
    stageName: "Formal Verification / Datapath Solver",
    symptom: "Conformal LEC times out after 4 hours trying to verify a 64-bit Booth/Wallace multiplier against RTL `a * b`.",
    logSnippet: `[CONFORMAL-DP] Warning: 64-bit Multiplier architecture 'u_mac/mult_inst' solver timeout:
  BDD/SAT engines unable to prove 64-bit non-linear polynomial equivalence.
  Comparison point aborted: 'prod_out[63:0]' (Unresolved).`,
    principle: "General boolean SAT/BDD solvers cannot solve non-linear multi-bit polynomial arithmetic (multipliers) without specialized algebraic word-level datapath solver engines (`set_datapath_solver`).",
    remedyTcl: `# In Conformal LEC:
# set_datapath_solver true
# set_analyze_option -datapath
# add_multiplier_architecture -auto
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_dp.do`,
    beforeMetrics: [
      { label: "Multiplier Verification Status", val: "ABORTED (Timeout)", bad: true },
      { label: "Solver Runtime", val: "4 Hours (Stalled)", bad: true },
      { label: "Formal Signoff", val: "INCOMPLETE", bad: true },
    ],
    afterMetrics: [
      { label: "Multiplier Verification Status", val: "EQUIVALENT 100% ✓", bad: false },
      { label: "Solver Runtime", val: "18 Seconds ✓", bad: false },
      { label: "Formal Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lec_datapath_solver",
        label: "Enable Conformal advanced algebraic datapath solver engine ('set_datapath_solver true' and 'set_analyze_option -datapath')",
        correct: true,
        explanation: "Correct! The datapath solver uses polynomial ring algebra to verify 64-bit Booth/Wallace multiplier architectures in seconds.",
      },
      {
        id: "opt_reduce_multiplier_size",
        label: "Downsize the multiplier to 8-bit for verification",
        correct: false,
        explanation: "Downsizing does not prove 64-bit hardware equivalence.",
      },
      {
        id: "opt_replace_mult_with_add",
        label: "Replace multiplication with repeated addition",
        correct: false,
        explanation: "Repeated addition is 64x slower and consumes excessive silicon area.",
      },
    ],
  },
  {
    id: 66,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Floating Unloaded Nets Causing False Comparison Point Mismatches",
    severity: "MEDIUM",
    stageName: "Formal Verification / Netlist Comparison",
    symptom: "Conformal LEC flags 38 false non-equivalent points on internal test nets that were pruned by synthesis area optimization.",
    logSnippet: `[CONFORMAL-COMPARE] Warning: 38 Golden comparison points have no equivalent in Revised Netlist:
  Golden: 'u_debug/trace_buffer_reg[31:0]' (Unconnected in top-level).
  Revised: Points deleted by synthesis optimization.`,
    principle: "Unconnected RTL registers with no downstream silicon fanout are deleted by synthesis compilers. Conformal LEC must be configured to identify and remove unreachable unconnected key points (`set_flatten_model -seq_constant -unreach`).",
    remedyTcl: `# In Conformal LEC:
# set_flatten_model -seq_constant -unreach
# set_compare_options -flatten_unreachable
# run_compare`,
    beforeMetrics: [
      { label: "False Non-Equivalent Points", val: "38 False Errors", bad: true },
      { label: "Verification Triage Effort", val: "HIGH (Manual Audit)", bad: true },
      { label: "Automated Signoff", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "False Non-Equivalent Points", val: "0 False Errors ✓", bad: false },
      { label: "Verification Triage Effort", val: "0 Manual Audits ✓", bad: false },
      { label: "Automated Signoff", val: "100% AUTOMATED PASS ✓", bad: false },
    ],
    options: [
      {
        id: "opt_flatten_unreach",
        label: "Configure Conformal to prune unreachable state points ('set_flatten_model -seq_constant -unreach')",
        correct: true,
        explanation: "Correct! Pruning unreachable and unloaded key points eliminates false comparison errors on unconnected RTL test signals.",
      },
      {
        id: "opt_preserve_all_wires",
        label: "Force synthesis to keep all unused wires",
        correct: false,
        explanation: "Preserving all unused wires bloats silicon die area with useless dead gates.",
      },
      {
        id: "opt_wlm_lec",
        label: "Apply wire load models to LEC",
        correct: false,
        explanation: "Wire load models are physical estimation tools, not formal logic engines.",
      },
    ],
  },
  {
    id: 67,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Scan Chain Insertion Verification (write_do_lec golden_design)",
    severity: "HIGH",
    stageName: "Formal Verification / Netlist-to-Netlist Scan LEC",
    symptom: "Comparing Pre-Scan Netlist against Post-Scan Netlist fails because scan-in multiplexers altered functional register input logic cones.",
    logSnippet: `[CONFORMAL-SCAN] Error: 4,800 non-equivalent points between Pre-Scan and Post-Scan Netlists:
  Flop input D driven by 'scan_in' instead of functional combinational logic!
[LEC-FAIL] Conformal evaluated scan shift mode instead of functional mode.`,
    principle: "When verifying Post-Scan netlists against Pre-Scan netlists, the `test_mode` and `scan_enable` (SE) signals must be constrained to logic 0 (functional mode) in Conformal LEC.",
    remedyTcl: `write_do_lec -golden_design outputs/pre_scan_netlist.v \\
             -revised_design outputs/post_scan_netlist.v > lec/inputs/scan_lec.do
# In Conformal LEC:
# add_pin_constraints 0 scan_enable -revised
# add_pin_constraints 0 test_mode   -revised`,
    beforeMetrics: [
      { label: "Scan Non-Equivalent Points", val: "4,800 Flops (Failed)", bad: true },
      { label: "Scan Insertion Signoff", val: "FAILED", bad: true },
      { label: "Tapeout Confidence", val: "LOW", bad: true },
    ],
    afterMetrics: [
      { label: "Scan Non-Equivalent Points", val: "0 Points (Equivalent) ✓", bad: false },
      { label: "Scan Insertion Signoff", val: "PASSED 100% ✓", bad: false },
      { label: "Tapeout Confidence", val: "SIGN-OFF READY ✓", bad: false },
    ],
    options: [
      {
        id: "opt_scan_pin_const",
        label: "Constrain 'scan_enable' and 'test_mode' pins to 0 in Conformal LEC ('add_pin_constraints 0 scan_enable -revised') to verify functional mode",
        correct: true,
        explanation: "Correct! Constraining scan enable to 0 forces scan multiplexers into functional mode, proving identical logical operation to the pre-scan netlist.",
      },
      {
        id: "opt_remove_scan_muxes",
        label: "Remove scan multiplexers from the post-scan netlist",
        correct: false,
        explanation: "Removing scan multiplexers destroys manufacturing testability.",
      },
      {
        id: "opt_skip_scan_lec",
        label: "Skip post-scan LEC verification",
        correct: false,
        explanation: "Skipping post-scan LEC risks shipping chips with scan-induced functional bugs.",
      },
    ],
  },
  {
    id: 68,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Sequential Retiming Mapping Verification Failure",
    severity: "HIGH",
    stageName: "Formal Verification / Retiming Setup",
    symptom: "Conformal LEC aborts verification on a 1.2 GHz floating-point unit because Genus retimed 128 pipeline stages without exporting register mapping tables.",
    logSnippet: `[CONFORMAL-RETIME] Error: 128 comparison points aborted in module 'fpu_core':
  Registers moved across combinational multiplier cones.
[LEC-FAIL] Sequential formal solver aborted: Retiming log missing.`,
    principle: "Sequential retiming changes state register boundaries. Conformal LEC requires the Genus retiming log (`set_db write_do_lec_include_retimed_registers true`) to reconstruct pipeline register movement.",
    remedyTcl: `set_db write_do_lec_include_retimed_registers true
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_retime.do`,
    beforeMetrics: [
      { label: "Retimed Verification Points", val: "128 Aborted", bad: true },
      { label: "FPU Formal Proof", val: "UNVERIFIED", bad: true },
      { label: "Signoff Status", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Retimed Verification Points", val: "128 / 128 Proven ✓", bad: false },
      { label: "FPU Formal Proof", val: "100% EQUIVALENT ✓", bad: false },
      { label: "Signoff Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_retime_lec_include",
        label: "Configure 'set_db write_do_lec_include_retimed_registers true' to embed all retiming transformation mappings into the Conformal LEC script",
        correct: true,
        explanation: "Correct! Embedding retiming transformation tables allows Conformal LEC to trace forward and backward register moves and prove formal equivalence.",
      },
      {
        id: "opt_disable_all_fpu_retime",
        label: "Disable retiming on the FPU block",
        correct: false,
        explanation: "Disabling retiming causes the FPU to fail its 1.2 GHz timing target by -650 ps.",
      },
      {
        id: "opt_wlm_retime_lec",
        label: "Switch to wire-load models",
        correct: false,
        explanation: "Wire load models have no connection to formal equivalence verification.",
      },
    ],
  },
  {
    id: 69,
    domainId: "lec_signoff",
    domainName: "LEC & Signoff Handoff",
    title: "Assign Net Removal (remove_assigns) Altering Wire Hierarchy in Netlist",
    severity: "MEDIUM",
    stageName: "Formal Verification / Hierarchy Name Mapping",
    symptom: "Conformal LEC fails to map 48 intermediate wire names because `remove_assigns true` replaced continuous assign statements with buffer cells.",
    logSnippet: `[CONFORMAL-MAP] Warning: 48 Golden net names not found in Revised Netlist:
  Golden: 'u_core/intermediate_bus_wire'
  Revised: 'u_core/BUF_inst_48/Y' (Replaced assign net with buffer)
[CONFORMAL-COMPARE] Unmapped internal net points caused verification warning.`,
    principle: "`remove_assigns` replaces symbolic Verilog `assign` wires with physical buffer cells. In Conformal LEC, comparison points are primary inputs, primary outputs, and sequential state registers; intermediate nets should be ignored or mapped via renaming rules.",
    remedyTcl: `# In Conformal LEC:
# set_flatten_model -seq_constant
# set_compare_options -threads 8
# add_renaming_rule -buffer_prefix
write_do_lec -golden_design rtl -revised_design outputs/soc_top_netlist.v > lec/run_clean.do`,
    beforeMetrics: [
      { label: "Unmapped Assign Wire Names", val: "48 Wires", bad: true },
      { label: "LEC Comparison Warnings", val: "48 Warnings", bad: true },
      { label: "Verification Cleanliness", val: "DIRTY", bad: true },
    ],
    afterMetrics: [
      { label: "Unmapped Assign Wire Names", val: "0 (Clean Renaming) ✓", bad: false },
      { label: "LEC Comparison Warnings", val: "0 Warnings ✓", bad: false },
      { label: "Verification Cleanliness", val: "100% CLEAN SIGN-OFF ✓", bad: false },
    ],
    options: [
      {
        id: "opt_lec_renaming_rule",
        label: "Apply buffer renaming rules in Conformal LEC and restrict comparison points to primary I/O and state registers",
        correct: true,
        explanation: "Correct! Restricting formal comparison points to functional register and I/O boundaries ensures that structural buffer insertions for `remove_assigns` pass cleanly.",
      },
      {
        id: "opt_disable_remove_assigns",
        label: "Disable remove_assigns and keep raw assign statements in netlist",
        correct: false,
        explanation: "Disabling remove_assigns causes downstream P&R routers and LVS checkers to fail with physical short circuits.",
      },
      {
        id: "opt_flatten_netlist_manual",
        label: "Manually delete buffer cells from the gate netlist",
        correct: false,
        explanation: "Manually editing the gate netlist introduces unverified syntax and timing errors.",
      },
    ],
  },
];


