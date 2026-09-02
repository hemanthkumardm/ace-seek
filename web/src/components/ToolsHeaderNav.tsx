"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Boxes,
  FileText,
  GitCompare,
  RefreshCw,
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

export function ToolsHeaderNav({
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

  const isIntroPage = pathname === "/" || pathname === "/tools";

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

  /** Open tools only with validated API key — not session alone */
  const handleOpenStudio = () => {
    if (isAuthorized) {
      router.push("/tools/doc-compiler");
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className="shrink-0 border-b border-[var(--bevel-shadow)] bg-[var(--surface-recessed)] text-[var(--foreground)] z-30 shadow-md">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          {/* ON INTRO LANDING PAGE: Show full brand chip, Open Tools Studio, API Login, Get Key */}
          {isIntroPage ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <a
                  href={homeHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--accent-cyan)]/10 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/40 hover:bg-[var(--accent-cyan)]/20 transition-all shrink-0 font-black"
                >
                  <Boxes className="w-4 h-4 text-[var(--accent-cyan)] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-xs font-black tracking-tight text-white">
                      TOOLS.ACE-SEEK.COM
                    </span>
                    <span className="text-[9px] font-bold uppercase text-cyan-400">
                      DEV PLATFORM
                    </span>
                  </div>
                </a>
              </div>

              <nav className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={handleOpenStudio}
                  className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-4 font-black flex items-center gap-1.5 uppercase"
                >
                  <Boxes className="w-4 h-4" />
                  <span>Open Tools Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </nav>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="sk-btn sk-btn-ghost !text-xs !py-1.5 !px-3 font-bold text-slate-200"
                >
                  <Key className="w-3.5 h-3.5 text-[var(--accent-cyan)]" />
                  <span>{isAuthorized ? "API Key Active" : "API Login"}</span>
                </button>
                <a
                  href={signupHref}
                  target="_blank"
                  rel="noreferrer"
                  className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-3 font-bold"
                >
                  <span>Get Key</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden lg:inline-flex text-[11px] font-bold text-slate-400 hover:text-cyan-400 underline underline-offset-2"
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
                  className="p-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-all shrink-0 font-bold flex items-center gap-1.5 px-2.5"
                  title="Return to Tools Intro"
                >
                  <Home className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold hidden sm:inline">TOOLS</span>
                </a>

                {/* Studio Workstation Switcher Tabs */}
                <a
                  href="/tools/doc-compiler"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs ${
                    pathname === "/tools/doc-compiler"
                      ? "bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-md"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Doc Compiler</span>
                </a>
                <a
                  href="/tools/diff-comparator"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs ${
                    pathname === "/tools/diff-comparator"
                      ? "bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-md"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  <span>Diff Tool</span>
                </a>
                <a
                  href="/tools/format-converter"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold transition-all text-xs ${
                    pathname === "/tools/format-converter"
                      ? "bg-[var(--accent-cyan)] text-black border-[var(--accent-cyan)] shadow-md"
                      : "bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Converter</span>
                </a>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Pop-up Auth Modal when OPEN TOOLS STUDIO is clicked without being logged in */}
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
              subdomainName="TOOLS"
              onAuthorize={() => {
                setIsAuthorized(true);
                setShowAuthModal(false);
                router.push("/tools/doc-compiler");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
