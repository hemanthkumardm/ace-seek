"use client";

import React, { useState, useEffect, useRef } from "react";
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

// Spatial 3D Tilt Card Container
function SpatialTiltCard({
  children,
  className = "",
  glowColor = "rgba(16, 185, 129, 0.25)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 7;
    const rotY = ((x - centerX) / centerX) * 7;

    setRotateX(rotX);
    setRotateY(rotY);
    setGlarePos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setGlarePos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 0.15s ease-out",
      }}
      className={`relative rounded-2xl overflow-hidden transition-shadow duration-300 ${className}`}
    >
      {/* Specular Glare Reflection */}
      <div
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glowColor} 0%, transparent 65%)`,
          opacity: glarePos.opacity,
        }}
      />
      {children}
    </div>
  );
}

export default function PortalLandingPage() {
  // Mobile drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Pricing Toggle (Engineering & Research vs Business Automation)
  const [pricingCategory, setPricingCategory] = useState<"all" | "academic" | "business">("all");

  // Active Engineering Sandbox Tab
  const [activeTab, setActiveTab] = useState<"project" | "latex" | "patent" | "whatsapp">("project");

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Lead Form State
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    phone: "",
    category: "The Complete Inventor Package (Project + Paper + Patent)",
    description: "",
  });
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
      {/* Ambient Spatial Background Grid & Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-cyan-500/15 via-emerald-500/10 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 blur-[160px] rounded-full" />
        <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/10 blur-[160px] rounded-full" />
        <div className="absolute inset-0 spatial-grid-pattern opacity-40" />
      </div>

      {/* =========================================================================
          1. STICKY SPATIAL NAVIGATION HEADER
          ========================================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-zinc-950/80 border-b border-white/10 transition-all">
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
                  className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-extrabold text-base shadow-xl shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2.5 group"
                >
                  <Cpu className="w-5 h-5 text-zinc-950 group-hover:rotate-12 transition-transform" />
                  <span>Explore Engineering Packages</span>
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
                  {/* Stream Card 1: Academic / Engineering */}
                  <div className="p-3.5 rounded-xl bg-zinc-800/80 border border-cyan-500/30 shadow-lg">
                    <div className="flex items-center justify-between text-xs text-cyan-400 mb-1.5">
                      <span className="font-semibold flex items-center gap-1.5">
                        <FileCode2 className="w-3.5 h-3.5" /> IEEE Research & Patent Package
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">LaTeX Engine</span>
                    </div>
                    <p className="text-xs text-zinc-200 leading-snug">
                      ✓ Full Hardware/Software Simulation built.<br />
                      ✓ Camera-ready LaTeX document + Turnitin &lt; 5% verified.<br />
                      ✓ Ready-to-file Patent IDF drafted.
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-white/5 text-[11px]">
                      <span className="text-zinc-400">Status: <strong className="text-cyan-300">Ready for Defense / Filing</strong></span>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                        100% PASS
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
            {/* Card 1: End-to-End Project Execution */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-cyan-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
                  <Cpu className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-400 font-mono">
                  Hardware · Software · VLSI
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  End-to-End Project Execution
                </h3>
                <p className="text-sm font-medium text-cyan-400">
                  Turnkey Technical Implementation
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Complete technical implementation for hardware, software, electronic design, embedded systems, and simulation workflows. We build working prototypes and reproducible codebases.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Stack Deliverables</span>
                  <span className="text-cyan-400 font-bold">Tested & Validated</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Working Architecture</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Benchmark Data Logs</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>

            {/* Card 2: Professional LaTeX Typesetting */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-emerald-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <FileCode2 className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-400 font-mono">
                  IEEE · Springer · Elsevier
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Professional LaTeX Typesetting
                </h3>
                <p className="text-sm font-medium text-emerald-400">
                  Pixel-Perfect Mathematical & Academic Layouts
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Flawless formatting for thesis documents, research papers, and IEEE-standard journals. Clean TikZ diagrams, vector math formulas, and BibTeX citations without compiler errors.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Typesetting Standards</span>
                  <span className="text-emerald-400 font-bold">100% Error-Free</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Thesis Book Layout</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>TikZ Flowcharts</span>
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

            {/* Card 4: Technical & Research Writing */}
            <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-br from-zinc-900/95 via-zinc-900/80 to-zinc-950 border-white/10 hover:border-purple-500/50">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-bold text-purple-400 font-mono">
                  Turnitin & Plagiarism Safe
                </span>
              </div>

              <div className="mt-6 space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  Technical & Research Writing
                </h3>
                <p className="text-sm font-medium text-purple-400">
                  High-Impact Academic Rigor
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                  Clear, highly accurate technical documentation and research structuring. We provide comprehensive literature reviews, rigorous methodology chapters, and results synthesis.
                </p>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-zinc-950/80 border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                  <span>Publication Standards</span>
                  <span className="text-purple-400 font-bold">Peer-Review Ready</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-zinc-300">
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Original Synthesis</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-white/5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>Plagiarism Report</span>
                  </div>
                </div>
              </div>
            </SpatialTiltCard>
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
            <div className="pt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPricingCategory("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "all"
                    ? "bg-zinc-800 text-white border border-white/20 shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All Packages
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory("academic")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "academic"
                    ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Academic & Engineering
              </button>
              <button
                type="button"
                onClick={() => setPricingCategory("business")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  pricingCategory === "business"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-md"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Business Automation
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Plan 1: The Thesis & Documentation Bundle */}
            {(pricingCategory === "all" || pricingCategory === "academic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Thesis & Documentation Bundle
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-cyan-500/10 text-cyan-300 text-xs font-semibold border border-cyan-500/30">
                      Academic
                    </span>
                  </div>
                  <p className="text-xs text-cyan-400 font-semibold mt-1">
                    Perfect for: PhD Scholars & Master's Students
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    End-to-end academic formatting, chapter restructuring, and Turnitin similarity compliance.
                  </p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white">
                        Custom / ₹14,999
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">starting</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-white/10 text-sm text-zinc-300">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Technical content structuring & academic proofing</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Flawless LaTeX typesetting (IEEE / University standard)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Custom high-res architecture flowcharts & TikZ plots</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Plagiarism & Turnitin compliance check (&lt; 10% similarity)</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>BibTeX reference styling & zero compiler errors</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <a
                    href="#contact"
                    className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 transition-all"
                  >
                    Request Thesis Quote →
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* Plan 2: The Complete Inventor Package (Best Value / Highlighted) */}
            {(pricingCategory === "all" || pricingCategory === "academic") && (
              <SpatialTiltCard className="spatial-card p-8 bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-900 border-cyan-500/60 shadow-2xl relative flex flex-col justify-between ring-2 ring-cyan-500/40">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400" />

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-zinc-950 font-black text-xs uppercase tracking-wider shadow-md">
                      <Sparkles className="w-3.5 h-3.5 fill-current" />
                      ★ Best Value · Turnkey
                    </span>
                    <span className="px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/40 font-mono">
                      Full Pipeline
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    The Complete Inventor Package
                  </h3>
                  <p className="text-xs text-cyan-300 font-semibold mt-1.5">
                    Perfect for: Tech Startups, Innovators & Researchers
                  </p>
                  <p className="text-xs text-zinc-400 mt-2">
                    Complete project engineering from simulation to Q1/IEEE paper and patent filing documentation.
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
                      <span><strong>Full Project Implementation:</strong> Hardware, software, or VLSI workflow</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Comprehensive Research Paper:</strong> Ready for IEEE/SCI submission</span>
                    </div>
                    <div className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span><strong>Patent IDF Preparation:</strong> Formal Invention Disclosure Form ready for legal filing</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>Source code repository, simulation testbenches & readme</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <span>1-on-1 technical walkthrough session & defense prep</span>
                    </div>
                  </div>
                </div>

                <div className="pt-8">
                  <a
                    href="#contact"
                    className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-400 text-zinc-950 font-extrabold text-center block text-sm shadow-lg shadow-cyan-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transition-all"
                  >
                    Deploy Complete Inventor Plan →
                  </a>
                </div>
              </SpatialTiltCard>
            )}

            {/* Plan 3: Business Automation Setup */}
            {(pricingCategory === "all" || pricingCategory === "business") && (
              <SpatialTiltCard className="spatial-card p-8 bg-zinc-900/90 border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      Business Automation Setup
                    </h3>
                    <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
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

                <div className="pt-8">
                  <a
                    href="#contact"
                    className="w-full py-3.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-center block text-sm border border-white/10 transition-all"
                  >
                    Deploy Business Portal →
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
                          <option value="The Complete Inventor Package (Project + Paper + Patent)">
                            The Complete Inventor Package (Project + Paper + Patent)
                          </option>
                          <option value="Engineering Project Execution">
                            Engineering Project Execution (Hardware/Software)
                          </option>
                          <option value="Patent & IDF Drafting">
                            Patent & IDF Drafting
                          </option>
                          <option value="Thesis & Professional LaTeX Typesetting">
                            Thesis & LaTeX Typesetting
                          </option>
                          <option value="Business Automation (WhatsApp & Portal)">
                            Business Automation (WhatsApp & Portal)
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
                Pricing Plans
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
