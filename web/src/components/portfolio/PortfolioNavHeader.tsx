"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Menu,
  X,
  Code2,
  Terminal,
  Layers,
  Calculator,
  ExternalLink,
  Cpu,
} from "lucide-react";

export function PortfolioNavHeader() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { label: "Live Websites", href: "#holodeck", icon: Terminal },
    { label: "Architecture", href: "#bento", icon: Layers },
    { label: "Scope Estimator", href: "#estimator", icon: Calculator },
    { label: "Pipeline", href: "#process", icon: Code2 },
  ];

  return (
    <header className="sticky top-4 z-50 w-full max-w-6xl mx-auto px-4 select-none">
      <div
        className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all duration-300 ${
          isScrolled
            ? "bg-[#0f141f]/90 border-cyan-500/30 backdrop-blur-xl shadow-[0_15px_40px_rgba(0,0,0,0.7)] ring-1 ring-cyan-500/20"
            : "bg-[#111622]/80 border-white/10 backdrop-blur-lg shadow-lg"
        }`}
      >
        {/* =========================================================================
            1. BRAND LOGO / MONOGRAM (NO PERSONAL NAME)
           ========================================================================= */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-black text-slate-950 text-xs shadow-[0_0_20px_rgba(6,182,212,0.4)] group-hover:scale-105 transition-transform">
            &lt;/&gt;
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-wider text-white group-hover:text-cyan-300 transition-colors">
                PORTFOLIO
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase">
                WEB LABS
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 hidden sm:block">
              Full-Stack & 3D WebGL Demonstrator
            </div>
          </div>
        </a>

        {/* =========================================================================
            2. DESKTOP NAV LINKS
           ========================================================================= */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5 shadow-inner">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.label}
                href={item.href}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400/80" />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>

        {/* =========================================================================
            3. ACTION BUTTONS & STATUS BADGE (NO HIRE / NO EMAIL)
           ========================================================================= */}
        <div className="flex items-center gap-3">
          {/* Operational Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Production Systems</span>
          </div>

          <a
            href="#holodeck"
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:brightness-110 transition-all hover:scale-105 active:scale-95"
          >
            <span>Explore Demos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* =========================================================================
          4. MOBILE DROPDOWN MENU
         ========================================================================= */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 p-4 rounded-2xl bg-[#0f141f]/95 border border-cyan-500/30 backdrop-blur-2xl shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-200 hover:text-cyan-300 hover:bg-white/5 transition-all"
                >
                  <Icon className="w-4 h-4 text-cyan-400" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400 px-2">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              All Systems Operational
            </span>
            <span className="text-cyan-400">Next.js 16 + React 19</span>
          </div>
        </div>
      )}
    </header>
  );
}
