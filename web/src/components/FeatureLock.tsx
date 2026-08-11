"use client";

import React from "react";
import { Crown, Lock, Sparkles } from "lucide-react";
import type { PlanTier } from "@/lib/entitlements";
import { planLabel } from "@/lib/entitlements";

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
        className={`inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800 ${className}`}
        title={title || `${need}+ required`}
      >
        <Lock className="h-3 w-3" />
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
      <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-[1px] p-4">
        <div className="max-w-xs rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-lg">
          <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            {requires === "team" ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {title || `${need} feature`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Upgrade to <strong>{need}</strong> (or higher) and activate your API key to unlock.
          </p>
          <a
            href="/pricing"
            className="mt-3 inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
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
    guest: "bg-slate-100 text-slate-600",
    free: "bg-slate-100 text-slate-700",
    pro: "bg-sky-50 text-sky-800",
    max: "bg-violet-50 text-violet-800",
    team: "bg-amber-50 text-amber-900",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
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
