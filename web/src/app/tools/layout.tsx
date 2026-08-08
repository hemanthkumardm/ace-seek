import type { Metadata } from "next";
import { headers } from "next/headers";
import { productHostSlug, SITE_URL } from "@/lib/site";
import { Boxes, FileText, GitCompare, RefreshCw, Sparkles, Binary, Table, Key } from "lucide-react";

export const metadata: Metadata = {
  title: "Tools Suite · tools.ace-seek.com",
  description: "General developer and utility tools suite — AI MD to PDF, Diff Comparator, Format Converters, TeX Formula Builder.",
};

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);

  return (
    <div className="min-h-full flex flex-col bg-[var(--surface-panel)] font-mono">
      {/* Neo-Brutalist Platform Header */}
      <header className="border-b-4 border-black bg-[var(--surface-panel)] sticky top-0 z-30 shadow-[0_4px_0_#000000]">
        <div className="m-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={SITE_URL}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--brutal-yellow)] text-black border-3 border-black shadow-[3px_3px_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_#000000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000000] transition-all shrink-0"
            >
              <Boxes className="w-4 h-4 text-black shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-black">
                  TOOLS.ACE-SEEK.COM
                </span>
                <span className="text-[9px] font-black uppercase text-black">
                  NEO-BRUTALISM PLATFORM
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Bar Tool Workstations */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 text-xs">
            <a
              href="/tools/md-to-pdf"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-[var(--brutal-cyan)] transition-all font-bold"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>MD → PDF</span>
            </a>
            <a
              href="/tools/diff-comparator"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-[var(--brutal-yellow)] transition-all font-bold"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff</span>
            </a>
            <a
              href="/tools/format-converter"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-[var(--brutal-pink)] hover:text-white transition-all font-bold"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Converter</span>
            </a>
            <a
              href="/tools/tex-formatter"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-[var(--brutal-lime)] transition-all font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>TeX Builder</span>
            </a>
          </nav>

          {/* Account Actions */}
          <div className="flex items-center gap-2">
            <a
              href="https://ace-seek.com/signup"
              className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-3 font-black"
            >
              <span>Get API Key</span>
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
