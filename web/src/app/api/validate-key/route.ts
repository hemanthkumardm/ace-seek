import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey, findUserByEmail } from "@/lib/user-store";
import { verifyIssuedApiKey } from "@/lib/api-keys";
import {
  entitlementsFromApiKey,
  publicEntitlements,
  entitlementsForPlan,
} from "@/lib/entitlements";

/**
 * Validate dashboard API keys for subdomain login (vlsi / tools).
 * Returns plan + full public entitlements matrix for client-side UI locks.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const apiKey = String(body.apiKey || "").trim();

    if (!apiKey) {
      return NextResponse.json(
        { valid: false, error: "API Key is required" },
        { status: 400 }
      );
    }

    const isDevMode = process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

    // 1. Dev test keys and plan shortcuts (development mode only)
    if (isDevMode) {
      const lower = apiKey.toLowerCase();
      if (
        lower === "dev" ||
        lower === "dev_key" ||
        lower === "admin" ||
        lower === "team" ||
        lower === "local" ||
        lower === "max" ||
        lower === "pro" ||
        lower === "free"
      ) {
        const targetPlan = lower === "free" ? "free" : lower === "pro" ? "pro" : lower === "max" ? "max" : "team";
        const ent = entitlementsForPlan(targetPlan);
        return NextResponse.json({
          valid: true,
          plan: ent.tier,
          tier: ent.tier,
          email: ent.email || `${targetPlan}@ace-seek.com`,
          name: ent.name || `${ent.label} Developer`,
          apiKey,
          entitlements: publicEntitlements(ent),
        });
      }

      // Demo email lookup (e.g. user enters free@ace-seek.com in dev)
      const userByEmail = findUserByEmail(apiKey);
      if (userByEmail) {
        const ent = {
          ...entitlementsForPlan(userByEmail.plan),
          email: userByEmail.email,
          name: userByEmail.name,
        };
        return NextResponse.json({
          valid: true,
          plan: userByEmail.plan,
          tier: userByEmail.plan,
          email: userByEmail.email,
          name: userByEmail.name,
          apiKey: userByEmail.apiKey,
          entitlements: publicEntitlements(ent),
        });
      }
    }

    // 3. In-memory user store key lookup
    const legacy = findUserByApiKey(apiKey);
    if (legacy) {
      const ent = {
        ...entitlementsForPlan(legacy.plan),
        email: legacy.email,
        name: legacy.name,
      };
      return NextResponse.json({
        valid: true,
        plan: legacy.plan,
        tier: legacy.plan,
        email: legacy.email,
        name: legacy.name,
        apiKey: legacy.apiKey,
        entitlements: publicEntitlements(ent),
      });
    }

    // 4. Cryptographic HMAC issued key verification
    // IMPORTANT: build entitlements from issued.plan — do not re-parse key with
    // entitlementsFromApiKey after lower-casing (breaks HMAC → false Guest).
    const issued = verifyIssuedApiKey(apiKey);
    if (issued.ok) {
      const ent = entitlementsForPlan(issued.plan);
      return NextResponse.json({
        valid: true,
        plan: issued.plan,
        tier: issued.plan,
        email: ent.email,
        name: ent.name,
        apiKey,
        entitlements: publicEntitlements(ent),
      });
    }

    return NextResponse.json(
      { valid: false, error: "Invalid or revoked API Key" },
      { status: 404 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const apiKey = req.nextUrl.searchParams.get("key")?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { valid: false, error: "API Key is required" },
      { status: 400 }
    );
  }
  const fakeReq = {
    json: async () => ({ apiKey }),
  } as NextRequest;
  return POST(fakeReq);
}
