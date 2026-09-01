"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import {
  LEARN_KIND_META,
  LEARN_LAYER_META,
  LEARN_LAYER_ORDER,
  firstSessionOfTrack,
  learnCourseHref,
  orderedSessionsForTrack,
  sessionLayer,
  topicIndexLabel,
  trackById,
} from "@/lib/vlsi-curriculum";
import { loadLearnProgress } from "@/lib/vlsi-learn-progress";
import { layerUnlocked } from "@/lib/vlsi-learn-access";
import { useEntitlements } from "@/hooks/useEntitlements";

export default function CourseHomePage() {
  const params = useParams();
  const trackId = String(params.track || "");
  const track = trackById(trackId);
  const { ent } = useEntitlements();
  const [done, setDone] = useState<string[]>([]);

  useEffect(() => {
    const update = () => setDone(loadLearnProgress().completed);
    update();
    window.addEventListener("ace_vlsi_learn_progress_updated", update);
    return () => window.removeEventListener("ace_vlsi_learn_progress_updated", update);
  }, []);

  if (!track) {
    return (
      <div className="max-w-xl mx-auto px-6 py-16 space-y-3">
        <p className="font-medium">Course not found.</p>
        <Link href="/vlsi/learn" className="ln-btn inline-flex">
          All courses
        </Link>
      </div>
    );
  }

  const sessions = orderedSessionsForTrack(track.id);
  const first = firstSessionOfTrack(track.id);
  const nDone = sessions.filter((s) => done.includes(s.slug)).length;

  return (
    <div className="px-5 md:px-10 py-8 md:py-10 max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ln-accent)" }}>
          {track.title} tutorial
        </p>
        <h1 className="text-3xl font-semibold tracking-tight" style={{ color: "var(--ln-text)" }}>
          {track.title} - Home
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ln-muted)" }}>
          {track.blurb} Use the index on the left like a textbook table of contents — this page is
          only {track.title}, not the rest of Learn.{" "}
          <Link href="/vlsi/learn" className="underline" style={{ color: "var(--ln-accent)" }}>
            Back to all courses
          </Link>
          .
        </p>
        <p className="text-sm" style={{ color: "var(--ln-muted)" }}>
          {sessions.length} topics · {nDone} completed
        </p>
        {first && (
          <Link href={learnCourseHref(track.id, first.slug)} className="ln-btn ln-btn-primary inline-flex">
            Start with {topicIndexLabel(track.title, first)}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </header>

      {LEARN_LAYER_ORDER.map((layer) => {
        const layerSessions = sessions.filter((s) => sessionLayer(s) === layer);
        if (!layerSessions.length) return null;
        const meta = LEARN_LAYER_META[layer];
        const open = layerUnlocked(ent.tier, layer);
        return (
          <section key={layer} className="space-y-2">
            <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--ln-muted)" }}>
              {meta.label} · {meta.plan}
              {!open ? " · locked" : ""}
            </h2>
            <ol className="ln-card divide-y" style={{ borderColor: "var(--ln-border)" }}>
              {layerSessions.map((s, i) => (
                <li key={s.slug}>
                  <Link
                    href={learnCourseHref(track.id, s.slug)}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-[var(--ln-hover)]"
                    style={{ opacity: open ? 1 : 0.6 }}
                  >
                    <span>
                      <span className="font-medium" style={{ color: "var(--ln-text)" }}>
                        {i + 1}. {topicIndexLabel(track.title, s)}
                      </span>
                      <span className="block text-[11px]" style={{ color: "var(--ln-muted)" }}>
                        {LEARN_KIND_META[s.kind].label} · {s.minutes} min
                      </span>
                    </span>
                    <ArrowRight className="w-4 h-4 shrink-0" style={{ color: "var(--ln-muted)" }} />
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        );
      })}
    </div>
  );
}
