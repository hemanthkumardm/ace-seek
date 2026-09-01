"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Layers, Sparkles, CheckCircle2, Split } from "lucide-react";

export function BooleanOptimizationVisualizer() {
  const [optStyle, setOptStyle] = useState<"FLAT_SOP" | "FACTORED" | "SHANNON">("FACTORED");

  const styles = {
    FLAT_SOP: {
      name: "Flat Sum-of-Products (SOP)",
      expr: "F = A·C + A·D + B·C + B·D",
      literals: 8,
      gates: "4x 2-Input ANDs + 1x 4-Input OR (5 Gates)",
      depth: "2 Levels of Logic",
      area: "24.2 µm²",
      speed: "0.24 ns",
      desc: "Direct unoptimized canonical two-level representation. High gate count and high input pin loading.",
    },
    FACTORED: {
      name: "Algebraic Factored Tree Form",
      expr: "F = (A + B) · (C + D)",
      literals: 4,
      gates: "2x 2-Input ORs + 1x 2-Input AND (3 Gates)",
      depth: "2 Levels of Logic",
      area: "12.8 µm² (-47% Area)",
      speed: "0.14 ns (+42% Faster)",
      desc: "Factored multi-level network sharing product terms. Cuts literal count in half with identical functionality!",
    },
    SHANNON: {
      name: "Shannon Expansion for Late-Arriving Signal",
      expr: "F = LateA · (C + D) + ~LateA · (B·(C + D)) ➔ MUX2(LateA, F1, F0)",
      literals: 5,
      gates: "Logic Cones F0, F1 + 1x 2:1 Output MUX",
      depth: "1 Gate Delay for Signal LateA",
      area: "18.0 µm²",
      speed: "0.06 ns (Critical Late Signal Boost!)",
      desc: "Decomposes late-arriving critical signal directly to the final 2:1 multiplexer stage to achieve timing closure.",
    },
  };

  const curr = styles[optStyle];

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
              Boolean Restructuring &amp; Shannon Expansion Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Algebraic kernel factoring, tree balancing, and Shannon co-factoring for high-speed critical paths
            </p>
          </div>
        </div>

        {/* Style Selectors */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["FLAT_SOP", "FACTORED", "SHANNON"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setOptStyle(s)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                optStyle === s
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {s === "FLAT_SOP" ? "Flat SOP" : s === "FACTORED" ? "Factored Form" : "Shannon Expansion"}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">{curr.name}</span>
          <span className="text-emerald-400 font-bold">Literals: {curr.literals}</span>
        </div>

        {/* Expression Box */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synthesized Boolean Function:</div>
          <div className="text-sm md:text-base font-black text-amber-300">{curr.expr}</div>
          <p className="text-[11px] text-slate-400 font-sans">{curr.desc}</p>
        </div>

        {/* Metric Comparison Card */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Gate Implementation:</span>
            <span className="font-black text-cyan-300 text-xs">{curr.gates}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Logic Depth:</span>
            <span className="font-black text-emerald-300 text-xs">{curr.depth}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Total Gate Area:</span>
            <span className="font-black text-amber-300 text-xs">{curr.area}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Critical Propagation:</span>
            <span className="font-black text-emerald-400 text-xs">{curr.speed}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
