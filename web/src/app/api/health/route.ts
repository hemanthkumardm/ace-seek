import { NextResponse } from "next/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { isSupabaseServerReady } from "@/lib/supabase/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Phase 0 deploy readiness — no secrets leaked, only boolean config flags.
 * GET /api/health
 */
export async function GET() {
  const clerk = isClerkConfigured();
  const supabase = isSupabaseServerReady();
  const razorpay = Boolean(
    (process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)?.trim() &&
      process.env.RAZORPAY_KEY_SECRET?.trim()
  );
  const razorpayWebhook = Boolean(process.env.RAZORPAY_WEBHOOK_SECRET?.trim());
  const siteUrl = Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim());

  const phase0 = {
    clerk,
    supabase,
    razorpay,
    razorpayWebhook,
    siteUrl,
  };

  const phase0Ready = Object.values(phase0).every(Boolean);
  const phase1Ready = clerk && razorpay; // session auth + paid plan path

  return NextResponse.json({
    ok: true,
    service: "ace-seek-web",
    time: new Date().toISOString(),
    phase0: {
      ready: phase0Ready,
      checks: phase0,
      missing: Object.entries(phase0)
        .filter(([, v]) => !v)
        .map(([k]) => k),
    },
    phase1: {
      ready: phase1Ready,
      notes: phase1Ready
        ? "Session auth + Razorpay create/verify configured. Run Supabase SQL + webhook for full ledger."
        : "Need Clerk + Razorpay keys for account-bound plans.",
    },
    ops: {
      supabaseSql: "Run docs/SUPABASE_SCHEMA.sql (profiles.max + subscriptions)",
      razorpayWebhookUrl: "https://www.ace-seek.com/api/webhooks/razorpay",
      clerkSatellites: ["vlsi.ace-seek.com", "tools.ace-seek.com", "openroad.ace-seek.com"],
    },
  });
}
