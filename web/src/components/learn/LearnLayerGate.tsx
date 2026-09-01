"use client";

import React from "react";
import { Lock } from "lucide-react";
import type { LearnLayer } from "@/lib/vlsi-curriculum";
import { LEARN_LAYER_META } from "@/lib/vlsi-curriculum";
import { LAYER_MIN_PLAN } from "@/lib/vlsi-learn-access";
import { planLabel, type PlanTier } from "@/lib/entitlements";

export function LearnLayerGate({
  layer,
  locked,
  children,
}: {
  layer: LearnLayer;
  locked: boolean;
  children: React.ReactNode;
}) {
  if (!locked) return <>{children}</>;
  const meta = LEARN_LAYER_META[layer];
  const need = planLabel(LAYER_MIN_PLAN[layer] as PlanTier);

  return (
    <div className="relative mt-8 max-w-2xl">
      <div className="pointer-events-none select-none blur-[2px] opacity-40 max-h-40 overflow-hidden">
        {children}
      </div>
      <div
        className="ln-card absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
        style={{ background: "color-mix(in srgb, var(--ln-bg-elev) 92%, transparent)" }}
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
        >
          <Lock className="w-4 h-4" />
        </span>
        <p className="font-semibold" style={{ color: "var(--ln-text)" }}>
          {meta.label} layer · {meta.plan}
        </p>
        <p className="text-sm mt-1 max-w-sm" style={{ color: "var(--ln-muted)" }}>
          Beginner and Standard are free. Expert is Pro. Master is Max. Activate a {need} API key
          to open this lesson.
        </p>
        <div className="flex gap-2 mt-4">
          <a href="/pricing" className="ln-btn ln-btn-primary">
            View plans
          </a>
          <a href="/vlsi" className="ln-btn">
            API login in Studio
          </a>
        </div>
      </div>
    </div>
  );
}

export function LayerBadge({ layer }: { layer: LearnLayer }) {
  const meta = LEARN_LAYER_META[layer];
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
      style={{ background: "var(--ln-accent-soft)", color: "var(--ln-accent)" }}
      title={meta.hint}
    >
      {meta.label}
      <span style={{ opacity: 0.7 }}>· {meta.plan}</span>
    </span>
  );
}
