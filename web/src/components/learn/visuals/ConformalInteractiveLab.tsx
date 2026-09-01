"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ShieldAlert,
  Terminal,
  FileCode,
  Check,
  Copy,
  ChevronRight,
  ChevronLeft,
  Search,
  Sparkles,
  AlertTriangle,
  Database,
  Sliders,
  Play,
  RotateCcw,
  Calculator,
  GitPullRequest,
  Filter,
  Cpu,
  Layers,
  Scale,
  Binary,
} from "lucide-react";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import {
  CONFORMAL_DOMAINS,
  CONFORMAL_SCENARIOS,
  type ConformalScenario,
} from "@/lib/conformal-scenarios-data";

export function ConformalInteractiveLab({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"crisis_room" | "db_explorer">("crisis_room");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("lec_setup_mapping");
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [resolvedScenarios, setResolvedScenarios] = useState<number[]>([]);
  const [copiedTcl, setCopiedTcl] = useState<boolean>(false);

  // LEC compare points query explorer state
  const [dbCategory, setDbCategory] = useState<string>("compare_points");
  const [filterQuery, setFilterQuery] = useState<string>("");

  const currentScenario: ConformalScenario = useMemo(() => {
    const found = CONFORMAL_SCENARIOS.find((s) => s.id === scenarioId);
    return found || CONFORMAL_SCENARIOS[0];
  }, [scenarioId]);

  const domainScenarios = useMemo(() => {
    return CONFORMAL_SCENARIOS.filter((s) => s.domainId === selectedDomainId);
  }, [selectedDomainId]);

  // Handle Option Submission
  const handleApplyFix = () => {
    if (!selectedOption) return;
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      const chosen = currentScenario.options.find((o) => o.id === selectedOption);
      if (chosen?.correct) {
        setTriageResult({
          ok: true,
          msg: "✓ FORMAL EQUIVALENCE CERTIFIED: Mathematical proof completed in Cadence Conformal LEC engine! 100% compare points verified EQUIVALENT with zero unmapped points.",
        });
        if (!resolvedScenarios.includes(currentScenario.id)) {
          const updated = [...resolvedScenarios, currentScenario.id];
          setResolvedScenarios(updated);
          if (updated.length >= 5 && slug) {
            markSessionComplete(slug);
          }
        }
      } else {
        setTriageResult({
          ok: false,
          msg:
            "✗ INCORRECT FORMAL ACTION: " +
            (chosen?.explanation || "This action fails to establish formal equivalence or generates unmapped compare points."),
        });
      }
    }, 450);
  };

  // Copy TCL Solution
  const handleCopyTcl = () => {
    navigator.clipboard.writeText(currentScenario.remedyTcl);
    setCopiedTcl(true);
    setTimeout(() => setCopiedTcl(false), 2000);
  };

  // Next / Previous Navigation
  const handleNextScenario = () => {
    const currentIndex = domainScenarios.findIndex((s) => s.id === currentScenario.id);
    if (currentIndex < domainScenarios.length - 1) {
      setScenarioId(domainScenarios[currentIndex + 1].id);
      setSelectedOption(null);
      setTriageResult(null);
    }
  };

  const handlePrevScenario = () => {
    const currentIndex = domainScenarios.findIndex((s) => s.id === currentScenario.id);
    if (currentIndex > 0) {
      setScenarioId(domainScenarios[currentIndex - 1].id);
      setSelectedOption(null);
      setTriageResult(null);
    }
  };

  // Cadence Conformal LEC formal verification database dataset
  const DB_CATEGORIES: Record<
    string,
    {
      label: string;
      icon: any;
      queryCmd: string;
      count: number;
      objects: {
        name: string;
        type: string;
        status: "EQUIVALENT" | "NON-EQUIVALENT" | "UNMAPPED" | "INVERTED";
        golden: string;
        revised: string;
        details: Record<string, string | number>;
      }[];
    }
  > = {
    compare_points: {
      label: "compare_points",
      icon: Scale,
      queryCmd: "report_compare_data -class {equivalent non_equivalent} -summary",
      count: 6,
      objects: [
        {
          name: "u_core/u_alu/cla_res_reg[63]",
          type: "DFF (Primary Output Cone)",
          status: "EQUIVALENT",
          golden: "soc_top/u_core/u_alu/cla_res_reg[63]",
          revised: "soc_top/u_core__u_alu__cla_res_reg_63_",
          details: {
            logic_levels: 18,
            sat_solver_time_ms: 1.2,
            support_inputs: 128,
            inverted_phase: "No",
          },
        },
        {
          name: "u_pipe/fsm_state_reg[2]",
          type: "DFF (FSM One-Hot to Binary)",
          status: "EQUIVALENT",
          golden: "soc_top/u_pipe/state_reg[7:0] (One-Hot)",
          revised: "soc_top/u_pipe/state_reg[2:0] (Binary)",
          details: {
            fv_map_rule: "fsm_encoding.map",
            sat_solver_time_ms: 0.8,
            support_inputs: 8,
            inverted_phase: "No",
          },
        },
        {
          name: "u_dma/ctrl_busy_reg",
          type: "DFF (Phase-Inverted Reset)",
          status: "INVERTED",
          golden: "soc_top/u_dma/ctrl_busy_reg (Active-Low)",
          revised: "soc_top/u_dma/ctrl_busy_n_reg (Active-High)",
          details: {
            mapping_method: "set_mapping_method -invert",
            sat_solver_time_ms: 0.4,
            support_inputs: 6,
            inverted_phase: "Yes",
          },
        },
        {
          name: "u_dsp/sat_accum_reg[31]",
          type: "DFF (Datapath Overflow Clamp)",
          status: "EQUIVALENT",
          golden: "soc_top/u_dsp/sat_accum_reg[31]",
          revised: "soc_top/u_dsp/sat_accum_reg[31]",
          details: {
            solver: "Arithmetic Polynomial Engine",
            sat_solver_time_ms: 2.4,
            support_inputs: 64,
            inverted_phase: "No",
          },
        },
        {
          name: "u_mem/sram_512k/CEN",
          type: "BBOX_PIN (Macro Interface)",
          status: "EQUIVALENT",
          golden: "soc_top/u_mem/sram_512k/CEN",
          revised: "soc_top/u_mem/sram_512k/CEN",
          details: {
            macro_type: "SRAM_BLACKBOX",
            sat_solver_time_ms: 0.2,
            support_inputs: 12,
            inverted_phase: "No",
          },
        },
        {
          name: "u_axi/skid_buf_data_reg[31]",
          type: "DFF (Forward Retiming)",
          status: "EQUIVALENT",
          golden: "soc_top/u_axi/skid_buf_data_reg[31]",
          revised: "soc_top/u_axi/skid_stage2_reg[31]",
          details: {
            fv_map_rule: "genus_retiming.map",
            sat_solver_time_ms: 1.5,
            support_inputs: 32,
            inverted_phase: "No",
          },
        },
      ],
    },
    key_points: {
      label: "key_points",
      icon: Binary,
      queryCmd: "report_key_points -summary",
      count: 4,
      objects: [
        {
          name: "Primary Inputs (PI)",
          type: "primary_input",
          status: "EQUIVALENT",
          golden: "184 Inputs",
          revised: "184 Inputs",
          details: {
            mapped_count: 184,
            unmapped_count: 0,
            constraint_applied: "scan_enable=0, test_mode=0",
          },
        },
        {
          name: "Primary Outputs (PO)",
          type: "primary_output",
          status: "EQUIVALENT",
          golden: "256 Outputs",
          revised: "256 Outputs",
          details: {
            mapped_count: 256,
            unmapped_count: 0,
            isolation_verified: "100% UPF Clamped",
          },
        },
        {
          name: "D Flip-Flops & Latches (DFF/DLAT)",
          type: "state_register",
          status: "EQUIVALENT",
          golden: "142,580 Registers",
          revised: "142,580 Registers",
          details: {
            mapped_count: 142580,
            unmapped_count: 0,
            mbff_decomposed: 32400,
            retimed_registers: 128,
          },
        },
        {
          name: "Blackbox Boundary Pins (BBOX)",
          type: "blackbox_pin",
          status: "EQUIVALENT",
          golden: "8 Macro Blocks",
          revised: "8 Macro Blocks",
          details: {
            mapped_pins: 1420,
            unmapped_pins: 0,
            macros: "PLL, ADC, SRAM_512K, PCIE_PHY",
          },
        },
      ],
    },
    unmapped_points: {
      label: "unmapped_points",
      icon: AlertTriangle,
      queryCmd: "report_unmapped_points -summary",
      count: 3,
      objects: [
        {
          name: "u_cfg/unused_feature_reg[15:0]",
          type: "DFF (Constant 0 Pruned)",
          status: "UNMAPPED",
          golden: "16 Registers (Tied to 0)",
          revised: "Tied directly to VSS",
          details: {
            resolution: "set_flatten_model -seq_constant",
            diagnostic_code: "SEQ_CONST_FOLD",
            action: "Automatically folded to constant compare point",
          },
        },
        {
          name: "u_fifo/sr_reg[31:0]",
          type: "DFF (RAM Inferred)",
          status: "UNMAPPED",
          golden: "32 Discrete FFs",
          revised: "1x SRL_MEM_32x8 Inferred RAM",
          details: {
            resolution: "read_library -both ./models/srl_mem.v",
            diagnostic_code: "RAM_INFERENCE",
            action: "Behavioral memory model provided",
          },
        },
        {
          name: "u_spare/spare_gate_inst_0..48",
          type: "SPARE_CELL (Uncommitted)",
          status: "UNMAPPED",
          golden: "0 (Not in RTL)",
          revised: "48 Pre-placed spare cells",
          details: {
            resolution: "read_spare_cells ./pnr/spare_cell_list.txt",
            diagnostic_code: "PRE_PLACED_SPARE",
            action: "Isolated from functional comparison",
          },
        },
      ],
    },
    upf_power_intent: {
      label: "upf_power_intent",
      icon: Layers,
      queryCmd: "verify_power_intent -summary",
      count: 4,
      objects: [
        {
          name: "Level Shifter L2H: PD_CORE (0.65V) -> PD_SOC (0.95V)",
          type: "level_shifter (L2H)",
          status: "EQUIVALENT",
          golden: "UPF Rule LS_CORE_TO_SOC",
          revised: "128x LS_L2H_X4 Instances",
          details: {
            crowbar_check: "PASS (0 mA static current)",
            clamp_type: "Non-inverting buffer",
            power_rails: "VDD_LOW (0.65V) / VDD_HIGH (0.95V)",
          },
        },
        {
          name: "Isolation Cell: PD_CPU (Switched) -> PD_SOC (AON)",
          type: "isolation_cell (ISO_OR)",
          status: "EQUIVALENT",
          golden: "UPF Rule ISO_CPU_RST (Clamp 1)",
          revised: "1x ISO_OR_X2 Instance",
          details: {
            clamp_value: "1 (Active-Low Safe)",
            control_signal: "u_pwr/iso_cpu_en",
            glitch_check: "Glitchless AON Registered",
          },
        },
        {
          name: "Retention Register (SRPG): PD_CPU Shadow Latches",
          type: "state_retention (RET_DFF)",
          status: "EQUIVALENT",
          golden: "UPF Rule RET_CPU_STATE",
          revised: "1,024x RET_DFF_X4 Instances",
          details: {
            save_signal: "u_pwr/save_en",
            restore_signal: "u_pwr/restore_en",
            always_on_rail: "VDD_AON (0.95V)",
          },
        },
        {
          name: "Power Switch Network: 400x MTCMOS Header Chain",
          type: "power_switch",
          status: "EQUIVALENT",
          golden: "UPF Rule SW_CPU_HEADER",
          revised: "400x MTCMOS_HEADER_X16",
          details: {
            daisy_chain_stages: 4,
            inrush_limit_ma: "45 mA / ns",
            virtual_rail: "VDD_VIRTUAL_CPU",
          },
        },
      ],
    },
    eco_change_patches: {
      label: "eco_change_patches",
      icon: Sliders,
      queryCmd: "report_eco_changes -summary",
      count: 4,
      objects: [
        {
          name: "ECO Patch #1: ALU Overflow Flag Logic Bug Fix",
          type: "functional_eco (Gate Replacement)",
          status: "EQUIVALENT",
          golden: "Bug-fixed RTL: u_alu/overflow_detect",
          revised: "Post-route netlist (Patched)",
          details: {
            allocated_spares: "2x NAND2_SPARE_X2, 1x INV_SPARE_X1",
            mask_layers_changed: "Metal 3 & Metal 4 only (BEOL)",
            turnaround_weeks: 2,
            wafer_cost: "$180,000",
          },
        },
        {
          name: "ECO Patch #2: Polarity Inversion Fix on Interrupt Line",
          type: "in_place_cell_swap",
          status: "EQUIVALENT",
          golden: "u_irq/intr_out_n (Active-Low)",
          revised: "Swapped BUFX2 -> INVX2",
          details: {
            placement_displacement: "0.0 um",
            rerouted_wires: 0,
            timing_impact: "-2.1 ps (Faster)",
          },
        },
        {
          name: "ECO Patch #3: Multi-Bit MBFF Clock Gate Split",
          type: "eco_cell_swap",
          status: "EQUIVALENT",
          golden: "u_pipe/reg_a_mbff4_reg[3:0]",
          revised: "Decomposed to 4x DFF_X1",
          details: {
            reason: "Hold Race ECO",
            added_delay_ps: 45.0,
            whitespace_site: "Legal",
          },
        },
        {
          name: "ECO Patch #4: JTAG Test Reset Pin Glitch Filter",
          type: "metal_only_patch",
          status: "EQUIVALENT",
          golden: "u_jtag/trst_glitch_filter",
          revised: "Patched with Spare NOR2 Gates",
          details: {
            allocated_spares: "1x NOR2_SPARE_X4",
            glitch_immunity_ns: "5.0 ns",
            feol_impact: "ZERO (Metal only)",
          },
        },
      ],
    },
  };

  const filteredDbObjects = useMemo(() => {
    const list = DB_CATEGORIES[dbCategory]?.objects || [];
    if (!filterQuery) return list;
    const q = filterQuery.toLowerCase();
    return list.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.type.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [dbCategory, filterQuery]);

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* Studio Header */}
      <div className="p-6 bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-semibold">
              <Scale className="w-3.5 h-3.5" />
              CADENCE CONFORMAL LOGIC EQUIVALENCE CHECKING (LEC) SUITE
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Conformal Logic Equivalence Checking (LEC) Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Master formal boolean verification: Golden vs Revised Netlist Ingestion, Key Point Mapping Heuristics, BDD/SAT Arithmetic Solvers, Low-Power UPF Power State Tables, Scan Bypass Pin Clamping, and Automated Golden Functional ECO Patches.
            </p>
          </div>

          {/* Progress Tracker */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 min-w-[220px] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" />
                Resolved Scenarios:
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {resolvedScenarios.length} / {CONFORMAL_SCENARIOS.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(resolvedScenarios.length / CONFORMAL_SCENARIOS.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono text-right">
              {Math.round((resolvedScenarios.length / CONFORMAL_SCENARIOS.length) * 100)}% Master Formal Score
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("crisis_room")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "crisis_room"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Crisis Diagnostic Room (70 Scenarios)
          </button>
          <button
            onClick={() => setActiveTab("db_explorer")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "db_explorer"
                ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 border border-cyan-400"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Conformal Compare Point & ECO Studio
          </button>

          <Link
            href="/vlsi/learn/c/cadence-pnr/vlsi-calculators"
            className="px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 bg-indigo-950/40 text-indigo-300 hover:text-white hover:bg-indigo-600/40 border border-indigo-500/40 cursor-pointer ml-auto"
          >
            <Calculator className="w-4 h-4 text-indigo-400" />
            Launch VLSI Calculators (34 Sizers)
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CRISIS DIAGNOSTIC ROOM (70 Scenarios Across 7 Domains) */}
      {/* ========================================================================= */}
      {activeTab === "crisis_room" && (
        <div className="p-6 space-y-6">
          {/* 7 Domain Pills */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-cyan-400" />
                Select Formal LEC Domain (7 Distinct Domains):
              </span>
              <span className="text-[11px] font-mono text-slate-400">10 Scenarios Per Domain</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {CONFORMAL_DOMAINS.map((dom) => {
                const isSelected = selectedDomainId === dom.id;
                const domScenarios = CONFORMAL_SCENARIOS.filter((s) => s.domainId === dom.id);
                const resolvedInDom = domScenarios.filter((s) => resolvedScenarios.includes(s.id)).length;

                return (
                  <button
                    key={dom.id}
                    type="button"
                    onClick={() => {
                      setSelectedDomainId(dom.id);
                      setScenarioId(domScenarios[0]?.id || 0);
                      setSelectedOption(null);
                      setTriageResult(null);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/50 border-cyan-500 shadow-md ring-1 ring-cyan-500/40"
                        : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-white truncate">{dom.name}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{dom.tagline}</div>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/60 text-[10px] font-mono">
                      <span>{resolvedInDom}/10 Solved</span>
                      <span className={resolvedInDom === 10 ? "text-emerald-400 font-bold" : "text-slate-500"}>
                        {resolvedInDom === 10 ? "✓ 100%" : `${resolvedInDom * 10}%`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scenario Selector & Header */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-bold">
                  Scenario #{currentScenario.id + 1}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    currentScenario.severity === "CRITICAL"
                      ? "bg-red-500/10 border border-red-500/40 text-red-400"
                      : currentScenario.severity === "HIGH"
                      ? "bg-amber-500/10 border border-amber-500/40 text-amber-400"
                      : "bg-cyan-500/10 border border-cyan-500/40 text-cyan-400"
                  }`}
                >
                  {currentScenario.severity} SEVERITY
                </span>
                <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                  Stage: {currentScenario.stageName}
                </span>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevScenario}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Previous Scenario"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-slate-400">
                  {domainScenarios.findIndex((s) => s.id === currentScenario.id) + 1} / {domainScenarios.length}
                </span>
                <button
                  onClick={handleNextScenario}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
                  title="Next Scenario"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {currentScenario.title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentScenario.symptom}
            </p>
          </div>

          {/* Diagnostic Log & Formal Principle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EDA Simulation Log */}
            <div className="bg-black/90 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-cyan-400">
                  <Terminal className="w-3.5 h-3.5" />
                  CADENCE CONFORMAL LEC OUTPUT
                </span>
                <span className="text-[10px] text-slate-500">IEEE 1801 / UPF / Verilog 2001</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                {currentScenario.logSnippet}
              </pre>
            </div>

            {/* VLSI Physics & Formal Verification Principle */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-bold pb-2 border-b border-slate-800">
                <Sparkles className="w-3.5 h-3.5" />
                BOOLEAN ALGEBRA & FORMAL EQUIVALENCE PRINCIPLE
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {currentScenario.principle}
              </p>

              {/* Before vs After Metric Cards */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-red-950/20 border border-red-900/30 rounded-lg p-2.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase font-bold text-red-400">
                    Pre-Remediation Metrics
                  </div>
                  {currentScenario.beforeMetrics.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{m.label}:</span>
                      <span className="text-red-300 font-bold">{m.val}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-2.5 space-y-1">
                  <div className="text-[10px] font-mono uppercase font-bold text-emerald-400">
                    Post-Remediation Target
                  </div>
                  {currentScenario.afterMetrics.map((m, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400">{m.label}:</span>
                      <span className="text-emerald-300 font-bold">{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Remediation Options */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Select Engineering Action:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Choose the optimal Cadence Conformal LEC formal proof solution
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentScenario.options.map((opt) => {
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSelectedOption(opt.id);
                      setTriageResult(null);
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-cyan-950/50 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/40"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-cyan-600 text-white shadow-sm"
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {opt.id.toUpperCase()}
                    </span>
                    <span className="text-xs leading-relaxed font-sans">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={handleApplyFix}
                disabled={!selectedOption || isOptimizing}
                className={`px-6 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                  !selectedOption || isOptimizing
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-cyan-600 hover:bg-cyan-500 text-white border border-cyan-400 shadow-cyan-600/30"
                }`}
              >
                {isOptimizing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Running Conformal Proof Engine...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Conformal Formal Fix
                  </>
                )}
              </button>

              <button
                onClick={handleCopyTcl}
                className="px-4 py-2 rounded-xl text-xs font-mono bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedTcl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedTcl ? "Copied Golden Tcl!" : "Copy Golden Tcl Solution"}
              </button>
            </div>

            {/* Triage Feedback Banner */}
            {triageResult && (
              <div
                className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
                  triageResult.ok
                    ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                    : "bg-red-950/40 border-red-500/50 text-red-300"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {triageResult.ok ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="font-bold font-mono">
                    {triageResult.ok ? "FORMAL EQUIVALENCE CERTIFIED" : "PROOF FAILED"}
                  </div>
                  <div>{triageResult.msg}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONFORMAL GET_COMPARE_POINTS FORMAL PROOF STUDIO                 */}
      {/* ========================================================================= */}
      {activeTab === "db_explorer" && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                CADENCE CONFORMAL LEC COMPARE POINT STUDIO
              </span>
              <p className="text-xs text-slate-300">
                Explore formal verification compare points, key point mappings, UPF power isolation rules, and automated ECO change patches.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter compare points..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Database Object Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {Object.entries(DB_CATEGORIES).map(([catKey, cat]) => {
              const isSelected = dbCategory === catKey;
              const Icon = cat.icon;
              return (
                <button
                  key={catKey}
                  onClick={() => {
                    setDbCategory(catKey);
                    setFilterQuery("");
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? "bg-cyan-950/50 border-cyan-500 text-white shadow-md ring-1 ring-cyan-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-mono font-bold truncate">{cat.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {cat.count} Objects
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Command Banner */}
          <div className="bg-black/90 border border-slate-800 rounded-xl p-3.5 font-mono text-xs flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="text-emerald-400 font-bold">lec:&#62;</span>
              <span className="text-cyan-300">{DB_CATEGORIES[dbCategory]?.queryCmd}</span>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">Formal LEC Command</span>
          </div>

          {/* Database Objects Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Point Name / Target</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Formal State</th>
                    <th className="px-4 py-3">Golden Cone</th>
                    <th className="px-4 py-3">Revised Cone</th>
                    <th className="px-4 py-3">Proof Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDbObjects.map((obj, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
                        {obj.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{obj.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            obj.status === "EQUIVALENT"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : obj.status === "INVERTED"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : obj.status === "UNMAPPED"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {obj.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{obj.golden}</td>
                      <td className="px-4 py-3 text-cyan-300">{obj.revised}</td>
                      <td className="px-4 py-3 text-slate-300">
                        <div className="flex flex-wrap gap-1.5">
                          {Object.entries(obj.details).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] text-slate-300"
                            >
                              <span className="text-slate-500">{k}:</span> {String(v)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
