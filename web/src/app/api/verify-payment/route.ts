import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { apiKeyForUserId } from "@/lib/api-keys";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";
import type { UserPlan } from "@/lib/user-store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "RAZORPAY_KEY_SECRET is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan = "pro",
      userId = "usr_paid",
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required Razorpay payment verification fields.",
        },
        { status: 400 }
      );
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const isSignatureValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, "utf-8"),
      Buffer.from(razorpay_signature, "utf-8")
    );

    if (!isSignatureValid) {
      console.warn(
        `Razorpay payment signature mismatch for order: ${razorpay_order_id}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed. Signature mismatch.",
        },
        { status: 400 }
      );
    }

    // Signature verified! Issue activated API key for purchased plan
    const targetPlan = (plan === "max" || plan === "team" ? plan : "pro") as UserPlan;
    const issuedApiKey = apiKeyForUserId(userId, targetPlan);
    const ent = entitlementsForPlan(targetPlan);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully!",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan: targetPlan,
      apiKey: issuedApiKey,
      entitlements: publicEntitlements(ent),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Razorpay payment verification error:", msg);
    return NextResponse.json(
      { success: false, error: `Verification Error: ${msg}` },
      { status: 500 }
    );
  }
}
