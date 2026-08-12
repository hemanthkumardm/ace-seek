"use client";

import React from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import type { PlanTier } from "@/lib/entitlements";
import { planLabel } from "@/lib/entitlements";
import { mainPricingHref } from "@/lib/site";

type Props = {
  /** Feature is locked for current plan */
  locked: boolean;
  /** Minimum plan that unlocks this feature */
  requires?: PlanTier;
  title?: string;
  children?: React.ReactNode;
  /** Compact inline badge instead of full overlay */
  mode?: "overlay" | "badge" | "disable";
  className?: string;
};

/**
 * Visual lock for plan-gated UI. Does not replace server-side checks.
 */
export function FeatureLock({
  locked,
  requires = "pro",
  title,
  children = null,
  mode = "overlay",
  className = "",
}: Props) {
  if (!locked) return <>{children}</>;

  const need = planLabel(requires);

  if (mode === "badge") {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-semibold text-amber-400 ${className}`}
        title={title || `${need}+ required`}
      >
        <Lock className="h-3 w-3 text-amber-400" />
        {need}+
      </span>
    );
  }

  if (mode === "disable") {
    return (
      <div className={`relative opacity-50 pointer-events-none select-none ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="pointer-events-none select-none opacity-40 blur-[0.5px]">{children}</div>
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="max-w-xs rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] p-4 text-center shadow-2xl">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {requires === "team" ? (
              <Sparkles className="h-4 w-4 text-amber-400" />
            ) : (
              <Crown className="h-4 w-4 text-amber-400" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-100 font-mono">
            {title || `${need} feature`}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Upgrade to <strong className="text-cyan-400">{need}</strong> (or higher) and activate your API key to unlock.
          </p>
          <a
            href={mainPricingHref()}
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-[var(--accent-cyan)] text-black font-black px-4 py-1.5 text-[11px] hover:bg-cyan-300 transition-all shadow-md"
          >
            <Lock className="h-3 w-3" />
            View plans
          </a>
        </div>
      </div>
    </div>
  );
}

export function PlanPill({ tier }: { tier: PlanTier }) {
  const colors: Record<string, string> = {
    guest: "bg-slate-800 text-slate-400 border border-slate-700",
    free: "bg-slate-800 text-slate-300 border border-slate-700",
    pro: "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
    max: "bg-purple-500/10 text-purple-400 border border-purple-500/30",
    team: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold font-mono ${
        colors[tier] || colors.guest
      }`}
    >
      {(tier === "pro" || tier === "max" || tier === "team") && (
        <Crown className="h-3 w-3" />
      )}
      {planLabel(tier)}
    </span>
  );
}
