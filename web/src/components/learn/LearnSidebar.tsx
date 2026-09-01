"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Home, Lock, Search, Calculator, Sparkles } from "lucide-react";
import {
  LEARN_KIND_META,
  LEARN_LAYER_META,
  LEARN_LAYER_ORDER,
  learnCourseHref,
  orderedSessionsForTrack,
  sessionLayer,
  topicIndexLabel,
  trackById,
} from "@/lib/vlsi-curriculum";
import { loadLearnProgress } from "@/lib/vlsi-learn-progress";
import { useLearnPrefs } from "@/components/learn/LearnShell";
import { layerUnlocked } from "@/lib/vlsi-learn-access";
import { useEntitlements } from "@/hooks/useEntitlements";

export function LearnSidebar({
  activeSlug,
  activeTrack,
}: {
  activeSlug: string;
  activeTrack?: string;
}) {
  const { sidebarOpen, setSidebarOpen } = useLearnPrefs();
  const { ent } = useEntitlements();
  const [q, setQ] = useState("");
  const [done, setDone] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const track = activeTrack ? trackById(activeTrack) : undefined;

  useEffect(() => {
    const update = () => setDone(loadLearnProgress().completed);
    update();
    setReady(true);
    window.addEventListener("ace_vlsi_learn_progress_updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("ace_vlsi_learn_progress_updated", update);
      window.removeEventListener("storage", update);
    };
  }, [activeSlug]);

  const query = q.trim().toLowerCase();
  const sessions = useMemo(() => {
    if (!track) return [];
    return orderedSessionsForTrack(track.id).filter((s) => {
      if (!query) return true;
      const label = topicIndexLabel(track.title, s).toLowerCase();
      return label.includes(query) || s.title.toLowerCase().includes(query);
    });
  }, [track, query]);

  if (!track) return null;

  const nDone = orderedSessionsForTrack(track.id).filter((s) => done.includes(s.slug)).length;
  const total = orderedSessionsForTrack(track.id).length;
  const homeActive = !activeSlug;

  const renderBody = () => (
    <aside
      className="w-[280px] shrink-0 h-full min-h-0 overflow-y-auto border-r px-3 py-3 space-y-3"
      style={{
        background: "var(--ln-sidebar)",
        borderColor: "var(--ln-border)",
        color: "var(--ln-text)",
      }}
    >
      <Link
        href="/vlsi"
        data-ln="vlsi-home-sidebar"
        className="flex items-center gap-1.5 text-[12px] font-medium px-1 py-1 rounded hover:underline"
        style={{ color: "var(--ln-accent)" }}
      >
        <Home className="w-3.5 h-3.5" />
        VLSI home
      </Link>

      <Link
        href="/vlsi/learn"
        className="flex items-center gap-1.5 text-[12px] font-medium px-1 py-1 rounded hover:underline"
        style={{ color: "var(--ln-accent)" }}
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        All courses
      </Link>

      <div className="px-1">
        <p className="text-[15px] font-bold leading-tight">{track.title}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--ln-muted)" }} suppressHydrationWarning>
          {ready ? `${nDone}/${total} done · this course only` : "this course"}
        </p>
      </div>

      <div className="relative">
        <Search
          className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--ln-muted)" }}
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${track.title}…`}
          className="w-full rounded-lg pl-8 pr-2 py-1.5 text-xs outline-none"
          style={{
            background: "var(--ln-bg-elev)",
            border: "1px solid var(--ln-border)",
            color: "var(--ln-text)",
          }}
        />
      </div>

      {/* Quick Launch VLSI Calculator Suite */}
      <Link
        href="/vlsi/learn/c/cadence-pnr/vlsi-calculators"
        onClick={() => setSidebarOpen(false)}
        className="flex items-center justify-between p-2 rounded-xl border border-indigo-500/30 bg-indigo-950/30 hover:bg-indigo-950/60 transition-all text-xs font-mono group"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
            <Calculator className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-white group-hover:text-indigo-300">VLSI Calculator Hub</div>
            <div className="text-[10px] text-slate-400">34 Production Sizers</div>
          </div>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
      </Link>

      <nav className="space-y-0.5">
        <Link
          href={learnCourseHref(track.id)}
          onClick={() => setSidebarOpen(false)}
          className="block rounded-md px-2.5 py-1.5 text-[13px]"
          style={{
            background: homeActive ? "var(--ln-accent-soft)" : "transparent",
            color: homeActive ? "var(--ln-accent)" : "var(--ln-text)",
            fontWeight: homeActive ? 650 : 500,
          }}
        >
          {track.title} - Home
        </Link>

        {LEARN_LAYER_ORDER.map((layer) => {
          const layerSessions = sessions.filter((s) => sessionLayer(s) === layer);
          if (!layerSessions.length) return null;
          const meta = LEARN_LAYER_META[layer];
          const open = layerUnlocked(ent.tier, layer);
          return (
            <div key={layer} className="pt-2">
              <p
                className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2.5 pb-1"
                style={{ color: "var(--ln-muted)" }}
              >
                {!open && <Lock className="w-3 h-3" />}
                {meta.label}
                <span style={{ opacity: 0.7 }}>· {meta.plan}</span>
              </p>
              {layerSessions.map((s) => {
                const active = s.slug === activeSlug;
                const complete = done.includes(s.slug);
                return (
                  <Link
                    key={s.slug}
                    href={learnCourseHref(track.id, s.slug)}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-start gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] leading-snug"
                    style={{
                      background: active ? "var(--ln-accent-soft)" : "transparent",
                      color: active ? "var(--ln-accent)" : "var(--ln-text)",
                      fontWeight: active ? 600 : 450,
                      opacity: open ? 1 : 0.65,
                    }}
                  >
                    <span
                      className="mt-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: complete ? "var(--ln-accent)" : "transparent",
                        color: complete ? "var(--ln-bg)" : "var(--ln-muted)",
                        border: complete ? "none" : "1px solid var(--ln-border)",
                      }}
                    >
                      {complete ? <Check className="w-2.5 h-2.5" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block">{topicIndexLabel(track.title, s)}</span>
                      <span className="block text-[10px] font-normal" style={{ color: "var(--ln-muted)" }}>
                        {LEARN_KIND_META[s.kind].label}
                        {!open ? " · locked" : ""}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block h-full min-h-0">{renderBody()}</div>
      {sidebarOpen && (
        <div className="md:hidden absolute inset-0 z-20 flex">
          <div className="h-full">{renderBody()}</div>
          <button
            type="button"
            className="flex-1 bg-black/40"
            aria-label="Close index"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}
    </>
  );
}
