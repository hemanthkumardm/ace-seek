"use client";

import React, { useState, useEffect } from "react";
import {
  Key,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  LogIn,
} from "lucide-react";
import { mainDashboardHref, mainSignupHref, SITE_URL } from "@/lib/site";

type SubdomainAuthModalProps = {
  subdomainName: "VLSI" | "TOOLS" | "OPENROAD";
  /** After successful key validation */
  onAuthorize?: (apiKey: string) => void;
  /** Compact layout for dedicated /login page */
  compact?: boolean;
  /** Alias of onAuthorize (legacy intro pages) */
  onSuccess?: () => void;
  /** Optional close handler for modal chrome on intro pages */
  onClose?: () => void;
};

/**
 * Subdomain login: API key only.
 * Signup / account creation always on main domain (ace-seek.com).
 */
export function SubdomainAuthModal({
  subdomainName,
  onAuthorize,
  onSuccess,
  onClose,
  compact = false,
}: SubdomainAuthModalProps) {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [storedKey, setStoredKey] = useState<string | null>(null);
  const [keyStatus, setKeyStatus] = useState<
    "idle" | "validating" | "valid" | "invalid"
  >("idle");
  const [keyInfo, setKeyInfo] = useState<{ plan?: string } | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem("ace_seek_api_key");
    if (existing) {
      setStoredKey(existing);
      void validateKey(existing, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validateKey = async (keyToTest: string, isInitialMount = false) => {
    setKeyStatus("validating");
    try {
      const res = await fetch("/api/validate-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: keyToTest }),
      });
      const data = await res.json();
      if (res.ok && data.valid) {
        setKeyStatus("valid");
        setKeyInfo({ plan: data.plan || data.tier });
        setStoredKey(keyToTest);
        localStorage.setItem("ace_seek_api_key", keyToTest);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("ace_key_updated"));
        }
        if (!isInitialMount) {
          setIsSwitching(false);
          setApiKeyInput("");
          if (onAuthorize) onAuthorize(keyToTest);
          onSuccess?.();
        }
      } else {
        setKeyStatus("invalid");
      }
    } catch {
      setKeyStatus("invalid");
    }
  };

  const handleKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKeyInput.trim()) return;
    void validateKey(apiKeyInput.trim(), false);
  };

  const handleClearKey = () => {
    localStorage.removeItem("ace_seek_api_key");
    setStoredKey(null);
    setKeyStatus("idle");
    setKeyInfo(null);
    setApiKeyInput("");
    setIsSwitching(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("ace_key_updated"));
    }
  };

  return (
    <div
      className={`brutal-panel bg-[var(--surface-panel)] border-3 border-black shadow-[6px_6px_0_#000000] p-6 space-y-5 max-w-xl mx-auto ${
        compact ? "my-0" : "my-6"
      }`}
    >
      <div className="flex items-center justify-between border-b-3 border-black pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[var(--accent-cyan)]" />
          <h2 className="text-base font-black uppercase text-white tracking-wide">
            {subdomainName} · API Key License
          </h2>
        </div>
        <span className="brutal-badge brutal-badge-cyan">NO SIGNUP HERE</span>
      </div>

      <p className="text-xs text-slate-300 font-bold leading-relaxed">
        Enter your <b className="text-white">dashboard API key</b>{" "}
        (from {SITE_URL.replace("https://", "")}).
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-slate-200 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-[var(--brutal-yellow)]" />
            <span>{storedKey && !isSwitching ? "Active API License" : "Paste API License Key"}</span>
          </label>
          {keyStatus === "valid" && (
            <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Verified ({(keyInfo?.plan || "active").toUpperCase()})
            </span>
          )}
        </div>

        {storedKey && !isSwitching ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-950/40 border-2 border-emerald-500 rounded">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 truncate max-w-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Active: {storedKey.slice(0, 18)}…</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSwitching(true)}
                  className="text-[11px] font-bold text-sky-400 hover:underline uppercase"
                >
                  Switch Key
                </button>
                <span className="text-slate-600">·</span>
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-[11px] font-bold text-rose-400 hover:underline uppercase"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleKeySubmit} className="space-y-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                autoComplete="off"
                placeholder="ace_max_usr_… or ace_pro_usr_…"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="flex-1 bg-black border-2 border-slate-700 text-white text-xs font-mono px-3 py-2.5 rounded outline-none focus:border-[var(--accent-cyan)] select-all"
              />
              <button
                type="submit"
                disabled={keyStatus === "validating"}
                className="sk-btn sk-btn-primary !text-xs !py-2.5 !px-4 shrink-0 font-bold uppercase inline-flex items-center gap-1.5 justify-center"
              >
                <LogIn className="w-3.5 h-3.5" />
                {keyStatus === "validating" ? "Validating…" : "Authorize"}
              </button>
            </div>
            {storedKey && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsSwitching(false)}
                  className="text-[10px] text-slate-400 hover:text-white underline uppercase font-bold"
                >
                  Cancel (keep existing key)
                </button>
              </div>
            )}
          </form>
        )}

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

      <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t-2 border-slate-800">
        <a
          href={mainSignupHref()}
          target="_blank"
          rel="noreferrer"
          className="brutal-btn brutal-btn-yellow !text-[11px] font-black justify-center"
        >
          <span>Sign up on ace-seek.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
        <a
          href={mainDashboardHref()}
          target="_blank"
          rel="noreferrer"
          className="brutal-btn bg-white text-black hover:bg-slate-100 !text-[11px] font-black justify-center"
        >
          <span>Open dashboard · get key</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
