"use client";

import React, { useState } from "react";
import { Cpu, Wrench, ArrowRight, Layers, Zap, CheckCircle2 } from "lucide-react";

export function EcoSpareCellVisualizer() {
  const [ecoActive, setEcoActive] = useState<boolean>(true);

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
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Metal-Only Spare Cell Engineering Change Order (ECO) Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Rewiring pre-placed uncommitted spare gates via upper metal layers to patch silicon logic bugs
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => setEcoActive((e) => !e)}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            ecoActive
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
              : "bg-[var(--ln-accent)] text-slate-950"
          }`}
        >
          <Wrench className="w-3.5 h-3.5" />
          {ecoActive ? "✓ Spare Gate: CONNECTED (ECO Patched)" : "Spare Gate: FLOATING (Unused Base)"}
        </button>
      </div>

      {/* Die Grid & Spare Gate Viewport */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Silicon Floorplan Spare Cell: `u_spare_nand_42` (sky130_fd_sc_hd__nand2_1)</span>
          <span className={`font-bold ${ecoActive ? "text-emerald-400" : "text-amber-400"}`}>
            Status: {ecoActive ? "Wired into Active Netlist via M4/M5" : "Inputs Tied to VSS / Floating"}
          </span>
        </div>

        {/* Silicon Schematic Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Floorplan Layout Cell */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Silicon Standard Cell Row</span>
              <span className="text-cyan-400">Layer M1-M3 Base Masks</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-[11px]">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Active Core Gate:</span>
                <span className="font-bold text-white">sky130_fd_sc_hd__dfxtp_2 (Functional Reg)</span>
              </div>
              <div
                className={`flex items-center justify-between p-2.5 rounded border ${
                  ecoActive
                    ? "bg-emerald-950/70 border-emerald-400 text-emerald-200 ring-1 ring-emerald-500"
                    : "bg-slate-900/60 border-dashed border-slate-700 text-slate-500"
                }`}
              >
                <div>
                  <div className="font-bold">u_spare_nand_42</div>
                  <div className="text-[9px]">{ecoActive ? "Active Inverter Patch" : "Pre-placed Unused Spare Gate"}</div>
                </div>
                <span className={`text-[10px] font-bold ${ecoActive ? "text-emerald-400" : "text-slate-500"}`}>
                  {ecoActive ? "WIRED (M4)" : "TIED LOW"}
                </span>
              </div>
            </div>
          </div>

          {/* Turnaround & Cost Comparison */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Tapeout Turnaround &amp; Cost Impact:</div>
            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Mask Layers Modified:</span>
                <span className="font-bold text-cyan-300">{ecoActive ? "2 Layers (Metal 4 & 5)" : "48 Layers (Full Silicon Respin)"}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">Mask Fabrication Turnaround:</span>
                <span className="font-bold text-emerald-400">{ecoActive ? "2 Weeks" : "14 Weeks (3.5 Months!)"}</span>
              </div>
              <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                <span className="text-slate-400">NRE Mask Reticle Cost:</span>
                <span className="font-bold text-amber-300">{ecoActive ? "$75,000" : "$3,800,000"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ECO Netlist Command Patch Box */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">EDA Engineering Change Order (ECO) Script:</div>
          <pre className="p-3 rounded bg-slate-950 text-emerald-300 text-[10px] leading-relaxed border border-slate-800 overflow-x-auto">
            {ecoActive
              ? `# Metal-Only ECO Netlist Patch Commands:
disconnect_net [get_nets broken_signal] [get_pins u_fsm/state_dec/A]
connect_net    [get_nets broken_signal] [get_pins u_spare_nand_42/A]
connect_net    [get_nets tie_high_vdd]  [get_pins u_spare_nand_42/B]
connect_net    [get_nets patched_signal] [get_pins u_spare_nand_42/Y]
route_eco -layers {M4 M5}`
              : `# No ECO Active - Base Netlist with uncommitted spare cell gates`}
          </pre>
        </div>
      </div>
    </div>
  );
}
