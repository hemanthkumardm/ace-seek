"use client";

import React, { useState } from "react";
import { Cpu, Sliders, Activity, Play, Zap, ArrowRight, Gauge, Layers } from "lucide-react";

export function SdcClockWaveformVisualizer() {
  const [period, setPeriod] = useState<number>(2.0); // ns (500 MHz)
  const [divider, setDivider] = useState<number>(2); // divide_by
  const [dutyCycle, setDutyCycle] = useState<number>(50); // %
  const [uncertainty, setUncertainty] = useState<number>(0.1); // ns
  const [sourceLatency, setSourceLatency] = useState<number>(0.3); // ns

  const freqMHz = Math.round(1000 / period);
  const genPeriod = period * divider;
  const genFreqMHz = Math.round(1000 / genPeriod);

  // Waveform drawing points
  const totalNs = 10.0;
  const widthPct = (timeNs: number) => `${(timeNs / totalNs) * 100}%`;

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
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              SDC Clock Waveform &amp; Generated Clocks Oscilloscope
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive waveform synthesis: `create_clock`, `create_generated_clock`, and clock uncertainty margins
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs font-bold">
          Master Clock: {freqMHz} MHz ({period} ns)
        </span>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Primary Clock Period (`-period`)</span>
            <span className="text-cyan-400">{period} ns</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.2"
            value={period}
            onChange={(e) => setPeriod(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Sets base setup/hold clock cycle.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>PLL/Divider (`-divide_by`)</span>
            <span className="text-amber-400">/{divider} ({genFreqMHz} MHz)</span>
          </div>
          <input
            type="range"
            min="1"
            max="4"
            step="1"
            value={divider}
            onChange={(e) => setDivider(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Generated clock on divider output pin.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Clock Uncertainty (`set_clock_uncertainty`)</span>
            <span className="text-rose-400">{uncertainty} ns ({(uncertainty * 1000).toFixed(0)} ps)</span>
          </div>
          <input
            type="range"
            min="0.02"
            max="0.30"
            step="0.02"
            value={uncertainty}
            onChange={(e) => setUncertainty(parseFloat(e.target.value))}
            className="w-full accent-rose-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Jitter + pre-CTS skew safety margin.</div>
        </div>
      </div>

      {/* Visual Multi-Trace Waveform Scope */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">10.0 ns Digital Oscilloscope Timeline</span>
          <span className="text-slate-400">Scale: 1 ns / grid unit</span>
        </div>

        {/* Trace 1: Primary Clock clk_core */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-cyan-300 font-bold">1. `clk_core` (Port `[get_ports clk]`)</span>
            <span className="text-slate-400">Period: {period} ns · 50% Duty</span>
          </div>
          <div className="h-9 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center">
            {Array.from({ length: Math.floor(totalNs / period) }).map((_, i) => (
              <div
                key={i}
                className="h-full flex shrink-0"
                style={{ width: `${(period / totalNs) * 100}%` }}
              >
                <div className="bg-cyan-500/80 h-full border-r border-cyan-300 flex items-center justify-center text-[9px] font-bold text-slate-950" style={{ width: "50%" }}>
                  HIGH
                </div>
                <div className="bg-slate-950 h-full flex items-center justify-center text-[9px] text-slate-600" style={{ width: "50%" }}>
                  LOW
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trace 2: Generated Clock clk_div */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-amber-300 font-bold">2. `clk_div{divider}` (Pin `[get_pins u_div/Q]`)</span>
            <span className="text-slate-400">Period: {genPeriod.toFixed(1)} ns · Divide-by-{divider}</span>
          </div>
          <div className="h-9 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center">
            {Array.from({ length: Math.ceil(totalNs / genPeriod) }).map((_, i) => (
              <div
                key={i}
                className="h-full flex shrink-0"
                style={{ width: `${(genPeriod / totalNs) * 100}%` }}
              >
                <div className="bg-amber-500/80 h-full border-r border-amber-300 flex items-center justify-center text-[9px] font-bold text-slate-950" style={{ width: "50%" }}>
                  HIGH
                </div>
                <div className="bg-slate-950 h-full flex items-center justify-center text-[9px] text-slate-600" style={{ width: "50%" }}>
                  LOW
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trace 3: Virtual Clock for I/O Budgeting */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-emerald-300 font-bold">3. `vclk_ext` (Virtual Clock — No Silicon Pin)</span>
            <span className="text-slate-400">External Board Reference Waveform</span>
          </div>
          <div className="h-7 rounded bg-slate-900/60 border border-dashed border-emerald-500/50 flex relative overflow-hidden items-center">
            {Array.from({ length: Math.floor(totalNs / period) }).map((_, i) => (
              <div
                key={i}
                className="h-full flex shrink-0"
                style={{ width: `${(period / totalNs) * 100}%` }}
              >
                <div className="bg-emerald-600/40 h-full border-r border-emerald-400" style={{ width: "50%" }} />
                <div className="bg-slate-950/40 h-full" style={{ width: "50%" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic SDC Script Preview */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Generated SDC Constraint File (`timing.sdc`):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# 1. Primary Clock Definition (Period ${period}ns, ${freqMHz} MHz)
create_clock -name clk_core -period ${period} [get_ports clk]

# 2. Clock Uncertainty (Jitter & Pre-CTS margin)
set_clock_uncertainty ${uncertainty} [get_clocks clk_core]

# 3. Generated Clock on Divider Flop Q Pin
create_generated_clock -name clk_div${divider} \\
  -source [get_ports clk] \\
  -divide_by ${divider} \\
  [get_pins u_div/Q]

# 4. Virtual Reference Clock for Off-Chip I/O Timing
create_clock -name vclk_ext -period ${period}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
