import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { apiKeyForUserId } from "@/lib/api-keys";
import { entitlementsForPlan } from "@/lib/entitlements";
import type { UserPlan } from "@/lib/user-store";

export const runtime = "nodejs";

function normalizePlan(raw: unknown): UserPlan {
  const p = String(raw || "pro").toLowerCase();
  if (p === "max" || p === "team" || p === "pro" || p === "free") return p;
  return "pro";
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature");

    const rawBody = await req.text();

    // If webhook secret is configured, strictly verify the signature
    if (webhookSecret) {
      if (!signature) {
        return NextResponse.json(
          { error: "Missing x-razorpay-signature header" },
          { status: 400 }
        );
      }

      const expectedSignature = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");

      const a = Buffer.from(expectedSignature, "utf-8");
      const b = Buffer.from(String(signature), "utf-8");

      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        console.warn("Razorpay webhook signature mismatch.");
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;

    console.log(`Received Razorpay webhook event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const entity = event.payload?.payment?.entity || event.payload?.order?.entity;
      const notes = entity?.notes || {};
      const targetPlan = normalizePlan(notes.plan || "pro");
      const paymentId = entity?.id || `pay_${Date.now()}`;
      const userId = notes.user_id || `pay_${paymentId}`;

      const apiKey = apiKeyForUserId(userId, targetPlan);
      const ent = entitlementsForPlan(targetPlan);

      console.log(
        `[Webhook Provisioned] Issued API Key for user/payment: ${userId}, Plan: ${targetPlan}, Key: ${apiKey.slice(0, 15)}...`
      );

      return NextResponse.json({
        status: "ok",
        processed: true,
        event: eventType,
        plan: targetPlan,
        apiKey,
        entitlements: ent,
      });
    }

    return NextResponse.json({ status: "ok", processed: false });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Razorpay webhook processing error:", msg);
    return NextResponse.json(
      { error: `Webhook error: ${msg}` },
      { status: 500 }
    );
  }
}
