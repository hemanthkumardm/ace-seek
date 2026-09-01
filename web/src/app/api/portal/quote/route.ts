import { NextRequest, NextResponse } from "next/server";
import { sendPortalQuoteNotificationEmail } from "@/lib/email-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/portal/quote
 * Receives quote requests from portal.ace-seek.com and dispatches email notifications.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, phone, category, description } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    // Dispatch email notification to admin & confirmation to user
    await sendPortalQuoteNotificationEmail({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      category: category ? String(category).trim() : "Custom Engineering Project",
      description: description ? String(description).trim() : "",
    });

    return NextResponse.json({
      ok: true,
      message: "Quote request successfully received and dispatched to our engineering team.",
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process quote request." },
      { status: 500 }
    );
  }
}
