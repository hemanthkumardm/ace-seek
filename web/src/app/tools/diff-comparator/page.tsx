"use client";

import React, { useState } from "react";
import { GitCompare, ArrowLeft, RefreshCw, FileText } from "lucide-react";

export default function DiffComparatorPage() {
  const [textA, setTextA] = useState(`# Sample Document A\n\nVersion: 1.0.0\nStatus: Draft\n\n- Feature 1: Core Compiler\n- Feature 2: Basic PDF`);
  const [textB, setTextB] = useState(`# Sample Document A\n\nVersion: 1.1.0\nStatus: Production\n\n- Feature 1: Core Compiler Engine\n- Feature 2: High Resolution PDF\n- Feature 3: Visual Diff Comparator`);

  const linesA = textA.split("\n");
  const linesB = textB.split("\n");

  return (
    <div className="m-shell py-8 md:py-12 space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-4">
        <div className="flex items-center gap-3">
          <div className="sk-icon-well">
            <GitCompare className="w-5 h-5 text-[var(--accent-cyan)]" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--accent-cyan)] font-bold">
              TOOLS.ACE-SEEK.COM / DIFF-COMPARATOR
            </span>
            <h1 className="text-xl font-bold">Visual Text & Code Diff Comparator</h1>
          </div>
        </div>
        <a href="/tools" className="sk-btn sk-btn-ghost !text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Document */}
        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Original (Text A)</span>
            <span className="text-[10px] font-mono text-[var(--muted)]">{linesA.length} lines</span>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed"
            placeholder="Paste original text or code..."
          />
        </div>

        {/* Right Document */}
        <div className="sk-panel p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-cyan)]">Modified (Text B)</span>
            <span className="text-[10px] font-mono text-[var(--muted)]">{linesB.length} lines</span>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className="sk-input w-full h-64 font-mono text-xs p-3 leading-relaxed"
            placeholder="Paste modified text or code..."
          />
        </div>
      </div>

      {/* Visual Diff Readout */}
      <div className="sk-panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--bevel-shadow)] pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Line-by-Line Comparison Readout</span>
          <span className="sk-badge sk-badge-live">LIVE COMPARISON</span>
        </div>

        <div className="sk-recessed p-4 font-mono text-xs space-y-1 overflow-x-auto">
          {linesB.map((line, idx) => {
            const isMatch = linesA[idx] === line;
            const isAdded = !linesA[idx] && line;
            const isModified = linesA[idx] && linesA[idx] !== line;

            return (
              <div
                key={idx}
                className={`px-2 py-0.5 rounded flex items-center justify-between ${
                  isModified
                    ? "bg-amber-950/40 text-amber-300 border-l-2 border-amber-500"
                    : isAdded
                    ? "bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500"
                    : "text-[var(--muted)]"
                }`}
              >
                <span>{line || " "}</span>
                <span className="text-[10px] opacity-60 font-mono">
                  {isModified ? "MODIFIED" : isAdded ? "ADDED" : "UNCHANGED"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
