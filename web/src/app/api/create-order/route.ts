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

    const body = (await req.json()) as {
      planId?: string;
      plan?: string;
      amount?: number;
    };

    const rawPlan = String(body.planId || body.plan || "pro").toLowerCase();
    const isDonate = rawPlan === "donate" || rawPlan === "donation";

    let userId = "";
    let email = "";
    let name = "";

    if (isDonate) {
      // Donations: sign-in optional
      if (isClerkConfigured()) {
        const session = await auth();
        userId = session.userId || "";
        if (userId) {
          const user = await currentUser();
          email =
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress ||
            "";
          name =
            [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
            user?.username ||
            "";
        }
      }
    } else {
      if (!isClerkConfigured()) {
        return NextResponse.json(
          {
            error:
              "Sign in is required before checkout. Configure Clerk on the server.",
          },
          { status: 503 }
        );
      }

      const { userId: uid } = await auth();
      if (!uid) {
        return NextResponse.json(
          { error: "Sign in required to purchase a plan.", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }
      userId = uid;
      const user = await currentUser();
      email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress ||
        "";
      name =
        [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
        user?.username ||
        "";
    }

    let planKey: string;
    let amountInRupees: number;

    if (isDonate) {
      planKey = "donate";
      amountInRupees = Number(body.amount);
      if (!Number.isFinite(amountInRupees) || amountInRupees < 1) {
        return NextResponse.json(
          { error: "Please enter a valid donation amount (minimum ₹1)." },
          { status: 400 }
        );
      }
    } else {
      const billable = normalizeBillablePlan(rawPlan);
      planKey = billable === "interview_bundle" ? "interview_bundle" : billable;
      amountInRupees = Number(body.amount) || PLAN_PRICES_INR[planKey] || 1299;
    }

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
        user_id: userId || "",
        email: email || "",
        name: name || "",
        site: "ace-seek.com",
        kind: isDonate ? "donation" : "subscription",
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
      user_id: userId || null,
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
