"use client";

import React, { useState, useMemo } from "react";
import { Sliders, Activity, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";

export function TimingSlackVisualizer() {
  // Timing parameters in picoseconds (ps)
  const [tClk, setTClk] = useState<number>(1000); // 1.0 GHz = 1000 ps
  const [tCombo, setTCombo] = useState<number>(650); // Combinational path delay
  const [tC2Q, setTC2Q] = useState<number>(120); // Clock-to-Q delay
  const [tSetup, setTSetup] = useState<number>(80); // Setup requirement
  const [tHold, setTHold] = useState<number>(50); // Hold requirement
  const [tSkew, setTSkew] = useState<number>(40); // Positive skew = capture arrives later

  // Calculations
  // Setup: Data arrival = tC2Q + tCombo
  // Setup: Data required = tClk + tSkew - tSetup
  // Setup Slack = Data required - Data arrival
  const dataArrivalMax = tC2Q + tCombo;
  const dataRequiredSetup = tClk + tSkew - tSetup;
  const setupSlack = dataRequiredSetup - dataArrivalMax;

  // Hold: Data arrival min = tC2Q(min, assume 70% of tC2Q) + tCombo(min, assume 20% if fast)
  // Hold: Data required = tSkew + tHold
  // Hold Slack = Data arrival min - Data required
  const dataArrivalMin = Math.round(tC2Q * 0.7 + tCombo * 0.15);
  const dataRequiredHold = tSkew + tHold;
  const holdSlack = dataArrivalMin - dataRequiredHold;

  const maxFreqGHz = useMemo(() => {
    const minPeriod = tC2Q + tCombo + tSetup - tSkew;
    return minPeriod > 0 ? (1000 / minPeriod).toFixed(2) : "0.00";
  }, [tC2Q, tCombo, tSetup, tSkew]);

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
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive Static Timing Analysis (STA) Slack Analyzer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Adjust clock frequency, logic path depth, and clock tree skew to observe setup & hold bounds
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded bg-[var(--ln-bg)] border border-[var(--ln-border)] text-xs font-mono">
          Max Operating Frequency: <span className="font-bold text-[var(--ln-accent)]">{maxFreqGHz} GHz</span>
        </div>
      </div>

      {/* Main Grid: Sliders on Left, Live Slack Bars on Right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sliders (Left 6 cols) */}
        <div className="md:col-span-6 space-y-4 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
          <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)]">
            Timing Constraints & Path Delays (ps)
          </div>

          {/* Clock Period Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--ln-text)]">Clock Period (T_clk):</span>
              <span className="font-bold text-[var(--ln-accent)]">{tClk} ps ({(1000 / tClk).toFixed(2)} GHz)</span>
            </div>
            <input
              type="range"
              min="400"
              max="2000"
              step="20"
              value={tClk}
              onChange={(e) => setTClk(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--ln-accent)] cursor-pointer"
            />
          </div>

          {/* Combinational Logic Delay Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--ln-text)]">Combo Cloud Delay (T_combo):</span>
              <span className="font-bold text-amber-400">{tCombo} ps</span>
            </div>
            <input
              type="range"
              min="100"
              max="1500"
              step="25"
              value={tCombo}
              onChange={(e) => setTCombo(parseInt(e.target.value, 10))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Clock Skew Slider */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--ln-text)]">Clock Skew (T_skew):</span>
              <span className={`font-bold ${tSkew >= 0 ? "text-cyan-400" : "text-purple-400"}`}>
                {tSkew >= 0 ? `+${tSkew}` : tSkew} ps
              </span>
            </div>
            <input
              type="range"
              min="-150"
              max="250"
              step="10"
              value={tSkew}
              onChange={(e) => setTSkew(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[var(--ln-muted)]">
              <span>-150 ps (Negative Skew)</span>
              <span>+250 ps (Positive Skew)</span>
            </div>
          </div>

          {/* Setup / Hold Requirements */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[var(--ln-text)]">Clock-to-Q (T_c2q):</span>
              <span className="font-bold">{tC2Q} ps</span>
            </div>
            <input
              type="range"
              min="40"
              max="300"
              step="10"
              value={tC2Q}
              onChange={(e) => setTC2Q(parseInt(e.target.value, 10))}
              className="w-full accent-[var(--ln-accent)] cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[var(--ln-muted)]">
                <span>T_setup</span>
                <span className="font-bold text-[var(--ln-text)]">{tSetup} ps</span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={tSetup}
                onChange={(e) => setTSetup(parseInt(e.target.value, 10))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[var(--ln-muted)]">
                <span>T_hold</span>
                <span className="font-bold text-[var(--ln-text)]">{tHold} ps</span>
              </div>
              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={tHold}
                onChange={(e) => setTHold(parseInt(e.target.value, 10))}
                className="w-full accent-rose-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Live Slack Meters & Verification (Right 6 cols) */}
        <div className="md:col-span-6 space-y-4 p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
            STA Signoff Slack Meters
          </div>

          {/* Setup Slack Card */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                {setupSlack >= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                SETUP SLACK (Max Delay)
              </span>
              <span
                className={`font-black text-sm ${
                  setupSlack >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {setupSlack >= 0 ? `+${setupSlack}` : setupSlack} ps
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  setupSlack >= 0 ? "bg-emerald-400" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (setupSlack + 500) / 10))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Formula: Slack = (T_clk + T_skew - T_setup) - (T_c2q + T_combo)
            </p>
          </div>

          {/* Hold Slack Card */}
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-1.5 font-bold text-slate-300">
                {holdSlack >= 0 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                HOLD SLACK (Min Delay)
              </span>
              <span
                className={`font-black text-sm ${
                  holdSlack >= 0 ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {holdSlack >= 0 ? `+${holdSlack}` : holdSlack} ps
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  holdSlack >= 0 ? "bg-emerald-400" : "bg-rose-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(5, (holdSlack + 200) / 4))}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Formula: Slack = T_arrival(min) - (T_skew + T_hold)
            </p>
          </div>

          {/* Real-world takeaway */}
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            💡 <strong>Silicon Rule:</strong> Positive skew ({"> 0"}) relaxes setup time but tightens
            hold margins. Hold violations are fatal on silicon and cannot be fixed by lowering clock
            frequency!
          </div>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Activity className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Static Timing Analysis (STA) Signoff Guide: Setup vs. Hold
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Setup Constraint */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>1. Setup Slack (Max Delay)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Ensures the slowest data signal arrives before the next clock edge. Formula: <code>Slack = (T_clk + T_skew - T_setup) - (T_c2q + T_combo)</code>. A setup failure can be rescued on the lab bench by <strong>down-clocking (running slower)</strong>.
            </p>
          </div>

          {/* Column 2: Hold Constraint */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>2. Hold Slack (Min Delay)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Ensures newly launched data does not race through fast logic and overwrite the previous cycle's data before it was latched. Notice <code>T_clk</code> is absent from the hold equation: <strong>hold violations are fatal on silicon at any frequency</strong>!
            </p>
          </div>

          {/* Column 3: Clock Skew Tradeoff */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-cyan-400 flex items-center gap-1">
              <span>3. Clock Tree Skew</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Positive Skew (T_skew &gt; 0):</strong> Capture clock arrives later, giving data more time (relaxes setup) but reducing hold margin.<br />
              <strong>Negative Skew (T_skew &lt; 0):</strong> Protects hold margin but robs time from the critical setup path.
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
              <strong>Create a Setup Violation:</strong> Drag <em>Combo Cloud Delay (T_combo)</em> up to 1200 ps. Notice Setup Slack turns negative (RED). Now drag <em>Clock Period (T_clk)</em> to 1600 ps to see setup close cleanly.
            </li>
            <li>
              <strong>Observe Skew Tradeoff:</strong> Increase <em>Clock Skew (T_skew)</em> to +150 ps. Watch Setup Slack turn green while Hold Slack turns red (a hold violation!).
            </li>
            <li>
              <strong>Calculate Max Frequency:</strong> Observe the top badge computing the maximum physical silicon operating frequency (F_max = 1 / T_period,min).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
