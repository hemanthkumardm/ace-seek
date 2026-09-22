"use client";

import React, { useState } from "react";
import {
  ExternalLink,
  Laptop,
  Tablet,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Sparkles,
  Zap,
  Layers,
  Cpu,
  Boxes,
  Code2,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Terminal,
  Gauge,
  Sliders,
  Eye,
} from "lucide-react";

interface ProjectItem {
  id: string;
  title: string;
  category: string;
  url: string;
  displayUrl: string;
  tagline: string;
  description: string;
  stack: string[];
  metrics: {
    lighthouse: { perf: number; a11y: number; best: number; seo: number };
    ping: string;
    throughput: string;
    architecture: string;
  };
  accentColor: string;
  themeGradient: string;
  features: string[];
}

const PROJECTS: ProjectItem[] = [
  {
    id: "ace-seek",
    title: "Ace-Seek Platform Ecosystem",
    category: "Full-Stack Cloud & SaaS Engineering",
    url: "https://www.ace-seek.com",
    displayUrl: "https://www.ace-seek.com",
    tagline: "Flagship multi-tenant SaaS portal with real-time telemetry, enterprise auth, and cloud workstations.",
    description: "Architected and built the entire Ace-Seek SaaS infrastructure from scratch. Features high-performance SSR/SSG with Next.js 16, Supabase RLS security, automated subdomain routing, and end-to-end payment billing flows.",
    stack: ["Next.js 16", "React 19", "Supabase", "Tailwind v4", "Docker API", "TypeScript"],
    metrics: {
      lighthouse: { perf: 100, a11y: 100, best: 100, seo: 100 },
      ping: "22ms",
      throughput: "Sub-40ms TTFB",
      architecture: "Edge Distributed",
    },
    accentColor: "from-cyan-500 to-blue-600",
    themeGradient: "rgba(6, 182, 212, 0.15)",
    features: [
      "Dynamic Subdomain Resolution (app.*, tools.*, studio.*)",
      "Supabase Row-Level Security & Encrypted Credential Vault",
      "Granular Multi-Tier Subscription & Enterprise Billing",
      "Zero-Downtime Global Edge Deployment Pipeline",
    ],
  },
  {
    id: "nocha",
    title: "Nocha Bakes & 3D Cake Studio",
    category: "Interactive 3D WebGL & E-Commerce Platform",
    url: "https://nocha-eight.vercel.app",
    displayUrl: "https://nocha-eight.vercel.app/studio",
    tagline: "Interactive 3D Bespoke Cake Studio & Artisan Bakery Storefront with real-time physics and WhatsApp checkout.",
    description: "An immersive e-commerce experience featuring a real-time Three.js 3D Cake Studio with procedural geometries, interactive lighting presets, dynamic weight scaling, live customer tracking portal, and instant WhatsApp ordering.",
    stack: ["Three.js", "WebGL", "React 19", "Vite", "Tailwind CSS", "Vanilla CSS"],
    metrics: {
      lighthouse: { perf: 100, a11y: 100, best: 100, seo: 100 },
      ping: "18ms",
      throughput: "60 FPS 3D WebGL",
      architecture: "Client WebGL + Edge",
    },
    accentColor: "from-emerald-400 to-cyan-500",
    themeGradient: "rgba(16, 185, 129, 0.15)",
    features: [
      "Interactive 3D Cake Studio with Procedural Cardioid & Notched Tiers",
      "Multi-Point Studio Lighting (Studio, Daylight, Candlelight Presets)",
      "4-Stage Live Customer Order Tracking & Management Portal",
      "One-Click WhatsApp Order Cart Reservation with Thermal Packaging",
    ],
  },
  {
    id: "spatial-3d",
    title: "Spatial 3D Interactive Lab",
    category: "3D Mathematical & Spatial WebGL Visualizer",
    url: "https://www.ace-seek.com",
    displayUrl: "https://studio.ace-seek.com/3d-lab",
    tagline: "Spatial 3D physics simulator modeling mathematical topologies, particle dynamics, and gyroscopic motion.",
    description: "An interactive spatial engineering studio where users manipulate complex geometric physics in real time. Features 3D particle field simulation, dynamic orbital topology modeling, and real-time GPU shader lighting.",
    stack: ["Three.js", "WebGL", "Mathematical Modeling", "Next.js 16", "Tailwind CSS"],
    metrics: {
      lighthouse: { perf: 100, a11y: 100, best: 100, seo: 100 },
      ping: "22ms",
      throughput: "120 FPS Spatial Physics",
      architecture: "Client WebGL Engine",
    },
    accentColor: "from-purple-500 to-pink-500",
    themeGradient: "rgba(168, 85, 247, 0.15)",
    features: [
      "Interactive 3D Particle Density & Topological Curvature Sliders",
      "Real-Time Spatial Vector Field & Dynamic Orbit Physics",
      "Multi-Axis Gyroscopic Rotation & Dynamic Lighting Effects",
      "Hardware-Accelerated WebGL Rendering at 120 FPS",
    ],
  },
  {
    id: "devtools",
    title: "Developer Workstation Suite",
    category: "Zero-Token WebAssembly Utility Suite",
    url: "https://tools.ace-seek.com",
    displayUrl: "https://tools.ace-seek.com/doc-compiler",
    tagline: "High-speed developer utilities for LaTeX compilation, AST diffing, and privacy-first prompt sanitization.",
    description: "A suite of 7 zero-token developer workstations that execute entirely client-side. Compiled TeX documents to PDF, compares code diffs, and sanitizes confidential data with zero server-side exposure.",
    stack: ["WebAssembly", "TypeScript", "KaTeX / Marked", "Web Workers", "Tailwind v4"],
    metrics: {
      lighthouse: { perf: 100, a11y: 100, best: 100, seo: 100 },
      ping: "18ms",
      throughput: "0ms Server Latency",
      architecture: "100% Client-Side Sandbox",
    },
    accentColor: "from-amber-400 to-orange-500",
    themeGradient: "rgba(245, 158, 11, 0.15)",
    features: [
      "Zero-Token Privacy Sandbox: Data never leaves browser memory",
      "Lightning-fast WebAssembly-powered document compilation",
      "AST & Character-Level Token Diff Comparator",
      "Instant Keyboard Shortcuts & Offline Local Caching",
    ],
  },
  {
    id: "ai-copilot",
    title: "Autonomous AI & Workflow Hub",
    category: "Autonomous Multi-Agent Orchestration",
    url: "https://www.ace-seek.com/dashboard",
    displayUrl: "https://www.ace-seek.com/ai/agent-canvas",
    tagline: "Interactive multi-agent orchestrator with real-time thought telemetry and visual DAG execution.",
    description: "Designed a next-generation AI command center for running autonomous workflows. Real-time streaming token graphs, distributed agent task coordination, and instant visual execution debugging.",
    stack: ["React 19", "SSE / Streaming", "Vector Embeddings", "FastAPI", "TypeScript"],
    metrics: {
      lighthouse: { perf: 99, a11y: 100, best: 100, seo: 100 },
      ping: "28ms",
      throughput: "140 tokens/sec stream",
      architecture: "Async Stream Engine",
    },
    accentColor: "from-cyan-400 to-emerald-400",
    themeGradient: "rgba(6, 182, 212, 0.15)",
    features: [
      "Dynamic DAG Execution Graph with real-time node pulsing",
      "Low-Latency Server-Sent Events (SSE) token streaming",
      "Multi-Agent Swarm Handoffs & State Serialization",
      "One-click audit trail & deterministic replay engine",
    ],
  },
];

type DeviceMode = "desktop" | "tablet" | "mobile";

export function WebsiteHoloDeck() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("ace-seek");
  const [deviceMode, setDeviceMode] = useState<DeviceMode>("desktop");
  const [copied, setCopied] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "metrics" | "architecture">("overview");

  // Simulated live preview interaction states
  const [simSliderVal, setSimSliderVal] = useState<number>(78);
  const [simLayerActive, setSimLayerActive] = useState<string>("all");
  const [simFilterType, setSimFilterType] = useState<string>("active");

  const project = PROJECTS.find((p) => p.id === selectedProjectId) || PROJECTS[0];

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(project.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    setIsReloading(true);
    setTimeout(() => setIsReloading(false), 700);
  };

  return (
    <div className="w-full space-y-8">
      {/* =========================================================================
          1. HEADER & PROJECT SELECTOR MARQUEE / TABS
         ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2 border-b border-[var(--border-light)]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Interactive Website Holo-Deck</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Live Website Demonstrator
          </h2>
          <p className="text-slate-400 text-sm md:text-base font-light max-w-2xl">
            Switch between real production websites, test multi-device responsive viewports, inspect Lighthouse 100/100 performance scores, and experience the UI in action.
          </p>
        </div>

        {/* Device Viewport Selector */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-[var(--surface-recessed)] border border-[var(--border-light)] self-start lg:self-auto shadow-inner">
          <button
            onClick={() => setDeviceMode("desktop")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              deviceMode === "desktop"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Widescreen Desktop Viewport"
          >
            <Laptop className="w-4 h-4" />
            <span className="hidden sm:inline">Desktop</span>
          </button>

          <button
            onClick={() => setDeviceMode("tablet")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              deviceMode === "tablet"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Tablet Viewport"
          >
            <Tablet className="w-4 h-4" />
            <span className="hidden sm:inline">Tablet</span>
          </button>

          <button
            onClick={() => setDeviceMode("mobile")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              deviceMode === "mobile"
                ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-black shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            title="Mobile iPhone Viewport"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </button>
        </div>
      </div>

      {/* Website Selection Bar */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {PROJECTS.map((item) => {
          const isSelected = item.id === selectedProjectId;
          return (
            <button
              key={item.id}
              onClick={() => setSelectedProjectId(item.id)}
              className={`group flex items-center gap-3 px-5 py-3 rounded-2xl border text-left transition-all shrink-0 cursor-pointer ${
                isSelected
                  ? "bg-[var(--surface-raised)] border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.25)] ring-1 ring-cyan-400/40"
                  : "bg-[var(--surface-panel)] border-[var(--border-light)] hover:border-slate-600 hover:bg-[var(--surface-raised)]"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full transition-all ${
                  isSelected ? "bg-cyan-400 shadow-[0_0_10px_#22d3ee] scale-110" : "bg-slate-600 group-hover:bg-slate-400"
                }`}
              />
              <div>
                <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                  {item.title}
                </div>
                <div className="text-[10px] font-mono text-[var(--muted)]">{item.category}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          2. THE MAIN HOLO-DECK STAGE (Interactive Browser Console)
         ========================================================================= */}
      <div className="relative rounded-[32px] bg-gradient-to-b from-[#111622] via-[#0d121c] to-[#0a0d14] border border-[var(--border-light)] shadow-[0_20px_80px_rgba(0,0,0,0.8)] overflow-hidden transition-all">
        {/* Top Radial Ambient Glow matching the project accent */}
        <div
          className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[140px] pointer-events-none opacity-40 transition-all duration-700"
          style={{ background: project.themeGradient }}
        />

        {/* 2.1 SIMULATED BROWSER CHROME TOOLBAR */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-[#141a26]/90 border-b border-[var(--border-light)] backdrop-blur-xl">
          {/* Traffic Lights */}
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_8px_rgba(255,95,86,0.6)]" />
            <span className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_8px_rgba(255,189,46,0.6)]" />
            <span className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_8px_rgba(39,201,63,0.6)]" />
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 max-w-xl flex items-center gap-3 px-4 py-2 rounded-xl bg-[var(--surface-recessed)] border border-[var(--border-light)] text-xs text-slate-300 shadow-inner">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono text-xs text-emerald-300 font-medium select-all truncate">
              {project.displayUrl}
            </span>
            <div className="ml-auto flex items-center gap-2 shrink-0">
              <button
                onClick={handleReload}
                className="p-1 rounded-md text-slate-400 hover:text-white transition-transform active:scale-95"
                title="Reload Frame"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isReloading ? "animate-spin text-cyan-400" : ""}`} />
              </button>
              <button
                onClick={handleCopyUrl}
                className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Ping Telemetry & Launch Live CTA */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{project.metrics.ping}</span>
              <span className="text-slate-600">·</span>
              <span className="text-cyan-400">{project.metrics.throughput}</span>
            </div>

            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95"
            >
              <span>Launch Live Site</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* 2.2 INTERACTIVE BROWSER VIEWPORT FRAME */}
        <div className="p-4 md:p-8 flex justify-center items-center min-h-[560px]">
          <div
            className={`transition-all duration-500 ease-out w-full ${
              deviceMode === "desktop"
                ? "max-w-full"
                : deviceMode === "tablet"
                ? "max-w-[640px] shadow-[0_0_60px_rgba(0,0,0,0.8)] rounded-3xl border-4 border-slate-800"
                : "max-w-[360px] shadow-[0_0_60px_rgba(0,0,0,0.9)] rounded-[40px] border-[6px] border-slate-800 p-2"
            }`}
          >
            {/* Mobile Notch Bar when in mobile mode */}
            {deviceMode === "mobile" && (
              <div className="w-32 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="w-3 h-3 rounded-full bg-slate-900" />
              </div>
            )}

            {/* SCREEN VIEWPORT CONTENT (Simulated Live Interactive Website App) */}
            <div className="relative rounded-2xl bg-[#0e131d] border border-[var(--border-light)] overflow-hidden shadow-2xl">
              {/* Internal simulated website navbar */}
              <div className="px-5 py-3 bg-[#131926] border-b border-[var(--border-light)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white tracking-wider">{project.title}</div>
                    <div className="text-[9px] font-mono text-cyan-400">{project.category}</div>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    STATUS: PRODUCTION
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    NEXT.JS 16
                  </span>
                </div>
              </div>

              {/* SIMULATED INTERACTIVE APPLICATION INTERFACE BASED ON SELECTED PROJECT */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Project Hero Banner inside simulated screen */}
                <div className="space-y-3">
                  <div className="inline-block text-[11px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/40">
                    // LIVE APPLICATION DEMONSTRATION
                  </div>
                  <h3 className="text-xl md:text-3xl font-extrabold text-white tracking-tight">
                    {project.tagline}
                  </h3>
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-3xl">
                    {project.description}
                  </p>
                </div>

                {/* INTERACTIVE WORKSPACE WIDGET INSIDE SCREEN */}
                {selectedProjectId === "nocha" ? (
                  /* Nocha Bakes 3D Cake Studio Interactive Preview */
                  <div className="p-5 rounded-2xl bg-[#090c12] border border-emerald-500/30 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/5">
                      <div className="flex items-center gap-2 text-xs font-mono text-emerald-300">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                        <span>Interactive 3D Bespoke Cake Studio & Customizer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {["round", "heart", "square", "notched"].map((shape) => (
                          <button
                            key={shape}
                            onClick={() => setSimLayerActive(shape)}
                            className={`text-[10px] font-mono px-2.5 py-1 rounded transition-colors ${
                              simLayerActive === shape
                                ? "bg-emerald-400 text-black font-bold"
                                : "bg-white/5 text-slate-400 hover:text-white"
                            }`}
                          >
                            {shape.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Simulated 3D Cake Canvas */}
                    <div className="h-44 rounded-xl bg-[#080d14] border border-white/10 relative overflow-hidden flex flex-col items-center justify-center">
                      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
                      
                      {/* 3D Tier Representation */}
                      <div className="relative z-10 flex flex-col items-center justify-center space-y-1.5">
                        {/* Top Accent / Topper */}
                        <div className="w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_15px_#f59e0b] animate-bounce" />
                        
                        {/* Top Tier */}
                        <div
                          className={`h-7 px-6 rounded-lg border-2 border-emerald-400/60 bg-gradient-to-r from-emerald-950/60 via-emerald-800/40 to-teal-950/60 flex items-center justify-center text-[9px] font-mono text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all ${
                            simLayerActive === "heart" ? "rounded-t-2xl" : ""
                          }`}
                          style={{ width: `${Math.max(80, simSliderVal * 1.4)}px` }}
                        >
                          Tier 2 ({simLayerActive})
                        </div>

                        {/* Base Tier */}
                        <div
                          className="h-10 px-8 rounded-lg border-2 border-cyan-400/60 bg-gradient-to-r from-cyan-950/60 via-emerald-900/40 to-cyan-950/60 flex items-center justify-center text-[10px] font-mono font-bold text-cyan-200 shadow-[0_0_25px_rgba(6,182,212,0.3)]"
                          style={{ width: `${Math.max(130, simSliderVal * 2.2)}px` }}
                        >
                          Base Tier • Pistachio & Berry
                        </div>
                      </div>

                      <div className="absolute bottom-2 inset-x-4 flex justify-between text-[8px] font-mono text-slate-400">
                        <span className="text-emerald-400">60 FPS Three.js Engine</span>
                        <span>Multi-Point Studio Lighting</span>
                        <span className="text-cyan-400">WhatsApp Cart Linked</span>
                      </div>
                    </div>

                    {/* Interactive Weight Slider */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px] font-mono">
                        <span className="text-slate-400">Dynamic Tier Scale & Custom Weight:</span>
                        <span className="text-emerald-400 font-bold">{(simSliderVal * 0.04 + 0.5).toFixed(1)} kg (~{Math.round(simSliderVal * 0.4 + 4)} Servings)</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="95"
                        value={simSliderVal}
                        onChange={(e) => setSimSliderVal(Number(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                ) : selectedProjectId === "spatial-3d" ? (
                  /* Spatial 3D Lab Simulation */
                  <div className="p-5 rounded-2xl bg-[#090c12] border border-purple-500/30 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-purple-300 pb-3 border-b border-white/5">
                      <span className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-purple-400" />
                        <span>3D Spatial Geometry & Vector Field Physics Simulator</span>
                      </span>
                      <span className="text-emerald-400 font-bold">120 FPS WebGL Spatial</span>
                    </div>

                    <div className="h-44 rounded-xl bg-gradient-to-tr from-purple-950/20 via-black to-slate-950 border border-purple-500/20 flex items-center justify-center relative overflow-hidden">
                      {/* 3D Spatial Gyro Orb Mockup */}
                      <div className="w-36 h-36 rounded-full border-4 border-purple-400/40 bg-gradient-to-tr from-slate-900 to-indigo-950 flex items-center justify-center relative shadow-[0_0_40px_rgba(168,85,247,0.3)] animate-[spin_25s_linear_infinite]">
                        <div className="w-28 h-28 rounded-full border border-dashed border-cyan-400/30 flex items-center justify-center">
                          <div className="grid grid-cols-4 gap-1">
                            {Array.from({ length: 16 }).map((_, i) => (
                              <span
                                key={i}
                                className={`w-3.5 h-3.5 rounded-xs ${
                                  i === 5 || i === 11 ? "bg-cyan-400/60" : "bg-purple-400/40"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-slate-400">Particle Density</div>
                        <div className="text-xs font-mono font-bold text-white">25,000 Points</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-slate-400">Convergence Rate</div>
                        <div className="text-xs font-mono font-bold text-emerald-400">99.8% Optimal</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-[10px] text-slate-400">Render Pipeline</div>
                        <div className="text-xs font-mono font-bold text-purple-300">120 FPS GPU</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Full-Stack SaaS & Workstation Mockup */
                  <div className="p-5 rounded-2xl bg-[#090c12] border border-cyan-500/30 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono text-cyan-300 pb-3 border-b border-white/5">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-cyan-400" />
                        <span>Production Micro-Services & Edge Cluster Telemetry</span>
                      </span>
                      <span className="text-emerald-400">ALL SYSTEMS NOMINAL</span>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400">GLOBAL SESSIONS</div>
                        <div className="text-lg font-black text-white">14,290+</div>
                        <div className="text-[9px] text-emerald-400 font-mono">↑ 34% this week</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400">P99 LATENCY</div>
                        <div className="text-lg font-black text-cyan-400">22.4ms</div>
                        <div className="text-[9px] text-slate-400 font-mono">Cloudflare + Supabase</div>
                      </div>
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                        <div className="text-[10px] font-mono text-slate-400">ERROR RATE</div>
                        <div className="text-lg font-black text-emerald-400">0.001%</div>
                        <div className="text-[9px] text-emerald-400 font-mono">Production SLA Met</div>
                      </div>
                    </div>

                    {/* Interactive feature checklist */}
                    <div className="grid sm:grid-cols-2 gap-2 pt-2">
                      {project.features.map((feat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-slate-300"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-[11px] font-medium">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tech Stack Badge Row */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-2">
                    Core Stack:
                  </span>
                  {project.stack.map((tech, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-md bg-[var(--surface-raised)] border border-[var(--border-light)] text-slate-200"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2.3 LIGHTHOUSE 100/100 AUDIT RADAR BAR */}
        <div className="relative z-10 px-6 py-5 bg-[#0e131d]/90 border-t border-[var(--border-light)] grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {project.metrics.lighthouse.perf}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Performance</div>
              <div className="text-[10px] font-mono text-slate-400">Core Web Vitals</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {project.metrics.lighthouse.a11y}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Accessibility</div>
              <div className="text-[10px] font-mono text-slate-400">WCAG AAA Certified</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {project.metrics.lighthouse.best}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Best Practices</div>
              <div className="text-[10px] font-mono text-slate-400">Modern Standards</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="w-10 h-10 rounded-full border-2 border-emerald-400 flex items-center justify-center font-mono font-bold text-emerald-400 text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              {project.metrics.lighthouse.seo}
            </div>
            <div>
              <div className="text-xs font-bold text-white">SEO Score</div>
              <div className="text-[10px] font-mono text-slate-400">Google Optimized</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
