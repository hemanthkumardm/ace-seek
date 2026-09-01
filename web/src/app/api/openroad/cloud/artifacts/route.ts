import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { resolveOpenroadUser } from "@/lib/openroad-cloud-auth";
import type { StageArtifact } from "@/lib/openroad-stage-artifacts";
import type { FlowStageId } from "@/lib/openroad-flow-model";

const INLINE_MAX = 80_000; // store larger blobs in Storage

async function resolveProjectId(
  sb: NonNullable<ReturnType<typeof getSupabaseAdmin>>,
  userId: string,
  projectId?: string
): Promise<string | null> {
  if (projectId) {
    const { data } = await sb
      .from("openroad_projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .maybeSingle();
    return data?.id || null;
  }
  const { data } = await sb
    .from("openroad_projects")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

/** GET ?projectId=&stage= */
export async function GET(req: NextRequest) {
  const gate = await resolveOpenroadUser(req);
  if (gate instanceof NextResponse) return gate;
  const { userId } = gate;
  const sb = getSupabaseAdmin()!;
  const url = new URL(req.url);
  const stage = url.searchParams.get("stage") || undefined;
  const projectId = await resolveProjectId(
    sb,
    userId,
    url.searchParams.get("projectId") || undefined
  );
  if (!projectId) {
    return NextResponse.json({ artifacts: [] });
  }

  let q = sb
    .from("openroad_artifacts")
    .select("*")
    .eq("project_id", projectId)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (stage) q = q.eq("stage", stage);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const artifacts: StageArtifact[] = [];
  for (const row of data || []) {
    let content = row.content_text as string | undefined;
    if (!content && row.storage_path) {
      const { data: file } = await sb.storage
        .from("openroad-artifacts")
        .download(row.storage_path as string);
      if (file) content = await file.text();
    }
    artifacts.push({
      id: row.id as string,
      stage: row.stage as FlowStageId,
      name: row.name as string,
      kind: (row.kind as StageArtifact["kind"]) || "other",
      content,
      size: Number(row.size_bytes) || content?.length || 0,
      createdAt: row.created_at as string,
      mime: (row.mime as string) || "text/plain",
    });
  }

  return NextResponse.json({ artifacts, projectId });
}

/** POST { projectId?, artifacts: StageArtifact[] } */
export async function POST(req: NextRequest) {
  const gate = await resolveOpenroadUser(req);
  if (gate instanceof NextResponse) return gate;
  const { userId } = gate;
  const sb = getSupabaseAdmin()!;
  const body = (await req.json()) as {
    projectId?: string;
    artifacts?: StageArtifact[];
  };
  const list = body.artifacts || [];
  if (!list.length) {
    return NextResponse.json({ ok: true, uploaded: 0 });
  }

  let projectId = await resolveProjectId(sb, userId, body.projectId);
  if (!projectId) {
    // Auto-create bare project shell
    const { data: created, error } = await sb
      .from("openroad_projects")
      .insert({
        user_id: userId,
        name: "openroad-project",
        is_active: true,
        state_json: {},
      })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json(
        {
          error: error?.message || "no project",
          hint: "Save project first or run schema.sql",
        },
        { status: 500 }
      );
    }
    projectId = created.id;
  }

  let uploaded = 0;
  for (const a of list) {
    const content = a.content || "";
    let storagePath: string | null = null;
    let contentText: string | null = content;

    if (content.length > INLINE_MAX) {
      storagePath = `${userId}/${projectId}/${a.stage}/${Date.now()}_${a.name}`.replace(
        /[^a-zA-Z0-9._\-/]/g,
        "_"
      );
      const { error: upErr } = await sb.storage
        .from("openroad-artifacts")
        .upload(storagePath, content, {
          contentType: a.mime || "text/plain",
          upsert: true,
        });
      if (upErr) {
        // fall back to truncated inline
        contentText = content.slice(0, INLINE_MAX);
        storagePath = null;
      } else {
        contentText = null;
      }
    }

    const { error } = await sb.from("openroad_artifacts").insert({
      project_id: projectId,
      user_id: userId,
      stage: a.stage,
      name: a.name,
      kind: a.kind,
      size_bytes: a.size || content.length,
      content_text: contentText,
      storage_path: storagePath,
      mime: a.mime || "text/plain",
    });
    if (!error) uploaded++;
  }

  return NextResponse.json({ ok: true, uploaded, projectId });
}
