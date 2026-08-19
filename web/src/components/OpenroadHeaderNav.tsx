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
    href: "/openroad/design",
    label: "Design",
    match: ["/openroad/design"],
  },
  {
    href: "/openroad/studio",
    label: "PnR Studio",
    match: ["/openroad/studio", "/openroad/run"],
  },
  {
    href: "/openroad/scripts",
    label: "Scripts",
    match: ["/openroad/scripts"],
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
      <header className="shrink-0 z-30 bg-[var(--neu-bg)] border-b border-white/50 shadow-[0_4px_12px_rgba(192,200,214,0.35)]">
        <div className="m-shell flex h-14 md:h-16 items-center justify-between gap-4">
          {isIntroPage ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <a
                  href={homeHref}
                  className="neu-panel-sm flex items-center gap-2 px-3 py-1.5 font-black text-[var(--neu-text)] hover:opacity-90 transition-opacity shrink-0"
                >
                  <Boxes className="w-4 h-4 text-sky-600" />
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
                  className="neu-btn neu-btn-primary !text-xs !py-2 !px-3 font-black uppercase flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open Project</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="neu-btn !text-xs !py-2 !px-3 font-black flex items-center gap-1.5"
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
                  className="neu-btn !text-xs !py-2 !px-3 font-black hidden sm:inline-flex items-center gap-1"
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
                  className="neu-panel-sm flex items-center gap-1.5 px-2.5 py-1.5 font-black text-[10px] uppercase shrink-0 text-sky-700"
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
                      className={`shrink-0 px-2.5 py-1.5 text-[11px] font-black uppercase rounded-xl transition-all flex items-center gap-1 ${
                        active
                          ? "neu-btn-active text-sky-700"
                          : "neu-btn text-[var(--neu-text)]"
                      }`}
                    >
                      {s.label === "Project" && (
                        <FolderOpen className="w-3 h-3" />
                      )}
                      {s.label === "Design" && (
                        <FileCode2 className="w-3 h-3" />
                      )}
                      {s.label === "Scripts" && (
                        <FileCode2 className="w-3 h-3" />
                      )}
                      {s.label === "PnR Studio" && <Play className="w-3 h-3" />}
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(true)}
                  className="neu-btn !text-[10px] font-bold uppercase !px-2 !py-1.5 flex items-center gap-1"
                >
                  <Key className="w-3 h-3" />
                  {isAuthorized ? "Key" : "Login"}
                </button>
                <a
                  href={mainSiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] font-bold uppercase text-[var(--neu-text-muted)] hover:text-sky-700 hidden md:inline"
                >
                  www
                </a>
              </div>
            </>
          )}
        </div>
      </header>

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-xl">
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-2 -right-2 w-8 h-8 rounded-full neu-btn font-black text-rose-600 z-10 flex items-center justify-center"
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
