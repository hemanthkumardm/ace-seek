"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  Sliders,
  Terminal,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Database,
  RefreshCw,
  Copy,
  Check,
  Search,
  Box,
  Flame,
  FileCode,
  Filter,
  CheckSquare,
  Clock,
  GitPullRequest,
  AlertCircle,
  HelpCircle,
  Play,
  RotateCcw,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Layout,
  Grid,
  ShieldCheck,
  Eye,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import {
  PNR_DOMAINS,
  PNR_SCENARIOS,
  type PnrScenario,
  type PnrDomain,
} from "@/lib/pnr-scenarios-data";

export function InnovusInteractiveLab({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"crisis_room" | "db_explorer">("crisis_room");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("floorplan_pdn");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [resolvedScenarios, setResolvedScenarios] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [copiedTcl, setCopiedTcl] = useState<boolean>(false);

  // DB Studio State
  const [selectedQuery, setSelectedQuery] = useState<string>("macros");

  // Filtered scenarios for active domain and search query
  const domainScenarios = useMemo(() => {
    return PNR_SCENARIOS.filter((s) => s.domainId === selectedDomainId);
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

  const activeDomain = PNR_DOMAINS.find((d) => d.id === selectedDomainId) || PNR_DOMAINS[0];

  // Current scenario to display
  const currentScenario: PnrScenario = useMemo(() => {
    const found = PNR_SCENARIOS.find((s) => s.id === scenarioId);
    if (found && found.domainId === selectedDomainId) return found;
    return domainScenarios[0] || PNR_SCENARIOS[0];
  }, [scenarioId, selectedDomainId, domainScenarios]);

  // Handle Domain Selection
  const handleDomainSelect = (dId: string) => {
    setSelectedDomainId(dId);
    setSelectedOption(null);
    setTriageResult(null);
    const firstInDomain = PNR_SCENARIOS.find((s) => s.domainId === dId);
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
          msg: "✓ CRITICAL PnR VIOLATION RESOLVED: Remediation verified in Cadence Innovus PODV2 engine! All physical metrics, timing slack, and DRC rules verified clean.",
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
            (chosen?.explanation || "This solution fails to satisfy physical design constraints or introduces fatal DRC/timing violations."),
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
    <div className="w-full max-w-6xl xl:max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* ========================================================================= */}
      {/* HEADER BANNER & STATS */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-wider">
              <Layout className="w-3.5 h-3.5" />
              Cadence Innovus PODV2 • Physical Design Master Suite
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Physical Design & Implementation Crisis Studio
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Triage, diagnose, and remediate 70 real-world production Physical Design failure scenarios across Floorplanning, PDN, Placement, CCOpt CTS, NanoRoute, Signal Integrity, and Signoff Physical Verification.
            </p>
          </div>

          {/* Resolved Progress Bar */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 min-w-[240px] space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                Resolved Scenarios:
              </span>
              <span className="text-emerald-400 font-bold font-mono">
                {resolvedScenarios.length} / {PNR_SCENARIOS.length}
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-emerald-500 to-teal-400 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(resolvedScenarios.length / PNR_SCENARIOS.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-[11px] text-slate-400 font-mono text-right">
              {Math.round((resolvedScenarios.length / PNR_SCENARIOS.length) * 100)}% Master Verification Score
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab("crisis_room")}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition-all flex items-center gap-2 ${
              activeTab === "crisis_room"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
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
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400"
                : "bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50"
            }`}
          >
            <Terminal className="w-4 h-4" />
            Innovus `get_db` Database Studio
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
      {/* TAB 1: CRISIS ROOM (70 SCENARIOS ACROSS 7 DOMAINS) */}
      {/* ========================================================================= */}
      {activeTab === "crisis_room" && (
        <div className="space-y-6">
          {/* 7 Distinct Physical Design Domains Filter Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {PNR_DOMAINS.map((domain) => {
              const isSelected = selectedDomainId === domain.id;
              const domainResolvedCount = domainScenarios.filter((s) =>
                resolvedScenarios.includes(s.id)
              ).length;

              return (
                <button
                  key={domain.id}
                  onClick={() => handleDomainSelect(domain.id)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isSelected
                      ? "bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/20 ring-1 ring-indigo-500"
                      : "bg-slate-900/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {domain.shortName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        domainResolvedCount === domain.count
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {domainResolvedCount}/{domain.count}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-bold truncate ${
                      isSelected ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {domain.name.split(",")[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main 2-Column Workspace: Scenario List (Left) & Deep Dive Triage (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Scenario Selector within Domain (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col h-[760px] shadow-xl">
              <div className="space-y-3 mb-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    {activeDomain.name} ({displayedScenarios.length})
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">10 Scenarios</span>
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search violations, rules, symptoms..."
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Scenario Scroll List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {displayedScenarios.map((sc, index) => {
                  const isCur = sc.id === currentScenario.id;
                  const isDone = resolvedScenarios.includes(sc.id);

                  return (
                    <button
                      key={sc.id}
                      onClick={() => {
                        setScenarioId(sc.id);
                        setSelectedOption(null);
                        setTriageResult(null);
                      }}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs relative ${
                        isCur
                          ? "bg-indigo-900/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50"
                          : isDone
                          ? "bg-slate-950/60 border-emerald-900/40 hover:bg-slate-900"
                          : "bg-slate-950/40 border-slate-800/80 hover:bg-slate-900/70"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          #{sc.id + 1} • {sc.stageName}
                        </span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                            sc.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : sc.severity === "HIGH"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                              : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                          }`}
                        >
                          {sc.severity}
                        </span>
                      </div>
                      <div
                        className={`font-semibold line-clamp-2 ${
                          isCur ? "text-indigo-200 font-bold" : "text-slate-200"
                        }`}
                      >
                        {sc.title}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/50 text-[11px]">
                        <span className="text-slate-500 truncate max-w-[180px]">
                          {sc.symptom.slice(0, 45)}...
                        </span>
                        {isDone && (
                          <span className="text-emerald-400 font-mono font-bold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Solved
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Active Scenario Deep Dive & Engineering Triage (8 cols) */}
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 flex flex-col h-[760px] overflow-y-auto space-y-6 shadow-xl custom-scrollbar">
              {/* Scenario Header & Navigation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono text-[11px] font-bold border border-indigo-500/30">
                      Scenario #{currentScenario.id + 1}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Stage: <strong className="text-slate-300">{currentScenario.stageName}</strong>
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                        currentScenario.severity === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : currentScenario.severity === "HIGH"
                          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                          : "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {currentScenario.severity} Severity
                    </span>
                  </div>
                  <h2 className="text-xl font-extrabold text-white">{currentScenario.title}</h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevScenario}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleNextScenario}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Symptom & Failure Log */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Physical Failure Symptom & EDA Log Output
                </div>
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                  {currentScenario.symptom}
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentScenario.logSnippet}</pre>
                </div>
              </div>

              {/* VLSI Physics & Engineering Principle */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  Underlying Physical Design Physics & Methodological Principle
                </div>
                <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 text-indigo-200 text-xs leading-relaxed">
                  {currentScenario.principle}
                </div>
              </div>

              {/* Multiple Choice Engineering Remediation Options */}
              <div className="space-y-3">
                <div className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                  Select Golden Cadence Innovus PODV2 Remediation:
                </div>
                <div className="space-y-2">
                  {currentScenario.options.map((opt) => {
                    const isSelected = selectedOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setSelectedOption(opt.id)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all ${
                          isSelected
                            ? "bg-indigo-950/80 border-indigo-400 shadow-md ring-1 ring-indigo-400 text-white"
                            : "bg-slate-950/60 border-slate-800 hover:bg-slate-800/80 text-slate-300"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center mt-0.5 flex-shrink-0 ${
                              isSelected
                                ? "border-indigo-400 bg-indigo-500 text-white"
                                : "border-slate-600 bg-slate-900"
                            }`}
                          >
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                          <span className="leading-relaxed">{opt.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Apply Button */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    disabled={!selectedOption || isOptimizing}
                    onClick={handleApplyFix}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 border border-indigo-400 flex items-center gap-2 disabled:opacity-40 transition-all cursor-pointer"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running Innovus PODV2 Engine...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Apply Remediation & Verify Floorplan
                      </>
                    )}
                  </button>

                  {/* Feedback Message */}
                  {triageResult && (
                    <div
                      className={`text-xs font-mono p-2.5 rounded-xl border flex-1 ml-4 ${
                        triageResult.ok
                          ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-950/40 text-rose-300 border-rose-500/40"
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
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Pre-Remediation vs Post-Remediation Physical Metrics
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

              {/* Production Cadence Innovus Golden Script Solution */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-400" />
                    Production Cadence Innovus Tcl Solution
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
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-indigo-300 overflow-x-auto">
                  <pre className="whitespace-pre-wrap">{currentScenario.remedyTcl}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: INNOVUS `get_db` COMMON UI DATABASE STUDIO */}
      {/* ========================================================================= */}
      {activeTab === "db_explorer" && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[10px] font-mono uppercase tracking-wider mb-1">
                <Database className="w-3 h-3" />
                Pure Cadence Common UI Object-Attribute Model
              </div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-400" />
                Innovus `get_db` Database Query Studio
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Query, filter, and chain attributes across the hierarchical physical design database using only native Cadence Innovus `get_db` commands.
              </p>
            </div>

            {/* Query Selector Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {(
                [
                  { id: "macros", label: "get_db macros" },
                  { id: "clock_nets", label: "get_db clock_nets" },
                  { id: "skew_groups", label: "get_db skew_groups" },
                  { id: "power_mesh", label: "get_db pg_stripes" },
                  { id: "timing_paths", label: "get_db timing_slack" },
                  { id: "si_noise", label: "get_db si_victims" },
                  { id: "physical_cells", label: "get_db tap_endcaps" },
                  { id: "route_rules", label: "get_db route_types" },
                ] as const
              ).map((q) => (
                <button
                  key={q.id}
                  onClick={() => setSelectedQuery(q.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer ${
                    selectedQuery === q.id
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400"
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
                Innovus Common UI `get_db` Shell • Active Design: soc_top
              </span>
              <span className="text-[10px] text-slate-500">Database Format: OpenAccess / Common UI DB</span>
            </div>

            {selectedQuery === "macros" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 1&gt; get_db [get_db insts -if {`{.is_macro == true}`}] .name .location .orient .halo_deltas .lib_cell.name
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LOCATION &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ORIENT &nbsp;&nbsp;HALO_DELTAS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;LIB_CELL
                  </div>
                  <div>SRAM_BANK_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 50.0 1850.0 }"} &nbsp;R0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 25.0 25.0 25.0 25.0 }"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SRAM_512K_ASAP7</div>
                  <div>SRAM_BANK_1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 1850.0 1850.0 }"} R180 &nbsp;&nbsp;&nbsp;{"{ 25.0 25.0 25.0 25.0 }"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SRAM_512K_ASAP7</div>
                  <div>DSP_MACRO_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 50.0 50.0 }"} &nbsp;&nbsp;&nbsp;R0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 20.0 20.0 20.0 20.0 }"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DSP_FPU_MULT64</div>
                  <div>ANALOG_PLL_0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 1850.0 50.0 }"} &nbsp;R0 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{"{ 30.0 30.0 30.0 30.0 }"} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PLL_2G4_ANALOG</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Returns all instantiated hard IP blocks with exact placement coordinates, orientation, placement halos, and library cell names.</em>
                </div>
              </div>
            )}

            {selectedQuery === "clock_nets" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 2&gt; get_db [get_db nets -if {`{.is_clock == true}`}] .name .num_sinks .route_type.name .driver.name
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    NET_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NUM_SINKS &nbsp;ROUTE_TYPE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;DRIVER_PIN
                  </div>
                  <div>clk_core_1g2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;48200 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLK_NDR_2W2S_SHIELD_VSS &nbsp;&nbsp;&nbsp;&nbsp;u_pll/clk_out_core</div>
                  <div>clk_pcie_250m &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6400 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLK_NDR_2W2S_SHIELD_VSS &nbsp;&nbsp;&nbsp;&nbsp;u_pll/clk_out_pcie</div>
                  <div>clk_ddr_800m &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;14200 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLK_NDR_2W2S_SHIELD_VSS &nbsp;&nbsp;&nbsp;&nbsp;u_pll/clk_out_ddr</div>
                  <div>clk_dma_400m &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3200 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;CLK_DEFAULT_1W1S &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;u_clk_gate/gclk_out</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Filters all synthesized clock distribution nets, reporting leaf sink count, assigned Non-Default Routing (NDR) rules, and driving clock sources.</em>
                </div>
              </div>
            )}

            {selectedQuery === "skew_groups" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 3&gt; get_db ccopt_skew_groups .name .target_insertion_delay .target_skew .sources.name .num_sinks
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    SKEW_GROUP_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TARGET_LATENCY &nbsp;TARGET_SKEW &nbsp;SOURCE_PORT &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NUM_SINKS
                  </div>
                  <div>SG_CORE_1G2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.500 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.030 ns &nbsp;&nbsp;&nbsp;&nbsp;ports/clk_core &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;48200</div>
                  <div>SG_PCIE_250M &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.750 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.040 ns &nbsp;&nbsp;&nbsp;&nbsp;ports/clk_pcie &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;6400</div>
                  <div>SG_DDR_800M &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.600 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.035 ns &nbsp;&nbsp;&nbsp;&nbsp;ports/clk_ddr &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;14200</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Inspects CCOpt Clock Tree Synthesis skew groups to confirm asynchronous clock domains are isolated and constrained with proper insertion delay and skew targets.</em>
                </div>
              </div>
            )}

            {selectedQuery === "power_mesh" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 4&gt; get_db [get_db pg_nets VDD].stripes .layer.name .width .spacing .direction
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    LAYER &nbsp;&nbsp;STRIPE_WIDTH &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SET_TO_SET_PITCH &nbsp;DIRECTION &nbsp;&nbsp;&nbsp;&nbsp;NET_NAME
                  </div>
                  <div>M6 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;25.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;vertical &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD</div>
                  <div>M7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;25.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;horizontal &nbsp;&nbsp;&nbsp;VDD</div>
                  <div>M8 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;30.000 um &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;vertical &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VDD</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Queries the synthesized Power Distribution Network (PDN) stripes on VDD/VSS to verify metal layer assignment, width, and set-to-set pitch.</em>
                </div>
              </div>
            )}

            {selectedQuery === "timing_paths" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 5&gt; get_db [get_db timing_paths -max_paths 4 -late].endpoint .name .slack .required_time .arrival_time
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    ENDPOINT_PIN &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;SLACK &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;REQUIRED_TIME &nbsp;&nbsp;&nbsp;&nbsp;ARRIVAL_TIME
                  </div>
                  <div>u_fpu/mult_stage2_reg_63/D &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+0.042 ns &nbsp;&nbsp;0.833 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.791 ns</div>
                  <div>u_crypto/aes_key_exp_reg_127/D &nbsp;&nbsp;&nbsp;+0.055 ns &nbsp;&nbsp;0.833 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.778 ns</div>
                  <div>u_dcache/tag_compare_reg_31/D &nbsp;&nbsp;&nbsp;&nbsp;+0.068 ns &nbsp;&nbsp;0.833 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.765 ns</div>
                  <div>u_pcie/tx_phy_interface_reg_15/D &nbsp;+0.084 ns &nbsp;&nbsp;4.000 ns &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;3.916 ns</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Extracts worst-case critical setup timing path endpoints, reporting post-route positive timing slack, arrival time, and required time.</em>
                </div>
              </div>
            )}

            {selectedQuery === "si_noise" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 6&gt; get_db [get_db nets -if {`{.si_noise_peak > 0.02}`}] .name .si_noise_peak .driver.lib_cell.name
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    VICTIM_NET_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;GLITCH_PEAK_VOLT &nbsp;&nbsp;LIMIT_VOLT &nbsp;&nbsp;DRIVER_CELL &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;STATUS
                  </div>
                  <div>core_rst_async_n &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.024 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.200 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BUFX16_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>pd_cpu_iso_en &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.008 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.200 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BUFX16_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PASSED ✓</div>
                  <div>sensor_analog_calib &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.015 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.200 V &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;BUFX8_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;PASSED ✓</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Inspects post-route Signal Integrity (SI) crosstalk glitch noise peaks on sensitive asynchronous reset, isolation, and analog control nets.</em>
                </div>
              </div>
            )}

            {selectedQuery === "physical_cells" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 7&gt; get_db [get_db insts -if {`{.is_physical_only == true}`}] .lib_cell.name -unique
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    PHYSICAL_CELL_TYPE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;INSERTED_COUNT &nbsp;&nbsp;&nbsp;&nbsp;FUNCTION / PURPOSE
                  </div>
                  <div>TAPCELL_X1_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4820 instances &nbsp;&nbsp;&nbsp;&nbsp;Well-Tap Substrate / N-well Bias (Latch-up Prevention)</div>
                  <div>ENDCAP_L_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1840 instances &nbsp;&nbsp;&nbsp;&nbsp;Left Row Boundary N-well Termination</div>
                  <div>ENDCAP_R_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1840 instances &nbsp;&nbsp;&nbsp;&nbsp;Right Row Boundary N-well Termination</div>
                  <div>DECAP_X32_ASAP7 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1240 instances &nbsp;&nbsp;&nbsp;&nbsp;Decoupling Capacitor (Dynamic IR Drop Suppression)</div>
                  <div>FILL64/FILL32/FILL1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;18400 instances &nbsp;&nbsp;&nbsp;Base Layer Continuity & Density DFM Fillers</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Queries all non-logical physical cells in the design database to audit well-tap density, row boundary endcaps, and decoupling capacitors.</em>
                </div>
              </div>
            )}

            {selectedQuery === "route_rules" && (
              <div className="space-y-2.5 text-indigo-300 leading-relaxed">
                <div className="text-slate-400 font-bold">
                  innovus 8&gt; get_db route_types .name .width_multiplier .space_multiplier .shield_net.name .top_preferred_layer.name
                </div>
                <div className="text-emerald-400 pl-4 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                    ROUTE_TYPE_NAME &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;WIDTH_MULT &nbsp;SPACE_MULT &nbsp;SHIELD_NET &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;TOP_LAYER
                  </div>
                  <div>CLK_NDR_2W2S_SHIELD_VSS &nbsp;2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VSS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M7</div>
                  <div>DIFF_CLK_SHIELD &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;VSS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M7</div>
                  <div>CRITICAL_BUS_RULE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;2 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;none &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M6</div>
                  <div>CLK_DEFAULT_1W1S &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1 &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;none &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;M5</div>
                </div>
                <div className="text-[11px] text-slate-500 pt-1">
                  💡 <em>Retrieves all defined Non-Default Routing (NDR) rules, shielding configurations, and layer preferences in the Innovus routing engine.</em>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
