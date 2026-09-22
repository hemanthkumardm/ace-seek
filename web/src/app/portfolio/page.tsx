import React from "react";
import type { Metadata } from "next";
import { PortfolioNavHeader } from "@/components/portfolio/PortfolioNavHeader";
import { PortfolioFooter } from "@/components/portfolio/PortfolioFooter";
import { VengeanceParticleCanvas } from "@/components/portfolio/VengeanceParticleCanvas";
import { WebsiteHoloDeck } from "@/components/portfolio/WebsiteHoloDeck";
import { SpotlightBentoGrid } from "@/components/portfolio/SpotlightBentoGrid";
import { ProjectEstimator } from "@/components/portfolio/ProjectEstimator";
import {
  Cpu,
  Boxes,
  Terminal,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Layers,
  Code2,
  Workflow,
  CheckCircle2,
  ExternalLink,
  Activity,
  Server,
  Database,
  Lock,
  MessageSquare,
  BarChart3,
  Rocket,
  Search,
  Check,
  Star,
  Award,
  ChevronRight,
  Flame,
} from "lucide-react";

export const metadata: Metadata = {
  title: {
    absolute: "Next-Gen Web Architecture & 3D WebGL Labs | Production Showcase",
  },
  description:
    "Production-grade web application architecture, interactive 3D WebGL engineering labs, custom SaaS platforms, and high-performance digital experiences. Powered by Next.js 16, React 19, and Supabase.",
  alternates: { canonical: "https://portfolio.ace-seek.com" },
  openGraph: {
    title: "Next-Gen Web Architecture & 3D WebGL Labs | Production Showcase",
    description:
      "Demonstrating world-class web engineering: interactive 3D labs, bespoke 3D e-commerce studios, and enterprise SaaS portals. 100/100 Lighthouse performance.",
    url: "https://portfolio.ace-seek.com",
    siteName: "Web Engineering Showcase",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const TECH_STACK_TICKER = [
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Tailwind CSS v4",
  "Three.js & WebGL",
  "Supabase & PostgreSQL RLS",
  "HTML5 Canvas 120 FPS",
  "Docker Containerization",
  "Cloudflare Edge",
  "Python & FastAPI",
  "Web Workers & Wasm",
  "Razorpay & Stripe",
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Discovery & Architectural Blueprint",
    description:
      "Deep dive into product goals, system bottlenecks, and user interaction patterns. Establishing clean schemas, state boundaries, and tech stack choices.",
    badge: "Day 1-2",
  },
  {
    step: "02",
    title: "Rapid Prototyping & High-Impact UI",
    description:
      "Designing responsive, hyper-visual interfaces using Skiper/Vengeance motion patterns, tailored color schemes, and tactile micro-interactions.",
    badge: "Day 3-5",
  },
  {
    step: "03",
    title: "Full-Stack Implementation & Integrations",
    description:
      "Building resilient APIs, secure auth workflows (RLS), real-time WebSockets, and high-FPS visualizers with clean, scalable TypeScript.",
    badge: "Day 6-9",
  },
  {
    step: "04",
    title: "Lighthouse 100/100 Audit & Production Launch",
    description:
      "Rigorous Core Web Vitals optimization, automated security checks, zero-downtime edge CDN deployment, and comprehensive client handover.",
    badge: "Day 10+",
  },
];

const PROVEN_METRICS = [
  {
    value: "100/100",
    label: "Lighthouse Score",
    sub: "Performance, A11y, SEO",
    icon: Flame,
    color: "text-amber-400",
  },
  {
    value: "<40ms",
    label: "Global Edge TTFB",
    sub: "Optimized Cloudflare Edge",
    icon: Zap,
    color: "text-cyan-400",
  },
  {
    value: "100%",
    label: "Client Satisfaction",
    sub: "Delivered on Time & Scope",
    icon: Award,
    color: "text-emerald-400",
  },
  {
    value: "4+",
    label: "Flagship Platforms Live",
    sub: "Millions of Event Cycles",
    icon: Globe,
    color: "text-purple-400",
  },
];

export default function FreelancePortfolioPage() {
  return (
    <div className="min-h-full flex flex-col bg-[#0c0f14] text-white selection:bg-cyan-500/30 font-sans">
      <PortfolioNavHeader />

      <main className="flex-1 space-y-28 md:space-y-36 py-8 md:py-16">
        {/* =========================================================================
            1. HERO: THE ARCHITECT CONSOLE (VENGEANCE CYBERNETIC CANVAS)
           ========================================================================= */}
        <section className="relative min-h-[580px] md:min-h-[660px] flex items-center justify-center overflow-hidden px-4">
          {/* Interactive HTML5 Particle Canvas Background */}
          <VengeanceParticleCanvas />

          {/* Radial Neon Atmospheric Ambient Blooms */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/15 via-purple-500/10 to-emerald-500/15 blur-[140px] pointer-events-none rounded-full" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0c0f14] to-transparent pointer-events-none" />

          {/* Foreground Hero Content */}
          <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 py-12">
            {/* Status Radar Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[var(--surface-raised)] border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold tracking-wide shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
              </span>
              <span>Production Web Demonstrator · High-Speed Systems & 3D Spatial Labs</span>
            </div>

            {/* Main Headline with Shimmering Gradient */}
            <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-white">
              Building Websites That Feel{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                Extraordinary.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-base sm:text-xl md:text-2xl text-slate-300 font-light leading-relaxed max-w-3xl mx-auto">
              Architecting production-grade SaaS platforms, interactive engineering visualizers, and conversion-focused web apps. Bridging the gap between <strong>Technical Excellence</strong> and <strong>Extraordinary UI</strong>.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="#holodeck"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-105 active:scale-95"
              >
                <span>Explore Live Website Demos</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#estimator"
                className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-light)] text-slate-200 hover:text-white font-bold text-sm px-7 py-4 rounded-xl hover:bg-[var(--surface-panel)] hover:border-cyan-500/40 transition-all"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Calculate Project Scope</span>
              </a>
            </div>

            {/* Live Telemetry Quick Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto pt-8">
              {PROVEN_METRICS.map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#121620]/80 border border-white/5 backdrop-blur-md text-left flex items-center gap-3 shadow-inner"
                  >
                    <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon className={`w-4 h-4 ${m.color}`} />
                    </div>
                    <div>
                      <div className={`text-base font-black font-mono leading-none ${m.color}`}>
                        {m.value}
                      </div>
                      <div className="text-[11px] font-bold text-white mt-1 leading-tight">
                        {m.label}
                      </div>
                      <div className="text-[9px] font-mono text-slate-500">{m.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. INFINITE TECH STACK TICKER MARQUEE
           ========================================================================= */}
        <section className="w-full border-y border-[var(--border-light)] bg-[#0a0d12] py-4 overflow-hidden select-none">
          <div className="flex gap-8 items-center animate-[marquee_28s_linear_infinite] whitespace-nowrap">
            {[...TECH_STACK_TICKER, ...TECH_STACK_TICKER].map((tech, i) => (
              <div key={i} className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/80" />
                <span className="hover:text-cyan-300 transition-colors">{tech}</span>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            3. THE CROWN JEWEL: INTERACTIVE WEBSITE HOLO-DECK
           ========================================================================= */}
        <section id="holodeck" className="m-shell scroll-mt-24">
          <WebsiteHoloDeck />
        </section>

        {/* =========================================================================
            4. VENGEANCE SPOTLIGHT BENTO ARCHITECTURE GRID
           ========================================================================= */}
        <section id="bento" className="m-shell scroll-mt-24">
          <SpotlightBentoGrid />
        </section>

        {/* =========================================================================
            5. SKIPER UI INTERACTIVE PROJECT ESTIMATOR
           ========================================================================= */}
        <section id="estimator" className="m-shell scroll-mt-24">
          <ProjectEstimator />
        </section>

        {/* =========================================================================
            6. METHODOLOGY & PROCESS TIMELINE
           ========================================================================= */}
        <section id="process" className="m-shell space-y-12 scroll-mt-24">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
              <Workflow className="w-3.5 h-3.5" />
              <span>Production Pipeline</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
              From Idea to Global Deployment
            </h2>
            <p className="text-slate-400 text-sm md:text-base font-light">
              A transparent, sprint-based delivery model designed for founders, engineering leads, and technical teams who need results fast without compromising code quality.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS_STEPS.map((p, idx) => (
              <div
                key={idx}
                className="relative p-6 rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-light)] space-y-4 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black text-cyan-500/20 font-mono tracking-tighter group-hover:text-cyan-400/40 transition-colors">
                    {p.step}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-bold">
                    {p.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed font-light">
                  {p.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            7. INQUIRY & INTERACTIVE LAUNCHPAD
           ========================================================================= */}
        <section id="contact" className="m-shell scroll-mt-24">
          <div className="relative rounded-[36px] bg-gradient-to-br from-[#131926] via-[#0f141f] to-[#0a0d14] border border-cyan-500/30 p-10 md:p-20 text-center space-y-8 overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.12),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_50%)] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(6,182,212,0.25)]">
                <Sparkles className="w-8 h-8 text-cyan-400" />
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-tight">
                Ready to Build Something <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
                  Unforgettable?
                </span>
              </h2>

              <p className="text-slate-300 text-sm sm:text-lg font-light leading-relaxed max-w-2xl mx-auto">
                Whether launching a greenfield SaaS product, building a high-performance 3D visualizer, or transforming an existing web app into a Lighthouse 100/100 showcase — test the live demonstrators or plan your scope below.
              </p>

              {/* Navigation Action Cards */}
              <div className="grid sm:grid-cols-2 gap-4 pt-4 max-w-xl mx-auto">
                <a
                  href="#holodeck"
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5 hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-all group cursor-pointer"
                >
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Interactive Demos
                  </div>
                  <div className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                    Explore Holo-Deck
                  </div>
                  <p className="text-[11px] text-slate-400">Test multi-device viewports and live apps</p>
                </a>

                <a
                  href="#estimator"
                  className="p-5 rounded-2xl bg-white/5 border border-white/10 text-left space-y-1.5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group cursor-pointer"
                >
                  <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                    Project Builder
                  </div>
                  <div className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    Configure & Estimate
                  </div>
                  <p className="text-[11px] text-slate-400">Interactive timeline & budget in ₹ INR</p>
                </a>
              </div>

              <div className="pt-6">
                <a
                  href="#holodeck"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-base px-10 py-4 rounded-2xl hover:brightness-110 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(6,182,212,0.4)]"
                >
                  <span>Launch Live Holo-Deck</span>
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PortfolioFooter />
    </div>
  );
}
