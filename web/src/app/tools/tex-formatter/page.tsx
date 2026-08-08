"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, Terminal, Play, ArrowLeft } from "lucide-react";

const TEMPLATES = [
  { name: "Einstein Energy", tex: "E = mc^2" },
  { name: "Quadratic Formula", tex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}" },
  { name: "Clock Frequency Math", tex: "T_{clk} \\ge t_{cq} + t_{pd} + t_{su}" },
  { name: "Summation Series", tex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" },
  { name: "Integral Calculus", tex: "\\int_{a}^{b} f(x) \\, dx = F(b) - F(a)" },
];

export default function TexFormatterPage() {
  const [inputTex, setInputTex] = useState("E = mc^2");
  const [isDisplayMode, setIsDisplayMode] = useState(true);
  const [copied, setCopied] = useState(false);

  const formattedOutput = isDisplayMode
    ? `$$\n${inputTex}\n$$`
    : `$${inputTex}$`;

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="m-shell py-8 md:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
        <div className="flex items-center gap-3">
          <div className="sk-icon-well">
            <Sparkles className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold">
              TOOLS.ACE-SEEK.COM / TEX-BUILDER
            </span>
            <h1 className="text-xl font-bold">LaTeX Formula Builder & Math Formatter</h1>
          </div>
        </div>
        <a href="/tools" className="sk-btn sk-btn-ghost !text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Builder Console */}
        <div className="sk-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Equation Input & Templates
            </span>
            <span className="sk-badge">TEX ENGINE</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[var(--muted)]">Quick Formula Templates:</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setInputTex(tmpl.tex)}
                  className="sk-btn sk-btn-ghost !text-[11px] !py-1 !px-2"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase text-[var(--muted)]">Raw TeX Expression:</label>
            <textarea
              value={inputTex}
              onChange={(e) => setInputTex(e.target.value)}
              className="sk-input w-full h-32 font-mono text-xs p-3"
              placeholder="e.g. E = mc^2"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={isDisplayMode}
                onChange={() => setIsDisplayMode(true)}
              />
              <span>Display Block ($$...$$)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={!isDisplayMode}
                onChange={() => setIsDisplayMode(false)}
              />
              <span>Inline ($...$)</span>
            </label>
          </div>
        </div>

        {/* Right Side: Output Preview & Copy */}
        <div className="sk-panel p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Formatted Markdown Result
            </span>
            <button type="button" onClick={handleCopy} className="sk-btn sk-btn-primary !text-xs !py-1 !px-3">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Markdown"}</span>
            </button>
          </div>

          <div className="sk-lcd min-h-[160px] flex items-center justify-center p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">{formattedOutput}</pre>
          </div>

          <p className="text-xs text-[var(--muted)] leading-relaxed">
            Copy and paste this formatted snippet directly into your Markdown files for compilation on Ace-Seek.
          </p>
        </div>
      </div>
    </div>
  );
}
