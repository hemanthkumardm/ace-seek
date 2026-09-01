"use client";

import React, { useState, useMemo } from "react";
import { Cpu, Zap, Sliders, ToggleLeft, ToggleRight, CheckCircle2 } from "lucide-react";

type GateType =
  | "AND"
  | "OR"
  | "NAND"
  | "NOR"
  | "XOR"
  | "XNOR"
  | "NOT"
  | "MUX4"
  | "FULL_ADDER"
  | "DEC24";

export function LogicGateVisualizer({ initialGate = "AND" }: { initialGate?: GateType }) {
  const [gate, setGate] = useState<GateType>(initialGate);
  const [inA, setInA] = useState<0 | 1>(1);
  const [inB, setInB] = useState<0 | 1>(0);
  const [inCin, setInCin] = useState<0 | 1>(0);
  const [muxSel, setMuxSel] = useState<0 | 1 | 2 | 3>(0);
  const [muxD, setMuxD] = useState<[0 | 1, 0 | 1, 0 | 1, 0 | 1]>([1, 0, 1, 0]);

  // Compute outputs
  const output = useMemo(() => {
    switch (gate) {
      case "AND":
        return inA & inB;
      case "OR":
        return inA | inB;
      case "NAND":
        return (inA & inB) === 1 ? 0 : 1;
      case "NOR":
        return (inA | inB) === 1 ? 0 : 1;
      case "XOR":
        return inA ^ inB;
      case "XNOR":
        return (inA ^ inB) === 1 ? 0 : 1;
      case "NOT":
        return inA === 1 ? 0 : 1;
      case "MUX4":
        return muxD[muxSel];
      case "FULL_ADDER": {
        const sum = inA ^ inB ^ inCin;
        const cout = (inA & inB) | (inCin & (inA ^ inB));
        return { sum, cout };
      }
      case "DEC24": {
        const idx = (inA << 1) | inB;
        return [0, 1, 2, 3].map((i) => (i === idx ? 1 : 0));
      }
      default:
        return 0;
    }
  }, [gate, inA, inB, inCin, muxSel, muxD]);

  // Truth table generator
  const truthTable = useMemo(() => {
    if (gate === "NOT") {
      return [
        { a: 0, out: 1 },
        { a: 1, out: 0 },
      ];
    }
    if (gate === "FULL_ADDER") {
      const rows = [];
      for (let a = 0; a <= 1; a++) {
        for (let b = 0; b <= 1; b++) {
          for (let c = 0; c <= 1; c++) {
            rows.push({
              a,
              b,
              cin: c,
              sum: (a ^ b ^ c) as 0 | 1,
              cout: (((a & b) | (c & (a ^ b))) as 0 | 1),
            });
          }
        }
      }
      return rows;
    }
    if (gate === "MUX4") {
      return [
        { sel: "00 (0)", outDesc: "Routes D0" },
        { sel: "01 (1)", outDesc: "Routes D1" },
        { sel: "10 (2)", outDesc: "Routes D2" },
        { sel: "11 (3)", outDesc: "Routes D3" },
      ];
    }
    if (gate === "DEC24") {
      return [0, 1, 2, 3].map((i) => ({
        a: (i >> 1) & 1,
        b: i & 1,
        y: `Y${i}=1`,
      }));
    }
    // 2-input gates
    const rows = [];
    for (let a = 0; a <= 1; a++) {
      for (let b = 0; b <= 1; b++) {
        let res = 0;
        if (gate === "AND") res = a & b;
        else if (gate === "OR") res = a | b;
        else if (gate === "NAND") res = (a & b) === 1 ? 0 : 1;
        else if (gate === "NOR") res = (a | b) === 1 ? 0 : 1;
        else if (gate === "XOR") res = a ^ b;
        else if (gate === "XNOR") res = (a ^ b) === 1 ? 0 : 1;
        rows.push({ a, b, out: res });
      }
    }
    return rows;
  }, [gate]);

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
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Logic Gate & Combinational Simulator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Select building blocks, toggle digital input pins, and observe live circuit propagation
            </p>
          </div>
        </div>

        {/* Gate selection pills */}
        <div className="flex flex-wrap gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {(
            [
              "AND",
              "OR",
              "NAND",
              "NOR",
              "XOR",
              "XNOR",
              "NOT",
              "MUX4",
              "FULL_ADDER",
              "DEC24",
            ] as GateType[]
          ).map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGate(g)}
                className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                  gate === g
                    ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                    : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                }`}
              >
                {g === "MUX4"
                  ? "4:1 Mux"
                  : g === "FULL_ADDER"
                    ? "Full Adder"
                    : g === "DEC24"
                      ? "2:4 Dec"
                      : g}
              </button>
            )
          )}
        </div>
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Input Controls (Left Column) */}
        <div className="md:col-span-4 space-y-4 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)]">
            Interactive Input Pins
          </div>

          {gate !== "MUX4" && gate !== "DEC24" && (
            <div className="space-y-3">
              {/* Input A */}
              <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--ln-border)] bg-[var(--ln-bg-elev)]">
                <span className="text-xs font-bold text-[var(--ln-text)] font-mono">
                  Input A:
                </span>
                <button
                  type="button"
                  onClick={() => setInA(inA === 1 ? 0 : 1)}
                  className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                    inA === 1
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-[0_0_10px_rgba(20,184,166,0.35)]"
                      : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-current" />
                  {inA === 1 ? "HIGH (1)" : "LOW (0)"}
                </button>
              </div>

              {/* Input B (for 2-input gates) */}
              {gate !== "NOT" && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--ln-border)] bg-[var(--ln-bg-elev)]">
                  <span className="text-xs font-bold text-[var(--ln-text)] font-mono">
                    Input B:
                  </span>
                  <button
                    type="button"
                    onClick={() => setInB(inB === 1 ? 0 : 1)}
                    className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                      inB === 1
                        ? "bg-[var(--ln-accent)] text-slate-950 shadow-[0_0_10px_rgba(20,184,166,0.35)]"
                        : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {inB === 1 ? "HIGH (1)" : "LOW (0)"}
                  </button>
                </div>
              )}

              {/* Cin (for Full Adder) */}
              {gate === "FULL_ADDER" && (
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--ln-border)] bg-[var(--ln-bg-elev)]">
                  <span className="text-xs font-bold text-[var(--ln-text)] font-mono">
                    Carry In (Cin):
                  </span>
                  <button
                    type="button"
                    onClick={() => setInCin(inCin === 1 ? 0 : 1)}
                    className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                      inCin === 1
                        ? "bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.35)]"
                        : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    {inCin === 1 ? "HIGH (1)" : "LOW (0)"}
                  </button>
                </div>
              )}
            </div>
          )}

          {gate === "DEC24" && (
            <div className="space-y-3">
              <p className="text-[11px] text-[var(--ln-muted)]">A = MSB, B = LSB of the 2-bit code.</p>
              {(["A (sel[1])", "B (sel[0])"] as const).map((label, i) => {
                const v = i === 0 ? inA : inB;
                const set = i === 0 ? setInA : setInB;
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--ln-border)] bg-[var(--ln-bg-elev)]"
                  >
                    <span className="text-xs font-bold font-mono">{label}</span>
                    <button
                      type="button"
                      onClick={() => set(v === 1 ? 0 : 1)}
                      className={`px-3 py-1 rounded text-xs font-bold font-mono ${
                        v === 1
                          ? "bg-[var(--ln-accent)] text-slate-950"
                          : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
                      }`}
                    >
                      {v}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Mux 4:1 Inputs */}
          {gate === "MUX4" && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-[var(--ln-muted)]">
                Select Line (Sel[1:0]):
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setMuxSel(s as any)}
                    className={`py-1.5 rounded text-xs font-mono font-bold transition-all ${
                      muxSel === s
                        ? "bg-[var(--ln-accent)] text-slate-950"
                        : "bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] text-[var(--ln-muted)]"
                    }`}
                  >
                    {s === 0 ? "00" : s === 1 ? "01" : s === 2 ? "10" : "11"}
                  </button>
                ))}
              </div>

              <div className="text-[11px] font-semibold text-[var(--ln-muted)] mt-2">
                Data Inputs D[3:0]:
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((dIdx) => (
                  <button
                    key={dIdx}
                    type="button"
                    onClick={() => {
                      const next = [...muxD] as [0 | 1, 0 | 1, 0 | 1, 0 | 1];
                      next[dIdx] = next[dIdx] === 1 ? 0 : 1;
                      setMuxD(next);
                    }}
                    className={`p-2 rounded text-xs font-mono font-bold border transition-all ${
                      muxD[dIdx] === 1
                        ? "border-emerald-500 bg-emerald-950/40 text-emerald-300"
                        : "border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                  >
                    D{dIdx}: {muxD[dIdx]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live SVG Schematic & Circuit Visual (Center Column) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden min-h-[220px]">
          {/* Animated background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#14b8a6_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />

          {/* SVG Logic Symbol */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="text-[10px] font-mono tracking-widest text-[var(--ln-accent)] uppercase mb-2">
              {gate === "MUX4"
                ? "4-to-1 Multiplexer"
                : gate === "FULL_ADDER"
                  ? "1-Bit Full Adder"
                  : gate === "DEC24"
                    ? "2-to-4 Decoder"
                    : `${gate} Gate`}
            </div>

            {/* IEEE Logic Gate SVG Symbol */}
            <div className="relative w-44 h-28 flex items-center justify-center">
              <svg viewBox="0 0 160 100" className="w-full h-full">
                {/* Inputs wires */}
                {gate === "NOT" ? (
                  <line
                    x1="10"
                    y1="50"
                    x2="45"
                    y2="50"
                    stroke={inA === 1 ? "#14b8a6" : "#475569"}
                    strokeWidth={inA === 1 ? "2.5" : "1.5"}
                  />
                ) : gate === "FULL_ADDER" ? (
                  <>
                    <line x1="10" y1="30" x2="35" y2="30" stroke={inA === 1 ? "#14b8a6" : "#475569"} strokeWidth={inA === 1 ? "2.5" : "1.5"} />
                    <line x1="10" y1="50" x2="35" y2="50" stroke={inB === 1 ? "#14b8a6" : "#475569"} strokeWidth={inB === 1 ? "2.5" : "1.5"} />
                    <line x1="10" y1="70" x2="35" y2="70" stroke={inCin === 1 ? "#fbbf24" : "#475569"} strokeWidth={inCin === 1 ? "2.5" : "1.5"} />
                  </>
                ) : gate === "MUX4" || gate === "DEC24" ? (
                  <>
                    <line x1="10" y1="25" x2="40" y2="25" stroke={muxD[0] === 1 ? "#14b8a6" : "#475569"} strokeWidth="2" />
                    <line x1="10" y1="40" x2="40" y2="40" stroke={muxD[1] === 1 ? "#14b8a6" : "#475569"} strokeWidth="2" />
                    <line x1="10" y1="55" x2="40" y2="55" stroke={muxD[2] === 1 ? "#14b8a6" : "#475569"} strokeWidth="2" />
                    <line x1="10" y1="70" x2="40" y2="70" stroke={muxD[3] === 1 ? "#14b8a6" : "#475569"} strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <line
                      x1="10"
                      y1="32"
                      x2="45"
                      y2="32"
                      stroke={inA === 1 ? "#14b8a6" : "#475569"}
                      strokeWidth={inA === 1 ? "2.5" : "1.5"}
                    />
                    <line
                      x1="10"
                      y1="68"
                      x2="45"
                      y2="68"
                      stroke={inB === 1 ? "#14b8a6" : "#475569"}
                      strokeWidth={inB === 1 ? "2.5" : "1.5"}
                    />
                  </>
                )}

                {/* Gate Shape */}
                {gate === "AND" && (
                  <path
                    d="M 45 15 L 75 15 A 35 35 0 0 1 75 85 L 45 85 Z"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                )}

                {gate === "NAND" && (
                  <>
                    <path
                      d="M 45 15 L 75 15 A 35 35 0 0 1 75 85 L 45 85 Z"
                      fill="#0f172a"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                    />
                    <circle cx="116" cy="50" r="5" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                  </>
                )}

                {gate === "OR" && (
                  <path
                    d="M 40 15 Q 75 15 110 50 Q 75 85 40 85 Q 55 50 40 15 Z"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                )}

                {gate === "NOR" && (
                  <>
                    <path
                      d="M 40 15 Q 75 15 110 50 Q 75 85 40 85 Q 55 50 40 15 Z"
                      fill="#0f172a"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                    />
                    <circle cx="116" cy="50" r="5" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                  </>
                )}

                {gate === "XOR" && (
                  <>
                    <path d="M 32 15 Q 47 50 32 85" fill="none" stroke="#14b8a6" strokeWidth="2.5" />
                    <path
                      d="M 42 15 Q 75 15 110 50 Q 75 85 42 85 Q 57 50 42 15 Z"
                      fill="#0f172a"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                    />
                  </>
                )}

                {gate === "XNOR" && (
                  <>
                    <path d="M 32 15 Q 47 50 32 85" fill="none" stroke="#14b8a6" strokeWidth="2.5" />
                    <path
                      d="M 42 15 Q 75 15 110 50 Q 75 85 42 85 Q 57 50 42 15 Z"
                      fill="#0f172a"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                    />
                    <circle cx="116" cy="50" r="5" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                  </>
                )}

                {gate === "NOT" && (
                  <>
                    <polygon points="45,20 95,50 45,80" fill="#0f172a" stroke="#14b8a6" strokeWidth="2.5" />
                    <circle cx="102" cy="50" r="5" fill="#0f172a" stroke="#14b8a6" strokeWidth="2" />
                  </>
                )}

                {gate === "MUX4" && (
                  <polygon
                    points="40,10 110,25 110,75 40,90"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                )}

                {gate === "FULL_ADDER" && (
                  <rect
                    x="35"
                    y="15"
                    width="80"
                    height="70"
                    rx="6"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                )}

                {gate === "DEC24" && (
                  <rect
                    x="35"
                    y="15"
                    width="80"
                    height="70"
                    rx="6"
                    fill="#0f172a"
                    stroke="#14b8a6"
                    strokeWidth="2.5"
                  />
                )}

                {/* Center Label inside block if MUX/FA/DEC */}
                {(gate === "MUX4" || gate === "FULL_ADDER" || gate === "DEC24") && (
                  <text
                    x="75"
                    y="55"
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="bold"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {gate === "DEC24" ? "DEC 2:4" : gate === "FULL_ADDER" ? "FA" : "MUX 4:1"}
                  </text>
                )}

                {/* Output wire */}
                {gate === "FULL_ADDER" ? (
                  <>
                    <line x1="115" y1="35" x2="150" y2="35" stroke={(output as any).sum === 1 ? "#14b8a6" : "#475569"} strokeWidth="2.5" />
                    <line x1="115" y1="65" x2="150" y2="65" stroke={(output as any).cout === 1 ? "#fbbf24" : "#475569"} strokeWidth="2.5" />
                  </>
                ) : gate === "NAND" || gate === "NOR" || gate === "XNOR" || gate === "NOT" ? (
                  <line
                    x1="121"
                    y1="50"
                    x2="150"
                    y2="50"
                    stroke={(output as number) === 1 ? "#14b8a6" : "#475569"}
                    strokeWidth={(output as number) === 1 ? "2.5" : "1.5"}
                  />
                ) : (
                  <line
                    x1="110"
                    y1="50"
                    x2="150"
                    y2="50"
                    stroke={(output as number) === 1 ? "#14b8a6" : "#475569"}
                    strokeWidth={(output as number) === 1 ? "2.5" : "1.5"}
                  />
                )}
              </svg>
            </div>

            {/* Live Output Indicators */}
            {gate === "DEC24" ? (
              <div className="flex gap-1.5 mt-3">
                {(output as number[]).map((y, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold border ${
                      y === 1
                        ? "border-emerald-400 text-emerald-300 bg-emerald-950/50"
                        : "border-slate-700 text-slate-500"
                    }`}
                  >
                    Y{i}:{y}
                  </div>
                ))}
              </div>
            ) : gate === "FULL_ADDER" ? (
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono">
                  <span className="text-slate-400">Sum:</span>
                  <span
                    className={`font-bold ${
                      (output as any).sum === 1 ? "text-[var(--ln-accent)] font-black" : "text-slate-500"
                    }`}
                  >
                    {(output as any).sum}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-xs font-mono">
                  <span className="text-slate-400">Cout:</span>
                  <span
                    className={`font-bold ${
                      (output as any).cout === 1 ? "text-amber-400 font-black" : "text-slate-500"
                    }`}
                  >
                    {(output as any).cout}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3 px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono">
                <span className="text-slate-400">Output Q:</span>
                <span
                  className={`text-sm font-black transition-all ${
                    (output as number) === 1
                      ? "text-[var(--ln-accent)] shadow-[0_0_12px_rgba(20,184,166,0.6)]"
                      : "text-slate-500"
                  }`}
                >
                  {(output as number) === 1 ? "1 (HIGH)" : "0 (LOW)"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Live Truth Table (Right Column) */}
        <div className="md:col-span-4 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] overflow-x-auto max-h-56 overflow-y-auto">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)] mb-2">
            Live Truth Table
          </div>
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead className="border-b border-[var(--ln-border)] text-[var(--ln-muted)]">
              {gate === "NOT" ? (
                <tr>
                  <th className="p-1.5">A</th>
                  <th className="p-1.5">Q (Out)</th>
                </tr>
              ) : gate === "FULL_ADDER" ? (
                <tr>
                  <th className="p-1">A</th>
                  <th className="p-1">B</th>
                  <th className="p-1">Cin</th>
                  <th className="p-1">Sum</th>
                  <th className="p-1">Cout</th>
                </tr>
              ) : gate === "DEC24" ? (
                <tr>
                  <th className="p-1">A</th>
                  <th className="p-1">B</th>
                  <th className="p-1">Hot</th>
                </tr>
              ) : gate === "MUX4" ? (
                <tr>
                  <th className="p-1.5">Sel</th>
                  <th className="p-1.5">Output Data</th>
                </tr>
              ) : (
                <tr>
                  <th className="p-1.5">A</th>
                  <th className="p-1.5">B</th>
                  <th className="p-1.5">Q (Out)</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[var(--ln-border)] text-[11px]">
              {gate === "DEC24"
                ? (truthTable as { a: number; b: number; y: string }[]).map((r, i) => {
                    const isActive = inA === r.a && inB === r.b;
                    return (
                      <tr
                        key={i}
                        className={
                          isActive
                            ? "bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] font-bold"
                            : "text-[var(--ln-text)] opacity-70"
                        }
                      >
                        <td className="p-1">{r.a}</td>
                        <td className="p-1">{r.b}</td>
                        <td className="p-1">{r.y}</td>
                      </tr>
                    );
                  })
                : gate === "MUX4"
                ? (truthTable as any[]).map((r, i) => {
                    const isActive = muxSel === i;
                    return (
                      <tr
                        key={i}
                        className={
                          isActive
                            ? "bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] font-bold"
                            : "text-[var(--ln-text)] opacity-70"
                        }
                      >
                        <td className="p-1.5">{r.sel}</td>
                        <td className="p-1.5">{r.outDesc} (Value: {muxD[i]})</td>
                      </tr>
                    );
                  })
                : gate === "FULL_ADDER"
                ? (truthTable as any[]).map((r, i) => {
                    const isActive = inA === r.a && inB === r.b && inCin === r.cin;
                    return (
                      <tr
                        key={i}
                        className={
                          isActive
                            ? "bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] font-bold"
                            : "text-[var(--ln-text)] opacity-70"
                        }
                      >
                        <td className="p-1">{r.a}</td>
                        <td className="p-1">{r.b}</td>
                        <td className="p-1">{r.cin}</td>
                        <td className="p-1">{r.sum}</td>
                        <td className="p-1">{r.cout}</td>
                      </tr>
                    );
                  })
                : (truthTable as any[]).map((r, i) => {
                    const isActive =
                      gate === "NOT" ? inA === r.a : inA === r.a && inB === r.b;
                    return (
                      <tr
                        key={i}
                        className={
                          isActive
                            ? "bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] font-bold"
                            : "text-[var(--ln-text)] opacity-70"
                        }
                      >
                        <td className="p-1.5">{r.a}</td>
                        {gate !== "NOT" && <td className="p-1.5">{r.b}</td>}
                        <td className="p-1.5">{r.out}</td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Zap className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Combinational Logic Guide: Gate Families, Universal Gates &amp; CMOS Inversion
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Universal Gates */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-[var(--ln-accent)] flex items-center gap-1">
              <span>1. Universal Gates (NAND &amp; NOR)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>NAND</strong> and <strong>NOR</strong> are universal logic gates: any Boolean function (multiplexers, adders, decoders) can be realized using NAND or NOR gates alone without requiring any other gate type.
            </p>
          </div>

          {/* Column 2: CMOS Inversion Advantage */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>2. CMOS Inversion Advantage</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              In CMOS silicon, basic logic stages naturally invert (NMOS pulls to GND). An <strong>AND gate</strong> is physically a NAND gate followed by an Inverter! Hence, NAND/NOR gates have lower cell delay and smaller area than AND/OR gates.
            </p>
          </div>

          {/* Column 3: Arithmetic & Routing Blocks */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. Adders, Muxes &amp; Decoders</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Full Adder:</strong> Computes $Sum = A \oplus B \oplus Cin$ and $Cout = AB + Cin(A \oplus B)$.<br />
              <strong>4:1 Mux:</strong> Routes 1 of 4 data inputs ($D_0 \dots D_3$) based on 2 select bits ($Sel$).<br />
              <strong>2:4 Decoder:</strong> Activates exactly one of 4 one-hot outputs ($Y_0 \dots Y_3$).
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
              <strong>Compare AND vs NAND:</strong> Toggle between <em>AND</em> and <em>NAND</em> while setting $A=1, B=1$. Notice the inversion bubble on the right of the IEEE NAND glyph.
            </li>
            <li>
              <strong>Simulate 1-Bit Full Adder:</strong> Select <em>Full Adder</em>, toggle A=1, B=1, Cin=1 to observe Sum=1 and Cout=1 (1 + 1 + 1 = 3 = 2'b11).
            </li>
            <li>
              <strong>Route with 4:1 Multiplexer:</strong> Select <em>4:1 Mux</em>, configure individual $D_0 \dots D_3$ inputs, and change $Sel$ to route the chosen data bit to output $Q$.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
