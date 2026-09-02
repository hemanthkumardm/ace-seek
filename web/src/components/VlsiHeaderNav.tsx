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
    const sync = () => {
      const key = localStorage.getItem("ace_seek_api_key");
      setIsAuthorized(Boolean(key && key.trim().length > 0));
    };
    sync();
    window.addEventListener("ace_key_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ace_key_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  /** Studios open only with validated API key — not Clerk session alone */
  const handleOpenStudio = () => {
    if (isAuthorized) {
      router.push("/vlsi/reports");
    } else {
      setShowAuthModal(true);
    }
  };

  /** API Key Active / Login: open key manager only */
  const handleApiKeyButton = () => {
    setShowAuthModal(true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 ${
          isIntroPage
            ? "bg-[var(--surface-recessed)] border-b border-[var(--bevel-shadow)] text-[var(--foreground)] shadow-md"
            : "bg-[#e6ecf5] border-b border-slate-300/90 shadow-sm text-slate-900"
        }`}
      >
        <div className="flex items-center justify-between px-3 md:px-6 py-2.5">
          {isIntroPage ? (
            /* INTRO / MARKETING PAGE HEADER (Dark Carbon Theme) */
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <Link
                  href={homeHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 hover:bg-[var(--accent-cyan)]/20 transition-all font-black text-xs"
                >
                  <Cpu className="w-4 h-4 text-[var(--accent-cyan)]" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-wider uppercase text-white">
                      VLSI Cloud
                    </span>
                  </div>
                </Link>
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Engineering Cloud</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/vlsi/learn"
                  className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1.5 uppercase"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Learn</span>
                </Link>
                <button
                  type="button"
                  onClick={handleOpenStudio}
                  className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1.5 uppercase"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleApiKeyButton}
                  className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 font-bold text-slate-200"
                >
                  <Key className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>{isAuthorized ? "API Key Active" : "API Login"}</span>
                </button>
                <a
                  href={signupHref}
                  target="_blank"
                  rel="noreferrer"
                  className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold flex items-center gap-1"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : isLearnPage ? (
            /* LEARN PORTAL HEADER: return home, course hub, filter pills, open studio */
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={homeHref}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-sm hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5 text-xs"
                  title="Return to VLSI Intro"
                >
                  <Home className="w-4 h-4" />
                  <span className="font-black hidden sm:inline">VLSI</span>
                </Link>
                <Link
                  href="/vlsi/learn"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-black transition-all text-xs ${
                    pathname === "/vlsi/learn" && !learnKind
                      ? "bg-purple-600 text-white shadow-sm"
                      : "neu-btn text-slate-800 font-bold"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-purple-400" />
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
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                      pathname === "/vlsi/learn" && learnKind === kind
                        ? "bg-slate-900 text-white shadow-sm font-black"
                        : "neu-btn text-slate-700"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-sky-600" />
                    <span>{LEARN_KIND_META[kind].hubLabel}</span>
                  </Link>
                ))}
              </nav>
              <button
                type="button"
                onClick={handleOpenStudio}
                className="neu-btn neu-btn-primary px-3 py-1.5 text-xs font-black flex items-center gap-1.5 uppercase shrink-0"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VLSI Studio</span>
                <span className="sm:hidden">Studio</span>
              </button>
            </div>
          ) : (
            /* STUDIO PAGES: RTL Lab + workstations + Learn switcher */
            <div className="flex items-center justify-between w-full gap-2">
              <nav className="flex items-center gap-1.5 md:gap-2 text-xs flex-wrap">
                <Link
                  href={homeHref}
                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black shadow-sm hover:opacity-90 transition-all shrink-0 flex items-center gap-1.5"
                  title="Return to VLSI Intro"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-xs font-black hidden sm:inline">VLSI</span>
                </Link>

                <Link
                  href="/vlsi/learn"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname.startsWith("/vlsi/learn")
                      ? "bg-purple-600 !text-white font-black shadow-sm border border-purple-700"
                      : "neu-btn text-purple-700"
                  }`}
                  title="Open VLSI Curriculum & EDA Tracks"
                >
                  <GraduationCap
                    className={`w-4 h-4 ${
                      pathname.startsWith("/vlsi/learn") ? "text-white" : "text-purple-600"
                    }`}
                  />
                  <span className={pathname.startsWith("/vlsi/learn") ? "text-white font-black" : "text-purple-700 font-bold"}>
                    <span className="hidden sm:inline">Learn Hub</span>
                    <span className="sm:hidden">Learn</span>
                  </span>
                </Link>

                <Link
                  href="/vlsi/rtl-lab"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname.startsWith("/vlsi/rtl-lab")
                      ? "bg-emerald-500 !text-slate-950 font-black shadow-sm border border-emerald-600"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <Code2
                    className={`w-3.5 h-3.5 ${
                      pathname.startsWith("/vlsi/rtl-lab") ? "text-slate-950" : "text-emerald-600"
                    }`}
                  />
                  <span className={pathname.startsWith("/vlsi/rtl-lab") ? "text-slate-950 font-black" : "text-slate-800 font-bold"}>
                    RTL Lab
                  </span>
                </Link>

                <Link
                  href="/vlsi/reports"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/reports"
                      ? "bg-blue-600 !text-white font-black shadow-sm border border-blue-700"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <FolderOpen
                    className={`w-3.5 h-3.5 ${
                      pathname === "/vlsi/reports" ? "text-white" : "text-blue-600"
                    }`}
                  />
                  <span className={pathname === "/vlsi/reports" ? "text-white font-black" : "text-slate-800 font-bold"}>
                    Reports
                  </span>
                </Link>

                <Link
                  href="/vlsi/sdc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/sdc-studio"
                      ? "bg-cyan-500 !text-slate-950 font-black shadow-sm border border-cyan-600"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <Cpu
                    className={`w-3.5 h-3.5 ${
                      pathname === "/vlsi/sdc-studio" ? "text-slate-950" : "text-cyan-600"
                    }`}
                  />
                  <span className={pathname === "/vlsi/sdc-studio" ? "text-slate-950 font-black" : "text-slate-800 font-bold"}>
                    SDC Studio
                  </span>
                </Link>

                <Link
                  href="/vlsi/timing-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/timing-studio"
                      ? "bg-amber-400 !text-slate-950 font-black shadow-sm border border-amber-500"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <Activity
                    className={`w-3.5 h-3.5 ${
                      pathname === "/vlsi/timing-studio" ? "text-slate-950" : "text-amber-600"
                    }`}
                  />
                  <span className={pathname === "/vlsi/timing-studio" ? "text-slate-950 font-black" : "text-slate-800 font-bold"}>
                    Timing Studio
                  </span>
                </Link>

                <Link
                  href="/vlsi/mmmc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/mmmc-studio"
                      ? "bg-indigo-600 !text-white font-black shadow-sm border border-indigo-700"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <Layers
                    className={`w-3.5 h-3.5 ${
                      pathname === "/vlsi/mmmc-studio" ? "text-white" : "text-indigo-600"
                    }`}
                  />
                  <span className={pathname === "/vlsi/mmmc-studio" ? "text-white font-black" : "text-slate-800 font-bold"}>
                    MMMC Studio
                  </span>
                </Link>

                <Link
                  href="/vlsi/power-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    pathname === "/vlsi/power-studio"
                      ? "bg-rose-500 !text-white font-black shadow-sm border border-rose-600"
                      : "neu-btn text-slate-800"
                  }`}
                >
                  <Zap
                    className={`w-3.5 h-3.5 ${
                      pathname === "/vlsi/power-studio" ? "text-white" : "text-rose-600"
                    }`}
                  />
                  <span className={pathname === "/vlsi/power-studio" ? "text-white font-black" : "text-slate-800 font-bold"}>
                    Power Studio
                  </span>
                </Link>
              </nav>

              <div className="hidden lg:flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleApiKeyButton}
                  className="neu-btn px-2.5 py-1.5 text-xs font-bold text-slate-700 flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-amber-600" />
                  <span>{isAuthorized ? "Key Active" : "Key Login"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Pop-up Auth Modal when OPEN VLSI STUDIO is clicked without being logged in */}
      {showAuthModal && (
        <div
          data-vlsi-shell
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
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
                if (pathname === "/" || pathname === "/vlsi") {
                  router.push("/vlsi/reports");
                }
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
