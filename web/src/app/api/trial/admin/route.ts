import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireAdmin } from "@/lib/admin-auth";
import {
  approveTrialRequest,
  listTrialRequests,
  rejectTrialRequest,
  type TrialStatus,
} from "@/lib/trial-store";
import { sendTrialApprovedMail, sendTrialRejectedMail } from "@/lib/trial-mail";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate instanceof NextResponse) return gate;

  const status = req.nextUrl.searchParams.get("status") as TrialStatus | null;
  const valid = status === "pending" || status === "approved" || status === "rejected";
  const rows = await listTrialRequests(valid ? status : undefined);
  return NextResponse.json({
    ok: true,
    via: gate.via,
    requests: rows,
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if (gate instanceof NextResponse) return gate;

  try {
    const body = await req.json().catch(() => ({}));
    const id = String(body.id || "").trim();
    const action = String(body.action || "").toLowerCase();
    const note = body.note ? String(body.note).trim() : undefined;
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    if (action === "approve") {
      const trial = await approveTrialRequest(id, note);
      const mail = await sendTrialApprovedMail(trial);
      console.log("[trial/admin] approve mail", {
        id: trial.id,
        to: trial.email,
        sent: mail.sent,
        error: mail.error,
      });
      return NextResponse.json({
        ok: true,
        request: trial,
        mail: mail.sent ? "sent" : "failed",
        mailError: mail.error || null,
      });
    }

    if (action === "reject") {
      const trial = await rejectTrialRequest(id, note);
      const mail = await sendTrialRejectedMail(trial);
      console.log("[trial/admin] reject mail", {
        id: trial.id,
        to: trial.email,
        sent: mail.sent,
        error: mail.error,
      });
      return NextResponse.json({
        ok: true,
        request: trial,
        mail: mail.sent ? "sent" : "failed",
        mailError: mail.error || null,
      });
    }

    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
