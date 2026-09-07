/**
 * Pure plan math — no Clerk/Supabase clients (safe for client + server imports).
 */

import type { UserPlan } from "@/lib/user-store";

export type PlanStatus = "active" | "past_due" | "canceled" | "trialing" | "expired";
export type PaidPlan = Exclude<UserPlan, "free">;
export type BillablePlan = UserPlan | "interview_bundle";

export type SubscriptionSnapshot = {
  plan: UserPlan;
  planStatus: PlanStatus;
  planPeriod: "monthly" | "lifetime" | "none";
  planRenewsAt: string | null;
  hasInterviewMasterclass: boolean;
  lastPaymentId?: string | null;
};

const PAID: PaidPlan[] = ["pro", "max", "team"];

export function normalizeBillablePlan(raw: unknown): BillablePlan {
  const p = String(raw || "pro").toLowerCase();
  if (p === "interview_bundle" || p === "interview_masterclass") return "interview_bundle";
  if (p === "max" || p === "team" || p === "pro" || p === "free") return p;
  return "pro";
}

export function isPaidPlan(plan: string): plan is PaidPlan {
  return PAID.includes(plan as PaidPlan);
}

export const MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export function addMonthsIso(from = new Date(), months = 1): string {
  return new Date(from.getTime() + months * MONTH_MS).toISOString();
}

export function effectivePlanFromMetadata(
  meta: Record<string, unknown> | null | undefined
): UserPlan {
  if (!meta) return "free";

  const status = String(meta.planStatus || meta.plan_status || "active").toLowerCase() as PlanStatus;
  const raw = String(meta.plan || meta.tier || "free").toLowerCase();
  const renewsAtRaw = meta.planRenewsAt || meta.plan_renews_at;
  const renewsAt =
    typeof renewsAtRaw === "string" || typeof renewsAtRaw === "number"
      ? new Date(renewsAtRaw).getTime()
      : null;

  const trialExp = meta.trialExpiresAt || meta.trial_expires_at;
  if (trialExp) {
    const t = new Date(String(trialExp)).getTime();
    if (Number.isFinite(t) && t > Date.now()) {
      if (raw === "pro" || raw === "max" || raw === "team") return raw;
      return "max";
    }
  }

  if (!isPaidPlan(raw)) return "free";

  if (status === "canceled" || status === "expired") return "free";
  if (status === "past_due") {
    if (renewsAt && renewsAt > Date.now()) return raw;
    return "free";
  }

  if (renewsAt && renewsAt < Date.now() && status !== "trialing") {
    return "free";
  }

  return raw;
}

export function subscriptionSnapshotFromMetadata(
  meta: Record<string, unknown> | null | undefined
): SubscriptionSnapshot {
  const m = meta || {};
  const plan = effectivePlanFromMetadata(m);
  const statusRaw = String(m.planStatus || m.plan_status || "active").toLowerCase();
  const planStatus = (
    ["active", "past_due", "canceled", "trialing", "expired"].includes(statusRaw)
      ? statusRaw
      : "active"
  ) as PlanStatus;
  const renews =
    typeof m.planRenewsAt === "string"
      ? m.planRenewsAt
      : typeof m.plan_renews_at === "string"
        ? m.plan_renews_at
        : null;
  const periodRaw = String(m.planPeriod || m.plan_period || (plan === "free" ? "none" : "monthly"));
  const planPeriod = (
    periodRaw === "lifetime" || periodRaw === "monthly" || periodRaw === "none"
      ? periodRaw
      : "monthly"
  ) as SubscriptionSnapshot["planPeriod"];

  return {
    plan,
    planStatus: plan === "free" && planStatus === "active" ? "active" : planStatus,
    planPeriod: plan === "free" ? "none" : planPeriod,
    planRenewsAt: renews,
    hasInterviewMasterclass: Boolean(
      m.hasInterviewMasterclass || m.has_interview_masterclass
    ),
    lastPaymentId:
      typeof m.lastPaymentId === "string"
        ? m.lastPaymentId
        : typeof m.last_payment_id === "string"
          ? m.last_payment_id
          : null,
  };
}

export function planPriceLabel(plan: BillablePlan): string {
  switch (plan) {
    case "interview_bundle":
      return "₹2,499 (Lifetime)";
    case "pro":
      return "₹1,299/mo";
    case "max":
      return "₹2,499/mo";
    case "team":
      return "₹3,999/seat/mo";
    default:
      return "₹0";
  }
}
