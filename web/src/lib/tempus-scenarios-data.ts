export interface TempusMetric {
  label: string;
  val: string;
}

export interface TempusScenarioOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface TempusScenario {
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
  beforeMetrics: TempusMetric[];
  afterMetrics: TempusMetric[];
  options: TempusScenarioOption[];
}

export interface TempusDomain {
  id: string;
  name: string;
  tagline: string;
}

export const TEMPUS_DOMAINS: TempusDomain[] = [
  {
    "id": "setup_max_delay",
    "name": "Setup & Max Delay Timing",
    "tagline": "Critical paths, high-fanout nets, multi-corner setup closure & memory delays"
  },
  {
    "id": "hold_min_delay",
    "name": "Hold & Min Delay Timing",
    "tagline": "Fast-path hold violations, clock skew mismatch & hold-setup ping-pong ECOs"
  },
  {
    "id": "si_crosstalk_noise",
    "name": "Signal Integrity & Crosstalk",
    "tagline": "Aggressor coupling, delta delay slowdown, in-phase speedup & noise glitch peaks"
  },
  {
    "id": "ocv_pocv_derating",
    "name": "AOCV, POCV & PBA Analysis",
    "tagline": "Statistical POCV (\u03bc\u00b13\u03c3), stage depth AOCV & Path-Based Analysis (PBA) pessimism removal"
  },
  {
    "id": "mmmc_sdc_constraints",
    "name": "MMMC View Matrix & SDC",
    "tagline": "Multi-cycle paths (MCP), false paths, generated clocks, case analysis & I/O budgets"
  },
  {
    "id": "cdc_reset_timing",
    "name": "CDC & Asynchronous Resets",
    "tagline": "2-FF synchronizer MTBF, reset recovery/removal checks & clock mux glitch protection"
  },
  {
    "id": "eco_timing_signoff",
    "name": "Automated Timing ECO & Signoff",
    "tagline": "Tempus-Innovus closed-loop ECO, size-only gate swaps, LVT/HVT swaps & signoff packages"
  }
];

export const TEMPUS_SCENARIOS: TempusScenario[] = [
  {
    "id": 0,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "64-bit ALU Carry-Chain Critical Path Setup Violation at SSGNP Corner",
    "severity": "CRITICAL",
    "stageName": "Post-Route Signoff / Max Delay",
    "symptom": "Worst Negative Slack (WNS) is -240 ps across 1,280 failing endpoints in the 64-bit integer execution unit at the slow corner (ssgnp_0p72v_m40c).",
    "logSnippet": "[TEMPUS-SETUP] Endpoint: u_core/u_alu/res_reg[63]/D (Rising edge)\n[TEMPUS-SETUP] Path Group: clk_core (Period: 800.0 ps, Required Time: 742.5 ps)\n[TEMPUS-SETUP] Data Arrival Time: 982.5 ps (Path delay: 940.5 ps, 34 logic levels)\n[TEMPUS-SETUP] Slack: -240.0 ps (VIOLATED - Setup Check Failed)\n[TEMPUS-SETUP] Dominant Delay: Carry lookahead chain (u_alu/cla_stage4_63: 410.0 ps)",
    "principle": "Setup timing requires Data Arrival Time <= Data Required Time (T_period - T_setup - T_uncertainty). Deep combinational logic chains (>30 levels) in arithmetic units exceed the clock period at worst-case voltage/temperature corners (ssgnp 0.72V -40\u00b0C).",
    "remedyTcl": "# 1. Enable automated arithmetic path restructuring in Tempus ECO\nset_db eco_opt_speed_effort high\nset_db eco_opt_transform_arithmetic true\n# 2. Swap slow carry-ripple gates with carry-select high-drive cells\neco_update_timing -expanded_views -views {view_setup_ssgnp_0p72v_m40c}\nopt_design -post_route -eco -setup_margin 0.015",
    "beforeMetrics": [
      {
        "label": "Setup WNS",
        "val": "-240.0 ps"
      },
      {
        "label": "Setup TNS",
        "val": "-184.2 ns"
      },
      {
        "label": "Failing Endpoints",
        "val": "1,280"
      },
      {
        "label": "Logic Levels",
        "val": "34 gates"
      }
    ],
    "afterMetrics": [
      {
        "label": "Setup WNS",
        "val": "+18.5 ps (MET)"
      },
      {
        "label": "Setup TNS",
        "val": "0.0 ps (MET)"
      },
      {
        "label": "Failing Endpoints",
        "val": "0"
      },
      {
        "label": "Logic Levels",
        "val": "22 gates"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Perform Tempus-Innovus post-route ECO restructuring with arithmetic parallelization and high-drive cell swapping on carry lookahead nodes.",
        "correct": true,
        "explanation": "Restructuring arithmetic logic reduces gate depth from 34 to 22 levels, recovering 258.5 ps and closing setup timing with positive slack (+18.5 ps)."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 1,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "High-Fanout Control Net (HFN) Slew Degradation Causing Multi-Corner Setup Failures",
    "severity": "HIGH",
    "stageName": "Post-Route STA / Max Slew",
    "symptom": "A global pipeline enable signal fanout of 184 registers exhibits a transition time (slew) of 380 ps (limit 100 ps), causing -165 ps setup slack on receiving pipeline registers.",
    "logSnippet": "[TEMPUS-SLEW] Net: u_pipe/dma_tx_enable (Fanout: 184, Total Cap: 285.0 fF)\n[TEMPUS-SLEW] Max Transition: 380.2 ps (Max Slew Limit: 100.0 ps - VIOLATION)\n[TEMPUS-SETUP] Endpoint: u_pipe/stage3_reg[31]/EN (Slack: -165.0 ps)\n[TEMPUS-SETUP] Cell Delay: BUFX2 driving net exhibits internal delay of 245.0 ps due to extreme load cap.",
    "principle": "Unbuffered high-fanout nets with large capacitive loads (>200 fF) cause output transitions to degrade severely. High input slews at downstream receivers increase cell internal propagation delays exponentially based on Liberty 2D NLDM lookup tables.",
    "remedyTcl": "# 1. Buffer High-Fanout Net into Balanced Tree\neco_insert_buffer_tree -net u_pipe/dma_tx_enable -buffer_cell CLKBUF_X8 -max_fanout 16 -max_transition 0.080\n# 2. Update timing graph and verify slew closure\nupdate_timing -full\nreport_constraint -all_violators -max_transition",
    "beforeMetrics": [
      {
        "label": "Max Slew",
        "val": "380.2 ps (FAIL)"
      },
      {
        "label": "Fanout per Driver",
        "val": "184 sinks"
      },
      {
        "label": "Setup Slack (WNS)",
        "val": "-165.0 ps"
      },
      {
        "label": "Driver Cell Delay",
        "val": "245.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Max Slew",
        "val": "68.4 ps (PASS)"
      },
      {
        "label": "Fanout per Driver",
        "val": "16 sinks (Tree)"
      },
      {
        "label": "Setup Slack (WNS)",
        "val": "+24.0 ps (MET)"
      },
      {
        "label": "Driver Cell Delay",
        "val": "42.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Synthesize a balanced buffer tree (CLKBUF_X8) with a max fanout of 16 and max slew target of 80 ps across the enable net.",
        "correct": true,
        "explanation": "Splitting the 184 sinks into a multi-level balanced buffer tree sharpens transition times to 68.4 ps, recovering 189 ps of propagation delay."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 2,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "SRAM Synchronous Memory Output Data Setup Margin Failure (T_access Delay)",
    "severity": "CRITICAL",
    "stageName": "Signoff STA / Macro Interface",
    "symptom": "A 512KB SRAM macro DOUT bus fails setup timing into the L1 cache controller with -185 ps slack due to SRAM internal access time (T_access = 520 ps) and long wire RC routing.",
    "logSnippet": "[TEMPUS-SETUP] Startpoint: u_mem/sram_512k_inst/CLK (Rising edge)\n[TEMPUS-SETUP] Endpoint: u_cache/tag_compare_reg[31]/D (Rising edge)\n[TEMPUS-SETUP] Macro Access Time (T_access): 520.0 ps\n[TEMPUS-SETUP] Wire RC Interconnect Delay (M3/M4): 215.0 ps\n[TEMPUS-SETUP] Data Arrival Time: 785.0 ps (Required: 600.0 ps, Period: 650.0 ps)\n[TEMPUS-SETUP] Slack: -185.0 ps (VIOLATED)",
    "principle": "Hard SRAM IP macros have fixed internal read access latency (T_access) defined in Liberty .lib. When combined with long interconnect RC routing across large macro halos, the total latency exceeds single-cycle timing budgets.",
    "remedyTcl": "# 1. Place output pipeline register slice close to SRAM DOUT pins\neco_add_repeater -net [get_db [get_db insts u_mem/sram_512k_inst].pins DOUT*] -cell DFF_X4 -location {120.0 450.0}\n# 2. Update SDC multi-cycle constraint if architectural 2-cycle read is enabled\nset_multicycle_path 2 -setup -from [get_pins u_mem/sram_512k_inst/CLK] -to [get_pins u_cache/tag_compare_reg*/D]\nset_multicycle_path 1 -hold -from [get_pins u_mem/sram_512k_inst/CLK] -to [get_pins u_cache/tag_compare_reg*/D]\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "SRAM Read Slack",
        "val": "-185.0 ps"
      },
      {
        "label": "SRAM T_access",
        "val": "520.0 ps"
      },
      {
        "label": "Wire RC Delay",
        "val": "215.0 ps"
      },
      {
        "label": "Read Cycles",
        "val": "1 cycle (Failed)"
      }
    ],
    "afterMetrics": [
      {
        "label": "SRAM Read Slack",
        "val": "+340.0 ps (MET)"
      },
      {
        "label": "SRAM T_access",
        "val": "520.0 ps"
      },
      {
        "label": "Wire RC Delay",
        "val": "45.0 ps (Sliced)"
      },
      {
        "label": "Read Cycles",
        "val": "2 cycles (MCP 2)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert near-macro output pipeline register slices and declare an architectural 2-cycle read Multi-Cycle Path (MCP 2 setup / 1 hold).",
        "correct": true,
        "explanation": "Pipelining the macro output and applying a valid 2-cycle read MCP relaxes single-cycle pressure and provides +340 ps setup margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 3,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Long M2/M3 Interconnect RC Bottleneck Across Chip Core (Repeater Insertion Required)",
    "severity": "HIGH",
    "stageName": "Post-Route STA / Net Delay",
    "symptom": "A 2.8 mm point-to-point data bus routed on lower thin metal layers (M2/M3) exhibits quadratic RC delay (D = 0.5\u00b7R\u00b7C\u00b7L\u00b2 = 620 ps), violating setup by -190 ps.",
    "logSnippet": "[TEMPUS-RC] Net: u_soc/dma_to_pcie_bus[15] (Length: 2840.0 um, Layers: M2/M3)\n[TEMPUS-RC] Total Net Resistance: 840.0 Ohm, Total Net Cap: 340.0 fF\n[TEMPUS-RC] Quadratic Interconnect Delay: 620.0 ps (66% of total path delay)\n[TEMPUS-SETUP] Slack: -190.0 ps (Endpoint: u_pcie/rx_data_reg[15]/D)",
    "principle": "Unbuffered interconnect delay scales quadratically with length (T_delay ~ L^2). Inserting optimal repeater buffers converts quadratic delay growth into linear growth (T_delay ~ L), slashing net delay by up to 70%.",
    "remedyTcl": "# 1. Automatically insert optimal repeaters along long resistive net\neco_insert_repeater -net u_soc/dma_to_pcie_bus[*] -cell BUF_X16 -distance 350.0\n# 2. Promote critical trunk segments to upper low-resistance metal (M5/M6)\nset_db [get_db nets u_soc/dma_to_pcie_bus[*]].route_rule NDR_2W2S_M5M6\nopt_design -post_route -eco -setup",
    "beforeMetrics": [
      {
        "label": "Interconnect Delay",
        "val": "620.0 ps"
      },
      {
        "label": "Net Resistance",
        "val": "840.0 \u03a9"
      },
      {
        "label": "Setup Slack",
        "val": "-190.0 ps"
      },
      {
        "label": "Repeater Count",
        "val": "0 (Unbuffered)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Interconnect Delay",
        "val": "185.0 ps"
      },
      {
        "label": "Net Resistance",
        "val": "110.0 \u03a9"
      },
      {
        "label": "Setup Slack",
        "val": "+35.0 ps (MET)"
      },
      {
        "label": "Repeater Count",
        "val": "7 repeaters / line"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert optimal repeaters (BUF_X16) every 350 \u00b5m and promote long trunk routing to upper low-resistance layers (M5/M6).",
        "correct": true,
        "explanation": "Breaking the 2.8 mm line with 7 repeaters converts quadratic RC delay to linear delay, reducing net latency from 620 ps to 185 ps."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 4,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Multi-Vth Optimization: High-Vt (HVT) Cells on Critical Path Causing Setup Failures",
    "severity": "HIGH",
    "stageName": "Post-Route STA / Cell Swap",
    "symptom": "Leakage optimization replaced 14 gates on a time-critical DSP filter path with High-Vt (HVT) cells, causing a -140 ps setup timing violation at ssgnp 0.72V.",
    "logSnippet": "[TEMPUS-MULTI-VT] Path: u_dsp/fir_stage3_mult -> u_dsp/accum_reg[23]/D\n[TEMPUS-MULTI-VT] Cell Composition: 14 HVT cells, 2 SVT cells, 0 LVT cells\n[TEMPUS-MULTI-VT] Total Path Delay: 890.0 ps (Period: 750.0 ps)\n[TEMPUS-SETUP] Slack: -140.0 ps (VIOLATED)",
    "principle": "HVT cells reduce subthreshold leakage power by 80% but have 25\u201340% higher propagation delay compared to Low-Vt (LVT) cells at nominal/low supply voltages. Critical paths must prioritize LVT/ULVT cells, reserving HVT for non-critical paths with positive slack.",
    "remedyTcl": "# 1. Swap critical path HVT/SVT cells to Low-Vt (LVT) footprint equivalents\neco_change_cell -insts [get_db [get_db timing_paths -max_slack 0.0].points.inst] -vt_type LVT\n# 2. Update timing and verify zero setup degradation\nupdate_timing -full\nreport_timing -max_paths 10 -slack_lesser_than 0.0",
    "beforeMetrics": [
      {
        "label": "Setup WNS",
        "val": "-140.0 ps"
      },
      {
        "label": "LVT Cell Ratio",
        "val": "0% on path"
      },
      {
        "label": "HVT Cell Ratio",
        "val": "87.5% on path"
      },
      {
        "label": "Path Delay",
        "val": "890.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Setup WNS",
        "val": "+28.0 ps (MET)"
      },
      {
        "label": "LVT Cell Ratio",
        "val": "75% on path"
      },
      {
        "label": "HVT Cell Ratio",
        "val": "12.5% on path"
      },
      {
        "label": "Path Delay",
        "val": "712.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Targeted footprint-compatible cell swap: convert critical path HVT cells to Low-Vt (LVT) equivalents to shed 178 ps delay.",
        "correct": true,
        "explanation": "Swapping 14 HVT gates to footprint-matched LVT cells speeds up switching without physical layout perturbation, recovering +28 ps setup margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 5,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Clock Path Asymmetry: Launch Clock Tree Buffer Over-Insertion Degrading Setup",
    "severity": "MEDIUM",
    "stageName": "Post-CTS STA / Skew Group",
    "symptom": "Launch clock latency is 480 ps while capture clock latency is 220 ps, resulting in 260 ps of negative clock skew that directly degrades setup slack to -115 ps.",
    "logSnippet": "[TEMPUS-SKEW] Launch Clock Path Latency: 480.0 ps (8 clock buffer levels)\n[TEMPUS-SKEW] Capture Clock Path Latency: 220.0 ps (3 clock buffer levels)\n[TEMPUS-SKEW] Clock Skew (Capture - Launch): -260.0 ps (NEGATIVE SKEW PENALTY)\n[TEMPUS-SETUP] Slack: -115.0 ps (Path: u_gpu/tex_unit -> u_gpu/blend_reg/D)",
    "principle": "Clock skew directly impacts setup slack: T_slack,setup = T_period + (T_capture - T_launch) - T_data - T_setup. When launch latency exceeds capture latency (negative skew), setup slack is reduced picosecond-for-picosecond.",
    "remedyTcl": "# 1. Re-balance clock skew group in Tempus-CCOpt\nset_db [get_db skew_groups SG_GPU_CORE].target_skew 0.030\nset_db [get_db skew_groups SG_GPU_CORE].target_insertion_delay 0.250\n# 2. Optimize clock tree balance points\nccopt_design -cts -expanded_views\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Launch Latency",
        "val": "480.0 ps"
      },
      {
        "label": "Capture Latency",
        "val": "220.0 ps"
      },
      {
        "label": "Clock Skew",
        "val": "-260.0 ps (Degraded)"
      },
      {
        "label": "Setup Slack",
        "val": "-115.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Launch Latency",
        "val": "245.0 ps"
      },
      {
        "label": "Capture Latency",
        "val": "240.0 ps"
      },
      {
        "label": "Clock Skew",
        "val": "-5.0 ps (Balanced)"
      },
      {
        "label": "Setup Slack",
        "val": "+42.0 ps (MET)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Rebalance the CCOpt clock skew group to equalize launch and capture insertion delays to ~240 ps, eliminating the 260 ps skew penalty.",
        "correct": true,
        "explanation": "Balancing clock tree latencies removes the 260 ps negative skew deficit, turning a -115 ps setup violation into +42 ps positive slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 6,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Parallel Logic Gate Sizing (Drive Strength Upsizing on High-Capacitance Muxes)",
    "severity": "MEDIUM",
    "stageName": "Post-Route STA / Gate Sizing",
    "symptom": "A 16-to-1 multiplexer implemented with minimum-drive MUX2_X1 cells is driving a 45 fF net load, exhibiting an internal delay of 180 ps and causing -85 ps setup slack.",
    "logSnippet": "[TEMPUS-DELAY] Cell: u_cpu/u_dec/mux_stage4_inst (LibCell: MUX2_X1)\n[TEMPUS-DELAY] Output Load Pin/Wire Cap: 45.2 fF (Normal range for X1: 5-10 fF)\n[TEMPUS-DELAY] Gate Delay: 182.0 ps (Nominal delay: 35.0 ps)\n[TEMPUS-SETUP] Slack: -85.0 ps (Endpoint: u_cpu/instr_reg[15]/D)",
    "principle": "Under-driven standard cells driving large capacitive loads operate in the high-delay region of their Liberty delay lookup tables. Upsizing gates (e.g. MUX2_X1 -> MUX2_X8) increases output transconductance (gm) and drive current, slashing stage delay.",
    "remedyTcl": "# 1. Upsize underdriven mux gates along critical path\neco_change_cell -insts u_cpu/u_dec/mux_stage4_inst -lib_cell MUX2_X8\n# 2. Verify DRC max capacitance and transition limits\nreport_constraint -all_violators -max_capacitance\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Mux Cell Type",
        "val": "MUX2_X1 (Underdriven)"
      },
      {
        "label": "Stage Gate Delay",
        "val": "182.0 ps"
      },
      {
        "label": "Output Slew",
        "val": "145.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-85.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Mux Cell Type",
        "val": "MUX2_X8 (Optimal)"
      },
      {
        "label": "Stage Gate Delay",
        "val": "44.0 ps"
      },
      {
        "label": "Output Slew",
        "val": "28.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+53.0 ps (MET)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Upsize the critical multiplexer instance from MUX2_X1 to MUX2_X8 to increase driver current and reduce stage delay from 182 ps to 44 ps.",
        "correct": true,
        "explanation": "Upsizing the drive strength by 8x easily overcomes the 45 fF capacitive load, recovering 138 ps of delay and turning slack positive (+53 ps)."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 7,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Low Supply Voltage Corner (0.65V) Delay Escalation: Inverted Temperature Dependence",
    "severity": "HIGH",
    "stageName": "MMMC Signoff / Corner Validation",
    "symptom": "Paths that passed setup timing at 125\u00b0C fail with -160 ps slack at the ultra-cold corner (-40\u00b0C) at 0.65V due to Inverted Temperature Dependence (ITD).",
    "logSnippet": "[TEMPUS-ITD] Analysis View: view_setup_ssgnp_0p65v_m40c\n[TEMPUS-ITD] Phenomenon: Inverted Temperature Dependence (ITD) Active\n[TEMPUS-ITD] Cell Delay at 125C: 45.0 ps vs Cell Delay at -40C: 68.0 ps (+51% SLOWER at -40C!)\n[TEMPUS-SETUP] WNS at 125C: +25.0 ps (PASSED) -> WNS at -40C: -160.0 ps (FAILED)",
    "principle": "In advanced FinFET nodes operating near threshold voltage (VDD ~ 0.65V), carrier mobility gain at low temperature (-40\u00b0C) is overwhelmed by the increase in threshold voltage (Vth), causing gates to switch slower at cold temperatures (Inverted Temperature Dependence). Both -40\u00b0C and 125\u00b0C must be closed concurrently.",
    "remedyTcl": "# 1. Configure dual-temperature setup signoff views in Tempus MMMC\ncreate_delay_corner -name dc_ssgnp_0p65v_m40c -library_set lib_ssgnp_0p65v_m40c -temperature -40\ncreate_delay_corner -name dc_ssgnp_0p65v_125c -library_set lib_ssgnp_0p65v_125c -temperature 125\ncreate_analysis_view -name view_setup_cold -constraint_mode cm_func -delay_corner dc_ssgnp_0p65v_m40c\ncreate_analysis_view -name view_setup_hot  -constraint_mode cm_func -delay_corner dc_ssgnp_0p65v_125c\nset_analysis_view -setup {view_setup_cold view_setup_hot}\nopt_design -post_route -eco -expanded_views",
    "beforeMetrics": [
      {
        "label": "Setup WNS (125\u00b0C)",
        "val": "+25.0 ps (PASS)"
      },
      {
        "label": "Setup WNS (-40\u00b0C)",
        "val": "-160.0 ps (FAIL)"
      },
      {
        "label": "Signoff Status",
        "val": "Cold Corner Blindspot"
      },
      {
        "label": "Total Views Active",
        "val": "1 view only"
      }
    ],
    "afterMetrics": [
      {
        "label": "Setup WNS (125\u00b0C)",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Setup WNS (-40\u00b0C)",
        "val": "+18.0 ps (MET)"
      },
      {
        "label": "Signoff Status",
        "val": "Full MMMC Signoff Clean"
      },
      {
        "label": "Total Views Active",
        "val": "Both Cold & Hot Active"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable concurrent MMMC multi-view optimization across both extreme cold (-40\u00b0C) and hot (125\u00b0C) corners to account for Inverted Temperature Dependence (ITD).",
        "correct": true,
        "explanation": "At 0.65V, ITD makes -40\u00b0C the critical setup corner due to Vt shift. Optimizing across both views ensures silicon closure across all operating temperatures."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 8,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Pin Swapping Optimization on Asymmetric Complex Standard Cell Inputs (AOI222)",
    "severity": "LOW",
    "stageName": "Post-Route STA / Pin Swap",
    "symptom": "A critical path enters pin A1 of an AOI222 complex gate which has 85 ps delay, while pin A3 on the same boolean equivalence group has only 35 ps delay, causing -35 ps slack.",
    "logSnippet": "[TEMPUS-PIN] Cell: u_logic/aoi_stage_inst (LibCell: AOI222_X2)\n[TEMPUS-PIN] Connected Pin: A1 (Internal delay to Y: 85.0 ps - slow outer transistor stack)\n[TEMPUS-PIN] Equivalent Pin: A3 (Internal delay to Y: 35.0 ps - fast bottom transistor)\n[TEMPUS-SETUP] Slack on A1: -35.0 ps (Endpoint: u_logic/ctrl_reg/D)",
    "principle": "Complex logic gates (AOI, OAI, MUX) have asymmetric internal pin-to-output propagation delays due to series transistor stack positions (top vs bottom of the pull-down NMOS ladder). Swapping the critical net to the fastest logically equivalent input pin recovers delay with zero area/power penalty.",
    "remedyTcl": "# 1. Execute zero-area logically equivalent pin swap in Tempus\neco_swap_pins -inst u_logic/aoi_stage_inst -from_pin A1 -to_pin A3\n# 2. Update timing\nupdate_timing -full\nreport_timing -to u_logic/ctrl_reg/D",
    "beforeMetrics": [
      {
        "label": "Active Input Pin",
        "val": "A1 (Slow Stack: 85 ps)"
      },
      {
        "label": "Setup Slack",
        "val": "-35.0 ps"
      },
      {
        "label": "Area Overhead",
        "val": "0 \u00b5m\u00b2"
      },
      {
        "label": "Power Overhead",
        "val": "0 mW"
      }
    ],
    "afterMetrics": [
      {
        "label": "Active Input Pin",
        "val": "A3 (Fast Stack: 35 ps)"
      },
      {
        "label": "Setup Slack",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Area Overhead",
        "val": "0 \u00b5m\u00b2 (Pure Swap)"
      },
      {
        "label": "Power Overhead",
        "val": "0 mW (Pure Swap)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Perform a logically equivalent input pin swap (A1 -> A3) on the AOI222 cell to exploit the faster internal transistor stack and save 50 ps.",
        "correct": true,
        "explanation": "Pin swapping is a zero-area, zero-power ECO technique that swaps connections to faster internal stack pins, recovering +15 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 9,
    "domainId": "setup_max_delay",
    "domainName": "Setup & Max Delay Timing",
    "title": "Multi-Bit Flip-Flop (MBFF) Setup Timing Skew Imbalance Across Shared Clock Slices",
    "severity": "MEDIUM",
    "stageName": "Post-CTS STA / MBFF Optimization",
    "symptom": "Bit 3 of a 4-bit MBFF (DFF4_X2) exhibits 45 ps worse setup slack than Bits 0\u20132 due to internal clock inverter loading asymmetry.",
    "logSnippet": "[TEMPUS-MBFF] Instance: u_datapath/pipe_reg_mbff4 (LibCell: DFF4_X2)\n[TEMPUS-MBFF] Bit 0 Slack: +25.0 ps | Bit 1 Slack: +22.0 ps | Bit 2 Slack: +18.0 ps\n[TEMPUS-MBFF] Bit 3 Slack: -25.0 ps (VIOLATED - Internal clock slice routing skew: 45 ps)\n[TEMPUS-SETUP] Cause: Bit 3 is furthest from internal shared inverter tap.",
    "principle": "Multi-Bit Flip-Flops (MBFFs) share internal clock inverters to save dynamic power and area. However, internal clock wire distribution inside the cell can introduce subtle internal clock skew between individual bit slices.",
    "remedyTcl": "# 1. De-cluster violated bit from MBFF back to dedicated single-bit high-speed register\neco_split_mbff -inst u_datapath/pipe_reg_mbff4 -bit 3 -new_lib_cell DFF_X4\n# 2. Update timing and verify setup closure\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Bit 3 Slack",
        "val": "-25.0 ps (FAIL)"
      },
      {
        "label": "MBFF Structure",
        "val": "4-bit cluster"
      },
      {
        "label": "Internal Clock Skew",
        "val": "45.0 ps"
      },
      {
        "label": "Power Savings",
        "val": "22% on clock"
      }
    ],
    "afterMetrics": [
      {
        "label": "Bit 3 Slack",
        "val": "+20.0 ps (MET)"
      },
      {
        "label": "MBFF Structure",
        "val": "3-bit MBFF + 1-bit DFF_X4"
      },
      {
        "label": "Internal Clock Skew",
        "val": "0.0 ps (Dedicated)"
      },
      {
        "label": "Power Savings",
        "val": "20% (Maintained)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "De-cluster the critical Bit 3 from the 4-bit MBFF into a dedicated high-speed single-bit DFF_X4 register while keeping Bits 0\u20132 clustered.",
        "correct": true,
        "explanation": "De-clustering only the critical bit eliminates the internal MBFF clock skew penalty, recovering +20 ps slack while preserving 90% of clock power savings."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 10,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Fast-Path Back-to-Back Register Shift Register Hold Violation at FF Corner",
    "severity": "CRITICAL",
    "stageName": "Post-CTS Signoff / Min Delay",
    "symptom": "Hold slack is -120 ps across 850 scan/shift registers at the fast corner (ffgnp_0p88v_125c / -40c) where data path delay is nearly 0 ps.",
    "logSnippet": "[TEMPUS-HOLD] Endpoint: u_pipe/reg_b_reg/D (Rising edge)\n[TEMPUS-HOLD] Data Arrival Time: 42.0 ps (Launch Clock: 30.0 ps, DFF T_cq: 12.0 ps, Wire: 0.0 ps)\n[TEMPUS-HOLD] Data Required Time: 162.0 ps (Capture Clock: 140.0 ps, T_hold: 18.0 ps, Uncertainty: 4.0 ps)\n[TEMPUS-HOLD] Slack: -120.0 ps (VIOLATED - FATAL SILICON RACE CONDITION)",
    "principle": "Hold time checks verify that new data launched on the current clock edge does NOT race ahead and overwrite previous data at the capture register before its hold time (T_hold) expires: T_launch + T_cq + T_comb >= T_capture + T_hold + T_uncertainty.",
    "remedyTcl": "# 1. Automated multi-corner hold buffer insertion with zero setup degradation\neco_add_repeater -net [get_db [get_db timing_paths -min_slack 0.0 -check_type hold].endpoint.net] -cell DLY4_X2 -margin 0.025\n# 2. Update timing across both setup and hold views\neco_update_timing -expanded_views\nreport_timing -check_type hold -max_paths 10",
    "beforeMetrics": [
      {
        "label": "Hold WNS",
        "val": "-120.0 ps"
      },
      {
        "label": "Hold TNS",
        "val": "-102.0 ns"
      },
      {
        "label": "Failing Endpoints",
        "val": "850"
      },
      {
        "label": "Data Path Delay",
        "val": "12.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Hold WNS",
        "val": "+22.0 ps (MET)"
      },
      {
        "label": "Hold TNS",
        "val": "0.0 ps (MET)"
      },
      {
        "label": "Failing Endpoints",
        "val": "0"
      },
      {
        "label": "Data Path Delay",
        "val": "154.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert dedicated delay buffers (DLY4_X2) on the data path with a 25 ps safety margin, verified concurrently against setup views.",
        "correct": true,
        "explanation": "Adding delay buffers increases data arrival time from 42 ps to 154 ps, satisfying hold constraints with +22 ps margin without disturbing setup."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 11,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Clock Tree Positive Skew (Late Capture Clock) Inducing Systematic Hold Failures",
    "severity": "HIGH",
    "stageName": "Post-CTS STA / Skew Race",
    "symptom": "A high-speed clock buffer insertion delay asymmetry results in capture clock arriving 180 ps later than launch clock, creating -95 ps hold slack on 420 paths.",
    "logSnippet": "[TEMPUS-HOLD] Launch Clock Arrival: 110.0 ps\n[TEMPUS-HOLD] Capture Clock Arrival: 290.0 ps (Positive Skew: +180.0 ps)\n[TEMPUS-HOLD] Data Path Delay: 85.0 ps\n[TEMPUS-HOLD] Hold Slack: 110 + 85 - (290 + 0) = -95.0 ps (VIOLATED)",
    "principle": "While positive clock skew (T_capture > T_launch) aids setup timing, it directly worsens hold timing by delaying the capture clock edge, requiring data paths to be artificially delayed to prevent race conditions.",
    "remedyTcl": "# 1. Trim capture clock tree delay using CCOpt skew scheduling\nset_db [get_db skew_groups SG_CORE].target_skew 0.020\nccopt_design -cts -expanded_views\n# 2. Insert hold padding buffers where skew cannot be further reduced\nopt_design -post_route -hold -expanded_views",
    "beforeMetrics": [
      {
        "label": "Clock Skew",
        "val": "+180.0 ps"
      },
      {
        "label": "Hold WNS",
        "val": "-95.0 ps"
      },
      {
        "label": "Hold Violators",
        "val": "420 paths"
      },
      {
        "label": "Buffer Count Added",
        "val": "0"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Skew",
        "val": "+25.0 ps"
      },
      {
        "label": "Hold WNS",
        "val": "+18.0 ps (MET)"
      },
      {
        "label": "Hold Violators",
        "val": "0"
      },
      {
        "label": "Buffer Count Added",
        "val": "12 delay cells"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Trim the capture clock tree latency using CCOpt skew scheduling to reduce positive skew to +25 ps, and insert minimal hold padding buffers.",
        "correct": true,
        "explanation": "Reducing clock skew directly removes the hold deficit at the root cause, requiring only 12 padding buffers to achieve clean hold signoff."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 12,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Hold-Setup Ping-Pong Oscillation During Multi-Corner ECO Closure",
    "severity": "CRITICAL",
    "stageName": "Signoff ECO / Ping-Pong Loop",
    "symptom": "Inserting delay buffers to fix hold in the fast corner (ffgnp) creates new -80 ps setup violations in the slow corner (ssgnp), causing an infinite ECO fix loop.",
    "logSnippet": "[TEMPUS-ECO] Iteration 1: Fixed 240 Hold violations (Hold WNS: 0.0 ps)\n[TEMPUS-ECO] Iteration 2: Setup WNS degraded from +10 ps to -80 ps in view_setup_ssgnp_0p72v_m40c!\n[TEMPUS-ECO] Cause: Buffer BUF_X1 added on path with low setup margin (Slack: +15 ps). Added delay: 95 ps at ssgnp.",
    "principle": "Delay buffers inserted to fix hold at fast corners (where delay is small, e.g. 20 ps) add massive delay at slow corners (e.g. 95 ps at ssgnp 0.72V -40\u00b0C). If a path has small positive setup slack (+15 ps), hold buffer insertion causes catastrophic setup failure (ping-pong effect).",
    "remedyTcl": "# 1. Run concurrent multi-view hold optimization with setup margin protection\nset_db eco_opt_hold_setup_slack_margin 0.040\nset_db eco_opt_use_delay_cells_only true\n# 2. Prefer low-temperature-coefficient delay cells (DLY_X2) with linear voltage scaling\nopt_design -post_route -hold -expanded_views -setup_views {view_setup_ssgnp} -hold_views {view_hold_ffgnp}",
    "beforeMetrics": [
      {
        "label": "Hold WNS (ffgnp)",
        "val": "0.0 ps (Fixed)"
      },
      {
        "label": "Setup WNS (ssgnp)",
        "val": "-80.0 ps (Degraded)"
      },
      {
        "label": "ECO Ping-Pong Loop",
        "val": "Active (Unstable)"
      },
      {
        "label": "Setup Margin Guard",
        "val": "0 ps (Disabled)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Hold WNS (ffgnp)",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Setup WNS (ssgnp)",
        "val": "+12.0 ps (MET)"
      },
      {
        "label": "ECO Ping-Pong Loop",
        "val": "Converged Clean"
      },
      {
        "label": "Setup Margin Guard",
        "val": "40 ps (Enforced)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enforce a 40 ps setup margin guardband during hold ECO (`eco_opt_hold_setup_slack_margin 0.040`) and use low-variation delay cells (`DLY_X2`).",
        "correct": true,
        "explanation": "The setup margin guardband prevents Tempus from adding hold buffers to paths with low setup slack, breaking the ping-pong loop and closing both corners simultaneously."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 13,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Clock Gating Cell (ICG) Enable Pin Hold Violation (Race on Enable Transition)",
    "severity": "HIGH",
    "stageName": "Post-CTS STA / Clock Gating Check",
    "symptom": "Integrated Clock Gating (ICG) cell enable pin EN exhibits a -65 ps hold violation relative to clock input CLK at ffgnp 0.88V.",
    "logSnippet": "[TEMPUS-ICG] Check Type: clock_gating_hold (Latched ICG cell: ICG_X4)\n[TEMPUS-ICG] Clock Pin: u_ctrl/icg_core_inst/CLK (Arrival: 85.0 ps)\n[TEMPUS-ICG] Enable Pin: u_ctrl/icg_core_inst/EN (Arrival: 95.0 ps)\n[TEMPUS-ICG] Required Time: 160.0 ps (T_hold: 75.0 ps)\n[TEMPUS-ICG] Slack: -65.0 ps (VIOLATED - Glitch on Gated Clock Output!)",
    "principle": "ICG cells contain an internal transparent-low latch to prevent clock glitches. The enable signal must satisfy both setup (before clock goes high) and hold checks (after clock goes high) on the enable pin (T_arrival,EN >= T_arrival,CLK + T_hold).",
    "remedyTcl": "# 1. Fix ICG enable pin hold violation by inserting buffer on enable path\neco_add_repeater -pin u_ctrl/icg_core_inst/EN -cell BUF_X4 -margin 0.020\n# 2. Re-verify clock gating checks across all corners\nreport_clock_gating_check -violators -expanded_views",
    "beforeMetrics": [
      {
        "label": "ICG Hold Slack",
        "val": "-65.0 ps"
      },
      {
        "label": "Clock Glitch Risk",
        "val": "HIGH (Silicon Glitch)"
      },
      {
        "label": "Enable Arrival",
        "val": "95.0 ps"
      },
      {
        "label": "ICG Cell Type",
        "val": "ICG_X4"
      }
    ],
    "afterMetrics": [
      {
        "label": "ICG Hold Slack",
        "val": "+25.0 ps (MET)"
      },
      {
        "label": "Clock Glitch Risk",
        "val": "ZERO (Clean Gating)"
      },
      {
        "label": "Enable Arrival",
        "val": "185.0 ps"
      },
      {
        "label": "ICG Cell Type",
        "val": "ICG_X4"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert a dedicated buffer (BUF_X4) on the enable path feeding the ICG cell to delay enable arrival by 90 ps and eliminate the clock gating hold race.",
        "correct": true,
        "explanation": "Padding the enable pin ensures the enable transition arrives after the internal clock latch has closed, guaranteeing glitch-free clock gating with +25 ps margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 14,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Common Path Pessimism Removal (CPPR) Discrepancy on Self-Loop Hold Paths",
    "severity": "MEDIUM",
    "stageName": "Signoff STA / CPPR Calculation",
    "symptom": "A register feedback self-loop (DFF Q to D through 1 inverter) reports -45 ps hold slack when CPPR is disabled, but is physically immune to on-chip variation.",
    "logSnippet": "[TEMPUS-CPPR] Path: u_cnt/val_reg[0]/Q -> u_cnt/val_reg[0]/D (Self-Loop)\n[TEMPUS-CPPR] Common Clock Tree Depth: 280.0 ps (Launch & Capture share 100% clock path)\n[TEMPUS-CPPR] OCV Derate Applied without CPPR: Launch = 0.90, Capture = 1.10\n[TEMPUS-CPPR] Fictitious Clock Skew: 280 * (1.10 - 0.90) = 56.0 ps penalty!\n[TEMPUS-HOLD] Slack without CPPR: -45.0 ps -> Slack with CPPR: +11.0 ps",
    "principle": "In static timing analysis with On-Chip Variation (OCV), launch and capture clock paths receive different deratings (early vs late). For shared clock segments, a single physical wire/buffer cannot be fast and slow simultaneously. Common Path Pessimism Removal (CPPR) eliminates this fictitious mathematical penalty.",
    "remedyTcl": "# 1. Enforce strict Common Path Pessimism Removal (CPPR) in Tempus\nset_db timing_cppr_threshold_ps 1.0\nset_db timing_enable_cppr true\n# 2. Update timing graph with exact CPPR credit calculation\nupdate_timing -full\nreport_timing -check_type hold -to u_cnt/val_reg[0]/D",
    "beforeMetrics": [
      {
        "label": "CPPR Status",
        "val": "Disabled (Pessimistic)"
      },
      {
        "label": "Fictitious Clock Skew",
        "val": "56.0 ps"
      },
      {
        "label": "Hold Slack",
        "val": "-45.0 ps (FALSE FAIL)"
      },
      {
        "label": "Buffers Needed",
        "val": "2 delay cells (Waste)"
      }
    ],
    "afterMetrics": [
      {
        "label": "CPPR Status",
        "val": "Enabled (Exact Credit)"
      },
      {
        "label": "Fictitious Clock Skew",
        "val": "0.0 ps (Common Tree)"
      },
      {
        "label": "Hold Slack",
        "val": "+11.0 ps (MET)"
      },
      {
        "label": "Buffers Needed",
        "val": "0 cells (Zero Waste)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable Common Path Pessimism Removal (`set_db timing_enable_cppr true`) to credit back the 56 ps fictitious clock skew on the shared clock path.",
        "correct": true,
        "explanation": "CPPR removes the unphysical assumption that shared clock buffers have simultaneous early and late delays, correctly showing +11 ps positive slack with zero wasted buffers."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 15,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Metal Layer Jump Resistance Variation Inducing Fast-Path Hold Failures",
    "severity": "LOW",
    "stageName": "Post-Route STA / Metal Layer Check",
    "symptom": "A short data path routed on thick top metal (M7) has 3x lower resistance than expected, causing data to arrive too early and violating hold by -32 ps.",
    "logSnippet": "[TEMPUS-HOLD] Net: u_core/short_fast_net (Layer: M7, Length: 85.0 um)\n[TEMPUS-HOLD] Sheet Resistance: 0.025 Ohm/sq (Ultra-fast propagation: 4.2 ps)\n[TEMPUS-HOLD] Data Arrival Time: 38.0 ps (Required: 70.0 ps)\n[TEMPUS-HOLD] Slack: -32.0 ps (VIOLATED)",
    "principle": "Thick upper metal layers (M7\u2013M9) have low sheet resistance and are designed for power grids and global clock routing. Short local data nets accidentally routed on thick metals switch much faster than thin lower metals (M2/M3), exacerbating min-delay hold races.",
    "remedyTcl": "# 1. Demote short data net to lower thin metal layer (M2/M3) with higher RC delay\nset_db [get_db nets u_core/short_fast_net].bottom_routing_layer M2\nset_db [get_db nets u_core/short_fast_net].top_routing_layer M3\n# 2. Re-route net and update timing\neco_route\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Routing Layer",
        "val": "M7 (Thick Metal)"
      },
      {
        "label": "Net Delay",
        "val": "4.2 ps"
      },
      {
        "label": "Hold Slack",
        "val": "-32.0 ps"
      },
      {
        "label": "Buffer Count",
        "val": "0"
      }
    ],
    "afterMetrics": [
      {
        "label": "Routing Layer",
        "val": "M2 (Thin Metal)"
      },
      {
        "label": "Net Delay",
        "val": "39.5 ps"
      },
      {
        "label": "Hold Slack",
        "val": "+12.0 ps (MET)"
      },
      {
        "label": "Buffer Count",
        "val": "0 (Zero Cell ECO)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Demote the short data net from thick metal M7 down to thin metal M2/M3 to naturally increase RC wire delay and close hold with zero extra cells.",
        "correct": true,
        "explanation": "Re-routing the net on M2/M3 increases resistance from 0.025 \u03a9/sq to 0.45 \u03a9/sq, adding 35 ps of natural wire delay and closing hold without inserting buffer cells."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 16,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Scan Shift Mode Fast-Path Hold Violations Across Scan Chains",
    "severity": "HIGH",
    "stageName": "DFT Signoff STA / Test Mode",
    "symptom": "In test_shift mode, 3,400 scan flip-flops connected Q-to-SI fail hold timing by -180 ps due to lack of combinational logic between scan chain registers.",
    "logSnippet": "[TEMPUS-DFT] Analysis View: view_hold_shift_ffgnp_0p88v_125c\n[TEMPUS-DFT] Mode: test_shift (Scan Enable = 1)\n[TEMPUS-DFT] Path: u_chain/scan_reg[42]/Q -> u_chain/scan_reg[43]/SI\n[TEMPUS-DFT] Data Arrival: 18.0 ps (Pure scan chain wire)\n[TEMPUS-DFT] Data Required: 198.0 ps (Clock Skew: 120.0 ps, T_hold: 78.0 ps)\n[TEMPUS-HOLD] Slack: -180.0 ps (3,400 scan flip-flops violated)",
    "principle": "During scan shifting, registers are directly stitched in a serial shift chain (Q -> SI). Without combinational logic to provide delay, scan chains are highly vulnerable to clock skew race conditions, corrupting ATPG test vectors during factory test.",
    "remedyTcl": "# 1. Automatically insert scan lockup latches / delay cells during scan chain reordering\nset_db dft_insert_lockup_latches true\nset_db dft_lockup_latch_cell LATCH_DLY_X2\n# 2. Insert scan-specific hold buffers in Tempus\nopt_design -post_route -hold -views {view_hold_shift_ffgnp_0p88v_125c}",
    "beforeMetrics": [
      {
        "label": "Scan Shift Hold WNS",
        "val": "-180.0 ps"
      },
      {
        "label": "Violating Scan Flops",
        "val": "3,400 flops"
      },
      {
        "label": "ATPG Shift Yield",
        "val": "0% (Corrupted)"
      },
      {
        "label": "Lockup Latches",
        "val": "Missing"
      }
    ],
    "afterMetrics": [
      {
        "label": "Scan Shift Hold WNS",
        "val": "+28.0 ps (MET)"
      },
      {
        "label": "Violating Scan Flops",
        "val": "0"
      },
      {
        "label": "ATPG Shift Yield",
        "val": "100% (Clean)"
      },
      {
        "label": "Lockup Latches",
        "val": "Inserted on Domain Crossings"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert scan lockup latches on clock domain boundaries and add dedicated scan-shift delay buffers to provide +28 ps hold margin during test.",
        "correct": true,
        "explanation": "Lockup latches and scan delay buffers pad the zero-logic Q -> SI shift paths, guaranteeing error-free ATPG test vector shifting."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 17,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Low-Temperature Fast-Corner (ffgnp -40\u00b0C) Hold Degradation with High Voltage (0.95V)",
    "severity": "HIGH",
    "stageName": "Signoff STA / Extreme Fast Corner",
    "symptom": "Hold slack passes by +10 ps at 125\u00b0C but fails with -95 ps at -40\u00b0C under maximum overdrive voltage (0.95V) due to extreme electron mobility boost.",
    "logSnippet": "[TEMPUS-CORNER] Analysis View: view_hold_ffgnp_0p95v_m40c (Extreme Fast Speed Corner)\n[TEMPUS-CORNER] Carrier Mobility: High (+38% faster transconductance at -40C vs 125C)\n[TEMPUS-CORNER] Inverter Delay at 125C: 18.0 ps vs Inverter Delay at -40C: 11.2 ps\n[TEMPUS-HOLD] Slack at 125C: +10.0 ps (PASS) -> Slack at -40C: -95.0 ps (FAIL - Silicon Fast Race)",
    "principle": "At nominal/high supply voltages (VDD >= 0.85V), sub-zero temperatures (-40\u00b0C) drastically increase carrier mobility due to reduced lattice phonon scattering. Transistors switch significantly faster, creating the true worst-case hold timing corner.",
    "remedyTcl": "# 1. Add extreme cold fast-corner view to MMMC hold analysis\ncreate_delay_corner -name dc_ffgnp_0p95v_m40c -library_set lib_ffgnp_0p95v_m40c -temperature -40\ncreate_analysis_view -name view_hold_cold -constraint_mode cm_func -delay_corner dc_ffgnp_0p95v_m40c\nset_analysis_view -hold [concat [get_db current_design .analysis_views_hold] view_hold_cold]\n# 2. Run multi-corner hold closure with Tempus ECO\nopt_design -post_route -hold -expanded_views",
    "beforeMetrics": [
      {
        "label": "Hold Slack (125\u00b0C)",
        "val": "+10.0 ps (PASS)"
      },
      {
        "label": "Hold Slack (-40\u00b0C)",
        "val": "-95.0 ps (FAIL)"
      },
      {
        "label": "Cold View Included",
        "val": "No (Blindspot)"
      },
      {
        "label": "Mobility Boost",
        "val": "+38% at -40\u00b0C"
      }
    ],
    "afterMetrics": [
      {
        "label": "Hold Slack (125\u00b0C)",
        "val": "+22.0 ps (MET)"
      },
      {
        "label": "Hold Slack (-40\u00b0C)",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Cold View Included",
        "val": "Yes (Signoff Complete)"
      },
      {
        "label": "Mobility Boost",
        "val": "Fully Compensated"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Include the extreme cold fast-corner view (`ffgnp_0p95v_m40c`) in MMMC hold analysis and insert hold buffers sized for minimum temperature variation.",
        "correct": true,
        "explanation": "At high VDD, -40\u00b0C is the true worst-case hold corner because reduced phonon scattering makes transistors fastest. Sizing hold padding against this view guarantees hold safety."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 18,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Retention Register (SRPG) Restore Clock Edge Hold Violation During Wake-up",
    "severity": "HIGH",
    "stageName": "Low Power STA / UPF Verification",
    "symptom": "During power domain wake-up from sleep mode, the restore clock edge causes a -110 ps hold race between the shadow balloon latch and the master flip-flop.",
    "logSnippet": "[TEMPUS-LP] Cell: u_cpu/state_reg_srpg[12] (LibCell: DFF_SRPG_X2)\n[TEMPUS-LP] Event: Power Domain PD_CPU Wake-up (RESTORE transition)\n[TEMPUS-LP] Shadow Latch to Master D Delay: 22.0 ps\n[TEMPUS-LP] RESTORE Pin Latency: 145.0 ps (Required Time: 132.0 ps)\n[TEMPUS-HOLD] Slack: -110.0 ps (Corrupted State Restoration)",
    "principle": "State Retention Power Gating (SRPG) registers save register state in low-leakage balloon latches during sleep. On wake-up, the RESTORE control signal must satisfy hold timing relative to the active clock to prevent overwriting retained state before the core power rail stabilizes.",
    "remedyTcl": "# 1. Buffer the always-on RESTORE control line to match clock tree latency\neco_add_repeater -net u_pmu/cpu_restore_n -cell BUF_AON_X8 -location {220.0 510.0}\n# 2. Sequence PMU FSM to assert RESTORE before enabling core clock tree\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Restore Hold Slack",
        "val": "-110.0 ps"
      },
      {
        "label": "Wake-up State Integrity",
        "val": "CORRUPTED"
      },
      {
        "label": "Restore Line Delay",
        "val": "22.0 ps"
      },
      {
        "label": "PMU Sequence",
        "val": "Concurrent Clock"
      }
    ],
    "afterMetrics": [
      {
        "label": "Restore Hold Slack",
        "val": "+34.0 ps (MET)"
      },
      {
        "label": "Wake-up State Integrity",
        "val": "100% VERIFIED"
      },
      {
        "label": "Restore Line Delay",
        "val": "155.0 ps"
      },
      {
        "label": "PMU Sequence",
        "val": "Sequential Staggered"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Buffer the always-on RESTORE line with BUF_AON_X8 and sequence the PMU to deassert RESTORE before releasing the core clock gate.",
        "correct": true,
        "explanation": "Buffering the restore line and properly sequencing PMU power-up steps eliminates the wake-up race condition, verifying state retention with +34 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 19,
    "domainId": "hold_min_delay",
    "domainName": "Hold & Min Delay Timing",
    "title": "Asymmetric Multi-Voltage Level Shifter Fast-to-Slow Domain Hold Race",
    "severity": "MEDIUM",
    "stageName": "Multi-Voltage STA / Level Shifter Check",
    "symptom": "A signal crossing from high voltage (0.95V fast) to low voltage (0.65V slow) exhibits a -75 ps hold violation at the level shifter output.",
    "logSnippet": "[TEMPUS-LS] Source: u_core (0.95V Fast Domain) -> Destination: u_lowp (0.65V Slow Domain)\n[TEMPUS-LS] Level Shifter: u_ls/ls_bit0 (LibCell: LVLBUF_HL_X2)\n[TEMPUS-LS] Fast Launch Delay at 0.95V: 14.0 ps\n[TEMPUS-LS] Slow Capture Clock at 0.65V: 98.0 ps\n[TEMPUS-HOLD] Slack: 14.0 - (98.0 + 9.0) = -75.0 ps (VIOLATED)",
    "principle": "High-to-Low level shifters cross voltage boundaries. Launch registers in the higher voltage domain switch much faster than capture registers in the lower voltage domain, creating an inherent multi-voltage hold race condition.",
    "remedyTcl": "# 1. Insert dual-rail delay buffer inside the high-voltage domain before level shifting\neco_add_repeater -pin u_ls/ls_bit0/A -cell DLY2_X2 -domain PD_CORE\n# 2. Update multi-voltage timing views\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Voltage Crossing",
        "val": "0.95V -> 0.65V"
      },
      {
        "label": "Level Shifter Hold Slack",
        "val": "-75.0 ps"
      },
      {
        "label": "Fast Launch Delay",
        "val": "14.0 ps"
      },
      {
        "label": "Slow Capture Delay",
        "val": "98.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Voltage Crossing",
        "val": "0.95V -> 0.65V"
      },
      {
        "label": "Level Shifter Hold Slack",
        "val": "+28.0 ps (MET)"
      },
      {
        "label": "Fast Launch Delay",
        "val": "118.0 ps (Buffered)"
      },
      {
        "label": "Slow Capture Delay",
        "val": "98.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert a dedicated dual-rail delay buffer in the high-voltage domain before the level shifter input to pad data arrival by 104 ps.",
        "correct": true,
        "explanation": "Padding the signal in the high-voltage domain compensates for the clock insertion latency of the slow 0.65V capture clock, achieving +28 ps hold margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 20,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Opposite-Direction Switching Aggressor Inducing 145 ps Delta Delay Slowdown",
    "severity": "CRITICAL",
    "stageName": "Signoff SI / Delta Delay",
    "symptom": "Parallel 32-bit memory address bus exhibits 145 ps of crosstalk delta delay (slowdown) due to opposite-direction switching on adjacent parallel wires, violating setup by -85 ps.",
    "logSnippet": "[TEMPUS-SI] Victim Net: u_mem/addr_bus[14] (Coupling Cap: 48.0 fF / 68% of Total Cap)\n[TEMPUS-SI] Aggressors: addr_bus[13] (Falling) and addr_bus[15] (Falling) while Victim is Rising\n[TEMPUS-SI] Effective Miller Coupling Factor: 2.0x (C_eff = C_gnd + 2*C_c)\n[TEMPUS-SI] Delta Delay Slowdown: +145.0 ps (Base Delay: 120 ps -> SI Delay: 265 ps)\n[TEMPUS-SETUP] Slack with SI: -85.0 ps (VIOLATED)",
    "principle": "When adjacent metal wires switch in opposite directions simultaneously (one rising, one falling), the effective coupling capacitance across them doubles due to the Miller effect (dV/dt = 2*VDD), injecting massive displacement current (I = C_c * dV/dt) and drastically slowing signal transition.",
    "remedyTcl": "# 1. Apply Non-Default Rule (NDR) with 2x spacing or insert shield wires (VSS)\nset_db [get_db nets u_mem/addr_bus[*]].route_rule NDR_1W2S\neco_route -nets [get_db nets u_mem/addr_bus[*]]\n# 2. Re-extract parasitics with Quantus SI and update Tempus\nread_spef -view view_setup_ssgnp pnr_output_si.spef.gz\nreport_timing -net -si",
    "beforeMetrics": [
      {
        "label": "Coupling Cap Ratio",
        "val": "68% (Extreme)"
      },
      {
        "label": "SI Delta Delay",
        "val": "+145.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-85.0 ps"
      },
      {
        "label": "Wire Spacing",
        "val": "1x Pitch (Standard)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Coupling Cap Ratio",
        "val": "18% (Low)"
      },
      {
        "label": "SI Delta Delay",
        "val": "+18.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+42.0 ps (MET)"
      },
      {
        "label": "Wire Spacing",
        "val": "2x Spacing (NDR)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Apply 2x spacing Non-Default Routing (NDR_1W2S) or interleave grounded VSS shield lines between adjacent parallel bus tracks.",
        "correct": true,
        "explanation": "Increasing inter-wire spacing by 2x slashes cross-coupling capacitance by 75%, collapsing delta delay from 145 ps to 18 ps and recovering +42 ps setup margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 21,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Same-Direction Switching Aggressors Inducing 95 ps In-Phase Speedup Hold Race",
    "severity": "HIGH",
    "stageName": "Signoff SI / Hold Speedup",
    "symptom": "In-phase switching between clock line and adjacent data line speeds up data propagation by 95 ps, causing a fatal -65 ps hold violation.",
    "logSnippet": "[TEMPUS-SI] Victim Net: u_core/fast_data_bus[0] (Rising)\n[TEMPUS-SI] Aggressors: clk_tree_branch[4] (Rising simultaneously)\n[TEMPUS-SI] Effective Miller Factor: 0.0x (C_eff = C_gnd - C_c)\n[TEMPUS-SI] In-Phase Speedup Delta Delay: -95.0 ps (Data arrives 95 ps earlier than nominal)\n[TEMPUS-HOLD] Slack: -65.0 ps (VIOLATED)",
    "principle": "When aggressor and victim switch in the same direction at the same instant, no charge transfers across the coupling capacitor (dV/dt = 0), reducing effective load capacitance to near zero. The victim transitions much faster than nominal, causing severe hold race conditions.",
    "remedyTcl": "# 1. Isolate clock net with dedicated coaxial VSS shielding (3W3S NDR + VSS guard)\nset_db [get_db nets clk_tree_branch[*]].route_rule CLK_SHIELD_RULE\neco_route -nets [get_db nets clk_tree_branch[*]]\n# 2. Add hold compensation buffer on data line\neco_add_repeater -net u_core/fast_data_bus[0] -cell DLY2_X2",
    "beforeMetrics": [
      {
        "label": "Speedup Delta Delay",
        "val": "-95.0 ps"
      },
      {
        "label": "Hold Slack with SI",
        "val": "-65.0 ps"
      },
      {
        "label": "Clock Shielding",
        "val": "None (Adjacent)"
      },
      {
        "label": "Coupling Cap",
        "val": "35.0 fF"
      }
    ],
    "afterMetrics": [
      {
        "label": "Speedup Delta Delay",
        "val": "-5.0 ps"
      },
      {
        "label": "Hold Slack with SI",
        "val": "+25.0 ps (MET)"
      },
      {
        "label": "Clock Shielding",
        "val": "VSS Shield Coaxial"
      },
      {
        "label": "Coupling Cap",
        "val": "2.1 fF"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Route the critical clock tree branch with dedicated VSS shielding lines and pad the data line with a DLY2_X2 buffer.",
        "correct": true,
        "explanation": "Shielding isolates the clock line from data nets, preventing parasitic in-phase charge injection and securing +25 ps hold margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 22,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Dynamic Noise Glitch Peak Exceeding Receiver Noise Margin (V_IL / V_IH Violation)",
    "severity": "CRITICAL",
    "stageName": "Signoff SI / Noise Glitch",
    "symptom": "A quiet low victim net experiences a 340 mV crosstalk noise glitch (exceeding receiver V_IL threshold of 180 mV), threatening spurious logic switching.",
    "logSnippet": "[TEMPUS-NOISE] Victim Net: u_fsm/state_reset_n (Quiet Low / Logic 0)\n[TEMPUS-NOISE] Glitch Peak Voltage: 340.5 mV (Max Noise Threshold V_IL: 180.0 mV - FAIL)\n[TEMPUS-NOISE] Glitch Pulse Width: 210.0 ps at 50% VDD\n[TEMPUS-NOISE] Receiver: u_fsm/state_flop_reg/RN (Will trigger illegal asynchronous reset!)",
    "principle": "When multiple aggressors switch simultaneously beside a static quiet victim, capacitive charge injection creates a voltage spike. If the glitch peak exceeds the receiver static noise margin (V_IL / V_IH) and has sufficient pulse width, the receiver interprets the glitch as a valid transition.",
    "remedyTcl": "# 1. Upsize victim driver cell to reduce output impedance (lower R_on absorbs glitch)\neco_change_cell -insts u_fsm/reset_driver_inst -lib_cell BUF_X16\n# 2. Add grounded decap shield net along parallel routing segment\neco_route -nets u_fsm/state_reset_n -shield_net VSS",
    "beforeMetrics": [
      {
        "label": "Glitch Peak Voltage",
        "val": "340.5 mV (FAIL)"
      },
      {
        "label": "Receiver V_IL Limit",
        "val": "180.0 mV"
      },
      {
        "label": "Driver Resistance",
        "val": "450 \u03a9 (Weak)"
      },
      {
        "label": "Spurious Reset Risk",
        "val": "CRITICAL"
      }
    ],
    "afterMetrics": [
      {
        "label": "Glitch Peak Voltage",
        "val": "52.0 mV (PASS)"
      },
      {
        "label": "Receiver V_IL Limit",
        "val": "180.0 mV"
      },
      {
        "label": "Driver Resistance",
        "val": "45 \u03a9 (Strong X16)"
      },
      {
        "label": "Spurious Reset Risk",
        "val": "ZERO"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Upsize the victim driver to BUF_X16 to drastically lower driver impedance (R_on) and shield the net with grounded VSS lines.",
        "correct": true,
        "explanation": "A low-impedance driver quickly shunts injected crosstalk charge to ground, suppressing the glitch peak from 340 mV down to 52 mV (well below V_IL)."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 23,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Weak High-Impedance Driver Vulnerability on Long Intermediate Net",
    "severity": "HIGH",
    "stageName": "Signoff SI / Driver Sizing",
    "symptom": "A minimum-drive inverter (INV_X1) driving a 650 \u00b5m net is easily overwhelmed by 4 adjacent bus aggressors, suffering 190 ps delta delay.",
    "logSnippet": "[TEMPUS-SI] Driver: u_ctrl/u_inv_stage (LibCell: INV_X1, R_on: 680 Ohm)\n[TEMPUS-SI] Net Length: 650.0 um | 4 Parallel Aggressors Active\n[TEMPUS-SI] Total Aggressor Coupling: 55.0 fF vs Ground Cap: 15.0 fF (Ratio: 78%)\n[TEMPUS-SI] Delay Slowdown: +190.0 ps (Slack: -110.0 ps)",
    "principle": "Weak drivers with high channel on-resistance (R_on) cannot hold their output voltage steady when coupled aggressors switch, leading to extreme susceptibility to crosstalk delta delay.",
    "remedyTcl": "# 1. Upsize driver from INV_X1 to INV_X8 to decrease drive resistance\neco_change_cell -insts u_ctrl/u_inv_stage -lib_cell INV_X8\n# 2. Re-compute SI delay and verify slack recovery\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Driver Cell",
        "val": "INV_X1 (Weak)"
      },
      {
        "label": "Driver R_on",
        "val": "680 \u03a9"
      },
      {
        "label": "SI Delta Delay",
        "val": "+190.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-110.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Driver Cell",
        "val": "INV_X8 (Strong)"
      },
      {
        "label": "Driver R_on",
        "val": "85 \u03a9"
      },
      {
        "label": "SI Delta Delay",
        "val": "+22.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+58.0 ps (MET)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Upsize the driver from INV_X1 to INV_X8 to reduce driver output resistance by 8x.",
        "correct": true,
        "explanation": "Lower driver impedance allows the gate to maintain output drive against coupling current, slashing delta delay from 190 ps to 22 ps."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 24,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Aggressor Timing Window Non-Overlap Over-Estimation (Pessimism Reduction)",
    "severity": "MEDIUM",
    "stageName": "Signoff SI / Window Alignment",
    "symptom": "Tempus SI with infinite timing windows reports -130 ps slack, but aggressors physically switch 400 ps after the victim is already stable.",
    "logSnippet": "[TEMPUS-SI] Victim Switching Window: [120.0 ps .. 250.0 ps]\n[TEMPUS-SI] Aggressor Switching Window: [650.0 ps .. 800.0 ps]\n[TEMPUS-SI] Timing Window Overlap: ZERO OVERLAP (Physically decoupled in time!)\n[TEMPUS-SI] Infinite Window Penalty: 160.0 ps -> Window-Aware Penalty: 0.0 ps",
    "principle": "Real crosstalk can only occur if the aggressor transitions while the victim is actively switching. Applying switching window alignment analysis removes false crosstalk penalties on signals that never switch concurrently.",
    "remedyTcl": "# 1. Enable switching timing window aware SI analysis in Tempus\nset_db si_glitch_enable_timing_windows true\nset_db si_delay_enable_timing_windows true\n# 2. Update timing graph with multi-iteration window narrowing\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Window Analysis",
        "val": "Infinite Window (Blind)"
      },
      {
        "label": "Calculated Delta Delay",
        "val": "160.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-130.0 ps (FALSE FAIL)"
      },
      {
        "label": "Window Overlap",
        "val": "Assumed 100%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Window Analysis",
        "val": "Timing Window Aware"
      },
      {
        "label": "Calculated Delta Delay",
        "val": "0.0 ps (Disjoint)"
      },
      {
        "label": "Setup Slack",
        "val": "+30.0 ps (MET)"
      },
      {
        "label": "Window Overlap",
        "val": "0% (Non-Overlapping)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable timing-window-aware SI analysis (`si_delay_enable_timing_windows true`) to remove fictitious crosstalk between disjoint switching events.",
        "correct": true,
        "explanation": "Temporal window verification proves that aggressor transitions occur 400 ps after the victim is settled, eliminating 160 ps of false SI delay."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 25,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Clock Net Crosstalk Jitter Induced by Adjacent High-Activity Data Bus",
    "severity": "HIGH",
    "stageName": "Signoff SI / Clock Jitter",
    "symptom": "A clock distribution branch routed next to an unshielded 128-bit streaming video bus experiences 42 ps of crosstalk-induced deterministic clock jitter.",
    "logSnippet": "[TEMPUS-SI] Clock Net: u_cts/clk_branch_gpu (Frequency: 1.2 GHz)\n[TEMPUS-SI] Aggressor Net: u_axi/video_stream_data[63:0] (Activity Factor: 0.95)\n[TEMPUS-SI] Coupled Cap on Clock Net: 62.0 fF\n[TEMPUS-SI] Induced Clock Jitter: 42.0 ps (Exceeds PLL Jitter Budget: 15.0 ps)",
    "principle": "Clock nets must be protected from dynamic data coupling. Crosstalk on clock lines modulates the clock edge arrival time (jitter), directly eroding both setup and hold timing margins across thousands of downstream registers.",
    "remedyTcl": "# 1. Enforce strict clock shielding DRC rule in PnR and re-route\nset_db [get_db nets -if {.is_clock == true}].route_rule 2W_2S_SHIELD_VSS\neco_route -nets [get_db nets -if {.is_clock == true}]\n# 2. Verify clean clock arrival in Tempus\nreport_clock_jitter -clock clk_gpu",
    "beforeMetrics": [
      {
        "label": "Clock Crosstalk Jitter",
        "val": "42.0 ps (FAIL)"
      },
      {
        "label": "Jitter Budget",
        "val": "15.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-38.0 ps"
      },
      {
        "label": "Clock Shielding",
        "val": "Unshielded"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Crosstalk Jitter",
        "val": "2.1 ps (PASS)"
      },
      {
        "label": "Jitter Budget",
        "val": "15.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+18.0 ps (MET)"
      },
      {
        "label": "Clock Shielding",
        "val": "Coaxial VSS Shield"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Re-route clock nets with double-spacing and dedicated coaxial VSS shields (2W_2S_SHIELD_VSS).",
        "correct": true,
        "explanation": "Coaxial VSS shields absorb all electromagnetic and capacitive field lines, reducing clock jitter from 42 ps to 2.1 ps."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 26,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Slew Degradation Induced by Crosstalk on Sensitive Analog PLL Reference Line",
    "severity": "CRITICAL",
    "stageName": "Signoff SI / Mixed-Signal",
    "symptom": "A 100 MHz reference clock for an on-chip PLL suffers transition degradation from 45 ps to 240 ps due to high-voltage I/O switching crosstalk.",
    "logSnippet": "[TEMPUS-SI] Net: u_pll/ref_clk_in (Sensitive Analog Input)\n[TEMPUS-SI] Aggressors: u_pad/gpio_dout[7:0] (3.3V / 1.8V switching transients)\n[TEMPUS-SI] Input Slew on PLL Ref: 240.0 ps (Limit: 50.0 ps)\n[TEMPUS-SI] PLL Lock Integrity: UNSTABLE (Phase noise degradation)",
    "principle": "Analog reference signals routed across digital domains are vulnerable to large-amplitude I/O transients. Slew degradation on reference clocks degrades PLL phase noise and lock stability.",
    "remedyTcl": "# 1. Reroute analog PLL net inside an isolated guard ring on top metal M8\nset_db [get_db nets u_pll/ref_clk_in].preferred_routing_layer M8\nset_db [get_db nets u_pll/ref_clk_in].shield_net VSS\n# 2. Add isolation distance from I/O ring\neco_route",
    "beforeMetrics": [
      {
        "label": "Ref Clock Slew",
        "val": "240.0 ps (FAIL)"
      },
      {
        "label": "PLL Phase Noise",
        "val": "-78 dBc/Hz (Degraded)"
      },
      {
        "label": "Coupling Source",
        "val": "I/O Pad Ring"
      },
      {
        "label": "Shielding",
        "val": "None"
      }
    ],
    "afterMetrics": [
      {
        "label": "Ref Clock Slew",
        "val": "38.0 ps (PASS)"
      },
      {
        "label": "PLL Phase Noise",
        "val": "-112 dBc/Hz (Clean)"
      },
      {
        "label": "Coupling Source",
        "val": "Isolated"
      },
      {
        "label": "Shielding",
        "val": "Top Metal Guard Ring"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Route the PLL reference net on top metal (M8) inside a fully grounded isolation guard ring away from I/O pads.",
        "correct": true,
        "explanation": "Physical guard ring isolation blocks pad transient coupling, restoring sharp 38 ps slew and clean -112 dBc/Hz PLL lock."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 27,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Asymmetric Capacitive Cross-Coupling in Dense Register File Bitlines",
    "severity": "HIGH",
    "stageName": "Signoff SI / Memory Arrays",
    "symptom": "Dense multiport register file bitlines experience 85 mV differential voltage imbalance from adjacent write bitlines, causing read access failure.",
    "logSnippet": "[TEMPUS-SI] Victim Net: u_rf/bitline_read_0 (Precharged High: 0.80V)\n[TEMPUS-SI] Aggressor: u_rf/bitline_write_1 (Full-rail swing 0V -> 0.8V)\n[TEMPUS-SI] Injected Differential Noise: 85.0 mV (Sense Amp Margin: 40.0 mV)\n[TEMPUS-SI] Result: False read trigger on Sense Amplifier",
    "principle": "Multiport memory bitlines run parallel for hundreds of microns. Asymmetric write bitline switching injects differential common-mode noise into precharged read bitlines, exceeding sense amplifier sensitivity thresholds.",
    "remedyTcl": "# 1. Apply bitline twisting (cross-over transposition) at mid-array to cancel differential noise\n# 2. Enforce differential shielding rules in memory macro wrapper\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Bitline Noise",
        "val": "85.0 mV (FAIL)"
      },
      {
        "label": "Sense Amp Margin",
        "val": "40.0 mV"
      },
      {
        "label": "Bitline Layout",
        "val": "Straight Parallel"
      },
      {
        "label": "Read Failure Rate",
        "val": "High"
      }
    ],
    "afterMetrics": [
      {
        "label": "Bitline Noise",
        "val": "12.0 mV (PASS)"
      },
      {
        "label": "Sense Amp Margin",
        "val": "40.0 mV"
      },
      {
        "label": "Bitline Layout",
        "val": "Twisted Transposition"
      },
      {
        "label": "Read Failure Rate",
        "val": "Zero"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Implement bitline twisting (transposition) at mid-column to convert differential crosstalk into harmless common-mode noise.",
        "correct": true,
        "explanation": "Twisting causes coupling from the first half of the line to cancel coupling from the second half, reducing differential noise to 12 mV."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 28,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Victim Net Receiver Capacitive Miller Effect Underestimation in Fast Corners",
    "severity": "MEDIUM",
    "stageName": "Signoff SI / Extraction Corner",
    "symptom": "Extracting parasitics at typical corner underestimates Miller coupling at fast corner (C_c contributes 2.4x effective capacitance), causing unexpected hold failures.",
    "logSnippet": "[TEMPUS-SI] SPEF Extraction Corner: typ_rc vs Signoff Corner: cworst_ccorner\n[TEMPUS-SI] Coupling Cap C_c in typ_rc: 22.0 fF -> cworst: 38.5 fF (+75% higher in cworst!)\n[TEMPUS-SI] Unmodeled Delta Delay: 65.0 ps\n[TEMPUS-HOLD] Slack: -45.0 ps (VIOLATED)",
    "principle": "Interconnect corner variations significantly affect lateral vs vertical capacitance ratios. In 'cworst' (maximum capacitance) corners, lateral wire thickness variations maximize cross-coupling capacitance $C_c$.",
    "remedyTcl": "# 1. Extract multi-corner SPEF with dedicated cworst/rcworst Quantus corners\nread_spef -view view_hold_ffgnp_cworst pnr_output_cworst.spef.gz\n# 2. Run signoff SI analysis with extracted corner\nset_db si_analysis_type full_coupled\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "SPEF Corner",
        "val": "typ_rc (Under-extracted)"
      },
      {
        "label": "Coupling Cap",
        "val": "22.0 fF"
      },
      {
        "label": "Hold Slack",
        "val": "-45.0 ps"
      },
      {
        "label": "Extraction Error",
        "val": "75% C_c under-report"
      }
    ],
    "afterMetrics": [
      {
        "label": "SPEF Corner",
        "val": "cworst (Signoff Validated)"
      },
      {
        "label": "Coupling Cap",
        "val": "38.5 fF"
      },
      {
        "label": "Hold Slack",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Extraction Error",
        "val": "0% (Accurate)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Extract parasitics using dedicated 'cworst' Quantus corners and perform full-coupled SI signoff analysis.",
        "correct": true,
        "explanation": "Using validated cworst parasitic extraction ensures hold buffers are correctly sized against maximum real-silicon cross-coupling."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 29,
    "domainId": "si_crosstalk_noise",
    "domainName": "Signal Integrity & Crosstalk",
    "title": "Long Interleaved Bus Crosstalk Cancellation via Staggered Driver Inverters",
    "severity": "LOW",
    "stageName": "Signoff SI / Bus Optimization",
    "symptom": "A 64-bit wide parallel bus suffers 110 ps delta delay due to all-bits-switching in phase.",
    "logSnippet": "[TEMPUS-SI] Bus: u_interconnect/noc_flit_data[63:0]\n[TEMPUS-SI] Simultaneous Switching Probability: 100%\n[TEMPUS-SI] Cumulative Crosstalk Delay: 110.0 ps\n[TEMPUS-SETUP] Slack: -55.0 ps",
    "principle": "When an entire bus transitions simultaneously, all wires couple to each other. Inverting alternating bits (even bits normal, odd bits inverted) breaks correlated switching patterns, dramatically reducing peak simultaneous switching noise.",
    "remedyTcl": "# 1. Insert polarity inverters on alternating bus bits (even bits +, odd bits -)\n# 2. Recover polarity at receiving end\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Switching Correlation",
        "val": "100% In-Phase"
      },
      {
        "label": "Crosstalk Delay",
        "val": "110.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-55.0 ps"
      },
      {
        "label": "Power Ripple",
        "val": "High"
      }
    ],
    "afterMetrics": [
      {
        "label": "Switching Correlation",
        "val": "Alternating Staggered"
      },
      {
        "label": "Crosstalk Delay",
        "val": "24.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+31.0 ps (MET)"
      },
      {
        "label": "Power Ripple",
        "val": "Low (Balanced)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Invert alternating bits across the 64-bit bus to break switching correlation and cancel mutual capacitive coupling.",
        "correct": true,
        "explanation": "Alternating polarity causes adjacent lines to switch in opposite directions symmetrically, suppressing net displacement currents and recovering +31 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 30,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Flat OCV Derating Over-Pessimism on Deep Paths (AOCV Stage Depth Required)",
    "severity": "HIGH",
    "stageName": "Signoff OCV / AOCV Migration",
    "symptom": "Applying a flat 10% OCV derate on a 40-stage logic path adds 380 ps of unrealistic pessimism, causing false -190 ps setup violations.",
    "logSnippet": "[TEMPUS-OCV] Derating Mode: Flat OCV (Derate: 1.10 on Late, 0.90 on Early)\n[TEMPUS-OCV] Path Logic Depth: 42 stages | Total Path Delay: 1.90 ns\n[TEMPUS-OCV] Flat OCV Penalty: 190.0 ps (Assumes all 42 stages vary in worst-case direction!)\n[TEMPUS-SETUP] Slack: -190.0 ps (UNREALISTIC OVER-PESSIMISM)",
    "principle": "In real silicon, random dopant fluctuations across multi-stage paths average out statistically based on the Law of Large Numbers (sigma_total = sqrt(N)*sigma_stage). Flat OCV assumes correlated worst-case variation across all gates, which is physically impossible on deep paths.",
    "remedyTcl": "# 1. Enable Advanced On-Chip Variation (AOCV) with stage-depth derating tables\nset_db timing_aocv_derate_mode depth_and_distance\nread_aocv foundry_aocv_tables.aocv\n# 2. Update timing\nupdate_timing -full\nreport_timing -max_paths 10",
    "beforeMetrics": [
      {
        "label": "OCV Derate Mode",
        "val": "Flat 10% (Pessimistic)"
      },
      {
        "label": "Derate Penalty",
        "val": "190.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-190.0 ps (FALSE FAIL)"
      },
      {
        "label": "Statistical Averaging",
        "val": "Ignored"
      }
    ],
    "afterMetrics": [
      {
        "label": "OCV Derate Mode",
        "val": "AOCV Stage Depth"
      },
      {
        "label": "Derate Penalty",
        "val": "45.0 ps (Realistic)"
      },
      {
        "label": "Setup Slack",
        "val": "+25.0 ps (MET)"
      },
      {
        "label": "Statistical Averaging",
        "val": "sqrt(N) Modeled"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Switch from flat OCV to stage-depth Advanced On-Chip Variation (AOCV) modeling using foundry table derates.",
        "correct": true,
        "explanation": "AOCV accounts for statistical variation averaging across the 42 logic stages, removing 145 ps of artificial pessimism and closing setup with +25 ps margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 31,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Parametric On-Chip Variation (POCV) 3-Sigma Statistical Signoff Closure",
    "severity": "CRITICAL",
    "stageName": "Signoff POCV / LVF Signoff",
    "symptom": "Migrating from AOCV to Parametric OCV (POCV) with Liberty Variation Format (LVF) statistical moments (sigma, skewness) to achieve true 3-sigma signoff.",
    "logSnippet": "[TEMPUS-POCV] Timing Analysis Mode: Statistical POCV (C-Sigma = 3.0)\n[TEMPUS-POCV] LVF Format: Liberty Variation Format with Moments (mean, sigma, skewness)\n[TEMPUS-POCV] Path Delay: Mean (mu) = 620.0 ps, Variance (sigma) = 18.2 ps\n[TEMPUS-POCV] 3-Sigma Path Delay: 620.0 + 3 * 18.2 = 674.6 ps\n[TEMPUS-SETUP] Slack at 3-Sigma: +22.0 ps (MET - Clean Statistical Signoff)",
    "principle": "POCV models gate delay variation as independent Gaussian random variables (mu, sigma) with spatial correlation. Total path variation is computed root-sum-square (RSS), providing accurate statistical timing closure at advanced FinFET nodes (7nm/5nm/3nm).",
    "remedyTcl": "# 1. Enable POCV analysis with Liberty Variation Format (LVF)\nset_db timing_pocv_enable true\nset_db timing_pocv_sigma 3.0\nread_view_definition mmmc_pocv_lvf.tcl\n# 2. Update statistical timing graph\nupdate_timing -full\nreport_timing -pocv",
    "beforeMetrics": [
      {
        "label": "Analysis Methodology",
        "val": "Deterministic AOCV"
      },
      {
        "label": "Pessimism Margin",
        "val": "+85.0 ps extra"
      },
      {
        "label": "Signoff Confidence",
        "val": "Deterministic Bound"
      },
      {
        "label": "LVF Moments",
        "val": "Ignored"
      }
    ],
    "afterMetrics": [
      {
        "label": "Analysis Methodology",
        "val": "Statistical POCV (3-Sigma)"
      },
      {
        "label": "Pessimism Margin",
        "val": "Exact RSS Addition"
      },
      {
        "label": "Signoff Confidence",
        "val": "99.87% Yield"
      },
      {
        "label": "LVF Moments",
        "val": "Mean + Sigma + Skew"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable Statistical POCV with 3-Sigma signoff (`timing_pocv_sigma 3.0`) utilizing foundry LVF variation libraries.",
        "correct": true,
        "explanation": "POCV computes exact root-sum-square variance across independent path stages, removing over-pessimism while strictly guaranteeing 99.87% statistical yield."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 32,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Path-Based Analysis (PBA) Graph-Based Pessimism Removal on Slew Merging",
    "severity": "HIGH",
    "stageName": "Signoff PBA / Slew Recovery",
    "symptom": "Graph-Based Analysis (GBA) propagates worst-case input slew from all converging paths, creating -75 ps false negative slack that disappears under Path-Based Analysis (PBA).",
    "logSnippet": "[TEMPUS-PBA] Endpoint: u_exec/pipe_reg[15]/D\n[TEMPUS-PBA] Graph-Based Analysis (GBA) Slack: -75.0 ps (Slew merged from slow test path: 220 ps)\n[TEMPUS-PBA] Path-Based Analysis (PBA) Re-calculation: Actual input slew on functional path is 65 ps\n[TEMPUS-PBA] Gate Delay Recovery: 92.0 ps\n[TEMPUS-PBA] Path-Based Analysis (PBA) Slack: +17.0 ps (MET)",
    "principle": "GBA merges the worst-case slew across all input pins of a gate to remain conservative for the entire timing graph. PBA re-propagates exact, path-specific slews along the critical path of interest, eliminating GBA slew-merging pessimism.",
    "remedyTcl": "# 1. Run Path-Based Analysis (PBA) on all failing endpoints\nreport_timing -pba_mode path -max_paths 100 -slack_lesser_than 0.0\n# 2. Enforce PBA mode for signoff reporting\nset_db timing_report_pba_mode path",
    "beforeMetrics": [
      {
        "label": "Timing Mode",
        "val": "GBA (Graph-Based)"
      },
      {
        "label": "Propagated Slew",
        "val": "220.0 ps (Worst Merged)"
      },
      {
        "label": "Reported Slack",
        "val": "-75.0 ps (FALSE FAIL)"
      },
      {
        "label": "PBA Recovery",
        "val": "0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Timing Mode",
        "val": "PBA (Path-Based)"
      },
      {
        "label": "Propagated Slew",
        "val": "65.0 ps (Path Exact)"
      },
      {
        "label": "Reported Slack",
        "val": "+17.0 ps (MET)"
      },
      {
        "label": "PBA Recovery",
        "val": "+92.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute Path-Based Analysis (`report_timing -pba_mode path`) to evaluate exact path-specific transition times.",
        "correct": true,
        "explanation": "PBA removes artificial slew-merging pessimism from converging non-critical paths, recovering 92 ps and turning the slack positive (+17 ps)."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 33,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Spatial Correlation Distance Modeling in POCV (Die-to-Die vs Within-Die)",
    "severity": "MEDIUM",
    "stageName": "Signoff POCV / Spatial Correlation",
    "symptom": "Adjacent gates within 50 \u00b5m distance are subjected to uncorrelated derating, causing false clock skew on closely placed register pairs.",
    "logSnippet": "[TEMPUS-POCV] Gate 1 (Launch): u_reg_a (Loc: 100.0, 200.0) | Gate 2 (Capture): u_reg_b (Loc: 110.0, 205.0)\n[TEMPUS-POCV] Physical Distance: 11.18 um (Highly correlated within-die process region)\n[TEMPUS-POCV] Spatial Correlation Factor: rho = 0.92\n[TEMPUS-POCV] Skew without Spatial Correlation: 35.0 ps -> Skew with Spatial Correlation: 8.5 ps",
    "principle": "Transistors physically close to each other on the silicon die share identical thermal, lithographic, and oxide thickness variations (spatial correlation factor $\\rho \\to 1$). Modeling spatial distance correlation reduces random skew between local gate pairs.",
    "remedyTcl": "# 1. Enable spatial correlation distance grid in Tempus POCV\nset_db timing_pocv_spatial_correlation true\nset_db timing_pocv_spatial_distance_scale 500.0\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Spatial Correlation",
        "val": "Disabled (rho = 0.0)"
      },
      {
        "label": "Local Clock Skew",
        "val": "35.0 ps (Over-estimated)"
      },
      {
        "label": "Hold Slack",
        "val": "-22.0 ps"
      },
      {
        "label": "Physical Distance",
        "val": "11.2 \u00b5m"
      }
    ],
    "afterMetrics": [
      {
        "label": "Spatial Correlation",
        "val": "Enabled (rho = 0.92)"
      },
      {
        "label": "Local Clock Skew",
        "val": "8.5 ps (Correlated)"
      },
      {
        "label": "Hold Slack",
        "val": "+12.5 ps (MET)"
      },
      {
        "label": "Physical Distance",
        "val": "11.2 \u00b5m"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable POCV spatial correlation modeling (`timing_pocv_spatial_correlation true`) with foundry distance scaling.",
        "correct": true,
        "explanation": "Spatial correlation recognizes that nearby gates (11 \u00b5m) experience 92% correlated variation, slashing false clock skew from 35 ps to 8.5 ps."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 34,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Non-Gaussian Distribution Asymmetry: Extreme Low Voltage (ELV) Skewness",
    "severity": "CRITICAL",
    "stageName": "Signoff POCV / Non-Gaussian Tail",
    "symptom": "At ultra-low voltage (0.55V), gate delay distributions exhibit heavy positive skewness (long tail); standard Gaussian 3-sigma analysis underestimates worst-case delay by 18%.",
    "logSnippet": "[TEMPUS-ELV] Voltage Corner: 0.55V (Near-Threshold Region)\n[TEMPUS-ELV] Distribution Shape: Heavily Skewed Log-Normal (Skewness moment = +1.84)\n[TEMPUS-ELV] Gaussian 3-Sigma Delay: 980.0 ps vs True Non-Gaussian Tail Delay: 1160.0 ps (+18% ERROR)\n[TEMPUS-ELV] Result: Silicon timing failure if moments are not modeled in LVF!",
    "principle": "Near threshold voltage, gate delay is an exponential function of threshold voltage ($T_d \\propto \\exp(-V_{th} / n k T)$). Small Gaussian variations in $V_{th}$ translate into extreme non-Gaussian tail delays. Signoff requires Liberty Variation Format with higher-order statistical moments.",
    "remedyTcl": "# 1. Enable Moment-Based POCV (mean, sigma, skewness) in Tempus\nset_db timing_pocv_moment_based true\nread_lib -lvf_moments tech_elv_0p55v.lib\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Statistical Model",
        "val": "Standard Gaussian (mu, sigma)"
      },
      {
        "label": "Tail Accuracy",
        "val": "Underestimated by 18%"
      },
      {
        "label": "Silicon Yield at 0.55V",
        "val": "Failing in Fab"
      },
      {
        "label": "Skewness Modeled",
        "val": "No"
      }
    ],
    "afterMetrics": [
      {
        "label": "Statistical Model",
        "val": "Moment-Based (mu, sigma, skew)"
      },
      {
        "label": "Tail Accuracy",
        "val": "100% Non-Gaussian Clean"
      },
      {
        "label": "Silicon Yield at 0.55V",
        "val": "100% Signoff Pass"
      },
      {
        "label": "Skewness Modeled",
        "val": "Yes (+1.84)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Enable Moment-Based POCV (`timing_pocv_moment_based true`) reading LVF non-Gaussian skewness moments from library.",
        "correct": true,
        "explanation": "Moment-based POCV accurately captures the exponential long tail at 0.55V, ensuring silicon timing integrity near threshold voltage."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 35,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Common Path Pessimism Removal Credit Calculation under Statistical POCV",
    "severity": "HIGH",
    "stageName": "Signoff CPPR / POCV CPPR",
    "symptom": "CPPR credit on a clock distribution tree with 12 common buffers must be calculated using statistical root-sum-square subtraction rather than algebraic derate difference.",
    "logSnippet": "[TEMPUS-CPPR] Clock Root to Divergence Point: 12 Shared Clock Buffers\n[TEMPUS-CPPR] Algebraic Derate Skew: 48.0 ps\n[TEMPUS-CPPR] Statistical Variance of Shared Path: sigma_shared^2 = Sum(sigma_i^2)\n[TEMPUS-CPPR] Statistical CPPR Credit: 42.5 ps returned to timing path\n[TEMPUS-SETUP] WNS after Statistical CPPR: +16.0 ps (MET)",
    "principle": "In POCV, CPPR is computed by subtracting the variance contribution of common clock path elements from the total path variance: $\\sigma_{\\text{path,net}}^2 = \\sigma_{\\text{launch}}^2 + \\sigma_{\\text{capture}}^2 - 2\\sigma_{\\text{common}}^2$.",
    "remedyTcl": "# 1. Enable statistical CPPR calculation in POCV mode\nset_db timing_pocv_cppr_mode statistical\nupdate_timing -full\nreport_timing -cppr",
    "beforeMetrics": [
      {
        "label": "CPPR Mode",
        "val": "Algebraic (Incompatible with POCV)"
      },
      {
        "label": "CPPR Credit",
        "val": "0.0 ps"
      },
      {
        "label": "Setup Slack",
        "val": "-26.5 ps"
      },
      {
        "label": "Common Tree Depth",
        "val": "12 buffers"
      }
    ],
    "afterMetrics": [
      {
        "label": "CPPR Mode",
        "val": "Statistical (Variance Subtraction)"
      },
      {
        "label": "CPPR Credit",
        "val": "+42.5 ps"
      },
      {
        "label": "Setup Slack",
        "val": "+16.0 ps (MET)"
      },
      {
        "label": "Common Tree Depth",
        "val": "12 buffers"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Set POCV CPPR mode to statistical (`set_db timing_pocv_cppr_mode statistical`).",
        "correct": true,
        "explanation": "Statistical CPPR variance subtraction correctly credits back common clock variation, turning a -26.5 ps deficit into +16 ps margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 36,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Interconnect Metal Layer Specific AOCV Table Interpolation Errors",
    "severity": "MEDIUM",
    "stageName": "Signoff OCV / Interconnect AOCV",
    "symptom": "A long routing net spanning M2 and M7 layers used a single default metal derate, over-derating thick M7 metals by 15%.",
    "logSnippet": "[TEMPUS-AOCV] Net: u_bus/data_trunk[7] (Spanning M2: 40 um, M7: 850 um)\n[TEMPUS-AOCV] Default Metal Derate Applied: 1.15 (Based on thin M2 metal)\n[TEMPUS-AOCV] True M7 Metal AOCV Derate: 1.03 (Thick metal has tight CMP control)\n[TEMPUS-SETUP] Artificial Pessimism on Net: 48.0 ps",
    "principle": "Different metal layers have vastly different process variations. Thin lower metals (M1-M3) have higher optical proximity and etch variations (15%), while thick upper metals (M7-M9) have tight chemical-mechanical polishing (CMP) control (3%). Derates must be layer-specific.",
    "remedyTcl": "# 1. Load layer-specific interconnect AOCV table\nread_aocv -layer_specific tech_metal_aocv.tbl\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Metal Derating",
        "val": "Uniform 15% across all layers"
      },
      {
        "label": "M7 Derate Error",
        "val": "+12% excess pessimism"
      },
      {
        "label": "Setup Slack",
        "val": "-35.0 ps"
      },
      {
        "label": "AOCV Table",
        "val": "Flat"
      }
    ],
    "afterMetrics": [
      {
        "label": "Metal Derating",
        "val": "Layer-Specific (M2: 15%, M7: 3%)"
      },
      {
        "label": "M7 Derate Error",
        "val": "0% (Calibrated)"
      },
      {
        "label": "Setup Slack",
        "val": "+13.0 ps (MET)"
      },
      {
        "label": "AOCV Table",
        "val": "Layer-Specific"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Load layer-specific interconnect AOCV tables (`read_aocv -layer_specific`) to apply true physical layer derates.",
        "correct": true,
        "explanation": "Applying layer-calibrated derates (3% on M7 vs 15% on M2) eliminates 48 ps of fictitious metal delay, closing setup cleanly."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 37,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Multi-Corner POCV Library Constraint Consistency (Setup vs Hold Sigma Alignment)",
    "severity": "HIGH",
    "stageName": "Signoff POCV / Library Audit",
    "symptom": "Hold library contained 1-sigma variation data while setup library contained 3-sigma data, creating inconsistent statistical bounds across corners.",
    "logSnippet": "[TEMPUS-AUDIT] Library: lib_fast_ffgnp (Contains 1-sigma standard deviation in LVF)\n[TEMPUS-AUDIT] Library: lib_slow_ssgnp (Contains 3-sigma standard deviation in LVF)\n[TEMPUS-AUDIT] Warning: Statistical scaling mismatch detected during MMMC setup/hold signoff!\n[TEMPUS-HOLD] Calculated Hold Risk: Real hold failure undetected due to 1-sigma scale error!",
    "principle": "Liberty Variation Format (LVF) data must have consistent sigma definitions (typically 1-sigma normalized in .lib, scaled by the EDA tool via `timing_pocv_sigma 3.0`). Mixing pre-scaled 3-sigma tables with 1-sigma tables corrupts multi-corner statistical signoff.",
    "remedyTcl": "# 1. Normalize library sigma format in Tempus library loader\nset_db timing_pocv_library_sigma_scale 1.0\n# 2. Audit all active MMMC libraries for consistent LVF scale factors\ncheck_timing -check_type pocv_consistency",
    "beforeMetrics": [
      {
        "label": "Library Scale Consistency",
        "val": "MISMATCH (1-sigma vs 3-sigma)"
      },
      {
        "label": "Hold Margin Integrity",
        "val": "CORRUPTED (Unsafe)"
      },
      {
        "label": "Audit Status",
        "val": "Failed"
      },
      {
        "label": "Signoff Risk",
        "val": "High"
      }
    ],
    "afterMetrics": [
      {
        "label": "Library Scale Consistency",
        "val": "UNIFIED (1-sigma base, 3.0x tool scale)"
      },
      {
        "label": "Hold Margin Integrity",
        "val": "100% Signoff Validated"
      },
      {
        "label": "Audit Status",
        "val": "Passed Clean"
      },
      {
        "label": "Signoff Risk",
        "val": "Zero"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Audit and normalize LVF library sigma definitions to a consistent 1-sigma standard with unified 3.0x EDA tool scaling.",
        "correct": true,
        "explanation": "Consistent statistical normalization ensures hold and setup margins accurately reflect true 3-sigma silicon bounds without corner distortion."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 38,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Graph-Based Exhaustive Path Search vs PBA Top-K Critical Path Convergence",
    "severity": "MEDIUM",
    "stageName": "Signoff PBA / Path Search Depth",
    "symptom": "PBA with top-100 path limit misses a critical setup violation on path rank 142 due to GBA ranking inversion.",
    "logSnippet": "[TEMPUS-PBA] GBA Rank 1..100: Re-evaluated with PBA -> All passed with positive slack\n[TEMPUS-PBA] GBA Rank 142: Experienced minimal GBA pessimism reduction (Slack with PBA: -35.0 ps)\n[TEMPUS-PBA] Cause: Path Rank Inversion (GBA order does not strictly match PBA order)",
    "principle": "Because GBA introduces different amounts of pessimism on different paths, the worst path under GBA is not always the worst path under PBA (Path Rank Inversion). Signoff PBA search depth must be expanded (e.g. top 10,000 paths or slack threshold).",
    "remedyTcl": "# 1. Configure PBA reporting with slack threshold rather than fixed path count\nreport_timing -pba_mode path -slack_lesser_than 0.050 -max_paths 10000\n# 2. Fix true worst PBA path\neco_change_cell -insts u_core/u_alu/cla_inst -lib_cell CLA_X8",
    "beforeMetrics": [
      {
        "label": "PBA Search Mode",
        "val": "Fixed Top-100 (Blind to Rank 142)"
      },
      {
        "label": "True Worst Slack",
        "val": "-35.0 ps (Missed Violation)"
      },
      {
        "label": "Signoff Safety",
        "val": "Compromised"
      },
      {
        "label": "Rank Inversion",
        "val": "Unchecked"
      }
    ],
    "afterMetrics": [
      {
        "label": "PBA Search Mode",
        "val": "Slack Threshold (Top-10,000 Paths)"
      },
      {
        "label": "True Worst Slack",
        "val": "+18.0 ps (MET & Fixed)"
      },
      {
        "label": "Signoff Safety",
        "val": "100% Guaranteed"
      },
      {
        "label": "Rank Inversion",
        "val": "Fully Resolved"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run PBA with a slack-threshold search filter (`report_timing -pba_mode path -slack_lesser_than 0.050 -max_paths 10000`) to catch inverted paths.",
        "correct": true,
        "explanation": "Expanding PBA search depth exposes the true rank-inverted path and allows targeted gate sizing to achieve +18 ps positive slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 39,
    "domainId": "ocv_pocv_derating",
    "domainName": "AOCV, POCV & PBA Analysis",
    "title": "Voltage Drop (IR Drop) Dynamic Derate Integration into POCV Signoff",
    "severity": "HIGH",
    "stageName": "Signoff STA / Dynamic IR Derate",
    "symptom": "A localized 8% dynamic IR drop hotspot slows clock buffers by 45 ps, violating setup when combined with 3-sigma POCV.",
    "logSnippet": "[TEMPUS-VOLTUS] Integrated Tempus-Voltus Dynamic STA View\n[TEMPUS-VOLTUS] Location: (X=450 um, Y=820 um) | Peak Dynamic IR Drop: 64.0 mV (8.0% VDD)\n[TEMPUS-VOLTUS] Dynamic Voltage Derate Applied: 1.085x on affected clock tree nodes\n[TEMPUS-VOLTUS] Combined Setup Slack: -55.0 ps",
    "principle": "Static timing analysis assumes nominal grid voltage unless voltage drop maps from rail signoff tools (Voltus) are back-annotated. Integrating vector-based dynamic IR drop maps into Tempus ensures timing closure under real switching power rail droop.",
    "remedyTcl": "# 1. Load Voltus dynamic IR drop instance voltage map into Tempus\nread_power_rail_results -voltage_file voltus_dynamic_ir.dump\n# 2. Re-compute timing with instance-specific voltage deratings\nupdate_timing -full\nreport_timing -views view_setup_ssgnp",
    "beforeMetrics": [
      {
        "label": "IR Drop Modeling",
        "val": "Nominal VDD (Blind to Hotspots)"
      },
      {
        "label": "Peak IR Drop",
        "val": "64.0 mV (8%)"
      },
      {
        "label": "Combined Slack",
        "val": "-55.0 ps (SILICON RISK)"
      },
      {
        "label": "Voltus Integration",
        "val": "Disabled"
      }
    ],
    "afterMetrics": [
      {
        "label": "IR Drop Modeling",
        "val": "Instance-Specific Voltus Back-Annotated"
      },
      {
        "label": "Peak IR Drop",
        "val": "64.0 mV (Compensated)"
      },
      {
        "label": "Combined Slack",
        "val": "+14.0 ps (MET)"
      },
      {
        "label": "Voltus Integration",
        "val": "Full Dynamic Vector"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Back-annotate dynamic IR drop voltage maps from Voltus into Tempus (`read_power_rail_results`) and perform voltage-aware timing optimization.",
        "correct": true,
        "explanation": "Integrating actual instance voltage derating ensures clock tree buffers are adequately sized to tolerate the 8% localized IR drop with +14 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 40,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Multi-Cycle Path (MCP) Setup/Hold Multiplier Shift Alignment Error",
    "severity": "CRITICAL",
    "stageName": "SDC Signoff / Constraint Audit",
    "symptom": "A 3-cycle architectural datapath constraint has `set_multicycle_path 3 -setup` but lacks `-hold 2`, causing Tempus to check hold against 2-cycle old data (-1.2 ns violation).",
    "logSnippet": "[TEMPUS-SDC] Constraint: set_multicycle_path 3 -setup -from u_div/reg_a* -to u_div/reg_b*\n[TEMPUS-SDC] Default Hold Behavior: Hold check placed at Edge 2 (Period * 2 = 1600 ps late!)\n[TEMPUS-SDC] Hold Required Time: 1600.0 ps | Data Arrival: 380.0 ps\n[TEMPUS-HOLD] Slack: -1220.0 ps (FATAL FALSE HOLD VIOLATION)",
    "principle": "In SDC semantics, specifying `set_multicycle_path N -setup` automatically moves the setup capture edge forward by N cycles, but leaves the hold check relative to Edge (N-1). For N-cycle paths, `set_multicycle_path (N-1) -hold` MUST be specified to keep the hold check at the launch edge (Edge 0).",
    "remedyTcl": "# 1. Correct SDC Multi-Cycle Path definition with hold edge realignment\nset_multicycle_path 3 -setup -from [get_pins u_div/reg_a*/CLK] -to [get_pins u_div/reg_b*/D]\nset_multicycle_path 2 -hold  -from [get_pins u_div/reg_a*/CLK] -to [get_pins u_div/reg_b*/D]\n# 2. Update timing graph\nupdate_timing -full\nreport_timing -check_type hold -from [get_pins u_div/reg_a*/CLK] -to [get_pins u_div/reg_b*/D]",
    "beforeMetrics": [
      {
        "label": "Setup MCP",
        "val": "3 cycles"
      },
      {
        "label": "Hold MCP",
        "val": "0 (Default SDC Bug)"
      },
      {
        "label": "Hold Slack",
        "val": "-1,220.0 ps (FALSE FAIL)"
      },
      {
        "label": "Hold Check Edge",
        "val": "Cycle 2 (Wrong)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Setup MCP",
        "val": "3 cycles"
      },
      {
        "label": "Hold MCP",
        "val": "2 cycles (Aligned)"
      },
      {
        "label": "Hold Slack",
        "val": "+45.0 ps (MET)"
      },
      {
        "label": "Hold Check Edge",
        "val": "Cycle 0 (Launch Edge)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Add `set_multicycle_path 2 -hold` to realign the hold check back to the launch clock edge (Edge 0).",
        "correct": true,
        "explanation": "Realigning the hold check eliminates 1,220 ps of bogus SDC penalty, properly verifying the 3-cycle divider datapath with +45 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 41,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Asynchronous Clock Groups Isolation Missing (`set_clock_groups -asynchronous`)",
    "severity": "CRITICAL",
    "stageName": "SDC Signoff / Clock Domain Isolation",
    "symptom": "Tempus attempts synchronous setup/hold timing checks between asynchronous USB clock (480 MHz) and PCIe clock (100 MHz), reporting 8,400 false violations.",
    "logSnippet": "[TEMPUS-SDC] Clock Pair: clk_usb_480m <-> clk_pcie_100m (No Phase Relationship in Hardware)\n[TEMPUS-SDC] Common Base Period: gcd(2.083 ns, 10.0 ns) = 41.66 ps (Impractically tight check!)\n[TEMPUS-SDC] Violations: 8,420 endpoints failing with WNS = -640.0 ps\n[TEMPUS-SDC] Cause: Missing set_clock_groups -asynchronous in SDC constraint file!",
    "principle": "Clocks derived from independent PLLs or external oscillators have unrelated frequencies and drift arbitrarily in phase. Trying to close synchronous timing across asynchronous clocks creates meaningless sub-picosecond timing checks that waste tool effort and destroy routing resources.",
    "remedyTcl": "# 1. Declare asynchronous clock domain isolation in top-level SDC\nset_clock_groups -asynchronous \\\n  -group [get_clocks {clk_core clk_cpu}] \\\n  -group [get_clocks {clk_usb_480m}] \\\n  -group [get_clocks {clk_pcie_100m}] \\\n  -group [get_clocks {clk_rtc_32k}]\n# 2. Re-evaluate timing\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Clock Group Isolation",
        "val": "Missing (Synchronous Check)"
      },
      {
        "label": "Failing Endpoints",
        "val": "8,420 false fails"
      },
      {
        "label": "WNS",
        "val": "-640.0 ps"
      },
      {
        "label": "Routing Congestion",
        "val": "High (Padding Buffers)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Group Isolation",
        "val": "set_clock_groups -asynchronous"
      },
      {
        "label": "Failing Endpoints",
        "val": "0 (Real Sync Clean)"
      },
      {
        "label": "WNS",
        "val": "+22.0 ps (MET)"
      },
      {
        "label": "Routing Congestion",
        "val": "Low (Optimized)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Add `set_clock_groups -asynchronous` in SDC to isolate unrelated clock domains.",
        "correct": true,
        "explanation": "Declaring clock groups as asynchronous stops meaningless cross-clock timing checks, immediately clearing 8,420 false violations."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 42,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Derived Generated Clock Waveform Edge-Shift & Divide-by-3 Inversion Error",
    "severity": "HIGH",
    "stageName": "SDC Signoff / Generated Clock",
    "symptom": "A divide-by-3 clock generator SDC definition lacks `-edges {1 3 7}` syntax, causing Tempus to assume a 50% duty cycle 1.5-cycle period and failing setup by -280 ps.",
    "logSnippet": "[TEMPUS-SDC] Clock: clk_div3 (Source: clk_main, Period: 1.0 ns)\n[TEMPUS-SDC] Faulty SDC: create_generated_clock -divide_by 3 -source clk_main [get_pins u_div/clk_out]\n[TEMPUS-SDC] Assumed Waveform: {0.0 1.5} (50% Duty Cycle - Does NOT match hardware RTL state machine!)\n[TEMPUS-SDC] Real RTL Waveform: 1 cycle high, 2 cycles low -> Edge Sequence: {1 3 7}\n[TEMPUS-SETUP] Slack: -280.0 ps",
    "principle": "Odd-integer clock dividers (divide-by-3, divide-by-5) implemented with asynchronous counters create asymmetric duty cycles. `create_generated_clock -divide_by N` assumes symmetric 50% duty cycle unless explicit master clock edges are specified using `-edges {E1 E2 E3}`.",
    "remedyTcl": "# 1. Correct SDC generated clock definition using explicit master clock edge transitions\ncreate_generated_clock -name clk_div3 \\\n  -source [get_pins u_pll/clk_main_out] \\\n  -edges {1 3 7} \\\n  [get_pins u_div/clk_out_reg/Q]\n# 2. Update timing graph\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Generated Clock SDC",
        "val": "-divide_by 3 (Symmetric Assumed)"
      },
      {
        "label": "High Phase Duration",
        "val": "1.5 ns (Wrong)"
      },
      {
        "label": "Setup Slack",
        "val": "-280.0 ps (FALSE FAIL)"
      },
      {
        "label": "RTL Edge Match",
        "val": "No"
      }
    ],
    "afterMetrics": [
      {
        "label": "Generated Clock SDC",
        "val": "-edges {1 3 7} (Exact Edges)"
      },
      {
        "label": "High Phase Duration",
        "val": "1.0 ns (Matches RTL)"
      },
      {
        "label": "Setup Slack",
        "val": "+35.0 ps (MET)"
      },
      {
        "label": "RTL Edge Match",
        "val": "Yes (100% Match)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Define generated clock waveform using `-edges {1 3 7}` to match the physical RTL state machine.",
        "correct": true,
        "explanation": "Specifying exact rising, falling, and cycle edges matches real hardware duty cycles, turning a -280 ps violation into +35 ps slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 43,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Virtual Clock I/O Delay Over-Constraint on External DDR Interface",
    "severity": "HIGH",
    "stageName": "SDC Signoff / I/O Constraints",
    "symptom": "An external input delay constraint of 850 ps on a 1.0 ns DDR interface leaves only 150 ps for internal chip pad-to-register logic, causing -190 ps setup failure.",
    "logSnippet": "[TEMPUS-SDC] Port: ddr_dq_in[15] (Clock: clk_ddr, Period: 1000.0 ps / 500 ps half-cycle)\n[TEMPUS-SDC] set_input_delay -max 0.850 -clock clk_v_ddr [get_ports ddr_dq_in[*]]\n[TEMPUS-SDC] Available Internal Budget: 500 ps - 850 ps = -350 ps (Impossible timing budget!)\n[TEMPUS-SDC] Board Trace Budget: Real board skew is only 120 ps, not 850 ps!",
    "principle": "Input and output delays (`set_input_delay`, `set_output_delay`) define off-chip board trace flight times and external peripheral setup/hold requirements relative to a virtual clock. Over-constraining I/O delays starves internal pad logic of timing budget.",
    "remedyTcl": "# 1. Calibrate SDC I/O delay constraints to match actual PCB board trace simulation\nset_input_delay -max 0.180 -clock clk_v_ddr [get_ports ddr_dq_in[*]]\nset_input_delay -min -0.050 -clock clk_v_ddr [get_ports ddr_dq_in[*]]\n# 2. Update timing\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Input Delay Max",
        "val": "850.0 ps (Over-constrained)"
      },
      {
        "label": "Internal Budget",
        "val": "-350.0 ps"
      },
      {
        "label": "I/O Setup Slack",
        "val": "-190.0 ps"
      },
      {
        "label": "PCB Calibration",
        "val": "Uncalibrated"
      }
    ],
    "afterMetrics": [
      {
        "label": "Input Delay Max",
        "val": "180.0 ps (PCB Matched)"
      },
      {
        "label": "Internal Budget",
        "val": "320.0 ps"
      },
      {
        "label": "I/O Setup Slack",
        "val": "+42.0 ps (MET)"
      },
      {
        "label": "PCB Calibration",
        "val": "HyperLynx Matched"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Calibrate input delay constraints from board trace SI/PI simulations (`set_input_delay -max 0.180`).",
        "correct": true,
        "explanation": "Setting realistic board flight time constraints frees 670 ps of budget, closing the external DDR interface with +42 ps margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 44,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Case Analysis Overwrite Disabling Critical Scan Test Clock Multiplexer Paths",
    "severity": "HIGH",
    "stageName": "SDC Signoff / Case Analysis",
    "symptom": "`set_case_analysis 0 [get_ports test_mode]` accidentally remains active in functional mode SDC, disabling timing checks on clock multiplexer bypass pins.",
    "logSnippet": "[TEMPUS-SDC] Command: set_case_analysis 0 [get_ports test_mode]\n[TEMPUS-SDC] Inactive Pin: u_clkmux/clk_mux_inst/B (Test clock bypass input)\n[TEMPUS-SDC] Unanalyzed Mode: test_capture view has 0 active paths!\n[TEMPUS-SDC] Signoff Risk: Scan clock path untested for setup/hold during manufacturing test!",
    "principle": "`set_case_analysis` forces constant logic values (0 or 1) on pins or ports to disable inactive operational modes (e.g. test vs functional). Applying functional case analysis to test mode views disables DFT timing checks, leading to untested silicon.",
    "remedyTcl": "# 1. Ensure separate SDC constraint modes for functional and test views in MMMC\ncreate_constraint_mode -name cm_func -sdc_files sdc_functional.sdc\ncreate_constraint_mode -name cm_test -sdc_files sdc_test_atpg.sdc\n# 2. In sdc_test_atpg.sdc, assert test mode:\n# set_case_analysis 1 [get_ports test_mode]\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Case Analysis",
        "val": "Global set_case_analysis 0"
      },
      {
        "label": "Test View Paths",
        "val": "0 paths (Unchecked Blindspot)"
      },
      {
        "label": "DFT Signoff",
        "val": "FAILED"
      },
      {
        "label": "MMMC Isolation",
        "val": "None"
      }
    ],
    "afterMetrics": [
      {
        "label": "Case Analysis",
        "val": "Mode-Specific SDC (cm_func vs cm_test)"
      },
      {
        "label": "Test View Paths",
        "val": "142,000 paths (Fully Checked)"
      },
      {
        "label": "DFT Signoff",
        "val": "PASSED"
      },
      {
        "label": "MMMC Isolation",
        "val": "Clean Separation"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Separate functional and DFT constraint modes in MMMC (`cm_func` with `test_mode=0`, `cm_test` with `test_mode=1`).",
        "correct": true,
        "explanation": "Dedicated constraint modes ensure all operational modes are fully analyzed without cross-mode constraint contamination."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 45,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Unconstrained Logic Endpoints / False Unclocked Flop Registers",
    "severity": "CRITICAL",
    "stageName": "SDC Signoff / Constraint Coverage",
    "symptom": "A newly added telemetry FSM is fed by a clock net whose source buffer has a typo in SDC, leaving 420 registers completely unclocked (unconstrained).",
    "logSnippet": "[TEMPUS-AUDIT] Command: check_timing -check_type no_clock\n[TEMPUS-AUDIT] Unconstrained Endpoints: 420 register clock pins in u_telemetry/*\n[TEMPUS-AUDIT] Warning: Register clock pin u_telemetry/fsm_reg[0]/CLK has NO CLOCK SOURCE!\n[TEMPUS-AUDIT] WNS Reported: 0.0 ps (Deceptive 'clean' report because paths are ignored!)",
    "principle": "`check_timing` is the mandatory first step in STA signoff. If a clock definition has a typo or misses a clock tree root, the tool silently ignores all downstream paths (0.0 ps slack), giving a false impression of clean timing while silicon will fail completely.",
    "remedyTcl": "# 1. Run check_timing audit to identify unclocked and unconstrained pins\ncheck_timing -check_type {no_clock unconstrained_endpoints no_input_delay}\n# 2. Fix clock root pin target in SDC\ncreate_clock -name clk_telemetry -period 2.500 [get_pins u_pll/clk_telemetry_pad]\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Unclocked Registers",
        "val": "420 registers"
      },
      {
        "label": "Timing Coverage",
        "val": "82.4% (Gaps present)"
      },
      {
        "label": "Reported WNS",
        "val": "0.0 ps (FALSE PASS)"
      },
      {
        "label": "Check Timing Audit",
        "val": "Violations found"
      }
    ],
    "afterMetrics": [
      {
        "label": "Unclocked Registers",
        "val": "0 (All Clocks Attached)"
      },
      {
        "label": "Timing Coverage",
        "val": "100.0% (Complete)"
      },
      {
        "label": "Reported WNS",
        "val": "+18.0 ps (Real Valid Slack)"
      },
      {
        "label": "Check Timing Audit",
        "val": "0 Errors Clean"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute `check_timing` audit and fix clock definition pin targets in SDC to achieve 100% timing coverage.",
        "correct": true,
        "explanation": "Fixing the clock definition brings all 420 registers under timing analysis, verifying real silicon timing with 100% coverage."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 46,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "False Paths on Static Software Configuration Registers (`set_false_path`)",
    "severity": "MEDIUM",
    "stageName": "SDC Signoff / Optimization Focus",
    "symptom": "Tempus spends 4 hours trying to close setup timing on 1,800 static control registers that are programmed once during boot and never change dynamically.",
    "logSnippet": "[TEMPUS-SDC] Path: u_csr/pll_bias_trim_reg[7:0] -> u_analog/bias_dac_inst\n[TEMPUS-SDC] Data Arrival: 1400.0 ps (WNS: -600.0 ps across 1,800 paths)\n[TEMPUS-SDC] Signal Nature: Static register written once during power-on boot sequence\n[TEMPUS-SDC] Waste: Optimizer inserting 3,200 large buffers trying to meet 1 GHz clock timing!",
    "principle": "Static configuration registers (CSRs, trim bits, mode selectors) are programmed during chip initialization while downstream blocks are held in reset. They do not toggle during normal execution and should be declared as false paths to prevent optimizer cell bloating.",
    "remedyTcl": "# 1. Set false path on static software configuration registers\nset_false_path -from [get_pins u_csr/*_cfg_reg*/Q]\nset_false_path -from [get_pins u_csr/*_trim_reg*/Q]\n# 2. Delete wasteful optimizer buffers and reclaim area/leakage\nopt_design -post_route -eco -setup",
    "beforeMetrics": [
      {
        "label": "Wasted Buffer Area",
        "val": "12,400 \u00b5m\u00b2"
      },
      {
        "label": "Wasted Leakage",
        "val": "8.4 mW"
      },
      {
        "label": "False Setup WNS",
        "val": "-600.0 ps"
      },
      {
        "label": "Static False Paths",
        "val": "Unset (Over-optimized)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Wasted Buffer Area",
        "val": "0 \u00b5m\u00b2 (Reclaimed)"
      },
      {
        "label": "Wasted Leakage",
        "val": "0 mW (Reclaimed)"
      },
      {
        "label": "False Setup WNS",
        "val": "0.0 ps (Excluded)"
      },
      {
        "label": "Static False Paths",
        "val": "set_false_path Enforced"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Declare static configuration registers as false paths (`set_false_path -from [get_pins u_csr/*_cfg_reg*/Q]`).",
        "correct": true,
        "explanation": "Eliminating false path constraints frees the optimizer, saving 12,400 \u00b5m\u00b2 of silicon area and 8.4 mW of leakage power."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 47,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Output Delay Maximum Constraint Starving Pad Driver Budget",
    "severity": "HIGH",
    "stageName": "SDC Signoff / I/O Budgeting",
    "symptom": "An output port constraint of `set_output_delay 900 ps` on a 1.0 ns clock leaves only 100 ps for the on-chip I/O pad driver and level shifter.",
    "logSnippet": "[TEMPUS-SDC] Port: pcie_tx_out[3:0] (Clock: clk_pcie, Period: 1000.0 ps)\n[TEMPUS-SDC] set_output_delay -max 0.900 -clock clk_pcie [get_ports pcie_tx_out[*]]\n[TEMPUS-SDC] Required Arrival Time: 100.0 ps\n[TEMPUS-SDC] Pad Driver Delay (PAD_TX_X16): 185.0 ps (Slack: -85.0 ps)",
    "principle": "The internal chip delay to an output port is constrained by $T_{\\text{arrival}} \\le T_{\\text{period}} - T_{\\text{output\\_delay}}$. If the external receiver setup time and board flight time are over-estimated in SDC, internal pad drivers cannot physically meet timing.",
    "remedyTcl": "# 1. Re-budget output delay constraint based on external PHY receiver specifications\nset_output_delay -max 0.450 -clock clk_pcie [get_ports pcie_tx_out[*]]\nset_output_delay -min -0.100 -clock clk_pcie [get_ports pcie_tx_out[*]]\n# 2. Update timing\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Output Delay Max",
        "val": "900.0 ps (Extreme)"
      },
      {
        "label": "Internal Budget",
        "val": "100.0 ps"
      },
      {
        "label": "Pad Slack",
        "val": "-85.0 ps"
      },
      {
        "label": "PHY Specification",
        "val": "Violated"
      }
    ],
    "afterMetrics": [
      {
        "label": "Output Delay Max",
        "val": "450.0 ps (PHY Matched)"
      },
      {
        "label": "Internal Budget",
        "val": "550.0 ps"
      },
      {
        "label": "Pad Slack",
        "val": "+36.0 ps (MET)"
      },
      {
        "label": "PHY Specification",
        "val": "Compliant"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Recalibrate output delay constraints to match the external PHY specification (`set_output_delay -max 0.450`).",
        "correct": true,
        "explanation": "Correcting external delay budgets provides 550 ps for internal pad driver switching, securing +36 ps setup margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 48,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Clock Latency Ideal Overwrite Masking Extracted CTS Delay in Signoff",
    "severity": "CRITICAL",
    "stageName": "SDC Signoff / Propagated Clock",
    "symptom": "Signoff SDC contains a leftover `set_clock_latency 0.5 [get_clocks clk_core]` command, overriding extracted post-route clock propagation delays.",
    "logSnippet": "[TEMPUS-SDC] Command in SDC: set_clock_latency 0.500 [get_clocks clk_core] (IDEAL MODE)\n[TEMPUS-SDC] Reality: Post-CTS propagated clock tree has real insertion delay of 1.15 ns and 45 ps skew\n[TEMPUS-SDC] Status: Signoff STA is running in IDEAL CLOCK mode instead of PROPAGATED mode!\n[TEMPUS-SDC] Warning: Real clock tree skews and OCV variation are completely ignored!",
    "principle": "`set_clock_latency` is used prior to CTS when clock trees are ideal. In post-CTS and post-route signoff, `set_propagated_clock [all_clocks]` MUST be active so Tempus computes real insertion delays and clock skew from extracted parasitics.",
    "remedyTcl": "# 1. Enforce propagated clock mode on all clock domains for post-CTS/signoff STA\nset_propagated_clock [all_clocks]\nremove_clock_latency [all_clocks]\n# 2. Update timing graph with real extracted clock tree parasitics\nupdate_timing -full\nreport_clock_timing -type skew",
    "beforeMetrics": [
      {
        "label": "Clock Mode",
        "val": "Ideal Latency (Fake)"
      },
      {
        "label": "Clock Skew Analyzed",
        "val": "0.0 ps (Assumed Ideal)"
      },
      {
        "label": "Signoff Validity",
        "val": "INVALID (Will fail in Fab)"
      },
      {
        "label": "Propagated Mode",
        "val": "Disabled"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Mode",
        "val": "Propagated (Real Extracted)"
      },
      {
        "label": "Clock Skew Analyzed",
        "val": "42.0 ps (Real CTS)"
      },
      {
        "label": "Signoff Validity",
        "val": "100% Golden Signoff"
      },
      {
        "label": "Propagated Mode",
        "val": "Enforced Clean"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Remove ideal latency commands and enforce `set_propagated_clock [all_clocks]` across all signoff analysis views.",
        "correct": true,
        "explanation": "Propagated clock mode enables accurate calculation of real clock insertion delays and CTS skews from extracted SPEF parasitics."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 49,
    "domainId": "mmmc_sdc_constraints",
    "domainName": "MMMC View Matrix & SDC",
    "title": "Multi-Frequency Clock Mode Switching Matrix Constraint Completeness",
    "severity": "HIGH",
    "stageName": "MMMC Signoff / Mode Matrix",
    "symptom": "An SoC operating in High-Performance Mode (1.2 GHz), Low-Power Mode (400 MHz), and Sleep Mode (32 kHz) misses hold checks in the low-power mode view.",
    "logSnippet": "[TEMPUS-MMMC] Mode Matrix: mode_fast (1.2 GHz), mode_slow (400 MHz), mode_sleep (32 kHz)\n[TEMPUS-MMMC] Configured Analysis Views: view_setup_fast, view_hold_fast (Missing view_hold_slow!)\n[TEMPUS-MMMC] Blindspot: In 400 MHz mode, voltage is lowered to 0.65V where cell delay ratios change drastically!\n[TEMPUS-HOLD] Unchecked Hold Violations in mode_slow: 38 paths failing!",
    "principle": "SoCs dynamically scale voltage and frequency (DVFS). SDC constraints and analysis views must cover all operational modes. Slow frequency modes at lower voltages alter logic-to-clock delay ratios, frequently creating hold violations that do not exist at nominal voltage.",
    "remedyTcl": "# 1. Define complete MMMC analysis view matrix covering all DVFS operational modes\ncreate_analysis_view -name view_hold_slow -constraint_mode cm_slow -delay_corner dc_ffgnp_0p65v_m40c\nset_analysis_view -setup {view_setup_fast view_setup_slow} -hold {view_hold_fast view_hold_slow view_hold_sleep}\n# 2. Optimize timing across entire mode matrix\nopt_design -post_route -eco -expanded_views",
    "beforeMetrics": [
      {
        "label": "Active MMMC Views",
        "val": "Fast Mode Views Only"
      },
      {
        "label": "DVFS Hold Coverage",
        "val": "33% (67% Blindspot)"
      },
      {
        "label": "Slow Mode Hold WNS",
        "val": "-85.0 ps (Undetected)"
      },
      {
        "label": "Silicon DVFS Yield",
        "val": "Corrupted"
      }
    ],
    "afterMetrics": [
      {
        "label": "Active MMMC Views",
        "val": "Fast + Slow + Sleep Views"
      },
      {
        "label": "DVFS Hold Coverage",
        "val": "100% (Complete Matrix)"
      },
      {
        "label": "Slow Mode Hold WNS",
        "val": "+18.0 ps (MET)"
      },
      {
        "label": "Silicon DVFS Yield",
        "val": "100% Operational"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Construct a comprehensive MMMC view matrix including fast, slow DVFS, and sleep mode constraint modes.",
        "correct": true,
        "explanation": "Full MMMC matrix coverage detects and closes low-voltage DVFS hold violations, guaranteeing safe dynamic frequency scaling in silicon."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 50,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Asynchronous Reset Deassertion Recovery Timing Violation (Setup Race)",
    "severity": "CRITICAL",
    "stageName": "Signoff STA / Recovery Check",
    "symptom": "Asynchronous master reset release edge arrives 45 ps before the active clock edge (violating recovery time of 110 ps), causing registers to wake up in undefined metastable states.",
    "logSnippet": "[TEMPUS-RECOVERY] Endpoint: u_core/fsm_state_reg[2]/RN (Asynchronous Active-Low Reset Pin)\n[TEMPUS-RECOVERY] Check Type: recovery (Setup-equivalent check on reset release)\n[TEMPUS-RECOVERY] Reset Arrival Time: 945.0 ps | Clock Arrival Time: 1000.0 ps\n[TEMPUS-RECOVERY] Recovery Time Required: 110.0 ps\n[TEMPUS-RECOVERY] Slack: 1000.0 - 945.0 - 110.0 = -55.0 ps (VIOLATED - METASTABILITY HAZARD)",
    "principle": "Recovery timing is the minimum time an asynchronous reset signal must be deasserted *before* the active clock edge arrives. Violating recovery time causes flip-flop internal bistable latches to enter metastability, corrupting initial FSM states.",
    "remedyTcl": "# 1. Insert synchronous reset bridge / reset synchronizer (2-FF chain) close to destination domain\n# 2. Buffer reset distribution tree with dedicated low-skew clock buffers (CLKBUF_X8)\neco_insert_buffer_tree -net u_pmu/rst_core_n -buffer_cell CLKBUF_X8 -max_skew 0.030\n# 3. Verify recovery timing\nreport_timing -check_type recovery -to [get_pins u_core/*_reg*/RN]",
    "beforeMetrics": [
      {
        "label": "Recovery Slack",
        "val": "-55.0 ps (FAIL)"
      },
      {
        "label": "Reset Tree Skew",
        "val": "280.0 ps"
      },
      {
        "label": "Metastability Risk",
        "val": "CRITICAL (FSM Hang)"
      },
      {
        "label": "Reset Tree Buffers",
        "val": "Standard Data Buffers"
      }
    ],
    "afterMetrics": [
      {
        "label": "Recovery Slack",
        "val": "+32.0 ps (MET)"
      },
      {
        "label": "Reset Tree Skew",
        "val": "24.0 ps (Balanced)"
      },
      {
        "label": "Metastability Risk",
        "val": "ZERO (Clean Release)"
      },
      {
        "label": "Reset Tree Buffers",
        "val": "Clock Tree Buffers"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Balance the reset distribution network using low-skew clock tree buffers (CLKBUF_X8) and ensure proper 2-FF reset synchronizers.",
        "correct": true,
        "explanation": "Treating the reset deassertion line as a clock tree reduces skew from 280 ps to 24 ps, meeting recovery time with +32 ps margin."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 51,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Asynchronous Reset Deassertion Removal Timing Violation (Hold Race)",
    "severity": "HIGH",
    "stageName": "Signoff STA / Removal Check",
    "symptom": "Reset deassertion signal changes too close after the clock edge (within 25 ps, violating removal requirement of 80 ps), causing some registers to reset for an extra cycle.",
    "logSnippet": "[TEMPUS-REMOVAL] Endpoint: u_dma/ctrl_reg[5]/RN\n[TEMPUS-REMOVAL] Check Type: removal (Hold-equivalent check on reset release)\n[TEMPUS-REMOVAL] Clock Arrival: 250.0 ps | Reset Arrival: 275.0 ps\n[TEMPUS-REMOVAL] Removal Required Time: 330.0 ps (T_removal: 80.0 ps)\n[TEMPUS-REMOVAL] Slack: 275.0 - 250.0 - 80.0 = -55.0 ps (VIOLATED)",
    "principle": "Removal timing is the minimum time an asynchronous reset signal must remain stable *after* the active clock edge. Violating removal timing causes some registers to see the reset released on Cycle N while others see it on Cycle N+1, causing catastrophic multi-register state divergence.",
    "remedyTcl": "# 1. Pad reset deassertion line with delay buffers at fast corner (ffgnp)\neco_add_repeater -pin u_dma/ctrl_reg[5]/RN -cell DLY2_X2 -margin 0.025\n# 2. Verify removal timing across all fast corners\nreport_timing -check_type removal -to [get_pins u_dma/ctrl_reg*/RN]",
    "beforeMetrics": [
      {
        "label": "Removal Slack",
        "val": "-55.0 ps (FAIL)"
      },
      {
        "label": "State Divergence Risk",
        "val": "HIGH (Cycle N vs N+1 Mismatch)"
      },
      {
        "label": "Fast Corner Delay",
        "val": "25.0 ps"
      },
      {
        "label": "Padding Buffers",
        "val": "0"
      }
    ],
    "afterMetrics": [
      {
        "label": "Removal Slack",
        "val": "+28.0 ps (MET)"
      },
      {
        "label": "State Divergence Risk",
        "val": "ZERO (Unified Release)"
      },
      {
        "label": "Fast Corner Delay",
        "val": "115.0 ps"
      },
      {
        "label": "Padding Buffers",
        "val": "1 delay cell"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Pad the reset deassertion line with delay buffers to satisfy the removal requirement across all fast corners.",
        "correct": true,
        "explanation": "Adding 90 ps of padding ensures reset remains stable past the clock edge, guaranteeing all registers exit reset synchronously on the exact same cycle."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 52,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "2-Flip-Flop Synchronizer MTBF Degradation from High-Speed Input Jitter",
    "severity": "CRITICAL",
    "stageName": "CDC Signoff / Metastability MTBF",
    "symptom": "An asynchronous 1.0 GHz input signal entering a 2-FF synchronizer exhibits a Mean Time Between Failures (MTBF) of only 4.2 hours (target: > 1,000 years).",
    "logSnippet": "[TEMPUS-CDC] Synchronizer: u_cdc/sync_ff1 -> u_cdc/sync_ff2 (LibCell: DFF_X1)\n[TEMPUS-CDC] Source Frequency: 1.0 GHz | Destination Frequency: 800 MHz\n[TEMPUS-CDC] Metastability Resolution Time Window: T_res = 1250 ps - 180 ps = 1070 ps\n[TEMPUS-CDC] Calculated MTBF: 4.2 hours (UNACCEPTABLE FOR PRODUCTION SILICON)\n[TEMPUS-CDC] Target MTBF: > 1,000,000 hours (114 years)",
    "principle": "When an asynchronous signal transitions during the setup/hold aperture of the first synchronizer flip-flop, the flip-flop enters metastability. MTBF scales exponentially with resolution time ($T_{\\text{res}}$) and transistor gain ($1/\\tau$): $\\text{MTBF} = \\frac{\\exp(T_{\\text{res}} / \\tau)}{T_0 \\cdot f_{\\text{src}} \\cdot f_{\\text{dest}}}$. Using standard flops instead of dedicated high-gain metastab-hardened cells causes rapid field failures.",
    "remedyTcl": "# 1. Swap synchronizer registers with dedicated metastability-hardened flip-flops (DFF_METASYNC)\neco_change_cell -insts {u_cdc/sync_ff1 u_cdc/sync_ff2} -lib_cell DFF_METASYNC_X4\n# 2. Restrict placement distance between FF1 and FF2 to < 10 um\nset_db [get_db insts u_cdc/sync_ff2].place_near u_cdc/sync_ff1\n# 3. Add 3rd synchronizer stage if frequency > 1 GHz\neco_add_sync_stage -inst u_cdc/sync_ff3\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Synchronizer MTBF",
        "val": "4.2 hours (FAIL)"
      },
      {
        "label": "Flop Cell Type",
        "val": "Standard DFF_X1"
      },
      {
        "label": "Flop Spacing",
        "val": "140 \u00b5m (Long Wire)"
      },
      {
        "label": "Sync Stages",
        "val": "2 stages"
      }
    ],
    "afterMetrics": [
      {
        "label": "Synchronizer MTBF",
        "val": "1.4 x 10^8 hours (16,000 yrs)"
      },
      {
        "label": "Flop Cell Type",
        "val": "DFF_METASYNC_X4"
      },
      {
        "label": "Flop Spacing",
        "val": "4.2 \u00b5m (Abutted)"
      },
      {
        "label": "Sync Stages",
        "val": "3 stages"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Upgrade to 3-stage synchronizers using dedicated high-gain `DFF_METASYNC_X4` cells placed within 5 \u00b5m of each other.",
        "correct": true,
        "explanation": "High-gain metastab-hardened flops with minimal interconnect wire delay increase MTBF from 4.2 hours to 16,000 years."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 53,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Asynchronous FIFO Gray-Code Pointer Multi-Bit Skew Violating 1-Bit Property",
    "severity": "CRITICAL",
    "stageName": "CDC Signoff / Gray Code Skew",
    "symptom": "A 6-bit read pointer bus crossing clock domains experiences 140 ps wire routing skew between bits, causing the capture domain to sample multi-bit transitions.",
    "logSnippet": "[TEMPUS-CDC] FIFO Pointer: u_fifo/rptr_gray[5:0] (Clock: clk_read -> clk_write)\n[TEMPUS-CDC] Bit 0 Arrival: 180.0 ps | Bit 5 Arrival: 320.0 ps (Inter-Bit Skew: 140.0 ps)\n[TEMPUS-CDC] Write Clock Period: 500.0 ps (2.0 GHz)\n[TEMPUS-CDC] Hazard: Write domain samples intermediate transient state (e.g. 000111 -> 000100 instead of 000101)!\n[TEMPUS-CDC] Consequence: False FIFO Full/Empty trigger or buffer overwrite!",
    "principle": "Gray code pointers guarantee that only exactly 1 bit changes per clock cycle, preventing multi-bit sampling hazards. However, if physical wire routing skew between pointer bits exceeds the capture clock period, the receiving domain can capture multiple transitioning bits simultaneously, corrupting FIFO depth tracking.",
    "remedyTcl": "# 1. Enforce max_skew constraint across all bits of the Gray-code pointer bus\nset_max_skew 0.050 -from [get_pins u_fifo/rptr_gray_reg[*]/CLK] -to [get_pins u_fifo/rptr_sync_reg[*]/D]\n# 2. Re-route pointer bus as a matched-length bundle\neco_route -nets [get_db nets u_fifo/rptr_gray[*]]\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Inter-Bit Skew",
        "val": "140.0 ps (FAIL)"
      },
      {
        "label": "Capture Period",
        "val": "500.0 ps"
      },
      {
        "label": "FIFO Integrity",
        "val": "Corrupted under load"
      },
      {
        "label": "Bus Routing",
        "val": "Unmatched Individual"
      }
    ],
    "afterMetrics": [
      {
        "label": "Inter-Bit Skew",
        "val": "18.0 ps (PASS)"
      },
      {
        "label": "Capture Period",
        "val": "500.0 ps"
      },
      {
        "label": "FIFO Integrity",
        "val": "100% Safe (1-Bit Preserved)"
      },
      {
        "label": "Bus Routing",
        "val": "Matched Length Bundle"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Constrain and route the Gray-code pointer bus as a length-matched bundle with `set_max_skew 0.050`.",
        "correct": true,
        "explanation": "Restricting inter-bit skew to 18 ps guarantees that the destination domain never samples multi-bit transitions, preserving FIFO integrity."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 54,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Clock Multiplexer Dynamic Switching Glitch During PLL Frequency Transition",
    "severity": "HIGH",
    "stageName": "Clock Signoff / Glitchless Mux",
    "symptom": "Switching from 1.0 GHz PLL clock to 100 MHz backup clock using a standard multiplexer creates an 85 ps narrow runt pulse that violates minimum pulse width.",
    "logSnippet": "[TEMPUS-CLK] Instance: u_clkmux/sel_mux (LibCell: MUX2_X4)\n[TEMPUS-CLK] Event: Select pin SEL switched while CLK0=1 and CLK1=0\n[TEMPUS-CLK] Generated Output Pulse: 85.0 ps high pulse\n[TEMPUS-CLK] Minimum Pulse Width Check: Required High = 250.0 ps (VIOLATED)\n[TEMPUS-CLK] Consequence: Downstream registers fail to latch data, triggering CPU lockup!",
    "principle": "Standard multiplexers glitch when the select line toggles while clock inputs are at different voltage levels. Glitchless clock multiplexers (with negative-edge handshake latches) must be used to ensure the old clock is fully disabled before the new clock is enabled.",
    "remedyTcl": "# 1. Replace standard mux with glitch-free clock switching cell (CLK_MUX_GLITCHFREE)\neco_change_cell -insts u_clkmux/sel_mux -lib_cell CLK_MUX_GLITCHFREE_X4\n# 2. Verify minimum pulse width checks across all transitions\nreport_min_pulse_width -all_violators",
    "beforeMetrics": [
      {
        "label": "Clock Mux Type",
        "val": "Standard MUX2_X4"
      },
      {
        "label": "Runt Pulse Generated",
        "val": "85.0 ps (Glitch)"
      },
      {
        "label": "Min Pulse Width Limit",
        "val": "250.0 ps"
      },
      {
        "label": "CPU Stability",
        "val": "Random Lockup"
      }
    ],
    "afterMetrics": [
      {
        "label": "Clock Mux Type",
        "val": "CLK_MUX_GLITCHFREE_X4"
      },
      {
        "label": "Runt Pulse Generated",
        "val": "None (Clean Switch)"
      },
      {
        "label": "Min Pulse Width Limit",
        "val": "250.0 ps (Passed)"
      },
      {
        "label": "CPU Stability",
        "val": "100% Stable"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Replace standard combinational multiplexers with specialized glitch-free clock multiplexer cells (`CLK_MUX_GLITCHFREE_X4`).",
        "correct": true,
        "explanation": "Glitch-free clock multiplexers use internal cross-coupled latches to wait for clock low phases before switching, guaranteeing zero runt pulses."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 55,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Pulse Synchronizer Minimum Pulse Width Violation on Fast-to-Slow Crossing",
    "severity": "HIGH",
    "stageName": "CDC Signoff / Pulse Synchronizer",
    "symptom": "A 1-cycle pulse generated in a 1.2 GHz clock domain (width: 833 ps) is missed by a 100 MHz capture domain (period: 10,000 ps) without pulse-stretching logic.",
    "logSnippet": "[TEMPUS-CDC] Source: u_fast_core (1.2 GHz, Pulse Width = 833.0 ps)\n[TEMPUS-CDC] Destination: u_slow_periph (100 MHz, Sample Period = 10,000.0 ps)\n[TEMPUS-CDC] Hazard: Pulse falls entirely between sampling edges of the 100 MHz clock!\n[TEMPUS-CDC] Detection Probability: < 8.5% (91.5% of interrupt events lost!)",
    "principle": "Short pulses from fast clock domains cannot be directly sampled by slow clock domains. The pulse must be converted into a level toggle (toggle synchronizer) or held until an acknowledgment handshake returns from the slow domain.",
    "remedyTcl": "# 1. Replace direct pulse synchronizer with a Toggle-Handshake Pulse Synchronizer\n# 2. Synthesize CDC handshake wrapper in RTL and ECO update\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Pulse Capture Rate",
        "val": "8.5% (91.5% Lost Events)"
      },
      {
        "label": "CDC Architecture",
        "val": "Direct Sampling"
      },
      {
        "label": "Pulse Width",
        "val": "833.0 ps"
      },
      {
        "label": "Sample Period",
        "val": "10,000.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Pulse Capture Rate",
        "val": "100.0% (Zero Loss)"
      },
      {
        "label": "CDC Architecture",
        "val": "Toggle-Handshake Sync"
      },
      {
        "label": "Pulse Width",
        "val": "Held until Acknowledge"
      },
      {
        "label": "Sample Period",
        "val": "10,000.0 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Implement a Toggle-Handshake pulse synchronizer to guarantee 100% capture of fast-domain pulses by slow-domain clocks.",
        "correct": true,
        "explanation": "Converting pulses to level transitions ensures the slow clock domain reliably detects every event regardless of frequency disparity."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 56,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Combinational Logic on Clock Domain Crossing Boundary (Glitch Sampling)",
    "severity": "HIGH",
    "stageName": "CDC Signoff / Combinational Glitch",
    "symptom": "An asynchronous crossing path contains an AND gate before entering the synchronizer flip-flop, allowing combinational glitches to trigger false state changes.",
    "logSnippet": "[TEMPUS-CDC] Path: u_src/reg_a/Q & u_src/reg_b/Q -> u_dst/sync_ff1/D\n[TEMPUS-CDC] Violation: Combinational gate (AND2_X1) placed directly on CDC crossing line!\n[TEMPUS-CDC] Hazard: Dynamic hazards and glitches on the AND output will be captured as valid logic pulses by the synchronizer!",
    "principle": "Asynchronous CDC signals must ALWAYS be launched directly from a clean register output ($Q$) with NO intervening combinational logic. Combinational gates glitch due to input arrival skews, and synchronizers cannot distinguish glitches from real data transitions.",
    "remedyTcl": "# 1. Relocate combinational AND gate to source domain before launch register\n# 2. Connect register Q directly to destination synchronizer D pin\neco_rewire_net -from u_src/clean_launch_reg/Q -to u_dst/sync_ff1/D\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "CDC Boundary Logic",
        "val": "Combinational AND Gate"
      },
      {
        "label": "Glitch Susceptibility",
        "val": "HIGH (False Triggers)"
      },
      {
        "label": "Launch Source",
        "val": "Unregistered Mux/Gate"
      },
      {
        "label": "CDC Lint Status",
        "val": "FATAL VIOLATION"
      }
    ],
    "afterMetrics": [
      {
        "label": "CDC Boundary Logic",
        "val": "Direct Register Q -> D"
      },
      {
        "label": "Glitch Susceptibility",
        "val": "ZERO (Glitch-Free)"
      },
      {
        "label": "Launch Source",
        "val": "Registered Flip-Flop"
      },
      {
        "label": "CDC Lint Status",
        "val": "CLEAN PASSED"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Relocate combinational logic inside the source domain and launch CDC signals directly from a registered flip-flop output.",
        "correct": true,
        "explanation": "Registering the signal before crossing eliminates combinational glitches, guaranteeing clean binary inputs to the synchronizer."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 57,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Asynchronous Clear vs Preset Simultaneous Assertion Hazard",
    "severity": "MEDIUM",
    "stageName": "Signoff STA / Recovery-Removal Conflict",
    "symptom": "A dual-function register receives asynchronous Clear (CLR) and Preset (PRE) simultaneously during power transition, putting the internal latch in an indeterminate state.",
    "logSnippet": "[TEMPUS-CDC] Instance: u_fsm/state_dual_reg (LibCell: DFF_PRE_CLR_X2)\n[TEMPUS-CDC] Event: Power-on reset asserts CLR=0 and PRE=0 at the same time\n[TEMPUS-CDC] Violation: Simultaneous assertion of active-low Clear and Preset is forbidden by cell Liberty table!\n[TEMPUS-CDC] Result: Q and QN outputs both go high; release leads to unpredictable state!",
    "principle": "Flip-flops with both asynchronous Clear and Preset pins have forbidden input states ($CLR=0$ and $PRE=0$ active concurrently). Power management logic must enforce priority (e.g. Clear dominant) to prevent undefined hardware states.",
    "remedyTcl": "# 1. Enforce Clear priority logic in RTL and insert discrete gate ECO\neco_change_cell -insts u_fsm/state_dual_reg -lib_cell DFF_CLR_X2\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Flop Type",
        "val": "Dual Pre/Clr (Hazardous)"
      },
      {
        "label": "Simultaneous Assert",
        "val": "Possible"
      },
      {
        "label": "Output Determinism",
        "val": "Indeterminate"
      },
      {
        "label": "Power-On Reliability",
        "val": "Unsafe"
      }
    ],
    "afterMetrics": [
      {
        "label": "Flop Type",
        "val": "Single Clear-Dominant"
      },
      {
        "label": "Simultaneous Assert",
        "val": "Prevented by Logic"
      },
      {
        "label": "Output Determinism",
        "val": "100% Deterministic"
      },
      {
        "label": "Power-On Reliability",
        "val": "100% Safe"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Replace dual-control registers with Clear-dominant flip-flops to prevent simultaneous assert conditions.",
        "correct": true,
        "explanation": "Eliminating the simultaneous assertion hazard ensures predictable, deterministic power-on state machine initialization."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 58,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Synchronizer Placement Distance Latency Penalty (Excessive Inter-Flop Delay)",
    "severity": "MEDIUM",
    "stageName": "Physical CDC / Synchronizer Placement",
    "symptom": "The two flip-flops of a 2-FF synchronizer were placed 850 \u00b5m apart by the placer, adding 320 ps of wire RC delay and severely degrading MTBF resolution time.",
    "logSnippet": "[TEMPUS-CDC] Synchronizer: u_cdc/sync_ff1 -> u_cdc/sync_ff2\n[TEMPUS-CDC] Physical Distance: 850.0 um (Separated across macro blocks!)\n[TEMPUS-CDC] Interconnect Wire Delay: 320.0 ps (Eats into MTBF resolution window!)\n[TEMPUS-CDC] Available Resolution Time: 1250 ps - 320 ps = 930 ps (MTBF degraded by 100x)",
    "principle": "Synchronizer flip-flops must be placed immediately adjacent to each other (abutted or < 10 \u00b5m distance). Long wire delay between FF1 and FF2 directly reduces the available time for FF1 to resolve out of metastability before FF2 samples it.",
    "remedyTcl": "# 1. Constrain synchronizer flops into an abutted placement cluster\nset_db [get_db insts u_cdc/sync_ff2].place_near u_cdc/sync_ff1\nset_db [get_db insts u_cdc/sync_ff1].is_dont_touch true\n# 2. Legalize placement and re-route\neco_place\neco_route",
    "beforeMetrics": [
      {
        "label": "Flop Separation",
        "val": "850.0 \u00b5m"
      },
      {
        "label": "Inter-Flop Delay",
        "val": "320.0 ps"
      },
      {
        "label": "Resolution Window",
        "val": "930.0 ps"
      },
      {
        "label": "MTBF Degradation",
        "val": "100x worse"
      }
    ],
    "afterMetrics": [
      {
        "label": "Flop Separation",
        "val": "3.5 \u00b5m (Abutted)"
      },
      {
        "label": "Inter-Flop Delay",
        "val": "8.0 ps"
      },
      {
        "label": "Resolution Window",
        "val": "1,242.0 ps"
      },
      {
        "label": "MTBF Degradation",
        "val": "Zero (Optimal MTBF)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Group synchronizer flip-flops into dedicated placement clusters with `< 10 um` separation.",
        "correct": true,
        "explanation": "Abutting synchronizer flops reduces inter-flop wire delay from 320 ps to 8 ps, maximizing metastability resolution time and boosting MTBF by 100x."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 59,
    "domainId": "cdc_reset_timing",
    "domainName": "CDC & Asynchronous Resets",
    "title": "Clock Jitter and Skew on Asynchronous FIFO Gray Pointer Comparators",
    "severity": "HIGH",
    "stageName": "CDC Signoff / Pointer Comparison",
    "symptom": "Clock jitter on the FIFO read clock causes the almost-empty flag comparator to glitch, triggering illegal burst reads from an empty FIFO.",
    "logSnippet": "[TEMPUS-CDC] Comparator: u_fifo/almost_empty_comp (Combinational Gray Comparator)\n[TEMPUS-CDC] Read Clock Jitter: 35.0 ps | Inter-Pointer Wire Skew: 45.0 ps\n[TEMPUS-CDC] Hazard: Glitch on almost_empty flag sampled by read DMA controller\n[TEMPUS-CDC] Result: Underflow read from empty memory buffer!",
    "principle": "FIFO status flags (Full, Empty, Almost Empty) generated from cross-domain Gray code pointer comparisons must be registered synchronously in their respective domains before being used to drive DMA read/write enable lines.",
    "remedyTcl": "# 1. Add synchronous output registering stage on all FIFO status flags\n# 2. Verify glitch-free status generation in Tempus\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Status Flag Output",
        "val": "Unregistered Combinational"
      },
      {
        "label": "Glitch Sampling Risk",
        "val": "HIGH (Underflow Hazard)"
      },
      {
        "label": "DMA Stability",
        "val": "Corrupted"
      },
      {
        "label": "FIFO Design",
        "val": "Unsafe"
      }
    ],
    "afterMetrics": [
      {
        "label": "Status Flag Output",
        "val": "Synchronously Registered"
      },
      {
        "label": "Glitch Sampling Risk",
        "val": "ZERO (Glitch-Free)"
      },
      {
        "label": "DMA Stability",
        "val": "100% Reliable"
      },
      {
        "label": "FIFO Design",
        "val": "Production Robust"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Register all FIFO status flags synchronously before presenting them to DMA controllers.",
        "correct": true,
        "explanation": "Synchronously registering status flags isolates combinational pointer comparator glitches, guaranteeing robust underflow protection."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 60,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Tempus-Innovus Closed-Loop Signoff ECO Timing Closure Automation",
    "severity": "CRITICAL",
    "stageName": "Signoff ECO / Closed Loop Flow",
    "symptom": "Post-route timing shows -125 ps setup WNS across 380 endpoints; running the automated Tempus-Innovus ECO loop closes timing without manual scripting.",
    "logSnippet": "[TEMPUS-ECO] Integrated Signoff ECO Flow Active\n[TEMPUS-ECO] Initial Signoff Metrics: Setup WNS = -125.0 ps, Hold WNS = -65.0 ps, Max Tran Violators = 14\n[TEMPUS-ECO] Generating Non-Disruptive Physical ECO Patch: 142 cell upsizes, 28 hold buffer insertions\n[TEMPUS-ECO] Output Script: eco_patch_signoff.tcl (Forward-annotated to Innovus)",
    "principle": "The Tempus-Innovus closed-loop ECO flow uses signoff STA engines to generate surgical physical changes (cell swaps, pin swaps, localized buffer insertions) that are applied directly in Innovus without disrupting existing clean routing.",
    "remedyTcl": "# 1. Execute automated signoff timing ECO in Tempus\nset_db eco_opt_speed_effort high\nset_db eco_opt_fix_setup true\nset_db eco_opt_fix_hold true\nset_db eco_opt_fix_drc true\nopt_design -post_route -eco -expanded_views\n# 2. Export golden ECO script for Innovus layout implementation\nwrite_eco_opt_db -dir ./eco_signoff_output",
    "beforeMetrics": [
      {
        "label": "Initial Setup WNS",
        "val": "-125.0 ps"
      },
      {
        "label": "Initial Hold WNS",
        "val": "-65.0 ps"
      },
      {
        "label": "DRC Violations",
        "val": "14 slew violators"
      },
      {
        "label": "ECO Mode",
        "val": "Manual (Slow)"
      }
    ],
    "afterMetrics": [
      {
        "label": "Final Setup WNS",
        "val": "+15.0 ps (MET)"
      },
      {
        "label": "Final Hold WNS",
        "val": "+18.0 ps (MET)"
      },
      {
        "label": "DRC Violations",
        "val": "0 (Clean)"
      },
      {
        "label": "ECO Mode",
        "val": "Automated Closed-Loop"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run the integrated Tempus-Innovus closed-loop ECO flow (`opt_design -post_route -eco -expanded_views`) and export the golden layout patch.",
        "correct": true,
        "explanation": "The closed-loop ECO engine performs multi-corner setup, hold, and DRC optimization simultaneously, achieving full timing closure (+15 ps setup, +18 ps hold)."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 61,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Size-Only Standard Cell Swap ECO (Zero Placement & Routing Disturbance)",
    "severity": "HIGH",
    "stageName": "Signoff ECO / Size Only",
    "symptom": "A critical setup violation (-85 ps) is fixed by swapping gate drive strengths (INV_X2 -> INV_X8) on exact matching footprints with zero wire re-routing.",
    "logSnippet": "[TEMPUS-ECO] Target Cell: u_core/u_alu/mult_stage2 (LibCell: AND2_X2)\n[TEMPUS-ECO] Selected Replacement: AND2_X8 (Footprint: AND2_FP1 - Exact same width and pin locations!)\n[TEMPUS-ECO] Placement Disturbance: 0.0 um (In-place cell replacement)\n[TEMPUS-ECO] Routing Disturbance: 0 wires ripped up!\n[TEMPUS-ECO] Recovered Delay: 98.0 ps (Setup Slack: +13.0 ps)",
    "principle": "Size-only ECO replaces standard cells with footprint-compatible equivalents of different drive strengths or Vt types. Because cell boundaries and pin geometries match perfectly, timing is fixed with zero placement legalization or wire ripping.",
    "remedyTcl": "# 1. Execute size-only in-place standard cell swap in Tempus\neco_change_cell -insts u_core/u_alu/mult_stage2 -lib_cell AND2_X8 -in_place\n# 2. Verify DRC and timing closure\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Placement Disturbance",
        "val": "0 \u00b5m\u00b2 (Zero)"
      },
      {
        "label": "Rerouted Wires",
        "val": "0 nets (Zero)"
      },
      {
        "label": "Setup Slack",
        "val": "-85.0 ps"
      },
      {
        "label": "ECO Type",
        "val": "Size-Only In-Place"
      }
    ],
    "afterMetrics": [
      {
        "label": "Placement Disturbance",
        "val": "0 \u00b5m\u00b2 (Zero)"
      },
      {
        "label": "Rerouted Wires",
        "val": "0 nets (Zero)"
      },
      {
        "label": "Setup Slack",
        "val": "+13.0 ps (MET)"
      },
      {
        "label": "ECO Type",
        "val": "Size-Only In-Place"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Perform a size-only in-place cell swap (`eco_change_cell -in_place`) to upgrade drive strength without moving layout objects.",
        "correct": true,
        "explanation": "Size-only ECO fixes the 85 ps timing violation in-place with zero routing disruption and zero DRC risk."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 62,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Multi-Corner Leakage Power Recovery on Positive Slack Paths (HVT Swapping)",
    "severity": "HIGH",
    "stageName": "Signoff ECO / Leakage Recovery",
    "symptom": "Post-route design has 45,000 gates on paths with > 200 ps positive setup slack; swapping them from LVT to HVT recovers 38% leakage power with zero timing degradation.",
    "logSnippet": "[TEMPUS-PWR] Candidate Gates with Positive Slack (> 150 ps across all views): 45,280 cells\n[TEMPUS-PWR] Swapping Candidate LVT/ULVT Cells to HVT/SVT Footprint Equivalents\n[TEMPUS-PWR] Total Leakage Power Saved: 42.5 mW (38.2% Reduction!)\n[TEMPUS-PWR] Final Setup WNS: +18.0 ps | Final Hold WNS: +15.0 ps (Zero Violations Introduced)",
    "principle": "After closing setup and hold timing, paths with excess positive slack consume unnecessary leakage power. The Tempus leakage recovery engine swaps non-critical cells to High-Vt (HVT) variants while preserving positive timing margins across all MMMC views.",
    "remedyTcl": "# 1. Execute multi-corner leakage recovery ECO with minimum slack guardband\nset_db eco_opt_leakage_slack_margin 0.050\nopt_leakage_power -post_route -eco -expanded_views\n# 2. Report updated power and timing\nreport_power\nreport_timing -max_paths 10",
    "beforeMetrics": [
      {
        "label": "Total Leakage Power",
        "val": "111.2 mW"
      },
      {
        "label": "HVT Cell Ratio",
        "val": "42.0%"
      },
      {
        "label": "Setup WNS",
        "val": "+18.0 ps"
      },
      {
        "label": "Power Recovery",
        "val": "Unoptimized"
      }
    ],
    "afterMetrics": [
      {
        "label": "Total Leakage Power",
        "val": "68.7 mW (38% Saved)"
      },
      {
        "label": "HVT Cell Ratio",
        "val": "74.5%"
      },
      {
        "label": "Setup WNS",
        "val": "+18.0 ps (Maintained)"
      },
      {
        "label": "Power Recovery",
        "val": "Completed Clean"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Run multi-corner leakage power recovery (`opt_leakage_power -post_route -eco`) with a 50 ps safety slack guardband.",
        "correct": true,
        "explanation": "Leakage recovery swaps 45,000 non-critical gates to HVT, cutting leakage power by 38% while strictly maintaining positive timing slack."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 63,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Metal-Only Spare Cell Functional Patch ECO (Post-Mask Base Layer Freeze)",
    "severity": "CRITICAL",
    "stageName": "Signoff ECO / Metal Only ECO",
    "symptom": "A silicon bug in an interrupt decoder is fixed post-mask using pre-placed spare gate cells (SPARE_NAND, SPARE_INV) by modifying only upper metal layers M2\u2013M4.",
    "logSnippet": "[TEMPUS-ECO] ECO Mode: Metal-Only ECO (Base layers FEOL frozen; BEOL metal masks active)\n[TEMPUS-ECO] Mapping Logic Patch into Pre-Placed Spare Cell Library:\n[TEMPUS-ECO] Allocated: u_spare_inst_48 (NAND2), u_spare_inst_92 (INV_X2)\n[TEMPUS-ECO] Base Silicon Mask Cost Saved: $1,800,000 (FEOL masks untouched!)\n[TEMPUS-ECO] Turnaround Time: 12 days (vs 3 months for full mask re-spin)",
    "principle": "When silicon bugs are discovered after base masks are fabricated, metal-only ECO rewires existing uncommitted 'spare cells' distributed throughout the die, avoiding expensive base layer (FEOL) mask re-manufacturing.",
    "remedyTcl": "# 1. Map functional patch netlist into pre-instantiated spare cell instances\neco_map_spare_cells -netlist patch_logic.v -spare_instances [get_db insts *spare*]\n# 2. Route spare cell connections on available metal layers\neco_route -freeze_base_layers true\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Mask Re-spin Cost",
        "val": "$2.2M (Full Mask Set)"
      },
      {
        "label": "Turnaround Time",
        "val": "14 weeks"
      },
      {
        "label": "ECO Type",
        "val": "Full Silicon Re-spin"
      },
      {
        "label": "Base Layers",
        "val": "Modified"
      }
    ],
    "afterMetrics": [
      {
        "label": "Mask Re-spin Cost",
        "val": "$400k (Metal Masks Only)"
      },
      {
        "label": "Turnaround Time",
        "val": "2 weeks"
      },
      {
        "label": "ECO Type",
        "val": "Metal-Only Spare Cell"
      },
      {
        "label": "Base Layers",
        "val": "100% Frozen (Untouched)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Map the functional patch into pre-placed spare cells (`eco_map_spare_cells`) with frozen base layers.",
        "correct": true,
        "explanation": "Metal-only spare cell ECO fixes the functional bug using only metal mask changes, saving $1.8M and 12 weeks of schedule delay."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 64,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Non-Disruptive Buffer Insertion on Legal Free Placement Sites",
    "severity": "MEDIUM",
    "stageName": "Signoff ECO / Buffer Insertion",
    "symptom": "Inserting 18 hold buffers into a 92% dense core requires intelligent placement on legal free sites to avoid displacing surrounding critical gates.",
    "logSnippet": "[TEMPUS-ECO] Action: Insert 18 DLY_X2 cells for hold signoff\n[TEMPUS-ECO] Core Placement Density: 92.4% (Dense Core)\n[TEMPUS-ECO] Search Algorithm: Nearest legal site within 15 um radius\n[TEMPUS-ECO] Placement Displacements of Adjacent Gates: ZERO (Found natural whitespace sites)",
    "principle": "In high-density designs (>90% utilization), inserting hold buffers carelessly causes the placer to displace adjacent gates, potentially creating new setup violations. Tempus ECO searches for valid whitespace sites without moving surrounding instances.",
    "remedyTcl": "# 1. Insert hold buffers restricted to available empty placement sites\neco_add_repeater -net [get_db nets u_pipe/fast_net*] -cell DLY2_X2 -find_nearest_site true\n# 2. Re-route local connections only\neco_route -local_only\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "Displaced Cells",
        "val": "84 cells (Placer Ripple)"
      },
      {
        "label": "New Setup Violations",
        "val": "-45.0 ps created"
      },
      {
        "label": "Hold Slack",
        "val": "0.0 ps"
      },
      {
        "label": "Site Search",
        "val": "Unconstrained"
      }
    ],
    "afterMetrics": [
      {
        "label": "Displaced Cells",
        "val": "0 cells (Zero Displacement)"
      },
      {
        "label": "New Setup Violations",
        "val": "0 ps (Setup Intact)"
      },
      {
        "label": "Hold Slack",
        "val": "+22.0 ps (MET)"
      },
      {
        "label": "Site Search",
        "val": "Legal Empty Sites"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Insert hold buffers restricted to legal whitespace sites (`eco_add_repeater -find_nearest_site true`).",
        "correct": true,
        "explanation": "Zero-displacement buffer insertion avoids disrupting adjacent cells, fixing hold timing without creating setup regressions."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 65,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Signoff Slack Histogram Kurtosis & Outlier Path Debugging",
    "severity": "MEDIUM",
    "stageName": "Signoff Reporting / Histogram Debug",
    "symptom": "A timing slack histogram displays a normal Gaussian distribution of 800,000 paths centered at +120 ps, with 3 isolated extreme outlier paths at -450 ps.",
    "logSnippet": "[TEMPUS-HIST] Total Analyzed Endpoints: 840,000\n[TEMPUS-HIST] Gaussian Peak: Mean Slack = +125.0 ps, Std Dev = 28.0 ps\n[TEMPUS-HIST] Outlier Population: 3 paths with Slack = -450.0 ps (Far outside 6-sigma distribution!)\n[TEMPUS-HIST] Diagnosis: Outliers are unconstrained multi-cycle paths or false clock crossings, NOT real physical bottlenecks!",
    "principle": "Isolated extreme outlier paths that sit far outside the standard Gaussian distribution of the rest of the design almost always indicate SDC constraint bugs (missing MCPs or false paths) rather than real physical layout problems.",
    "remedyTcl": "# 1. Generate signoff slack histogram to isolate statistical outlier paths\nreport_timing_summary -histogram\n# 2. Inspect root cause of isolated outlier endpoints\nreport_timing -to [get_pins u_fsm/outlier_reg/D] -path_type full_clock",
    "beforeMetrics": [
      {
        "label": "Outlier Endpoints",
        "val": "3 paths at -450 ps"
      },
      {
        "label": "Diagnosis",
        "val": "Assumed Physical Bottleneck"
      },
      {
        "label": "Engineers Effort",
        "val": "Wasted on Layout Tweaks"
      },
      {
        "label": "SDC Cleanliness",
        "val": "Uninspected"
      }
    ],
    "afterMetrics": [
      {
        "label": "Outlier Endpoints",
        "val": "0 (Classified as False Path)"
      },
      {
        "label": "Diagnosis",
        "val": "SDC Constraint Bug (Resolved)"
      },
      {
        "label": "Engineers Effort",
        "val": "5-Minute SDC Fix"
      },
      {
        "label": "SDC Cleanliness",
        "val": "100% Verified"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Generate slack histograms (`report_timing_summary -histogram`) to identify statistical outliers and audit their SDC constraints.",
        "correct": true,
        "explanation": "Histogram analysis instantly reveals that the 3 outlier paths are missing false path declarations, preventing wasted weeks of physical redesign."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 66,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Automated Golden ECO Script Generation (`write_eco_opt_db` / `write_eco_script`)",
    "severity": "HIGH",
    "stageName": "Signoff ECO / Script Export",
    "symptom": "Exporting validated multi-corner Tempus ECO remediation commands into standard Tcl format for version control and automated Innovus replay.",
    "logSnippet": "[TEMPUS-ECO] Command: write_eco_opt_db -dir ./eco_signoff_r1\n[TEMPUS-ECO] Exporting Changes:\n[TEMPUS-ECO] - eco_change_cell: 114 instances\n[TEMPUS-ECO] - eco_add_repeater: 32 buffers\n[TEMPUS-ECO] - eco_swap_pins: 18 gates\n[TEMPUS-ECO] Verification Checksum: Hash matching layout database state.",
    "principle": "Signoff ECO changes must be captured in clean, reproducible, version-controlled Tcl scripts that can be seamlessly replayed in Innovus, Def, and Verilog netlists without interactive manual edits.",
    "remedyTcl": "# 1. Export clean golden ECO Tcl script from Tempus\nwrite_eco_opt_db -dir ./eco_signoff_r1 -format {tcl text}\n# 2. Replay script in Cadence Innovus for final DEF generation\n# innovus -files ./eco_signoff_r1/eco_changes.tcl",
    "beforeMetrics": [
      {
        "label": "ECO Handover",
        "val": "Manual interactive edits"
      },
      {
        "label": "Reproducibility",
        "val": "Poor (Human Error Risk)"
      },
      {
        "label": "Audit Trail",
        "val": "None"
      },
      {
        "label": "Checksum",
        "val": "Unverified"
      }
    ],
    "afterMetrics": [
      {
        "label": "ECO Handover",
        "val": "Automated write_eco_opt_db"
      },
      {
        "label": "Reproducibility",
        "val": "100% Deterministic Replay"
      },
      {
        "label": "Audit Trail",
        "val": "Git Version Controlled"
      },
      {
        "label": "Checksum",
        "val": "SHA-256 Matched"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Export ECO modifications via `write_eco_opt_db` to produce a version-controlled, replayable golden Tcl script.",
        "correct": true,
        "explanation": "Standardized ECO script export ensures deterministic, error-free layout updates in Innovus with full engineering change order traceability."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 67,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Multi-Corner Setup & Hold Signoff Quality Metric Report Generation (`report_signoff`)",
    "severity": "HIGH",
    "stageName": "Signoff Reporting / Quality Metrics",
    "symptom": "Generating the executive signoff package covering all 16 MMMC views with zero WNS violations, zero max-transition violations, and zero glitch violations.",
    "logSnippet": "[TEMPUS-SIGNOFF] ========================================================\n[TEMPUS-SIGNOFF] CADENCE TEMPUS TIMING SIGNOFF EXECUTIVE SUMMARY\n[TEMPUS-SIGNOFF] ========================================================\n[TEMPUS-SIGNOFF] Total Analyzed Views: 16 MMMC Views\n[TEMPUS-SIGNOFF] Setup WNS: +0.015 ns (MET) | Setup TNS: 0.000 ns (MET)\n[TEMPUS-SIGNOFF] Hold WNS:  +0.018 ns (MET) | Hold TNS:  0.000 ns (MET)\n[TEMPUS-SIGNOFF] Max Transition Violators: 0 | Max Cap Violators: 0\n[TEMPUS-SIGNOFF] SI Glitch Violations: 0 | Recovery/Removal: CLEAN\n[TEMPUS-SIGNOFF] STATUS: 100% GOLDEN SIGN-OFF COMPLETE FOR TAPE-OUT!",
    "principle": "The final signoff report proves to foundry fabrication teams and management that all electrical DRC rules, multi-corner setup/hold constraints, signal integrity glitches, and clock domain crossings are 100% clean.",
    "remedyTcl": "# 1. Generate full signoff quality metrics package\nreport_signoff -dir ./signoff_final_reports\n# 2. Verify all checks pass without waivers\ncheck_timing_signoff -summary",
    "beforeMetrics": [
      {
        "label": "Signoff Status",
        "val": "Incomplete (Unverified Views)"
      },
      {
        "label": "Report Quality",
        "val": "Ad-hoc Text Logs"
      },
      {
        "label": "Foundry Signoff",
        "val": "Rejected"
      },
      {
        "label": "Tapeout Readiness",
        "val": "0%"
      }
    ],
    "afterMetrics": [
      {
        "label": "Signoff Status",
        "val": "100% COMPLETE & VERIFIED"
      },
      {
        "label": "Report Quality",
        "val": "Golden Executive Package"
      },
      {
        "label": "Foundry Signoff",
        "val": "Approved for Mask Fab"
      },
      {
        "label": "Tapeout Readiness",
        "val": "100% Ready"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Generate the complete executive signoff metrics package (`report_signoff -dir ./signoff_final_reports`).",
        "correct": true,
        "explanation": "The golden executive signoff package formally validates all 16 MMMC views, certifying the chip 100% ready for silicon tapeout."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 68,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Pad-Limited I/O Ring Timing ECO & High-Speed SerDes Channel Compensation",
    "severity": "HIGH",
    "stageName": "Signoff ECO / I/O Ring",
    "symptom": "A 10 Gbps SerDes transmitter pad exhibits 35 ps transition degradation due to ESD protection diode capacitance, requiring pre-emphasis driver ECO.",
    "logSnippet": "[TEMPUS-IO] Port: serdes_tx_p / serdes_tx_n (10.0 Gbps PAM4 / NRZ)\n[TEMPUS-IO] ESD Diode Parasitic Capacitance: 180.0 fF\n[TEMPUS-IO] Output Eye Opening: 42% (Degraded by Pad Slew)\n[TEMPUS-IO] ECO Remediation: Enable programmable TX pre-emphasis driver cell (PAD_SERDES_PRE_X8)",
    "principle": "High-speed I/O pads suffer bandwidth limitation from on-chip ESD diodes and package lead inductances. Signoff ECO configures programmable pre-emphasis and de-emphasis driver cells to open the receiver eye diagram.",
    "remedyTcl": "# 1. Enable programmable pre-emphasis on SerDes output pad cell\neco_change_cell -insts u_pad/serdes_tx_pad -lib_cell PAD_SERDES_PRE_X8\n# 2. Update I/O channel timing\nupdate_timing -full",
    "beforeMetrics": [
      {
        "label": "TX Eye Opening",
        "val": "42% (Marginal)"
      },
      {
        "label": "Pad Slew",
        "val": "145.0 ps"
      },
      {
        "label": "ESD Parasitic Cap",
        "val": "180.0 fF"
      },
      {
        "label": "Pre-Emphasis",
        "val": "Disabled"
      }
    ],
    "afterMetrics": [
      {
        "label": "TX Eye Opening",
        "val": "88% (Wide Open Clean)"
      },
      {
        "label": "Pad Slew",
        "val": "42.0 ps"
      },
      {
        "label": "ESD Parasitic Cap",
        "val": "Compensated"
      },
      {
        "label": "Pre-Emphasis",
        "val": "Active (6 dB Boost)"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Upgrade the I/O driver to a programmable pre-emphasis cell (`PAD_SERDES_PRE_X8`) to compensate for ESD capacitance.",
        "correct": true,
        "explanation": "Pre-emphasis high-frequency boost sharpens transitions to 42 ps and opens the output eye diagram to 88% width."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  },
  {
    "id": 69,
    "domainId": "eco_timing_signoff",
    "domainName": "Automated Timing ECO & Signoff",
    "title": "Post-Route Tapeout Signoff Checklist Verification & Multi-Tool SPEF Correlation",
    "severity": "HIGH",
    "stageName": "Signoff Verification / Correlation",
    "symptom": "Correlating Tempus signoff STA results with Innovus internal timer to ensure < 1.0% timing correlation prior to GDSII stream-out.",
    "logSnippet": "[TEMPUS-CORR] Tool 1: Cadence Innovus Post-Route Timer | Tool 2: Cadence Tempus Signoff STA\n[TEMPUS-CORR] Parasitic SPEF Source: Quantus QRC Golden Extraction\n[TEMPUS-CORR] Total Endpoints Correlated: 840,000\n[TEMPUS-CORR] Maximum Delay Discrepancy: 1.2 ps (0.18% Correlation Error - EXCELLENT CORRELATION)\n[TEMPUS-CORR] Signoff Gate PASSED: Design certified ready for GDSII tapeout generation.",
    "principle": "Before tapeout, design teams correlate the physical design timer (Innovus) against the signoff timer (Tempus) using golden Quantus SPEF parasitics. Correlation discrepancies under 1% guarantee that layout optimizations strictly match signoff timing.",
    "remedyTcl": "# 1. Run multi-tool timing correlation check\ncheck_timing_correlation -reference_tool innovus -spef_file quantus_signoff.spef.gz\n# 2. Final signoff validation\nreport_timing -max_paths 10",
    "beforeMetrics": [
      {
        "label": "Correlation Error",
        "val": "4.8% (Uncalibrated)"
      },
      {
        "label": "SPEF Consistency",
        "val": "Different extraction engines"
      },
      {
        "label": "Tapeout Gate",
        "val": "Blocked"
      },
      {
        "label": "Timing Delta",
        "val": "35.0 ps"
      }
    ],
    "afterMetrics": [
      {
        "label": "Correlation Error",
        "val": "0.18% (Golden Matched)"
      },
      {
        "label": "SPEF Consistency",
        "val": "Quantus QRC Unified"
      },
      {
        "label": "Tapeout Gate",
        "val": "APPROVED"
      },
      {
        "label": "Timing Delta",
        "val": "1.2 ps"
      }
    ],
    "options": [
      {
        "id": "a",
        "label": "Execute multi-tool SPEF correlation (`check_timing_correlation`) to verify < 1% timing delta between Innovus and Tempus.",
        "correct": true,
        "explanation": "Achieving 0.18% golden correlation between PnR and signoff STA certifies the layout 100% verified for GDSII stream-out."
      },
      {
        "id": "b",
        "label": "Increase clock uncertainty constraint by 500 ps to force mathematical timing closure.",
        "correct": false,
        "explanation": "Artificially increasing clock uncertainty tightens timing constraints instead of solving physical electrical delay."
      },
      {
        "id": "c",
        "label": "Set false_path on all failing paths to hide violations from signoff reports.",
        "correct": false,
        "explanation": "Applying false_path on real functional paths creates false clean reports, guaranteeing hardware silicon failure."
      },
      {
        "id": "d",
        "label": "Disable multi-corner analysis and only inspect typical nominal voltage at 25\u00b0C.",
        "correct": false,
        "explanation": "Disabling corner analysis leaves severe cold-temperature and low-voltage timing blindspots."
      }
    ]
  }
];
