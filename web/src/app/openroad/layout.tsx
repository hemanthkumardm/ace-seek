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
  title: "OpenROAD PnR · openroad.ace-seek.com",
  description:
    "Upload VLSI OpenROAD-format handoff packs — Pro flow scripts, Max container runs.",
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
