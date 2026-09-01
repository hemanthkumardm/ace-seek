"use client";

import React, { useState } from "react";
import { Activity, ArrowRight, Play, Zap, CheckCircle2, RotateCw, Layers } from "lucide-react";

export function CdcPulseToggleVisualizer() {
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [srcFreqMHz, setSrcFreqMHz] = useState<number>(400); // Fast Domain A
  const [dstFreqMHz, setDstFreqMHz] = useState<number>(100); // Slow Domain B

  const triggerPulse = () => {
    setPulseCount((prev) => prev + 1);
  };

  const isToggleHigh = pulseCount % 2 === 1;

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
            <RotateCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Fast-to-Slow Clock Domain Pulse Synchronizer (Toggle-Based)
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Converting 1-cycle pulses into toggle levels: Pulse-to-Toggle $\rightarrow$ 2-FF $\rightarrow$ XOR Edge Detector
            </p>
          </div>
        </div>

        {/* Pulse Inject Button */}
        <button
          type="button"
          onClick={triggerPulse}
          className="px-3.5 py-1.5 rounded-lg bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md hover:bg-cyan-300 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Inject Pulse into Fast Domain (Count: {pulseCount})</span>
        </button>
      </div>

      {/* Domain Speed Sliders */}
      <div className="grid md:grid-cols-2 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Fast Source Clock (`clk_fast` Domain A)</span>
            <span className="text-cyan-400">{srcFreqMHz} MHz ({(1000 / srcFreqMHz).toFixed(1)} ns)</span>
          </div>
          <input
            type="range"
            min="200"
            max="1000"
            step="50"
            value={srcFreqMHz}
            onChange={(e) => setSrcFreqMHz(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">A 1-cycle pulse here is only {(1000 / srcFreqMHz).toFixed(1)}ns wide!</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Slow Destination Clock (`clk_slow` Domain B)</span>
            <span className="text-amber-400">{dstFreqMHz} MHz ({(1000 / dstFreqMHz).toFixed(1)} ns)</span>
          </div>
          <input
            type="range"
            min="50"
            max="200"
            step="10"
            value={dstFreqMHz}
            onChange={(e) => setDstFreqMHz(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Too slow to directly sample the short pulse without missing it!</div>
        </div>
      </div>

      {/* Visual Step-by-Step Architecture Pipeline */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Synchronizer Internal Signal Progression</span>
          <span className="text-emerald-400 font-bold">Pulse Loss: 0% Guaranteed</span>
        </div>

        {/* Signal Flow Blocks */}
        <div className="grid md:grid-cols-4 gap-2 text-center">
          {/* Step 1: Input Pulse */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[9px] text-cyan-400 uppercase font-bold">1. Source Pulse</div>
            <div className="text-xs font-bold text-white">`pulse_in`</div>
            <div className="text-[10px] text-slate-400">1 Cycle @ {srcFreqMHz}MHz</div>
          </div>

          {/* Step 2: Pulse to Toggle */}
          <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/70 space-y-1 text-cyan-200">
            <div className="text-[9px] text-cyan-400 uppercase font-bold">2. Pulse-to-Toggle</div>
            <div className="text-xs font-bold">`toggle_level = {isToggleHigh ? "1" : "0"}`</div>
            <div className="text-[10px] text-cyan-300">Toggles state on each pulse</div>
          </div>

          {/* Step 3: 2-FF Sync */}
          <div className="p-3 rounded-xl bg-slate-900 border border-amber-500/70 space-y-1 text-amber-200">
            <div className="text-[9px] text-amber-400 uppercase font-bold">3. 2-FF Synchronizer</div>
            <div className="text-xs font-bold">`sync_q2 = {isToggleHigh ? "1" : "0"}`</div>
            <div className="text-[10px] text-amber-300">Clocked by `clk_slow`</div>
          </div>

          {/* Step 4: XOR Edge Detector */}
          <div className="p-3 rounded-xl bg-slate-900 border border-emerald-500/70 space-y-1 text-emerald-200">
            <div className="text-[9px] text-emerald-400 uppercase font-bold">4. XOR Edge Detector</div>
            <div className="text-xs font-bold">`pulse_out = sync_q2 ^ sync_q3`</div>
            <div className="text-[10px] text-emerald-300">1-Cycle Pulse @ {dstFreqMHz}MHz</div>
          </div>
        </div>

        {/* Synthesizable Verilog RTL */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Complete Synthesizable Pulse Synchronizer RTL:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`module pulse_sync (
  input  wire clk_src, rst_src_n, pulse_in,
  input  wire clk_dst, rst_dst_n,
  output wire pulse_out
);
  // 1. Pulse-to-Toggle in Source Clock Domain
  reg toggle_src;
  always @(posedge clk_src or negedge rst_src_n) begin
    if (!rst_src_n)
      toggle_src <= 1'b0;
    else if (pulse_in)
      toggle_src <= ~toggle_src;
  end

  // 2. 2-FF Synchronizer + Delay Flop in Destination Domain
  (* async_reg = "true" *) reg sync_q1, sync_q2;
  reg sync_q3;

  always @(posedge clk_dst or negedge rst_dst_n) begin
    if (!rst_dst_n) begin
      sync_q1 <= 1'b0; sync_q2 <= 1'b0; sync_q3 <= 1'b0;
    end else begin
      sync_q1 <= toggle_src;
      sync_q2 <= sync_q1;
      sync_q3 <= sync_q2;
    end
  end

  // 3. XOR Edge Detector regenerates a clean 1-cycle pulse
  assign pulse_out = sync_q2 ^ sync_q3;
endmodule`}
          </pre>
        </div>
      </div>
    </div>
  );
}
