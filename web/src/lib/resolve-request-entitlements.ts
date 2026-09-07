import { auth, currentUser } from "@clerk/nextjs/server";
import type { Entitlements } from "@/lib/entitlements";
import { entitlementsForPlan } from "@/lib/entitlements";
import { planFromClerkMetadata } from "@/lib/clerk-config";
import { entitlementsFromApiKeyAsync } from "@/lib/entitlements-server";
import { isClerkConfigured } from "@/lib/clerk-config";

export type ResolvedAuth = {
  entitlements: Entitlements;
  source: "session" | "api-key" | "guest";
  userId?: string;
};

/**
 * Prefer Clerk session plan for browser requests.
 * Fall back to a verified API key for automation only.
 * Never invent free access for anonymous guests beyond guest entitlements.
 */
export async function resolveRequestEntitlements(opts: {
  apiKey?: string | null;
}): Promise<ResolvedAuth> {
  if (isClerkConfigured()) {
    try {
      const { userId } = await auth();
      if (userId) {
        const user = await currentUser();
        const meta = {
          ...(user?.publicMetadata || {}),
          ...(user?.privateMetadata || {}),
        } as Record<string, unknown>;
        const plan = planFromClerkMetadata(meta);
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses?.[0]?.emailAddress ||
          undefined;
        const name =
          [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
          user?.username ||
          email;
        return {
          source: "session",
          userId,
          entitlements: {
            ...entitlementsForPlan(plan),
            email,
            name: name || undefined,
          },
        };
      }
    } catch {
      // fall through to API key
    }
  }

  const key = opts.apiKey?.trim();
  if (key) {
    const entitlements = await entitlementsFromApiKeyAsync(key);
    if (entitlements.tier !== "guest") {
      return { source: "api-key", entitlements };
    }
  }

  return { source: "guest", entitlements: entitlementsForPlan("guest") };
}
