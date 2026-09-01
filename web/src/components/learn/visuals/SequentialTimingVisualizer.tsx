"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, Activity, Clock } from "lucide-react";

export function SequentialTimingVisualizer() {
  const [running, setRunning] = useState(false);
  const [dInput, setDInput] = useState<0 | 1>(1);
  const [rstN, setRstN] = useState<0 | 1>(1);
  const [clk, setClk] = useState<0 | 1>(0);

  // States
  const [flopQ, setFlopQ] = useState<0 | 1>(0);
  const [latchQ, setLatchQ] = useState<0 | 1>(0);
  const [metastableAlert, setMetastableAlert] = useState(false);

  // History buffer for waveform drawing (30 samples)
  const [history, setHistory] = useState<{ clk: number; d: number; qFlop: number; qLatch: number }[]>(
    () => Array(30).fill({ clk: 0, d: 1, qFlop: 0, qLatch: 0 })
  );

  // Clock runner
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setClk((prevClk) => {
        const nextClk = prevClk === 0 ? 1 : 0;
        // On rising edge of clk:
        if (prevClk === 0 && nextClk === 1) {
          if (rstN === 0) {
            setFlopQ(0);
          } else {
            setFlopQ(dInput);
          }
        }
        return nextClk;
      });
    }, 600);

    return () => clearInterval(interval);
  }, [running, dInput, rstN]);

  // Async reset is independent of the clock
  useEffect(() => {
    if (rstN === 0) {
      setFlopQ(0);
      setLatchQ(0);
    } else if (clk === 1) {
      setLatchQ(dInput);
    }
  }, [clk, dInput, rstN]);

  // Append to waveform history
  useEffect(() => {
    setHistory((prev) => {
      const next = [...prev.slice(1), { clk, d: dInput, qFlop: flopQ, qLatch: latchQ }];
      return next;
    });
  }, [clk, dInput, flopQ, latchQ]);

  // Manual single-step clock edge
  const stepClockEdge = () => {
    const nextClk = clk === 0 ? 1 : 0;
    setClk(nextClk);
    if (nextClk === 1) {
      if (rstN === 0) setFlopQ(0);
      else setFlopQ(dInput);
    }
  };

  // Trigger setup/hold violation test
  const triggerViolationTest = () => {
    setMetastableAlert(true);
    // Simulate illegal transition right on the edge
    setClk(1);
    setDInput(dInput === 1 ? 0 : 1);
    setTimeout(() => setMetastableAlert(false), 3000);
  };

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
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Sequential Timing & Waveform Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Edge-Triggered Flip-Flop vs. Level-Sensitive Latch with live Setup/Hold aperture
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRunning(!running)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              running
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
            }`}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Pause Clock" : "Run Auto Clock"}
          </button>

          <button
            type="button"
            onClick={stepClockEdge}
            disabled={running}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-[var(--ln-border)] hover:bg-[var(--ln-hover)] disabled:opacity-40"
            title="Toggle clock edge manually"
          >
            Step Edge
          </button>

          <button
            type="button"
            onClick={triggerViolationTest}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-rose-500/50 bg-rose-950/30 text-rose-300 hover:bg-rose-900/50 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            Inject Violation
          </button>
        </div>
      </div>

      {metastableAlert && (
        <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-500/80 text-rose-200 text-xs flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>WARNING: SETUP/HOLD APERTURE VIOLATION DETECTED!</strong> Data input D changed
            concurrently with the active rising clock edge. Flop internal state enters metastable
            oscillation.
          </span>
        </div>
      )}

      {/* Control Switches & State Readout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5">
        {/* Clock State */}
        <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--ln-muted)] uppercase">CLK Signal</span>
            <div className="text-base font-black font-mono mt-0.5 text-cyan-400">
              {clk === 1 ? "1 (HIGH)" : "0 (LOW)"}
            </div>
          </div>
          <div
            className={`w-3 h-3 rounded-full transition-all ${
              clk === 1
                ? "bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
                : "bg-slate-700"
            }`}
          />
        </div>

        {/* Data Input Switch */}
        <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--ln-muted)] uppercase">Input D</span>
            <div className="text-base font-black font-mono mt-0.5 text-[var(--ln-text)]">
              {dInput}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDInput(dInput === 1 ? 0 : 1)}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
              dInput === 1
                ? "bg-[var(--ln-accent)] text-slate-950"
                : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
            }`}
          >
            Toggle D
          </button>
        </div>

        <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-[var(--ln-muted)] uppercase">rst_n (async)</span>
            <div className="text-base font-black font-mono mt-0.5 text-[var(--ln-text)]">
              {rstN === 1 ? "deasserted" : "ASSERT"}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setRstN(rstN === 1 ? 0 : 1)}
            className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${
              rstN === 0
                ? "bg-rose-500 text-white"
                : "bg-[var(--ln-hover)] text-[var(--ln-muted)]"
            }`}
          >
            {rstN === 1 ? "Pulse reset" : "Release"}
          </button>
        </div>

        {/* Flop Output Q */}
        <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
          <span className="text-[10px] font-bold text-[var(--ln-muted)] uppercase">
            D Flip-Flop Q (Edge)
          </span>
          <div className="text-base font-black font-mono mt-0.5 text-emerald-400 flex items-center justify-between">
            <span>{flopQ}</span>
            <span className="text-[10px] font-normal text-slate-400">Samples at ↑ edge only</span>
          </div>
        </div>

        {/* Latch Output Q */}
        <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)]">
          <span className="text-[10px] font-bold text-[var(--ln-muted)] uppercase">
            D Latch Q (Level)
          </span>
          <div className="text-base font-black font-mono mt-0.5 text-amber-400 flex items-center justify-between">
            <span>{latchQ}</span>
            <span className="text-[10px] font-normal text-slate-400">
              {clk === 1 ? "Transparent" : "Opaque"}
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Multi-Trace Digital Waveform Scope */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center gap-1.5 font-bold text-slate-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            DIGITAL TIMING DIAGRAM (Square Wave Transitions)
          </span>
          <span className="text-[10px] text-cyan-400">30 Time Samples · Grid: 1 Cycle</span>
        </div>

        {/* SVG Oscilloscope Display */}
        <div className="relative w-full h-48 bg-slate-900/90 rounded-lg border border-slate-800 p-2 overflow-hidden">
          <svg viewBox="0 0 600 160" preserveAspectRatio="none" className="w-full h-full">
            {/* Background Grid Lines */}
            {Array.from({ length: 15 }).map((_, i) => (
              <line
                key={i}
                x1={i * 40}
                y1="0"
                x2={i * 40}
                y2="160"
                stroke="#1e293b"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}

            {/* CLK Waveform (Row 0: y=0 to 36) */}
            <path
              d={(() => {
                const vals = history.map((h) => h.clk);
                const step = 600 / (vals.length - 1);
                let p = `M 0 ${vals[0] === 1 ? 6 : 28}`;
                for (let i = 1; i < vals.length; i++) {
                  const prevY = vals[i - 1] === 1 ? 6 : 28;
                  const currY = vals[i] === 1 ? 6 : 28;
                  const x = i * step;
                  if (currY !== prevY) p += ` L ${x} ${prevY} V ${currY}`;
                  else p += ` L ${x} ${currY}`;
                }
                return p;
              })()}
              fill="none"
              stroke="#22d3ee"
              strokeWidth="2"
            />

            {/* D Waveform (Row 1: y=40 to 76) */}
            <path
              d={(() => {
                const vals = history.map((h) => h.d);
                const step = 600 / (vals.length - 1);
                let p = `M 0 ${vals[0] === 1 ? 46 : 68}`;
                for (let i = 1; i < vals.length; i++) {
                  const prevY = vals[i - 1] === 1 ? 46 : 68;
                  const currY = vals[i] === 1 ? 46 : 68;
                  const x = i * step;
                  if (currY !== prevY) p += ` L ${x} ${prevY} V ${currY}`;
                  else p += ` L ${x} ${currY}`;
                }
                return p;
              })()}
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            {/* Flop Q Waveform (Row 2: y=80 to 116) */}
            <path
              d={(() => {
                const vals = history.map((h) => h.qFlop);
                const step = 600 / (vals.length - 1);
                let p = `M 0 ${vals[0] === 1 ? 86 : 108}`;
                for (let i = 1; i < vals.length; i++) {
                  const prevY = vals[i - 1] === 1 ? 86 : 108;
                  const currY = vals[i] === 1 ? 86 : 108;
                  const x = i * step;
                  if (currY !== prevY) p += ` L ${x} ${prevY} V ${currY}`;
                  else p += ` L ${x} ${currY}`;
                }
                return p;
              })()}
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
            />

            {/* Latch Q Waveform (Row 3: y=120 to 156) */}
            <path
              d={(() => {
                const vals = history.map((h) => h.qLatch);
                const step = 600 / (vals.length - 1);
                let p = `M 0 ${vals[0] === 1 ? 126 : 148}`;
                for (let i = 1; i < vals.length; i++) {
                  const prevY = vals[i - 1] === 1 ? 126 : 148;
                  const currY = vals[i] === 1 ? 126 : 148;
                  const x = i * step;
                  if (currY !== prevY) p += ` L ${x} ${prevY} V ${currY}`;
                  else p += ` L ${x} ${currY}`;
                }
                return p;
              })()}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            />
          </svg>

          {/* Trace Label Overlay */}
          <div className="absolute top-2 left-3 flex flex-col justify-between h-[135px] font-mono text-[10px] pointer-events-none select-none">
            <span className="text-cyan-400 font-bold">CLK</span>
            <span className="text-slate-300 font-bold">DATA (D)</span>
            <span className="text-emerald-400 font-bold">FF (Q)</span>
            <span className="text-amber-400 font-bold">LATCH (Q)</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Clock className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Sequential Timing Guide: Flip-Flops, Latches &amp; Metastability
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Edge-Triggered Flip-Flop */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>1. Edge-Triggered D-FF</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Constructed from two back-to-back master-slave latches. Samples input $D$ <strong>strictly at the rising clock transition edge (↑)</strong>. The output $Q$ remains stable and immune to data glitches throughout the entire clock period.
            </p>
          </div>

          {/* Column 2: Level-Sensitive Latch */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>2. Level-Sensitive Latch</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              A latch is <strong>transparent</strong> for the entire duration $CLK = 1$. Any glitch or transition on input $D$ passes directly to output $Q$. It becomes <strong>opaque (latched)</strong> only when $CLK$ falls to $0$.
            </p>
          </div>

          {/* Column 3: Setup/Hold & Metastability */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>3. Setup/Hold &amp; Metastability</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Data must remain stable for T_setup before and T_hold after the clock edge. Violating this aperture traps the internal feedback inverters in an intermediate <strong>metastable voltage (VDD/2)</strong>, causing random timing failures.
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
              <strong>Observe Transparency:</strong> Set <em>CLK = 1</em> and click <em>Toggle D</em>. Notice that the Latch output $Q$ updates immediately, while the Flip-Flop ignores changes until the next rising clock edge.
            </li>
            <li>
              <strong>Test Async Reset:</strong> Click <em>Pulse reset (rst_n)</em> to observe immediate asynchronous output clearing without waiting for a clock transition.
            </li>
            <li>
              <strong>Inject Timing Violation:</strong> Click <em>"Inject Violation"</em> to simulate data toggling right in the middle of the clock edge and observe the metastability warning.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
