import React from "react";
import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  Cpu,
  Boxes,
  Terminal,
  FileText,
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Ace-Seek Portfolio — Engineering Projects & Ecosystem Showcase",
  description:
    "Explore the complete portfolio of Ace-Seek platforms: cloud-native OpenROAD PnR suites, SDC/MMMC timing studios, zero-token developer tools, and interactive 3D semiconductor labs.",
  alternates: { canonical: "https://www.ace-seek.com/portfolio" },
  openGraph: {
    title: "Ace-Seek Engineering Portfolio",
    description:
      "Cloud-native VLSI physical design, OpenROAD automation, developer tools, and interactive 3D semiconductor laboratories.",
    url: "https://www.ace-seek.com/portfolio",
    siteName: "Ace-Seek",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const PORTFOLIO_PROJECTS = [
  {
    title: "OpenROAD Cloud PnR Automation Suite",
    category: "VLSI EDA & Cloud Computing",
    badge: "FLAGSHIP",
    description:
      "End-to-end browser-based ASIC Place and Route (PnR) execution engine powered by OpenROAD. Features live canvas rendering, timing closure inspection, floorplanning, CTS, and routing visualization.",
    tech: ["Next.js", "Python / C++", "OpenROAD", "WebGL", "Docker", "Tailwind CSS"],
    metrics: ["Sub-second log streaming", "Live VNC/Web Canvas", "Multi-node runner scaling"],
    href: "/openroad",
    icon: Boxes,
    gradient: "from-cyan-500/20 via-blue-500/10 to-transparent",
    borderAccent: "group-hover:border-cyan-500/50",
  },
  {
    title: "VLSI Integration & SDC Timing Studio",
    category: "Semiconductor Engineering",
    badge: "EDITION 2026",
    description:
      "Comprehensive semiconductor fabrication track and interactive studios for SDC constraint authoring, MMMC multi-corner multi-mode setup, UPF power intent design, and Static Timing Analysis (STA).",
    tech: ["React 19", "TypeScript", "SDC Engine", "Math Solver", "Tailwind CSS"],
    metrics: ["12+ Fab Curriculum Modules", "Live Math Solution Renderer", "Gvim Sandbox"],
    href: "/vlsi",
    icon: Cpu,
    gradient: "from-emerald-500/20 via-teal-500/10 to-transparent",
    borderAccent: "group-hover:border-emerald-500/50",
  },
  {
    title: "Developer Utilities & Document Compilers",
    category: "Zero-Token Developer Tools",
    badge: "TOOLS",
    description:
      "Suite of specialized utilities hosted at tools.ace-seek.com including LaTeX TeX formatters, Markdown-to-PDF document compilers, intelligent diff comparators, and JSON/YAML/TOML syntax sanitizers.",
    tech: ["Next.js App Router", "Marked.js", "KaTeX", "JS-YAML", "Smol-TOML"],
    metrics: ["100% Client-Side Speed", "Zero-Token Overhead", "Instant PDF/TeX Export"],
    href: "https://tools.ace-seek.com",
    icon: Terminal,
    gradient: "from-violet-500/20 via-purple-500/10 to-transparent",
    borderAccent: "group-hover:border-violet-500/50",
  },
  {
    title: "Interactive 3D Semiconductor Labs",
    category: "Advanced Visualization",
    badge: "3D LABS",
    description:
      "Standalone interactive 3D visualizers for complex microelectronic phenomena: wafer yield models, photolithography exposure steps, damascene copper trench filling, and plasma antenna charging effects.",
    tech: ["Three.js / WebGL", "React Three Fiber", "GLSL Shaders", "Interactive Physics"],
    metrics: ["Real-time 3D Simulation", "Interactive Step-through", "Fabrication Physics"],
    href: "/vlsi/learn",
    icon: Sparkles,
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    borderAccent: "group-hover:border-amber-500/50",
  },
  {
    title: "Apex SaaS Solutions Portal & Billing",
    category: "Enterprise Infrastructure",
    badge: "SAAS",
    description:
      "Centralized subscription management portal featuring Clerk authentication, Razorpay & Stripe payment gateways, team seat allocation, custom enterprise invoicing, and automated 7-day Max trial provisioning.",
    tech: ["Clerk Auth", "Razorpay / Stripe", "Supabase", "Resend API"],
    metrics: ["Secure Webhook Handlers", "Instant Seat Activation", "Granular RBAC"],
    href: "https://portal.ace-seek.com",
    icon: Server,
    gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    borderAccent: "group-hover:border-blue-500/50",
  },
  {
    title: "Interview Masterclass & VLSI Prep",
    category: "Career Acceleration",
    badge: "MASTERCLASS",
    description:
      "Curated technical interview prep platform with rigorous questions, timing math solutions, digital design challenges, and physical design scenario walkthroughs for top semiconductor companies.",
    tech: ["Interactive Quizzes", "Math Renderers", "Progress Tracking"],
    metrics: ["100+ Curated Problems", "Detailed Timing Derivations", "Expert Guidance"],
    href: "/vlsi/interview-masterclass",
    icon: Code2,
    gradient: "from-rose-500/20 via-pink-500/10 to-transparent",
    borderAccent: "group-hover:border-rose-500/50",
  },
];

const ARCHITECTURE_HIGHLIGHTS = [
  {
    title: "High-Performance App Router",
    description: "Built on Next.js 16 with React 19 server components, streaming rendering, and optimized edge caching.",
    icon: Zap,
  },
  {
    title: "Tactical Skeuomorphic Design",
    description: "Immersive dark carbon panels, multi-layer drop shadows, LED status indicators, and cyberpunk accents.",
    icon: Layers,
  },
  {
    title: "Robust Security & Isolation",
    description: "Multi-tenant auth via Clerk, secure API proxies, rate-limited compute runners, and encrypted data stores.",
    icon: ShieldCheck,
  },
  {
    title: "Zero-Token Developer Speed",
    description: "Optimized client-side tooling that eliminates round-trip latency for syntax sanitization and doc compilation.",
    icon: Activity,
  },
];

export default function PortfolioPage() {
  return (
    <div className="min-h-full flex flex-col bg-[var(--bg-main)] text-white selection:bg-cyan-500/30">
      <SiteHeader active="portal" />

      <main className="flex-1 space-y-20 py-12 md:py-20">
        {/* =========================================================================
            1. PORTFOLIO HERO SECTION
           ========================================================================= */}
        <section className="m-shell">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-cyan-400 text-xs font-mono tracking-wide shadow-inner">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-cyan-400" />
              <span>Ace-Seek Engineering Portfolio & System Showcase</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
              Architecting the Future of Silicon & Software.
            </h1>

            <p className="text-base md:text-xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto">
              A comprehensive curation of high-performance physical design platforms, cloud EDA automation engines, zero-token developer tools, and immersive 3D semiconductor labs.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <a
                href="/openroad"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-7 py-3 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-[1.02]"
              >
                <span>Launch OpenROAD PnR</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="https://tools.ace-seek.com"
                className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-light)] text-slate-200 hover:text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--surface-panel)] transition-all"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Explore Tools Suite</span>
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. METRICS / STATS BAR
           ========================================================================= */}
        <section className="m-shell">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-light)] shadow-[var(--shadow-panel)]">
            <div className="text-center space-y-1 p-4 rounded-xl bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <div className="text-2xl md:text-3xl font-black font-mono text-cyan-400">12+</div>
              <div className="text-xs text-[var(--muted)] font-medium">Fabrication Modules</div>
            </div>
            <div className="text-center space-y-1 p-4 rounded-xl bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <div className="text-2xl md:text-3xl font-black font-mono text-emerald-400">100%</div>
              <div className="text-xs text-[var(--muted)] font-medium">Cloud PnR Automation</div>
            </div>
            <div className="text-center space-y-1 p-4 rounded-xl bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <div className="text-2xl md:text-3xl font-black font-mono text-violet-400">0-Token</div>
              <div className="text-xs text-[var(--muted)] font-medium">Developer Utilities</div>
            </div>
            <div className="text-center space-y-1 p-4 rounded-xl bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <div className="text-2xl md:text-3xl font-black font-mono text-amber-400">4.9/5</div>
              <div className="text-xs text-[var(--muted)] font-medium">Platform Rating</div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. CORE PORTFOLIO PROJECTS GRID
           ========================================================================= */}
        <section className="m-shell space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2">Ecosystem Showcase</div>
              <h2 className="text-3xl font-black tracking-tight text-white">Featured Platforms & Studios</h2>
            </div>
            <p className="text-sm text-[var(--muted)] max-w-md">
              Each module is architected with modern web primitives, rigorous mathematical modeling, and production-grade reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PORTFOLIO_PROJECTS.map((proj, idx) => {
              const IconComponent = proj.icon;
              return (
                <div
                  key={idx}
                  className={`group relative flex flex-col justify-between p-7 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-light)] ${proj.borderAccent} shadow-[var(--shadow-panel)] transition-all hover:-translate-y-1 overflow-hidden`}
                >
                  {/* Subtle background glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${proj.gradient} pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity`} />

                  <div className="relative z-10 space-y-5">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-light)] flex items-center justify-center shadow-md">
                        <IconComponent className="w-6 h-6 text-cyan-400" />
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[var(--surface-recessed)] border border-[var(--border-light)] text-cyan-300">
                        {proj.badge}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-mono text-[var(--muted)] block">{proj.category}</span>
                      <h3 className="text-xl font-bold tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                        {proj.title}
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-light">
                        {proj.description}
                      </p>
                    </div>

                    {/* Metrics Pills */}
                    <div className="space-y-1.5 pt-2 border-t border-[var(--border-light)]">
                      {proj.metrics.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-2 text-[11px] font-mono text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>

                    {/* Tech stack tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {proj.tech.map((t, tIdx) => (
                        <span key={tIdx} className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--surface-recessed)] text-[var(--muted)] border border-[var(--border-light)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 pt-6 mt-6 border-t border-[var(--border-light)] flex items-center justify-between">
                    <span className="text-xs font-mono text-[var(--muted)]">Production Ready</span>
                    <a
                      href={proj.href}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 group-hover:translate-x-1 transition-all"
                    >
                      <span>Access Module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            4. ARCHITECTURE & ENGINEERING PILLARS
           ========================================================================= */}
        <section className="m-shell space-y-10">
          <div className="max-w-2xl mx-auto text-center space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Engineering Excellence</div>
            <h2 className="text-3xl font-black tracking-tight text-white">System Architecture Pillars</h2>
            <p className="text-sm text-[var(--muted)]">
              Engineered from the ground up for high concurrency, zero latency, and uncompromising reliability.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {ARCHITECTURE_HIGHLIGHTS.map((item, idx) => {
              const IconComp = item.icon;
              return (
                <div key={idx} className="p-6 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-light)] shadow-[var(--shadow-panel)] space-y-4 hover:border-cyan-500/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-[var(--surface-raised)] border border-[var(--border-light)] flex items-center justify-center">
                    <IconComp className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            5. CTA BANNER
           ========================================================================= */}
        <section className="m-shell">
          <div className="relative rounded-3xl bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border border-cyan-500/30 p-8 md:p-12 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.2)] text-center space-y-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                Ready to Experience Ace-Seek?
              </span>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                Deploy Your First ASIC Design in Seconds.
              </h2>
              <p className="text-sm md:text-base text-slate-300 font-light">
                Join semiconductor engineers and developers worldwide utilizing Ace-Seek for live cloud PnR, SDC constraint generation, and developer tooling.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <a
                  href="/signup"
                  className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-[1.02]"
                >
                  Create Free Account
                </a>
                <a
                  href="/pricing"
                  className="bg-[var(--surface-raised)] border border-[var(--border-light)] text-slate-200 hover:text-white font-semibold text-sm px-6 py-3.5 rounded-xl transition-all hover:bg-[var(--surface-panel)]"
                >
                  View Pricing & Plans
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
