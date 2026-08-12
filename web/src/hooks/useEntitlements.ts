"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entitlements } from "@/lib/entitlements";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";

const KEY_STORAGE = "ace_seek_api_key";
const PLAN_STORAGE = "ace_seek_plan";

export type PublicEnt = ReturnType<typeof publicEntitlements>;

export function useEntitlements() {
  const isDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      process.env.NODE_ENV === "development");

  const [apiKey, setApiKey] = useState("");
  const [ent, setEnt] = useState<PublicEnt>(() =>
    publicEntitlements(entitlementsForPlan(isDev ? "team" : "guest"))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyDefaultPlan = useCallback(() => {
    setEnt(publicEntitlements(entitlementsForPlan(isDev ? "team" : "guest")));
    setApiKey("");
  }, [isDev]);

  const refreshFromKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      applyDefaultPlan();
      setLoading(false);
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
        return false;
      }
      setApiKey(trimmed);
      localStorage.setItem(KEY_STORAGE, trimmed);
      localStorage.setItem(PLAN_STORAGE, data.plan || data.tier || "free");
      // Prefer server entitlements payload if present
      if (data.entitlements) {
        setEnt(data.entitlements as PublicEnt);
      } else {
        const plan = (data.plan || data.tier || "free") as Entitlements["tier"];
        const base = publicEntitlements(entitlementsForPlan(plan));
        setEnt({
          ...base,
          email: data.email,
          name: data.name,
        });
      }
      setLoading(false);
      return true;
    } catch {
      setError("Could not validate API key");
      applyDefaultPlan();
      setLoading(false);
      return false;
    }
  }, [applyDefaultPlan]);

  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORAGE) || localStorage.getItem("ace_api_key");
    if (saved) {
      void refreshFromKey(saved);
    } else {
      applyDefaultPlan();
      setLoading(false);
    }
  }, [refreshFromKey, applyDefaultPlan]);

  const clearKey = useCallback(() => {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem("ace_api_key");
    localStorage.removeItem(PLAN_STORAGE);
    applyDefaultPlan();
    setError("");
  }, [applyDefaultPlan]);

  return {
    apiKey,
    ent,
    loading,
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
