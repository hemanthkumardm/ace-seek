/**
 * Comprehensive VLSI & EDA Tool Command Database
 * Covers Cadence Innovus, Tempus, Voltus, Genus, Conformal LEC, Synopsys DC/ICC2/PrimeTime, SDC, and OpenROAD.
 */

export interface EdaCommandEntry {
  id: string;
  title: string;
  category: "query" | "floorplan" | "timing" | "cts" | "pdn" | "eco" | "power" | "lec" | "drc" | "dft";
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
    relatedLink: { title: "VLSI Synthesis Lab", href: "/vlsi/learn/c/cadence-genus" },
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
    relatedLink: { title: "Physical Verification Lab", href: "/vlsi/learn/c/physical-verif" },
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
