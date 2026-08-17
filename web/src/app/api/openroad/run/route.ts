import { NextRequest, NextResponse } from "next/server";
import { entitlementsFromApiKey } from "@/lib/entitlements";
import { executeOpenroadJob } from "@/lib/openroad-run-engine";
import type { OpenroadProjectState } from "@/lib/openroad-project-hub";

/**
 * Max: POST OpenROAD job.
 * Header: x-api-key or body.apiKey
 * Body: { project, mode?: "dry_run" | "container" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      apiKey?: string;
      project?: OpenroadProjectState;
      mode?: "dry_run" | "container";
    };
    const apiKey =
      body.apiKey ||
      req.headers.get("x-api-key") ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ||
      "";

    const ent = entitlementsFromApiKey(apiKey);
    if (!ent.canAccessOpenroad || !ent.canOpenroadRun) {
      return NextResponse.json(
        {
          error: "OpenROAD Run requires Max (or Team).",
          tier: ent.tier,
        },
        { status: 403 }
      );
    }

    if (!body.project || !Array.isArray(body.project.files)) {
      return NextResponse.json(
        { error: "Body must include project with files[]" },
        { status: 400 }
      );
    }

    const result = executeOpenroadJob({
      project: body.project,
      mode: body.mode || "dry_run",
    });

    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Run failed" },
      { status: 500 }
    );
  }
}
