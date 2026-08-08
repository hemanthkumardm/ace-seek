"use client";

import React, { useState } from "react";
import { Binary, ArrowLeft, Copy, Check, Sparkles } from "lucide-react";

export default function AiSanitizerPage() {
  const [rawAiText, setRawAiText] = useState(`Certainly! Here is the response you requested:

\`\`\`markdown
# AI Generated Notes

Inline math $E=mc^2$ and clock period:
$$T_{clk} \\ge t_{cq} + t_{pd}$$

\`\`\`
Hope this helps! Let me know if you need anything else.`);

  const [sanitizedText, setSanitizedText] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSanitize = () => {
    // Strips AI intro/outro conversational fluff & cleans markdown code blocks
    let cleaned = rawAiText.replace(/^(Certainly!|Here is|Sure,|Hope this helps!|Let me know).*/gim, "");
    cleaned = cleaned.replace(/```markdown\n/g, "").replace(/```$/g, "");
    cleaned = cleaned.trim();
    setSanitizedText(cleaned);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(sanitizedText || rawAiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="m-shell py-8 md:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
        <div className="flex items-center gap-3">
          <div className="sk-icon-well">
            <Binary className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold">
              TOOLS.ACE-SEEK.COM / AI-SANITIZER
            </span>
            <h1 className="text-xl font-bold">AI Output Sanitizer & Token Saver</h1>
          </div>
        </div>
        <a href="/tools" className="sk-btn sk-btn-ghost !text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="sk-panel p-6 space-y-3">
          <span className="text-xs font-bold uppercase text-[var(--muted)] border-b border-[var(--bevel-shadow)] pb-2 block">Raw LLM Output (ChatGPT / Claude / Gemini)</span>
          <textarea
            value={rawAiText}
            onChange={(e) => setRawAiText(e.target.value)}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed"
            placeholder="Paste raw AI response with conversational fluff..."
          />
          <button type="button" onClick={handleSanitize} className="sk-btn sk-btn-primary !text-xs w-full justify-center">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sanitize AI Output</span>
          </button>
        </div>

        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-2">
            <span className="text-xs font-bold uppercase text-[var(--accent-cyan)]">Cleaned Markdown Result</span>
            <button type="button" onClick={handleCopy} className="sk-btn sk-btn-ghost !text-xs !py-1 !px-2">
              {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy Result"}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={sanitizedText || rawAiText}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed bg-[var(--surface-recessed)]"
          />
        </div>
      </div>
    </div>
  );
}
