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
  if (plan === "team") return "ace_team_usr";
  if (plan === "max") return "ace_max_usr";
  if (plan === "pro") return "ace_pro_usr";
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
 * Format: ace_{free|pro|max|team}_usr_<idPart>_<16hex hmac>
 */
export function apiKeyForUserId(userId: string, plan: UserPlan = "free"): string {
  const h = crypto
    .createHmac("sha256", pepper())
    .update(`ace-seek|${userId}|${plan}`)
    .digest("hex")
    .slice(0, 16);
  return `${planPrefix(plan)}_${encodeUserId(userId)}_${h}`;
}

export function verifyIssuedApiKey(
  apiKey: string
): { ok: true; plan: UserPlan; userId: string } | { ok: false } {
  const m = apiKey
    .trim()
    .match(/^ace_(free|pro|max|team)_usr_(.+)_([a-f0-9]{16})$/);
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
  const m = apiKey.trim().match(/^ace_(free|pro|max|team)_usr_/);
  if (!m) return null;
  return m[1] as UserPlan;
}

/** Manual Max trial: 7 days from approval, not from form submit. */
export const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Format: ace_max_trial_<requestId>_<expUnix>_<16hex hmac>
 * Expiry is baked into the key so subdomain tools can reject after 7 days.
 */
export function generateTrialApiKey(requestId: string, expiresAt: number): string {
  const exp = Math.floor(expiresAt / 1000);
  const h = crypto
    .createHmac("sha256", pepper())
    .update(`ace-seek-trial|${requestId}|${exp}`)
    .digest("hex")
    .slice(0, 16);
  return `ace_max_trial_${requestId}_${exp}_${h}`;
}

export function verifyTrialApiKey(
  apiKey: string
):
  | { ok: true; requestId: string; expiresAt: number }
  | { ok: false; reason: "expired" | "invalid" } {
  const m = apiKey.trim().match(/^ace_max_trial_([a-z0-9]+)_(\d+)_([a-f0-9]{16})$/);
  if (!m) return { ok: false, reason: "invalid" };
  const requestId = m[1];
  const exp = Number(m[2]);
  if (!Number.isFinite(exp) || exp <= 0) return { ok: false, reason: "invalid" };
  const expected = generateTrialApiKey(requestId, exp * 1000);
  if (expected !== apiKey.trim()) return { ok: false, reason: "invalid" };
  if (Date.now() > exp * 1000) return { ok: false, reason: "expired" };
  return { ok: true, requestId, expiresAt: exp * 1000 };
}
