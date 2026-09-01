"use client";

import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Play,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  GitBranch,
  Split,
  Maximize2,
  Minimize2,
  Box,
  Wrench,
  Clock,
} from "lucide-react";

export type SynthTab =
  | "tech_mapping"
  | "sdc_cost"
  | "qor_report"
  | "hierarchy_opt"
  | "resource_sharing"
  | "boolean_opt"
  | "retiming"
  | "multi_vth"
  | "phys_synth"
  | "lec_verifier"
  | "eco_spare";

export function SynthesisVisualizer({
  initialTab = "tech_mapping",
}: {
  initialTab?: SynthTab;
}) {
  const [tab, setTab] = useState<SynthTab>(initialTab);

  // --- TAB 1: Technology Mapping Engine ---
  const [circuitType, setCircuitType] = useState<"ALU_ADDER" | "PRIORITY_MUX" | "COMPLEX_AOI">(
    "ALU_ADDER"
  );
  const [synthStage, setSynthStage] = useState<"RTL" | "GTECH" | "MAPPED">("MAPPED");

  const circuitDetails = {
    ALU_ADDER: {
      name: "4-Bit Adder / Subtractor Datapath",
      rtl: `module alu_adder (input [3:0] a, b, input sub, output [3:0] sum, output cout);
  wire [3:0] b_operand = sub ? ~b : b;
  assign {cout, sum} = a + b_operand + sub;
endmodule`,
      gtech: [
        { name: "GTECH_XOR2 (x4)", desc: "Controlled inverter for subtraction" },
        { name: "GTECH_ADD_4B", desc: "Generic 4-bit parallel adder tree" },
      ],
      mapped: [
        { cell: "XOR2_X1", count: 4, area: 12.8, delay: 45 },
        { cell: "FA_X1 (Full Adder)", count: 4, area: 38.4, delay: 110 },
      ],
      totalArea: 51.2,
      critDelay: 155,
    },
    PRIORITY_MUX: {
      name: "4:1 Priority Multiplexer",
      rtl: `module pri_mux (input [3:0] req, input [3:0] d0, d1, d2, d3, output reg [3:0] y);
  always @(*) begin
    if      (req[0]) y = d0;
    else if (req[1]) y = d1;
    else if (req[2]) y = d2;
    else             y = d3;
  end
endmodule`,
      gtech: [
        { name: "GTECH_PRI_ENC", desc: "Generic priority decode chain" },
        { name: "GTECH_MUX4_4B", desc: "Generic 4-to-1 bus multiplexer" },
      ],
      mapped: [
        { cell: "AOI22_X1", count: 4, area: 18.0, delay: 65 },
        { cell: "OAI21_X1", count: 4, area: 14.4, delay: 52 },
        { cell: "INV_X2", count: 2, area: 3.2, delay: 18 },
      ],
      totalArea: 35.6,
      critDelay: 135,
    },
    COMPLEX_AOI: {
      name: "And-Or-Invert (AOI22) Complex Gate",
      rtl: `assign y = ~((a & b) | (c & d));`,
      gtech: [
        { name: "GTECH_AND2 (x2)", desc: "Generic 2-input ANDs" },
        { name: "GTECH_NOR2", desc: "Generic 2-input NOR combiner" },
      ],
      mapped: [
        { cell: "AOI22_X2 (Single Complex Cell)", count: 1, area: 6.4, delay: 38 },
      ],
      totalArea: 6.4,
      critDelay: 38,
    },
  };

  // --- TAB 2: SDC Constraint & Cost Function ---
  const [targetPeriod, setTargetPeriod] = useState<number>(2.0); // ns (500 MHz)
  const [maxTrans, setMaxTrans] = useState<number>(0.15); // ns
  const [inputDelay, setInputDelay] = useState<number>(0.5); // ns

  const calcWns = (targetPeriod - 1.2 - inputDelay - (maxTrans > 0.2 ? 0.3 : 0)).toFixed(2);
  const isTimingMet = parseFloat(calcWns) >= 0;
  const bufferCount = maxTrans <= 0.12 ? 48 : maxTrans <= 0.18 ? 24 : 8;
  const estimatedArea = (240 + bufferCount * 2.2 + (isTimingMet ? 30 : 0)).toFixed(1);

  // --- TAB 3: QoR Report Inspector ---
  const [selectedEndpoint, setSelectedEndpoint] = useState<"reg_alu" | "out_data" | "fsm_state">(
    "reg_alu"
  );
  const endpointDetails = {
    reg_alu: {
      path: "u_core/u_alu/acc_reg -> u_core/u_alu/result_reg",
      launchClk: 0.0,
      c2q: 0.18,
      logicDelay: 1.12,
      netDelay: 0.34,
      setupTime: 0.08,
      requiredTime: 2.0,
      arrival: 1.72,
      slack: "+0.28 ns (MET)",
    },
    out_data: {
      path: "u_core/u_fifo/dout_reg -> data_out_port",
      launchClk: 0.0,
      c2q: 0.19,
      logicDelay: 0.95,
      netDelay: 0.42,
      setupTime: 0.4, // Output delay
      requiredTime: 2.0,
      arrival: 1.96,
      slack: "+0.04 ns (MET)",
    },
    fsm_state: {
      path: "u_core/u_ctrl/state_reg[2] -> u_core/u_alu/opcode_reg[1]",
      launchClk: 0.0,
      c2q: 0.18,
      logicDelay: 1.65,
      netDelay: 0.48,
      setupTime: 0.09,
      requiredTime: 2.0,
      arrival: 2.4,
      slack: "-0.40 ns (VIOLATED ⚠️)",
    },
  };

  // --- TAB 4: Hierarchy & Boundary Optimization ---
  const [ungroupEnabled, setUngroupEnabled] = useState<boolean>(true);

  // --- TAB 5: Datapath Resource Sharing ---
  const [shareAdders, setShareAdders] = useState<boolean>(true);

  // --- TAB 6: Boolean Restructuring & Shannon ---
  const [factoringStyle, setFactoringStyle] = useState<"FLAT_SOP" | "FACTORED" | "SHANNON">(
    "FACTORED"
  );

  // --- TAB 7: Sequential Retiming Simulator ---
  const [retimed, setRetimed] = useState<boolean>(false);
  const stage1Delay = retimed ? 2.6 : 4.2;
  const stage2Delay = retimed ? 2.6 : 1.0;
  const maxDelay = Math.max(stage1Delay, stage2Delay);
  const maxFreq = Math.round(1000 / maxDelay);

  // --- TAB 8: Multi-Vth Leakage Optimizer ---
  const [vthProfile, setVthProfile] = useState<"ALL_LVT" | "BALANCED_RVT" | "OPTIMIZED_MULTI_VTH">(
    "OPTIMIZED_MULTI_VTH"
  );
  const vthStats = {
    ALL_LVT: {
      lvtPct: 100,
      rvtPct: 0,
      hvtPct: 0,
      wns: 0.0,
      leakageMw: 142.5,
      status: "Fastest Speed, Terrible Battery Life (142 mW Leakage)",
    },
    BALANCED_RVT: {
      lvtPct: 0,
      rvtPct: 100,
      hvtPct: 0,
      wns: -0.15,
      leakageMw: 48.0,
      status: "Moderate Speed, Moderate Leakage (48 mW)",
    },
    OPTIMIZED_MULTI_VTH: {
      lvtPct: 12,
      rvtPct: 28,
      hvtPct: 60,
      wns: 0.0,
      leakageMw: 18.2,
      status: "Optimal Signoff: 0ns WNS + 87% Leakage Reduction! (18.2 mW)",
    },
  };

  // --- TAB 9: Physical Topographical Synthesis ---
  const [useDefFloorplan, setUseDefFloorplan] = useState<boolean>(true);

  // --- TAB 10: Logic Equivalence Checking (LEC) ---
  const [lecBugInjected, setLecBugInjected] = useState<boolean>(false);
  const [lecRunning, setLecRunning] = useState<boolean>(false);
  const [lecResult, setLecResult] = useState<"PASSED" | "FAILED" | null>("PASSED");

  const runLec = () => {
    setLecRunning(true);
    setLecResult(null);
    setTimeout(() => {
      setLecRunning(false);
      setLecResult(lecBugInjected ? "FAILED" : "PASSED");
    }, 600);
  };

  // --- TAB 11: Metal-Only Spare Cell ECO ---
  const [ecoPatched, setEcoPatched] = useState<boolean>(false);

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
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--ln-text)]">
              Interactive RTL Synthesis &amp; Compilation Studio
            </h3>
            <p className="text-xs text-[var(--ln-muted)]">
              Explore Technology Mapping, Constraints, Boolean Optimization, Retiming, Multi-Vth, Physical Topographical, and Formal LEC
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-[var(--ln-bg)] p-1 rounded-lg border border-[var(--ln-border)]">
          <button
            type="button"
            onClick={() => setTab("tech_mapping")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "tech_mapping"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Tech Mapping
          </button>
          <button
            type="button"
            onClick={() => setTab("sdc_cost")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "sdc_cost"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            SDC Constraints
          </button>
          <button
            type="button"
            onClick={() => setTab("qor_report")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "qor_report"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            QoR Inspector
          </button>
          <button
            type="button"
            onClick={() => setTab("hierarchy_opt")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "hierarchy_opt"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Boundary Opt
          </button>
          <button
            type="button"
            onClick={() => setTab("resource_sharing")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "resource_sharing"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Resource Sharing
          </button>
          <button
            type="button"
            onClick={() => setTab("boolean_opt")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "boolean_opt"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Boolean &amp; Shannon
          </button>
          <button
            type="button"
            onClick={() => setTab("retiming")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "retiming"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Retiming
          </button>
          <button
            type="button"
            onClick={() => setTab("multi_vth")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "multi_vth"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Multi-Vth
          </button>
          <button
            type="button"
            onClick={() => setTab("phys_synth")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "phys_synth"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Physical DEF
          </button>
          <button
            type="button"
            onClick={() => setTab("lec_verifier")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "lec_verifier"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Formal LEC
          </button>
          <button
            type="button"
            onClick={() => setTab("eco_spare")}
            className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
              tab === "eco_spare"
                ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
            }`}
          >
            Spare ECO
          </button>
        </div>
      </div>

      {/* --- TAB 1: Technology Mapping Engine --- */}
      {tab === "tech_mapping" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--ln-muted)]">Circuit:</span>
              {(["ALU_ADDER", "PRIORITY_MUX", "COMPLEX_AOI"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCircuitType(c)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    circuitType === c
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                      : "bg-slate-900 text-slate-400 hover:text-white"
                  }`}
                >
                  {c.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-[var(--ln-muted)]">Stage:</span>
              {(["RTL", "GTECH", "MAPPED"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSynthStage(st)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    synthStage === st
                      ? "bg-cyan-400 text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-12 gap-4">
            <div className="md:col-span-7 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-cyan-300 font-bold text-sm">
                  {circuitDetails[circuitType].name}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  Stage: {synthStage}
                </span>
              </div>

              {synthStage === "RTL" && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Source Verilog RTL:</div>
                  <pre className="p-3 rounded-lg bg-slate-900 text-emerald-300 text-[11px] leading-relaxed overflow-x-auto border border-slate-800">
                    {circuitDetails[circuitType].rtl}
                  </pre>
                </div>
              )}

              {synthStage === "GTECH" && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Elaborated Generic Logic (GTECH Tree):</div>
                  <div className="space-y-1.5">
                    {circuitDetails[circuitType].gtech.map((g, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <span className="font-bold text-amber-300">{g.name}</span>
                        <span className="text-[10px] text-slate-400">{g.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {synthStage === "MAPPED" && (
                <div className="space-y-2">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Target Standard Cell Mapped Netlist (.lib):</div>
                  <div className="space-y-1.5">
                    {circuitDetails[circuitType].mapped.map((m, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-emerald-300">{m.cell}</span>
                          <span className="text-[10px] text-slate-400 ml-2">x{m.count}</span>
                        </div>
                        <span className="text-[10px] text-slate-300">{m.area} µm² · {m.delay} ps</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-5 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="text-[10px] text-slate-400 uppercase font-bold pb-2 border-b border-slate-800">
                Synthesis Quality of Results (QoR)
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Total Silicon Area:</span>
                  <span className="font-bold text-cyan-400 text-sm">{circuitDetails[circuitType].totalArea} µm²</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Critical Path Delay:</span>
                  <span className="font-bold text-emerald-400 text-sm">{circuitDetails[circuitType].critDelay} ps</span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                  <span className="text-slate-400">Technology Library:</span>
                  <span className="font-bold text-amber-300 text-xs">SkyWater 130nm / FreePDK (.lib)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: SDC Constraint & Cost Function --- */}
      {tab === "sdc_cost" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Clock Period SDC (`create_clock`)</span>
                <span className="text-cyan-400">{targetPeriod} ns ({(1000 / targetPeriod).toFixed(0)} MHz)</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="4.0"
                step="0.2"
                value={targetPeriod}
                onChange={(e) => setTargetPeriod(parseFloat(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Max Transition DRC (`set_max_transition`)</span>
                <span className="text-amber-400">{maxTrans} ns</span>
              </div>
              <input
                type="range"
                min="0.08"
                max="0.30"
                step="0.02"
                value={maxTrans}
                onChange={(e) => setMaxTrans(parseFloat(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Input External Delay (`set_input_delay`)</span>
                <span className="text-emerald-400">{inputDelay} ns</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.1"
                value={inputDelay}
                onChange={(e) => setInputDelay(parseFloat(e.target.value))}
                className="w-full accent-emerald-400"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid md:grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">Worst Negative Slack (WNS):</span>
              <span className={`text-lg font-black ${isTimingMet ? "text-emerald-400" : "text-rose-400"}`}>
                {calcWns} ns {isTimingMet ? "✓ MET" : "❌ VIOLATION"}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">Inserted Slew Buffers:</span>
              <span className="text-lg font-black text-amber-300">{bufferCount} Buffers</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-bold">Total Estimated Gate Area:</span>
              <span className="text-lg font-black text-cyan-300">{estimatedArea} µm²</span>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 3: QoR Report Inspector --- */}
      {tab === "qor_report" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <span className="text-xs font-semibold text-[var(--ln-muted)]">Select Timing Path Endpoint:</span>
            <div className="flex gap-1.5">
              {(["reg_alu", "out_data", "fsm_state"] as const).map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => setSelectedEndpoint(ep)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    selectedEndpoint === ep
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {ep.replace("_", " ").toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between items-center text-slate-300 text-xs pb-2 border-b border-slate-800">
              <span>Path: <code>{endpointDetails[selectedEndpoint].path}</code></span>
              <span className="font-bold text-cyan-400">{endpointDetails[selectedEndpoint].slack}</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Launch Flop (Tc2q):</span>
                <span className="font-bold text-amber-300">{endpointDetails[selectedEndpoint].c2q} ns</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Combo Logic Delay:</span>
                <span className="font-bold text-cyan-300">{endpointDetails[selectedEndpoint].logicDelay} ns</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Interconnect Net Delay:</span>
                <span className="font-bold text-emerald-300">{endpointDetails[selectedEndpoint].netDelay} ns</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Capture Setup (Tsetup):</span>
                <span className="font-bold text-slate-200">{endpointDetails[selectedEndpoint].setupTime} ns</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: Hierarchy & Boundary Optimization --- */}
      {tab === "hierarchy_opt" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div>
              <span className="font-bold text-sm text-[var(--ln-text)]">Cross-Module Boundary Optimization</span>
              <p className="text-[11px] text-[var(--ln-muted)] font-sans">
                Flattening sub-module boundaries allows the synthesizer to propagate constants and eliminate back-to-back inverters.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUngroupEnabled((u) => !u)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ungroupEnabled ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300"
              }`}
            >
              {ungroupEnabled ? "✓ Ungrouping: ENABLED (Flat)" : "Hierarchy: PRESERVED"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Module A &amp; Module B Boundary:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] leading-relaxed text-slate-300">
                {ungroupEnabled ? (
                  <span className="text-emerald-300">
                    ✓ Sub-module ports removed. Redundant inverters merged (`INV_X1` + `INV_X1` = wire). Constant `tie_low=0` propagated across boundaries.
                  </span>
                ) : (
                  <span className="text-amber-300">
                    ⚠️ Module port boundaries locked. Redundant inverters retained on both sides of the hierarchy boundary. Area: +18%.
                  </span>
                )}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Optimization Impact:</span>
              <div className="grid grid-cols-2 gap-2 text-center pt-1">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Gate Count:</span>
                  <span className="font-bold text-cyan-300">{ungroupEnabled ? "112 Gates" : "142 Gates"}</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Critical Path Delay:</span>
                  <span className="font-bold text-emerald-300">{ungroupEnabled ? "1.42 ns" : "1.78 ns"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 5: Datapath Resource Sharing --- */}
      {tab === "resource_sharing" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div>
              <span className="font-bold text-sm text-[var(--ln-text)]">Arithmetic Operator Resource Sharing</span>
              <p className="text-[11px] text-[var(--ln-muted)] font-sans">
                Shares a single 32-bit hardware adder across mutually exclusive conditional branches (`sel ? a+b : a+c`).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShareAdders((s) => !s)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                shareAdders ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300"
              }`}
            >
              {shareAdders ? "✓ Sharing: ENABLED (1 Adder + 1 Mux)" : "Sharing: OFF (2 Adders + 1 Mux)"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Synthesized Hardware Architecture:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[11px] leading-relaxed">
                {shareAdders ? (
                  <div className="text-emerald-300 space-y-1">
                    <div>• 1x 32-Bit MUX2: Selects between operand <code>b</code> and <code>c</code></div>
                    <div>• 1x 32-Bit Han-Carlson Parallel Adder: Computes <code>a + selected_operand</code></div>
                    <div className="text-[10px] text-slate-400">Total Silicon Area: <strong>148 µm²</strong> (-44% reduction!)</div>
                  </div>
                ) : (
                  <div className="text-amber-300 space-y-1">
                    <div>• 2x 32-Bit Full Adders (Duplicate hardware)</div>
                    <div>• 1x 32-Bit Output Mux</div>
                    <div className="text-[10px] text-slate-400">Total Silicon Area: <strong>264 µm²</strong></div>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Verilog Source Code:</span>
              <pre className="p-3 rounded-lg bg-slate-900 text-cyan-300 text-[10px] border border-slate-800">
                {shareAdders
                  ? `// Resource-shared hardware
wire [31:0] op2 = sel ? b : c;
assign y = a + op2;`
                  : `// Unshared duplicate adders
assign y = sel ? (a + b) : (a + c);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 6: Boolean Restructuring & Shannon --- */}
      {tab === "boolean_opt" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <span className="text-xs font-semibold text-[var(--ln-muted)]">Boolean Transformation:</span>
            <div className="flex gap-1.5">
              {(["FLAT_SOP", "FACTORED", "SHANNON"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFactoringStyle(st)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    factoringStyle === st
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="text-[10px] text-slate-400 uppercase font-bold">Expression Representation:</div>
            <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-sm font-bold">
              {factoringStyle === "FLAT_SOP" && <span className="text-amber-300">F = A·C + A·D + B·C + B·D (8 Literals, 4 AND2 + 1 OR4)</span>}
              {factoringStyle === "FACTORED" && <span className="text-emerald-400">F = (A + B) · (C + D) (4 Literals, 2 OR2 + 1 AND2 — 50% Area Saved!)</span>}
              {factoringStyle === "SHANNON" && <span className="text-cyan-300">F = LateA · F(A=1) + ~LateA · F(A=0) (Late arriving signal routed to output MUX)</span>}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 7: Sequential Retiming Simulator --- */}
      {tab === "retiming" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div>
              <span className="font-bold text-sm text-[var(--ln-text)]">Sequential Retiming &amp; Register Balancing</span>
              <p className="text-[11px] text-[var(--ln-muted)] font-sans">
                Moving registers across combinational logic to equalize stage delays and increase maximum operating clock frequency.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRetimed((r) => !r)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                retimed ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {retimed ? "✓ Retiming: ENABLED (Balanced)" : "Retiming: OFF (Unbalanced)"}
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Pipeline Stage 1 (Multiplier Cloud)</span>
                <span className={stage1Delay > 3.0 ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {stage1Delay} ns Delay
                </span>
              </div>
              <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-800 flex">
                <div
                  className={`h-full transition-all duration-300 flex items-center justify-center font-bold text-[10px] ${
                    stage1Delay > 3.0 ? "bg-rose-500 text-slate-950" : "bg-emerald-400 text-slate-950"
                  }`}
                  style={{ width: `${(stage1Delay / 5.0) * 100}%` }}
                >
                  {stage1Delay} ns
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
                <span>Pipeline Stage 2 (Accumulator Cloud)</span>
                <span className="text-emerald-400 font-bold">{stage2Delay} ns Delay</span>
              </div>
              <div className="w-full bg-slate-900 h-6 rounded-lg overflow-hidden border border-slate-800 flex">
                <div
                  className="h-full bg-emerald-400 text-slate-950 transition-all duration-300 flex items-center justify-center font-bold text-[10px]"
                  style={{ width: `${(stage2Delay / 5.0) * 100}%` }}
                >
                  {stage2Delay} ns
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Max Achievable Operating Frequency:</span>
              <div className="text-2xl font-black text-cyan-400">
                {maxFreq} MHz <span className="text-xs text-slate-400">({maxDelay} ns Period)</span>
              </div>
            </div>
            <div
              className={`p-2.5 rounded-lg border text-xs font-bold ${
                retimed ? "bg-emerald-950/60 border-emerald-500 text-emerald-200" : "bg-amber-950/40 border-amber-600 text-amber-200"
              }`}
            >
              {retimed
                ? "🚀 +61% Clock Frequency Boost achieved through register retiming!"
                : "⚠️ Bottlenecked by Stage 1: 4.2ns critical path limits throughput."}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 8: Multi-Vth Leakage Optimizer --- */}
      {tab === "multi_vth" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <span className="text-xs font-semibold text-[var(--ln-muted)]">Select Voltage Threshold Strategy:</span>
            <div className="flex gap-1.5">
              {(["ALL_LVT", "BALANCED_RVT", "OPTIMIZED_MULTI_VTH"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setVthProfile(p)}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    vthProfile === p
                      ? "bg-[var(--ln-accent)] text-slate-950 shadow-sm"
                      : "bg-slate-800 text-slate-300 hover:text-white"
                  }`}
                >
                  {p.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Standard Cell Threshold Voltage Distribution</span>
              <span className="text-cyan-300">
                LVT: {vthStats[vthProfile].lvtPct}% · RVT: {vthStats[vthProfile].rvtPct}% · HVT:{" "}
                {vthStats[vthProfile].hvtPct}%
              </span>
            </div>

            <div className="w-full h-8 rounded-lg overflow-hidden flex border border-slate-800 font-bold text-[10px] text-slate-950">
              {vthStats[vthProfile].lvtPct > 0 && (
                <div
                  className="bg-rose-400 h-full flex items-center justify-center transition-all duration-300"
                  style={{ width: `${vthStats[vthProfile].lvtPct}%` }}
                >
                  LVT ({vthStats[vthProfile].lvtPct}%)
                </div>
              )}
              {vthStats[vthProfile].rvtPct > 0 && (
                <div
                  className="bg-amber-400 h-full flex items-center justify-center transition-all duration-300"
                  style={{ width: `${vthStats[vthProfile].rvtPct}%` }}
                >
                  RVT ({vthStats[vthProfile].rvtPct}%)
                </div>
              )}
              {vthStats[vthProfile].hvtPct > 0 && (
                <div
                  className="bg-emerald-400 h-full flex items-center justify-center transition-all duration-300"
                  style={{ width: `${vthStats[vthProfile].hvtPct}%` }}
                >
                  HVT ({vthStats[vthProfile].hvtPct}%)
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Worst Negative Slack (WNS):</span>
                <span className={`font-bold text-sm ${vthStats[vthProfile].wns < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                  {vthStats[vthProfile].wns} ns
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Static Leakage Power:</span>
                <span className="font-bold text-cyan-400 text-sm">{vthStats[vthProfile].leakageMw} mW</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 9: Physical Topographical Synthesis --- */}
      {tab === "phys_synth" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div>
              <span className="font-bold text-sm text-[var(--ln-text)]">Topographical Physical Synthesis Mode</span>
              <p className="text-[11px] text-[var(--ln-muted)] font-sans">
                Uses floorplan DEF, macro locations, and Steiner route RC extraction instead of inaccurate fanout wire-load models.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setUseDefFloorplan((d) => !d)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                useDefFloorplan ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300"
              }`}
            >
              {useDefFloorplan ? "✓ DEF Mode: ENABLED (Steiner RC)" : "WLM Mode: Flat Fanout Estimate"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Parasitic Estimation Comparison:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Synthesis Mode:</span>
                  <span className="font-bold text-cyan-300">{useDefFloorplan ? "Topographical (DEF Guided)" : "Zero Wire Load / WLM"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Long-distance Bus RC Delay:</span>
                  <span className="font-bold text-amber-300">{useDefFloorplan ? "0.48 ns (Accurate)" : "0.08 ns (Wildly Optimistic!)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Correlation with Signoff STA:</span>
                  <span className={`font-bold ${useDefFloorplan ? "text-emerald-400" : "text-rose-400"}`}>
                    {useDefFloorplan ? "96% Correlation ✓" : "42% Mismatch (P&R Timing Blowup) ❌"}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Floorplan DEF Coordinates:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                DIE_AREA (0 0) (2500 2500) ;<br />
                COMPONENTS 4820 ;<br />
                - u_sram_0 SRAM_1024X32 + PLACED ( 200 1800 ) N ;<br />
                - u_sram_1 SRAM_1024X32 + PLACED ( 1600 1800 ) N ;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 10: Logic Equivalence Checking (LEC) --- */}
      {tab === "lec_verifier" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[var(--ln-muted)]">Scenario:</span>
              <button
                type="button"
                onClick={() => setLecBugInjected((b) => !b)}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  lecBugInjected ? "bg-rose-500 text-slate-950 font-black shadow-sm" : "bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                {lecBugInjected ? "⚠️ Netlist Bug: INJECTED (Inversion Error)" : "Golden Synthesis (Equivalent)"}
              </button>
            </div>
            <button
              type="button"
              onClick={runLec}
              disabled={lecRunning}
              className="px-4 py-1.5 rounded-lg bg-[var(--ln-accent)] text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm hover:brightness-110 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {lecRunning ? "Verifying Formal Equivalence..." : "Run Formality / Conformal LEC"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Formal Solver Verification Status (BDD / SAT Engine)</span>
              <span className="text-cyan-400">Comparing: RTL vs Revised Gate Netlist</span>
            </div>

            <div className="grid sm:grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Compare Points:</span>
                <span className="text-base font-bold text-cyan-300">128 Registers / Ports</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Matched Key-Points:</span>
                <span className="text-base font-bold text-emerald-400">128 (100%)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Non-Equivalent Cones:</span>
                <span className={`text-base font-bold ${lecResult === "FAILED" ? "text-rose-400" : "text-emerald-400"}`}>
                  {lecResult === "FAILED" ? "1 FAILED ❌" : "0 Clean ✓"}
                </span>
              </div>
            </div>

            {lecResult && (
              <div
                className={`p-3 rounded-lg border text-xs font-bold font-sans flex items-center gap-2 ${
                  lecResult === "PASSED"
                    ? "bg-emerald-950/60 border-emerald-500 text-emerald-200"
                    : "bg-rose-950/70 border-rose-500 text-rose-200"
                }`}
              >
                {lecResult === "PASSED" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>[LEC-PASSED] Formal equivalence mathematically proven. Golden RTL matches Revised Netlist.</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>[LEC-FAIL] Non-equivalence detected at net `cout_reg`! Netlist optimization altered functional behavior.</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 11: Metal-Only Spare Cell ECO --- */}
      {tab === "eco_spare" && (
        <div className="space-y-4 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <div>
              <span className="font-bold text-sm text-[var(--ln-text)]">Metal-Only Spare Cell ECO Patching</span>
              <p className="text-[11px] text-[var(--ln-muted)] font-sans">
                Rewires pre-placed uncommitted spare standard cells to patch functional bugs without rebuilding base silicon masks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEcoPatched((e) => !e)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                ecoPatched ? "bg-emerald-500 text-slate-950 shadow-sm" : "bg-slate-800 text-slate-300"
              }`}
            >
              {ecoPatched ? "✓ Spare Gate: CONNECTED (Bug Fixed)" : "Spare Gate: FLOATING (Unused)"}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">ECO Turnaround &amp; Cost Analysis:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mask Layers Modified:</span>
                  <span className="font-bold text-cyan-300">{ecoPatched ? "Metal 4 & 5 Only" : "All 45 Layers (Full Respin)"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Turnaround Time:</span>
                  <span className="font-bold text-emerald-400">{ecoPatched ? "2 Weeks" : "14 Weeks"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fabrication Cost:</span>
                  <span className="font-bold text-amber-300">{ecoPatched ? "$80k (Metal Masks)" : "$3.5M (Full Mask Set)"}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Silicon Floorplan Spare Cell:</span>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                {ecoPatched ? (
                  <span className="text-emerald-300">
                    ECO NETLIST ATTACH:<br />
                    disconnect_net net_broken_inv u_flt/A ;<br />
                    connect_net net_rst_n u_spare_nand42/A ;<br />
                    connect_net net_fixed_out u_spare_nand42/Y ;
                  </span>
                ) : (
                  <span className="text-slate-400">
                    u_spare_nand42 (NAND2_X1) inputs tied to VSS. Output floating. Ready for ECO routing.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Silicon Theory Guide Card */}
      <div className="mt-5 p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-3 font-sans text-xs">
        <div className="flex items-center gap-2 border-b border-[var(--ln-border)] pb-2.5">
          <div className="p-1 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)]">
            📖 RTL Synthesis Reference: Technology Mapping, Retiming &amp; Physical Signoff
          </h4>
        </div>
        <p className="text-[11px] text-[var(--ln-muted)] leading-relaxed">
          Synthesis translates behavioral HDL into optimized, manufacturable gate netlists. SDC timing constraints, sequential retiming, multi-threshold voltage cell swapping, and formal logic equivalence checking (LEC) ensure the design closes timing at maximum frequency while minimizing silicon area and standby leakage.
        </p>
      </div>
    </div>
  );
}
