"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Layers, GitBranch, Split, CheckCircle2 } from "lucide-react";

export function BoundaryOptimizationVisualizer() {
  const [ungrouped, setUngrouped] = useState<boolean>(true);

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
              Hierarchical vs. Flat Boundary Optimization Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Ungrouping module boundaries to propagate static constants and merge cross-boundary redundant logic
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => setUngrouped((u) => !u)}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            ungrouped
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
              : "bg-[var(--ln-accent)] text-slate-950"
          }`}
        >
          {ungrouped ? "✓ Ungrouping: ENABLED (Flat)" : "Hierarchy: PRESERVED (Locked Ports)"}
        </button>
      </div>

      {/* Visual Module Boundary Diagram */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Cross-Module Boundary: `u_transmitter` ➔ `u_receiver`</span>
          <span className={`font-bold ${ungrouped ? "text-emerald-400" : "text-amber-400"}`}>
            {ungrouped ? "Merged Cross-Boundary Logic (-28% Area)" : "Locked Hierarchical Ports"}
          </span>
        </div>

        {/* Hardware Block Schematics */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Module A */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Module A (Transmitter)</span>
              <span className="text-cyan-400">Output Port: `tx_data`</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-300">
              <div>Logic: <code>assign tx_data = ~internal_sig;</code></div>
              <div className="text-[10px] text-amber-400">
                {ungrouped ? "➔ Inverter merged with receiver!" : "➔ Output bounded by `sky130_fd_sc_hd__inv_2` standard cell"}
              </div>
            </div>
          </div>

          {/* Module B */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Module B (Receiver)</span>
              <span className="text-cyan-400">Input Port: `rx_data`</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] text-slate-300">
              <div>Logic: <code>assign internal_dec = ~rx_data;</code></div>
              <div className="text-[10px] text-amber-400">
                {ungrouped ? "➔ Inverter merged (~(~sig) = wire)!" : "➔ Input driven by `sky130_fd_sc_hd__inv_1` standard cell"}
              </div>
            </div>
          </div>
        </div>

        {/* Boundary Optimization Result Summary */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synthesizer Optimization Action:</div>
          <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300 leading-relaxed font-sans">
            {ungrouped ? (
              <span className="text-emerald-300 font-bold">
                ✓ Two cascaded inverters across module boundaries collapsed into a direct zero-delay wire (`sky130 inv + inv = wire`). Constant `tie_zero=0` propagated through Module B input pins, eliminating 32 redundant logic gates!
              </span>
            ) : (
              <span className="text-amber-300 font-bold">
                ⚠️ Hierarchical compile keeps module ports intact. Synthesizer cannot optimize across boundaries, leaving redundant back-to-back inverters and un-propagated constants in place (+28% area penalty).
              </span>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Total Cell Area:</span>
            <span className="font-black text-cyan-300 text-sm">{ungrouped ? "84.2 µm²" : "117.0 µm²"}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Gate Delay:</span>
            <span className="font-black text-emerald-300 text-sm">{ungrouped ? "1.12 ns" : "1.48 ns"}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Gate Count:</span>
            <span className="font-black text-amber-300 text-sm">{ungrouped ? "36 Cells" : "54 Cells"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
