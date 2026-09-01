"use client";

import React from "react";
import Link from "next/link";
import {
  BookOpen,
  Moon,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Minus,
  Plus,
  Cpu,
  Menu,
  Calculator,
} from "lucide-react";
import { useLearnPrefs } from "@/components/learn/LearnShell";
import { trackById } from "@/lib/vlsi-curriculum";
import { useEntitlements } from "@/hooks/useEntitlements";
import { planLabel } from "@/lib/entitlements";
import { LearnProgressTracker } from "@/components/learn/LearnProgressTracker";

export function LearnTopbar({ activeTrack, catalog }: { activeTrack?: string; catalog?: boolean }) {
  const { theme, setTheme, font, setFont, focus, setFocus, sidebarOpen, setSidebarOpen } =
    useLearnPrefs();
  const { ent } = useEntitlements();
  const track = activeTrack ? trackById(activeTrack) : undefined;

  return (
    <header
      className="shrink-0 h-12 px-3 md:px-4 flex items-center gap-2 border-b"
      style={{ borderColor: "var(--ln-border)", background: "var(--ln-bg-elev)" }}
    >
      {!catalog && (
        <div className="md:hidden">
          <button
            type="button"
            className="ln-btn !px-2"
            aria-label="Open index"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      )}

      <Link href="/vlsi/learn" className="flex items-center gap-2 min-w-0 mr-auto">
        <span
          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
        >
          <BookOpen className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-sm tracking-tight truncate" style={{ color: "var(--ln-text)" }}>
          VLSI Learn
        </span>
        {track && (
          <span className="hidden sm:inline text-xs truncate" style={{ color: "var(--ln-muted)" }}>
            / {track.title}
          </span>
        )}
      </Link>

      <span
        className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
        style={{ background: "var(--ln-hover)", color: "var(--ln-muted)" }}
        title="Beginner+Standard free · Expert Pro · Master Max"
      >
        {planLabel(ent.tier === "guest" ? "free" : ent.tier)}
      </span>

      <div className="hidden sm:flex items-center gap-1">
        <button
          type="button"
          className="ln-btn !px-2"
          title="Smaller type"
          onClick={() => setFont(font === "lg" ? "md" : "sm")}
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] w-10 text-center" style={{ color: "var(--ln-muted)" }}>
          {font === "sm" ? "A" : font === "lg" ? "A+" : "A"}
        </span>
        <button
          type="button"
          className="ln-btn !px-2"
          title="Larger type"
          onClick={() => setFont(font === "sm" ? "md" : "lg")}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        className="ln-btn !px-2"
        title={focus ? "Show index" : "Focus mode"}
        onClick={() => setFocus(!focus)}
      >
        {focus ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        <span className="hidden md:inline text-xs">Focus</span>
      </button>

      <button
        type="button"
        data-ln="theme-toggle"
        className="ln-btn !px-2"
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        title={theme === "dark" ? "Light mode" : "Dark mode"}
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        suppressHydrationWarning
      >
        {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>

      {/* VLSI Production Calculators Hub */}
      <Link
        href="/vlsi/learn/c/cadence-pnr/vlsi-calculators"
        className="ln-btn !px-2.5 flex items-center gap-1.5 font-semibold text-xs border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 shadow-sm"
        title="34 Production VLSI Engineering Calculators"
      >
        <Calculator className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline font-mono">Calculators</span>
      </Link>

      {/* Advanced Progress Tracker */}
      <LearnProgressTracker />

      <Link href="/vlsi" className="ln-btn !px-2" title="VLSI Studio">
        <Cpu className="w-4 h-4" />
        <span className="hidden lg:inline text-xs">Studio</span>
      </Link>
    </header>
  );
}
