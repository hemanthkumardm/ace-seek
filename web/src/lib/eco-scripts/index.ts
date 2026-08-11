/**
 * Flow-stage ECO / fix script templates.
 *
 * Synthesis → Genus, dc_shell, Yosys
 * PnR       → Innovus, OpenROAD, ICC2
 * Signoff   → pt_shell, Tempus, OpenSTA
 *
 * Commands that are not finalized use PLACEHOLDER comments for later fill-in.
 */

import { EcoAction, SolverStage } from "../timing-engine";

// ---------------------------------------------------------------------------
// Vendors by flow stage
// ---------------------------------------------------------------------------

/** Tool IDs used by Timing Studio ECO */
export type EcoVendor =
  // synthesis
  | "genus"
  | "dc_shell"
  | "yosys"
  // pnr
  | "innovus"
  | "openroad"
  | "icc2"
  // signoff
  | "pt_shell"
  | "tempus"
  | "opensta"
  /** @deprecated alias of pt_shell — kept for saved sessions */
  | "primetime";

export interface EcoVendorMeta {
  id: EcoVendor;
  label: string;
  stage: SolverStage;
  short: string;
}

export const ECO_VENDORS: EcoVendorMeta[] = [
  { id: "genus", label: "Cadence Genus", stage: "synthesis", short: "Genus" },
  { id: "dc_shell", label: "Synopsys DC (dc_shell)", stage: "synthesis", short: "dc_shell" },
  { id: "yosys", label: "Yosys / ABC", stage: "synthesis", short: "Yosys" },
  { id: "innovus", label: "Cadence Innovus", stage: "pnr", short: "Innovus" },
  { id: "openroad", label: "OpenROAD", stage: "pnr", short: "OpenROAD" },
  { id: "icc2", label: "Synopsys ICC2", stage: "pnr", short: "ICC2" },
  { id: "pt_shell", label: "Synopsys PrimeTime (pt_shell)", stage: "signoff", short: "pt_shell" },
  { id: "tempus", label: "Cadence Tempus", stage: "signoff", short: "Tempus" },
  { id: "opensta", label: "OpenSTA", stage: "signoff", short: "OpenSTA" },
];

export const STAGE_VENDORS: Record<SolverStage, EcoVendor[]> = {
  synthesis: ["genus", "dc_shell", "yosys"],
  pnr: ["innovus", "openroad", "icc2"],
  signoff: ["pt_shell", "tempus", "opensta"],
};

export function vendorsForStage(stage: SolverStage): EcoVendorMeta[] {
  const ids = STAGE_VENDORS[stage] || STAGE_VENDORS.signoff;
  return ECO_VENDORS.filter((v) => ids.includes(v.id));
}

export function defaultVendorForStage(stage: SolverStage): EcoVendor {
  return STAGE_VENDORS[stage]?.[0] || "pt_shell";
}

export function isVendorValidForStage(
  vendor: EcoVendor,
  stage: SolverStage
): boolean {
  const v = normalizeVendor(vendor);
  return (STAGE_VENDORS[stage] || []).includes(v);
}

/** Map legacy aliases */
export function normalizeVendor(vendor: EcoVendor): EcoVendor {
  if (vendor === "primetime") return "pt_shell";
  return vendor;
}

export function vendorLabel(vendor: EcoVendor): string {
  const v = normalizeVendor(vendor);
  return ECO_VENDORS.find((x) => x.id === v)?.label || v;
}

export interface EcoScriptOptions {
  vendor: EcoVendor;
  stage: SolverStage;
  designName?: string;
  commentHeader?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ph(tool: string, intent: string, detail?: string): string {
  return `# PLACEHOLDER [${tool}] ${intent}${detail ? ` — ${detail}` : ""}`;
}

function cellNote(action: EcoAction): string {
  if (!action.fromCell && !action.toCell) return "";
  return ` ;# ${action.fromCell || "?"} → ${action.toCell || "?"} (${action.cellPickSource || "n/a"})`;
}

// ---------------------------------------------------------------------------
// Per-action command generation
// ---------------------------------------------------------------------------

export function generateVendorEcoLine(
  action: EcoAction,
  vendorIn: EcoVendor
): string {
  const vendor = normalizeVendor(vendorIn);
  const target = action.target || "inst_target";
  const toCell = action.toCell;
  const note = cellNote(action);
  const gain = (action.estGainNs || 0).toFixed(3);

  switch (action.type) {
    // ----- Cell physical / mapped (all stages after map, but tool differs) -----
    case "upsize":
      return lineUpsize(vendor, target, toCell, note, action);
    case "lvt":
      return lineLvt(vendor, target, toCell, note, action);
    case "buffer":
      return lineBuffer(vendor, target, action);
    case "useful_skew":
      return lineUsefulSkew(vendor, target, gain, action);
    case "shield":
      return lineShield(vendor, target, action);
    case "pipeline":
      return linePipeline(vendor, target, action);
    case "slew":
      return lineSlew(vendor, target, action);
    case "output_relax":
      return lineOutputRelax(vendor, target, action);

    // ----- Synthesis-centric SDC / compile methods -----
    case "path_group":
      return linePathGroup(vendor, target, action);
    case "retime":
      return lineRetime(vendor, target, action);
    case "reduce_freq":
      return lineReduceFreq(vendor, target, action);
    case "uncertainty":
      return lineUncertainty(vendor, target, action);
    case "io_constraint":
      return lineIoConstraint(vendor, target, action);
    case "compile_effort":
      return lineCompileEffort(vendor, target, action);

    default:
      return action.scriptLine || ph(vendor, `unhandled type ${action.type}`);
  }
}

function lineUpsize(
  vendor: EcoVendor,
  target: string,
  toCell: string | undefined,
  note: string,
  action: EcoAction
): string {
  const cell = toCell || `${target}_X2`;
  switch (vendor) {
    case "genus":
      return toCell
        ? `change_link ${target} ${toCell}${note}`
        : ph("genus", "change_link / size mapped cell", target);
    case "dc_shell":
      return toCell
        ? `size_cell ${target} ${toCell}${note}`
        : `size_cell ${target} {/* NEXT_DRIVE */}${note}`;
    case "yosys":
      return ph(
        "yosys",
        "map/abc cell sizing",
        `${target} → ${cell} (no direct size_cell; re-map or manual techmap)`
      );
    case "innovus":
      return `ecoChangeCell -inst {${target}} -cell {${cell}}${note}`;
    case "openroad":
      return toCell
        ? `replace_cell ${target} ${toCell}${note}`
        : ph("openroad", "replace_cell / repair_timing size", target);
    case "icc2":
      return toCell
        ? `size_cell ${target} ${toCell}${note}`
        : `size_cell ${target} {/* NEXT_DRIVE */}${note}`;
    case "pt_shell":
      return `size_cell {${target}} {${cell}}${note}`;
    case "tempus":
      return `eco_update_cell -inst {${target}} -cell {${cell}}${note}`;
    case "opensta":
      return `replace_cell {${target}} {${cell}}${note}`;
    default:
      return action.scriptLine;
  }
}

function lineLvt(
  vendor: EcoVendor,
  target: string,
  toCell: string | undefined,
  note: string,
  action: EcoAction
): string {
  const cell = toCell || `${target}_LVT`;
  switch (vendor) {
    case "genus":
      return toCell
        ? `change_link ${target} ${toCell}${note}`
        : ph("genus", "VT swap via change_link to LVT master", target);
    case "dc_shell":
      return toCell
        ? `size_cell ${target} ${toCell}${note}`
        : ph("dc_shell", "size_cell to LVT variant", target);
    case "yosys":
      return ph("yosys", "VT swap not native — re-map with LVT liberty", target);
    case "innovus":
      return `ecoChangeCell -inst {${target}} -cell {${cell}}${note}`;
    case "openroad":
      return toCell
        ? `replace_cell ${target} ${toCell}${note}`
        : ph("openroad", "replace_cell LVT twin", target);
    case "icc2":
      return toCell
        ? `size_cell ${target} ${toCell}${note}`
        : ph("icc2", "size_cell LVT twin", target);
    case "pt_shell":
      return `size_cell {${target}} {${cell}}${note}`;
    case "tempus":
      return `eco_update_cell -inst {${target}} -cell {${cell}}${note}`;
    case "opensta":
      return `replace_cell {${target}} {${cell}}${note}`;
    default:
      return action.scriptLine;
  }
}

function lineBuffer(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
      return ph(
        "genus",
        "insert buffer / syn_opt -incremental",
        `net or pin near ${target}`
      );
    case "dc_shell":
      return `insert_buffer [get_nets {${target}}] {/* BUF_CELL */}`;
    case "yosys":
      return ph("yosys", "buffer insertion via techmap/abc", target);
    case "innovus":
      return `ecoAddRepeater -net {${target}} -cell BUF_X2`;
    case "openroad":
      return ph("openroad", "repair_design / buffer insertion", target);
    case "icc2":
      return `add_buffer -nets [get_nets {${target}}] -lib_cells {/* BUF */}`;
    case "pt_shell":
      return `insert_buffer [get_nets {${target}}] BUF_X2`;
    case "tempus":
      return `eco_insert_buffer -net {${target}} -cell BUF_X2`;
    case "opensta":
      return `insert_buffer [get_nets {${target}}] BUF_X2`;
    default:
      return action.scriptLine;
  }
}

function lineUsefulSkew(
  vendor: EcoVendor,
  target: string,
  gain: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
    case "dc_shell":
    case "yosys":
      return ph(
        vendor,
        "useful skew is PnR/CTS — use clock uncertainty or retime at synth",
        target
      );
    case "innovus":
      return `set_ccopt_property sink_latency -pin {${target}} +${gain}`;
    case "openroad":
      return ph("openroad", "CTS useful skew / repair_timing", `pin ${target} +${gain}ns`);
    case "icc2":
      return ph("icc2", "clock_opt useful skew", `pin ${target} +${gain}ns`);
    case "pt_shell":
      return `set_clock_latency -source ${gain} [get_pins {${target}}]`;
    case "tempus":
      return `set_clock_latency ${gain} [get_pins {${target}}]`;
    case "opensta":
      return `set_clock_latency -source ${gain} [get_pins {${target}}]`;
    default:
      return action.scriptLine;
  }
}

function lineShield(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
    case "dc_shell":
    case "yosys":
      return ph(vendor, "SI shield is physical — N/A at pure synthesis", target);
    case "innovus":
      return `ecoRoute -target_nets {${target}} -shield_net VSS`;
    case "openroad":
      return ph("openroad", "antenna/SI spacing or shield net", target);
    case "icc2":
      return ph("icc2", "route_eco shield / spacing", target);
    case "pt_shell":
      return `# SI: set_si_options / report_si_bottleneck on [get_nets {${target}}]`;
    case "tempus":
      return `eco_route -net {${target}} -shield_net VSS`;
    case "opensta":
      return `# SI mitigation placeholder for net ${target}`;
    default:
      return action.scriptLine;
  }
}

function linePipeline(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
      return ph(
        "genus",
        "pipeline / retime (RTL or syn_generic + retiming attrs)",
        target
      );
    case "dc_shell":
      return `set_optimize_registers true\n# compile_ultra -retime  ;# path near ${target}`;
    case "yosys":
      return ph(
        "yosys",
        "no full retiming — split path in RTL or use ABC sequential opts if available",
        target
      );
    case "innovus":
      return ph("innovus", "physical retiming rarely used — prefer synth RTL pipeline", target);
    case "openroad":
      return ph("openroad", "pipeline register insertion", target);
    case "icc2":
      return ph("icc2", "retime / pipeline", target);
    case "pt_shell":
    case "tempus":
    case "opensta":
      return ph(vendor, "pipeline is RTL/synth — document path for designer", target);
    default:
      return action.scriptLine;
  }
}

function lineSlew(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
      return `set_driving_cell -lib_cell {/* DRIVER */} [get_ports ${target}]`;
    case "dc_shell":
      return `set_driving_cell -lib_cell BUF_X4 [get_ports ${target}]`;
    case "yosys":
      return ph("yosys", "external drive is SDC — set_driving_cell in SDC file", target);
    case "innovus":
    case "openroad":
    case "icc2":
    case "pt_shell":
    case "tempus":
    case "opensta":
      return `set_driving_cell -lib_cell BUF_X4 [get_ports {${target}}]`;
    default:
      return action.scriptLine;
  }
}

function lineOutputRelax(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  return [
    `# Review output constraint / load on ${target}`,
    `set_output_delay -clock [get_clocks *] 0.100 [get_ports {${target}}]`,
    `set_load 0.010 [get_ports {${target}}]`,
  ].join("\n");
}

function linePathGroup(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const grp = action.pathGroupName || "critical_fix";
  switch (vendor) {
    case "genus":
      return `group_path -name ${grp} -from [get_pins {${target}}] -weight 2.0\n# then: syn_opt -incremental / path_group effort`;
    case "dc_shell":
      return `group_path -name ${grp} -to [get_pins {${target}}]\nset_path_group_options ${grp} -effort high\n# compile_ultra -incremental`;
    case "yosys":
      return ph(
        "yosys",
        "path groups are SDC for STA tools; in synth focus ABC script / hierarchy",
        target
      );
    case "innovus":
    case "icc2":
    case "openroad":
      return `group_path -name ${grp} -through [get_pins {${target}}]\n# Prefer cost_group / path_group weight in opt`;
    case "pt_shell":
    case "tempus":
    case "opensta":
      return `group_path -name ${grp} -to [get_pins {${target}}]\nreport_timing -group ${grp}`;
    default:
      return action.scriptLine;
  }
}

function lineRetime(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
      return [
        `# Retiming near ${target}`,
        ph("genus", "set_db design:.retime true / syn_opt -retime", "confirm project attrs"),
      ].join("\n");
    case "dc_shell":
      return [
        `set_optimize_registers true`,
        `set_dont_retime [get_cells *] false`,
        `# compile_ultra -retime`,
        `# balance registers around ${target}`,
      ].join("\n");
    case "yosys":
      return ph(
        "yosys",
        "sequential retiming limited — prefer RTL pipeline; optional ABC scorr/retime if enabled",
        target
      );
    default:
      return ph(vendor, "retiming primarily a synthesis step", target);
  }
}

function lineReduceFreq(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const period = action.suggestedPeriodNs;
  const clk = action.clockName || "clk";
  const periodStr =
    period !== undefined ? period.toFixed(3) : "/* NEW_PERIOD_NS */";
  switch (vendor) {
    case "genus":
    case "dc_shell":
    case "yosys":
    case "innovus":
    case "openroad":
    case "icc2":
    case "pt_shell":
    case "tempus":
    case "opensta":
      return [
        `# Decrease frequency (increase period) for clock ${clk}`,
        `create_clock -name ${clk} -period ${periodStr} [get_ports ${clk}]`,
        `# Or: set_clock_period ${periodStr} [get_clocks ${clk}]`,
        `# Target related path: ${target}`,
      ].join("\n");
    default:
      return action.scriptLine;
  }
}

function lineUncertainty(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const unc = action.suggestedUncertaintyNs;
  const clk = action.clockName || "clk";
  const u = unc !== undefined ? unc.toFixed(3) : "0.050";
  return [
    `# Clock uncertainty (jitter/skew budget) on ${clk}`,
    `set_clock_uncertainty ${u} [get_clocks ${clk}]`,
    `# Related endpoint/path: ${target}`,
  ].join("\n");
}

function lineIoConstraint(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  return [
    `# I/O constraint review for ${target}`,
    `report_timing -to [get_ports ${target}] -path_type summary`,
    `set_input_delay  -clock [get_clocks *] 0.200 [get_ports ${target}]  ;# tune`,
    `set_output_delay -clock [get_clocks *] 0.200 [get_ports ${target}]  ;# tune`,
    `set_max_delay  -from [get_ports ${target}]  /* PATH_MAX */`,
  ].join("\n");
}

function lineCompileEffort(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  switch (vendor) {
    case "genus":
      return [
        `# Higher effort synthesis / incremental opt`,
        ph("genus", "set_db syn_generic_effort high / syn_map_effort high", ""),
        `syn_opt -incremental`,
        `# focus path: ${target}`,
      ].join("\n");
    case "dc_shell":
      return [
        `set_compile_effort high`,
        `# compile_ultra -incremental -timing_high_effort_script`,
        `# path near ${target}`,
      ].join("\n");
    case "yosys":
      return [
        `# ABC / synth effort`,
        ph("yosys", "abc -D <delay> / synth -run :fine", target),
        `# abc -script +strash;scf;if;-D 10000;...`,
      ].join("\n");
    default:
      return ph(vendor, "compile effort is synthesis-only", target);
  }
}

// ---------------------------------------------------------------------------
// Full script export
// ---------------------------------------------------------------------------

export function exportVendorEcoScript(
  actions: EcoAction[],
  options: EcoScriptOptions
): string {
  const vendor = normalizeVendor(options.vendor);
  const { stage, designName = "top", commentHeader = true } = options;

  const lines: string[] = [];

  if (commentHeader) {
    lines.push(`######################################################################`);
    lines.push(`# ACE-SEEK Flow Fix / ECO Script`);
    lines.push(`# Tool: ${vendorLabel(vendor)}`);
    lines.push(`# Design: ${designName} · Flow stage: ${stage}`);
    lines.push(`# Generated: ${new Date().toISOString()}`);
    lines.push(`# Actions: ${actions.length}`);
    lines.push(`# Note: PLACEHOLDER lines need project-specific commands filled in.`);
    lines.push(`######################################################################`);
    lines.push(``);
  }

  // Preambles
  switch (vendor) {
    case "genus":
      lines.push(`# Genus synthesis session`);
      lines.push(`# read_libs / read_hdl / elaborate ${designName}`);
      lines.push(`current_design ${designName}`);
      lines.push(``);
      break;
    case "dc_shell":
      lines.push(`# Design Compiler (dc_shell)`);
      lines.push(`current_design ${designName}`);
      lines.push(``);
      break;
    case "yosys":
      lines.push(`# Yosys script fragment (run via yosys -s)`);
      lines.push(`# read_verilog … ; hierarchy -top ${designName}`);
      lines.push(``);
      break;
    case "innovus":
      lines.push(`# Innovus ECO mode`);
      lines.push(`setEcoMode -updateTiming reserve -batchMode true`);
      lines.push(``);
      break;
    case "openroad":
      lines.push(`# OpenROAD Tcl`);
      lines.push(ph("openroad", "load design / liberty / DEF for ECO", designName));
      lines.push(``);
      break;
    case "icc2":
      lines.push(`# ICC2 shell`);
      lines.push(`current_lib …`);
      lines.push(`open_lib … ; open_block ${designName}`);
      lines.push(``);
      break;
    case "pt_shell":
      lines.push(`# PrimeTime (pt_shell)`);
      lines.push(`current_design ${designName}`);
      lines.push(``);
      break;
    case "tempus":
      lines.push(`# Tempus`);
      lines.push(`set_eco_option -update_timing true`);
      lines.push(``);
      break;
    case "opensta":
      lines.push(`# OpenSTA`);
      lines.push(``);
      break;
  }

  let totalEstGain = 0;

  actions.forEach((a, idx) => {
    totalEstGain += a.estGainNs;
    lines.push(`# --- Step ${idx + 1}: ${a.title} ---`);
    lines.push(
      `# Type: ${a.type} | Target: ${a.target} | Est: +${a.estGainNs.toFixed(3)} ns | Risk: ${a.risk}`
    );
    if (!a.stageOk) {
      lines.push(`# WARNING: Not recommended at ${stage} stage`);
    }
    lines.push(generateVendorEcoLine(a, vendor));
    lines.push(``);
  });

  // Post steps
  switch (vendor) {
    case "genus":
      lines.push(`# Re-time / re-report`);
      lines.push(`report_timing -worst 10 > eco_genus_timing.rpt`);
      break;
    case "dc_shell":
      lines.push(`report_timing -delay_type max > eco_dc_timing.rpt`);
      break;
    case "yosys":
      lines.push(`# write_verilog eco_out.v ; # re-STA in OpenSTA/PT`);
      break;
    case "innovus":
      lines.push(`ecoRoute -modifyOnly`);
      lines.push(`timeDesign -postRoute -outDir eco_reports`);
      break;
    case "openroad":
      lines.push(ph("openroad", "repair_timing ; report_checks", ""));
      break;
    case "icc2":
      lines.push(ph("icc2", "update_timing ; report_timing", ""));
      break;
    case "pt_shell":
      lines.push(`update_timing -full`);
      lines.push(`report_timing -slack_lesser_than 0.0 > eco_signoff.rpt`);
      break;
    case "tempus":
      lines.push(`update_timing`);
      lines.push(`report_timing -max_paths 20 > eco_tempus.rpt`);
      break;
    case "opensta":
      lines.push(`report_checks -slack_max 0.0`);
      break;
  }

  lines.push(``);
  lines.push(`# Total estimated improvement (heuristic): +${totalEstGain.toFixed(3)} ns`);

  return lines.join("\n");
}
