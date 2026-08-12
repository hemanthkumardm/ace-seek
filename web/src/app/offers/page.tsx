import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Tag, Sparkles, Zap, Gift, CheckCircle2, ArrowRight, Clock, Percent, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Offers & Deals",
  description: "Special promotions, annual discounts, and grants for Ace-Seek engineering teams.",
};

const OFFERS = [
  {
    title: "Annual Billing — 20% Discount",
    badge: "SAVINGS",
    blurb: "Switch any Pro or Team subscription from monthly to annual billing and instantly lock in 20% off your total seat cost.",
    discount: "20% OFF",
    code: "ANNUAL2026",
    cta: "Claim Annual Deal",
    href: "/pricing",
  },
  {
    title: "VLSI Startup & Academic Grant",
    badge: "GRANT",
    blurb: "Verified early-stage semiconductor startups and university research labs get 6 months of Team Plan access completely free.",
    discount: "100% FREE (6 Months)",
    code: "HARDWARE_GRANT",
    cta: "Apply for Grant",
    href: "/signup?plan=team&grant=1",
  },
  {
    title: "Doc Compiler Subdomain Credits",
    badge: "PROMO",
    blurb: "Every new account receives 1,000 free high-priority TeX compilation tokens on doc.ace-seek.com upon identity creation.",
    discount: "1,000 TOKENS",
    code: "DOC_LAUNCH_FREE",
    cta: "Create Identity & Claim",
    href: "/signup",
  },
];

export default function OffersPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="offers" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        {/* Hero Section */}
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <Tag className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Promotional Command Desk
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Exclusive Offers & Hardware Team Grants
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Maximize your team productivity with special promotional deals, annual subscription discounts, startup grants, and free compiler credits on <span className="font-mono text-[var(--accent-cyan)]">doc.ace-seek.com</span>.
          </p>
        </div>

        {/* Offers Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {OFFERS.map((offer) => (
            <div key={offer.title} className="sk-panel p-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="sk-badge sk-badge-live">
                    <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
                    <span>{offer.badge}</span>
                  </span>
                  <span className="font-mono text-[10px] text-[var(--muted)]">LIMITED TIME</span>
                </div>

                <div className="sk-recessed p-4 flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-[var(--accent-cyan)]">
                    {offer.discount}
                  </span>
                  <span className="sk-badge font-mono text-[10px]">{offer.code}</span>
                </div>

                <h2 className="text-base font-bold text-[var(--foreground)]">{offer.title}</h2>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{offer.blurb}</p>
              </div>

              <a href={offer.href} className="sk-btn sk-btn-primary !text-xs w-full justify-center">
                <span>{offer.cta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          ))}
        </div>

        {/* Subdomain Notice Panel */}
        <div className="sk-panel p-8 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="text-base font-bold">Unified License & Token Redemption</h3>
              <p className="text-xs text-[var(--muted)]">
                Redeem promotional codes directly from your central dashboard on ace-seek.com.
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed font-mono sk-recessed p-4">
            • Promos applied on www.ace-seek.com automatically apply across vlsi.ace-seek.com, tools.ace-seek.com, and other Ace-Seek product sites under the same account.
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
