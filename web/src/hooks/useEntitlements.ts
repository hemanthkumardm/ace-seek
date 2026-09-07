"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entitlements } from "@/lib/entitlements";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";

const KEY_STORAGE = "ace_seek_api_key";
const PLAN_STORAGE = "ace_seek_plan";

export type PublicEnt = ReturnType<typeof publicEntitlements>;

/**
 * Always start as **guest** so SSR HTML matches the first client paint.
 * Plan is resolved from Clerk **login session** (`/api/auth/me`), not from pasted API keys.
 */
function guestEnt(): PublicEnt {
  return publicEntitlements(entitlementsForPlan("guest"));
}

function applyPlanToState(
  plan: Entitlements["tier"],
  extra?: { email?: string; name?: string; entitlements?: PublicEnt }
): PublicEnt {
  if (
    extra?.entitlements &&
    extra.entitlements.tier &&
    extra.entitlements.tier !== "guest" &&
    extra.entitlements.tier === plan
  ) {
    return {
      ...extra.entitlements,
      email: extra.email ?? extra.entitlements.email,
      name: extra.name ?? extra.entitlements.name,
    };
  }
  const base = publicEntitlements(entitlementsForPlan(plan));
  return {
    ...base,
    email: extra?.email,
    name: extra?.name,
  };
}

export function useEntitlements() {
  const [apiKey, setApiKey] = useState("");
  const [ent, setEnt] = useState<PublicEnt>(guestEnt);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [authSource, setAuthSource] = useState<"guest" | "session" | "legacy-key">("guest");
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [planStatus, setPlanStatus] = useState<string>("active");
  const [planRenewsAt, setPlanRenewsAt] = useState<string | null>(null);
  const [hasInterviewMasterclass, setHasInterviewMasterclass] = useState(false);

  const setGuest = useCallback(() => {
    setEnt(guestEnt());
    setApiKey("");
    setAuthSource("guest");
    setIsSignedIn(false);
    setPlanStatus("active");
    setPlanRenewsAt(null);
    setHasInterviewMasterclass(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PLAN_STORAGE);
      localStorage.removeItem(KEY_STORAGE);
      localStorage.removeItem("ace_api_key");
    }
  }, []);

  /** Resolve plan from Clerk session via /api/auth/me */
  const refreshFromSession = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (!res.ok) {
        setGuest();
        setLoading(false);
        setReady(true);
        return false;
      }
      const data = await res.json();
      if (!data.authenticated || !data.user) {
        setGuest();
        setLoading(false);
        setReady(true);
        return false;
      }

      const plan = (data.user.plan || "free") as Entitlements["tier"];
      setEnt(
        applyPlanToState(plan, {
          email: data.user.email,
          name: data.user.name,
        })
      );
      setPlanStatus(String(data.user.planStatus || "active"));
      setPlanRenewsAt(
        typeof data.user.planRenewsAt === "string" ? data.user.planRenewsAt : null
      );
      setHasInterviewMasterclass(Boolean(data.user.hasInterviewMasterclass));
      setAuthSource("session");
      setIsSignedIn(true);
      localStorage.setItem(PLAN_STORAGE, plan);

      // Silently sync derived key for API routes that still expect x-api-key.
      // Users never paste this — plan always comes from the login session.
      if (typeof data.user.apiKey === "string" && data.user.apiKey.trim()) {
        const key = data.user.apiKey.trim();
        setApiKey(key);
        localStorage.setItem(KEY_STORAGE, key);
        window.dispatchEvent(new Event("ace_key_updated"));
      }

      setLoading(false);
      setReady(true);
      return true;
    } catch {
      setError("Could not load account");
      setGuest();
      setLoading(false);
      setReady(true);
      return false;
    }
  }, [setGuest]);

  /**
   * Legacy paste path (automation / emergency).
   * When a session exists, session plan wins over key-encoded plan.
   */
  const refreshFromKey = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        return refreshFromSession();
      }

      // Prefer session if logged in
      const sessionOk = await refreshFromSession();
      if (sessionOk) {
        localStorage.setItem(KEY_STORAGE, trimmed);
        setApiKey(trimmed);
        return true;
      }

      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/validate-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: trimmed }),
        });
        const data = await res.json();
        if (!res.ok || !data.valid) {
          setError(data.error || "Invalid API key");
          setGuest();
          setLoading(false);
          setReady(true);
          return false;
        }
        setApiKey(trimmed);
        localStorage.setItem(KEY_STORAGE, trimmed);
        const plan = (data.plan || data.tier || "free") as Entitlements["tier"];
        localStorage.setItem(PLAN_STORAGE, plan);
        setEnt(
          applyPlanToState(plan, {
            email: data.email,
            name: data.name,
            entitlements: data.entitlements,
          })
        );
        setAuthSource("legacy-key");
        setIsSignedIn(false);
        setLoading(false);
        setReady(true);
        return true;
      } catch {
        setError("Could not validate API key");
        setGuest();
        setLoading(false);
        setReady(true);
        return false;
      }
    },
    [refreshFromSession, setGuest]
  );

  useEffect(() => {
    void refreshFromSession();

    const onBump = () => {
      void refreshFromSession();
    };
    window.addEventListener("ace_seek_auth_updated", onBump);
    window.addEventListener("storage", onBump);
    return () => {
      window.removeEventListener("ace_seek_auth_updated", onBump);
      window.removeEventListener("storage", onBump);
    };
  }, [refreshFromSession]);

  const clearKey = useCallback(() => {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem("ace_api_key");
    localStorage.removeItem(PLAN_STORAGE);
    void refreshFromSession();
  }, [refreshFromSession]);

  return {
    apiKey,
    ent,
    loading,
    ready,
    error,
    authSource,
    refreshFromKey,
    refreshFromSession,
    clearKey,
    isGuest: ent.tier === "guest",
    isFree: ent.tier === "free",
    isPro: ent.tier === "pro",
    isMax: ent.tier === "max",
    isTeam: ent.tier === "team",
    isPremium: ent.tier === "pro" || ent.tier === "max" || ent.tier === "team",
    isUnlocked: ent.tier === "max" || ent.tier === "team",
    isSignedIn,
    planStatus,
    planRenewsAt,
    hasInterviewMasterclass,
  };
}
