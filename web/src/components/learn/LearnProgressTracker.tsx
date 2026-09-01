"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Trophy,
  CheckCircle2,
  BookOpen,
  Award,
  Sparkles,
  ChevronRight,
  RotateCcw,
  X,
  Flame,
  Clock,
  Code2,
  FileCheck2,
} from "lucide-react";
import {
  LEARN_SESSIONS,
  LEARN_TRACKS,
  learnCourseHref,
  orderedSessionsForTrack,
} from "@/lib/vlsi-curriculum";
import {
  LEARN_PROGRESS_EVENT,
  loadLearnProgress,
  resetLearnProgress,
  type LearnProgress,
} from "@/lib/vlsi-learn-progress";

export function LearnProgressTracker() {
  const [open, setOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState<LearnProgress>({ completed: [], quizScores: {} });

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setProgress(loadLearnProgress());
    setReady(true);

    const handleUpdate = () => {
      setProgress(loadLearnProgress());
    };

    window.addEventListener(LEARN_PROGRESS_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(LEARN_PROGRESS_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowResetConfirm(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setShowResetConfirm(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const stats = useMemo(() => {
    const totalLessons = LEARN_SESSIONS.length;
    const completedSet = new Set(progress.completed);
    const completedCount = progress.completed.length;
    const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    // Time spent / learned
    const totalMinutes = LEARN_SESSIONS.reduce((acc, s) => acc + (s.minutes || 0), 0);
    const completedMinutes = LEARN_SESSIONS.filter((s) => completedSet.has(s.slug)).reduce(
      (acc, s) => acc + (s.minutes || 0),
      0
    );

    // Quizzes stats
    const quizSessions = LEARN_SESSIONS.filter((s) => s.kind === "quiz" || s.kind === "test");
    const quizzesPassed = quizSessions.filter((s) => completedSet.has(s.slug)).length;
    const quizScoresList = Object.values(progress.quizScores);
    const avgScore =
      quizScoresList.length > 0
        ? Math.round(
            quizScoresList.reduce((acc, q) => acc + (q.total ? (q.score / q.total) * 100 : 0), 0) /
              quizScoresList.length
          )
        : 0;

    // Practicals stats
    const practicalSessions = LEARN_SESSIONS.filter((s) => s.kind === "practical");
    const practicalsSolved = practicalSessions.filter((s) => completedSet.has(s.slug)).length;

    // Rank / Title
    let rank = "Silicon Novice";
    let rankColor = "text-sky-500";
    let nextThreshold = 15;

    if (pct >= 100) {
      rank = "Master Silicon Architect";
      rankColor = "text-amber-400";
      nextThreshold = 100;
    } else if (pct >= 85) {
      rank = "ASIC Architect";
      rankColor = "text-emerald-400";
      nextThreshold = 100;
    } else if (pct >= 60) {
      rank = "Timing & STA Specialist";
      rankColor = "text-cyan-400";
      nextThreshold = 85;
    } else if (pct >= 35) {
      rank = "RTL Designer";
      rankColor = "text-teal-400";
      nextThreshold = 60;
    } else if (pct >= 15) {
      rank = "Logic Explorer";
      rankColor = "text-indigo-400";
      nextThreshold = 35;
    }

    // Find next uncompleted lesson
    const nextLesson = LEARN_SESSIONS.find((s) => !completedSet.has(s.slug));

    // Track breakdown
    const trackStats = LEARN_TRACKS.map((track) => {
      const sessions = orderedSessionsForTrack(track.id);
      const done = sessions.filter((s) => completedSet.has(s.slug)).length;
      const trackPct = sessions.length > 0 ? Math.round((done / sessions.length) * 100) : 0;
      const nextInTrack = sessions.find((s) => !completedSet.has(s.slug)) || sessions[0];
      return {
        track,
        total: sessions.length,
        done,
        trackPct,
        nextSlug: nextInTrack?.slug,
      };
    });

    return {
      totalLessons,
      completedCount,
      pct,
      totalMinutes,
      completedMinutes,
      quizCount: quizSessions.length,
      quizzesPassed,
      avgScore,
      practicalCount: practicalSessions.length,
      practicalsSolved,
      rank,
      rankColor,
      nextThreshold,
      nextLesson,
      trackStats,
    };
  }, [progress]);

  const handleReset = () => {
    resetLearnProgress();
    setShowResetConfirm(false);
  };

  // Circular progress dimensions
  const strokeWidth = 3;
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.pct / 100) * circumference;

  return (
    <div className="relative inline-flex items-center" ref={modalRef}>
      {/* Topbar Trigger Pill */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="ln-btn !px-2.5 !py-1 flex items-center gap-2 transition-all hover:scale-[1.02]"
        title="View Progress & Curriculum Mastery"
        aria-label="Progress Tracker"
        suppressHydrationWarning
      >
        {/* Mini SVG Progress Ring */}
        <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="var(--ln-border)"
              strokeWidth={strokeWidth}
              fill="none"
            />
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="var(--ln-accent)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          <span
            className="absolute text-[8px] font-bold"
            style={{ color: "var(--ln-text)" }}
            suppressHydrationWarning
          >
            {ready && stats.pct > 0 ? `${stats.pct}` : "0"}
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
          <span style={{ color: "var(--ln-text)" }}>Progress</span>
          <span
            className="px-1.5 py-0.2 rounded text-[10px] font-medium"
            style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
            suppressHydrationWarning
          >
            {ready ? `${stats.completedCount}/${stats.totalLessons}` : "–"}
          </span>
        </div>
      </button>

      {/* Popover Dropdown Modal */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] max-h-[85vh] overflow-y-auto rounded-xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          style={{
            background: "var(--ln-bg-elev)",
            border: "1px solid var(--ln-border)",
            color: "var(--ln-text)",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2)",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--ln-border)" }}>
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
              >
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">Curriculum Mastery</h3>
                <p className="text-[11px] font-medium opacity-70">{stats.rank}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded-md hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-all"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Big Progress Card */}
          <div
            className="p-3.5 rounded-lg space-y-2.5"
            style={{ background: "var(--ln-hover)", border: "1px solid var(--ln-border)" }}
          >
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-black">{stats.pct}%</span>
                <span className="text-xs opacity-75 ml-1.5 font-medium">completed</span>
              </div>
              <span className="text-xs font-semibold" style={{ color: "var(--ln-accent)" }}>
                {stats.completedCount} of {stats.totalLessons} lessons
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--ln-bg)" }}>
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${stats.pct}%`,
                  background: "linear-gradient(90deg, var(--ln-accent), #38bdf8)",
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] opacity-75 pt-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {Math.round(stats.completedMinutes)}m learned
              </span>
              <span>{Math.max(0, stats.totalMinutes - stats.completedMinutes)}m remaining</span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div
              className="p-2.5 rounded-lg space-y-1"
              style={{ background: "var(--ln-bg)", border: "1px solid var(--ln-border)" }}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-75">
                <FileCheck2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Quizzes</span>
              </div>
              <p className="text-sm font-bold">
                {stats.quizzesPassed} / {stats.quizCount}
                {stats.avgScore > 0 && (
                  <span className="text-[10px] font-normal opacity-70 ml-1">({stats.avgScore}% avg)</span>
                )}
              </p>
            </div>

            <div
              className="p-2.5 rounded-lg space-y-1"
              style={{ background: "var(--ln-bg)", border: "1px solid var(--ln-border)" }}
            >
              <div className="flex items-center gap-1.5 text-[11px] opacity-75">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Practicals</span>
              </div>
              <p className="text-sm font-bold">
                {stats.practicalsSolved} / {stats.practicalCount}
                <span className="text-[10px] font-normal opacity-70 ml-1">solved</span>
              </p>
            </div>
          </div>

          {/* Resume Next Action */}
          {stats.nextLesson && (
            <Link
              href={learnCourseHref(stats.nextLesson.track, stats.nextLesson.slug)}
              onClick={() => setOpen(false)}
              className="ln-btn ln-btn-primary w-full !py-2 justify-between font-semibold text-xs group"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Resume: {stats.nextLesson.title}</span>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}

          {/* Track Breakdown Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider opacity-75 px-1">
              <span>Track Breakdown</span>
              <span>{LEARN_TRACKS.length} Tracks</span>
            </div>

            <div
              className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 rounded-lg p-1.5"
              style={{ background: "var(--ln-bg)", border: "1px solid var(--ln-border)" }}
            >
              {stats.trackStats.map(({ track, total, done, trackPct, nextSlug }) => {
                const isComplete = done === total && total > 0;
                return (
                  <Link
                    key={track.id}
                    href={nextSlug ? learnCourseHref(track.id, nextSlug) : learnCourseHref(track.id)}
                    onClick={() => setOpen(false)}
                    className="flex flex-col gap-1.5 p-2 rounded-md transition-all hover:brightness-95 dark:hover:brightness-110 text-xs"
                    style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{track.title}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-500">
                            <CheckCircle2 className="w-3 h-3" /> Done
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium opacity-70">
                            {done}/{total}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Track progress bar */}
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ln-hover)" }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${trackPct}%`,
                          background: isComplete ? "var(--ln-ok)" : "var(--ln-accent)",
                        }}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer Controls (Catalog Link & Reset) */}
          <div className="pt-2 border-t flex items-center justify-between gap-2 text-xs" style={{ borderColor: "var(--ln-border)" }}>
            <Link
              href="/vlsi/learn"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold hover:underline"
              style={{ color: "var(--ln-accent)" }}
            >
              View Full Catalog →
            </Link>

            {showResetConfirm ? (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-rose-500 font-semibold">Reset?</span>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[11px] hover:bg-rose-700 transition"
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-0.5 rounded border text-[11px] hover:bg-black/10 transition"
                  style={{ borderColor: "var(--ln-border)" }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="opacity-50 hover:opacity-100 flex items-center gap-1 text-[11px] transition"
                title="Reset all lesson progress"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
