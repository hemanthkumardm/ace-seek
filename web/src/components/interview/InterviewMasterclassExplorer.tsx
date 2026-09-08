"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Clock,
  Shuffle,
  FileCode2,
  Zap,
  Cpu,
  Activity,
  ShieldCheck,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Bookmark,
  BookmarkCheck,
  CreditCard,
  Terminal,
  Calculator,
  Lightbulb,
  Lock,
  Check,
  ArrowRight,
  Dices,
  Loader2,
} from "lucide-react";
import {
  COMPANIES_METADATA,
  DOMAINS_METADATA,
  INTERVIEW_BUNDLE_PRICING,
  studioPracticeForInterviewDomain,
  type PublicInterviewQuestion,
  type InterviewQuestion,
} from "@/lib/interview-meta";
import {
  isMasterclassUnlocked,
  lockMasterclassForTesting,
  unlockMasterclass,
  syncInterviewUnlockFromAccount,
} from "@/lib/interview-access-service";
import { InterviewMasterclassTopNav } from "./InterviewMasterclassTopNav";
import { InterviewMathSolutionRenderer } from "./InterviewMathSolutionRenderer";
import { InterviewMasterclassPaywallModal } from "./InterviewMasterclassPaywallModal";

const BOOKMARK_KEY = "ace_seek_interview_bookmarks";
const IS_DEV = process.env.NODE_ENV === "development";

export function InterviewMasterclassExplorer() {
  const [catalog, setCatalog] = useState<PublicInterviewQuestion[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [fullQuestion, setFullQuestion] = useState<InterviewQuestion | null>(null);
  const [fullQuestionLoading, setFullQuestionLoading] = useState(false);

  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [freeOnly, setFreeOnly] = useState(false);
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [bookmarkedIds, setBookmarkedIds] = useState<Record<string, boolean>>({});
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [showPaywallModal, setShowPaywallModal] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Load catalog + sync unlock
  useEffect(() => {
    let cancelled = false;

    const loadCatalog = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const res = await fetch("/api/interview/catalog", { credentials: "include" });
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error || `Catalog failed (${res.status})`);
        }
        const data = (await res.json()) as {
          unlocked?: boolean;
          questions?: PublicInterviewQuestion[];
        };
        if (cancelled) return;
        const questions = data.questions ?? [];
        setCatalog(questions);
        const unlocked = Boolean(data.unlocked) || isMasterclassUnlocked();
        setIsUnlocked(unlocked);
        syncInterviewUnlockFromAccount(Boolean(data.unlocked));
        setSelectedQuestionId((prev) => prev || questions[0]?.id || "");
      } catch (err) {
        if (cancelled) return;
        setCatalogError(err instanceof Error ? err.message : "Failed to load catalog");
        setCatalog([]);
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };

    void loadCatalog();
    return () => {
      cancelled = true;
    };
  }, []);

  // Sync unlock state + bookmarks from storage
  useEffect(() => {
    const checkState = () => {
      setIsUnlocked(isMasterclassUnlocked());
      try {
        const raw = localStorage.getItem(BOOKMARK_KEY);
        if (raw) setBookmarkedIds(JSON.parse(raw) as Record<string, boolean>);
      } catch {
        /* ignore */
      }
    };
    checkState();
    window.addEventListener("ace_seek_interview_access_updated", checkState);
    window.addEventListener("storage", checkState);
    return () => {
      window.removeEventListener("ace_seek_interview_access_updated", checkState);
      window.removeEventListener("storage", checkState);
    };
  }, []);

  // Filter questions by domain, difficulty, free/bookmarks, and query (catalog fields only)
  const filteredQuestions = useMemo(() => {
    return catalog.filter((q) => {
      if (selectedDomain !== "all" && q.domain !== selectedDomain) return false;
      if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;
      if (freeOnly && !q.isFreeSample) return false;
      if (bookmarkedOnly && !bookmarkedIds[q.id]) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchText =
          `${q.question} ${q.shortSummary} ${q.domainName} ${q.tags.join(" ")} ${q.companyName || ""}`.toLowerCase();
        if (!matchText.includes(query)) return false;
      }
      return true;
    });
  }, [catalog, selectedDomain, selectedDifficulty, freeOnly, bookmarkedOnly, bookmarkedIds, searchQuery]);

  // Keep selected question in sync with filtered list
  useEffect(() => {
    if (filteredQuestions.length > 0) {
      const exists = filteredQuestions.some((q) => q.id === selectedQuestionId);
      if (!exists) {
        setSelectedQuestionId(filteredQuestions[0].id);
      }
    }
  }, [filteredQuestions, selectedQuestionId]);

  const activeQuestion = useMemo(() => {
    return (
      filteredQuestions.find((q) => q.id === selectedQuestionId) ||
      catalog.find((q) => q.id === selectedQuestionId) ||
      filteredQuestions[0] ||
      null
    );
  }, [filteredQuestions, selectedQuestionId, catalog]);

  const activeQuestionIsFree = Boolean(activeQuestion?.isFreeSample);
  const activeQuestionHasAccess = isUnlocked || activeQuestionIsFree;

  // Fetch full question when selection has access
  useEffect(() => {
    if (!selectedQuestionId || !activeQuestion) {
      setFullQuestion(null);
      return;
    }

    const hasAccess = isUnlocked || Boolean(activeQuestion.isFreeSample);
    if (!hasAccess) {
      setFullQuestion(null);
      setFullQuestionLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const loadFull = async () => {
      setFullQuestionLoading(true);
      setFullQuestion(null);
      try {
        const res = await fetch(`/api/interview/question/${selectedQuestionId}`, {
          credentials: "include",
          signal: controller.signal,
        });
        if (!res.ok) {
          if (!cancelled) setFullQuestion(null);
          return;
        }
        const data = (await res.json()) as {
          unlocked?: boolean;
          question?: InterviewQuestion;
        };
        if (cancelled) return;
        if (data.unlocked && data.question) {
          setFullQuestion(data.question);
        } else {
          setFullQuestion(null);
        }
      } catch (err) {
        if (cancelled || (err instanceof DOMException && err.name === "AbortError")) return;
        setFullQuestion(null);
      } finally {
        if (!cancelled) setFullQuestionLoading(false);
      }
    };

    void loadFull();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedQuestionId, activeQuestion, isUnlocked]);

  const activeQuestionIndex = useMemo(() => {
    if (!activeQuestion) return -1;
    return filteredQuestions.findIndex((q) => q.id === activeQuestion.id);
  }, [filteredQuestions, activeQuestion]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of catalog) {
      counts[q.domain] = (counts[q.domain] || 0) + 1;
    }
    return counts;
  }, [catalog]);

  const handleNextQuestion = () => {
    if (activeQuestionIndex >= 0 && activeQuestionIndex < filteredQuestions.length - 1) {
      setSelectedQuestionId(filteredQuestions[activeQuestionIndex + 1].id);
    }
  };

  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      setSelectedQuestionId(filteredQuestions[activeQuestionIndex - 1].id);
    }
  };

  const handleRandomDrill = () => {
    const pool = filteredQuestions.filter((q) => isUnlocked || q.isFreeSample);
    if (pool.length === 0) return;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) setSelectedQuestionId(pick.id);
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(BOOKMARK_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const liveDomains = useMemo(
    () => DOMAINS_METADATA.filter((d) => catalog.some((q) => q.domain === d.id)),
    [catalog]
  );

  const freePreviewCount = useMemo(
    () => catalog.filter((q) => q.isFreeSample).length,
    [catalog]
  );

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const domainIconMap: Record<string, React.ReactNode> = {
    "physical-design": <Layers className="w-4 h-4 text-emerald-400" />,
    "static-timing-analysis": <Clock className="w-4 h-4 text-sky-400" />,
    "design-verification": <CheckCircle2 className="w-4 h-4 text-teal-400" />,
    "aptitude-quantitative": <Calculator className="w-4 h-4 text-amber-400" />,
    "logical-reasoning-puzzles": <Lightbulb className="w-4 h-4 text-orange-400" />,
    "clock-domain-crossing": <Shuffle className="w-4 h-4 text-purple-400" />,
    "synthesis-sdc": <FileCode2 className="w-4 h-4 text-yellow-400" />,
    "low-power-upf": <Zap className="w-4 h-4 text-lime-400" />,
    "rtl-verilog-architecture": <Cpu className="w-4 h-4 text-cyan-400" />,
    "power-integrity-ir": <Activity className="w-4 h-4 text-rose-400" />,
    "dft-atpg": <ShieldCheck className="w-4 h-4 text-indigo-400" />,
  };

  const practiceLink = activeQuestion
    ? studioPracticeForInterviewDomain(activeQuestion.domain)
    : null;

  if (catalogLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-mono text-slate-400">Loading interview catalog…</p>
      </div>
    );
  }

  if (catalogError) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col items-center justify-center gap-4 px-4">
        <AlertTriangle className="w-10 h-10 text-amber-400" />
        <p className="text-sm font-mono text-slate-300 text-center max-w-md">{catalogError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 🚀 DEDICATED DOMAIN TOP NAVIGATION BAR */}
      <InterviewMasterclassTopNav
        selectedDomain={selectedDomain}
        onSelectDomain={setSelectedDomain}
        isUnlocked={isUnlocked}
        onOpenCheckout={() => setShowPaywallModal(true)}
        totalCount={catalog.length}
        domainCounts={domainCounts}
      />

      {/* TOP COMPACT STATUS & HERO BAR */}
      <div className="border-b border-slate-800 bg-slate-950/60 px-4 py-3">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="font-mono text-slate-400">Curriculum Domain:</span>
            <span className="font-bold text-white flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1 rounded-lg">
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              {selectedDomain === "all"
                ? "All Technical Domains"
                : (DOMAINS_METADATA.find((d) => d.id === selectedDomain)?.title || selectedDomain)}
            </span>
            <span className="text-slate-500 hidden sm:inline">•</span>
            <span className="text-slate-300 hidden sm:inline">
              {filteredQuestions.length} of {catalog.length} deep problems
              {freePreviewCount > 0 && !isUnlocked
                ? ` · ${freePreviewCount} free previews`
                : ""}
            </span>
            <span className="text-slate-500 hidden md:inline">
              · {COMPANIES_METADATA.length} company styles · {liveDomains.length} live domains
            </span>
          </div>

          <div className="flex items-center gap-2 font-mono">
            {isUnlocked ? (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Lifetime Access Active
                </span>
                {IS_DEV && (
                  <button
                    type="button"
                    onClick={() => lockMasterclassForTesting()}
                    className="text-[10px] text-slate-500 hover:text-amber-400 underline cursor-pointer"
                  >
                    [Dev: Lock]
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-amber-300 font-bold">
                  {INTERVIEW_BUNDLE_PRICING.offerPrice} ({INTERVIEW_BUNDLE_PRICING.offerPriceUsd}) Lifetime
                </span>
                <button
                  type="button"
                  onClick={() => setShowPaywallModal(true)}
                  className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer shadow-sm transition-all flex items-center gap-1"
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Unlock All</span>
                </button>
                {IS_DEV && (
                  <button
                    type="button"
                    onClick={() => unlockMasterclass("dev_test_payment", "dev@ace-seek.com")}
                    className="text-[10px] text-slate-500 hover:text-emerald-400 underline cursor-pointer"
                  >
                    [Dev: Unlock]
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 📚 MAIN UDEMY-STYLE 2-COLUMN COURSE PLAYER */}
      <main className="max-w-[1600px] mx-auto px-4 py-6 flex-1 w-full flex flex-col lg:flex-row items-start gap-6">
        
        {/* ========================================================================= */}
        {/* 📑 LEFT COLUMN: COURSE CURRICULUM INDEX / QUESTIONS SIDEBAR               */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[380px] xl:w-[420px] shrink-0 flex flex-col gap-3 rounded-2xl bg-slate-950 border border-slate-800 p-4 shadow-xl">
          
          {/* Sidebar Header & Filters */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Curriculum Index</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {filteredQuestions.length} Questions
              </span>
            </div>

            {/* Search Box */}
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions or keywords..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-all font-sans"
              />
            </div>

            {/* Domain Dropdown / Selector */}
            <div className="flex items-center gap-2">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-400 cursor-pointer font-sans"
              >
                <option value="all">All Domains ({catalog.length})</option>
                {DOMAINS_METADATA.map((dom) => {
                  const count = domainCounts[dom.id] ?? 0;
                  if (count === 0 || dom.comingSoon) {
                    return (
                      <option key={dom.id} value={dom.id} disabled>
                        {dom.title} · Coming soon
                      </option>
                    );
                  }
                  return (
                    <option key={dom.id} value={dom.id}>
                      {dom.title} ({count})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Difficulty Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
              {["all", "Medium", "Hard", "Staff / Principal"].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                    selectedDifficulty === diff
                      ? "bg-cyan-500 border-cyan-400 text-slate-950 font-black shadow-sm"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {diff === "all" ? "All Levels" : diff}
                </button>
              ))}
            </div>

            {/* Access / drill chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              <button
                type="button"
                onClick={() => setFreeOnly((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  freeOnly
                    ? "bg-emerald-500 border-emerald-400 text-slate-950 font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Free previews ({freePreviewCount})
              </button>
              <button
                type="button"
                onClick={() => setBookmarkedOnly((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  bookmarkedOnly
                    ? "bg-amber-500 border-amber-400 text-slate-950 font-black"
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                Bookmarks
              </button>
              <button
                type="button"
                onClick={handleRandomDrill}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold whitespace-nowrap transition-all cursor-pointer border bg-slate-900 border-purple-500/40 text-purple-300 hover:bg-purple-500/20"
                title="Pick a random accessible question from the current filter"
              >
                <Dices className="w-3.5 h-3.5" />
                Random drill
              </button>
            </div>
          </div>

          {/* Scrollable Questions List */}
          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1.5 select-none custom-scrollbar">
            {filteredQuestions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
                <p>No questions match your filter.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDomain("all");
                    setSelectedDifficulty("all");
                    setSearchQuery("");
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-850 border border-slate-700 text-cyan-400 text-[11px] font-mono cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isSelected = activeQuestion?.id === q.id;
                const isFree = Boolean(q.isFreeSample);
                const hasAccess = isUnlocked || isFree;
                const isBookmarked = !!bookmarkedIds[q.id];

                return (
                  <div
                    key={q.id}
                    onClick={() => setSelectedQuestionId(q.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group flex items-start gap-3 ${
                      isSelected
                        ? "bg-slate-900 border-amber-400 shadow-md shadow-amber-950/30 ring-1 ring-amber-400/40"
                        : "bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                    {/* Index Number Circle */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold mt-0.5 ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 font-black"
                          : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {idx + 1}
                    </div>

                    {/* Question Meta & Title */}
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        <span className="px-2 py-0.5 rounded font-bold bg-purple-500/20 text-purple-300 border border-purple-400/30">
                          {q.domainName}
                        </span>
                        {isFree && !isUnlocked && (
                          <span className="px-1.5 py-0.5 rounded font-black bg-emerald-400 text-slate-950">
                            FREE
                          </span>
                        )}
                        {!hasAccess && (
                          <span className="px-1.5 py-0.5 rounded font-bold bg-amber-400/10 text-amber-300 border border-amber-400/40 flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            LOCKED
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-xs font-bold leading-snug line-clamp-2 ${
                          isSelected ? "text-white" : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {q.question}
                      </h4>
                    </div>

                    {/* Bookmark Indicator */}
                    {isBookmarked && (
                      <BookmarkCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-1" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* 📖 RIGHT COLUMN: UDEMY-STYLE ACTIVE QUESTION READER / SOLUTION PANEL      */}
        {/* ========================================================================= */}
        <section className="flex-1 min-w-0 w-full space-y-6">
          {activeQuestion ? (
            <div className="rounded-2xl border-2 border-slate-800 bg-slate-950 p-6 md:p-8 shadow-2xl space-y-6">
              
              {/* Active Question Header & Breadcrumbs */}
              <div className="space-y-4 pb-6 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                    <span className="px-3 py-1 rounded-lg font-bold bg-purple-500/20 text-purple-300 border border-purple-400 flex items-center gap-1.5">
                      {domainIconMap[activeQuestion.domain]}
                      <span>{activeQuestion.domainName}</span>
                    </span>
                    <span className="px-3 py-1 rounded-lg text-slate-300 bg-slate-900 border border-slate-700">
                      {activeQuestion.role}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-lg font-black ${
                        activeQuestion.difficulty === "Hard"
                          ? "bg-rose-500/20 text-rose-300 border border-rose-400"
                          : activeQuestion.difficulty === "Staff / Principal"
                          ? "bg-amber-500/20 text-amber-300 border border-amber-400"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-400"
                      }`}
                    >
                      {activeQuestion.difficulty}
                    </span>

                    {activeQuestionIsFree && !isUnlocked && (
                      <span className="px-3 py-1 rounded-lg font-black bg-emerald-400 text-slate-950 shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>FREE SAMPLE PREVIEW</span>
                      </span>
                    )}

                    {!activeQuestionHasAccess && (
                      <span className="px-3 py-1 rounded-lg font-bold bg-amber-400/20 text-amber-300 border border-amber-400/60 flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        <span>PREMIUM PROBLEM</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {practiceLink && (
                      <Link
                        href={practiceLink.href}
                        className="px-3 py-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-cyan-200 text-xs font-mono font-bold flex items-center gap-1.5 hover:bg-cyan-500/20 transition-all"
                      >
                        <Cpu className="w-3.5 h-3.5" />
                        <span>{practiceLink.label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleBookmark(activeQuestion.id)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        bookmarkedIds[activeQuestion.id]
                          ? "bg-amber-400/20 border-amber-400 text-amber-300"
                          : "bg-slate-900 border-slate-700 text-slate-300 hover:text-white"
                      }`}
                    >
                      {bookmarkedIds[activeQuestion.id] ? (
                        <>
                          <BookmarkCheck className="w-3.5 h-3.5 text-amber-300" />
                          <span>Bookmarked</span>
                        </>
                      ) : (
                        <>
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>Bookmark</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Target Role & Question Statement */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-cyan-400 font-bold">
                    Target Role: {activeQuestion.role}
                  </div>
                  <h2 className="text-lg md:text-2xl font-black text-white leading-relaxed">
                    {activeQuestion.question}
                  </h2>
                </div>
              </div>

              {/* SOLUTION CONTENT (UNLOCKED VS LOCKED PAYWALL) */}
              {activeQuestionHasAccess ? (
                fullQuestionLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                    <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                    <p className="text-xs font-mono">Loading full solution…</p>
                  </div>
                ) : !fullQuestion ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                    <AlertTriangle className="w-7 h-7 text-amber-400" />
                    <p className="text-xs font-mono text-center max-w-sm">
                      Could not load the full solution. Sign in or unlock lifetime access, then try again.
                    </p>
                  </div>
                ) : (
                <div className="space-y-6 animate-fadeIn">
                  {/* Step-by-Step Mathematical & Technical Breakdown */}
                  <div className="space-y-3">
                    <div className="text-xs font-mono font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Step-by-Step Technical Solution &amp; Mathematical Derivation:</span>
                    </div>
                    <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 shadow-inner">
                      <InterviewMathSolutionRenderer content={fullQuestion.detailedAnswer} />
                    </div>
                  </div>

                  {/* Code Snippet / Script Implementation */}
                  {fullQuestion.tclOrVerilogSnippet && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-mono font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-cyan-400" />
                          <span>Code / Script Implementation ({fullQuestion.tclOrVerilogSnippet.lang.toUpperCase()}):</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(fullQuestion.tclOrVerilogSnippet!.code)}
                          className="text-[11px] font-mono text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 flex items-center gap-1 cursor-pointer transition-all"
                        >
                          {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : null}
                          <span>{copiedCode ? "Copied" : "Copy Code"}</span>
                        </button>
                      </div>
                      <pre className="p-5 rounded-2xl bg-black border border-slate-800 text-xs font-mono text-cyan-300 overflow-x-auto leading-relaxed">
                        {fullQuestion.tclOrVerilogSnippet.code}
                      </pre>
                    </div>
                  )}

                  {/* Two-Column Advice Grid: Common Pitfalls & Interviewer Follow-ups */}
                  <div className="grid md:grid-cols-2 gap-4 pt-2">
                    {/* Common Traps */}
                    <div className="p-5 rounded-2xl bg-amber-950/20 border-2 border-amber-500/30 space-y-3">
                      <div className="text-xs font-mono font-black uppercase text-amber-300 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        <span>Common Traps &amp; Candidate Pitfalls:</span>
                      </div>
                      <ul className="space-y-2 text-xs text-amber-100/90 leading-relaxed list-disc list-inside">
                        {fullQuestion.commonPitfalls.map((pitfall, i) => (
                          <li key={i}>{pitfall}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Interviewer Follow-ups */}
                    <div className="p-5 rounded-2xl bg-cyan-950/20 border-2 border-cyan-500/30 space-y-3">
                      <div className="text-xs font-mono font-black uppercase text-cyan-300 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-cyan-400" />
                        <span>Onsite Follow-Up Questions:</span>
                      </div>
                      <ul className="space-y-2 text-xs text-cyan-100/90 leading-relaxed list-disc list-inside">
                        {fullQuestion.interviewerFollowups.map((followup, i) => (
                          <li key={i}>{followup}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Navigation Bar (Previous & Next Question) */}
                  <div className="pt-6 border-t border-slate-800 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      disabled={activeQuestionIndex <= 0}
                      onClick={handlePrevQuestion}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      ← Previous Question
                    </button>

                    <span className="text-xs font-mono text-slate-400">
                      Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                    </span>

                    <button
                      type="button"
                      disabled={activeQuestionIndex >= filteredQuestions.length - 1}
                      onClick={handleNextQuestion}
                      className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-mono font-bold text-slate-200 transition-all cursor-pointer"
                    >
                      Next Question →
                    </button>
                  </div>
                </div>
                )
              ) : (
                /* 🔒 LOCKED PAYWALL TEASER */
                <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400/50 bg-slate-900/90 p-8 md:p-12 text-center space-y-6 shadow-2xl">
                  {/* Blurred Teaser Background */}
                  <div className="space-y-3 opacity-20 filter blur-sm pointer-events-none select-none text-left">
                    <div className="h-4 bg-slate-700 rounded w-3/4" />
                    <div className="h-4 bg-slate-700 rounded w-full" />
                    <div className="h-32 bg-slate-800 rounded-xl w-full" />
                  </div>

                  {/* Center Floating Lock Box */}
                  <div className="relative z-10 max-w-lg mx-auto space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-300 shadow-xl shadow-amber-950/60">
                      <Lock className="w-7 h-7" />
                    </div>

                    <h3 className="text-xl md:text-2xl font-black text-white">
                      Full Solution Gated Behind Lifetime Masterclass
                    </h3>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                      Unlock full step-by-step mathematical derivations (KaTeX), EDA tool playbooks, common traps, and onsite follow-up questions for <strong>{activeQuestion.domainName}</strong> and all technical domains.
                    </p>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPaywallModal(true)}
                        className="px-8 py-4 rounded-xl font-mono font-black text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xl shadow-amber-950/60 transition-all cursor-pointer inline-flex items-center gap-2.5"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Unlock Complete Masterclass (₹2,499 / $29)</span>
                      </button>
                    </div>

                    <p className="text-[11px] font-mono text-slate-400">
                      ⚡ One-Time Payment · Instant Lifetime Access · UPI, Cards &amp; NetBanking
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-16 text-center rounded-2xl border border-slate-800 bg-slate-950 text-slate-400">
              <p>Select a question from the curriculum on the left to begin.</p>
            </div>
          )}
        </section>
      </main>

      {/* 💳 RAZORPAY LIFETIME PAYWALL MODAL */}
      <InterviewMasterclassPaywallModal
        isOpen={showPaywallModal}
        onClose={() => setShowPaywallModal(false)}
        onSuccess={() => {
          setIsUnlocked(true);
          setShowPaywallModal(false);
        }}
      />
    </div>
  );
}
