"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
} from "lucide-react";
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
  const { isLoaded, isSignedIn } = useAuth();

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  const isIntroPage = pathname === "/" || pathname === "/vlsi";

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
      <header className="shrink-0 border-b-4 border-black bg-white text-slate-900 z-30 shadow-[0_4px_0_#000000]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          {/* ON INTRO LANDING PAGE: Show full brand chip, Open VLSI Studio, API Login, Get Key */}
          {isIntroPage ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <a
                  href={homeHref}
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

              <nav className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleOpenStudio}
                  className="brutal-btn brutal-btn-cyan !text-xs !py-1.5 !px-4 font-black flex items-center gap-1.5 uppercase shadow-[3px_3px_0_#000000]"
                >
                  <Cpu className="w-4 h-4 text-black" />
                  <span>Open VLSI Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApiKeyButton}
                  className="brutal-btn bg-white text-black hover:bg-slate-100 !text-xs !py-1.5 !px-3 font-black"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isAuthorized ? "API Key Active" : "API Login"}</span>
                </button>
                <a
                  href={signupHref}
                  target="_blank"
                  rel="noreferrer"
                  className="brutal-btn brutal-btn-yellow !text-xs !py-1.5 !px-3 font-black"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:inline-flex text-[10px] font-black text-slate-600 hover:text-black underline"
                  title="Main Ace-Seek site"
                >
                  ace-seek.com
                </a>
              </div>
            </>
          ) : (
            /* ON STUDIO PAGES: Clean layout with ONLY Studio Tabs (+ Home Icon) */
            <div className="flex items-center justify-between w-full">
              <nav className="flex items-center gap-2 text-xs">
                {/* Home Link to Intro Page */}
                <a
                  href={homeHref}
                  className="p-1.5 rounded-md bg-purple-400 text-black border-2 border-black shadow-[2px_2px_0_#000000] hover:bg-purple-500 transition-all shrink-0 font-black flex items-center gap-1.5 px-2.5"
                  title="Return to VLSI Intro"
                >
                  <Home className="w-4 h-4" />
                  <span className="text-xs font-black hidden sm:inline">VLSI</span>
                </a>

                {/* Studio Workstation Switcher Tabs */}
                <a
                  href="/vlsi/reports"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/reports"
                      ? "bg-slate-900 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-300" />
                  <span className="text-white font-bold">Reports</span>
                </a>
                <a
                  href="/vlsi/sdc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/sdc-studio"
                      ? "bg-[var(--brutal-cyan)] text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>SDC Studio</span>
                </a>
                <a
                  href="/vlsi/timing-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/timing-studio"
                      ? "bg-[var(--brutal-yellow)] text-black shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Timing Studio</span>
                </a>
                <a
                  href="/vlsi/mmmc-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/mmmc-studio"
                      ? "bg-indigo-500 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>MMMC Studio</span>
                </a>
                <a
                  href="/vlsi/power-studio"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border-2 border-black font-black transition-all text-xs ${
                    pathname === "/vlsi/power-studio"
                      ? "bg-rose-500 text-white shadow-[2px_2px_0_#000000]"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Power Studio</span>
                </a>
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
