"use client";

import React, { useState } from "react";
import { GitCommit, Play, RotateCcw, ArrowRight, Activity } from "lucide-react";

type FsmModel = "1011_DETECTOR" | "3_STATE_CONTROLLER";

export function FsmVisualizer() {
  const [model, setModel] = useState<FsmModel>("1011_DETECTOR");
  const [state, setState] = useState<string>("S_IDLE");
  const [inBit, setInBit] = useState<0 | 1>(1);
  const [history, setHistory] = useState<{ state: string; in: number; out: number }[]>([]);

  // 1011 Sequence Detector Logic
  const stepFsm = () => {
    let nextState = state;
    let outVal = 0;

    if (model === "1011_DETECTOR") {
      // States: S_IDLE (seen nothing), S_1 (seen 1), S_10 (seen 10), S_101 (seen 101)
      switch (state) {
        case "S_IDLE":
          nextState = inBit === 1 ? "S_1" : "S_IDLE";
          break;
        case "S_1":
          nextState = inBit === 0 ? "S_10" : "S_1";
          break;
        case "S_10":
          nextState = inBit === 1 ? "S_101" : "S_IDLE";
          break;
        case "S_101":
          if (inBit === 1) {
            nextState = "S_1"; // 1011 detected! (overlapping back to S_1)
            outVal = 1;
          } else {
            nextState = "S_10";
          }
          break;
        default:
          nextState = "S_IDLE";
      }
    } else {
      // 3-State Controller: S_IDLE, S_RUN, S_DONE
      switch (state) {
        case "S_IDLE":
          nextState = inBit === 1 ? "S_RUN" : "S_IDLE";
          break;
        case "S_RUN":
          nextState = inBit === 1 ? "S_DONE" : "S_RUN";
          break;
        case "S_DONE":
          outVal = 1;
          nextState = "S_IDLE";
          break;
        default:
          nextState = "S_IDLE";
      }
    }

    setHistory((prev) => [...prev.slice(-9), { state, in: inBit, out: outVal }]);
    setState(nextState);
  };

  const resetFsm = () => {
    setState("S_IDLE");
    setHistory([]);
  };

  const detectorStates =
    model === "1011_DETECTOR"
      ? [
          { id: "S_IDLE", label: "S0: IDLE", pattern: "Start" },
          { id: "S_1", label: "S1: '1'", pattern: "Matched '1'" },
          { id: "S_10", label: "S2: '10'", pattern: "Matched '10'" },
          { id: "S_101", label: "S3: '101'", pattern: "Matched '101' (next 1 → DETECT)" },
        ]
      : [
          { id: "S_IDLE", label: "IDLE", pattern: "Wait for go (in=1)" },
          { id: "S_RUN", label: "RUN", pattern: "Work until in=1" },
          { id: "S_DONE", label: "DONE", pattern: "Moore out=1, then IDLE" },
        ];

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
            <GitCommit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Finite State Machine (FSM) Graph Animator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Step through overlapping sequence recognition and watch active state nodes illuminate
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg border border-[var(--ln-border)] bg-[var(--ln-bg)]">
            <button
              type="button"
              onClick={() => {
                setModel("1011_DETECTOR");
                resetFsm();
              }}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                model === "1011_DETECTOR"
                  ? "bg-[var(--ln-accent)] text-slate-950"
                  : "text-[var(--ln-muted)]"
              }`}
            >
              1011 detector (Mealy-ish)
            </button>
            <button
              type="button"
              onClick={() => {
                setModel("3_STATE_CONTROLLER");
                resetFsm();
              }}
              className={`px-2 py-1 rounded text-xs font-semibold ${
                model === "3_STATE_CONTROLLER"
                  ? "bg-[var(--ln-accent)] text-slate-950"
                  : "text-[var(--ln-muted)]"
              }`}
            >
              IDLE/RUN/DONE (Moore)
            </button>
          </div>
          <button
            type="button"
            onClick={resetFsm}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Reset FSM
          </button>
        </div>
      </div>

      {/* Main Interactive Controls & State Nodes */}
      <div className="space-y-6">
        {/* Interactive Step Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--ln-muted)]">
              Next Input Stream Bit (in_bit):
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setInBit(0)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  inBit === 0
                    ? "bg-slate-700 text-white border border-slate-500"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                Bit 0
              </button>
              <button
                type="button"
                onClick={() => setInBit(1)}
                className={`px-3 py-1 rounded text-xs font-mono font-bold transition-all ${
                  inBit === 1
                    ? "bg-[var(--ln-accent)] text-slate-950 font-black shadow-sm"
                    : "bg-slate-900 text-slate-400 border border-slate-800"
                }`}
              >
                Bit 1
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={stepFsm}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[var(--ln-accent)] text-slate-950 hover:brightness-110 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Play className="w-3.5 h-3.5" />
            Clock Step Edge (Trigger posedge clk)
          </button>
        </div>

        {/* Interactive SVG Bubble Diagram with Directed Transition Arrows */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>STATE TRANSITION BUBBLE DIAGRAM</span>
            <span className="text-[10px] text-cyan-400 font-bold">Active: {state}</span>
          </div>

          <div className="w-full max-w-lg h-36 relative flex items-center justify-center">
            <svg viewBox="0 0 480 120" className="w-full h-full">
              <defs>
                <marker
                  id="arrow-cyan"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#14b8a6" />
                </marker>
                <marker
                  id="arrow-slate"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
                </marker>
                <marker
                  id="arrow-emerald"
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#34d399" />
                </marker>
              </defs>

              {/* Transition Arcs */}
              {/* S0 -> S1 (in=1) */}
              <path
                d="M 85 60 Q 140 30 175 60"
                fill="none"
                stroke={state === "S_IDLE" && inBit === 1 ? "#14b8a6" : "#475569"}
                strokeWidth={state === "S_IDLE" && inBit === 1 ? "2.5" : "1.5"}
                markerEnd={state === "S_IDLE" && inBit === 1 ? "url(#arrow-cyan)" : "url(#arrow-slate)"}
              />
              <text x="135" y="38" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">in=1</text>

              {/* S1 -> S2 (in=0) */}
              <path
                d="M 205 60 Q 260 30 295 60"
                fill="none"
                stroke={state === "S_1" && inBit === 0 ? "#14b8a6" : "#475569"}
                strokeWidth={state === "S_1" && inBit === 0 ? "2.5" : "1.5"}
                markerEnd={state === "S_1" && inBit === 0 ? "url(#arrow-cyan)" : "url(#arrow-slate)"}
              />
              <text x="255" y="38" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">in=0</text>

              {/* S2 -> S3 (in=1) */}
              <path
                d="M 325 60 Q 380 30 415 60"
                fill="none"
                stroke={state === "S_10" && inBit === 1 ? "#14b8a6" : "#475569"}
                strokeWidth={state === "S_10" && inBit === 1 ? "2.5" : "1.5"}
                markerEnd={state === "S_10" && inBit === 1 ? "url(#arrow-cyan)" : "url(#arrow-slate)"}
              />
              <text x="375" y="38" fill="#94a3b8" fontSize="10" fontFamily="monospace" textAnchor="middle">in=1</text>

              {/* S3 -> S1 (in=1 MATCH LOOP) */}
              <path
                d="M 425 75 Q 310 120 195 75"
                fill="none"
                stroke={state === "S_101" && inBit === 1 ? "#34d399" : "#475569"}
                strokeWidth={state === "S_101" && inBit === 1 ? "3" : "1.5"}
                markerEnd={state === "S_101" && inBit === 1 ? "url(#arrow-emerald)" : "url(#arrow-slate)"}
              />
              <text x="310" y="112" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">in=1 (1011 MATCH!)</text>

              {/* Circular State Nodes */}
              {/* S0 (IDLE) */}
              <circle
                cx="65"
                cy="60"
                r="22"
                fill="#0f172a"
                stroke={state === "S_IDLE" ? "#14b8a6" : "#334155"}
                strokeWidth={state === "S_IDLE" ? "3" : "2"}
              />
              <text x="65" y="64" fill={state === "S_IDLE" ? "#14b8a6" : "#e2e8f0"} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">S0</text>

              {/* S1 */}
              <circle
                cx="190"
                cy="60"
                r="22"
                fill="#0f172a"
                stroke={state === "S_1" ? "#14b8a6" : "#334155"}
                strokeWidth={state === "S_1" ? "3" : "2"}
              />
              <text x="190" y="64" fill={state === "S_1" ? "#14b8a6" : "#e2e8f0"} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">S1</text>

              {/* S2 */}
              <circle
                cx="310"
                cy="60"
                r="22"
                fill="#0f172a"
                stroke={state === "S_10" ? "#14b8a6" : "#334155"}
                strokeWidth={state === "S_10" ? "3" : "2"}
              />
              <text x="310" y="64" fill={state === "S_10" ? "#14b8a6" : "#e2e8f0"} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">S2</text>

              {/* S3 */}
              <circle
                cx="430"
                cy="60"
                r="22"
                fill="#0f172a"
                stroke={state === "S_101" ? "#14b8a6" : "#334155"}
                strokeWidth={state === "S_101" ? "3" : "2"}
              />
              <text x="430" y="64" fill={state === "S_101" ? "#14b8a6" : "#e2e8f0"} fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">S3</text>
            </svg>
          </div>
        </div>

        {/* Visual State Graph (4 Nodes Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {detectorStates.map((st, i) => {
            const isActive = state === st.id;
            return (
              <div
                key={st.id}
                className={`p-4 rounded-xl border transition-all duration-300 relative flex flex-col justify-between ${
                  isActive
                    ? "border-[var(--ln-accent)] bg-[var(--ln-accent-soft)] shadow-[0_0_20px_rgba(20,184,166,0.3)] scale-[1.03]"
                    : "border-[var(--ln-border)] bg-[var(--ln-bg)] opacity-60"
                }`}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 text-[10px] font-bold text-[var(--ln-accent)] uppercase">
                    <span className="w-2 h-2 rounded-full bg-[var(--ln-accent)] animate-ping" />
                    ACTIVE
                  </div>
                )}
                <div>
                  <div className="text-[10px] font-mono text-[var(--ln-muted)]">State #{i}</div>
                  <div
                    className={`text-sm font-black font-mono mt-0.5 ${
                      isActive ? "text-[var(--ln-accent)]" : "text-[var(--ln-text)]"
                    }`}
                  >
                    {st.label}
                  </div>
                  <div className="text-[11px] text-[var(--ln-muted)] mt-1">{st.pattern}</div>
                </div>

                {st.id === "S_101" && (
                  <div className="mt-3 pt-2 border-t border-[var(--ln-border)] text-[10px] font-mono text-emerald-400 font-semibold">
                    If next in_bit=1 ➔ DETECTED=1
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Transition Sequence Trace Table */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>FSM TRANSITION HISTORY BUFFER</span>
            <span className="text-[10px] text-cyan-400">
              {model === "1011_DETECTOR" ? "Target: 1011 (overlap)" : "Moore: output only in DONE"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex items-center gap-2 min-w-[320px] font-mono text-xs py-1">
              {history.length === 0 && (
                <span className="text-slate-600 text-xs italic">
                  Press 'Clock Step Edge' above to feed bits into the FSM...
                </span>
              )}
              {history.map((h, idx) => (
                <div
                  key={idx}
                  className={`px-2.5 py-1.5 rounded border text-center text-[11px] flex flex-col items-center ${
                    h.out === 1
                      ? "border-emerald-500 bg-emerald-950/80 text-emerald-300 font-black shadow-[0_0_12px_rgba(52,211,153,0.4)]"
                      : "border-slate-800 bg-slate-900/60 text-slate-400"
                  }`}
                >
                  <span className="text-[9px] opacity-70">{h.state.replace("S_", "")}</span>
                  <span className="font-bold my-0.5 text-white">In:{h.in}</span>
                  <span className={h.out === 1 ? "text-emerald-300 font-bold" : "text-slate-600"}>
                    {h.out === 1 ? "MATCH!" : "Q:0"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <GitCommit className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 FSM Architecture Guide: Moore vs. Mealy &amp; State Encoding
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Moore vs Mealy */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-[var(--ln-accent)] flex items-center gap-1">
              <span>1. Moore vs. Mealy Outputs</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Moore:</strong> Output depends <em>strictly on state registers</em> ($Output = f(State)$). Glitch-free and safe.<br />
              <strong>Mealy:</strong> Output depends on <em>state AND present inputs</em> ($Output = f(State, In)$). Responds in the same cycle, but input glitches can propagate directly to outputs.
            </p>
          </div>

          {/* Column 2: Overlapping Pattern Matching */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Overlapping Sequence Detection</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              For sequence <code>1011</code>: When reaching $S_3$ (seen <code>101</code>) and receiving <code>in=1</code>, the pattern is recognized! The trailing <code>1</code> becomes the start of the next candidate sequence, looping back to $S_1$ rather than wasting cycles resetting to $S_0$.
            </p>
          </div>

          {/* Column 3: State Encoding Tradeoffs */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. State Encoding Tradeoffs</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Binary:</strong> Minimal flop count ($\lceil\log_2 N\rceil$), larger combinational next-state muxes.<br />
              <strong>One-Hot:</strong> 1 flop per state ($N$ flops). Next-state logic simplifies to fast single OR gates—ideal for high-speed FPGAs &amp; ASICs.
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
              <strong>Feed '1011' Sequence:</strong> Step bits <code>1 ➔ 0 ➔ 1 ➔ 1</code> cycle-by-cycle and watch the active neon bubble trace across the directed graph until it flashes <strong>1011 MATCH!</strong>
            </li>
            <li>
              <strong>Test Overlap:</strong> After a match, immediately feed <code>0 ➔ 1 ➔ 1</code>. Notice it triggers another match in only 3 cycles because the prefix was preserved.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
