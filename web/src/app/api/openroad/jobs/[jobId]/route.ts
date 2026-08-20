import { NextRequest, NextResponse } from "next/server";
import { pollOpenroadJob } from "@/lib/openroad-run-engine";
import { readJobArtifact } from "@/lib/openroad-docker-runner";
import { requireOpenroadOwner } from "@/lib/openroad-owner";

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

  const isVercel = process.env.VERCEL === "1" || Boolean(process.env.VERCEL_ENV);
  const externalOpenroadUrl = (
    process.env.OPENROAD_API_URL ||
    process.env.DOC_COMPILER_API_URL ||
    process.env.BACKEND_API_URL ||
    process.env.EC2_BACKEND_URL ||
    process.env.BACKEND_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL
  )?.replace(/\/$/, "");

  if (externalOpenroadUrl && (!process.env.AIC_FORCE_LOCAL || isVercel)) {
    try {
      const targetUrl = new URL(`${externalOpenroadUrl}/api/openroad/jobs/${jobId}`);
      req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
      const res = await fetch(targetUrl.toString(), {
        headers: {
          ...(req.headers.get("x-api-key") ? { "x-api-key": req.headers.get("x-api-key")! } : {}),
          ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
          ...(req.headers.get("cookie") ? { cookie: req.headers.get("cookie")! } : {}),
          "x-openroad-owner": owner.ownerId,
        },
      });
      if (download) {
        const blob = await res.arrayBuffer();
        const cleanHeaders = new Headers();
        const ct = res.headers.get("content-type");
        const cd = res.headers.get("content-disposition");
        if (ct) cleanHeaders.set("Content-Type", ct);
        if (cd) cleanHeaders.set("Content-Disposition", cd);
        return new NextResponse(new Uint8Array(blob), {
          status: res.status,
          headers: cleanHeaders,
        });
      }
      const data = await res.json();
      return NextResponse.json(data, { status: res.status });
    } catch (err) {
      /* fallback to local evaluation */
    }
  }

  if (download) {
    const art = readJobArtifact(jobId, download, owner.ownerId);
    if (!art) {
      return NextResponse.json({ error: "Artifact not found" }, { status: 404 });
    }
    // DEF is text (Studio Result chip parses DIEAREA); GDS/LEF binaries stay opaque
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

  const result = pollOpenroadJob(jobId, owner.ownerId);
  if (!result) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, result });
}
