"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  FolderOpen,
  FileCode2,
  Play,
  ChevronRight,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Lock,
} from "lucide-react";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import { VLSI_URL } from "@/lib/site";

export default function OpenroadHome() {
  const router = useRouter();
  const { ent } = useEntitlements();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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

  const open = (path: string) => {
    if (isAuthorized) router.push(path);
    else setShowAuthModal(true);
  };

  return (
    <div className="m-shell py-10 md:py-14 space-y-12 font-mono">
      <div className="brutal-panel p-8 md:p-12 space-y-8 !border-4 !border-black !shadow-[8px_8px_0_#000000] bg-[var(--surface-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-3 border-black text-xs">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            <span className="font-black text-white uppercase tracking-wider text-sm">
              OPENROAD.ACE-SEEK.COM
            </span>
            <span className="text-emerald-400 font-bold">// PnR AUTOMATION</span>
          </div>
          <div className="flex items-center gap-2">
            <PlanPill tier={ent.tier} />
            <span className="brutal-badge brutal-badge-lime">PRO SCRIPTS</span>
            <span className="brutal-badge brutal-badge-yellow">MAX RUNS</span>
          </div>
        </div>

        <div className="max-w-4xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] text-white uppercase">
            UPLOAD VLSI HANDOFF →{" "}
            <span className="bg-emerald-500 text-black px-2 py-0.5 border-2 border-black inline-block shadow-[3px_3px_0_#000000]">
              OPENROAD PACKS & RUNS
            </span>
          </h1>
          <p className="text-xs md:text-base text-slate-200 leading-relaxed font-bold max-w-3xl">
            Author SDC and MMMC on{" "}
            <a href={VLSI_URL} className="text-emerald-300 underline">
              vlsi.ace-seek.com
            </a>
            , download OpenROAD-format files, then upload here.{" "}
            <strong className="text-white">Pro</strong> exports full Yosys /
            OpenSTA / OpenROAD script packs.{" "}
            <strong className="text-white">Max</strong> queues containerized
            open-PDK jobs (dry-run live; workers when provisioned).
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="bg-emerald-400 text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4" /> 1 · Project
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Upload constraints.sdc, corners.tcl, optional RTL + manifest from VLSI.
            </p>
          </div>
          <div className="bg-cyan-400 text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <FileCode2 className="w-4 h-4" /> 2 · Scripts (Pro)
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Makefile, Yosys, OpenSTA, OpenROAD Tcl, local docker-run.sh.
            </p>
          </div>
          <div className="bg-amber-400 text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Play className="w-4 h-4" /> 3 · Run (Max)
            </p>
            <p className="text-[11px] font-bold leading-snug">
              Dry-run synthetic STA log now; real Docker workers next.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-3 border-black">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>API key required for studios · Pro for scripts · Max for runs</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => open("/openroad/project")}
              className="brutal-btn brutal-btn-cyan !text-sm !py-3 !px-6 font-black uppercase flex items-center gap-2 shadow-[4px_4px_0_#000000]"
            >
              <Boxes className="w-5 h-5 text-black" />
              <span>Open Project</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="brutal-btn bg-white text-black hover:bg-slate-100 !text-xs font-black"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAuthorized ? "API Key Active" : "API Key Login"}</span>
            </button>
            <a
              href={VLSI_URL}
              className="brutal-btn brutal-btn-yellow !text-xs font-black"
            >
              <Cpu className="w-4 h-4" />
              <span>Author on VLSI</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Flow catalog */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-4">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Platform flow
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
            VLSI → OpenROAD handoff
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="brutal-panel p-6 flex flex-col justify-between space-y-4 border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FolderOpen className="w-8 h-8 text-emerald-400" />
                <span className="brutal-badge brutal-badge-cyan">PRO+</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Project</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Drop the OpenROAD-format zip or files from VLSI OpenROAD Export
                (constraints.sdc, corners.tcl, ace-seek-openroad.json).
              </p>
            </div>
            <button
              type="button"
              onClick={() => open("/openroad/project")}
              className="brutal-btn bg-emerald-500 text-black !text-xs w-full justify-between font-black"
            >
              <span>Open Project</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="brutal-panel p-6 flex flex-col justify-between space-y-4 border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <FileCode2 className="w-8 h-8 text-cyan-400" />
                <span className="brutal-badge brutal-badge-cyan">PRO+</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Scripts</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Full flow pack: synth.ys, opensta.tcl, openroad.tcl, Makefile,
                docker-run.sh — run locally anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={() => open("/openroad/scripts")}
              className="brutal-btn brutal-btn-cyan !text-xs w-full justify-between font-black"
            >
              <span>Export scripts</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="brutal-panel p-6 flex flex-col justify-between space-y-4 border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Play className="w-8 h-8 text-amber-400" />
                <span className="brutal-badge brutal-badge-yellow">MAX+</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Run</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Max dry-run produces a paste-ready STA log. Container mode lands
                when workers are provisioned.
              </p>
            </div>
            <button
              type="button"
              onClick={() => open("/openroad/run")}
              className="brutal-btn brutal-btn-yellow !text-xs w-full justify-between font-black"
            >
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Run job
              </span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div id="identity-section" className="pt-4">
        <SubdomainAuthModal subdomainName="OPENROAD" />
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white font-black border-2 border-black z-10"
            >
              ✕
            </button>
            <SubdomainAuthModal
              subdomainName="OPENROAD"
              onAuthorize={() => {
                setIsAuthorized(true);
                setShowAuthModal(false);
                router.push("/openroad/project");
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
