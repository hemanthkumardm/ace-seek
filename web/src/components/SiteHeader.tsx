"use client";

import React, { useState, useEffect } from "react";
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
  LogOut,
  User,
} from "lucide-react";

type Props = {
  /** Highlight active nav key */
  active?: "home" | "products" | "pricing" | "offers" | "advertise" | "blog" | "docs" | "dashboard";
};

type AuthUser = {
  id: string;
  email: string;
  name: string;
  plan: string;
} | null;

export function SiteHeader({ active }: Props) {
  const [authUser, setAuthUser] = useState<AuthUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setAuthUser(data.user);
        } else {
          setAuthUser(null);
        }
      })
      .catch(() => setAuthUser(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuthUser(null);
    window.location.href = "/login";
  };

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
      {/* Top Metallic Bevel Highlight */}
      <div className="h-[1px] bg-gradient-to-r from-transparent via-[var(--bevel-highlight)] to-transparent w-full opacity-60" />

      <div className="m-shell flex h-16 items-center justify-between gap-4">
        {/* Brand & Main SaaS Nav */}
        <div className="flex items-center gap-6 min-w-0">
          <a
            href="/"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[var(--surface-raised)] to-[var(--surface-recessed)] border border-[var(--bevel-highlight)] shadow-sm hover:brightness-110 transition-all shrink-0"
          >
            <div className="sk-icon-well w-6 h-6 rounded">
              <Cpu className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[var(--foreground)]">
                  Ace-Seek
                </span>
                <span className="sk-led sk-led-green" title="System Online" />
              </div>
              <span className="text-[9px] font-mono text-[var(--muted)] -mt-0.5 tracking-wide uppercase">
                SaaS Portal
              </span>
            </div>
          </a>

          <nav className="hidden lg:flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-recessed)] border border-[var(--bevel-shadow)]">
            {link("pricing", "/pricing", "Pricing", CreditCard)}
            {link("offers", "/offers", "Offers", Tag)}
            {link("advertise", "/advertise", "Advertise", Megaphone)}
            {link("docs", "/docs", "Docs", FileText)}
          </nav>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!loading && authUser ? (
            <>
              <a
                href="/dashboard"
                className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3.5"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-2.5"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5 text-red-400" />
              </button>
            </>
          ) : (
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
          )}
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
          <a
            href="/pricing"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Pricing & Plans
          </a>
          <a
            href="/dashboard"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            User Dashboard & API Keys
          </a>
          <a
            href="/offers"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Promotions & Offers
          </a>
          <a
            href="/advertise"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Advertise & Sponsorship
          </a>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Boxes className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Subdomain Specs</span>
          </p>
          <span className="block text-xs text-[var(--muted)]">doc.ace-seek.com (PDF · TeX · DOCX)</span>
          <span className="block text-xs text-[var(--muted)]">timing.ace-seek.com (SDC Math)</span>
          <span className="block text-xs text-[var(--muted)]">scripts.ace-seek.com (Glue Scripts)</span>
        </div>

        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
            <span>Identity & Support</span>
          </p>
          <a
            href="/login"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            User Login
          </a>
          <a
            href="/signup"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            Create Identity
          </a>
          <a
            href="/docs"
            className="block text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
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
              <span>v2.6.0-AUTH-PROTECTED</span>
            </span>
            <span className="text-[var(--accent-cyan)]">ace-seek.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
