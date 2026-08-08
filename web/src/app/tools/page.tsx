import React from "react";
import { headers } from "next/headers";
import {
  Boxes,
  FileText,
  GitCompare,
  RefreshCw,
  Sparkles,
  Table,
  Binary,
  Cpu,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Key,
  ChevronRight,
  Terminal,
  HelpCircle,
} from "lucide-react";

export default async function ToolsHome() {
  return (
    <div className="m-shell py-10 md:py-14 space-y-12">
      {/* Hero Section */}
      <div className="sk-panel p-8 md:p-12 space-y-6 relative overflow-hidden border-[var(--bevel-highlight)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--bevel-shadow)] text-xs font-mono">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="font-bold text-[var(--foreground)]">TOOLS.ACE-SEEK.COM</span>
            <span className="text-[var(--muted)]">// GENERAL DEVELOPER PLATFORM</span>
          </div>
          <span className="sk-badge sk-badge-live">
            <span className="sk-led sk-led-green" /> 6 TOOL WORKSTATIONS LIVE
          </span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
            Essential Developer Tools. Zero LLM Token Waste.
          </h1>
          <p className="text-xs md:text-sm text-[var(--muted)] leading-relaxed">
            Stop spending thousands of AI tokens asking ChatGPT/Claude to render PDFs or style TeX equations. Ace-Seek provides instant, publication-grade compilers, converters, visual diff tools, and LaTeX formula generators.
          </p>
        </div>

        {/* Core Value Highlights */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="sk-recessed p-4 space-y-1">
            <p className="text-xs font-bold text-[var(--accent-cyan)] flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> 0 AI Token Cost
            </p>
            <p className="text-[11px] text-[var(--muted)]">Compile & format raw AI Markdown outputs instantly without burning LLM tokens.</p>
          </div>

          <div className="sk-recessed p-4 space-y-1">
            <p className="text-xs font-bold text-[var(--accent-cyan)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Native TeX & Math
            </p>
            <p className="text-[11px] text-[var(--muted)]">Full LaTeX math ($E=mc^2$), code syntax, and Mermaid SVG diagram support.</p>
          </div>

          <div className="sk-recessed p-4 space-y-1">
            <p className="text-xs font-bold text-[var(--accent-cyan)] flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> 1-Click Utilities
            </p>
            <p className="text-[11px] text-[var(--muted)]">Visual diff comparator, bi-directional format converters (JSON/YAML/TOML/CSV).</p>
          </div>
        </div>
      </div>

      {/* COMPARISON MATRIX (Standard Tools vs LLM Token Conversion vs Ace-Seek) */}
      <div className="space-y-6">
        <div className="border-b border-[var(--bevel-shadow)] pb-4">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Comparison Matrix
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Why Use Ace-Seek Tools vs Standard Converters or AI LLMs?
          </h2>
        </div>

        <div className="sk-panel overflow-x-auto p-0">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-raised)] border-b border-[var(--bevel-shadow)] text-[11px] font-mono text-[var(--muted)]">
              <tr>
                <th className="p-4 font-bold uppercase">Feature / Metric</th>
                <th className="p-4 font-bold uppercase">Standard MD Converters</th>
                <th className="p-4 font-bold uppercase">LLM / AI Token Conversion</th>
                <th className="p-4 font-bold uppercase text-[var(--accent-cyan)]">Ace-Seek Tools Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bevel-shadow)] font-mono text-[11px]">
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">Token Cost per Render</td>
                <td className="p-4 text-[var(--muted)]">$0</td>
                <td className="p-4 text-red-400 font-bold">High LLM Token Cost ($$$)</td>
                <td className="p-4 text-[#10b981] font-bold">0 LLM Tokens ($0)</td>
              </tr>
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">LaTeX Math Engine ($E=mc^2$)</td>
                <td className="p-4 text-red-400">❌ Render Error / Broken</td>
                <td className="p-4 text-amber-400">⚠️ Inconsistent / Truncated</td>
                <td className="p-4 text-[#10b981] font-bold">✅ Native TeX & LuaLaTeX</td>
              </tr>
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">Unfenced Code Variables ($var)</td>
                <td className="p-4 text-red-400">❌ Pandoc Math Conflict</td>
                <td className="p-4 text-amber-400">⚠️ Code Truncation</td>
                <td className="p-4 text-[#10b981] font-bold">✅ Preprocessor Sanitizer</td>
              </tr>
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">Mermaid & SVG Diagrams</td>
                <td className="p-4 text-red-400">❌ Raw Text Output</td>
                <td className="p-4 text-red-400">❌ Text Only</td>
                <td className="p-4 text-[#10b981] font-bold">✅ Native SVG Renderer</td>
              </tr>
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">Wide Data Tables</td>
                <td className="p-4 text-red-400">❌ Cut off on A4 Page</td>
                <td className="p-4 text-amber-400">⚠️ Truncated Columns</td>
                <td className="p-4 text-[#10b981] font-bold">✅ Auto Landscape Geometry</td>
              </tr>
              <tr className="hover:bg-[var(--surface-raised)]/50">
                <td className="p-4 font-bold text-[var(--foreground)]">Diff & Format Converters</td>
                <td className="p-4 text-red-400">❌ Separate Paid Apps</td>
                <td className="p-4 text-amber-400">⚠️ Consumes AI Tokens</td>
                <td className="p-4 text-[#10b981] font-bold">✅ Built-in 1-Click Utilities</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETE GENERAL DEVELOPER TOOL SUITE CATALOG */}
      <div className="space-y-6">
        <div className="border-b border-[var(--bevel-shadow)] pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Tool Suite Workstations
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">
            Developer & Utility Tools Catalog
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tool 1: AI MD to PDF */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <FileText className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">AI Markdown → PDF Compiler</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Compile raw LLM Markdown outputs with TeX math, code blocks, and Mermaid diagrams into publication-grade PDFs.
              </p>
            </div>
            <a href="/tools/md-to-pdf" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open Compiler</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tool 2: Visual Diff Comparator */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <GitCompare className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">Visual Diff Comparator</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Side-by-side text, Markdown, and code comparison tool highlighting additions, deletions, and structural changes.
              </p>
            </div>
            <a href="/tools/diff-comparator" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open Diff Tool</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tool 3: Multi-Format Converter */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <RefreshCw className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">Multi-Format Converter Suite</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Convert JSON ↔ YAML ↔ TOML, CSV ↔ JSON, Markdown ↔ HTML, and Base64 instantly without sending data to servers.
              </p>
            </div>
            <a href="/tools/format-converter" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open Converter</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tool 4: AI Output Sanitizer */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <Binary className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">AI Output Sanitizer & Token Saver</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Clean raw LLM responses, strip system prompt noise, fix broken code block fencing, and format math equations.
              </p>
            </div>
            <a href="/tools/ai-sanitizer" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open Sanitizer</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tool 5: LaTeX Formula Builder */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <Sparkles className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">LaTeX Formula Builder & Formatter</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Visual & text LaTeX math formula generator, equation cleaner, and inline/display math syntax normalizer.
              </p>
            </div>
            <a href="/tools/tex-formatter" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open TeX Builder</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Tool 6: Wide Table Geometry Builder */}
          <div className="sk-panel sk-panel-interactive p-6 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="sk-icon-well">
                  <Table className="w-4 h-4 text-[var(--accent-cyan)]" />
                </div>
                <span className="sk-badge sk-badge-live">
                  <span className="sk-led sk-led-green" /> LIVE WORKSTATION
                </span>
              </div>
              <h3 className="text-base font-bold">Wide Table Geometry Builder</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Auto-fit wide data and timing tables for landscape PDF compilation without truncated columns.
              </p>
            </div>
            <a href="/tools/table-builder" className="sk-btn sk-btn-primary !text-xs w-full justify-between">
              <span>Open Table Builder</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
