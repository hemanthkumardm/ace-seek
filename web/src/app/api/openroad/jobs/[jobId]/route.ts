import { NextRequest, NextResponse } from "next/server";
import { pollOpenroadJob } from "@/lib/openroad-run-engine";
import { readJobArtifact } from "@/lib/openroad-docker-runner";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ jobId: string }> };

/** GET job status / log / artifact list — owner-scoped (Sprint A) */
export async function GET(req: NextRequest, ctx: Ctx) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  const { owner } = gate;
  const { jobId } = await ctx.params;
  const url = new URL(req.url);
  const download = url.searchParams.get("download");

  const proxied = await proxyOpenroadRequest(req, `/api/openroad/jobs/${jobId}`, {
    ownerId: owner.ownerId,
    method: "GET",
  });
  if (proxied) return proxied;

  if (download) {
    const art = readJobArtifact(jobId, download, owner.ownerId);
    if (art) {
      const isBinary = /\.(gds|gz|lef|mag|oas)$/i.test(download);
      const isDef = /\.def$/i.test(download);
      return new NextResponse(new Uint8Array(art.data), {
        status: 200,
        headers: {
          "Content-Type": isBinary
            ? "application/octet-stream"
            : isDef
              ? "text/plain; charset=utf-8"
              : "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${download.replace(/"/g, "")}"`,
        },
      });
    }
    // Sprint 3: fall back to signed S3/R2 URL when local file gone
    try {
      const { getDockerJob } = await import("@/lib/openroad-docker-runner");
      const { signedArtifactUrl } = await import("@/lib/openroad-artifact-store");
      const j = getDockerJob(jobId, owner.ownerId);
      if (j?.jobDir) {
        const url = await signedArtifactUrl(j.jobDir, download);
        if (url) {
          return NextResponse.redirect(url, 302);
        }
      }
    } catch {
      /* */
    }
    return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
  }

  const result = pollOpenroadJob(jobId, owner.ownerId);
  if (!result) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, result });
}
