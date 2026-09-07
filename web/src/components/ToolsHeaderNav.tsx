"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Boxes,
  FileText,
  GitCompare,
  RefreshCw,
  ArrowRight,
  Home,
  LogIn,
} from "lucide-react";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import { isClerkConfiguredClient } from "@/lib/clerk-config-client";

type Props = {
  homeHref: string;
  loginHref: string;
  signupHref: string;
  mainSiteUrl: string;
};

export function ToolsHeaderNav({
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn, ready, ent } = useEntitlements();
  const clerkOn = isClerkConfiguredClient();
  const isIntroPage = pathname === "/" || pathname === "/tools";

  const openStudio = () => {
    if (isSignedIn) {
      router.push("/tools/doc-compiler");
      return;
    }
    router.push(
      `${loginHref}?redirect=${encodeURIComponent("/tools/doc-compiler")}`
    );
  };

  return (
    <header className="shrink-0 border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] text-[var(--foreground)] z-30 shadow-md">
      <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
        {isIntroPage ? (
          <>
            <Link
              href={homeHref}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 hover:bg-[var(--accent-cyan)]/20 transition-all shrink-0 font-black"
            >
              <Boxes className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-white">
                  TOOLS.ACE-SEEK.COM
                </span>
                <span className="text-[9px] font-bold uppercase text-cyan-400">
                  DEV PLATFORM
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openStudio}
                className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-4 font-black flex items-center gap-1.5 uppercase"
              >
                <Boxes className="w-4 h-4" />
                <span className="hidden sm:inline">Open Tools</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {ready && <PlanPill tier={ent.tier} ready={ready} />}
              {isSignedIn && clerkOn ? (
                <UserButton />
              ) : (
                <>
                  <Link
                    href={loginHref}
                    className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 font-bold text-slate-200 inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                    <span>Sign in</span>
                  </Link>
                  <a
                    href={signupHref}
                    className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold"
                  >
                    Sign up
                  </a>
                </>
              )}
              <a
                href={mainSiteUrl}
                target="_blank"
                rel="noreferrer"
                className="hidden lg:inline-flex text-[11px] font-bold text-slate-400 hover:text-cyan-400 underline underline-offset-2"
              >
                ace-seek.com
              </a>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between w-full gap-3">
            <nav className="flex items-center gap-2 text-xs flex-wrap min-w-0">
              <Link
                href={homeHref}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all shrink-0 font-bold flex items-center gap-1.5 px-2.5"
                title="Return to Tools Intro"
              >
                <Home className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold hidden sm:inline">TOOLS</span>
              </Link>
              {(
                [
                  ["/tools/doc-compiler", FileText, "Doc Compiler"],
                  ["/tools/diff-comparator", GitCompare, "Diff"],
                  ["/tools/format-converter", RefreshCw, "Converter"],
                ] as const
              ).map(([href, Icon, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs ${
                    pathname === href
                      ? "bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-md"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 shrink-0">
              {ready && <PlanPill tier={ent.tier} ready={ready} />}
              {isSignedIn && clerkOn ? (
                <UserButton />
              ) : (
                <Link
                  href={`${loginHref}?redirect=${encodeURIComponent(pathname || "/tools")}`}
                  className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 font-bold text-slate-200 inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
