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
  const { ent, ready, loading } = useEntitlements();
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
    <div className="min-h-full bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <div className="m-shell py-10 md:py-14 space-y-10">
        <div className="neu-panel p-8 md:p-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/40">
            <div className="flex items-center gap-2">
              <span className="neu-panel-sm p-2">
                <Boxes className="w-5 h-5 text-sky-600" />
              </span>
              <span className="font-black uppercase tracking-wider text-sm">
                OPENROAD.ACE-SEEK.COM
              </span>
              <span className="text-sky-600 font-bold text-xs">
                // PnR AUTOMATION
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PlanPill tier={ent.tier} ready={ready && !loading} />
              <span className="neu-inset px-2 py-1 text-[10px] font-black text-sky-700">
                PRO SCRIPTS
              </span>
              <span className="neu-inset px-2 py-1 text-[10px] font-black text-amber-700">
                MAX PnR
              </span>
            </div>
          </div>

          <div className="max-w-4xl space-y-4">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight uppercase">
              Upload VLSI handoff →{" "}
              <span className="text-sky-700">OpenROAD packs & PnR studio</span>
            </h1>
            <p className="text-xs md:text-sm text-[var(--neu-text-muted)] leading-relaxed font-bold max-w-3xl">
              Author SDC and MMMC on{" "}
              <a href={VLSI_URL} className="text-sky-700 underline">
                vlsi.ace-seek.com
              </a>
              , download OpenROAD-format files, then upload here.{" "}
              <strong className="text-[var(--neu-text)]">Pro</strong> exports
              flow scripts.{" "}
              <strong className="text-[var(--neu-text)]">Max</strong> runs
              OpenLane Docker with stage inputs, sanity checks, and live
              metrics.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {(
              [
                {
                  icon: FolderOpen,
                  title: "1 · Project",
                  body: "Upload constraints.sdc, corners.tcl, optional RTL + manifest from VLSI.",
                },
                {
                  icon: FileCode2,
                  title: "2 · Scripts (Pro)",
                  body: "Makefile, Yosys, OpenSTA, OpenROAD Tcl, local docker-run.sh.",
                },
                {
                  icon: Play,
                  title: "3 · PnR Studio (Max)",
                  body: "Stage cockpit: synth→GDS, live log, die preview, timing/power from real runs.",
                },
              ] as const
            ).map(({ icon: Icon, title, body }) => (
              <div key={title} className="neu-inset p-4 space-y-2">
                <p className="text-xs font-black uppercase flex items-center gap-1.5 text-sky-800">
                  <Icon className="w-4 h-4" /> {title}
                </p>
                <p className="text-[11px] font-bold leading-snug text-[var(--neu-text-muted)]">
                  {body}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[var(--neu-text-muted)]">
              <Sparkles className="w-4 h-4 text-sky-600" />
              <span>
                API key required · Pro scripts · Max PnR studio
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => open("/openroad/project")}
                className="neu-btn neu-btn-primary !text-sm !py-2.5 !px-5 font-black uppercase flex items-center gap-2"
              >
                <Boxes className="w-5 h-5" />
                <span>Open Project</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowAuthModal(true)}
                className="neu-btn !text-xs font-black flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{isAuthorized ? "API Key Active" : "API Key Login"}</span>
              </button>
              <a
                href={VLSI_URL}
                className="neu-btn !text-xs font-black flex items-center gap-1"
              >
                <Cpu className="w-4 h-4" />
                <span>Author on VLSI</span>
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-sky-600">
              Platform flow
            </span>
            <h2 className="text-2xl font-black tracking-tight uppercase">
              VLSI → OpenROAD handoff
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {(
              [
                {
                  href: "/openroad/project",
                  title: "Project",
                  badge: "PRO+",
                  body: "Drop the OpenROAD-format zip or files from VLSI OpenROAD Export.",
                  cta: "Open Project",
                  lock: false,
                },
                {
                  href: "/openroad/design",
                  title: "Design",
                  badge: "PRO+",
                  body: "Edit RTL, testbench, SDC, and ace-seek-flow.json before running stages.",
                  cta: "Edit design",
                  lock: false,
                },
                {
                  href: "/openroad/studio",
                  title: "PnR Studio",
                  badge: "MAX+",
                  body: "Stage inputs, sanity checks, live OpenLane log, real metrics & GDS.",
                  cta: "Open PnR Studio",
                  lock: true,
                },
                {
                  href: "/openroad/scripts",
                  title: "Scripts",
                  badge: "PRO+",
                  body: "Full flow pack: synth.ys, opensta.tcl, openroad.tcl, Makefile, docker-run.sh.",
                  cta: "Export scripts",
                  lock: false,
                },
              ] as const
            ).map((card) => (
              <div
                key={card.href}
                className="neu-panel p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="neu-panel-sm p-2">
                      {card.title === "Project" && (
                        <FolderOpen className="w-5 h-5 text-sky-600" />
                      )}
                      {(card.title === "Design" || card.title === "Scripts") && (
                        <FileCode2 className="w-5 h-5 text-sky-600" />
                      )}
                      {card.title === "PnR Studio" && (
                        <Play className="w-5 h-5 text-sky-600" />
                      )}
                    </span>
                    <span className="neu-inset px-2 py-0.5 text-[10px] font-black text-sky-700">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black uppercase">{card.title}</h3>
                  <p className="text-xs text-[var(--neu-text-muted)] font-bold leading-relaxed">
                    {card.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => open(card.href)}
                  className="neu-btn neu-btn-primary !text-xs w-full justify-between font-black !py-2.5 inline-flex items-center"
                >
                  <span className="inline-flex items-center gap-1">
                    {card.lock && <Lock className="w-3.5 h-3.5" />}
                    {card.cta}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div id="identity-section" className="pt-2">
          <SubdomainAuthModal subdomainName="OPENROAD" />
        </div>

        {showAuthModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="relative w-full max-w-xl">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="absolute -top-2 -right-2 w-8 h-8 rounded-full neu-btn font-black text-rose-600 z-10"
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
    </div>
  );
}
