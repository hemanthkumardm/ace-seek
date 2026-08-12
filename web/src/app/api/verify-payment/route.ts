import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { apiKeyForUserId } from "@/lib/api-keys";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";
import type { UserPlan } from "@/lib/user-store";

export const runtime = "nodejs";

function normalizePlan(raw: unknown): UserPlan {
  const p = String(raw || "pro").toLowerCase();
  if (p === "max" || p === "team" || p === "pro" || p === "free") return p;
  return "pro";
}

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return NextResponse.json(
        { error: "Payment gateway is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan = "pro",
      userId,
      email,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment verification fields.",
        },
        { status: 400 }
      );
    }

    // HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const a = Buffer.from(expectedSignature, "utf-8");
    const b = Buffer.from(String(razorpay_signature), "utf-8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      console.warn(
        `Payment signature mismatch for order: ${razorpay_order_id}`
      );
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed. Signature mismatch.",
        },
        { status: 400 }
      );
    }

    const targetPlan = normalizePlan(plan);
    // Unique license subject: prefer Clerk user id, else payment id (one key per payment)
    const subject =
      (typeof userId === "string" && userId.trim()) ||
      `pay_${String(razorpay_payment_id)}`;

    const issuedApiKey = apiKeyForUserId(subject, targetPlan);
    const ent = entitlementsForPlan(targetPlan);

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan: targetPlan,
      apiKey: issuedApiKey,
      email: email || undefined,
      entitlements: publicEntitlements(ent),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Payment verification error:", msg);
    return NextResponse.json(
      { success: false, error: `Verification error: ${msg}` },
      { status: 500 }
    );
  }
}
