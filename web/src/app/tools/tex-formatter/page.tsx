"use client";

import React, { useState } from "react";
import { Sparkles, Copy, Check, ArrowLeft } from "lucide-react";

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
    <div className="m-shell py-8 md:py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--brutal-yellow)] font-black uppercase">
              TOOLS.ACE-SEEK.COM / TEX-BUILDER
            </span>
            <h1 className="text-xl font-black uppercase text-white">LaTeX Formula Builder & Math Formatter</h1>
          </div>
        </div>
        <a href="/tools" className="brutal-btn !text-xs font-black">
          <ArrowLeft className="w-4 h-4" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Side: Builder Console */}
        <div className="brutal-panel p-6 space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <span className="text-xs font-black uppercase text-white">
              Equation Input & Templates
            </span>
            <span className="brutal-badge brutal-badge-cyan">TEX ENGINE</span>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-slate-300">Quick Formula Templates:</label>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.name}
                  type="button"
                  onClick={() => setInputTex(tmpl.tex)}
                  className="brutal-btn !text-[11px] !py-1 !px-2 font-bold"
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase text-slate-300">Raw TeX Expression:</label>
            <textarea
              value={inputTex}
              onChange={(e) => setInputTex(e.target.value)}
              className="brutal-input w-full h-32 text-xs p-3"
              placeholder="e.g. E = mc^2"
            />
          </div>

          <div className="flex items-center gap-4 text-xs font-bold text-white">
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
        <div className="brutal-panel p-6 space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <span className="text-xs font-black uppercase text-white">
              Formatted Markdown Result
            </span>
            <button type="button" onClick={handleCopy} className="brutal-btn brutal-btn-yellow !text-xs !py-1 !px-3 font-black">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied!" : "Copy Markdown"}</span>
            </button>
          </div>

          <div className="brutal-lcd min-h-[160px] flex items-center justify-center p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap">{formattedOutput}</pre>
          </div>

          <p className="text-xs text-slate-300 font-bold leading-relaxed">
            Copy and paste this formatted snippet directly into your Markdown files for compilation on Ace-Seek.
          </p>
        </div>
      </div>
    </div>
  );
}
