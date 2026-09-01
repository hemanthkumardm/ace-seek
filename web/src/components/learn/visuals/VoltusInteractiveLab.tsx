"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Zap,
  Activity,
  ShieldAlert,
  Flame,
  BatteryCharging,
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
} from "lucide-react";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import {
  VOLTUS_DOMAINS,
  VOLTUS_SCENARIOS,
  type VoltusScenario,
  type VoltusDomain,
} from "@/lib/voltus-scenarios-data";

export function VoltusInteractiveLab({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"crisis_room" | "db_explorer">("crisis_room");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("static_ir_pdn");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [resolvedScenarios, setResolvedScenarios] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [copiedTcl, setCopiedTcl] = useState<boolean>(false);

  // DB Studio State
  const [selectedQuery, setSelectedQuery] = useState<string>("power_domains");

  // Filtered scenarios for active domain and search query
  const domainScenarios = useMemo(() => {
    return VOLTUS_SCENARIOS.filter((s) => s.domainId === selectedDomainId);
  }, [selectedDomainId]);

  const displayedScenarios = useMemo(() => {
    if (!searchQuery.trim()) return domainScenarios;
    const q = searchQuery.toLowerCase();
    return domainScenarios.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.symptom.toLowerCase().includes(q) ||
        s.principle.toLowerCase().includes(q) ||
        s.stageName.toLowerCase().includes(q)
    );
  }, [domainScenarios, searchQuery]);

  const activeDomain = VOLTUS_DOMAINS.find((d) => d.id === selectedDomainId) || VOLTUS_DOMAINS[0];

  // Current scenario to display
  const currentScenario: VoltusScenario = useMemo(() => {
    const found = VOLTUS_SCENARIOS.find((s) => s.id === scenarioId);
    if (found && found.domainId === selectedDomainId) return found;
    return domainScenarios[0] || VOLTUS_SCENARIOS[0];
  }, [scenarioId, selectedDomainId, domainScenarios]);

  // Handle Domain Selection
  const handleDomainSelect = (dId: string) => {
    setSelectedDomainId(dId);
    setSelectedOption(null);
    setTriageResult(null);
    const firstInDomain = VOLTUS_SCENARIOS.find((s) => s.domainId === dId);
    if (firstInDomain) {
      setScenarioId(firstInDomain.id);
    }
  };

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
          msg: "✓ CRITICAL POWER INTEGRITY VIOLATION RESOLVED: Remediation verified in Cadence Voltus IC Power Integrity solver! All IR drop, EM, and UPF rules verified clean.",
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
            "✗ INCORRECT POWER INTEGRITY ACTION: " +
            (chosen?.explanation || "This solution fails to satisfy rail impedance requirements or introduces fatal thermal/voltage violations."),
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

  return (
    <div className="space-y-6 max-w-6xl xl:max-w-7xl w-full mx-auto pb-16">
      {/* Studio Header Card */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              CADENCE VOLTUS POWER INTEGRITY SIGN-OFF STUDIO
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              Power Integrity, IR Drop & EM Crisis Center
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              Diagnose and solve 70 production-grade power integrity failures across Static IR Drop, Dynamic di/dt Noise, Electromigration (EM), MTCMOS Power Gating, UPF Multi-Voltage, and Decoupling Capacitance.
            </p>
          </div>

          {/* Master Progress Indicator */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 min-w-[240px] space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400">Total Solved:</span>
              <span className="text-amber-400 font-bold text-sm">
                {resolvedScenarios.length} / {VOLTUS_SCENARIOS.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(resolvedScenarios.length / VOLTUS_SCENARIOS.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono text-right">
              {Math.round((resolvedScenarios.length / VOLTUS_SCENARIOS.length) * 100)}% Master Signoff Score
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("crisis_room")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "crisis_room"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400"
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
                ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30 border border-amber-400"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Voltus `get_db` Power Signoff Studio
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
        <div className="space-y-6">
          {/* Domain Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
            {VOLTUS_DOMAINS.map((domain) => {
              const countResolvedInDomain = VOLTUS_SCENARIOS.filter(
                (s) => s.domainId === domain.id && resolvedScenarios.includes(s.id)
              ).length;
              const totalInDomain = VOLTUS_SCENARIOS.filter((s) => s.domainId === domain.id).length;
              const isSelected = selectedDomainId === domain.id;

              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelect(domain.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? "bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                        {countResolvedInDomain}/{totalInDomain} Solved
                      </span>
                      {countResolvedInDomain === totalInDomain && totalInDomain > 0 && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-white line-clamp-1">
                      {domain.name}
                    </div>
                  </div>
                  <div className="mt-2 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1 rounded-full transition-all"
                      style={{
                        width: `${(countResolvedInDomain / (totalInDomain || 1)) * 100}%`,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Triage Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT: Scenario Selection List (4 Cols) */}
            <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">{activeDomain.name}</h3>
                  <p className="text-[11px] text-slate-400">{activeDomain.tagline}</p>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 border border-slate-700">
                  {domainScenarios.length} Cases
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter symptoms, commands, rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Scenarios List */}
              <div className="space-y-1.5 max-h-[560px] overflow-y-auto pr-1">
                {displayedScenarios.map((scenario) => {
                  const isResolved = resolvedScenarios.includes(scenario.id);
                  const isCurrent = currentScenario.id === scenario.id;

                  return (
                    <button
                      key={scenario.id}
                      onClick={() => {
                        setScenarioId(scenario.id);
                        setSelectedOption(null);
                        setTriageResult(null);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-start justify-between gap-2 cursor-pointer ${
                        isCurrent
                          ? "bg-amber-950/60 border-amber-500 shadow-md ring-1 ring-amber-500/50"
                          : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                              scenario.severity === "CRITICAL"
                                ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                : scenario.severity === "HIGH"
                                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {scenario.severity}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 truncate">
                            #{scenario.id + 1} • {scenario.stageName.split("/")[0]}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-slate-200 truncate">
                          {scenario.title}
                        </div>
                      </div>
                      {isResolved ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-slate-800 border border-slate-700 shrink-0 mt-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT: Deep-Dive Triage & Remediation Console (8 Cols) */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              {/* Scenario Top Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400">
                      CASE #{currentScenario.id + 1}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs font-mono text-slate-400">
                      {currentScenario.stageName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                        currentScenario.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : currentScenario.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {currentScenario.severity}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold text-white leading-snug">
                    {currentScenario.title}
                  </h2>
                </div>

                {/* Prev / Next Case Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevScenario}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </button>
                  <button
                    onClick={handleNextScenario}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 border border-slate-700 transition-all cursor-pointer"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Symptom & Log Output */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Voltus Diagnostic Log & Symptom
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-rose-300/90 leading-relaxed overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentScenario.logSnippet}</pre>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  <strong className="text-white">Failure Symptom:</strong> {currentScenario.symptom}
                </p>
              </div>

              {/* VLSI Physics & Electrical Principle */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-1.5">
                <div className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Power Integrity & Physical Principle
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {currentScenario.principle}
                </p>
              </div>

              {/* Interactive Remediation Options */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-amber-400" />
                  Select Golden Engineering Remediation Action
                </div>

                <div className="space-y-2">
                  {currentScenario.options.map((option) => {
                    const isSelected = selectedOption === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => {
                          setSelectedOption(option.id);
                          setTriageResult(null);
                        }}
                        className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-amber-950/50 border-amber-400 shadow-md ring-1 ring-amber-400/50"
                            : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "border-amber-400 bg-amber-500"
                              : "border-slate-600 bg-slate-900"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                        </div>
                        <span className="text-xs text-slate-200 leading-relaxed">
                          {option.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Apply Button & Feedback Message */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                  <button
                    onClick={handleApplyFix}
                    disabled={!selectedOption || isOptimizing}
                    className={`px-5 py-2.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      selectedOption && !isOptimizing
                        ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-600/30 hover:brightness-110"
                        : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50"
                    }`}
                  >
                    {isOptimizing ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                        Running Voltus Rail Solver...
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        Apply Remediation in Voltus
                      </>
                    )}
                  </button>

                  {triageResult && (
                    <div
                      className={`px-4 py-2.5 rounded-xl text-xs font-mono font-semibold flex-1 border ${
                        triageResult.ok
                          ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                          : "bg-rose-950/50 border-rose-500/40 text-rose-300"
                      }`}
                    >
                      {triageResult.msg}
                    </div>
                  )}
                </div>
              </div>

              {/* Before vs After Quantitative Metrics */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-amber-400" />
                  Pre-Remediation vs Post-Remediation Power & Rail Metrics
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-rose-400 uppercase">
                      ❌ Before Fix (Violated State)
                    </div>
                    {currentScenario.beforeMetrics.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">{m.label}:</span>
                        <span className="text-rose-300 font-bold">{m.val}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 space-y-1.5">
                    <div className="text-[11px] font-mono font-bold text-emerald-400 uppercase">
                      ✅ After Fix (Production Verified)
                    </div>
                    {currentScenario.afterMetrics.map((m, i) => (
                      <div key={i} className="flex justify-between text-xs font-mono">
                        <span className="text-slate-400">{m.label}:</span>
                        <span className="text-emerald-300 font-bold">{m.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Production Cadence Voltus Golden Script Solution */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-amber-400" />
                    Production Cadence Voltus Tcl Solution
                  </div>
                  <button
                    onClick={handleCopyTcl}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono flex items-center gap-1.5 border border-slate-700 transition-all cursor-pointer"
                  >
                    {copiedTcl ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Tcl Solution
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-amber-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentScenario.remedyTcl}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VOLTUS `get_db` COMMON UI POWER SIGNOFF STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "db_explorer" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                <Database className="w-3 h-3" />
                Pure Cadence Common UI Object-Attribute Model
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-amber-400" />
                Voltus `get_db` Power & Rail Signoff Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Query, filter, and audit power domains, static/dynamic IR drop hotspots, EM current limits, and decoupling capacitance across the hierarchical database.
              </p>
            </div>

            {/* Query Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {(
                [
                  { id: "power_domains", label: "get_db power_domains" },
                  { id: "ir_drop_hotspots", label: "get_db ir_hotspots" },
                  { id: "em_violators", label: "get_db em_limits" },
                  { id: "pg_stripes", label: "get_db pg_stripes" },
                  { id: "decap_cells", label: "get_db decap_cells" },
                  { id: "level_shifters", label: "get_db level_shifters" },
                  { id: "activity_toggles", label: "get_db activity_metrics" },
                  { id: "power_switches", label: "get_db power_switches" },
                ] as const
              ).map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuery(q.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedQuery === q.id
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-400"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Console Output */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 font-mono text-xs space-y-4 shadow-inner">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                Voltus Common UI `get_db` Shell • Active Design: soc_top
              </span>
              <span className="text-[10px] text-slate-500">Database Format: Voltus Rail / Common UI DB</span>
            </div>

            {selectedQuery === "power_domains" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 1&gt; get_db power_domains .name .voltage .primary_power_net.name .is_switchable
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    DOMAIN_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VOLTAGE &nbsp;&nbsp;PRIMARY_NET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IS_SWITCHABLE
                  </div>
                  <div>PD_CORE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.800 V &nbsp;&nbsp;VDD_CORE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;false</div>
                  <div>PD_CPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.800 V &nbsp;&nbsp;VDD_CPU_SW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;true (Header Gated)</div>
                  <div>PD_GPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.800 V &nbsp;&nbsp;VDD_GPU_SW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;true (Header Gated)</div>
                  <div>PD_LOW_VOLT &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.650 V &nbsp;&nbsp;VDD_LOW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;false (DVFS Domain)</div>
                  <div>PD_AON &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.800 V &nbsp;&nbsp;VDD_AON &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;false (Always-On)</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Extracts all configured UPF/CPF power domains, nominal operating voltages, primary power nets, and switchable MTCMOS gating statuses.</em>
                </div>
              </div>
            )}

            {selectedQuery === "ir_drop_hotspots" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 2&gt; get_db [get_db pg_nets VDD_CORE].ir_drop_worst .location .drop_voltage .threshold
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    HOTSPOT_LOCATION &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATIC_DROP &nbsp;&nbsp;DYNAMIC_PEAK &nbsp;&nbsp;SIGNOFF_LIMIT &nbsp;&nbsp;STATUS
                  </div>
                  <div>{"{ 1240.2 1560.8 }"} (SRAM0) &nbsp;18.2 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;28.4 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;40.0 mV (5%) &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>{"{ 1820.5 1200.0 }"} (ALU64) &nbsp;16.4 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;32.1 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;40.0 mV (5%) &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>{"{ 450.0  450.0  }"} (DSP0) &nbsp;&nbsp;14.8 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;22.5 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;40.0 mV (5%) &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>{"{ 1850.0 50.0   }"} (PLL0) &nbsp;&nbsp;1.8 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.2 mV &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;10.0 mV (AMS) &nbsp;&nbsp;PASSED ✓</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Queries worst-case static and dynamic IR drop coordinates across all functional modules, confirming full compliance with 5% VDD limits.</em>
                </div>
              </div>
            )}

            {selectedQuery === "em_violators" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 3&gt; get_db [get_db pg_nets VDD_CORE].em_worst_segments .layer.name .current_density .limit
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    LAYER &nbsp;&nbsp;MAX_J_AVG (DC) &nbsp;&nbsp;FOUNDRY_LIMIT &nbsp;&nbsp;EST_MTTF_HOURS &nbsp;&nbsp;STATUS
                  </div>
                  <div>M6 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.20 mA/um2 &nbsp;&nbsp;&nbsp;&nbsp;5.00 mA/um2 &nbsp;&nbsp;&nbsp;&nbsp;&gt;150,000 hrs &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>M7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.85 mA/um2 &nbsp;&nbsp;&nbsp;&nbsp;5.00 mA/um2 &nbsp;&nbsp;&nbsp;&gt;180,000 hrs &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>M8 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.95 mA/um2 &nbsp;&nbsp;&nbsp;&nbsp;8.00 mA/um2 &nbsp;&nbsp;&nbsp;&gt;250,000 hrs &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>Via6_7 &nbsp;0.29 mA/cut &nbsp;&nbsp;&nbsp;&nbsp;0.40 mA/cut &nbsp;&nbsp;&nbsp;&gt;150,000 hrs &nbsp;&nbsp;&nbsp;PASSED ✓</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Audits Electromigration (EM) Black&apos;s equation current densities across power grid layers and multi-cut via stacks, verifying &gt;150,000 hours MTTF.</em>
                </div>
              </div>
            )}

            {selectedQuery === "pg_stripes" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 4&gt; get_db [get_db pg_nets VDD_CORE].stripes .layer.name .width .spacing .direction
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    LAYER &nbsp;&nbsp;STRIPE_WIDTH &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PITCH_SET_TO_SET &nbsp;&nbsp;DIRECTION &nbsp;&nbsp;&nbsp;&nbsp;NET_NAME
                  </div>
                  <div>M6 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;25.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;vertical &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_CORE</div>
                  <div>M7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;30.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;horizontal &nbsp;&nbsp;&nbsp;VDD_CORE</div>
                  <div>M8 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;30.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;vertical &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_CORE</div>
                  <div>M9 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;8.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;40.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;horizontal &nbsp;&nbsp;&nbsp;VDD_CORE</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Inspects top-metal distribution mesh geometry, ensuring ultra-low sheet resistance across global power transport trunks.</em>
                </div>
              </div>
            )}

            {selectedQuery === "decap_cells" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 5&gt; get_db [get_db insts -if {`{.lib_cell.is_decap == true}`}] .lib_cell.name -unique
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    DECAP_CELL_TYPE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;INSTANCES &nbsp;&nbsp;&nbsp;&nbsp;TOTAL_CAPACITANCE &nbsp;&nbsp;LEAKAGE_CONTRIBUTION
                  </div>
                  <div>DECAP_X64_THICK_OD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1,240 cells &nbsp;&nbsp;12.4 nF &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.04 mW (Thick-OD Safe)</div>
                  <div>DECAP_X32_THICK_OD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4,800 cells &nbsp;&nbsp;24.0 nF &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.08 mW (Thick-OD Safe)</div>
                  <div>DECAP_X16_THICK_OD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3,200 cells &nbsp;&nbsp;8.0 nF &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.03 mW (Thick-OD Safe)</div>
                  <div>Total On-Die Decap &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;9,240 cells &nbsp;&nbsp;44.4 nF &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.15 mW (Negligible Standby)</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Audits on-die decoupling capacitor inventory, verifying 44.4 nF of thick-oxide charge storage for dynamic noise suppression with zero gate tunneling leakage.</em>
                </div>
              </div>
            )}

            {selectedQuery === "level_shifters" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 6&gt; get_db [get_db insts -if {`{.is_level_shifter == true || .is_isolation == true}`}] .name .lib_cell.name .primary_pg_net.name .secondary_pg_net.name
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    INSTANCE_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LIB_CELL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PRIMARY_PG &nbsp;&nbsp;&nbsp;&nbsp;SECONDARY_PG &nbsp;&nbsp;&nbsp;&nbsp;TYPE
                  </div>
                  <div>u_ls_bus/ls_bit_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LVLBUF_LH_X4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_0P65 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_0P95 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Low-to-High LS</div>
                  <div>u_ls_bus/ls_bit_31 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LVLBUF_LH_X4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_0P65 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_0P95 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Low-to-High LS</div>
                  <div>u_iso/cpu_out_iso_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ISOBCLMP0_X4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_AON &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_CPU_SW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Isolation Clamp-0</div>
                  <div>u_iso/cpu_rst_iso &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ISOBCLMP1_X4 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_AON &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD_CPU_SW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Isolation Clamp-1</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Inspects multi-voltage level shifters and isolation clamp cells, confirming dual-rail power connectivity and proper clamp polarity.</em>
                </div>
              </div>
            )}

            {selectedQuery === "activity_toggles" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 7&gt; get_db [get_db nets -if {`{.toggle_rate > 0.4}`}] .name .toggle_rate .static_probability .dynamic_power
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    NET_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TOGGLE_RATE &nbsp;&nbsp;STATIC_PROB (P1) &nbsp;&nbsp;DYNAMIC_POWER &nbsp;&nbsp;SOURCE
                  </div>
                  <div>clk_core_1g2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.000 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.500 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;29.80 mW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FSDB Waveform</div>
                  <div>u_fpu/mult_stage1_bus[63] 0.785 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.512 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1.42 mW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FSDB Waveform</div>
                  <div>u_aes/key_round_state[127]0.640 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.498 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.98 mW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FSDB Waveform</div>
                  <div>u_dma/tx_data_valid &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.450 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.380 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.45 mW &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;FSDB Waveform</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Extracts annotated switching activity metrics from vector-based FSDB simulation, verifying accurate cycle-by-cycle dynamic power propagation.</em>
                </div>
              </div>
            )}

            {selectedQuery === "power_switches" && (
              <div className="space-y-2.5 text-amber-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  voltus 8&gt; get_db power_switches .name .domain.name .cell.name .cascade_stage .inrush_peak
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    SWITCH_GROUP &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DOMAIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CELL_TYPE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CASCADE_STAGE &nbsp;&nbsp;INRUSH_PEAK
                  </div>
                  <div>HDR_STAGE_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PD_CPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HEADER_X32_UHVT &nbsp;&nbsp;&nbsp;Stage 1 (T=0ns) 0.32 A (Safe)</div>
                  <div>HDR_STAGE_1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PD_CPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HEADER_X32_UHVT &nbsp;&nbsp;&nbsp;Stage 2 (T=15ns)0.28 A (Safe)</div>
                  <div>HDR_STAGE_2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PD_CPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HEADER_X32_UHVT &nbsp;&nbsp;&nbsp;Stage 3 (T=30ns)0.24 A (Safe)</div>
                  <div>HDR_STAGE_3 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PD_CPU &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;HEADER_X32_UHVT &nbsp;&nbsp;&nbsp;Stage 4 (T=45ns)0.18 A (Safe)</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Audits 4-stage daisy-chained MTCMOS power switch cascades, confirming gradual charging of the virtual power rail with sub-0.35 A inrush current.</em>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
