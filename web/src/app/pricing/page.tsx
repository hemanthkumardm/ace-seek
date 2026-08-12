import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PlanFeatureTable } from "@/components/PlanFeatureTable";
import { PricingClient } from "@/app/pricing/PricingClient";
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

        {/* Pricing Cards Grid (Razorpay Standard Web Checkout Enabled) */}
        <PricingClient />

        <section className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight">What each plan unlocks</h2>
          <PlanFeatureTable />
        </section>

        {/* Security & Billing Information Panel */}
        <div className="sk-panel p-8 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="text-base font-bold">Billing Security & Invoicing</h3>
              <p className="text-xs text-[var(--muted)]">
                Centralized billing management and seat delegation.
              </p>
            </div>
          </div>

          <div className="sk-recessed p-4 text-xs text-[var(--muted)] space-y-2 leading-relaxed font-mono">
            <p>
              • Secure customer portal for cards, invoices, tax IDs, and subscription upgrades.
            </p>
            <p>
              • One Ace-Seek account unlocks Pro entitlements across www, vlsi, and tools product sites.
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
