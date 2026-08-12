import { NextRequest, NextResponse } from "next/server";
import { entitlementsFromApiKey } from "@/lib/entitlements";

// In-memory cloud project session store for multi-device sync
const CLOUD_PROJECTS = new Map<string, { updatedAt: string; data: unknown }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, projectId, projectData } = body;

    const trimmedKey = String(apiKey || "").trim();
    const ent = entitlementsFromApiKey(trimmedKey || null);

    if (!projectId) {
      return NextResponse.json(
        { error: "ProjectId is required for cloud sync" },
        { status: 400 }
      );
    }

    const storageKey = `${ent.email || "guest"}:${projectId}`;
    CLOUD_PROJECTS.set(storageKey, {
      updatedAt: new Date().toISOString(),
      data: projectData,
    });

    return NextResponse.json({
      success: true,
      projectId,
      updatedAt: new Date().toISOString(),
      plan: ent.tier,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.nextUrl.searchParams.get("apiKey")?.trim();
    const projectId = req.nextUrl.searchParams.get("projectId")?.trim();

    if (!projectId) {
      return NextResponse.json(
        { error: "ProjectId is required" },
        { status: 400 }
      );
    }

    const ent = entitlementsFromApiKey(apiKey || null);
    const storageKey = `${ent.email || "guest"}:${projectId}`;
    const record = CLOUD_PROJECTS.get(storageKey);

    if (!record) {
      return NextResponse.json(
        { error: "Project sync record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      projectId,
      updatedAt: record.updatedAt,
      data: record.data,
      plan: ent.tier,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
