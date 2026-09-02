import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import {
  Boxes,
  FileText,
  GitCompare,
  RefreshCw,
  Key,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Tools Suite · tools.ace-seek.com",
  description:
    "Developer tools suite — Doc Compiler (PDF/TeX/DOCX), Diff, converters, TeX builder.",
};

import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";
import { ToolsHeaderNav } from "@/components/ToolsHeaderNav";

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const host = (await headers()).get("host");
  const homeHref = platformHomeHref("tools", host);
  const loginHref = platformLoginHref("tools", host);
  const signupHref = mainSignupHref();

  return (
    <div
      data-tools-shell
      className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-[var(--bg-main)] text-[var(--foreground)] font-mono"
    >
      <ToolsHeaderNav
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
