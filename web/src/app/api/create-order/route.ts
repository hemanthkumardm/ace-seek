import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

export const runtime = "nodejs";

const PLAN_PRICES_INR: Record<string, number> = {
  pro: 1299, // ₹1,299
  max: 2499, // ₹2,499
  team: 3999, // ₹3,999
};

export async function POST(req: NextRequest) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay credentials are not configured on the server." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const plan = String(body.plan || "pro").toLowerCase();
    
    // Amount in INR rupees (or custom amount passed)
    let amountInRupees = Number(body.amount) || PLAN_PRICES_INR[plan] || 1299;
    
    // Convert to paise (1 Rupee = 100 Paise)
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

    const receiptId = `rcpt_${plan}_${Date.now()}`;
    const orderOptions = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        plan,
        site: "ace-seek.com",
      },
    };

    const order = await instance.orders.create(orderOptions);

    if (!order || !order.id) {
      return NextResponse.json(
        { error: "Failed to generate Razorpay order ID." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan,
      user_id: body.userId || null,
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
