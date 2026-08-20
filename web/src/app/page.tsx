import React from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  BRAND,
  CONTENT_HUB,
  OPENROAD_URL,
  PORTAL_URL,
  PRICING,
  PRODUCTS,
  TOOLS_URL,
  VLSI_URL,
} from "@/lib/site";
import {
  Cpu,
  Zap,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Layers,
  Terminal,
  FileText,
  Sparkles,
  Clock,
  CreditCard,
  Lock,
  Server,
  Boxes,
  Compass,
  ChevronRight,
  Tag,
  Megaphone,
  LayoutDashboard,
  UserPlus,
  Key,
  Building2,
  ExternalLink,
} from "lucide-react";

export default function CommandCenterHome() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="home" />

      <main className="flex-1 space-y-16 py-8">
        {/* HERO SECTION — SaaS Apex Portal */}
        <section className="m-shell pt-10 pb-6 md:pt-16 md:pb-12">
          <div className="sk-panel p-8 md:p-12 border border-[var(--bevel-highlight)] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.15),transparent_70%)] pointer-events-none" />

            {/* Instrument Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--bevel-shadow)] text-xs">
              <div className="flex items-center gap-3">
                <div className="sk-icon-well w-8 h-8">
                  <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight block">
                    ACE-SEEK SAAS PORTAL
                  </span>
                  <span className="text-[10px] font-mono text-[var(--muted)]">
                    USER PRICING, DASHBOARD, OFFERS & API KEY GENERATION
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="sk-recessed px-3 py-1.5 flex items-center gap-2 text-[11px] font-mono">
                  <span className="sk-led sk-led-green" />
                  <span className="text-[var(--muted)]">API KEY GATEWAY:</span>
                  <span className="text-[#10b981] font-bold">ACTIVE</span>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="max-w-3xl space-y-6">
              <div className="sk-badge sk-badge-live">
                <Sparkles className="w-3 h-3 text-[var(--accent-cyan)]" />
                <span>Central SaaS Portal & API Key Management</span>
              </div>

              <h1 className="text-3xl md:text-5xl lg:text-[3.25rem] font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                One subscription. API license keys for all tool subdomains.
              </h1>

              <p className="text-base md:text-lg text-[var(--muted)] leading-relaxed">
                <span className="text-[var(--accent-cyan)] font-mono font-semibold">ace-seek.com</span> is the central SaaS portal for user pricing, special team offers, advertising, and user dashboard. When you subscribe, your dashboard generates an API License Key to paste into subdomain websites (like <span className="font-mono text-[var(--accent-cyan)]">openroad.ace-seek.com</span>) to unlock Pro features.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-10 pt-6 border-t border-[var(--bevel-shadow)] flex flex-wrap items-center gap-4">
              <a href="/pricing" className="sk-btn sk-btn-primary !text-sm !py-2.5 !px-6">
                <CreditCard className="w-4 h-4 fill-white" />
                <span>View Pricing & Plans</span>
              </a>

              <a href="/dashboard" className="sk-btn sk-btn-ghost !text-sm !py-2.5 !px-5">
                <Key className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span>Dashboard & API Keys</span>
              </a>

              <a href={PORTAL_URL} className="sk-btn sk-btn-ghost !text-sm !py-2.5 !px-5 border-amber-500/40 text-amber-300 hover:bg-amber-950/30">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Solutions Portal ↗</span>
              </a>
            </div>
          </div>
        </section>

        {/* SUBDOMAIN ECOSYSTEM LAUNCHERS */}
        <section id="products" className="m-shell space-y-8 py-4">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--bevel-shadow)] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                  Subdomain Ecosystem Hub
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Standalone Hardware, Utility & Solutions Subdomains
              </h2>
              <p className="mt-2 text-xs md:text-sm text-[var(--muted)] max-w-xl leading-relaxed">
                Launch directly into our specialized subdomains. Create your account here on ace-seek.com to authorize all workstations.
              </p>
            </div>

            <a href="/dashboard" className="sk-btn sk-btn-ghost !text-xs">
              <Key className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Get API Key in Dashboard →</span>
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* Launch Card 1: VLSI / ASIC Automation Suite */}
            <div className="sk-panel p-6 flex flex-col justify-between space-y-6 border-2 border-[var(--accent-cyan)]/50 hover:border-[var(--accent-cyan)] transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="sk-icon-well w-10 h-10 rounded-lg shrink-0">
                      <Cpu className="w-5 h-5 text-[var(--accent-cyan)]" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white">VLSI / ASIC Suite</h3>
                      <span className="font-mono text-xs text-[var(--accent-cyan)]">vlsi.ace-seek.com</span>
                    </div>
                  </div>
                  <span className="sk-badge sk-badge-live shrink-0">5</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Author SDC, Timing, MMMC, UPF — export OpenROAD-format handoff packs.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--bevel-shadow)] flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">Launch</span>
                <a
                  href={VLSI_URL}
                  className="sk-btn sk-btn-primary !text-xs !py-2 !px-3 font-bold"
                >
                  <span>vlsi →</span>
                </a>
              </div>
            </div>

            {/* Launch Card 2: OpenROAD PnR */}
            <div className="sk-panel p-6 flex flex-col justify-between space-y-6 border-2 border-emerald-400/50 hover:border-emerald-400 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="sk-icon-well w-10 h-10 rounded-lg shrink-0">
                      <Boxes className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white">OpenROAD PnR</h3>
                      <span className="font-mono text-xs text-emerald-400">openroad.ace-seek.com</span>
                    </div>
                  </div>
                  <span className="sk-badge sk-badge-live shrink-0">Pro/Max</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Upload VLSI handoff → Pro flow scripts · Max dry-run / container jobs.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--bevel-shadow)] flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">Launch</span>
                <a
                  href={OPENROAD_URL}
                  className="sk-btn sk-btn-ghost !text-xs !py-2 !px-3 font-bold text-emerald-400 border-emerald-500/40 hover:bg-emerald-950/30"
                >
                  <span>openroad →</span>
                </a>
              </div>
            </div>

            {/* Launch Card 3: Developer & Utility Suite */}
            <div className="sk-panel p-6 flex flex-col justify-between space-y-6 border-2 border-violet-500/50 hover:border-violet-500 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="sk-icon-well w-10 h-10 rounded-lg shrink-0">
                      <Boxes className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white">Tools Suite</h3>
                      <span className="font-mono text-xs text-violet-400">tools.ace-seek.com</span>
                    </div>
                  </div>
                  <span className="sk-badge sk-badge-live shrink-0">6</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Doc compiler, diff, converters, AI sanitizer, TeX, tables.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--bevel-shadow)] flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">Launch</span>
                <a
                  href={TOOLS_URL}
                  className="sk-btn sk-btn-ghost !text-xs !py-2 !px-3 font-bold text-violet-300 border-violet-500/40 hover:bg-violet-950/30"
                >
                  <span>tools →</span>
                </a>
              </div>
            </div>

            {/* Launch Card 4: Solutions Portal */}
            <div className="sk-panel p-6 flex flex-col justify-between space-y-6 border-2 border-amber-500/50 hover:border-amber-500 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="sk-icon-well w-10 h-10 rounded-lg shrink-0">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-white">Solutions Portal</h3>
                      <span className="font-mono text-xs text-amber-400">portal.ace-seek.com</span>
                    </div>
                  </div>
                  <span className="sk-badge sk-badge-live shrink-0 text-amber-400 border-amber-500/40">Custom</span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Academic VLSI Capstones, Custom ASIC Design, and WhatsApp Business Portals.
                </p>
              </div>
              <div className="pt-4 border-t border-[var(--bevel-shadow)] flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-slate-400">Launch</span>
                <a
                  href={PORTAL_URL}
                  className="sk-btn sk-btn-ghost !text-xs !py-2 !px-3 font-bold text-amber-300 border-amber-500/40 hover:bg-amber-950/30"
                >
                  <span>portal →</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING & OFFERS BANNER */}
        <section className="bg-[var(--surface-panel)] border-y border-[var(--bevel-shadow)] py-14">
          <div className="m-shell space-y-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                    Promotions & Offers
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  20% Annual Discount & Startup Grants
                </h2>
                <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
                  Save on team plans and receive immediate Pro API License Keys for your subdomain tools.
                </p>
                <div className="pt-2 flex items-center gap-3">
                  <a href="/offers" className="sk-btn sk-btn-primary !text-xs">
                    <Tag className="w-3.5 h-3.5" />
                    <span>View Special Offers</span>
                  </a>
                  <a href="/pricing" className="sk-btn sk-btn-ghost !text-xs">
                    <span>Full Pricing Spec →</span>
                  </a>
                </div>
              </div>

              <div className="sk-panel p-6 space-y-4 border-[var(--accent-cyan)]/40">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-[var(--accent-cyan)]">FEATURED PROMO</span>
                  <span className="sk-badge sk-badge-live">SAVE 20%</span>
                </div>
                <h3 className="text-base font-bold">Annual Pro & Team API Keys</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Upgrade your identity to Pro or Team annual billing and get 2 months free API key authorization.
                </p>
                <div className="sk-recessed p-3 flex items-center justify-between text-xs font-mono">
                  <span>PROMO CODE:</span>
                  <span className="text-[var(--accent-cyan)] font-bold">ANNUAL2026</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ENTERPRISE ADVERTISING & SPONSORSHIP */}
        <section className="m-shell py-4">
          <div className="sk-panel p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                  EDA & Hardware Advertising
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight">
                Advertise to 25,000+ Hardware Engineers
              </h2>
              <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
                Reach active VLSI architects, STA specialists, and embedded developers across our platform ecosystem.
              </p>
            </div>

            <a href="/advertise" className="sk-btn sk-btn-primary !text-xs !py-2.5 !px-5 shrink-0">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Partner & Advertise</span>
            </a>
          </div>
        </section>

        {/* FINAL CTA PANEL */}
        <section className="m-shell pb-12">
          <div className="sk-panel p-8 md:p-12 text-center max-w-2xl mx-auto space-y-6">
            <div className="sk-icon-well mx-auto w-12 h-12 rounded-xl">
              <Cpu className="w-6 h-6 text-[var(--accent-cyan)]" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Create Your Account & Generate API Keys
              </h2>
              <p className="text-xs md:text-sm text-[var(--muted)] max-w-lg mx-auto leading-relaxed">
                Subscribe on ace-seek.com, get your API license key, and activate Pro mode on all subdomain websites.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a href="/signup" className="sk-btn sk-btn-primary !text-xs !py-2.5 !px-6">
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </a>
              <a href="/pricing" className="sk-btn sk-btn-ghost !text-xs !py-2.5 !px-5">
                <CreditCard className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                <span>View Pricing Tiers</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
