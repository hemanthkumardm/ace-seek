"use client";

import { INTERVIEW_QUESTIONS_BANK } from "./vlsi-interview-masterclass-data";

const STORAGE_KEY = "ace_seek_interview_unlocked";
const STORAGE_PAYMENT_KEY = "ace_seek_interview_payment_id";
const STORAGE_ENTITLEMENT = "ace_seek_interview_entitlement";

/**
 * Checks whether the current user has unlocked the Masterclass bundle.
 */
export function isMasterclassUnlocked(): boolean {
  if (typeof window === "undefined") return false;

  try {
    // 1. Direct Masterclass purchase unlock (verified payment)
    const directUnlock = localStorage.getItem(STORAGE_KEY);
    if (directUnlock === "true" || directUnlock === "1") {
      return true;
    }

    // 2. Structured entitlement blob from verify-payment
    const entRaw = localStorage.getItem(STORAGE_ENTITLEMENT);
    if (entRaw) {
      const ent = JSON.parse(entRaw) as { unlocked?: boolean; hasInterviewMasterclass?: boolean };
      if (ent.unlocked || ent.hasInterviewMasterclass) return true;
    }

    // 3. Dedicated interview license key slot (or legacy marker)
    const interviewKey = localStorage.getItem("ace_seek_interview_key");
    if (interviewKey && interviewKey.trim().length > 8) {
      return true;
    }
    const rawKey =
      localStorage.getItem("ace_seek_api_key") || localStorage.getItem("ace_seek_interview_key");
    if (rawKey && rawKey.includes("_interview_")) {
      return true;
    }
  } catch {
    // Ignore storage errors
  }

  return false;
}

/**
 * Resets local test access (useful for developer testing locked state).
 */
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

/**
 * Persists the lifetime unlock upon verified Razorpay payment.
 * Also stores the issued API key so studios unlock and access can be restored on this browser.
 */
export function unlockMasterclass(
  paymentId?: string,
  email?: string,
  apiKey?: string
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
  if (paymentId) {
    localStorage.setItem(STORAGE_PAYMENT_KEY, paymentId);
  }
  if (email) {
    localStorage.setItem("ace_seek_interview_email", email);
  }
  if (apiKey && apiKey.trim()) {
    localStorage.setItem("ace_seek_interview_key", apiKey.trim());
    // Also activate workstation key if none present (Pro-tier companion key from verify)
    if (!localStorage.getItem("ace_seek_api_key")) {
      localStorage.setItem("ace_seek_api_key", apiKey.trim());
      window.dispatchEvent(new Event("ace_key_updated"));
    }
  }

  // Broadcast event so all tabs / components reactively unlock
  window.dispatchEvent(new Event("ace_seek_interview_access_updated"));
  window.dispatchEvent(new Event("storage"));
}

/**
 * Determines whether a specific question is unlocked as a free preview.
 * Free preview includes:
 * - Explicitly flagged questions or the 1st question of each domain.
 */
export function isQuestionFreePreview(questionId: string): boolean {
  const q = INTERVIEW_QUESTIONS_BANK.find((item) => item.id === questionId);
  return Boolean(q?.isFreeSample);
}
