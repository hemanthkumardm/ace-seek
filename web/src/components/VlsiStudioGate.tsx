"use client";

import React from "react";
import { Crown, Lock, Loader2 } from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import type { PlanTier } from "@/lib/entitlements";
import { planLabel } from "@/lib/entitlements";
import { mainPricingHref } from "@/lib/site";

export type VlsiStudioId = "sdc" | "timing" | "mmmc" | "power" | "reports";

const STUDIO_META: Record<
  VlsiStudioId,
  { title: string; requires: PlanTier; entKey: keyof ReturnType<typeof useEntitlements>["ent"]["vlsi"] }
> = {
  reports: { title: "Report Hub", requires: "free", entKey: "reports" },
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
  const { ent, loading } = useEntitlements();
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

  if (loading) {
    return (
      <div className="flex min-h-[50vh] flex-1 items-center justify-center bg-[var(--background)] p-8">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-400 font-mono">
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
    <div className="flex min-h-[calc(100dvh-3.5rem)] flex-1 flex-col items-center justify-center bg-[var(--background)] p-6">
      {/* Decorative workstation grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-6 text-center shadow-2xl font-mono">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
          {requires === "team" || requires === "max" ? (
            <Crown className="h-5 w-5" />
          ) : (
            <Lock className="h-5 w-5" />
          )}
        </div>
        <div className="mb-2 flex justify-center">
          <PlanPill tier={ent.tier} />
        </div>
        <h2 className="text-lg font-black uppercase text-slate-100 tracking-tight">
          {title}
        </h2>
        <p className="mt-2 text-xs font-medium text-slate-400 leading-relaxed">
          Your current plan ({ent.label}) does not include this workstation.
          Upgrade to <strong className="text-cyan-400">{need}</strong> or higher and activate your API key
          on the VLSI dashboard.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <a
            href={mainPricingHref()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent-cyan)] px-4 py-2 text-xs font-black uppercase text-black hover:bg-cyan-300 transition-all shadow-md"
          >
            <Lock className="h-3.5 w-3.5" />
            View plans
          </a>
          <a
            href="/vlsi"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold uppercase text-slate-300 hover:bg-slate-700 transition-all"
          >
            Suite home
          </a>
        </div>
      </div>
    </div>
  );
}

/** Whether a studio is unlocked for the current public entitlements object */
export function studioUnlocked(
  vlsi: {
    access: boolean;
    sdc: boolean;
    timing: boolean;
    mmmc: boolean;
    power: boolean;
    reports: boolean;
  },
  studio: VlsiStudioId
): boolean {
  if (!vlsi.access) return false;
  return Boolean(vlsi[studio]);
}

export function studioMinPlan(studio: VlsiStudioId): PlanTier {
  return STUDIO_META[studio].requires;
}
