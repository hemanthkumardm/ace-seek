/**
 * Comprehensive VLSI & EDA Tool Command Database
 * Covers Cadence Innovus, Tempus, Voltus, Genus, Conformal LEC, Synopsys DC/ICC2/PrimeTime, SDC, and OpenROAD.
 */

export interface EdaCommandEntry {
  id: string;
  title: string;
  category: "query" | "floorplan" | "timing" | "cts" | "pdn" | "eco" | "power" | "lec" | "drc" | "dft" | "hierarchical" | "macro" | "mmmc";
  keywords: string[];
  cadenceStylus: string;
  cadenceLegacy?: string;
  synopsys: string;
  openRoad?: string;
  description: string;
  exampleScript: string;
  relatedLink?: { title: string; href: string };
}

export const EDA_COMMANDS_DB: EdaCommandEntry[] = [
  // 1. MACROS & BLOCKS
  {
    id: "get_macros",
    title: "Get / Query All Hard Macros & Memory Blocks",
    category: "query",
    keywords: ["macro", "macros", "hard macro", "memory", "sram", "blocks", "get all macros", "find macros"],
    cadenceStylus: "get_db insts -if {.is_macro == true}\n# or by subclass:\nget_db [get_db insts -if {.is_block == true}]",
    cadenceLegacy: "dbGet [dbGet top.insts.cell.subClass block -p2].name\n# or\nget_cells -hierarchical -filter \"is_macro==true\"",
    synopsys: "get_cells -hierarchical -filter \"is_hard_macro==true\"\n# or\nget_cells -hier -filter \"is_macro==true && is_hierarchical==false\"",
    openRoad: "get_cells -hierarchical -filter \"is_macro==true\"",
    description: "Queries all instantiated hard macros (SRAMs, ROMs, analog IP, PLLs) in the design hierarchy.",
    exampleScript: `# Cadence Stylus: Query count and names of all SRAM/macros
set macro_list [get_db insts -if {.is_macro == true}]
puts "Total Hard Macros: [llength $macro_list]"
foreach m $macro_list {
  puts "Macro: [get_db $m .name] | Cell: [get_db $m .cell.name] | Location: [get_db $m .location]"
}`,
    relatedLink: { title: "Innovus PnR Practical Lab", href: "/vlsi/learn/c/cadence-pnr/innovus-practical-lab" },
  },

  // 2. SEQUENTIAL REGISTERS (FLOPS & LATCHES)
  {
    id: "get_sequential",
    title: "Get / Query All Sequential Cells (Registers, Flip-Flops, Latches)",
    category: "query",
    keywords: ["sequential", "registers", "flops", "flip flops", "flip-flops", "latches", "dff", "all registers", "get flops"],
    cadenceStylus: "get_db insts -if {.is_sequential == true}\n# or specifically flops vs latches:\nget_db insts -if {.is_sequential && !.is_latch}",
    cadenceLegacy: "get_cells -hierarchical -filter \"is_sequential==true\"",
    synopsys: "all_registers\n# or\nget_cells -hierarchical -filter \"is_sequential==true\"",
    openRoad: "all_registers",
    description: "Returns all sequential storage elements (master-slave DFFs, scan flops, and latches) across the hierarchy.",
    exampleScript: `# Count all registers in design
set all_flops [get_db insts -if {.is_sequential == true}]
puts "Total Sequential Registers: [llength $all_flops]"`,
    relatedLink: { title: "STA Timing Studio", href: "/vlsi/timing-studio" },
  },

  // 3. COMBINATIONAL LOGIC CELLS
  {
    id: "get_combinational",
    title: "Get / Query All Combinational Logic Cells",
    category: "query",
    keywords: ["combinational", "comb", "logic gates", "nand", "nor", "inverter", "buffers"],
    cadenceStylus: "get_db insts -if {.is_combinational == true}",
    cadenceLegacy: "get_cells -hierarchical -filter \"is_combinational==true\"",
    synopsys: "get_cells -hierarchical -filter \"is_combinational==true\"",
    openRoad: "get_cells -hierarchical -filter \"is_combinational==true\"",
    description: "Queries all combinational logic gates (AND, OR, NAND, XOR, MUX, Inverters, Buffers) excluding flops and macros.",
    exampleScript: `# Get all combinational buffers in design
set comb_cells [get_db insts -if {.is_combinational == true}]`,
    relatedLink: { title: "Cadence Genus Synthesis (Master)", href: "/vlsi/learn/c/cadence-synthesis" },
  },

  // 4. CLOCKS & CLOCK NETS
  {
    id: "get_clocks",
    title: "Get / Query Clocks & Clock Distribution Nets",
    category: "timing",
    keywords: ["clock", "clocks", "clock nets", "clock roots", "all clocks", "get clocks", "clk"],
    cadenceStylus: "all_clocks\n# Query clock tree nets:\nget_db nets -if {.is_clock == true}\n# Clock source pins:\nget_db [get_db clocks $clk_name].sources",
    cadenceLegacy: "all_clocks ; dbGet [dbGet top.nets.isClock 1 -p2].name",
    synopsys: "all_clocks\n# Clock nets:\nget_nets -hierarchical -filter \"is_clock==true\"",
    openRoad: "all_clocks",
    description: "Returns all SDC clock objects or physical routing nets identified as part of the synthesized clock tree.",
    exampleScript: `# Query all defined clocks and their period constraints
foreach clk [all_clocks] {
  set period [get_db $clk .period]
  puts "Clock: [get_db $clk .name] -> Period: \${period}ns"
}`,
    relatedLink: { title: "SDC Constraints Studio", href: "/vlsi/sdc-studio" },
  },

  // 5. HIGH FANOUT NETS (HFN)
  {
    id: "get_high_fanout",
    title: "Get / Query High Fanout Nets (HFN)",
    category: "query",
    keywords: ["high fanout", "hfn", "fanout", "num_loads", "heavy load", "load pins"],
    cadenceStylus: "get_db nets -if {.num_loads > 40}\n# Sorted by fanout count:\nlsort -integer -decreasing -stride 2 [get_db nets -foreach {list $name .num_loads}]",
    cadenceLegacy: "dbGet [dbGet top.nets.numPins 40 -p2].name",
    synopsys: "all_high_fanout -nets -threshold 40",
    openRoad: "get_nets -filter \"num_pins > 40\"",
    description: "Finds all signal nets driving more than a specified fanout threshold to target buffer tree synthesis.",
    exampleScript: `# Find top 10 highest fanout nets
set hfn_nets [get_db nets -if {.num_loads > 50}]
foreach n $hfn_nets {
  puts "Net: [get_db $n .name] | Load Count: [get_db $n .num_loads]"
}`,
    relatedLink: { title: "Tempus STA Timing Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
  },

  // 6. PORTS & PRIMARY I/Os
  {
    id: "get_ports",
    title: "Get / Query Primary Top-Level Input & Output Ports",
    category: "query",
    keywords: ["ports", "all inputs", "all outputs", "primary inputs", "primary outputs", "get ports", "io pins"],
    cadenceStylus: "get_db ports\n# Input ports only:\nget_db ports -if {.direction == in}\n# Output ports only:\nget_db ports -if {.direction == out}",
    cadenceLegacy: "all_inputs ; all_outputs ; get_ports",
    synopsys: "all_inputs\nall_outputs\nget_ports -filter \"direction==in\"",
    openRoad: "all_inputs ; all_outputs ; get_ports",
    description: "Returns top-level design I/O port boundary objects for constraint application (set_input_delay / set_output_delay).",
    exampleScript: `# Set 50fF external capacitive load on all output ports
set_load -max 0.050 [all_outputs]`,
    relatedLink: { title: "SDC Constraints Studio", href: "/vlsi/sdc-studio" },
  },

  // 7. LEVEL SHIFTERS & ISOLATION CELLS (UPF)
  {
    id: "get_upf_cells",
    title: "Get / Query UPF Special Cells (Level Shifters, Isolation, Always-On)",
    category: "power",
    keywords: ["level shifter", "isolation cell", "always on", "upf cells", "power management cells", "iso", "aon"],
    cadenceStylus: "get_db insts -if {.is_level_shifter == true}\nget_db insts -if {.is_isolation == true}\nget_db insts -if {.is_always_on == true}",
    cadenceLegacy: "get_cells -hier -filter \"is_level_shifter==true || is_isolation_cell==true\"",
    synopsys: "get_cells -hier -filter \"is_level_shifter==true\"\nget_cells -hier -filter \"is_isolation_cell==true\"",
    openRoad: "get_cells -hier -filter \"is_level_shifter==true\"",
    description: "Queries all multi-voltage and power-gating interface cells instantiated to satisfy IEEE 1801 (UPF) rules.",
    exampleScript: `# Check level shifter placement compliance
set ls_cells [get_db insts -if {.is_level_shifter == true}]
puts "Found [llength $ls_cells] level shifters in design."`,
    relatedLink: { title: "Cadence Voltus Power Studio", href: "/vlsi/power-studio" },
  },

  // 8. CLOCK GATING (ICG) CELLS
  {
    id: "get_icg",
    title: "Get / Query Integrated Clock Gating (ICG) Cells",
    category: "power",
    keywords: ["icg", "clock gating", "integrated clock gating", "clock gate", "get icg"],
    cadenceStylus: "get_db insts -if {.is_clock_gating == true}\n# or by lib cell name pattern:\nget_db [get_db insts] -if {.cell.name == *ICG* || .cell.name == *CGL*}",
    cadenceLegacy: "get_cells -hier -filter \"is_integrated_clock_gating==true\"",
    synopsys: "get_cells -hier -filter \"is_integrated_clock_gating==true\"",
    openRoad: "get_cells -hier -filter \"is_clock_gating==true\"",
    description: "Finds all clock gating latch-AND logic elements inserted during synthesis to reduce dynamic clock tree power.",
    exampleScript: `# List all ICGs and their enable net drivers
set icg_list [get_db insts -if {.is_clock_gating == true}]
foreach icg $icg_list {
  puts "ICG: [get_db $icg .name] | Cell: [get_db $icg .cell.name]"
}`,
    relatedLink: { title: "VLSI Calculator #14: ICG Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
  },

  // 9. TIMING REPORTS & SLACK QUERIES
  {
    id: "report_timing",
    title: "Report Timing Paths & Setup/Hold Violations",
    category: "timing",
    keywords: ["report_timing", "setup report", "hold report", "worst slack", "wns", "tns", "timing violations", "report timing"],
    cadenceStylus: "# Setup (Late) timing:\nreport_timing -late -max_paths 50 -slack_lesser_than 0.0\n# Hold (Early) timing:\nreport_timing -early -max_paths 50 -slack_lesser_than 0.0\n# Query timing path handles:\nset bad_paths [get_db timing_paths -max_slack 0.0]",
    cadenceLegacy: "report_timing -late -max_paths 50\nreport_timing -early -max_paths 50",
    synopsys: "# Setup (Max) timing:\nreport_timing -delay_type max -max_paths 50 -slack_lesser_than 0.0\n# Hold (Min) timing:\nreport_timing -delay_type min -max_paths 50 -slack_lesser_than 0.0",
    openRoad: "report_checks -path_delay max -format full_clock_expanded\nreport_checks -path_delay min",
    description: "Generates static timing analysis path breakdowns detailing launch clock, datapath delays, capture clock, and slack.",
    exampleScript: `# In Cadence Tempus / Innovus:
update_timing -full
report_timing -late -max_paths 20 -nworst 1 > setup_wns.rpt
report_timing -early -max_paths 20 -nworst 1 > hold_wns.rpt`,
    relatedLink: { title: "STA Timing Studio", href: "/vlsi/timing-studio" },
  },

  // 10. SETTING DON'T TOUCH (PRESERVE INSTANCES / NETS)
  {
    id: "set_dont_touch",
    title: "Set Don't Touch on Instances, Cells, or Nets",
    category: "eco",
    keywords: ["dont_touch", "don't touch", "dont touch", "preserve cell", "preserve net", "freeze net"],
    cadenceStylus: "set_db [get_db insts $inst_name] .is_dont_touch true\nset_db [get_db nets $net_name] .is_dont_touch true\n# On a library cell:\nset_db [get_db lib_cells $cell_name] .dont_use true",
    cadenceLegacy: "set_dont_touch [get_cells $inst_name] true\nset_dont_touch [get_nets $net_name] true",
    synopsys: "set_dont_touch [get_cells $inst_name] true\nset_dont_touch [get_nets $net_name] true",
    openRoad: "set_dont_touch [get_cells $inst_name]",
    description: "Protects critical physical cells, synchronizers, or clock branches from being deleted, sized, or moved during optimization.",
    exampleScript: `# Protect all CDC 2-FF synchronizer flops
set sync_flops [get_db insts *sync_reg*]
set_db $sync_flops .is_dont_touch true`,
    relatedLink: { title: "Innovus PnR Practical Lab", href: "/vlsi/learn/c/cadence-pnr/innovus-practical-lab" },
  },

  // 11. MACRO PLACEMENT & HALO CREATION
  {
    id: "macro_placement_halo",
    title: "Macro Placement, Orientation & Halo Sizing Commands",
    category: "floorplan",
    keywords: ["halo", "macro halo", "place halo", "route halo", "orient", "macro location", "placement halo"],
    cadenceStylus: "# Place halo:\ncreate_place_halo -halo_deltas {25 25 25 25} -insts [get_db insts -if {.is_macro == true}]\n# Route halo:\ncreate_route_halo -bottom_layer M1 -top_layer M4 -space 15 -insts [get_db insts -if {.is_macro == true}]\n# Set location & orientation:\nset_db [get_db insts u_mem/sram_inst] .location {150.0 200.0}\nset_db [get_db insts u_mem/sram_inst] .orient R180",
    cadenceLegacy: "addHaloToBlock 25 25 25 25 u_mem/sram_inst\ndbSet [dbGet -p top.insts.name u_mem/sram_inst].pt {150 200}",
    synopsys: "create_keepout_margin -type hard -outer {25 25 25 25} [get_cells -hier -filter \"is_hard_macro==true\"]\nset_attribute [get_cells u_mem/sram_inst] origin {150.0 200.0}\nset_attribute [get_cells u_mem/sram_inst] orientation R180",
    openRoad: "add_macro_placement -macro u_mem/sram_inst -location 150 200 -orientation R0\nadd_macro_halo -macro u_mem/sram_inst -halo 25 25 25 25",
    description: "Commands to position hard macros, set rotational orientations (R0/R90/R180/R270/MX/MY), and reserve clearance halos.",
    exampleScript: `# Apply 20um placement halo to all macros in Innovus
create_place_halo -halo_deltas {20 20 20 20} -insts [get_db insts -if {.is_macro == true}]`,
    relatedLink: { title: "VLSI Calculator #3: Macro Halo Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
  },

  // 12. POWER DISTRIBUTION NETWORK (PDN) RINGS & STRIPES
  {
    id: "pdn_commands",
    title: "Power Rings, Stripes & Standard Cell Rail (PDN) Generation",
    category: "pdn",
    keywords: ["power ring", "power stripes", "stripes", "rings", "sroute", "pdn", "add_rings", "add_stripes", "pg grid"],
    cadenceStylus: "# Core Rings:\nadd_rings -nets {VDD VSS} -type core_rings -layer {top M8 bottom M8 left M7 right M7} -width 4.0 -spacing 1.0\n# Power Stripes:\nadd_stripes -nets {VDD VSS} -layer M6 -direction vertical -width 2.0 -spacing 1.0 -set_to_set_distance 20.0\n# Special Route to Follow Pins:\nsroute -connect {core_pin pad_pin} -nets {VDD VSS}",
    cadenceLegacy: "addRing -nets {VDD VSS} -type core_rings -layer {top M8 bottom M8 left M7 right M7} -width 4 -spacing 1\naddStripe -nets {VDD VSS} -layer M6 -direction vertical -width 2 -spacing 1 -set_to_set_distance 20\nsroute -connect {corePin padPin} -nets {VDD VSS}",
    synopsys: "create_pg_ring_pattern ring_pat -horizontal_layer M8 -horizontal_width 4 -vertical_layer M7 -vertical_width 4\ncreate_pg_mesh_pattern mesh_pat -layers {{{vertical_layer: M6} {width: 2} {spacing: 1} {pitch: 20}}}\ncompile_pg",
    openRoad: "define_pdn_grid -name core_grid -voltage_domains {VDD}\nadd_pdn_stripe -grid core_grid -layer met4 -width 1.6 -pitch 20.0 -offset 2.0\nadd_pdn_ring -grid core_grid -layers {met4 met5} -widths 4.0 -spacings 1.0\npdn_gen",
    description: "Creates power rings, vertical/horizontal mesh stripes, and connects standard cell VDD/VSS rails.",
    exampleScript: `# Innovus PDN script:
add_rings -nets {VDD VSS} -type core_rings -layer {top M8 bottom M8 left M7 right M7} -width 5.0 -spacing 1.5
add_stripes -nets {VDD VSS} -layer M6 -direction vertical -width 2.5 -spacing 1.2 -set_to_set_distance 25.0
sroute -connect {core_pin} -nets {VDD VSS}`,
    relatedLink: { title: "VLSI Calculator #7: Power Stripe Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
  },

  // 13. CLOCK TREE SYNTHESIS (CTS)
  {
    id: "cts_commands",
    title: "Clock Tree Synthesis (CTS) & Clock Optimization",
    category: "cts",
    keywords: ["cts", "clock tree", "clock_opt_design", "ccopt_design", "synthesize clock", "build clock tree"],
    cadenceStylus: "# Modern Stylus PODV2 Flow:\ncreate_clock_tree_spec\nclock_opt_design -expanded_views\n# Tree construction only (no datapath opt):\nclock_opt_design -cts",
    cadenceLegacy: "ccopt_design -cts ; ccopt_design",
    synopsys: "synthesize_clock_trees\n# or unified clock optimization:\nclock_opt",
    openRoad: "clock_tree_synthesis -root_clks {clk} -buf_list {CLKBUF_X1 CLKBUF_X2 CLKBUF_X4 CLKBUF_X8}",
    description: "Synthesizes low-skew, balanced clock distribution trees and optimizes datapath logic concurrently.",
    exampleScript: `# Innovus Stylus CTS Flow:
set_db cts_buffer_cells {CLKBUF_X2 CLKBUF_X4 CLKBUF_X8}
set_db cts_inverter_cells {CLKINV_X2 CLKINV_X4 CLKINV_X8}
create_clock_tree_spec
clock_opt_design -expanded_views -timing_debug_report`,
    relatedLink: { title: "VLSI Calculator #11: Elmore Delay Sizer", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" },
  },

  // 14. ECO BUFFER INSERTION & CELL SIZING
  {
    id: "eco_commands",
    title: "ECO Commands: Insert Repeater, Resize Cell, Delete Buffer",
    category: "eco",
    keywords: ["eco", "insert buffer", "add repeater", "resize cell", "size cell", "swap vt", "eco_add_repeater", "eco_change_cell"],
    cadenceStylus: "# Insert buffer on net:\neco_add_repeater -net [get_db nets u_core/long_net] -cell BUF_X8 -location {150.0 200.0}\n# Resize / Swap Vt of cell:\neco_change_cell -insts [get_db insts u_core/crit_gate] -lib_cell NAND2_X4_LVT\n# Re-route ECO nets:\neco_route",
    cadenceLegacy: "ecoAddRepeater -net u_core/long_net -cell BUF_X8 -loc {150 200}\necoChangeCell -inst u_core/crit_gate -cell NAND2_X4_LVT\necoRoute",
    synopsys: "insert_buffer [get_nets u_core/long_net] BUF_X8\nsize_cell [get_cells u_core/crit_gate] NAND2_X4_LVT",
    openRoad: "insert_buffer -net u_core/long_net -cell BUF_X8\nsize_cell -inst u_core/crit_gate -cell NAND2_X4_LVT",
    description: "Surgical Engineering Change Order (ECO) commands for timing closure without disturbing existing layout routing.",
    exampleScript: `# Hold buffer insertion on failing timing endpoints in Tempus:
eco_add_repeater -net [get_db [get_db timing_paths -min_slack 0.0 -check_type hold].endpoint.net] -cell DLY4_X2
eco_route
update_timing -full`,
    relatedLink: { title: "Tempus STA Timing Closure", href: "/vlsi/learn/c/cadence-sta/tempus-setup-hold-closure" },
  },

  // 15. SDC TIMING CONSTRAINTS
  {
    id: "sdc_constraints",
    title: "SDC Constraints: Clocks, Generated Clocks, Delays, Clock Groups",
    category: "timing",
    keywords: ["sdc", "create_clock", "create_generated_clock", "set_clock_groups", "set_false_path", "set_multicycle_path", "set_input_delay", "set_output_delay", "set_case_analysis"],
    cadenceStylus: `# 1. Define Master Clock (500 MHz / 2.0ns period):
create_clock -name clk_main -period 2.000 [get_ports clk_in]

# 2. Define Generated Divide-by-2 Clock:
create_generated_clock -name clk_div2 -source [get_ports clk_in] -divide_by 2 [get_pins u_div/clk_out]

# 3. Asynchronous Clock Domain Isolation:
set_clock_groups -asynchronous -group {clk_main} -group {clk_div2}

# 4. Multi-Cycle Path (2-cycle setup, 1-cycle hold):
set_multicycle_path 2 -setup -from [get_pins u_src/CLK] -to [get_pins u_dst/D]
set_multicycle_path 1 -hold  -from [get_pins u_src/CLK] -to [get_pins u_dst/D]

# 5. I/O Delays:
set_input_delay  -clock clk_main -max 0.400 [get_ports data_in*]
set_output_delay -clock clk_main -max 0.350 [get_ports data_out*]`,
    synopsys: `create_clock -name clk_main -period 2.0 [get_ports clk_in]
create_generated_clock -name clk_div2 -source [get_ports clk_in] -divide_by 2 [get_pins u_div/clk_out]
set_clock_groups -asynchronous -group {clk_main} -group {clk_div2}
set_multicycle_path 2 -setup -from [get_pins u_src/CLK] -to [get_pins u_dst/D]
set_multicycle_path 1 -hold  -from [get_pins u_src/CLK] -to [get_pins u_dst/D]`,
    openRoad: `create_clock -name clk_main -period 2.0 [get_ports clk_in]
set_input_delay -clock clk_main -max 0.4 [get_ports data_in*]`,
    description: "Industry-standard Synopsys Design Constraints (SDC) for timing assertion, clocking, and exception definition.",
    exampleScript: `# Universal SDC Header Template:
current_design soc_top
create_clock -name sys_clk -period 1.000 [get_ports sys_clk]
set_clock_uncertainty -setup 0.050 [all_clocks]
set_clock_uncertainty -hold  0.020 [all_clocks]`,
    relatedLink: { title: "SDC Constraints Studio", href: "/vlsi/sdc-studio" },
  },

  // 16. FORMAL EQUIVALENCE (CONFORMAL LEC)
  {
    id: "conformal_lec_commands",
    title: "Cadence Conformal Logic Equivalence Checking (LEC) Commands",
    category: "lec",
    keywords: ["lec", "conformal", "equivalence", "golden", "revised", "compare points", "dofile", "formal verification"],
    cadenceStylus: `# 1. Read Golden RTL / Netlist:
read_design -golden -verilog rtl.v -top soc_top

# 2. Read Revised Netlist (Post-PnR):
read_design -revised -verilog post_pnr.v -top soc_top

# 3. Add compare points & compare:
set_system_mode lec
add_compared_points -all
compare
report_verification
# Generate ECO script if non-equivalent:
write_eco_script -replace eco_patch.tcl`,
    synopsys: `# Synopsys Formality:
read_verilog -r rtl.v -container golden
read_verilog -r post_pnr.v -container revised
set_top golden:/WORK/soc_top
match
verify`,
    description: "Formally proves logical equivalence between Golden RTL and synthesized/routed netlists.",
    exampleScript: `# Cadence Conformal Standard Dofile:
set_log_file conformal.log -replace
read_design -golden -verilog [glob rtl/*.v] -top soc_top
read_design -revised -verilog mapped.v -top soc_top
set_system_mode lec
add_compared_points -all
compare
report_verification`,
    relatedLink: { title: "Cadence Conformal Practical Lab", href: "/vlsi/learn/c/cadence-lec/conformal-practical-lab" },
  },

  // 17. PHYSICAL VERIFICATION (DRC / LVS / ANTENNA)
  {
    id: "physical_verif_commands",
    title: "Physical Verification Commands: DRC, LVS, Connectivity, Antenna",
    category: "drc",
    keywords: ["verify_drc", "verify_connectivity", "antenna check", "drc check", "lvs check", "pegasus", "calibre", "drc command"],
    cadenceStylus: "# In Innovus Stylus:\nverify_drc -report drc.rpt -limit 1000\nverify_connectivity -type all -report conn.rpt\nverify_process_antenna -report antenna.rpt\nverify_metal_density -report density.rpt",
    cadenceLegacy: "verifyGeometry -report drc.rpt\nverifyConnectivity -type all -report conn.rpt\nverifyProcessAntenna -report antenna.rpt",
    synopsys: "check_lvs -max_errors 100\ncheck_pg_drc\ncheck_routes",
    openRoad: "check_antennas\ncheck_placement",
    description: "In-tool signoff checks for design rule errors (shorts, spacing), open connections, and antenna violations.",
    exampleScript: `# Full physical signoff verification in Innovus:
verify_connectivity -type all -error 1000 -report reports/connectivity.rpt
verify_drc -limit 1000 -report reports/drc.rpt
verify_process_antenna -report reports/antenna.rpt`,
    relatedLink: { title: "Innovus Physical Verification & DFM", href: "/vlsi/learn/c/cadence-pnr/innovus-physical-verification-dfm" },
  },

  // 18. CADENCE GENUS SYNTHESIS FLOW
  {
    id: "genus_synthesis_flow",
    title: "Cadence Genus Synthesis Optimization Flow (syn_generic, syn_map, syn_opt & check_design)",
    category: "timing",
    keywords: ["genus", "syn_generic", "syn_map", "syn_opt", "check_design", "synthesis", "genus stylus", "report_qor", "path_group", "define_cost_group"],
    cadenceStylus: `# 1. Setup Design Environment:
set_db init_ground_nets VSS
set_db init_power_nets VDD
read_mmmc mmmc.tcl
read_hdl -language sv [glob rtl/*.sv]
elaborate soc_top

# 2. Design Lint & Pre-Synthesis Audit:
check_design -unresolved
init_design

# 3. Path Grouping & Cost Weights:
define_cost_group -name in2out
path_group -from [all_inputs] -to [all_outputs] -group in2out
set_db [get_db cost_groups in2out] .weight 1.0

# 4. Three Layers of Synthesis Optimization:
syn_generic
syn_map
syn_opt

# 5. Timing & QoR Reports:
report_qor
report_timing -max_paths 10
check_timing_intent
write_hdl > outputs/genus_mapped.v
write_sdc > outputs/genus_mapped.sdc`,
    synopsys: `# Synopsys Design Compiler Ultra Flow:
analyze -format sverilog [glob rtl/*.sv]
elaborate soc_top
check_design
compile_ultra -retime -gate_clock
report_qor
report_timing -max_paths 10`,
    openRoad: `# OpenROAD / Yosys Synthesis:
yosys -import
synth -top soc_top
dfflibmap -liberty sky130.lib
abc -liberty sky130.lib`,
    description: "Production Cadence Genus Stylus Common UI RTL synthesis flow from elaboration through syn_generic, syn_map, and syn_opt timing optimization.",
    exampleScript: `# Full Cadence Genus Stylus Synthesis Run Script:
set_db information_level 7
read_mmmc scripts/genus_mmmc.tcl
read_hdl -language sv rtl/soc_top.sv
elaborate soc_top
check_design -all > reports/check_design.rpt
init_design
syn_generic
syn_map
syn_opt
report_qor > reports/qor_summary.rpt
report_timing -max_paths 20 > reports/timing_wns.rpt`,
    relatedLink: { title: "SDC Constraints Studio", href: "/vlsi/sdc-studio" },
  },

  // 19. CADENCE JASPERGOLD & GENUS CDC SIGNOFF
  {
    id: "jaspergold_cdc_signoff",
    title: "Cadence JasperGold & Genus CDC Signoff Rules & Verification",
    category: "timing",
    keywords: ["cdc", "jaspergold", "check_cdc", "metastability", "clock domain crossing", "set_clock_groups", "reconvergence", "mtbf", "async fifo"],
    cadenceStylus: `# 1. SDC Asynchronous Domain Isolation in Genus / Tempus:
set_clock_groups -name ASYNC_DOMAINS -asynchronous \\
  -group [get_clocks clk_core] \\
  -group [get_clocks clk_pci]

# 2. Audit Cross-Domain Paths (Ensure zero unverified crossings):
report_timing -from [get_clocks clk_core] -to [get_clocks clk_pci]
check_timing -lint

# 3. Cadence JasperGold CDC Formal Verification:
check_cdc -init
check_cdc -clock [get_clocks clk_core] -domain DOM_CORE
check_cdc -clock [get_clocks clk_pci]  -domain DOM_PCI
check_cdc -rule {CDC_Sync_2FF CDC_Reconvergence CDC_Reset_Sync}
check_cdc -run
report_cdc -status -violations`,
    synopsys: `# Synopsys SpyGlass CDC:
set_option top soc_top
current_goal cdc/cdc_verify_struct -top soc_top
run_goal`,
    description: "Configures asynchronous clock domain isolation in SDC constraints and executes formal CDC structural signoff checking in Cadence JasperGold.",
    exampleScript: `# Cadence CDC SDC & Verification Template:
create_clock -name clk_fast -period 2.000 [get_ports clk_fast]
create_clock -name clk_slow -period 10.000 [get_ports clk_slow]
set_clock_groups -name ASYNC_FAST_SLOW -asynchronous \\
  -group [get_clocks clk_fast] \\
  -group [get_clocks clk_slow]
report_timing -from [get_clocks clk_fast] -to [get_clocks clk_slow]`,
    relatedLink: { title: "VLSI Learn Hub: CDC Track", href: "/vlsi/learn/c/cdc" },
  },

  // 20. CADENCE GENUS ACTIVITY & POWER ANALYSIS (SAIF / VCD / REPORT_POWER)
  {
    id: "genus_power_analysis",
    title: "Cadence Genus Dynamic & Leakage Power Analysis (read_saif, read_vcd & report_power)",
    category: "power",
    keywords: ["power", "saif", "vcd", "report_power", "read_saif", "read_vcd", "set_activity", "clock gating", "switching power", "leakage power", "scale_to_sdc_frequency"],
    cadenceStylus: `# 1. Ingest Simulation Switching Activity:
read_saif -instance tb_soc_top/u_chip/u_core \\
  -scale_to_sdc_frequency \\
  -verbose sim/workload.saif

# Or Ingest Windowed VCD for Peak Power:
# read_vcd -static -hinst u_chip -start_time 10000ps -end_time 50000ps sim/dump.vcd

# 2. Clock Gating Thresholds:
set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 4
set_db lp_clock_gating_max_flops 64

# 3. Optimize Power during Mapping:
set_db design_power_effort high
set_db opt_power_effort high
set_db opt_leakage_to_dynamic_ratio 0.8
syn_opt -power

# 4. Multi-Dimensional Power Reports:
report_power -by_category -unit mW -header > reports/power_category.rpt
report_power -skip_port_switching_power -by_category -unit mW > reports/power_core.rpt
report_power -by_hierarchy -levels 2 -unit mW > reports/power_hierarchy.rpt
report_clock_gates -include_activity_info > reports/clock_gates.rpt`,
    synopsys: `# Synopsys PrimePower Flow:
read_saif -strip_path tb_soc_top/u_chip/u_core -input sim/workload.saif
report_power -hierarchy -levels 2
report_clock_gating -gated`,
    openRoad: `# OpenROAD / Yosys Power Estimation:
report_power -corner tt_025C_1v80`,
    description: "Production Cadence Genus Stylus Common UI switching activity ingestion, clock gating optimization, and multi-dimensional power reporting.",
    exampleScript: `# Full Cadence Genus Power Analysis Script:
read_saif -instance tb_top/dut -scale_to_sdc_frequency sim/activity.saif
report_power -by_category -unit mW
report_power -skip_port_switching_power -by_category -unit mW
report_clock_gates -include_activity_info`,
    relatedLink: { title: "VLSI Power Studio", href: "/vlsi/power-studio" },
  },

  // 21. CADENCE COMMON UI (CUI) DATABASE ARCHITECTURE (get_db / set_db)
  {
    id: "genus_cui_database_mastery",
    title: "Cadence Common UI (CUI) Database Navigation & Attribute Mastery (get_db & set_db)",
    category: "query",
    keywords: ["get_db", "set_db", "common ui", "cui", "stylus", "llength", "base_cell", "dont_use", "preserve", "filtering"],
    cadenceStylus: `# 1. Object Queries & Counting (llength, NOT -count):
set total_insts [llength [get_db insts *]]
set total_seq   [llength [get_db insts -if {.is_sequential == true}]]
set total_ports [llength [get_db ports *]]

# 2. Relationship Navigation (Pins -> Inst -> Base Cell):
set clock_leaf_cells [get_db [get_db pins *clk*] .inst.base_cell.name -unique]
set high_fanout_nets [get_db nets -if {.num_loads > 32}]

# 3. Setting Attributes & Flags:
set_db remove_assigns true
set_db lp_insert_clock_gating true
set_db [get_db lib_cells *DFF*] .dont_use false
set_db [get_db insts u_analog_top*] .preserve true

# 4. SDC Clock Queries:
get_db [get_db clocks *] .period
get_db [get_db clocks *] .waveform`,
    synopsys: `# Synopsys get_attribute / sizeof_collection:
sizeof_collection [all_registers]
get_attribute [get_cells u_core] ref_name`,
    openRoad: `# OpenROAD / OpenSTA Database Queries:
sta::get_cells *`,
    description: "Production Cadence Stylus Common UI (CUI) object queries, relationship traversal, and design attribute manipulation.",
    exampleScript: `# Cadence CUI Database Inspection Script:
puts "Total Sequential Registers: [llength [get_db insts -if {.is_sequential == true}]]"
puts "High Fanout Nets (>40): [llength [get_db nets -if {.num_loads > 40}]]"
get_db [get_db clocks *] .period`,
    relatedLink: { title: "SDC Constraints Studio", href: "/vlsi/sdc-studio" },
  },

  // 22. CADENCE GENUS CHECK_DESIGN & NETLIST SANITIZATION
  {
    id: "genus_check_design_signoff",
    title: "Cadence Genus check_design 14-Flag Structural Audit & Netlist Sanitization",
    category: "drc",
    keywords: ["check_design", "remove_assigns", "add_tieoffs", "unresolved", "multiple_driver", "combo_loops", "undriven", "constant", "delete_unloaded_undriven"],
    cadenceStylus: `# 1. Comprehensive Netlist Structural Sanity Audit:
check_design -all > reports/check_design_all.rpt
check_design -unresolved
check_design -multiple_driver
check_design -combo_loops
check_design -undriven
check_design -assigns

# 2. Continuous Assign Removal (Replaces symbolic wire aliases with buffers):
set_db remove_assigns true
remove_assigns_without_opt -design soc_top -verbose

# 3. Constant Tieoff Cell Insertion (Prevents gate oxide breakdown):
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 -verbose soc_top

# 4. Clean Unloaded/Undriven Floating Ports:
delete_unloaded_undriven -all soc_top

# 5. Production Signoff Validation:
check_design -status
check_design -through_tie_cell`,
    synopsys: `# Synopsys Design Compiler Structural Audit:
check_design
remove_assigns -replace_with_subdesign`,
    openRoad: `# OpenROAD / Yosys Design Check:
yosys check -assert`,
    description: "Production Cadence Genus structural hygiene checking, assign-to-buffer replacement, and constant tie-off cell insertion.",
    exampleScript: `# Full Structural Sanity & Sanitization Script:
check_design -unresolved
check_design -multiple_driver
remove_assigns_without_opt -design soc_top
add_tieoffs -high TIEHI -low TIELO -max_fanout 8 soc_top
check_design -status`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 23. CADENCE GENUS DFT & SCAN SYNTHESIS FLOW
  {
    id: "genus_dft_scan_flow",
    title: "Cadence Genus DFT Scan Synthesis Flow (check_dft_rules, convert_to_scan & write_scandef)",
    category: "dft",
    keywords: ["dft", "scan", "check_dft_rules", "convert_to_scan", "define_scan_chain", "connect_scan_chains", "compress_scan_chains", "scandef", "lockup latch", "tdrc"],
    cadenceStylus: `# 1. Setup Test Clocks & Pre-Scan Rules Check (TDRC):
define_test_clock -name TCK -period 50000 [get_ports pad_test_clk]
set_compatible_test_clocks -all
check_dft_setup
check_dft_rules -advanced -verbose > reports/tdrc_rules.rpt

# 2. Fix Asynchronous Reset Controllability Violations:
set_db dft_controllable_async_resets true
fix_dft_violations -type async_reset -design soc_top

# 3. Convert Functional Registers to Scan-DFFs:
convert_to_scan -design soc_top

# 4. Define Scan Chains with Terminal Lockup Latches:
define_scan_chain -name CHAIN_0 \\
  -sdi [get_ports pad_scan_in_0] \\
  -sdo [get_ports pad_scan_out_0] \\
  -shift_enable [get_ports pad_scan_en] \\
  -terminal_lockup true \\
  -max_length 500

# 5. Connect Scan Chains & Optional Compression:
connect_scan_chains -auto_create_chains -pack -design soc_top
# compress_scan_chains -ratio 50 -external_scan_chains 8 -design soc_top

# 6. Export Downstream P&R & ATPG Deliverables:
report_scan_chains > reports/scan_chains.rpt
write_scandef > handoff/pnr/soc_top.scandef
write_dft_atpg -directory handoff/atpg/ -base_name soc_top_atpg
write_dft_constraints -mode scan > handoff/sdc/soc_top_scan.sdc`,
    synopsys: `# Synopsys DFT Compiler Flow:
set_dft_signal -view spec -type ScanEnable -port scan_en
create_test_protocol
dft_opt`,
    openRoad: `# OpenROAD Scan Insertion (TritonRoute / Fault):
# OpenROAD relies on pre-stitched Verilog scan chains`,
    description: "Production Cadence Genus Test Design Rule Checking (TDRC), Muxed-D scan conversion, lockup latch insertion, and physical ScanDEF export.",
    exampleScript: `# Complete Cadence Genus DFT Script:
define_test_clock -name TCK -period 50000 [get_ports test_clk]
check_dft_rules -verbose
convert_to_scan -design soc_top
connect_scan_chains -auto_create_chains -pack
write_scandef > outputs/soc_top.scandef`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 24. CADENCE GENUS ECO, INCREMENTAL OPTIMIZATION & ADVANCED EXCEPTIONS
  {
    id: "genus_eco_exceptions_flow",
    title: "Cadence Genus ECO, Incremental Optimization & Advanced Timing Exceptions Flow",
    category: "eco",
    keywords: [
      "eco",
      "incremental",
      "spatial",
      "preserve",
      "multicycle",
      "false path",
      "case analysis",
      "path adjust",
      "derate",
      "dont_touch",
      "write_preserves",
      "syn_opt",
    ],
    cadenceStylus: `# 1. Netlist Freeze & Protection Controls:
set_db [get_db insts *sync*reg*] .preserve true
set_dont_touch [get_db modules ddr_phy_top]
set_db [get_db lib_cells */HOLD_DELAY_X1] .dont_use true
check_design -preserved
write_preserves > handoff/soc_preserves.tcl

# 2. Incremental & Spatial (Physical-Aware) Optimization:
read_def floorplan/soc_top_placed.def
syn_opt -spatial
syn_opt -incremental

# 3. Multicycle Paths (Setup N requires Hold N-1):
set_multicycle_path 2 -setup -from [get_cells u_pipe*] -to [get_cells u_accum*]
set_multicycle_path 1 -hold  -from [get_cells u_pipe*] -to [get_cells u_accum*]

# 4. Asynchronous Domains & Bounded Quasi-Static Buses:
set_clock_groups -asynchronous -group [get_clocks clk_tx] -group [get_clocks clk_rx]
set_max_delay 2.5 -ignore_clock_latency -from [get_cells u_cfg/reg*] -to [get_cells u_core/*]

# 5. Operational Modes & Timing Derates:
set_case_analysis 0 [get_ports test_mode]
set_timing_derate -early 0.95 -clock [get_clocks *]
set_timing_derate -late  1.05 -data  [get_cells *]

# 6. Auditing & Debugging Timing Exceptions:
report_timing -exception_data -max_paths 10 > reports/exception_data.rpt
report_timing -path_exceptions ignored > reports/ignored_exceptions.rpt
check_timing -verbose > reports/check_timing.rpt`,
    synopsys: `# Synopsys DC / PrimeTime Equivalent:
set_dont_touch [get_cells -hier *sync_reg*]
compile_ultra -incremental
set_multicycle_path 2 -setup -from [get_cells u_pipe*] -to [get_cells u_accum*]
set_multicycle_path 1 -hold  -from [get_cells u_pipe*] -to [get_cells u_accum*]
set_clock_groups -asynchronous -group [get_clocks clk_tx] -group [get_clocks clk_rx]
report_exceptions -ignored`,
    openRoad: `# OpenROAD / OpenSTA Exceptions:
set_multicycle_path 2 -setup -from [get_pins u_pipe*/Q] -to [get_pins u_accum*/D]
set_multicycle_path 1 -hold  -from [get_pins u_pipe*/Q] -to [get_pins u_accum*/D]`,
    description: "Production Cadence Genus ECO freeze controls (.preserve true), syn_opt -incremental, multicycle path setup/hold pairing, case analysis, and exception auditing.",
    exampleScript: `# Full Cadence ECO & Exception Audit Script:
set_db [get_db insts *sync*reg*] .preserve true
set_multicycle_path 2 -setup -from [get_cells u_pipe*] -to [get_cells u_accum*]
set_multicycle_path 1 -hold  -from [get_cells u_pipe*] -to [get_cells u_accum*]
syn_opt -incremental
report_timing -exception_data -max_paths 5
check_timing -verbose`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 25. CADENCE GENUS HIERARCHICAL SYNTHESIS FLOW
  {
    id: "genus_hierarchical_synthesis_flow",
    title: "Cadence Genus Hierarchical Synthesis Flow (ILM, write_db, uniquify & Assembly)",
    category: "hierarchical",
    keywords: [
      "hierarchical",
      "ilm",
      "generate_ilm",
      "read_ilm",
      "uniquify",
      "ungroup",
      "write_db",
      "read_db",
      "bottom-up",
      "top-down",
      "boundary_optimize",
      "report_hierarchy",
    ],
    cadenceStylus: `# 1. Block-Level Synthesis & Model Export (Bottom-Up):
elaborate crypto_core
read_sdc constraints/crypto_core.sdc
syn_generic
syn_map
syn_opt
write_hdl > outputs/crypto_core.v
write_sdc > outputs/crypto_core.sdc
write_db -design crypto_core outputs/crypto_core.db
generate_ilm -directory outputs/ilm/crypto_core -include_physical

# 2. Top-Level Assembly & ILM Ingestion:
read_hdl -sv rtl/top/soc_glue.sv
read_ilm -directory outputs/ilm/crypto_core
read_ilm -directory outputs/ilm/dma_engine
elaborate soc_top
read_sdc constraints/soc_top.sdc
check_design -unresolved

# 3. Hierarchy Surgery & Boundary Control:
uniquify -design soc_top
set_db [get_db hinsts u_analog_wrap*] .boundary_optimize false
set_db [get_db hinsts u_ip_core*] .preserve true
ungroup [get_db hinsts u_core/u_alu/u_adder]
report_hierarchy -depth 3 > reports/hierarchy.rpt

# 4. Top-Level Optimization & Interface Signoff:
syn_opt
report_timing -from [get_cells u_crypto_core/*] -to [get_cells u_dma_engine/*] -max_paths 20`,
    synopsys: `# Synopsys DC Hierarchical Flow:
uniquify
ungroup -start_level 2
create_ilm -design crypto_core`,
    openRoad: `# OpenROAD Hierarchical Assembly:
# Assemble pre-hardened macros / LEF/DEF`,
    description: "Production Cadence Genus bottom-up hierarchical compilation, Interface Logic Model (ILM) generation, write_db checkpointing, uniquify, and selective ungrouping.",
    exampleScript: `# Full Hierarchical Block Assembly Script:
read_ilm -directory outputs/ilm/crypto_core
elaborate soc_top
check_design -unresolved
uniquify -design soc_top
syn_opt
report_timing -max_paths 10`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 26. CADENCE GENUS MACROS, SRAM COMPILERS & MULTIBIT (MBFF) FLOW
  {
    id: "genus_macros_memories_multibit_flow",
    title: "Cadence Genus Macros, SRAM Compilers & Multibit (MBFF) Optimization Flow",
    category: "macro",
    keywords: [
      "macro",
      "sram",
      "memory",
      "multibit",
      "mbff",
      "merge_to_multibit_cells",
      "lib_lef_consistency",
      "dont_use",
      "datapath",
      "csa",
      "retime",
      "report_dp",
    ],
    cadenceStylus: `# 1. Integrate Memory & Macro Libraries across MMMC views:
set_db library [list $STD_LIBS $SRAM_LIBS $MACRO_LIBS]
check_design -unresolved
check_design -lib_lef_consistency

# 2. Production Library Cell Selection Policies (dont_use):
set_db [get_db lib_cells */*DLY*] .dont_use true
set_db [get_db lib_cells */*X0P5*] .dont_use true
set_db [get_db lib_cells */*ULVT*] .dont_use true

# 3. High-Effort Datapath Exploration (CSA Trees & Booth Recoding):
set_db dp_exploration high
syn_generic
report_dp > reports/datapath_csa_report.rpt

# 4. Multibit Flip-Flop Inferencing (25-35% Clock Power Reduction):
set_db [get_db insts *shift_reg*] .lp_insert_multibit false
set_db [get_db insts *sync_reg*] .lp_insert_multibit false
syn_map
merge_to_multibit_cells -design soc_top
identify_multibit_cell_abstract_scan_segments -design soc_top
report_multibit_inferencing > reports/mbff_summary.rpt

# 5. Sequential Register Retiming & Macro Preservation:
set_db [get_db insts u_sram_bank/*] .preserve true
syn_opt -retiming
write_retiming_data -output outputs/retiming.log
report_timing -to [get_pins u_sram_bank/*/CLK] -max_paths 10`,
    synopsys: `# Synopsys DC Multi-Bit & Memory Flow:
identify_multibit
set_dont_use [get_lib_cells */HOLD*]
compile_ultra -retime`,
    openRoad: `# OpenROAD Macro & Multibit Flow:
# OpenROAD Macro Placement & DFF clustering`,
    description: "Production Cadence Genus SRAM compiler integration, lib-lef consistency audit, dont_use cell policies, datapath CSA trees, and multibit flop (MBFF) power reduction.",
    exampleScript: `# Complete Macro & Multibit Script:
check_design -lib_lef_consistency
set_db [get_db lib_cells */*DLY*] .dont_use true
merge_to_multibit_cells -design soc_top
identify_multibit_cell_abstract_scan_segments -design soc_top
report_multibit_inferencing
syn_opt -retiming`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 27. CADENCE GENUS MMMC SETUP & ACTIVATION FLOW
  {
    id: "genus_mmmc_setup_flow",
    title: "Cadence Genus MMMC Setup, Views Activation & Signoff Handoff Flow",
    category: "mmmc",
    keywords: [
      "mmmc",
      "analysis_view",
      "delay_corner",
      "constraint_mode",
      "library_set",
      "rc_corner",
      "timing_condition",
      "opcond",
      "set_analysis_view",
      "read_mmmc",
      "write_mmmc",
      "report_analysis_views",
    ],
    cadenceStylus: `# 1. Bottom-Up Object Construction:
create_library_set -name ls_slow -timing [list std_ss_0p72v.lib sram_ss_0p72v.lib]
create_library_set -name ls_fast -timing [list std_ff_0p88v.lib sram_ff_0p88v.lib]

create_opcond -name opc_slow -voltage 0.72 -temperature -40
create_opcond -name opc_fast -voltage 0.88 -temperature 125

create_rc_corner -name rc_worst -qrc_tech qrc_worst.tch -temperature -40 -pre_route_cap 1.05 -pre_route_res 1.05
create_rc_corner -name rc_best  -qrc_tech qrc_best.tch  -temperature 125 -pre_route_cap 0.95 -pre_route_res 0.95

create_timing_condition -name tc_slow -library_sets {ls_slow} -opcond opc_slow
create_timing_condition -name tc_fast -library_sets {ls_fast} -opcond opc_fast

create_delay_corner -name dc_slow -timing_condition tc_slow -rc_corner rc_worst
create_delay_corner -name dc_fast -timing_condition tc_fast -rc_corner rc_best

create_constraint_mode -name cm_func -sdc_files [list sdc/functional.sdc]
create_constraint_mode -name cm_scan -sdc_files [list sdc/scan.sdc]

create_analysis_view -name av_func_ss -constraint_mode cm_func -delay_corner dc_slow
create_analysis_view -name av_func_ff -constraint_mode cm_func -delay_corner dc_fast
create_analysis_view -name av_scan_ss -constraint_mode cm_scan -delay_corner dc_slow

# 2. Activate Multi-View Setup, Hold and Power Slots:
# (Primary setup view declared first establishes baseline synthesis library mapping!)
set_analysis_view \\
  -setup   [list av_func_ss av_scan_ss] \\
  -hold    [list av_func_ff] \\
  -leakage [list av_func_ff] \\
  -dynamic [list av_func_ss]

# 3. Audit Active Analysis Views & Per-View QoR:
report_analysis_views
report_qor -view av_func_ss
report_qor -view av_func_ff

# 4. Export Reproducible MMMC Package for Innovus PnR Handoff:
write_mmmc -dir handoff/mmmc -prefix soc_top_signoff -with_target_link`,
    synopsys: `# Synopsys PrimeTime / DC Scenario Equivalent:
create_scenario func_ss
set_operating_conditions -analysis_type on_chip_variation
create_scenario func_ff`,
    openRoad: `# OpenROAD / OpenSTA Multi-Corner Flow:
define_corners ss_corner ff_corner
read_liberty -corner ss_corner std_ss.lib
read_liberty -corner ff_corner std_ff.lib`,
    description: "Production Cadence Genus Multi-Mode Multi-Corner (MMMC) object model authoring, analysis views activation, per-view QoR reporting, and write_mmmc export.",
    exampleScript: `# Complete MMMC Script:
read_mmmc scripts/soc_top.mmmc.tcl
report_analysis_views
set_analysis_view -setup {av_func_ss} -hold {av_func_ff}
report_qor -view av_func_ss
write_mmmc -dir handoff/mmmc -prefix soc_top`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 28. CADENCE GENUS ISPATIAL PHYSICAL-AWARE SYNTHESIS FLOW
  {
    id: "genus_ispatial_physical_flow",
    title: "Cadence Genus iSpatial Physical-Aware Synthesis & Floorplan Optimization Flow",
    category: "floorplan",
    keywords: [
      "ispatial",
      "physical",
      "ple",
      "read_def",
      "syn_generic",
      "syn_map",
      "syn_opt",
      "spatial",
      "report_congestion",
      "report_utilization",
      "report_ple",
      "write_db",
    ],
    cadenceStylus: `# 1. Physical Setup & Floorplan DEF Ingestion:
read_lef tech.lef
read_lef stdcells.lef
read_lef macros.lef
set_db interconnect_mode ple
read_def floorplan/soc_top_placed_macros.def

# 2. iSpatial 3-Stage Concurrent Synthesis & Analytical Placement:
syn_generic -physical
syn_map -physical
syn_opt -spatial

# 3. Floorplan Congestion & Density Verification:
report_congestion > reports/global_congestion.rpt
report_utilization > reports/cell_utilization.rpt
report_ple > reports/ple_accuracy.rpt
check_placement > reports/placement_legality.rpt

# 4. Incremental Optimization on Post-Placement Feedback (if applicable):
# syn_opt -incremental

# 5. Export Unified Common UI Database for Innovus Handoff:
write_db -common -design soc_top handoff/soc_top_ispatial.db`,
    synopsys: `# Synopsys DC-Topographical / Fusion Compiler Flow:
set_routing_layers -max M8 -min M2
compile_ultra -spg
report_congestion`,
    openRoad: `# OpenROAD Physical Flow:
# global_placement & estimate_parasitics`,
    description: "Production Cadence Genus iSpatial physical-aware synthesis, DEF floorplan ingestion, G-cell congestion auditing, and unified write_db -common Innovus handoff.",
    exampleScript: `# Complete iSpatial Script:
set_db interconnect_mode ple
read_def floorplan.def
syn_generic -physical
syn_map -physical
syn_opt -spatial
report_congestion
write_db -common -design soc_top handoff/soc_top.db`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },

  // 29. ADVANCED FINFET FULL-CHIP PAD RING SYNTHESIS & I2O BUDGETING FLOW
  {
    id: "genus_pad_ring_chip_synthesis_flow",
    title: "Advanced FinFET Full-Chip Pad Ring Synthesis & I2O Path Budgeting Flow",
    category: "hierarchical",
    keywords: [
      "pad_top",
      "pad_ring",
      "finfet_padring",
      "io_pads",
      "define_cost_group",
      "path_group",
      "set_driving_cell",
      "set_load",
      "check_design",
      "check_timing",
      "i2o",
      "r2r",
    ],
    cadenceStylus: `# 1. Load Both Standard Cell and IO Liberty Timing Libraries:
set_db library [list \\
  pdk/stdcells_ss_0p72v_m40c.lib \\
  pdk/io_pads_ss_0p72v_1p62v.lib \\
]

# 2. Ingest Core RTL and Perimeter Pad Ring Wrapper:
read_hdl -sv [glob ../rtl/core/*.v]
read_hdl -sv ../rtl/pad_top.sv
elaborate pad_top

# 3. Structural Verification of Pad Instantiations:
puts "Total Pad Instances: [llength [get_db insts *u_pad*]]"
check_design -unresolved
check_design > reports/check_design_pad_top.rpt

# 4. SDC Hygiene: Define Electrical Boundaries and Active Constraint Mode:
set_interactive_constraint_modes [all_constraint_modes -active]
read_sdc ../sdc/pad_top_func.sdc
set_driving_cell -lib_cell BUFX4 [remove_from_collection [all_inputs] [get_ports {pad_clk pad_rst_n}]]
set_load 0.05 [all_outputs]
check_timing > reports/check_timing_pad_top.rpt

# 5. Isolate Path Cost Groups (Prevent I2O Pad Delays from Degrading Core R2R):
define_cost_group -name R2R -design pad_top
define_cost_group -name I2R -design pad_top
define_cost_group -name R2O -design pad_top
define_cost_group -name I2O -design pad_top

path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r
path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o

set_path_group_options R2R -effort_level high -weight 10
set_path_group_options I2O -effort_level low

# 6. Execute Synthesis Pipeline:
syn_generic
syn_map
syn_opt

# 7. Audit QoR Breakdown & Write Results:
report_qor > reports/pad_top_qor.rpt
report_timing -group R2R -max_paths 10 > reports/timing_r2r.rpt
report_timing -group I2O -max_paths 10 > reports/timing_i2o.rpt

write_hdl > ../outputs/pad_top_netlist.v
write_sdc > ../outputs/pad_top_func.sdc
write_db    ../database/pad_top_syn.db`,
    synopsys: `# Synopsys DC Pad Top Equivalent:
read_file -format verilog {core.v pad_top.v}
current_design pad_top
group_path -name R2R -from [all_registers] -to [all_registers]
group_path -name I2O -from [all_inputs] -to [all_outputs]`,
    openRoad: `# OpenROAD IO Placement Flow:
# place_pads -io_file pad_top.io`,
    description: "Production Advanced FinFET full-chip pad ring synthesis, IO Liberty linking, SDC electrical boundary hygiene, cost grouping for I2O vs R2R paths, and database handoff.",
    exampleScript: `# Complete Pad Ring Chip Script:
set_db library [list lib_ss.lib io_ss.lib]
read_hdl -sv {core.v pad_top.sv}
elaborate pad_top
define_cost_group -name I2O
path_group -from [all_inputs] -to [all_outputs] -group I2O
syn_generic
syn_map
syn_opt
write_hdl > pad_top_netlist.v`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },
  // 30. CADENCE GENUS 10+ YEAR SENIOR PRODUCTION SYNTHESIS MASTER FLOW
  {
    id: "genus_synthesis_master_flow",
    title: "Cadence Genus Production Synthesis Master Flow: RTL Elaboration to PnR Handoff",
    category: "hierarchical",
    keywords: [
      "genus_master_flow",
      "syn_generic",
      "syn_map",
      "syn_opt",
      "check_design",
      "remove_assigns_without_opt",
      "add_tieoffs",
      "write_db_common",
      "report_qor",
      "report_timing",
      "report_port",
    ],
    cadenceStylus: `# Production End-to-End Cadence Genus Synthesis Master Flow:

# 1. Session Setup & Library Binding:
set_db library [list stdcells_ss_0p72v.lib io_ss.lib]
set_db interconnect_mode wireload   ;# or ple with physical LEF/DEF

# 2. Ingest HDL & Elaborate Design:
read_hdl -sv [glob ../rtl/*.sv]
elaborate soc_top

# 3. Pre-Constraint Structural Audits:
check_design -unresolved
check_design -multiple_driver
check_design -combo_loops
check_design -undriven

# 4. Ingest Constraints & Set Driving Environment:
set_interactive_constraint_modes [all_constraint_modes -active]
read_sdc ../sdc/soc_top_func.sdc
set_driving_cell -lib_cell BUFX4 [remove_from_collection [all_inputs] [get_ports clk]]
set_load 0.05 [all_outputs]
check_timing -verbose

# 5. Define Path Cost Groups for Independent TNS Optimization:
define_cost_group -name R2R -design soc_top
define_cost_group -name I2R -design soc_top
define_cost_group -name R2O -design soc_top
define_cost_group -name I2O -design soc_top
path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r
path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o

# 6. Execute the 3 Core Synthesis Stages:
syn_generic
syn_map
syn_opt

# 7. Netlist Physical Sanitization:
set_remove_assign_options -buffer_or_inverter BUFX2 -design soc_top
remove_assigns_without_opt -design soc_top -verbose
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 soc_top

# 8. Post-Synthesis Timing & Structural Verification:
check_design -all > reports/check_design_final.rpt
report_qor > reports/qor_summary.rpt
report_timing -group R2R -max_paths 10 > reports/timing_r2r.rpt
report_port -delay -driver -load [get_ports *] > reports/port_audit.rpt

# 9. Unified Handoff Database Export:
write_hdl > outputs/soc_top_gate_golden.v
write_sdc > outputs/soc_top_signoff.sdc
write_db -common -design soc_top outputs/soc_top_handoff.db`,
    synopsys: `# Synopsys DC Production Flow:
read_verilog [glob ../rtl/*.v]
current_design soc_top
link
read_sdc ../sdc/soc_top.sdc
compile_ultra -no_autoungroup
set_fix_multiple_port_nets -all -buffer_constants
write -format verilog -hierarchy -output outputs/soc_top_mapped.v
write_sdc outputs/soc_top_mapped.sdc`,
    openRoad: `# OpenROAD Yosys Synthesis Flow:
yosys -import
read_verilog ../rtl/soc_top.v
synth -top soc_top
dfflibmap -liberty stdcells.lib
abc -liberty stdcells.lib
write_verilog outputs/soc_top_mapped.v`,
    description: "Production Cadence Genus Stylus Common UI end-to-end master synthesis flow: library loading, elaboration, check_design lint, SDC ingestion, 3-stage compilation (syn_generic/map/opt), assign removal, tieoff insertion, and write_db -common export.",
    exampleScript: `# Canonical Genus Command Script:
set_db library stdcells.lib
read_hdl -sv top.sv
elaborate top
read_sdc top.sdc
syn_generic
syn_map
syn_opt
remove_assigns_without_opt -design top
add_tieoffs -high TIEHI -low TIELO top
write_db -common -design top handoff/top.db`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },
  // 31. CADENCE GENUS IEEE 1801 (UPF 2.0) POWER INTENT SYNTHESIS & COMMIT FLOW
  {
    id: "genus_upf_power_intent_flow",
    title: "Cadence Genus IEEE 1801 (UPF 2.0) Power Intent Synthesis & Commit Flow",
    category: "power",
    keywords: [
      "genus_upf_flow",
      "read_power_intent",
      "commit_power_intent",
      "apply_power_intent",
      "check_power_intent",
      "set_isolation",
      "set_level_shifter",
      "set_retention",
      "create_pst",
      "write_power_intent",
    ],
    cadenceStylus: `# Production IEEE 1801 (UPF 2.0) Cadence Genus Power Intent Flow:

# 1. Elaborate Functional RTL & Bind Multi-Rail Libraries:
set_db library [list stdcells_0p72v.lib stdcells_0p90v.lib power_cells.lib]
read_hdl -sv [glob ../rtl/*.sv]
elaborate soc_top

# 2. Ingest Power Intent Side File (IEEE 1801 UPF 2.0):
read_power_intent -1801 -module soc_top -verbose ../upf/soc_top.upf
apply_power_intent -design soc_top -summary

# 3. Comprehensive Power Intent Verification & Crossing Audit:
check_power_intent -design soc_top -detail > reports/check_power_intent.rpt
check_power_intent -level_shifter -isolation -detail > reports/check_crossings.rpt

# 4. Physically Commit Low-Power Standard Cells:
# (Instantiates physical isolation, level-shifter, and retention cells)
commit_power_intent -design soc_top

# 5. Audit Inserted Low-Power Cell Inventory:
report_power_intent -power_domain_only > reports/domains.rpt
report_power_intent_instances -isolation_only -detail > reports/iso_cells.rpt
report_power_intent_instances -level_shifter_only -detail > reports/ls_cells.rpt

# 6. Apply SDC & Execute Multi-Voltage Synthesis:
read_sdc ../sdc/soc_top_func.sdc
syn_generic
syn_map
syn_opt

# 7. Export Synchronized Netlist & Updated UPF for Innovus PnR:
write_hdl > outputs/soc_top_mapped.v
write_power_intent -1801 -base_name outputs/soc_top_pi -overwrite
write_db -common -design soc_top outputs/soc_top_handoff.db`,
    synopsys: `# Synopsys DC UPF Flow:
load_upf ../upf/soc_top.upf
compile_ultra
save_upf outputs/soc_top.upf`,
    openRoad: `# OpenROAD OpenSTA Multi-Corner Power Flow:
# read_power_intent -upf ../upf/soc_top.upf`,
    description: "Production Cadence Genus Stylus CUI IEEE 1801 (UPF 2.0) power intent synthesis flow: read_power_intent, apply_power_intent, check_power_intent crossing audits, physical commit_power_intent, and write_power_intent synchronization for Innovus PnR.",
    exampleScript: `# Canonical Genus UPF Script:
read_hdl -sv top.sv
elaborate top
read_power_intent -1801 -module top top.upf
apply_power_intent -design top
check_power_intent -design top -detail
commit_power_intent -design top
syn_generic
syn_map
syn_opt
write_power_intent -1801 -base_name handoff/top_pi`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },
  // 32. CADENCE GENUS DYNAMIC & LEAKAGE POWER SYNTHESIS FLOW (ICG & ACTIVITY INJECTION)
  {
    id: "genus_lp_clock_gating_flow",
    title: "Cadence Genus Dynamic & Leakage Power Synthesis Flow (ICG & Activity Injection)",
    category: "power",
    keywords: [
      "genus_lp_flow",
      "lp_insert_clock_gating",
      "clock_gating",
      "design_power_effort",
      "opt_power_effort",
      "read_saif",
      "report_clock_gates",
      "report_power",
      "opt_leakage_to_dynamic_ratio",
    ],
    cadenceStylus: `# Production Cadence Genus Single-Rail Low-Power Synthesis Flow:

# 1. Load Multi-Vt Standard Cell Libraries (HVT/SVT/LVT) & Read RTL:
set_db library [list stdcells_hvt.lib stdcells_svt.lib stdcells_lvt.lib]
read_hdl -sv [glob ../rtl/*.sv]
elaborate pad_top
read_sdc ../sdc/pad_top_func.sdc

# 2. Enable Integrated Clock Gating (ICG) Insertion:
set_db lp_insert_clock_gating true
set_db lp_clock_gating_min_flops 4

# 3. Configure Power Optimization Efforts & Leakage/Dynamic Balancing:
set_db design_power_effort high
set_db opt_power_effort high
set_db opt_leakage_to_dynamic_ratio 0.5

# 4. Ingest Switching Activity File (SAIF) for Accurate Power Estimation:
read_saif -instance pad_top/u_core -scale_to_sdc_frequency ../sim/activity.saif

# 5. Execute 3-Stage Synthesis Optimization:
syn_generic
syn_map
syn_opt

# 6. Post-Synthesis Netlist Hygiene & Physical Tieoff Insertion:
remove_assigns_without_opt -design pad_top -verbose
delete_unloaded_undriven pad_top
add_tieoffs -high TIEHI_X1 -low TIELO_X1 -max_fanout 8 pad_top

# 7. Audit Clock Gating Quality & Power Reductions:
report_clock_gates -detail -fanout_summary -include_activity_info > reports/clock_gates.rpt
report_clock_gating_quality > reports/cg_quality.rpt
report_power -inst u_core -by_category -unit mW -header > reports/core_power_unmasked.rpt
report_timing -check_type clock_gating_setup > reports/cg_setup_timing.rpt`,
    synopsys: `# Synopsys DC Clock Gating Flow:
set_clock_gating_style -positive_edge_logic {integrated}
compile_ultra -gate_clock`,
    openRoad: `# OpenROAD Yosys / OpenSTA Clock Gating Flow:
# clock_gating_optimize`,
    description: "Production Cadence Genus Stylus CUI single-rail low-power synthesis flow: ICG insertion (lp_insert_clock_gating), power effort configuration, SAIF switching activity injection, clock gating quality audits, and core power unmasking.",
    exampleScript: `# Canonical Genus LP Script:
set_db lp_insert_clock_gating true
set_db design_power_effort high
read_saif -instance pad_top/u_core activity.saif
syn_generic
syn_map
syn_opt
report_clock_gates -detail
report_power -inst u_core -by_category -unit mW`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },
  // 33. CADENCE GENUS / TEMPUS STA WHITEBOARD TIMING AUDIT & PATH GROUP FLOW
  {
    id: "genus_sta_whiteboard_timing_audit",
    title: "Cadence Genus / Tempus STA Whiteboard Timing Audit & Path Group Flow",
    category: "timing",
    keywords: [
      "whiteboard_sta",
      "report_timing",
      "define_cost_group",
      "path_group",
      "set_multicycle_path",
      "report_port",
      "check_timing",
      "report_clocks",
      "timing_audit",
      "useful_skew",
      "derate",
    ],
    cadenceStylus: `# Production Cadence Genus / Tempus STA Whiteboard Timing Audit Flow:

# 1. Activate Interactive Constraint Mode & Read SDC:
set_interactive_constraint_modes [all_constraint_modes -active]
read_sdc ../sdc/pad_top_func.sdc
check_timing -verbose > reports/check_timing_audit.rpt

# 2. Populate Inter-Clock and Intra-Clock Uncertainty Matrix:
set_clock_uncertainty -setup 0.030 -from [get_clocks CLK] -to [get_clocks CLK]
set_clock_uncertainty -hold  0.020 -from [get_clocks CLK] -to [get_clocks CLK]
report_clocks -uncertainty_table > reports/clock_uncertainty_matrix.rpt

# 3. Define Dedicated Path Cost Groups to Isolate Core from I/O Pad Delays:
define_cost_group -name R2R -design pad_top
define_cost_group -name I2R -design pad_top
define_cost_group -name R2O -design pad_top
define_cost_group -name I2O -design pad_top

path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r
path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r
path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o
path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o

# 4. Audit Primary Port Slews and External Delay Allocations:
report_port -driver [all_inputs -no_clocks]  > reports/input_port_slews.rpt
report_port -delay  [all_inputs -no_clocks]  > reports/input_port_delays.rpt
report_port -delay  [all_outputs]            > reports/output_port_delays.rpt

# 5. Multicycle Path Alignment (Setup 2 with Hold 1):
set_multicycle_path 2 -setup -from [get_pins u_core/mult_reg*/Q] -to [get_pins u_core/acc_reg*/D]
set_multicycle_path 1 -hold  -from [get_pins u_core/mult_reg*/Q] -to [get_pins u_core/acc_reg*/D]

# 6. Apply On-Chip Variation (AOCV / Cell Derates):
set_timing_derate -cell_delay -late  1.050 -data
set_timing_derate -cell_delay -early 0.950 -data

# 7. Generate Comprehensive 4-Path-Group Report Card:
report_qor > reports/qor_whiteboard_summary.rpt
report_timing -group R2R -check_type setup -max_paths 5 > reports/timing_r2r_setup.rpt
report_timing -group R2R -check_type hold  -max_paths 5 > reports/timing_r2r_hold.rpt
report_timing -group I2R -max_paths 5 > reports/timing_i2r.rpt
report_timing -group R2O -max_paths 5 > reports/timing_r2o.rpt
report_timing -group I2O -max_paths 5 > reports/timing_i2o.rpt`,
    synopsys: `# Synopsys PrimeTime / DC Whiteboard STA Flow:
group_path -name R2R -from [all_registers] -to [all_registers]
group_path -name I2R -from [all_inputs]    -to [all_registers]
group_path -name R2O -from [all_registers] -to [all_outputs]
group_path -name I2O -from [all_inputs]    -to [all_outputs]
set_multicycle_path 2 -setup -from [get_cells u_mult/*] -to [get_cells u_acc/*]
set_multicycle_path 1 -hold  -from [get_cells u_mult/*] -to [get_cells u_acc/*]
report_timing -path_group R2R -max_paths 5
report_timing -path_group I2O -max_paths 5`,
    openRoad: `# OpenROAD OpenSTA Whiteboard STA Audit:
# group_path -name r2r -from [all_registers] -to [all_registers]
# report_checks -path_group r2r -fields {input_pin slew capacitance} -digits 3`,
    description: "Production Cadence Genus / Tempus Stylus CUI STA whiteboard timing audit and path group flow: dedicated cost group creation, multicycle path edge verification, input slew rate audits, clock uncertainty table population, and top-violator reporting across R2R, I2R, R2O, and I2O path groups.",
    exampleScript: `# Canonical Whiteboard STA Script:
define_cost_group -name R2R -design top
define_cost_group -name I2O -design top
path_group -from [all_registers] -to [all_registers] -group R2R
path_group -from [all_inputs] -to [all_outputs] -group I2O
set_multicycle_path 2 -setup -from A -to B
set_multicycle_path 1 -hold  -from A -to B
report_qor
report_timing -group R2R -max_paths 5`,
    relatedLink: { title: "Synthesis Studio", href: "/vlsi/timing-studio" },
  },
];


/**
 * Searches the EDA command database against a user query string.
 * Returns the best matching entry or null.
 */
export function findEdaCommand(queryText: string): EdaCommandEntry | null {
  const q = queryText.toLowerCase().trim();

  // Score each entry
  let bestEntry: EdaCommandEntry | null = null;
  let highestScore = 0;

  for (const entry of EDA_COMMANDS_DB) {
    let score = 0;

    // Check title match
    if (q.includes(entry.id.replace(/_/g, " ")) || entry.title.toLowerCase().includes(q)) {
      score += 10;
    }

    // Check keyword matches
    for (const kw of entry.keywords) {
      if (q.includes(kw)) {
        score += 5;
      }
      // Exact word match bonus
      const wordRegex = new RegExp(`\\b${kw}\\b`, "i");
      if (wordRegex.test(queryText)) {
        score += 8;
      }
    }

    if (score > highestScore && score >= 8) {
      highestScore = score;
      bestEntry = entry;
    }
  }

  return bestEntry;
}

/**
 * Formats an EDA command entry into an AI markdown response.
 */
export function formatEdaCommandResponse(entry: EdaCommandEntry, queryText: string): { a: string; links?: { title: string; href: string }[] } {
  const links: { title: string; href: string }[] = [];
  if (entry.relatedLink) {
    links.push(entry.relatedLink);
  }
  links.push({ title: "VLSI EDA Script & Command Helper", href: "/tools/script-helper" });
  links.push({ title: "VLSI Calculators (34 Live Sizers)", href: "/vlsi/learn/c/cadence-pnr/vlsi-calculators" });

  const a = `### EDA Command Guide: **${entry.title}**

${entry.description}

---

### **1. Cadence Innovus / Tempus / Genus (Stylus CUI - \`get_db\` / \`set_db\`)**:
\`\`\`tcl
${entry.cadenceStylus}
\`\`\`

${entry.cadenceLegacy ? `### **2. Cadence Legacy CUI (\`dbGet\` / \`dbSet\`)**:\n\`\`\`tcl\n${entry.cadenceLegacy}\n\`\`\`\n` : ""}

### **3. Synopsys DC / ICC2 / PrimeTime (\`get_cells\` / SDC)**:
\`\`\`tcl
${entry.synopsys}
\`\`\`

${entry.openRoad ? `### **4. OpenROAD / OpenSTA (Open Source Flow)**:\n\`\`\`tcl\n${entry.openRoad}\n\`\`\`\n` : ""}

---

### **Production Tcl Script Example**:
\`\`\`tcl
${entry.exampleScript}
\`\`\``;

  return { a, links };
}
