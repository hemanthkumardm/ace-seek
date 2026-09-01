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

  // Keep data-vlsi-shell on Learn too so OS light mode cannot leak onto
  // html/body and wash out the studio when navigating back to /vlsi.
  if (isLearn) {
    return (
      <div
        data-vlsi-shell
        className="h-dvh max-h-dvh flex flex-col overflow-hidden"
        style={{ background: "var(--bg-main)", color: "var(--foreground)" }}
      >
        <main className="relative flex-1 min-h-0 overflow-hidden flex flex-col">
          <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
        </main>
      </div>
    );
  }

  return (
    <div
      data-vlsi-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden font-mono"
      style={{ background: "var(--bg-main)", color: "var(--foreground)" }}
    >
      <Suspense
        fallback={
          <header className="shrink-0 border-b-4 border-black h-14 md:h-16 bg-[var(--surface-raised)]" />
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
