import React from "react";
import {
  Boxes,
  FileText,
  GitCompare,
  RefreshCw,
  Sparkles,
  Table,
  Binary,
  Zap,
  HelpCircle,
  ChevronRight,
  Key,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";

export default async function ToolsHome() {
  return (
    <div className="m-shell py-10 md:py-14 space-y-12 font-mono">
      {/* Hero Section - Sleek Dark Carbon Panel */}
      <div className="sk-panel p-8 md:p-12 space-y-6 border border-[var(--bevel-highlight)] shadow-2xl relative overflow-hidden bg-[var(--surface-panel)]">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--bevel-shadow)] text-xs">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="font-bold text-white uppercase tracking-wider">TOOLS.ACE-SEEK.COM</span>
            <span className="text-[var(--accent-cyan)] font-bold">// DEV WORKSTATION PLATFORM</span>
          </div>
          <span className="sk-badge sk-badge-live">
            ● 6 WORKSTATIONS ONLINE
          </span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1] text-white uppercase">
            ESSENTIAL DEVELOPER TOOLS. <span className="text-[var(--accent-cyan)] bg-cyan-950/40 px-2.5 py-0.5 rounded border border-cyan-500/30 inline-block">ZERO LLM TOKEN WASTE.</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Stop spending thousands of AI tokens asking ChatGPT/Claude to render PDFs or style TeX equations. Ace-Seek provides instant, publication-grade compilers, converters, visual diff tools, and LaTeX formula generators.
          </p>
        </div>

        {/* Core Value Highlights - Pop Cards */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-amber-400">
              <Zap className="w-4 h-4" /> 0 AI Token Cost
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">Compile & format raw AI Markdown outputs instantly without burning LLM tokens.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-cyan-400">
              <Sparkles className="w-4 h-4" /> Native TeX & Math
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">Full LaTeX math ($E=mc^2$), code syntax, and Mermaid SVG diagram support.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 shadow-lg space-y-1.5">
            <p className="text-xs font-bold uppercase flex items-center gap-1.5 text-emerald-400">
              <RefreshCw className="w-4 h-4" /> 1-Click Utilities
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">Visual diff comparator, bi-directional format converters (JSON/YAML/TOML/CSV).</p>
          </div>
        </div>
      </div>

      {/* COMPARISON MATRIX TABLE */}
      <div className="space-y-6">
        <div className="border-b border-[var(--bevel-shadow)] pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <HelpCircle className="w-4 h-4 text-[var(--accent-cyan)]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">
              Comparison Matrix
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
            Why Use Ace-Seek Tools vs Standard Converters or AI LLMs?
          </h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[var(--bevel-highlight)] bg-[var(--surface-panel)] shadow-2xl relative overflow-hidden backdrop-blur-md">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-recessed)] text-slate-300 border-b border-[var(--bevel-shadow)] text-xs uppercase tracking-wider font-mono">
              <tr>
                <th className="p-4 font-bold border-r border-[var(--bevel-shadow)]">Feature / Metric</th>
                <th className="p-4 font-bold border-r border-[var(--bevel-shadow)] text-slate-400">Standard MD Converters</th>
                <th className="p-4 font-bold border-r border-[var(--bevel-shadow)] text-rose-400">LLM / AI Token Conversion</th>
                <th className="p-4 font-bold bg-cyan-950/50 text-[var(--accent-cyan)] border-l border-cyan-500/30">Ace-Seek Tools Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--bevel-shadow)] text-xs bg-[var(--surface-panel)] text-slate-200">
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">Token Cost per Render</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-slate-400">$0</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] bg-rose-950/20 text-rose-300 font-bold">High LLM Token Cost ($$$)</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">0 LLM Tokens ($0)</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">LaTeX Math Engine ($E=mc^2$)</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Render Error / Broken</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-amber-400">⚠️ Inconsistent / Truncated</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">✅ Native TeX & LuaLaTeX</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">Unfenced Code Variables ($var)</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Pandoc Math Conflict</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-amber-400">⚠️ Code Truncation</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">✅ Preprocessor Sanitizer</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">Mermaid & SVG Diagrams</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Raw Text Output</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Text Only</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">✅ Native SVG Renderer</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">Wide Data Tables</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Cut off on A4 Page</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-amber-400">⚠️ Truncated Columns</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">✅ Auto Landscape Geometry</td>
              </tr>
              <tr className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4 font-bold text-white border-r border-[var(--bevel-shadow)] bg-slate-900/40">Diff & Format Converters</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-rose-400">❌ Separate Paid Apps</td>
                <td className="p-4 border-r border-[var(--bevel-shadow)] text-amber-400">⚠️ Consumes AI Tokens</td>
                <td className="p-4 bg-emerald-950/30 text-emerald-400 font-bold border-l border-cyan-500/20">✅ Built-in 1-Click Utilities</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETE GENERAL DEVELOPER TOOL SUITE CATALOG */}
      <div className="space-y-6">
        <div className="border-b border-[var(--bevel-shadow)] pb-4">
          <div className="flex items-center gap-2 mb-1.5">
            <Boxes className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Workstation Suite
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase text-white">
            Developer & Utility Tools Catalog
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tool 1: Doc Compiler */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Doc Compiler</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Round-trip converter: MD ↔ PDF ↔ DOCX ↔ TeX ↔ HTML. Exact-look layout preservation with Pro engine.
              </p>
            </div>
            <a href="/tools/doc-compiler" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open Compiler</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 2: Visual Diff Comparator */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <GitCompare className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Visual Diff Comparator</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Myers algorithm · split/unified · word/char highlight · collapse · jump · export .diff patch.
              </p>
            </div>
            <a href="/tools/diff-comparator" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open Diff Tool</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 3: Multi-Format Converter */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Multi-Format Converter</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                JSON ↔ YAML ↔ TOML ↔ CSV · Base64 · URL · Hex — live convert, detect, copy. Runs in your browser.
              </p>
            </div>
            <a href="/tools/format-converter" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open Converter</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 4: AI Output Sanitizer */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Binary className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">AI Output Sanitizer</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Clean raw LLM responses, strip system prompt noise, fix broken code block fencing, and format math equations.
              </p>
            </div>
            <a href="/tools/ai-sanitizer" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open Sanitizer</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 5: LaTeX Formula Builder */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">LaTeX Formula Builder</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Live KaTeX preview · STA templates · symbol chips · clean unicode · copy $$ for Markdown.
              </p>
            </div>
            <a href="/tools/tex-formatter" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open TeX Builder</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 6: Wide Table Geometry Builder */}
          <div className="sk-panel p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border border-[var(--bevel-highlight)] shadow-xl hover:border-[var(--accent-cyan)] transition-all">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Table className="w-5 h-5" />
                </div>
                <span className="sk-badge sk-badge-live">LIVE</span>
              </div>
              <h3 className="text-base font-bold uppercase text-white">Wide Table Builder</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Auto-fit wide data and timing tables for landscape PDF compilation without truncated columns.
              </p>
            </div>
            <a href="/tools/table-builder" className="sk-btn sk-btn-primary !text-xs w-full justify-between font-bold">
              <span>Open Table Builder</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Subdomain Identity & API Key Section */}
      <div id="identity-section" className="pt-4">
        <SubdomainAuthModal subdomainName="TOOLS" />
      </div>
    </div>
  );
}
