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

  if (isLearn) {
    return (
      <div className="h-dvh max-h-dvh flex flex-col overflow-hidden">
        <main className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
          <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
        </main>
      </div>
    );
  }

  return (
    <div
      data-vlsi-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-slate-100 font-mono"
    >
      <Suspense
        fallback={
          <header className="shrink-0 border-b-4 border-black bg-white h-14 md:h-16" />
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
