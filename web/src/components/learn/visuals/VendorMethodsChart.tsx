"use client";

import React, { useState } from "react";
import { Boxes } from "lucide-react";

type Vendor = "synopsys" | "cadence" | "opensource";

const DOMAINS: Record<
  string,
  { title: string; rows: { task: string; synopsys: string; cadence: string; opensource: string }[] }
> = {
  tcl: {
    title: "Tcl shells & how you talk to each EDA",
    rows: [
      { task: "Logic synthesis shell", synopsys: "dc_shell / fc_shell", cadence: "genus", opensource: "yosys" },
      { task: "STA shell", synopsys: "pt_shell (PrimeTime)", cadence: "tempus  (report_timing -late/-early)", opensource: "sta (OpenSTA)" },
      { task: "P&R shell", synopsys: "icc2_shell / fc_shell", cadence: "innovus", opensource: "openroad" },
      { task: "LEC", synopsys: "formality", cadence: "conformal", opensource: "yosys equiv / sv2v" },
      { task: "Collections", synopsys: "get_cells, foreach_in_collection, sizeof_collection, get_attribute", cadence: "get_db insts, get_db pins, foreach, llength of get_db list", opensource: "get_cells (OpenSTA), yosys select / tee" },
      { task: "Read design", synopsys: "read_verilog / analyze+elaborate / read_ddc", cadence: "read_hdl / elaborate", opensource: "read_verilog (yosys); read_verilog (OpenSTA)" },
      { task: "SDC", synopsys: "source clocks.sdc  (native)", cadence: "read_sdc clocks.sdc", opensource: "read_sdc clocks.sdc" },
      { task: "QoR", synopsys: "report_qor, report_timing -max_paths", cadence: "report_qor, report_timing -max_paths", opensource: "report_checks -path_delay max" },
      { task: "Batch exit", synopsys: "exit / quit  (status via catch)", cadence: "exit -force", opensource: "exit 1" },
    ],
  },
  synth: {
    title: "Synthesis methods by vendor",
    rows: [
      { task: "Compile", synopsys: "compile_ultra / compile_fusion", cadence: "set_db syn_*_effort; syn_generic; syn_map; syn_opt (+ -spatial)", opensource: "hierarchy -check; proc; opt; abc -liberty" },
      { task: "Library", synopsys: "target_library / link_library (.db)", cadence: "set_db library (.lib)", opensource: "read_liberty / abc -liberty" },
      { task: "Clock gate", synopsys: "insert_clock_gating / compile -gate_clock", cadence: "set_db lp_insert_clock_gating true", opensource: "manual ICG in RTL (limited auto)" },
      { task: "Retiming", synopsys: "optimize_registers / compile_ultra -retime", cadence: "syn_opt -retime", opensource: "abc -dff / retiming scripts" },
      { task: "Multi-Vt", synopsys: "set_max_leakage_power + HVt/LVt libs", cadence: "set_db use_multibit_cgs / leakage effort", opensource: "manual cell swap" },
      { task: "Write netlist", synopsys: "write_file -format verilog -hierarchy", cadence: "write_hdl > syn.v", opensource: "write_verilog syn.v" },
      { task: "LEC vs RTL", synopsys: "Formality (set_svf + match)", cadence: "Conformal LEC", opensource: "yosys equiv_make / abc cec" },
    ],
  },
  sta: {
    title: "STA methods by vendor",
    rows: [
      { task: "Tool", synopsys: "PrimeTime", cadence: "Tempus", opensource: "OpenSTA" },
      { task: "Link design", synopsys: "read_verilog; link; read_parasitics", cadence: "read_netlist; read_spef", opensource: "read_verilog; link_design; read_spef" },
      { task: "Update", synopsys: "update_timing", cadence: "update_timing -full", opensource: "report_checks (implicit)" },
      { task: "WNS/TNS", synopsys: "report_qor / report_timing", cadence: "report_timing -late", opensource: "report_checks -digits 3" },
      { task: "SI / crosstalk", synopsys: "si_enable_analysis true", cadence: "set_delay_cal_mode -siAware true", opensource: "limited / none" },
      { task: "OCV", synopsys: "set_timing_derate / POCV", cadence: "set_timing_derate / SOCV", opensource: "set_timing_derate" },
      { task: "ECO", synopsys: "write_changes / PrimeTime ECO", cadence: "write_eco_opt_db", opensource: "manual netlist patch" },
    ],
  },
  sdc: {
    title: "SDC — same language, different loaders",
    rows: [
      { task: "Load", synopsys: "source constraints.sdc", cadence: "read_sdc constraints.sdc", opensource: "read_sdc constraints.sdc" },
      { task: "Objects", synopsys: "[get_ports clk] [get_clocks *]", cadence: "[get_ports clk]  (get_db in Innovus)", opensource: "[get_ports clk]" },
      { task: "Generated clocks", synopsys: "create_generated_clock -divide_by", cadence: "create_generated_clock -divide_by", opensource: "create_generated_clock -divide_by" },
      { task: "Exceptions", synopsys: "set_false_path / set_multicycle_path", cadence: "same SDC names", opensource: "same SDC names (check support)" },
      { task: "Lint", synopsys: "check_timing", cadence: "check_timing / report_unconstrained", opensource: "check_setup / report_checks" },
    ],
  },
  upf: {
    title: "Power intent (UPF) by vendor",
    rows: [
      { task: "Load UPF", synopsys: "load_upf design.upf", cadence: "read_power_intent -1801 design.upf", opensource: "partial (OpenROAD PDN, not full UPF)" },
      { task: "Domains", synopsys: "create_power_domain", cadence: "create_power_domain", opensource: "PDN grid scripts" },
      { task: "Isolation", synopsys: "set_isolation + map_isolation_cell", cadence: "set_isolation", opensource: "manual ISO cells in netlist" },
      { task: "Retention", synopsys: "set_retention", cadence: "set_retention", opensource: "not standard" },
      { task: "Verify", synopsys: "VC LP / MV-simulation", cadence: "CLP / Jasper LP", opensource: "none mature" },
    ],
  },
  sim: {
    title: "Simulation / verification by vendor",
    rows: [
      { task: "Simulator", synopsys: "VCS", cadence: "Xcelium", opensource: "Verilator / Icarus / cocotb" },
      { task: "UVM", synopsys: "VCS + UVM-1.2", cadence: "Xcelium + UVM", opensource: "Verilator UVM (limited) / cocotb" },
      { task: "Coverage", synopsys: "URG / Verdi", cadence: "IMC / vManager", opensource: "Verilator --coverage" },
      { task: "Wave", synopsys: "Verdi / FSDB", cadence: "SimVision / SHM", opensource: "GTKWave / VCD / FST" },
    ],
  },
};

export function VendorMethodsChart({ domain = "tcl" }: { domain?: keyof typeof DOMAINS | string }) {
  const data = DOMAINS[domain] || DOMAINS.tcl;
  const [vendor, setVendor] = useState<Vendor | "all">("all");

  const cols: Vendor[] = ["synopsys", "cadence", "opensource"];
  const show = vendor === "all" ? cols : [vendor];

  return (
    <div
      className="ln-card my-6 overflow-hidden rounded-xl"
      style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <Boxes className="w-4 h-4" style={{ color: "var(--ln-accent)" }} />
          <div>
            <h3 className="text-sm font-bold">{data.title}</h3>
            <p className="text-[11px]" style={{ color: "var(--ln-muted)" }}>
              Same job, three consoles. Filter a vendor or compare all.
            </p>
          </div>
        </div>
        <div className="flex gap-1">
          {(["all", "synopsys", "cadence", "opensource"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVendor(v)}
              className={`ln-btn !py-1 !px-2 text-[11px] ${vendor === v ? "ln-btn-primary" : ""}`}
            >
              {v === "opensource" ? "Open source" : v === "all" ? "All" : v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr style={{ background: "var(--ln-hover)" }}>
              <th className="text-left px-3 py-2">Task</th>
              {show.includes("synopsys") && <th className="text-left px-3 py-2">Synopsys</th>}
              {show.includes("cadence") && <th className="text-left px-3 py-2">Cadence</th>}
              {show.includes("opensource") && <th className="text-left px-3 py-2">Open source</th>}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.task} style={{ borderTop: "1px solid var(--ln-border)" }}>
                <td className="px-3 py-2 font-semibold">{r.task}</td>
                {show.includes("synopsys") && (
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--ln-muted)" }}>
                    {r.synopsys}
                  </td>
                )}
                {show.includes("cadence") && (
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--ln-muted)" }}>
                    {r.cadence}
                  </td>
                )}
                {show.includes("opensource") && (
                  <td className="px-3 py-2 font-mono" style={{ color: "var(--ln-muted)" }}>
                    {r.opensource}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
