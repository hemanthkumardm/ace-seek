"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Lock,
  Key,
  ShieldCheck,
  UserCheck,
  LogIn,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Cpu,
} from "lucide-react";

type Props = {
  children: React.ReactNode;
};

export function WorkstationAuthGuard({ children }: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();

  const [hasValidApiKey, setHasValidApiKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<"idle" | "validating" | "valid" | "invalid">("idle");

  // Public routes that never require lock screen
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/vlsi" ||
    pathname === "/tools" ||
    pathname === "/login" ||
    pathname.endsWith("/login");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem("ace_seek_api_key");
    if (existing) {
      validateKeySilently(existing);
    } else {
      setHasValidApiKey(false);
    }
  }, []);

  const validateKeySilently = async (keyToTest: string) => {
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setHasValidApiKey(true);
      } else {
        setHasValidApiKey(false);
      }
    } catch {
      // Local fallback for offline/development keys
      if (keyToTest.startsWith("ace_")) {
        setHasValidApiKey(true);
      } else {
        setHasValidApiKey(false);
      }
    }
  };

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    setKeyStatus("validating");

    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        localStorage.setItem("ace_seek_api_key", apiKeyInput.trim());
        setHasValidApiKey(true);
        setKeyStatus("valid");
      } else if (apiKeyInput.trim().startsWith("ace_")) {
        localStorage.setItem("ace_seek_api_key", apiKeyInput.trim());
        setHasValidApiKey(true);
        setKeyStatus("valid");
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      if (apiKeyInput.trim().startsWith("ace_")) {
        localStorage.setItem("ace_seek_api_key", apiKeyInput.trim());
        setHasValidApiKey(true);
        setKeyStatus("valid");
      } else {
        setKeyStatus("invalid");
      }
    }
  };

  // If public route or loading, render children
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If signed in via Clerk SSO or has valid API key, render workstation
  if ((isLoaded && isSignedIn) || hasValidApiKey === true) {
    return <>{children}</>;
  }

  // While checking auth status
  if (!isLoaded || hasValidApiKey === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-900 text-white font-mono">
        <div className="flex items-center gap-3">
          <span className="sk-led sk-led-green animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Verifying Workstation License & Identity…
          </span>
        </div>
      </div>
    );
  }

  // Render Lock Screen Overlay for unauthenticated users
  return (
    <div className="flex-1 min-h-[80vh] flex items-center justify-center p-6 bg-slate-950 font-mono">
      <div className="brutal-panel bg-[var(--surface-panel)] border-4 border-black shadow-[10px_10px_0_#000000] p-8 md:p-10 space-y-6 max-w-xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-rose-500 border-2 border-black flex items-center justify-center text-white font-black shadow-[3px_3px_0_#000000]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-wide">
                Workstation Locked
              </h2>
              <p className="text-[11px] font-bold text-rose-400">
                Authorization Required to Access Studio
              </p>
            </div>
          </div>
          <span className="brutal-badge brutal-badge-pink">PRO LICENSED</span>
        </div>

        <p className="text-xs text-slate-300 font-bold leading-relaxed">
          Access to this studio workstation requires an active account session or a valid Dashboard API License Key.
        </p>

        {/* Option 1: Clerk SSO Login */}
        <div className="bg-slate-900 border-3 border-black p-4 rounded space-y-3 shadow-[4px_4px_0_#000000]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-white uppercase flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--accent-cyan)]" />
              Log in with Clerk Account
            </span>
            <a
              href="/login"
              className="sk-btn sk-btn-primary !text-xs !py-1.5 !px-4 font-bold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </a>
          </div>
          <p className="text-[11px] text-slate-400 font-bold leading-normal">
            If you already created an account on <a href="https://www.ace-seek.com" className="text-[var(--accent-cyan)] underline" target="_blank" rel="noreferrer">www.ace-seek.com</a>, log in here to activate your session.
          </p>
        </div>

        {/* Option 2: Paste API Key */}
        <div className="space-y-3 pt-2">
          <label className="text-xs font-black uppercase text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span>Or Enter Dashboard API License Key</span>
          </label>

          <form onSubmit={handleKeySubmit} className="flex gap-2">
            <input
              type="password"
              placeholder="Paste Key (ace_free_usr_... or ace_pro_usr_...)"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 bg-black border-3 border-black text-white text-xs font-mono px-3 py-2.5 rounded outline-none focus:border-[var(--accent-cyan)] font-bold shadow-[3px_3px_0_#000000]"
            />
            <button
              type="submit"
              disabled={keyStatus === "validating"}
              className="brutal-btn brutal-btn-yellow !text-xs !py-2.5 !px-4 font-black uppercase"
            >
              {keyStatus === "validating" ? "Verifying…" : "Unlock Studio"}
            </button>
          </form>

          {keyStatus === "invalid" && (
            <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> Invalid API key. Please copy your key from the <a href="https://www.ace-seek.com/dashboard" className="underline" target="_blank" rel="noreferrer">Main Dashboard</a>.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t-3 border-black flex justify-between items-center text-[11px] font-bold">
          <a
            href="/vlsi"
            className="text-slate-400 hover:text-white underline"
          >
            ← Back to Intro Landing Page
          </a>
          <a
            href="https://www.ace-seek.com/signup"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-black"
          >
            <span>Get Key on ace-seek.com</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
