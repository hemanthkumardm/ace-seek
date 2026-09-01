"use client";

import React, { useState } from "react";
import { Cpu, Activity, ArrowRight, ShieldCheck, AlertTriangle, Layers, Sliders, CheckCircle2 } from "lucide-react";

export function OcvDerateVisualizer() {
  const [derateMode, setDerateMode] = useState<"FLAT_OCV" | "AOCV" | "POCV">("FLAT_OCV");
  const [cpprEnabled, setCpprEnabled] = useState<boolean>(true);
  const [lateDeratePct, setLateDeratePct] = useState<number>(8); // +8% late
  const [earlyDeratePct, setEarlyDeratePct] = useState<number>(5); // -5% early

  // Hardware Timing Numbers
  const commonClockBufferDelay = 0.50; // ns
  const launchDivergentDelay = 0.30; // ns
  const dataPathDelay = 1.20; // ns
  const captureDivergentDelay = 0.35; // ns
  const clockPeriod = 2.0; // ns
  const setupTime = 0.10; // ns

  // OCV scaling factors
  const lateMultiplier = 1 + lateDeratePct / 100;
  const earlyMultiplier = 1 - earlyDeratePct / 100;

  // Launch Path (Late Derate)
  const launchCommonDerated = commonClockBufferDelay * lateMultiplier;
  const launchDivergentDerated = launchDivergentDelay * lateMultiplier;
  const dataPathDerated = dataPathDelay * lateMultiplier;
  const totalArrival = launchCommonDerated + launchDivergentDerated + dataPathDerated;

  // Capture Path (Early Derate for Setup Check)
  const captureCommonDerated = commonClockBufferDelay * earlyMultiplier;
  const captureDivergentDerated = captureDivergentDelay * earlyMultiplier;
  const rawRequired = clockPeriod + (captureCommonDerated + captureDivergentDerated) - setupTime;

  // Common Path Pessimism Removal (CPPR credit)
  // CPPR = lateCommon - earlyCommon
  const cpprCredit = cpprEnabled ? (launchCommonDerated - captureCommonDerated) : 0;
  const finalRequired = rawRequired + cpprCredit;

  const slackNs = (finalRequired - totalArrival).toFixed(3);
  const isSlackPassing = parseFloat(slackNs) >= 0;

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
              On-Chip Variation (OCV / AOCV / POCV) &amp; CPPR / CRPR Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Statistical PVT derating, divergent clock branch margins, and Common Path Pessimism credit
            </p>
          </div>
        </div>

        {/* Derate Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {(["FLAT_OCV", "AOCV", "POCV"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setDerateMode(m)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                derateMode === m
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {m === "FLAT_OCV" ? "Flat OCV" : m === "AOCV" ? "AOCV (Depth-Aware)" : "POCV / LVF (μ ± 3σ)"}
            </button>
          ))}
        </div>
      </div>

      {/* Control Sliders & CPPR Toggle */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Late Derate (`set_timing_derate -late`)</span>
            <span className="text-rose-400">+{lateDeratePct}% ({lateMultiplier.toFixed(2)}x)</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={lateDeratePct}
            onChange={(e) => setLateDeratePct(parseInt(e.target.value, 10))}
            className="w-full accent-rose-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Slows down launch clock &amp; data paths.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Early Derate (`set_timing_derate -early`)</span>
            <span className="text-amber-400">-{earlyDeratePct}% ({earlyMultiplier.toFixed(2)}x)</span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="1"
            value={earlyDeratePct}
            onChange={(e) => setEarlyDeratePct(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Speeds up capture clock path.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] text-slate-400 font-bold uppercase">Common Path Pessimism Removal (CPPR)</div>
          <button
            type="button"
            onClick={() => setCpprEnabled(!cpprEnabled)}
            className={`w-full py-2 rounded-lg font-bold border text-xs flex items-center justify-center gap-1.5 transition-all ${
              cpprEnabled
                ? "bg-emerald-950/80 border-emerald-400 text-emerald-300"
                : "bg-rose-950/80 border-rose-500 text-rose-300"
            }`}
          >
            {cpprEnabled ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>CPPR / CRPR: {cpprEnabled ? "ENABLED (+Credit)" : "DISABLED (Pessimistic)"}</span>
          </button>
          <div className="text-[10px] text-slate-400 font-sans">Cancels artificial skew on shared buffers.</div>
        </div>
      </div>

      {/* Visual Clock Tree Path Schematic */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Clock Tree &amp; Data Path Breakdown</span>
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isSlackPassing ? "bg-emerald-950 text-emerald-300 border border-emerald-500" : "bg-rose-950 text-rose-300 border border-rose-500"}`}>
            Setup Slack: {slackNs} ns ({isSlackPassing ? "MET" : "VIOLATED"})
          </span>
        </div>

        {/* Tree Path Diagram */}
        <div className="space-y-3">
          {/* Shared Clock Buffer */}
          <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/60 text-indigo-200">
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs">1. Shared Common Clock Tree Buffer (`u_clk_buf_root`)</span>
              <span className="text-[10px] text-indigo-300">Base Delay: {commonClockBufferDelay.toFixed(2)}ns</span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-300 bg-slate-950/80 p-2 rounded">
              <span>Launch View (Late +{lateDeratePct}%): <strong className="text-rose-300">{launchCommonDerated.toFixed(3)} ns</strong></span>
              <span>Capture View (Early -{earlyDeratePct}%): <strong className="text-amber-300">{captureCommonDerated.toFixed(3)} ns</strong></span>
              <span className="text-emerald-400 font-bold">
                CPPR Correction Credit: {cpprEnabled ? `+${(launchCommonDerated - captureCommonDerated).toFixed(3)} ns` : "0.000 ns"}
              </span>
            </div>
          </div>

          {/* Divergent Paths */}
          <div className="grid md:grid-cols-2 gap-3">
            {/* Launch Branch + Data */}
            <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/50 space-y-1 text-rose-200">
              <div className="font-bold text-xs text-rose-300">2. Launch Path (Late Derate +{lateDeratePct}%)</div>
              <div className="text-[10px] space-y-0.5 text-slate-300">
                <div>• Divergent Clock Branch: <strong>{launchDivergentDerated.toFixed(3)} ns</strong></div>
                <div>• Combinational Data Path: <strong>{dataPathDerated.toFixed(3)} ns</strong></div>
                <div className="pt-1 text-rose-300 font-bold border-t border-rose-900/60">
                  Total Data Arrival Time: {totalArrival.toFixed(3)} ns
                </div>
              </div>
            </div>

            {/* Capture Branch */}
            <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/50 space-y-1 text-amber-200">
              <div className="font-bold text-xs text-amber-300">3. Capture Path (Early Derate -{earlyDeratePct}%)</div>
              <div className="text-[10px] space-y-0.5 text-slate-300">
                <div>• Divergent Clock Branch: <strong>{captureDivergentDerated.toFixed(3)} ns</strong></div>
                <div>• Setup Requirement (T_setup): <strong>-{setupTime.toFixed(2)} ns</strong></div>
                <div className="pt-1 text-amber-300 font-bold border-t border-amber-900/60">
                  Total Required Time: {finalRequired.toFixed(3)} ns (with CPPR)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STA Script Command Block */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Standard SDC / PrimeTime Derating &amp; CPPR Commands:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# 1. Enable Common Path Pessimism Removal (CPPR / CRPR)
set_app_var timing_remove_clock_reconvergence_pessimism true

# 2. Apply On-Chip Variation (OCV) Derates
set_timing_derate -late  ${lateMultiplier.toFixed(2)} -data
set_timing_derate -late  ${lateMultiplier.toFixed(2)} -clock
set_timing_derate -early ${earlyMultiplier.toFixed(2)} -clock

# 3. Report Timing with Detailed Derate and CPPR breakdown
report_timing -derate -path_type full_clock_expanded`}
          </pre>
        </div>
      </div>
    </div>
  );
}
