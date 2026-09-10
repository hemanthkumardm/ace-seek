import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";
import { OpenroadHeaderNav } from "@/components/OpenroadHeaderNav";
import { OpenroadPlatformGate } from "@/components/OpenroadPlatformGate";

export const metadata: Metadata = {
  title: "Cloud OpenROAD PnR Automation Platform · openroad.ace-seek.com",
  description:
    "Launch cloud-hosted OpenROAD physical design runs, floorplanning, placement, CTS debugging, and routing automation directly in your browser.",
  keywords: [
    "OpenROAD Cloud PnR",
    "Physical Synthesis OpenROAD",
    "Place and Route Cloud Execution",
    "ASIC PnR Automation",
    "Clock Tree Synthesis CTS Debug",
    "OpenSource EDA Cloud",
  ],
  openGraph: {
    title: "Cloud OpenROAD PnR Automation Platform · Ace-Seek",
    description:
      "Run OpenROAD physical design automation, upload handoff packs, and debug floorplan placement and routing in live cloud containers.",
    url: "https://openroad.ace-seek.com",
    siteName: "Ace-Seek OpenROAD Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cloud OpenROAD PnR Automation Platform · Ace-Seek",
    description:
      "Browser-based OpenROAD cloud runner for ASIC floorplanning, placement, CTS, and routing automation.",
  },
};

export default async function OpenroadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host");
  const homeHref = platformHomeHref("openroad", host);
  const loginHref = platformLoginHref("openroad", host);
  const signupHref = mainSignupHref();

  return (
    <div
      data-openroad-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-[var(--neu-bg)] text-[var(--neu-text)] font-mono"
    >
      <OpenroadHeaderNav
        homeHref={homeHref}
        loginHref={loginHref}
        signupHref={signupHref}
        mainSiteUrl={SITE_URL}
      />
      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        <WorkstationAuthGuard>
          <OpenroadPlatformGate>{children}</OpenroadPlatformGate>
        </WorkstationAuthGuard>
      </main>
    </div>
  );
}
