"use client";

import React, { useState } from "react";
import { Cpu, Zap, Activity, Gauge, CheckCircle2, AlertCircle } from "lucide-react";

export function MultiVthVisualizer() {
  const [profile, setProfile] = useState<"ALL_LVT" | "BALANCED_RVT" | "MULTI_VTH_OPTIMIZED">(
    "MULTI_VTH_OPTIMIZED"
  );

  const configs = {
    ALL_LVT: {
      name: "100% Low-Vth (LVT)",
      desc: "Every standard cell mapped to fast Low-Vth. Unusable for mobile/battery powered SoCs.",
      lvtPct: 100,
      rvtPct: 0,
      hvtPct: 0,
      wns: 0.0,
      leakagePower: 142.5,
      delay: "1.12 ns",
      verdict: "High Speed, Severe Static Leakage (142.5 mW)",
    },
    BALANCED_RVT: {
      name: "100% Regular-Vth (RVT)",
      desc: "Uniform RVT threshold mapping without intelligent path-based optimization.",
      lvtPct: 0,
      rvtPct: 100,
      hvtPct: 0,
      wns: -0.18,
      leakagePower: 48.0,
      delay: "1.34 ns",
      verdict: "Moderate Leakage, Violates Setup Timing (-0.18 ns WNS)",
    },
    MULTI_VTH_OPTIMIZED: {
      name: "Intelligent Multi-Vth (LVT + RVT + HVT)",
      desc: "Fast LVT cells assigned strictly to critical paths (slack < 0.1ns). All positive slack paths swapped to High-Vth (HVT) cells!",
      lvtPct: 14,
      rvtPct: 26,
      hvtPct: 60,
      wns: 0.0,
      leakagePower: 18.4,
      delay: "1.12 ns",
      verdict: "Optimal Signoff: 0.00 ns WNS + 87% Leakage Reduction! (18.4 mW)",
    },
  };

  const curr = configs[profile];

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
              Multi-Threshold Voltage (Multi-Vth) Power-Timing Optimizer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Controlling sub-threshold static leakage by swapping non-critical standard cells to High-Vth (HVT)
            </p>
          </div>
        </div>

        {/* Strategy Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["ALL_LVT", "BALANCED_RVT", "MULTI_VTH_OPTIMIZED"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setProfile(p)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                profile === p
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {p === "ALL_LVT" ? "All LVT" : p === "BALANCED_RVT" ? "All RVT" : "Multi-Vth Optimized"}
            </button>
          ))}
        </div>
      </div>

      {/* Visual Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">{curr.name}</span>
          <span className="text-emerald-400 font-bold">WNS: {curr.wns >= 0 ? `+${curr.wns} ns (MET)` : `${curr.wns} ns (FAIL)`}</span>
        </div>

        {/* Vth Threshold Distribution Ratio Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
            <span>Cell Threshold Distribution</span>
            <span className="text-cyan-300">LVT: {curr.lvtPct}% · RVT: {curr.rvtPct}% · HVT: {curr.hvtPct}%</span>
          </div>

          <div className="w-full h-8 rounded-lg overflow-hidden flex border border-slate-800 font-bold text-[10px] text-slate-950">
            {curr.lvtPct > 0 && (
              <div
                className="bg-rose-400 h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${curr.lvtPct}%` }}
              >
                LVT ({curr.lvtPct}%)
              </div>
            )}
            {curr.rvtPct > 0 && (
              <div
                className="bg-amber-400 h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${curr.rvtPct}%` }}
              >
                RVT ({curr.rvtPct}%)
              </div>
            )}
            {curr.hvtPct > 0 && (
              <div
                className="bg-emerald-400 h-full flex items-center justify-center transition-all duration-300"
                style={{ width: `${curr.hvtPct}%` }}
              >
                HVT ({curr.hvtPct}%)
              </div>
            )}
          </div>
        </div>

        {/* Silicon Path Visualization (Color-Coded Gates) */}
        <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synthesized Standard Cell Timing Path (SkyWater 130nm):</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div
              className={`p-2.5 rounded border ${
                profile === "MULTI_VTH_OPTIMIZED" || profile === "ALL_LVT"
                  ? "bg-rose-950/60 border-rose-500 text-rose-200"
                  : "bg-amber-950/60 border-amber-500 text-amber-200"
              }`}
            >
              <div className="font-bold">sky130_fd_sc_hs__dfxtp_1</div>
              <div className="text-[9px] text-slate-400">{profile === "MULTI_VTH_OPTIMIZED" ? "High Speed (HS)" : "HD (Standard)"}</div>
            </div>
            <div
              className={`p-2.5 rounded border ${
                profile === "MULTI_VTH_OPTIMIZED" || profile === "ALL_LVT"
                  ? "bg-rose-950/60 border-rose-500 text-rose-200"
                  : "bg-amber-950/60 border-amber-500 text-amber-200"
              }`}
            >
              <div className="font-bold">sky130_fd_sc_hs__aoi22_2</div>
              <div className="text-[9px] text-slate-400">{profile === "MULTI_VTH_OPTIMIZED" ? "High Speed (Critical)" : "HD (Standard)"}</div>
            </div>
            <div
              className={`p-2.5 rounded border ${
                profile === "MULTI_VTH_OPTIMIZED"
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                  : profile === "ALL_LVT"
                  ? "bg-rose-950/60 border-rose-500 text-rose-200"
                  : "bg-amber-950/60 border-amber-500 text-amber-200"
              }`}
            >
              <div className="font-bold">sky130_fd_sc_hdll__dec24_1</div>
              <div className="text-[9px] text-slate-400">{profile === "MULTI_VTH_OPTIMIZED" ? "Low Leakage (HDLL ✓)" : "HD/HS"}</div>
            </div>
            <div
              className={`p-2.5 rounded border ${
                profile === "MULTI_VTH_OPTIMIZED"
                  ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                  : profile === "ALL_LVT"
                  ? "bg-rose-950/60 border-rose-500 text-rose-200"
                  : "bg-amber-950/60 border-amber-500 text-amber-200"
              }`}
            >
              <div className="font-bold">sky130_fd_sc_hdll__mux2_1</div>
              <div className="text-[9px] text-slate-400">{profile === "MULTI_VTH_OPTIMIZED" ? "Low Leakage (HDLL ✓)" : "HD/HS"}</div>
            </div>
          </div>
        </div>

        {/* Leakage Power & Timing Slack Metric Cards */}
        <div className="grid sm:grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Worst Negative Slack:</span>
            <span className={`font-black text-sm ${curr.wns >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {curr.wns >= 0 ? `+${curr.wns} ns (MET)` : `${curr.wns} ns (FAIL)`}
            </span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Static Leakage Power:</span>
            <span className="font-black text-cyan-300 text-sm">{curr.leakagePower} mW</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Leakage Reduction:</span>
            <span className="font-black text-emerald-300 text-sm">
              {profile === "MULTI_VTH_OPTIMIZED" ? "87% Power Saved ✓" : profile === "BALANCED_RVT" ? "66% Saved" : "0% (Baseline)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
