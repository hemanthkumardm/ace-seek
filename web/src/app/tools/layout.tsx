import type { Metadata } from "next";
import { headers } from "next/headers";
import { productHostSlug, SITE_URL } from "@/lib/site";
import { Boxes, FileText, GitCompare, RefreshCw, Sparkles, Binary, Table, Key, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "Tools Suite · tools.ace-seek.com",
  description: "Developer tools suite — Doc Compiler (PDF/TeX/DOCX), Diff, converters, TeX builder.",
};

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);

  return (
    <div data-tools-shell className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-slate-100 font-mono">
      {/* Neo-Brutalist Light Platform Header */}
      <header className="shrink-0 border-b-4 border-black bg-white text-slate-900 z-30 shadow-[0_4px_0_#000000]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={SITE_URL}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--brutal-yellow)] text-black border-3 border-black shadow-[3px_3px_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all shrink-0 font-black"
            >
              <Boxes className="w-4 h-4 text-black shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-black">
                  TOOLS.ACE-SEEK.COM
                </span>
                <span className="text-[9px] font-black uppercase text-black">
                  DEV PLATFORM
                </span>
              </div>
            </a>
          </div>

          {/* High-Visibility Light Navigation Bar Tool Workstations */}
          <nav className="hidden md:flex items-center gap-2 text-xs">
            <a
              href="/tools/doc-compiler"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--brutal-yellow)] text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Doc Compiler</span>
            </a>
            <a
              href="/tools/diff-comparator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--brutal-cyan)] text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>Diff Tool</span>
            </a>
            <a
              href="/tools/format-converter"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--brutal-pink)] text-white border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Converter</span>
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

      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
