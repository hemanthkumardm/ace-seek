import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { subscriptionSnapshotFromMetadata } from "@/lib/subscription-plan";
import { INTERVIEW_QUESTIONS_BANK } from "@/lib/vlsi-interview-masterclass-data";
import { toPublicInterviewQuestion } from "@/lib/interview-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Full solution only when:
 * - user has lifetime Interview Masterclass on account, OR
 * - question is a free sample (still requires sign-in)
 */
export async function GET(_req: NextRequest, ctx: Ctx) {
  if (!isClerkConfigured()) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: "Sign in required", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }

  const { id } = await ctx.params;
  const q = INTERVIEW_QUESTIONS_BANK.find((item) => item.id === id);
  if (!q) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const user = await currentUser();
  const meta = { ...(user?.publicMetadata || {}) } as Record<string, unknown>;
  const snap = subscriptionSnapshotFromMetadata(meta);
  const unlocked = snap.hasInterviewMasterclass || Boolean(q.isFreeSample);

  if (!unlocked) {
    return NextResponse.json(
      {
        ok: true,
        unlocked: false,
        question: toPublicInterviewQuestion(q),
        code: "PLAN_LIMIT",
        message: "Lifetime Interview Masterclass required for this solution.",
      },
      { status: 402 }
    );
  }

  return NextResponse.json({
    ok: true,
    unlocked: true,
    question: { ...q, hasFullSolution: true },
  });
}
