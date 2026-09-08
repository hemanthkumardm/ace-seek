import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/clerk-config";
import { subscriptionSnapshotFromMetadata } from "@/lib/subscription-plan";
import { INTERVIEW_QUESTIONS_BANK } from "@/lib/vlsi-interview-masterclass-data";
import { toPublicInterviewQuestion } from "@/lib/interview-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated catalog — question stems only (no solutions).
 * Full answers: GET /api/interview/question/[id]
 */
export async function GET() {
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

  const user = await currentUser();
  const meta = { ...(user?.publicMetadata || {}) } as Record<string, unknown>;
  const snap = subscriptionSnapshotFromMetadata(meta);

  const questions = INTERVIEW_QUESTIONS_BANK.map(toPublicInterviewQuestion);
  const domainCounts: Record<string, number> = {};
  for (const q of questions) {
    domainCounts[q.domain] = (domainCounts[q.domain] || 0) + 1;
  }

  return NextResponse.json({
    ok: true,
    unlocked: snap.hasInterviewMasterclass,
    total: questions.length,
    freePreviewCount: questions.filter((q) => q.isFreeSample).length,
    domainCounts,
    questions,
  });
}
