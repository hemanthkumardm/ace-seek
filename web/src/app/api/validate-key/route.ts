import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey, findUserByEmail } from "@/lib/user-store";
import { verifyIssuedApiKey } from "@/lib/api-keys";
import {
  publicEntitlements,
  entitlementsForPlan,
} from "@/lib/entitlements";
import { activateTrialKeyFirstUse, getApiKeyRecordFromDb } from "@/lib/supabase-keys";

/**
 * Validate dashboard API keys for subdomain login (vlsi / tools).
 * Handles Free, 7-Day Trial (activated on first use), Pro, Max, and Team keys.
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

    // 2. Check Supabase DB for manual/custom key record overrides first
    const dbRecord = await getApiKeyRecordFromDb(apiKey);
    if (dbRecord) {
      if (dbRecord.status === "revoked") {
        return NextResponse.json(
          { valid: false, error: "This API Key has been revoked by admin." },
          { status: 403 }
        );
      }

      if (dbRecord.key_type === "trial") {
        const trialActivation = await activateTrialKeyFirstUse(apiKey);
        if (trialActivation && trialActivation.active) {
          const ent = entitlementsForPlan("max");
          return NextResponse.json({
            valid: true,
            plan: "max",
            tier: "max",
            keyType: "trial",
            trialActive: true,
            daysRemaining: trialActivation.daysRemaining,
            expiresAt: trialActivation.expiresAt,
            email: dbRecord.email,
            apiKey,
            entitlements: publicEntitlements(ent),
          });
        }

        // Trial expired & fell back to Free tier
        const ent = entitlementsForPlan("free");
        return NextResponse.json({
          valid: true,
          plan: "free",
          tier: "free",
          keyType: "trial",
          trialExpired: true,
          message: "Your 7-day Max trial has expired. Reverted to Free plan.",
          email: dbRecord.email,
          apiKey,
          entitlements: publicEntitlements(ent),
        });
      }

      const activePlan = dbRecord.tier;
      const ent = entitlementsForPlan(activePlan);
      return NextResponse.json({
        valid: true,
        plan: activePlan,
        tier: activePlan,
        email: dbRecord.email,
        apiKey,
        entitlements: publicEntitlements(ent),
      });
    }

    // 3. Cryptographic HMAC issued key verification
    const issued = verifyIssuedApiKey(apiKey);
    if (issued.ok) {
      if (issued.plan === "trial") {
        const trialActivation = await activateTrialKeyFirstUse(apiKey);
        const isTrialValid = trialActivation ? trialActivation.active : true;
        const activePlan = isTrialValid ? "max" : "free";
        const ent = entitlementsForPlan(activePlan);

        return NextResponse.json({
          valid: true,
          plan: activePlan,
          tier: activePlan,
          keyType: "trial",
          trialActive: isTrialValid,
          trialExpired: !isTrialValid,
          daysRemaining: trialActivation?.daysRemaining ?? 7,
          expiresAt: trialActivation?.expiresAt,
          apiKey,
          entitlements: publicEntitlements(ent),
        });
      }

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

    // 4. In-memory user store key lookup fallback
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
