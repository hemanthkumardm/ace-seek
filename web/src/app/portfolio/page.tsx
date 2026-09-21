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
  MessageSquare,
  BarChart3,
  Rocket,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Hemanth | Freelance Web Developer & Software Engineer Portfolio",
  description:
    "Production-grade web application development, custom SaaS solutions, interactive 3D engineering labs, and high-performance digital experiences. Architecting the future of silicon and software.",
  alternates: { canonical: "https://portfolio.ace-seek.com" },
  openGraph: {
    title: "Hemanth | Freelance Web Developer & Software Engineer",
    description:
      "Expert full-stack development using Next.js 16, React 19, and Supabase. Specialized in engineering tools, SaaS dashboards, and high-performance web apps.",
    url: "https://portfolio.ace-seek.com",
    siteName: "Hemanth Portfolio",
    type: "website",
  },
  robots: { index: true, follow: true },
};

const SERVICES = [
  {
    title: "Full-Stack SaaS Development",
    description: "I build end-to-end SaaS products with secure authentication, complex state management, and real-time database integrations using Next.js and Supabase.",
    icon: Rocket,
    tags: ["Next.js", "Clerk / Auth", "Stripe / Payments", "Real-time DB"],
  },
  {
    title: "Interactive Engineering Labs",
    description: "Specialized in building complex engineering visualizers, 3D semiconductor labs (Three.js), and data-intensive technical dashboards.",
    icon: Cpu,
    tags: ["Three.js", "WebGL", "D3.js", "SVG Animation"],
  },
  {
    title: "Enterprise Custom Portals",
    description: "Developing robust internal tools, admin consoles, and partner portals with granular RBAC and high-security compliance.",
    icon: ShieldCheck,
    tags: ["RBAC", "Dashboarding", "Enterprise Auth", "Data Security"],
  },
  {
    title: "Performance & SEO Audits",
    description: "Optimizing existing web applications for sub-second load times, Core Web Vitals, and peak search engine visibility.",
    icon: Search,
    tags: ["Performance Tuning", "Technical SEO", "Lighthouse 100/100"],
  },
];

const FEATURED_WORK = [
  {
    title: "Ace-Seek Platform Architecture",
    category: "Full-Stack / Engineering Tooling",
    description: "Built the entire Ace-Seek ecosystem, including the core SaaS portal, VLSI engineering studios, and the OpenROAD cloud automation engine.",
    tags: ["Next.js 16", "React 19", "Supabase", "Docker API"],
    href: "https://www.ace-seek.com",
    imageAlt: "Ace-Seek Homepage",
    badge: "CLIENT FAVORITE",
  },
  {
    title: "OpenROAD Cloud PnR Studio",
    category: "Interactive EDA Visualizer",
    description: "An interactive browser-based physical design environment with real-time log streaming, floorplan visualization, and timing closure reports.",
    tags: ["WebGL", "WebSocket", "OpenROAD", "React Three Fiber"],
    href: "https://openroad.ace-seek.com",
    imageAlt: "OpenROAD Studio",
  },
  {
    title: "Developer Workstation Suite",
    category: "Zero-Token Utility Suite",
    description: "A collection of high-performance client-side developer tools for LaTeX formatting, Markdown compilation, and data sanitization.",
    tags: ["Client-side WebAssembly", "Tailwind v4", "TypeScript"],
    href: "https://tools.ace-seek.com",
    imageAlt: "Tools Suite",
  },
];

const PROCESS = [
  {
    step: "01",
    title: "Discovery & Strategy",
    description: "Deep dive into your business goals, target audience, and technical requirements to define a clear project roadmap.",
  },
  {
    step: "02",
    title: "Architecture & Design",
    description: "Defining the system architecture, database schemas, and crafting a tactical, user-centric interface design.",
  },
  {
    step: "03",
    title: "Rapid Development",
    description: "Fast-paced, iterative building with continuous deployment and transparent progress reporting via dedicated environments.",
  },
  {
    step: "04",
    title: "Optimization & Launch",
    description: "Rigorous testing, security audits, and performance tuning before deploying to global production-grade infrastructure.",
  },
];

export default function FreelancePortfolioPage() {
  return (
    <div className="min-h-full flex flex-col bg-[var(--bg-main)] text-white selection:bg-cyan-500/30">
      <SiteHeader active="portfolio" />

      <main className="flex-1 space-y-24 py-12 md:py-24">
        {/* =========================================================================
            1. HERO: FREELANCE PERSONAL BRANDING
           ========================================================================= */}
        <section className="m-shell relative">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none opacity-50" />
          
          <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-raised)] border border-[var(--border-light)] text-cyan-400 text-[10px] font-bold uppercase tracking-widest shadow-inner">
              <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              <span>Available for Hire · Freelance Web Development Specialist</span>
            </div>

            <h1 className="text-4xl md:text-7xl font-black tracking-tight leading-[1.05] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-300">
              Transforming Complex Ideas into <br className="hidden md:block" /> Fast, Modern Web Experiences.
            </h1>

            <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-light max-w-2xl mx-auto">
              I architect production-grade SaaS platforms, interactive engineering tools, and conversion-focused web apps. Bridging the gap between <strong>Technical Excellence</strong> and <strong>Exceptional UI</strong>.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-5 pt-6">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-8 py-4 rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-[1.05] active:scale-95"
              >
                <span>Hire Me / Start a Project</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#work"
                className="inline-flex items-center gap-2 bg-[var(--surface-raised)] border border-[var(--border-light)] text-slate-200 hover:text-white font-bold text-sm px-7 py-4 rounded-xl hover:bg-[var(--surface-panel)] transition-all"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>View My Work</span>
              </a>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. SERVICES GRID
           ========================================================================= */}
        <section id="services" className="m-shell space-y-12 scroll-mt-24">
          <div className="max-w-2xl space-y-3">
            <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Freelance Services</div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">How I Can Help You</h2>
            <p className="text-slate-400 text-sm md:text-base font-light">
              Specialized expertise in building high-performance, developer-centric, and data-intensive web applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SERVICES.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-[var(--surface-panel)] border border-[var(--border-light)] shadow-[var(--shadow-panel)] hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
                  <div className="w-12 h-12 rounded-xl bg-[var(--surface-raised)] border border-[var(--border-light)] flex items-center justify-center mb-6 group-hover:bg-cyan-500/10 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed mb-6">
                    {s.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-auto">
                    {s.tags.map((t, ti) => (
                      <span key={ti} className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[var(--surface-recessed)] text-slate-300 border border-[var(--border-light)] uppercase tracking-tight">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            3. FEATURED WORK / PORTFOLIO SHOWCASE
           ========================================================================= */}
        <section id="work" className="m-shell space-y-12 scroll-mt-24">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Portfolio</div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">Recent Work Showcase</h2>
            </div>
            <a href="https://www.ace-seek.com" className="text-xs font-bold text-cyan-400 hover:underline flex items-center gap-1.5 group">
              <span>View full case studies on Ace-Seek</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {FEATURED_WORK.map((work, i) => (
              <div key={i} className="flex flex-col rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-light)] overflow-hidden shadow-[var(--shadow-panel)] group hover:border-cyan-500/30 transition-all">
                <div className="h-48 bg-[var(--surface-recessed)] relative overflow-hidden flex items-center justify-center p-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-50" />
                  {/* Decorative Project Placeholder Icon */}
                  <div className="w-20 h-20 rounded-2xl bg-[var(--surface-raised)] border border-[var(--border-light)] shadow-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    {i === 0 ? <Globe className="w-10 h-10 text-cyan-400" /> : i === 1 ? <Cpu className="w-10 h-10 text-emerald-400" /> : <Terminal className="w-10 h-10 text-violet-400" />}
                  </div>
                  {work.badge && (
                    <span className="absolute top-4 right-4 text-[9px] font-black px-2 py-1 rounded bg-amber-500 text-black uppercase tracking-widest shadow-lg">
                      {work.badge}
                    </span>
                  )}
                </div>
                <div className="p-7 space-y-5">
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold tracking-widest">{work.category}</span>
                    <h3 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">{work.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed font-light">
                      {work.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {work.tags.map((t, ti) => (
                      <span key={ti} className="text-[9px] font-mono px-2 py-1 rounded bg-[var(--surface-recessed)] text-[var(--muted)] border border-[var(--border-light)]">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="pt-4 border-t border-[var(--border-light)]">
                    <a href={work.href} className="inline-flex items-center gap-2 text-xs font-black text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest">
                      <span>Visit Live Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            4. PROCESS SECTION
           ========================================================================= */}
        <section className="m-shell bg-[var(--surface-panel)] border border-[var(--border-light)] rounded-[40px] p-10 md:p-16 shadow-[var(--shadow-panel)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-6">
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">Collaboration</div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                My Production-First Development Process.
              </h2>
              <p className="text-slate-400 text-sm md:text-lg font-light leading-relaxed">
                I don't just write code; I architect systems that solve real business challenges. My process is optimized for transparency, speed, and long-term scalability.
              </p>
              <div className="pt-4">
                <a href="#contact" className="sk-btn sk-btn-primary !px-8 !py-3.5 !rounded-xl !text-sm !font-black">
                  Request a Consultation
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-8">
              {PROCESS.map((p, i) => (
                <div key={i} className="space-y-4 p-6 rounded-2xl bg-[var(--surface-recessed)] border border-[var(--border-light)] shadow-inner">
                  <div className="text-4xl font-black text-cyan-500/20 font-mono tracking-tighter">{p.step}</div>
                  <h3 className="text-lg font-bold text-white">{p.title}</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {p.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. CONTACT / CALL TO ACTION
           ========================================================================= */}
        <section id="contact" className="m-shell scroll-mt-24">
          <div className="relative bg-gradient-to-br from-slate-900 to-black border border-cyan-500/20 rounded-[40px] p-10 md:p-20 text-center space-y-8 overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(6,182,212,0.1),transparent_40%)] pointer-events-none" />
            <div className="absolute top-0 right-0 w-full h-full bg-[url('/grid.svg')] bg-repeat opacity-5 pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto mb-6">
                <MessageSquare className="w-8 h-8 text-cyan-400" />
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">
                Let's Build Your Next <br /> Success Story Together.
              </h2>
              <p className="text-slate-300 text-sm md:text-lg font-light leading-relaxed">
                Whether you need a high-end SaaS MVP, an interactive engineering dashboard, or a complete digital overhaul, I'm ready to bring your vision to life.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 pt-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Fast Track</div>
                  <div className="text-lg font-bold text-white">Hire for Project</div>
                  <p className="text-[11px] text-[var(--muted)] leading-normal">Fixed-scope projects or dedicated monthly retainers for ongoing development.</p>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left space-y-2 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">Consulting</div>
                  <div className="text-lg font-bold text-white">Architecture Review</div>
                  <p className="text-[11px] text-[var(--muted)] leading-normal">Performance audits, security reviews, and engineering roadmap consultations.</p>
                </div>
              </div>

              <div className="pt-10 flex flex-col items-center gap-4">
                <a
                  href="mailto:hemanth@ace-seek.com"
                  className="bg-white text-black font-black text-base px-10 py-4 rounded-2xl hover:bg-cyan-100 transition-all hover:scale-[1.03] active:scale-95 shadow-xl"
                >
                  Contact Me Directly
                </a>
                <span className="text-[10px] font-mono text-[var(--muted)] uppercase tracking-widest">Usually responds within 24 hours</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
