"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, ChevronUp, GraduationCap, ArrowRight } from "lucide-react";
import type { VlsiStudioId } from "@/components/VlsiStudioGate";
import { STUDIO_LEARN_LINKS } from "@/lib/vlsi-studio-learn-bridge";

/**
 * Compact theory strip shown above VLSI studios.
 * Light neumorphic styling to match studio chrome.
 */
export function StudioLearnPanel({ studio }: { studio: VlsiStudioId }) {
  const links = STUDIO_LEARN_LINKS[studio] || [];
  const [open, setOpen] = useState(true);
  if (!links.length) return null;

  return (
    <div className="shrink-0 mx-3 md:mx-5 mt-3 md:mt-4">
      <div className="neu-panel overflow-hidden border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-white to-sky-50/80">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 border border-indigo-200 shrink-0">
              <GraduationCap className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700">
                Related theory · Learn Hub
              </p>
              <p className="text-[11px] font-bold text-slate-600 truncate">
                Master the concepts, then practice in this workstation
              </p>
            </div>
          </div>
          <span className="text-slate-500 shrink-0">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </button>

        {open && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-indigo-100/80 pt-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="group inline-flex max-w-full items-start gap-2 rounded-xl border-2 border-slate-900/10 bg-white px-3 py-2 shadow-[2px_2px_0_rgba(15,23,42,0.08)] hover:border-indigo-400 hover:shadow-[3px_3px_0_rgba(99,102,241,0.25)] transition"
                title={l.blurb}
              >
                <BookOpen className="h-3.5 w-3.5 text-indigo-600 mt-0.5 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[11px] font-black text-slate-900 group-hover:text-indigo-800">
                    {l.title}
                  </span>
                  <span className="block text-[10px] font-bold text-slate-500 line-clamp-1">
                    {l.blurb}
                  </span>
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-indigo-600 mt-0.5 shrink-0" />
              </Link>
            ))}
            <Link
              href="/vlsi/learn"
              className="inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-indigo-300 bg-indigo-50/50 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-indigo-800 hover:bg-indigo-100 transition"
            >
              Full curriculum
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
