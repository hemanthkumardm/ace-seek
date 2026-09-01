"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { Crown, Lock, Loader2 } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import { mainPricingHref } from "@/lib/site";
import { planLabel, type PlanTier } from "@/lib/entitlements";

type Props = {
  children: React.ReactNode;
};

/**
 * Plan gate for openroad.ace-seek.com studios.
 * Intro + login public. Project/Scripts require Pro openroad access. Run requires Max.
 */
export function OpenroadPlatformGate({ children }: Props) {
  const pathname = usePathname();
  const { ent, loading, ready } = useEntitlements();

  const isPublic =
    pathname === "/" ||
    pathname === "/openroad" ||
    pathname === "/openroad/" ||
    pathname === "/login" ||
    pathname === "/openroad/login" ||
    pathname.endsWith("/login");

  if (isPublic) return <>{children}</>;

  if (loading || !ready) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 font-mono">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          Checking OpenROAD plan…
        </div>
      </div>
    );
  }

  const isRun =
    pathname === "/openroad/run" ||
    pathname.startsWith("/openroad/run/") ||
    pathname === "/openroad/studio" ||
    pathname.startsWith("/openroad/studio/");
  const needsRun = isRun;
  const hasAccess = Boolean(ent.openroad?.access);
  const hasScripts = Boolean(ent.openroad?.scripts);
  const hasRun = Boolean(ent.openroad?.run);

  let allowed = hasAccess && hasScripts;
  let requires: PlanTier = "pro";
  let title = "OpenROAD platform";
  let detail =
    "Upload VLSI handoff files and export Yosys / OpenROAD / OpenSTA script packs on Pro.";

  if (needsRun) {
    allowed = hasAccess && hasRun;
    requires = "max";
    title = "PnR Studio / Run (Max)";
    detail =
      "Full stage cockpit + OpenLane Docker synth→GDS unlock on Max. Pro can still download script packs.";
  }

  if (allowed) return <>{children}</>;

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center bg-[var(--background)] p-6">
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-6 text-center shadow-2xl font-mono">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          {requires === "max" ? (
            <Crown className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="mb-2 flex justify-center">
          <PlanPill tier={ent.tier} ready={ready && !loading} />
        </div>
        <h2 className="text-lg font-black uppercase text-slate-100 tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">
          Your plan ({ent.label}) does not include this. Upgrade to{" "}
          <strong className="text-emerald-400">{planLabel(requires)}</strong>+.{" "}
          {detail}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href={mainPricingHref()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-400 px-4 py-2 text-xs font-black uppercase text-black hover:bg-emerald-300 transition-all shadow-md"
          >
            View plans
          </a>
          <a
            href="/openroad"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-700 transition-all"
          >
            ← OpenROAD intro
          </a>
        </div>
      </div>
    </div>
  );
}
