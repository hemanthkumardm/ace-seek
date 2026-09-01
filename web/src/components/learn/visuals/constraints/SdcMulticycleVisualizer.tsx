"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Activity, Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export function SdcMulticycleVisualizer() {
  const [setupMultiplier, setSetupMultiplier] = useState<number>(2); // N cycles
  const [customHold, setCustomHold] = useState<number | null>(null);

  const holdMultiplier = customHold !== null ? customHold : setupMultiplier - 1; // N-1 standard rule
  const clockPeriod = 2.0; // ns

  const setupTimeNs = setupMultiplier * clockPeriod;
  const holdTimeNs = holdMultiplier * clockPeriod;

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
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              SDC Multicycle Path (MCP) Setup &amp; Hold Timing Inspector
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Visualizing the critical $N$-Cycle Setup and $(N-1)$-Cycle Hold check edge relationships
            </p>
          </div>
        </div>

        {/* Setup Multiplier Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {[1, 2, 3, 4].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setSetupMultiplier(m);
                setCustomHold(null);
              }}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                setupMultiplier === m
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {m === 1 ? "1-Cycle (Default)" : `${m}-Cycle MCP`}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Timing Check Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">
            {setupMultiplier === 1
              ? "Standard Single-Cycle Path (Launch Edge 0 ➔ Capture Edge 1)"
              : `Multi-Cycle Path Exception (Setup: ${setupMultiplier} Cycles, Hold: ${holdMultiplier} Cycles)`}
          </span>
          <span className="text-emerald-400 font-bold">
            Allowable Logic Delay: {setupTimeNs.toFixed(1)} ns
          </span>
        </div>

        {/* Multi-Clock Cycle Waveform Diagram */}
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Clock Edge Timeline (T_clk = 2.0 ns):</div>

          {/* Launch Clock */}
          <div className="space-y-1">
            <div className="text-[10px] text-cyan-300 font-bold">Launch Clock (`clk_launch`):</div>
            <div className="h-8 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center">
              {[0, 1, 2, 3, 4].map((cycle) => (
                <div key={cycle} className="h-full flex-1 border-r border-slate-700 flex items-center justify-between px-2 text-[9px]">
                  <span className={cycle === 0 ? "text-cyan-400 font-black" : "text-slate-600"}>
                    Edge {cycle} ({cycle * 2}ns)
                  </span>
                  {cycle === 0 && <span className="p-0.5 px-1.5 rounded bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold">LAUNCH</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Capture Clock with Setup & Hold Check Markers */}
          <div className="space-y-1">
            <div className="text-[10px] text-emerald-300 font-bold">Capture Clock (`clk_capture`):</div>
            <div className="h-8 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center">
              {[0, 1, 2, 3, 4].map((cycle) => {
                const isSetupCapture = cycle === setupMultiplier;
                const isHoldCheck = cycle === holdMultiplier;
                return (
                  <div
                    key={cycle}
                    className={`h-full flex-1 border-r flex items-center justify-between px-2 text-[9px] ${
                      isSetupCapture
                        ? "bg-emerald-950/70 border-emerald-400 text-emerald-300 font-black ring-1 ring-emerald-400"
                        : isHoldCheck && setupMultiplier > 1
                        ? "bg-amber-950/60 border-amber-400 text-amber-200"
                        : "border-slate-700 text-slate-600"
                    }`}
                  >
                    <span>Edge {cycle}</span>
                    {isSetupCapture && <span className="p-0.5 px-1 rounded bg-emerald-500 text-slate-950 font-black">SETUP CHECK</span>}
                    {isHoldCheck && setupMultiplier > 1 && <span className="p-0.5 px-1 rounded bg-amber-500 text-slate-950 font-black">HOLD CHECK</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Rule Explanation Box */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Why the $(N-1)$ Hold Multiplier Rule is Mandatory:</div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            When you declare a {setupMultiplier}-cycle setup exception without modifying hold, STA tools default to checking hold against the clock edge immediately preceding the capture edge ($N-1$). Without <code>-hold {setupMultiplier - 1}</code>, the tool incorrectly checks hold at Edge {setupMultiplier - 1} instead of Edge 0, forcing massive, bogus buffer insertion!
          </p>
        </div>

        {/* SDC Syntax Block */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Correct SDC Command Pair:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{setupMultiplier === 1
  ? `# Standard single-cycle path (No exceptions required):
# Setup checked at Capture Edge 1 (2.0ns), Hold checked at Edge 0 (0.0ns).`
  : `# Setup Multicycle (${setupMultiplier} clock cycles = ${setupTimeNs}ns logic budget):
set_multicycle_path -setup ${setupMultiplier} -from [get_pins u_math/Q] -to [get_pins u_accum/D]

# Mandatory Hold Multiplier (${holdMultiplier} = N - 1) to restore Hold check to Launch Edge 0:
set_multicycle_path -hold  ${holdMultiplier} -from [get_pins u_math/Q] -to [get_pins u_accum/D]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
