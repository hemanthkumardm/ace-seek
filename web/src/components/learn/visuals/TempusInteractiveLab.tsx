"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Activity,
  Zap,
  ShieldAlert,
  Clock,
  Waves,
  Cpu,
  Layers,
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
} from "lucide-react";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import {
  TEMPUS_DOMAINS,
  TEMPUS_SCENARIOS,
  type TempusScenario,
} from "@/lib/tempus-scenarios-data";

export function TempusInteractiveLab({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"crisis_room" | "db_explorer">("crisis_room");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("setup_max_delay");
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [resolvedScenarios, setResolvedScenarios] = useState<number[]>([]);
  const [copiedTcl, setCopiedTcl] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // get_db Common UI Explorer state
  const [dbCategory, setDbCategory] = useState<string>("timing_paths");
  const [filterQuery, setFilterQuery] = useState<string>("");
  const [selectedAttribute, setSelectedAttribute] = useState<string>("all");

  const currentScenario: TempusScenario = useMemo(() => {
    const found = TEMPUS_SCENARIOS.find((s) => s.id === scenarioId);
    return found || TEMPUS_SCENARIOS[0];
  }, [scenarioId]);

  const domainScenarios = useMemo(() => {
    return TEMPUS_SCENARIOS.filter((s) => s.domainId === selectedDomainId);
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
          msg: "✓ CRITICAL TIMING VIOLATION RESOLVED: Remediation verified in Cadence Tempus STA engine! All timing paths, SI noise limits, and statistical POCV bounds verified clean.",
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
            "✗ INCORRECT ENGINEERING ACTION: " +
            (chosen?.explanation || "This solution fails to satisfy static timing constraints or introduces fatal hold/setup races."),
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

  // Cadence Tempus get_db pure database dataset
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
        slack_ps: number;
        view: string;
        clock: string;
        details: Record<string, string | number>;
      }[];
    }
  > = {
    timing_paths: {
      label: "timing_paths",
      icon: Activity,
      queryCmd: "get_db timing_paths -max_paths 100 -slack_lesser_than 0.050",
      count: 6,
      objects: [
        {
          name: "u_core/u_alu/cla_stage4_63 -> res_reg[63]/D",
          type: "timing_path (Setup Max)",
          slack_ps: 18.5,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_core (800 ps)",
          details: {
            arrival_ps: 762.5,
            required_ps: 781.0,
            logic_levels: 22,
            slew_max_ps: 48.0,
            skew_ps: 12.0,
          },
        },
        {
          name: "u_pipe/reg_a_reg/Q -> u_pipe/reg_b_reg/D",
          type: "timing_path (Hold Min)",
          slack_ps: 22.0,
          view: "view_hold_ffgnp_0p88v_125c",
          clock: "clk_pipe (1200 ps)",
          details: {
            arrival_ps: 154.0,
            required_ps: 132.0,
            logic_levels: 2,
            slew_max_ps: 32.0,
            skew_ps: -5.0,
          },
        },
        {
          name: "u_mem/sram_512k_inst/CLK -> u_cache/tag_reg/D",
          type: "timing_path (Macro MCP 2)",
          slack_ps: 340.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_mem (650 ps)",
          details: {
            arrival_ps: 820.0,
            required_ps: 1160.0,
            logic_levels: 4,
            slew_max_ps: 45.0,
            skew_ps: 18.0,
          },
        },
        {
          name: "u_gpu/tex_unit -> u_gpu/blend_reg/D",
          type: "timing_path (Setup Skew-Balanced)",
          slack_ps: 42.0,
          view: "view_setup_ssgnp_0p72v_125c",
          clock: "clk_gpu (1000 ps)",
          details: {
            arrival_ps: 920.0,
            required_ps: 962.0,
            logic_levels: 18,
            slew_max_ps: 42.0,
            skew_ps: -5.0,
          },
        },
        {
          name: "u_soc/dma_to_pcie_bus[15] -> u_pcie/rx_reg/D",
          type: "timing_path (Repeater Line M5)",
          slack_ps: 35.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_pcie (1000 ps)",
          details: {
            arrival_ps: 785.0,
            required_ps: 820.0,
            logic_levels: 8,
            slew_max_ps: 38.0,
            skew_ps: 8.0,
          },
        },
        {
          name: "u_dsp/fir_stage3_mult -> u_dsp/accum_reg/D",
          type: "timing_path (LVT Swapped)",
          slack_ps: 28.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_dsp (750 ps)",
          details: {
            arrival_ps: 712.0,
            required_ps: 740.0,
            logic_levels: 16,
            slew_max_ps: 35.0,
            skew_ps: 4.0,
          },
        },
      ],
    },
    si_victims: {
      label: "si_victims",
      icon: Waves,
      queryCmd: "get_db si_victims -if {.delta_delay_ps > 10.0}",
      count: 4,
      objects: [
        {
          name: "u_mem/addr_bus[14]",
          type: "si_victim_net (NDR 2x Spacing)",
          slack_ps: 42.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_core",
          details: {
            coupling_cap_ff: 12.0,
            ground_cap_ff: 58.0,
            delta_delay_ps: 18.0,
            aggressor_count: 2,
            shield_status: "NDR_1W2S",
          },
        },
        {
          name: "u_core/fast_data_bus[0]",
          type: "si_victim_net (In-Phase Shielded)",
          slack_ps: 25.0,
          view: "view_hold_ffgnp_0p88v_125c",
          clock: "clk_core",
          details: {
            coupling_cap_ff: 2.1,
            ground_cap_ff: 45.0,
            delta_delay_ps: -5.0,
            aggressor_count: 1,
            shield_status: "VSS_COAXIAL",
          },
        },
        {
          name: "u_fsm/state_reset_n",
          type: "si_victim_net (Glitch Immune BUF_X16)",
          slack_ps: 180.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_fsm",
          details: {
            coupling_cap_ff: 4.5,
            ground_cap_ff: 78.0,
            delta_delay_ps: 4.2,
            aggressor_count: 4,
            glitch_peak_mv: 52.0,
          },
        },
        {
          name: "u_cts/clk_branch_gpu",
          type: "si_victim_net (Coaxial Clock Shield)",
          slack_ps: 18.0,
          view: "view_setup_ssgnp_0p72v_125c",
          clock: "clk_gpu",
          details: {
            coupling_cap_ff: 1.8,
            ground_cap_ff: 110.0,
            delta_delay_ps: 2.1,
            aggressor_count: 0,
            shield_status: "2W_2S_SHIELD_VSS",
          },
        },
      ],
    },
    clock_skew_groups: {
      label: "clock_skew_groups",
      icon: Clock,
      queryCmd: "get_db skew_groups",
      count: 4,
      objects: [
        {
          name: "SG_CORE_CLK",
          type: "skew_group",
          slack_ps: 42.0,
          view: "view_setup_ssgnp",
          clock: "clk_core (1.2 GHz)",
          details: {
            target_skew_ps: 20.0,
            actual_skew_ps: 12.5,
            insertion_delay_ps: 240.0,
            sink_count: 84200,
            cts_buffers: "CLKBUF_X8 / CLKBUF_X12",
          },
        },
        {
          name: "SG_GPU_PIPELINE",
          type: "skew_group",
          slack_ps: 38.0,
          view: "view_setup_ssgnp",
          clock: "clk_gpu (1.0 GHz)",
          details: {
            target_skew_ps: 25.0,
            actual_skew_ps: 18.0,
            insertion_delay_ps: 280.0,
            sink_count: 142000,
            cts_buffers: "CLKBUF_X12",
          },
        },
        {
          name: "SG_MEM_INTERFACE",
          type: "skew_group",
          slack_ps: 55.0,
          view: "view_setup_ssgnp",
          clock: "clk_mem (650 MHz)",
          details: {
            target_skew_ps: 15.0,
            actual_skew_ps: 8.4,
            insertion_delay_ps: 195.0,
            sink_count: 12400,
            cts_buffers: "CLKBUF_X8",
          },
        },
        {
          name: "SG_PCIE_INTERFACE",
          type: "skew_group",
          slack_ps: 65.0,
          view: "view_setup_ssgnp",
          clock: "clk_pcie (100 MHz)",
          details: {
            target_skew_ps: 30.0,
            actual_skew_ps: 14.0,
            insertion_delay_ps: 165.0,
            sink_count: 4200,
            cts_buffers: "CLKBUF_X4",
          },
        },
      ],
    },
    pocv_corners: {
      label: "pocv_corners",
      icon: Sparkles,
      queryCmd: "get_db delay_corners -if {.is_pocv_enabled == true}",
      count: 4,
      objects: [
        {
          name: "dc_ssgnp_0p72v_m40c_pocv",
          type: "delay_corner (LVF Moments 3-Sigma)",
          slack_ps: 18.5,
          view: "view_setup_ssgnp_cold",
          clock: "clk_core",
          details: {
            sigma_target: 3.0,
            spatial_correlation: "Enabled (500 um)",
            moment_based: "True (Skewness: +1.84)",
            cppr_mode: "Statistical RSS",
            temp_c: -40,
          },
        },
        {
          name: "dc_ssgnp_0p72v_125c_pocv",
          type: "delay_corner (LVF Moments 3-Sigma)",
          slack_ps: 22.0,
          view: "view_setup_ssgnp_hot",
          clock: "clk_core",
          details: {
            sigma_target: 3.0,
            spatial_correlation: "Enabled (500 um)",
            moment_based: "True (Skewness: +1.42)",
            cppr_mode: "Statistical RSS",
            temp_c: 125,
          },
        },
        {
          name: "dc_ffgnp_0p88v_125c_pocv",
          type: "delay_corner (Hold Min 3-Sigma)",
          slack_ps: 15.0,
          view: "view_hold_ffgnp_hot",
          clock: "clk_core",
          details: {
            sigma_target: 3.0,
            spatial_correlation: "Enabled (500 um)",
            moment_based: "True",
            cppr_mode: "Statistical RSS",
            temp_c: 125,
          },
        },
        {
          name: "dc_ffgnp_0p95v_m40c_pocv",
          type: "delay_corner (Extreme Fast Hold 3-Sigma)",
          slack_ps: 15.0,
          view: "view_hold_ffgnp_cold",
          clock: "clk_core",
          details: {
            sigma_target: 3.0,
            spatial_correlation: "Enabled (500 um)",
            moment_based: "True",
            cppr_mode: "Statistical RSS",
            temp_c: -40,
          },
        },
      ],
    },
    mmmc_views: {
      label: "mmmc_views",
      icon: Layers,
      queryCmd: "get_db analysis_views",
      count: 6,
      objects: [
        {
          name: "view_setup_ssgnp_0p72v_m40c",
          type: "analysis_view (Setup Cold Signoff)",
          slack_ps: 18.5,
          view: "view_setup_ssgnp_cold",
          clock: "All Functional Clocks",
          details: {
            constraint_mode: "cm_func",
            delay_corner: "dc_ssgnp_0p72v_m40c",
            active_type: "setup",
            pba_mode: "path",
          },
        },
        {
          name: "view_setup_ssgnp_0p72v_125c",
          type: "analysis_view (Setup Hot Signoff)",
          slack_ps: 22.0,
          view: "view_setup_ssgnp_hot",
          clock: "All Functional Clocks",
          details: {
            constraint_mode: "cm_func",
            delay_corner: "dc_ssgnp_0p72v_125c",
            active_type: "setup",
            pba_mode: "path",
          },
        },
        {
          name: "view_hold_ffgnp_0p88v_125c",
          type: "analysis_view (Hold Hot Signoff)",
          slack_ps: 18.0,
          view: "view_hold_ffgnp_hot",
          clock: "All Functional Clocks",
          details: {
            constraint_mode: "cm_func",
            delay_corner: "dc_ffgnp_0p88v_125c",
            active_type: "hold",
            pba_mode: "path",
          },
        },
        {
          name: "view_hold_ffgnp_0p95v_m40c",
          type: "analysis_view (Hold Cold Signoff)",
          slack_ps: 15.0,
          view: "view_hold_ffgnp_cold",
          clock: "All Functional Clocks",
          details: {
            constraint_mode: "cm_func",
            delay_corner: "dc_ffgnp_0p95v_m40c",
            active_type: "hold",
            pba_mode: "path",
          },
        },
        {
          name: "view_test_shift_ffgnp",
          type: "analysis_view (DFT Shift Hold Signoff)",
          slack_ps: 28.0,
          view: "view_test_shift",
          clock: "clk_scan_shift (50 MHz)",
          details: {
            constraint_mode: "cm_test_shift",
            delay_corner: "dc_ffgnp_0p88v_125c",
            active_type: "hold",
            pba_mode: "path",
          },
        },
        {
          name: "view_test_capture_ssgnp",
          type: "analysis_view (DFT At-Speed Setup)",
          slack_ps: 14.0,
          view: "view_test_capture",
          clock: "clk_scan_capture (1.2 GHz)",
          details: {
            constraint_mode: "cm_test_capture",
            delay_corner: "dc_ssgnp_0p72v_m40c",
            active_type: "setup",
            pba_mode: "path",
          },
        },
      ],
    },
    cdc_paths: {
      label: "cdc_paths",
      icon: GitPullRequest,
      queryCmd: "get_db cdc_paths",
      count: 4,
      objects: [
        {
          name: "u_cdc/sync_uart_rx (3-FF MetaSync)",
          type: "cdc_path (Asynchronous Domain Crossing)",
          slack_ps: 999.0,
          view: "view_setup_ssgnp",
          clock: "clk_uart (50 MHz) -> clk_core (1.2 GHz)",
          details: {
            mtbf_years: 16000,
            sync_cell: "DFF_METASYNC_X4",
            inter_flop_distance_um: 3.5,
            stages: 3,
            max_skew_ps: 18.0,
          },
        },
        {
          name: "u_fifo/rptr_gray[5:0] (Matched Bus)",
          type: "cdc_path (Gray Pointer Bundle)",
          slack_ps: 35.0,
          view: "view_setup_ssgnp",
          clock: "clk_read (650 MHz) -> clk_write (2.0 GHz)",
          details: {
            inter_bit_skew_ps: 18.0,
            max_skew_limit_ps: 50.0,
            bits: 6,
            routing_bundle: "LENGTH_MATCHED_M4",
          },
        },
        {
          name: "u_clkmux/sel_mux (Glitchless Mux)",
          type: "clock_mux_switch",
          slack_ps: 250.0,
          view: "view_setup_ssgnp",
          clock: "clk_pll (1.0 GHz) <-> clk_backup (100 MHz)",
          details: {
            mux_cell: "CLK_MUX_GLITCHFREE_X4",
            runt_pulse_detected: "None",
            min_pulse_width_ps: 250.0,
          },
        },
        {
          name: "u_core/rst_core_n (Reset Sync Tree)",
          type: "reset_recovery_removal_tree",
          slack_ps: 32.0,
          view: "view_setup_ssgnp",
          clock: "clk_core (1.2 GHz)",
          details: {
            recovery_slack_ps: 32.0,
            removal_slack_ps: 28.0,
            tree_buffers: "CLKBUF_X8 Balanced Tree",
            max_skew_ps: 24.0,
          },
        },
      ],
    },
    eco_changes: {
      label: "eco_changes",
      icon: Sliders,
      queryCmd: "get_db eco_changes",
      count: 5,
      objects: [
        {
          name: "eco_change_cell: AND2_X2 -> AND2_X8 (In-Place)",
          type: "eco_cell_swap",
          slack_ps: 13.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_core",
          details: {
            instance: "u_core/u_alu/mult_stage2",
            recovered_delay_ps: 98.0,
            placement_displacement_um: 0.0,
            rerouted_wires: 0,
          },
        },
        {
          name: "eco_add_repeater: DLY4_X2 (Hold Cushion)",
          type: "eco_buffer_insert",
          slack_ps: 22.0,
          view: "view_hold_ffgnp_0p88v_125c",
          clock: "clk_pipe",
          details: {
            net: "u_pipe/reg_b_reg/D",
            added_delay_ps: 112.0,
            setup_margin_guard_ps: 40.0,
            site: "Legal Whitespace",
          },
        },
        {
          name: "eco_swap_pins: AOI222_X2 (A1 -> A3)",
          type: "eco_pin_swap",
          slack_ps: 15.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_ctrl",
          details: {
            instance: "u_logic/aoi_stage_inst",
            delay_recovery_ps: 50.0,
            area_overhead_um2: 0.0,
            power_overhead_mw: 0.0,
          },
        },
        {
          name: "opt_leakage_power: 45,280 LVT -> HVT",
          type: "eco_multi_vt_swap",
          slack_ps: 18.0,
          view: "All Active MMMC Views",
          clock: "Chip-Wide",
          details: {
            leakage_power_saved_mw: 42.5,
            percentage_reduction: "38.2%",
            setup_wns_maintained_ps: 18.0,
          },
        },
        {
          name: "eco_map_spare_cells: FEOL Frozen Mask",
          type: "eco_metal_only_patch",
          slack_ps: 24.0,
          view: "view_setup_ssgnp_0p72v_m40c",
          clock: "clk_irq",
          details: {
            allocated_spares: "u_spare_inst_48 (NAND2), u_spare_inst_92 (INV)",
            mask_cost_saved: "$1,800,000",
            turnaround_weeks: 2,
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
        o.view.toLowerCase().includes(q)
    );
  }, [dbCategory, filterQuery]);

  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden font-sans">
      {/* Studio Header */}
      <div className="p-6 bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-slate-900 border-b border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-mono font-semibold">
              <Activity className="w-3.5 h-3.5" />
              CADENCE TEMPUS TIMING SIGNOFF & SI SUITE
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Tempus Static Timing Analysis & Signal Integrity Studio
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-3xl">
              Master Multi-Mode Multi-Corner (MMMC) timing signoff, Crosstalk Delta Delay & Noise Glitch analysis, Statistical POCV (μ±3σ) modeling, Asynchronous CDC & Reset recovery, and automated closed-loop Timing ECOs.
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
                {resolvedScenarios.length} / {TEMPUS_SCENARIOS.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(resolvedScenarios.length / TEMPUS_SCENARIOS.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono text-right">
              {Math.round((resolvedScenarios.length / TEMPUS_SCENARIOS.length) * 100)}% Master Signoff Score
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("crisis_room")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "crisis_room"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400"
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
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30 border border-blue-400"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Tempus `get_db` Timing Signoff Studio
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
                <Filter className="w-3.5 h-3.5 text-blue-400" />
                Select STA Signoff Domain (7 Distinct Domains):
              </span>
              <span className="text-[11px] font-mono text-slate-400">10 Scenarios Per Domain</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {TEMPUS_DOMAINS.map((dom) => {
                const isSelected = selectedDomainId === dom.id;
                const domScenarios = TEMPUS_SCENARIOS.filter((s) => s.domainId === dom.id);
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
                      setSearchQuery("");
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? "bg-blue-950/50 border-blue-500 shadow-md ring-1 ring-blue-500/40"
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
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400 font-mono text-xs font-bold">
                  Scenario #{currentScenario.id + 1}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold font-mono ${
                    currentScenario.severity === "CRITICAL"
                      ? "bg-red-500/10 border border-red-500/40 text-red-400"
                      : currentScenario.severity === "HIGH"
                      ? "bg-amber-500/10 border border-amber-500/40 text-amber-400"
                      : "bg-blue-500/10 border border-blue-500/40 text-blue-400"
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

          {/* Diagnostic Log & Physics Principle */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EDA Simulation Log */}
            <div className="bg-black/90 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs overflow-hidden">
              <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-1.5 text-blue-400">
                  <Terminal className="w-3.5 h-3.5" />
                  CADENCE TEMPUS SIMULATION OUTPUT
                </span>
                <span className="text-[10px] text-slate-500">IEEE 1801 / SDC 2.1 / Liberty LVF</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap leading-relaxed overflow-x-auto text-[11px]">
                {currentScenario.logSnippet}
              </pre>
            </div>

            {/* VLSI Physics & STA Principle */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-bold pb-2 border-b border-slate-800">
                <Sparkles className="w-3.5 h-3.5" />
                VLSI ELECTRICAL & STATIC TIMING PRINCIPLE
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
                <Sliders className="w-4 h-4 text-blue-400" />
                Select Engineering Signoff Action:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Choose the optimal Cadence Tempus signoff remediation
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
                        ? "bg-blue-950/50 border-blue-500 text-white shadow-md ring-1 ring-blue-500/40"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                        isSelected
                          ? "bg-blue-600 text-white shadow-sm"
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
                    : "bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-600/30"
                }`}
              >
                {isOptimizing ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    Running Tempus Signoff Engine...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Execute Tempus Signoff Fix
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
                    {triageResult.ok ? "TIMING SIGNOFF VERIFIED" : "VERIFICATION FAILED"}
                  </div>
                  <div>{triageResult.msg}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPUS GET_DB TIMING SIGNOFF STUDIO (Pure Cadence Common UI)     */}
      {/* ========================================================================= */}
      {activeTab === "db_explorer" && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-xl p-4">
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" />
                CADENCE TEMPUS COMMON UI GET_DB STUDIO
              </span>
              <p className="text-xs text-slate-300">
                Explore timing signoff database objects directly using Cadence Common UI queries.
              </p>
            </div>

            {/* Search filter */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Filter get_db objects..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Database Object Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
                      ? "bg-blue-950/50 border-blue-500 text-white shadow-md ring-1 ring-blue-500/40"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-xs font-mono font-bold truncate">{cat.label}</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">
                    {cat.count} Signoff Objects
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Command Banner */}
          <div className="bg-black/90 border border-slate-800 rounded-xl p-3.5 font-mono text-xs flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-2 truncate">
              <span className="text-emerald-400 font-bold">tempus:&#62;</span>
              <span className="text-blue-300">{DB_CATEGORIES[dbCategory]?.queryCmd}</span>
            </div>
            <span className="text-[10px] text-slate-500 shrink-0">Pure Database Command</span>
          </div>

          {/* Database Objects Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Object Pointer / Name</th>
                    <th className="px-4 py-3">Classification</th>
                    <th className="px-4 py-3">Timing Slack</th>
                    <th className="px-4 py-3">Analysis View</th>
                    <th className="px-4 py-3">Signoff Attributes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredDbObjects.map((obj, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-all">
                      <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                        {obj.name}
                      </td>
                      <td className="px-4 py-3 text-slate-400">{obj.type}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            obj.slack_ps >= 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-red-500/10 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {obj.slack_ps > 500 ? "N/A" : `${obj.slack_ps.toFixed(1)} ps`}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-blue-300">{obj.view}</td>
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
