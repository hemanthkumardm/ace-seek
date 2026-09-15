import { NextRequest, NextResponse } from "next/server";
import { listOwnerDockerJobs } from "@/lib/openroad-docker-runner";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — recent jobs for the authenticated owner (Studio compare / DSE). */
export async function GET(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/jobs", {
    ownerId: owner.ownerId,
    method: "GET",
  });
  if (proxied) return proxied;

  const limit = Math.min(
    40,
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 20))
  );
  const jobs = listOwnerDockerJobs(owner.ownerId, limit).map((j) => ({
    jobId: j.jobId,
    status: j.status,
    message: j.message,
    designName: j.designName,
    topModule: j.topModule,
    pdk: j.pdk,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    metrics: j.metrics || null,
  }));

  return NextResponse.json({ ok: true, jobs });
}
