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
    <div className="m-shell py-8 md:py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--brutal-pink)] border-2 border-black flex items-center justify-center text-white">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--brutal-pink)] font-black uppercase">
              TOOLS.ACE-SEEK.COM / FORMAT-CONVERTER
            </span>
            <h1 className="text-xl font-black uppercase text-white">Multi-Format Data & Syntax Converter Suite</h1>
          </div>
        </div>
        <a href="/tools" className="brutal-btn !text-xs font-black">
          <ArrowLeft className="w-4 h-4" />
          <span>Tools Catalog</span>
        </a>
      </div>

      {/* Converter Control Bar */}
      <div className="brutal-panel p-4 flex flex-wrap items-center justify-between gap-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
        <div className="flex items-center gap-3 text-xs">
          <span className="font-black uppercase text-white">Conversion Mode:</span>
          <select
            value={conversionType}
            onChange={(e) => setConversionType(e.target.value as any)}
            className="brutal-input text-xs"
          >
            <option value="json-yaml">JSON → YAML</option>
            <option value="base64-encode">Base64 Encode</option>
            <option value="base64-decode">Base64 Decode</option>
          </select>
        </div>

        <button type="button" onClick={handleConvert} className="brutal-btn brutal-btn-pink !text-xs !py-1.5 !px-5 font-black">
          <RefreshCw className="w-4 h-4" />
          <span>Convert Now</span>
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Field */}
        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <span className="text-xs font-black uppercase text-white border-b-2 border-black pb-2 block">Input Source Data</span>
          <textarea
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed"
            placeholder="Paste source data..."
          />
        </div>

        {/* Output Field */}
        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-[var(--brutal-pink)]">Converted Result</span>
            <button type="button" onClick={handleCopy} className="brutal-btn brutal-btn-yellow !text-xs !py-1 !px-2 font-black">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
          <textarea
            readOnly
            value={outputVal}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed bg-black text-[var(--brutal-lime)] font-mono"
          />
        </div>
      </div>
    </div>
  );
}
