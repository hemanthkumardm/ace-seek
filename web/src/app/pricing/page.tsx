import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PlanFeatureTable } from "@/components/PlanFeatureTable";
import { PricingClient } from "@/app/pricing/PricingClient";
import { PORTAL_URL, PRICING } from "@/lib/site";
import {
  CreditCard,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  ExternalLink,
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

        {/* Pricing cards — paid plans use secure checkout */}
        <PricingClient />

        {/* DEDICATED CALLOUT: Custom Projects & Business Automation Portals */}
        <div className="sk-panel p-8 md:p-10 border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-[var(--surface-panel)] to-slate-950/40 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="sk-icon-well w-10 h-10 rounded-xl bg-amber-500/10 border-amber-500/30 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="sk-badge text-[10px] font-black uppercase text-amber-400 border-amber-500/30">
                  Custom & Project-Based Solutions
                </span>
                <h3 className="text-xl font-black text-white mt-1">
                  Looking for Academic VLSI Projects or Business Automation?
                </h3>
              </div>
            </div>

            <a
              href={PORTAL_URL}
              className="sk-btn sk-btn-primary !bg-amber-500 hover:!bg-amber-400 !text-slate-950 !font-black !text-xs !py-2.5 !px-5 inline-flex items-center gap-1.5 shadow-lg shadow-amber-950/50"
            >
              <span>Explore portal.ace-seek.com</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Our SaaS subscriptions (<strong className="text-white">Free, Pro, Max</strong>) cover the Cloud EDA software toolchain (<code className="text-[var(--accent-cyan)]">openroad</code>, <code className="text-[var(--accent-cyan)]">vlsi</code>, <code className="text-[var(--accent-cyan)]">tools</code>). For <strong>Academic VLSI Design Capstones</strong>, <strong>Enterprise Custom ASIC Engineering</strong>, or <strong>Small-Business WhatsApp Automation Portals</strong>, dedicated project & monthly subscription pricing is available directly on our Solutions Portal.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 pt-2 border-t border-amber-500/20 text-xs">
            <div className="p-3 bg-black/40 rounded border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">Academic Capstones</span>
              <p className="text-slate-300 text-[11px]">RTL-to-GDSII verification, clean reports, IEEE documentation.</p>
            </div>
            <div className="p-3 bg-black/40 rounded border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">ASIC Consulting</span>
              <p className="text-slate-300 text-[11px]">Custom PDK integration, dedicated flow scripting & tape-out guidance.</p>
            </div>
            <div className="p-3 bg-black/40 rounded border border-amber-500/20 space-y-1">
              <span className="text-[10px] font-bold uppercase text-amber-400 font-mono">Business Automation</span>
              <p className="text-slate-300 text-[11px]">WhatsApp billing pipelines & custom client portals from ₹1,499/mo.</p>
            </div>
          </div>
        </div>

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
