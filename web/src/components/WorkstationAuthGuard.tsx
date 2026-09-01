"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  Lock,
  Key,
  LogIn,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { mainDashboardHref, mainSignupHref, SITE_URL } from "@/lib/site";

type Props = {
  children: React.ReactNode;
};

/**
 * Shell lock for VLSI / Tools workstations.
 * Requires a **validated API key** (via /api/validate-key).
 * Clerk session alone does NOT unlock — plan is tied to the dashboard key.
 */
export function WorkstationAuthGuard({ children }: Props) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const [hasValidApiKey, setHasValidApiKey] = useState<boolean | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [keyStatus, setKeyStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [planLabel, setPlanLabel] = useState<string>("");

  // Public routes that never require lock screen
  const isPublicRoute =
    pathname === "/" ||
    pathname === "/vlsi" ||
    pathname === "/openroad" ||
    pathname === "/tools" ||
    pathname === "/login" ||
    pathname.endsWith("/login");

  const validateKeySilently = useCallback(async (keyToTest: string) => {
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setHasValidApiKey(true);
        setPlanLabel(String(data.plan || data.tier || ""));
        return true;
      }
      setHasValidApiKey(false);
      setPlanLabel("");
      return false;
    } catch {
      setHasValidApiKey(false);
      setPlanLabel("");
      return false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = () => {
      const existing = localStorage.getItem("ace_seek_api_key");
      if (existing?.trim()) {
        void validateKeySilently(existing.trim());
      } else {
        setHasValidApiKey(false);
        setPlanLabel("");
      }
    };

    sync();
    window.addEventListener("ace_key_updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ace_key_updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [validateKeySilently]);

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
        setPlanLabel(String(data.plan || data.tier || ""));
        setKeyStatus("valid");
        window.dispatchEvent(new Event("ace_key_updated"));
      } else {
        setKeyStatus("invalid");
        setHasValidApiKey(false);
      }
    } catch {
      setKeyStatus("invalid");
      setHasValidApiKey(false);
    }
  };

  // Public intro / login routes — no shell lock
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Still verifying stored key
  if (hasValidApiKey === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 bg-slate-900 text-white font-mono">
        <div className="flex items-center gap-3">
          <span className="sk-led sk-led-green animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Verifying API license…
          </span>
        </div>
      </div>
    );
  }

  // Unlock only with validated API key (plan is checked by VlsiStudioGate inside)
  if (hasValidApiKey === true) {
    return <>{children}</>;
  }

  const signedInHint =
    isLoaded && isSignedIn
      ? user?.primaryEmailAddress?.emailAddress || "signed in"
      : null;

  // Lock screen — require dashboard API key
  return (
    <div className="flex-1 min-h-[80vh] flex items-center justify-center p-6 bg-slate-950 font-mono">
      <div className="brutal-panel bg-[var(--surface-panel)] border-4 border-black shadow-[10px_10px_0_#000000] p-8 md:p-10 space-y-6 max-w-xl w-full">
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
                Valid dashboard API key required
              </p>
            </div>
          </div>
          <span className="brutal-badge brutal-badge-pink">LICENSE</span>
        </div>

        <p className="text-xs text-slate-300 font-bold leading-relaxed">
          Studios unlock with your{" "}
          <b className="text-white">dashboard API license key</b> (plan is
          bound to that key). An account session alone is not enough.
        </p>

        {signedInHint && (
          <div className="bg-emerald-950/40 border-2 border-emerald-600/50 p-3 rounded text-[11px] font-bold text-emerald-200">
            Signed in as {signedInHint}. Copy your key from the{" "}
            <a
              href={mainDashboardHref()}
              target="_blank"
              rel="noreferrer"
              className="underline text-emerald-100"
            >
              main dashboard
            </a>{" "}
            and paste it below.
          </div>
        )}

        <div className="space-y-3">
          <label className="text-xs font-black uppercase text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span>Dashboard API license key</span>
          </label>

          <form onSubmit={handleKeySubmit} className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              autoComplete="off"
              placeholder="ace_free_usr_… or ace_pro_usr_…"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="flex-1 bg-black border-3 border-black text-white text-xs font-mono px-3 py-2.5 rounded outline-none focus:border-[var(--accent-cyan)] font-bold shadow-[3px_3px_0_#000000]"
            />
            <button
              type="submit"
              disabled={keyStatus === "validating"}
              className="brutal-btn brutal-btn-yellow !text-xs !py-2.5 !px-4 font-black uppercase"
            >
              {keyStatus === "validating" ? "Verifying…" : "Unlock"}
            </button>
          </form>

          {keyStatus === "invalid" && (
            <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Invalid key. Copy a fresh key from the{" "}
              <a
                href={mainDashboardHref()}
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                main dashboard
              </a>
              .
            </p>
          )}
        </div>

        <div className="pt-4 border-t-3 border-black flex flex-wrap justify-between items-center gap-3 text-[11px] font-bold">
          <a
            href={pathname?.startsWith("/tools") ? "/tools" : "/vlsi"}
            className="text-slate-400 hover:text-white underline"
          >
            ← Back to intro
          </a>
          <div className="flex items-center gap-3">
            {!isSignedIn && (
              <a
                href={`${SITE_URL}/login`}
                target="_blank"
                rel="noreferrer"
                className="text-slate-300 hover:text-white underline inline-flex items-center gap-1"
              >
                <LogIn className="w-3 h-3" />
                Account login
              </a>
            )}
            <a
              href={mainSignupHref()}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--accent-cyan)] hover:underline flex items-center gap-1 font-black"
            >
              <span>Get key on {SITE_URL.replace("https://", "")}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
