"use client";

import React, { useState } from "react";
import { Activity, ShieldAlert, Cpu, Layers, Sliders, CheckCircle2, AlertTriangle } from "lucide-react";

export function CdcMetastabilityVisualizer() {
  const [numStages, setNumStages] = useState<2 | 3>(2);
  const [clockFreqMHz, setClockFreqMHz] = useState<number>(500); // 500 MHz
  const [dataFreqMHz, setDataFreqMHz] = useState<number>(50); // 50 MHz
  const [tauPs, setTauPs] = useState<number>(18); // 18 ps (SkyWater 130nm resolution time constant)

  const clockPeriodPs = (1000 / clockFreqMHz) * 1000;
  // Available resolution time: (N - 1) * T_clk - T_c2q - T_setup
  const resolutionTimePs = (numStages - 1) * clockPeriodPs - 150 - 120;

  // MTBF Formula: MTBF = exp(tr / tau) / (To * fclk * fdata)
  // Let To = 150ps
  const toSec = 150e-12;
  const fclkHz = clockFreqMHz * 1e6;
  const fdataHz = dataFreqMHz * 1e6;
  const trSec = Math.max(10e-12, resolutionTimePs * 1e-12);
  const tauSec = tauPs * 1e-12;

  const exponent = trSec / tauSec;
  // Compute log10(MTBF in seconds)
  const log10MtbfSec = (exponent * Math.LOG10E) - Math.log10(toSec * fclkHz * fdataHz);
  const mtbfYears = Math.pow(10, log10MtbfSec) / (3600 * 24 * 365.25);

  let mtbfDisplay = "";
  if (mtbfYears > 1e9) {
    mtbfDisplay = "> 1 Billion Years (Extremely Safe)";
  } else if (mtbfYears > 1e6) {
    mtbfDisplay = `${(mtbfYears / 1e6).toFixed(1)} Million Years`;
  } else if (mtbfYears > 1e3) {
    mtbfDisplay = `${(mtbfYears / 1e3).toFixed(1)} Thousand Years`;
  } else if (mtbfYears > 1) {
    mtbfDisplay = `${mtbfYears.toFixed(1)} Years`;
  } else {
    const mtbfDays = mtbfYears * 365.25;
    mtbfDisplay = `${mtbfDays.toFixed(2)} Days (DANGEROUS: High Failure Rate!)`;
  }

  const isSafe = mtbfYears > 100;

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
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Metastability Physics &amp; MTBF Reliability Calculator
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Mean Time Between Failures: MTBF = exp(t_r / tau) / (T_0 * f_clk * f_data) (2-FF vs 3-FF Synchronizer)
            </p>
          </div>
        </div>

        {/* Synchronizer Stages Switcher */}
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)] font-mono text-xs">
          {[2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setNumStages(s as 2 | 3)}
              className={`px-3 py-1 rounded font-bold transition-all ${
                numStages === s ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm" : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {s}-FF Synchronizer Chain
            </button>
          ))}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid md:grid-cols-3 gap-3 mb-4 font-mono text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Destination Clock Freq (`f_clk`)</span>
            <span className="text-cyan-400">{clockFreqMHz} MHz ({clockPeriodPs.toFixed(0)} ps)</span>
          </div>
          <input
            type="range"
            min="100"
            max="1500"
            step="50"
            value={clockFreqMHz}
            onChange={(e) => setClockFreqMHz(parseInt(e.target.value, 10))}
            className="w-full accent-cyan-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Higher clock frequency reduces available resolution time $t_r$.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Async Data Transition Rate (`f_data`)</span>
            <span className="text-amber-400">{dataFreqMHz} MHz</span>
          </div>
          <input
            type="range"
            min="1"
            max="200"
            step="5"
            value={dataFreqMHz}
            onChange={(e) => setDataFreqMHz(parseInt(e.target.value, 10))}
            className="w-full accent-amber-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Frequency of asynchronous transitions hitting the setup/hold window.</div>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Technology Resolution Constant (tau)</span>
            <span className="text-emerald-400">{tauPs} ps</span>
          </div>
          <input
            type="range"
            min="8"
            max="35"
            step="1"
            value={tauPs}
            onChange={(e) => setTauPs(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-400"
          />
          <div className="text-[10px] text-slate-400 font-sans">Internal bistable feedback inverter gain (FinFET = 8ps, 130nm = 20ps).</div>
        </div>
      </div>

      {/* MTBF Results Banner & Multi-Stage Flop Diagram */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
        <div className="flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
          <div>
            <span className="text-cyan-300 font-bold block">Calculated System Reliability:</span>
            <span className="text-[10px] text-slate-400">Available Resolution Time: {resolutionTimePs.toFixed(0)} ps</span>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isSafe ? "bg-emerald-950 border border-emerald-400 text-emerald-300" : "bg-rose-950 border border-rose-500 text-rose-300"
          }`}>
            MTBF: {mtbfDisplay}
          </span>
        </div>

        {/* Multi-Stage Flop Synchronizer Diagram */}
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Synchronizer Chain Architecture ({numStages} Flip-Flops):</div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center">
            {/* Input Async Signal */}
            <div className="p-2.5 rounded bg-slate-950 border border-rose-500/70 text-rose-300">
              <div className="text-[9px] text-slate-400">Async Domain A</div>
              <div className="font-bold text-xs">`d_async`</div>
            </div>

            {/* Stage 1 Flop */}
            <div className="p-3 rounded-lg bg-slate-950 border border-amber-500/80 text-amber-300 flex-1">
              <div className="text-[9px] text-slate-400">Stage 1 (Metastable Flop)</div>
              <div className="font-bold">`sync_reg1`</div>
              <div className="text-[9px] text-amber-400 mt-1">May oscillate near VDD/2</div>
            </div>

            {/* Stage 2 Flop */}
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/80 text-emerald-300 flex-1">
              <div className="text-[9px] text-slate-400">Stage 2 (Resolved Flop)</div>
              <div className="font-bold">`sync_reg2`</div>
              <div className="text-[9px] text-emerald-400 mt-1">Settles to valid 0 or 1</div>
            </div>

            {/* Stage 3 Flop (if 3-FF enabled) */}
            {numStages === 3 && (
              <div className="p-3 rounded-lg bg-indigo-950 border border-indigo-400 text-indigo-200 flex-1 shadow-md">
                <div className="text-[9px] text-indigo-400 font-bold uppercase">Stage 3 (Ultra-High MTBF)</div>
                <div className="font-bold">`sync_reg3`</div>
                <div className="text-[9px] text-indigo-300 mt-1">MTBF Boost: 10^9x</div>
              </div>
            )}

            {/* Output Synced Signal */}
            <div className="p-2.5 rounded bg-slate-950 border border-cyan-500/70 text-cyan-300">
              <div className="text-[9px] text-slate-400">Sync Domain B</div>
              <div className="font-bold text-xs">`q_sync`</div>
            </div>
          </div>
        </div>

        {/* Synthesizable Verilog & SDC Guidelines */}
        <div className="space-y-1 pt-1">
          <div className="text-[10px] text-slate-400 uppercase font-bold">Standard Verilog &amp; SDC Implementation:</div>
          <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-xs font-mono leading-relaxed border border-slate-800 overflow-x-auto">
{`// Synthesizable ${numStages}-FF Synchronizer with 'async_reg' attribute
(* async_reg = "true" *) reg [${numStages - 1}:0] sync_chain;

always @(posedge clk_b or negedge rst_n) begin
  if (!rst_n)
    sync_chain <= ${numStages}'b0;
  else
    sync_chain <= {sync_chain[${numStages - 2}:0], d_async};
end

assign q_sync = sync_chain[${numStages - 1}];

# SDC Constraint: Limit max delay across async boundary without false-pathing setup
set_max_delay -from [get_pins u_src/Q] -to [get_pins sync_chain_reg[0]/D] ${clockPeriodPs / 1000} -datapath_only`}
          </pre>
        </div>
      </div>
    </div>
  );
}
