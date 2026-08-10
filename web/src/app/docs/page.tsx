import type { Metadata } from "next";
import { SiteFooter, SiteHeader } from "@/components/SiteHeader";
import { PRODUCTS, productHref } from "@/lib/site";
import {
  FileText,
  Terminal,
  Cpu,
  Layers,
  ChevronRight,
  Code,
  Boxes,
  ExternalLink,
  BookOpen,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation",
  description: "Ace-Seek product guides, CLI reference, and architecture overview.",
};

export default function DocsPage() {
  return (
    <div className="min-h-full flex flex-col">
      <SiteHeader active="docs" />

      <main className="flex-1 m-shell py-12 md:py-16 space-y-12">
        {/* Header Panel */}
        <div className="sk-panel p-8 space-y-4">
          <div className="flex items-center gap-2">
            <div className="sk-icon-well">
              <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Central Documentation
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-black tracking-tight">
            Technical Manuals & CLI Reference
          </h1>

          <p className="text-xs md:text-sm text-[var(--muted)] max-w-xl leading-relaxed">
            Centralized documentation center for the Ace-Seek hardware toolchain, CLI flags, engine settings, and subdomains architecture.
          </p>
        </div>

        {/* Quick Nav Cards */}
        <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
          <a href="/docs#architecture" className="sk-panel sk-panel-interactive p-6 space-y-2 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent-cyan)]" />
                <h2 className="text-sm font-bold">System Architecture</h2>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Apex domain vs product subdomains, session flow, and entitlement propagation.
            </p>
          </a>

          <a href="/docs#cli" className="sk-panel sk-panel-interactive p-6 space-y-2 block">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--accent-cyan)]" />
                <h2 className="text-sm font-bold">CLI Utility (`aic`)</h2>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--muted)]" />
            </div>
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Docker options, LuaLaTeX engine overrides, and wide STA table flags.
            </p>
          </a>
        </div>

        {/* Architecture Section */}
        <section id="architecture" className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold tracking-tight">Architecture Routing</h2>
          </div>

          <div className="sk-recessed p-5 font-mono text-xs leading-relaxed space-y-2 text-[var(--muted)]">
            <p className="text-[var(--foreground)] font-bold border-b border-[var(--bevel-shadow)] pb-2">
              APEX & SUBDOMAIN MAP:
            </p>
            <p className="flex items-center justify-between">
              <span>ace-seek.com</span>
              <span className="text-[var(--accent-cyan)]">Marketing · Auth · Billing · Launchpad</span>
            </p>
            <p className="flex items-center justify-between">
              <span>doc.ace-seek.com</span>
              <span className="text-[var(--accent-cyan)]">Doc Compiler</span>
            </p>
            <p className="flex items-center justify-between">
              <span>timing.ace-seek.com</span>
              <span className="text-[var(--accent-cyan)]">SDC / Clock Uncertainty Calculator</span>
            </p>
            <p className="flex items-center justify-between">
              <span>scripts.ace-seek.com</span>
              <span className="text-[var(--accent-cyan)]">Tcl Automation Snippets</span>
            </p>
          </div>
        </section>

        {/* CLI Section */}
        <section id="cli" className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold tracking-tight">CLI Quick Start</h2>
          </div>

          <div className="sk-lcd">
            <pre className="text-xs overflow-x-auto leading-relaxed">{`# Compile Markdown file using Docker engine
./bin/aic --docker notes.md

# Compile with wide SDC timing table geometry
./bin/aic --docker --wide notes.md out.pdf

# Engine override for extensive LaTeX docs
./bin/aic --docker --engine=lualatex notes.md`}</pre>
          </div>
        </section>

        {/* Products List */}
        <section className="max-w-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
            <h2 className="text-lg font-bold tracking-tight">Tool Catalog Overview</h2>
          </div>

          <ul className="space-y-3">
            {PRODUCTS.map((p) => (
              <li key={p.id} className="sk-panel p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="sk-icon-well w-7 h-7">
                    <Cpu className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  </div>
                  <div>
                    <span className="font-bold text-[var(--foreground)]">{p.name}</span>
                    <span className="font-mono text-[var(--accent-cyan)] ml-2">({p.host})</span>
                  </div>
                </div>
                <span className="text-[var(--muted)]">{p.blurb}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
