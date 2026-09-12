"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  ArrowRight,
  CheckCircle2,
  Cpu,
  FileCode2,
  Award,
  BookOpen,
  Dumbbell,
  Wrench,
  Stethoscope,
  Scissors,
  MessageSquare,
  ChevronDown,
  Building2,
  Sliders,
  CheckCheck,
  FileCheck,
  ShieldCheck,
  Terminal,
  Send,
  Layers,
  Check,
  Clock,
  Sparkle,
  Star
} from "lucide-react";

// WhatsApp Quick-Connect URL
const WHATSAPP_NUMBER = "918431670673";
const WHATSAPP_DEFAULT_MSG = encodeURIComponent(
  "Hi Ace-Seek, I would like to request a quote for Engineering / Academic / Business Automation solutions."
);
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_DEFAULT_MSG}`;

/**
 * Deterministic Indian Currency / Number Formatter
 */
function formatINR(val: number): string {
  const str = Math.round(val).toString();
  if (str.length <= 3) return str;
  const lastThree = str.substring(str.length - 3);
  const otherNumbers = str.substring(0, str.length - 3);
  const formattedOther = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  return `${formattedOther},${lastThree}`;
}

/** Static card shell — heavy 3D tilt + glare was causing scroll jank / “buffering”. */
function SpatialTiltCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <div className={`relative rounded-2xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

export default function PortalLandingPage() {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing Toggle (Fixed ASIC Packages, Academic Thesis & Research, or Business Automation)
  const [pricingCategory, setPricingCategory] = useState<"all" | "asic" | "academic" | "business">("asic");

  // Active Engineering Sandbox Tab
  const [activeTab, setActiveTab] = useState<"project" | "latex" | "patent" | "whatsapp">("project");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Lead Form State
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Advanced ASIC Package (SDC/UPF + Timing Closure + Defense — ₹21,999)",
    description: "",
  });

  const selectTierAndScroll = (categoryName: string) => {
    setFormState((prev) => ({ ...prev, category: categoryName }));
    const contactEl = document.getElementById("contact");
    if (contactEl) {
      contactEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getWhatsAppPackageLink = (packageName: string, price: string) => {
    const msg = encodeURIComponent(
      `Hi Ace-Seek, I would like to book the ${packageName} (${price}) for my project.`
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`;
  };
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/portal/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit quote request.");
      }
      setFormSubmitted(true);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed. Please message us on WhatsApp.");
      setFormSubmitted(true); // Still show WhatsApp fallback
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-emerald-500 selection:text-black relative overflow-x-hidden">
      {/* Light ambient backdrop — avoid huge fixed blurs (GPU thrash on scroll to #pricing) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(100%,720px)] h-[320px] bg-gradient-to-b from-cyan-500/10 to-transparent rounded-full" />
        <div className="absolute inset-0 spatial-grid-pattern opacity-25" />
      </div>

      {/* =========================================================================
          1. STICKY SPATIAL NAVIGATION HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-50 bg-zinc-950/95 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 p-[1px] shadow-lg shadow-cyan-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300">
                <div className="w-full h-full bg-zinc-950 rounded-[11px] flex items-center justify-center">
                  <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400/30 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-100 to-zinc-400">
                  Ace-Seek
                </span>
                <span className="px-2.5 py-0.5 text-xs font-bold tracking-wide uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a
              href="#academic-engineering"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Academic & Engineering
            </a>
            <a
              href="#business-automation"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Business Automation
            </a>
            <a
              href="#pricing"
              className="hover:text-cyan-400 transition-colors flex items-center gap-1"
            >
              Pricing Packages
            </a>
            <a
              href="#contact"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Contact
            </a>
          </nav>

          {/* Header Action CTA Button */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-cyan-500/30 text-xs font-semibold text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Full Pipeline Active</span>
            </div>
            <a
              href="#contact"
              className="relative group px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-bold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
            >
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 hover:text-white"
            aria-label="Toggle Navigation"
          >
            <div className="w-6 h-5 flex flex-col justify-between">
              <span
                className={`h-0.5 bg-current rounded-full transition-transform ${
                  mobileMenuOpen ? "rotate-45 translate-y-2" : ""
                }`}
              />
              <span
                className={`h-0.5 bg-current rounded-full transition-opacity ${
                  mobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`h-0.5 bg-current rounded-full transition-transform ${
                  mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""
                }`}
              />
            </div>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 pt-3 pb-6 bg-zinc-950/95 border-b border-white/10 backdrop-blur-2xl space-y-4">
            <div className="flex flex-col space-y-3 text-base font-medium text-zinc-300">
              <a
                href="#academic-engineering"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:text-cyan-400 hover:bg-zinc-900 rounded-lg"
              >
                Academic & Engineering Solutions
              </a>
              <a
                href="#business-automation"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg"
              >
                Local Business Automation
              </a>
              <a
                href="#pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:text-cyan-400 hover:bg-zinc-900 rounded-lg"
              >
                Bundled Pricing Packages
              </a>
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 hover:text-emerald-400 hover:bg-zinc-900 rounded-lg"
              >
                Contact Us
              </a>
            </div>
            <div className="pt-2">
              <a
                href="#contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-bold text-center block shadow-lg shadow-cyan-500/25"
              >
                Request a Quote
              </a>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION: DUAL-ENGINE ARCHITECTURE
          ========================================================================= */}
      <section className="relative z-10 pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/90 border border-cyan-500/40 text-cyan-400 text-xs sm:text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                <span>⚡ Dual-Engine Technical Platform</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Automate Your Business. <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                  Accelerate Your Research.
                </span>
              </h1>

              {/* Sub-headline */}
              <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl font-normal leading-relaxed">
                From automated WhatsApp billing dashboards for local businesses to complete engineering project execution and LaTeX documentation for researchers.
              </p>

              {/* Action CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <a
                  href="#pricing"
                  onClick={() => setPricingCategory("asic")}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-extrabold text-base shadow-xl shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Cpu className="w-5 h-5 text-zinc-950 group-hover:rotate-12 transition-transform" />
                  <span>Explore Fixed ASIC Tiers</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </a>

                <a
                  href="#business-automation"
                  className="w-full sm:w-auto px-7 py-4 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/50 text-white font-bold text-base transition-all flex items-center justify-center gap-2.5 shadow-lg group"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>View Business Automation</span>
                </a>
              </div>

              {/* Social Proof Strip */}
              <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-950/90 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md ring-2 ring-zinc-950">
                    <Cpu className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-purple-950/90 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-md ring-2 ring-zinc-950">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-950/90 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md ring-2 ring-zinc-950">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-amber-950/90 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-md ring-2 ring-zinc-950">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                    <span className="text-xs font-bold text-zinc-200 ml-1.5 font-mono">5.0 / 5.0</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium">
                    Trusted by <strong className="text-zinc-200">PhD Scholars, Tech Innovators & Local Businesses</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Hero Right Holographic Interactive Deck */}
            <div className="lg:col-span-5 relative perspective-1000">
              <SpatialTiltCard
                className="spatial-card p-6 border-cyan-500/30 bg-gradient-to-b from-zinc-900/90 to-zinc-950/95"
                glowColor="rgba(6, 182, 212, 0.35)"
              >
                {/* Holographic Header */}
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 text-xs font-mono text-zinc-400">
                      ace-seek.pipeline.terminal
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[11px] font-mono text-cyan-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Live Ready</span>
                  </div>
                </div>

                {/* Pipeline Dual-Feed Stream */}
                <div className="py-4 space-y-3 font-sans">
                  {/* Stream Card 1: Fixed ASIC & Engineering Package */}
                  <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-cyan-500/30 shadow-lg">
                    <div className="flex items-center justify-between text-xs text-cyan-400 mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" /> ASIC Signoff & Timing Closure
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">OpenROAD / Cadence</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-snug">
                      ✓ Push-Button RTL-to-GDS + DRC/LVS clean verified.<br />
                      ✓ Custom SDC + UPF low-power + MMMC STA closed (0 slack violations).<br />
                      ✓ Comprehensive Capstone Report + Viva Defense Deck prepared.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-zinc-400">Status: <strong className="text-cyan-300">Ready for Tapeout / Defense</strong></span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                        100% TIMING MET
                      </span>
                    </div>
                  </div>

                  {/* Stream Card 2: Business Automation */}
                  <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 shadow-lg">
                    <div className="flex items-center justify-between text-xs text-emerald-400 mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Business Bot
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Auto-Sync</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-snug">
                      "Hi Rahul! Your membership renews in 2 days. Tap to pay ₹2,499 via UPI to keep your streak! 🏋️"
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-zinc-400">Fee Recovery: <strong className="text-emerald-400">98.4% On-Time</strong></span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 font-black text-[10px]">
                        UPI ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Deck Footer */}
                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-zinc-400">Academic + Business Solutions</span>
                  <a
                    href="#pricing"
                    className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>View All Packages</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </SpatialTiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. SECTION 1: ACADEMIC & ENGINEERING SOLUTIONS (BENTO GRID 1)
          ========================================================================= */}
      <section id="academic-engineering" className="relative z-10 py-24 bg-zinc-950/60 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 uppercase tracking-widest">
              <Cpu className="w-3.5 h-3.5" />
              <span>Academic & Engineering Excellence</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Technical Execution, LaTeX Typesetting <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">
                & Patent Preparation
              </span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg">
              We bridge the gap between complex engineering implementation and prestigious academic/legal documentation.
            </p>
          </div>

          {/* Bento Grid 1: 4 Engineering Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Card 1: Push-Button RTL-to-GDS Execution */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-cyan-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 font-mono">
                  OpenROAD · Cadence · SkyWater 130nm
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Push-Button RTL-to-GDS Execution
                </h3>
                <p className="text-sm font-medium text-cyan-400">
                  Automated Synthesis, PnR & Physical Signoff
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Complete push-button ASIC implementation: logic synthesis, floorplanning, standard cell placement, clock tree synthesis (CTS), detailed routing, and final GDSII generation on SkyWater 130nm or your target PDK.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Signoff Deliverables</span>
                  <span className="text-cyan-400 font-bold">DRC / LVS Clean</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Run Scripts & Logs</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Clean GDSII Stream</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>

            {/* Card 2: Timing Closure & Low-Power UPF */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-emerald-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 font-mono">
                  SDC · UPF · MMMC STA
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Timing Closure & Low-Power Signoff
                </h3>
                <p className="text-sm font-medium text-emerald-400">
                  Zero Setup/Hold Slack & Low-Power Intent
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Custom SDC constraints for complex clock domains, multicycle and false paths. Complete UPF power gating, isolation rules, and multi-corner (PVT) signoff with zero timing violations.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Timing Verification</span>
                  <span className="text-emerald-400 font-bold">WNS / TNS = 0 ps</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Multi-Corner STA</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>UPF Power Checks</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>

            {/* Card 3: Patent & IDF Drafting */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-amber-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                  <Award className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 font-mono">
                  Patent Disclosure Ready
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Patent & IDF Drafting
                </h3>
                <p className="text-sm font-medium text-amber-400">
                  Invention Disclosure Form (IDF) Preparation
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Structuring your technical breakthroughs into formal Invention Disclosure Forms (IDFs) ready for legal filing and patent attorneys. Claims structuring, novelty breakdown, and embodiment diagrams.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Patent Deliverables</span>
                  <span className="text-amber-400 font-bold">Attorney Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Prior-Art Contrast</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Independent Claims</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>

            {/* Card 4: Technical Documentation & Viva Defense Coaching */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-purple-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-400 font-mono">
                  Report + Viva Deck + Defense Prep
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Documentation & Defense Coaching
                </h3>
                <p className="text-sm font-medium text-purple-400">
                  High-Impact Thesis & Oral Defense Readiness
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Professional IEEE / University format capstone reports with high-res architecture diagrams, verified Turnitin compliance, complete presentation decks, and 1-on-1 mock viva defense preparation.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Defense Deliverables</span>
                  <span className="text-purple-400 font-bold">100% Defense Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Viva Slide Deck</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Turnitin &lt; 5% Verified</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3.5 SECTION: VERIFIED SILICON PROOF (PRODUCTION RISC-V ON SKY130)
          ========================================================================= */}
      <section id="silicon-proof" className="relative z-10 py-20 bg-gradient-to-b from-zinc-950/80 via-zinc-900/60 to-zinc-950/80 border-t border-cyan-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border border-cyan-500/30 shadow-2xl shadow-cyan-950/20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="space-y-4 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Silicon Credibility Proof · Real Production Tapeout</span>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  lowRISC Ibex RV32IMC Core on SkyWater 130nm
                </h3>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  We don&apos;t just teach VLSI theory or sell consulting templates. We run full, tapeout-grade silicon implementations through our own cloud OpenROAD/OpenLane pipeline. Here is our verified physical signoff run of the production 32-bit RISC-V Ibex core down to GDSII.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <a
                    href="https://github.com/hemanthkumardm/ibex"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-sm transition-all shadow-lg shadow-cyan-500/20"
                  >
                    <Terminal className="w-4 h-4" />
                    <span>View GitHub Tapeout Repo</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href="https://github.com/hemanthkumardm/ibex/blob/main/docs/IBEX_TIMING_CLOSURE_REPORT.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm border border-white/10 transition-all"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Read Full STA Signoff Report</span>
                  </a>
                  <a
                    href="https://github.com/hemanthkumardm/ibex/blob/main/docs/WALKTHROUGH_VIDEO_SCRIPT.md"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white font-medium text-sm border border-white/5 transition-all"
                  >
                    <span>5-Min Video Walkthrough Script</span>
                  </a>
                </div>
              </div>

              {/* Verified Metrics Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto shrink-0">
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Clock Frequency</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">66.7 MHz</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">Tclk = 15.00 ns</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Core Area</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">128,125 μm²</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">42% Core Util</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Timing Slack (WNS)</span>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">0.00 ns</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">Setup & Hold Clean</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Magic DRC</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">0 Errors</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">Foundry Signoff</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Netgen LVS</span>
                  <span className="text-xl sm:text-2xl font-black text-cyan-400 mt-1">Matched</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">100% Net Equivalence</span>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/90 border border-white/10 flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase font-mono tracking-wider">Foundry PDK</span>
                  <span className="text-xl sm:text-2xl font-black text-white mt-1">SkyWater 130</span>
                  <span className="text-[11px] text-zinc-500 mt-0.5">sky130_fd_sc_hd</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. SECTION 2: LOCAL BUSINESS AUTOMATION (BENTO GRID 2)
          ========================================================================= */}
      <section id="business-automation" className="relative z-10 py-24 bg-zinc-950/80 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              <span>Local Business Automation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Hands-Free WhatsApp Automation for <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                Brick-and-Mortar Businesses
              </span>
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg">
              No complex app installs. We deploy automated WhatsApp billing reminders, instant booking engines, and status trackers in 48 hours.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {/* Business Card 1: Gyms & Fitness */}
            <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 hover:border-emerald-500/50">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-6">
                <Dumbbell className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Gyms & Fitness Studios
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Automated WhatsApp fee reminders sent 2 days before membership expiry with 1-click UPI links and branded member portals. Zero manual calls.
              </p>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Fee Recovery</span>
                <span className="text-emerald-400 font-bold">98% On-Time</span>
              </div>
            </SpatialTiltCard>

            {/* Business Card 2: Tech & Device Repair */}
            <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 hover:border-amber-500/50">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Tech & Device Repair
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Live device status tracking and digital intake forms. Customers get automatic WhatsApp pings when hardware is tested and ready for pickup.
              </p>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Customer Inquiries</span>
                <span className="text-amber-400 font-bold">Zero Status Calls</span>
              </div>
            </SpatialTiltCard>

            {/* Business Card 3: Salons & Clinics */}
            <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 hover:border-cyan-500/50">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-6">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Salons & Specialty Clinics
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed mb-4">
                Smart slot booking, pre-visit reminder shields (-70% no-shows), live digital token queue issuance, and paperless prescription delivery.
              </p>
              <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Appointment No-Shows</span>
                <span className="text-cyan-400 font-bold">Reduced by 70%</span>
              </div>
            </SpatialTiltCard>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. PRICING & BUNDLED PACKAGES (THE CORE OFFER)
          ========================================================================= */}
      <section id="pricing" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 uppercase tracking-widest">
              <span>Transparent & Bundled</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Package Tiers for Researchers & Businesses
            </h2>
            <p className="text-zinc-400 text-base sm:text-lg">
              Choose the package that accelerates your engineering thesis, secures your patent, or automates your business revenue.
            </p>

            {/* Category Toggle Tabs */}
            <div className="pt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPricingCategory("asic")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "asic"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md ring-1 ring-cyan-500/30"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                }`}
              >
                ⚡ ASIC & VLSI Packages
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "all"
                    ? "bg-zinc-800 text-white border border-white/20 shadow-md"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                }`}
              >
                All Packages
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory("academic")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "academic"
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-md ring-1 ring-purple-500/30"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                }`}
              >
                Thesis & LaTeX
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory("business")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "business"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30"
                    : "text-zinc-400 hover:text-zinc-200 bg-zinc-900/50"
                }`}
              >
                Business Automation
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
            {/* FIXED ASIC TIER 1: Basic ASIC Package */}
            {(pricingCategory === "all" || pricingCategory === "asic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Basic ASIC Package
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30 font-mono">
                      Course & Capstone
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400 font-semibold mt-1">
                    RTL-to-GDS Walkthrough & Technical Report
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Push-button RTL synthesis, floorplanning, placement, CTS, routing, and DRC/LVS reports with a complete academic capstone report.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹12,499
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">fixed package</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Push-button RTL-to-GDS execution (SkyWater 130nm / Nangate 45nm)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>DRC & LVS clean verification logs + layout GDSII export</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Area, power, and worst negative slack (WNS) summary reports</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>IEEE-standard Capstone Project Report (figures, tables & diagrams)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>1-on-1 45-min live technical walkthrough session explaining the flow</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      selectTierAndScroll("Basic ASIC Package (RTL-to-GDS + Report — ₹12,499)")
                    }
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 hover:border-cyan-500/40 transition-all shadow-md"
                  >
                    Book Basic ASIC (₹12,499) →
                  </button>
                  <a
                    href={getWhatsAppPackageLink("Basic ASIC Package", "₹12,499")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct Order</span>
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* FIXED ASIC TIER 2: Advanced ASIC Package (Most Popular / Highlighted) */}
            {(pricingCategory === "all" || pricingCategory === "asic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-cyan-500/60 shadow-2xl relative flex flex-col justify-between ring-2 ring-cyan-500/40">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      ★ Most Popular · High Pass Rate
                    </span>
                    <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 font-mono">
                      Full Closure
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    Advanced ASIC Package
                  </h3>
                  <p className="text-xs text-cyan-300 font-semibold mt-1.5">
                    Custom SDC/UPF + Timing Closure + Defense Prep
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Full design closure with custom timing constraints, low-power UPF intent, multi-corner STA signoff, and comprehensive viva defense prep.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹21,999
                      </span>
                      <span className="text-xs text-cyan-400 font-semibold">fixed package</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-200">
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Custom SDC Constraints:</strong> Clocks, IO budgets, multicycle & false paths</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>UPF Low-Power Intent:</strong> Power switches, isolation cells & level-shifters</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Timing Closure:</strong> Multi-Corner STA signoff with zero setup & hold violations</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>CTS skew tuning, congestion resolution & power grid IR-drop report</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Defense Ready:</strong> Custom viva slide deck + mock oral defense coaching</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      selectTierAndScroll("Advanced ASIC Package (SDC/UPF + Timing Closure + Defense — ₹21,999)")
                    }
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-extrabold text-center block text-sm shadow-lg shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
                  >
                    Book Advanced ASIC (₹21,999) →
                  </button>
                  <a
                    href={getWhatsAppPackageLink("Advanced ASIC Package", "₹21,999")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct Order</span>
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* FLAGSHIP TIER 3: The Complete Inventor Package */}
            {(pricingCategory === "all" || pricingCategory === "asic" || pricingCategory === "academic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Complete Inventor Package
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 text-xs font-bold border border-purple-500/40 font-mono">
                      Silicon + Paper + Patent
                    </span>
                  </div>
                  <p className="text-xs text-purple-400 font-semibold mt-1">
                    Turnkey ASIC Tapeout + IEEE Paper + Patent IDF
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Complete project engineering from simulation to camera-ready Q1/IEEE paper and patent IDF legal filing documentation.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹39,999
                      </span>
                      <span className="text-xs text-cyan-400 font-semibold">milestone-based</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-200">
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Full Custom RTL & Testbench:</strong> Microarchitecture & UVM/Verilog simulation</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Physical Design Signoff:</strong> DRC/LVS clean GDSII + multi-corner timing closure</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>IEEE / SCI Research Paper:</strong> Camera-ready format (Turnitin &lt; 5% verified)</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Patent IDF Preparation:</strong> Formal Invention Disclosure Form for patent attorneys</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>1-on-1 technical walkthrough session & unlimited defense prep</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      selectTierAndScroll("The Complete Inventor Package (ASIC + Paper + Patent — ₹39,999)")
                    }
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 hover:border-cyan-500/40 transition-all shadow-md"
                  >
                    Deploy Complete Inventor Plan →
                  </button>
                  <a
                    href={getWhatsAppPackageLink("Complete Inventor Package", "₹39,999")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct Order</span>
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* ACADEMIC TIER: Thesis & Documentation Bundle */}
            {(pricingCategory === "all" || pricingCategory === "academic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Thesis & Documentation Bundle
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-300 text-xs font-semibold border border-purple-500/30 font-mono">
                      Thesis & Paper
                    </span>
                  </div>
                  <p className="text-xs text-purple-400 font-semibold mt-1">
                    Perfect for: PhD Scholars & Master's Students
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    End-to-end academic formatting, chapter restructuring, TikZ diagrams, and Turnitin similarity compliance.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹14,999
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">starting</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Technical content structuring & academic proofing</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Flawless LaTeX typesetting (IEEE / University standard)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Custom high-res architecture flowcharts & TikZ plots</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>Plagiarism & Turnitin compliance check (&lt; 10% similarity)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                      <span>BibTeX reference styling & zero compiler errors</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      selectTierAndScroll("Thesis & Professional LaTeX Typesetting (₹14,999)")
                    }
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 transition-all"
                  >
                    Request Thesis Quote →
                  </button>
                  <a
                    href={getWhatsAppPackageLink("Thesis & LaTeX Bundle", "₹14,999")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct Inquiry</span>
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* BUSINESS TIER: Business Automation Setup */}
            {(pricingCategory === "all" || pricingCategory === "business") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Business Automation Setup
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30 font-mono">
                      Local Business
                    </span>
                  </div>
                  <p className="text-xs text-emerald-400 font-semibold mt-1">
                    Perfect for: Local Shops, Gyms & Clinics
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Branded customer portal + automated WhatsApp billing, reminders, and Google Sheets sync.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        ₹9,999
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">setup</span>
                      <span className="text-zinc-500 text-sm font-bold">+</span>
                      <span className="text-lg font-bold text-emerald-400">₹999</span>
                      <span className="text-xs text-zinc-400">/mo</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Single-page branded customer portal</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>WhatsApp automation pipeline (fee alerts & slot booking)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Custom billing, digital intake & live status tracking</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Google Sheets two-way dashboard integration</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>48-Hour deployment guarantee</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8 space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      selectTierAndScroll("Local Business Automation (WhatsApp & Portal — ₹9,999)")
                    }
                    className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 transition-all"
                  >
                    Deploy Business Portal →
                  </button>
                  <a
                    href={getWhatsAppPackageLink("Business Automation Setup", "₹9,999")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Direct Inquiry</span>
                  </a>
                </div>
              </SpatialTiltCard>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. LEAD CAPTURE / CONTACT SECTION (HIGH CONVERTING FORM)
          ========================================================================= */}
      <section id="contact" className="relative z-10 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="spatial-card p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 border-white/10 shadow-2xl relative">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Pitch */}
              <div className="lg:col-span-5 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400">
                  <Zap className="w-3.5 h-3.5" /> Direct Technical Consultation
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  Request a Quote for Your Project or Business
                </h2>
                <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
                  Tell us about your engineering requirements, research paper scope, or business workflow. Our technical team will respond within 2 hours with an execution blueprint.
                </p>

                <div className="space-y-4 pt-4">
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Free Technical Scoping & Feasibility Audit</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Non-Disclosure & Confidentiality Guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-zinc-300">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                    <span>Direct WhatsApp & Video Consultation</span>
                  </div>
                </div>

                {/* Direct WhatsApp Instant Connect */}
                <div className="pt-4">
                  <a
                    href={WHATSAPP_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold text-sm transition-all group"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <span>Quick-Connect on WhatsApp</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </div>
              </div>

              {/* Right Form Card */}
              <div className="lg:col-span-7 bg-zinc-950 p-6 sm:p-8 rounded-2xl border border-white/10">
                {formSubmitted ? (
                  <div className="text-center py-12 space-y-4 animate-fade-in">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400">
                      <CheckCheck className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold text-white">Quote Request Received!</h3>
                    <p className="text-zinc-300 text-sm max-w-md mx-auto">
                      Thank you, <strong>{formState.name}</strong>. Our engineering leads will review your project scope and email or WhatsApp you at <strong>{formState.email || formState.phone}</strong> within 2 hours.
                    </p>
                    <div className="pt-4">
                      <a
                        href={`https://wa.me/918431670673?text=${encodeURIComponent(
                          `Hi Ace-Seek, I just requested a quote for ${formState.category} (${formState.name}). My email: ${formState.email}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-zinc-950 font-bold text-xs inline-flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-transform"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat With Us Directly on WhatsApp (+91 84316 70673)</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleFormSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          Your Name *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Dr. Aryan Verma / Rahul"
                          value={formState.name}
                          onChange={(e) =>
                            setFormState({ ...formState, name: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Email */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. scholar@university.edu"
                          value={formState.email}
                          onChange={(e) =>
                            setFormState({ ...formState, email: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Category Dropdown */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          Project Category *
                        </label>
                        <select
                          value={formState.category}
                          onChange={(e) =>
                            setFormState({ ...formState, category: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                        >
                          <option value="Basic ASIC Package (RTL-to-GDS + Report — ₹12,499)">
                            Basic ASIC Package (RTL-to-GDS + Report — ₹12,499)
                          </option>
                          <option value="Advanced ASIC Package (SDC/UPF + Timing Closure + Defense — ₹21,999)">
                            Advanced ASIC Package (SDC/UPF + Timing Closure + Defense — ₹21,999)
                          </option>
                          <option value="The Complete Inventor Package (ASIC + Paper + Patent — ₹39,999)">
                            The Complete Inventor Package (ASIC + Paper + Patent — ₹39,999)
                          </option>
                          <option value="Thesis & Professional LaTeX Typesetting (₹14,999)">
                            Thesis & LaTeX Typesetting (₹14,999)
                          </option>
                          <option value="Local Business Automation (WhatsApp & Portal — ₹9,999)">
                            Local Business Automation (WhatsApp & Portal — ₹9,999)
                          </option>
                          <option value="Other Custom Requirement">
                            Other Custom Requirement
                          </option>
                        </select>
                      </div>

                      {/* Phone / WhatsApp */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-zinc-300">
                          WhatsApp Phone Number
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. +91 98765 43210"
                          value={formState.phone}
                          onChange={(e) =>
                            setFormState({ ...formState, phone: e.target.value })
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-cyan-500 focus:outline-none transition-colors"
                        />
                      </div>
                    </div>

                    {/* Project Description */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-zinc-300">
                        Project Description & Requirements *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Briefly describe your project topic, technical domain, target journal/deadline, or business workflow..."
                        value={formState.description}
                        onChange={(e) =>
                          setFormState({ ...formState, description: e.target.value })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 text-sm focus:border-cyan-500 focus:outline-none transition-colors resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-extrabold text-sm shadow-lg shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <span>Submitting Request...</span>
                      ) : (
                        <>
                          <span>Submit Request for Custom Quote</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-zinc-500 text-center">
                      🔒 Non-Disclosure (NDA) compliant. Your research and business data remain 100% confidential.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          7. FAQ ACCORDION SECTION
          ========================================================================= */}
      <section className="relative z-10 py-16 bg-zinc-950/60 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Frequently Asked Questions
            </h2>
            <p className="text-zinc-400 text-sm">
              Answers regarding our engineering implementation, LaTeX pipeline, and business automation.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "What is the difference between the Basic and Advanced ASIC packages?",
                a: "The Basic ASIC package (₹12,499) provides push-button RTL-to-GDS flow scripts, DRC/LVS clean logs, and a complete capstone project report. The Advanced ASIC package (₹21,999) includes custom SDC timing constraints, UPF low-power intent, multi-corner (MMMC) STA timing closure with zero setup/hold slack, a PowerPoint defense presentation deck, and 1-on-1 mock viva defense preparation.",
              },
              {
                q: "What does 'The Complete Inventor Package' include?",
                a: "It is our all-in-one flagship package: we develop the complete working engineering implementation/simulation, write the comprehensive research paper formatted for IEEE/SCI standards, and draft a formal Invention Disclosure Form (IDF) ready for patent legal filing.",
              },
              {
                q: "Can you guarantee plagiarism and Turnitin compliance for thesis writing?",
                a: "Yes. All technical writing, literature synthesis, and methodology documentation are written from scratch with strict academic integrity. We provide verified Turnitin reports showing less than 10% similarity.",
              },
              {
                q: "How fast can you deploy the Local Business Automation workflow?",
                a: "For Gyms, Salons, and Repair Shops, we deploy your custom branded portal and connected WhatsApp automated notification pipeline in 48 hours.",
              },
              {
                q: "How is my project IP and research data protected?",
                a: "We operate under strict Non-Disclosure Agreements (NDAs). All proprietary codebases, patent claims, and academic findings remain 100% your intellectual property.",
              },
            ].map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-xl bg-zinc-900/80 border border-white/10 overflow-hidden transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between font-semibold text-white text-sm sm:text-base hover:text-cyan-400 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform ${
                        isOpen ? "rotate-180 text-cyan-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-sm text-zinc-300 leading-relaxed border-t border-white/5 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. MINIMALIST FOOTER
          ========================================================================= */}
      <footer className="relative z-10 py-12 bg-zinc-950 border-t border-white/10 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">Ace-Seek Portal</span>
                <span className="text-zinc-500 block font-mono text-[11px]">
                  portal.ace-seek.com
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-zinc-400">
              <a href="#academic-engineering" className="hover:text-cyan-400 transition-colors">
                Academic & Engineering
              </a>
              <a href="#business-automation" className="hover:text-emerald-400 transition-colors">
                Business Automation
              </a>
              <a href="#pricing" className="hover:text-cyan-400 transition-colors">
                Project packages
              </a>
              <a
                href="https://vlsi.ace-seek.com/vlsi/learn"
                className="hover:text-amber-300 transition-colors"
                title="Self-serve VLSI curriculum (separate from portal project packages)"
              >
                VLSI Learn Hub
              </a>
              <a
                href="https://vlsi.ace-seek.com/vlsi/interview-masterclass"
                className="hover:text-amber-300 transition-colors"
                title="Standalone Interview Prep Masterclass"
              >
                Interview Masterclass
              </a>
              <a href="#contact" className="hover:text-cyan-400 transition-colors">
                Request a Quote
              </a>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Direct</span>
              </a>
            </div>

            <div className="text-center md:text-right text-zinc-500">
              © 2026 Ace-Seek Portal. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
