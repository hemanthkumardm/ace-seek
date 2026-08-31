/**
 * Clerk is enabled when publishable + secret keys are present.
 * Free Hobby tier is enough for early multi-user / multi-device auth.
 * https://clerk.com/pricing
 */

export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

/** Plan from Clerk publicMetadata.plan | privateMetadata.plan (default free) */
export function planFromClerkMetadata(
  meta: Record<string, unknown> | null | undefined
): "free" | "pro" | "max" | "team" {
  const raw = meta?.plan;
  // Trial Max keys are emailed only — never attach them to the dashboard plan.
  if (meta?.trialExpiresAt || meta?.trial_expires_at) {
    if (raw === "pro" || raw === "team") return raw;
    return "free";
  }
  if (raw === "pro" || raw === "max" || raw === "team" || raw === "free") return raw;
  return "free";
}
