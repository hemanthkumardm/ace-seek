export interface VoltusScenarioOption {
  id: string;
  label: string;
  correct: boolean;
  explanation: string;
}

export interface VoltusMetric {
  label: string;
  val: string;
  bad: boolean;
}

export interface VoltusScenario {
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
  beforeMetrics: VoltusMetric[];
  afterMetrics: VoltusMetric[];
  options: VoltusScenarioOption[];
}

export interface VoltusDomain {
  id: string;
  name: string;
  tagline: string;
  description: string;
}

export const VOLTUS_DOMAINS: VoltusDomain[] = [
  {
    id: "static_ir_pdn",
    name: "Static IR Drop & PDN Mesh",
    tagline: "Resistive Power Grid Solver & Strap Geometry",
    description: "DC voltage drop across VDD/VSS metal straps, sheet resistance bottlenecks, missing vias, and C4 bump pitch.",
  },
  {
    id: "dynamic_ir_noise",
    name: "Dynamic IR Drop & L·di/dt Noise",
    tagline: "Simultaneous Switching Noise & Peak Transient Drops",
    description: "Transient rail collapse during simultaneous clock-edge switching, localized decap starvation, and package inductive bounce.",
  },
  {
    id: "em_signoff",
    name: "Electromigration (EM) Signoff",
    tagline: "Black's Equation, DC/RMS & AC Current Limits",
    description: "Metal void formation and dielectric shorts under high current density on power stripes and high-frequency clock/signal nets.",
  },
  {
    id: "power_gating_switches",
    name: "Power Gating & Inrush Current",
    tagline: "MTCMOS Switch Sizing & Wake-up Integrity",
    description: "Daisy-chained sleep transistor cascades, inrush current spikes tripping active supplies, and state retention power gating.",
  },
  {
    id: "upf_multivoltage",
    name: "Multi-Voltage & UPF Integrity",
    tagline: "Level Shifters, Isolation & Always-On Rails",
    description: "Cross-domain crowbar currents, isolation clamp value mismatches, secondary power routing, and power state table (PST) legality.",
  },
  {
    id: "vcd_fsdb_activity",
    name: "Activity Annotation & Vector Analysis",
    tagline: "VCD / FSDB Waveform Ingestion & Toggle Modeling",
    description: "Vectorless vs vector-driven power quantification, peak burst detection, hierarchical pin binding, and glitch filtering.",
  },
  {
    id: "decap_power_opt",
    name: "Decap Insertion & Power Signoff",
    tagline: "Decoupling Capacitor Placement & Leakage Recovery",
    description: "Decap gate-oxide leakage tradeoffs, dynamic power recovery via cell downsizing, MTCMOS LVT-to-HVT swapping, and signoff reporting.",
  },
];

export const VOLTUS_SCENARIOS: VoltusScenario[] = [
  // =========================================================================
  // DOMAIN 1: STATIC IR DROP & PDN MESH (10 Scenarios)
  // =========================================================================
  {
    id: 0,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Macro Power Corridor Resistive Bottleneck (Missing M6-M7 Via Stack)",
    severity: "CRITICAL",
    stageName: "Voltus Static Rail Analysis / analyze_rail",
    symptom: "Voltus static rail analysis reports 128 mV static IR drop (16% VDD) in the corridor between two 512KB SRAM macros.",
    logSnippet: `[VOLTUS-RAIL-01] Error: Static IR drop violation on net 'VDD':
  Worst drop: 128.4 mV (16.05% of 0.80V supply) at (X: 1240.2, Y: 1560.8).
  Threshold: 24.0 mV (3.0% of VDD).
  Root Cause: High resistance path detected. Missing Via6_7 array between M6 vertical stripes and M7 horizontal trunks.`,
    principle: "Static IR drop is governed by Ohm's Law (V = I_avg · R_mesh). When upper metal power straps cross without sufficient via stacks, current is forced through high-resistance lower thin metals (M1-M3), creating localized resistive bottlenecks and catastrophic voltage drops.",
    remedyTcl: `set_db add_stripes_via_types {Via1_2 Via2_3 Via3_4 Via4_5 Via5_6 Via6_7}
add_stripes -nets {VDD VSS} -layer M7 -direction horizontal -width 2.5 -spacing 2.5 -set_to_set_distance 25.0
edit_power_via -add -nets {VDD VSS} -layers {M6 M7} -area {1100 1400 1400 1700}
set_rail_analysis_mode -method static -accuracy hd
analyze_rail -type static -results_dir static_rail_rpt`,
    beforeMetrics: [
      { label: "Max Static IR Drop", val: "128.4 mV (16.0% VDD)", bad: true },
      { label: "Via Stack Resistance", val: "4.82 Ω (Bottleneck)", bad: true },
      { label: "Signoff Status", val: "FATAL IR VIOLATION", bad: true },
    ],
    afterMetrics: [
      { label: "Max Static IR Drop", val: "18.2 mV (2.28% VDD) ✓", bad: false },
      { label: "Via Stack Resistance", val: "0.12 Ω (Dense Array) ✓", bad: false },
      { label: "Signoff Status", val: "PASSED SIGNOFF (3% Limit) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_vias",
        label: "Insert dense Via6_7 array between M6 and M7 straps using 'edit_power_via -add -layers {M6 M7}' and rerun static rail analysis",
        correct: true,
        explanation: "Correct! Inserting high-density via arrays across strap intersections minimizes via contact resistance, reducing static IR drop well below the 3% signoff threshold.",
      },
      {
        id: "opt_increase_voltage",
        label: "Over-voltage the external PMIC supply to 1.2V to compensate for the drop",
        correct: false,
        explanation: "Over-volting standard cells causes excessive gate-oxide stress, thermal runaway, and premature silicon breakdown.",
      },
      {
        id: "opt_delete_sram",
        label: "Delete one SRAM macro to widen the corridor",
        correct: false,
        explanation: "Removing functional memory breaks the chip's architectural specifications.",
      },
    ],
  },
  {
    id: 1,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Center Die IR Starvation from Inadequate Top Metal M8/M9 Strap Width",
    severity: "CRITICAL",
    stageName: "Voltus Rail Analysis / analyze_rail",
    symptom: "Die center core logic experiences 74 mV static IR drop due to thin top-metal trunk sizing over a large 3 mm x 3 mm die.",
    logSnippet: `[VOLTUS-RAIL-08] Warning: Top-metal distribution resistance exceeds budget:
  Layer M8 sheet resistance contribution: 68% of total R_path.
  Center Core Voltage: 0.726 V (Nominal: 0.800 V, Drop: 74.0 mV).
  Signoff Limit: 24.0 mV (3% VDD).`,
    principle: "In large SoC dies, top thick metal layers (M8/M9) carry the bulk of global power distribution across millimeters. If top metal straps are too narrow, cumulative sheet resistance causes a parabolic voltage sag toward the center of the die.",
    remedyTcl: `add_stripes -nets {VDD VSS} -layer M8 -width 6.0 -spacing 4.0 -set_to_set_distance 30.0
add_stripes -nets {VDD VSS} -layer M9 -width 8.0 -spacing 4.0 -set_to_set_distance 40.0
analyze_rail -type static -results_dir ./rail_m8m9_fixed`,
    beforeMetrics: [
      { label: "Center Core Voltage", val: "0.726 V (Drop 74 mV)", bad: true },
      { label: "Top Metal Strap Width", val: "1.5 µm (Undersized)", bad: true },
      { label: "Grid Sheet Resistance", val: "0.48 Ω/sq", bad: true },
    ],
    afterMetrics: [
      { label: "Center Core Voltage", val: "0.781 V (Drop 19 mV) ✓", bad: false },
      { label: "Top Metal Strap Width", val: "6.0 µm (Optimized) ✓", bad: false },
      { label: "Grid Sheet Resistance", val: "0.05 Ω/sq ✓", bad: false },
    ],
    options: [
      {
        id: "opt_widen_top_straps",
        label: "Increase top-metal M8/M9 power strap widths to 6.0 µm and 8.0 µm with 30 µm set-to-set pitch",
        correct: true,
        explanation: "Correct! Utilizing thick top metals with wide low-resistance straps provides ultra-low sheet resistance, flattening the center-die IR drop profile.",
      },
      {
        id: "opt_use_m1_only",
        label: "Route all global power trunks on Metal 1",
        correct: false,
        explanation: "Metal 1 is thin and has the highest sheet resistance; routing global trunks on M1 causes fatal IR drops and massive routing congestion.",
      },
    ],
  },
  {
    id: 2,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "C4 Flip-Chip Power Bump Missing Array Pitch Rule",
    severity: "HIGH",
    stageName: "Power Planning / Bump Assignment",
    symptom: "Voltus reports localized 85 mV IR drop hotspot near Sector 3 because C4 power bump pitch exceeds 250 µm in that region.",
    logSnippet: `[VOLTUS-BUMP-03] Error: Maximum distance to nearest C4 power pad exceeded:
  Sector 3 distance: 340.0 um (Budget: 180.0 um).
  Localized static IR drop: 85.2 mV.`,
    principle: "In flip-chip packaging, C4 bumps distribute current vertically across the entire die area. A sparse bump array increases lateral current travel distances through on-chip metal grids, multiplying effective resistance and localized IR drops.",
    remedyTcl: `create_bump_array -pattern checkerboard -nets {VDD VSS} -pitch_x 150 -pitch_y 150 -layers M9
assign_bumps -nets {VDD VSS} -pg_pin_layers {M8 M9}
analyze_rail -type static -results_dir bump_array_signoff`,
    beforeMetrics: [
      { label: "Max Bump Pitch", val: "340 µm (Sparse)", bad: true },
      { label: "Sector 3 IR Drop", val: "85.2 mV (10.6%)", bad: true },
      { label: "C4 Bump Count", val: "144 Bumps", bad: true },
    ],
    afterMetrics: [
      { label: "Max Bump Pitch", val: "150 µm (Dense Grid) ✓", bad: false },
      { label: "Sector 3 IR Drop", val: "14.5 mV (1.8%) ✓", bad: false },
      { label: "C4 Bump Count", val: "384 Bumps ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dense_bump_array",
        label: "Regenerate dense uniform 150 µm C4 bump array on M9 connected directly to M8/M9 power straps",
        correct: true,
        explanation: "Correct! Uniform C4 power bump distribution provides direct low-impedance vertical feed points, cutting lateral conduction distance and localized drop.",
      },
      {
        id: "opt_ignore_bumps",
        label: "Ignore bump pitch and rely entirely on perimeter wirebond pads",
        correct: false,
        explanation: "Perimeter pads on a large flip-chip die result in massive center-die IR drops (>200 mV).",
      },
    ],
  },
  {
    id: 3,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Standard Cell Followpin Rail Disconnection on Multi-Height Cell Rows",
    severity: "HIGH",
    stageName: "Special Route / sroute",
    symptom: "820 mixed-height standard cells have disconnected VDD followpins, causing infinite DC resistance and floating power pins.",
    logSnippet: `[VOLTUS-RAIL-05] Error: 820 instance power pins are unpowered (Floating VDD/VSS):
  Instances: u_crypto/aes_sbox_reg_127, u_fpu/dp_add_63...
  Resistance to nearest PG strap: INFINITE (Open Circuit).`,
    principle: "Standard cell rows use M1 followpin rails to connect power pins to vertical M6/M7 distribution stripes. Mixing standard cell heights (e.g., 9T and 12T) requires careful `sroute` rail alignment to prevent rail discontinuity.",
    remedyTcl: `sroute -connect {core_pin} -nets {VDD VSS} -allow_layer_change 1
check_power_grid -nets {VDD VSS} -check_floating_pins true
analyze_rail -type static`,
    beforeMetrics: [
      { label: "Floating Power Pins", val: "820 Cells (Unpowered)", bad: true },
      { label: "M1 Rail Connectivity", val: "Incomplete (Discontinuous)", bad: true },
      { label: "Static Rail Status", val: "FAILED (Open Net)", bad: true },
    ],
    afterMetrics: [
      { label: "Floating Power Pins", val: "0 Cells (100% Connected) ✓", bad: false },
      { label: "M1 Rail Connectivity", val: "Fully Meshed ✓", bad: false },
      { label: "Static Rail Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sroute_followpins",
        label: "Execute 'sroute -connect {core_pin}' with multi-row pin snapping and verify zero floating pins with 'check_power_grid'",
        correct: true,
        explanation: "Correct! `sroute -connect {core_pin}` generates continuous M1 followpin rails across all row sites, tying every cell VDD/VSS pin to the global power mesh.",
      },
      {
        id: "opt_leave_floating",
        label: "Leave pins floating and allow internal substrate diodes to conduct power",
        correct: false,
        explanation: "Substrate diodes cannot deliver operating current and will trigger destructive CMOS latch-up.",
      },
    ],
  },
  {
    id: 4,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Asymmetric VDD vs VSS Power Mesh Sizing Leading to Ground Bounce",
    severity: "MEDIUM",
    stageName: "Voltus Static Analysis",
    symptom: "VSS ground bounce is 48 mV while VDD drop is only 14 mV due to unequal stripe widths (VDD: 3.0 µm, VSS: 1.0 µm).",
    logSnippet: `[VOLTUS-RAIL-09] Warning: Power grid asymmetry detected:
  VDD Max Drop: 14.2 mV (Passed).
  VSS Max Bounce: 48.6 mV (Failed: limit 24.0 mV).
  Total effective supply degradation: 62.8 mV (7.85% VDD).`,
    principle: "Effective logic gate voltage is V_eff = (VDD - V_drop) - (VSS + V_bounce). If the VSS ground grid is undersized relative to VDD, return current encounters higher resistance, elevating the ground potential (ground bounce) and degrading cell switching speeds.",
    remedyTcl: `set_db [get_db pg_nets VSS].stripes.width 3.0
add_stripes -nets {VSS} -layer M6 -width 3.0 -spacing 3.0 -set_to_set_distance 25.0 -replace_existing
analyze_rail -type static`,
    beforeMetrics: [
      { label: "VSS Ground Bounce", val: "48.6 mV (DRC FAIL)", bad: true },
      { label: "Total Supply Degradation", val: "62.8 mV (7.85%)", bad: true },
      { label: "VSS Stripe Width", val: "1.0 µm (Undersized)", bad: true },
    ],
    afterMetrics: [
      { label: "VSS Ground Bounce", val: "15.1 mV (MET) ✓", bad: false },
      { label: "Total Supply Degradation", val: "29.3 mV (3.6%) ✓", bad: false },
      { label: "VSS Stripe Width", val: "3.0 µm (Symmetric) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_balance_stripes",
        label: "Equalize VSS stripe width to 3.0 µm matching VDD to provide symmetric low-impedance return paths",
        correct: true,
        explanation: "Correct! Equalizing VDD and VSS grid impedance balances current flow and reduces ground bounce to safe margins.",
      },
      {
        id: "opt_reduce_vdd",
        label: "Reduce VDD stripe width to 1.0 µm so both are equally bad",
        correct: false,
        explanation: "Constricting VDD will make the overall voltage drop even worse.",
      },
    ],
  },
  {
    id: 5,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Pad-to-Core Ring Resistance Bottleneck in Wirebond Package",
    severity: "HIGH",
    stageName: "I/O Ring Design & Power Routing",
    symptom: "Wirebond peripheral power pads exhibit 92 mV IR drop across narrow M5 feeder links connecting the bond pads to the core ring.",
    logSnippet: `[VOLTUS-IO-02] Error: I/O feeder link resistance excessive:
  Feeder resistance from Pad VDD_CORE_0 to Core Ring: 3.2 ohms.
  Max Current per pad: 28.5 mA.
  Voltage Drop on feeder: 91.2 mV.`,
    principle: "In wirebond designs, all core power enters from peripheral pads. Narrow feeder straps bridging the pad ring to the internal core ring create severe series resistance, causing high voltage drops before power even reaches the core logic.",
    remedyTcl: `create_pg_feeder -nets {VDD VSS} -pad_insts [get_db insts -if {.is_pad == true}] -layer {M7 M8} -width 12.0
analyze_rail -type static`,
    beforeMetrics: [
      { label: "Pad Feeder Resistance", val: "3.20 Ω (High)", bad: true },
      { label: "Feeder Voltage Drop", val: "91.2 mV (Fail)", bad: true },
      { label: "Feeder Metal Layer", val: "M5 (Thin)", bad: true },
    ],
    afterMetrics: [
      { label: "Pad Feeder Resistance", val: "0.18 Ω (Ultra-Low) ✓", bad: false },
      { label: "Feeder Voltage Drop", val: "5.1 mV (Met) ✓", bad: false },
      { label: "Feeder Metal Layer", val: "M7/M8 12.0 µm (Thick) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_widen_feeders",
        label: "Implement wide (12.0 µm) feeder straps on top thick metals (M7/M8) from each power pad to the core ring",
        correct: true,
        explanation: "Correct! Wide top-metal feeder connections minimize series impedance between peripheral bond pads and the core power ring.",
      },
      {
        id: "opt_reduce_pad_current",
        label: "Limit chip operating frequency to 10 MHz to reduce pad current",
        correct: false,
        explanation: "Drastically downclocking fails system performance targets.",
      },
    ],
  },
  {
    id: 6,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Non-Uniform Power Stripe Pitch Creating Local Current Density Crowding",
    severity: "MEDIUM",
    stageName: "Power Planning / add_stripes",
    symptom: "Region X: [400-800] has a 60 µm stripe pitch compared to 20 µm elsewhere, causing localized 42 mV IR drop.",
    logSnippet: `[VOLTUS-GRID-04] Warning: Non-uniform grid pitch detected:
  Sector 2 stripe pitch: 60.0 um (Default: 20.0 um).
  Effective current density: 4.8 mA/um2 (Limit: 2.0 mA/um2).
  Local IR drop: 42.1 mV.`,
    principle: "Non-uniform power grid pitches create current crowding in regions with sparse stripes. When standard cells in the sparse region switch, current is forced to travel longer distances along high-resistance M1 followpins to reach the nearest vertical stripe.",
    remedyTcl: `add_stripes -nets {VDD VSS} -layer M6 -width 2.0 -spacing 2.0 -set_to_set_distance 20.0 -area {400 0 800 2400}
analyze_rail -type static`,
    beforeMetrics: [
      { label: "Stripe Pitch in Sector 2", val: "60.0 µm (Sparse)", bad: true },
      { label: "Local IR Drop", val: "42.1 mV (Failed)", bad: true },
      { label: "M1 Conduction Length", val: "30 µm (High RC)", bad: true },
    ],
    afterMetrics: [
      { label: "Stripe Pitch in Sector 2", val: "20.0 µm (Uniform) ✓", bad: false },
      { label: "Local IR Drop", val: "16.4 mV (Passed) ✓", bad: false },
      { label: "M1 Conduction Length", val: "10 µm (Low RC) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_uniform_pitch",
        label: "Enforce uniform 20 µm power stripe pitch across Sector 2 to ensure equal current distribution",
        correct: true,
        explanation: "Correct! Uniform stripe spacing guarantees consistent low-impedance taps for M1 followpin rails across the entire core area.",
      },
      {
        id: "opt_ignore_sparse_grid",
        label: "Ignore the sparse grid and rely on standard cell decap buffers",
        correct: false,
        explanation: "Decaps do not fix static (DC) IR drop because they only supply transient charge.",
      },
    ],
  },
  {
    id: 7,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "High Sheet Resistance in Lower Thin Metal Power Grid (Missing Upper Metals)",
    severity: "HIGH",
    stageName: "Power Mesh Synthesis",
    symptom: "Design routed power mesh exclusively on M2-M4 due to top-metal routing blocks, yielding 110 mV static drop.",
    logSnippet: `[VOLTUS-RAIL-12] Error: Power distribution layer assignment violation:
  Power mesh restricted to thin metal layers: M2, M3, M4.
  Average sheet resistance: 0.85 ohms/sq (Top metal M7/M8: 0.03 ohms/sq).
  Worst static IR drop: 110.5 mV (13.8% VDD).`,
    principle: "Lower metal layers (M1-M4) are thin with high sheet resistance, optimized for local inter-cell routing. Global power grids MUST utilize upper thick metals (M6-M9) whose low sheet resistance (0.02-0.04 Ω/sq) enables low-loss power transport.",
    remedyTcl: `remove_stripes -nets {VDD VSS} -layers {M2 M3 M4}
add_stripes -nets {VDD VSS} -layer M6 -width 2.0 -spacing 2.0 -set_to_set_distance 25.0
add_stripes -nets {VDD VSS} -layer M7 -width 3.0 -spacing 3.0 -set_to_set_distance 30.0
analyze_rail -type static`,
    beforeMetrics: [
      { label: "Power Grid Sheet Resistance", val: "0.85 Ω/sq (Thin M2-M4)", bad: true },
      { label: "Worst Static Drop", val: "110.5 mV (Fail)", bad: true },
      { label: "M2-M4 Routing Congestion", val: "88% (Blocked)", bad: true },
    ],
    afterMetrics: [
      { label: "Power Grid Sheet Resistance", val: "0.035 Ω/sq (Thick M6/M7) ✓", bad: false },
      { label: "Worst Static Drop", val: "17.8 mV (Pass) ✓", bad: false },
      { label: "M2-M4 Routing Congestion", val: "42% (Open for Signal Routing) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_promote_to_top_metal",
        label: "Migrate global power mesh to top thick metals M6/M7 and free lower metals M2-M4 for signal routing",
        correct: true,
        explanation: "Correct! Thick top metals provide an order-of-magnitude lower sheet resistance and eliminate signal routing congestion on lower layers.",
      },
      {
        id: "opt_add_more_m2",
        label: "Cover 100% of M2 with solid power planes",
        correct: false,
        explanation: "Blocking M2 completely prevents standard cells from connecting internal pins, causing 100% unroutable shorts.",
      },
    ],
  },
  {
    id: 8,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Static IR Drop Induced Hold Time Race Violations in Low-Voltage Corner",
    severity: "HIGH",
    stageName: "Voltus-Tempus Integrated Rail Timing",
    symptom: "Tempus reports 45 setup and hold timing failures along paths running through an uncharacterized 50 mV IR drop valley.",
    logSnippet: `[VOLTUS-TEMPUS-01] Error: Voltage-derated timing failure:
  Nominal voltage: 0.720 V (SS Corner). Actual degraded voltage: 0.670 V.
  Path: u_dma/tx_fifo_reg_15/CK -> u_dma/rx_fifo_reg_15/D
  Slack: -65 ps (WNS). Cumulative gate delay increase: +18.4%.`,
    principle: "Standard cell propagation delay increases non-linearly as supply voltage drops (t_pd ∝ VDD / (VDD - Vth)^α). When static IR drop reduces local supply voltage, logic gates along data paths slow down, while clock arrival times shift, causing catastrophic timing degradation.",
    remedyTcl: `write_power_data -format voltage -out_file static_voltages.vdb
read_voltage_data -file static_voltages.vdb -view ss_0p72v_m40c
report_timing -late -early -voltage_aware
opt_design -post_route -voltage_aware`,
    beforeMetrics: [
      { label: "Voltage-Aware WNS", val: "-65 ps (VIOLATED)", bad: true },
      { label: "Degraded Cell Delay", val: "+18.4% Slower", bad: true },
      { label: "Failing Paths", val: "45 Timing Paths", bad: true },
    ],
    afterMetrics: [
      { label: "Voltage-Aware WNS", val: "+12 ps (MET) ✓", bad: false },
      { label: "Degraded Cell Delay", val: "Compensated ✓", bad: false },
      { label: "Failing Paths", val: "0 Timing Paths ✓", bad: false },
    ],
    options: [
      {
        id: "opt_voltage_aware_timing",
        label: "Enable Voltus-Tempus voltage-aware STA (`read_voltage_data`) and run voltage-aware optimization (`opt_design -voltage_aware`)",
        correct: true,
        explanation: "Correct! Voltage-aware STA annotates localized IR drop values directly into cell delay calculation, allowing the optimizer to upsize or insert buffers where voltage is degraded.",
      },
      {
        id: "opt_disable_voltage_derates",
        label: "Disable voltage-aware timing and assume constant nominal 0.8V everywhere",
        correct: false,
        explanation: "Ignoring voltage degradation guarantees physical silicon timing failure and chip malfunction under real operating conditions.",
      },
    ],
  },
  {
    id: 9,
    domainId: "static_ir_pdn",
    domainName: "Static IR Drop & PDN Mesh",
    title: "Static Power Grid Discontinuity at Power Domain Boundary",
    severity: "CRITICAL",
    stageName: "Multi-Voltage Power Planning",
    symptom: "Always-on (AON) power grid VDD_AON loses power connectivity when crossing the switchable power domain boundary.",
    logSnippet: `[VOLTUS-UPF-03] Error: Discontinuous always-on power net 'VDD_AON':
  Open circuit detected at boundary (X: 850.0, Y: 1200.0).
  54 Always-On buffer cells inside switched domain are unpowered!`,
    principle: "Always-on (AON) logic residing inside power-gated domains requires a dedicated secondary power routing grid (VDD_AON) that must remain continuous and un-gated across all domain boundaries.",
    remedyTcl: `sroute -connect {secondary_pg_pins} -nets {VDD_AON}
check_power_grid -nets {VDD_AON} -check_floating_pins true
analyze_rail -type static -domain AON_DOMAIN`,
    beforeMetrics: [
      { label: "AON Grid Continuity", val: "BROKEN (Open Circuit)", bad: true },
      { label: "Unpowered AON Cells", val: "54 Instances", bad: true },
      { label: "AON Domain Signoff", val: "FATAL ERROR", bad: true },
    ],
    afterMetrics: [
      { label: "AON Grid Continuity", val: "100% CONTINUOUS ✓", bad: false },
      { label: "Unpowered AON Cells", val: "0 Instances ✓", bad: false },
      { label: "AON Domain Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sroute_secondary_pg",
        label: "Execute 'sroute -connect {secondary_pg_pins}' to route continuous secondary VDD_AON rails across the switched domain",
        correct: true,
        explanation: "Correct! Dedicated secondary power routing ensures always-on cells receive uninterrupted power regardless of whether the surrounding domain is awake or asleep.",
      },
      {
        id: "opt_tie_to_switched_vdd",
        label: "Short VDD_AON directly to the switched VDD_SW rail",
        correct: false,
        explanation: "Shorting AON to the switched rail causes always-on logic to lose power during sleep mode, corrupting state retention.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 2: DYNAMIC IR DROP & L·di/dt NOISE (10 Scenarios)
  // =========================================================================
  {
    id: 10,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Simultaneous Switching Noise (SSN) on Clock Edge in 64-bit ALU Core",
    severity: "CRITICAL",
    stageName: "Voltus Dynamic Rail Analysis / analyze_rail -dynamic",
    symptom: "Voltus dynamic vector-based analysis reports 185 mV peak transient voltage drop (23% VDD) within 80 ps of the master clock edge.",
    logSnippet: `[VOLTUS-DYN-01] Error: Dynamic peak IR drop violation:
  Peak transient drop: 185.4 mV (23.18% of 0.80V) at T = 12.04 ns.
  Threshold limit: 40.0 mV (5.0% of VDD).
  Location: u_core/u_alu_64bit (Sector 5).
  Root Cause: 8,400 flip-flops and arithmetic gates switching concurrently on clk_core rising edge.`,
    principle: "Dynamic IR drop is governed by transient current: V_dynamic = I_peak · R_mesh + L_package · (di/dt). When thousands of registers and clock buffers toggle simultaneously on a clock edge, the di/dt spike induces severe inductive and capacitive supply collapse.",
    remedyTcl: `add_decaps -cells {DECAP_X32 DECAP_X16} -density 0.15 -area {1200 1200 1800 1800}
set_rail_analysis_mode -method dynamic -accuracy hd -power_grid_library {stdcells.pgv}
analyze_rail -type dynamic -results_dir dynamic_ir_rpt`,
    beforeMetrics: [
      { label: "Peak Dynamic IR Drop", val: "185.4 mV (23.2% VDD)", bad: true },
      { label: "di/dt Current Slew", val: "42.5 mA/ps (Severe Slew)", bad: true },
      { label: "Local Decap Density", val: "0.8% (Starved)", bad: true },
    ],
    afterMetrics: [
      { label: "Peak Dynamic IR Drop", val: "32.1 mV (4.01% VDD) ✓", bad: false },
      { label: "di/dt Current Slew", val: "12.2 mA/ps (Filtered) ✓", bad: false },
      { label: "Local Decap Density", val: "15.4% (Suppressed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_insert_decaps",
        label: "Insert high-density decoupling capacitor cells (DECAP_X32/X16 at 15% density) in the ALU hotspot to provide instant local charge reservoir",
        correct: true,
        explanation: "Correct! Decap cells store local charge right next to switching transistors, supplying peak transient current during the clock transition and dampening di/dt noise.",
      },
      {
        id: "opt_increase_clock_freq",
        label: "Double the clock frequency to spread switching over time",
        correct: false,
        explanation: "Doubling frequency increases total switching power and worsens dynamic supply noise.",
      },
      {
        id: "opt_remove_power_mesh",
        label: "Remove top metal power straps to reduce capacitance",
        correct: false,
        explanation: "Removing power straps drastically increases grid resistance, resulting in complete rail collapse.",
      },
    ],
  },
  {
    id: 11,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Clock Tree Buffer Clustering Inducing Local di/dt Power Rail Collapse",
    severity: "CRITICAL",
    stageName: "CCOpt CTS / Voltus Dynamic Rail",
    symptom: "Clock tree root buffers clustered in a 30x30 µm tile cause a 140 mV dynamic voltage dip, delaying clock launch edges.",
    logSnippet: `[VOLTUS-DYN-07] Error: Clock buffer clustering hotspot:
  Instance count: 64 high-drive clock inverters (CLKBUF_X32) in 900 um2 area.
  Peak instantaneous current: 380 mA at T = 4.00 ns.
  Dynamic IR drop: 140.2 mV. Clock buffer propagation delay increase: +120 ps.`,
    principle: "High-drive clock buffers switch on every single cycle with steep transitions. If CTS concentrates clock buffers into tight clusters, their combined peak current creates a localized dynamic IR drop pit, slowing down clock propagation and causing severe clock skew and jitter.",
    remedyTcl: `set_db cts_buffer_distance_min 25.0
set_db cts_cell_padding 2
place_opt_design -incremental
analyze_rail -type dynamic -results_dir dynamic_cts_fixed`,
    beforeMetrics: [
      { label: "Peak Clock Buffer Drop", val: "140.2 mV (Fail)", bad: true },
      { label: "Clock Jitter Induced", val: "+120 ps (Degraded)", bad: true },
      { label: "Buffer Density", val: "64 Buffers / 900 µm²", bad: true },
    ],
    afterMetrics: [
      { label: "Peak Clock Buffer Drop", val: "28.4 mV (Pass) ✓", bad: false },
      { label: "Clock Jitter Induced", val: "+8 ps (Stable) ✓", bad: false },
      { label: "Buffer Density", val: "Distributed (25 µm spacing) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_distribute_clock_buffers",
        label: "Apply minimum spacing constraints (25 µm) and cell padding to distribute clock buffers uniformly across the core",
        correct: true,
        explanation: "Correct! Distributing clock buffers across the die spreads peak current demands over many different power grid nodes, preventing localized supply collapse.",
      },
      {
        id: "opt_use_unbuffered_clock",
        label: "Remove all clock buffers and drive 50,000 registers with a single inverter",
        correct: false,
        explanation: "An unbuffered clock net has massive RC delay, causing transition slew rates of several nanoseconds and timing breakdown.",
      },
    ],
  },
  {
    id: 12,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Anti-Resonance LC Impedance Peak Between Package Inductance and On-Die Decaps",
    severity: "HIGH",
    stageName: "Power Distribution Network Impedance Frequency Scan",
    symptom: "PDN impedance exhibits a 2.4 Ω resonance peak at 180 MHz, causing sustained voltage oscillations during burst DMA reads.",
    logSnippet: `[VOLTUS-PDN-03] Warning: Anti-resonance peak detected:
  Resonant frequency f_res: 184.2 MHz.
  Impedance Z_peak: 2.42 ohms (Target Impedance: 0.05 ohms).
  Package L_pkg: 0.45 nH, On-die C_die: 1.65 nF.
  Peak voltage oscillation: +/- 95 mV.`,
    principle: "The parallel combination of package lead inductance (L_pkg) and on-die decoupling capacitance (C_die) creates an anti-resonant LC tank circuit (f_res = 1 / (2π√(L_pkg·C_die))). If core switching activity aligns with this frequency, impedance skyrockets, causing sustained supply ringing.",
    remedyTcl: `add_decaps -cells {DECAP_X64} -density 0.08
set_rail_analysis_mode -method dynamic -frequency_domain true
report_pdn_impedance -freq_range {10M 10G} -out_file pdn_impedance.rpt`,
    beforeMetrics: [
      { label: "PDN Resonant Peak", val: "2.42 Ω at 184 MHz", bad: true },
      { label: "Voltage Oscillation", val: "±95 mV (Ringing)", bad: true },
      { label: "Target Impedance", val: "0.05 Ω (VIOLATED)", bad: true },
    ],
    afterMetrics: [
      { label: "PDN Resonant Peak", val: "0.042 Ω (Damped) ✓", bad: false },
      { label: "Voltage Oscillation", val: "±14 mV (Damped) ✓", bad: false },
      { label: "Target Impedance", val: "MET ACROSS SPECTRUM ✓", bad: false },
    ],
    options: [
      {
        id: "opt_damp_resonance",
        label: "Increase on-die decap capacitance and optimize package ball assignment to damp the LC peak below the target impedance (0.05 Ω)",
        correct: true,
        explanation: "Correct! Adding distributed on-die decaps shifts the resonant frequency and reduces the Q-factor of the LC tank, damping voltage oscillations.",
      },
      {
        id: "opt_remove_all_decaps",
        label: "Remove all on-die decaps so C_die becomes zero",
        correct: false,
        explanation: "Removing decaps eliminates on-die charge storage, causing catastrophic high-frequency dynamic IR drops (>300 mV).",
      },
    ],
  },
  {
    id: 13,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Vectorless Peak Power Underestimation in Safety-Critical Automotive Core",
    severity: "HIGH",
    stageName: "Voltus Power Signoff Mode Selection",
    symptom: "Vectorless mode under-predicted dynamic IR drop as 35 mV, while actual gate-level diagnostic VCD waveform produces 112 mV drop.",
    logSnippet: `[VOLTUS-VCD-04] Warning: Dynamic power disparity between vectorless and vector-based:
  Vectorless estimated peak current: 1.4 A (Uniform toggle probability 0.1).
  VCD vector-based peak current: 4.8 A (Burst AES encryption round).
  Actual Dynamic IR Drop: 112.4 mV vs 35.2 mV estimated.`,
    principle: "Vectorless power analysis assumes statistically uniform switching across all gates. However, real workloads (such as crypto rounds or neural network matrix multiplies) trigger massive synchronized switching bursts that only true VCD/FSDB activity waveforms can expose.",
    remedyTcl: `set_power_analysis_mode -method dynamic_vectorbased
read_activity_file -format fsdb -start 50ns -end 250ns -activity_scope tb/dut ./sim/aes_burst.fsdb
analyze_rail -type dynamic -results_dir vector_based_rail`,
    beforeMetrics: [
      { label: "Analysis Mode", val: "Vectorless (Unrealistic)", bad: true },
      { label: "Peak Current Measured", val: "1.4 A (Underestimated)", bad: true },
      { label: "True Silicon Risk", val: "UNREPORTED 112 mV DROP", bad: true },
    ],
    afterMetrics: [
      { label: "Analysis Mode", val: "Vector-Based FSDB ✓", bad: false },
      { label: "Peak Current Measured", val: "4.8 A (Accurate Burst) ✓", bad: false },
      { label: "True Silicon Risk", val: "Exposed & Fixed with Decaps ✓", bad: false },
    ],
    options: [
      {
        id: "opt_vectorbased_signoff",
        label: "Switch to vector-based dynamic analysis (`set_power_analysis_mode -method dynamic_vectorbased`) using worst-case functional testbench FSDB waveforms",
        correct: true,
        explanation: "Correct! Vector-based rail analysis models cycle-accurate peak current spikes, ensuring power grid signoff accounts for real worst-case operating bursts.",
      },
      {
        id: "opt_stay_vectorless",
        label: "Stay with vectorless mode and set toggle rate to 10.0 for all nets",
        correct: false,
        explanation: "Setting toggle rate to 10.0 is physically nonsensical (toggle rates are between 0.0 and 1.0) and distorts power calculation.",
      },
    ],
  },
  {
    id: 14,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Dynamic IR Drop Caused by Simultaneous Multi-Bit Bus Register Clocking",
    severity: "MEDIUM",
    stageName: "Clock Gating & Register Placement",
    symptom: "512-bit wide datapath register bank switching simultaneously on M1 causes 98 mV transient drop.",
    logSnippet: `[VOLTUS-DYN-09] Error: 512-bit bus register bank dynamic drop:
  512 DFFs switching from 0xFF..FF to 0x00..00 in 15 um radius.
  Local dynamic drop: 98.6 mV.`,
    principle: "Wide parallel buses (e.g., 256/512-bit data buses) that switch in the same clock cycle concentrate huge transient current in a small silicon footprint. Skewing or staggering clock arrivals by 30-50 ps spreads current demand without degrading cycle time.",
    remedyTcl: `create_ccopt_skew_group -name SG_BUS_STAGGER -target_skew 0.040
set_ccopt_property -skew_group SG_BUS_STAGGER target_insertion_delay_delta 0.035
clock_opt_design
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Bus Dynamic IR Drop", val: "98.6 mV (Failed)", bad: true },
      { label: "Bus Clock Skew", val: "0 ps (Simultaneous)", bad: true },
      { label: "Peak Current Spike", val: "2.8 A (Sharp)", bad: true },
    ],
    afterMetrics: [
      { label: "Bus Dynamic IR Drop", val: "24.1 mV (Passed) ✓", bad: false },
      { label: "Bus Clock Skew", val: "35 ps (Staggered) ✓", bad: false },
      { label: "Peak Current Spike", val: "0.9 A (Flattened) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_stagger_bus_clocks",
        label: "Apply intentional clock staggering (useful skew 35 ps) across multi-bit bus register banks to spread current demand over time",
        correct: true,
        explanation: "Correct! Staggering clock arrival times across wide buses flattens the di/dt current peak without violating system cycle timing.",
      },
      {
        id: "opt_remove_bus",
        label: "Convert the 512-bit parallel bus into a 1-bit serial shift register",
        correct: false,
        explanation: "Serializing a 512-bit bus reduces datapath throughput by 512x, violating architectural requirements.",
      },
    ],
  },
  {
    id: 15,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Decap Gate Oxide Tunneling Leakage Thermal Runaway",
    severity: "HIGH",
    stageName: "Power Optimization / Decap Balance",
    symptom: "Inserting 25% thin-oxide decap density resolved dynamic IR drop but caused static leakage power to jump from 12 mW to 98 mW at 125°C.",
    logSnippet: `[VOLTUS-PWR-06] Warning: Excessive gate leakage in decap cells:
  Total decap cell count: 48,000 (Thin-oxide DECAP_X32).
  Gate tunneling leakage: 86.4 mW (78% of total chip leakage).
  Junction temperature rise: +18.2 C (Thermal runaway risk).`,
    principle: "Thin-oxide decoupling capacitors provide high capacitance per unit area but suffer from quantum mechanical gate oxide tunneling leakage. In advanced nodes (16nm/7nm), over-inserting thin-oxide decaps causes massive standby leakage and thermal dissipation.",
    remedyTcl: `replace_decaps -from DECAP_X32_THIN -to DECAP_X32_THICK_OD -area {0 0 2400 2400}
add_decaps -cells {DECAP_X32_THICK_OD} -target_ir_drop 0.035 -leakage_budget 25.0
report_power -leakage`,
    beforeMetrics: [
      { label: "Standby Leakage Power", val: "98.4 mW (Unacceptable)", bad: true },
      { label: "Decap Leakage Share", val: "78% of total leakage", bad: true },
      { label: "Dynamic IR Drop", val: "22.0 mV (Met)", bad: false },
    ],
    afterMetrics: [
      { label: "Standby Leakage Power", val: "18.2 mW (81% Reduction) ✓", bad: false },
      { label: "Decap Leakage Share", val: "12% of total leakage ✓", bad: false },
      { label: "Dynamic IR Drop", val: "28.5 mV (Met) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_use_thick_oxide_decaps",
        label: "Swap thin-oxide decaps for thick-oxide (thick-OD) low-leakage decap cells to eliminate gate tunneling currents",
        correct: true,
        explanation: "Correct! Thick-oxide decaps have negligible gate tunneling leakage, providing necessary charge storage while keeping standby leakage well within budget.",
      },
      {
        id: "opt_remove_power_switch",
        label: "Short the chip to 0V during test",
        correct: false,
        explanation: "This does not solve the operating leakage problem.",
      },
    ],
  },
  {
    id: 16,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Package Pin Inductance (L_pkg) Induced Ground Bounce on High-Drive I/O Banks",
    severity: "HIGH",
    stageName: "I/O Power Integrity Signoff",
    symptom: "Simultaneous switching of 32 DDR4 I/O drivers (1.2V SSTL) induces 210 mV ground bounce on the VSS_IO rail.",
    logSnippet: `[VOLTUS-IO-08] Error: I/O Simultaneous Switching Noise (SSN) violation:
  VSS_IO ground bounce peak: 210.5 mV (Threshold: 60.0 mV).
  Package bond wire inductance: 1.8 nH per pin.
  Failing receivers: 14 DDR input buffers detecting false clock edges.`,
    principle: "High-speed I/O drivers sink several milliamperes within fractions of a nanosecond. Return current through inductive package pins and bond wires induces voltage spikes (V = L · di/dt) that elevate the ground rail, corrupting input logic levels.",
    remedyTcl: `set_db [get_db insts -if {.is_io_driver == true}].slew_rate programmable_slow
add_io_power_pads -nets {VDD_IO VSS_IO} -ratio 2:1
analyze_rail -type dynamic -domain IO_DOMAIN`,
    beforeMetrics: [
      { label: "VSS_IO Ground Bounce", val: "210.5 mV (Fatal SSN)", bad: true },
      { label: "I/O to Power Pad Ratio", val: "8:1 (Inadequate VSS)", bad: true },
      { label: "False Clock Triggers", val: "14 DDR Receivers", bad: true },
    ],
    afterMetrics: [
      { label: "VSS_IO Ground Bounce", val: "38.2 mV (Met) ✓", bad: false },
      { label: "I/O to Power Pad Ratio", val: "2:1 (Dedicated Return) ✓", bad: false },
      { label: "False Clock Triggers", val: "0 Receivers ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_io_ground_pins",
        label: "Increase dedicated VSS_IO return pins (2:1 signal-to-power ratio) and enable programmable slew-rate control on I/O drivers",
        correct: true,
        explanation: "Correct! Adding parallel ground return pins reduces effective package loop inductance (L_eff = L / N), while controlled slew rates reduce di/dt.",
      },
      {
        id: "opt_disconnect_ground",
        label: "Disconnect the VSS_IO rail from package ground",
        correct: false,
        explanation: "Disconnecting ground leaves return current with no path, preventing all I/O communication.",
      },
    ],
  },
  {
    id: 17,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Clock Jitter Amplification from Non-Uniform Dynamic IR Drop across Clock Path",
    severity: "HIGH",
    stageName: "Voltus-Tempus Jitter Signoff",
    symptom: "Clock skew across CPU cores varies dynamically by ±75 ps cycle-to-cycle depending on whether the GPU core is active or idle.",
    logSnippet: `[VOLTUS-JITTER-02] Error: Dynamic supply induced clock jitter:
  Clock source to sink path delay variation: delta_T = 75.4 ps.
  Supply voltage on core clock tree: 0.735 V (GPU Idle) -> 0.655 V (GPU Active).
  Result: Dynamic hold timing violation under heavy GPU graphics burst.`,
    principle: "When high-power functional blocks (like GPUs) switch between active and idle states, localized power grid voltage swings modulate the propagation delay of nearby clock distribution buffers, injecting dynamic clock jitter and skew.",
    remedyTcl: `create_route_type -name CLK_NDR_SHIELD -width_multiplier 2 -space_multiplier 2 -shield_net VSS
set_db [get_db nets -if {.is_clock == true}].route_type CLK_NDR_SHIELD
add_decaps -cells {DECAP_X32} -density 0.12 -area {0 0 2400 2400}
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Dynamic Clock Jitter", val: "±75.4 ps (Fail)", bad: true },
      { label: "Clock Supply Modulation", val: "80.0 mV Delta", bad: true },
      { label: "Hold Timing Margin", val: "-48 ps (Violated)", bad: true },
    ],
    afterMetrics: [
      { label: "Dynamic Clock Jitter", val: "±8.2 ps (Stable) ✓", bad: false },
      { label: "Clock Supply Modulation", val: "12.0 mV Delta ✓", bad: false },
      { label: "Hold Timing Margin", val: "+34 ps (Safe) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_shield_and_decap_clock",
        label: "Shield clock trunks on dedicated layers and place high-density decaps along clock buffer corridors to isolate clock supply voltages",
        correct: true,
        explanation: "Correct! Decoupling clock buffer power rails stabilizes local supply voltage, suppressing supply-induced propagation delay modulation.",
      },
      {
        id: "opt_disable_gpu",
        label: "Permanently power-down the GPU block in hardware",
        correct: false,
        explanation: "Disabling product features eliminates GPU functionality.",
      },
    ],
  },
  {
    id: 18,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Crosstalk Induced Simultaneous Switching Aggravating Dynamic Voltage Drop",
    severity: "MEDIUM",
    stageName: "Voltus SI-Power Co-Analysis",
    symptom: "64 tightly coupled parallel 32-bit bus lines switching in opposite directions increase driver dynamic current by 2.2x due to Miller coupling.",
    logSnippet: `[VOLTUS-SI-05] Warning: Miller capacitance dynamic current multiplication:
  Victim/Aggressor bus count: 64 nets (M4 layer, 0.06 um spacing).
  Effective load capacitance C_eff: 2.2 * C_ground (Miller factor 2.0).
  Peak current jump: 120 mA -> 264 mA. Local dynamic drop: 62 mV.`,
    principle: "When adjacent long signal wires switch in opposite directions simultaneously, the effective coupling capacitance doubles (C_eff = C_g + 2·C_c) due to the Miller effect. This demands double the dynamic charge (Q = C_eff·V) from the power rail, exacerbating dynamic IR drop.",
    remedyTcl: `set_db route_design_detail_post_route_spread_wires true
edit_wire_spread -nets [get_db nets -if {.is_bus == true}] -min_spacing 2
route_opt_design
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Effective Bus Capacitance", val: "2.2x Miller Multiplier", bad: true },
      { label: "Peak Driver Current", val: "264 mA (High Slew)", bad: true },
      { label: "Dynamic IR Drop", val: "62.4 mV (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Effective Bus Capacitance", val: "1.05x (Shielded/Spread) ✓", bad: false },
      { label: "Peak Driver Current", val: "128 mA (Normal) ✓", bad: false },
      { label: "Dynamic IR Drop", val: "19.8 mV (Passed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_spread_bus_wires",
        label: "Execute post-route wire spreading (`edit_wire_spread`) to double inter-wire spacing on wide buses, reducing Miller coupling capacitance",
        correct: true,
        explanation: "Correct! Increasing wire spacing minimizes cross-coupling capacitance (C_c), eliminating Miller charge multiplication and lowering dynamic current demand.",
      },
      {
        id: "opt_bundle_closer",
        label: "Pack bus wires even closer together to save routing area",
        correct: false,
        explanation: "Packing wires closer increases coupling capacitance and worsens cross-talk and dynamic supply collapse.",
      },
    ],
  },
  {
    id: 19,
    domainId: "dynamic_ir_noise",
    domainName: "Dynamic IR Drop & L·di/dt Noise",
    title: "Transient Voltage Undershoot Triggering SRAM Sense Amplifier Read Corruption",
    severity: "CRITICAL",
    stageName: "Memory Subsystem Rail Analysis",
    symptom: "Memory BIST testbench fails at 1.2 GHz because an 80 mV dynamic voltage dip during wordline activation causes sense amp read errors.",
    logSnippet: `[VOLTUS-MEM-02] Error: SRAM macro transient supply undershoot:
  Macro: SRAM_BANK_0 (VDD_MEM pin).
  Voltage at sense amp trigger (T = 8.12 ns): 0.640 V (Nominal: 0.720 V, Drop: 80.0 mV).
  Sense amplifier differential margin degraded by 48%: BIST Read Failure!`,
    principle: "SRAM bitcell reading relies on small differential voltage development across bitlines (BL/BLB) detected by sensitive sense amplifiers. If dynamic IR drop collapses the macro's VDD supply during sensing, differential development slows down, causing bit flips and data corruption.",
    remedyTcl: `create_pg_ring -nets {VDD VSS} -insts SRAM_BANK_0 -layers {M6 M7} -width 4.0 -spacing 2.0
add_decaps -cells {DECAP_X32} -insts SRAM_BANK_0 -ring_distance 15.0
analyze_rail -type dynamic -domain MEM_DOMAIN`,
    beforeMetrics: [
      { label: "SRAM VDD Undershoot", val: "80.0 mV (Fail)", bad: true },
      { label: "Sense Amp Margin", val: "-48% (Data Corruption)", bad: true },
      { label: "BIST Status", val: "FAILING BITCELL READS", bad: true },
    ],
    afterMetrics: [
      { label: "SRAM VDD Undershoot", val: "14.2 mV (Safe) ✓", bad: false },
      { label: "Sense Amp Margin", val: "100% NOMINAL MARGIN ✓", bad: false },
      { label: "BIST Status", val: "PASSED 100% MEMORY BIST ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sram_dedicated_ring",
        label: "Synthesize dedicated M6/M7 power rings around the SRAM macro backed by perimeter decoupling capacitors",
        correct: true,
        explanation: "Correct! Dedicated macro power rings with surrounding decaps buffer the intense transient current surge during wordline and sense-amp activation.",
      },
      {
        id: "opt_disable_sense_amps",
        label: "Remove sense amplifiers and read bitlines with standard CMOS inverters",
        correct: false,
        explanation: "CMOS inverters lack differential sensitivity, requiring full-rail bitline discharge that destroys SRAM read speed and explodes dynamic power.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 3: ELECTROMIGRATION (EM) SIGNOFF (10 Scenarios)
  // =========================================================================
  {
    id: 20,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Power Grid DC Current Density Exceeding Black's Equation Signoff Limit",
    severity: "CRITICAL",
    stageName: "Voltus Power EM Signoff / analyze_power_grid_em",
    symptom: "Voltus reports 28 M3/M4 power rail segments carrying 14.8 mA/µm², exceeding the foundry electromigration limit of 5.0 mA/µm².",
    logSnippet: `[VOLTUS-EM-01] Error: Electromigration DC current density violation:
  Net 'VDD', Layer 'M3', Segment (X: 540.2, Y: 1120.4):
  Average DC Current: 2.96 mA, Wire Width: 0.20 um (J_avg = 14.80 mA/um2).
  Foundry EM Limit: 5.00 mA/um2 (Violation: 296% of limit).
  Mean Time to Failure (MTTF): Under 1,200 operating hours (Target: 100,000 hrs).`,
    principle: "Electromigration is atomic transport caused by momentum transfer between conducting electrons and metal lattice ions. Governed by Black's Equation (MTTF = A · J^(-n) · exp(Ea / kT)), excessive DC current density (J) leads to metal void formation (open circuits) or hillocks (dielectric shorts), causing field failures.",
    remedyTcl: `set_db [get_db pg_nets VDD].stripes.width 0.60
edit_power_mesh -widen_violators -nets {VDD VSS} -layers {M3 M4} -max_current_density 4.5
analyze_power_grid_em -results_dir em_signoff_rpt`,
    beforeMetrics: [
      { label: "Max DC Current Density", val: "14.8 mA/µm² (296% Limit)", bad: true },
      { label: "Estimated Silicon MTTF", val: "1,200 Hours (FATAL)", bad: true },
      { label: "EM Violating Segments", val: "28 Wire Segments", bad: true },
    ],
    afterMetrics: [
      { label: "Max DC Current Density", val: "3.2 mA/µm² (64% Limit) ✓", bad: false },
      { label: "Estimated Silicon MTTF", val: ">150,000 Hours (Signoff MET) ✓", bad: false },
      { label: "EM Violating Segments", val: "0 Segments ✓", bad: false },
    ],
    options: [
      {
        id: "opt_widen_em_stripes",
        label: "Widen violating lower metal power straps to 0.60 µm and add parallel vertical feed stripes to lower current density (J = I / A)",
        correct: true,
        explanation: "Correct! Increasing cross-sectional conductor area (A = width × thickness) directly reduces current density (J) well below foundry Black's equation limits.",
      },
      {
        id: "opt_ignore_em",
        label: "Ignore EM violations because electromigration only happens in vacuum tubes",
        correct: false,
        explanation: "Electromigration is a major physics-level failure mechanism in advanced sub-micron copper interconnects.",
      },
      {
        id: "opt_lower_target_mttf",
        label: "Change chip lifetime specification to 2 days",
        correct: false,
        explanation: "Reducing required lifetime violates customer reliability and warranty contracts.",
      },
    ],
  },
  {
    id: 21,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "High-Frequency Clock Net AC RMS Current Electromigration on Thin M2 Layer",
    severity: "CRITICAL",
    stageName: "Signal EM Signoff / analyze_signal_em",
    symptom: "Master 2.4 GHz clock trunk routed on M2 exceeds AC RMS current limit by 240%, threatening thermal self-heating burnout.",
    logSnippet: `[VOLTUS-SIGEM-03] Error: Signal AC/RMS electromigration limit exceeded:
  Net: clk_core_2g4 (Frequency: 2.4 GHz, T = 416 ps).
  Layer M2: I_rms = 4.82 mA (Foundry I_rms_max = 2.00 mA).
  Joule heating temperature rise (delta_T): +28.4 C.`,
    principle: "In high-frequency signal lines (like clock trunks), bidirectional AC current causes joule heating (self-heating), accelerating thermal atomic diffusion and thermal breakdown. Foundries enforce strict RMS current limits (I_rms) to prevent catastrophic interconnect melting.",
    remedyTcl: `create_route_type -name CLK_EM_RULE -top_preferred_layer M7 -bottom_preferred_layer M5 -width_multiplier 2
set_db [get_db nets clk_core_2g4].route_type CLK_EM_RULE
route_opt_design -incremental
analyze_signal_em -results_dir signal_em_rpt`,
    beforeMetrics: [
      { label: "Clock Trunk Layer", val: "M2 (Thin Lower Metal)", bad: true },
      { label: "AC RMS Current", val: "4.82 mA (241% Limit)", bad: true },
      { label: "Self-Heating Rise", val: "+28.4 °C (Burnout Risk)", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Trunk Layer", val: "M5-M7 (Thick Top Metal) ✓", bad: false },
      { label: "AC RMS Current", val: "1.12 mA (56% Limit) ✓", bad: false },
      { label: "Self-Heating Rise", val: "+1.8 °C (Safe) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_promote_clock_to_m7",
        label: "Re-route high-frequency clock trunk on top thick metals (M5-M7) with 2x double width to satisfy AC RMS current and thermal rules",
        correct: true,
        explanation: "Correct! Thick upper metals have much higher cross-sectional area and thermal dissipation capacity, easily handling 2.4 GHz RMS current without self-heating.",
      },
      {
        id: "opt_invert_clock",
        label: "Add an inverter to flip clock polarity",
        correct: false,
        explanation: "Flipping clock polarity does not alter frequency or RMS current magnitude.",
      },
    ],
  },
  {
    id: 22,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Single Via Contact Current Crowding at Standard Cell Power Pin Tap",
    severity: "HIGH",
    stageName: "Voltus Power Grid EM Analysis",
    symptom: "410 standard cell power pin connections use single Via1 contacts carrying 1.2 mA DC, exceeding the single-via EM limit of 0.4 mA.",
    logSnippet: `[VOLTUS-VIA-EM-02] Error: Via current density violation:
  Via instance: u_fpu/dp_mult_reg_63/VIA1_VDD.
  Average current: 1.18 mA per via (Single Via1 Limit: 0.40 mA).
  Violation: 295% of foundry contact reliability limit.`,
    principle: "Via contacts have small cross-sectional area and high current crowding at perimeter corners. If a high-current cell (such as an arithmetic multiplier or clock buffer) connects to power through a single via, current crowding causes voiding beneath the via barrier layer.",
    remedyTcl: `edit_power_via -add_redundant -nets {VDD VSS} -min_vias_per_connection 2 -layers {M1 M2}
analyze_power_grid_em -results_dir via_em_fixed`,
    beforeMetrics: [
      { label: "Via Current per Contact", val: "1.18 mA (295% Limit)", bad: true },
      { label: "Single Via Ratio", val: "100% Single Vias", bad: true },
      { label: "Via Failure Risk", val: "CONTACT VOID BURNOUT", bad: true },
    ],
    afterMetrics: [
      { label: "Via Current per Contact", val: "0.29 mA (72% Limit) ✓", bad: false },
      { label: "Single Via Ratio", val: "0% (All Multi-Cut Vias) ✓", bad: false },
      { label: "Via Failure Risk", val: "100% PROTECTED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_double_vias",
        label: "Execute redundant via doubling (`edit_power_via -min_vias_per_connection 2`) to ensure multi-cut via arrays on all power taps",
        correct: true,
        explanation: "Correct! Splitting current across 2 to 4 parallel via cuts cuts current per contact by half or more, eliminating via electromigration.",
      },
      {
        id: "opt_remove_via",
        label: "Delete the via and connect power wirelessly",
        correct: false,
        explanation: "Standard cells require physical galvanic contact to conduct power.",
      },
    ],
  },
  {
    id: 23,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Thermal Runaway Acceleration of EM Degradation at 125°C Junction Temperature",
    severity: "HIGH",
    stageName: "Voltus Electro-Thermal Co-Analysis",
    symptom: "At 125°C junction temperature, EM lifetime drops by 14x due to exponential Arrhenius temperature scaling (exp(Ea/kT)).",
    logSnippet: `[VOLTUS-THERMAL-01] Warning: Thermal acceleration of electromigration:
  Junction temperature T_j: 125.0 C (398.15 K).
  Arrhenius acceleration factor: 14.2x vs nominal 85.0 C.
  142 signal nets that pass at 85 C fail EM signoff at 125 C!`,
    principle: "Black's Equation contains an exponential thermal factor exp(Ea / kT), where Ea is activation energy (~0.9 eV for Copper). Higher operating temperature dramatically accelerates ion mobility in the metal lattice, causing EM failures to manifest years ahead of schedule.",
    remedyTcl: `set_rail_analysis_mode -temperature 125.0 -em_derate_with_temperature true
report_signal_em -temperature 125.0 -out_file thermal_em_125c.rpt
opt_design -post_route -em_hotspot_fixing`,
    beforeMetrics: [
      { label: "Signoff Junction Temp", val: "85 °C (Unrealistic)", bad: true },
      { label: "Failing EM Nets at 125°C", val: "142 Signal Nets", bad: true },
      { label: "Worst Case MTTF", val: "3.2 Years (Target: 15 Years)", bad: true },
    ],
    afterMetrics: [
      { label: "Signoff Junction Temp", val: "125 °C (Automotive Grade) ✓", bad: false },
      { label: "Failing EM Nets at 125°C", val: "0 Signal Nets ✓", bad: false },
      { label: "Worst Case MTTF", val: "22.5 Years ✓", bad: false },
    ],
    options: [
      {
        id: "opt_thermal_em_signoff",
        label: "Perform electro-thermal EM signoff at worst-case 125°C junction temperature and automatically widen/buffer all temperature-derated violators",
        correct: true,
        explanation: "Correct! Signing off EM at maximum junction temperature (125°C) guarantees silicon reliability even under peak thermal dissipation.",
      },
      {
        id: "opt_cool_with_liquid_nitrogen",
        label: "Require end customers to operate the chip in liquid nitrogen",
        correct: false,
        explanation: "Commercial and automotive chips must operate reliably in ambient consumer environments.",
      },
    ],
  },
  {
    id: 24,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Unidirectional vs Bidirectional Current Derating Mismatch on Bus Drivers",
    severity: "MEDIUM",
    stageName: "Signal EM Rule Ingestion",
    symptom: "Voltus flagged 320 bidirectional datapath nets as violating DC EM limits because the tool mode was set to unidirectional (DC) instead of AC.",
    logSnippet: `[VOLTUS-EM-RULE-04] Warning: EM model mismatch detected:
  Net 'data_bus[31]': Bidirectional switching signal treated as Pure DC.
  Reported J_dc: 3.8 mA/um2 (DC Limit: 2.0 mA/um2 - False Violation).
  Actual J_rms: 1.2 mA/um2 (AC Limit: 8.0 mA/um2 - MET).`,
    principle: "Pure DC current (unidirectional) continuously pushes metal atoms in one direction, creating rapid void formation. AC signals (bidirectional) push atoms back and forth, exhibiting self-healing effects where atoms partially return to vacancies. Using DC limits on AC nets causes thousands of false violations.",
    remedyTcl: `set_signal_em_analysis_mode -signal_type_derate true -recovery_factor 0.9
analyze_signal_em -results_dir em_ac_correct`,
    beforeMetrics: [
      { label: "Reported EM Violations", val: "320 Nets (False Positives)", bad: true },
      { label: "Signal Modeling", val: "Unidirectional DC (Incorrect)", bad: true },
      { label: "Engineering ECO Overhead", val: "3 Weeks of Wasted Layout", bad: true },
    ],
    afterMetrics: [
      { label: "Reported EM Violations", val: "0 False Violations ✓", bad: false },
      { label: "Signal Modeling", val: "Bidirectional AC with Healing ✓", bad: false },
      { label: "Engineering ECO Overhead", val: "0 Days ✓", bad: false },
    ],
    options: [
      {
        id: "opt_ac_em_modeling",
        label: "Enable bidirectional AC signal electromigration modeling with atom healing derating factors (`-signal_type_derate true`)",
        correct: true,
        explanation: "Correct! Accurately differentiating bidirectional AC signals from unidirectional DC power rails eliminates false violations and models physical healing.",
      },
      {
        id: "opt_delete_bus_wires",
        label: "Delete the violating bus wires",
        correct: false,
        explanation: "Deleting bus wires destroys the circuit.",
      },
    ],
  },
  {
    id: 25,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Blech Length (Short-Length Effect) Threshold Over-Constraining Sub-20 µm Nets",
    severity: "MEDIUM",
    stageName: "Signal EM Optimization",
    symptom: "Layout team manually widened 850 short 10 µm local net segments due to EM warnings, causing severe routing congestion.",
    logSnippet: `[VOLTUS-BLECH-01] Info: Short-length Blech effect applicable:
  Net length: 8.4 um. Current density J: 6.2 mA/um2.
  Product (J * L) = 52.08 A/cm (Foundry Blech Threshold: (J*L)_crit = 120 A/cm).
  Physical Status: EM Immune due to mechanical back-stress!`,
    principle: "The Blech Effect (short-length effect) dictates that if a metal segment length (L) satisfies (J · L) ≤ (J · L)_critical, mechanical compressive back-stress develops in the metal wire that balances electron momentum transfer, rendering the wire completely immune to electromigration.",
    remedyTcl: `set_signal_em_analysis_mode -enable_blech_effect true -blech_threshold 120.0
analyze_signal_em -results_dir signal_em_blech`,
    beforeMetrics: [
      { label: "Blech Optimization", val: "Disabled (Over-constrained)", bad: true },
      { label: "Unnecessary Wire Widening", val: "850 Short Nets", bad: true },
      { label: "M2 Routing Congestion", val: "84% (Severe Shorts)", bad: true },
    ],
    afterMetrics: [
      { label: "Blech Optimization", val: "Enabled (Physics-Aware) ✓", bad: false },
      { label: "Unnecessary Wire Widening", val: "0 Short Nets ✓", bad: false },
      { label: "M2 Routing Congestion", val: "38% (Clean Route) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_blech",
        label: "Enable Blech short-length immunity in Voltus (`-enable_blech_effect true`) to prune false EM violations on short segments",
        correct: true,
        explanation: "Correct! Enabling the Blech effect recognizes that short metal wires under mechanical back-stress are physically immune to EM, saving routing resources.",
      },
      {
        id: "opt_widen_all_wires",
        label: "Widen every wire in the entire chip to 10 µm width",
        correct: false,
        explanation: "Widening all wires to 10 µm creates millions of design rule shorts and makes the chip unroutable.",
      },
    ],
  },
  {
    id: 26,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "High-Drive Buffer Output Slew Rate Exploding Peak Current on Long Interconnects",
    severity: "HIGH",
    stageName: "Post-Route Timing & EM Optimization",
    symptom: "An ultra-high-drive buffer (BUFX48) driving a 1.2 mm net with 8 ps slew rate produces a 12 mA peak current spike that violates peak EM limits.",
    logSnippet: `[VOLTUS-PEAK-EM-03] Error: Peak current limit violation:
  Driver: u_dma/buf_clk_tree_0 (Cell: BUFX48_ASAP7).
  Net: dma_tx_strobe_long (Length: 1,240 um, Cap: 0.28 pF).
  Peak current I_peak: 12.4 mA (Foundry I_peak_max: 5.0 mA).`,
    principle: "Over-sized high-drive buffers with extremely steep transition slew rates dump large instantaneous peak currents (I = C · dV/dt) into capacitive interconnects. Peak current limits are enforced by foundries to avoid instantaneous metal mechanical shock and dielectric cracking.",
    remedyTcl: `eco_change_cell -inst u_dma/buf_clk_tree_0 -lib_cell BUFX16_ASAP7
eco_add_repeater -net dma_tx_strobe_long -cell BUFX16_ASAP7 -distance 400.0
analyze_signal_em`,
    beforeMetrics: [
      { label: "Driver Cell Size", val: "BUFX48 (Over-driven)", bad: true },
      { label: "Peak Current Slew", val: "12.4 mA (248% Limit)", bad: true },
      { label: "Peak EM Status", val: "VIOLATED", bad: true },
    ],
    afterMetrics: [
      { label: "Driver Cell Size", val: "BUFX16 + 2 Repeaters ✓", bad: false },
      { label: "Peak Current Slew", val: "3.1 mA (62% Limit) ✓", bad: false },
      { label: "Peak EM Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_downsize_and_repeat",
        label: "Downsize the overdriven buffer to BUFX16 and insert distributed repeaters along the 1.2 mm net to limit peak current per segment",
        correct: true,
        explanation: "Correct! Breaking long interconnects with distributed repeaters lowers the capacitive load seen by each driver, suppressing peak current (I = C·dV/dt).",
      },
      {
        id: "opt_upsize_to_bufx128",
        label: "Upsize the buffer to BUFX128 to make it even faster",
        correct: false,
        explanation: "Upsizing to BUFX128 triples peak current and worsens peak EM violation.",
      },
    ],
  },
  {
    id: 27,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Thermal Coupling Between Stacked High-Current Metal Layers (M6 over M5)",
    severity: "HIGH",
    stageName: "Voltus Thermal Gradient Modeling",
    symptom: "Co-aligned parallel M5 and M6 power straps experience 38°C mutual thermal heating, exceeding localized thermal EM budget.",
    logSnippet: `[VOLTUS-THERMAL-04] Warning: Inter-layer thermal mutual coupling:
  M5 Strap current: 8.2 mA, M6 Strap current: 11.4 mA.
  Mutual thermal resistance R_th: 420 K/W.
  Combined hotspot temperature: 132.5 C (Upper Safety Limit: 115.0 C).`,
    principle: "When high-current power straps run parallel directly on top of each other across adjacent metal layers (e.g. M5 and M6), heat generated by Joule dissipation is trapped within the low-thermal-conductivity inter-layer dielectric (ILD), causing localized thermal hotspots.",
    remedyTcl: `edit_power_mesh -offset_layer M6 -offset_delta 12.5 -direction orthogonal
analyze_power_grid_em -thermal_aware true`,
    beforeMetrics: [
      { label: "Inter-Layer Alignment", val: "Parallel Overlapping", bad: true },
      { label: "Local Hotspot Temp", val: "132.5 °C (Over Budget)", bad: true },
      { label: "Thermal EM Derating", val: "0.42x Current Budget", bad: true },
    ],
    afterMetrics: [
      { label: "Inter-Layer Alignment", val: "Orthogonal Cross-Grid ✓", bad: false },
      { label: "Local Hotspot Temp", val: "94.2 °C (Safe) ✓", bad: false },
      { label: "Thermal EM Derating", val: "1.00x Full Budget ✓", bad: false },
    ],
    options: [
      {
        id: "opt_orthogonal_mesh",
        label: "Enforce strictly orthogonal routing directions between adjacent layers (M5 Horizontal, M6 Vertical) to maximize heat dissipation area",
        correct: true,
        explanation: "Correct! Orthogonal routing minimizes thermal overlap to discrete crossing points, allowing heat to dissipate efficiently into surrounding dielectric.",
      },
      {
        id: "opt_wrap_in_insulation",
        label: "Add thermal insulation blankets around the metal wires",
        correct: false,
        explanation: "Adding thermal insulation traps heat and destroys the silicon die.",
      },
    ],
  },
  {
    id: 28,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "C4 Solder Bump Electromigration from Uneven Multi-Bump Current Sharing",
    severity: "CRITICAL",
    stageName: "Package & Bump EM Analysis",
    symptom: "Corner C4 power bump carries 680 mA while neighboring bumps carry only 80 mA, exceeding the 300 mA bump EM limit.",
    logSnippet: `[VOLTUS-BUMP-EM-01] Error: C4 solder bump electromigration limit violated:
  Bump ID: BUMP_VDD_CORNER_0 (X: 100, Y: 100).
  Current: 684.2 mA (Foundry C4 Bump Limit: 300.0 mA at 105 C).
  Under-Bump Metallization (UBM) voiding predicted within 6 months!`,
    principle: "If on-chip power trunks route unequally to C4 bump arrays, current naturally concentrates in the lowest-impedance path (usually outer corner bumps). Solder bump electromigration causes intermetallic voiding at the Under-Bump Metallization (UBM) interface.",
    remedyTcl: `redistribute_bump_currents -nets {VDD VSS} -max_current_per_bump 250.0
add_stripes -nets {VDD} -layer M9 -width 10.0 -spacing 5.0 -connect_to_bumps all
analyze_power_grid_em -include_package true`,
    beforeMetrics: [
      { label: "Corner Bump Current", val: "684.2 mA (228% Limit)", bad: true },
      { label: "Current Sharing Imbalance", val: "8.5x Ratio", bad: true },
      { label: "UBM Voiding Risk", val: "CRITICAL FAILURE", bad: true },
    ],
    afterMetrics: [
      { label: "Corner Bump Current", val: "185.0 mA (61% Limit) ✓", bad: false },
      { label: "Current Sharing Imbalance", val: "1.2x Ratio (Balanced) ✓", bad: false },
      { label: "UBM Voiding Risk", val: "100% RELIABLE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_balance_bump_mesh",
        label: "Synthesize a low-resistance M9 Redistribution Layer (RDL) mesh to balance current sharing across all parallel C4 power bumps",
        correct: true,
        explanation: "Correct! A thick RDL metal mesh distributes supply current evenly across all parallel solder bumps, eliminating localized current crowding.",
      },
      {
        id: "opt_disconnect_corner_bump",
        label: "Remove the corner bump completely",
        correct: false,
        explanation: "Removing bumps reduces total current delivery capacity and worsens drops on remaining bumps.",
      },
    ],
  },
  {
    id: 29,
    domainId: "em_signoff",
    domainName: "Electromigration (EM) Signoff",
    title: "Post-Route Metal Fill Inserting Dummy Vias in Critical EM Power Corridors",
    severity: "HIGH",
    stageName: "DFM / Signoff Fill Verification",
    symptom: "Automated dummy metal fill inserted floating vias too close to active M6 power stripes, reducing effective current carrying width.",
    logSnippet: `[VOLTUS-DFM-EM-05] Error: DFM fill proximity necking violation:
  Active stripe 'VDD' narrowed by 40% at (X: 1840, Y: 920) due to dummy fill exclusion cut.
  Local current density spiked from 3.8 mA/um2 to 8.4 mA/um2 (EM VIOLATION).`,
    principle: "Automated DFM metal fill insertion must strictly respect keepout margins around active power grid trunks. If dummy metal shapes cut into or restrict power stripe geometries, localized conductor necking creates high-resistance current pinch points.",
    remedyTcl: `set_db add_fill_exclude_pg_margin 1.5
remove_metal_fill -area {1800 850 1900 950}
add_metal_fill -layers {M5 M6 M7} -exclude_pg_margin 1.5
analyze_power_grid_em`,
    beforeMetrics: [
      { label: "Power Stripe Necking", val: "40% Cross-Section Loss", bad: true },
      { label: "Local Current Density", val: "8.4 mA/µm² (Failed)", bad: true },
      { label: "DFM Keepout Margin", val: "0.1 µm (Too Close)", bad: true },
    ],
    afterMetrics: [
      { label: "Power Stripe Necking", val: "0% (Full 2.0 µm Width) ✓", bad: false },
      { label: "Local Current Density", val: "3.8 mA/µm² (Passed) ✓", bad: false },
      { label: "DFM Keepout Margin", val: "1.5 µm (Standard DFM) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dfm_pg_keepout",
        label: "Apply 1.5 µm DFM metal fill exclusion keepouts around all active power grid trunks (`-exclude_pg_margin 1.5`)",
        correct: true,
        explanation: "Correct! Establishing proper exclusion keepouts prevents dummy metal fill algorithms from necking or trimming active power distribution conductors.",
      },
      {
        id: "opt_delete_all_power_grid",
        label: "Delete the power grid to make space for dummy fill",
        correct: false,
        explanation: "Deleting the power grid destroys chip functionality.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 4: POWER GATING & INRUSH CURRENT (10 Scenarios)
  // =========================================================================
  {
    id: 30,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Inrush Current Spike Tripping Neighboring Active Core Supply during Power-Up",
    severity: "CRITICAL",
    stageName: "Voltus Inrush Current Analysis / analyze_inrush_current",
    symptom: "Powering up the GPU domain creates an 8.5 A inrush current spike that collapses VDD_ALWAYS_ON by 190 mV, crashing running CPU cores.",
    logSnippet: `[VOLTUS-INRUSH-01] Error: Inrush current peak violation during wake-up:
  Switched Domain: 'PD_GPU' (Virtual VDD capacitance: 42.0 nF).
  Peak Inrush Current: 8.54 A at T_wakeup = 4.2 ns.
  Always-On Supply Drop: 192.4 mV on 'VDD_AON' (Crash threshold: 50.0 mV).
  Root Cause: All 12,000 MTCMOS header power switches enabled simultaneously.`,
    principle: "When a power-gated domain wakes up, its discharged virtual power rail (VDD_VIRTUAL = 0V) acts as a temporary short circuit. Governed by I_inrush = C_virtual · (dV/dt), enabling all sleep switches at once draws massive inrush current from the always-on grid, causing fatal supply collapse on neighboring active domains.",
    remedyTcl: `create_power_switch_cascade -domain PD_GPU -stages 4 -delay_between_stages 15.0 -buffer_cell CLKBUF_X4
set_inrush_analysis_mode -max_inrush_current 1.5 -max_aon_drop 0.030
analyze_inrush_current -domain PD_GPU -results_dir inrush_signoff`,
    beforeMetrics: [
      { label: "Peak Inrush Current", val: "8.54 A (Fatal Spike)", bad: true },
      { label: "VDD_AON Supply Drop", val: "192.4 mV (CPU Crashed)", bad: true },
      { label: "Switch Turn-On", val: "1-Stage Simultaneous", bad: true },
    ],
    afterMetrics: [
      { label: "Peak Inrush Current", val: "1.18 A (86% Reduction) ✓", bad: false },
      { label: "VDD_AON Supply Drop", val: "18.5 mV (Safe <30mV) ✓", bad: false },
      { label: "Switch Turn-On", val: "4-Stage Daisy Chain ✓", bad: false },
    ],
    options: [
      {
        id: "opt_daisy_chain_switches",
        label: "Configure a 4-stage daisy-chained MTCMOS power switch cascade with 15 ns inter-stage delay buffers to control dV/dt slew rate",
        correct: true,
        explanation: "Correct! Staggering the wake-up sequence across daisy-chained switch groups charges the virtual power rail gradually, keeping inrush current within safe limits.",
      },
      {
        id: "opt_remove_power_gating",
        label: "Remove power gating and leave the GPU permanently powered at 100% power",
        correct: false,
        explanation: "Removing power gating causes severe battery drain and violates mobile standby power targets.",
      },
      {
        id: "opt_turn_on_faster",
        label: "Turn on all switches in 1 picosecond using a nuclear pulse generator",
        correct: false,
        explanation: "Faster turn-on increases di/dt and worsens inrush current collapse.",
      },
    ],
  },
  {
    id: 31,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "MTCMOS Header Switch On-Resistance (R_on) IR Drop Penalty in High-Load State",
    severity: "HIGH",
    stageName: "Power Switch Sizing / Voltus Rail Analysis",
    symptom: "CPU core suffers 55 mV IR drop across MTCMOS power switches because switch count was under-budgeted (only 400 header cells inserted).",
    logSnippet: `[VOLTUS-PSW-02] Error: Power switch on-resistance drop excessive:
  Switched domain: 'PD_CPU' (Peak operating current: 1.8 A).
  Total inserted switch count: 400 cells (Effective R_on: 28.5 mOhm).
  Switch IR Drop (I * R_on): 51.3 mV (Budget: 15.0 mV).`,
    principle: "MTCMOS sleep transistors (header or footer switches) introduce series resistance (R_on) between the permanent supply and the virtual rail. In the active state, load current flowing through R_on causes a direct voltage penalty (V_drop = I_active · (R_on / N_switches)).",
    remedyTcl: `add_power_switches -domain PD_CPU -cell HEADER_X32 -checker_board -pitch_x 20.0 -pitch_y 20.0
check_power_switches -domain PD_CPU -max_ron_drop 0.015
analyze_rail -type static -domain PD_CPU`,
    beforeMetrics: [
      { label: "Switch Count", val: "400 Cells (Sparse)", bad: true },
      { label: "Effective R_on", val: "28.5 mΩ (High)", bad: true },
      { label: "Switch IR Drop", val: "51.3 mV (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Switch Count", val: "1,600 Cells (Optimized) ✓", bad: false },
      { label: "Effective R_on", val: "7.1 mΩ (Low) ✓", bad: false },
      { label: "Switch IR Drop", val: "12.8 mV (Passed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_increase_switch_density",
        label: "Increase header switch density by inserting 1,600 HEADER_X32 cells on a uniform 20x20 µm checkerboard grid to reduce effective R_on",
        correct: true,
        explanation: "Correct! Adding parallel header switches reduces total effective switch on-resistance (R_effective = R_single / N), shrinking active-state IR drop.",
      },
      {
        id: "opt_use_resistor",
        label: "Replace switches with 100-ohm discrete resistors",
        correct: false,
        explanation: "Resistors would cause massive, permanent voltage drops and prevent operation.",
      },
    ],
  },
  {
    id: 32,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Floating Inputs on Powered-Down Domain Causing Crowbar Leakage in Active Domain",
    severity: "CRITICAL",
    stageName: "UPF Isolation Rule Verification",
    symptom: "When CPU enters sleep mode, active Memory Controller inputs float, triggering 64 mA of CMOS crowbar short-circuit current.",
    logSnippet: `[VOLTUS-ISO-01] Error: Missing isolation cell on domain boundary:
  Net: u_cpu_top/data_out[127:0] -> u_mem_ctrl/data_in[127:0]
  Driver domain 'PD_CPU' is OFF (0V), Receiver domain 'PD_AON' is ON (0.8V).
  Floating input voltage: ~0.42 V (Mid-rail meta-stable state).
  Crowbar current per input buffer: 500 uA (Total: 64.0 mA leakage surge).`,
    principle: "When a power domain shuts down, its output pins drift to intermediate floating voltage levels (~0.3V - 0.5V). When connected to an active domain, mid-rail voltage turns ON both NMOS and PMOS transistors in the receiver's input inverter simultaneously, creating a destructive VDD-to-VSS crowbar short.",
    remedyTcl: `create_isolation_rule -name ISO_CPU_TO_AON -domain PD_CPU -isolation_power_net VDD_AON -isolation_ground_net VSS -clamp_value 0 -applies_to outputs
set_isolation_control ISO_CPU_TO_AON -domain PD_CPU -isolation_signal iso_en -isolation_sense high
place_opt_design -incremental
check_lp_design -type isolation`,
    beforeMetrics: [
      { label: "Boundary Isolation", val: "0% (Missing Isolation Cells)", bad: true },
      { label: "Floating Input Nets", val: "128 Cross-Domain Nets", bad: true },
      { label: "Sleep Crowbar Leakage", val: "64.0 mA (Destructive)", bad: true },
    ],
    afterMetrics: [
      { label: "Boundary Isolation", val: "100% (ISO Cells Clamped) ✓", bad: false },
      { label: "Floating Input Nets", val: "0 Nets ✓", bad: false },
      { label: "Sleep Crowbar Leakage", val: "0.02 mA (Clean Standby) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_upf_isolation",
        label: "Define UPF isolation rules clamping all cross-domain outputs to 0 (`create_isolation_rule -clamp_value 0`) powered by VDD_AON",
        correct: true,
        explanation: "Correct! Isolation cells clamp floating inputs to a defined logical state (0 or 1) during sleep mode, eliminating crowbar short-circuit current.",
      },
      {
        id: "opt_ignore_floating_inputs",
        label: "Ignore floating inputs and allow crowbar current to keep the chip warm",
        correct: false,
        explanation: "Crowbar current drains battery rapidly and can trigger thermal silicon breakdown.",
      },
    ],
  },
  {
    id: 33,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "State Retention Power Gating (SRPG) Balloon Latch Power Rail Short",
    severity: "HIGH",
    stageName: "State Retention Insertion / Voltus Power Check",
    symptom: "State retention registers lose saved CPU architectural state upon wake-up because retention shadow latches were tied to switched VDD.",
    logSnippet: `[VOLTUS-RET-02] Error: Retention register power connection violation:
  Instance: u_cpu/core_reg_bank_31 (Cell: RET_DFF_X2).
  Shadow balloon latch power pin 'VDD_RET' connected to switched rail 'VDD_CPU_SW' instead of 'VDD_AON'.
  State retention reliability: 0% (Data lost during sleep mode!).`,
    principle: "State Retention Power Gating (SRPG) registers contain a primary master/slave flip-flop and a low-leakage backup shadow latch (balloon latch). The balloon latch MUST be connected to the un-switched always-on supply (VDD_AON) to preserve register state while the main cell body is powered off.",
    remedyTcl: `sroute -connect {retention_pins} -nets {VDD_AON} -instance_type retention_cells
check_power_grid -nets {VDD_AON VDD_CPU_SW} -check_retention true
analyze_rail -type static`,
    beforeMetrics: [
      { label: "Balloon Latch Power", val: "Connected to Switched VDD", bad: true },
      { label: "State Retention Rate", val: "0% (All State Lost)", bad: true },
      { label: "Wake-Up Latency", val: "Full Cold Reset Required", bad: true },
    ],
    afterMetrics: [
      { label: "Balloon Latch Power", val: "Connected to VDD_AON ✓", bad: false },
      { label: "State Retention Rate", val: "100% Preserved ✓", bad: false },
      { label: "Wake-Up Latency", val: "5 Clock Cycles (Fast Resume) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_route_retention_power",
        label: "Execute `sroute -connect {retention_pins} -nets {VDD_AON}` to route dedicated always-on power to shadow balloon latches",
        correct: true,
        explanation: "Correct! Supplying always-on power to retention balloon latches guarantees full register state preservation across power-down cycles.",
      },
      {
        id: "opt_save_to_flash",
        label: "Save all registers to external NAND Flash on every clock cycle",
        correct: false,
        explanation: "Writing to external Flash on every cycle destroys system performance and wears out Flash endurance in minutes.",
      },
    ],
  },
  {
    id: 34,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Header (PMOS) vs Footer (NMOS) Switch Selection for High-Density Layout",
    severity: "MEDIUM",
    stageName: "Power Architecture Selection",
    symptom: "Using Footer (NMOS) switches caused substrate noise injection into sensitive analog PLL circuits sharing the common p-substrate.",
    logSnippet: `[VOLTUS-NOISE-04] Warning: Substrate noise coupling from footer switches:
  Switched domain 'PD_DIGITAL' using Virtual VSS footer gating.
  Virtual ground bounce during switching: 85 mV.
  Substrate noise coupled into adjacent Analog PLL: Jitter degraded from 1.2 ps to 14.8 ps!`,
    principle: "Footer switches (NMOS) gate the VSS ground rail. When virtual ground bounces during switching, noise easily couples through the shared conductive p-substrate into sensitive analog/RF circuits. Header switches (PMOS) gate VDD and contain noise within isolated N-wells.",
    remedyTcl: `create_power_switch -domain PD_DIGITAL -type header -cell HEADER_X32_ASAP7 -power_net VDD -virtual_power_net VDD_VIRTUAL
analyze_noise -substrate_coupling true`,
    beforeMetrics: [
      { label: "Power Switch Type", val: "Footer NMOS (Ground Gated)", bad: true },
      { label: "Substrate Noise Level", val: "85 mV (High Coupling)", bad: true },
      { label: "Analog PLL Jitter", val: "14.8 ps (Violated)", bad: true },
    ],
    afterMetrics: [
      { label: "Power Switch Type", val: "Header PMOS (VDD Gated) ✓", bad: false },
      { label: "Substrate Noise Level", val: "2.1 mV (Isolated) ✓", bad: false },
      { label: "Analog PLL Jitter", val: "1.1 ps (Clean Phase Lock) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_switch_to_header",
        label: "Replace footer NMOS switches with header PMOS switches to isolate switching noise inside N-wells and protect analog substrate integrity",
        correct: true,
        explanation: "Correct! Header PMOS switches isolate virtual rail switching transients inside separate N-wells, preventing substrate noise injection into sensitive analog blocks.",
      },
      {
        id: "opt_remove_ground",
        label: "Remove ground pins from the PLL",
        correct: false,
        explanation: "Removing ground prevents the PLL from functioning.",
      },
    ],
  },
  {
    id: 35,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Power Switch Enable Daisy-Chain Slew Rate Buffer Cascade Inadequacy",
    severity: "HIGH",
    stageName: "Power Switch Cascade Optimization",
    symptom: "Sleep control signal slew rate degrades to 4.2 ns across 8,000 un-buffered power switches, creating race conditions during sleep entry.",
    logSnippet: `[VOLTUS-SLEW-03] Error: Sleep control line transition slew violation:
  Net: u_pwr_ctrl/pwr_gate_en_chain
  Fanout: 8,200 power switch enable pins. Slew rate: 4.25 ns (Limit: 0.25 ns).
  Partial turn-off state causing 18.2 mA of intermediate subthreshold leakage.`,
    principle: "Power switch enable networks have massive cumulative gate capacitance. Driving thousands of switches without dedicated buffer tree cascades causes sluggish slew rates, leaving transistors in high-leakage intermediate conduction zones for nanoseconds.",
    remedyTcl: `create_power_switch_cascade -domain PD_CORE -stages 8 -buffer_cell CLKBUF_X16 -max_transition 0.20
synthesize_power_switch_tree -domain PD_CORE
report_power_switches -summary`,
    beforeMetrics: [
      { label: "Sleep Signal Slew Rate", val: "4.25 ns (Sluggish)", bad: true },
      { label: "Intermediate Leakage", val: "18.2 mA (High)", bad: true },
      { label: "Buffer Cascade Stages", val: "0 (Unbuffered)", bad: true },
    ],
    afterMetrics: [
      { label: "Sleep Signal Slew Rate", val: "0.14 ns (Crisp) ✓", bad: false },
      { label: "Intermediate Leakage", val: "0.01 mA (Instant Cutoff) ✓", bad: false },
      { label: "Buffer Cascade Stages", val: "8-Stage Tree (Balanced) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_synthesize_switch_tree",
        label: "Synthesize a balanced buffer tree cascade (`synthesize_power_switch_tree`) to maintain sharp 0.20 ns transition slews across all power switches",
        correct: true,
        explanation: "Correct! Dedicated buffer tree distribution ensures crisp sleep signal transitions, switching power transistors cleanly between full conduction and cutoff.",
      },
      {
        id: "opt_drive_with_min_inverter",
        label: "Drive all 8,000 switches directly from a single INVX1 gate",
        correct: false,
        explanation: "A single INVX1 gate will have an even worse slew rate (>20 ns).",
      },
    ],
  },
  {
    id: 36,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Always-On Buffer Power Rail Routing DRC Short with Switched Power Mesh",
    severity: "CRITICAL",
    stageName: "Physical Verification / LVS / Voltus PG Check",
    symptom: "LVS reports short circuit between VDD_AON and VDD_SW because an always-on buffer power pin tapped the switched M1 rail.",
    logSnippet: `[VOLTUS-LVS-SHORT] Fatal Error: Power domain short circuit detected:
  Net 'VDD_AON' shorted to 'VDD_SW' at Instance: u_iso_ctrl/aon_buf_42 (X: 450.2, Y: 880.4).
  Result: Power-gated domain can NEVER turn off (Permanent 120 mW power leak!).`,
    principle: "Always-on buffers residing in switchable power domains have dedicated secondary power pins (VDD_AON). If standard cell placement places an AON cell directly over a switched M1 rail without routing keepouts, a hard short forms between permanent and switched power supplies.",
    remedyTcl: `create_cell_pad -insts [get_db insts -if {.is_always_on == true}] -halo {1.0 1.0 1.0 1.0}
sroute -connect {secondary_pg_pins} -nets {VDD_AON}
check_power_grid -nets {VDD_AON VDD_SW}`,
    beforeMetrics: [
      { label: "Power Rail Short", val: "VDD_AON <-> VDD_SW SHORTED", bad: true },
      { label: "Power-Down Capability", val: "COMPLETELY BROKEN", bad: true },
      { label: "Standby Power Drain", val: "120 mW (Permanent Leak)", bad: true },
    ],
    afterMetrics: [
      { label: "Power Rail Short", val: "0 Shorts (100% Isolated) ✓", bad: false },
      { label: "Power-Down Capability", val: "Fully Functional ✓", bad: false },
      { label: "Standby Power Drain", val: "0.04 mW (Power-Gated) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_isolate_aon_power",
        label: "Apply placement halos around AON cells and route dedicated secondary VDD_AON connections to eliminate short circuits",
        correct: true,
        explanation: "Correct! Placing halos and dedicated secondary routing guarantees galvanic isolation between always-on and switched power domains.",
      },
      {
        id: "opt_merge_power_rails",
        label: "Merge VDD_AON and VDD_SW into a single net",
        correct: false,
        explanation: "Merging the rails completely destroys power gating.",
      },
    ],
  },
  {
    id: 37,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Wake-Up Acknowledgment Handshake FSM Metastability Glitch",
    severity: "HIGH",
    stageName: "Power Management Unit (PMU) Timing Verification",
    symptom: "PMU releases core reset before virtual VDD reaches 95% threshold, causing uninitialized register states and processor lockup.",
    logSnippet: `[VOLTUS-PMU-02] Error: Premature reset release during wake-up sequence:
  Virtual VDD voltage at reset deassertion: 0.48 V (Required: >0.72 V).
  Power Good (pwr_ok) signal asserted 24 ns too early due to un-synchronized analog comparator output.`,
    principle: "The power management handshake sequence must follow strict ordering: Sleep Deassert → Daisy-Chain Switch On → Virtual Rail Charge to >95% VDD → Analog Power-Good Assert → Synchronizer → Isolation Disable → Reset Deassert. Skipping or glitching any step corrupts digital logic states.",
    remedyTcl: `set_power_sequence -domain PD_CPU \\
  -event_order {sleep_low 0.0, switches_on 10.0, pwr_good_high 40.0, iso_low 45.0, rst_high 50.0}
check_power_sequence -domain PD_CPU`,
    beforeMetrics: [
      { label: "Voltage at Reset Release", val: "0.48 V (Unstable)", bad: true },
      { label: "PMU FSM Glitch Risk", val: "FATAL BOOT LOCKUP", bad: true },
      { label: "Power-Good Timing", val: "24 ns Premature", bad: true },
    ],
    afterMetrics: [
      { label: "Voltage at Reset Release", val: "0.78 V (>97% VDD) ✓", bad: false },
      { label: "PMU FSM Glitch Risk", val: "0% (Glitch-Free) ✓", bad: false },
      { label: "Power-Good Timing", val: "50 ns Validated Delay ✓", bad: false },
    ],
    options: [
      {
        id: "opt_correct_power_sequence",
        label: "Enforce strict UPF/CPF power sequence timing with 2-FF synchronization on the analog Power-Good comparator signal",
        correct: true,
        explanation: "Correct! Synchronizing Power-Good and enforcing strict sequencing guarantees the core reset is only released after virtual VDD is fully stable.",
      },
      {
        id: "opt_remove_reset",
        label: "Remove reset from the CPU",
        correct: false,
        explanation: "CPUs require reset to initialize execution vectors and pipeline state.",
      },
    ],
  },
  {
    id: 38,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Virtual Ground Rail (VSS_VIRTUAL) Sizing Bottleneck in Low-Power DSP",
    severity: "MEDIUM",
    stageName: "Footer Power Gating Mesh Synthesis",
    symptom: "DSP core experiences 62 mV virtual ground bounce under 1.2 GHz FIR filtering due to narrow M2 footer distribution stripes.",
    logSnippet: `[VOLTUS-FOOTER-03] Warning: Virtual VSS rail resistance bottleneck:
  Domain: 'PD_DSP' (Footer gated).
  Peak return current: 1.2 A. Virtual ground bounce: 62.4 mV.
  M2 Virtual VSS stripe width: 0.28 um (Effective R: 52 mOhm).`,
    principle: "In footer power gating, return current flows through a virtual VSS mesh before passing through footer NMOS switches to real VSS. An undersized virtual ground mesh creates high series resistance, causing virtual ground bounce that degrades noise margins.",
    remedyTcl: `add_stripes -nets {VSS_VIRTUAL} -layer M4 -width 1.5 -spacing 1.5 -set_to_set_distance 20.0
analyze_rail -type dynamic -domain PD_DSP`,
    beforeMetrics: [
      { label: "Virtual Ground Bounce", val: "62.4 mV (Failed)", bad: true },
      { label: "Virtual VSS Stripe Width", val: "0.28 µm (M2 Thin)", bad: true },
      { label: "FIR Filter Noise Margin", val: "-38% (Degraded)", bad: true },
    ],
    afterMetrics: [
      { label: "Virtual Ground Bounce", val: "14.1 mV (Passed) ✓", bad: false },
      { label: "Virtual VSS Stripe Width", val: "1.50 µm (M4 Thick) ✓", bad: false },
      { label: "FIR Filter Noise Margin", val: "100% NOMINAL ✓", bad: false },
    ],
    options: [
      {
        id: "opt_widen_virtual_vss",
        label: "Upgrade virtual VSS distribution to M4 with 1.5 µm stripe width and 20 µm pitch to lower return grid resistance",
        correct: true,
        explanation: "Correct! Widening virtual VSS metal stripes reduces series resistance to footer switches, suppressing ground bounce.",
      },
      {
        id: "opt_short_to_vdd",
        label: "Short virtual ground to VDD",
        correct: false,
        explanation: "Shorting ground to VDD causes a fatal direct short circuit.",
      },
    ],
  },
  {
    id: 39,
    domainId: "power_gating_switches",
    domainName: "Power Gating & Inrush Current",
    title: "Sleep Transistor Well Bias Tying Violation Inducing Latch-Up",
    severity: "HIGH",
    stageName: "Physical Cell DRC / Voltus Latch-Up Audit",
    symptom: "Foundry DRC flags 1,200 header switch cells for N-well bias rule violations because PMOS N-wells were tied to virtual VDD.",
    logSnippet: `[VOLTUS-LATCHUP-03] Fatal Error: Header switch well bias violation:
  Instance: u_pwr_sw/HDR_SW_120 (Cell: HEADER_X32).
  N-well pin 'NW' connected to switched 'VDD_VIRTUAL' instead of permanent 'VDD_PERM'.
  Risk: Forward-biased p-n junction when VDD_VIRTUAL drops, triggering fatal CMOS latch-up!`,
    principle: "PMOS header switch N-wells MUST always be tied to the highest permanent voltage (VDD_PERM). If N-wells are tied to the switched virtual rail (VDD_VIRTUAL), then during power-down or transient dips, the permanent source-to-well p-n junction becomes forward-biased, triggering destructive CMOS latch-up.",
    remedyTcl: `sroute -connect {nwell_pins} -nets {VDD_PERM} -instance_type power_switches
check_well_taps -nets {VDD_PERM} -verbose`,
    beforeMetrics: [
      { label: "Header N-well Connection", val: "Tied to VDD_VIRTUAL (DANGEROUS)", bad: true },
      { label: "Well Bias DRC Violations", val: "1,200 Cell Errors", bad: true },
      { label: "Silicon Reliability", val: "FATAL LATCH-UP HAZARD", bad: true },
    ],
    afterMetrics: [
      { label: "Header N-well Connection", val: "Tied to VDD_PERM ✓", bad: false },
      { label: "Well Bias DRC Violations", val: "0 Violations ✓", bad: false },
      { label: "Silicon Reliability", val: "100% LATCH-UP IMMUNE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_tie_nwell_to_perm",
        label: "Execute `sroute` to connect all header switch N-well tap pins strictly to permanent un-gated VDD_PERM",
        correct: true,
        explanation: "Correct! Tying header PMOS N-wells to permanent VDD ensures the source-well p-n junctions remain permanently reverse-biased, preventing latch-up.",
      },
      {
        id: "opt_leave_nwell_floating",
        label: "Leave N-wells floating with no connection",
        correct: false,
        explanation: "Floating N-wells result in unpredictable threshold shifts and guaranteed latch-up destruction.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 5: MULTI-VOLTAGE & UPF INTEGRITY (10 Scenarios)
  // =========================================================================
  {
    id: 40,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Low-to-High Level Shifter Missing on 0.65V to 0.95V Cross-Domain Bus",
    severity: "CRITICAL",
    stageName: "UPF Multi-Voltage Verification / check_lp_design",
    symptom: "64-bit bus driving from 0.65V CPU core directly into 0.95V I/O controller causes severe crowbar leakage and logic false switching.",
    logSnippet: `[VOLTUS-LP-01] Error: Missing Low-to-High Level Shifter:
  Net: u_cpu/dcache_addr[31:0] (Domain: PD_LOW_VOLT @ 0.65V -> Domain: PD_HIGH_VOLT @ 0.95V).
  Driver high output voltage V_oh = 0.65V fails to turn off PMOS transistor in 0.95V receiver inverter.
  Crowbar current: 2.4 mA per gate (Total: 153.6 mA continuous DC short!).`,
    principle: "When a signal transitions from a lower voltage domain (0.65V) to a higher voltage domain (0.95V), the 0.65V logical '1' is insufficient to turn OFF the PMOS pull-up transistor in the 0.95V receiver gate (V_gs = 0.65V - 0.95V = -0.30V). This causes continuous crowbar current and severe voltage level degradation.",
    remedyTcl: `create_level_shifter_rule -name LS_LOW_TO_HIGH -domain PD_LOW_VOLT -applies_to outputs -rule low_to_high
set_level_shifter_cell -name LS_LOW_TO_HIGH -cell LVLBUF_LH_X4 -power_net VDD_0P95 -ground_net VSS
place_opt_design -incremental
check_lp_design -type level_shifter`,
    beforeMetrics: [
      { label: "Cross-Domain Level Shifting", val: "0% (Missing Level Shifters)", bad: true },
      { label: "Crowbar DC Current", val: "153.6 mA (Massive Leak)", bad: true },
      { label: "Signal Logic Integrity", val: "FAILED (False Switching)", bad: true },
    ],
    afterMetrics: [
      { label: "Cross-Domain Level Shifting", val: "100% Dual-Rail LS Inserted ✓", bad: false },
      { label: "Crowbar DC Current", val: "0.01 mA ✓", bad: false },
      { label: "Signal Logic Integrity", val: "100% CLEAN 0.95V SWING ✓", bad: false },
    ],
    options: [
      {
        id: "opt_insert_lh_level_shifters",
        label: "Define UPF low-to-high level shifter rules (`create_level_shifter_rule -rule low_to_high`) inserting dual-rail LVLBUF_LH cells",
        correct: true,
        explanation: "Correct! Low-to-high level shifters use cross-coupled PMOS differential stages to translate 0.65V logic cleanly to 0.95V without crowbar current.",
      },
      {
        id: "opt_increase_low_voltage",
        label: "Raise the low-voltage domain to 0.95V and give up on low-power scaling",
        correct: false,
        explanation: "Running the whole chip at 0.95V increases dynamic power by >100%, violating power limits.",
      },
      {
        id: "opt_use_single_inverter",
        label: "Insert a standard 0.65V inverter in the 0.95V domain",
        correct: false,
        explanation: "A standard inverter in the wrong power domain will still suffer from crowbar conduction.",
      },
    ],
  },
  {
    id: 41,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Level Shifter Cell Placed in Wrong Power Domain Violating Secondary Power Rail",
    severity: "HIGH",
    stageName: "Physical Cell Legalization / sroute",
    symptom: "Dual-rail level shifter cells placed in 0.65V domain cannot connect their secondary VDD_0P95 power pin without DRC cross-domain shorts.",
    logSnippet: `[VOLTUS-LS-LOC] Error: Level shifter domain placement violation:
  Instance: u_ls_top/ls_cell_48 (Cell: LVLBUF_LH_X4).
  Primary power: VDD_0P65, Secondary power: VDD_0P95.
  Placed inside: PD_LOW_VOLT (0.65V domain).
  DRC Error: Secondary power rail routing creates 48 M1 shorts across 0.65V rows.`,
    principle: "Low-to-high level shifters require dual power rails (input domain supply and output domain supply). Best practice is to place level shifters either inside dedicated multi-voltage interface rows or inside the destination (higher voltage) domain to simplify secondary rail routing.",
    remedyTcl: `create_voltage_area -name VA_INTERFACE -power_nets {VDD_0P65 VDD_0P95} -area {400 1200 600 1400}
set_db [get_db insts -if {.is_level_shifter == true}].voltage_area VA_INTERFACE
place_opt_design -incremental
sroute -connect {primary_and_secondary_pg_pins}`,
    beforeMetrics: [
      { label: "Level Shifter Placement", val: "Arbitrary in 0.65V Domain", bad: true },
      { label: "Secondary Rail DRC Shorts", val: "48 M1 Shorts", bad: true },
      { label: "Multi-Voltage Signoff", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Level Shifter Placement", val: "Dedicated Dual-Rail Interface Area ✓", bad: false },
      { label: "Secondary Rail DRC Shorts", val: "0 Shorts ✓", bad: false },
      { label: "Multi-Voltage Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dual_rail_voltage_area",
        label: "Create a dedicated dual-rail voltage interface area (`create_voltage_area`) with hybrid power rails for clean level shifter placement",
        correct: true,
        explanation: "Correct! Grouping level shifters into dedicated dual-rail voltage boundaries allows automated clean routing of both primary and secondary power rails.",
      },
      {
        id: "opt_delete_secondary_pin",
        label: "Cut off the secondary power pin in the LEF file",
        correct: false,
        explanation: "Cutting the secondary pin breaks the level shifter's internal level translation circuitry.",
      },
    ],
  },
  {
    id: 42,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Isolation Clamp Value Mismatch on Active-Low Reset Causing Post-Wakeup Lockup",
    severity: "CRITICAL",
    stageName: "UPF Isolation Verification",
    symptom: "Active-low reset signal 'rst_core_n' clamped to 0 during sleep, asserting reset continuously and freezing the core upon wake-up.",
    logSnippet: `[VOLTUS-ISO-04] Error: Isolation clamp value logic conflict:
  Signal: 'rst_core_n' (Active-Low asynchronous reset).
  UPF Rule: 'ISO_DEFAULT' clamped all domain outputs to '0'.
  Functional Consequence: 'rst_core_n' clamped to 0 (Active Reset asserted during sleep!).
  Post-Wakeup: Reset state machine stuck in permanent reset freeze.`,
    principle: "Isolation clamp values must match the inactive (quiescent) state of the receiving logic. Clamping an active-low signal (like rst_n or enable_n) to 0 asserts the active condition during sleep, triggering unintended resets or pipeline corruptions.",
    remedyTcl: `create_isolation_rule -name ISO_RESET_N -domain PD_CPU -pins {rst_core_n} -clamp_value 1 -applies_to outputs
set_isolation_control ISO_RESET_N -domain PD_CPU -isolation_signal iso_en -isolation_sense high
check_lp_design -type isolation`,
    beforeMetrics: [
      { label: "Reset Clamp Value", val: "0 (ACTIVE RESET - CONFLICT)", bad: true },
      { label: "Core Wake-Up Status", val: "PERMANENT SYSTEM LOCKUP", bad: true },
      { label: "UPF Consistency Check", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Reset Clamp Value", val: "1 (INACTIVE RESET - CLEAN) ✓", bad: false },
      { label: "Core Wake-Up Status", val: "CLEAN BOOT & RESUME ✓", bad: false },
      { label: "UPF Consistency Check", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_clamp_to_1",
        label: "Specify `-clamp_value 1` specifically for active-low control and reset signals in the UPF isolation specification",
        correct: true,
        explanation: "Correct! Clamping active-low signals to logical '1' maintains the inactive state during sleep, preventing false reset assertion.",
      },
      {
        id: "opt_invert_reset_twice",
        label: "Add two inverters without changing the clamp rule",
        correct: false,
        explanation: "Two inverters leave the logical polarity unchanged, failing to resolve the clamp conflict.",
      },
    ],
  },
  {
    id: 43,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "UPF Power State Table (PST) Illegal Operating State Transition",
    severity: "HIGH",
    stageName: "UPF Power State Table Verification / check_pst",
    symptom: "PST verification reports an unconstrained power state where CPU runs at 0.95V while Memory Controller is powered off (0V).",
    logSnippet: `[VOLTUS-PST-01] Error: Illegal Power State Table combination:
  State 'PST_ILLEGAL_BURST': VDD_CPU = 0.95V, VDD_MEM = 0.00V, VDD_AON = 0.80V.
  Violation: Level shifters between CPU and MEM lack isolation protection for un-powered receiver domain!`,
    principle: "A Power State Table (PST) formally defines all valid operational voltage combinations across all domains. Any operational mode where domain voltages diverge without corresponding bidirectional isolation and level shifting will cause chip malfunction.",
    remedyTcl: `add_power_state -table PST_TABLE -state STATE_ACTIVE {0.95 0.80 0.80}
add_power_state -table PST_TABLE -state STATE_STANDBY {0.00 0.00 0.80}
add_power_state -table PST_TABLE -state STATE_LOW_POWER {0.65 0.65 0.80}
check_pst -table PST_TABLE`,
    beforeMetrics: [
      { label: "PST Valid States", val: "Inconsistent (Illegal States)", bad: true },
      { label: "Cross-Domain Hazards", val: "3 Unisolated Modes", bad: true },
      { label: "PST Signoff", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "PST Valid States", val: "Formally Verified (3 Legal States) ✓", bad: false },
      { label: "Cross-Domain Hazards", val: "0 Hazards ✓", bad: false },
      { label: "PST Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_formal_pst_table",
        label: "Formally constrain valid multi-voltage state combinations in the UPF Power State Table (`add_power_state`) and verify with `check_pst`",
        correct: true,
        explanation: "Correct! A complete and formally verified PST ensures that all voltage domain relationships are fully protected by isolation and level shifting across all operating modes.",
      },
      {
        id: "opt_delete_pst",
        label: "Delete the Power State Table to bypass checks",
        correct: false,
        explanation: "Deleting the PST removes voltage constraints, leading to unverified multi-voltage silicon failures.",
      },
    ],
  },
  {
    id: 44,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "High-to-Low Voltage Domain Interface Timing Violation from Level Shifter Insertion Delay",
    severity: "MEDIUM",
    stageName: "Multi-Voltage STA Timing Closure",
    symptom: "Inserting high-to-low level shifters added 65 ps propagation delay, causing setup violation on 1.2 GHz critical path.",
    logSnippet: `[VOLTUS-TIMING-03] Error: Setup timing violation on level-shifted path:
  Path: u_high_core/data_out_reg/CK -> u_ls/LVLBUF_HL_X1/Z -> u_low_core/data_in_reg/D
  Slack: -42 ps (Late Corner). Level shifter cell delay: 65.4 ps.`,
    principle: "While High-to-Low level shifting can theoretically be performed by standard inverters, dual-rail level shifters provide clean threshold tracking but introduce series propagation delay that must be budgeted during multi-voltage STA timing closure.",
    remedyTcl: `opt_design -post_route -voltage_aware
eco_change_cell -inst u_ls/LVLBUF_HL_X1 -lib_cell LVLBUF_HL_X8
report_timing -late -view func_ss_view`,
    beforeMetrics: [
      { label: "Level Shifter Delay", val: "65.4 ps (BUFX1)", bad: true },
      { label: "Path Slack WNS", val: "-42 ps (Violated)", bad: true },
      { label: "Timing Status", val: "SETUP FAIL", bad: true },
    ],
    afterMetrics: [
      { label: "Level Shifter Delay", val: "21.2 ps (BUFX8) ✓", bad: false },
      { label: "Path Slack WNS", val: "+14 ps (Met) ✓", bad: false },
      { label: "Timing Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_upsize_level_shifter",
        label: "Upsize the high-to-low level shifter to a high-drive cell (LVLBUF_HL_X8) to reduce propagation delay by 44 ps",
        correct: true,
        explanation: "Correct! Upsizing the level shifter reduces internal RC delays, recovering setup timing margin on high-speed cross-domain paths.",
      },
      {
        id: "opt_remove_level_shifter",
        label: "Delete the level shifter and let the 0.95V signal overdrive the 0.65V gate",
        correct: false,
        explanation: "Directly driving a 0.65V thin gate-oxide transistor with 0.95V causes time-dependent dielectric breakdown (TDDB) and burns out the gate.",
      },
    ],
  },
  {
    id: 45,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Multi-Voltage Power Net Naming Discrepancy in Synthesis vs PnR UPF Handoff",
    severity: "HIGH",
    stageName: "Design Ingestion / read_power_intent",
    symptom: "Innovus fails to bind 240 level shifter power pins because synthesis UPF used 'VDD_CORE_LOW' while floorplan used 'VDD_L'.",
    logSnippet: `[VOLTUS-UPF-ERR-11] Error: Power supply net binding failure:
  UPF supply net 'VDD_CORE_LOW' not found in Innovus power grid database.
  240 Level shifter secondary power pins remain un-connected!`,
    principle: "Power Intent specifications (UPF 2.1 / 3.0) must maintain exact naming parity between logical synthesis (`read_power_intent`) and physical floorplan database supplies. Supply net aliasing must be explicitly declared if hierarchy names differ.",
    remedyTcl: `create_supply_net VDD_L -domain PD_LOW
connect_supply_net VDD_L -ports {VDD_CORE_LOW}
commit_power_intent
check_power_intent -verbose`,
    beforeMetrics: [
      { label: "UPF Supply Binding", val: "UNBOUND (Name Mismatch)", bad: true },
      { label: "Unconnected LS Pins", val: "240 Secondary Pins", bad: true },
      { label: "Floorplan Ingestion", val: "FATAL ERROR", bad: true },
    ],
    afterMetrics: [
      { label: "UPF Supply Binding", val: "100% Bound & Mapped ✓", bad: false },
      { label: "Unconnected LS Pins", val: "0 Pins ✓", bad: false },
      { label: "Floorplan Ingestion", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_alias_supply_nets",
        label: "Declare supply net aliasing (`connect_supply_net VDD_L -ports {VDD_CORE_LOW}`) in the top-level UPF configuration",
        correct: true,
        explanation: "Correct! Supply net aliasing explicitly bridges logical synthesis supply port names with physical P&R power net names.",
      },
      {
        id: "opt_ignore_upf_errors",
        label: "Ignore UPF binding errors and proceed to tapeout",
        correct: false,
        explanation: "Proceeding with unbound power nets results in manufactured silicon with unpowered level shifters.",
      },
    ],
  },
  {
    id: 46,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Always-On Power Distribution Mesh Sheet Resistance Drop in Sleep State",
    severity: "MEDIUM",
    stageName: "Voltus Sleep State Rail Analysis",
    symptom: "During standby sleep mode, VDD_AON drops by 45 mV because only one thin M4 stripe was routed for the always-on grid.",
    logSnippet: `[VOLTUS-AON-02] Warning: Always-on grid IR drop during sleep mode:
  VDD_AON worst drop: 45.2 mV (Threshold: 20.0 mV).
  Active cells during sleep: 4,500 retention latches, PMU state machine, timer.
  Total AON sleep current: 8.4 mA through high-resistance M4 strap.`,
    principle: "Although sleep mode current is small compared to active current, always-on logic (retention latches, timers, wake-up detectors) is spread across the entire die. A sparse or thin AON power grid can still suffer significant IR drop, threatening retention stability.",
    remedyTcl: `add_stripes -nets {VDD_AON} -layer M6 -width 2.0 -spacing 2.0 -set_to_set_distance 40.0
analyze_rail -type static -domain AON_DOMAIN`,
    beforeMetrics: [
      { label: "AON Sleep IR Drop", val: "45.2 mV (Failed)", bad: true },
      { label: "AON Grid Layer", val: "M4 (Thin Single Stripe)", bad: true },
      { label: "Retention Voltage Margin", val: "Dangerous (Near VDD_min)", bad: true },
    ],
    afterMetrics: [
      { label: "AON Sleep IR Drop", val: "6.8 mV (Passed) ✓", bad: false },
      { label: "AON Grid Layer", val: "M6 2.0 µm Grid ✓", bad: false },
      { label: "Retention Voltage Margin", val: "Safe & Robust ✓", bad: false },
    ],
    options: [
      {
        id: "opt_upgrade_aon_grid",
        label: "Synthesize a robust M6 grid for VDD_AON across the die with 40 µm pitch to guarantee retention voltage margins",
        correct: true,
        explanation: "Correct! Upgrading the always-on grid to thick M6 metal ensures reliable voltage delivery to all retention latches and sleep logic.",
      },
      {
        id: "opt_shut_down_aon",
        label: "Power down VDD_AON during sleep",
        correct: false,
        explanation: "Powering down VDD_AON destroys chip state and prevents the chip from waking up.",
      },
    ],
  },
  {
    id: 47,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Isolation Enable Signal Driven from Switched Power Domain",
    severity: "CRITICAL",
    stageName: "UPF Rule Correctness Audit",
    symptom: "Isolation enable signal 'iso_en' loses drive strength when the core enters sleep because its driver was placed in the switched domain.",
    logSnippet: `[VOLTUS-ISO-DRIVER] Fatal Error: Isolation control signal driver domain mismatch:
  Signal: 'iso_en' driving 540 isolation cells.
  Driver: u_pwr_fsm/iso_reg (Residing in switched domain 'PD_CPU'!).
  When PD_CPU turns OFF, 'iso_en' floats, causing all isolation clamps to fail!`,
    principle: "All isolation enable and power gating control signals MUST be driven exclusively by always-on logic residing in the permanent power domain (VDD_AON). If the driver powers down, the control signal floats, disabling isolation clamps and injecting chaos into the active system.",
    remedyTcl: `set_db [get_db insts u_pwr_fsm/iso_reg].power_domain AON_DOMAIN
place_opt_design -incremental
check_lp_design -type isolation_control`,
    beforeMetrics: [
      { label: "Isolation Driver Domain", val: "Switched Domain (PD_CPU)", bad: true },
      { label: "Sleep State Isolation", val: "FLOATING / BROKEN", bad: true },
      { label: "System Reliability", val: "FATAL SYSTEM CRASH", bad: true },
    ],
    afterMetrics: [
      { label: "Isolation Driver Domain", val: "Always-On Domain (AON_DOMAIN) ✓", bad: false },
      { label: "Sleep State Isolation", val: "100% Guaranteed Clamping ✓", bad: false },
      { label: "System Reliability", val: "ROBUST & VERIFIED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_move_iso_driver_to_aon",
        label: "Move the isolation control register and driver into the Always-On power domain (`AON_DOMAIN`)",
        correct: true,
        explanation: "Correct! Placing isolation control logic in the always-on domain ensures control signals remain actively driven at full rail throughout all sleep states.",
      },
      {
        id: "opt_pull_down_resistor",
        label: "Add an external 1-Megaohm pull-down resistor on PCB",
        correct: false,
        explanation: "An external PCB resistor cannot drive 540 on-chip internal isolation pins with required slew rate.",
      },
    ],
  },
  {
    id: 48,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Dynamic Voltage and Frequency Scaling (DVFS) Transient Slew Limit Violation",
    severity: "HIGH",
    stageName: "Voltus DVFS Transient Analysis",
    symptom: "Switching CPU voltage from 0.65V to 0.95V in 5 ns causes excessive transient current slew (di/dt) that trips external PMIC.",
    logSnippet: `[VOLTUS-DVFS-01] Error: Voltage transition slew rate exceeds PMIC capability:
  Transition: 0.65V -> 0.95V (delta_V = 300 mV) in delta_t = 5.0 ns (dV/dt = 60 mV/ns).
  Total core capacitance: 18.5 nF.
  Peak charging current: I = C * dV/dt = 1.11 A surge into PMIC regulator!`,
    principle: "During DVFS transitions, charging on-chip capacitance too rapidly draws huge transient surge currents from the external voltage regulator. The PMIC's maximum slew rate must be respected by ramping supply voltages gradually over microseconds.",
    remedyTcl: `set_dvfs_transition_rate -domain PD_CPU -slew_rate 0.005 -steps 10
analyze_dvfs_transient -domain PD_CPU -from 0.65 -to 0.95 -results_dir dvfs_rpt`,
    beforeMetrics: [
      { label: "Voltage Ramp Time", val: "5.0 ns (Instantaneous)", bad: true },
      { label: "PMIC Charging Surge", val: "1.11 A (Trips PMIC)", bad: true },
      { label: "DVFS Reliability", val: "FAILED (Regulator Trip)", bad: true },
    ],
    afterMetrics: [
      { label: "Voltage Ramp Time", val: "60.0 µs (Gradual Slew) ✓", bad: false },
      { label: "PMIC Charging Surge", val: "0.09 A (Safe) ✓", bad: false },
      { label: "DVFS Reliability", val: "PASSED REGULATOR SIGNOFF ✓", bad: false },
    ],
    options: [
      {
        id: "opt_controlled_dvfs_ramp",
        label: "Configure a controlled 10-step voltage ramp over 60 µs matching the external PMIC regulator slew rate capability",
        correct: true,
        explanation: "Correct! Ramping DVFS voltages gradually over microseconds keeps capacitor charging current well within the PMIC regulator's safe operating envelope.",
      },
      {
        id: "opt_disable_dvfs",
        label: "Permanently fix voltage at 0.65V and never run full speed",
        correct: false,
        explanation: "Permanently locking frequency at 0.65V destroys peak compute performance.",
      },
    ],
  },
  {
    id: 49,
    domainId: "upf_multivoltage",
    domainName: "Multi-Voltage & UPF Integrity",
    title: "Multi-Threshold Voltage (LVT/SVT/HVT) Distribution Imbalance Causing Thermal Hotspot",
    severity: "MEDIUM",
    stageName: "Leakage Power Optimization",
    symptom: "85% of logic gates in Sector 4 were mapped to Low-Vt (LVT) cells, creating a 140 mW localized thermal hotspot at 105°C.",
    logSnippet: `[VOLTUS-LEAK-08] Warning: Localized LVT cell concentration hotspot:
  Sector 4 (X: 1800-2400, Y: 0-600):
  LVT cell ratio: 84.8% (Target: <20%).
  Leakage power density: 48.5 mW/mm2 (Average die: 6.2 mW/mm2).
  Local junction temperature increase: +22.4 C.`,
    principle: "Low-Vt (LVT) cells switch faster but have 10x to 50x higher subthreshold leakage current than High-Vt (HVT) cells. Concentrating LVT cells in non-critical paths creates localized thermal hotspots that degrade reliability and accelerate electromigration.",
    remedyTcl: `opt_leakage_power -max_lvt_percentage 20.0 -views {func_ss_view}
replace_cells -from *LVT* -to *HVT* -only_positive_slack -slack_margin 0.050
report_power -leakage`,
    beforeMetrics: [
      { label: "Sector 4 LVT Ratio", val: "84.8% (Extreme)", bad: true },
      { label: "Localized Leakage", val: "140 mW (Hotspot)", bad: true },
      { label: "Local Temperature Rise", val: "+22.4 °C", bad: true },
    ],
    afterMetrics: [
      { label: "Sector 4 LVT Ratio", val: "16.2% (Balanced) ✓", bad: false },
      { label: "Localized Leakage", val: "22 mW (84% Reduction) ✓", bad: false },
      { label: "Local Temperature Rise", val: "+1.8 °C (Cool) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_hvt_swapping",
        label: "Execute non-critical path LVT-to-HVT cell swapping (`opt_leakage_power -max_lvt_percentage 20.0`) on all gates with positive slack",
        correct: true,
        explanation: "Correct! Swapping non-critical gates to HVT/SVT cells drastically cuts standby leakage and cools thermal hotspots without impacting timing closure.",
      },
      {
        id: "opt_convert_all_to_lvt",
        label: "Convert 100% of the chip to LVT cells",
        correct: false,
        explanation: "Converting the whole chip to LVT multiplies leakage power by 20x, causing battery drain and thermal runaway.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 6: ACTIVITY ANNOTATION & VECTOR ANALYSIS (10 Scenarios)
  // =========================================================================
  {
    id: 50,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Hierarchical Scope Mismatch Causing 0% VCD Activity Annotation",
    severity: "CRITICAL",
    stageName: "Voltus Activity Ingestion / read_activity_file",
    symptom: "Voltus reports 0.0% toggle annotation coverage from testbench VCD because waveform top scope was 'tb_top.u_dut' instead of 'soc_top'.",
    logSnippet: `[VOLTUS-ACT-01] Error: Activity annotation failure:
  Waveform File: ./sim/production_test.vcd (Scope: tb_top/u_dut/chip_core).
  Active Design: soc_top.
  Annotated Nets: 0 / 184,200 (0.00% Coverage).
  Warning: Power calculation falling back to default 0.1 toggle rate!`,
    principle: "Vector-driven power analysis requires exact hierarchical instance path matching between the simulation waveform file (VCD/FSDB) and the synthesized netlist database. An unmapped top-level scope results in 0% annotation, leading to completely inaccurate power and IR drop calculations.",
    remedyTcl: `read_activity_file -format vcd -activity_scope "tb_top/u_dut/chip_core" -design_scope "soc_top" ./sim/production_test.vcd
report_activity_annotation -verbose`,
    beforeMetrics: [
      { label: "VCD Annotation Coverage", val: "0.0% (Unmapped Scope)", bad: true },
      { label: "Annotated Signals", val: "0 Nets", bad: true },
      { label: "Power Accuracy", val: "UNVERIFIED DEFAULT ESTIMATE", bad: true },
    ],
    afterMetrics: [
      { label: "VCD Annotation Coverage", val: "99.4% (Fully Mapped) ✓", bad: false },
      { label: "Annotated Signals", val: "183,100 Nets ✓", bad: false },
      { label: "Power Accuracy", val: "SIGNOFF ACCURATE (VCD) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_map_activity_scope",
        label: "Specify matching hierarchical scopes using `-activity_scope \"tb_top/u_dut/chip_core\" -design_scope \"soc_top\"` in `read_activity_file`",
        correct: true,
        explanation: "Correct! Explicitly mapping the testbench simulation scope to the active design netlist scope achieves full 99%+ switching activity annotation.",
      },
      {
        id: "opt_guess_toggles",
        label: "Manually set every net toggle rate to 0.5 in a text editor",
        correct: false,
        explanation: "Manual guessing ignores actual functional behavior and produces invalid signoff numbers.",
      },
      {
        id: "opt_delete_waveform",
        label: "Delete the VCD file",
        correct: false,
        explanation: "Deleting the waveform prevents vector-based signoff.",
      },
    ],
  },
  {
    id: 51,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "VCD Time Window Selection Missing Peak Current Burst",
    severity: "HIGH",
    stageName: "Voltus Peak Power Window Profiling",
    symptom: "Voltus averaged power over a 100 µs idle boot window, missing a 6.2 A peak compute burst occurring at T = 450 µs.",
    logSnippet: `[VOLTUS-WIN-02] Warning: Power window profiling mismatch:
  Specified window: -start 0ns -end 100us (Average Power: 18.4 mW).
  Peak power burst detected in simulation log: T = 448.2 us to 452.8 us (Peak Current: 6.24 A).
  Result: Peak dynamic IR drop underestimated by 4.5x!`,
    principle: "Averaging switching activity over a long simulation window dilutes intense localized current bursts. Signoff engineers must run cycle-accurate power profiling across the full waveform to identify and zoom into the highest-toggle window.",
    remedyTcl: `report_power_profile -format fsdb -file ./sim/full_soc.fsdb -time_step 1.0ns -out_file power_profile.rpt
set_power_analysis_mode -method dynamic_vectorbased
read_activity_file -format fsdb -start 448000ns -end 453000ns ./sim/full_soc.fsdb
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Analyzed Time Window", val: "0 - 100 µs (Idle Boot)", bad: true },
      { label: "Peak Current Captured", val: "0.42 A (Diluted)", bad: true },
      { label: "Peak Dynamic IR Drop", val: "18.2 mV (False Pass)", bad: true },
    ],
    afterMetrics: [
      { label: "Analyzed Time Window", val: "448 - 453 µs (Peak Burst) ✓", bad: false },
      { label: "Peak Current Captured", val: "6.24 A (True Peak) ✓", bad: false },
      { label: "Peak Dynamic IR Drop", val: "148.5 mV (Exposed & Fixed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_profile_peak_window",
        label: "Execute `report_power_profile` to find the worst-case switching window (448-453 µs) and zoom dynamic rail analysis directly onto the burst",
        correct: true,
        explanation: "Correct! Profiling the entire waveform identifies the exact peak power window, ensuring signoff dynamic rail analysis tests true worst-case stress.",
      },
      {
        id: "opt_truncate_sim",
        label: "Shorten simulation to 10 ns to make runtime faster",
        correct: false,
        explanation: "Shortening simulation misses the functional burst entirely.",
      },
    ],
  },
  {
    id: 52,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Glitch Filtering Discrepancy Over-Estimating Dynamic Power by 40%",
    severity: "MEDIUM",
    stageName: "Activity Propagation / Glitch Filtering",
    symptom: "Unfiltered zero-delay gate-level simulation contains inertial glitches that Voltus counts as full rail-to-rail transitions, inflating dynamic power to 180 mW.",
    logSnippet: `[VOLTUS-GLITCH-01] Warning: Unfiltered inertial glitches detected:
  Glitch count: 1,420,000 sub-picosecond transition spikes in combinational logic.
  Total calculated dynamic power: 184.5 mW.
  After applying transport delay inertial glitch filter: 112.1 mW.`,
    principle: "In zero-delay gate-level simulations, differing arrival times at logic gate inputs produce sub-nanosecond pulses (glitches). In real silicon, gate inertia and wire capacitance filter out narrow pulses before they reach full rail-to-rail voltage swings.",
    remedyTcl: `set_power_analysis_mode -glitch_filter true -min_glitch_duration 0.040
read_activity_file -format fsdb ./sim/gate_level.fsdb
report_power -out_file reports/power_filtered.rpt`,
    beforeMetrics: [
      { label: "Glitch Filtering", val: "Disabled (Zero-Delay Glitches)", bad: true },
      { label: "Calculated Dynamic Power", val: "184.5 mW (40% Inflated)", bad: true },
      { label: "Power Signoff Margin", val: "FAILED POWER BUDGET", bad: true },
    ],
    afterMetrics: [
      { label: "Glitch Filtering", val: "Enabled (40 ps Inertial Threshold) ✓", bad: false },
      { label: "Calculated Dynamic Power", val: "112.1 mW (Realistic Silicon) ✓", bad: false },
      { label: "Power Signoff Margin", val: "PASSED POWER BUDGET ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_glitch_filter",
        label: "Enable inertial glitch filtering (`-glitch_filter true -min_glitch_duration 0.040`) to suppress unrealistic sub-picosecond switching spikes",
        correct: true,
        explanation: "Correct! Inertial glitch filtering removes high-frequency switching artifacts that cannot physically swing rail-to-rail, producing realistic power numbers.",
      },
      {
        id: "opt_disable_all_transitions",
        label: "Set all combinational switching to zero",
        correct: false,
        explanation: "Zeroing combinational switching ignores legitimate functional power dissipation.",
      },
    ],
  },
  {
    id: 53,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Clock Gating Efficiency Degradation from Vectorless Toggle Default Assumption",
    severity: "HIGH",
    stageName: "Clock Gating Power Audit",
    symptom: "Vectorless mode reports 85% clock gating efficiency, but real silicon measurements show only 18% efficiency due to correlated enable logic.",
    logSnippet: `[VOLTUS-CGC-02] Error: Clock gating enable probability mismatch:
  Integrated Clock Gating (ICG) cell: u_dcache/cgc_tag_array.
  Vectorless estimated enable probability: 0.15 (85% Gated).
  Actual FSDB waveform enable probability: 0.82 (Only 18% Gated!).
  Actual clock tree dynamic power: 48.2 mW vs 14.1 mW estimated.`,
    principle: "Vectorless mode estimates ICG enable pin probabilities using static logic propagation, often assuming independent random inputs. In real software execution, cache lookups and memory pipelines frequently remain active (enable = 1) for sustained bursts.",
    remedyTcl: `set_power_analysis_mode -method dynamic_vectorbased
read_activity_file -format fsdb ./sim/os_boot.fsdb
report_clock_gating -verbose`,
    beforeMetrics: [
      { label: "Estimated Gating Efficiency", val: "85% (Vectorless Default)", bad: true },
      { label: "Actual Gating Efficiency", val: "18% (FSDB Measured)", bad: true },
      { label: "Clock Tree Power Discrepancy", val: "+34.1 mW (+242%)", bad: true },
    ],
    afterMetrics: [
      { label: "Estimated Gating Efficiency", val: "18% (Correlated Real Waveform) ✓", bad: false },
      { label: "Actual Gating Efficiency", val: "Optimized ICG hierarchy to 72% ✓", bad: false },
      { label: "Clock Tree Power Discrepancy", val: "0% Error (Matched Silicon) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fsdb_clock_gating_audit",
        label: "Perform vector-based clock gating auditing with real application FSDB traces and restructure fine-grained ICG hierarchies in RTL",
        correct: true,
        explanation: "Correct! Vector-based auditing exposes true software-driven clock enable correlations, allowing designers to restructure ICGs for maximum power reduction.",
      },
      {
        id: "opt_remove_clock_gates",
        label: "Remove all clock gating cells from the netlist",
        correct: false,
        explanation: "Removing clock gates causes clock trees to toggle 100% of the time, dramatically increasing dynamic power.",
      },
    ],
  },
  {
    id: 54,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Fast-Fourier Transform (FFT) Accelerator Switching Correlation Missed in Vectorless Mode",
    severity: "MEDIUM",
    stageName: "DSP Power Analysis",
    symptom: "Butterfly execution units in 1024-point FFT draw 3.2x higher dynamic current than vectorless estimates due to synchronized bit-reversal toggling.",
    logSnippet: `[VOLTUS-DSP-04] Warning: High spatial switching correlation detected:
  Module: u_fft_1024/butterfly_stage_7.
  Vectorless estimated switching power: 22.4 mW.
  Vector-based (FSDB) switching power: 71.8 mW.
  Dynamic IR drop hotspot: 84 mV during radix-4 butterfly computation.`,
    principle: "Mathematical DSP algorithms (such as FFTs, DCTs, and FIR filters) execute highly correlated data transformations where bus bits flip in lockstep. Vectorless probabilistic solvers cannot model this multi-bit spatial correlation, under-predicting dynamic power.",
    remedyTcl: `read_activity_file -format fsdb -activity_scope "tb/u_fft" ./sim/fft_complex_input.fsdb
set_power_analysis_mode -method dynamic_vectorbased
analyze_rail -type dynamic -domain DSP_DOMAIN`,
    beforeMetrics: [
      { label: "Power Calculation Method", val: "Vectorless (Independent Prob)", bad: true },
      { label: "Butterfly Power Underestimate", val: "22.4 mW vs 71.8 mW (3.2x Error)", bad: true },
      { label: "Dynamic IR Drop", val: "84.0 mV (Unreported Hotspot)", bad: true },
    ],
    afterMetrics: [
      { label: "Power Calculation Method", val: "Vector-Driven FSDB ✓", bad: false },
      { label: "Butterfly Power Underestimate", val: "71.8 mW (100% Accurate) ✓", bad: false },
      { label: "Dynamic IR Drop", val: "22.5 mV (Fixed with Decaps) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fft_vector_analysis",
        label: "Ingest realistic complex-valued FFT testbench waveforms (`.fsdb`) into Voltus to capture correlated butterfly switching dynamics",
        correct: true,
        explanation: "Correct! Real simulation waveforms capture exact mathematical bit correlations, ensuring dynamic power and IR drops are accurately resolved.",
      },
      {
        id: "opt_bypass_fft",
        label: "Replace FFT with software lookup table on 8-bit microcontroller",
        correct: false,
        explanation: "Replacing hardware FFT with software fails 5G radio latency and throughput specifications.",
      },
    ],
  },
  {
    id: 55,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "SAIF (Switching Activity Interchange Format) Forward-Annotation Loss of Cycle Peak",
    severity: "MEDIUM",
    stageName: "Power File Format Selection",
    symptom: "Using time-averaged SAIF file instead of FSDB concealed a 4.5x cycle-by-cycle di/dt current peak.",
    logSnippet: `[VOLTUS-FORMAT-02] Info: Activity format comparison:
  Input format: SAIF (Provides static toggle count T_c and static probability P_1).
  Limitation: SAIF cannot represent cycle-by-cycle transient time history.
  Result: Peak dynamic rail analysis CANNOT be performed with SAIF; static power only!`,
    principle: "SAIF (Switching Activity Interchange Format) compresses activity into time-averaged summary numbers (total toggles divided by total time). It contains zero time-domain information, making it impossible to calculate transient dynamic IR drop or peak di/dt current.",
    remedyTcl: `set_power_analysis_mode -method dynamic_vectorbased
read_activity_file -format fsdb -start 100ns -end 500ns ./sim/transient_burst.fsdb
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Activity File Format", val: "SAIF (Time-Averaged Summary)", bad: true },
      { label: "Dynamic Rail Analysis", val: "IMPOSSIBLE (No Time Domain)", bad: true },
      { label: "Transient Peak Detection", val: "0% Capability", bad: true },
    ],
    afterMetrics: [
      { label: "Activity File Format", val: "FSDB / VCD (Cycle-Accurate Time History) ✓", bad: false },
      { label: "Dynamic Rail Analysis", val: "FULL TRANSIENT SIGNOFF ✓", bad: false },
      { label: "Transient Peak Detection", val: "100% Picosecond Resolution ✓", bad: false },
    ],
    options: [
      {
        id: "opt_use_fsdb_format",
        label: "Use cycle-accurate binary FSDB or VCD waveforms instead of SAIF for dynamic rail and transient di/dt signoff",
        correct: true,
        explanation: "Correct! FSDB and VCD formats preserve full time-domain event history, enabling picosecond-resolution dynamic rail analysis.",
      },
      {
        id: "opt_convert_to_csv",
        label: "Convert waveform to an Excel spreadsheet",
        correct: false,
        explanation: "Excel spreadsheets cannot handle gigabytes of EDA simulation waveforms.",
      },
    ],
  },
  {
    id: 56,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Un-driven / Tri-State Bus Float Activity Propagation Corruption",
    severity: "HIGH",
    stageName: "Activity Propagation / High-Z Handling",
    symptom: "Tri-state internal bus in high-Z state propagated 'X' (unknown) logic values, causing Voltus activity propagation to fail across 4,200 downstream gates.",
    logSnippet: `[VOLTUS-PROP-03] Error: Unknown (X) logic state propagation:
  Net: u_biu/internal_shared_bus[31:0] (State: High-Z / Tri-stated).
  Downstream un-annotated gates: 4,210 cells.
  Warning: Probability calculation corrupted (P_0 = NaN, P_1 = NaN).`,
    principle: "Internal tri-state buses without active pull-up/pull-down keepers drift into High-Z ('Z') or unknown ('X') states during simulation. Activity propagation algorithms cannot compute transition probabilities from 'X' values, corrupting downstream power calculation.",
    remedyTcl: `set_power_analysis_mode -resolve_x_states to_zero -handle_tri_state bus_keeper
read_activity_file -format fsdb ./sim/biu_traffic.fsdb
report_activity_annotation`,
    beforeMetrics: [
      { label: "Tri-State High-Z Handling", val: "Unresolved 'X' Propagation", bad: true },
      { label: "Corrupted Downstream Gates", val: "4,210 Instances (NaN Power)", bad: true },
      { label: "Annotation Status", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Tri-State High-Z Handling", val: "Bus Keeper Resolution ✓", bad: false },
      { label: "Corrupted Downstream Gates", val: "0 Instances ✓", bad: false },
      { label: "Annotation Status", val: "100% CLEAN PROPAGATION ✓", bad: false },
    ],
    options: [
      {
        id: "opt_resolve_x_states",
        label: "Configure Voltus to resolve High-Z states using bus keeper modeling (`-handle_tri_state bus_keeper -resolve_x_states to_zero`)",
        correct: true,
        explanation: "Correct! Bus keeper modeling ensures tri-stated nets maintain their last valid logical level, preventing 'X' propagation and power calculation failures.",
      },
      {
        id: "opt_leave_as_nan",
        label: "Ignore NaN power numbers and report chip power as 0 Watts",
        correct: false,
        explanation: "Reporting 0 Watts for a chip that consumes power causes immediate project rejection.",
      },
    ],
  },
  {
    id: 57,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Static Probability Inversion Causing Inaccurate Leakage Power Estimation",
    severity: "LOW",
    stageName: "State-Dependent Leakage Calculation",
    symptom: "State-dependent leakage calculation deviated by 25% because static probability (P_1) of inverted control lines was not propagated.",
    logSnippet: `[VOLTUS-LEAK-02] Info: State-dependent leakage calculation:
  Gate: NAND2_X4 (Inputs A, B).
  State (A=0, B=0): Leakage = 1.2 nW.
  State (A=1, B=1): Leakage = 18.4 nW (15x higher leakage!).
  Accurate P_1/P_0 static probability required for state-dependent leakage tables.`,
    principle: "In sub-micron FinFET technologies, standard cell subthreshold leakage depends heavily on internal transistor stack states (state-dependent leakage in Liberty .lib). Accurate static probabilities (P_0 and P_1) are necessary to weight multi-input leakage tables correctly.",
    remedyTcl: `set_power_analysis_mode -state_dependent_leakage true
read_activity_file -format fsdb ./sim/idle_state.fsdb
report_power -leakage -state_dependent`,
    beforeMetrics: [
      { label: "Leakage Calculation", val: "Average State Default", bad: true },
      { label: "Leakage Discrepancy", val: "25% Error vs Silicon", bad: true },
      { label: "Standby Battery Life Est.", val: "Inaccurate", bad: true },
    ],
    afterMetrics: [
      { label: "Leakage Calculation", val: "State-Dependent Liberty Lookups ✓", bad: false },
      { label: "Leakage Discrepancy", val: "<1.5% Error vs Silicon ✓", bad: false },
      { label: "Standby Battery Life Est.", val: "Signoff Verified ✓", bad: false },
    ],
    options: [
      {
        id: "opt_state_dependent_leakage",
        label: "Enable state-dependent leakage modeling (`-state_dependent_leakage true`) utilizing exact static probabilities from simulation",
        correct: true,
        explanation: "Correct! State-dependent leakage lookups accurately evaluate transistor stacking effects, matching measured silicon leakage within 1.5%.",
      },
      {
        id: "opt_assume_zero_leakage",
        label: "Assume subthreshold leakage is zero in FinFETs",
        correct: false,
        explanation: "FinFETs still exhibit significant subthreshold and gate tunneling leakage that cannot be ignored.",
      },
    ],
  },
  {
    id: 58,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "Testbench Reset Sequence Dominating Power Averaging Window",
    severity: "MEDIUM",
    stageName: "Power Window Demarcation",
    symptom: "A 500 ns reset sequence included in a 1 µs simulation artificially lowered calculated operating power by 42%.",
    logSnippet: `[VOLTUS-WIN-08] Warning: Unrealistic power averaging window:
  Simulation total duration: 1,000 ns.
  Reset asserted duration: 0 ns to 500 ns (Zero switching activity).
  Functional execution duration: 500 ns to 1,000 ns.
  Result: Operating power averaged over reset window is 42% lower than actual run-time power!`,
    principle: "Including initial testbench reset cycles in power calculations skews the average toggle rate downward. Power analysis windows must start strictly AFTER reset deassertion and initialization sequences have completed.",
    remedyTcl: `read_activity_file -format fsdb -start 550ns -end 1000ns ./sim/aes_run.fsdb
report_power -out_file reports/active_power.rpt`,
    beforeMetrics: [
      { label: "Averaging Start Time", val: "T = 0 ns (Includes 500ns Reset)", bad: true },
      { label: "Calculated Active Power", val: "48.2 mW (42% Underestimated)", bad: true },
      { label: "Thermal Solution Budget", val: "INADEQUATE HEATSINK DESIGN", bad: true },
    ],
    afterMetrics: [
      { label: "Averaging Start Time", val: "T = 550 ns (Post-Reset Active Only) ✓", bad: false },
      { label: "Calculated Active Power", val: "83.1 mW (True Operating Power) ✓", bad: false },
      { label: "Thermal Solution Budget", val: "CORRECTLY SIZED HEATSINK ✓", bad: false },
    ],
    options: [
      {
        id: "opt_exclude_reset_window",
        label: "Set `-start 550ns` in `read_activity_file` to strictly exclude the zero-toggle reset sequence from operating power calculation",
        correct: true,
        explanation: "Correct! Excluding reset and initialization cycles ensures calculated power reflects genuine operational workload consumption.",
      },
      {
        id: "opt_average_over_forever",
        label: "Average power over 10 years of idle time to make power zero",
        correct: false,
        explanation: "Averaging over infinite idle time produces false metrics that will cause thermal failure under real use.",
      },
    ],
  },
  {
    id: 59,
    domainId: "vcd_fsdb_activity",
    domainName: "Activity Annotation & Vector Analysis",
    title: "VCD File Size Explosion (50GB+) Overwhelming EDA Server Disk and Memory",
    severity: "LOW",
    stageName: "Waveform Compression & Ingestion",
    symptom: "Uncompressed 58GB ASCII VCD waveform crashed Voltus ingestion due to out-of-memory (OOM) error.",
    logSnippet: `[VOLTUS-FILE-01] Fatal Error: Memory allocation failure while parsing VCD:
  File size: 58.4 GB ASCII VCD (2.8 billion value change records).
  Host RAM exhausted: 256 GB allocated. Process killed (OOM).`,
    principle: "ASCII VCD files are uncompressed plain text and can grow to hundreds of gigabytes for long SoC simulations. Modern EDA flows require compressed binary formats like Synopsys FSDB or IEEE 1801 Fast-VCD, which shrink file size by 90-95% and stream directly into memory.",
    remedyTcl: `read_activity_file -format fsdb -activity_scope "tb/dut" ./sim/compressed_soc.fsdb
report_power -summary`,
    beforeMetrics: [
      { label: "Waveform Format", val: "58.4 GB ASCII VCD (Uncompressed)", bad: true },
      { label: "EDA Server RAM Usage", val: ">256 GB (OOM Crash)", bad: true },
      { label: "Ingestion Status", val: "FAILED (Process Killed)", bad: true },
    ],
    afterMetrics: [
      { label: "Waveform Format", val: "2.1 GB Compressed Binary FSDB ✓", bad: false },
      { label: "EDA Server RAM Usage", val: "18.5 GB (Fast Streaming) ✓", bad: false },
      { label: "Ingestion Status", val: "PASSED in 45 Seconds ✓", bad: false },
    ],
    options: [
      {
        id: "opt_use_binary_fsdb",
        label: "Convert simulation dumping to compressed binary FSDB format (`-format fsdb`) for fast memory-efficient ingestion",
        correct: true,
        explanation: "Correct! Binary FSDB files are 95% smaller than ASCII VCDs and stream into Voltus with minimal memory footprint.",
      },
      {
        id: "opt_print_to_paper",
        label: "Print the 58GB VCD to physical paper and scan it back in",
        correct: false,
        explanation: "Printing 58GB of text would consume millions of sheets of paper and is physically impossible.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 7: DECAP INSERTION & POWER SIGNOFF (10 Scenarios)
  // =========================================================================
  {
    id: 60,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Post-Route Standard Cell Power Recovery without Timing Degradation",
    severity: "HIGH",
    stageName: "Voltus-Innovus Power Optimization ECO / opt_design -power_recovery",
    symptom: "Post-route design meets 1.2 GHz timing with 45 ps positive slack, but total dynamic power exceeds customer specification by 18 mW.",
    logSnippet: `[VOLTUS-OPT-01] Info: Power recovery optimization candidate search:
  Total cell count: 184,000 gates.
  Cells with positive slack > 30 ps: 42,800 gates.
  Potential dynamic power reduction: 18.5 mW by downsizing non-critical driver gates.`,
    principle: "During timing closure, EDA synthesis and placement engines upsize standard cells to meet worst-case timing targets. Once routing parasitics (SPEF) are finalized, non-critical paths with positive timing slack can be systematically downsized to smaller drive strengths (e.g., BUFX16 → BUFX4), recovering dynamic and leakage power without violating setup slack.",
    remedyTcl: `set_db opt_power_recovery true
set_db opt_power_recovery_slack_margin 0.020
opt_design -post_route -power_recovery -expanded_views
report_power -out_file power_after_recovery.rpt`,
    beforeMetrics: [
      { label: "Total Dynamic Power", val: "118.4 mW (Over Budget)", bad: true },
      { label: "Worst Negative Slack (WNS)", val: "+45 ps (Excess Slack)", bad: false },
      { label: "Customer Spec Margin", val: "FAILED (+18.4 mW)", bad: true },
    ],
    afterMetrics: [
      { label: "Total Dynamic Power", val: "99.8 mW (18.6 mW Recovered) ✓", bad: false },
      { label: "Worst Negative Slack (WNS)", val: "+18 ps (Timing Maintained) ✓", bad: false },
      { label: "Customer Spec Margin", val: "PASSED SPECIFICATION ✓", bad: false },
    ],
    options: [
      {
        id: "opt_run_power_recovery",
        label: "Execute `opt_design -post_route -power_recovery` to downsize non-critical cells with positive slack margin > 20 ps",
        correct: true,
        explanation: "Correct! Automated power recovery downsizes gates on paths with positive slack, shedding dynamic and leakage power while preserving timing closure.",
      },
      {
        id: "opt_delete_buffers",
        label: "Randomly delete 10,000 buffers across the design",
        correct: false,
        explanation: "Randomly deleting buffers causes massive setup, hold, and slew rate violations.",
      },
      {
        id: "opt_lower_voltage_blindly",
        label: "Reduce voltage to 0.4V without checking timing",
        correct: false,
        explanation: "Dropping voltage without timing closure causes massive timing breakdown across all paths.",
      },
    ],
  },
  {
    id: 61,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Over-Insertion of Decoupling Capacitors Blocking Routing Channels and DFM Fillers",
    severity: "MEDIUM",
    stageName: "Decap Cell Placement / add_decaps",
    symptom: "Inserting 35% decap density filled all spare placement sites, leaving zero room for base layer DFM fillers and engineering ECO spare cells.",
    logSnippet: `[VOLTUS-DECAP-05] Error: Placement density saturation:
  Core cell density: 98.4% (Decap cells: 34.8% of core area).
  DFM Base Layer Fillers inserted: 12% (Foundry minimum required: 100% continuous diffusion).
  DRC Violation: Poly/Diffusion spacing and density rules failed!`,
    principle: "Decoupling capacitor cells occupy active standard cell row sites. While decaps dampen dynamic IR drop, over-inserting decaps starves the layout of required DFM base fillers (which maintain continuous diffusion and poly density) and eliminates spare cells needed for post-silicon metal ECOs.",
    remedyTcl: `remove_decaps -all
add_decaps -cells {DECAP_X32 DECAP_X16} -max_density 0.12 -target_ir_drop 0.030
add_fillers -base_layer_cells {FILL64 FILL32 FILL16 FILL8 FILL4 FILL2 FILL1} -prefix DFM_FILL
check_drc -type all`,
    beforeMetrics: [
      { label: "Decap Density", val: "34.8% (Excessive)", bad: true },
      { label: "DFM Base Filler Coverage", val: "12% (DRC FAIL)", bad: true },
      { label: "Spare Cell Placement", val: "0% (No Room for ECOs)", bad: true },
    ],
    afterMetrics: [
      { label: "Decap Density", val: "11.8% (Optimal for IR) ✓", bad: false },
      { label: "DFM Base Filler Coverage", val: "100% Continuous (DRC CLEAN) ✓", bad: false },
      { label: "Spare Cell Placement", val: "5% Spare Gates Inserted ✓", bad: false },
    ],
    options: [
      {
        id: "opt_balance_decaps_and_fillers",
        label: "Cap decap density at 12% targeting 30 mV IR drop budget and fill remaining empty sites with continuous DFM base fillers and spare cells",
        correct: true,
        explanation: "Correct! Balancing decap density (10-15%) satisfies dynamic IR drop requirements while ensuring 100% DFM base layer continuity and spare cell availability.",
      },
      {
        id: "opt_remove_all_fillers",
        label: "Delete all DFM fillers to keep 35% decaps",
        correct: false,
        explanation: "Omitting DFM base fillers causes catastrophic manufacturing defects (discontinuous poly/active oxide erosion).",
      },
    ],
  },
  {
    id: 62,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Decap Cell Placement Distance from Dynamic IR Drop Hotspots",
    severity: "HIGH",
    stageName: "Localized Decap Optimization",
    symptom: "Decaps placed 80 µm away from the 64-bit FPU core provide zero dynamic IR drop relief due to high interconnect resistance.",
    logSnippet: `[VOLTUS-DECAP-LOC] Error: Ineffective decoupling capacitor placement:
  FPU Dynamic Hotspot: (X: 1200, Y: 1200).
  Nearest Decap Cells: Placed in peripheral region (Distance: 84.5 um).
  Interconnect Resistance R_decap: 14.8 ohms (Decap RC time constant tau = 420 ps > clock edge 80 ps!).
  Peak Dynamic IR Drop: 124.0 mV (Unmitigated!).`,
    principle: "Decoupling capacitors can only supply transient charge if their RC time constant (τ = R_interconnect · C_decap) is significantly faster than the clock transition time. Placing decaps far from switching transistors introduces wire resistance that chokes rapid charge delivery.",
    remedyTcl: `add_decaps -cells {DECAP_X32 DECAP_X16} -area {1150 1150 1250 1250} -density 0.18
set_rail_analysis_mode -method dynamic -accuracy hd
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Decap-to-Hotspot Distance", val: "84.5 µm (Too Far)", bad: true },
      { label: "Decap Interconnect R", val: "14.8 Ω (High Choke)", bad: true },
      { label: "Peak Dynamic IR Drop", val: "124.0 mV (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Decap-to-Hotspot Distance", val: "<8.0 µm (Local Core) ✓", bad: false },
      { label: "Decap Interconnect R", val: "0.4 Ω (Instant Discharge) ✓", bad: false },
      { label: "Peak Dynamic IR Drop", val: "26.4 mV (Passed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_place_decaps_locally",
        label: "Place decoupling capacitors directly inside and adjacent to the FPU hotspot (<10 µm radius) for low-impedance transient charge delivery",
        correct: true,
        explanation: "Correct! Placing decaps directly adjacent to switching gates minimizes series interconnect resistance, enabling instantaneous sub-50ps charge discharge.",
      },
      {
        id: "opt_put_decaps_on_pcb",
        label: "Move all decaps outside the chip onto the PCB motherboard",
        correct: false,
        explanation: "PCB decaps cannot filter on-chip gigahertz dynamic IR drops due to package pin inductance.",
      },
    ],
  },
  {
    id: 63,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Static Power Leakage Exploding at Slow-Slow (SS) High Temperature (125°C) Corner",
    severity: "HIGH",
    stageName: "Multi-Corner Multi-Mode (MCMM) Power Signoff",
    symptom: "Leakage power increases by 8.4x from 14 mW at 25°C to 118 mW at 125°C, failing standby power specification.",
    logSnippet: `[VOLTUS-MCMM-01] Warning: Severe thermal leakage scaling:
  Corner: 'ff_0p88v_125c' -> Total Leakage: 118.2 mW.
  Corner: 'tt_0p80v_25c'  -> Total Leakage: 14.1 mW (8.38x increase!).
  Subthreshold leakage scaling factor: I_sub ∝ exp(-q*Vth / k*T).`,
    principle: "Subthreshold leakage current increases exponentially with temperature because thermal energy (k·T/q) broadens the Fermi-Dirac electron distribution, lowering effective barrier height. Standby power budgets must be signed off at worst-case high-temperature corners (125°C).",
    remedyTcl: `set_power_analysis_mode -temperature 125.0
opt_leakage_power -views {leakage_worst_view} -max_hvt_percentage 85.0
report_power -leakage -view leakage_worst_view`,
    beforeMetrics: [
      { label: "125°C Leakage Power", val: "118.2 mW (8.4x Jump)", bad: true },
      { label: "HVT Cell Percentage", val: "32% (Low-Vt Dominated)", bad: true },
      { label: "Standby Signoff", val: "FAILED SPEC (<40 mW)", bad: true },
    ],
    afterMetrics: [
      { label: "125°C Leakage Power", val: "34.8 mW (71% Reduction) ✓", bad: false },
      { label: "HVT Cell Percentage", val: "84% (High-Vt Maximized) ✓", bad: false },
      { label: "Standby Signoff", val: "PASSED SPECIFICATION ✓", bad: false },
    ],
    options: [
      {
        id: "opt_mcmm_hvt_maximization",
        label: "Optimize leakage at 125°C corner by maximizing HVT cell insertion up to 85% on non-timing-critical paths",
        correct: true,
        explanation: "Correct! Maximizing HVT cells suppresses exponential subthreshold leakage, ensuring the chip meets standby budgets even at 125°C junction temperatures.",
      },
      {
        id: "opt_only_signoff_at_0c",
        label: "Sign off leakage exclusively at 0°C and ignore high-temperature environments",
        correct: false,
        explanation: "Chips heat up under normal operation; signing off at 0°C guarantees field battery drain failures.",
      },
    ],
  },
  {
    id: 64,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Automated Power Signoff HTML Report Generation for Foundry Tapeout Package",
    severity: "LOW",
    stageName: "Voltus Signoff Documentation / report_power_rail",
    symptom: "Foundry tapeout checklist requires complete static/dynamic IR drop, EM, and total power compliance signoff reports.",
    logSnippet: `[VOLTUS-SIGNOFF-01] Info: Generating foundry tapeout signoff data package:
  Required artifacts: static_ir.rpt, dynamic_ir.rpt, power_em.rpt, signal_em.rpt, power_summary.html.
  All power domains: VDD_CORE (0.80V), VDD_IO (1.80V), VDD_AON (0.80V).`,
    principle: "Foundries enforce strict signoff reporting standards prior to mask reticle manufacturing. Power signoff documentation must include comprehensive statistical distributions of static IR drop, dynamic peak drops, and Black's equation EM MTTF projections.",
    remedyTcl: `report_power -out_file signoff/power_summary.rpt -hierarchy -by_category
report_rail_results -type static_ir -limit 100 -out_file signoff/static_ir.rpt
report_rail_results -type dynamic_ir -limit 100 -out_file signoff/dynamic_ir.rpt
analyze_power_grid_em -results_dir signoff/em_results
write_power_data -format voltage -out_file signoff/voltage_map.vdb`,
    beforeMetrics: [
      { label: "Signoff Documentation", val: "Incomplete (Unverified)", bad: true },
      { label: "Voltage Data Map (VDB)", val: "Missing", bad: true },
      { label: "Foundry Handoff Ready", val: "NO", bad: true },
    ],
    afterMetrics: [
      { label: "Signoff Documentation", val: "100% Comprehensive Reports ✓", bad: false },
      { label: "Voltage Data Map (VDB)", val: "Exported for Tempus STA ✓", bad: false },
      { label: "Foundry Handoff Ready", val: "APPROVED FOR TAPE-OUT ✓", bad: false },
    ],
    options: [
      {
        id: "opt_generate_signoff_package",
        label: "Execute full suite of Voltus signoff reporting commands (`report_power`, `report_rail_results`, `write_power_data`)",
        correct: true,
        explanation: "Correct! Exporting complete hierarchical power, IR drop, and EM reports satisfies foundry signoff checklists and feeds voltage-aware STA in Tempus.",
      },
      {
        id: "opt_submit_blank_text",
        label: "Submit an empty text file named 'signoff.txt'",
        correct: false,
        explanation: "Submitting empty files will cause immediate foundry tapeout rejection.",
      },
    ],
  },
  {
    id: 65,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Low-Power Multi-Bit Flip-Flop (MBFF) Merging for Dynamic Clock Power Reduction",
    severity: "MEDIUM",
    stageName: "Clock Power Optimization / merge_clock_gates",
    symptom: "Single-bit flip-flops account for 48% of total dynamic clock power due to redundant internal clock inverters.",
    logSnippet: `[VOLTUS-MBFF-01] Info: Multi-Bit Flip-Flop (MBFF) clustering potential:
  Single-bit DFF count: 48,000 instances.
  Combinable into 2-bit and 4-bit MBFFs: 38,400 instances (80% of registers).
  Estimated clock tree power reduction: 24.5 mW (28% clock power savings).`,
    principle: "Single-bit flip-flops contain individual internal clock inverters. Merging 2 or 4 adjacent registers into a Multi-Bit Flip-Flop (MBFF) shares internal clock inverters and reduces total clock pin capacitance, cutting clock distribution power significantly.",
    remedyTcl: `merge_multibit_cells -domain PD_CORE -types {DFF_X1 -> MBFF4_X1} -max_distance 15.0
place_opt_design -incremental
report_power -clock_network`,
    beforeMetrics: [
      { label: "Clock Network Power", val: "88.2 mW (High)", bad: true },
      { label: "MBFF Utilization", val: "0% (All Single-Bit DFFs)", bad: true },
      { label: "Clock Pin Capacitance", val: "14.8 pF Total", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Network Power", val: "63.7 mW (28% Savings) ✓", bad: false },
      { label: "MBFF Utilization", val: "82% Multi-Bit Cells ✓", bad: false },
      { label: "Clock Pin Capacitance", val: "9.2 pF Total ✓", bad: false },
    ],
    options: [
      {
        id: "opt_merge_mbff",
        label: "Merge adjacent single-bit registers into 4-bit MBFF cells (`merge_multibit_cells -max_distance 15.0`) to share internal clock inverters",
        correct: true,
        explanation: "Correct! Multi-bit flip-flops share internal clock buffering and reduce clock pin capacitance, yielding up to 30% dynamic clock power reduction.",
      },
      {
        id: "opt_delete_flip_flops",
        label: "Remove all flip-flops and make the design purely combinational",
        correct: false,
        explanation: "Sequential designs require flip-flops for state retention and synchronization.",
      },
    ],
  },
  {
    id: 66,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Static Power Gating Leakage Current in Sleep Mode from Subthreshold Conduction",
    severity: "HIGH",
    stageName: "Sleep Mode Power Signoff",
    symptom: "Power-gated CPU domain leaks 4.2 mA in deep sleep mode due to low-threshold header switch subthreshold conduction.",
    logSnippet: `[VOLTUS-SLEEP-LEAK] Error: Sleep state leakage budget exceeded:
  Domain: 'PD_CPU' (Powered OFF in sleep state).
  Header switches: 1,200 standard-Vt (SVT) header cells.
  Off-state drain-source leakage: 4.21 mA (Target: <0.10 mA).`,
    principle: "Power switches must cut off power almost completely during deep sleep. Using Standard-Vt (SVT) or Low-Vt (LVT) transistors for sleep switches allows significant subthreshold leakage current (I_off) to bypass the switch, draining battery in standby.",
    remedyTcl: `replace_power_switches -domain PD_CPU -from HEADER_SVT_X32 -to HEADER_UHVT_X32
report_power -leakage -domain PD_CPU`,
    beforeMetrics: [
      { label: "Sleep Mode Leakage", val: "4.21 mA (42x Budget)", bad: true },
      { label: "Header Switch Vt Type", val: "SVT (Leaky)", bad: true },
      { label: "Standby Battery Life", val: "18 Hours (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Sleep Mode Leakage", val: "0.04 mA (Within Budget) ✓", bad: false },
      { label: "Header Switch Vt Type", val: "Ultra-High-Vt (UHVT) ✓", bad: false },
      { label: "Standby Battery Life", val: "30 Days (Passed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_use_uhvt_switches",
        label: "Swap SVT header switches with Ultra-High-Vt (UHVT) thick-gate sleep transistors to achieve sub-nanoamp off-state leakage",
        correct: true,
        explanation: "Correct! Ultra-High-Vt (UHVT) transistors have extremely high threshold voltages, reducing subthreshold off-state leakage to negligible levels.",
      },
      {
        id: "opt_use_lvt_switches",
        label: "Use Low-Vt (LVT) switches to make them leak even faster",
        correct: false,
        explanation: "Using LVT switches multiplies off-state leakage by 50x, draining battery in minutes.",
      },
    ],
  },
  {
    id: 67,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Dynamic IR Drop Jitter Verification across Multi-Core Synchronous Bus",
    severity: "MEDIUM",
    stageName: "Voltus-Tempus Co-Analysis",
    symptom: "Synchronous 4-core bus experiences 65 ps clock skew variation between Core 0 (0.80V) and Core 3 (0.72V under load).",
    logSnippet: `[VOLTUS-SKEW-04] Warning: Cross-core supply gradient skew:
  Core 0 Supply: 0.798 V -> Clock Insertion Delay: 420 ps.
  Core 3 Supply: 0.722 V (Drop 78 mV) -> Clock Insertion Delay: 485 ps.
  Cross-core clock skew: 65 ps (Setup timing violated across core bus interface!).`,
    principle: "When symmetric CPU cores operate under different dynamic workloads, local IR drops create inter-core supply voltage gradients. This causes clock trees in heavily loaded cores to slow down relative to idle cores, destroying inter-core synchronous timing.",
    remedyTcl: `create_voltage_area -name VA_INTERCORE_BUS -power_nets {VDD_AON} -area {1000 1000 1400 1400}
set_db [get_db insts -if {.is_intercore_bus == true}].voltage_area VA_INTERCORE_BUS
analyze_rail -type dynamic`,
    beforeMetrics: [
      { label: "Inter-Core Voltage Delta", val: "76 mV Difference", bad: true },
      { label: "Cross-Core Clock Skew", val: "65 ps (Violated)", bad: true },
      { label: "Inter-Core Bus Timing", val: "SETUP VIOLATION", bad: true },
    ],
    afterMetrics: [
      { label: "Inter-Core Voltage Delta", val: "8 mV (Uniform Grid) ✓", bad: false },
      { label: "Cross-Core Clock Skew", val: "6 ps (Synchronous) ✓", bad: false },
      { label: "Inter-Core Bus Timing", val: "MET TIMING SLACK ✓", bad: false },
    ],
    options: [
      {
        id: "opt_intercore_voltage_isolation",
        label: "Isolate inter-core synchronous bus interfaces on dedicated low-impedance power trunks backed by uniform decoupling capacitors",
        correct: true,
        explanation: "Correct! Isolating cross-core interfaces on stable power distribution prevents localized core loading from modulating inter-core clock skew.",
      },
      {
        id: "opt_disable_multicore",
        label: "Disable 3 of the 4 CPU cores permanently",
        correct: false,
        explanation: "Disabling multi-core features destroys 75% of compute capacity.",
      },
    ],
  },
  {
    id: 68,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Supply Noise Induced Jitter (PSNJ) on Phase-Locked Loop (PLL) Analog Power Rail",
    severity: "HIGH",
    stageName: "Analog/Mixed-Signal (AMS) Power Integrity Signoff",
    symptom: "Digital core switching noise couples into PLL analog supply (VDD_PLL_1P8), increasing clock output phase jitter from 1.2 ps to 18.5 ps.",
    logSnippet: `[VOLTUS-PLL-01] Error: Power Supply Noise Jitter (PSNJ) violation:
  Analog macro: ANALOG_PLL_0 (Pin: VDD_ANA).
  Supply ripple: 48.0 mV peak-to-peak at 1.2 GHz digital switching frequency.
  PLL Output Phase Jitter: 18.5 ps (PCIe Gen4 Limit: 1.5 ps - LINK DOWN!).`,
    principle: "Phase-Locked Loops (PLLs) contain analog voltage-controlled oscillators (VCOs) whose output frequency is directly modulated by supply noise (K_vco / (s · C)). If digital core noise ripples onto the analog supply, Power Supply Induced Jitter (PSIJ) causes communication link failure.",
    remedyTcl: `create_pg_ring -nets {VDD_PLL_ANA VSS_PLL_ANA} -insts ANALOG_PLL_0 -layers {M7 M8} -width 6.0
add_decaps -cells {DECAP_X64} -insts ANALOG_PLL_0 -ring_distance 20.0
create_guard_ring -insts ANALOG_PLL_0 -layer M1 -width 3.0 -nets {VSS_PLL_ANA}
analyze_rail -type dynamic -domain PLL_ANALOG_DOMAIN`,
    beforeMetrics: [
      { label: "PLL Supply Noise Ripple", val: "48.0 mV (High Ripple)", bad: true },
      { label: "PLL Output Phase Jitter", val: "18.5 ps (PCIe Link Down)", bad: true },
      { label: "Analog Rail Isolation", val: "UNSHIELDED (Digital Coupling)", bad: true },
    ],
    afterMetrics: [
      { label: "PLL Supply Noise Ripple", val: "1.8 mV (Ultra-Clean) ✓", bad: false },
      { label: "PLL Output Phase Jitter", val: "0.85 ps (PCIe Gen4 Met) ✓", bad: false },
      { label: "Analog Rail Isolation", val: "Dedicated Ring + Guard Ring ✓", bad: false },
    ],
    options: [
      {
        id: "opt_isolate_pll_power",
        label: "Synthesize dedicated isolated analog power rings (VDD_PLL_ANA) with substrate guard rings and high-density local decaps around the PLL",
        correct: true,
        explanation: "Correct! Isolating analog PLL power and ground with dedicated rings and substrate guard rings suppresses digital high-frequency noise coupling, achieving sub-picosecond phase jitter.",
      },
      {
        id: "opt_connect_to_digital_vdd",
        label: "Connect the PLL analog power pin directly to the noisy digital core VDD",
        correct: false,
        explanation: "Directly connecting analog power to noisy digital VDD maximizes noise injection and destroys PLL lock.",
      },
    ],
  },
  {
    id: 69,
    domainId: "decap_power_opt",
    domainName: "Decap Insertion & Power Signoff",
    title: "Final Foundry Tapeout Multi-Voltage Power Integrity Signoff Verification",
    severity: "CRITICAL",
    stageName: "Tapeout Readiness / Full-Chip Signoff Audit",
    symptom: "Full-chip signoff audit verifying 100% compliance across Static IR (<3%), Dynamic IR (<5%), EM MTTF (>100k hrs), and UPF rules.",
    logSnippet: `[VOLTUS-SIGNOFF-FINAL] ================================================================
  CADENCE VOLTUS FULL-CHIP POWER & RAIL SIGNOFF SUMMARY
================================================================
  Design: soc_top | Technology: ASAP7 / SkyWater 130nm | Die: 2.4mm x 2.4mm
  Total Power: 142.8 mW (Dynamic: 118.2 mW, Leakage: 24.6 mW)
  Worst Static IR Drop: 18.2 mV (2.28% VDD - PASSED)
  Worst Dynamic IR Drop: 32.1 mV (4.01% VDD - PASSED)
  Electromigration Status: 0 Violating Segments (MTTF > 150,000 hrs - PASSED)
  UPF Multi-Voltage Rules: 100% Verified (0 Floating, 0 Crowbar - PASSED)
================================================================
  RESULT: 100% PASSED ALL SIGNOFF CRITERIA • APPROVED FOR GDSII TAPE-OUT`,
    principle: "Full-chip physical power signoff is the final gatekeeper before spending millions of dollars on silicon mask fabrication. A design is only tapeout-ready when static IR drops, dynamic di/dt noise, electromigration, and UPF multi-voltage rules are concurrently closed and verified clean.",
    remedyTcl: `write_power_data -format voltage -out_file signoff/final_soc_power.vdb
report_power -hierarchy -out_file signoff/full_chip_power.rpt
report_rail_results -type dynamic_ir -out_file signoff/dynamic_ir_final.rpt
write_stream -format oasis -map_file tech/foundry_gds.map -output outputs/soc_top_signoff.oasis.gz`,
    beforeMetrics: [
      { label: "Static IR Drop", val: "18.2 mV (2.28% VDD - MET) ✓", bad: false },
      { label: "Dynamic IR Drop", val: "32.1 mV (4.01% VDD - MET) ✓", bad: false },
      { label: "EM Violations", val: "0 Violations (MET) ✓", bad: false },
    ],
    afterMetrics: [
      { label: "Static IR Drop", val: "18.2 mV (2.28% VDD - MET) ✓", bad: false },
      { label: "Dynamic IR Drop", val: "32.1 mV (4.01% VDD - MET) ✓", bad: false },
      { label: "EM Violations", val: "0 Violations (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_approve_tapeout",
        label: "Approve full-chip Voltus signoff package and stream out final GDSII/OASIS mask data to foundry fab",
        correct: true,
        explanation: "Correct! With all static, dynamic, EM, and UPF signoff metrics verified within foundry tolerances, the chip is ready for successful first-pass silicon tapeout.",
      },
      {
        id: "opt_reject_clean_design",
        label: "Reject the tapeout and redesign the entire chip from scratch for no reason",
        correct: false,
        explanation: "Rejecting a 100% clean, verified design wastes months of engineering and millions of dollars.",
      },
    ],
  },
];
