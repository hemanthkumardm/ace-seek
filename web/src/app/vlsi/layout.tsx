import type { Metadata } from "next";
import { headers } from "next/headers";
import { productHostSlug, SITE_URL } from "@/lib/site";
import { Cpu, Activity, Layers, Zap, FolderOpen } from "lucide-react";

export const metadata: Metadata = {
  title: "VLSI Platform · vlsi.ace-seek.com",
  description:
    "Advanced VLSI tools suite — Reports Hub, SDC, Timing, MMMC, Power (UPF).",
};

export default async function VlsiLayout({ children }: { children: React.ReactNode }) {
  const host = (await headers()).get("host");
  const slug = productHostSlug(host);

  return (
    <div data-vlsi-shell className="h-dvh max-h-dvh flex flex-col overflow-hidden bg-slate-100 font-mono">
      {/* Neo-Brutalist Light Platform Header */}
      <header className="shrink-0 border-b-4 border-black bg-white text-slate-900 z-30 shadow-[0_4px_0_#000000]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <a
              href={SITE_URL}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-400 text-black border-3 border-black shadow-[3px_3px_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all shrink-0 font-black"
            >
              <Cpu className="w-4 h-4 text-black shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-black tracking-tight text-black">
                  VLSI.ACE-SEEK.COM
                </span>
                <span className="text-[9px] font-black uppercase text-black">
                  VLSI PLATFORM
                </span>
              </div>
            </a>
          </div>

          {/* High-Visibility Light Navigation Bar VLSI Workstations */}
          <nav className="hidden md:flex items-center gap-2 text-xs">
            <a
              href="/vlsi/reports"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-700 !text-slate-50 border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-110 transition-all font-black"
            >
              <FolderOpen className="w-3.5 h-3.5 shrink-0 text-slate-50" />
              <span className="text-slate-50 font-black">Reports</span>
            </a>
            <a
              href="/vlsi/sdc-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--brutal-cyan)] text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>SDC Studio</span>
            </a>
            <a
              href="/vlsi/timing-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[var(--brutal-yellow)] text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Timing Studio</span>
            </a>
            <a
              href="/vlsi/mmmc-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-400 text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>MMMC Studio</span>
            </a>
            <a
              href="/vlsi/power-studio"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-400 text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:brightness-105 transition-all font-black"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Power Studio</span>
            </a>
          </nav>

          {/* Account Actions */}
          <div className="flex items-center gap-2">
            <a
              href="https://ace-seek.com/signup"
              className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-3 font-black"
            >
              <span>Get API Key</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </main>
    </div>
  );
}
