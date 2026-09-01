/**
 * Cadence EDA reference distilled from PLAN (Genus / Innovus / Tempus / Voltus / LEC).
 * Proprietary foundry PDK paths, site license servers, and commercial cell names are omitted.
 * Commands and flags match Cadence DDI 23.1 / Innovus 25.x help dumps.
 */

export type CadenceTool = "genus" | "innovus" | "tempus" | "voltus" | "lec";

export type CadenceCommand = {
  name: string;
  tool: CadenceTool;
  group: string;
  usage: string;
  flags?: string[];
  note: string;
  example: string;
};

export type CadenceAttr = {
  name: string;
  tool: CadenceTool;
  type: string;
  def?: string;
  help: string;
};

export const CADENCE_TOOLS: { id: CadenceTool; title: string; shell: string; job: string }[] = [
  { id: "genus", title: "Genus", shell: "genus", job: "RTL → gates (logical, iSpatial, LP, DFT, hier)" },
  { id: "innovus", title: "Innovus", shell: "innovus", job: "Floorplan → PDN → place → CTS → route → signoff" },
  { id: "tempus", title: "Tempus", shell: "tempus", job: "Signoff STA, SI, SPEF, ECO opt_signoff" },
  { id: "voltus", title: "Voltus", shell: "voltus", job: "Static/dynamic IR, EM, power density" },
  { id: "lec", title: "Conformal LEC", shell: "lec", job: "RTL↔map↔final equivalence" },
];

export const CADENCE_FLOW = {
  genus: [
    "read_mmmc mmmc.tcl",
    "read_physical -lefs $TECH(lefs)",
    "read_hdl -sv $rtl",
    "elaborate $DESIGN",
    "init_design",
    "syn_generic  (+ -physical | -create_floorplan)",
    "syn_map      (+ -physical)",
    "syn_opt      (+ -spatial for iSpatial)",
    "write_hdl / write_sdc / write_db / write_sdf / write_parasitics",
  ],
  innovus: [
    "init_design  (netlist + MMMC + LEF)",
    "floorplan / plan_design",
    "add_rings + add_stripes + sroute   (PDN method)",
    "place_opt_design                   (PODV2)",
    "clock_opt_design  | ccopt_design   (CTS method)",
    "route_opt_design",
    "opt_design / signoff checks",
    "write_netlist / write_def / write_spef",
  ],
  tempus: [
    "read_mmmc / init_design",
    "read_spef -rc_corner $rc $file.spef",
    "read_sdf (optional GLS)",
    "set_db delaycal_enable_si true",
    "update_timing -full",
    "report_timing -late / -early",
    "opt_signoff -drv | -setup | -hold | -leakage",
  ],
  voltus: [
    "read_db / read_spef",
    "set_power_analysis_mode",
    "read_activity / set_default_switching_activity",
    "report_power",
    "analyze_rail / report_rail",
  ],
  lec: [
    "read_design -golden  (RTL or fv_map)",
    "read_design -revised (mapped / final netlist)",
    "set_undriven_signal 0 -golden",
    "add_compared_points -all",
    "compare",
    "report_unmapped_points / report_verification",
  ],
};

export const CADENCE_METHODS = {
  syn: [
    { id: "logical", what: "Wire-load: syn_generic → syn_map → syn_opt", when: "No DEF / early RTL QoR" },
    { id: "ispatial", what: "Physical + syn_opt -spatial (Innovus in-memory)", when: "Floorplan DEF exists" },
    { id: "lp", what: "Clock gating + read_power_intent -1801/-cpf", when: "UPF/CPF present" },
    { id: "topdown", what: "Full chip, set_dont_touch named modules", when: "Keep hierarchy" },
    { id: "bottomup", what: "Child ILM | write_db | blackbox shell, then top", when: "Block-based SoC" },
  ],
  cts: [
    { id: "htree", what: "create_flexible_htree → synthesize_flexible_htrees → clock_opt_design" },
    { id: "ccopt", what: "clock_opt_design only (concurrent clock + datapath)" },
    { id: "cts_only", what: "clock_opt_design -cts (tree only)" },
    { id: "ccopt_design", what: "Classic ccopt_design (PODV1-style)" },
    { id: "htree_then_ccopt", what: "H-tree spine then ccopt_design" },
    { id: "mesh", what: "connect_clock_tree_mesh_drivers + clock_opt_design" },
  ],
  pdn: [
    { id: "grid", what: "Rings + stripes + sroute (default)" },
    { id: "rings_only", what: "Rings + sroute" },
    { id: "straps_only", what: "Stripes + sroute" },
    { id: "bumps", what: "Flip-chip power bumps" },
    { id: "hybrid", what: "Grid then bumps" },
    { id: "bumps_grid", what: "Bumps first, stripes -over_bumps" },
  ],
  pnr_stages: ["floorplan", "powerplan", "placement", "cts", "routing", "signoff"],
};

export const CADENCE_COMMANDS: CadenceCommand[] = [
  {
    name: "get_db",
    tool: "genus",
    group: "database",
    usage: "get_db [-if expr] [-foreach body] [-unique] [obj] [.attr]",
    flags: ["-if", "-expr", "-foreach", "-unique", "-invert", "-regexp", "-dbu"],
    note: "Cadence object query. Returns a list of db handles, not a Synopsys collection. Use llength, not sizeof_collection.",
    example: `get_db insts -if {.is_sequential == true}
get_db [get_db insts *reg*] .name
get_db pins u_alu/*/D`,
  },
  {
    name: "set_db",
    tool: "genus",
    group: "database",
    usage: "set_db <obj> .<attr> <value>   OR   set_db <root_attr> <value>",
    note: "Root attributes omit an object: set_db syn_generic_effort high. Object attributes use a handle: set_db $cell .dont_use true.",
    example: `set_db syn_generic_effort high
set_db syn_map_effort high
set_db syn_opt_effort high
set_db auto_ungroup both
set_db [get_db lib_cells *ICG*] .dont_use false`,
  },
  {
    name: "read_hdl",
    tool: "genus",
    group: "read",
    usage: "read_hdl [-sv|-v1995|-v2001] <files>",
    note: "Then elaborate $top. uniquify if needed. init_design after MMMC/physical.",
    example: `read_hdl -sv [glob rtl/*.sv]
elaborate soc_top
init_design`,
  },
  {
    name: "read_mmmc",
    tool: "genus",
    group: "read",
    usage: "read_mmmc <mmmc.tcl>",
    note: "Loads create_library_set / delay_corner / constraint_mode / analysis_view. Same MMMC objects in Innovus/Tempus.",
    example: `read_mmmc mmmc.tcl
read_physical -lefs $lefs`,
  },
  {
    name: "syn_generic",
    tool: "genus",
    group: "compile",
    usage: "syn_generic [-physical] [-create_floorplan] [-estimate_flop_bits] [<design>]",
    flags: ["-physical", "-create_floorplan", "-estimate_flop_bits"],
    note: "Generic (GTECH) optimization. Effort: set_db syn_generic_effort low|medium|high.",
    example: `set_db syn_generic_effort high
syn_generic
# physical, no DEF:
syn_generic -create_floorplan
syn_generic -physical`,
  },
  {
    name: "syn_map",
    tool: "genus",
    group: "compile",
    usage: "syn_map [-physical] [<design>]",
    note: "Map generic gates to the target .lib. Writes fv_map for LEC.",
    example: `set_db syn_map_effort high
syn_map
# or
syn_map -physical`,
  },
  {
    name: "syn_opt",
    tool: "genus",
    group: "compile",
    usage: "syn_opt [-spatial] [<design>]",
    note: "-spatial is iSpatial (Genus talks to Innovus). Run logical syn_opt first, then syn_opt -spatial.",
    example: `set_db syn_opt_effort high
syn_opt
set_db opt_spatial_effort extreme
syn_opt -spatial`,
  },
  {
    name: "check_design / check_timing_intent",
    tool: "genus",
    group: "check",
    usage: "check_design ; check_timing_intent ; check_dft_rules",
    note: "Stop-the-line: unresolved refs, latches, unconstrained clocks.",
    example: `check_design -unresolved
check_timing_intent
report_qor`,
  },
  {
    name: "read_power_intent",
    tool: "genus",
    group: "power",
    usage: "read_power_intent -verbose [-module top] [-1801|-cpf] file.upf",
    note: "After elaborate. Then check_power_intent ; commit_power_intent.",
    example: `read_power_intent -verbose -module soc_top -1801 design.upf
check_power_intent
commit_power_intent`,
  },
  {
    name: "place_opt_design",
    tool: "innovus",
    group: "place",
    usage: "place_opt_design [-incremental] [-expanded_views] [-timing_debug_report]",
    flags: ["-incremental", "-expanded_views", "-predict_prects", "-timing_debug_report"],
    note: "PODV2: placement + pre-CTS optimization. Replaces older place_design + opt_design -preCTS.",
    example: `place_opt_design -expanded_views -timing_debug_report`,
  },
  {
    name: "clock_opt_design",
    tool: "innovus",
    group: "cts",
    usage: "clock_opt_design [-cts] [-expanded_views] [-check_cts_config]",
    flags: ["-cts", "-expanded_views", "-check_cts_config", "-timing_debug_report"],
    note: "Use instead of ccopt_design when the DB is PODV2. -cts builds the tree only.",
    example: `create_clock_tree_spec
clock_opt_design -expanded_views
# tree only:
clock_opt_design -cts`,
  },
  {
    name: "ccopt_design",
    tool: "innovus",
    group: "cts",
    usage: "ccopt_design [-expanded_views]",
    note: "Classic concurrent CTS. PLAN still supports it as method ccopt_design / htree_then_ccopt.",
    example: `ccopt_design -expanded_views`,
  },
  {
    name: "create_flexible_htree",
    tool: "innovus",
    group: "cts",
    usage: "create_flexible_htree … ; synthesize_flexible_htrees",
    note: "PLAN default CTS method htree: H-tree spine then clock_opt_design.",
    example: `create_flexible_htree -name htree_clk -source clk
synthesize_flexible_htrees
clock_opt_design`,
  },
  {
    name: "route_opt_design",
    tool: "innovus",
    group: "route",
    usage: "route_opt_design [-route|-opt|-setup|-hold|-drv] [-incremental]",
    flags: ["-route", "-opt", "-setup", "-hold", "-drv", "-incremental", "-track_opt"],
    note: "Combined nanoRoute + post-route opt. Split with -route then -opt if you need a checkpoint.",
    example: `route_opt_design -expanded_views
# DRV-only ECO style:
route_opt_design -drv -incremental`,
  },
  {
    name: "add_rings / add_stripes / sroute",
    tool: "innovus",
    group: "pdn",
    usage: "add_rings … ; add_stripes … ; sroute -connect {core_pin pad_pin}",
    note: "PLAN PDN methods wrap these: grid | rings_only | straps_only | bumps | hybrid.",
    example: `add_rings -nets {VDD VSS} -width 4 -spacing 1 -layer_top M8
add_stripes -nets {VDD VSS} -width 2 -spacing 1 -set_to_set_distance 20
sroute -connect {core_pin pad_pin} -nets {VDD VSS}`,
  },
  {
    name: "report_timing",
    tool: "tempus",
    group: "sta",
    usage: "report_timing [-late|-early] [-max_paths N] [-from …] [-to …] [-view view]",
    flags: ["-late", "-early", "-max_paths", "-nworst", "-path_type", "-collection", "-unconstrained"],
    note: "Cadence: -late = setup, -early = hold. Not -delay_type max like PrimeTime.",
    example: `update_timing -full
report_timing -late  -max_paths 50 > setup.rpt
report_timing -early -max_paths 50 > hold.rpt
report_timing -late -from [get_ports in*] -to [get_db pins u_alu/q_reg*/D]`,
  },
  {
    name: "opt_signoff",
    tool: "tempus",
    group: "eco",
    usage: "opt_signoff -drv | -setup | -hold | -leakage",
    note: "Signoff ECO in Tempus. Prefix ECO files with set_db opt_signoff_eco_file_prefix.",
    example: `set_db delaycal_enable_si true
set_db opt_signoff_setup_target_slack 0.05
opt_signoff -drv
opt_signoff -setup
opt_signoff -hold`,
  },
  {
    name: "report_power",
    tool: "voltus",
    group: "power",
    usage: "report_power [-leakage] [-out_file f] [-hierarchy] [-nworst N]",
    note: "Needs activity (VCD/SAIF or default toggle). Pair with analyze_rail for IR.",
    example: `set_default_switching_activity -input_activity 0.2 -period 10
report_power -out_file power.rpt
analyze_rail -type voltage`,
  },
  {
    name: "add_compared_points / compare",
    tool: "lec",
    group: "lec",
    usage: "add_compared_points -all ; compare",
    note: "Golden vs revised. PLAN LEC dofile: fv_map vs final, then RTL vs fv_map.",
    example: `read_design -golden  -verilog rtl.v -top soc
read_design -revised -verilog map.v -top soc
add_compared_points -all
compare
report_verification`,
  },
];

export const CADENCE_ATTRS: CadenceAttr[] = [
  { name: "syn_generic_effort", tool: "genus", type: "enum", def: "medium", help: "low|medium|high effort for syn_generic" },
  { name: "syn_map_effort", tool: "genus", type: "enum", def: "medium", help: "Mapping effort" },
  { name: "syn_opt_effort", tool: "genus", type: "enum", def: "medium", help: "syn_opt effort" },
  { name: "auto_ungroup", tool: "genus", type: "enum", def: "both", help: "both|none — DFT flows often set none" },
  { name: "use_multibit_cells", tool: "genus", type: "bool", def: "false", help: "Pack flops into multibit; DFT often true" },
  { name: "lp_insert_clock_gating", tool: "genus", type: "bool", help: "Infer ICG from if (en) q <= d" },
  { name: "optimize_constant_0_flops", tool: "genus", type: "bool", def: "true", help: "DFT: set false so scan flops are not tied off" },
  { name: "delete_unloaded_insts", tool: "genus", type: "bool", def: "true", help: "DFT: set false to keep scan-only flops" },
  { name: "opt_spatial_effort", tool: "genus", type: "enum", def: "extreme", help: "iSpatial syn_opt -spatial" },
  { name: "delaycal_enable_si", tool: "tempus", type: "bool", def: "false", help: "Crosstalk-aware delay; true at signoff" },
  { name: "opt_signoff_setup_target_slack", tool: "tempus", type: "float", help: "Slack target for opt_signoff -setup" },
  { name: "place_global_max_density", tool: "innovus", type: "float", help: "Global placement density cap" },
];

export const CADENCE_GETDB = [
  { q: "get_db insts -if {.is_sequential == true}", a: "All flops/latches (Cadence). Synopsys: get_cells -filter is_sequential==true" },
  { q: "llength [get_db insts]", a: "Count. Never sizeof_collection on get_db lists." },
  { q: "get_db $inst .name", a: "Attribute of a handle. Synopsys: get_object_name / get_attribute" },
  { q: "get_db pins */D -if {.direction == in}", a: "Data pins" },
  { q: "get_db nets -if {.num_loads > 40}", a: "High fanout (PLAN HFN hunter)" },
  { q: "foreach i [get_db insts *reg*] { puts [get_db $i .name] }", a: "Iterate — not foreach_in_collection" },
];
