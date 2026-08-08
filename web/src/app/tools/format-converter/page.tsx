"use client";

import React, { useState } from "react";
import { RefreshCw, ArrowLeft, Copy, Check } from "lucide-react";

export default function FormatConverterPage() {
  const [inputVal, setInputVal] = useState('{\n  "title": "Ace-Seek Suite",\n  "status": "active",\n  "version": 2.6\n}');
  const [conversionType, setConversionType] = useState<"json-yaml" | "base64-encode" | "base64-decode">("json-yaml");
  const [outputVal, setOutputVal] = useState("title: Ace-Seek Suite\nstatus: active\nversion: 2.6");
  const [copied, setCopied] = useState(false);

  const handleConvert = () => {
    try {
      if (conversionType === "json-yaml") {
        const obj = JSON.parse(inputVal);
        const yamlStr = Object.entries(obj)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n");
        setOutputVal(yamlStr);
      } else if (conversionType === "base64-encode") {
        setOutputVal(btoa(inputVal));
      } else if (conversionType === "base64-decode") {
        setOutputVal(atob(inputVal));
      }
    } catch {
      setOutputVal("ERR: Format Conversion Error. Please check input syntax.");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(outputVal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="m-shell py-8 md:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
        <div className="flex items-center gap-3">
          <div className="sk-icon-well">
            <RefreshCw className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold">
              TOOLS.ACE-SEEK.COM / FORMAT-CONVERTER
            </span>
            <h1 className="text-xl font-bold">Multi-Format Data & Syntax Converter Suite</h1>
          </div>
        </div>
        <a href="/tools" className="sk-btn sk-btn-ghost !text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tools Catalog</span>
        </a>
      </div>

      {/* Converter Control Bar */}
      <div className="sk-panel p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-bold uppercase text-[var(--muted)]">Conversion Mode:</span>
          <select
            value={conversionType}
            onChange={(e) => setConversionType(e.target.value as any)}
            className="sk-input text-xs"
          >
            <option value="json-yaml">JSON → YAML</option>
            <option value="base64-encode">Base64 Encode</option>
            <option value="base64-decode">Base64 Decode</option>
          </select>
        </div>

        <button type="button" onClick={handleConvert} className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-5">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Convert Now</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Field */}
        <div className="sk-panel p-6 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] block border-b border-[var(--bevel-shadow)] pb-2">Input Source Data</span>
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed"
            placeholder="Paste source data..."
          />
        </div>

        {/* Output Field */}
        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Converted Result</span>
            <button type="button" onClick={handleCopy} className="sk-btn sk-btn-ghost !text-xs !py-1 !px-2">
              {copied ? <Check className="w-3 h-3 text-[#10b981]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={outputVal}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed bg-[var(--surface-recessed)]"
          />
        </div>
      </div>
    </div>
  );
}
