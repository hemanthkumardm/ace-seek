"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CreditCard,
  Globe2,
  Layers,
  MessageCircle,
  MonitorSmartphone,
  Scissors,
  ShoppingBag,
  Sparkles,
  GraduationCap,
  Shield,
  Server,
  Zap,
  Activity,
  Package,
  X,
  ExternalLink,
  MapPin,
} from "lucide-react";

const WHATSAPP_NUMBER = "918431670673";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Hi Ace-Seek — I want a demo for Website / Billing / Automation for my business."
)}`;

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

/** Subtle 3D tilt for spatial cards */
function SpatialCard({
  children,
  className = "",
  depth = 8,
}: {
  children: React.ReactNode;
  className?: string;
  depth?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        setT({ x: py * -depth, y: px * depth });
      }}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      style={{
        transform: `perspective(1200px) rotateX(${t.x}deg) rotateY(${t.y}deg)`,
        transformStyle: "preserve-3d",
        transition: "transform 120ms ease-out",
      }}
      className={`relative rounded-2xl border border-white/10 bg-zinc-950/80 backdrop-blur-xl shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </div>
  );
}

/** Spatial stack — fixed layered cards (no explode) */
function SpatialLayerStack({
  layers,
}: {
  layers: { title: string; subtitle: string; accent: string }[];
}) {
  return (
    <div className="relative mx-auto w-full max-w-md space-y-3" style={{ perspective: 1200 }}>
      {layers.map((layer, i) => (
        <SpatialCard
          key={layer.title}
          depth={6}
          className="p-5"
        >
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl opacity-40"
            style={{
              background: `linear-gradient(135deg, ${layer.accent}33, transparent 55%)`,
            }}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                Step {i + 1}
              </p>
              <h3 className="mt-1 text-lg font-semibold text-white">{layer.title}</h3>
              <p className="mt-1 text-sm text-zinc-400">{layer.subtitle}</p>
            </div>
            <span
              className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: layer.accent, boxShadow: `0 0 12px ${layer.accent}` }}
            />
          </div>
        </SpatialCard>
      ))}
    </div>
  );
}

type DemoId = "retail" | "salon" | "projects";

const DEMOS: Record<
  DemoId,
  {
    title: string;
    blurb: string;
    icon: React.ReactNode;
    metrics: { label: string; value: string }[];
    panels: { title: string; body: string; pct?: number }[];
  }
> = {
  retail: {
    title: "Retail store",
    blurb: "Catalogue, orders, and UPI collection in one storefront.",
    icon: <ShoppingBag className="w-4 h-4" />,
    metrics: [
      { label: "Today’s orders", value: "47" },
      { label: "Collected", value: "₹62,400" },
      { label: "Pending UPI", value: "3" },
    ],
    panels: [
      { title: "Storefront", body: "Product grid · WhatsApp share · COD/UPI", pct: 100 },
      { title: "Billing desk", body: "Invoices · Razorpay/UPI links · receipts", pct: 100 },
      { title: "Stock pulse", body: "Low-stock alerts to owner WhatsApp", pct: 78 },
    ],
  },
  salon: {
    title: "Salon / spa",
    blurb: "Bookings, reminders, and pay-before-visit to cut no-shows.",
    icon: <Scissors className="w-4 h-4" />,
    metrics: [
      { label: "Slots today", value: "18" },
      { label: "Confirmed", value: "16" },
      { label: "No-show risk", value: "↓ 62%" },
    ],
    panels: [
      { title: "Booking page", body: "Services · stylist · time slots", pct: 100 },
      { title: "Reminders", body: "WhatsApp T-24h / T-2h with pay link", pct: 100 },
      { title: "Front desk", body: "Walk-ins · tokens · package balance", pct: 86 },
    ],
  },
  projects: {
    title: "Project lab (colleges)",
    blurb: "Real-time completion tracking for student project pipelines.",
    icon: <GraduationCap className="w-4 h-4" />,
    metrics: [
      { label: "Active batches", value: "12" },
      { label: "Avg. complete", value: "64%" },
      { label: "Due this week", value: "5" },
    ],
    panels: [
      { title: "Batch board", body: "Students · mentors · milestones", pct: 100 },
      {
        title: "Live progress",
        body: "Spec → Design → Build → Demo → Report",
        pct: 64,
      },
      {
        title: "Client view",
        body: "Parents/colleges see % done — not raw files",
        pct: 100,
      },
    ],
  },
};

const PACKAGES = [
  {
    id: "website",
    name: "Website",
    price: 9999,
    tag: "Launch",
    accent: "#22d3ee",
    desc: "A polished business site ready to show customers — mobile-first, fast, and editable.",
    includes: [
      "Up to 5 pages (Home, About, Services, Gallery, Contact)",
      "Mobile + desktop layout",
      "Contact form / WhatsApp button",
      "Basic SEO setup",
      "1 revision round after first preview",
    ],
    excludes: ["Domain name", "Ongoing content writing", "Payment collection"],
  },
  {
    id: "billing",
    name: "Website + Billing",
    price: 19999,
    tag: "Most booked",
    accent: "#34d399",
    featured: true,
    desc: "Your site plus online payments — invoices, UPI/Razorpay links, and paid confirmations.",
    includes: [
      "Everything in Website",
      "Checkout / pay links (UPI · cards · wallets)",
      "Order or booking receipts",
      "Owner payment dashboard",
      "Failed-payment retry reminders",
    ],
    excludes: ["Domain name", "Payment gateway KYC (you complete with Razorpay)", "Transaction fees by gateway"],
  },
  {
    id: "automation",
    name: "Automation add-ons",
    price: null,
    tag: "Quoted",
    accent: "#a78bfa",
    desc: "Layer WhatsApp bots, bookings, inventory, or live project monitoring on top of your site.",
    includes: [
      "WhatsApp appointment / fee reminders",
      "Salon or clinic slot booking",
      "Retail catalogue + order tracking",
      "Student project completion monitor",
      "Custom workflow (scoped after call)",
    ],
    excludes: ["Domain name", "Meta WhatsApp Business API fees (if used)", "3rd-party SMS costs"],
  },
] as const;

export default function PortalLandingPage() {
  const [demo, setDemo] = useState<DemoId>("retail");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    category: "Website + Billing",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [tick, setTick] = useState(64);

  // Gentle live pulse for project monitor demo
  useEffect(() => {
    if (demo !== "projects") return;
    const id = setInterval(() => {
      setTick((t) => (t >= 92 ? 58 : t + 1));
    }, 1200);
    return () => clearInterval(id);
  }, [demo]);

  const active = DEMOS[demo];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const res = await fetch("/api/portal/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Could not send request");
      }
      setDone(true);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Send failed");
      setDone(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07070a] text-zinc-100 antialiased selection:bg-emerald-400/30">
      {/* Ambient field */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 spatial-grid-pattern opacity-30" />
        <div className="absolute -top-32 left-1/2 h-[480px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-[45%] right-[-10%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[100px]" />
      </div>

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07070a]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/portal" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-emerald-500 text-zinc-950 shadow-lg shadow-cyan-500/20">
              <Zap className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight">
              Ace-Seek <span className="text-cyan-400">Portal</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-400 md:flex">
            <a href="#packages" className="hover:text-white">
              Packages
            </a>
            <a href="#customers" className="hover:text-white">
              Customers
            </a>
            <a href="#demos" className="hover:text-white">
              Live demos
            </a>
            <a href="#care" className="hover:text-white">
              Care plan
            </a>
            <a href="#quote" className="hover:text-white">
              Get quote
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="hidden rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 sm:inline-flex items-center gap-1.5"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <button
              type="button"
              className="rounded-lg border border-white/10 p-2 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Menu"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Layers className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="border-t border-white/10 px-4 py-3 md:hidden space-y-2 text-sm">
            {[
              ["#packages", "Packages"],
              ["#customers", "Customers"],
              ["#demos", "Live demos"],
              ["#care", "Care plan"],
              ["#quote", "Get quote"],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="block rounded-lg px-3 py-2 text-zinc-300 hover:bg-white/5"
                onClick={() => setMobileOpen(false)}
              >
                {label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
        <div className="space-y-6">
          <p className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Built for shops · salons · project labs
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] leading-[1.1]">
            Websites, billing &amp; automation —
            <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              {" "}
              packaged clearly
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-zinc-400 sm:text-lg">
            Pick a clean package. Domain is separate. Ongoing care is a flat monthly plan
            for hosting data, small website changes, and server issues — so you can sell
            today without confusing add-on lists.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#packages"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-bold hover:bg-cyan-300"
              style={{ color: "#061018" }}
            >
              See packages <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#demos"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-500 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-400 hover:bg-zinc-800"
            >
              Watch demos
            </a>
          </div>
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-emerald-400" /> Domain not included
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Server className="h-3.5 w-3.5 text-cyan-400" /> Care from {formatINR(1500)}/mo
            </span>
          </div>
        </div>

        <SpatialLayerStack
          layers={[
            {
              title: "Website",
              subtitle: "Your public face online",
              accent: "#22d3ee",
            },
            {
              title: "Billing",
              subtitle: "UPI · cards · receipts",
              accent: "#34d399",
            },
            {
              title: "Automation",
              subtitle: "WhatsApp · booking · live progress",
              accent: "#a78bfa",
            },
            {
              title: "Care plan",
              subtitle: "Storage · fixes · small site changes",
              accent: "#fbbf24",
            },
          ]}
        />
      </section>

      {/* Packages */}
      <section id="packages" className="relative z-10 border-t border-white/5 bg-zinc-950/40 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Clear packaging
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Three offers. One care plan.
            </h2>
            <p className="mt-3 text-zinc-400">
              Prices below are one-time build fees. Domain purchase is always separate.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {PACKAGES.map((pkg) => (
              <SpatialCard
                key={pkg.id}
                className={`flex flex-col p-6 ${
                  "featured" in pkg && pkg.featured
                    ? "border-emerald-400/40 ring-1 ring-emerald-400/20"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{
                      color: pkg.accent,
                      background: `${pkg.accent}18`,
                      border: `1px solid ${pkg.accent}44`,
                    }}
                  >
                    {pkg.tag}
                  </span>
                  {pkg.id === "website" && <Globe2 className="h-5 w-5 text-cyan-400" />}
                  {pkg.id === "billing" && <CreditCard className="h-5 w-5 text-emerald-400" />}
                  {pkg.id === "automation" && (
                    <MonitorSmartphone className="h-5 w-5 text-violet-400" />
                  )}
                </div>
                <h3 className="mt-4 text-xl font-semibold text-white">{pkg.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{pkg.desc}</p>
                <div className="mt-5">
                  {pkg.price != null ? (
                    <>
                      <p className="text-3xl font-semibold text-white">
                        {formatINR(pkg.price)}
                      </p>
                      <p className="text-xs text-zinc-500">one-time · domain excluded</p>
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-semibold text-white">Custom</p>
                      <p className="text-xs text-zinc-500">scoped after a short call</p>
                    </>
                  )}
                </div>
                <ul className="mt-6 space-y-2.5 text-sm text-zinc-300 flex-1">
                  {pkg.includes.map((item) => (
                    <li key={item} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Not included
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-zinc-500">
                    {pkg.excludes.map((x) => (
                      <li key={x}>· {x}</li>
                    ))}
                  </ul>
                </div>
                <a
                  href={`#quote`}
                  onClick={() =>
                    setForm((f) => ({ ...f, category: pkg.name }))
                  }
                  className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-400 py-2.5 text-sm font-bold hover:bg-emerald-300"
                  style={{ color: "#04140c" }}
                >
                  Request this package <ChevronRight className="h-4 w-4" />
                </a>
              </SpatialCard>
            ))}
          </div>
        </div>
      </section>

      {/* Care plan */}
      <section id="care" className="relative z-10 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <SpatialCard className="overflow-hidden p-0 md:grid md:grid-cols-[1.2fr_1fr]">
            <div className="space-y-4 p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">
                Monthly care
              </p>
              <h2 className="text-3xl font-semibold text-white">
                {formatINR(1500)}
                <span className="text-lg font-normal text-zinc-400"> / month</span>
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Keeps your site healthy after launch. Domain renewals are still yours —
                we handle the operational load.
              </p>
              <ul className="grid gap-2 sm:grid-cols-2 text-sm text-zinc-300">
                {[
                  "Data & file storage monitoring",
                  "Server / uptime issue response",
                  "Small website text & image updates",
                  "Backup checks & security basics",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 text-violet-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-white/10 bg-gradient-to-br from-violet-500/10 to-transparent p-8 md:border-l md:border-t-0">
              <p className="text-sm font-semibold text-white">Suggested pairing</p>
              <div className="mt-4 space-y-3 text-sm text-zinc-400">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  Website → + Care after go-live
                </div>
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/5 p-3 text-emerald-100">
                  Website + Billing → Care recommended (payments need watching)
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  Automation → Care + scoped support hours
                </div>
              </div>
            </div>
          </SpatialCard>
        </div>
      </section>

      {/* Live customer */}
      <section id="customers" className="relative z-10 border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-rose-300">
              Already live
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">
              Customers we’ve built for
            </h2>
            <p className="mt-3 text-zinc-400">
              Real deployments you can open in a new tab during a sales call — not mockups.
            </p>
          </div>

          <SpatialCard className="overflow-hidden p-0 lg:grid lg:grid-cols-[1.15fr_0.85fr]">
            {/* Preview pane */}
            <div className="relative min-h-[280px] border-b border-white/10 bg-gradient-to-br from-rose-500/20 via-zinc-950 to-zinc-950 p-6 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 opacity-30 spatial-grid-pattern" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-rose-400/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-200 border border-rose-400/40">
                    Salon
                  </span>
                  <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-200 border border-emerald-400/30">
                    Website
                  </span>
                  <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-200 border border-cyan-400/30">
                    Billing-ready
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-white sm:text-3xl">
                  S M Glamz Unisex Salon
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-zinc-300">
                  Premium grooming storefront — services, gallery, and contact flows for a
                  unisex salon brand. Built as a live customer site you can demo today.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-300" /> Customer site live
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Globe2 className="h-3.5 w-3.5 text-cyan-300" /> Mobile-first layout
                  </span>
                </div>
                {/* Mini browser chrome mock */}
                <div className="mt-4 overflow-hidden rounded-xl border border-white/15 bg-zinc-900/90 shadow-2xl">
                  <div className="flex items-center gap-1.5 border-b border-white/10 bg-zinc-950 px-3 py-2">
                    <span className="h-2 w-2 rounded-full bg-rose-400/80" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                    <span className="ml-2 truncate font-mono text-[10px] text-zinc-500">
                      smglamz.netlify.app
                    </span>
                  </div>
                  <div className="space-y-3 p-4">
                    <div className="h-3 w-1/3 rounded bg-rose-400/40" />
                    <div className="h-2 w-2/3 rounded bg-zinc-700" />
                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-rose-500/40 to-zinc-800" />
                      <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-fuchsia-500/30 to-zinc-800" />
                      <div className="aspect-[4/3] rounded-lg bg-gradient-to-br from-amber-500/30 to-zinc-800" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <div className="h-7 flex-1 rounded-full bg-rose-400/50" />
                      <div className="h-7 w-20 rounded-full bg-zinc-700" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
              <div className="space-y-4">
                <p className="text-sm font-semibold text-white">What we delivered</p>
                <ul className="space-y-2.5 text-sm text-zinc-300">
                  {[
                    "Salon brand website (services & presence)",
                    "Mobile-ready booking / enquiry path",
                    "Clear calls-to-action for walk-ins & appointments",
                    "Hosted live for client demos",
                  ].map((t) => (
                    <li key={t} className="flex gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                      {t}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-zinc-500">
                  Package fit: <span className="text-zinc-300">Website</span>
                  {" · "}
                  upgrade path: <span className="text-zinc-300">Website + Billing</span> / Care{" "}
                  {formatINR(1500)}/mo
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://smglamz.netlify.app/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-rose-400 px-5 py-2.5 text-sm font-bold hover:bg-rose-300"
                  style={{ color: "#1a0508" }}
                >
                  Visit live site <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href="#quote"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      category: "Salon demo",
                      description:
                        "Similar to SM Glamz salon site — want Website / Website+Billing for my salon.",
                    }))
                  }
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-500 bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-100 hover:border-zinc-400"
                >
                  Get one like this
                </a>
              </div>
            </div>
          </SpatialCard>
        </div>
      </section>

      {/* Demos */}
      <section id="demos" className="relative z-10 border-t border-white/5 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                Demonstration ready
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-white">
                Show clients what they’ll get
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DEMOS) as DemoId[]).map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDemo(id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    demo === id
                      ? "bg-cyan-400"
                      : "border border-zinc-600 bg-zinc-900 text-zinc-300 hover:border-zinc-400 hover:text-white"
                  }`}
                  style={demo === id ? { color: "#061018" } : undefined}
                >
                  {DEMOS[id].icon}
                  {DEMOS[id].title}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <SpatialCard className="p-6" depth={6}>
              <div className="flex items-center gap-2 text-emerald-300">
                {active.icon}
                <h3 className="text-lg font-semibold text-white">{active.title}</h3>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{active.blurb}</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {active.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-white/10 bg-black/40 p-3 text-center"
                  >
                    <p className="text-lg font-semibold text-white">{m.value}</p>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
              {demo === "projects" && (
                <div className="mt-6 rounded-xl border border-cyan-400/30 bg-cyan-500/5 p-4">
                  <div className="flex items-center justify-between text-xs text-cyan-200">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <Activity className="h-3.5 w-3.5 animate-pulse" /> Live completion
                    </span>
                    <span className="font-mono">{tick}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700"
                      style={{ width: `${tick}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400">
                    Spec → Design → Build → Demo → Report — parents & colleges see progress,
                    not source files.
                  </p>
                </div>
              )}
            </SpatialCard>

            <div className="space-y-3" style={{ perspective: 1000 }}>
              {active.panels.map((p, i) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-white/10 bg-zinc-950/90 p-4 shadow-xl transition-transform"
                  style={{
                    transform: `translateZ(${(2 - i) * 24}px) translateY(${i * -4}px)`,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{p.title}</p>
                      <p className="mt-1 text-xs text-zinc-400">{p.body}</p>
                    </div>
                    {p.pct != null && (
                      <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 font-mono text-[11px] text-cyan-300">
                        {demo === "projects" && p.title === "Live progress" ? tick : p.pct}%
                      </span>
                    )}
                  </div>
                  {p.pct != null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-cyan-400/80"
                        style={{
                          width: `${
                            demo === "projects" && p.title === "Live progress" ? tick : p.pct
                          }%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section id="quote" className="relative z-10 border-t border-white/5 bg-zinc-950/50 py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-400">
              Talk to us today
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Tell us your vertical — we’ll map a package
            </h2>
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
              Retail, salon, or student-project company: we’ll confirm Website vs Billing vs
              Automation and whether Care ({formatINR(1500)}/mo) should start at launch.
            </p>
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300"
            >
              <MessageCircle className="h-4 w-4" /> Message on WhatsApp
            </a>
          </div>

          <SpatialCard className="p-6">
            {done ? (
              <div className="space-y-3 py-6 text-center">
                <Package className="mx-auto h-8 w-8 text-emerald-400" />
                <p className="text-lg font-semibold text-white">Request received</p>
                <p className="text-sm text-zinc-400">
                  We’ll reply shortly. Prefer faster? WhatsApp us now.
                </p>
                {err && <p className="text-xs text-amber-400">{err}</p>}
                <a
                  href={WHATSAPP_LINK}
                  className="inline-flex text-sm font-semibold text-emerald-300 underline"
                >
                  Open WhatsApp
                </a>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs text-zinc-400">
                    Name
                    <input
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-zinc-400">
                    Phone
                    <input
                      required
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </label>
                </div>
                <label className="block text-xs text-zinc-400">
                  Email
                  <input
                    type="email"
                    required
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>
                <label className="block text-xs text-zinc-400">
                  Package
                  <select
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  >
                    <option>Website</option>
                    <option>Website + Billing</option>
                    <option>Automation add-ons</option>
                    <option>Care plan only</option>
                    <option>Retail demo</option>
                    <option>Salon demo</option>
                    <option>Project lab monitoring</option>
                  </select>
                </label>
                <label className="block text-xs text-zinc-400">
                  Brief
                  <textarea
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/50"
                    placeholder="Shop type, city, need website / payments / WhatsApp…"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                  />
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-cyan-400 py-2.5 text-sm font-bold hover:bg-cyan-300 disabled:opacity-60"
                  style={{ color: "#061018" }}
                >
                  {busy ? "Sending…" : "Send quote request"}
                </button>
              </form>
            )}
          </SpatialCard>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-10 text-center text-xs text-zinc-500">
        <p>
          Ace-Seek Portal · Domain prices excluded · Care {formatINR(1500)}/mo covers storage,
          server issues & small site changes
        </p>
        <p className="mt-2">
          <a href="https://www.ace-seek.com" className="text-zinc-400 hover:text-white">
            www.ace-seek.com
          </a>
          {" · "}
          <a href={WHATSAPP_LINK} className="text-emerald-400/80 hover:text-emerald-300">
            WhatsApp
          </a>
        </p>
      </footer>
    </div>
  );
}
