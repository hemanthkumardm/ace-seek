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
      {/* Hero Section - Neo-Brutalist High Contrast Container */}
      <div className="brutal-panel p-8 md:p-12 space-y-6 !border-4 !border-black !shadow-[8px_8px_0_#000000] bg-[var(--surface-panel)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-3 border-black text-xs">
          <div className="flex items-center gap-2">
            <Boxes className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span className="font-black text-white uppercase tracking-wider">TOOLS.ACE-SEEK.COM</span>
            <span className="text-[var(--brutal-cyan)] font-bold">// NEO-BRUTALISM PLATFORM</span>
          </div>
          <span className="brutal-badge brutal-badge-lime">
            ● 6 WORKSTATIONS ONLINE
          </span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] text-white uppercase">
            ESSENTIAL DEVELOPER TOOLS. <span className="bg-[var(--brutal-yellow)] text-black px-2 py-0.5 border-2 border-black inline-block shadow-[3px_3px_0_#000000]">ZERO LLM TOKEN WASTE.</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-bold">
            Stop spending thousands of AI tokens asking ChatGPT/Claude to render PDFs or style TeX equations. Ace-Seek provides instant, publication-grade compilers, converters, visual diff tools, and LaTeX formula generators.
          </p>
        </div>

        {/* Core Value Highlights - Pop Cards */}
        <div className="grid gap-4 sm:grid-cols-3 pt-2">
          <div className="bg-[var(--brutal-yellow)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-black" /> 0 AI Token Cost
            </p>
            <p className="text-[11px] font-bold leading-snug">Compile & format raw AI Markdown outputs instantly without burning LLM tokens.</p>
          </div>

          <div className="bg-[var(--brutal-cyan)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Native TeX & Math
            </p>
            <p className="text-[11px] font-bold leading-snug">Full LaTeX math ($E=mc^2$), code syntax, and Mermaid SVG diagram support.</p>
          </div>

          <div className="bg-[var(--brutal-lime)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4" /> 1-Click Utilities
            </p>
            <p className="text-[11px] font-bold leading-snug">Visual diff comparator, bi-directional format converters (JSON/YAML/TOML/CSV).</p>
          </div>
        </div>
      </div>

      {/* NEO-BRUTALISM COMPARISON MATRIX TABLE */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-4">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span className="text-xs font-black uppercase tracking-wider text-[var(--brutal-yellow)]">
              Comparison Matrix
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-white">
            Why Use Ace-Seek Tools vs Standard Converters or AI LLMs?
          </h2>
        </div>

        <div className="brutal-panel overflow-x-auto p-0 !border-3 !border-black">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--brutal-yellow)] text-black border-b-3 border-black text-[11px] font-black uppercase">
              <tr>
                <th className="p-4 border-r-3 border-black">Feature / Metric</th>
                <th className="p-4 border-r-3 border-black">Standard MD Converters</th>
                <th className="p-4 border-r-3 border-black">LLM / AI Token Conversion</th>
                <th className="p-4 bg-[var(--brutal-cyan)] text-black font-black">Ace-Seek Tools Platform</th>
              </tr>
            </thead>
            <tbody className="divide-y-3 divide-black font-bold text-[11px] bg-[var(--surface-recessed)] text-white">
              <tr className="border-b-3 border-black">
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">Token Cost per Render</td>
                <td className="p-4 border-r-3 border-black text-slate-300">$0</td>
                <td className="p-4 border-r-3 border-black bg-rose-950/60 text-rose-300 font-black">High LLM Token Cost ($$$)</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">0 LLM Tokens ($0)</td>
              </tr>
              <tr className="border-b-3 border-black">
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">LaTeX Math Engine ($E=mc^2$)</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Render Error / Broken</td>
                <td className="p-4 border-r-3 border-black text-amber-400">⚠️ Inconsistent / Truncated</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">✅ Native TeX & LuaLaTeX</td>
              </tr>
              <tr className="border-b-3 border-black">
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">Unfenced Code Variables ($var)</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Pandoc Math Conflict</td>
                <td className="p-4 border-r-3 border-black text-amber-400">⚠️ Code Truncation</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">✅ Preprocessor Sanitizer</td>
              </tr>
              <tr className="border-b-3 border-black">
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">Mermaid & SVG Diagrams</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Raw Text Output</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Text Only</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">✅ Native SVG Renderer</td>
              </tr>
              <tr className="border-b-3 border-black">
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">Wide Data Tables</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Cut off on A4 Page</td>
                <td className="p-4 border-r-3 border-black text-amber-400">⚠️ Truncated Columns</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">✅ Auto Landscape Geometry</td>
              </tr>
              <tr>
                <td className="p-4 font-black bg-[var(--surface-panel)] border-r-3 border-black">Diff & Format Converters</td>
                <td className="p-4 border-r-3 border-black text-rose-400">❌ Separate Paid Apps</td>
                <td className="p-4 border-r-3 border-black text-amber-400">⚠️ Consumes AI Tokens</td>
                <td className="p-4 bg-emerald-950/80 text-emerald-300 font-black">✅ Built-in 1-Click Utilities</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* COMPLETE GENERAL DEVELOPER TOOL SUITE CATALOG - BRUTALIST CARDS */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Boxes className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span className="text-xs font-black uppercase tracking-wider text-[var(--brutal-yellow)]">
              Workstation Suite
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-white">
            Developer & Utility Tools Catalog
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Tool 1: Doc Compiler */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Doc Compiler</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Round-trip converter: MD ↔ PDF ↔ DOCX ↔ TeX ↔ HTML. From/To dropdowns for any pair.
              </p>
            </div>
            <a href="/tools/doc-compiler" className="brutal-btn brutal-btn-yellow !text-xs w-full justify-between font-black">
              <span>Open Compiler</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 2: Visual Diff Comparator */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-cyan)] border-2 border-black flex items-center justify-center text-black">
                  <GitCompare className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Visual Diff Comparator</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Myers algorithm · split/unified · word/char highlight · collapse · jump · export .diff patch.
              </p>
            </div>
            <a href="/tools/diff-comparator" className="brutal-btn brutal-btn-cyan !text-xs w-full justify-between font-black">
              <span>Open Diff Tool</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 3: Multi-Format Converter */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-pink)] border-2 border-black flex items-center justify-center text-white">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Multi-Format Converter</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                JSON ↔ YAML ↔ TOML ↔ CSV · Base64 · URL · Hex — live convert, detect, copy. Runs in your browser.
              </p>
            </div>
            <a href="/tools/format-converter" className="brutal-btn brutal-btn-pink !text-xs w-full justify-between font-black">
              <span>Open Converter</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 4: AI Output Sanitizer */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-lime)] border-2 border-black flex items-center justify-center text-black">
                  <Binary className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">AI Output Sanitizer</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Clean raw LLM responses, strip system prompt noise, fix broken code block fencing, and format math equations.
              </p>
            </div>
            <a href="/tools/ai-sanitizer" className="brutal-btn brutal-btn-lime !text-xs w-full justify-between font-black">
              <span>Open Sanitizer</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 5: LaTeX Formula Builder */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-purple)] border-2 border-black flex items-center justify-center text-black">
                  <Sparkles className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">LaTeX Formula Builder</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Live KaTeX preview · STA templates · symbol chips · clean unicode · copy $$ for Markdown.
              </p>
            </div>
            <a href="/tools/tex-formatter" className="brutal-btn brutal-btn-yellow !text-xs w-full justify-between font-black">
              <span>Open TeX Builder</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 6: Wide Table Geometry Builder */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-orange)] border-2 border-black flex items-center justify-center text-black">
                  <Table className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Wide Table Builder</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Auto-fit wide data and timing tables for landscape PDF compilation without truncated columns.
              </p>
            </div>
            <a href="/tools/table-builder" className="brutal-btn brutal-btn-cyan !text-xs w-full justify-between font-black">
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
