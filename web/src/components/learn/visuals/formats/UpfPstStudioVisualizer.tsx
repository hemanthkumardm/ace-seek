"use client";

import React, { useState } from "react";
import {
  Power,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Flame,
  FileCode,
} from "lucide-react";

export type PowerStateId =
  | "ALL_ON"
  | "CPU_ACTIVE_GPU_SLEEP"
  | "CPU_SLEEP_GPU_ACTIVE"
  | "DEEP_SLEEP_RETENTION"
  | "FULL_SHUTDOWN"
  | "ILLEGAL_CROWBAR_COMBO";

export function UpfPstStudioVisualizer() {
  const [activeState, setActiveState] = useState<PowerStateId>("ALL_ON");
  const [isoEn, setIsoEn] = useState<boolean>(true);
  const [retentionSaved, setRetentionSaved] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"SIMULATOR" | "PST_TABLE" | "CLP_LINT" | "UPF_SCRIPT">("SIMULATOR");

  // State configurations
  const isCpuOn = activeState === "ALL_ON" || activeState === "CPU_ACTIVE_GPU_SLEEP";
  const isGpuOn = activeState === "ALL_ON" || activeState === "CPU_SLEEP_GPU_ACTIVE";
  const isTopOn = activeState !== "FULL_SHUTDOWN";

  // Force crowbar bug in illegal mode
  const effectiveIso = activeState === "ILLEGAL_CROWBAR_COMBO" ? false : isoEn;
  const hasCrowbar = !isCpuOn && isTopOn && !effectiveIso;

  // Calculated power metrics
  const dynamicPower = (isTopOn ? 12.5 : 0) + (isCpuOn ? 48.0 : 0) + (isGpuOn ? 85.0 : 0);
  const baseLeakage = (isTopOn ? 2.1 : 0) + (isCpuOn ? 8.4 : 0.05) + (isGpuOn ? 14.2 : 0.08);
  const leakagePower = hasCrowbar ? 420.0 : baseLeakage;
  const totalPower = (dynamicPower + leakagePower).toFixed(2);

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
            <Power className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Unified Power Format (UPF / IEEE 1801) &amp; Power State Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Multi-Domain Power Gating, Isolation Clamps, Level Shifters, Power State Tables (PST) &amp; CLP Linting
            </p>
          </div>
        </div>

        {/* Real-time Power Meter */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] font-mono text-xs">
          <span className="text-[var(--ln-muted)]">Total SoC Power:</span>
          <span
            className={`font-black text-sm ${
              hasCrowbar
                ? "text-rose-400 animate-pulse"
                : isCpuOn && isGpuOn
                ? "text-amber-400"
                : "text-emerald-400"
            }`}
          >
            {totalPower} mW
          </span>
          <span className="text-[10px] text-[var(--ln-muted)]">
            ({dynamicPower.toFixed(1)} mW Dyn / {leakagePower.toFixed(2)} mW Leak)
          </span>
        </div>
      </div>

      {/* Crowbar Hazard Banner */}
      {hasCrowbar && (
        <div className="mb-4 p-3.5 rounded-xl bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs flex items-start gap-3 animate-pulse shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <Flame className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-bold text-sm text-rose-300">
              FATAL SILICON VIOLATION: CROWBAR SHORT-CIRCUIT CURRENT DETECTED!
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200">
              Domain <strong>PD_CPU</strong> is OFF (VDD=0V) while driving the live Always-On domain <strong>PD_TOP</strong> with <strong>Isolation DISABLED</strong>.
              The floating unpowered net hovers at an indeterminate intermediate voltage, turning on both PMOS and NMOS transistors in the receiver gate simultaneously and burning <strong>420 mW</strong> of crowbar current!
            </p>
            <div className="text-[10px] font-mono text-rose-300 font-bold">
              Fix: Assert `set_isolation iso_cpu -domain PD_CPU -clamp_value 0 -applies_to outputs` with `iso_en = 1`.
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[var(--ln-border)] font-mono text-xs">
        <div className="flex items-center gap-1.5 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          {[
            { id: "SIMULATOR", label: "Multi-Domain Circuit" },
            { id: "PST_TABLE", label: "Power State Table (PST)" },
            { id: "CLP_LINT", label: "CLP Static Lint" },
            { id: "UPF_SCRIPT", label: "IEEE 1801 UPF Code" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1 rounded font-bold transition-all ${
                activeTab === t.id
                  ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* State Quick Selector */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--ln-muted)] text-[10px] uppercase font-bold">Active SoC State:</span>
          <select
            value={activeState}
            onChange={(e) => setActiveState(e.target.value as PowerStateId)}
            className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-mono font-bold outline-none cursor-pointer"
          >
            <option value="ALL_ON">1. ALL_ON (Mission Mode)</option>
            <option value="CPU_ACTIVE_GPU_SLEEP">2. CPU_ACTIVE_GPU_SLEEP (Audio/Text)</option>
            <option value="CPU_SLEEP_GPU_ACTIVE">3. CPU_SLEEP_GPU_ACTIVE (Display Stream)</option>
            <option value="DEEP_SLEEP_RETENTION">4. DEEP_SLEEP_RETENTION (Standby)</option>
            <option value="FULL_SHUTDOWN">5. FULL_SHUTDOWN (Power Down)</option>
            <option value="ILLEGAL_CROWBAR_COMBO">⚠️ 6. ILLEGAL_CROWBAR (Missing ISO Bug)</option>
          </select>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "SIMULATOR" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Domain PD_CPU Header Switch</span>
                <span className={isCpuOn ? "text-emerald-400" : "text-rose-400"}>
                  {isCpuOn ? "CLOSED (1.2V)" : "OPEN (0.0V)"}
                </span>
              </div>
              <div className="text-[10px] text-slate-300">
                MTCMOS High-Vth PMOS sleep transistors cutting supply to 500k gates.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>Output Isolation Cell (`iso_en`)</span>
                <button
                  type="button"
                  onClick={() => setIsoEn(!isoEn)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    effectiveIso ? "bg-cyan-500 text-slate-950" : "bg-rose-500 text-white"
                  }`}
                >
                  {effectiveIso ? "CLAMPED (0)" : "DISABLED"}
                </button>
              </div>
              <div className="text-[10px] text-slate-300">
                Clamps floating unpowered output to logic 0 when domain powers down.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                <span>SRPG Retention State</span>
                <button
                  type="button"
                  onClick={() => setRetentionSaved(!retentionSaved)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    retentionSaved ? "bg-amber-400 text-slate-950" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {retentionSaved ? "SAVED (Shadow Latch)" : "LOST"}
                </button>
              </div>
              <div className="text-[10px] text-slate-300">
                Always-on balloon latch preserving critical PC and status registers.
              </div>
            </div>
          </div>

          {/* Silicon Domain Circuit Map */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono text-xs">
            <div className="text-cyan-300 font-bold flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                Physical Multi-Voltage &amp; Power-Gated Floorplan
              </span>
              <span className="text-[10px] text-slate-400">SkyWater 130nm / IEEE 1801 UPF Model</span>
            </div>

            {/* 3 Domain Visual Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Domain 1: PD_TOP (Always-On @ 1.8V) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isTopOn
                    ? "border-sky-500/60 bg-sky-950/20 shadow-[0_0_15px_rgba(14,165,233,0.15)]"
                    : "border-slate-800 bg-slate-900/40 opacity-50"
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-sky-900/50">
                  <span className="font-bold text-sky-400">PD_TOP (Always-On)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-950 text-sky-300 border border-sky-800 font-bold">
                    {isTopOn ? "VDD = 1.80V" : "OFF (0.0V)"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Power Management Unit (PMU):</div>
                    <div className="text-white font-bold">State Controller: {activeState}</div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Receiver Gate Input:</div>
                    <div
                      className={`font-bold ${
                        hasCrowbar
                          ? "text-rose-400 animate-pulse font-black"
                          : isCpuOn
                          ? "text-emerald-400"
                          : "text-cyan-300"
                      }`}
                    >
                      {hasCrowbar
                        ? "FLOATING (Z / CROWBAR!)"
                        : isCpuOn
                        ? "1.8V (Translated from 1.2V)"
                        : "CLAMPED 0 (Safe Idle)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain 2: PD_CPU (Switchable Core @ 1.2V) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isCpuOn
                    ? "border-emerald-500/60 bg-emerald-950/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                    : "border-slate-800 bg-slate-900/40 opacity-60"
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-emerald-900/50">
                  <span className="font-bold text-emerald-400">PD_CPU (Switchable)</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isCpuOn
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {isCpuOn ? "VDD = 1.20V (ON)" : "OFF (0.0V SLEEP)"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">MTCMOS Header Switch:</div>
                    <div className={isCpuOn ? "text-emerald-300" : "text-rose-400"}>
                      {isCpuOn ? "Sleep FET: Conducting" : "Sleep FET: Cutoff (0V)"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Output Isolation &amp; Level Shifter:</div>
                    <div className={effectiveIso ? "text-cyan-300" : "text-rose-400"}>
                      {isCpuOn
                        ? "LS: 1.2V -> 1.8V Active"
                        : effectiveIso
                        ? "ISO: Clamped to VSS (0)"
                        : "ISO: Inactive (Floating Net!)"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Domain 3: PD_GPU (Low-Voltage @ 0.8V) */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  isGpuOn
                    ? "border-indigo-500/60 bg-indigo-950/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
                    : "border-slate-800 bg-slate-900/40 opacity-60"
                }`}
              >
                <div className="flex justify-between items-center pb-2 border-b border-indigo-900/50">
                  <span className="font-bold text-indigo-400">PD_GPU (Low-Voltage)</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isGpuOn
                        ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                        : "bg-rose-950 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {isGpuOn ? "VDD = 0.80V (ON)" : "OFF (0.0V SLEEP)"}
                  </span>
                </div>
                <div className="mt-3 space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Compute Cluster:</div>
                    <div className={isGpuOn ? "text-indigo-300 font-bold" : "text-slate-500"}>
                      {isGpuOn ? "Vector SIMD Running" : "Power Gated (0 Dynamic Power)"}
                    </div>
                  </div>
                  <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Level Shifter Strategy:</div>
                    <div className="text-indigo-300">0.8V &lt;-&gt; 1.8V Bi-directional</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PST Table Tab */}
      {activeTab === "PST_TABLE" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-cyan-300 font-bold pb-2 border-b border-slate-800">
            Power State Table (PST) Definition Matrix — `pst_soc`
          </div>
          <p className="text-slate-400 text-[11px]">
            The PST defines all legally permitted combinations of power domain voltages. If software or PMU enters an undeclared combination, CLP static verification flags an immediate fatal violation.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/60">
                  <th className="p-2.5">State Name</th>
                  <th className="p-2.5">PD_TOP Supply</th>
                  <th className="p-2.5">PD_CPU Supply</th>
                  <th className="p-2.5">PD_GPU Supply</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr className={activeState === "ALL_ON" ? "bg-cyan-950/40 text-cyan-300 font-bold" : "text-slate-300"}>
                  <td className="p-2.5">ALL_ON</td>
                  <td className="p-2.5">ON (1.8V)</td>
                  <td className="p-2.5">ON (1.2V)</td>
                  <td className="p-2.5">ON (0.8V)</td>
                  <td className="p-2.5 text-emerald-400">LEGAL (Active Mission)</td>
                </tr>
                <tr className={activeState === "CPU_ACTIVE_GPU_SLEEP" ? "bg-cyan-950/40 text-cyan-300 font-bold" : "text-slate-300"}>
                  <td className="p-2.5">CPU_ACTIVE_GPU_SLEEP</td>
                  <td className="p-2.5">ON (1.8V)</td>
                  <td className="p-2.5">ON (1.2V)</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5 text-emerald-400">LEGAL (GPU Isolated)</td>
                </tr>
                <tr className={activeState === "CPU_SLEEP_GPU_ACTIVE" ? "bg-cyan-950/40 text-cyan-300 font-bold" : "text-slate-300"}>
                  <td className="p-2.5">CPU_SLEEP_GPU_ACTIVE</td>
                  <td className="p-2.5">ON (1.8V)</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5">ON (0.8V)</td>
                  <td className="p-2.5 text-emerald-400">LEGAL (CPU Isolated)</td>
                </tr>
                <tr className={activeState === "DEEP_SLEEP_RETENTION" ? "bg-cyan-950/40 text-cyan-300 font-bold" : "text-slate-300"}>
                  <td className="p-2.5">DEEP_SLEEP_RETENTION</td>
                  <td className="p-2.5">ON (1.8V)</td>
                  <td className="p-2.5">OFF (SRPG Saved)</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5 text-emerald-400">LEGAL (Ultra-Low Leakage)</td>
                </tr>
                <tr className={activeState === "FULL_SHUTDOWN" ? "bg-cyan-950/40 text-cyan-300 font-bold" : "text-slate-300"}>
                  <td className="p-2.5">FULL_SHUTDOWN</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5">OFF (0.0V)</td>
                  <td className="p-2.5 text-amber-400">LEGAL (Battery Unplugged)</td>
                </tr>
                <tr className={activeState === "ILLEGAL_CROWBAR_COMBO" ? "bg-rose-950/40 text-rose-300 font-bold" : "text-slate-500"}>
                  <td className="p-2.5">ILLEGAL_CROWBAR_COMBO</td>
                  <td className="p-2.5">ON (1.8V)</td>
                  <td className="p-2.5">OFF (ISO=0)</td>
                  <td className="p-2.5">ON (0.8V)</td>
                  <td className="p-2.5 text-rose-400 font-bold">ILLEGAL (Missing Isolation)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CLP Lint Tab */}
      {activeTab === "CLP_LINT" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-cyan-300 font-bold pb-2 border-b border-slate-800">
            Conformal Low Power (CLP) / VC LP Static Rule Verification
          </div>

          <div className="space-y-2">
            <div className={`p-3 rounded-lg border flex items-start gap-3 ${
              hasCrowbar ? "bg-rose-950/40 border-rose-800 text-rose-300" : "bg-slate-900 border-slate-800 text-emerald-400"
            }`}>
              {hasCrowbar ? <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> : <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              <div>
                <div className="font-bold">Rule LP_ISO_01: Output Boundary Isolation on Switchable Domains</div>
                <div className="text-[11px] text-slate-300">
                  {hasCrowbar
                    ? "FAIL: PD_CPU output port 'cpu_data_out' is driven by a powered-off domain without active isolation clamping to PD_TOP."
                    : "PASS: All output ports from switchable domains (PD_CPU, PD_GPU) have verified isolation strategies with clamp_value=0."}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-slate-900 border-slate-800 text-emerald-400 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Rule LP_LS_01: Level Shifter on Cross-Voltage Domain Boundaries</div>
                <div className="text-[11px] text-slate-300">
                  PASS: Crossings from 0.8V (PD_GPU) to 1.8V (PD_TOP) and 1.2V (PD_CPU) have verified level shifters (sky130_fd_sc_hd__lsbufhv2lv_1).
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg border bg-slate-900 border-slate-800 text-emerald-400 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Rule LP_PST_01: Power State Table Completeness &amp; Transition Legality</div>
                <div className="text-[11px] text-slate-300">
                  PASS: Power state table `pst_soc` covers all 5 operational mission and standby states with valid supply voltage vectors.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* UPF Script Tab */}
      {activeTab === "UPF_SCRIPT" && (
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-cyan-300 font-bold flex items-center gap-2">
              <FileCode className="w-4 h-4 text-cyan-400" />
              Synthesizable IEEE 1801 UPF 3.0 Specification: `soc_power.upf`
            </span>
          </div>

          <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 text-xs overflow-x-auto leading-relaxed">
{`# Unified Power Format (IEEE 1801 UPF 3.0) Specification
upf_version 3.0

# 1. Create Power Domains
create_power_domain PD_TOP   -include_scope
create_power_domain PD_CPU   -elements {u_cpu_cluster}
create_power_domain PD_GPU   -elements {u_gpu_cluster}

# 2. Create Supply Ports & Nets
create_supply_port VDD_AON   -direction in
create_supply_port VSS       -direction in
create_supply_net  VDD_AON   -domain PD_TOP
create_supply_net  VSS       -domain PD_TOP -reuse

create_supply_net  VDD_CPU   -domain PD_CPU
create_supply_net  VDD_GPU   -domain PD_GPU

# 3. Create MTCMOS Power Switches
create_power_switch pwr_sw_cpu \\
  -domain PD_CPU \\
  -clamp_state ON  -clamp_value 1 \\
  -control_port {pwr_gate_cpu_n u_pmu/pwr_gate_cpu_n} \\
  -input_supply_port {in VDD_AON} \\
  -output_supply_port {out VDD_CPU}

# 4. Isolation Strategy (Prevents Crowbar Current)
set_isolation iso_cpu_out \\
  -domain PD_CPU \\
  -clamp_value 0 \\
  -applies_to outputs \\
  -isolation_signal u_pmu/iso_cpu_en \\
  -isolation_sense high \\
  -location parent

# 5. Level Shifter Strategy (1.2V / 0.8V <-> 1.8V)
set_level_shifter ls_cpu_to_top \\
  -domain PD_CPU \\
  -applies_to outputs \\
  -rule both \\
  -location parent

# 6. State Retention Power Gating (SRPG)
set_retention ret_cpu \\
  -domain PD_CPU \\
  -retention_power_net VDD_AON \\
  -retention_ground_net VSS \\
  -save_signal    {u_pmu/ret_save_n low} \\
  -restore_signal {u_pmu/ret_restore_n low}

# 7. Power State Table (PST) Definition
create_pst pst_soc -supplies {VDD_AON VDD_CPU VDD_GPU}
add_pst_state ALL_ON               -pst pst_soc -state {1.80 1.20 0.80}
add_pst_state CPU_ACTIVE_GPU_SLEEP -pst pst_soc -state {1.80 1.20 OFF}
add_pst_state CPU_SLEEP_GPU_ACTIVE -pst pst_soc -state {1.80 OFF  0.80}
add_pst_state DEEP_SLEEP_RETENTION -pst pst_soc -state {1.80 OFF  OFF}
add_pst_state FULL_SHUTDOWN        -pst pst_soc -state {OFF  OFF  OFF}`}
          </pre>
        </div>
      )}
    </div>
  );
}
