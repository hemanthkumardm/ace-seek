"use client";

import React, { useState, useMemo } from "react";
import { Cpu, Zap, Layers, RefreshCw, CheckCircle2 } from "lucide-react";

export function MultiplierVisualizer() {
  const [multiplicand, setMultiplicand] = useState<number>(5); // 4-bit: 5 (0101)
  const [multiplier, setMultiplier] = useState<number>(3); // 4-bit: 3 (0011)
  const [mode, setMode] = useState<"booth" | "array">("booth");

  // Format 4-bit binary
  const toBin4 = (n: number) => (n & 0xf).toString(2).padStart(4, "0");

  // Booth Radix-4 Recoding: 4-bit multiplier with implicit B[-1] = 0
  // Multiplier bits: B3, B2, B1, B0, B[-1]
  // Group 0: (B1, B0, B[-1])
  // Group 1: (B3, B2, B1)
  const boothGroups = useMemo(() => {
    const b = multiplier & 0xf;
    const b0 = (b >> 0) & 1;
    const b1 = (b >> 1) & 1;
    const b2 = (b >> 2) & 1;
    const b3 = (b >> 3) & 1;
    const bm1 = 0; // B[-1]

    const group0Code = (b1 << 2) | (b0 << 1) | bm1;
    const group1Code = (b3 << 2) | (b2 << 1) | b1;

    const decode = (code: number) => {
      switch (code) {
        case 0b000:
          return { op: "0 × A", mult: 0, desc: "0" };
        case 0b001:
          return { op: "+1 × A", mult: 1, desc: "+A" };
        case 0b010:
          return { op: "+1 × A", mult: 1, desc: "+A" };
        case 0b011:
          return { op: "+2 × A", mult: 2, desc: "+2A (Shift left)" };
        case 0b100:
          return { op: "-2 × A", mult: -2, desc: "-2A (2's comp shift)" };
        case 0b101:
          return { op: "-1 × A", mult: -1, desc: "-A (2's comp)" };
        case 0b110:
          return { op: "-1 × A", mult: -1, desc: "-A (2's comp)" };
        case 0b111:
          return { op: "0 × A", mult: 0, desc: "0" };
        default:
          return { op: "0", mult: 0, desc: "0" };
      }
    };

    const g0 = decode(group0Code);
    const g1 = decode(group1Code);

    return [
      { idx: 0, bits: `${b1}${b0}${bm1}`, ...g0, ppVal: g0.mult * multiplicand },
      { idx: 1, bits: `${b3}${b2}${b1}`, ...g1, ppVal: g1.mult * multiplicand * 4 },
    ];
  }, [multiplier, multiplicand]);

  const product = multiplicand * multiplier;

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{
        background: "var(--ln-bg-elev)",
        border: "1px solid var(--ln-border)",
      }}
    >
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Multiplier & Booth Radix-4 Reduction Pad
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Halving partial products via 3-bit overlapping Booth windows & Carry-Save reduction
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          <button
            type="button"
            onClick={() => setMode("booth")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mode === "booth"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Booth Radix-4 (N/2 Rows)
          </button>
          <button
            type="button"
            onClick={() => setMode("array")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mode === "array"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Standard Array Multiplier (N Rows)
          </button>
        </div>
      </div>

      {/* Interactive Operands Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Multiplicand A */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-[var(--ln-text)]">Multiplicand (A):</span>
            <span className="text-[var(--ln-accent)] font-bold text-sm">
              {multiplicand} (4'b{toBin4(multiplicand)})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 3, 5, 7, 9, 11, 13, 15].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMultiplicand(val)}
                className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                  multiplicand === val
                    ? "bg-[var(--ln-accent)] text-slate-950"
                    : "bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Multiplier B */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="font-bold text-[var(--ln-text)]">Multiplier (B):</span>
            <span className="text-cyan-400 font-bold text-sm">
              {multiplier} (4'b{toBin4(multiplier)})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 5, 6, 7, 10, 14].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setMultiplier(val)}
                className={`flex-1 py-1 rounded text-xs font-mono font-bold transition-all ${
                  multiplier === val
                    ? "bg-cyan-400 text-slate-950 font-black"
                    : "bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      </div>

      {mode === "booth" ? (
        /* Booth Radix-4 Recoding Visualizer */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-emerald-400 font-bold">
                RADIX-4 BOOTH 3-BIT WINDOW ENCODING (Only 2 Partial Products!)
              </span>
              <span className="text-[10px] text-cyan-400">50% Area & Adder Tree Reduction</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {boothGroups.map((g) => (
                <div
                  key={g.idx}
                  className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5"
                >
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Window #{g.idx}:</span>
                    <span className="text-amber-300 font-bold">
                      {g.idx === 0 ? "[B1, B0, B-1]" : "[B3, B2, B1]"} = 3'b{g.bits}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-white flex justify-between">
                    <span>Operation:</span>
                    <span className="text-[var(--ln-accent)]">{g.op} ({g.desc})</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex justify-between pt-1 border-t border-slate-800">
                    <span>Row Value:</span>
                    <span className="font-bold text-emerald-400">
                      {g.ppVal >= 0 ? `+${g.ppVal}` : g.ppVal}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Summation Equation */}
            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-300 font-bold">
                Final Product: ({boothGroups[0].ppVal}) + ({boothGroups[1].ppVal})
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                = {product} (8'b{product.toString(2).padStart(8, "0")})
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Standard Array Multiplier Visualizer */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-amber-400 font-bold">
                STANDARD 4x4 ARRAY MULTIPLIER (4 Partial Product Rows)
              </span>
              <span className="text-[10px] text-slate-400">Ripple Carry Accumulation</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
              {[0, 1, 2, 3].map((bitIdx) => {
                const bitVal = (multiplier >> bitIdx) & 1;
                const rowVal = bitVal === 1 ? multiplicand << bitIdx : 0;
                return (
                  <div key={bitIdx} className="flex justify-between items-center">
                    <span className="text-slate-400">
                      PP{bitIdx} (A × B[{bitIdx}] &lt;&lt; {bitIdx}):
                    </span>
                    <span className={bitVal === 1 ? "text-cyan-300 font-bold" : "text-slate-600"}>
                      {bitVal === 1 ? `${multiplicand} << ${bitIdx} = ${rowVal}` : "0000"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-sm">
              <span className="text-slate-300 font-bold">Product Result:</span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                = {product}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Silicon Datapath Guide: Array Multipliers vs. Booth Radix-4 Recoding
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Standard Array Multiplier */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>1. Standard Array Multiplier ($N$ Rows)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Computes partial products by simple bitwise AND operations ($PP_i = A \times B[i] \ll i$). An $N$-bit multiplier generates $N$ full partial product rows, resulting in a tall, slow adder tree with long carry propagation delays.
            </p>
          </div>

          {/* Column 2: Booth Radix-4 Recoding */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Booth Radix-4 ($N/2$ Rows)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Examines 3 overlapping multiplier bits (B[2i+1], B[2i], B[2i-1]) to select operations from {"{-2A, -A, 0, +A, +2A}"}. This <strong>cuts the number of partial product rows in half (N/2)</strong>, reducing adder tree area and critical path delay by ~50%.
            </p>
          </div>

          {/* Column 3: Wallace Tree Compression */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. Carry-Save Adder (CSA) Trees</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Instead of rippling carries across columns, 3:2 full adders compress 3 partial product rows down to 2 rows (Sum and Carry) without horizontal carry ripple. Final addition is performed in a single fast Carry-Lookahead Adder (CLA).
            </p>
          </div>
        </div>

        {/* Interactive Try-It-Yourself Checklist */}
        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono space-y-1.5">
          <div className="font-bold text-cyan-400 uppercase text-[10px]">
            🧪 Interactive Experiments to Try:
          </div>
          <ul className="space-y-1 text-slate-300 list-disc list-inside">
            <li>
              <strong>Compare Row Counts:</strong> Toggle between <em>Booth Radix-4</em> (only 2 partial products for 4-bit) and <em>Standard Array Multiplier</em> (4 partial products).
            </li>
            <li>
              <strong>Observe Shift Operations:</strong> Pick multiplier $B = 3$ (<code>3'b011</code> on window 0). Notice it evaluates to $+2A$ (shift multiplicand left by 1).
            </li>
            <li>
              <strong>Test Negative Multipliers:</strong> Pick multiplier $B = 7$ (<code>3'b100</code> on window 1) to see two's complement $-2A$ generation.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
