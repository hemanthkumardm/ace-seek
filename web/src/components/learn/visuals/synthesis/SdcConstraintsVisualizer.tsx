"use client";

import React, { useState } from "react";
import { Cpu, Sliders, Activity, Zap, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

export function SdcConstraintsVisualizer() {
  const [clockPeriod, setClockPeriod] = useState<number>(2.0); // ns (500 MHz)
  const [inputDelay, setInputDelay] = useState<number>(0.5); // ns
  const [maxTransLimit, setMaxTransLimit] = useState<number>(0.15); // ns

  // Logic delay of internal block
  const internalDataDelay = 1.15; // ns
  const tc2q = 0.18; // ns
  const tsetup = 0.08; // ns

  // Total arrival = inputDelay + internalDataDelay + tc2q
  const arrivalTime = inputDelay + internalDataDelay + tc2q;
  const requiredTime = clockPeriod - tsetup;
  const slack = (requiredTime - arrivalTime).toFixed(2);
  const isTimingMet = parseFloat(slack) >= 0;

  // Buffer insertion count for slew limit
  const buffersInserted = maxTransLimit < 0.12 ? 32 : maxTransLimit < 0.18 ? 16 : 4;
  const bufferArea = (buffersInserted * 2.4).toFixed(1);

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
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              SDC Constraints &amp; Synthesis Cost Function Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Interactive SDC parameter sliders: Clock Period, I/O Delays, and Max Transition DRCs
            </p>
          </div>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-3 gap-4 mb-4 font-mono text-xs">
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Clock Target (`create_clock`)</span>
            <span className="text-cyan-400">{clockPeriod} ns ({(1000 / clockPeriod).toFixed(0)} MHz)</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.5"
            step="0.1"
            value={clockPeriod}
            onChange={(e) => setClockPeriod(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Sets the total setup timing budget (T_clk).</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Input Delay (`set_input_delay`)</span>
            <span className="text-amber-400">{inputDelay} ns</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.2"
            step="0.1"
            value={inputDelay}
            onChange={(e) => setInputDelay(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">External flight time before arrival at input port.</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Max Slew DRC (`set_max_transition`)</span>
            <span className="text-emerald-400">{maxTransLimit} ns</span>
          </div>
          <input
            type="range"
            min="0.08"
            max="0.25"
            step="0.01"
            value={maxTransLimit}
            onChange={(e) => setMaxTransLimit(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Forces buffer insertion on high-capacitance wires.</div>
        </div>
      </div>

      {/* Visual Timing Budget Breakdown */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-slate-300 font-bold">Timing Path Arrival vs. Required Budget</span>
          <span className={`font-bold ${isTimingMet ? "text-emerald-400" : "text-rose-400"}`}>
            Slack: {slack} ns {isTimingMet ? "✓ MET" : "❌ VIOLATION"}
          </span>
        </div>

        {/* Visual Waveform Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400">
            <span>Data Arrival: {arrivalTime.toFixed(2)} ns (Input {inputDelay}ns + Logic {internalDataDelay}ns + Tc2q {tc2q}ns)</span>
            <span>Required Limit: {requiredTime.toFixed(2)} ns</span>
          </div>

          <div className="w-full h-7 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden flex relative">
            {/* Input Delay Portion */}
            <div
              className="bg-amber-500/80 h-full flex items-center justify-center text-[9px] font-bold text-slate-950"
              style={{ width: `${(inputDelay / clockPeriod) * 100}%` }}
            >
              Input Delay ({inputDelay}ns)
            </div>
            {/* Internal Logic Portion */}
            <div
              className="bg-cyan-500 h-full flex items-center justify-center text-[9px] font-bold text-slate-950"
              style={{ width: `${((internalDataDelay + tc2q) / clockPeriod) * 100}%` }}
            >
              Internal Datapath ({(internalDataDelay + tc2q).toFixed(2)}ns)
            </div>
            {/* Setup Margin / Slack */}
            {isTimingMet ? (
              <div
                className="bg-emerald-500/90 h-full flex items-center justify-center text-[9px] font-bold text-slate-950"
                style={{ width: `${(parseFloat(slack) / clockPeriod) * 100}%` }}
              >
                Slack (+{slack}ns)
              </div>
            ) : (
              <div
                className="bg-rose-500 h-full flex items-center justify-center text-[9px] font-bold text-white animate-pulse"
                style={{ width: "15%" }}
              >
                Deficit ({slack}ns)
              </div>
            )}
          </div>
        </div>

        {/* DRC Buffer Insertion Engine Status */}
        <div className="grid sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">DRC Slew Buffer Insertion:</span>
            <div className="text-base font-black text-amber-300">
              {buffersInserted} Buffers Added <span className="text-xs text-slate-400 font-normal">({bufferArea} µm² Area)</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              Tight transition constraints ({maxTransLimit}ns) require inserting repeater buffers along long interconnect nets.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Synthesis Cost Function Verdict:</span>
            <div className={`text-base font-black ${isTimingMet ? "text-emerald-400" : "text-rose-400"}`}>
              {isTimingMet ? "✓ All Constraints & DRCs Satisfied" : "⚠️ Timing Closure Failure (Needs RTL Pipeline)"}
            </div>
            <p className="text-[10px] text-slate-400 font-sans">
              The optimizer sizes up standard cell gates to satisfy SDC clock period ({clockPeriod}ns) without violating transition limits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
