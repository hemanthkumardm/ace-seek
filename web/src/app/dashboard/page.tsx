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
  Clock,
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
  const [trialStatus, setTrialStatus] = useState<{
    activated: boolean;
    expiresAt?: string;
    daysRemaining?: number;
    expired?: boolean;
  }>({ activated: false });
  const [countdownText, setCountdownText] = useState<string>("");

  const freeKey = user.freeKey || user.apiKey;
  const trialKey = user.trialKey || user.apiKey.replace("ace_free_", "ace_trial_");

  useEffect(() => {
    if (!trialKey) return;
    fetch("/api/validate-key", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey: trialKey }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.expiresAt) {
          setTrialStatus({
            activated: true,
            expiresAt: data.expiresAt,
            daysRemaining: data.daysRemaining,
            expired: Boolean(data.trialExpired),
          });
        }
      })
      .catch(() => {});
  }, [trialKey]);

  useEffect(() => {
    if (!trialStatus.expiresAt) return;
    const targetTime = new Date(trialStatus.expiresAt).getTime();

    const updateTimer = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) {
        setCountdownText("Trial Expired (Reverted to Free)");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdownText(
        `${days}d ${hours}h ${mins}m ${secs}s remaining`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [trialStatus.expiresAt]);

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
            {/* KEY 1: 7-DAY MAX TRIAL KEY */}
            <div className="rounded-xl border border-yellow-500/40 bg-yellow-950/10 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                  <span>1. 7-Day MAX Trial Key</span>
                </span>
                <span className="rounded-full bg-yellow-500/20 px-2.5 py-0.5 text-[10px] font-bold text-yellow-300 border border-yellow-500/30 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-yellow-400" />
                  <span>
                    {trialStatus.expired
                      ? "Expired (Fell back to Free)"
                      : countdownText
                      ? countdownText
                      : "Starts On First Use"}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="sk-lcd flex-1 py-2 px-3 font-mono text-xs text-yellow-200 truncate select-all">
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
                ⚡ Unlocks 100% MAX features across all Workstations. The 7-day countdown starts on first use.
              </p>
            </div>

            {/* KEY 2: PERMANENT FREE KEY */}
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/10 p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>2. Permanent Free Key</span>
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30 font-mono">
                  Never Expires
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="sk-lcd flex-1 py-2 px-3 font-mono text-xs text-emerald-200 truncate select-all">
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
                🛡️ Always active with standard limits (5 doc converts/day &amp; standard EDA features).
              </p>
            </div>
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
              Use your API key above for instant authentication
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

        {/* HELP & DOCUMENTATION */}
        <div className="sk-recessed p-6 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-5 h-5 text-[var(--muted)]" />
            <div>
              <p className="font-bold text-white">Need developer documentation or custom API keys?</p>
              <p className="text-[var(--muted)]">Check our guides or reach out to support@ace-seek.com</p>
            </div>
          </div>
          <a
            href="https://www.ace-seek.com/docs"
            className="sk-btn sk-btn-ghost !text-xs"
          >
            <span>API Docs &rarr;</span>
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
            Please log in to access your Ace-Seek API keys and EDA workstations.
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
