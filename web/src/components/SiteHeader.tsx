"use client";

import React, { useState, useEffect } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  Cpu,
  CreditCard,
  Tag,
  Megaphone,
  FileText,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Terminal,
  Shield,
  Activity,
  Boxes,
} from "lucide-react";

type Props = {
  /** Highlight active nav key */
  active?:
    | "home"
    | "products"
    | "pricing"
    | "offers"
    | "advertise"
    | "blog"
    | "docs"
    | "dashboard";
};

/** Client-safe auth chrome (useAuth; avoid server-only Show in client trees). */
function ClerkHeaderAuth() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <span className="text-[10px] font-mono text-[var(--muted)] px-2">…</span>
    );
  }

  if (isSignedIn) {
    return (
      <>
        <a
          href="/dashboard"
          className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3.5"
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </a>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 border-2 border-black",
            },
          }}
        />
      </>
    );
  }

  return (
    <>
      <a
        href="/login"
        className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <LogIn className="w-3.5 h-3.5" />
        <span>Log in</span>
      </a>
      <a
        href="/signup"
        className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3.5"
      >
        <UserPlus className="w-3.5 h-3.5" />
        <span>Sign up</span>
      </a>
    </>
  );
}

export function SiteHeader({ active }: Props) {
  const [hostname, setHostname] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostname(window.location.hostname);
    }
  }, []);

  const isVlsi = hostname.startsWith("vlsi");
  const isTools =
    hostname.startsWith("tools") ||
    hostname.startsWith("doc") ||
    hostname.startsWith("diff") ||
    hostname.startsWith("convert") ||
    hostname.startsWith("sanitizer") ||
    hostname.startsWith("tex") ||
    hostname.startsWith("table");

  const brandTitle = isVlsi
    ? "VLSI.ACE-SEEK.COM"
    : isTools
    ? "TOOLS.ACE-SEEK.COM"
    : "Ace-Seek";

  const brandSub = isVlsi
    ? "VLSI Integration Suite"
    : isTools
    ? "Utility Tools Suite"
    : "SaaS Portal";

  const brandHref = isVlsi
    ? "/"
    : isTools
    ? "/"
    : "/";

  const link = (
    key: Props["active"],
    href: string,
    label: string,
    Icon: React.ElementType
  ) => {
    const isActive = active === key;
    return (
      <a
        href={href}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          isActive
            ? "sk-recessed text-[var(--accent-cyan)] font-semibold shadow-inner"
            : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.03)]"
        }`}
      >
        <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[var(--accent-cyan)]" : ""}`} />
        <span>{label}</span>
      </a>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface-panel)]/95 backdrop-blur-md border-b border-[var(--bevel-shadow)] shadow-md">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--bevel-highlight)] to-transparent w-full opacity-60" />

      <div className="m-shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-6 min-w-0">
          <a
            href={brandHref}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[var(--surface-raised)] to-[var(--surface-recessed)] border border-[var(--bevel-highlight)] shadow-sm hover:brightness-110 transition-all shrink-0"
          >
            <div className="sk-icon-well w-6 h-6 rounded">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[var(--foreground)] uppercase font-mono">
                  {brandTitle}
                </span>
                <span className="sk-led sk-led-green" title="System Online" />
              </div>
              <span className="text-[9px] font-mono text-[var(--muted)] -mt-0.5 tracking-wide uppercase">
                {brandSub}
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-recessed)] border border-[var(--bevel-shadow)]">
            {(isVlsi || isTools) && (
              <a
                href="https://ace-seek.com/"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold text-[var(--accent-cyan)] hover:bg-[rgba(255,255,255,0.05)] transition-all"
              >
                <Terminal className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                <span>Main Portal</span>
              </a>
            )}
            {link("pricing", "https://ace-seek.com/pricing", "Pricing", CreditCard)}
            {link("offers", "https://ace-seek.com/offers", "Offers", Tag)}
            {link("advertise", "https://ace-seek.com/advertise", "Advertise", Megaphone)}
            {link("docs", "https://ace-seek.com/docs", "Docs", FileText)}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ClerkHeaderAuth />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[var(--surface-panel)] border-t border-[var(--bevel-shadow)] relative overflow-hidden">
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--bevel-highlight)] to-transparent opacity-50" />

      <div className="m-shell py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well w-7 h-7">
              <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="font-bold text-base tracking-tight">Ace-Seek</span>
          </div>
          <p className="text-xs text-[var(--muted)] leading-relaxed max-w-xs">
            Apex SaaS Portal for user pricing, dashboard API keys, promotions, and enterprise advertising.
          </p>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>SaaS Core</span>
          </p>
          <a href="/pricing" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Pricing & Plans
          </a>
          <a href="/dashboard" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            User Dashboard & API Keys
          </a>
          <a href="/offers" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Promotions & Offers
          </a>
          <a href="/advertise" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Advertise & Sponsorship
          </a>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Subdomain Specs</span>
          </p>
          <span className="block text-xs text-[var(--muted)]">doc.ace-seek.com (PDF · TeX · DOCX)</span>
          <span className="block text-xs text-[var(--muted)]">vlsi.ace-seek.com (SDC · Timing · MMMC)</span>
          <span className="block text-xs text-[var(--muted)]">tools.ace-seek.com (Utilities)</span>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Identity & Support</span>
          </p>
          <a href="/login" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            User Login
          </a>
          <a href="/signup" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Create Identity
          </a>
          <a href="/docs" className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            Documentation
          </a>
        </div>
      </div>

      <div className="bg-[var(--surface-recessed)] border-t border-[var(--bevel-shadow)] py-4">
        <div className="m-shell flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--muted)]">
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <Terminal className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>© {new Date().getFullYear()} Ace-Seek Inc. Apex SaaS Portal</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-[var(--led-green)]" />
              <span>v2.7.0-CLERK-AUTH</span>
            </span>
            <span className="text-[var(--accent-cyan)]">ace-seek.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
