"use client";

const STORAGE_KEY = "ace_seek_interview_unlocked";
const STORAGE_PAYMENT_KEY = "ace_seek_interview_payment_id";
const STORAGE_ENTITLEMENT = "ace_seek_interview_entitlement";

/**
 * Local cache of unlock (set after verified purchase).
 * Source of truth is Clerk `hasInterviewMasterclass` via /api/auth/me + catalog API.
 */
export function isMasterclassUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const directUnlock = localStorage.getItem(STORAGE_KEY);
    if (directUnlock === "true" || directUnlock === "1") return true;
    const entRaw = localStorage.getItem(STORAGE_ENTITLEMENT);
    if (entRaw) {
      const ent = JSON.parse(entRaw) as {
        unlocked?: boolean;
        hasInterviewMasterclass?: boolean;
      };
      if (ent.unlocked || ent.hasInterviewMasterclass) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

/** Sync local cache from account session (call after /api/auth/me or catalog). */
export function syncInterviewUnlockFromAccount(hasInterviewMasterclass: boolean): void {
  if (typeof window === "undefined") return;
  if (hasInterviewMasterclass) {
    localStorage.setItem(STORAGE_KEY, "true");
    localStorage.setItem(
      STORAGE_ENTITLEMENT,
      JSON.stringify({
        unlocked: true,
        hasInterviewMasterclass: true,
        syncedAt: new Date().toISOString(),
      })
    );
  }
  window.dispatchEvent(new Event("ace_seek_interview_access_updated"));
}

export function lockMasterclassForTesting(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_PAYMENT_KEY);
  localStorage.removeItem(STORAGE_ENTITLEMENT);
  localStorage.removeItem("ace_seek_interview_key");
  localStorage.removeItem("ace_seek_interview_email");
  window.dispatchEvent(new Event("ace_seek_interview_access_updated"));
  window.dispatchEvent(new Event("storage"));
}

export function unlockMasterclass(
  paymentId?: string,
  email?: string,
  _apiKey?: string
): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, "true");
  localStorage.setItem(
    STORAGE_ENTITLEMENT,
    JSON.stringify({
      unlocked: true,
      hasInterviewMasterclass: true,
      paymentId: paymentId || null,
      email: email || null,
      unlockedAt: new Date().toISOString(),
    })
  );
  if (paymentId) localStorage.setItem(STORAGE_PAYMENT_KEY, paymentId);
  if (email) localStorage.setItem("ace_seek_interview_email", email);

  window.dispatchEvent(new Event("ace_seek_interview_access_updated"));
  window.dispatchEvent(new Event("ace_seek_auth_updated"));
  window.dispatchEvent(new Event("storage"));
}
