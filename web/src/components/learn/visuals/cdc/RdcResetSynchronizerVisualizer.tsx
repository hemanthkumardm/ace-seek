"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, Zap, ArrowRight, Play, RefreshCw, Power } from "lucide-react";

export function RdcResetSynchronizerVisualizer() {
  const [asyncResetAsserted, setAsyncResetAsserted] = useState<boolean>(false);
  const [clockCycle, setClockCycle] = useState<number>(0);

  // Reset Bridge internal stages
  // When asyncResetAsserted = true, reset is asserted immediately (async)
  // When asyncResetAsserted = false, reset releases over 2 clock edges
  const isResetActive = asyncResetAsserted;

  const handleAssertReset = () => {
    setAsyncResetAsserted(true);
  };

  const handleReleaseReset = () => {
    setAsyncResetAsserted(false);
  };

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
            <Power className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Reset Domain Crossing (RDC) &amp; Reset Synchronizer Bridge
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Asynchronous Reset Assertion (Immediate) + Synchronous Reset De-Assertion (Glitch-Free Recovery/Removal)
            </p>
          </div>
        </div>

        {/* Action Toggle */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={asyncResetAsserted ? handleReleaseReset : handleAssertReset}
            className={`px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 ${
              asyncResetAsserted
                ? "bg-emerald-400 text-slate-950 hover:bg-emerald-300"
                : "bg-rose-500 text-white hover:bg-rose-600"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{asyncResetAsserted ? "De-Assert Reset (Sync Release)" : "Assert Async Reset (Immediate)"}</span>
          </button>
        </div>
      </div>

      {/* Visual Simulation Canvas */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">
            Status: {isResetActive ? "ASYNC RESET ASSERTED (Registers Frozen at 0)" : "RESET DE-ASSERTED (Mission Mode Active)"}
          </span>
          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
            isResetActive ? "bg-rose-950 border border-rose-500 text-rose-300" : "bg-emerald-950 border border-emerald-500 text-emerald-300"
          }`}>
            Recovery/Removal Violations: 0 (PROTECTED)
          </span>
        </div>

        {/* Circuit Schematic Diagram */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Reset Bridge Circuit Architecture:</div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            {/* Async Reset In */}
            <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/70 text-rose-300 flex-1">
              <div className="text-[9px] text-slate-400">External Pin / Power Good</div>
              <div className="font-bold text-xs">`rst_async_n`</div>
              <div className="text-[10px] text-rose-400 mt-1">
                {isResetActive ? "Active Low (0V)" : "High (1.8V)"}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Flop 1 */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/70 text-amber-300 flex-1">
              <div className="text-[9px] text-slate-400">Reset Flop 1 (D = 1'b1)</div>
              <div className="font-bold text-xs">`rst_meta_n`</div>
              <div className="text-[10px] text-amber-400 mt-1">Tied to VDD; Async Clear</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Flop 2 */}
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/70 text-emerald-300 flex-1">
              <div className="text-[9px] text-slate-400">Reset Flop 2 (Sync Out)</div>
              <div className="font-bold text-xs">`rst_sync_n`</div>
              <div className="text-[10px] text-emerald-400 mt-1">Clocked by `clk_dest`</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />

            {/* Core Registers Tree */}
            <div className="p-3 rounded-lg bg-indigo-950 border border-indigo-500 text-indigo-200 flex-1 shadow-md">
              <div className="text-[9px] text-indigo-400 uppercase font-bold">Synchronized Reset Tree</div>
              <div className="font-bold text-xs">Core Registers</div>
              <div className="text-[10px] text-indigo-300 mt-1">Glitch-Free Release</div>
            </div>
          </div>
        </div>

        {/* Golden RTL for Reset Synchronizer */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synthesizable Reset Bridge Module (SystemVerilog):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`module reset_sync (
  input  wire clk,
  input  wire rst_async_n, // External asynchronous reset
  output wire rst_sync_n   // Clean synchronized reset for core flops
);
  // Async assert, Synchronous de-assert 2-FF bridge
  (* async_reg = "true" *) reg rst_meta_n, rst_sync_reg_n;

  always @(posedge clk or negedge rst_async_n) begin
    if (!rst_async_n) begin
      rst_meta_n     <= 1'b0; // Assert immediately on async reset falling edge
      rst_sync_reg_n <= 1'b0;
    end else begin
      rst_meta_n     <= 1'b1; // De-assert synchronously over 2 clock rising edges
      rst_sync_reg_n <= rst_meta_n;
    end
  end

  assign rst_sync_n = rst_sync_reg_n;
endmodule`}
          </pre>
        </div>
      </div>
    </div>
  );
}
