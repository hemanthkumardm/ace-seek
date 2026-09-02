"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { LearnSession, QuizQuestion } from "@/lib/vlsi-curriculum";
import { saveQuizScore } from "@/lib/vlsi-learn-progress";

/**
 * Deterministic pseudo-random float generator based on FNV-1a hash.
 * Guarantees zero SSR hydration discrepancies while thoroughly jumbling options.
 */
function seededRandom(seedStr: string): number {
  let h = 2166136261;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

/**
 * Shuffles choices for a question and recalculates the correct answer index.
 */
function jumbleQuestion(
  q: QuizQuestion,
  sessionSlug: string,
  attempt: number
): QuizQuestion {
  if (!q.choices || q.choices.length <= 1) {
    return q;
  }

  const items = q.choices.map((choice, originalIdx) => ({
    choice,
    isCorrect: originalIdx === q.answer,
  }));

  // Fisher-Yates deterministic shuffle
  for (let i = items.length - 1; i > 0; i--) {
    const seed = `${q.id}_${sessionSlug}_${attempt}_${i}_${q.choices[i]}`;
    const rnd = seededRandom(seed);
    const j = Math.floor(rnd * (i + 1));
    const temp = items[i];
    items[i] = items[j];
    items[j] = temp;
  }

  const shuffledChoices = items.map((it) => it.choice);
  const newAnswerIndex = items.findIndex((it) => it.isCorrect);

  return {
    ...q,
    choices: shuffledChoices,
    answer: newAnswerIndex >= 0 ? newAnswerIndex : q.answer,
  };
}

export function VlsiQuiz({ session }: { session: LearnSession }) {
  const rawQuestions = session.questions || [];
  const passMark = session.passMark ?? 70;
  const [attempt, setAttempt] = useState(0);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  // Dynamically and deterministically jumble all choices across positions A, B, C, D
  const questions = useMemo(() => {
    return rawQuestions.map((q) => jumbleQuestion(q, session.slug, attempt));
  }, [rawQuestions, session.slug, attempt]);

  const { correct, pct } = useMemo(() => {
    let c = 0;
    for (const q of questions) {
      if (picks[q.id] === q.answer) c += 1;
    }
    const p = questions.length ? Math.round((c / questions.length) * 100) : 0;
    return { correct: c, pct: p };
  }, [picks, questions]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    saveQuizScore(session.slug, correct, questions.length, passMark);
  };

  const reset = () => {
    setPicks({});
    setSubmitted(false);
    // Re-jumble options on retry for a fresh learning attempt
    setAttempt((prev) => prev + 1);
  };

  if (!questions.length) {
    return (
      <p className="text-sm" style={{ color: "var(--ln-muted)" }}>
        No questions in this lesson yet.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {questions.map((q, i) => {
        const picked = picks[q.id];
        const show = submitted;
        const ok = picked === q.answer;
        return (
          <div key={q.id} className="ln-card p-5 space-y-3">
            <p className="text-sm font-medium" style={{ color: "var(--ln-text)" }}>
              {i + 1}. {q.prompt}
            </p>
            <ul className="space-y-2">
              {q.choices.map((c, idx) => {
                const selected = picked === idx;
                const optionLetter = String.fromCharCode(65 + idx); // 'A', 'B', 'C', 'D'

                let bg = "var(--ln-hover)";
                let color = "var(--ln-text)";
                let border = "transparent";

                if (show && idx === q.answer) {
                  bg = "var(--ln-accent-soft)";
                  color = "var(--ln-ok)";
                  border = "var(--ln-ok)";
                } else if (show && selected && !ok) {
                  bg = "transparent";
                  color = "var(--ln-bad)";
                  border = "var(--ln-bad)";
                } else if (!show && selected) {
                  bg = "var(--ln-accent-soft)";
                  color = "var(--ln-accent)";
                  border = "var(--ln-accent)";
                }

                return (
                  <li key={idx}>
                    <button
                      type="button"
                      disabled={submitted}
                      onClick={() => setPicks((p) => ({ ...p, [q.id]: idx }))}
                      className="w-full text-left text-[13px] leading-snug px-3.5 py-2.5 rounded-lg flex items-start gap-2.5 transition-all cursor-pointer"
                      style={{ background: bg, color, border: `1px solid ${border}` }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-mono font-bold shrink-0 mt-0.5"
                        style={{
                          background: selected
                            ? "var(--ln-accent)"
                            : "rgba(255,255,255,0.06)",
                          color: selected ? "#fff" : "var(--ln-muted)",
                        }}
                      >
                        {optionLetter}
                      </span>
                      <span className="flex-1">{c}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {show && (
              <p
                className="text-[13px] leading-relaxed flex gap-2 pt-1 border-t border-slate-800/40"
                style={{ color: "var(--ln-muted)" }}
              >
                {ok ? (
                  <CheckCircle2
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "var(--ln-ok)" }}
                  />
                ) : (
                  <XCircle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    style={{ color: "var(--ln-bad)" }}
                  />
                )}
                <span>
                  <strong className="text-slate-200">
                    Correct Answer: {String.fromCharCode(65 + q.answer)}.{" "}
                  </strong>
                  {q.explain}
                </span>
              </p>
            )}
          </div>
        );
      })}

      {submitted ? (
        <div className="ln-card p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium" style={{ color: "var(--ln-text)" }}>
            Score {correct}/{questions.length} ({pct}%){" "}
            {pct >= passMark ? "— passed" : "— below pass mark"}
          </p>
          <button type="button" onClick={reset} className="ln-btn cursor-pointer">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry (New Jumbled Order)
          </button>
        </div>
      ) : (
        <button type="submit" className="ln-btn ln-btn-primary cursor-pointer">
          Submit answers
        </button>
      )}
    </form>
  );
}
