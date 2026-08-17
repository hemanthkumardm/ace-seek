"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  Boxes,
  FolderOpen,
  FileCode2,
  Play,
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

export const OPENROAD_STUDIOS = [
  {
    href: "/openroad/project",
    label: "Project",
    match: ["/openroad/project"],
  },
  {
    href: "/openroad/scripts",
    label: "Scripts",
    match: ["/openroad/scripts"],
  },
  {
    href: "/openroad/run",
    label: "Run",
    match: ["/openroad/run"],
  },
] as const;

export function OpenroadHeaderNav({
  homeHref,
  loginHref,
  signupHref,
  mainSiteUrl,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const isIntroPage =
    pathname === "/" || pathname === "/openroad" || pathname === "/openroad/";

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

  const handleOpenStudio = (path = "/openroad/project") => {
    if (isAuthorized) {
      router.push(path);
    } else {
      setShowAuthModal(true);
    }
  };

  return (
    <>
      <header className="shrink-0 border-b-4 border-black bg-white text-slate-900 z-30 shadow-[0_4px_0_#000000]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          {isIntroPage ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <a
                  href={homeHref}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-400 text-black border-3 border-black shadow-[3px_3px_0_#000000] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all shrink-0 font-black"
                >
                  <Boxes className="w-4 h-4" />
                  <span className="text-xs tracking-tight hidden sm:inline">
                    OPENROAD.ACE-SEEK
                  </span>
                  <span className="text-xs tracking-tight sm:hidden">OR</span>
                </a>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenStudio("/openroad/project")}
                  className="brutal-btn brutal-btn-cyan !text-xs !py-2 !px-3 font-black uppercase flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="brutal-btn bg-white text-black !text-xs !py-2 !px-3 font-black flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {isAuthorized ? "API Key" : "Login"}
                  </span>
                </button>
                <a
                  href={signupHref}
                  target="_blank"
                  rel="noreferrer"
                  className="brutal-btn brutal-btn-yellow !text-xs !py-2 !px-3 font-black hidden sm:inline-flex items-center gap-1"
                >
                  Get Key
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 min-w-0 overflow-x-auto">
                <a
                  href={homeHref}
                  className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-400 text-black border-2 border-black font-black text-[10px] uppercase shrink-0"
                  title="OpenROAD intro"
                >
                  <Home className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">OpenROAD</span>
                </a>
                {OPENROAD_STUDIOS.map((s) => {
                  const active = s.match.some(
                    (m) => pathname === m || pathname.startsWith(m + "/")
                  );
                  return (
                    <button
                      key={s.href}
                      type="button"
                      onClick={() => handleOpenStudio(s.href)}
                      className={`shrink-0 px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black rounded transition-all ${
                        active
                          ? "bg-black text-white shadow-[2px_2px_0_#22c55e]"
                          : "bg-white text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {s.label === "Project" && (
                        <FolderOpen className="w-3 h-3 inline mr-1" />
                      )}
                      {s.label === "Scripts" && (
                        <FileCode2 className="w-3 h-3 inline mr-1" />
                      )}
                      {s.label === "Run" && (
                        <Play className="w-3 h-3 inline mr-1" />
                      )}
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="text-[10px] font-bold uppercase border-2 border-black px-2 py-1 rounded bg-white flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  {isAuthorized ? "Key" : "Login"}
                </button>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold uppercase text-slate-500 hover:text-black hidden md:inline"
                >
                  www
                </a>
              </div>
            </>
          )}
        </div>
      </header>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-500 text-white font-black border-2 border-black shadow-[2px_2px_0_#000000] flex items-center justify-center z-10"
            >
              ✕
            </button>
            <SubdomainAuthModal
              subdomainName="OPENROAD"
              onAuthorize={() => {
                setIsAuthorized(true);
                setShowAuthModal(false);
                if (isLoaded && isSignedIn) {
                  /* ok */
                }
                router.push("/openroad/project");
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
