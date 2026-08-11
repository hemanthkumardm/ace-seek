import React from "react";
import {
  Cpu,
  Activity,
  Zap,
  CheckCircle2,
  ChevronRight,
  GitMerge,
  FolderOpen,
} from "lucide-react";

export default async function VlsiHome() {
  return (
    <div className="m-shell py-10 md:py-14 space-y-12 font-mono">
      {/* Hero Section - Neo-Brutalist High Contrast Container */}
      <div className="brutal-panel p-8 md:p-12 space-y-6 !border-4 !border-black !shadow-[8px_8px_0_#000000] bg-[var(--surface-panel)] relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b-3 border-black text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span className="font-black text-white uppercase tracking-wider">VLSI.ACE-SEEK.COM</span>
            <span className="text-[var(--brutal-cyan)] font-bold">// NEO-BRUTALISM PLATFORM</span>
          </div>
          <span className="brutal-badge brutal-badge-lime">
            ● 5 WORKSTATIONS ONLINE
          </span>
        </div>

        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.05] text-white uppercase">
            ADVANCED VLSI TIMING, SDC, MMMC &{" "}
            <span className="bg-rose-400 text-black px-2 py-0.5 border-2 border-black inline-block shadow-[3px_3px_0_#000000]">
              POWER (UPF).
            </span>
          </h1>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-bold">
            High-performance web apps for VLSI engineers: SDC, timing reports, multi-corner MMMC, and IEEE 1801 UPF power intent.
          </p>
        </div>

        {/* Core Value Highlights - Pop Cards */}
        <div className="grid gap-4 sm:grid-cols-2 pt-2">
          <div className="bg-[var(--brutal-yellow)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-black" /> Instant Feedback
            </p>
            <p className="text-[11px] font-bold leading-snug">Real-time SDC constraint calculation and syntax generation.</p>
          </div>

          <div className="bg-[var(--brutal-cyan)] text-black p-4 border-3 border-black shadow-[4px_4px_0_#000000] space-y-1">
            <p className="text-xs font-black uppercase flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Dynamic Waveforms
            </p>
            <p className="text-[11px] font-bold leading-snug">Visualise setup/hold checks and multi-cycle edge shifts interactively.</p>
          </div>
        </div>
      </div>

      {/* COMPLETE VLSI SUITE CATALOG - BRUTALIST CARDS */}
      <div className="space-y-6">
        <div className="border-b-4 border-black pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span className="text-xs font-black uppercase tracking-wider text-[var(--brutal-yellow)]">
              VLSI Workstation Suite
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase text-white">
            Engineering Tools Catalog
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Tool 0: Report Hub */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-slate-800 border-2 border-black flex items-center justify-center text-white">
                  <FolderOpen className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Report Hub</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Upload STA / SDC / UPF / MMMC dumps — auto-tag and open in the right studio. Size-capped history.
              </p>
            </div>
            <a
              href="/vlsi/reports"
              className="brutal-btn bg-slate-800 text-white hover:bg-slate-700 !text-xs w-full justify-between font-black"
            >
              <span>Open Report Hub</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 1: SDC Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-cyan)] border-2 border-black flex items-center justify-center text-black">
                  <Cpu className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">SDC Constraint Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Hyper-interactive SDC constraint generator with dynamic waveforms, I/O timing, and multicycle edge shift modeling.
              </p>
            </div>
            <a href="/vlsi/sdc-studio" className="brutal-btn brutal-btn-cyan !text-xs w-full justify-between font-black">
              <span>Open SDC Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 2: Timing Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-[var(--brutal-yellow)] border-2 border-black flex items-center justify-center text-black">
                  <Activity className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Timing Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Interactive Neo-Brutalist timing report analyzer. Parse and visualize PrimeTime / Tempus static timing analysis reports.
              </p>
            </div>
            <a href="/vlsi/timing-studio" className="brutal-btn brutal-btn-yellow !text-xs w-full justify-between font-black">
              <span>Open Timing Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 3: MMMC Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-indigo-500 border-2 border-black flex items-center justify-center text-white">
                  <GitMerge className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">MMMC Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                Multi-Mode Multi-Corner analysis view builder, scenario matrix generator, and lint validation workstation.
              </p>
            </div>
            <a href="/vlsi/mmmc-studio" className="brutal-btn bg-indigo-500 text-white hover:bg-indigo-600 !text-xs w-full justify-between font-black">
              <span>Open MMMC Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>

          {/* Tool 4: Power Studio */}
          <div className="brutal-panel brutal-panel-interactive p-6 flex flex-col justify-between space-y-4 bg-[var(--surface-panel)] border-3 border-black shadow-[5px_5px_0_#000000]">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-md bg-rose-500 border-2 border-black flex items-center justify-center text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="brutal-badge brutal-badge-lime">LIVE</span>
              </div>
              <h3 className="text-lg font-black uppercase text-white">Power Studio</h3>
              <p className="text-xs text-slate-300 font-bold leading-relaxed">
                IEEE 1801 UPF configurator: supplies, domains, switches, isolation, retention, PST — configure and download .upf.
              </p>
            </div>
            <a
              href="/vlsi/power-studio"
              className="brutal-btn bg-rose-500 text-white hover:bg-rose-600 !text-xs w-full justify-between font-black"
            >
              <span>Open Power Studio</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
