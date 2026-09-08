"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PRICING } from "@/lib/site";
import { Sparkles, CheckCircle2, ArrowRight, LogIn } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useAuth } from "@clerk/nextjs";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";

export function PricingClient() {
  const { isSignedIn, isLoaded } = useAuth();
  const { ent, ready } = useEntitlements();
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);

  return (
    <>
      {isLoaded && isSignedIn && ready && (
        <div className="sk-panel p-4 md:p-5 flex flex-wrap items-center justify-between gap-3 border border-cyan-500/30 bg-cyan-950/20">
          <div className="flex items-center gap-3">
            <PlanPill tier={ent.tier} ready={ready} />
            <p className="text-xs font-bold text-white">
              You&apos;re on the {ent.label} plan
            </p>
          </div>
          <Link
            href="/dashboard"
            className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 inline-flex items-center gap-1"
          >
            Dashboard
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 font-mono">
        {PRICING.map((tier) => (
          <li key={tier.id}>
            <div
              className={`sk-panel p-6 flex flex-col justify-between h-full space-y-6 ${
                tier.highlighted
                  ? "border-[var(--accent-cyan)] shadow-cyan-950/30"
                  : ""
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    {tier.name}
                  </h2>
                  {tier.highlighted && (
                    <span className="sk-badge sk-badge-live">
                      <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
                      <span>MOST POPULAR</span>
                    </span>
                  )}
                </div>

                <div className="sk-recessed p-4 flex items-baseline gap-1">
                  <span className="text-3xl font-black font-mono text-[var(--foreground)]">
                    {tier.price}
                  </span>
                  {tier.period && (
                    <span className="text-xs font-mono text-[var(--muted)]">
                      {tier.period}
                    </span>
                  )}
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {tier.blurb}
                </p>

                <div className="pt-3 border-t border-[var(--bevel-shadow)]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] mb-3">
                    Included Capabilities:
                  </p>
                  <ul className="space-y-2.5 text-xs text-[var(--muted)]">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {tier.id === "free" ? (
                isSignedIn ? (
                  <Link
                    href="/dashboard"
                    className="sk-btn text-xs w-full justify-center sk-btn-ghost"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={tier.ctaHref || "/signup"}
                    className="sk-btn text-xs w-full justify-center sk-btn-ghost"
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )
              ) : !isSignedIn ? (
                <Link
                  href={`/login?redirect=${encodeURIComponent("/pricing")}`}
                  className={`sk-btn text-xs w-full justify-center inline-flex items-center gap-1.5 ${
                    tier.highlighted ? "sk-btn-primary" : "sk-btn-ghost"
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign in to buy {tier.name}</span>
                </Link>
              ) : ent.tier === tier.id ? (
                <div className="sk-btn text-xs w-full justify-center sk-btn-ghost opacity-80 cursor-default">
                  Current plan
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPlan({
                      id: tier.id,
                      name: tier.name,
                      price: `${tier.price}${tier.period || ""}`,
                    })
                  }
                  className={`sk-btn text-xs w-full justify-center ${
                    tier.highlighted ? "sk-btn-primary" : "sk-btn-ghost"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {selectedPlan && (
        <CheckoutModal
          planId={selectedPlan.id}
          planName={selectedPlan.name}
          price={selectedPlan.price}
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
        />
      )}
    </>
  );
}
