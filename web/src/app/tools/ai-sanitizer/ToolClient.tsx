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
    <div className="m-shell py-8 md:py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--brutal-lime)] border-2 border-black flex items-center justify-center text-black">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--brutal-lime)] font-black uppercase">
              TOOLS.ACE-SEEK.COM / AI-SANITIZER
            </span>
            <h1 className="text-xl font-black uppercase text-white">AI Output Sanitizer & Token Saver</h1>
          </div>
        </div>
        <a href="/tools" className="brutal-btn !text-xs font-black">
          <ArrowLeft className="w-4 h-4" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <span className="text-xs font-black uppercase text-white border-b-2 border-black pb-2 block">Raw LLM Output (ChatGPT / Claude / Gemini)</span>
          <textarea
            value={rawAiText}
            onChange={(e) => setRawAiText(e.target.value)}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed"
            placeholder="Paste raw AI response with conversational fluff..."
          />
          <button type="button" onClick={handleSanitize} className="brutal-btn brutal-btn-lime !text-xs w-full justify-center font-black">
            <Sparkles className="w-4 h-4" />
            <span>Sanitize AI Output</span>
          </button>
        </div>

        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-[var(--brutal-lime)]">Cleaned Markdown Result</span>
            <button type="button" onClick={handleCopy} className="brutal-btn brutal-btn-yellow !text-xs !py-1 !px-2 font-black">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Result"}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={sanitizedText || rawAiText}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed bg-black text-[var(--brutal-lime)] font-mono"
          />
        </div>
      </div>
    </div>
  );
}
