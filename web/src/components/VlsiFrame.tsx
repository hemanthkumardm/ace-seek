"use client";

import React, { Suspense } from "react";
import { usePathname } from "next/navigation";
import { VlsiHeaderNav } from "@/components/VlsiHeaderNav";
import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";

type Props = {
  children: React.ReactNode;
  homeHref: string;
  loginHref: string;
  signupHref: string;
  mainSiteUrl: string;
};

export function VlsiFrame({
  children,
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const isLearn = pathname.startsWith("/vlsi/learn");
  const isIntro = pathname === "/" || pathname === "/vlsi";

  // Learn Portal: uses its own LearnShell reader theme
  if (isLearn) {
    return (
      <div
        data-vlsi-shell
        className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-[#0c0f14] text-[#f1f5f9]"
      >
        <main className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
          <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
        </main>
      </div>
    );
  }

  // Intro / Marketing Landing Page: Dark Carbon Neo-Brutalism
  if (isIntro) {
    return (
      <div
        data-vlsi-shell
        className="min-h-screen flex flex-col overflow-x-hidden font-mono bg-[#0c0f14] text-[#f1f5f9]"
      >
        <Suspense
          fallback={
            <header className="shrink-0 border-b border-black h-14 bg-[#161b24]" />
          }
        >
          <VlsiHeaderNav
            homeHref={homeHref}
            loginHref={loginHref}
            signupHref={signupHref}
            mainSiteUrl={mainSiteUrl}
          />
        </Suspense>
        <main className="relative flex-1 overflow-y-auto overflow-x-hidden flex flex-col">
          <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
        </main>
      </div>
    );
  }

  // Workstation Studios (SDC, Timing, MMMC, Power, Reports, RTL Lab): Light Neumorphic
  return (
    <div
      data-vlsi-studio
      className="h-dvh max-h-dvh flex flex-col overflow-hidden font-mono bg-[#e6ecf5] text-slate-900"
    >
      <Suspense
        fallback={
          <header className="shrink-0 border-b border-slate-300 h-14 bg-[#e6ecf5]" />
        }
      >
        <VlsiHeaderNav
          homeHref={homeHref}
          loginHref={loginHref}
          signupHref={signupHref}
          mainSiteUrl={mainSiteUrl}
        />
      </Suspense>
      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
      </main>
    </div>
  );
}
