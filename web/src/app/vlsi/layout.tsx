import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import { Cpu, Activity, Layers, Zap, FolderOpen, Key, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "VLSI Platform · vlsi.ace-seek.com",
  description:
    "Advanced VLSI tools suite — Reports Hub, SDC, Timing, MMMC, Power (UPF).",
};

import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";
import { VlsiHeaderNav } from "@/components/VlsiHeaderNav";

export default async function VlsiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host");
  const homeHref = platformHomeHref("vlsi", host);
  const loginHref = platformLoginHref("vlsi", host);
  const signupHref = mainSignupHref();

  return (
    <div
      data-vlsi-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-slate-100 font-mono"
    >
      <VlsiHeaderNav
        homeHref={homeHref}
        loginHref={loginHref}
        signupHref={signupHref}
        mainSiteUrl={SITE_URL}
      />

      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <WorkstationAuthGuard>{children}</WorkstationAuthGuard>
      </main>
    </div>
  );
}
