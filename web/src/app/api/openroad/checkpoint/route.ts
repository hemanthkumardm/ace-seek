import { NextRequest, NextResponse } from "next/server";
import { resolveCheckpointInfo } from "@/lib/openroad-checkpoints";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET ?designName=&topModule=
 * Probe Ace-Seek flow checkpoint on disk (for Studio assertions UI).
 * Sprint A: per-owner checkpoints only.
 */
export async function GET(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner } = gate;

  const proxied = await proxyOpenroadRequest(req, "/api/openroad/checkpoint", {
    ownerId: owner.ownerId,
    method: "GET",
  });
  if (proxied) return proxied;

  const sp = req.nextUrl.searchParams;
  const designName = sp.get("designName") || "design";
  const topModule = sp.get("topModule") || "top";
  const info = resolveCheckpointInfo(designName, topModule, owner.ownerId);
  return NextResponse.json({
    ok: true,
    exists: info.exists,
    slug: info.slug,
    path: info.path,
    stage: info.stage,
    ownerId: info.ownerId,
  });
}
