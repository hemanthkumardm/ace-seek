"use client";

import React, { useState } from "react";
import {
  Power,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Flame,
  CheckCircle2,
} from "lucide-react";

export function UpfMultiDomainVisualizer() {
  // Power Domain Control States
  const [domainPower, setDomainPower] = useState<"ON" | "OFF">("ON");
  const [isoEnable, setIsoEnable] = useState<boolean>(false);
  const [retentionState, setRetentionState] = useState<"IDLE" | "SAVED" | "RESTORED">("IDLE");
  const [inSignal, setInSignal] = useState<0 | 1>(1);

  // Computed power domain parameters
  const isPowerOff = domainPower === "OFF";
  // If power is off and isolation is NOT enabled, the output is floating (X/Z) -> Crowbar current!
  const hasCrowbarHazard = isPowerOff && !isoEnable;
  // Out signal to Always-On domain
  const clampedValue = 0;
  const outSignal = isPowerOff ? (isoEnable ? clampedValue : "Z (FLOATING)") : inSignal;

  // Power Consumption Metrics
  const dynamicPowerMW = domainPower === "ON" ? 45.2 : 0.0;
  const leakagePowerMW = domainPower === "ON" ? 18.6 : hasCrowbarHazard ? 320.0 : 0.08;
  const totalPowerMW = (dynamicPowerMW + leakagePowerMW).toFixed(2);

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
            <Power className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Architectural Multi-Domain Power & UPF Isolation Engine
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              IEEE 1801 Unified Power Format (UPF): Power Gating, Isolation Cells, Level Shifters &amp; Retention Flops
            </p>
          </div>
        </div>

        {/* Real-time Silicon Power Meter */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] font-mono text-xs">
          <span className="text-[var(--ln-muted)]">Total Power:</span>
          <span
            className={`font-black text-sm ${
              hasCrowbarHazard
                ? "text-rose-400 animate-pulse"
                : isPowerOff
                ? "text-emerald-400"
                : "text-amber-400"
            }`}
          >
            {totalPowerMW} mW
          </span>
          <span className="text-[10px] text-[var(--ln-muted)]">
            ({isPowerOff ? "Leakage: 0.08 mW" : "Dynamic: 45.2 mW"})
          </span>
        </div>
      </div>

      {/* Crowbar Hazard Warning Alert */}
      {hasCrowbarHazard && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-3 animate-pulse shadow-[0_0_25px_rgba(244,63,94,0.4)]">
          <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-rose-300">
              ⚠️ CRITICAL SILICON FAULT: CROWBAR SHORT-CIRCUIT LEAKAGE CURRENT!
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200">
              The switchable power domain <strong>PD_CPU</strong> was powered OFF while the Isolation
              Cell was <strong>DISABLED (iso_en = 0)</strong>. The unpowered floating signal (Z / intermediate voltage)
              is causing both PMOS and NMOS transistors in the receiving Always-On gate to conduct simultaneously,
              drawing massive <strong>crowbar short-circuit current ({"> 300 mW"})</strong> directly from VDD to GND!
            </p>
            <div className="text-[10px] font-mono text-rose-300 font-semibold pt-1">
              🔧 Fix: Assert <code>iso_enable = 1</code> BEFORE asserting <code>pwr_gate_en = 0</code>!
            </div>
          </div>
        </div>
      )}

      {/* Interactive Power Management Unit Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {/* 1. MTCMOS Power Switch Control */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">1. MTCMOS Power Gating</span>
            <span
              className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                domainPower === "ON"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {domainPower === "ON" ? "VDD = 0.8V" : "VDD = 0.0V (OFF)"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDomainPower((p) => (p === "ON" ? "OFF" : "ON"))}
            className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
              domainPower === "ON"
                ? "bg-emerald-500 text-slate-950 shadow-sm hover:brightness-110"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {domainPower === "ON" ? "Power Domain: ACTIVE (ON)" : "Power Domain: GATED (OFF)"}
          </button>
        </div>

        {/* 2. Isolation Cell Control */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">2. Output Isolation (ISO)</span>
            <span
              className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                isoEnable
                  ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                  : "bg-slate-800 text-slate-400"
              }`}
            >
              {isoEnable ? "CLAMPED (0)" : "TRANSPARENT"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsoEnable((v) => !v)}
            className={`w-full py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
              isoEnable
                ? "bg-cyan-400 text-slate-950 shadow-sm hover:brightness-110"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {isoEnable ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
            {isoEnable ? "Isolation: ENABLED (Safe)" : "Isolation: DISABLED"}
          </button>
        </div>

        {/* 3. SRPG State Retention Flop */}
        <div className="p-3.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-[var(--ln-muted)] uppercase">3. Retention (SRPG)</span>
            <span className="font-mono font-black text-xs text-amber-400">{retentionState}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setRetentionState("SAVED")}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
                retentionState === "SAVED"
                  ? "bg-amber-400 text-slate-950 shadow-sm hover:brightness-110"
                  : "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white"
              }`}
            >
              Save State
            </button>
            <button
              type="button"
              onClick={() => setRetentionState("RESTORED")}
              disabled={domainPower === "OFF"}
              className="flex-1 py-1.5 rounded-lg text-xs font-bold font-mono bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white disabled:opacity-40"
            >
              Restore State
            </button>
          </div>
        </div>
      </div>

      {/* Multi-Domain Architecture Diagram */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span className="font-bold text-white flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[var(--ln-accent)]" />
            MULTI-VOLTAGE &amp; MULTI-POWER DOMAIN SILICON FLOORPLAN
          </span>
          <span className="text-[10px] text-cyan-400">UPF 3.0 Standard Model</span>
        </div>

        {/* 3 Domain Boxes Connected by Level Shifter & Isolation Cell */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Domain 1: Switchable Core Domain (PD_CPU) */}
          <div
            className={`md:col-span-4 p-3.5 rounded-xl border transition-all duration-300 relative ${
              domainPower === "ON"
                ? "border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                : "border-slate-800 bg-slate-900/40 opacity-70"
            }`}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-emerald-400">PD_CPU (Switchable)</span>
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                  domainPower === "ON"
                    ? "bg-emerald-950 text-emerald-300"
                    : "bg-rose-950 text-rose-400"
                }`}
              >
                {domainPower === "ON" ? "VDD = 0.8V" : "0.0V (SLEEP)"}
              </span>
            </div>

            {/* Internal Core Flip-Flop & Input */}
            <div className="mt-3 space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Input Data:</span>
                <button
                  type="button"
                  onClick={() => setInSignal(inSignal === 1 ? 0 : 1)}
                  disabled={domainPower === "OFF"}
                  className="px-2 py-0.5 rounded bg-[var(--ln-accent)] text-slate-950 font-bold"
                >
                  Toggle D: {inSignal}
                </button>
              </div>

              <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-slate-400">SRPG Retention Flop:</span>
                <span className="font-bold text-amber-400">
                  {retentionState === "SAVED" ? "Shadow Latch: 1 (Saved)" : `Active Q: ${domainPower === "ON" ? inSignal : "0"}`}
                </span>
              </div>
            </div>
          </div>

          {/* Interface Bridge: Isolation Cell & Level Shifter */}
          <div className="md:col-span-4 p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 font-mono text-xs">
            <div className="text-[10px] text-center font-bold uppercase text-slate-400">
              UPF Isolation &amp; Level Shifter Bridge
            </div>

            {/* Isolation Cell Component */}
            <div
              className={`p-2 rounded border transition-all ${
                hasCrowbarHazard
                  ? "border-rose-500 bg-rose-950/60 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.4)]"
                  : isoEnable
                  ? "border-cyan-500 bg-cyan-950/40 text-cyan-300"
                  : "border-slate-700 bg-slate-800 text-slate-300"
              }`}
            >
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-bold">ISOLATION CELL (ISO)</span>
                <span>Clamp: 0</span>
              </div>
              <div className="text-xs font-bold mt-1 flex justify-between">
                <span>Output to AON:</span>
                <span
                  className={
                    hasCrowbarHazard
                      ? "text-rose-400 font-black animate-bounce"
                      : "text-emerald-400"
                  }
                >
                  {outSignal}
                </span>
              </div>
            </div>

            {/* Level Shifter Component */}
            <div className="p-2 rounded border border-slate-700 bg-slate-800/80 text-[10px] flex items-center justify-between">
              <span className="text-slate-400">LEVEL SHIFTER (LS):</span>
              <span className="text-purple-400 font-bold">0.8V ➔ 1.1V Shifted</span>
            </div>
          </div>

          {/* Domain 2: Always-On Domain (PD_AON) */}
          <div className="md:col-span-4 p-3.5 rounded-xl border border-cyan-500/50 bg-cyan-950/20 space-y-3 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-cyan-400">PD_AON (Always-On)</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold">
                VDD_AON = 1.1V
              </span>
            </div>

            <div className="space-y-2">
              <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                <span className="text-slate-400">PMU / RTC Logic:</span>
                <span className="text-emerald-400 font-bold">ACTIVE (1.1V)</span>
              </div>

              <div
                className={`p-2 rounded border flex justify-between ${
                  hasCrowbarHazard
                    ? "border-rose-500 bg-rose-950 text-rose-300 font-bold"
                    : "border-slate-800 bg-slate-900 text-slate-300"
                }`}
              >
                <span className="text-[10px]">Receiver Gate:</span>
                <span className="text-[10px]">
                  {hasCrowbarHazard ? "CROWBAR ACTIVE 🔥" : "Safe Valid Input"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* IEEE 1801 UPF 3.0 Architecture Script Readout */}
        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-xs font-mono">
          <div className="text-[10px] text-slate-400 font-bold uppercase">
            Generated IEEE 1801 UPF 3.0 Constraint Specification:
          </div>
          <pre className="text-[11px] text-cyan-300 overflow-x-auto">
            {`create_power_domain PD_TOP  -include_scope
create_power_domain PD_CPU  -elements {u_core}
create_power_switch pwr_sw  -domain PD_CPU -control_port {pwr_gate_en}
set_isolation       iso_out -domain PD_CPU -clamp_value 0 -applies_to outputs
set_level_shifter   ls_up   -domain PD_CPU -applies_to outputs -rule low_to_high
set_retention       ret_ff  -domain PD_CPU -save_signal {save posedge} -restore_signal {restore posedge}`}
          </pre>
        </div>
      </div>

      {/* Comprehensive Visual Guide & Silicon Theory Explanation */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-4">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 Silicon Architectural Guide: How Multi-Domain UPF Works
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed">
          {/* Column 1: Power Gating & MTCMOS */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-emerald-400 flex items-center gap-1">
              <span>1. MTCMOS Power Gating</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              Modern processors use high-threshold (HVT) header/footer sleep transistors to physically disconnect power (VDD to 0.0V) from inactive CPU cores, cutting subthreshold static leakage power by <strong>over 99%</strong> during standby.
            </p>
          </div>

          {/* Column 2: Crowbar Current & Isolation */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-rose-400 flex items-center gap-1">
              <span>2. The Crowbar Current Hazard</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              When a power domain shuts down, its output wires float (Z). If fed directly into an active Always-On domain without an <strong>Isolation Cell (ISO)</strong>, the floating voltage turns both PMOS and NMOS transistors ON simultaneously, creating a destructive direct short to GND!
            </p>
          </div>

          {/* Column 3: Level Shifters & Retention */}
          <div className="space-y-1.5 p-3 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
            <div className="font-bold text-purple-400 flex items-center gap-1">
              <span>3. Level Shifting &amp; SRPG</span>
            </div>
            <p className="text-[11px] text-[var(--ln-muted)]">
              <strong>Level Shifters (LS)</strong> translate signals between voltage domains (0.8V to 1.1V). <strong>State Retention (SRPG) Flops</strong> store architectural state in small balloon latches before power-down so the CPU can wake up instantly without cold-boot overhead.
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
              <strong>Trigger Crowbar Current:</strong> Click <em>"Power Domain: ACTIVE"</em> to power off the domain while leaving Isolation DISABLED. Watch the total power spike to <strong>320 mW</strong>!
            </li>
            <li>
              <strong>Eliminate Leakage:</strong> Click <em>"Isolation: ENABLED"</em> to activate the clamping cell. Notice total power instantly drops to <strong>0.08 mW</strong>.
            </li>
            <li>
              <strong>Save/Restore Registers:</strong> Click <em>"Save State"</em>, power cycle the domain, then click <em>"Restore State"</em> to resume data.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
