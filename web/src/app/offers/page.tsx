import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  Tag,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Building2,
  Percent,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Offers & Deals",
  description:
    "Max trial, academic grants, and subscription offers for Ace-Seek VLSI and engineering tools.",
};

const OFFERS = [
  {
    title: "7-day Max trial",
    badge: "TRIAL",
    blurb:
      "Students and working engineers can request Max for 7 days. We manually verify college or company details, then activate Max on your Ace-Seek account.",
    highlight: "7 DAYS MAX",
    note: "Manual review · no auto-unlock",
    cta: "Request Max trial",
    href: "/trial",
    icon: GraduationCap,
  },
  {
    title: "Annual Pro / Max / Team",
    badge: "SAVINGS",
    blurb:
      "Prefer yearly billing? Choose annual on Pricing when available, or contact us for an annual quote on Pro, Max, or Team seats.",
    highlight: "ASK FOR ANNUAL",
    note: "Contact sales for yearly pricing",
    cta: "View plans",
    href: "/pricing",
    icon: Percent,
  },
  {
    title: "Startup & academic grant",
    badge: "GRANT",
    blurb:
      "Early-stage semiconductor startups and university labs can apply for sponsored Team access. We verify eligibility before activating the account.",
    highlight: "APPLY",
    note: "Subject to approval",
    cta: "Apply via signup",
    href: "/signup?plan=team&grant=1",
    icon: Building2,
  },
  {
    title: "Interview Masterclass",
    badge: "ONE-TIME",
    blurb:
      "Lifetime Staff/Principal interview bank (280+ problems). One-time purchase on your account — separate from monthly Pro/Max.",
    highlight: "₹2,499",
    note: "Lifetime · account-bound",
    cta: "Open Interview",
    href: "https://vlsi.ace-seek.com/vlsi/interview-masterclass",
    icon: Sparkles,
  },
];

export default function OffersPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="offers" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <Tag className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Offers
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Trials, grants & lifetime add-ons
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Everything below attaches to your signed-in Ace-Seek account and works across{" "}
            <span className="font-mono text-[var(--accent-cyan)]">vlsi</span>,{" "}
            <span className="font-mono text-[var(--accent-cyan)]">tools</span>, and{" "}
            <span className="font-mono text-[var(--accent-cyan)]">openroad</span>.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            return (
              <div
                key={offer.title}
                className="sk-panel p-6 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="sk-badge sk-badge-live">
                      <Icon className="w-3 h-3 text-[var(--accent-cyan)]" />
                      <span>{offer.badge}</span>
                    </span>
                  </div>

                  <div className="sk-recessed p-4 space-y-1">
                    <span className="text-xl font-black font-mono text-[var(--accent-cyan)] block">
                      {offer.highlight}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--muted)]">
                      {offer.note}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[var(--foreground)]">
                    {offer.title}
                  </h2>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {offer.blurb}
                  </p>
                </div>

                <Link
                  href={offer.href}
                  className="sk-btn sk-btn-primary !text-xs w-full justify-center"
                >
                  <span>{offer.cta}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>

        <div className="sk-panel p-8 space-y-4 max-w-3xl">
          <div className="flex items-center gap-3">
            <div className="sk-icon-well">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <div>
              <h3 className="text-base font-bold">How offers apply</h3>
              <p className="text-xs text-[var(--muted)]">
                After approval or purchase, your plan updates on the account — sign in on any
                product host to use it.
              </p>
            </div>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed font-mono sk-recessed p-4">
            Questions about grants or annual billing?{" "}
            <a
              href="mailto:support@ace-seek.com"
              className="text-[var(--accent-cyan)] underline"
            >
              support@ace-seek.com
            </a>
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
