export interface ConformalMetric {
  label: string;
  val: string;
}

export interface ConformalScenarioOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface ConformalScenario {
  id: number;
  domainId: string;
  domainName: string;
  title: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  stageName: string;
  symptom: string;
  logSnippet: string;
  principle: string;
  remedyTcl: string;
  beforeMetrics: ConformalMetric[];
  afterMetrics: ConformalMetric[];
  options: ConformalScenarioOption[];
}

export interface ConformalDomain {
  id: string;
  name: string;
  tagline: string;
}

export const CONFORMAL_DOMAINS: ConformalDomain[] = [
  {
    "id": "lec_setup_mapping",
    "name": "Setup & Library Mapping",
    "tagline": "Golden/Revised netlist ingestion, blackbox modeling, standard cell Liberty models & pin constraints"
  },
  {
    "id": "lec_keypoint_mapping",
    "name": "Key Point Mapping & Unmapped Resolution",
    "tagline": "Register renaming heuristics, state machine re-encoding, phase inversion & MBFF mapping"
  },
  {
    "id": "lec_datapath_arithmetic",
    "name": "Datapath & Arithmetic Optimization",
    "tagline": "Carry-Save Adder (CSA) restructuring, Booth multiplier re-architecting & BDD datapath solvers"
  },
  {
    "id": "lec_low_power_upf",
    "name": "Low-Power UPF & Power Gating",
    "tagline": "Isolation cells, level shifters, retention latches (SRPG) & power switch formal proofs"
  },
  {
    "id": "lec_scan_dft_bypass",
    "name": "Scan & DFT Logic Bypass Equivalence",
    "tagline": "Scan chain reordering, test mode pin clamping, scan compression decompressor bypass & MBIST isolation"
  },
  {
    "id": "lec_clock_gating_retiming",
    "name": "Clock Gating & Sequential Retiming",
    "tagline": "Integrated Clock Gating (ICG) latch-free proofs, clock cloning & pipelined retiming maps"
  },
  {
    "id": "lec_debug_eco",
    "name": "Non-Equivalent Debug & Golden Functional ECO",
    "tagline": "Counter-example diagnosis, error cone isolation, automated functional ECO patches & spare cell mapping"
  },
];

export const CONFORMAL_SCENARIOS: ConformalScenario[] = [
  {
    "id": 0,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Missing Standard Cell Functional Liberty Definition in Revised Setup",
    "severity": "CRITICAL",
    "stageName": "LEC Setup Mode",
    "symptom": "Conformal LEC flags 1,240 library cells as unmapped blackboxes with unknown boolean truth tables.",
    "logSnippet": "// Error: Cannot find functional model for cell 'AOI222_X4' in library\n// Warning: 1240 instances instantiated as primitive BLACKBOX\n// LEC-SETUP-014: Cannot proceed to compare mode with undefined library models",
    "principle": "Conformal requires complete transistor-level or functional Liberty/Verilog models loaded with read_library -both before elaboration.",
    "remedyTcl": "read_library -both -statetable -liberty /pdk/sky130/stdcells.lib\nelaborate_design -golden -root soc_top\nelaborate_design -revised -root soc_top",
    "beforeMetrics": [
      {
        "label": "Blackbox Cells",
        "val": "1,240"
      },
      {
        "label": "Mapped Points",
        "val": "0%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Blackbox Cells",
        "val": "0"
      },
      {
        "label": "Mapped Points",
        "val": "100%"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Read complete standard cell liberty models using read_library -both before elaborate_design",
        "correct": true,
        "explanation": "Reading the liberty models with read_library -both resolves all cell definitions for both Golden and Revised netlists."
      },
      {
        "id": "b",
        "label": "Set all unmodeled cells to ideal shorts",
        "correct": false,
        "explanation": "Shorting cells creates illegal connections and corrupts boolean logic."
      },
      {
        "id": "c",
        "label": "Delete the AOI222 cells from the netlist",
        "correct": false,
        "explanation": "Deleting cells changes functional behavior."
      },
      {
        "id": "d",
        "label": "Disable LEC library verification checks",
        "correct": false,
        "explanation": "Without cell models, formal equivalence cannot be proven."
      }
    ]
  },
  {
    "id": 1,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Analog Mixed-Signal (AMS) IP Blackbox Definition",
    "severity": "HIGH",
    "stageName": "Design Elaboration",
    "symptom": "Conformal fails to elaborate PLL and ADC macro blocks due to missing transistor schematics in digital netlists.",
    "logSnippet": "// Error: Module 'pll_dpll_top' has no behavioral verilog definition in Golden netlist\n// LEC-ELAB-089: Unresolved module reference in top-level netlist",
    "principle": "Hard analog IPs, PLLs, and SerDes PHYs lacking synthesizable RTL must be explicitly declared as blackboxes using set_blackbox.",
    "remedyTcl": "set_blackbox pll_dpll_top -both\nset_blackbox adc_12b_macro -both\nelaborate_design -both",
    "beforeMetrics": [
      {
        "label": "Elab Errors",
        "val": "2"
      },
      {
        "label": "Design State",
        "val": "BLOCKED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Elab Errors",
        "val": "0"
      },
      {
        "label": "Design State",
        "val": "READY"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Declare hard analog macros as blackboxes using set_blackbox <module> -both",
        "correct": true,
        "explanation": "Declaring analog IP as blackboxes treats their boundary pins as matching Key Points."
      },
      {
        "id": "b",
        "label": "Replace PLL with a 1-bit wire",
        "correct": false,
        "explanation": "Replacing PLL with a wire creates functional mismatch."
      },
      {
        "id": "c",
        "label": "Synthesize the PLL from SPICE schematics",
        "correct": false,
        "explanation": "Conformal does not simulate SPICE netlists."
      },
      {
        "id": "d",
        "label": "Ignore pin connections to the ADC",
        "correct": false,
        "explanation": "Ignoring pins breaks interface verification."
      }
    ]
  },
  {
    "id": 2,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Scan Mode Pin Constraint Floating Failure",
    "severity": "CRITICAL",
    "stageName": "Constraint Setup",
    "symptom": "Post-scan netlist compares non-equivalent because scan_enable pin is floating, mixing shift logic with functional cones.",
    "logSnippet": "// Compare Results: 4,820 NON-EQUIVALENT compare points\n// Root Cause: scan_enable input is unconstrained; evaluating under test shift mode",
    "principle": "In functional mode LEC, scan_enable and test_mode pins must be tied to 0 using add_pin_constraints to disable DFT shift paths.",
    "remedyTcl": "add_pin_constraints 0 scan_enable -both\nadd_pin_constraints 0 test_mode_i -both\nadd_pin_constraints 1 scan_rst_n -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Non-Equivalent",
        "val": "4,820"
      },
      {
        "label": "Equivalent",
        "val": "0"
      }
    ],
    "afterMetrics": [
      {
        "label": "Non-Equivalent",
        "val": "0"
      },
      {
        "label": "Equivalent",
        "val": "4,820"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain test control pins to functional values using add_pin_constraints (scan_enable=0)",
        "correct": true,
        "explanation": "Pin constraints ensure the formal engine evaluates only functional operational state space."
      },
      {
        "id": "b",
        "label": "Remove scan flip-flops from the netlist",
        "correct": false,
        "explanation": "Removing scan cells destroys the physical design netlist."
      },
      {
        "id": "c",
        "label": "Set scan_enable to 1 during functional comparison",
        "correct": false,
        "explanation": "Setting scan_enable to 1 forces the design into test shift mode."
      },
      {
        "id": "d",
        "label": "Invert all scan chain outputs",
        "correct": false,
        "explanation": "Inverting outputs corrupts logic."
      }
    ]
  },
  {
    "id": 3,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Case Analysis Static Mode Pin Tie-Off",
    "severity": "HIGH",
    "stageName": "Setup Mode",
    "symptom": "Dual-protocol PCIe/SATA PHY netlist reports false non-equivalence because mode configuration pins are unconstrained.",
    "logSnippet": "// Non-equivalent compare point: u_phy/mode_select_fsm\n// Golden evaluates PCIe protocol while Revised evaluates SATA protocol",
    "principle": "Static mode selector pins must be constrained with identical case values across Golden and Revised netlists.",
    "remedyTcl": "add_pin_constraints 1 pcie_mode_sel -both\nadd_pin_constraints 0 sata_mode_sel -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Mode Mismatches",
        "val": "340"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Mode Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Apply identical pin constraints with add_pin_constraints to lock mode configuration",
        "correct": true,
        "explanation": "Locking mode pins ensures both netlists operate under the same protocol mode."
      },
      {
        "id": "b",
        "label": "Compare PCIe against SATA simultaneously",
        "correct": false,
        "explanation": "Different protocols are inherently non-equivalent."
      },
      {
        "id": "c",
        "label": "Disconnect mode selection lines",
        "correct": false,
        "explanation": "Disconnecting lines causes floating inputs."
      },
      {
        "id": "d",
        "label": "Delete the SATA protocol logic from RTL",
        "correct": false,
        "explanation": "Modifying RTL is incorrect when constraints solve the check."
      }
    ]
  },
  {
    "id": 4,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "SystemVerilog 2017 Interface Port Flattening Mismatch",
    "severity": "MEDIUM",
    "stageName": "Elaboration",
    "symptom": "Conformal fails to map AXI4 interface bundles between modular Golden RTL and flattened post-synthesis netlist.",
    "logSnippet": "// Error: Port 'axi_if.awaddr' in Golden cannot be resolved in flattened Revised netlist\n// Mapping efficiency: 12% mapped",
    "principle": "SystemVerilog interface ports flatten with delimiter underscores; set_flatten_model ensures naming conventions align.",
    "remedyTcl": "set_naming_rule %s_%d -interface_bus -both\nset_flatten_model -seq_constant -gated_clock\nelaborate_design -both",
    "beforeMetrics": [
      {
        "label": "Mapped Ports",
        "val": "12%"
      },
      {
        "label": "Unmapped",
        "val": "480"
      }
    ],
    "afterMetrics": [
      {
        "label": "Mapped Ports",
        "val": "100%"
      },
      {
        "label": "Unmapped",
        "val": "0"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Configure interface naming rules and flatten model with set_naming_rule and set_flatten_model",
        "correct": true,
        "explanation": "Configuring naming rules maps SystemVerilog struct/interface ports to flattened wire names."
      },
      {
        "id": "b",
        "label": "Convert all interfaces to 1-bit ports manually in RTL",
        "correct": false,
        "explanation": "Manual RTL refactoring is tedious and error-prone."
      },
      {
        "id": "c",
        "label": "Disable interface checking in LEC",
        "correct": false,
        "explanation": "Interface ports must be verified."
      },
      {
        "id": "d",
        "label": "Remove AXI bus from Golden RTL",
        "correct": false,
        "explanation": "Removing the bus breaks functionality."
      }
    ]
  },
  {
    "id": 5,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Multi-Voltage UPF Power State Table (PST) Definition Missing",
    "severity": "CRITICAL",
    "stageName": "Low Power Setup",
    "symptom": "Power-gated domain registers evaluate to unknown 'X' in Revised netlist because power switch state is undefined.",
    "logSnippet": "// Warning: Power switch 'u_sw_cpu' in Revised has no valid ON condition\n// Compare: 1,840 compare points evaluate to 'X' (Unknown)",
    "principle": "When comparing low-power netlists, load UPF power intent with read_power_intent to define active power supply states.",
    "remedyTcl": "read_power_intent -both ./upf/soc_power.upf\nset_power_state -domain PD_CPU -state ON\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "X-State Points",
        "val": "1,840"
      },
      {
        "label": "Equivalence",
        "val": "UNKNOWN"
      }
    ],
    "afterMetrics": [
      {
        "label": "X-State Points",
        "val": "0"
      },
      {
        "label": "Equivalence",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Read UPF power intent using read_power_intent and set active power states",
        "correct": true,
        "explanation": "Loading UPF intent models power switches, level shifters, and isolation states properly."
      },
      {
        "id": "b",
        "label": "Force all power-gated registers to 0",
        "correct": false,
        "explanation": "Forcing values masks functional bugs."
      },
      {
        "id": "c",
        "label": "Delete the power domain from UPF",
        "correct": false,
        "explanation": "Deleting power intent defeats low-power verification."
      },
      {
        "id": "d",
        "label": "Bypass UPF verification during LEC",
        "correct": false,
        "explanation": "UPF power gating logic must be proven formally."
      }
    ]
  },
  {
    "id": 6,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Floating Net Modeling & High-Z Resolution",
    "severity": "LOW",
    "stageName": "Elaboration",
    "symptom": "Unconnected internal test pins in Revised netlist generate false non-equivalent compare points.",
    "logSnippet": "// Warning: Net 'u_core/test_spare_n' is floating in Revised design\n// Conformal models floating nets as non-deterministic free variables",
    "principle": "Floating nets should be tied to 0 or treated as don't-care using set_undriven_signal.",
    "remedyTcl": "set_undriven_signal 0 -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "False Violations",
        "val": "45"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "False Violations",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Set undriven signal resolution to 0 using set_undriven_signal 0 -both",
        "correct": true,
        "explanation": "Modeling undriven nets as tied-low matches physical synthesis tie-off behavior."
      },
      {
        "id": "b",
        "label": "Connect floating pins to the clock tree",
        "correct": false,
        "explanation": "Connecting floating signals to clock creates massive glitches."
      },
      {
        "id": "c",
        "label": "Delete all undriven instances",
        "correct": false,
        "explanation": "Arbitrary deletion corrupts physical netlists."
      },
      {
        "id": "d",
        "label": "Set undriven signals to oscillate",
        "correct": false,
        "explanation": "Oscillation causes simulation divergence."
      }
    ]
  },
  {
    "id": 7,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Hierarchy Inversion in Sub-Block Netlists",
    "severity": "HIGH",
    "stageName": "Elaboration",
    "symptom": "Conformal cannot match internal hierarchy because Innovus flattened logic inside sub-modules during P&R.",
    "logSnippet": "// Error: Module 'u_crypto/aes_round_stage' missing in Revised netlist\n// Mapping failure: Hierarchical boundaries altered during physical optimization",
    "principle": "When sub-blocks are ungrouped during synthesis/PnR, flatten the verification model with set_flatten_model.",
    "remedyTcl": "set_flatten_model -gated_clock -seq_constant\nmap_key_points -all\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped Modules",
        "val": "8"
      },
      {
        "label": "Mapped Points",
        "val": "45%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Modules",
        "val": "0"
      },
      {
        "label": "Mapped Points",
        "val": "100%"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable automatic model flattening using set_flatten_model",
        "correct": true,
        "explanation": "Flattening the model resolves cross-module boundary optimizations and ungrouped logic."
      },
      {
        "id": "b",
        "label": "Re-instantiate original sub-modules manually",
        "correct": false,
        "explanation": "Manual netlist editing violates signoff integrity."
      },
      {
        "id": "c",
        "label": "Disable hierarchical checking entirely",
        "correct": false,
        "explanation": "Flattens without checking causes false passes."
      },
      {
        "id": "d",
        "label": "Force all sub-modules to preserve boundaries during synthesis",
        "correct": false,
        "explanation": "Boundary preservation degrades PnR PPA."
      }
    ]
  },
  {
    "id": 8,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "Constant Bit-Width Truncation Warning",
    "severity": "MEDIUM",
    "stageName": "Elaboration",
    "symptom": "32-bit adder in Golden RTL connected to 24-bit bus causes unmapped dangling MSB bits.",
    "logSnippet": "// Warning: Bits [31:24] of adder output are unused in Golden design\n// Revised netlist pruned MSB logic gates during synthesis optimization",
    "principle": "Unconnected or pruned register bits must be analyzed as constant don't-cares using set_analyze_option -auto.",
    "remedyTcl": "set_analyze_option -auto -constant_propagation\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Dangling Bits",
        "val": "8"
      },
      {
        "label": "Status",
        "val": "WARNING"
      }
    ],
    "afterMetrics": [
      {
        "label": "Dangling Bits",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "CLEAN"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable constant propagation and automatic dead logic pruning with set_analyze_option",
        "correct": true,
        "explanation": "Auto analysis identifies unused bits pruned identically in synthesis."
      },
      {
        "id": "b",
        "label": "Pad Revised netlist with 8 dummy flip-flops",
        "correct": false,
        "explanation": "Adding dummy flops alters physical design."
      },
      {
        "id": "c",
        "label": "Short the MSB bits to ground in RTL",
        "correct": false,
        "explanation": "Modifying RTL is unnecessary when tool analyzes pruning."
      },
      {
        "id": "d",
        "label": "Disable unused port warnings in LEC",
        "correct": false,
        "explanation": "Disabling warnings can mask real truncation bugs."
      }
    ]
  },
  {
    "id": 9,
    "domainId": "lec_setup_mapping",
    "domainName": "Setup & Library Mapping",
    "title": "SDC Case Analysis Direct Propagation",
    "severity": "HIGH",
    "stageName": "Setup Mode",
    "symptom": "BIST and Functional modes conflict on shared test muxes without SDC case constants.",
    "logSnippet": "// Compare: 920 points non-equivalent on MBIST test control cones\n// Mismatch: Test mux output evaluated in both 0 and 1 states simultaneously",
    "principle": "Ingest SDC constraints with read_sdc to propagate set_case_analysis constants to formal compare points.",
    "remedyTcl": "read_sdc -both ./constraints/functional_signoff.sdc\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Conflicting Muxes",
        "val": "920"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Conflicting Muxes",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Load functional SDC constraints using read_sdc -both to apply case analysis constants",
        "correct": true,
        "explanation": "Loading SDC propagates set_case_analysis mode settings across test muxes."
      },
      {
        "id": "b",
        "label": "Hard-wire all mux select pins to 0 in Verilog",
        "correct": false,
        "explanation": "Hard-wiring in Verilog corrupts test mode silicon."
      },
      {
        "id": "c",
        "label": "Delete the MBIST controllers from netlist",
        "correct": false,
        "explanation": "Deleting MBIST destroys manufacturing test."
      },
      {
        "id": "d",
        "label": "Ignore test mux compare points",
        "correct": false,
        "explanation": "Ignoring compare points creates verification holes."
      }
    ]
  },
  {
    "id": 10,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Phase-Inverted Register Mapping Failure",
    "severity": "CRITICAL",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis inverted an active-low reset register into an active-high equivalent with inverted data polarity, causing unmapped points.",
    "logSnippet": "// Unmapped Points: 64 Non-equivalent DFFs in u_dma/ctrl_reg[*]\n// Warning: Inverted Q pin polarity detected on Revised register",
    "principle": "When synthesis inverts register phase to save silicon area, enable phase inversion mapping with set_mapping_method -invert.",
    "remedyTcl": "set_mapping_method -invert\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped DFFs",
        "val": "64"
      },
      {
        "label": "Equivalence",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped DFFs",
        "val": "0"
      },
      {
        "label": "Equivalence",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable phase-inverted register mapping using set_mapping_method -invert",
        "correct": true,
        "explanation": "Phase inversion mapping recognizes registers with inverted reset polarity and inverted output cones."
      },
      {
        "id": "b",
        "label": "Invert the clock signal in the Revised netlist",
        "correct": false,
        "explanation": "Inverting clock breaks sequential timing and functional behavior."
      },
      {
        "id": "c",
        "label": "Insert an inverter on each DFF output in RTL",
        "correct": false,
        "explanation": "RTL modifications are unnecessary for synthesis optimizations."
      },
      {
        "id": "d",
        "label": "Force synthesis to disable area optimization",
        "correct": false,
        "explanation": "Disabling optimization degrades area and power."
      }
    ]
  },
  {
    "id": 11,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Multi-Bit Flip-Flop (MBFF) Decomposition Mapping",
    "severity": "HIGH",
    "stageName": "Key Point Mapping",
    "symptom": "Innovus merged four 1-bit registers into a single 4-bit MBFF (DFF_X4_MBFF), resulting in unmapped 1-bit Golden names.",
    "logSnippet": "// Unmapped Golden: u_pipe/reg_a_0_reg, reg_a_1_reg, reg_a_2_reg, reg_a_3_reg\n// Unmapped Revised: u_pipe/reg_a_mbff4_reg[3:0]",
    "principle": "Multi-Bit Flip-Flop merging groups bit slices under a single cell; Conformal maps individual bit pins using name rule heuristics.",
    "remedyTcl": "set_naming_rule -mbff \"%s_mbff%d_reg[%d]\" -revised\nmap_key_points -mbff\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped MBFFs",
        "val": "256"
      },
      {
        "label": "Mapping Rate",
        "val": "74%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped MBFFs",
        "val": "0"
      },
      {
        "label": "Mapping Rate",
        "val": "100%"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Configure MBFF naming heuristics and map with map_key_points -mbff",
        "correct": true,
        "explanation": "MBFF mapping decomposes multi-bit register pins into individual Golden 1-bit compare points."
      },
      {
        "id": "b",
        "label": "Split all MBFFs back into 1-bit cells in PnR netlist",
        "correct": false,
        "explanation": "Splitting MBFFs destroys 25% clock power savings."
      },
      {
        "id": "c",
        "label": "Ignore MBFF register compare points",
        "correct": false,
        "explanation": "Ignoring registers invalidates formal equivalence."
      },
      {
        "id": "d",
        "label": "Treat MBFF cells as blackboxes",
        "correct": false,
        "explanation": "Treating registers as blackboxes skips pipeline checks."
      }
    ]
  },
  {
    "id": 12,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "FSM State Machine Re-Encoding (One-Hot to Binary)",
    "severity": "CRITICAL",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis re-encoded an 8-state One-Hot FSM into a 3-bit Binary counter, causing 5 unmapped Golden registers.",
    "logSnippet": "// Unmapped Golden: u_fsm/state_reg[7:3] (One-Hot 8 FFs)\n// Revised: u_fsm/state_reg[2:0] (Binary 3 FFs)\n// LEC-MAP-042: Mismatched sequential state encoding",
    "principle": "Sequential FSM re-encoding alters state register count; read the synthesis SVF/FV_MAP record or use sequential comparison.",
    "remedyTcl": "read_fv_map -fsm ./synthesis/fsm_encoding.map\nset_system_mode lec\nadd_compared_points -all\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped State FFs",
        "val": "5"
      },
      {
        "label": "Status",
        "val": "ABORT"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped State FFs",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Ingest synthesis formal verification map using read_fv_map for FSM re-encoding",
        "correct": true,
        "explanation": "The FV map guides Conformal through state variable transformations."
      },
      {
        "id": "b",
        "label": "Force RTL to use 3-bit binary encoding manually",
        "correct": false,
        "explanation": "Manual RTL edits risk introducing functional errors."
      },
      {
        "id": "c",
        "label": "Delete the 5 unmapped registers from Golden RTL",
        "correct": false,
        "explanation": "Deleting registers breaks RTL simulation."
      },
      {
        "id": "d",
        "label": "Disable FSM comparison in Conformal",
        "correct": false,
        "explanation": "FSM verification is critical for chip control logic."
      }
    ]
  },
  {
    "id": 13,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Sequential Retiming Pipeline Register Shift",
    "severity": "HIGH",
    "stageName": "Key Point Mapping",
    "symptom": "Genus moved pipeline registers across a 32-bit multiplier cone (retime_design), breaking 1-to-1 register mapping.",
    "logSnippet": "// Non-equivalent compare points: 32 DFFs moved across multiplier\n// Golden has 1 pre-mult register; Revised has 2 post-mult registers",
    "principle": "Sequential retiming shifts registers across logic gates; load the retiming guide record via read_fv_map.",
    "remedyTcl": "read_fv_map -retime ./synthesis/genus_retiming.map\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Retimed Non-Equiv",
        "val": "32"
      },
      {
        "label": "Proof",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Retimed Non-Equiv",
        "val": "0"
      },
      {
        "label": "Proof",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Ingest the synthesis retiming guidebook using read_fv_map -retime",
        "correct": true,
        "explanation": "The retiming map allows Conformal to verify sequential equivalence across shifted register boundaries."
      },
      {
        "id": "b",
        "label": "Disable retiming in Genus synthesis",
        "correct": false,
        "explanation": "Disabling retiming degrades maximum operating frequency."
      },
      {
        "id": "c",
        "label": "Insert delay cells in Golden RTL",
        "correct": false,
        "explanation": "Delay cells cannot be modeled in cycle-accurate RTL."
      },
      {
        "id": "d",
        "label": "Ignore multiplier pipeline registers",
        "correct": false,
        "explanation": "Ignoring registers creates functional escape bugs."
      }
    ]
  },
  {
    "id": 14,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Register Merging on Identical Fanin Cones",
    "severity": "MEDIUM",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis merged two redundant status registers driving identical logic cones into a single register with two fanout branches.",
    "logSnippet": "// Unmapped Golden: u_ctrl/status_err_reg_dup\n// Revised has single instance: u_ctrl/status_err_reg",
    "principle": "Redundant register merging reduces gate count; Conformal resolves merged registers using set_flatten_model -seq_constant.",
    "remedyTcl": "set_flatten_model -seq_constant -gated_clock\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped Duplicates",
        "val": "18"
      },
      {
        "label": "Equivalence",
        "val": "INCOMPLETE"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Duplicates",
        "val": "0"
      },
      {
        "label": "Equivalence",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable sequential constant and equivalent register merging analysis with set_flatten_model",
        "correct": true,
        "explanation": "Setting seq_constant models redundant register pruning formally."
      },
      {
        "id": "b",
        "label": "Prohibit register merging in synthesis scripts",
        "correct": false,
        "explanation": "Prohibiting merging wastes flip-flop area and clock power."
      },
      {
        "id": "c",
        "label": "Replicate the register manually in Revised netlist",
        "correct": false,
        "explanation": "Manual netlist hacking risks DRC and timing violations."
      },
      {
        "id": "d",
        "label": "Set duplicate registers to don't-care",
        "correct": false,
        "explanation": "Setting registers to don't-care bypasses verification."
      }
    ]
  },
  {
    "id": 15,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Clock Tree Synthesis Root Buffer Key Point Shift",
    "severity": "LOW",
    "stageName": "Post-CTS Mapping",
    "symptom": "Post-route netlist clock pins are driven by CTS buffer trees (CLKBUF_X12) instead of primary clock ports.",
    "logSnippet": "// Info: Clock ports in Revised netlist drive 4-level CTS buffer trees\n// Mapping primary clock ports to internal leaf pins",
    "principle": "CTS inserts buffer trees; Conformal automatically traces clock pins back to root ports unless unmapped.",
    "remedyTcl": "set_mapping_method -clock_tree\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Clock Pin Mismatches",
        "val": "42"
      },
      {
        "label": "Status",
        "val": "WARN"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Pin Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "CLEAN"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable clock tree buffer tracing using set_mapping_method -clock_tree",
        "correct": true,
        "explanation": "Clock tree mapping traces clock buffers back to primary clock sources."
      },
      {
        "id": "b",
        "label": "Delete all clock buffers from PnR netlist",
        "correct": false,
        "explanation": "Deleting clock buffers destroys clock distribution."
      },
      {
        "id": "c",
        "label": "Add inverters on all clock lines",
        "correct": false,
        "explanation": "Adding inverters inverts clock edges."
      },
      {
        "id": "d",
        "label": "Ignore clock pin connections",
        "correct": false,
        "explanation": "Clock pins must be validated."
      }
    ]
  },
  {
    "id": 16,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Constant 0/1 Tied-Off Register Pruning",
    "severity": "MEDIUM",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis pruned 16 configuration registers whose D-inputs were tied to constant 0 during synthesis optimization.",
    "logSnippet": "// Unmapped Golden: u_cfg/feature_en_reg[15:0]\n// Revised netlist tied downstream logic directly to VSS",
    "principle": "Registers tied to constants are eliminated during optimization; Conformal matches them to constant 0/1 compare points.",
    "remedyTcl": "set_flatten_model -seq_constant\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Tied-Off Unmapped",
        "val": "16"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Tied-Off Unmapped",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable constant sequential folding with set_flatten_model -seq_constant",
        "correct": true,
        "explanation": "Constant sequential folding proves logic driven by constant registers matches tied-off nets."
      },
      {
        "id": "b",
        "label": "Force RTL to remove the constant registers",
        "correct": false,
        "explanation": "RTL may keep configuration registers for future expansion."
      },
      {
        "id": "c",
        "label": "Instantiate 16 dummy registers tied to VDD",
        "correct": false,
        "explanation": "Tying to VDD inverts constant 0 logic."
      },
      {
        "id": "d",
        "label": "Disable constant propagation in synthesis",
        "correct": false,
        "explanation": "Disabling constant propagation wastes silicon area."
      }
    ]
  },
  {
    "id": 17,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Shift Register LUT (SRL) RAM Inference Mapping",
    "severity": "HIGH",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis mapped a 32-stage FIFO shift register into an SRAM macro cell, leaving 32 discrete flip-flops unmapped in Golden.",
    "logSnippet": "// Unmapped Golden: u_fifo/sr_reg[31:0]\n// Revised has single RAM instance: u_fifo/srl_mem_32x8",
    "principle": "Memory macro inference changes register primitives into RAM arrays; blackbox the RAM or load behavioral RAM models.",
    "remedyTcl": "read_library -both ./models/srl_mem_model.v\nset_flatten_model -seq_constant\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped DFFs",
        "val": "32"
      },
      {
        "label": "RAM Mapped",
        "val": "NO"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped DFFs",
        "val": "0"
      },
      {
        "label": "RAM Mapped",
        "val": "YES"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Provide behavioral simulation models for inferred RAM macros with read_library",
        "correct": true,
        "explanation": "Behavioral models allow Conformal to verify functional equivalence of memory arrays."
      },
      {
        "id": "b",
        "label": "Force synthesis to use discrete flip-flops only",
        "correct": false,
        "explanation": "Using discrete flops increases area by 4x."
      },
      {
        "id": "c",
        "label": "Short RAM input pins directly to outputs",
        "correct": false,
        "explanation": "Shorting pins eliminates FIFO delay storage."
      },
      {
        "id": "d",
        "label": "Delete the FIFO from verification scope",
        "correct": false,
        "explanation": "Deleting the FIFO introduces critical verification gaps."
      }
    ]
  },
  {
    "id": 18,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Name Mangling Across Verilog Hierarchy Flattening",
    "severity": "MEDIUM",
    "stageName": "Key Point Mapping",
    "symptom": "Synthesis replaced hierarchy forward slashes '/' with underscores '__', causing 2,400 unmapped name mismatches.",
    "logSnippet": "// Golden Name: u_top/u_alu/res_reg[0]\n// Revised Name: u_top__u_alu__res_reg_0_\n// Mapping Rate: 8%",
    "principle": "Hierarchy flattening character substitutions must be defined using set_naming_rule to match bus brackets and delimiters.",
    "remedyTcl": "set_naming_rule -hier_delimiter \"__\" -bus_delimiter \"_%d_\" -revised\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped Names",
        "val": "2,400"
      },
      {
        "label": "Mapped Rate",
        "val": "8%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Names",
        "val": "0"
      },
      {
        "label": "Mapped Rate",
        "val": "100%"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Configure hierarchy and bus delimiter rules using set_naming_rule",
        "correct": true,
        "explanation": "Setting delimiter rules bridges naming differences between hierarchical RTL and flattened netlists."
      },
      {
        "id": "b",
        "label": "Rename all instances in the netlist manually with sed",
        "correct": false,
        "explanation": "Manual sed renaming is error-prone and brittle."
      },
      {
        "id": "c",
        "label": "Preserve all hierarchy during synthesis",
        "correct": false,
        "explanation": "Preserving all hierarchy hinders boundary logic optimization."
      },
      {
        "id": "d",
        "label": "Disable name-based mapping heuristics",
        "correct": false,
        "explanation": "Disabling heuristics prevents automatic Key Point matching."
      }
    ]
  },
  {
    "id": 19,
    "domainId": "lec_keypoint_mapping",
    "domainName": "Key Point Mapping & Unmapped Resolution",
    "title": "Latch-Based Time-Borrowing Pipeline Key Point Resolution",
    "severity": "HIGH",
    "stageName": "Key Point Mapping",
    "symptom": "Transparent latch array in high-speed datapath generates feedback loop warnings and unmapped latch compare points.",
    "logSnippet": "// Warning: Combinational feedback loop detected through transparent latch array\n// Unmapped Compare Points: 16 Latches in u_datapath/latch_bank[*]",
    "principle": "Transparent latches require phase modeling; enable latch mapping using set_flatten_model -latch.",
    "remedyTcl": "set_flatten_model -latch -loop_break\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Feedback Loops",
        "val": "16"
      },
      {
        "label": "Latch Points",
        "val": "UNMAPPED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Feedback Loops",
        "val": "0"
      },
      {
        "label": "Latch Points",
        "val": "MAPPED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable latch loop breaking and latch mapping with set_flatten_model -latch",
        "correct": true,
        "explanation": "Setting latch mode allows Conformal to break transparent loops and verify latch stages cleanly."
      },
      {
        "id": "b",
        "label": "Replace all latches with edge-triggered flip-flops in RTL",
        "correct": false,
        "explanation": "Replacing latches removes time-borrowing performance margins."
      },
      {
        "id": "c",
        "label": "Short latch D-pins to Q-pins directly",
        "correct": false,
        "explanation": "Shorting pins removes sequential isolation."
      },
      {
        "id": "d",
        "label": "Ignore latch feedback loops",
        "correct": false,
        "explanation": "Ignoring feedback loops leads to non-convergent analysis."
      }
    ]
  },
  {
    "id": 20,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Booth-Wallace 64-bit Multiplier Restructuring Equivalence",
    "severity": "CRITICAL",
    "stageName": "Datapath Solver",
    "symptom": "Conformal BDD engine times out on a 64-bit Booth-encoded multiplier restructured into Wallace tree reduction.",
    "logSnippet": "// Warning: Compare point u_dsp/mult_64b timed out after 3600s\n// State: Non-convergent in default BDD solver",
    "principle": "Complex non-linear datapath architectures require Conformal's dedicated Word-Level and Arithmetic solvers enabled via set_compare_options -threads.",
    "remedyTcl": "set_analyze_option -datapath -word_level\nset_compare_options -threads 8\ncompare",
    "beforeMetrics": [
      {
        "label": "BDD Timeout",
        "val": "3600s"
      },
      {
        "label": "Verification",
        "val": "INCONCLUSIVE"
      }
    ],
    "afterMetrics": [
      {
        "label": "BDD Timeout",
        "val": "12s"
      },
      {
        "label": "Verification",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable word-level arithmetic and datapath solver engines with set_analyze_option -datapath",
        "correct": true,
        "explanation": "Word-level solvers use algebraic rewriting to prove multiplier equivalence in seconds."
      },
      {
        "id": "b",
        "label": "Replace the 64-bit multiplier with a lookup table",
        "correct": false,
        "explanation": "LUTs for 64-bit multipliers require exabytes of memory."
      },
      {
        "id": "c",
        "label": "Reduce multiplier bit-width to 4 bits",
        "correct": false,
        "explanation": "Reducing bit-width invalidates full 64-bit arithmetic proof."
      },
      {
        "id": "d",
        "label": "Bypass arithmetic blocks during LEC signoff",
        "correct": false,
        "explanation": "Bypassing datapath hides catastrophic silicon calculation errors."
      }
    ]
  },
  {
    "id": 21,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Carry-Save Adder (CSA) Tree Bit-Slice Swizzling",
    "severity": "HIGH",
    "stageName": "Datapath Solver",
    "symptom": "Synthesis reordered sum and carry vector accumulation order across 8 operand inputs, failing bit-level compare.",
    "logSnippet": "// Non-equivalent compare points: u_alu/csa_tree_sum[63:0]\n// Mismatch: Partial product summation order re-ordered during synthesis",
    "principle": "Carry-save addition is associative and commutative; datapath analysis solves algebraic polynomial equivalence.",
    "remedyTcl": "set_analyze_option -auto -datapath\nadd_compared_points -all\ncompare",
    "beforeMetrics": [
      {
        "label": "CSA Non-Equiv",
        "val": "64"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "CSA Non-Equiv",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable automatic datapath associative equivalence using set_analyze_option -datapath",
        "correct": true,
        "explanation": "Datapath analysis proves algebraic sum equivalence regardless of tree restructuring."
      },
      {
        "id": "b",
        "label": "Force synthesis to use linear ripple-carry adders",
        "correct": false,
        "explanation": "Ripple-carry adders violate high-performance timing budgets."
      },
      {
        "id": "c",
        "label": "Invert the carry bits manually in netlist",
        "correct": false,
        "explanation": "Inverting carry bits produces wrong arithmetic answers."
      },
      {
        "id": "d",
        "label": "Delete the CSA accumulator tree",
        "correct": false,
        "explanation": "Deleting the accumulator breaks ALU function."
      }
    ]
  },
  {
    "id": 22,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Resource Sharing Arithmetic Operator Multiplexing",
    "severity": "MEDIUM",
    "stageName": "Datapath Solver",
    "symptom": "Synthesis merged two distinct 32-bit adders from an if-else RTL construct into a single shared adder with input multiplexers.",
    "logSnippet": "// Unmapped Golden: u_core/adder_branch_a, adder_branch_b\n// Revised: u_core/shared_adder_inst",
    "principle": "Resource sharing preserves input-output transfer function; Conformal proves equivalence across condition branches.",
    "remedyTcl": "set_flatten_model -seq_constant\nset_analyze_option -datapath\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped Adders",
        "val": "2"
      },
      {
        "label": "Equivalence",
        "val": "UNVERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Adders",
        "val": "0"
      },
      {
        "label": "Equivalence",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable datapath condition branch analysis with set_analyze_option -datapath",
        "correct": true,
        "explanation": "Datapath analysis proves shared arithmetic units match independent RTL branches."
      },
      {
        "id": "b",
        "label": "Disable resource sharing in synthesis",
        "correct": false,
        "explanation": "Disabling sharing inflates standard cell area by 30%."
      },
      {
        "id": "c",
        "label": "Duplicate the adder in Revised netlist",
        "correct": false,
        "explanation": "Duplicating adders wastes area and breaks PnR."
      },
      {
        "id": "d",
        "label": "Tie branch condition inputs to constant 1",
        "correct": false,
        "explanation": "Tying conditions tests only one branch."
      }
    ]
  },
  {
    "id": 23,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Leading Zero Anticipator (LZA) Floating Point Equivalence",
    "severity": "HIGH",
    "stageName": "Datapath Solver",
    "symptom": "Custom LZA logic in floating-point unit uses speculative prediction bits that differ from behavioral RTL counting loops.",
    "logSnippet": "// Non-equivalent compare points: u_fpu/lza_norm_shift[5:0]\n// Counter-example vector: mantissa = 0x0000_8000_0000_0000",
    "principle": "LZA algorithms compute leading zeros concurrently with subtraction; algebraic solvers verify bitwise truth tables.",
    "remedyTcl": "set_analyze_option -datapath -fpu\ncompare",
    "beforeMetrics": [
      {
        "label": "LZA Non-Equiv",
        "val": "6"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "LZA Non-Equiv",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable FPU and datapath normalization solver with set_analyze_option -fpu",
        "correct": true,
        "explanation": "FPU solver options handle speculative leading zero detection equivalence."
      },
      {
        "id": "b",
        "label": "Rewrite RTL to use standard gate-level LZA code",
        "correct": false,
        "explanation": "Behavioral RTL should remain clean and portable."
      },
      {
        "id": "c",
        "label": "Disable normalization checks",
        "correct": false,
        "explanation": "Normalization is essential for IEEE 754 precision."
      },
      {
        "id": "d",
        "label": "Force mantissa shift to constant 0",
        "correct": false,
        "explanation": "Forcing shift corrupts floating-point results."
      }
    ]
  },
  {
    "id": 24,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Saturating Arithmetic Overflow Clamping Verification",
    "severity": "MEDIUM",
    "stageName": "Datapath Solver",
    "symptom": "DSP saturating accumulator netlist implements carry-lookahead clamping logic optimized with compound gates.",
    "logSnippet": "// Compare: 32 Points in u_dsp/sat_accum_reg[*]\n// Result: EQUIVALENT (Proven in 0.8s via Arithmetic Engine)",
    "principle": "Compound gate mapping preserves saturation boundary clamps at maximum positive (0x7FFF) and negative (0x8000) bounds.",
    "remedyTcl": "add_compared_points u_dsp/sat_accum_reg[*]\ncompare",
    "beforeMetrics": [
      {
        "label": "Compare Points",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "READY"
      }
    ],
    "afterMetrics": [
      {
        "label": "Compare Points",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Add saturating register compare points and execute datapath compare",
        "correct": true,
        "explanation": "Conformal verifies overflow clamp logic equivalence formally across all 2^32 input states."
      },
      {
        "id": "b",
        "label": "Disable saturation clamping during synthesis",
        "correct": false,
        "explanation": "Disabling saturation produces rollover audio distortion."
      },
      {
        "id": "c",
        "label": "Add external clamping buffers in PnR",
        "correct": false,
        "explanation": "Clamping logic belongs in the synthesized netlist."
      },
      {
        "id": "d",
        "label": "Set saturation flags to don't-care",
        "correct": false,
        "explanation": "Flags must be verified for architecture compliance."
      }
    ]
  },
  {
    "id": 25,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Polynomial CRC-32 Generator Matrix Factoring",
    "severity": "HIGH",
    "stageName": "Datapath Solver",
    "symptom": "Synthesis factored an iterative CRC-32 LFSR into a parallel 64-bit XOR parity tree matrix.",
    "logSnippet": "// Non-equivalent compare points: u_eth/crc_out[31:0]\n// Complex multi-level XOR parity tree mismatch",
    "principle": "Linear XOR trees can be simplified using Conformal's linear solver (set_analyze_option -linear).",
    "remedyTcl": "set_analyze_option -linear\ncompare",
    "beforeMetrics": [
      {
        "label": "CRC Non-Equiv",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "CRC Non-Equiv",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Activate linear XOR parity solver with set_analyze_option -linear",
        "correct": true,
        "explanation": "The linear solver applies Galois field GF(2) matrix reduction to prove parallel CRC equivalence."
      },
      {
        "id": "b",
        "label": "Force synthesis to keep serial LFSR structure",
        "correct": false,
        "explanation": "Serial LFSR cannot achieve 100 Gbps Ethernet throughput."
      },
      {
        "id": "c",
        "label": "Short CRC parity outputs together",
        "correct": false,
        "explanation": "Shorting outputs breaks CRC error detection."
      },
      {
        "id": "d",
        "label": "Delete the CRC module from verification",
        "correct": false,
        "explanation": "Ethernet frames cannot pass without valid CRC."
      }
    ]
  },
  {
    "id": 26,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Restoring Non-Linear Division Array Optimization",
    "severity": "CRITICAL",
    "stageName": "Datapath Solver",
    "symptom": "Radix-4 SRT division array in hardware math coprocessor timed out under standard BDD representation.",
    "logSnippet": "// Warning: Division compare points non-convergent after 1800s\n// Memory utilization: 14.2 GB",
    "principle": "Non-linear division algorithms require SAT-based algebraic solvers with incremental bound checking.",
    "remedyTcl": "set_compare_options -solver sat -timeout 300\nset_analyze_option -datapath\ncompare",
    "beforeMetrics": [
      {
        "label": "Solver State",
        "val": "TIMEOUT"
      },
      {
        "label": "Memory",
        "val": "14.2 GB"
      }
    ],
    "afterMetrics": [
      {
        "label": "Solver State",
        "val": "EQUIVALENT"
      },
      {
        "label": "Memory",
        "val": "2.1 GB"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Switch to SAT-based datapath solver with set_compare_options -solver sat",
        "correct": true,
        "explanation": "SAT solvers avoid BDD memory explosion on non-linear division arrays."
      },
      {
        "id": "b",
        "label": "Replace hardware divider with software emulation",
        "correct": false,
        "explanation": "Hardware division is required for compute throughput."
      },
      {
        "id": "c",
        "label": "Reduce division dividend to 8 bits",
        "correct": false,
        "explanation": "Trimming dividend width fails full 64-bit verification."
      },
      {
        "id": "d",
        "label": "Ignore division remainder registers",
        "correct": false,
        "explanation": "Remainder registers must be verified."
      }
    ]
  },
  {
    "id": 27,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Constant Factor Arithmetic Strength Reduction",
    "severity": "LOW",
    "stageName": "Datapath Solver",
    "symptom": "Synthesis replaced multiplication by constant 10 (`x * 10`) with shifts and adds (`(x << 3) + (x << 1)`).",
    "logSnippet": "// Compare: u_algo/scale_out[15:0]\n// Result: EQUIVALENT (Proven in 0.2s)",
    "principle": "Strength reduction transforms expensive multipliers into wire shifts and adders with exact mathematical equivalence.",
    "remedyTcl": "add_compared_points u_algo/scale_out[*]\ncompare",
    "beforeMetrics": [
      {
        "label": "Multipliers",
        "val": "1"
      },
      {
        "label": "Adders",
        "val": "1"
      }
    ],
    "afterMetrics": [
      {
        "label": "Multipliers",
        "val": "0"
      },
      {
        "label": "Adders",
        "val": "1"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute compare on strength-reduced shift-add logic",
        "correct": true,
        "explanation": "Conformal's arithmetic solver verifies shift-add expansion matches constant multiplication perfectly."
      },
      {
        "id": "b",
        "label": "Force synthesis to use hardware DSP multiplier",
        "correct": false,
        "explanation": "Using DSP blocks for constant 10 wastes silicon area."
      },
      {
        "id": "c",
        "label": "Add division by 10 to reverse the math",
        "correct": false,
        "explanation": "Division introduces truncation errors."
      },
      {
        "id": "d",
        "label": "Disable strength reduction optimization",
        "correct": false,
        "explanation": "Disabling strength reduction hurts power and area."
      }
    ]
  },
  {
    "id": 28,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Bit-Slice Swizzling & Endianness Invariance",
    "severity": "MEDIUM",
    "stageName": "Datapath Solver",
    "symptom": "Big-endian to little-endian byte swapper in network packet parser failed initial wire naming match.",
    "logSnippet": "// Golden: packet_data[31:0] -> {byte3, byte2, byte1, byte0}\n// Revised: packet_data_rev[31:0] mapped with reversed slice indices",
    "principle": "Byte swizzling is a pure wiring transposition; Conformal resolves wiring maps under set_flatten_model.",
    "remedyTcl": "set_flatten_model -seq_constant\nmap_key_points -name_rule\ncompare",
    "beforeMetrics": [
      {
        "label": "Unmapped Slices",
        "val": "4"
      },
      {
        "label": "Equivalence",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Slices",
        "val": "0"
      },
      {
        "label": "Equivalence",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Map wire transposition using set_flatten_model and map_key_points -name_rule",
        "correct": true,
        "explanation": "Name rule matching resolves bit-slice endianness transformations without logic changes."
      },
      {
        "id": "b",
        "label": "Invert all byte registers in Verilog",
        "correct": false,
        "explanation": "Inverting registers corrupts packet payload."
      },
      {
        "id": "c",
        "label": "Force network parser to use 8-bit bus",
        "correct": false,
        "explanation": "8-bit bus reduces throughput by 4x."
      },
      {
        "id": "d",
        "label": "Delete byte swap logic from RTL",
        "correct": false,
        "explanation": "Byte swapping is mandatory for network protocol interop."
      }
    ]
  },
  {
    "id": 29,
    "domainId": "lec_datapath_arithmetic",
    "domainName": "Datapath & Arithmetic Optimization",
    "title": "Modulo Arithmetic Sign-Extension Optimization",
    "severity": "LOW",
    "stageName": "Datapath Solver",
    "symptom": "Two's complement sign extension on 16-to-32 bit signed accumulator matched seamlessly under formal algebra.",
    "logSnippet": "// Compare: u_dsp/acc_32b[31:0]\n// Result: EQUIVALENT (Proven in 0.1s)",
    "principle": "Sign extension replicates MSB across higher order bits; Conformal proves boolean invariance across all 65,536 input states.",
    "remedyTcl": "compare",
    "beforeMetrics": [
      {
        "label": "Compare Points",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Compare Points",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run standard compare on sign-extended accumulator",
        "correct": true,
        "explanation": "Conformal verifies two's complement sign-extension logic automatically."
      },
      {
        "id": "b",
        "label": "Zero-pad the signed inputs instead",
        "correct": false,
        "explanation": "Zero padding converts signed numbers to positive unsigned."
      },
      {
        "id": "c",
        "label": "Insert an inverter on MSB bit",
        "correct": false,
        "explanation": "Inverting MSB inverts number sign incorrectly."
      },
      {
        "id": "d",
        "label": "Disable two's complement arithmetic in RTL",
        "correct": false,
        "explanation": "Two's complement is fundamental to digital DSP."
      }
    ]
  },
  {
    "id": 30,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Missing Low-to-High Level Shifter Cell on Cross-Domain Signal",
    "severity": "CRITICAL",
    "stageName": "Low Power LEC",
    "symptom": "Conformal UPF verification catches a missing level shifter cell between 0.65V CPU core and 0.95V peripheral bus.",
    "logSnippet": "// Error: Voltage domain crossing from 0.65V (PD_CORE) to 0.95V (PD_SOC) lacks level shifter\n// Violation: UPF rule 'LS_CORE_TO_SOC' violated on net 'u_core/intr_ack'",
    "principle": "Low-to-high voltage crossings require level shifter cells (LS_L2H) to prevent PMOS crowbar current and voltage mismatch.",
    "remedyTcl": "read_power_intent -both ./upf/soc_power.upf\nset_power_state -both\nverify_power_intent\ncompare",
    "beforeMetrics": [
      {
        "label": "Missing Level Shifters",
        "val": "1"
      },
      {
        "label": "UPF Violations",
        "val": "1"
      }
    ],
    "afterMetrics": [
      {
        "label": "Missing Level Shifters",
        "val": "0"
      },
      {
        "label": "UPF Violations",
        "val": "0"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Verify UPF power intent using verify_power_intent to flag missing level shifter insertion",
        "correct": true,
        "explanation": "Formal power intent verification proves all cross-voltage nets have verified level shifter cells."
      },
      {
        "id": "b",
        "label": "Remove the 0.65V power domain to match 0.95V",
        "correct": false,
        "explanation": "Removing domain defeats low-power battery optimization."
      },
      {
        "id": "c",
        "label": "Short 0.65V and 0.95V supplies together",
        "correct": false,
        "explanation": "Shorting supplies destroys the chip with over-voltage."
      },
      {
        "id": "d",
        "label": "Disable level shifter verification in Conformal",
        "correct": false,
        "explanation": "Disabling checks causes silicon crowbar failure."
      }
    ]
  },
  {
    "id": 31,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Isolation Cell Clamp State Polarity Inversion (0 vs 1)",
    "severity": "CRITICAL",
    "stageName": "Low Power LEC",
    "symptom": "Active-low reset signal (`rst_n`) was clamped to 0 instead of 1 during power-down mode, causing perpetual reset upon wake-up.",
    "logSnippet": "// Non-equivalent compare point: u_periph/rst_n (Isolation Clamp)\n// Golden UPF specifies clamp_value 1; Revised netlist implements ISO_AND (clamp 0)",
    "principle": "Active-low control nets must use OR-type isolation cells clamped to 1 so receiving active logic is not asserted during sleep.",
    "remedyTcl": "// Remedy: Update UPF isolation rule to clamp active-low signals to 1\nset_isolation iso_rst -domain PD_CPU -clamp_value 1 -elements {u_core/rst_n}\nverify_power_intent",
    "beforeMetrics": [
      {
        "label": "Clamp Value",
        "val": "0 (Illegal)"
      },
      {
        "label": "Wakeup State",
        "val": "DEADLOCK"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clamp Value",
        "val": "1 (Clean)"
      },
      {
        "label": "Wakeup State",
        "val": "NORMAL"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enforce clamp_value 1 on active-low reset isolation rules in UPF",
        "correct": true,
        "explanation": "Clamping active-low nets to 1 prevents false reset assertion during domain sleep mode."
      },
      {
        "id": "b",
        "label": "Invert the reset pin inside active peripheral domain",
        "correct": false,
        "explanation": "Inverting pin in active domain breaks normal reset operation."
      },
      {
        "id": "c",
        "label": "Delete isolation cells on reset signals",
        "correct": false,
        "explanation": "Deleting isolation allows floating mid-rail voltage to crash active logic."
      },
      {
        "id": "d",
        "label": "Tie the reset line permanently to ground",
        "correct": false,
        "explanation": "Tying reset to ground keeps the chip in perpetual reset."
      }
    ]
  },
  {
    "id": 32,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "State Retention Power Gating (SRPG) Shadow Latch Proof",
    "severity": "HIGH",
    "stageName": "Low Power LEC",
    "symptom": "State retention registers in power-gated CPU core failed equivalence because save/restore control pins were swapped.",
    "logSnippet": "// Non-equivalent compare points: 1,024 Retention Registers in PD_CPU\n// Mismatch: Save signal mapped to RESTORE pin on RET_DFF cells",
    "principle": "Retention registers contain dedicated shadow latches; Conformal verifies save/restore state transfer functions formally.",
    "remedyTcl": "verify_power_intent -retention\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Retention Errors",
        "val": "1,024"
      },
      {
        "label": "State Recovery",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Retention Errors",
        "val": "0"
      },
      {
        "label": "State Recovery",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run verify_power_intent -retention to formalize save/restore pin mapping on SRPG cells",
        "correct": true,
        "explanation": "Formal retention checks prove register states save before power-down and restore cleanly upon wake-up."
      },
      {
        "id": "b",
        "label": "Replace retention registers with normal flip-flops",
        "correct": false,
        "explanation": "Normal flops lose architectural state during sleep."
      },
      {
        "id": "c",
        "label": "Keep the CPU core permanently powered on",
        "correct": false,
        "explanation": "Defeats standby sleep power targets."
      },
      {
        "id": "d",
        "label": "Disable retention verification in Conformal",
        "correct": false,
        "explanation": "Skipping retention checks leads to sleep/wake crashes."
      }
    ]
  },
  {
    "id": 33,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Always-On (AON) Clock Buffer Power Net Connectivity",
    "severity": "HIGH",
    "stageName": "Low Power LEC",
    "symptom": "Always-on clock buffer routing through power-gated region was inadvertently connected to switched virtual VDD.",
    "logSnippet": "// Error: Instance 'u_cts/aon_clk_buf_4' inside switched domain PD_GPU connected to VDD_VIRTUAL\n// Rule: Always-on cells must connect to permanent VDD_AON",
    "principle": "Always-on buffers crossing sleeping domains must have their primary power pins connected to continuous VDD_AON.",
    "remedyTcl": "verify_power_intent -always_on\ncompare",
    "beforeMetrics": [
      {
        "label": "AON Power Violations",
        "val": "12"
      },
      {
        "label": "Clock in Sleep",
        "val": "DEAD"
      }
    ],
    "afterMetrics": [
      {
        "label": "AON Power Violations",
        "val": "0"
      },
      {
        "label": "Clock in Sleep",
        "val": "ACTIVE"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute verify_power_intent -always_on to certify permanent VDD_AON power connections",
        "correct": true,
        "explanation": "AON verification ensures clock buffers stay alive even when surrounding domain is powered down."
      },
      {
        "id": "b",
        "label": "Convert all clock buffers to switched power",
        "correct": false,
        "explanation": "Switched buffers freeze clocks across active domains."
      },
      {
        "id": "c",
        "label": "Short virtual VDD to permanent VDD",
        "correct": false,
        "explanation": "Shorting power rails defeats power gating."
      },
      {
        "id": "d",
        "label": "Delete always-on buffers from CTS",
        "correct": false,
        "explanation": "Deleting buffers causes clock skew failures."
      }
    ]
  },
  {
    "id": 34,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Power Switch Enable Daisy-Chain Invariance Proof",
    "severity": "MEDIUM",
    "stageName": "Low Power LEC",
    "symptom": "Synthesized netlist daisy-chained 400 MTCMOS header switches, altering control net structure without changing boolean state.",
    "logSnippet": "// Compare: u_power/sw_ctrl_chain[*]\n// Result: EQUIVALENT (Proven switch control logic matches UPF intent)",
    "principle": "Power switch daisy-chains staggered for inrush current control do not alter the steady-state functional boolean domain.",
    "remedyTcl": "verify_power_intent -power_switch\ncompare",
    "beforeMetrics": [
      {
        "label": "Power Switches",
        "val": "400"
      },
      {
        "label": "Status",
        "val": "UNCHECKED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Power Switches",
        "val": "400"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Verify power switch network integrity using verify_power_intent -power_switch",
        "correct": true,
        "explanation": "Power switch formal checks confirm sleep enable signals reach all MTCMOS switches cleanly."
      },
      {
        "id": "b",
        "label": "Remove MTCMOS power switches from netlist",
        "correct": false,
        "explanation": "Removing switches prevents domain power shutoff."
      },
      {
        "id": "c",
        "label": "Short all switch gates to permanent ground",
        "correct": false,
        "explanation": "Shorting gates turns switches permanently on."
      },
      {
        "id": "d",
        "label": "Invert sleep enable polarity in RTL",
        "correct": false,
        "explanation": "Inverting polarity keeps switches off during active mode."
      }
    ]
  },
  {
    "id": 35,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "DVFS Multi-Voltage Operating State Equivalence",
    "severity": "HIGH",
    "stageName": "Low Power LEC",
    "symptom": "SoC operating at 0.55V Super-Low-Power and 0.85V Turbo-Performance verified identical across logic functions.",
    "logSnippet": "// Compare: All 45,000 Compare Points across DVFS States\n// Result: EQUIVALENT (DVFS modes do not alter boolean logic)",
    "principle": "Dynamic Voltage and Frequency Scaling alters operational voltage and delay without modifying digital boolean truth tables.",
    "remedyTcl": "set_power_state -state {LOW_V TURBO_V}\ncompare",
    "beforeMetrics": [
      {
        "label": "DVFS States",
        "val": "2"
      },
      {
        "label": "Equivalence",
        "val": "READY"
      }
    ],
    "afterMetrics": [
      {
        "label": "DVFS States",
        "val": "2"
      },
      {
        "label": "Equivalence",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run multi-state power verification across all defined DVFS operating modes",
        "correct": true,
        "explanation": "Conformal certifies that voltage scaling transitions preserve 100% boolean equivalence."
      },
      {
        "id": "b",
        "label": "Synthesize separate netlists for each voltage",
        "correct": false,
        "explanation": "A single physical netlist must support all DVFS modes."
      },
      {
        "id": "c",
        "label": "Disable DVFS mode switching in firmware",
        "correct": false,
        "explanation": "Firmware controls power scaling dynamically."
      },
      {
        "id": "d",
        "label": "Delete level shifters on DVFS domains",
        "correct": false,
        "explanation": "Level shifters are mandatory at voltage boundaries."
      }
    ]
  },
  {
    "id": 36,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Isolation Control Signal Glitch Prevention Proof",
    "severity": "HIGH",
    "stageName": "Low Power LEC",
    "symptom": "Isolation enable net driven by un-registered combinational logic generated hazardous glitches during power-up sequence.",
    "logSnippet": "// Warning: Isolation enable pin 'u_core/iso_en' driven by combinational AND gate\n// Hazard: Spurious mid-rail glitch possible during domain power transition",
    "principle": "Isolation control signals must be glitch-free and driven directly by glitchless always-on registers.",
    "remedyTcl": "verify_power_intent -glitch_free_iso\ncompare",
    "beforeMetrics": [
      {
        "label": "Glitch Hazards",
        "val": "1"
      },
      {
        "label": "ISO Quality",
        "val": "RISKY"
      }
    ],
    "afterMetrics": [
      {
        "label": "Glitch Hazards",
        "val": "0"
      },
      {
        "label": "ISO Quality",
        "val": "ROBUST"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Verify isolation enable signals are driven by glitchless AON registers using verify_power_intent",
        "correct": true,
        "explanation": "Glitchless isolation control ensures receiving active logic never sees spurious transitions during wake-up."
      },
      {
        "id": "b",
        "label": "Add an inverter on the isolation control line",
        "correct": false,
        "explanation": "Inverting control inverts sleep/wake timing."
      },
      {
        "id": "c",
        "label": "Disable isolation checking during wake-up",
        "correct": false,
        "explanation": "Wake-up glitches can corrupt CPU state machines."
      },
      {
        "id": "d",
        "label": "Remove all isolation control logic",
        "correct": false,
        "explanation": "Removing control disables power isolation."
      }
    ]
  },
  {
    "id": 37,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Ground Bounce Multi-Domain Ground Invariance",
    "severity": "LOW",
    "stageName": "Low Power LEC",
    "symptom": "Dual VSS_CORE and VSS_PERIPHERAL ground rails verified connected to common analog substrate without logic short.",
    "logSnippet": "// Info: Power intent models separate VSS ground domains\n// Result: EQUIVALENT boolean logic across ground boundaries",
    "principle": "Ground domain separation in UPF provides electrical noise isolation while preserving digital zero reference.",
    "remedyTcl": "verify_power_intent\ncompare",
    "beforeMetrics": [
      {
        "label": "Ground Domains",
        "val": "2"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Ground Domains",
        "val": "2"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run standard power intent verification across separate ground domains",
        "correct": true,
        "explanation": "Formal power checks confirm ground domain boundaries are maintained without functional discrepancy."
      },
      {
        "id": "b",
        "label": "Short digital ground to high voltage supply",
        "correct": false,
        "explanation": "Shorting ground to supply causes dead shorts."
      },
      {
        "id": "c",
        "label": "Delete ground definitions from UPF",
        "correct": false,
        "explanation": "Ground intent must be declared for advanced nodes."
      },
      {
        "id": "d",
        "label": "Float the peripheral ground rail",
        "correct": false,
        "explanation": "Floating ground causes chip destruction."
      }
    ]
  },
  {
    "id": 38,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Power-Gated RAM Macro Retention Pin Verification",
    "severity": "HIGH",
    "stageName": "Low Power LEC",
    "symptom": "512KB SRAM macro retention sleep pin (`RET_EN`) was left unconnected in Revised netlist during PnR routing.",
    "logSnippet": "// Error: Macro 'u_cache/sram_512k' retention pin RET_EN is floating\n// Conformal UPF rule 'SRAM_RETENTION_CONNECT' failed",
    "principle": "Memory macros with retention modes must have their retention enable pins wired to dedicated always-on control logic.",
    "remedyTcl": "verify_power_intent -macro_pins\ncompare",
    "beforeMetrics": [
      {
        "label": "Floating Macro Pins",
        "val": "1"
      },
      {
        "label": "SRAM Retention",
        "val": "BROKEN"
      }
    ],
    "afterMetrics": [
      {
        "label": "Floating Macro Pins",
        "val": "0"
      },
      {
        "label": "SRAM Retention",
        "val": "VERIFIED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Check macro pin connectivity against UPF intent with verify_power_intent -macro_pins",
        "correct": true,
        "explanation": "Verifying macro pins ensures memory sleep and retention pins are wired properly."
      },
      {
        "id": "b",
        "label": "Delete the SRAM macro from the design",
        "correct": false,
        "explanation": "Deleting memory destroys processor functionality."
      },
      {
        "id": "c",
        "label": "Tie the SRAM retention pin to VDD permanently",
        "correct": false,
        "explanation": "Tying to VDD forces permanent sleep mode."
      },
      {
        "id": "d",
        "label": "Ignore macro pin violations in LEC",
        "correct": false,
        "explanation": "Ignoring memory pin bugs causes data corruption on sleep."
      }
    ]
  },
  {
    "id": 39,
    "domainId": "lec_low_power_upf",
    "domainName": "Low-Power UPF & Power Gating",
    "title": "Top-Level Power Intent Hierarchical Scoping Rule",
    "severity": "MEDIUM",
    "stageName": "Low Power LEC",
    "symptom": "Sub-block UPF power intent scope was misaligned with top-level SoC hierarchy instantiations.",
    "logSnippet": "// Error: UPF scope '/PD_DSP' not found in top-level hierarchy 'soc_top/u_dsp_core'\n// LEC-UPF-018: Hierarchy scope mismatch",
    "principle": "Hierarchical UPF requires exact scope definition matching RTL instance paths using set_scope.",
    "remedyTcl": "read_power_intent -module dsp_core ./upf/dsp.upf\nread_power_intent -top soc_top ./upf/top.upf\nverify_power_intent",
    "beforeMetrics": [
      {
        "label": "Scope Mismatches",
        "val": "1"
      },
      {
        "label": "UPF State",
        "val": "INVALID"
      }
    ],
    "afterMetrics": [
      {
        "label": "Scope Mismatches",
        "val": "0"
      },
      {
        "label": "UPF State",
        "val": "VALID"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Bind sub-module UPF files to proper instance scopes using read_power_intent -module",
        "correct": true,
        "explanation": "Modular UPF scoping ensures sub-block power rules bind cleanly to top-level SoC instances."
      },
      {
        "id": "b",
        "label": "Flatten all UPF files into a single un-scoped script",
        "correct": false,
        "explanation": "Un-scoped UPF causes instance name collisions."
      },
      {
        "id": "c",
        "label": "Delete sub-block power rules",
        "correct": false,
        "explanation": "Deleting rules drops power gating for sub-modules."
      },
      {
        "id": "d",
        "label": "Rename RTL instances to match wrong UPF scopes",
        "correct": false,
        "explanation": "Modifying RTL to match broken scripts is bad practice."
      }
    ]
  },
  {
    "id": 40,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Scan Chain Reordering Invariance in Post-Route Netlist",
    "severity": "CRITICAL",
    "stageName": "DFT Setup",
    "symptom": "Innovus reordered 12,000 flip-flops in scan chains to optimize wire routing, failing functional equivalence without test mode pin constraints.",
    "logSnippet": "// Non-equivalent compare points: 12,000 DFFs in scan chain\n// Root Cause: scan_enable=1 during compare; evaluating test shift data paths",
    "principle": "Scan chain connections are tested exclusively in manufacturing test mode. When verifying functional equivalence, tie scan_enable to 0.",
    "remedyTcl": "add_pin_constraints 0 scan_enable -both\nadd_pin_constraints 0 test_mode -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Non-Equiv DFFs",
        "val": "12,000"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Non-Equiv DFFs",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain scan_enable and test_mode pins to 0 using add_pin_constraints",
        "correct": true,
        "explanation": "Clamping scan_enable to 0 isolates scan shift routing and tests pure functional datapath logic."
      },
      {
        "id": "b",
        "label": "Force Innovus to preserve original synthesis scan chain order",
        "correct": false,
        "explanation": "Preserving scan order creates massive physical wire congestion."
      },
      {
        "id": "c",
        "label": "Delete all scan chains from the physical netlist",
        "correct": false,
        "explanation": "Deleting scan chains makes the fabricated chip untestable."
      },
      {
        "id": "d",
        "label": "Invert the scan input pins on all registers",
        "correct": false,
        "explanation": "Inverting scan pins breaks DFT test vectors."
      }
    ]
  },
  {
    "id": 41,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Scan Compression Decompressor/Compactor Formal Bypass",
    "severity": "HIGH",
    "stageName": "DFT Setup",
    "symptom": "On-chip scan compression XOR decompressor network evaluated into functional data cones without test mode clamping.",
    "logSnippet": "// Compare: 340 points non-equivalent on scan decompressor interface\n// Mismatch: Test compression logic active during functional compare",
    "principle": "On-chip scan compression logic must be isolated during functional LEC by clamping edt_mode / scan_compression_en to 0.",
    "remedyTcl": "add_pin_constraints 0 edt_mode -both\nadd_pin_constraints 0 scan_compression_en -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Decompressor Mismatches",
        "val": "340"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Decompressor Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Clamp scan compression mode pins to 0 using add_pin_constraints",
        "correct": true,
        "explanation": "Clamping compression mode pins ensures XOR decompressor logic is bypassed during functional verification."
      },
      {
        "id": "b",
        "label": "Remove scan decompressor logic from netlist",
        "correct": false,
        "explanation": "Removing decompressor increases test time by 50x."
      },
      {
        "id": "c",
        "label": "Tie compression test data inputs to constant 1",
        "correct": false,
        "explanation": "Tying inputs does not bypass the test mode."
      },
      {
        "id": "d",
        "label": "Disable compression checking in manufacturing test",
        "correct": false,
        "explanation": "Compression is vital for factory ATE testers."
      }
    ]
  },
  {
    "id": 42,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Memory BIST (MBIST) Collar Wrapper Mux Isolation",
    "severity": "HIGH",
    "stageName": "DFT Setup",
    "symptom": "MBIST test collar multiplexers on SRAM memory address inputs compared non-equivalent because mbist_en was unconstrained.",
    "logSnippet": "// Non-equivalent compare points: 128 Address/Data pins on SRAM macros\n// Mismatch: MBIST pattern generator driving RAM inputs instead of functional bus",
    "principle": "MBIST multiplexers must be held in functional mode by constraining mbist_mode / mbist_en to 0.",
    "remedyTcl": "add_pin_constraints 0 mbist_en -both\nadd_pin_constraints 0 mbist_start -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "RAM Pin Mismatches",
        "val": "128"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "RAM Pin Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain MBIST enable pins to 0 with add_pin_constraints 0 mbist_en -both",
        "correct": true,
        "explanation": "Clamping MBIST enable to 0 selects functional CPU/DMA bus access to memory macros."
      },
      {
        "id": "b",
        "label": "Delete the MBIST collar from SRAM macros",
        "correct": false,
        "explanation": "Deleting MBIST prevents memory manufacturing test."
      },
      {
        "id": "c",
        "label": "Force MBIST to run continuously",
        "correct": false,
        "explanation": "Continuous MBIST blocks normal processor access to memory."
      },
      {
        "id": "d",
        "label": "Short MBIST test pins to ground inside SRAM RTL",
        "correct": false,
        "explanation": "Modifying SRAM RTL corrupts standard vendor memory IP."
      }
    ]
  },
  {
    "id": 43,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Boundary Scan IEEE 1149.1 TAP Controller Masking",
    "severity": "MEDIUM",
    "stageName": "DFT Setup",
    "symptom": "JTAG boundary scan TAP controller in Test-Logic-Reset state verified non-interfering with functional I/O pads.",
    "logSnippet": "// Compare: All 180 I/O Pad Boundary Scan Cells\n// Result: EQUIVALENT (Boundary scan bypass cells transparent in functional mode)",
    "principle": "Holding JTAG TMS=1 and TRST_N=0 keeps the boundary scan TAP controller in Test-Logic-Reset mode, making I/O pads transparent.",
    "remedyTcl": "add_pin_constraints 0 trst_n -both\nadd_pin_constraints 1 tms -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Boundary Scan Cells",
        "val": "180"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Boundary Scan Cells",
        "val": "180"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain JTAG TAP controller to Test-Logic-Reset mode using add_pin_constraints",
        "correct": true,
        "explanation": "Holding TAP controller in reset ensures boundary scan data registers do not intercept chip pad signals."
      },
      {
        "id": "b",
        "label": "Remove JTAG TAP controller from netlist",
        "correct": false,
        "explanation": "Removing JTAG breaks board-level test and debug."
      },
      {
        "id": "c",
        "label": "Tie JTAG TCK clock to 1 GHz",
        "correct": false,
        "explanation": "TCK is a low-speed 20 MHz test clock."
      },
      {
        "id": "d",
        "label": "Invert TDI test data input line",
        "correct": false,
        "explanation": "Inverting TDI corrupts JTAG instruction decoding."
      }
    ]
  },
  {
    "id": 44,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "On-Chip Clock Controller (OCC) Test Mux Verification",
    "severity": "HIGH",
    "stageName": "DFT Setup",
    "symptom": "OCC test clock selection multiplexers evaluated between PLL functional clock and ATE scan clock without OCC mode constraint.",
    "logSnippet": "// Compare: Clock root compare points in u_cts/occ_root_inst\n// Mismatch: ATE scan clock path active during compare",
    "principle": "OCC test mode select pins (occ_mode_en) must be constrained to 0 so the tool verifies the high-speed PLL clock branch.",
    "remedyTcl": "add_pin_constraints 0 occ_mode_en -both\nadd_pin_constraints 0 fast_capture_en -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "OCC Clock Mismatches",
        "val": "16"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "OCC Clock Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Clamp OCC test mode enable pins to 0 with add_pin_constraints",
        "correct": true,
        "explanation": "Clamping OCC mode ensures functional PLL clock paths are selected for equivalence proofs."
      },
      {
        "id": "b",
        "label": "Delete the OCC clock controller from the clock tree",
        "correct": false,
        "explanation": "Deleting OCC prevents at-speed transition test."
      },
      {
        "id": "c",
        "label": "Short PLL clock directly to ATE scan clock port",
        "correct": false,
        "explanation": "Shorting clocks creates electrical clock conflicts."
      },
      {
        "id": "d",
        "label": "Invert the OCC bypass select signal",
        "correct": false,
        "explanation": "Inverting signal forces permanent test clock mode."
      }
    ]
  },
  {
    "id": 45,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Dual-Rail Lockup Latch Scan Reordering Invariance",
    "severity": "LOW",
    "stageName": "DFT Setup",
    "symptom": "Lockup latches inserted between cross-clock-domain scan registers verified completely transparent in functional mode.",
    "logSnippet": "// Info: 48 Lockup latches detected in scan chain\n// Result: EQUIVALENT (Lockup latches inactive when scan_enable=0)",
    "principle": "Lockup latches exist solely to prevent scan hold time violations during test shift mode; they have zero impact when scan_enable=0.",
    "remedyTcl": "add_pin_constraints 0 scan_enable -both\ncompare",
    "beforeMetrics": [
      {
        "label": "Lockup Latches",
        "val": "48"
      },
      {
        "label": "Functional Impact",
        "val": "ZERO"
      }
    ],
    "afterMetrics": [
      {
        "label": "Lockup Latches",
        "val": "48"
      },
      {
        "label": "Functional Impact",
        "val": "ZERO"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Verify functional equivalence with scan_enable tied low",
        "correct": true,
        "explanation": "Lockup latches are physically bypassed when scan_enable is 0."
      },
      {
        "id": "b",
        "label": "Delete lockup latches from scan chains",
        "correct": false,
        "explanation": "Deleting lockup latches causes scan shift hold violations on tester."
      },
      {
        "id": "c",
        "label": "Replace lockup latches with flip-flops",
        "correct": false,
        "explanation": "Flip-flops change scan chain cycle latency."
      },
      {
        "id": "d",
        "label": "Invert the clock input to lockup latches",
        "correct": false,
        "explanation": "Inverting clock breaks lockup latch half-cycle timing."
      }
    ]
  },
  {
    "id": 46,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Logic BIST (LBIST) PRPG Pattern Generator Bypass",
    "severity": "HIGH",
    "stageName": "DFT Setup",
    "symptom": "Pseudo-Random Pattern Generator (PRPG) and MISR signature registers unconstrained during functional compare.",
    "logSnippet": "// Non-equivalent compare points: 256 PRPG/MISR registers\n// Mismatch: Autonomous LBIST execution active",
    "principle": "LBIST controllers must be disabled during functional LEC by asserting lbist_en=0 and lbist_start=0.",
    "remedyTcl": "add_pin_constraints 0 lbist_en -both\nadd_pin_constraints 0 lbist_start -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "LBIST Mismatches",
        "val": "256"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "LBIST Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "PASS"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Clamp LBIST enable pins to 0 with add_pin_constraints",
        "correct": true,
        "explanation": "Clamping LBIST enable isolates autonomous pseudo-random generators from functional logic."
      },
      {
        "id": "b",
        "label": "Delete the LBIST engine from the chip",
        "correct": false,
        "explanation": "Deleting LBIST removes automotive in-field self-test."
      },
      {
        "id": "c",
        "label": "Force MISR signature register to zero",
        "correct": false,
        "explanation": "Forcing signature destroys fault detection."
      },
      {
        "id": "d",
        "label": "Run LBIST continuously during functional mode",
        "correct": false,
        "explanation": "Continuous LBIST corrupts CPU execution."
      }
    ]
  },
  {
    "id": 47,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "IEEE 1500 Embedded Core Test Wrapper Masking",
    "severity": "MEDIUM",
    "stageName": "DFT Setup",
    "symptom": "IEEE 1500 wrapper boundary cells on embedded DSP core verified transparent in normal mission mode.",
    "logSnippet": "// Compare: 512 Core Wrapper Cells in u_dsp/wrc_inst[*]\n// Result: EQUIVALENT (Wrapper bypass mode verified)",
    "principle": "Asserting IEEE 1500 `wrc_mode=0` and `wrc_select=0` ensures core test wrappers pass functional signals transparently.",
    "remedyTcl": "add_pin_constraints 0 wrc_mode -both\nadd_pin_constraints 0 wrc_select -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Wrapper Cells",
        "val": "512"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Wrapper Cells",
        "val": "512"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain IEEE 1500 core wrapper control pins to 0",
        "correct": true,
        "explanation": "Setting wrapper mode to 0 guarantees transparent chip mission mode operation."
      },
      {
        "id": "b",
        "label": "Delete IEEE 1500 wrappers from IP blocks",
        "correct": false,
        "explanation": "Deleting wrappers prevents modular core testing."
      },
      {
        "id": "c",
        "label": "Short wrapper serial input to serial output",
        "correct": false,
        "explanation": "Shorting test lines does not isolate parallel functional paths."
      },
      {
        "id": "d",
        "label": "Invert the wrapper clock signal",
        "correct": false,
        "explanation": "Inverting clock corrupts wrapper scan timing."
      }
    ]
  },
  {
    "id": 48,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Analog Test Mux (AMUX) Isolation Pin Clamping",
    "severity": "LOW",
    "stageName": "DFT Setup",
    "symptom": "Analog test bus multiplexer pins verified isolated from internal ADC/DAC sensitive analog voltage nodes.",
    "logSnippet": "// Compare: u_analog/amux_sel[3:0]\n// Result: EQUIVALENT (Analog test bus disconnected in mission mode)",
    "principle": "AMUX selector pins clamped to 0 isolate sensitive analog nodes from digital test bus noise.",
    "remedyTcl": "add_pin_constraints 0 amux_en -both\ncompare",
    "beforeMetrics": [
      {
        "label": "AMUX Pins",
        "val": "4"
      },
      {
        "label": "Status",
        "val": "ISOLATED"
      }
    ],
    "afterMetrics": [
      {
        "label": "AMUX Pins",
        "val": "4"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Clamp AMUX test enable pins to 0",
        "correct": true,
        "explanation": "Clamping AMUX disconnects external test probes during normal execution."
      },
      {
        "id": "b",
        "label": "Connect AMUX to power supply",
        "correct": false,
        "explanation": "Connecting AMUX to supply creates dead shorts."
      },
      {
        "id": "c",
        "label": "Delete the AMUX from the netlist",
        "correct": false,
        "explanation": "AMUX is needed for factory analog calibration."
      },
      {
        "id": "d",
        "label": "Short analog inputs together",
        "correct": false,
        "explanation": "Shorting analog inputs destroys signal accuracy."
      }
    ]
  },
  {
    "id": 49,
    "domainId": "lec_scan_dft_bypass",
    "domainName": "Scan & DFT Logic Bypass Equivalence",
    "title": "Scan Shift Mode Dedicated Verification Run",
    "severity": "MEDIUM",
    "stageName": "DFT Setup",
    "symptom": "Dedicated DFT verification mode proving scan chains shift vectors from scan_in to scan_out without functional interference.",
    "logSnippet": "// Dedicated Scan Shift Mode LEC:\n// scan_enable=1, test_mode=1\n// Result: All 64 Scan Chains verify 100% serial shift equivalence",
    "principle": "In scan shift LEC, constrain scan_enable=1 to formally verify that scan_in pins connect exclusively to scan_out through shift registers.",
    "remedyTcl": "add_pin_constraints 1 scan_enable -both\nadd_pin_constraints 1 test_mode -both\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Scan Chains",
        "val": "64"
      },
      {
        "label": "Shift Proof",
        "val": "VERIFYING"
      }
    ],
    "afterMetrics": [
      {
        "label": "Scan Chains",
        "val": "64"
      },
      {
        "label": "Shift Proof",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run dedicated scan shift LEC with scan_enable=1 to certify scan chain integrity",
        "correct": true,
        "explanation": "Verifying scan shift mode proves all scan chains are structurally intact from scan_in to scan_out pins."
      },
      {
        "id": "b",
        "label": "Force all scan registers to permanent 0",
        "correct": false,
        "explanation": "Forcing to 0 prevents test vector shifting."
      },
      {
        "id": "c",
        "label": "Short scan_in directly to scan_out",
        "correct": false,
        "explanation": "Shorting bypasses the internal flip-flops."
      },
      {
        "id": "d",
        "label": "Disable scan shift verification",
        "correct": false,
        "explanation": "Scan shift proof guarantees zero physical scan chain breaks."
      }
    ]
  },
  {
    "id": 50,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Integrated Clock Gating (ICG) Latch-Enable Formal Proof",
    "severity": "CRITICAL",
    "stageName": "Clock Gating",
    "symptom": "Synthesis replaced RTL clock enable muxes (`if (en) q <= d;`) with Integrated Clock Gating cells (`ICG_X4`), causing compare mismatches without clock gate mapping.",
    "logSnippet": "// Compare: 4,500 DFFs driven by ICG cells in Revised netlist\n// Golden RTL models recirculating multiplexer feedback\n// State: Non-equivalent unless gated clock mapping is enabled",
    "principle": "Recirculating data enable muxes in RTL are mathematically identical to clock-gated registers when ICG cells have active-low latches.",
    "remedyTcl": "set_flatten_model -gated_clock\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "ICG Compare Mismatches",
        "val": "4,500"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "ICG Compare Mismatches",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable automatic clock gating transformation mapping with set_flatten_model -gated_clock",
        "correct": true,
        "explanation": "Clock gating mapping proves that stopping the clock via ICG latches matches holding register values via recirculating multiplexers."
      },
      {
        "id": "b",
        "label": "Delete all ICG cells and restore data muxes in PnR",
        "correct": false,
        "explanation": "Restoring data muxes increases clock dynamic power by 40%."
      },
      {
        "id": "c",
        "label": "Invert the ICG enable pin polarity",
        "correct": false,
        "explanation": "Inverting enable polarity gates the clock during active cycles."
      },
      {
        "id": "d",
        "label": "Disable clock gating verification in LEC",
        "correct": false,
        "explanation": "Skipping ICG verification risks silicon clock gating glitch failures."
      }
    ]
  },
  {
    "id": 51,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Multi-Stage Hierarchical Clock Gating Cloning Equivalence",
    "severity": "HIGH",
    "stageName": "Clock Gating",
    "symptom": "Innovus cloned a single root ICG cell into 8 distributed branch ICG cells to satisfy clock max_fanout rules.",
    "logSnippet": "// Revised netlist contains 8 cloned ICG instances: u_cts/icg_branch_0..7\n// Golden netlist has 1 root ICG instance: u_ctrl/icg_root",
    "principle": "Clock gate cloning replicates enable logic across parallel trees without changing downstream register clocking behavior.",
    "remedyTcl": "set_flatten_model -gated_clock -seq_constant\nmap_key_points\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Cloned ICGs",
        "val": "8"
      },
      {
        "label": "Status",
        "val": "UNMAPPED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Cloned ICGs",
        "val": "8"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable clock gate cloning analysis with set_flatten_model -gated_clock",
        "correct": true,
        "explanation": "Conformal recognizes cloned ICG branches as functionally identical parallel clock drivers."
      },
      {
        "id": "b",
        "label": "Force PnR to use only a single ICG cell",
        "correct": false,
        "explanation": "A single ICG cell violates physical slew and capacitance DRCs."
      },
      {
        "id": "c",
        "label": "Short all 8 ICG output clocks together",
        "correct": false,
        "explanation": "Shorting clock driver outputs creates severe crowbar currents."
      },
      {
        "id": "d",
        "label": "Delete the cloned ICG enable lines",
        "correct": false,
        "explanation": "Deleting enable lines disables clock gating power savings."
      }
    ]
  },
  {
    "id": 52,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Sequential Retiming Forward Pipeline Register Shift",
    "severity": "HIGH",
    "stageName": "Retiming Proof",
    "symptom": "Synthesis moved a pipeline register forward across an ALU multiplexer, changing register locations from inputs to output.",
    "logSnippet": "// Non-equivalent compare points: 32 DFFs in u_alu/op_reg[*] shifted across MUX\n// Golden: 2x 32-bit registers before MUX; Revised: 1x 32-bit register after MUX",
    "principle": "Forward sequential retiming merges parallel input registers into a single output register; verify using synthesis FV_MAP.",
    "remedyTcl": "read_fv_map -retime ./synthesis/genus_retiming.map\nset_system_mode lec\ncompare",
    "beforeMetrics": [
      {
        "label": "Retimed Points",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "FAIL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Retimed Points",
        "val": "0"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Ingest synthesis retiming map using read_fv_map -retime to prove sequential equivalence",
        "correct": true,
        "explanation": "The FV retiming map allows Conformal to verify sequential transfer function invariance across retimed pipeline registers."
      },
      {
        "id": "b",
        "label": "Disable pipeline retiming in synthesis",
        "correct": false,
        "explanation": "Disabling retiming drops chip clock frequency by 15%."
      },
      {
        "id": "c",
        "label": "Insert duplicate registers in RTL manually",
        "correct": false,
        "explanation": "Manual RTL changes risk introducing pipeline mismatch bugs."
      },
      {
        "id": "d",
        "label": "Ignore ALU output compare points",
        "correct": false,
        "explanation": "Ignoring ALU outputs creates catastrophic verification gaps."
      }
    ]
  },
  {
    "id": 53,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Valid-Ready Skid Buffer Register Retiming Equivalence",
    "severity": "MEDIUM",
    "stageName": "Retiming Proof",
    "symptom": "AXI-Stream skid buffer register retiming verified equivalent to baseline 2-stage FIFO without throughput loss.",
    "logSnippet": "// Compare: u_axi/skid_buffer_inst (Forward & Backward Register Stages)\n// Result: EQUIVALENT (Zero bubble cycles, 100% throughput proven)",
    "principle": "Skid buffers decouple ready and valid timing paths; Conformal proves sequential cycle-by-cycle equivalence.",
    "remedyTcl": "set_flatten_model -seq_constant -gated_clock\ncompare",
    "beforeMetrics": [
      {
        "label": "Skid Buffer FFs",
        "val": "64"
      },
      {
        "label": "Status",
        "val": "VERIFYING"
      }
    ],
    "afterMetrics": [
      {
        "label": "Skid Buffer FFs",
        "val": "64"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute sequential compare on skid buffer register logic",
        "correct": true,
        "explanation": "Conformal verifies that skid buffer register forwarding logic preserves exact stream data ordering."
      },
      {
        "id": "b",
        "label": "Replace skid buffer with a direct wire connection",
        "correct": false,
        "explanation": "Direct wiring creates combinational timing loops."
      },
      {
        "id": "c",
        "label": "Force ready signal permanently to 1",
        "correct": false,
        "explanation": "Forcing ready drops data when receiver is busy."
      },
      {
        "id": "d",
        "label": "Delete the skid buffer shadow registers",
        "correct": false,
        "explanation": "Deleting shadow registers halves pipeline throughput."
      }
    ]
  },
  {
    "id": 54,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Glitchless Clock Multiplexer Dynamic Switching Proof",
    "severity": "HIGH",
    "stageName": "Clock Gating",
    "symptom": "Glitch-free clock switch containing dual cross-coupled enable latches verified transparent to both reference clocks.",
    "logSnippet": "// Compare: u_clkmux/glitchfree_switch_inst\n// Result: EQUIVALENT across both clk_fast and clk_slow modes",
    "principle": "Glitchless clock muxes prevent runt pulses during dynamic clock switching; formal equivalence proves state coverage.",
    "remedyTcl": "add_pin_constraints 0 clk_sel -both\ncompare\nadd_pin_constraints 1 clk_sel -both\ncompare",
    "beforeMetrics": [
      {
        "label": "Glitchfree Mux",
        "val": "1"
      },
      {
        "label": "Modes Verified",
        "val": "0/2"
      }
    ],
    "afterMetrics": [
      {
        "label": "Glitchfree Mux",
        "val": "1"
      },
      {
        "label": "Modes Verified",
        "val": "2/2"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Verify glitchless clock mux under both clk_sel=0 and clk_sel=1 pin constraints",
        "correct": true,
        "explanation": "Testing both select states proves glitchless clock multiplexing is functionally correct in all modes."
      },
      {
        "id": "b",
        "label": "Replace glitchless mux with a simple combinational AND gate",
        "correct": false,
        "explanation": "AND gates produce dangerous clock runt glitches."
      },
      {
        "id": "c",
        "label": "Short both clock inputs together",
        "correct": false,
        "explanation": "Shorting asynchronous clocks causes clock tree contention."
      },
      {
        "id": "d",
        "label": "Disable clock multiplexer verification",
        "correct": false,
        "explanation": "Clock switches must be verified to prevent silicon lockup."
      }
    ]
  },
  {
    "id": 55,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Clock Divider Toggle Flip-Flop Equivalence",
    "severity": "MEDIUM",
    "stageName": "Clock Gating",
    "symptom": "Divide-by-2 clock divider implemented with inverted feedback DFF verified equivalent to behavioral clock toggle RTL.",
    "logSnippet": "// Compare: u_div/clk_div2_reg (Toggle Flip-Flop)\n// Result: EQUIVALENT (50% duty cycle divided clock proven)",
    "principle": "A toggle flip-flop with D = ~Q divides clock frequency by 2; Conformal proves boolean state toggling matches behavioral models.",
    "remedyTcl": "compare",
    "beforeMetrics": [
      {
        "label": "Clock Divider FFs",
        "val": "1"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Divider FFs",
        "val": "1"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run standard compare on toggle clock divider register",
        "correct": true,
        "explanation": "Conformal proves D = ~Q sequential flip-flop matches RTL clock division logic."
      },
      {
        "id": "b",
        "label": "Replace clock divider with an external crystal",
        "correct": false,
        "explanation": "On-chip clock dividers provide internal divided clocks."
      },
      {
        "id": "c",
        "label": "Invert the reset polarity on the divider",
        "correct": false,
        "explanation": "Inverting reset changes initial clock phase."
      },
      {
        "id": "d",
        "label": "Set divider output to constant 1",
        "correct": false,
        "explanation": "Constant output stops the divided clock tree."
      }
    ]
  },
  {
    "id": 56,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Multicycle Path Register Setup/Hold Invariance",
    "severity": "LOW",
    "stageName": "Clock Gating",
    "symptom": "2-cycle multicycle path with clock enable active every second cycle verified functionally equivalent to RTL intent.",
    "logSnippet": "// Compare: u_dsp/mcp_stage2_reg[*]\n// Result: EQUIVALENT (Clock enable matches 2-cycle multi-rate transfer)",
    "principle": "Multicycle paths constrained in SDC operate under multi-cycle clock enable logic that Conformal verifies formally.",
    "remedyTcl": "compare",
    "beforeMetrics": [
      {
        "label": "MCP Registers",
        "val": "64"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "MCP Registers",
        "val": "64"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute compare on multicycle path register cones",
        "correct": true,
        "explanation": "Conformal proves multicycle clock-enabled registers preserve data across designated clock cycles."
      },
      {
        "id": "b",
        "label": "Delete multicycle clock enable logic",
        "correct": false,
        "explanation": "Deleting enable logic causes data corruption on cycle 1."
      },
      {
        "id": "c",
        "label": "Force all multicycle paths to 1-cycle",
        "correct": false,
        "explanation": "1-cycle operation creates massive setup timing violations."
      },
      {
        "id": "d",
        "label": "Ignore multicycle registers during LEC",
        "correct": false,
        "explanation": "MCP registers must be verified formally."
      }
    ]
  },
  {
    "id": 57,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Asynchronous FIFO Gray Pointer Synchronization Invariance",
    "severity": "HIGH",
    "stageName": "Clock Gating",
    "symptom": "Gray-code write pointer increment and 2-FF synchronizer stages verified preserving 1-bit-change-per-cycle transfer.",
    "logSnippet": "// Compare: u_fifo/wptr_gray_reg[5:0] & sync_rptr_reg[5:0]\n// Result: EQUIVALENT (Gray encoding and register stages proven)",
    "principle": "Gray pointer generation and synchronizer stages are sequential state points that Conformal verifies against Golden RTL.",
    "remedyTcl": "add_compared_points u_fifo/*reg*\ncompare",
    "beforeMetrics": [
      {
        "label": "FIFO Pointer Bits",
        "val": "6"
      },
      {
        "label": "Sync Stages",
        "val": "2"
      }
    ],
    "afterMetrics": [
      {
        "label": "FIFO Pointer Bits",
        "val": "6"
      },
      {
        "label": "Sync Stages",
        "val": "2"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Add FIFO pointer and synchronizer registers to compare list and execute compare",
        "correct": true,
        "explanation": "Conformal certifies that binary-to-Gray conversion and multi-stage synchronizers match RTL architecture."
      },
      {
        "id": "b",
        "label": "Replace Gray pointers with binary counters",
        "correct": false,
        "explanation": "Binary counters across asynchronous boundaries cause CDC metastability glitches."
      },
      {
        "id": "c",
        "label": "Short synchronizer stages into a single register",
        "correct": false,
        "explanation": "1-FF synchronizers have unacceptable MTBF failure rates."
      },
      {
        "id": "d",
        "label": "Delete the asynchronous FIFO",
        "correct": false,
        "explanation": "Asynchronous FIFOs are required for cross-clock data transfer."
      }
    ]
  },
  {
    "id": 58,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Register File Multi-Port Read/Write Address Decoding Equivalence",
    "severity": "MEDIUM",
    "stageName": "Clock Gating",
    "symptom": "32x32-bit register file with 2 read ports and 1 write port verified against synthesizable mux array netlist.",
    "logSnippet": "// Compare: 1,024 Register File Storage Bits (32 Words x 32 Bits)\n// Result: EQUIVALENT (All 1,024 storage latches/FFs match Golden)",
    "principle": "Multi-port register file decoding logic matches discrete flip-flop array models when address decoders are mapped.",
    "remedyTcl": "set_flatten_model -seq_constant\ncompare",
    "beforeMetrics": [
      {
        "label": "Regfile Bits",
        "val": "1,024"
      },
      {
        "label": "Status",
        "val": "VERIFYING"
      }
    ],
    "afterMetrics": [
      {
        "label": "Regfile Bits",
        "val": "1,024"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run compare on register file memory storage points",
        "correct": true,
        "explanation": "Conformal proves multi-port read/write address decoding matches Golden RTL storage arrays."
      },
      {
        "id": "b",
        "label": "Treat register file as an unverified blackbox",
        "correct": false,
        "explanation": "Register files must be verified to ensure processor core correctness."
      },
      {
        "id": "c",
        "label": "Short all 32 register words together",
        "correct": false,
        "explanation": "Shorting words destroys register addressability."
      },
      {
        "id": "d",
        "label": "Disable write enable checks",
        "correct": false,
        "explanation": "Write enable logic is vital to prevent register corruption."
      }
    ]
  },
  {
    "id": 59,
    "domainId": "lec_clock_gating_retiming",
    "domainName": "Clock Gating & Sequential Retiming",
    "title": "Dual-Edge Clocking (DDR) Flip-Flop Mapping",
    "severity": "HIGH",
    "stageName": "Clock Gating",
    "symptom": "DDR interface utilizing positive-edge and negative-edge triggered registers mapped cleanly under dual-phase modeling.",
    "logSnippet": "// Compare: u_ddr/tx_pos_reg[*] (Posedge) & tx_neg_reg[*] (Negedge)\n// Result: EQUIVALENT (Double data rate transfer verified)",
    "principle": "Dual-edge clocking transfers data on both clock edges; Conformal models rising and falling edge Key Points independently.",
    "remedyTcl": "set_flatten_model -dual_edge\nmap_key_points\ncompare",
    "beforeMetrics": [
      {
        "label": "DDR Registers",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "VERIFIED"
      }
    ],
    "afterMetrics": [
      {
        "label": "DDR Registers",
        "val": "32"
      },
      {
        "label": "Status",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable dual-edge clock modeling with set_flatten_model -dual_edge",
        "correct": true,
        "explanation": "Dual-edge modeling allows Conformal to verify both posedge and negedge registers in DDR interfaces."
      },
      {
        "id": "b",
        "label": "Convert all negedge registers to posedge in RTL",
        "correct": false,
        "explanation": "Converting edges halves DDR transmission bandwidth."
      },
      {
        "id": "c",
        "label": "Invert the DDR clock externally",
        "correct": false,
        "explanation": "Inverting clock swaps odd and even data words."
      },
      {
        "id": "d",
        "label": "Ignore negedge register compare points",
        "correct": false,
        "explanation": "Ignoring negedge registers skips half of all DDR data."
      }
    ]
  },
  {
    "id": 60,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Counter-Example Vector Diagnosis & Error Cone Isolation",
    "severity": "CRITICAL",
    "stageName": "Non-Equiv Debug",
    "symptom": "Conformal flags a non-equivalent compare point at `u_ctrl/fsm_next_state[2]`; engineer needs to diagnose the root cause.",
    "logSnippet": "// Compare Results: 1 NON-EQUIVALENT compare point\n// Failing Point: u_ctrl/fsm_next_state[2] (DFF)\n// Counter-Example: {mode=2'b10, timeout=1'b1, ack=1'b0} -> Golden=1, Revised=0",
    "principle": "Counter-example vectors pinpoint the exact input stimulus where Golden and Revised logic cones diverge; use diagnose to isolate the faulty gate.",
    "remedyTcl": "diagnose -point u_ctrl/fsm_next_state[2] -view\nset_system_mode lec",
    "beforeMetrics": [
      {
        "label": "Failing Points",
        "val": "1"
      },
      {
        "label": "Root Cause",
        "val": "UNKNOWN"
      }
    ],
    "afterMetrics": [
      {
        "label": "Failing Points",
        "val": "1"
      },
      {
        "label": "Root Cause",
        "val": "ISOLATED (NAND2 Pin A)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run diagnose -point to display counter-example vector and isolate the error gate cone",
        "correct": true,
        "explanation": "The diagnose command highlights the exact combinational gate where boolean evaluation differs between netlists."
      },
      {
        "id": "b",
        "label": "Delete the failing register from the netlist",
        "correct": false,
        "explanation": "Deleting failing registers hides design bugs."
      },
      {
        "id": "c",
        "label": "Invert the output of the failing gate randomly",
        "correct": false,
        "explanation": "Random patching risks introducing further subtle errors."
      },
      {
        "id": "d",
        "label": "Ignore the single non-equivalent point",
        "correct": false,
        "explanation": "A single non-equivalent point will crash physical silicon."
      }
    ]
  },
  {
    "id": 61,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Automated Functional ECO Patch Generation (`write_eco_script`)",
    "severity": "CRITICAL",
    "stageName": "Functional ECO",
    "symptom": "RTL bug fix in ALU control logic requires generating a minimal, surgical gate-level ECO patch for Innovus P&R.",
    "logSnippet": "// Golden: Modified RTL with bug fix in u_alu/overflow_detect\n// Revised: Post-route tapeout netlist\n// Target: Generate minimal spare cell patch script",
    "principle": "Conformal ECO engine computes the boolean difference between Golden and Revised cones and synthesizes a minimal ECO patch.",
    "remedyTcl": "write_eco_script -replace -eco_dir ./eco_patch_r1 -format innovus\n// Generated file: eco_patch_r1/eco_patch.tcl",
    "beforeMetrics": [
      {
        "label": "Manual ECO Time",
        "val": "3 Days"
      },
      {
        "label": "Gate Disruption",
        "val": "HIGH"
      }
    ],
    "afterMetrics": [
      {
        "label": "Automated ECO Time",
        "val": "45 Seconds"
      },
      {
        "label": "Gate Disruption",
        "val": "MINIMAL (3 Gates)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Generate automated Innovus ECO patch using write_eco_script",
        "correct": true,
        "explanation": "write_eco_script outputs optimized Tcl commands (eco_change_cell, eco_add_repeater) to patch the netlist surgically."
      },
      {
        "id": "b",
        "label": "Re-synthesize the entire chip from scratch in Genus",
        "correct": false,
        "explanation": "Full re-synthesis requires re-running full PnR and invalidates post-route timing closure."
      },
      {
        "id": "c",
        "label": "Hand-edit the 100MB Verilog netlist in a text editor",
        "correct": false,
        "explanation": "Hand-editing large netlists is dangerous and prone to syntax/logical errors."
      },
      {
        "id": "d",
        "label": "Modify the physical GDSII layout polygons manually",
        "correct": false,
        "explanation": "GDSII polygon hacking violates LVS and DRC integrity."
      }
    ]
  },
  {
    "id": 62,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Pre-Mask vs Post-Mask Metal-Only Spare Cell Allocation",
    "severity": "HIGH",
    "stageName": "Functional ECO",
    "symptom": "Post-mask functional bug fix must be implemented using ONLY pre-placed spare gates (NAND2, NOR2, INVERTER) to avoid base wafer re-spin.",
    "logSnippet": "// Spare Cell Budget: 420 Spare Gates allocated in floorplan whitespace\n// Conformal ECO mapping: Patch requires 2x NAND2_SPARE and 1x INV_SPARE",
    "principle": "In post-mask ECOs, map patch logic exclusively to pre-instantiated spare cells via map_spare_cells to restrict changes to metal masks.",
    "remedyTcl": "read_spare_cells ./pnr/spare_cell_list.txt\nmap_spare_cells -eco_dir ./metal_eco_patch\nwrite_eco_script -spare_only -format innovus",
    "beforeMetrics": [
      {
        "label": "Mask Re-spin Cost",
        "val": "$2,400,000"
      },
      {
        "label": "Turnaround",
        "val": "12 Weeks"
      }
    ],
    "afterMetrics": [
      {
        "label": "Mask Re-spin Cost",
        "val": "$180,000 (Metal Only)"
      },
      {
        "label": "Turnaround",
        "val": "2 Weeks"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Map ECO logic to pre-placed spare cells using read_spare_cells and write_eco_script -spare_only",
        "correct": true,
        "explanation": "Spare-cell mapping limits ECO changes strictly to upper metal masks, saving millions in base wafer fabrication costs."
      },
      {
        "id": "b",
        "label": "Instantiate new standard cells in empty floorplan sites",
        "correct": false,
        "explanation": "Adding new base cells requires modifying FEOL diffusion/poly masks ($2M+)."
      },
      {
        "id": "c",
        "label": "Cancel the tapeout and redesign the entire ASIC",
        "correct": false,
        "explanation": "Metal ECOs allow fast silicon bug remediation."
      },
      {
        "id": "d",
        "label": "Ignore the functional bug in silicon",
        "correct": false,
        "explanation": "Shipping chips with known silicon bugs leads to customer product recalls."
      }
    ]
  },
  {
    "id": 63,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Logic Inversion Bubble Push Proof",
    "severity": "LOW",
    "stageName": "Non-Equiv Debug",
    "symptom": "Synthesis transformed an AND-NOR cone into an OR-NAND cone via De Morgan's laws; proven equivalent.",
    "logSnippet": "// Golden: ! ( (A & B) | (C & D) )\n// Revised: (!A | !B) & (!C | !D)\n// Result: EQUIVALENT (De Morgan bubble push verified)",
    "principle": "De Morgan transformations rearrange inverters and gate primitives without changing boolean transfer functions.",
    "remedyTcl": "compare",
    "beforeMetrics": [
      {
        "label": "Logic Gates",
        "val": "3"
      },
      {
        "label": "Boolean Function",
        "val": "NOR-AND"
      }
    ],
    "afterMetrics": [
      {
        "label": "Logic Gates",
        "val": "3"
      },
      {
        "label": "Boolean Function",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run standard compare on bubble-pushed logic cones",
        "correct": true,
        "explanation": "Conformal's boolean solver proves De Morgan gate transformations automatically."
      },
      {
        "id": "b",
        "label": "Force synthesis to disable De Morgan transformations",
        "correct": false,
        "explanation": "Disabling De Morgan increases cell count and delay."
      },
      {
        "id": "c",
        "label": "Insert double inverters on all inputs",
        "correct": false,
        "explanation": "Double inverters waste area and delay."
      },
      {
        "id": "d",
        "label": "Invert the output pin polarity manually",
        "correct": false,
        "explanation": "Inverting output inverts functional polarity."
      }
    ]
  },
  {
    "id": 64,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Unmapped Key Point Root Cause Isolation",
    "severity": "HIGH",
    "stageName": "Non-Equiv Debug",
    "symptom": "14 flip-flops remained unmapped after automatic mapping heuristics; engineer needs to isolate if cause is pruning or renaming.",
    "logSnippet": "// Unmapped Points: 14 Golden DFFs in u_video/gamma_lut_reg[*]\n// Report: report_unmapped_points -golden -summary",
    "principle": "The report_unmapped_points command categorizes unmapped points into unreachable, constant, or unmapped fanin categories.",
    "remedyTcl": "report_unmapped_points -golden -detailed > reports/unmapped_golden.rpt\nreport_unmapped_points -revised -detailed > reports/unmapped_revised.rpt",
    "beforeMetrics": [
      {
        "label": "Unmapped Points",
        "val": "14"
      },
      {
        "label": "Root Cause",
        "val": "UNKNOWN"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unmapped Points",
        "val": "0 (Mapped as Const 0)"
      },
      {
        "label": "Root Cause",
        "val": "RESOLVED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Analyze unmapped points with report_unmapped_points -detailed to determine pruning vs naming causes",
        "correct": true,
        "explanation": "Detailed unmapped reporting isolates whether registers were pruned as constants or misnamed during synthesis."
      },
      {
        "id": "b",
        "label": "Delete all unmapped registers from the Golden RTL",
        "correct": false,
        "explanation": "Deleting registers breaks RTL testbench simulation."
      },
      {
        "id": "c",
        "label": "Add 14 dummy registers in Revised netlist",
        "correct": false,
        "explanation": "Adding dummy registers creates unused silicon area."
      },
      {
        "id": "d",
        "label": "Bypass unmapped register checks during tapeout signoff",
        "correct": false,
        "explanation": "Unmapped registers can hide disconnected logic cones."
      }
    ]
  },
  {
    "id": 65,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Cone-of-Logic Fanin/Fanout Depth Tracing",
    "severity": "MEDIUM",
    "stageName": "Non-Equiv Debug",
    "symptom": "Complex 48-level combinational arithmetic cone failing equivalence; trace logic depth to identify divergence stage.",
    "logSnippet": "// Diagnostic Cone: 48 Logic Levels between reg_a and reg_b\n// Divergence Point: Level 14 (Multiplexer select line polarity)",
    "principle": "Tracing logic cone depth with report_cone isolates the exact intermediate net where Golden and Revised logic diverge.",
    "remedyTcl": "report_cone -point u_alu/failing_endpoint_reg/D -fanin -level 20\ndiagnose",
    "beforeMetrics": [
      {
        "label": "Diagnostic Depth",
        "val": "48 Levels"
      },
      {
        "label": "Root Cause",
        "val": "OBSCURE"
      }
    ],
    "afterMetrics": [
      {
        "label": "Diagnostic Depth",
        "val": "Level 14"
      },
      {
        "label": "Root Cause",
        "val": "ISOLATED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Trace fanin cone depth using report_cone to pinpoint intermediate logic divergence",
        "correct": true,
        "explanation": "Fanin cone tracing narrows down complex deep logic cones to the earliest divergent net."
      },
      {
        "id": "b",
        "label": "Short all intermediate logic levels together",
        "correct": false,
        "explanation": "Shorting levels destroys combinational computation."
      },
      {
        "id": "c",
        "label": "Break the cone into 48 separate physical clock domains",
        "correct": false,
        "explanation": "Adding clock domains creates clock routing chaos."
      },
      {
        "id": "d",
        "label": "Disable deep cone analysis in Conformal",
        "correct": false,
        "explanation": "Deep cones must be verified to guarantee math accuracy."
      }
    ]
  },
  {
    "id": 66,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Inversion Error Auto-Correction Patch",
    "severity": "MEDIUM",
    "stageName": "Functional ECO",
    "symptom": "A missing inverter on an interrupt active-low polarity pin (`intr_n`) resolved via 1-gate in-place inverter ECO.",
    "logSnippet": "// Non-equivalent compare point: u_irq/intr_out_n\n// Error: Missing inversion on output pin\n// ECO Solution: Swap buffer BUFX2 -> Inverter INVX2 on existing footprint",
    "principle": "Simple polarity inversions are fixed surgically by swapping a non-inverting buffer to an inverter on the exact physical footprint.",
    "remedyTcl": "eco_change_cell -instance u_irq/u_buf_out -cell INVX2\nwrite_eco_script -format innovus",
    "beforeMetrics": [
      {
        "label": "ECO Gate Count",
        "val": "1 Cell Swap"
      },
      {
        "label": "Wire Rerouting",
        "val": "0 Wires"
      }
    ],
    "afterMetrics": [
      {
        "label": "ECO Gate Count",
        "val": "1 Cell Swap"
      },
      {
        "label": "Wire Rerouting",
        "val": "0 Wires"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute in-place cell swap (BUFX2 -> INVX2) via eco_change_cell",
        "correct": true,
        "explanation": "Footprint-matched in-place cell swapping fixes polarity bugs with zero placement displacement and zero wire re-routing."
      },
      {
        "id": "b",
        "label": "Re-route the entire interrupt controller block",
        "correct": false,
        "explanation": "Full block re-routing risks creating new DRC and timing violations."
      },
      {
        "id": "c",
        "label": "Invert the interrupt pin inside software device drivers",
        "correct": false,
        "explanation": "Software workarounds are unacceptable when hardware ECOs are available."
      },
      {
        "id": "d",
        "label": "Change the printed circuit board wiring",
        "correct": false,
        "explanation": "PCB changes cannot fix on-chip internal register bugs."
      }
    ]
  },
  {
    "id": 67,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Golden Formal Verification Signoff Quality Report Package",
    "severity": "HIGH",
    "stageName": "LEC Signoff",
    "symptom": "Final tapeout signoff audit requiring zero unmapped points, zero non-equivalent points, and 100% formal compare completeness.",
    "logSnippet": "// Conformal Signoff Summary:\n// Total Compare Points: 142,580\n// Equivalent: 142,580 (100.0%)\n// Non-Equivalent: 0 (0.0%)\n// Unmapped: 0 (0.0%)\n// Signoff Status: FORMALLY CERTIFIED",
    "principle": "Executive signoff requires executing add_compared_points -all, compare, and generating formal audit logs for foundry review.",
    "remedyTcl": "add_compared_points -all\ncompare\nreport_compare_data -class {non_equivalent unmapped} -out_file reports/lec_signoff_audit.rpt",
    "beforeMetrics": [
      {
        "label": "Audit Completeness",
        "val": "94%"
      },
      {
        "label": "Signoff Status",
        "val": "PENDING"
      }
    ],
    "afterMetrics": [
      {
        "label": "Audit Completeness",
        "val": "100%"
      },
      {
        "label": "Signoff Status",
        "val": "PASSED (FORMAL SIGNOFF)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute full compare on all points and export report_compare_data signoff package",
        "correct": true,
        "explanation": "Full compare data export provides the mathematical certification required for tapeout signoff."
      },
      {
        "id": "b",
        "label": "Sign off tapeout with 5 unresolved non-equivalent points",
        "correct": false,
        "explanation": "Shipping with non-equivalent points guarantees silicon failure."
      },
      {
        "id": "c",
        "label": "Delete failing points from the report script",
        "correct": false,
        "explanation": "Falsifying signoff reports is a catastrophic engineering violation."
      },
      {
        "id": "d",
        "label": "Use gate-level simulation instead of formal LEC",
        "correct": false,
        "explanation": "Simulation cannot achieve 100% state coverage for billions of states."
      }
    ]
  },
  {
    "id": 68,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Hierarchical Sub-Block Formal Verification Signoff",
    "severity": "MEDIUM",
    "stageName": "LEC Signoff",
    "symptom": "SoC top-level verification partitioned into hierarchical sub-blocks (CPU, GPU, DSP, NOC) for distributed server farm compute.",
    "logSnippet": "// Hierarchical Signoff Run:\n// Block 1 (PD_CPU): 48,000 Points -> EQUIVALENT\n// Block 2 (PD_GPU): 62,000 Points -> EQUIVALENT\n// Block 3 (PD_NOC): 32,580 Points -> EQUIVALENT",
    "principle": "Hierarchical LEC verifies sub-blocks in parallel and blackboxes verified sub-blocks during top-level interconnect compare.",
    "remedyTcl": "set_flatten_model -gated_clock\nverify_hierarchical_design -blocks {cpu_top gpu_top noc_top}\ncompare",
    "beforeMetrics": [
      {
        "label": "Top-Level Compute Time",
        "val": "14 Hours"
      },
      {
        "label": "Memory",
        "val": "64 GB"
      }
    ],
    "afterMetrics": [
      {
        "label": "Distributed Compute Time",
        "val": "45 Minutes"
      },
      {
        "label": "Memory",
        "val": "8 GB / Core"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run hierarchical sub-block formal verification using verify_hierarchical_design",
        "correct": true,
        "explanation": "Hierarchical verification reduces runtime by 10x while maintaining 100% formal proof rigor."
      },
      {
        "id": "b",
        "label": "Flatten the entire 500-million gate SoC into a single run",
        "correct": false,
        "explanation": "Full-chip flattening causes server memory exhaustion and long timeouts."
      },
      {
        "id": "c",
        "label": "Skip top-level interconnect verification",
        "correct": false,
        "explanation": "Interconnect pins must be verified formally."
      },
      {
        "id": "d",
        "label": "Disable sub-block blackbox abstraction",
        "correct": false,
        "explanation": "Blackboxing verified blocks accelerates top-level runs."
      }
    ]
  },
  {
    "id": 69,
    "domainId": "lec_debug_eco",
    "domainName": "Non-Equivalent Debug & Golden Functional ECO",
    "title": "Multi-Tool SPEF Correlation vs LEC Invariance",
    "severity": "LOW",
    "stageName": "LEC Signoff",
    "symptom": "Verifying that parasitic SPEF back-annotation in STA tools does not alter formal digital netlist topology.",
    "logSnippet": "// Info: Parasitic SPEF annotated in Tempus for timing\n// Conformal Proof: Physical parasitics have zero impact on boolean netlist logic",
    "principle": "SPEF contains analog parasitic resistances and capacitances; formal LEC operates purely on discrete boolean netlist graphs.",
    "remedyTcl": "compare",
    "beforeMetrics": [
      {
        "label": "Parasitic Elements",
        "val": "1.4 Million RC"
      },
      {
        "label": "Boolean State",
        "val": "INVARIANT"
      }
    ],
    "afterMetrics": [
      {
        "label": "Parasitic Elements",
        "val": "1.4 Million RC"
      },
      {
        "label": "Boolean State",
        "val": "EQUIVALENT"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Confirm formal boolean equivalence is independent of physical SPEF parasitics",
        "correct": true,
        "explanation": "Formal LEC proves logical correctness independently of electrical parasitics, while STA verifies timing closure."
      },
      {
        "id": "b",
        "label": "Load SPEF parasitics into Conformal LEC",
        "correct": false,
        "explanation": "Conformal is a boolean formal engine, not a circuit simulator."
      },
      {
        "id": "c",
        "label": "Remove all parasitic capacitances from silicon",
        "correct": false,
        "explanation": "Physical parasitics cannot be removed from real silicon."
      },
      {
        "id": "d",
        "label": "Substitute STA timing reports for formal LEC proofs",
        "correct": false,
        "explanation": "STA checks timing delays, not boolean functional equivalence."
      }
    ]
  },
];
