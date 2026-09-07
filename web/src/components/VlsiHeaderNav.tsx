"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Cpu,
  Activity,
  Layers,
  Zap,
  FolderOpen,
  ArrowRight,
  Home,
  GraduationCap,
  Code2,
  BookOpen,
  PlayCircle,
  ClipboardCheck,
  Sparkles,
  LogIn,
} from "lucide-react";
import { LEARN_KIND_META } from "@/lib/vlsi-curriculum";
import { useEntitlements } from "@/hooks/useEntitlements";
import { PlanPill } from "@/components/FeatureLock";
import { isClerkConfiguredClient } from "@/lib/clerk-config-client";

type Props = {
  homeHref: string;
  loginHref: string;
  signupHref: string;
  mainSiteUrl: string;
};

function AuthCluster({
  loginHref,
  signupHref,
  homeHref,
  redirectPath,
}: {
  loginHref: string;
  signupHref: string;
  homeHref: string;
  redirectPath: string;
}) {
  const { isSignedIn, ready, ent } = useEntitlements();
  const clerkOn = isClerkConfiguredClient();

  return (
    <div className="flex items-center gap-2 shrink-0">
      {ready && <PlanPill tier={ent.tier} ready={ready} />}
      {isSignedIn && clerkOn ? (
        <UserButton />
      ) : (
        <>
          <Link
            href={`${loginHref}?redirect=${encodeURIComponent(redirectPath)}`}
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
    </div>
  );
}

export function VlsiHeaderNav({
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useEntitlements();

  const isIntroPage = pathname === "/" || pathname === "/vlsi";
  const isLearnPage = pathname.startsWith("/vlsi/learn");
  const learnKind = searchParams.get("kind");

  const openStudio = () => {
    if (isSignedIn) {
      router.push("/vlsi/reports");
      return;
    }
    router.push(
      `${loginHref}?redirect=${encodeURIComponent("/vlsi/reports")}`
    );
  };

  const studioTab = (
    href: string,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
    activeClass: string,
    idleIconClass: string
  ) => {
    const active = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        href={href}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
          active ? activeClass : "neu-btn text-slate-800"
        }`}
      >
        <Icon className={`w-3.5 h-3.5 ${active ? "" : idleIconClass}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <header
      className={`sticky top-0 z-40 ${
        isIntroPage
          ? "bg-[var(--surface-recessed)] border-b border-[var(--bevel-shadow)] text-[var(--foreground)] shadow-md"
          : "bg-[#e6ecf5] border-b border-slate-300/90 shadow-sm text-slate-900"
      }`}
    >
      <div className="flex items-center justify-between px-3 md:px-6 py-2.5 gap-2">
        {isIntroPage ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={homeHref}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 hover:bg-[var(--accent-cyan)]/20 transition-all font-black text-xs"
              >
                <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" />
                <span className="text-xs font-black tracking-wider uppercase text-white">
                  VLSI Cloud
                </span>
              </Link>
              <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Engineering Cloud</span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <Link
                href="/vlsi/learn"
                className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1.5 uppercase"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Learn</span>
              </Link>
              <Link
                href="/vlsi/interview-masterclass"
                className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1.5 uppercase border border-amber-500/40 text-amber-200"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="hidden md:inline">Interview</span>
              </Link>
              <button
                type="button"
                onClick={openStudio}
                className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1.5 uppercase"
              >
                <Cpu className="w-4 h-4" />
                <span className="hidden sm:inline">Open Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <AuthCluster
                loginHref={loginHref}
                signupHref={signupHref}
                homeHref={homeHref}
                redirectPath="/vlsi"
              />
            </div>
          </div>
        ) : isLearnPage ? (
          <div className="flex items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href={homeHref}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-sm hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5 text-xs"
              >
                <Home className="w-4 h-4" />
                <span className="font-black hidden sm:inline">VLSI</span>
              </Link>
              <Link
                href="/vlsi/learn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all text-xs ${
                  pathname === "/vlsi/learn" && !learnKind
                    ? "bg-purple-600 text-white shadow-sm"
                    : "neu-btn text-slate-800 font-bold"
                }`}
              >
                <GraduationCap className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Curriculum</span>
                <span className="sm:hidden">Learn</span>
              </Link>
            </div>

            <nav className="hidden md:flex items-center gap-1.5 text-xs">
              {(
                [
                  ["theory", BookOpen],
                  ["video", PlayCircle],
                  ["practical", Code2],
                  ["quiz", ClipboardCheck],
                  ["test", ClipboardCheck],
                ] as const
              ).map(([kind, Icon]) => (
                <Link
                  key={kind}
                  href={`/vlsi/learn?kind=${kind}`}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/learn" && learnKind === kind
                      ? "bg-slate-900 text-white shadow-sm font-black"
                      : "neu-btn text-slate-700"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-sky-600" />
                  <span>{LEARN_KIND_META[kind].hubLabel}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openStudio}
                className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 uppercase shrink-0"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Studio</span>
              </button>
              <AuthCluster
                loginHref={loginHref}
                signupHref={signupHref}
                homeHref={homeHref}
                redirectPath={pathname || "/vlsi/learn"}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <nav className="flex items-center gap-1.5 md:gap-2 text-xs flex-wrap min-w-0">
              <Link
                href={homeHref}
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-sm hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5"
              >
                <Home className="w-4 h-4" />
                <span className="text-xs font-black hidden sm:inline">VLSI</span>
              </Link>
              <Link
                href="/vlsi/learn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                  pathname.startsWith("/vlsi/learn")
                    ? "bg-purple-600 !text-white font-black shadow-sm border border-purple-700"
                    : "neu-btn text-purple-700"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Learn Hub</span>
                <span className="sm:hidden">Learn</span>
              </Link>
              {studioTab("/vlsi/rtl-lab", "RTL Lab", Code2, "bg-emerald-500 !text-slate-950 font-black shadow-sm border border-emerald-600", "text-emerald-600")}
              {studioTab("/vlsi/reports", "Reports", FolderOpen, "bg-blue-600 !text-white font-black shadow-sm border border-blue-700", "text-blue-600")}
              {studioTab("/vlsi/sdc-studio", "SDC", Cpu, "bg-cyan-500 !text-slate-950 font-black shadow-sm border border-cyan-600", "text-cyan-600")}
              {studioTab("/vlsi/timing-studio", "Timing", Activity, "bg-amber-400 !text-slate-950 font-black shadow-sm border border-amber-500", "text-amber-600")}
              {studioTab("/vlsi/mmmc-studio", "MMMC", Layers, "bg-indigo-600 !text-white font-black shadow-sm border border-indigo-700", "text-indigo-600")}
              {studioTab("/vlsi/power-studio", "Power", Zap, "bg-rose-500 !text-white font-black shadow-sm border border-rose-600", "text-rose-600")}
            </nav>
            <AuthCluster
              loginHref={loginHref}
              signupHref={signupHref}
              homeHref={homeHref}
              redirectPath={pathname || "/vlsi"}
            />
          </div>
        )}
      </div>
    </header>
  );
}
