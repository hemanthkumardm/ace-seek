import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { createTrialRequest, parseAffiliation } from "@/lib/trial-store";
import { sendTrialAdminNotify, sendTrialReceivedMail } from "@/lib/trial-mail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function str(v: unknown, max = 500): string {
  return String(v ?? "").trim().slice(0, max);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const name = str(body.name, 120);
    const email = str(body.email, 200).toLowerCase();
    const qualification = str(body.qualification, 200);
    const organization = str(body.organization, 200);
    const affiliation = parseAffiliation(body.affiliation);
    const reason = str(body.reason, 2000);

    if (name.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid college or company email." },
        { status: 400 }
      );
    }
    if (qualification.length < 2) {
      return NextResponse.json({ error: "Qualification is required." }, { status: 400 });
    }
    if (organization.length < 2) {
      return NextResponse.json(
        { error: "College / university / company name is required." },
        { status: 400 }
      );
    }
    if (reason.length < 30) {
      return NextResponse.json(
        { error: "Tell us a bit more about why you need Max (at least 30 characters)." },
        { status: 400 }
      );
    }

    const trial = await createTrialRequest({
      name,
      email,
      qualification,
      organization,
      affiliation,
      reason,
    });

    const [applicant, admin] = await Promise.all([
      sendTrialReceivedMail(trial),
      sendTrialAdminNotify(trial),
    ]);

    console.log("[trial/request] mail", {
      id: trial.id,
      applicant: applicant.sent ? "sent" : applicant.error,
      admin: admin.sent ? "sent" : admin.error,
    });

    return NextResponse.json({
      ok: true,
      id: trial.id,
      message:
        "Request submitted. We’ll verify your details and email the Max API key within 7 days.",
      mail: {
        applicant: applicant.sent ? "sent" : "failed",
        admin: admin.sent ? "sent" : "failed",
        error: applicant.sent ? null : applicant.error || null,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const status = /already/i.test(msg) ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
