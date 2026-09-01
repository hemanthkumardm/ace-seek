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
} from "lucide-react";

type UserProfile = {
  id: string;
  email: string;
  name: string;
  plan: "free" | "pro" | "max" | "team";
  apiKey: string;
};

const clerkPk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function DashboardBody({ user, onLogout }: { user: UserProfile; onLogout: () => void }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

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
              Account: {user.email} &bull; ID: {user.id}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="text-right space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-[var(--muted)] font-mono">
                  CURRENT TIER:
                </span>
                <span
                  className={`sk-badge ${
                    user.plan === "team"
                      ? "border-purple-500 text-purple-400 bg-purple-950/30"
                      : user.plan === "pro"
                      ? "border-emerald-500 text-emerald-400 bg-emerald-950/30"
                      : "border-slate-700 text-slate-300 bg-slate-800"
                  }`}
                >
                  {user.plan.toUpperCase()} PLAN
                </span>
              </div>
              <p className="text-[10px] text-[var(--muted)] font-mono">
                AUTH: <span className="text-[#10b981] font-bold">&bull; SECURE</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              {user.plan === "free" && (
                <a
                  href="/pricing"
                  className="sk-btn sk-btn-primary !text-xs !py-2.5 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Upgrade Plan</span>
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
        </div>

        <div className="sk-panel p-6 md:p-8 space-y-6 border-[var(--accent-cyan)]/50 shadow-cyan-950/20">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--bevel-shadow)] pb-4">
            <div className="flex items-center gap-3">
              <div className="sk-icon-well w-10 h-10">
                <Key className="w-5 h-5 text-[var(--accent-cyan)]" />
              </div>
              <div>
                <h2 className="text-base font-bold">Your plan API license key</h2>
                <p className="text-xs text-[var(--muted)]">
                  Use this key on VLSI and tools workstations for your{" "}
                  <span className="font-mono uppercase text-[var(--accent-cyan)]">{user.plan}</span> plan.
                </p>
              </div>
            </div>
            <span className="sk-badge sk-badge-live">PERSONAL KEY</span>
          </div>

          <div className="space-y-3">
            <label className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Active API token ({user.plan.toUpperCase()}):
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
                onClick={() => handleCopy(user.apiKey, "plan")}
                className="sk-btn sk-btn-primary !text-xs !py-2.5 !px-5 shrink-0"
              >
                {copiedKey === "plan" ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied</span>
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

          <div className="sk-recessed p-4 text-xs text-[var(--muted)] space-y-2 leading-relaxed">
            <div className="flex items-center gap-2 text-[var(--foreground)] font-bold mb-1">
              <HelpCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
              <span>How to Authorize Subdomain Apps:</span>
            </div>
            <p>
              • Step 1: Click <strong>&quot;Copy API Key&quot;</strong> above.
            </p>
            <p>
              • Step 2: Open a subdomain (e.g. <code>doc.ace-seek.com</code> or{" "}
              <code>vlsi.ace-seek.com</code>).
            </p>
            <p>
              • Step 3: Paste into <strong>API Key Authorization</strong> to unlock{" "}
              {user.plan.toUpperCase()} capabilities.
            </p>
            <p className="pt-1 text-[var(--accent-cyan)]">
              Multi-device: sign in with the same account — this key stays identical.
            </p>
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
