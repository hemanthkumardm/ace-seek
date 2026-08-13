/**
 * Supabase API Key Persistence & Lifecycle Management
 * Manages Free, Trial (7-day on first use), and Paid license keys in Supabase.
 */

import { getSupabaseAdmin } from "./supabase/server";
import { logger } from "./telemetry";

export interface DbApiKeyRecord {
  id: string;
  user_id: string;
  email: string;
  key_type: "free" | "trial" | "paid";
  api_key: string;
  tier: "free" | "pro" | "max" | "team";
  status: "active" | "revoked" | "expired";
  created_at: string;
  first_used_at: string | null;
  expires_at: string | null;
}

/**
 * Fetch all API keys assigned to a given user or email from Supabase.
 */
export async function getUserKeysFromDb(userId: string, email?: string): Promise<DbApiKeyRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  try {
    let query = supabase.from("user_api_keys").select("*").order("created_at", { ascending: false });
    if (email) {
      query = query.or(`user_id.eq.${userId},email.eq.${email}`);
    } else {
      query = query.eq("user_id", userId);
    }

    const { data, error } = await query;
    if (error) {
      logger.error("supabase.get_user_keys_error", { userId, error });
      return [];
    }
    return (data as DbApiKeyRecord[]) || [];
  } catch (err) {
    logger.error("supabase.get_user_keys_exception", { userId }, err);
    return [];
  }
}

/**
 * Fetch specific API key record by exact key string.
 */
export async function getApiKeyRecordFromDb(apiKey: string): Promise<DbApiKeyRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("user_api_keys")
      .select("*")
      .eq("api_key", apiKey)
      .single();

    if (error || !data) return null;
    return data as DbApiKeyRecord;
  } catch (err) {
    logger.error("supabase.get_key_exception", { apiKeyPrefix: apiKey.slice(0, 15) }, err);
    return null;
  }
}

/**
 * Save / Upsert new API key record into Supabase.
 */
export async function saveApiKeyToDb(params: {
  userId: string;
  email: string;
  keyType: "free" | "trial" | "paid";
  apiKey: string;
  tier: "free" | "pro" | "max" | "team";
  expiresAt?: Date | string | null;
}): Promise<DbApiKeyRecord | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const payload = {
      user_id: params.userId,
      email: params.email.toLowerCase(),
      key_type: params.keyType,
      api_key: params.apiKey,
      tier: params.tier,
      status: "active",
      expires_at: params.expiresAt ? new Date(params.expiresAt).toISOString() : null,
    };

    const { data, error } = await supabase
      .from("user_api_keys")
      .upsert(payload, { onConflict: "api_key" })
      .select()
      .single();

    if (error) {
      logger.error("supabase.save_key_error", { params, error });
      return null;
    }

    logger.info("supabase.key_saved", { apiKeyPrefix: params.apiKey.slice(0, 15), keyType: params.keyType });
    return data as DbApiKeyRecord;
  } catch (err) {
    logger.error("supabase.save_key_exception", { params }, err);
    return null;
  }
}

/**
 * Activate a trial key on its FIRST USE.
 * Sets first_used_at = NOW() and expires_at = NOW() + 7 DAYS.
 */
export async function activateTrialKeyFirstUse(apiKey: string): Promise<{
  active: boolean;
  firstUsedAt: string;
  expiresAt: string;
  daysRemaining: number;
} | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const rec = await getApiKeyRecordFromDb(apiKey);
  const now = new Date();

  // If already used, check existing expiration
  if (rec && rec.first_used_at && rec.expires_at) {
    const expires = new Date(rec.expires_at);
    const isExpired = now >= expires;

    if (isExpired && rec.status !== "expired") {
      await supabase.from("user_api_keys").update({ status: "expired" }).eq("api_key", apiKey);
    }

    const diffMs = expires.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return {
      active: !isExpired && rec.status === "active",
      firstUsedAt: rec.first_used_at,
      expiresAt: rec.expires_at,
      daysRemaining,
    };
  }

  // FIRST USE DETECTED! Calculate 7 days from now.
  const firstUsedAtDate = now;
  const expiresAtDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  try {
    const { error } = await supabase
      .from("user_api_keys")
      .update({
        first_used_at: firstUsedAtDate.toISOString(),
        expires_at: expiresAtDate.toISOString(),
        status: "active",
      })
      .eq("api_key", apiKey);

    if (error) {
      logger.error("supabase.activate_trial_error", { apiKeyPrefix: apiKey.slice(0, 15), error });
    } else {
      logger.info("supabase.trial_key_activated", {
        apiKeyPrefix: apiKey.slice(0, 15),
        expiresAt: expiresAtDate.toISOString(),
      });
    }

    return {
      active: true,
      firstUsedAt: firstUsedAtDate.toISOString(),
      expiresAt: expiresAtDate.toISOString(),
      daysRemaining: 7,
    };
  } catch (err) {
    logger.error("supabase.activate_trial_exception", { apiKeyPrefix: apiKey.slice(0, 15) }, err);
    return null;
  }
}

/**
 * Manually revoke or set status of an API key in Supabase (Admin function).
 */
export async function updateApiKeyStatusInDb(
  apiKey: string,
  status: "active" | "revoked" | "expired"
): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from("user_api_keys")
      .update({ status })
      .eq("api_key", apiKey);

    if (error) {
      logger.error("supabase.update_status_error", { apiKeyPrefix: apiKey.slice(0, 15), status, error });
      return false;
    }
    return true;
  } catch (err) {
    logger.error("supabase.update_status_exception", { apiKeyPrefix: apiKey.slice(0, 15), status }, err);
    return false;
  }
}
