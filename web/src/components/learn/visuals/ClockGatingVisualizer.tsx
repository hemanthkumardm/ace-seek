"use client";

import React, { useEffect, useState } from "react";
import { Power, Zap, AlertTriangle, ShieldCheck, Play, Pause, Cpu } from "lucide-react";

export function ClockGatingVisualizer() {
  const [clk, setClk] = useState<0 | 1>(0);
  const [en, setEn] = useState<0 | 1>(1);
  const [scanEn, setScanEn] = useState<boolean>(false);
  const [running, setRunning] = useState<boolean>(true);
  const [latchQ, setLatchQ] = useState<0 | 1>(1);

  // Oscilloscope waveform trace history
  const [history, setHistory] = useState<
    { clk: number; en: number; naive: number; icg: number; isRuntGlitch: boolean }[]
  >([]);

  // Clock oscillator
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      setClk((c) => (c === 1 ? 0 : 1));
    }, 450);
    return () => clearInterval(interval);
  }, [running]);

  // Negative-level transparent latch (typical standard cell ICG):
  // When CLK = 0, latch is TRANSPARENT (latches EN | scan_en).
  // When CLK = 1, latch is OPAQUE (holds latched value stable).
  const effectiveEn = (en === 1 || scanEn) ? 1 : 0;

  useEffect(() => {
    if (clk === 0) {
      setLatchQ(effectiveEn as 0 | 1);
    }
  }, [clk, effectiveEn]);

  // Gated clock outputs
  const naiveGated = (clk & effectiveEn) as 0 | 1;
  const icgGated = (clk & latchQ) as 0 | 1;

  // A runt pulse/glitch occurs in naive AND gating if EN transitions while CLK is already HIGH
  const isRuntGlitch = clk === 1 && en === 1 && latchQ === 0 && !scanEn;

  // Append history for live waveform display
  useEffect(() => {
    setHistory((prev) => [
      ...prev.slice(-24),
      { clk, en: effectiveEn, naive: naiveGated, icg: icgGated, isRuntGlitch },
    ]);
  }, [clk, effectiveEn, naiveGated, icgGated, isRuntGlitch]);

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Power className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Integrated Clock Gating (ICG) vs. Naive AND Gating Simulator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Demonstrates why standard AND gates create fatal runt clock pulses and how negative-level latches eliminate glitches.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="ln-btn"
            onClick={() => setRunning((r) => !r)}
          >
            {running ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {running ? "Pause Clock" : "Run Clock"}
          </button>
          <button
            type="button"
            className={`ln-btn ${scanEn ? "ln-btn-primary" : ""}`}
            onClick={() => setScanEn((s) => !s)}
          >
            Scan Test Bypass (SE={scanEn ? "1" : "0"})
          </button>
        </div>
      </div>

      {/* Interactive Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Toggle Enable Signal */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">Enable Pin (EN)</span>
            <span className="font-mono font-bold text-xs text-cyan-400">EN = {en}</span>
          </div>
          <button
            type="button"
            onClick={() => setEn((e) => (e === 1 ? 0 : 1))}
            className="w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all bg-[var(--ln-accent)] text-slate-950 shadow-sm hover:brightness-110"
          >
            Toggle Enable (now {en === 1 ? "HIGH" : "LOW"})
          </button>
        </div>

        {/* Live Oscillator Status */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-1 font-mono text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Free-Running CLK:</span>
            <span className="font-black text-cyan-400">{clk}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>ICG Negative Latch:</span>
            <span className="font-black text-emerald-400">
              {latchQ} ({clk === 0 ? "Transparent" : "Latched Opaque"})
            </span>
          </div>
          <div className="flex justify-between text-slate-400 pt-1 border-t border-[var(--ln-border)]">
            <span>Scan Override:</span>
            <span className="font-bold text-amber-400">{scanEn ? "ACTIVE" : "OFF"}</span>
          </div>
        </div>

        {/* Glitch Verdict */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-1 text-xs">
          <span className="font-bold text-[var(--ln-muted)] uppercase">Clock Integrity</span>
          <div
            className={`py-1.5 px-2 rounded-lg font-bold font-mono text-center flex items-center justify-center gap-1.5 ${
              isRuntGlitch
                ? "bg-rose-950 text-rose-300 border border-rose-600 animate-pulse"
                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
            }`}
          >
            {isRuntGlitch ? "⚠️ NAIVE AND RUNT CLOCK GLITCH" : "✓ Glitch-Free Clock (ICG Safe)"}
          </div>
        </div>
      </div>

      {/* Multi-Trace Digital Oscilloscope */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
          <span>Real-time Clock Waveform Oscilloscope</span>
          <span className="text-cyan-400">Step: 450ms / Cycle</span>
        </div>

        <div className="space-y-2 text-[10px]">
          {/* Row 1: Source Clock */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-cyan-400 font-bold">SOURCE CLK:</span>
            <div className="flex-1 flex h-6 gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-xs transition-all ${
                    h.clk === 1 ? "bg-cyan-400" : "bg-slate-800 opacity-40"
                  }`}
                  style={{
                    height: h.clk === 1 ? "100%" : "25%",
                    alignSelf: h.clk === 1 ? "stretch" : "flex-end",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Row 2: Enable Signal */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-slate-300 font-bold">ENABLE (EN):</span>
            <div className="flex-1 flex h-6 gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-xs transition-all ${
                    h.en === 1 ? "bg-amber-400" : "bg-slate-800 opacity-40"
                  }`}
                  style={{
                    height: h.en === 1 ? "100%" : "25%",
                    alignSelf: h.en === 1 ? "stretch" : "flex-end",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Row 3: Naive AND Gated Clock */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-rose-400 font-bold">NAIVE AND:</span>
            <div className="flex-1 flex h-6 gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-xs transition-all ${
                    h.isRuntGlitch
                      ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,1)] animate-pulse"
                      : h.naive === 1
                      ? "bg-slate-400"
                      : "bg-slate-800 opacity-40"
                  }`}
                  style={{
                    height: h.naive === 1 ? "100%" : "25%",
                    alignSelf: h.naive === 1 ? "stretch" : "flex-end",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Row 4: Clean ICG Gated Clock */}
          <div className="flex items-center gap-2">
            <span className="w-16 text-emerald-400 font-bold">ICG GATED:</span>
            <div className="flex-1 flex h-6 gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
              {history.map((h, i) => (
                <div
                  key={i}
                  className={`flex-1 rounded-xs transition-all ${
                    h.icg === 1 ? "bg-emerald-400" : "bg-slate-800 opacity-40"
                  }`}
                  style={{
                    height: h.icg === 1 ? "100%" : "25%",
                    alignSelf: h.icg === 1 ? "stretch" : "flex-end",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Silicon Clocking Guide: Why ICG Cells Are Mandatory in VLSI
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Naive AND Danger */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>1. The Naive AND Hazard</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Using a simple AND gate (<code>clk &amp; en</code>) creates severe hazards. If the enable signal changes while the clock is HIGH, the AND gate cuts off mid-pulse, producing a narrow <strong>runt clock pulse</strong> that violates register setup/hold times and causes silicon latchup!
            </p>
          </div>

          {/* Column 2: Negative-Level Latch */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Negative-Level Latch ICG</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Standard cell ICGs insert an <strong>active-low transparent latch</strong> before the AND gate. When <code>clk=0</code>, the latch transparently captures any change in <code>en</code>. When <code>clk=1</code>, the latch freezes, ensuring the enable input to the AND gate remains completely stable throughout the entire clock HIGH phase!
            </p>
          </div>

          {/* Column 3: DFT Scan Test Bypass */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. DFT Scan Test Bypass</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              During manufacturing test, the Automatic Test Equipment (ATE) needs to clock every register continuously. An integrated OR gate with <strong>Scan Enable (SE)</strong> forces the ICG permanently ON (<code>en | scan_en</code>) during scan shift mode.
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
              <strong>Trigger a Runt Pulse:</strong> Click <em>"Toggle Enable"</em> right when the clock is HIGH. Notice the NAIVE AND row flashes red with a corrupted clipped pulse, while the ICG cleanly delays the enable transition until the next clock cycle.
            </li>
            <li>
              <strong>Test DFT Scan Bypass:</strong> Click <em>"Scan Test Bypass (SE=1)"</em> to verify that the clock runs continuously regardless of the functional enable signal.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
