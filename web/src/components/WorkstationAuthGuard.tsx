"use client";

import React, { Suspense, useMemo } from "react";
import { usePathname } from "next/navigation";
import { Lock, LogIn, Sparkles } from "lucide-react";
import { SubdomainClerkLogin } from "@/components/SubdomainClerkLogin";
import { SITE_URL } from "@/lib/site";
import { useEntitlements } from "@/hooks/useEntitlements";

type Props = {
  children: React.ReactNode;
};

/**
 * Shell lock for VLSI / Tools / OpenROAD workstations.
 *
 * Plan is tracked from **login session** (`/api/auth/me` → Clerk metadata),
 * not from pasted API keys.
 * - Not signed in → login wall on this host
 * - Signed in → unlock; FeatureLock / VlsiStudioGate apply Free/Pro/Max/Team
 */
export function WorkstationAuthGuard({ children }: Props) {
  const pathname = usePathname();
  const { ready, loading, isSignedIn } = useEntitlements();

  const isPublicRoute = useMemo(() => {
    if (!pathname) return true;
    return (
      pathname === "/" ||
      pathname === "/vlsi" ||
      pathname === "/openroad" ||
      pathname === "/tools" ||
      pathname === "/login" ||
      pathname.endsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.includes("/interview-masterclass")
    );
  }, [pathname]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  if (loading || !ready) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-900 text-white font-mono">
        <div className="flex items-center gap-3">
          <span className="sk-led sk-led-green animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Checking account…
          </span>
        </div>
      </div>
    );
  }

  if (isSignedIn) {
    return <>{children}</>;
  }

  const redirect = pathname && pathname.startsWith("/") ? pathname : "/";
  const backHref = pathname?.startsWith("/tools")
    ? "/tools"
    : pathname?.startsWith("/openroad")
      ? "/openroad"
      : "/vlsi";

  return (
    <div className="flex-1 min-h-[80vh] flex items-center justify-center p-6 bg-slate-950 font-mono">
      <div className="brutal-panel bg-[var(--surface-panel)] border-4 border-black shadow-[10px_10px_0_#000000] p-8 md:p-10 space-y-6 max-w-xl w-full">
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-rose-500 border-2 border-black flex items-center justify-center text-white font-black shadow-[3px_3px_0_#000000]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Sign in required
              </h2>
              <p className="text-[11px] font-bold text-rose-400">
                Free tier unlocks with your account — no API key paste
              </p>
            </div>
          </div>
          <span className="brutal-badge brutal-badge-pink">ACCOUNT</span>
        </div>

        <p className="text-xs text-slate-300 font-bold leading-relaxed">
          Log in on this host to open workstations. Your plan (
          <span className="text-white">Free / Pro / Max / Team</span>) is read from
          your account. Upgrade anytime — features unlock on the next refresh.
        </p>

        <div className="rounded-xl border border-emerald-600/40 bg-emerald-950/30 p-3 text-[11px] font-bold text-emerald-100 flex items-start gap-2">
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-emerald-300" />
          <span>
            Create a free account below. You stay on this subdomain — no need to
            bounce back to {SITE_URL.replace(/^https?:\/\//, "")} just to sign in.
          </span>
        </div>

        <Suspense
          fallback={
            <div className="text-xs text-slate-400 py-8 text-center">Loading sign-in…</div>
          }
        >
          <SubdomainClerkLogin path="/login" defaultRedirect={redirect} />
        </Suspense>

        <div className="pt-2 border-t-3 border-black flex flex-wrap justify-between items-center gap-3 text-[11px] font-bold">
          <a href={backHref} className="text-slate-400 hover:text-white underline">
            ← Back to intro
          </a>
          <a
            href={`${SITE_URL}/pricing`}
            className="text-[var(--accent-cyan)] hover:underline inline-flex items-center gap-1"
          >
            <LogIn className="w-3 h-3" />
            View plans
          </a>
        </div>
      </div>
    </div>
  );
}
