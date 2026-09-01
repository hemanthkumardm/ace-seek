import { NextRequest, NextResponse } from "next/server";
import { executeOpenroadJob } from "@/lib/openroad-run-engine";
import { runnerDiagnostics } from "@/lib/openroad-docker-runner";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";
import { requireOpenroadOwner } from "@/lib/openroad-owner";
import { proxyOpenroadRequest } from "@/lib/openroad-proxy";

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

    const proxied = await proxyOpenroadRequest(req, "/api/openroad/run", {
      ownerId: owner.ownerId,
      body,
      method: "POST",
    });
    if (proxied) return proxied;

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
