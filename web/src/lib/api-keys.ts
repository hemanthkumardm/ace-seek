/**
 * Durable API license keys for subdomain tools.
 * Clerk users get a deterministic key (same on every device) from user id + plan.
 * Legacy in-memory user-store keys still work via entitlements lookup.
 */

import crypto from "crypto";
import type { UserPlan } from "@/lib/user-store";

function pepper(): string {
  return (
    process.env.ACE_API_KEY_PEPPER ||
    process.env.CLERK_SECRET_KEY ||
    "ace-seek-dev-pepper-change-me"
  );
}

function planPrefix(plan: UserPlan): string {
  if (plan === "pro") return "ace_pro_usr";
  if (plan === "team") return "ace_team_usr";
  return "ace_free_usr";
}

/** Encode Clerk user id into key body (strip optional user_ prefix) */
function encodeUserId(userId: string): string {
  return userId.startsWith("user_") ? userId.slice("user_".length) : userId;
}

function decodeUserId(idPart: string): string {
  if (idPart.startsWith("user_")) return idPart;
  // Clerk ids are typically user_<alphanum>
  return `user_${idPart}`;
}

/**
 * Deterministic personal API key for a signed-in user.
 * Multi-device: same id + plan → same key.
 * Format: ace_{free|pro|team}_usr_<idPart>_<16hex hmac>
 */
export function apiKeyForUserId(userId: string, plan: UserPlan = "free"): string {
  const h = crypto
    .createHmac("sha256", pepper())
    .update(`ace-seek|${userId}|${plan}`)
    .digest("hex")
    .slice(0, 16);
  return `${planPrefix(plan)}_${encodeUserId(userId)}_${h}`;
}

/**
 * Verify a key we issued and recover plan + userId.
 */
export function verifyIssuedApiKey(
  apiKey: string
): { ok: true; plan: UserPlan; userId: string } | { ok: false } {
  const m = apiKey
    .trim()
    .match(/^ace_(free|pro|team)_usr_(.+)_([a-f0-9]{16})$/);
  if (!m) return { ok: false };
  const plan = m[1] as UserPlan;
  const idPart = m[2];
  const candidates = [decodeUserId(idPart), idPart];
  for (const userId of candidates) {
    if (apiKeyForUserId(userId, plan) === apiKey.trim()) {
      return { ok: true, plan, userId };
    }
  }
  return { ok: false };
}

export function planFromApiKeyString(apiKey: string): UserPlan | null {
  const m = apiKey.trim().match(/^ace_(free|pro|team)_usr_/);
  if (!m) return null;
  return m[1] as UserPlan;
}
