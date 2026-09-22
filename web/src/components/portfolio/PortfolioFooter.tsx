"use client";

import React from "react";
import { Sparkles, Terminal, ArrowUpRight, ShieldCheck, Heart, Layers, Code2 } from "lucide-react";

export function PortfolioFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--border-light)] bg-[#090c12] py-12 px-4 select-none">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand Monogram */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-mono font-black text-slate-950 text-xs shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              &lt;/&gt;
            </div>
            <div>
              <div className="text-sm font-black text-white tracking-wider">
                PORTFOLIO SHOWCASE
              </div>
              <div className="text-[10px] font-mono text-slate-500">
                Architecting High-Speed Web Applications & 3D Engineering Labs
              </div>
            </div>
          </div>

          {/* Quick Nav Anchors */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <a href="#holodeck" className="hover:text-cyan-400 transition-colors">
              // Live Websites
            </a>
            <a href="#bento" className="hover:text-cyan-400 transition-colors">
              // Architecture
            </a>
            <a href="#estimator" className="hover:text-cyan-400 transition-colors">
              // Scope Estimator
            </a>
            <a href="#process" className="hover:text-cyan-400 transition-colors">
              // Pipeline
            </a>
          </div>

          {/* Tech Spec Badges */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-cyan-300">
              Next.js 16
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-emerald-300">
              React 19
            </span>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-400">All Systems Operational · Sub-40ms Edge Delivery</span>
          </div>

          <div>
            © {currentYear} Web Application & 3D Lab Engineering Showcase.
          </div>
        </div>
      </div>
    </footer>
  );
}
