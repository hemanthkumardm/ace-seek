"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  LEARN_GROUPS,
  learnCourseHref,
  orderedSessionsForTrack,
  tracksForGroup,
  type LearnGroupId,
} from "@/lib/vlsi-curriculum";
import { loadLearnProgress } from "@/lib/vlsi-learn-progress";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { VlsiLearnAskAiBox } from "@/components/learn/VlsiLearnAskAiBox";
import {
  ArrowRight,
  Sparkles,
  Lock,
  Cpu,
  Layers,
  Zap,
  Activity,
  CheckSquare,
  Calculator,
} from "lucide-react";

type EdaKey = "cadence" | "synopsys" | "opensource";

const EDA_CONFIG: Record<
  EdaKey,
  {
    groupId: LearnGroupId;
    name: string;
    badge: string;
    color: string;
    borderColor: string;
    bgGlow: string;
    blurb: string;
    tools: string[];
  }
> = {
  cadence: {
    groupId: "cadence_eda",
    name: "Cadence EDA",
    badge: "Master · MAX Tier",
    color: "#f59e0b",
    borderColor: "rgba(245, 158, 11, 0.4)",
    bgGlow: "rgba(245, 158, 11, 0.08)",
    blurb: "Cadence silicon signoff suite: Genus Synthesis, Innovus PODV2 P&R, Voltus Rail Integrity, Tempus Signoff STA, and Conformal LEC.",
    tools: ["Genus", "Innovus", "Voltus", "Tempus", "Conformal LEC"],
  },
  synopsys: {
    groupId: "synopsys_eda",
    name: "Synopsys EDA",
    badge: "Master · MAX Tier",
    color: "#a855f7",
    borderColor: "rgba(168, 85, 247, 0.4)",
    bgGlow: "rgba(168, 85, 247, 0.08)",
    blurb: "Synopsys production silicon flow: Design Compiler Ultra, IC Compiler II (NDM), PrimePower (PTPX), PrimeTime SI (DMSA), and Formality.",
    tools: ["Design Compiler", "IC Compiler II", "PrimePower", "PrimeTime", "Formality"],
  },
  opensource: {
    groupId: "opensource_eda",
    name: "Open-Source EDA",
    badge: "Master · MAX Tier",
    color: "#10b981",
    borderColor: "rgba(16, 185, 129, 0.4)",
    bgGlow: "rgba(16, 185, 129, 0.08)",
    blurb: "Complete open-source silicon stack: Yosys & ABC Synthesis, OpenROAD Autonomous P&R, PSM Rail Analysis, OpenSTA, and Yosys Formal Miter verification.",
    tools: ["Yosys & ABC", "OpenROAD", "OpenROAD PSM", "OpenSTA", "Yosys Formal"],
  },
};

const FLOW_STAGE_ICONS = [
  <Cpu key="synth" className="w-4 h-4" />,
  <Layers key="pnr" className="w-4 h-4" />,
  <Zap key="pwr" className="w-4 h-4" />,
  <Activity key="sta" className="w-4 h-4" />,
  <CheckSquare key="lec" className="w-4 h-4" />,
];

export default function VlsiLearnHub() {
  const [done, setDone] = useState<string[]>([]);
  const [activeEda, setActiveEda] = useState<EdaKey>("cadence");

  useEffect(() => {
    const update = () => setDone(loadLearnProgress().completed);
    update();
    window.addEventListener("ace_vlsi_learn_progress_updated", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("ace_vlsi_learn_progress_updated", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  const coreGroups = LEARN_GROUPS.filter(
    (g) => !["cadence_eda", "synopsys_eda", "opensource_eda"].includes(g.id)
  );

  const activeEdaConfig = EDA_CONFIG[activeEda];
  const edaTracks = tracksForGroup(activeEdaConfig.groupId);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-10 py-10 md:py-14 space-y-12">
      {/* Header */}
      <header className="max-w-2xl space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ln-accent)" }}>
          Course catalog
        </p>
        <h1 className="text-3xl md:text-[2.4rem] font-semibold tracking-tight leading-tight" style={{ color: "var(--ln-text)" }}>
          Learn VLSI the way you read a good book
        </h1>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ln-muted)" }}>
          Pick a subject. Each course opens its own tutorial — Digital Design is only Digital Design,
          Tcl is only Tcl — with a left-hand index like a textbook.
        </p>
        <ul className="flex flex-wrap gap-2 pt-1 text-[12px]">
          {[
            ["Beginner", "Free"],
            ["Standard", "Free"],
            ["Expert", "Pro"],
            ["Master", "Max"],
          ].map(([layer, plan]) => (
            <li
              key={layer}
              className="px-2.5 py-1 rounded-full"
              style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
            >
              <span className="font-semibold">{layer}</span>
              <span style={{ opacity: 0.75 }}> · {plan}</span>
            </li>
          ))}
        </ul>
      </header>

      {/* 🧮 Featured VLSI Production Calculators Hub */}
      <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[11px] font-mono font-semibold">
            <Calculator className="w-3.5 h-3.5 text-indigo-400" />
            34 LIVE PRODUCTION CALCULATORS
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            VLSI Production Engineering Calculator Suite
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Interactive mathematical calculators for Floorplanning, Core/Die Sizing, Power Rings/Stripes, CTS Useful Skew, Process Antenna Diodes, Dynamic IR Drop, and RTL Logic Synthesis.
          </p>
        </div>

        <Link
          href="/vlsi/learn/c/cadence-pnr/vlsi-calculators"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Calculator className="w-4 h-4" />
          Launch Calculator Hub
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* 💬 Ask AI Box: Questions & Concepts Clarification */}
      <VlsiLearnAskAiBox />

      {/* 🚀 EDA Tool Ecosystems Section (3-Button Switcher, Master MAX Only) */}
      <section
        className="rounded-2xl p-6 sm:p-8 space-y-6 transition-all duration-300 relative overflow-hidden"
        style={{
          background: "var(--ln-card-bg, rgba(255, 255, 255, 0.03))",
          border: `1px solid ${activeEdaConfig.borderColor}`,
          boxShadow: `0 10px 30px -10px ${activeEdaConfig.bgGlow}`,
        }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"
                style={{
                  background: activeEdaConfig.bgGlow,
                  color: activeEdaConfig.color,
                  border: `1px solid ${activeEdaConfig.borderColor}`,
                }}
              >
                <Sparkles className="w-3 h-3" />
                Master · MAX Plan Only
              </span>
              <span className="text-xs text-[var(--ln-muted)]">5 Flow-Wise Subjects Each</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: "var(--ln-text)" }}>
              EDA Tool Ecosystems
            </h2>
            <p className="text-sm max-w-xl" style={{ color: "var(--ln-muted)" }}>
              Deep-dive through every production phase: Synthesis, Physical Design, Power Analysis, STA, and Logic Equivalence.
            </p>
          </div>

          {/* 3 EDA Selection Buttons */}
          <div
            className="inline-flex p-1 rounded-xl gap-1 self-start md:self-auto shrink-0"
            style={{ background: "var(--ln-bg-elev, rgba(0, 0, 0, 0.2))", border: "1px solid var(--ln-border)" }}
          >
            {(["cadence", "synopsys", "opensource"] as EdaKey[]).map((key) => {
              const cfg = EDA_CONFIG[key];
              const isSelected = activeEda === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveEda(key)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5"
                  style={{
                    background: isSelected ? cfg.color : "transparent",
                    color: isSelected ? "#000" : "var(--ln-text)",
                    fontWeight: isSelected ? 700 : 500,
                    boxShadow: isSelected ? `0 2px 10px ${cfg.bgGlow}` : "none",
                  }}
                >
                  <Lock className="w-3 h-3 opacity-70" />
                  {cfg.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected EDA Blurb & Tool Chips */}
        <div
          className="p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
          style={{ background: "var(--ln-bg-elev, rgba(0,0,0,0.15))", border: "1px solid var(--ln-border)" }}
        >
          <p style={{ color: "var(--ln-muted)" }} className="leading-relaxed">
            {activeEdaConfig.blurb}
          </p>
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {activeEdaConfig.tools.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded text-[11px] font-mono font-medium"
                style={{
                  background: activeEdaConfig.bgGlow,
                  color: activeEdaConfig.color,
                  border: `1px solid ${activeEdaConfig.borderColor}`,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Flow-Wise Subject Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {edaTracks.map((track, idx) => {
            const sessions = orderedSessionsForTrack(track.id);
            const n = sessions.filter((s) => done.includes(s.slug)).length;
            const pct = sessions.length ? Math.round((n / sessions.length) * 100) : 0;
            const icon = FLOW_STAGE_ICONS[idx % FLOW_STAGE_ICONS.length];

            return (
              <Link
                key={track.id}
                href={learnCourseHref(track.id)}
                className="ln-card p-5 flex flex-col gap-3.5 hover:brightness-[1.03] transition group relative"
                style={{
                  border: `1px solid ${activeEdaConfig.borderColor}`,
                  background: "var(--ln-bg-elev, rgba(255,255,255,0.02))",
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: activeEdaConfig.bgGlow, color: activeEdaConfig.color }}
                  >
                    {icon}
                  </div>
                  <span
                    className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded"
                    style={{ background: activeEdaConfig.bgGlow, color: activeEdaConfig.color }}
                  >
                    Stage 0{idx + 1}
                  </span>
                </div>

                <div className="min-w-0 space-y-1">
                  <h3 className="font-bold text-[15px] group-hover:text-[var(--ln-accent)] transition-colors" style={{ color: "var(--ln-text)" }}>
                    {track.title}
                  </h3>
                  <p className="text-[12.5px] leading-relaxed line-clamp-2" style={{ color: "var(--ln-muted)" }}>
                    {track.blurb}
                  </p>
                </div>

                <div className="mt-auto pt-2 border-t space-y-2" style={{ borderColor: "var(--ln-border)" }}>
                  <div className="flex items-center justify-between text-[11px]" style={{ color: "var(--ln-muted)" }}>
                    <span>{sessions.length} Lessons</span>
                    <span className="font-semibold" style={{ color: activeEdaConfig.color }}>
                      {n}/{sessions.length} done
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ln-hover)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${pct}%`,
                        background: activeEdaConfig.color,
                      }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Core Foundational Courses */}
      <div className="space-y-10">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: "var(--ln-accent)" }}>
            Foundations & Languages
          </p>
          <h2 className="text-xl font-bold tracking-tight" style={{ color: "var(--ln-text)" }}>
            Core VLSI Knowledge Tracks
          </h2>
        </div>

        {coreGroups.map((group) => {
          const tracks = tracksForGroup(group.id);
          if (!tracks.length) return null;
          return (
            <section key={group.id} className="space-y-4">
              <div>
                <h3 className="text-base font-semibold tracking-tight" style={{ color: "var(--ln-text)" }}>
                  {group.title}
                </h3>
                <p className="text-sm" style={{ color: "var(--ln-muted)" }}>
                  {group.blurb}
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {tracks.map((track) => {
                  const sessions = orderedSessionsForTrack(track.id);
                  const n = sessions.filter((s) => done.includes(s.slug)).length;
                  const pct = sessions.length ? Math.round((n / sessions.length) * 100) : 0;
                  return (
                    <Link
                      key={track.id}
                      href={learnCourseHref(track.id)}
                      className="ln-card p-5 flex flex-col gap-3 hover:brightness-[1.02] transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[15px]" style={{ color: "var(--ln-text)" }}>
                            {track.title}
                          </h4>
                          <p className="text-[13px] leading-relaxed mt-1" style={{ color: "var(--ln-muted)" }}>
                            {track.blurb}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 shrink-0 mt-1" style={{ color: "var(--ln-muted)" }} />
                      </div>
                      <div className="mt-auto">
                        <div
                          className="h-1 rounded-full overflow-hidden"
                          style={{ background: "var(--ln-hover)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${pct}%`, background: "var(--ln-accent)" }}
                          />
                        </div>
                        <p className="text-[11px] mt-1.5" style={{ color: "var(--ln-muted)" }}>
                          {sessions.length} lessons · {n} done
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
      <LegalDisclaimer />
    </div>
  );
}
