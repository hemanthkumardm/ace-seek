"use client";

import React, { useMemo, useState } from "react";
import { Zap, ShieldCheck, ShieldAlert, Play, RotateCcw, Cpu, Layers } from "lucide-react";

/**
 * Static-1 Hazard Simulator: F = A·B + A'·C with B = C = 1.
 * When A transitions from 1 -> 0, if the inverter is delayed,
 * both product terms become 0 momentarily, creating a downward glitch (0).
 * Adding the consensus covering term (B·C = 1) eliminates the hazard.
 */
export function HazardGlitchVisualizer() {
  const [a, setA] = useState<0 | 1>(1);
  const [delay, setDelay] = useState<boolean>(true);
  const [hasCoveringTerm, setHasCoveringTerm] = useState<boolean>(false);
  const [timeStep, setTimeStep] = useState<number>(0);

  // Inverter output logic
  const aBar = a === 1 ? 0 : 1;
  const aBarDelayed = delay ? a : aBar;

  const term1 = a & 1; // A · B (B=1)
  const term2 = aBarDelayed & 1; // A' · C (C=1)
  const termCover = hasCoveringTerm ? 1 : 0; // B · C (B=1, C=1)

  const fOut = term1 | term2 | termCover;
  const isGlitching = delay && !hasCoveringTerm && fOut === 0;

  // 24-step timing trace simulation: A falls at t=8, delayed A' rises at t=14
  const samples = useMemo(() => {
    return Array.from({ length: 24 }, (_, t) => {
      const aNow = t < 8 ? 1 : 0;
      const aBarNow = delay ? (t < 14 ? 0 : 1) : aNow === 1 ? 0 : 1;
      const t1 = aNow & 1;
      const t2 = aBarNow & 1;
      const tCover = hasCoveringTerm ? 1 : 0;
      const f = t1 | t2 | tCover;
      return { t, aNow, aBarNow, t1, t2, f };
    });
  }, [delay, hasCoveringTerm]);

  return (
    <div
      className="ln-card p-5 my-6 overflow-hidden rounded-xl"
      style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[var(--ln-border)]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Static-1 Combinational Hazard &amp; Consensus Term Visualizer
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              F = A·B + A′·C (with B=C=1). Inverter propagation delays cause temporary false dips (glitches).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setHasCoveringTerm((v) => !v)}
            className={`ln-btn !py-1 text-xs font-semibold ${
              hasCoveringTerm ? "ln-btn-primary" : ""
            }`}
          >
            {hasCoveringTerm ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            Covering Term (B·C): {hasCoveringTerm ? "ON (Hazard-Free)" : "OFF (Vulnerable)"}
          </button>
        </div>
      </div>

      {/* Interactive Controls Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* Toggle A */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">Input Signal A</span>
            <span className="font-mono font-bold text-xs text-cyan-400">A = {a}</span>
          </div>
          <button
            type="button"
            onClick={() => setA((v) => (v === 1 ? 0 : 1))}
            className="w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all bg-[var(--ln-accent)] text-slate-950 shadow-sm hover:brightness-110"
          >
            Toggle Input A (1 ➔ 0 or 0 ➔ 1)
          </button>
        </div>

        {/* Real Inverter Delay Toggle */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">Inverter Delay (Gate Delay)</span>
            <span className="font-mono font-bold text-xs text-amber-400">
              {delay ? "Real (~2ns Delay)" : "Ideal (0ns)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDelay((d) => !d)}
            className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              delay
                ? "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
                : "bg-emerald-500 text-slate-950 shadow-sm hover:brightness-110"
            }`}
          >
            {delay ? "Inverter Delay: ACTIVE (Real Silicon)" : "Inverter Delay: DISABLED (Zero Delay)"}
          </button>
        </div>

        {/* Silicon Output Status */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">Circuit Output (F)</span>
            <span className="font-mono font-bold text-xs text-emerald-400">Expected: 1</span>
          </div>
          <div
            className={`py-1.5 px-2 rounded-lg text-xs font-bold font-mono text-center flex items-center justify-center gap-1.5 ${
              isGlitching
                ? "bg-rose-950 text-rose-300 border border-rose-600 animate-pulse"
                : "bg-emerald-950 text-emerald-300 border border-emerald-800"
            }`}
          >
            {isGlitching ? "⚠️ GLITCH DETECTED (F = 0)" : "F = 1 (Clean & Stable)"}
          </div>
        </div>
      </div>

      {/* Waveform & Gate Circuit Visualizer */}
      <div className="grid md:grid-cols-12 gap-4">
        {/* Left: Circuit Net Evaluation */}
        <div className="md:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5 font-mono text-xs">
          <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold">
            <span>SOP Datapath Evaluation</span>
            <span className="text-cyan-400">Inputs: B=1, C=1</span>
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Product Term 1 (A · B):</span>
              <span className={term1 === 1 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {a} · 1 = {term1}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Product Term 2 (A′ · C):</span>
              <span className={term2 === 1 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                {aBarDelayed} · 1 = {term2} {delay ? "(delayed A')" : ""}
              </span>
            </div>
            {hasCoveringTerm && (
              <div className="flex justify-between text-cyan-300 font-bold pt-1 border-t border-slate-800">
                <span>Covering Term (B · C):</span>
                <span>1 · 1 = 1 (Glitch Shield ✓)</span>
              </div>
            )}
          </div>

          <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between items-center">
            <span className="text-slate-300 font-bold">OR Gate Output F:</span>
            <span
              className={`font-black text-sm ${
                isGlitching ? "text-rose-400 animate-bounce" : "text-emerald-400"
              }`}
            >
              F = {fOut} {isGlitching ? "⚠️ (STATIC-1 HAZARD!)" : ""}
            </span>
          </div>
        </div>

        {/* Right: Real-time Multi-Trace Digital Oscilloscope */}
        <div className="md:col-span-7 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-[10px]">
          <div className="flex justify-between text-slate-400 uppercase font-bold">
            <span>Transition Waveform (A: 1 ➔ 0 at t=8)</span>
            <span className="text-cyan-400">Static-1 Glitch Timing</span>
          </div>

          <div className="space-y-1.5 pt-1">
            {(["A", "A′", "F"] as const).map((name) => (
              <div key={name} className="flex items-center gap-2">
                <span className="w-6 text-slate-400 font-bold">{name}:</span>
                <div className="flex-1 flex h-5 gap-0.5 bg-slate-900 p-0.5 rounded border border-slate-800">
                  {samples.map((s) => {
                    const v = name === "A" ? s.aNow : name === "A′" ? s.aBarNow : s.f;
                    const isGlitchSample = name === "F" && s.f === 0;

                    return (
                      <div
                        key={s.t}
                        className={`flex-1 rounded-xs transition-all ${
                          isGlitchSample
                            ? "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]"
                            : v === 1
                            ? "bg-emerald-400"
                            : "bg-slate-800 opacity-40"
                        }`}
                        style={{
                          height: v === 1 ? "100%" : "25%",
                          alignSelf: v === 1 ? "stretch" : "flex-end",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-slate-400 text-[10px] pt-1">
            {hasCoveringTerm
              ? "✓ Covering term (B·C) bridges the Karnaugh transition. F stays HIGH continuously."
              : "⚠️ As A falls, term 1 goes LOW before delayed term 2 rises. Both terms are 0 for 6 cycles!"}
          </p>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Combinational Hazards Guide: Static-1 Hazards &amp; Consensus Covering Terms
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Static-1 Hazard Cause */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>1. Why Static-1 Hazards Occur</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              In the Boolean expression F = A·B + A′·C with B=C=1, F should remain 1 when A changes (1 to 0). However, because the inverter takes time to flip A′, both A and A′ are temporarily 0, causing a transient 0 glitch on the output!
            </p>
          </div>

          {/* Column 2: Karnaugh Map Adjacency */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-amber-400 flex items-center gap-1">
              <span>2. K-Map Group Crossing</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              On a Karnaugh map, hazards happen whenever an input transition moves between two adjacent 1-groups that do not overlap. The momentary gap between groups creates the glitch.
            </p>
          </div>

          {/* Column 3: The Consensus Covering Term */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>3. The Consensus Term (B·C)</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              By adding the redundant consensus term B·C (F = A·B + A′·C + B·C), the two K-map groups are bridged together. When B=C=1, B·C holds F=1 during the entire transition, completely eliminating the glitch!
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
              <strong>Observe the Static-1 Glitch:</strong> Ensure <em>Covering Term is OFF</em> and <em>Inverter Delay is ACTIVE</em>. Click <em>"Toggle Input A"</em> to watch output $F$ momentarily dip to 0 (shown as the red glitch region on the oscilloscope).
            </li>
            <li>
              <strong>Fix with Consensus Term:</strong> Click <em>"Covering Term: ON"</em>. Notice that the red glitch vanishes completely and $F$ remains high at all times!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
