"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Boxes,
  FolderOpen,
  FileCode2,
  Play,
  ArrowRight,
  Home,
  ExternalLink,
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

export const OPENROAD_STUDIOS = [
  {
    href: "/openroad/project",
    label: "Project",
    match: ["/openroad/project"],
    Icon: FolderOpen,
  },
  {
    href: "/openroad/design",
    label: "Design",
    match: ["/openroad/design"],
    Icon: FileCode2,
  },
  {
    href: "/openroad/studio",
    label: "PnR Studio",
    match: ["/openroad/studio", "/openroad/run"],
    Icon: Play,
  },
  {
    href: "/openroad/scripts",
    label: "Scripts",
    match: ["/openroad/scripts"],
    Icon: FileCode2,
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
  const { isSignedIn, ready, ent } = useEntitlements();
  const clerkOn = isClerkConfiguredClient();

  const isIntroPage =
    pathname === "/" || pathname === "/openroad" || pathname === "/openroad/";

  const openStudio = (path = "/openroad/project") => {
    if (isSignedIn) {
      router.push(path);
      return;
    }
    router.push(`${loginHref}?redirect=${encodeURIComponent(path)}`);
  };

  return (
    <header className="shrink-0 z-30 bg-[var(--neu-bg)] border-b border-white/50 shadow-[0_4px_12px_rgba(192,200,214,0.35)]">
      <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
        {isIntroPage ? (
          <>
            <Link
              href={homeHref}
              className="neu-panel-sm flex items-center gap-2 px-3 py-1.5 font-black text-[var(--neu-text)] hover:opacity-90 transition-opacity shrink-0"
            >
              <Boxes className="w-4 h-4 text-sky-600" />
              <span className="text-xs tracking-tight hidden sm:inline">
                OPENROAD.ACE-SEEK
              </span>
              <span className="text-xs tracking-tight sm:hidden">OR</span>
            </Link>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openStudio("/openroad/project")}
                className="neu-btn neu-btn-primary !text-xs !py-2 !px-3 font-black uppercase flex items-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Project</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {ready && <PlanPill tier={ent.tier} ready={ready} />}
              {isSignedIn && clerkOn ? (
                <UserButton />
              ) : (
                <>
                  <Link
                    href={loginHref}
                    className="neu-btn !text-xs !py-2 !px-3 font-black inline-flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in
                  </Link>
                  <a
                    href={signupHref}
                    className="neu-btn neu-btn-primary !text-xs !py-2 !px-3 font-black"
                  >
                    Sign up
                  </a>
                </>
              )}
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
              <Link
                href={homeHref}
                className="neu-panel-sm flex items-center gap-1.5 px-2.5 py-1.5 font-black text-[10px] uppercase shrink-0 text-sky-700"
              >
                <Home className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">OpenROAD</span>
              </Link>
              {OPENROAD_STUDIOS.map((s) => {
                const active = s.match.some(
                  (m) => pathname === m || pathname.startsWith(m + "/")
                );
                const Icon = s.Icon;
                return (
                  <button
                    key={s.href}
                    type="button"
                    onClick={() => openStudio(s.href)}
                    className={`shrink-0 px-2.5 py-1.5 text-[11px] font-black uppercase rounded-xl transition-all flex items-center gap-1 ${
                      active
                        ? "neu-btn-active text-sky-700"
                        : "neu-btn text-[var(--neu-text)]"
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              {ready && <PlanPill tier={ent.tier} ready={ready} />}
              {isSignedIn && clerkOn ? (
                <UserButton />
              ) : (
                <Link
                  href={`${loginHref}?redirect=${encodeURIComponent(pathname || "/openroad")}`}
                  className="neu-btn !text-[10px] font-bold uppercase !px-2.5 !py-1.5 inline-flex items-center gap-1.5"
                >
                  <LogIn className="w-3 h-3" />
                  Sign in
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
