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
    <div className="m-shell py-8 md:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
        <div className="flex items-center gap-3">
          <div className="sk-icon-well">
            <Table className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold">
              TOOLS.ACE-SEEK.COM / TABLE-BUILDER
            </span>
            <h1 className="text-xl font-bold">Wide Table Geometry Builder</h1>
          </div>
        </div>
        <a href="/tools" className="sk-btn sk-btn-ghost !text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="sk-panel p-6 space-y-4">
          <span className="text-xs font-bold uppercase text-[var(--muted)] border-b border-[var(--bevel-shadow)] pb-2 block">Table Dimensions Control</span>

          <div className="space-y-2">
            <label className="text-xs text-[var(--muted)]">Columns: {cols}</label>
            <input
              type="range"
              min={2}
              max={10}
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-[var(--muted)]">Rows: {rows}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rows}
              onChange={(e) => setRows(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-2">
            <span className="text-xs font-bold uppercase text-[var(--accent-cyan)]">Markdown Table Code</span>
            <button type="button" onClick={handleCopy} className="sk-btn sk-btn-primary !text-xs !py-1 !px-3">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Table Markdown"}</span>
            </button>
          </div>
          <pre className="sk-lcd p-4 text-xs overflow-x-auto whitespace-pre">{tableMd}</pre>
        </div>
      </div>
    </div>
  );
}
