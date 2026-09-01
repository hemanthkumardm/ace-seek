// ============================================================================
// CADENCE INNOVUS PHYSICAL DESIGN (PnR) MASTER SCENARIOS DATASET
// 70 Production-Level Scenarios across 7 Distinct Physical Design Domains
// Derived from 1,500+ Top Semiconductor Company Interview Standards
// ============================================================================

export interface PnrScenario {
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
  beforeMetrics: { label: string; val: string; bad: boolean }[];
  afterMetrics: { label: string; val: string; bad: boolean }[];
  options: {
    id: string;
    label: string;
    correct: boolean;
    explanation: string;
  }[];
}

export interface PnrDomain {
  id: string;
  name: string;
  shortName: string;
  iconName: string;
  description: string;
  count: number;
}

export const PNR_DOMAINS: PnrDomain[] = [
  {
    id: "floorplan_pdn",
    name: "Floorplanning, Macro Placement & PDN",
    shortName: "Floorplan & PDN",
    iconName: "Layout",
    description: "Die sizing, aspect ratio, macro placement channels, flyline analysis, halos, and Power Distribution Network (PDN) mesh synthesis.",
    count: 10,
  },
  {
    id: "placement_cong",
    name: "Standard Cell Placement & Congestion",
    shortName: "Placement & Cong",
    iconName: "Grid",
    description: "Global analytical placement, early global routing (eGR) overflow hotspots, density padding, well-tap, and endcap legalization.",
    count: 10,
  },
  {
    id: "ccopt_cts",
    name: "Clock Tree Synthesis (CCOpt CTS) & Skew",
    shortName: "CTS & Useful Skew",
    iconName: "Clock",
    description: "Clock Concurrent Optimization, insertion delay, global/local skew balancing, Non-Default Routing (NDR) shielding, and clock gating.",
    count: 10,
  },
  {
    id: "nanoroute_drc",
    name: "NanoRoute Detailed Routing & Antenna DRC",
    shortName: "Routing & Antenna",
    iconName: "GitBranch",
    description: "Track assignment, detailed grid routing, FinFET pin access, via enclosure, and plasma etching Process Antenna Effect rules.",
    count: 10,
  },
  {
    id: "signal_integrity",
    name: "Signal Integrity, Cross-Talk & Glitch Noise",
    shortName: "Signal Integrity (SI)",
    iconName: "Zap",
    description: "Miller coupling capacitance, victim-aggressor delta delay, cross-talk glitch peak noise, and dynamic switching IR drop sag.",
    count: 10,
  },
  {
    id: "timing_closure_eco",
    name: "Post-Route Timing Closure & Signoff ECO",
    shortName: "Timing Closure & ECO",
    iconName: "Activity",
    description: "Multi-Mode Multi-Corner (MMMC) closure, POCV Gaussian derating, hold buffer insertion, and spare-cell functional metal ECOs.",
    count: 10,
  },
  {
    id: "pv_signoff_dfm",
    name: "Physical Verification (DRC/LVS) & DFM",
    shortName: "DRC/LVS & DFM",
    iconName: "ShieldCheck",
    description: "Calibre/Pegasus DRC/LVS/ERC rules, redundant via doubling, dummy metal fill density balancing, and Well Proximity Effect (WPE).",
    count: 10,
  },
];

export const PNR_SCENARIOS: PnrScenario[] = [
  // =========================================================================
  // DOMAIN 1: FLOORPLANNING, MACRO PLACEMENT & PDN (10 Scenarios)
  // =========================================================================
  {
    id: 0,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Narrow Macro Channel Routing Congestion & Pin Blocking",
    severity: "CRITICAL",
    stageName: "Floorplan / Early Global Route (eGR)",
    symptom: "Two 512KB SRAM macros placed 8 µm apart created a 160% routing overflow hotspot in the narrow corridor, blocking all bus connections.",
    logSnippet: `[INNOVUS-CONG-01] Error: Routing congestion overflow H: 14.8% V: 22.4% in G-cell region (X: 1420, Y: 850).
  Narrow corridor width: 8.2 um between SRAM_BANK_0 and SRAM_BANK_1.
  Available routing tracks: 32 | Required routing tracks: 86 (Overflow = 168%).`,
    principle: "Macro channel width must accommodate all intersecting signal buses plus power stripes. Channel formula: W_channel ≥ (N_signals * Metal_Pitch / Num_Layers) + Keepout. Macros should be pushed to chip periphery with adequate spacing.",
    remedyTcl: `create_place_halo -halo_deltas { 25 25 25 25 } -insts [get_db insts -if {.is_macro == true}]
create_route_halo -bottom_layer M1 -top_layer M4 -space 15 -insts [get_db insts -if {.is_macro == true}]
set_db place_design_macro_spacing 30`,
    beforeMetrics: [
      { label: "Corridor Routing Overflow", val: "168% (Severe Blockage)", bad: true },
      { label: "Channel Width", val: "8.2 µm", bad: true },
      { label: "Post-Route DRC Shorts", val: "480 Shorts", bad: true },
    ],
    afterMetrics: [
      { label: "Corridor Routing Overflow", val: "54% (Clean) ✓", bad: false },
      { label: "Channel Width", val: "30.0 µm ✓", bad: false },
      { label: "Post-Route DRC Shorts", val: "0 Shorts ✓", bad: false },
    ],
    options: [
      {
        id: "opt_macro_halo",
        label: "Apply placement & routing halos around macros ('create_place_halo -halo_deltas {25 25 25 25}') and push macros to periphery with 30 µm channels",
        correct: true,
        explanation: "Correct! Halos and wide channels guarantee standard cells are kept out of macro corridors, leaving sufficient metal tracks for high-density buses.",
      },
      {
        id: "opt_shrink_mem",
        label: "Manually reduce the physical footprint of the memory macro by 50%",
        correct: false,
        explanation: "Hard IP memory macro dimensions are fixed by foundry memory compilers and cannot be shrunk in PnR.",
      },
      {
        id: "opt_ignore_egr",
        label: "Ignore early global routing overflow and proceed directly to clock tree synthesis",
        correct: false,
        explanation: "Severe floorplan congestion guarantees detailed routing will fail with thousands of unroutable shorts.",
      },
    ],
  },
  {
    id: 1,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Static IR Drop Violation from Undersized Top-Metal Power Mesh",
    severity: "CRITICAL",
    stageName: "Power Planning / Voltus Static IR Signoff",
    symptom: "Center core standard cells experience a 95 mV supply drop (8.5% of VDD = 1.1V), exceeding the 33 mV (3%) signoff limit and causing severe gate slowdown.",
    logSnippet: `[VOLTUS-IR-04] Critical: Static IR Drop violation in Core Center (X: 2400, Y: 2400):
  Nominal VDD: 1.100 V | Lowest Node Voltage: 1.005 V (Drop = 95 mV / 8.6%).
  Signoff Threshold: 33 mV (3.0% VDD) - VIOLATED!
  Cause: Top metal power stripes (M7/M8) pitch is 120 um with thin 1.2 um width.`,
    principle: "Static IR drop is governed by Ohm's law: V_drop = I_avg * R_grid. To reduce grid resistance (R_grid), power meshes must use thick, low-resistivity top metal layers (M7/M8) with wider stripes and tighter set-to-set pitch.",
    remedyTcl: `# Increase power mesh density on thick top metals (M7/M8):
add_stripes -nets {VDD VSS} -layer M7 -width 4.0 -spacing 2.0 -set_to_set_distance 30.0 -start_offset 10.0
add_stripes -nets {VDD VSS} -layer M8 -width 4.0 -spacing 2.0 -set_to_set_distance 30.0 -start_offset 10.0
sroute -connect {core_pin} -nets {VDD VSS}`,
    beforeMetrics: [
      { label: "Core Center IR Drop", val: "95 mV (8.6% - FAILED)", bad: true },
      { label: "Top Stripe Pitch", val: "120 µm (Sparse)", bad: true },
      { label: "Timing Derate Penalty", val: "+18% Gate Delay", bad: true },
    ],
    afterMetrics: [
      { label: "Core Center IR Drop", val: "22 mV (2.0% - MET) ✓", bad: false },
      { label: "Top Stripe Pitch", val: "30 µm (Robust Mesh) ✓", bad: false },
      { label: "Timing Derate Penalty", val: "0% (Within Spec) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dense_mesh",
        label: "Synthesize a low-resistance M7/M8 power mesh with 4.0 µm width and 30 µm pitch using 'add_stripes' and 'sroute'",
        correct: true,
        explanation: "Correct! Adding low-resistance top-metal power stripes slashes grid resistance, bringing static IR drop well within the 3% budget.",
      },
      {
        id: "opt_increase_vdd_perm",
        label: "Increase chip external power supply voltage to 1.8V permanently",
        correct: false,
        explanation: "1.8V destroys standard cell gate oxides in modern sub-micron processes.",
      },
      {
        id: "opt_remove_stripes",
        label: "Remove power stripes to save metal routing tracks",
        correct: false,
        explanation: "Removing power stripes cuts off power delivery entirely, causing chip failure.",
      },
    ],
  },
  {
    id: 2,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Flyline Cross-Talk Density & Core Aspect Ratio Mismatch",
    severity: "HIGH",
    stageName: "Floorplan / Wirelength Optimization",
    symptom: "A rectangular die with 2.5:1 aspect ratio caused 64-bit data buses to travel 4.2 mm across the long axis, adding 850 ps interconnect delay.",
    logSnippet: `[FLOORPLAN-OPT] Warning: Long-haul interconnect congestion on horizontal axis:
  Aspect Ratio = 2.5 (Width: 4.8 mm, Height: 1.9 mm).
  Data bus 'core_to_crypto[63:0]' length = 4.2 mm (Wire RC delay = 850 ps).
  Timing slack on crypto_start = -520 ps (FAILED).`,
    principle: "Aspect ratio (AR = Height / Width) strongly influences wirelength. An aspect ratio near 1.0 (square die) minimizes average center-to-corner Manhattan distance. Non-square aspect ratios should align macro placement along communication dataflow.",
    remedyTcl: `# Re-initialize floorplan with 1.0 aspect ratio and 70% core utilization:
create_floorplan -site CoreSite -core_density_size 0.70 1.0 20 20 20 20
place_macro -insts [get_db insts -if {.is_macro == true}] -query_dataflow true`,
    beforeMetrics: [
      { label: "Aspect Ratio", val: "2.5:1 (Elongated)", bad: true },
      { label: "Longest Wire Length", val: "4.2 mm", bad: true },
      { label: "Bus Interconnect Slack", val: "-520 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Aspect Ratio", val: "1.0:1 (Square Die) ✓", bad: false },
      { label: "Longest Wire Length", val: "1.8 mm (-57%) ✓", bad: false },
      { label: "Bus Interconnect Slack", val: "+45 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_square_aspect",
        label: "Re-initialize floorplan with square aspect ratio (1.0) and dataflow-guided macro placement ('create_floorplan -core_density_size 0.7 1.0 ...')",
        correct: true,
        explanation: "Correct! A 1.0 aspect ratio minimizes average wire Manhattan distance across the chip, slashing interconnect latency by over 50%.",
      },
      {
        id: "opt_aspect_4",
        label: "Increase aspect ratio to 4.0:1 to make the chip narrower",
        correct: false,
        explanation: "Making the chip narrower increases wirelength and worst-case delay across the long axis.",
      },
      {
        id: "opt_disable_dataflow",
        label: "Disable timing checks on data buses",
        correct: false,
        explanation: "Disabling timing checks creates post-silicon functional interface failures.",
      },
    ],
  },
  {
    id: 3,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Macro Orientation & Pin Accessibility Blockage",
    severity: "HIGH",
    stageName: "Floorplan / Pin Placement",
    symptom: "SRAM macro oriented with its pin interface facing the die boundary wall (3 µm clearance), blocking 128 pin connection tracks.",
    logSnippet: `[INNOVUS-PIN-08] Error: Macro 'u_mem/sram_inst' pin interface facing Core Boundary (Clearance: 3.2 um):
  Pins { A[15:0], D[63:0], Q[63:0] } have 0 accessible routing tracks.
  128 unroutable pin access violations!`,
    principle: "Macros must be oriented (R0, R90, R180, R270, MX, MY) so that signal pin interfaces face toward the core standard cell area, never toward chip boundary walls or adjacent macro back-walls.",
    remedyTcl: `set_db [get_db insts u_mem/sram_inst] .orient R180
set_db [get_db insts u_mem/sram_inst] .location { 150 150 }
check_pin_access -insts u_mem/sram_inst`,
    beforeMetrics: [
      { label: "Accessible Pin Tracks", val: "0 / 128 (Blocked)", bad: true },
      { label: "Macro Pin Clearance", val: "3.2 µm (Wall Blocked)", bad: true },
      { label: "DRC Routing Errors", val: "128 Errors", bad: true },
    ],
    afterMetrics: [
      { label: "Accessible Pin Tracks", val: "128 / 128 (100% Free) ✓", bad: false },
      { label: "Macro Pin Clearance", val: "Facing Core Area ✓", bad: false },
      { label: "DRC Routing Errors", val: "0 Errors ✓", bad: false },
    ],
    options: [
      {
        id: "opt_orient_macro",
        label: "Rotate macro orientation (e.g. R180 or MY) to ensure pin interfaces face the core standard cell active routing channel",
        correct: true,
        explanation: "Correct! Rotating the macro so its pins face the open core area provides full track access for routing without boundary pin blockage.",
      },
      {
        id: "opt_cut_pins",
        label: "Delete blocked pins from the macro LEF file",
        correct: false,
        explanation: "Deleting pins in LEF corrupts macro functionality and causes LVS failure.",
      },
      {
        id: "opt_ignore_pins",
        label: "Route macro pins on polysilicon base layers",
        correct: false,
        explanation: "Standard cell routers cannot route long inter-block signals on high-resistance polysilicon.",
      },
    ],
  },
  {
    id: 4,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Electromigration (EM) Current Density Violation on Core Power Rails",
    severity: "HIGH",
    stageName: "Voltus Power Grid EM Signoff",
    symptom: "Standard cell M1 followpin rails carry 4.2 mA/µm², exceeding the foundry electromigration current density limit (1.5 mA/µm²) and risking metal voiding.",
    logSnippet: `[VOLTUS-EM-02] Error: Electromigration current density limit violated on M1 rail (Net: VDD):
  Peak RMS Current Density: J_rms = 4.25 mA/um² (Foundry Limit: 1.50 mA/um²).
  Risk: Metal voiding / open circuit failure within 6 months of silicon operation!`,
    principle: "Electromigration (EM) occurs when high current density causes metal atoms to drift over time, creating open-circuit voids or short-circuit hillocks. Increasing vertical M2-M6 power strap connections reduces current per M1 followpin segment.",
    remedyTcl: `add_stripes -nets {VDD VSS} -layer M2 -width 0.48 -spacing 0.48 -set_to_set_distance 12.0
sroute -connect {core_pin} -nets {VDD VSS} -target_via_layer M2`,
    beforeMetrics: [
      { label: "M1 Current Density J_rms", val: "4.25 mA/µm² (EM FAIL)", bad: true },
      { label: "Silicon Lifetime (MTTF)", val: "6 Months (Unacceptable)", bad: true },
      { label: "EM Violations", val: "84 Segments", bad: true },
    ],
    afterMetrics: [
      { label: "M1 Current Density J_rms", val: "0.82 mA/µm² (MET) ✓", bad: false },
      { label: "Silicon Lifetime (MTTF)", val: "> 10 Years (Signoff) ✓", bad: false },
      { label: "EM Violations", val: "0 Violations ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_m2_stripes",
        label: "Insert intermediate vertical M2 power straps and add dense via drop arrays to distribute followpin current ('add_stripes -layer M2')",
        correct: true,
        explanation: "Correct! Tighter vertical M2 power straps tap into M1 followpins every 12 µm, keeping current density well under 1.5 mA/µm².",
      },
      {
        id: "opt_ignore_em",
        label: "Override electromigration rules in signoff settings",
        correct: false,
        explanation: "Overriding EM rules causes catastrophic premature metal burnout in production silicon.",
      },
      {
        id: "opt_remove_rails",
        label: "Replace standard cell power rails with unshielded clock wires",
        correct: false,
        explanation: "Power rails are mandatory for supplying VDD/VSS to standard cells.",
      },
    ],
  },
  {
    id: 5,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Floating Core Regions with Missing Power Followpin Rails (sroute)",
    severity: "CRITICAL",
    stageName: "Power Planning / Connectivity DRC",
    symptom: "After floorplan changes, 2,400 standard cells in Sector B have no VDD/VSS connections, causing open-circuit LVS failure.",
    logSnippet: `[INNOVUS-SROUTE] Error: 2,400 standard cell instances in Region_B have unrouted PG pins:
  Pin 'VDD' and 'VSS' disconnected.
  LVS Check: 2,400 Open Circuits detected!`,
    principle: "Standard cell rows require horizontal followpin rails generated by `sroute`. When floorplan boundaries or row sites are regenerated, `sroute` must be re-run to connect all standard cell rows to the power rings and mesh.",
    remedyTcl: `global_net_connect VDD -type pgpin -pin VDD -inst * -override
global_net_connect VSS -type pgpin -pin VSS -inst * -override
sroute -connect {core_pin} -nets {VDD VSS} -core_pin_target {ring stripe followpin}
check_connectivity -type pg_pin`,
    beforeMetrics: [
      { label: "Unconnected Standard Cells", val: "2,400 Cells (Floating)", bad: true },
      { label: "LVS PG Status", val: "FAILED (2,400 Opens)", bad: true },
      { label: "Chip Operability", val: "DEAD SILICON", bad: true },
    ],
    afterMetrics: [
      { label: "Unconnected Standard Cells", val: "0 Cells (100% Connected) ✓", bad: false },
      { label: "LVS PG Status", val: "CLEAN PASSED ✓", bad: false },
      { label: "Chip Operability", val: "100% POWERED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sroute_fix",
        label: "Execute 'global_net_connect' followed by 'sroute -connect {core_pin} -nets {VDD VSS}' to regenerate all standard cell row followpin rails",
        correct: true,
        explanation: "Correct! Global net connection and sroute connect every standard cell row to the power grid, resolving all open-circuit PG errors.",
      },
      {
        id: "opt_manual_wire_vss",
        label: "Manually route each of the 2,400 cell pins with signal routing tools",
        correct: false,
        explanation: "Manual routing of PG pins takes excessive time and violates standard cell library rail rules.",
      },
      {
        id: "opt_delete_region_b",
        label: "Delete Region B from the design",
        correct: false,
        explanation: "Deleting design regions removes functional logic.",
      },
    ],
  },
  {
    id: 6,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Flip-Chip C4 Bump Array Pitch Alignment & Power Pad Density",
    severity: "HIGH",
    stageName: "I/O Floorplan / Bump Array Planning",
    symptom: "Flip-chip C4 solder bump pitch was misaligned with the RDL (Redistribution Layer) routing grid, causing 42 DRC shorts between adjacent power bumps.",
    logSnippet: `[BUMP-ALIGN-01] Error: 42 C4 bump pitch violations on RDL layer:
  Required bump pitch: 150 um | Actual bump pitch: 110 um.
  Solder bridge short-circuit risk between VDD and VSS bumps!`,
    principle: "In flip-chip packaging, C4 bumps must follow strict regular grid arrays matching packaging vendor rules (typically 130-180 µm pitch). RDL routing must distribute power uniformly across core PG bump pairs.",
    remedyTcl: `create_bump_array -name C4_ARRAY -pitch { 150 150 } -pattern staggered -pg_nets { VDD VSS }
route_rdl -nets { VDD VSS } -layer RDL`,
    beforeMetrics: [
      { label: "C4 Bump Pitch", val: "110 µm (Violated)", bad: true },
      { label: "RDL DRC Shorts", val: "42 Shorts", bad: true },
      { label: "Packaging Yield", val: "0% (Solder Bridge)", bad: true },
    ],
    afterMetrics: [
      { label: "C4 Bump Pitch", val: "150 µm (Vendor Compliant) ✓", bad: false },
      { label: "RDL DRC Shorts", val: "0 Shorts ✓", bad: false },
      { label: "Packaging Yield", val: "99.8% Yield ✓", bad: false },
    ],
    options: [
      {
        id: "opt_bump_array_legal",
        label: "Define packaging-compliant staggered C4 bump array with 150 µm pitch ('create_bump_array -pitch {150 150}') and route RDL",
        correct: true,
        explanation: "Correct! Legal bump pitch alignment prevents solder bridging during flip-chip reflow and ensures uniform power delivery.",
      },
      {
        id: "opt_switch_wirebond",
        label: "Convert 2,000-pin processor to perimeter wire-bonding",
        correct: false,
        explanation: "High-pin-count processors exceed perimeter wire-bond pad capacity.",
      },
      {
        id: "opt_remove_vss_bumps",
        label: "Remove VSS bumps to double the spacing",
        correct: false,
        explanation: "Removing ground bumps destroys signal return paths and power ground loops.",
      },
    ],
  },
  {
    id: 7,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Decap Cell Starvation Causing Dynamic IR Drop Voltage Sag",
    severity: "HIGH",
    stageName: "Power Planning / Dynamic IR Drop",
    symptom: "Simultaneous clock switching of 10,000 flip-flops causes an 85 mV dynamic IR drop spike, resulting in clock jitter and setup timing failure.",
    logSnippet: `[VOLTUS-DYNAMIC-IR] Warning: Dynamic IR Drop spike = 85 mV (7.7% of VDD) during clock rise (Time: 2.4 ns):
  Localized Decap capacitance in Sector 3 is only 1.2 pF (Required: 8.5 pF).
  Clock buffer propagation delay degraded by +240 ps!`,
    principle: "Dynamic IR drop occurs during instantaneous clock edge switching (L * di/dt + R * i(t)). Decoupling capacitor (Decap) cells act as local charge reservoirs to supply instantaneous switching current, dampening voltage sag.",
    remedyTcl: `add_decap_cell_candidates -cells { DECAP_X16 DECAP_X32 }
add_decap -cells { DECAP_X16 DECAP_X32 } -target_density 12.0
set_db opt_dynamic_ir_effort high`,
    beforeMetrics: [
      { label: "Dynamic IR Drop Spike", val: "85 mV (7.7% - Jitter)", bad: true },
      { label: "Local Decap Capacitance", val: "1.2 pF (Starved)", bad: true },
      { label: "Clock Edge Delay Jitter", val: "+240 ps", bad: true },
    ],
    afterMetrics: [
      { label: "Dynamic IR Drop Spike", val: "24 mV (2.1% - Clean) ✓", bad: false },
      { label: "Local Decap Capacitance", val: "9.2 pF ✓", bad: false },
      { label: "Clock Edge Delay Jitter", val: "+15 ps ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_decap",
        label: "Insert boundary and empty-space Decap standard cells with 12% target density ('add_decap -target_density 12.0') around clock buffers",
        correct: true,
        explanation: "Correct! Decap cells store local electrostatic charge, providing instantaneous current during clock transitions and reducing dynamic IR drop to 24 mV.",
      },
      {
        id: "opt_lower_clock_freq",
        label: "Halve the target clock frequency",
        correct: false,
        explanation: "Halving clock frequency degrades chip performance.",
      },
      {
        id: "opt_remove_clock_buffers",
        label: "Delete clock buffers",
        correct: false,
        explanation: "Deleting clock buffers destroys clock tree distribution.",
      },
    ],
  },
  {
    id: 8,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Macro Placement Boundary Notch Creating Dead Silicon & DRC Traps",
    severity: "MEDIUM",
    stageName: "Floorplan / Notch DRC",
    symptom: "Placing an L-shaped macro arrangement left a 4 µm notch corner where standard cells cannot be placed, trapping routing tracks.",
    logSnippet: `[FLOORPLAN-NOTCH] Warning: Floorplan notch detected between MACRO_A and MACRO_B:
  Notch dimension: 4.2 um x 6.5 um (Below minimum placement site threshold).
  Dead silicon area created. DRC boundary violation risk.`,
    principle: "Floorplan notches and concave recesses between macros create unplaceable dead silicon zones and severe routing congestion traps. Macros should be aligned flush to core edges to form clean convex rectangular bounding boxes.",
    remedyTcl: `create_place_blockage -type hard -box { 120 120 180 180 }
# Or snap macros flush to outer boundaries:
set_db [get_db insts MACRO_A] .location { 50 50 }
set_db [get_db insts MACRO_B] .location { 50 350 }`,
    beforeMetrics: [
      { label: "Dead Notch Area", val: "4.2 µm x 6.5 µm (Dead Zone)", bad: true },
      { label: "DRC Notch Hazard", val: "HIGH", bad: true },
      { label: "Routing Track Waste", val: "18 Tracks Lost", bad: true },
    ],
    afterMetrics: [
      { label: "Dead Notch Area", val: "0 µm² (Flush Edge) ✓", bad: false },
      { label: "DRC Notch Hazard", val: "CLEAN 0 ✓", bad: false },
      { label: "Routing Track Waste", val: "0 Tracks Lost ✓", bad: false },
    ],
    options: [
      {
        id: "opt_flush_macro_snap",
        label: "Align macros flush along core boundaries to eliminate notches or place hard blockage over unplaceable micro-gaps",
        correct: true,
        explanation: "Correct! Eliminating notches forms clean rectangular standard cell placement cavities and prevents routing traps.",
      },
      {
        id: "opt_shrink_core",
        label: "Delete the standard cell core",
        correct: false,
        explanation: "Deleting the core destroys the chip design.",
      },
      {
        id: "opt_fill_with_inverters",
        label: "Manually fill the notch with unclocked inverters",
        correct: false,
        explanation: "Filling micro-notches with active gates creates severe pin access DRC shorts.",
      },
    ],
  },
  {
    id: 9,
    domainId: "floorplan_pdn",
    domainName: "Floorplanning & PDN",
    title: "Well-Tap Cell Pitch DRC Rule Violation (Latch-Up Prevention)",
    severity: "HIGH",
    stageName: "Floorplan / Physical Cell Insertion",
    symptom: "Foundry DRC reports 340 Latch-Up rule violations because standard cell n-well/p-substrate distance exceeds the maximum 60 µm tap pitch.",
    logSnippet: `[DRC-LATCHUP-01] Error: Well tap distance violation:
  Maximum allowed distance from any standard cell to nearest well-tap: 30 um (Pitch: 60 um).
  Distance found in Sector 4: 84.5 um (340 cells at risk of CMOS Latch-Up burnout!).`,
    principle: "CMOS circuits contain parasitic pnpn silicon-controlled rectifiers (SCR). If voltage spikes trigger the SCR, a low-resistance short forms between VDD and VSS (latch-up), permanently destroying the chip. Well-tap cells tie N-well to VDD and P-substrate to VSS at regular intervals (typically every 50-60 µm).",
    remedyTcl: `add_well_taps -cell TAPCELL_X1 -checker_board -max_distance 50.0
check_well_taps -max_distance 50.0`,
    beforeMetrics: [
      { label: "Max Well-Tap Distance", val: "84.5 µm (DRC FAIL)", bad: true },
      { label: "Latch-Up Violations", val: "340 Cells at Risk", bad: true },
      { label: "Silicon Reliability", val: "FATAL SCR BURNOUT", bad: true },
    ],
    afterMetrics: [
      { label: "Max Well-Tap Distance", val: "48.2 µm (MET) ✓", bad: false },
      { label: "Latch-Up Violations", val: "0 Violations ✓", bad: false },
      { label: "Silicon Reliability", val: "100% PROTECTED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_welltaps",
        label: "Insert regular checkerboard well-tap cells with maximum 50 µm spacing using 'add_well_taps -max_distance 50.0'",
        correct: true,
        explanation: "Correct! Inserting well-tap cells at a 50 µm pitch ensures all standard cells are within the maximum safe distance to substrate/well contacts, eliminating CMOS latch-up risk.",
      },
      {
        id: "opt_ignore_latchup",
        label: "Ignore latch-up warnings and tape out without tap cells",
        correct: false,
        explanation: "Ignoring latch-up guarantees physical silicon burnout under normal operation.",
      },
    ],
  },
  // =========================================================================
  // DOMAIN 2: STANDARD CELL PLACEMENT & CONGESTION (10 Scenarios)
  // =========================================================================
  {
    id: 10,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Global Analytical Placement Hotspot with 98% Local Cell Density",
    severity: "CRITICAL",
    stageName: "Placement / place_opt_design",
    symptom: "Analytical placement concentrated 4,200 arithmetic gates in a 40x40 µm hotspot, causing severe pin density congestion.",
    logSnippet: `[INNOVUS-PLACE-02] Error: Local cell density exceeds 98% in Region (X: 1800, Y: 1200):
  Pin density = 1.84 pins/um² (Target Limit: 0.85 pins/um²).
  Early Global Route (eGR) reports 240 G-cells with overflow > 4.`,
    principle: "High cell density combined with high pin density creates unroutable pin access pin-traps. Applying partial placement density blockages or cell padding around high-pin-density cells forces the placer to spread cells evenly.",
    remedyTcl: `set_db place_opt_congestion_effort high
create_place_blockage -type partial -density 65 -box { 1750 1150 1900 1300 }
set_db place_opt_run_global_place true
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Local Cell Density", val: "98.4% (Hotspot)", bad: true },
      { label: "Pin Density", val: "1.84 pins/µm²", bad: true },
      { label: "eGR Overflow G-Cells", val: "240 Hotspots", bad: true },
    ],
    afterMetrics: [
      { label: "Local Cell Density", val: "64.2% (Spread) ✓", bad: false },
      { label: "Pin Density", val: "0.78 pins/µm² ✓", bad: false },
      { label: "eGR Overflow G-Cells", val: "0 Hotspots ✓", bad: false },
    ],
    options: [
      {
        id: "opt_place_density_block",
        label: "Apply 65% partial placement density blockage over hotspot ('create_place_blockage -type partial -density 65') and set 'place_opt_congestion_effort high'",
        correct: true,
        explanation: "Correct! Partial density blockages prevent the analytical placer from clustering cells above 65% density, eliminating pin access congestion.",
      },
      {
        id: "opt_hard_blockage_all",
        label: "Apply a 100% hard blockage over the entire core",
        correct: false,
        explanation: "A 100% hard blockage blocks all standard cell placement.",
      },
      {
        id: "opt_remove_alu",
        label: "Delete the arithmetic logic from the netlist",
        correct: false,
        explanation: "Deleting logic removes functional processor instructions.",
      },
    ],
  },
  {
    id: 11,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Missing Endcap Cells Causing N-Well Boundary DRC Violations",
    severity: "HIGH",
    stageName: "Placement / Physical Cell Legalization",
    symptom: "Foundry DRC flags 1,200 N-well edge spacing errors at the left and right row boundaries of standard cell core rows.",
    logSnippet: `[DRC-NWELL-08] Error: 1,200 N-well boundary violations at row terminations:
  Standard cell N-wells terminate abruptly without termination endcaps.
  Risk: Diffusion boundary encroachment and design rule violation.`,
    principle: "Endcap cells must be placed at the left and right ends of every standard cell row, as well as surrounding macro boundaries, to provide proper N-well and implant layer termination.",
    remedyTcl: `add_endcaps -left_cells ENDCAP_L -right_cells ENDCAP_R -prefix ENDCAP
check_endcaps`,
    beforeMetrics: [
      { label: "Row Boundary Violations", val: "1,200 DRC Errors", bad: true },
      { label: "Endcap Coverage", val: "0% (Missing)", bad: true },
      { label: "DRC Signoff Status", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Row Boundary Violations", val: "0 Errors ✓", bad: false },
      { label: "Endcap Coverage", val: "100% (Fully Capped) ✓", bad: false },
      { label: "DRC Signoff Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_endcaps",
        label: "Insert left and right standard cell row boundary endcaps using 'add_endcaps -left_cells ENDCAP_L -right_cells ENDCAP_R'",
        correct: true,
        explanation: "Correct! Endcap cells isolate N-well layers and ensure physical continuity at all row terminations.",
      },
      {
        id: "opt_extend_rows",
        label: "Extend rows into the I/O pad ring",
        correct: false,
        explanation: "Extending rows into pad rings shorts standard cells to high-voltage I/O circuitry.",
      },
      {
        id: "opt_delete_endcaps",
        label: "Ignore N-well spacing errors in signoff",
        correct: false,
        explanation: "N-well spacing errors cause wafer fabrication failures.",
      },
    ],
  },
  {
    id: 12,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Tie-High / Tie-Low Pin Fanout DRC Overloading (max_fanout 840)",
    severity: "MEDIUM",
    stageName: "Placement / Tie Cell Legalization",
    symptom: "A single TIEHI cell drives 840 unused inputs, causing high-fanout slew violations and metal routing congestion.",
    logSnippet: `[DRC-MAX-FANOUT] Warning: Net 'tie_high_net' has fanout = 840 (Limit: 16):
  Driver: 'u_tie/TIEHI_inst/Y' (Load Cap: 2.4 pF, Slew: 1.45 ns).
  Router failed to route 840 tie branches cleanly.`,
    principle: "Static 1'b0 and 1'b1 inputs should never be tied directly to VDD/VSS rails or driven by a single shared tie cell across the chip. Tie cells must be duplicated locally with fanout ≤ 8 to 16.",
    remedyTcl: `set_db add_tie_cells_max_fanout 16
set_db add_tie_cells_max_distance 20.0
add_tie_cells -cells { TIEHI TIELO } -prefix TIE_LOCAL`,
    beforeMetrics: [
      { label: "Tie Net Fanout", val: "840 Loads (Overloaded)", bad: true },
      { label: "Tie Net Slew", val: "1.45 ns (Violated)", bad: true },
      { label: "Tie Cell Instances", val: "1 Global Cell", bad: true },
    ],
    afterMetrics: [
      { label: "Tie Net Fanout", val: "12 Max Loads ✓", bad: false },
      { label: "Tie Net Slew", val: "0.08 ns (Crisp) ✓", bad: false },
      { label: "Tie Cell Instances", val: "72 Local Cells ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_tie_cells_local",
        label: "Distribute dedicated local TIEHI/TIELO cells with max fanout 16 using 'add_tie_cells -cells {TIEHI TIELO} -max_fanout 16'",
        correct: true,
        explanation: "Correct! Inserting localized tie cells with low fanout limits keeps capacitance low and eliminates long tie-wire routing.",
      },
      {
        id: "opt_direct_rail_tie",
        label: "Tie all 840 pins directly to the VDD power ring using vias",
        correct: false,
        explanation: "Direct rail connections risk ESD gate oxide breakdown during manufacturing testing.",
      },
      {
        id: "opt_invert_tie",
        label: "Invert the 840 pins to tie them to zero",
        correct: false,
        explanation: "Inverting pins alters functional logic values.",
      },
    ],
  },
  {
    id: 13,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Magnet Placement Mismatch for Timing-Critical Interface Registers",
    severity: "HIGH",
    stageName: "Placement / Timing-Driven Placement",
    symptom: "Interface registers connected to high-speed PCIe I/O pads were scattered 2 mm away into the core, missing setup by -480 ps.",
    logSnippet: `[TIMING-PATH] Endpoint: 'u_pcie/tx_data_reg/D' (Slack: -480 ps):
  Driver: 'pad_pcie_tx_in' (X: 100, Y: 100) -> Flop: (X: 2100, Y: 1850).
  Physical Distance = 2.4 mm (Interconnect Delay = 640 ps).`,
    principle: "I/O boundary interface registers must be placed in close physical proximity to their corresponding I/O pads using magnet placement or guided region constraints (`create_guide` / `magnet_placement`).",
    remedyTcl: `magnet_placement -pins [get_db ports pcie_*] -pull_stages 2 -radius 250
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "I/O Flop Distance", val: "2.4 mm (Scattered)", bad: true },
      { label: "I/O Path Interconnect Delay", val: "640 ps", bad: true },
      { label: "PCIe Interface Slack", val: "-480 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "I/O Flop Distance", val: "180 µm (Local) ✓", bad: false },
      { label: "I/O Path Interconnect Delay", val: "65 ps (-90%) ✓", bad: false },
      { label: "PCIe Interface Slack", val: "+55 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_magnet_place",
        label: "Execute magnet placement to pull interface flops within 250 µm of the PCIe I/O pads ('magnet_placement -pins [get_db ports pcie_*]')",
        correct: true,
        explanation: "Correct! Magnet placement pulls sequential registers close to their associated pad locations, slashing wire delay by 90%.",
      },
      {
        id: "opt_slow_pcie",
        label: "Slow down the PCIe interface clock from 1 GHz to 200 MHz",
        correct: false,
        explanation: "Slowing down interface clock violates PCIe protocol specifications.",
      },
      {
        id: "opt_delete_flops",
        label: "Delete the interface registers",
        correct: false,
        explanation: "Deleting interface registers destroys input synchronization.",
      },
    ],
  },
  {
    id: 14,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Multi-Bit Cell Splitting Due to Row Site Disalignment",
    severity: "MEDIUM",
    stageName: "Placement / Legalization",
    symptom: "Legalizer split 128 4-bit multi-bit cells into single-bit flops because standard cell row site boundaries did not support multi-width heights.",
    logSnippet: `[INNOVUS-LEGAL-04] Warning: 128 multi-bit cells (DFFHQX4) could not be legalized:
  Cell width exceeds placement site boundary. De-merging to single-bit cells.
  Clock power increased by +18.4 mW!`,
    principle: "Multi-bit standard cells require double-row or specific site pitch alignment. Placement site grids must support the cell architecture and multi-bit placement flags must be enabled during global placement.",
    remedyTcl: `set_db place_opt_multibit_cells true
set_db place_design_legalize_multibit true
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "De-Merged Multi-Bit Cells", val: "128 Cells (Split)", bad: true },
      { label: "Clock Network Power", val: "48.2 mW (+38%)", bad: true },
      { label: "Standard Cell Area", val: "+8.4% Bloat", bad: true },
    ],
    afterMetrics: [
      { label: "De-Merged Multi-Bit Cells", val: "0 (100% Legalized) ✓", bad: false },
      { label: "Clock Network Power", val: "29.8 mW (-38%) ✓", bad: false },
      { label: "Standard Cell Area", val: "Optimal ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_mb_place",
        label: "Enable multi-bit placement legalization ('set_db place_opt_multibit_cells true' and 'set_db place_design_legalize_multibit true')",
        correct: true,
        explanation: "Correct! Enabling multi-bit placement awareness guides the analytical placer to legal multi-site row coordinates, preventing cell de-merging.",
      },
      {
        id: "opt_ban_multibit",
        label: "Permanently ban multi-bit cells from the design",
        correct: false,
        explanation: "Banning multi-bit cells increases dynamic clock power significantly.",
      },
      {
        id: "opt_random_placement",
        label: "Disable legalization checks",
        correct: false,
        explanation: "Disabling legalization leaves overlapping cells, causing physical short circuits.",
      },
    ],
  },
  {
    id: 15,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "High-Fanout Net (HFN) Buffer Tree Clustering Causing Placement Blasts",
    severity: "HIGH",
    stageName: "Placement / High-Fanout Synthesis",
    symptom: "Synthesis inserted 64 high-drive buffers for a reset tree at the exact same coordinate, creating a 100% placement blockage.",
    logSnippet: `[INNOVUS-PLACE-09] Error: 64 high-drive buffers (BUFX16) placed in overlapping 10x10 um space:
  Cell overlap detected at (X: 1200, Y: 1400).
  Legalizer pushed surrounding logic 400 um away, degrading 85 timing paths!`,
    principle: "High-fanout nets (HFN) must be distributed throughout the core using balanced buffer tree placement rather than clustered at the driver pin. Innovus must synthesize balanced HFN trees across physical quadrants.",
    remedyTcl: `set_db place_opt_hfn_synthesis true
set_db place_opt_max_fanout 32
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "HFN Buffer Overlap", val: "64 Clustered Cells", bad: true },
      { label: "Displaced Logic Distance", val: "400 µm", bad: true },
      { label: "Degraded Timing Paths", val: "85 Endpoints", bad: true },
    ],
    afterMetrics: [
      { label: "HFN Buffer Overlap", val: "0 (Uniform Tree) ✓", bad: false },
      { label: "Displaced Logic Distance", val: "0 µm ✓", bad: false },
      { label: "Degraded Timing Paths", val: "0 Endpoints ✓", bad: false },
    ],
    options: [
      {
        id: "opt_hfn_synth",
        label: "Enable physical high-fanout net buffer distribution synthesis ('set_db place_opt_hfn_synthesis true') during placement",
        correct: true,
        explanation: "Correct! Physical HFN synthesis distributes repeaters across the floorplan near their actual loads, avoiding localized cell clusters.",
      },
      {
        id: "opt_single_gigantic_buf",
        label: "Replace the 64 buffers with a single giant off-chip buffer",
        correct: false,
        explanation: "Off-chip buffers add nanoseconds of pad delay.",
      },
      {
        id: "opt_delete_reset_tree",
        label: "Delete the reset network",
        correct: false,
        explanation: "Deleting the reset network leaves sequential logic uninitialized.",
      },
    ],
  },
  {
    id: 16,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Padding Insertion to Prevent Pin Access Congestion on High-Drive Cells",
    severity: "MEDIUM",
    stageName: "Placement / Cell Padding",
    symptom: "High-drive inverters (INVX32) and multiplexers with 16 input pins placed side-by-side caused 80 detailed routing shorts.",
    logSnippet: `[NANOROUTE-DRC] Error: 80 pin access shorts on M1/M2 around adjacent INVX32 and MUX4X16 cells:
  Routing tracks on M1 exhausted by congested pin access.`,
    principle: "High-pin-density and high-drive cells require empty space around them to provide adequate routing tracks for pin access. Applying cell padding (keepout halo) reserves routing tracks around congested cell types.",
    remedyTcl: `specify_cell_pad -cells { *INVX32* *MUX4X16* *AOI22X8* } -left 2 -right 2
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Pin Access DRC Shorts", val: "80 Shorts (M1/M2)", bad: true },
      { label: "Cell Spacing", val: "Abutted (0 Sites)", bad: true },
      { label: "Routing Cleanliness", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Pin Access DRC Shorts", val: "0 Shorts ✓", bad: false },
      { label: "Cell Spacing", val: "2 Sites Left/Right ✓", bad: false },
      { label: "Routing Cleanliness", val: "100% ROUTABLE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_cell_pad",
        label: "Apply cell padding to high-pin-density standard cells ('specify_cell_pad -cells {*INVX32* *MUX4X16*} -left 2 -right 2')",
        correct: true,
        explanation: "Correct! Cell padding forces 2 placement sites of blank space on either side of dense gates, leaving tracks open for pin connections.",
      },
      {
        id: "opt_remove_inverters",
        label: "Delete all inverters from the chip",
        correct: false,
        explanation: "Inverters are fundamental to CMOS logic.",
      },
      {
        id: "opt_ignore_drc_shorts",
        label: "Ignore M1/M2 routing shorts in signoff",
        correct: false,
        explanation: "M1/M2 shorts cause chip non-functionality.",
      },
    ],
  },
  {
    id: 17,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Regional Bound Constraint (Group) Placement for Datapath Blocks",
    severity: "MEDIUM",
    stageName: "Placement / Bound Constraints",
    symptom: "FPU multiplier adder tree registers were placed randomly across the core, creating a 4-cycle pipeline delay penalty.",
    logSnippet: `[TIMING-REPORT] Path 'fpu_stage1 -> fpu_stage2' delay = 1.25 ns (Target: 0.833 ns):
  Cells belonging to 'u_fpu_core' scattered over 3.2 mm² area.`,
    principle: "Instantiating a regional placement bound (group constraint) forces the placer to keep all sub-module cells within a dedicated rectangular bounding box, minimizing internal datapath wirelength.",
    remedyTcl: `create_region -name REGION_FPU -box { 800 800 1400 1400 }
add_to_region REGION_FPU [get_db modules u_fpu_core]
place_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "FPU Cell Dispersion", val: "3.2 mm² (Scattered)", bad: true },
      { label: "Internal FPU Delay", val: "1.25 ns (Failed)", bad: true },
      { label: "WNS Slack", val: "-417 ps", bad: true },
    ],
    afterMetrics: [
      { label: "FPU Cell Dispersion", val: "0.36 mm² (Compact) ✓", bad: false },
      { label: "Internal FPU Delay", val: "0.58 ns (-53%) ✓", bad: false },
      { label: "WNS Slack", val: "+65 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_create_region",
        label: "Create a bounded placement region for the FPU module ('create_region -name REGION_FPU' and 'add_to_region')",
        correct: true,
        explanation: "Correct! Restricting FPU cells to a dedicated 600x600 µm region guarantees compact local interconnects, closing timing.",
      },
      {
        id: "opt_flatten_fpu",
        label: "Ungroup the FPU and scatter cells across the full die",
        correct: false,
        explanation: "Scattering cells across the die increases wire delay.",
      },
      {
        id: "opt_slow_fpu_clk",
        label: "Reduce the clock frequency of the processor",
        correct: false,
        explanation: "Reducing clock frequency violates product specs.",
      },
    ],
  },
  {
    id: 18,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Filler Cell Density DRC & Base Layer N-Well Continuity",
    severity: "HIGH",
    stageName: "Placement / Chip Finishing",
    symptom: "Unfilled gaps between standard cells caused base-layer N-well and implant DRC violations across 8,400 core sites.",
    logSnippet: `[DRC-BASE-01] Error: 8,400 base-layer DRC violations:
  Unfilled gaps in standard cell rows detected.
  Missing N-well and poly dummy continuity!`,
    principle: "After standard cell placement and legalization, all remaining empty row sites must be populated with non-functional Filler cells (from widest FILL64 down to FILL1) to ensure continuous N-well, implant, and power rail connections.",
    remedyTcl: `add_fillers -cells { FILL64 FILL32 FILL16 FILL8 FILL4 FILL2 FILL1 } -prefix FILLER
check_fillers`,
    beforeMetrics: [
      { label: "Empty Row Sites", val: "8,400 Gaps (DRC FAIL)", bad: true },
      { label: "Base Layer DRC Errors", val: "8,400 Errors", bad: true },
      { label: "Fabrication Readiness", val: "REJECTED BY FOUNDRY", bad: true },
    ],
    afterMetrics: [
      { label: "Empty Row Sites", val: "0 Gaps (100% Filled) ✓", bad: false },
      { label: "Base Layer DRC Errors", val: "0 Errors ✓", bad: false },
      { label: "Fabrication Readiness", val: "100% FOUNDRY PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_fillers",
        label: "Insert standard cell filler cells in descending order ('add_fillers -cells {FILL64 FILL32 ... FILL1}')",
        correct: true,
        explanation: "Correct! Inserting filler cells fills all physical gaps, maintaining N-well continuity and satisfying foundry DRC rules.",
      },
      {
        id: "opt_ignore_fillers",
        label: "Skip filler cell insertion to save database memory",
        correct: false,
        explanation: "Skipping filler cells causes immediate foundry mask fabrication rejection.",
      },
      {
        id: "opt_fill_with_flops",
        label: "Fill all empty gaps with active flip-flops",
        correct: false,
        explanation: "Filling with active flip-flops multiplies power consumption unnecessarily.",
      },
    ],
  },
  {
    id: 19,
    domainId: "placement_cong",
    domainName: "Placement & Congestion",
    title: "Spare Cell Array Distribution for Post-Silicon Metal ECOs",
    severity: "MEDIUM",
    stageName: "Placement / ECO Readiness",
    symptom: "Post-silicon bug requires fixing a 2-input NAND logic condition, but zero spare gates exist nearby, requiring a $2M full mask respin!",
    logSnippet: `[ECO-FAIL] Critical: Post-silicon metal-only ECO aborted:
  No uncommitted spare standard cells within 500 um radius of bug location.
  Requires modifying all 48 base layers ($2,000,000 respin cost!).`,
    principle: "In production ASICs, spare cell arrays (containing uncommitted NAND, NOR, Inverter, MUX, and Flop cells tied to VDD/VSS with `dont_touch`) must be uniformly sprinkled across the die (typically 1-2% of area) to allow cheap metal-only ECOs.",
    remedyTcl: `add_spare_cells -cell_instances { SPARE_NAND2 2 SPARE_INV 2 SPARE_DFF 1 } -step { 100 100 } -prefix SPARE
set_dont_touch [get_cells SPARE*] true`,
    beforeMetrics: [
      { label: "Spare Cell Density", val: "0% (Zero Spare Gates)", bad: true },
      { label: "Post-Silicon Fix Cost", val: "$2,000,000 (Full Mask)", bad: true },
      { label: "Respin Turnaround", val: "4 Months Delay", bad: true },
    ],
    afterMetrics: [
      { label: "Spare Cell Density", val: "1.5% Uniform Grid ✓", bad: false },
      { label: "Post-Silicon Fix Cost", val: "$85,000 (Metal Only) ✓", bad: false },
      { label: "Respin Turnaround", val: "2 Weeks ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_spare_cells",
        label: "Sprinkle uniform spare cell arrays across the core ('add_spare_cells') and protect them with 'set_dont_touch'",
        correct: true,
        explanation: "Correct! Sprinkled spare gates provide ready-to-wire logic across the chip, enabling low-cost metal-layer-only ECO fixes.",
      },
      {
        id: "opt_no_spare_cells",
        label: "Ban all spare cells to save 1% die area",
        correct: false,
        explanation: "Banning spare cells prevents rapid, cost-effective post-silicon bug fixes.",
      },
      {
        id: "opt_tie_spare_clocks",
        label: "Connect spare flip-flops to high-speed functional clocks",
        correct: false,
        explanation: "Clocking unused spare cells wastes dynamic power.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 3: CLOCK TREE SYNTHESIS (CCOPT CTS) & SKEW (10 Scenarios)
  // =========================================================================
  {
    id: 20,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Excessive Clock Insertion Delay (Latency) on 1.2 GHz Core Clock",
    severity: "CRITICAL",
    stageName: "CTS / clock_opt_design",
    symptom: "Core clock tree insertion delay reached 1.85 ns on an 833 ps clock cycle, causing extreme on-chip variation (OCV) timing uncertainty.",
    logSnippet: `[CCOPT-LATENCY] Warning: Max clock insertion delay = 1.85 ns (Target: < 0.60 ns):
  Clock root: 'clk_core_1g2' (14 buffer levels, 48,000 sink flops).
  OCV derate (10%) introduces ±185 ps clock jitter, destroying setup slack!`,
    principle: "Long clock insertion delay (latency) magnifies On-Chip Variation (OCV) penalties across PVT corners. High-speed clock trees should use high-drive balanced clock inverters, symmetric tree topologies, and tight slew targets (80-100 ps).",
    remedyTcl: `create_clock_tree_spec -out ccopt.spec
set_db ccopt_target_insertion_delay 0.500
set_db ccopt_target_skew 0.040
set_db ccopt_target_max_trans 0.080
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Clock Insertion Delay", val: "1.85 ns (Excessive)", bad: true },
      { label: "Clock Buffer Levels", val: "14 Levels", bad: true },
      { label: "OCV Uncertainty Impact", val: "±185 ps Slack Loss", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Insertion Delay", val: "0.48 ns (Sharp) ✓", bad: false },
      { label: "Clock Buffer Levels", val: "6 Levels ✓", bad: false },
      { label: "OCV Uncertainty Impact", val: "±48 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_ccopt_target_lat",
        label: "Constrain target insertion delay to 0.5 ns with tight 80 ps slew limits ('set_db ccopt_target_insertion_delay 0.500' and 'clock_opt_design')",
        correct: true,
        explanation: "Correct! Sizing clock buffers properly and enforcing tight slew limits cuts clock tree depth in half, reducing latency and OCV vulnerability.",
      },
      {
        id: "opt_delete_cts_tree",
        label: "Remove clock buffers and drive 48,000 flops directly from the PLL pin",
        correct: false,
        explanation: "A single pin cannot drive 48,000 loads without nanoseconds of slew and signal degradation.",
      },
      {
        id: "opt_slow_clk_freq",
        label: "Reduce target clock frequency by 60%",
        correct: false,
        explanation: "Reducing clock frequency violates product performance specs.",
      },
    ],
  },
  {
    id: 21,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Non-Default Routing (NDR) Shielding Omission on High-Speed Clock Trunks",
    severity: "HIGH",
    stageName: "CTS / Clock Routing Rules",
    symptom: "Clock trunk nets routed with standard 1x width/spacing suffered 65 mV cross-talk coupling glitch noise from adjacent fast data buses.",
    logSnippet: `[VOLTUS-SI] Error: Cross-talk glitch noise = 65 mV on clock trunk net 'clk_core_trunk_m6':
  Aggressors: 'data_bus[31:0]' toggling in adjacent routing tracks on M6.
  Risk: False double-clocking glitch triggering registers!`,
    principle: "Top-level clock trunk nets must be routed using Non-Default Routing (NDR) rules (typically 2x width, 2x spacing) and shielded with VSS ground wires on both sides on upper low-resistance metal layers (M5-M7) to eliminate cross-talk.",
    remedyTcl: `create_route_type -name CLK_NDR_RULE -top_preferred_layer M7 -bottom_preferred_layer M5 \\
                  -width_multiplier 2 -space_multiplier 2 -shield_net VSS
set_db ccopt_route_group_clock_route_type CLK_NDR_RULE
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Clock Cross-Talk Noise", val: "65 mV (Glitch Hazard)", bad: true },
      { label: "Clock Trunk Routing", val: "1x Width / No Shield", bad: true },
      { label: "Double Clocking Risk", val: "CRITICAL", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Cross-Talk Noise", val: "0 mV (VSS Shielded) ✓", bad: false },
      { label: "Clock Trunk Routing", val: "2W2S + VSS Shield ✓", bad: false },
      { label: "Double Clocking Risk", val: "0.0% (Immune) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_ndr_shield",
        label: "Apply 2x width, 2x spacing NDR with dedicated VSS shielding on M5-M7 ('create_route_type -name CLK_NDR_RULE -width_multiplier 2 -space_multiplier 2 -shield_net VSS')",
        correct: true,
        explanation: "Correct! NDR with VSS shielding isolates sensitive clock trunks from switching signal aggressors, eliminating cross-talk glitches.",
      },
      {
        id: "opt_route_clk_m1",
        label: "Route all clock nets on M1 polysilicon layers",
        correct: false,
        explanation: "M1 has high resistance and severe routing congestion.",
      },
      {
        id: "opt_ignore_noise",
        label: "Disable cross-talk noise checking",
        correct: false,
        explanation: "Ignoring noise causes double-clocking failures in silicon.",
      },
    ],
  },
  {
    id: 22,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "CCOpt Intentional Useful Skew Optimization for Setup Timing Recovery",
    severity: "HIGH",
    stageName: "CTS / Useful Skew Scheduling",
    symptom: "A 64-bit cryptography datapath has -320 ps setup violation that cannot be fixed by cell sizing, but the downstream receiving stage has +450 ps positive slack.",
    logSnippet: `[TIMING-PATH] Stage 1 (ALU -> Crypto_Reg): Slack = -320 ps (VIOLATED)
Stage 2 (Crypto_Reg -> Out_Reg): Slack = +450 ps (EXCESS POSITIVE SLACK)
Traditional zero-skew CTS reports -320 ps WNS.`,
    principle: "Traditional CTS aims for zero skew everywhere. Cadence CCOpt uses **Useful Skew**: by intentionally delaying the clock arrival at `Crypto_Reg` by +200 ps, it borrows time from Stage 2 to fix Stage 1, closing timing on both stages.",
    remedyTcl: `set_db ccopt_useful_skew true
set_db ccopt_useful_skew_delay_margin 0.050
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Stage 1 Setup Slack", val: "-320 ps (Failed)", bad: true },
      { label: "Stage 2 Setup Slack", val: "+450 ps (Excess)", bad: false },
      { label: "Chip WNS", val: "-320 ps", bad: true },
    ],
    afterMetrics: [
      { label: "Stage 1 Setup Slack", val: "+45 ps (MET) ✓", bad: false },
      { label: "Stage 2 Setup Slack", val: "+230 ps (MET) ✓", bad: false },
      { label: "Chip WNS", val: "+45 ps (CLOSED) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_useful_skew",
        label: "Enable CCOpt intentional useful skew scheduling ('set_db ccopt_useful_skew true') to borrow slack from downstream stages",
        correct: true,
        explanation: "Correct! CCOpt calculates optimal clock arrival targets per register, converting excess downstream slack into setup margin on critical paths.",
      },
      {
        id: "opt_force_zero_skew_everywhere",
        label: "Force strict 0 ps global skew across every register",
        correct: false,
        explanation: "Strict zero skew prevents borrowing excess slack from non-critical stages.",
      },
      {
        id: "opt_delete_crypto_stage",
        label: "Delete the cryptography pipeline stage",
        correct: false,
        explanation: "Deleting stages destroys required functionality.",
      },
    ],
  },
  {
    id: 23,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Clock Gating Cell (ICG) Enable Slew Degradation & Setup Failure",
    severity: "HIGH",
    stageName: "CTS / ICG Timing Closure",
    symptom: "Integrated Clock Gating (ICG) enable pin `ENA` suffers a -280 ps setup violation because clock arrival at the ICG is earlier than enable data arrival.",
    logSnippet: `[CCOPT-ICG-CHECK] Error: ICG Setup violation on 'u_clk_ctrl/icg_inst/ENA':
  Clock Arrival at ICG/CLK = 120 ps | Enable Arrival = 920 ps.
  Required Setup Time = 60 ps | Slack = -280 ps (FAILED).`,
    principle: "ICG cells require the enable signal to settle before the clock's inactive edge. CCOpt must be configured with clock gating awareness to balance clock arrival at the ICG or pull the enable driver physically closer.",
    remedyTcl: `set_db ccopt_auto_gate_clocks true
set_db ccopt_balance_gated_clocks true
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "ICG Enable Slack", val: "-280 ps (Failed)", bad: true },
      { label: "Clock-to-Enable Phase", val: "MISALIGNED", bad: true },
      { label: "Gated Clock Functional Bug", val: "GLITCH / CORRUPTION", bad: true },
    ],
    afterMetrics: [
      { label: "ICG Enable Slack", val: "+35 ps (MET) ✓", bad: false },
      { label: "Clock-to-Enable Phase", val: "100% PHASE-ALIGNED ✓", bad: false },
      { label: "Gated Clock Functional Bug", val: "0 Bugs ✓", bad: false },
    ],
    options: [
      {
        id: "opt_balance_icg_ccopt",
        label: "Enable clock gating aware CTS with 'set_db ccopt_auto_gate_clocks true' and 'set_db ccopt_balance_gated_clocks true'",
        correct: true,
        explanation: "Correct! CCOpt aligns clock tree insertion delays at ICG cells with enable signal arrival times, resolving ICG setup violations.",
      },
      {
        id: "opt_remove_icg_pnr",
        label: "Remove the ICG and keep clock running continuously",
        correct: false,
        explanation: "Removing ICGs causes massive dynamic power dissipation.",
      },
      {
        id: "opt_inverter_on_enable",
        label: "Add 4 inverters in series on the enable signal",
        correct: false,
        explanation: "Adding delay makes the setup violation worse.",
      },
    ],
  },
  {
    id: 24,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Multi-Clock Domain Skew Balancing (Asynchronous Domains Intermixed)",
    severity: "CRITICAL",
    stageName: "CTS / Skew Group Definition",
    symptom: "CCOpt wasted 4 hours attempting to balance skew between PCIe (250 MHz) and Core (1.2 GHz) clocks, inserting 1,200 redundant buffers.",
    logSnippet: `[CCOPT-SKEW-ERR] Warning: Balancing skew between 'clk_core' and 'clk_pcie' in single default skew group:
  1,200 delay buffers inserted to slow down PCIe clock by 1.4 ns!
  Clock power bloated by +24 mW.`,
    principle: "Clocks from asynchronous or mutually exclusive domains must NEVER be balanced in a single shared skew group. Dedicated skew groups must be declared for each independent clock domain.",
    remedyTcl: `create_clock_tree_spec -out ccopt.spec
# In ccopt.spec: Separate skew groups for independent clocks:
# create_ccopt_skew_group -name SG_CORE -sources get_db ports clk_core -auto_sinks
# create_ccopt_skew_group -name SG_PCIE -sources get_db ports clk_pcie -auto_sinks
source ccopt.spec
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Cross-Domain Delay Buffers", val: "1,200 Redundant Buffers", bad: true },
      { label: "Clock Tree Power Bloat", val: "+24.0 mW", bad: true },
      { label: "CTS Compile Time", val: "4.5 Hours", bad: true },
    ],
    afterMetrics: [
      { label: "Cross-Domain Delay Buffers", val: "0 Buffers (Isolated) ✓", bad: false },
      { label: "Clock Tree Power Bloat", val: "0.0 mW (Optimal) ✓", bad: false },
      { label: "CTS Compile Time", val: "18 Minutes ✓", bad: false },
    ],
    options: [
      {
        id: "opt_separate_skew_groups",
        label: "Create separate dedicated skew groups for Core and PCIe clock domains ('create_ccopt_skew_group -name SG_CORE' / 'SG_PCIE')",
        correct: true,
        explanation: "Correct! Isolating asynchronous clocks into distinct skew groups eliminates false balancing overhead and redundant buffer insertion.",
      },
      {
        id: "opt_merge_clocks_wire",
        label: "Merge Core and PCIe clocks onto a single physical wire",
        correct: false,
        explanation: "Merging distinct physical clocks destroys system communication.",
      },
      {
        id: "opt_disable_cts_pcie",
        label: "Disable clock tree synthesis for PCIe",
        correct: false,
        explanation: "Disabling CTS leaves PCIe flip-flops unclocked.",
      },
    ],
  },
  {
    id: 25,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Clock Tree Inverter Slew Degradation at High-Fanout Leaf Branches",
    severity: "HIGH",
    stageName: "CTS / Slew Optimization",
    symptom: "Clock transition time degraded to 280 ps on 512 leaf flip-flop clock pins, causing severe hold time racing and dynamic power waste.",
    logSnippet: `[CCOPT-SLEW-CHECK] Error: 512 sink pins have clock transition > 250 ps (Limit: 100 ps):
  Underdriven clock inverter 'CLKINV_X1' driving 64 sink loads across 300 um wire.`,
    principle: "Crisp clock transition (slew < 80-100 ps) is mandatory at leaf sinks to prevent clock-edge uncertainty and dynamic short-circuit power. Leaf inverters must be sized properly (X4/X8/X16) with max sink fanout limits (16-32 sinks).",
    remedyTcl: `set_db ccopt_target_max_trans 0.080
set_db ccopt_target_leaf_max_trans 0.090
set_db ccopt_max_fanout 24
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Max Leaf Clock Slew", val: "280 ps (Sluggish)", bad: true },
      { label: "Hold Violations", val: "148 Endpoints", bad: true },
      { label: "Clock Pin Slew Violations", val: "512 Pins", bad: true },
    ],
    afterMetrics: [
      { label: "Max Leaf Clock Slew", val: "78 ps (Sharp) ✓", bad: false },
      { label: "Hold Violations", val: "0 Endpoints ✓", bad: false },
      { label: "Clock Pin Slew Violations", val: "0 Pins ✓", bad: false },
    ],
    options: [
      {
        id: "opt_leaf_slew_target",
        label: "Enforce strict 80 ps leaf slew targets and 24 max fanout limits ('set_db ccopt_target_leaf_max_trans 0.090' and 'set_db ccopt_max_fanout 24')",
        correct: true,
        explanation: "Correct! Sizing leaf drivers and limiting fanout keeps clock slew below 80 ps across all register pins, eliminating hold violations.",
      },
      {
        id: "opt_relax_slew_1ns",
        label: "Increase max slew limit to 1.0 ns",
        correct: false,
        explanation: "1.0 ns clock slew creates severe clock jitter and massive short-circuit power dissipation.",
      },
      {
        id: "opt_remove_leaf_buffers",
        label: "Remove all leaf clock inverters",
        correct: false,
        explanation: "Removing inverters increases capacitive loading and worsens slew.",
      },
    ],
  },
  {
    id: 26,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Clock Mesh vs Tree Hybrid Power Discrepancy on 2.0 GHz CPU Core",
    severity: "MEDIUM",
    stageName: "CTS / High-Speed Clock Architecture",
    symptom: "A full clock mesh architecture consumed 68% of total chip dynamic power (120 mW), exceeding the mobile thermal dissipation limit.",
    logSnippet: `[POWER-REPORT] Clock Network Power: 120.5 mW (68% of Total Chip Power!):
  Full clock mesh grid with 480 cross-straps driving all 64,000 registers.`,
    principle: "While a pure clock mesh provides near-zero skew, its power consumption is immense. A **Multisource CTS (Tree-to-Mesh Hybrid)** drives a sparse regional mesh that feeds local tree clusters, delivering 90% of mesh skew performance at 1/3rd the power.",
    remedyTcl: `create_clock_tree_spec -out ccopt.spec
# Configure Multisource CTS (MSCTS) hybrid:
set_db ccopt_clock_architecture multisource
set_db ccopt_multisource_mesh_density sparse
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Clock Dynamic Power", val: "120.5 mW (68% Total)", bad: true },
      { label: "Global Clock Skew", val: "8 ps (Ultra-Tight)", bad: false },
      { label: "Thermal Budget", val: "EXCEEDED (+45°C)", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Dynamic Power", val: "38.2 mW (-68%) ✓", bad: false },
      { label: "Global Clock Skew", val: "18 ps (Excellent) ✓", bad: false },
      { label: "Thermal Budget", val: "WITHIN SPEC ✓", bad: false },
    ],
    options: [
      {
        id: "opt_multisource_hybrid",
        label: "Convert full mesh to Multisource CTS (MSCTS) hybrid architecture ('set_db ccopt_clock_architecture multisource') to slash clock power by 68%",
        correct: true,
        explanation: "Correct! Multisource hybrid CTS balances the low skew of a mesh with the power efficiency of tree clusters, meeting thermal targets.",
      },
      {
        id: "opt_disable_clock_grid",
        label: "Remove the clock network entirely",
        correct: false,
        explanation: "Without a clock network, synchronous circuits cannot operate.",
      },
      {
        id: "opt_lower_voltage_mesh",
        label: "Lower CPU power supply to 0.3V",
        correct: false,
        explanation: "0.3V is below transistor threshold voltage and causes circuit failure.",
      },
    ],
  },
  {
    id: 27,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Clock Tree Routing Congestion in Narrow Channels Between Hard Macros",
    severity: "HIGH",
    stageName: "CTS / Physical Clock Routing",
    symptom: "CTS routed 12 shielded clock trunks through a 15 µm channel between two SRAMs, causing 140% routing overflow and detailed routing failure.",
    logSnippet: `[CCOPT-ROUTE-CONG] Warning: Clock routing overflow in corridor between SRAM_0 and SRAM_1:
  12 NDR (2W2S) shielded clock nets routed through narrow channel.
  Remaining tracks for data signals = 0 (Total routing blockage!).`,
    principle: "Shielded clock nets (2W2S) occupy 5x the track resources of normal signal wires. CCOpt routing must be guided away from narrow macro corridors using routing guide blockages.",
    remedyTcl: `create_route_blockage -layers { M5 M6 M7 } -box { 1200 800 1350 1200 } -name BLK_CLK_ROUTING
clock_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Corridor Track Utilization", val: "140% (Severe Overflow)", bad: true },
      { label: "Post-CTS DRC Shorts", val: "128 Shorts", bad: true },
      { label: "NanoRoute Status", val: "UNROUTABLE", bad: true },
    ],
    afterMetrics: [
      { label: "Corridor Track Utilization", val: "62% (Clean) ✓", bad: false },
      { label: "Post-CTS DRC Shorts", val: "0 Shorts ✓", bad: false },
      { label: "NanoRoute Status", val: "100% ROUTABLE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_route_block_clk",
        label: "Place a routing blockage for top clock layers over narrow macro corridors ('create_route_blockage -layers {M5 M6 M7}') to force clock trunks around macros",
        correct: true,
        explanation: "Correct! Forcing clock trunks through open core areas prevents channel congestion while leaving corridor tracks open for standard signals.",
      },
      {
        id: "opt_delete_sram_macros",
        label: "Delete the SRAM macros",
        correct: false,
        explanation: "Deleting SRAM macros removes on-chip cache memory.",
      },
      {
        id: "opt_unshield_clock_all",
        label: "Remove all shielding and route clocks on unshielded 1x wires",
        correct: false,
        explanation: "Unshielded clocks suffer severe cross-talk glitches.",
      },
    ],
  },
  {
    id: 28,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "On-Chip Variation (OCV) Common Path Pessimism Removal (CPPR) Failure",
    severity: "HIGH",
    stageName: "STA Signoff / CPPR Credit",
    symptom: "Setup timing report shows a -140 ps violation because static timing analysis did not credit common clock path pessimism on shared clock tree buffers.",
    logSnippet: `[STA-CPPR] Warning: Common Path Pessimism Removal (CPPR) disabled or uncalculated:
  Launch Clock Path Delay: 1.250 ns (Early derate 0.90 = 1.125 ns)
  Capture Clock Path Delay: 1.250 ns (Late derate 1.10 = 1.375 ns)
  Uncredited Shared Clock Buffer Pessimism = 180 ps!`,
    principle: "In OCV analysis, shared clock buffers physically cannot be simultaneously fast (early) and slow (late) in the same clock cycle. Enabling Common Path Pessimism Removal (CPPR / CRPR) eliminates this false pessimism.",
    remedyTcl: `set_db timing_cppr_threshold_ps 1
set_db timing_analysis_type ocv
set_db timing_enable_cppr true
time_design -post_cts -expanded_views`,
    beforeMetrics: [
      { label: "CPPR Pessimism Credit", val: "0 ps (Uncredited)", bad: true },
      { label: "Reported WNS Slack", val: "-140 ps (False Fail)", bad: true },
      { label: "Buffer Insertion Bloat", val: "84 Redundant Buffers", bad: true },
    ],
    afterMetrics: [
      { label: "CPPR Pessimism Credit", val: "+180 ps Credited ✓", bad: false },
      { label: "Reported WNS Slack", val: "+40 ps (MET) ✓", bad: false },
      { label: "Buffer Insertion Bloat", val: "0 Redundant Buffers ✓", bad: false },
    ],
    options: [
      {
        id: "opt_enable_cppr",
        label: "Enable Common Path Pessimism Removal in STA ('set_db timing_enable_cppr true' and 'set_db timing_cppr_threshold_ps 1')",
        correct: true,
        explanation: "Correct! Enabling CPPR credits the impossible early/late delay divergence on shared clock tree branches, recovering 180 ps of real timing margin.",
      },
      {
        id: "opt_disable_ocv",
        label: "Disable OCV timing derates completely",
        correct: false,
        explanation: "Disabling OCV guarantees silicon failure across process/voltage/temperature variations.",
      },
      {
        id: "opt_add_more_delay_buffers",
        label: "Insert 20 delay buffers in the data path",
        correct: false,
        explanation: "Adding data delay worsens setup time violations.",
      },
    ],
  },
  {
    id: 29,
    domainId: "ccopt_cts",
    domainName: "CTS & Useful Skew",
    title: "Post-CTS Hold Time Violations on Short Data Paths (Race Conditions)",
    severity: "HIGH",
    stageName: "CTS / Post-CTS Hold Fixing",
    symptom: "After clock tree synthesis, 420 fast register-to-register paths suffer hold violations (WNS = -340 ps) due to clock skew across distant core regions.",
    logSnippet: `[TIMING-HOLD] Error: 420 Hold violations detected post-CTS:
  Path: 'u_ctrl/reg_a' -> 'u_mem/reg_b' (Data path delay: 45 ps).
  Clock Skew: +385 ps. Slack = -340 ps (VIOLATED - Hold Race Condition!).`,
    principle: "Hold violations occur when data arrives faster than the clock hold time (T_cq + T_comb < T_hold + T_skew). Hold violations MUST be fixed by inserting dedicated delay buffers (`DLY*`) without degrading setup timing.",
    remedyTcl: `set_db opt_hold_effort high
set_db opt_hold_target_slack 0.030
opt_design -post_cts -hold -expanded_views`,
    beforeMetrics: [
      { label: "Hold Violations Count", val: "420 Endpoints (FAIL)", bad: true },
      { label: "Worst Hold Slack (WNS)", val: "-340 ps (Race Condition)", bad: true },
      { label: "Silicon Functionality", val: "FATAL RACE HAZARD", bad: true },
    ],
    afterMetrics: [
      { label: "Hold Violations Count", val: "0 Endpoints ✓", bad: false },
      { label: "Worst Hold Slack (WNS)", val: "+30 ps (MET) ✓", bad: false },
      { label: "Silicon Functionality", val: "100% ROBUST ✓", bad: false },
    ],
    options: [
      {
        id: "opt_post_cts_hold_fix",
        label: "Run automated post-CTS hold optimization ('opt_design -post_cts -hold -expanded_views') with a 30 ps target margin",
        correct: true,
        explanation: "Correct! `opt_design -post_cts -hold` inserts delay buffers on fast paths without degrading setup timing on critical paths.",
      },
      {
        id: "opt_ignore_hold_cts",
        label: "Ignore hold violations and defer to post-silicon testing",
        correct: false,
        explanation: "Hold violations are fatal race conditions that cannot be fixed by lowering clock frequency in silicon.",
      },
      {
        id: "opt_slow_down_clock_chip",
        label: "Slow down the master clock frequency to fix hold",
        correct: false,
        explanation: "Hold timing is independent of clock frequency ($T_{cq} + T_{comb} \ge T_{hold} + T_{skew}$).",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 4: NANOROUTE DETAILED ROUTING & ANTENNA DRC (10 Scenarios)
  // =========================================================================
  {
    id: 30,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Process Antenna Effect Ratio Violation (Thin Gate Oxide Breakdown)",
    severity: "CRITICAL",
    stageName: "Routing / Antenna DRC Check",
    symptom: "During plasma etching of long metal 4 wires, accumulated static charge exceeded the antenna ratio limit (400:1), risking gate dielectric punchthrough.",
    logSnippet: `[ANTENNA-DRC-01] Error: Antenna ratio violation on net 'sensor_data_bus[12]':
  Metal Area = 1840 um² | Connected Gate Oxide Area = 1.2 um²
  Calculated Antenna Ratio: 1,533:1 (Foundry Maximum Limit: 400:1).
  Risk: Gate oxide breakdown and permanent gate leakage failure!`,
    principle: "The Process Antenna Effect occurs when long metal interconnects act as antennas during plasma etching, collecting electrostatic charge that discharges through thin gate dielectric oxides. Fixing methods include inserting reverse-biased Antenna Diodes near the gate or jumper layer-hopping to top metal layers.",
    remedyTcl: `set_db route_antenna_cell_name ANTENNA_X1
set_db route_antenna_effort high
set_db route_antenna_fix_with_diodes true
set_db route_antenna_fix_with_jogging true
route_opt_design`,
    beforeMetrics: [
      { label: "Antenna Ratio", val: "1,533:1 (CRITICAL FAIL)", bad: true },
      { label: "Gate Oxide Punchthrough", val: "HIGH RISK", bad: true },
      { label: "Antenna Violations", val: "184 Nets", bad: true },
    ],
    afterMetrics: [
      { label: "Antenna Ratio", val: "220:1 (Compliant) ✓", bad: false },
      { label: "Gate Oxide Punchthrough", val: "0.0% (Protected) ✓", bad: false },
      { label: "Antenna Violations", val: "0 Nets ✓", bad: false },
    ],
    options: [
      {
        id: "opt_antenna_diode_fix",
        label: "Enable automated antenna diode insertion and metal layer jogging ('set_db route_antenna_fix_with_diodes true' and 'route_opt_design')",
        correct: true,
        explanation: "Correct! Inserting antenna diodes clamps plasma charges to the substrate, and metal jogging breaks long antennas into short segments, keeping ratios below 400:1.",
      },
      {
        id: "opt_ignore_antenna",
        label: "Ignore antenna rules because they only apply during wafer fabrication",
        correct: false,
        explanation: "Ignoring antenna violations leads to dead silicon chips with ruptured gate oxides upon wafer fabrication.",
      },
      {
        id: "opt_remove_sensor_bus",
        label: "Delete the sensor data bus",
        correct: false,
        explanation: "Deleting functional buses destroys sensor communication.",
      },
    ],
  },
  {
    id: 31,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Detailed Routing Pin Access Shorts on Dense FinFET Standard Cells",
    severity: "HIGH",
    stageName: "Routing / NanoRoute Legalization",
    symptom: "NanoRoute generated 120 M1/M2 DRC shorts trying to access closely spaced pin contacts on complex multi-input logic cells.",
    logSnippet: `[NANOROUTE-DRC-02] Error: 120 design rule shorts on M1/M2 layer:
  Cut-to-cut via spacing violation between VIA1 and VIA1_adjacent (Spacing: 22 nm, Limit: 36 nm).
  Pin access exhausted on cell 'AOI222X4'.`,
    principle: "In advanced FinFET technology nodes (e.g. ASAP7 / 16nm / 7nm), M1/M2 metal track pitches are extremely tight. NanoRoute must use pin-access aware search & repair iterations and apply asymmetric via enclosure rules.",
    remedyTcl: `set_db route_design_detail_post_route_spread_wire true
set_db route_design_detail_post_route_swap_via true
set_db route_design_detail_use_multi_cut_via true
route_opt_design`,
    beforeMetrics: [
      { label: "M1/M2 Pin Access Shorts", val: "120 Shorts", bad: true },
      { label: "Via Spacing Violations", val: "85 DRC Errors", bad: true },
      { label: "Routing Convergence", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "M1/M2 Pin Access Shorts", val: "0 Shorts ✓", bad: false },
      { label: "Via Spacing Violations", val: "0 DRC Errors ✓", bad: false },
      { label: "Routing Convergence", val: "100% CLEAN ✓", bad: false },
    ],
    options: [
      {
        id: "opt_pin_access_nanoroute",
        label: "Enable post-route wire spreading, via swapping, and multi-cut via optimization in NanoRoute ('set_db route_design_detail_post_route_swap_via true')",
        correct: true,
        explanation: "Correct! Wire spreading and smart via swapping resolve cut spacing conflicts while maintaining 100% pin connectivity.",
      },
      {
        id: "opt_delete_via_rules",
        label: "Delete minimum via spacing rules from the tech LEF",
        correct: false,
        explanation: "Deleting foundry design rules leads to physical short circuits on silicon wafers.",
      },
      {
        id: "opt_route_manually_120",
        label: "Manually re-route all 120 shorts with polygons in GDSII editor",
        correct: false,
        explanation: "Manual polygon drawing violates connectivity and creates timing and LVS mismatches.",
      },
    ],
  },
  {
    id: 32,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Minimum Area & End-of-Line (EOL) Spacing DRC Rule Violations",
    severity: "MEDIUM",
    stageName: "Routing / DRC Signoff",
    symptom: "Routing optimizer left short metal stubs with patch area = 0.012 µm², violating the foundry Minimum Metal Area rule (0.024 µm²).",
    logSnippet: `[PEGASUS-DRC] Error: Minimum metal area rule violation on M2 layer:
  Polygon area = 0.012 um² (Foundry Minimum Limit: 0.024 um²).
  End-of-line (EOL) enclosure margin = 12 nm (Required: 24 nm).`,
    principle: "Photolithographic limits require metal islands to meet minimum surface area and end-of-line enclosure to prevent pattern lifting during chemical-mechanical polishing (CMP). Detailed routers must patch stubs to meet minimum area.",
    remedyTcl: `set_db route_design_detail_fix_min_area true
set_db route_design_detail_post_route_clean_patch true
route_opt_design -fix_drc`,
    beforeMetrics: [
      { label: "Min Area Violations", val: "420 Polygons", bad: true },
      { label: "EOL Spacing Errors", val: "180 Errors", bad: true },
      { label: "DRC Signoff", val: "REJECTED", bad: true },
    ],
    afterMetrics: [
      { label: "Min Area Violations", val: "0 Polygons ✓", bad: false },
      { label: "EOL Spacing Errors", val: "0 Errors ✓", bad: false },
      { label: "DRC Signoff", val: "100% PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fix_min_area",
        label: "Enable automatic minimum metal area patching in NanoRoute ('set_db route_design_detail_fix_min_area true')",
        correct: true,
        explanation: "Correct! The router automatically extends short metal stubs with legal patch geometries to satisfy minimum area and EOL rules.",
      },
      {
        id: "opt_cut_stub",
        label: "Cut the metal stub and leave an open circuit",
        correct: false,
        explanation: "Cutting the stub breaks the net connection and causes LVS open-circuit failure.",
      },
      {
        id: "opt_ignore_eol",
        label: "Ignore EOL DRC errors",
        correct: false,
        explanation: "EOL errors result in metal peeling and open circuits during etching.",
      },
    ],
  },
  {
    id: 33,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Double-Patterning (LELE / SADP) Color Conflict on M1 Pitch",
    severity: "HIGH",
    stageName: "Routing / Multi-Patterning DRC",
    symptom: "M1 routing lines placed with odd-loop parity created 64 uncolorable mask decomposition conflicts in 7nm double-patterning.",
    logSnippet: `[COLOR-DRC-04] Error: 64 Odd-loop color conflicts on Mask 1 (M1):
  Odd cycle loop of adjacent wires cannot be assigned to Mask_A and Mask_B without violating spacing.`,
    principle: "At sub-10nm nodes using 193nm immersion lithography, pitches below 80 nm require multi-patterning (Litho-Etch-Litho-Etch / SADP). Odd-cycle loops between adjacent tracks cannot be colored with two masks and must be broken by track jogging or layer hopping.",
    remedyTcl: `set_db route_design_detail_multi_patterning true
set_db route_design_detail_color_conflict_resolution true
route_opt_design`,
    beforeMetrics: [
      { label: "Odd-Loop Color Conflicts", val: "64 Loops (DRC FAIL)", bad: true },
      { label: "Mask Decomposability", val: "UNCOLORABLE", bad: true },
      { label: "Tapeout Mask Generation", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Odd-Loop Color Conflicts", val: "0 Loops ✓", bad: false },
      { label: "Mask Decomposability", val: "100% COLORABLE ✓", bad: false },
      { label: "Tapeout Mask Generation", val: "APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_multi_patterning_route",
        label: "Enable multi-patterning color-aware routing and conflict resolution ('set_db route_design_detail_multi_patterning true')",
        correct: true,
        explanation: "Correct! The multi-patterning router decomposes nets onto alternating Mask A/Mask B tracks and breaks odd loops via layer jumpers.",
      },
      {
        id: "opt_single_mask_all",
        label: "Force the foundry to manufacture 7nm M1 with a single mask exposure",
        correct: false,
        explanation: "Optical diffraction limits prevent single-mask printing below 80 nm pitch with 193nm light.",
      },
      {
        id: "opt_disable_m1_layer",
        label: "Disable metal layer M1 entirely",
        correct: false,
        explanation: "M1 is required for standard cell internal pin connections.",
      },
    ],
  },
  {
    id: 34,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Via Enclosure & Fat Wire Spacing DRC Violations on Power Straps",
    severity: "MEDIUM",
    stageName: "Routing / Power Routing DRC",
    symptom: "Thick 4 µm top metal power stripes intersecting signal wires violated the wide-wire spacing rule (fat-wire spacing penalty).",
    logSnippet: `[DRC-FATWIRE-01] Error: Wide-metal spacing rule violation on M6:
  Wire width = 4.0 um requires 0.80 um spacing (Actual spacing to signal net: 0.35 um).
  140 Fat-Wire DRC spacing violations detected!`,
    principle: "Wires wider than a technology threshold (e.g. > 1.0 µm) require wider spacing to neighboring wires due to optical proximity effects and chemical-mechanical dishing. Signal routers must respect width-dependent spacing tables (PRL - Parallel Run Length).",
    remedyTcl: `set_db route_design_detail_post_route_spread_wire true
set_db route_design_respect_fat_wire_spacing true
route_opt_design`,
    beforeMetrics: [
      { label: "Fat-Wire DRC Violations", val: "140 Violations", bad: true },
      { label: "Signal-to-Stripe Spacing", val: "0.35 µm (Too Close)", bad: true },
      { label: "DRC Signoff", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Fat-Wire DRC Violations", val: "0 Violations ✓", bad: false },
      { label: "Signal-to-Stripe Spacing", val: "0.85 µm (Compliant) ✓", bad: false },
      { label: "DRC Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fat_wire_spacing",
        label: "Enforce width-dependent fat-wire spacing and enable post-route wire spreading ('set_db route_design_respect_fat_wire_spacing true')",
        correct: true,
        explanation: "Correct! NanoRoute pushes adjacent signal wires to 0.85 µm away from wide power stripes, satisfying parallel run length DRC rules.",
      },
      {
        id: "opt_shrink_power_stripe",
        label: "Make power stripes 0.05 µm thin",
        correct: false,
        explanation: "Thin power stripes cause severe IR drop and electromigration failures.",
      },
      {
        id: "opt_delete_fat_wire_rule",
        label: "Delete fat-wire rules from the foundry technology file",
        correct: false,
        explanation: "Deleting rules leads to physical short circuits on the wafer.",
      },
    ],
  },
  {
    id: 35,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Open Circuit Nets Caused by Unrouted Clock Net Escapes",
    severity: "CRITICAL",
    stageName: "Routing / Connectivity Check",
    symptom: "Detailed router aborted on 18 clock leaf nets due to routing blockages, leaving 18 registers unclocked and creating open circuits.",
    logSnippet: `[NANOROUTE-UNROUTED] Error: 18 unrouted net connections detected after detailed routing:
  Net 'u_core/clk_branch_04' has 18 unrouted sinks.
  LVS Signoff: 18 Open Circuit Violations!`,
    principle: "All signal and clock nets must achieve 100% routing completion. Unrouted nets indicate routing track exhaustion, blockage overlaps, or inaccessible pin locations requiring local search & repair.",
    remedyTcl: `set_db route_design_detail_max_iterations 40
set_db route_design_detail_auto_repair true
route_opt_design -fix_drc
check_connectivity -type regular`,
    beforeMetrics: [
      { label: "Unrouted Net Connections", val: "18 Open Nets (CRITICAL)", bad: true },
      { label: "LVS Open Circuits", val: "18 Opens", bad: true },
      { label: "Tapeout Readiness", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "Unrouted Net Connections", val: "0 Open Nets (100% Routed) ✓", bad: false },
      { label: "LVS Open Circuits", val: "0 Opens ✓", bad: false },
      { label: "Tapeout Readiness", val: "APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_nanoroute_auto_repair",
        label: "Increase NanoRoute search & repair iterations to 40 with auto-repair ('set_db route_design_detail_max_iterations 40') and verify connectivity",
        correct: true,
        explanation: "Correct! Higher search & repair iterations allow the maze router to rip up non-critical wires and complete all 18 unrouted clock connections.",
      },
      {
        id: "opt_ignore_unrouted",
        label: "Proceed to mask generation with unrouted clock nets",
        correct: false,
        explanation: "Unrouted clock nets leave registers permanently unclocked, resulting in non-functional silicon.",
      },
      {
        id: "opt_remove_open_flops",
        label: "Delete the 18 registers",
        correct: false,
        explanation: "Deleting registers breaks chip architecture.",
      },
    ],
  },
  {
    id: 36,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Redundant Via Doubling Failure Causing Manufacturing Yield Loss",
    severity: "HIGH",
    stageName: "DFM / Via Doubling Optimization",
    symptom: "Post-route netlist has only 54% double-via insertion rate; single vias in harsh vias-in-line arrays risk random particle defect opens.",
    logSnippet: `[DFM-VIA-DOUBLING] Warning: Single-cut via ratio = 46% (Target Limit: < 15%):
  Critical signal paths rely on single-cut vias vulnerable to particle failure during fabrication.`,
    principle: "Random particle contamination during fabrication is a primary cause of via opens. Replacing single-cut vias with redundant double-cut vias (via doubling) increases silicon manufacturing yield by 30-40%.",
    remedyTcl: `set_db route_design_detail_use_multi_cut_via true
set_db route_design_detail_post_route_swap_via true
set_db route_design_detail_multi_cut_via_effort high
route_opt_design`,
    beforeMetrics: [
      { label: "Double Via Insertion Rate", val: "54.2% (Low Yield)", bad: true },
      { label: "Single-Cut Via Count", val: "184,000 Vias", bad: true },
      { label: "Wafer DFM Yield Score", val: "78% (Sub-Optimal)", bad: true },
    ],
    afterMetrics: [
      { label: "Double Via Insertion Rate", val: "92.4% (DFM Compliant) ✓", bad: false },
      { label: "Single-Cut Via Count", val: "24,000 Vias ✓", bad: false },
      { label: "Wafer DFM Yield Score", val: "98.5% (High Yield) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_multi_cut_via_high",
        label: "Enable high-effort post-route redundant via insertion ('set_db route_design_detail_multi_cut_via_effort high') to reach >90% double-via rate",
        correct: true,
        explanation: "Correct! Automated via doubling replaces vulnerable single-cut vias with multi-cut via arrays, protecting against particle open defects.",
      },
      {
        id: "opt_ban_all_vias",
        label: "Ban all vias and route entire chip on metal 1 only",
        correct: false,
        explanation: "Routing a full SoC on M1 alone is physically impossible.",
      },
      {
        id: "opt_ignore_via_dfm",
        label: "Accept 54% via doubling and ignore foundry DFM guidelines",
        correct: false,
        explanation: "Low via doubling results in severe yield loss and higher per-chip manufacturing cost.",
      },
    ],
  },
  {
    id: 37,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Cut Spacing Violations Between Orthogonal Via Enclosures",
    severity: "MEDIUM",
    stageName: "Routing / Via DRC Check",
    symptom: "NanoRoute generated 45 via cut-to-cut spacing errors between adjacent M2-to-M3 layer transitions in a congested bus corner.",
    logSnippet: `[DRC-VIA-CUT] Error: 45 cut spacing violations between VIA2 instances:
  Center-to-center cut distance = 32 nm (Foundry Minimum Limit: 48 nm).`,
    principle: "Via cuts require strict physical separation to prevent dielectric breakdown and lithographic bridging between adjacent vias. The router must re-distribute via locations along the wire track.",
    remedyTcl: `set_db route_design_detail_post_route_swap_via true
set_db route_design_detail_post_route_spread_wire true
route_opt_design -fix_drc`,
    beforeMetrics: [
      { label: "Via Cut Spacing Violations", val: "45 DRC Errors", bad: true },
      { label: "Min Cut Distance", val: "32 nm (Violated)", bad: true },
      { label: "DRC Signoff", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Via Cut Spacing Violations", val: "0 DRC Errors ✓", bad: false },
      { label: "Min Cut Distance", val: "52 nm (Compliant) ✓", bad: false },
      { label: "DRC Signoff", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_via_swap_cut",
        label: "Run post-route via swapping and wire spreading ('set_db route_design_detail_post_route_swap_via true') to legalize via cut distances",
        correct: true,
        explanation: "Correct! Via swapping shifts via positions along the wire run, guaranteeing the required 48 nm cut separation.",
      },
      {
        id: "opt_delete_all_via2",
        label: "Delete all VIA2 instances from the database",
        correct: false,
        explanation: "Deleting VIA2 disconnects M2 from M3 across the chip.",
      },
      {
        id: "opt_merge_adjacent_vias",
        label: "Merge the adjacent vias into a single giant short circuit",
        correct: false,
        explanation: "Merging vias shorts separate electrical signals together.",
      },
    ],
  },
  {
    id: 38,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Shielding Net Disconnection on Sensitive Differential Analog Clock Wires",
    severity: "HIGH",
    stageName: "Routing / Shielding Verification",
    symptom: "A 2.5 GHz differential clock pair lost its VSS ground shielding for a 120 µm stretch due to an intersecting power stripe blockage.",
    logSnippet: `[SHIELD-CHECK] Warning: Shielding discontinuity on net 'clk_diff_p' between (X: 840, Y: 1200) and (X: 960, Y: 1200):
  VSS shield wire interrupted by M6 power stripe!
  Crosstalk noise coupling from adjacent bus = 48 mV.`,
    principle: "High-speed differential clocks require continuous 100% parallel ground shielding (coaxial-like VSS isolation). When crossing perpendicular power stripes, shielding must jog or transition layers seamlessly without interruption.",
    remedyTcl: `create_route_type -name DIFF_CLK_SHIELD -shield_net VSS -shield_side both -width_multiplier 2 -space_multiplier 2
set_db [get_db nets { clk_diff_p clk_diff_n }] .route_type DIFF_CLK_SHIELD
route_opt_design`,
    beforeMetrics: [
      { label: "Shielding Continuity", val: "82% (120 µm Gap)", bad: true },
      { label: "Cross-Talk Phase Jitter", val: "48 mV / ±35 ps", bad: true },
      { label: "Differential Eye Height", val: "DEGRADED", bad: true },
    ],
    afterMetrics: [
      { label: "Shielding Continuity", val: "100% CONTINUOUS ✓", bad: false },
      { label: "Cross-Talk Phase Jitter", val: "0 mV / 0 ps ✓", bad: false },
      { label: "Differential Eye Height", val: "CLEAN OPEN EYE ✓", bad: false },
    ],
    options: [
      {
        id: "opt_diff_shield_cont",
        label: "Re-route differential clock pair with strict 100% two-sided VSS shielding ('create_route_type -shield_side both -shield_net VSS')",
        correct: true,
        explanation: "Correct! Enforcing dedicated continuous shielding ensures the VSS ground wire jogs smoothly across power obstacles without leaving gaps.",
      },
      {
        id: "opt_remove_diff_clocks",
        label: "Delete the differential clock pair",
        correct: false,
        explanation: "Deleting differential clocks disables chip high-speed communication.",
      },
      {
        id: "opt_unshield_completely",
        label: "Remove shielding completely",
        correct: false,
        explanation: "Removing shielding increases noise and destroys signal integrity.",
      },
    ],
  },
  {
    id: 39,
    domainId: "nanoroute_drc",
    domainName: "Routing & Antenna",
    title: "Non-Preferred Metal Layer Routing Causing Routing Congestion Explosion",
    severity: "MEDIUM",
    stageName: "Routing / Layer Direction DRC",
    symptom: "NanoRoute routed 800 horizontal wires on vertically-oriented M3 layer, blocking 4,200 vertical routing tracks.",
    logSnippet: `[NANOROUTE-DIR-ERR] Warning: 800 non-preferred direction routing jogs on M3:
  M3 preferred direction is VERTICAL. Router placed 800 HORIZONTAL jogs > 50 um.
  Vertical track capacity reduced by 64%!`,
    principle: "Metal routing layers follow strict orthogonal preferred directions (e.g. M1:H, M2:V, M3:H, M4:V...). Non-preferred routing should be strictly penalized to prevent track blockages.",
    remedyTcl: `set_db route_design_detail_non_preferred_layer_cost 10.0
set_db route_design_detail_strict_preferred_direction true
route_opt_design`,
    beforeMetrics: [
      { label: "Non-Preferred Routing Jogs", val: "800 Jogs (M3 Blockage)", bad: true },
      { label: "Vertical Track Capacity", val: "-64% Lost Capacity", bad: true },
      { label: "Routing Congestion Score", val: "128% (Overflow)", bad: true },
    ],
    afterMetrics: [
      { label: "Non-Preferred Routing Jogs", val: "4 Jogs (Strict Orthogonal) ✓", bad: false },
      { label: "Vertical Track Capacity", val: "100% Available ✓", bad: false },
      { label: "Routing Congestion Score", val: "52% (Clean) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_strict_pref_dir",
        label: "Enforce strict preferred routing directions and increase non-preferred layer cost ('set_db route_design_detail_non_preferred_layer_cost 10.0')",
        correct: true,
        explanation: "Correct! Penalizing non-preferred jogs forces the router to maintain clean orthogonal tracks (horizontal on M2/M4, vertical on M3/M5), restoring full routing capacity.",
      },
      {
        id: "opt_disable_m3_direction",
        label: "Allow all layers to route in random diagonal directions",
        correct: false,
        explanation: "Diagonal routing is forbidden in standard grid-based semiconductor fabrication.",
      },
      {
        id: "opt_delete_vertical_tracks",
        label: "Delete vertical tracks from the LEF file",
        correct: false,
        explanation: "Deleting vertical tracks makes the design completely unroutable.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 5: SIGNAL INTEGRITY, CROSS-TALK & GLITCH NOISE (10 Scenarios)
  // =========================================================================
  {
    id: 40,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Miller Coupling Capacitance Crosstalk Delta Delay (Setup Violation)",
    severity: "CRITICAL",
    stageName: "STA SI Signoff / Tempus SI",
    symptom: "Static timing analysis without SI passed with +15 ps slack, but Tempus SI signoff failed at -340 ps due to opposite-direction switching aggressors.",
    logSnippet: `[TEMPUS-SI] Error: Setup violation with Signal Integrity cross-talk delta delay:
  Victim Net 'data_bus[14]' delay increased from 420 ps to 780 ps (+360 ps Delta Delay!).
  Aggressors: 'bus_ctrl_0', 'bus_ctrl_1' switching in opposite direction on adjacent tracks (Miller Factor = 2.0).
  Slack = -340 ps (FAILED).`,
    principle: "When a victim net and neighboring aggressor nets switch in opposite directions simultaneously, the effective coupling capacitance doubles (Miller Effect: C_eff = 2 * C_c), drastically increasing wire delay. Fixing methods include driver upsizing, wire spacing, and buffer insertion.",
    remedyTcl: `set_db si_delay_analysis_mode extreme
set_db si_glitch_analysis_mode extreme
opt_design -post_route -si -expanded_views`,
    beforeMetrics: [
      { label: "Crosstalk Delta Delay", val: "+360 ps (Miller 2.0)", bad: true },
      { label: "Tempus SI Slack", val: "-340 ps (FAILED)", bad: true },
      { label: "Timing Signoff", val: "REJECTED", bad: true },
    ],
    afterMetrics: [
      { label: "Crosstalk Delta Delay", val: "+25 ps (Buffered) ✓", bad: false },
      { label: "Tempus SI Slack", val: "+35 ps (MET) ✓", bad: false },
      { label: "Timing Signoff", val: "PASSED 100% ✓", bad: false },
    ],
    options: [
      {
        id: "opt_opt_design_si",
        label: "Execute post-route Signal Integrity timing optimization with driver resizing and buffer insertion ('opt_design -post_route -si -expanded_views')",
        correct: true,
        explanation: "Correct! `opt_design -post_route -si` upsizes victim drivers to lower output impedance and inserts repeaters to reduce coupling length, eliminating delta delay.",
      },
      {
        id: "opt_disable_si_mode",
        label: "Turn off Signal Integrity analysis in Tempus to hide the violation",
        correct: false,
        explanation: "Disabling SI in Tempus causes chips to fail timing and crash on silicon test benches.",
      },
      {
        id: "opt_slow_core_clk_si",
        label: "Slow down the master clock frequency by 50%",
        correct: false,
        explanation: "Slowing down clock frequency reduces processor throughput.",
      },
    ],
  },
  {
    id: 41,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Crosstalk Glitch Noise Peak Exceeding Receiver Noise Margin",
    severity: "CRITICAL",
    stageName: "STA SI / Glitch Analysis",
    symptom: "A quiescent low net (`1'b0`) experienced a 380 mV crosstalk glitch spike when 8 adjacent bus wires switched simultaneously, causing a false clock reset!",
    logSnippet: `[TEMPUS-GLITCH-01] Critical: Cross-talk glitch noise peak = 380 mV (Limit: 140 mV):
  Victim Net: 'core_rst_async_n' (Static Low state).
  Glitch width = 240 ps | Peak Height = 38% of VDD (Exceeds receiver logic threshold!).
  Result: Spurious chip reset triggered!`,
    principle: "A quiet net coupled to multiple simultaneously switching aggressors suffers voltage glitch spikes (V_glitch = VDD * C_c / (C_c + C_gnd + R_driver_conductance)). If glitch amplitude exceeds receiver noise margin, false logic transitions occur. Reset and clock nets must be heavily shielded or spaced.",
    remedyTcl: `set_db [get_db nets core_rst_async_n] .route_type CLK_NDR_SHIELD
set_db [get_db insts -of [get_db nets core_rst_async_n .driver]] .lib_cell [get_db lib_cells *BUFX16*]
route_design -net core_rst_async_n -reroute
time_design -post_route -si`,
    beforeMetrics: [
      { label: "Glitch Peak Height", val: "380 mV (38% VDD - SPURIOUS RESET)", bad: true },
      { label: "Receiver Noise Margin", val: "EXCEEDED", bad: true },
      { label: "Silicon Reliability", val: "FATAL GLITCH CRASH", bad: true },
    ],
    afterMetrics: [
      { label: "Glitch Peak Height", val: "24 mV (Safe Margin) ✓", bad: false },
      { label: "Receiver Noise Margin", val: "100% COMPLIANT ✓", bad: false },
      { label: "Silicon Reliability", val: "ROCK-SOLID SIGN-OFF ✓", bad: false },
    ],
    options: [
      {
        id: "opt_shield_reset_net",
        label: "Upsize the reset driver to BUFX16 (low impedance) and apply VSS ground shielding to isolate the net from bus aggressors",
        correct: true,
        explanation: "Correct! Lowering driver resistance and shielding the reset line with VSS suppresses glitch height to 24 mV, well below the receiver threshold.",
      },
      {
        id: "opt_disconnect_reset",
        label: "Disconnect the reset pin from all registers",
        correct: false,
        explanation: "Disconnecting reset prevents chip power-on initialization.",
      },
      {
        id: "opt_ignore_glitch",
        label: "Ignore glitch warnings in signoff",
        correct: false,
        explanation: "Ignoring glitches leads to random spontaneous system resets in the field.",
      },
    ],
  },
  {
    id: 42,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Dynamic IR Drop Jitter on Clock Tree Buffers",
    severity: "HIGH",
    stageName: "Voltus Dynamic Power / Voltage Drop",
    symptom: "Simultaneous switching of 48 arithmetic units caused a 110 mV localized supply sag, adding +180 ps clock jitter and failing setup time.",
    logSnippet: `[VOLTUS-DYNAMIC-IR] Error: Localized VDD sag = 110 mV (10% drop) in ALU cluster:
  Clock buffer 'u_clk/buf_inst_84' supply voltage dropped to 0.99 V (Nominal: 1.10 V).
  Clock propagation delay increased by +180 ps. Setup WNS = -160 ps.`,
    principle: "Dynamic IR drop (L*di/dt + R*i(t)) peaks during intense simultaneous logic switching. Clock buffers placed in high-activity switching zones suffer dynamic supply drop, slowing down clock arrival and creating large clock skew.",
    remedyTcl: `add_decap -cells { DECAP_X32 } -target_density 15.0 -box { 1200 1200 1800 1800 }
# Relocate critical clock buffers to quiet always-on power regions:
set_db [get_db insts u_clk/buf_inst_84] .location { 1100 1100 }
opt_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Localized Dynamic IR Drop", val: "110 mV (10% Sag)", bad: true },
      { label: "Clock Buffer Jitter", val: "+180 ps Delay", bad: true },
      { label: "Setup WNS Slack", val: "-160 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Localized Dynamic IR Drop", val: "28 mV (2.5% Safe) ✓", bad: false },
      { label: "Clock Buffer Jitter", val: "+12 ps Delay ✓", bad: false },
      { label: "Setup WNS Slack", val: "+45 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_decap_and_relocate",
        label: "Insert 15% Decap standard cells in the switching cluster and relocate clock buffers outside the high-activity power cavity",
        correct: true,
        explanation: "Correct! Decap cells provide instantaneous charge reservoirs during switching, reducing dynamic IR drop to 28 mV and stabilizing clock arrival.",
      },
      {
        id: "opt_remove_power_mesh",
        label: "Remove the power mesh",
        correct: false,
        explanation: "Removing the power mesh destroys power delivery.",
      },
      {
        id: "opt_disable_alu_cluster",
        label: "Disable the ALU cluster",
        correct: false,
        explanation: "Disabling ALUs eliminates processor computing functionality.",
      },
    ],
  },
  {
    id: 43,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Hold Time Race Caused by Same-Direction Switching Crosstalk Speedup",
    severity: "HIGH",
    stageName: "STA SI / Hold Signoff",
    symptom: "Fast data path with +20 ps hold slack in pure STA suffered -120 ps hold violation in Tempus SI because in-phase switching aggressors accelerated data arrival!",
    logSnippet: `[TEMPUS-SI-HOLD] Error: Hold violation with in-phase crosstalk speedup:
  Victim Net: 'fast_data_wire' delay decreased from 65 ps to 28 ps (-37 ps Speedup Delta!).
  Aggressors: 4 parallel wires switching in SAME direction (Miller Factor = 0.0).
  Hold Slack = -120 ps (VIOLATED - Fast Data Race Condition!).`,
    principle: "When a victim net and neighboring aggressors switch in the same direction at the exact same instant, the coupling capacitance requires zero charge transfer (Miller Factor = 0.0), reducing effective capacitance and making the net switch faster than standard STA predicts. This creates hold violations.",
    remedyTcl: `set_db opt_hold_effort high
set_db opt_hold_target_slack 0.040
opt_design -post_route -hold -si -expanded_views`,
    beforeMetrics: [
      { label: "Crosstalk Hold Speedup", val: "-37 ps Speedup", bad: true },
      { label: "Tempus SI Hold Slack", val: "-120 ps (FAIL)", bad: true },
      { label: "Race Condition Hazard", val: "FATAL FAILURE", bad: true },
    ],
    afterMetrics: [
      { label: "Crosstalk Hold Speedup", val: "0 ps (Buffered) ✓", bad: false },
      { label: "Tempus SI Hold Slack", val: "+42 ps (MET) ✓", bad: false },
      { label: "Race Condition Hazard", val: "100% CLEAN ✓", bad: false },
    ],
    options: [
      {
        id: "opt_hold_si_fix",
        label: "Execute SI-aware post-route hold optimization ('opt_design -post_route -hold -si -expanded_views') to insert delay buffers on fast paths",
        correct: true,
        explanation: "Correct! SI-aware hold optimization accounts for worst-case in-phase speedup and inserts delay buffers to guarantee hold closure.",
      },
      {
        id: "opt_ignore_hold_si",
        label: "Ignore SI hold violations because fast nets are good for performance",
        correct: false,
        explanation: "Hold violations destroy functional correctness regardless of performance.",
      },
      {
        id: "opt_slow_clock_chip_si",
        label: "Slow down the external clock",
        correct: false,
        explanation: "Hold violations are independent of clock frequency and cannot be fixed by slowing down the clock.",
      },
    ],
  },
  {
    id: 44,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "High Output Impedance Driver Slew Degradation on Long Interconnects",
    severity: "HIGH",
    stageName: "Routing / Driver Sizing",
    symptom: "A minimum-drive buffer (BUFX1) driving a 1.8 mm wire has a transition time of 1.2 ns, making it an extreme victim for cross-talk noise.",
    logSnippet: `[SI-VICTIM-AUDIT] Warning: High-impedance victim driver detected:
  Cell 'u_bus/driver_inst' (BUFX1, Output Resistance R_on = 450 ohms).
  Wire length = 1.8 mm (Coupling Cap: 140 fF). Slew = 1.25 ns.
  Cross-talk noise peak = 420 mV!`,
    principle: "A weak driver with high output resistance (R_on) cannot hold its output voltage firmly against coupled currents from switching neighbors. Upsizing the driver to a higher drive strength (BUFX8/BUFX16) lowers output impedance, suppressing crosstalk noise.",
    remedyTcl: `set_db [get_db insts u_bus/driver_inst] .lib_cell [get_db lib_cells *BUFX12*]
set_db route_design_detail_post_route_spread_wire true
opt_design -post_route -si`,
    beforeMetrics: [
      { label: "Driver Output Resistance R_on", val: "450 Ω (High Impedance)", bad: true },
      { label: "Signal Transition Slew", val: "1.25 ns (Sluggish)", bad: true },
      { label: "Cross-Talk Noise Peak", val: "420 mV (Severe)", bad: true },
    ],
    afterMetrics: [
      { label: "Driver Output Resistance R_on", val: "42 Ω (Low Impedance) ✓", bad: false },
      { label: "Signal Transition Slew", val: "0.14 ns (Sharp) ✓", bad: false },
      { label: "Cross-Talk Noise Peak", val: "38 mV (Suppressed) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_upsize_driver_si",
        label: "Upsize driver from BUFX1 to BUFX12 to lower driver output impedance and sharpen transition slew to 140 ps",
        correct: true,
        explanation: "Correct! Lowering driver resistance provides a strong low-impedance path to ground/VDD, quenching cross-talk noise spikes.",
      },
      {
        id: "opt_downsize_to_x0",
        label: "Downsize driver to X0 to save cell area",
        correct: false,
        explanation: "Downsizing increases driver resistance and worsens crosstalk noise drastically.",
      },
      {
        id: "opt_cut_wire",
        label: "Cut the 1.8 mm wire",
        correct: false,
        explanation: "Cutting the wire breaks functional connectivity.",
      },
    ],
  },
  {
    id: 45,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Layer Promotion (M2 to M5) to Reduce Interconnect RC Delay on Critical Bus",
    severity: "MEDIUM",
    stageName: "Routing / Layer Optimization",
    symptom: "A 32-bit control bus routed on thin lower metal M2 has high wire resistance (0.85 Ω/µm), causing 480 ps RC delay and missing setup.",
    logSnippet: `[WIRE-RC-REPORT] Net 'fsm_ctrl_bus[0..31]' routed on Metal 2 (Sheet Resistance: 0.85 ohms/um):
  Total wire resistance = 850 ohms (Delay: 480 ps).
  Slack = -220 ps (FAILED).`,
    principle: "Lower metal layers (M1-M3) are thin with high sheet resistance, ideal for local cell connections. Upper intermediate metal layers (M4-M6) have lower resistance and capacitance. Critical timing nets should be layer-promoted to upper layers.",
    remedyTcl: `create_route_type -name CRITICAL_BUS_RULE -bottom_preferred_layer M5 -top_preferred_layer M6
set_db [get_db nets fsm_ctrl_bus*] .route_type CRITICAL_BUS_RULE
route_opt_design`,
    beforeMetrics: [
      { label: "Routing Layer", val: "M2 (Thin Metal - 0.85 Ω/µm)", bad: true },
      { label: "Interconnect RC Delay", val: "480 ps", bad: true },
      { label: "Path Slack", val: "-220 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "Routing Layer", val: "M5/M6 (Thick Metal - 0.08 Ω/µm) ✓", bad: false },
      { label: "Interconnect RC Delay", val: "85 ps (-82%) ✓", bad: false },
      { label: "Path Slack", val: "+55 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_promote_layer_m5",
        label: "Promote the critical 32-bit control bus to low-resistance M5/M6 metal layers ('set_db nets .route_type CRITICAL_BUS_RULE')",
        correct: true,
        explanation: "Correct! Routing on thicker M5/M6 metal slashes wire sheet resistance by 10x, reducing interconnect delay by 82%.",
      },
      {
        id: "opt_route_on_m1_polysilicon",
        label: "Route the bus on M1 polysilicon",
        correct: false,
        explanation: "M1 has higher resistance and worsens RC delay.",
      },
      {
        id: "opt_delete_bus_signals",
        label: "Delete the 32-bit bus",
        correct: false,
        explanation: "Deleting buses destroys system functionality.",
      },
    ],
  },
  {
    id: 46,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Simultaneous Switching Noise (SSN) Ground Bounce on Output Pad Ring",
    severity: "HIGH",
    stageName: "I/O Pad Ring / Voltus SI",
    symptom: "When 64 external memory bus output pads toggle from 1 to 0 simultaneously, a 280 mV Ground Bounce pulse causes adjacent input pads to false-trigger.",
    logSnippet: `[SSN-BOUNCE-01] Critical: Simultaneous Switching Noise Ground Bounce = 280 mV on VSS_IO:
  64 parallel DDR drivers switched low in 180 ps (L_bondwire * di/dt spike = 280 mV).
  Adjacent input pin 'gpio_irq_in' detected false logic 0 transition!`,
    principle: "Simultaneous Switching Noise (SSN / Ground Bounce) occurs when large switching currents pass through package pin/bondwire inductance ($V = L \cdot \frac{di}{dt}$). Adding dedicated VDD/VSS power/ground pairs between pad groups and staggering driver output slew prevents ground bounce.",
    remedyTcl: `add_io_pad -cell VSS_IO_PAD -location { between_ddr_buses }
add_io_pad -cell VDD_IO_PAD -location { between_ddr_buses }
set_db [get_db ports ddr_data*] .io_driver_slew_rate controlled_medium`,
    beforeMetrics: [
      { label: "Ground Bounce Spike", val: "280 mV (False Trigger)", bad: true },
      { label: "Power Pad to Signal Ratio", val: "1:16 (Inadequate)", bad: true },
      { label: "I/O Signal Integrity", val: "UNRELIABLE", bad: true },
    ],
    afterMetrics: [
      { label: "Ground Bounce Spike", val: "35 mV (Safe Margin) ✓", bad: false },
      { label: "Power Pad to Signal Ratio", val: "1:4 (Robust) ✓", bad: false },
      { label: "I/O Signal Integrity", val: "100% CLEAN ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_io_power_pads",
        label: "Insert dedicated VDD_IO/VSS_IO power-ground pad pairs between DDR bus groups (1:4 ratio) and configure slew-rate controlled drivers",
        correct: true,
        explanation: "Correct! Increasing ground return pad density lowers effective package loop inductance, quenching ground bounce to 35 mV.",
      },
      {
        id: "opt_remove_all_pads",
        label: "Remove I/O pads from the chip",
        correct: false,
        explanation: "Removing I/O pads prevents the chip from communicating with the outside world.",
      },
      {
        id: "opt_fastest_slew_all",
        label: "Set all drivers to maximum unconstrained slew speed",
        correct: false,
        explanation: "Faster slew increases $di/dt$, making ground bounce even worse.",
      },
    ],
  },
  {
    id: 47,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Inductive Wire Loop Current Return Path Discontinuity",
    severity: "MEDIUM",
    stageName: "Routing / High-Speed Transmission Line",
    symptom: "A 5 GHz clock net routed over a slot gap in the VSS ground plane experienced a 12% characteristic impedance discontinuity ($Z_0$ mismatch).",
    logSnippet: `[SI-PLANE-GAP] Warning: Net 'clk_high_speed_5g' crosses 40 um split in reference plane M6:
  Current return path diverted by 250 um around slot gap.
  Effective loop inductance L_loop increased by 300% (Signal reflection and ringing detected).`,
    principle: "High-frequency signals return directly beneath the signal trace on the adjacent reference ground plane to minimize loop inductance. Slot gaps or cuts in the ground plane force return currents to take long detour loops, creating ringing and EMI radiation.",
    remedyTcl: `create_route_type -name HS_CLK_RETURN -shield_net VSS -shield_side both
add_stripes -nets { VSS } -layer M6 -width 4.0 -start_offset 820.0
route_design -net clk_high_speed_5g -reroute`,
    beforeMetrics: [
      { label: "Ground Return Loop Area", val: "Large (Slot Gap Crossing)", bad: true },
      { label: "Impedance Discontinuity", val: "12% ($Z_0$ Mismatch)", bad: true },
      { label: "Signal Ringing Overshoot", val: "+220 mV", bad: true },
    ],
    afterMetrics: [
      { label: "Ground Return Loop Area", val: "Minimal (Direct Return) ✓", bad: false },
      { label: "Impedance Discontinuity", val: "< 1% (Matched 50 Ω) ✓", bad: false },
      { label: "Signal Ringing Overshoot", val: "0 mV (Clean Edge) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_bridge_ground_plane",
        label: "Bridge the ground plane slot with solid VSS metal stitching and route the high-speed clock with dedicated ground shielding",
        correct: true,
        explanation: "Correct! Continuous reference ground planes provide a low-inductance return path directly beneath the signal, eliminating reflections.",
      },
      {
        id: "opt_remove_ground_plane",
        label: "Delete the ground plane completely",
        correct: false,
        explanation: "Deleting ground planes destroys transmission line impedance control.",
      },
      {
        id: "opt_slow_clk_to_100k",
        label: "Slow down the clock to 100 kHz",
        correct: false,
        explanation: "100 kHz clock violates high-speed system specs.",
      },
    ],
  },
  {
    id: 48,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Victim Net Spacing Optimization (Wire Spreading) for SI Immunity",
    severity: "MEDIUM",
    stageName: "Routing / Post-Route Wire Spreading",
    symptom: "84 parallel buses routed at minimum 1x metal spacing suffer from 180 ps crosstalk delta delay across all corners.",
    logSnippet: `[SI-SPREAD-AUDIT] Information: 84 nets routed at minimum spacing (Space: 28 nm, Length > 500 um):
  Total coupling capacitance = 240 fF per net.
  Available track capacity in region: 42% free tracks.`,
    principle: "When routing tracks are available, wire spreading shifts parallel wires to extra spacing (2x or 3x spacing) without changing net connectivity, cutting coupling capacitance $C_c$ by 50-70%.",
    remedyTcl: `set_db route_design_detail_post_route_spread_wire true
set_db route_design_detail_wire_spreading_effort high
route_opt_design -expanded_views`,
    beforeMetrics: [
      { label: "Interconnect Coupling Cap", val: "240 fF per Net", bad: true },
      { label: "Average Wire Spacing", val: "1x Minimum Pitch", bad: true },
      { label: "Crosstalk Delta Delay", val: "+180 ps", bad: true },
    ],
    afterMetrics: [
      { label: "Interconnect Coupling Cap", val: "72 fF (-70%) ✓", bad: false },
      { label: "Average Wire Spacing", val: "2.4x Pitch ✓", bad: false },
      { label: "Crosstalk Delta Delay", val: "+15 ps (-91%) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_wire_spreading_high",
        label: "Enable high-effort post-route wire spreading ('set_db route_design_detail_post_route_spread_wire true') to utilize free tracks",
        correct: true,
        explanation: "Correct! Wire spreading moves adjacent wires apart into unused tracks, slashing coupling capacitance by 70% with zero area penalty.",
      },
      {
        id: "opt_delete_adjacent_wires",
        label: "Delete every second wire in the bus",
        correct: false,
        explanation: "Deleting wires deletes half the bus data.",
      },
      {
        id: "opt_ignore_coupling_cap",
        label: "Ignore coupling capacitance in STA",
        correct: false,
        explanation: "Ignoring coupling capacitance causes real silicon timing failures.",
      },
    ],
  },
  {
    id: 49,
    domainId: "signal_integrity",
    domainName: "Signal Integrity (SI)",
    title: "Crosstalk Noise on Level Shifter / Isolation Cell Control Lines",
    severity: "CRITICAL",
    stageName: "STA SI / Low Power Control Signoff",
    symptom: "A 240 mV crosstalk glitch on power domain `iso_en` isolation enable signal caused sleeping domain outputs to float, corrupting always-on memory.",
    logSnippet: `[LP-SI-GLITCH] Critical: Cross-talk glitch noise = 240 mV on net 'pd_cpu_iso_en':
  Glitch pulse width = 310 ps during sleep mode.
  Isolation clamps deactivated for 310 ps, injecting floating high-Z into always-on memory!`,
    principle: "Low-power control signals (isolation enable `iso_en`, power switch sleep control `sleep_n`, retention save/restore `save_n`) must NEVER glitch during power state transitions. They must be routed with high-priority NDR rules and low-impedance drivers.",
    remedyTcl: `set_db [get_db nets *iso_en*] .route_type CLK_NDR_SHIELD
set_db [get_db insts -of [get_db nets *iso_en* .driver]] .lib_cell [get_db lib_cells *BUFX16*]
route_design -net *iso_en* -reroute
time_design -post_route -si`,
    beforeMetrics: [
      { label: "Isolation Control Glitch", val: "240 mV (Isolation Break)", bad: true },
      { label: "Sleep State Reliability", val: "CORRUPTED", bad: true },
      { label: "Memory State Retention", val: "DATA LOSS", bad: true },
    ],
    afterMetrics: [
      { label: "Isolation Control Glitch", val: "8 mV (Safe Margin) ✓", bad: false },
      { label: "Sleep State Reliability", val: "100% ROBUST ✓", bad: false },
      { label: "Memory State Retention", val: "100% PRESERVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_shield_iso_control",
        label: "Apply low-impedance BUFX16 drivers and VSS ground shielding to isolation and power-gating control signals",
        correct: true,
        explanation: "Correct! Shielding critical power-management nets isolates them from noisy data buses, preventing accidental sleep-mode de-assertion.",
      },
      {
        id: "opt_disable_power_gating_forever",
        label: "Permanently disable power gating on the chip",
        correct: false,
        explanation: "Disabling power gating violates mobile device battery standby limits.",
      },
      {
        id: "opt_ignore_iso_glitches",
        label: "Ignore isolation glitches",
        correct: false,
        explanation: "Ignoring glitches leads to data corruption in always-on registers.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 6: POST-ROUTE TIMING CLOSURE, POCV & SIGNOFF ECO (10 Scenarios)
  // =========================================================================
  {
    id: 50,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Post-Route MMMC Timing Divergence: Setup (SSG/125°C) vs Hold (FFG/-40°C)",
    severity: "CRITICAL",
    stageName: "Post-Route Signoff / MMMC Closure",
    symptom: "Fixing 180 setup violations on the Slow Corner inserted high-drive buffers that created 240 hold violations on the Fast Corner!",
    logSnippet: `[MMMC-CLOSURE-FAIL] View 'func_slow_setup' (0.72V/125C): Setup WNS = +15 ps (MET)
View 'func_fast_hold' (0.88V/-40C): Hold WNS = -380 ps (240 Endpoints VIOLATED!)
Post-route optimizer thrashed between setup and hold views.`,
    principle: "Single-corner optimization thrashes. Post-route timing closure must use concurrent multi-view optimization (`opt_design -post_route -expanded_views`) where setup and hold slacks across all corners are calculated simultaneously.",
    remedyTcl: `set_db opt_hold_effort high
set_db opt_setup_effort high
set_db opt_hold_target_slack 0.030
set_db opt_setup_target_slack 0.030
opt_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Slow Corner Setup Slack", val: "+15 ps (Passed)", bad: false },
      { label: "Fast Corner Hold Slack", val: "-380 ps (240 Violations)", bad: true },
      { label: "MMMC Convergence", val: "DIVERGED", bad: true },
    ],
    afterMetrics: [
      { label: "Slow Corner Setup Slack", val: "+22 ps (MET) ✓", bad: false },
      { label: "Fast Corner Hold Slack", val: "+34 ps (MET) ✓", bad: false },
      { label: "MMMC Convergence", val: "100% CONVERGED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_concurrent_mmmc_pnr",
        label: "Run concurrent multi-view post-route optimization across all active MMMC views ('opt_design -post_route -expanded_views')",
        correct: true,
        explanation: "Correct! Concurrent MMMC optimization weights setup and hold across all PVT corners simultaneously, preventing corner thrashing.",
      },
      {
        id: "opt_ignore_fast_corner",
        label: "Ignore the Fast Corner and tape out for Slow Corner only",
        correct: false,
        explanation: "Ignoring the fast corner guarantees catastrophic hold race failures at low temperatures in silicon.",
      },
      {
        id: "opt_slow_down_clock_pnr",
        label: "Lower the clock frequency to fix hold time",
        correct: false,
        explanation: "Hold timing is independent of clock frequency.",
      },
    ],
  },
  {
    id: 51,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Parametric On-Chip Variation (POCV) Gaussian Derate Signoff Failure",
    severity: "HIGH",
    stageName: "STA Signoff / POCV Analysis",
    symptom: "Flat OCV (10% derate) passed, but advanced foundry POCV 3-sigma statistical analysis failed with -185 ps slack on deep logic paths.",
    logSnippet: `[TEMPUS-POCV] Error: Statistical timing violation under POCV (3-sigma distribution):
  Nominal Delay: 1.25 ns | POCV Sigma Variance (sqrt(sum(sigma^2))): 185 ps.
  Statistical 3-sigma Slack = -185 ps (FAILED).`,
    principle: "Traditional flat OCV applies a single scalar derate factor everywhere. Advanced Parametric OCV (POCV) models random variation as statistical Gaussian distributions per cell ($\mu \pm 3\sigma$), accurately capturing variation on deep logic chains.",
    remedyTcl: `read_pocv_table ./libs/pocv_table.pocv
set_db timing_analysis_type pocv
set_db timing_pocv_sigma 3.0
set_db timing_enable_cppr true
time_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Flat OCV Status", val: "+10 ps (Over-Optimistic)", bad: true },
      { label: "POCV 3-Sigma Slack", val: "-185 ps (FAILED)", bad: true },
      { label: "Foundry Signoff Quality", val: "REJECTED", bad: true },
    ],
    afterMetrics: [
      { label: "Flat OCV Status", val: "+45 ps ✓", bad: false },
      { label: "POCV 3-Sigma Slack", val: "+28 ps (MET) ✓", bad: false },
      { label: "Foundry Signoff Quality", val: "100% APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_pocv_signoff",
        label: "Load foundry POCV statistical variation tables ('read_pocv_table') and close timing under 3-sigma POCV modeling",
        correct: true,
        explanation: "Correct! Enabling POCV provides accurate statistical timing signoff matching real silicon manufacturing distributions.",
      },
      {
        id: "opt_revert_to_single_corner",
        label: "Revert to single-corner typical analysis",
        correct: false,
        explanation: "Single-corner analysis ignores process variations and causes silicon yield fallout.",
      },
      {
        id: "opt_disable_sigma",
        label: "Set sigma derate to 0",
        correct: false,
        explanation: "Zero sigma derate assumes zero process variation, which is physically impossible.",
      },
    ],
  },
  {
    id: 52,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Post-Route Metal ECO Leakage Power Recovery (HVT Cell Swapping)",
    severity: "MEDIUM",
    stageName: "Post-Route ECO / Leakage Recovery",
    symptom: "Post-route design passed timing with +85 ps margin, but static leakage power (65 mW) exceeded the battery product budget (20 mW).",
    logSnippet: `[POWER-REPORT] Total Standby Leakage = 65.4 mW (Budget: 20.0 mW):
  LVT standard cells = 68.2% of design.
  84,000 cells have positive timing slack > 80 ps.`,
    principle: "Non-critical paths with positive timing slack can be safely swapped from leaky Low-Vt (LVT) to high-threshold (HVT) cells using footprint-compatible cell swapping without altering physical placement or routing.",
    remedyTcl: `set_db opt_leakage_to_dynamic_ratio 0.9
set_db opt_preserve_slack true
set_db opt_slack_threshold 0.030
opt_leakage_power -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Static Leakage Power", val: "65.4 mW (320% Budget)", bad: true },
      { label: "LVT Cell Ratio", val: "68.2% (Excessive)", bad: true },
      { label: "Timing WNS Slack", val: "+85 ps (Positive)", bad: false },
    ],
    afterMetrics: [
      { label: "Static Leakage Power", val: "16.8 mW (MET) ✓", bad: false },
      { label: "LVT Cell Ratio", val: "7.4% (Targeted) ✓", bad: false },
      { label: "Timing WNS Slack", val: "+32 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_leakage_swap_eco",
        label: "Execute footprint-compatible post-route leakage recovery ('opt_leakage_power -post_route') to swap positive-slack cells to HVT",
        correct: true,
        explanation: "Correct! Swapping non-critical gates to HVT cuts standby leakage power by 74% with zero routing disruption and clean timing closure.",
      },
      {
        id: "opt_turn_off_vdd",
        label: "Turn off VDD to the whole chip permanently",
        correct: false,
        explanation: "Turning off VDD powers down the entire chip.",
      },
      {
        id: "opt_delete_slack_cells",
        label: "Delete all cells with positive slack",
        correct: false,
        explanation: "Deleting cells removes required logic functionality.",
      },
    ],
  },
  {
    id: 53,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Post-Route Functional Metal-Only ECO (Spare Gate Rewiring)",
    severity: "HIGH",
    stageName: "Post-Route Signoff / Functional ECO",
    symptom: "A last-minute RTL bug fix requires inverting a handshake signal, but base silicon layers are already frozen at the foundry mask shop!",
    logSnippet: `[FUNCTIONAL-ECO] Request: Invert signal 'dma_ack_valid' using existing spare cells:
  Base layers (Diffusion, Poly, Contact) are FROZEN.
  Modification allowed on Metal 2 to Metal 6 routing layers ONLY.`,
    principle: "A metal-only ECO disconnects uncommitted spare gates from VDD/VSS and re-routes their metal connections to implement the logic fix without altering the frozen silicon base layers ($2M mask savings).",
    remedyTcl: `eco_netlist_change -type add_inverter -inst_name SPARE_INV_42 -net dma_ack_valid
route_eco -nets { dma_ack_valid dma_ack_valid_b } -modify_layers_only { M2 M3 M4 M5 M6 }
check_drc
check_connectivity`,
    beforeMetrics: [
      { label: "Base Layer Modifications", val: "0 Layers (Frozen) ✓", bad: false },
      { label: "ECO Respin Mask Cost", val: "$85,000 (Metal Only) ✓", bad: false },
      { label: "Functional Bug Fix", val: "RESOLVED ✓", bad: false },
    ],
    afterMetrics: [
      { label: "Base Layer Modifications", val: "0 Layers ✓", bad: false },
      { label: "ECO Respin Mask Cost", val: "$85,000 ✓", bad: false },
      { label: "Functional Bug Fix", val: "100% VERIFIED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_spare_metal_eco",
        label: "Rewire nearby uncommitted spare inverter ('SPARE_INV_42') using metal-only ECO routing ('route_eco -modify_layers_only {M2 M3 M4 M5 M6}')",
        correct: true,
        explanation: "Correct! Metal-only ECO routing re-wires existing spare standard cells using top metal layers, preserving base silicon masks.",
      },
      {
        id: "opt_restart_full_pnr",
        label: "Re-run full chip floorplanning, placement, and routing from scratch",
        correct: false,
        explanation: "Re-running from scratch modifies all 48 base layers, costing $2M in lost mask fabrication fees.",
      },
      {
        id: "opt_ignore_handshake_bug",
        label: "Ignore the bug and release defective silicon",
        correct: false,
        explanation: "Releasing defective silicon leads to non-functional chip recalls.",
      },
    ],
  },
  {
    id: 54,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Clock Path Slew Degradation on Temperature Inversion Corners",
    severity: "HIGH",
    stageName: "STA Signoff / Temperature Inversion",
    symptom: "In 7nm FinFET, low temperature (-40°C) at low voltage (0.70V) caused clock buffer delay to be 35% slower than at 125°C due to Temperature Inversion!",
    logSnippet: `[TEMP-INVERSION-ERR] Warning: Path delay at -40C is WORSE than at 125C:
  View 'func_low_volt_cold' (0.70V / -40C): Path Delay = 1.12 ns (Slack: -220 ps FAILED)
  View 'func_low_volt_hot'  (0.70V / 125C): Path Delay = 0.85 ns (Slack: +50 ps MET)`,
    principle: "In deep sub-micron FinFET nodes operating at near-threshold voltages, the reduction in carrier mobility at cold temperatures dominates over threshold voltage reduction, making circuits switch SLOWER at -40°C than at 125°C (Temperature Inversion). Timing signoff must include both extreme cold and hot corners.",
    remedyTcl: `create_opcond -name op_cold -voltage 0.70 -temperature -40
create_timing_condition -name tc_cold -opcond op_cold -library_sets { libs_cold_0p70v }
create_analysis_view -name view_cold_setup -constraint_mode func_mode -delay_corner dc_cold
set_analysis_view -setup { view_cold_setup view_hot_setup } -hold { view_cold_hold view_hot_hold }
opt_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "-40°C Cold Corner Setup", val: "-220 ps (FAILED)", bad: true },
      { label: "+125°C Hot Corner Setup", val: "+50 ps (MET)", bad: false },
      { label: "Signoff Corner Coverage", val: "INCOMPLETE", bad: true },
    ],
    afterMetrics: [
      { label: "-40°C Cold Corner Setup", val: "+35 ps (MET) ✓", bad: false },
      { label: "+125°C Hot Corner Setup", val: "+42 ps (MET) ✓", bad: false },
      { label: "Signoff Corner Coverage", val: "100% MMMC COMPLIANT ✓", bad: false },
    ],
    options: [
      {
        id: "opt_temp_inversion_views",
        label: "Include low-voltage cold (-40°C) corner in active setup analysis views to close timing across temperature inversion regimes",
        correct: true,
        explanation: "Correct! Modeling both cold and hot PVT corners concurrently ensures buffers are sized to satisfy the temperature inversion slowdown.",
      },
      {
        id: "opt_ban_cold_operation",
        label: "Ban the chip from operating in cold environments",
        correct: false,
        explanation: "Commercial ASICs must operate from -40°C to +125°C.",
      },
      {
        id: "opt_single_hot_corner",
        label: "Synthesize only for 125°C",
        correct: false,
        explanation: "Synthesizing hot-only guarantees cold-start boot failure in silicon.",
      },
    ],
  },
  {
    id: 55,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Hold Time Violations in Multi-Voltage Power Domains During Dynamic Voltage Scaling",
    severity: "HIGH",
    stageName: "Multi-Voltage Timing Closure / DVS",
    symptom: "When CPU voltage drops from 1.0V to 0.72V while Always-On domain stays at 1.0V, 85 cross-domain paths fail hold timing by -280 ps.",
    logSnippet: `[DVS-HOLD-02] Error: Dynamic Voltage Scaling (DVS) hold failure:
  Fast Domain: 'PD_ALWAYS_ON' (1.0V) -> Slow Domain: 'PD_CPU' (0.72V)
  Hold Slack = -280 ps across 85 boundary level shifters!`,
    principle: "Dynamic Voltage Frequency Scaling (DVFS) creates extreme inter-domain skew conditions when one domain operates at high voltage (fast) and the receiving domain operates at low voltage (slow). Hold buffers must be sized for the worst-case voltage delta view.",
    remedyTcl: `create_analysis_view -name view_dvs_cross_hold -constraint_mode func_mode -delay_corner dc_dvs_worst
set_analysis_view -hold { view_dvs_cross_hold view_fast_hold }
opt_design -post_route -hold -expanded_views`,
    beforeMetrics: [
      { label: "DVFS Cross-Domain Hold Slack", val: "-280 ps (85 Violations)", bad: true },
      { label: "DVS State Transition", val: "CORRUPTED DATA", bad: true },
      { label: "Multi-Voltage Closure", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "DVFS Cross-Domain Hold Slack", val: "+38 ps (MET) ✓", bad: false },
      { label: "DVS State Transition", val: "100% SEAMLESS ✓", bad: false },
      { label: "Multi-Voltage Closure", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_dvs_hold_closure",
        label: "Add dedicated DVFS cross-voltage hold analysis views and run post-route hold optimization ('opt_design -post_route -hold')",
        correct: true,
        explanation: "Correct! Optimizing hold across cross-voltage corners inserts buffers that protect data integrity during dynamic voltage transitions.",
      },
      {
        id: "opt_lock_single_voltage",
        label: "Force both domains to run at 1.0V permanently",
        correct: false,
        explanation: "Disabling DVFS increases active CPU power by over 100%.",
      },
      {
        id: "opt_ignore_dvs_hold",
        label: "Ignore cross-domain hold violations",
        correct: false,
        explanation: "Ignoring hold violations causes data corruption during DVFS scaling.",
      },
    ],
  },
  {
    id: 56,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Clock Uncertainty Guardband Tuning for Tapeout Signoff",
    severity: "MEDIUM",
    stageName: "STA Signoff / Uncertainty Margin",
    symptom: "Pre-CTS clock uncertainty of 150 ps was left active post-route, causing unnecessary buffer insertion bloat on already-closed clock trees.",
    logSnippet: `[STA-MARGIN] Warning: Post-route STA is evaluating pre-CTS clock uncertainty of 150 ps:
  Real physical clock tree skew is already extracted and accounted for (Skew = 22 ps).
  Excessive 150 ps margin forcing tool to over-buffer 4,200 paths!`,
    principle: "Pre-CTS SDC uses large clock uncertainty (e.g. 150 ps) to estimate unrouted clock skew. Post-route, actual clock tree insertion delays and skew are explicitly modeled, so clock uncertainty should be reduced to account only for PLL phase jitter (typically 30-40 ps).",
    remedyTcl: `set_clock_uncertainty -setup 0.040 [get_clocks clk_core]
set_clock_uncertainty -hold  0.020 [get_clocks clk_core]
time_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Clock Uncertainty Setup Margin", val: "150 ps (Pre-CTS Estimate)", bad: true },
      { label: "Over-Buffering Bloat", val: "4,200 Unnecessary Buffers", bad: true },
      { label: "Total Power Overhead", val: "+14.2 mW", bad: true },
    ],
    afterMetrics: [
      { label: "Clock Uncertainty Setup Margin", val: "40 ps (Signoff Jitter) ✓", bad: false },
      { label: "Over-Buffering Bloat", val: "0 Buffers ✓", bad: false },
      { label: "Total Power Overhead", val: "Optimal ✓", bad: false },
    ],
    options: [
      {
        id: "opt_tighten_uncertainty",
        label: "Tighten post-route clock uncertainty to true PLL phase jitter (40 ps setup, 20 ps hold) using 'set_clock_uncertainty'",
        correct: true,
        explanation: "Correct! Post-route timing models real physical clock skew; reducing uncertainty to PLL jitter removes false pessimism and eliminates buffer bloat.",
      },
      {
        id: "opt_zero_uncertainty",
        label: "Set clock uncertainty to 0 ps everywhere",
        correct: false,
        explanation: "Zero uncertainty ignores real PLL phase jitter and causes silicon timing failures.",
      },
      {
        id: "opt_increase_uncertainty_1ns",
        label: "Increase uncertainty to 1.0 ns",
        correct: false,
        explanation: "1.0 ns uncertainty makes high-speed timing closure impossible.",
      },
    ],
  },
  {
    id: 57,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Min-Pulse Width Violations on High-Speed Memory Macro Clock Pins",
    severity: "HIGH",
    stageName: "STA Signoff / Min-Pulse Width Check",
    symptom: "SRAM clock pin `CLK` failed minimum high-pulse width DRC by 45 ps due to asymmetrical rise/fall slew degradation in clock buffers.",
    logSnippet: `[STA-PULSEWIDTH] Error: Min Pulse Width High violation on 'u_sram/sram_inst/CLK':
  High pulse duration = 310 ps (Library Required Minimum: 355 ps).
  Asymmetrical buffer delay shrunk high clock phase by 45 ps!`,
    principle: "High-frequency clock pulses can suffer pulse-width shrinkage if clock inverters have asymmetrical P/N transistor switching thresholds. Min-pulse-width violations prevent internal SRAM sense amplifiers and precharge circuits from resetting.",
    remedyTcl: `set_db opt_min_pulse_width_effort high
opt_design -post_route -min_pulse_width -expanded_views`,
    beforeMetrics: [
      { label: "SRAM High Pulse Width", val: "310 ps (Library Min: 355 ps)", bad: true },
      { label: "Memory Read Operability", val: "SENSE AMP FAILURE", bad: true },
      { label: "Pulse Width Violations", val: "12 Pins", bad: true },
    ],
    afterMetrics: [
      { label: "SRAM High Pulse Width", val: "395 ps (MET) ✓", bad: false },
      { label: "Memory Read Operability", val: "100% OPERATIONAL ✓", bad: false },
      { label: "Pulse Width Violations", val: "0 Pins ✓", bad: false },
    ],
    options: [
      {
        id: "opt_min_pulse_fix",
        label: "Run automated post-route min-pulse-width optimization ('opt_design -post_route -min_pulse_width') to balance rise/fall clock slews",
        correct: true,
        explanation: "Correct! Balancing symmetrical rise/fall delays across clock repeaters preserves duty cycle and satisfies SRAM min-pulse-width rules.",
      },
      {
        id: "opt_ignore_pulse_width",
        label: "Ignore pulse width violations",
        correct: false,
        explanation: "Ignoring pulse width violations leads to corrupted memory reads/writes in silicon.",
      },
      {
        id: "opt_delete_sram_clock",
        label: "Delete the SRAM clock pin",
        correct: false,
        explanation: "Deleting the clock pin disables the SRAM.",
      },
    ],
  },
  {
    id: 58,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "Critical Path Buffering Across Partition Boundaries in Hierarchical PnR",
    severity: "HIGH",
    stageName: "Hierarchical PnR / ILM Interface Timing",
    symptom: "Top-level integration timing shows -380 ps setup violation across Block A to Block B interface because boundary buffer insertion was locked.",
    logSnippet: `[HIER-TIMING-02] Error: Top-level cross-block timing violation:
  Block_A/out_port -> Block_B/in_port (Path Slack: -380 ps).
  Reason: Sub-block boundaries were locked with 'dont_touch', blocking buffer insertion.`,
    principle: "In hierarchical bottom-up physical design, top-level timing closure requires inserting repeaters at partition feedthrough boundaries or budgeting interface IO margins using Interface Logic Models (ILM).",
    remedyTcl: `set_db [get_db designs] .top_level_interface_optimization true
opt_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Cross-Partition Slack", val: "-380 ps (Failed)", bad: true },
      { label: "Interface Buffer Mobility", val: "LOCKED", bad: true },
      { label: "Top-Level Timing Closure", val: "UNCLOSED", bad: true },
    ],
    afterMetrics: [
      { label: "Cross-Partition Slack", val: "+45 ps (MET) ✓", bad: false },
      { label: "Interface Buffer Mobility", val: "OPTIMALLY BUFFERED ✓", bad: false },
      { label: "Top-Level Timing Closure", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_top_hier_opt",
        label: "Enable top-level interface optimization across partition boundaries ('set_db top_level_interface_optimization true')",
        correct: true,
        explanation: "Correct! Enabling boundary optimization allows the top-level tool to insert repeaters and size interface drivers to close cross-block timing.",
      },
      {
        id: "opt_flatten_entire_soc",
        label: "Flatten the entire 200M gate SoC into a single flat database",
        correct: false,
        explanation: "Flattening giant SoCs causes tool memory crashes and destroys modular verification.",
      },
      {
        id: "opt_delete_block_b",
        label: "Delete Block B",
        correct: false,
        explanation: "Deleting sub-blocks removes functional hardware.",
      },
    ],
  },
  {
    id: 59,
    domainId: "timing_closure_eco",
    domainName: "Timing Closure & ECO",
    title: "SPEF Parasitic Extraction Corner Mismatch in Multi-Corner Tempus STA",
    severity: "HIGH",
    stageName: "Parasitic Extraction / SPEF Ingestion",
    symptom: "Tempus STA evaluated RC-Best parasitic extraction for setup analysis instead of RC-Worst, yielding false positive timing passes.",
    logSnippet: `[SPEF-CHECK] Warning: Analysis View 'func_slow_setup' mapped to SPEF 'parasitics_rcbest.spef':
  Corner Mismatch: Setup view requires worst-case RC parasitics!
  False positive timing report detected.`,
    principle: "Setup timing signoff at slow PVT corners requires worst-case interconnect parasitic extraction (`RC-Worst` or `C-Worst` SPEF). Mismatching parasitic files causes inaccurate timing verification.",
    remedyTcl: `read_spef -view func_slow_setup outputs/spef/soc_top_rcworst.spef.gz
read_spef -view func_fast_hold  outputs/spef/soc_top_rcbest.spef.gz
time_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "Setup View SPEF Mapping", val: "RC-Best (Wrong Corner)", bad: true },
      { label: "Reported Timing Slack", val: "+45 ps (False Pass)", bad: true },
      { label: "Real Silicon Slack", val: "-280 ps (Silicon Failure)", bad: true },
    ],
    afterMetrics: [
      { label: "Setup View SPEF Mapping", val: "RC-Worst (Correct) ✓", bad: false },
      { label: "Reported Timing Slack", val: "+22 ps (Real Pass) ✓", bad: false },
      { label: "Real Silicon Slack", val: "+22 ps (Verified) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_correct_spef_mapping",
        label: "Correctly map 'soc_top_rcworst.spef.gz' to setup analysis views and 'soc_top_rcbest.spef.gz' to hold views",
        correct: true,
        explanation: "Correct! Matching accurate RC-Worst parasitics to setup views guarantees genuine timing signoff without false passes.",
      },
      {
        id: "opt_zero_spef",
        label: "Delete all SPEF files and assume zero wire resistance",
        correct: false,
        explanation: "Assuming zero wire resistance ignores physical interconnect physics.",
      },
      {
        id: "opt_wlm_post_route",
        label: "Switch post-route STA to statistical wire-load models",
        correct: false,
        explanation: "Wire-load models are prohibited in post-route signoff.",
      },
    ],
  },

  // =========================================================================
  // DOMAIN 7: PHYSICAL VERIFICATION (DRC/LVS), DFM & SIGNOFF (10 Scenarios)
  // =========================================================================
  {
    id: 60,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Layout Versus Schematic (LVS) Short Circuit on Abutted Macro PG Rails",
    severity: "CRITICAL",
    stageName: "Physical Verification / Calibre LVS",
    symptom: "Calibre LVS reports a fatal short circuit between `VDD_CORE` (0.8V) and `VDD_SRAM` (1.1V) where macro power rails abutted.",
    logSnippet: `[CALIBRE-LVS] Error: Direct Short Circuit between Net 'VDD_CORE' and Net 'VDD_SRAM':
  Short coordinate: (X: 1420.50, Y: 850.20) on Metal 4.
  LVS Result: FAILED (Power rails merged!).`,
    principle: "In multi-supply ASICs, separate power domains have distinct VDD potentials. Abutting macros or standard cells from different voltage domains without keepout boundary gaps creates catastrophic short circuits.",
    remedyTcl: `create_place_halo -halo_deltas { 15 15 15 15 } -insts [get_db insts -if {.is_macro == true}]
create_route_blockage -layers { M1 M2 M3 M4 M5 } -box { 1410 840 1430 860 }
check_lvs -design soc_top`,
    beforeMetrics: [
      { label: "LVS Power Short", val: "VDD_CORE <-> VDD_SRAM SHORT", bad: true },
      { label: "LVS Status", val: "FAILED (FATAL SHORT)", bad: true },
      { label: "Fabrication Release", val: "BLOCKED", bad: true },
    ],
    afterMetrics: [
      { label: "LVS Power Short", val: "0 Shorts (Isolated) ✓", bad: false },
      { label: "LVS Status", val: "CLEAN 100% PASSED ✓", bad: false },
      { label: "Fabrication Release", val: "APPROVED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_isolate_macro_pg_halo",
        label: "Apply 15 µm routing and placement halos around multi-voltage macros to isolate separate VDD power rails",
        correct: true,
        explanation: "Correct! Placement halos maintain physical isolation between differing power rails, preventing LVS power shorts.",
      },
      {
        id: "opt_merge_vdd_all",
        label: "Hardwire VDD_CORE and VDD_SRAM together across the entire chip",
        correct: false,
        explanation: "Merging 0.8V core with 1.1V SRAM over-voltages core transistors and destroys voltage scaling.",
      },
      {
        id: "opt_ignore_lvs_shorts",
        label: "Override LVS failure in signoff checklist",
        correct: false,
        explanation: "Overriding LVS power shorts results in smoking, dead silicon on the testbench.",
      },
    ],
  },
  {
    id: 61,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Dummy Metal Fill Density Balancing DRC Rule Violation",
    severity: "HIGH",
    stageName: "DFM / Metal Fill Generation",
    symptom: "Foundry DRC flags 320 metal density violations (M3 density = 14%, below foundry minimum limit of 25%) risking chemical-mechanical polishing (CMP) dishing.",
    logSnippet: `[PEGASUS-DFM] Error: 320 Metal density violations on M3:
  Local metal density in 50x50 um window = 14.2% (Foundry Window Limits: 25.0% - 75.0%).
  Risk: Oxide erosion and metal thickness variation during CMP planarization!`,
    principle: "Chemical-Mechanical Polishing (CMP) requires uniform metal density across every layer (typically 25% to 75% density per 50x50 µm window). Automated dummy metal fill insertion populates sparse areas with floating or tied dummy metal polygons.",
    remedyTcl: `set_db add_fillers_density_mode window_based
set_db add_fillers_target_density 45.0
add_metal_fill -layer { M1 M2 M3 M4 M5 M6 M7 M8 } -nets { VSS }
check_metal_density`,
    beforeMetrics: [
      { label: "M3 Local Metal Density", val: "14.2% (Below Min 25%)", bad: true },
      { label: "Density Window Violations", val: "320 Windows", bad: true },
      { label: "CMP Planarization Risk", val: "OXIDE DISHING / VOIDS", bad: true },
    ],
    afterMetrics: [
      { label: "M3 Local Metal Density", val: "46.5% (Uniform 45%) ✓", bad: false },
      { label: "Density Window Violations", val: "0 Windows ✓", bad: false },
      { label: "CMP Planarization Risk", val: "PERFECT PLANARITY ✓", bad: false },
    ],
    options: [
      {
        id: "opt_add_metal_fill",
        label: "Generate automated track-based dummy metal fill tied to VSS with 45% target density ('add_metal_fill -layer {M1..M8} -nets {VSS}')",
        correct: true,
        explanation: "Correct! Inserting dummy metal fill balances surface topography across all metal layers, satisfying foundry CMP density rules.",
      },
      {
        id: "opt_ignore_density",
        label: "Skip metal fill generation to reduce GDSII file size",
        correct: false,
        explanation: "Skipping metal fill results in severe CMP oxide erosion and wafer fabrication rejection.",
      },
      {
        id: "opt_solid_metal_sheet",
        label: "Fill entire chip with 100% solid metal sheet",
        correct: false,
        explanation: "100% solid metal exceeds maximum density limits and shorts all signals.",
      },
    ],
  },
  {
    id: 62,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Well Proximity Effect (WPE) Threshold Voltage Shift on Boundary Transistors",
    severity: "MEDIUM",
    stageName: "DFM / Stress Effect Modeling",
    symptom: "Transistors placed within 1.5 µm of a well edge suffered a 45 mV threshold voltage shift ($V_{th}$), slowing down an analog PLL oscillator.",
    logSnippet: `[WPE-CHECK] Warning: Well Proximity Effect (WPE) threshold shift detected:
  Cell 'u_pll/vco_inst' located 0.8 um from N-well mask boundary.
  Ion implant scattering increased Vth by +45 mV (PLL frequency degraded by 12%).`,
    principle: "During ion implantation, dopant atoms scatter off photoresist edges, creating higher dopant concentration near well boundaries (Well Proximity Effect - WPE). Sensitive analog/PLL cells must be padded with dummy boundary cells to stay > 3-5 µm away from well edges.",
    remedyTcl: `create_place_halo -halo_deltas { 5 5 5 5 } -insts [get_db insts u_pll/*]
add_boundary_cells -cells BOUNDARY_TAP -prefix WPE_GUARD`,
    beforeMetrics: [
      { label: "Distance to Well Edge", val: "0.8 µm (High WPE Stress)", bad: true },
      { label: "Vth Shift Penalty", val: "+45 mV Shift", bad: true },
      { label: "PLL Frequency Accuracy", val: "-12% Degraded", bad: true },
    ],
    afterMetrics: [
      { label: "Distance to Well Edge", val: "5.8 µm (Zero WPE Stress) ✓", bad: false },
      { label: "Vth Shift Penalty", val: "0 mV Shift ✓", bad: false },
      { label: "PLL Frequency Accuracy", val: "100% TARGET FREQ ✓", bad: false },
    ],
    options: [
      {
        id: "opt_wpe_halo",
        label: "Apply 5 µm placement halos and insert boundary guard cells around sensitive analog/PLL blocks to eliminate Well Proximity Effect",
        correct: true,
        explanation: "Correct! Keeping critical transistors away from well mask edges protects them from implant scatter variations, preserving exact analog Vth.",
      },
      {
        id: "opt_remove_well_masks",
        label: "Remove N-well masks from the foundry PDK",
        correct: false,
        explanation: "Removing well masks prevents PMOS transistor fabrication.",
      },
      {
        id: "opt_ignore_wpe",
        label: "Ignore WPE stress effects in SPICE simulation",
        correct: false,
        explanation: "Ignoring WPE leads to non-functional PLL clock generation in silicon.",
      },
    ],
  },
  {
    id: 63,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Electrical Rule Check (ERC) Floating Gate & Well Tie Violations",
    severity: "HIGH",
    stageName: "Physical Verification / Calibre ERC",
    symptom: "Calibre ERC flags 18 floating gate nodes and 4 un-tied N-wells in a custom analog sensor block.",
    logSnippet: `[CALIBRE-ERC] Error: 18 Floating Gate violations detected:
  Gate pins { u_sensor/amp_inst/INP, ... } have no DC path to VDD or VSS.
  Risk: Unpredictable electrostatic charging and gate oxide rupture!`,
    principle: "Electrical Rule Checking (ERC) detects floating MOS gates, un-tied substrate wells, and cross-voltage domain leakage paths. All MOS gates must have a defined DC conductive path to driver transistors or tie cells.",
    remedyTcl: `add_tie_cells -cells { TIELO } -prefix ERC_TIE -pins [get_db pins u_sensor/amp_inst/INP]
check_erc -design soc_top`,
    beforeMetrics: [
      { label: "Floating Gate Violations", val: "18 Floating Nodes", bad: true },
      { label: "Un-Tied N-Wells", val: "4 Wells", bad: true },
      { label: "ERC Signoff Status", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "Floating Gate Violations", val: "0 Floating Nodes ✓", bad: false },
      { label: "Un-Tied N-Wells", val: "0 Wells (Tied) ✓", bad: false },
      { label: "ERC Signoff Status", val: "PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_fix_erc_ties",
        label: "Tie floating gate inputs to deterministic logic levels using tie cells and verify substrate well taps",
        correct: true,
        explanation: "Correct! Tying floating gates eliminates indeterminate floating potentials and electrostatic gate rupture risks.",
      },
      {
        id: "opt_leave_floating",
        label: "Leave inputs floating to save power",
        correct: false,
        explanation: "Floating gates float to mid-rail potentials, causing massive short-circuit crowbar current and oxide damage.",
      },
      {
        id: "opt_delete_sensor",
        label: "Delete the analog sensor block",
        correct: false,
        explanation: "Deleting the block removes required sensor hardware.",
      },
    ],
  },
  {
    id: 64,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Shallow Trench Isolation (STI) Stress Effect Mitigation",
    severity: "MEDIUM",
    stageName: "DFM / Mechanical Stress Effect",
    symptom: "Standard cells placed adjacent to large dummy oxide trenches suffered a 15% drive current reduction due to compressive STI mechanical stress.",
    logSnippet: `[STI-STRESS] Warning: Drive current degradation on cell 'u_core/alu_buf':
  Distance to STI oxide trench edge (LOD) = 65 nm.
  Compressive mechanical stress reduced NMOS carrier mobility by 15%!`,
    principle: "Mechanical stress from oxide-filled Shallow Trench Isolation (STI) alters silicon crystal lattices, shifting carrier mobilities (Length of Diffusion - LOD effect). Placing dummy poly/diffusion buffer cells maintains uniform LOD stress.",
    remedyTcl: `add_fillers -cells { FILL64 FILL32 FILL16 FILL8 FILL4 } -prefix FILLER_STI
set_db opt_stress_aware_timing true
time_design -post_route -expanded_views`,
    beforeMetrics: [
      { label: "NMOS Mobility Degradation", val: "-15% Drive Current", bad: true },
      { label: "LOD Boundary Stress", val: "NON-UNIFORM", bad: true },
      { label: "Critical Path Slack", val: "-140 ps (Failed)", bad: true },
    ],
    afterMetrics: [
      { label: "NMOS Mobility Degradation", val: "0% (Uniform Lattice) ✓", bad: false },
      { label: "LOD Boundary Stress", val: "100% REGULARIZED ✓", bad: false },
      { label: "Critical Path Slack", val: "+35 ps (MET) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_sti_fillers",
        label: "Populate row boundaries with multi-finger diffusion filler cells to regularize Length of Diffusion (LOD) mechanical stress",
        correct: true,
        explanation: "Correct! Multi-finger diffusion fillers maintain continuous active oxide profiles, preventing STI stress-induced drive current loss.",
      },
      {
        id: "opt_disable_sti_layers",
        label: "Remove STI shallow trench isolation from the process",
        correct: false,
        explanation: "STI is mandatory to isolate adjacent transistors on silicon.",
      },
      {
        id: "opt_ignore_lod",
        label: "Ignore LOD stress in timing analysis",
        correct: false,
        explanation: "Ignoring LOD stress leads to slower silicon that fails target clock frequencies.",
      },
    ],
  },
  {
    id: 65,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "GDSII Layer Map Number Mismatch During Stream-Out Signoff",
    severity: "CRITICAL",
    stageName: "Tapeout Export / write_stream",
    symptom: "Exported GDSII stream-out file mapped Metal 6 polygons onto Layer 42 instead of Foundry Layer 60, misplacing all top power stripes!",
    logSnippet: `[GDS-STREAMOUT-ERR] Critical: Layer mapping mismatch in 'gds_layermap.map':
  DEF Layer 'M6' mapped to GDS Layer 42 (Foundry Rule: M6 is Layer 60, DataType 0).
  Result: Metal 6 masks will be fabricated on the wrong physical photolithography reticle!`,
    principle: "The GDSII/OASIS stream-out layer mapping file (`layermap`) translates abstract EDA tool layer names (`M1`, `M2`, `VIA1`) into foundry reticle layer/datatype numbers (`60:0`, `61:0`). Strict foundry-supplied map files are mandatory.",
    remedyTcl: `write_stream -format gds -map_file tech/foundry_official_gds.map \\
             -lib_name soc_top -output outputs/gds/soc_top_final.gds
check_drc -gds outputs/gds/soc_top_final.gds`,
    beforeMetrics: [
      { label: "GDSII Layer Map Integrity", val: "MISMAPPED (Layer 42 vs 60)", bad: true },
      { label: "Reticle Fabrication Risk", val: "FATAL MASK DEFECT", bad: true },
      { label: "Mask Shop Acceptance", val: "REJECTED", bad: true },
    ],
    afterMetrics: [
      { label: "GDSII Layer Map Integrity", val: "100% FOUNDRY MATCH ✓", bad: false },
      { label: "Reticle Fabrication Risk", val: "0% (Exact Reticles) ✓", bad: false },
      { label: "Mask Shop Acceptance", val: "SIGN-OFF READY ✓", bad: false },
    ],
    options: [
      {
        id: "opt_foundry_layermap",
        label: "Stream out GDSII using the certified foundry layer map file ('write_stream -map_file tech/foundry_official_gds.map')",
        correct: true,
        explanation: "Correct! Using the certified foundry layermap file guarantees all metal and via polygons map to exact physical mask reticle numbers.",
      },
      {
        id: "opt_ignore_layer_map",
        label: "Send GDSII to mask shop without a layermap file",
        correct: false,
        explanation: "Mask shops cannot process unmapped GDSII files.",
      },
      {
        id: "opt_random_layer_numbers",
        label: "Assign random numbers to GDSII layers",
        correct: false,
        explanation: "Random layer numbers result in totally non-functional chip masks.",
      },
    ],
  },
  {
    id: 66,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Guard Ring Isolation Failure on High-Voltage I/O Pad Boundary",
    severity: "HIGH",
    stageName: "Physical Verification / ESD Guard Rings",
    symptom: "High-voltage 3.3V I/O pads injected substrate noise into 0.8V sensitive core standard cells due to a broken guard ring enclosure.",
    logSnippet: `[ESD-GUARDRING-01] Error: Substrate guard ring enclosure gap:
  40 um gap found in double-diffused guard ring surrounding 3.3V I/O pad 'pad_usb_dp'.
  Substrate current injection into core logic detected!`,
    principle: "High-voltage I/O driver pads inject minority carriers into the common substrate during switching. Closed guard rings (N-well ring tied to VDD + P-substrate ring tied to VSS) collect injected carriers, isolating sensitive low-voltage core transistors.",
    remedyTcl: `add_guard_rings -ring_type double -nets { VDD_IO VSS_IO } -pad_instances [get_db insts pad_*]
check_drc -rule guard_ring_continuity`,
    beforeMetrics: [
      { label: "Guard Ring Continuity", val: "Broken (40 µm Gap)", bad: true },
      { label: "Substrate Noise Injection", val: "+145 mV Spike", bad: true },
      { label: "Core Logic Latch-Up Risk", val: "HIGH", bad: true },
    ],
    afterMetrics: [
      { label: "Guard Ring Continuity", val: "100% UNBROKEN RING ✓", bad: false },
      { label: "Substrate Noise Injection", val: "< 2 mV (Isolated) ✓", bad: false },
      { label: "Core Logic Latch-Up Risk", val: "0% (Immune) ✓", bad: false },
    ],
    options: [
      {
        id: "opt_close_guard_rings",
        label: "Synthesize unbroken double-diffused guard rings tied to VDD_IO/VSS_IO surrounding all high-voltage pad instances",
        correct: true,
        explanation: "Correct! Unbroken guard rings capture substrate carrier injection, isolating sensitive low-voltage core standard cells.",
      },
      {
        id: "opt_remove_guard_rings",
        label: "Delete guard rings to save silicon area",
        correct: false,
        explanation: "Removing guard rings causes substrate noise coupling and CMOS latch-up failure.",
      },
      {
        id: "opt_disable_io_voltage",
        label: "Power down I/O pads permanently",
        correct: false,
        explanation: "Powering down I/O pads prevents chip external communication.",
      },
    ],
  },
  {
    id: 67,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Text Label (Port) Pin Mapping Mismatch in LVS Layout Extraction",
    severity: "HIGH",
    stageName: "Physical Verification / LVS Pin Labels",
    symptom: "LVS failed with 64 port mismatches because pin text labels were placed on the drawing layer instead of the pin/text layer.",
    logSnippet: `[PEGASUS-LVS] Error: 64 Unmapped Primary I/O Pins:
  Schematic has Port 'pci_express_tx_p'; Layout has no recognized pin text on Layer M7_PIN.
  Text labels placed on M7_DRAWING (Ignored by LVS netlist extractor).`,
    principle: "LVS extractors recognize pin boundaries and primary I/O ports by reading text labels on dedicated pin/label layers (`M*_PIN` / `M*_TEXT`). Text placed on standard drawing layers is treated as dummy metal.",
    remedyTcl: `set_db write_stream_port_label_layer true
set_db write_stream_text_layer_map { M1 101 M2 102 M3 103 M4 104 M5 105 M6 106 M7 107 }
write_stream -format gds -map_file tech/gds_pin_map.map outputs/gds/soc_top_lvs.gds`,
    beforeMetrics: [
      { label: "LVS Port Matches", val: "0 / 64 (Unrecognized)", bad: true },
      { label: "Pin Label Layer", val: "M7_DRAWING (Wrong)", bad: true },
      { label: "LVS Signoff Status", val: "FAILED", bad: true },
    ],
    afterMetrics: [
      { label: "LVS Port Matches", val: "64 / 64 (100% Matched) ✓", bad: false },
      { label: "Pin Label Layer", val: "M7_PIN (Correct) ✓", bad: false },
      { label: "LVS Signoff Status", val: "CLEAN PASSED ✓", bad: false },
    ],
    options: [
      {
        id: "opt_correct_pin_text_layers",
        label: "Export GDSII with port labels mapped to dedicated foundry pin text layers ('set_db write_stream_port_label_layer true')",
        correct: true,
        explanation: "Correct! Mapping port text to official PIN layers allows the LVS engine to recognize all primary I/O ports cleanly.",
      },
      {
        id: "opt_delete_pin_names",
        label: "Delete all pin labels from the schematic",
        correct: false,
        explanation: "Deleting pin labels destroys schematic-to-layout verification.",
      },
      {
        id: "opt_ignore_lvs_ports",
        label: "Configure LVS to ignore all primary I/O pins",
        correct: false,
        explanation: "Ignoring primary I/O pins permits inverted or shorted I/O pads to pass undetected.",
      },
    ],
  },
  {
    id: 68,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "Slotting (Slot Cuts) on Ultra-Wide Top Metal Power Pads (CMP Dishing)",
    severity: "MEDIUM",
    stageName: "DFM / Wide Metal Slotting",
    symptom: "Solid 40x40 µm wire-bond power pads failed foundry DFM rules because wide un-slotted metal dished by 80 nm during CMP polishing.",
    logSnippet: `[DFM-SLOT-01] Error: Wide metal slotting violation on Top Metal Pad (X: 100, Y: 100):
  Pad width = 40.0 um (Threshold for mandatory slotting: > 15.0 um).
  Risk: CMP dishing causes metal thickness variation and wire-bond detachment!`,
    principle: "Ultra-wide metal polygons (> 15-20 µm width) suffer from CMP dishing where mechanical polishing wears down the soft copper center. Cutting longitudinal slots (slotting) into wide pads provides structural oxide pillars that support uniform planar polishing.",
    remedyTcl: `set_db add_fillers_slot_width 2.0
set_db add_fillers_slot_length 10.0
add_metal_slots -layer { M7 M8 } -min_width 15.0`,
    beforeMetrics: [
      { label: "Un-Slotted Wide Pads", val: "48 Pads (DRC Dishing)", bad: true },
      { label: "CMP Dishing Depth", val: "80 nm (Excessive)", bad: true },
      { label: "Wire-Bond Reliability", val: "POOR ADHESION", bad: true },
    ],
    afterMetrics: [
      { label: "Un-Slotted Wide Pads", val: "0 Pads (100% Slotted) ✓", bad: false },
      { label: "CMP Dishing Depth", val: "< 8 nm (Planar) ✓", bad: false },
      { label: "Wire-Bond Reliability", val: "100% ROBUST BOND ✓", bad: false },
    ],
    options: [
      {
        id: "opt_metal_slotting",
        label: "Apply automated longitudinal metal slotting on wide top-metal pads ('add_metal_slots -layer {M7 M8} -min_width 15.0')",
        correct: true,
        explanation: "Correct! Slotting wide metal polygons prevents CMP dishing and preserves flat top-metal surfaces for reliable wire-bonding.",
      },
      {
        id: "opt_shrink_pad_to_1um",
        label: "Shrink the wire-bond pad to 1 µm width",
        correct: false,
        explanation: "1 µm pads are too small for physical wire-bond needles (which require > 35 µm).",
      },
      {
        id: "opt_ignore_dishing",
        label: "Ignore CMP dishing warnings",
        correct: false,
        explanation: "Ignoring dishing leads to wire-bond detachment and open circuits in packaging.",
      },
    ],
  },
  {
    id: 69,
    domainId: "pv_signoff_dfm",
    domainName: "DRC/LVS & DFM",
    title: "OASIS vs GDSII File Format Compression for 50GB Full-Chip Signoff",
    severity: "MEDIUM",
    stageName: "Tapeout Signoff / Stream Data Management",
    symptom: "Exported raw GDSII file reached 78 GB, causing disk quota exhaustion and 6-hour transfer delays to the mask fabrication foundry.",
    logSnippet: `[STREAM-EXPORT] Warning: GDSII file size = 78.4 GB:
  Polygon count = 480,000,000. Disk I/O bottleneck during stream-out.
  Foundry transfer bandwidth exceeded.`,
    principle: "The SEMI standard OASIS (Open Artwork System Interchange Standard - SEMI P39) format replaces verbose GDSII records with modern binary compression, modal coordinate offsets, and repetition structures, reducing stream file sizes by 70-85%.",
    remedyTcl: `write_stream -format oasis -map_file tech/foundry_official_gds.map \\
             -output outputs/oasis/soc_top_final.oasis.gz
check_drc -oasis outputs/oasis/soc_top_final.oasis.gz`,
    beforeMetrics: [
      { label: "Stream File Format", val: "Raw GDSII (78.4 GB)", bad: true },
      { label: "Stream-Out Duration", val: "4.5 Hours", bad: true },
      { label: "Foundry Upload Time", val: "6.2 Hours", bad: true },
    ],
    afterMetrics: [
      { label: "Stream File Format", val: "OASIS (8.2 GB - 90% Smaller) ✓", bad: false },
      { label: "Stream-Out Duration", val: "22 Minutes ✓", bad: false },
      { label: "Foundry Upload Time", val: "18 Minutes ✓", bad: false },
    ],
    options: [
      {
        id: "opt_stream_oasis",
        label: "Export layout using compressed OASIS format ('write_stream -format oasis') to reduce file size by 90% and speed up mask shop handoff",
        correct: true,
        explanation: "Correct! OASIS is the modern industry standard for GDSII replacement, reducing multi-hundred-gigabyte stream files by ~90%.",
      },
      {
        id: "opt_delete_polygons_stream",
        label: "Delete half of the metal routing polygons to reduce file size",
        correct: false,
        explanation: "Deleting polygons destroys chip electrical connectivity.",
      },
      {
        id: "opt_export_jpeg",
        label: "Export the layout as a JPEG image file for the mask shop",
        correct: false,
        explanation: "Mask shops require vector geometric layout streams (OASIS/GDSII), not raster images.",
      },
    ],
  },
];


