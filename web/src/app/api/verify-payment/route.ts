import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { entitlementsForPlan, publicEntitlements } from "@/lib/entitlements";
import { logger } from "@/lib/telemetry";
import {
  applyPlanToUser,
  normalizeBillablePlan,
  planPriceLabel,
} from "@/lib/subscription";
import { sendLicenseDeliveryEmail } from "@/lib/email-service";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      logger.error("payment.verify_missing_secret", {
        error: "RAZORPAY_KEY_SECRET is not configured on the server",
      });
      return NextResponse.json(
        { error: "Payment gateway is not configured on the server." },
        { status: 500 }
      );
    }

    if (!isClerkConfigured()) {
      return NextResponse.json(
        { error: "Account system is not configured.", code: "CLERK_REQUIRED" },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Sign in required to activate your plan.",
          code: "AUTH_REQUIRED",
        },
        { status: 401 }
      );
    }

    const user = await currentUser();
    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";
    const name =
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      user?.username ||
      email ||
      "Engineer";

    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      plan,
      planId,
    } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logger.warn("payment.verify_missing_fields", { body });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required payment verification fields.",
        },
        { status: 400 }
      );
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const a = Buffer.from(expectedSignature, "utf-8");
    const b = Buffer.from(String(razorpay_signature), "utf-8");
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      logger.warn("payment.signature_mismatch", {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Payment verification failed. Signature mismatch.",
        },
        { status: 400 }
      );
    }

    const billable = normalizeBillablePlan(planId || plan || "pro");
    const applied = await applyPlanToUser({
      userId,
      billable,
      paymentId: String(razorpay_payment_id),
      orderId: String(razorpay_order_id),
      email,
      name,
    });

    if (!applied.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            applied.error === "clerk_update_failed"
              ? "Payment verified but we could not update your account. Contact support with your payment ID."
              : "Could not activate plan on your account.",
          payment_id: razorpay_payment_id,
        },
        { status: 500 }
      );
    }

    logger.trackAnalytics("payment_verified", {
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      plan: billable,
      userId,
      email: email || "unknown",
      clerkUpdated: applied.clerkUpdated,
    });

    if (email.includes("@")) {
      const planTitle =
        billable === "interview_bundle"
          ? "VLSI INTERVIEW PREP MASTERCLASS (LIFETIME)"
          : applied.snapshot.plan.toUpperCase();

      sendLicenseDeliveryEmail({
        toEmail: email,
        planName: planTitle,
        apiKey: `(Account plan — sign in on any Ace-Seek host. Plan: ${applied.snapshot.plan})`,
        paymentId: String(razorpay_payment_id),
        amountFormatted: planPriceLabel(billable),
      }).catch((err) => {
        logger.error("payment.email_dispatch_error", { email }, err);
      });
    }

    const saasPlan = applied.snapshot.plan;
    const ent = entitlementsForPlan(saasPlan);

    return NextResponse.json({
      success: true,
      message: "Payment verified. Your account plan is active.",
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      plan: saasPlan,
      planStatus: applied.snapshot.planStatus,
      planRenewsAt: applied.snapshot.planRenewsAt,
      hasInterviewMasterclass: applied.snapshot.hasInterviewMasterclass,
      isInterviewUnlocked: applied.snapshot.hasInterviewMasterclass,
      entitlements: {
        ...publicEntitlements(ent),
        hasInterviewMasterclass: applied.snapshot.hasInterviewMasterclass,
      },
    });
  } catch (err: unknown) {
    logger.error("payment.verify_exception", {}, err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Verification error: ${msg}` },
      { status: 500 }
    );
  }
}
