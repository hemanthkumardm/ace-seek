"use client";

import React, { useState } from "react";
import { Cpu, ArrowRight, Layers, Split, GitMerge, CheckCircle2 } from "lucide-react";

export function ResourceSharingVisualizer() {
  const [shared, setShared] = useState<boolean>(true);

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
              Datapath Arithmetic Resource Sharing Explorer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Sharing multi-bit hardware adders across mutually exclusive conditional branches to slash silicon area
            </p>
          </div>
        </div>

        {/* Toggle Mode */}
        <button
          type="button"
          onClick={() => setShared((s) => !s)}
          className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
            shared
              ? "bg-emerald-500 text-slate-950 shadow-emerald-500/20"
              : "bg-[var(--ln-accent)] text-slate-950"
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          {shared ? "✓ Resource Sharing: ENABLED (1 Adder + 1 MUX)" : "Unshared: 2 Duplicate Adders"}
        </button>
      </div>

      {/* Circuit Schematic Viewport */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">RTL Expression: `assign y = sel ? (a + b) : (a + c);`</span>
          <span className={`font-bold ${shared ? "text-emerald-400" : "text-amber-400"}`}>
            {shared ? "Single Shared 32-Bit Adder (-44% Area)" : "Dual 32-Bit Duplicate Adders"}
          </span>
        </div>

        {/* Hardware Schematics Diagram */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-center gap-4 py-6">
          {shared ? (
            <div className="flex items-center gap-3">
              {/* Input Operands */}
              <div className="space-y-2">
                <div className="p-2.5 rounded bg-slate-950 border border-cyan-500/60 text-cyan-300 text-center">
                  <div>Operand B [31:0]</div>
                </div>
                <div className="p-2.5 rounded bg-slate-950 border border-cyan-500/60 text-cyan-300 text-center">
                  <div>Operand C [31:0]</div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500" />

              {/* 2:1 Input Multiplexer */}
              <div className="p-3.5 rounded-lg bg-amber-950/70 border border-amber-500 text-amber-200 text-center min-w-[120px]">
                <div className="text-[10px] text-amber-400 uppercase font-bold">2:1 MUX (sel)</div>
                <div className="font-black text-xs">Operand Steer</div>
                <div className="text-[9px] text-amber-300/80">Area: 18 µm²</div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500" />

              {/* Single Shared 32-Bit Full Adder */}
              <div className="p-4 rounded-xl bg-emerald-950 border border-emerald-400 text-emerald-300 text-center min-w-[160px] shadow-lg ring-2 ring-emerald-500/40">
                <div className="text-[9px] text-emerald-400 uppercase font-black">Shared Operator</div>
                <div className="font-black text-sm">1x 32-Bit Adder (+A)</div>
                <div className="text-[10px] text-emerald-200 font-bold mt-1">Area: 130 µm²</div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500" />

              {/* Output */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/60 text-cyan-300 text-center">
                <div className="font-bold">Result Y [31:0]</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Duplicate Adders */}
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/80 text-rose-300 text-center min-w-[140px]">
                  <div className="text-[9px] text-slate-400">Adder 1</div>
                  <div className="font-bold">32-Bit Adder (a + b)</div>
                  <div className="text-[9px] text-rose-400 mt-0.5">Area: 130 µm²</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-rose-500/80 text-rose-300 text-center min-w-[140px]">
                  <div className="text-[9px] text-slate-400">Adder 2</div>
                  <div className="font-bold">32-Bit Adder (a + c)</div>
                  <div className="text-[9px] text-rose-400 mt-0.5">Area: 130 µm²</div>
                </div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500" />

              {/* Output Mux */}
              <div className="p-3.5 rounded-lg bg-amber-950/70 border border-amber-500 text-amber-200 text-center min-w-[120px]">
                <div className="text-[10px] text-amber-400 uppercase font-bold">2:1 MUX (sel)</div>
                <div className="font-black text-xs">Output Steer Mux</div>
                <div className="text-[9px] text-amber-300/80">Area: 24 µm²</div>
              </div>

              <ArrowRight className="w-4 h-4 text-slate-500" />

              {/* Output */}
              <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/60 text-cyan-300 text-center">
                <div className="font-bold">Result Y [31:0]</div>
              </div>
            </div>
          )}
        </div>

        {/* Cost Comparison Summary */}
        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Total Datapath Area:</span>
            <span className="font-black text-cyan-300 text-sm">{shared ? "148.0 µm²" : "284.0 µm²"}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Silicon Area Savings:</span>
            <span className="font-black text-emerald-300 text-sm">{shared ? "-48% Area Saved ✓" : "0% (Duplicate Logic)"}</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Transistor Count:</span>
            <span className="font-black text-amber-300 text-sm">{shared ? "1,840 Transistors" : "3,520 Transistors"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
