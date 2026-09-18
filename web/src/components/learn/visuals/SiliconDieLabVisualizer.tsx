"use client";

import React, { useState } from "react";
import { Maximize2, ExternalLink, Cpu, Layers, Sparkles } from "lucide-react";

export function SiliconDieLabVisualizer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="my-8 rounded-2xl border border-cyan-500/30 bg-[#070d19] overflow-hidden shadow-2xl">
      {/* Visualizer Control Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#0a1224] border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
          <span className="font-mono font-bold text-cyan-300 tracking-wider uppercase text-[11px]">
            Interactive 3D Silicon Die, Fabrication &amp; Advanced Packaging Lab
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1.5 transition-colors border border-slate-700"
            title={isExpanded ? "Collapse View" : "Expand View"}
          >
            <Maximize2 className="w-3 h-3 text-cyan-400" />
            <span>{isExpanded ? "Collapse" : "Expand Height"}</span>
          </button>

          <a
            href="/die_viewer_3d.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5 transition-colors border border-cyan-500/40"
          >
            <span>Launch Standalone</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Embedded 3D Canvas / Frame */}
      <div className="relative w-full bg-slate-950">
        <iframe
          src="/die_viewer_3d.html"
          className={`w-full transition-all duration-300 border-0 ${
            isExpanded ? "h-[850px]" : "h-[620px]"
          }`}
          title="3D Silicon Die & Fabrication Lab"
        />
      </div>

      {/* Interactive Lab Hints & Controls Strip */}
      <div className="p-4 bg-[#091122] border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-[11px] text-slate-400">
        <div className="flex flex-wrap items-center gap-4 font-mono">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <Cpu className="w-3.5 h-3.5" />
            <span>15-Step Fab Timeline</span>
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Layers className="w-3.5 h-3.5" />
            <span>BEOL Metal Stack (M1–M5)</span>
          </span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2.5D/3D Chiplet &amp; HBM</span>
          </span>
        </div>
        <p className="text-slate-400 text-[11px]">
          Click and drag in the canvas to orbit · Scroll to zoom · Use the HUD on the left to toggle metal layers and fab steps.
        </p>
      </div>
    </div>
  );
}
