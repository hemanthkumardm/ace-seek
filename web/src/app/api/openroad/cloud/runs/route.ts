import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOpenroadUser } from "@/lib/openroad-cloud-auth";
import type { StageResultPayload } from "@/lib/openroad-flow-model";

/** POST — record a stage run result (without huge logs in result_json) */
export async function POST(req: NextRequest) {
  const gate = await resolveOpenroadUser(req);
  if (gate instanceof NextResponse) return gate;
  const { userId } = gate;
  const sb = getSupabaseAdmin()!;

  const body = (await req.json()) as {
    projectId?: string;
    stage: string;
    status: "done" | "failed" | "running";
    summary?: string;
    result?: StageResultPayload;
  };

  if (!body.stage) {
    return NextResponse.json({ error: "stage required" }, { status: 400 });
  }

  let projectId = body.projectId;
  if (!projectId) {
    const { data } = await sb
      .from("openroad_projects")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    projectId = data?.id;
  }
  if (!projectId) {
    return NextResponse.json({ ok: false, skipped: true, reason: "no_project" });
  }

  // Slim result for JSONB
  let slim: Record<string, unknown> = {};
  if (body.result) {
    const r = body.result;
    slim = { kind: r.kind, summary: "summary" in r ? r.summary : undefined };
    if (r.kind === "lint") {
      slim.errorCount = r.errorCount;
      slim.warnCount = r.warnCount;
    }
    if (r.kind === "synth") {
      slim.cellCount = r.cellCount;
      slim.wireCount = r.wireCount;
      slim.statsLines = r.statsLines?.slice(0, 30);
    }
    if (r.kind === "sim") {
      slim.ok = r.ok;
    }
    if ("log" in r && r.log) {
      slim.logTail = r.log.slice(-20_000);
    }
  }

  const { error } = await sb.from("openroad_stage_runs").insert({
    project_id: projectId,
    user_id: userId,
    stage: body.stage,
    status: body.status,
    summary: body.summary || null,
    result_json: slim,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, projectId });
}
