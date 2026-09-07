import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  applyPlanToUser,
  normalizeBillablePlan,
  setPlanStatusForUser,
} from "@/lib/subscription";
import { logger } from "@/lib/telemetry";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers.get("x-razorpay-signature");
    const rawBody = await req.text();

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
        logger.warn("razorpay.webhook_signature_mismatch", {});
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 400 }
        );
      }
    } else {
      logger.warn("razorpay.webhook_secret_missing", {
        hint: "Set RAZORPAY_WEBHOOK_SECRET in production",
      });
    }

    const event = JSON.parse(rawBody);
    const eventType = String(event.event || "");

    logger.info("razorpay.webhook_event", { eventType });

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const entity =
        event.payload?.payment?.entity || event.payload?.order?.entity;
      const notes = entity?.notes || {};
      const userId = String(notes.user_id || "").trim();
      const billable = normalizeBillablePlan(notes.plan || "pro");
      const paymentId = String(entity?.id || "");
      const orderId = String(
        entity?.order_id || notes.order_id || entity?.id || ""
      );
      const email = String(notes.email || entity?.email || "");
      const name = String(notes.name || "");

      if (!userId) {
        logger.warn("razorpay.webhook_missing_user_id", {
          paymentId,
          notes,
        });
        return NextResponse.json({
          status: "ok",
          processed: false,
          reason: "missing_user_id",
        });
      }

      const applied = await applyPlanToUser({
        userId,
        billable,
        paymentId: paymentId || null,
        orderId: orderId || null,
        email: email || null,
        name: name || null,
      });

      return NextResponse.json({
        status: "ok",
        processed: applied.ok,
        plan: applied.snapshot.plan,
        clerkUpdated: applied.clerkUpdated,
        event: eventType,
      });
    }

    if (
      eventType === "subscription.cancelled" ||
      eventType === "subscription.completed"
    ) {
      const sub = event.payload?.subscription?.entity;
      const userId = String(sub?.notes?.user_id || "").trim();
      if (userId) {
        await setPlanStatusForUser({
          userId,
          status: eventType === "subscription.cancelled" ? "canceled" : "expired",
        });
        return NextResponse.json({ status: "ok", processed: true, event: eventType });
      }
    }

    if (eventType === "payment.failed") {
      const entity = event.payload?.payment?.entity;
      const userId = String(entity?.notes?.user_id || "").trim();
      if (userId) {
        await setPlanStatusForUser({ userId, status: "past_due" });
      }
      return NextResponse.json({ status: "ok", processed: Boolean(userId), event: eventType });
    }

    return NextResponse.json({ status: "ok", processed: false, event: eventType });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error("razorpay.webhook_error", {}, err);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 500 });
  }
}
