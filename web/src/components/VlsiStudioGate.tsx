"use client";

import React from "react";
import { Crown, Lock, Loader2 } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import type { PlanTier } from "@/lib/entitlements";
import { planLabel } from "@/lib/entitlements";
import { mainPricingHref } from "@/lib/site";

export type VlsiStudioId = "sdc" | "timing" | "mmmc" | "power" | "reports" | "rtl";

const STUDIO_META: Record<
  VlsiStudioId,
  { title: string; requires: PlanTier; entKey: keyof ReturnType<typeof useEntitlements>["ent"]["vlsi"] }
> = {
  reports: { title: "Report Hub", requires: "free", entKey: "reports" },
  rtl: { title: "RTL Lab", requires: "free", entKey: "reports" },
  sdc: { title: "SDC Studio", requires: "free", entKey: "sdc" },
  timing: { title: "Timing Studio", requires: "pro", entKey: "timing" },
  mmmc: { title: "MMMC Studio", requires: "pro", entKey: "mmmc" },
  power: { title: "Power Studio (UPF)", requires: "max", entKey: "power" },
};

type Props = {
  studio: VlsiStudioId;
  children: React.ReactNode;
  /** Optional feature flag inside an unlocked studio (e.g. ECO) */
  requireFlag?: "exportTcl" | "eco";
  featureTitle?: string;
  featureRequires?: PlanTier;
};

/**
 * Full-page plan gate for VLSI workstations.
 * Relies on validate-key entitlements (same API key as WorkstationAuthGuard).
 */
export function VlsiStudioGate({
  studio,
  children,
  requireFlag,
  featureTitle,
  featureRequires = "max",
}: Props) {
  const { ent, loading, ready } = useEntitlements();
  const meta = STUDIO_META[studio];
  const studioOk = Boolean(ent.vlsi.access && ent.vlsi[meta.entKey]);
  const flagOk =
    !requireFlag ||
    (requireFlag === "exportTcl" ? ent.vlsi.exportTcl : ent.vlsi.eco);
  const allowed = studioOk && flagOk;
  const requires = requireFlag ? featureRequires : meta.requires;
  const title = requireFlag
    ? featureTitle || (requireFlag === "eco" ? "ECO engine" : "TCL export")
    : meta.title;

  if (loading || !ready) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-[var(--bg-main)] p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--muted)] font-mono">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--accent-cyan)]" />
          Checking plan entitlements…
        </div>
      </div>
    );
  }

  if (allowed) {
    return <>{children}</>;
  }

  const need = planLabel(requires);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center bg-[#e6ecf5] p-6 font-mono">
      <div className="relative w-full max-w-md neu-panel p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl neu-inset text-amber-600">
          {requires === "team" || requires === "max" ? (
            <Crown className="h-7 w-7" />
          ) : (
            <Lock className="h-7 w-7" />
          )}
        </div>
        <div className="mb-3 flex justify-center">
          <PlanPill tier={ent.tier} ready={ready && !loading} />
        </div>
        <h2 className="text-base md:text-lg font-black uppercase text-slate-900 tracking-tight">
          {title}
        </h2>
        <p className="mt-2.5 text-xs font-bold text-slate-600 leading-relaxed">
          Your current plan ({ent.label}) does not include this workstation.
          Upgrade to <strong className="text-sky-700 font-black">{need}</strong> or higher and activate your API key
          on the VLSI dashboard.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            href={mainPricingHref()}
            className="neu-btn neu-btn-primary px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>View plans</span>
          </a>
          <a
            href="/vlsi"
            className="neu-btn px-4 py-2.5 text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5"
          >
            <span>Suite home</span>
          </a>
        </div>
      </div>
    </div>
  );
}

/** Whether a studio is unlocked for the current public entitlements object */
export function studioUnlocked(
  vlsi: ReturnType<typeof useEntitlements>["ent"]["vlsi"],
  studio: VlsiStudioId
): boolean {
  if (!vlsi.access) return false;
  const key = STUDIO_META[studio].entKey;
  return Boolean(vlsi[key]);
}

export function studioMinPlan(studio: VlsiStudioId): PlanTier {
  return STUDIO_META[studio].requires;
}
