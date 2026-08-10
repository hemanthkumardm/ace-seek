/**
 * Plan entitlements for Doc Compiler / tools.
 * Free = open-source engines. Pro/Team = Pro engine + Exact look.
 */
import type { UserPlan } from "@/lib/user-store";
import { findUserByApiKey } from "@/lib/user-store";

export type PlanTier = UserPlan | "guest";

export type Entitlements = {
  tier: PlanTier;
  email?: string;
  name?: string;
  /** Layout-aware pdf2docx (editable Word) */
  canEditablePdfDocx: boolean;
  /** Page-image Exact look DOCX */
  canExactPdfDocx: boolean;
  /** Pro engine (higher DPI exact + future commercial converters) */
  canProEngine: boolean;
  maxExactDpi: number;
  defaultExactDpi: number;
  label: string;
};

const FREE: Entitlements = {
  tier: "free",
  canEditablePdfDocx: true,
  canExactPdfDocx: false,
  canProEngine: false,
  maxExactDpi: 100,
  defaultExactDpi: 100,
  label: "Free",
};

const PRO: Entitlements = {
  tier: "pro",
  canEditablePdfDocx: true,
  canExactPdfDocx: true,
  canProEngine: true,
  /** Print-grade exact look */
  maxExactDpi: 400,
  defaultExactDpi: 300,
  label: "Pro",
};

const TEAM: Entitlements = {
  ...PRO,
  tier: "team",
  label: "Team",
};

const GUEST: Entitlements = {
  ...FREE,
  tier: "guest",
  label: "Guest",
};

export function entitlementsForPlan(plan: PlanTier): Entitlements {
  switch (plan) {
    case "pro":
      return { ...PRO };
    case "team":
      return { ...TEAM };
    case "free":
      return { ...FREE };
    default:
      return { ...GUEST };
  }
}

/**
 * Resolve entitlements from an API key (ace_pro_usr_… / ace_team_usr_… / ace_free_usr_…).
 * Invalid key → guest (not free), so UI can prompt sign-in.
 */
export function entitlementsFromApiKey(apiKey: string | null | undefined): Entitlements {
  if (!apiKey || !apiKey.trim()) return entitlementsForPlan("guest");
  const user = findUserByApiKey(apiKey.trim());
  if (!user) return entitlementsForPlan("guest");
  const base = entitlementsForPlan(user.plan);
  return {
    ...base,
    email: user.email,
    name: user.name,
  };
}

/** Whether this key is a paid premium plan */
export function isPremiumPlan(tier: PlanTier): boolean {
  return tier === "pro" || tier === "team";
}
