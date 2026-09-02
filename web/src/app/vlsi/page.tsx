"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
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
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";
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
  const { isSignedIn } = useAuth();
  const { ent, ready, loading: entLoading } = useEntitlements();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const sync = () => {
      const key = localStorage.getItem("ace_seek_api_key");
      setIsAuthorized(Boolean(key && key.trim().length > 0));
    };
    sync();
    window.addEventListener("ace_key_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ace_key_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Open studios only after validated API key is present */
  const handleOpenStudio = () => {
    if (isAuthorized) {
      router.push("/vlsi/reports");
    } else {
      setShowAuthModal(true);
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
            MULTI-MODE MULTI-CORNER, TIMING, SDC &{" "}
            <span className="text-[var(--accent-cyan)] bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30 inline-block">
              POWER INTENT (UPF)
            </span>
          </h1>
          <p className="text-xs md:text-base text-slate-200 leading-relaxed max-w-3xl">
            Author ASIC constraints and timing on VLSI — then download{" "}
            <span className="text-emerald-300 font-bold">OpenROAD-format</span> SDC /
            corners packs and continue on{" "}
            <a href={OPENROAD_URL} className="text-emerald-300 underline font-bold">
              openroad.ace-seek.com
            </a>{" "}
            for Pro scripts or Max runs.
          </p>
        </div>

        {/* Feature Pill Matrix */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-amber-400">
              <Zap className="w-4 h-4" /> SDC Studio
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Interactive constraint generator with real-time waveform visualization.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-cyan-400">
              <Activity className="w-4 h-4" /> Timing Studio
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Parse PrimeTime & Tempus reports with multi-path ECO recommendations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-purple-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-purple-400">
              <GitMerge className="w-4 h-4" /> MMMC Studio
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Multi-mode corner matrix configuration & Cadence/Synopsys TCL generation.
            </p>
          </div>
        </div>

        {/* Direct Action Hub Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[var(--bevel-shadow)]">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Click below to open the VLSI workstation suite (API Key authorization required).</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/vlsi/learn"
              className="sk-btn sk-btn-primary !text-sm !py-2.5 !px-5 font-bold uppercase flex items-center gap-2"
            >
              <GraduationCap className="w-5 h-5" />
              <span>VLSI Learn</span>
              <ArrowRight className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={handleOpenStudio}
              className="sk-btn sk-btn-primary !text-sm !py-2.5 !px-5 font-bold uppercase flex items-center gap-2"
            >
              <Cpu className="w-5 h-5" />
              <span>Open VLSI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="sk-btn sk-btn-ghost !text-xs font-bold text-slate-200"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>{isAuthorized ? "API Key Active" : "API Key Login"}</span>
            </button>
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
              <h3 className="text-base font-bold uppercase text-white">VLSI Learn</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Digital design, Verilog, SystemVerilog, synthesis, UVM — a readable course index, not a studio. RTL Lab stays in VLSI Studio.
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

      {/* Subdomain Auth Section */}
      <div id="identity-section" className="pt-4">
        <SubdomainAuthModal subdomainName="VLSI" />
      </div>

      {/* Pop-up Auth Modal when OPEN VLSI STUDIO is clicked without being logged in */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white font-black border-2 border-black shadow-[2px_2px_0_#000000] flex items-center justify-center z-10 hover:bg-rose-600"
            >
              ✕
            </button>
            <SubdomainAuthModal
              subdomainName="VLSI"
              onAuthorize={() => {
                setIsAuthorized(true);
                setShowAuthModal(false);
                router.push("/vlsi/reports");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
