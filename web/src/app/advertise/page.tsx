import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { Megaphone, Cpu, Users, Eye, Target, Send, CheckCircle2, ArrowRight, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Advertise & Sponsorship",
  description: "Reach VLSI designers, STA engineers, and hardware teams on Ace-Seek.",
};

export default function AdvertisePage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="advertise" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        {/* Header Panel */}
        <div className="sk-panel p-8 md:p-12 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <Megaphone className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Enterprise Sponsorship Desk
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-[var(--foreground)]">
            Advertise to Semiconductor & Engineering Teams
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-2xl leading-relaxed">
            Position your EDA tools, IP cores, FPGA dev kits, and cloud compute platforms directly in front of active VLSI architects, timing engineers, and chip designers.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Users className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-3xl font-black font-mono text-[var(--foreground)]">25,000+</p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Hardware Engineers</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">STA engineers, physical design leads, and firmware architects.</p>
          </div>

          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Eye className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-3xl font-black font-mono text-[var(--foreground)]">140,000+</p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Subdomain Tool Runs</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">High engagement across doc.ace-seek.com, timing, and scripts.</p>
          </div>

          <div className="sk-panel p-6 space-y-3 text-center">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Target className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <p className="text-3xl font-black font-mono text-[var(--foreground)]">100% Focused</p>
            <p className="text-xs font-bold uppercase text-[var(--muted)]">Technical Intent</p>
            <p className="text-xs text-[var(--muted)] leading-relaxed">Zero fluff — readers seeking SDC, TeX notes, and synthesis solutions.</p>
          </div>
        </div>

        {/* Packages Grid */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight border-b border-[var(--bevel-shadow)] pb-3">
            Sponsorship & Banner Packages
          </h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="sk-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Subdomain Banner Placement</h3>
                <span className="sk-badge sk-badge-live">$499 / Month</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Display prominent high-resolution banner placement on doc.ace-seek.com and timing.ace-seek.com tool headers.
              </p>
              <ul className="space-y-2 text-xs text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>Targeted placement on PDF compiler toolbar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>CTR analytics & click tracking dashboard</span>
                </li>
              </ul>
            </div>

            <div className="sk-panel p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold">Sponsored Technical Post</h3>
                <span className="sk-badge sk-badge-live">$799 / Post</span>
              </div>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Publish co-branded technical case studies, benchmarking reports, and workflow integration articles on ace-seek.com/blog.
              </p>
              <ul className="space-y-2 text-xs text-[var(--muted)]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>Organic SEO indexing for target EDA keywords</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>Permanent link back to your product landing page</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Form Box */}
        <div className="sk-panel p-8 space-y-6 max-w-xl mx-auto">
          <div className="text-center space-y-2">
            <div className="sk-icon-well mx-auto w-10 h-10">
              <Send className="w-5 h-5 text-[var(--accent-cyan)]" />
            </div>
            <h3 className="text-lg font-bold">Inquire About Advertising & Media Kits</h3>
            <p className="text-xs text-[var(--muted)]">
              Get in touch with our team for custom corporate sponsorship packages.
            </p>
          </div>

          <form className="space-y-4" action="/advertise" method="get">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)]">Company Name</label>
              <input type="text" placeholder="e.g. Cadence, Synopsys, Xilinx, Ansys" className="sk-input w-full" required />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-[var(--muted)]">Work Email</label>
              <input type="email" placeholder="marketing@company.com" className="sk-input w-full" required />
            </div>

            <button type="submit" className="sk-btn sk-btn-primary !text-xs w-full justify-center !py-2.5">
              <span>Request Media Kit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
