"use client";

import React, { useState, useMemo } from "react";
import { Cpu, RefreshCw, Zap, Layers, Activity } from "lucide-react";

export function NumberSystemVisualizer() {
  const [bits, setBits] = useState<number[]>([0, 0, 0, 1, 1, 0, 0, 1]); // 25 decimal = 00011001
  const [decInput, setDecInput] = useState("25");
  const [mode, setMode] = useState<"bits" | "division" | "voltage">("bits");

  const toggleBit = (index: number) => {
    setBits((prev) => {
      const next = [...prev];
      next[index] = next[index] === 1 ? 0 : 1;
      return next;
    });
  };

  const setAllBits = (val: number) => {
    setBits(Array(8).fill(val));
  };

  const randomize = () => {
    setBits(Array.from({ length: 8 }, () => (Math.random() > 0.5 ? 1 : 0)));
  };

  // Conversions
  const unsignedDec = useMemo(() => {
    return bits.reduce((acc, bit, idx) => acc + bit * Math.pow(2, 7 - idx), 0);
  }, [bits]);

  const signedDec = useMemo(() => {
    const isNegative = bits[0] === 1;
    if (!isNegative) return unsignedDec;
    // Two's complement calculation
    const magnitude = bits
      .slice(1)
      .reduce((acc, bit, idx) => acc + bit * Math.pow(2, 6 - idx), 0);
    return magnitude - 128;
  }, [bits, unsignedDec]);

  const hexVal = useMemo(() => {
    const high = bits.slice(0, 4).reduce((acc, bit, idx) => acc + bit * Math.pow(2, 3 - idx), 0);
    const low = bits.slice(4, 8).reduce((acc, bit, idx) => acc + bit * Math.pow(2, 3 - idx), 0);
    return `${high.toString(16).toUpperCase()}${low.toString(16).toUpperCase()}`;
  }, [bits]);

  const bcdVal = useMemo(() => {
    const hundreds = Math.floor(unsignedDec / 100);
    const tens = Math.floor((unsignedDec % 100) / 10);
    const ones = unsignedDec % 10;
    const to4Bit = (n: number) => n.toString(2).padStart(4, "0");
    return `${to4Bit(hundreds)} ${to4Bit(tens)} ${to4Bit(ones)}`;
  }, [unsignedDec]);

  // Division steps for custom decimal input
  const divisionSteps = useMemo(() => {
    const n = parseInt(decInput, 10);
    if (isNaN(n) || n < 0 || n > 255) return [];
    let curr = n;
    const steps: { step: number; dividend: number; quotient: number; remainder: number }[] = [];
    let stepNum = 1;
    if (curr === 0) {
      steps.push({ step: 1, dividend: 0, quotient: 0, remainder: 0 });
      return steps;
    }
    while (curr > 0) {
      const q = Math.floor(curr / 2);
      const r = curr % 2;
      steps.push({ step: stepNum++, dividend: curr, quotient: q, remainder: r });
      curr = q;
    }
    return steps;
  }, [decInput]);

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
              Interactive Digital Number System & Bit Analyzer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Toggle 8-bit register positions to observe instant multi-base conversions
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          <button
            type="button"
            onClick={() => {
              setDecInput(String(unsignedDec));
              setMode("bits");
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mode === "bits"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Bit Register
          </button>
          <button
            type="button"
            onClick={() => {
              setDecInput(String(unsignedDec));
              setMode("division");
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mode === "division"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Division ÷ 2 Steps
          </button>
          <button
            type="button"
            onClick={() => setMode("voltage")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              mode === "voltage"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Noise Margins
          </button>
        </div>
      </div>

      {mode === "bits" && (
        <div className="space-y-6">
          {/* Interactive 8-bit register */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ln-muted)]">
              <span>MSB (Bit 7 - Sign bit in 2's comp)</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={randomize}
                  className="px-2 py-0.5 rounded border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] flex items-center gap-1 text-[11px]"
                >
                  <RefreshCw className="w-3 h-3" /> Randomize
                </button>
                <button
                  type="button"
                  onClick={() => setAllBits(0)}
                  className="px-2 py-0.5 rounded border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] text-[11px]"
                >
                  Clear (0)
                </button>
                <button
                  type="button"
                  onClick={() => setAllBits(1)}
                  className="px-2 py-0.5 rounded border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] text-[11px]"
                >
                  Set All (1)
                </button>
              </div>
              <span>LSB (Bit 0)</span>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {bits.map((bit, idx) => {
                const bitPos = 7 - idx;
                const weight = Math.pow(2, bitPos);
                const isOne = bit === 1;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleBit(idx)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                      isOne
                        ? "border-[var(--ln-accent)] bg-[var(--ln-accent-soft)] shadow-[0_0_12px_rgba(20,184,166,0.25)] scale-[1.03]"
                        : "border-[var(--ln-border)] bg-[var(--ln-bg)] hover:border-[var(--ln-muted)] opacity-70"
                    }`}
                  >
                    <span
                      className={`text-xl font-black font-mono transition-colors ${
                        isOne ? "text-[var(--ln-accent)]" : "text-[var(--ln-text)]"
                      }`}
                    >
                      {bit}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--ln-muted)] mt-1">
                      2<sup>{bitPos}</sup>
                    </span>
                    <span
                      className={`text-[9px] font-semibold mt-0.5 ${
                        isOne ? "text-[var(--ln-accent)]" : "text-[var(--ln-muted)]"
                      }`}
                    >
                      +{isOne ? weight : 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mathematical Decomposition Formula */}
          <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] font-mono text-xs overflow-x-auto">
            <div className="text-[11px] text-[var(--ln-muted)] mb-1">
              Polynomial Weight Expansion:
            </div>
            <div className="text-[var(--ln-text)] whitespace-nowrap">
              {bits
                .map((b, i) => `(${b} × 2^${7 - i})`)
                .join(" + ")}{" "}
              ={" "}
              <span className="font-bold text-[var(--ln-accent)]">{unsignedDec} (decimal)</span>
            </div>
          </div>

          {/* Output Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
              <span className="text-[10px] font-bold tracking-wider text-[var(--ln-muted)] uppercase">
                Unsigned Dec
              </span>
              <div className="text-xl font-bold font-mono text-[var(--ln-text)] mt-1">
                {unsignedDec}
              </div>
              <span className="text-[10px] text-[var(--ln-muted)]">Range: 0 to 255</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
              <span className="text-[10px] font-bold tracking-wider text-[var(--ln-muted)] uppercase">
                Signed 2's Comp
              </span>
              <div
                className={`text-xl font-bold font-mono mt-1 ${
                  signedDec < 0 ? "text-amber-400" : "text-[var(--ln-text)]"
                }`}
              >
                {signedDec > 0 ? `+${signedDec}` : signedDec}
              </div>
              <span className="text-[10px] text-[var(--ln-muted)]">Range: -128 to +127</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
              <span className="text-[10px] font-bold tracking-wider text-[var(--ln-muted)] uppercase">
                Hexadecimal
              </span>
              <div className="text-xl font-bold font-mono text-[var(--ln-accent)] mt-1">
                0x{hexVal}
              </div>
              <span className="text-[10px] text-[var(--ln-muted)]">4-bit nibbles: [H:L]</span>
            </div>

            <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
              <span className="text-[10px] font-bold tracking-wider text-[var(--ln-muted)] uppercase">
                BCD (12-bit)
              </span>
              <div className="text-sm font-bold font-mono text-cyan-400 mt-2 truncate">
                {bcdVal}
              </div>
              <span className="text-[10px] text-[var(--ln-muted)]">Digit-by-digit 4-bit</span>
            </div>
          </div>
        </div>
      )}

      {mode === "division" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-[var(--ln-text)]">
              Enter Decimal Integer (0 - 255):
            </label>
            <input
              type="number"
              min="0"
              max="255"
              value={decInput}
              onChange={(e) => {
                const v = e.target.value;
                setDecInput(v);
                const n = parseInt(v, 10);
                if (!isNaN(n) && n >= 0 && n <= 255) {
                  const binArr = n
                    .toString(2)
                    .padStart(8, "0")
                    .split("")
                    .map((x) => parseInt(x, 10));
                  setBits(binArr);
                }
              }}
              className="px-3 py-1.5 rounded bg-[var(--ln-bg)] border border-[var(--ln-border)] text-sm font-mono text-[var(--ln-accent)] w-24 text-center focus:outline-none focus:border-[var(--ln-accent)]"
            />
            <span className="text-xs text-[var(--ln-muted)]">
              Resulting Binary:{" "}
              <span className="font-mono font-bold text-[var(--ln-accent)]">
                {(() => {
                  const n = parseInt(decInput, 10);
                  return Number.isInteger(n) && n >= 0 && n <= 255
                    ? n.toString(2).padStart(8, "0")
                    : "--------";
                })()}
              </span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-[var(--ln-border)] rounded-lg">
              <thead className="bg-[var(--ln-bg)] border-b border-[var(--ln-border)] font-semibold text-[var(--ln-muted)]">
                <tr>
                  <th className="p-2.5">Step</th>
                  <th className="p-2.5">Division (N ÷ 2)</th>
                  <th className="p-2.5">Quotient (Q)</th>
                  <th className="p-2.5">Remainder (R)</th>
                  <th className="p-2.5">Bit Position</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--ln-border)] font-mono">
                {divisionSteps.map((s, idx) => (
                  <tr
                    key={s.step}
                    className={idx === divisionSteps.length - 1 ? "bg-[var(--ln-accent-soft)]" : ""}
                  >
                    <td className="p-2.5 font-bold text-[var(--ln-muted)]">#{s.step}</td>
                    <td className="p-2.5">
                      {s.dividend} ÷ 2
                    </td>
                    <td className="p-2.5 font-bold text-[var(--ln-text)]">{s.quotient}</td>
                    <td className="p-2.5">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] font-black">
                        {s.remainder}
                      </span>
                    </td>
                    <td className="p-2.5 text-[var(--ln-muted)]">
                      b<sub>{s.step - 1}</sub> {idx === divisionSteps.length - 1 ? "(MSB)" : idx === 0 ? "(LSB)" : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--ln-muted)] italic">
            Read remainders from bottom to top:{" "}
            <span className="font-mono font-bold text-[var(--ln-accent)]">
              {divisionSteps
                .slice()
                .reverse()
                .map((s) => s.remainder)
                .join("") || "0"}
            </span>
          </p>
        </div>
      )}

      {mode === "voltage" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Output vs Input Thresholds */}
            <div className="p-4 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--ln-accent)] uppercase">
                <Activity className="w-4 h-4" /> 3.3V CMOS Voltage Thresholds
              </div>

              <div className="relative h-44 bg-slate-900 rounded border border-slate-700 p-2 flex flex-col justify-between text-[11px] font-mono">
                {/* 3.3V High logic */}
                <div className="bg-emerald-950/80 border-b border-emerald-500/50 p-1 rounded text-emerald-300 flex justify-between items-center">
                  <span>Logic 1 Valid (VOH = 2.4V to 3.3V)</span>
                  <span className="font-bold">HIGH</span>
                </div>

                {/* Noise Margin High */}
                <div className="bg-amber-950/60 border-y border-dashed border-amber-500/40 p-1 text-amber-300 text-[10px] flex justify-between">
                  <span>NMH (Noise Margin High) = VOH - VIH</span>
                  <span>0.4V Margin</span>
                </div>

                {/* Undefined region */}
                <div className="bg-rose-950/70 border-y border-rose-500/50 p-1 text-rose-400 flex justify-between items-center">
                  <span>Undefined / Forbidden Region</span>
                  <span className="text-[10px] font-bold">METASTABLE</span>
                </div>

                {/* Noise Margin Low */}
                <div className="bg-amber-950/60 border-y border-dashed border-amber-500/40 p-1 text-amber-300 text-[10px] flex justify-between">
                  <span>NML (Noise Margin Low) = VIL - VOL</span>
                  <span>0.4V Margin</span>
                </div>

                {/* 0V Low logic */}
                <div className="bg-cyan-950/80 border-t border-cyan-500/50 p-1 rounded text-cyan-300 flex justify-between items-center">
                  <span>Logic 0 Valid (0.0V to VOL = 0.4V)</span>
                  <span className="font-bold">LOW</span>
                </div>
              </div>
            </div>

            {/* Invariant formulas */}
            <div className="p-4 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-3 text-xs">
              <div className="font-bold text-[var(--ln-text)]">
                Why Noise Margins Matter on Silicon
              </div>
              <p className="text-[var(--ln-muted)]">
                Electrical noise from power supply ripple (IR drop), crosstalk coupling capacitance,
                and thermal noise constantly perturb voltage lines.
              </p>
              <div className="p-2.5 rounded bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] space-y-1 font-mono text-[11px]">
                <div className="text-[var(--ln-accent)] font-semibold">
                  NMH = VOH(min) - VIH(min)
                </div>
                <div className="text-[var(--ln-accent)] font-semibold">
                  NML = VIL(max) - VOL(max)
                </div>
              </div>
              <p className="text-[var(--ln-muted)] text-[11px]">
                If noise amplitude stays within NMH and NML, the digital gate reliably regenerates
                clean logic 1s and 0s with zero bit corruption.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
