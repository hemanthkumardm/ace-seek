/**
 * Ace-Seek Cross-Subdomain Auth & Entitlement Helper
 */

export type UserTier = "guest" | "free" | "pro" | "max" | "team";

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
  hasProEngine: boolean;
  hasExactPdfDocx: boolean;
  hasTeamSeats: boolean;
  hasSso: boolean;
};

export const TIER_PERMISSIONS: Record<UserTier, TierPermissions> = {
  guest: {
    tier: "guest",
    maxCompilesPerDay: 3,
    hasPriorityQueue: false,
    hasPrivateVault: false,
    hasApiAccess: false,
    hasProEngine: false,
    hasExactPdfDocx: false,
    hasTeamSeats: false,
    hasSso: false,
  },
  free: {
    tier: "free",
    maxCompilesPerDay: 25,
    hasPriorityQueue: false,
    hasPrivateVault: false,
    hasApiAccess: true,
    hasProEngine: false,
    hasExactPdfDocx: false,
    hasTeamSeats: false,
    hasSso: false,
  },
  pro: {
    tier: "pro",
    maxCompilesPerDay: 500,
    hasPriorityQueue: true,
    hasPrivateVault: true,
    hasApiAccess: true,
    hasProEngine: true,
    hasExactPdfDocx: true,
    hasTeamSeats: false,
    hasSso: false,
  },
  max: {
    tier: "max",
    maxCompilesPerDay: Number.POSITIVE_INFINITY,
    hasPriorityQueue: true,
    hasPrivateVault: true,
    hasApiAccess: true,
    hasProEngine: true,
    hasExactPdfDocx: true,
    hasTeamSeats: false,
    hasSso: false,
  },
  team: {
    tier: "team",
    maxCompilesPerDay: Number.POSITIVE_INFINITY,
    hasPriorityQueue: true,
    hasPrivateVault: true,
    hasApiAccess: true,
    hasProEngine: true,
    hasExactPdfDocx: true,
    hasTeamSeats: true,
    hasSso: true,
  },
};

export const SESSION_COOKIE_NAME = "ace_seek_session";

export function getSessionCookieDomain(host?: string | null): string {
  if (!host) return "";
  const h = host.split(":")[0].toLowerCase();
  if (h.endsWith("ace-seek.com")) return ".ace-seek.com";
  return "";
}

export function createMockSession(
  email = "engineer@company.com",
  tier: UserTier = "free"
): UserSession {
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
