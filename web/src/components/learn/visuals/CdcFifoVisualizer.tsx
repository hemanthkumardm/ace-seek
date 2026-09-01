"use client";

import React, { useState } from "react";
import { ArrowLeftRight, Database, ShieldAlert, Cpu, CheckCircle2, ArrowRight } from "lucide-react";

export function CdcFifoVisualizer() {
  const [fifo, setFifo] = useState<number[]>([42, 87, 19]);
  const [wptr, setWptr] = useState(3);
  const [rptr, setRptr] = useState(0);

  // Binary to Gray helper (4-bit)
  const bin2gray = (b: number) => {
    const val = b ^ (b >> 1);
    return val.toString(2).padStart(4, "0");
  };

  const isFull = fifo.length >= 8;
  const isEmpty = fifo.length === 0;

  const pushItem = () => {
    if (isFull) return;
    const randomByte = Math.floor(Math.random() * 255);
    setFifo((prev) => [...prev, randomByte]);
    setWptr((prev) => (prev + 1) % 16);
  };

  const popItem = () => {
    if (isEmpty) return;
    setFifo((prev) => prev.slice(1));
    setRptr((prev) => (prev + 1) % 16);
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
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Asynchronous Dual-Clock FIFO & CDC Pointer Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Cross-domain Gray pointer synchronization, empty/full detection, and circular buffer mechanics
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pushItem}
            disabled={isFull}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:brightness-110 disabled:opacity-40 shadow-sm transition-all"
          >
            Push to FIFO (wclk)
          </button>
          <button
            type="button"
            onClick={popItem}
            disabled={isEmpty}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:brightness-110 disabled:opacity-40 shadow-sm transition-all"
          >
            Pop from FIFO (rclk)
          </button>
        </div>
      </div>

      {/* Main Grid: Write Domain (Left) -> FIFO Ring (Center) -> Read Domain (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Write Domain (Left 3 cols) */}
        <div className="md:col-span-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-bold">
            <span>WRITE DOMAIN (wclk)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
              100 MHz
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">wbin ptr:</span>
              <span className="font-bold text-white">{wptr.toString(2).padStart(4, "0")} ({wptr})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">wgray ptr:</span>
              <span className="font-bold text-emerald-400">{bin2gray(wptr)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${isFull ? "text-rose-400" : "text-emerald-400"}`}>
                {isFull ? "FULL (Stall wr)" : "READY"}
              </span>
            </div>
          </div>
        </div>

        {/* FIFO Circular Buffer (Center 6 cols) */}
        <div className="md:col-span-6 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CIRCULAR DUAL-PORT SRAM MEMORY (Capacity: 8 Entries)</span>
            <span className="text-cyan-400 font-bold">{fifo.length} / 8 Words</span>
          </div>

          {/* 8 Memory Cells */}
          <div className="grid grid-cols-8 gap-1.5">
            {Array.from({ length: 8 }).map((_, idx) => {
              const hasData = idx < fifo.length;
              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center p-2 rounded border font-mono transition-all ${
                    hasData
                      ? "border-cyan-500/60 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]"
                      : "border-slate-800 bg-slate-900/50 text-slate-600"
                  }`}
                >
                  <span className="text-[9px] text-slate-500">[{idx}]</span>
                  <span className="text-xs font-bold mt-1">{hasData ? fifo[idx] : "--"}</span>
                </div>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-emerald-400 font-bold">wgray → 2FF → rclk</div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">{bin2gray(wptr)}</span>
                <span>→ FF1 → FF2</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                  {bin2gray(wptr)}
                </span>
              </div>
              <p className="text-slate-500">No combo between the two dest flops.</p>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1">
              <div className="text-cyan-400 font-bold">rgray → 2FF → wclk</div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">{bin2gray(rptr)}</span>
                <span>→ FF1 → FF2</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200">
                  {bin2gray(rptr)}
                </span>
              </div>
              <p className="text-slate-500">Payload stays in RAM — only pointers cross.</p>
            </div>
          </div>
        </div>

        {/* Read Domain (Right 3 cols) */}
        <div className="md:col-span-3 p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-cyan-400 font-bold">
            <span>READ DOMAIN (rclk)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
              40 MHz
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">rbin ptr:</span>
              <span className="font-bold text-white">{rptr.toString(2).padStart(4, "0")} ({rptr})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">rgray ptr:</span>
              <span className="font-bold text-cyan-400">{bin2gray(rptr)}</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${isEmpty ? "text-amber-400" : "text-cyan-400"}`}>
                {isEmpty ? "EMPTY (Wait data)" : "VALID"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <ArrowLeftRight className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Clock-Domain Crossing (CDC) Guide: How Dual-Clock Async FIFOs Work
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Multi-Bit Bus Hazard */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>1. The Multi-Bit CDC Hazard</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Never pass multi-bit binary pointers directly across asynchronous clock domains using 2FF synchronizers. Routing delays cause bits to arrive at different times: transitioning from <code>3'b011</code> (3) to <code>3'b100</code> (4) can be sampled as <code>3'b111</code> (7), causing catastrophic memory corruption.
            </p>
          </div>

          {/* Column 2: Gray Code Invariance */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>2. Gray Code Single-Bit Invariance</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Gray code (<code>gray = bin ^ (bin &gt;&gt; 1)</code>) guarantees that <strong>strictly one bit transitions per increment</strong>. Even if the destination clock samples during an active edge transition, the 2FF synchronizer resolves cleanly to either the previous or new pointer value.
            </p>
          </div>

          {/* Column 3: Full & Empty Math */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. Empty vs. Full Detection</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>EMPTY:</strong> Evaluated in Read domain when <code>rgray_next == wgray_sync</code>.<br />
              <strong>FULL:</strong> Evaluated in Write domain when the lower Gray bits match and the two MSBs are inverted: <code>wgray_next == {`{~rgray_sync[MSB:MSB-1], rgray_sync[MSB-2:0]}`}</code>.
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
              <strong>Push Data:</strong> Click <em>"Push to FIFO (wclk)"</em> to write words into the dual-port memory and watch the Write binary pointer <code>wptr</code> and Gray pointer <code>wgray</code> increment.
            </li>
            <li>
              <strong>Pop Data:</strong> Click <em>"Pop from FIFO (rclk)"</em> to read words out and observe the Read pointer <code>rptr</code> updating independently in the 40 MHz domain.
            </li>
            <li>
              <strong>Observe Full/Empty Bounds:</strong> Fill the FIFO to 8 entries to trigger the <strong>FULL (Stall wr)</strong> hardware backpressure flag.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
