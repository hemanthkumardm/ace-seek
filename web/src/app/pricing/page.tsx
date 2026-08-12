import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PlanFeatureTable } from "@/components/PlanFeatureTable";
import { PRICING } from "@/lib/site";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Ace-Seek plans — Free, Pro, Max, and Team. Feature locks via API key.",
};

export default function PricingPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="pricing" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        {/* Header Hero Panel */}
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <CreditCard className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Unified Billing Matrix
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            One Subscription. Full Access to Every Subdomain.
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Billing and license seat management live exclusively on <span className="font-mono text-[var(--accent-cyan)]">ace-seek.com</span>. Subdomains verify your entitlements automatically without duplicate charges or extra checkouts.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
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

                <a
                  href={tier.ctaHref}
                  className={`sk-btn text-xs w-full justify-center ${
                    tier.highlighted ? "sk-btn-primary" : "sk-btn-ghost"
                  }`}
                >
                  <span>{tier.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </li>
          ))}
        </ul>

        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">What each plan unlocks</h2>
          <p className="text-xs text-[var(--muted)] max-w-2xl">
            Subdomain tools automatically read your workspace API key to unlock features server-side.
          </p>
          <PlanFeatureTable />
        </section>

        {/* Security & Billing Information Panel */}
        <div className="sk-panel p-8 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="text-base font-bold">Stripe Enterprise Security & Invoicing</h3>
              <p className="text-xs text-[var(--muted)]">
                Centralized billing management and seat delegation.
              </p>
            </div>
          </div>

          <div className="sk-recessed p-4 text-xs text-[var(--muted)] space-y-2 leading-relaxed font-mono">
            <p>
              • Stripe Customer Portal handles all credit cards, invoices, tax IDs, and subscription upgrades.
            </p>
            <p>
              • Single-sign-on (SSO) session tokens inherit Pro entitlements across doc.ace-seek.com, timing.ace-seek.com, and lab utilities.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
