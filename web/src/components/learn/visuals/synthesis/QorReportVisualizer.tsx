"use client";

import React, { useState } from "react";
import { Cpu, Activity, ArrowRight, ShieldAlert, CheckCircle2, FileText, Layers } from "lucide-react";

export function QorReportVisualizer() {
  const [selectedPath, setSelectedPath] = useState<"PATH_ALU" | "PATH_FIFO" | "PATH_CRITICAL">(
    "PATH_ALU"
  );

  const paths = {
    PATH_ALU: {
      name: "ALU Accumulator Loop",
      from: "u_core/u_alu/acc_reg[7] (sky130_fd_sc_hd__dfxtp_1)",
      to: "u_core/u_alu/result_reg[7] (sky130_fd_sc_hd__dfxtp_2)",
      launchClk: 0.0,
      c2q: 0.28,
      gates: [
        { name: "sky130_fd_sc_hd__xor2_1", delay: 0.12, type: "Controlled Inverter" },
        { name: "sky130_fd_sc_hd__fa_1", delay: 0.44, type: "Full Adder Bit 0-3" },
        { name: "sky130_fd_sc_hd__fa_2", delay: 0.38, type: "Full Adder Bit 4-7" },
        { name: "sky130_fd_sc_hd__aoi22_1", delay: 0.22, type: "Overflow Detector" },
      ],
      netDelay: 0.38,
      setupTime: 0.12,
      clockPeriod: 2.5,
      slack: "+0.54 ns (MET ✓)",
      status: "PASS",
    },
    PATH_FIFO: {
      name: "Synchronous FIFO Read Output",
      from: "u_fifo/rd_ptr_reg[3] (sky130_fd_sc_hd__dfxtp_1)",
      to: "u_fifo/dout_reg[15] (sky130_fd_sc_hd__dfxtp_1)",
      launchClk: 0.0,
      c2q: 0.26,
      gates: [
        { name: "sky130_fd_sc_hd__dec24_1", delay: 0.32, type: "Address Decoder" },
        { name: "sky130_fd_sc_hd__mux4_2", delay: 0.54, type: "Word Multiplexer" },
        { name: "sky130_fd_sc_hd__inv_4", delay: 0.08, type: "Line Driver" },
      ],
      netDelay: 0.46,
      setupTime: 0.11,
      clockPeriod: 2.5,
      slack: "+0.73 ns (MET ✓)",
      status: "PASS",
    },
    PATH_CRITICAL: {
      name: "FSM State Controller to Multiplier (Critical Path)",
      from: "u_fsm/state_reg[3] (sky130_fd_sc_hd__dfxtp_1)",
      to: "u_mult/prod_reg[15] (sky130_fd_sc_hd__dfxtp_1)",
      launchClk: 0.0,
      c2q: 0.31,
      gates: [
        { name: "sky130_fd_sc_hd__nor3_1", delay: 0.38, type: "State Decoder" },
        { name: "sky130_fd_sc_hd__aoi222_1", delay: 0.52, type: "Operand Gate" },
        { name: "sky130_fd_sc_hd__cla8_2", delay: 1.25, type: "8-Bit Carry Lookahead" },
        { name: "sky130_fd_sc_hd__mux2_4", delay: 0.32, type: "Output Steer Mux" },
      ],
      netDelay: 0.68,
      setupTime: 0.14,
      clockPeriod: 2.5,
      slack: "-0.60 ns (VIOLATION ⚠️)",
      status: "FAIL",
    },
  };

  const curr = paths[selectedPath];
  const logicDelayTotal = curr.gates.reduce((acc, g) => acc + g.delay, 0);
  const dataArrivalTime = (curr.c2q + logicDelayTotal + curr.netDelay).toFixed(2);
  const dataRequiredTime = (curr.clockPeriod - curr.setupTime).toFixed(2);

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
              Synthesis Quality of Results (QoR) &amp; Path Slack Inspector
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive analysis of cell propagation delays, net interconnect RC, and setup slack endpoints
            </p>
          </div>
        </div>

        {/* Path Selectors */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(["PATH_ALU", "PATH_FIFO", "PATH_CRITICAL"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setSelectedPath(p)}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                selectedPath === p
                  ? "bg-[var(--ln-accent)] text-slate-950 font-bold shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {p === "PATH_ALU" ? "ALU Path" : p === "PATH_FIFO" ? "FIFO Path" : "Critical Path (Violating)"}
            </button>
          ))}
        </div>
      </div>

      {/* Path Schematic Breakdown */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div>
            <span className="text-cyan-300 font-bold block">{curr.name}</span>
            <span className="text-[10px] text-slate-400">Launch: {curr.from} ➔ Capture: {curr.to}</span>
          </div>
          <span
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              curr.status === "PASS"
                ? "bg-emerald-950 border border-emerald-500 text-emerald-300"
                : "bg-rose-950 border border-rose-500 text-rose-300 animate-pulse"
            }`}
          >
            Slack: {curr.slack}
          </span>
        </div>

        {/* Gate Delay Cascade Diagram */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Combinational Logic Gate Delay Cone:</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {curr.gates.map((g, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs font-bold text-white">
                  <span>{g.name}</span>
                  <span className="text-cyan-400">+{g.delay} ns</span>
                </div>
                <div className="text-[10px] text-slate-400">{g.type}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Path Delay Equation Card */}
        <div className="grid sm:grid-cols-4 gap-2 text-center pt-2">
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">1. Clock-to-Q (Tc2q):</span>
            <span className="font-black text-amber-300 text-sm">{curr.c2q} ns</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">2. Gate Logic Delay:</span>
            <span className="font-black text-cyan-300 text-sm">{logicDelayTotal.toFixed(2)} ns</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">3. Interconnect Wire RC:</span>
            <span className="font-black text-emerald-300 text-sm">{curr.netDelay} ns</span>
          </div>
          <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-bold">4. Total Data Arrival:</span>
            <span className={`font-black text-sm ${curr.status === "PASS" ? "text-emerald-400" : "text-rose-400"}`}>
              {dataArrivalTime} ns
            </span>
          </div>
        </div>

        {/* EDA Tool Output Synthesis Report Preview */}
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synthesizer Timing Report Snippet:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-slate-300 text-[10px] border border-slate-800 leading-relaxed overflow-x-auto">
            {`  Point                                       Incr       Path
  ------------------------------------------------------------------
  clock clk (rise edge)                       0.00       0.00
  ${curr.from}/CLK                               0.00       0.00 r
  ${curr.from}/Q (Tc2q)                         ${curr.c2q}       ${curr.c2q} f
  ${curr.gates.map((g) => `u_logic/${g.name}/Y                                ${g.delay}       ...`).join("\n  ")}
  data arrival time                                      ${dataArrivalTime}

  clock clk (rise edge)                       ${curr.clockPeriod.toFixed(2)}       ${curr.clockPeriod.toFixed(2)}
  library setup time                         -${curr.setupTime}       ${dataRequiredTime}
  data required time                                     ${dataRequiredTime}
  ------------------------------------------------------------------
  slack (${curr.status === "PASS" ? "MET" : "VIOLATED"})                                         ${curr.slack}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
