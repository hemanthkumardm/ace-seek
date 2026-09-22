import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { createClerkClient } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { apiKeyForUserId } from "@/lib/api-keys";
import { saveApiKeyToDb } from "@/lib/supabase-keys";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate instanceof NextResponse) return gate;

  try {
    const body = await req.json().catch(() => ({}));
    const target = String(body.target || body.emailOrUserId || body.email || "").trim();
    const plan = String(body.plan || "max").toLowerCase().trim();
    const hasInterviewMasterclass = Boolean(body.hasInterviewMasterclass ?? true);
    const planPeriod = String(body.planPeriod || (plan === "free" ? "none" : "monthly"));

    if (!target) {
      return NextResponse.json(
        { ok: false, error: "Email or Clerk User ID is required." },
        { status: 400 }
      );
    }

    if (!["free", "pro", "max", "team"].includes(plan)) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan. Choose free, pro, max, or team." },
        { status: 400 }
      );
    }

    if (!isClerkConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Clerk is not configured in this environment." },
        { status: 500 }
      );
    }

    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    let clerkUser = null;

    if (target.startsWith("user_")) {
      try {
        clerkUser = await clerk.users.getUser(target);
      } catch {
        /* fallback to email search */
      }
    }

    if (!clerkUser) {
      const list = await clerk.users.getUserList({
        emailAddress: [target.toLowerCase()],
        limit: 1,
      });
      if (list.data && list.data.length > 0) {
        clerkUser = list.data[0];
      }
    }

    if (!clerkUser) {
      return NextResponse.json(
        {
          ok: false,
          error: `User "${target}" was not found in Clerk. Make sure the user has created an account first.`,
        },
        { status: 404 }
      );
    }

    const userId = clerkUser.id;
    const userEmail =
      clerkUser.primaryEmailAddress?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress ||
      target;

    const existingPublic = (clerkUser.publicMetadata || {}) as Record<string, unknown>;
    const nextPublic = {
      ...existingPublic,
      plan,
      planStatus: "active",
      planPeriod,
      hasInterviewMasterclass,
      updatedByAdminAt: new Date().toISOString(),
    };

    // 1. Update Clerk metadata
    await clerk.users.updateUserMetadata(userId, {
      publicMetadata: nextPublic,
    });

    // 2. Sync to Supabase profiles & keys if configured
    const supabase = getSupabaseAdmin();
    if (supabase) {
      try {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            email: userEmail.toLowerCase(),
            plan,
            plan_status: "active",
            has_interview_masterclass: hasInterviewMasterclass,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      } catch (sbErr) {
        console.warn("[admin/grant] Supabase profile upsert warning:", sbErr);
      }
    }

    // 3. Save new tier API key to DB
    const tierApiKey = apiKeyForUserId(userId, plan as any);
    await saveApiKeyToDb({
      userId,
      email: userEmail,
      keyType: plan === "free" ? "free" : "paid",
      apiKey: tierApiKey,
      tier: plan as any,
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      message: `Granted ${plan.toUpperCase()} ${hasInterviewMasterclass ? "+ Interview Masterclass" : ""} to ${userEmail}`,
      user: {
        id: userId,
        email: userEmail,
        plan,
        hasInterviewMasterclass,
        apiKey: tierApiKey,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
