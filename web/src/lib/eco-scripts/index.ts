/**
 * Flow-stage ECO / fix script templates.
 *
 * Synthesis → Genus, dc_shell, Yosys
 * PnR       → Innovus, OpenROAD, ICC2
 * Signoff   → pt_shell, Tempus, OpenSTA
 *
 * Genus lines follow misc/GENUS_*.md (Common UI set_db/get_db, path groups,
 * syn_generic/map/opt, ECO incremental, exceptions). Non-Genus tools may still
 * use PLACEHOLDER comments where vendor docs are incomplete.
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

    // ----- Exceptions / freeze (GENUS_ECO_INCREMENTAL_EXCEPTIONS_GUIDE.md) -----
    case "path_adjust":
      return linePathAdjust(vendor, target, action);
    case "false_path":
      return lineFalsePath(vendor, target, action);
    case "multicycle":
      return lineMulticycle(vendor, target, action);
    case "preserve":
      return linePreserve(vendor, target, action);

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
      // Genus Common UI: size via .base_cell (misc/GENUS_COMMANDS.md §3, §22)
      // Prefer syn_opt sizing after path_group weight when no ladder cell.
      return toCell
        ? [
            `# Upsize ${target}${note}`,
            `get_db [get_db insts ${target}] .base_cell.name`,
            `set_db [get_db insts ${target}] .base_cell [get_db lib_cells ${toCell}]`,
            `report_instance_library [get_db insts ${target}]`,
            `syn_opt -incremental`,
          ].join("\n")
        : [
            `# Upsize path through ${target} (no ladder cell — opt-driven)`,
            `get_db [get_db insts ${target}] .base_cell.name`,
            `# Ensure not frozen: set_db [get_db insts ${target}] .preserve false`,
            `report_timing -through [get_db pins ${target}/*] -max_paths 5`,
            `syn_opt -incremental`,
          ].join("\n");
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
        ? [
            `# VT swap ${target}${note}`,
            `get_db [get_db insts ${target}] .base_cell.name`,
            `set_db [get_db insts ${target}] .base_cell [get_db lib_cells ${toCell}]`,
            `# Prefer LVT lib in set_db library / MMMC library_set for map/opt`,
            `syn_opt -incremental`,
          ].join("\n")
        : [
            `# VT swap near ${target} — ensure LVT liberty is mapped`,
            `# set_db library [list $LIB_SVT $LIB_LVT ...]`,
            `# set_db [get_db lib_cells *HVT*] .dont_use true  ;# optional bias`,
            `syn_opt -incremental`,
          ].join("\n");
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
      // Buffering is primarily syn_opt / max_fanout (GENUS_SYNTHESIS_LEARNING_NOTES §8;
      // GENUS_ECO: local size/buffer + preserve rest)
      return [
        `# Buffer / rebuffer near ${target} (Genus inserts BUF*/fopt* when beneficial)`,
        `report_nets -min_fanout 20`,
        `set_db max_fanout 10`,
        `# Optional local margin (ps): path_adjust -delay 50 -setup -through [get_db pins ${target}/*]`,
        `# Freeze unrelated IP: set_db [get_db insts u_ip*] .preserve true`,
        `syn_opt -incremental`,
        `report_timing -through [get_db pins ${target}/*] -max_paths 5 -nets`,
      ].join("\n");
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
  const clk = action.clockName || "clk";
  switch (vendor) {
    case "genus":
      // Useful skew is CTS/PnR; at synth use setup uncertainty as early budget
      // (GENUS_COMMANDS §7; ECO guide — not free slack cosmetics)
      return [
        `# Useful skew is PnR/CTS — Genus early budget via setup uncertainty on ${clk}`,
        `set_clock_uncertainty -setup ${gain} [get_clocks ${clk}]`,
        `# Prefer path_group weight / retime / period for real WNS at synth`,
        `# Related pin: ${target}`,
        `report_clocks -uncertainty_table`,
      ].join("\n");
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
      return [
        `# SI shield is physical (Innovus/route) — N/A at pure Genus logical synth`,
        `# At synth: fix DRV (report_constraint) and high-fanout (report_nets) instead`,
        `report_constraint`,
        `report_nets -min_fanout 30`,
        `# Net of interest: ${target}`,
      ].join("\n");
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
      // Master interview / learning notes: real pipeline is RTL; opt only balances
      return [
        `# Pipeline / split path near ${target} — prefer RTL stage; synth can only help slightly`,
        `report_sequential`,
        `report_timing -from [all_registers] -to [all_registers] -max_paths 10`,
        `set_db syn_opt_effort high`,
        `syn_opt -incremental`,
        `# Document: add pipeline flop in RTL for this cone if levels remain high`,
      ].join("\n");
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
      // GENUS_COMMANDS §7 environment + learning notes set_driving_cell
      return [
        `# Input slew / external driver model on ${target}`,
        `report_port -driver [get_ports ${target}]`,
        `set_driving_cell -lib_cell {/* REAL_BUF_FROM_LIB */} [get_ports ${target}]`,
        `# Alt fixed slew: set_input_transition -max 0.15 [get_ports ${target}]`,
        `report_port -driver [get_ports ${target}]`,
      ].join("\n");
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
  if (vendor === "genus") {
    return [
      `# Review output constraint / load on ${target} (Genus report_port)`,
      `report_port -delay [get_ports ${target}]`,
      `report_port -load  [get_ports ${target}]`,
      `set_output_delay -clock [get_clocks *] 0.100 [get_ports ${target}]  ;# tune`,
      `set_load -max 0.010 [get_ports ${target}]`,
      `report_timing -from [all_registers] -to [get_ports ${target}] -max_paths 5`,
    ].join("\n");
  }
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
      // GENUS_SYNTHESIS_LEARNING_NOTES §7.1 + GENUS_COMMANDS §10
      return [
        `# Path group / cost group for critical logic (steers opt; not physics)`,
        `define_cost_group -name ${grp} -design [get_db current_design .name]`,
        `path_group -to [get_pins {${target}}] -group ${grp} -name pg_${grp}`,
        `group_path -name ${grp} -to [get_pins {${target}}] -weight 10`,
        `set_path_group_options ${grp} -effort_level high -weight 10`,
        `syn_opt -incremental`,
        `report_timing -group ${grp} -nworst 10 -max_paths 20`,
        `report_qor`,
      ].join("\n");
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
      // Retiming is primarily architectural (master interview); high-effort opt + report_sequential
      return [
        `# Retiming / balance near ${target} — Genus: high-effort opt; reliable fix is RTL pipeline`,
        `report_sequential`,
        `report_timing -from [all_registers] -to [all_registers] -max_paths 10`,
        `set_db syn_generic_effort high`,
        `set_db syn_map_effort high`,
        `set_db syn_opt_effort high`,
        `# If already mapped: incremental only`,
        `syn_opt -incremental`,
        `# Else full cascade: syn_generic ; syn_map ; syn_opt`,
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
  if (vendor === "genus") {
    return [
      `# Decrease frequency (increase period) for clock ${clk}`,
      `report_clocks`,
      `create_clock -name ${clk} -period ${periodStr} [get_ports ${clk}]`,
      `# Or re-read SDC after editing period in source file`,
      `# Related path: ${target}`,
      `report_qor`,
      `report_timing -max_paths 10`,
    ].join("\n");
  }
  switch (vendor) {
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
  if (vendor === "genus") {
    // GENUS_COMMANDS §7: set_clock_uncertainty [-setup|-hold]
    const hold = unc !== undefined ? Math.min(unc, 0.02).toFixed(3) : "0.020";
    return [
      `# Clock uncertainty (jitter/skew budget) on ${clk}`,
      `set_clock_uncertainty -setup ${u} [get_clocks ${clk}]`,
      `set_clock_uncertainty -hold  ${hold} [get_clocks ${clk}]`,
      `report_clocks -uncertainty_table`,
      `# Related endpoint/path: ${target}`,
    ].join("\n");
  }
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
  if (vendor === "genus") {
    // GENUS_COMMANDS §7 I/O + report_port audit
    return [
      `# I/O constraint review for ${target}`,
      `report_port -delay  [get_ports ${target}]`,
      `report_port -driver [get_ports ${target}]`,
      `report_port -load   [get_ports ${target}]`,
      `set_input_delay  -clock [get_clocks *] 0.200 [get_ports ${target}]  ;# tune max`,
      `set_output_delay -clock [get_clocks *] 0.200 [get_ports ${target}]  ;# tune max`,
      `set_driving_cell -lib_cell {/* BUF_FROM_LIB */} [get_ports ${target}]`,
      `set_load -max 0.05 [get_ports ${target}]`,
      `# Point budget if non-clocked interface: set_max_delay 1.5 -from ... -to ...`,
      `set_max_delay /* PATH_MAX */ -from [get_ports ${target}] -to [all_registers]`,
      `check_timing`,
      `report_timing -to [get_ports ${target}] -max_paths 10`,
    ].join("\n");
  }
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
      // GENUS_SYNTHESIS_LEARNING_NOTES §13 + ECO incremental guide
      return [
        `# Higher effort synthesis / incremental opt (focus: ${target})`,
        `set_db syn_generic_effort high`,
        `set_db syn_map_effort high`,
        `set_db syn_opt_effort high`,
        `# Already mapped netlist → incremental only:`,
        `syn_opt -incremental`,
        `# Spatial/iSpatial when DEF present: syn_opt -spatial`,
        `# Full re-run (structure change): syn_generic ; syn_map ; syn_opt`,
        `report_qor`,
        `report_timing -max_paths 20 -nworst 1`,
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

function linePathAdjust(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const from = action.exceptionFrom || "/* START */";
  const to = action.exceptionTo || target;
  const ps = action.pathAdjustPs ?? Math.max(10, Math.round((action.estGainNs || 0.05) * 1000));
  // Genus path_adjust is in picoseconds (ECO guide §8)
  if (vendor === "genus") {
    return [
      `# path_adjust local margin ${ps} ps (NOT free WNS cosmetics — owner required)`,
      `path_adjust -delay ${ps} -setup -from [get_pins {${from}}] -to [get_pins {${to}}] -name pa_${ps}ps`,
      `# Alt: set_path_adjust -delay ${ps} -setup -from ... -to ...`,
      `report_timing -from [get_pins {${from}}] -to [get_pins {${to}}] -exception_data -max_paths 5`,
      `check_timing`,
    ].join("\n");
  }
  // SDC-ish tools: set_max_delay tweak or documented path_adjust if supported
  return [
    `# Local path margin (~${ps} ps) toward ${to}`,
    vendor === "dc_shell" || vendor === "pt_shell" || vendor === "tempus" || vendor === "opensta"
      ? `set_max_delay [expr {[get_attribute [get_timing_paths -from {${from}} -to {${to}}] required_time] + ${ps}/1000.0}] -from [get_pins {${from}}] -to [get_pins {${to}}]  ;# review`
      : `path_adjust -delay ${ps} -setup -from {${from}} -to {${to}}`,
    `# Prefer real fix (size/buffer/RTL) over exception`,
  ].join("\n");
}

function lineFalsePath(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const from = action.exceptionFrom || target;
  const to = action.exceptionTo;
  // Prefer clock_groups when two clocks mentioned in title/detail
  const asyncMatch = action.detail?.match(
    /Launch\s+(\S+)\s+vs capture\s+(\S+)/i
  );
  if (vendor === "genus") {
    if (asyncMatch) {
      const [, c1, c2] = asyncMatch;
      return [
        `# Async domains — prefer clock_groups (CLOCKS guide / CDC); FP only for points`,
        `set_clock_groups -asynchronous -group [get_clocks {${c1}}] -group [get_clocks {${c2}}]`,
        `# Point FP if architecturally non-functional:`,
        `# set_false_path -from [get_pins {${from}}]${to ? ` -to [get_pins {${to}}]` : ""}`,
        `report_timing -exception_data -max_paths 10`,
        `check_timing`,
      ].join("\n");
    }
    return [
      `# False path (prove non-functional first — ECO guide §5)`,
      to
        ? `set_false_path -from [get_pins {${from}}] -to [get_pins {${to}}]`
        : `set_false_path -from [get_ports {${from}}]`,
      `# Reset style often: set_false_path -from [get_ports rst_n]`,
      `report_timing -exception_data -max_paths 10`,
      `check_timing`,
    ].join("\n");
  }
  // Generic SDC for other tools
  if (asyncMatch) {
    const [, c1, c2] = asyncMatch;
    return `set_clock_groups -asynchronous -group [get_clocks {${c1}}] -group [get_clocks {${c2}}]`;
  }
  return to
    ? `set_false_path -from [get_pins {${from}}] -to [get_pins {${to}}]`
    : `set_false_path -from [get_ports {${from}}]`;
}

function lineMulticycle(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  const from = action.exceptionFrom || "/* FROM */";
  const to = action.exceptionTo || target;
  const n = action.mcpCycles && action.mcpCycles > 1 ? action.mcpCycles : 2;
  const hold = Math.max(1, n - 1);
  // ECO guide §6: always pair setup + hold
  const body = [
    `# Multicycle path ×${n} setup (only if architecture allows — ECO guide §6)`,
    `set_multicycle_path ${n} -setup -from [get_pins {${from}}] -to [get_pins {${to}}]`,
    `set_multicycle_path ${hold} -hold  -from [get_pins {${from}}] -to [get_pins {${to}}]`,
    `# Hold MCP corrects capture edge after expanding setup`,
  ];
  if (vendor === "genus") {
    body.push(`report_timing -from [get_pins {${from}}] -to [get_pins {${to}}] -exception_data -max_paths 5`);
    body.push(`check_timing`);
  }
  return body.join("\n");
}

function linePreserve(
  vendor: EcoVendor,
  target: string,
  action: EcoAction
): string {
  if (vendor === "genus") {
    return [
      `# Freeze unrelated logic during local ECO (ECO guide §4)`,
      `# Example patterns — edit instance globs for your design:`,
      `set_db [get_db insts u_ip*] .preserve true`,
      `set_db [get_db insts u_sync*] .preserve true`,
      `# Allow critical cone to be touched:`,
      `# set_db [get_db insts ${target.split("/")[0]}*] .preserve false`,
      `report_dont_touch`,
      `check_design -preserved`,
      `syn_opt -incremental`,
      `# write_preserves > eco_preserves.tcl`,
    ].join("\n");
  }
  if (vendor === "dc_shell" || vendor === "icc2") {
    return [
      `set_dont_touch [get_cells u_ip*] true`,
      `# size/buffer only critical: ${target}`,
    ].join("\n");
  }
  if (vendor === "innovus") {
    return `setDontTouch [get_db insts u_ip*] true  ;# freeze IP during eco near ${target}`;
  }
  return ph(vendor, "preserve / dont_touch frozen blocks", target);
}

// ---------------------------------------------------------------------------
// Full Genus synthesis flow export (misc/GENUS_SYNTHESIS_LEARNING_NOTES §13)
// ---------------------------------------------------------------------------

export type GenusEffort = "low" | "medium" | "high";

export interface GenusSynthFlowOptions {
  designName?: string;
  /** Liberty files for set_db library */
  libFiles?: string[];
  /** HDL sources (use .sv paths with -sv) */
  hdlFiles?: string[];
  sdcFile?: string;
  effort?: GenusEffort;
  /** Include physical/iSpatial flags when DEF is available */
  physical?: boolean;
  defFile?: string;
  /** Optional ECO / exception snippets appended after first opt */
  ecoActions?: EcoAction[];
  /** Output report/netlist basenames */
  outPrefix?: string;
}

/**
 * End-to-end Genus Common UI script: libs → RTL → SDC → path groups →
 * syn_generic/map/opt → reports → write_hdl/sdc/db.
 * Commands grounded in misc/GENUS_COMMANDS.md + LEARNING_NOTES + ECO guide.
 */
export function exportGenusSynthFlow(options: GenusSynthFlowOptions = {}): string {
  const top = options.designName || "pad_top";
  const effort = options.effort || "medium";
  const libs = options.libFiles?.length
    ? options.libFiles
    : ["$LIB_SS", "$IO_SS"];
  const hdls = options.hdlFiles?.length
    ? options.hdlFiles
    : [`../rtl/${top}.v`, `../rtl/${top}.sv`];
  const sdc = options.sdcFile || `../sdc/${top}_func.sdc`;
  const prefix = options.outPrefix || top;
  const lines: string[] = [];

  lines.push(`######################################################################`);
  lines.push(`# ACE-SEEK Genus full synthesis flow (Common UI)`);
  lines.push(`# Design: ${top}`);
  lines.push(`# Generated: ${new Date().toISOString()}`);
  lines.push(`# Refs: misc/GENUS_COMMANDS.md, GENUS_SYNTHESIS_LEARNING_NOTES.md`);
  lines.push(`######################################################################`);
  lines.push(``);

  lines.push(`# --- 0. Session / units ---`);
  lines.push(`# genus   ;# start Common UI (no genus -stylus)`);
  lines.push(`set TOP ${top}`);
  lines.push(`report_units`);
  lines.push(``);

  lines.push(`# --- 1. Libraries (GENUS_COMMANDS §3) ---`);
  lines.push(`set_db library [list ${libs.join(" ")}]`);
  lines.push(`# read_libs  ;# alternate`);
  lines.push(`check_library`);
  lines.push(`llength [get_db lib_cells *]`);
  lines.push(``);

  lines.push(`# --- 2. RTL build (GENUS_COMMANDS §4) ---`);
  for (const f of hdls) {
    if (f.endsWith(".sv") || f.endsWith(".SV")) {
      lines.push(`read_hdl -sv ${f}`);
    } else {
      lines.push(`read_hdl ${f}`);
    }
  }
  lines.push(`elaborate $TOP`);
  lines.push(`check_design -unresolved`);
  lines.push(`check_design -multiple_driver`);
  lines.push(`report_hierarchy > reports/\${TOP}_hierarchy.rpt`);
  lines.push(``);

  if (options.physical && options.defFile) {
    lines.push(`# --- 2b. Physical / iSpatial (GENUS_PHYSICAL_ISPATIAL_GUIDE.md) ---`);
    lines.push(`read_def ${options.defFile}`);
    lines.push(`set_db interconnect_mode {ple}`);
    lines.push(``);
  } else {
    lines.push(`# --- 2b. Interconnect model (wireload early; PLE with DEF) ---`);
    lines.push(`set_db interconnect_mode {wireload}`);
    lines.push(``);
  }

  lines.push(`# --- 3. Constraints / I/O environment (GENUS_COMMANDS §7) ---`);
  lines.push(`read_sdc ${sdc}`);
  lines.push(`# Optional environment if not fully in SDC:`);
  lines.push(`# set_driving_cell -lib_cell <BUF_FROM_LIB> [remove_from_collection [all_inputs] [get_ports {*clk* *rst*}]]`);
  lines.push(`# set_load -max 0.05 [all_outputs]`);
  lines.push(`# set_input_transition -max 0.15 [all_inputs]`);
  lines.push(`check_timing`);
  lines.push(`report_clocks`);
  lines.push(`report_port -delay [all_inputs]`);
  lines.push(`report_port -load  [all_outputs]`);
  lines.push(``);

  lines.push(`# --- 4. Path / cost groups (LEARNING_NOTES §7.1) ---`);
  lines.push(`define_cost_group -name R2R -design $TOP`);
  lines.push(`define_cost_group -name I2R -design $TOP`);
  lines.push(`define_cost_group -name R2O -design $TOP`);
  lines.push(`define_cost_group -name I2O -design $TOP`);
  lines.push(`path_group -from [all_registers] -to [all_registers] -group R2R -name pg_r2r`);
  lines.push(`path_group -from [all_inputs]    -to [all_registers] -group I2R -name pg_i2r`);
  lines.push(`path_group -from [all_registers] -to [all_outputs]   -group R2O -name pg_r2o`);
  lines.push(`path_group -from [all_inputs]    -to [all_outputs]   -group I2O -name pg_i2o`);
  lines.push(`group_path -name reg2reg -from [all_registers] -to [all_registers] -weight 5`);
  lines.push(`set_path_group_options R2R -effort_level high -weight 10`);
  lines.push(`set_path_group_options I2O -effort_level high -weight 5`);
  lines.push(``);

  lines.push(`# --- 5. Synthesis transforms (COMMANDS §11) ---`);
  lines.push(`set_db syn_generic_effort ${effort}`);
  if (options.physical) {
    lines.push(`syn_generic -physical`);
  } else {
    lines.push(`syn_generic`);
  }
  lines.push(`set_db syn_map_effort ${effort}`);
  if (options.physical) {
    lines.push(`syn_map -physical`);
  } else {
    lines.push(`syn_map`);
  }
  lines.push(`set_db syn_opt_effort ${effort}`);
  if (options.physical) {
    lines.push(`syn_opt -spatial`);
  } else {
    lines.push(`syn_opt`);
  }
  lines.push(``);

  lines.push(`# --- 6. Netlist hygiene (COMMANDS §8 / §14) ---`);
  lines.push(`check_design -assigns`);
  lines.push(`# remove_assigns_without_opt -design $TOP -verbose`);
  lines.push(`# add_tieoffs -high TIEH... -low TIEL... -max_fanout 8 $TOP`);
  lines.push(`check_design -all > reports/\${TOP}_check_design.rpt`);
  lines.push(``);

  if (options.ecoActions && options.ecoActions.length > 0) {
    lines.push(`# --- 6b. ECO / exception snippets (optional) ---`);
    options.ecoActions.forEach((a, i) => {
      lines.push(`# Step ${i + 1}: ${a.title} (${a.type})`);
      lines.push(generateVendorEcoLine(a, "genus"));
      lines.push(``);
    });
  }

  lines.push(`# --- 7. QoR / timing (COMMANDS §9 / §12) ---`);
  lines.push(`report_qor > reports/${prefix}_qor.rpt`);
  lines.push(`report_timing -max_paths 50 -nworst 1 > reports/${prefix}_timing.rpt`);
  lines.push(`report_timing -from [all_registers] -to [all_registers] -max_paths 20 > reports/${prefix}_r2r.rpt`);
  lines.push(`report_timing -from [all_inputs] -to [all_outputs] -max_paths 20 > reports/${prefix}_i2o.rpt`);
  lines.push(`report_timing -group I2O -nworst 10 > reports/${prefix}_group_i2o.rpt`);
  lines.push(`report_area  > reports/${prefix}_area.rpt`);
  lines.push(`report_gates > reports/${prefix}_gates.rpt`);
  lines.push(``);

  lines.push(`# --- 8. Write handoff (COMMANDS §19) ---`);
  lines.push(`write_hdl > outputs/${prefix}_netlist.v`);
  lines.push(`write_sdc > outputs/${prefix}_func.sdc`);
  lines.push(`write_db -design $TOP outputs/${prefix}_syn.db`);
  lines.push(`# write_db -common outputs/${prefix}_common.db  ;# Genus+Innovus common DB`);
  lines.push(`# write_hdl -lec > outputs/${prefix}_lec.v`);
  lines.push(``);

  lines.push(`# --- 9. Incremental polish (ECO guide) ---`);
  lines.push(`# syn_opt -incremental`);
  lines.push(`# report_qor`);
  lines.push(``);
  lines.push(`puts "ACE-SEEK Genus flow complete for $TOP"`);

  return lines.join("\n");
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
    if (vendor === "genus") {
      lines.push(`# Genus Common UI (set_db/get_db) — see misc/GENUS_COMMANDS.md`);
      lines.push(`# ECO flow: misc/GENUS_ECO_INCREMENTAL_EXCEPTIONS_GUIDE.md`);
    } else {
      lines.push(`# Note: PLACEHOLDER lines need project-specific commands filled in.`);
    }
    lines.push(`######################################################################`);
    lines.push(``);
  }

  // Preambles
  switch (vendor) {
    case "genus":
      lines.push(`# Genus Common UI session (misc/GENUS_SYNTHESIS_LEARNING_NOTES.md §13)`);
      lines.push(`# set_db library [list $LIB_SS $IO_SS]`);
      lines.push(`# read_hdl [list ...] ;# read_hdl -sv for SystemVerilog`);
      lines.push(`# elaborate ${designName}`);
      lines.push(`# read_sdc constraints.sdc`);
      lines.push(`# check_design -unresolved`);
      lines.push(`# check_timing`);
      lines.push(`# report_units`);
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
      lines.push(`# Post-ECO QoR (GENUS_COMMANDS §9 / ECO guide §2.2)`);
      lines.push(`check_design -preserved`);
      lines.push(`check_timing`);
      lines.push(`report_qor > eco_genus_qor.rpt`);
      lines.push(`report_timing -max_paths 20 -nworst 1 > eco_genus_timing.rpt`);
      lines.push(`report_timing -exception_data -max_paths 10 > eco_genus_exceptions.rpt`);
      lines.push(`# LEC old vs new after functional/timing cell ECO (GENUS_VERIFICATION_LEC_GLS_SDF_GUIDE.md)`);
      lines.push(`# write_hdl -lec > eco_genus_lec.v`);
      lines.push(`# write_sdc > eco_genus.sdc ; write_db -design ${designName} eco_genus.db`);
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
