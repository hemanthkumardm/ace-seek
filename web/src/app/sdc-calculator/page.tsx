import React from "react";

export default function SdcCalculator() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#1a1a1a]">
      <div className="brutal-border bg-[var(--accent2)] border-4 p-8 max-w-2xl text-center space-y-6 brutal-shadow">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter bg-white text-black px-4 py-2 brutal-border inline-block">
          SDC Calculator
        </h1>
        <p className="text-lg font-mono font-bold">
          Under Construction
        </p>
        <p className="text-sm font-mono bg-white p-4 brutal-border text-left">
          This tool will help you calculate timing constraints, clock uncertainty, input/output delays, and multi-cycle paths with an interactive visualizer. Check back soon.
        </p>
        <a href="/" className="brutal-btn inline-block mt-4 bg-black text-white hover:bg-white hover:text-black">
          ← Back to Home
        </a>
      </div>
    </div>
  );
}
