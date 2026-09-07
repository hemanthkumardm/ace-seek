/**
 * Clerk is enabled when publishable + secret keys are present.
 */

import { effectivePlanFromMetadata } from "@/lib/subscription-plan";

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

/** Effective SaaS plan from Clerk metadata (respects status + renewsAt). */
export function planFromClerkMetadata(
  meta: Record<string, unknown> | null | undefined
): "free" | "pro" | "max" | "team" {
  return effectivePlanFromMetadata(meta);
}
