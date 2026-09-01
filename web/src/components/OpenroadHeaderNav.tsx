"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Boxes,
  FolderOpen,
  FileCode2,
  Play,
  Key,
  ExternalLink,
  ArrowRight,
  Home,
  Sparkles,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  LogOut,
  User,
} from "lucide-react";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";
import { useEntitlements } from "@/hooks/useEntitlements";

type Props = {
  homeHref: string;
  loginHref: string;
  signupHref: string;
  mainSiteUrl: string;
};

export const OPENROAD_STUDIOS = [
  {
    href: "/openroad/project",
    label: "Project",
    match: ["/openroad/project"],
  },
  {
    href: "/openroad/design",
    label: "Design",
    match: ["/openroad/design"],
  },
  {
    href: "/openroad/studio",
    label: "PnR Studio",
    match: ["/openroad/studio", "/openroad/run"],
  },
  {
    href: "/openroad/scripts",
    label: "Scripts",
    match: ["/openroad/scripts"],
  },
] as const;

export function OpenroadHeaderNav({
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { apiKey, ent, clearKey, isGuest, isFree, isPro, isMax, isTeam } = useEntitlements();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const isIntroPage =
    pathname === "/" || pathname === "/openroad" || pathname === "/openroad/";

  const isAuthorized = Boolean(apiKey && apiKey.trim().length > 0 && !isGuest);

  const handleCopyKey = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenStudio = (path = "/openroad/project") => {
    if (isAuthorized) {
      router.push(path);
    } else {
      setShowAuthModal(true);
    }
  };

  const planTier = ent?.tier || (isMax ? "max" : isPro ? "pro" : isTeam ? "team" : isFree ? "free" : "guest");
  const planLabel = ent?.label || (planTier === "max" ? "MAX" : planTier.toUpperCase());

  return (
    <>
      <header className="shrink-0 z-30 bg-[var(--neu-bg)] border-b border-white/50 shadow-[0_4px_12px_rgba(192,200,214,0.35)]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          {isIntroPage ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <a
                  href={homeHref}
                  className="neu-panel-sm flex items-center gap-2 px-3 py-1.5 font-black text-[var(--neu-text)] hover:opacity-90 transition-opacity shrink-0"
                >
                  <Boxes className="w-4 h-4 text-sky-600" />
                  <span className="text-xs tracking-tight hidden sm:inline">
                    OPENROAD.ACE-SEEK
                  </span>
                  <span className="text-xs tracking-tight sm:hidden">OR</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStudio("/openroad/project")}
                  className="neu-btn neu-btn-primary !text-xs !py-2 !px-3 font-black uppercase flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => (isAuthorized ? setShowPlanModal(true) : setShowAuthModal(true))}
                  className={`neu-btn !text-xs !py-2 !px-3 font-black flex items-center gap-1.5 ${
                    isMax || isTeam
                      ? "text-sky-700 font-extrabold"
                      : isPro
                      ? "text-emerald-700"
                      : ""
                  }`}
                >
                  {isMax || isTeam ? (
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  ) : isPro ? (
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Key className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isAuthorized ? `${planLabel} PLAN` : "Login / Key"}
                  </span>
                </button>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="neu-btn !text-xs !py-2 !px-3 font-black hidden sm:inline-flex items-center gap-1 text-[var(--neu-text-muted)] hover:text-sky-700"
                >
                  <span>www.ace-seek.com</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                <a
                  href={homeHref}
                  className="neu-panel-sm flex items-center gap-1.5 px-2.5 py-1.5 font-black text-[10px] uppercase shrink-0 text-sky-700"
                  title="OpenROAD intro"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">OpenROAD</span>
                </a>
                {OPENROAD_STUDIOS.map((s) => {
                  const active = s.match.some(
                    (m) => pathname === m || pathname.startsWith(m + "/")
                  );
                  return (
                    <button
                      key={s.href}
                      type="button"
                      onClick={() => handleOpenStudio(s.href)}
                      className={`shrink-0 px-2.5 py-1.5 text-[11px] font-black uppercase rounded-xl transition-all flex items-center gap-1 ${
                        active
                          ? "neu-btn-active text-sky-700"
                          : "neu-btn text-[var(--neu-text)]"
                      }`}
                    >
                      {s.label === "Project" && (
                        <FolderOpen className="w-3 h-3" />
                      )}
                      {s.label === "Design" && (
                        <FileCode2 className="w-3 h-3" />
                      )}
                      {s.label === "Scripts" && (
                        <FileCode2 className="w-3 h-3" />
                      )}
                      {s.label === "PnR Studio" && <Play className="w-3 h-3" />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => (isAuthorized ? setShowPlanModal(true) : setShowAuthModal(true))}
                  className={`neu-btn !text-[10px] font-bold uppercase !px-2.5 !py-1.5 flex items-center gap-1.5 ${
                    isMax || isTeam
                      ? "text-sky-700 font-extrabold border-sky-400"
                      : isPro
                      ? "text-emerald-700 font-bold border-emerald-400"
                      : ""
                  }`}
                  title="Click to view your active License & Plan"
                >
                  {isMax || isTeam ? (
                    <Sparkles className="w-3 h-3 text-sky-600" />
                  ) : isPro ? (
                    <Zap className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Key className="w-3 h-3 text-slate-600" />
                  )}
                  <span>
                    {isAuthorized ? `${planLabel} PLAN` : "Login / Key"}
                  </span>
                </button>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-[var(--neu-text-muted)] hover:text-sky-700 hidden md:inline-flex items-center gap-1 font-mono transition-colors"
                >
                  <span>www.ace-seek.com</span>
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              </div>
            </>
          )}
        </div>
      </header>

      {/* PLAN & ACCOUNT DETAILS MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-[var(--neu-bg)] border border-slate-300 shadow-2xl rounded-2xl p-6 space-y-5 font-mono">
            <button
              type="button"
              onClick={() => setShowPlanModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full neu-btn text-slate-500 hover:text-rose-600 flex items-center justify-center font-black text-xs"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="neu-inset w-10 h-10 rounded-xl flex items-center justify-center text-sky-600">
                {isMax || isTeam ? (
                  <Sparkles className="w-5 h-5" />
                ) : isPro ? (
                  <Zap className="w-5 h-5 text-emerald-600" />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-tight text-[var(--neu-text)]">
                  Account License Details
                </h3>
                <p className="text-[11px] text-[var(--neu-text-muted)]">
                  Active Tier: <strong className="text-sky-700">{planLabel} PLAN</strong>
                </p>
              </div>
            </div>

            {/* Active Plan Card */}
            <div className="neu-inset p-4 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--neu-text-muted)] text-[10px] uppercase font-bold">Current Status</span>
                <span className="neu-panel-sm px-2 py-0.5 text-[10px] font-black text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  AUTHENTICATED · ACTIVE
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <p className="text-[10px] text-[var(--neu-text-muted)] uppercase font-bold">Active API Key</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={apiKey}
                    className="flex-1 bg-white/80 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-mono select-all truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="neu-btn !p-2 shrink-0"
                    title="Copy API key"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[var(--neu-text-muted)] space-y-1">
                {isMax || isTeam ? (
                  <p className="text-sky-700 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Unlimited OpenROAD runs & full ASIC PnR toolchain.
                  </p>
                ) : isPro ? (
                  <p className="text-emerald-700 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Pro Tier: RTL Lint, Sim & Standard Synthesis.
                  </p>
                ) : (
                  <p className="text-slate-600 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Free Tier quotas active.
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPlanModal(false);
                  setShowAuthModal(true);
                }}
                className="neu-btn !text-xs !py-2 !px-3 font-bold text-sky-700"
              >
                Switch Key
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    clearKey();
                    setShowPlanModal(false);
                  }}
                  className="neu-btn !text-xs !py-2 !px-2.5 text-rose-600"
                  title="Clear key / Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
                <a
                  href={`${mainSiteUrl}/dashboard`}
                  target="_blank"
                  rel="noreferrer"
                  className="neu-btn neu-btn-primary !text-xs !py-2 !px-3 font-black flex items-center gap-1"
                >
                  <span>Dashboard</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN / KEY MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full neu-btn font-black text-rose-600 z-10 flex items-center justify-center"
            >
              ✕
            </button>
            <SubdomainAuthModal
              subdomainName="OPENROAD"
              onAuthorize={() => {
                setShowAuthModal(false);
                if (isLoaded && isSignedIn) {
                  /* ok */
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
