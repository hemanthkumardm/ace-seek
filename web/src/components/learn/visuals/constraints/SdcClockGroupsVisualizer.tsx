"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Layers, Split, GitMerge, CheckCircle2, ShieldAlert, AlertTriangle } from "lucide-react";

export function SdcClockGroupsVisualizer() {
  const [groupStyle, setGroupStyle] = useState<"ASYNC" | "LOGICAL_EXCLUSIVE" | "PHYSICAL_EXCLUSIVE">("ASYNC");

  const styles = {
    ASYNC: {
      name: "Asynchronous Clock Domains (set_clock_groups -asynchronous)",
      clocks: ["clk_cpu (500 MHz, On-Chip PLL)", "clk_pcie (100 MHz, RefClk)"],
      relation: "Completely unsynchronized oscillators with random phase relationship.",
      timingStatus: "All cross-domain paths ignored by STA. Requires 2-FF or Async FIFO in RTL!",
      sdc: `set_clock_groups -asynchronous \\
  -group [get_clocks clk_cpu] \\
  -group [get_clocks clk_pcie]`,
      warning: "NEVER use 'set_false_path -from * -to *'! Clock groups explicitly declare domain intent without masking intra-domain paths.",
    },
    LOGICAL_EXCLUSIVE: {
      name: "Logically Exclusive Multiplexed Clocks (set_clock_groups -logically_exclusive)",
      clocks: ["clk_fast (1 GHz, Mission Mode)", "clk_test (50 MHz, Scan Test Mode)"],
      relation: "Shared physical routing tree selected via 2:1 Clock MUX (Select pin controlled by test_mode).",
      timingStatus: "Cannot toggle simultaneously in active operation. STA times each clock mode independently.",
      sdc: `set_clock_groups -logically_exclusive \\
  -group [get_clocks clk_fast] \\
  -group [get_clocks clk_test]`,
      warning: "Tells the STA engine that clk_fast and clk_test can never transmit data to each other because only one can pass through the clock multiplexer at any given time.",
    },
    PHYSICAL_EXCLUSIVE: {
      name: "Physically Exclusive Clocks (set_clock_groups -physically_exclusive)",
      clocks: ["clk_pad_ext (External Pin A)", "clk_pad_int (Internal Pin B)"],
      relation: "Multiple clock sources driving the exact same physical input pad pin.",
      timingStatus: "Physically impossible to exist concurrently in silicon.",
      sdc: `set_clock_groups -physically_exclusive \\
  -group [get_clocks clk_pad_ext] \\
  -group [get_clocks clk_pad_int]`,
      warning: "Used when the same bond pad pin can be driven by either an external crystal or a test harness socket.",
    },
  };

  const curr = styles[groupStyle];

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
            <Split className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              SDC Clock Groups &amp; Domain Exclusivity Matrix
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              `set_clock_groups -asynchronous`, `-logically_exclusive`, and `-physically_exclusive`
            </p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {(["ASYNC", "LOGICAL_EXCLUSIVE", "PHYSICAL_EXCLUSIVE"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setGroupStyle(s)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                groupStyle === s
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {s === "ASYNC" ? "Asynchronous" : s === "LOGICAL_EXCLUSIVE" ? "Logically Exclusive" : "Physically Exclusive"}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">{curr.name}</span>
          <span className="text-emerald-400 font-bold">STA Interaction: CUT PATHS</span>
        </div>

        {/* Clocks Diagram */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Clock Group 1:</div>
            <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/60 text-cyan-300 font-bold">
              {curr.clocks[0]}
            </div>
            <div className="text-[10px] text-slate-400 font-sans">{curr.relation}</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Clock Group 2:</div>
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/60 text-amber-300 font-bold">
              {curr.clocks[1]}
            </div>
            <div className="text-[10px] text-slate-400 font-sans">{curr.timingStatus}</div>
          </div>
        </div>

        {/* Warning / Rule Callout */}
        <div className="p-3.5 rounded-lg bg-amber-950/40 border border-amber-500/60 text-amber-200 text-xs font-sans space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Golden SDC Methodology Rule:</span>
          </div>
          <p className="text-[11px] leading-relaxed">{curr.warning}</p>
        </div>

        {/* SDC Command Output */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Production SDC Constraint Syntax:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
            {curr.sdc}
          </pre>
        </div>
      </div>
    </div>
  );
}
