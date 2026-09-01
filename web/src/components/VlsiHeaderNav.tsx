"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Cpu,
  Activity,
  Layers,
  Zap,
  FolderOpen,
  Key,
  ExternalLink,
  ArrowRight,
  Home,
  GraduationCap,
  Code2,
  BookOpen,
  PlayCircle,
  ClipboardCheck,
} from "lucide-react";
import { LEARN_KIND_META, isLearnKind } from "@/lib/vlsi-curriculum";
import { SubdomainAuthModal } from "@/components/SubdomainAuthModal";

type Props = {
  homeHref: string;
  loginHref: string;
  signupHref: string;
  mainSiteUrl: string;
};

export function VlsiHeaderNav({
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isSignedIn } = useAuth();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const isIntroPage = pathname === "/" || pathname === "/vlsi";
  const isLearnPage = pathname.startsWith("/vlsi/learn");
  const learnKind = searchParams.get("kind");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = localStorage.getItem("ace_seek_api_key");
    if (key && key.trim().length > 0) {
      setIsAuthorized(true);
    }
  }, []);

  const handleOpenStudio = () => {
    if (isSignedIn || isAuthorized) {
      router.push("/vlsi/reports");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[var(--surface-raised)] border-b-3 border-black text-black">
        <div className="flex items-center justify-between px-3 md:px-6 py-2">
          {isIntroPage ? (
            /* INTRO / MARKETING PAGE HEADER */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Link
                  href={homeHref}
                  className="flex items-center gap-2 p-1.5 rounded-md bg-[var(--brutal-yellow)] text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-yellow-400 transition-all"
                >
                  <Cpu className="w-5 h-5" />
                  <span className="font-black tracking-wider text-sm uppercase">
                    VLSI
                  </span>
                </Link>
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Engineering Cloud</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/vlsi/learn"
                  className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-3 font-black flex items-center gap-1.5 uppercase"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Learn</span>
                </Link>
                <button
                  type="button"
                  onClick={handleOpenStudio}
                  className="brutal-btn brutal-btn-cyan !text-xs !py-1.5 !px-3 font-black flex items-center gap-1.5 uppercase"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : isLearnPage ? (
            /* LEARN PORTAL HEADER: return home, course hub, filter pills, open studio */
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={homeHref}
                  className="p-1.5 rounded-md bg-purple-400 text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-purple-500 transition-all shrink-0 font-black flex items-center gap-1.5 px-2.5 text-xs"
                  title="Return to VLSI Intro"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-black hidden sm:inline">VLSI</span>
                </Link>
                <Link
                  href="/vlsi/learn"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/learn" && !learnKind
                      ? "bg-[var(--brutal-yellow)] text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Curriculum</span>
                  <span className="sm:hidden">Learn</span>
                </Link>
              </div>

              {/* Lesson Kind Filter Pills */}
              <nav className="hidden md:flex items-center gap-1.5 text-xs">
                {(
                  [
                    ["theory", BookOpen],
                    ["video", PlayCircle],
                    ["practical", Code2],
                    ["quiz", ClipboardCheck],
                    ["test", ClipboardCheck],
                  ] as const
                ).map(([kind, Icon]) => (
                  <Link
                    key={kind}
                    href={`/vlsi/learn?kind=${kind}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                      pathname === "/vlsi/learn" && learnKind === kind
                        ? "bg-[var(--brutal-yellow)] text-black shadow-[2px_2px_0_#000000]"
                        : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{LEARN_KIND_META[kind].hubLabel}</span>
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleOpenStudio}
                className="brutal-btn brutal-btn-cyan !text-xs !py-1.5 !px-3 font-black flex items-center gap-1.5 uppercase shrink-0"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VLSI Studio</span>
                <span className="sm:hidden">Studio</span>
              </button>
            </div>
          ) : (
            /* STUDIO PAGES: RTL Lab + workstations only */
            <div className="flex items-center justify-between w-full">
              <nav className="flex items-center gap-2 text-xs">
                <Link
                  href={homeHref}
                  className="p-1.5 rounded-md bg-purple-400 text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-purple-500 transition-all shrink-0 font-black flex items-center gap-1.5 px-2.5"
                  title="Return to VLSI Intro"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-xs font-black hidden sm:inline">VLSI</span>
                </Link>
                <Link
                  href="/vlsi/rtl-lab"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname.startsWith("/vlsi/rtl-lab")
                      ? "bg-emerald-400 text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>RTL Lab</span>
                </Link>
                <Link
                  href="/vlsi/reports"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/reports"
                      ? "bg-slate-900 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Reports</span>
                </Link>
                <Link
                  href="/vlsi/sdc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/sdc-studio"
                      ? "bg-[var(--brutal-cyan)] text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SDC Studio</span>
                </Link>
                <Link
                  href="/vlsi/timing-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/timing-studio"
                      ? "bg-[var(--brutal-yellow)] text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Timing Studio</span>
                </Link>
                <Link
                  href="/vlsi/mmmc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/mmmc-studio"
                      ? "bg-indigo-500 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>MMMC Studio</span>
                </Link>
                <Link
                  href="/vlsi/power-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/power-studio"
                      ? "bg-rose-500 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Power Studio</span>
                </Link>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Pop-up Auth Modal when OPEN VLSI STUDIO is clicked without being logged in */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white font-black border-2 border-black shadow-[2px_2px_0_#000000] flex items-center justify-center z-10 hover:bg-rose-600"
            >
              ✕
            </button>
            <SubdomainAuthModal
              subdomainName="VLSI"
              onAuthorize={() => {
                setIsAuthorized(true);
                setShowAuthModal(false);
                router.push("/vlsi/reports");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
