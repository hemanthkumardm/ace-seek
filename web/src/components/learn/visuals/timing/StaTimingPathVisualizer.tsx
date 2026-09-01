"use client";

import React, { useState } from "react";
import { Activity, Clock, ArrowRight, Gauge, Layers, Sliders, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export function StaTimingPathVisualizer() {
  const [clockPeriod, setClockPeriod] = useState<number>(2.0); // ns (500 MHz)
  const [logicDelay, setLogicDelay] = useState<number>(1.25); // ns
  const [netDelay, setNetDelay] = useState<number>(0.35); // ns
  const [launchClockLatency, setLaunchClockLatency] = useState<number>(0.40); // ns
  const [captureClockLatency, setCaptureClockLatency] = useState<number>(0.55); // ns
  const [clockUncertainty, setClockUncertainty] = useState<number>(0.08); // ns
  const [setupTime, setSetupTime] = useState<number>(0.12); // ns
  const [holdTime, setHoldTime] = useState<number>(0.06); // ns
  const [checkType, setCheckType] = useState<"SETUP" | "HOLD">("SETUP");

  const tc2q = 0.15; // ns (sky130_fd_sc_hd__dfxtp_1)

  // Clock Skew = Capture Latency - Launch Latency
  const clockSkew = captureClockLatency - launchClockLatency;

  // Setup Check:
  // Data Arrival Time = Launch Latency + Tc2q + Logic Delay + Net Delay
  // Data Required Time = Clock Period + Capture Latency - Setup Time - Uncertainty
  // Setup Slack = Required - Arrival
  const setupArrival = launchClockLatency + tc2q + logicDelay + netDelay;
  const setupRequired = clockPeriod + captureClockLatency - setupTime - clockUncertainty;
  const setupSlack = setupRequired - setupArrival;

  // Hold Check:
  // Data Arrival Time = Launch Latency + Tc2q + Logic Delay + Net Delay (Min values)
  // Data Required Time = Capture Latency + Hold Time + Uncertainty
  // Hold Slack = Arrival - Required
  const holdArrival = launchClockLatency + tc2q + (logicDelay * 0.4) + (netDelay * 0.4);
  const holdRequired = captureClockLatency + holdTime + clockUncertainty;
  const holdSlack = holdArrival - holdRequired;

  const currentSlack = checkType === "SETUP" ? setupSlack : holdSlack;
  const isPassing = currentSlack >= 0;

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
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Static Timing Analysis (STA) Critical Path &amp; Slack Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Physics-level breakdown of Launch Clock ➔ T_c2q ➔ Combinational Cloud ➔ Wire RC ➔ Capture Clock
            </p>
          </div>
        </div>

        {/* Check Type Selector */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          <button
            type="button"
            onClick={() => setCheckType("SETUP")}
            className={`px-3 py-1 rounded font-bold transition-all ${
              checkType === "SETUP" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Setup Check (Max Delay)
          </button>
          <button
            type="button"
            onClick={() => setCheckType("HOLD")}
            className={`px-3 py-1 rounded font-bold transition-all ${
              checkType === "HOLD" ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Hold Check (Min Delay)
          </button>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-4 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Clock Period (T_clk)</span>
            <span className="text-cyan-400">{clockPeriod.toFixed(2)} ns</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.1"
            value={clockPeriod}
            onChange={(e) => setClockPeriod(parseFloat(e.target.value))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[9px] text-slate-400 font-sans">Freq: {(1000 / clockPeriod).toFixed(0)} MHz</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Combinational Logic Delay</span>
            <span className="text-amber-400">{logicDelay.toFixed(2)} ns</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.5"
            step="0.05"
            value={logicDelay}
            onChange={(e) => setLogicDelay(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="text-[9px] text-slate-400 font-sans">Gate propagation delays (T_comb)</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Wire Interconnect RC Delay</span>
            <span className="text-emerald-400">{netDelay.toFixed(2)} ns</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="1.0"
            step="0.05"
            value={netDelay}
            onChange={(e) => setNetDelay(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
          <div className="text-[9px] text-slate-400 font-sans">SPEF metal parasitic delay (T_net)</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Clock Skew (T_skew)</span>
            <span className={clockSkew >= 0 ? "text-indigo-300" : "text-rose-400"}>
              {(clockSkew * 1000).toFixed(0)} ps
            </span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-slate-400">
            <span>Launch: {launchClockLatency}ns</span>
            <span>Capture: {captureClockLatency}ns</span>
          </div>
          <div className="text-[9px] text-slate-400 font-sans">
            {clockSkew > 0 ? "Positive Skew (Helps Setup)" : "Negative Skew (Hurts Setup)"}
          </div>
        </div>
      </div>

      {/* Path Schematic & Live Arrival / Required Stack */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <span className="text-cyan-300 font-bold">
            {checkType === "SETUP" ? "Setup Timing Path (Max Delay Analysis)" : "Hold Timing Path (Min Delay Analysis)"}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isPassing ? "bg-emerald-950 border border-emerald-400 text-emerald-300" : "bg-rose-950 border border-rose-500 text-rose-300"
          }`}>
            Slack: {currentSlack.toFixed(3)} ns ({isPassing ? "MET" : "VIOLATED"})
          </span>
        </div>

        {/* Visual Path Block Diagram */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Sequential Path Block Flow:</div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-center text-xs">
            {/* Launch Flop */}
            <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/70 text-cyan-300 flex-1">
              <div className="text-[9px] text-slate-400">Launch Flop (FF1)</div>
              <div className="font-bold">`u_reg1/Q`</div>
              <div className="text-[10px] text-cyan-400 mt-1 font-mono">T_c2q = {tc2q}ns</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />

            {/* Combinational Logic Cloud */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/70 text-amber-300 flex-1">
              <div className="text-[9px] text-slate-400">Combinational Logic</div>
              <div className="font-bold">ALU / Adder Gates</div>
              <div className="text-[10px] text-amber-400 mt-1 font-mono">T_comb = {logicDelay.toFixed(2)}ns</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />

            {/* Net Wire RC */}
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/70 text-emerald-300 flex-1">
              <div className="text-[9px] text-slate-400">Interconnect Wire</div>
              <div className="font-bold">Metal Routing RC</div>
              <div className="text-[10px] text-emerald-400 mt-1 font-mono">T_net = {netDelay.toFixed(2)}ns</div>
            </div>

            <ArrowRight className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />

            {/* Capture Flop */}
            <div className="p-3 rounded-lg bg-slate-950 border border-indigo-500/70 text-indigo-300 flex-1">
              <div className="text-[9px] text-slate-400">Capture Flop (FF2)</div>
              <div className="font-bold">`u_reg2/D`</div>
              <div className="text-[10px] text-indigo-300 mt-1 font-mono">
                {checkType === "SETUP" ? `T_setup = ${setupTime}ns` : `T_hold = ${holdTime}ns`}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed STA Mathematical Equation */}
        <div className="grid md:grid-cols-2 gap-3">
          {/* Arrival Stack */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
            <div className="text-[10px] text-cyan-400 uppercase font-bold">1. Data Arrival Time ({checkType === "SETUP" ? setupArrival.toFixed(3) : holdArrival.toFixed(3)} ns):</div>
            <div className="text-[10px] space-y-0.5 font-mono">
              <div>• Launch Clock Latency: +{launchClockLatency.toFixed(2)} ns</div>
              <div>• Clock-to-Q Delay (T_c2q): +{tc2q.toFixed(2)} ns</div>
              <div>• Logic Propagation (T_comb): +{checkType === "SETUP" ? logicDelay.toFixed(2) : (logicDelay * 0.4).toFixed(2)} ns</div>
              <div>• Net Interconnect Delay (T_net): +{checkType === "SETUP" ? netDelay.toFixed(2) : (netDelay * 0.4).toFixed(2)} ns</div>
            </div>
          </div>

          {/* Required Stack */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-slate-300">
            <div className="text-[10px] text-amber-400 uppercase font-bold">2. Data Required Time ({checkType === "SETUP" ? setupRequired.toFixed(3) : holdRequired.toFixed(3)} ns):</div>
            <div className="text-[10px] space-y-0.5 font-mono">
              {checkType === "SETUP" ? (
                <>
                  <div>• Capture Clock Edge (T_clk): +{clockPeriod.toFixed(2)} ns</div>
                  <div>• Capture Clock Latency: +{captureClockLatency.toFixed(2)} ns</div>
                  <div>• Cell Setup Requirement (T_setup): -{setupTime.toFixed(2)} ns</div>
                  <div>• Clock Uncertainty Safety: -{clockUncertainty.toFixed(2)} ns</div>
                </>
              ) : (
                <>
                  <div>• Capture Clock Latency: +{captureClockLatency.toFixed(2)} ns</div>
                  <div>• Cell Hold Requirement (T_hold): +{holdTime.toFixed(2)} ns</div>
                  <div>• Clock Uncertainty Margin: +{clockUncertainty.toFixed(2)} ns</div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* PrimeTime / OpenSTA Report Output */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synopsys PrimeTime / OpenSTA Report (`report_timing -path_type full_clock_expanded`):</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`Startpoint: u_reg1 (rising edge-triggered flip-flop clocked by clk)
Endpoint:   u_reg2 (rising edge-triggered flip-flop clocked by clk)
Path Group: reg2reg
Path Type:  ${checkType === "SETUP" ? "max (setup)" : "min (hold)"}

  Point                                                   Incr       Path
  -------------------------------------------------------------------------
  clock clk (rise edge)                                   0.000      0.000
  clock network delay (propagated)                        ${launchClockLatency.toFixed(3)}      ${launchClockLatency.toFixed(3)}
  u_reg1/CLK (sky130_fd_sc_hd__dfxtp_1)                   0.000      ${launchClockLatency.toFixed(3)}
  u_reg1/Q (sky130_fd_sc_hd__dfxtp_1)                     ${tc2q.toFixed(3)}      ${(launchClockLatency + tc2q).toFixed(3)} r
  u_comb_cloud/Y (sky130_fd_sc_hd__fa_1)                  ${checkType === "SETUP" ? logicDelay.toFixed(3) : (logicDelay * 0.4).toFixed(3)}      ${(launchClockLatency + tc2q + (checkType === "SETUP" ? logicDelay : logicDelay * 0.4)).toFixed(3)} f
  u_reg2/D (sky130_fd_sc_hd__dfxtp_1)                     ${checkType === "SETUP" ? netDelay.toFixed(3) : (netDelay * 0.4).toFixed(3)}      ${checkType === "SETUP" ? setupArrival.toFixed(3) : holdArrival.toFixed(3)} f
  data arrival time                                                  ${checkType === "SETUP" ? setupArrival.toFixed(3) : holdArrival.toFixed(3)}

  clock clk (rise edge)                                   ${checkType === "SETUP" ? clockPeriod.toFixed(3) : "0.000"}      ${checkType === "SETUP" ? clockPeriod.toFixed(3) : "0.000"}
  clock network delay (propagated)                        ${captureClockLatency.toFixed(3)}      ${(checkType === "SETUP" ? clockPeriod + captureClockLatency : captureClockLatency).toFixed(3)}
  clock uncertainty                                      -${clockUncertainty.toFixed(3)}      ${(checkType === "SETUP" ? clockPeriod + captureClockLatency - clockUncertainty : captureClockLatency - clockUncertainty).toFixed(3)}
  u_reg2/CLK (sky130_fd_sc_hd__dfxtp_1)                   0.000      ${(checkType === "SETUP" ? clockPeriod + captureClockLatency - clockUncertainty : captureClockLatency - clockUncertainty).toFixed(3)}
  library ${checkType === "SETUP" ? "setup time" : "hold time"}                                   -${checkType === "SETUP" ? setupTime.toFixed(3) : `+${holdTime.toFixed(3)}`}      ${checkType === "SETUP" ? setupRequired.toFixed(3) : holdRequired.toFixed(3)}
  data required time                                                 ${checkType === "SETUP" ? setupRequired.toFixed(3) : holdRequired.toFixed(3)}
  -------------------------------------------------------------------------
  slack (${isPassing ? "MET" : "VIOLATED"})                                                ${currentSlack >= 0 ? `+${currentSlack.toFixed(3)}` : currentSlack.toFixed(3)}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
