import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { FREE_MAX_SDC_PROJECTS, isSupabaseServerReady } from "@/lib/supabase/config";
import { normalizeSdcState, type SdcStudioState } from "@/lib/sdc-engine";

function clerkOn(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() &&
      process.env.CLERK_SECRET_KEY?.trim()
  );
}

async function requireUserId(): Promise<
  { userId: string; email?: string; name?: string } | NextResponse
> {
  if (!clerkOn()) {
    return NextResponse.json(
      { error: "Sign in required to save cloud projects." },
      { status: 401 }
    );
  }
  if (!isSupabaseServerReady()) {
    return NextResponse.json(
      { error: "Cloud project storage is temporarily unavailable." },
      { status: 503 }
    );
  }
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses[0]?.emailAddress;
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.username ||
    email;
  return { userId, email, name };
}

async function ensureProfile(
  userId: string,
  email?: string,
  name?: string
): Promise<void> {
  const sb = getSupabaseAdmin();
  if (!sb) return;
  await sb.from("profiles").upsert(
    {
      id: userId,
      email: email || null,
      name: name || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );
}

/** GET ?active=1 | ?ping=1 | list */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  if (url.searchParams.get("ping") === "1") {
    if (!isSupabaseServerReady()) {
      return NextResponse.json({ ok: false, reason: "no_supabase" }, { status: 503 });
    }
    if (!clerkOn()) {
      return NextResponse.json({ ok: false, reason: "no_clerk" }, { status: 503 });
    }
    return NextResponse.json({ ok: true });
  }

  const gate = await requireUserId();
  if (gate instanceof NextResponse) return gate;
  const { userId, email, name } = gate;
  await ensureProfile(userId, email, name);

  const sb = getSupabaseAdmin()!;
  const activeOnly = url.searchParams.get("active") === "1";

  if (activeOnly) {
    const { data, error } = await sb
      .from("sdc_projects")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ project: data });
  }

  const { data, error } = await sb
    .from("sdc_projects")
    .select("id,name,design_name,vendor,tool,is_active,updated_at,created_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(FREE_MAX_SDC_PROJECTS);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ projects: data || [] });
}

/** POST create/update active SDC project */
export async function POST(req: NextRequest) {
  const gate = await requireUserId();
  if (gate instanceof NextResponse) return gate;
  const { userId, email, name } = gate;
  await ensureProfile(userId, email, name);

  let body: {
    id?: string;
    name?: string;
    designName?: string;
    vendor?: string;
    tool?: string;
    state?: SdcStudioState;
    setActive?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.state || typeof body.state !== "object") {
    return NextResponse.json({ error: "state required" }, { status: 400 });
  }

  const state = normalizeSdcState(body.state);
  const sb = getSupabaseAdmin()!;
  const setActive = body.setActive !== false;
  const now = new Date().toISOString();

  // Update existing
  if (body.id) {
    if (setActive) {
      await sb
        .from("sdc_projects")
        .update({ is_active: false, updated_at: now })
        .eq("user_id", userId)
        .eq("is_active", true)
        .neq("id", body.id);
    }
    const { data, error } = await sb
      .from("sdc_projects")
      .update({
        name: body.name || "Untitled SDC",
        design_name: body.designName || null,
        vendor: body.vendor || null,
        tool: body.tool || null,
        state_json: state,
        is_active: setActive,
        updated_at: now,
      })
      .eq("id", body.id)
      .eq("user_id", userId)
      .select("*")
      .maybeSingle();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ project: data });
  }

  // Cap free projects
  const { count } = await sb
    .from("sdc_projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if ((count || 0) >= FREE_MAX_SDC_PROJECTS) {
    // Reuse most recent active or latest row instead of creating
    const { data: latest } = await sb
      .from("sdc_projects")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.id) {
      if (setActive) {
        await sb
          .from("sdc_projects")
          .update({ is_active: false, updated_at: now })
          .eq("user_id", userId)
          .eq("is_active", true);
      }
      const { data, error } = await sb
        .from("sdc_projects")
        .update({
          name: body.name || "Working SDC",
          design_name: body.designName || null,
          vendor: body.vendor || null,
          tool: body.tool || null,
          state_json: state,
          is_active: setActive,
          updated_at: now,
        })
        .eq("id", latest.id)
        .eq("user_id", userId)
        .select("*")
        .single();
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ project: data, reused: true });
    }
  }

  if (setActive) {
    await sb
      .from("sdc_projects")
      .update({ is_active: false, updated_at: now })
      .eq("user_id", userId)
      .eq("is_active", true);
  }

  const { data, error } = await sb
    .from("sdc_projects")
    .insert({
      user_id: userId,
      name: body.name || "Working SDC",
      design_name: body.designName || null,
      vendor: body.vendor || null,
      tool: body.tool || null,
      state_json: state,
      is_active: setActive,
      updated_at: now,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ project: data });
}
