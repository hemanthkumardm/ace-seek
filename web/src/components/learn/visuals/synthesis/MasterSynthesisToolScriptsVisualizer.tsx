"use client";

import React, { useState } from "react";
import { Cpu, Terminal, Layers, Zap, Box, CheckCircle2, ShieldCheck, FileText, ArrowRight, Code } from "lucide-react";

export function MasterSynthesisToolScriptsVisualizer() {
  const [tool, setTool] = useState<"SYNOPSYS" | "GENUS" | "YOSYS">("SYNOPSYS");
  const [flowType, setFlowType] = useState<"LOGICAL" | "LOW_POWER" | "PHYSICAL">("LOGICAL");

  const toolData = {
    SYNOPSYS: {
      toolName: "Synopsys Design Compiler (DC-NXT / Topographical)",
      lang: "TCL / dc_shell",
      flows: {
        LOGICAL: {
          title: "Synopsys DC Logical Synthesis Flow (SkyWater 130nm)",
          overview: "Translates behavioral RTL into optimized, area-efficient, and timing-clean gate netlists without physical floorplan constraints.",
          stages: [
            { step: "1. Setup & Environment", desc: "Set target library, search paths, and link libraries for sky130_fd_sc_hd." },
            { step: "2. Read & Elaborate", desc: "Parse Verilog/SV AST, infer registers, generate unmapped GTECH generic logic network." },
            { step: "3. SDC Constraints", desc: "Define clock period, input/output delays, transition/capacitance design rule limits." },
            { step: "4. compile_ultra", desc: "Execute high-level logic optimization, boundary optimization, datapath sharing, and cell binding." },
            { step: "5. Signoff Reports", desc: "Generate report_qor, report_timing (WNS/TNS), and export gate-level netlist." },
          ],
          script: `# ==============================================================================
# Synopsys Design Compiler (dc_shell) - Production Logical Synthesis Script
# Technology: SkyWater 130nm (sky130_fd_sc_hd)
# ==============================================================================

# Step 1: Environment and Standard Cell Target Library Setup
set_app_var search_path       ". ./src ./libs/sky130_hd"
set_app_var target_library   "sky130_fd_sc_hd__tt_025C_1v80.db"
set_app_var synthetic_library "dw_foundation.sldb"
set_app_var link_library      "* sky130_fd_sc_hd__tt_025C_1v80.db dw_foundation.sldb"

# Step 2: Read, Elaborate & Link
# Stage: AST Generation -> GTECH Generic Technology-Independent Boolean Network
read_verilog -sv {
  ./src/alu_core.v
  ./src/regfile.v
  ./src/soc_top.v
}
elaborate soc_top -parameters "DATA_WIDTH=32, ADDR_WIDTH=8"
current_design soc_top
link
check_design -summary > reports/check_design_pre.rpt

# Step 3: Apply SDC Timing & Design Rule Constraints
create_clock -name clk -period 2.5 [get_ports clk]
set_clock_uncertainty 0.15 [get_clocks clk]
set_clock_transition  0.08 [get_clocks clk]

set_input_delay  0.60 -clock clk [remove_from_collection [all_inputs] [get_ports clk]]
set_output_delay 0.50 -clock clk [all_outputs]

# Set DRC limits (Capacitance, Transition, Fanout)
set_max_transition 0.18 [current_design]
set_max_fanout     16   [current_design]
set_load           0.05 [all_outputs]

# Step 4: High-Effort Logical Optimization
# Stage: Boolean Restructuring -> Technology Mapping (.lib) -> Path Sizing
compile_ultra -retime -no_autoungroup

# Step 5: Export Signoff Reports and Gate Netlist
report_qor                         > reports/qor_summary.rpt
report_timing -delay_type max -n 5 > reports/timing_setup_critical.rpt
report_area -hierarchy             > reports/area_hierarchy.rpt
report_power                       > reports/power_estimate.rpt

write_file -format verilog -hierarchy -output netlist/soc_top_gates.v
write_sdc netlist/soc_top_synth.sdc
write_file -format ddc -hierarchy -output netlist/soc_top_mapped.ddc`,
        },

        LOW_POWER: {
          title: "Synopsys DC Low-Power UPF & Multi-Vth Synthesis Flow",
          overview: "Integrates IEEE 1801 UPF power domains, automatic Integrated Clock Gating (ICG) insertion, and Multi-Vth static leakage recovery.",
          stages: [
            { step: "1. Multi-Vth Libraries", desc: "Load High-Speed (HS), High-Density (HD), and Low-Leakage (HDLL) libraries." },
            { step: "2. UPF Power Intent", desc: "Load IEEE 1801 UPF file defining power domains, isolation cells, and level shifters." },
            { step: "3. ICG Insertion", desc: "Insert sky130_fd_sc_hd__dlclkp integrated clock gating cells to freeze idle registers." },
            { step: "4. Multi-Vth Swapping", desc: "Recover static leakage on non-critical positive slack paths by swapping to HDLL cells." },
            { step: "5. Formality SVF Record", desc: "Export SVF guidance file for formal logic equivalence checking (LEC)." },
          ],
          script: `# ==============================================================================
# Synopsys DC Low-Power Multi-Vth & UPF Power-Aware Synthesis Flow
# ==============================================================================

# Step 1: Multi-Vth Target Libraries Setup
set_app_var target_library [list \\
  sky130_fd_sc_hs__tt_025C_1v80.db   \\  ;# High Speed (LVT) for critical timing
  sky130_fd_sc_hd__tt_025C_1v80.db   \\  ;# High Density (RVT) standard cells
  sky130_fd_sc_hdll__tt_025C_1v80.db    ;# Low Leakage (HVT) for static power
]
set_app_var link_library [concat "*" $target_library synthetic_library]

# Step 2: Formality SVF Guidance Record (Mandatory for ICG/UPF Equivalence)
set_svf outputs/formality_guidance.svf

# Step 3: Elaborate Design
read_verilog -sv {./src/soc_top.v ./src/crypto_core.v}
elaborate soc_top
current_design soc_top
link

# Step 4: Load IEEE 1801 UPF Power Intent
load_upf power_intent/soc_top.upf

# Step 5: Configure Automatic Integrated Clock Gating (ICG)
set_clock_gating_style -positive_edge_logic {integrated:sky130_fd_sc_hd__dlclkp_1} \\
                       -control_point before \\
                       -max_fanout 32 \\
                       -minimum_bitwidth 4

# Step 6: Apply SDC Constraints & Leakage Power Target
read_sdc constraints/soc_top.sdc
set_leakage_optimization true
set_dynamic_optimization true

# Step 7: Low-Power Compile with Clock Gating & Leakage Swapping
compile_ultra -gate_clock -leakage_power -scan

# Step 8: Multi-Vth Distribution & Power Analysis
report_clock_gating -structure > reports/clock_gating.rpt
report_threshold_voltage_group > reports/multi_vth_distribution.rpt
report_power -hierarchy        > reports/power_upf_signoff.rpt

# Step 9: Export Netlist, SDC, and SVF for Formality LEC
write_file -format verilog -hierarchy -output netlist/soc_top_lp_mapped.v
write_sdc netlist/soc_top_lp_synth.sdc
set_svf -off`,
        },

        PHYSICAL: {
          title: "Synopsys DC Topographical (Physical-Aware) Synthesis Flow",
          overview: "Uses DEF floorplan macro placements and TLU+ interconnect parasitic extraction to eliminate post-layout timing closure surprises.",
          stages: [
            { step: "1. Physical Library Prep", desc: "Load Milkyway/NDM design library, tech LEF, and TLU+ RC extraction models." },
            { step: "2. Floorplan DEF Import", desc: "Read DEF floorplan containing die boundaries, macro RAM coordinates, and I/O pins." },
            { step: "3. Topographical Compile", desc: "Run early Steiner routing and parasitic RC calculation during logic optimization." },
            { step: "4. Congestion Analysis", desc: "Predict routing channel hotspots and insert keepout margins automatically." },
            { step: "5. P&R Handoff (SPG)", desc: "Export Synopsys Physical Guidance (SPG) DEF for seamless Cadence/Synopsys P&R." },
          ],
          script: `# ==============================================================================
# Synopsys DC Topographical (Physical-Aware) Synthesis Flow
# ==============================================================================

# Step 1: Physical Tech Setup (TLU+ & Tech Files)
set_app_var mw_reference_library  "./libs/sky130_mw_lib"
set_app_var mw_design_library     "./work/soc_top_mw"
set_tlu_plus_files \\
  -max_tluplus  "./libs/rc_worst.tluplus" \\
  -min_tluplus  "./libs/rc_best.tluplus"  \\
  -tech2itf_map "./libs/sky130.map"

# Step 2: Read RTL & Elaborate
read_verilog -sv ./src/soc_top.v
elaborate soc_top
current_design soc_top
link

# Step 3: Read Physical DEF Floorplan
# Provides exact (X, Y) locations of SRAM macros, I/O pads, and block boundaries
read_def floorplan/soc_top_floorplan.def

# Step 4: SDC Timing & Placement Constraints
read_sdc constraints/soc_top.sdc
set_max_area 0

# Step 5: Physical-Aware Compile with SPG (Synopsys Physical Guidance)
# Stage: Early Placement -> Steiner Tree RC -> Physical Sizing & Buffering
compile_ultra -spg -gate_clock -scan

# Step 6: Physical Congestion and Wirelength Reports
report_congestion               > reports/physical_congestion.rpt
report_timing -physical         > reports/timing_physical_qor.rpt
report_qor                      > reports/topographical_qor.rpt

# Step 7: Export Physical Guidance DEF and Gate Netlist for Innovus / ICC2
write_def -output outputs/soc_top_placed_synth.def
write_file -format verilog -hierarchy -output netlist/soc_top_physical_mapped.v
write_sdc netlist/soc_top_physical.sdc`,
        },
      },
    },

    GENUS: {
      toolName: "Cadence Genus Synthesis Solution",
      lang: "TCL / genus",
      flows: {
        LOGICAL: {
          title: "Cadence Genus Logical Synthesis Flow (SkyWater 130nm)",
          overview: "High-throughput 3-step synthesis paradigm: syn_generic -> syn_map -> syn_opt.",
          stages: [
            { step: "1. Library & Init", desc: "Configure `init_lib_search_path` and load `sky130_fd_sc_hd.lib` target liberty files." },
            { step: "2. read_hdl & elaborate", desc: "Elaborate multi-file HDL into Genus technology-independent generic graph." },
            { step: "3. syn_generic", desc: "High-level optimization: FSM extraction, datapath carry lookahead, and resource sharing." },
            { step: "4. syn_map", desc: "Technology mapping binding generic Boolean operators to target standard cells." },
            { step: "5. syn_opt", desc: "Gate-level optimization: setup timing recovery, DRC fixing, and multi-corner analysis." },
          ],
          script: `# ==============================================================================
# Cadence Genus Synthesis Solution - Production Logical Synthesis Script
# ==============================================================================

# Step 1: Setup Library Search Paths and Target Liberty Files
set_db init_lib_search_path {. ./libs/sky130_hd}
set_db target_library       {sky130_fd_sc_hd__tt_025C_1v80.lib}
set_db link_library         {* sky130_fd_sc_hd__tt_025C_1v80.lib}

# Step 2: Read Synthesizable RTL and Elaborate
read_hdl -language sv {
  ./src/alu_core.v
  ./src/regfile.v
  ./src/soc_top.v
}
elaborate soc_top
check_design > reports/genus_check_design.rpt

# Step 3: Apply SDC Timing Constraints
read_sdc constraints/soc_top.sdc

# Step 4: Step 1 of Genus Optimization - syn_generic
# Stage: Generic unmapped logic optimization, FSM encoding, and datapath restructuring
syn_generic

# Step 5: Step 2 of Genus Optimization - syn_map
# Stage: Technology library standard cell binding (.lib)
syn_map

# Step 6: Step 3 of Genus Optimization - syn_opt
# Stage: Gate-level optimization, buffer insertion, and timing slack recovery
syn_opt

# Step 7: Export Signoff Reports and Gate-Level Netlist
report_qor                 > reports/genus_qor.rpt
report_timing -max_paths 5 > reports/genus_setup_timing.rpt
report_area                > reports/genus_area.rpt
report_power               > reports/genus_power.rpt

write_hdl                  > netlist/soc_top_genus_gates.v
write_sdc                  > netlist/soc_top_genus.sdc
write_design -innovus      -basename outputs/genus_innovus_handoff`,
        },

        LOW_POWER: {
          title: "Cadence Genus Low-Power & CPF/IEEE 1801 Synthesis Flow",
          overview: "Integrated Multi-Vth leakage optimization and Common Power Format (CPF) / UPF power gating.",
          stages: [
            { step: "1. Multi-Vth Libraries", desc: "Load sky130_fd_sc_hs, sky130_fd_sc_hd, and sky130_fd_sc_hdll." },
            { step: "2. read_power_intent", desc: "Read IEEE 1801 / CPF power domain definitions." },
            { step: "3. lp_insert_clock_gating", desc: "Configure latch-based ICG cell insertion (`dlclkp`)." },
            { step: "4. syn_opt -leakage", desc: "Execute leakage power optimization to swap non-critical cells to HDLL." },
          ],
          script: `# ==============================================================================
# Cadence Genus Low-Power & CPF/UPF Synthesis Script
# ==============================================================================

# Step 1: Load Multi-Threshold Target Libraries
set_db init_lib_search_path {. ./libs}
set_db target_library { \\
  sky130_fd_sc_hs__tt_025C_1v80.lib   \\  ;# High Speed (LVT)
  sky130_fd_sc_hd__tt_025C_1v80.lib   \\  ;# High Density (RVT)
  sky130_fd_sc_hdll__tt_025C_1v80.lib   ;# Low Leakage (HVT)
}

# Step 2: Read HDL and Elaborate
read_hdl -language sv ./src/soc_top.v
elaborate soc_top

# Step 3: Read IEEE 1801 / CPF Power Intent
read_power_intent -1801 power/soc_top.upf

# Step 4: Configure Integrated Clock Gating (ICG)
set_db lp_insert_clock_gating true
set_db lp_clock_gating_cell   sky130_fd_sc_hd__dlclkp_1
set_db lp_clock_gating_min_flops 4

# Step 5: Read SDC Constraints
read_sdc constraints/soc_top.sdc

# Step 6: 3-Stage Low Power Compile
syn_generic
syn_map
syn_opt -leakage_power

# Step 7: Reporting
report_clock_gating    > reports/genus_clock_gating.rpt
report_power -detailed > reports/genus_lowpower_signoff.rpt
write_hdl              > netlist/soc_top_genus_lp.v`,
        },

        PHYSICAL: {
          title: "Cadence Genus iSpatial (Physical-Aware) Synthesis Flow",
          overview: "Shares identical placement and routing engines with Cadence Innovus to achieve 98% correlation.",
          stages: [
            { step: "1. LEF Library Import", desc: "Load technology LEF (metal layer RC rules) and cell LEFs." },
            { step: "2. read_def floorplan", desc: "Import floorplan DEF with macro placements." },
            { step: "3. syn_opt -spatial", desc: "Execute physical placement-guided synthesis with Innovus engine." },
            { step: "4. Innovus Handoff", desc: "Export placed database directly into Innovus P&R without file translation." },
          ],
          script: `# ==============================================================================
# Cadence Genus iSpatial Physical-Aware Synthesis Script
# ==============================================================================

# Step 1: Read Physical LEF Libraries (Tech LEF + Standard Cell LEFs + Macro LEFs)
read_physical -lef { \\
  ./libs/sky130_fd_sc_hd.tlef \\
  ./libs/sky130_fd_sc_hd.lef  \\
  ./libs/sram_macro.lef       \\
}

# Step 2: Read HDL & Elaborate
read_hdl -language sv ./src/soc_top.v
elaborate soc_top

# Step 3: Read Physical DEF Floorplan
read_def floorplan/soc_top_fp.def

# Step 4: Apply SDC Timing Constraints
read_sdc constraints/soc_top.sdc

# Step 5: Execute Physical Synthesis (iSpatial Engine)
syn_generic -physical
syn_map     -physical
syn_opt     -spatial

# Step 6: Export Placed Database for Innovus Handoff
report_congestion     > reports/genus_ispatial_congestion.rpt
report_timing -max_paths 10 > reports/genus_ispatial_timing.rpt
write_design -innovus -basename outputs/genus_placed_design`,
        },
      },
    },

    YOSYS: {
      toolName: "Yosys Open-Source Synthesis Flow (OpenLane / SkyWater 130nm)",
      lang: "Yosys Script / TCL",
      flows: {
        LOGICAL: {
          title: "Yosys + ABC Open-Source Logical Synthesis Flow (Sky130)",
          overview: "Complete pipeline using Yosys AST elaboration and Berkeley ABC technology mapping for SkyWater 130nm.",
          stages: [
            { step: "1. read_verilog & hierarchy", desc: "Parse Verilog AST, resolve module hierarchy, check unlinked ports." },
            { step: "2. proc & opt", desc: "Convert `always` procedural blocks to multiplexers and DFF primitives." },
            { step: "3. fsm & memory", desc: "Detect and encode FSM state machines; map register arrays to memory primitives." },
            { step: "4. techmap & abc", desc: "Run technology mapping via ABC using target `sky130_fd_sc_hd.lib` standard cells." },
            { step: "5. clean & write_verilog", desc: "Remove unused intermediate nets and export gate-level netlist." },
          ],
          script: `# ==============================================================================
# Yosys Open-Source Synthesis Script (OpenLane / SkyWater 130nm)
# ==============================================================================

# Step 1: Read Verilog Source Files
read_verilog -sv ./src/alu_core.v
read_verilog -sv ./src/regfile.v
read_verilog -sv ./src/soc_top.v

# Step 2: Elaborate Hierarchy
hierarchy -check -top soc_top

# Step 3: High-Level RTL Optimizations
# Stage: Procedural Always Conversion -> MUX Tree Inferences
proc; opt

# Step 4: Extract and Encode FSM State Machines
fsm; opt

# Step 5: Extract Memory & Register Banks
memory; opt

# Step 6: Generic Techmap & Multiplier Decompositions
techmap; opt

# Step 7: Technology Mapping to SkyWater 130nm Standard Cells via ABC
# ABC transforms Boolean network into target sky130_fd_sc_hd standard cells
abc -liberty ./libs/sky130_hd/sky130_fd_sc_hd__tt_025C_1v80.lib \\
    -script "+strash;ifraig;scorr;dc2;dretime;strash;&get,-n;&dch,-f;&nf,{D};&put"

# Step 8: Clean Unused Logic & Buffer Dead Wires
clean

# Step 9: Export Gate-Level Netlist and Statistics
stat -liberty ./libs/sky130_hd/sky130_fd_sc_hd__tt_025C_1v80.lib
write_verilog -noattr -noexpr netlist/soc_top_yosys_gates.v
write_json netlist/soc_top_synth.json`,
        },

        LOW_POWER: {
          title: "Yosys Clock Gating Insertion & Leakage Optimization Flow",
          overview: "Automated clock gating pass (`opt_dff -gate_clock`) and ABC timing-driven cell substitution.",
          stages: [
            { step: "1. opt_dff -gate_clock", desc: "Detect synchronous enable loops and replace with gated clock latch cells." },
            { step: "2. ICG Mapping", desc: "Map unmapped clock gates to `sky130_fd_sc_hd__dlclkp_1`." },
            { step: "3. ABC Multi-Vth Sizing", desc: "Target multi-Vth Liberty files in ABC for timing-driven cell selection." },
          ],
          script: `# ==============================================================================
# Yosys Low-Power Clock Gating & Multi-Vth Synthesis Flow
# ==============================================================================

# Read RTL & Elaborate
read_verilog -sv ./src/soc_top.v
hierarchy -check -top soc_top
proc; opt

# Insert Clock Gating on Synchronous Registers with Multi-Bit Enables
opt_dff -gate_clock
techmap -map ./techmap/sky130_icg_map.v; opt

# Technology Mapping via ABC with Multi-Vth Liberty Characterization
abc -liberty ./libs/sky130_fd_sc_hd__tt_025C_1v80.lib \\
    -constr constraints/soc_top.constr \\
    -D 2500

clean
stat -liberty ./libs/sky130_fd_sc_hd__tt_025C_1v80.lib
write_verilog -noattr netlist/soc_top_yosys_lp.v`,
        },

        PHYSICAL: {
          title: "Yosys OpenROAD Physical Handoff Flow (SkyWater 130nm)",
          overview: "Prepares synthesized netlist, SDC, and floorplan guidance for the OpenROAD open-source P&R tool.",
          stages: [
            { step: "1. Yosys Synthesis", desc: "Compile Verilog into pure `sky130_fd_sc_hd` standard cells." },
            { step: "2. write_verilog -noattr", desc: "Export clean IEEE 1364 netlist without Yosys-internal attributes." },
            { step: "3. OpenSTA Timing Checks", desc: "Run OpenSTA static timing analysis with real parasitics." },
            { step: "4. OpenROAD P&R Import", desc: "Feed netlist directly into OpenROAD floorplan, tapcell, and placement." },
          ],
          script: `# ==============================================================================
# Yosys to OpenROAD Physical Handoff Script (OpenLane Sky130)
# ==============================================================================

# Read RTL and Elaborate
read_verilog -sv ./src/soc_top.v
hierarchy -check -top soc_top
proc; opt; fsm; opt; memory; opt; techmap; opt

# Target SkyWater 130nm Liberty
dfflibmap -liberty ./libs/sky130_hd/sky130_fd_sc_hd__tt_025C_1v80.lib
abc -liberty ./libs/sky130_hd/sky130_fd_sc_hd__tt_025C_1v80.lib

# Clean and Export Netlist for OpenROAD
clean
write_verilog -noattr -noexpr -nohex ./openroad/inputs/soc_top.synth.v
write_blif ./openroad/inputs/soc_top.blif

# Handoff to OpenROAD:
# openroad -exit ./openroad/scripts/pnr_flow.tcl`,
        },
      },
    },
  };

  const currTool = toolData[tool];
  const currFlow = currTool.flows[flowType];

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{
        background: "var(--ln-bg-elev)",
        border: "1px solid var(--ln-border)",
      }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Master EDA Synthesis Studio (Synopsys DC · Cadence Genus · Yosys)
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Production-grade synthesis scripts and step-by-step stage execution across Logical, Low-Power, and Physical flows
            </p>
          </div>
        </div>

        {/* EDA Tool Selectors */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["SYNOPSYS", "GENUS", "YOSYS"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTool(t)}
              className={`px-3 py-1 rounded text-xs font-semibold transition-all ${
                tool === t
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {t === "SYNOPSYS" ? "Synopsys DC" : t === "GENUS" ? "Cadence Genus" : "Yosys OpenLane"}
            </button>
          ))}
        </div>
      </div>

      {/* Flow Type Selectors */}
      <div className="grid grid-cols-3 gap-2 mb-4 font-mono text-xs">
        {[
          { id: "LOGICAL", label: "1. Logical Synthesis", desc: "RTL ➔ GTECH ➔ Sky130 Netlist" },
          { id: "LOW_POWER", label: "2. Low-Power & Multi-Vth", desc: "UPF, ICG & Static Leakage" },
          { id: "PHYSICAL", label: "3. Physical-Aware (DEF)", desc: "Floorplan & Steiner Parasitics" },
        ].map((f) => {
          const isActive = flowType === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFlowType(f.id as any)}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="font-bold text-xs uppercase mb-0.5">{f.label}</div>
              <div className="text-[10px] text-slate-400 font-sans">{f.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Script & Stage Breakdown */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <div>
            <span className="text-cyan-300 font-bold block">{currFlow.title}</span>
            <span className="text-[10px] text-slate-400">{currTool.toolName} · {currTool.lang}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300 text-[10px] font-bold">
            Target PDK: SkyWater 130nm (`sky130_fd_sc_hd`)
          </span>
        </div>

        {/* Overview Box */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 font-sans text-xs">
          💡 <span className="font-bold text-white">Flow Objective:</span> {currFlow.overview}
        </div>

        {/* Step-by-Step Execution Pipeline */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Execution Stage Pipeline Breakdown:</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
            {currFlow.stages.map((st, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-cyan-300 text-xs">{st.step}</div>
                <div className="text-[10px] text-slate-400 font-sans leading-relaxed">{st.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Production Script Display */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Production Synthesis Automation Script:</span>
            <span className="text-[9px] text-amber-400 font-sans">Ready for EDA execution</span>
          </div>
          <pre className="p-3.5 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-96">
            {currFlow.script}
          </pre>
        </div>
      </div>
    </div>
  );
}
