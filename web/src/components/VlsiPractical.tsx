"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Play, RotateCcw, Eye, EyeOff, XCircle, Terminal, BookOpen, Sparkles } from "lucide-react";
import type { LearnSession } from "@/lib/vlsi-curriculum";
import { runPracticalChecks } from "@/lib/vlsi-practical-check";
import { markSessionComplete } from "@/lib/vlsi-learn-progress";
import { formatInlineText } from "./learn/FormattedProse";

export function VlsiPractical({ session }: { session: LearnSession }) {
  const problem = session.problem;
  const [code, setCode] = useState(problem?.starter ?? "");
  const [ran, setRan] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [viewMode, setViewMode] = useState<"interactive" | "code">("interactive");

  const results = useMemo(() => {
    if (!problem || !ran) return [];
    return runPracticalChecks(code, problem.checks, problem.language);
  }, [code, problem, ran]);

  if (!problem) {
    return <p className="text-sm" style={{ color: "var(--ln-muted)" }}>No practical attached.</p>;
  }

  // If this session has a rich interactive simulator (like genus-practical-lab),
  // default to interactive mode with a 1-click complete & reference script option
  const isInteractiveSession = session.slug.includes("genus") || session.slug.includes("innovus") || session.slug.includes("tempus");

  const passed = ran && results.length > 0 && results.every((r) => r.ok);
  const failN = results.filter((r) => !r.ok).length;
  const langLabel = (
    {
      verilog: "Verilog",
      tcl: "Tcl",
      perl: "Perl",
      bash: "Bash",
      python: "Python",
      vim: "Vim / gvim",
      xml: "XML",
      text: "Answer",
    } as const
  )[problem.language];

  const onRun = () => {
    setRan(true);
    const next = runPracticalChecks(code, problem.checks, problem.language);
    if (next.length > 0 && next.every((r) => r.ok)) {
      markSessionComplete(session.slug);
    }
  };

  const reset = () => {
    setCode(problem.starter);
    setRan(false);
    setRevealed(false);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Problem Specification & Design Guide Panel */}
      <div className="ln-card p-5 space-y-4 rounded-xl flex flex-col justify-between" style={{ background: "var(--ln-bg-elev)", border: "1px solid var(--ln-border)" }}>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[var(--ln-border)]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--ln-accent-soft)] text-[var(--ln-accent)]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--ln-text)]">
                  Practical Lab Specification
                </h4>
                <p className="text-[11px] text-[var(--ln-muted)]">
                  Read requirements below, code your solution on the right, and verify with unit tests.
                </p>
              </div>
            </div>
            <span
              className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full shadow-sm"
              style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)", border: "1px solid var(--ln-border)" }}
            >
              {langLabel}
            </span>
          </div>

          {/* Mission Objective */}
          {session.summary && (
            <div className="p-3 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--ln-accent)] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Lab Objective
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--ln-text)]">
                {session.summary}
              </p>
            </div>
          )}

          {/* Detailed Design Checklist & Step-by-Step Requirements */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)]">
              Design Checklist &amp; Requirements:
            </div>
            <ul className="space-y-2">
              {(session.checklist || []).map((c, i) => (
                <li
                  key={i}
                  className="text-[12.5px] leading-relaxed flex items-start gap-2.5 p-2 rounded-lg bg-[var(--ln-bg)] border border-[var(--ln-border)] text-[var(--ln-text)]"
                >
                  <span className="w-4 h-4 rounded-full bg-[var(--ln-accent-soft)] text-[var(--ln-accent)] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1">{formatInlineText(c)}</div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-[var(--ln-border)] text-[11px] text-[var(--ln-muted)] flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[var(--ln-accent)]" />
          <span>Automated syntax &amp; RTL rule checks evaluate your design when you click <strong>Run tests</strong>.</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="ln-code overflow-hidden">
          <div
            className="flex items-center justify-between px-3 py-2 text-[11px] opacity-70"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <span>{langLabel} editor</span>
            <span>{session.difficulty || session.level}</span>
          </div>
          <textarea
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setRan(false);
            }}
            spellCheck={false}
            className="w-full min-h-[280px] bg-transparent text-[12.5px] font-mono p-4 outline-none resize-y leading-relaxed"
            style={{ color: "var(--ln-code-fg)" }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onRun} className="ln-btn ln-btn-primary">
            <Play className="w-3.5 h-3.5" />
            Run automated verification
          </button>
          {problem.solution && (
            <button
              type="button"
              onClick={() => {
                setCode(problem.solution || "");
                setRevealed(true);
                setRan(true);
                markSessionComplete(session.slug);
              }}
              className="ln-btn !bg-[var(--ln-accent-soft)] !text-[var(--ln-accent)] !border-[var(--ln-border)] font-semibold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load &amp; Verify Reference Script
            </button>
          )}
          <button type="button" onClick={reset} className="ln-btn">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
          {problem.solution && (
            <button type="button" onClick={() => setRevealed((v) => !v)} className="ln-btn">
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {revealed ? "Hide script" : "View script"}
            </button>
          )}
        </div>

        {ran && (
          <div className="ln-card p-4 space-y-2 bg-emerald-950/20 border-emerald-500/30">
            <p className="text-sm font-semibold text-emerald-300">
              {passed ? `All ${results.length} production checks passed ✓` : `${failN}/${results.length} failed`}
            </p>
            <ul className="space-y-1.5">
              {results.map((r) => (
                <li key={r.id} className="flex items-start gap-2 text-[13px]">
                  {r.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--ln-ok)" }} />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: "var(--ln-bad)" }} />
                  )}
                  <span style={{ color: r.ok ? "var(--ln-ok)" : "var(--ln-bad)" }}>{r.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {revealed && problem.solution && (
          <pre className="ln-code p-4">
            <div className="text-[11px] mb-2 opacity-70">Production Reference Script</div>
            <code>{problem.solution}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
