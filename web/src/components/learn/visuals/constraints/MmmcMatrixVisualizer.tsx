"use client";

import React, { useState } from "react";
import { Cpu, Layers, Grid, Activity, Zap, CheckCircle2, ShieldAlert } from "lucide-react";

export function MmmcMatrixVisualizer() {
  const [selectedView, setSelectedView] = useState<string>("VIEW_FUNC_SS");

  const views = {
    VIEW_FUNC_SS: {
      name: "view_func_slow_max (Setup Signoff)",
      mode: "Mode: Functional (Mission Mode)",
      corner: "Corner: SS / 1.62V / 125°C / RCworst",
      sdc: "constraints/func_mission.sdc",
      lib: "sky130_fd_sc_hd__ss_125C_1v62.db",
      rc: "tluplus/rc_worst.tluplus",
      check: "Max Delay (Setup Timing WNS / TNS)",
      target: "Verify maximum frequency target (500 MHz) under worst-case voltage & temperature.",
    },
    VIEW_FUNC_FF: {
      name: "view_func_fast_min (Hold Signoff)",
      mode: "Mode: Functional (Mission Mode)",
      corner: "Corner: FF / 1.98V / -40°C / Cbest",
      sdc: "constraints/func_mission.sdc",
      lib: "sky130_fd_sc_hd__ff_m40C_1v98.db",
      rc: "tluplus/c_best.tluplus",
      check: "Min Delay (Hold Timing WHS / THS)",
      target: "Verify minimum delay hold constraints without fast race-through contamination.",
    },
    VIEW_SCAN_SS: {
      name: "view_scan_slow_max (DFT At-Speed Setup)",
      mode: "Mode: Scan Test (Shift & Capture)",
      corner: "Corner: SS / 1.62V / 125°C / RCworst",
      sdc: "constraints/dft_scan.sdc",
      lib: "sky130_fd_sc_hd__ss_125C_1v62.db",
      rc: "tluplus/rc_worst.tluplus",
      check: "Max Delay (Scan Shift 50 MHz & At-Speed Capture)",
      target: "Verify manufacturing ATPG test pattern integrity under scan enable assertion.",
    },
    VIEW_SLEEP_LEAK: {
      name: "view_sleep_leakage (Standby Power Signoff)",
      mode: "Mode: Sleep / Deep Power-Down",
      corner: "Corner: FF / 1.98V / 125°C (Worst Leakage)",
      sdc: "constraints/sleep_retention.sdc",
      lib: "sky130_fd_sc_hdll__ff_125C_1v98.db",
      rc: "tluplus/typical.tluplus",
      check: "Static Sub-Threshold Leakage Power",
      target: "Verify retention register state integrity and static leakage consumption.",
    },
  };

  const curr = views[selectedView as keyof typeof views];

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
              Multi-Mode Multi-Corner (MMMC) Analysis View Matrix
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Binding Constraint Modes (SDC) $\times$ PVT Library Corners $\times$ Parasitic RC Corners
            </p>
          </div>
        </div>
      </div>

      {/* MMMC Matrix Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2 mb-4 font-mono text-xs">
        {Object.entries(views).map(([key, v]) => {
          const isSelected = selectedView === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedView(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400"
                  : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
              }`}
            >
              <div className="text-[10px] text-cyan-400 uppercase font-bold mb-0.5">{v.mode.split(":")[0]}</div>
              <div className="font-bold text-xs text-white mb-1 truncate">{v.name.split(" ")[0]}</div>
              <div className="text-[10px] text-slate-400 font-sans">{v.check.split("(")[0]}</div>
            </button>
          );
        })}
      </div>

      {/* Analysis View Card */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <div>
            <span className="text-cyan-300 font-bold block">{curr.name}</span>
            <span className="text-[10px] text-slate-400">{curr.mode} · {curr.corner}</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-emerald-300 text-[10px] font-bold">
            Signoff Target: {curr.check}
          </span>
        </div>

        {/* View Configuration Breakdown */}
        <div className="grid sm:grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">1. SDC Constraint File:</span>
            <span className="text-cyan-300 font-bold text-xs">{curr.sdc}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">2. Standard Cell Library:</span>
            <span className="text-amber-300 font-bold text-xs">{curr.lib}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">3. Parasitic RC Model:</span>
            <span className="text-emerald-300 font-bold text-xs">{curr.rc}</span>
          </div>
        </div>

        {/* Description Box */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-sans text-slate-300">
          💡 <span className="font-bold text-white">Signoff Objective:</span> {curr.target}
        </div>

        {/* Cadence / Synopsys MMMC Script Snippet */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Cadence Innovus / Tempus MMMC Definition Script (`mmmc.tcl`):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# 1. Create Constraint Mode
create_constraint_mode -name mode_func -sdc_files {constraints/func_mission.sdc}

# 2. Create Library Sets & RC Corners
create_library_set -name lib_slow -timing {libs/sky130_fd_sc_hd__ss_125C_1v62.lib}
create_rc_corner   -name rc_worst -tluplus {tluplus/rc_worst.tluplus}

# 3. Create Delay Corners
create_delay_corner -name dc_slow_max -library_set lib_slow -rc_corner rc_worst

# 4. Create Active Analysis View
create_analysis_view -name view_func_slow_max \\
  -constraint_mode mode_func \\
  -delay_corner    dc_slow_max

# 5. Set Active Signoff Views for Setup & Hold
set_analysis_view -setup {view_func_slow_max} -hold {view_func_fast_min}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
