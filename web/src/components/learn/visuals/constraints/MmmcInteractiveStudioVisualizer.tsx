"use client";

import React, { useState } from "react";
import { Grid, Layers, Cpu, CheckCircle2, ShieldCheck, Zap, Sliders, Play, Code2 } from "lucide-react";

type MmmcMode = "func_high_perf" | "func_low_power" | "scan_shift" | "scan_at_speed" | "sleep_retention";
type MmmcCorner = "ss_125c_rcworst" | "ss_m40c_rcworst" | "ff_m40c_rcbest" | "ff_125c_rcbest" | "tt_25c_typical";

export function MmmcInteractiveStudioVisualizer() {
  const [activeModes, setActiveModes] = useState<Record<MmmcMode, boolean>>({
    func_high_perf: true,
    func_low_power: false,
    scan_shift: true,
    scan_at_speed: false,
    sleep_retention: false,
  });

  const [activeCorners, setActiveCorners] = useState<Record<MmmcCorner, boolean>>({
    ss_125c_rcworst: true,
    ss_m40c_rcworst: false,
    ff_m40c_rcbest: true,
    ff_125c_rcbest: false,
    tt_25c_typical: true,
  });

  const [toolSyntax, setToolSyntax] = useState<"cadence" | "synopsys">("cadence");

  const modeDefs: Record<MmmcMode, { label: string; sdc: string; desc: string }> = {
    func_high_perf: { label: "Func High-Perf (1.8V)", sdc: "constraints/func_high_perf.sdc", desc: "500 MHz mission mode, active CPU & GPU clocks." },
    func_low_power: { label: "Func Low-Power (1.2V)", sdc: "constraints/func_low_power.sdc", desc: "100 MHz degraded voltage battery saver mode." },
    scan_shift: { label: "DFT Scan Shift (50MHz)", sdc: "constraints/dft_scan_shift.sdc", desc: "Slow test clock, scan_enable asserted, loose setup." },
    scan_at_speed: { label: "DFT At-Speed Capture", sdc: "constraints/dft_at_speed.sdc", desc: "Full-speed capture pulse for transition fault ATPG." },
    sleep_retention: { label: "Deep Sleep / Retention", sdc: "constraints/sleep_retention.sdc", desc: "Clocks gated, power switched off to active domains." },
  };

  const cornerDefs: Record<MmmcCorner, { label: string; lib: string; rc: string; type: "setup" | "hold" | "leakage" | "typical" }> = {
    ss_125c_rcworst: { label: "SS / 1.62V / 125°C / RCworst", lib: "sky130_fd_sc_hd__ss_125C_1v62.lib", rc: "rc_worst.tluplus", type: "setup" },
    ss_m40c_rcworst: { label: "SS / 1.62V / -40°C / RCworst (Cold Delay)", lib: "sky130_fd_sc_hd__ss_m40C_1v62.lib", rc: "rc_worst.tluplus", type: "setup" },
    ff_m40c_rcbest: { label: "FF / 1.98V / -40°C / RCbest", lib: "sky130_fd_sc_hd__ff_m40C_1v98.lib", rc: "rc_best.tluplus", type: "hold" },
    ff_125c_rcbest: { label: "FF / 1.98V / 125°C / Typical (Worst Leakage)", lib: "sky130_fd_sc_hdll__ff_125C_1v98.lib", rc: "typical.tluplus", type: "leakage" },
    tt_25c_typical: { label: "TT / 1.80V / 25°C / Typical", lib: "sky130_fd_sc_hd__tt_025C_1v80.lib", rc: "typical.tluplus", type: "typical" },
  };

  const enabledModes = Object.keys(activeModes).filter((k) => activeModes[k as MmmcMode]) as MmmcMode[];
  const enabledCorners = Object.keys(activeCorners).filter((k) => activeCorners[k as MmmcCorner]) as MmmcCorner[];
  const totalViews = enabledModes.length * enabledCorners.length;

  const toggleMode = (m: MmmcMode) => {
    setActiveModes((prev) => ({ ...prev, [m]: !prev[m] }));
  };

  const toggleCorner = (c: MmmcCorner) => {
    setActiveCorners((prev) => ({ ...prev, [c]: !prev[c] }));
  };

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
            <Grid className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Multi-Mode Multi-Corner (MMMC / MCMM) View Matrix Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive constraint modes $\times$ PVT standard cell libraries $\times$ parasitic RC corners signoff generator
            </p>
          </div>
        </div>

        {/* View Count Badge */}
        <span className="px-3 py-1 rounded-full bg-cyan-950 border border-cyan-400 text-cyan-300 font-mono text-xs font-bold">
          Active Signoff Views: {totalViews} ({enabledModes.length} Modes × {enabledCorners.length} Corners)
        </span>
      </div>

      {/* Mode & Corner Selection Toggles */}
      <div className="grid md:grid-cols-2 gap-4 mb-4 font-mono text-xs">
        {/* Constraint Modes */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-[10px] text-cyan-400 font-bold uppercase flex justify-between">
            <span>1. Constraint Modes (SDC Personalities)</span>
            <span>{enabledModes.length} Selected</span>
          </div>
          <div className="space-y-1.5">
            {(Object.keys(modeDefs) as MmmcMode[]).map((m) => {
              const checked = activeModes[m];
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => toggleMode(m)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                    checked
                      ? "bg-cyan-950/70 border-cyan-400 text-cyan-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs">{modeDefs[m].label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${checked ? "bg-cyan-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>
                    {checked ? "ACTIVE" : "OFF"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* PVT & RC Corners */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="text-[10px] text-amber-400 font-bold uppercase flex justify-between">
            <span>2. PVT Delay &amp; RC Parasitic Corners</span>
            <span>{enabledCorners.length} Selected</span>
          </div>
          <div className="space-y-1.5">
            {(Object.keys(cornerDefs) as MmmcCorner[]).map((c) => {
              const checked = activeCorners[c];
              const def = cornerDefs[c];
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCorner(c)}
                  className={`w-full p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
                    checked
                      ? "bg-amber-950/70 border-amber-400 text-amber-200"
                      : "bg-slate-900/60 border-slate-800 text-slate-500 hover:border-slate-700"
                  }`}
                >
                  <span className="font-bold text-xs">{def.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${checked ? "bg-amber-400 text-slate-950 font-bold" : "bg-slate-800 text-slate-400"}`}>
                    {def.type.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live MMMC Matrix View Grid */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <span className="text-cyan-300 font-bold">Active Analysis View Matrix Table:</span>
          {/* Syntax Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setToolSyntax("cadence")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                toolSyntax === "cadence" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Cadence Innovus / Tempus
            </button>
            <button
              type="button"
              onClick={() => setToolSyntax("synopsys")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                toolSyntax === "synopsys" ? "bg-cyan-400 text-slate-950" : "text-slate-400 hover:text-white"
              }`}
            >
              Synopsys PrimeTime / DC
            </button>
          </div>
        </div>

        {/* View Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="p-2">Analysis View Name</th>
                <th className="p-2">Constraint Mode (SDC)</th>
                <th className="p-2">Library (.lib)</th>
                <th className="p-2">RC Parasitics</th>
                <th className="p-2">Signoff Check</th>
              </tr>
            </thead>
            <tbody>
              {enabledModes.map((m) =>
                enabledCorners.map((c) => {
                  const mDef = modeDefs[m];
                  const cDef = cornerDefs[c];
                  const viewName = `view_${m}_${c}`;
                  return (
                    <tr key={`${m}_${c}`} className="border-b border-slate-900 hover:bg-slate-900/50">
                      <td className="p-2 font-bold text-cyan-300">{viewName}</td>
                      <td className="p-2 text-slate-300">{mDef.sdc}</td>
                      <td className="p-2 text-amber-300">{cDef.lib.split(".")[0]}</td>
                      <td className="p-2 text-emerald-300">{cDef.rc}</td>
                      <td className="p-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          cDef.type === "setup" ? "bg-rose-950 text-rose-300 border border-rose-600" :
                          cDef.type === "hold" ? "bg-emerald-950 text-emerald-300 border border-emerald-600" :
                          cDef.type === "leakage" ? "bg-amber-950 text-amber-300 border border-amber-600" :
                          "bg-slate-800 text-slate-300"
                        }`}>
                          {cDef.type.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Generated Tool Script Preview */}
        <div className="space-y-1 pt-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">
            Live Generated {toolSyntax === "cadence" ? "Cadence Innovus (mmmc.tcl)" : "Synopsys PrimeTime (mcmm.tcl)"} Script:
          </div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-64">
{toolSyntax === "cadence"
  ? `# ==============================================================================
# Cadence Innovus / Tempus MMMC Configuration of Record
# Generated Views: ${totalViews}
# ==============================================================================

# 1. Define Constraint Modes
${enabledModes.map((m) => `create_constraint_mode -name mode_${m} -sdc_files {${modeDefs[m].sdc}}`).join("\n")}

# 2. Define Library Sets & RC Corners
${enabledCorners.map((c) => `create_library_set -name lib_${c} -timing {libs/${cornerDefs[c].lib}}`).join("\n")}
${enabledCorners.map((c) => `create_rc_corner   -name rc_${c} -tluplus {tluplus/${cornerDefs[c].rc}}`).join("\n")}

# 3. Create Delay Corners
${enabledCorners.map((c) => `create_delay_corner -name dc_${c} -library_set lib_${c} -rc_corner rc_${c}`).join("\n")}

# 4. Create Analysis Views
${enabledModes
  .flatMap((m) =>
    enabledCorners.map(
      (c) => `create_analysis_view -name view_${m}_${c} -constraint_mode mode_${m} -delay_corner dc_${c}`
    )
  )
  .join("\n")}

# 5. Set Active Signoff Views for Setup and Hold
set_analysis_view \\
  -setup {${enabledModes.flatMap((m) => enabledCorners.filter((c) => cornerDefs[c].type === "setup").map((c) => `view_${m}_${c}`)).join(" ")}} \\
  -hold  {${enabledModes.flatMap((m) => enabledCorners.filter((c) => cornerDefs[c].type === "hold").map((c) => `view_${m}_${c}`)).join(" ")}}`
  : `# ==============================================================================
# Synopsys PrimeTime / Design Compiler Multi-Corner Multi-Mode (MCMM) Setup
# Generated Scenarios: ${totalViews}
# ==============================================================================

# 1. Define Scenarios and Assign SDC & Parasitics
${enabledModes
  .flatMap((m) =>
    enabledCorners.map((c) =>
      `create_scenario scenario_${m}_${c}\ncurrent_scenario scenario_${m}_${c}\nset_target_library "libs/${cornerDefs[c].lib}"\nread_sdc "${modeDefs[m].sdc}"\nread_parasitics -format TLUPlus "tluplus/${cornerDefs[c].rc}"`
    )
  )
  .join("\n\n")}

# 2. Set Active Scenarios for Signoff
set_active_scenarios {${enabledModes.flatMap((m) => enabledCorners.map((c) => `scenario_${m}_${c}`)).join(" ")}}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
