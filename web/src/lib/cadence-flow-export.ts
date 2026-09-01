/**
 * Production Cadence Tcl recipes distilled from PLAN
 * (Genus / Innovus / Tempus / Voltus / Conformal LEC).
 * Generic open-source / technology-agnostic $TECH(*) / $DESIGN(*).
 */

export type CadenceRecipeId =
  | "genus_logical"
  | "genus_ispatial"
  | "genus_lp"
  | "genus_dft"
  | "innovus_pnr"
  | "innovus_pdn"
  | "tempus_signoff"
  | "voltus_rail"
  | "lec_fvmap";

export const CADENCE_RECIPES: {
  id: CadenceRecipeId;
  tool: string;
  title: string;
  blurb: string;
}[] = [
  { id: "genus_logical", tool: "Genus", title: "Logical synthesis", blurb: "syn_generic → syn_map → syn_opt (wire-load)" },
  { id: "genus_ispatial", tool: "Genus", title: "iSpatial", blurb: "Physical generic/map + syn_opt -spatial" },
  { id: "genus_lp", tool: "Genus", title: "Low-power + UPF", blurb: "read_power_intent -1801 → commit → compile" },
  { id: "genus_dft", tool: "Genus", title: "DFT-safe compile", blurb: "auto_ungroup none, keep scan flops, ICG dont_use false" },
  { id: "innovus_pnr", tool: "Innovus", title: "P&R PODV2", blurb: "floorplan → PDN → place_opt → clock_opt → route_opt" },
  { id: "innovus_pdn", tool: "Innovus", title: "PDN grid", blurb: "add_rings + add_stripes + sroute" },
  { id: "tempus_signoff", tool: "Tempus", title: "SI signoff + ECO", blurb: "SPEF, delaycal_enable_si, opt_signoff DRV/setup/hold" },
  { id: "voltus_rail", tool: "Voltus", title: "Power + rail", blurb: "report_power + analyze_rail" },
  { id: "lec_fvmap", tool: "LEC", title: "fv_map compare", blurb: "RTL↔map and map↔final (PLAN 8.lec.tcl)" },
];

export function generateCadenceRecipe(
  id: CadenceRecipeId,
  opts: { design?: string; effort?: string } = {}
): string {
  const D = opts.design || "soc_top";
  const E = opts.effort || "high";
  switch (id) {
    case "genus_logical":
      return genusLogical(D, E);
    case "genus_ispatial":
      return genusIspatial(D, E);
    case "genus_lp":
      return genusLp(D, E);
    case "genus_dft":
      return genusDft(D, E);
    case "innovus_pnr":
      return innovusPnr(D);
    case "innovus_pdn":
      return innovusPdn();
    case "tempus_signoff":
      return tempusSignoff(D);
    case "voltus_rail":
      return voltusRail(D);
    case "lec_fvmap":
      return lecFvmap(D);
  }
}

function hdr(title: string): string {
  return [
    "################################################################################",
    `# ${title}`,
    "# Ace-Seek Cadence PLAN recipes (generic open libraries)",
    `# Generated ${new Date().toISOString()}`,
    "################################################################################",
    "",
  ].join("\n");
}

function genusLogical(D: string, E: string): string {
  return `${hdr("Genus — PLAN logical synthesis")}
set DESIGN ${D}
read_mmmc mmmc.tcl
read_physical -lefs $TECH(lefs)
read_hdl -sv [glob rtl/*.sv]
elaborate $DESIGN
init_design
check_design -unresolved
check_timing_intent

set_db syn_generic_effort ${E}
syn_generic
set_db syn_map_effort ${E}
syn_map
set_db syn_opt_effort ${E}
syn_opt

report_qor > reports/\${DESIGN}_qor.rpt
write_hdl > outputs/\${DESIGN}_netlist.v
write_sdc -view $SYN(func_view) > outputs/\${DESIGN}_func.sdc
write_db -all_root_attributes outputs/\${DESIGN}.db
# LEC fv_map is written at syn_map — handoff to lec/inputs
`;
}

function genusIspatial(D: string, E: string): string {
  return `${hdr("Genus — PLAN iSpatial (physical)")}
set DESIGN ${D}
read_mmmc mmmc.tcl
read_physical -lefs $TECH(lefs)
read_hdl -sv [glob rtl/*.sv]
elaborate $DESIGN
init_design

if {[file exists $DESIGN(def_file)]} {
  read_def $DESIGN(def_file)
  set_db syn_generic_effort ${E}
  syn_generic -physical
  set_db syn_map_effort ${E}
  syn_map -physical
} else {
  set_db syn_generic_effort ${E}
  syn_generic -create_floorplan
  syn_generic -physical
  set_db syn_map_effort ${E}
  syn_map -physical
}

set_db syn_opt_effort ${E}
syn_opt
set_db opt_spatial_effort extreme
syn_opt -spatial

write_hdl > outputs/\${DESIGN}_netlist.v
write_sdc > outputs/\${DESIGN}_func.sdc
`;
}

function genusLp(D: string, E: string): string {
  return `${hdr("Genus — PLAN low-power + IEEE 1801")}
set DESIGN ${D}
read_mmmc mmmc.tcl
read_physical -lefs $TECH(lefs)
read_hdl -sv [glob rtl/*.sv]
elaborate $DESIGN

# After elaborate, before / after init_design — PLAN uses after elaborate
read_power_intent -verbose -module $DESIGN -1801 $DESIGN(power_intent)
check_power_intent
commit_power_intent

init_design
set_db lp_insert_clock_gating true
set_db use_multibit_cells true
set_db syn_generic_effort ${E}
syn_generic
set_db syn_map_effort ${E}
syn_map
set_db syn_opt_effort ${E}
syn_opt
report_clock_gating_quality > reports/clock_gating_quality.rpt
write_power_intent -1801 -base_name outputs/\${DESIGN}_out -overwrite
`;
}

function genusDft(D: string, E: string): string {
  return `${hdr("Genus — PLAN DFT-safe compile knobs")}
set DESIGN ${D}
set_db auto_ungroup none
set_db [get_db lib_cells *CKG*] .avoid false
set_db [get_db lib_cells *ICG*] .dont_use false
set_db use_multibit_cells true
set_db optimize_constant_0_flops false
set_db optimize_constant_1_flops false
set_db delete_unloaded_insts false

read_mmmc mmmc.tcl
read_physical -lefs $TECH(lefs)
read_hdl -sv [glob rtl/*.sv]
elaborate $DESIGN
init_design
set_db syn_generic_effort ${E}
syn_generic
set_db syn_map_effort ${E}
syn_map
set_db syn_opt_effort ${E}
syn_opt
# Then check_dft_rules / insert scan (site DFT deck)
write_hdl > outputs/\${DESIGN}_dft_netlist.v
`;
}

function innovusPnr(D: string): string {
  return `${hdr("Innovus — PLAN PODV2 P&R")}
set DESIGN ${D}
# run_pnr_flow -from floorplan -to signoff
# Stages: floorplan powerplan placement cts routing signoff

init_design

# --- PDN (method grid) ---
add_rings -nets {VDD VSS} -width 4 -spacing 1
add_stripes -nets {VDD VSS} -width 2 -set_to_set_distance 20
sroute -connect {core_pin pad_pin} -nets {VDD VSS}

# --- Place (PODV2) ---
place_opt_design -expanded_views -timing_debug_report

# --- CTS (method ccopt / htree) ---
create_clock_tree_spec
# H-tree option:
#   create_flexible_htree -name htree_clk -source clk
#   synthesize_flexible_htrees
clock_opt_design -expanded_views

# --- Route ---
route_opt_design

write_netlist outputs/\${DESIGN}_pnr.v
write_def outputs/\${DESIGN}.def
# SPEF per RC corner at signoff / Tempus
`;
}

function innovusPdn(): string {
  return `${hdr("Innovus — PLAN PDN methods")}
# set DESIGN(pdn_method) grid | rings_only | straps_only | bumps | hybrid | none

proc plan_pdn_grid {} {
  add_rings -nets {VDD VSS} -width 4 -spacing 1
  add_stripes -nets {VDD VSS} -width 2 -set_to_set_distance 20
  sroute -connect {core_pin pad_pin} -nets {VDD VSS}
}

proc plan_pdn_rings_only {} {
  add_rings -nets {VDD VSS} -width 4 -spacing 1
  sroute -connect {core_pin pad_pin} -nets {VDD VSS}
}

proc plan_pdn_straps_only {} {
  add_stripes -nets {VDD VSS} -width 2 -set_to_set_distance 20
  sroute -connect {core_pin pad_pin} -nets {VDD VSS}
}

plan_pdn_grid
`;
}

function tempusSignoff(D: string): string {
  return `${hdr("Tempus — PLAN SI signoff + opt_signoff ECO")}
set DESIGN ${D}
read_netlist outputs/\${DESIGN}_pnr.v -top $DESIGN
init_design

# Per RC corner SPEF (PLAN 11.sta_post_layout.tcl)
foreach rc_name [dict keys $MCMM(rc_corners)] {
  set spef_file outputs/\${DESIGN}_\${rc_name}.spef
  if {[file exists $spef_file]} {
    read_spef -rc_corner $rc_name $spef_file
  }
}

set_db delaycal_enable_si true
update_timing -full
report_timing -late  -max_paths 50 > reports/setup.rpt
report_timing -early -max_paths 50 > reports/hold.rpt
report_analysis_coverage > reports/analysis_coverage.rpt
report_slack_histogram > reports/slack_histogram.rpt

set_db opt_signoff_verbose true
set_db opt_signoff_eco_file_prefix DRV
opt_signoff -drv
set_db opt_signoff_eco_file_prefix SETUP
set_db opt_signoff_setup_target_slack 0.05
opt_signoff -setup
set_db opt_signoff_eco_file_prefix HOLD
opt_signoff -hold
`;
}

function voltusRail(D: string): string {
  return `${hdr("Voltus — PLAN power + rail")}
set DESIGN ${D}
# Typically launched after Innovus signoff DB
set_default_switching_activity -input_activity 0.2 -period 10
report_power -out_file reports/\${DESIGN}_power.rpt
report_power -leakage -out_file reports/\${DESIGN}_leakage.rpt
analyze_rail -type voltage
# Static IR maps + EM from site Voltus deck
`;
}

function lecFvmap(D: string): string {
  return `${hdr("Conformal LEC — PLAN fv_map two-step")}
set DESIGN ${D}
# syn_map writes fv_map under genus/fv/$DESIGN
set_mapping_method -sensitive
set_compare_options -threads 1,4
set_parallel_option -threads 1,4 -norelease_license

# 1) fv_map vs final netlist
read_implementation_information genus/fv/$DESIGN -golden fv_map -revised \${DESIGN}_netlistsv -use_rtl_names
add_compared_points -all
compare
report_verification > reports/lec_map2final.rpt

# 2) RTL vs fv_map (second compare in PLAN 8.lec.tcl)
# read_design -golden  -verilog rtl.v -top $DESIGN
# read_design -revised ... fv_map
# add_compared_points -all
# compare
`;
}

export function generateVoltusFromDesign(designName: string): string {
  return voltusRail(designName);
}
