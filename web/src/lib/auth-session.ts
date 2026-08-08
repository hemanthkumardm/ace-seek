/**
 * Ace-Seek Cross-Subdomain Auth & Entitlement Helper
 *
 * Manages shared identity session tokens across:
 *   - apex domain (ace-seek.com)
 *   - doc.ace-seek.com
 *   - timing.ace-seek.com
 *   - scripts.ace-seek.com
 */

export type UserTier = "guest" | "free" | "pro" | "team";

export type UserSession = {
  userId: string;
  email: string;
  name: string;
  tier: UserTier;
  createdAt: number;
  expiresAt: number;
};

export type TierPermissions = {
  tier: UserTier;
  maxCompilesPerDay: number;
  hasPriorityQueue: boolean;
  hasPrivateVault: boolean;
  hasApiAccess: boolean;
};

export const TIER_PERMISSIONS: Record<UserTier, TierPermissions> = {
  guest: {
    tier: "guest",
    maxCompilesPerDay: 5,
    hasPriorityQueue: false,
    hasPrivateVault: false,
    hasApiAccess: false,
  },
  free: {
    tier: "free",
    maxCompilesPerDay: 25,
    hasPriorityQueue: false,
    hasPrivateVault: false,
    hasApiAccess: false,
  },
  pro: {
    tier: "pro",
    maxCompilesPerDay: Infinity,
    hasPriorityQueue: true,
    hasPrivateVault: true,
    hasApiAccess: true,
  },
  team: {
    tier: "team",
    maxCompilesPerDay: Infinity,
    hasPriorityQueue: true,
    hasPrivateVault: true,
    hasApiAccess: true,
  },
};

export const SESSION_COOKIE_NAME = "ace_seek_session";

/** Domain attribute for cookie setting: .ace-seek.com in prod */
export function getSessionCookieDomain(host?: string | null): string {
  if (!host) return "";
  const h = host.split(":")[0].toLowerCase();
  if (h.endsWith("ace-seek.com")) return ".ace-seek.com";
  return ""; // default host-only in local dev
}

/** Mock session builder for preview state */
export function createMockSession(email = "engineer@company.com", tier: UserTier = "free"): UserSession {
  return {
    userId: "usr_" + Math.random().toString(36).slice(2, 9),
    email,
    name: email.split("@")[0],
    tier,
    createdAt: Date.now(),
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  };
}

export function getTierPermissions(tier: UserTier = "guest"): TierPermissions {
  return TIER_PERMISSIONS[tier] || TIER_PERMISSIONS.guest;
}
