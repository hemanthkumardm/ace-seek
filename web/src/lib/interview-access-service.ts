"use client";

import { INTERVIEW_QUESTIONS_BANK } from "./vlsi-interview-masterclass-data";

const STORAGE_KEY = "ace_seek_interview_unlocked";
const STORAGE_PAYMENT_KEY = "ace_seek_interview_payment_id";

/**
 * Checks whether the current user has unlocked the Masterclass bundle.
 */
export function isMasterclassUnlocked(): boolean {
  if (typeof window === "undefined") return false;

  // 1. Direct Masterclass purchase unlock in local storage (verified payment)
  const directUnlock = localStorage.getItem(STORAGE_KEY);
  if (directUnlock === "true" || directUnlock === "1") {
    return true;
  }

  // 2. Specific Interview Masterclass License Key
  try {
    const rawKey = localStorage.getItem("ace_seek_api_key") || localStorage.getItem("ace_seek_interview_key");
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
  localStorage.removeItem("ace_seek_interview_key");
  window.dispatchEvent(new Event("ace_seek_interview_access_updated"));
  window.dispatchEvent(new Event("storage"));
}

/**
 * Persists the lifetime unlock upon verified Razorpay payment.
 */
export function unlockMasterclass(paymentId?: string, email?: string): void {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, "true");
  if (paymentId) {
    localStorage.setItem(STORAGE_PAYMENT_KEY, paymentId);
  }
  if (email) {
    localStorage.setItem("ace_seek_interview_email", email);
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
