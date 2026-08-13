/**
 * Durable API license keys for subdomain tools.
 * Clerk users get deterministic keys from user id + plan type.
 * Supports Free, Trial (7-day on first use), Pro, Max, and Team tiers.
 */

import crypto from "crypto";
import type { UserPlan } from "@/lib/user-store";

export type ExtendedPlan = UserPlan | "trial";

function pepper(): string {
  return (
    process.env.ACE_API_KEY_PEPPER ||
    process.env.CLERK_SECRET_KEY ||
    "ace-seek-dev-pepper-change-me"
  );
}

function planPrefix(plan: ExtendedPlan): string {
  if (plan === "team") return "ace_team_usr";
  if (plan === "max") return "ace_max_usr";
  if (plan === "pro") return "ace_pro_usr";
  if (plan === "trial") return "ace_trial_usr";
  return "ace_free_usr";
}

function encodeUserId(userId: string): string {
  return userId.startsWith("user_") ? userId.slice("user_".length) : userId;
}

function decodeUserId(idPart: string): string {
  if (idPart.startsWith("user_")) return idPart;
  return `user_${idPart}`;
}

/**
 * Format: ace_{free|trial|pro|max|team}_usr_<idPart>_<16hex hmac>
 */
export function apiKeyForUserId(userId: string, plan: ExtendedPlan = "free"): string {
  const h = crypto
    .createHmac("sha256", pepper())
    .update(`ace-seek|${userId}|${plan}`)
    .digest("hex")
    .slice(0, 16);
  return `${planPrefix(plan)}_${encodeUserId(userId)}_${h}`;
}

/**
 * Generate both Permanent Free Key and 7-Day Pro Trial Key for a user
 */
export function generateUserDualKeys(userId: string): { freeKey: string; trialKey: string } {
  return {
    freeKey: apiKeyForUserId(userId, "free"),
    trialKey: apiKeyForUserId(userId, "trial"),
  };
}

export function verifyIssuedApiKey(
  apiKey: string
): { ok: true; plan: ExtendedPlan; userId: string } | { ok: false } {
  const m = apiKey
    .trim()
    .match(/^ace_(free|trial|pro|max|team)_usr_(.+)_([a-f0-9]{16})$/);
  if (!m) return { ok: false };
  const plan = m[1] as ExtendedPlan;
  const idPart = m[2];
  const candidates = [decodeUserId(idPart), idPart];
  for (const userId of candidates) {
    if (apiKeyForUserId(userId, plan) === apiKey.trim()) {
      return { ok: true, plan, userId };
    }
  }
  return { ok: false };
}

export function planFromApiKeyString(apiKey: string): ExtendedPlan | null {
  const m = apiKey.trim().match(/^ace_(free|trial|pro|max|team)_usr_/);
  if (!m) return null;
  return m[1] as ExtendedPlan;
}
