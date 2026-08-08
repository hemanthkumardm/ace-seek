"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PRODUCTS } from "@/lib/site";
import {
  LayoutDashboard,
  Cpu,
  Key,
  CreditCard,
  Zap,
  Boxes,
  Copy,
  Check,
  HelpCircle,
  LogOut,
  User,
  Loader2,
  ShieldCheck,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team";
  apiKey: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          router.push("/login?redirect=/dashboard");
        }
      })
      .catch(() => {
        router.push("/login?redirect=/dashboard");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  const handleCopy = () => {
    if (!user?.apiKey) return;
    navigator.clipboard.writeText(user.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-full flex flex-col justify-center items-center py-32 bg-[var(--surface-panel)]">
        <div className="sk-lcd p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 text-[var(--accent-cyan)] animate-spin mx-auto" />
          <p className="font-mono text-xs">VERIFYING USER SESSION & API KEYS...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="dashboard" />

      <main className="flex-1 m-shell py-10 md:py-14 space-y-10">
        {/* Top Header & Status Panel */}
        <div className="sk-panel p-6 md:p-8 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <div className="sk-icon-well">
                <User className="w-4 h-4 text-[var(--accent-cyan)]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
                Authenticated User Control Deck
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs md:text-sm text-[var(--muted)] font-mono">
              Account: {user.email} · ID: {user.id}
            </p>
          </div>

          <div className="sk-recessed p-4 flex flex-col gap-2 min-w-[240px]">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)] font-mono">CURRENT TIER:</span>
              <span className="sk-badge sk-badge-live uppercase">{user.plan} PLAN</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--bevel-shadow)]">
              <span className="text-[var(--muted)] font-mono">API STATUS:</span>
              <span className="flex items-center gap-1.5 text-[#10b981] font-mono text-[11px] font-bold">
                <span className="sk-led sk-led-green" /> ACTIVE
              </span>
            </div>
            <div className="flex gap-2 mt-1">
              <a
                href="/pricing"
                className="sk-btn sk-btn-primary !text-xs !py-1 flex-1 justify-center"
              >
                <Zap className="w-3 h-3 fill-white" />
                <span>Upgrade Plan</span>
              </a>
              <button
                type="button"
                onClick={handleLogout}
                className="sk-btn sk-btn-ghost !text-xs !py-1 px-2.5"
                title="Log out"
              >
                <LogOut className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* PERSONAL UNIQUE API LICENSE KEY PANEL */}
        <div className="sk-panel p-6 md:p-8 space-y-6 border-[var(--accent-cyan)]/50 shadow-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bevel-shadow)] pb-4">
            <div className="flex items-center gap-3">
              <div className="sk-icon-well w-10 h-10">
                <Key className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <h2 className="text-base font-bold">Your Unique Plan API License Key</h2>
                <p className="text-xs text-[var(--muted)]">
                  Copy your unique API key generated for your <span className="font-mono text-[var(--accent-cyan)] uppercase font-bold">{user.plan}</span> plan.
                </p>
              </div>
            </div>
            <span className="sk-badge sk-badge-live">PERSONAL KEY</span>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Active API Token ({user.plan.toUpperCase()} TIER):
            </label>

            <div className="flex items-center gap-3">
              <div className="sk-lcd flex-1 py-2.5 px-4 font-mono text-sm tracking-wider flex items-center justify-between overflow-x-auto">
                <span className="truncate">{user.apiKey}</span>
                <span className="text-xs opacity-75 text-[var(--accent-cyan)] font-sans font-semibold ml-2 shrink-0">
                  {user.plan.toUpperCase()}
                </span>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="sk-btn sk-btn-primary !text-xs !py-2.5 !px-5 shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy API Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Instructions Box */}
          <div className="sk-recessed p-4 text-xs text-[var(--muted)] space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-[var(--foreground)] font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
              <span>How to Authorize Subdomain Apps:</span>
            </div>
            <p>• Step 1: Click <strong>&quot;Copy API Key&quot;</strong> above to copy your personal token.</p>
            <p>• Step 2: Open your subdomain website (e.g. <code>doc.ace-seek.com</code>).</p>
            <p>• Step 3: Paste this token into the <strong>&quot;API Key Authorization&quot;</strong> input on the subdomain to unlock your {user.plan.toUpperCase()} plan capabilities.</p>
          </div>
        </div>

        {/* Subdomain Tools Specs Overview (Information Only) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
              <h2 className="text-base font-bold tracking-tight">
                Subdomain Ecosystem Specifications
              </h2>
            </div>
            <span className="sk-badge font-mono">3 SUBDOMAIN WEBSITES</span>
          </div>

          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => {
              const live = p.status === "live";

              return (
                <li key={p.id}>
                  <div className="sk-panel p-6 flex flex-col justify-between h-full space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="sk-icon-well">
                            <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[var(--foreground)]">
                              {p.name}
                            </h3>
                            <p className="font-mono text-[11px] text-[var(--accent-cyan)]">
                              {p.host}
                            </p>
                          </div>
                        </div>
                        <span className="sk-badge">
                          <span
                            className={`sk-led ${
                              live ? "sk-led-green" : "sk-led-amber"
                            }`}
                          />
                          <span>{live ? "Live Host" : "Soon"}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        {p.blurb}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[var(--bevel-shadow)] text-xs text-[var(--muted)] font-mono flex items-center justify-between">
                      <span>API Validation:</span>
                      <span className="text-[var(--accent-cyan)] font-bold">READY</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
