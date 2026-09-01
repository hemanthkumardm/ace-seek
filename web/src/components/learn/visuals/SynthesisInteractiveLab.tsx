"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Cpu,
  Layers,
  Zap,
  Activity,
  AlertTriangle,
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
  Calculator,
} from "lucide-react";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import {
  SYNTHESIS_DOMAINS,
  SYNTHESIS_SCENARIOS,
  type SynthesisScenario,
} from "@/lib/synthesis-scenarios-data";

export function SynthesisInteractiveLab({ slug }: { slug?: string }) {
  const [activeTab, setActiveTab] = useState<"crisis_room" | "db_explorer">("crisis_room");
  const [selectedDomainId, setSelectedDomainId] = useState<string>("check_design");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [scenarioId, setScenarioId] = useState<number>(0);
  const [resolvedScenarios, setResolvedScenarios] = useState<number[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [triageResult, setTriageResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [copiedTcl, setCopiedTcl] = useState<boolean>(false);

  // DB Studio State
  const [selectedEntity, setSelectedEntity] = useState<"flops" | "icgs" | "macros" | "hfn" | "low_leak">("flops");
  const [hoveredCell, setHoveredCell] = useState<{ name: string; type: string; area: string; leak: string; delay: string } | null>(null);

  // Filtered scenarios for active domain and search query
  const domainScenarios = useMemo(() => {
    return SYNTHESIS_SCENARIOS.filter((s) => s.domainId === selectedDomainId);
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

  const activeDomain = SYNTHESIS_DOMAINS.find((d) => d.id === selectedDomainId) || SYNTHESIS_DOMAINS[0];

  // Current scenario to display
  const currentScenario: SynthesisScenario = useMemo(() => {
    const found = SYNTHESIS_SCENARIOS.find((s) => s.id === scenarioId);
    if (found && found.domainId === selectedDomainId) return found;
    return domainScenarios[0] || SYNTHESIS_SCENARIOS[0];
  }, [scenarioId, selectedDomainId, domainScenarios]);

  const handleApplyRemediation = () => {
    if (!selectedOption) return;
    const opt = currentScenario.options.find((o) => o.id === selectedOption);
    if (!opt) return;

    setIsSynthesizing(true);
    setTimeout(() => {
      setIsSynthesizing(false);
      if (opt.correct) {
        setTriageResult({ ok: true, msg: "Triage Successful! " + opt.explanation });
        if (!resolvedScenarios.includes(currentScenario.id)) {
          const next = [...resolvedScenarios, currentScenario.id];
          setResolvedScenarios(next);
          if (next.length >= 10 && slug) {
            markSessionComplete(slug);
          }
        }
      } else {
        setTriageResult({
          ok: false,
          msg: "Incorrect Diagnosis: " + opt.explanation,
        });
      }
    }, 500);
  };

  const domainIconMap: Record<string, React.ReactNode> = {
    check_design: <CheckSquare className="w-4 h-4" />,
    timing_lint: <Clock className="w-4 h-4 text-cyan-400" />,
    setup_closure: <Activity className="w-4 h-4 text-emerald-400" />,
    retiming: <GitPullRequest className="w-4 h-4 text-purple-400" />,
    dft_power: <Zap className="w-4 h-4 text-amber-400" />,
    dft_scan: <ShieldAlert className="w-4 h-4 text-rose-400" />,
    lec_signoff: <Layers className="w-4 h-4 text-blue-400" />,
  };

  return (
    <div
      className="ln-card my-6 overflow-hidden rounded-2xl w-full"
      style={{ border: "1px solid var(--ln-border)", background: "var(--ln-bg-elev)" }}
    >
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 border-b border-[var(--ln-border)] bg-gradient-to-r from-blue-950/60 via-purple-950/40 to-slate-900/60">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] shadow-md">
            <ShieldAlert className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-extrabold text-[var(--ln-text)]">
                Cadence Genus Synthesis Production Crisis &amp; Diagnostics Suite
              </h3>
              <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                70 Master Scenarios (7 Domains)
              </span>
            </div>
            <p className="text-xs text-[var(--ln-muted)] mt-1">
              Select a specialized domain below (10 real-world production scenarios each) to diagnose and fix critical tapeout issues.
            </p>
          </div>
        </div>

        {/* Top Controls: Total Score & Tab Switcher */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] text-xs font-mono">
            <span className="text-[var(--ln-muted)]">Master Triage:</span>
            <strong className="text-emerald-400 font-bold">
              {resolvedScenarios.length} / {SYNTHESIS_SCENARIOS.length}
            </strong>
            <span className="text-[10px] text-[var(--ln-muted)]">Resolved</span>
          </div>

          <div className="flex rounded-xl p-1 bg-[var(--ln-bg)] border border-[var(--ln-border)]">
            <button
              type="button"
              onClick={() => setActiveTab("crisis_room")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "crisis_room"
                  ? "bg-[var(--ln-accent)] text-white shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Scenarios Suite
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("db_explorer")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === "db_explorer"
                  ? "bg-[var(--ln-accent)] text-white shadow-sm"
                  : "text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              get_db Query Studio
            </button>

            <Link
              href="/vlsi/learn/c/cadence-pnr/vlsi-calculators"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-indigo-400 hover:text-white hover:bg-indigo-600/30 border border-indigo-500/30 transition-all ml-2"
            >
              <Calculator className="w-3.5 h-3.5" />
              VLSI Calculators
            </Link>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTION CRISIS SUITE (7 Distinct Domains, 10 Scenarios Each)    */}
      {/* ========================================================================= */}
      {activeTab === "crisis_room" && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* 7 Domain Pills (All Violations removed, clean domains only) */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)] flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[var(--ln-accent)]" />
                Select Production Synthesis Domain (7 Distinct Domains):
              </span>
              <span className="text-[11px] font-mono text-[var(--ln-muted)]">10 Scenarios Per Domain</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
              {SYNTHESIS_DOMAINS.map((dom) => {
                const isSelected = selectedDomainId === dom.id;
                const domScenarios = SYNTHESIS_SCENARIOS.filter((s) => s.domainId === dom.id);
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
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-[var(--ln-accent-soft)] border-[var(--ln-accent)] shadow-md ring-1 ring-[var(--ln-accent)]/40"
                        : "bg-[var(--ln-bg)] border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="p-1 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)]">
                          {domainIconMap[dom.id] || <Box className="w-3.5 h-3.5" />}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400">
                          {resolvedInDom}/10
                        </span>
                      </div>
                      <div className="text-xs font-bold leading-snug text-[var(--ln-text)]">
                        {dom.shortName}
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] font-mono text-[var(--ln-muted)] flex items-center justify-between">
                      <span>10 Scenarios</span>
                      {resolvedInDom === 10 && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Domain Info Bar + Scenario Search */}
          <div className="p-4 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
                {domainIconMap[activeDomain.id] || <Layers className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--ln-text)]">{activeDomain.name}</h4>
                <p className="text-[11px] text-[var(--ln-muted)]">{activeDomain.description}</p>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[var(--ln-muted)]" />
              <input
                type="text"
                placeholder="Search scenarios in domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] text-xs text-[var(--ln-text)] outline-none focus:border-[var(--ln-accent)]"
              />
            </div>
          </div>

          {/* 10 Scenarios Grid for Active Domain */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {displayedScenarios.map((sc, index) => {
              const isResolved = resolvedScenarios.includes(sc.id);
              const isSelected = currentScenario.id === sc.id;

              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => {
                    setScenarioId(sc.id);
                    setSelectedOption(null);
                    setTriageResult(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-[var(--ln-accent-soft)] border-[var(--ln-accent)] shadow-md ring-1 ring-[var(--ln-accent)]/50"
                      : "bg-[var(--ln-bg)] border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase mb-1">
                      <span className="text-[var(--ln-accent)]">Case #{index + 1}</span>
                      {isResolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                            sc.severity === "CRITICAL"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {sc.severity}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold line-clamp-2 text-[var(--ln-text)] leading-snug">
                      {sc.title}
                    </div>
                  </div>
                  <div className="mt-2.5 pt-1.5 border-t border-[var(--ln-border)]/50 text-[10px] font-mono text-[var(--ln-muted)] flex items-center justify-between">
                    <span className="truncate max-w-[110px]">{sc.stageName}</span>
                    <span className="text-[var(--ln-accent)] font-semibold">Triage →</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Deep-Dive Diagnostic Workspace for Selected Scenario */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-6 shadow-sm">
            {/* Scenario Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--ln-border)]">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono font-bold px-2 py-0.5 rounded bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
                    Scenario #{currentScenario.id + 1} of {SYNTHESIS_SCENARIOS.length}
                  </span>
                  <span className="font-bold text-[var(--ln-muted)]">·</span>
                  <span className="font-semibold text-[var(--ln-muted)]">{currentScenario.domainName}</span>
                  <span className="font-bold text-[var(--ln-muted)]">·</span>
                  <span
                    className={`font-mono font-bold text-[10px] px-2 py-0.5 rounded ${
                      currentScenario.severity === "CRITICAL"
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    }`}
                  >
                    {currentScenario.severity} SEVERITY
                  </span>
                </div>
                <h4 className="text-base sm:text-lg font-extrabold text-[var(--ln-text)] mt-1.5">
                  {currentScenario.title}
                </h4>
              </div>

              {resolvedScenarios.includes(currentScenario.id) && (
                <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Resolved &amp; Verified ✓</span>
                </div>
              )}
            </div>

            {/* 2-Column Split: Diagnostics Left | Remediations Right */}
            <div className="grid lg:grid-cols-12 gap-6">
              {/* Left: Symptom, EDA Log, Principle */}
              <div className="lg:col-span-6 space-y-4">
                {/* Symptom Box */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                    Failure Symptom &amp; Verification Impact:
                  </div>
                  <p className="text-xs leading-relaxed text-rose-300 p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/30 font-medium">
                    {currentScenario.symptom}
                  </p>
                </div>

                {/* Simulated EDA Tool Log Snippet */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-amber-400" />
                      Simulated Cadence Genus Tool Log:
                    </span>
                    <span className="text-[10px] font-mono text-[var(--ln-muted)]">
                      {currentScenario.stageName}
                    </span>
                  </div>
                  <pre className="p-3.5 rounded-xl font-mono text-[11px] leading-relaxed bg-[var(--ln-code-bg)] text-amber-300 border border-[var(--ln-border)] overflow-x-auto max-h-48">
                    {currentScenario.logSnippet}
                  </pre>
                </div>

                {/* Engineering Principle Card */}
                <div className="p-3.5 rounded-xl bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ln-accent)] flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Root Cause &amp; ASIC Engineering Principle:
                  </div>
                  <p className="text-xs text-[var(--ln-text)] leading-relaxed">
                    {currentScenario.principle}
                  </p>
                </div>
              </div>

              {/* Right: Remediation Options, Apply Button, Metrics */}
              <div className="lg:col-span-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-text)] flex items-center justify-between">
                    <span>Select the Correct Principal Engineer Remediation:</span>
                    <span className="text-[10px] text-[var(--ln-muted)]">Single choice</span>
                  </div>

                  <div className="space-y-2.5">
                    {currentScenario.options.map((opt) => {
                      const isChecked = selectedOption === opt.id;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => setSelectedOption(opt.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer text-xs transition-all flex items-start gap-3 ${
                            isChecked
                              ? "bg-[var(--ln-accent-soft)] border-[var(--ln-accent)] text-[var(--ln-text)] shadow-sm ring-1 ring-[var(--ln-accent)]/30"
                              : "bg-[var(--ln-bg-elev)] border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`scenario-fix-${currentScenario.id}`}
                            checked={isChecked}
                            onChange={() => setSelectedOption(opt.id)}
                            className="mt-0.5 shrink-0"
                          />
                          <div className="font-mono text-xs leading-relaxed text-[var(--ln-text)]">
                            {opt.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Button & Triage Result */}
                <div className="space-y-3 pt-3 border-t border-[var(--ln-border)]">
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleApplyRemediation}
                      disabled={!selectedOption || isSynthesizing}
                      className="ln-btn ln-btn-primary !px-5 !py-2.5 text-xs font-bold flex items-center gap-2 disabled:opacity-40"
                    >
                      {isSynthesizing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Running Virtual Synthesis Engine...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Apply Remediation &amp; Verify Silicon</span>
                        </>
                      )}
                    </button>

                    {resolvedScenarios.includes(currentScenario.id) && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentIdx = domainScenarios.findIndex((s) => s.id === currentScenario.id);
                          const nextInDomain = domainScenarios[currentIdx + 1];
                          if (nextInDomain) {
                            setScenarioId(nextInDomain.id);
                          } else {
                            // Go to next domain
                            const currentDomIdx = SYNTHESIS_DOMAINS.findIndex((d) => d.id === selectedDomainId);
                            const nextDom = SYNTHESIS_DOMAINS[(currentDomIdx + 1) % SYNTHESIS_DOMAINS.length];
                            setSelectedDomainId(nextDom.id);
                            const firstSc = SYNTHESIS_SCENARIOS.find((s) => s.domainId === nextDom.id);
                            if (firstSc) setScenarioId(firstSc.id);
                          }
                          setSelectedOption(null);
                          setTriageResult(null);
                        }}
                        className="ln-btn !py-2.5 !px-3.5 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <span>Next Scenario</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {triageResult && (
                    <div
                      className={`text-xs font-semibold p-3.5 rounded-xl border leading-relaxed ${
                        triageResult.ok
                          ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                          : "bg-rose-950/30 border-rose-500/40 text-rose-200"
                      }`}
                    >
                      {triageResult.msg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Before vs After Impact Gauges & Production Tcl Solution */}
            {resolvedScenarios.includes(currentScenario.id) && (
              <div className="mt-4 p-5 rounded-xl bg-[var(--ln-bg-elev)] border border-[var(--ln-border)] space-y-4 animate-in fade-in duration-300">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-2 pb-2 border-b border-[var(--ln-border)]">
                  <CheckCircle2 className="w-4 h-4" />
                  Silicon Metrics Verification &amp; Production Command Solution
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Before vs After Comparison */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase text-[var(--ln-muted)] font-mono">
                      Metric Verification (Before vs After):
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {currentScenario.afterMetrics.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] text-center space-y-1"
                        >
                          <div className="text-[10px] text-[var(--ln-muted)]">{m.label}</div>
                          <div className="font-mono font-bold text-emerald-400">{m.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Golden Tcl Solution Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase text-[var(--ln-muted)] font-mono">
                      <span>Production Cadence Genus Tcl Script:</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(currentScenario.remedyTcl);
                          setCopiedTcl(true);
                          setTimeout(() => setCopiedTcl(false), 1500);
                        }}
                        className="text-[var(--ln-accent)] hover:underline flex items-center gap-1"
                      >
                        {copiedTcl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        {copiedTcl ? "Copied" : "Copy Tcl"}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg font-mono text-[11px] leading-relaxed bg-[var(--ln-code-bg)] text-[var(--ln-code-fg)] border border-[var(--ln-border)] overflow-x-auto">
                      {currentScenario.remedyTcl}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GET_DB QUERY STUDIO (Interactive Widescreen Die Explorer)           */}
      {/* ========================================================================= */}
      {activeTab === "db_explorer" && (
        <div className="p-6 space-y-6">
          <div className="p-5 sm:p-6 rounded-xl bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-accent)] pb-3 border-b border-[var(--ln-border)] flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Cadence Common UI Database Query Studio (get_db / set_db)
              </span>
              <span className="text-[11px] font-mono text-[var(--ln-muted)]">
                Target: 4.8mm x 4.8mm SoC Die | Technology: Open PDK / FreePDK
              </span>
            </div>

            {/* Entity Selection Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {[
                {
                  id: "flops",
                  label: "Sequential Flip-Flops",
                  query: "get_db insts -if {.is_sequential == true}",
                  count: "48,250",
                  color: "text-cyan-400",
                  filterBadge: "is_sequential == true",
                },
                {
                  id: "icgs",
                  label: "Clock Gates (ICGs)",
                  query: "get_db insts -if {.is_integrated_clock_gating == true}",
                  count: "1,420",
                  color: "text-amber-400",
                  filterBadge: "is_icg == true",
                },
                {
                  id: "macros",
                  label: "Embedded SRAM Macros",
                  query: "get_db insts -if {.is_macro == true}",
                  count: "4 Banks",
                  color: "text-purple-400",
                  filterBadge: "is_macro == true",
                },
                {
                  id: "hfn",
                  label: "High-Fanout Nets",
                  query: "get_db nets -if {.num_loads > 32}",
                  count: "184 Nets",
                  color: "text-rose-400",
                  filterBadge: "num_loads > 32",
                },
                {
                  id: "low_leak",
                  label: "Ultra Low-Leakage Cells",
                  query: "get_db lib_cells -if {.leakage_power < 0.005}",
                  count: "82 Types",
                  color: "text-emerald-400",
                  filterBadge: "leakage < 0.005",
                },
              ].map((ent) => (
                <button
                  key={ent.id}
                  type="button"
                  onClick={() => setSelectedEntity(ent.id as any)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                    selectedEntity === ent.id
                      ? "bg-[var(--ln-accent-soft)] border-[var(--ln-accent)] shadow-md ring-1 ring-[var(--ln-accent)]/40"
                      : "bg-[var(--ln-bg-elev)] border-[var(--ln-border)] text-[var(--ln-muted)] hover:text-[var(--ln-text)]"
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-[var(--ln-text)]">{ent.label}</div>
                    <div className={`text-xl font-mono font-extrabold mt-1.5 ${ent.color}`}>
                      {ent.count}
                    </div>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[var(--ln-border)]/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-[var(--ln-bg)] text-[var(--ln-muted)] border border-[var(--ln-border)]">
                      {ent.filterBadge}
                    </span>
                    <span className="text-[var(--ln-accent)] font-bold">Select →</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Dedicated Full-Width Active Query Box */}
            {(() => {
              const queriesMap: Record<
                string,
                { query: string; returns: string; desc: string; sample: string }
              > = {
                flops: {
                  query: "get_db insts -if {.is_sequential == true}",
                  returns: "list of db_inst objects",
                  desc: "Queries all state-holding sequential storage elements (flip-flops, scan registers) across the hierarchical design database.",
                  sample:
                    "soc_top/core_0/alu_inst/reg_q_reg[31..0] (lib_cell: DFFHQX1, area: 2.8 µm², leak: 0.02 µW)",
                },
                icgs: {
                  query: "get_db insts -if {.is_integrated_clock_gating == true}",
                  returns: "list of db_inst objects (ICG cells)",
                  desc: "Queries all instantiated or synthesis-inserted latch-based Integrated Clock Gating cells controlling local clock branches.",
                  sample:
                    "soc_top/clk_ctrl/icg_latch_bank0 (lib_cell: CKGPRELATNX2, area: 4.2 µm², leak: 0.04 µW)",
                },
                macros: {
                  query: "get_db insts -if {.is_macro == true}",
                  returns: "list of db_inst objects (Hard IP / SRAM)",
                  desc: "Queries all instantiated SRAM memory compiler macros, register files, and analog PLL blocks in the floorplan.",
                  sample:
                    "soc_top/mem_subsys/sram_256kb_bank_0 (lib_cell: SRAM256K_DP, area: 0.60 mm², leak: 1.20 mW)",
                },
                hfn: {
                  query: "get_db nets -if {.num_loads > 32}",
                  returns: "list of db_net objects",
                  desc: "Queries all high-fanout electrical nets exceeding 32 standard load pins requiring high-drive repeaters or CTS distribution.",
                  sample:
                    "soc_top/core_0/global_reset_n (driver: rst_sync_buf, num_loads: 1,420, cap: 850 fF)",
                },
                low_leak: {
                  query: "get_db lib_cells -if {.leakage_power < 0.005}",
                  returns: "list of db_lib_cell objects",
                  desc: "Queries all High-Threshold Voltage (HVT) library standard cell footprints optimized for minimum quiescent sub-threshold leakage.",
                  sample:
                    "stdcells_hvt/NAND2_HVT_X1 (footprint: NAND2, leakage: 0.0018 mW, delay: 65 ps)",
                },
              };
              const activeQ = queriesMap[selectedEntity];
              return (
                <div className="p-4 rounded-xl bg-[var(--ln-code-bg)] border border-[var(--ln-border)] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono font-bold text-[var(--ln-accent)] flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      Active Executable Common UI Command:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeQ.query);
                      }}
                      className="ln-btn !py-1 !px-2.5 text-[11px] font-mono"
                    >
                      <Copy className="w-3 h-3" /> Copy Query
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-black/60 border border-slate-800 text-sm font-mono font-bold text-emerald-300 break-all select-all">
                    {activeQ.query}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[var(--ln-muted)] font-mono">
                    <span>{activeQ.desc}</span>
                    <span className="text-cyan-300">Returns: {activeQ.returns}</span>
                  </div>
                </div>
              );
            })()}

            {/* High-Density 2D Silicon Die Floorplan Map */}
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-400 pb-2 border-b border-slate-800">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Die Floorplan Filter: <strong className="text-white">{selectedEntity.toUpperCase()}</strong>
                </span>
                <span>Metal Stack: M1-M8 | Core Utilization: 68.4%</span>
              </div>

              {/* Silicon Canvas with SRAM Macros, PDN Power Grid & Standard Cell Matrix */}
              <div className="relative p-4 rounded-xl bg-black/80 border border-slate-800 min-h-[320px] flex flex-col justify-between">
                {/* 4 Corner Dual-Port SRAM Macros */}
                <div className="grid grid-cols-12 gap-1.5 z-10">
                  {Array.from({ length: 96 }).map((_, idx) => {
                    const isMacro =
                      idx === 0 ||
                      idx === 1 ||
                      idx === 10 ||
                      idx === 11 ||
                      idx === 84 ||
                      idx === 85 ||
                      idx === 94 ||
                      idx === 95;
                    const isIcg = idx % 8 === 3;
                    const isHfn = idx % 11 === 4;
                    const isFlop = idx % 3 === 0;

                    const isHighlighted =
                      selectedEntity === "macros"
                        ? isMacro
                        : selectedEntity === "icgs"
                        ? isIcg
                        : selectedEntity === "hfn"
                        ? isHfn
                        : selectedEntity === "flops"
                        ? isFlop
                        : idx % 4 === 1;

                    return (
                      <div
                        key={idx}
                        onMouseEnter={() =>
                          setHoveredCell({
                            name: isMacro
                              ? `sram_256kb_bank_${idx % 4}`
                              : isIcg
                              ? `clk_gate_latch_${idx}`
                              : `dff_inst_${idx}`,
                            type: isMacro
                              ? "Hard SRAM Macro"
                              : isIcg
                              ? "Integrated Clock Gating Latch"
                              : "Scan Flip-Flop",
                            area: isMacro ? "0.60 mm²" : isIcg ? "4.2 µm²" : "2.8 µm²",
                            leak: isMacro ? "1.20 mW" : isIcg ? "0.04 µW" : "0.02 µW",
                            delay: isMacro ? "180 ps" : isIcg ? "28 ps" : "45 ps",
                          })
                        }
                        className={`h-7 rounded transition-all flex items-center justify-center font-mono text-[9px] cursor-pointer ${
                          isHighlighted
                            ? selectedEntity === "macros"
                              ? "bg-purple-600 text-white font-extrabold shadow-lg shadow-purple-500/30 scale-105"
                              : selectedEntity === "icgs"
                              ? "bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/30 scale-105"
                              : selectedEntity === "hfn"
                              ? "bg-rose-500 text-white font-extrabold shadow-md shadow-rose-500/30 scale-105"
                              : "bg-cyan-500 text-black font-bold shadow-md shadow-cyan-500/30 scale-105"
                            : isMacro
                            ? "bg-purple-950/40 text-purple-400 border border-purple-800/40 font-bold"
                            : "bg-slate-900/40 text-slate-700 border border-slate-800/40 hover:bg-slate-800/60"
                        }`}
                      >
                        {isMacro
                          ? "SRAM"
                          : isHighlighted
                          ? selectedEntity === "icgs"
                            ? "ICG"
                            : selectedEntity === "hfn"
                            ? "HFN"
                            : "DFF"
                          : ""}
                      </div>
                    );
                  })}
                </div>

                {/* Hover Inspector Tooltip */}
                {hoveredCell && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-900/90 border border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
                    <div className="flex items-center gap-2">
                      <Box className="w-4 h-4 text-cyan-400" />
                      <span className="font-mono font-bold text-white">{hoveredCell.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {hoveredCell.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-mono">
                      <span>
                        Area: <strong className="text-emerald-400">{hoveredCell.area}</strong>
                      </span>
                      <span>
                        Leakage: <strong className="text-amber-400">{hoveredCell.leak}</strong>
                      </span>
                      <span>
                        Arc Delay: <strong className="text-cyan-400">{hoveredCell.delay}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
