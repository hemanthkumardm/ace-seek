"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Activity, Box, Sliders, CheckCircle2, AlertCircle } from "lucide-react";

export function SdcIoBudgetVisualizer() {
  const [clockPeriod, setClockPeriod] = useState<number>(2.5); // ns
  const [extInputMax, setExtInputMax] = useState<number>(0.8); // ns (Setup)
  const [extInputMin, setExtInputMin] = useState<number>(0.15); // ns (Hold)
  const [extOutputMax, setExtOutputMax] = useState<number>(0.9); // ns (Setup)
  const [extOutputMin, setExtOutputMin] = useState<number>(0.2); // ns (Hold)

  // Internal Available Timing Budgets
  const internalInputBudget = (clockPeriod - extInputMax).toFixed(2);
  const internalOutputBudget = (clockPeriod - extOutputMax).toFixed(2);

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
            <Box className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              System-Synchronous I/O Budgeting &amp; Board Delay Calculator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive `-max` (Setup) and `-min` (Hold) input/output flight time constraints
            </p>
          </div>
        </div>

        {/* Period Badge */}
        <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-bold">
          T_clk: {clockPeriod} ns ({(1000 / clockPeriod).toFixed(0)} MHz)
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Clock Period (`create_clock`)</span>
            <span className="text-cyan-400">{clockPeriod} ns</span>
          </div>
          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={clockPeriod}
            onChange={(e) => setClockPeriod(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Total cycle time budget.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>External Input Delay (`set_input_delay`)</span>
            <span className="text-amber-400">Max: {extInputMax}ns · Min: {extInputMin}ns</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.5"
            step="0.1"
            value={extInputMax}
            onChange={(e) => setExtInputMax(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">External chip launch delay + PCB trace.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>External Output Delay (`set_output_delay`)</span>
            <span className="text-emerald-400">Max: {extOutputMax}ns · Min: {extOutputMin}ns</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1.5"
            step="0.1"
            value={extOutputMax}
            onChange={(e) => setExtOutputMax(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">External setup time required by receiving device.</div>
        </div>
      </div>

      {/* Hardware Interface Schematic */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Chip-to-Chip Interface Budget Partitioning</span>
          <span className="text-slate-400">Reference: Virtual Clock `vclk_ext`</span>
        </div>

        {/* Input Interface Path Diagram */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">1. Input Interface Timing Path (Data In Port):</div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            {/* External Device */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/80 text-amber-300 flex-1">
              <div className="text-[9px] text-slate-400">External Device (Off-Chip)</div>
              <div className="font-bold">External Flight Time</div>
              <div className="text-xs text-amber-400 font-black mt-0.5">{extInputMax} ns (Consumed)</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Input Port Pad */}
            <div className="p-2.5 rounded bg-slate-950 border border-cyan-500/60 text-cyan-300">
              <div className="text-[9px] text-slate-400">Chip Boundary</div>
              <div className="font-bold text-xs">`data_in` Pad</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Internal Logic Budget */}
            <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-400 text-emerald-300 flex-1 shadow-md">
              <div className="text-[9px] text-emerald-400 uppercase font-bold">Internal Silicon Budget</div>
              <div className="font-bold">Max Allowable Logic Delay</div>
              <div className="text-xs text-emerald-200 font-black mt-0.5">{internalInputBudget} ns Available</div>
            </div>
          </div>
        </div>

        {/* Output Interface Path Diagram */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">2. Output Interface Timing Path (Data Out Port):</div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            {/* Internal Core Logic */}
            <div className="p-3 rounded-lg bg-emerald-950 border border-emerald-400 text-emerald-300 flex-1 shadow-md">
              <div className="text-[9px] text-emerald-400 uppercase font-bold">Internal Silicon Budget</div>
              <div className="font-bold">Internal Launch Flop ➔ Pad</div>
              <div className="text-xs text-emerald-200 font-black mt-0.5">{internalOutputBudget} ns Available</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Output Port Pad */}
            <div className="p-2.5 rounded bg-slate-950 border border-cyan-500/60 text-cyan-300">
              <div className="text-[9px] text-slate-400">Chip Boundary</div>
              <div className="font-bold text-xs">`data_out` Pad</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* External Receiver Requirements */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/80 text-amber-300 flex-1">
              <div className="text-[9px] text-slate-400">External Receiver (Off-Chip)</div>
              <div className="font-bold">External Setup + Trace</div>
              <div className="text-xs text-amber-400 font-black mt-0.5">{extOutputMax} ns (Reserved)</div>
            </div>
          </div>
        </div>

        {/* SDC Command Output */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Exact SDC Constraints for Signoff:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# Virtual Reference Clock
create_clock -name vclk_ext -period ${clockPeriod}

# Input Port Constraints (Setup Max: ${extInputMax}ns, Hold Min: ${extInputMin}ns)
set_input_delay -max ${extInputMax} -clock vclk_ext [get_ports data_in]
set_input_delay -min ${extInputMin} -clock vclk_ext [get_ports data_in]

# Output Port Constraints (Setup Max: ${extOutputMax}ns, Hold Min: ${extOutputMin}ns)
set_output_delay -max ${extOutputMax} -clock vclk_ext [get_ports data_out]
set_output_delay -min ${extOutputMin} -clock vclk_ext [get_ports data_out]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
