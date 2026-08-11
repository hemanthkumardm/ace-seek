"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";

export default function VlsiHome() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = localStorage.getItem("ace_seek_api_key");
    if (key && key.trim().length > 0) {
      setIsAuthorized(true);
    }
  }, []);

  const handleOpenStudio = () => {
    if (isSignedIn || isAuthorized) {
      router.push("/vlsi/reports");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <div className="m-shell py-10 md:py-14 space-y-12 font-mono">
      {/* Hero Section - Neo-Brutalist High Contrast Container */}
      <div className="brutal-panel p-8 md:p-12 space-y-8 !border-4 !border-black !shadow-[8px_8px_0_#000000] bg-[var(--surface-panel)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-3 border-black text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[var(--brutal-yellow)]" />
            <span className="font-black text-white uppercase tracking-wider text-sm">
              VLSI.ACE-SEEK.COM
            </span>
            <span className="text-[var(--brutal-cyan)] font-bold">// HARDWARE EDA SUITE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="brutal-badge brutal-badge-lime">
              ● 5 WORKSTATIONS ONLINE
            </span>
            <span className="brutal-badge brutal-badge-cyan">
              CADENCE & SYNOPSYS
            </span>
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl md:text-6xl font-black tracking-tight leading-[1.05] text-white uppercase">
            MULTI-MODE MULTI-CORNER, TIMING, SDC &{" "}
            <span className="bg-rose-500 text-white px-2 py-0.5 border-2 border-black inline-block shadow-[3px_3px_0_#000000]">
              POWER INTENT (UPF)
            </span>
          </h1>
          <p className="text-xs md:text-base text-slate-200 leading-relaxed font-bold max-w-3xl">
            The next-generation web application suite built for physical design, timing closure, and signoff engineers. Author, analyze, lint, and export production-ready TCL & SDC constraints.
          </p>
        </div>

        {/* Feature Pill Matrix */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="bg-[var(--brutal-yellow)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-black" /> SDC Studio
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Interactive constraint generator with real-time waveform visualization.
            </p>
          </div>

          <div className="bg-[var(--brutal-cyan)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Timing Studio
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Parse PrimeTime & Tempus reports with multi-path ECO recommendations.
            </p>
          </div>

          <div className="bg-indigo-400 text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <GitMerge className="w-4 h-4" /> MMMC Studio
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Multi-mode corner matrix configuration & Cadence/Synopsys TCL generation.
            </p>
          </div>
        </div>

        {/* Direct Action Hub Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-3 border-black">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span>Click below to open the VLSI workstation suite (API Key authorization required).</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Primary Action Button */}
            <button
              type="button"
              onClick={handleOpenStudio}
              className="brutal-btn brutal-btn-cyan !text-sm !py-3 !px-6 font-black uppercase flex items-center gap-2 shadow-[4px_4px_0_#000000]"
            >
              <Cpu className="w-5 h-5 text-black" />
              <span>Open VLSI Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="brutal-btn bg-white text-black hover:bg-slate-100 !text-xs font-black"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isSignedIn || isAuthorized ? "API Key Active" : "API Key Login"}</span>
            </button>
            <a
              href="https://www.ace-seek.com/pricing"
              target="_blank"
              rel="noreferrer"
              className="brutal-btn brutal-btn-yellow !text-xs font-black"
            >
              <span>Pricing (main site)</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* VLSI SUITE WORKSTATION CATALOG */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-4 flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-[var(--brutal-yellow)]" />
              <span className="text-xs font-black uppercase tracking-wider text-[var(--brutal-yellow)]">
                VLSI Suite Workstation Catalog
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
              Physical Design & Signoff Engines
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400 font-mono hidden md:inline-block">
            5 Professional Workstations
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Tool 0: Report Hub */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-slate-800 border-2 border-black flex items-center justify-center text-white">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Report Hub</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Centralized dump manager. Drop STA reports, SDC constraints, UPF files, or MMMC setups — auto-classified and handoff ready.
              </p>
            </div>
            <a
              href="/vlsi/reports"
              className="brutal-btn bg-slate-800 text-white hover:bg-slate-700 !text-xs w-full justify-between font-black"
            >
              <span>Open Report Hub</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 1: SDC Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-cyan)] border-2 border-black flex items-center justify-center text-black">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">SDC Constraint Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Hyper-interactive SDC constraint generator with dynamic waveforms, clock tree hierarchy, I/O timing budgets, and multicycle shift modeling.
              </p>
            </div>
            <a href="/vlsi/sdc-studio" className="brutal-btn brutal-btn-cyan !text-xs w-full justify-between font-black">
              <span>Open SDC Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 2: Timing Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Timing Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                STA report analyzer for PrimeTime, Tempus, and OpenSTA. Interactive path schematic rendering, ECO prediction engine, and script export.
              </p>
            </div>
            <a href="/vlsi/timing-studio" className="brutal-btn brutal-btn-yellow !text-xs w-full justify-between font-black">
              <span>Open Timing Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 3: MMMC Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-indigo-500 border-2 border-black flex items-center justify-center text-white">
                  <GitMerge className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">MMMC Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Multi-Mode Multi-Corner view authoring suite. Build library sets, delay corners, constraint modes, and analysis views with Cadence & Synopsys generators.
              </p>
            </div>
            <a href="/vlsi/mmmc-studio" className="brutal-btn bg-indigo-500 text-white hover:bg-indigo-600 !text-xs w-full justify-between font-black">
              <span>Open MMMC Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 4: Power Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-rose-500 border-2 border-black flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Power Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                IEEE 1801 UPF power intent configurator. Manage supply nets, power domains, isolation strategies, level shifters, and power state tables (PST).
              </p>
            </div>
            <a
              href="/vlsi/power-studio"
              className="brutal-btn bg-rose-500 text-white hover:bg-rose-600 !text-xs w-full justify-between font-black"
            >
              <span>Open Power Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
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
