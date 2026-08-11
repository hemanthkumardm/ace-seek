"use client";

import { useCallback, useEffect, useState } from "react";
import type { Entitlements } from "@/lib/entitlements";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";

const KEY_STORAGE = "ace_seek_api_key";
const PLAN_STORAGE = "ace_seek_plan";

export type PublicEnt = ReturnType<typeof publicEntitlements>;

export function useEntitlements() {
  const [apiKey, setApiKey] = useState("");
  const [ent, setEnt] = useState<PublicEnt>(() =>
    publicEntitlements(entitlementsForPlan("guest"))
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyGuest = useCallback(() => {
    setEnt(publicEntitlements(entitlementsForPlan("guest")));
    setApiKey("");
  }, []);

  const refreshFromKey = useCallback(async (key: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      applyGuest();
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
        applyGuest();
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
      applyGuest();
      setLoading(false);
      return false;
    }
  }, [applyGuest]);

  useEffect(() => {
    const saved = localStorage.getItem(KEY_STORAGE) || localStorage.getItem("ace_api_key");
    if (saved) {
      void refreshFromKey(saved);
    } else {
      applyGuest();
      setLoading(false);
    }
  }, [refreshFromKey, applyGuest]);

  const clearKey = useCallback(() => {
    localStorage.removeItem(KEY_STORAGE);
    localStorage.removeItem("ace_api_key");
    localStorage.removeItem(PLAN_STORAGE);
    applyGuest();
    setError("");
  }, [applyGuest]);

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
