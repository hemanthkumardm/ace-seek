"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PRODUCTS } from "@/lib/site";
import {
  Cpu,
  Key,
  Zap,
  Boxes,
  Copy,
  Check,
  HelpCircle,
  LogOut,
  User,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "team";
  apiKey: string;
  freeKey?: string;
  trialKey?: string;
};

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function DashboardBody({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const freeKey = user.freeKey || user.apiKey;
  const trialKey = user.trialKey || user.apiKey.replace("ace_free_", "ace_trial_");

  const handleCopy = (keyStr: string, label: string) => {
    if (!keyStr) return;
    navigator.clipboard.writeText(keyStr);
    setCopiedKey(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="dashboard" />

      <main className="flex-1 m-shell py-10 md:py-14 space-y-10">
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
              <span className="text-[var(--muted)] font-mono">AUTH:</span>
              <span className="flex items-center gap-1.5 text-[#10b981] font-mono text-[11px] font-bold">
                <span className="sk-led sk-led-green" />{" "}
                {clerkPk?.trim() ? "SECURE" : "SESSION"}
              </span>
            </div>
            <div className="flex gap-2 mt-1">
              <a
                href="https://www.ace-seek.com/pricing"
                className="sk-btn sk-btn-primary !text-xs !py-1 flex-1 justify-center"
              >
                <Zap className="w-3 h-3 fill-white" />
                <span>Upgrade Plan</span>
              </a>
              <button
                type="button"
                onClick={onLogout}
                className="sk-btn sk-btn-ghost !text-xs !py-1 px-2.5"
                title="Log out"
              >
                <LogOut className="w-3 h-3 text-red-400" />
              </button>
            </div>
          </div>
        </div>

        {/* DUAL API KEYS CONTAINER */}
        <div className="sk-panel p-6 md:p-8 space-y-6 border-[var(--accent-cyan)]/50 shadow-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bevel-shadow)] pb-4">
            <div className="flex items-center gap-3">
              <div className="sk-icon-well w-10 h-10">
                <Key className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <h2 className="text-base font-bold">Your Account API License Keys</h2>
                <p className="text-xs text-[var(--muted)]">
                  Provisioned keys for VLSI EDA Studios and Document Compiler Workstations.
                </p>
              </div>
            </div>
            <span className="sk-badge sk-badge-live">2 KEYS PROVISIONED</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* KEY 1: 7-DAY PRO TRIAL KEY */}
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/10 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>1. 7-Day Pro Trial Key</span>
                </span>
                <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-500/30">
                  Starts On First Use
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="sk-lcd flex-1 py-2 px-3 font-mono text-xs text-yellow-200 truncate">
                  {trialKey}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(trialKey, "trial")}
                  className="sk-btn sk-btn-primary !text-xs !py-2 !px-3 shrink-0"
                >
                  {copiedKey === "trial" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-yellow-200/80 leading-relaxed font-mono">
                ⚡ Timer begins on first API call/login. Valid for 7 full days from first use.
              </p>
            </div>

            {/* KEY 2: PERMANENT FREE KEY */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/10 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Permanent Free Key</span>
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                  Never Expires
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="sk-lcd flex-1 py-2 px-3 font-mono text-xs text-emerald-200 truncate">
                  {freeKey}
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(freeKey, "free")}
                  className="sk-btn sk-btn-primary !text-xs !py-2 !px-3 shrink-0"
                >
                  {copiedKey === "free" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] text-emerald-200/80 leading-relaxed font-mono">
                🔒 Permanent access. Includes 25 converts/day & SDC Studio viewing.
              </p>
            </div>
          </div>

          <div className="sk-recessed p-4 text-xs text-[var(--muted)] space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-[var(--foreground)] font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
              <span>How to Authorize Workstations:</span>
            </div>
            <p>
              • Step 1: Copy either your <strong>7-Day Pro Trial Key</strong> or <strong>Permanent Free Key</strong> above.
            </p>
            <p>
              • Step 2: Open any product workstation (e.g. <code>tools.ace-seek.com</code> or <code>vlsi.ace-seek.com</code>).
            </p>
            <p>
              • Step 3: Paste into the <strong>API Key Bar</strong> to activate your entitlements.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-3">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
              <h2 className="text-base font-bold tracking-tight">
                Subdomain Ecosystem Specifications
              </h2>
            </div>
            <span className="sk-badge font-mono">{PRODUCTS.length} PRODUCTS</span>
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
                            className={`sk-led ${live ? "sk-led-green" : "sk-led-amber"}`}
                          />
                          <span>{live ? "Live Host" : "Soon"}</span>
                        </span>
                      </div>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">{p.blurb}</p>
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

function ClerkDashboard() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.push("/login?redirect=/dashboard");
      return;
    }
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setProfile(data.user);
        } else {
          router.push("/login?redirect=/dashboard");
        }
      })
      .catch(() => router.push("/login?redirect=/dashboard"))
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, router, clerkUser?.id]);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-full flex flex-col justify-center items-center py-32">
        <Loader2 className="w-6 h-6 text-[var(--accent-cyan)] animate-spin" />
        <p className="font-mono text-xs mt-3">VERIFYING SESSION…</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <DashboardBody
      user={profile}
      onLogout={async () => {
        await signOut({ redirectUrl: "/login" });
      }}
    />
  );
}

function LegacyDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("Unauthenticated");
        return res.json();
      })
      .then((data) => {
        if (data.authenticated && data.user) setUser(data.user);
        else router.push("/login?redirect=/dashboard");
      })
      .catch(() => router.push("/login?redirect=/dashboard"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-full flex flex-col justify-center items-center py-32">
        <Loader2 className="w-6 h-6 text-[var(--accent-cyan)] animate-spin" />
        <p className="font-mono text-xs mt-3">VERIFYING USER SESSION…</p>
      </div>
    );
  }
  if (!user) return null;

  return (
    <DashboardBody
      user={user}
      onLogout={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    />
  );
}

export default function DashboardPage() {
  if (clerkPk?.trim()) return <ClerkDashboard />;
  return <LegacyDashboard />;
}
