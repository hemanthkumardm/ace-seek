"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  Activity,
  Sliders,
  ShieldCheck,
  Zap,
} from "lucide-react";

export function CoverageStudioVisualizer() {
  // State for simulated random transactions
  const [txCount, setTxCount] = useState<number>(12);
  const [opcodeBins, setOpcodeBins] = useState<Record<string, number>>({
    ADD: 4,
    SUB: 3,
    AND: 3,
    OR: 2,
    XOR: 0,
    MUL: 0,
  });
  const [addrRangeBins, setAddrRangeBins] = useState<Record<string, number>>({
    LOW_0_63: 6,
    MID_64_191: 4,
    HIGH_192_255: 2,
  });
  const [svaStatus, setSvaStatus] = useState<"PASS" | "FAIL" | "VACUOUS">("PASS");
  const [reqAckDelay, setReqAckDelay] = useState<number>(2);

  // Generate new random transaction
  const handleRandomize = () => {
    const opcodes = ["ADD", "SUB", "AND", "OR", "XOR", "MUL"];
    const randomOp = opcodes[Math.floor(Math.random() * opcodes.length)];
    const randomAddr = Math.floor(Math.random() * 256);

    let addrBin = "LOW_0_63";
    if (randomAddr >= 192) addrBin = "HIGH_192_255";
    else if (randomAddr >= 64) addrBin = "MID_64_191";

    setOpcodeBins((prev) => ({
      ...prev,
      [randomOp]: (prev[randomOp] || 0) + 1,
    }));

    setAddrRangeBins((prev) => ({
      ...prev,
      [addrBin]: (prev[addrBin] || 0) + 1,
    }));

    setTxCount((prev) => prev + 1);

    // Random SVA check: req |-> ##[1:3] ack
    const delay = Math.floor(Math.random() * 4) + 1;
    setReqAckDelay(delay);
    setSvaStatus(delay <= 3 ? "PASS" : "FAIL");
  };

  const handleReset = () => {
    setTxCount(0);
    setOpcodeBins({ ADD: 0, SUB: 0, AND: 0, OR: 0, XOR: 0, MUL: 0 });
    setAddrRangeBins({ LOW_0_63: 0, MID_64_191: 0, HIGH_192_255: 0 });
    setSvaStatus("VACUOUS");
  };

  // Compute coverage metrics
  const opBinsHit = Object.values(opcodeBins).filter((v) => v > 0).length;
  const opCoveragePct = Math.round((opBinsHit / 6) * 100);

  const addrBinsHit = Object.values(addrRangeBins).filter((v) => v > 0).length;
  const addrCoveragePct = Math.round((addrBinsHit / 3) * 100);

  const overallCoveragePct = Math.round((opCoveragePct + addrCoveragePct) / 2);

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
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Coverage-Driven Verification (CDV) &amp; SVA Protocol Checker Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Constrained-Random Generation (CRV), Functional Coverage Bins &amp; SystemVerilog Assertions (SVA)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={handleRandomize}
            className="px-3 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold hover:brightness-110 flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Randomize Transaction ({txCount})
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-white transition-all"
            title="Reset Coverage Bins"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Coverage Dashboard Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Overall Functional Coverage</span>
            <span className={overallCoveragePct === 100 ? "text-emerald-400" : "text-amber-400"}>
              {overallCoveragePct}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-300 ${
                overallCoveragePct === 100 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${overallCoveragePct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">Target: 100% of all declared functional bins.</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Opcode Coverpoint (`cp_op`)</span>
            <span className="text-cyan-400">{opBinsHit} / 6 Bins ({opCoveragePct}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-300"
              style={{ width: `${opCoveragePct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">Covering ALU instructions: ADD, SUB, AND, OR, XOR, MUL.</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
            <span>Address Space (`cp_addr`)</span>
            <span className="text-indigo-400">{addrBinsHit} / 3 Ranges ({addrCoveragePct}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-indigo-400 transition-all duration-300"
              style={{ width: `${addrCoveragePct}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400">Ranges: Low (0..63), Mid (64..191), High (192..255).</div>
        </div>
      </div>

      {/* Interactive Coverage Bins Grid */}
      <div className="grid md:grid-cols-2 gap-4 mb-4 font-mono text-xs">
        {/* Opcode Bins */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-cyan-300 font-bold">Opcode Coverpoint Bins</span>
            <span className="text-[10px] text-slate-400">`coverpoint tx.opcode`</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(opcodeBins).map(([op, hits]) => (
              <div
                key={op}
                className={`p-2 rounded-lg border transition-all flex items-center justify-between ${
                  hits > 0
                    ? "bg-cyan-950/40 border-cyan-800 text-cyan-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-500"
                }`}
              >
                <span className="font-bold">{op}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {hits} hits
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Address Space Bins */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-indigo-300 font-bold">Address Range Bins</span>
            <span className="text-[10px] text-slate-400">`coverpoint tx.addr`</span>
          </div>
          <div className="space-y-2">
            {Object.entries(addrRangeBins).map(([range, hits]) => (
              <div
                key={range}
                className={`p-2 rounded-lg border transition-all flex items-center justify-between ${
                  hits > 0
                    ? "bg-indigo-950/40 border-indigo-800 text-indigo-200"
                    : "bg-slate-900/60 border-slate-800 text-slate-500"
                }`}
              >
                <span className="font-bold">{range}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                  {hits} hits
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SVA Concurrent Assertion Checker */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-amber-300 font-bold flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-400" />
            SystemVerilog Assertion (SVA) Protocol Checker: `p_req_to_ack`
          </span>
          <span
            className={`px-2.5 py-0.5 rounded text-xs font-bold ${
              svaStatus === "PASS"
                ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                : svaStatus === "FAIL"
                ? "bg-rose-950 text-rose-300 border border-rose-800 animate-pulse"
                : "bg-slate-800 text-slate-400"
            }`}
          >
            SVA Status: {svaStatus}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs space-y-1">
          <div><code>property p_req_to_ack;</code></div>
          <div className="pl-4"><code>@(posedge clk) req |-&gt; ##[1:3] ack;</code></div>
          <div><code>endproperty : p_req_to_ack</code></div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <span>Observed Latency: <strong className="text-white">{reqAckDelay} clock cycles</strong></span>
          <span>Constraint Limit: <strong className="text-white">&lt;= 3 cycles</strong></span>
          <span className={svaStatus === "PASS" ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
            {svaStatus === "PASS" ? "Handshake Compliant" : "Protocol Timeout Error (Latency > 3)!"}
          </span>
        </div>
      </div>
    </div>
  );
}
