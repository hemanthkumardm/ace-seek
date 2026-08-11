import { NextRequest, NextResponse } from "next/server";
import { findUserByApiKey } from "@/lib/user-store";
import { verifyIssuedApiKey } from "@/lib/api-keys";
import { entitlementsFromApiKey } from "@/lib/entitlements";

/**
 * Validate dashboard API keys for subdomain login (vlsi / tools).
 * Accepts legacy in-memory keys + Clerk-issued HMAC keys.
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

    const legacy = findUserByApiKey(apiKey);
    if (legacy) {
      return NextResponse.json({
        valid: true,
        plan: legacy.plan,
        tier: legacy.plan,
        email: legacy.email,
        name: legacy.name,
        apiKey: legacy.apiKey,
      });
    }

    const issued = verifyIssuedApiKey(apiKey);
    if (issued.ok) {
      const ent = entitlementsFromApiKey(apiKey);
      return NextResponse.json({
        valid: true,
        plan: issued.plan,
        tier: issued.plan,
        email: ent.email,
        name: ent.name,
        apiKey,
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
  const { searchParams } = new URL(req.url);
  const apiKey = searchParams.get("key")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { valid: false, error: "API Key is required" },
      { status: 400 }
    );
  }

  // Reuse POST logic
  const fakeReq = {
    json: async () => ({ apiKey }),
  } as NextRequest;
  return POST(fakeReq);
}
