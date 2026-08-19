import { NextRequest, NextResponse } from "next/server";
import { executeOpenroadJob } from "@/lib/openroad-run-engine";
import { runnerDiagnostics } from "@/lib/openroad-docker-runner";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import { requireOpenroadOwner } from "@/lib/openroad-owner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Max: POST OpenROAD job.
 * mode: dry_run | container
 * container → real OpenLane Docker (synth→GDS), poll /api/openroad/jobs/:id
 * Sprint A: owner-namespaced job dirs.
 */
export async function POST(req: NextRequest) {
  try {
    const gate = requireOpenroadOwner(req, { needRun: true });
    if (gate instanceof NextResponse) return gate;
    const { owner } = gate;

    const body = (await req.json()) as {
      apiKey?: string;
      project?: OpenroadProjectState;
      mode?: "dry_run" | "container";
      openlaneConfig?: Record<string, string | number | boolean>;
    };

    if (!body.project || !Array.isArray(body.project.files)) {
      return NextResponse.json(
        { error: "Body must include project with files[]" },
        { status: 400 }
      );
    }

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
        const targetUrl = new URL(`${externalOpenroadUrl}/api/openroad/run`);
        req.nextUrl.searchParams.forEach((v, k) => targetUrl.searchParams.set(k, v));
        const res = await fetch(targetUrl.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(req.headers.get("x-api-key") ? { "x-api-key": req.headers.get("x-api-key")! } : {}),
            ...(req.headers.get("authorization") ? { authorization: req.headers.get("authorization")! } : {}),
          },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        return NextResponse.json(data, { status: res.status });
      } catch (err) {
        /* fallback to local evaluation */
      }
    }

    const mode = body.mode || "container";
    const result = executeOpenroadJob({
      project: body.project,
      mode,
      async: true,
      openlaneConfig: body.openlaneConfig,
      owner,
    });

    if (result.status === "rejected") {
      const queueFull = /queue full/i.test(result.message || "");
      const busy = /already (queued|preparing|running|active)/i.test(
        result.message || ""
      );
      return NextResponse.json(
        {
          ok: false,
          error: result.message,
          result,
          runner: runnerDiagnostics(),
        },
        { status: queueFull ? 429 : busy ? 409 : 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      result,
      runner: runnerDiagnostics(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const gate = requireOpenroadOwner(req);
  if (gate instanceof NextResponse) return gate;
  return NextResponse.json({
    ok: true,
    runner: runnerDiagnostics(),
    modes: ["dry_run", "container"],
    note: "POST with Max API key to start jobs. container = OpenLane synth→GDS.",
  });
}
