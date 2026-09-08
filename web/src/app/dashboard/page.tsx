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
  LogOut,
  User,
  Loader2,
  Sparkles,
  Calendar,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "max" | "team";
  planStatus?: string;
  planPeriod?: string;
  planRenewsAt?: string | null;
  hasInterviewMasterclass?: boolean;
  apiKey?: string;
};

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function DashboardBody({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const renewLabel = user.planRenewsAt
    ? new Date(user.planRenewsAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;
  const status = (user.planStatus || "active").toLowerCase();

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
                Your account
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Welcome back, {user.name}
            </h1>
            <p className="text-xs md:text-sm text-[var(--muted)] font-mono">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {user.plan === "free" ? (
              <a
                href="/pricing"
                className="sk-btn sk-btn-primary !text-xs !py-2.5 flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade</span>
              </a>
            ) : (
              <a
                href="/pricing"
                className="sk-btn sk-btn-ghost !text-xs !py-2.5 flex items-center gap-1.5"
              >
                <span>Manage plan</span>
              </a>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="sk-btn sk-btn-ghost !text-xs !py-2.5"
              title="Log out"
            >
              <LogOut className="w-3 h-3 text-red-400" />
            </button>
          </div>
        </div>

        {/* Subscription card — AI-tool style */}
        <div className="sk-panel p-6 md:p-8 space-y-5 border-[var(--accent-cyan)]/50">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="sk-icon-well w-11 h-11">
                {user.plan === "max" || user.plan === "team" ? (
                  <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-[var(--accent-cyan)]" />
                )}
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black tracking-tight">
                  {user.plan.toUpperCase()} plan
                </h2>
                <p className="text-xs text-[var(--muted)]">
                  Active on VLSI, Tools, and OpenROAD when you&apos;re signed in.
                </p>
              </div>
            </div>
            <span
              className={`sk-badge ${
                status === "active" || status === "trialing"
                  ? "border-emerald-500 text-emerald-400 bg-emerald-950/30"
                  : status === "past_due"
                    ? "border-amber-500 text-amber-400 bg-amber-950/30"
                    : "border-slate-600 text-slate-300"
              }`}
            >
              {status.toUpperCase()}
            </span>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 text-xs">
            <div className="sk-recessed p-3 space-y-1">
              <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Period</p>
              <p className="font-mono font-bold text-[var(--foreground)]">
                {(user.planPeriod || (user.plan === "free" ? "none" : "monthly")).toUpperCase()}
              </p>
            </div>
            <div className="sk-recessed p-3 space-y-1">
              <p className="text-[10px] uppercase font-bold text-[var(--muted)] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Renews / ends
              </p>
              <p className="font-mono font-bold text-[var(--foreground)]">
                {user.plan === "free" ? "—" : renewLabel || "Active"}
              </p>
            </div>
            <div className="sk-recessed p-3 space-y-1">
              <p className="text-[10px] uppercase font-bold text-[var(--muted)]">Add-ons</p>
              <p className="font-mono font-bold text-[var(--foreground)]">
                {user.hasInterviewMasterclass ? "Interview Masterclass" : "None"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <a href="/pricing" className="sk-btn sk-btn-primary !text-xs !py-2 !px-4">
              {user.plan === "free" ? "Upgrade to Pro / Max" : "Change plan"}
            </a>
            <a
              href="https://vlsi.ace-seek.com"
              className="sk-btn sk-btn-ghost !text-xs !py-2 !px-4 inline-flex items-center gap-1"
            >
              <Cpu className="w-3.5 h-3.5" />
              Open VLSI
            </a>
            <a
              href="https://tools.ace-seek.com"
              className="sk-btn sk-btn-ghost !text-xs !py-2 !px-4 inline-flex items-center gap-1"
            >
              <Boxes className="w-3.5 h-3.5" />
              Open Tools
            </a>
          </div>
        </div>

        {/* WORKSTATION ACCESSIBILITY GRID */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Boxes className="w-5 h-5 text-[var(--accent-blue)]" />
              <span>Available Microservices &amp; Workstations</span>
            </h2>
            <span className="text-xs text-[var(--muted)] font-mono">
              Launch any product below
            </span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {PRODUCTS.map((prod) => (
              <div key={prod.slug} className="sk-card group p-6 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="sk-badge sk-badge-cyan">
                      {prod.status === "live" ? "OPERATIONAL" : "COMING SOON"}
                    </span>
                    <span className="text-[10px] text-[var(--muted)] font-mono">
                      Subdomain: {prod.slug}.ace-seek.com
                    </span>
                  </div>
                  <h3 className="text-xl font-bold group-hover:text-[var(--accent-cyan)] transition">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed">
                    {prod.blurb}
                  </p>
                </div>

                <div className="pt-2 border-t border-[var(--bevel-shadow)] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#10b981] flex items-center gap-1">
                    <span className="sk-led sk-led-green" /> Hub Operational
                  </span>
                  <a
                    href={prod.appPath}
                    className="sk-btn sk-btn-primary !text-xs !py-1.5"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>Launch {prod.name}</span>
                    <Cpu className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HELP & SUPPORT */}
        <div className="sk-recessed p-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[var(--muted)]" />
            <div>
              <p className="font-bold text-white">Need custom enterprise licenses or integration help?</p>
              <p className="text-[var(--muted)]">Reach out to our engineering support team directly</p>
            </div>
          </div>
          <a
            href="mailto:support@ace-seek.com"
            className="sk-btn sk-btn-ghost !text-xs"
          >
            <span>Contact Support &rarr;</span>
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiUser, setApiUser] = useState<UserProfile | null>(null);
  const [fallbackUser, setFallbackUser] = useState<UserProfile | null>(null);

  const clerkRes = useUser();
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();

  useEffect(() => {
    setMounted(true);
    const raw = localStorage.getItem("ace_seek_user");
    if (raw) {
      try {
        setFallbackUser(JSON.parse(raw));
      } catch {
        // ignore
      }
    }

    // Fetch exact authentic API keys from backend route /api/auth/me
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setApiUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-cyan)]" />
      </div>
    );
  }

  const currentUser: UserProfile | null = apiUser || fallbackUser;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-center p-6 text-center space-y-6 text-white">
        <div className="sk-icon-well w-14 h-14">
          <Key className="w-7 h-7 text-[var(--accent-cyan)]" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-xl font-bold">Authentication Required</h2>
          <p className="text-xs text-[var(--muted)]">
            Please sign in to manage your Ace-Seek plan and open workstations.
          </p>
        </div>
        <div className="flex gap-4">
          <a href="/login" className="sk-btn sk-btn-primary">
            Log In &rarr;
          </a>
          <a href="/" className="sk-btn sk-btn-ghost">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    localStorage.removeItem("ace_seek_user");
    localStorage.removeItem("ace_seek_api_key");
    localStorage.removeItem("ace_api_key");
    if (clerkPk?.trim() && signOut) {
      await signOut();
    }
    router.push("/");
  };

  return <DashboardBody user={currentUser} onLogout={handleLogout} />;
}
