"use client";

import React, { useState } from "react";
import { Cpu, Box, ArrowRight, Layers, Activity, CheckCircle2, AlertCircle } from "lucide-react";

export function PhysicalSynthesisVisualizer() {
  const [useDef, setUseDef] = useState<boolean>(true);

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
              Physical-Aware Topographical Synthesis Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              DEF floorplan-guided early placement and Steiner tree wire parasitic RC extraction
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => setUseDef((d) => !d)}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            useDef
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
              : "bg-[var(--ln-accent)] text-slate-950"
          }`}
        >
          {useDef ? "✓ Topographical Mode (DEF Floorplan)" : "Zero Wire Load Mode (WLM Flat)"}
        </button>
      </div>

      {/* 2D Die Floorplan Schematic Viewport */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">2D Silicon Die Floorplan (2500 µm × 2500 µm)</span>
          <span className={`font-bold ${useDef ? "text-emerald-400" : "text-rose-400"}`}>
            {useDef ? "Real Steiner Parasitic Extraction" : "Blind Fanout Estimate"}
          </span>
        </div>

        {/* Visual Die Floorplan Grid */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 relative h-48 flex items-center justify-center overflow-hidden">
          {/* Macro 1 (SRAM 0) */}
          <div className="absolute top-4 left-4 p-3 rounded-lg bg-indigo-950 border border-indigo-500/80 text-indigo-300 text-center font-bold text-[10px]">
            <div>SRAM_MACRO_0</div>
            <div className="text-[8px] text-slate-400">Placed: (200, 1800)</div>
          </div>

          {/* Macro 2 (SRAM 1) */}
          <div className="absolute top-4 right-4 p-3 rounded-lg bg-indigo-950 border border-indigo-500/80 text-indigo-300 text-center font-bold text-[10px]">
            <div>SRAM_MACRO_1</div>
            <div className="text-[8px] text-slate-400">Placed: (1600, 1800)</div>
          </div>

          {/* Standard Cell Core Area */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/60 text-cyan-300 text-center max-w-xs shadow-inner">
            <div className="font-black text-xs">Standard Cell Core Logic</div>
            <div className="text-[9px] text-slate-400 mt-1">
              {useDef
                ? "Steiner Minimal Tree: Long bus routes buffered on upper M7/M8 layers"
                : "Wire Load Model: Assumes all nets are 50 µm long"}
            </div>
          </div>

          {/* Long Bus Route Line */}
          {useDef && (
            <div className="absolute bottom-4 left-6 right-6 p-2 rounded bg-emerald-950/70 border border-emerald-500 text-emerald-300 text-center text-[10px] font-bold animate-pulse">
              ✓ Physical Route: 1,800 µm 64-Bit Memory Bus (Steiner Delay: 0.44 ns correctly predicted!)
            </div>
          )}
        </div>

        {/* Comparison Metrics */}
        <div className="grid sm:grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Interconnect Wire Delay:</span>
            <span className="font-black text-cyan-300 text-sm">{useDef ? "0.48 ns (Accurate)" : "0.08 ns (False Estimate)"}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Signoff Correlation:</span>
            <span className={`font-black text-sm ${useDef ? "text-emerald-400" : "text-rose-400"}`}>
              {useDef ? "96% Correlation with P&R ✓" : "42% Post-Layout Timing Blowup ❌"}
            </span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Routing Congestion:</span>
            <span className="font-black text-amber-300 text-sm">{useDef ? "0.2% Hotspots (Resolved)" : "Unknown (Blind Compile)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
