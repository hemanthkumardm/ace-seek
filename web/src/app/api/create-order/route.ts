import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { normalizeBillablePlan } from "@/lib/subscription-plan";

export const runtime = "nodejs";

/** Keep in sync with web/src/lib/site.ts PRICING */
const PLAN_PRICES_INR: Record<string, number> = {
  pro: 1299,
  max: 2499,
  team: 3999,
  interview_bundle: 2499,
  interview_masterclass: 2499,
};

export async function POST(req: NextRequest) {
  try {
    if (!isClerkConfigured()) {
      return NextResponse.json(
        { error: "Sign in is required before checkout. Configure Clerk on the server." },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Sign in required to purchase a plan.", code: "AUTH_REQUIRED" },
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
      "";

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        {
          error:
            "Razorpay credentials (RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET) are not configured on the server.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const billable = normalizeBillablePlan(body.planId || body.plan || "pro");
    const planKey =
      billable === "interview_bundle" ? "interview_bundle" : billable;

    let amountInRupees = Number(body.amount) || PLAN_PRICES_INR[planKey] || 1299;
    const amountInPaise = Math.round(amountInRupees * 100);

    if (!amountInPaise || amountInPaise < 100) {
      return NextResponse.json(
        { error: "Minimum order amount must be at least 100 paise (₹1)." },
        { status: 400 }
      );
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const receiptId = `rcpt_${planKey}_${Date.now()}`.slice(0, 40);
    const order = await instance.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        plan: planKey,
        user_id: userId,
        email: email || "",
        name: name || "",
        site: "ace-seek.com",
      },
    });

    if (!order?.id) {
      return NextResponse.json(
        { error: "Failed to generate Razorpay order ID." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderId: order.id,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId,
      key_id: keyId,
      plan: planKey,
      user_id: userId,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Order creation error:", msg);
    return NextResponse.json(
      { error: `Order creation failed: ${msg}` },
      { status: 500 }
    );
  }
}
