import {
  entitlementsForPlan,
  entitlementsFromApiKey,
  type Entitlements,
} from "@/lib/entitlements";
import { verifyTrialApiKey } from "@/lib/api-keys";
import { findTrialByApiKey, isTrialActive } from "@/lib/trial-store";

/** Server-only: hydrates trial keys from Supabase (revoked / expired). */
export async function entitlementsFromApiKeyAsync(
  apiKey: string | null | undefined
): Promise<Entitlements> {
  if (!apiKey || !apiKey.trim()) return entitlementsForPlan("guest");
  const key = apiKey.trim();
  const trialSig = verifyTrialApiKey(key);
  if (trialSig.ok) {
    const stored = await findTrialByApiKey(key);
    if (stored?.status === "rejected") return entitlementsForPlan("guest");
    if (stored && stored.status === "approved" && !isTrialActive(stored)) {
      return entitlementsForPlan("guest");
    }
    if (stored && isTrialActive(stored)) {
      return {
        ...entitlementsForPlan("max"),
        email: stored.email,
        name: stored.name,
        trialExpiresAt: stored.trialExpiresAt || trialSig.expiresAt,
      };
    }
    return {
      ...entitlementsForPlan("max"),
      trialExpiresAt: trialSig.expiresAt,
    };
  }
  return entitlementsFromApiKey(key);
}
