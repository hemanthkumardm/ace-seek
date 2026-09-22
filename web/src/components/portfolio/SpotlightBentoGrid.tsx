"use client";

import React, { useState, useRef } from "react";
import {
  Terminal,
  ShieldCheck,
  Zap,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
  CheckCircle2,
  Lock,
  Globe2,
  Server,
  Workflow,
  Command,
  Play,
  RotateCcw,
} from "lucide-react";

/**
 * SpotlightCard
 * Vengeance UI-style card that renders a cursor-following radial iridescent spotlight border and background.
 */
function SpotlightCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePos({ x: -1000, y: -1000 });
      }}
      className={`relative rounded-3xl bg-[var(--surface-panel)] border border-[var(--border-light)] overflow-hidden transition-all duration-300 group ${className}`}
    >
      {/* Dynamic Cursor Spotlight Layer */}
      {isHovered && (
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 opacity-100"
          style={{
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.15), transparent 40%)`,
          }}
        />
      )}

      {/* Iridescent Border Spotlight */}
      {isHovered && (
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-300 opacity-100"
          style={{
            border: "1px solid transparent",
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(6, 182, 212, 0.4), transparent 40%) border-box`,
            mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
            WebkitMaskComposite: "destination-out",
          }}
        />
      )}

      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

export function SpotlightBentoGrid() {
  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<
    Array<{ type: "cmd" | "res"; text: string }>
  >([
    { type: "cmd", text: "sys --status" },
    {
      type: "res",
      text: "⚡ CLUSTER STATUS: All systems operational. 5 production platforms active. Edge latency: 22ms.",
    },
  ]);
  const [terminalInput, setTerminalInput] = useState("");
  const [isRunningBench, setIsRunningBench] = useState(false);

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    const newHistory = [...terminalHistory, { type: "cmd" as const, text: cmd }];

    if (trimmed === "stack" || trimmed === "sys --stack" || trimmed === "arch") {
      newHistory.push({
        type: "res",
        text: "⚡ TECH STACK:\n- Frontend: Next.js 16, React 19, TypeScript, Tailwind v4, Three.js, WebGL\n- Backend: Supabase, Node.js, Python, PostgreSQL RLS, Docker API\n- Cloud: AWS EC2, Cloudflare Edge, Serverless Functions, Vercel",
      });
    } else if (trimmed === "benchmarks" || trimmed === "run benchmarks") {
      setIsRunningBench(true);
      newHistory.push({
        type: "res",
        text: "🚀 RUNNING SYNTHETIC BENCHMARK...\n[1/3] Pinging edge origin: 22ms\n[2/3] First Contentful Paint: 0.38s\n[3/3] Lighthouse Audit Score: 100/100 across Performance, Accessibility, Best Practices, SEO.",
      });
      setTimeout(() => setIsRunningBench(false), 800);
    } else if (trimmed === "status" || trimmed === "sys --status") {
      newHistory.push({
        type: "res",
        text: "🟢 PRODUCTION READY: Multi-region Edge CDN deployed. Micro-services active with sub-40ms response.",
      });
    } else if (trimmed === "clear") {
      setTerminalHistory([]);
      return;
    } else {
      newHistory.push({
        type: "res",
        text: `Unknown command: "${cmd}". Available commands: [stack, benchmarks, status, clear]`,
      });
    }

    setTerminalHistory(newHistory);
    setTerminalInput("");
  };

  return (
    <div className="w-full space-y-12">
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Layers className="w-3.5 h-3.5" />
          <span>Vengeance Architecture Bento</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Engineered for Extreme Performance
        </h2>
        <p className="text-slate-400 text-sm md:text-base font-light">
          A glimpse into the engineering philosophy, interactive terminal console, and architectural standards behind every website in the showcase.
        </p>
      </div>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* =========================================================================
            BENTO ITEM 1: INTERACTIVE DEVELOPER TERMINAL (8 COLS)
           ========================================================================= */}
        <SpotlightCard className="md:col-span-8 p-6 md:p-8 min-h-[420px]">
          <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)] mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500/80" />
                <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>cloud-workstation ~ zsh</span>
              </span>
            </div>

            {/* Quick action triggers */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => runCommand("stack")}
                className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 hover:bg-cyan-500/20 text-cyan-300 border border-white/10 transition-colors"
              >
                stack
              </button>
              <button
                onClick={() => runCommand("benchmarks")}
                className="text-[10px] font-mono px-2.5 py-1 rounded bg-white/5 hover:bg-emerald-500/20 text-emerald-300 border border-white/10 transition-colors"
              >
                benchmarks
              </button>
              <button
                onClick={() => runCommand("clear")}
                className="text-[10px] font-mono p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                title="Clear Terminal"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Terminal Output Area */}
          <div className="flex-1 font-mono text-xs text-slate-300 space-y-3 overflow-y-auto max-h-[260px] pr-2 scrollbar-none">
            {terminalHistory.map((item, idx) => (
              <div key={idx} className="space-y-1">
                {item.type === "cmd" ? (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="text-emerald-400 font-bold">$</span>
                    <span>{item.text}</span>
                  </div>
                ) : (
                  <div className="text-slate-300 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 whitespace-pre-wrap leading-relaxed">
                    {item.text}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Terminal Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (terminalInput) runCommand(terminalInput);
            }}
            className="mt-4 pt-3 border-t border-[var(--border-light)] flex items-center gap-2"
          >
            <span className="text-emerald-400 font-mono text-xs font-bold">$</span>
            <input
              type="text"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Try typing 'stack', 'benchmarks', or 'status'..."
              className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-cyan-200 placeholder:text-slate-600"
            />
            <button
              type="submit"
              className="px-3 py-1 rounded-md bg-cyan-500 text-black font-mono text-xs font-bold hover:brightness-110 active:scale-95 transition-all"
            >
              Run
            </button>
          </form>
        </SpotlightCard>

        {/* =========================================================================
            BENTO ITEM 2: 3D SPATIAL WEBGL STUDIO (4 COLS)
           ========================================================================= */}
        <SpotlightCard className="md:col-span-4 p-6 md:p-8 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/15 blur-[80px] pointer-events-none rounded-full" />
          
          <div className="space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-4">
              <Cpu className="w-5 h-5" />
            </div>
            <div className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">
              Spatial & 3D WebGL
            </div>
            <h3 className="text-2xl font-black text-white">
              Complex 3D Interactive Labs
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Specialized in bringing mathematical algorithms, interactive 3D studios, and high-performance WebGL simulations into the browser at 120 FPS.
            </p>
          </div>

          {/* Interactive 3D Spatial Gyro Orb */}
          <div className="py-6 flex items-center justify-center">
            <div className="relative w-28 h-28 rounded-full border-2 border-purple-500/30 flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.2)] animate-[spin_12s_linear_infinite]">
              <div className="absolute w-20 h-20 rounded-full border border-cyan-400/40 rotate-45" />
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-cyan-500 flex items-center justify-center text-white shadow-lg">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border-light)] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-mono">Acceleration</span>
            <span className="font-mono text-emerald-400 font-bold">Hardware WebGL</span>
          </div>
        </SpotlightCard>

        {/* =========================================================================
            BENTO ITEM 3: ZERO-TRUST SECURITY & PRODUCTION SCALE (4 COLS)
           ========================================================================= */}
        <SpotlightCard className="md:col-span-4 p-6 md:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
              Hardened Security
            </div>
            <h3 className="text-xl font-bold text-white">Enterprise RLS & Encryption</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-stack security from day one: PostgreSQL Row-Level Security, sanitized inputs, JWT rotation, and zero-exposure credential handling.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            {["Supabase Row-Level Security (RLS)", "Automated CSRF & XSS Mitigation", "Sandboxed Web Workers"].map(
              (item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              )
            )}
          </div>
        </SpotlightCard>

        {/* =========================================================================
            BENTO ITEM 4: GLOBAL EDGE ROUTING & ULTRA LOW LATENCY (4 COLS)
           ========================================================================= */}
        <SpotlightCard className="md:col-span-4 p-6 md:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Globe2 className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              Edge Infrastructure
            </div>
            <h3 className="text-xl font-bold text-white">Sub-40ms Global Latency</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Assets, pages, and API routes distributed across 300+ edge locations worldwide with automatic intelligent caching and geo-routing.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 font-mono">AVERAGE TTFB</div>
              <div className="text-base font-black text-cyan-400 font-mono">22ms</div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-[10px] text-slate-400 font-mono">EDGE UPTIME</div>
              <div className="text-base font-black text-emerald-400 font-mono">99.99%</div>
            </div>
          </div>
        </SpotlightCard>

        {/* =========================================================================
            BENTO ITEM 5: RAPID SHIP-TO-PRODUCTION VELOCITY (4 COLS)
           ========================================================================= */}
        <SpotlightCard className="md:col-span-4 p-6 md:p-8 space-y-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
              Rapid Execution
            </div>
            <h3 className="text-xl font-bold text-white">Sprint to Production</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Zero fluff, zero bureaucracy. Working MVPs delivered in days, with continuous deployment previews and transparent progress tracking.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-center justify-between">
            <span>Average MVP Delivery:</span>
            <span className="font-mono font-black text-amber-300">5 – 10 Days</span>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
