"use client";

import React, { useState } from "react";
import {
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  FileCode,
  Box,
  Cpu,
  RefreshCw,
  Zap,
} from "lucide-react";

export type UvmPhaseId =
  | "BUILD_PHASE"
  | "CONNECT_PHASE"
  | "RUN_PHASE"
  | "CHECK_PHASE"
  | "REPORT_PHASE";

export function UvmArchitectureVisualizer() {
  const [activePhase, setActivePhase] = useState<UvmPhaseId>("RUN_PHASE");
  const [objectionRaised, setObjectionRaised] = useState<boolean>(true);
  const [txIndex, setTxIndex] = useState<number>(4);
  const [scoreboardMatches, setScoreboardMatches] = useState<number>(4);
  const [ralMode, setRalMode] = useState<"FRONTDOOR" | "BACKDOOR">("FRONTDOOR");

  const handleStepPhase = () => {
    const phases: UvmPhaseId[] = [
      "BUILD_PHASE",
      "CONNECT_PHASE",
      "RUN_PHASE",
      "CHECK_PHASE",
      "REPORT_PHASE",
    ];
    const currentIndex = phases.indexOf(activePhase);
    const nextPhase = phases[(currentIndex + 1) % phases.length];
    setActivePhase(nextPhase);
  };

  const handleSendTransaction = () => {
    setTxIndex((prev) => prev + 1);
    setScoreboardMatches((prev) => prev + 1);
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
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Universal Verification Methodology (UVM) Architecture Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Component Hierarchy, Execution Phases, TLM Communication &amp; Register Abstraction Layer (RAL)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={handleSendTransaction}
            className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold hover:brightness-110 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Send Sequence Item (#{txIndex})
          </button>
          <button
            type="button"
            onClick={handleStepPhase}
            className="px-3 py-1.5 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] text-cyan-300 font-bold hover:text-white transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Advance Phase
          </button>
        </div>
      </div>

      {/* Phase Execution Pipeline Tracker */}
      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 mb-4 font-mono text-xs space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
          <span>UVM Common Execution Phases</span>
          <span className="text-cyan-400">Active: {activePhase}</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {[
            { id: "BUILD_PHASE", label: "1. Build (Top-Down)" },
            { id: "CONNECT_PHASE", label: "2. Connect (Bottom-Up)" },
            { id: "RUN_PHASE", label: "3. Run (Time / Objections)" },
            { id: "CHECK_PHASE", label: "4. Check (Audit)" },
            { id: "REPORT_PHASE", label: "5. Report (QoR)" },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePhase(p.id as UvmPhaseId)}
              className={`py-1.5 px-1 rounded text-[10px] font-bold transition-all ${
                activePhase === p.id
                  ? "bg-cyan-400 text-slate-950 shadow-sm"
                  : "bg-slate-900 text-slate-400 hover:text-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* UVM Testbench Architecture Topology Diagram */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold flex items-center gap-2">
            <Box className="w-4 h-4 text-cyan-400" />
            Standard UVM Environment (`uvm_env`) Component Hierarchy
          </span>
          <span className="text-[10px] text-slate-400">IEEE 1800.2 UVM Standard</span>
        </div>

        {/* Tree Topology Grid */}
        <div className="grid md:grid-cols-12 gap-3 items-center">
          {/* Virtual Sequencer & Sequences */}
          <div className="md:col-span-3 p-3 rounded-xl bg-indigo-950/30 border border-indigo-800/60 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-indigo-300 font-bold uppercase">
              <span>Sequencer (`uvm_sequencer`)</span>
            </div>
            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <div className="text-indigo-400 font-bold">Sequence Item Stream:</div>
              <div className="text-slate-300 text-[10px]">`alu_seq_item` #0x{txIndex.toString(16).toUpperCase()}</div>
              <div className="text-[10px] text-slate-400">`start_item()` -&gt; `finish_item()`</div>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-1 justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-indigo-400" />
          </div>

          {/* Active Agent: Driver & Monitor */}
          <div className="md:col-span-4 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/60 space-y-2.5">
            <div className="flex justify-between items-center text-[10px] text-cyan-300 font-bold uppercase">
              <span>Active Agent (`uvm_agent`)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                `is_active = UVM_ACTIVE`
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-cyan-300">Driver:</span>
                  <div className="text-[10px] text-slate-400">Drives `vif.cb.req` onto DUT</div>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                  Active Pin Wires
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="font-bold text-cyan-300">Monitor:</span>
                  <div className="text-[10px] text-slate-400">Samples `vif.cb.rsp` and broadcasts</div>
                </div>
                <span className="text-[10px] text-cyan-300 font-bold font-mono">
                  `analysis_port`
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-1 justify-center text-slate-600">
            <ArrowRight className="w-5 h-5 text-cyan-400" />
          </div>

          {/* Scoreboard */}
          <div className="md:col-span-3 p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-emerald-300 font-bold uppercase">
              <span>Scoreboard (`uvm_scoreboard`)</span>
            </div>
            <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] space-y-1">
              <div className="text-emerald-400 font-bold">Golden Model Comparison:</div>
              <div className="text-slate-300 text-[10px]">Matches: <strong className="text-emerald-400">{scoreboardMatches}</strong></div>
              <div className="text-slate-300 text-[10px]">Mismatches: <strong className="text-emerald-400">0 (100% Clean)</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* RAL Register Abstraction Layer Inspector */}
      <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-amber-300 font-bold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            Register Abstraction Layer (RAL): `ral_model.CTRL_REG`
          </span>
          <div className="flex items-center gap-1.5">
            {(["FRONTDOOR", "BACKDOOR"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setRalMode(m)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  ralMode === m
                    ? "bg-amber-400 text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {m === "FRONTDOOR" ? "Frontdoor (Bus / Cycles)" : "Backdoor (0-Time Poke)"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-[11px] space-y-1">
          {ralMode === "FRONTDOOR" ? (
            <div>
              <code>ral_model.CTRL_REG.write(status, 32'h0000_0001, .parent(this));</code>
              <div className="text-[10px] text-slate-400 pt-1">
                Executes complete physical bus sequence (e.g. AXI/APB transaction with address phase, wait states, and acknowledge).
              </div>
            </div>
          ) : (
            <div>
              <code>ral_model.CTRL_REG.poke(status, 32'h0000_0001);</code>
              <div className="text-[10px] text-slate-400 pt-1">
                Direct zero-simulation-time hierarchical register deposit (`hdl_path`) bypassing bus adapter and physical cycles.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
