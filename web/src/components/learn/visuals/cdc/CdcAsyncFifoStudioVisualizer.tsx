"use client";

import React, { useState } from "react";
import { HardDrive, ArrowRight, Play, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, Layers } from "lucide-react";

export function CdcAsyncFifoStudioVisualizer() {
  const [fifoMem, setFifoMem] = useState<number[]>([0xA1, 0xB2, 0xC3]);
  const [wptrBin, setWptrBin] = useState<number>(3);
  const [rptrBin, setRptrBin] = useState<number>(0);

  const depth = 8;
  const ptrMask = 0xF; // 4-bit pointers (0..15)

  // Binary to Gray conversion: G = B ^ (B >> 1)
  const binToGray = (b: number) => (b ^ (b >> 1)) & ptrMask;
  const formatBin = (n: number) => n.toString(2).padStart(4, "0");

  const wptrGray = binToGray(wptrBin);
  const rptrGray = binToGray(rptrBin);

  // Full condition: MSB inverted, MSB-1 inverted, LSBs equal
  // In 4-bit Gray: wptrGray == {~rptrGray[3:2], rptrGray[1:0]}
  const isFull =
    ((wptrGray >> 3) & 1) !== ((rptrGray >> 3) & 1) &&
    ((wptrGray >> 2) & 1) !== ((rptrGray >> 2) & 1) &&
    (wptrGray & 0x3) === (rptrGray & 0x3);

  // Empty condition: wptrGray == rptrGray
  const isEmpty = wptrGray === rptrGray;

  const handlePush = () => {
    if (isFull) return;
    const nextVal = Math.floor(Math.random() * 255);
    setFifoMem((prev) => [...prev, nextVal]);
    setWptrBin((prev) => (prev + 1) & ptrMask);
  };

  const handlePop = () => {
    if (isEmpty) return;
    setFifoMem((prev) => prev.slice(1));
    setRptrBin((prev) => (prev + 1) & ptrMask);
  };

  const handleReset = () => {
    setFifoMem([]);
    setWptrBin(0);
    setRptrBin(0);
  };

  const count = fifoMem.length;

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
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Dual-Clock Asynchronous FIFO &amp; Gray Pointer Synchronization Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Dual-Port RAM storage, G = B ^ (B &gt;&gt; 1) Gray pointers, 2-FF synchronization, and Full/Empty flag generation
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={handlePush}
            disabled={isFull}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
              isFull
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-95 shadow-sm"
            }`}
          >
            Push Data (wclk)
          </button>
          <button
            type="button"
            onClick={handlePop}
            disabled={isEmpty}
            className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1 transition-all ${
              isEmpty
                ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-400 text-slate-950 hover:bg-emerald-300 active:scale-95 shadow-sm"
            }`}
          >
            Pop Data (rclk)
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            title="Reset FIFO"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status Badges Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-xs">
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase block">Write Pointer (wclk)</span>
          <span className="text-cyan-300 font-bold">Bin: {formatBin(wptrBin)} · Gray: {formatBin(wptrGray)}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase block">Read Pointer (rclk)</span>
          <span className="text-emerald-300 font-bold">Bin: {formatBin(rptrBin)} · Gray: {formatBin(rptrGray)}</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
          <span className="text-[10px] text-slate-400 uppercase block">Occupancy</span>
          <span className="text-amber-300 font-bold">{count} / {depth} Slots Filled</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-center flex items-center justify-center">
          {isFull ? (
            <span className="px-2 py-1 rounded bg-rose-950 border border-rose-500 text-rose-300 font-bold text-xs">
              FULL (Write Gated)
            </span>
          ) : isEmpty ? (
            <span className="px-2 py-1 rounded bg-amber-950 border border-amber-500 text-amber-300 font-bold text-xs">
              EMPTY (Read Gated)
            </span>
          ) : (
            <span className="px-2 py-1 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 font-bold text-xs">
              ACTIVE (Ready)
            </span>
          )}
        </div>
      </div>

      {/* Memory Slot Buffer View */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">Dual-Port SRAM Memory Buffer Array (Depth 8 × 8-bit Data)</span>
          <span className="text-slate-400">Pointers use N+1 bits (4 bits) for Wrap-Around Flagging</span>
        </div>

        {/* 8 RAM Slots Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {Array.from({ length: depth }).map((_, idx) => {
            const hasData = idx < count;
            const val = hasData ? fifoMem[idx] : null;
            const isWriteTarget = idx === (wptrBin % depth);
            const isReadTarget = idx === (rptrBin % depth);

            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border text-center transition-all ${
                  hasData
                    ? "bg-slate-900 border-cyan-500/60 text-cyan-200 shadow-sm"
                    : "bg-slate-950/60 border-slate-800 text-slate-600"
                }`}
              >
                <div className="text-[9px] text-slate-500 uppercase font-bold mb-1">Addr {idx}</div>
                <div className="text-sm font-bold font-mono text-white mb-1">
                  {val !== null ? `0x${val.toString(16).toUpperCase().padStart(2, "0")}` : "---"}
                </div>
                <div className="flex justify-center gap-1 text-[8px]">
                  {isWriteTarget && <span className="p-0.5 px-1 rounded bg-cyan-400 text-slate-950 font-bold">WP</span>}
                  {isReadTarget && <span className="p-0.5 px-1 rounded bg-emerald-400 text-slate-950 font-bold">RP</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Gray Code Synchronizer & Flag Logic Explanation */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-slate-300 font-sans text-xs">
            <strong className="text-cyan-300 block font-mono text-xs">1. Why Gray Code is Mandatory for Pointers:</strong>
            <p className="text-[11px] leading-relaxed">
              In binary, transitioning from <code>3 (0011)</code> to <code>4 (0100)</code> changes 3 bits simultaneously. If sampled across asynchronous clock domains, bit skew causes false transient values (e.g. <code>0111 = 7</code>), triggering false full/empty flags! Gray code changes exactly <strong>one bit per step</strong> ($0010 \rightarrow 0110$), guaranteeing that even in metastability, the sampled value is either the old pointer or new pointer!
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-slate-300 font-sans text-xs">
            <strong className="text-emerald-300 block font-mono text-xs">2. Full vs Empty Comparison Rules:</strong>
            <p className="text-[11px] leading-relaxed">
              <strong>Empty:</strong> <code>rptr_gray == wptr_gray_sync</code> (Both pointers identical).<br />
              <strong>Full:</strong> <code>wptr_gray == &#123;~rptr_sync[3:2], rptr_sync[1:0]&#125;</code> (MSB inverted because write pointer has wrapped around the memory depth, while MSB-1 is also inverted to account for Gray code symmetry).
            </p>
          </div>
        </div>

        {/* Synthesizable Async FIFO RTL */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Production Synthesizable Async FIFO Core (SystemVerilog):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto max-h-60">
{`module async_fifo #(parameter DSIZE = 8, parameter ASIZE = 3) (
  input  wire              wclk, wrst_n, winc,
  input  wire [DSIZE-1:0]  wdata,
  output wire              wfull,
  input  wire              rclk, rrst_n, rinc,
  output wire [DSIZE-1:0]  rdata,
  output wire              rempty
);
  reg [ASIZE:0] wptr_bin, rptr_bin;
  wire [ASIZE:0] wptr_gray = wptr_bin ^ (wptr_bin >> 1);
  wire [ASIZE:0] rptr_gray = rptr_bin ^ (rptr_bin >> 1);

  // 2-FF Synchronizers
  (* async_reg = "true" *) reg [ASIZE:0] wq2_rptr, wq1_rptr, rq2_wptr, rq1_wptr;
  always @(posedge wclk or negedge wrst_n)
    if (!wrst_n) {wq2_rptr, wq1_rptr} <= 0;
    else         {wq2_rptr, wq1_rptr} <= {wq1_rptr, rptr_gray};

  always @(posedge rclk or negedge rrst_n)
    if (!rrst_n) {rq2_wptr, rq1_wptr} <= 0;
    else         {rq2_wptr, rq1_wptr} <= {rq1_wptr, wptr_gray};

  // Full and Empty Flag Generation
  assign rempty = (rptr_gray == rq2_wptr);
  assign wfull  = (wptr_gray == {~wq2_rptr[ASIZE:ASIZE-1], wq2_rptr[ASIZE-2:0]});
endmodule`}
          </pre>
        </div>
      </div>
    </div>
  );
}
