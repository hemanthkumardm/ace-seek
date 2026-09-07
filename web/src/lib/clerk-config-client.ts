/** Client-safe Clerk publishable-key check (no secret). */
export function isClerkConfiguredClient(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());
}
