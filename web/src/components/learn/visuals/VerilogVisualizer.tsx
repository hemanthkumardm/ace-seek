"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Play,
  RotateCcw,
  AlertTriangle,
  Layers,
  Activity,
  FastForward,
  CheckCircle2,
  AlertCircle,
  Binary,
  Code2,
  ShieldAlert,
} from "lucide-react";

type VerilogTab = "module_syntax" | "signed_arith" | "event_queue" | "lint_diagnostics";

export function VerilogVisualizer({ initialTab = "module_syntax" }: { initialTab?: VerilogTab }) {
  const [tab, setTab] = useState<VerilogTab>(initialTab);
  useEffect(() => setTab(initialTab), [initialTab]);

  // --- TAB 1: Module Syntax & 4-State Logic ---
  const [logicVal, setLogicVal] = useState<"0" | "1" | "X" | "Z">("1");
  const [busData, setBusData] = useState<number>(0b10110001); // 8-bit bus = 0xB1
  const [sliceOffset, setSliceOffset] = useState<number>(0);

  // --- TAB 2: Signed Arithmetic & Sign Extension ---
  const [valA, setValA] = useState<number>(-5); // 8-bit signed: -5 (11111011 = 0xFB)
  const [valB, setValB] = useState<number>(3); // 8-bit signed: +3 (00000011 = 0x03)
  const [isSignedOp, setIsSignedOp] = useState<boolean>(true);
  const [shiftAmount, setShiftAmount] = useState<number>(2);

  // --- TAB 3: Event Queue Simulator ---
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [assignMode, setAssignMode] = useState<"nba" | "blocking">("nba");

  const queueSteps = [
    {
      region: "ACTIVE REGION (Step 1)",
      desc: "Evaluate right-hand sides (RHS) of all statements. Continuous assigns (assign net = ...) and blocking (=) assignments execute immediately.",
      stateFlop1: "RHS computed: d_in (1)",
      stateFlop2: assignMode === "nba" ? "RHS computed: q1_old (0)" : "q1 updated immediately to 1! ⚠️ RACE!",
      isWarning: assignMode === "blocking",
    },
    {
      region: "INACTIVE REGION (Step 2)",
      desc: "Process statements with #0 delays (Anti-pattern in RTL, evaluated after active events).",
      stateFlop1: "Waiting for NBA update...",
      stateFlop2: "Waiting for NBA update...",
      isWarning: false,
    },
    {
      region: "NON-BLOCKING (NBA) REGION (Step 3)",
      desc: "Update left-hand sides (LHS) of all non-blocking (<=) assignments in parallel. All flops capture their old clock-edge values without race!",
      stateFlop1: "q1 <= 1 (Updated)",
      stateFlop2: assignMode === "nba" ? "q2 <= 0 (Shifted old q1 safely ✓)" : "q2 <= 1 (CORRUPTED! Double shift in 1 cycle ❌)",
      isWarning: assignMode === "blocking",
    },
    {
      region: "POSTPONED REGION (Step 4)",
      desc: "Read-only monitoring events: $strobe, $monitor, and VCD/FSDB waveform dumping.",
      stateFlop1: "Final Cycle State: q1 = 1",
      stateFlop2: assignMode === "nba" ? "Final Cycle State: q2 = 0 ✓" : "Final Cycle State: q2 = 1 ❌",
      isWarning: assignMode === "blocking",
    },
  ];

  // --- TAB 4: Lint Diagnostics Simulator ---
  const [hasDefaultBranch, setHasDefaultBranch] = useState<boolean>(false);
  const [caseSel, setCaseSel] = useState<number>(3); // 2'b11 is unhandled if default is off

  // Helper formatting routines
  const bin8 = (n: number) => ((n & 0xff) >>> 0).toString(2).padStart(8, "0");
  const bin16 = (n: number) => ((n & 0xffff) >>> 0).toString(2).padStart(16, "0");

  const sumSigned = valA + valB;
  const sumUnsigned = ((valA & 0xff) + (valB & 0xff)) & 0x1ff;

  // Sign extension: signed 8-bit to 16-bit
  const extSigned = valA < 0 ? (0xffff00 | (valA & 0xff)) & 0xffff : valA & 0xff;
  const extZero = valA & 0xff;

  // Arithmetic shift (>>>) vs Logical shift (>>)
  const sraVal = (valA >> shiftAmount) & 0xff;
  const srlVal = ((valA & 0xff) >>> shiftAmount) & 0xff;

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
              Verilog Hardware Modeling &amp; RTL Engine Explorer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive exploration of 4-state logic, signed arithmetic, event scheduling, and synthesis linting
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          <button
            type="button"
            onClick={() => setTab("module_syntax")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              tab === "module_syntax"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            4-State &amp; Vectors
          </button>
          <button
            type="button"
            onClick={() => setTab("signed_arith")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              tab === "signed_arith"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Signed Math &amp; $signed
          </button>
          <button
            type="button"
            onClick={() => setTab("event_queue")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              tab === "event_queue"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Event Queue (NBA vs =)
          </button>
          <button
            type="button"
            onClick={() => setTab("lint_diagnostics")}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              tab === "lint_diagnostics"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            RTL Lint &amp; Latch Check
          </button>
        </div>
      </div>

      {/* --- TAB 1: 4-State Logic & Bit Slicing --- */}
      {tab === "module_syntax" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 4-State Logic Values */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Verilog 4-State Physical Logic</span>
                <span className="text-cyan-400">Current: {logicVal}</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(["0", "1", "X", "Z"] as const).map((lv) => (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLogicVal(lv)}
                    className={`py-2 rounded-lg font-mono font-bold text-center border transition-all ${
                      logicVal === lv
                        ? lv === "0"
                          ? "bg-slate-700 text-white border-slate-500 shadow-sm"
                          : lv === "1"
                          ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm font-black"
                          : lv === "X"
                          ? "bg-rose-500 text-slate-950 border-rose-400 shadow-sm font-black"
                          : "bg-amber-400 text-slate-950 border-amber-300 shadow-sm font-black"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {lv}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {logicVal === "0" && "0: Logic Low (GND - 0.0V). Driven cleanly by pulldown network."}
                {logicVal === "1" && "1: Logic High (VDD - Power rail). Driven cleanly by pullup PMOS."}
                {logicVal === "X" && "X: Unknown / Bus Contention. Occurs when uninitialized or two drivers conflict."}
                {logicVal === "Z" && "Z: High-Impedance / Tri-State Floating. Output disabled (`bufif1`)."}
              </p>
            </div>

            {/* Indexed Part-Selects & Concatenation */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Vector Slicing: bus[7:0] = 8'h{busData.toString(16).toUpperCase()}</span>
                <span className="text-emerald-400">Bin: {bin8(busData)}</span>
              </div>
              <div className="flex gap-1 justify-between">
                {bin8(busData).split("").map((b, i) => {
                  const bitIdx = 7 - i;
                  const isSelected = bitIdx >= sliceOffset && bitIdx <= sliceOffset + 3;
                  return (
                    <div
                      key={i}
                      className={`flex-1 py-1.5 rounded text-center border font-bold ${
                        isSelected
                          ? "bg-cyan-950 border-cyan-400 text-cyan-300"
                          : "bg-slate-900 border-slate-800 text-slate-500"
                      }`}
                    >
                      <div className="text-[9px] text-slate-400">b{bitIdx}</div>
                      <div className="text-sm font-black">{b}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-300">
                <span>Indexed Select `bus[{sliceOffset} +: 4]`:</span>
                <span className="font-bold text-cyan-400">
                  4'b{((busData >> sliceOffset) & 0xf).toString(2).padStart(4, "0")}
                </span>
                <button
                  type="button"
                  onClick={() => setSliceOffset((o) => (o + 1) % 5)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                >
                  Shift Window (+: 4)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: Signed Arithmetic & $signed() --- */}
      {tab === "signed_arith" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Input Controls */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>8-Bit Operands</span>
                <span className="text-cyan-400">Two's Complement</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Operand A (Signed): <strong className="text-cyan-300">{valA}</strong></span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setValA((v) => Math.max(-128, v - 5))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      -5
                    </button>
                    <button
                      type="button"
                      onClick={() => setValA((v) => Math.min(127, v + 5))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      +5
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">Binary 8-Bit: {bin8(valA)} (0x{((valA & 0xff) >>> 0).toString(16).toUpperCase().padStart(2, "0")})</div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span>Operand B (Signed): <strong className="text-emerald-300">{valB}</strong></span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setValB((v) => Math.max(-128, v - 1))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      -1
                    </button>
                    <button
                      type="button"
                      onClick={() => setValB((v) => Math.min(127, v + 1))}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">Binary 8-Bit: {bin8(valB)}</div>
              </div>
            </div>

            {/* Sign Extension & Signed Addition Comparison */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Sign Extension (8-bit ➔ 16-bit)</span>
                <span className="text-amber-400">{valA < 0 ? "Negative (MSB=1)" : "Positive"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Proper $signed(a):</span>
                  <span className="text-emerald-400 font-bold">{valA} (0x{extSigned.toString(16).toUpperCase().padStart(4, "0")})</span>
                </div>
                <div className="text-[10px] text-emerald-300/80">Bin: {bin16(extSigned)} (MSB sign replicated)</div>

                <div className="flex justify-between pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Unsigned Zero-Ext (Trap):</span>
                  <span className="text-rose-400 font-bold">{extZero} (0x{extZero.toString(16).toUpperCase().padStart(4, "0")})</span>
                </div>
                <div className="text-[10px] text-rose-300/80">Bin: {bin16(extZero)} (Corrupted positive value!)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: Event Queue Simulator --- */}
      {tab === "event_queue" && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--ln-muted)]">Assignment Style:</span>
              <button
                type="button"
                onClick={() => {
                  setAssignMode("nba");
                  setStepIndex(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  assignMode === "nba"
                    ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                Non-Blocking (&lt;=) [Golden Rule]
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignMode("blocking");
                  setStepIndex(0);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                  assignMode === "blocking"
                    ? "bg-rose-500 text-slate-950 font-black shadow-sm"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                Blocking (=) [Race Condition Trap]
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStepIndex(0)}
                className="px-2.5 py-1 rounded border border-[var(--ln-border)] text-xs flex items-center gap-1 hover:bg-[var(--ln-hover)]"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
              <button
                type="button"
                onClick={() => setStepIndex((s) => (s + 1) % queueSteps.length)}
                className="px-3 py-1 rounded bg-[var(--ln-accent)] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110"
              >
                <FastForward className="w-3.5 h-3.5" /> Next Event Region ({stepIndex + 1}/4)
              </button>
            </div>
          </div>

          {/* 4-Stage Queue Step Rail */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 font-mono text-xs">
            {queueSteps.map((q, idx) => {
              const isCurrent = stepIndex === idx;
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? q.isWarning
                        ? "bg-rose-950 border-rose-500 text-rose-200 shadow-md ring-1 ring-rose-400"
                        : "bg-cyan-950 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-400"
                      : "bg-slate-950 border-slate-800 text-slate-400 opacity-60"
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase mb-1">{q.region}</div>
                  <div className="text-[11px] leading-tight font-sans">{q.desc}</div>
                </div>
              );
            })}
          </div>

          {/* 2-Stage Shift Register Hardware Outcome */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400 text-[10px] uppercase font-bold">
              <span>2-Stage Pipeline State (d_in=1, q1_init=0, q2_init=0)</span>
              <span className={assignMode === "nba" ? "text-emerald-400" : "text-rose-400"}>
                {assignMode === "nba" ? "✓ Correct Shift Operation" : "❌ Race Condition Active!"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-cyan-400 block font-bold">Stage 1 Flop (q1):</span>
                <span className="text-sm font-bold text-slate-200">{queueSteps[stepIndex].stateFlop1}</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-cyan-400 block font-bold">Stage 2 Flop (q2):</span>
                <span className="text-sm font-bold text-slate-200">{queueSteps[stepIndex].stateFlop2}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: RTL Lint & Latch Diagnostics --- */}
      {tab === "lint_diagnostics" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Case Statement Configuration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Combinational Case Decoder</span>
                <span className={hasDefaultBranch ? "text-emerald-400" : "text-rose-400"}>
                  {hasDefaultBranch ? "Clean (No Latch)" : "⚠️ Inferred Latch Risk"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setHasDefaultBranch((v) => !v)}
                className={`w-full py-2 rounded-lg font-bold transition-all ${
                  hasDefaultBranch
                    ? "bg-emerald-500 text-slate-950 shadow-sm"
                    : "bg-rose-500 text-slate-950 shadow-sm"
                }`}
              >
                Default Branch: {hasDefaultBranch ? "INCLUDED (`default: y=0`)" : "MISSING (Latch Infer!)"}
              </button>
              <div className="flex justify-between items-center text-[11px] text-slate-300">
                <span>Test Selector Input `sel[1:0]`:</span>
                <div className="flex gap-1">
                  {[0, 1, 2, 3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCaseSel(s)}
                      className={`px-2 py-0.5 rounded font-bold ${
                        caseSel === s ? "bg-cyan-400 text-slate-950" : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      2'b{s.toString(2).padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Synthesis Tool Warning Log */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 uppercase font-bold">
                EDA Synthesis Lint Diagnostics Log:
              </div>
              <div
                className={`p-3 rounded-lg border text-[11px] leading-relaxed ${
                  !hasDefaultBranch && caseSel === 3
                    ? "bg-rose-950/70 border-rose-500 text-rose-200"
                    : "bg-emerald-950/40 border-emerald-500/80 text-emerald-200"
                }`}
              >
                {!hasDefaultBranch && caseSel === 3 ? (
                  <div>
                    <strong>[SYN-LATCH-01] WARNING:</strong> Inferred transparent latch for signal <code>y</code> in module <code>decoder</code>. Signal is not assigned on input condition <code>sel=2'b11</code>. Latch introduces timing loops and increases static leakage!
                  </div>
                ) : (
                  <div>
                    <strong>[SYN-CLEAN] PASSED:</strong> Complete case coverage confirmed. Pure combinational standard cell multiplexer inferred with zero latches.
                  </div>
                )}
              </div>
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
            📖 Verilog Hardware Modeling Guide: Data Types, Arithmetic &amp; Event Queues
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: 4-State & Data Types */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>1. 4-State Hardware Types</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Verilog models real wires with 4 states: <code>0</code>, <code>1</code>, <code>X</code> (contention/uninitialized), and <code>Z</code> (tri-state floating). Indexed part-selects (<code>bus[idx +: 4]</code>) allow dynamic window extraction without complex shifting.
            </p>
          </div>

          {/* Column 2: Two's Complement Signedness */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Expression Signedness</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              According to IEEE 1364, if any operand in an expression is unsigned, the <em>entire</em> calculation is evaluated as unsigned! Always use <code>$signed()</code> when comparing or performing arithmetic on mixed-type signals.
            </p>
          </div>

          {/* Column 3: The Golden RTL Assignment Rule */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>3. NBA (&lt;=) vs Blocking (=)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Use Non-Blocking (<code>&lt;=</code>) exclusively for sequential clocked flip-flops (updates in the NBA region) and Blocking (<code>=</code>) for combinational <code>always @*</code> logic. This completely eliminates simulator race conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
