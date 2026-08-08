import type { Metadata } from "next";
import { headers } from "next/headers";
import { productHostSlug, SITE_URL } from "@/lib/site";
import { Cpu, ChevronRight, LayoutDashboard, FileText, Clock, Boxes, Key, GitCompare, RefreshCw, Sparkles, Binary, Table } from "lucide-react";

export const metadata: Metadata = {
  title: "Tools Suite · tools.ace-seek.com",
  description: "General developer and utility tools suite — AI MD to PDF, Diff Comparator, Format Converters, TeX Formula Builder.",
};

export default async function ToolsLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);
  const onProductHost = Boolean(slug && slug !== "www");

  return (
    <div className="min-h-full flex flex-col bg-[var(--surface-panel)]">
      {/* Platform Header */}
      <header className="border-b border-[var(--bevel-shadow)] shrink-0 bg-[var(--surface-panel)]/95 backdrop-blur-md sticky top-0 z-30 shadow-md">
        <div className="m-shell flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={SITE_URL}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[var(--surface-raised)] to-[var(--surface-recessed)] border border-[var(--bevel-highlight)] shadow-sm hover:brightness-110 transition-all shrink-0"
            >
              <div className="sk-icon-well w-6 h-6 rounded">
                <Boxes className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight text-[var(--foreground)]">
                  tools.ace-seek.com
                </span>
                <span className="text-[9px] font-mono text-[var(--muted)] -mt-0.5 tracking-wide uppercase">
                  Developer Tools Suite
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Bar Tool Workstations */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-[var(--surface-recessed)] border border-[var(--bevel-shadow)] text-xs">
            <a
              href="/tools/md-to-pdf"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <FileText className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>MD → PDF</span>
            </a>
            <a
              href="/tools/diff-comparator"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <GitCompare className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Diff</span>
            </a>
            <a
              href="/tools/format-converter"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>Converter</span>
            </a>
            <a
              href="/tools/tex-formatter"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[var(--surface-raised)] text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
              <span>TeX Builder</span>
            </a>
          </nav>

          {/* Account Actions */}
          <div className="flex items-center gap-2">
            <a
              href="https://ace-seek.com/signup"
              className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3"
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
