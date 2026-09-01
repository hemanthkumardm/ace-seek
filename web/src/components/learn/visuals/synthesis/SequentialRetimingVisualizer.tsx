"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Zap, Play, RotateCcw, Activity, ShieldCheck, Gauge } from "lucide-react";

export function SequentialRetimingVisualizer() {
  // Retiming State: 0: Unbalanced Initial Pipeline, 1: Retimed Balanced Pipeline
  const [retimed, setRetimed] = useState<boolean>(false);

  // Unretimed: Stage 1 (Multiplier 2.5ns + Adder 1.7ns = 4.2ns), Stage 2 (Accumulator = 1.0ns) ➔ Period = 4.2ns (238 MHz)
  // Retimed: Stage 1 (Multiplier = 2.5ns), Stage 2 (Adder 1.7ns + Accumulator 1.0ns = 2.7ns) ➔ Period = 2.7ns (370 MHz, +55% Speedup!)
  const stage1Delay = retimed ? 2.5 : 4.2;
  const stage2Delay = retimed ? 2.7 : 1.0;
  const maxDelay = Math.max(stage1Delay, stage2Delay);
  const maxFreq = Math.round(1000 / maxDelay);

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
              Sequential Register Retiming &amp; Pipeline Balancer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Moving flip-flops across combinational clouds to equalize stage delays and boost clock speed
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <button
          type="button"
          onClick={() => setRetimed((r) => !r)}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            retimed
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
              : "bg-[var(--ln-accent)] text-slate-950"
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          {retimed ? "✓ Retiming Active: EQUALIZED" : "⚡ Apply Synthesis Retiming"}
        </button>
      </div>

      {/* Circuit Schematic Viewport */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">2-Stage Multiply-Accumulate Datapath: $Y = (A \times B) + C$</span>
          <span className={`font-bold ${retimed ? "text-emerald-400" : "text-amber-400"}`}>
            Status: {retimed ? "Optimized & Balanced" : "Unbalanced Critical Path"}
          </span>
        </div>

        {/* Visual Hardware Pipeline Diagram */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3 overflow-x-auto">
          {/* Input Register FF0 */}
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/80 text-cyan-300 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-400">Launch Reg</div>
            <div className="font-black text-sm">FF_IN [A, B]</div>
            <div className="text-[9px] text-cyan-400 mt-0.5">CLK ➔ Q</div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

          {/* Combinational Logic Cloud 1: Multiplier */}
          <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/80 text-indigo-300 text-center flex-1 min-w-[120px]">
            <div className="text-[10px] text-slate-400">Math Operator</div>
            <div className="font-black text-xs">8-Bit Multiplier</div>
            <div className="text-[10px] text-indigo-400 font-bold mt-1">Delay: 2.5 ns</div>
          </div>

          {/* Intermediate Register Position (Moves on Retiming) */}
          {retimed && (
            <>
              <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0 hidden md:block animate-pulse" />
              <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-400 text-emerald-300 text-center min-w-[100px] shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-500/50 animate-in fade-in zoom-in-95 duration-300">
                <div className="text-[9px] text-emerald-400 uppercase font-black">Retimed Register</div>
                <div className="font-black text-sm">FF_STAGE1</div>
                <div className="text-[9px] text-emerald-300">Balanced Pos</div>
              </div>
            </>
          )}

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

          {/* Combinational Logic Cloud 2: Adder */}
          <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/80 text-indigo-300 text-center flex-1 min-w-[120px]">
            <div className="text-[10px] text-slate-400">Math Operator</div>
            <div className="font-black text-xs">16-Bit Adder (+C)</div>
            <div className="text-[10px] text-indigo-400 font-bold mt-1">Delay: 1.7 ns</div>
          </div>

          {!retimed && (
            <>
              <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 hidden md:block" />
              {/* Original Flop Position */}
              <div className="p-3 rounded-lg bg-amber-950/70 border border-amber-500 text-amber-200 text-center min-w-[100px]">
                <div className="text-[9px] text-amber-400 uppercase font-bold">Unretimed Reg</div>
                <div className="font-black text-sm">FF_STAGE1</div>
                <div className="text-[9px] text-amber-300/80">Old Position</div>
              </div>
            </>
          )}

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

          {/* Combinational Logic Cloud 3: Accumulator output logic */}
          <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/80 text-indigo-300 text-center flex-1 min-w-[110px]">
            <div className="text-[10px] text-slate-400">Output Steer</div>
            <div className="font-black text-xs">Accumulator Logic</div>
            <div className="text-[10px] text-indigo-400 font-bold mt-1">Delay: 1.0 ns</div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0 hidden md:block" />

          {/* Capture Register FF_OUT */}
          <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/80 text-cyan-300 text-center min-w-[90px]">
            <div className="text-[10px] text-slate-400">Capture Reg</div>
            <div className="font-black text-sm">FF_OUT [Y]</div>
            <div className="text-[9px] text-cyan-400 mt-0.5">Setup Check</div>
          </div>
        </div>

        {/* Stage Delay Comparison Bars */}
        <div className="grid md:grid-cols-2 gap-3 pt-2">
          {/* Stage 1 Bar */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>Pipeline Stage 1 Delay:</span>
              <span className={stage1Delay > 3.0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                {stage1Delay} ns {stage1Delay > 3.0 ? "(Bottleneck!)" : "(Balanced)"}
              </span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded overflow-hidden flex border border-slate-800">
              <div
                className={`h-full transition-all duration-300 flex items-center justify-center font-bold text-[10px] ${
                  stage1Delay > 3.0 ? "bg-rose-500 text-slate-950" : "bg-emerald-400 text-slate-950"
                }`}
                style={{ width: `${(stage1Delay / 5.0) * 100}%` }}
              >
                {stage1Delay} ns
              </div>
            </div>
          </div>

          {/* Stage 2 Bar */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>Pipeline Stage 2 Delay:</span>
              <span className="text-emerald-400 font-bold">{stage2Delay} ns (Balanced)</span>
            </div>
            <div className="w-full bg-slate-950 h-5 rounded overflow-hidden flex border border-slate-800">
              <div
                className="h-full bg-emerald-400 text-slate-950 transition-all duration-300 flex items-center justify-center font-bold text-[10px]"
                style={{ width: `${(stage2Delay / 5.0) * 100}%` }}
              >
                {stage2Delay} ns
              </div>
            </div>
          </div>
        </div>

        {/* Operating Frequency & Slack Summary */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Maximum Operating Frequency:</span>
            <div className="text-2xl font-black text-cyan-400">
              {maxFreq} MHz <span className="text-xs text-slate-400 font-normal">({maxDelay} ns Period)</span>
            </div>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs font-sans font-bold ${
              retimed
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-200"
                : "bg-amber-950/50 border-amber-500 text-amber-200"
            }`}
          >
            {retimed
              ? "🚀 +55% Throughput Speedup! Flop moved across adder boundary without altering cycle latency."
              : "⚠️ Unbalanced! Stage 1 (4.2ns) starves Stage 2 (1.0ns), limiting max frequency to 238 MHz."}
          </div>
        </div>
      </div>
    </div>
  );
}
