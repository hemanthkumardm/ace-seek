import { NextRequest, NextResponse } from "next/server";
import {
  getUserKeysFromDb,
  saveApiKeyToDb,
  updateApiKeyStatusInDb,
} from "@/lib/supabase-keys";
import { generateUserDualKeys, apiKeyForUserId } from "@/lib/api-keys";
import { sendWelcomeTrialEmail } from "@/lib/email-service";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Admin API Key Management Endpoint.
 * Allows listing, creating, and revoking API keys directly in Supabase DB.
 */

export async function GET(req: NextRequest) {
  try {
    const user = await currentUser();
    const userId = user?.id || req.nextUrl.searchParams.get("userId") || "guest";
    const email = user?.primaryEmailAddress?.emailAddress || req.nextUrl.searchParams.get("email") || undefined;

    const keys = await getUserKeysFromDb(userId, email);
    return NextResponse.json({ ok: true, keys });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, userId, email, keyType, tier, apiKey: customKey, sendEmail } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { ok: false, error: "userId and email are required" },
        { status: 400 }
      );
    }

    // REVOKE KEY ACTION
    if (action === "revoke" && customKey) {
      const success = await updateApiKeyStatusInDb(customKey, "revoked");
      return NextResponse.json({ ok: success, message: `Key ${customKey} revoked.` });
    }

    // PROVISION DUAL SIGNUP KEYS (FREE + 7-DAY TRIAL)
    if (action === "provision_dual" || action === "signup") {
      const { freeKey, trialKey } = generateUserDualKeys(userId);

      // Save both to Supabase
      const savedFree = await saveApiKeyToDb({
        userId,
        email,
        keyType: "free",
        apiKey: freeKey,
        tier: "free",
      });

      const savedTrial = await saveApiKeyToDb({
        userId,
        email,
        keyType: "trial",
        apiKey: trialKey,
        tier: "pro",
      });

      let emailResult = { success: false };
      if (sendEmail !== false) {
        emailResult = await sendWelcomeTrialEmail({
          toEmail: email,
          freeKey,
          trialKey,
        });
      }

      return NextResponse.json({
        ok: true,
        message: "Dual Free + 7-Day Trial keys provisioned successfully",
        keys: {
          freeKey,
          trialKey,
        },
        saved: {
          free: Boolean(savedFree),
          trial: Boolean(savedTrial),
        },
        emailDispatched: emailResult.success,
      });
    }

    // MANUAL CUSTOM KEY CREATION BY ADMIN
    const finalKey = customKey || apiKeyForUserId(userId, tier || "pro");
    const saved = await saveApiKeyToDb({
      userId,
      email,
      keyType: keyType || "paid",
      apiKey: finalKey,
      tier: tier || "pro",
    });

    return NextResponse.json({
      ok: Boolean(saved),
      keyRecord: saved,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
