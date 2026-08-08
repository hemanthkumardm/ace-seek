"use client";

import React, { useState } from "react";
import { GitCompare, ArrowLeft } from "lucide-react";

export default function DiffComparatorPage() {
  const [textA, setTextA] = useState(`# Sample Document A\n\nVersion: 1.0.0\nStatus: Draft\n\n- Feature 1: Core Compiler\n- Feature 2: Basic PDF`);
  const [textB, setTextB] = useState(`# Sample Document A\n\nVersion: 1.1.0\nStatus: Production\n\n- Feature 1: Core Compiler Engine\n- Feature 2: High Resolution PDF\n- Feature 3: Visual Diff Comparator`);

  const linesA = textA.split("\n");
  const linesB = textB.split("\n");

  return (
    <div className="m-shell py-8 md:py-12 space-y-8 font-mono">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-[var(--brutal-cyan)] border-2 border-black flex items-center justify-center text-black">
            <GitCompare className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-xs text-[var(--brutal-cyan)] font-black uppercase">
              TOOLS.ACE-SEEK.COM / DIFF-COMPARATOR
            </span>
            <h1 className="text-xl font-black uppercase text-white">Visual Text & Code Diff Comparator</h1>
          </div>
        </div>
        <a href="/tools" className="brutal-btn !text-xs font-black">
          <ArrowLeft className="w-4 h-4" />
          <span>Tools Catalog</span>
        </a>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Document */}
        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-white">Original (Text A)</span>
            <span className="text-[10px] font-black text-slate-300">{linesA.length} lines</span>
          </div>
          <textarea
            value={textA}
            onChange={(e) => setTextA(e.target.value)}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed"
            placeholder="Paste original text or code..."
          />
        </div>

        {/* Right Document */}
        <div className="brutal-panel p-6 space-y-3 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
          <div className="flex items-center justify-between border-b-2 border-black pb-2">
            <span className="text-xs font-black uppercase text-[var(--brutal-cyan)]">Modified (Text B)</span>
            <span className="text-[10px] font-black text-slate-300">{linesB.length} lines</span>
          </div>
          <textarea
            value={textB}
            onChange={(e) => setTextB(e.target.value)}
            className="brutal-input w-full h-64 text-xs p-3 leading-relaxed"
            placeholder="Paste modified text or code..."
          />
        </div>
      </div>

      {/* Visual Diff Readout */}
      <div className="brutal-panel p-6 space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <span className="text-xs font-black uppercase text-white">Line-by-Line Comparison Readout</span>
          <span className="brutal-badge brutal-badge-lime">LIVE COMPARISON</span>
        </div>

        <div className="bg-black p-4 font-mono text-xs space-y-1.5 overflow-x-auto border-2 border-black">
          {linesB.map((line, idx) => {
            const isMatch = linesA[idx] === line;
            const isAdded = !linesA[idx] && line;
            const isModified = linesA[idx] && linesA[idx] !== line;

            return (
              <div
                key={idx}
                className={`px-3 py-1 rounded border-2 border-black font-bold flex items-center justify-between ${
                  isModified
                    ? "bg-[var(--brutal-yellow)] text-black"
                    : isAdded
                    ? "bg-[var(--brutal-lime)] text-black"
                    : "bg-slate-900 text-slate-300"
                }`}
              >
                <span>{line || " "}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">
                  {isModified ? "[MODIFIED]" : isAdded ? "[ADDED]" : "[UNCHANGED]"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
