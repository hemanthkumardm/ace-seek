/**
 * Account-bound subscriptions — Clerk metadata + Supabase persistence.
 */

import { createClerkClient } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { logger } from "@/lib/telemetry";
import type { UserPlan } from "@/lib/user-store";
import {
  addMonthsIso,
  effectivePlanFromMetadata,
  isPaidPlan,
  subscriptionSnapshotFromMetadata,
  type BillablePlan,
  type PlanStatus,
  type SubscriptionSnapshot,
} from "@/lib/subscription-plan";

export type {
  BillablePlan,
  PlanStatus,
  SubscriptionSnapshot,
  PaidPlan,
} from "@/lib/subscription-plan";

export {
  normalizeBillablePlan,
  isPaidPlan,
  addMonthsIso,
  effectivePlanFromMetadata,
  subscriptionSnapshotFromMetadata,
  planPriceLabel,
  MONTH_MS,
} from "@/lib/subscription-plan";

export type ApplyPlanInput = {
  userId: string;
  billable: BillablePlan;
  paymentId?: string | null;
  orderId?: string | null;
  email?: string | null;
  name?: string | null;
  status?: PlanStatus;
  renewsAt?: string | null;
};

export type ApplyPlanResult = {
  ok: boolean;
  snapshot: SubscriptionSnapshot;
  clerkUpdated: boolean;
  dbUpdated: boolean;
  error?: string;
};

export async function applyPlanToUser(input: ApplyPlanInput): Promise<ApplyPlanResult> {
  const { userId, billable } = input;
  const empty: SubscriptionSnapshot = {
    plan: "free",
    planStatus: "active",
    planPeriod: "none",
    planRenewsAt: null,
    hasInterviewMasterclass: false,
  };

  if (!userId?.trim()) {
    return {
      ok: false,
      snapshot: empty,
      clerkUpdated: false,
      dbUpdated: false,
      error: "missing_user_id",
    };
  }

  let clerkUpdated = false;
  let dbUpdated = false;
  let existingMeta: Record<string, unknown> = {};

  if (isClerkConfigured()) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      const user = await clerk.users.getUser(userId);
      existingMeta = { ...(user.publicMetadata || {}) } as Record<string, unknown>;

      if (
        input.paymentId &&
        (existingMeta.lastPaymentId === input.paymentId ||
          existingMeta.last_payment_id === input.paymentId)
      ) {
        return {
          ok: true,
          snapshot: subscriptionSnapshotFromMetadata(existingMeta),
          clerkUpdated: false,
          dbUpdated: false,
        };
      }
    } catch (err) {
      logger.error("subscription.clerk_get_user_failed", { userId }, err);
    }
  }

  const isInterview = billable === "interview_bundle";
  const saasPlan: UserPlan = isInterview
    ? effectivePlanFromMetadata(existingMeta)
    : billable === "free"
      ? "free"
      : billable;

  const status: PlanStatus = input.status || "active";
  const renewsAt = isInterview
    ? null
    : input.renewsAt !== undefined
      ? input.renewsAt
      : saasPlan === "free"
        ? null
        : addMonthsIso();

  const nextPublic: Record<string, unknown> = {
    ...existingMeta,
    plan: saasPlan,
    planStatus: saasPlan === "free" ? "active" : status,
    planPeriod: isInterview
      ? (existingMeta.planPeriod as string) ||
        (saasPlan === "free" ? "none" : "monthly")
      : saasPlan === "free"
        ? "none"
        : "monthly",
    planRenewsAt: renewsAt,
    hasInterviewMasterclass:
      isInterview || Boolean(existingMeta.hasInterviewMasterclass),
    lastPaymentId: input.paymentId || existingMeta.lastPaymentId || null,
    lastOrderId: input.orderId || existingMeta.lastOrderId || null,
  };

  if (isClerkConfigured()) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: nextPublic,
      });
      clerkUpdated = true;
    } catch (err) {
      logger.error("subscription.clerk_update_failed", { userId, billable }, err);
      return {
        ok: false,
        snapshot: subscriptionSnapshotFromMetadata(nextPublic),
        clerkUpdated: false,
        dbUpdated: false,
        error: "clerk_update_failed",
      };
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const email = (input.email || "").toLowerCase() || null;
      await supabase.from("profiles").upsert(
        {
          id: userId,
          email,
          name: input.name || null,
          plan: saasPlan,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (!isInterview && isPaidPlan(saasPlan)) {
        if (input.paymentId) {
          const { data: existing } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("provider_payment_id", input.paymentId)
            .maybeSingle();
          if (!existing) {
            await supabase.from("subscriptions").insert({
              user_id: userId,
              plan: saasPlan,
              status,
              provider: "razorpay",
              provider_payment_id: input.paymentId,
              provider_order_id: input.orderId || null,
              current_period_end: renewsAt,
              updated_at: new Date().toISOString(),
            });
          }
        } else {
          await supabase.from("subscriptions").insert({
            user_id: userId,
            plan: saasPlan,
            status,
            provider: "razorpay",
            current_period_end: renewsAt,
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (isInterview && input.paymentId) {
        const interviewPayId = `interview_${input.paymentId}`;
        const { data: existingIv } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("provider_payment_id", interviewPayId)
          .maybeSingle();
        if (!existingIv) {
          await supabase.from("subscriptions").insert({
            user_id: userId,
            plan: "pro",
            status: "active",
            provider: "razorpay",
            provider_payment_id: interviewPayId,
            provider_order_id: input.orderId || null,
            current_period_end: null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      dbUpdated = true;
    } catch (err) {
      logger.error("subscription.supabase_upsert_failed", { userId }, err);
    }
  }

  const snapshot = subscriptionSnapshotFromMetadata(nextPublic);
  logger.info("subscription.applied", {
    userId,
    billable,
    plan: snapshot.plan,
    clerkUpdated,
    dbUpdated,
    paymentId: input.paymentId,
  });

  return { ok: true, snapshot, clerkUpdated, dbUpdated };
}

export async function setPlanStatusForUser(opts: {
  userId: string;
  status: PlanStatus;
  plan?: UserPlan;
}): Promise<boolean> {
  if (!isClerkConfigured() || !opts.userId) return false;
  try {
    const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
    const user = await clerk.users.getUser(opts.userId);
    const prev = { ...(user.publicMetadata || {}) } as Record<string, unknown>;
    const nextPlan =
      opts.status === "canceled" || opts.status === "expired"
        ? "free"
        : opts.plan || effectivePlanFromMetadata(prev);
    await clerk.users.updateUserMetadata(opts.userId, {
      publicMetadata: {
        ...prev,
        plan: nextPlan,
        planStatus: opts.status,
        planPeriod: nextPlan === "free" ? "none" : prev.planPeriod || "monthly",
        planRenewsAt: nextPlan === "free" ? null : prev.planRenewsAt || null,
      },
    });

    const supabase = getSupabaseAdmin();
    if (supabase) {
      await supabase
        .from("profiles")
        .update({ plan: nextPlan, updated_at: new Date().toISOString() })
        .eq("id", opts.userId);
      await supabase
        .from("subscriptions")
        .update({ status: opts.status, updated_at: new Date().toISOString() })
        .eq("user_id", opts.userId)
        .eq("status", "active");
    }
    return true;
  } catch (err) {
    logger.error("subscription.set_status_failed", { userId: opts.userId }, err);
    return false;
  }
}
