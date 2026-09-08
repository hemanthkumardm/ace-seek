"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Cpu,
  Activity,
  Zap,
  ChevronRight,
  GitMerge,
  FolderOpen,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  ArrowRight,
  GraduationCap,
  Boxes,
  Lock,
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import {
  studioMinPlan,
  studioUnlocked,
  type VlsiStudioId,
} from "@/components/VlsiStudioGate";
import { planLabel } from "@/lib/entitlements";
import { OPENROAD_URL } from "@/lib/site";

function StudioCardAction({
  studio,
  href,
  label,
  className,
}: {
  studio: VlsiStudioId;
  href: string;
  label: string;
  className: string;
}) {
  const { ent } = useEntitlements();
  const ok = studioUnlocked(ent.vlsi, studio);
  const min = studioMinPlan(studio);
  if (ok) {
    return (
      <a href={href} className={className}>
        <span>{label}</span>
        <ChevronRight className="w-4 h-4" />
      </a>
    );
  }
  return (
    <div className="space-y-2">
      <a
        href={href}
        className={`${className} opacity-90`}
        title={`${planLabel(min)}+ required`}
      >
        <span className="inline-flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" />
          {label} · {planLabel(min)}+
        </span>
        <ChevronRight className="w-4 h-4" />
      </a>
    </div>
  );
}

export default function VlsiHome() {
  const router = useRouter();
  const { ent, ready, loading: entLoading, isSignedIn } = useEntitlements();

  /** Open studios after account login (plan from session) */
  const handleOpenStudio = () => {
    if (isSignedIn) {
      router.push("/vlsi/reports");
    } else {
      router.push("/vlsi/login?redirect=/vlsi/reports");
    }
  };

  return (
    <div className="m-shell py-10 md:py-14 space-y-12 font-mono">
      {/* Hero Section - Sleek Dark Carbon Panel */}
      <div className="sk-panel p-8 md:p-12 space-y-8 border border-[var(--bevel-highlight)] shadow-2xl relative overflow-hidden bg-[var(--surface-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--bevel-shadow)] text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--accent-cyan)]" />
            <span className="font-bold text-white uppercase tracking-wider text-sm">
              VLSI.ACE-SEEK.COM
            </span>
            <span className="text-[var(--accent-cyan)] font-bold">// HARDWARE EDA SUITE</span>
          </div>
          <div className="flex items-center gap-2">
            <PlanPill tier={ent.tier} ready={ready && !entLoading} />
            <span className="sk-badge sk-badge-live">
              ● 5 WORKSTATIONS ONLINE
            </span>
            <span className="sk-badge text-cyan-300 border-cyan-500/30">
              CADENCE · SYNOPSYS · OPENROAD
            </span>
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-white uppercase">
            LEARN → AUTHOR →{" "}
            <span className="text-[var(--accent-cyan)] bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30 inline-block">
              SIGNOFF
            </span>
          </h1>
          <p className="text-xs md:text-base text-slate-200 leading-relaxed max-w-3xl">
            Textbook-style VLSI Learn Hub (Digital → SDC → STA → Master Cadence / Synopsys / OpenROAD),
            then interactive studios for constraints, timing, MMMC, and UPF — hand off{" "}
            <span className="text-emerald-300 font-bold">OpenROAD-format</span> packs to{" "}
            <a href={OPENROAD_URL} className="text-emerald-300 underline font-bold">
              openroad.ace-seek.com
            </a>
            .
          </p>
        </div>

        {/* Product journey strip */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2">
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/60 to-slate-900/80 border border-amber-500/40 shadow-lg space-y-1.5 relative overflow-hidden">
            <span className="absolute top-2 right-3 text-[10px] font-black text-amber-500/80">01</span>
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-amber-400">
              <GraduationCap className="w-4 h-4" /> Foundations → Master EDA
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Free beginner tracks, Pro expert labs, Max Cadence / Synopsys / Open-Source suites + Ask AI + 34 calculators.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/60 to-slate-900/80 border border-cyan-500/40 shadow-lg space-y-1.5 relative overflow-hidden">
            <span className="absolute top-2 right-3 text-[10px] font-black text-cyan-500/80">02</span>
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-cyan-400">
              <Cpu className="w-4 h-4" /> Interactive studios
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              SDC waveforms, STA ECO, MMMC views, UPF intent — practice what you just studied.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900/80 border border-emerald-500/40 shadow-lg space-y-1.5 relative overflow-hidden">
            <span className="absolute top-2 right-3 text-[10px] font-black text-emerald-500/80">03</span>
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-emerald-400">
              <Zap className="w-4 h-4" /> Signoff & OpenROAD
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Export TCL / SDC packs, classify reports, continue physical flow on OpenROAD.
            </p>
          </div>
        </div>

        {/* Direct Action Hub Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--bevel-shadow)]">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Start free in Learn — unlock studios with your API license key.</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/vlsi/learn"
              className="sk-btn sk-btn-primary !text-sm !py-2.5 !px-5 font-bold uppercase flex items-center gap-2 shadow-[0_0_24px_rgba(245,158,11,0.25)]"
            >
              <GraduationCap className="w-5 h-5" />
              <span>Start Learn (Free)</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleOpenStudio}
              className="sk-btn sk-btn-ghost !text-sm !py-2.5 !px-5 font-bold uppercase flex items-center gap-2 border border-cyan-500/40 text-cyan-100"
            >
              <Cpu className="w-5 h-5" />
              <span>Open Studios</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="/vlsi/login"
              className="sk-btn sk-btn-ghost !text-xs font-bold text-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isSignedIn ? "Account active" : "Sign in"}</span>
            </a>
            <a
              href="https://www.ace-seek.com/pricing"
              target="_blank"
              rel="noreferrer"
              className="sk-btn sk-btn-primary !text-xs font-bold"
            >
              <span>Pricing (main site)</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* VLSI SUITE WORKSTATION CATALOG */}
      <div className="space-y-6">
        <div className="border-b border-[var(--bevel-shadow)] pb-4 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                VLSI Suite Workstation Catalog
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
              Physical Design & Signoff Engines
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono hidden md:inline-block">
            5 Workstations + OpenROAD handoff
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="sk-badge text-amber-300 border-amber-500/30">OPEN</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">VLSI Learn Hub</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Foundations (Free) → Expert (Pro) → Master Cadence / Synopsys / OpenROAD (Max). Ask AI, 34 calculators, then Practice in Studio.
              </p>
            </div>
            <Link
              href="/vlsi/learn"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            >
              <span>Open curriculum</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-gradient-to-br from-amber-950/40 to-[var(--surface-panel)] border border-amber-500/40 shadow-xl hover:border-amber-400 transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="sk-badge text-amber-200 border-amber-400/40">₹2,499 · LIFE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Interview Masterclass</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                280+ Staff-level problems across all 11 domains (DV/UVM, SDC, STA, PnR, UPF, CDC, DFT, RTL, IR Drop, Aptitude & Puzzles) with step-by-step solutions — free previews, then lifetime unlock.
              </p>
            </div>
            <Link
              href="/vlsi/interview-masterclass"
              className="sk-btn sk-btn-primary !bg-amber-500 hover:!bg-amber-400 !text-slate-950 !text-xs w-full justify-between font-black"
            >
              <span>Explore Interview Prep</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">FREE+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">RTL Lab</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                ChipVerify-style Verilog lab: DUT + testbench, Icarus sim, console, VCD waves — in the browser.
              </p>
            </div>
            <a
              href="/vlsi/rtl-lab"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            >
              <span>Open RTL Lab</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 0: Report Hub */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">FREE+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Report Hub</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Centralized dump manager. Drop STA reports, SDC constraints, UPF files, or MMMC setups — auto-classified and handoff ready.
              </p>
            </div>
            <StudioCardAction
              studio="reports"
              href="/vlsi/reports"
              label="Open Report Hub"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            />
          </div>

          {/* Tool 1: SDC Studio */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">FREE+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">SDC Constraint Studio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hyper-interactive SDC constraint generator with dynamic waveforms, clock tree hierarchy, I/O timing budgets, and multicycle shift modeling.
              </p>
            </div>
            <StudioCardAction
              studio="sdc"
              href="/vlsi/sdc-studio"
              label="Open SDC Studio"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            />
          </div>

          {/* Tool 2: Timing Studio */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="sk-badge text-amber-300 border-amber-500/30">PRO+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Timing Studio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                STA report analyzer for PrimeTime, Tempus, and OpenSTA. Interactive path schematic rendering, ECO prediction engine, and script export.
              </p>
            </div>
            <StudioCardAction
              studio="timing"
              href="/vlsi/timing-studio"
              label="Open Timing Studio"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            />
          </div>

          {/* Tool 3: MMMC Studio */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <GitMerge className="w-5 h-5" />
                </div>
                <span className="sk-badge text-purple-300 border-purple-500/30">PRO+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">MMMC Studio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Multi-Mode Multi-Corner view authoring suite. Build library sets, delay corners, constraint modes, and analysis views with Cadence & Synopsys generators.
              </p>
            </div>
            <StudioCardAction
              studio="mmmc"
              href="/vlsi/mmmc-studio"
              label="Open MMMC Studio"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            />
          </div>

          {/* Tool 4: Power Studio */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="sk-badge text-rose-300 border-rose-500/30">MAX+</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Power Studio</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                IEEE 1801 UPF power intent configurator. Manage supply nets, power domains, isolation strategies, level shifters, and power state tables (PST).
              </p>
            </div>
            <StudioCardAction
              studio="power"
              href="/vlsi/power-studio"
              label="Open Power Studio"
              className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
            />
          </div>

          {/* OpenROAD handoff (export on VLSI → upload on openroad peer) */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-emerald-500/40 shadow-xl hover:border-emerald-400 transition-all md:col-span-3 lg:col-span-1">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Boxes className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">HANDOFF</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">
                OpenROAD Export
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Download constraints.sdc + corners.tcl in OpenROAD format from
                your SDC/MMMC work — then upload on openroad.ace-seek.com for Pro
                scripts or Max runs.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <a
                href="/vlsi/openroad-export"
                className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold"
              >
                <span>Export OpenROAD pack</span>
                <ChevronRight className="w-4 h-4" />
              </a>
              <a
                href={OPENROAD_URL}
                className="sk-btn sk-btn-ghost !text-xs w-full justify-between font-bold text-slate-200"
              >
                <span>openroad.ace-seek.com</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
