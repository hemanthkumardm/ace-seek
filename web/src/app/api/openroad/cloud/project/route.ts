import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSupabaseServerReady } from "@/lib/supabase/config";
import { resolveOpenroadUser } from "@/lib/openroad-cloud-auth";
import type { OpenroadCloudState } from "@/lib/openroad-cloud";

/** GET ?ping=1 | ?active=1 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("ping") === "1") {
    return NextResponse.json({
      ok: isSupabaseServerReady(),
      reason: isSupabaseServerReady() ? "ready" : "no_supabase",
    });
  }

  const gate = await resolveOpenroadUser(req);
  if (gate instanceof NextResponse) return gate;
  const { userId } = gate;
  const sb = getSupabaseAdmin()!;

  const { data, error } = await sb
    .from("openroad_projects")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Table might not exist yet
    return NextResponse.json(
      { error: error.message, hint: "Run supabase/schema.sql in SQL Editor" },
      { status: 500 }
    );
  }

  return NextResponse.json({ project: data });
}

/** POST — upsert active OpenROAD project state */
export async function POST(req: NextRequest) {
  const gate = await resolveOpenroadUser(req);
  if (gate instanceof NextResponse) return gate;
  const { userId } = gate;
  const sb = getSupabaseAdmin()!;

  const body = (await req.json()) as OpenroadCloudState & {
    projectId?: string;
  };

  if (!body.project) {
    return NextResponse.json({ error: "project required" }, { status: 400 });
  }

  const p = body.project;
  const stateJson = {
    project: p,
    stageInputs: body.stageInputs || {},
    completedStages: body.completedStages || [],
    stageResults: body.stageResults || {},
    flowConfig: body.flowConfig || {},
  };

  // Deactivate others, upsert active
  await sb
    .from("openroad_projects")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("is_active", true);

  let projectId = body.projectId;
  if (projectId) {
    const { data, error } = await sb
      .from("openroad_projects")
      .update({
        name: p.projectName || p.designName || "openroad-project",
        design_name: p.designName,
        top_module: p.topModule,
        pdk: p.pdk,
        state_json: stateJson,
        flow_config_json: body.flowConfig || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("id")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (data?.id) {
      return NextResponse.json({ ok: true, projectId: data.id });
    }
  }

  const { data: existing } = await sb
    .from("openroad_projects")
    .select("id")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await sb
      .from("openroad_projects")
      .update({
        name: p.projectName || p.designName || "openroad-project",
        design_name: p.designName,
        top_module: p.topModule,
        pdk: p.pdk,
        state_json: stateJson,
        flow_config_json: body.flowConfig || {},
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, projectId: data.id });
  }

  const { data: created, error } = await sb
    .from("openroad_projects")
    .insert({
      user_id: userId,
      name: p.projectName || p.designName || "openroad-project",
      design_name: p.designName,
      top_module: p.topModule,
      pdk: p.pdk,
      state_json: stateJson,
      flow_config_json: body.flowConfig || {},
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        hint: "Run openroad tables from supabase/schema.sql in Supabase SQL Editor",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, projectId: created.id });
}
