"use client";

import React, { useState } from "react";
import { PRICING } from "@/lib/site";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { CheckoutModal } from "@/components/CheckoutModal";
import { useAuth } from "@clerk/nextjs";

export function PricingClient() {
  const { isSignedIn } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: string;
  } | null>(null);

  return (
    <>
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
                  <a
                    href="/dashboard"
                    className="sk-btn text-xs w-full justify-center sk-btn-ghost"
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <a
                    href={tier.ctaHref}
                    className="sk-btn text-xs w-full justify-center sk-btn-ghost"
                  >
                    <span>{tier.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )
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
