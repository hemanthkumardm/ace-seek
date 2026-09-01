"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, PlayCircle } from "lucide-react";
import {
  LEARN_KIND_META,
  learnCourseHref,
  orderedSessionsForTrack,
  sessionLayer,
  trackById,
  type LearnSession,
} from "@/lib/vlsi-curriculum";
import { toggleSessionComplete, loadLearnProgress } from "@/lib/vlsi-learn-progress";
import { VlsiQuiz } from "@/components/VlsiQuiz";
import { VlsiPractical } from "@/components/VlsiPractical";
import { LearnLayerGate, LayerBadge } from "@/components/learn/LearnLayerGate";
import { layerUnlocked } from "@/lib/vlsi-learn-access";
import { useEntitlements } from "@/hooks/useEntitlements";
import { DigitalVisualizer } from "@/components/learn/visuals/DigitalVisualizer";
import { FormattedProse, formatInlineText } from "@/components/learn/FormattedProse";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

export function LearnLessonView({ session }: { session: LearnSession }) {
  const { ent } = useEntitlements();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const update = () => setDone(loadLearnProgress().completed.includes(session.slug));
    update();
    window.addEventListener("ace_vlsi_learn_progress_updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("ace_vlsi_learn_progress_updated", update);
      window.removeEventListener("storage", update);
    };
  }, [session.slug]);

  const track = trackById(session.track);
  const list = orderedSessionsForTrack(session.track);
  const idx = list.findIndex((s) => s.slug === session.slug);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;
  const meta = LEARN_KIND_META[session.kind];
  const isQuiz = session.kind === "quiz" || session.kind === "test";
  const isPractical = session.kind === "practical";
  const isVideo = session.kind === "video";
  const layer = sessionLayer(session);
  const unlocked = layerUnlocked(ent.tier, layer);

  return (
    <div className="px-4 sm:px-6 md:px-10 py-6 md:py-8 w-full max-w-6xl xl:max-w-7xl mx-auto">
      <article className="learn-prose">
        <p
          className="text-xs font-medium uppercase tracking-[0.12em] mb-3 flex flex-wrap items-center gap-2"
          style={{ color: "var(--ln-accent)" }}
        >
          <span>
            {track?.title} · {meta.label} · {session.minutes} min
          </span>
          <LayerBadge layer={layer} />
        </p>
        <h1>{session.title}</h1>
        <p className="text-[0.95em]" style={{ color: "var(--ln-muted)" }}>
          {session.summary}
        </p>
      </article>

      <LearnLayerGate layer={layer} locked={!unlocked}>
        <DigitalVisualizer key={session.slug} slug={session.slug} />

        {isVideo && session.youtubeId && (
          <div className="ln-card overflow-hidden my-6" style={{ maxWidth: "46rem" }}>
            <div
              className="flex items-center gap-2 px-3 py-2 text-xs"
              style={{ borderBottom: "1px solid var(--ln-border)", color: "var(--ln-muted)" }}
            >
              <PlayCircle className="w-4 h-4" style={{ color: "var(--ln-accent)" }} />
              {session.youtubeTitle || "Video"}
            </div>
            <div className="relative w-full aspect-video bg-black">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube-nocookie.com/embed/${session.youtubeId}`}
                title={session.youtubeTitle || session.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        )}

        <div className="mt-6">
          <FormattedProse paragraphs={session.body} />
        </div>

        {session.code && (
          <pre className="ln-code p-4 mt-6">
            <div className="text-[11px] mb-2 opacity-70">{session.code.title}</div>
            <code>{session.code.source}</code>
          </pre>
        )}

        {isPractical && (
          <div className="max-w-5xl mt-8">
            <VlsiPractical session={session} />
          </div>
        )}

        {!isPractical && session.checklist && session.checklist.length > 0 && (
          <div className="ln-card p-5 mt-6 max-w-2xl space-y-3" style={{ color: "var(--ln-text)" }}>
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--ln-muted)] pb-1 border-b border-[var(--ln-border)]">
              Key Concepts &amp; Takeaways
            </div>
            <ul className="space-y-2 text-sm">
              {session.checklist.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed">
                  <span className="text-[var(--ln-accent)] font-bold mt-0.5">·</span>
                  <span>{formatInlineText(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {isQuiz && (
          <div className="max-w-2xl mt-8">
            <VlsiQuiz session={session} />
          </div>
        )}

        {!isQuiz && !isPractical && (
          <button
            type="button"
            onClick={() => setDone(toggleSessionComplete(session.slug))}
            className={`ln-btn mt-8 ${done ? "ln-btn-primary" : ""}`}
          >
            <Check className={`w-3.5 h-3.5 ${done ? "opacity-100" : "opacity-40"}`} />
            <span>{done ? "Completed ✓" : "Mark complete"}</span>
          </button>
        )}
      </LearnLayerGate>

      <LegalDisclaimer compact />

      <nav
        className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6"
        style={{ borderTop: "1px solid var(--ln-border)" }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Link href={learnCourseHref(session.track)} className="ln-btn">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{track?.title} - Home</span>
          </Link>
          {prev && (
            <Link href={learnCourseHref(session.track, prev.slug)} className="ln-btn">
              Prev
            </Link>
          )}
        </div>
        {next && (
          <Link href={learnCourseHref(session.track, next.slug)} className="ln-btn ln-btn-primary">
            <span>Next: {next.title}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </nav>
    </div>
  );
}
