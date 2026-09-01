"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import type { LearnSession } from "@/lib/vlsi-curriculum";
import { saveQuizScore } from "@/lib/vlsi-learn-progress";

export function VlsiQuiz({ session }: { session: LearnSession }) {
  const questions = session.questions || [];
  const passMark = session.passMark ?? 70;
  const [picks, setPicks] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

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
  };

  if (!questions.length) {
    return <p className="text-sm" style={{ color: "var(--ln-muted)" }}>No questions in this lesson yet.</p>;
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
                      className="w-full text-left text-[13px] leading-snug px-3 py-2 rounded-lg"
                      style={{ background: bg, color, border: `1px solid ${border}` }}
                    >
                      {c}
                    </button>
                  </li>
                );
              })}
            </ul>
            {show && (
              <p className="text-[13px] leading-relaxed flex gap-2" style={{ color: "var(--ln-muted)" }}>
                {ok ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--ln-ok)" }} />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "var(--ln-bad)" }} />
                )}
                {q.explain}
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
          <button type="button" onClick={reset} className="ln-btn">
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <button type="submit" className="ln-btn ln-btn-primary">
          Submit answers
        </button>
      )}
    </form>
  );
}
