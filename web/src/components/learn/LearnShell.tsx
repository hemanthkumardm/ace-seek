"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { LearnTopbar } from "@/components/learn/LearnTopbar";
import { LearnSidebar } from "@/components/learn/LearnSidebar";
import { sessionBySlug, trackById } from "@/lib/vlsi-curriculum";

export type LnTheme = "light" | "dark";
export type LnFont = "sm" | "md" | "lg";

type Prefs = {
  theme: LnTheme;
  font: LnFont;
  focus: boolean;
  sidebarOpen: boolean;
  setTheme: (t: LnTheme) => void;
  setFont: (f: LnFont) => void;
  setFocus: (v: boolean) => void;
  setSidebarOpen: (v: boolean) => void;
};

const Ctx = createContext<Prefs | null>(null);
const STORAGE = "ace_vlsi_learn_prefs";

export function useLearnPrefs() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLearnPrefs outside LearnShell");
  return v;
}

export function LearnShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.replace(/\/$/, "").split("/").filter(Boolean);
  // /vlsi/learn | /vlsi/learn/c/:track | /vlsi/learn/c/:track/:slug | /vlsi/learn/:slug
  const isCatalog = pathname === "/vlsi/learn" || pathname === "/vlsi/learn/";
  let courseTrack = "";
  let slug = "";
  if (parts[0] === "vlsi" && parts[1] === "learn" && parts[2] === "c" && parts[3]) {
    courseTrack = parts[3];
    slug = parts[4] ? decodeURIComponent(parts[4]) : "";
  } else if (parts[0] === "vlsi" && parts[1] === "learn" && parts[2] && parts[2] !== "c") {
    slug = decodeURIComponent(parts[2]);
  }
  const session = slug ? sessionBySlug(slug) : undefined;
  const activeTrack = courseTrack || session?.track;
  const showSidebar = !isCatalog && !!trackById(activeTrack || "");

  const [theme, setThemeState] = useState<LnTheme>("dark");
  const [font, setFontState] = useState<LnFont>("md");
  const [focus, setFocus] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        const p = JSON.parse(raw) as { theme?: LnTheme; font?: LnFont };
        // Default strictly to dark
        if (p.theme === "dark") setThemeState("dark");
        if (p.font === "sm" || p.font === "md" || p.font === "lg") setFontState(p.font);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setTheme = (t: LnTheme) => {
    setThemeState(t);
    try {
      const raw = localStorage.getItem(STORAGE);
      const prev = raw ? (JSON.parse(raw) as object) : {};
      localStorage.setItem(STORAGE, JSON.stringify({ ...prev, theme: t }));
    } catch {
      /* ignore */
    }
  };

  const setFont = (f: LnFont) => {
    setFontState(f);
    try {
      const raw = localStorage.getItem(STORAGE);
      const prev = raw ? (JSON.parse(raw) as object) : {};
      localStorage.setItem(STORAGE, JSON.stringify({ ...prev, font: f }));
    } catch {
      /* ignore */
    }
  };

  const value = useMemo(
    () => ({
      theme,
      font,
      focus,
      sidebarOpen,
      setTheme,
      setFont,
      setFocus,
      setSidebarOpen,
    }),
    [theme, font, focus, sidebarOpen]
  );

  return (
    <Ctx.Provider value={value}>
      <div
        className="learn-shell h-full min-h-0 flex flex-col"
        data-ln-theme={theme}
        data-ln-font={font}
        suppressHydrationWarning
      >
        <LearnTopbar activeTrack={activeTrack} catalog={isCatalog} />
        <div className="flex-1 min-h-0 flex relative">
          {!focus && showSidebar && (
            <LearnSidebar activeSlug={slug} activeTrack={activeTrack} />
          )}
          <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
        </div>
      </div>
    </Ctx.Provider>
  );
}
