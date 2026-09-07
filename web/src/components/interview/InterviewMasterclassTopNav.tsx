"use client";

import React from "react";
import Link from "next/link";
import {
  Building2,
  Sparkles,
  ArrowLeft,
  CreditCard,
  GraduationCap,
  ExternalLink,
  Layers,
} from "lucide-react";
import {
  COMPANIES_METADATA,
  INTERVIEW_BUNDLE_PRICING,
  INTERVIEW_QUESTIONS_BANK,
} from "@/lib/vlsi-interview-masterclass-data";

interface Props {
  selectedDomain: string;
  onSelectDomain: (domainId: string) => void;
  isUnlocked?: boolean;
  onOpenCheckout?: () => void;
}

export function InterviewMasterclassTopNav({
  selectedDomain = "all",
  onSelectDomain,
  isUnlocked = false,
  onOpenCheckout,
}: Props) {
  return (
    <header className="relative border-b-2 border-slate-800 bg-[#070b14] shadow-xl">
      {/* Top Row: Brand & CTA */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Page Info */}
        <div className="flex items-center gap-3">
          <Link
            href="/vlsi/learn"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-xs font-mono text-slate-300 hover:text-white transition-all"
            title="Return to VLSI Learn Hub"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Learn Hub</span>
          </Link>

          <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="font-black text-white text-base tracking-tight font-sans">
              Ace-Seek
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-amber-400 text-slate-950 uppercase shadow-sm">
              Interview Masterclass
            </span>
          </div>
        </div>

        {/* Right CTA / Lifetime Access */}
        <div className="flex items-center gap-3">
          {isUnlocked ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lifetime Access Active</span>
            </div>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 line-through">
                  {INTERVIEW_BUNDLE_PRICING.originalPrice}
                </span>
                <span className="text-amber-300 font-black">
                  {INTERVIEW_BUNDLE_PRICING.offerPrice} ({INTERVIEW_BUNDLE_PRICING.offerPriceUsd})
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenCheckout}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-black bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-md shadow-amber-950/40 transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Unlock Lifetime Access</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Row 2: Domains Bar (Synthesis, CDC, STA, PnR, etc.) */}
      <div className="border-t border-slate-800/80 bg-slate-950/95 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-2 min-w-max">
          <span className="text-[11px] font-mono font-bold uppercase text-slate-400 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Curriculum Domains:</span>
          </span>

          {/* All Domains */}
          <button
            type="button"
            onClick={() => onSelectDomain("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border ${
              selectedDomain === "all"
                ? "bg-purple-500 border-purple-400 text-white shadow-md shadow-purple-950/40"
                : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
            }`}
          >
            All Questions ({INTERVIEW_QUESTIONS_BANK.length})
          </button>

          {/* Individual Domain Buttons */}
          {[
            { id: "synthesis-sdc", label: "Logic Synthesis & SDC", color: "#eab308" },
            { id: "clock-domain-crossing", label: "CDC & Metastability", color: "#a855f7" },
            { id: "static-timing-analysis", label: "Static Timing (STA)", color: "#38bdf8" },
            { id: "physical-design", label: "Physical Design (PnR)", color: "#10b981" },
            { id: "low-power-upf", label: "Low Power UPF", color: "#84cc16" },
            { id: "design-verification", label: "Design Verification", color: "#14b8a6" },
          ].map((dom) => {
            const count = INTERVIEW_QUESTIONS_BANK.filter(
              (q) => q.domain === dom.id
            ).length;
            const active = selectedDomain === dom.id;

            return (
              <button
                key={dom.id}
                type="button"
                onClick={() => onSelectDomain(dom.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                  active
                    ? "bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-950/40 font-black"
                    : "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dom.color }}
                />
                <span>{dom.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      active
                        ? "bg-slate-950 text-purple-200 font-bold"
                        : "bg-slate-800 text-slate-400 border border-slate-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
