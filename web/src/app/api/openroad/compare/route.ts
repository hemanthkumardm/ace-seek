import { NextRequest, NextResponse } from "next/server";
import { getDockerJob } from "@/lib/openroad-docker-runner";
import { compareRuns, toMeasuredPpa } from "@/lib/openroad-compare";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST { jobA, jobB } — measured metrics + short log diff */
export async function POST(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/compare", {
    ownerId: owner.ownerId,
    method: "POST",
  });
  if (proxied) return proxied;

  const body = (await req.json()) as { jobA?: string; jobB?: string };
  if (!body.jobA || !body.jobB) {
    return NextResponse.json(
      { error: "jobA and jobB are required" },
      { status: 400 }
    );
  }

  const a = getDockerJob(body.jobA, owner.ownerId);
  const b = getDockerJob(body.jobB, owner.ownerId);
  if (!a || !b) {
    return NextResponse.json(
      { error: "One or both jobs not found for this account" },
      { status: 404 }
    );
  }

  const compare = compareRuns(
    toMeasuredPpa({
      jobId: a.jobId,
      status: a.status,
      designName: a.designName,
      label: "A",
      metrics: a.metrics as Record<string, unknown> | undefined,
      logTail: a.logTail,
    }),
    toMeasuredPpa({
      jobId: b.jobId,
      status: b.status,
      designName: b.designName,
      label: "B",
      metrics: b.metrics as Record<string, unknown> | undefined,
      logTail: b.logTail,
    })
  );

  return NextResponse.json({ ok: true, compare });
}
