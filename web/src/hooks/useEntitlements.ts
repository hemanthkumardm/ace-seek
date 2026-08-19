"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entitlements } from "@/lib/entitlements";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";

const KEY_STORAGE = "ace_seek_api_key";
const PLAN_STORAGE = "ace_seek_plan";

export type PublicEnt = ReturnType<typeof publicEntitlements>;

/**
 * Always start as **guest** so SSR HTML matches the first client paint.
 * Dev “team” default and localStorage keys apply only after mount (useEffect).
 * That avoids PlanPill / gate hydration mismatches (Guest vs Team/Crown).
 */
function guestEnt(): PublicEnt {
  return publicEntitlements(entitlementsForPlan("guest"));
}

function isLocalDevClient(): boolean {
  if (typeof window === "undefined") return false;
  return (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export function useEntitlements() {
  const [apiKey, setApiKey] = useState("");
  // SSR + first client paint: always guest (hydration-safe)
  const [ent, setEnt] = useState<PublicEnt>(guestEnt);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  /** True after first client entitlement resolution (key or default) */
  const [ready, setReady] = useState(false);

  const applyDefaultPlan = useCallback(() => {
    // Dev convenience only after mount — never in useState initializer
    const plan = isLocalDevClient() ? "team" : "guest";
    setEnt(publicEntitlements(entitlementsForPlan(plan)));
    setApiKey("");
  }, []);

  const refreshFromKey = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      if (!trimmed) {
        applyDefaultPlan();
        setLoading(false);
        setReady(true);
        return false;
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
          applyDefaultPlan();
          localStorage.removeItem(KEY_STORAGE);
          localStorage.removeItem(PLAN_STORAGE);
          setLoading(false);
          setReady(true);
          return false;
        }
        setApiKey(trimmed);
        localStorage.setItem(KEY_STORAGE, trimmed);
        const plan = (data.plan || data.tier || "free") as Entitlements["tier"];
        localStorage.setItem(PLAN_STORAGE, plan);
        if (
          data.entitlements &&
          data.entitlements.tier &&
          data.entitlements.tier !== "guest" &&
          data.entitlements.tier === plan
        ) {
          setEnt(data.entitlements as PublicEnt);
        } else {
          const base = publicEntitlements(entitlementsForPlan(plan));
          setEnt({
            ...base,
            email: data.email,
            name: data.name,
          });
        }
        setLoading(false);
        setReady(true);
        return true;
      } catch {
        setError("Could not validate API key");
        applyDefaultPlan();
        setLoading(false);
        setReady(true);
        return false;
      }
    },
    [applyDefaultPlan]
  );

  useEffect(() => {
    const handleKeyChange = () => {
      const saved =
        localStorage.getItem(KEY_STORAGE) || localStorage.getItem("ace_api_key");
      if (saved) {
        void refreshFromKey(saved);
      } else {
        applyDefaultPlan();
        setLoading(false);
        setReady(true);
      }
    };
    handleKeyChange();
    window.addEventListener("storage", handleKeyChange);
    window.addEventListener("ace_key_updated", handleKeyChange);
    return () => {
      window.removeEventListener("storage", handleKeyChange);
      window.removeEventListener("ace_key_updated", handleKeyChange);
    };
  }, [refreshFromKey, applyDefaultPlan]);

  const clearKey = useCallback(() => {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem("ace_api_key");
    localStorage.removeItem(PLAN_STORAGE);
    applyDefaultPlan();
    setError("");
    setReady(true);
  }, [applyDefaultPlan]);

  return {
    apiKey,
    ent,
    loading,
    /** Entitlements resolved on client (use for PlanPill to avoid flash/mismatch) */
    ready,
    error,
    refreshFromKey,
    clearKey,
    isGuest: ent.tier === "guest",
    isFree: ent.tier === "free",
    isPro: ent.tier === "pro",
    isMax: ent.tier === "max",
    isTeam: ent.tier === "team",
    isPremium: ent.tier === "pro" || ent.tier === "max" || ent.tier === "team",
    isUnlocked: ent.tier === "max" || ent.tier === "team",
  };
}
