"use client";

import React, { useState } from "react";
import { Cpu, Play, CheckCircle2, AlertCircle, ShieldCheck, ShieldAlert, Layers } from "lucide-react";

export function LecFormalityVisualizer() {
  const [injectBug, setInjectBug] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(false);
  const [status, setStatus] = useState<"PASSED" | "FAILED" | null>("PASSED");

  const runVerification = () => {
    setRunning(true);
    setStatus(null);
    setTimeout(() => {
      setRunning(false);
      setStatus(injectBug ? "FAILED" : "PASSED");
    }, 600);
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
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Formal Logic Equivalence Checking (LEC / Formality) Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Proving mathematical equivalence between Golden RTL and Revised Netlist via BDD &amp; SAT solvers
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInjectBug((b) => !b)}
            className={`px-3 py-1.5 rounded-lg font-mono font-bold text-xs transition-all ${
              injectBug
                ? "bg-rose-500 text-slate-950 font-black shadow-sm"
                : "bg-slate-800 text-slate-300 hover:text-white"
            }`}
          >
            {injectBug ? "⚠️ Netlist Inversion Error: INJECTED" : "Golden Compile (Clean)"}
          </button>

          <button
            type="button"
            onClick={runVerification}
            disabled={running}
            className="px-3.5 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold font-mono text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            {running ? "Solving SAT Equations..." : "Run Formality Proof"}
          </button>
        </div>
      </div>

      {/* Compare Points & Cones Viewport */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Formal BDD/SAT Solver Compare Point Network</span>
          <span className="text-slate-400">Comparing: <code>top_core.v</code> vs. <code>top_core_gates.v</code></span>
        </div>

        {/* Logic Cone Comparison Diagram */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Golden RTL Cone */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Golden RTL Model</span>
              <span className="text-cyan-400">Reference HDL</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-cyan-300 font-mono space-y-1">
              <div>// RTL Logic Cone:</div>
              <div><code>assign carry_out = (a &amp; b) | (cin &amp; (a ^ b));</code></div>
              <div className="text-[10px] text-slate-400">Compare Point: <code>carry_out_reg/D</code></div>
            </div>
          </div>

          {/* Revised Netlist Cone */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Revised Gate Netlist</span>
              <span className={injectBug ? "text-rose-400" : "text-emerald-400"}>
                {injectBug ? "Optimization Bug Injected" : "Synthesized Netlist"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1">
              <div className="text-slate-400">// Gate Netlist Cone:</div>
              <div className={injectBug ? "text-rose-300" : "text-emerald-300"}>
                <code>sky130_fd_sc_hd__aoi22_1 u_aoi (.A(a), .B(b), .C(cin), .D(xor_net), .Y(inv_carry));</code>
              </div>
              <div className="text-[10px] text-slate-400">Compare Point: <code>carry_out_reg/D</code></div>
            </div>
          </div>
        </div>

        {/* Formal Verification Results Summary */}
        <div className="grid sm:grid-cols-3 gap-2 text-center pt-1">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Total Key Points:</span>
            <span className="font-black text-cyan-300 text-sm">256 Registers / Ports</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Matched Points:</span>
            <span className="font-black text-emerald-300 text-sm">256 Points (100%)</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">Non-Equivalent Cones:</span>
            <span className={`font-black text-sm ${status === "FAILED" ? "text-rose-400" : "text-emerald-400"}`}>
              {status === "FAILED" ? "1 Cone FAILED ❌" : "0 Cones (Clean ✓)"}
            </span>
          </div>
        </div>

        {status && (
          <div
            className={`p-3.5 rounded-lg border text-xs font-sans font-bold flex items-center gap-2.5 ${
              status === "PASSED"
                ? "bg-emerald-950/70 border-emerald-500 text-emerald-200"
                : "bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse"
            }`}
          >
            {status === "PASSED" ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>[LEC-PASSED] Formal mathematical equivalence proven! Golden RTL exactly matches Revised Netlist across all 2^N state vector spaces.</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>[LEC-FAILED] Functional discrepancy detected at net `carry_out_reg`! The optimized gate netlist computes an inverted output cone on input `a=1, b=1`.</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
