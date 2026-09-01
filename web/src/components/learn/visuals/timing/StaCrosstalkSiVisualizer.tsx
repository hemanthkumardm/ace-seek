"use client";

import React, { useState } from "react";
import { Activity, Zap, ShieldAlert, Sliders, ArrowRight, Gauge, AlertTriangle, CheckCircle2 } from "lucide-react";

export function StaCrosstalkSiVisualizer() {
  const [crosstalkMode, setCrosstalkMode] = useState<"ANTI_PHASE" | "IN_PHASE" | "GLITCH_QUIET">("ANTI_PHASE");
  const [couplingCapFf, setCouplingCapFf] = useState<number>(25); // fF (Cc)
  const [aggressorSlewPs, setAggressorSlewPs] = useState<number>(60); // ps

  const vdd = 1.8; // Volts (SkyWater 130nm)
  const victimGroundCapFf = 35; // fF (Cgnd)
  const victimDriverResOhms = 450; // Ohms (R_driver)

  // Calculations:
  // Glitch Peak Voltage = VDD * (Cc / (Cc + Cgnd)) * (1 - e^(-slew / (R * (Cc + Cgnd))))
  const totalCapFf = couplingCapFf + victimGroundCapFf;
  const glitchPeakVolts = (vdd * (couplingCapFf / totalCapFf) * 0.85).toFixed(2);
  const dcNoiseThreshold = 0.45; // V (VIL max threshold for sky130)
  const isGlitchHazard = parseFloat(glitchPeakVolts) > dcNoiseThreshold;

  // Delta Delay
  // Anti-Phase: Miller factor = 2.0 (Slowdown)
  // In-Phase: Miller factor = 0.0 (Speedup)
  const deltaDelayPs = crosstalkMode === "ANTI_PHASE"
    ? Math.round(couplingCapFf * 3.8) // ps slowdown
    : crosstalkMode === "IN_PHASE"
    ? -Math.round(couplingCapFf * 2.2) // ps speedup
    : 0;

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
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Signal Integrity (SI) &amp; Crosstalk Delta-Delay Simulator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive inter-wire coupling capacitance (C_c), Miller effect slowdown/speedup (Delta-t), and noise glitches
            </p>
          </div>
        </div>

        {/* Crosstalk Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {(["ANTI_PHASE", "IN_PHASE", "GLITCH_QUIET"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setCrosstalkMode(m)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                crosstalkMode === m
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {m === "ANTI_PHASE" ? "Opposite Switching (Slowdown)" : m === "IN_PHASE" ? "Same Switching (Speedup)" : "Quiet Victim (Glitch)"}
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-2 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Inter-Wire Coupling Capacitance (`C_c`)</span>
            <span className="text-rose-400">{couplingCapFf} fF</span>
          </div>
          <input
            type="range"
            min="5"
            max="60"
            step="5"
            value={couplingCapFf}
            onChange={(e) => setCouplingCapFf(parseInt(e.target.value, 10))}
            className="w-full accent-rose-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Sidewall capacitance between parallel routed wires.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Aggressor Transition Slew</span>
            <span className="text-cyan-400">{aggressorSlewPs} ps</span>
          </div>
          <input
            type="range"
            min="20"
            max="200"
            step="10"
            value={aggressorSlewPs}
            onChange={(e) => setAggressorSlewPs(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Faster slew (dV/dt) injects higher peak noise current (I = C * dV/dt).</div>
        </div>
      </div>

      {/* Visual Simulation Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Coupling Waveform &amp; Delta-Delay Analysis</span>
          <span className={`px-2.5 py-1 rounded text-xs font-bold ${
            crosstalkMode === "GLITCH_QUIET"
              ? isGlitchHazard ? "bg-rose-950 border border-rose-500 text-rose-300" : "bg-emerald-950 border border-emerald-500 text-emerald-300"
              : deltaDelayPs > 0 ? "bg-amber-950 border border-amber-500 text-amber-300" : "bg-cyan-950 border border-cyan-500 text-cyan-300"
          }`}>
            {crosstalkMode === "GLITCH_QUIET"
              ? `Peak Glitch: ${glitchPeakVolts}V (${isGlitchHazard ? "FAIL: Exceeds VIL" : "PASS: Below VIL"})`
              : `Delta Delay: ${deltaDelayPs > 0 ? `+${deltaDelayPs} ps (Setup Slowdown)` : `${deltaDelayPs} ps (Hold Speedup)`}`}
          </span>
        </div>

        {/* Dual Wire Trace Schematic */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          {/* Aggressor Wire */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-rose-400 font-bold">1. Aggressor Net (`net_aggr` Fast Switching 0 ➔ 1):</span>
              <span className="text-slate-400">Slew: {aggressorSlewPs} ps · Swing: {vdd}V</span>
            </div>
            <div className="h-7 rounded bg-slate-950 border border-rose-500/60 flex items-center px-3 text-rose-300 text-[10px]">
              <span className="font-bold">Aggressor Signal: 0V ➔ 1.8V Fast Step (Injecting Charge through C_c)</span>
            </div>
          </div>

          {/* Coupling Capacitor Bridge */}
          <div className="flex justify-center items-center gap-2 py-1 text-slate-400 text-[10px]">
            <div className="h-px bg-slate-700 flex-1" />
            <span className="p-1 px-3 rounded-full bg-rose-950 border border-rose-500 text-rose-300 font-bold">
              Coupling Capacitance C_c = {couplingCapFf} fF
            </span>
            <div className="h-px bg-slate-700 flex-1" />
          </div>

          {/* Victim Wire */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-cyan-400 font-bold">2. Victim Net (`net_victim` Target Timing Path):</span>
              <span className="text-slate-400">Ground Cap C_gnd: {victimGroundCapFf} fF</span>
            </div>
            <div className={`h-7 rounded border flex items-center px-3 text-[10px] ${
              crosstalkMode === "ANTI_PHASE"
                ? "bg-amber-950/40 border-amber-500 text-amber-200"
                : crosstalkMode === "IN_PHASE"
                ? "bg-cyan-950/40 border-cyan-500 text-cyan-200"
                : "bg-slate-950 border-slate-700 text-slate-300"
            }`}>
              <span className="font-bold">
                {crosstalkMode === "ANTI_PHASE" && `Victim Switching 1 ➔ 0 (Anti-Phase): Miller Factor 2.0x ➔ +${deltaDelayPs}ps Added Delay`}
                {crosstalkMode === "IN_PHASE" && `Victim Switching 0 ➔ 1 (In-Phase): Miller Factor 0.0x ➔ ${deltaDelayPs}ps Early Arrival`}
                {crosstalkMode === "GLITCH_QUIET" && `Victim Held at Steady 0V: Glitch Noise Bump of +${glitchPeakVolts}V Generated!`}
              </span>
            </div>
          </div>
        </div>

        {/* PrimeTime-SI Command Output */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">PrimeTime-SI Crosstalk Analysis Script (`si_analysis.tcl`):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# 1. Enable Signal Integrity (SI) Engine & Crosstalk Delay Calculation
set_app_var si_enable_analysis true
set_app_var si_xtalk_composite_aggressor_mode true

# 2. Set DC Noise Glitch Threshold
set_noise_margin -low 0.45 -high 1.35

# 3. Report Crosstalk Delta-Delay on Critical Paths
report_timing -crosstalk_delta -path_type full_clock_expanded
report_noise -all_violators -slack_lesser_than 0.0`}
          </pre>
        </div>
      </div>
    </div>
  );
}
