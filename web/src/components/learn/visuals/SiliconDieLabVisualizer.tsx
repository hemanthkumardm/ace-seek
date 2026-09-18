"use client";

import React, { useState } from "react";
import { Maximize2, ExternalLink, Cpu, Layers, Sparkles, Box, ChevronDown, ChevronUp } from "lucide-react";

export function SiliconDieLabVisualizer() {
  const [showInline, setShowInline] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Visualizer Hero Launch Card */}
      <div className="p-6 bg-gradient-to-r from-[#031525] via-[#051a2e] to-[#04111d] flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-950 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
              <Box className="w-3 h-3 text-cyan-400" />
              Interactive 3D Simulation
            </span>
            <span className="text-xs text-slate-400 font-mono">Schematic 3D WebGL Engine</span>
          </div>

          <h3 className="text-lg font-bold text-white tracking-tight">
            3D Silicon Die, Wafer Fab &amp; Advanced Packaging Lab
          </h3>

          <p className="text-xs leading-relaxed text-slate-300">
            Full-screen interactive 3D environment: 15-step wafer fab sequence (ingot, litho, STI, CMP, TDDB), BEOL metallization stacks (M1–M5), clock and power grids, and advanced multi-die packaging (Wirebond $\rightarrow$ Flip-Chip $\rightarrow$ 2.5D Silicon Interposer with HBM $\rightarrow$ 3D Hybrid Bonding).
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-slate-400">
            <span className="flex items-center gap-1 text-cyan-400">
              <Cpu className="w-3 h-3" />
              15-Step Fab Sequence
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Layers className="w-3 h-3" />
              BEOL Layers (M1–M5)
            </span>
            <span className="flex items-center gap-1 text-purple-400">
              <Sparkles className="w-3 h-3" />
              2.5D/3D Chiplet &amp; HBM
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto">
          <a
            href="/die_viewer_3d.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 rounded-xl font-bold text-xs bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Launch 3D Lab in New Tab</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => setShowInline(!showInline)}
            className="px-4 py-2.5 rounded-xl font-mono text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
          >
            {showInline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showInline ? "Hide Inline Canvas" : "Preview Canvas Inline"}</span>
          </button>
        </div>
      </div>

      {/* Embedded 3D Canvas / Frame (Optional Inline Preview) */}
      {showInline && (
        <div className="border-t border-slate-800">
          <div className="flex items-center justify-between px-4 py-2 bg-[#0a1224] border-b border-slate-800 text-[11px] font-mono text-slate-400">
            <span>Inline 3D Preview Mode</span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1 border border-slate-700 transition"
            >
              <Maximize2 className="w-3 h-3 text-cyan-400" />
              <span>{isExpanded ? "Standard Height" : "Expand Height"}</span>
            </button>
          </div>

          <div className="relative w-full bg-slate-950">
            <iframe
              src="/die_viewer_3d.html"
              className={`w-full transition-all duration-300 border-0 ${
                isExpanded ? "h-[850px]" : "h-[600px]"
              }`}
              title="3D Silicon Die & Fabrication Lab"
            />
          </div>
        </div>
      )}
    </div>
  );
}
