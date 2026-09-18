"use client";

import React from "react";
import Link from "next/link";
import {
  Boxes,
  Heart,
  Server,
  Users,
  Cpu,
  Zap,
  Terminal,
  Activity,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import { DonateButton } from "@/components/DonateModal";
import { VLSI_URL, SITE_URL } from "@/lib/site";

export function OpenroadFooter() {
  return (
    <footer className="mt-12 border-t border-white/50 bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono">
      <div className="m-shell py-10 md:py-14 space-y-10">
        {/* ── Community Cloud Capacity & Increase Max Users Donate Banner ── */}
        <div className="neu-panel p-6 md:p-8 space-y-6 border-2 border-rose-300/60 shadow-lg relative overflow-hidden bg-gradient-to-br from-[var(--neu-bg)] via-[var(--neu-bg)] to-rose-50/20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/40 pb-4">
            <div className="flex items-center gap-2">
              <span className="neu-panel-sm p-1.5 text-rose-600 bg-rose-50 rounded-lg">
                <Server className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
                COMMUNITY COMPUTE INFRASTRUCTURE · OPENROAD CLOUD
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100/80 text-emerald-800 border border-emerald-300/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active Container Runners (Sky130 · GF180)
              </span>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="space-y-2">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[var(--neu-text)] flex items-center gap-2.5">
                  <Users className="w-6 h-6 text-rose-600 shrink-0" />
                  <span>Help Us Increase Maximum Concurrent Users & Cloud Capacity</span>
                </h2>
                <p className="text-xs md:text-sm text-[var(--neu-text-muted)] leading-relaxed font-bold">
                  Ace-Seek OpenROAD provides browser-based physical design automation and containerized tapeout runs. Autonomous PnR workflows—Yosys synthesis, floorplanning, TritonCTS, detailed routing, and Magic DRC/LVS—demand heavy multi-core CPU and high-RAM container nodes.
                </p>
                <p className="text-xs md:text-sm text-[var(--neu-text-muted)] leading-relaxed font-bold">
                  Your contributions directly fund scaling our server cluster to <strong>increase maximum concurrent users</strong>, expand 32GB–64GB RAM quotas for complex tapeouts, and keep run queues instantaneous for students, researchers, and open-source ASIC engineers worldwide.
                </p>
              </div>

              {/* Impact Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                <div className="neu-inset p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-700 font-black text-[11px]">
                    <Users className="w-3.5 h-3.5" />
                    <span>More Users</span>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-tight">
                    Scale concurrent user slots without queues
                  </p>
                </div>
                <div className="neu-inset p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-700 font-black text-[11px]">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>High-RAM Nodes</span>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-tight">
                    32GB–64GB RAM for dense 100+ macro SoCs
                  </p>
                </div>
                <div className="neu-inset p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-black text-[11px]">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Instant Queues</span>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-tight">
                    Dedicated container runner elasticity
                  </p>
                </div>
                <div className="neu-inset p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-black text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Free Access</span>
                  </div>
                  <p className="text-[10px] font-bold text-[var(--neu-text-muted)] leading-tight">
                    Keep open-source tapeouts open to all
                  </p>
                </div>
              </div>
            </div>

            {/* Donate CTA Box */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center neu-inset p-6 space-y-4 text-center rounded-2xl border border-rose-200/50 bg-rose-50/10">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-600 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-rose-800">
                  Community Capacity Fund
                </span>
                <p className="text-[11px] font-bold text-[var(--neu-text-muted)] leading-snug">
                  Every contribution directly adds compute time and concurrent slots for students and creators.
                </p>
              </div>

              <div className="w-full pt-1">
                <DonateButton
                  className="neu-btn !bg-gradient-to-r !from-rose-500 !to-pink-600 !text-white hover:!from-rose-600 hover:!to-pink-700 !border-rose-400 !text-xs font-black px-6 py-3 rounded-xl shadow-md inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] w-full"
                  modalTitle="Increase OpenROAD Cloud Capacity"
                  modalSubtitle="Your support directly funds increased maximum concurrent users and high-RAM container runners."
                >
                  <Heart className="w-4 h-4 fill-white text-white animate-pulse" />
                  <span>Donate to Increase Max Users</span>
                </DonateButton>
              </div>

              <p className="text-[9.5px] font-bold text-slate-500 leading-tight">
                Secure Razorpay checkout (UPI, Cards, Netbanking). 100% applied to cloud compute infrastructure.
              </p>
            </div>
          </div>
        </div>

        {/* ── OpenROAD Platform Directory & Ecosystem Links ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-xs font-bold">
          {/* Column 1 */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-sky-700 flex items-center gap-1.5">
              <Boxes className="w-3.5 h-3.5" />
              <span>OpenROAD Studios</span>
            </p>
            <div className="space-y-2 text-[var(--neu-text-muted)]">
              <Link href="/openroad/studio" className="block hover:text-[var(--neu-text)] transition-colors">
                PnR Studio (Max Runner)
              </Link>
              <Link href="/openroad/project" className="block hover:text-[var(--neu-text)] transition-colors">
                Project & File Manager
              </Link>
              <Link href="/openroad/design" className="block hover:text-[var(--neu-text)] transition-colors">
                Design & SDC Editor
              </Link>
              <Link href="/openroad/scripts" className="block hover:text-[var(--neu-text)] transition-colors">
                Tcl Automation Scripts (Pro)
              </Link>
              <Link href="/openroad/run" className="block hover:text-[var(--neu-text)] transition-colors">
                Active Job Queue & Logs
              </Link>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>VLSI Platforms</span>
            </p>
            <div className="space-y-2 text-[var(--neu-text-muted)]">
              <a href={VLSI_URL} className="block hover:text-[var(--neu-text)] transition-colors inline-flex items-center gap-1">
                <span>vlsi.ace-seek.com</span>
                <ArrowUpRight className="w-3 h-3 text-indigo-500" />
              </a>
              <Link href="/vlsi/learn" className="block hover:text-[var(--neu-text)] transition-colors">
                VLSI Learning Portal
              </Link>
              <a href="/die_viewer_3d.html" className="block hover:text-[var(--neu-text)] transition-colors">
                3D Silicon Stacking Lab
              </a>
              <Link href="/vlsi/interview-masterclass" className="block hover:text-[var(--neu-text)] transition-colors">
                Interview Masterclass (286 Qs)
              </Link>
              <Link href="/vlsi/timing-studio" className="block hover:text-[var(--neu-text)] transition-colors">
                STA Timing & Slack Studio
              </Link>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>PDKs & Signoff Decks</span>
            </p>
            <div className="space-y-2 text-[var(--neu-text-muted)]">
              <span className="block text-[var(--neu-text)]">
                SkyWater 130nm (sky130A / sky130B)
              </span>
              <span className="block text-[var(--neu-text)]">
                GlobalFoundries 180nm (GF180MCU)
              </span>
              <span className="block text-[var(--neu-text)]">
                ASAP 7nm FinFET Predictive
              </span>
              <span className="block text-[var(--neu-text-muted)]">
                Magic DRC & Netgen LVS Signoff
              </span>
              <span className="block text-[var(--neu-text-muted)]">
                OpenSTA Multi-Corner Timing
              </span>
            </div>
          </div>

          {/* Column 4 */}
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Legal & Policies</span>
            </p>
            <div className="space-y-2 text-[var(--neu-text-muted)]">
              <a href={`${SITE_URL}/privacy`} className="block hover:text-[var(--neu-text)] transition-colors">
                Privacy Policy
              </a>
              <a href={`${SITE_URL}/terms`} className="block hover:text-[var(--neu-text)] transition-colors">
                Terms & Conditions
              </a>
              <a href={`${SITE_URL}/refund-policy`} className="block hover:text-[var(--neu-text)] transition-colors">
                Refund Policy
              </a>
              <a href={`${SITE_URL}/cancellation-policy`} className="block hover:text-[var(--neu-text)] transition-colors">
                Cancellation Policy
              </a>
              <a href={`${SITE_URL}/contact-us`} className="block hover:text-[var(--neu-text)] transition-colors">
                Contact & Support
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom Telemetry & Status Strip ── */}
        <div className="border-t border-white/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[var(--neu-text-muted)]">
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-700" />
            <span>© {new Date().getFullYear()} Ace-Seek Inc. · Autonomous OpenROAD Physical Design Automation</span>
          </div>

          <div className="flex items-center gap-4 font-bold">
            <DonateButton
              className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:underline transition-colors"
              modalTitle="Increase OpenROAD Cloud Capacity"
              modalSubtitle="Support scaling maximum concurrent users and cloud runner infrastructure."
            >
              <Heart className="w-3 h-3 fill-rose-500 text-rose-600" />
              <span>Donate</span>
            </DonateButton>
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-600" />
              <span>Cloud Cluster Active</span>
            </span>
            <span className="text-sky-700 font-black">openroad.ace-seek.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
