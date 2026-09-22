"use client";

import React, { useState } from "react";
import {
  Calculator,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Clock,
  Send,
  Copy,
  Check,
  Zap,
  Shield,
  Layers,
  HelpCircle,
} from "lucide-react";

interface ProjectTier {
  id: string;
  name: string;
  desc: string;
  baseDays: number;
  basePrice: number;
  badge?: string;
}

const TIERS: ProjectTier[] = [
  {
    id: "saas",
    name: "Full-Stack SaaS MVP",
    desc: "End-to-end web application with Next.js 16, Supabase, database schema, user authentication, and core business workflow.",
    baseDays: 7,
    basePrice: 49999,
    badge: "POPULAR",
  },
  {
    id: "3d-webgl",
    name: "Interactive 3D / WebGL Lab",
    desc: "Custom browser-based 3D visualizer, engineering simulator, or spatial product interactive showcase with Three.js / Canvas.",
    baseDays: 8,
    basePrice: 64999,
    badge: "SPECIALTY",
  },
  {
    id: "enterprise",
    name: "Custom Enterprise Portal",
    desc: "Production-grade internal tooling, multi-tenant dashboard, granular RBAC, and cloud workstation integrations.",
    baseDays: 12,
    basePrice: 94999,
  },
  {
    id: "landing",
    name: "High-Conversion Vibe UI",
    desc: "Ultra-sleek landing page with Skiper/Vengeance UI micro-animations, 100/100 Lighthouse performance, and custom design tokens.",
    baseDays: 4,
    basePrice: 29999,
  },
];

interface Addon {
  id: string;
  label: string;
  days: number;
  price: number;
  desc: string;
}

const ADDONS: Addon[] = [
  {
    id: "payments",
    label: "Stripe / Razorpay Checkout & Webhooks",
    days: 2,
    price: 14999,
    desc: "One-time payments, subscriptions, customer billing portal, and automated invoice delivery.",
  },
  {
    id: "rbac",
    label: "Enterprise Auth & Role-Based Access (RBAC)",
    days: 2,
    price: 16999,
    desc: "Supabase / Clerk auth with granular admin, editor, and viewer permissions per organization.",
  },
  {
    id: "ai-assistant",
    label: "Autonomous AI Copilot / LLM Streaming",
    days: 3,
    price: 24999,
    desc: "Real-time streaming agent response, custom prompt chaining, and vector database embeddings.",
  },
  {
    id: "perf-seo",
    label: "Lighthouse 100/100 & Technical SEO Suite",
    days: 1,
    price: 9999,
    desc: "Edge caching, Core Web Vitals tuning, JSON-LD rich schema, and OpenGraph social previews.",
  },
];

export function ProjectEstimator() {
  const [selectedTierId, setSelectedTierId] = useState<string>("saas");
  const [selectedAddons, setSelectedAddons] = useState<string[]>(["payments", "rbac"]);
  const [copied, setCopied] = useState(false);

  const currentTier = TIERS.find((t) => t.id === selectedTierId) || TIERS[0];

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  // Calculations
  const addonDays = selectedAddons.reduce((acc, addonId) => {
    const addon = ADDONS.find((a) => a.id === addonId);
    return acc + (addon ? addon.days : 0);
  }, 0);

  const addonPrice = selectedAddons.reduce((acc, addonId) => {
    const addon = ADDONS.find((a) => a.id === addonId);
    return acc + (addon ? addon.price : 0);
  }, 0);

  const totalDays = currentTier.baseDays + addonDays;
  const totalPrice = currentTier.basePrice + addonPrice;

  const addonNames = selectedAddons
    .map((id) => ADDONS.find((a) => a.id === id)?.label)
    .filter(Boolean)
    .join(", ");

  const copyBrief = () => {
    const text =
      `PROJECT SPECIFICATION BRIEF\n` +
      `----------------------------\n` +
      `Scope: ${currentTier.name}\n` +
      `Selected Modules: ${addonNames || "Standard Core"}\n` +
      `Estimated Turnaround: ~${totalDays} business days\n` +
      `Estimated Budget: ~₹${totalPrice.toLocaleString("en-IN")} INR\n` +
      `Status: Production Ready Plan`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-12">
      <div className="max-w-2xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-wider">
          <Calculator className="w-3.5 h-3.5" />
          <span>Interactive Scope & Delivery Estimator</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
          Plan Your Project in Real Time
        </h2>
        <p className="text-slate-400 text-sm md:text-base font-light">
          Customize your requirements, see estimated turnaround times, and generate an instant project brief with transparent Indian Rupee (₹) pricing.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* =========================================================================
            LEFT CONFIGURATION COLUMN (7 COLS)
           ========================================================================= */}
        <div className="lg:col-span-7 space-y-8">
          {/* Step 1: Select Project Tier */}
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              1. Select Project Type
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {TIERS.map((tier) => {
                const isSelected = tier.id === selectedTierId;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setSelectedTierId(tier.id)}
                    className={`relative p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--surface-raised)] border-cyan-400/80 shadow-[0_0_30px_rgba(6,182,212,0.2)] ring-1 ring-cyan-400/40"
                        : "bg-[var(--surface-panel)] border-[var(--border-light)] hover:border-slate-600 hover:bg-[var(--surface-raised)]"
                    }`}
                  >
                    {tier.badge && (
                      <span className="absolute top-3 right-3 text-[9px] font-black px-2 py-0.5 rounded bg-gradient-to-r from-cyan-500 to-blue-600 text-black uppercase tracking-wider">
                        {tier.badge}
                      </span>
                    )}
                    <h4 className="text-base font-bold text-white mb-1.5">{tier.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{tier.desc}</p>
                    <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-[var(--border-light)]">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>~{tier.baseDays} Days</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        From ₹{tier.basePrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Add-Ons */}
          <div className="space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">
              2. Choose Additional Modules & Integrations
            </div>
            <div className="space-y-3">
              {ADDONS.map((addon) => {
                const isChecked = selectedAddons.includes(addon.id);
                return (
                  <div
                    key={addon.id}
                    onClick={() => toggleAddon(addon.id)}
                    className={`p-4 rounded-2xl border flex items-start justify-between gap-4 cursor-pointer transition-all ${
                      isChecked
                        ? "bg-[var(--surface-raised)] border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                        : "bg-[var(--surface-panel)] border-[var(--border-light)] hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                          isChecked
                            ? "bg-cyan-500 border-cyan-400 text-black"
                            : "border-slate-600 bg-black/40"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{addon.label}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{addon.desc}</div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        +₹{addon.price.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">+{addon.days}d</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT SUMMARY & CTA CARD (5 COLS)
           ========================================================================= */}
        <div className="lg:col-span-5 sticky top-24">
          <div className="rounded-3xl bg-gradient-to-b from-[#161d2b] to-[#0f141f] border border-cyan-500/30 p-8 shadow-[0_20px_60px_rgba(0,0,0,0.7)] space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-light)]">
              <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-bold">
                Project Summary
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FIXED SCOPE GUARANTEE
              </span>
            </div>

            {/* Selected Breakdown */}
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-400">Selected Base Scope</div>
                <div className="text-lg font-bold text-white">{currentTier.name}</div>
              </div>

              {selectedAddons.length > 0 && (
                <div>
                  <div className="text-xs text-slate-400 mb-1.5">Configured Add-ons</div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAddons.map((id) => (
                      <span
                        key={id}
                        className="text-[10px] font-mono px-2 py-1 rounded bg-white/5 text-slate-300 border border-white/10"
                      >
                        {ADDONS.find((a) => a.id === id)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Metrics Counter Box */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-[var(--surface-recessed)] border border-[var(--border-light)]">
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated Delivery</div>
                <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                  ~{totalDays} <span className="text-xs font-normal text-slate-400">Days</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">Estimated Budget</div>
                <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  ~₹{totalPrice.toLocaleString("en-IN")}{" "}
                  <span className="text-xs font-normal text-slate-400">INR</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-light">
              Includes full source code repository, comprehensive documentation, deployment onto production domains, and 30-day post-launch warranty.
            </p>

            {/* Actions */}
            <div className="space-y-3 pt-2">
              <button
                onClick={copyBrief}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-slate-950 font-black text-sm px-6 py-4 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.35)] hover:brightness-110 transition-all hover:scale-[1.02] active:scale-95 text-center cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                    <span>Project Brief Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Project Specification Brief (₹ INR)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
