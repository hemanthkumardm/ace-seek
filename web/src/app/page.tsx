import React from "react";

export default function Home() {
  return (
    <div className="flex-1 overflow-auto bg-[var(--background)] p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Hero Section */}
        <header className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase">
            Welcome to <span className="bg-black text-white px-2 py-1 inline-block mt-2 brutal-border">Ace-Seek</span>
          </h1>
          <p className="text-lg md:text-2xl font-mono opacity-80 max-w-2xl border-l-4 border-black pl-4">
            The ultimate Brutalist helper suite for hardware, ASIC, and VLSI engineers. No nonsense, just tools that work.
          </p>
        </header>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Compiler */}
          <a href="/compiler" className="brutal-border border-4 p-6 bg-white hover:bg-[var(--accent)] transition-all hover:-translate-y-1 group flex flex-col h-full brutal-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Doc Compiler</h2>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">V2.3</span>
            </div>
            <p className="text-sm font-mono opacity-80 flex-1">
              Write Markdown, render Math and Tcl/SDC code blocks, and compile to high-resolution vector PDF instantly. Perfect for design spec docs.
            </p>
            <div className="mt-6 text-xs font-bold uppercase tracking-widest group-hover:underline">
              Launch Tool →
            </div>
          </a>

          {/* Card 2: SDC Calculator */}
          <a href="/sdc-calculator" className="brutal-border border-4 p-6 bg-white hover:bg-[var(--accent2)] transition-all hover:-translate-y-1 group flex flex-col h-full brutal-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">SDC Calc</h2>
              <span className="bg-yellow-300 text-black border-2 border-black text-[10px] font-bold px-2 py-1 uppercase">Coming Soon</span>
            </div>
            <p className="text-sm font-mono opacity-80 flex-1">
              Calculate timing constraints, clock uncertainty, input/output delays, and multi-cycle paths with our interactive visualizer.
            </p>
            <div className="mt-6 text-xs font-bold uppercase tracking-widest group-hover:underline">
              View Placeholder →
            </div>
          </a>

          {/* Card 3: Script Helper */}
          <a href="/script-helper" className="brutal-border border-4 p-6 bg-white hover:bg-[#ffb6c1] transition-all hover:-translate-y-1 group flex flex-col h-full brutal-shadow">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-black uppercase tracking-tight">Script Helper</h2>
              <span className="bg-yellow-300 text-black border-2 border-black text-[10px] font-bold px-2 py-1 uppercase">Coming Soon</span>
            </div>
            <p className="text-sm font-mono opacity-80 flex-1">
              Automated snippet generation for Tcl, Python, and Makefile workflows. Stop reinventing the wheel for every new block.
            </p>
            <div className="mt-6 text-xs font-bold uppercase tracking-widest group-hover:underline">
              View Placeholder →
            </div>
          </a>

        </div>

        {/* Footer info */}
        <footer className="pt-12 border-t-4 border-black text-xs font-mono font-bold uppercase opacity-60 text-center">
          Ace-Seek · VLSI Helper Suite · Built for speed
        </footer>
      </div>
    </div>
  );
}
