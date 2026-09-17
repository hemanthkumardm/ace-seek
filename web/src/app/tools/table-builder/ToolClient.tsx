"use client";

import React, { useState } from "react";
import { Table, ArrowLeft, Copy, Check } from "lucide-react";

export default function TableBuilderPage() {
  const [cols, setCols] = useState(4);
  const [rows, setRows] = useState(3);
  const [copied, setCopied] = useState(false);

  const generateTableMd = () => {
    const header = "| " + Array.from({ length: cols }, (_, i) => `Header ${i + 1}`).join(" | ") + " |";
    const separator = "| " + Array.from({ length: cols }, () => "---").join(" | ") + " |";
    const dataRows = Array.from({ length: rows }, (_, r) =>
      "| " + Array.from({ length: cols }, (_, c) => `Data R${r + 1}C${c + 1}`).join(" | ") + " |"
    ).join("\n");

    return `${header}\n${separator}\n${dataRows}`;
  };

  const tableMd = generateTableMd();

  const handleCopy = () => {
    navigator.clipboard.writeText(tableMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="m-shell py-8 md:py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--brutal-orange)] border-2 border-black flex items-center justify-center text-black">
            <Table className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--brutal-orange)] font-black uppercase">
              TOOLS.ACE-SEEK.COM / TABLE-BUILDER
            </span>
            <h1 className="text-xl font-black uppercase text-white">Wide Table Geometry Builder</h1>
          </div>
        </div>
        <a href="/tools" className="brutal-btn !text-xs font-black">
          <ArrowLeft className="w-4 h-4" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="brutal-panel p-6 space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <span className="text-xs font-black uppercase text-white border-b-2 border-black pb-2 block">Table Dimensions Control</span>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300">Columns: {cols}</label>
            <input
              type="range"
              min={2}
              max={10}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--brutal-yellow)]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300">Rows: {rows}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-full cursor-pointer accent-[var(--brutal-yellow)]"
            />
          </div>
        </div>

        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-[var(--brutal-orange)]">Markdown Table Code</span>
            <button type="button" onClick={handleCopy} className="brutal-btn brutal-btn-yellow !text-xs !py-1 !px-3 font-black">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Table Markdown"}</span>
            </button>
          </div>
          <pre className="brutal-lcd p-4 text-xs overflow-x-auto whitespace-pre">{tableMd}</pre>
        </div>
      </div>
    </div>
  );
}
