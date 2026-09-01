"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Activity, Zap, CheckCircle2, Eye, ShieldCheck } from "lucide-react";

export function SdcDdrInterfaceVisualizer() {
  const [alignment, setAlignment] = useState<"CENTER_ALIGNED" | "EDGE_ALIGNED">("CENTER_ALIGNED");
  const [skewPs, setSkewPs] = useState<number>(150); // ps

  const bitPeriodPs = 1000; // 1.0 ns (1000 Mbps DDR)
  const eyeOpeningPs = bitPeriodPs - 2 * skewPs;

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
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Dual Data Rate (DDR) Source-Synchronous Timing PHY
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Constraining rising &amp; falling clock edge data launches (`-clock_fall -add_delay`)
            </p>
          </div>
        </div>

        {/* Alignment Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {(["CENTER_ALIGNED", "EDGE_ALIGNED"] as const).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAlignment(a)}
              className={`px-2.5 py-1 rounded font-bold transition-all ${
                alignment === a
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {a === "CENTER_ALIGNED" ? "Center-Aligned (SDR/DDR)" : "Edge-Aligned (Needs PLL 90° Shift)"}
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Timing Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">1 Gbps DDR Memory Interface (T_data_unit = 500 ps)</span>
          <span className="text-emerald-400 font-bold">Valid Eye: {eyeOpeningPs} ps</span>
        </div>

        {/* Dual Data Rate Waveform Diagram */}
        <div className="space-y-3">
          {/* Clock Trace */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-cyan-300 font-bold">DDR Source Clock (`ddr_clk` 500 MHz):</span>
              <span className="text-slate-400">Rises @ 0ps &amp; 1000ps · Falls @ 500ps &amp; 1500ps</span>
            </div>
            <div className="h-8 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center text-[9px] font-bold">
              <div className="bg-cyan-500/80 h-full border-r border-cyan-300 flex items-center justify-center text-slate-950" style={{ width: "25%" }}>
                CLK HIGH (Rise 0)
              </div>
              <div className="bg-slate-950 h-full border-r border-slate-800 flex items-center justify-center text-slate-500" style={{ width: "25%" }}>
                CLK LOW (Fall 500)
              </div>
              <div className="bg-cyan-500/80 h-full border-r border-cyan-300 flex items-center justify-center text-slate-950" style={{ width: "25%" }}>
                CLK HIGH (Rise 1000)
              </div>
              <div className="bg-slate-950 h-full flex items-center justify-center text-slate-500" style={{ width: "25%" }}>
                CLK LOW (Fall 1500)
              </div>
            </div>
          </div>

          {/* Dual Data Bits Trace */}
          <div className="space-y-1">
            <div className="flex justify-between text-[10px]">
              <span className="text-amber-300 font-bold">DDR Data Bus (`ddr_dq[7:0]`):</span>
              <span className="text-slate-400">Data Transferred on BOTH Rising &amp; Falling Edges!</span>
            </div>
            <div className="h-8 rounded bg-slate-900 border border-slate-800 flex relative overflow-hidden items-center text-[9px] font-bold">
              <div className="bg-amber-950 border-r border-amber-500 text-amber-200 h-full flex items-center justify-center" style={{ width: "25%" }}>
                Data Bit 0 (Rise Launch)
              </div>
              <div className="bg-emerald-950 border-r border-emerald-500 text-emerald-200 h-full flex items-center justify-center" style={{ width: "25%" }}>
                Data Bit 1 (Fall Launch)
              </div>
              <div className="bg-amber-950 border-r border-amber-500 text-amber-200 h-full flex items-center justify-center" style={{ width: "25%" }}>
                Data Bit 2 (Rise Launch)
              </div>
              <div className="bg-emerald-950 text-emerald-200 h-full flex items-center justify-center" style={{ width: "25%" }}>
                Data Bit 3 (Fall Launch)
              </div>
            </div>
          </div>
        </div>

        {/* SDC Command Output */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Complete DDR SDC Constraints (4 Delays Required):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`# 1. Primary Clock Definition
create_clock -name ddr_clk -period 2.0 [get_ports ddr_clk]

# 2. Rising Edge Launch (Data Bit 0 & 2)
set_input_delay -max 0.40 -clock ddr_clk [get_ports ddr_dq]
set_input_delay -min 0.10 -clock ddr_clk [get_ports ddr_dq]

# 3. Falling Edge Launch (Data Bit 1 & 3) - MUST use '-add_delay' and '-clock_fall'!
set_input_delay -max 0.40 -clock ddr_clk -clock_fall -add_delay [get_ports ddr_dq]
set_input_delay -min 0.10 -clock ddr_clk -clock_fall -add_delay [get_ports ddr_dq]`}
          </pre>
        </div>
      </div>
    </div>
  );
}
