import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  mainSignupHref,
  platformHomeHref,
  platformLoginHref,
  SITE_URL,
} from "@/lib/site";
import { WorkstationAuthGuard } from "@/components/WorkstationAuthGuard";
import { ToolsHeaderNav } from "@/components/ToolsHeaderNav";

export const metadata: Metadata = {
  title: "Engineering Developer Tools & Workstation Suite · tools.ace-seek.com",
  description:
    "Zero-token engineering developer suite: Doc Compiler (MD ↔ PDF ↔ TeX ↔ DOCX), Visual Diff Comparator, AI Output Sanitizer, LaTeX Formula Builder, and Multi-Format Converters.",
  keywords: [
    "Doc Compiler Markdown PDF TeX",
    "Visual Diff Comparator",
    "AI Output Sanitizer",
    "LaTeX Formula Builder KaTeX",
    "Wide Table Geometry Builder",
    "JSON YAML TOML CSV Converter",
    "Zero Token LLM Tooling",
  ],
  openGraph: {
    title: "Engineering Developer Tools & Workstation Suite · Ace-Seek",
    description:
      "Compile engineering documentation, compare code diffs, clean raw LLM responses, and format TeX math equations with zero AI token cost.",
    url: "https://tools.ace-seek.com",
    siteName: "Ace-Seek Tools Platform",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Engineering Developer Tools & Workstation Suite · Ace-Seek",
    description:
      "Publication-grade document compilers, visual diff tools, AI output sanitizers, and format converters.",
  },
};

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
