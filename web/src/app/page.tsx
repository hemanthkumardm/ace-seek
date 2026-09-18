import React from "react";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import {
  OPENROAD_URL,
  PORTAL_URL,
  TOOLS_URL,
  VLSI_URL,
} from "@/lib/site";
import { SpatialAbstractHero3D } from "@/components/SpatialAbstractHero3D";
import {
  Cpu,
  FileText,
  Workflow,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Lock,
  Compass,
  Layers,
  Globe,
  Server,
  Terminal,
  CheckCircle2,
} from "lucide-react";

export default function CommandCenterHome() {
  return (
    <div className="min-h-full flex flex-col bg-[var(--bg-main)] text-white selection:bg-cyan-500/30">
      <SiteHeader active="home" />

      <main className="flex-1 space-y-24 py-8 md:py-16">
        {/* =========================================================================
            1. HERO: CLEAN, SPACIOUS, ABSTRACT 3D SPATIAL STAGE
           ========================================================================= */}
        <section className="m-shell">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Hero Column: Concise, punchy copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="spatial-badge text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>Unified Engineering & Developer Platform</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-[1.1] text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-cyan-200">
                Engineering, Amplified.
              </h1>

              <p className="text-base md:text-xl text-slate-300 leading-relaxed font-light">
                One unified platform for <strong className="text-white font-semibold">Silicon Physical Design</strong>,{" "}
                <strong className="text-white font-semibold">Timing Closure</strong>,{" "}
                <strong className="text-white font-semibold">Technical Publishing</strong>, and{" "}
                <strong className="text-white font-semibold">Developer Utilities</strong>.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-7 py-3.5 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-[1.02]"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="/pricing"
                  className="inline-flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm px-6 py-3.5 rounded-xl transition-all shadow-md"
                >
                  <span>View Plans</span>
                </a>
              </div>

              {/* Minimal Key Badges */}
              <div className="pt-6 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-400 font-medium">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  0-Install Browser Tools
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  One Account for Everything
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  Cloud Compute Scale
                </span>
              </div>
            </div>

            {/* Right Hero Column: Abstract 3D Spatial Holographic Visual */}
            <div className="lg:col-span-6 w-full">
              <SpatialAbstractHero3D />
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. INTRODUCTION: ABOUT ACE-SEEK (DETAILED ARCHITECTURAL OVERVIEW)
           ========================================================================= */}
        <section className="m-shell space-y-12">
          {/* Main Mission & Overview Card */}
          <div className="bg-gradient-to-b from-slate-900/90 via-slate-900/60 to-slate-950/80 border border-slate-800/80 rounded-3xl p-8 md:p-14 relative overflow-hidden backdrop-blur-xl">
            {/* Soft atmospheric ambient glow */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-8 relative z-10 max-w-5xl">
              <div className="space-y-4">
                <div className="spatial-badge text-cyan-400">
                  <Compass className="w-3.5 h-3.5" />
                  <span>About Ace-Seek</span>
                </div>

                <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                  The Unified Cloud Ecosystem for Hardware, Code &amp; Technical Publishing.
                </h2>

                <div className="space-y-4 text-slate-300 text-sm md:text-base leading-relaxed font-light">
                  <p>
                    <strong className="text-white font-medium">Ace-Seek</strong> was founded to resolve the deep fragmentation between semiconductor physical design, embedded development, and technical documentation. Traditionally, hardware teams must navigate multi-gigabyte desktop software installations, complex floating license daemons (FlexLM), and disjointed third-party utilities for everyday tasks like netlist diffing, SDC authoring, or document compilation.
                  </p>
                  <p>
                    Ace-Seek bridges this gap with an all-in-one, browser-accessible command center. Powered by an intelligent hybrid architecture — running heavy synthesis and automated physical design on isolated cloud clusters while executing developer utilities and timing calculators client-side — engineers can move from Verilog RTL to clean GDSII tapeouts, static timing signoff, and publication-ready technical specifications with zero local configuration.
                  </p>
                </div>
              </div>

              {/* Three Core Architectural Pillars */}
              <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
                <div className="space-y-2.5 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5 text-cyan-400 text-xs font-bold font-mono">
                    <Server className="w-4 h-4 text-cyan-400" />
                    <span>CLOUD COMPUTE CLUSTERS</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Automated OpenROAD Execution</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Heavy synthesis and physical design runs execute in dedicated, isolated cloud containers with live log streaming, multi-metric DSE parameter sweeps, and full DRC/LVS metrics.
                  </p>
                </div>

                <div className="space-y-2.5 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5 text-emerald-400 text-xs font-bold font-mono">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span>CLIENT-SIDE EDGE UTILITIES</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Instant Speed &amp; Strict Privacy</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Netlist diffs, format converters, and timing calculators run 100% in-browser memory via WebAssembly. Your proprietary code and netlists never touch our servers unless submitted for cloud PnR.
                  </p>
                </div>

                <div className="space-y-2.5 p-5 rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center gap-2.5 text-purple-400 text-xs font-bold font-mono">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>UNIFIED IDENTITY MESH</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">Single Sign-On (SSO)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    One account across ace-seek.com automatically authenticates your session on openroad, vlsi, tools, and portal subdomains with instant plan unlocking and seat delegation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed 4-Domain Breakdown Grid */}
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-cyan-400">
                Four Pillars of the Platform
              </span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                Comprehensive Capabilities Across Every Discipline
              </h2>
              <p className="text-xs md:text-sm text-slate-400">
                Explore the deep technical features integrated into the Ace-Seek ecosystem.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Domain 1: Silicon Physical Design */}
              <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400 font-semibold px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/40">
                    openroad.ace-seek.com
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Silicon Physical Design Automation</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Complete end-to-end ASIC implementation from Verilog RTL to clean GDSII/OASIS tapeouts powered by the OpenROAD flow.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Full Flow Pipeline:</strong> Synthesis (Yosys), Floorplanning, Macro Placement, Clock Tree Synthesis (TritonCTS), and Global/Detailed Routing (TritonRoute).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Design Space Exploration (DSE):</strong> Sweep target frequencies, aspect ratios, core utilization, and pin placement matrices in parallel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>Multi-PDK Support:</strong> Preconfigured environments for open &amp; commercial technology nodes including SkyWater 130nm, ASAP7, and GF180MCU.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span><strong>DRC, LVS &amp; Tapeout Packs:</strong> Automatic antenna check parsing, geometry violation mapping, and complete tapeout archive packaging.</span>
                  </li>
                </ul>
              </div>

              {/* Domain 2: VLSI Timing & Power Suite */}
              <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <Workflow className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-semibold px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                    vlsi.ace-seek.com
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">VLSI Timing, Power &amp; Constraints</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Interactive timing closure studios, multi-voltage power architecture, and semiconductor engineering calculators.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Static Timing Analysis (STA):</strong> Slack path tracing, critical setup/hold path breakdowns, clock skew analysis, and multi-corner MMMC models.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Interactive SDC Authoring:</strong> Visual constraint generator for clock definitions, I/O delays, false paths, and multicycle exceptions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>UPF Low-Power Architect:</strong> Power domain isolation, level-shifter synthesis rules, and state retention power-gating models.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>34+ Engineering Calculators:</strong> Real-time calculators for RC interconnect delay, wire electromigration, clock jitter, and setup margin.</span>
                  </li>
                </ul>
              </div>

              {/* Domain 3: Document Engineering */}
              <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-purple-500/40 transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-[11px] font-mono text-purple-400 font-semibold px-2.5 py-1 rounded-full bg-purple-950/60 border border-purple-800/40">
                    aic compiler
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Technical Document Compiler (<code className="text-purple-300 font-mono">aic</code>)</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Publication-grade compiler engineered for massive technical specifications, academic papers, and hardware architectural notes.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Markdown + LaTeX Math:</strong> Renders inline and display math formulas seamlessly without the syntax collisions common in generic tools.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Syntax Safe Tcl &amp; Code Blocks:</strong> Preserves unfenced Tcl/SDC tokens (<code className="text-purple-300 font-mono">$T</code>, <code className="text-purple-300 font-mono">&#123;expr ...&#125;</code>) without LaTeX escaping errors.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Multi-Format Output:</strong> Compiles via XeLaTeX / LuaLaTeX into high-res vector PDFs or crisp 300+ DPI DOCX files.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                    <span><strong>Wide Table &amp; Diagram Fitting:</strong> Automatic geometry presets and landscape orientation to prevent column truncation on wide timing tables.</span>
                  </li>
                </ul>
              </div>

              {/* Domain 4: Developer Productivity Suite */}
              <div className="p-7 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                    <Terminal className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-semibold px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/40">
                    tools.ace-seek.com
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Developer Productivity Suite</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Zero-install micro-utilities for source code comparison, data transformations, and LLM output preparation.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Visual Netlist Diff Comparator:</strong> High-precision Myers diff with side-by-side or unified view, character-level highlights, and patch export.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>Bidirectional Multi-Format Converter:</strong> Convert instantly between JSON, YAML, TOML, CSV, XML, Base64, Hex, and URL codecs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>AI Output Sanitizer:</strong> Strips prompt chatter and conversational noise from LLM responses, normalizing Markdown code blocks for compilation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span><strong>100% Client-Side Privacy:</strong> Codecs and diffs compute entirely in your local browser sandbox, protecting confidential source data.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Who Is Ace-Seek Built For? */}
          <div className="p-8 rounded-3xl bg-slate-950/70 border border-slate-800/80">
            <div className="max-w-xl mb-6">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                Target Audience
              </span>
              <h3 className="text-xl font-bold text-white mt-1">Who Is Ace-Seek Built For?</h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-slate-400">
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <h4 className="text-sm font-semibold text-slate-200">ASIC &amp; Physical Designers</h4>
                <p className="leading-relaxed">Engineers needing rapid RTL-to-GDSII tapeout validation, automated macro placement, and signoff timing analysis.</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <h4 className="text-sm font-semibold text-slate-200">VLSI Students &amp; Researchers</h4>
                <p className="leading-relaxed">Academics mastering physical design, SDC constraints, and digital implementation without complex lab installations.</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <h4 className="text-sm font-semibold text-slate-200">Technical Authors &amp; Architects</h4>
                <p className="leading-relaxed">Writers producing dense semiconductor documentation, timing datasheets, and papers with flawless math and diagrams.</p>
              </div>
              <div className="space-y-1.5 p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
                <h4 className="text-sm font-semibold text-slate-200">Developers &amp; DevOps Teams</h4>
                <p className="leading-relaxed">Engineers needing zero-friction netlist diffing, structured data conversion, and secure prompt cleaning in a single portal.</p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            3. THE FOUR WORKSTATIONS: CLEAN SPATIAL GLASS CARDS
           ========================================================================= */}
        <section className="m-shell space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Everything You Need in One Place
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Explore our specialized workstations — all accessible from your browser with a single account.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: OpenROAD Silicon PnR */}
            <a
              href={OPENROAD_URL}
              className="spatial-card spatial-card-3d p-7 rounded-2xl flex flex-col justify-between space-y-6 border-2 border-cyan-500/30 hover:border-cyan-400 group block"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  OpenROAD PnR
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Cloud-native physical design automation. Synthesize Verilog RTL, place macros, route metal layers, and stream GDSII tapeouts.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400">
                <span>openroad.ace-seek.com</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Card 2: VLSI & Timing Suite */}
            <a
              href={VLSI_URL}
              className="spatial-card spatial-card-3d p-7 rounded-2xl flex flex-col justify-between space-y-6 border-2 border-emerald-500/30 hover:border-emerald-400 group block"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Workflow className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                  VLSI & Timing Suite
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Interactive Static Timing Analysis (STA), SDC constraint authoring, UPF power domain design, and live semiconductor calculators.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>vlsi.ace-seek.com</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Card 3: Developer & Doc Tools */}
            <a
              href={TOOLS_URL}
              className="spatial-card spatial-card-3d p-7 rounded-2xl flex flex-col justify-between space-y-6 border-2 border-purple-500/30 hover:border-purple-400 group block"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                  Developer & Doc Tools
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Publication-grade document compiler (<code className="text-purple-300 font-mono">aic</code>), visual code diff comparator, data format converter, and AI sanitizer.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-400">
                <span>tools.ace-seek.com</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>

            {/* Card 4: Solutions & Consulting */}
            <a
              href={PORTAL_URL}
              className="spatial-card spatial-card-3d p-7 rounded-2xl flex flex-col justify-between space-y-6 border-2 border-amber-500/30 hover:border-amber-400 group block"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Solutions & Consulting
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Academic VLSI Capstones, custom ASIC physical design consulting, workflow integration, and dedicated engineering support.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>portal.ace-seek.com</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </a>
          </div>
        </section>

        {/* =========================================================================
            3. ELEGANT VALUE HIGHLIGHTS
           ========================================================================= */}
        <section className="m-shell py-2">
          <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-base font-bold text-white">Instant Browser Access</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Zero installations, zero license managers, no complex tool builds. Run directly in Safari, Chrome, or Firefox.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white">Single Sign-On (SSO)</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Create your account once on ace-seek.com. Sign in on any subdomain and your plan unlocks automatically.
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="text-base font-bold text-white">Privacy & Speed First</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Developer utilities operate client-side in your browser. Silicon PnR jobs run in secure, isolated compute environments.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. FINAL CLEAN CALL TO ACTION
           ========================================================================= */}
        <section className="m-shell pb-8">
          <div className="spatial-card p-8 md:p-14 text-center max-w-3xl mx-auto space-y-6 rounded-3xl border border-cyan-500/30 relative overflow-hidden">
            <div className="space-y-3">
              <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                One Account. All Workstations.
              </h2>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Join engineers and developers building with Ace-Seek across silicon, software, and publishing.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4 pt-2">
              <a
                href="/signup"
                className="bg-gradient-to-r from-cyan-500 to-emerald-400 text-slate-950 font-black text-sm px-8 py-3.5 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:brightness-110 transition-all hover:scale-[1.02]"
              >
                <span>Create Free Account</span>
              </a>
              <a
                href="/pricing"
                className="bg-slate-900 text-slate-200 border border-slate-700 hover:border-slate-500 font-bold text-sm px-6 py-3.5 rounded-xl transition-all"
              >
                <span>Compare Plans</span>
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
